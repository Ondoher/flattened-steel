# H67 Sunset L1-to-J2 attribution

Status: complete through accepted00447 numerical evidence and00448 read-only
verification. The [plan](sunset-j2-plan.md) owns registration and the operational
retry. Production, previous evidence and the earlier four-order caches remain
unchanged. No further numerical campaign is selected.

## Finding

The sparse incoming F68 angular integral creates a large, wavelength-dependent
J2 error at the selected sunset nodes, before later-order cache interpolation.
The incoming L1 transport error is smaller here and partly masks the red excess.
This is a local operator attribution, not a globally qualified cache correction.

At the exact ground node with solar zenith89.5degrees, ratios to the independent
local J2 path estimate are:

| Wavelength | Stored J2, native L1/F68 | Accurate L1, same normalized F68 | Refined continuous angular J2 |
| --- | ---: | ---: | ---: |
|469.7nm|0.752x|0.769x|1.002x|
|532.3nm|1.878x|1.964x|0.985x|
|626.3nm|6.134x|6.427x|0.999x|

Replacing L1 alone does not remove the error. It makes the red overestimate
larger. Changing how the continuous incoming light is integrated over directions
removes almost all of this local discrepancy. Thus this result locates a major
error in the L1-to-J2 angular operator, rather than merely observing an accumulated
fourth-order brightness difference.

The90.5degree ground node has different signs/magnitudes: stored J2 ratios are
0.626/0.583/1.505 at blue/green/red; accurate-L1/F68 ratios are0.632/0.589/1.524;
refined angular ratios are0.988/0.985/1.001. These are not one universal gain or
one direction-independent aerosol multiplier.

## Reviewable evidence

- [Component comparison bars](../../../../../tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2/components.png)
- [Largest incoming-direction input differences](../../../../../tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2/incoming.png)
- [Full component analysis and per-direction terms](../../../../../tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2/analysis.json)
- [Source-density TSV](../../../../../tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2/summary.tsv)
- [Verification receipt](../../../../../tmp/experiments/sky-accuracy-dials/runs/00448-h67-j2-verify/verification.json)

Both PNGs were visually inspected. These are three-band scientific plots, not
full-spectrum color swatches or scene renders. L1 is spectral radiance in
W m^-2 sr^-1 nm^-1; J2 is local scattering-source density in W m^-3 sr^-1 nm^-1.
No local J2 value is compared directly with integrated observer radiance.

## Which calculations cause the difference

At each exact node the compiler's stored J2 is reproduced from its68 recorded
L1 values by a separate binary64 Rayleigh/Mie weighted sum, including the existing
Mie phase-mass normalization. Maximum relative discrepancy is4.02e-6, or0.000402%.
The arithmetic implementation of that sum does not explain the large error.

The controlled sequence is:

- A: native incoming L1 with the existing normalized F68 sum;
- B: continuously traced incoming L1 with exactly the same normalized F68 sum;
- C: continuous incoming L1 with species phase-importance angular quadrature.

A-B is the input substitution under fixed weights. B-C is the angular-rule
response under the continuous incident field. The exact-node comparison does
not interpolate stored J2 to obtain A; it reads the actual outgoing texel.

At626.3nm,89.5degree node, A=4.43048e-6, B=4.64264e-6 and C=7.21590e-7.
The independent local path estimate is7.22333e-7 +/-1.267e-8 (empirical95%).
The native L1 deficit partly offsets the much larger positive angular bias.
An input correction by itself therefore worsens the local total.

The continuous-L1/F68 sum at that red node is dominated by entries34 and35.
Both are the coincident reflection-pair direction[1,0,0], exactly horizontal
toward the source in the receiver frame. Together they supply about97.5% of B.
Their individual continuous L1 is0.17557, versus native0.16741. Their directions
and weights are retained explicitly; coincidence alone does not establish that
one entry should be deleted or its integration weight discarded.

The refined red J2 separates into Rayleigh3.69478e-8 and Mie6.84642e-7.
Normalized F68 gives9.06128e-8 and4.55202e-6 respectively: roughly2.45x and6.65x.
The aerosol term dominates the total excess. Its F68 constant-field phase mass
is1.45738 and is already normalized to unity by the diagnostic compiler.
Preserving constant-field scattering strength is insufficient when actual
incoming radiance has a sharp angular concentration near the horizon.

The measured response supports angular undersampling/aliasing of the product
of incoming illumination and phase. It does not separate the optimal polar,
azimuth, horizon-partition or phase-importance construction, nor qualify an
incoming rule for the complete cache. H66's outgoing-grid rotation did not
change these incoming weights.

## Off-grid reconstruction and N1

At the two actual Q30 points on the0.05degree camera ray, reconstructed J2 ratios
to independent local J2 are:

| Wavelength | Near point, sample0 | Farther point, sample4 |
| --- | ---: | ---: |
|469.7nm|0.707x|0.747x|
|532.3nm|1.259x|1.669x|
|626.3nm|4.484x|5.449x|

These points are at altitudes5.4402m and53.1751m. Their actual spherical positions
are rotated about the physical Sun axis into the canonical plane for independent
evaluation, preserving geometry and direction. The compiler readout uses the
original final-view solar-cubic/altitude supports and matching row-dependent
outgoing inverse map.

The red continuous-L1/F68 ratios at those points are3.587x and5.076x. The remaining
native-versus-continuous-F68 difference combines input errors at surrounding
nodes and reconstruction; it is not a clean isolated interpolation measurement.
No off-grid refined angular rule was run; the cache-free local path reference
supplies their independent J2 estimates.

There are also local N1 reconstruction discrepancies. At sample0, stored J1
is about7.12x/3.81x/2.32x the direct continuous blue/green/red source. Blue is
physically very faint there. These local ratios are not the integrated H65 N1
brightness ratio. They do not feed J2 through stored J1: this compiler releases
J1 and calculates L1 analytically from the direct-scattering source along each
incoming path. This distinction prevents attributing the new angular result
to propagation of the J1 outgoing-grid interpolation error.

## Numerical and execution qualification

All12 local J2 estimates meet the5% sampling target; actual empirical95%
half-widths range1.60-2.59%. Refined angular estimates at the six exact-node/band
pairs agree with the path estimates within their intervals: ratios0.98499-1.00247.
Importance32-to64 changes J2 by at most0.2921%. The F68 continuous L1 path64-to128
control changes its unnormalized J2 sum by at most0.01511%; this controls those
incident-direction evaluations, not every refined angular direction separately.

The independent local N1 path estimates agree with binary64 direct illumination
within0.130% wherever nonzero. Both methods return zero at the shadowed ground
node. Paired optical64/128 local J2 histories change the estimates by at most
0.000055%. Shared physical assumptions and Float32 geometry remain qualifications;
these checks are not formal bounds on every numerical error.

Failed00446 preserves all three compiler probes and same-input algebra but no
accepted independent batches. Its newly truncated second-event shader lost the
GPU context on the first draw. The cause of context loss is not established.
Accepted00447 uses the existing validated all-order kernel and1024-history GPU
draws, grouping eight consecutive microbatches into each8192-history reported
batch. First-two tallies are unaffected by later path events. The seed ranges,
total histories and optical targets remain those registered for N1/N2.

There are3840 microbatches and480 reported aggregates: three wavelengths, four
targets,32 main plus8 paired-control reported batches,8192 histories each.
The effective final payload contains3932160 histories, including controls.
No partial batch from the failed draw is reused. Both runs are immutable.

Accepted00448 independently authenticates parent/control/compiler identities,
restores the observation hook and matches the original H64 compiler bytes,
recomputes every microbatch aggregate and all12 analysis rows, and checks exact
J2 algebra. Only selected fields are retained. The compiler stops after J2 and
its original finally block releases all owned fields. All GPU work was serial;
owned browsers and scratch were closed/cleaned. Local types and whitespace
checks pass; no dedicated reviewer/audit ran. Checkpoint advice is separate.

Final retained evidence is763852673bytes (about728.467MiB), below the approved
736MiB retained allowance. Scratch is zero; no earlier evidence was changed.

## Four orders without intermediate interpolation

The current architecture saves computation by reusing previously calculated
transport fields. It also releases old fields as it advances; it does not retain
four complete order fields simultaneously. At this experiment's dimensions a
single scalar J field is4374*8640*4=151165440bytes, about144.16MiB per wavelength.
Wavelengths are already streamed serially.

For the same final representation, final cache memory would be unchanged.
A direct streaming construction could eliminate large intermediate fields,
replacing them with small batches of path state and output accumulators.
That is a temporary-memory saving, not a fourfold reduction of current memory.

Naive deterministic integration of four scattering events without reusing
fields expands a nested path/angular tree. An illustrative68-direction,
60-path-sample stage introduces roughly4080 child evaluations per point.
Repeated nesting can become prohibitively expensive; this is an explanation
of scaling, not a measured build-time multiplier. Actual segmentation,
occlusion, physical integration and optimization alter the count.

Cache-free Monte Carlo avoids exhaustive branching by sampling one trajectory
per history and accumulating contributions by event depth. Our independent
solver already demonstrates this. It can use little temporary memory and emit
only the cumulative N1-N4 cache, but needs many histories at every output cell
to control noise. A complete cache build would likely be substantially slower
at comparable precision; no full-cache benchmark has been run. Kernel fusion
alone does not remove interpolation if prior fields are still sampled.

The new finding means abandoning layered construction is not required to
address this isolated defect: improving the incoming angular operator in the
staged builder is a directly relevant route. A full recurrence must still be
rebuilt, checked against independent targets and match/improve paper RMSE
before promotion. No such correction or full-cache performance test was run here.

## Reproduction

Use the real existing Node executable and authorized hardware-browser launch.
All numerical commands allocate a new immutable run; use read-only verification
to inspect current evidence without rerunning calculations.

```text
node experiments/sky-accuracy-dials/sunset-j2/run.mjs preflight
node experiments/sky-accuracy-dials/sunset-j2/run.mjs
node experiments/sky-accuracy-dials/sunset-j2/run.mjs verify tmp/experiments/sky-accuracy-dials/runs/00447-h67-sunset-j2
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```
