"""
Scraper for Ministry of Environment, Forest and Climate Change (MoEFCC)
Wildlife Clearance Portal: https://forestsclearance.nic.in/Wildnew_Online_Status.aspx

Extracts authentic proposal numbers (FP/...), protected area diversion area (Ha),
user agencies, project titles, and NBWL / Wildlife Warden statuses.
Saves deduplicated proposals to modules/aditya/data/raw/wlc_real_data/wlc_proposals_raw.csv.
"""

import os
import sys
import time
import requests
import urllib3
import pandas as pd
from bs4 import BeautifulSoup

urllib3.disable_warnings()

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw', 'wlc_real_data')
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_CSV = os.path.join(OUTPUT_DIR, 'wlc_proposals_raw.csv')

BASE_URL = 'https://forestsclearance.nic.in/Wildnew_Online_Status.aspx'

# All 36+ State & UT codes on the portal
STATE_CODES = [
    'MH', 'GJ', 'UP', 'MP', 'RJ', 'KA', 'TN', 'AP', 'TG', 'WB',
    'OR', 'JH', 'BR', 'AS', 'PB', 'HR', 'KL', 'HP', 'UK', 'CG',
    'GA', 'JK', 'LA', 'TR', 'MN', 'ML', 'MZ', 'NL', 'SK', 'AR',
    'CH', 'DL', 'DN', 'DD', 'PY', 'AN'
]


class WLCScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Origin': 'https://forestsclearance.nic.in',
            'Referer': BASE_URL
        })
        self._viewstate = None
        self._viewstate_gen = None
        self._event_validation = None
        self.proposals = []
        self.seen_proposals = set()

    def init_tokens(self):
        try:
            r = self.session.get(BASE_URL, verify=False, timeout=25)
            soup = BeautifulSoup(r.text, 'html.parser')
            self._viewstate = soup.find('input', {'id': '__VIEWSTATE'})['value']
            self._viewstate_gen = soup.find('input', {'id': '__VIEWSTATEGENERATOR'})['value']
            self._event_validation = soup.find('input', {'id': '__EVENTVALIDATION'})['value']
            return True
        except Exception as e:
            print(f"[ERR] Failed to init tokens: {e}")
            return False

    def scrape_state(self, state_code: str):
        if not self._viewstate:
            if not self.init_tokens():
                return []

        data = {
            '__EVENTTARGET': '',
            '__EVENTARGUMENT': '',
            '__VIEWSTATE': self._viewstate,
            '__VIEWSTATEGENERATOR': self._viewstate_gen,
            '__VIEWSTATEENCRYPTED': '',
            '__EVENTVALIDATION': self._event_validation,
            'HiddenField1': '',
            'HiddenField2': '',
            'ddlyear': '-All Years-',
            'ddl3': state_code,
            'ddlcategory': '-Select All-',
            'DropDownList1': '-Select All-',
            'txtsearch': '',
            'Button1': 'SEARCH'
        }

        state_results = []
        try:
            r = self.session.post(BASE_URL, data=data, verify=False, timeout=30)
            soup = BeautifulSoup(r.text, 'html.parser')

            # Update tokens
            vs = soup.find('input', {'id': '__VIEWSTATE'})
            vsg = soup.find('input', {'id': '__VIEWSTATEGENERATOR'})
            ev = soup.find('input', {'id': '__EVENTVALIDATION'})
            if vs and vsg and ev:
                self._viewstate = vs['value']
                self._viewstate_gen = vsg['value']
                self._event_validation = ev['value']
            else:
                self.init_tokens()

            table = soup.find('table', {'id': 'grdevents'})
            if not table:
                return []

            rows = table.find_all('tr')
            for row in rows[1:]:
                cols = [c.text.strip() for c in row.find_all('td')]
                # Format: [Sno, Proposal No, State Name, Proposal Name, Category, User Agency Name, Area (ha.), Proposal Status, ...]
                if len(cols) >= 8 and (cols[1].startswith('FP/') or cols[1].startswith('WL/')):
                    prop_no = cols[1]
                    state_name = cols[2]
                    name = cols[3]
                    cat = cols[4]
                    agency = cols[5]
                    area_str = cols[6].replace('Ha', '').replace('ha', '').replace(',', '').strip()
                    try:
                        area_ha = float(area_str)
                    except:
                        area_ha = 0.0
                    status = cols[7]

                    rec = {
                        'proposal_number': prop_no,
                        'state_code': state_code,
                        'state_name': state_name,
                        'proposal_name': name,
                        'category': cat,
                        'user_agency': agency,
                        'area_ha': area_ha,
                        'status': status
                    }
                    state_results.append(rec)

            # Check for pagination links: Page$2, Page$3, etc.
            pager_links = []
            last_row = rows[-1]
            for a in last_row.find_all('a'):
                href = a.get('href', '')
                if 'Page$' in href:
                    arg = href.split("'")[3] if len(href.split("'")) > 3 else ''
                    if arg and arg not in pager_links:
                        pager_links.append(arg)

            # Fetch up to 5 additional pages per state if available
            for p_arg in pager_links[:5]:
                try:
                    time.sleep(0.5)
                    p_data = {
                        '__EVENTTARGET': 'grdevents',
                        '__EVENTARGUMENT': p_arg,
                        '__VIEWSTATE': self._viewstate,
                        '__VIEWSTATEGENERATOR': self._viewstate_gen,
                        '__VIEWSTATEENCRYPTED': '',
                        '__EVENTVALIDATION': self._event_validation,
                        'HiddenField1': '',
                        'HiddenField2': '',
                        'ddlyear': '-All Years-',
                        'ddl3': state_code,
                        'ddlcategory': '-Select All-',
                        'DropDownList1': '-Select All-',
                        'txtsearch': ''
                    }
                    p_resp = self.session.post(BASE_URL, data=p_data, verify=False, timeout=30)
                    p_soup = BeautifulSoup(p_resp.text, 'html.parser')
                    vs = p_soup.find('input', {'id': '__VIEWSTATE'})
                    vsg = p_soup.find('input', {'id': '__VIEWSTATEGENERATOR'})
                    ev = p_soup.find('input', {'id': '__EVENTVALIDATION'})
                    if vs and vsg and ev:
                        self._viewstate = vs['value']
                        self._viewstate_gen = vsg['value']
                        self._event_validation = ev['value']

                    p_table = p_soup.find('table', {'id': 'grdevents'})
                    if p_table:
                        for row in p_table.find_all('tr')[1:]:
                            cols = [c.text.strip() for c in row.find_all('td')]
                            if len(cols) >= 8 and (cols[1].startswith('FP/') or cols[1].startswith('WL/')):
                                area_str = cols[6].replace('Ha', '').replace('ha', '').replace(',', '').strip()
                                try:
                                    area_ha = float(area_str)
                                except:
                                    area_ha = 0.0
                                state_results.append({
                                    'proposal_number': cols[1],
                                    'state_code': state_code,
                                    'state_name': cols[2],
                                    'proposal_name': cols[3],
                                    'category': cols[4],
                                    'user_agency': cols[5],
                                    'area_ha': area_ha,
                                    'status': cols[7]
                                })
                except Exception as pe:
                    print(f" (page {p_arg} err: {pe})", end='')

            return state_results

        except Exception as e:
            print(f"[ERR] State {state_code} failed: {e}")
            self.init_tokens()
            return []

    def run(self):
        print(f"[START] Scraping Wildlife Clearance proposals across {len(STATE_CODES)} states...")
        if os.path.exists(OUTPUT_CSV):
            existing_df = pd.read_csv(OUTPUT_CSV)
            self.proposals = existing_df.to_dict('records')
            self.seen_proposals = set(p['proposal_number'] for p in self.proposals)
            print(f"[RESUME] Loaded {len(self.proposals)} existing WLC proposals")

        for idx, sc in enumerate(STATE_CODES, 1):
            print(f"[{idx}/{len(STATE_CODES)}] Scraping state {sc}...", end='', flush=True)
            results = self.scrape_state(sc)
            new_count = 0
            for r in results:
                if r['proposal_number'] not in self.seen_proposals:
                    self.seen_proposals.add(r['proposal_number'])
                    self.proposals.append(r)
                    new_count += 1
            print(f" Found {len(results)} rows ({new_count} new) | Total Unique: {len(self.proposals)}")

            if self.proposals:
                df = pd.DataFrame(self.proposals)
                df.to_csv(OUTPUT_CSV, index=False, encoding='utf-8')

            time.sleep(1.0)

        print(f"\n[DONE] WLC Scrape complete! Total unique proposals: {len(self.proposals)}")
        print(f"[SAVED] {OUTPUT_CSV}")


if __name__ == '__main__':
    scraper = WLCScraper()
    scraper.run()
