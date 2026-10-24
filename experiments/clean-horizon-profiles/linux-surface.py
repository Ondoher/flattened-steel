"""Inventory actual units and quality flags of the acquired surface optical products."""
import json
import math
import pathlib
import re
import statistics
import sys
from netcdf import NetCDF
ROOT=pathlib.Path(__file__).resolve().parents[2];RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
parent=ROOT/'tmp/experiments/clean-horizon-profiles/runs/00013-arm-surface'
results=[]
for path in sorted(parent.glob('*.nc'))+sorted(parent.glob('*.cdf')):
 nc=NetCDF(path)
 try:
  date=path.name.split('.')[-3];times=nc.read('time_offset') if 'time_offset'in nc.variables else nc.read('time')
  attrs={'file':path.name,'global':nc.global_attributes,'variables':nc.variables,'dimensions':nc.dimensions}
  (RUN/(path.name+'.metadata.json')).write_text(json.dumps(attrs,indent=2))
  useful={name:var for name,var in nc.variables.items() if re.search('scat|abs|albedo|humidity|RH|sample_rh|temperature|pressure',name,re.I) and not name.startswith('qc_')}
  summaries={}
  for name,var in useful.items():
   shape=[d['size']for d in var['dimensions']]
   if shape and shape[0]==len(times) and math.prod(shape)<=2000000:
    values=nc.read(name);fill=var['attributes'].get('missing_value',-9999)
    valid=[v for v in values if math.isfinite(v) and v!=fill and v>-999]
    summaries[name]={'shape':shape,'units':var['attributes'].get('units'),'median':statistics.median(valid) if valid else None,'minimum':min(valid)if valid else None,'maximum':max(valid)if valid else None}
  results.append({'file':path.name,'summaries':summaries})
  print(json.dumps({'file':path.name,'variableNames':list(nc.variables),'opticalSummaries':summaries}),flush=True)
 finally:nc.close()
(RUN/'surface-inventory.json').write_text(json.dumps(results,indent=2))
