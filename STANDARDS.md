# Repository Engineering Standards

> **Generated developer reference.** Do not modify this file directly or use it as standards authority.
>
> To update it now, tell Codex: `Use $write-standards-guide to update this repository's generated STANDARDS.md now.`

## Authority and provenance

- Folder manifest: [`agents/topics/standards/manifest.md`](./agents/topics/standards/manifest.md)
- Repository overlay: [`agents/topics/standards/overlay.md`](./agents/topics/standards/overlay.md)
- Standards governance: [`documentation.md`](../../Users/gande/.codex/documentation/standards/documentation.md)
- First normalized: `2026-09-11T23:19:47.480Z`
- Repository standards configuration fingerprint: `sha256:f0c899cff44d35ced4c80bc2c7bad73afd4cf6d63aabbce6b4f585bd85f45b72`
- Local standards overlay fingerprint: `sha256:5b67d2e2a7016b3d1f9d1cbe20d1892aeca479a01e641cefc4ef0354d31b8793`
- Selected canonical standards fingerprint: `sha256:c6fead2b7032e6fac8d90d69ee5c9fd56a2743495adf1ac6b02c0e0b4f5c8999`
- Guide source fingerprint: `sha256:660121dc6c6496489a3a079fbe8d2d3a9a9beba0cdbff21bf16f83c6ab8793f3`

For each file, the longest matching folder assignment selects one named standards set. The set includes its inherited canonical standards, then matching folder-scoped overlay rules modify specific sections. This file is a readable projection only.

## Standards sets

### `base`

Extends: `none`

Adds:

- [`documentation.md`](../../Users/gande/.codex/documentation/standards/documentation.md) — Folder applicability and standards governance.
- [`project-foundation.md`](../../Users/gande/.codex/documentation/standards/project-foundation.md) — Repository and package boundaries.

### `code`

Extends: `base`

Adds:

- [`architecture.md`](../../Users/gande/.codex/documentation/standards/architecture.md) — Implementation ownership and dependency boundaries.
- [`code-conventions.md`](../../Users/gande/.codex/documentation/standards/code-conventions.md) — JavaScript and formatting conventions.
- [`types.md`](../../Users/gande/.codex/documentation/standards/types.md) — Ambient public and internal contracts.
- [`jsdoc.md`](../../Users/gande/.codex/documentation/standards/jsdoc.md) — Callable and declaration documentation.
- [`testing.md`](../../Users/gande/.codex/documentation/standards/testing.md) — Behavioral verification and lane boundaries.

### `experiment`

Extends: `base`

Adds:

- [`types.md`](../../Users/gande/.codex/documentation/standards/types.md) — Required types-standard review and type checking for every experiment.

### `build`

Extends: `code`

Adds:

- [`polylith.md`](../../Users/gande/.codex/documentation/standards/polylith.md) — Polylith build, activation, and deployment.

### `application`

Extends: `build`

Adds:

- [`remvc.md`](../../Users/gande/.codex/documentation/standards/remvc.md) — Application responsibility and lifecycle.

### `http-application`

Extends: `application`

Adds:

- [`server.md`](../../Users/gande/.codex/documentation/standards/server.md) — HTTP ingress, transport, filesystem service, and failure boundaries.

### `react-application`

Extends: `application`

Adds:

- [`react.md`](../../Users/gande/.codex/documentation/standards/react.md) — React presentation and adapter lifecycle.

### `react-library`

Extends: `code`

Adds:

- [`react.md`](../../Users/gande/.codex/documentation/standards/react.md) — React presentation and adapter lifecycle.

### `server`

Extends: `build`

Adds:

- [`server.md`](../../Users/gande/.codex/documentation/standards/server.md) — HTTP ingress, transport, filesystem service, and failure boundaries.

### `proof-tools`

Extends: `code`

Adds:

- [`server.md`](../../Users/gande/.codex/documentation/standards/server.md) — HTTP ingress, transport, filesystem service, and failure boundaries.

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

### ADD: Production Algorithm32 scientific quantities, provenance, and profile completeness

- Extends: `types.md#General Types`
- Scope: `folder:src/algorithm32/`
- Rule: Public and durable Algorithm32 quantities must carry explicit units, physical quantity, spectral basis, point or bin meaning, and provenance identity; durable property names must remain unit-neutral and hold unit-bearing values, normalized local computational scalars may use unit suffixes, and radiometric names must distinguish source irradiance before source-path attenuation, incident irradiance after attenuation, and directional incident radiance. A scientific profile must be a named type with one documented default, caller-supplied overrides, every configurable option relevant to the profile, and every difference from the paper or reference configuration it represents.
- Reason: Production Algorithm32 contracts must preserve the meaning, stage, and provenance of scientific values across CPU, GPU, cache, and serialization boundaries. Production Algorithm32 profiles encode selected scientific configurations whose defaults, options, and reference deviations must remain explicit.

### ADD: Production Algorithm32 reference-backed formula symbols

- Extends: `code-conventions.md#JavaScript And Module Shape`
- Scope: `folder:src/algorithm32/`
- Rule: A scientific implementation may retain a published formula symbol only when owning documentation or an adjacent comment identifies its external authority and makes the code-to-formula mapping unambiguous.
- Reason: Production Algorithm32 source must keep compact scientific notation traceable to its reference authority without weakening the general descriptive-identifier rule.

### ADD: Production Algorithm32 scientific descriptor non-authority

- Extends: `code-conventions.md#Validation And Failure Policy`
- Scope: `folder:src/algorithm32/`
- Rule: Scientific descriptors may identify, fingerprint, report, and diagnose evidence but must not validate executable facts, select algorithms, calculate indexing or packing, or recover executable facts.
- Reason: Production Algorithm32 must keep executable numerical authority separate from descriptive evidence metadata.
