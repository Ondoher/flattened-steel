# Remove Repeated Validation Of Owned Rendering Content

Status: executing under the owner's independent-execution request on 2026-11-08.
The [execution record](owned-content-cleanup-execution.md) owns progress and decisions. The
[audit](owned-content-validation-audit.md) owns the findings and measured counts.

## Outcome And Scope

Accept content at its actual input/construction boundary, then trust the
engine-owned result as it passes through collaborators. Remove every redundant
validation identified by the audit, including indirect packet/basis checks and
the unnecessary receiver-light reconstruction. Keep current physical results,
rendering quality, publication behavior and resource ownership.

Completion requires the following outcomes on ordinary retained time/height
updates, after initial setup:

| Identified work | Required result |
| --- | --- |
| Two complete static star-catalog scans per update | No member rescans or member-identity rebuilding for the same accepted source/basis. |
| Recombining completed receiver light during adoption | Adopt the completed measurement without rescanning or recomputing its totals/projections. |
| Two temporary dark receiver measurements | Do not construct placeholders that the retained preparation path immediately replaces. |
| Repeated receiver packet/basis checks through combine, arithmetic and projection | Validate genuinely new inputs/results at their boundary; trusted internal stages consume accepted packets directly. |
| Repeated sample metadata checks in GPU reduction and sky median | Both consume the same accepted sample batch without rechecking packet shape/basis. |
| Two frame-content validations | The owned Flat staging path does not rescan its completed aggregate at staging/publication. |
| Three live-frame identity computations | Construct the required identity once; do not recompute it to detect mutation of trusted content. |
| Four stellar observation hash comparisons | No equality rehashing of the already-paired owned geometry/observation. |

Each row must be resolved and supported by evidence before completion; an
unresolved row keeps the plan incomplete. Cheap runtime assertions are still in
scope even if they are not the largest timing cost. Global assertion counts
need not be zero: construction, external ingress and operational checks remain.

This is production implementation, not a new experiment. No UI changes, altered
Sun/time semantics, lower spectral/angular resolution, new cache dimensions,
height-specific shaders, reduced scattering, fewer physical samples or stale
receiver measurements. GPU-readback batching and reuse of newly constructed
live-profile topology/initial identity are separate optimizations and excluded.
Do not reopen the suspended dome experiment or change protected evidence.

## Starting Point And Design Constraints

The audit measured identical counts across three warmed Full-mode updates:
two catalog scans, 4,150 packet assertions, four receiver combinations, two
frame-content validations, three frame-identity computations and four stellar
observation comparisons. Nested counters overlap. These are call counts, not
per-item latency estimates. The earlier
[performance note](sun-slider-performance.md) owns latency before/after removal
of the three full-profile checks; preserve that improvement.

Use existing audit/profile evidence for ownership tracing and measurement-tool
design. Record the execution starting HEAD, working-tree diff/new-file inventory
and built-source identities in ignored task output. The current working tree
contains earlier completed, uncommitted work: preserve it and any owner edits.
Compare the candidate to this starting working state, not HEAD alone. Reuse
historical numerical/visual results only for their actual unchanged claims.
Source, contracts, settings or device changes invalidate direct timing reuse.

The intended pattern is one accepted immutable value with reusable identity
facts, shared by internal collaborators. Use private construction/ownership
paths and ambient readonly contracts, not public `trusted`/`skipValidation`
switches or runtime administrative allow-lists. Define who may construct and
publish accepted results. Do not add repeated deep cloning/freezing/hashing to
replace the removed work. If a small ingress snapshot is needed, make it once.
Document that internal consumers must not mutate owned content.

`ownedObservation` currently identifies an engine-built physical profile; it
does not establish that an arbitrary `stageFrame` callback is trusted. Establish
the provenance of the prepared aggregate separately. A generic callback remains
an external boundary even when it receives an engine-built profile. Prefer the
smallest internal owned staging capability or adapter; define it in M1 and use
it in M4. This should not require feature names or imports inside Algorithm32.

Keep validation that prevents a concrete failure: malformed external packages,
new incompatible spectral bases, invalid physical/numerical results, unsupported
view coverage, incompatible programs/layouts, stale generations, cancellation,
retired/foreign frame publication, context loss and invalid leases. Preserve
existing external contracts, including Flat32 and spherical consumers of shared
engine classes. Do not require existing generic users to claim internal trust.

## Milestones

Run these in order. Estimates are provisional active implementation/check time,
not hard limits or approval gates. Use actual M1 evidence to revise them.

### M1 — Accept Static Stellar Content Once

Purpose: deliver the first working cleanup and settle the ownership boundaries
needed by later milestones. Estimate: 1–3 hours, with uncertainty around shared
roster consumers and retaining current identity serialization.

- Establish the source baseline and an execution record. Inventory affected
  public entry points, constructors, owned consumers and existing negative tests;
  record which checks move, disappear, or remain and their concrete purpose.
- Before source edits, capture the baseline numerical outputs, representative
  images/repeatability and latency/count samples specified in M5. Reuse an
  existing baseline only where its source, settings and claims match this starting
  state; otherwise measure it now. Preserve enough input/configuration detail to
  repeat identical observations after cleanup. Use the normal build if the
  existing bundle does not represent the starting source.
- Add diagnostic-only per-path counters for static-member acceptance, receiver
  input scans, adoption recombination, each placeholder construction, sample
  metadata acceptance, staged-content validation, frame-identity recomputation
  and stellar observation-equality hashes. Distinguish external, construction
  and owned-reuse calls; broad assertion totals alone cannot prove removal.
  Keep instrumentation out of production source.
- Specify the owned measurement, sample-batch and staged-frame contracts for
  M2–M4. Resolve the generic-callback distinction before editing frame code.
- In `CelestialSourceRoster`, `StellarPointSetSource` and compact execution-profile
  assembly, retain the accepted static member facts/identity at the true catalog
  boundary. Avoid scanning or reconstructing them for roster acceptance or
  identity description on each changed Sun.
- Tie reuse to the accepted source and spectral interpretation. A different
  source or incompatible basis must undergo real acceptance; an accepted source
  must not become a mutable container whose old facts silently survive edits.
  Take ownership of nested catalog metadata, member directions and packet input
  values at ingress with a one-time defensive copy or an enforced ownership
  transfer. Existing caller aliases must not silently alter accepted facts;
  readonly declarations alone do not establish this. Cover later caller mutation
  in a focused regression without adding mutation-detection scans at reuse.
  Preserve existing identity facts/serialization and resulting hashes for equal
  physical content unless a concrete contract change is documented and tested.
- Distinguish reaccepting/rebuilding member facts from serializing those retained
  facts to create a genuinely new execution-profile identity. That initial hash
  can still traverse all members and is intentionally retained to preserve
  identity semantics in this cleanup. Report its remaining cost separately;
  do not describe the complete roster path as constant-time or invent a hash
  schema change solely to make its counter zero.
- Add focused regressions to existing source/roster suites: repeated time
  updates reuse accepted star facts; genuinely new/invalid catalog input and
  incompatible bases are handled correctly. Retain supported 500/2,000-member
  and Flat/spherical behavior without adding new qualification restrictions.

Deliverable and completion: an executable app with zero warmed member scans,
correct new-source acceptance, unchanged physical identity semantics, engine/app
types and affected tests passing. Publish the before/after counts promptly.
Record the selected internal ownership contracts and the next milestone.

### M2 — Publish Prepared Receiver Light Without Rebuilding It

Purpose: retain exactly one completed measurement and remove unnecessary work
around it. Depends on M1 contracts. Estimate: 2–3 hours; shared facade/controller
initialization and rollback are the main uncertainties.

- Update `ReceiverEnvironmentLightController`, `Algorithm32ShaderHandle` and
  facade preparation to adopt the owned completed measurement directly. Reuse
  total irradiance, photopic projections, adaptation and identity already computed.
- Supply prepared light when constructing candidate facade state, or defer
  initialization until it is available, so this path constructs neither dark
  placeholder. Preserve legitimate initial-dark behavior for callers that need
  it; do not expose partially initialized public state.
- In `LocalLightLevelCalculator` and affected spectral arithmetic/projection
  collaborators, remove nested checks of the same accepted packets. Keep external
  math/measurement acceptance and the actual numerical work. Check new results
  where necessary, without passing them through acceptance again at every stage.
- Extend existing measurement/facade tests to cover completed values and identity,
  direct plus diffuse totals/projections, zero illumination, failed preparation,
  publish/rollback and disposal. Keep generation/cancellation behavior intact.

Deliverable and completion: one actual receiver combination per warmed Full-mode
update, zero adoption recombinations, zero immediately replaced placeholders,
and no repeated receiver-input scans in the owned calculation chain. Numerical
values match the starting implementation at identical inputs. Types and affected
tests pass; report residual assertions and their purposes rather than merely
claiming a smaller global count.

### M3 — Share Accepted Receiver Samples Between Consumers

Purpose: finish the audit's repeated sample metadata checks. Depends on the
accepted-value path from M2. Estimate: 1–2 hours, mainly GPU/CPU contract coverage.

- Have the internal transport sampler produce one accepted sample batch. GPU
  reduction and sky-median calculation consume that batch directly. Remove the
  duplicated first-sample assertion and downstream packet/basis reacceptance.
- Keep real batch cardinality/basis acceptance at external sampler boundaries.
  Preserve finite/nonnegative checks for newly computed results where their
  constructors do not already enforce the required invariant. Record each
  retained numeric check and avoid duplicating its scan in both consumers.
- Extend existing sampling/reduction/lighting cases for valid internal batches,
  malformed external batches, nonfinite results and incompatible bases. Retain
  32 hemisphere samples, native15 channels, quadrature weights and output units.

Deliverable and completion: counters prove zero redundant sample metadata
validation inside owned reduction/median consumers, while numeric outputs match
and genuine external invalid batches reject. CPU and existing Three/GPU coverage
for affected contracts pass. Physical sampling/readback counts remain unchanged.

### M4 — Trust Paired Frames And Observations Through Publication

Purpose: finish repeated frame/content and observation hashing without weakening
publication or generic callback boundaries. Depends on M1–M3. Estimate: 2–4 hours;
the owned/generic stage boundary and existing mutation tests are the main risks.

- Update `LocalSunFrameController` and Flat's runtime staging adapter to carry
  the accepted owned aggregate through prepare/publish. Remove repeated content
  validation and request-mutation hashing from that path. Generate one identity
  from the accepted facts and retain it; preserve its identity/provenance meaning.
- Generic/external stage results still receive appropriate ingress validation.
  Add a regression specifically covering an external staging callback receiving
  an engine-created observation, so profile ownership cannot grant it trust.
- Update mutation-oriented tests to reflect the ownership contract. Deliberate
  mutation of a documented internal immutable value is not an input we promise
  to detect through repeated hashes. Preserve rejection tests at real input
  boundaries and for foreign/retired/stale frames, cancelled work and invalid
  externally staged aggregates. Explicitly record changed test promises.
- In `FlatEarthGeometry` and its retained stellar-generation collaborators,
  consume the paired geometry/observation without rehashing for equality. Keep
  external mismatch detection at the real acceptance boundary and genuine
  program/catalog/layout compatibility checks. Do not replace hashes with deep
  comparisons or move the same repeated check to a helper.
- Exercise publication failure/rollback, post-commit retirement failure, rapid
  mixed time/height updates and view closure during preparation. No cancelled
  candidate may install, dispose the displayed frame or borrow a retired cache.

Deliverable and completion: zero `_validateContents` calls on the owned staged
aggregate, one frame-identity computation per candidate, zero redundant stellar
observation-equality hashes, and intact external/lifecycle rejection evidence.
Frame/facade/stellar tests and types pass. No new scene/program/cache construction
appears on ordinary supported updates.

### M5 — Verify The Complete App And Report The Result

Purpose: establish that all identified work is removed without changing the
rendered result. Depends on M1–M4. Estimate: 1–2 hours plus machine-dependent
build/browser run time; investigate any failures before revising the estimate.

- Compare the starting working state and candidate under identical settings.
  Use the existing probe as a starting point, writing new results to unique
  directories under `.codex-tmp/owned-content-cleanup/`. Preserve prior reports.
  Separate cold setup, warmup and measured updates. Use six warmed samples per
  mode/configuration, as in the earlier latency comparison, and report sample
  counts and variability as well as medians. Use lightweight timing runs separate
  from detailed call-count instrumentation when wrapper cost could bias latency.
- Measure real MUI time-slider updates in Full, No atmosphere and Shader off,
  plus two-view Full; cover supported elevation changes separately. Record
  edit-to-ready/frame proxy, CPU preparation, receiver work/readbacks, program
  and cache retention, the displayed instant, accepted height and every audit
  counter. Trace replacement helpers/paths as well as original method names so
  moving or renaming a check cannot produce a false zero. A frame proxy is not
  physical screen-presentation latency.
- Compare receiver packets, total/projection/adaptation values, source placement,
  construction/execution identities and published bindings. Use exact equality
  where the arithmetic is unchanged. Establish GPU/image repeatability and any
  justified tolerances on the baseline before evaluating the candidate.
- Inspect paired real captures for day/night and a low-Sun scene, protecting sky,
  ground, Sun/stars and horizon appearance; use the same view/exposure/settings.
  Include mode behavior and independent camera/height in the two-view checks.
  Images demonstrate appearance; timing/count tables stay in Markdown/JSON.
- Recheck first setup/startup cache reuse, missing location, location change,
  resize/FOV/Center on Sun during preparation, retry/context loss and cleanup.
  Reuse existing lifecycle tests and extend only changed behaviors.
- Run `npm run typecheck:algorithm32`, `npm run typecheck:flat`, the normal
  `npm run test:algorithm32`, affected Three/GPU coverage through the existing
  `test:algorithm32:three` lane, `npm run test:ui:flat`, and `npm run build`.
  Use the configured Polylith/Karma methods; do not change test bundling to fit
  an ad hoc harness. During M1–M4 use affected existing tests, then run the final
  combined checks once at stable completion. Exercise affected Flat32/shared
  spherical contracts if shared API/behavior changes require them; record the
  selected cases. Finish with scoped formatting and Git whitespace checks.

Deliverable and completion: the outcome table is fully resolved, equivalence
and operational tests pass, and the report states actual latency/count changes
and remaining cost. No fixed speedup is promised or used as an administrative
gate: the required outcome is removal of redundant work with correct results.
Investigate material regressions before declaring completion; do not conceal
them in aggregate medians or reduce rendering work to offset them.

## Execution, Recovery And Review

First executable step, once execution is requested: preserve the current working
baseline, create `owned-content-cleanup-execution.md` beside this plan and resolve
M1's ownership boundaries. Source work is primarily under `src/algorithm32` and
the Flat Earth runtime, with adjacent ambient types and existing tests. Keep
workspace and shared configuration independent of feature implementation.

The execution record owns milestone state, decisions, evidence links, next action,
remaining verification and the overall report. End each milestone with completed
deliverables, observations versus interpretation, limitations and disposition.
Publish useful counts/working behavior as soon as available. On interruption,
reload the active topic, plan and execution record and resume at its next action.

If a proposed reuse fails a concrete boundary, repair the ownership contract or
retain acceptance at that boundary and document why it is necessary. Remove the
redundant internal work by another supported path; do not mark an unresolved row
complete or skip the item because it is small. Preserve failed evidence, diagnose
the affected portion and retry that portion. No blind whole-suite repeats.

All automated browsers use disposable profiles, removed on success and failure;
keep measurement output, not browser caches/cookies. Use JavaScript/Python helper
scripts and existing runtimes. Do not modify external repositories or archives.

Engineering standards reviewers remain cancelled; no source review or audit
pipeline is added. The primary owns self-review and local checks. Existing
checkpoint-adviser monitoring remains active independently; this planning request
does not authorize commits, pushes or deployment. The plan receives one read-only
second-agent critique under create-plan before handoff. It evaluates coverage,
ownership, verification and proportionality, not standards compliance, and does
not create an owner-approval pause or recurring milestone reviews.

## Plan Critique

One read-only critique by `owned_content_cleanup_plan_critique` on 2026-11-08
confirmed coverage and recommended four clarifications. All are incorporated:
capture baseline comparisons before editing; establish ownership of nested
caller inputs rather than relying on readonly types; distinguish initial
execution-identity serialization from redundant catalog acceptance; and count
each affected internal path explicitly instead of relying on aggregate assertion
counts. The baseline and replacement-path provisions were already added during
the critique; the final draft makes nested ownership and counter provenance
explicit. No suggestions were rejected. The primary checked coherence and links.
This critique is not a source standards review and did not authorize execution.
