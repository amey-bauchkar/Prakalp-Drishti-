# Pictorial redesign plan — same argument, a deck nobody looks away from

*17 September 2026. Plan only; nothing built. Reference: the Lanezy / 404 The Optimistics deck (SIH 2025 finalist, verified on the official shortlist). Content stays exactly as locked in `SIH26103_ULTIMATE_DECK.md`; what changes is the visual language.*

---

## 1. What makes the reference deck hold the eye (and what we take from it)

| Mechanic in the Lanezy deck | Why it works | We take it as |
|---|---|---|
| **One hero graphic per slide** — pyramid (p2), illustrated flows (p3), three-column icon cards (p4), before/after bar chart (p5), hexagon strip + UI gallery (p6) | The eye lands on a shape, not a paragraph | Yes — one hero per slide, ours are the fan chart, the pipeline, the deployment map, the measured before/after chart, the reference hexagons |
| **Everything is a card** — rounded panels with a tinted fill, an icon in a coloured circle, a bold 2–4-word label, one sentence | Reads at a glance; no walls of text | Yes — every pointer heading becomes a card group |
| **Colour coding carries meaning** — red "Risk" vs green "Solution"; blue tech; amber safety | Judge decodes structure without reading | Yes — red = PAIMANA today / limit, teal = what we add / measured, amber = "pilot will measure", grey = baseline |
| **Real artefacts, not clip-art** — breadboard photos, four UI screenshots with bounding boxes, a real dashboard gallery | Proves the thing exists | Yes, and more of it: prototype stills, real before/after satellite tiles of PAIMANA projects from our own pipeline, the live fan for 617185 |
| **Prototype cloud with Video/Website/Report/GitHub links** on slides 2 and 3 | Evidence up front | Yes — Live · Code (and Video only if recorded) |
| **Light skyline / road strip along the bottom** and a bold two-tone headline | Gives every slide the same "world" | Yes — a restrained infrastructure silhouette (transmission towers, a viaduct, a rail line) drawn as vector, not a stock photo |
| **Big numbers as badges** ("₹60,000+ crores", "150,000 lives") | Memorable | Yes — ours are 1,988 of 2,103 · 0.22 · 79% · −12% |

**What we deliberately do not copy:** the unsourced "30–40%" impact chart (ours is measured, with n); the fifteen-feature pyramid (we show four outputs); stock cars/cows/buses (we use real project imagery and real screens); the wall of technology logos (four technology cards, no more).

## 2. Visual language

**Palette (six colours, used by meaning):**
- Navy ground for headers and hero panels `#0F2A44`; light card fill `#F3F6FA`; white slide.
- Teal `#1F5F73` = ours / measured / "adds". Red `#C0392B` = today's limit / risk. Green `#2E8B57` = mitigation / resolved. Amber `#E0A100` = "pilot will measure" / open question. Grey `#8A97A4` = baselines.

**Type:** the template's serif title stays (the rule). Slide sub-headline in a heavy sans (Segoe UI Black / Calibri Bold, 22–24 pt, two-tone like "TECHNICAL **APPROACH**"); card labels 13–14 pt bold; body 11 pt; badges 26–32 pt. Floor stays 11 pt.

**Card system:** rounded rectangle, 1-pt border in the meaning colour, 6 % tint fill, icon in a solid coloured circle (0.45 in) at top-left, label + one line. Three columns or a 2×2 grid per pointer.

**Icons:** flat, single-colour, from `react-icons` rendered to PNG (Font Awesome / Material / Lucide sets), or Windows' Segoe Fluent Icons rendered with PIL if we stay offline. Never emoji, never clip-art.

**Imagery policy:** only things that exist — prototype stills (dated), our own before/after satellite tiles of real PAIMANA projects (labelled "ESRI basemap, 2.08–2.35 m/px measured"), the fan for 617185 from the engine, a vector skyline. No AI-generated scenes, no stock photos.

**Motif:** a thin "timeline road" — the fan's time axis — reappears as the divider element on slides 3–5 (the same visual object that carried the argument on slide 2).

## 3. Slide-by-slide pictorial concept (copy unchanged from the locked spec)

### Slide 1 — Title page
Template fields as required. Below them, a full-width band with one real before/after satellite pair of a PAIMANA project (T0 | T1) as a quiet visual signature, captioned honestly, and the idea-title line in teal. Team oval per template.

### Slide 2 — Idea title (the hero slide)
Layout mirrors the reference's three-band structure but with our evidence in the centre:
- **Left column (red → amber → green cards, icons in circles):** *Real-world issue* — "PAIMANA records every slip after it happens; 1,988 of 2,103 projects still running" · *Why it matters* — "1,981 ongoing · ₹42.78 lakh crore; no one can say which project slips next" · *Solution* — "a calibrated early-warning annex to the monthly report".
- **Centre hero — the fan as an illustrated road:** the time axis drawn as a road; three signposts (sanctioned / original / revised) in red; the calibrated band as a shaded lane ahead in teal with the P50 marker as a milestone post; a large badge **"22% chance of meeting Sep 2027"**; a small "why" plate under it (25% built in 15 months vs a 24-month plan; sector has few completions). Project name and "617185 · POWERGRID · ₹5,550 Cr · not yet overdue" as the road's name-board.
- **Right column — "Today vs What we add" three rows** (reference's Risk-vs-Solution device, red ↔ teal): Promised dates → Calibrated window · Assumed AI → Measured vs OLS · Unranked list → Reason per rank. Below: three PS chips **(a) (b) (c)** with one measured phrase each, and the **"Outcomes a b c d e g h i · f partial"** strip.
- **Bottom-left prototype cloud:** Live · Code.
- Pointer headings kept verbatim as small card-group titles ("Detailed explanation…", "How it addresses…", "Innovation and uniqueness…").

### Slide 3 — Technical approach
- **Left: the pipeline as an illustrated conveyor** — six icon stations on the timeline-road motif: database (register) → shield/filter (leakage guard, with the 12 column names on a small tag) → calendar split (train ≤ 2020 / test 2020–21) → two "machines" side by side (survival curve icon = TIME, bar icon = COST) each with its badge **79.0%** / **−12%** and the small OLS bar beside ours → ranked list icon (queue) → officer avatar (outputs). Arrow labels kept.
- **Centre-right: prototype gallery** — three real stills (queue, project 617185, breakdown) in device frames with captions and dates, like the reference's "System IoT" photo panel.
- **Right: four technology cards** (Python · scikit-learn/scipy; FastAPI + PostgreSQL; React; Docker on one NIC Cloud VM) with icons — four, not forty; the LLM line as a footnote card "optional, local in pilot".
- Bottom strip: Validation · Reproducibility · Honest ceiling as three small tinted plates.

### Slide 4 — Feasibility and viability
- **Three columns like the reference (feasibility / risks / deployment)** with icon rows: *Built* (20 screens, ~93 endpoints, 152 checks, Docker) · *Remaining* · *Pilot* (one ministry, one quarter, IPMD owner) · *Runs on* (one NIC Cloud VM, SSRS-readable tables, roles server-side).
- **Risks as red-to-green flip cards:** four rows, red left cell (the limit) → green right cell (the mitigation), numbered circles.
- **Deployment map as a picture:** PAIMANA drawn as a building block (NIC Cloud · MS SQL · SSRS) → our annex as a single teal container → the monthly report and the officer; dashed "Needed from MoSPI" plate; the NIC "AI-driven forecasting" quote in a speech-mark card.
- Bottom: the **"What we refuse to claim"** line as a stamp-style badge (red outline) — memorable, honest.

### Slide 5 — Impact and benefits
- **Hero: the measured before/after chart** (the reference's most persuasive element — ours has n on every bar): three grouped bars, grey "today" vs teal "annex", nominal-85 dashed line, OLS marker.
- **Numbered impact wheel** (reference's ring device, halved): IPMD officers · PMG cells · DIID statisticians with icons.
- **"From 1,981 rows to a ranked queue"** pictorial strip — three real stills with arrows (report → queue → escalation note), replacing the reference's gridlock-to-green-light photo pair.
- Benefits as four small cards: Governance · Economic ("no saving is claimed") · **Pilot will measure** (amber) · Social/Environmental ("no claim").

### Slide 6 — Research and references
- **Hexagon strip** (reference device) — seven hexagons: Ram Singh 2010 · Morris 1990 · Flyvbjerg 2006 · Wei 1992 · Romano 2019 · McCrary 2008 · NIC/PIB owner documents — each with a LINK label, and a flow caption above ("on this database → methods → owner's documents").
- **Below: the Rerun terminal card** (dark, monospace: repo · CLAIMS.md · three commands · seed 42 · corrections on record) beside a **UI/UX gallery** of four real screens, like the reference's bottom band.

## 4. Assets — have / make / never

| Have (real) | Make (vector or rendered) | Never |
|---|---|---|
| 4 dated prototype stills (queue, project 617185, breakdown, briefing); 13 real before/after satellite pairs of PAIMANA projects (`paimana_extracted/satellite_data/imagery_test`, `showcase_z18`); engine output for 617185 | Icons (react-icons → PNG, or Segoe Fluent Icons via PIL); the road-timeline fan; skyline silhouette; hexagons; device frames; gradient header bands; stamp badge | Stock photos, AI-generated scenes, cartoon vehicles, emoji, logo walls, any number not in the registry |

## 5. Production plan

1. **Pilot slide 2 first** (the hero) — build it, render it, you approve the look; every other slide inherits the card system, palette and motif from it.
2. Build in `python-pptx` on the official template as now (`deck/build/`), adding an `assets/` step that renders icons and the skyline once.
3. QA per slide as before: render via PowerPoint, check overflow, ≥ 11 pt, pointer headings verbatim, numbers vs registry, links live, no placeholders.
4. Expected effort: slide 2 ≈ one session; slides 3–6 ≈ one more; assets ≈ an hour.

## 6. Decisions I need from you before building

1. **Ground:** light slides with navy header bands (closest to the reference) — or a full navy/dark deck?
2. **Illustration style:** flat vector icons only (safe, fast) — or also hand-drawn scene illustrations (more Lanezy-like, but they must be drawn, not stock)?
3. **Team identity:** team name and ID for the oval and title page; any team logo to place beside it?
4. **Satellite pairs on slides 1 and 6:** yes (real, ours, honest caption) — or keep imagery to prototype screens only?
5. **Caption floor:** keep 11 pt everywhere (locked) — or allow 10 pt for image captions only?
