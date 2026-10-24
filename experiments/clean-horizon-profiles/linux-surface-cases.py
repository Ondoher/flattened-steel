"""Pair surface optical and meteorological measurements with frozen inversion windows."""
import json
import math
import pathlib
import statistics
import sys
from netcdf import NetCDF

ROOT = pathlib.Path(__file__).resolve().parents[2]
RUN = ROOT / sys.argv[1]
RUN.resolve().relative_to(ROOT / 'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN / 'manifest.json').exists()
raw = ROOT / 'tmp/experiments/clean-horizon-profiles/runs/00013-arm-surface'
windows = json.loads((ROOT / 'tmp/experiments/clean-horizon-profiles/runs/00010-arm-qualify/qualification.json').read_text())
results = []
for date in ['2023-12-05', '2023-01-05', '2023-02-27']:
    aop = NetCDF(next(raw.glob('*aop*' + date.replace('-', '') + '*.nc')))
    met = NetCDF(next(raw.glob('*met*' + date.replace('-', '') + '*.cdf')))
    try:
        # Both products explicitly define these offsets from UTC midnight.
        assert ('seconds since ' + date + ' 00:00:00') in aop.variables['time_offset']['attributes']['units']
        assert ('seconds since ' + date + ' 00:00:00') in met.variables['time_offset']['attributes']['units']
        at = aop.read('time_offset'); mt = met.read('time_offset')
        optical = ['Bs_B', 'Bs_G', 'Bs_R', 'Ba_B_combined', 'Ba_G_combined', 'Ba_R_combined', 'ssa_G', 'g_G', 'RH_Neph_Dry', 'P_Neph_Dry', 'T_Neph_Dry']
        weather = ['atmos_pressure', 'temp_mean', 'rh_mean']
        arrays = {name: aop.read(name) for name in optical}
        flags = {name: aop.read('qc_' + name) for name in optical}
        marrays = {name: met.read(name) for name in weather}
        mflags = {name: met.read('qc_' + name) for name in weather}
        impactor = aop.read('impactor_state')
        for w in windows:
            if w['date'] != date or not w['qcPass'] or w['cloudOrRainBins']:
                continue
            t = w['timeSeconds']
            indexes = [i for i, value in enumerate(at) if abs(value-t) <= 300 and impactor[i] == 10]
            mi = [i for i, value in enumerate(mt) if abs(value-t) <= 300]
            def summarize(values, qc, indexes):
                valid = [values[i] for i in indexes if qc[i] == 0 and math.isfinite(values[i]) and values[i] > -999]
                return {'count': len(valid), 'mean': statistics.mean(valid) if valid else None,
                        'minimum': min(valid) if valid else None, 'maximum': max(valid) if valid else None,
                        'flagCounts': {str(int(k)): sum(qc[i] == k for i in indexes) for k in set(qc[i] for i in indexes)}}
            surface = {name: summarize(arrays[name], flags[name], indexes) for name in optical}
            # Retain the other impactor state separately; never silently substitute it.
            submicron = [i for i, value in enumerate(at) if abs(value-t) <= 300 and impactor[i] == 1]
            fine_surface = {name: summarize(arrays[name], flags[name], submicron) for name in optical}
            meteo = {name: summarize(marrays[name], mflags[name], mi) for name in weather}
            item = {'date': date, 'time': w['time'], 'aod550': w['aod550'], 'surface': surface, 'submicronSurface': fine_surface, 'weather': meteo,
                    'impactorMicrons': 10, 'windowHalfWidthSeconds': 300,
                    'sourceFiles': [aop.path.name, met.path.name], 'siteAltitudeM': aop.read('alt')[0]}
            p = meteo['atmos_pressure']['mean']; temp = meteo['temp_mean']['mean']
            common = [i for i in indexes if flags['Bs_G'][i] == 0 and flags['Ba_G_combined'][i] == 0
                      and arrays['Bs_G'][i] >= 0 and arrays['Ba_G_combined'][i] >= 0]
            scatter = statistics.mean(arrays['Bs_G'][i] for i in common) if common else None
            absorb = statistics.mean(arrays['Ba_G_combined'][i] for i in common) if common else None
            item['pairedGreenOpticalSamples'] = len(common)
            item['pairedGreenScatteringReferencePerMm'] = scatter
            item['pairedGreenAbsorptionReferencePerMm'] = absorb
            if all(value is not None for value in [p, temp, scatter, absorb]):
                # Met pressure attributes use kPa; optics are referenced to 1013.25 hPa and 273.15 K.
                assert met.variables['atmos_pressure']['attributes']['units'].rstrip('\0') == 'kPa'
                ratio = (p * 10 / 1013.25) * (273.15 / (temp + 273.15))
                item['dryAmbientDensityExtinction529PerKm'] = (scatter + absorb) * ratio / 1000
                item['densityRatio'] = ratio
            results.append(item)
            print(json.dumps({'date': date, 'time': w['time'], 'aod550': w['aod550'],
                'scatteringMm': scatter, 'absorptionMm': absorb, 'opticalSamples': surface['Bs_G']['count'],
                'ambientRH': meteo['rh_mean']['mean'], 'sampleRH': surface['RH_Neph_Dry']['mean'],
                'densityCorrectedDryExtinctionPerKm': item.get('dryAmbientDensityExtinction529PerKm')}), flush=True)
    finally:
        aop.close(); met.close()
(RUN / 'surface-cases.json').write_text(json.dumps(results, indent=2))
