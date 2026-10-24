"""Screen public ARM_SGP AERONET daily column data before requesting ARM files."""
import csv
import hashlib
import io
import json
import math
import pathlib
import sys
import time
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN/'manifest.json').exists()
params={'site':'ARM_SGP','year':2023,'month':1,'day':1,'year2':2023,'month2':12,'day2':31,'AOD20':1,'AVG':20,'if_no_html':1}
url='https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3?'+urllib.parse.urlencode(params)
start=time.monotonic()
with urllib.request.urlopen(url,timeout=60) as response:raw=response.read()
(RUN/'sgp-2023-daily.txt').write_bytes(raw)
lines=raw.decode('utf-8-sig').splitlines()
index=next(i for i,line in enumerate(lines) if line.startswith('AERONET_Site,Date('))
rows=list(csv.DictReader(io.StringIO('\n'.join(lines[index:]))))
selected=[]
for row in rows:
 aod=float(row.get('AOD_500nm',-999));angstrom=float(row.get('440-870_Angstrom_Exponent',-999))
 if aod>0 and 0<=angstrom<=4:
  selected.append({'date':row['Date(dd:mm:yyyy)'],'aod500':aod,'angstrom440870':angstrom,'aod550':aod*(550/500)**(-angstrom),'quality':row.get('Data_Quality_Level'),'note':'Daily column mean; no vertical/phase or local-horizon qualification yet.'})
selected.sort(key=lambda row:row['aod550'])
result={'sourceUrl':url,'sha256':hashlib.sha256(raw).hexdigest(),'rows':len(rows),'eligible':len(selected),'best':selected[:12],'downloadSeconds':time.monotonic()-start,'selection':'Public Level2 daily AOD and Angstrom; input-only first screen, not image optimization.'}
(RUN/'screen.json').write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
