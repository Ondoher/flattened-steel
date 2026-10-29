# Flat Main-Frame UI Research

Research date: 2026-10-28. Status: advisory presentation research for discussion.
The UI researcher was called directly, without running refine-design. This
document is not a final visual design, an implementation plan, or a record of
usability validation. No application UI or mockup was implemented.

## Inputs And Scope

The inputs were the [product description](product-description.md),
[UX research](main-frame-ux-research.md), and
[selected product requirements](../production-app/product-behavior/README.md#selected-production-app-behavior).
The research concerns presentation of the toolbar, optional comparison, view
controls, configuration, and scene status. It preserves shared location/date/time
and independent viewing controls. The second view's content remains open.

No MUI or replacement component library is selected. Localization is required.
The owner subsequently selected the
[interface palette](../production-app/product-behavior/README.md#visual-palette)
on 2026-10-29. Typography, other branding details, audience, and target window
sizes remain open. Desktop documentation examples are a working reference,
not a selected device support policy.

The presentation guidance applies both to frame hosts and to feature-provided
content. Control placement in a toolbar or inspector does not imply that its
implementation belongs to the main app view. The
[ownership notes](implementation-notes.md#main-app-and-feature-ownership)
separately describe that proposed boundary.

## Inspected Visual Evidence

The researcher and primary agent inspected four unchanged official source
images. Supporting documentation was also checked. Source access and visual
inspection occurred on 2026-10-28.

| Reference                                                                                                                          | Observed presentation                                                                                       | Applicability and limits                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [QGIS 3D map view image](https://docs.qgis.org/3.44/en/_images/3dmapview.png)                                                      | Compact top icon row, large scene, substantial right camera/debug panel, and bottom animation strip.        | Demonstrates the space taken by persistent tools. Its GIS/debugging controls and animation strip are not Flat requirements.                              |
| [QGIS camera settings image](https://docs.qgis.org/3.44/en/_images/3dmapconfiguration_camera.png)                                  | Labelled numeric FOV input and other camera fields, grouped sections, and a settings category list.         | Useful grouping and precision-input reference. Flat has not selected these categories, numeric values, or a separate dialog.                             |
| [Stellarium date/time image](https://raw.githubusercontent.com/Stellarium/stellarium/master/guide/Images/date_and_time_dialog.png) | Compact date and time segments, tab headings, numeric fields, and step arrows within a dark frame.          | Useful reference for compact observation editing. The depicted tabs, date format, and styling are not selected for Flat.                                 |
| [Stellarium location image](https://raw.githubusercontent.com/Stellarium/stellarium/master/guide/Images/location_dialog.png)       | Large map and location list above a dense labelled form, including time-zone settings, within dark framing. | Shows why a rich location editor may need more space than a toolbar field. It does not select maps, GPS, network location, or its visual theme for Flat. |

The supporting sources are the
[QGIS 3.44 3D Map View documentation](https://docs.qgis.org/3.44/en/docs/user_manual/map_views/3d_map_view.html)
and [Stellarium interface guide source](https://raw.githubusercontent.com/Stellarium/stellarium/master/guide/ch_interface.tex).
QGIS's documentation version is known, but the screenshot's exact application
build is not. Stellarium images come from the current master branch; their
depicted software versions are unspecified. These are bounded visual references,
rather than proof of the latest installed application appearance.

Original image bytes and download provenance, including source URLs, SHA-256
hashes, and retrieval timestamps, are retained under the ignored working folder
`.codex-tmp/flat-ui-research/2026-10-28/`. The originals were not edited. Blender
documentation access failed and was not used as visual evidence.

## Research Alternatives Before Palette Selection

The alternatives below record the original research comparison. The owner's
selected near-black/near-white/light-blue palette now governs the design;
these are not current palette options. The comparison was inferred from Flat's
tasks and the references, not observed usability outcomes.

| Direction                         | Character                                                                                                                        | Tradeoff                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Muted charcoal frame              | Opaque neutral toolbar and view headers, concise labels, restrained borders, compact numeric controls, and limited accent color. | The research identified the risk of dark scenes blending into the frame. Its palette-comparison recommendation is superseded.                          |
| Light utility interface           | Light panels, conventional form fields, and strong section headings.                                                             | The research considered familiar form hierarchy and bright surfaces competing with night scenes. The light palette is not the selected direction.      |
| Immersive controls over the scene | Minimal persistent framing, with floating tools and editors.                                                                     | Gives the scene more nominal area but can obscure the horizon and complicate legibility against changing backgrounds. Less suitable as the main frame. |

## Recommended Starting Guidance

Use the owner's selected palette across the frame and feature-contributed
controls. The remaining guidance concerns hierarchy, grouping, and treatment
within that palette. The source images do not establish a measured advantage
for atmospheric color judgment; palette selection comes from the owner.

The scene should be the visual focus. The shared observation should be easy to
read next, with each view's local controls clearly attached to its scene.
Configuration can use stronger section grouping when opened without making
every ordinary toolbar control look like a separate card.

Use concise text labels for location, date/time, height, and FOV. Icons can
support familiar actions, but important scope and numeric meaning should remain
visible. Group related controls through alignment, spacing, and restrained
separators. Keep date and time together and preserve a visible time-basis label.

Use readable sans-serif text, consistent numeric alignment, and stable unit
labels. Tabular digits are a useful option for values that change frequently.
Precise numeric entry should remain available even if sliders or steppers are
offered. Height reference and FOV convention must follow the eventual product
and engine decisions.

Give each view a stable label and matching control treatment. Show focus or
editing target through a heading or outline as well as any color accent. If
configuration edits one view, its scope should remain visible in the inspector
heading. Application-wide settings need a different explicit scope.

Use opaque or reliably backed control surfaces where changing sky luminance
would otherwise make text hard to read. A subtle separator can distinguish two
views without adding a heavy frame around both. State shade variations, accent
application, border weights, type sizes, and spacing values need design
exploration with representative scene imagery within the selected palette.

Loading, retained-old-result, ready, and failure states should have concise
text and a consistent place near the affected view's heading or status area.
Avoid obscuring the whole scene for routine preparation. A retained result must
not silently look like the new shared observation. State colors alone are not
sufficient to communicate these distinctions.
Do not invent progress percentages or completion estimates without a meaningful
underlying measurement.

At narrower widths, preserve labels, units, and control groups rather than
compressing everything into tiny icon buttons. Toolbar wrapping or compact
editors are candidates. Stacked views or a retained-view switch remain UX
options; exact widths and the final fallback are unselected. Longer translated
labels and numeric values need room in any later layout evaluation.

## Handoff Questions

A UI designer still needs representative bright/day, sunset, and dark/night
scene references; target window sizes and devices; typography preferences;
the configuration inventory; and the settled meanings of height,
FOV, and time. Visual exploration should include single-view and comparison
states with configuration both open and closed, plus updating and failure
states. These are evidence needs for later design, not an execution plan.

No user testing, Flat prototype inspection, measured readability comparison,
contrast audit, or touch-device evaluation was performed. The research does not
establish final density or a usability result. The palette is selected by the
owner, rather than inferred from these comparisons.
