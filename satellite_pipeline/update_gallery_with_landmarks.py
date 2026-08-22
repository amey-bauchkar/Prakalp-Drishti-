import os
import json

dossier_path = 'paimana_extracted/satellite_data/ALL_2207_PROJECT_SHOWCASE_DOSSIERS.json'
with open(dossier_path, 'r', encoding='utf-8') as f:
    dossiers = json.load(f)

print(f"Loaded {len(dossiers)} total dossiers from JSON.")

gallery_path = 'ALL_2207_PROJECTS_SHOWCASE_GALLERY.html'
with open(gallery_path, 'r', encoding='utf-8') as f:
    html = f.read()

idx_start = html.find('const allProjectsRaw = [')
if idx_start == -1:
    idx_start = html.find('const masterProjects = [')

target_marker = 'let currentMode = '
marker_idx = html.find(target_marker)

if idx_start != -1 and marker_idx != -1:
    html_before = html[:idx_start]
    html_after = html[marker_idx:]
    
    json_array_str = 'const allProjectsRaw = ' + json.dumps(dossiers, indent=2) + ';\n\n'
    golden_ids_str = "        const goldenIds = ['PROJ_ATAL_SETU', 'PROJ_BHADLA_004', 'PROJ_DME_003', 'PROJ_AIRPORT_PATNA', 'PROJ_WDFC_001', 'PROJ_SUBANSIRI_002', 'PROJ_GPRA_DELHI', 'PROJ_SINGRAULI_005', 'PROJ_DWARKA_EXP', 'PROJ_GHOST_HW_007'];\n        "
    
    new_html = html_before + json_array_str + golden_ids_str + html_after
    
    with open(gallery_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print("SUCCESS: Gallery updated with the 10 Landmark Mega Projects!")
else:
    print(f"ERROR: Could not locate markers in HTML. idx_start={idx_start}, marker_idx={marker_idx}")
