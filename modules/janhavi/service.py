"""
PRAKALP-DRISHTI: VARSHA-SPEED Engine
Module Lead: Janhavi
- Parses 20-year IMD monsoon rainfall departure dataset (2005–2025) covering 630 state-years across 30 states.
- Calculates lost construction days, effective working windows, and schedule stretch multipliers.
- Integrates with 2,207 real mega-projects to project weather-adjusted completion schedules.
"""

import os
import csv
import math
from typing import Dict, Any, List, Optional

from analytics_engine.state_resolution import clean_text

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MONSOON_PATH = os.path.join(BASE_DIR, "paimana_extracted", "advanced_macro", "IMD_STATE_MONSOON_ANOMALIES_2005_2025.csv")
MASTER_PROJECTS_PATH = os.path.join(BASE_DIR, "paimana_extracted", "PAIMANA_MASTER_PROJECTS_DATABASE.csv")
ENRICHED_PATH = os.path.join(BASE_DIR, "paimana_extracted", "advanced_macro", "PAIMANA_ENRICHED_WITH_ADVANCED_FACTORS.csv")

# State Geo-Climatic & Terrain Archetypes
# Base non-working monsoon days and excess rain elasticity calibrated to Indian climatic zones & terrain
STATE_GEO_PROFILES = {
    "Arunachal Pradesh": {"region": "North-East", "base_lost_days": 88, "elasticity": 1.65, "risk_tier": "CRITICAL_TERRAIN_WINDOW", "terrain": "Steep Mountainous & Landslide-Prone"},
    "Assam": {"region": "North-East", "base_lost_days": 80, "elasticity": 1.50, "risk_tier": "SEVERE_FLOOD_PRONE", "terrain": "Brahmaputra Floodplain & Heavy Alluvial"},
    "Meghalaya": {"region": "North-East", "base_lost_days": 92, "elasticity": 1.70, "risk_tier": "CRITICAL_TERRAIN_WINDOW", "terrain": "Ultra-High Precipitation Plateau"},
    "Manipur": {"region": "North-East", "base_lost_days": 76, "elasticity": 1.45, "risk_tier": "SEVERE_FLOOD_PRONE", "terrain": "Hilly & Valley Flood Risk"},
    "Mizoram": {"region": "North-East", "base_lost_days": 82, "elasticity": 1.55, "risk_tier": "CRITICAL_TERRAIN_WINDOW", "terrain": "Steep Hill Tracts & Slope Fragility"},
    "Nagaland": {"region": "North-East", "base_lost_days": 78, "elasticity": 1.50, "risk_tier": "CRITICAL_TERRAIN_WINDOW", "terrain": "Hilly Fragile Terrain"},
    "Tripura": {"region": "North-East", "base_lost_days": 72, "elasticity": 1.35, "risk_tier": "HIGH_PRECIPITATION", "terrain": "Hilly Lowlands & Riverine Inundation"},
    "Sikkim": {"region": "North-East", "base_lost_days": 85, "elasticity": 1.65, "risk_tier": "LANDSLIDE_TERRAIN", "terrain": "High Himalayan Slopes & GLOF Vulnerable"},
    "Kerala": {"region": "South", "base_lost_days": 70, "elasticity": 1.40, "risk_tier": "HIGH_PRECIPITATION", "terrain": "Western Ghats Slopes & Coastal Belt"},
    "Uttarakhand": {"region": "North", "base_lost_days": 65, "elasticity": 1.55, "risk_tier": "LANDSLIDE_TERRAIN", "terrain": "Garhwal-Kumaon Himalayas & Flash Flood Risk"},
    "Himachal Pradesh": {"region": "North", "base_lost_days": 62, "elasticity": 1.50, "risk_tier": "LANDSLIDE_TERRAIN", "terrain": "High Mountain Valleys & Debris Flow Risk"},
    "Jammu and Kashmir": {"region": "North", "base_lost_days": 50, "elasticity": 1.30, "risk_tier": "LANDSLIDE_TERRAIN", "terrain": "Alpine & Valley Seasonal Freeze/Rain"},
    "Bihar": {"region": "East", "base_lost_days": 58, "elasticity": 1.30, "risk_tier": "RIVERINE_FLOOD_RISK", "terrain": "North Bihar Gangetic Basin Inundation"},
    "West Bengal": {"region": "East", "base_lost_days": 62, "elasticity": 1.35, "risk_tier": "CYCLONIC_COASTAL", "terrain": "Deltaic & North Bengal Sub-Himalayan"},
    "Odisha": {"region": "East", "base_lost_days": 56, "elasticity": 1.35, "risk_tier": "CYCLONIC_COASTAL", "terrain": "Bay of Bengal Coastal & Mahanadi Basin"},
    "Goa": {"region": "West", "base_lost_days": 68, "elasticity": 1.35, "risk_tier": "HIGH_PRECIPITATION", "terrain": "Konkan Coastal Escarpment"},
    "Maharashtra": {"region": "West", "base_lost_days": 46, "elasticity": 1.15, "risk_tier": "MODERATE_SEASONAL", "terrain": "Konkan Coast & Deccan Plateau Divide"},
    "Karnataka": {"region": "South", "base_lost_days": 45, "elasticity": 1.15, "risk_tier": "MODERATE_SEASONAL", "terrain": "Malnad Ghats & Interior Deccan"},
    "Tamil Nadu": {"region": "South", "base_lost_days": 38, "elasticity": 1.10, "risk_tier": "CYCLONIC_COASTAL", "terrain": "Coromandel Coastal Northeast Monsoon"},
    "Andhra Pradesh": {"region": "South", "base_lost_days": 44, "elasticity": 1.20, "risk_tier": "CYCLONIC_COASTAL", "terrain": "Coastal Deltas & Rayalaseema Plains"},
    "Telangana": {"region": "South", "base_lost_days": 40, "elasticity": 1.10, "risk_tier": "MODERATE_SEASONAL", "terrain": "Godavari-Krishna Semi-Arid Plateau"},
    "Chhattisgarh": {"region": "Central", "base_lost_days": 50, "elasticity": 1.20, "risk_tier": "MODERATE_SEASONAL", "terrain": "Mahanadi Basin & Forest Plateau"},
    "Madhya Pradesh": {"region": "Central", "base_lost_days": 45, "elasticity": 1.15, "risk_tier": "MODERATE_SEASONAL", "terrain": "Central Highlands & Narmada Valley"},
    "Jharkhand": {"region": "East", "base_lost_days": 48, "elasticity": 1.20, "risk_tier": "MODERATE_SEASONAL", "terrain": "Chota Nagpur Plateau"},
    "Uttar Pradesh": {"region": "North", "base_lost_days": 42, "elasticity": 1.10, "risk_tier": "RIVERINE_FLOOD_RISK", "terrain": "Gangetic Alluvial Plains"},
    "Punjab": {"region": "North", "base_lost_days": 28, "elasticity": 0.85, "risk_tier": "MODERATE_SEASONAL", "terrain": "Indo-Gangetic Semi-Arid Agricultural Plains"},
    "Haryana": {"region": "North", "base_lost_days": 25, "elasticity": 0.80, "risk_tier": "LOW_RAINFALL_ZONE", "terrain": "Semi-Arid Plains"},
    "Delhi": {"region": "North", "base_lost_days": 26, "elasticity": 0.85, "risk_tier": "LOW_RAINFALL_ZONE", "terrain": "Urban Yamuna Floodplain"},
    "Gujarat": {"region": "West", "base_lost_days": 32, "elasticity": 0.95, "risk_tier": "LOW_RAINFALL_ZONE", "terrain": "Saurashtra & Semi-Arid Coastal Plains"},
    "Rajasthan": {"region": "West", "base_lost_days": 20, "elasticity": 0.70, "risk_tier": "LOW_RAINFALL_ZONE", "terrain": "Thar Desert & Aravalli Rainshadow"}
}

# Sector weather sensitivities (high earthwork and outdoor linear works suffer highest downtime)
SECTOR_WEATHER_WEIGHTS = {
    "Road Transport and Highways": 1.45,
    "Railways": 1.25,
    "Shipping and Ports": 1.20,
    "Power": 0.95,
    "Petroleum & Natural Gas": 0.90,
    "Coal": 0.85,
    "Mines": 0.80,
    "Civil Aviation": 0.75,
    "Telecommunications": 0.60,
    "Urban Development": 1.10,
    "Heavy Industry": 0.65
}

class VarshaSpeedEngine:
    def __init__(self):
        self.monsoon_records: List[Dict[str, Any]] = []
        self.state_histories: Dict[str, List[Dict[str, Any]]] = {}
        self.state_statistics: Dict[str, Dict[str, Any]] = {}
        self.projects_cache: List[Dict[str, Any]] = []
        self._load_datasets()

    def _load_datasets(self):
        # 1. Load IMD 2005-2025 Dataset
        if os.path.exists(MONSOON_PATH):
            with open(MONSOON_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rec = {
                        "state": row["State"].strip(),
                        "year": int(row["Year"]),
                        "departure_pct": float(row["Monsoon_Rainfall_Departure_Pct"]),
                        "category": row["Rainfall_Category"].strip()
                    }
                    self.monsoon_records.append(rec)
                    if rec["state"] not in self.state_histories:
                        self.state_histories[rec["state"]] = []
                    self.state_histories[rec["state"]].append(rec)

        # Precompute 20-year statistical profile for each state
        for state, records in self.state_histories.items():
            departures = [r["departure_pct"] for r in records]
            mean_dep = sum(departures) / len(departures) if departures else 0.0
            variance = sum((x - mean_dep) ** 2 for x in departures) / len(departures) if departures else 0.0
            std_dev = math.sqrt(variance)
            max_excess_rec = max(records, key=lambda r: r["departure_pct"])
            max_deficit_rec = min(records, key=lambda r: r["departure_pct"])

            excess_count = sum(1 for r in records if r["departure_pct"] >= 20.0)
            deficient_count = sum(1 for r in records if r["departure_pct"] <= -20.0)
            normal_count = len(records) - excess_count - deficient_count

            geo = STATE_GEO_PROFILES.get(state, {
                "region": "Central",
                "base_lost_days": 45,
                "elasticity": 1.10,
                "risk_tier": "MODERATE_SEASONAL",
                "terrain": "Mixed Alluvial Plains"
            })

            self.state_statistics[state] = {
                "state": state,
                "region": geo["region"],
                "terrain": geo["terrain"],
                "risk_tier": geo["risk_tier"],
                "base_lost_days": geo["base_lost_days"],
                "elasticity": geo["elasticity"],
                "record_count": len(records),
                "years_span": f"{min(r['year'] for r in records)}–{max(r['year'] for r in records)}",
                "mean_departure_pct": round(mean_dep, 2),
                "std_dev_pct": round(std_dev, 2),
                "max_excess_year": max_excess_rec["year"],
                "max_excess_departure_pct": max_excess_rec["departure_pct"],
                "max_deficit_year": max_deficit_rec["year"],
                "max_deficit_departure_pct": max_deficit_rec["departure_pct"],
                "excess_years_count": excess_count,
                "deficient_years_count": deficient_count,
                "normal_years_count": normal_count
            }

        # 2. Load Master Projects Database
        if os.path.exists(MASTER_PROJECTS_PATH):
            try:
                with open(MASTER_PROJECTS_PATH, mode='r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        cost = float(row.get("OriginalCost", 0) or 0)
                        rev_cost = float(row.get("RevisedCost", 0) or cost)
                        delay = float(row.get("Delay_Months", 0) or 0)
                        progress = float(row.get("PhysicalProgress", 0) or 0)
                        state = clean_text(row.get("StateName")) or "Multi-State"
                        sector = row.get("SectorName", "").strip() or "Infrastructure"
                        self.projects_cache.append({
                            "project_id": row.get("ProjectId", ""),
                            "project_name": row.get("ProjectName", ""),
                            "sector": sector,
                            "state": state,
                            "line_ministry": row.get("LineMinistry", ""),
                            "original_cost_cr": cost,
                            "revised_cost_cr": rev_cost,
                            "delay_months": delay,
                            "physical_progress_pct": progress,
                            "original_end_date": row.get("OriginalEndDate", ""),
                            "revised_end_date": row.get("RevisedDate", "")
                        })
            except Exception as e:
                print(f"Error caching projects: {e}")

    def get_monsoon_impact_summary(self, rainfall_anomaly_pct: float = 15.0) -> Dict[str, Any]:
        """
        Simulate working-window compression for all 30 Indian states based on rainfall departure.
        """
        results = []
        for state, stat in sorted(self.state_statistics.items(), key=lambda x: x[0]):
            base_lost = stat["base_lost_days"]
            elasticity = stat["elasticity"]

            # Working-Window Compression Formula:
            # Adjusted Lost Days = Base * (1 + (Anomaly% / 100) * Elasticity)
            adjusted_lost_days = max(5.0, base_lost * (1.0 + (rainfall_anomaly_pct / 100.0) * elasticity))
            adjusted_lost_months = round(adjusted_lost_days / 30.4375, 2)
            effective_working_months = max(3.5, round(12.0 - adjusted_lost_months, 2))
            schedule_stretch_multiplier = round(12.0 / effective_working_months, 2)

            results.append({
                "state": state,
                "region": stat["region"],
                "terrain": stat["terrain"],
                "risk_tier": stat["risk_tier"],
                "base_lost_days": base_lost,
                "excess_rain_elasticity": elasticity,
                "simulated_lost_days": round(adjusted_lost_days, 1),
                "simulated_lost_months": adjusted_lost_months,
                "effective_working_window_months": effective_working_months,
                "schedule_stretch_multiplier": schedule_stretch_multiplier,
                "historical_mean_departure_pct": stat["mean_departure_pct"],
                "historical_max_excess_pct": stat["max_excess_departure_pct"],
                "historical_max_excess_year": stat["max_excess_year"]
            })

        avg_working_window = round(sum(r["effective_working_window_months"] for r in results) / len(results), 2) if results else 9.0
        avg_lost_days = round(sum(r["simulated_lost_days"] for r in results) / len(results), 1) if results else 50.0

        # Scenario interpretation
        if rainfall_anomaly_pct >= 30.0:
            scenario_note = "Extreme Monsoon / Severe Flooding Regime: Construction windows severely truncated, earthworks paralyzed in East and North-East corridors."
        elif rainfall_anomaly_pct > 0.0:
            scenario_note = "Excess Monsoon Departure: Extended wet spells and saturated soil horizons delay road surfacing and open-cast grading."
        elif rainfall_anomaly_pct == 0.0:
            scenario_note = "Normal IMD Long Period Average (LPA): Standard seasonal downtime applies."
        else:
            scenario_note = "Deficient Monsoon / Drought Window: Working season modestly expanded for civil foundation works, but secondary water-supply constraints emerge."

        return {
            "module": "VARSHA-SPEED",
            "module_lead": "Janhavi",
            "simulated_rainfall_anomaly_pct": rainfall_anomaly_pct,
            "scenario_interpretation": scenario_note,
            "data_source": "IMD Historical Monsoon Departure Matrix (2005–2025) · 630 State-Years",
            "total_states_modeled": len(results),
            "national_summary": {
                "average_working_window_months": avg_working_window,
                "average_lost_days_per_year": avg_lost_days,
                "national_schedule_stretch_multiplier": round(12.0 / avg_working_window, 2) if avg_working_window > 0 else 1.33,
                "most_vulnerable_state": max(results, key=lambda x: x["simulated_lost_days"])["state"] if results else "Meghalaya",
                "least_vulnerable_state": min(results, key=lambda x: x["simulated_lost_days"])["state"] if results else "Rajasthan"
            },
            "state_impact_records": results
        }

    def get_state_historical_profiles(self) -> Dict[str, Any]:
        """
        Return the 20-year historical monsoon statistics for all 30 Indian states.
        """
        return {
            "module": "VARSHA-SPEED",
            "period": "2005–2025 (21 Years)",
            "total_states": len(self.state_statistics),
            "profiles": list(self.state_statistics.values())
        }

    def get_state_timeline(self, state_name: str) -> Dict[str, Any]:
        """
        Return year-by-year 2005–2025 rainfall departure records for a specific state.
        """
        matched_state = None
        for s in self.state_histories.keys():
            if s.lower() == state_name.lower().strip():
                matched_state = s
                break

        if not matched_state:
            return {"error": f"State '{state_name}' not found in IMD historical dataset.", "available_states": sorted(list(self.state_histories.keys()))}

        timeline = sorted(self.state_histories[matched_state], key=lambda x: x["year"])
        stats = self.state_statistics.get(matched_state, {})

        return {
            "state": matched_state,
            "statistics": stats,
            "timeline": timeline
        }

    def get_project_weather_audit(self, limit: int = 50, sector_filter: Optional[str] = None, min_cost_cr: float = 500.0) -> Dict[str, Any]:
        """
        Audit real mega-projects against state weather risk & calculate weather-induced stretch factor.
        """
        audited_projects = []

        for p in self.projects_cache:
            if p["original_cost_cr"] < min_cost_cr:
                continue
            if sector_filter and sector_filter.lower() not in p["sector"].lower():
                continue

            state = p["state"]
            state_stat = self.state_statistics.get(state)
            
            # If multi-state or not directly matched, apply national average profile
            if not state_stat:
                base_days = 48
                elasticity = 1.15
                risk_tier = "MULTI_STATE_CORRIDOR"
                region = "National"
                terrain = "Multi-State Linear Corridor"
                mean_dep = 0.5
            else:
                base_days = state_stat["base_lost_days"]
                elasticity = state_stat["elasticity"]
                risk_tier = state_stat["risk_tier"]
                region = state_stat["region"]
                terrain = state_stat["terrain"]
                mean_dep = state_stat["mean_departure_pct"]

            sector_weight = SECTOR_WEATHER_WEIGHTS.get(p["sector"], 1.0)
            effective_lost_days = round(base_days * (1.0 + (mean_dep / 100.0) * elasticity) * sector_weight, 1)
            effective_working_months = max(3.5, round(12.0 - (effective_lost_days / 30.4375), 1))
            stretch_multiplier = round(12.0 / effective_working_months, 2)
            
            # Weather vulnerability score (0 - 100)
            weather_risk_score = min(100, int((effective_lost_days / 110.0) * 100))

            audited_projects.append({
                "project_id": p["project_id"],
                "project_name": p["project_name"],
                "sector": p["sector"],
                "state": state,
                "region": region,
                "terrain": terrain,
                "original_cost_cr": p["original_cost_cr"],
                "revised_cost_cr": p["revised_cost_cr"],
                "delay_months": p["delay_months"],
                "physical_progress_pct": p["physical_progress_pct"],
                "weather_risk_tier": risk_tier,
                "sector_weather_sensitivity": sector_weight,
                "annual_weather_downtime_days": effective_lost_days,
                "effective_annual_working_months": effective_working_months,
                "schedule_stretch_multiplier": stretch_multiplier,
                "weather_risk_score": weather_risk_score,
                "climate_adjustment_recommendation": f"Schedule baseline requires a {stretch_multiplier}x timeline multiplier due to {terrain.lower()} in {state}."
            })

        # Sort by cost and weather risk score
        audited_projects.sort(key=lambda x: (x["weather_risk_score"], x["original_cost_cr"]), reverse=True)

        return {
            "module": "VARSHA-SPEED",
            "audited_count": len(audited_projects),
            "projects": audited_projects[:limit]
        }

_varsha_speed_instance = None

def get_varsha_speed_engine() -> VarshaSpeedEngine:
    global _varsha_speed_instance
    if _varsha_speed_instance is None:
        _varsha_speed_instance = VarshaSpeedEngine()
    return _varsha_speed_instance
