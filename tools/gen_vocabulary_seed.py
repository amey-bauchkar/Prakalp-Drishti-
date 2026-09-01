"""
Regenerate supabase/migrations/0004_seed_vocabulary.sql from the bootstrap corpus.

The seed is GENERATED rather than hand-maintained so the controlled vocabulary cannot
drift from the data it constrains. Every value passes through
corpus_provenance._canonical_value first, so the strings stored in Postgres are
byte-identical to the ones the corpus hash sees -- including the corpus's real
'Construction ' sector, which carries a trailing space that must be stripped or the FK
would reject every project in it.

    python tools/gen_vocabulary_seed.py
"""

from __future__ import annotations

import json
import os
import sys

import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from analytics_engine.corpus_provenance import _canonical_value  # noqa: E402

DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                         "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENTITY_PATH = os.path.join(BASE_DIR, "paimana_extracted",
                           "CANONICAL_ENTITIES_MAPPING.json")
OUT_PATH = os.path.join(BASE_DIR, "supabase", "migrations",
                        "0004_seed_vocabulary.sql")

HEADER = """-- ============================================================================
-- PRAKALP-DRISHTI — 0004: CONTROLLED VOCABULARY SEED
-- ============================================================================
-- GENERATED from the bootstrap corpus, not hand-written. Regenerate with:
--     python tools/gen_vocabulary_seed.py
--
-- Values pass through corpus_provenance._canonical_value first, so the strings stored
-- here are byte-identical to the ones the corpus hash sees. That matters for at least
-- one real row: the corpus contains the sector 'Construction ' WITH A TRAILING SPACE.
-- Seeding the raw string would create a vocabulary entry that the canonicalised project
-- row can never match, and the FK would reject the whole sector on ingest.
--
-- Idempotent: safe to re-run.
-- ============================================================================
"""


def q(s) -> str:
    return "'" + str(s).replace("'", "''") + "'"


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    with open(ENTITY_PATH, encoding="utf-8") as f:
        by_raw = json.load(f)["mapping_by_raw_string"]

    sectors = sorted({_canonical_value(s) for s in df["SectorName"].dropna().unique()})

    ents = {}
    for _raw, rec in by_raw.items():
        cid = str(rec.get("canonical_id", "OTHER_UNSPECIFIED"))
        ents.setdefault(cid, {"name": rec.get("canonical_name", cid),
                              "type": rec.get("entity_type")})

    parts = [HEADER, "insert into sectors (sector_name) values"]
    parts.append(",\n".join(f"    ({q(s)})" for s in sectors)
                 + "\non conflict (sector_name) do nothing;\n")

    parts.append("insert into canonical_entities (canonical_id, canonical_name, entity_type) values")
    parts.append(",\n".join(
        f"    ({q(cid)}, {q(v['name'])}, {q(v['type']) if v['type'] else 'null'})"
        for cid, v in sorted(ents.items())
    ) + "\non conflict (canonical_id) do nothing;\n")

    parts.append("insert into entity_aliases (raw_name, canonical_id) values")
    parts.append(",\n".join(
        f"    ({q(raw)}, {q(rec.get('canonical_id', 'OTHER_UNSPECIFIED'))})"
        for raw, rec in sorted(by_raw.items())
    ) + "\non conflict (raw_name) do nothing;\n")

    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(parts))

    print(f"wrote {OUT_PATH}")
    print(f"  sectors            : {len(sectors)}")
    print(f"  canonical entities : {len(ents)}")
    print(f"  aliases            : {len(by_raw)}")


if __name__ == "__main__":
    main()
