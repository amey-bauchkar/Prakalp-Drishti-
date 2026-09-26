"""
Scraper for Ministry of Environment, Forest and Climate Change (MoEFCC)
Environment Clearance Portal: https://environmentclearance.nic.in/proposal_status_new1.aspx

Extracts authentic proposal numbers (IA/...), MOEFCC file numbers, project titles,
user agencies (NHAI, RVNL, NTPC, etc.), and grant statuses.
Saves deduplicated proposals to modules/aditya/data/raw/ec_real_data/ec_proposals_raw.csv.
"""

import os
import sys
import time
import requests
import urllib3
import pandas as pd
from bs4 import BeautifulSoup

urllib3.disable_warnings()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw', 'ec_real_data')
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_CSV = os.path.join(OUTPUT_DIR, 'ec_proposals_raw.csv')

BASE_URL = 'https://environmentclearance.nic.in/proposal_status_new1.aspx'

# Curated list of high-yield infrastructure terms matching PAIMANA major sectors
SEARCH_TERMS = [
    # Highway & Expressways
    'National Highway', 'Expressway', 'Four Laning', 'Six Laning', 'Two Laning',
    'NHAI', 'Bypass', 'Ring Road', 'Flyover', 'Elevated Corridor', 'NH-',
    # Railways & Metros
    'Railway Line', 'Doubling', 'Dedicated Freight Corridor', 'DFCCIL', 'RVNL', 'Metro Rail',
    # Power & Energy
    'Thermal Power', 'Hydroelectric', 'NTPC', 'Super Thermal', 'Power Station', 'Ultra Mega',
    # Mining & Minerals
    'Coal Mining', 'Iron Ore Mining', 'Bauxite', 'Lignite', 'Opencast Mine', 'CIL',
    # Ports & Shipping
    'Port Project', 'Berth', 'Harbour', 'Jetty', 'Inland Waterways',
    # Petroleum & Pipelines
    'Pipeline Project', 'Refinery', 'Petrochemical', 'IOCL', 'GAIL', 'HPCL', 'BPCL',
    # Infrastructure by State Names
    'Maharashtra', 'Gujarat', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan',
    'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'West Bengal',
    'Odisha', 'Bihar', 'Jharkhand', 'Assam', 'Punjab', 'Haryana', 'Kerala',
    'Himachal Pradesh', 'Uttarakhand', 'Chhattisgarh', 'Goa', 'Jammu'
]


class ECScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Origin': 'https://environmentclearance.nic.in',
            'Referer': BASE_URL
        })
        self._viewstate = None
        self._viewstate_gen = None
        self._event_validation = None
        self.proposals = []
        self.seen_proposals = set()

    def init_tokens(self):
        try:
            r = self.session.get(BASE_URL, verify=False, timeout=20)
            soup = BeautifulSoup(r.text, 'html.parser')
            self._viewstate = soup.find('input', {'id': '__VIEWSTATE'})['value']
            self._viewstate_gen = soup.find('input', {'id': '__VIEWSTATEGENERATOR'})['value']
            self._event_validation = soup.find('input', {'id': '__EVENTVALIDATION'})['value']
            return True
        except Exception as e:
            print(f"[ERR] Failed to init tokens: {e}")
            return False

    def search_term(self, term: str):
        if not self._viewstate:
            if not self.init_tokens():
                return []

        data = {
            '__EVENTTARGET': '',
            '__EVENTARGUMENT': '',
            '__LASTFOCUS': '',
            '__VIEWSTATE': self._viewstate,
            '__VIEWSTATEGENERATOR': self._viewstate_gen,
            '__VIEWSTATEENCRYPTED': '',
            '__EVENTVALIDATION': self._event_validation,
            'ctl00$ContentPlaceHolder1$textbox2': term,
            'ctl00$ContentPlaceHolder1$btn': 'Search'
        }

        try:
            r = self.session.post(BASE_URL, data=data, verify=False, timeout=30)
            soup = BeautifulSoup(r.text, 'html.parser')

            # Update tokens for subsequent queries
            vs = soup.find('input', {'id': '__VIEWSTATE'})
            vsg = soup.find('input', {'id': '__VIEWSTATEGENERATOR'})
            ev = soup.find('input', {'id': '__EVENTVALIDATION'})
            if vs and vsg and ev:
                self._viewstate = vs['value']
                self._viewstate_gen = vsg['value']
                self._event_validation = ev['value']
            else:
                self.init_tokens()

            grid = soup.find('table', {'id': 'ctl00_ContentPlaceHolder1_grdevents'})
            if not grid:
                return []

            rows = grid.find_all('tr')
            results = []
            for r_item in rows:
                cols = [c.text.strip() for c in r_item.find_all('td')]
                # Format: [Sno, Proposal No, File No, Project Name, Company, Status, View]
                if len(cols) >= 6 and cols[1].startswith('IA/'):
                    prop_no = cols[1]
                    file_no = cols[2]
                    name = cols[3]
                    company = cols[4]
                    status = cols[5]

                    # Parse state and category code from proposal number (IA/STATE/CAT/NUM/YEAR)
                    parts = prop_no.split('/')
                    state_code = parts[1] if len(parts) > 1 else ''
                    cat_code = parts[2] if len(parts) > 2 else ''
                    year = parts[4] if len(parts) > 4 else ''

                    rec = {
                        'proposal_number': prop_no,
                        'file_number': file_no,
                        'proposal_name': name,
                        'company_name': company,
                        'status': status,
                        'state_code': state_code,
                        'category_code': cat_code,
                        'year': year,
                        'search_query': term
                    }
                    results.append(rec)
            return results

        except Exception as e:
            print(f"[ERR] Query '{term}' failed: {e}")
            self.init_tokens()
            return []

    def run(self):
        print(f"[START] Scraping Environment Clearance proposals ({len(SEARCH_TERMS)} queries)...")
        if os.path.exists(OUTPUT_CSV):
            existing_df = pd.read_csv(OUTPUT_CSV)
            self.proposals = existing_df.to_dict('records')
            self.seen_proposals = set(p['proposal_number'] for p in self.proposals)
            print(f"[RESUME] Loaded {len(self.proposals)} existing proposals from {OUTPUT_CSV}")

        for idx, term in enumerate(SEARCH_TERMS, 1):
            print(f"[{idx}/{len(SEARCH_TERMS)}] Searching: '{term}'...", end='', flush=True)
            results = self.search_term(term)
            new_count = 0
            for r in results:
                if r['proposal_number'] not in self.seen_proposals:
                    self.seen_proposals.add(r['proposal_number'])
                    self.proposals.append(r)
                    new_count += 1
            print(f" Found {len(results)} items ({new_count} new) | Total Unique: {len(self.proposals)}")

            # Incremental save
            if self.proposals:
                df = pd.DataFrame(self.proposals)
                df.to_csv(OUTPUT_CSV, index=False, encoding='utf-8')

            time.sleep(1.0)

        print(f"\n[DONE] Finished EC scrape! Total unique proposals: {len(self.proposals)}")
        print(f"[SAVED] {OUTPUT_CSV}")


if __name__ == '__main__':
    scraper = ECScraper()
    scraper.run()
