# Production MVP Goals

Status: active goal list, reconciled with current implementation on 2026-11-09.
The owner selected discrete feature and technical goals instead of phases.
Several capabilities are complete; MVP closure remains open.

This document owns selected outcomes, acceptance criteria, current status,
evidence and dependencies. IDs are stable references, not execution order.
Goals may be planned independently when their actual dependencies permit.
This list does not itself authorize implementation, experiments or deployment.

The [application roles](../README.md#application-roles-and-current-status)
distinguish the production Flat app from the Flat32 integration test bed.
Flat32 can supply comparison evidence; it is not the finished app. Status
includes the current working tree, not just a checkpoint or published release.
Reports retain their actual source/build identities and claim limits. The exact
release build is qualified separately under T10.

## Reading and extending the list

- **Complete:** the stated outcome is implemented with recorded verification
  for its defined scope. This does not close another goal's acceptance or grant
  scientific authority or redistribution rights.
- **Partial:** implementation or useful evidence exists; acceptance work remains.
- **Open:** completion is not established. Relevant code or historical evidence
  may still exist.
- **Proposed:** a possible addition awaiting an owner scope decision. Recording
  an idea does not automatically make it an MVP completion requirement.

For an owner-selected addition, assign the next unused F or T identifier and
record its outcome, acceptance, evidence/remaining work and dependencies.
Keep existing IDs stable when titles or priorities change. A goal may have
smaller work items without holding unrelated goals open. Existing candidates
and deferred ideas remain with their owners until selected.

Every selected goal must close before the first MVP can be declared complete,
unless the owner explicitly reduces its scope or dependent claim. Record any
removal/reduction here and in the applicable release record, with its reason;
do not silently delete the obligation. Further goals can be added as scope
evolves. Reassess completed evidence only when its applicable contract, source
or scope changes. This is a requirements list, not an execution plan.

## Current goals

| ID | Feature or outcome | Status |
| --- | --- | --- |
| [F01](#f01) | Workspace and optional comparison view | Complete |
| [F02](#f02) | Flat Earth scene | Complete |
| [F03](#f03) | Globe Earth scene | Complete |
| [F04](#f04) | Shared location and time settings | Complete |
| [F05](#f05) | Independent camera and view controls | Complete |
| [F06](#f06) | Optional camera synchronization | Complete |
| [F07](#f07) | Animation playback and supported update cadence | Partial |
| [F08](#f08) | Scene objects and content selection | Open |
| [T01](#t01) | Retained time and location updates | Complete |
| [T02](#t02) | Atomic publication and recoverable updates | Complete |
| [T03](#t03) | Independent rebuild equivalence | Partial |
| [T04](#t04) | Source and import provenance | Open |
| [T05](#t05) | Direct-40 reference reporting and current fixtures | Open |
| [T06](#t06) | Single production rendering strategy | Open |
| [T07](#t07) | Numerical boundary and lifecycle coverage | Partial |
| [T08](#t08) | Production types, documentation and implementation citations | Partial |
| [T09](#t09) | Supported hardware, performance and resource acceptance | Partial |
| [T10](#t10) | Exact-build release qualification | Open |
| [T11](#t11) | Third-party scientific source authority | Open |
| [T12](#t12) | First-party official experiment authority | Open |
| [T13](#t13) | Distribution clearance for shipped data | Open |

<a id="f01"></a>
## F01 — Workspace and optional comparison view

**Type:** Feature. **Status:** Complete for the selected workspace scope.

**Outcome/acceptance:** One persistent workspace supports one active location
and an optional second view with independent page choices. Comparison preserves
the first view; layout and canvas aspect ratios follow available space,
including configuration and narrow layouts.
**Evidence:** [Flat workspace status](../../flat/README.md#current-scope),
[workspace execution](../../flat/workspace-comps-execution.md),
[scene resizing](../../flat/scene-resize.md).
**Dependencies:** None within this list.

<a id="f02"></a>
## F02 — Flat Earth scene

**Type:** Feature. **Status:** Complete for the selected scene content.

**Outcome/acceptance:** Render the production Flat/local atmosphere, finite Sun,
catalog stars and green ground using the shared observation. Support selected
shader modes, eager reusable cache startup and measured direct/diffuse ground
lighting. Scientific qualification is separate; this goal does not resume the
suspended dome-cache experiment.
**Evidence:** [Flat implementation](../../flat/README.md),
[stars](../../flat/stars.md), [shader modes](../../flat/shader-options.md),
[ground-lighting correction](../../flat/ground-lighting.md).
**Dependencies:** F01; F04 supplies a selected observation.

<a id="f03"></a>
## F03 — Globe Earth scene

**Type:** Feature. **Status:** Complete for the selected scene content.

**Outcome/acceptance:** Render the production spherical/distant atmosphere,
Sun, stars and curved green ground. Use app-owned cache delivery and independent
view resources in standalone and discoverable-app composition.
**Evidence:** [Spherical execution](../../flat/spherical-earth-implementation-execution.md)
records real shader comparisons, same/mixed views, retained updates, recovery
and separately built discoverable-app verification. Distribution clearance
remains separate.
**Dependencies:** F01; F04 supplies a selected observation.

<a id="f04"></a>
## F04 — Shared location and time settings

**Type:** Feature. **Status:** Complete for current device-local entry.

**Outcome/acceptance:** Select a city or manual coordinates and one accepted
timestamp shared by both views. Provide locale-formatted date/time entry,
configuration access, Now, ten-minute steps, Flat's Sun-angle entry and Globe's
sunrise/solar-noon/sunset shortcuts. Missing polar events stay unavailable.
Location time zones and IntlDate/Temporal adaptation remain deferred; they are
not silently added here.
**Evidence:** [Settings execution](../../flat/workspace-comps-execution.md),
[Flat time entry](../../flat/flat-earth-time-input.md),
[solar events/time steps](../../flat/solar-time-controls.md).
**Dependencies:** F01; model-specific shortcuts require their corresponding scene.

<a id="f05"></a>
## F05 — Independent camera and view controls

**Type:** Feature. **Status:** Complete for the selected controls.

**Outcome/acceptance:** Each view owns direction, elevation, FOV, sky mode,
Sun/Polaris focus and an optional directional ribbon. Controls/configuration
target that view and use the compact shared MUI base/context defaults.
**Evidence:** [Current controls](../../flat/README.md),
[celestial focus](../../flat/celestial-focus.md),
[directional ribbon](../../flat/directional-ribbon.md),
[Spherical execution](../../flat/spherical-earth-implementation-execution.md).
**Dependencies:** F01 and the selected scene.

<a id="f06"></a>
## F06 — Optional camera synchronization

**Type:** Feature. **Status:** Complete for direction/requested elevation.

**Outcome/acceptance:** Match now, Follow other view, Link both views and Stop
syncing work through scoped registered receivers. Notifications drive button
selection. Mixed/same-type views support overlap, no feedback echoes and exact
lifetime cleanup. FOV remains independent; debounce/richer errors are deferred.
**Evidence:** [Sync contract](../../flat/sync-window-design.md),
[UI execution](../../flat/camera-sync-ui-plan.md#m2-and-final-report).
**Dependencies:** F01, F05 and participating scene instances.

<a id="f07"></a>
## F07 — Animation playback and supported update cadence

**Type:** Feature/cadence acceptance. **Status:** Partial.

**Outcome/acceptance:** Define the supported continuous or discrete Sun/time
update and cache-swap policy, external clock/configuration ingress and location
changes during playback. Geometry owns time/location interpretation and every
source/receiver transform. Provide the selected user playback controls and
verify sustained operation for both source/geometry families. No route editor
or additional location-animation UI is selected by this goal.
**Evidence/remaining:** The [shared animation-loop service](../../../../src/flat/services/animation-loop.js)
supports fixed/live solar and sidereal playback; retained scene updates exist.
User playback controls, selected cadence and end-to-end acceptance remain open.
Discrete selectors and ten-minute steps do not establish animation acceptance.
**Dependencies:** T01/T02 enable playback; final acceptance uses T03, T07 and T09.

<a id="f08"></a>
## F08 — Scene objects and content selection

**Type:** Feature. **Status:** Open: required for MVP; content options remain
under investigation.

**Outcome:** Display scene objects of some type and provide a way to choose
the available scene content. Some scene-object content is required for MVP.
The chooser's presentation and placement remain open. Whether selection is
shared or per view, and its applicability to each Earth mode, remain undecided.

The owner specified the following choices in **increasing complexity and
decreasing priority**:

| Priority | Content option | Requested scope |
| --- | --- | --- |
| 1 — Highest | Boxes | Some boxes placed in different locations. |
| 2 | Generated terrain | Procedurally generated terrain. |
| 3 — Lowest | Actual geographic data and satellite imagery | A geographic-data source combined with satellite imagery, supporting three levels of detail: texture, low-resolution terrain and higher-resolution terrain. |

These are options to investigate, not mandatory implementation phases. No provider,
terrain-generation method, data resolution, LOD switching policy or chooser UI
has been selected. MVP requires at least one selected scene-content option;
it does not require all three. This requirement does not itself authorize
implementation.

**Acceptance/remaining:** Investigate and select the included content option(s)
and chooser behavior, then implement and verify at least one selected option
in the supported scene mode(s). Mode applicability and detailed acceptance
remain to be decided. Preserve the priority order above; more complex options
may remain deferred without waiving the requirement for some scene objects.
**Investigation approach:** When ready, open a contained experiment through
the repository `start-experiment` skill to investigate the scene-content options,
using the existing terrain-source notes as starting material. The experiment
has not been opened; this note records future intent only.
**Evidence:** Owner request on 2026-11-09; no implementation or verification is
claimed for this goal.
**Existing research:** The earlier `Flat Terrain Data Options` note is preserved
in `C:/dev/poly-gc-react/archives/flat-research-source-2026-08-25.zip`, entry
`agents/topics/apps/flat/terrain-data-options.md` (inspected read-only).
Its candidate records also survive in the
[retained discovery catalog](../../../../references/catalog-inputs/r0-second-pass.json),
`SOURCE-EXT-000120` through `SOURCE-EXT-000126`. The historical note favored
Mapzen Terrarium tiles for a first local height-grid prototype, Copernicus DEM
for later global elevation data, and USGS 3DEP for a U.S. detail upgrade; it also
listed NASADEM/SRTM, ETOPO, GEBCO and Natural Earth. These are research leads,
not newly selected providers. The note focuses on elevation and coarse map
context; it does not select satellite imagery or define the requested three
LOD levels. Current availability and terms have not been rechecked here.
**Dependencies:** F01 and the participating F02/F03 scene integrations. If
external geographic/imagery data is selected, its source, distribution and
performance requirements must be reconciled with T04, T09 and T13.

<a id="t01"></a>
## T01 — Retained time and location updates

**Type:** Technical capability. **Status:** Complete for supported compatible updates.

**Outcome/acceptance:** Both families update through the Algorithm32 facade using
selected cache transforms or equivalent reusable parameterization. Compatible
ticks retain facade, scene, GPU backend, compiled programs and valid cache
resources rather than replacing the complete set. Genuine rebuild boundaries
remain explicit. This status promises no arbitrary playback rate.
**Evidence:** [Flat retained updates](../../flat/control-update-optimization-execution.md),
[owned-content cleanup](../../flat/owned-content-cleanup-execution.md),
[Spherical resource measurements](../../flat/spherical-earth-implementation-execution.md#timings-and-resources).
Independent rebuild/cadence acceptance remains T03/F07/T09.
**Dependencies:** Corresponding F02/F03 runtime integrations.

<a id="t02"></a>
## T02 — Atomic publication and recoverable updates

**Type:** Technical capability. **Status:** Complete for implemented update paths.

**Outcome/acceptance:** Coherently publish geometry, cache bindings, endpoint
lighting, applicable shadows and displayed observation. Coalesce rapid input,
invalidate superseded preparation as required, retain final latest intent and
preserve the previous published state on failure. Expose requested versus
rendered observations; retired work cannot affect replacement view lifetimes.
**Evidence:** [Flat recovery](../../flat/control-update-optimization-execution.md),
[Spherical lifetime/failure checks](../../flat/spherical-earth-implementation-execution.md#deployment-failure-and-lifetime-evidence),
[measured-light rollback](../../flat/ground-lighting.md). Completed intermediate
time frames are accepted progress; they must not overwrite newer accepted
intent. Exact-release regression/cadence acceptance remains T07/F07/T10.
**Dependencies:** T01 and corresponding scene integrations.

<a id="t03"></a>
## T03 — Independent rebuild equivalence

**Type:** Numerical acceptance. **Status:** Partial.

**Outcome/acceptance:** Compare transformed/reused results against independent
full rebuilds for both families across representative locations, times,
elevations, azimuths and near-horizon cases. Declare tolerances beforehand;
retain exact inputs, source identities, numerical results and limitations.
**Evidence/remaining:** T01's Flat optimization and Spherical integration reports
provide bounded comparisons. Complete current-MVP rebuild-oracle acceptance
across the specified domain is not recorded as closed. Matching appearance or
a previous host alone does not replace it.
**Dependencies:** T01 and independently runnable rebuild/reference paths.

<a id="t04"></a>
## T04 — Source and import provenance

**Type:** Technical acceptance. **Status:** Open.

**Outcome/acceptance:** Complete imported-source revision, file, fixture, test,
hash and standalone-parity manifests. Retain no production runtime dependency
on research implementation or an external source repository. Preserve exact
implementation/evidence identities for the selected package.
**Evidence/remaining:** Existing engine/release records provide inputs; complete
selected-build closure is outstanding. The [implementation owner](../../production-algorithm32/architecture-contracts/production-implementation-plan.md)
retains originating obligations. Broader research authority is T11/T12.
**Dependencies:** Identification of the production package/source revision.

<a id="t05"></a>
## T05 — Direct-40 reference reporting and current fixtures

**Type:** Reference/fixture acceptance. **Status:** Open.

**Outcome/acceptance:** Complete direct-40 CPU-reference reporting with CPU/GPU
provenance distinct. Regenerate the native-N4 WebGL fixture made stale by
reflected-68 promotion. Coordinate the source-fallback inventory with T06.
Preserve immutable historical evidence and its actual identities.
**Evidence/remaining:** The [qualification owner](../../production-algorithm32/qualification/production-implementation-plan.md)
retains these residual obligations; selected-MVP closure is not established.
Do not relabel an old result as a newly reproduced reference.
**Dependencies:** Relevant T04 identities; T06 for fallback-inventory reconciliation.

<a id="t06"></a>
## T06 — Single production rendering strategy

**Type:** Technical audit. **Status:** Open.

**Outcome/acceptance:** Verify that source-owned GPU cache/runtime sampling is
the sole production strategy. Retain the independent CPU oracle and fixtures;
remove obsolete production sampler fields, aliases, fallback readers,
translation bridges and old/new switches. Complete the source-fallback
inventory and distinguish any genuine, still-required operational fallback.
**Evidence/remaining:** Ownership/cleanup records are inputs, not a completed
selected-build inventory. The full audit and resulting repairs remain open;
recent performance improvement alone does not close this goal.
**Dependencies:** Declared production-package scope and relevant T04 manifest.

<a id="t07"></a>
## T07 — Numerical boundary and lifecycle coverage

**Type:** Technical verification. **Status:** Partial.

**Outcome/acceptance:** Complete CPU/GPU ray parity, former-altitude-boundary
continuity, lifecycle, invalidation, dome-sanity and rebuild-boundary coverage
for the standalone engine and supported app. Include CPU/browser, coalescing,
latest-intent, failure-preservation and resource-lifetime acceptance relevant
to compatible time/location updates.
**Evidence/remaining:** Flat/Spherical/shared-service reports cover many real
cases. Complete production numerical/boundary coverage is not recorded as
closed. The [qualification owner](../../production-algorithm32/qualification/README.md)
retains detailed inputs; evidence keeps its original scope/source identity.
**Dependencies:** Applicable runtime implementations and reference fixtures.

<a id="t08"></a>
## T08 — Production types, documentation and implementation citations

**Type:** Technical acceptance. **Status:** Partial.

**Outcome/acceptance:** Clear the production package's applicable JSDoc and
static-type baseline and complete implementation-side source, fixture and
reference citations under destination-folder standards and owner overrides.
**Evidence/remaining:** Current Flat type checks and targeted authored-code checks
pass. The [public model explanation](../../../../README.md) links Sun/star/light
equations to CPU/shader code. Neither closes the full Algorithm32 baseline nor
T11/T12 research authority. Remaining package-wide obligations need disposition.
**Dependencies:** Declared package scope and relevant T04 identities.

<a id="t09"></a>
## T09 — Supported hardware, performance and resource acceptance

**Type:** Performance/resource acceptance. **Status:** Partial.

**Outcome/acceptance:** Identify supported hardware/settings and declare release
budgets before judging readiness. Measure cold/rebuild time, peak/resident
memory, frame/lookup cost and staged-build responsiveness. Verify resource
retention and supported animation cadence for both families and selected
one/two-view cases. Separate measurements from estimates.
**Evidence/remaining:** Existing release/app reports contain Windows/Chrome/
RTX 2060 timings, retained-resource counts and memory estimates. They do not
establish an unspecified broader matrix or final release budgets. Select the
matrix and close missing measurements. Release acceptance does not introduce
administrative vetoes on owner-directed updates; repository operational
restrictions still govern executable limits.
**Dependencies:** Runtime implementations and candidate cadence/settings from F07.

<a id="t10"></a>
## T10 — Exact-build release qualification

**Type:** Release acceptance. **Status:** Open.

**Outcome/acceptance:** Identify the exact MVP engine/app build and run the
complete production verification ladder: standalone dependencies, conformance
and lifecycle; sealed native-15/direct-40 reproduction; official B1/B2/B3 scoring
and figures; complete evidence identities; and accepted hardware/resource
results. Record resulting acceptance.
**Evidence/remaining:** The [engineering release checklist](../release/color-reset-production-qualification.md#release-checklist)
and [closeout record](../release/color-star-cache-closeout-plan.md) preserve
earlier results. C1 remains owned/accepted by its independent benchmark plan.
T10 consumes that evidence and repeats the required ladder for the exact MVP
build; it does not reopen, replace or relabel C1. Current app checks are useful
but do not constitute the complete release run.
**Dependencies:** T03–T09 and selected F07 cadence acceptance.

<a id="t11"></a>
## T11 — Third-party scientific source authority

**Type:** Research authority. **Status:** Open.

**Outcome/acceptance:** Close every applicable `SRC-CR-001–012` row through
canonical authority, exact locators and consumer citations, or explicitly
remove its dependent claim. Resolve payload identities, provenance and
transformations. Preserve uncertainty, mismatches, qualitative-only limits,
adverse results and non-claims; implementation/appearance is not independent
scientific authority.
**Evidence/remaining:** The [Color Reset Research Register](../../../../references/followup.md#color-reset-research-register)
is the detailed ledger. Update bibliography, working facts, retained-payload
records, production consumers and that register together as each row closes.
Source authority does not itself grant redistribution rights.
**Dependencies:** Per-row dependencies in the register; no blanket phase prerequisite.

<a id="t12"></a>
## T12 — First-party official experiment authority

**Type:** Research authority. **Status:** Open.

**Outcome/acceptance:** Close every applicable `EXP-CR-001–012` row by promoting
each still-required result into an official standalone experiment under the
[official-experiment policy](../../../../references/citation-and-retention-policy.md#official-experiments),
or explicitly remove its dependent claim. Contained runs alone do not establish
official authority. Preserve negative evidence and every original claim limit.
**Evidence/remaining:** The [research register](../../../../references/followup.md#missing-first-party-official-experiment-authority)
owns exact row work. Update the official experiment register, retained payloads,
applicable bibliography/working facts, production citations and research register
together. Do not relabel earlier runs or modify protected evidence.
**Dependencies:** Each experiment's actual T11/component authority dependencies.

<a id="t13"></a>
## T13 — Distribution clearance for shipped data

**Type:** Distribution acceptance. **Status:** Open.

**Outcome/acceptance:** Record license/redistribution clearance for BSC, Pickles,
Johnson/SVO, Vega, CIE and every derived production payload selected for public
distribution. If clearance cannot be established, exclude the payload and remove
every dependent public claim from the distributable MVP.
**Evidence/remaining:** The [deployment inventory](../release/color-reset-production-qualification.md#deployment-inventory)
and [source register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations)
retain detailed records. Affected bytes remain local-only and excluded from
public artifacts until cleared. Engineering qualification, source authority
and experiment acceptance do not confer distribution rights.
**Dependencies:** Declared distribution inventory and source/derivation records.

## Completion and claim boundaries

Completed feature goals and T01/T02 record functional progress. Open acceptance
goals remain requirements; implementation does not silently close independent
numerical, release, research or distribution obligations. An unrelated open
goal does not erase an independently completed capability.

The existing engineering release retains only its recorded qualification.
Until T11/T12 close or dependent claims are explicitly removed, unresolved
Color Reset rows cannot support final scientific/numerical authority claims.
Until T13 closes for the shipped inventory, no uncleared payload gains public
redistribution clearance. Scheduling these goals outside the compiler/benchmark
critical path does not remove them from MVP scope.

## Mapping from the former grouped requirements

M1–M3 below preserve earlier references and obligation traceability. They are
historical grouping labels, not current phases or duplicate status owners.

<a id="m1--compatible-time-and-location-animation"></a>
### Former M1 — Compatible time and location animation

Replaced by [F07](#f07), [T01](#t01), [T02](#t02), [T03](#t03) and relevant
[T07](#t07), [T09](#t09), [T10](#t10) acceptance. Clock/configuration ingress,
geometry-owned transforms, reuse, independent rebuild parity, atomic
publication, latest intent, failure preservation, requested/rendered time,
CPU/browser/lifecycle/resource and supported-cadence obligations all remain.

<a id="m2--algorithm32-production-hardening"></a>
### Former M2 — Algorithm32 production hardening

Replaced by [T04](#t04) through [T10](#t10). This retains source/import manifests,
standalone parity/dependencies, direct-40 reporting, current native-N4 fixtures,
fallback inventory/single-strategy audit, numerical/boundary/lifecycle coverage,
types/JSDoc, implementation citations, hardware/resource budgets and exact-build
reproduction/official scoring acceptance.

<a id="m3--color-reset-scientific-authority"></a>
### Former M3 — Color Reset scientific authority

Replaced by [T11](#t11), [T12](#t12), [T13](#t13). Release-closeout C4 maps to
T11/T12; C5 maps to T13. All 12 source and 12 experiment identities, coordinated
canonical updates, original uncertainties/adverse evidence, explicit
claim-removal alternatives and local-only/public-distribution restrictions
remain. No requirement was waived by separating these goals.
