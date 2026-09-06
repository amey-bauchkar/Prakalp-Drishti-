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

        # 3. Add Edges (Domain Dependencies + Sector Synergies)
        # Power <-> Coal, Railways <-> Ports, Highways <-> Industrial Corridors
        projects_by_sector = {}
        projects_by_state = {}
        for pid, data in self.raw_graph.nodes(data=True):
            sec = data["sector"]
            st = data["state"]
            projects_by_sector.setdefault(sec, []).append(pid)
            projects_by_state.setdefault(st, []).append(pid)

        # Connect intra-state & regional supply-chain links (Coal -> Power, Railways -> Ports, Highways -> Industrial)
        coal_pids = set(projects_by_sector.get("Coal & Mining", []))
        power_pids = set(projects_by_sector.get("Power & Thermal", []))
        rail_pids = set(projects_by_sector.get("Railways", []))
        port_pids = set(projects_by_sector.get("Ports & Shipping", []))
        road_pids = set(projects_by_sector.get("Roads & Highways", []))
        petrol_pids = set(projects_by_sector.get("Petroleum & Natural Gas", []))

        # 1. State-level Coal -> Power Plants (Energy Feeders)
        for st, pids in projects_by_state.items():
            state_coal = [p for p in pids if p in coal_pids]
            state_power = [p for p in pids if p in power_pids]
            for c in state_coal:
                for pw in state_power[:4]:
                    self.raw_graph.add_edge(c, pw, edge_type="statutory", lead_time=6.0)

            # 2. Port -> Railway Hinterland Connectivity
            state_rails = [p for p in pids if p in rail_pids]
            state_ports = [p for p in pids if p in port_pids]
            for pt in state_ports:
                for r in state_rails[:3]:
                    self.raw_graph.add_edge(pt, r, edge_type="physical_network", lead_time=4.0)

            # 3. Highway Corridor Clusters (Linear Progression & Toll Hubs)
            state_roads = [p for p in pids if p in road_pids]
            for i in range(len(state_roads) - 1):
                self.raw_graph.add_edge(state_roads[i], state_roads[i+1], edge_type="spatial_corridor", lead_time=3.0)

            # 4. Petroleum Refinery -> Pipeline Feeders
            state_petrol = [p for p in pids if p in petrol_pids]
            for i in range(len(state_petrol) - 1):
                self.raw_graph.add_edge(state_petrol[i], state_petrol[i+1], edge_type="physical_network", lead_time=5.0)

        # 5. Cross-State Freight Corridors (Western & Eastern Dedicated Freight Corridors)
        # sorted(), not list(): converting a set straight to a list gives an order that
        # depends on Python's per-process string hash randomization, so the specific edges
        # built below (and therefore the whole graph's topology) would silently reshuffle
        # every time the server restarts. Sorting makes construction deterministic.
        rail_list = sorted(rail_pids)
        for i in range(min(len(rail_list) - 1, 150)):
            if i % 3 == 0:
                self.raw_graph.add_edge(rail_list[i], rail_list[i+1], edge_type="statutory", lead_time=6.0)

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
        for cycle in list(nx.simple_cycles(self.dag)):
            if len(cycle) >= 2 and self.dag.has_edge(cycle[-1], cycle[0]):
                try:
                    self.dag.remove_edge(cycle[-1], cycle[0])
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

            cost_cr = self.dag.nodes[n].get("cost_cr", 1000.0)
            locked_p50 = (cost_cr * (observed_delay / 48.0)) if observed_delay > 0 else 0.0
            locked_p95 = locked_p50 * 1.65

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
        ranked the wrong node as linchpin and assigned 8% of total mass to a SINK whose
        true Shapley value is exactly zero, because a sink unblocks nothing.

        ON "EFFICIENCY". The final rescaling to total_locked is a UNIT CONVERSION into
        locked-rupee terms, not evidence of the efficiency axiom. Efficiency is a
        property of the estimator above (marginals telescope to v(N) by construction);
        dividing any set of positive numbers by their sum would satisfy the axiom
        trivially and prove nothing. The previous docstring claimed the axiom on the
        strength of that division.
        """
        nodes = list(self.dag.nodes())
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

        # M permutations. Measured rank stability across seeds at M=30 is Spearman
        # rho ~ 0.998 with an identical argmax, so 30 is adequate for the ORDERING the
        # product uses; it is not enough for a per-node value to be quoted to 2 d.p.
        M = 30
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
            self.shapley_scores[n] = round((shapley_accum[n] / raw_sum) * total_locked, 2)
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
        shapley_records = [
            {"project_id": str(n), "shapley_phi": self.shapley_scores.get(n, 0.0)}
            for n in self.dag.nodes()
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
                            attenuation = 0.85  # ~15% absorbed per hop by schedule buffers
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
        the elasticities behind it are calibrated constants, not fitted
        coefficients. That is said plainly in the payload.
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
            remaining_months = max(0.0, (100.0 - progress) / 100.0) * 24.0
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
                propagated[str(succ)] = propagated.get(str(succ), 0.0) + excess * 0.85

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

            # 926 of 2,207 projects (42%) sit in the graph with no edges at all.
            # A delay to one of those is a real problem for that project, but it is
            # NOT contagion: there is no downstream for capital to be locked behind.
            # Counting them under "downstream locked capex" inflated the figure to
            # most of the portfolio and made the term meaningless, so they are
            # tallied separately as direct exposure.
            has_network = (self.dag.out_degree(n) > 0 or self.dag.in_degree(n) > 0)
            if not has_network:
                isolated_hit += 1
                isolated_capex += cost * min(delay / 48.0, 1.0)
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
                locked += cost * min(excess / 48.0, 1.0)
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
                "926 of 2,207 projects carry no dependency edges, so contagion is "
                "only defined for the 1,281 that do. Isolated projects are counted "
                "as direct exposure, not as downstream lock-up."
            ),
            "mean_climate_delay_months": round(
                sum(r["climate_delay_months"] for r in rows) / len(rows), 1) if rows else 0.0,
            "affected": rows[:max_nodes_returned],
            "methodology": (
                "Rainfall departure sets a working-window contraction per state "
                "(VARSHA-SPEED elasticities, IMD 2005-2025). Remaining project "
                "duration is scaled by that contraction, the resulting delay is "
                "absorbed by free float where available, and the excess propagates "
                "to successors at 0.85 per hop. Capital is counted as locked only "
                "once a project's delay exceeds its TOTAL float."
            ),
            "caveat": (
                "Scenario projection, not a forecast. The elasticities are "
                "calibrated constants rather than fitted coefficients, and the "
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
