# Standards Reconciliation

## Status

- Repository: `C:\dev\flattened-steel`
- Canonical standards root: `C:\Users\gande\.codex\documentation\standards`
- Standards governance: [Standards Governance](../../../../../Users/gande/.codex/documentation/standards/documentation.md)
- Generated developer guide: root `STANDARDS.md` is current at source fingerprint `sha256:6ac919be5ce56c65795ef7e517ad1f27650e86d9914a17f5b8bf55ba9cb0a540`.
- Normalization attestation: valid at repository standards fingerprint `sha256:7f4239c4c033e34d2c95d94ef359b788c26bed8b0a428da0e2474a483b96a115` with 5 inputs.
- Audit date: 2026-09-04
- Audit basis: repository commit `20db38fbed50513e29e193c004bf78345af5f6a3`; current repository and Codex-home instructions; the complete canonical standards library; the `manifest.md`, overlay, generated-guide, topic-scope, reviewer-selection, and attestation governance contract in `documentation/standards/documentation.md`; all documents below `agents/topics/standards`; and the domain supplement `agents/topics/algorithm32/standards.md`. Pre-existing working-tree changes were treated as developer-owned and were not modified. This report was refreshed for the current governance model on 2026-09-04.
- Phase: `reconciled`

## Summary

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
| CFG-010 | Root `STANDARDS.md` was absent. | Generated the guide after attestation validation and ran check mode. | `current` at source fingerprint `sha256:6ac919be5ce56c65795ef7e517ad1f27650e86d9914a17f5b8bf55ba9cb0a540`. |
| CFG-011 | Direct repository entry required the approved nonrecursive lifecycle warning. | Added the warning to repository `AGENTS.md`, including explicit-workflow and post-compaction handling. | `applied-and-attested`. |

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
- Guide source fingerprint: `sha256:6ac919be5ce56c65795ef7e517ad1f27650e86d9914a17f5b8bf55ba9cb0a540`
- Guide validation evidence: write mode reported `created`; subsequent check mode reported `current` against normalization fingerprint `sha256:7f4239c4c033e34d2c95d94ef359b788c26bed8b0a428da0e2474a483b96a115`.

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
