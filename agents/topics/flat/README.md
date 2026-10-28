# Flat

Flat is the production application shell created through create-app on
2026-10-26. The [product decisions](../production-app/product-behavior/README.md#selected-production-app-behavior)
own the selected workspace behavior and scaffold options. Flat32 remains the
separate integration test bed.

## Current Scope

The app-directed React shell contains one initial Workspace page, localization
infrastructure and app-owned page routing. The initial page is a starter heading;
scene integration, toolbar controls and the collapsible setup panel are future
product work. No Flat32 feature candidates are implicitly included.

The selected [workspace composition](../production-app/product-behavior/README.md#workspace-composition)
uses a persistent application-owned workspace and feature contribution
interfaces. The generated page machinery has not yet been adapted to that
decision.

The [implementation notes](implementation-notes.md) capture the current design
discussion, including the owner's choice of the first shader integration.
They are input to a future plan; application implementation remains unselected.

The page fallback uses Polylith's resolved generated index location and effective
mount. It preserves unknown API responses and serves nested page refreshes with
the correct document base. Express remains on the host-compatible 4.22 line.

## Verification

Generated app validation, full npm run build and full npm test pass. The complete
flow includes 690 engine specs, 21 shared/Flat32 server cases, 72 Flat32 browser
cases, 31 Flat browser cases and 4 Flat server cases, with one intentional
full-cache Flat32 browser skip. Client and server type checks, formatting and
whitespace checks pass. Coverage is disabled.

Served-browser checks pass in standalone and controlled discovered contexts,
including output relocation to the parent's site-output/flat directory. Workspace
entry, refreshes, trailing slashes and deeper paths render the same heading;
unknown pages display not-found state, unknown APIs retain 404, styles load and
sibling routes remain available. The installation registry identity is preserved.
No actual parent deployment or remote publication was performed.

The existing normalization marker and overlay are preserved, folder mappings
validate and the generated standards guide is current. Independent standards
calibration was refreshed on 2026-10-26 and all five reviewer lanes pass readiness.
The owner cancelled the current standards-review process on 2026-10-26 because
the review skill is still in development. Partial evidence is preserved under
.codex-tmp/review-standards/session-Hblyxg. The review has no aggregate result;
partial findings are not accepted implementation obligations or compliance
evidence. No further review execution is queued.

## Integration Facts

- App slug: `flat`
- Browser source: `src/flat/`
- Server source: `server/flat/`
- Standalone mount: `/flat`
- Composed mount: `/flat`
- Configured mount: `/flat`
- Repository posture: `discoverable`
- Capabilities: app-directed shell, localization, app-owned server router, testing
- Standard test command: `npm run test:flat`
- Client type-check command: `npm run typecheck:flat`
