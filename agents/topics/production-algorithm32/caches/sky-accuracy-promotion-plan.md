# Corrected60 and Sun-focused outgoing cache production promotion

Status: selected by the owner on2026-10-20. The Sky Accuracy Dials experiment is
[suspended](../../poc-experiments/engineering-studies/sky-accuracy-dials/suspension-2026-10-20.md).
This is a production adaptation and qualification plan, not another experiment.
The [promotion status](sky-accuracy-promotion-status.md) owns execution and gates.

Planning method: [create-plan](C:/Users/gande/.codex/skills/create-plan/SKILL.md),
checked against the current skill on 2026-10-21. The existing independent
critique below remains applicable: this check clarifies execution and reporting
without changing the selected method, scope or acceptance criteria.

## Outcome and selected scope

Adapt the completed **Corrected60 + Sun-focused k=.35** distant-Sun method to
production-owned cache construction, representation, runtime lookup and package
contracts. Establish matched production numerical and appearance qualification,
then prepare a complete candidate/rollback selection for review. This plan does
not itself activate a new deployed package or authorize publishing remotely.
The owner's integration request authorizes preparing this production work;
production reviewer/context requirements remain applicable.

The selected changes are:

1. Sixty cache-building higher-order transport intervals. Experimental app
   controls used15; the paper baseline used40. Source transmittance20 and final
   view integration are separate controls and must not be changed accidentally.
2. Normalize the sampled Mie phase weights in higher-order scattering so their
   discrete mass preserves the intended scattering strength. Preserve the exact
   experimental equation, accumulation branches, physical phase and SSA.
3. Warp the existing4374 W27 outgoing slots toward the row's Sun direction with
   `tan(theta_physical/2)=.35*tan(theta_grid/2)`. Use the reciprocal map for every
   lookup. This is an outgoing reconstruction map; incoming F68 directions and
   integration weights are unchanged, and no quadrature Jacobian is applied.

No per-frame exact-angle tracing is introduced. The final runtime remains a
cache lookup. No production runtime import of `experiments/` is allowed.
Do not promote the later incoming-grid, illumination-reconstruction,
altitude-normalization/PCHIP or additive phase-control branches. Do not change
atmospheric composition, aerosol amount, display mapping or exposure to rescue
a numerical score. Toronto optics remain a matched qualification profile, not
an inferred new default atmosphere.

Qualified experimental scope is spherical geometry/distant Sun. Flat/local-Sun
mapping and its packed cache are outside this promotion unless a separately
registered production compatibility assessment establishes applicability. Do
not silently change Flat32's local cache, the local-light direction frame, or
its selected assets through a shared default.

## Retained authority and compatibility gaps

The [H61 results](../../poc-experiments/engineering-studies/sky-accuracy-dials/outgoing-focus-results.md)
and accepted00397/00398 own the complete B1/implementation evidence. The
[H63 Toronto scenes](../../poc-experiments/engineering-studies/sky-accuracy-dials/toronto-scene-results.md)
and accepted00426 own the matched appearance, CPU/GPU lookup and measured runtime
results. Their seals are pinned in the suspension record; reuse them read-only.

| Retained paper configuration | Aggregate spectral RMSE |
| --- | ---: |
| Original40 | 11.62291402828908 |
| Corrected60, ordinary W27 | 11.668482392019996 |
| Corrected60, focused k=.35 | 11.593958857038787 |

H61 uses full Direct40/N4,17 times and81 directions, with31 scoring bands under
the original B1 contract. Its paper path uses Native51; deployed production uses
anchored Native48, Native15, cubic solar interpolation, P2 and FP32. Authenticate
each current input rather than treating a retained experimental score as a new
production score. H63 uses the registered hybrid Toronto phase/SSA and San Jose
scenes, not Toronto weather. It does not establish twilight physical truth.

The current distant-Sun release remains
`9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`;
its [release owner](distant-sun-strobing-release.md) retains exact selection and
rollback contracts. Existing packages, manifests and archived evidence are
immutable. Regenerate a new candidate package; never reinterpret old payloads
using the focused coordinates.

Production owners currently expose the ordinary W27 domain, compiler transport15
and shared/dense package validation. The selected warp changes physical node
meaning even though slot counts, seam duplication and byte dimensions agree.
Make the executable policy, domain/numerical identity and compatibility binding
explicit across generator, serializer, loader, CPU evaluator and shader. Do not
use descriptive metadata to select algorithms or recover indexing facts.

## Milestones

### P0: freeze the transfer contract and production boundary

Purpose: avoid a partial default change or incompatible package/lookup pairing.

- Authenticate H61/H63 source, numerical requests, evidence and transform inputs.
- Inventory production compiler, domain, CPU/GPU recurrence, final-view, shared
  and dense loaders, configuration identity and current deployment call sites.
- Freeze the ownership/API and versioning design: row-local Sun axis, forward
  construction map, inverse per solar tap, legacy versus focused package pairing,
  scoped normalization/interval settings and preserved local-source defaults.
- Pin the normalization equation and authenticated implementation identity,
  including affected higher-order pure/cumulative operations and unchanged
  analytic direct scattering. Retain the Original15/Corrected60 bit-identical
  N1 witness as a production regression control.
- Capture the existing dirty repository state as baseline. Refresh production
  standards context; record a blocked reviewer startup without claiming CLEAN.
- Produce a concise contract/status report and one bounded independent plan
  critique. Incorporate suggestions compatible with the selected scope.

Completion: all changed execution/serialization seams have named owners and
legacy compatibility is explicit. First executable step: finish the P0 inventory
of construction, CPU/GPU lookup and package ingress owners, and record the proposed
typed policy/identity contract in the promotion status. P1 implementation follows
that contract and the required production context refresh.
Estimate:20-40minutes, including the source-impact inventory.

### P1: adapt production-owned construction and lookup together

Purpose: establish a working production slice whose data and interpretation agree
before committing to full cache construction and benchmark qualification.

- Implement the production numerical policy and Sun-focused domain mapping with
  one canonical owner. Keep the legacy identity implementation available for
  existing assets and frozen comparison controls.
- Apply60 intervals and Mie phase-mass normalization in the selected production
  compiler branches, preserving the experimental operation and pure/cumulative
  order semantics. Recompute actual own fields through N4.
- Apply the forward map to every stored J direction and the inverse map to all
  recurrence, ground-support and final-view J lookups. Each interpolated solar
  row must use its own Sun axis before combining taps. Preserve exact seams,
  corners, topology, positivity/constant controls and F68 integration.
- Carry accepted policy/identity through build requests, package metadata,
  generation fingerprints and runtime selection. Reject mismatched package and
  mapping combinations at the genuine ingress. Preserve dark-state, publication,
  residency, cancellation and context restoration contracts.
- Add focused production tests and actual WebGL parity probes. Run relevant
  production type checks and required tests. No source-string compiler patching
  or experimental runtime dependency is a production implementation.
- Test legacy payload/focused lookup and focused payload/legacy lookup rejection
  at shared and dense ingress, not just dimension agreement. Cover cubic solar
  taps with distinct row Sun axes, finite Sun/anti-Sun forward/inverse endpoints,
  and exact duplicated-seam identities.
- Capture the before/after selected configurations and run a representative
  flat/local-Sun smoke check proving its assets, numerical defaults and local
  direction frame did not migrate through a shared default. This is isolation
  verification, not qualification of the focused method for a local source.

Deliverable: coherent source integration, tests and a same-input identity replay.
Gate: identity mode reproduces the old path within the existing registered
floating tolerances; forward/inverse, exact node, seam, constant and CPU/GPU
tests pass. A failed check receives a scoped repair; no broader scientific sweep.
Estimate:80-160minutes; refine after the actual ownership/format impact is frozen.

### P2: reproduce the accepted benefit with the production route

Purpose: determine whether the retained benefit survives the actual production
representation and runtime, rather than assuming the experimental score transfers.

- First run a small three-band matched control/candidate slice to catch frame,
  accumulation and identity errors before full construction. Retain pure and
  cumulative orders and the same physical queries; do not compare unlike texels.
- Reproduce the H61 paper configuration with the production compiler: all40
  wavelengths,17 times,81 rays and31 scoring bands. Authenticate retained controls
  and report all interval RMSEs plus aggregate RMS-of-interval-RMSE arithmetic.
- Freeze reproduction sensitivity before those results: retain the existing
  5e-6 relative same-query spectral replay limit with1e-12 absolute floor, and
  target an aggregate numerical-sensitivity budget no larger than0.0001
  mW m^-2 sr^-1 nm^-1. This is well below H61's0.028955171250293 improvement over
  Original40. Numerical uncertainty must be included in the final score delta;
  it is not an allowed physical RMSE regression. If precision cannot attain the
  budget, report the gate inconclusive and diagnose the actual numerical driver.
- Require the matching H61-adapted production output to reproduce its target
  within a prespecified numerical sensitivity, and match/improve both Original40
  and freshly generated identity control under identical paper inputs. Any
  Native48/51 difference gets an explicit matched comparison, not silent relabeling.
- Deliver a matched Native51-to-anchored-Native48 bridge at identical physical
  queries and numerical controls, then separately gate the actual Native48/
  Native15 candidate against the current production route. Native51 paper
  reproduction cannot qualify the deployed representation by itself.
- Build the actual Native48/Native15 production candidate through its ordinary
  generation/package path. Capture matched current/candidate scenes for paper
  and registered Toronto optics: San Jose noon toward/side/away, sunset-10,
  sunset,+30 and+60minutes. Use identical exposure/display and genuine full spectra.
- Publish the first complete before/after scene pair promptly. Images communicate
  actual sky appearance and spatial artifacts; numeric scores and status remain
  native tables/JSON. Do not generate textual reports as images.
- Verify runtime CPU/GPU lookup on real packaged data, finite/nonnegative output,
  seam behavior, twilight/darkness, jumps, cancellation and context restoration.
  Measure build cost, peak memory and frame timing separately. H63's observed
  extra0.52-2.67ms is reference evidence, not a new universal production guarantee.

Gate: complete paper nonregression and representation/runtime checks pass;
appearance and twilight limitations are reported separately. Missing independent
twilight truth cannot be replaced by a brightness preference. A reproduced
numerical or package error is repaired in the affected seam, without reopening
the suspended experiment. A true benchmark regression holds production adoption.
The aggregate gate permits disclosed per-interval regressions, as in H61; it
does not impose a new all17-interval nonregression condition. Retain each interval
and its sign rather than hiding them behind the aggregate.
Estimate:40-100minutes after implementation; retained40-band H61 computation was
about315s. This estimate covers the bounded comparison work; full-inventory build
duration, peak memory and retained disk requirements remain unknown until a
representative production package pilot is measured. Before full generation,
record those measurements, extrapolate using actual inventory counts and revise
the estimate. Proceed only after the small slice and compatibility checks pass.

### P3: review and prepare a deployable candidate/rollback pair

Purpose: establish a qualified, reviewable candidate with a complete rollback
selection before any separately authorized activation.

- Stabilize one coherent production review unit. Run only the applicable mapped
  standards lanes and independent audits at that milestone, subject to readiness;
  do not run review rounds after every edit or render.
- Required review scope follows repository [Review Timing](../../../../AGENTS.md#review-timing):
  the changed numerical policy, construction/lookup integration, package contracts
  and qualification tooling, with only their required mapped collaborators.
  P0 records the exact baseline and inventory. The trigger is stabilized P1/P2
  work; the question is whether that production unit satisfies its applicable
  standards. Completion requires valid evidence and resolved findings before a
  compliance handoff; this does not reopen the suspended experiment or add
  discretionary reviews. P1/P2 implementation-completion claims retain this gate.
- Generate a new immutable shared inventory and qualify its loaded identities,
  block packing, compatibility rejection and production scene routes. Keep old
  packages and selections byte-identical.
- Prepare exact candidate/rollback manifests and build/publication commands,
  with before-hashes, package/report identities and measured target bounds.
  Activation/publication is a distinct final action under its applicable authority.
- The immediate rollback for this promotion is current package
  `9a30749c6d4e6c23d7a84839788c068133051fbbd9bd93d07de8b18a6ee432ec`
  with its Native48/cubic/P2/FP32 selection, compatible legacy lookup and applicable
  memory-admission evidence. It is not the release document's older P9/linear
  predecessor. Verify restoring the complete selection through rebuild/restart
  and loaded-identity rendering.
- Update production design/status owners and provide the final report: source
  changes, tests, B1 table, scene links, performance, review disposition, remaining
  limitations, deployment state and local checkpoint/recovery evidence.

Completion: reviewable production source, qualified package and executable
rollback preparation; no claim of deployment until activation is actually done.
Estimate:20-60minutes for review/rollback preparation, excluding the pilot-estimated
full-inventory build and any external reviewer-readiness repair. Reviewer
calibration is currently stale; its repair time is unknown and is not a science task.

## Evidence cadence, recovery and review scope

Use new ignored children below `.codex-tmp/sky-accuracy-promotion/` for production
qualification and staged assets. No production output is written into suspended
experiment runs. Reuse completed work by exact physical/numerical/tool identity;
preserve failed attempts and parent derivations. No blind restart of a complete
cache when one wavelength or reporting step fails. Keep one GPU job at a time.

Publish useful evidence through progress updates and the owning status as soon
as it becomes available. At each milestone, put a concise reviewable report in
the promotion status: completed deliverables and evidence links; observations
separate from interpretation; verification, limitations and unresolved questions;
and disposition with its reason and next action. These reports do not introduce
approval pauses or reviewer rounds.

Record pass, fail or inconclusive for each gate. A failed compatibility or
numerical check holds the affected milestone for a scoped repair; a confirmed
benchmark regression holds adoption. An inconclusive result names the missing
evidence and the bounded action that could resolve it. Preserve original gates.
Reforecast when the measured pilot changes the estimate; time estimates are
monitoring guidance, not automatic stopping limits. Keep work bounded to this
selected method; a new accuracy hypothesis or atmospheric model is outside the
promotion. Build complexity and cost are measured and reported, not a new
scientific rejection threshold. Existing real resource limits remain applicable.

The completed draft critique was limited to this plan, the suspension handoff,
H61/H63 result owners and production cache contracts needed to identify a
specific omission. Its question is whether the plan faithfully transfers the
selected method and protects coordinate/package compatibility and production
defaults. It completes with incorporated actionable recommendations or explicit
reasons for exclusion. It is not a standards review or experiment restart.

## Incorporated independent plan critique

The bounded second-agent critique completed on2026-10-20. All six recommendations
are incorporated: frozen reproduction sensitivity and permitted interval
regressions; an explicit Native51/Native48 bridge; exact normalization branch/N1
semantics; negative package/lookup pairing and row-axis endpoint checks; current
Native48/cubic/P2/FP32 immediate rollback; and checked flat/local default isolation.
No additional science, review lane or experimental continuation was added.

The 2026-10-21 create-plan check retains that critique and its incorporated
recommendations. Clarifications identify the immediate P0 inventory step,
milestone purposes and report contents, the pilot required to estimate full
generation, and the bounded governing production review. They do not materially
replan the work, so no duplicate critique or standards review is requested.
