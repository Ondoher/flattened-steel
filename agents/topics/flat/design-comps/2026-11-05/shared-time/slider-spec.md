# Shared-time slider comps

2026-11-05. Bounded advisory update to the inspected page-settings family. Parent renders four static scenes; no app implementation or formal acceptance is claimed. Preserve the prior artifacts. The current owner request selects a visible toolbar slider and a configuration slider/numeric pair, superseding the earlier optional-toolbar wording in `flat-earth-time-input.md`.

## Shared content and state

- Keep San Jose, California, US; both cameras remain **5 m / Vertical FOV 50°**.
- One shared angle: **+45°** in every toolbar, **+45.0** in the configuration edit field.
- Date basis: **Jun 20, 2024**.
- Resolved shared timestamp supplied by parent: `2024-06-20T23:08:48.339Z`.
- Application summary and resolved readout: **Jun 20, 2024 · 4:08:48 PM**.
- Device basis: **Device time · America/Los_Angeles**.
- All toolbar sliders and the configuration pair represent the same shared timestamp, despite appearing on Flat Earth toolbars. Camera controls and Page settings remain view-specific.

Use the parent's newly captured real scene at that resolved instant: `../assets/san-jose-angle45.png`. Do not reuse the earlier noon image. Retain the prior image-crop limitation and one pointer hint per view.

Keep the existing exact palette, Arial, 14px/20px base type, white outlined controls, blue filled actions and 4px control radii. No gray palette, external icons, playback, reset, time-mode switch, global Apply, or additional astronomy setting.

## Native slider treatment

Use an actual `input type="range"`, not only a drawn track. Working display is min−180,max+180,value+45,step0.1. These endpoints/precision are illustrative comp parameters; the gallery must say wrap/day/precision policy remains unselected.

- Input hit box:24px tall; transparent dark-surface background, no input-outline box.
- Track:4px high, `#F2F2F2`, full width, rounded ends. Do not color only the elapsed side.
- Thumb:16px circle, `#ABD3FA`, no shadow. At+45 the thumb is62.5% along the usable track.
- Visible zero tick:2px wide,12px tall, centered on the track. It extends beyond the rail and sits behind the thumb.
- Legends below the range: **Before −180°** at left, **0° · Closest** centered, **After +180°** at right. Arial12px/16px, white. These express time before/after closest approach, not direction of camera movement.
- Retain2px blue focus outline with3px offset around the input hit box. None of the four overview captures needs fabricated focus.
- Accessible slider name includes **Shared time, degrees from closest**; value text can be **45 degrees after closest approach**. Associate the shared-effect/reference text with it.

The configuration numeric field is a native text input with `inputmode="decimal"`, displaying **+45.0**, with a visible **Degrees** label. This preserves the signed sample without relying on a browser's number-input formatting of a leading plus. It is36px tall, white border, dark fill,14px type. No separate Apply is depicted. Numeric acceptance and incomplete-draft policy remain unverified; a valid current value does not demonstrate those transitions.

## Toolbar time row

Retain every existing page selector, Page settings, Elevation, Vertical FOV, Center on Sun and optional Close View 2 control in its inspected position. Append an **88px time group below the existing camera header**. Do not try to fit the shared slider into the camera row.

The group starts at local y60 in the wide single-view header and y96 in all contained headers. Its inner left is20px for the wide header,16px otherwise. The wide single-view group has824px inner width; all other groups use the pane width minus32px. Let `L`, `W`, `Y` denote this inner left, inner width and group top.

| Element               | Placement within view header                               |
| --------------------- | ---------------------------------------------------------- |
| Shared time           | x=L,y=Y+10,width88,height20;13px bold                      |
| Degrees from closest  | x=L+100,y=Y+10,width150,height20;12px                      |
| Current angle +45°    | x=L+W−176,y=Y+10,width60,height20;14px bold, right aligned |
| Time settings         | x=L+W−104,y=Y+8,width104,height24;13px                     |
| Native range          | x=L,y=Y+38,width=W,height24                                |
| Endpoint/zero legends | y=Y+66,height16; aligned to the range                      |

No extra horizontal rule is needed between camera and time; the row break, Shared time heading and separate value suffice. The existing header-bottom border moves below the new row.

**Time settings** opens Shared settings → Flat Earth time. It is outlined in T1 and blue-filled in T2–T4. In a two-view scene, both Time settings entries show the open state because they access the same shared pane. Both **Page settings** buttons remain outlined: neither view-specific Camera target is open. Global Configuration remains blue-filled while the shared pane is visible. Neither Location nor ordinary Date/time summary has an active underline while Flat Earth time is selected.

## Shared-pane navigation

Retain **Configuration**, **Close**, and **Settings for** with **Shared settings** selected. Preserve populated View 1 — Flat Earth / View 2 — Flat Earth choices; omit absent View 2 in single-view states. Do not put this time editor under a view-specific Camera target.

Directly beneath the target header, add two ordinary section-selection buttons, with an accessible group name **Shared settings section**:

- **Location and time**,162px wide, outlined white.
- **Flat Earth time**,150px wide, blue-filled active.
- 8px gap; 34px tall at the right inspector, 32px tall in bottom inspectors.

Use these as two supplied shared contributions in the same surface. Do not add provider terminology inside the app. Switching section does not itself select a different time or time mode. The ordinary shared editors are not duplicated beside the Flat Earth time pane.

## Four scene bounds

| Scene              | Application header | View headers                   | Scene bounds                     | Configuration         |
| ------------------ | ------------------ | ------------------------------ | -------------------------------- | --------------------- |
| T1,1440×900,single | 0,0,1440,76        | 0,76,1440,148                  | 0,224,1440,676                   | Closed                |
| T2,1440×900,paired | 0,0,1440,76        | 0,76,540,184 and540,76,540,184 | 0,260,540,640 and540,260,540,640 | Right:1080,76,360,824 |
| T3,1100×800,paired | 0,0,1100,76        | 0,76,550,184 and550,76,550,184 | 0,260,550,240 and550,260,550,240 | Bottom:0,500,1100,300 |
| T4,600×900,single  | 0,0,600,116        | 0,116,600,184                  | 0,300,600,230                    | Bottom:0,530,600,370  |

Keep previous shared-header summary/action placements, with the new resolved time including seconds. T1's camera/header coordinates come from the prior wide A state; T2–T4 use the prior contained rows. Both compact scenes deliberately spend additional height on a visible shared control rather than clipping camera controls. Their reduced scene heights are an explicit density tradeoff for owner review.

## T2: right Flat Earth time pane

Keep the126px target header from the page-settings revision: title x1100,y96; Close x1366,y92,width58,height34; Settings for x1100,y134; target select x1100,y156,width320,height36. Header ends at y202.

Use x1100 and320px content width unless another value follows:

| Content                           | Exact top y and treatment                                                         |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Shared section buttons            | y214; Location/time x1100,width162; Flat Earth time x1270,width150;height34       |
| Degrees from closest              | y282,height20;16px bold, native slider label                                      |
| Time changes apply to all views.  | y310,height16;12px                                                                |
| Range                             | y348,height24,width320                                                            |
| Before / zero / After legends     | y380,height16                                                                     |
| Degrees label                     | y420,height18;13px                                                                |
| +45.0 numeric field               | y442,height36,width144                                                            |
| Reference explanation             | y512: **0° is the Sun's closest approach to San Jose.**;13px/20px, wrap if needed |
| Date basis label                  | y568,height18;13px                                                                |
| Jun 20, 2024                      | y592,height20;14px                                                                |
| Resolved time label               | y646,height18;13px                                                                |
| Jun 20, 2024 · 4:08:48 PM         | y670,height20;14px bold                                                           |
| Device time · America/Los_Angeles | y700,height16;12px                                                                |

Date basis and resolved time are readouts, not a second date/time form. Do not add editable date copies, an Apply footer or hidden required fields. The single panel body may scroll if later content grows.

## T3: bottom Flat Earth time pane

Keep the prior64px Configuration target header at y500–564: title x20,y516; Settings for x232,y525; target select x312,y516,width288,height36; Close x1014,y516,width66,height34.

Place the shared section buttons at x20 and190,y568,height32. Content begins y620 in two columns, x20,width514 and x574,width506.

**Control column:** Degrees from closest heading x20,y620; scope sentence x20,y646. Range x20,y674,width360,height24; legends y710. Degrees label x414,y650,width120,height18; numeric field x414,y674,width120,height36. The range and numeric field share a value, not separate tasks.

**Reference/readout column:** Date basis label x574,y620; value **Jun 20, 2024** at y642. Resolved time label y678; full resolved date/time value y700,14px bold; device-basis line y728. Reference explanation **0° is the Sun's closest approach to San Jose.** at y756,13px/18px.

All content remains within y800. Keep Close and the target/section controls outside the scrolling content body.

## T4: compact bottom Flat Earth time pane

Keep the prior64px target header at y530–594: Configuration x16,y548; Settings for x210,y538; target select x210,y560,width280,height32; Close x518,y546,width66,height34.

Shared section buttons: x16 and186,y602,height32. Content starts at y650 in two272px columns, x16 and312.

**Control column:** Degrees from closest heading y650; scope sentence y678. Range x16,y706,width272,height24; legends y738. Degrees label x16,y774; numeric field x16,y796,width128,height36.

**Reference/readout column:** Date basis label x312,y650; **Jun 20, 2024** value y672. Resolved time label y716; full resolved value **Jun 20, 2024 · 4:08:48 PM** y738,14px bold. **Device time** y768 and **America/Los_Angeles** y784,12px. Reference explanation y818,13px/18px, allowed two lines. All fields/readouts and Close fit the 900px frame.

Below these supplied widths, controls need deliberate reflow and body scrolling; these four fixed comps do not establish those additional states or phone support.

## Claim limits

The Sun/reference conversion is supplied by the parent using the public production geometry; no local-noon formula is substituted. The signed range,0.1-degree illustrative precision, numeric acceptance, wrap/date rollover, active draft reconciliation and scene-update feedback are not settled by these valid static samples. No shared-control duplication creates a new clock. The page-specific Camera route remains available and separate.

Render four exact PNGs and return them for Presentation inspection of slider visibility, zero/reference meaning, shared-state cues, compact containment and resolved readout. Keep all working-policy and illustration notes in the gallery, outside depicted UI.
