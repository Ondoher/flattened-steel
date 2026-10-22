"""Freeze observed windows and atmospheric coverage before model predictions."""

import bisect
import csv
import json
import math
import re
import statistics as stats
import sys

sys.dont_write_bytecode = True
from evidence import Run
from netcdf import NetCDF


def records(path):
    """Decode AERONET's named CSV columns, rejecting malformed row lengths."""
    lines = path.read_text().splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith('AERONET_Site,'))
    rows = list(csv.reader(lines[start:]))
    if any(len(row) != len(rows[0]) for row in rows):
        raise ValueError('AERONET CSV column count mismatch')
    return [dict(zip(rows[0], row)) for row in rows[1:]]


def plot(path, series, xlabel, ylabel):
    """Draw numerical curves as a native SVG; accompanying JSON owns values."""
    colors = ['#1769aa', '#d05c00', '#137c35', '#a838a8']
    points = [p for _, values in series for p in values]
    xmin, xmax = min(p[0] for p in points), max(p[0] for p in points)
    ymax = max(p[1] for p in points) * 1.08
    def point(p):
        return f'{70+(p[0]-xmin)/(xmax-xmin)*690:.2f},{350-p[1]/ymax*295:.2f}'
    content = ['<svg xmlns="http://www.w3.org/2000/svg" width="820" height="425" viewBox="0 0 820 425">',
               '<rect width="820" height="425" fill="white"/>',
               '<path d="M70 45V350H760" stroke="#555" fill="none"/>']
    for i in range(6):
        x = xmin+(xmax-xmin)*i/5
        y = ymax*i/5
        content += [f'<text x="{70+690*i/5}" y="375" text-anchor="middle" font-size="12">{x:.0f}</text>',
                    f'<text x="60" y="{354-295*i/5}" text-anchor="end" font-size="12">{y:.2g}</text>']
    for i, (name, values) in enumerate(series):
        color = colors[i % len(colors)]
        content += [f'<polyline points="{" ".join(point(p) for p in values)}" stroke="{color}" stroke-width="1.5" fill="none"/>',
                    f'<text x="{80+190*i}" y="25" fill="{color}" font-size="13">{name}</text>']
    content += [f'<text x="410" y="409" text-anchor="middle">{xlabel}</text>',
                f'<text x="20" y="200" transform="rotate(-90 20 200)" text-anchor="middle">{ylabel}</text>', '</svg>']
    path.write_text('\n'.join(content)+'\n', encoding='utf-8')


def main():
    """Retain pre-model spectral windows and a candid input-coverage gate."""
    with Run('case-freeze', ['case.py', 'netcdf.py'], 'M1 pre-model selection, actual data and input coverage') as run:
        optics = run.parent('00009-arm-optics')
        run.parent('00008-arm-sonde')
        aeronet = run.parent('00012-sgp-aeronet')
        ssa_parent = run.parent('00018-ssa-level15')
        phase_parent = run.parent('00019-phase-coverage')
        stability_parent = run.parent('00021-stable-windows')
        run.parent('00013-spectral-quality')
        spectra = NetCDF(optics/'raw/sgpsaszevisC1.a1.20230822.000001.nc')
        lidar = NetCDF(optics/'raw/sgprlproffex1thorC1.c0.20230822.000000.nc')
        try:
            times, waves = spectra.read('time'), spectra.read('wavelength')
            selected = [i for i,w in enumerate(waves) if 400 <= w <= 800]
            response = spectra.read('responsivity')
            zenith, azimuth = spectra.read('solar_zenith'), spectra.read('solar_azimuth')
            integration = spectra.read('integration_time')
            lt, heights = lidar.read('time'), lidar.read('height_high')
            nh = len(heights)
            cases = []
            # Frozen from day-screen cloud availability and inversion proximity, before predictions.
            reserved = json.loads((stability_parent/'result.json').read_text())['selectedReservedWindow']['utcSecondsInterval']
            for role, start, stop in [('pilot', 22*3600+20*60, 22*3600+24*60),
                                      ('reserved', *reserved)]:
                indexes = list(range(bisect.bisect_left(times, start), bisect.bisect_left(times, stop)))
                values = [spectra.read('zenith_radiance', [i,selected[0]], [1,len(selected)]) for i in indexes]
                if not indexes or any(v<0 or not math.isfinite(v) for row in values for v in row):
                    raise ValueError('Missing or invalid spectral window')
                means = [stats.mean(row[j] for row in values) for j in range(len(selected))]
                spreads = [stats.stdev(row[j] for row in values) for j in range(len(selected))]
                li = [i for i,t in enumerate(lt) if start <= t < stop]
                profiles = {}
                for name in ['feature_mask','qc_profile','extinction_be','extinction_be_uncertainty_random',
                             'extinction_be_uncertainty_systematic','pressure','temperature','extinction_flag']:
                    scalar = name == 'qc_profile'
                    rows = [lidar.read(name,[i] if scalar else [i,0],[1] if scalar else [1,nh]) for i in li]
                    profiles[name] = rows
                clouds = sum(bool(int(v)&12) for row in profiles['feature_mask'] for v in row)
                clean = clouds==0 and all(row[0]==0 for row in profiles['qc_profile'])
                case = {'id':role,'date':'2023-08-22','utcSecondsInterval':[start,stop],
                    'spectrumCount':len(indexes),'spectrumIndexes':[indexes[0],indexes[-1]],
                    'solarZenithApparentDegreesMean':stats.mean(zenith[i] for i in indexes),
                    'solarZenithDegreesRange':[min(zenith[i] for i in indexes),max(zenith[i] for i in indexes)],
                    'solarAzimuthDegreesMean':stats.mean(azimuth[i] for i in indexes),
                    'wavelengthNanometers':[waves[i] for i in selected],
                    'radianceMilliwattsPerSquareMeterPerSteradianPerNanometer':means,
                    'temporalStandardDeviationSameUnits':spreads,
                    'maximumVisibleTemporalCoefficientOfVariation':max(s/m for s,m in zip(spreads,means)),
                    'maximumReconstructedDarkSubtractedCounts':max(row[j]*response[k]*integration[i]
                        for row,i in zip(values,indexes) for j,k in enumerate(selected)),
                    'lidar':{'secondsUtc':[lt[i] for i in li],'heightKilometersAGL':heights,
                             'profiles':profiles,'cloudOrRainBins':clouds,'cloudScreenPass':clean},
                    'calibrationFile':spectra.variables['responsivity']['attributes']['responsivity_file'].strip('\0'),
                    'direction':'zenith, nominal 1 degree FOV; measured tilt remains an operator uncertainty',
                    'selectionUsedPredictions':False,'reservedForConfirmation':role=='reserved'}
                cases.append(case)
                print(json.dumps({'case':role,'spectra':len(indexes),'cloudScreen':clean,
                    'maximumTemporalCV':case['maximumVisibleTemporalCoefficientOfVariation']}),flush=True)
            ssa = records(ssa_parent/'aeronet-ssa-sgp-lev15.body')
            phase = [r for r in records(phase_parent/'phase-level15.body') if r['Date(dd:mm:yyyy)']=='22:08:2023' and r['Time(hh:mm:ss)']=='22:21:37']
            coverage = []
            for level in ['15','20']:
                for row in records(phase_parent/f'phase-level{level}.body'):
                    counts={str(w):sum(float(v)>=0 for k,v in row.items() if re.fullmatch(r'[\d.]+\['+str(w)+r'nm\]',k)) for w in [440,675,870,1020]}
                    coverage.append({'date':row['Date(dd:mm:yyyy)'],'time':row['Time(hh:mm:ss)'],
                                     'level':level,'validPhaseAnglesOf83':counts})
            columns={str(w):[(float(k.split('[')[0]),float(v)) for k,v in phase[0].items()
                            if re.fullmatch(r'[\d.]+\['+str(w)+r'nm\]',k)] for w in [440,675,870,1020]}
            run.json('cases.json',{'cases':cases,'unitsWitness':{'native':'W m^-2 um^-1 sr^-1','output':'mW m^-2 nm^-1 sr^-1','numericFactor':1},
                'aodLevel2':records(aeronet/'aeronet-aod-sgp.body'),
                'ssaLevel15':ssa,'phaseLevel15':columns,'phaseCoverageNearbyDates':coverage,
                'measurementAbsoluteUncertaintyBoundEstablished':False,
                'saturationRawCountProofAvailable':False,
                'limits':['D210830.12 applicable saturation NOTE; proxy is not raw count proof',
                    'Level2 SSA missing at this low AOD; Level1.5 is a conditional input',
                    'Complete Level1.5 phase is available; Level2 export masks values. Neither is an exact material measurement',
                    'Nearby windows share calibration and atmospheric systematic errors']})
            plot(run.path/'spectra.svg',[(c['id'],list(zip(c['wavelengthNanometers'],c['radianceMilliwattsPerSquareMeterPerSteradianPerNanometer']))) for c in cases],
                 'Wavelength (nm)','Zenith radiance (mW / m2 / nm / sr)')
            profile_series=[]
            for c in cases:
                row=c['lidar']['profiles']['extinction_be'][0]
                profile_series.append((c['id'],[(h,e) for h,e in zip(heights,row) if 0<=h<=6 and e>=0]))
            if all(values for _,values in profile_series):
                plot(run.path/'extinction.svg',profile_series,'Height AGL (km)','Particulate extinction (1/km)')
            run.json('result.json',{'scope':'M1 selection and quality; not algorithm validation',
                'cloudScreensPass':all(c['lidar']['cloudScreenPass'] for c in cases),
                'windowsFrozenBeforeModels':True,'fullAccuracyCaseAccepted':False,
                'reason':'Complete Level1.5 optical inputs and stable windows permit conditional characterization; absolute instrumental bound remains unqualified, so no definitive accuracy verdict',
                'nearbyPhaseFullyPopulatedRows':sum(all(v==83 for v in c['validPhaseAnglesOf83'].values()) for c in coverage)})
        finally:
            spectra.close();lidar.close()


if __name__=='__main__':
    main()
