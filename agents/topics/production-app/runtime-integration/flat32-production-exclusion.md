# Flat32 production exclusion

Status: implemented and locally verified on 2026-11-09.

The owner requires Flat32 to remain unavailable in production. Flat32 remains
local integration infrastructure; Flat is the production application.

## Configuration and local use

The root [polylith.json](../../../../polylith.json) advertises only Flat at
`/flat`. Both standalone app selection and parent discovery therefore exclude
Flat32. The repository retains its discoverable `multiple: true`/`apps` shape.
The parent still owns its deployment directory and mechanical server settings.

Standalone hosting uses `dist/flat` as its static root. An older local
`dist/flat32` build can remain on disk without being served by that root.
Flat's own router continues to serve its mounted page, assets and deep links.

[polylith.development.json](../../../../polylith.development.json) restores both
apps and the development `dist` static root only for explicit development use.
Parent discovery reads the base app catalog, so it does not acquire Flat32 from
this overlay. Flat32's build destination, worker generation and test bed are
preserved.

The repository-wide `npm run build` uses only the selected Polylith apps. Its
obsolete Flat32 worker post-build step is removed; Flat's spherical feature
already builds its own worker in the active output directory. Explicit
`build:flat32` retains the test bed's separate worker step.

Use these local commands:

```text
npm run build:flat32
npm run serve:flat32
npm run build:test:flat32
```

The existing `test:ui:flat32` commands use those build/test commands. They invoke
the installed Polylith CLI through the small
[development entry](../../../../scripts/flat32/development.js), which selects
the development environment and refuses `NODE_ENV=production`. Direct Flat32
CLI use requires `NODE_ENV=development`; the base catalog excludes it.

## Verification

- All 24 repository/Flat32 server tests and all 7 Flat server tests pass.
- New maintained regressions check standalone and actual Polylith discovery
  selection, production-launcher refusal, and HTTP exclusion with stale Flat32
  page/bundle files deliberately present. Flat's page, deep link and bundle
  remain available in that test.
- `typecheck:server` and a focused type check of the development entry pass.
- `NODE_ENV=production` with `npm run build:flat` succeeds.
- The repository-wide `npm run build` also succeeds in production mode after
  removing its Flat32-only worker post-build step; Flat's worker is generated
  by its own feature.
- `npm run build:test:flat32` still produces the local browser test bundle.
- The [served-app smoke report](../../../../.codex-tmp/flat32-production/20261109/report.json)
  uses the actual built Flat app and Polylith host in production mode. Flat's
  page, deep link, JavaScript and CSS return 200; Flat32's page, bundle and cache
  API return 404. Its owned listener was closed; no browser was launched.

This changes repository configuration, not an already running deployment.
Deploy/restart with the updated catalog to apply it to a remote host. A parent
must also retire any older Flat32 app registration or static output left by a
previous deployment; this repository does not control the parent's static root.
No parent repository, remote deployment or immutable evidence was modified.
Engineering reviewers remain cancelled; these are local build/HTTP checks.
