import os

with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the constant declaration
if "const masterProjects = [" in html:
    html = html.replace("const masterProjects = [", "const allProjectsRaw = [")
    
    # Now find the end of the array and inject our filter
    # The array ends where the pagination variables start
    target_str = """        let currentPage = 1;"""
    
    golden_ids = "['619069', '618933', '618621', '618542', '618379', '619010', '619150', '619099', '606781', '702639']"
    
    injection = f"""
        const masterProjects = allProjectsRaw.filter(p => {golden_ids}.includes(p.project_id.toString()));
        let currentPage = 1;"""
        
    html = html.replace(target_str, injection)
    
    # Also update headers
    html = html.replace("PRAKALP-DRISHTI: MoSPI Satellite Earth Observation War Room (2,207 Projects)", "PRAKALP-DRISHTI: The Golden 10 Showcase (Massive Visual Changes)")
    html = html.replace("2,207", "10")
    html = html.replace("Monitoring 10 Mega-Projects", "Showcasing 10 High-Impact Mega-Projects")
    html = html.replace("10 Active Monitored", "10 Golden Projects")
    html = html.replace("kpiTotal\">10", "kpiTotal\">10")
    
    with open('ALL_2207_PROJECTS_SHOWCASE_GALLERY.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Gallery successfully updated to show only the Golden 10 projects.")
else:
    print("Could not find const masterProjects = [ in the HTML.")
