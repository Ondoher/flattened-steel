# Flat180 Star/Production Imbalance Diagnostic Plan

Status: closed. The cause is diagnosed and the shared
reflection-completed-ordinary-68 correction is promoted for both local and
distant production. This document owns the completed methodology, diagnosis,
production selection, residual limits, verification evidence, and evidence
boundaries for the Flat180 sky imbalance.

## Goal

Justify the local-Sun atmospheric simulator through the validated
spherical/distant implementation by making every shared numerical choice
consistent unless finite-source geometry requires a difference. The selected
production baseline is exact shared ownership of the reflection-completed
ordinary Fibonacci-68 incoming quadrature. It retains each pinned ordinary
Fibonacci-34 direction, adds its `[x,-y,z]` reflection, and splits the original
weight equally between the pair. The correction applies to both local and
distant integration and improves complete distant Bruneton B1 aggregate RMSE.

The distant Bruneton-paper comparison supports the shared atmospheric solver
and angular quadrature. It does not directly validate finite-distance falloff,
the local source-position frame, or the z/rho position domain; those remain
local-only correctness boundaries. Visual symmetry is a diagnostic and cannot
replace the paper accuracy comparison.

## Frozen Target And Historical Control

The primary diagnostic target uses:

- Flat180 finite local source;
- ordinary source-oriented Fibonacci-34 incoming quadrature;
- production `z19/rho15`, W27, and native-15 domains;
- the application's default field of view, resolved from the current runtime
  and recorded rather than copied into this document;
- a camera orientation that places the Sun's screen-space center in the right
  third of the view;
- the application's 1,612-by-823 review viewport used by the reported view;
- no review boxes;
- flat ground endpoint; and
- the application's default renderer, exposure, and composition inputs.

Begin at the default application camera and adjust orientation, not field of
view, until the Sun lies in the right third. If the broad blue lobe is not
visible, continue a logged, deterministic orientation search beginning with
the smallest yaw changes and then the smallest pitch changes. Before the first
capture, record the increments and valid application-camera yaw/pitch limits;
continue until the lobe is found or that declared orientation domain is
exhausted. Do not change
camera position, roll, Flat180 source state, physical inputs, sampling domains,
viewport, or renderer settings during this search. Freeze the first camera
that reproduces the lobe, including its position, quaternion or target, Sun
screen coordinate, field of view, and viewport.

The separate historical control is the centered Flat180 comparison represented
by Star run
`000319-flat32-flat180-production-n4-pairfib34-fov120-no-boxes-subjective-scene`.
It retains the historical centered camera, 120-degree vertical field of view,
512-by-256 device pixels, and recorded renderer inputs. The control establishes
what the accepted paired implementation displayed; it is not substituted for
the primary off-center reproduction target.

The archived run is historical evidence, not an executable authority. Read
its source, inputs, reports, results, and captures in place. Do not import,
copy, execute, regenerate, or test against a retired Star runner, fixture,
harness, policy, command, provenance record, or archive implementation.
Current diagnostics execute only current production code and write generated
output in immutable numbered folders under `tmp/blue-glow-diagnosis/tests/`.

## Current Production Alignment

Flat/local and spherical/distant now select the same
`REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER` object. This
establishes exact identity for the 68 incoming vectors, their interleaved
ordering, and their half-split solid-angle weights; local retains only the
geometry-required z/rho position domain, finite-source placement and distance
falloff, and source-local physical direction mapping. The prior
paired-plus-rotated 68-direction local default and the intermediate shared
ordinary-34 selection are retained only as diagnostic history.

Run 068 captures cumulative local N1-N4 with the aligned production build. Its
fixed off-center N4 lobe region has mean blue chroma `4.086328` RGB bytes,
compared with `8.064728` for the former 68-direction production capture. Run
069 records the independent centered control: ordinary-34 has upper-sky mirror
RMS `14.970392` and maximum `108`, versus `5.927425` and `66` for the former
68-direction default. Alignment therefore improves the frozen lobe-region
measurement but worsens the symmetry diagnostic; neither observation changes
the distant paper comparison's role as the shared accuracy authority.

Runs 070-072 test whether the flat final-view distance alone magnifies the
higher-order chromatic residual. At 250, 500, 1,000, and 1,926.774 km, the
fixed-region blue-chroma increment from cumulative N3 to N4 is respectively
`0.117511`, `0.152528`, `0.119500`, and `0.116217` RGB bytes. Total J4-added
radiance grows strongly with distance, but the chroma increment does not grow
monotonically. This first boundary therefore confirms long-path accumulation
of physical higher-order light but does not support distance magnification of
the specific blue defect. A conclusive defect-amplification test must compare
ordinary-34 with a denser angular authority at every distance; `N4 - N3`
contains valid physical scattering as well as quadrature error.

## Current Causal Diagnosis And Qualified Candidate

The lobe has two separable numerical contributors. The asymmetric seed is a
finite incoming-angular quadrature residual in anisotropic-Mie multiple
scattering. The unusually long Flat180 final-view ray then amplifies the
already asymmetric field when the native 15-interval trapezoid schedule
under-resolves the path.

The following controls identify the seed rather than merely changing its
display:

- ordinary Fibonacci-272 retains the lobe location and shape, so count alone
  does not restore the missing plane balance;
- extending the local cache radial domain across the complete view ray and
  increasing W27 outgoing reconstruction to W39 retain the lobe;
- removing Mie scattering or setting Mie `g=0` removes it;
- 15, 40, 80, and 160 final-view intervals converge strongly in total
  brightness while retaining the directional feature; and
- reflection-completing the exact ordinary Fibonacci-34 set across the
  source/vertical plane reduces the unchanged-15 centered upper-sky mirror RMS
  from `14.970392` to `0.153789` RGB bytes and the maximum from `108` to `1`.

The selected shared production construction retains every ordinary Fibonacci-34
direction, adds its exact source-frame reflection `[x, -y, z]`, and assigns
half of each original weight to both copies. At 40 view intervals the local
centered mirror RMS changes from `6.684688` to `0.113259` bytes and the maximum
from `62` to `1`. The complete 17-condition distant GPU B1 boundary scores
`11.820392` mW aggregate RMSE versus current production's `11.925778`, an
improvement of `0.105386` mW (about `0.88%`). All 17 conditions and all six B1
figures complete. The incoming-domain correction is promoted; the native
view-path interval count is unchanged.

Dense paired-Fibonacci-272 is rejected as a production candidate on the
current GPU path. It reduces several symmetry measurements but reproducibly
returns an identically zero J4 spectral boundary at B1 `10:45`; the same
condition completes at J3. The smaller reflected-ordinary-68 candidate does
not exhibit that resource/execution failure.

## Known Evidence

The Star evidence establishes the following context:

- ordinary Fibonacci-34 produced a large Flat0 mirror imbalance that first
  became visible at N2 and increased at N4;
- paired Fibonacci-34 was selected as the stable, low-asymmetry replacement;
- paired Fibonacci-34 reduced the Flat0 upper-sky mirrored RGB-byte RMS from
  `42.08325336310213` to `8.07316069859659` at N4;
- the accepted paired Flat180 N4 run reported upper-sky mirrored RGB-byte RMS
  `9.438980356957867` and maximum residual `92`; and
- the accepted paired Flat180 capture does not show the broad current blue
  glow.

These facts disprove the earlier attribution that paired Fibonacci itself
introduced the current broad glow. They do not yet identify the regression.

The reproduced lobe is asymmetric about the Sun: it appears on the sky side
opposite the off-center Sun rather than as a symmetric halo or broad increase
on both sides. The frozen application camera uses yaw `0.8`, pitch `-0.15`,
zero roll, the default 70-degree field of view, and a 1,612-by-823 viewport.

Historical anchors:

- `archives/star/scripts/algorithm32-star/runs/000319-flat32-flat180-production-n4-pairfib34-fov120-no-boxes-subjective-scene/`
- `archives/star/scripts/algorithm32-star/runs/000301-flat32-flat0-production-n2-pairfib34-fov120-no-boxes-subjective-scene/`
- `archives/star/scripts/algorithm32-star/runs/000306-flat32-flat0-production-n4-pairfib34-fov120-no-boxes-subjective-scene/`
- `archives/star/scripts/algorithm32-star/runs/000317-paired-fibonacci-count-analysis/`

## Scope And Non-Goals

In scope:

- the exact frozen Flat180 scenario;
- scattering-order localization;
- paired-direction values, weights, ordering, and coordinate frames;
- current CPU and GPU selected values at the first bad order;
- GPU packing, indexing, shader lookup, recurrence, reconstruction, and final
  composition only as needed to locate the first divergence; and
- a narrow read-only comparison of the relevant current and historical source
  after the first bad boundary is known;
- equivalent local and spherical/distant angular controls;
- final-view interval convergence; and
- complete B1 qualification of a proposed shared correction.

Out of scope unless evidence makes one necessary:

- Flat0, Flat90, Flat135, boxes, or arbitrary cameras;
- performance, responsiveness, resource use, or GPU capability work;
- a broad Star/production source-tree comparison;
- a complete binary64 CPU cache build;
- unrelated visual differences;
- production hardening or regression-suite work; and
- production promotion of a correction without a separate explicit decision.

## Diagnostic Measurements

The primary off-center target is not expected to be mirror-symmetric because
the Sun is in the right third. Do not use whole-view left/right mirror residual
as its lobe detector.

During Step 0, after reproducing the N4 lobe and before capturing lower orders,
freeze:

- a normalized sky lobe region that contains the broad blue glow while
  excluding the Sun disc, ground, horizon transition, and scene geometry;
- an opposite-side control region reflected across the Sun's screen-space
  center at the same angular separation, elevation, shape, and area;
- which side of the Sun contains the lobe and confirmation that the matched
  opposite side does not contain it;
- the blue-chroma calculation used to compare those regions;
- the numeric threshold that classifies the reproduced broad glow; and
- the exact camera, Sun screen coordinate, viewport, and current N4 image from
  which the regions were selected.

Apply those exact regions and calculations unchanged to N1, N2, N3, and N4.
Record mean RGB, blue chroma, lobe-minus-control contrast, affected-pixel
coverage on each side of the Sun, and the retained image. The diagnostic
signature requires both excess lobe-side blue chroma and the absence of a
matching opposite-side lobe; a symmetric blue increase does not qualify. The
threshold must exceed the byte quantization floor and must be recorded before
observing the lower-order results.

The centered historical control continues to use its recorded upper-half
mirror measurements:

- RGB-byte RMS between `(x, y)` and `(511 - x, y)`;
- maximum RGB-byte residual; and
- signed left-minus-right mean RGB.

Every observation also records exact capture dimensions and configuration
identity.

Numerical probes use predeclared mirrored pairs of position, outgoing
direction, and wavelength. Record the actual values and their signed and
absolute residuals. Do not infer a field-level conclusion from final RGB
alone.

Each execution record must include progress logging for order, pass, layer,
probe group, elapsed time, and completion state. A silent long-running process
is not acceptable evidence.

## Method

### Step 0: Reproduce And Lock The Current Flat180 Configuration

Use the application's default field of view and place the Sun in the right
third. If the initial orientation does not show the broad glow, perform the
predeclared, logged camera-orientation search defined above. Record every
attempted orientation and whether it reproduced the lobe. Freeze the first
successful camera and then define and freeze the lobe measurement before
observing any lower-order capture.

Also capture the current production implementation with the exact centered
historical-control camera. This distinguishes failure to preserve the Star
control from a lobe that is exposed only by the primary off-center view.

Gate: the primary target must reproduce the reported glow and have a frozen
numeric lobe signature. If no searched orientation reproduces it, stop and
report the searched orientations and exact remaining scenario mismatch rather
than continuing with an unrelated view.

### Step 1: Locate The First Bad Scattering Order

Render the frozen primary Flat180 target cumulatively through N1, N2, N3, and
N4. Change only the maximum scattering order. If the application has no N3
selection, add the smallest current-only diagnostic seam needed to expose
`Jthrough3`; do not infer N3 from the difference between N2 and N4.

Classify the first order whose frozen lobe-side-minus-opposite-side measurement
crosses the Step 0 threshold and whose retained image has the same one-sided
spatial lobe relative to the Sun:

| Observation                                    | Next focus                                                  |
| ---------------------------------------------- | ----------------------------------------------------------- |
| N1 is first bad                                | primary field, source frame, reconstruction, or composition |
| N1 is clean; N2 is first bad                   | `J2` scatter and `J2 -> L2` transport                       |
| N2 is clean; N3 is first bad                   | `J3` scatter and `J3 -> L3` transport                       |
| N3 is clean; N4 is first bad                   | `J4` scatter and cumulative assembly                        |
| All cache orders are clean; final image is bad | final reconstruction, camera, or composition                |

Gate: name one first bad order. Stop work on later orders until the responsible
boundary inside that order is located.

### Step 2: Locate The First Bad Pipeline Boundary

At the first bad order only, evaluate these boundaries in order:

```text
paired directions and weights
    -> source-local frame
    -> current binary64 CPU calculation
    -> GPU resource packing and index lookup
    -> GPU field calculation
    -> cumulative-field reconstruction
    -> final spectral/RGB composition
```

Use selected mirrored numerical probes rather than a complete CPU cache.

| Result                                                 | Diagnosis focus                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| Current CPU probes are imbalanced                      | direction, frame, phase, or transport math before GPU execution |
| CPU probes are balanced; GPU probes are not            | packing, indexing, shader lookup, or GPU arithmetic             |
| CPU and GPU probes agree; reconstructed samples do not | cache layout or reconstruction                                  |
| Reconstructed spectral samples agree; RGB does not     | view transform, exposure, or composition                        |

Gate: identify the first boundary whose output has the imbalance while its
input does not.

### Step 3: Compare Only The Responsible Star And Production Code

After Steps 1 and 2 narrow the boundary, inspect only the historical and
current code that owns that boundary. Compare, as applicable:

- all 34 direction vectors, exact ordering, weights, antipodal pairing, weight
  sum, and weighted first moment;
- local-frame axis construction, handedness, signs, and transforms;
- position and outgoing-direction mappings;
- phase-function arguments and direction conventions;
- transport interval and boundary calculations;
- field ordering, texture dimensions, texel addressing, and layer selection;
- recurrence inputs and pure-versus-cumulative field selection; and
- binary64, R32F, and shader evaluation order where it can affect the observed
  boundary.

Do not widen the comparison to adjacent subsystems without evidence that the
first bad boundary consumes them.

Gate: name the exact differing or retained numerical fact and show how it
reaches the first bad output.

### Step 4: Confirm The Causal Explanation

Design the smallest current-only counterfactual capable of changing the
suspected fact. It must preserve every unrelated frozen scenario input.

The explanation is confirmed only if the counterfactual:

1. changes the first bad boundary in the predicted direction;
2. leaves the immediately preceding clean boundary unchanged; and
3. removes or materially reduces the broad Flat180 glow and mirror residual.

This is a diagnostic counterfactual, not authorization to modify production.
Remove temporary diagnostic changes after retaining the result under the
ignored diagnostic-output root.

## Diagnosis And Production Correction

The first visible bad order is N4. N1, N2, and the temporary current-only N3
capture remain clean. Both fused transport passes were replaced independently
and together by the indexed-R32F control path; the N4 lobe remained. Selected
L3 GPU values also matched both the direct binary64 and indexed-R32F
authorities. The historical and current J4 scattering operations are
equivalent. These results rule out cache transport, packing, lookup,
reconstruction, and final RGB composition as the cause.

The responsible fact is the finite orientation bias retained by the selected
paired-Fibonacci-34 quadrature. Exact antipodal pairs remove its first moment
and substantially reduced the older ordinary-Fibonacci imbalance, but they do
not make fourth-order angular integration rotation invariant. A 90-degree
rotation moved and reduced the lobe. Combining the selected 34 directions
with that rotated copy, while halving every weight, retained exact antipodes,
zero first moment, and total weight `4π`, and removed the broad one-sided lobe.

Production now selects that paired-plus-rotated 68-direction domain. It has 34
exact antipodal pairs and preserves the fused, zero-packed-transport plan. The
sealed paired-Fibonacci-34 binary64 and indexed-R32F snapshots remain
immutable and are selected explicitly by their legacy transport proof; they
continue to certify unchanged fused transport math rather than representing
the new production quadrature.

At the frozen view, the lobe-region `(x=250, y=80, width=450, height=200)`
changed from mean RGB `[16.241344, 29.885267, 30.248433]` and mean blue chroma
`7.185128` to `[11.801144, 24.934567, 24.965133]` and `6.597278`. The production
capture matches the successful diagnostic counterfactual exactly in that
region. Across the complete frame their mean absolute RGB-byte difference is
`0.000025377`; the maximum difference is `4` bytes.

The camera and retained order captures were frozen before the order
classification. The numeric region calculation was formalized after that
classification, so it is corroborating measurement rather than the
prospective threshold originally requested by Step 0.

Retained local evidence:

- `tmp/blue-glow-diagnosis/matched-flat180-paired-yaw0.8-pitch-0.15-n4.png`
- `tmp/blue-glow-diagnosis/matched-flat180-paired-double-rotation-yaw0.8-pitch-0.15-n4.png`
- `tmp/blue-glow-diagnosis/matched-flat180-production-68-yaw0.8-pitch-0.15-n4.png`
- `tmp/blue-glow-diagnosis/measure-production-fix.ps1`

### Remaining N4 Residual

Application review after the 68-direction correction found a smaller blue
glow in the same sky region. Focused current-only counterfactuals narrow that
residual to under-resolved Mie multiple scattering:

- the production 68-direction full-atmosphere region is
  `[11.801144, 24.934567, 24.965133]`;
- retaining Mie scattering and extinction while changing only its phase
  asymmetry from `g=0.7` to `g=0` changes the region to
  `[6.978689, 18.322067, 17.267967]`; and
- retaining Mie extinction while removing Mie scattering changes the region
  to `[1.891933, 14.925911, 15.000000]`.

A current-only 34-versus-68 camera matrix separates quadrature behavior from
camera visibility. In the frozen default-FOV off-center lobe region, 34
directions produce mean RGB `[16.241344, 29.885267, 30.248433]` and blue
chroma `7.185128`; production 68 produces
`[11.801167, 24.934567, 24.965133]` and blue chroma `6.597267`. In the exact
centered 512-by-256 FOV120 no-boxes control, the upper-sky mirrored RGB RMS
drops from `8.230496` with 34 directions to `5.927425` with 68, and mean
absolute mirrored difference drops from `4.887604` to `2.510874`. Signed
left-minus-right mean RGB changes from `[5.103516, 5.047089, 4.512207]` to
`[-1.500885, -0.870178, -0.029846]`. The maximum localized mirrored residual
changes from `49` to `66`, while both remain below the archived Star control's
maximum `92`. The correction therefore improves aggregate centered symmetry
as well as the off-center lobe; the visual difference was not created solely
by the camera, although the narrower off-center view exposes it much more
strongly.

The orientation stress control gives the same conclusion more strongly. Four
equal 34-direction copies at 0, 45, 90, and 135 degrees produce a dark sky,
while globally rotating the identical weighted set by 22.5 degrees severely
overexposes the full-atmosphere sky. Removing Mie scattering collapses that
rotation difference to less than one RGB byte per channel in the measured
region. Isotropizing Mie substantially reduces, but does not eliminate, the
difference. W27/frame reconstruction therefore retains a small background
orientation residual, but it is not the dominant cause of the reported glow.

A current-only reflection matrix confirms that the residual has a directional
quadrature component. Reflecting every production direction across the
Sun-observer vertical plane changes the centered signed left-minus-right mean
from `[-1.500885, -0.870178, -0.029846]` to
`[1.560608, 0.908478, 0.051636]` while leaving RMS nearly unchanged
(`5.927425` versus `5.999124`). Completing the production set with every
reflected direction, with half weight assigned to both copies, reduces the
centered upper-sky mirror RMS to `0.141418`, mean absolute difference to
`0.019999`, and maximum difference to `1` RGB byte. In the frozen off-center
lobe region, mean blue chroma changes from `8.673817` for production 68 to
`5.349256` for its reflection and `6.297244` for the reflection-completed 136.
The reversal identifies an angular sampling imbalance rather than a physical
world-border light source. Reflection completion is a diagnostic
counterfactual only; its sky brightness and rotation convergence have not been
qualified for production.

Manual application review also finds a comparable one-sided horizon lobe in
the spherical/distant San Jose sunset view. That path independently selects
ordinary Fibonacci-34 for all incoming-direction integration; it does not use
the Flat/local paired-plus-rotated 68 domain or fused Flat transport. This
rules out a Flat-only cache explanation for the visual failure class and makes
shared higher-order angular integration the first common boundary. The manual
image does not by itself prove that its lobe is numerically identical to the
Flat180 residual. Freeze and run an equivalent current-only globe reflection
matrix before selecting a shared correction.

The Bruneton B1 benchmark is a spherical/distant test and is not a gate for a
Flat/local-only direction-domain candidate. It becomes applicable only if a
candidate is proposed for distant production or as one shared quadrature for
both paths. The B1 construction seam and current production baseline remain
valid distant-path evidence. An attempted post-parity reflection-136 B1 run in
folder 056 was stopped before its first condition completed after the user
corrected this scope; it is not a result or qualification input.

Rejected diagnostic substitutions:

- a true paired-Fibonacci-68 set is strongly orientation dependent;
- 45- and 60-degree two-copy separations improve the frozen view but move the
  residual under a global rotation and are not safe production choices;
- four evenly rotated copies still retain a strong global-phase dependency;
  and
- an axis-aligned 8-by-8 Gauss-Legendre/product grid resonates with the
  Flat/W27 construction and grossly overexposes the result.

Do not change the physical Mie albedo or asymmetry to hide the error. A robust
correction must converge the anisotropic Mie scattering integral across
global quadrature rotations. Candidate directions include a phase-aware
quadrature, analytic forward-lobe/residual decomposition, or a materially
denser direction domain with an explicit rotation-stress convergence gate.
No additional production change is selected by this refinement yet.

The dense-domain counterfactual now confirms that direction density, rather
than a world boundary or cache-layout defect, controls the residual. A direct
phase-only spherical integral gives Mie RMS errors of `10.6203%` for distant
Fibonacci-34, `7.9362%` for local production 68, `1.8191%` for paired-136,
`0.8821%` for paired-272, and `0.4380%` for paired-544; the corresponding
Rayleigh error at production-34 is only `0.1001%`. At the three displayed B1
times, paired-272 reduces whole-dome mirror RMS by 69%, 89%, and 79%, and
maximum mirrored residual by 60%, 89%, and 66%. Its combined three-time B1
RMSE improves slightly from `11.233222` to `11.201273`, although 11:15 worsens
and the candidate therefore remains unselected. The regenerated Figure 5
panels replace isolated edge lobes with a smooth solar-centered field.

The same paired-272 construction also passes the independent Flat/local J4
counterfactual. In the frozen off-center region, blue chroma changes from
`8.673817` to `7.011506`. In the centered control, mirror RMS changes from
`5.927425` to `1.082146` RGB bytes and the maximum residual from `66` to `12`.
This is a tested diagnostic correction across both cache paths, not a
production selection. A Flat/local-only candidate requires local
rotation-stress convergence, application performance qualification, and an
explicit promotion decision. A full B1 boundary is required only if the
candidate is also proposed for spherical/distant production.

A fresh order-separated current-worktree comparison now isolates what
reflection completion changes in the frozen off-center Flat180 view. Runs 053
and 054 change only the incoming domain from production 68 to its
reflection-completed 136-direction counterpart and capture cumulative N1,
N2, N3, and N4. Run 055 measures the unchanged lobe region and pixelwise
differences. N1 is byte-identical over the complete frame. Lobe-region blue
chroma changes by only `-0.059628` at N2 and `-0.093389` at N3, then by
`-1.985422` at N4, from `8.064728` to `6.079306`. Reflection completion
therefore removes 24.6% of total N4 blue chroma and 70.8% of the blue-chroma
increase introduced between cumulative N3 and N4. The N4 lobe-region
difference has RGB-byte RMS `2.846565` and maximum `14`; the full-frame
maximum is `23`. This confirms that the applicable distant-path lesson is
quadrature balance, not its spherical frame or boundary correction, and that
the remaining local visual defect is specifically dominated by the N4
angular integral.

The current-worktree local phase stress rotates the complete 136-direction set
about the source/radial axis by `0`, `22.5`, and `45` degrees. In the frozen
off-center lobe region, blue chroma is `6.079306`, `5.909656`, and `6.231233`,
a range of `0.321578`; every phase remains materially below production 68's
`8.064728`. The complete-frame phase difference is not zero, reaching RGB-byte
RMS `4.974100` and maximum `41` between 0 and 45 degrees, so reflection
completion is not rotation invariant.

The exact centered FOV120 control nevertheless improves at every tested phase.
Production 68 has upper-sky mirror RMS `5.927425` and maximum `66` bytes.
Reflection-136 measures RMS/maximum `0.141562/1` at 0 degrees,
`1.691708/23` at 22.5 degrees, and `1.066285/11` at 45 degrees. The exceptional
zero-phase result is partly alignment with the reflection plane, but the two
rotated controls still materially outperform production. Reflection-136 is
therefore a promising local-only candidate that robustly reduces the tested
N4 imbalance; its residual phase dependence and doubled incoming work prevent
promotion without a local performance gate and explicit user decision.

Further candidate design is owned by the
[angular-quadrature balance investigation](../validation/angular-quadrature-balance-investigation.md),
which restarts from ordinary Fibonacci-34 and treats pairing as diagnostic
history rather than a presumed solution.

The conservative Bruneton midpoint-product lane does not qualify as that
candidate. Exact 16-by-32 and reduced 14-by-28 grids exceed the current GPU
watchdog at J4. The 12-by-24 grid completes a valid 10:15 boundary and reduces
mirror relative RMS from `0.032399` to `0.010635`, confirming the expected
balance benefit, but its spectral RMSE worsens from `10.979203` to `18.700868`
mW and other required conditions lose the context. Because both accuracy and
execution qualification fail, no smaller product-grid backoff is selected.

Retained matrix evidence:

- `tmp/blue-glow-diagnosis/matched-flat180-legacy-paired-34-production-offcenter-yaw0.8-pitch-0.15-n4.png`
- `tmp/blue-glow-diagnosis/matched-flat180-production-68-production-offcenter-yaw0.8-pitch-0.15-n4.png`
- `tmp/blue-glow-diagnosis/matched-flat180-legacy-paired-34-centered-fov120-control-default-camera-fov120-n4.png`
- `tmp/blue-glow-diagnosis/matched-flat180-production-68-centered-fov120-control-default-camera-fov120-n4.png`
- `tmp/blue-glow-diagnosis/measure-camera-quadrature-matrix.ps1`
- `tmp/blue-glow-diagnosis/tests/001-production-68-offcenter-control/`
- `tmp/blue-glow-diagnosis/tests/002-reflection-mirrored-68-offcenter/`
- `tmp/blue-glow-diagnosis/tests/003-reflection-average-136-offcenter/`
- `tmp/blue-glow-diagnosis/tests/004-production-68-centered-control/`
- `tmp/blue-glow-diagnosis/tests/005-reflection-mirrored-68-centered/`
- `tmp/blue-glow-diagnosis/tests/006-reflection-average-136-centered/`
- `tmp/blue-glow-diagnosis/tests/023-phase-quadrature-convergence/`
- `tmp/blue-glow-diagnosis/tests/033-paired-272-j4-1015/`
- `tmp/blue-glow-diagnosis/tests/034-paired-272-j4-1115/`
- `tmp/blue-glow-diagnosis/tests/035-paired-272-j4-1315/`
- `tmp/blue-glow-diagnosis/tests/039-paired-272-j4-figure5-panels/`
- `tmp/blue-glow-diagnosis/tests/040-direct-paired-272-local-offcenter/`
- `tmp/blue-glow-diagnosis/tests/041-direct-paired-272-local-centered/`
- `tmp/blue-glow-diagnosis/tests/053-production-68-order-series/`
- `tmp/blue-glow-diagnosis/tests/054-reflection-136-order-series/`
- `tmp/blue-glow-diagnosis/tests/055-production-68-vs-reflection-136-order-analysis/`
- `tmp/blue-glow-diagnosis/tests/057-reflection-136-rotated22-5-local-n4/`
- `tmp/blue-glow-diagnosis/tests/058-reflection-136-rotated45-local-n4/`
- `tmp/blue-glow-diagnosis/tests/060-reflection-136-local-phase-analysis/`
- `tmp/blue-glow-diagnosis/tests/061-reflection-136-centered-phase0-local-n4/`
- `tmp/blue-glow-diagnosis/tests/062-reflection-136-centered-phase22-5-local-n4/`
- `tmp/blue-glow-diagnosis/tests/063-reflection-136-centered-phase45-local-n4/`
- `tmp/blue-glow-diagnosis/tests/068-local-matches-distant-fibonacci34-order-series/`
- `tmp/blue-glow-diagnosis/tests/069-local-matches-distant-fibonacci34-centered-control/`
- `tmp/blue-glow-diagnosis/tests/070-local-fibonacci34-view-extent-250km/`
- `tmp/blue-glow-diagnosis/tests/071-local-fibonacci34-view-extent-500km/`
- `tmp/blue-glow-diagnosis/tests/072-local-fibonacci34-view-extent-1000km/`
- `tmp/blue-glow-diagnosis/tests/summary.json`

Flat32 exposes an `85°S, 0°` location preset immediately after Union Glacier
for manual boundary-proximity inspection. It retains the Union Glacier date
basis and changes only latitude and longitude. The ordinary default remains
Union Glacier; one location-control activation selects the boundary test.
Flat32 type checking, rebuilding, and all three focused browser checks pass
with the additional preset.

## Stopping Rules

- Stop after locating the first bad scattering order before inspecting later
  orders.
- Stop after locating the first bad pipeline boundary before comparing broad
  source areas.
- Do not run a complete CPU cache build; use selected direct probes.
- Do not change the Flat180 Sun state, default application FOV, camera
  position, roll, resolution, physical inputs, or scene while searching. Only
  the logged yaw-then-pitch orientation search is permitted until the first
  lobe-producing camera is frozen.
- Do not optimize performance during this investigation.
- Do not change quadrature families or counts while diagnosing a promoted
  paired-Fibonacci-34 regression.
- Do not claim a cause from visual similarity alone.
- Do not implement or promote a fix without a separate explicit decision.

## Progress

| Step                                                            | Status                      | Evidence                                                                                                                              | Decision                                                                                                             |
| --------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Historical correction                                           | Complete                    | Star runs 287-320 and count analysis 317 inspected read-only                                                                          | Paired Fibonacci reduced the original imbalance; it did not introduce the current broad glow                         |
| Step 0: reproduce and freeze the right-third-Sun Flat180 target | Complete                    | Default-FOV yaw `0.8`, pitch `-0.15`, 1,612-by-823 captures and fixed lobe region                                                     | Broad one-sided lobe reproduced                                                                                      |
| Step 1: first bad scattering order                              | Complete                    | N1/N2/N3/N4 retained captures                                                                                                         | N4 is first bad                                                                                                      |
| Step 2: first bad pipeline boundary                             | Complete                    | Fused/indexed counterfactuals and selected binary64/R32F probes                                                                       | J4 consumes authority-correct L3; transport and later boundaries ruled out                                           |
| Step 3: narrow source comparison                                | Complete                    | Direction/weight audit and focused historical/current J4 review                                                                       | Paired-Fibonacci-34 retains finite orientation-dependent N4 quadrature error                                         |
| Step 4: causal counterfactual                                   | Complete                    | Rotated-only and paired-plus-rotated captures                                                                                         | Paired-plus-rotated 68 materially removes the lobe                                                                   |
| Historical 68-direction correction                              | Superseded                  | Production capture, invariants, Algorithm32/GPU/Flat32 checks, and camera matrix                                                      | Retain as diagnostic evidence; it is no longer the Flat/local production default                                     |
| Local/distant incoming-quadrature alignment                     | Complete                    | Exact shared owner assertion, 477 Algorithm32 specs, 3 Flat32 browser checks, both type checks, and runs 068-069                      | Local and distant now use the identical ordinary source-oriented Fibonacci-34 vectors and weights                    |
| Flat final-view distance sweep                                  | Complete                    | Runs 070-072 plus the 1,926.774 km run 068 boundary                                                                                   | Total J4 radiance grows with distance; N4-added blue chroma does not grow monotonically                              |
| Remaining N4 residual refinement                                | Complete                    | Production/no-Mie/isotropic-Mie captures and rotated quadrature stress controls                                                       | Dominant residual is under-resolved anisotropic Mie multiple scattering; no robust replacement selected              |
| Current 34/68 camera matrix                                     | Complete                    | Default-FOV off-center region and exact centered 512-by-256 FOV120 no-boxes current-only captures                                     | 68 improves both the exposed lobe and aggregate centered symmetry; camera visibility is not the cause                |
| Reflection matrix                                               | Complete                    | Numbered production, reflected-68, and reflection-completed-136 off-center and centered runs                                          | Reflection reverses the signed residual; reflection completion reduces centered maximum to one byte                  |
| Cross-pairing globe observation                                 | Observed                    | Manual spherical/distant San Jose sunset application view and current domain inspection                                               | Globe shows a comparable lobe while using ordinary Fibonacci-34; controlled reflection matrix remains                |
| Benchmark parameter seam                                        | Complete                    | Benchmark-owned direct-40 profile reaches the production CPU/GPU construction contract without changing application defaults          | Retain default invariance while completing Stage 13 closure                                                          |
| Current-production Bruneton dome regeneration gate              | Complete for distant B1 GPU | Production-34 and pre-parity reflection-completed-136 each completed all 17 B1 conditions and regenerated the six original B1 figures | Not a gate for a Flat/local-only candidate; retain for distant/shared decisions                                      |
| Dense Mie convergence counterfactual                            | Complete                    | Phase-only 34-1088 sweep, paired-272 J4 at the three Figure 5 times, regenerated panels, and Flat off-center/centered captures        | Under-resolved anisotropic Mie quadrature is causal; paired-272 corrects both paths but is not selected              |
| Bruneton midpoint-product qualification                         | Complete                    | 512/392 watchdog controls and valid 288-direction 10:15 B1 score                                                                      | Better symmetry but much worse RMSE and incomplete execution; reject this candidate lane                             |
| Local 68/136 order-separated reflection comparison              | Complete                    | Runs 053-055, cumulative N1-N4 captures, fixed lobe-region and pixelwise measurements                                                 | N1 is identical; the material blue-chroma reduction enters at N4, confirming reflection balance targets the residual |
| Local reflection-136 phase stress                               | Complete                    | Runs 057-060 at 0, 22.5, and 45 degrees                                                                                               | Lobe chroma remains improved at every phase, but complete-frame phase dependence remains                             |
| Local reflection-136 centered phase control                     | Complete                    | Runs 061-063, centered 512-by-256 FOV120 upper-sky symmetry                                                                           | Every phase materially improves production RMS/maximum; doubled work and residual phase error remain                 |
| Final-view interval convergence                                 | Complete                    | Runs 085-091, local 15/40/80/160 interval series and fixed-region comparisons                                                         | Native 15 under-resolves the long flat path and amplifies brightness; the directional lobe persists at convergence   |
| Shared distant interval control                                 | Complete                    | Runs 112-117, San Jose sunset at 15 and 40 intervals with frozen and right-third cameras                                              | The interval selection materially affects distant output too; B1 already owns the 40-interval authority              |
| Ordinary-34 reflection completion                               | Complete                    | Runs 118-121 and 125, off-center and centered controls at 40 and unchanged 15 intervals                                               | Exact `[x,-y,z]` completion reduces centered maximum from 108 to 1 byte at native 15                                 |
| Reflected-ordinary-68 distant B1                                | Complete                    | Runs 122-124, three sensitive times, complete 17-condition boundary, scores, and six regenerated figures                              | Aggregate RMSE improves from 11.925778 to 11.820392 mW; shared correction is promoted                               |
| Dense paired-272 complete B1 attempt                            | Rejected                    | Runs 092-111; five valid J4 conditions, two reproducible 10:45 J4 zero readbacks, and a valid 10:45 J3 control                        | Fails GPU execution gate; do not use as the shared correction                                                        |
| Production promotion and default gates                          | Complete with deferred oracle refresh | Shared reflected-68 owner, 479/479 Algorithm32 specs, 17/17 B1 production contracts, 3/3 Flat32 browser checks, both type checks, and canonical 17-condition GPU B1 output | Close this diagnostic; the stale native-N4 binary64 CPU/GPU oracle fixture must be regenerated in a later validation lane |

Update this table after every completed step. Replace stale status rather than
appending a narrative. Generated reports, captures, readbacks, and logs remain
under their ignored diagnostic roots. Reflection tests use one new, sortable
numbered folder per run under `tmp/blue-glow-diagnosis/tests/`; this document
records only the durable current conclusion and links to retained local
evidence.
