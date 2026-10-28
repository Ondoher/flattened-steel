# Flat32 Server Integration

Status: server composition restructured on 2026-10-26 under explicit owner
authorization, with all six Polylith packages upgraded to the latest published
release, 1.3.0. Flat32 remains the integration test bed described by the
[application roles](../README.md#application-roles-and-current-status).

## Startup And Ownership

Polylith owns Express, static serving and the network listener. Root
polylith.json selects server/setup-deployment.js, which attaches the installation
registry before app routers start. Master execution starts shared services;
discovered execution attaches without restarting them. The selected repository
posture is [discoverable](../README.md#deployment-posture).

The Flat32 build selects server/flat32/index.js and retains the /flat32 mount.
The app has an independent Registry in registry.js; installation services are
attached under shared rather than merged into app-local services. No end-user
application shell or new fallback route was added. Flat32 is the only registered
test-bed app. The separate [Flat shell](../../flat/README.md) was subsequently
generated under owner authorization and owns its own routing and verification.

The app entry activates services/routers.js and features/index.js. Each package
feature initializes its own authenticated data capability in start(). Its HTTP
adapter locates that capability and registers with routers during ready(). The
main router installs the resulting ordered contributions after startup completes.
The contribution registry rejects duplicate identifiers and multiple final
fallbacks, keeps a final router last when one is selected, and resets on restart.

Feature capabilities own package selection, validation, file access and readable
streams. The routing directory owns HTTP input parsing, status/headers and
response delivery. Shared stream handling releases file resources when responses
close and returns opaque unexpected errors while retaining server diagnostics.
The ordinary local-file reader is shared by the catalog and vision features;
the existing authenticated shared-cache reader and physical selection remain.

## Discoverable Repository Contract

The owner selected discoverable application posture on 2026-10-26. polylith.json
uses multiple: true and the explicit apps array required by Polylith 1.3's
discovery reader. It publishes the current test bed's /flat32 mount and retains
the repository-owned setup entry point. No discover roots are declared here;
those belong to the separate parent repository.

Discovery acceptance and effective app normalization are checked using the
installed Polylith reader with this repository as the discovered app source and
a synthetic parent output root. Source and setup identities remain here while
the effective destination resolves below the parent's deployment directory.
This is a configuration check, not an end-to-end parent-host deployment test.
The local effective app list also remains valid, and full npm run build,
npm run format:check and whitespace checks pass after enabling discovery.

Flat32 remains local integration infrastructure and will not be the deployed
product. Its custom shared-cache worker builder still targets local dist/flat32.
The fresh production app must integrate worker generation into the composed
build output and verify page, worker and package delivery beneath its selected
mount alongside a sibling app. Parent/discovered setup ordering and shared
registry identity must also be exercised through actual composed startup before
claiming deployment readiness. No parent repository or new app is created here.

## Retained Endpoints

| App-relative path | Behavior |
| --- | --- |
| /api/distant-sun-scene-cache | Validates the scalar solarZenithDegrees query and returns the selected cache descriptor. |
| /scene-caches/* | Complete authenticated immutable files, with retained cache policy and no partial-range response. |
| /stellar-catalogs/brightest-2000-stellar-package-v1/* | Local-only catalog streams with private revalidation policy. |
| /presentation-filters/human-vision-filter-package-v1/* | Local-only vision-filter JSON streams with private revalidation policy. |

Existing environment-selected catalog and filter roots remain supported. Invalid
or missing startup packages retain their logged diagnostics and 503 response
surfaces. Missing or invalid assets return 404; invalid cache selection returns
400. Unexpected asset and stream failures produce opaque 500 errors, or close an
already-started response. Package bytes, provenance, scientific configuration,
cache selection and existing evidence were not rewritten.

The old server/flat32-router.js and top-level catalog/filter factory modules were
replaced by the app entry, registry services and HTTP adapters. Repository-owned
tests and qualification callers use the new entry and explicit shared registry.
Future qualification records include the expanded server implementation and
lockfile identities; sealed prior records retain their original identities.

## Verification And Limits

- Latest npm release checked: Polylith and @polylith/server 1.3.0; all six direct
  Polylith packages installed at 1.3.0 with lockfile updates.
- npm run test:server: 21 passing cases across existing package proofs, router
  ordering and isolation, deployment setup, mounted HTTP integration, ordinary
  file boundaries, opaque failures and streaming.
- npm run typecheck:server, npm run typecheck:flat32 and
  npm run typecheck:algorithm32 pass. The server has an explicit Node type-check
  boundary; Node 25 typings match the installed Node runtime, and dependency
  JavaScript is excluded from authored-source checking.
- npm run build:flat32 and npm run build:test:flat32 pass. The existing basic
  Karma lane passes 72 cases, with its one full-cache case intentionally skipped.
- The actual Polylith CLI serve flat32 path starts successfully: the mounted page,
  scalar cache selection and stellar manifest return 200; malformed scalar input
  returns 400. The owned verification server was stopped.
- The obsolete Flat shell registration, build descriptor and folder assignment
  are removed under the owner's confirmed retirement. The five source deletions
  are intentional and remain. Its ignored dist/flat output was verified to be
  untracked generated bundles and removed, so the host cannot keep serving the
  retired shell. No fresh application was created.
- Full npm run build passes. Root npm test now composes engine, server and the
  remaining app's browser verification as a terminating flow and passes:
  690 engine specs, 21 server cases and 72 browser cases, with one intentional
  full-cache browser skip. Formatting and whitespace checks pass. The generic
  karma command delegates to the remaining app's existing Karma configuration.
- Independent standards review was not performed for this refactor. Global
  reviewer calibration is now refreshed; the separate Flat shell owns its review
  status. No clean standards-compliance result or new numerical/appearance
  qualification is claimed. No commit, push or remote deployment was performed.

The feature candidate inventory and MVP requirements retain their own decisions.
This refactor does not select the finished app's UI or resume the suspended
Clean Horizon Profiles experiment.
