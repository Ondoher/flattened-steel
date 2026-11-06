# Source and method notes

Collected 2026-11-05 for standalone UX1–UX7 advice. This is staged specialist evidence; new local observations and web findings remain **pending parent verification**. No canonical documents, app files, historical evidence, Git state, builds or running applications were changed.

## Authority and actual input coverage

The controlling assignment is `../brief.md`, read in full. Parent subsequently supplied the owner’s prior concern that “observation is a strange name” for the former proposed feature; concrete “Location and time” is therefore proposed for UI wording, without interpreting this as a blanket terminology lock. Governance resolved from `C:/Users/gande/.codex/documentation` to physical target `C:/dev/polylith-skills/documentation`; read shared/Product-interaction sections of `skills/refine-design/references/design-research.md`, plus `design-delivery.md` and `design-authority.md`. No refinement pipeline or historical planning role was activated.

Read the complete Flat product description, selected product behavior and Flat README/current status; read both saved main-frame research documents. Source authority follows brief/current owner facts, selected behavior, current status, then description intent. In particular, older “camera gestures remain future” and unselected time-basis statements are superseded. The product description is a draft, not an accepted detailed UX specification.

Inspected contribution ownership passages in `agents/topics/flat/component-service-proposal.md`, including Configuration Provider Contract and Global Configuration And Shared Values. No architecture redesign was undertaken.

Inspected these current components in full: workspace `WorkspaceToolbar`, `ViewportFrame`, `ConfigurationPanel`; global configuration `GlobalConfigurationPanel`, `LocationEditor`, `DateTimeEditor`; Flat Earth `FlatEarthViewTools`, `FlatEarthPage`. Inspected CityPicker’s keyboard, blur, result and ARIA passages; workspace, global-configuration and Flat Earth styles. Exact paths are under `C:/dev/flattened-steel/src/flat/features/`. The global panel renders DateTimeEditor before LocationEditor. Configuration lists all views irrespective of empty contributions. FlatEarthViewTools uses `pendingHeightMeters ?? observerHeightMeters`; that is the direct basis for requested-versus-shown advice. No controller/model lifecycle audit was performed, so draft survival is explicitly unverified.

## Reuse and question coverage

| Question                                  | Treatment                              | Coverage and remaining dependency                                                                                                                                                             |
| ----------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX1 hierarchy                             | Reuse + local extension                | Saved shared/local/infrequent distinction applies. Current provider inventory supports one coherent observation section; task frequency/persona unknown.                                      |
| UX2 summary/editor versus full toolbar    | Reuse                                  | Saved UX already allows summary entries. New recommendation specifies direct section entry and accepted values; comparative usability untested.                                               |
| UX3 scopes/drafts/navigation              | Extension + owner/technical dependency | Empty scopes and current focus behavior inspected. Draft guarantees and invalid-target fallback are proposals requiring lifecycle verification.                                               |
| UX4 fields/commit                         | Local extension + bounded new inquiry  | Current city/coordinate/date-time commits inspected. W3C clarifies popup and context-change behavior. Ordering/disclosure remains advisory.                                                   |
| UX5 view tools                            | Reuse + local extension                | Explicit per-view ownership remains applicable. Numeric closed labels are a simplification proposal; no arbitrary-input expansion.                                                            |
| UX6 update/recovery/narrow                | Reuse + bounded new inquiry            | Retained-result concern was already saved. Current pending height adds specificity; W3C status guidance fills announcement gap. Interaction with pointer lock and all narrow states untested. |
| UX7 priorities/alternative/test questions | Synthesis                              | Recommendations derive from source-bound tasks, not a target-persona study or empirical ranking.                                                                                              |

No `research/index.md` was supplied; `rg --files agents/topics/flat -g '*research*'` found the two supplied Markdown research reports. No wider catalogue was invented. Their own recorded check status is preserved only for applicable unchanged claims.

## Reused product sources and fit

The saved UX report says these official sources were accessed and checked on **2026-10-28**. They were not reopened as a ritual and are not presented as freshly checked current product UI:

- [QGIS 3.44 3D Map View](https://docs.qgis.org/3.44/en/docs/user_manual/map_views/3d_map_view.html): reuse only explicit view ownership and local tools. Its expert GIS task breadth, synchronization options and settings inventory greatly exceed Flat’s; unsuitable as a whole-interface template.
- [Stellarium interface guide source](https://raw.githubusercontent.com/Stellarium/stellarium/master/guide/ch_interface.tex): reuse separation of location/date-time/viewing/configuration. Domain/task fit is close; independent paired scenes are not covered. Master branch is unpinned, so reuse concerns the documented saved finding, not a latest-release assertion.
- [SunCalc](https://www.suncalc.org/): saved evidence supports observation context prominence only; one-map solar-path task does not decide camera, inspector or comparison behavior. It is secondary supporting context and did not create new recommendations.

The saved UI report also records checked images, hashes and provenance under `.codex-tmp/flat-ui-research/2026-10-28/`. This consultation read its findings but did not reopen those external images and makes no fresh visual-precedent claim. Palette alternatives are superseded. Saved Blender retrieval failure remains a search limit, not negative evidence about Blender.

Reference fit: Flat currently has two coupled concepts (shared observation, independent view camera), one/two simultaneous scenes, a small preset inventory and an unknown expertise mix. Its host is a browser workspace with localization. This supports bounded reuse; it does not justify importing GIS navigation, astronomical tool inventories, time-zone pickers or animation UI.

## New primary-source inquiry

Method: direct opening of four official W3C pages through `web.run`; no broad market/search-engine query was needed after reuse. Access date 2026-11-05; retrieved live HTML prose, not rendered UI or fixed-release screenshots. WAI-ARIA APG and WCAG Understanding documents are guidance, not product-comparison evidence. Interpretation and Flat applicability are pending parent check.

| Exact URL                                                        | Source observation                                                                                                                     | Bounded application                                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| https://www.w3.org/WAI/ARIA/apg/patterns/combobox/               | Enter accepts a highlighted suggestion; Escape can dismiss the popup without another choice. Name/value semantics matter.              | Preserve current picker Escape layering and explicit selection. The source permits several behaviors; it does not mandate Flat’s immediate city commit. |
| https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/                | Toolbar focus management generally uses one Tab stop and directional navigation; controls can conflict with those arrow keys.          | Do not add toolbar semantics merely for visual grouping. Native labeled form controls remain a viable choice. No accessibility audit result claimed.    |
| https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html | Relevant waiting/result/error status can be exposed to assistive technology without receiving focus.                                   | Per-view stale/update/error messages should be perceivable without focus theft; wording and frequency are design proposals.                             |
| https://www.w3.org/WAI/WCAG22/Understanding/on-input.html        | Changes of content are not necessarily changes of context. Unexpected context changes on input need prevention or advance explanation. | Preserve intentional city-selection updates; no source-based argument for a mandatory panel-wide Apply.                                                 |

No contradictions emerged for these bounded claims. These sources do not establish that a summary is faster, a disclosure is preferred, or a particular density is usable.

## Inspected local images

Images were opened with `view_image`, unmodified. No screenshots or renderers were produced by this specialist. Parent supplies capture provenance; image inspection alone does not verify behavior.

- `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/02-global-initial.png`, parent fresh capture at 1440×900: current missing-location scene, disabled Sun action, date/time before location, repeated Configuration / Settings for / Global configuration labels. Supports task-order/hierarchy observations.
- `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/03-city-search.png`, same current app/size: San Jose California query, visible city + region/country details, growing results list, coordinate acceptance below visible panel area. Supports keeping disambiguation and testing disclosure/scrolling. Does not establish search-ranking correctness.
- `C:/dev/flattened-steel/.codex-tmp/flat-model-services/2026-11-05/camera-controls.png`: current camera-era single view at 1100×700, 40 km and Natural (35°), persistent click/Escape hint; no observation summary. Supports current closed-header labels and pointer instruction observations.
- `C:/dev/flattened-steel/.codex-tmp/global-configuration/2026-11-05/local-entry-formats/en-US.png`: older pre-scene frame at 1440×900; inspected only for input labels/grouped actions. Fresh captures supersede its surrounding frame and scene status.

- `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/08-comparison-global-config.png`, 1440×900: both scenes rendered beside inspector; each view 540 px wide. Header wraps across several rows; scene selector, camera controls and close remain identifiable.
- `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/09-compact-comparison-config.png`, 1100×800: each view 406 px wide beside 288 px inspector. Camera selects cross the view divider and inspector edge; Close view visibly overlaps View 2 FOV. Document scroll width equals viewport width, which does not establish local containment.
- `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/10-narrow-comparison-config.png`, 600×900: stacked 261 px views and 315 px bottom inspector. Headers take roughly 130 px per view by image inspection; hints occupy further visible scene area. Panel content scrolls independently; no assertion that below-fold actions are unreachable.
- `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/11-narrow-single-config.png`, viewport 390×844: single header exceeds scene width. Parent capture-report records document scroll width 430 px; this supports actual horizontal overflow, without implying a selected phone-support requirement.

Read `../../../../../../.codex-tmp/flat-configuration-advice/2026-11-05/captures/capture-report.json` metadata and the records for 08–11; exact viewport/view/panel/scroll dimensions above come from that parent-produced file. It identifies the existing isolated model-services build, unchanged application source, America/Los_Angeles device zone and an empty capture-errors array. The roughly 130 px header measurement is visual, not a field reported by the JSON. Parent independently inspected the same compact/narrow states; that corroboration is distinct from source verification of this delivered report.

No user session, keyboard/screen-reader trial, pointer capture experiment, loading-time measurement, usability test, contrast audit, target-device study or validation of draft retention was performed.

## Reuse limits and handoff

Revisit affected advice if shared-versus-view ownership changes, the settings inventory expands, target tasks become known, commit semantics change, or new persistence/input-device requirements are selected. Preserve unaffected checked predecessor claims. Parent owns new source checking, owner decisions and durable promotion. This package answers UX1–UX7 as advisory direction; missing empirical evidence is reported rather than converted into an implementation veto.
