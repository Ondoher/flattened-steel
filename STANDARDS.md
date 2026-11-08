# Repository Engineering Standards

> **Generated developer reference.** Do not modify this file directly or use it as standards authority.
>
> To update it now, tell Codex: `Use $write-standards-guide to update this repository's generated STANDARDS.md now.`

## Authority and provenance

- Folder manifest: [`agents/topics/standards/manifest.md`](./agents/topics/standards/manifest.md)
- Repository overlay: [`agents/topics/standards/overlay.md`](./agents/topics/standards/overlay.md)
- Standards governance: [`documentation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/documentation.md)
- First normalized: `2026-09-11T23:19:47.480Z`
- Repository standards configuration fingerprint: `sha256:28ce9d31c70758f08e3cc3c4355c4674ba66e3fab722778027e40c7cb9f9776c`
- Local standards overlay fingerprint: `sha256:efaaa388c5b82fd5fbab5aaf42db1d9ca11aaeb63b755fe7818f4ab7943307b0`
- Selected canonical standards fingerprint: `sha256:ec4c0a50489efcb3f231fec49052ba4237629207ba1d65bdfa509facc5080bc8`
- Guide source fingerprint: `sha256:4b256fcb59d7a2aa1e2a8f6122963c759319035d040091e699c731c3437f1edc`

For each file, the longest matching folder assignment selects one named standards set. The set includes its inherited canonical standards, then matching folder-scoped overlay rules modify specific sections. This file is a readable projection only.

Canonical links open the configured GitHub branch and show its latest published standards. Skills and reviewers still read local canonical files; the fingerprints above describe those local inputs, which may contain unpublished changes. Publish the governance checkout with `update-standards` to update the linked documents. Private repositories require GitHub access.

## Standards sets

### `base`

Extends: `none`

Adds:

- [`documentation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/documentation.md) — Folder applicability and standards governance.
- [`project-foundation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/project-foundation.md) — Repository and package boundaries.

### `code`

Extends: `base`

Adds:

- [`architecture.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/architecture.md) — Implementation ownership and dependency boundaries.
- [`code-conventions.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md) — JavaScript and formatting conventions.
- [`types.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md) — Ambient public and internal contracts.
- [`jsdoc.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/jsdoc.md) — Callable and declaration documentation.
- [`testing.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/testing.md) — Behavioral verification and lane boundaries.

### `experiment`

Extends: `base`

Adds:

- [`types.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md) — Experiment contract guidance for authoring, self-review, and local type checking; dedicated reviewers are disabled by repository policy.

### `build`

Extends: `code`

Adds:

- [`polylith.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/polylith.md) — Polylith build, activation, and deployment.

### `application`

Extends: `build`

Adds:

- [`remvc.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/remvc.md) — Application responsibility and lifecycle.

### `http-application`

Extends: `application`

Adds:

- [`server.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/server.md) — HTTP ingress, transport, filesystem service, and failure boundaries.

### `react-application`

Extends: `application`

Adds:

- [`react.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/react.md) — React presentation and adapter lifecycle.

### `react-library`

Extends: `code`

Adds:

- [`react.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/react.md) — React presentation and adapter lifecycle.

### `server`

Extends: `build`

Adds:

- [`server.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/server.md) — HTTP ingress, transport, filesystem service, and failure boundaries.

### `proof-tools`

Extends: `code`

Adds:

- [`server.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/server.md) — HTTP ingress, transport, filesystem service, and failure boundaries.

### `app-flat-browser`

Extends: `none`

Adds:

- [`documentation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/documentation.md) — Applies to Flat.
- [`project-foundation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/project-foundation.md) — Applies to Flat.
- [`architecture.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/architecture.md) — Applies to Flat.
- [`code-conventions.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md) — Applies to Flat.
- [`types.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md) — Applies to Flat.
- [`jsdoc.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/jsdoc.md) — Applies to Flat.
- [`polylith.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/polylith.md) — Applies to Flat.
- [`react.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/react.md) — Applies to Flat.
- [`remvc.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/remvc.md) — Applies to Flat.
- [`app-shells.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/app-shells.md) — Applies to Flat.
- [`localization.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/localization.md) — Applies to Flat.
- [`testing.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/testing.md) — Applies to Flat.
- [`mui.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/mui.md) — Applies to Flat.
- [`base-components.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/base-components.md) — Applies to Flat.

### `app-flat-server`

Extends: `none`

Adds:

- [`documentation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/documentation.md) — Applies to Flat.
- [`project-foundation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/project-foundation.md) — Applies to Flat.
- [`architecture.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/architecture.md) — Applies to Flat.
- [`code-conventions.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md) — Applies to Flat.
- [`types.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md) — Applies to Flat.
- [`jsdoc.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/jsdoc.md) — Applies to Flat.
- [`polylith.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/polylith.md) — Applies to Flat.
- [`localization.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/localization.md) — Applies to Flat.
- [`server.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/server.md) — Applies to Flat.
- [`testing.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/testing.md) — Applies to Flat.

## Folder assignments

- `.` → `build` — Root package, Polylith, build, and runner configuration.
- `agents/` → `base` — Work context and standards configuration; topics do not select standards.
- `.agents/` → `base` — Repository workflow documentation.
- `.agents/skills/start-experiment/scripts/` → `code` — Authored scaffolding automation.
- `references/` → `base` — Scientific source, claim, and result registers; retained evidence is not active code.
- `archives/` → `base` — Immutable historical evidence; mapping never authorizes edits.
- `src/` → `code` — Shared authored implementation and contracts.
- `src/algorithm32/implementation/react-three/` → `react-library` — Production React and R3F bindings inside the standalone engine.
- `src/flat32/` → `http-application` — Polylith application with imperative DOM and client HTTP package loading.
- `server/` → `server` — Polylith router and filesystem-backed application services.
- `server/flat32/` → `server` — App-owned integration-test-bed services, transport adapters, lifecycle and tests.
- `server/flat32/data/` → `base` — Operational asset documentation and immutable scientific packages, not database entities.
- `scripts/` → `code` — Offline tooling and independent scientific runners.
- `scripts/algorithm32/solar-zenith-cache/` → `proof-tools` — Offline compiler and local HTTP browser proof hosts.
- `scripts/flat32/` → `server` — Application build, capture, and cache-service tooling.
- `scripts/experiments/b1-directional-sky-radiance/` → `proof-tools` — Independent scoring and GPU HTTP proof host.
- `scripts/experiments/algorithm32-frame-parity/` → `proof-tools` — Independent CPU/GPU frame comparison and HTTP proof hosts.
- `experiments/` → `experiment` — Experiments retain types.md guidance and local type checking; deeper assignments may add standards but do not activate dedicated reviewers or audits.
- `src/flat/` → `app-flat-browser` — Owning Flat browser source.
- `server/flat/` → `app-flat-server` — Owning Flat server source.

## Repository-wide additions and replacements

### ADD: Blank line between type definitions

- Extends: [`types.md#General Types`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md#general-types)
- Scope: `repository`
- Rule: Separate consecutive named type definitions with at least one blank line between the end of the preceding definition and the following definition's JSDoc opening delimiter. Keep each JSDoc block directly attached to the definition it documents, without a blank line between the block and the declaration. This applies to type aliases, interfaces, unions, and other named type declarations, including ambient and exported declarations.
- Reason: Owner-selected local rule, pending later canonical promotion. A blank line before each following type's documentation makes definition boundaries clear.

### ADD: Blank line before each following method's JSDoc

- Extends: [`code-conventions.md#Classes And Utilities`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md#classes-and-utilities)
- Scope: `repository`
- Rule: Separate consecutive class methods with at least one blank line between the preceding method's closing brace and the following method's JSDoc opening delimiter. Keep each JSDoc block directly attached to the method it documents, without a blank line between the block and the method declaration. This applies to constructors, ordinary methods, static methods, getters, and setters.
- Reason: Owner-selected local rule, pending later canonical promotion. A blank line before each following method's documentation makes method boundaries clear.

### ADD: Braces for control-flow bodies

- Extends: [`code-conventions.md#Formatting`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md#formatting)
- Scope: `repository`
- Rule: Use curly braces around control-flow bodies, including single-statement if, else, for, while, and do bodies and early returns. Chained else-if branches may retain their conventional form, with braces around each branch body. Enforce this through prettier-plugin-curly in the repository's Prettier configuration so formatting adds braces and formatting checks reject missing braces.
- Reason: Owner-selected local rule, pending later canonical promotion. Explicit blocks make control flow consistent and prevent an added statement from accidentally falling outside the intended branch or loop.

### ADD: JSDoc descriptions start on the next line

- Extends: [`jsdoc.md#Descriptions`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/jsdoc.md#descriptions)
- Scope: `repository`
- Rule: In a JSDoc comment containing a description, put the opening `/**` delimiter on its own line and begin the description on the following line, prefixed with an asterisk and a space. Do not place description text on the opening delimiter line, even for a short description. Retain the canonical blank line between the description and the first JSDoc tag.
- Reason: Owner-selected local JSDoc formatting rule, pending later canonical promotion. A consistent description line keeps documentation blocks easy to scan.

### ADD: React computations before JSX

- Extends: [`react.md#Component Shape`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/react.md#component-shape)
- Scope: `repository`
- Rule: Compute presentation logic before the JSX that consumes it and assign the result to a named variable. This includes conditional or optional JSX, repeated elements produced by list mapping, and computed attribute values. Build a list of rendered elements in a variable before inserting it, such as `styles` before `<List>{styles}</List>`. The mapping or loop may remain in the same render method; extraction into a separate method is optional. Likewise, use a conditional before the enclosing JSX to assign the chosen JSX element or null to a variable, such as `button` before `<div className="style-button">{button}</div>`. Do not embed conditional expressions, logical rendering expressions, list transformations, or derived-value calculations inside JSX. JSX composes markup using prepared values, named handler references, and calls to named render helpers such as `{this.renderContent()}`. Each render helper computes its own presentation logic before its returned JSX. Apply this within render methods, render helpers, and function components while retaining the canonical side-effect-free rendering and responsibility boundaries.
- Reason: Owner-selected local React rule, pending later canonical promotion. Keeping computation before markup makes the JSX structure readable and its presentation decisions explicit.

### ADD: React render helpers own their region wrappers

- Extends: [`react.md#CSS And Layout Ownership`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/react.md#css-and-layout-ownership)
- Scope: `repository`
- Rule: When a render helper renders a part of a component, the div or other wrapper carrying the CSS class that defines that region belongs inside that helper's returned JSX. The caller may invoke the helper directly inside JSX or insert its prepared result, without supplying the helper's region wrapper. For example, a viewport-content wrapper around _renderContent() belongs inside _renderContent(). A parent still owns wrappers that define its own layout regions.
- Reason: Owner-selected local React rule, pending later canonical promotion. Each semantic render helper should expose and own the markup and class that identify the region it renders.

## Folder-specific additions and replacements

### ADD: Temporary experiment standards lifetime

- Extends: [`documentation.md#Repository Standards Overlay`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/documentation.md#repository-standards-overlay)
- Scope: `folder:experiments/`
- Rule: Temporary experiment-specific standards assignments and overlay entries must be scoped to the owning experiment folder, retain types.md, and state the lifecycle event or phase that ends their authorization. Their default lifetime is active execution, ending on suspension or final closure unless the owner explicitly selects another lifetime. Record the exact prior configuration and temporary changes in the experiment status as restoration provenance; that record does not select active standards. On ending or suspending the experiment, restore only the temporary configuration whose authorization ends at that transition, preserving permanent folder mappings and unrelated changes. A suspended experiment retains the deactivated configuration for compatibility checking at a future owner-selected resumption. Production work and promoted source resolve standards from their destination folders.
- Reason: Contained experiments need bounded standards differences and an explicit restoration path without weakening production standards or losing resumption context.

### ADD: Production Algorithm32 scientific quantities, provenance, and profile completeness

- Extends: [`types.md#General Types`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md#general-types)
- Scope: `folder:src/algorithm32/`
- Rule: Public and durable Algorithm32 quantities must carry explicit units, physical quantity, spectral basis, point or bin meaning, and provenance identity; durable property names must remain unit-neutral and hold unit-bearing values, normalized local computational scalars may use unit suffixes, and radiometric names must distinguish source irradiance before source-path attenuation, incident irradiance after attenuation, and directional incident radiance. A scientific profile must be a named type with one documented default, caller-supplied overrides, every configurable option relevant to the profile, and every difference from the paper or reference configuration it represents.
- Reason: Production Algorithm32 contracts must preserve the meaning, stage, and provenance of scientific values across CPU, GPU, cache, and serialization boundaries. Production Algorithm32 profiles encode selected scientific configurations whose defaults, options, and reference deviations must remain explicit.

### ADD: Production Algorithm32 reference-backed formula symbols

- Extends: [`code-conventions.md#JavaScript And Module Shape`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md#javascript-and-module-shape)
- Scope: `folder:src/algorithm32/`
- Rule: A scientific implementation may retain a published formula symbol only when owning documentation or an adjacent comment identifies its external authority and makes the code-to-formula mapping unambiguous.
- Reason: Production Algorithm32 source must keep compact scientific notation traceable to its reference authority without weakening the general descriptive-identifier rule.

### ADD: Production Algorithm32 scientific descriptor non-authority

- Extends: [`code-conventions.md#Validation And Failure Policy`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/code-conventions.md#validation-and-failure-policy)
- Scope: `folder:src/algorithm32/`
- Rule: Scientific descriptors may identify, fingerprint, report, and diagnose evidence but must not validate executable facts, select algorithms, calculate indexing or packing, or recover executable facts.
- Reason: Production Algorithm32 must keep executable numerical authority separate from descriptive evidence metadata.
