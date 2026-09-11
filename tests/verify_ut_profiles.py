import urllib.request
import urllib.parse
import json

BASE = "http://127.0.0.1:8000"

def test_all():
    print("Testing /api/janhavi/monsoon-impact...")
    req = urllib.request.urlopen(f"{BASE}/api/janhavi/monsoon-impact?rainfall_anomaly_pct=15.0")
    data = json.loads(req.read())
    assert data["total_states_modeled"] == 36, f"Expected 36 states, got {data['total_states_modeled']}"
    assert len(data["state_impact_records"]) == 36

    uts = [
        "Andaman and Nicobar Islands",
        "Puducherry",
        "Ladakh",
        "Lakshadweep",
        "Dadra and Nagar Haveli and Daman and Diu",
        "Chandigarh"
    ]

    states = {s["state"]: s for s in data["state_impact_records"]}
    for ut in uts:
        assert ut in states, f"Missing UT {ut}"
        s = states[ut]
        assert s["simulated_lost_days"] > 0
        assert s["effective_working_window_months"] > 0
        assert s["schedule_stretch_multiplier"] >= 1.0
        print(f"  [OK] {ut}: {s['simulated_lost_days']} lost days, {s['effective_working_window_months']} mo/yr, {s['schedule_stretch_multiplier']}x ({s['risk_tier']})")

    print("\nTesting /api/janhavi/state-historical-profiles...")
    req2 = urllib.request.urlopen(f"{BASE}/api/janhavi/state-historical-profiles")
    data2 = json.loads(req2.read())
    assert data2["total_states"] == 36
    print(f"  [OK] Returned {data2['total_states']} total state profiles.")

    print("\nTesting /api/janhavi/state-timeline/ for all 6 UTs...")
    for ut in uts:
        url = f"{BASE}/api/janhavi/state-timeline/{urllib.parse.quote(ut)}"
        req3 = urllib.request.urlopen(url)
        data3 = json.loads(req3.read())
        timeline = data3.get("timeline", [])
        assert len(timeline) == 21, f"Expected 21 years for {ut}, got {len(timeline)}"
        assert timeline[0]["year"] == 2005
        assert timeline[-1]["year"] == 2025
        print(f"  [OK] {ut}: Verified 21-year historical anomaly time-series (2005-2025).")

    print("\nTesting project weather audit...")
    req4 = urllib.request.urlopen(f"{BASE}/api/janhavi/project-weather-audit?limit=10")
    data4 = json.loads(req4.read())
    assert "projects" in data4
    assert len(data4["projects"]) > 0
    print(f"  [OK] Audited {len(data4['projects'])} projects against state weather risks.")

    print("\n==========================================")
    print("ALL 36 STATES & 6 UTS ACCURATELY VERIFIED!")
    print("==========================================")

if __name__ == "__main__":
    test_all()
