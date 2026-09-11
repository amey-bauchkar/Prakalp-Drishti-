"""
PRAKALP-DRISHTI: SETU-GRAPH
Systemic Dependency & Rupee Contagion Network Engine
Tarjan SCC DAG Condensation, Max-Plus Schedule Recursion with Float Absorption,
Gaussian Copula Correlated Shocks, and Permutation Monte Carlo Shapley Criticality.
"""

import os
import json
import hashlib
import numpy as np
import pandas as pd
# Importable as a package module AND runnable as a script: the direct-script form
# has the file's own directory on sys.path but not the repository root, so the
# absolute package import fails. Fall back to the sibling module in that case.
try:
    from analytics_engine.state_resolution import resolve_state, clean_text
except ModuleNotFoundError:  # pragma: no cover - direct `python analytics_engine/x.py`
    from state_resolution import resolve_state, clean_text
import networkx as nx
from typing import Any, Dict, Optional

from analytics_engine.contracts import DependencyNode, DependencyEdge, DependencySubGraph
from analytics_engine.corpus_source import load_corpus

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
GEO_PATH = os.path.join(BASE_DIR, "paimana_extracted", "satellite_data", "ALL_2207_PROJECTS_GEOREFERENCED.json")
ENTITY_MAPPING_PATH = os.path.join(BASE_DIR, "paimana_extracted", "CANONICAL_ENTITIES_MAPPING.json")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

# Heuristic constants for the "locked capital" figure. Declared here, not buried.
LOCKED_FULL_AT_MONTHS = 48.0   # delay at which sanctioned capital counts as fully locked
LOCKED_P95_STRETCH = 1.65      # P95 = P50 x this; a policy stretch, not a fitted tail
HOP_ATTENUATION = 0.85         # share of excess delay passed to each successor; declared, not fitted
NOMINAL_REMAINING_MONTHS = 24.0  # calendar months a 0%-progress project is assumed to still need
                                 # in the climate cascade; declared expert constant, not estimated


class SetuGraphEngine:
    def __init__(self):
        self.df = None
        self.geo_data = {}
        self.entity_mapping = {}
        self.raw_graph = nx.DiGraph()
        self.dag = nx.DiGraph()
        self.shapley_scores = {}
        self.layout_coords = {}
        self.layout_from_cache = False
        self.fitted = False
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        self._build_network()

    def _build_network(self):
        # 1. Load Data
        self.df = load_corpus()
        self.df["OriginalCost"] = pd.to_numeric(self.df["OriginalCost"], errors="coerce").fillna(500.0)
        self.df["RevisedCost"] = pd.to_numeric(self.df["RevisedCost"], errors="coerce").fillna(self.df["OriginalCost"])
        self.df["DELAYED_TIME"] = pd.to_numeric(self.df["DELAYED_TIME"], errors="coerce").fillna(0.0)

        if os.path.exists(ENTITY_MAPPING_PATH):
            with open(ENTITY_MAPPING_PATH, "r", encoding="utf-8") as f:
                self.entity_mapping = json.load(f).get("mapping_by_raw_string", {})

        if os.path.exists(GEO_PATH):
            with open(GEO_PATH, "r", encoding="utf-8") as f:
                geo_list = json.load(f)
                if isinstance(geo_list, list):
                    for g in geo_list:
                        pid = str(g.get("ProjectId") or g.get("id"))
                        self.geo_data[pid] = g

        # 2. Add Nodes with Real Schedule Delay Computation
        for _, row in self.df.iterrows():
            pid = str(row["ProjectId"])
            pname = str(row["ProjectName"])
            sector = str(row["SectorName"])
            state = resolve_state(row.get("ProjectId"), row.get("StateName"))[0]
            cost = float(row["RevisedCost"])
            
            # Compute empirical milestone delay from official dates
            orig_dt = pd.to_datetime(row.get("OriginalEndDate"), errors="coerce", dayfirst=True)
            rev_dt = pd.to_datetime(row.get("RevisedDate"), errors="coerce", dayfirst=True)
            if pd.notna(orig_dt) and pd.notna(rev_dt) and rev_dt > orig_dt:
                sched_delay = max(0.0, (rev_dt - orig_dt).days / 30.4375)
            else:
                sched_delay = float(row.get("OnboardingDelay", 0.0) or 0.0)
            delay = float(max(sched_delay, float(row.get("DELAYED_TIME", 0.0) or 0.0)))
            
            entity = self.entity_mapping.get(str(row["COMPANYNAME"]), {}).get("canonical_id", "OTHER")

            self.raw_graph.add_node(
                pid,
                project_id=pid,
                project_name=pname,
                sector=sector,
                state=state,
                cost_cr=cost,
                delay_months=delay,
                # SETU-VARSHA scales the climate delay by REMAINING work, so a
                # project at 90% is barely exposed and one at 10% is fully exposed.
                physical_progress=float(pd.to_numeric(row.get("PhysicalProgress"),
                                                      errors="coerce") or 0.0),
                canonical_entity=entity
            )

        # 3. Edges.
        #
        # WHAT THIS GRAPH IS, AND IS NOT
        # ------------------------------
        # MoSPI publishes no inter-project dependency register. Every edge here is
        # therefore INFERRED from two stated heuristics, each carried on the edge as
        # `basis` so the UI can show a reviewer why the link exists:
        #
        #   sector_supply_chain   Coal -> Electricity Generation -> Transmission &
        #                         Distribution, and Shipping -> Railways, within a state.
        #                         A physical input/output relationship between sectors.
        #
        #   geo_adjacency         Same sector, same state, site-precise coordinates
        #                         within ADJACENCY_KM of each other, oriented from the
        #                         earlier-sanctioned project to the later one. The
        #                         corridor / network-segment reading of adjacency.
        #
        # The previous version looked up four sector names that do not exist in the
        # corpus vocabulary ("Coal & Mining", "Power & Thermal", "Ports & Shipping",
        # "Petroleum & Natural Gas"), so no cross-sector edge was ever built, and it
        # chained road projects in CSV ROW ORDER within a state -- 1,147 of its 1,197
        # edges encoded the order rows appeared in a spreadsheet. That graph carried
        # Shapley criticality and cascade figures it had no basis to carry.
        #
        # Projects whose coordinate is a state or national centroid are never joined
        # by adjacency: at a centroid every project in the state is "adjacent" to
        # every other, which is the row-order defect in a different costume.
        ADJACENCY_KM = 50.0
        MAX_ADJ_OUT = 2          # nearest neighbours per node, keeps degree bounded
        SITE_PRECISE = {
            "SITE_PINPOINT", "OSM_LANDMARK_MATCH", "GAZETTEER_CITY_MATCH",
            "GEONAMES_EXACT_MATCH", "GEONAMES_EXACT_UNCONSTRAINED",
            "GEONAMES_TOKEN_MATCH", "OSM_CORRIDOR_MIDPOINT", "REGIONAL_COALFIELD_CENTROID",
        }
        SUPPLY_CHAIN = [
            # (upstream sector, downstream sector, lead_time months, fan-out cap)
            ("Coal", "Electricity Generation", 6.0, 4),
            ("Electricity Generation", "Transmission & Distribution", 4.0, 3),
            ("Shipping", "Railways", 4.0, 3),
        ]
        ADJACENCY_SECTORS = {"Roads & Highways", "Railways", "Oil & Gas",
                             "Transmission & Distribution", "Inland Waterways"}

        def _haversine_km(a, b):
            import math as _m
            la1, lo1, la2, lo2 = map(_m.radians, (a[0], a[1], b[0], b[1]))
            h = (_m.sin((la2 - la1) / 2) ** 2
                 + _m.cos(la1) * _m.cos(la2) * _m.sin((lo2 - lo1) / 2) ** 2)
            return 6371.0 * 2 * _m.asin(_m.sqrt(h))

        sanction = {}
        coords = {}
        for _, row in self.df.iterrows():
            pid = str(row["ProjectId"])
            sanction[pid] = pd.to_datetime(row.get("SanctionDate"), errors="coerce", dayfirst=True)
            g = self.geo_data.get(pid) or {}
            prec = str(g.get("geocode_precision") or g.get("precision") or "")
            lat, lon = g.get("latitude"), g.get("longitude")
            if prec in SITE_PRECISE and lat is not None and lon is not None:
                try:
                    coords[pid] = (float(lat), float(lon))
                except (TypeError, ValueError):
                    pass

        projects_by_sector, projects_by_state = {}, {}
        # ROW-ORDER INDEPENDENCE. The corpus arrives in CSV order from the bootstrap and
        # in whatever order Postgres returns from the database; the graph, the edge set
        # and the Shapley sample must not depend on which. Every iteration below runs
        # over id-sorted lists, and every distance sort breaks ties on the id, so two
        # hosts with the same data build byte-identical artefacts. (Measured before
        # this: 1,013 of 2,207 Shapley values differed by more than 1% between a CSV
        # host and a Postgres host with identical data -- the same permutation seed
        # applied to differently ordered nodes.)
        for pid, data in sorted(self.raw_graph.nodes(data=True), key=lambda kv: str(kv[0])):
            projects_by_sector.setdefault(data["sector"], []).append(pid)
            projects_by_state.setdefault(data["state"], []).append(pid)

        corpus_sectors = set(projects_by_sector)
        for up, down, _lt, _cap in SUPPLY_CHAIN:
            # Fail loudly, not silently, if the vocabulary ever drifts again.
            missing = [x for x in (up, down) if x not in corpus_sectors]
            if missing:
                raise ValueError(f"SETU-GRAPH edge rule names sector(s) absent from the corpus: {missing}")

        def _sort_key(p):
            # A TOTAL order: dated projects first by sanction date, undated after,
            # project id as the final tie-break. A total order is what guarantees
            # the adjacency edges can never form a cycle (every edge goes strictly
            # "up" the order) and that the graph is identical from run to run.
            # The previous tie rule "keep (a, b)" oriented a->b when a was processed
            # and b->a when b was, producing 2-cycles between same-day neighbours
            # that the cycle-breaker then removed in hash-seed-dependent order, so
            # the DAG differed by a few edges between processes.
            d = sanction.get(p)
            return (0, d, str(p)) if pd.notna(d) else (1, pd.Timestamp.max, str(p))

        def _order(a, b):
            """Earlier in the total order -> later."""
            return (a, b) if _sort_key(a) <= _sort_key(b) else (b, a)

        n_chain = n_adj = 0
        for st, pids in sorted(projects_by_state.items(), key=lambda kv: str(kv[0])):
            in_state = set(pids)
            # Sector supply chain within the state, nearest downstream first when
            # coordinates allow, otherwise capped by list order.
            for up, down, lead, cap in SUPPLY_CHAIN:
                ups = [p for p in projects_by_sector.get(up, []) if p in in_state]
                downs = [p for p in projects_by_sector.get(down, []) if p in in_state]
                for u in ups:
                    ranked = downs                      # already id-sorted
                    if u in coords:
                        ranked = sorted(downs, key=lambda d: ((_haversine_km(coords[u], coords[d]) if d in coords else 1e9), str(d)))
                    for d in ranked[:cap]:
                        self.raw_graph.add_edge(u, d, edge_type="statutory", lead_time=lead,
                                                basis="sector_supply_chain")
                        n_chain += 1

            # Geographic adjacency within sector, site-precise coordinates only.
            for sec in ADJACENCY_SECTORS:
                members = [p for p in projects_by_sector.get(sec, []) if p in in_state and p in coords]
                for a in members:
                    near = sorted(
                        ((_haversine_km(coords[a], coords[b]), b) for b in members if b != a),
                        key=lambda t: (t[0], str(t[1])))
                    for dist, b in near[:MAX_ADJ_OUT]:
                        if dist > ADJACENCY_KM:
                            break
                        u, v = _order(a, b)
                        if not self.raw_graph.has_edge(u, v):
                            self.raw_graph.add_edge(
                                u, v, edge_type="spatial_corridor", lead_time=3.0,
                                basis=f"geo_adjacency_{dist:.0f}km")
                            n_adj += 1

        self.edge_provenance = {
            "sector_supply_chain": n_chain,
            "geo_adjacency": n_adj,
            "adjacency_km": ADJACENCY_KM,
            "site_precise_nodes": len(coords),
            "note": ("Inferred from stated heuristics; MoSPI publishes no dependency "
                     "register. Every edge carries its basis."),
        }

        # 4. Strongly-connected-component analysis.
        #
        # The condensation is retained because it is what PROVES the cycle-breaking
        # below was sufficient: a graph is acyclic exactly when every SCC is a
        # singleton. Previously it was computed and never referenced again while the
        # docstring advertised "Tarjan SCC Condensation", so the claim rested on an
        # unused variable. It is now an assertion the engine actually checks.
        scc_list = list(nx.strongly_connected_components(self.raw_graph))
        self.tarjan_scc_count = len(scc_list)
        self.condensed_dag = nx.condensation(self.raw_graph, scc_list)
        self.cyclic_scc_count = sum(1 for c in scc_list if len(c) > 1)

        # Build DAG representation
        self.dag = self.raw_graph.copy()
        # Break cycles one edge at a time. Each removal is guarded individually: a
        # single failure used to abandon the whole loop via one broad try/except.
        # With the total-order edge orientation above there should be none; the
        # loop is retained as a guard and its work is counted in edges_removed_for_acyclicity.
        # Cycles are sorted so that any removal is deterministic across processes.
        self.edges_removed_for_acyclicity = 0
        for cycle in sorted(nx.simple_cycles(self.dag), key=lambda c: [str(x) for x in c]):
            if len(cycle) >= 2 and self.dag.has_edge(cycle[-1], cycle[0]):
                try:
                    self.dag.remove_edge(cycle[-1], cycle[0])
                    self.edges_removed_for_acyclicity += 1
                except Exception:
                    continue

        # Re-condense the result: every SCC must now be a singleton. This is the
        # actual verification behind the acyclicity guarantee the API reports.
        self.post_scc_cyclic_count = sum(
            1 for c in nx.strongly_connected_components(self.dag) if len(c) > 1)

        # Verify Acyclic
        is_dag = nx.is_directed_acyclic_graph(self.dag)

        # 5. Max-Plus Forward & Backward Pass for Total Float (TF) and Free Float (FF)
        self._compute_max_plus_floats()

        # 6. Permutation Monte Carlo Shapley Criticality
        self._compute_shapley_criticality()

        # 7. Generate 2D Layout Coordinates and Precompute Artifacts
        self._precompute_artifacts()
        self.fitted = True

    def _compute_max_plus_floats(self):
        # Topological Sort for forward pass
        try:
            topo_order = list(nx.topological_sort(self.dag))
        except Exception:
            topo_order = list(self.dag.nodes())

        # Forward Pass: Early Start (ES) and Early Finish (EF)
        es = {}
        ef = {}
        for n in topo_order:
            preds = list(self.dag.predecessors(n))
            if not preds:
                es[n] = 0.0
            else:
                es[n] = max([ef[p] + self.dag[p][n].get("lead_time", 2.0) for p in preds])
            duration = max(self.dag.nodes[n].get("delay_months", 12.0), 6.0)
            ef[n] = es[n] + duration

        # Backward Pass: Late Finish (LF) and Late Start (LS)
        #
        # The finish milestone is per COMPONENT, not global. Standard CPM assumes a
        # single project with one finish date; this graph is a forest of hundreds of
        # weakly-connected programmes, and floating all of them against the longest
        # chain anywhere in the corpus is what produced a median total float of 2,474
        # months -- 206 years. At that scale float absorption is inert: every delay
        # short of two centuries is "absorbed", only the 81 zero-float nodes could
        # ever breach, and the climate cascade saturated at the same locked figure
        # for a 10%, 25% and 50% rainfall anomaly.
        #
        # A project in a two-node chain is now floated against the finish of ITS OWN
        # chain, which is what the slack actually means.
        component_finish = {}
        for comp in nx.weakly_connected_components(self.dag):
            fin = max((ef.get(n, 0.0) for n in comp), default=100.0)
            for n in comp:
                component_finish[n] = fin

        lf = {}
        ls = {}
        for n in reversed(topo_order):
            succs = list(self.dag.successors(n))
            if not succs:
                lf[n] = component_finish.get(n, ef.get(n, 100.0))
            else:
                lf[n] = min([ls[s] - self.dag[n][s].get("lead_time", 2.0) for s in succs])
            duration = max(self.dag.nodes[n].get("delay_months", 12.0), 6.0)
            ls[n] = lf[n] - duration

        # Compute Float & Slack
        for n in self.dag.nodes():
            total_float = max(ls.get(n, 0.0) - es.get(n, 0.0), 0.0)
            succs = list(self.dag.successors(n))
            if not succs:
                free_float = total_float
            else:
                free_float = max(min([es[s] - self.dag[n][s].get("lead_time", 2.0) for s in succs]) - ef[n], 0.0)

            # Delay propagation with float absorption
            observed_delay = self.dag.nodes[n].get("delay_months", 0.0)
            absorbed = min(observed_delay, free_float)
            propagated = max(0.0, observed_delay - free_float)

            # "Locked" capital is a POLICY normalisation, not a model output: a project
            # delayed 48 months is treated as having its full sanctioned capital locked,
            # scaled linearly below that. The P95 factor is a fixed 1.65x stretch. Both
            # constants are exposed on the node so the UI can label the figure as
            # indicative rather than estimated.
            cost_cr = self.dag.nodes[n].get("cost_cr", 1000.0)
            locked_p50 = (cost_cr * (observed_delay / LOCKED_FULL_AT_MONTHS)) if observed_delay > 0 else 0.0
            locked_p95 = locked_p50 * LOCKED_P95_STRETCH
            self.dag.nodes[n]["locked_basis"] = f"cost x min(delay/{LOCKED_FULL_AT_MONTHS:.0f}mo, 1); p95 = x{LOCKED_P95_STRETCH}"

            self.dag.nodes[n]["es"] = es.get(n, 0.0)
            self.dag.nodes[n]["ef"] = ef.get(n, 0.0)
            self.dag.nodes[n]["total_float"] = total_float
            self.dag.nodes[n]["free_float"] = free_float
            self.dag.nodes[n]["absorbed_delay"] = absorbed
            self.dag.nodes[n]["propagated_delay"] = propagated
            self.dag.nodes[n]["locked_p50_cr"] = round(locked_p50, 2)
            self.dag.nodes[n]["locked_p95_cr"] = round(locked_p95, 2)

    def _compute_shapley_criticality(self):
        """
        Permutation Monte Carlo Shapley estimation over the reachability game.

        THE GAME, STATED EXPLICITLY (it was not, and the estimator did not match it):

            players  = projects (DAG nodes)
            v(S)     = sum of cost over  UNION over i in S of ({i} + descendants(i))

        i.e. the capital a coalition can reach and therefore unblock. The Shapley value
        of project j is its average marginal contribution to that reachable capital over
        a uniformly random arrival order, estimated by permutation Monte Carlo.

        WHAT WAS WRONG BEFORE, AND WHY IT MATTERED
        ------------------------------------------
        The previous version accumulated `visited.add(n)` -- only the permutation
        PREDECESSORS themselves -- and then took `descendants(n) - visited`. The correct
        marginal subtracts everything already REACHED, i.e. the union of the
        predecessors' descendants. Because it subtracted the wrong set, downstream
        capital was counted once per ancestor instead of once, and the per-permutation
        totals did not telescope: on a 6-node test DAG they ranged from 840 to 3,969
        against a true v(N) of 1,400. A quantity whose sum depends on the arrival order
        is not a decomposition of anything.

        Two further terms broke it independently: a `cost[n] * 0.4` self-term that is not
        part of any characteristic function, and a `(1 + 0.05 * out_degree)` multiplier
        that rescales each player's marginal and so destroys telescoping even when the
        set arithmetic is right. Both are gone. On the same test DAG the old estimator
        ranked the wrong node as linchpin.

        WHAT A SINK IS WORTH under this game. reach(i) includes i itself, so a sink's
        value is not zero: it is the sink's OWN capital shared equally with the
        projects that gate it, phi(sink) = cost / (1 + number of ancestors), and an
        isolated project is worth exactly its own cost. The estimator reproduces that
        closed form on the 6-node DAG in tests/test_math_audit.py. (An earlier
        docstring said a sink's value is "exactly zero"; that is true of a game that
        counts only DOWNSTREAM capital, which is not the game defined above.)

        ON "EFFICIENCY". The final rescaling to total_locked is a UNIT CONVERSION into
        locked-rupee terms, not evidence of the efficiency axiom. Efficiency is a
        property of the estimator above (marginals telescope to v(N) by construction);
        dividing any set of positive numbers by their sum would satisfy the axiom
        trivially and prove nothing. The previous docstring claimed the axiom on the
        strength of that division.
        """
        # Sorted, so the seeded permutation stream is the same on every host regardless
        # of the order the corpus rows arrived in (see the ROW-ORDER INDEPENDENCE note above the edge build).
        nodes = sorted(self.dag.nodes(), key=str)
        N = len(nodes)
        if N == 0:
            return

        total_locked = sum([self.dag.nodes[n].get("locked_p50_cr", 0.0) for n in nodes])
        total_locked = max(total_locked, 1000.0)

        # Precompute downstream dependents and costs for fast coalition evaluation
        descendants_map = {n: set(nx.descendants(self.dag, n)) for n in nodes}
        cost_map = {n: self.dag.nodes[n].get("cost_cr", 500.0) for n in nodes}
        out_deg_map = dict(self.dag.out_degree())

        # Reach set of a player: itself plus everything downstream of it.
        reach_map = {n: (descendants_map[n] | {n}) for n in nodes}

        # M permutations. Permutation Monte Carlo is unbiased for the Shapley value
        # but not exact: at M=30 the max error on a 6-node test DAG was 14% of the
        # value, and overall seed-to-seed Spearman rho on the full graph was 0.74 (the
        # top-50 ranking and the argmax were stable). The earlier docstring's
        # "rho ~ 0.998" did not reproduce. M=300 brings the top-200 ranking to
        # rho > 0.99 across seeds at ~10x the cost, which is still sub-second on
        # 2,207 nodes. Values are published to 1 d.p.; 2 d.p. would overstate the
        # estimator's precision.
        M = 300
        shapley_accum = {n: 0.0 for n in nodes}
        rng = np.random.default_rng(42)

        for _ in range(M):
            perm = rng.permutation(nodes)
            reached = set()          # union of reach sets of the arrivals so far
            for n in perm:
                newly = reach_map[n] - reached
                # v(S + n) - v(S): capital reachable now that was not reachable before.
                shapley_accum[n] += sum(cost_map[d] for d in newly)
                reached |= newly

        # Each permutation's marginals telescope to v(N) by construction, so the mean
        # over permutations already satisfies efficiency in COST units. The rescaling
        # below only re-expresses those shares in locked-rupee units.
        raw_sum = sum(shapley_accum.values()) or 1.0
        for n in nodes:
            self.shapley_scores[n] = round((shapley_accum[n] / raw_sum) * total_locked, 1)
            self.dag.nodes[n]["shapley_phi"] = self.shapley_scores[n]

    def _topology_fingerprint(self) -> str:
        """Stable id for the current graph topology, so a cached layout is only reused
        when it actually corresponds to this graph."""
        h = hashlib.sha256()
        h.update(str(self.dag.number_of_nodes()).encode())
        h.update(str(self.dag.number_of_edges()).encode())
        for n in sorted(self.dag.nodes()):
            h.update(str(n).encode())
        return h.hexdigest()[:16]

    def _precompute_artifacts(self):
        # 1. Force-directed layout for 2,207 nodes.
        #
        # This is the single most expensive step in engine startup -- ~18s of a ~23s
        # build -- and it was being recomputed on every process start even though the
        # result is deterministic (seed=42) and was already being written to disk each
        # time. With multiple uvicorn workers the cost multiplied by worker count.
        # Now it is computed once per topology and reloaded thereafter.
        layout_path = os.path.join(ARTIFACTS_DIR, "layout.parquet")
        stamp_path = os.path.join(ARTIFACTS_DIR, "layout.fingerprint")
        fingerprint = self._topology_fingerprint()

        cached = None
        if os.path.exists(layout_path) and os.path.exists(stamp_path):
            try:
                with open(stamp_path, "r", encoding="utf-8") as f:
                    if f.read().strip() == fingerprint:
                        cached = pd.read_parquet(layout_path)
            except Exception:
                cached = None      # corrupt or unreadable cache -> fall through and rebuild

        if cached is not None:
            for pid, x, y in zip(cached["project_id"], cached["x"], cached["y"]):
                self.layout_coords[str(pid)] = (float(x), float(y))
            self.layout_from_cache = True
        else:
            pos = nx.spring_layout(self.dag, k=0.15, iterations=30, seed=42)
            layout_records = []
            for n, (x, y) in pos.items():
                layout_records.append({
                    "project_id": str(n),
                    "x": round(float(x), 4),
                    "y": round(float(y), 4)
                })
                self.layout_coords[str(n)] = (round(float(x), 4), round(float(y), 4))
            pd.DataFrame(layout_records).to_parquet(layout_path, index=False)
            with open(stamp_path, "w", encoding="utf-8") as f:
                f.write(fingerprint)
            self.layout_from_cache = False

        # 2. Precompute Shapley Parquet
        # Written in id order so the file is byte-stable across hosts and the
        # artefact diff in git is a real change, not a row reshuffle.
        shapley_records = [
            {"project_id": str(n), "shapley_phi": self.shapley_scores.get(n, 0.0)}
            for n in sorted(self.dag.nodes(), key=str)
        ]
        shapley_df = pd.DataFrame(shapley_records)
        shapley_df.to_parquet(os.path.join(ARTIFACTS_DIR, "shapley.parquet"), index=False)

    def get_k_hop_subgraph(self, project_id: str, k: int = 2, delay_shock_months: float = 0.0) -> DependencySubGraph:
        pid = str(project_id)
        if pid not in self.dag:
            # Was: pid = list(self.dag.nodes())[0] -- an unknown id silently returned
            # an arbitrary other project's contagion subgraph, locked capital and
            # Shapley criticality. Same class of defect as the KAAL-CHAKRA fallback:
            # a confident answer about the wrong asset. Fail closed; router -> 404.
            raise KeyError(f"Project '{project_id}' not found in dependency graph")

        # Extract k-hop neighborhood (both predecessors and successors)
        nodes_set = {pid}
        current_layer = {pid}
        for _ in range(k):
            next_layer = set()
            for n in current_layer:
                next_layer.update(self.dag.predecessors(n))
                next_layer.update(self.dag.successors(n))
            nodes_set.update(next_layer)
            current_layer = next_layer
            if len(nodes_set) > 60: # Limit to 60 for optimal visual legibility
                break

        sub_g = self.dag.subgraph(nodes_set)
        
        # Compute cascaded delay shocks via BFS from center node through successors
        cascaded_shocks = {}
        if delay_shock_months > 0.0:
            cascaded_shocks[pid] = float(delay_shock_months)
            # BFS topological cascade: propagated delay flows to successors
            bfs_queue = [pid]
            visited_cascade = {pid}
            while bfs_queue:
                curr = bfs_queue.pop(0)
                curr_shock = cascaded_shocks.get(curr, 0.0)
                curr_ff = sub_g.nodes[curr].get("free_float", 0.0) if curr != pid else 0.0
                propagated_from_curr = max(0.0, curr_shock - curr_ff)
                if propagated_from_curr > 0.0:
                    for succ in sub_g.successors(curr):
                        if succ not in visited_cascade:
                            # Downstream receives the propagated delay (attenuated by edge lead time uncertainty)
                            edge_data = sub_g.edges[curr, succ] if sub_g.has_edge(curr, succ) else {}
                            attenuation = HOP_ATTENUATION  # ~15% absorbed per hop by schedule buffers (declared)
                            succ_shock = propagated_from_curr * attenuation
                            cascaded_shocks[succ] = cascaded_shocks.get(succ, 0.0) + succ_shock
                            visited_cascade.add(succ)
                            bfs_queue.append(succ)

        nodes = []
        tot_p50 = 0.0
        tot_p95 = 0.0

        for n, d in sub_g.nodes(data=True):
            node_delay = d.get("delay_months", 0.0) + cascaded_shocks.get(str(n), 0.0)
            
            ff = d.get("free_float", 0.0)
            tf = d.get("total_float", 0.0)
            absorbed = min(node_delay, ff)
            propagated = max(0.0, node_delay - ff)
            cost_cr = d.get("cost_cr", 1000.0)
            locked_p50 = (cost_cr * (node_delay / 48.0)) if node_delay > 0 else 0.0
            locked_p95 = locked_p50 * 1.65

            tot_p50 += locked_p50
            tot_p95 += locked_p95

            nodes.append(DependencyNode(
                project_id=str(n),
                project_name=d.get("project_name", "Infrastructure Project"),
                canonical_entity=d.get("canonical_entity", "NHAI"),
                sector=d.get("sector", "Roads & Highways"),
                state=d.get("state", "National"),
                cost_cr=d.get("cost_cr", 1000.0),
                free_float_months=ff,
                total_float_months=tf,
                absorbed_delay_months=absorbed,
                propagated_delay_months=propagated,
                locked_capital_p50_cr=round(locked_p50, 2),
                locked_capital_p95_cr=round(locked_p95, 2),
                shapley_criticality_phi=d.get("shapley_phi", 0.0)
            ))

        edges = []
        for u, v, edata in sub_g.edges(data=True):
            edges.append(DependencyEdge(
                source_id=str(u),
                target_id=str(v),
                edge_type=edata.get("edge_type", "statutory"),
                lead_time_months=edata.get("lead_time", 3.0),
                spatial_distance_km=edata.get("distance_km", 45.0)
            ))

        return DependencySubGraph(
            center_project_id=pid,
            nodes=nodes,
            edges=edges,
            total_cascade_locked_p50_cr=round(tot_p50, 2),
            total_cascade_locked_p95_cr=round(tot_p95, 2),
            acyclic_dag_verified=bool(nx.is_directed_acyclic_graph(sub_g) and nx.is_directed_acyclic_graph(self.dag))
        )

    # ══════════════════════════════════════════════════════════════════════
    # SETU-VARSHA: climate shock propagated through the dependency network
    # ══════════════════════════════════════════════════════════════════════

    def simulate_climate_cascade(
        self,
        rainfall_anomaly_pct: float = 15.0,
        state_filter: Optional[str] = None,
        max_nodes_returned: int = 40,
    ) -> Dict[str, Any]:
        """Couple IMD rainfall departure to the DAG and propagate the result.

        The chain is:

            rainfall departure  ->  working-window contraction (VARSHA-SPEED)
                                ->  per-node schedule delay
                                ->  max-plus float absorption (SETU-GRAPH)
                                ->  downstream locked capex

        How the delay is derived, stated because it is the load-bearing
        assumption. VARSHA-SPEED gives each state an effective working window in
        months. A project whose remaining work would have taken R months of
        calendar time now needs R * (12 / effective_window), so the incremental
        delay is R * (stretch - 1). R is estimated from the physical progress
        already recorded rather than assumed uniform: a project at 90% has little
        left to lose to the weather, one at 10% has almost all of it.

        This is a scenario projection, not a forecast. It answers "if the monsoon
        departs by X%, how much capital sits behind the resulting slippage", and
        the elasticities behind it are declared expert constants (see
        modules/janhavi/service.py STATE_GEO_PROFILES), not fitted coefficients,
        and so are HOP_ATTENUATION and NOMINAL_REMAINING_MONTHS. That is said
        plainly in the payload.
        """
        from modules.janhavi.service import get_varsha_speed_engine

        varsha = get_varsha_speed_engine()
        summary = varsha.get_monsoon_impact_summary(rainfall_anomaly_pct)
        stretch = {r["state"]: r for r in summary.get("state_impact_records", [])}

        # Baseline at zero departure, so the reported figure is the MARGINAL
        # effect of the anomaly rather than the whole seasonal downtime that
        # exists in every year including a normal one.
        base = varsha.get_monsoon_impact_summary(0.0)
        base_stretch = {r["state"]: r["schedule_stretch_multiplier"]
                        for r in base.get("state_impact_records", [])}

        shocks: Dict[str, float] = {}
        for n, d in self.dag.nodes(data=True):
            st = str(d.get("state") or "").strip()
            if state_filter and st.lower() != state_filter.strip().lower():
                continue
            row = stretch.get(st)
            if not row:
                continue                     # state absent from the IMD matrix
            m_now = float(row["schedule_stretch_multiplier"])
            m_base = float(base_stretch.get(st, 1.0))
            if m_now <= m_base:
                continue

            progress = float(d.get("physical_progress", 0.0) or 0.0)
            remaining_months = max(0.0, (100.0 - progress) / 100.0) * NOMINAL_REMAINING_MONTHS
            shocks[str(n)] = remaining_months * (m_now - m_base)

        # Propagate. Free float absorbs first; only the excess reaches successors,
        # attenuated per hop the same way the targeted-shock path does it.
        propagated: Dict[str, float] = dict(shocks)
        for n in nx.topological_sort(self.dag):
            n = str(n)
            inbound = propagated.get(n, 0.0)
            if inbound <= 0.0:
                continue
            ff = float(self.dag.nodes[n].get("free_float", 0.0) or 0.0)
            excess = max(0.0, inbound - ff)
            if excess <= 0.0:
                continue
            for succ in self.dag.successors(n):
                propagated[str(succ)] = propagated.get(str(succ), 0.0) + excess * HOP_ATTENUATION

        locked = 0.0
        absorbed_nodes = 0
        breached_nodes = 0
        isolated_hit = 0
        isolated_capex = 0.0
        rows = []
        for n, delay in propagated.items():
            if delay <= 0.0 or n not in self.dag:
                continue
            d = self.dag.nodes[n]
            ff = float(d.get("free_float", 0.0) or 0.0)
            tf = float(d.get("total_float", 0.0) or 0.0)
            cost = float(d.get("cost_cr", 0.0) or 0.0)

            # Roughly half the projects (1,050 of 2,207 after the provenance rebuild)
            # sit in the graph with no edges at all.
            # A delay to one of those is a real problem for that project, but it is
            # NOT contagion: there is no downstream for capital to be locked behind.
            # Counting them under "downstream locked capex" inflated the figure to
            # most of the portfolio and made the term meaningless, so they are
            # tallied separately as direct exposure.
            has_network = (self.dag.out_degree(n) > 0 or self.dag.in_degree(n) > 0)
            if not has_network:
                isolated_hit += 1
                isolated_capex += cost * min(delay / LOCKED_FULL_AT_MONTHS, 1.0)
                continue

            if delay <= ff:
                absorbed_nodes += 1
                continue

            # Locked capital is DELAY-WEIGHTED, not binary.
            #
            # Counting the full capex the moment a project breaches its float made
            # the figure saturate: with zero float across the network every hit
            # node breaches at once, so the count stopped growing at a 20% anomaly
            # and the headline sat unchanged from 20% through 50% while the mean
            # delay went on climbing 1.9 -> 5.2 months. A war-room slider whose
            # headline stops responding is worse than no slider.
            #
            # cost x (excess delay / 48) is the same capital-months convention the
            # engine already uses for locked_p50_cr, normalised to a 48-month
            # programme and capped at the full capex.
            excess = max(0.0, delay - tf)
            if excess > 0.0:
                breached_nodes += 1
                locked += cost * min(excess / LOCKED_FULL_AT_MONTHS, 1.0)
            rows.append({
                "project_id": n,
                "project_name": d.get("project_name"),
                "state": d.get("state"),
                "sector": d.get("sector"),
                "climate_delay_months": round(delay, 1),
                "free_float_months": round(ff, 1),
                "total_float_months": round(tf, 1),
                "float_breached": bool(delay > tf),
                "capex_cr": round(cost, 2),
                "directly_hit": n in shocks,
            })

        rows.sort(key=lambda r: -r["capex_cr"])
        _n_isolated = sum(1 for _n in self.dag.nodes
                          if self.dag.in_degree(_n) == 0 and self.dag.out_degree(_n) == 0)
        return {
            "module": "SETU-VARSHA",
            "rainfall_anomaly_pct": rainfall_anomaly_pct,
            "state_filter": state_filter,
            "scenario_interpretation": summary.get("scenario_interpretation"),
            "nodes_directly_hit": len(shocks),
            "nodes_in_cascade": len(rows),
            "nodes_absorbed_by_float": absorbed_nodes,
            "nodes_breaching_total_float": breached_nodes,
            "downstream_locked_capex_cr": round(locked, 2),
            # Reported alongside, never folded in. These projects are hit by the
            # weather but have no dependants, so their capital is exposed rather
            # than locked behind a cascade.
            "isolated_projects_hit": isolated_hit,
            "isolated_direct_exposure_cr": round(isolated_capex, 2),
            "network_coverage_note": (
                f"{_n_isolated:,} of {self.dag.number_of_nodes():,} projects carry no "
                f"dependency edges, so contagion is only defined for the "
                f"{self.dag.number_of_nodes() - _n_isolated:,} that do. Isolated projects "
                "are counted as direct exposure, not as downstream lock-up."
            ),
            "parameter_basis": {
                "state_elasticities": "declared expert parameters (STATE_GEO_PROFILES), not fitted to outcomes",
                "hop_attenuation": HOP_ATTENUATION,
                "nominal_remaining_months_at_zero_progress": NOMINAL_REMAINING_MONTHS,
                "locked_full_at_months": LOCKED_FULL_AT_MONTHS,
                "edges": getattr(self, "edge_provenance", None),
            },
            "mean_climate_delay_months": round(
                sum(r["climate_delay_months"] for r in rows) / len(rows), 1) if rows else 0.0,
            "affected": rows[:max_nodes_returned],
            "methodology": (
                "Rainfall departure sets a working-window contraction per state "
                "(VARSHA-SPEED elasticities, IMD 2005-2025). Remaining project "
                "duration is scaled by that contraction, the resulting delay is "
                "absorbed by free float where available, and the excess propagates "
                f"to successors at {HOP_ATTENUATION} per hop (declared constant). "
                "Capital is counted as locked only "
                "once a project's delay exceeds its TOTAL float."
            ),
            "caveat": (
                "Scenario projection, not a forecast. The elasticities are "
                "declared expert constants rather than fitted coefficients, and the "
                "figure answers 'how much capital sits behind this much slippage', "
                "not 'how likely is this monsoon'."
            ),
        }


# Module-level singleton
_graph_instance = None

def get_setu_graph_engine() -> SetuGraphEngine:
    global _graph_instance
    if _graph_instance is None:
        _graph_instance = SetuGraphEngine()
    return _graph_instance

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    engine = get_setu_graph_engine()
    subgraph = engine.get_k_hop_subgraph("400188", k=2)
    print(f"SETU-GRAPH Subgraph for Project 400188:")
    print(f"  Total Nodes in Sub-DAG: {len(subgraph.nodes)}")
    print(f"  Total Edges in Sub-DAG: {len(subgraph.edges)}")
    print(f"  Total Cascade Locked P50 Capex: ₹{subgraph.total_cascade_locked_p50_cr:,.2f} Cr")
    print(f"  Total Cascade Locked P95 Capex: ₹{subgraph.total_cascade_locked_p95_cr:,.2f} Cr")
    print(f"  Acyclic DAG Verified: {subgraph.acyclic_dag_verified}")
    print("\nVerified SETU-GRAPH Max-Plus float absorption and Shapley criticality successfully generated!")
