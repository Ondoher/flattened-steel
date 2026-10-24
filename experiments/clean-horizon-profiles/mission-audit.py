"""Inspect public derivative coverage and acquire selected NASA mission files."""
import ast
import collections
import csv
import hashlib
import json
import math
import pathlib
import re
import struct
import sys
import time
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
PARENT=ROOT/'tmp/experiments/clean-horizon-profiles/runs/00002-public-data'
assert not (RUN/'manifest.json').exists()
csv_path=PARENT/'data/analysis_data/UKESM_ATOM_par_comp_u-dh870_SA-NH3-benchmark.csv'
with csv_path.open() as stream:
 reader=csv.DictReader(stream);fields=reader.fieldnames;rows=list(reader)
heights=[float(row['altitude']) for row in rows if row['altitude'] and math.isfinite(float(row['altitude']))]
inventory=[]
for name in ['UKESM_ATOM_Dp_u-dh870_SA-NH3-benchmark.npy','UKESM_ATOM_dNdlogDp_u-dh870_SA-NH3-benchmark.npy']:
 path=PARENT/'data/analysis_data'/name
 with path.open('rb') as stream:
  assert stream.read(6)==b'\x93NUMPY';version=stream.read(2);size=struct.unpack('<H' if version[0]==1 else '<I',stream.read(2 if version[0]==1 else 4))[0]
  header=ast.literal_eval(stream.read(size).decode('latin1'));assert header['descr'] in ['<f8','<f4']
  values=[value[0] for value in struct.iter_unpack('<d' if header['descr']=='<f8' else '<f',stream.read())]
  good=[value for value in values if math.isfinite(value)]
  inventory.append({'file':name,'header':header,'finite':len(good),'total':len(values),'minimum':min(good),'maximum':max(good)})
coverage={'source':'He et al. 2026 public collocated ATom derivative','rows':len(rows),'fields':fields,'heightMinimum':min(heights),'heightMaximum':max(heights),'below500':sum(h<500 for h in heights),'below160':sum(h<160 for h in heights),'arrays':inventory,'limitations':['5-minute collocation, not original 60-second optics.','CSV includes PM1 composition but no measured extinction/absorption/angular phase.','Numpy diameter/number units and humidity state require publication verification.']}
(RUN/'derivative-coverage.json').write_text(json.dumps(coverage,indent=2));print(json.dumps(coverage),flush=True)
amp=(PARENT/'nasa-AMP.html').read_text()
links=sorted(set(re.findall(r'href=["\']([^"\']+)',amp)))
downloads=[link for link in links if link.startswith('/archive/download/')]
(RUN/'amp-files.json').write_text(json.dumps(downloads,indent=2))
print(json.dumps({'ampFileGroups':dict(collections.Counter(link.split('/')[-1].split('_DC8')[0] for link in downloads))}),flush=True)
records=[]
for filename in ['MER-MED_DC8_20160812_R22.ict','NAerosol_DC8_20160812_R3.ict']:
 url='https://espoarchive.nasa.gov/archive/download/'+filename;start=time.monotonic()
 try:
  with urllib.request.urlopen(url,timeout=60) as response:body=response.read()
  (RUN/filename).write_bytes(body)
  text=body.decode('utf-8',errors='replace');header_count=int(text.splitlines()[0].split(',')[0]);lines=text.splitlines()
  (RUN/(filename+'.header.txt')).write_text('\n'.join(lines[:header_count]),encoding='utf-8')
  row={'file':filename,'url':url,'state':'downloaded','bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'headerLines':header_count,'dataRows':len(lines)-header_count,'columns':lines[header_count-1].split(',')}
 except Exception as error:row={'file':filename,'url':url,'state':'failed','error':type(error).__name__+': '+str(error)}
 row['seconds']=time.monotonic()-start;records.append(row);print(json.dumps({k:v for k,v in row.items() if k!='columns'}),flush=True)
(RUN/'nasa-files.json').write_text(json.dumps(records,indent=2))
