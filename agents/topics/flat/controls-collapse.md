# Per-view Control Collapse

Status: implemented and locally verified.

The owner requested a collapse button that shows only the top view-control
row. Each generic ViewportFrame now has a compact up/down triangle button,
with localized Collapse controls / Expand controls names and native button
keyboard behavior, aria-expanded and aria-controls. It leaves view identity,
scene selection, Page settings and optional Close View actions available.
Camera/sky and shared-time tool rows hide together.

This is transient presentation state owned by each keyed frame. Rows use the
native hidden attribute, retaining their mounted components, subscriptions,
drafts and feature state. The scene/canvas also remains mounted. Expanding
restores the same controls and accepted values; a new comparison view starts
expanded independently. Closing comparison preserves the primary view's state.
No feature-specific knowledge was added to the workspace. Header actions have
a separate grid column; collapsed headers remove the hidden rows' grid tracks
and spacing, including the wide single-view layout.

## Verification

Client types pass; the existing browser suite passes all 128 tests. The new
regression verifies independent hiding, retained scene/tool DOM and draft,
visible top-row controls, restored rows and preservation across comparison
changes. Actual application DOM/layout proof is retained under
.codex-tmp/flat-controls-collapse/. The UI-only proof stubs cache warming and
physical preparation; it does not claim a new GPU/scientific verification.
At 1100px, the header shrinks from 185px to 57px, the canvas identity and
preparation count are unchanged, the Sky selection survives and the second
view starts expanded while the first remains collapsed. Captures were inspected.
At 1440px, the header shrinks from 149px to 57px with the same independent
behavior. The [standard-width proof](../../../.codex-tmp/flat-controls-collapse/layout-proof.json) and
[wide proof](../../../.codex-tmp/flat-controls-collapse/wide-layout-proof.json) retain measurements,
with [collapsed](../../../.codex-tmp/flat-controls-collapse/wide-collapsed.png) and comparison captures.
Normal app output was rebuilt; source types, scoped formatting, links and Git
whitespace pass. No new scientific/GPU campaign was needed for this UI change.

The owner has now requested a whole-repository checkpoint preserving collapse
with the preceding shader/star work and subsequent toolbar-design notes. The
later [M4 verification](../component-refactor/mui-migration-execution.md#m4-final-handoff)
also checks retained controls and comparison behavior. Engineering reviews remain owner-cancelled;
primary self-review and local checks are used, with no compliance claim.
The dome-cache experiment remains suspended. No publication was requested.
