# Flat Configuration And Page-Toolbar Research

Date: 2026-11-05. Status: standalone advisory research for owner discussion.
This is not an accepted design, implementation plan, usability validation, or
standards review. The refine-design pipeline was not run. Application code was
not changed by this consultation.

## Direction In The Full App

Keep the scene-first workspace and one collapsible nonmodal configuration
inspector. Make shared location/date/time readable while that inspector is
closed. Keep each view's independent camera values and commands attached to its
scene. Treat feature contributions as parts of a coherent interface; a provider
service does not automatically need its own visible settings page.

| Surface                    | Scope                                    | Recommended content                                                                                                                                 |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared application toolbar | Both views                               | Accepted location summary and accepted date/time with device-time basis; direct editor access; optional-view and configuration actions.             |
| Each view header           | One named view                           | View/page identity and selection; exact elevation and vertical FOV; Center on Sun; an independently identifiable close action on the optional view. |
| Configuration inspector    | Explicit shared or populated view target | Detailed location/date-time editing and actual less frequent feature settings. No invented categories or empty future pages.                        |

The preferred toolbar uses compact summary entries that open the inspector at
Location or Date and time. It does not put every editing field permanently above
the scene. This is a task-based recommendation: the intended audience and actual
edit frequency have not been established. An inline editing strip remains a
reasonable alternative if later observation shows frequent time/location changes
justify its permanent space.

The current one-location requirement, shared timestamp, optional comparison,
independent cameras, feature-owned controls, and generic contribution hosts all
remain governing context. No MUI, new time-zone lookup, fuzzy search, animation
UI, camera linking, or additional scene type is selected by this research.

## What The Current App Shows

The coordinator captured twelve states from the existing isolated Flat build;
both specialists inspected relevant integrated images. These are present-state
observations, separate from recommendations:

- At 1440 by 900, a single view and the 360px inspector leave substantial scene
  space. The current palette and plainly labelled controls are useful foundations.
- Closing configuration removes all visible location/date/time context from the
  app frame. Users cannot read the conditions behind the two images there.
- Configuration stacks Configuration, Settings for Workspace, Global configuration,
  and Shared date and time before the first field. Location follows date/time,
  even when missing location prevents any scene from rendering.
- View configuration targets currently lead to no additional settings. Their
  camera controls still exist in the view header.
- With two views and configuration open at 1100 by 800, each view is 406px wide.
  Camera controls cross pane boundaries; Close view overlaps View 2's FOV control.
  Document width still equals window width, so absence of outer scrolling does
  not establish local containment. See the [compact comparison capture](../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/09-compact-comparison-config.png).
- At 390 by 844, the document is 430px wide and view controls extend outside the
  scene. This is an observed layout defect, without establishing a phone-support
  requirement.
- At 600 by 900, each stacked view is 261px high and its header occupies roughly
  half that height by visual inspection. The bottom inspector scrolls internally;
  fields outside its visible region are not necessarily unreachable.

The first priority is usable containment and explicit scope. Smaller text or
clipped controls would not resolve these problems.

## Configuration Advice

Use one panel heading, an explicit editing scope when meaningful, then task
sections. Proposed visible wording is **Location and time** or **Shared settings**;
"Observation" is not an owner-approved UI label. Start with Location, then Date
and time. Missing location should offer a direct Choose location action that
opens the shared editor.

While only shared settings exist, replace the scope chooser with a clear shared
scope statement. When actual view-specific settings arrive, offer only populated
targets and identify the view/page. General configuration may remember its last
still-valid scope; location/time shortcuts must explicitly open the shared scope.
Clicking a scene should not silently retarget an unfinished edit. These navigation
changes are proposals, not current guarantees.

Within Location, keep the accepted place distinct from the query draft. Preserve
city, region and country in results; a narrower result can use two lines rather
than squeeze or omit the disambiguating region. Keep manual coordinates as a peer
entry method. A visible Enter coordinates disclosure could reduce routine form
height, with expansion for manual locations, coordinate errors, or city-data
failure. The conservative alternative keeps the fields expanded under a clear
Coordinates subheading. Default disclosure behavior needs owner selection.

Keep date and time together, their locale-specific format cues visible, and a
plain statement that entry uses this device's time zone. Naming the actual zone
and applicable offset is optional when reliable; a new time-zone picker is not
required for this clarification. Changing location preserves the accepted instant.

Preserve the existing separate acceptance boundaries:

- Typing a city query does not apply a location; selecting a result does.
- Latitude and longitude apply together through Use coordinates.
- Date and time apply together through Use date and time.

A panel-wide Apply would introduce a different transaction and obscure the
already-applied city selection. Keep invalid drafts editable and accepted values
unchanged. A proposed future draft contract is that closing or changing scope
preserves unfinished form drafts without applying them. Its complete lifecycle,
conflicts with a later city selection, discard behavior, and invalidated-view
behavior require verification before being promised.

Return focus to the actual invoking control on close. An open city popup should
consume its first Escape before panel closure; mouse-look release must remain
separate from an unintended panel-close action. These are bounded interaction
recommendations, not a completed keyboard audit.

## Page-Toolbar Advice

Organize each view header into recognizable groups: identity/page choice, camera
values, and camera commands. On ample width they can share a line. Under
constraint, put identity/page selection and optional-view close in one contained
row, with camera controls in deliberate rows below. Keep peer headers aligned
without clipping content. Close must have its own space and a specific target.

Use exact closed-selector values such as **5 m**, **40 km**, and **50 degrees**.
Keep the vertical FOV convention visibly named. Preset descriptions can remain
secondary in the open list, but "Natural" or "Current (5 m)" should not dominate
the value people compare. Preserve the current preset inventory; free numeric
entry, sliders, and linked cameras are separate choices. Height reference wording
must follow the physical contract rather than imply sea-level altitude.

Keep Center on Sun as a directly usable command with a verb label. Do not hide
both camera values behind a generic icon or relocate all frequent camera control
into configuration. No new icon asset or empty overflow menu is needed. The
optional-view close action belongs with that view's identity, visually separate
from camera adjustments.

Use the selected #121212 background, #F2F2F2 text/borders, and supplied pale blue.
The current #ABD3FA accent remains provisional. Reduce redundant boxes and
headings through spacing and alignment before changing the owner's border
palette. Keep consistent control sizing and visible focus; compactness must
retain readable labels, units, and usable interaction targets. Exact dimensions
are working design choices, not a measured optimum.

Adapt to each view's available width, including width consumed by the open
inspector. Whole-window breakpoints alone do not capture that constraint. If
contained headers still leave unusably small scenes, an earlier bottom-inspector
arrangement or different view arrangement needs owner evaluation. Switching between retained views would change simultaneous comparison and is not selected here.

## Requested Values And Displayed Results

A shared location/time update can finish in each view at a different time. Current
source also lets the elevation selector show a pending height while the old
physical frame remains displayed. A ready-looking pair must not imply that both
images show the latest requested state.

Recommend concise per-view feedback such as **Updating to 10 km; showing 5 m**
and **Update failed; previous scene shown**, with scoped Retry. Make the displayed
location/time available when it differs from the requested shared context. Keep
feedback out of the central scene where practical and avoid focus theft or noisy
per-tick announcements. These are proposed state presentations; this research did
not capture every asynchronous transition or choose synchronized publication.

Preserve visible click-to-look/Escape guidance before capture and a release cue
while locked. Touch and fully keyboard-operated arbitrary camera movement remain
input-device questions, not capabilities established by Center on Sun.

## Alternatives And Decisions

The lowest-change alternative retains the current fields and scope selector,
flattens repeated headings, adds shared context summaries, and fixes contained
header rows. It changes less behavior but preserves more scrolling and empty
navigation. The preferred direction additionally filters empty scopes and considers
manual-coordinate disclosure.

The more substantial alternative places location/date/time editing inline in a
shared strip. It could suit repeated time exploration but consumes scene height
and requires careful mixed-commit behavior. No evidence here establishes its
superiority.

Owner decisions remain: summary entries versus inline editing; manual-coordinate
visibility; exact draft/discard policy; configuration target navigation; initialization and reopening of the second view; and supported window/input conditions. A closed
second view currently releases its camera record and reopening starts fresh.
Copying the first camera or remembering the second would change that behavior.

Useful evaluation tasks are identifying the shared conditions, changing only one
view's FOV, choosing a same-name city in the correct region, distinguishing typed
from applied values, returning to an unfinished edit, recognizing mixed old/new
results, and exiting mouse look. Include long translated labels and zoom. These
are research questions and priorities, not an execution plan or release gate.

## Evidence, Source Checking And Limits

Specialist contributions are preserved as dated advisory reports:

- [UX advice](research/configuration-toolbar-2026-11-05/ux/advisory.md) and
  [UX evidence](research/configuration-toolbar-2026-11-05/ux/evidence.md), produced by
  product-researcher in product/interaction mode.
- [UI advice](research/configuration-toolbar-2026-11-05/ui/advice.md) and
  [UI evidence](research/configuration-toolbar-2026-11-05/ui/evidence.md), produced by
  ui-researcher in presentation mode.

The parent read both reports, inspected current initial/search/single/comparison/
narrow/validation captures, and checked the numerical layout report. Capture
runner, twelve PNGs, metadata, exact bundle/image hashes, and publication provenance
are under `.codex-tmp/flat-configuration-advice/2026-11-05/`. Capture errors were
empty. Reported dimensions describe these desktop Chrome captures; they do not
establish every browser, translated locale, zoom level, or input device.

The earlier [UX](main-frame-ux-research.md) and [UI](main-frame-ui-research.md)
research supplied bounded QGIS/Stellarium/SunCalc precedents. The UI researcher
reinspected the retained QGIS camera and Stellarium date/time images. Their
original provenance and unspecified depicted builds remain limitations. QGIS is
far broader than Flat; its settings categories and synchronization controls are
not requirements for this product.

The parent independently opened the following primary sources on 2026-11-05 and
confirmed these bounded claims:

| Source                                                                                                | Supported point; limits                                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [QGIS 3.44 3D Map View](https://docs.qgis.org/3.44/en/docs/user_manual/map_views/3d_map_view.html)    | Documents view-local tools and configuration. Supports a bounded ownership precedent, not Flat's whole shell.                            |
| [W3C Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) | Meaningful labels and relevant format guidance help input; extra explanation can also burden. Does not prescribe these labels or layout. |
| [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)                                 | Preserve information/functionality at narrow widths with specified two-dimensional exceptions. Does not choose a comparison fallback.    |
| [W3C Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)               | 24 by 24 CSS-pixel minimum with exceptions; not an optimal-density measurement.                                                          |
| [W3C Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)                            | Supports explicit suggestion acceptance and popup dismissal. Several interaction variants are permitted.                                 |
| [W3C Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)                              | Toolbar semantics imply focus/navigation behavior; visually grouped native controls need not adopt that role.                            |
| [W3C Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)               | Relevant status can be communicated without taking focus. Does not supply Flat's wording or publication policy.                          |
| [W3C On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)                             | A content update is not necessarily a context change. Does not require a global form transaction.                                        |

These source checks support the stated guidance, not the effectiveness of the
proposed Flat design. Specialist files retain their original pending-parent-check
language as collection history; this section records the limited checks actually
completed afterward. No user tests, formal design acceptance, standards-compliance
assessment, measured density/contrast comparison, or full draft lifecycle audit
was performed. An apparent loading-text encoding artifact was seen in one capture;
its cause is unverified. Current defects and advisory choices must remain separate
from any later implementation authorization.
