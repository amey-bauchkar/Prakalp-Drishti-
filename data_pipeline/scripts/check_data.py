import os

print("=== EXTERNAL FACTORS ===")
d = "paimana_extracted/external_factors"
for f in os.listdir(d):
    size = os.path.getsize(os.path.join(d, f))
    print(f"  {f}: {size/1024:.1f} KB")

print("\n=== STOCK DATA ===")
d2 = "paimana_extracted/stock_data"
for f in os.listdir(d2):
    size = os.path.getsize(os.path.join(d2, f))
    print(f"  {f}: {size/1024:.1f} KB")

print("\n=== TOTAL DATA INVENTORY ===")
total_size = 0
total_files = 0
for root, dirs, files in os.walk("paimana_extracted"):
    for f in files:
        total_size += os.path.getsize(os.path.join(root, f))
        total_files += 1
print(f"Total files: {total_files}")
print(f"Total data size: {total_size / 1024 / 1024:.1f} MB")
