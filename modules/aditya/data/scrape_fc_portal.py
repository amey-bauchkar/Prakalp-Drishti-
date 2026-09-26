"""
Forest Clearance Data Scraper for forestsclearance.nic.in
Pulls FC proposal data filtered by State + Category.
Handles ASP.NET WebForms with __VIEWSTATE tokens.

The portal uses span-based layouts (not GridView tables),
with IDs like: ctl00_ContentPlaceHolder1_grdevents_ctlNN_fieldname
"""
import requests
import time
import csv
import os
import re
import json
import urllib3
import pandas as pd
from bs4 import BeautifulSoup
from datetime import datetime

# Suppress SSL warnings for government NIC servers (known certificate chain issues)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://forestsclearance.nic.in/Online_Status.aspx"

# FC Portal field ID suffixes -> our column names
FIELD_MAP = {
    'snm1': 'proposal_number',       # e.g. FP/MH/ROAD/154408/2022
    'snm5': 'category',              # e.g. Road, Mining, Railway
    'snm6': 'fc_file_number',        # e.g. FC-III/MH-56/2023-NGP
    'snm7': 'user_agency',           # e.g. NATIONAL HIGHWAYS AUTHORITY OF INDIA (NHAI)
    'snm8': 'forest_area_ha',        # e.g. 48.55
    'propslano': 'status',           # APPROVED / IN-PRINCIPLE / Pending at... / DELISTED
    'snm118': 'date_received',       # e.g. 17 Apr 2022
    'state': 'state_name',           # e.g. Maharashtra
    'lbl01document111': 'stage1_date',  # Stage-I approval date
    'lbl01document11': 'stage2_date',   # Stage-II approval date
    'lbl01document': 'eds_ads_info',    # EDS Sought / ADS info
    'lbl01document1': 'compliance_report', # Compliance Report date
}

# Map our PAIMANA state names to FC portal state codes
STATE_NAME_TO_CODE = {
    'Andaman & Nicobar': 'AN', 'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR',
    'Assam': 'AS', 'Bihar': 'BR', 'Chandigarh': 'CH', 'Chhattisgarh': 'CG',
    'Dadra & Nagar Haveli': 'DN', 'Daman & Diu': 'DD', 'Delhi': 'DL',
    'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR', 'Himachal Pradesh': 'HP',
    'Jammu & Kashmir': 'JK', 'Jammu and Kashmir': 'JK',
    'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
    'Ladakh': 'LA', 'Lakshadweep': 'LD', 'Madhya Pradesh': 'MP',
    'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
    'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Orissa': 'OR',
    'Puducherry': 'PY', 'Pondicherry': 'PY',
    'Punjab': 'PB', 'Rajasthan': 'RJ', 'Sikkim': 'SK',
    'Tamil Nadu': 'TN', 'Telangana': 'TG', 'Tripura': 'TR',
    'Uttar Pradesh': 'UP', 'Uttarakhand': 'UK', 'West Bengal': 'WB',
}

# Categories relevant to our PAIMANA infrastructure projects
RELEVANT_CATEGORIES = ['Road', 'Railway', 'Mining', 'Transmission Line',
                       'Hydel', 'Irrigation', 'Pipeline', 'Thermal', 'Industry']


class FCPortalScraper:
    """Scrapes forestsclearance.nic.in for Forest Clearance proposals."""

    def __init__(self, output_dir):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.session = requests.Session()
        self.session.verify = False
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': BASE_URL,
        })
        self._viewstate = None
        self._viewstate_gen = None
        self._event_validation = None
        self._viewstate_encrypted = ''

    def _get_initial_page(self):
        """Fetch the initial page to get ASP.NET tokens."""
        print("[*] Fetching initial page for ASP.NET tokens...")
        resp = self.session.get(BASE_URL, timeout=60)
        resp.raise_for_status()
        self._update_tokens(resp.text)
        print("  Tokens acquired successfully")

    def _update_tokens(self, html):
        """Extract ASP.NET tokens from HTML response."""
        soup = BeautifulSoup(html, 'lxml')
        vs = soup.find('input', {'name': '__VIEWSTATE'})
        if vs:
            self._viewstate = vs['value']
        vsg = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})
        if vsg:
            self._viewstate_gen = vsg['value']
        ev = soup.find('input', {'name': '__EVENTVALIDATION'})
        if ev:
            self._event_validation = ev['value']
        vse = soup.find('input', {'name': '__VIEWSTATEENCRYPTED'})
        if vse:
            self._viewstate_encrypted = vse['value']

    def _search(self, state_code, category):
        """Submit search form and return parsed proposals."""
        form_data = {
            '__VIEWSTATE': self._viewstate,
            '__VIEWSTATEGENERATOR': self._viewstate_gen,
            '__VIEWSTATEENCRYPTED': self._viewstate_encrypted,
            '__EVENTVALIDATION': self._event_validation,
            '__EVENTTARGET': '',
            '__EVENTARGUMENT': '',
            '__LASTFOCUS': '',
            'ctl00$ContentPlaceHolder1$RadioButtonList1': 'New',
            'ctl00$ContentPlaceHolder1$ddlyear': '-All Years-',
            'ctl00$ContentPlaceHolder1$ddl1': 'Select',
            'ctl00$ContentPlaceHolder1$ddl3': state_code,
            'ctl00$ContentPlaceHolder1$ddlcategory': category,
            'ctl00$ContentPlaceHolder1$DropDownList1': '-Select All-',
            'ctl00$ContentPlaceHolder1$txtsearch': '',
            'ctl00$ContentPlaceHolder1$Button1': 'SEARCH',
            'ctl00$ContentPlaceHolder1$hdstatus': 'New',
        }

        resp = self.session.post(BASE_URL, data=form_data, timeout=120)
        resp.raise_for_status()

        # Update tokens for next request
        self._update_tokens(resp.text)

        # Parse the span-based results
        return self._parse_span_results(resp.text)

    def _parse_span_results(self, html):
        """Parse the span-based FC portal results into structured records."""
        soup = BeautifulSoup(html, 'lxml')
        records = []

        # Find all proposal entries by looking for proposal number spans
        # Pattern: ctl00_ContentPlaceHolder1_grdevents_ctlNN_snm1
        proposal_spans = soup.find_all('span', {'id': re.compile(r'grdevents_ctl\d+_snm1$')})

        for prop_span in proposal_spans:
            # Extract the row identifier (e.g., "ctl00_ContentPlaceHolder1_grdevents_ctl02")
            span_id = prop_span.get('id', '')
            prefix_match = re.match(r'(.+_grdevents_ctl\d+)_snm1', span_id)
            if not prefix_match:
                continue

            prefix = prefix_match.group(1)
            record = {'_row_prefix': prefix}

            # Extract all fields for this row
            for field_suffix, col_name in FIELD_MAP.items():
                field_id = f"{prefix}_{field_suffix}"
                field_span = soup.find('span', {'id': field_id})
                if field_span:
                    text = field_span.get_text(strip=True)
                    record[col_name] = text
                else:
                    record[col_name] = ''

            # Extract proposal description/name from textarea 'snm' field
            name_textarea = soup.find('textarea', {'id': f"{prefix}_snm"})
            if name_textarea:
                record['proposal_name'] = name_textarea.get_text(strip=True)
            else:
                record['proposal_name'] = ''

            # Clean up: remove the internal prefix
            del record['_row_prefix']
            records.append(record)

        return records

    def scrape_all(self, states_filter=None, categories_filter=None):
        """
        Scrape FC proposals for given states and categories.

        Args:
            states_filter: List of PAIMANA state names (e.g. ['Maharashtra', 'Gujarat'])
            categories_filter: List of FC categories (e.g. ['Road', 'Mining'])
        """
        self._get_initial_page()

        if categories_filter is None:
            categories_filter = RELEVANT_CATEGORIES

        # Convert state names to codes
        state_codes = {}
        if states_filter:
            for state in states_filter:
                code = STATE_NAME_TO_CODE.get(state)
                if code:
                    state_codes[state] = code
                else:
                    # Try partial match
                    for name, c in STATE_NAME_TO_CODE.items():
                        if state.lower() in name.lower() or name.lower() in state.lower():
                            state_codes[state] = c
                            break
                    else:
                        print(f"  [!] State '{state}' not mapped to FC code, skipping")
        else:
            state_codes = STATE_NAME_TO_CODE.copy()

        all_results = []
        total = len(state_codes) * len(categories_filter)
        done = 0
        seen_proposals = set()  # Deduplicate across year queries

        # Years to query individually (portal returns max 30 per query)
        YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020',
                 '2019', '2018', '2017', '2016', '2015', '2014']

        for state_name, state_code in state_codes.items():
            for category in categories_filter:
                done += 1
                combo_count = 0

                for year in YEARS:
                    try:
                        # Modify _search to accept year parameter
                        form_data = {
                            '__VIEWSTATE': self._viewstate,
                            '__VIEWSTATEGENERATOR': self._viewstate_gen,
                            '__VIEWSTATEENCRYPTED': self._viewstate_encrypted,
                            '__EVENTVALIDATION': self._event_validation,
                            '__EVENTTARGET': '',
                            '__EVENTARGUMENT': '',
                            '__LASTFOCUS': '',
                            'ctl00$ContentPlaceHolder1$RadioButtonList1': 'New',
                            'ctl00$ContentPlaceHolder1$ddlyear': year,
                            'ctl00$ContentPlaceHolder1$ddl1': 'Select',
                            'ctl00$ContentPlaceHolder1$ddl3': state_code,
                            'ctl00$ContentPlaceHolder1$ddlcategory': category,
                            'ctl00$ContentPlaceHolder1$DropDownList1': '-Select All-',
                            'ctl00$ContentPlaceHolder1$txtsearch': '',
                            'ctl00$ContentPlaceHolder1$Button1': 'SEARCH',
                            'ctl00$ContentPlaceHolder1$hdstatus': 'New',
                        }

                        resp = self.session.post(BASE_URL, data=form_data, timeout=120)
                        resp.raise_for_status()
                        self._update_tokens(resp.text)

                        results = self._parse_span_results(resp.text)

                        for r in results:
                            prop_no = r.get('proposal_number', '')
                            if prop_no and prop_no not in seen_proposals:
                                seen_proposals.add(prop_no)
                                r['_query_state'] = state_name
                                r['_query_category'] = category
                                r['_query_year'] = year
                                all_results.append(r)
                                combo_count += 1

                        time.sleep(1)  # Be polite

                    except Exception as e:
                        print(f"    ERROR ({year}): {e}")
                        time.sleep(3)
                        try:
                            self._get_initial_page()
                        except:
                            pass

                print(f"  [{done}/{total}] {state_name} + {category} -> {combo_count} unique proposals")

        # Save all results
        if all_results:
            output_file = os.path.join(self.output_dir, 'fc_proposals_raw.csv')
            df = pd.DataFrame(all_results)
            df.to_csv(output_file, index=False, encoding='utf-8')
            print(f"\n[+] Saved {len(all_results)} unique proposals to {output_file}")

        return all_results


def get_paimana_states():
    """Get unique states from our PAIMANA projects."""
    df = pd.read_csv(r'c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted\PAIMANA_MASTER_PROJECTS_DATABASE.csv')
    return sorted(df['StateName'].dropna().str.strip().unique().tolist())


if __name__ == '__main__':
    output_dir = r'c:\Users\SEBIN\Desktop\SIH PS\modules\aditya\data\raw\fc_real_data'
    our_states = get_paimana_states()
    print(f"Scraping FC data for {len(our_states)} states: {our_states[:5]}...")

    scraper = FCPortalScraper(output_dir)
    results = scraper.scrape_all(
        states_filter=our_states,
        categories_filter=RELEVANT_CATEGORIES
    )
    print(f"\nTotal FC proposals scraped: {len(results)}")
