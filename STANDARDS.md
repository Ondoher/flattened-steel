# Repository Engineering Standards

> **Generated developer reference.** Do not modify this file directly or use it as standards authority.
>
> To update it now, tell Codex: `Use $write-standards-guide to update this repository's generated STANDARDS.md now.`

## Authority and provenance

- Folder manifest: [`agents/topics/standards/manifest.md`](./agents/topics/standards/manifest.md)
- Repository overlay: [`agents/topics/standards/overlay.md`](./agents/topics/standards/overlay.md)
- Standards governance: [`documentation.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/documentation.md)
- First normalized: `2026-09-11T23:19:47.480Z`
- Repository standards configuration fingerprint: `sha256:81d273be459279d61a883397e0c6c6d95f378c0779e3993ff4059ed2d8349c37`
- Local standards overlay fingerprint: `sha256:5b28310018e8c1276d1c6b6dbfe3bc0c731c4a7f2f44b6d68b68fdf9e7b04dd9`
- Selected canonical standards fingerprint: `sha256:903b801f67640b1c060ee503085aa7fa81cdd31b91f8d6f34dceccc21b5f2a8d`
- Guide source fingerprint: `sha256:f49543072f326e6036b0325a5ae96de4b5cb1c038779aefc3f089dd68bf003df`

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

- [`types.md`](https://github.com/Ondoher/polylith-skills/blob/main/documentation/standards/types.md) — Required types-standard review and type checking for every experiment.

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

## Folder assignments

- `.` → `build` — Root package, Polylith, build, and runner configuration.
- `agents/` → `base` — Work context and standards configuration; topics do not select standards.
- `.agents/` → `base` — Repository workflow documentation.
- `.agents/skills/start-experiment/scripts/` → `code` — Authored scaffolding automation.
- `references/` → `base` — Scientific source, claim, and result registers; retained evidence is not active code.
- `archives/` → `base` — Immutable historical evidence; mapping never authorizes edits.
- `src/` → `code` — Shared authored implementation and contracts.
- `src/algorithm32/implementation/react-three/` → `react-library` — Production React and R3F bindings inside the standalone engine.
- `src/flat/` → `react-application` — React Polylith application.
- `src/flat32/` → `http-application` — Polylith application with imperative DOM and client HTTP package loading.
- `server/` → `server` — Polylith router and filesystem-backed application services.
- `server/flat32/data/` → `base` — Operational asset documentation and immutable scientific packages, not database entities.
- `scripts/` → `code` — Offline tooling and independent scientific runners.
- `scripts/algorithm32/solar-zenith-cache/` → `proof-tools` — Offline compiler and local HTTP browser proof hosts.
- `scripts/flat32/` → `server` — Application build, capture, and cache-service tooling.
- `scripts/experiments/b1-directional-sky-radiance/` → `proof-tools` — Independent scoring and GPU HTTP proof host.
- `scripts/experiments/algorithm32-frame-parity/` → `proof-tools` — Independent CPU/GPU frame comparison and HTTP proof hosts.
- `experiments/` → `experiment` — Every experiment requires types-standard review and type checking; deeper assignments retain types.md and may add standards.

## Repository-wide additions and replacements

None.

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
