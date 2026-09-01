-- ============================================================================
-- PRAKALP-DRISHTI — 0003: ROW LEVEL SECURITY (DEFENCE IN DEPTH)
-- ============================================================================
-- SCOPE, STATED PLAINLY: RLS here is a SECOND fence, not the fence.
--
-- Authorization is enforced at the FastAPI dependency layer (backend/auth.py), which is
-- where it is already tested and where the append-only access log is written. Moving the
-- decision into RLS would create two authorities that can disagree, and the one that
-- disagrees silently is the one that leaks. Two specific reasons it cannot be the
-- primary control here:
--
--   * `service_role` bypasses RLS entirely. The backend connects as a privileged role
--     to build snapshots, so RLS would be inert on exactly the path that reads
--     everything.
--
--   * Satellite imagery is served from disk by DRISHTI-EO, not from Postgres. RLS
--     cannot express the national-security redaction policy that governs it, so the
--     redaction authority must remain in the engine.
--
-- What RLS buys is containment if a low-privilege key ever reaches a client: an `anon`
-- key alone must not be able to read project detail or write anything at all.
--
-- Role vocabulary is deliberately NOT replaced here. The live capability model
-- (analyst / monitoring_officer / ministry_officer / administrator) stays authoritative;
-- these policies map onto it rather than inventing a competing taxonomy.
-- ============================================================================

alter table projects               enable row level security;
alter table project_revisions      enable row level security;
alter table corpus_snapshots       enable row level security;
alter table sectors                enable row level security;
alter table canonical_entities     enable row level security;
alter table entity_aliases         enable row level security;
alter table entity_resolution_queue enable row level security;

-- ── Reference vocabularies: readable by any authenticated session ───────────
-- These carry no project-identifying information; they are the controlled vocabularies
-- a client needs to render a form correctly.

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'create policy sectors_read on sectors
                 for select to authenticated using (true)';
        execute 'create policy entities_read on canonical_entities
                 for select to authenticated using (true)';
        execute 'create policy aliases_read on entity_aliases
                 for select to authenticated using (true)';
    end if;
exception when duplicate_object then null;
end $$;

-- ── Corpus snapshots: public provenance ─────────────────────────────────────
-- A snapshot row is a root hash, a row count and a timestamp. Publishing it is the
-- point -- an auditor, or a citizen, must be able to check that the briefing they hold
-- names a version that actually exists. It reveals nothing about any single project.

do $$
begin
    execute 'create policy snapshots_public_read on corpus_snapshots
             for select using (true)';
exception when duplicate_object then null;
end $$;

-- ── Project data: authenticated read, no client write ───────────────────────
-- Writes arrive exclusively through the backend, which enforces role permissions and
-- writes the access log. No policy grants INSERT to a client role, so a leaked `anon`
-- or `authenticated` key cannot append to the audit ledger.

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'create policy projects_read on projects
                 for select to authenticated using (true)';
        execute 'create policy revisions_read on project_revisions
                 for select to authenticated using (true)';
    end if;
exception when duplicate_object then null;
end $$;

-- ── anon: nothing beyond public provenance ──────────────────────────────────
-- The citizen tier is served through the backend's /nagrik surface, which applies
-- redaction and aggregation. It does not get direct table access, because RLS cannot
-- express the redaction policy that tier depends on.

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke all on projects, project_revisions, entity_resolution_queue from anon;
    end if;
end $$;

-- ── Resolution queue: staff only ────────────────────────────────────────────
-- Unresolved raw entity names can expose an agency's internal naming before an
-- onboarding is accepted, so this is not a client-readable table.

do $$
begin
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute 'create policy queue_no_client_access on entity_resolution_queue
                 for select to authenticated using (false)';
    end if;
exception when duplicate_object then null;
end $$;
