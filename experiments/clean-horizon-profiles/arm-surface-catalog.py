"""Inspect public ARM surface-aerosol instrument metadata to resolve the lower-layer gap."""
import json
import pathlib
import sys
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2];RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not(RUN/'manifest.json').exists()
queries=['datastream.keyword:sgpaosnephdryC1.b1','datastream.keyword:sgpaospsap3wC1.b1','datastream.keyword:sgpaosacsmC1.b2','datastream.keyword:sgpaoshumidigraphC1.b1','datastream.keyword:sgpmetE13.b1']
records=[]
for index,query in enumerate(queries):
 params={'q':query,'size':2,'_source':'datastream,start_date,end_date,doi,pmt_var_names,link_url,datastream_abstract'}
 url='https://adc.arm.gov/elastic/metadata/_search?'+urllib.parse.urlencode(params)
 try:
  with urllib.request.urlopen(url,timeout=40) as response:body=response.read()
  (RUN/('catalog-'+str(index)+'.json')).write_bytes(body);data=json.loads(body)
  hits=[hit.get('_source',{}) for hit in data.get('hits',{}).get('hits',[])]
  record={'query':query,'state':'downloaded','hits':hits}
 except Exception as error:record={'query':query,'state':'failed','errorType':type(error).__name__}
 records.append(record);print(json.dumps(record),flush=True)
(RUN/'catalog.json').write_text(json.dumps(records,indent=2))
