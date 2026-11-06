# Flat configuration and camera controls — visual comp specification

2026-11-05. Standalone advisory presentation, for five static review comps. This is a concrete proposal, not accepted product behavior, a production implementation, an accessibility result, or refinement-pipeline admission. Parent owns static markup, rendering, persistence and the gallery. Designer owns this specification and inspection of the exact resulting images.

## Direction

Use one quiet, continuous dark workspace. Accepted shared conditions stay visible above the scenes; each view owns its page and camera controls. In the summary direction, a single nonmodal configuration surface holds the detailed editors. At compact widths it moves below the scenes. Keep the owner's high-contrast borders, but spend them on controls and structural dividers rather than nested cards.

A–D are the preferred summary family. E is a deliberately distinct alternative: the configuration surface becomes an inline shared editing strip. Label these proposals in the surrounding gallery, never inside the depicted app. Every app canvas contains plausible product UI only.

## Shared visual foundation

| Role                         | Exact treatment                                                   |
| ---------------------------- | ----------------------------------------------------------------- |
| Application and controls     | `#121212`, opaque, no gradients or secondary gray surface         |
| Text and borders             | `#F2F2F2`; 1px structural/control borders, no opacity tint        |
| Action / selected-open state | `#ABD3FA`; filled actions use `#121212` text                      |
| Font                         | Arial, Helvetica, sans-serif; no downloaded fonts/icons           |
| Base / control type          | 14px, 20px line height, normal weight                             |
| Brand                        | `Flat`, 20px/24px, bold                                           |
| Panel title                  | 18px/24px, bold                                                   |
| Section title                | 16px/20px, bold                                                   |
| Labels                       | 13px/18px; avoid uppercase and letterspacing                      |
| Helpers, format hints, scope | 12px/16px, same white; hierarchy comes from size and space        |
| Summary value                | 15px/20px, bold; its label is 12px/16px                           |
| Buttons / selects            | 34px tall; 10px horizontal padding; 4px radius                    |
| Form inputs                  | 36px tall; 10px horizontal padding; 4px radius                    |
| Focus                        | 2px solid blue outline, 3px offset; preserve space for it         |
| Spacing                      | 4, 8, 12, 16, 20, 24px; larger gaps only between real task groups |

Use dark outlined inputs/selects, pale-blue **Center on Sun**, **Use coordinates**, and **Use date and time** buttons. Workspace **Add second view** / **Single view** is outlined. **Configuration** is outlined when closed and blue-filled while its editor is visible. **Close** and **Close View 2** are outlined, visually separate from camera actions. No shadows, translucent layers, decorative card shells, invented icons, tabs, or generic overflow menus.

Native selects retain a visible down chevron. Supply numerical option labels and real option inventories; do not draw text masquerading as a selectable value without an affordance. Native text fields and buttons are appropriate in the static artifact. Do not imply functional live rendering. Simple CSS chevrons for disclosure are sufficient.

## Constant content and meaning

All scenes show the same already accepted conditions, with editable drafts initially matching them:

- Location summary: **San Jose, California, US**.
- City search draft: **San Jose**. Its query is separate from the accepted identity.
- Latitude: **37.33939**; label **Latitude (degrees north)**.
- Longitude: **-121.89496**; label **Longitude (degrees east)**.
- Accepted time summary: **Jun 20, 2024 · 12:00 PM**.
- Date input: **06/20/2024**, labelled **Date**, format cue **MM/DD/YYYY**.
- Time input: **12:00 PM**, labelled **Time**, format cue **hh:mm AM/PM**.
- Device basis: **Device time · America/Los_Angeles**. This is the supplied capture device, not the city's time zone inferred from location. No offset or time-zone picker.
- Both cameras: **Elevation** select **5 m**, **Vertical FOV** select **50°**, **Center on Sun**.
- Page select: **Flat Earth**. Label each owning pane **View 1** or **View 2**.
- Existing elevation inventory: 5 m, 100 m, 500 m, 2 km, 10 km, 40 km. Existing vertical FOV inventory: 120°, 90°, 50°, 35°, 20°, 5°, 2°. No free numeric entry.
- Existing source attribution remains an underlined 12px link: **City data: GeoNames, via cities.json**. Reuse the current link destination; do not invent a URL.

Location editor helper: **Selecting a city applies it immediately.** The coordinate pair retains **Use coordinates**. The date/time pair retains **Use date and time**. There is no panel-wide Apply. Neither the summary nor the accepted identity changes merely because a field is being edited.

Use the real scene image supplied at `.codex-tmp/flat-ui-comps/2026-11-05/assets/san-jose-noon.png` (repository-relative). Repeat it for both views because the sample camera values and direction are intentionally identical, not because cameras are linked. Use centered `object-fit: cover` without color filters, overlays that alter the scene, painted replacements, or invented astronomical objects. Parent should record in the gallery that the real scene is reused/cropped for layout illustration; these comps do not verify perspective at each new pane aspect ratio. Keep the horizon at the same normalized center in both adjacent panes.

Place a small opaque dark hint over each scene, 12px from its left/bottom edges, 6px vertical and 8px horizontal padding, 4px radius, 12px/16px type: **Click the scene to look around. Press Escape to release.** No outline is needed. The supplied asset should have its old hint removed through actual capture, so there is exactly one hint per view.

## Shared summary header, A–D

Desktop height is 76px with one bottom border. At 1440px, `Flat` starts at x20, centered vertically. The Location entry is x100, y12, width304, height52. Date and time is x428, y12, width320, height52. Each is a borderless button, left aligned, with 8px horizontal and 6px vertical internal padding:

1. Upper line: **Location** / **Date and time · Device time**; small blue **Edit** aligned to the right.
2. Lower line: the full accepted location / accepted date and time.

The entire entry is the edit target. Its accessible name includes the action and full accepted value. Its label is not another button. In B–D, a 2px blue lower rule on Location indicates the displayed entry destination; the Configuration button also appears open. Do not fill both summary entries blue.

At 1100px, keep the same 76px height, use x88,width280 for Location and x388,width300 for Date and time. Workspace actions align to the right with 16px outer padding and 12px gap: **Single view** width108, **Configuration** width116. At 1440px use the same action widths, x1188 and x1308. In A use **Add second view**, width144, at x1152. All action buttons are y21,height34.

At 600px the header is 116px: a 52px brand/actions row, then a 64px summary row. Brand x16,y14. **Add second view** x288,y9,width156,height34; **Configuration** x456,y9,width128,height34. Summary entries are x16 and x308, y56, width276,height52. Use 14px summary values here, retaining the full sample city/region/country and time. Do not truncate units or the device-time label.

## View-header construction

These are three purposeful groups: identity/page, camera values, camera command. All rows have minimum-width zero children and explicit tracks. The optional close command has its own track; never let it participate in camera wrapping.

**Wide single-view row (A), height60:** one bottom border; vertical center y106. At x20 show View 1, then the 140px page select at x80. Camera group starts x244. Elevation label56 + gap8 + select74; gap20; Vertical FOV label82 + gap8 + select68; gap20; Center on Sun width124. Both label/select pairs stay together. The row is comfortably within the width, without spreading controls across the whole screen.

**Contained two-row header (B–E), height96:** 16px side padding. Row 1 begins 12px below the header top and is 32px tall: View label44px, gap16, Flat Earth select140px. In View 2, reserve **Close View 2**, width108, at the far right with 16px outer margin. Row 2 begins 56px below header top, height32px. Use these exact widths from x16:

| Item                | Local x | Width |
| ------------------- | ------: | ----: |
| Elevation label     |      16 |    56 |
| Elevation select    |      80 |    74 |
| Vertical FOV label  |     170 |    82 |
| Vertical FOV select |     260 |    68 |
| Center on Sun       |     344 |   124 |

This 452px control span fits every assigned pane, including B's 540px panes. Keep **Vertical FOV** on one line. Labels center vertically against their selects. Use 32px controls only in this deliberate header variant; form controls remain36px. The bottom8px includes the divider. Both peer headers always have the same height, even though View 1 has no close command. There is no rendered placeholder close button.

At unassigned narrower panes these groups must rearrange as whole groups; clipping and font shrinkage are not fallbacks. The five fixed-size comps do not prove those additional breakpoints.

## Scene A — summary direction, single view, 1440 × 900

| Region                    | Bounds x,y,w,h |
| ------------------------- | -------------- |
| Shared header             | 0,0,1440,76    |
| View 1 header, single row | 0,76,1440,60   |
| Scene                     | 0,136,1440,764 |

Configuration is closed. Both summaries and their Edit affordances remain visible. The scene fills the remaining frame without card margins or rounded viewport corners. The pointer hint is the only overlay. This is the family overview: conditions remain readable without persistent form fields.

## Scene B — summary direction, paired views and right inspector, 1440 × 900

| Region           | Bounds x,y,w,h  |
| ---------------- | --------------- |
| Shared header    | 0,0,1440,76     |
| View 1 header    | 0,76,540,96     |
| View 2 header    | 540,76,540,96   |
| View 1 scene     | 0,172,540,728   |
| View 2 scene     | 540,172,540,728 |
| Shared inspector | 1080,76,360,824 |

Use one 1px vertical divider at x540 and one at x1080. Account for borders inside dimensions. Inspector background remains identical to the application. It has20px content padding, no enclosing card, and a scrollable body if content grows. Its title and Close stay visible.

Exact inspector content, x1100,width320 unless stated:

| Element                                  | Top y / height / treatment                                             |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Location and time                        | 96 /24 /18px bold                                                      |
| Close                                    | x1366,y92,width58,height34                                             |
| Shared by both views                     | 126 /16 /12px                                                          |
| Location                                 | 174 /20 /16px bold                                                     |
| Current: San Jose, California, US        | 204 /20 /14px                                                          |
| City search                              | 238 /18                                                                |
| Search input, San Jose                   | 260 /36; clear-query × at right with accessible name Clear city search |
| Selecting a city applies it immediately. | 304 /16 /12px                                                          |
| Enter coordinates, expanded              | 336 /34 /text disclosure with downward chevron                         |
| Latitude (degrees north)                 | 382 /18                                                                |
| 37.33939 input                           | 404 /36                                                                |
| Longitude (degrees east)                 | 452 /18                                                                |
| -121.89496 input                         | 474 /36                                                                |
| Use coordinates                          | 522 /34 /full width blue                                               |
| City attribution link                    | 568 /16                                                                |
| Task separator                           | y604 /1px full content width                                           |
| Date and time                            | 628 /20 /16px bold                                                     |
| Device time · America/Los_Angeles        | 654 /16 /12px                                                          |
| Date and Time labels + format hints      | 688 /18                                                                |
| Date and Time inputs                     | 710 /36; two154px columns with12px gap                                 |
| Use date and time                        | 766 /34 /full width blue                                               |

For the154px field columns, show each short label at left and its11px format hint at right in the same label row. If the browser's actual glyph metrics collide, place each hint below its input and move the action down20px; there is ample bottom room. Do not overlap or reduce the Date/Time labels.

The coordinates are expanded in B specifically to expose their exact field treatment. No city-result popup is open. Values are current and valid; no artificial error or pending state is shown.

## Scene C — summary direction, compact comparison, 1100 × 800

The selected compact proposal moves configuration beneath both views instead of squeezing each scene beside a narrow inspector. Simultaneous comparison remains visible.

| Region           | Bounds x,y,w,h                    |
| ---------------- | --------------------------------- |
| Shared header    | 0,0,1100,76                       |
| View headers     | 0,76,550,96 and 550,76,550,96     |
| Scenes           | 0,172,550,328 and 550,172,550,328 |
| Bottom inspector | 0,500,1100,300                    |

Bottom inspector has a top border. Its title/scope/close occupy a fixed64px header. Title **Location and time** x20,y516; scope **Shared by both views** x20,y544. Close x1014,y516,width66,height34.

Content begins at y580 in two task columns: Location x20,width514; Date and time x574,width506. A single vertical structural divider is unnecessary; 40px gap already separates the tasks.

Location column: heading y580; **Current: San Jose, California, US** y606; **City search** y636; input y660,height36,width514; city helper y704. Collapsed **Enter coordinates** disclosure x20,y736,height34,width154. Attribution link x194,y746. Coordinates remain available without filling this compact state.

Date/time column: heading y580; device-basis line y606. Field labels and format hints y636; inputs y660,height36, two247px columns with12px gap. **Use date and time** x574,y716,width190,height34. Do not stretch the action across both fields; it is clearly a local form action because it remains directly below them.

The body has independent vertical scrolling only when additional content/errors/disclosures require it. Keep the title and Close fixed. No overlay obscures either scene. A bottom placement threshold around1200px with an open editor and two views is a working proposal, not a validated global breakpoint.

## Scene D — summary direction, compact window, 600 × 900

Use one view and a nonmodal bottom editor. The two task columns still fit at this supplied600px width, with date and time stacked inside their own column. This is a compact desktop-window comp, not a claim of phone or touch support.

| Region                  | Bounds x,y,w,h |
| ----------------------- | -------------- |
| Shared header, two rows | 0,0,600,116    |
| View 1 header           | 0,116,600,96   |
| Scene                   | 0,212,600,318  |
| Bottom inspector        | 0,530,600,370  |

Inspector header is64px: title x16,y546; scope **Shared settings** x16,y574; Close x518,y546,width66,height34. Body starts y610. Location column x16,width272; Date and time column x312,width272. Use no vertical divider.

Location column: heading y610; **Current: San Jose, California, US** y638 (14px, fits one line); **City search** y670; input y694,height36. Helper at y738, allowed two16px lines. Collapsed **Enter coordinates** y782,height34. Attribution at y842; wrap naturally if needed.

Date/time column: heading y610; basis **Device time** at y638, **America/Los_Angeles** at y654. Date label and format hint y686; input y710,height36. Time label and format hint y762; input y786,height36. **Use date and time** y838,width272,height34. All default-state fields and both close/access affordances remain visible within900px. The shared accepted values are still visible at the top of the app.

Do not vertically stretch the form to fill blank space. Expanded coordinates, errors, longer localized labels or larger text should grow the scrollable body; the fixed header keeps Close reachable. Below the width at which either task column can contain its content, stack the two tasks and scroll the editor. Do not make that unrendered case look verified by this600px comp.

## Scene E — inline-editing alternative, 1440 × 900

The same editors occupy a shared horizontal strip. Show this as **Inline editing alternative** only in the gallery. The app itself still says Flat and uses existing task/control names.

| Region                      | Bounds x,y,w,h                    |
| --------------------------- | --------------------------------- |
| Brand/actions row           | 0,0,1440,56                       |
| Inline shared configuration | 0,56,1440,176                     |
| View headers                | 0,232,720,96 and 720,232,720,96   |
| Scenes                      | 0,328,720,572 and 720,328,720,572 |

Brand x20,y16. Workspace actions **Single view** x1188,y11,width108 and active **Configuration** x1308,y11,width116. The horizontal strip is the configuration surface in this alternative; no right or bottom inspector exists simultaneously, and there is no duplicate summary row above it. Configuration toggles this strip as the alternative to docking the same editor. Proposed closed state can return to A–D's accepted summaries; that unrendered transition and draft lifecycle remain an owner/Interaction decision.

Strip Location task x20,width610; Date/time task x680,width740. Keep their reading order left to right. Border only across the strip's bottom, plus a thin vertical divider at x654 from y72 to212 if visual inspection finds grouping insufficient; default is the gap without that divider.

Location task:

- **Location** at x20,y72,16px bold.
- **Current: San Jose, California, US** at x20,y100,14px. This is the accepted identity, separate from the draft below.
- **City search** x20,y128.
- Search field **San Jose** x20,y150,width360,height36; clear-query affordance at its right edge.
- Collapsed **Enter coordinates** x396,y150,width164,height36.
- City helper x20,y194,12px; attribution link x284,y194,12px.

Date/time task:

- **Date and time** at x680,y72,16px bold.
- **Current: Jun 20, 2024 · 12:00 PM** at x680,y100,14px. Without the summary header, this line preserves accepted-versus-draft meaning.
- Date label/hint x680,y128,width188; Time label/hint x884,y128,width172.
- Date input x680,y150,width188,height36; Time input x884,y150,width172,height36.
- **Use date and time** x1072,y150,width180,height36, aligned with the fields.
- **Device time · America/Los_Angeles** x680,y194,12px.

There is no global Apply, no coordinate submit while its disclosure is closed, and no duplicate full editor. Expanding coordinates would grow this same strip; do not invent a separate modal. E's572px scene height is156px less than a two-view closed-inspector summary layout at the same900px window height (728px). This explicit cost is the point of the alternative: fewer editor-opening steps versus more permanent form space. No research measured the best tradeoff for Flat's users.

## States and accessibility to preserve in implementation discussion

- Use native labelled controls, ordinary Tab order, section headings and form grouping. Visual grouping alone does not create an ARIA toolbar. Accessible names must disambiguate both views' camera controls and Close View 2.
- Current values, open Configuration and expanded coordinates are distinct states. Do not use one blue fill to imply that a search result is already accepted. If a result list is later depicted, retain city, region and country; active suggestion is selection focus, not a committed location.
- Focus treatment is the2px blue outside outline with3px separation. In these five overview captures, no control needs a fabricated focus state. Parent should render focus only if intentionally comparing that secondary state.
- In an invalid form, keep its draft, show a specific text error under the relevant field, and retain accepted summary/scene. Use text and the existing palette rather than adding an unapproved error-color family. Let content grow and scroll; do not clip errors.
- Updating and retained-image failure are not shown in these ready-state comps. A future state proposal can add **Updating to 10 km; showing 5 m** or **Update failed; previous scene shown** with scoped Retry near the affected view. This needs actual state ownership/data and does not imply simultaneous publication of both views.
- Pointer-lock release and configuration Escape handling must remain separate. Close returns to its invoking control; search popup gets the first dismissal. These are research recommendations awaiting behavioral selection/verification, not demonstrated by static markup.
- None of these comps promises draft persistence across close/reopen, synchronizes cameras, clones View 1 into View 2, changes date interpretation after city selection, or changes second-view initialization.

## Proposal decisions and limits

These presentation choices concretize the supplied research: compact accepted-value edit entries; restrained control hierarchy; literal numeric camera values; one explicit shared scope; Location before Date and time; deliberate pane-contained rows; no empty per-view settings destinations. The coordinates disclosure, direct summary-to-section entry, compact bottom docking and E's inline placement are proposed behavior/layout choices for the owner and Interaction authority, not newly accepted requirements.

No new research was necessary. Inputs were the assigned brief; `agents/topics/flat/configuration-toolbar-research.md`; the linked UI and UX advisory/evidence reports; `src/flat/styles/app.css`; and direct inspection of actual captures04,06,08,09,10. The main report records parent source checks; their limited claims remain attributed research. Existing screenshot inspection supports the observed overflow/hierarchy problem, not proof that these new comps are usable.

The chosen dimensions are renderable working choices. Real rendered inspection remains outstanding until the parent supplies the five exact PNGs. Font measurements, containment, ordering, contrast appearance, border density, control recognition and image crop should be inspected there. No independent verdict, browser behavior verification, translated-layout result, zoom result or production readiness is claimed.
