# Standards Reconciliation

## Status

- Repository: `C:\dev\flattened-steel`
- Canonical standards root: `C:\Users\gande\.codex\documentation\standards`
- Audit date: 2026-09-04
- Audit basis: repository commit `20db38fbed50513e29e193c004bf78345af5f6a3`; current repository and Codex-home instructions; the complete canonical standards library; all documents below `agents/topics/standards`; and the domain supplement `agents/topics/algorithm32/standards.md`. Pre-existing working-tree changes were treated as developer-owned and were not modified.
- Phase: `awaiting-developer-review`

## Summary

### Canonical divergences

| Recommended disposition | Count |
| --- | ---: |
| `promote-global` | 3 |
| `repository-exception` | 3 |
| `remove-local` | 2 |
| `already-covered` | 6 |
| `defer` | 1 |

### Repository additions

| Classification | Count |
| --- | ---: |
| Scientific and reference-based repository additions | 3 |

### Canonical comparison classes

| Comparison class | Count | Items |
| --- | ---: | --- |
| Conflicting standards | 6 | DIV-001, DIV-005, DIV-010, DIV-011, DIV-012, DIV-017 |
| More exact repository standards | 3 | DIV-004, DIV-009, DIV-016 |
| Duplicate or ownership findings | 6 | DIV-002, DIV-003, DIV-008, DIV-013, DIV-014, DIV-015 |

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
| DIV-001 | Canonical-only ownership versus repository-local standards ownership. | |
| DIV-005 | Canonical support for cohesive ordinary modules versus a namespace-first rule that prohibits private-static and module-local class helpers. | |
| DIV-010 | Class-default React components versus equal acceptance of function components with hooks. | |
| DIV-011 | Required accessibility baseline versus advisory, non-gating hygiene. | |
| DIV-012 | Mandatory localization boundary versus deferring localization infrastructure until needed. | |
| DIV-017 | Builder-owned generated output versus temporary direct synchronization into `dist`. | |

### More Exact Repository Standards

These items refine a compatible canonical principle with narrower tests,
semantics, or tool-specific detail. Their added information should be judged
for promotion or retained scope without treating them as contradictions.

| Item | Added precision | Developer notes / action |
| --- | --- | --- |
| DIV-004 | Explicit accepted abbreviations and ambiguity tests for general identifiers. | |
| DIV-009 | Accessor, generator, overload, and error/async JSDoc rules. | |
| DIV-016 | Exact Polylith copied-asset descriptor and emitted-path semantics. | |

### Duplicate And Ownership Findings

These items do not select a contradictory rule or materially refine a
canonical rule. They concern copied standards, incomplete forks, or mutable
project facts stored under standards ownership.

| Item | Finding | Developer notes / action |
| --- | --- | --- |
| DIV-002 | Type standard copied locally. | |
| DIV-003 | Shared code-convention baseline duplicated and incomplete locally. | |
| DIV-008 | JSDoc baseline partially forked locally. | |
| DIV-013 | Architecture, REMVC, and Polylith principles restated locally. | |
| DIV-014 | Durable testing principles restated locally. | |
| DIV-015 | Mutable Algorithm32/Flat32 runner state stored in a standards document. | |

## Detailed Audit Records

### DIV-001: The local standards index is a competing owner rather than an applicability manifest

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/README.md` introduction; `documentation/standards/documentation.md` sections "Canonical Ownership" and "Project Applicability Manifest".
- Repository source: `agents/topics/standards/README.md` sections "Current Standards" and "Coding Standard Authorities" (especially line 26).
- Canonical rule: global standards live only below the Codex-home standards root; the repository README lists applicable canonical filenames, reasons, and explicit exceptions without copying standards prose.
- Repository rule: the README identifies repository-local documents as the owners of repository-wide coding rules and routes readers to those local standards.
- Behavioral difference: the same subject can be governed by either the canonical library or a local fork, and there is no manifest that deterministically selects applicable canonical lanes or exceptions.
- Information at risk: applicability reasons, deliberate project exceptions, and the current routing to genuinely project-specific Algorithm32 guidance could be lost if the local index were replaced mechanically.
- Agent recommendation: `already-covered`
- Recommendation rationale: replace the competing ownership/index prose with the required canonical applicability manifest after the other divergence decisions identify which local material is promoted, retained as an exception, relocated, or removed.
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

### DIV-003: Code-convention baseline is duplicated locally

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/code-conventions.md` sections "JavaScript And Module Shape," "Classes And Utilities," "Validation And Failure Policy," and "Formatting."
- Repository source: `agents/topics/standards/code-conventions.md` sections "Formatting," "File Naming And Placement," "Test Scope," "File Size," "Class Files," and "Validation."
- Canonical rule: the canonical standard owns JavaScript/module shape, class sizing, ingress validation, current-contract tests, and Prettier configuration and commands.
- Repository rule: the local standard restates those rules, often with more examples, while omitting the canonical recoverable-failure policy and exact root `format:check` contract.
- Behavioral difference: overlapping rules can drift; the local copy already gives an incomplete view of the current canonical formatting and failure contracts.
- Information at risk: the separately inventoried narrower identifier and utility rules, plus the scientific and reference-based repository additions, must not be removed with the duplicated baseline.
- Agent recommendation: `already-covered`
- Recommendation rationale: use the canonical code standard for the shared baseline and resolve DIV-004 through DIV-007 before retiring local prose.
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

### DIV-005: Class helpers and utilities follow a narrower namespace-first policy

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/code-conventions.md` sections "JavaScript And Module Shape" and "Classes And Utilities."
- Repository source: `agents/topics/standards/code-conventions.md` sections "Class Files" and "Utility Files," lines 85-127.
- Canonical rule: class-specific support stays on the class; reusable operations may use an ordinary cohesive module or namespace.
- Repository rule: class-only support must be private instance methods, never private static or module-local functions; reusable similar-domain operations default to a PascalCase namespace, and existing multi-export modules are evaluated and redistributed function by function.
- Behavioral difference: the local standard prohibits module-local or private-static class helpers and substantially narrows when ordinary function modules are acceptable.
- Information at risk: a deliberate repository preference for namespace ownership and the function-level migration test.
- Agent recommendation: `repository-exception`
- Recommendation rationale: retain it only if the project intends this stricter module-shape rule; the future manifest must state its scope, rationale, and removal condition explicitly.
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

### DIV-011: Accessibility is advisory locally but required canonically

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/accessibility.md` sections "Purpose And Scope" and "Visual And Motion Guidance," especially lines 5 and 58-63; `documentation/standards/react.md` section "Semantic Markup And Interaction."
- Repository source: `agents/topics/standards/optional-accessibility-localization.md` sections "Purpose," "Audience Boundary," and "Low-Cost Defaults"; `agents/topics/standards/react-code/README.md` section "Optional Accessibility And Interaction Hygiene."
- Canonical rule: accessibility is part of the component/interaction contract from the start, with semantic, keyboard, focus, naming, non-color, and contrast baselines even though the scaffold does not claim WCAG conformance.
- Repository rule: the repository is a non-consumer technical/research surface; accessibility practices and WCAG ratios are optional hygiene and cannot block extraction, verification, diagnostics, or performance work.
- Behavioral difference: a keyboard, naming, focus, contrast, or non-color issue can violate the canonical standard but cannot fail a local release gate under the current repository rule.
- Information at risk: the explicit engineering-testbed audience boundary and proportionate treatment of GPU/canvas diagnostics.
- Agent recommendation: `repository-exception`
- Recommendation rationale: the non-consumer scope is deliberate and narrower than the global product scaffold; retain it only as an explicit, bounded exception with a removal condition tied to audience/product-role change.
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

### DIV-012: Localization is deferred locally but mandatory at the canonical presentation boundary

- Comparison class: `conflicting-standard`
- Canonical source: `documentation/standards/localization.md` section "Purpose And Current Scope," line 5; `documentation/standards/code-conventions.md` section "Markup, CSS, And Layout."
- Repository source: `agents/topics/standards/optional-accessibility-localization.md` sections "Audience Boundary" and "Localization Seams," lines 97-118.
- Canonical rule: localization infrastructure is enabled, `en-US` is canonical, and user-visible application prose may not bypass the localization boundary even before another locale exists.
- Repository rule: no localization system is required until a concrete need exists; stable technical terminology stays literal and only low-cost seams should be preserved.
- Behavioral difference: direct English operator/developer prose can be accepted locally but violates the canonical standard.
- Information at risk: locale-neutral Algorithm32 facts, stable scientific identifiers, and the explicit decision not to build unused application infrastructure.
- Agent recommendation: `repository-exception`
- Recommendation rationale: record a scoped technical-surface exception while retaining canonical locale-neutral data and `Intl` presentation rules; define removal when consumer-facing or multilingual requirements appear.
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

### DIV-015: Current Algorithm32 and Flat32 test-lane facts are embedded in a standards document

- Comparison class: `duplicate-or-ownership`
- Canonical source: `documentation/standards/documentation.md` section "Project Topics"; `documentation/standards/testing.md` sections "Commands" and "Definition Of An Established Lane."
- Repository source: `agents/topics/standards/testing/testing.md` sections "Current Toolchain Baseline," "Standalone Algorithm32 Flow," and "Polylith Application Browser Scaffold," lines 143-219.
- Canonical rule: standards define lane contracts; selected commands, installed configuration, current scaffold state, and verification results are project facts owned by project topics.
- Repository rule: the standards document names exact Algorithm32 commands/discovery suffixes and records the root application scaffold as incomplete.
- Behavioral difference: mutable project state is presented as repository-wide standards authority and can become stale independently of implementation and the existing `agents/topics/testing/README.md` owner.
- Information at risk: exact runner separation, current incomplete-scaffold warning, and software-renderer claim boundary.
- Agent recommendation: `defer`
- Recommendation rationale: preserve this information until it is verified and moved to the project testing topic; do not delete it merely because the durable principles are canonical.
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

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
- Developer decision: `pending`
- Developer notes:
- Re-review required: `no`
- Reconciliation result:
- Validation evidence:

## Scientific And Reference-Based Repository Additions

The following rules are project/domain additions, not proposed canonical
standards and not exceptions to a conflicting canonical rule. By developer
direction on 2026-09-04, reconciliation must retain them as repository-owned
guidance, route them through the future applicability manifest, and keep their
scope specific to Algorithm32 scientific, reference, provenance, and evidence
work. This classification does not authorize broader reconciliation edits.

| Item | Repository addition | Developer notes / action |
| --- | --- | --- |
| ADD-001 | Durable scientific quantities, units, and provenance. | |
| DIV-006 | Reference-backed formula symbols and scientific profiles. | |
| DIV-007 | Scientific descriptor authority and evidence diagnostics. | |

### ADD-001: Durable scientific quantities, units, and provenance

- Canonical context: `documentation/standards/types.md` owns ambient contract placement and documentation but does not define scientific quantity semantics or unit-bearing value shapes.
- Repository source: `agents/topics/algorithm32/standards.md` section "Durable Physical Data And Units," lines 18-40.
- Repository addition: public and durable Algorithm32 quantities carry units, physical quantity, spectral basis, point/bin semantics, and provenance identity. Durable property names remain unit-neutral while normalized local computational scalars may use unit suffixes.
- Repository-specific reason: these rules express Algorithm32's scientific data model and distinguish source irradiance, attenuated incident irradiance, and directional radiance; they should not constrain unrelated repositories.
- Information to preserve: unit-bearing durable values, local-scalar naming exception, spectral/provenance identity, and radiometric stage naming.
- Directed treatment: retain as a repository addition under the Algorithm32-specific standards owner and list that owner in the future manifest.
- Developer direction: `repository-addition`
- Reconciliation result:
- Validation evidence:

### DIV-006: Reference-backed formula symbols and scientific profiles

- Canonical context: `documentation/standards/code-conventions.md` requires descriptive identifiers and contains general factory guidance but does not define scientific formula provenance or reference-profile semantics.
- Repository source: `agents/topics/standards/code-conventions.md` sections "Identifier Naming" and "Factories And Profiles," lines 41-64 and 129-139.
- Repository addition: a scientific implementation may retain a published formula symbol only when the owning documentation or adjacent comment identifies its external authority and the code-to-formula mapping is unambiguous. A scientific profile is a named type with one documented default, caller overrides, all relevant configurable options, and every difference from its paper or reference configuration identified.
- Repository-specific reason: the rule connects Algorithm32 source symbols and executable profiles to scientific/reference provenance rather than establishing a general naming or configuration convention for all projects.
- Information to preserve: exact formula authority, unambiguous symbol mapping, profile completeness, one documented default, and differences from the cited reference configuration.
- Directed treatment: retain as a repository addition and move its canonical ownership to `agents/topics/algorithm32/standards.md` during reconciliation; leave the general factory rule with the canonical code standard.
- Developer direction: `repository-addition`
- Reconciliation result:
- Validation evidence:

### DIV-007: Scientific descriptor authority and evidence diagnostics

- Canonical context: `documentation/standards/code-conventions.md` section "Validation And Failure Policy" owns general application failure behavior but does not define Algorithm32 executable-fact or experiment-evidence authority.
- Repository source: `agents/topics/standards/code-conventions.md` sections "Validation" and "Diagnostics," lines 150-173; `agents/topics/algorithm32/standards.md` section "Diagnostics," lines 57-64.
- Repository addition: scientific descriptors may identify, fingerprint, report, and diagnose evidence but may not validate executable facts, select algorithms, calculate indexing/packing, or recover executable facts. Isolated proof runners may report declared numerical, lifecycle, resource, or browser observations; production diagnostic APIs remain deferred until their owner, consumer, retention, and validation boundary are designed.
- Repository-specific reason: these rules preserve Algorithm32's separation between executable numerical authority, contained experimental evidence, and production diagnostics.
- Information to preserve: descriptor non-authority, production/experiment separation, and the requirement for an explicitly designed diagnostics owner and evidence boundary.
- Directed treatment: retain as a repository addition under the Algorithm32-specific standards owner while continuing to apply canonical warning/error behavior at genuine failure boundaries.
- Developer direction: `repository-addition`
- Reconciliation result:
- Validation evidence:

## Manifest and reference findings

- Missing applicable standards: no applicability manifest exists. Current repository evidence makes `documentation.md`, `project-foundation.md`, `architecture.md`, `code-conventions.md`, `types.md`, `jsdoc.md`, `react.md`, `polylith.md`, `remvc.md`, `testing.md`, and `server.md` applicable. `accessibility.md` and `localization.md` also govern React/human-facing work unless DIV-011 and DIV-012 become explicit repository exceptions. No current evidence makes `mui.md`, `base-components.md`, `app-shells.md`, `socket-io.md`, or `local-https.md` applicable.
- Local standards without canonical counterparts: the three scientific/reference-based repository additions in ADD-001, DIV-006, and DIV-007; the project-specific test-lane state in DIV-015; and the copied-asset details in DIV-016. `agents/topics/algorithm32/standards.md` is the intended owner for the three repository additions and must be listed and scoped by the future manifest rather than treated as a second global standards root.
- Broken references: none found among relative Markdown links in the complete canonical standards library or below `agents/topics/standards`.
- Ambiguous precedence: until DIV-001 is resolved, the global canonical library, the repository-local standards index, and the Algorithm32 supplement do not have a manifest-backed precedence chain. `agents/topics/algorithm32/production/architecture-boundaries.md` says the local Code, Type, and JSDoc documents apply without exception, which reinforces the stale local fork rather than naming canonical standards.
- Competing local sources: `agents/topics/standards/testing/testing.md` competes with `agents/topics/testing/README.md` for mutable runner state; the local architecture set competes with canonical architecture/REMVC/Polylith rules; the local Code, Type, JSDoc, and React documents compete with their canonical counterparts. Repository `AGENTS.md` containment and evidence rules and the Algorithm32 production documents were classified as project/domain requirements, not general standards merely because they contain mandatory language.

## Review gate

- [ ] Every divergence has been reviewed manually.
- [ ] No developer decision remains `pending`.
- [ ] Decision-specific clarification is sufficient.
- [ ] No source or precedence ambiguity remains.
- [ ] The developer has explicitly requested reconciliation.

The 15 canonical divergences requiring manual review are `DIV-001` through
`DIV-005` and `DIV-008` through `DIV-017`. ADD-001, DIV-006, and DIV-007 are
separately classified as scientific/reference-based repository additions by
developer direction; their exact retained placement and manifest routing will
be validated during reconciliation.

## Final validation

- [ ] Every approved decision was applied exactly as recorded.
- [ ] No pending decision was applied.
- [ ] Canonical standards contain no repository-specific leakage.
- [ ] The repository manifest lists applicable standards and explicit exceptions.
- [ ] Superseded local standards are no longer accidentally authoritative.
- [ ] Standards references resolve.
- [ ] Re-audit has no unexplained divergences.

Normalization status: `not-reconciled`
