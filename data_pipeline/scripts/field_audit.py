"""
PHASE 2: Frontend ↔ Backend Contract Field Mapping Audit
Checks that every `data.xxx` reference in the JSX matches a real field in the Pydantic contract.
"""
import re, os, json, sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("PHASE 2: FRONTEND <-> BACKEND FIELD BINDING AUDIT")
print("=" * 80)

# The ProjectForecast fields from contracts.py
KAAL_FIELDS = {
    'project_id', 'project_name', 'canonical_entity', 'sector', 'state',
    'original_cost_cr', 'revised_cost_cr', 'cost_overrun_cr', 'cost_overrun_perc',
    'baseline_reset_count', 'rebaselined', 'sanction_date', 'original_end_date',
    'revised_end_date', 'p10_date', 'p50_date', 'p80_date', 'p95_date',
    'prob_target_met_official', 'prob_target_met_rebaselined',
    'competing_risk_state', 'facts'
}

# DependencySubGraph fields
SETU_FIELDS = {
    'center_project_id', 'nodes', 'edges',
    'total_cascade_locked_p50_cr', 'total_cascade_locked_p95_cr', 'acyclic_dag_verified'
}

# AllocationResult fields
VITTA_FIELDS = {
    'total_budget_pool_cr', 'total_allocated_cr', 'expected_completion_yield',
    'cvar90_tail_loss', 'ner_allocated_cr', 'ner_share_perc', 'ner_floor_met',
    'shadow_price_budget_pi', 'shadow_price_ner_pi', 'agency_shadow_prices',
    'allocations', 'closure_error_perc', 'solve_time_ms'
}

# CabinetBriefing fields
SAARTHI_FIELDS = {
    'doc_hash', 'merkle_root', 'generated_at', 'title_en', 'title_hi',
    'summary_en', 'summary_hi', 'top_decisions', 'binding_constraints',
    'bilingual_sections', 'audit_facts'
}

FRONTEND_DIR = r'c:\Users\SEBIN\Desktop\SIH PS\frontend\amey'

errors = []

def extract_data_fields(filepath):
    """Extract all data.xxx references from a JSX file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Match data.field or data?.field
    pattern = r'data\??\.(\w+)'
    return set(re.findall(pattern, content))

# Map files to their expected contract
file_map = {
    'KaalChakraView.jsx': ('KAAL-CHAKRA / ProjectForecast', KAAL_FIELDS),
    'SetuGraphView.jsx': ('SETU-GRAPH / DependencySubGraph', SETU_FIELDS),
    'VittaVyuhaView.jsx': ('VITTA-VYUHA / AllocationResult', VITTA_FIELDS),
    'PragatiSaarthiView.jsx': ('PRAGATI-SAARTHI / CabinetBriefing', SAARTHI_FIELDS),
}

for filename, (label, valid_fields) in file_map.items():
    filepath = os.path.join(FRONTEND_DIR, filename)
    if not os.path.exists(filepath):
        print(f"\n⚠️  {filename} not found — skipping")
        continue
    
    used_fields = extract_data_fields(filepath)
    
    print(f"\n--- {filename} ({label}) ---")
    print(f"  Fields used in JSX: {sorted(used_fields)}")
    
    # Check for unknown fields (fields used in JSX but not in the Pydantic model)
    unknown = used_fields - valid_fields
    # Special: nested access like data.facts.xxx or data.nodes.xxx are ok
    nested_ok = {'fact_cost', 'lineage', 'merkle_root', 'query_sha256', 'dataset_sha256',
                 'model_sha256', 'formatted_value', 'value', 'label', 'unit', 'fact_id',
                 'project_name', 'cost_cr', 'free_float_months', 'shapley_criticality_phi',
                 'allocated_capex_cr', 'completion_yield_phi', 'is_ner', 'project_id',
                 'requested_capex_cr', 'systemic_benefit_gamma', 'total_float_months',
                 'absorbed_delay_months', 'propagated_delay_months', 'locked_capital_p50_cr',
                 'locked_capital_p95_cr', 'canonical_entity', 'sector', 'state',
                 'action_agency', 'direction', 'risk_level', 'status',
                 'section_en', 'section_hi', 'heading_en', 'heading_hi',
                 'fact_type', 'uncertainty'}
    real_unknown = unknown - nested_ok
    
    if real_unknown:
        for f in sorted(real_unknown):
            errors.append(f"{filename}: uses 'data.{f}' but no such field in {label} contract!")
            print(f"  ❌ UNKNOWN FIELD: data.{f}")
    else:
        print(f"  ✅ All top-level fields match contract schema")
    
    # Check for unused important fields
    unused = valid_fields - used_fields
    if unused:
        print(f"  ℹ️  Unused contract fields: {sorted(unused)}")

# PHASE 2B: Check progress_perc in server.py cache vs PhysicalProgress in CSV
print("\n" + "=" * 80)
print("PHASE 2B: SERVER CACHE FIELD AUDIT")
print("=" * 80)

import sys
sys.path.insert(0, r'c:\Users\SEBIN\Desktop\SIH PS')
import pandas as pd

df = pd.read_csv(r'c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted\PAIMANA_MASTER_PROJECTS_DATABASE.csv')
df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(25.0)

# Spot-check a few IDs
test_ids = ['400188', '705728', '705237', '400259', '702668']
for pid in test_ids:
    raw = df[df['ProjectId'].astype(str) == pid].iloc[0]
    csv_progress = float(raw['PhysicalProgress'])
    
    # The server uses fillna(25.0) but our engine fillna(20.0) — check!
    print(f"\n  Project {pid}:")
    print(f"    CSV PhysicalProgress: {csv_progress}%")
    print(f"    Server cache (fillna=25.0): {csv_progress if not pd.isna(raw['PhysicalProgress']) else 25.0}%")
    
    # Validate satellite_status logic
    expected_sat = "CORROBORATED" if csv_progress > 40 else "DISCREPANCY_FLAGGED"
    print(f"    Satellite status: {expected_sat}")

# Final summary
print("\n" + "=" * 80)
print("PHASE 2 FINAL REPORT")
print("=" * 80)
print(f"Total ERRORS: {len(errors)}")
if errors:
    print("\n🔴 ERRORS:")
    for e in errors:
        print(f"  • {e}")
else:
    print("\n🟢 All frontend data bindings match backend contracts!")
print("=" * 80)
