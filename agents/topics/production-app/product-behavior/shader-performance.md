# Interactive shader performance

Status: initial diagnosis complete on 2026-10-23. Owner reports slow camera
movement in Flat and Globe, worse at 40 km than 5 m. Production shader, cache,
quality policy and app build remain unchanged by this diagnosis.

The shared bottleneck is per-frame atmospheric rendering. On-demand scheduling
is working: all eleven timed cases drew zero additional frames during an 800 ms
idle observation. It saves idle work but does not make an interactive frame cheap.

## Measurements

Owned Chrome/ANGLE/D3D11 on RTX 2060 rendered the actual locally served app.
Each case has one explicit warm-up and five whole-frame GPU timer queries using
EXT_disjoint_timer_query_webgl2. Zero page/WebGL errors or disjoint samples were
observed. Both owned verification browser/server sessions are closed.

At 1508 x 720 pixels, representative GPU timing medians were:

| Case | GPU median | Sample range |
| --- | ---: | ---: |
| Flat Union Glacier, Flat 180, 40 km | 67.6 ms | 47.7-113.6 ms |
| Globe Union Glacier, solar noon, 40 km | 249.3 ms | 247.4-250.3 ms |
| Same Globe condition, 10 km | 62.1 ms | 61.6-63.2 ms |
| Globe 40 km, No atmosphere | 0.64 ms | 0.61-0.65 ms |

Reducing the viewport to 754 x 360, one quarter as many pixels, gave Globe 40 km
67.4 ms (67.1-108.7 ms) and Flat 40 km 45.1 ms (23.0-63.7 ms). Flat timings were
variable; do not treat their median ratio as a controlled speedup or convergence
result. These are GPU operation times, not measured sustained user-input FPS.
They include complete production render operations, not just the atmospheric pass.
Viewports have the same aspect ratio; the comparison uses resize, not a deployed
low-resolution atmosphere/upscaling implementation.

The first session initially rendered into 764 x 429 despite a larger browser
viewport. Its Flat atmosphere-on timing of 27.6 ms and No atmosphere timing of
0.21 ms are useful paired diagnostics at that actual size. Its nominal half-size
case is not a quarter-pixel comparison and is excluded from the table above.
The second session explicitly dispatches resize and records actual buffer sizes.
Its separate 5 m Flat sample is not a matched within-session height comparison;
no causal Flat 5 m-versus-40 km performance claim is made from that sample.

Raw records and helper identities remain under
`.codex-tmp/flat32-shader-performance/`:
[summary](../../../../.codex-tmp/flat32-shader-performance/analysis.json),
[first session](../../../../.codex-tmp/flat32-shader-performance/profile-01/result.json),
[matched-resolution session](../../../../.codex-tmp/flat32-shader-performance/profile-02/result.json).
Scripts, logs and owned-process records are retained alongside these results.

## Interpretation and next step

Globe uses 120 final-view intervals at 40 km and 30 at every lower supported
preset, including 5 m. The measured 40 km/10 km GPU ratio is approximately four.
The cache contains precomputed scattering, but each displayed pixel still
integrates and interpolates that spectral field along its view ray. Larger
observer coverage does not itself multiply the number of iterations per pixel.

Flat retains 15 final-view intervals at both 5 m and 40 km. Its positive-column
integration samples 16 path nodes, each with spectral texture interpolation and
transmission/source-function arithmetic. Its height-dependent slowdown is not
yet isolated; ray coverage, active paths and lookup behavior can change with
height. Do not attribute that report to the Globe-only 120 setting.

Recommended next implementation is an interactive quality tier: while the camera
moves, render fewer pixels and optionally use the ordinary Globe interval count;
once it stops, redraw at full resolution and the qualified 120 intervals at
40 km. The settled render must preserve current quality and optics. Keep object
edges, Sun/stars, resize/cancellation and exact final redraw under explicit
verification. The current resolution-only screen still takes about 67 ms for
Globe, so half dimensions alone do not establish smooth 60 FPS.

No production optimization was applied. A matched Flat 5 m/40 km diagnostic and
GPU timing during actual pointer movement would strengthen the next comparison.
Sun/ground viewing geometry, warm-up, driver clocks and other GPU users limit
transfer of these numbers to other conditions or devices. Earlier scientific
cache and libRadtran evidence remains intact.
