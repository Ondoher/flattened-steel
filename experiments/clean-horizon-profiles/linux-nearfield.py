"""Audit the inherited near-field cutoff rather than mistake it for measurement coverage."""
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
parent = ROOT / 'tmp/experiments/clean-horizon-profiles/runs/00009-arm-acquire'
nc = NetCDF(next(parent.glob('*20231205*.nc')))
results = []
try:
    times = nc.read('time'); heights = nc.read('height_high')
    for label, t in [('18:32:27', 18*3600+32*60+27), ('19:31:54', 19*3600+31*60+54)]:
        indexes = [i for i, value in enumerate(times) if abs(value-t) <= 300]
        profiles = {name: [nc.read(name, [i, 0], [1, len(heights)]) for i in indexes]
                    for name in ['extinction_be', 'extinction_be_uncertainty_random', 'extinction_be_uncertainty_systematic', 'source_particulate_backscatter_be', 'source_lidar_ratio_be']}
        low = []
        for j, height in enumerate(heights):
            if height > 0.5:
                break
            item = {'heightKm': height}
            for name, rows in profiles.items():
                values = [row[j] for row in rows if math.isfinite(row[j]) and row[j] > -999]
                item[name] = statistics.mean(values) if values else None
            low.append(item)
        results.append({'time': label, 'profileIndexes': indexes, 'lowBins': low})
    coords = {name: nc.read(name)[0] for name in ['lat', 'lon', 'alt']}
    (RUN/'nearfield.json').write_text(json.dumps({'coordinates': coords, 'cases': results,
        'interpretation': 'Raw bins retained without clipping negatives or applying the inherited 150 m cutoff. Existence of a bin does not establish near-field overlap calibration. Raman optical wavelength must be read from the product handbook, not assumed to be 550 nm.'}, indent=2))
    print(json.dumps({'coordinates': coords, 'firstBins': [{'time': r['time'], 'bins': r['lowBins'][:5]} for r in results]}), flush=True)
finally:
    nc.close()
