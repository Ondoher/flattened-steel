"""Qualify clean-date lidar support against public same-day AERONET retrievals."""
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
raw=ROOT/'tmp/experiments/clean-horizon-profiles/runs/00009-arm-acquire'
optics=ROOT/'tmp/experiments/clean-horizon-profiles/runs/00008-arm-optics'
def table(path):
 lines=path.read_text().splitlines();i=next(i for i,line in enumerate(lines) if line.startswith('AERONET_Site,Date('))
 return list(csv.DictReader(io.StringIO('\n'.join(lines[i:]))))
def seconds(text):return sum(float(v)*m for v,m in zip(text.split(':'),[3600,60,1]))
results=[];metadata=[]
for date in ['2023-12-05','2023-01-05','2023-02-27']:
 path=raw/('sgprlproffex1thorC1.c0.'+date.replace('-','')+'.000000.nc');nc=NetCDF(path)
 try:
  times=nc.read('time');heights=nc.read('height_high');nh=len(heights)
  metadata.append({'date':date,'dimensions':nc.dimensions,'attributes':nc.global_attributes,'variables':nc.variables,'decoder':nc.tool_identity()})
  rows=table(optics/(date+'-SSA.txt'));aods=table(optics/(date+'-AOD20.txt'))
  for inversion in rows:
   t=seconds(inversion['Time(hh:mm:ss)']);indexes=[i for i,value in enumerate(times) if abs(value-t)<=300]
   if not indexes:continue
   profiles={name:[nc.read(name,[i] if name=='qc_profile' else [i,0],[1] if name=='qc_profile' else [1,nh]) for i in indexes] for name in ['qc_profile','feature_mask','extinction_be','extinction_be_uncertainty_random','extinction_be_uncertainty_systematic','extinction_flag']}
   clouds=sum(bool(int(v)&12) for p in profiles['feature_mask'] for v in p if v>=0)
   qc_ok=all(p[0]==0 for p in profiles['qc_profile'])
   low=[];usable=[]
   for j,h in enumerate(heights):
    values=[p[j] for p in profiles['extinction_be']];random=[p[j] for p in profiles['extinction_be_uncertainty_random']];system=[p[j] for p in profiles['extinction_be_uncertainty_systematic']]
    if 0.15<=h<=12 and all(math.isfinite(v) and -1<v<5 for v in values):
     item={'heightKm':h,'extinctionPerKm':statistics.mean(values),'randomPerKm':statistics.mean(random),'systematicPerKm':statistics.mean(system),'flags':sorted(set(p[j] for p in profiles['extinction_flag']))}
     usable.append(item)
     if h<=.5:low.append(item)
   nearest=min(aods,key=lambda r:abs(seconds(r['Time(hh:mm:ss)'])-t))
   aod=float(nearest['AOD_500nm']);alpha=float(nearest['440-870_Angstrom_Exponent']);aod550=aod*1.1**(-alpha)
   item={'date':date,'time':inversion['Time(hh:mm:ss)'],'timeSeconds':t,'profileIndexes':indexes,'profileTimes':[times[i] for i in indexes],'qcPass':qc_ok,'cloudOrRainBins':clouds,'aod550':aod550,'aodSeparationSeconds':abs(seconds(nearest['Time(hh:mm:ss)'])-t),'ssa':{k:v for k,v in inversion.items() if k.startswith('Single_Scattering_Albedo')},'retrievalWithoutAodThreshold':inversion.get('If_Retrieval_is_L2(without_L2_0.4_AOD_440_threshold)'),'lowLevelBins':low,'profile':usable}
   results.append(item)
  print(json.dumps({'date':date,'times':len(times),'heights':nh,'heightMinimumKm':min(heights),'candidates':len(rows)}),flush=True)
 finally:nc.close()
(RUN/'metadata.json').write_text(json.dumps(metadata,indent=2));(RUN/'qualification.json').write_text(json.dumps(results,indent=2))
ranked=[r for r in results if r['qcPass'] and r['cloudOrRainBins']==0 and r['lowLevelBins']]
ranked.sort(key=lambda r:r['aod550'])
print(json.dumps({'eligible':len(ranked),'best':[{'date':r['date'],'time':r['time'],'aod550':r['aod550'],'lowBins':r['lowLevelBins'][:3]} for r in ranked[:6]]}),flush=True)
