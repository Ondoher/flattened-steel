# Local-Sun Cache Reuse Experiment Design

## Objective And Acceptance

Develop and qualify a Euclidean source-centered shell layout for the local-Sun
multiple-scattering cache over a uniform flat atmosphere and ground. Omit
nonintersecting inner bands from storage and construction from the first
prototype. Establish layout accuracy and measured resource benefit separately
from horizontal reuse, in-app rebuilding and coherent lighting. Finish with
the requested identical-scene full-orbit recording.
The [plan](plan.md) owns the complete workload and acceptance sequence.

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

The final film's setup-equality requirement, source-relative camera score,
unchanged shared shadows and measured-light interpolation belong to
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
production code. Independent P3-P5 execution is selected. The
[execution record](p3-execution.md) owns the stable radius-excess representation,
fixed source-relative amplitude bounds, transport and angular diagnosis, and
any explicitly revised numerical policy. Physical and source-review gates
remain required; numerical repairs do not relax tolerances.

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

Heavy native-reference and browser workloads launch through the experiment's
`run-resource-bounded.js`. It exclusively owns one heavy child tree, checks
summed private and working-set memory every five seconds, and stops that owned
tree if either exceeds 8 GiB, machine free physical memory falls below 8 GiB,
telemetry becomes unavailable, or the declared duration expires. The default
duration is 45 minutes; a measured bounded reference may declare up to 90 minutes.
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
