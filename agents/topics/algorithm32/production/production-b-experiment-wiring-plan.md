# Production B-Experiment Wiring Plan

Status: open; execution plan for closeout item C1.

This plan wires the production Algorithm32 candidate into the existing B1,
B2, and B3 experiment family after distant-Sun runtime recurrence removal.
B1 owns generation of the production directional spectral-radiance boundary.
B2 and B3 must consume derivatives of that same immutable B1 run; they do not
receive separate cache builders or independently generated candidate data.

The parent release item is
[C1 in the coordinated closeout plan](color-star-cache-closeout-plan.md#release-critical-closeout).
The numerical and presentation requirements are owned by the
[Color Reset production qualification B1 boundary](color-reset-production-qualification.md#b1-boundary)
and
[Color Reset implementation plan P8](color-reset-implementation-plan.md#p8---run-production-qualification).

## Objective

Produce and accept one fresh production GPU B-family record in which:

- production-owned offline machinery constructs the exact direct-40 B1 cache
  assets;
- production runtime loads those exact prebuilt assets and never executes the
  distant-Sun recurrence;
- the production final-view transport shader emits the native direct-40
  boundary through a Color-free scoring seam;
- B1, B2, and B3 consume one backend-identified immutable production-run
  manifest;
- B1 produces the complete table and all six figures; and
- every required numerical, provenance, compatibility, and control gate
  passes.

## Fixed Boundary

The canonical closeout candidate is cumulative J4 over the existing 17 B1
conditions, 81 directions per condition, and 40 direct spectral coordinates.
The B1 aggregate RMSE must be no greater than
`11.820391604126252 mW m^-2 sr^-1 nm^-1`. B3 must reproduce the same-run B1
aggregate within `0.000001 mW m^-2 sr^-1 nm^-1`. Existing predeclared B1 and
B2 classification rules remain conjunctive rather than being replaced by the
closeout threshold.

Physical scoring must bypass Color, display encoding, tone mapping, and the
human-vision presentation filters. The six comparison figures must explicitly
use Basic Bruneton as their display control. This is an experiment control,
not a change to the ordinary Flat32 default.

Before implementation begins, reconcile any stale result descriptions in the
[B1 runner documentation](../../../../scripts/experiments/b1-directional-sky-radiance/README.md)
with this fixed boundary. Do not change a predeclared judgment rule in response
to the new result.

## Ownership And Dataflow

```text
B1 production profile
  -> production-owned offline direct-40 compiler adapter
  -> verified content-addressed cache assets
  -> production GPU cache loader and final-view transport shader
  -> immutable 17 x 81 x 40 B1 production boundary
  -> B1 independent scorer and six figures
  -> B2 integration of the exact B1 table
  -> B3 31-channel cube derived from that exact table
  -> one immutable B1-B3 score record
```

Production code and production-owned offline tooling may implement profile,
compiler, asset, loader, and shader integration. The experiment directories
continue to own benchmark mapping, independent scoring, figures, and result
publication. No contained experiment or archived Star implementation may be
imported by production at runtime.

All new execution and qualification output belongs below a new immutable run
under `tmp/extraterrestrial/production-color-reset/p8/`. Existing retained,
sealed, archived, or published results must not be modified or overwritten.

## Work Plan

### C1.1 - Freeze And Test The B-Family Contract

- Encode the canonical J4, 17-condition, 81-direction, direct-40 boundary as a
  single production-run contract.
- Require one backend, one production revision, one profile family, and one
  complete ordered condition set.
- Require B2 and B3 to resolve their inputs only through the validated B1
  production-run manifest.
- Test rejection of incomplete selections, mixed backends, changed axes,
  missing cubes, and mismatched provenance.

Gate: the contract tests demonstrate that no collection of unrelated tables
or assets can be presented as one canonical B-family run.

### C1.2 - Define The Direct-40 Production Asset Contract

- Define the exact asset shape needed by one B1 condition: direct-40 spectral
  basis, Native48 position domain, W27 outgoing domain, F68 incoming domain,
  cumulative J4 order, and the B1 numerical controls.
- Record profile, source, atmosphere, geometry, ground, domain, numerical,
  compiler, payload, and derivation identities.
- Make compatibility validation explicit and fail closed for the wrong basis,
  condition, order, source direction, domain, shape, byte length, or hash.
- Keep the qualification asset distinguishable from the deployed
  Native15/Z180 scene-cache inventory wherever their contracts differ.

Gate: independently constructed valid fixtures round-trip, and every declared
incompatibility is rejected before GPU installation.

### C1.3 - Make The Production Offline Compiler Profile-Driven

- Extract or extend the reusable production compiler seam currently owned by
  the distant-Sun offline compiler so it can accept an explicit, validated
  production execution profile.
- Preserve the current fixed Native15/Z180 compiler path and its identities.
- Reuse the production recurrence implementation; do not copy its equations
  into the B1 experiment harness.
- Preserve output containment, exclusive creation, real-path checks, link
  rejection, progress recording, and complete derivation evidence.

Gate: the existing production cache-compiler qualification remains green, and
a direct-40 dry run resolves the exact intended profile without emitting a
runtime-recurrence path.

### C1.4 - Implement The B1 Offline Asset Adapter

- Map `createBrunetonProductionProfile()` into the profile-driven production
  compiler request without silently resampling its 40-coordinate basis.
- Compile one complete J4 cache asset for each of the 17 canonical conditions.
- Finalize every asset transactionally with a content-addressed manifest and
  immutable payload hashes.
- Emit a set manifest binding all 17 condition assets to the exact production
  revision and B1 profile family.

Gate: a post-build verifier independently authenticates every asset, the set
is complete and ordered, and rerunning cannot reopen or overwrite the run.

### C1.5 - Wire Exact Assets Into The Production GPU Host

- Give the B1 GPU host the verified asset-set descriptor rather than permission
  to construct a cache.
- Make the browser host serve or load only manifest-authorized asset bytes.
- Configure each production B1 profile with its matching exact prebuilt cache.
- Install the cache through the production loader/backend and retain the
  production final-view transport shader.
- Remove the B1 harness dependency on ordinary `Algorithm32.setupShader()`
  constructing recurrence data.

Gate: an asset-backed GPU condition completes while the ordinary runtime
missing-asset rejection remains green and no runtime code path invokes the
recurrence.

### C1.6 - Preserve The Color-Free Measurement Seam

- Retain the native four-channel-at-a-time GPU spectral readback until all 40
  channels are captured.
- Prove that Color Reset, display encoding, tone mapping, and stellar
  presentation filters cannot affect the B1 table, B2 integration, or B3 cube.
- Select Basic Bruneton explicitly only when generating the six visual
  comparison figures.
- Record the scoring and figure-control identities separately in provenance.

Gate: focused tests fail if a Color or presentation contribution reaches the
physical measurement boundary, and the figure manifest names Basic Bruneton.

### C1.7 - Strengthen Run And Derivation Provenance

- Extend the production-run manifest with the production revision, compiler
  identity, asset-set identity, all 17 asset identities, profile hashes, GPU
  capabilities, and output hashes.
- Preserve the exact relationship from asset inputs through B1 table, B2
  integration, B3 cube, reports, and figures.
- Require interrupted and bounded runs to remain noncanonical and outside the
  accepted publication path.
- Keep CPU-reference and GPU-production identities distinct.

Gate: the existing `ProductionRun` validator authenticates the complete chain
before any B scorer executes, and tampering at each layer is rejected.

### C1.8 - Run A Bounded End-To-End Proof

- Build and verify one representative condition in a fresh run.
- Load it through the production GPU path and capture all 81 direct-40 spectra.
- Compare the result pointwise with the production CPU reference for the same
  profile.
- Verify shader preparation, finite/nonnegative output, resource cleanup,
  context cleanup, progress evidence, and provenance finalization.

Gate: the bounded proof passes its predeclared CPU/GPU tolerance and leaves no
published or partially canonical record.

### C1.9 - Execute And Score The Canonical B-Family Run

- Compile and verify all 17 canonical GPU assets in a new immutable run.
- Generate the complete B1 production table and derived 31-channel cube.
- Run the combined B1-B3 scorer so B1, B2, and B3 consume that one manifest.
- Generate and verify all six B1 figures.
- Apply the fixed closeout threshold, existing predeclared B1/B2 rules, B3
  consistency rule, output-validity checks, and control checks.

Gate: the fresh GPU B1 result is accepted, B2 is accepted from the same table,
B3 is consistent with the same-run B1 result, and the complete score and figure
manifest is immutable.

### C1.10 - Record Closure

- Record the accepted run ID, production revision, asset-set identity, result
  hashes, score, controls, and verification commands in the
  [production qualification record](color-reset-production-qualification.md).
- Update the B1, B2, and B3 runner documentation to describe the exact
  asset-backed production workflow.
- Mark C1 complete in the parent closeout plan only after every preceding gate
  passes.
- Leave external scientific authority and official experiment registration to
  closeout item C4 and the
  [project reference follow-up](../../../../references/followup.md#color-reset-research-register).

Gate: current-state documentation agrees on the accepted run and contains no
claim that C1 alone supplies external scientific authority.

## Verification Lanes

The implementation must add focused coverage for profile-to-compiler mapping,
asset schema and hash validation, incompatibility rejection, immutable run
publication, asset-backed GPU installation, runtime-recurrence exclusion,
Color-free readback, and same-run B1-B3 consumption. It must also retain the
existing B1 production support suite and the production distant-Sun cache
compiler, loader, WebGL, and runtime missing-asset gates.

The canonical execution commands may be finalized during C1.3-C1.7. They must
provide separate commands for asset construction/verification, bounded GPU
proof, full B1 boundary generation, and combined B1-B3 scoring. No command may
default to overwriting a prior output directory.

## Dependency Order

The implementation critical path is C1.1 -> C1.2 -> C1.3 -> C1.4 -> C1.5 ->
C1.6 -> C1.7 -> C1.8 -> C1.9 -> C1.10. Contract and negative-path tests should
be added with the owning step rather than postponed until canonical execution.

## Done Condition

C1 closes only when a fresh, immutable, asset-backed production GPU run passes
the complete B1, B2, and B3 gates, publishes all required tables, reports, and
six figures, proves the Color and runtime-recurrence exclusions, and is
recorded consistently by the qualification and parent closeout documents.
