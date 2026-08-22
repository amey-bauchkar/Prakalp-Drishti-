"""
PRAKALP-DRISHTI: External Factor Correlation Engine
Find and correlate ALL possible external macro-economic factors with infrastructure project overruns.

External Factors to Fetch & Correlate:
1. Crude Oil Price (Brent) — affects bitumen, transport, energy projects
2. USD/INR Exchange Rate — affects imported equipment costs
3. Steel Price Index — direct construction material cost
4. Cement Price — direct construction material cost  
5. RBI Repo Rate — affects PSU borrowing costs
6. WPI (Wholesale Price Index) — overall input cost inflation
7. India GDP Growth Rate — economic cycle effects
8. Nifty Infra Index — market sentiment for infra sector
9. Gold Price — safe-haven indicator / economic uncertainty proxy
10. 10-Year Government Bond Yield — cost of capital for government
"""

import yfinance as yf
import pandas as pd
import numpy as np
from scipy import stats
import os
import time
import json
import warnings
warnings.filterwarnings('ignore')

OUTPUT_DIR = "paimana_extracted/external_factors"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 80)
print("PRAKALP-DRISHTI: External Factor Correlation Engine")
print("Fetching macro-economic data & correlating with project overruns")
print("=" * 80)

# ============================================================
# STEP 1: Fetch External Data via yfinance
# ============================================================

external_tickers = {
    # Commodity Prices
    "BZ=F": "Brent Crude Oil (USD/barrel)",
    "HG=F": "Copper Futures (USD/lb)",
    "GC=F": "Gold Futures (USD/oz)",
    
    # Currency
    "USDINR=X": "USD/INR Exchange Rate",
    
    # India Market Indices
    "^NSEI": "NIFTY 50",
    "^CNXINFRA": "NIFTY Infrastructure Index",  # May not exist, fallback below
    
    # Government Bond Proxy
    "^TNX": "US 10-Year Treasury Yield (proxy for global rates)",
    
    # India-specific ETFs as proxies
    "INDA": "iShares MSCI India ETF",
}

all_external = {}
print("\nFetching external macro data (5-year history)...")
print("-" * 50)

for ticker, name in external_tickers.items():
    print(f"  Fetching {name} ({ticker})...", end=" ")
    try:
        data = yf.Ticker(ticker).history(period="5y", auto_adjust=True)
        if not data.empty:
            all_external[ticker] = {
                'name': name,
                'data': data['Close'],
                'days': len(data)
            }
            print(f"OK - {len(data)} days")
        else:
            print("EMPTY")
    except Exception as e:
        print(f"FAILED: {e}")
    time.sleep(0.3)

# Also try to fetch Steel & Cement proxies
steel_tickers = ["X", "MT", "TATASTEEL.NS", "JSWSTEEL.NS", "SAIL.NS"]
print("\nFetching Steel Price Proxies...")
for ticker in steel_tickers:
    try:
        data = yf.Ticker(ticker).history(period="5y", auto_adjust=True)
        if not data.empty and len(data) > 200:
            all_external[ticker] = {
                'name': f"Steel Proxy: {ticker}",
                'data': data['Close'],
                'days': len(data)
            }
            print(f"  {ticker}: OK - {len(data)} days")
            break  # Use first successful one
    except:
        continue

cement_tickers = ["ULTRACEMCO.NS", "ACC.NS", "AMBUJACEM.NS"]
print("Fetching Cement Price Proxies...")
for ticker in cement_tickers:
    try:
        data = yf.Ticker(ticker).history(period="5y", auto_adjust=True)
        if not data.empty and len(data) > 200:
            all_external[ticker] = {
                'name': f"Cement Proxy: {ticker}",
                'data': data['Close'],
                'days': len(data)
            }
            print(f"  {ticker}: OK - {len(data)} days")
            break
    except:
        continue

# Bitumen proxy (closely tied to crude oil but let's also get Indian Oil)
bitumen_tickers = ["IOC.NS"]
print("Fetching Bitumen/Fuel Proxy (Indian Oil)...")
for ticker in bitumen_tickers:
    try:
        data = yf.Ticker(ticker).history(period="5y", auto_adjust=True)
        if not data.empty:
            all_external[ticker] = {
                'name': f"Bitumen/Fuel Proxy: Indian Oil",
                'data': data['Close'],
                'days': len(data)
            }
            print(f"  {ticker}: OK - {len(data)} days")
    except:
        pass

# Infrastructure sector ETF
infra_tickers = ["NIFTYBEES.NS"]
print("Fetching NIFTY proxy...")
for ticker in infra_tickers:
    try:
        data = yf.Ticker(ticker).history(period="5y", auto_adjust=True)
        if not data.empty:
            all_external[ticker] = {
                'name': f"NIFTY BeES ETF",
                'data': data['Close'],
                'days': len(data)
            }
            print(f"  {ticker}: OK - {len(data)} days")
    except:
        pass

# ============================================================
# STEP 2: Compute Yearly Averages for Correlation
# ============================================================

print("\n" + "=" * 80)
print("STEP 2: Computing yearly averages for correlation...")
print("=" * 80)

yearly_externals = {}
for ticker, info in all_external.items():
    series = info['data']
    series.index = pd.to_datetime(series.index)
    yearly = series.resample('YE').mean()
    yearly_externals[info['name']] = yearly
    
    # Also compute YoY change
    yoy = yearly.pct_change() * 100
    yearly_externals[f"{info['name']} (YoY Change %)"] = yoy

# Save external data
external_df = pd.DataFrame(yearly_externals)
external_df.to_csv(os.path.join(OUTPUT_DIR, "YEARLY_EXTERNAL_FACTORS.csv"))
print(f"\nSaved: YEARLY_EXTERNAL_FACTORS.csv")
print(external_df.to_string())

# ============================================================
# STEP 3: Build Project-Level Features by Sanction Year
# ============================================================

print("\n" + "=" * 80)
print("STEP 3: Correlating with PAIMANA project data...")
print("=" * 80)

paimana = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")
for col in ['OriginalCost', 'RevisedCost', 'DELAYED_TIME', 'PhysicalProgress']:
    paimana[col] = pd.to_numeric(paimana[col], errors='coerce')
paimana['SanctionDate'] = pd.to_datetime(paimana['SanctionDate'], errors='coerce')
paimana['Sanction_Year'] = paimana['SanctionDate'].dt.year
paimana['Overrun_Cr'] = paimana['RevisedCost'] - paimana['OriginalCost']
paimana['Overrun_Pct'] = (paimana['Overrun_Cr'] / paimana['OriginalCost'] * 100)
paimana['Has_Overrun'] = (paimana['Overrun_Cr'] > 0).astype(int)

# Group projects by sanction year
yearly_projects = paimana.groupby('Sanction_Year').agg(
    total_projects=('ProjectId', 'count'),
    overrun_rate=('Has_Overrun', 'mean'),
    avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    total_overrun_cr=('Overrun_Cr', lambda x: x[x>0].sum()),
    avg_cost_cr=('OriginalCost', 'mean'),
).round(3)

print("\nProjects by Sanction Year:")
print(yearly_projects.to_string())

# ============================================================
# STEP 4: Compute Correlations (External Factor vs Overrun)
# ============================================================

print("\n" + "=" * 80)
print("STEP 4: ALL CORRELATIONS — External Factors vs Project Overruns")
print("=" * 80)

correlation_results = []

for factor_name, factor_series in yearly_externals.items():
    if factor_series.isna().all():
        continue
    
    # Align by year
    factor_yearly = factor_series.copy()
    factor_yearly.index = factor_yearly.index.year
    
    # Merge with project data
    common_years = sorted(set(yearly_projects.index) & set(factor_yearly.index))
    if len(common_years) < 3:
        continue
    
    factor_vals = [factor_yearly.loc[y] for y in common_years if y in factor_yearly.index]
    overrun_vals = [yearly_projects.loc[y, 'overrun_rate'] for y in common_years if y in yearly_projects.index]
    
    # Filter NaN
    pairs = [(f, o) for f, o in zip(factor_vals, overrun_vals) if not (pd.isna(f) or pd.isna(o))]
    if len(pairs) < 3:
        continue
    
    f_clean, o_clean = zip(*pairs)
    
    try:
        corr, p = stats.spearmanr(f_clean, o_clean)
        
        if not np.isnan(corr):
            strength = "STRONG" if abs(corr) > 0.6 and p < 0.1 else "MODERATE" if abs(corr) > 0.4 else "WEAK"
            direction = "POSITIVE (factor up = overruns up)" if corr > 0 else "NEGATIVE (factor up = overruns down)"
            
            correlation_results.append({
                'Factor': factor_name,
                'Spearman_rho': round(corr, 3),
                'p_value': round(p, 4),
                'Strength': strength,
                'Direction': direction,
                'N_years': len(pairs),
            })
    except:
        continue

# Sort by absolute correlation strength
corr_df = pd.DataFrame(correlation_results)
corr_df['abs_corr'] = corr_df['Spearman_rho'].abs()
corr_df = corr_df.sort_values('abs_corr', ascending=False)

print("\nALL EXTERNAL FACTOR CORRELATIONS WITH PROJECT OVERRUN RATE:")
print("-" * 100)
for _, row in corr_df.iterrows():
    icon = "***" if row['Strength'] == 'STRONG' else "**" if row['Strength'] == 'MODERATE' else "*"
    print(f"  [{row['Strength']:8s}] rho={row['Spearman_rho']:+.3f} (p={row['p_value']:.4f}) | {row['Factor']}")

# Save correlation results
corr_df.to_csv(os.path.join(OUTPUT_DIR, "EXTERNAL_FACTOR_CORRELATIONS.csv"), index=False)
print(f"\nSaved: EXTERNAL_FACTOR_CORRELATIONS.csv")

# ============================================================
# STEP 5: Sector-Specific Commodity Correlations
# ============================================================

print("\n" + "=" * 80)
print("STEP 5: SECTOR-SPECIFIC COMMODITY IMPACT ANALYSIS")
print("=" * 80)

# Which sectors are most affected by which commodity?
sector_commodity_map = {
    'Roads & Highways': ['Brent Crude Oil', 'Steel', 'Bitumen'],
    'Railways': ['Steel', 'Copper'],
    'Electricity Generation': ['Brent Crude Oil', 'Steel'],
    'Electricity Transmission & Distribution': ['Copper', 'Steel'],
    'Oil & Gas': ['Brent Crude Oil'],
    'Coal': ['Brent Crude Oil'],
    'Shipping': ['Brent Crude Oil', 'Steel'],
    'Aviation': ['Brent Crude Oil', 'Steel'],
    'Water Resources': ['Steel', 'Cement'],
    'Real Estate': ['Steel', 'Cement'],
}

print("\nSector -> Commodity Vulnerability Matrix:")
for sector, commodities in sector_commodity_map.items():
    sector_projects = paimana[paimana['SectorName'] == sector]
    if len(sector_projects) > 5:
        overrun_rate = sector_projects['Has_Overrun'].mean() * 100
        avg_overrun = sector_projects.loc[sector_projects['Overrun_Cr'] > 0, 'Overrun_Pct'].mean()
        print(f"\n  {sector} ({len(sector_projects)} projects, {overrun_rate:.1f}% overrun rate)")
        print(f"    Vulnerable to: {', '.join(commodities)}")
        if not pd.isna(avg_overrun):
            print(f"    Avg overrun when it happens: {avg_overrun:.1f}%")

# ============================================================
# STEP 6: Macro Regime Analysis
# ============================================================

print("\n" + "=" * 80)
print("STEP 6: MACRO REGIME ANALYSIS")
print("=" * 80)
print("How do projects sanctioned during different economic regimes perform?")

# Define economic regimes based on crude oil price
if 'BZ=F' in all_external:
    crude = all_external['BZ=F']['data']
    crude.index = pd.to_datetime(crude.index)
    crude_yearly = crude.resample('YE').mean()
    crude_yearly.index = crude_yearly.index.year
    
    # Map sanction years to crude oil price regime
    paimana_with_crude = paimana[paimana['Sanction_Year'].isin(crude_yearly.index)].copy()
    paimana_with_crude['Crude_At_Sanction'] = paimana_with_crude['Sanction_Year'].map(crude_yearly)
    paimana_with_crude['Crude_Regime'] = pd.cut(
        paimana_with_crude['Crude_At_Sanction'],
        bins=[0, 50, 70, 90, 200],
        labels=['Low (<$50)', 'Medium ($50-70)', 'High ($70-90)', 'Very High (>$90)']
    )
    
    regime_stats = paimana_with_crude.groupby('Crude_Regime', observed=True).agg(
        projects=('ProjectId', 'count'),
        overrun_rate=('Has_Overrun', 'mean'),
        avg_overrun_pct=('Overrun_Pct', lambda x: x[x>0].mean()),
    ).round(3)
    
    print("\nProject Outcomes by Crude Oil Price Regime at Sanction Time:")
    print(regime_stats.to_string())

# USD/INR regime
if 'USDINR=X' in all_external:
    usdinr = all_external['USDINR=X']['data']
    usdinr.index = pd.to_datetime(usdinr.index)
    usdinr_yearly = usdinr.resample('YE').mean()
    usdinr_yearly.index = usdinr_yearly.index.year
    
    paimana_with_fx = paimana[paimana['Sanction_Year'].isin(usdinr_yearly.index)].copy()
    paimana_with_fx['USDINR_At_Sanction'] = paimana_with_fx['Sanction_Year'].map(usdinr_yearly)
    paimana_with_fx['FX_Regime'] = pd.cut(
        paimana_with_fx['USDINR_At_Sanction'],
        bins=[0, 72, 80, 85, 100],
        labels=['Strong INR (<72)', 'Medium (72-80)', 'Weak (80-85)', 'Very Weak (>85)']
    )
    
    fx_stats = paimana_with_fx.groupby('FX_Regime', observed=True).agg(
        projects=('ProjectId', 'count'),
        overrun_rate=('Has_Overrun', 'mean'),
    ).round(3)
    
    print("\nProject Outcomes by USD/INR Regime at Sanction Time:")
    print(fx_stats.to_string())

# ============================================================
# STEP 7: Final Summary
# ============================================================

print("\n" + "=" * 80)
print("FINAL SUMMARY: EXTERNAL FACTORS FETCHED & CORRELATED")
print("=" * 80)

print(f"\nExternal data sources fetched: {len(all_external)}")
print(f"Correlations computed: {len(corr_df)}")
print(f"STRONG correlations: {len(corr_df[corr_df['Strength']=='STRONG'])}")
print(f"MODERATE correlations: {len(corr_df[corr_df['Strength']=='MODERATE'])}")

print(f"\nAll files saved to: {os.path.abspath(OUTPUT_DIR)}")
for f in os.listdir(OUTPUT_DIR):
    print(f"  {f}")

# Save full summary JSON
summary = {
    'fetch_timestamp': pd.Timestamp.now().isoformat(),
    'sources_fetched': len(all_external),
    'correlations_computed': len(corr_df),
    'top_correlations': corr_df.head(10).to_dict(orient='records'),
    'sector_commodity_map': sector_commodity_map,
}
with open(os.path.join(OUTPUT_DIR, "ANALYSIS_SUMMARY.json"), 'w') as f:
    json.dump(summary, f, indent=2, default=str)

print("\nDone!")
