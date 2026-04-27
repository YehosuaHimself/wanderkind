"""Process a slice of countries — one bash call worth of work."""
import json, urllib.request, sys
PROJ  = "gjzhwpzgvdpkflgjesmb"
SBPAT = open("/tmp/sbpat.txt").read().strip()

def q(sql):
    body = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJ}/database/query",
        data=body, method="POST", headers={
            "Authorization": f"Bearer {SBPAT}",
            "Content-Type": "application/json",
            "User-Agent": "WK/1.0",
        })
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

# Build groups
groups = {}
with open("/tmp/geocoded.tsv") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 2: continue
        host_id, cc = parts[0], parts[1]
        if not cc: continue
        groups.setdefault(cc, []).append(host_id)

# Sort countries by row count DESC so we hit the biggest first
country_list = sorted(groups.keys(), key=lambda k: -len(groups[k]))
print(f"Total: {len(country_list)} countries, {sum(len(v) for v in groups.values())} rows", file=sys.stderr)

# Slice [start, end) of country_list
start = int(sys.argv[1])
end   = int(sys.argv[2])
slice_countries = country_list[start:end]

# Big VALUES UPDATE per country — fits 30k UUID at ~1.2MB body
total = 0
for cc in slice_countries:
    ids = groups[cc]
    # Chunks of 4000 IDs to keep payload safe
    for i in range(0, len(ids), 4000):
        chunk = ids[i:i+4000]
        id_list = ",".join(f"'{x}'" for x in chunk)
        sql = f"UPDATE hosts SET country='{cc}' WHERE id IN ({id_list}) AND country IS NULL;"
        try:
            q(sql)
            total += len(chunk)
        except Exception as e:
            print(f"  ERR {cc} +{i}: {str(e)[:100]}", file=sys.stderr)
    print(f"  {cc}: {len(ids)} done", file=sys.stderr)

print(f"SLICE DONE: rows updated this slice = {total}", file=sys.stderr)

# Usage: 
# 1. pip install reverse_geocoder --break-system-packages
# 2. python3 fetch_coords.py + run reverse_geocoder offline → /tmp/geocoded.tsv
# 3. python3 reverse_geocode_countries.py 0 120  (process all 120 country buckets)
# Idempotent — safe to re-run; only updates rows where country IS NULL.
