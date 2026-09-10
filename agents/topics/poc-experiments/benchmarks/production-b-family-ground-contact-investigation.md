# B1 Historical Ground-Contact Investigation

Status: the 12:45 discrepancy is localized and causally reproduced. Both CPU
geometry owners now resolve exact inward surface contact analytically. The
corrected offline GPU compiler already classified these ground contacts correctly.
The [canonical C1.9 result](production-b-family-c1-9-result.md) remains rejected
under its original fixed ceiling; no acceptance threshold or historical
evidence has been changed.

## Profile And Ground Controls

All 17 historical/current declared profile records match exactly. Each current
compiler request reproduces its recorded construction hash, including all 40
source, Rayleigh, Mie, and ground-albedo values. All 680 executed wavelength
layers match the direct-40 basis: `360 + 11.75 * index` nm, through 818.25 nm.
The controls are view/source/transport intervals `40/20/40`, cumulative J4,
Native48 positions, F68 incoming directions, and W27 outgoing directions.

Ground uses `b1-bruneton-grass-v1`, the uniform Lambertian spectral boundary,
with albedo hash
`sha256:1dd8ae67c73b28a1708cc35f076a764f9a76d113c25b8a37582f3afa08a7beb4`.
The equation review found the same direct reflected source contribution in
J2 and the same pure L1/L2 ground illumination feeding J3/J4. Matching these
inputs alone does not prove the numerical ground-hit classification.

The historical browser regenerates its profile from the same factory. Its
12:45 source direction differs from Node by at most `1.1102230246251565e-16`,
and its Mie coefficients by `6.776263578034403e-21`; source, Rayleigh, and
albedo packets match exactly. A separate replay forcing the exact Node source
direction reproduces the original historical output exactly. That tiny
source-direction difference is not the cause.

## Causal Result

Sixteen conditions differ between the historical and current GPU tables by
RMS `7.109451828166352e-8` to `2.728227893079391e-7` W m^-2 sr^-1 nm^-1.
Only 12:45 has the much larger RMS `0.0008974114511514211`, with maximum
`0.006097778677940369` at grid 8/4, channel 4 (407 nm).

At 12:45, F68 incoming indices 62 and 63 have physical vertical component
`-0.0035166659175213675`. At the exact ground node, these inward rays must
intersect ground at distance zero. The historical CPU geometry instead
computes `-7.732160156592727e-8` meters through a subtractive quadratic root.
This lies below its negative roundoff allowance of
`4.519051799434237e-8` meters, so it reports no intersection. The resulting
CPU-generated contact mask and transport classification admit light along
two directions that should be ground-blocked. No other canonical condition
has a ground-contact classification mismatch.

The isolated GPU reconstruction serves source from retained Git revision
`8f432be1`, with the installed Three dependency and RTX 2060/D3D11 browser.
This identifies the reconstruction source, not a newly inferred historical
execution revision. All replays retain 81 directions and all 40 channels.

| Diagnostic | RMS against historical 12:45 | RMS against current 12:45 |
| --- | --- | --- |
| Unchanged historical source | 0, all 3,240 values identical | 0.0008974114511514211 |
| Historical source with exact Node source direction | 0, all 3,240 values identical | 0.0008974114511514211 |
| Historical source with only exact-ground inward hits forced to zero | 0.0008973377041582633 | 0.0000002380004783574596 |

All RMS values above are W m^-2 sr^-1 nm^-1. The ground-only intervention
reduces the discrepancy by about 3,770 times; its maximum residual against
current output is `0.0000011324882507324219`. The remaining differences are
comparable to those at the other 16 conditions. This is causal localization,
not a claim of passing independent CPU-construction parity: the residual RMS
is above that separate `2e-7` envelope, and both compared constructions are
GPU calculations.

## Production Correction And Verification

`SphericalScatteringCacheGeometry._transportGroundDistance` and
`SphericalEarthGeometry.distanceToGroundBoundary` now return the analytical
zero-distance hit when the origin radius equals the ground radius and the
radial direction is strictly inward. This avoids root subtraction entirely
for the proven failing case. Nonzero-altitude discriminants, tangent behavior,
and the existing 32-ULP allowance for slightly inside origins are retained.
No new tolerance or terrain penetration policy is introduced.

A broader stable-quadratic rewrite was tried and rejected after the complete
engine suite showed that it also changed two elevated stellar horizon-node
classifications. That trial and its failed test are preserved. The final
correction is confined to the exact-surface case proven by the GPU intervention;
the stellar test passes without changing its expected result.

The regression test failed before the correction and passes afterward. It
checks all F68 directions at the problematic source placement through both
geometry owners. Additional checks cover planetary-scale radial heights and
tangent misses; existing inward, outward, and slightly-inside cases remain.
A fresh audit of all 17 profiles now has zero contact-classification or exact
surface-distance mismatches across 1,156 directions. No physical profile,
offline compiler, prebuilt cache asset, historical source, or historical
result was edited. No expensive independent full CPU reconstruction was run.

Final verification: all 641 Algorithm32 specs pass, the Algorithm32 type check
and repository formatting check pass, and the focused correctness/architecture
review reports no actionable issues. The previously failing stellar-cache test retains its original
expected count. Verification uses the approved consolidated review scope;
no complete standards-compliance ledger is claimed.

## Immutable Evidence

All roots below are under
`tmp/extraterrestrial/production-color-reset/p8/`:

| Root | Evidence |
| --- | --- |
| `c1-9-profile-audit-000001` | exact declared profiles and all 680 consumed spectral layers |
| `c1-9-baseline-parity-000001` | reused independent 09:30 CPU comparison; current GPU passes, historical GPU narrowly exceeds the existing envelope |
| `c1-9-historical-replay-000001` | retained failed exact browser/Node profile-hash check; cleanup recorded |
| `c1-9-historical-replay-000002` | retained failed diagnostic getter adaptation; cleanup recorded |
| `c1-9-historical-replay-000003` | unchanged historical reconstruction, exact 12:45 reproduction |
| `c1-9-historical-node-direction-000001` | exact Node direction intervention; original output unchanged |
| `c1-9-historical-ground-contact-000001` | one exact-ground-contact intervention, full direct-40 causal proof |
| `c1-9-ground-contact-audit-000001` | original CPU geometry contact audit and complete per-condition table comparison |
| `c1-9-ground-contact-audit-000002` | surface audit of the subsequently rejected broader quadratic trial |
| `c1-9-stable-root-trial-000001` | rejected broader source trial and elevated stellar horizon test failure |
| `c1-9-ground-contact-audit-000003` | final exact-contact correction, all 1,156 directions correct |

Replay records include the requests, packet comparison, parent table and
provenance hashes, served module identities, original/transformed source
hashes for interventions, result hashes, and session/browser/server cleanup.
Historical modules were served read-only from Git into an isolated browser;
ordinary production runtime recurrence was not restored.

The final `c1-9-ground-contact-investigation-000001/artifact-index.json`
authenticates 61 artifacts, including both final implementation files and the
regression spec. Its SHA-256 is
`6e744d1bc37644d61c151c926df05feccde08b092bfcc7f358dd1e9a9aca449e`.
The verifier rechecks replay cleanup, exact historical reproduction, the
1,156-direction final audit, unchanged audit inputs, and every indexed hash.

## Remaining Qualification Decision

The fixed ceiling was derived from a historical result containing this
ground-contact defect. Its favorable numerical score is therefore not clean
evidence that a physically correct implementation should reproduce that
score. The geometric conflict is resolved by blocking inward surface rays;
reintroducing the leak to recover the old score would be incorrect.

The original C1.9 rejection remains valid under its declared rule. C1.10 and
release C1 stay open. A prospective, explicitly documented benchmark-authority
decision must address the defective historical reference and freeze a valid
qualification contract before another acceptance run. This investigation does
not silently replace that contract, relax the ceiling, or claim scientific or
release acceptance. Reuse the current asset set and preserved evidence unless
the resulting contract requires different execution inputs.
