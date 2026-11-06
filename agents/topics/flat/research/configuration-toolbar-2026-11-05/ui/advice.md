# Flat configuration and view-toolbar presentation advice

Advisory consultation, 2026-11-05. Covers brief UI questions 1–6; no implementation, formal design acceptance, or usability validation. Current owner constraints and implementation facts take precedence over older design prose. Evidence identifiers and source-check status are in [evidence.md](evidence.md). All fresh findings await parent verification.

Keep the scene-first workspace and collapsible inspector. The largest immediate improvement is to make controls fit their own view, then expose shared location/time when configuration is closed. Flatten the inspector into understandable task sections. A new configuration page or category system is not justified by the present inventory.

## What the integrated app shows

The 1440px single-view capture is spacious: the dark frame separates cleanly from the bright sky, labels remain legible, and controls occupy one row [C06]. The 360px inspector also leaves a substantial single scene visible [C04]. These are useful foundations.

Comparison exposes the weakness of incidental wrapping. At 1440px without configuration, the two camera groups wrap differently because View 2 also has Close view [C07]. With configuration open, both headers grow to roughly 130px and View 2 splits “Vertical FOV” across lines [C08]. At 1100px, selects visibly cross pane boundaries and Close view overlaps the second FOV control [C09]. At 390px, controls extend beyond the scene/panel edge; the capture report records a 430px document width [C11]. These are concrete containment defects, not merely aesthetic preferences.

At 600px with two stacked views and configuration, each view is 261px high; its roughly 130px header consumes about half that space [C10]. The bottom inspector has its own scrolling content. Screenshots showing fields below its visible area do not establish that those fields are unreachable.

## Shared context and inspector hierarchy

The top bar currently gives almost all available emphasis to Add second view and Configuration while the accepted location/time disappears when the panel closes [C06]. Recommend a compact shared summary between Flat and workspace actions: a locality label, localized date/time, and a clear device-time basis. Illustrative wording is “San Jose, California · Jun 20, 2024, 12:00 PM · Device time,” with an explicit edit affordance. Use “Location and time” as an entry label if a heading is needed; “Observation” is not approved UI terminology.

This entry and its destination are behavioral proposals for UX/owner. Its visual purpose is clear: make the conditions behind both images readable without putting the full search and editing forms in the main toolbar. On smaller windows, give the summary a second row; allow the place name to wrap or shorten with a way to obtain its complete identity. Never truncate the time basis or numeric value into ambiguity. New summary placement should not duplicate every accepted-value sentence inside the editor.

The inspector currently stacks Configuration, Settings for Workspace, Global configuration, and Shared date and time before its first field [C02/C04]. Keep one panel heading and one explicit scope treatment, then task headings such as Location and Date and time. Remove the redundant visible provider title when its only role is to repeat the panel’s scope. Contributions can retain semantic section headings without each looking like an independent settings page.

Keep the scope near the panel heading and visible during scrolling. If multiple scopes remain selectable, use a compact labelled selector with the actual target; never infer it from whichever scene the pointer last touched. A workspace target must communicate that location/time affect both views. “Shared settings” is a candidate display label for that scope, subject to owner wording approval.

View 1 presently leads to a largely empty inspector [C05]. UX/owner should consider offering only scopes with actual settings contributions. If empty targets remain, use “No additional settings for View 1” rather than a generic empty message; camera controls already exist above that view. Do not invent categories, tabs, or future feature settings to fill the panel. Scope filtering and any return link are behavior changes, not selected by this report.

## Form grouping and field treatment

Prefer Location before Date and time because no location means no scene [C01/C02]. Preserve both as independent groups with their present acceptance semantics. This is a hierarchy recommendation, not evidence that all users edit location more often.

Within Location, retain a compact accepted-location identity separately from the search draft. Use a clear City search label, then suggestions. C03 already distinguishes city from region/country; retain that information. On narrow lists, put the city on the first line and region/country on the second rather than squeezing two columns. Do not truncate the disambiguating region. An active suggestion highlight means keyboard/pointer choice, not an already accepted location. Choosing it immediately accepts; changing search text does not.

Manual coordinates are a good candidate for an “Enter coordinates” disclosure, with both labelled fields and Use coordinates together. This reduces routine height while retaining a precise alternative and a fallback if city loading fails. Disclosure behavior, draft preservation, and whether to open it automatically for manual locations/errors require UX/owner agreement. The conservative alternative keeps it expanded beneath a clearly named Coordinates subheading. Preserve signed values, directional meaning, and units; do not replace current degree labels with unexplained latitude/longitude abbreviations.

For Date and time, keep the pair and one Use date and time action. Show “Device time” adjacent to the time meaning; location time-zone lookup remains deferred. Retain localized format cues outside the value, as current fields do. Date and Time labels remain visible when filled. Stack the fields when their values, hints, or errors no longer fit rather than shrink type. C12 demonstrates useful local error text and a retained accepted summary; it also shows how narrow error columns lengthen the form.

Group actions belong immediately after their fields. Use the same height, corner treatment, type scale, and pale-blue action treatment across providers. A compact content-width action on wide layouts and full-width action on narrow layouts is a reasonable visual default. Do not add a panel-wide Apply/Save button: it would imply a new transaction across independently accepted city, coordinates, and date/time changes. Draft guarantees across scope/provider remounts require verification before any “unsaved changes” promise.

## A coherent view-toolbar family

Use two deliberate groups: view identity/page selection, then camera values/actions. At ample width they can share one line. When constrained, move the complete camera group below the identity row. Put Close view at the end of the identity row, with a reserved place that cannot overlap camera controls. Align peer headers when side by side; equal height must follow content needs, not clipped text.

Concrete examples:

| Meaning                | Proposed presentation                      | Reason                                                                                              |
| ---------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| View/page              | View 1 followed by Flat Earth selector     | Keeps identity and content together; retains page choice.                                           |
| Physical camera height | Elevation, then `5 m` / `100 m` / `40 km`  | Exact value and unit remain visible. “Current (5 m)” reads as state, although it is a preset label. |
| Framing                | Vertical FOV, then `50°`                   | Keeps the convention and value; removes Default/Natural prose from the closed control.              |
| Camera command         | Center on Sun button                       | A verb distinguishes an action from a setting; retain its label.                                    |
| Optional-view removal  | Close view, separated from camera commands | Makes its subject clear and reduces accidental association with the adjacent selector.              |

Keep preset numbers primary in the option list; descriptive names may be secondary if useful. “Natural” should not imply calibrated human vision. Numeric-only options are a viable simpler choice. Do not hide FOV/elevation behind a generic camera icon or silently move both into configuration. No final icon asset is selected here.

Preserve `#121212`, `#F2F2F2`, and the supplied pale blue; `#ABD3FA` is only the current provisional token. Use spacing and alignment before adding more boxes. Inputs/selects can remain dark with clear borders; pale-blue fills should emphasize actions and explicit selection, with dark text. Focus needs a distinct visible outline, not merely the same fill as an open panel. Disabled Center on Sun should remain identifiable; a missing-location message supplies the reason. These are state treatments, not new state ownership.

Source shows the elevation selector can display a requested pending value while the retained image still depicts the accepted height. Distinguish that visibly, for example “Updating to 40 km” near that view while preserving the accepted-image meaning. This is a proposed state presentation requiring available feature data; a static screenshot cannot verify its transition. Likewise, keep update/failure feedback with the affected view and retain a concise “previous scene” indication when appropriate. Never suggest the two rendered scenes match solely because their shared requested values match.

## Responsive direction, priorities, and alternative

Contain every control within its actual pane width, including panel-open widths; the window width alone is insufficient. Wrap the whole labelled field, then stack fields if necessary. Preserve readable text and units. A roughly 32–36px compact control height is a working visual suggestion, not a measured optimum. WCAG’s target-size criterion sets a 24×24 CSS-pixel baseline with exceptions, not an ideal density; labels and spacing still matter [W1].

Reduce duplicated headings before shrinking the bottom inspector. At 600px the current two scenes remain visible but shallow [C10]. A taller nonmodal editor with a smaller retained scene area is a viable UX/owner alternative when editing dominates. A view switch or full-page editor changes interaction more substantially and should not be silently introduced. Form reflow and zoom remain necessary considerations even where the rendered scene needs two-dimensional space [W2].

Prioritize (1) containment and removal of overlap; (2) shared-context visibility and explicit scope; (3) flatter form hierarchy and concise exact camera values; (4) expanded-state, pending-state, localization, and narrow-layout refinement. These are advisory priorities, not an implementation plan.

A lower-change alternative retains the current inspector, all visible fields, and scope selector, while removing the redundant provider heading, introducing deliberate toolbar rows, and showing a compact shared summary. It preserves discoverability at the cost of more scrolling. Conditional coordinate disclosure offers more space but needs additional behavior decisions.

The old QGIS/Stellarium research supports bounded grouping and compact time editing, not a complete Flat shell [R1/R2]. Fresh W3C guidance supports retaining useful visible labels and format instructions without excessive explanation [W3]. No new comparable product was necessary. Test whether people can identify the shared conditions, change only one camera, distinguish requested from displayed values, select the correct same-name city, and recover from invalid input at compact widths. Device targets, long translations, zoom, keyboard-only navigation, pointer lock, and update/failure transitions remain evaluation gaps. The captured loading-text artifact in C02 needs a focused encoding check; it does not establish a general localization failure.
