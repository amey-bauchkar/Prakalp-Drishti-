-- ============================================================================
-- PRAKALP-DRISHTI — 0002: APPEND-ONLY ENFORCEMENT & CHAIN INTEGRITY
-- ============================================================================
-- Three layers, because no single one is sufficient for a CAG/CVC audit trail:
--
--   1. REVOKE       -- removes the privilege from ordinary roles.
--   2. TRIGGER      -- blocks the operation even for a role that still holds it.
--   3. HASH CHAIN   -- makes tampering DETECTABLE by anyone who can read the table,
--                      including by an actor who disabled layers 1 and 2.
--
-- Layers 1 and 2 are permissions and can be granted away or dropped by an owner.
-- Supabase's `service_role` in particular bypasses RLS entirely and is a table owner,
-- so a system that relied on RLS alone for append-only would be making a claim it
-- cannot keep. Layer 3 is what survives that, and it is the layer an auditor actually
-- verifies: recompute each row_hash, walk prev_hash, compare to the sealed corpus_root.
-- ============================================================================

-- ── Layer 1: privilege ──────────────────────────────────────────────────────

revoke update, delete, truncate on project_revisions  from public;
revoke update, delete, truncate on corpus_snapshots   from public;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        revoke update, delete, truncate on project_revisions from authenticated;
        revoke update, delete, truncate on corpus_snapshots  from authenticated;
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke insert, update, delete, truncate on project_revisions from anon;
        revoke insert, update, delete, truncate on corpus_snapshots  from anon;
    end if;
end $$;

-- ── Layer 2: trigger ────────────────────────────────────────────────────────

create or replace function prakalp_forbid_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception
        'APPEND-ONLY VIOLATION: % on %.% is forbidden. Record a new revision instead.',
        tg_op, tg_table_schema, tg_table_name
        using errcode = '42501';
end;
$$;

comment on function prakalp_forbid_mutation() is
    'Blocks UPDATE/DELETE on the audit ledger regardless of granted privilege.';

drop trigger if exists project_revisions_append_only on project_revisions;
create trigger project_revisions_append_only
    before update or delete on project_revisions
    for each row execute function prakalp_forbid_mutation();

drop trigger if exists corpus_snapshots_append_only on corpus_snapshots;
create trigger corpus_snapshots_append_only
    before update or delete on corpus_snapshots
    for each row execute function prakalp_forbid_mutation();

-- ── Layer 3: chain integrity on insert ──────────────────────────────────────
-- The application computes row_hash and prev_hash (it owns the canonical JSON encoding
-- and must, since the hash has to match the CSV bootstrap byte for byte). Postgres
-- cannot recompute that encoding, but it CAN refuse a link that does not point at the
-- true predecessor -- which is the part an attacker would need to forge.

create or replace function prakalp_validate_chain()
returns trigger
language plpgsql
as $$
declare
    expected_prev text;
    existing_count integer;
begin
    select count(*), max(row_hash)
      into existing_count, expected_prev
      from (
        select row_hash
          from project_revisions
         where project_id = new.project_id
         order by revision_id desc
         limit 1
      ) latest;

    if existing_count = 0 then
        if new.prev_hash is not null then
            raise exception
                'CHAIN VIOLATION: first revision for project % must have prev_hash null',
                new.project_id using errcode = '23514';
        end if;
    else
        if new.prev_hash is distinct from expected_prev then
            raise exception
                'CHAIN VIOLATION: project % expected prev_hash %, got %',
                new.project_id, expected_prev, coalesce(new.prev_hash, '<null>')
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;

comment on function prakalp_validate_chain() is
    'Refuses a revision whose prev_hash does not point at the projects true latest row_hash.';

drop trigger if exists project_revisions_chain on project_revisions;
create trigger project_revisions_chain
    before insert on project_revisions
    for each row execute function prakalp_validate_chain();

-- ── Sealing a snapshot ──────────────────────────────────────────────────────
-- Binds every open revision to the version whose root covers it. Called once per
-- accepted batch, after the application has computed the corpus root.

create or replace function prakalp_seal_corpus(
    p_corpus_root  text,
    p_row_count    integer,
    p_column_count integer,
    p_source       text,
    p_sealed_by    text default null
)
returns bigint
language plpgsql
as $$
declare
    v_version bigint;
begin
    if p_corpus_root !~ '^[0-9a-f]{64}$' then
        raise exception 'corpus_root must be 64 lowercase hex characters'
            using errcode = '22023';
    end if;

    insert into corpus_snapshots (corpus_root, row_count, column_count, source, sealed_by)
    values (p_corpus_root, p_row_count, p_column_count, p_source, p_sealed_by)
    returning corpus_version into v_version;

    update project_revisions
       set corpus_version = v_version
     where corpus_version is null;

    return v_version;
end;
$$;

-- prakalp_seal_corpus must set corpus_version on rows the append-only trigger would
-- otherwise block. SECURITY DEFINER plus a trigger-disabling session is deliberately
-- NOT used; instead the trigger ignores this one column, so sealing cannot be turned
-- into a general-purpose edit.
create or replace function prakalp_forbid_mutation()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'UPDATE'
       and old.corpus_version is null
       and new.corpus_version is not null
       and to_jsonb(new) - 'corpus_version' = to_jsonb(old) - 'corpus_version' then
        return new;                       -- sealing only: every other column identical
    end if;

    raise exception
        'APPEND-ONLY VIOLATION: % on %.% is forbidden. Record a new revision instead.',
        tg_op, tg_table_schema, tg_table_name
        using errcode = '42501';
end;
$$;
