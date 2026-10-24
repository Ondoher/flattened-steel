"""Read the frozen December interval, preserving timing, native units and QC."""
import csv
import io
import json
import math
import pathlib
import statistics
import sys
from netcdf import NetCDF

ROOT=pathlib.Path(__file__).resolve().parents[2]
RUN=ROOT/sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN/'manifest.json').exists()
parent=ROOT/'tmp/experiments/clean-horizon-profiles/runs'
t=19*3600+31*60+54
def seconds(value):return sum(float(x)*m for x,m in zip(value.split(':'),[3600,60,1]))
def table(path):
 lines=path.read_text().splitlines();start=next(i for i,line in enumerate(lines) if line.startswith('AERONET_Site,Date('))
 return list(csv.DictReader(io.StringIO('\n'.join(lines[start:]))))
def selected(path):
 rows=table(path);row=min(rows,key=lambda r:abs(seconds(r['Time(hh:mm:ss)'])-t))
 return {'file':str(path.relative_to(ROOT)),'timeDifferenceSeconds':seconds(row['Time(hh:mm:ss)'])-t,'row':row}
result={'date':'2023-12-05','windowCenterUTC':'19:31:54','windowHalfWidthSeconds':300}
for product in ['AOD20','SSA','PFN']:
 result[product]=selected(parent/('00008-arm-optics/2023-12-05-'+product+'.txt'))
aop=NetCDF(next((parent/'00013-arm-surface').glob('*aop*20231205*.nc')))
try:
 times=aop.read('time');state=aop.read('impactor_state');bands=[]
 indexes=[i for i,v in enumerate(times) if abs(v-t)<=300 and state[i]==10]
 for band in ['B','G','R']:
  sn='Bs_'+band;an='Ba_'+band+'_combined';sv=aop.read(sn);av=aop.read(an);sq=aop.read('qc_'+sn);aq=aop.read('qc_'+an)
  valid=[i for i in indexes if sq[i]==0 and aq[i]==0 and sv[i]>=0 and av[i]>=0]
  bands.append({'band':band,'wavelength':aop.variables[sn]['attributes']['wavelength'].rstrip('\0'),'count':len(valid),
   'times':[times[i]for i in valid],'scatteringReferencePerMm':statistics.mean(sv[i]for i in valid) if valid else None,
   'absorptionReferencePerMm':statistics.mean(av[i]for i in valid)if valid else None})
 result['surface']={'coordinates':{key:aop.read(key)[0]for key in ['lat','lon','alt']},'bands':bands}
finally:aop.close()
nc=NetCDF(next((parent/'00009-arm-acquire').glob('*20231205*.nc')))
try:
 times=nc.read('time');heights=nc.read('height_high');indexes=[i for i,v in enumerate(times) if abs(v-t)<=300]
 names=['extinction_be','extinction_be_uncertainty_random','extinction_be_uncertainty_systematic','source_particulate_backscatter_be','source_lidar_ratio_be','feature_mask']
 data={name:[nc.read(name,[i,0],[1,len(heights)])for i in indexes]for name in names}
 bins=[]
 for j,h in enumerate(heights):
  if h>12:break
  good=[k for k in range(len(indexes)) if data['source_particulate_backscatter_be'][k][j]>0 and data['source_lidar_ratio_be'][k][j]>0 and data['feature_mask'][k][j]>=0 and not int(data['feature_mask'][k][j])&12 and data['extinction_be'][k][j]>-999]
  bins.append({'heightKm':h,'count':len(good),'extinction355PerKm':statistics.mean(data['extinction_be'][k][j]for k in good)if good else None,
    'randomPerKm':statistics.mean(data['extinction_be_uncertainty_random'][k][j]for k in good)if good else None,
    'maximumSystematicPerKm':statistics.mean(data['extinction_be_uncertainty_systematic'][k][j]for k in good)if good else None})
 result['lidar']={'coordinates':{key:nc.read(key)[0]for key in ['lat','lon','alt']},'times':[times[i]for i in indexes],'bins':bins}
finally:nc.close()
prior=json.loads((parent/'00023-surface-paired/surface-cases.json').read_text())
result['pairedWeather']=next(row for row in prior if row['date']=='2023-12-05' and row['time']=='19:31:54')
(RUN/'interval-data.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'aodTimeDifferenceSeconds':result['AOD20']['timeDifferenceSeconds'],'inversionTimeDifferenceSeconds':result['PFN']['timeDifferenceSeconds'],'surface':result['surface'],'lidarValidBinsAbove800m':sum(b['count']>0 and b['heightKm']>=.8 for b in bins)}),flush=True)
