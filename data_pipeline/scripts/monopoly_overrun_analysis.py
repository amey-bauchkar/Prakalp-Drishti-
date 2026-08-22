"""
PRAKALP-DRISHTI: Monopoly Power vs Cost Overrun Analysis
Hypothesis: Companies with monopoly/dominance in their sector demand more price hikes.

Metrics:
1. HHI (Herfindahl-Hirschman Index) per sector — measures market concentration
2. Company market share within each sector
3. Correlation: monopoly power vs cost overrun tendency
"""

import pandas as pd
import numpy as np

# Load data
df = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")
df["OriginalCost"] = pd.to_numeric(df["OriginalCost"], errors="coerce")
df["RevisedCost"] = pd.to_numeric(df["RevisedCost"], errors="coerce")
df["Overrun_Cr"] = df["RevisedCost"] - df["OriginalCost"]
df["Overrun_Pct"] = (df["Overrun_Cr"] / df["OriginalCost"] * 100).round(2)
df["Has_Overrun"] = (df["Overrun_Cr"] > 0).astype(int)

print("=" * 80)
print("MONOPOLY POWER vs COST OVERRUN ANALYSIS")
print("=" * 80)

# ============================================================
# STEP 1: Calculate sector-level concentration (HHI)
# ============================================================

print("\n" + "=" * 80)
print("STEP 1: SECTOR CONCENTRATION (HHI - Herfindahl-Hirschman Index)")
print("=" * 80)
print("HHI < 1500 = Competitive | 1500-2500 = Moderately Concentrated | > 2500 = MONOPOLY")
print("-" * 80)

sector_stats = []

for sector, group in df.groupby("SectorName"):
    total_projects = len(group)
    if total_projects < 3:
        continue
    
    # Company share in this sector (by project count)
    company_shares = group["COMPANYNAME"].value_counts()
    share_pcts = (company_shares / total_projects * 100)
    
    # HHI = sum of squared market shares
    hhi = (share_pcts ** 2).sum()
    
    # Top company
    top_company = company_shares.index[0]
    top_share = share_pcts.iloc[0]
    
    # Number of companies in sector
    num_companies = len(company_shares)
    
    # Overrun stats for this sector
    sector_overrun_rate = group["Has_Overrun"].mean() * 100
    sector_avg_overrun_pct = group.loc[group["Overrun_Cr"] > 0, "Overrun_Pct"].mean()
    sector_total_overrun = group.loc[group["Overrun_Cr"] > 0, "Overrun_Cr"].sum()
    
    # Concentration category
    if hhi > 2500:
        concentration = "MONOPOLY/OLIGOPOLY"
    elif hhi > 1500:
        concentration = "MODERATE"
    else:
        concentration = "COMPETITIVE"
    
    sector_stats.append({
        "Sector": sector,
        "Total_Projects": total_projects,
        "Num_Companies": num_companies,
        "Top_Company": top_company,
        "Top_Share_Pct": round(top_share, 1),
        "HHI": round(hhi, 0),
        "Concentration": concentration,
        "Overrun_Rate_Pct": round(sector_overrun_rate, 1),
        "Avg_Overrun_Pct": round(sector_avg_overrun_pct, 1) if not pd.isna(sector_avg_overrun_pct) else 0,
        "Total_Overrun_Cr": round(sector_total_overrun, 0) if not pd.isna(sector_total_overrun) else 0,
    })

sector_df = pd.DataFrame(sector_stats).sort_values("HHI", ascending=False)

print(sector_df[["Sector", "Total_Projects", "Num_Companies", "Top_Company", 
                  "Top_Share_Pct", "HHI", "Concentration", "Overrun_Rate_Pct", 
                  "Avg_Overrun_Pct"]].to_string(index=False))

# ============================================================
# STEP 2: Compare Monopoly vs Competitive sectors
# ============================================================

print("\n" + "=" * 80)
print("STEP 2: MONOPOLY vs COMPETITIVE COMPARISON")
print("=" * 80)

monopoly_sectors = sector_df[sector_df["HHI"] > 2500]
moderate_sectors = sector_df[(sector_df["HHI"] > 1500) & (sector_df["HHI"] <= 2500)]
competitive_sectors = sector_df[sector_df["HHI"] <= 1500]

for label, subset in [("MONOPOLY (HHI > 2500)", monopoly_sectors), 
                       ("MODERATE (1500-2500)", moderate_sectors),
                       ("COMPETITIVE (HHI < 1500)", competitive_sectors)]:
    if len(subset) > 0:
        avg_overrun_rate = subset["Overrun_Rate_Pct"].mean()
        avg_overrun_pct = subset["Avg_Overrun_Pct"].mean()
        total_overrun = subset["Total_Overrun_Cr"].sum()
        num_sectors = len(subset)
        print(f"\n  {label}")
        print(f"    Sectors: {num_sectors}")
        print(f"    Avg Overrun Rate: {avg_overrun_rate:.1f}% of projects have cost overruns")
        print(f"    Avg Overrun Amount: {avg_overrun_pct:.1f}% average price hike")
        print(f"    Total Overrun Value: Rs {total_overrun:,.0f} Cr")

# ============================================================
# STEP 3: Per-Company Monopoly Power vs Overrun
# ============================================================

print("\n" + "=" * 80)
print("STEP 3: TOP MONOPOLISTIC COMPANIES — Do they hike more?")
print("=" * 80)

company_stats = []

for company, group in df.groupby("COMPANYNAME"):
    total = len(group)
    if total < 3:
        continue
    
    overrun_count = group["Has_Overrun"].sum()
    overrun_rate = overrun_count / total * 100
    avg_overrun = group.loc[group["Overrun_Cr"] > 0, "Overrun_Pct"].mean()
    total_overrun = group.loc[group["Overrun_Cr"] > 0, "Overrun_Cr"].sum()
    
    # Calculate this company's sector dominance
    sectors = group["SectorName"].unique()
    max_share = 0
    dominant_sector = ""
    for sec in sectors:
        sec_total = len(df[df["SectorName"] == sec])
        share = len(group[group["SectorName"] == sec]) / sec_total * 100
        if share > max_share:
            max_share = share
            dominant_sector = sec
    
    company_stats.append({
        "Company": company[:50],
        "Projects": total,
        "Sector_Share_Pct": round(max_share, 1),
        "Dominant_Sector": dominant_sector[:30],
        "Overrun_Rate_Pct": round(overrun_rate, 1),
        "Avg_Overrun_Pct": round(avg_overrun, 1) if not pd.isna(avg_overrun) else 0,
        "Total_Overrun_Cr": round(total_overrun, 0) if not pd.isna(total_overrun) else 0,
        "Is_Monopoly": "YES" if max_share > 40 else "NO",
    })

company_df = pd.DataFrame(company_stats).sort_values("Sector_Share_Pct", ascending=False)

print("\nTop 25 Companies by Sector Dominance:")
print(company_df.head(25)[["Company", "Projects", "Sector_Share_Pct", "Is_Monopoly",
                            "Overrun_Rate_Pct", "Avg_Overrun_Pct", "Total_Overrun_Cr"]].to_string(index=False))

# ============================================================
# STEP 4: Statistical Correlation
# ============================================================

print("\n" + "=" * 80)
print("STEP 4: STATISTICAL CORRELATION — Monopoly Power vs Cost Overruns")
print("=" * 80)

from scipy import stats

# Correlation: Sector Share vs Overrun Rate
valid = company_df[(company_df["Sector_Share_Pct"] > 0) & (company_df["Projects"] >= 3)]

corr1, p1 = stats.spearmanr(valid["Sector_Share_Pct"], valid["Overrun_Rate_Pct"])
print(f"\n  Spearman Correlation: Sector Share % vs Overrun Rate %")
print(f"    rho = {corr1:.3f}, p-value = {p1:.4f}")
print(f"    Interpretation: {'SIGNIFICANT' if p1 < 0.05 else 'Not significant'} at 95% confidence")

corr2, p2 = stats.spearmanr(valid["Sector_Share_Pct"], valid["Avg_Overrun_Pct"])
print(f"\n  Spearman Correlation: Sector Share % vs Avg Overrun %")
print(f"    rho = {corr2:.3f}, p-value = {p2:.4f}")
print(f"    Interpretation: {'SIGNIFICANT' if p2 < 0.05 else 'Not significant'} at 95% confidence")

# Compare monopoly vs non-monopoly groups
mono = company_df[company_df["Is_Monopoly"] == "YES"]
non_mono = company_df[company_df["Is_Monopoly"] == "NO"]

print(f"\n  MONOPOLY companies (>40% sector share):")
print(f"    Count: {len(mono)}")
print(f"    Mean Overrun Rate: {mono['Overrun_Rate_Pct'].mean():.1f}%")
print(f"    Mean Overrun Amount: {mono['Avg_Overrun_Pct'].mean():.1f}%")

print(f"\n  NON-MONOPOLY companies (<40% sector share):")
print(f"    Count: {len(non_mono)}")
print(f"    Mean Overrun Rate: {non_mono['Overrun_Rate_Pct'].mean():.1f}%")
print(f"    Mean Overrun Amount: {non_mono['Avg_Overrun_Pct'].mean():.1f}%")

# Mann-Whitney U test
if len(mono) > 1 and len(non_mono) > 1:
    u_stat, u_p = stats.mannwhitneyu(mono["Overrun_Rate_Pct"], non_mono["Overrun_Rate_Pct"], alternative="greater")
    print(f"\n  Mann-Whitney U Test (Monopoly has HIGHER overrun rate?):")
    print(f"    U-statistic = {u_stat:.1f}, p-value = {u_p:.4f}")
    print(f"    Result: {'YES - Monopolies hike MORE!' if u_p < 0.05 else 'Not statistically significant at 95%'}")

# ============================================================
# STEP 5: The Verdict
# ============================================================

print("\n" + "=" * 80)
print("VERDICT: DO MONOPOLIES HIKE PRICES MORE?")
print("=" * 80)

mono_avg = mono["Overrun_Rate_Pct"].mean()
non_mono_avg = non_mono["Overrun_Rate_Pct"].mean()
diff = mono_avg - non_mono_avg

if diff > 0:
    print(f"\n  Monopoly companies demand price hikes {diff:.1f}% MORE OFTEN than competitive ones.")
else:
    print(f"\n  Monopoly companies demand price hikes {abs(diff):.1f}% LESS OFTEN than competitive ones.")

print(f"\n  Monopoly sectors' average cost hike: {mono['Avg_Overrun_Pct'].mean():.1f}%")
print(f"  Competitive sectors' average cost hike: {non_mono['Avg_Overrun_Pct'].mean():.1f}%")
print()
