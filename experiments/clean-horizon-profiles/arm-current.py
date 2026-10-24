"""Resolve renamed/facility-specific current ARM surface optical streams."""
import json
import pathlib
import sys
import urllib.parse
import urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2];RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
records=[]
for index,pattern in enumerate(['sgpaosneph*','sgpaospsap*','sgpaosclap*','sgpaop*','sgpaosfRH*','sgpaoshum*']):
 params={'q':'datastream.keyword:'+pattern,'size':3000,'_source':'datastream,start_date,end_date,doi,link_url'}
 url='https://adc.arm.gov/elastic/metadata/_search?'+urllib.parse.urlencode(params)
 try:
  with urllib.request.urlopen(url,timeout=40) as response:raw=response.read()
  (RUN/('response-'+str(index)+'.json')).write_bytes(raw);data=json.loads(raw)
  unique={}
  for hit in data.get('hits',{}).get('hits',[]):
   row=hit.get('_source',{});key=row.get('datastream');existing=unique.get(key)
   if existing is None or str(row.get('end_date',''))>str(existing.get('end_date','')):unique[key]=row
  record={'pattern':pattern,'hits':data.get('hits',{}).get('total'),'streams':list(unique.values())}
 except Exception as error:record={'pattern':pattern,'errorType':type(error).__name__}
 records.append(record);print(json.dumps(record),flush=True)
(RUN/'streams.json').write_text(json.dumps(records,indent=2))
