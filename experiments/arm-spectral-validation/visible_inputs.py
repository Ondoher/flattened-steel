"""Extend the frozen physical contract for matched400-800nm zenith colors."""
import copy
import json
import math
import statistics as stats
import sys
from pathlib import Path
sys.dont_write_bytecode=True
from evidence import Run
from model import interp, phase, sha_local
from case import records


def main():
    """Add spectral support only; preserve profiles, geometries and existing channels."""
    with Run('visible-inputs',['visible_inputs.py','model.py','case.py','netcdf.py'],'Owner-requested matched zenith color spectral extension') as run:
        physical=run.parent('00025-physical-inputs')
        observations=run.parent('00023-case-freeze')
        phases=run.parent('00019-phase-coverage')
        source=json.loads((observations/'cases.json').read_text())
        contract=json.loads((physical/'contract.json').read_text())
        original=copy.deepcopy(contract)
        old={c['wavelengthNanometers']:c for c in contract['channels']}
        wavelengths=sorted(set(range(400,801,20))|set(old))
        solar_path=Path(contract['source']['file'])
        if sha_local(solar_path)!=contract['source']['sha256']:raise ValueError('Solar source changed')
        solar=[tuple(map(float,line.split()[:2])) for line in solar_path.read_text().splitlines() if line.strip() and not line.startswith('#')]
        (run.path/'solar-reference.txt').write_bytes(solar_path.read_bytes())
        pilot=source['cases'][0]
        day=234+sum(pilot['utcSecondsInterval'])/2/86400
        aod=min(source['aodLevel2'],key=lambda r:abs(float(r['Day_of_Year(Fraction)'])-day))
        aod_table=sorted((float(k[4:-2]),float(v)) for k,v in aod.items() if k.startswith('AOD_') and k[4:-2].isdigit() and k.endswith('nm') and float(v)>0)
        ssa=next(r for r in source['ssaLevel15'] if r['Time(hh:mm:ss)']=='22:21:37')
        row=next(r for r in records(phases/'phase-level15.body') if r['Date(dd:mm:yyyy)']=='22:08:2023' and r['Time(hh:mm:ss)']=='22:21:37')
        hm=contract['profiles']['mieScaleHeightMeters']
        rayleigh_scale=old[500]['rayleighScatteringPerMeter']*.5**4
        cross=contract['profiles']['ozoneCrossSectionTable']
        channels=[]
        for wave in wavelengths:
            if wave in old:
                channels.append(old[wave]);continue
            low,high=max(400,wave-2),min(800,wave+2)
            n=round((high-low)/.05)
            solar_average=stats.mean(interp(low+i*(high-low)/n,solar) for i in range(n+1))
            tau=math.exp(interp(math.log(wave),[(math.log(w),math.log(v)) for w,v in aod_table]))
            table=phase(row,wave)
            channels.append({'wavelengthNanometers':wave,'aerosolOpticalDepth':tau,
                'sourceIrradianceWattsPerSquareMeterPerNanometer':solar_average*contract['source']['earthDistanceScale']/1000,
                'rayleighScatteringPerMeter':rayleigh_scale*(wave/1000)**-4,
                'mieExtinctionPerMeter':tau/(hm*-math.expm1(-60000/hm)),
                'mieSingleScatteringAlbedo':interp(wave,[(w,float(ssa[f'Single_Scattering_Albedo[{w}nm]'])) for w in [440,675,870,1020]]),
                'groundAlbedo':interp(wave,[(w,float(ssa[f'Surface_Albedo[{w}m]'])) for w in [440,675,870,1020]]),
                'miePhaseTable':{'mu':table['mu'],'pdf':table['pdf']},'phaseRawCosineIntegral':table['preNormalizationIntegral'],
                'ozoneCrossSectionSquareMeters':interp(wave,[(360+10*i,v) for i,v in enumerate(cross)])})
        contract['channels']=channels
        contract['spectrumId']='arm-visible-400-800-26-v1'
        contract['reuseWavelengthNanometers']=sorted(old)
        contract['scope']='Qualitative matched zenith colors,400-800nm, same frozen physical atmosphere; not horizon data'
        contract['operator']='Point samples from4nm spectral bands;400/800 endpoints use clipped2nm bands. Common piecewise-linear spectral reconstruction at1nm for CIE integration.'
        contract['geometry']='Unchanged zenith directions and time windows; collector tilt/FOV remain an operator approximation.'
        contract['assumptions']+=['Below440nm aerosol phase, SSA and surface albedo are held at their440nm retrieval values; these are explicit color-extension assumptions',
            '400-800nm common integration excludes visible tails outside retained measured coverage; no wavelengths invented for the measurement',
            'Continuum solver spectra omit other gas absorption, which remains present in measured spectra; visual colors are conditional']
        for case in contract['cases']:
            observed=next(c for c in source['cases'] if c['id']==case['id'])
            case['measuredBandsMilliwatts']=[stats.mean(v for w,v in zip(observed['wavelengthNanometers'],observed['radianceMilliwattsPerSquareMeterPerSteradianPerNanometer'])
                if max(400,channel['wavelengthNanometers']-2)<=w<=min(800,channel['wavelengthNanometers']+2)) for channel in channels]
        for c in original['channels']:
            if next(x for x in channels if x['wavelengthNanometers']==c['wavelengthNanometers'])!=c:raise ValueError('Existing channel changed')
        run.json('contract.json',contract)
        run.json('result.json',{'channels':len(channels),'reusedProductionChannels':len(old),'newProductionChannels':len(channels)-len(old),
            'rangeNanometers':[400,800],'existingChannelsUnchanged':True,'direction':'zenith, elevation90degrees','accuracyQualified':False})
        print(json.dumps({'channels':len(channels),'newChannels':len(channels)-len(old)}),flush=True)

if __name__=='__main__':main()
