import yfinance as yf
import pandas as pd
import os

OUTPUT_DIR = "paimana_extracted/stock_data"

# NLC India correct ticker is NLCINDIA.NS
# Adani Transmission renamed to Adani Energy Solutions -> ADANIENSOL.NS
fixes = {
    "NLCINDIA.NS": ("NLC India", ["NLC India Limited [NLCIL]"]),
    "ADANIENSOL.NS": ("Adani Energy Solutions", ["Adani Transmission Limited"]),
}

for ticker, (name, paimana_names) in fixes.items():
    print(f"Fetching {name} ({ticker})...", end=" ")
    stock = yf.Ticker(ticker)
    hist = stock.history(period="5y", auto_adjust=True)
    if not hist.empty:
        hist["Ticker"] = ticker
        hist["CompanyName"] = name
        hist["PAIMANA_Companies"] = "; ".join(paimana_names)

        # Append to existing daily CSV
        existing = pd.read_csv(os.path.join(OUTPUT_DIR, "PSU_DAILY_STOCK_PRICES.csv"), index_col=0)
        combined = pd.concat([existing, hist])
        combined.to_csv(os.path.join(OUTPUT_DIR, "PSU_DAILY_STOCK_PRICES.csv"))

        print(f"OK - {len(hist)} days")

        # Get info
        try:
            info = stock.info
            mcap = info.get("marketCap", 0)
            cprice = info.get("currentPrice", 0)
            high52 = info.get("fiftyTwoWeekHigh", 0)
            low52 = info.get("fiftyTwoWeekLow", 0)
            pe = info.get("trailingPE", "N/A")
            de = info.get("debtToEquity", "N/A")
            print(f"  Market Cap: Rs {mcap/1e7:,.0f} Cr")
            print(f"  Current Price: Rs {cprice}")
            print(f"  52W High: Rs {high52}, Low: Rs {low52}")
            print(f"  P/E: {pe}, D/E: {de}")
        except Exception as e:
            print(f"  Info error: {e}")
    else:
        print("FAILED - no data")
