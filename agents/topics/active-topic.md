# Active Topic

Current active topic: production-app.
Canonical entry: [Production app](production-app/README.md).
Focus: the owner-authorized [first workspace implementation](flat/README.md),
completed and corrected for feature ownership with local verification on
2026-10-29. Its model, controller/view, React frame, contribution service, styles,
types, and tests belong to features/workspace. The app feature retains activation
and navigation through public capabilities. The persistent frame has shared
contribution hosts, one empty view, optional comparison, and scoped nonmodal
configuration. Workspace state, workflow, view projection, and React presentation
follow the [component proposal](flat/component-service-proposal.md).
The base stylesheet now contains shared CSS color variables for the selected
#121212 background and #F2F2F2 text/borders; the blue action token is a
provisional visual approximation pending an exact swatch RGB value.
The [product description](flat/product-description.md) remains input for later
refinement. Observation/location/date/time controls, height/FOV controls, and
Flat Earth shader integration remain future feature work. The intended first
scene integration stays recorded in the [implementation notes](flat/implementation-notes.md).
A focused [React/ReMVC self-review](flat/react-remvc-audit.md) reread both
standards and corrected React/service boundaries, view projection, semantic
render helpers, dependency readiness, and exact lifecycle cleanup. Current
local checks pass; independent standards review remains cancelled.
The owner subsequently added local React requirements in the
[standards overlay](standards/overlay.md#add-react-computations-before-jsx), pending
later canonical promotion. The owner-authorized application pass applies both
rules to the new Flat components. Lists, optional content, labels, and computed
attributes are prepared before JSX, and render helpers own their region wrappers.
Type checking, build, 64 browser tests, 4 server tests, and served UI checks pass.
The focused self-review records the follow-up and its evidence limits.
The accumulated local JSDoc, method/type spacing, control-flow brace, and React
rules have now been applied across all 71 Flat browser/server source and
declaration files, including tests. The [Flat entry](flat/README.md#verification)
owns the current scope and evidence. Client/server type checks, build, formatting,
65 browser tests, and 4 server tests pass. Global promotion remains future work.
Trusted internal page/contribution metadata and feature capabilities are no
longer revalidated. HTTP context resolution now follows registry readiness and
uses the current canonical locale without guessing a missing service contract.
Workspace CSS now ships through its feature-owned build descriptor as a copied,
HTML-linked stylesheet. Browser tests load source CSS explicitly. Build, type,
test, and served-layout checks pass; four captures match the prior rendering.
No further feature work, experiment resumption, or refine-design execution is
automatically selected by this workspace handoff.
The owner cancelled the current standards-review process while the review skill
is still in development. Its partial evidence is preserved; review execution is
stopped and no automatic resumption is selected.
The fresh Flat shell replaces the owner-deleted former shell and remains
separate from the Flat32 integration test bed.
The finished app will be deployed as a discoverable child beneath a separate
Polylith parent; the [deployment posture](production-app/README.md#deployment-posture)
owns that decision. Controlled standalone and discovered shell checks are
recorded by the Flat app entry. Actual parent deployment and production worker
integration remain future obligations.
The [application roles](production-app/README.md#application-roles-and-current-status)
own the current product boundary. Shell scaffolding and the workspace-only first
pass were explicitly authorized; further feature implementation and experiment
resumption are not selected.

Last experiment: poc-experiments/engineering-studies/clean-horizon-profiles,
suspended by the owner on2026-10-26. Its
[suspension and resumption boundary](poc-experiments/engineering-studies/clean-horizon-profiles/status.md#suspension-and-resumption-boundary)
is retained as context, without an active execution queue. Resume only after
explicit owner selection. No production promotion or new application work is
authorized by the experiment handoff; the later owner request authorizes the Flat
shell and workspace separately.

## Minimal Reload Sources

1. [Repository instructions](../../AGENTS.md).
2. [Production app](production-app/README.md).
3. [Flat shell](flat/README.md).
4. [Selected product behavior](production-app/product-behavior/README.md).
5. [Initial Flat product description](flat/product-description.md).
6. [Flat implementation notes](flat/implementation-notes.md).
7. [Component and service proposal](flat/component-service-proposal.md).
