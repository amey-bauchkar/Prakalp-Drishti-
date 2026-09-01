"""
PRAKALP-DRISHTI: CORPUS PROVENANCE AUDIT (Phase 1)

Proves the two properties the content-addressed `dataset_hash` must have if it is to
survive the migration off a flat CSV onto Postgres.

    INVARIANCE  -- the root must NOT move when only the STORAGE representation changes
                   (row order, column order, dtype width, null spelling, date rendering,
                   sub-precision float jitter).

    SENSITIVITY -- the root MUST move when the DATA changes, by even one cell.

Both directions are tested, and that pairing is the point: an invariance-only suite
would pass for a function that returns a constant, and a sensitivity-only suite would
pass for a hash so brittle that moving from pandas to a SQL driver silently invalidates
every briefing ever signed.

This is what lets Phase 2 (Postgres) land without breaking provenance. When the same
2,207 logical rows are served from a database, `compute_corpus_root` must return
c1c6a779... exactly as it does from the CSV -- otherwise a Cabinet briefing signed
before the migration could not be re-verified after it.

The RFC 6962 guarantees of the shared merkle module are asserted here too, because
corpus identity now depends on them.
"""

import os
import sys

import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from analytics_engine.corpus_provenance import (          # noqa: E402
    compute_corpus_root, canonical_row, build_snapshot, write_snapshot,
    read_snapshot, SOURCE_COLUMNS, CorpusSnapshot,
)
from analytics_engine.merkle import (                     # noqa: E402
    mth_leaf, mth_node, mth, build_tree, verify_inclusion_proof,
)

DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                         "PAIMANA_MASTER_PROJECTS_DATABASE.csv")

_checks = 0
_failures = []


def check(name, ok, detail=""):
    global _checks
    _checks += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    if not ok:
        _failures.append(f"{name}: {detail}")


df = pd.read_csv(DATA_PATH)
BASE_ROOT = compute_corpus_root(df)


# ---------------------------------------------------------------------------------
print("\n--- TEST 1: STORAGE INVARIANCE (root must NOT move) ---")
# ---------------------------------------------------------------------------------

def same(name, other):
    check(name, compute_corpus_root(other) == BASE_ROOT)


check("root is 64-char lowercase hex",
      len(BASE_ROOT) == 64 and all(c in "0123456789abcdef" for c in BASE_ROOT),
      BASE_ROOT[:16])

# Postgres makes no ordering promise without ORDER BY.
same("row order shuffled", df.sample(frac=1.0, random_state=7))
same("index renumbered", df.sample(frac=1.0, random_state=3).reset_index(drop=True))
# A migration that reorders columns is not a change of data.
same("column order reversed", df[list(df.columns)[::-1]])

# pandas types a column int64 or float64 depending on whether a NaN appears ANYWHERE in
# it, so the same project reads 500 from one file and 500.0 from another.
_d = df.copy()
_d["OriginalCost"] = _d["OriginalCost"].astype(float)
same("int64 -> float64 dtype widening", _d)

# SQL NULL, pandas NaN, None and "" are the same fact about the world.
_d = df.copy()
_d["Remarks"] = _d["Remarks"].replace({np.nan: None})
same("NaN -> None", _d)
_d = df.copy()
_d["RevisedCostReason"] = _d["RevisedCostReason"].fillna("")
same("NaN -> empty string", _d)

# A driver that attaches 00:00:00 to a date has not added information.
_a = df.copy()
_a["SanctionDate"] = pd.to_datetime(_a["SanctionDate"], errors="coerce", dayfirst=True)
_b = df.copy()
_b["SanctionDate"] = pd.to_datetime(_b["SanctionDate"], errors="coerce",
                                    dayfirst=True).astype(str)
check("Timestamp vs 'YYYY-MM-DD 00:00:00' string agree",
      compute_corpus_root(_a) == compute_corpus_root(_b))

# float64 <-> NUMERIC round-trip jitter is below the corpus's meaningful precision.
_d = df.copy()
_d["Expenditure"] = _d["Expenditure"].astype(float) + 1e-12
same("float jitter below 6dp", _d)

# ── THE POSTGRES DATE FORM (regression) ──────────────────────────────────────
# MoSPI publishes dates as DD/MM/YYYY TEXT ("13/07/2024"); Postgres returns `date`
# objects that render "2024-07-13". Those hash differently unless normalised, and this
# case was NOT covered when Phase 1 first landed -- the original invariance suite tested
# Timestamp-vs-ISO but never the raw CSV spelling, so the very first real SELECT would
# have produced a different corpus root and broken every prior signature.
_pg = df.copy()
for _c in ("SanctionDate", "StartDate", "OriginalEndDate", "RevisedDate"):
    _pg[_c] = pd.to_datetime(_pg[_c], errors="coerce", dayfirst=True).dt.date
same("FULL Postgres date round-trip (DD/MM/YYYY text -> date)", _pg)

from analytics_engine.corpus_provenance import _canonical_value      # noqa: E402

check("DD/MM/YYYY normalises to ISO-8601",
      _canonical_value("13/07/2024") == "2024-07-13", _canonical_value("13/07/2024"))
check("dates are read DAY-first, not month-first",
      _canonical_value("01/11/2021") == "2021-11-01",
      "month-first would give 2021-01-11 and silently corrupt 12 days a year")
check("an already-ISO date is left alone",
      _canonical_value("2024-07-13") == "2024-07-13")
check("a zero-time timestamp collapses to its date",
      _canonical_value("2024-07-13 00:00:00") == "2024-07-13")
check("a non-date slash string is not mangled into a date",
      _canonical_value("NH-44/Package-3") == "NH-44/Package-3")

# Derived columns are the MODEL's business, not the corpus's.
_d = df.copy()
_d["TrueCostOverrunCr"] = 12345.0
_d["CANONICAL_ENTITY"] = "SOMETHING"
same("added derived columns ignored", _d)


# ---------------------------------------------------------------------------------
print("\n--- TEST 2: SENSITIVITY (root MUST move) ---")
# ---------------------------------------------------------------------------------

def differs(name, other):
    check(name, compute_corpus_root(other) != BASE_ROOT)


_d = df.copy()
_d["OriginalCost"] = _d["OriginalCost"].astype(float)
_d.loc[0, "OriginalCost"] = float(_d.loc[0, "OriginalCost"]) + 0.01
differs("one cost changed by 0.01", _d)

_d = df.copy()
_d.loc[5, "ProjectName"] = str(_d.loc[5, "ProjectName"]) + "X"
differs("one project name changed", _d)

_d = df.copy()
_d.loc[9, "PhysicalProgress"] = float(_d.loc[9, "PhysicalProgress"]) + 1.0
differs("one progress figure changed", _d)

differs("one row dropped", df.drop(df.index[10]))
differs("one row duplicated", pd.concat([df, df.iloc[[0]]], ignore_index=True))

# A null becoming a value is a real change, not a representation change.
_d = df.copy()
_d["Remarks"] = _d["Remarks"].astype(object)
_d.loc[0, "Remarks"] = "materially new remark"
differs("a null replaced by real text", _d)


# ---------------------------------------------------------------------------------
print("\n--- TEST 3: CANONICAL ROW ENCODING ---")
# ---------------------------------------------------------------------------------

row = {c: None for c in SOURCE_COLUMNS}
row["ProjectId"] = 400188
row["OriginalCost"] = 500.0
row["ProjectName"] = "  Test  "

check("integral float renders without decimal point", '"OriginalCost":500' in canonical_row(row))
check("keys are sorted", canonical_row(row).index('"COMPANYNAME"') <
      canonical_row(row).index('"ProjectId"'))
check("strings are stripped", '"ProjectName":"Test"' in canonical_row(row))
check("missing values render as JSON null", '"Remarks":null' in canonical_row(row))

r_int, r_float = dict(row), dict(row)
r_int["OriginalCost"] = 500
r_float["OriginalCost"] = 500.0
check("500 and 500.0 encode identically", canonical_row(r_int) == canonical_row(r_float))

r_nan, r_none = dict(row), dict(row)
r_nan["Expenditure"] = float("nan")
r_none["Expenditure"] = None
check("NaN and None encode identically", canonical_row(r_nan) == canonical_row(r_none))


# ---------------------------------------------------------------------------------
print("\n--- TEST 4: RFC 6962 GUARANTEES (shared merkle module) ---")
# ---------------------------------------------------------------------------------

check("leaf and node hashing occupy different domains",
      mth_leaf("x") != mth_node(mth_leaf("a"), mth_leaf("b")))

# CVE-2012-2459: duplicating the last node of an odd level must not collide.
r3, _ = build_tree(["a", "b", "c"])
r4, _ = build_tree(["a", "b", "c", "c"])
check("CVE-2012-2459 duplicate-node collision is absent", r3 != r4)

# Inclusion proofs must verify for every leaf at every tree size.
all_ok = True
for n in range(1, 34):
    leaves = [f"fact-{i}" for i in range(n)]
    root, proofs = build_tree(leaves)
    for leaf in leaves:
        if not verify_inclusion_proof(leaf, proofs[mth_leaf(leaf)], root):
            all_ok = False
check("every leaf verifies for n = 1..33", all_ok)

root, proofs = build_tree([f"fact-{i}" for i in range(7)])
p = proofs[mth_leaf("fact-3")]
check("tampered leaf is rejected", not verify_inclusion_proof("fact-3-TAMPERED", p, root))
check("malformed proof fails closed, not by raising",
      verify_inclusion_proof("fact-3", [{"hash": "zz", "position": "left"}], root) is False)
check("None sibling fails closed",
      verify_inclusion_proof("fact-3", [{"hash": None, "position": "left"}], root) is False)

check("empty corpus has the RFC 6962 empty root",
      mth([]) == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")


# ---------------------------------------------------------------------------------
print("\n--- TEST 5: SNAPSHOT RECORD & ENGINE WIRING ---")
# ---------------------------------------------------------------------------------

snap = build_snapshot(df, source="csv-bootstrap")
check("snapshot pins the corpus root", snap.corpus_root == BASE_ROOT)
check("snapshot records row count", snap.row_count == len(df), str(snap.row_count))
check("corpus_version is a positive integer",
      isinstance(snap.corpus_version, int) and snap.corpus_version >= 1)
check("algorithm is named in the record",
      "RFC6962" in snap.algorithm, snap.algorithm)
check("snapshot is immutable", isinstance(snap, CorpusSnapshot) and
      getattr(CorpusSnapshot, "__dataclass_params__").frozen)

tmp = os.path.join(BASE_DIR, "artifacts", "corpus_snapshot.test.json")
try:
    write_snapshot(snap, tmp)
    back = read_snapshot(tmp)
    check("snapshot round-trips through disk", back is not None and
          back.corpus_root == snap.corpus_root)
finally:
    if os.path.exists(tmp):
        os.remove(tmp)

check("unreadable snapshot path returns None, not an exception",
      read_snapshot(os.path.join(BASE_DIR, "artifacts", "__does_not_exist__.json")) is None)

# The engine must actually serve the content address, not the old file hash.
from analytics_engine.kaal_chakra import get_kaal_chakra_engine   # noqa: E402

eng = get_kaal_chakra_engine()
check("KAAL-CHAKRA dataset_hash IS the corpus root",
      eng.dataset_hash == BASE_ROOT, eng.dataset_hash[:16])
check("KAAL-CHAKRA exposes corpus_version", eng.corpus_version == 1)

import hashlib                                                    # noqa: E402
with open(DATA_PATH, "rb") as f:
    legacy_file_hash = hashlib.sha256(f.read()).hexdigest()
check("dataset_hash is NO LONGER the raw file hash",
      eng.dataset_hash != legacy_file_hash,
      "content address replaced the file hash")


# ---------------------------------------------------------------------------------
print()
print("=" * 78)
if _failures:
    print(f"CORPUS PROVENANCE AUDIT FAILED: {len(_failures)} of {_checks} checks")
    for f in _failures:
        print(f"  - {f}")
    print("=" * 78)
    sys.exit(1)

print(f"ASSERTIONS PASSED: {_checks} provenance and RFC 6962 checks, 0 failures.")
print(f"  corpus_root = {BASE_ROOT}")
print("=" * 78)
