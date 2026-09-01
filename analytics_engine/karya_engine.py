import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")

class AgencyScorer:
    def __init__(self, data_path: str = DATA_PATH):
        self.data_path = data_path
        self.df = None
        self.agency_stats = {}
        self._load_and_clean_data()
        self._compute_scores()

    def _load_and_clean_data(self):
        try:
            from analytics_engine.corpus_source import load_corpus
            self.df = load_corpus()
        except Exception:
            try:
                self.df = pd.read_csv(self.data_path)
            except Exception as e:
                print(f"[ERROR] Failed to load dataset: {e}")
                self.df = pd.DataFrame()
                return

        required_cols = ['COMPANYNAME', 'OriginalCost', 'RevisedCost', 'OriginalEndDate', 'RevisedDate', 'PhysicalProgress', 'Expenditure']
        for col in required_cols:
            if col not in self.df.columns:
                print(f"[WARNING] Missing expected column: {col}")
                self.df[col] = np.nan

        # Clean numerical columns
        for col in ['OriginalCost', 'RevisedCost', 'PhysicalProgress', 'Expenditure']:
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce').fillna(0.0)

        # Clean date columns
        self.df['OriginalEndDate'] = pd.to_datetime(self.df['OriginalEndDate'], errors='coerce', dayfirst=True)
        self.df['RevisedDate'] = pd.to_datetime(self.df['RevisedDate'], errors='coerce', dayfirst=True)

        # Filter out extreme anomalies where Original Cost is 0 (prevents div by 0)
        self.df = self.df[self.df['OriginalCost'] > 0].copy()

        # Compute Historical Cost Variance (HCV) - percentage
        self.df['CostVariancePerc'] = ((self.df['RevisedCost'] - self.df['OriginalCost']) / self.df['OriginalCost']) * 100.0
        # Prevent negative overruns from artificially boosting scores too much
        self.df['CostVariancePerc'] = self.df['CostVariancePerc'].clip(lower=0)

        # Compute Historical Schedule Variance (HSV) - in days
        self.df['ScheduleVarianceDays'] = (self.df['RevisedDate'] - self.df['OriginalEndDate']).dt.days
        self.df['ScheduleVarianceDays'] = self.df['ScheduleVarianceDays'].fillna(0).clip(lower=0)

    def _compute_scores(self):
        if self.df.empty:
            return

        grouped = self.df.groupby('COMPANYNAME').agg({
            'CostVariancePerc': 'mean',
            'ScheduleVarianceDays': 'mean',
            'ProjectId': 'count'
        }).rename(columns={'ProjectId': 'ProjectCount'})

        for agency, row in grouped.iterrows():
            mean_hcv = row['CostVariancePerc']
            mean_hsv = row['ScheduleVarianceDays']
            
            # Rigorous Normalization Math for 0-100 Score
            # Start at 100.
            # Penalize Cost: -0.5 points per 1% overrun
            # Penalize Schedule: -1 point per 30 days (1 month) of delay
            # Outlier Penalty: Multiplier if delay > 5 years (1825 days) or overrun > 100%
            
            cost_penalty = mean_hcv * 0.5
            if mean_hcv > 100: cost_penalty *= 1.5 # Heavy penalty for >100% avg overrun
            
            schedule_penalty = mean_hsv / 30.44
            if mean_hsv > 1825: schedule_penalty *= 2.0 # Heavy penalty for >5 yrs delay
            
            raw_score = 100.0 - cost_penalty - schedule_penalty
            final_score = float(np.clip(raw_score, 0.0, 100.0))

            self.agency_stats[agency] = {
                'mean_hcv_perc': float(mean_hcv),
                'mean_hsv_days': float(mean_hsv),
                'reliability_score': round(final_score, 2),
                'project_count': int(row['ProjectCount'])
            }

    def get_agency_score(self, agency_name: str) -> dict:
        # Default fallback for unknown agencies
        return self.agency_stats.get(agency_name, {
            'mean_hcv_perc': 25.0, # Assumed 25% overrun
            'mean_hsv_days': 365.0, # Assumed 1 yr delay
            'reliability_score': 50.0,
            'project_count': 0
        })

class ProjectDebiaser:
    def __init__(self, scorer: AgencyScorer):
        self.scorer = scorer

    def predict_true_metrics(self, agency_name: str, base_cost_cr: float, base_time_days: float) -> dict:
        stats = self.scorer.get_agency_score(agency_name)
        
        # Apply mathematical de-biasing
        true_expected_cost = base_cost_cr * (1 + (stats['mean_hcv_perc'] / 100.0))
        true_expected_time = base_time_days + stats['mean_hsv_days']

        return {
            'Agency': agency_name,
            'Reliability_Score': stats['reliability_score'],
            'Base_Cost_Cr': base_cost_cr,
            'True_Expected_Cost_Cr': round(true_expected_cost, 2),
            'Base_Timeline_Days': base_time_days,
            'True_Expected_Timeline_Days': round(true_expected_time, 0),
            'Historical_Cost_Variance_Avg': f"+{round(stats['mean_hcv_perc'], 1)}%",
            'Historical_Delay_Avg': f"+{round(stats['mean_hsv_days'], 0)} days"
        }

class DeadCapitalTracker:
    def __init__(self, data_path: str = DATA_PATH):
        self.data_path = data_path

    def get_dead_capital_projects(self):
        try:
            df = pd.read_csv(self.data_path)
            df['PhysicalProgress'] = pd.to_numeric(df['PhysicalProgress'], errors='coerce').fillna(0.0)
            df['Expenditure'] = pd.to_numeric(df['Expenditure'], errors='coerce').fillna(0.0)
            
            dead_capital = df[(df['PhysicalProgress'] < 20.0) & (df['Expenditure'] > 100.0)]
            return dead_capital[['ProjectId', 'ProjectName', 'COMPANYNAME', 'PhysicalProgress', 'Expenditure']]
        except Exception as e:
            print(f"[ERROR] Tracker Failed: {e}")
            return pd.DataFrame()

if __name__ == "__main__":
    print("--- PRAKALP-DRISHTI: KARYA-DAKSHATA ENGINE INIT ---")
    scorer = AgencyScorer()
    debiaser = ProjectDebiaser(scorer)
    
    test_agencies = [
        "Ministry of Coal", 
        "Bharat Petroleum Corporation Limited [BPCL]"
    ]
    
    print("\n[DE-BIASING ENGINE TEST]")
    print("Simulating a new Rs. 500 Cr project taking exactly 1000 days (approx. 2.7 years) for each agency...\n")
    
    for agency in test_agencies:
        result = debiaser.predict_true_metrics(agency, base_cost_cr=500.0, base_time_days=1000.0)
        print(f"AGENCY: {result['Agency']}")
        print(f"  > Reliability Score : {result['Reliability_Score']}/100")
        print(f"  > Claimed Cost      : Rs. {result['Base_Cost_Cr']} Cr  -->  TRUE EXPECTED COST : Rs. {result['True_Expected_Cost_Cr']} Cr")
        print(f"  > Claimed Timeline  : {result['Base_Timeline_Days']} days --> TRUE EXPECTED TIME : {result['True_Expected_Timeline_Days']} days")
        print(f"  > Historical Track  : {result['Historical_Cost_Variance_Avg']} Cost | {result['Historical_Delay_Avg']} Delay\n")

    tracker = DeadCapitalTracker()
    dead_df = tracker.get_dead_capital_projects()
    print(f"[DEAD CAPITAL TRACKER]")
    print(f"Flagged {len(dead_df)} mega-projects burning >Rs. 100 Cr with <20% physical progress.")
    if not dead_df.empty:
        print(dead_df.head(3).to_string(index=False))
