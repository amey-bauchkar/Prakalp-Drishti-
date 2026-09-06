"""Apply pending Supabase migrations, in order, idempotently.

WHY THIS EXISTS
---------------
Migrations 0005 (project_geocode) and 0006 (project_milestones, project_imagery_epochs)
were written and committed but never applied, so the KAAL-DARPAN milestone timeline
returned a 503 naming the missing table. There was no runner in the repository, so
"apply the migrations" was a manual step nobody had a command for. This is that command.

SAFETY POSTURE
--------------
  * The connection string is read from DATABASE_URL. Nothing is hardcoded here -- an
    earlier revision of tools/bootstrap_supabase.py embedded a live password in source
    and put it into git history. That must not recur.
  * Dry-run is the DEFAULT. Nothing is written without an explicit --apply.
  * Every migration runs inside its own transaction and is recorded in
    schema_migrations, so re-running is a no-op rather than a re-execution.
  * Files are applied in lexical filename order (0001, 0002, ... 0006).

BASELINING AN ALREADY-MIGRATED DATABASE
---------------------------------------
This ledger did not exist when 0001-0004 were first applied by hand, so on an existing
database every migration looks pending. Re-running them is NOT safe -- 0002 and 0004
contain plain INSERTs that would duplicate rows. Record the already-applied ones as
done, without executing them, then apply the genuine remainder:

    python tools/apply_migrations.py --baseline-through 0004_seed_vocabulary.sql
    python tools/apply_migrations.py --apply

USAGE
-----
    python tools/apply_migrations.py                          # dry run
    python tools/apply_migrations.py --apply                  # apply pending
    python tools/apply_migrations.py --baseline-through FILE  # mark <= FILE as applied
"""

from __future__ import annotations

import os
import sys
import glob
import hashlib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIGRATIONS_DIR = os.path.join(BASE_DIR, "supabase", "migrations")

LEDGER_DDL = """
create table if not exists schema_migrations (
    filename    text primary key,
    sha256      text        not null,
    applied_at  timestamptz not null default now()
);
"""


def _load_env() -> None:
    """Read .env if python-dotenv is present; otherwise rely on backend.config parser."""
    if BASE_DIR not in sys.path:
        sys.path.insert(0, BASE_DIR)
    try:
        import backend.config  # noqa: F401
    except Exception:
        pass


def main() -> int:
    apply = "--apply" in sys.argv
    baseline_through = None
    if "--baseline-through" in sys.argv:
        i = sys.argv.index("--baseline-through")
        if i + 1 >= len(sys.argv):
            print("--baseline-through needs a migration filename", file=sys.stderr)
            return 2
        baseline_through = os.path.basename(sys.argv[i + 1])
    _load_env()

    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url:
        print(
            "DATABASE_URL is not set.\n"
            "Put it in .env (gitignored) or export it, then re-run:\n"
            "  DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres",
            file=sys.stderr,
        )
        return 2

    files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.sql")))
    if not files:
        print(f"No .sql files found in {MIGRATIONS_DIR}", file=sys.stderr)
        return 2

    try:
        import psycopg as pg_driver
    except ImportError:
        try:
            import psycopg2 as pg_driver
        except ImportError:
            print("psycopg is required:  pip install psycopg", file=sys.stderr)
            return 2

    conn = pg_driver.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute(LEDGER_DDL)
        conn.commit()

        with conn.cursor() as cur:
            cur.execute("select filename, sha256 from schema_migrations")
            applied = dict(cur.fetchall())

        pending, drifted = [], []
        for path in files:
            name = os.path.basename(path)
            with open(path, "rb") as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
            if name not in applied:
                pending.append((path, name, digest))
            elif applied[name] != digest:
                drifted.append(name)

        if drifted:
            print("REFUSING TO PROCEED -- already-applied migrations have changed on disk:")
            for n in drifted:
                print(f"  ! {n}")
            print("Editing an applied migration means the database and the repository "
                  "disagree. Write a new migration instead.")
            return 1

        if baseline_through is not None:
            names = [os.path.basename(p) for p in files]
            if baseline_through not in names:
                print(f"No such migration: {baseline_through}", file=sys.stderr)
                print("Known: " + ", ".join(names), file=sys.stderr)
                return 2
            cutoff = names.index(baseline_through)
            marked = 0
            for path, name, digest in pending:
                if names.index(name) > cutoff:
                    continue
                with conn.cursor() as cur:
                    cur.execute(
                        "insert into schema_migrations (filename, sha256) values (%s, %s) "
                        "on conflict (filename) do nothing",
                        (name, digest),
                    )
                marked += 1
                print(f"  [BASELINED] {name}  (recorded as applied, NOT executed)")
            conn.commit()
            print(f"\nBaselined {marked} migration(s) through {baseline_through}.")
            print("Re-run with --apply to execute anything still genuinely pending.")
            return 0

        print(f"{len(applied)} already applied - {len(pending)} pending\n")
        if not pending:
            print("Nothing to do; schema is up to date.")
            return 0

        for _, name, _ in pending:
            print(f"  pending: {name}")

        if not apply:
            print("\nDRY RUN - nothing was written. Re-run with --apply to execute.")
            return 0

        print()
        for path, name, digest in pending:
            with open(path, "r", encoding="utf-8") as fh:
                sql = fh.read()
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cur.execute(
                        "insert into schema_migrations (filename, sha256) values (%s, %s)",
                        (name, digest),
                    )
                conn.commit()
                print(f"  [OK]     {name}")
            except Exception as exc:
                conn.rollback()
                print(f"  [FAILED] {name}: {exc}", file=sys.stderr)
                print("Rolled back. Later migrations were not attempted.", file=sys.stderr)
                return 1

        print(f"\nApplied {len(pending)} migration(s).")
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
