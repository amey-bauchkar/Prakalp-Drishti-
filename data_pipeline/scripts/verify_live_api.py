import urllib.request, json

req = urllib.request.urlopen('http://127.0.0.1:8000/api/amey/forecast/706724')
data = json.loads(req.read().decode('utf-8'))

print("=== NEW FORECAST FOR 706724 (Guwahati Airport) ===")
print(f"Project: {data.get('project_id')} - {data.get('project_name')}")
print(f"Physical Progress: {data.get('physical_progress_perc')}%")
print(f"Target Date: {data.get('revised_end_date')}")
print(f"P10 Date: {data.get('p10_date')}")
print(f"P50 Date: {data.get('p50_date')}")
print(f"P80 Date: {data.get('p80_date')}")
print(f"P95 Date: {data.get('p95_date')}")
print(f"Target Met Prob: {data.get('prob_target_met_official')*100:.1f}%")
