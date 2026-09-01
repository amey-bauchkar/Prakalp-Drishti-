-- ============================================================================
-- PRAKALP-DRISHTI — 0006: MILESTONE LEDGER & IMAGERY EPOCHS
-- ============================================================================
-- Statutory Monthly Progress Reports, and the dated satellite observations they are
-- audited against.
--
-- SEPARATE FROM THE CORPUS, FOR THE SAME REASON AS GEOCODE (0005)
-- ----------------------------------------------------------------
-- A milestone is a time series ABOUT a project, not a corpus column. Putting progress
-- history into SOURCE_COLUMNS would change the Merkle root on every monthly return and
-- invalidate every corpus_version already sealed.
--
-- WHAT IS DELIBERATELY ABSENT FROM THIS SCHEMA
-- --------------------------------------------
-- There is no `satellite_detected_progress_pct` column, and no `discrepancy_pct`.
-- Surface change and reported progress correlate at r = 0.007 in this corpus, so a
-- satellite-derived completion figure cannot be computed honestly, and a
-- claimed-minus-detected score would inherit that noise while looking authoritative.
-- Such a figure existed in this system once and was removed for being 45%-weighted on
-- the very claim it audited.
--
-- What IS stored is `surface_change_pct` on an EPOCH -- the fraction of sampled ground
-- that structurally changed between two dated images. That is an observation. The
-- verdict derived from it lives in analytics_engine/temporal_audit.py and reports
-- evidence, never guilt.
-- ============================================================================

-- ── Milestone ledger ────────────────────────────────────────────────────────
-- Append-only: a contractor revising a past progress claim must leave both versions
-- visible, because the revision is itself the audit signal.

create table if not exists project_milestones (
    milestone_id            bigserial primary key,
    project_id              bigint not null references projects(project_id),

    update_date             date not null,
    claimed_progress_pct    numeric(6,3) check (claimed_progress_pct between 0 and 100),
    cumulative_expenditure_cr numeric(18,6) check (cumulative_expenditure_cr >= 0),

    milestone_type          text not null default 'MONTHLY_PROGRESS'
                            check (milestone_type in (
                                'SANCTION','TENDER_AWARD','SITE_MOBILISATION',
                                'SUBGRADE_COMPLETE','PIERS_CAST','SUPERSTRUCTURE',
                                'MONTHLY_PROGRESS','FINAL_COMMISSIONING')),

    remarks                 text,
    recorded_at             timestamptz not null default now(),
    recorded_by             text,

    -- Tamper-evident, same construction as project_revisions.
    row_hash                text not null check (row_hash  ~ '^[0-9a-f]{64}$'),
    prev_hash               text              check (prev_hash ~ '^[0-9a-f]{64}$')
);

comment on table project_milestones is
    'APPEND-ONLY statutory progress reports. A revised claim is a new row; the earlier '
    'claim remains visible because the revision is itself an audit signal.';

create index if not exists project_milestones_project_idx
    on project_milestones(project_id, update_date);

-- One report per project per date. A second submission for the same day is a revision
-- and must carry its own date, not overwrite the first.
create unique index if not exists project_milestones_unique_day
    on project_milestones(project_id, update_date, milestone_type);

-- ── Imagery epochs ──────────────────────────────────────────────────────────
-- A dated observation that actually exists on disk. Rows are created by the fetch
-- pipeline, never by a progress submission: an officer filing an MPR cannot conjure a
-- satellite pass.

create table if not exists project_imagery_epochs (
    epoch_id            bigserial primary key,
    project_id          bigint not null references projects(project_id),

    -- NULL when the provider publishes no capture date (the ESRI live mosaic). In that
    -- case vintage_label carries the fetch-bounded string and the epoch still orders by
    -- fetched_at.
    captured_on         date,
    vintage_label       text not null,
    wayback_release     integer,
    fetched_at          timestamptz not null default now(),

    tile_path           text,

    -- Structural change measured against this project's PREVIOUS epoch. NULL on the
    -- baseline and NULL whenever the pair could not be measured -- never 0.0, which
    -- would read as "we looked and nothing changed" rather than "we did not measure".
    surface_change_pct  numeric(7,3) check (surface_change_pct between 0 and 100),

    is_baseline         boolean not null default false
);

comment on column project_imagery_epochs.surface_change_pct is
    'Fraction of SAMPLED GROUND that structurally changed since the previous epoch. '
    'NOT a completion estimate: surface change correlates with reported progress at '
    'r=0.007 in this corpus. NULL means unmeasured, never zero.';

create index if not exists project_imagery_epochs_project_idx
    on project_imagery_epochs(project_id, captured_on);

create unique index if not exists project_imagery_epochs_unique
    on project_imagery_epochs(project_id, vintage_label);

-- Exactly one baseline epoch per project.
create unique index if not exists project_imagery_epochs_one_baseline
    on project_imagery_epochs(project_id) where is_baseline;

-- ── Current view ────────────────────────────────────────────────────────────

create or replace view project_milestones_current as
select distinct on (project_id, update_date, milestone_type) *
from project_milestones
order by project_id, update_date, milestone_type, milestone_id desc;

comment on view project_milestones_current is
    'Latest submission per (project, date, type). Superseded claims remain in the base '
    'table and are recoverable.';

-- ── Append-only enforcement, consistent with 0002 and 0005 ──────────────────

revoke update, delete, truncate on project_milestones      from public;
revoke update, delete, truncate on project_imagery_epochs  from public;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        revoke update, delete, truncate on project_milestones     from authenticated;
        revoke update, delete, truncate on project_imagery_epochs from authenticated;
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke insert, update, delete, truncate on project_milestones     from anon;
        revoke insert, update, delete, truncate on project_imagery_epochs from anon;
    end if;
end $$;

drop trigger if exists project_milestones_append_only on project_milestones;
create trigger project_milestones_append_only
    before update or delete on project_milestones
    for each row execute function prakalp_forbid_mutation();

alter table project_milestones      enable row level security;
alter table project_imagery_epochs  enable row level security;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'create policy milestones_read on project_milestones
                 for select to authenticated using (true)';
        execute 'create policy epochs_read on project_imagery_epochs
                 for select to authenticated using (true)';
    end if;
exception when duplicate_object then null;
end $$;
