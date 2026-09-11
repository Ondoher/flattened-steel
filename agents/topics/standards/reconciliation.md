# Standards Reconciliation

## Status

- Repository: `C:\dev\flattened-steel`
- Canonical standards root: `C:\Users\gande\.codex\documentation\standards`
- Standards governance: [documentation.md — Folder Standards Manifest](../../../../../Users/gande/.codex/documentation/standards/documentation.md#folder-standards-manifest)
- Generated developer guide: [STANDARDS.md](../../../STANDARDS.md) is current and generated from the normalized folder configuration.
- Audit date: 2026-09-09.
- Audit basis: working tree at commit `8e9a11ab8d78dd02a53eb73a5e0c991cc99a4e32`, including pre-existing edits and the untracked repository skill. This is a standards configuration/ownership audit, not an application-code compliance audit.
- Phase: `reconciled`.
- Normalization status: `normalized`; all thirteen developer-approved dispositions are applied, with zero pending or deferred items.
- Reconciled scope: approved folder mapping, local overlay consolidation, canonical setter promotion, redundant prose removal, experiment-scaffold repair, operational contract handoff, skill-owned new-experiment placement, and proof-host capability mapping. Topic relocation is recorded separately in the completed migration ledger.

The developer explicitly accepted the first ten recommendations and later
directed removal of the stale extraterrestrial-only placement restriction in
favor of the `start-experiment` skill, authorizing FM-011 reconciliation.
The developer's blanket preapproval of recommendations authorizes FM-012's
narrow folder mapping after the C0 review exposed its HTTP proof-host
capability.
FM-009 promotes assignment-only setters to canonical code conventions. The
detailed comparisons below retain the pre-change audit basis; reconciliation
results and the validation record describe the installed state. The historical
appendix remains unchanged developer-decision evidence.

The developer explicitly approved the narrow GPU-resident shared-block-cache
proof-host assignment after the experiment-start capability check identified
that its planned loopback/WebGL proof host requires `proof-tools` rather than
the generic `code` set. That approval authorizes FM-013 only.

The developer explicitly approved FM-014 after the initial-still review found
that the contained shadow-animation harness intercepts and responds to the
production bundle request. The narrow experiment assignment adds `server.md`
without altering experiment authority or any production path.

On 2026-09-09 the developer explicitly authorized the post-scaffold input
refresh for `experiments/distant-sun-shadow-animation-evidence/`. Its exact
scaffold `AGENTS.md` inherits the existing `experiments/` -> `code` assignment;
no manifest, overlay, canonical-standard, or folder-capability change was
required. Current attestation and guide identities are recorded in the
checkpoint-adviser activation record below.

## Summary

### Point-Local Builder Experiment Execution

The owner's instruction to proceed with the recorded five-step plan authorizes
its disclosed scaffold-readiness prerequisite, under standing delegated judgment.
The focused audit identifies two changes, both `already-covered` dispositions:

- PCB-001: `experiments/point-local-cache-builder/AGENTS.md` adds operational
  containment and progress instructions; include it in the attested inputs.
- PCB-002: the planned browser proof host requires the existing `proof-tools`
  set rather than the inherited `code` set. Add a narrow assignment for this
  experiment, retaining all canonical rules and the existing overlay unchanged.

These dispositions implement the authorized experiment using existing standards;
no new manual review or shared-skill repair authorization is claimed. Prior
instruction inputs are unchanged, and no ambiguity or deferred item was found
in this focused scope. Attestation validation passed with ten inputs and identity
`sha256:c2deb9aab8f7a0c595f376b7b5934ad1e5fffca5670ce260ed3343c81b55e8f9`.
The generated guide check reports current at source fingerprint
`sha256:c143c9ed31fd08d1571ca878edb0695a9921bd3d87eccdb33cdd8a18f629f535`.

### Calculation Reuse Experiment Execution

The 2026-09-10 request to execute the complete experiment plan, following the
reported normalization prerequisite, authorizes this focused reconciliation
under the owner's standing direction to resolve routine questions with judgment.
The added `experiments/00000-shared-cache-calculation-reuse/AGENTS.md` records
operational containment and progress obligations, without selecting standards.

- Finding CR-001: the new instruction input requires attestation refresh.
  Recommendation and recorded disposition: `already-covered`; retain its
  operational instructions and include it in the audited surface.
- Finding CR-002: the planned retained WebGL execution proof needs a local HTTP
  host, which generic `code` omits. Recommendation and recorded disposition:
  `already-covered`; reuse the existing `proof-tools` set for this experiment
  folder. No canonical rule or overlay change is needed.
- Authorization basis: execution of the plan and its disclosed readiness
  prerequisite, with delegated judgment; no new manual review is claimed.

The prior eight inputs remain unchanged. The only applicability change is the
narrow experiment assignment. Historical evidence and production scopes remain
unchanged. This audit has no unresolved disposition or precedence ambiguity.

Reconciliation validates nine inputs with fingerprint
`sha256:20d422bf089b4c0f1fa0b46ed6ab3ee26d1042041d9c6bee2a5cf06e86c64f57`.
The generated guide write/check passes with source fingerprint
`sha256:21204f6363f5a601571976a9b0f27a5211f537da46e2101a1df88be744b9d5a4`.

### Checkpoint Adviser Activation

The 2026-09-10 request to enable the check-in adviser authorizes the repository
bootstrap opt-in in `AGENTS.md`. The focused audit found only that operational
instruction changed among the eight attested inputs. It selects the existing
`review-standards` adviser lifecycle and eligibility gates; it introduces no
engineering-rule, folder-mapping, overlay, or canonical-standard divergence.
The requested activation is the recorded developer decision. Reconciliation
is limited to this instruction and the derived attestation and guide refresh.

Validation retains eight operational inputs, zero pending or deferred
divergences, and normalization fingerprint
`sha256:04d7baaa3c0727864de581a63eadbd4e0972a00d7e5507c38ae857f467643ae3`.
The generated guide source fingerprint is
`sha256:2418113af674da180b7346ad725cd5ee19fb0004b959d8932b20b1554a88b9d3`.

### Disposition Counts

| Recommended disposition | Count |
| --- | ---: |
| `promote-global` | 1 |
| `add-local` | 4 |
| `replace-local` | 0 |
| `remove-local` | 4 |
| `already-covered` | 3 |
| `defer` | 0 |

Installed outcome: nine reusable sets and 29 existing-folder assignments,
using the same eleven canonical standards already selected. Preserve the four
scientific requirements under `src/algorithm32/`, encode the two type-section
requirements together, and promote the assignment-only setter rule to canonical
`code-conventions.md#Classes And Utilities`. The resulting overlay has three
ADD entries containing the four scientific requirements. The setter restriction
follows canonical code-conventions applicability rather than an Algorithm32
overlay scope. No new optional application infrastructure is proposed.

The obsolete manifest, topic scopes, duplicate ADD encoding, and obsolete
scaffold controls have been replaced. Operational contract handoff is complete.

## Approved Folder Configuration

This approved configuration is installed in the manifest. The exact
machine-readable configuration follows the tables. Standards never follow topic or
focus names, runtime imports, or a file's historical origin.

### Named sets

Each row lists only additions to its parent.

| Set | Extends | Adds |
| --- | --- | --- |
| `base` | `none` | `documentation.md`, `project-foundation.md` |
| `code` | `base` | `architecture.md`, `code-conventions.md`, `types.md`, `jsdoc.md`, `testing.md` |
| `build` | `code` | `polylith.md` |
| `application` | `build` | `remvc.md` |
| `http-application` | `application` | `server.md` |
| `react-application` | `application` | `react.md` |
| `react-library` | `code` | `react.md` |
| `server` | `build` | `server.md` |
| `proof-tools` | `code` | `server.md` |

### Folder assignments

The root covers `builds/`, `spec/`, and root-level package/runner configuration.
Narrower assignments remove inappropriate application concerns from engine,
research, and documentation paths. A parent set used by inheritance is not an
unused set.

| Folder | Set | Capability / boundary |
| --- | --- | --- |
| `.` | `build` | Root package, Polylith, build, and runner configuration. |
| `agents/` | `base` | Work context and standards configuration; topics do not select standards. |
| `.agents/` | `base` | Repository workflow documentation. |
| `.agents/skills/start-experiment/scripts/` | `code` | Authored scaffolding automation. |
| `references/` | `base` | Scientific source, claim, and result registers; retained evidence is not active code. |
| `archives/` | `base` | Immutable historical evidence; mapping never authorizes edits. |
| `src/` | `code` | Shared authored implementation and contracts. |
| `src/algorithm32/implementation/react-three/` | `react-library` | Production React and R3F bindings inside the standalone engine. |
| `src/flat/` | `react-application` | React Polylith application. |
| `src/flat32/` | `http-application` | Polylith application with imperative DOM and client HTTP package loading. |
| `server/` | `server` | Polylith router and filesystem-backed application services. |
| `server/flat32/data/` | `base` | Operational asset documentation and immutable scientific packages, not database entities. |
| `scripts/` | `code` | Offline tooling and independent scientific runners. |
| `scripts/algorithm32/solar-zenith-cache/` | `proof-tools` | Offline compiler and local HTTP browser proof hosts. |
| `scripts/flat32/` | `server` | Application build, capture, and cache-service tooling. |
| `scripts/experiments/b1-directional-sky-radiance/` | `proof-tools` | Independent scoring and GPU HTTP proof host. |
| `scripts/experiments/algorithm32-frame-parity/` | `proof-tools` | Independent CPU/GPU frame comparison and HTTP proof hosts. |
| `experiments/` | `code` | Contained authored source and proof runners; operational no-unit-test instructions remain effective. |
| `experiments/distant-sun-cache-optimization/` | `proof-tools` | Contained cache experiment with a local HTTP browser proof host. |
| `experiments/distant-sun-shadow-animation-evidence/` | `proof-tools` | Contained browser interception and WebGL evidence harness. |
| `experiments/extraterrestrial/runners/` | `proof-tools` | Contained HTTP/browser proof orchestration. |
| `experiments/extraterrestrial/color-reset/harness/` | `proof-tools` | Contained Color Reset browser host. |
| `experiments/extraterrestrial/color-reset/runners/` | `proof-tools` | Contained Color Reset HTTP/browser proof orchestration. |
| `experiments/extraterrestrial/solar-zenith-cache/point-local-scene-cache/` | `proof-tools` | Contained local scene-cache browser host. |
| `experiments/extraterrestrial/solar-zenith-cache/runners/` | `proof-tools` | Contained solar-zenith browser proof hosts. |
| `experiments/extraterrestrial/baseline/src/algorithm32/react/` | `react-library` | Sealed React comparison source; read-only, not a modernization target. |
| `experiments/extraterrestrial/candidate/src/algorithm32/react/` | `react-library` | Sealed React comparison source; read-only, not a modernization target. |
| `experiments/extraterrestrial/production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/react-three/` | `react-library` | Sealed React promotion snapshot; read-only. |

React is selected for the actual `src/algorithm32/implementation/react-three/`
bindings, not for all engine source. Flat32 uses imperative DOM plus HTTP, so it
does not inherit React merely because the repository also has a React app.

The `proof-tools` set includes HTTP ingress/failure concerns because these
folders contain HTTP browser hosts. It does not add Polylith merely for those
hosts or turn them into application servers. Applicability of individual rules
still respects the controlled proof-host role and applicable instructions.
Selecting `testing.md` does not authorize experimental test trees or bypass the
contained runner-only boundary.

Mapping sealed React copies records their capability without authorizing review
remediation, modernization, execution, or changes to their evidence. Archives,
generated output, retained third-party inputs, and operational cache packages
remain non-authored/protected surfaces; their fallback assignment is never
permission to rewrite them. No mapping is added for an empty future topic or
hypothetical future feature.

### Optional capability decisions retained

- `accessibility.md` and `localization.md`: keep the previously approved
  omissions for this technical/research application. Native semantics and
  interaction requirements already present in selected code/React standards
  still apply. Adding a customer-facing requirement requires a fresh folder
  applicability decision; a new topic name does not enable these standards.
- `mui.md`, `base-components.md`, and `app-shells.md`: no MUI dependency,
  generated base-component layer, or page-registry shell capability was found
  in the inspected app/build surfaces. A rendering canvas is not that shell.
- `socket-io.md` and `local-https.md`: no selected Socket.IO feature or local
  certificate/HTTPS setup in the application package and Polylith configuration.
  A downloaded HTTPS scientific source is not local HTTPS infrastructure.
- `data-persistence.md`: no database-backed application-record boundary found
  in inspected production packages, source imports, and server surfaces. The
  canonical standard explicitly applies to database persistence. Content-hashed
  spectral packages, JSON manifests, local asset storage, and scientific run
  ledgers do not acquire UUID or epoch-millisecond requirements by being stored.

These are capability-selection findings, not proof that no future or uninspected
code could introduce a capability. Reviewers must block for a mapping audit if
changed-file contents reveal an absent concern.

### Concrete proposal

The following block was parsed in memory using the installed shared parser.
It has not been installed as `manifest.md`.

```markdown
# Folder Standards Manifest

## Standards Sets

### `base`

Extends: none
Standards:

- [documentation.md](../../../../../Users/gande/.codex/documentation/standards/documentation.md) - Folder applicability and standards governance.
- [project-foundation.md](../../../../../Users/gande/.codex/documentation/standards/project-foundation.md) - Repository and package boundaries.

### `code`

Extends: base
Standards:

- [architecture.md](../../../../../Users/gande/.codex/documentation/standards/architecture.md) - Implementation ownership and dependency boundaries.
- [code-conventions.md](../../../../../Users/gande/.codex/documentation/standards/code-conventions.md) - JavaScript and formatting conventions.
- [types.md](../../../../../Users/gande/.codex/documentation/standards/types.md) - Ambient public and internal contracts.
- [jsdoc.md](../../../../../Users/gande/.codex/documentation/standards/jsdoc.md) - Callable and declaration documentation.
- [testing.md](../../../../../Users/gande/.codex/documentation/standards/testing.md) - Behavioral verification and lane boundaries.

### `build`

Extends: code
Standards:

- [polylith.md](../../../../../Users/gande/.codex/documentation/standards/polylith.md) - Polylith build, activation, and deployment.

### `application`

Extends: build
Standards:

- [remvc.md](../../../../../Users/gande/.codex/documentation/standards/remvc.md) - Application responsibility and lifecycle.

### `http-application`

Extends: application
Standards:

- [server.md](../../../../../Users/gande/.codex/documentation/standards/server.md) - HTTP ingress, transport, filesystem service, and failure boundaries.

### `react-application`

Extends: application
Standards:

- [react.md](../../../../../Users/gande/.codex/documentation/standards/react.md) - React presentation and adapter lifecycle.

### `react-library`

Extends: code
Standards:

- [react.md](../../../../../Users/gande/.codex/documentation/standards/react.md) - React presentation and adapter lifecycle.

### `server`

Extends: build
Standards:

- [server.md](../../../../../Users/gande/.codex/documentation/standards/server.md) - HTTP ingress, transport, filesystem service, and failure boundaries.

### `proof-tools`

Extends: code
Standards:

- [server.md](../../../../../Users/gande/.codex/documentation/standards/server.md) - HTTP ingress, transport, filesystem service, and failure boundaries.

## Folder Assignments

- `.` - `build` - Root package, Polylith, build, and runner configuration.
- `agents/` - `base` - Work context and standards configuration; topics do not select standards.
- `.agents/` - `base` - Repository workflow documentation.
- `.agents/skills/start-experiment/scripts/` - `code` - Authored scaffolding automation.
- `references/` - `base` - Scientific source, claim, and result registers; retained evidence is not active code.
- `archives/` - `base` - Immutable historical evidence; mapping never authorizes edits.
- `src/` - `code` - Shared authored implementation and contracts.
- `src/algorithm32/implementation/react-three/` - `react-library` - Production React and R3F bindings inside the standalone engine.
- `src/flat/` - `react-application` - React Polylith application.
- `src/flat32/` - `http-application` - Polylith application with imperative DOM and client HTTP package loading.
- `server/` - `server` - Polylith router and filesystem-backed application services.
- `server/flat32/data/` - `base` - Operational asset documentation and immutable scientific packages, not database entities.
- `scripts/` - `code` - Offline tooling and independent scientific runners.
- `scripts/algorithm32/solar-zenith-cache/` - `proof-tools` - Offline compiler and local HTTP browser proof hosts.
- `scripts/flat32/` - `server` - Application build, capture, and cache-service tooling.
- `scripts/experiments/b1-directional-sky-radiance/` - `proof-tools` - Independent scoring and GPU HTTP proof host.
- `scripts/experiments/algorithm32-frame-parity/` - `proof-tools` - Independent CPU/GPU frame comparison and HTTP proof hosts.
- `experiments/` - `code` - Contained authored source and proof runners; operational no-unit-test instructions remain effective.
- `experiments/distant-sun-cache-optimization/` - `proof-tools` - Contained cache experiment with a local HTTP browser proof host.
- `experiments/distant-sun-shadow-animation-evidence/` - `proof-tools` - Contained browser interception and WebGL evidence harness.
- `experiments/extraterrestrial/runners/` - `proof-tools` - Contained HTTP/browser proof orchestration.
- `experiments/extraterrestrial/color-reset/harness/` - `proof-tools` - Contained Color Reset browser host.
- `experiments/extraterrestrial/color-reset/runners/` - `proof-tools` - Contained Color Reset HTTP/browser proof orchestration.
- `experiments/extraterrestrial/solar-zenith-cache/point-local-scene-cache/` - `proof-tools` - Contained local scene-cache browser host.
- `experiments/extraterrestrial/solar-zenith-cache/runners/` - `proof-tools` - Contained solar-zenith browser proof hosts.
- `experiments/extraterrestrial/baseline/src/algorithm32/react/` - `react-library` - Sealed React comparison source; read-only, not a modernization target.
- `experiments/extraterrestrial/candidate/src/algorithm32/react/` - `react-library` - Sealed React comparison source; read-only, not a modernization target.
- `experiments/extraterrestrial/production-snapshots/sun-appearance-step-5-v1/src/algorithm32/implementation/react-three/` - `react-library` - Sealed React promotion snapshot; read-only.

## Repository Overlay

[overlay.md](overlay.md) owns repository additions and replacements.
```

## Divergences

The current decision identifiers are FM-001 through FM-014. Historical DIV/ADD/CFG
identifiers remain unchanged in the appendix. Reconciliation may apply only
current recorded approvals.

### FM-014: Assign the shadow-animation interception harness to proof-tools

- Canonical source: [documentation.md — Folder Standards Manifest](../../../../../Users/gande/.codex/documentation/standards/documentation.md#folder-assignments)
- Repository source: `agents/topics/standards/manifest.md`, `experiments/distant-sun-shadow-animation-evidence/AGENTS.md`, and `experiments/distant-sun-shadow-animation-evidence/run-initial-still.js`.
- Canonical rule: A deeper folder assignment is required when a subtree needs a meaningfully different standards set; `proof-tools` adds HTTP ingress and failure-boundary standards to the code baseline.
- Repository rule: The contained still harness intercepts the production JavaScript request and responds with an instrumented bundle before driving hardware WebGL evidence.
- Behavioral difference: The generic `experiments/` assignment omits `server.md`, while the request interception and response seam is an HTTP transport boundary.
- Information at risk: Retaining only `code` would omit applicable transport, error, and boundary rules; assigning `proof-tools` to all experiments would over-apply those rules.
- Agent recommendation: `add-local`.
- Recommendation rationale: Reuse the existing `proof-tools` set only at `experiments/distant-sun-shadow-animation-evidence/`, parallel to the two other contained browser proof-host lanes.
- Developer decision: `add-local`.
- Developer notes: Explicitly approved by the developer's `yes` response after the exact stale-mapping finding and proposed narrow assignment were reported.
- Re-review required: `no`.
- Reconciliation result: Applied as approved; no overlay, canonical standard, operational authority, or production path changed.
- Validation evidence: Folder parsing selects `proof-tools`; attestation
  validates at
  `sha256:4a9f5014683d07ead7ec14eda96dca9c0a38543408f958c5d9cc3923dae54649`;
  guide write/check is current at
  `sha256:c6515eed757e99ae10c77584a40b5a8332d7336c87b4e63dc70fbd1f1312e135`;
  formatting and reviewer eligibility gates pass.

### FM-013: Assign the GPU-resident shared-block-cache proof host to proof-tools

- Canonical source: [documentation.md — Folder Standards Manifest](../../../../../Users/gande/.codex/documentation/standards/documentation.md#folder-assignments)
- Repository source: `agents/topics/standards/manifest.md` and `experiments/gpu-resident-shared-block-cache/AGENTS.md`.
- Canonical rule: A deeper folder assignment is required when a subtree needs a meaningfully different standards set; `proof-tools` adds HTTP ingress and failure-boundary standards to the code baseline.
- Repository rule: The new contained experiment will own a loopback/WebGL proof host for shader-addressable cache blocks and predictive animation prefetch.
- Behavioral difference: The generic `experiments/` assignment omits `server.md`, while a browser proof host has HTTP ingress, containment, and failure boundaries that require it.
- Information at risk: Applying only `code` would leave the new proof host without its applicable HTTP boundary standard; assigning `proof-tools` to all experiments would over-apply it to unrelated lanes.
- Agent recommendation: `add-local`.
- Recommendation rationale: Assign the existing `proof-tools` set only to `experiments/gpu-resident-shared-block-cache/`, matching the existing distant-Sun cache experiment pattern without changing any unrelated path or adding a local rule.
- Developer decision: `add-local`.
- Developer notes: Explicitly approved by the developer's “let's do that” instruction after the capability and reconciliation boundary were explained.
- Re-review required: `no`.
- Reconciliation result: Applied as approved; the manifest has one narrow existing-folder assignment.
- Validation evidence: The shared folder resolver selects `proof-tools` for the new experiment source and `base` for its topic documents.

### FM-001: Replace the obsolete repository-wide list with folder assignments

- Canonical source: [documentation.md — Folder Standards Manifest](../../../../../Users/gande/.codex/documentation/standards/documentation.md#folder-standards-manifest)
- Repository source: [agents/topics/standards/manifest.md](manifest.md) (`## Applicable Files`, lines 13–25); package/build metadata and the capability evidence below.
- Canonical rule: Exactly one Standards Sets section and one Folder Assignments section; a required root assignment, longest-folder matching, and inherited named sets determine applicability.
- Repository rule: One flat list of eleven standards; no named sets or folder assignments.
- Behavioral difference: The installed resolver cannot map any file. Retaining the list keeps reviewer startup blocked; applying all standards to every path would also erase the intended engine/application distinction.
- Information at risk: The eleven selected concerns and earlier decisions not to install optional application infrastructure.
- Agent recommendation: `remove-local`.
- Recommendation rationale: Remove the obsolete list syntax and install the exact nine-set, 26-assignment proposal below. Retain the existing eleven-standard ceiling; do not introduce optional capabilities solely for this migration.
- Developer decision: `remove-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-001).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Current parser fails on missing Standards Sets; the proposed configuration parses in memory and all 26 folders exist.

### FM-002: Durable scientific quantities and provenance become engine-folder additions

- Canonical source: [documentation.md — Repository Standards Overlay](../../../../../Users/gande/.codex/documentation/standards/documentation.md#repository-standards-overlay); [types.md — General Types](../../../../../Users/gande/.codex/documentation/standards/types.md#general-types)
- Repository source: [agents/topics/standards/overlay.md](overlay.md) lines 3–8; historical ADD-001.
- Canonical rule: Local additions use repository or folder scope and apply only where the selected set includes their target standard.
- Repository rule: Algorithm32 durable quantities carry units, physical quantity, spectral basis, point/bin meaning, provenance, unit-neutral property names, and explicit radiometric stages; scope selects a governing topic.
- Behavioral difference: Under the old scope, the rule is activated by context instead of the path being changed.
- Information at risk: Scientific meaning must remain required for engine changes even when an app or research topic is active; unrelated application and experiment files must not acquire the requirement.
- Agent recommendation: `add-local`.
- Recommendation rationale: Keep the existing Rule text verbatim and use folder:src/algorithm32/. Combine it with FM-004 in one types.md#General Types ADD because the installed parser rejects duplicate ADD keys. Flat32, scripts, server, and contained copies receive no scientific ADD merely through association or imports.
- Developer decision: `add-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-002).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): The existing rule text is present verbatim in the in-memory merged overlay; sample engine files receive it and application/experiment/tooling files do not.

### FM-003: Reference-backed formula symbols become an engine-folder addition

- Canonical source: [code-conventions.md — JavaScript And Module Shape](../../../../../Users/gande/.codex/documentation/standards/code-conventions.md#javascript-and-module-shape); [documentation.md — Repository Standards Overlay](../../../../../Users/gande/.codex/documentation/standards/documentation.md#repository-standards-overlay)
- Repository source: [agents/topics/standards/overlay.md](overlay.md) lines 10–15; historical DIV-006.
- Canonical rule: Canonical naming remains applicable; local additions are selected by the file's folder.
- Repository rule: Published scientific symbols require identified external authority and an unambiguous code-to-formula mapping, presently under topic scope.
- Behavioral difference: Changing work context currently changes whether the extra provenance condition applies.
- Information at risk: Formula traceability, and the boundary that keeps this requirement local rather than global.
- Agent recommendation: `add-local`.
- Recommendation rationale: Preserve the exact rule and target, replacing only its scope with folder:src/algorithm32/. No global promotion or unrelated-folder expansion.
- Developer decision: `add-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-003).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): The target heading exists; the proposed overlay parses and preserves the original rule.

### FM-004: Scientific profile completeness shares the type-section addition

- Canonical source: [types.md — General Types](../../../../../Users/gande/.codex/documentation/standards/types.md#general-types); [documentation.md — Repository Standards Overlay](../../../../../Users/gande/.codex/documentation/standards/documentation.md#repository-standards-overlay)
- Repository source: [agents/topics/standards/overlay.md](overlay.md) lines 17–22; historical DIV-018; installed standards-config.mjs duplicate-key validation.
- Canonical rule: Named contracts remain canonical; valid local additions refine them in folder scope.
- Repository rule: A scientific profile has a named type, one documented default, caller overrides, complete options, and declared reference differences.
- Behavioral difference: Its topic scope is invalid. A scope-only rewrite also fails because this and the quantity rule share the ADD/target/scope key.
- Information at risk: Dropping this entry to satisfy the parser would silently lose profile completeness and reference-deviation requirements.
- Agent recommendation: `add-local`.
- Recommendation rationale: Preserve its Rule text verbatim alongside FM-002 in one types.md#General Types ADD for folder:src/algorithm32/. Preserve both reasons and keep the two historical rule identities mapped to the one entry.
- Developer decision: `add-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-004).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Scope-only rewrite reproduces duplicate ADD for types.md#General Types; merged in-memory encoding succeeds without changing either constituent rule.

### FM-005: Scientific descriptor non-authority becomes an engine-folder addition

- Canonical source: [code-conventions.md — Validation And Failure Policy](../../../../../Users/gande/.codex/documentation/standards/code-conventions.md#validation-and-failure-policy); [documentation.md — Repository Standards Overlay](../../../../../Users/gande/.codex/documentation/standards/documentation.md#repository-standards-overlay)
- Repository source: [agents/topics/standards/overlay.md](overlay.md) lines 24–29; historical DIV-007.
- Canonical rule: Validate accepted facts at ingress; repository refinements live in folder-scoped overlay entries.
- Repository rule: Descriptors may identify and diagnose evidence but cannot validate executable facts, select algorithms, calculate indexing/packing, or recover executable facts.
- Behavioral difference: The prohibition is currently selected by a topic rather than the implementation path.
- Information at risk: The separation between descriptive metadata and executable numerical authority.
- Agent recommendation: `add-local`.
- Recommendation rationale: Keep the exact rule and target with folder:src/algorithm32/. This does not remove genuine serialized-input validation or promote an experiment descriptor to production authority.
- Developer decision: `add-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-005).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): The target heading exists; the proposed overlay preserves the rule and has no duplicate key.

### FM-006: Remove topic exclusions from the local experiment generator

- Canonical source: [documentation.md — Project Topics](../../../../../Users/gande/.codex/documentation/standards/documentation.md#project-topics); [documentation.md — Reviewer Selection Algorithm](../../../../../Users/gande/.codex/documentation/standards/documentation.md#reviewer-selection-algorithm)
- Repository source: [.agents/skills/start-experiment/SKILL.md](../../../.agents/skills/start-experiment/SKILL.md) steps 3, 5, 7 and Verification; [.agents/skills/start-experiment/scripts/scaffold-experiment.mjs](../../../.agents/skills/start-experiment/scripts/scaffold-experiment.mjs) parseManifestStandards, parseExclusions, topicReadme, and path allocation.
- Canonical rule: Topics cannot select or exclude standards; generators must consume the shared folder configuration rather than implement another selector.
- Repository rule: The skill requires Applicable Files, accepts --exclude, emits Standards Review Scope, and invokes the removed topic-review-scope.mjs helper.
- Behavioral difference: It will fail after normalization or regenerate invalid topic controls. Its topic path also recreates a retired top-level experiments topic.
- Information at risk: Experiment isolation, output/progress records, safe non-overwriting creation, and reviewer refresh must survive removal of the obsolete selection mechanism.
- Agent recommendation: `remove-local`.
- Recommendation rationale: Remove --exclude and generated review-scope prose; use the installed folder resolver for the intended source paths and stop for explicit normalization if a capability needs a different set. Route new documentation to agents/topics/poc-experiments/engineering-studies/<slug>/ and update source instructions accordingly. Do not silently create mappings, overlays, attestations, new execution authority, or an experiment during repair.
- Developer decision: `remove-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-006).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Source inspection confirms old parser/emitter paths. The old global topic-review-scope.mjs file is absent. Reconciliation must validate both creation and check behavior in an isolated scaffold fixture without executing a scientific experiment.

### FM-007: Replace repeated generic coding rules with canonical references

- Canonical source: [documentation.md — Global Standards Ownership](../../../../../Users/gande/.codex/documentation/standards/documentation.md#global-standards-ownership); [types.md — Ambient Types](../../../../../Users/gande/.codex/documentation/standards/types.md#ambient-types); [code-conventions.md — Validation And Failure Policy](../../../../../Users/gande/.codex/documentation/standards/code-conventions.md#validation-and-failure-policy); [jsdoc.md — Types and declarations](../../../../../Users/gande/.codex/documentation/standards/jsdoc.md#types-and-declarations)
- Repository source: [src/algorithm32/README.md#contract-rules](../../../src/algorithm32/README.md#contract-rules) lines 188–230; [agents/topics/algorithm32/cache/cache-design.md#naming-and-ambient-types](../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/cache/cache-design.md#naming-and-ambient-types) and [agents/topics/algorithm32/cache/cache-design.md#contract-and-coding-rules](../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/cache/cache-design.md#contract-and-coding-rules).
- Canonical rule: Canonical files own ingress validation, readonly intent, ambient contracts, callable documentation, class ownership, constants, helper order, and behavioral test principles. The overlay owns local differences.
- Repository rule: Source/topic prose independently repeats those rules, including no Object.freeze, ambient/JSDoc placement, validation, and unit-bearing naming.
- Behavioral difference: Duplicated standards can drift and complicate retiring or splitting the containing topic.
- Information at risk: Selected cache APIs, field/storage ownership, units examples, and physical claim boundaries are product/design facts and must not be deleted with the duplicate prose.
- Agent recommendation: `already-covered`.
- Recommendation rationale: Replace generic restatements with links to canonical sections and the retained scientific ADD. Keep concrete cache semantics and examples with their work owner. FM-008 and FM-009 separately handle information that is not a simple duplicate.
- Developer decision: `already-covered`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-007).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Canonical comparison distinguishes repeated engineering rules from source-owned cache contracts. No application-code compliance finding is inferred.

### FM-008: Retire outdated helper and declaration-placement guidance

- Canonical source: [code-conventions.md — Classes And Utilities](../../../../../Users/gande/.codex/documentation/standards/code-conventions.md#classes-and-utilities); [types.md — Class Types](../../../../../Users/gande/.codex/documentation/standards/types.md#class-types); [types.md — Interface Types](../../../../../Users/gande/.codex/documentation/standards/types.md#interface-types)
- Repository source: [agents/topics/algorithm32/cache/cache-design.md](../production-algorithm32/caches/cache-design.md) lines 925–928 and 2120–2124; [src/algorithm32/README.md](../../../src/algorithm32/README.md) lines 217–225.
- Canonical rule: Class-only helpers are private instance methods; reusable same-domain operations normally use cohesive namespaces. Class-named types and public ambient contracts have distinct canonical locations.
- Repository rule: The cache design prescribes ordinary same-basename exported class declarations and focused neighboring helper functions; the source README describes generic neighboring/utility modules without the current namespace boundary.
- Behavioral difference: These unqualified instructions can direct new work into the pre-normalization shapes rather than the approved canonical ownership rules.
- Information at risk: Actual executable cache names, source-folder ownership, and legitimate independent helper contracts must remain documented.
- Agent recommendation: `remove-local`.
- Recommendation rationale: Remove the obsolete general prescriptions and reference the current canonical rules. Preserve concrete cache vocabulary and ownership. Do not rewrite source code, sealed copies, or completed historical evidence as part of standards reconciliation.
- Developer decision: `remove-local`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-008).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Compared against the complete canonical class, interface, and helper sections; the distinct declaration-only public-interface architecture remains permitted.

### FM-009: Promote assignment-only setters to canonical code conventions

- Canonical source: [code-conventions.md — Classes And Utilities](../../../../../Users/gande/.codex/documentation/standards/code-conventions.md#classes-and-utilities); [jsdoc.md — Descriptions](../../../../../Users/gande/.codex/documentation/standards/jsdoc.md#descriptions)
- Repository source: [src/algorithm32/README.md](../../../src/algorithm32/README.md) lines 225–227, within Contract Rules.
- Canonical rule: Canonical conventions cover helper ownership and getter/setter documentation, but do not require setters to be assignment-only.
- Repository rule: Setters only assign; validation, normalization, derivation, coordination, or other processing uses a named method.
- Behavioral difference: This is a stricter coding rule outside the overlay, not a duplicate that can safely disappear during consolidation.
- Information at risk: Removing all generic-looking README guidance would silently remove this restriction.
- Agent recommendation: `promote-global`.
- Recommendation rationale: Assignment syntax should not conceal processing. This is a general API-design boundary with no scientific or Algorithm32-specific dependency. Promote the existing sentence to canonical code-conventions.md#Classes And Utilities and replace the repository restatement with a canonical link. Do not create a local setter ADD. The rule will apply wherever code-conventions.md is selected, without authorizing unrelated implementation rewrites or edits to protected evidence.
- Developer decision: `promote-global`.
- Developer notes: The developer directed that assignment-only setters and processing in named methods belong in the canonical standards. This supersedes the original add-local recommendation for FM-009; the subsequent blanket approval accepts all ten items and starts reconciliation.
- Re-review required: `no` — The general scope and canonical destination are recorded; the agent recommendation now agrees with the developer's disposition.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Canonical code-conventions.md still has no equivalent processing restriction; its Classes And Utilities section is the selected destination. The local setter entry has been removed from the proposed overlay only.

Accepted canonical wording, now installed:

> Use setters only for direct assignment with no processing; use a named method
> when a state change validates, normalizes, derives, coordinates, or otherwise
> performs work.

### FM-010: Keep live evidence and citation contracts out of engineering-rule consolidation

- Canonical source: [documentation.md — Project Topics](../../../../../Users/gande/.codex/documentation/standards/documentation.md#project-topics)
- Repository source: [AGENTS.md](../../../AGENTS.md); [experiments/extraterrestrial/AGENTS.md](../../../experiments/extraterrestrial/AGENTS.md); [agents/topics/extraterrestrial/stage-12-implementation-topic.md#immutable-run-records](../../../experiments/extraterrestrial/run-contract.md#immutable-run-records); [agents/topics/references/citation-and-retention-policy.md](../../../references/citation-and-retention-policy.md); [agents/topics/testing/README.md#experiment-migration](../poc-experiments/protocols/testing-contract.md#experiment-migration).
- Canonical rule: Selected paths, run identities, verification contracts, research registrations, implementation state, and operations remain project facts rather than generic engineering standards.
- Repository rule: Stage 12 owns the live run protocol even though its implementation history is retired. Citation policy owns exact repository registers. Testing prose proposes a broad Jasmine experiment migration despite the current contained lane's explicit no-unit-test boundary.
- Behavioral difference: Archiving these documents indiscriminately could orphan live instructions or appear to revive a forbidden/stopped workflow.
- Information at risk: Run counters/namespaces, initialization/finalization order, immutable evidence, source/output boundaries, citation identity and license gates, and the contained runner-only restriction.
- Agent recommendation: `already-covered`.
- Recommendation rationale: Preserve these contracts as operations: extract the complete Immutable Run Records section into experiments/extraterrestrial/run-contract.md and repair both AGENTS links before archiving its topic; move citation policy to references/citation-and-retention-policy.md with all consumers repaired. New focus entries link to these owners. Narrow the stale Jasmine migration paragraph so it cannot apply to the contained extraterrestrial lane. Do not copy these project-specific protocols into overlay rules or change evidence, run numbers, source/output roots, permissions, or acceptance gates.
- Developer decision: `already-covered`.
- Developer notes: Accepted by the developer's instruction approving all standards and directing reconciliation; approval includes this item's rationale, scope, and preservation boundaries (FM-010).
- Re-review required: `no` — The developer accepted the recorded recommendation, scope, and preservation boundary.
- Reconciliation result: Applied as approved; see completed verification below.
- Audit evidence (before reconciliation): Read both AGENTS files, the complete run section, citation policy, and testing topic. These are future handoff actions; neither current owner has moved.

### FM-011: Defer new side-experiment placement to the scaffold skill

- Canonical source: [documentation.md - Project Topics](../../../../../Users/gande/.codex/documentation/standards/documentation.md#project-topics); repository `start-experiment` skill and its output contract.
- Repository source: [AGENTS.md](../../../AGENTS.md), contained-experiment boundary; the reconciled `experiments/` folder assignment above.
- Canonical rule: Experiment paths and operational containment are project facts; folder standards apply through the longest matching assignment and do not choose a work topic or experiment root.
- Repository rule: The root instruction restricted every new experiment to the legacy `experiments/extraterrestrial/` and `tmp/extraterrestrial/` roots even though the approved top-level `experiments/` assignment and scaffold skill reserve `experiments/<slug>/` and `tmp/experiments/<slug>/` for new side POCs.
- Behavioral difference: The stale restriction prevents the approved scaffold from creating any new experiment and conflates new independent studies with the sealed extraterrestrial lane and its historical run namespace.
- Information at risk: Removing the restriction without retaining legacy ownership could appear to relocate or reopen existing extraterrestrial evidence.
- Agent recommendation: `remove-local`.
- Recommendation rationale: Remove only the blanket placement restriction for new experiments. Make the `start-experiment` skill and each generated experiment's local instructions/design own new lane roots. Preserve `experiments/extraterrestrial/`, `tmp/extraterrestrial/`, and their run contract unchanged for existing lanes.
- Developer decision: `remove-local`.
- Developer notes: The developer explicitly directed that the restriction be removed in favor of the skill.
- Re-review required: `no` - The direction names both the obsolete restriction and its replacement authority.
- Reconciliation result: Applied as approved in root `AGENTS.md`; no folder assignment, overlay rule, existing experiment root, or historical evidence changed.
- Audit evidence: The `experiments/` folder already resolves to the `code` set, the scaffold helper refuses overwrites, and the generic output contract requires ignored generated output, real-path containment, immutable runs, provenance, terminal states, and monitorable progress.

### FM-012: Apply proof-host standards to the distant-Sun cache experiment

- Canonical source: [documentation.md - Effective Standards For A File](../../../../../Users/gande/.codex/documentation/standards/documentation.md#effective-standards-for-a-file); [server.md](../../../../../Users/gande/.codex/documentation/standards/server.md).
- Repository source: `experiments/distant-sun-cache-optimization/run-c0-baseline.js`; the existing `proof-tools` set and comparable proof-host assignments in this manifest.
- Canonical rule: Folder mappings must select every standard required by a file's evident capability; when source exposes an uncovered capability, review stops for manifest audit and reconciliation.
- Repository fact: The C0 runner owns a loopback HTTP server, static routing, response headers, streaming, and HTTP error translation, while its inherited `experiments/` assignment selected `code` without `server.md`.
- Behavioral difference: Reviewing the runner as generic code would omit the server-boundary rules already applied to equivalent browser proof hosts.
- Information at risk: Assigning an application-server set would add unrelated Polylith/application concerns; leaving `code` would omit the applicable transport and filesystem-service rules.
- Agent recommendation: `already-covered`.
- Recommendation rationale: Reuse the existing `proof-tools` set at the narrow experiment folder boundary. It extends `code` only with `server.md`, matching this contained mixed proof-tool lane without changing its operational authority.
- Developer decision: `already-covered`.
- Developer notes: Accepted under the developer's explicit preapproval of all recommendations; use the narrow experiment folder and do not broaden production or other experiment mappings.
- Re-review required: `no` - The existing set, exact folder, and non-authority boundary are unambiguous.
- Reconciliation result: Assigned `experiments/distant-sun-cache-optimization/` to `proof-tools`; no overlay, production scope, source/output permission, or immutable run changed.
- Audit evidence: Architecture review stopped on the missing `server.md` applicability at the C0 loopback host. The new longest matching assignment selects `proof-tools` for the contained experiment and leaves other experiment folders unchanged.


## Proposed Overlay Encoding

This block is a proposal, not an additional rule authority. It passed the
installed parser in memory. Every existing scientific Rule sentence is retained
verbatim. FM-009 is a separate canonical promotion and creates no local entry.

```markdown
# Repository Standards Overlay

## ADD: Production Algorithm32 scientific quantities, provenance, and profile completeness

Extends: types.md#General Types
Scope: folder:src/algorithm32/
Rule: Public and durable Algorithm32 quantities must carry explicit units, physical quantity, spectral basis, point or bin meaning, and provenance identity; durable property names must remain unit-neutral and hold unit-bearing values, normalized local computational scalars may use unit suffixes, and radiometric names must distinguish source irradiance before source-path attenuation, incident irradiance after attenuation, and directional incident radiance. A scientific profile must be a named type with one documented default, caller-supplied overrides, every configurable option relevant to the profile, and every difference from the paper or reference configuration it represents.
Reason: Production Algorithm32 contracts must preserve the meaning, stage, and provenance of scientific values across CPU, GPU, cache, and serialization boundaries. Production Algorithm32 profiles encode selected scientific configurations whose defaults, options, and reference deviations must remain explicit.

## ADD: Production Algorithm32 reference-backed formula symbols

Extends: code-conventions.md#JavaScript And Module Shape
Scope: folder:src/algorithm32/
Rule: A scientific implementation may retain a published formula symbol only when owning documentation or an adjacent comment identifies its external authority and makes the code-to-formula mapping unambiguous.
Reason: Production Algorithm32 source must keep compact scientific notation traceable to its reference authority without weakening the general descriptive-identifier rule.

## ADD: Production Algorithm32 scientific descriptor non-authority

Extends: code-conventions.md#Validation And Failure Policy
Scope: folder:src/algorithm32/
Rule: Scientific descriptors may identify, fingerprint, report, and diagnose evidence but must not validate executable facts, select algorithms, calculate indexing or packing, or recover executable facts.
Reason: Production Algorithm32 must keep executable numerical authority separate from descriptive evidence metadata.

```

## Configuration and reference findings

| Check | Current finding | Proposed resolution / evidence |
| --- | --- | --- |
| Missing applicable standards | No new canonical concern recommended beyond the existing eleven; the current malformed manifest cannot assign any of them by folder. | FM-001 and capability table. |
| Sets and assignments | Standards Sets and Folder Assignments sections and root assignment are absent. | Proposed nine sets / 26 assignments parse; no cycles, duplicate folders, missing parents, inherited duplicates, or nonexistent assigned folders. |
| Overlay syntax | Four topic scopes are invalid. | FM-002 through FM-005. |
| Duplicate overlay keys | Scope-only rewrite fails on the two types.md#General Types additions. | Merge their exact Rule and Reason text; do not weaken either rule or change the global parser. |
| Targets and precedence | Existing target standards and named sections exist; no REPLACE entries or competing replacements. | Three proposed ADD entries parse with existing canonical section targets. |
| Canonical links | All eleven selected links resolve beneath the current global standards root. | Shared-parser candidate check plus real-path validation. |
| Misplaced standards | Generic and outdated coding prose remains in mixed source/topic documents; setter restriction is distinct. | FM-007 through FM-009. |
| Obsolete topic controls | No live emitted Standards Review Scope heading was found outside the generator template; four overlay scopes and the generator's Applicable Files/exclusion mechanism remain. | FM-006; historical archive/report mentions are evidence, not configuration. |
| Broken workflow reference | Local skill names removed topic-review-scope.mjs. | Replace with folder resolver and normal gated context refresh. |
| Stale descriptive references | Production architecture calls the overlay topic-scoped; completed integration-plan prose names production-topic rules. | Repair current descriptive links/wording at reconciliation; label completed historical statements as history rather than changing evidence. |
| Competing report authority | Earlier report says normalized/current under the old model. | Preserve it only in the historical appendix; this current audit controls status and decisions. |
| Generated guide | STANDARDS.md has the exact generator warning and is therefore not a competing authority, but its topic-model projection is stale. | Generate and check only after approved reconciliation and valid attestation. |
| Operational dependencies | Both AGENTS files link the Stage 12 run contract; citation policy and testing topic retain live/stale workflow boundaries. | FM-010; no archival before successful contract extraction and consumer repair. |
| Historical evidence | Sealed Star/candidate/baseline/snapshot and existing archive material remain protected. | No content rewrite, test execution, or new acceptance claim. |

The proposed scope does not automatically include `scripts/algorithm32/`.
Those files are production support, but the earlier scientific addition was
explicitly Algorithm32-only and excluded other lanes. The narrow source-folder
mapping is the recommended conversion; any later extension to tooling requires
its own explicit scope decision.

The scope audit also found stale governance language in canonical
`architecture.md#Canonical Documentation Ownership` referring to exceptions
in a manifest and fixed topic paths. Canonical `documentation.md` explicitly
owns governance and takes precedence within this standards system. No global
edit is needed to implement the proposed local configuration; fixed topic paths
are not copied into the new routing.

## Operational Handoff And Reconciliation Sequence

After manual approval and an explicit reconciliation request:

1. Re-read source hashes and decisions; re-audit any materially changed source.
2. Install the approved folder manifest and scientific overlay encoding; promote
   FM-009 to canonical code-conventions.md#Classes And Utilities, without
   repository-specific wording or a duplicate local setter entry.
3. Replace the specified duplicate/obsolete coding paragraphs with canonical
   references, preserving concrete design facts and approved local rules.
4. Repair the local experiment skill/helper using the skill-authoring workflow.
   Retain containment, non-overwrite creation, monitorable progress, and the
   existing source/output contract; do not run or start an experiment.
   The approved work-topic destination does not enlarge the source-write
   authorization in repository AGENTS. New experiments still require their
   own explicit authorized boundary.
5. Extract the full operational run contract, move the citation-policy owner,
   repair inbound consumers, and clarify the contained test boundary as FM-010
   specifies. Preserve historical snapshots before topic retirement.
6. Audit the resulting repository standards surface again. Include both
   applicable AGENTS files, manifest/overlay, and the repaired local skill and
   helper as explicit attestation inputs when automatic discovery omits them.
   These latter files can otherwise recreate obsolete configuration.
7. Only with no pending, ambiguous, or deferred decisions, create and validate
   the normalization attestation through the installed helper.
8. Generate/check STANDARDS.md and run the reviewer eligibility gates. Then
   continue the approved topic-consolidation plan. Any instruction/configuration
   changes during the final cutover require another valid reconciliation;
   do not hand-edit the attestation to make migration appear complete.

Neither a parser pass nor approved folder configuration claims source compliance
or authorizes changes to protected evidence. No automated audit recommendation
counts as the developer's approval.

## Review gate

- [x] Every FM divergence has been reviewed manually.
- [x] No current developer decision remains `pending`.
- [x] Decisions differing from recommendations include sufficient clarification.
- [x] No source, folder, or precedence ambiguity remains.
- [x] The developer has explicitly requested reconciliation after reviewing this report.

## Generated developer guide

- Guide status: `stale-topic-model`; not regenerated in audit mode.
- Guide source fingerprint: historical only; see appendix.
- Guide validation evidence: current folder validation fails before generation.

## Validation Evidence

- Current attestation validator: fails with missing `## Standards Sets`.
- Current folder resolver: same blocking error.
- Independently parsed current overlay entries: all four reject `topic:` scope.
- Scope-only overlay rewrite: rejects duplicate ADD for
  `types.md#General Types` in `folder:src/algorithm32/`.
- Proposed in-memory manifest: nine sets, 26 existing assignments, eleven
  canonical standards; all selected real paths remain beneath the global root.
- Proposed in-memory overlay: three ADD entries, all section targets exist;
  all four original scientific Rule sentences survive verbatim.
- Deterministic mapping exercised on 6,355 inspected filesystem paths.
  This inventory excludes dependency/build/output/archive/data roots from
  source-content verification; it is not a scientific artifact inventory.
- Engine and React-binding samples receive all three proposed ADD entries;
  Flat32, legacy React app, server, compiler tooling, contained proof host,
  and topic/skill-documentation samples receive zero scientific additions.
- `npm run format:check` passed in the preceding handoff preflight; its ignore
  configuration excludes this report and the contained source tree. It is
  not evidence that those excluded surfaces were formatted or reviewed.
- No reviewer started; no build, scientific experiment, or application test
  was run during this configuration audit.

### Audited inputs at report preparation

Hashes identify this audit's inputs, not a normalization attestation. Re-read
them before reconciliation. The old report's raw-byte SHA-256 was
`2a7cc31c91283d03681a73236b969ca84eaada5ace800321fbe7ce312a7b82a1`; its text and developer decisions are retained below.
Ordinary newline normalization of this report is not historical-evidence
archive verification.

| Repository input | SHA-256 |
| --- | --- |
| `AGENTS.md` | `5c674a402ad008f4c46c570df13fe2cd23719ae311d2782950885ec248c33b54` |
| `experiments/extraterrestrial/AGENTS.md` | `e32c9235529cbee629fe59f654596b3da370dcfe35585ca64a3e2e27a358e93e` |
| `agents/topics/standards/manifest.md` | `7a3d4f0a96420049b4c5418f0c43cf49d7b2fb33ae15df3dbe2200b6901ace31` |
| `agents/topics/standards/overlay.md` | `e4d8c24a24af713339c91d983d048c5c9d57c9ae51f7555eb2cc34e77e2d33d0` |
| `agents/topics/standards/normalization.json` | `95092c053ea25053f520fd53932e5bde36f91ba91868c3a507ec6208c5959cbb` |
| `STANDARDS.md` | `d58dbbb6919c0bbd9624baf63a0b39f77745bf880d6fa399153da39dff9d1da6` |
| `.agents/skills/start-experiment/SKILL.md` | `fd691efaa815e788ec4b8f5e502908e7392231cac6391a22c1a9763ab2e481d9` |
| `.agents/skills/start-experiment/scripts/scaffold-experiment.mjs` | `f3ea746adea9fb89f5ecbef5f1f6a7813405396124be974cc9020357d908aee0` |
| `.agents/skills/start-experiment/references/output-contract.md` | `7127d72560bf6e7425b2b3d7d439d89e2a005a695305a4a8d94305faac099f93` |
| `agents/topics/extraterrestrial/stage-12-implementation-topic.md` | `961c7f8ec9d723951e815b9ba9500a3e0c4db78079449aa0c0a818c2066dddda` |
| `agents/topics/references/citation-and-retention-policy.md` | `b6a80070e4269ced6d5d31661534c7da2b19ebcd3404d0d651d3aa86ff1b5de1` |
| `agents/topics/testing/README.md` | `ffce96e702f81a4d26ffa9b42e65aafea7d64c31bfa69e67b94cc38d19a3fdda` |
| `src/algorithm32/README.md` | `19411ade7e7fb4bab4949fc1902da4d685a64fefafd0019dda9b6c884df9ac6a` |
| `agents/topics/algorithm32/cache/cache-design.md` | `e0fc5b7f34037cdd58ddf04ac3730d659e8ab48dd0d22fcaee204345714da591` |
| `agents/topics/algorithm32/production/architecture-boundaries.md` | `0fd0c5fc320e75d7c6c57dbb0818f8b050b2fd718893ff24942400c01713abf0` |

| Canonical input | SHA-256 |
| --- | --- |
| `README.md` | `f9b3791e316bcd4cab14a2c4ff500df61ff119719baba7b26f9788bfc1cb61eb` |
| `accessibility.md` | `cb8f27418f3a00b324a610a87ec651976fcc8f412946e688b39e346688787f80` |
| `app-shells.md` | `35ca6835c0b4e109bbacdf32f6134835c2d2c11ce48e6a2348ccfc80eb572777` |
| `architecture.md` | `1d7164c0354d727007485ab389db7e529c76b37fc20a7ef050018ed32ccbfbcf` |
| `base-components.md` | `a1a95a9358415bb4dc3b7e4ff6b2746b8c440189571a9be2f4d67f0fb58edf4b` |
| `code-conventions.md` | `33d8209b33f79c8718feb67bbfd2cf82235c1a154ede37acec0cd8e93d83fedc` |
| `data-persistence.md` | `7ebdea6df0c9e0a33fb2061110c122831ddcfc90752511509d778dc146cf85ba` |
| `documentation.md` | `489d8b4aaa329512da62e0c63fe5282903df627f3dc8d634d9fc7b442a0b8078` |
| `jsdoc.md` | `cddf34f7ee6e7574c53d27a44fb0a5c5eca252cc3626c9adf42a49c3900c4166` |
| `local-https.md` | `b29a31c68f9cca5eba865e9c2ebb0a11fa92b777df759eeb371a8f227960f353` |
| `localization.md` | `65f9a732a3cade0e1f1e8689d17ea68e27db2a051d4b198d1d6a11c4d6f741e2` |
| `mui.md` | `1a66f9359d17614ede19479e793c757dd97cdd7d28192587b0ee6e0b769d8086` |
| `polylith.md` | `b150363644980a0af74215cbe6cabb1dab1c98a65e039eba00409cf2a3f373b5` |
| `project-foundation.md` | `b8d22fc7ccf0cea43bcc32f98e2ef38c8103abc22892717377a5c3d577894583` |
| `react.md` | `a556d9bb8c37d4974bcca5813c2174c198f62fb7b2b0e62648b2915ef0e1793c` |
| `remvc.md` | `284fc7929493c6493612c23311cfca9785a650bf9c4b09d50ce8b6420966dd53` |
| `server.md` | `47c93e38f4b8f63af9056fd34d307292b877df488bc3c487e2e0b6c53a0adb75` |
| `socket-io.md` | `f7373a1e9d87de3c94e476b8b40025aea66713f6ef8bb5e2d983eaab2079bb32` |
| `testing.md` | `d5aa5ff4df35e0c70c437f09003da936e9c04b5f52cb4178517377e1cf0cfc53` |
| `types.md` | `add94e8ae068472256227ecd38245c77d14892a8e50f34fbeed35ca42553eb8c` |

## Final validation

- [x] Every approved decision was applied exactly as recorded.
- [x] No pending decision was applied.
- [x] All sets, assignments, canonical links, targets, and overlay scopes validate.
- [x] Every retained local engineering rule has one overlay owner.
- [x] No active topic-based standards controls or generator path remains.
- [x] Live operational contracts and all current consumers retain valid owners.
- [x] Protected evidence remains unchanged.
- [x] Re-audit has no unexplained divergence or ambiguity.
- [x] Attestation creation and validation succeeded through reconciliation.
- [x] Generated developer guide reports current.
- [x] Reviewer eligibility helpers and topic cutover link/coverage checks succeeded.
- Reviewer roster refresh: partial; the environment rejected additional reviewer threads. The existing UI lane is READY for the final checkpoint-handoff context at `sha256:c54470b4a902e1d366596e405c1ec4bbe3cc130f66c3ba162c63c459c95a94be`. No full standards-review result is claimed.


## Completed Reconciliation Evidence

- FM-001: Installed nine sets and the original 26 folder assignments; shared parser and real-folder validation pass.
- FM-002/FM-004: Preserved quantities/provenance and complete scientific profiles in one engine-folder types ADD, avoiding duplicate target/scope keys.
- FM-003/FM-005: Preserved formula-symbol and descriptor non-authority ADD entries at src/algorithm32/.
- FM-006: Create/check fixture passes with folder-resolved set code. Existing destination and obsolete --exclude are rejected. A malformed manifest fails before any destination is created. Node syntax and skill quick validation pass. The disposable fixture was removed; no scientific experiment ran.
- FM-007/FM-008: Removed approved duplicate and obsolete coding prose, retaining concrete cache/API facts and canonical links. Original topic bytes remain in verified history.
- FM-009: Installed the assignment-only setter restriction in canonical code-conventions.md, Classes And Utilities. The global file is outside this repository checkpoint.
- FM-010: Complete immutable-run contract now lives at experiments/extraterrestrial/run-contract.md; citation policy lives under references/. Current consumers are repaired; contained experiments remain runner-only and closed lanes remain closed.
- FM-011: New side experiments defer placement and operational containment to `start-experiment`; the legacy extraterrestrial source, output, and run contracts remain unchanged for existing lanes.
- FM-012: The distant-Sun cache experiment maps to `proof-tools`, adding the already-selected server standard at the narrow proof-host boundary without broadening authority.
- FM-013: The GPU-resident shared-block-cache experiment maps to `proof-tools` at its browser proof-host boundary.
- FM-014: The shadow-animation evidence experiment maps to `proof-tools` at its browser request-interception boundary.

- Attestation create/validate: `sha256:48e285217b8a224caae6e1a43d44cacc59e1acf215c1417a773ddd9604c88791`, six audited inputs including the new experiment-local instructions.
- Generated guide write/check: current at `sha256:6b20eecf20ce0906dc9a3bd23fae365721632412a42a50f20ccc0d007aa08337`.
- Folder parser, canonical-root validation, formatting preflight, and `npm run format:check`: pass.
- Protected topic evidence: all 66 frozen files byte-hash unchanged; original-topic ZIP retains its verified SHA-256.
- Topic cutover: five work topics and folder-independent focus routing; [migration verification](../context/topic-migration-archive-index.md) owns relocation evidence.

Normalization status: `normalized`. All current decisions are accepted and applied;
none is pending, ambiguous, or deferred. Reviewer thread capacity does not alter
the standards authority or imply a complete code-compliance review.

## Historical Reconciliation Archive — 2026-09-04

The following report is retained as historical developer-decision evidence.
Its normalized/current claims, Applicable Files model, topic scopes, old
validation results, and references to removed files are not current guidance.
Unchanged substantive decisions remain historical approvals; the current FM
items explicitly identify which scope/ownership changes require re-review.

<details>
<summary>Preserved prior reconciliation report and developer decisions</summary>


# Standards Reconciliation

## Status

- Repository: `C:\dev\flattened-steel`
- Canonical standards root: `C:\Users\gande\.codex\documentation\standards`
- Standards governance: [Standards Governance](../../../../../Users/gande/.codex/documentation/standards/documentation.md)
- Generated developer guide: root `STANDARDS.md` is current at source fingerprint `sha256:c1b9ee10ccf45714a4ee306b097baa8b2535b07d00c604c824356b7c90f360ef`.
- Normalization attestation: valid at repository standards fingerprint `sha256:2a0cf1dbfa5a068476be00aac94899021a8f143fddc4e3b6b2559e386368da23` with 5 inputs.
- Audit date: 2026-09-04
- Audit basis: repository commit `20db38fbed50513e29e193c004bf78345af5f6a3`; current repository and Codex-home instructions; the complete canonical standards library; the `manifest.md`, overlay, generated-guide, topic-scope, reviewer-selection, and attestation governance contract in `documentation/standards/documentation.md`; all documents below `agents/topics/standards`; and the former domain supplement `agents/topics/algorithm32/standards.md`. Pre-existing working-tree changes were treated as developer-owned and were not modified. This report was refreshed for the current governance model and refreshed again after the approved experiment-root relocation on 2026-09-04.
- Phase: `reconciled`

## Summary

### Experiment-root relocation audit

- The repository owner moved the tracked experiment root from `scripts/extraterrestrial/` to `experiments/extraterrestrial/` so top-level `experiments/` can own side POC projects.
- This is an operational repository-path change, not a new or changed engineering standard. It creates no new divergence or developer disposition.
- All 2,185 paths tracked at the former root have a mapped file at the new root, and the former source root is absent.
- Repository-owned live links, commands, imports, containment paths, and documentation references now use `experiments/extraterrestrial/`; the immutable generated-output root remains `tmp/extraterrestrial/`.
- No broken Markdown link into the relocated tree was detected. Reconciliation replaced the stale generated attestation rather than hand-editing it.
- The repository-local `start-experiment` skill is operational scaffolding: it selects no canonical standard, defines no overlay precedence, and explicitly denies itself standards authority. Its generated paths, topic documents, output contract, and progress records are experiment configuration and workflow facts rather than an additional standards source.

| Recommended disposition | Count |
| --- | ---: |
| `promote-global` | 5 |
| `add-local` | 5 |
| `replace-local` | 0 |
| `remove-local` | 7 |
| `already-covered` | 5 |
| `defer` | 0 |

### Developer-selected dispositions

| Selected disposition | Count |
| --- | ---: |
| `promote-global` | 6 |
| `add-local` | 4 |
| `replace-local` | 0 |
| `remove-local` | 7 |
| `already-covered` | 5 |
| `defer` | 0 |
| `pending` | 0 |

### Repository additions

| Classification | Count |
| --- | ---: |
| Scoped repository additions recommended for `ADD` entries | 5 |

### Canonical comparison classes

| Comparison class | Count | Items |
| --- | ---: | --- |
| Conflicting standards or governance configuration | 4 | DIV-010, DIV-017, DIV-020, DIV-021 |
| More exact repository standards | 3 | DIV-004, DIV-009, DIV-016 |
| Duplicate, inapplicable, or ownership findings | 10 | DIV-001, DIV-002, DIV-003, DIV-008, DIV-011, DIV-012, DIV-013, DIV-014, DIV-015, DIV-019 |

## Standards Management Model

- `agents/topics/standards/manifest.md` is the machine-readable applicability manifest. It selects applicable canonical standards under its exact `## Applicable Files` section and links `overlay.md`; it contains no local standards rules.
- `agents/topics/standards/README.md` is not a standards input or applicability manifest. The current file may remain temporarily as developer-review evidence during the manual gate, but its authority claims must not survive reconciliation.
- The global `$bootstrap` flow is the normal repository-session entry point. It loads Codex-root and repository `AGENTS.md` instructions, then invokes `review-standards` bootstrap mode; that standards workflow reads `manifest.md` and `overlay.md`. `review-standards` remains independently invokable in each of its declared modes and performs its own authority loading and gates when called directly.
- Repository `AGENTS.md` may defensively warn that an ordinary session opened outside `$bootstrap` should run it before standards-driven work. The warning must not redirect an explicitly invoked workflow such as `$review-standards` or `$normalize-standards` that owns its own repository-entry procedure. It must also distinguish initial/direct entry from post-compaction reload: known initialized sessions follow the active topic's minimal reload procedure without recursively bootstrapping, while sessions that cannot establish prior initialization run `$bootstrap`.
- A manifest-listed standard can apply anywhere its concern exists. An omitted standard is repository-inapplicable, and no topic or overlay entry may enable it.
- `agents/topics/standards/overlay.md` is mandatory and is the sole repository authority for local engineering-standard differences.
- An overlay entry is either `ADD`, which keeps the referenced canonical rule and adds a scoped requirement, or `REPLACE`, which supersedes only the named canonical rule in the declared scope.
- Every overlay entry has a descriptive heading and exactly four nonempty single-line fields: `Extends` or `Replaces`, `Scope`, `Rule`, and `Reason`.
- An empty overlay is exactly `# Repository Standards Overlay`, one blank line, and `None.`
- Product requirements, selected configuration, paths, routes, data models, current implementation state, and operational facts remain in ordinary project topics and do not enter the overlay.
- A topic-specific overlay rule uses the exact `Scope: topic:<repository-relative-topic-path>` form and applies only when that exact existing topic governs the task.
- A governing topic may contain one optional `## Standards Review Scope` section that excludes manifest-listed standards from automatic monitoring. Topic exclusions do not change rule meaning or repository applicability.
- Direct changed-path or content evidence re-enables an excluded standard. Evidence for a manifest-omitted capability stops review and requires manifest reconciliation.
- Root `STANDARDS.md`, when generated by `$write-standards-guide`, is a human-readable projection of the manifest, overlay, and topic review exclusions. It is never an authority or a fourth standards input; missing or stale generated output is reported separately and does not invalidate normalization or block reviewers.
- Reconciliation may move only manually approved `add-local` and `replace-local` rules into the overlay. It may not apply pending or deferred items.
- Only `$normalize-standards reconcile` may create or refresh the attestation. Applicable `AGENTS.md`, the manifest, and the overlay are repository-owned attestation inputs; global standards are loaded fresh. Topic files affect reviewer topic-context fingerprints rather than repository normalization, so manifest or overlay changes stale the attestation while topic-scope changes require reviewer refresh rather than normalization.
- After the final attestation validates, reconciliation runs `$write-standards-guide` in write mode and then check mode. Guide generation failure does not invalidate the attestation, but it must be reported with the recovery command.

## Identical Standards Documents

### Exact file identity

No complete repository standards document is byte-for-byte identical to its
canonical counterpart. SHA-256 comparison was performed for every direct
same-subject pair identified by this audit.

### Semantic identity

| Repository document | Canonical document | Identity evidence | Developer notes / action |
| --- | --- | --- | --- |
| `agents/topics/standards/types.md` | `documentation/standards/types.md` | Every substantive section and rule is identical. Only the status phrase differs: "repository-wide starting standard" locally and "canonical standard" globally. This is audit item DIV-002. | |

No other complete local standards document is semantically identical to its
canonical counterpart. Documents containing only partially duplicated rules
remain listed under "Duplicate And Ownership Findings" rather than here.

## Canonical Comparison Details

### Conflicting Standards

These items select different authority, permit different implementation
shapes, assign different release weight, or authorize behavior that the
canonical standard does not. They require an explicit choice; added precision
alone cannot reconcile them.

| Item | Conflict | Developer notes / action |
| --- | --- | --- |
| DIV-010 | Class-default React components versus equal acceptance of function components with hooks. | |
| DIV-017 | Builder-owned generated output versus temporary direct synchronization into `dist`. | |
| DIV-020 | Canonical index still labels `documentation.md` as covering "exceptions" while the governance document permits only overlay `ADD` and `REPLACE`. | |
| DIV-021 | Canonical governance assigns manifest and overlay routing to repository `AGENTS.md` instead of the global bootstrap/reviewer flow. | |

### More Exact Repository Standards

These items refine a compatible canonical principle with narrower tests,
semantics, or tool-specific detail. Their added information should be judged
for promotion or retained scope without treating them as contradictions.

| Item | Added precision | Developer notes / action |
| --- | --- | --- |
| DIV-004 | Explicit accepted abbreviations and ambiguity tests for general identifiers. | |
| DIV-009 | Accessor, generator, overload, and error/async JSDoc rules. | |
| DIV-016 | Exact Polylith copied-asset descriptor and emitted-path semantics. | |

### Duplicate, Inapplicable, And Ownership Findings

These items do not select a contradictory rule or materially refine a
canonical rule. They concern copied standards, incomplete forks, or mutable
project facts stored under standards ownership.

| Item | Finding | Developer notes / action |
| --- | --- | --- |
| DIV-001 | Local standards documents are developer-review inputs, but the current README still presents them as active standards owners while the separate required `manifest.md` is absent. | Applicability comes from global rules and `manifest.md`; preserve local documents only as review evidence during reconciliation. |
| DIV-002 | Type standard copied locally. | |
| DIV-003 | Shared code-convention baseline duplicated and incomplete locally. | Use the canonical baseline; transplant the separately inventoried scientific/reference rules into `overlay.md` with `Scope: topic:agents/topics/algorithm32/production/README.md`. |
| DIV-008 | JSDoc baseline partially forked locally. | |
| DIV-011 | Optional accessibility guidance is local standards prose for a capability that can be omitted as repository-inapplicable. | |
| DIV-012 | Optional localization guidance is local standards prose for a capability that can be omitted as repository-inapplicable. | |
| DIV-013 | Architecture, REMVC, and Polylith principles restated locally. | |
| DIV-014 | Durable testing principles restated locally. | |
| DIV-015 | Mutable Algorithm32/Flat32 runner state stored in a standards document. | |
| DIV-019 | Current experiment/production diagnostics posture is an operational and design fact, not a reusable engineering standard. | |

## Detailed Audit Records

### DIV-001: Developer-review standards index competes with the missing applicability manifest

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/documentation.md` sections "Effective Standards Resolution," "Generated Developer Guide," "Global Standards Ownership," and "Repository Applicability Manifest."
- Repository source: `agents/topics/standards/README.md` sections "Current Standards" and "Coding Standard Authorities" (especially line 26).
- Canonical rule: global standards live only below the Codex-home standards root; the separate repository `manifest.md` selects applicable canonical filenames and links the mandatory `overlay.md`; all local engineering-standard differences live exclusively in that overlay as scoped `ADD` or `REPLACE` entries. A generated root `STANDARDS.md` is the human-readable projection and contributes no rules.
- Developer clarification: the local standards documents exist for developer review; applicable standards are determined by the global rules and repository manifest.
- Current repository text: the README still identifies repository-local documents as owners of repository-wide coding rules. The required `manifest.md`, mandatory overlay, and generated root guide are absent.
- Behavioral difference: intended authority and written authority differ. Reviewers have no machine-readable applicability selection, while the developer-review index still claims authority that belongs only to canonical standards plus the overlay. The absent generated guide is a separate nonblocking presentation gap.
- Information at risk: the developer-review evidence and useful local distinctions could be lost if the local documents were removed before every rule receives a disposition.
- Agent recommendation: `remove-local`
- Recommendation rationale: preserve the local documents as review inputs throughout the manual gate, create the separate required `manifest.md`, and remove the README's standards-authority claims after every useful rule is promoted, encoded in the overlay, relocated as a project fact, or found already covered. Generate root `STANDARDS.md` only after the final attestation validates.
- Developer decision: `remove-local`
- Developer notes: Local standards documents are retained as developer-review evidence through reconciliation, but their standards-authority claims must be removed. Applicable standards are based on global rules selected by `manifest.md`, modified only by `overlay.md`; the generated root `STANDARDS.md` becomes the human-readable reference.
- Re-review required: `no` — the settled manifest, overlay, and generated-guide model determines the disposition without discarding the documents before their useful material is migrated.
- Reconciliation result: Removed the legacy local standards owners after their approved rules and facts were migrated; created the separate manifest, overlay, and generated root guide.
- Validation evidence: `agents/topics/standards/` now contains only `manifest.md`, `overlay.md`, `reconciliation.md`, and `normalization.json`; root `STANDARDS.md` is generated and current.

### DIV-002: Type conventions are a byte-for-byte canonical copy apart from status text

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/types.md`, complete document.
- Repository source: `agents/topics/standards/types.md`, complete document.
- Canonical rule: the canonical document owns ambient, class, interface, and string-union contracts.
- Repository rule: the local document repeats every substantive canonical rule and changes only the status from "canonical standard" to "repository-wide starting standard."
- Behavioral difference: there is no semantic rule difference, but the local copy can drift and currently claims competing ownership.
- Information at risk: none beyond the repository's applicability decision and links to the canonical owner.
- Agent recommendation: `already-covered`
- Recommendation rationale: replace the local restatement with a manifest reference to `types.md`.
- Developer decision: `already-covered`
- Developer notes: Original decision text: "no local override."
- Re-review required: `no` — the original "no local override" direction maps unambiguously to `already-covered`, and CFG-001 approves selecting the canonical type standard in the manifest.
- Reconciliation result: Removed the local `types.md` copy and selected canonical `types.md` in the manifest.
- Validation evidence: The manifest resolves `types.md`; no repository copy remains.

### DIV-003: Code-convention baseline is duplicated locally

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/code-conventions.md` sections "JavaScript And Module Shape," "Classes And Utilities," "Validation And Failure Policy," and "Formatting."
- Repository source: `agents/topics/standards/code-conventions.md` sections "Formatting," "File Naming And Placement," "Test Scope," "File Size," "Class Files," and "Validation."
- Canonical rule: the canonical standard owns JavaScript/module shape, class sizing, ingress validation, current-contract tests, and Prettier configuration and commands.
- Repository rule: the local standard restates those rules, often with more examples, while omitting the canonical recoverable-failure policy and exact root `format:check` contract.
- Behavioral difference: overlapping rules can drift; the local copy already gives an incomplete view of the current canonical formatting and failure contracts.
- Information at risk: the separately inventoried narrower identifier and utility rules, plus the scientific and reference-based repository additions, must not be removed with the duplicated baseline.
- Agent recommendation: `already-covered`
- Recommendation rationale: use the canonical code standard for the shared baseline and resolve DIV-004 through DIV-007 before retiring local prose. Transplant approved scientific/reference rules into `overlay.md` with `Scope: topic:agents/topics/algorithm32/production/README.md`; Algorithm32 topic documents may link to those entries but must not contain the standards text.
- Developer decision: `already-covered`
- Developer notes: transplant the science and references rules to be overrides in the algorithm32 topic
- Decision interpretation: "overrides in the algorithm32 topic" means entries owned by `agents/topics/standards/overlay.md` with the exact scope `topic:agents/topics/algorithm32/production/README.md`. It does not make `agents/topics/algorithm32/standards.md` or another topic document a standards authority. The separately inventoried rules remain `ADD` candidates because their canonical targets stay applicable.
- Re-review required: `no`
- Reconciliation result: Removed the duplicated local code-convention baseline; promoted its approved general additions and moved its approved scientific/reference rules to the overlay.
- Validation evidence: Canonical `code-conventions.md` is selected; the overlay contains the production-topic additions and the former local file is absent.

### DIV-004: General identifier guidance is materially more precise than the canonical rule

- Comparison class: `more-exact-standard`
- Canonical source: `documentation/standards/code-conventions.md` section "JavaScript And Module Shape," line 16.
- Repository source: `agents/topics/standards/code-conventions.md` section "Identifier Naming," lines 41-64.
- Canonical rule: use descriptive identifiers and allow short names when locally unambiguous.
- Repository rule: identifies accepted abbreviations and coordinate names and requires ambiguity-sensitive renaming. Its separate scientific formula-symbol rule is classified under repository addition DIV-006 below.
- Behavioral difference: the repository rule makes ordinary short-name acceptance reviewable; the canonical rule leaves those choices to local judgment.
- Information at risk: the explicit ambiguity test for general-purpose identifiers.
- Agent recommendation: `promote-global`
- Recommendation rationale: the accepted abbreviations and ambiguity test are general JavaScript guidance without repository-specific names and can strengthen the canonical rule. The reference-authority requirement for scientific symbols remains repository-owned.
- Developer decision: `promote-global`
- Developer notes: Original decision text: "promote the extended rules to the global standards."
- Re-review required: `no`
- Reconciliation result: Expanded canonical identifier guidance with the approved abbreviations, coordinate names, and ambiguity tests.
- Validation evidence: Canonical `code-conventions.md#JavaScript And Module Shape` contains the promoted rule without repository-specific names.

### DIV-005: Class helpers and utilities follow a narrower namespace-first policy

- Comparison class: `repository-addition`
- Canonical source: `documentation/standards/code-conventions.md` sections "JavaScript And Module Shape" and "Classes And Utilities."
- Repository source: `agents/topics/standards/code-conventions.md` sections "Class Files" and "Utility Files," lines 85-127.
- Canonical rule: class-specific support stays on the class; reusable operations may use an ordinary cohesive module or namespace.
- Repository rule: class-only support must be private instance methods, never private static or module-local functions; reusable similar-domain operations default to a PascalCase namespace, and existing multi-export modules are evaluated and redistributed function by function.
- Behavioral difference: the local standard prohibits module-local or private-static class helpers and substantially narrows when ordinary function modules are acceptable.
- Information at risk: a deliberate repository preference for namespace ownership and the function-level migration test.
- Proposed overlay mapping: `Extends: code-conventions.md#Classes And Utilities`; scope the rule to authored repository JavaScript class and utility modules, excluding vendored and generated sources.
- Agent recommendation: `add-local`
- Recommendation rationale: the canonical class/utility rule remains applicable and this repository adds a stricter scoped requirement. If approved, encode it as one or more exact `ADD` entries in `overlay.md`; do not keep it in `code-conventions.md` or the manifest.
- Developer decision: `promote-global`
- Developer notes: Original decision text: "promote the more restrictive guidance to global standards."
- Re-review required: `no` — the explicit instruction to promote the stricter guidance globally already uses a valid current disposition and supplies enough direction for reconciliation.
- Reconciliation result: Promoted the instance-only class-helper rule, cohesive namespace default, and function-level utility ownership test globally.
- Validation evidence: Canonical `code-conventions.md#Classes And Utilities` contains the promoted guidance; no local overlay entry was created.

### DIV-008: JSDoc baseline is a partial local fork

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/jsdoc.md`, complete document.
- Repository source: `agents/topics/standards/jsdoc.md` sections "Complex Parameters And Returns" through "Implemented Interfaces."
- Canonical rule: the canonical document owns declarations, descriptions, and tags, including the application-service declaration exception, shared `EventBus` alias, blank line before tags, and the prohibition on adopting `@event`, `@fires`, or `@listens` globally without evaluation.
- Repository rule: repeats most shared callable/entity/type rules but does not contain those current canonical service and tag rules.
- Behavioral difference: relying on the local document omits active canonical constraints and can create incompatible service declarations or JSDoc layout.
- Information at risk: the additional accessor, overload, generator, and error/async detail inventoried in DIV-009.
- Agent recommendation: `already-covered`
- Recommendation rationale: reference canonical `jsdoc.md` after deciding whether to promote the useful local additions.
- Developer decision: `already-covered`
- Developer notes: Original decision text: "no local override, default to global standards."
- Re-review required: `no`
- Reconciliation result: Removed the partial local JSDoc fork and selected canonical `jsdoc.md` in the manifest.
- Validation evidence: The manifest resolves `jsdoc.md`; no repository JSDoc standards copy remains.

### DIV-009: Accessor, overload, generator, and error documentation has useful extra detail

- Comparison class: `more-exact-standard`
- Canonical source: `documentation/standards/jsdoc.md` sections "Descriptions" and "Tags."
- Repository source: `agents/topics/standards/jsdoc.md` sections "Constructors And Accessors," "Callbacks, Generators, And Overloads," and "Errors And Async Completion," lines 70-135.
- Canonical rule: constructors and generators have prescribed openings, callables and returns are documented, and observable errors plus async rejection/cancellation are described.
- Repository rule: additionally aligns getter/setter descriptions, requires `@yields` and conditional generator `@returns`, rejects invented overload tags, permits grouped error declarations, and separates async outcome conditions from tags.
- Behavioral difference: the repository resolves edge cases left implicit by the shorter canonical wording.
- Information at risk: consistent accessor pairs, generator final-value documentation, overload expression, and error-class placement guidance.
- Agent recommendation: `promote-global`
- Recommendation rationale: the additions are general, compatible with the canonical rule, and contain no repository-specific constraints.
- Developer decision: `promote-global`
- Developer notes: Original decision text: "promote these differences to global standards."
- Re-review required: `no`
- Reconciliation result: Promoted getter/setter alignment, overload, generator, error-class, and asynchronous-outcome documentation details globally.
- Validation evidence: Canonical `jsdoc.md#Descriptions` and `jsdoc.md#Tags` contain the additions without repository-specific text.

### DIV-010: React component-shape rules conflict

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/react.md` section "Component Shape," lines 24-27.
- Repository source: `agents/topics/standards/react-code/README.md` section "Current Baseline," lines 8-18.
- Canonical rule: substantial components are classes by default; function components are limited to very small, stateless wrappers or utilities without lifecycle, effects, refs, owned state, multiple handlers, or a meaningful object model.
- Repository rule: function and class components are both acceptable, selected by surrounding code and lifecycle clarity, and new function components may own hooks as long as the Rules of Hooks are followed.
- Behavioral difference: a stateful/effectful new function component is acceptable locally but prohibited canonically.
- Information at risk: the repository's migration posture of preserving working component styles and avoiding style-only rewrites.
- Agent recommendation: `remove-local`
- Recommendation rationale: adopt the deterministic canonical component boundary while retaining the non-rewrite migration fact in a project topic rather than as a competing standard.
- Developer decision: `remove-local`
- Developer notes: Original decision text: "no local override, use global."
- Re-review required: `no`
- Reconciliation result: Removed the conflicting local React standards document and retained canonical React selection.
- Validation evidence: `react.md` is selected in the manifest and `agents/topics/standards/react-code/README.md` is absent.

### DIV-011: Optional accessibility prose duplicates an inapplicable standards concern

- Comparison class: `inapplicable-or-ownership`
- Canonical source: `documentation/standards/accessibility.md` sections "Purpose And Scope" and "Visual And Motion Guidance," especially lines 5 and 58-63; `documentation/standards/react.md` section "Semantic Markup And Interaction."
- Repository source: `agents/topics/standards/optional-accessibility-localization.md` sections "Purpose," "Audience Boundary," and "Low-Cost Defaults"; `agents/topics/standards/react-code/README.md` section "Optional Accessibility And Interaction Hygiene."
- Canonical rule: accessibility requirements apply only when `accessibility.md` is selected by the repository manifest. A repository with no accessibility requirements omits that standard; an omitted standard cannot be enabled by a topic or overlay rule.
- Repository rule: the repository is a non-consumer technical/research surface; accessibility practices and WCAG ratios are optional hygiene and cannot block extraction, verification, diagnostics, or performance work.
- Behavioral difference: the local document creates optional engineering guidance outside the overlay even though repository-inapplicability should be represented by omitting `accessibility.md`, not by maintaining an advisory local standard.
- Information at risk: the explicit engineering-testbed audience boundary and proportionate treatment of GPU/canvas diagnostics.
- Agent recommendation: `remove-local`
- Recommendation rationale: preserve the non-consumer audience and GPU/testbed facts in an ordinary project topic, omit `accessibility.md` from the manifest while no accessibility requirement exists, and remove the advisory engineering rules rather than encoding a broad `REPLACE`.
- Developer decision: `remove-local`
- Developer notes: Original decision text: "no local override."
- Re-review required: `no` — the original "no local override" direction and CFG-001's approved accessibility omission unambiguously require removal of the local standards prose.
- Reconciliation result: Removed the optional local accessibility standards prose and omitted canonical `accessibility.md` from the approved manifest.
- Validation evidence: No accessibility standard is manifested and no local accessibility standards owner remains.

### DIV-012: Optional localization prose duplicates an inapplicable standards concern

- Comparison class: `inapplicable-or-ownership`
- Canonical source: `documentation/standards/localization.md` section "Purpose And Current Scope," line 5; `documentation/standards/code-conventions.md` section "Markup, CSS, And Layout."
- Repository source: `agents/topics/standards/optional-accessibility-localization.md` sections "Audience Boundary" and "Localization Seams," lines 97-118.
- Canonical rule: localization requirements apply only when `localization.md` is selected by the repository manifest. A repository with no localization requirements omits that standard; an omitted standard cannot be enabled by a topic or overlay rule.
- Repository rule: no localization system is required until a concrete need exists; stable technical terminology stays literal and only low-cost seams should be preserved.
- Behavioral difference: the local document creates optional localization engineering guidance outside the overlay even though repository-inapplicability should be represented by omitting `localization.md`.
- Information at risk: locale-neutral Algorithm32 facts, stable scientific identifiers, and the explicit decision not to build unused application infrastructure.
- Agent recommendation: `remove-local`
- Recommendation rationale: preserve locale-neutral Algorithm32 and stable-identifier facts in ordinary project/domain topics, omit `localization.md` while no localization requirement exists, and remove optional localization standards prose rather than encoding a replacement.
- Developer decision: `remove-local`
- Developer notes: Original decision text: "no local override."
- Re-review required: `no` — the original "no local override" direction and CFG-001's approved localization omission unambiguously require removal of the local standards prose.
- Reconciliation result: Removed the optional local localization standards prose and omitted canonical `localization.md` from the approved manifest.
- Validation evidence: No localization standard is manifested and no local localization standards owner remains.

### DIV-013: Architecture, REMVC, and feature mechanics substantially restate canonical standards

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/architecture.md`, `documentation/standards/remvc.md`, and `documentation/standards/polylith.md`.
- Repository source: `agents/topics/standards/architecture/README.md`, `overview.md`, `remvc.md`, and `feature-mechanics.md`.
- Canonical rule: the canonical documents own layer responsibility, feature privacy/removability, registry/service lifecycle, React/view/controller direction, build inclusion, runtime activation, and browser-test aggregation.
- Repository rule: the local architecture set repeats a shorter version of those rules and includes imported-code migration caveats and a representative local source shape.
- Behavioral difference: local readers miss newer canonical rules such as the strict responsibility matrix, contribution registries, model-service exception, exact removal test, and lifecycle cleanup details.
- Information at risk: repository-specific migration posture, representative current paths, and public commands should move to local architecture/foundation topics rather than vanish.
- Agent recommendation: `already-covered`
- Recommendation rationale: replace general architecture restatements with canonical references after preserving only actual repository facts in project topics.
- Developer decision: `already-covered`
- Developer notes: Original decision text: "move repository specifics to the correct topics, otherwise defer to global standards." Here "defer to global standards" means use the canonical rules, not the formal `defer` disposition.
- Re-review required: `no`
- Reconciliation result: Removed the local architecture, REMVC, feature, and build restatements; retained project facts in their project topics and selected the canonical architecture, ReMVC, and Polylith standards.
- Validation evidence: The three canonical documents resolve through the manifest; current topic references no longer route to the deleted local standards tree.

### DIV-014: Durable testing principles duplicate the canonical testing standard

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/testing.md` sections "Durable Test Principles," "React And Component Tests," "Service And Lifecycle Tests," and "Definition Of An Established Lane."
- Repository source: `agents/topics/standards/testing/testing.md` sections "Durable Principles," "Test Placement And Naming," "React And Browser Testing," "Service And Lifecycle Testing," and "Definition Of Done For A Test Lane."
- Canonical rule: tests prove observable behavior, boundaries, failure policy, determinism, cleanup, independent expectations, and established lane behavior.
- Repository rule: restates the same principles with expanded examples.
- Behavioral difference: no material policy difference in the shared principles; parallel prose can drift.
- Information at risk: current Algorithm32 and Flat32 lane facts handled separately by DIV-015.
- Agent recommendation: `already-covered`
- Recommendation rationale: use canonical `testing.md` for durable rules and preserve project execution facts under their existing `agents/topics/testing` owner.
- Developer decision: `already-covered`
- Developer notes: Original decision text: "follow recommendation."
- Re-review required: `no`
- Reconciliation result: Removed the duplicated durable testing standard and selected canonical `testing.md`.
- Validation evidence: The manifest resolves `testing.md`; project-specific lane facts remain in `agents/topics/testing/README.md`.

### DIV-015: Current Algorithm32 and Flat32 test-lane facts are embedded in a standards document

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/documentation.md` section "Project Topics"; `documentation/standards/testing.md` sections "Commands" and "Definition Of An Established Lane."
- Repository source: `agents/topics/standards/testing/testing.md` sections "Current Toolchain Baseline," "Standalone Algorithm32 Flow," and "Polylith Application Browser Scaffold," lines 143-219.
- Canonical rule: standards define lane contracts; selected commands, installed configuration, current scaffold state, and verification results are project facts owned by project topics.
- Repository rule: the standards document names exact Algorithm32 commands/discovery suffixes and records the root application scaffold as incomplete.
- Behavioral difference: mutable project state is presented as repository-wide standards authority and can become stale independently of implementation and the existing `agents/topics/testing/README.md` owner.
- Information at risk: exact runner separation, current incomplete-scaffold warning, and software-renderer claim boundary.
- Agent recommendation: `remove-local`
- Recommendation rationale: these are selected commands, runner state, and claim boundaries rather than reusable engineering standards. Preserve them in the existing project testing topic, then remove them from the standards surface; they must not enter `overlay.md`.
- Developer decision: `remove-local`
- Developer notes: Original decision text: "move extended standards into the correct topic." Preserve the runner and scaffold information as project facts in the existing testing topic; do not move engineering-standard authority into a topic.
- Re-review required: `no` — the instruction to move the information to its proper topic maps unambiguously to removing its standards authority while preserving the project facts.
- Reconciliation result: Removed the standards-owned testing copy while preserving the Algorithm32, Three/WebGL, and incomplete application-scaffold facts under the existing testing topic.
- Validation evidence: `agents/topics/testing/README.md` remains the project-fact owner; `agents/topics/standards/testing/` contains no files.

### DIV-016: Polylith copied-asset descriptor semantics are absent canonically

- Comparison class: `more-exact-standard`
- Canonical source: `documentation/standards/polylith.md` sections "Build Composition" and "Synthetic Modules And Features."
- Repository source: `agents/topics/standards/architecture/build-and-assets.md` sections "Copied Asset Descriptors" and "Runtime Path Derivation," lines 64-104.
- Canonical rule: build metadata owns CSS/resources and generated output, but it does not define `cwd`, `glob`, `dest`, `keepNest`, or emitted-path URL derivation.
- Repository rule: defines those descriptor fields and requires browser/CSS URLs to be derived from emitted layout rather than source paths.
- Behavioral difference: the local rule supplies concrete, generally applicable Polylith asset semantics missing from the canonical standard.
- Information at risk: reliable nested copying and runtime URL derivation guidance.
- Agent recommendation: `promote-global`
- Recommendation rationale: the rule is tool-specific but not repository-specific and belongs in canonical `polylith.md`.
- Developer decision: `promote-global`
- Developer notes: Original decision text: "promote the extended rules to global."
- Re-review required: `no`
- Reconciliation result: Added copied-asset descriptor semantics and emitted-layout URL derivation to canonical Polylith guidance.
- Validation evidence: Canonical `polylith.md#Copied Assets And Runtime Paths` defines `cwd`, `glob`, `dest`, `keepNest`, and consumer path derivation.

### DIV-017: Local guidance permits temporary manual synchronization into generated output

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/project-foundation.md` section "Repository Boundary" and `documentation/standards/polylith.md` section "Browser Tests."
- Repository source: `agents/topics/standards/architecture/build-and-assets.md` section "Generated Output And Watchers," lines 130-138.
- Canonical rule: generated output remains distinct from authored source, reproducible, ignored, and owned by the normal build.
- Repository rule: permits temporary asset-only synchronization directly into `dist` when a watcher misses a newly added copied asset.
- Behavioral difference: local workflow may mutate generated output outside the builder and temporarily mask an incomplete descriptor or watcher behavior.
- Information at risk: a development convenience for live asset inspection; the source descriptor remains authoritative.
- Agent recommendation: `remove-local`
- Recommendation rationale: remove the general permission and require a focused, explicitly documented operational workaround if a concrete watcher defect still needs one.
- Developer decision: `remove-local`
- Developer notes: Original decision text: "remove local guidance."
- Re-review required: `no`
- Reconciliation result: Removed the local build-and-assets standards document, including its temporary direct synchronization permission.
- Validation evidence: No current standards owner permits manual synchronization into generated output; canonical Polylith remains selected.

### DIV-020: Canonical index retains retired exception terminology

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/README.md` section "Standards Index"; `documentation/standards/documentation.md` sections "Repository Standards Overlay" and "Priority and Precedence."
- Repository source: none; this is an internal canonical management inconsistency discovered while refreshing the repository audit.
- Canonical rule: `documentation.md` requires `manifest.md` to select standards and link `overlay.md`; local differences are expressed only as overlay `ADD` or `REPLACE` entries, and exceptions are not a separate mechanism.
- Conflicting canonical text: the canonical index describes `documentation.md` as governing "topics, and exceptions."
- Behavioral difference: readers can infer that a third local-difference category called an exception still exists even though the authoritative management contract permits only `ADD` and `REPLACE` entries in the overlay.
- Information at risk: deterministic discovery and validation of all local differences through the mandatory overlay.
- Agent recommendation: `promote-global`
- Recommendation rationale: update the canonical index wording to say that the manifest links the overlay; do not introduce repository-specific language.
- Developer decision: `promote-global`
- Developer notes: Original decision text: "follow recommendation."
- Re-review required: `no` — the developer explicitly directed this item to follow the recommendation; the remaining canonical wording is execution work for reconciliation.
- Reconciliation result: Replaced the canonical index's retired "exceptions" label with manifest, overlay, topic, and reviewer-selection terminology.
- Validation evidence: Canonical standards `README.md` no longer describes `documentation.md` as an exceptions owner.

### DIV-021: Canonical governance assigns standards loading to the wrong owner

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/documentation.md` sections "Required Repository Shape" and "Loading Procedure."
- Global operational source: `skills/bootstrap/SKILL.md` steps 2-10 and `skills/review-standards/SKILL.md` sections "Load authority and define scope" and "Bootstrap and topic lifecycle."
- Repository source: `AGENTS.md` section "Topic Bootstrap."
- Canonical governance text: repository `AGENTS.md` routes agents to the active topic, standards manifest, and overlay, and the general loading procedure directly reads all three.
- Global bootstrap rule: `$bootstrap` is the normal repository-session entry orchestrator. It loads Codex-root and repository `AGENTS.md` instructions, then executes `review-standards` bootstrap mode. The review workflow owns reading and validating `manifest.md`, `overlay.md`, governing topics, normalization, formatting, and reviewer eligibility for that invocation. `review-standards` is also a separately invokable global skill whose explicit modes load their own required authority and run their applicable gates. Repository `AGENTS.md` may remain focused on repository topic routing.
- Behavioral difference: the canonical governance document assigns standards-configuration loading to repository instructions, duplicating and potentially diverging from the global bootstrap/reviewer lifecycle that actually owns it.
- Information at risk: one deterministic entry flow, consistent eligibility gates, and freedom for repository `AGENTS.md` to contain only repository-specific routing and instructions.
- Agent recommendation: `promote-global`
- Recommendation rationale: update canonical `documentation.md` so `$bootstrap` is the normal session starting point and its invocation of `review-standards` owns manifest/overlay loading after repository instructions are loaded. Preserve direct invocation of every declared `review-standards` mode; those invocations perform their own authority loading and gates. Do not add duplicate manifest or overlay routing to repository `AGENTS.md`.
- Related operational remediation: CFG-011 separately owns the approved repository `AGENTS.md` bootstrap warning.
- Developer decision: `promote-global`
- Developer notes: The global bootstrap flow is the normal starting point, not repository `AGENTS.md`. Keep `review-standards` separately invokable. Decision instruction: follow the recommendation. The separate repository warning decision is recorded as CFG-011.
- Re-review required: `no` — the developer confirmed the refreshed recommendation after the bootstrap, direct-invocation, warning, and compaction behavior was recorded.
- Reconciliation result: Updated canonical governance so `$bootstrap` is the normal entry, invokes `review-standards` after repository instructions load, and leaves direct self-loading workflows independently invokable.
- Validation evidence: Canonical `documentation.md#Loading Procedure` and the normalized-repository shape assign manifest/overlay reviewer loading to `review-standards`; repository `AGENTS.md` contains the approved nonrecursive warning.

## Rules Recommended As ADD Overlay Entries

The canonical rule remains applicable for every item in this section. If an
item is approved as `add-local`, reconciliation must create a separate valid
`ADD` entry in `overlay.md` and remove the rule from every former local
standards owner. The manifest may link the overlay but may not contain these
rules.

### General repository addition

| Item | Repository addition | Proposed canonical extension | Developer notes / action |
| --- | --- | --- | --- |
| DIV-005 | Namespace-first utility ownership and instance-only class helpers. | `code-conventions.md#Classes And Utilities` | |

### Scientific And Reference-Based Repository Additions

The following rules are production-Algorithm32-topic repository additions, not proposed
canonical standards and not replacements for conflicting canonical rules. By
developer direction on 2026-09-04, their rule text must be transplanted into
`agents/topics/standards/overlay.md` with the exact scope
`topic:agents/topics/algorithm32/production/README.md`. Algorithm32
topic documents may link to the resulting entries but do not own their text.
Experimental lanes are outside this topic-scoped entry unless a separate
approved scope includes them; they may voluntarily carry over the practice,
but such reuse is not a standards requirement.
Because each canonical target remains applicable, these are `ADD` candidates,
not `REPLACE` entries. This classification does not bypass the manual
disposition gate: each item still requires an explicit `add-local` decision
before reconciliation.

| Item | Repository addition | Proposed canonical extension | Developer notes / action |
| --- | --- | --- | --- |
| ADD-001 | Durable scientific quantities, units, and provenance. | `types.md#General Types` | Transplant to `overlay.md` as an `ADD` scoped to `topic:agents/topics/algorithm32/production/README.md`; experimental lanes may carry it over voluntarily but are not governed by this entry. |
| DIV-006 | Reference-backed formula symbols. | `code-conventions.md#JavaScript And Module Shape` | Transplant to `overlay.md` as an `ADD` scoped to `topic:agents/topics/algorithm32/production/README.md`; topic documents may link to it. |
| DIV-018 | Scientific profile completeness and reference differences. | `types.md#General Types` | Transplant to `overlay.md` as an `ADD` scoped to `topic:agents/topics/algorithm32/production/README.md`; topic documents may link to it. |
| DIV-007 | Scientific descriptor non-authority. | `code-conventions.md#Validation And Failure Policy` | Transplant to `overlay.md` as an `ADD` scoped to `topic:agents/topics/algorithm32/production/README.md`; topic documents may link to it. |

### ADD-001: Durable scientific quantities, units, and provenance

- Canonical context: `documentation/standards/types.md` owns ambient contract placement and documentation but does not define scientific quantity semantics or unit-bearing value shapes.
- Repository source: `agents/topics/algorithm32/standards.md` section "Durable Physical Data And Units," lines 18-40.
- Repository addition: public and durable Algorithm32 quantities carry units, physical quantity, spectral basis, point/bin semantics, and provenance identity. Durable property names remain unit-neutral while normalized local computational scalars may use unit suffixes.
- Repository-specific reason: these rules express Algorithm32's scientific data model and distinguish source irradiance, attenuated incident irradiance, and directional radiance; they should not constrain unrelated repositories.
- Information to preserve: unit-bearing durable values, local-scalar naming exception, spectral/provenance identity, and radiometric stage naming.
- Proposed overlay mapping: `Extends: types.md#General Types`; use `Scope: topic:agents/topics/algorithm32/production/README.md`. Flat32 and experimental lanes are not governed by the entry. Experimental lanes may voluntarily carry over the practice, but that optional reuse is not part of the overlay rule. Store the entry only in `overlay.md`, not in an Algorithm32 topic document.
- Agent recommendation: `add-local`
- Recommendation rationale: retain the canonical ambient-type placement rule and add the scoped scientific quantity/provenance contract in the overlay.
- Prior developer classification: `repository-addition`
- Developer decision: `add-local`
- Developer notes: These should only apply to Algorithm32 and can be carried over to experimental lanes, but it isn't strictly necessary.
- Re-review required: `no` — the developer confirmed the Algorithm32-only mandatory scope and the nonmandatory experimental carry-over boundary.
- Reconciliation result: Added the durable scientific quantities and provenance rule to the overlay for the exact production Algorithm32 topic.
- Validation evidence: The overlay entry extends `types.md#General Types`, resolves its topic path, and explicitly excludes mandatory experimental application through its exact scope.

### DIV-006: Reference-backed formula symbols

- Canonical context: `documentation/standards/code-conventions.md` requires descriptive identifiers but does not define scientific formula provenance.
- Repository source: `agents/topics/standards/code-conventions.md` section "Identifier Naming," lines 41-64.
- Repository addition: a scientific implementation may retain a published formula symbol only when the owning documentation or adjacent comment identifies its external authority and the code-to-formula mapping is unambiguous.
- Repository-specific reason: the rule connects Algorithm32 source symbols to scientific/reference provenance rather than establishing a naming convention for all projects.
- Information to preserve: exact formula authority and unambiguous code-to-formula mapping.
- Proposed overlay mapping: `Extends: code-conventions.md#JavaScript And Module Shape`; use `Scope: topic:agents/topics/algorithm32/production/README.md`. Store the entry only in `overlay.md`, not in an Algorithm32 topic document.
- Agent recommendation: `add-local`
- Recommendation rationale: the canonical descriptive-identifier rule remains applicable and the repository adds a stricter provenance condition for scientific symbols.
- Prior developer classification: `repository-addition`
- Developer decision: `add-local`
- Developer notes: Apply only to the production Algorithm32 topic: `topic:agents/topics/algorithm32/production/README.md`.
- Re-review required: `no` — the developer approved the split rule as a local addition and supplied its exact production-topic scope.
- Reconciliation result: Added the reference-backed formula-symbol rule to the overlay for the exact production Algorithm32 topic.
- Validation evidence: The overlay entry extends `code-conventions.md#JavaScript And Module Shape` and its canonical target and topic path resolve.

### DIV-018: Scientific profile completeness and reference differences

- Canonical context: `documentation/standards/types.md` section "General Types" owns named contract types but does not define scientific profile semantics.
- Repository source: `agents/topics/standards/code-conventions.md` section "Factories And Profiles," lines 129-139.
- Repository addition: a scientific profile is a named type with one documented default, caller overrides, all relevant configurable options, and every difference from its paper or reference configuration identified.
- Repository-specific reason: Algorithm32 executable profiles represent selected scientific/reference configurations whose deviations must remain explicit.
- Information to preserve: profile completeness, one documented default, caller overrides, and paper/reference differences.
- Proposed overlay mapping: `Extends: types.md#General Types`; use `Scope: topic:agents/topics/algorithm32/production/README.md`. Store the entry only in `overlay.md`, not in an Algorithm32 topic document.
- Agent recommendation: `add-local`
- Recommendation rationale: the canonical named-type rule remains applicable and the repository adds scientific profile semantics.
- Prior developer classification: `repository-addition`
- Developer decision: `add-local`
- Developer notes: local to Algorithm32
- Re-review required: `no` — the approved `add-local` decision and CFG-004's exact production-topic scope resolve the split entry.
- Reconciliation result: Added the scientific-profile completeness rule to the overlay for the exact production Algorithm32 topic.
- Validation evidence: The overlay entry extends `types.md#General Types` and its canonical target and topic path resolve.

### DIV-007: Scientific descriptor non-authority

- Canonical context: `documentation/standards/code-conventions.md` section "Validation And Failure Policy" owns general application failure behavior but does not define Algorithm32 executable-fact or experiment-evidence authority.
- Repository source: `agents/topics/standards/code-conventions.md` sections "Validation" and "Diagnostics," lines 150-173.
- Repository addition: scientific descriptors may identify, fingerprint, report, and diagnose evidence but may not validate executable facts, select algorithms, calculate indexing/packing, or recover executable facts.
- Repository-specific reason: the rule preserves Algorithm32's separation between executable numerical authority and descriptive evidence metadata.
- Information to preserve: descriptor non-authority for executable selection, validation, indexing, packing, and recovery.
- Proposed overlay mapping: `Extends: code-conventions.md#Validation And Failure Policy`; use `Scope: topic:agents/topics/algorithm32/production/README.md`. Store the entry only in `overlay.md`, not in an Algorithm32 topic document.
- Agent recommendation: `add-local`
- Recommendation rationale: canonical ingress validation remains applicable and the repository adds a restriction on what scientific descriptors may own.
- Prior developer classification: `repository-addition`
- Developer decision: `add-local`
- Developer notes: to Algorithm32 topic
- Re-review required: `no` — the approved `add-local` decision and CFG-004's exact production-topic scope resolve the split descriptor entry.
- Reconciliation result: Added the scientific-descriptor non-authority rule to the overlay for the exact production Algorithm32 topic.
- Validation evidence: The overlay entry extends `code-conventions.md#Validation And Failure Policy` and its canonical target and topic path resolve.

## Misclassified Operational And Design Facts

### DIV-019: Experimental evidence diagnostics and deferred production diagnostics

- Comparison class: `inapplicable-or-ownership`
- Canonical context: `documentation/standards/code-conventions.md` section "Validation And Failure Policy" owns general application warning/error behavior but does not define contained-experiment evidence diagnostics.
- Repository source: `agents/topics/algorithm32/standards.md` section "Diagnostics," lines 57-64; `agents/topics/standards/code-conventions.md` section "Diagnostics," lines 165-173.
- Repository statement: isolated Algorithm32 proof runners may report declared numerical, lifecycle, resource, or browser evidence, while production diagnostic APIs remain deferred until their owner, consumer, retention, and validation boundary are designed.
- Repository-specific reason: this records the current Algorithm32 evidence workflow and an unselected production capability rather than a reusable engineering rule.
- Information to preserve: declared evidence-only diagnostics and the design gate for production diagnostic APIs.
- Agent recommendation: `remove-local`
- Recommendation rationale: preserve the evidence-runner and deferred-production-diagnostics facts in their existing experiment and production topics, then remove their claim to engineering-standard authority; do not place selected workflow or unimplemented capability state in the overlay.
- Prior developer classification: `repository-addition`
- Developer decision: `remove-local`
- Developer notes: Preserve the evidence-runner and deferred production-diagnostics information in the applicable Algorithm32 project topics, consistent with the earlier direction to move Algorithm32-specific material to the Algorithm32 topic; remove only its engineering-standards authority.
- Re-review required: `no` — the settled governance excludes operational instructions, verification evidence, implementation state, and plans from standards ownership, while the prior developer direction supplies their non-standards destination.
- Reconciliation result: Moved experiment evidence-diagnostics facts to the Algorithm32 experiments topic and the deferred production-diagnostics boundary to the production architecture topic; removed the old Algorithm32 standards owner.
- Validation evidence: The two project topics retain the facts without claiming engineering-standards authority, and `agents/topics/algorithm32/standards.md` is absent.

## Configuration and reference findings

`Developer action` identifies a decision that must be supplied manually.
`Reconciliation action` and `Reconciliation validation` identify work performed
by `$normalize-standards reconcile` after the manual review gate passes.

| Action | Finding | Required action | Status / developer direction |
| --- | --- | --- | --- |
| CFG-001 | The applicability manifest was absent. | Created `manifest.md` with the approved eleven selections, approved omissions, one exact `## Applicable Files` section, and the overlay link. | `applied-and-validated`. |
| CFG-002 | The mandatory repository overlay was absent. | Created `overlay.md` with the four approved production-topic `ADD` entries and validated its grammar, targets, and scopes. | `applied-and-validated`. |
| CFG-003 | Local-rule dispositions required exact canonical targets and scopes. | Omitted DIV-005 from the overlay because it was promoted globally; encoded ADD-001, DIV-006, DIV-018, and DIV-007 against their narrowest canonical sections. | `applied-and-validated`. |
| CFG-004 | “Algorithm32 scope” was selected as the specific production Algorithm32 topic. | Encoded and validated `Scope: topic:agents/topics/algorithm32/production/README.md` on all four additions. | `applied-and-validated`. |
| CFG-005 | No `REPLACE` decision exists, and the current topic has no `## Standards Review Scope`. | Verified that the overlay contains no replacement, competing topic override, or malformed topic exclusion. | `validated`. |
| CFG-006 | Standards prose existed outside the overlay in legacy local standards documents. | Applied every approved disposition, preserved project facts in project topics, and removed the superseded local standards files. | `applied-and-validated`. |
| CFG-007 | Legacy documents claimed competing standards authority. | Removed those owners, rerouted current topic references, and updated production architecture routing to the manifest and overlay. | `applied-and-validated`. |
| CFG-008 | Canonical governance required the approved terminology and loading-ownership corrections. | Updated canonical `README.md` and `documentation.md` without repository-specific leakage. | `applied-and-validated`. |
| CFG-009 | Standards references required final validation. | Rechecked relative Markdown links in every changed repository document and validated manifested canonical links. | `validated-clean`. |
| CFG-010 | Root `STANDARDS.md` was absent. | Generated the guide after attestation validation and refreshed it after the approved experiment-root relocation. | `current` at source fingerprint `sha256:c1b9ee10ccf45714a4ee306b097baa8b2535b07d00c604c824356b7c90f360ef`. |
| CFG-011 | Direct repository entry required the approved nonrecursive lifecycle warning. | Added the warning to repository `AGENTS.md`, including explicit-workflow and post-compaction handling. | `applied-and-attested`. |
| CFG-012 | The contained experiment root moved from `scripts/extraterrestrial/` to `experiments/extraterrestrial/`. | Verified all 2,185 mapped tracked paths, repaired live references, retained `tmp/extraterrestrial/` as the immutable output root, classified the local experiment-scaffolding skill as operational rather than standards authority, and refreshed the attestation through reconciliation. | `applied-and-attested`. |

## Review gate

- [x] Every divergence has been reviewed manually.
- [x] No developer decision remains `pending`.
- [x] Decision-specific clarification is sufficient.
- [x] No source or precedence ambiguity remains.
- [x] The developer has explicitly requested reconciliation.

No developer decision remains `pending`, and none uses `defer`. Every decision
uses an allowed disposition, with the original intent preserved in developer
notes. DIV-003 uses the canonical baseline and directs its separately
inventoried scientific/reference rules to overrides scoped to
`topic:agents/topics/algorithm32/production/README.md`; the actual overlay
dispositions remain owned by ADD-001, DIV-006, DIV-018, and DIV-007. ADD-001,
DIV-006, DIV-018, and DIV-007 are approved as `add-local` rules with that exact
scope. DIV-005 was
recommended as `add-local`, but its developer decision is `promote-global`.
All recorded decisions and configuration actions were applied. DIV-001's
review evidence remains in this report, while its competing standards owners
were removed. The approved applicability set, exact production Algorithm32
topic scope, canonical promotions, operational `AGENTS.md` warning, and
project-fact relocations are complete. CFG-011 remains separate from DIV-021's
canonical standards disposition.

## Generated developer guide

Generate or refresh root `STANDARDS.md` only after the final normalization
attestation validates. Run `$write-standards-guide`, then its read-only check
mode. The guide is a derived developer reference and does not affect
normalization status or reviewer eligibility.

- Guide status: `current`
- Guide source fingerprint: `sha256:c1b9ee10ccf45714a4ee306b097baa8b2535b07d00c604c824356b7c90f360ef`
- Guide validation evidence: write mode reported `updated`; subsequent check mode reported `current` against normalization fingerprint `sha256:2a0cf1dbfa5a068476be00aac94899021a8f143fddc4e3b6b2559e386368da23`.

## Final validation

- [x] Every approved decision was applied exactly as recorded.
- [x] No pending decision was applied.
- [x] Canonical standards contain no repository-specific leakage.
- [x] The repository manifest selects applicable standards only under `## Applicable Files`, links `overlay.md`, and contains no local standards rules.
- [x] Every retained local engineering rule appears exactly once in the overlay as `ADD` or `REPLACE`.
- [x] Every overlay entry has one descriptive heading and exactly four nonempty single-line fields with a resolved canonical target and scope.
- [x] Every `topic:` scope resolves to an existing governing topic and simultaneously applicable replacements are unambiguous.
- [x] Superseded local standards are no longer accidentally authoritative.
- [x] Standards references resolve.
- [x] Re-audit has no unexplained divergences.
- [x] After attestation validation, `STANDARDS.md` was generated or refreshed and its check mode reports `current`.

Normalization status: `normalized`

</details>
