"""
PRAKALP-DRISHTI: Module 4B — Market Stress Correlator
Fetch complete historical stock data for all 13 listed PSUs in PAIMANA dataset.
Merge with project cost overrun data to enable financial stress <-> cost revision analysis.
"""

import yfinance as yf
import pandas as pd
import os
import time
import json
from datetime import datetime

# ============================================================
# STEP 1: Define PSU -> Ticker Mapping (PAIMANA Company Names)
# ============================================================

PSU_TICKER_MAP = {
    # Ticker: (Company Short Name, [PAIMANA COMPANYNAME matches])
    "NTPC.NS": ("NTPC", [
        "National Thermal Power Corporation [NTPC]",
    ]),
    "POWERGRID.NS": ("Power Grid Corporation", [
        "Power Grid Corporation of India Limited [POWERGRID]",
    ]),
    "ONGC.NS": ("ONGC", [
        "Oil and Natural Gas Corporation Limited [ONGC]",
    ]),
    "NHPC.NS": ("NHPC", [
        "National Hydroelectric Power Corporation Limited [NHPC]",
    ]),
    "SJVN.NS": ("SJVN", [
        "Satluj Jal Vidyut Nigam [SJVN] Thermal Limited",
    ]),
    "IRCON.NS": ("IRCON International", [
        "Indian Railway Construction International Limited [IRCON]",
    ]),
    "RVNL.NS": ("RVNL", [
        "RVNL - II",
    ]),
    "SAIL.NS": ("SAIL", [
        "Steel Authority of India Limited [SAIL]",
    ]),
    "COALINDIA.NS": ("Coal India", [
        "WCL - CIL",
        "SECL - CIL",
        "ECL - CIL",
        "Mahanadi Coalfields Limited (MCL)",
        "South Eastern Coalfields Limited [SECL]",
        "Eastern Coal Fields Limited [ECL]",
    ]),
    "BPCL.NS": ("BPCL", [
        "Bharat Petroleum Corporation Limited [BPCL]",
    ]),
    "HINDPETRO.NS": ("HPCL", [
        "Hindustan Petroleum Corporation Limited",
    ]),
    "NLCIL.NS": ("NLC India", [
        "NLC India Limited [NLCIL]",
    ]),
    "ADANIT.NS": ("Adani Transmission", [
        "Adani Transmission Limited",
    ]),
}

# Also fetch Nifty 50 & Nifty PSE Index as benchmarks
BENCHMARK_TICKERS = {
    "^NSEI": "NIFTY 50",
    "^CNXPSE": "NIFTY PSE (Public Sector)",
}

OUTPUT_DIR = os.path.join("paimana_extracted", "stock_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# STEP 2: Fetch Historical Stock Data (5 Years)
# ============================================================

def fetch_stock_data(ticker, name, period="5y"):
    """Fetch OHLCV + Dividends data for a single ticker."""
    print(f"  📈 Fetching {name} ({ticker})...", end=" ")
    try:
        stock = yf.Ticker(ticker)
        
        # Get historical price data (daily)
        hist = stock.history(period=period, auto_adjust=True)
        
        if hist.empty:
            print(f"❌ No data returned!")
            return None, None
        
        hist['Ticker'] = ticker
        hist['CompanyName'] = name
        hist.index.name = 'Date'
        
        # Get company info (market cap, sector, etc.)
        try:
            info = stock.info
            company_info = {
                'Ticker': ticker,
                'CompanyName': name,
                'MarketCap_Cr': round(info.get('marketCap', 0) / 1e7, 2),  # Convert to Crores
                'Sector': info.get('sector', 'N/A'),
                'Industry': info.get('industry', 'N/A'),
                'CurrentPrice': info.get('currentPrice', 0),
                '52WeekHigh': info.get('fiftyTwoWeekHigh', 0),
                '52WeekLow': info.get('fiftyTwoWeekLow', 0),
                'PE_Ratio': info.get('trailingPE', 0),
                'BookValue': info.get('bookValue', 0),
                'DividendYield': round(info.get('dividendYield', 0) * 100, 2) if info.get('dividendYield') else 0,
                'DebtToEquity': info.get('debtToEquity', 0),
                'ROE': round(info.get('returnOnEquity', 0) * 100, 2) if info.get('returnOnEquity') else 0,
                'RevenueGrowth': round(info.get('revenueGrowth', 0) * 100, 2) if info.get('revenueGrowth') else 0,
                'EarningsGrowth': round(info.get('earningsGrowth', 0) * 100, 2) if info.get('earningsGrowth') else 0,
                'TotalRevenue_Cr': round(info.get('totalRevenue', 0) / 1e7, 2),
                'TotalDebt_Cr': round(info.get('totalDebt', 0) / 1e7, 2),
                'FreeCashFlow_Cr': round(info.get('freeCashflow', 0) / 1e7, 2) if info.get('freeCashflow') else 0,
            }
        except Exception as e:
            print(f"(info partial) ", end="")
            company_info = {'Ticker': ticker, 'CompanyName': name}
        
        print(f"✅ {len(hist)} trading days fetched")
        return hist, company_info
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None, None


def compute_quarterly_metrics(hist_df):
    """Compute quarterly returns, volatility, and drawdown from daily OHLCV."""
    if hist_df is None or hist_df.empty:
        return None
    
    df = hist_df.copy()
    df.index = pd.to_datetime(df.index)
    
    # Quarterly resampling
    quarterly = df['Close'].resample('QE').agg(['first', 'last', 'max', 'min'])
    quarterly.columns = ['Open_Quarter', 'Close_Quarter', 'High_Quarter', 'Low_Quarter']
    quarterly['Quarterly_Return_Pct'] = ((quarterly['Close_Quarter'] - quarterly['Open_Quarter']) / quarterly['Open_Quarter'] * 100).round(2)
    quarterly['Quarterly_Drawdown_Pct'] = ((quarterly['Low_Quarter'] - quarterly['High_Quarter']) / quarterly['High_Quarter'] * 100).round(2)
    quarterly['Ticker'] = df['Ticker'].iloc[0]
    quarterly['CompanyName'] = df['CompanyName'].iloc[0]
    
    # Rolling 12-month (4 quarter) trailing return
    quarterly['Trailing_12M_Return_Pct'] = quarterly['Close_Quarter'].pct_change(periods=4).mul(100).round(2)
    
    # Volatility (annualized from daily returns within each quarter)
    daily_returns = df['Close'].pct_change()
    quarterly_vol = daily_returns.resample('QE').std() * (252 ** 0.5) * 100  # Annualized
    quarterly['Annualized_Volatility_Pct'] = quarterly_vol.round(2)
    
    quarterly.index.name = 'Quarter_End'
    return quarterly


# ============================================================
# STEP 3: Main Execution
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("PRAKALP-DRISHTI: Module 4B — Market Stress Correlator")
    print("Fetching 5-Year Historical Stock Data for 13 Listed PSUs")
    print("=" * 70)
    print()
    
    all_daily_data = []
    all_quarterly_data = []
    all_company_info = []
    fetch_results = {}
    
    # --- Fetch PSU Stock Data ---
    print("📊 FETCHING PSU STOCK DATA...")
    print("-" * 50)
    
    for ticker, (short_name, paimana_names) in PSU_TICKER_MAP.items():
        hist, info = fetch_stock_data(ticker, short_name)
        
        if hist is not None:
            # Add PAIMANA company name mapping
            hist['PAIMANA_Companies'] = "; ".join(paimana_names)
            all_daily_data.append(hist)
            
            # Compute quarterly metrics
            quarterly = compute_quarterly_metrics(hist)
            if quarterly is not None:
                quarterly['PAIMANA_Companies'] = "; ".join(paimana_names)
                all_quarterly_data.append(quarterly)
            
            fetch_results[ticker] = {
                'status': 'success',
                'days': len(hist),
                'start': str(hist.index.min().date()),
                'end': str(hist.index.max().date()),
            }
        else:
            fetch_results[ticker] = {'status': 'failed'}
        
        if info:
            info['PAIMANA_Companies'] = "; ".join(paimana_names)
            all_company_info.append(info)
        
        time.sleep(0.5)  # Rate limiting
    
    # --- Fetch Benchmark Indices ---
    print()
    print("📊 FETCHING BENCHMARK INDICES...")
    print("-" * 50)
    
    for ticker, name in BENCHMARK_TICKERS.items():
        hist, info = fetch_stock_data(ticker, name)
        if hist is not None:
            all_daily_data.append(hist)
            quarterly = compute_quarterly_metrics(hist)
            if quarterly is not None:
                all_quarterly_data.append(quarterly)
        time.sleep(0.5)
    
    # ============================================================
    # STEP 4: Merge & Save All Data
    # ============================================================
    
    print()
    print("💾 SAVING DATA FILES...")
    print("-" * 50)
    
    # 1. Daily OHLCV (all PSUs combined)
    if all_daily_data:
        daily_df = pd.concat(all_daily_data)
        daily_df.to_csv(os.path.join(OUTPUT_DIR, "PSU_DAILY_STOCK_PRICES.csv"))
        print(f"  ✅ PSU_DAILY_STOCK_PRICES.csv — {len(daily_df):,} rows")
    
    # 2. Quarterly Metrics (all PSUs combined)
    if all_quarterly_data:
        quarterly_df = pd.concat(all_quarterly_data)
        quarterly_df.to_csv(os.path.join(OUTPUT_DIR, "PSU_QUARTERLY_METRICS.csv"))
        print(f"  ✅ PSU_QUARTERLY_METRICS.csv — {len(quarterly_df):,} rows")
    
    # 3. Company Fundamentals Snapshot
    if all_company_info:
        info_df = pd.DataFrame(all_company_info)
        info_df.to_csv(os.path.join(OUTPUT_DIR, "PSU_COMPANY_FUNDAMENTALS.csv"), index=False)
        print(f"  ✅ PSU_COMPANY_FUNDAMENTALS.csv — {len(info_df)} companies")
    
    # 4. Ticker -> PAIMANA Company Mapping
    ticker_map_export = {}
    for ticker, (short_name, paimana_names) in PSU_TICKER_MAP.items():
        ticker_map_export[ticker] = {
            'short_name': short_name,
            'paimana_company_names': paimana_names
        }
    with open(os.path.join(OUTPUT_DIR, "TICKER_PAIMANA_MAPPING.json"), 'w') as f:
        json.dump(ticker_map_export, f, indent=2)
    print(f"  ✅ TICKER_PAIMANA_MAPPING.json")
    
    # 5. Fetch Results Log
    with open(os.path.join(OUTPUT_DIR, "FETCH_LOG.json"), 'w') as f:
        json.dump({
            'fetch_timestamp': datetime.now().isoformat(),
            'period': '5y',
            'results': fetch_results
        }, f, indent=2)
    print(f"  ✅ FETCH_LOG.json")
    
    # ============================================================
    # STEP 5: Now merge with PAIMANA overrun data
    # ============================================================
    
    print()
    print("🔗 MERGING WITH PAIMANA PROJECT OVERRUN DATA...")
    print("-" * 50)
    
    paimana_df = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")
    paimana_df['OriginalCost'] = pd.to_numeric(paimana_df['OriginalCost'], errors='coerce')
    paimana_df['RevisedCost'] = pd.to_numeric(paimana_df['RevisedCost'], errors='coerce')
    paimana_df['Overrun_Cr'] = paimana_df['RevisedCost'] - paimana_df['OriginalCost']
    paimana_df['Overrun_Pct'] = (paimana_df['Overrun_Cr'] / paimana_df['OriginalCost'] * 100).round(2)
    
    # Build reverse mapping: PAIMANA company name -> ticker
    company_to_ticker = {}
    for ticker, (short_name, paimana_names) in PSU_TICKER_MAP.items():
        for name in paimana_names:
            company_to_ticker[name] = {
                'Ticker': ticker,
                'ShortName': short_name
            }
    
    # Tag PAIMANA projects with stock tickers
    paimana_df['StockTicker'] = paimana_df['COMPANYNAME'].map(
        lambda x: company_to_ticker.get(x, {}).get('Ticker', None)
    )
    paimana_df['PSU_ShortName'] = paimana_df['COMPANYNAME'].map(
        lambda x: company_to_ticker.get(x, {}).get('ShortName', None)
    )
    
    # Filter only listed PSU projects
    listed_projects = paimana_df[paimana_df['StockTicker'].notna()].copy()
    
    print(f"  Total PAIMANA projects: {len(paimana_df)}")
    print(f"  Projects by LISTED PSUs: {len(listed_projects)} ({len(listed_projects)/len(paimana_df)*100:.1f}%)")
    print(f"  Projects with cost overrun (listed): {(listed_projects['Overrun_Cr'] > 0).sum()}")
    print(f"  Total overrun value (listed): ₹ {listed_projects[listed_projects['Overrun_Cr'] > 0]['Overrun_Cr'].sum():,.0f} Cr")
    
    # Save listed PSU projects with stock ticker tags
    listed_projects.to_csv(os.path.join(OUTPUT_DIR, "PAIMANA_LISTED_PSU_PROJECTS.csv"), index=False)
    print(f"  ✅ PAIMANA_LISTED_PSU_PROJECTS.csv — {len(listed_projects)} projects")
    
    # Per-PSU overrun summary
    psu_overrun_summary = listed_projects.groupby(['StockTicker', 'PSU_ShortName']).agg(
        total_projects=('ProjectId', 'count'),
        overrun_projects=('Overrun_Cr', lambda x: (x > 0).sum()),
        total_original_cost_cr=('OriginalCost', 'sum'),
        total_revised_cost_cr=('RevisedCost', 'sum'),
        total_overrun_cr=('Overrun_Cr', lambda x: x[x > 0].sum()),
        avg_overrun_pct=('Overrun_Pct', lambda x: x[x > 0].mean()),
        max_overrun_pct=('Overrun_Pct', 'max'),
    ).round(2).reset_index()
    
    # Merge with latest company fundamentals
    if all_company_info:
        info_df_slim = pd.DataFrame(all_company_info)[['Ticker', 'MarketCap_Cr', 'CurrentPrice', 
                                                         '52WeekHigh', '52WeekLow', 'PE_Ratio',
                                                         'DebtToEquity', 'ROE', 'TotalRevenue_Cr',
                                                         'TotalDebt_Cr', 'FreeCashFlow_Cr']].copy()
        psu_overrun_summary = psu_overrun_summary.merge(
            info_df_slim, left_on='StockTicker', right_on='Ticker', how='left'
        ).drop(columns=['Ticker'])
    
    psu_overrun_summary.to_csv(os.path.join(OUTPUT_DIR, "PSU_OVERRUN_VS_FUNDAMENTALS.csv"), index=False)
    print(f"  ✅ PSU_OVERRUN_VS_FUNDAMENTALS.csv — {len(psu_overrun_summary)} PSUs")
    
    # ============================================================
    # STEP 6: Print Final Summary
    # ============================================================
    
    print()
    print("=" * 70)
    print("✅ ALL DATA FETCHED SUCCESSFULLY!")
    print("=" * 70)
    print()
    print("📁 Files saved in:", os.path.abspath(OUTPUT_DIR))
    print()
    print("📊 Per-PSU Summary:")
    print(psu_overrun_summary[['PSU_ShortName', 'total_projects', 'overrun_projects', 
                                'total_overrun_cr', 'avg_overrun_pct', 'MarketCap_Cr']].to_string(index=False))
    print()
    print("Done! Ready for Module 4B: Market Stress Correlator analysis.")
