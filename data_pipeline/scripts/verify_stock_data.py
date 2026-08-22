import pandas as pd
import os

d = "paimana_extracted/stock_data"
print("=== FILES IN stock_data/ ===")
for f in os.listdir(d):
    size = os.path.getsize(os.path.join(d, f))
    print(f"  {f:45s} {size/1024:,.1f} KB")

print()
daily = pd.read_csv(os.path.join(d, "PSU_DAILY_STOCK_PRICES.csv"))
print(f"Daily Stock Prices: {len(daily):,} rows")
tickers = daily["Ticker"].unique()
print(f"Unique tickers: {len(tickers)}")
for t in sorted(tickers):
    count = len(daily[daily["Ticker"] == t])
    print(f"  {t:25s} -> {count:,} trading days")

print()
quarterly = pd.read_csv(os.path.join(d, "PSU_QUARTERLY_METRICS.csv"))
print(f"Quarterly Metrics: {len(quarterly):,} rows")

print()
funds = pd.read_csv(os.path.join(d, "PSU_COMPANY_FUNDAMENTALS.csv"))
print(f"Company Fundamentals: {len(funds)} companies")
cols = ["CompanyName", "MarketCap_Cr", "CurrentPrice", "PE_Ratio", "DebtToEquity", "ROE"]
available = [c for c in cols if c in funds.columns]
print(funds[available].to_string(index=False))

print()
listed = pd.read_csv(os.path.join(d, "PAIMANA_LISTED_PSU_PROJECTS.csv"))
overrun_mask = listed["Overrun_Cr"] > 0
print(f"PAIMANA Listed PSU Projects: {len(listed)} projects")
print(f"  With cost overrun: {overrun_mask.sum()} projects")
total_overrun = listed.loc[overrun_mask, "Overrun_Cr"].sum()
print(f"  Total overrun value: Rs {total_overrun:,.0f} Cr")

print()
summary = pd.read_csv(os.path.join(d, "PSU_OVERRUN_VS_FUNDAMENTALS.csv"))
print(f"PSU Overrun vs Fundamentals: {len(summary)} PSUs")
print(summary.to_string(index=False))
