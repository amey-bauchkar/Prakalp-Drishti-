"""
PAIMANA Data Scraper - Intercepts API calls from the dashboard
Uses Playwright to capture the actual API responses that power the dashboard
"""
import json
import csv
import os

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Installing playwright...")
    os.system("pip install playwright")
    os.system("python -m playwright install chromium")
    from playwright.sync_api import sync_playwright

OUTPUT_DIR = r"c:\Users\SEBIN\Desktop\SIH PS\paimana_data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

captured_responses = []

def handle_response(response):
    """Capture all API responses from the dashboard"""
    url = response.url
    content_type = response.headers.get("content-type", "")
    
    if any(x in content_type for x in ["json", "text/plain"]) and "mospi" in url:
        try:
            body = response.text()
            captured_responses.append({
                "url": url,
                "status": response.status,
                "content_type": content_type,
                "body": body[:500],  # first 500 chars for preview
                "full_body": body
            })
            print(f"  CAPTURED: {url[:100]} ({len(body)} bytes)")
        except Exception as e:
            print(f"  ERROR reading {url[:80]}: {e}")

def main():
    print("=" * 60)
    print("PAIMANA Data Scraper - Intercepting Dashboard API Calls")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Intercept all responses
        page.on("response", handle_response)
        
        print("\n[1] Loading PAIMANA Public Dashboard...")
        page.goto("https://paimana-proj.mospi.gov.in/Home/PublicDashboardNew", 
                   wait_until="networkidle", timeout=30000)
        
        print(f"\n[2] Captured {len(captured_responses)} API responses so far")
        
        # Click on Data tabs to trigger more API calls
        try:
            # Wait for page to render
            page.wait_for_timeout(3000)
            
            # Try clicking Data buttons
            data_buttons = page.query_selector_all("text=Data")
            print(f"\n[3] Found {len(data_buttons)} 'Data' buttons, clicking each...")
            for i, btn in enumerate(data_buttons):
                try:
                    btn.click()
                    page.wait_for_timeout(1500)
                    print(f"  Clicked Data button {i+1}")
                except:
                    pass
        except Exception as e:
            print(f"  Button click error: {e}")
        
        # Also try to extract data directly from DOM
        print("\n[4] Extracting table data directly from DOM...")
        tables_data = page.evaluate("""
            () => {
                const tables = document.querySelectorAll('table');
                const results = [];
                tables.forEach((table, idx) => {
                    const rows = [];
                    table.querySelectorAll('tr').forEach(tr => {
                        const cells = [];
                        tr.querySelectorAll('td, th').forEach(td => {
                            cells.push(td.innerText.trim());
                        });
                        if (cells.length > 0) rows.push(cells);
                    });
                    if (rows.length > 0) results.push({table_index: idx, rows: rows});
                });
                return results;
            }
        """)
        
        # Also extract summary cards
        print("\n[5] Extracting summary card values...")
        summary_data = page.evaluate("""
            () => {
                const cards = document.querySelectorAll('.card, [class*="stat"], [class*="summary"], [class*="count"]');
                const results = [];
                cards.forEach(card => {
                    results.push(card.innerText.trim());
                });
                return results;
            }
        """)
        
        browser.close()
    
    # Save all captured data
    print(f"\n{'=' * 60}")
    print(f"RESULTS SUMMARY")
    print(f"{'=' * 60}")
    print(f"API Responses captured: {len(captured_responses)}")
    print(f"Tables found in DOM: {len(tables_data)}")
    print(f"Summary cards found: {len(summary_data)}")
    
    # Save API responses
    api_file = os.path.join(OUTPUT_DIR, "api_responses.json")
    with open(api_file, "w", encoding="utf-8") as f:
        json.dump(captured_responses, f, indent=2, ensure_ascii=False)
    print(f"\nSaved API responses to: {api_file}")
    
    # Save table data
    tables_file = os.path.join(OUTPUT_DIR, "dashboard_tables.json")
    with open(tables_file, "w", encoding="utf-8") as f:
        json.dump(tables_data, f, indent=2, ensure_ascii=False)
    print(f"Saved table data to: {tables_file}")
    
    # Save summary
    summary_file = os.path.join(OUTPUT_DIR, "summary_cards.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False)
    print(f"Saved summary cards to: {summary_file}")
    
    # Print API URLs for reference
    if captured_responses:
        print(f"\n{'=' * 60}")
        print("API ENDPOINTS DISCOVERED:")
        print(f"{'=' * 60}")
        for resp in captured_responses:
            print(f"  {resp['status']} | {resp['url'][:120]}")
            print(f"       Preview: {resp['body'][:200]}")
            print()
    
    # Print table data
    if tables_data:
        print(f"\n{'=' * 60}")
        print("TABLE DATA EXTRACTED:")
        print(f"{'=' * 60}")
        for table in tables_data:
            print(f"\n--- Table {table['table_index']} ({len(table['rows'])} rows) ---")
            for row in table['rows'][:5]:  # Print first 5 rows
                print(f"  {' | '.join(row)}")
            if len(table['rows']) > 5:
                print(f"  ... and {len(table['rows'])-5} more rows")
    
    # Convert tables to CSV
    for table in tables_data:
        csv_file = os.path.join(OUTPUT_DIR, f"table_{table['table_index']}.csv")
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for row in table['rows']:
                writer.writerow(row)
        print(f"Saved CSV: {csv_file}")

if __name__ == "__main__":
    main()
