# Algorithm32 Frame-Parity Experiment

This contained experiment runs current production Algorithm32 in controlled
benchmark world frames. It does not import or execute retired Algorithm32-Star
code. Generated evidence belongs under `tmp/algorithm32-frame-parity/`.

The first runner constructs one binary64 CPU J2 cache per requested B1
condition and compares its 81-by-40 boundary with the promoted retained J2
table. Progress is written after every construction position.

```powershell
node scripts/experiments/algorithm32-frame-parity/run-cpu-j2.js `
  --conditions 11:15 `
  --frame retained-z-up `
  --output tmp/algorithm32-frame-parity/001-retained-z-up-j2
```

`--frame retained-z-up` reproduces the audited historical Z-up/handedness
arrangement. `--frame current-x-up` executes the unchanged current frame on
the binary64 CPU path. `--frame current-z-rotation-90` applies one
determinant-`+1` 90-degree world rotation around global Z to that current
arrangement. The latter two form the proper-rotation invariance pair and must
be compared with each other rather than the retained table.

For lower-boundary qualification, `--boundary-altitude 0` selects the retained
first position node and matching geometry boundary. CPU and GPU runners both
support the exact node; the GPU uses the geometry-derived binary64 contact
mask required for discrete grazing-direction parity. `--ground black` removes
grass reflection on either runner for contribution localization. `--order 1`
provides the inexpensive primary-scattering stage split.

Summarize one or more completed value files against an explicit table
authority with:

```powershell
node scripts/experiments/algorithm32-frame-parity/analyze-results.js `
  --values PATH_TO_VALUES_JSON `
  --current PATH_TO_CURRENT_TABLE `
  --authority PATH_TO_AUTHORITY_TABLE `
  --output tmp/algorithm32-frame-parity/NUMBERED_ANALYSIS
```

The analyzer reports absolute and floored-relative value residuals, signed
mean, maximum location, and per-condition B1 RMSE. Generated output is
diagnostic evidence only and is never an implementation or oracle input.

Render retained-frame J2 Figure 5 diagnostic domes from one or more completed
value files with:

```powershell
node scripts/experiments/algorithm32-frame-parity/render-domes.js `
  --values PATH_TO_VALUES_JSON `
  --values ANOTHER_VALUES_JSON `
  --output tmp/algorithm32-frame-parity/NUMBERED_DOME_RENDER
```

The renderer emits an individual PNG for each available Figure 5 condition,
a labeled SVG strip, and `result.json` with the source files, RMSE scores, and
image hashes. These are J2 diagnostic renders of the tested configuration;
they are not the canonical J4 publication figures.

The isolated GPU runner applies the same retained-Z-up mapping to the profile
geometry, Sun direction, and the 81 final-shader view constants. Prove J2
CPU/GPU parity before running J4:

```powershell
node scripts/experiments/algorithm32-frame-parity/run-gpu-b1.js `
  --order 2 `
  --conditions 11:15 `
  --cpu-values tmp/algorithm32-frame-parity/003-retained-z-up-j2-cpu/values.json `
  --output tmp/algorithm32-frame-parity/NUMBERED_J2_GPU_PARITY

node scripts/experiments/algorithm32-frame-parity/run-gpu-b1.js `
  --order 4 `
  --output tmp/algorithm32-frame-parity/NUMBERED_J4_GPU_RUN
```

The J2 gate requires CPU/GPU absolute RMS no greater than `5e-7` and maximum
absolute error no greater than `2e-6`. A complete J4 run emits the canonical
17-condition table, cube, manifest, B1 report, and all six B1 figures. If GPU
execution completed but publication rejected only incomplete metadata, use
`finalize-gpu-b1.js` to copy the immutable values into a new scored run with
the complete canonical provenance schema; never alter the source run.
