# Flat

Flat is the production application shell created through create-app on
2026-10-26. The [product decisions](../production-app/product-behavior/README.md#selected-production-app-behavior)
own the selected workspace behavior and scaffold options. Flat32 remains the
separate integration test bed.

The [workspace comps implementation](workspace-comps-execution.md) is complete
through the owner-authorized independent-execution run. The app now has shared
accepted-value summaries, generic settings targets/sections, per-view Camera
settings, and synchronized shared-time sliders plus precise numeric entry.
The workspace remains generic; Flat Earth owns the alternate editor and a
registered model-service, while the existing clock owns the shared timestamp.

The [time-input note](flat-earth-time-input.md) owns conversion/editing behavior.
The [execution record](workspace-comps-execution.md) links the four real captures,
matching geometry/token measurements, 118 passing browser tests, 29 focused engine
tests, client/engine types and live interaction evidence. The original
[research](configuration-toolbar-research.md) and
[designer comps](configuration-toolbar-comps.md) remain reference artifacts.
Device/local-time entry remains; time-zone lookup and animation UI are deferred.
Engineering standards review remains cancelled. Local checkpoints are recorded
in the execution record; nothing was pushed or deployed.

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
without a default scene. Registered scene definitions can be
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

The owner requires Flat's state-owning models to be implemented as registered
services. WorkspaceModel, CityCatalog, LocationEditorModel, DateTimeEditorModel,
FlatEarthModel and FlatEarthTimeModel extend Polylith Service and expose implemented methods.
Their owning feature entries activate them, local state initializes in start(),
and controllers resolve the capabilities in ready(). CityCatalog resolves HTTP
in its own ready() and exposes loading status through a method. FlatEarthModel
owns one camera record per view in the application's registry; session/runtime
code uses scoped model methods, and closing a view releases its record. Date/time
parsing/formatting utilities remain pure helpers. The
[component proposal](component-service-proposal.md) owns this architecture.

The owner-authorized Flat Earth base scene is implemented under
src/flat/features/flat-earth. The controller registers the page through app-pages,
consumes the public configuration capability, and owns a separate session per
workspace view. FlatEarthView relays scoped state and canvas lifecycle intent;
FlatEarthPage presents the canvas and localized waiting/preparing/failure/retry
feedback. Its stylesheet continues to ship through the feature build descriptor.
Select Flat Earth in either scene selector or open /flat/flat-earth directly;
the root route retains its empty initial selection.

Each FlatEarthSession uses the registered FlatEarthModel capability and owns one
cancellable FlatEarthRuntime. The model service derives the exact engine observation from shared latitude/longitude
and the animation clock's timestamp, with five-meter observer height and a
50-degree field of view as independent per-view defaults. A missing location
shows a configuration prompt instead of selecting a city implicitly.

The runtime uses production Algorithm32 directly: the compact native15 local-Sun
profile, N4 scattering, geometry-owned ground and source placement/lighting, and
the accepted altitude-half Color model. LocalSunFrameController constructs the
canonical GPU cache and lends it to complete live observation frames, allowing
location/time changes to reuse compatible construction. Receiver measurement,
color bindings, finite composed-output readback, and actual shader diagnostics
are prepared before a frame becomes visible. The previous coherent frame stays
visible during an update or failed candidate.

Each view owns its canvas, Three renderer/camera, backend, frame controller, and
resize observer. Location changes cancel stale work; time changes coalesce to
the latest pending instant without starving the current preparation. Unmount,
StrictMode lifecycle replay, and explicit retry release the exact canvas lifetime
before another one attaches. Release retires frame/cache leases before the
backend and renderer. Actual context or setup failures remain visible with Retry.
There is no Flat32 or archived-runtime import, no server cache load, no new
configuration controls, and no global animation loop owned by a scene view.
The [component proposal](component-service-proposal.md#flat-earth-feature)
owns the responsibility split and remaining feature work.

The Flat32-equivalent camera controls now belong to the Flat Earth feature.
Each session registers its own `view-tools` contribution: elevation presets
5/100/500/2000/10000/40000 meters, vertical FOV presets
120/90/50/35/20/5/2 degrees, and Center on Sun. Clicking the canvas enables
pointer-lock mouse look; Escape releases it. Sensitivity is 0.7 and polar limits
are 0.05 through pi minus 0.05, matching Flat32. The model retains each view's
accepted orientation, FOV, and elevation across observation updates and Retry.
Elevation changes stage a replacement physical frame while retaining the accepted
height and image until publication. Mouse look and FOV redraw the retained frame
through one coalesced on-demand animation-frame callback, without rebuilding the
cache or introducing a second simulation clock. Presets are presentation choices;
actual numeric/geometry constraints determine support. Closing a view releases its
listeners, redraw request, and only its own native pointer lock. The workspace
continues to consume generic contributions without importing this feature.

The owner accepted the [global configuration architecture](component-service-proposal.md#global-configuration-and-shared-values)
on 2026-11-05. The existing panel hosts a global configuration provider feature,
with accepted shared values owned by a main configuration service and missing
property defaults owned by consuming features. This supersedes the earlier
shared-observation feature proposal. The global location editor and canonical
location configuration are implemented. A first simple date/time pass is also
implemented with browser-local entry formats. Time-zone resolution/conversion,
other global properties, and scene consumers remain future work.
The accepted [configuration provider contract](component-service-proposal.md#configuration-provider-contract)
defines how feature services supply React content for the panel to mount.

The provider lives under src/flat/features/global-configuration. Its controller
registers one workspace-wide configuration contribution (viewId: null), delegates
presentation to its own view, and owns registration/listener/loading cleanup.
Open Configuration and select Workspace to use the date/time and location editors. The workspace
host remains generic while Flat Earth consumes these shared capabilities.

CityCatalog owns loading, JSON decoding, prepared matching fields, stable compound
city identities, and whole-index ranking. Search supports city-name terms,
country/admin codes, full administrative-area names, and accent/punctuation
folding; exact names precede prefixes and substrings even when region filters
are present. Every exact city-name match remains available; partial suggestions
fill an eighteen-result list when there are fewer exact matches. Region names
also appear in result labels, with codes as the fallback. The first panel mount loads the
copied static city index through the deployment-aware HTTP service. Loaded data
is retained across panel close/reopen. Its 154, 694 source rows occupy 10, 359, 090
bytes; exact copied bytes, original license, and provenance are under the
feature's assets/data folder. The same source package supplies a compact lookup
of 3, 892 region names, with derivation/hash information in cities-source.json.
The generated compact city and region JSON files are excluded from
Prettier to preserve its bytes. No external city API or new server endpoint is
used, and the source repository is not a runtime dependency.

LocationEditorModel owns query/coordinate drafts and input feedback. Typing a
query does not replace the accepted location. Picking a city commits its
coordinates immediately; manual coordinates require Use coordinates. Empty
fields remain incomplete, and nonfinite/out-of-range coordinates are rejected.
The React CityPicker owns only transient menu/focus/keyboard state, including
arrow navigation, Enter selection, and Escape dismissal. A catalog failure offers
retry while manual entry remains available. Component CSS and data ship through
the feature build descriptor.

The app-level configuration model-service is src/flat/services/configuration.js,
registered as configuration independently of the editor feature. Its public
contract exposes get(), setLocation(), setDateTime(), and changed notifications.
Each changed event supplies a defensive snapshot and the affected property names;
controllers reset only the corresponding editor drafts. The canonical
location uses latitude/longitude in degrees and optional city metadata. Missing
location remains absent, leaving defaults to consumers. Accepted values survive
panel and view-scope changes in memory, but are not persisted across app reload.
Observer height remains per-view, separate from geographic coordinates.

The app-wide DateField and TimeField components live under src/flat/components,
with their prop contract in components/types and shared CSS in components/styles.
They are controlled text inputs receiving labels, values, feedback, and callbacks;
they import no feature, registry, locale, or time-zone logic. The app build copies
and links their stylesheet, and both Karma lanes load the shared source styles.
The feature-owned DateTimeEditor composes these controls in global configuration.

Date/time entry follows the browser's default locale: numeric date order and
separators, localized digits, and a 12- or 24-hour clock with local day-period
labels. LocalDateTimeFormat under src/flat/models derives matching format hints,
formatting, and parsing from Intl.DateTimeFormat parts. The phrase locale does
not force date/time entry to US English. Gregorian years 1-9999 and minute
precision remain the entry contract; the existing fixed-format helpers
are canonical-text utilities rather than the entry format. UTC carriers inside
the formatter preserve calendar/clock parts without interpreting a location or
converting an observation instant.

DateTimeEditorModel owns incomplete drafts and feedback. Use date and time (or
Enter in the form) validates the pair and converts it to one timestamp using
the device's current local time zone. The app-wide animation-loop service owns
that `timestamp`: integer milliseconds since 1970-01-01T00:00:00Z. Configuration
owns location and delegates timestamp reads/writes to the clock. There are no separately stored accepted date/time parts. Its public
`setTimestamp` capability emits a changed snapshot with `['timestamp']`;
consumers receive the same absolute instant regardless of display format.
`LocalDateTime` helpers own device-local parts-to-timestamp conversion and
presentation extraction. The view and editor derive local text from this value,
including timestamp zero; location updates preserve it.

Blank or invalid inputs leave the timestamp unchanged. AnimationLoopService
startup reads the current device clock once and clears seconds/milliseconds to match minute entry
precision and begins fixed. Accepted edits survive panel close/reopen; enabling
live playback advances the shared timestamp and clean fields while preserving
unfinished drafts. Reload initializes from the device clock again. Native JavaScript Date resolution
currently applies at DST gaps and overlaps. Explicit ambiguity handling,
location/IANA-zone conversion, and persistence are deferred by the owner. Browser
format preferences are captured when the editor/view is created; reconciling a
live locale change with an unfinished draft is not implemented.

The global `animation-loop` capability lives under src/flat/services, not a
feature. It adapts the archived runtime's solar/sidereal periods, shared speed,
relative phase frames, and live/fixed playback to the current timestamp contract.
Configuration is a time facade; no second canonical timestamp is stored there.
The [clock architecture](component-service-proposal.md#shared-current-time-and-animation)
owns the public API, default periods, reference provenance, timer lifetime, and
phase meaning. Scheduling uses one monotonic-clock interval only during live
playback after readiness; application shutdown releases it. No animation UI or
shader consumer is added by this step.

Further [city-search improvements](implementation-notes.md#deferred-city-search-improvements),
including more fuzzy type-ahead matching and the related filter/sort proposals,
are saved for later at the owner's request. No further search implementation is
selected.

Time-zone lookup/conversion, richer segmented date/time editing, additional scene
content, and animation controls remain future work. The
[date-field adaptation note](date-field-adaptation.md) records the simple first
pass separately from the richer adaptation goals and open time-basis decisions. The
[product description](product-description.md) remains input for later refinement,
with the [component proposal](component-service-proposal.md) and
[implementation notes](implementation-notes.md) retaining architecture context.
The refine-design skill has not been run. The linked
[UX](main-frame-ux-research.md) and [UI](main-frame-ui-research.md) research remains
advisory beyond the explicitly selected requirements.

## Verification

The model-service correction is captured under
`.codex-tmp/flat-model-services/2026-11-05/`, with its baseline, source hashes,
isolated bundle, browser report, and image comparison. Client type checking,
Flat test/build compilation, formatting/whitespace checks, and all 109 browser
tests pass. Existing workspace, settings, and camera tests now use registered
model capabilities; the added check covers independent records in one Flat Earth
model service, defensive camera snapshots, exact close/reopen behavior, and
preservation of another view. Existing app-registry isolation checks remain.
Real Chrome/WebGL confirms all five model services are activated, along with
Sun centering, all FOV presets, 100-meter/40-kilometer elevation publication,
actual mouse look and Escape, independent comparison state, scoped cleanup,
shared-time updates retaining camera values, and narrow layout. No browser or
WebGL errors were recorded. Initial-scene and Sun-close-up captures are identical
to the preceding camera-control run. Server and engine source are unchanged;
their suites were not repeated. Independent standards review remains cancelled.

The camera-control adaptation is captured under
`.codex-tmp/flat-earth/2026-11-05/camera-controls/`, with source baseline,
self-review hashes, isolated bundle, browser report, and inspected screenshots.
Client type checking, Flat test/build compilation, formatting/whitespace checks,
and all 108 Chrome browser tests pass. Tests cover matching pointer sensitivity
and pitch limits, exact pointer-lock/Escape/listener cleanup, denied requests,
pending versus accepted elevation, retained camera state, domain quantities,
independent view contributions, repeated readiness, and exact token removal.
Real Chrome/WebGL verifies Sun centering at two-degree FOV, every FOV preset,
100-meter and 40-kilometer frame publication, actual mouse input, Escape release,
independent comparison cameras, closing another view without releasing the
primary lock, retained camera after a shared time change, and narrow layout
without horizontal overflow. No browser/WebGL errors were recorded. The first
Escape timeout and a timing-sensitive synthetic-mouse attempt remain preserved;
the completed run uses actual browser mouse input and the explicit Escape
handler. The existing development watcher picks up these feature changes.
The production engine and server were unchanged by this camera step and their
suites were not repeated; independent standards review remains cancelled.

The base-scene integration is captured under
`.codex-tmp/flat-earth/2026-11-05/base-scene/`, including its source baseline,
isolated production bundle, graphics runner, report, and inspected screenshots.
The isolated build avoids an already-running watcher with an older feature list
replacing the bundle during verification. Client/engine type checking and the
103-test browser suite pass. Real Chrome/WebGL renders the production scene,
verifies that date/time and location changes alter actual canvas pixels, opens
two independent views, closes the secondary view, and resizes the remaining view.
The runtime preflights actual shader execution and finite floating-point output.
A production renderer resize regression was reproduced before its fix; all eight
ShaderRuntimePass specs and the complete 691-spec engine Node suite pass after
correction. In the real browser, both views report the same exact rendered
observation and their sampled sky channels have zero difference after splitting
the viewport. No browser/WebGL errors were recorded. Desktop comparison captures
were inspected. The existing development watcher was restarted with its original
command to pick up the current feature list.
These are integration checks, not a new scientific qualification or performance
claim. Server code is unchanged; independent standards review remains cancelled.

The shared clock adaptation is captured under
`.codex-tmp/animation-loop/2026-11-05/`, including the pre-edit baseline and archive
entry hashes, unchanged reference copies, and browser evidence. Client type
checking, Flat build, formatting/whitespace checks, and all 99 browser tests pass.
Added checks exercise solar/sidereal timing, a sidereal-defined speed, exact day
cycles, fixed elapsed/angle poses, seeking and pause/resume, monotonic samples,
real timer ticks without an explicit sample, repeated readiness/restart/stop,
configuration delegation and listener cleanup, defensive frames, app-registry
isolation, and preservation of unfinished editor drafts during playback.
Served Chrome confirms the actual app still initializes, validates, accepts,
and reopens local date/time in US, UK, German, and Japanese formats with no
browser errors. The comparison archive SHA-256 remains unchanged. The unchanged
server was not retested; its four tests passed in the preceding simple-date/time
unit. Independent standards review remains cancelled.

The timestamp follow-up is captured under
`.codex-tmp/global-configuration/2026-11-05/timestamp/`. Client type checking,
Flat build, formatting/whitespace checks, and all 89 browser tests pass. Checks
cover canonical timestamp snapshots, exact change-property names, invalid
numeric values, epoch zero through the mounted editor, local conversion, early
years without 1900 coercion, atomic acceptance, and unrelated draft retention.
A focused runner confirms known UTC results for the same wall time in Los
Angeles, Tokyo, and Berlin, and verifies location/device-zone changes do not
mutate an accepted timestamp. Served Chrome rechecks US, UK, German, and Japanese
entry, validation, keyboard acceptance, and panel reopen with timestamp storage.
No browser errors were recorded. The unchanged server was not retested in this
unit; its four tests passed in the preceding simple-date/time unit. Independent
standards review remains cancelled.

The local-entry-format follow-up is captured under
`.codex-tmp/global-configuration/2026-11-05/local-entry-formats/`. Client type
checking, Flat build, formatting/whitespace checks, and all 87 browser tests pass.
Tests cover ambiguous month/day order, punctuation, midnight/noon, missing or
invalid day periods, localized digits, early years, and h11/h12/h23/h24 hour
cycles. Served Chrome checks verify US, UK, German, and Japanese entry, hints,
invalid-value retention, keyboard acceptance, and panel reopen. Desktop and
narrow US screenshots were inspected; narrow layout has no horizontal overflow.
No browser errors were recorded. The server is unchanged; its four tests passed
in the preceding simple-date/time unit and were not rerun for this client change.
Independent standards review remains cancelled.

The local-defaults follow-up is captured under
`.codex-tmp/global-configuration/2026-11-05/local-defaults/`. Client type checking,
Flat build, formatting/whitespace checks, and all 83 browser tests pass. A mocked
clock test verifies startup parts and retention of accepted edits. Served Chrome
checks emulate America/Los_Angeles and Asia/Tokyo at one explicit instant near a
UTC date boundary, confirming different correct local calendar/clock defaults,
retained edits after clock advancement and panel reopen, and reseeding on full
reload. No browser errors were recorded. This overrides the preceding simple
pass's blank initial date/time policy. The server is unchanged; its four tests
passed during that preceding unit and were not rerun for this startup-only change.

The app-wide date/time unit is captured under
`.codex-tmp/global-configuration/2026-11-05/simple-date-time/`, including its
working-tree baseline, served runner, browser report, and inspected screenshots.
Client type checking, Flat build, 82 browser tests, 4 server tests, formatting,
and whitespace checks pass. The added checks cover real Gregorian/leap dates,
early years without Date.UTC coercion, 24-hour bounds and midnight, partial
input, atomic acceptance and defensive snapshots, per-property change events,
independent location/date-time drafts, and panel remounts. The existing location
UI test now targets its own form explicitly alongside the new date/time form.

Served Chrome verifies fixed text formats, required/invalid feedback, leap-day
and midnight acceptance, keyboard submission, preservation of unrelated drafts,
accepted values after close/reopen, one global editor with two views, scope
switches, the copied/linked shared stylesheet, and reachable narrow-window
controls without horizontal overflow. No browser errors were recorded.
Independent standards review remains cancelled. Location/time-zone conversion,
persistence and shader integration were outside that earlier unit; local
formatting is now implemented by the follow-up above.

The San Jose search correction is captured under
`.codex-tmp/global-configuration/2026-11-05/san-jose-search/`. The city existed in
the index but was excluded by the eighteen-result cap, while full state names
and punctuation did not match. The correction preserves every exact city-name
match, indexes full region names, normalizes punctuation, and displays region
names in options and accepted-location feedback. Client type checking, build,
formatting/whitespace checks, and all 75 browser tests pass. A served Chrome run
verifies all 45 exact San Jose matches, selecting the California entry beyond
the previous cap, first-ranked California results for full-state/code queries,
correct coordinates, panel reopen, and narrow layout with no browser errors.
The four server tests passed during the preceding city-picker unit; the server
is unchanged and those tests were not rerun for this search-only correction.
The original city bytes and identities are unchanged. The new region-name asset
retains provenance from the same cities.json package version.

The initial city-picker unit is captured under
`.codex-tmp/global-configuration/2026-11-05/city-picker/`. Its baseline preserves
the prior uncommitted workspace, Flat Earth, title-only provider, and design state.
Client type checking, Flat build, formatting/whitespace checks, 74 browser tests
and 4 server tests pass. The nine added tests cover shared configuration updates
and defensive snapshots, coordinate drafts and bounds, stable city identities,
accent/code matching, late exact matches, loading reuse/retry/cancellation,
provider/listener cleanup, and editor remount behavior.

A served Chrome run uses the actual copied dataset and verifies on-demand loading,
mouse and keyboard selection, accent matching, no-result feedback, unchanged
accepted location during search, required/range errors, zero-coordinate acceptance,
close/reopen without another download, workspace/view scopes, comparison, narrow
layout, menu/panel Escape handling, and a simulated HTTP 503 followed by successful
retry with manual coordinates available throughout. No unexpected browser errors
were recorded; the injected 503 produces its expected resource console message.
The earlier incorrect country-filter ranking capture is retained under
ranking-before; the model regression and corrected served run pass. Runner,
report, and inspected desktop/narrow screenshots are in the unit folder.
Independent review remains cancelled; no full engine qualification or actual
parent deployment was performed for this UI/data integration.

The preceding global configuration title-only unit starts from the preserved working-tree
baseline under `.codex-tmp/global-configuration/2026-11-05/baseline.json`, including
the earlier uncommitted Flat Earth and design changes. Client type checking,
Flat build, all 65 existing browser tests, formatting, and whitespace checks pass.
A served Chrome run verifies the title-only content, workspace scope, exclusion
from both view scopes, repeated close/reopen without duplication, Escape focus
return, one contribution during comparison, copied/linked feature CSS, narrow
layout without horizontal overflow, and refresh/reopen, with no browser errors.
The same evidence folder retains the runner, report, and inspected screenshots.
The server is unchanged; its four tests passed during the preceding Flat Earth
unit and were not rerun for this browser-only addition. Independent review remains
cancelled. No city dataset, input controls, or configuration data service is
implemented by this unit.

The Flat Earth placeholder unit starts from checkpoint a0c9fc15 and covers the new
feature, Flat build registration, and two localization phrases. Client type
checking, Flat build, formatting, all 65 existing browser tests, and 4 server tests
pass. A served Chrome check verifies selection from the empty root, the localized
page at /flat/flat-earth, direct refresh, two distinct view instances, optional
view close/reopen, feature-owned CSS delivery, narrow-window overflow, and unknown
route handling, with no browser errors. Screenshots and its report are under
`.codex-tmp/flat-earth/2026-11-05/`. This is primary local verification;
independent review remains cancelled. Shader and cache behavior are outside this
placeholder unit.

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
