# Page-specific configuration — advisory comp revision

2026-11-05. Revision of the inspected A–E family, plus a sixth F scene. Parent owns the static HTML/CSS and rendering. This specification changes no app source or accepted architecture. Preserve the previous comp set and inspection evidence.

## Clarification and intent

The original comps made the current shared editor clear but concealed the intended page-provider extension. The owner-accepted **Configuration Provider Contract** in `agents/topics/flat/component-service-proposal.md` states that features register mountable content with application-wide or view-specific scope; the generic host mounts the selected contribution. The adjoining **Global Configuration And Shared Values** section distinguishes shared current conditions, per-view current camera values, and defaults for future views.

Expose that extension in the interface with a **Page settings** entry in each view header and a **Settings for** target selector in the one configuration surface. In F, show the Flat Earth contribution for View 2. Its example fields are the existing **Elevation** and **Vertical FOV** controls, referring to exactly the same current View 2 values as its toolbar. They are not global defaults, a second camera state, or a new form transaction.

All six revised comps assume the illustrative Flat Earth provider is available for each depicted view. The gallery must say that this is an example of the accepted extension mechanism, not a claim that this provider is implemented or that these are the final page-settings inventory. In an actual inventory without a contribution, omit that view's Page settings entry and target rather than presenting an enabled empty destination.

Keep all established values, the real scene asset, exact palette, font, control treatment, hints and overall geometry unless a change below names them. Ordinary text and outlined-control borders remain `#F2F2F2`, backgrounds `#121212`; blue `#ABD3FA` indicates filled actions or the open entry. The prior outlined-button repair remains in force.

## One configuration surface and explicit targets

Use the panel title **Configuration** in B, C, D and F. Keep **Close** with accessible name **Close configuration**. Replace the old shared-scope sentence with a labelled native select:

- Label: **Settings for**.
- Shared option: **Shared settings**.
- View options: **View 1 — Flat Earth** and **View 2 — Flat Earth**, only for open views with contributions.
- B/C/E depict Shared settings selected and both view options available.
- D depicts Shared settings selected and only the View 1 option available.
- F depicts View 2 — Flat Earth selected.

The target is the stable view instance, not simply the page name: two instances of Flat Earth can have independent content. A page-settings shortcut opens this same surface at its exact view. Location/date-time summary shortcuts explicitly return to Shared settings. Target selection changes the mounted contribution; it does not change a camera, choose a page, alter shared values or create a second simultaneous editor.

Keep the current outlined workspace Configuration command blue-filled while any configuration target is visible. A Page settings button is blue-filled only when its exact view is the displayed target. Do not mark both views selected merely because they host the same page. The Location summary's blue lower rule appears only while the shared Location editor is the current entry; remove it in F. Both shared accepted summaries remain readable in F.

No draft-retention or target-switch discard guarantee is added. Those workflows remain an implementation/Interaction question; the static artifacts show matching valid current values.

## Page-header addition in every scene

Visible button label: **Page settings**. Accessible name: **Page settings for View N — Flat Earth**. Use the existing outlined style, 116px width. Do not replace the page selector, hide the existing camera controls, or combine this with Close View 2.

**A, single-row 60px view header:** add the button at local x244,y14,width116,height34. Shift the existing complete camera group 140px right. Its local x positions become Elevation label384, Elevation select448, Vertical FOV label542, FOV select632, Center on Sun720. Other dimensions/vertical positions remain unchanged. The scene still begins at y136.

**B–F, contained 96px header:** add Page settings at local x236,y12,width116,height32, directly after the Flat Earth selector ending at x216. Leave the camera row and optional close track unchanged. Close View 2 remains right16px,width108. At the smallest assigned paired width, 540px, the settings button ends at352 and the close begins at416, leaving64px separation. Both controls fit without wrapping. View 1 does not receive a placeholder Close button.

In F, only View 2's Page settings button is blue-filled. No extra colored pane outline or heading is needed: the selected shortcut and explicit target already identify the subject.

## A — single view, configuration closed

1440×900. Add the page-header button and shift the camera group as above. Everything else remains as inspected. Page settings is outlined because the surface is closed. Its intended destination is View 1 — Flat Earth; Configuration and the two shared summary shortcuts retain their existing access roles.

## B — paired views, right configuration, shared target

1440×900. Keep 540px panes and the 360px inspector at x1080,y76. The new inspector header is126px tall, ending at y202; its body keeps20px top padding. This adds48px to the original header/body boundary.

| Element                        | Exact placement              |
| ------------------------------ | ---------------------------- |
| Configuration title            | x1100,y96,18px/24px bold     |
| Close                          | x1366,y92,width58,height34   |
| Settings for label             | x1100,y134,width320,height18 |
| Target select, Shared settings | x1100,y156,width320,height36 |
| Body start / Location heading  | x1100,y222,width320          |

Shift **every existing B body element down48px**, retaining its original relative spacing. In particular, the expanded coordinate pair and Use coordinates remain; Date and time starts at y676, its device-basis line y702, field labels y736, inputs y758, and Use date and time y814–848. They still fit within the900px frame. Do not collapse coordinates to make room, shrink type, or introduce a second scrollbar around individual fields. Keep one scrolling body for overflow in unillustrated states.

The explicit selector replaces the old Shared by both views sentence. Its option is sufficient scope wording; no new provider-name heading appears above Location.

## C — compact comparison, bottom configuration, shared target

1100×800. Keep all region heights, 550px panes, scenes and body coordinates from the inspected comp. Configuration still occupies y500–800 and its header remains64px.

- Title **Configuration**: x20,y516.
- **Settings for** label: x232,y525,width72,height18.
- Target select **Shared settings**: x312,y516,width288,height36.
- Close stays x1014,y516,width66,height34.
- Remove the old Shared by both views sentence. The body still starts at y580.

The left task remains Location; the right task remains Date and time. Do not reflow the body just to accommodate target navigation. Both page headers receive the new button in the reserved identity row.

## D — 600px compact window, bottom configuration, shared target

600×900. Keep the116px application header,96px view header,318px scene and370px bottom inspector. Its header remains64px, y530–594.

- Title **Configuration**: x16,y548,maximum width176.
- **Settings for** label: x210,y538,width280,height18.
- Target select **Shared settings**: x210,y560,width280,height32.
- Close stays x518,y546,width66,height34.
- Remove the old Shared settings scope sentence. The selected option now provides that meaning.

The original two272px task columns and all default body positions remain unchanged from y610. This arrangement adds target access without sacrificing the existing visible fields, local action or scene. The visible options are Shared settings and View 1 — Flat Earth; there is no View 2 destination while only one view is open. This remains a compact desktop-window proposal, not a claim of general phone support.

## E — inline-editing alternative, shared target

1440×900. Keep the56px brand row,176px inline configuration strip,96px view headers and572px scenes. Add target navigation in the otherwise unused left part of the brand row:

- **Settings for** label x100,y20,width72,height18.
- Target select **Shared settings** x184,y11,width264,height34.
- Brand and right workspace actions stay in place.
- The inline Location and Date/time editors remain unchanged. Both view headers gain Page settings.

This is still one configuration surface, with its target chooser in the header. The selector is not a second editor or application page picker. A view shortcut would select its provider in this same inline surface. If that unrendered inline target is explored later, preserve accepted shared conditions as a concise read-only group on the left while placing the selected view's contribution on the right; do not remove global context or leave duplicate shared form editors mounted beside it. No additional inline view-target comp or draft lifecycle is claimed by this revision; F demonstrates the contribution in the preferred family.

## F — View 2 page contribution, 1440×900

Use B's exact frame:76px application header, two540px view panes,96px view headers,728px scenes, and right inspector x1080,y76,width360,height824. Both cameras and the actual reused scene remain5m / vertical50° at the same San Jose/device-time sample. Independent ownership is communicated by targeting, not by inventing a changed image or value.

Application header: both shared accepted summaries remain visible, with their Edit affordances. Neither has an active underline because the mounted target is View 2. Configuration is blue-filled. Both page headers retain their full camera rows. View 1 Page settings is outlined; View 2 Page settings is blue-filled. Close View 2 remains separate and outlined.

Right inspector header is the same126px target header as B:

| Element                     | Exact placement / content                                          |
| --------------------------- | ------------------------------------------------------------------ |
| Panel title                 | x1100,y96: **Configuration**                                       |
| Close                       | x1366,y92,width58,height34                                         |
| Target label                | x1100,y134: **Settings for**                                       |
| Target select               | x1100,y156,width320,height36: **View 2 — Flat Earth**              |
| Feature-owned section title | x1100,y222,width320,height20: **Camera**                           |
| Elevation label             | x1100,y260,width320,height18: **Elevation**                        |
| Elevation select            | x1100,y282,width320,height36: **5 m**                              |
| Vertical FOV label          | x1100,y342,width320,height18: **Vertical FOV**                     |
| Vertical FOV select         | x1100,y364,width320,height36: **50°**                              |
| Scope clarification         | x1100,y424,width320,height16,12px: **Changes affect View 2 only.** |

Use the existing exact preset inventories in these native selects. The panel selects and View 2 toolbar reflect the same view-owned values. Selecting a preset invokes the same view-scoped operation; it does not stage a new Apply transaction. Existing asynchronous scene update semantics remain unchanged. Do not label these fields Default elevation, Default FOV or Shared camera settings.

Keep the remainder of the inspector empty. Do not fill it with invented settings, disabled navigation, architecture commentary, an Apply button, Center on Sun duplication, or a placeholder explaining the provider system. The surrounding gallery can explain the illustrative contribution; the depicted product surface stays concise.

## Delivery and inspection

Render the revised six scenes under this new revision root and retain the previous family. The gallery should explain that the added target selector/shortcuts expose the already-accepted extension, while the particular Flat Earth Camera contribution is illustrative and not yet an implemented provider inventory. Existing static-control limitations apply.

Send all six exact PNGs to this Presentation context for inspection of the new header controls, target selector containment, right-panel body shift,600px header and F's scoped meaning. No formal pipeline, fresh research or independent acceptance receipt is commissioned. The current source clarification is sufficient for this advisory revision.
