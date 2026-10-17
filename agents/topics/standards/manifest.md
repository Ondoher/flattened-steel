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

### `experiment`

Extends: base
Standards:

- [types.md](../../../../../Users/gande/.codex/documentation/standards/types.md) - Experiment contract guidance for authoring, self-review, and local type checking; dedicated reviewers are disabled by repository policy.

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
- `experiments/` - `experiment` - Experiments retain types.md guidance and local type checking; deeper assignments may add standards but do not activate dedicated reviewers or audits.

## Repository Overlay

[overlay.md](overlay.md) owns repository additions and replacements.
