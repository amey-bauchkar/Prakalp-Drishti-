"""
ANUMATI FC Proposal Matcher
Matches scraped Forest Clearance proposals to our 2,207 PAIMANA projects.
Uses a 3-layer matching pipeline: Hard Filters -> Structural IDs -> Fuzzy Match.
"""
import pandas as pd
import re
import json
import os
import csv
from rapidfuzz import fuzz, process
from collections import defaultdict

# ============================================================
# SECTOR -> FC CATEGORY MAPPING
# ============================================================
SECTOR_TO_FC_CATEGORY = {
    'Roads & Highways': ['Road'],
    'Railways': ['Railway', 'Railway Line'],
    'Coal': ['Mining'],
    'Metals & Mining': ['Mining'],
    'Oil & Gas': ['Pipeline', 'Others'],
    'Transmission & Distribution': ['Transmission Line'],
    'Electricity Generation': ['Hydel', 'Thermal'],
    'Water Resources': ['Irrigation'],
    'Aviation & Aviation Infrastructure': ['Others'],
    'Steel': ['Mining', 'Industry'],
    'Shipping': ['Others'],
    'Inland Waterways': ['Others'],
}

# Company name -> FC User Agency patterns
COMPANY_TO_AGENCY_PATTERNS = {
    'NHAI': ['NHAI', 'National Highways Authority'],
    'MoRTH': ['MoRTH', 'Ministry of Road Transport'],
    'NHIDCL': ['NHIDCL', 'National Highways Infrastructure'],
    'POWERGRID': ['PGCIL', 'Power Grid', 'POWERGRID'],
    'NTPC': ['NTPC'],
    'CIL': ['CIL', 'Coal India', 'WCL', 'ECL', 'SECL', 'NCL', 'MCL', 'BCCL', 'CCL'],
    'GAIL': ['GAIL'],
    'ONGC': ['ONGC'],
    'Indian Oil': ['IOCL', 'Indian Oil'],
    'BHEL': ['BHEL'],
    'Railway': ['Railway', 'East Coast', 'East Central', 'South Central', 
                'North Western', 'South Eastern', 'Northern Railway',
                'Western Railway', 'Central Railway', 'Southern Railway',
                'North Eastern', 'Northeast Frontier'],
}


def extract_nh_number(name):
    """Extract NH number(s) from project name."""
    patterns = [
        r'NH[-\s]*(\d+[A-Z]?(?:\([A-Z]+\))?)',
        r'NH[-\s]*(\d+)',
    ]
    found = set()
    for p in patterns:
        for m in re.finditer(p, str(name), re.IGNORECASE):
            found.add(f"NH-{m.group(1).upper()}")
    return list(found)


def extract_km_range(name):
    """Extract km range from project name."""
    patterns = [
        r'[Kk]m[\.\s]*(\d+(?:\.\d+)?)\s*(?:to|[-\u2013])\s*[Kk]m[\.\s]*(\d+(?:\.\d+)?)',
        r'[Kk]m[\.\s]*(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)',
    ]
    for p in patterns:
        m = re.search(p, str(name))
        if m:
            try:
                v1 = float(m.group(1).rstrip('.'))
                v2 = float(m.group(2).rstrip('.'))
                return (v1, v2)
            except (ValueError, TypeError):
                continue
    return None


def extract_location_tokens(name):
    """Extract meaningful location words from project name."""
    # Remove common non-location words
    stopwords = {
        'of', 'the', 'and', 'to', 'from', 'at', 'in', 'on', 'for', 'with',
        'km', 'kms', 'section', 'package', 'pkg', 'phase', 'project',
        'construction', 'rehabilitation', 'upgradation', 'widening', 'laning',
        'lane', 'line', 'work', 'works', 'balance', 'completion', 'new',
        'between', 'via', 'nh', 'railway', 'road', 'highway', 'national',
        'mine', 'mining', 'coal', 'block', 'opencast', 'underground', 'open',
        'cast', 'expansion', 'capacity', 'mw', 'mtpa', 'hep', 'thermal',
        'power', 'station', 'plant', 'transmission', 'substation', 'kv',
        'circuit', 'double', 'single', 'gauge', 'conversion',
        'electrification', 'doubling', '3rd', '4th', '2nd', 'total', 'length',
        'part', 'proposal', 'diversion', 'forest', 'land', 'area', 'village',
        'district', 'state', 'india', 'limited', 'ltd', 'corporation',
        'authority', 'ministry', 'department', 'government', 'govt',
        'epc', 'basis', 'mode', 'hybrid', 'annuity', 'bot', 'toll',
        'access', 'controlled', 'greenfield', 'elevated', 'bridge',
        'flyover', 'interchange', 'junction', 'corridor', 'alignment',
        'design', 'approximate', 'including', 'excluding', 'intermediate',
        'hard', 'shoulder', 'shoulders', 'paved', 'flexible', 'pavement',
    }
    
    # Extract capitalized words (likely place names)
    words = re.findall(r'\b([A-Z][a-z]{2,})\b', str(name))
    tokens = [w.lower() for w in words if w.lower() not in stopwords and len(w) > 2]
    
    # Also extract consecutive capitalized words (multi-word place names)
    multi = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b', str(name))
    for m in multi:
        parts = m.lower().split()
        clean = [p for p in parts if p not in stopwords]
        if clean:
            tokens.append(' '.join(clean))
    
    return list(set(tokens))


def extract_mine_name(name):
    """Extract mine/coal block name."""
    patterns = [
        r'(\w+(?:\s+\w+)?)\s+(?:OC|UG|Opencast|Underground|Coal\s+Block|Mine|Project)',
        r'(?:Mine|Block|Project)\s+(\w+(?:\s+\w+)?)',
    ]
    for p in patterns:
        m = re.search(p, str(name), re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


class FCMatcher:
    """
    3-Layer matching engine for linking FC proposals to PAIMANA projects.
    
    Layer 1: Hard filters (State + Category + Agency)
    Layer 2: Structural identifiers (NH number, KM range, mine name)
    Layer 3: Fuzzy name matching with confidence scoring
    """
    
    def __init__(self, paimana_csv_path, fc_proposals_csv_path):
        self.paimana = pd.read_csv(paimana_csv_path)
        self.fc_proposals = pd.read_csv(fc_proposals_csv_path)
        
        # Pre-process PAIMANA projects
        self._preprocess_paimana()
        
        # Pre-process FC proposals
        self._preprocess_fc()
        
        # Results
        self.matches = []
        self.unmatched_projects = []
        self.unmatched_proposals = []
    
    def _preprocess_paimana(self):
        """Extract matching features from PAIMANA projects."""
        self.paimana['_nh_numbers'] = self.paimana['ProjectName'].apply(extract_nh_number)
        self.paimana['_km_range'] = self.paimana['ProjectName'].apply(extract_km_range)
        self.paimana['_location_tokens'] = self.paimana['ProjectName'].apply(extract_location_tokens)
        self.paimana['_mine_name'] = self.paimana['ProjectName'].apply(extract_mine_name)
        # Infer state if missing (especially for non-road projects)
        def resolve_state(row):
            st = row.get('StateName')
            if pd.notna(st) and str(st).strip() and str(st).strip().lower() != 'nan':
                return str(st).strip()
            # Infer from project name keywords
            p_name = str(row.get('ProjectName', '')).upper()
            cues = {
                "DELHI": "Delhi", "MUMBAI": "Maharashtra", "PUNE": "Maharashtra", "NAGPUR": "Maharashtra",
                "KOLKATA": "West Bengal", "CHENNAI": "Tamil Nadu", "BENGALURU": "Karnataka", "BANGALORE": "Karnataka",
                "HYDERABAD": "Telangana", "AHMEDABAD": "Gujarat", "SURAT": "Gujarat", "JAIPUR": "Rajasthan",
                "LUCKNOW": "Uttar Pradesh", "KANPUR": "Uttar Pradesh", "PATNA": "Bihar", "RANCHI": "Jharkhand",
                "BHOPAL": "Madhya Pradesh", "INDORE": "Madhya Pradesh", "GUWAHATI": "Assam", "IMPHAL": "Manipur",
                "SHILLONG": "Meghalaya", "AGARTALA": "Tripura", "DEHRADUN": "Uttarakhand", "SHIMLA": "Himachal Pradesh",
                "CHANDIGARH": "Punjab", "AMRITSAR": "Punjab", "BHUBANESWAR": "Odisha", "RAIPUR": "Chhattisgarh",
                "VIJAYAWADA": "Andhra Pradesh", "VISAKHAPATNAM": "Andhra Pradesh", "KOCHI": "Kerala", "JAMMU": "Jammu & Kashmir",
                "SRINAGAR": "Jammu & Kashmir", "JIND": "Haryana", "GOHANA": "Haryana", "VARANASI": "Uttar Pradesh",
                "KORBA": "Chhattisgarh", "TALCHER": "Odisha", "BATHINDA": "Punjab", "USAR": "Maharashtra",
                "PRAYAGRAJ": "Uttar Pradesh", "BHADLA": "Rajasthan", "FATEHGARH": "Rajasthan", "BARMER": "Rajasthan",
                "KURNOOL": "Andhra Pradesh", "BHOJUDIH": "Jharkhand", "JAGANNATHPUR": "Jharkhand", "PACHWARA": "Jharkhand",
            }
            for cue, s in cues.items():
                if cue in p_name:
                    return s
            return ''

        self.paimana['_resolved_state'] = self.paimana.apply(resolve_state, axis=1)
        self.paimana['_state_clean'] = self.paimana['_resolved_state'].fillna('').str.strip().str.lower()
        self.paimana['_sector_clean'] = self.paimana['SectorName'].fillna('').str.strip()
        
        # Get FC categories for each project
        self.paimana['_fc_categories'] = self.paimana['_sector_clean'].apply(
            lambda s: SECTOR_TO_FC_CATEGORY.get(s, [])
        )
        
        # Determine if FC is needed
        fc_sectors = set(SECTOR_TO_FC_CATEGORY.keys())
        self.paimana['_needs_fc'] = self.paimana['_sector_clean'].isin(fc_sectors)
        
        print(f"Pre-processed {len(self.paimana)} PAIMANA projects")
        print(f"  FC-relevant: {self.paimana['_needs_fc'].sum()}")
        print(f"  Projects with resolved state: {(self.paimana['_state_clean'] != '').sum()}")
    
    def _preprocess_fc(self):
        """Extract matching features from FC proposals."""
        # Normalize proposal name field (prioritize proposal_name over proposal_number)
        name_col = None
        for c in ['proposal_name', 'Proposal Name', 'ProposalName', 'Project Name', 'project_name', 'Name', 'name']:
            if c in self.fc_proposals.columns:
                name_col = c
                break
        
        if name_col is None:
            for c in self.fc_proposals.columns:
                if 'name' in c.lower() and 'user' not in c.lower() and 'state' not in c.lower():
                    name_col = c
                    break
        
        self.fc_name_col = name_col or 'proposal_name'
        print(f"FC proposal text column: '{self.fc_name_col}'")
        
        self.fc_proposals['_nh_numbers'] = self.fc_proposals[self.fc_name_col].apply(extract_nh_number)
        self.fc_proposals['_km_range'] = self.fc_proposals[self.fc_name_col].apply(extract_km_range)
        self.fc_proposals['_location_tokens'] = self.fc_proposals[self.fc_name_col].apply(extract_location_tokens)
        self.fc_proposals['_mine_name'] = self.fc_proposals[self.fc_name_col].apply(extract_mine_name)
        
        # State from query metadata or state column
        state_col = '_query_state' if '_query_state' in self.fc_proposals.columns else 'state_name'
        self.fc_proposals['_state_clean'] = self.fc_proposals[state_col].fillna('').str.strip().str.lower()
        
        # Category from query metadata or category column
        cat_col = '_query_category' if '_query_category' in self.fc_proposals.columns else 'category'
        self.fc_proposals['_category_clean'] = self.fc_proposals[cat_col].fillna('').str.strip()
        
        print(f"Pre-processed {len(self.fc_proposals)} FC proposals")
    
    def _layer1_hard_filter(self, project_row):
        """Layer 1: Return FC proposals matching state + category."""
        state = project_row['_state_clean']
        fc_cats = project_row['_fc_categories']
        
        if not state or not fc_cats:
            return pd.DataFrame()
        
        mask = self.fc_proposals['_state_clean'] == state
        if fc_cats:
            cat_mask = self.fc_proposals['_category_clean'].isin(fc_cats)
            mask = mask & cat_mask
        
        return self.fc_proposals[mask]
    
    def _layer2_structural_match(self, project_row, candidates):
        """Layer 2: Score candidates using structural identifiers."""
        scored = []
        
        p_nhs = set(project_row['_nh_numbers'])
        p_km = project_row['_km_range']
        p_mine = project_row['_mine_name']
        
        for _, fc_row in candidates.iterrows():
            score = 0
            reasons = []
            
            fc_nhs = set(fc_row['_nh_numbers'])
            fc_km = fc_row['_km_range']
            fc_mine = fc_row['_mine_name']
            
            # NH number match (+40 points)
            if p_nhs and fc_nhs:
                nh_overlap = p_nhs & fc_nhs
                if nh_overlap:
                    score += 40
                    reasons.append(f"NH match: {nh_overlap}")
            
            # KM range overlap (+25 points)
            if p_km and fc_km:
                p_start, p_end = p_km
                fc_start, fc_end = fc_km
                # Check if ranges overlap
                if p_start <= fc_end and fc_start <= p_end:
                    overlap = min(p_end, fc_end) - max(p_start, fc_start)
                    total = max(p_end, fc_end) - min(p_start, fc_start)
                    overlap_pct = overlap / total if total > 0 else 0
                    score += int(25 * overlap_pct)
                    reasons.append(f"KM overlap: {overlap_pct:.0%}")
            
            # Mine/block name match (+35 points)
            if p_mine and fc_mine:
                mine_sim = fuzz.token_sort_ratio(p_mine.lower(), fc_mine.lower())
                if mine_sim > 70:
                    score += int(35 * mine_sim / 100)
                    reasons.append(f"Mine match: {mine_sim}%")
            
            scored.append({
                'fc_idx': fc_row.name,
                'structural_score': score,
                'structural_reasons': '; '.join(reasons),
            })
        
        return scored
    
    def _layer3_fuzzy_match(self, project_row, candidates, structural_scores):
        """Layer 3: Fuzzy name matching + location token overlap."""
        p_name = str(project_row['ProjectName']).lower()
        p_tokens = set(project_row['_location_tokens'])
        
        final_scores = []
        
        for scored in structural_scores:
            fc_row = candidates.loc[scored['fc_idx']]
            fc_name = str(fc_row[self.fc_name_col]).lower()
            fc_tokens = set(fc_row['_location_tokens'])
            
            # Fuzzy name similarity (+30 points max)
            name_sim = fuzz.token_sort_ratio(p_name, fc_name)
            fuzzy_score = int(30 * name_sim / 100)
            
            # Location token overlap (+15 points max)
            if p_tokens and fc_tokens:
                token_overlap = len(p_tokens & fc_tokens)
                token_total = max(len(p_tokens), len(fc_tokens))
                token_score = int(15 * min(token_overlap / max(token_total, 1), 1.0))
            else:
                token_overlap = 0
                token_score = 0
            
            total_score = scored['structural_score'] + fuzzy_score + token_score
            
            final_scores.append({
                'fc_idx': scored['fc_idx'],
                'structural_score': scored['structural_score'],
                'fuzzy_score': fuzzy_score,
                'token_score': token_score,
                'total_score': total_score,
                'name_similarity': name_sim,
                'token_overlap': token_overlap,
                'reasons': scored['structural_reasons'],
            })
        
        # Sort by total score descending
        final_scores.sort(key=lambda x: x['total_score'], reverse=True)
        return final_scores
    
    def match_all(self, min_confidence=45):
        """
        Run the full 3-layer matching pipeline.
        
        Args:
            min_confidence: Minimum total score (0-100) to accept a match.
                           45 = NH match alone is enough (40+5 from fuzzy)
                           65 = Need NH + KM overlap or strong fuzzy
        """
        print(f"\n{'='*60}")
        print(f"Starting 3-Layer Matching (min_confidence={min_confidence})")
        print(f"{'='*60}")
        
        matched_fc_indices = set()
        
        for idx, project in self.paimana.iterrows():
            if not project['_needs_fc']:
                self.matches.append({
                    'paimana_idx': idx,
                    'project_id': project['ProjectId'],
                    'project_name': project['ProjectName'],
                    'state': project['StateName'],
                    'sector': project['SectorName'],
                    'fc_status': 'FC_NOT_REQUIRED',
                    'confidence': 100,
                    'match_reason': 'Sector does not require Forest Clearance',
                    'fc_proposal_no': None,
                    'fc_proposal_name': None,
                    'fc_area_ha': None,
                    'fc_proposal_status': None,
                })
                continue
            
            # Layer 1: Hard filter
            candidates = self._layer1_hard_filter(project)
            
            if len(candidates) == 0:
                self.unmatched_projects.append({
                    'paimana_idx': idx,
                    'project_id': project['ProjectId'],
                    'project_name': project['ProjectName'],
                    'state': project['StateName'],
                    'sector': project['SectorName'],
                    'reason': 'No FC proposals found for state+category',
                })
                self.matches.append({
                    'paimana_idx': idx,
                    'project_id': project['ProjectId'],
                    'project_name': project['ProjectName'],
                    'state': project['StateName'],
                    'sector': project['SectorName'],
                    'fc_status': 'FC_NO_PROPOSAL_FOUND',
                    'confidence': 0,
                    'match_reason': 'No FC proposals in this state+category',
                    'fc_proposal_no': None,
                    'fc_proposal_name': None,
                    'fc_area_ha': None,
                    'fc_proposal_status': None,
                })
                continue
            
            # Layer 2: Structural scoring
            structural_scores = self._layer2_structural_match(project, candidates)
            
            # Layer 3: Fuzzy + token scoring
            final_scores = self._layer3_fuzzy_match(project, candidates, structural_scores)
            
            # Take the best match if above threshold
            if final_scores and final_scores[0]['total_score'] >= min_confidence:
                best = final_scores[0]
                fc_row = candidates.loc[best['fc_idx']]
                
                # Find proposal number and status columns
                prop_no = None
                prop_status = None
                area_ha = None
                
                for col in self.fc_proposals.columns:
                    col_lower = col.lower()
                    if 'proposal' in col_lower and ('no' in col_lower or 'number' in col_lower or 'file' in col_lower):
                        prop_no = fc_row[col]
                    elif 'status' in col_lower:
                        prop_status = fc_row[col]
                    elif 'area' in col_lower and 'ha' in col_lower:
                        try:
                            area_ha = float(fc_row[col])
                        except:
                            area_ha = fc_row[col]
                
                matched_fc_indices.add(best['fc_idx'])
                
                self.matches.append({
                    'paimana_idx': idx,
                    'project_id': project['ProjectId'],
                    'project_name': project['ProjectName'],
                    'state': project['StateName'],
                    'sector': project['SectorName'],
                    'fc_status': prop_status or 'MATCHED',
                    'confidence': best['total_score'],
                    'match_reason': best['reasons'],
                    'name_similarity': best['name_similarity'],
                    'fc_proposal_no': prop_no,
                    'fc_proposal_name': str(fc_row[self.fc_name_col]),
                    'fc_area_ha': area_ha,
                    'fc_proposal_status': prop_status,
                })
            else:
                best_score = final_scores[0]['total_score'] if final_scores else 0
                self.unmatched_projects.append({
                    'paimana_idx': idx,
                    'project_id': project['ProjectId'],
                    'project_name': project['ProjectName'],
                    'state': project['StateName'],
                    'sector': project['SectorName'],
                    'reason': f'Best score {best_score} < threshold {min_confidence}',
                    'best_candidate': str(candidates.iloc[0][self.fc_name_col])[:100] if len(candidates) > 0 else 'N/A',
                })
                self.matches.append({
                    'paimana_idx': idx,
                    'project_id': project['ProjectId'],
                    'project_name': project['ProjectName'],
                    'state': project['StateName'],
                    'sector': project['SectorName'],
                    'fc_status': 'FC_NOT_MATCHED',
                    'confidence': best_score,
                    'match_reason': f'Below threshold (best={best_score})',
                    'fc_proposal_no': None,
                    'fc_proposal_name': None,
                    'fc_area_ha': None,
                    'fc_proposal_status': None,
                })
        
        self._print_summary()
        return self.matches
    
    def _print_summary(self):
        """Print matching summary."""
        total = len(self.matches)
        matched = sum(1 for m in self.matches if m['fc_status'] not in 
                      ('FC_NOT_REQUIRED', 'FC_NO_PROPOSAL_FOUND', 'FC_NOT_MATCHED'))
        not_required = sum(1 for m in self.matches if m['fc_status'] == 'FC_NOT_REQUIRED')
        not_found = sum(1 for m in self.matches if m['fc_status'] == 'FC_NO_PROPOSAL_FOUND')
        not_matched = sum(1 for m in self.matches if m['fc_status'] == 'FC_NOT_MATCHED')
        
        high_conf = sum(1 for m in self.matches if m['confidence'] >= 70 and 
                        m['fc_status'] not in ('FC_NOT_REQUIRED', 'FC_NO_PROPOSAL_FOUND', 'FC_NOT_MATCHED'))
        med_conf = sum(1 for m in self.matches if 45 <= m['confidence'] < 70 and 
                       m['fc_status'] not in ('FC_NOT_REQUIRED', 'FC_NO_PROPOSAL_FOUND', 'FC_NOT_MATCHED'))
        
        print(f"\n{'='*60}")
        print(f"MATCHING RESULTS")
        print(f"{'='*60}")
        print(f"Total projects:           {total}")
        print(f"FC Not Required:          {not_required}")
        print(f"Matched with FC data:     {matched}")
        print(f"  High confidence (70+):  {high_conf}")
        print(f"  Medium confidence:      {med_conf}")
        print(f"No FC proposals found:    {not_found}")
        print(f"Below match threshold:    {not_matched}")
    
    def save_results(self, output_dir):
        """Save matching results to CSV files."""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save all matches
        matches_df = pd.DataFrame(self.matches)
        matches_df.to_csv(os.path.join(output_dir, 'fc_matches.csv'), index=False)
        
        # Save unmatched for review
        if self.unmatched_projects:
            unmatched_df = pd.DataFrame(self.unmatched_projects)
            unmatched_df.to_csv(os.path.join(output_dir, 'fc_unmatched_review.csv'), index=False)
        
        # Save high-confidence matches separately
        high_conf = [m for m in self.matches if m['confidence'] >= 70 and 
                     m['fc_status'] not in ('FC_NOT_REQUIRED', 'FC_NO_PROPOSAL_FOUND', 'FC_NOT_MATCHED')]
        if high_conf:
            pd.DataFrame(high_conf).to_csv(
                os.path.join(output_dir, 'fc_matches_high_confidence.csv'), index=False)
        
        print(f"\nResults saved to {output_dir}/")


if __name__ == '__main__':
    paimana_csv = r'c:\Users\SEBIN\Desktop\SIH PS\paimana_extracted\PAIMANA_MASTER_PROJECTS_DATABASE.csv'
    fc_csv = r'c:\Users\SEBIN\Desktop\SIH PS\modules\aditya\data\raw\fc_real_data\fc_proposals_raw.csv'
    output_dir = r'c:\Users\SEBIN\Desktop\SIH PS\modules\aditya\data\raw\fc_real_data'
    
    matcher = FCMatcher(paimana_csv, fc_csv)
    matches = matcher.match_all(min_confidence=45)
    matcher.save_results(output_dir)
