# Shared-time slider — advisory visual inspection

2026-11-05. Presentation author inspection against [slider-spec.md](slider-spec.md). **All four actual PNGs were inspected; no further visual corrections are requested for these advisory scenes.** This is not independent acceptance, app verification, an accessibility audit or a production-readiness result.

## Exact images

Opened each image with `view_image`. Hashes below were read from the files and match the current parent `render-report.json`. T1/T2 were displayed by the viewer at1996×1248 after resizing their2160×1350 captures. T3/T4 were displayed at their supplied1650×1200 and900×1350 pixel dimensions. CSS dimensions remain those in the table.

| Scene | Exact file                                                                                                                                      | CSS size | SHA-256                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| T1    | [01-summary-single.png](../../../../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/01-summary-single.png)                       | 1440×900 | `ecc09cf13e3d8fac84c63014e7a2b198a14b1cf04fb113ce26998a1c35f13e16` |
| T2    | [02-summary-comparison-config.png](../../../../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/02-summary-comparison-config.png) | 1440×900 | `6967d2966d4fc6f4382fb1d21c33b9d486bbf06159d00015b951711a52953bc9` |
| T3    | [03-summary-compact.png](../../../../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/03-summary-compact.png)                     | 1100×800 | `39a4c08eafb08af1e501e1670e1c9ce688c1ae1eac3f909c7a9115910aa723ab` |
| T4    | [04-summary-narrow.png](../../../../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/04-summary-narrow.png)                       | 600×900  | `b2ad8de0c2e101444d39a1c2b4aec25bd5ee47e15fc6f4405a6d0fa1af45dab6` |

## Findings

**T1 — visible control with configuration closed.** Shared time occupies its own row below page/camera controls. The long white track, blue thumb, central zero tick and Before/Closest/After labels make the slider recognizable. The +45° readout is next to the outlined Time settings entry. The page selector, Page settings, independent camera selectors and Center on Sun remain visible and separate. The global clock reads Jun20,2024 at4:08:48 PM; the slider is not hidden behind a popover.

**T2 — shared configuration beside both views.** Both toolbar sliders display the same +45° position and both Time settings entries are blue-filled. Page settings remains outlined in both view headers. The right panel visibly targets Shared settings and selects Flat Earth time, with Location and time still available beside it. The additional range, +45.0 Degrees field, zero-reference explanation, date basis and resolved date/time are all readable and contained. The line Time changes apply to all views makes the shared effect explicit; no View2-only Camera scope or new Apply is implied.

**T3 — compact comparison with bottom configuration.** Each pane retains its own page/camera controls and a fully contained Shared time row. The two scenes remain simultaneously visible, with the intended loss of height made apparent. In the bottom editor, section navigation is separate from the target selector. The configuration slider/legends and numeric field fit side by side without collision. Date basis, resolved time, device basis and the reference sentence fit in the right column. Neither Time settings entry reads as an independent clock.

**T4 —600px compact window.** The shared summary includes seconds without truncation. Page settings and the entire camera row remain visible above the shared slider. The bottom Configuration/Settings for/Close header fits, and the two shared-section buttons have distinct states. The configuration slider, its zero tick and three legends fit within the left column; the +45.0 field is visibly labelled Degrees below it. The resolved timestamp, device basis and reference explanation fit in the right column. No control clipping, cross-column overlap or hidden required field was found in this valid default state.

## Cross-scene checks

- The white/dark/blue role treatment remains consistent with the established family. Blue thumbs are visible against the white rails; zero ticks extend beyond each rail and remain distinguishable from the +45° thumb.
- All depicted angle readouts agree: +45° in toolbars and +45.0 in configuration. The resolved readout agrees with the persistent application summary: **Jun 20, 2024 · 4:08:48 PM**, with **America/Los_Angeles** identified as device time. This matches the parent-supplied sample; the designer did not recompute the astronomical conversion.
- There is no active ordinary Location/Date-time summary underline while the alternate shared pane is open. General Configuration and the shared Time settings entries show open state; page-specific settings stay separate.
- A narrowly scoped read of `comps.js` confirms actual `input type="range"` elements with shared-time names/value descriptions, plus the native numeric-edit field with `inputmode="decimal"`. The visible tracks are not only decorative drawings. This is a source check of static controls, not a behavioral test.
- The parent report has no capture errors or horizontal-containment findings. The actual images show the intended new scene appearance and one pointer hint per view. Physical correctness and aspect-ratio reprojection are outside this layout inspection.

## Limits

The88px shared-time row makes the requested control discoverable while reducing compact scene height; the rendered comps expose that tradeoff for owner review. No alternate density direction is requested from this inspection.

The−180° to+180° endpoints,0.1-degree working precision and before/after presentation remain illustrative policy choices. Matching values do not establish live synchronization, geometry conversion, numeric acceptance, wrap/date rollover, active-draft reconciliation, keyboard/focus behavior, asynchronous scene feedback or provider ownership at runtime. Native option popups, errors, loading, localization, zoom and other sizes were not exercised. The actual +45° scene asset was captured by the parent and reused/cropped for layout illustration. No application source was changed or executed by this author.
