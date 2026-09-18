# Reconciliation — our public register vs the April 2026 Project Monitoring Report

*17 September 2026. Written so that every count and rupee total on the deck can be traced to a scope and a date. Rule: where a slide quotes the Ministry, it uses the Ministry's April 2026 figures; where it quotes our models, it uses the register below.*

## The two sets of numbers

| Figure | PS text (PAIMANA, April 2026) | Our register (portal snapshot, June 2026) | Why they differ |
|---|---|---|---|
| Projects | **1,981 ongoing** | **2,207 rows** = 2,043 with physical progress < 100% + 164 at ≥ 100% | Scope (ongoing vs all listed) and date (April vs June); the portal list also carries projects the monthly report has since dropped or added |
| Original cost | ₹37.13 lakh crore | ₹41.78 lakh crore (all rows) · ₹40.12 (progress < 100%) | Same scope/date effects; our totals include completed rows |
| Revised cost | ₹42.78 lakh crore | RevisedCost present on 1,183 rows; revised-else-original total ₹47.44 lakh crore (all) · ₹45.64 (progress < 100%) | The public list does not carry a revised cost for every project; we never impute one for modelling |
| Expenditure | ₹20.36 lakh crore | ₹21.95 lakh crore (all) · ₹20.90 (progress < 100%) | Scope/date |
| Ministries · sectors | 17 · 22 | 17 · 22 | Match |

## What the deck says, and where each number comes from

- **"1,981 ongoing · ₹37.13 → ₹42.78 lakh crore"** — the Ministry's own April 2026 figures, quoted from the PS text.
- **"public register Jun 2026: 1,988 of 2,103 still running (2,207 rows incl. 164 completed)"** — our register: 2,207 rows scraped from the portal's public, unauthenticated endpoints; 2,103 rows usable by the survival model after date/cost validity checks, of which 115 are observed completions and 1,988 are right-censored (still running) as of 2026-06-30.
- **Every model figure** (596/596, 792/265, 50.8 → 79.0, 100 → 22.7, 22.41/18.49/16.67/16.24) is computed on the register, never on the PS totals.

## Consequences we accept

1. Our register is a *superset in rows* and a *subset in fields* of what IPMD holds: 25 public columns, no monthly history, no milestone or clearance fields.
2. Totals on our dashboards (e.g. ₹47.44 lakh crore "portfolio capex" in `/api/health`) sum revised-else-original cost over all 2,207 rows; they are not comparable with the PS's ongoing-only totals and are not used on the deck.
3. The pilot replaces this register with the CUF export; the reconciliation then collapses to a single source.

*Regenerate: `python -c "import pandas as pd; df=pd.read_csv('paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv'); print(len(df), (df.PhysicalProgress>=100).sum(), df.OriginalCost.sum()/1e5)"`*
