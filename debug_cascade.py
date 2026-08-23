import sys
sys.stdout.reconfigure(encoding="utf-8")
from analytics_engine.setu_graph import get_setu_graph_engine

g = get_setu_graph_engine()

# Find a project with successors
for n in g.dag.nodes():
    out_d = g.dag.out_degree(n)
    if out_d > 0:
        succs = list(g.dag.successors(n))
        succ_succs = []
        for s in succs:
            succ_succs.extend(list(g.dag.successors(s)))
        name = g.dag.nodes[n].get("project_name", "?")[:50]
        print(f"Project {n}: out={out_d}, successors={succs[:3]}, succ-of-succs={succ_succs[:3]}, name={name}")
        
        # Test cascade on this project
        sub0 = g.get_k_hop_subgraph(n, k=2, delay_shock_months=0.0)
        sub1 = g.get_k_hop_subgraph(n, k=2, delay_shock_months=24.0)
        
        affected = 0
        for n0, n1 in zip(sub0.nodes, sub1.nodes):
            if n1.locked_capital_p50_cr > n0.locked_capital_p50_cr + 0.01:
                affected += 1
                if n1.project_id != n:
                    print(f"  DOWNSTREAM affected: {n1.project_id} locked={n0.locked_capital_p50_cr} -> {n1.locked_capital_p50_cr}")
        
        print(f"  Total nodes affected by cascade: {affected}")
        if affected > 1:
            print("  CASCADE WORKS!")
            break
        else:
            print("  Only center node affected")
        break
