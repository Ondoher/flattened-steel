# Flat React And ReMVC Self-Review

Date: 2026-10-29. Scope: the new workspace feature, application integration,
root presentation/bootstrap, and the directly involved application-context
service. The canonical React and ReMVC standards were reread in full.

This records a primary-agent self-review and local evidence. The previously
cancelled independent standards-review process remains stopped; this is not its
aggregate compliance result or a review of the entire repository.

The owner subsequently added [local React requirements](../standards/overlay.md#add-react-computations-before-jsx).
The original review predates those additions. Their later application is recorded
in the focused follow-up below.

## Logic In React And JSX

React owns semantic presentation, DOM interaction, and genuinely transient
visual state. Conditional regions, mapping supplied items, labels, and local
focus or input drafts can belong in React. Rendering remains side-effect free.

Controllers own user-facing flow, commands, activation, mounting, invalidation,
and coordination. Models own canonical facts and their rules. View services
project controller facts into presentation and relay intent. The strict page
boundary is React page to its own view to its own controller.

Named render helpers separate substantial semantic regions. Named, stable
handlers translate DOM events into intent; inline JSX event callbacks are
prohibited. List-mapping/render callbacks are distinct from event callbacks.
These distinctions follow REACT-003 through REACT-009, REACT-STRUCT-001,
REACT-EVENT-001, REACT-022 through REACT-026, and REMVC-019 through REMVC-031.

## Local React Rule Follow-Up

The owner subsequently authorized applying both local rules to the new code.
Workspace, WorkspaceShell, WorkspaceToolbar, ViewportFrame, and
ConfigurationPanel now prepare lists, optional regions, translated labels, and
computed attributes before their consuming JSX. Named render helpers remain
direct JSX composition. ViewportFrame's content helper owns its viewport-content
wrapper; the other semantic helpers already owned their region wrappers. No
service contracts, CSS, or DOM hierarchy changed.

Primary self-review covered all eight Flat production JSX modules. A focused
syntax scan found no inline computations in their JSX expression containers;
wrapper ownership was checked manually. Type checking, Flat build, the existing
64 browser tests and 4 server tests pass. Served installed-Chrome checks passed
single/comparison views, configuration scope, Escape focus return, optional-view
identity, narrow layout, routes, refresh, and base colors, without page or console
errors. All four captures were inspected and layout measurements match the
preceding run. Images are not pixel-identical across the different browser
versions; no pixel-equivalence claim is made.

Evidence is retained in
`.codex-tmp/flat-workspace/2026-10-29/local-react-rules/`: baseline source hashes,
the limited syntax report, preserved runners, and current browser reports,
captures, and image comparison under `browser-system-chrome/`. The first runner
using Puppeteer's older bundled Chrome stalled at initial navigation and was
stopped; the installed-Chrome run passed. This remains primary self-review,
without restarting the cancelled independent review process.

## Accumulated Authoring Rules Applied Across Flat

The owner authorized applying all accumulated local rules across the new code.
The current pass covers all 71 JavaScript, JSX, and declaration files under
src/flat and server/flat, including tests. Description placement, method and type
spacing, public declaration-method documentation, JSX precomputation, ambient
JSDoc references, and control-flow braces were checked. Render-region wrapper
ownership was reviewed manually. The focused check covers 395 descriptive JSDoc
comments, 64 declaration methods, and 103 JSX expression containers, with no
remaining findings in those checks.

The pass also moves the test context-consumer callback and provider-value
construction before JSX, and replaces the remaining server-entry JSDoc imports
with ambient names. Two new server ambient aliases reference existing contracts.
Parsed syntax comparison confirms that all other executable syntax and
declaration shapes match the captured baseline. Public method signatures, CSS,
and production DOM structure are unchanged.

Client/server type checks, Flat build, all 64 browser tests, all 4 server tests,
targeted formatting, and whitespace checks pass. Evidence is under
`.codex-tmp/flat-workspace/2026-10-29/authoring-rules/`, including baseline source
copies, helper scripts, source hashes, and the focused verification report. This
does not refresh the earlier full React/ReMVC review or claim independent
compliance; the cancelled review process remains stopped. Served screenshots were
not recaptured for this documentation and test-helper pass.

## Trusted Internal Contract Follow-Up

The owner authorized removing redundant checks of trusted internal contracts.
Page and contribution metadata no longer receive repeated type/shape checks.
Workspace mounting calls the declared page/contribution controller capabilities
directly. Localization accepts its typed string/number replacement values while
retaining numeric finiteness and missing-token handling; phrase JSON and unknown
phrase-value validation remain at their actual boundary. Typed string identities,
request URLs, and replacement source text no longer receive defensive coercions.

IoService resolves app context during ready and reads the current locale on every
request. The new locale-change test exposed a context stub that omitted publishing
get through Polylith; the old optional call silently used the default locale.
The corrected fixture publishes the required method, and the test proves live
locale changes reach request headers. Existing tests that asserted malformed
trusted metadata or custom capability-probing errors were revised to test current
domain behavior. Client type checking, build, formatting, 65 browser tests, and
4 server tests pass. Earlier authoring-pass fingerprints describe their original
source unit and are not reused as validation of this behavioral change.

## Findings Corrected

| Finding                                                                                                  | Relevant rules                                                          | Correction and evidence                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The application React root looked up registry services and called the controller during rendering.       | REACT-007, REACT-008, REACT-026, REACT-033; REMVC-024 through REMVC-031 | The executor obtains AppView after readiness. AppView chooses root/shell presentation. The React root receives only its own view and projected state. Context changes pass through AppController and AppView. Regression tests prove rendering/context updates without registry access. |
| WorkspaceController grouped mount results into React-facing toolbar, view, and configuration structures. | REACT-004; REMVC-006, REMVC-022, REMVC-025                              | WorkspaceController exposes canonical snapshots and opaque mounted results. WorkspaceView performs host/scope projection without mutation or workflow policy. Controller tests consume the public view projection; view tests cover grouping and intent relay.                          |
| Larger render methods mixed several semantic regions in one JSX tree.                                    | REACT-STRUCT-001, REACT-014, REACT-018                                  | WorkspaceShell, ViewportFrame, ConfigurationPanel, and WorkspaceToolbar now use named helpers for their purposeful regions. DOM structure, callbacks, and styles are preserved.                                                                                                         |
| Listener cleanup used current props rather than the original subscribed view owner.                      | REACT-025, REACT-028 through REACT-033; REMVC-043                       | Both application and workspace roots retain the exact owner/token and explicitly detach/rebind when view identity changes. Tests cover replacement, unmount, and StrictMode replay.                                                                                                     |
| Contribution registration tokens restarted from one when local service state was reinitialized.          | REACT-030 through REACT-032; REMVC-043                                  | Tokens remain monotonic for the service instance, so stale cleanup cannot remove a replacement registration. A regression test covers startup reinitialization.                                                                                                                         |
| Repeated executor readiness could create another React root on the same DOM node.                        | REACT-031, REACT-032; REMVC-010, REMVC-043                              | Bootstrap reuses its existing root. Startup verification fires readiness again and proves that the workspace DOM instance is retained.                                                                                                                                                  |
| AppContextService resolved localization during start rather than ready.                                  | REMVC-034 through REMVC-042                                             | Start now initializes only local context. Ready resolves localization and publishes an actual capability change once. Tests verify no peer lookup in start and repeated-ready behavior.                                                                                                 |

## Other Boundaries Checked

- Workspace implementation, presentation, models, CSS, contracts, and tests stay
  under features/workspace. The app feature uses public capabilities without
  importing workspace internals. Contributors are mounted through their own
  controllers/views; the host does not branch on concrete feature identities.
- Canonical workspace composition stays in WorkspaceModel. Controller session
  handles, view projections, and React display snapshots do not become competing
  sources of truth. View and contribution keys use stable lifetime identities.
- Substantial React components are classes. The tiny stateless AppShell wrapper
  fits the function-component exception. Inputs are controlled, handlers are
  named, and DOM events are translated before crossing into view/controller APIs.
- Service collaborators are resolved in ready or the explicit executor/runtime
  boundary. Services call implemented methods; contribution metadata does not
  pass bound service methods across boundaries.
- CSS owns visual arrangement and states. Grid handles major regions; flex is
  limited to smaller control groups. Base colors remain shared custom properties
  in the application base stylesheet; feature styles remain with workspace.
- Native buttons, labels, selects, keyboard behavior, and focus return are
  retained. No MUI-specific behavior applies to this selected implementation.
- Browser behavior tests cover scope, independent instances, route handling,
  failed-mount rollback, listener release, stale identity protection, context
  propagation, and preservation of feature-owned DOM state.

## Verification And Limits

Client type checking, Flat build, 64 ChromeHeadless browser tests, 4 Flat server
tests, formatting, and whitespace checks pass. The served bundle was exercised
on a real Polylith server at desktop and narrow sizes, including comparison,
configuration scope, focus return, fresh view identity, root refresh, unknown
routes, API 404, and computed base colors. The completed run recorded no browser
page or console errors. All four captured states are pixel-identical to the
pre-audit workspace captures.

The first standalone runner intermittently timed out before its initial page
loaded. Preserved diagnostic runs distinguish that from a page error. The final
successful run probes local HTTP, uses direct Chrome access without a proxy,
and waits for explicit DOM/workspace readiness. These changes do not establish
the precise cause of the earlier timeout.

Baseline hashes, runners, and diagnostic evidence are retained under
`.codex-tmp/flat-workspace/2026-10-29/react-remvc-audit/`; current served-browser
reports, screenshots, and visual comparisons are in `direct-final/`. Earlier
workspace and feature-correction evidence remains unchanged. No actual parent
deployment, full unrelated engine/Flat32 test run, usability evaluation, or
independent compliance audit is claimed.
