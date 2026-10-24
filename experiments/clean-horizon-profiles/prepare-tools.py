"""Adapt read-only earlier reference tools into the authorized new source root."""
from pathlib import Path

root=Path(__file__).resolve().parents[2]
target=root/'experiments/clean-horizon-profiles'
for name in ['cli.js','worker.py']:
 text=(root/'experiments/elevated-horizon-validation'/name).read_text()
 (target/name).write_text(text.replace('elevated-horizon-validation','clean-horizon-profiles'))
(target/'netcdf.py').write_text((root/'experiments/arm-spectral-validation/netcdf.py').read_text())
