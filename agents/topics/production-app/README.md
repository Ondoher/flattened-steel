# production-app

Own the future deployable Flat application's product decisions, integration
requirements, release acceptance and deployment.

## Application Roles And Current Status

Flat32 (`src/flat32`) is the temporary JavaScript integration test bed for the
production Algorithm32 engine. It exercises engine attachment, rendering, cache
delivery, controls, lifecycle and failure recovery. It will not be deployed as
the finished production application.

Algorithm32 (`src/algorithm32`) remains the production engine. Its production
status and qualified behavior are separate from the role of the host used to
test it. Flat32's source, builds, local routes, assets and verification remain
integration infrastructure and evidence.

The real production application is a separate product deliverable. Existing
Flat32 controls, scenes and interaction choices are reference material; their
presence does not select them for the product. Earlier references to Flat32
deployment, publication or release describe the integration host and engineering
qualification, without establishing a deployment target for the finished app.

The owner intentionally removed the former src/flat shell to build the real app
fresh. Its stale app registration, build descriptor and folder assignment are
retired. The owner then authorized a fresh [Flat shell](../flat/README.md) through
create-app with the accepted options. Flat and Flat32 are registered separately;
Flat's shell does not incorporate the test bed's product feature candidates.

The owner-authorized [Flat shell](../flat/README.md) is generated, following the
[server integration refactor](runtime-integration/server-integration.md) and
Polylith upgrade. Current work is design discussion captured in
[Flat implementation notes](../flat/implementation-notes.md), without an
implementation plan or authorization to implement the discussed feature.
The [Flat32 feature candidate inventory](product-behavior/flat32-feature-review.md)
remains pending inclusion or adaptation review for the real application.
That inventory selects no new product implementation, application name,
framework, UI, route, build identity or deployment configuration. Existing MVP
requirements and unresolved evidence remain recorded by their current owners.

Selected product decisions are owned by
[Product behavior](product-behavior/README.md#selected-production-app-behavior).

## Deployment Posture

This repository is a discoverable application repository. The finished app will
be composed beneath a separate Polylith parent/server-root repository. Its app
catalog, build, composed mount and optional deployment setup remain owned here;
the parent owns discovery locations, mechanical server settings and the combined
deployment destination. This repository declares no discovery roots and remains
independently buildable and runnable for development.

polylith.json uses the discovery-required multiple: true and explicit apps array.
Flat32's current /flat32 mount belongs to the integration test bed. The finished
app's selected identity and mounts are recorded in the
[scaffold choices](product-behavior/README.md#scaffold-capabilities). Its worker
and copied assets must follow Polylith's composed output destination; the existing Flat32
worker script writes locally and is not a production deployment implementation.
The [server integration owner](runtime-integration/server-integration.md#discoverable-repository-contract)
records the current configuration checks and remaining composition verification.

## Focus Areas

- [mvp](mvp/README.md) — Deferred requirements that still block first-MVP completion.
- [runtime-integration](runtime-integration/README.md) — Integration contracts and Flat32 test-bed evidence for attachment, lifecycle, state and asset delivery.
- [product-behavior](product-behavior/README.md) — Feature candidates for review, selected controls and explicit product backlog.
- [release](release/README.md) — Release gates, deployment inputs, and owner decisions.

Select one focus entry and its task-specific owner. Do not reload every focus.
[Other work topics](../README.md) and [historical documents](../context/topic-migration-archive-index.md)
are navigation, not additional routine context.
