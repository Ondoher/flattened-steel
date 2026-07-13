# React Code

Use this topic for repository-wide guidance when writing or refactoring React
presentation code. It covers component boundaries, state, effects, markup,
layout, and component ownership. Application architecture and domain-specific
contracts should live in their own standards.

## Current Baseline

The repository currently has a small React 18 scaffold with a class component
and a `ReactDOM.render(...)` entry point. That is evidence of the starting
toolchain, not a requirement that all future components use classes or that the
entry-point shape is final.

Both function and class components are acceptable. Follow the surrounding
code, choose the shape that expresses the lifecycle clearly, and do not rewrite
working components solely to change styles. New function components must obey
the Rules of Hooks; class components must keep setup and cleanup in matching
lifecycle methods.

## Presentation Boundary

React owns concrete presentation and local interaction mechanics. It should not
become the default owner of domain rules, persistence, transport, or broadly
shared application state.

Prefer this flow:

- owners prepare data and presentation decisions;
- components receive those values through props;
- components report user intent through callbacks;
- domain or application services perform durable state changes; and
- components retain only state that is genuinely local to the UI.

Local state is appropriate for concerns such as an open panel, an in-progress
field value, focus-related state, or a temporary selection. Move state outward
when multiple distant consumers need it, it must survive component lifetime,
or it represents a canonical application fact.

Rendering must stay free of observable side effects. Do not subscribe, perform
network work, mutate services, or imperatively change the DOM during render.
Create those effects after mounting and always provide matching cleanup.

## Component Shape

- Name component files in `PascalCase` after their primary component.
- Give each component one clear responsibility and a small, explicit prop
  contract.
- Prefer data derived during render over duplicated state that must be kept in
  sync.
- Keep event handlers focused on translating an interaction into local state or
  an owner-supplied callback.
- Break a large render into focused components or small render helpers when it
  contains several independently meaningful regions.
- Use stable semantic keys for lists; do not use an array index when items can
  be inserted, removed, or reordered.
- Avoid premature generic components. Extract reuse after a stable shared
  contract is visible.

JSX should make the semantic regions of the interface obvious. A control group,
status block, preview, list, toolbar, and content region should normally have
explicit elements rather than relying on CSS to infer structure from a flat
sequence of children.

## Props, State, And Effects

- Treat props as immutable inputs.
- Keep one canonical owner for each state fact; do not mirror props into state
  without a demonstrated synchronization need.
- Use controlled inputs when their value participates in validation,
  submission, or shared state. Local uncontrolled inputs are acceptable when
  their value is intentionally isolated.
- Keep effect dependencies accurate. If an effect cannot safely rerun when a
  dependency changes, improve the ownership or lifecycle instead of suppressing
  the dependency.
- Cancel or ignore stale asynchronous work when a component unmounts or a newer
  request supersedes it.
- Clean up subscriptions, timers, observers, event listeners, and owned
  imperative resources.
- Store mutable values that do not affect rendering in an instance field or
  ref, not in render state.

## Markup, CSS, And Layout

Use semantic HTML first. Native buttons, labels, inputs, headings, lists, and
landmarks provide behavior and accessibility that generic elements do not.
Interactive behavior added to a non-interactive element requires keyboard,
focus, role, and state semantics and should be rare.

Keep ownership of structure and styling aligned:

- a component owns the markup and class names for its internal organization;
- component- or feature-local styles own internal layout, focus, state, and
  interaction styling;
- a parent region owns placement and sizing of its children;
- broad stylesheets should contain genuinely broad tokens and defaults; and
- CSS should determine visual arrangement while JSX defines the boxes being
  arranged.

Prefer CSS Grid for major two-dimensional regions and Flexbox for simple
one-dimensional alignment. Preserve the same semantic groups across responsive
modes and change their layout in CSS unless the content itself changes.

Use CSS backgrounds for decorative chrome and layout-affecting imagery. Use an
`img` element when an image is content and its intrinsic or alternative-text
semantics matter.

## Optional Accessibility And Interaction Hygiene

This is a non-consumer repository. Apply these as low-cost defaults when they
fit the technical surface being built, not as release gates or an accessibility
conformance claim. See
[Optional Accessibility and Localization Considerations](../optional-accessibility-localization.md)
for the scope boundary.

- Prefer controls that can be reached and used from a keyboard.
- Give form controls an accessible name and associate visible labels with their
  inputs when practical.
- Preserve visible focus indicators.
- Use ARIA to fill a semantic gap, not to replace an available native element.
- Consider announcing important asynchronous status changes when they would
  otherwise be difficult to perceive.
- Avoid making color, pointer position, or animation the sole carrier of
  important meaning.

## Shared And Local Ownership

Keep a component with the feature or presentation area that owns its meaning.
Promote it to a shared component area only when multiple consumers share a
real contract, not merely similar markup. Move its styles, tests, and support
files with it, and do not make one feature depend on another feature's private
components.

Shared components should expose presentation-oriented props and callbacks.
They should not silently reach into a consumer's services, registry, or global
state.

## Verification

Behavioral changes to a component should add or update tests at the narrowest
useful level. Test observable rendering, in-scope accessibility behavior,
callbacks, and local state transitions rather than private method structure.
See the [testing standard](../testing/testing.md) for lane selection and the
current state of the repository's browser test scaffold.
