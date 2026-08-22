import pandas as pd
df = pd.read_csv("paimana_extracted/PAIMANA_MASTER_PROJECTS_DATABASE.csv")
df['OriginalEndDate'] = pd.to_datetime(df['OriginalEndDate'], errors='coerce')
df['RevisedDate'] = pd.to_datetime(df['RevisedDate'], errors='coerce')
df['SanctionDate'] = pd.to_datetime(df['SanctionDate'], errors='coerce')

df['Delay_Months_Computed'] = ((df['RevisedDate'] - df['OriginalEndDate']).dt.days / 30.44).round(1)
print("Projects with RevisedDate:", df['RevisedDate'].notna().sum())
print("Projects with OriginalEndDate:", df['OriginalEndDate'].notna().sum())
print("Projects with Delay > 0 months:", (df['Delay_Months_Computed'] > 0).sum())
print("Mean delay among delayed projects:", df[df['Delay_Months_Computed'] > 0]['Delay_Months_Computed'].mean(), "months")
print("Max delay:", df['Delay_Months_Computed'].max(), "months")
