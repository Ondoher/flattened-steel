# Flat configuration and view-toolbar UX advice

Advisory consultation, 2026-11-05. Covers brief questions UX1–UX7. No design acceptance, implementation plan, user testing, or compliance finding is claimed. Existing owner constraints and implementation facts take precedence over older research. Detailed input identities, reuse status and research method are in [evidence.md](evidence.md).

Make the shared observation readable when the inspector is closed, keep camera values beside their respective scenes, and make the inspector a coherent editor rather than a collection of provider pages. The current one/two-view workspace and nonmodal inspector support this direction. The main problems are hidden observation context, empty configuration destinations, and ambiguity between a requested update and the image still displayed.

## 1. Three levels of control, one workspace

**Proposed hierarchy:** shared observation above the views; independent camera controls on each view; less frequent settings in the collapsible inspector. “Frequent” is a task-based hypothesis, not a finding about an established audience.

The shared bar should show the accepted location and accepted date/time with an explicit device-time basis. Two adjacent edit entries can read, illustratively, `San Jose, California, US` and `Nov 5, 2026 · 4:54 PM · Device time`. Coordinate-only locations need a meaningful coordinate summary. Longer values should wrap or expose their full accessible text; a truncated city must retain enough region information to distinguish it.

Activating either summary opens the same inspector at the relevant section. A “Location and time” heading should state “Shared by both views” in comparison mode. Keep a separate Configuration entry for general access; do not create an empty Settings category simply to populate a future hierarchy. In today’s inventory the inspector can contain one Location and time section. Providers remain content owners, but provider names need not become navigation destinations. This concrete wording respects the owner’s earlier concern about “Observation” as a feature name; no new name is accepted here.

This extends the saved 2026-10-28 recommendation for compact shared context plus a richer editor. Its bounded precedents remain applicable: Stellarium distinguishes observation editing from configuration; QGIS ties tools to individual views. Neither dictates Flat’s complete interface. [Saved UX research](C:/dev/flattened-steel/agents/topics/flat/main-frame-ux-research.md)

Full city, coordinate, date and time forms in the main bar would make every session pay their height cost, particularly with two view headers and translated labels. Summary entries preserve context and offer direct editing without that permanent expansion. They must show accepted values, never search text or unfinished drafts.

## 2. Scope and navigation

Currently “Settings for” offers Workspace, View 1 and View 2; only Workspace has content. Hide destinations without registered settings. While only shared content exists, replace the selector with a simple shared-scope statement. When view settings exist, offer only populated targets and name each destination, for example `View 2 — Flat Earth`.

A view’s future settings action should open its exact scope. General Configuration should restore the last still-valid target; observation entries always open shared observation explicitly. Clicking another scene must not silently retarget an open editor. If a targeted view closes, announce that its settings are no longer available and return to shared configuration; do not apply its draft to a replacement view.

**Proposed draft contract:** closing the inspector or changing scope preserves unfinished drafts for the current app session; neither action applies them. Reopening restores values and inline feedback, while a transient city result popup may remain closed. Offer a local “Discard changes” action only for a changed form. Accepted values already survive panel changes; draft survival across all remount paths is not established by this consultation and must be verified before promising it.

Keep the surface nonmodal. General opening can focus its heading or first meaningful control; a location/time shortcut should focus that editor. Closing should return focus to the invoking control, extending the current return-to-Configuration behavior. Escape first dismisses an open city popup; a subsequent Escape closes the inspector. The existing picker already stops that first Escape from closing the panel. W3C’s combobox pattern supports popup dismissal without accepting another choice. [Combobox guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## 3. Observation forms and acceptance

The fresh initial capture shows date/time above location even though missing location prevents rendering. Recommend this order:

1. **Location:** accepted location feedback; City search with region/country in results; “Enter coordinates” disclosure; Latitude then Longitude; local acceptance action.
2. **Date and time:** accepted pair; device-time explanation; Date then Time with locale-specific format hints; local acceptance action.

Keep manual entry a peer method, not an “advanced” setting. Default its fields to collapsed for a city-based observation, but show the entry affordance at all times. Expand it for a manual accepted location, a coordinate error, or unavailable city data. Preserve draft coordinates when merely collapsing it. This disclosure is a proposal; today the fields are always visible. It reduces scrolling without removing the offline/error fallback.

Preserve current acceptance semantics. Typing a city query does not move the observation; choosing a result applies that location to both views. Show concise help stating that result selection applies immediately. Latitude/longitude apply together through “Use coordinates”; date/time apply together through “Use date and time.” Enter submits only the relevant form or highlighted city result. A panel-wide Apply would falsely imply that a previously selected city was still pending.

Keep invalid drafts editable and leave accepted values unchanged. Associate errors with their fields; avoid focus jumps during typing. Search clearing should clear the search, not silently unset the observation. Selecting another city intentionally replaces location, so any manual-location draft conflict needs clear reset/retention behavior; it must never silently apply later as though it belonged to the new city.

State “Times use this device’s time zone” near time input. Where reliably available, expose the actual zone and applicable offset, without adding a zone picker. Changing location preserves the accepted instant. Do not imply destination-local time, automatic daylight-saving ambiguity resolution, persistence across reload, or animation controls. Those capabilities remain deferred. W3C guidance distinguishes predictable content updates from changes of context; immediate selection is not inherently a reason to require a new Apply button. [On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)

## 4. Simplify each view header by meaning

Use three groups: `View 1 · Flat Earth` for identity/scene choice; `Elevation 5 m · Vertical FOV 50°` for camera values; `Center on Sun` for a camera command. Keep the secondary-view close action at the outer edge, visibly separated from camera adjustment. Use `Close View 2` as its accessible name.

Show numbers and units in the closed selectors. Remove verbose FOV preset adjectives such as “Natural” from the persistent value; numeric degrees are sufficient to compare settings. Preserve “Vertical” somewhere continuously visible, rather than relegating the convention to a tooltip. The actual elevation reference needs domain-owner wording; do not invent “above sea level.” Keep the existing presets and independent behavior. Free numeric inputs, sliders, camera linking and additional commands are separate proposals, not necessary to simplify the header.

Keep Center on Sun directly addressable, with an explanation when it is unavailable before the first render. It is an action on that view, not a mode or shared observation edit. Allow whole control groups to wrap before hiding values in an overflow menu. Native labeled controls with ordinary Tab navigation remain viable; calling the region an ARIA toolbar entails additional keyboard behavior and potential arrow-key conflicts with selects. [Toolbar guidance](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

## 5. Scene state, comparison and constrained space

**Highest consequential ambiguity:** accepted observation, requested elevation and displayed image can differ temporarily. Current code retains a coherent old frame, while the elevation selector displays a pending height when present. Label this explicitly, for example `Updating to 10 km · Showing 5 m`. For shared edits, show per-view “Updating; previous observation shown” and make the rendered location/time available while it differs. If one view fails, say “Update failed; previous observation shown” beside Retry. A ready neighbor must not make the pair appear synchronized. Keep Retry scoped and preserve camera state.

Use concise text and accessible status announcements without stealing focus; avoid repeating every render tick. W3C’s status guidance supports announcing waiting, success and errors without moving focus. It does not prescribe Flat’s wording or a synchronization barrier. [Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

For missing location, replace the indirect instruction alone with an actionable “Choose location” entry to the shared editor. City-data failure should offer Retry and usable manual entry. A view with no selected scene is a distinct state and should direct users to its scene selector.

Keep the canvas instruction before pointer capture: clicking enables mouse look; Escape releases it. During capture show the release instruction; on denial explain that capture did not start. Do not let the same Escape release pointer lock and unexpectedly close configuration. Touch and fully keyboard-operated camera exploration remain coverage questions; a visible Center on Sun button is not an equivalent replacement for arbitrary look direction.

Retain “Add second view” as explicit entry and an unambiguous exit. The first view must survive either exit. Reopening currently starts a fresh second camera, so avoid language implying temporary hiding. Cloning the first camera could make comparison easier, but is an owner decision; do not silently change defaults or link cameras.

**Observed layout defect:** at 1100×800 with configuration open, each view is only 406 px wide. Camera selectors cross view boundaries and Close view overlaps View 2’s FOV selector. At 390×844, the single-view header extends to a 430 px document width. These are visible scope/operability problems, not merely aesthetic density judgments. [Compact comparison](../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/09-compact-comparison-config.png), [narrow single view](../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/11-narrow-single-config.png)

Adapt to actual view width: first wrap identity/scene selection and close into one row, then allow camera controls to occupy their own contained rows. If useful scenes still cannot fit beside the inspector, propose placing the inspector below the views sooner or stacking views; neither fallback is an accepted new policy. Avoid solving overflow by clipping controls or hiding current values.

At 600×900, stacked views each have 261 px height; roughly half is header before the persistent look hint takes further scene space. The existing bottom inspector is independently scrollable: offscreen fields are not proof of unreachable actions. Reduce redundant inspector headings and header text before choosing a more disruptive fallback. Keep Close visible, forms reachable, values retained, and test long translations/zoom. A one-view-at-a-time switch would weaken simultaneous comparison and needs separate owner selection; this advice does not establish phone support. [Stacked comparison](../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/10-narrow-comparison-config.png)

## 6. Priorities, alternative and remaining decisions

**First priority:** contain each view’s controls and separate overlapping actions; expose accepted location/time and its time basis; clarify stale images/pending elevation; provide direct missing-location recovery. **Next:** eliminate empty scope destinations, establish draft/return behavior, put location first, and simplify persistent camera labels. **Then:** validate density, manual disclosure, comparison initialization and narrow layouts with representative tasks. These are issue priorities, not delivery milestones.

A viable alternative is a dedicated shared observation strip with inline city and date/time editing and an expandable coordinate area, leaving Configuration for infrequent settings. It reduces repeated open/close steps for observation-heavy work, but consumes persistent height and complicates mixed commit behavior. Prefer it only if observed tasks show repeated time/location editing outweighs scene-space cost.

Owner choices still needed: summary versus inline editing; precise draft retention/discard behavior; manual-entry default visibility; second-view initialization/reopen policy; minimum supported window/input conditions. Test whether people can identify both views’ shared observation, change only View 2’s FOV, select the correct same-name city, distinguish typed from applied values, return to a partial edit, recognize a mixed old/new comparison, exit mouse look and recover from failure. Include keyboard, zoom and longer localized labels. No evidence here establishes task frequencies or usability success.
