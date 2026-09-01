import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import urllib.parse
import psycopg2
import pandas as pd
from analytics_engine.corpus_provenance import (
    SOURCE_COLUMNS, COLUMN_MAP, row_hash, compute_corpus_root, _canonical_value
)

def main():
    pwd = urllib.parse.quote_plus('Tripspahilaamey@1305')
    db_url = f'postgresql://postgres.azcimafzkniyygwyaone:{pwd}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'

    csv_path = 'paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv'
    df = pd.read_csv(csv_path)
    print(f'Read CSV: {len(df)} rows')
    root = compute_corpus_root(df)
    print(f'Computed Merkle Root: {root}')

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute('select count(*) from projects')
    cnt = cur.fetchone()[0]
    print(f'Current projects count in DB: {cnt}')

    if cnt == 0:
        print('Seeding 2207 projects into Supabase...')
        
        # 1. Projects identity
        p_rows = [(int(row['ProjectId']), 'system_bootstrap') for _, row in df.iterrows()]
        cur.executemany('insert into projects (project_id, onboarded_by) values (%s, %s) on conflict do nothing', p_rows)
        print('Inserted projects identity rows.')
        
        # 2. Project revisions
        cols = ['project_id'] + [COLUMN_MAP[c] for c in SOURCE_COLUMNS if c != 'ProjectId'] + ['row_hash', 'prev_hash', 'ingest_source', 'recorded_by']
        quoted = ', '.join(f'"{c}"' for c in cols)
        placeholders = ', '.join(['%s'] * len(cols))
        sql = f'insert into project_revisions ({quoted}) values ({placeholders})'
        
        rev_rows = []
        for _, row in df.iterrows():
            rec = row.to_dict()
            rh = row_hash(rec)
            vals = [int(rec['ProjectId'])]
            for c in SOURCE_COLUMNS:
                if c == 'ProjectId':
                    continue
                v = _canonical_value(rec.get(c))
                vals.append(v)
            vals.extend([rh, None, 'csv-bootstrap', 'system_bootstrap'])
            rev_rows.append(tuple(vals))
        
        cur.executemany(sql, rev_rows)
        print(f'Inserted {len(rev_rows)} revisions.')
        
        # 3. Seal corpus
        cur.execute(
            'select prakalp_seal_corpus(%s, %s, %s, %s, %s)',
            (root, len(df), len(SOURCE_COLUMNS), 'postgres', 'system_bootstrap')
        )
        v = cur.fetchone()[0]
        conn.commit()
        print(f'Successfully sealed corpus_version: {v}')
    else:
        print('Projects table already seeded.')

    cur.close()
    conn.close()
    print('Bootstrap completed successfully!')

if __name__ == '__main__':
    main()
