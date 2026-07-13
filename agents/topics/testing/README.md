# Testing

Status: current testing architecture, setup, and migration plan.

This repository uses Jasmine as the production-code test framework.
Algorithm32 is a standalone source package under `src/algorithm32`, not a
Polylith application. Its complete source suite runs directly in Node. A
separate focused lane runs Jasmine through Karma and Chrome when a contract
requires real Three.js and WebGL behavior. Neither lane requires Polylith or
an application build.

## Production Algorithm32 Lane

The canonical complete-suite command is:

```text
npm run test:algorithm32
```

It uses the dedicated
[`spec/support/jasmine-algorithm32.json`](../../../spec/support/jasmine-algorithm32.json)
configuration rooted at `src/algorithm32` and
discovers class-local specs with:

```text
**/_tests/**/*.spec.?(m)js
```

Specs remain adjacent to the code they establish. Shared Jasmine helpers, if
needed, live under `spec/helpers/`. The configuration uses deterministic order
(`random: false`) and continues after individual expectation failures so one
run reports the complete focused failure set.

The copied Algorithm32 source already has this `_tests/` layout. Its first
test surface covers the facade, atmosphere, geometry, light sources, transport,
cache/resource construction, color, shader assembly/runtime, React/Three
adapters, and imported celestial-support code. During visible integration,
run only the narrow Jasmine specs or smoke checks needed to advance the active
feature. The complete Algorithm32 Jasmine lane is follow-on hardening and a
release-acceptance requirement.

The [baseline import status](../algorithm32/production/baseline-import-status.md)
owns the current result. Focused development may still pass individual
adjacent spec paths directly to Jasmine, but those commands do not replace the
canonical complete lane.

## Three/WebGL Browser Lane

Run focused renderer conformance checks with:

```text
npm run test:algorithm32:three
```

For a durable focused browser run, set `ALGORITHM32_THREE_GREP` to a
karma-jasmine string or `/regular-expression/` before invoking the same
command. The Karma configuration passes that value through the adapter's
documented grep seam, so focused evidence never requires committed
`fit`/`fdescribe` markers. The
[baseline status](../algorithm32/production/baseline-import-status.md#focused-stage-7-browser-reproduction)
owns the exact current Stage 7 filter and selected spec names.

This command uses
[`spec/support/karma-algorithm32-three.conf.cjs`](../../../spec/support/karma-algorithm32-three.conf.cjs)
to serve the standalone Algorithm32 modules and the installed Three.js module
build directly to Chrome. Karma is only the browser launcher and Jasmine host;
the command does not invoke a Polylith build or an application.

Browser-only specs remain adjacent to the production surface they exercise and
use the distinct discovery pattern:

```text
**/_tests/**/*.browser.js
```

The browser surface verifies WebGL2, float render-target support, array
layer limits, high-precision fragment support, R32F array-target framebuffer
completion, explicit layer submission, shader execution and scalar readback,
renderer-state restoration, and owned-resource cleanup. It also executes the
complete selected N1/N2/N4 construction graphs against the checked binary64
oracle, verifies cross-runtime descriptor identities, and records the active
renderer identity. A pass produced by a software renderer establishes browser,
API, and selected numerical conformance only; it is never hardware performance
evidence.

The [baseline import status](../algorithm32/production/baseline-import-status.md)
owns the current result. Stage 4.0 uses this lane for the production backend,
opaque R32F inputs, state restoration, and an assembler-produced executable
shader. Stages 4.1, 4.2, and 5 use the same lane for selected CPU/GPU
scalar-parity, recurrence, bounded-readback, and resource-lifecycle checks
rather than creating a separate harness. Karma maps the production modules'
bare `three` package imports to the served installed ESM build only inside this
native-browser test host.

## Test Layers

| Layer | Owner and runner | Purpose |
| --- | --- | --- |
| Focused production unit tests | Jasmine / Node | Class and contract behavior, fixtures, validation, and deterministic CPU calculations. |
| Production integration tests | Jasmine / Node | Cross-owner Algorithm32 behavior, cache lifecycle, selected CPU/GPU-boundary contracts, and imported-baseline parity. |
| Three/WebGL conformance tests | Jasmine / Karma / Chrome | Real renderer capabilities, shader compilation and execution, array-layer rendering, selected readback, state restoration, and resource lifecycle. |
| Offline Star parity | Dedicated Node comparator, with an explicit Karma/WebGL consumer where required | Read the project-lifetime [Star parity data set](../algorithm32/production/star-parity-data-set.md) to establish implementation fidelity. The bulk gold is not an ordinary unit-test fixture. |
| Application/browser tests | App-specific runner when an app needs it | Application composition, bundled integration, and UI behavior. They are not an Algorithm32 prerequisite. |
| Official experiments | Standalone runner and durable result | Preimplementation scientific evidence. An experiment is not a production conformance test. |

Jasmine unit and integration tests may verify implementation against accepted
facts and fixtures. They do not establish physical truth; external references
and official experiments own that evidence.

## Experiment Migration

Current experiments use Node-based runners. They remain independently
runnable while their outputs are being used or archived. Over time, convert
their executable checks to Jasmine without changing their scientific boundary:

1. preserve the experiment's declared inputs, oracle, iteration definition,
   acceptance criteria, output schema, and durable result;
2. move deterministic assertions into adjacent Jasmine specs or an
   experiment-local Jasmine configuration;
3. keep the experiment runner responsible for producing the independently
   reproducible published artifact; and
4. register the accepted result in `/references/experiments.md`.

Do not turn an experiment into a test that imports production Algorithm32 or
an application. Production tests and experiments remain separate evidence
lanes even when both use Jasmine.

## Sequencing

Visible production integration follows cache, ground, flat geometry and the
local Sun, shared composition, `flat32`, then extraterrestrial sources. Full
Jasmine coverage, import-parity verification, and broad application/browser
integration testing follow that visible path as hardening. They are required
before release acceptance or publication, not before development begins or
advances to the next visible stage. Focused Three/WebGL checks that establish
a GPU phase's actual renderer contract belong inside that phase.

Within every visible capability phase, CPU implementation comes first and its
GPU counterpart follows before the phase is complete. Focused CPU/GPU parity
and lifecycle checks belong to that phase; the broad regression and
release-acceptance suite remains follow-on hardening.

## Current Setup

- `spec/support/jasmine-algorithm32.json` owns the focused discovery pattern
  and deterministic environment settings.
- `npm run test:algorithm32` runs the complete standalone Node Jasmine lane.
- `spec/support/karma-algorithm32-three.conf.cjs` owns the adjacent browser-spec
  discovery pattern and headless-Chrome settings.
- `npm run test:algorithm32:three` runs the focused standalone Three/WebGL
  Jasmine lane through Karma.
- No shared Jasmine helper directory exists because the current suite does not
  require one. Add a focused helper only when multiple real specs need it.
- `npm run typecheck:algorithm32` remains the separate static JavaScript/JSDoc
  contract check.

No Polylith test command is part of either standalone Algorithm32 lane. Use the
browser lane only for real renderer/GPU contracts; keep implementation logic
and deterministic CPU behavior in the faster Node lane.

The root `npm test` command belongs to the separate, incomplete Polylith
application-test scaffold. It is not an Algorithm32 command.
