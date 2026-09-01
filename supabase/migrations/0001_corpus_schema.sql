-- ============================================================================
-- PRAKALP-DRISHTI — 0001: CORPUS SCHEMA
-- ============================================================================
-- The append-only system of record for 2,207 MoSPI Central Sector projects.
--
-- DESIGN CONTRACT WITH analytics_engine/corpus_provenance.py
-- ----------------------------------------------------------
-- `project_revisions` must be able to reproduce, for every row, the byte-identical
-- canonical JSON that the CSV bootstrap produces. If it cannot, the corpus Merkle root
-- computed from Postgres will differ from the root computed from the CSV, and every
-- Cabinet briefing signed before the migration stops verifying after it.
--
-- Two consequences are load-bearing:
--
--   1. DATES ARE `date`, NOT `timestamptz`. The corpus records days. A timestamp would
--      attach a zero time and, worse, a timezone that shifts the day across the IST
--      boundary -- silently changing the hash of a project nobody edited.
--
--   2. MONEY AND RATIOS ARE `numeric`, NOT `double precision`. Binary floats do not
--      round-trip decimal values exactly; numeric does. The canonicaliser pins six
--      decimal places, and numeric(18,6) matches that exactly rather than approximately.
--
-- Column names are snake_case (idiomatic Postgres, and PostgREST exposes them directly
-- in the REST API). The mapping to the CamelCase corpus columns is declared ONCE in
-- corpus_provenance.COLUMN_MAP and asserted against this file by
-- tests/test_corpus_schema.py, so the two cannot drift apart unnoticed.
--
-- NOTE ON ALL-NULL COLUMNS: agency_name, remarks, revised_cost_reason,
-- revised_date_reason, start_date, cor_perc and tor_perc are 0/2207 populated in the
-- bootstrap corpus. pandas types them float64 purely because they are empty; that is an
-- artefact of emptiness, not a semantic type. They are declared here with their real
-- types so that ingestion can populate them correctly.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Controlled vocabularies ─────────────────────────────────────────────────
-- Free-text sector strings are how the previous hand-set multiplier table silently
-- stopped matching the corpus: nine of its eleven keys existed nowhere in the data, so
-- 32% of the portfolio fell through to a default. An FK makes that class of defect
-- impossible to introduce by typing.

create table if not exists sectors (
    sector_name   text primary key,
    dea_group     text,
    created_at    timestamptz not null default now()
);

comment on table sectors is
    'Controlled vocabulary. A project may not name a sector that is not listed here.';

create table if not exists canonical_entities (
    canonical_id    text primary key,
    canonical_name  text not null,
    entity_type     text,
    created_at      timestamptz not null default now()
);

-- 225 raw COMPANYNAME strings collapse to 108 canonical executing entities. Onboarding
-- resolves through this table; an unresolved alias is queued, never silently defaulted.
create table if not exists entity_aliases (
    raw_name      text primary key,
    canonical_id  text not null references canonical_entities(canonical_id),
    created_at    timestamptz not null default now()
);

create index if not exists entity_aliases_canonical_idx
    on entity_aliases(canonical_id);

-- ── Corpus snapshots: immutable accepted states ─────────────────────────────
-- A briefing pins the corpus_version it was computed against, so an auditor replays
-- exactly that state rather than "whatever is current".

create table if not exists corpus_snapshots (
    corpus_version  bigserial primary key,
    corpus_root     text not null
                    check (corpus_root ~ '^[0-9a-f]{64}$'),
    row_count       integer not null check (row_count >= 0),
    column_count    integer not null check (column_count >= 0),
    source          text    not null,
    algorithm       text    not null
                    default 'RFC6962-SHA256/canonical-json-rows',
    sealed_at       timestamptz not null default now(),
    sealed_by       text
);

comment on table corpus_snapshots is
    'Append-only. Each row is a sealed, content-addressed state of the whole corpus.';

-- ── Project identity ────────────────────────────────────────────────────────
-- Identity only. Every mutable attribute lives in project_revisions, so "the current
-- state" is a derived view over the ledger rather than a row anyone can UPDATE.

create table if not exists projects (
    project_id    bigint primary key,
    onboarded_at  timestamptz not null default now(),
    onboarded_by  text
);

-- ── The append-only revision ledger ─────────────────────────────────────────

create table if not exists project_revisions (
    revision_id          bigserial primary key,
    project_id           bigint  not null references projects(project_id),

    -- Sealed into a snapshot after the batch is accepted; null while a batch is open.
    corpus_version       bigint  references corpus_snapshots(corpus_version),

    -- ── the 25 corpus SOURCE columns ────────────────────────────────────────
    project_name         text,
    sector_name          text    references sectors(sector_name),
    state_name           text,
    line_ministry        text,
    companyname          text,
    agency_id            bigint,
    agency_name          text,

    original_cost        numeric(18,6),
    revised_cost         numeric(18,6),
    revised_cost_reason  text,
    expenditure          numeric(18,6),

    sanction_date        date,
    start_date           date,
    original_end_date    date,
    revised_date         date,
    revised_date_reason  text,

    delayed_time         numeric(18,6),
    cost_overrun         numeric(18,6),
    cost_overrun_perc    numeric(18,6),
    cor_perc             numeric(18,6),
    tor_perc             numeric(18,6),
    physical_progress    numeric(18,6),
    onboarding_delay     numeric(18,6),
    remarks              text,

    -- ── tamper-evident chain ────────────────────────────────────────────────
    -- row_hash  = RFC 6962 leaf hash of this row's canonical JSON
    -- prev_hash = row_hash of this project's previous revision (null at genesis)
    --
    -- REVOKE and the trigger in 0002 PREVENT mutation; the chain makes mutation
    -- DETECTABLE even by an actor who can disable them. Prevention is a permission and
    -- can be granted away. Detection is a proof and cannot.
    row_hash             text not null check (row_hash  ~ '^[0-9a-f]{64}$'),
    prev_hash            text              check (prev_hash ~ '^[0-9a-f]{64}$'),

    recorded_at          timestamptz not null default now(),
    recorded_by          text,
    ingest_source        text not null default 'api'
                         check (ingest_source in ('csv-bootstrap','api','cuf-upload'))
);

comment on table project_revisions is
    'APPEND-ONLY. UPDATE and DELETE are revoked and trigger-blocked (see 0002). '
    'Corrections are recorded as new revisions, never as edits.';

-- One genesis revision per project, and no two revisions claiming the same predecessor
-- (which is how a chain gets forked).
create unique index if not exists project_revisions_genesis_idx
    on project_revisions(project_id) where prev_hash is null;

create unique index if not exists project_revisions_chain_idx
    on project_revisions(project_id, prev_hash) where prev_hash is not null;

create index if not exists project_revisions_project_idx
    on project_revisions(project_id, revision_id desc);

create index if not exists project_revisions_version_idx
    on project_revisions(corpus_version);

-- ── Current state, derived ──────────────────────────────────────────────────
-- The latest revision per project. This is what the snapshot builder reads; it is a
-- view precisely so that nothing can UPDATE "the current row".

create or replace view project_current as
select distinct on (project_id) *
from project_revisions
order by project_id, revision_id desc;

comment on view project_current is
    'Latest revision per project. Read-only by construction -- there is no base row to edit.';

-- ── Unresolved entity queue ─────────────────────────────────────────────────
-- A COMPANYNAME arriving without a canonical mapping is parked here for a human, NOT
-- defaulted to OTHER_UNSPECIFIED. Silently defaulting is exactly how the executing-entity
-- multiplier stopped applying to a third of the portfolio.

create table if not exists entity_resolution_queue (
    id            bigserial primary key,
    raw_name      text not null,
    first_seen_at timestamptz not null default now(),
    occurrences   integer not null default 1,
    resolved      boolean not null default false,
    resolved_to   text references canonical_entities(canonical_id)
);

create unique index if not exists entity_resolution_queue_raw_idx
    on entity_resolution_queue(raw_name);
