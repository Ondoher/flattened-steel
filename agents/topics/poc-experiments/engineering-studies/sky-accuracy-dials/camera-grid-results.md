# H66 Camera-facing outgoing grid at sunset

Status: complete through accepted00445. All18 GPU wavelength builds, final
reductions and immutable verification pass. Production and earlier evidence
remain unchanged. The [plan](camera-grid-plan.md) owns the frozen comparison;
[H65](presunset-probe-results.md) owns the reused independent references.

## Result

Rotating the dense outgoing region from the Sun toward the primary camera view
barely changes the sunset excess. This particular outgoing orientation is not
its main explanation. It does not rule out all outgoing interpolation errors.

| Elevation deg | Sun-focused Y | Camera-focused Y | Change | Independent all Y | libRadtran all Y |
| --- | ---: | ---: | ---: | ---: | ---: |
|0.05|4944.50|4912.68|-0.64%|934.64|943.49|
|3|9850.68|9697.56|-1.55%|2978.26|2982.69|
|20|2122.18|2113.42|-0.41%|1173.09|1160.73|

Y is cd/m2. Camera-focused totals remain5.21x,3.25x and1.82x libRadtran.
The independent all-order means and sampling limits remain those of H65; this
campaign did not rerun or tune either reference. Caches contain N1-N4.

- [Common-exposure comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid/comparison.png)
- [Spectral comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid/spectra.png)
- [Primary cumulative orders](../../../../../tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid/orders.svg)
- [Complete analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid/analysis.json)
- [Summary TSV](../../../../../tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid/summary.tsv)
- [Mapping geometry and actual path offsets](../../../../../tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid/geometry.json)

The two PNGs were visually inspected. Swatches use the same H65 shared-3stop
sunset P2 preview for every method, with unchanged physical brightness labels.
They are selected-ray swatches, not full-scene captures. The spectra show nearly
overlapping Sun/camera cache curves and the much lower independent references.

## Order behavior

At the primary0.05degree ray, cumulative radiance is:

| Cumulative orders | Sun-focused Y | Camera-focused Y | Independent Y |
| --- | ---: | ---: | ---: |
|N1|317.60|319.03|272.01|
|N1-2|1913.24|1924.57|741.01|
|N1-3|3503.45|3502.56|886.06|
|N1-4|4944.50|4912.68|923.36|

Camera-facing pure N2/N3/N4 are1622.53/1584.99/1415.77cd/m2, versus independent
469.00/145.05/37.30. The large later-order excess persists. Pure N2 actually
increases0.61% relative to Sun-focused, while final cumulative Y falls0.64%.
Neither aggregate improvement nor the changed sign of an individual contribution
establishes a corrected recurrence.

Pure and cumulative fields are reconstructed separately, so the earlier H65
nonlinear solar-cubic/addition qualification still applies. Do not substitute
differences between cumulative rows for isolated physical-order values.

## What was changed

At every solar cache row, the same k=.35 Sun-focused4374-slot grid is rigidly
rotated from that row's Sun axis to the fixed camera-local axis
[0.9961943187689465,0.08715570956121342,0.0008726645152351496]. This is the
cache's backward viewing direction:0.05degree elevation and5degree relative
azimuth. The inverse rotation is applied before the original inverse warp in
every J lookup. Forward node placement and inverse lookup therefore match.

All physical sources, phase functions, incoming F68 directions/weights,
normalization, source20, transport60, positions and solar rows remain fixed.
The entire camera-facing J1/L1/J2/L2/J3/L3/J4 recurrence is regenerated at all15
wavelengths; every final ray is queried at Q30 and Q120. The compiler's analytic
L1 transport itself does not read the relocated J1 grid. Later J reconstruction
can change later L fields, so this is not a final-readout-only test.

The Sun and primary observer-view axes are only about5degrees apart here.
The camera axis is fixed in the receiver-local frame, rather than following each
point along a spherical ray. Along the Q30 primary path, physical lookup offsets
from that axis range0.0044-7.5371degrees; the near-observer samples are closest.
The3/20degree rays are off-axis controls. The complete offsets are retained.
This is a small reorientation of one grid, not arbitrary angular convergence.
F68 is unchanged, but its direction-dependent integration error is sampled at
new outgoing nodes; a response would not uniquely isolate final interpolation.

## Checks and preservation

Binary64 checks cover six solar rows and all outgoing nodes: unit error below
3.4e-16, inverse error below2.6e-15, preserved pairwise dot products within
6.7e-16 and exact duplicate-node Float32 identities. Slot/incoming counts remain
4374/68. Incoming integration has no changed measure or added Jacobian.

Sun-focused replay channels3/5/8 reproduce saved H64 pure and cumulative spectra
exactly at all six matching Q30/Q120 witnesses: maximum relative residual0,
against the5e-6 gate. Its adapted compiler bytes match the authenticated parent.
Camera Q30-to-Q120 changes total Y by+0.336%,-0.306%,-0.423% respectively.

Accepted00445 retains the hardware renderer, compressed controls, exact generated
camera compiler/browser bytes, every channel result, source/control identities,
geometry proof and verification record. Post-seal verification independently
recomputes report rows, authenticates parents and checks the Sun replay.
Local type checking and whitespace checks pass; no dedicated reviewer ran.

Failed00443 stopped in allocator startup because the default Node executable
was behind an nvm junction. No browser or scientific calculation ran. A narrow
closure records the missing initial definition and actual44.539second progress
gap; its original event is preserved and generic progress verification remains
rejected. Its authenticated owner-only scratch was cleaned. Failed00444 then
recorded sandbox browser-spawn EPERM, also before GPU execution; its seal and
outputs remain immutable. The accepted run uses the real Node executable and
authorized browser execution. Neither startup failure is relabelled as accepted.

Final retained evidence is761156407bytes (about725.895MiB), within the owner's
728MiB allowance; scratch is zero. No previous evidence was removed. All owned
browsers/jobs have ended. The experiment remains open; no further campaign or
production change is selected.

## Reproduction

Use the real existing Node executable, rather than its nvm junction. Every
numerical command creates a new immutable run and must first pass disk preflight.
Hardware browser execution needs the host's process-launch permission.

```text
node experiments/sky-accuracy-dials/camera-grid/run.mjs preflight
node experiments/sky-accuracy-dials/camera-grid/run.mjs
node experiments/sky-accuracy-dials/camera-grid/run.mjs verify tmp/experiments/sky-accuracy-dials/runs/00445-h66-camera-grid
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

Current remaining headroom does not admit another numerical run. Read-only
verification remains available without allocating output.
