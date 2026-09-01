-- ============================================================================
-- PRAKALP-DRISHTI — 0005: PROJECT GEOCODE & STATE PROVENANCE
-- ============================================================================
-- WHY THIS IS A SEPARATE TABLE AND NOT NEW COLUMNS ON project_revisions
-- ---------------------------------------------------------------------
-- The corpus Merkle root is computed over corpus_provenance.SOURCE_COLUMNS. Adding
-- Latitude/Longitude there would change every leaf, change the root, and therefore
-- INVALIDATE corpus_version 1 and 2 which are already sealed -- any briefing signed
-- against them would stop verifying.
--
-- Geocode is not corpus content. It is enrichment ABOUT a project, which is exactly why
-- it already lives outside the CSV in ALL_2207_PROJECTS_GEOREFERENCED.json. That
-- boundary is kept: the corpus hash stays stable, and geometry versions independently.
--
-- THE STATUTORY HAZARD THIS TABLE EXISTS TO CONTAIN
-- -------------------------------------------------
-- analytics_engine/state_resolution.is_reported_state() returns TRUE for any non-empty
-- string, and that predicate gates the statutory 10% North-Eastern Region capital
-- floor in VITTA-VYUHA. The codebase already, deliberately, excludes INFERRED states
-- from that constraint: satisfying a legal funding floor on a nearest-populated-place
-- guess would not survive audit.
--
-- An operator typing a State into the onboarding form is a THIRD category, and without
-- this distinction it would be indistinguishable from ministry-reported geography. An
-- officer could move public capital by typing "Assam". So state_source is explicit and
-- constrained, and only 'ministry_reported' may ever enter the NER floor basis.
-- Display may use all three; the constraint may not.
-- ============================================================================

-- ── Geocode precision vocabulary ────────────────────────────────────────────
-- Mirrors GEOCODE_CLASS in analytics_engine/eo_viewport.py. serve_imagery FALSE means
-- no EO frame at any zoom: a state or national centroid locates an administrative
-- unit, not a project, and no amount of zooming out turns it into a site.

create table if not exists geocode_classes (
    class_name      text primary key,
    error_radius_m  integer not null check (error_radius_m > 0),
    tier            text    not null,
    serve_imagery   boolean not null
);

insert into geocode_classes (class_name, error_radius_m, tier, serve_imagery) values
    ('GEONAMES_EXACT_MATCH',         120,    'surveyed',   true),
    ('GEONAMES_EXACT_UNCONSTRAINED', 250,    'surveyed',   true),
    ('OSM_LANDMARK_MATCH',           600,    'landmark',   true),
    ('OSM_CORRIDOR_MIDPOINT',        1500,   'corridor',   true),
    ('GAZETTEER_CITY_MATCH',         4000,   'settlement', true),
    ('GEONAMES_TOKEN_MATCH',         8000,   'weak',       true),
    ('REGIONAL_COALFIELD_CENTROID',  15000,  'regional',   true),
    ('OPERATOR_SUPPLIED_EXACT',      150,    'surveyed',   true),
    ('STATE_CENTROID_MATCH',         200000, 'unusable',   false),
    ('NATIONAL_CENTROID_MATCH',      800000, 'unusable',   false)
on conflict (class_name) do nothing;

comment on table geocode_classes is
    'Geocode precision tiers. serve_imagery=false means the coordinate locates an '
    'administrative unit, not a site, and must never back an EO frame.';

-- ── Append-only geocode ledger ──────────────────────────────────────────────
-- Corrections are recorded as new rows, never edits, so a map pin that moved can be
-- explained. Same discipline as project_revisions.

create table if not exists project_geocode (
    geocode_id      bigserial primary key,
    project_id      bigint  not null references projects(project_id),

    latitude        numeric(9,6) check (latitude  between -90  and 90),
    longitude       numeric(9,6) check (longitude between -180 and 180),

    geocode_class   text not null references geocode_classes(class_name),

    -- Denormalised from geocode_classes at write time so a historical row keeps the
    -- radius it was actually served with, even if the class is later re-tuned.
    error_radius_m  integer not null check (error_radius_m > 0),

    -- ── the statutory field ─────────────────────────────────────────────────
    state_name      text,
    state_source    text not null default 'operator_entered'
                    check (state_source in ('ministry_reported',
                                            'operator_entered',
                                            'inferred')),

    recorded_at     timestamptz not null default now(),
    recorded_by     text,
    source_note     text
);

comment on column project_geocode.state_source is
    'ONLY ministry_reported may enter the statutory NER floor basis. operator_entered '
    'and inferred are display-only. See is_reported_state() and VITTA-VYUHA.';

create index if not exists project_geocode_project_idx
    on project_geocode(project_id, geocode_id desc);

-- A coordinate is either fully present or fully absent; half a coordinate is not a
-- location and would silently place a pin on the equator or the prime meridian.
alter table project_geocode drop constraint if exists project_geocode_latlon_paired;
alter table project_geocode add constraint project_geocode_latlon_paired
    check ((latitude is null) = (longitude is null));

-- ── Current geocode, derived ────────────────────────────────────────────────

create or replace view project_geocode_current as
select distinct on (project_id) *
from project_geocode
order by project_id, geocode_id desc;

comment on view project_geocode_current is
    'Latest geocode per project. Read-only by construction.';

-- ── The NER floor basis, made explicit in SQL ───────────────────────────────
-- A view rather than a comment, so the rule is queryable and a reviewer can see
-- exactly which projects the statutory floor is allowed to bind on.

create or replace view ner_floor_eligible_geography as
select project_id, state_name
from project_geocode_current
where state_source = 'ministry_reported'
  and state_name is not null;

comment on view ner_floor_eligible_geography is
    'The ONLY geography the 10% NER capital floor may bind on. Operator-entered and '
    'inferred states are deliberately excluded: a legal funding floor satisfied on a '
    'typed or guessed state would not survive audit.';

-- ── Append-only enforcement, consistent with 0002 ───────────────────────────

revoke update, delete, truncate on project_geocode from public;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        revoke update, delete, truncate on project_geocode from authenticated;
    end if;
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke insert, update, delete, truncate on project_geocode from anon;
    end if;
end $$;

drop trigger if exists project_geocode_append_only on project_geocode;
create trigger project_geocode_append_only
    before update or delete on project_geocode
    for each row execute function prakalp_forbid_mutation();

alter table project_geocode  enable row level security;
alter table geocode_classes  enable row level security;

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'create policy geocode_read on project_geocode
                 for select to authenticated using (true)';
        execute 'create policy geocode_classes_read on geocode_classes
                 for select to authenticated using (true)';
    end if;
exception when duplicate_object then null;
end $$;
