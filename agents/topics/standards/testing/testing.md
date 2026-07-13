# Testing

## Purpose

Tests provide executable evidence that public behavior, integration contracts,
and important failure policies remain correct. They should make a change safer
to maintain, not merely increase coverage numbers.

This repository does not require strict test-first development. Implementation
may lead, but behavior-changing work should finish with focused tests that
capture the intended contract and its meaningful boundaries.

## Durable Principles

### Test observable contracts

Prefer assertions about public results and externally visible effects over
private method calls or implementation order. A refactor that preserves the
contract should not require widespread test rewrites.

Use both levels where they add value:

- code-level tests cover small functions, component behavior, validation, and
  edge cases;
- domain-level tests state a larger promise in the vocabulary of the subsystem
  and may exercise several collaborators together; and
- integration tests prove boundaries that unit fakes cannot, such as bundling,
  browser behavior, resource lifecycle, or serialization compatibility.

Do not force every test into the smallest possible unit. Choose the smallest
scope that can prove the behavior without reproducing the implementation in the
test.

### Cover boundaries and failure behavior

Happy-path examples are necessary but insufficient. Include applicable cases
such as:

- empty, minimum, maximum, and malformed inputs;
- unsupported values and incompatible versions;
- cancellation, timeout, disposal, and repeated calls;
- missing dependencies or resources;
- stale asynchronous results;
- setup failures versus recoverable runtime failures; and
- preservation of canonical identifiers, units, ordering, and metadata across
  a transformation.

Every production bug fix should normally include a regression test that fails
for the original defect and passes for the corrected behavior.

### Keep tests deterministic and independent

- Control time, randomness, locale, and environment when they affect results.
- Do not depend on test execution order.
- Restore globals, DOM state, timers, mocks, and owned resources after each
  test.
- Avoid live network services in routine unit lanes. Use explicit fixtures or
  narrow fakes unless the test is intentionally an external integration lane.
- Give asynchronous work a bounded completion condition; do not use arbitrary
  sleeps as synchronization.
- Prefer stable semantic assertions over snapshots of large incidental output.

If nondeterminism is part of the subject, expose or record the seed and make a
failure reproducible.

### Use representative test data

Keep substantial fixtures in dedicated files rather than burying them in large
spec literals. A fixture should state enough context to explain what it proves,
including units, assumptions, source or derivation when relevant, and an
explicit tolerance for numerical comparisons.

Do not regenerate expected output with the same implementation under test.
Prefer independently derived expectations, small hand-checkable cases, or
accepted reference artifacts.

### Use test doubles at ownership boundaries

Mock a dependency because the test owns a boundary, not because mocking makes
an assertion convenient. A good fake implements the smallest public contract
needed by the scenario and fails clearly on unexpected use.

Repeated setup belongs in a shared test builder or harness once a stable common
shape emerges. Keep scenario-specific overrides in the spec so the reason for a
test remains visible.

### Make failures useful

- Name suites and specs in terms of behavior and conditions.
- Keep one primary reason for failure per spec.
- Include expected units or identifiers in assertions where ambiguity is
  possible.
- Avoid broad exception assertions when the error class or message is part of
  the contract.
- Do not weaken an expectation merely to make a flaky test pass; identify and
  control the unstable input.

## Test Placement And Naming

Place source specs near the code they exercise, normally in a neighboring
`_tests` directory. New JavaScript specs should use `*.spec.js` unless a
configured test group requires another pattern. Keep test-support modules out
of production entry points.

Shared browser test support may live in a dedicated `src/testing` area once it
has more than one real consumer. Suitable contents include fixture builders,
DOM mounting helpers, registry setup, and commonly reused fakes.

Generated test bundles belong under `tests/` and must not become the source of
truth for specs or expected data.

## React And Browser Testing

Test the behavior a user or owner can observe:

- rendered semantic content and any accessibility state in scope;
- callbacks emitted for user intent;
- local state transitions;
- loading, empty, error, and disabled states;
- focus and keyboard behavior where relevant; and
- setup and cleanup of browser-owned resources.

Avoid assertions against component internals, framework bookkeeping, or exact
markup that has no contract significance. Use a real browser lane when layout,
browser APIs, module bundling, or renderer behavior matters; pure data logic
should not require a browser merely because a component consumes it.

## Service And Lifecycle Testing

When service-style classes are introduced, narrow unit tests can instantiate
the class directly with test-specific dependencies. Use the real registry or
lifecycle coordinator only when startup order, readiness, subscription, or
cross-service wiring is the behavior under test.

The distinction should remain explicit:

- direct construction proves isolated public behavior; and
- lifecycle-driven setup proves integration and sequencing.

Do not start the whole application for a service test that needs only one
collaborator and a small fake.

## Current Toolchain Baseline

The current repository declares Jasmine, Karma, the Jasmine Karma adapter, a
headless-Chrome launcher, Three.js, and Polylith build tooling. Those packages
support distinct lanes; the presence of Polylith does not make it a dependency
of standalone source testing.

Two Algorithm32 lanes are established:

- `npm run test:algorithm32` runs adjacent `*.spec.js` and `*.spec.mjs` files
  directly in Node through the dedicated Jasmine configuration; and
- `npm run test:algorithm32:three` runs adjacent `*.browser.js` files through
  the dedicated Karma/Jasmine/headless-Chrome configuration and serves the
  installed Three.js ES modules directly.

Both commands are deterministic, one-shot commands with nonzero failure exit
status. Neither invokes Polylith or an application build. The
[Algorithm32 testing topic](../../testing/README.md) owns their exact current
configuration and result boundary.

The root `npm test` command belongs to a separate, incomplete Polylith
application-test scaffold. It launches concurrent watch processes with the
Windows `start` command and refers to a root `karma.conf.cjs` that is not
checked in. It is not an Algorithm32 command or a portable one-shot CI lane and
must not be cited as evidence that application tests pass.

## Standalone Algorithm32 Flow

Use the Node lane for deterministic source behavior, contracts, fixtures, and
CPU integration. Use the Three/WebGL lane only when a real browser renderer is
part of the contract, including WebGL capability discovery, shader execution,
array render targets, selected readback, and renderer resource lifecycle.

Karma is the browser launcher and Jasmine host for the Three/WebGL lane; it is
not a source bundler. Browser-only specs import served ES modules and use a
discovery suffix excluded from the Node lane. A software-renderer result can
establish API conformance but cannot establish hardware performance.

Keep both lanes independently runnable so failures remain attributable and the
Node development loop stays fast. A broad convenience command may invoke them
both later, but it does not replace either focused command.

## Polylith Application Browser Scaffold

When an application or feature needs bundled browser tests, retain the
repository's Polylith build model:

1. app- or feature-level `testGroups` select source specs;
2. `src/<app>/spec.js` imports `@polylith/tests`;
3. `polylith test <app>` bundles selected specs into `tests/<app>/`;
4. Karma serves the built JavaScript and CSS; and
5. Jasmine runs the bundle in a headless browser.

Karma is the browser execution runner in this model, not the source bundler. If
a spec does not appear, first check its `testGroups` glob and the generated
bundle before debugging Karma discovery.

An application Karma configuration should explicitly define:

- Jasmine as the framework;
- the selected `tests/<app>/**/*.js` files as browser modules;
- applicable generated CSS assets;
- a headless browser launcher;
- deterministic single-run behavior for CI; and
- separate watch behavior for local development.

Keep application commands distinct:

- a one-shot command that builds the test bundle and exits with the browser
  result;
- a build-only watch command for sustained development; and
- a runner-only command that executes the latest built bundle.

The current root package scripts approximate the latter two application roles,
but the scaffold still needs configured test groups, a checked-in application
Karma configuration, and a deliberate one-shot command before it is an
established lane.

## Definition Of Done For A Test Lane

A lane is established only when:

- source discovery is explicit and covered by at least one representative
  spec;
- the documented command is checked in and exits on completion;
- failures produce a nonzero exit status;
- any generated output is reproducible and ignored as build output;
- when watch behavior is provided, it is a separate command from one-shot CI
  behavior; and
- the lane has been run successfully in the environment it claims to support.

Until those conditions hold, describe the lane as planned or scaffolded rather
than passing.
