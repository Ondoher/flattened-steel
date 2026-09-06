# Topic Consolidation And Allocation Plan

Status: document restructuring complete on 2026-09-06. The owner approved the
five-topic scaffold, all allocation recommendations, and the separate standards
reconciliation. The whole-repository checkpoint scope is approved, including
the large experimental files verified as already committed at their old paths.

The [file ledger](topic-file-disposition.md), [section ledger](topic-section-disposition.md),
[open-work owners](open-work-ownership.md), and
[verified archive index](topic-migration-archive-index.md) record execution.
The original proposal is retained in the readable archive; the allocation
rationale below remains the approved migration design, not unfinished work.

## Objective

Organize context by the kind of work being performed:

- `production-algorithm32`
- `poc-experiments`
- `poc-flat32`
- `production-app`
- `pure-research`

A focus area is a smaller work boundary inside one primary topic. Existing
directories do not determine destination. Individual sections of one document
can have different destinations, and completed work can become historical
while its selected contract remains current.

The migration produces short entries, focused current documents, an explicit
open-work inventory, and discoverable archives. It does not consolidate all
existing prose into five enormous documents.

## Standards Transition Boundary

The supplied folder-based workflow has been applied through the
[accepted reconciliation](../standards/reconciliation.md). Topics guide work
context only. Nine standards sets and 26 folder assignments select the same
11 canonical concerns, with three local ADD entries carrying four scientific
requirements. Assignment-only setters are promoted to canonical code conventions.

The operational run contract now lives under `experiments/extraterrestrial/`;
the citation policy lives under `references/`. AGENTS and live consumers link
to those owners. Source/output boundaries and protected evidence are unchanged.
The revised experiment skill cannot recreate topic-based standards controls.

## Inventory Baseline

The inspected tree contains 160 Markdown documents: 106 outside archive
directories and 54 already under directories named `archive`. The allocation
table covers all 106; the protected-history inventory covers all 54. This plan
is a new coordination document and is not included in those baseline counts.

The inventory includes ignored files found through a filesystem traversal;
Git-visible file enumeration alone missed existing archived documentation.
Non-Markdown standards metadata, existing ZIP archives, external reference
registers, source files, and generated artifacts are dependencies, not targets
for topic relocation.

Allocation is based on document status, headings, sampled content, and known
current ownership. Before moving a document, read its full content, inspect
its inbound links, and reconcile contradictory claims with its actual current
owner and evidence. No proposed archive row is permission to discard an
unexamined unresolved item.

## Target Scaffold And Focus Areas

Each primary topic gets one short `README.md`. Focus directories and their
entries are created only when allocated current content exists. The following
codes identify destinations in the allocation table; they are planning labels,
not new runtime or standards identities.

| Code | Proposed focus path below agents/topics/ | Focus question |
| --- | --- | --- |
| E1 | production-algorithm32/architecture-contracts/ | What public engine capabilities, ownership boundaries, and dataflow are implemented? |
| E2 | production-algorithm32/transport-geometry/ | How do atmosphere, ground, spherical/flat geometry, and distant/local sources calculate physical transport? |
| E3 | production-algorithm32/caches/ | How are engine fields constructed, stored, reconstructed, loaded, and optimized? |
| E4 | production-algorithm32/color-celestial/ | How do engine Color, receiver light, visible sources, and stellar presentation compose? |
| E5 | production-algorithm32/execution-profiles/ | How do complete execution configurations propagate and select engine behavior? |
| E6 | production-algorithm32/qualification/ | What proves engine conformance, and what engine implementation is needed to export a benchmark boundary? |
| X1 | poc-experiments/protocols/ | How is a bounded experiment defined, executed, preserved, and considered for promotion? |
| X2 | poc-experiments/engineering-studies/ | Which alternative or mechanism is being measured, and what was accepted, rejected, or left open? |
| X3 | poc-experiments/benchmarks/ | How are independent B-family and other whole-output comparisons executed and scored? |
| F1 | poc-flat32/integration-prototypes/ | What application-level integration is being explored before a product decision? |
| F2 | poc-flat32/appearance-review/ | What exploratory scene, capture, and visual review will help judge a proposed appearance? |
| F3 | poc-flat32/interaction-prototypes/ | Which controls, quality-selection interactions, or workflows are being tried? |
| A1 | production-app/runtime-integration/ | How does the supported application attach the engine, manage state and lifecycle, and serve assets? |
| A2 | production-app/product-behavior/ | Which controls and interaction policies are selected product behavior or explicit product backlog? |
| A3 | production-app/release/ | Which application and coordinated product release gates, deployment inputs, and owner decisions remain? |
| R1 | pure-research/physics-numerics/ | What external or analytical authority supports the physical model and numerical choices? |
| R2 | pure-research/color-vision/ | What supports colorimetry, perception, camera models, adaptation, and appearance premises? |
| R3 | pure-research/sources-provenance/ | What sources, datasets, licenses, and claim registrations are established or missing? |

The new scaffold has 18 candidate focus areas, not 18 mandatory new projects.
Additional engineering studies belong beneath X2 rather than becoming new
primary topics. Small focus areas can remain sections of the primary entry
until they need their own documents.

### Classification Rules For This Migration

Production status follows the work's actual ownership and acceptance, not its
filename. Existing `src/flat32` integration is not reclassified as a POC merely
because the new topic is called `poc-flat32`. This plan moves documentation,
not application source or build boundaries.

Engine implementation and its conformance tests belong to E areas. A production
adapter needed to export B1 data stays in E6; the independent protocol, run,
scorer, and comparative judgment belong to X3. Research owns the supporting
claims and external authorities. These are linked work items, not copies of
one plan.

F2 owns exploratory review methods and candidate observations. A production
appearance acceptance gate remains in A3 even if its review uses the same
capture workflow. Likewise, a user-interface idea can start in F3 without
becoming a selected A2 feature.

Pure research can use analytic derivation and inspect independent evidence.
Controlled executable studies, candidate comparison, and measured proof runs
have X owners. Research conclusions link to those results. Stopped experiments
remain stopped regardless of their new archive location.

F1 has no existing document clearly dedicated to an active standalone
integration prototype. Create a thin entry only if needed to route a selected
task; do not invent prototype work to fill the scaffold.

## Context Loading Contract

The root topic index lists the five kinds of work and their focus areas.
It does not maintain a second status ledger.

At cutover, `active-topic.md` contains the primary topic, selected focus,
current task, canonical focus entry, and exact minimal reload sources.
For example, cache optimization selects `production-algorithm32 / caches`
and loads that focus entry plus the optimization design and current task plan.

A primary entry states its purpose, boundaries, focus routing, and current
work links. A focus entry states current selected behavior, the next action,
open decisions, acceptance limits, and the smallest required documents.

Use an additional design, plan, or evidence index only where it has a distinct
responsibility. Avoid parallel README/status/handoff documents repeating the
same facts. One work item has one substantive owner; coordination entries
link to it.

Topic changes should change work context. They will not be used to choose
folder-based standards once the new workflow is installed.

## Approved Major-Document Split Design

| Existing document | Required division before retiring the original |
| --- | --- |
| algorithm32/production/production-implementation-plan.md | Selected architecture to E1; transport/ground to E2; cache work to E3; Color/celestial work to E4; live Stage 13 to E5/E6; actual app work to A1/A2; release dependencies to A3; proposed measurements to X2/X3; research gaps to R1-R3. Completed stage chronology is archived. |
| algorithm32/cache/cache-design.md | Current engine interface and lifecycle to E1/E3; unselected Flat/local nonlinear-index proposal to X2; application reconfiguration policy to A2; rule prose waits for the standards handoff. |
| algorithm32/cache/solar-zenith-cache-design.md | Current engine numerical/storage contract to E3; application/server resolver contract to A1; completed POC/adoption chronology to archive. A completed design is not retired while it still owns current behavior. |
| extraterrestrial/stage-12-implementation-topic.md | Live run-allocation, derivation, containment, and immutability ownership must be resolved first. AGENTS.md directly links its Immutable Run Records section. Accepted experimental stages can then be archived without breaking that contract. |
| extraterrestrial/stellar-screen-palette-design.md | Current promoted representation to E4; optional palette/index studies to X2; unresolved appearance work to F2/A3 as appropriate; candidate history to archive. |
| Production Color Reset design, plan, qualification, and manifest | Separate engine algorithms E4, engine qualification E6, application choices A1/A2, production appearance/release A3, benchmark execution X3, and research/provenance R2/R3. Preserve P8/P9 and evidence identities. |
| extraterrestrial/camera-controls-* and camera-control-test-inventory.md | Preserve the stopped camera-emulation experiment and mechanical claim limits as history. Extract deferred calibration/source questions to R2/R3. Do not revive D8.3, D9, or later continuation as application backlog. |
| algorithm32/production/flat32-migration-inventory.md | Current supported integration to A1, selected/deferred product behavior to A2, exploratory interaction proposals to F3, completed migration evidence to archive. |
| algorithm32/production/color-star-cache-closeout-plan.md | Keep release coordination at A3. Route substantive engine, experiment, appearance, and research actions to their focused owners while preserving C/D identities and explicit dispositions. |

### Carry Forward Cross-Topic Open Work

The release coordination index retains a link and dependency state for each
existing C/D identity. It does not repeat the detailed work at the destination.

| Existing work | Substantive owner after division |
| --- | --- |
| C1 production B wiring | E6 for engine adapters/export; X3 for the independent benchmark execution. C1.9 remains pending unless a later owner decision changes it. |
| C2/C3 production appearance acceptance | A3 owns the decision; E4/A1 own any resulting implementation; F2 supplies exploratory review context when used. |
| C4 research/official-experiment authority | R3 routes the unchanged canonical reference action ledger; X1/X3 own specific experiment promotion/execution tasks. |
| C5 licensing and redistribution | R3 owns source clearance; A3 links the affected release payload gate. |
| C6 final release rerun | A3 coordinates; engine verification results remain E6-owned. |
| D1/D2 performance and supported hardware | E3/E6 for engine behavior; A3 for the product's supported-target decision. |
| D3 animation and cache switching | A2 owns requested product behavior; E3 and F3 receive explicitly scoped implementation/prototype tasks. |
| D4 lossy cache codec | X2, still decision-pending; the exact-value optimization design remains E3. |
| D5/D6 Flat/local adaptation and appearance | E2/E3 for engine capability; A3 for production acceptance, with X2/F2 only for selected studies/reviews. |
| D7 palette sharing/index width | X2 for a selected comparison; E4 for an accepted production change. |
| D8 Moon/planets | E4 retains the deferred capability; R1/R3 own source prerequisites. |
| D9-D11 pollution, adaptation, optics, materials, and psychophysics | Split the individual questions among E2/E4, X2, R1/R2/R3 only when their intended outcome is known; retain decision-pending status and original identity. |
| Stage 13 Step 3.12 | E5/E6; this current profile-closure work must survive despite older general-topic status. |

`/references/followup.md`, `/references/references.md`,
`/references/algorithm32-working-facts.md`, and
`/references/experiments.md` remain canonical owners at their current paths.
New topics provide routes, not replacement registries.

## Approved Allocation Rationale

Paths below are relative to `agents/topics/`. Codes resolve to the focus paths
above. Each baseline non-archive Markdown document appears exactly once.
These rows preserve the approved allocation rationale; the linked completed
file/section ledgers record the actual destinations. Every former HOLD RULES
row is resolved by the accepted folder-based reconciliation.

- **MOVE:** retain a current focused document, repairing links and stale facts.
- **SPLIT:** assign sections to focused owners; preserve the original snapshot.
- **EXTRACT + ARCHIVE:** retain current decisions/open work, then retire chronology.
- **ARCHIVE:** retire a historical or empty document after dependency checks.
- **REPLACE / REWRITE:** supersede routing or duplicated status with the scaffold.
- **RETIRE POINTER:** remove redundant live navigation only after links resolve;
  retain the original in the migration snapshot.
- **PRESERVE:** retain protected history or its pointer bytes unchanged in the verified local archive.
- **HOLD RULES:** keep the present authority until the new standards workflow
  determines the destination. Compound actions distinguish content from rules.

All original snapshots are retained before editing or relocation. Protected
documents are not rewritten to repair historical links; their archive index
records path mappings.

### algorithm32/cache/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/cache/README.md` | REPLACE | E3 | Replace the broad cache router with the focused cache entry; reconcile stale gate statements. |
| `algorithm32/cache/cache-contract.md` | MOVE | E3 | Retain selected numerical contracts; verify current domains and acceptance limits. |
| `algorithm32/cache/cache-design.md` | SPLIT | E1, E3, X2, A2; archive original | Separate public ownership, cache lifecycle, the proposed nonlinear Flat/local index, and deferred application reconfiguration. Hold standards prose for the rules migration. |
| `algorithm32/cache/distant-sun-solar-zenith-cache-plan.md` | EXTRACT + ARCHIVE | E3, X2 | Retain selected decisions and outstanding claim limits; archive completed P0-P10 execution history. |
| `algorithm32/cache/local-sun-cache-design.md` | PRESERVE | archive index | Protected Star history pointer; index its existing target without moving or rewriting protected material. |
| `algorithm32/cache/outgoing-reconstruction.md` | MOVE | E3 | Keep the selected outgoing stencil, resource boundary, and outstanding qualification. |
| `algorithm32/cache/solar-zenith-cache-design.md` | SPLIT | E3, A1; archive original | Engine cache representation and numerical design go to E3; server resolution and application integration go to A1. Preserve current contract despite completed implementation. |
| `algorithm32/cache/solar-zenith-cache-poc-plan.md` | EXTRACT + ARCHIVE | X2 | Record the rejected/superseded representation and claim limits; archive the completed POC sequence. |
| `algorithm32/cache/spatial-reconstruction.md` | MOVE | E3 | Retain the selected position stencil and its remaining parity boundary. |
| `algorithm32/cache/superseded-alternatives.md` | EXTRACT + ARCHIVE | E3 | Keep a concise rejected-options record with reasons and historical links; archive the old narrative. |

### algorithm32/experiments/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/experiments/README.md` | SPLIT | X1, X3, R1 | Separate experiment execution, benchmark routing, and scientific-authority questions. |
| `algorithm32/experiments/experiment-contract.md` | MOVE | X1 | Retain independence, experiment admission, and evidence boundaries; route actual governance changes through the incoming rules workflow. |
| `algorithm32/experiments/extraterrestrial-promotions.md` | SPLIT | X2, R1, R3 | Experiment proposals remain proposals in X2; source prerequisites and scientific claims have research owners. |
| `algorithm32/experiments/flat-world-atmosphere-boundary-decision.md` | PRESERVE | archive index | Existing protected Star history pointers; do not revive or relocate the terminal lane. |
| `algorithm32/experiments/local-sun-shell-cache-experiment-plan.md` | PRESERVE | archive index | Existing protected Star history pointers; do not revive or relocate the terminal lane. |
| `algorithm32/experiments/local-sun-shell-cache-phase2-status.md` | PRESERVE | archive index | Existing protected Star history pointers; do not revive or relocate the terminal lane. |
| `algorithm32/experiments/star-flat-local-cache-plan.md` | PRESERVE | archive index | Existing protected Star history pointers; do not revive or relocate the terminal lane. |
| `algorithm32/experiments/promotion-checklist.md` | MOVE | X1 | Keep official-experiment promotion requirements and links to the canonical reference register. |
| `algorithm32/experiments/retained-experiments.md` | SPLIT | X2, X3 | Separate E/C experiment definitions from B-family benchmarks; retain identities and acceptance distinctions. |

### algorithm32/flat-local/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/flat-local/README.md` | REPLACE | E2, E3 | Refresh implemented Flat/local facts against their narrow owners; archive superseded status. |
| `algorithm32/flat-local/extension-contract.md` | SPLIT | E2, E3 | Separate geometry and finite-source responsibilities from selected cache domains and reuse. |
| `algorithm32/flat-local/flat180-star-production-diagnostic-plan.md` | EXTRACT + ARCHIVE | E2, X2 | Carry forward the promoted correction and residual limits; preserve the completed diagnostic as history, with protected Star content unchanged. |
| `algorithm32/flat-local/gpu-transport-offload-plan.md` | SPLIT | E3, E5, E6, F2; archive original | Retain fused transport design, execution controls, numerical closure, and separate visual qualification; retire completed work-package chronology. |
| `algorithm32/flat-local/promotion-plan.md` | EXTRACT + ARCHIVE | E2, A1 | Retain accepted engine boundaries and unresolved application handoff; archive completed promotion steps. |
| `algorithm32/flat-local/unresolved-research.md` | SPLIT | E3, X2, R1; archive original | Selected domain belongs to the engine, convergence proposals to experiments, and physical adequacy questions to research. Preserve v4/v5 provenance. |

### algorithm32/ground/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/ground/README.md` | SPLIT | E2, E6, R1 | Separate current ground contract, renewed physical-validation gap, and deferred ocean questions. Historical Star evidence remains unchanged. |

### algorithm32/production/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/production/README.md` | REPLACE | E1, E2, E3, E4, E5, E6, A1, A3 | Replace the omnibus status with a short engine entry and one current owner per focus; application state goes to production-app. |
| `algorithm32/production/architecture-boundaries.md` | SPLIT / HOLD RULES | E1; rules workflow | Keep production ownership facts; identify engineering-rule prose for the separate folder-based standards migration. |
| `algorithm32/production/baseline-import-status.md` | SPLIT | E1, E6; archive original | Extract unresolved import/public-entry work and current verification; preserve historical results and protected Star records. |
| `algorithm32/production/current-dataflow.md` | SPLIT | E1, E2, E3, E4, A1 | Keep a short engine dataflow overview and delegate detailed cache, source, display, and application flows. |
| `algorithm32/production/production-implementation-plan.md` | SPLIT / HOLD RULES | E1-E6, A1-A3, X2-X3, R1-R3; archive original | Inventory every unfinished stage and deferred item; separate current work from completed chronology. Stage 13 remains live; do not infer closure from older routers. |
| `algorithm32/production/distant-sun-cache-optimization-design.md` | MOVE | E3 | Keep the impact-ranked production optimization design; future controlled measurements belong to X2. |
| `algorithm32/production/execution-profile-contract.md` | MOVE | E5 | Keep the execution-profile contract and Stage 13 closure boundary. |
| `algorithm32/production/execution-profile-method-inventory.md` | MOVE | E5 | Keep current method coverage until Step 3.12 closes; archive completed inventory only after successors exist. |
| `algorithm32/production/execution-profile-incremental-verification.md` | MOVE | E6 | Keep active Step 3.12 verification and link to the profile implementation owner. |
| `algorithm32/production/ambient-light-design.md` | SPLIT | E4, A1, F2 | Engine receiver/physical contracts, production Three-light bridge, and exploratory lighting-only review have separate owners. |
| `algorithm32/production/ambient-light-plan.md` | SPLIT | A1, A3, F2; archive original | Carry A7 appearance decision to A3, production changes to A1, review procedure to F2; archive completed A0-A6 history. |
| `algorithm32/production/color-reset-design.md` | SPLIT | E4, A1, A3 | Engine Color/filter/source contracts, application selections, and production acceptance are distinct. |
| `algorithm32/production/color-reset-implementation-plan.md` | SPLIT | E4, E6, A1, A3, X3, R3; archive original | Extract remaining P8/P9 items with stable identities; retain implementation decisions and archive completed promotion chronology. |
| `algorithm32/production/color-reset-production-qualification.md` | SPLIT | E6, A3, X3; archive original | Separate engine conformance, application appearance/deployment acceptance, and B-family benchmark evidence; retain all evidence identifiers. |
| `algorithm32/production/color-reset-promotion-manifest.md` | SPLIT | E4, R3; archive original | Current algorithm/provenance inventory stays live; stale pre-P1 and fixed-500 inventories become history. |
| `algorithm32/production/color-reset-source-gaps.md` | RETIRE POINTER | R3 | Use a direct link to references/followup.md; preserve the retired pointer in the migration snapshot. |
| `algorithm32/production/color-star-cache-closeout-plan.md` | SPLIT | A3 with linked E3, E6, F2, X3, R3 | Retain one release coordination index; each C/D action gets exactly one substantive owner. Do not duplicate the release ledger. |
| `algorithm32/production/flat32-migration-inventory.md` | SPLIT | A1, A2, F3; archive original | Separate current integration, deferred product behavior, and exploratory quality-profile interaction; archive completed migration history. |
| `algorithm32/production/flat32-one-degree-cache-hookup-plan.md` | EXTRACT + ARCHIVE | E3, A1, A3 | Retain current cache/application contracts and open 4K/hardware limits; archive completed H1-H7 execution. |
| `algorithm32/production/solar-zenith-cache-adoption-plan.md` | EXTRACT + ARCHIVE | E3, E6 | Preserve selected compiler/runtime facts and evidence identities; retire completed PA migration bookkeeping. |
| `algorithm32/production/solar-zenith-cache-pa0-inventory.md` | EXTRACT + ARCHIVE | E3, E6 | Preserve selected compiler/runtime facts and evidence identities; retire completed PA migration bookkeeping. |
| `algorithm32/production/production-b-experiment-wiring-plan.md` | SPLIT | E6, X3 | Engine export/offline adapter work stays in E6; independent B1-B3 execution and scoring go to X3. Preserve pending C1.9. |
| `algorithm32/production/stage-9.6-containment-inventory.md` | SPLIT | E2, E3, E6; archive original | Retain active capability limits and unresolved validation; preserve protected provenance and historical hashes unchanged. |
| `algorithm32/production/star-parity-data-set.md` | PRESERVE | archive index | Protected historical pointer; index the existing immutable target. |
| `algorithm32/production/notes.md` | ARCHIVE | migration snapshot | Currently empty; retain its original identity in the snapshot rather than create a new working owner. |

### algorithm32/validation/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/validation/README.md` | SPLIT | E6, X3, R1 | Distinguish implementation conformance, independent benchmarks, and scientific claim authority. |
| `algorithm32/validation/external-benchmarks.md` | MOVE | X3 | Keep B-family definitions and independence; link scientific acceptance to research/register owners. |
| `algorithm32/validation/figure1-diagnostic.md` | SPLIT | X3, F2 | Quantitative regeneration/measurement goes to X3; explicitly qualitative visual inspection goes to F2. |
| `algorithm32/validation/angular-quadrature-balance-investigation.md` | EXTRACT + ARCHIVE | E2, E6, X3 | Retain the selected correction and any residual qualification gap; archive completed diagnosis and immutable evidence references. |
| `algorithm32/validation/frame-parity-experiment.md` | EXTRACT + ARCHIVE | E2, E6, X3 | Retain the selected correction and any residual qualification gap; archive completed diagnosis and immutable evidence references. |
| `algorithm32/validation/retained-j2-source-audit.md` | EXTRACT + ARCHIVE | E2, E6, X3 | Retain the selected correction and any residual qualification gap; archive completed diagnosis and immutable evidence references. |

### algorithm32/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `algorithm32/README.md` | REPLACE | root topic index | Replace the legacy umbrella router after current links and all focus owners are migrated. |

### extraterrestrial/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `extraterrestrial/README.md` | REPLACE | E4, X2, F2, R1-R3 | Retire the mixed production/experimental router after reconciling stale implementation claims. |
| `extraterrestrial/interface-contract.md` | SPLIT | E4, X2 | Accepted production contracts go to E4; unimplemented candidate contracts remain proposals in X2. |
| `extraterrestrial/source-inventory.md` | SPLIT | E4, R3 | Production source support and deferred capabilities separate from source-data provenance; reconcile old roster descriptions. |
| `extraterrestrial/fact-accounting.md` | MOVE | R3 | Keep claim disposition and link canonical facts; do not create another bibliography or fact register. |
| `extraterrestrial/unresolved-research.md` | SPLIT | R1, R2, R3, E4, X2 | Separate physical/source questions, perception, provenance, production decisions, and proposed measurements. |
| `extraterrestrial/extraterrestrial.md` | SPLIT / HOLD RULES | X1, E6; rules workflow | Separate evidence promotion procedure and production adaptation facts; defer reusable-rule disposition to the standards work. |
| `extraterrestrial/production-api-ownership-contract.md` | SPLIT | E1, E4; archive original | Retain selected public ownership and lifecycle contracts, reconcile current implementation, archive old candidate-classification ledger. |
| `extraterrestrial/production-integration-api-plan.md` | SPLIT | E4, E6, A1, A3; archive original | Extract live engine/application backlog; verify which paused steps were superseded and never reactivate them from stale text. |
| `extraterrestrial/promotion-plan.md` | SPLIT | E4, E6, A1, A3; archive original | Extract live engine/application backlog; verify which paused steps were superseded and never reactivate them from stale text. |
| `extraterrestrial/step-4-source-geometry-reconciliation.md` | EXTRACT + ARCHIVE | E2, E3, E4 | Keep durable production decisions and outstanding limits; archive completed reconciliation ledgers. |
| `extraterrestrial/step-5-distant-sun-cache-reconciliation.md` | EXTRACT + ARCHIVE | E2, E3, E4 | Keep durable production decisions and outstanding limits; archive completed reconciliation ledgers. |
| `extraterrestrial/step-6-live-sun-composition-reconciliation.md` | EXTRACT + ARCHIVE | E2, E3, E4 | Keep durable production decisions and outstanding limits; archive completed reconciliation ledgers. |
| `extraterrestrial/stage-12-implementation-topic.md` | SPLIT / HOLD RULES | X1, X2; archive original only after authority handoff | Extract the live Immutable Run Records contract and containment workflow before retirement; AGENTS.md currently links here. Archive accepted G-stage chronology only after routed rule ownership is resolved. |
| `extraterrestrial/celestial-contribution-cache-design.md` | EXTRACT + ARCHIVE | E4, X2 | Extract still-selected contracts and explicit rejection reasons; archive superseded dense/member-field representation. |
| `extraterrestrial/stellar-screen-palette-design.md` | SPLIT | E4, X2, F2; archive original | Current palette representation belongs to E4; optional sharing/index-width studies to X2; appearance questions to F2. |
| `extraterrestrial/stellar-rendering-plan.md` | EXTRACT + ARCHIVE | E4, A3, X2 | Retain outstanding disposition items and accepted representation links; archive completed port/experimental chronology. |
| `extraterrestrial/stellar-screen-palette-production-port-plan.md` | EXTRACT + ARCHIVE | E4, A3, X2 | Retain outstanding disposition items and accepted representation links; archive completed port/experimental chronology. |
| `extraterrestrial/stellar-rendering-experiment-plan.md` | RETIRE POINTER | archive index | Superseded outline; consolidate navigation into the archive index. |
| `extraterrestrial/color-reset-design.md` | EXTRACT + ARCHIVE | E4, X2, R2, R3 | Preserve exact accepted equations, rejected cases, provenance, and unresolved research; archive the closed contained lane. Existing production design remains the first current owner. |
| `extraterrestrial/color-reset-experiment-plan.md` | EXTRACT + ARCHIVE | E4, X2, R2, R3 | Preserve exact accepted equations, rejected cases, provenance, and unresolved research; archive the closed contained lane. Existing production design remains the first current owner. |
| `extraterrestrial/normal-mode-test-plan.md` | EXTRACT + ARCHIVE | X2, R2 | Preserve failed and superseded Normal/Color boundaries; no old candidate or continuation becomes active by relocation. |
| `extraterrestrial/spectral-color-transform-experiment-plan.md` | EXTRACT + ARCHIVE | X2, R2 | Preserve failed and superseded Normal/Color boundaries; no old candidate or continuation becomes active by relocation. |
| `extraterrestrial/camera-controls-development-plan.md` | EXTRACT + ARCHIVE | X2, R2, R3 | Camera emulation was stopped after run 000386. Retain mechanical claims, failure, and deferred calibration questions; do not populate active POC-app work from its abandoned UI steps. |
| `extraterrestrial/camera-controls-testing-plan.md` | EXTRACT + ARCHIVE | X2, R2, R3 | Camera emulation was stopped after run 000386. Retain mechanical claims, failure, and deferred calibration questions; do not populate active POC-app work from its abandoned UI steps. |
| `extraterrestrial/camera-control-test-inventory.md` | EXTRACT + ARCHIVE | X2, R2, R3 | Camera emulation was stopped after run 000386. Retain mechanical claims, failure, and deferred calibration questions; do not populate active POC-app work from its abandoned UI steps. |
| `extraterrestrial/camera-spectral-color-prior-art-research.md` | SPLIT | R2, R3; archive original | Retain reusable source assessments and their limits; archive the failed experiment's execution narrative. |
| `extraterrestrial/global-normal-color-rendering-research.md` | SPLIT | R2, X2; archive original | Keep bounded literature findings and unresolved questions in research; experiment-specific frozen protocols and rejected candidates become history. |
| `extraterrestrial/normal-color-stage2b-reference-research.md` | SPLIT | R2, X2; archive original | Keep bounded literature findings and unresolved questions in research; experiment-specific frozen protocols and rejected candidates become history. |
| `extraterrestrial/receptor-response-parameter-research.md` | SPLIT | R2, X2; archive original | Keep bounded literature findings and unresolved questions in research; experiment-specific frozen protocols and rejected candidates become history. |
| `extraterrestrial/sunset-disk-reference-summary.md` | SPLIT | R1, R2, X2, F2; archive original | Separate physical/vision sources, bounded numerical diagnosis, and qualitative review method. |
| `extraterrestrial/sun-circumsolar-physics-expectations.md` | MOVE | R1 | Retain deferred physical reference questions and bounded external comparisons; reconcile stale active-plan links. |
| `extraterrestrial/sun-disk-appearance-design.md` | SPLIT | E4, X2, F2, R2; archive original | Separate selected source/display architecture from paused redesigns, review procedures, and perception research; selected versus proposed must be checked. |
| `extraterrestrial/sun-disk-appearance-implementation-plan.md` | EXTRACT + ARCHIVE | E4, X2, F2, R2 | Preserve implemented decisions and explicit deferrals; rejected automatic exposure and stopped ACES/glare paths remain closed. |
| `extraterrestrial/sun-disk-appearance-short-loop-state.md` | ARCHIVE | archive index | Closed failed visual-development direction; retain failure and links unchanged. |
| `extraterrestrial/moon-follow-up.md` | SPLIT | E4, X2, R1, R3 | Retain one deferred capability owner in E4; link independent research prerequisites and proposed experiments without starting them. |

### initialization/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `initialization/README.md` | ARCHIVE | archive index | Completed migration/recovery records; retain restoration and source mappings. |
| `initialization/archive-disposition.md` | ARCHIVE | archive index | Completed migration/recovery records; retain restoration and source mappings. |
| `initialization/working-document-recovery-plan.md` | ARCHIVE | archive index | Completed migration/recovery records; retain restoration and source mappings. |

### references/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `references/README.md` | REPLACE | R3 | Route to unchanged /references canonical authorities. |
| `references/citation-and-retention-policy.md` | HOLD RULES | R3; incoming rules workflow | Keep current authority in place until the new documentation identifies its folder-based home; research entry links it. |

### testing/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `testing/README.md` | SPLIT / HOLD RULES | E6, A1, X1; rules workflow | Allocate engine, app, and experiment command facts to their work owners. Reusable testing standards migrate through the incoming rules workflow. |

### context/

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `context/README.md` | REPLACE | root topic index | Consolidate discovery routing after the five entries exist; preserve existing bootstrap until cutover. |
| `context/routing.md` | REPLACE | root topic index | Consolidate discovery routing after the five entries exist; preserve existing bootstrap until cutover. |

### Root Routing And Standards Infrastructure

| Existing document | Action | Destination | Content handling |
| --- | --- | --- | --- |
| `README.md` | REWRITE | root topic index | List five work modes, focus routing, and archive navigation; remove nonexistent categories. |
| `active-topic.md` | REWRITE AT CUTOVER | session pointer | Keep topic, focus, current task, and minimal reload list; no duplicate status narrative. |
| `standards/manifest.md` | HOLD RULES | existing standards infrastructure | Do not change until owner supplies the folder-based standards documentation. |
| `standards/overlay.md` | HOLD RULES | existing standards infrastructure | Do not change until owner supplies the folder-based standards documentation. |
| `standards/reconciliation.md` | HOLD RULES | existing standards infrastructure | Do not change until owner supplies the folder-based standards documentation. |

## Existing Archived Documentation

All 54 already-archived Markdown files are preserved byte-for-byte under root
`archives/topics/retired-20260906/`. The owner-directed retirement includes the
old topic directories and their reference stubs. The
[retired-topic archive index](retired-topic-archive-index.md) owns verified ZIP,
readable-copy, and restoration identities.

The inventory below is exhaustive for existing Markdown files under an
`archive` directory at the baseline. Every row has disposition
**PRESERVE BY VERIFIED LOCAL ARCHIVAL**; no historical content or link rewrite
is performed. Listed paths are original identities, not current topic paths.

- `algorithm32/archive/algorithm32-star/cache/local-sun-cache-design.md`
- `algorithm32/archive/algorithm32-star/experiments/flat-world-atmosphere-boundary-decision.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-experiment-plan.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-dense-linear-control-freeze-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-direct-packet-freeze-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-family-run-policy-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-freeze-verification-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-holdout-measurement-freeze-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-monitor-metric-freeze-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-shell-ladder-freeze-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-source-boundary-freeze-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p0-structured-slice-representation-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-inputs/p1-representation-source-closure-v1.md`
- `algorithm32/archive/algorithm32-star/experiments/local-sun-shell-cache-phase2-status.md`
- `algorithm32/archive/algorithm32-star/experiments/star-flat-local-cache-plan.md`
- `algorithm32/archive/algorithm32-star/production/star-parity-data-set.md`
- `algorithm32/archive/algorithm32-star/README.md`
- `algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-contracts.md`
- `algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-inventory.md`
- `algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-reorganization-plan.md`
- `algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-target-map.md`
- `algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-transaction-plan.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/descriptor-reconciliation-analysis.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory-declarations.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory-production.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory-test-browser.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/documentation-inventory.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-foundation.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-physical.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-runtime.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification-support.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-classification.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory-foundation.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory-physical.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory-runtime.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-inventory.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-foundation.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-physical.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-runtime.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan-support.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/helper-ownership-target-plan.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/reconciliation-inventory.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map-8.2.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map-8.3.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map-8.4.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/short-variable-migration-map.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/source-organization-plan.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/unit-bearing-name-inventory.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/validation-inventory.md`
- `algorithm32/archive/reconciliation-2026-08-04/algorithm32/validation-reconciliation-analysis.md`
- `algorithm32/archive/reconciliation-2026-08-04/extraterrestrial/reconciliation.md`
- `algorithm32/archive/reconciliation-2026-08-04/README.md`
- `algorithm32/experiments/archive/local-sun-shell-cache-experiment-plan-sparse-topology-v1.md`

## Archive Procedure For Newly Retired Topics

For ordinary newly retired topic documents, create a dated snapshot below
`archives/topic-consolidation-YYYYMMDD/` that retains original repository-
relative paths and exact bytes. Record the source path/hash, retirement reason,
current successor, open-item destinations, and restoration path in an index.

Verify the snapshot before removing any former live copy. Keep historical
relative links intact inside the snapshot where possible and provide an
explicit resolution map for dependencies outside it. Check links used by
current documents after relocation. A history copy is not current instruction.

The owner explicitly authorized archiving the remaining retired topic material.
Protected topic files were added to a new ZIP with original repository-relative
paths, fully entry/hash-verified, and indexed before their readable copies moved.
Existing ZIP archives, sealed experiment controls, historical run output, and
operational extracted assets remain outside this topic-only relocation.

Do not archive a current design merely because its implementation is finished.
Do not interpret deferred work as completed. A document containing both has
an extraction dependency; its archival checklist names every destination.

Avoid persistent redirect stubs throughout the new live tree. Prefer repaired
current links and an archive index. Retired pointers are preserved as archived
bytes, not retained as live topic directories. Historical consumers can be
restored separately without changing their frozen path identities.

## Completed Execution

- [x] Freeze all 168 topic files/metadata and verify the original ZIP before retirement.
- [x] Establish five primary entries and 17 focus areas with allocated content; leave F1 uninstantiated.
- [x] Extract selected contracts, open gates, research, and application work; record 880 section dispositions.
- [x] Complete the manually approved rules handoff and validate normalization and generated guide.
- [x] Retire obsolete routes and chronology; archive all 23 legacy reference stubs and index historical-consumer restoration paths.
- [x] Cut over active context and verify representative cache, benchmark, appearance, deployment, and research routes.
- [x] Verify current links, protected hashes, archive identities, and open-item ownership.

Execution refinements follow the approved preservation/ownership rules:
Stage 13 Step 3.12 was already closed, so its residual work has a focused status
owner rather than a reopened implementation stage. Newer C1.8 evidence replaces
the stale assertion that no B1 offline/GPU adapter exists. Superseded stellar
and Sun-appearance designs route to the current production Color owner rather
than becoming competing live contracts. Their original equations and rejected
claims remain in history. The stopped camera lane remains stopped.

Reviewer eligibility gates pass; the existing UI lane refreshed to READY.
The environment thread limit prevented the remaining roster from starting,
so this is not a complete independent standards review or a source-code audit.

## Delivery And Resume Point

Delivered: five-topic scaffold, current focused owners, one release coordination
index, a verified local original snapshot plus local readable history, repaired current
links, complete file/section disposition ledgers, and accepted folder standards.

No production feature was implemented, no deferred product item was selected,
and no scientific, appearance, or licensing acceptance was inferred.
The owner approved the whole-repository checkpoint and its message, including
the identified large-file relocations after informed confirmation. The
checkpoint handoff records its revised scope and approved historical-fixture
CRLF whitespace exception.
The readable `agents/topics/archive/` tree was subsequently moved intact to
Git-ignored root `archives/topics/`; archive duplicates are not checkpoint
content. Remaining retired topic roots are archived in the verified
`archives/topics/retired-20260906/` set. Previously committed retired material
remains in Git history; no history rewrite is performed.
