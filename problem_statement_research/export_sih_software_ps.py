import requests
from bs4 import BeautifulSoup
import json
import csv
import re
import os
import html
from playwright.sync_api import sync_playwright

def clean_title_or_string(text):
    if not text:
        return ""
    text = text.replace('\ufffd', ' ')
    text = text.replace('\u00a0', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def clean_description_html(desc_soup):
    if not desc_soup:
        return "<p>No description provided.</p>"
    
    # Get raw HTML content
    raw_html = desc_soup.decode_contents() if hasattr(desc_soup, 'decode_contents') else str(desc_soup)
    
    # Replace unicode replacement character with bullet or dash
    raw_html = raw_html.replace('\ufffd', '&bull;')
    raw_html = raw_html.replace('&#8226;', '&bull;')
    raw_html = raw_html.replace('\u00a0', ' ')
    
    # Clean up repeated <br> tags
    raw_html = re.sub(r'(<br\s*/?>\s*){3,}', '<br><br>', raw_html, flags=re.IGNORECASE)
    
    return raw_html.strip()

def scrape_software_problem_statements():
    url = 'https://sih.gov.in/sih2026PS'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    print(f"Fetching {url}...")
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, 'html.parser')
    table = soup.find('table')
    if not table:
        raise ValueError("Main table not found on page")
    tbody = table.find('tbody')
    rows = tbody.find_all('tr', recursive=False)
    print(f"Found {len(rows)} total rows in table.")

    software_items = []

    for idx, row in enumerate(rows):
        tds = row.find_all('td', recursive=False)
        if len(tds) < 8:
            continue
        
        category = clean_title_or_string(tds[3].get_text(strip=True))
        if category.lower() != 'software':
            continue

        s_no = clean_title_or_string(tds[0].get_text(strip=True))
        org = clean_title_or_string(tds[1].get_text(strip=True))
        
        title_elem = tds[2].find('a')
        title = title_elem.get_text(strip=True) if title_elem else tds[2].get_text(strip=True)
        title = clean_title_or_string(title)
        
        ps_id = clean_title_or_string(tds[4].get_text(strip=True))
        ideas_count = clean_title_or_string(tds[5].get_text(strip=True))
        theme = clean_title_or_string(tds[6].get_text(strip=True))
        deadline = clean_title_or_string(tds[7].get_text(strip=True))

        modal = tds[2].find('div', class_='modal')
        modal_dict = {}
        desc_html = ""
        
        if modal:
            modal_table = modal.find('table')
            if modal_table:
                for tr in modal_table.find_all('tr'):
                    th = tr.find('th')
                    td = tr.find('td')
                    if th and td:
                        key = clean_title_or_string(th.get_text(strip=True))
                        desc_div = td.find('div')
                        if 'Description' in key and desc_div:
                            desc_html = clean_description_html(desc_div)
                            modal_dict['Description'] = clean_title_or_string(desc_div.get_text())
                        else:
                            modal_dict[key] = clean_title_or_string(td.get_text(strip=True))

        item = {
            'index': len(software_items) + 1,
            'table_s_no': s_no,
            'ps_id': ps_id,
            'title': title,
            'organization': org,
            'department': modal_dict.get('Department', org),
            'category': 'Software',
            'theme': theme,
            'ideas_count': ideas_count,
            'deadline': deadline,
            'description_text': modal_dict.get('Description', ''),
            'description_html': desc_html or f"<p>{html.escape(modal_dict.get('Description', ''))}</p>",
            'youtube_link': modal_dict.get('Youtube Link', ''),
            'dataset_link': modal_dict.get('Dataset Link', ''),
            'contact_info': modal_dict.get('Contact info', '')
        }
        software_items.append(item)

    print(f"Successfully scraped {len(software_items)} Software Problem Statements.")
    return software_items

def save_data_files(items):
    # JSON
    json_path = 'SIH_2026_Software_Problem_Statements.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2, ensure_ascii=False)
    print(f"Saved {json_path}")

    # CSV
    csv_path = 'SIH_2026_Software_Problem_Statements.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'index', 'ps_id', 'title', 'organization', 'department', 
            'category', 'theme', 'ideas_count', 'deadline', 
            'description_text', 'youtube_link', 'dataset_link', 'contact_info'
        ])
        writer.writeheader()
        for it in items:
            row_dict = {
                'index': it['index'],
                'ps_id': it['ps_id'],
                'title': it['title'],
                'organization': it['organization'],
                'department': it['department'],
                'category': it['category'],
                'theme': it['theme'],
                'ideas_count': it['ideas_count'],
                'deadline': it['deadline'],
                'description_text': it['description_text'],
                'youtube_link': it['youtube_link'],
                'dataset_link': it['dataset_link'],
                'contact_info': it['contact_info']
            }
            writer.writerow(row_dict)
    print(f"Saved {csv_path}")

def generate_pdf_report(items):
    # Themes summary
    themes_count = {}
    for it in items:
        t = it['theme']
        themes_count[t] = themes_count.get(t, 0) + 1

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Smart India Hackathon 2026 - All 172 Software Problem Statements</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  @page {{
    size: A4 portrait;
    margin: 18mm 14mm 20mm 14mm;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.5;
    background-color: #ffffff;
    font-size: 9.5pt;
  }}

  .cover {{
    page-break-after: always;
    padding: 10px 10px 30px 10px;
    text-align: center;
  }}

  .cover-header {{
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%);
    color: #ffffff;
    padding: 35px 25px;
    border-radius: 16px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
    margin-bottom: 25px;
  }}

  .sih-badge {{
    display: inline-block;
    background: rgba(255, 255, 255, 0.15);
    color: #bfdbfe;
    padding: 5px 15px;
    border-radius: 9999px;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 12px;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }}

  .cover-title {{
    font-size: 24pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin-bottom: 10px;
  }}

  .cover-subtitle {{
    font-size: 11.5pt;
    font-weight: 400;
    color: #e2e8f0;
    margin-bottom: 22px;
  }}

  .stats-grid {{
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 15px;
  }}

  .stat-card {{
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 12px 20px;
    border-radius: 10px;
    text-align: center;
    min-width: 130px;
  }}

  .stat-val {{
    font-size: 20pt;
    font-weight: 800;
    color: #38bdf8;
    line-height: 1;
  }}

  .stat-label {{
    font-size: 8pt;
    font-weight: 700;
    color: #f1f5f9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }}

  .toc-section {{
    margin-top: 20px;
    text-align: left;
  }}

  .section-title {{
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 5px;
    margin-bottom: 12px;
  }}

  .themes-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 22px;
    font-size: 8.5pt;
  }}

  .themes-table th, .themes-table td {{
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
  }}

  .themes-table th {{
    background-color: #f1f5f9;
    font-weight: 700;
    text-align: left;
    color: #334155;
  }}

  .themes-table tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  .index-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }}

  .index-table th, .index-table td {{
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }}

  .index-table th {{
    background-color: #1e293b;
    color: #ffffff;
    font-weight: 700;
  }}

  .index-table tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  .ps-card {{
    page-break-inside: avoid;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 15px 18px;
    margin-bottom: 18px;
    background-color: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }}

  .ps-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid #f1f5f9;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }}

  .ps-id-badge {{
    background-color: #0284c7;
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 9pt;
    padding: 3px 10px;
    border-radius: 5px;
    display: inline-block;
  }}

  .ps-theme-badge {{
    background-color: #f8fafc;
    color: #0f766e;
    font-size: 8pt;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 5px;
    border: 1px solid #99f6e4;
    display: inline-block;
  }}

  .ps-title {{
    font-size: 11.5pt;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.35;
    margin-bottom: 8px;
  }}

  .ps-meta {{
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    background-color: #f8fafc;
    border: 1px solid #edf2f7;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 8.5pt;
    margin-bottom: 12px;
  }}

  .meta-item {{
    display: flex;
    gap: 4px;
  }}

  .meta-label {{
    color: #64748b;
    font-weight: 700;
  }}

  .meta-val {{
    color: #1e293b;
    font-weight: 500;
  }}

  .ps-body {{
    font-size: 9pt;
    color: #334155;
    line-height: 1.55;
  }}

  .ps-body b, .ps-body strong {{
    color: #0369a1;
    font-weight: 700;
    display: inline-block;
    margin-top: 6px;
    margin-bottom: 2px;
  }}

  .ps-body p {{
    margin-bottom: 6px;
  }}

  .links-row {{
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1px dashed #e2e8f0;
    font-size: 8pt;
    color: #64748b;
  }}

  .links-row a {{
    color: #0284c7;
    text-decoration: underline;
  }}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-header">
    <div class="sih-badge">Official Compendium &bull; Smart India Hackathon 2026</div>
    <h1 class="cover-title">172 Software Problem Statements</h1>
    <p class="cover-subtitle">Complete Scanned & Structured Repository of all 172 Software Edition Problem Statements (From all 23 Pages)</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">172</div>
        <div class="stat-label">Software PS</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">{len(themes_count)}</div>
        <div class="stat-label">Themes Covered</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">23</div>
        <div class="stat-label">Pages Scanned</div>
      </div>
    </div>
  </div>

  <div class="toc-section">
    <h2 class="section-title">Theme Breakdown Summary</h2>
    <table class="themes-table">
      <thead>
        <tr>
          <th>Theme Name</th>
          <th style="width: 80px; text-align: center;">PS Count</th>
          <th>Theme Name</th>
          <th style="width: 80px; text-align: center;">PS Count</th>
        </tr>
      </thead>
      <tbody>
"""

    theme_keys = list(themes_count.keys())
    for i in range(0, len(theme_keys), 2):
        t1 = theme_keys[i]
        c1 = themes_count[t1]
        t2 = theme_keys[i+1] if i+1 < len(theme_keys) else ""
        c2 = str(themes_count[t2]) if t2 else ""
        html_content += f"""
        <tr>
          <td><strong>{html.escape(t1)}</strong></td>
          <td style="text-align: center;">{c1}</td>
          <td><strong>{html.escape(t2)}</strong></td>
          <td style="text-align: center;">{c2}</td>
        </tr>
"""

    html_content += f"""
      </tbody>
    </table>

    <h2 class="section-title" style="margin-top: 15px;">Quick Reference Master Index (1 - 172)</h2>
    <table class="index-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th style="width: 75px;">PS ID</th>
          <th>Problem Statement Title</th>
          <th style="width: 130px;">Theme</th>
          <th style="width: 170px;">Organization</th>
        </tr>
      </thead>
      <tbody>
"""

    for it in items:
        html_content += f"""
        <tr>
          <td style="text-align: center;"><strong>{it['index']}</strong></td>
          <td><code>{html.escape(it['ps_id'])}</code></td>
          <td>{html.escape(it['title'])}</td>
          <td>{html.escape(it['theme'])}</td>
          <td>{html.escape(it['organization'])}</td>
        </tr>
"""

    html_content += """
      </tbody>
    </table>
  </div>
</div>

<!-- DETAILED PROBLEM STATEMENTS SECTION -->
<div style="padding: 10px 0;">
  <h2 class="section-title" style="margin-bottom: 15px; font-size: 14pt;">Full Details for All 172 Software Problem Statements</h2>
"""

    for it in items:
        links_parts = []
        if it['youtube_link']:
            links_parts.append(f"<strong>YouTube:</strong> <a href='{html.escape(it['youtube_link'])}'>{html.escape(it['youtube_link'])}</a>")
        if it['dataset_link']:
            links_parts.append(f"<strong>Dataset:</strong> <a href='{html.escape(it['dataset_link'])}'>{html.escape(it['dataset_link'])}</a>")
        if it['contact_info']:
            links_parts.append(f"<strong>Contact:</strong> {html.escape(it['contact_info'])}")
        links_html = f"<div class='links-row'>{' &bull; '.join(links_parts)}</div>" if links_parts else ""

        html_content += f"""
  <div class="ps-card" id="ps-{it['index']}">
    <div class="ps-header">
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="ps-id-badge">#{it['index']} &bull; {html.escape(it['ps_id'])}</span>
        <span style="font-size: 8pt; color: #64748b; font-weight: 500;">(Original S.No: {it['table_s_no']})</span>
      </div>
      <span class="ps-theme-badge">Theme: {html.escape(it['theme'])}</span>
    </div>
    
    <div class="ps-title">{html.escape(it['title'])}</div>
    
    <div class="ps-meta">
      <div class="meta-item">
        <span class="meta-label">Organization:</span>
        <span class="meta-val">{html.escape(it['organization'])}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Category:</span>
        <span class="meta-val">{html.escape(it['category'])}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Submitted Ideas:</span>
        <span class="meta-val">{html.escape(it['ideas_count'])}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Submission Deadline:</span>
        <span class="meta-val">{html.escape(it['deadline'])}</span>
      </div>
    </div>

    <div class="ps-body">
      {it['description_html']}
    </div>
    {links_html}
  </div>
"""

    html_content += """
</div>
</body>
</html>
"""

    html_file_path = "sih_software_ps_rendered.html"
    with open(html_file_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Saved HTML template to {html_file_path}")

    pdf_output_path = "SIH_2026_Software_Problem_Statements.pdf"
    print("Launching Playwright Chromium to render PDF...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html_content, wait_until="networkidle")
        page.pdf(
            path=pdf_output_path,
            format="A4",
            print_background=True,
            margin={
                "top": "16mm",
                "bottom": "18mm",
                "left": "14mm",
                "right": "14mm"
            },
            display_header_footer=True,
            header_template="<div style='font-size: 7pt; color: #94a3b8; width: 100%; text-align: right; padding-right: 15mm;'>Smart India Hackathon 2026 — Software Problem Statements (All 172)</div>",
            footer_template="<div style='font-size: 7pt; color: #94a3b8; width: 100%; text-align: center;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>"
        )
        browser.close()
    
    print(f"SUCCESS! Rendered clean PDF to {pdf_output_path}")

if __name__ == '__main__':
    items = scrape_software_problem_statements()
    save_data_files(items)
    generate_pdf_report(items)
