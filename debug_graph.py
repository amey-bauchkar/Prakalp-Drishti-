import sys
sys.stdout.reconfigure(encoding="utf-8")
from analytics_engine.setu_graph import get_setu_graph_engine

g = get_setu_graph_engine()
print(f"Total nodes: {g.dag.number_of_nodes()}, Total edges: {g.dag.number_of_edges()}")

degs = sorted(
    [(n, g.dag.out_degree(n) + g.dag.in_degree(n)) for n in g.dag.nodes()],
    key=lambda x: -x[1]
)
print("Top 10 connected nodes:")
for n, d in degs[:10]:
    name = g.dag.nodes[n].get("project_name", "?")[:60]
    out_d = g.dag.out_degree(n)
    in_d = g.dag.in_degree(n)
    print(f"  {n}: total_deg={d} (in={in_d}, out={out_d}), name={name}")

# Check if 400188 even has the right sector for connections
n400 = g.dag.nodes.get("400188", {})
print(f"\n400188 sector: {n400.get('sector')}, state: {n400.get('state')}")
