# Testing

Focus: Application attachment, lifecycle, state, and asset delivery.

Related owners: [qualification](../../production-algorithm32/qualification/testing-contract.md), [protocols](../../poc-experiments/protocols/testing-contract.md).

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
[baseline status](../../production-algorithm32/qualification/baseline-import-status.md#focused-stage-7-browser-reproduction)
owns the exact current Stage 7 filter and selected spec names.

This command uses
[`spec/support/karma-algorithm32-three.conf.cjs`](../../../../spec/support/karma-algorithm32-three.conf.cjs)
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

The [baseline import status](../../production-algorithm32/architecture-contracts/baseline-import-status.md)
owns the current result. Stage 4.0 uses this lane for the production backend,
opaque R32F inputs, state restoration, and an assembler-produced executable
shader. Stages 4.1, 4.2, and 5 use the same lane for selected CPU/GPU
scalar-parity, recurrence, bounded-readback, and resource-lifecycle checks
rather than creating a separate harness. Karma maps the production modules'
bare `three` package imports to the served installed ESM build only inside this
native-browser test host.
