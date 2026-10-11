# Local-Sun Cache Reuse Experiment Design

## Objective And Acceptance

Develop and qualify a Euclidean source-centered shell layout for the local-Sun
multiple-scattering cache over a uniform flat atmosphere and ground. Omit
nonintersecting inner bands from storage and construction from the first
prototype. Establish layout accuracy and measured resource benefit separately
from horizontal reuse, in-app rebuilding and coherent lighting. Finish with
the requested creative full-orbit recording.
The [plan](plan.md) owns the complete workload and acceptance sequence.

On 2026-10-09 the owner changed the acceptance basis to model defensibility:
trace demonstrated distant/spherical methods, isolate flat/local assumptions,
and qualify the new numerical representation within its declared domain.
This is conditional engineering support for a hypothetical model, not empirical
validation of a flat Earth or local Sun. The owner subsequently selected P3-A0
analysis, now complete in the [abstraction inventory](abstraction-inventory.md).
The [status](status.md) owns the delivered P0-P5, P5-Celestial and selected
follow-up dispositions and links their source-review authority. The owner has
selected creative P6 film work under the updated plan.

## Assumptions And Abstraction Boundaries

This section owns the model's assumptions and conceptual contracts. The completed
P3-A0 [abstraction inventory](abstraction-inventory.md) owns their source-bound
mathematical defense, actual recipe limits and focused verification gaps.
Completed implementation gates and deferred qualification limits are recorded
in [status](status.md) and the owning phase records.
The owner accepts mathematical defensibility as the present requirement for
interpolation/integration. Targeted numerical error estimation is deferred;
the [evidence policy](reference-method.md#current-depth-of-numerical-defense)
owns its separation from required ordinary correctness and engineering checks.
The [current evidence policy](reference-method.md#current-evidence-policy)
owns how to support claims. These boundaries describe responsibilities to
inspect in existing code, not a requirement to create a new framework.

| ID  | Assumption or approximation                                                                        | Responsibility                                                                             | Required defense and limit                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Flat physical ground and atmosphere slab; density depends on altitude, not horizontal position.    | Geometry supplies altitude, intersections and ray endpoints.                               | Derive plane/slab paths and coordinate transforms. Spherical twilight and planet-shadow evidence does not transfer to flat geometry.                                                                                                 |
| A2  | Isotropic local emission with specified source height, radius, spectrum and power.                 | Source supplies calibrated incident spectra, directions and visible disk facts.            | State units/calibration distance, inverse-square behavior, source-distance domain and finite-disk versus center-ray approximation. Visible disk correctness does not prove irradiance correctness.                                   |
| A3  | Selected scattering/extinction and phase laws apply to the hypothetical medium.                    | Shared physics supplies coefficients, phase factors, attenuation and recurrence.           | Trace exact equations, constants and compatible distant/spherical evidence. Profile differences, including ozone and wavelength basis, must be explicit. Shared mathematics does not automatically transfer numerical error bounds.  |
| A4  | An explicit black or horizontally uniform reflective physical ground.                              | Boundary transport supplies reflection, incidence weighting and return-path contributions. | Pin the law/albedo and distinguish black, zero-reflectance and reflective evidence. Historical reflective qualification gaps remain visible. Scene terrain/materials are separate inputs.                                            |
| A5  | Stationary scalar spectral transport with a declared maximum scattering order.                     | Order evaluation owns pure contributions and accumulation.                                 | Inventory inherited physical omissions and order truncation. Check pure/cumulative accounting; quantitative order sensitivity is deferred. Make no all-orders claim.                                                                 |
| A6  | Finite coverage, quadrature, path cutoffs and precision approximate the model.                     | Numerical evaluation owns these policies, their rationale and limitations.                 | The cylinder and any outside-vacuum treatment are truncation assumptions, not consequences of flat geometry. Defend and disclose approximations; quantitative error bounds are deferred. Never hide unsupported queries by clamping. |
| A7  | Euclidean radius, altitude and outgoing direction represent the source-relative field under A1-A4. | Cache representation owns samples, normalization, interpolation and compact addressing.    | Derive the coordinate reduction; check axis, boundaries and off-grid support. Distinguish source-amplitude bands from field samples. Layout changes must not alter physical source or scattering equations.                          |
| A8  | Compatible horizontal rigid motion preserves this model.                                           | Placement owns transforms, admission and invalidation.                                     | Compare fresh/reused fields and rays. Rotate vectors as well as positions. Height changes, nonuniform medium/boundary and domain exits require rebuild or rejection.                                                                 |
| A9  | Display response, receiver adaptation and scene shadows are consumer approximations.               | Presentation/publication owns one coherent frame state.                                    | Separate spectra from pixels. P3-P5 use exact-state lighting; P6 alone retains the agreed film smoothing and shared-shadow recipe. Images do not establish independent physical truth.                                               |

For each assumption record the selected value/range, mathematical owner,
dependencies, implementation identity, supporting evidence and limitation.
Unknown support stays open rather than being inferred from appearance.

The abstraction inventory also treats preserved `sky-accuracy-dials`
cancellation findings as informative context, especially for ozone and
attenuation. The [reference policy](reference-method.md#informative-cancellation-and-ozone-context)
owns that evidence boundary. No ozone policy change or correction campaign is
selected by this planning task.

The defensible conceptual contracts are:

- Geometry returns physical coordinates, directions and valid path intervals
  in explicit units; it does not select phase laws, power or texture addresses.
- Source and boundary operations supply spectral illumination and boundary
  contributions at physical points; they do not select cache resolution or
  display exposure.
- Shared transport preserves attenuation, phase-weighted scattering and
  recurrence with those inputs. Pure and cumulative orders retain distinct
  meanings; presentation lighting cannot feed scattering recurrence.
- Numerical evaluation applies named quadrature, precision, order and domain
  controls. A numerical policy change is distinguished from a physical change.
- Cache representation stores/reconstructs fields, restoring any reversible
  normalization to the physical quantity. Empty-band omission removes storage
  and construction work, not source facts, support or required ray propagation.
- Placement/publication binds compatible source, field, transform, receiver
  and shadow facts; presentation consumes the resulting state.

The mathematical goal is to preserve the inherited transport/scattering laws
and extrapolate their consequences with changed geometry/source/boundary
inputs. Any changed law or additional approximation must be identified and
defended explicitly, rather than described as a mere geometry substitution.
Inherited accuracy supports compatible methods within their demonstrated
regime, not a global flat/local accuracy percentage.

## Selected Physical And Construction Decisions

Keep an isotropic finite source, altitude-dependent atmosphere, homogeneous
physical ground and scalar spectral quantities. Horizontal translation and
rotation about the vertical axis are physical symmetry candidates; changing
source height requires rebuilding in the app. No extra independent Sun-angle
dimension or precomputed height inventory is selected.

P0-P2 and the [P2 continuation](plan.md#p2-corrective-continuation) remain
comparison evidence for the inherited horizontal-distance grid. P3 now owns
the new shell layout, integrated empty-band omission and its fresh-build and
movement proofs. The old choice between changing only source shell bounds and
rebuilding placement-dependent J1 no longer governs future development.
Keep the original spatial reconstruction as a control; the candidate needs an
explicit shell-aware stencil and compact address mapping. Preserve scalar
R32F, current angular reconstruction, spectral/order controls and fused GPU
transport unless a separately recorded decision changes them. Cubic spatial
interpolation, value compression and paging remain separate follow-ups.

Separate canonical field identity from live source placement only after the
candidate proves placement independence. Publish source facts, fields,
transform, receiver spectra, visible source and shadow direction as one
compatible state. Replacement builds preserve active resources until compatible
publication; failure, cancellation and supersession are explicit proof cases.

The P4 prototype retains the ordinary six-box scene and six per-object shadow
maps. During replacement it displays an exact GPU snapshot of the last complete
frame and retires that frame's lazy shadow-map storage, keeping its cache,
materials and lighting facts leased. Failed staging can resume that old scene;
successful publication releases the old lease before allocating new shadow maps.
This storage lifetime policy preserves shadow settings and displayed pixels.
One transferred host phase matrix is shared outside individual cache ownership;
transient backend copies and GPU phase textures have separate lifetimes.
Admission bounds and observed allocations both remain subject to the unchanged
combined payload limit. Diagnostic field readbacks are identified separately
from application-persistent payload, never silently included in a memory claim.

The final film's new scene recipe, source-relative camera score,
shared shadows and measured-light interpolation belong to
[P6](plan.md#p6--reproduce-the-local-sun-full-orbit-film).
P1-P5 qualification uses the exact state without that presentation interpolation.
Original visible terrain and the new flat physical ground are separate inputs;
incompatible endpoint coverage must be resolved without silently changing either.

## Preferred Spatial Reference

The owner recast the experiment around Euclidean distance from the Sun as its
spatial reference. Source-centered hollow shell bands use
`r = sqrt(rho^2 + (z - hSun)^2)`, where `rho` is horizontal distance from the
Sun's vertical axis. Altitude remains a candidate second coordinate because
atmospheric density and the ground boundary depend on it.

The P2 control inherited the production scattering grid indexed by `rho` and
altitude. Its separate source-strength shell table already uses Euclidean
distance. Keeping that grid isolated the reuse investigation; it did not
establish that horizontal distance is the better reference for a shell layout.
The original historical rationale has not been established by the consulted
code and plan. Interpolation and boundary handling are possible tradeoffs to
measure, rather than an attributed reason for that earlier decision.

Apply the reference to all multiple-scattering spatial fields, retaining
angular, spectral and scattering-order controls and transport between shells.
The source table's 2,048 bands do not require 2,048 full scattering layers:
source-amplitude bands and field-resolution nodes are distinct decisions.
Exact sampling and memory savings remain unqualified.

The developmental stencil holds Euclidean radius across altitude rows. Near
the axis or curved outer boundary, positive fans connect admitted support while
preserving the query's radius and altitude moments. Historical layouts without
an explicit interpolation identity retain their horizontal-row control rule.
CPU moment proofs do not establish GPU precision or physical-field accuracy.
The analytic interpolation factor is a separately identified numerical policy:
direct-attenuated extinction normalization and geometric-only extinction
normalization are developmental alternatives. Neither changes stored physical
J values, source equations or acceptance limits. The execution record owns
their evidence and selection; no accepted policy is frozen yet.

Build conservative atmosphere-intersection admission and compact storage into
the first candidate. Bands proven empty receive neither scattering-sample
allocation nor scattering construction work. Keep physical band identities
separate from compact storage addresses; retain intersecting, tangent and
uncertain bands, and preserve complete interpolation support. For an atmosphere
slab `0 <= z <= H`, a shell whose outer radius is strictly below the source's
distance to that slab cannot intersect it. Finite coverage and numerical
tolerances also belong to the proof. Changing height invalidates admission and
rebuilds the layout.

Omitting empty scattering bands must not omit required source facts or ray
transport through vacuum. Specify boundary/virtual support and cross-band
stencils explicitly; never redirect an omitted query to an unrelated occupied
slot or silently clamp outside coverage. Compare compact and equivalent
unculled candidate execution in bounded proof runs before acceptance. The
plan owns these integrated gates, replacing the deferred pre-recording retrofit.
This recast changes the development plan, not immutable P2 evidence or
production code. The [status](status.md) owns the delivered P3-P5 disposition;
the selected creative P6 work has its own recipe. The
[execution record](p3-execution.md) owns the stable radius-excess representation,
fixed source-relative amplitude bounds, transport and angular diagnosis, and
any explicitly revised numerical policy. Physical and source-review gates
remain required. The evidence revision does not retroactively pass old gates
or authorize looser numerical tolerances.

## Isolation And Input Authority

Authored source, adapters, fixture derivatives and proof runners remain below
`experiments/local-sun-cache-reuse/`. Owning documentation remains in this topic.
All generated output belongs below `tmp/experiments/local-sun-cache-reuse/`.
Review-service mechanical artifacts use the standing ignored
`.codex-tmp/review-standards/` and `.codex-tmp/mcp-workflows/` infrastructure;
they are not numerical experiment runs.

Production, existing experiment source/results, archives and the relocated
`D:/flattened-steel` evidence are read-only inputs. Never invoke a parent capture
runner that writes into its original output root. Adapt renderer and recording
collaborators inside this experiment instead. A successful result does not
authorize production imports of experimental code or promotion.

Every reused input is pinned by bytes/schema, physical/configuration identity,
implementation closure and provenance. Generated parent evidence may be reused
as input, but every derivative belongs to a new run and preserves the complete
parent/operation/parameter/tool/result chain. Historical Star evidence stays
immutable and does not become independent authority for flat-model accuracy.

## Output And Run Rules

- The same unnumbered slug `local-sun-cache-reuse` identifies source, topic and
  output roots. The startup skill owns this folder identity.
- Derive repository and declared roots from a repository marker relative to
  checked-in source, never the process working directory. Real-path-check read
  and write boundaries; reject symlinks, junctions, reparse aliases and escapes.
- Allocate every evidence-bearing attempt under
  `runs/<five-digit-sequence>-<kebab-name>/`, beginning at `00000`. The name
  after the sequence is at most 16 characters. Reject malformed prefixed entries;
  use one more than the largest existing sequence, never fill gaps or reopen a run.
- Record commands, source/dependency/tool identities, hardware/backend facts,
  configurations, parent artifact identities, derivation operation/equations and
  resulting artifact hashes. Diagnostic and selected-profile evidence are distinct.
- Close and hash artifacts before publishing the terminal manifest with state
  `accepted`, `rejected`, `failed` or `interrupted`. A verifier reads without
  modifying the sealed run. Corrections and retries allocate a new run.
- Numerical qualification uses focused self-verifying proof runners. No experiment
  unit-test tree, test-framework dependency or suite is created.
- Retain only artifacts that explain or reproduce the result: images, numerical
  data, source/build identities, configurations, browser/tool/GPU identities,
  launch flags, diagnostics and derivation/progress records. Fresh browser profiles
  are disposable execution state: remove them after browser closure and before
  sealing. Present images directly; no image-viewer HTML is needed. Previously
  sealed runs retain their original inventories and hashes.

## Monitorable Progress

### Host Resource Controls

The current `run-resource-bounded.js` uses the qualified JavaScript/CIM collector;
historical compiled monitoring remains read-only evidence and has no execution
authorization. The wrapper exclusively owns one heavy child tree and checks
summed private and working-set memory every five seconds, stopping that owned
tree if either exceeds 8 GiB, machine free physical memory falls below the
default 8 GiB reserve,
telemetry becomes unavailable, or the declared duration expires. Selected
execution uses a ten-minute job limit. The wrapper's historical 45/90-minute
ceilings do not authorize longer jobs or automatic diagnostic escalation.
The [current plan](plan.md#remaining-work-and-execution-controls) owns these
execution limits. Earlier P5 and P5-Celestial 6 GiB reserve exceptions ended
with their selected phases; the default 8 GiB reserve applies, including to
ordinary later work. The owner's new P6-only AFK resource selection is recorded
in the [plan](plan.md#execution-budget-and-review-milestone); it supersedes these
defaults for that phase and expires when the P6 work ends.
These are sampled stop thresholds, not kernel allocation caps or physical GPU
memory claims. Child Node heaps are limited to 2 GiB. Lightweight derivation and
review bookkeeping may proceed while the sole heavy job runs; their inputs and
heaps stay bounded. Do not launch another reference/browser workload alongside it.
Heavy entry points require the wrapper's inherited capability to match the
checked exclusive lock and a live wrapper process before computation. This
prevents accidental direct launches; it is not a hostile-process security boundary.

Parent inventory verification and final run sealing stream file hashes in 1 MiB
chunks. Per-frame GL snapshots retain counts and current allocations; eventCount
references a prefix of the final complete history, retained once. Preserve old
sealed inventories and incomplete interrupted outputs unchanged. Resource limits
govern host execution in addition to the separate unchanged application payload
and performance gates.

Every operation expected to exceed one minute writes append-only UTF-8 events
to its run's `progress.jsonl` at start, every phase transition, at least every
30 seconds while active, and at termination. Flush each event so a separate
process can monitor it. Each event contains `timestamp`, `phase` and `message`,
with `completed`/`total` when countable and a terminal `state` on completion.
Do not include credentials or unnecessary personal data. Console output is
supplemental; it does not replace the progress file.

## Tooling And Launch Boundary

Use JavaScript scripts with existing runtimes; Python may support suitable
tasks. Do not compile helpers or package scripts into executable binaries.
Any exception requires explicit owner permission for its specific scope before
proceeding. No C# exception is approved. Preserve existing compiled-tool source
and results as historical evidence; their launch paths are not eligible for
resumed execution. The owner's Norton exclusion is not language authorization.

Use existing repository npm dependencies: Node/TypeScript, Three, Puppeteer,
Rollup and its plugins, PNG tools and Mediabunny. No dependency installation or
root package change is needed for setup. Local ambient types belong in the
experiment's `types.d.ts`; `jsconfig.json` enables `allowJs`, `checkJs`, `noEmit`
and excludes dependency source from the local contract surface.

From the repository root, run the setup CPU/type check:

```text
npx --no-install tsc -p experiments/local-sun-cache-reuse/jsconfig.json
```

Set `ALGORITHM32_THE_HOURS_EVIDENCE_ROOT` to the absolute read-only relocated
parent root, currently `D:/flattened-steel`, then run the CPU/browser probe:

```text
node experiments/local-sun-cache-reuse/inspect-environment.js
```

The probe authenticates the original film trace, inspects installed tools and
launches a browser with a new run-owned profile. On Windows it uses installed
Chrome with D3D11; `LOCAL_SUN_CACHE_CHROME_EXECUTABLE` selects an explicit
alternative. Each attempt receives a new run and a closed manifest. Capability
facts do not qualify a GPU cache, throughput, 4K encoding or physical accuracy.
Numerical CPU/GPU launch commands will be added with the P1 harness; the old
production capture command must not supply that missing implementation.

## Review And Lifecycle

The repository contained-experiment policy requires both local type checking
and canonical `types.md` review by `contracts-reviewer`. Applicable source review,
primary/audit independence and evidence validation follow `review-standards`.
Record each coherent unit's baseline before implementation; refresh context
after this topic transition. No phase is reported complete without its required
validated evidence. The status records restoration provenance but does not
select standards; the folder manifest and overlay remain authoritative.

Use [end-experiment](../../../../../.agents/skills/end-experiment/SKILL.md) to
end or suspend this lane. Preserve all evidence and the permanent folder mapping;
restore only temporary standards whose lifetime has ended. Suspension records
resume inputs and open gates and requires a later owner selection before execution.
