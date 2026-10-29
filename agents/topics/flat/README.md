# Flat

Flat is the production application shell created through create-app on
2026-10-26. The [product decisions](../production-app/product-behavior/README.md#selected-production-app-behavior)
own the selected workspace behavior and scaffold options. Flat32 remains the
separate integration test bed.

## Current Scope

The owner-authorized first workspace pass is implemented on 2026-10-29. The
persistent app frame contains a shared toolbar host, one initially empty view,
an optional second view, and a collapsible nonmodal configuration panel with
explicit workspace/view scope. Desktop comparison is side by side; the current
narrow-window arrangement stacks the views and places configuration below them.
The first view survives opening and closing comparison. A closed optional
view's identity is never reused, and stale close actions cannot affect its
replacement.

The generated Workspace starter page has been retired. Flat starts at /flat/
without an installed/default scene. Registered scene definitions can later be
selected independently in each view through the existing app-pages catalog.
Unknown page URLs retain not-found presentation, and unknown APIs retain 404.
The secondary view is in-memory workspace state rather than part of the URL.
When a primary page is selected, opening comparison mounts a fresh instance of
that definition; scene parameter initialization remains the feature's concern.
There is no persistence or resizable divider in this pass.

The workspace implementation is owned by src/flat/features/workspace, including
WorkspaceModel, WorkspaceController, WorkspaceView, WorkspaceShell, view hosts,
configuration, contribution services, styles, types, and their tests.
WorkspaceController owns composition workflow and mounted feature lifetimes;
WorkspaceView projects raw controller facts into presentation hosts; class React
components render those projections. The root React presentation consumes only
AppView, which projects canonical app context and activated content through
AppController. Registry lookup and controller calls are absent from React render.
The app feature retains only application activation, URL coordination, and a
own view-mediated root presentation. AppController activates the workspace through its
public controller capability after registry readiness; it imports no workspace
implementation. Native scene selection relays through application navigation
before the workspace mounts the requested definition.
The ui-contributions service supplies shared-toolbar, view-tool, configuration,
and status registration with exact removal tokens and explicit view scope.
The ui-contributions implementation and adjacent declaration are under the
workspace feature's services folder and are activated by that feature entry.
Page controllers supply mount/unmount operations for a view identity;
contribution controllers supply mountContribution/unmountContribution for an
exact registered lifetime. Feature presentation remains owned by its provider.
Workspace data and presentation contracts are in the feature's types.d.ts;
public service declarations remain beside their implementations. Common app
context and page-catalog metadata stay in src/flat/common/types.d.ts.

Base CSS variables in src/flat/styles/app.css define background #121212 and
text/borders #F2F2F2. The action token currently uses #ABD3FA as an explicitly
provisional visual approximation of the owner's blue swatch; its exact source
RGB is still unrecorded. Action fills use dark text for legibility. Component
layout is feature-owned CSS, and no MUI dependency is introduced.
Workspace styles are declared by features/workspace/build.json, copied to
features/workspace/styles/workspace.css beneath the app output, and linked by
the generated HTML after styles/app.css. Feature activation imports JavaScript
only. Karma loads application and feature source stylesheets explicitly before
the compiled browser tests.

Observation/location/date/time UI, height/FOV controls, shader/cache integration,
and animation are not implemented by this workspace pass. The
[product description](product-description.md) remains input for later refinement,
with the [component proposal](component-service-proposal.md) and
[implementation notes](implementation-notes.md) retaining architecture context.
The refine-design skill has not been run. The linked
[UX](main-frame-ux-research.md) and [UI](main-frame-ui-research.md) research remains
advisory beyond the explicitly selected requirements.

## Verification

The owner's [local authoring rules](../standards/overlay.md) have been applied
across all 71 JavaScript, JSX, and declaration files under src/flat and
server/flat, including tests. Descriptive JSDoc starts below its opening delimiter;
methods and named types are separated before their documentation; declaration
methods have full callable descriptions and parameter/result documentation.
Declaration signatures retain their types. Interface and event-contract method
documentation now follows the same public-method conventions as class methods.

Lists, optional JSX, labels, and derived attributes are prepared before consuming
markup. Render-helper calls remain ordinary JSX composition. ViewportFrame's
content and tools helpers own their region wrappers, and its scene-options helper
owns the page-option mapping and labels. Test presentation now also precomputes
its context-consumer callback and provider value. JSDoc imports have been removed
from the Flat server entry as well as the client; ambient declaration aliases
reference the existing service contracts without duplicating their definitions.
The owner has selected retaining the local polylith-core.d.ts type shims and
jsconfig mappings while investigating type exports from Polylith itself. Package
declarations will be evaluated before these local shims are removed.

The root Prettier configuration uses prettier-plugin-curly 0.4.1 to add required
control-flow braces and reject missing braces during formatting checks. The
focused authoring check covers 395 descriptive comments, 64 declaration method
contracts, and 103 JSX expression containers, plus method/type spacing and
control-flow braces. Region-wrapper ownership was checked manually. That
authoring-only pass's syntax comparison found the two expected test-presentation extractions and
two supporting server ambient aliases; other executable syntax and declaration
shapes matched its captured baseline.

The contribution catalog trusts UiContributionDefinition from typed application
callers. Registration no longer rechecks metadata types, slot-union membership,
or string shape. It retains duplicate-registration, compatible host/view scope,
and finite ordering invariants. Page registration likewise trusts its declared
record shape while retaining URL/default ownership constraints. Workspace page
and contribution mounting use their ambient capability contracts directly.
Localization trusts replacement types while retaining missing-token handling,
numeric finiteness checks, and validation of unknown phrase data. Redundant string
coercions of typed page identities, URLs, and source text were removed.

The HTTP service resolves app context during registry readiness and reads its
current locale for each request. A new browser test verifies that a locale change
appears on the next request. The context stub now publishes its get method through
Polylith; the previous optional call and fallback had masked that fixture defect.
Updated tests cover current contracts rather than malformed trusted type shapes.

Current baseline copies, helper scripts, source hashes, and focused verification
are under `.codex-tmp/flat-workspace/2026-10-29/authoring-rules/`. This is targeted
primary self-review of the accumulated rules, not an independent standards audit.
Earlier React-rule evidence remains under `local-react-rules/`, with served
captures and reports in `browser-system-chrome/`. Brace-formatting evidence is
retained under `brace-enforcement/`. Earlier Chrome capture/disconnection failures
are preserved; the current complete browser/server suite passes. The earlier
served captures are not pixel-identical across browser versions, and no new
pixel-equivalence claim is made for this documentation and test-helper pass.

Current targeted checks pass: Flat client and server type checking, the Flat application
build, 65 ChromeHeadless browser tests and 4 Flat server tests, formatting, and
whitespace checks. The browser tests cover contribution scope, exact cleanup,
independent instances, stale close actions, failed-mount rollback, state
preservation, URL ownership, localization, and configuration focus behavior.
The focused [React/ReMVC self-review](react-remvc-audit.md) records the standards
reread, corrected boundaries, readiness and lifecycle checks, and evidence limits.
Coverage remains disabled. The full unrelated engine/Flat32 suites were not
rerun for this workspace-only change.

The CSS asset correction passed client type checking, Flat build, all 65 browser
tests, all 4 server tests, formatting, and served-Chrome checks. The generated HTML
contains one workspace stylesheet link; its fetched CSS is byte-identical to the
feature-owned source, and workspace CSS is absent from the JavaScript bundle and
runtime-injected style elements. All four desktop/narrow captures are
pixel-identical to the earlier installed-Chrome captures. Current runner,
screenshots, browser report, and image comparison are retained under
`.codex-tmp/flat-workspace/2026-10-29/css-assets/`.

A real Polylith server and Chrome verified the served bundle at 1440 by 900 and
600 by 900: single/comparison views, scoped configuration, Escape focus return,
fresh optional identities, stacked narrow layouts without horizontal overflow,
root refresh, unknown-page state, API 404, and exact computed base colors. No
browser page or console errors were recorded in the final run. Final screenshots
were inspected. The server tests retain output-relocation and mount coverage;
this pass did not deploy to the actual parent or repeat a composed-browser run.

The workspace baseline, browser runner, and preserved initial captures are
under .codex-tmp/flat-workspace/2026-10-29. The final browser report and images
for the initial pass are in its final/ folder. The ownership correction's
baseline, browser runner, current reports, and images are under feature-correction/.
All four corrected captures are pixel-identical to the initial pass's captures. The earlier scaffold and cancelled-review evidence
remain preserved in their existing folders. The React/ReMVC audit's current
browser report, captures, and comparison are under react-remvc-audit/direct-final/;
those four captures are also pixel-identical to the pre-audit workspace.

The owner-cancelled standards-review process remains stopped. Its partial
reports under .codex-tmp/review-standards/session-Hblyxg are not accepted
compliance evidence. This pass used primary self-review and local verification;
no independent standards-compliance result is claimed.

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
