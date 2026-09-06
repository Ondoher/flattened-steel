# Testing

Focus: Engine conformance and production benchmark export.

Related owners: [runtime-integration](../../production-app/runtime-integration/testing-contract.md), [protocols](../../poc-experiments/protocols/testing-contract.md).

## Production Algorithm32 Lane

The canonical complete-suite command is:

```text
npm run test:algorithm32
```

It uses the dedicated
[`spec/support/jasmine-algorithm32.json`](../../../../spec/support/jasmine-algorithm32.json)
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

The [baseline import status](../architecture-contracts/baseline-import-status.md)
owns the current result. Focused development may still pass individual
adjacent spec paths directly to Jasmine, but those commands do not replace the
canonical complete lane.


## Test Layers

| Layer | Owner and runner | Purpose |
| --- | --- | --- |
| Focused production unit tests | Jasmine / Node | Class and contract behavior, fixtures, validation, and deterministic CPU calculations. |
| Production integration tests | Jasmine / Node | Cross-owner Algorithm32 behavior, cache lifecycle, selected CPU/GPU-boundary contracts, and imported-baseline parity. |
| Three/WebGL conformance tests | Jasmine / Karma / Chrome | Real renderer capabilities, shader compilation and execution, array-layer rendering, selected readback, state restoration, and resource lifecycle. |
| Offline Star parity | Dedicated Node comparator, with an explicit Karma/WebGL consumer where required | Read the project-lifetime [Star parity data set](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/production/star-parity-data-set.md) to establish implementation fidelity. The bulk gold is not an ordinary unit-test fixture. |
| Application/browser tests | App-specific runner when an app needs it | Application composition, bundled integration, and UI behavior. They are not an Algorithm32 prerequisite. |
| Official experiments | Standalone runner and durable result | Preimplementation scientific evidence. An experiment is not a production conformance test. |

Jasmine unit and integration tests may verify implementation against accepted
facts and fixtures. They do not establish physical truth; external references
and official experiments own that evidence.


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
