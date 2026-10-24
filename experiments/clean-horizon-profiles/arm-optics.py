"""Acquire public co-located optical constraints for input-ranked clean ARM dates."""
import csv
import hashlib
import io
import json
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN/'manifest.json').exists()
records=[]
for date in ['2023-12-05','2023-01-05','2023-02-27']:
 year,month,day=map(int,date.split('-'))
 for product in ['AOD20','SSA','PFN']:
  params={'site':'ARM_SGP','year':year,'month':month,'day':day,'year2':year,'month2':month,'day2':day,'AVG':10,'if_no_html':1}
  if product=='AOD20':params[product]=1;endpoint='print_web_data_v3'
  else:params.update({'product':product,'ALM15':1});endpoint='print_web_data_inv_v3'
  url='https://aeronet.gsfc.nasa.gov/cgi-bin/'+endpoint+'?'+urllib.parse.urlencode(params)
  name=date+'-'+product+'.txt';start=time.monotonic()
  try:
   with urllib.request.urlopen(url,timeout=60) as response:raw=response.read()
   (RUN/name).write_bytes(raw);lines=raw.decode('utf-8-sig',errors='replace').splitlines()
   idx=next((i for i,line in enumerate(lines) if line.startswith('AERONET_Site,Date(')),None)
   rows=list(csv.DictReader(io.StringIO('\n'.join(lines[idx:])))) if idx is not None else []
   selected=[]
   for row in rows:
    if product=='AOD20':
     aod=float(row.get('AOD_500nm',-999));alpha=float(row.get('440-870_Angstrom_Exponent',-999))
     if aod>=0 and alpha>=0:selected.append({'time':row['Time(hh:mm:ss)'],'aod550':aod*1.1**(-alpha)})
    elif product=='SSA':
     selected.append({'time':row['Time(hh:mm:ss)'],'values':{k:float(v) for k,v in row.items() if k.startswith('Single_Scattering_Albedo[')}})
    else:
     selected.append({'time':row['Time(hh:mm:ss)'],'validAngles':{str(w):sum(float(v)>=0 for k,v in row.items() if re.fullmatch(r'[\d.]+\['+str(w)+r'nm\]',k)) for w in [440,675,870,1020]}})
   row={'file':name,'url':url,'state':'downloaded','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'rows':len(rows),'summary':selected}
  except Exception as error:row={'file':name,'url':url,'state':'failed','error':type(error).__name__+': '+str(error)}
  row['seconds']=time.monotonic()-start;records.append(row)
  print(json.dumps({k:v for k,v in row.items() if k!='summary'}),flush=True)
(RUN/'optical-inventory.json').write_text(json.dumps(records,indent=2))
