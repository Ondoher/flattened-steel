"""Audit published ATom alternatives and the downloaded versioned guide."""
import hashlib
import json
import pathlib
import re
import sys
import time
import urllib.request
from pypdf import PdfReader

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN/'manifest.json').exists()
guide=ROOT/'tmp/experiments/clean-horizon-profiles/runs/00000-acquire/downloads/guide.pdf'
text='\n'.join(page.extract_text() or '' for page in PdfReader(guide).pages)
(RUN/'guide.txt').write_text(text,encoding='utf-8')
records=[]
for name,url in [
 ('noaa-data.html','https://csl.noaa.gov/projects/atom/data.php'),
 ('zenodo.json','https://zenodo.org/api/records/18815332'),
 ('espo.html','https://espoarchive.nasa.gov/archive/browse/atom'),
]:
 start=time.monotonic()
 try:
  with urllib.request.urlopen(url,timeout=40) as response:
   body=response.read()
   (RUN/name).write_bytes(body)
   row={'name':name,'url':url,'state':'downloaded','bytes':len(body),'sha256':hashlib.sha256(body).hexdigest()}
   if name.endswith('.html'):
    row['dataLinks']=[v for v in re.findall(r'href=["\']([^"\']+)',body.decode(errors='replace')) if any(x in v.lower() for x in ['data','support','archive','ornl','zenodo'])]
   if name=='zenodo.json':
    metadata=json.loads(body)
    row['files']=[{'key':f['key'],'size':f['size'],'checksum':f['checksum'],'url':f['links']['self']} for f in metadata.get('files',[])]
    row['description']=metadata.get('metadata',{}).get('description')
 except Exception as error:
  row={'name':name,'url':url,'state':'failed','error':type(error).__name__+': '+str(error)}
 row['seconds']=time.monotonic()-start;records.append(row);print(json.dumps(row),flush=True)
(RUN/'audit.json').write_text(json.dumps(records,indent=2))
