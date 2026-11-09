# Active Topic

Current active topic: flat.
Canonical entry: [Flat](flat/README.md).
Focus: camera-sync UI M1-M2 are complete under independent execution.
flat/camera-sync-ui-plan.md owns the final report, evidence, decisions and
whole-repository checkpoint record; flat/sync-window-design.md owns behavior.
Both Earth toolbars offer text-only Match now, Follow other view, Link both
views and Stop syncing through the unchanged app-local camera-sync service.
The SyncAltOutlined button beside compass uses standard MUI selected treatment
when this view receives updates. Menu opening does not toggle selection.
Direction and requested elevation synchronize without echoes, including
toolbar/settings changes; FOV and other page presentation stay independent.
Scoped registered receivers retire before their session; overlapping callbacks
preserve newer intent. All 281 browser tests, Flat types, formatting and the
normal build pass. Real served-app mixed/same-type, pointer/keyboard, retained
resource, concurrency/lifetime, failure/retry and configuration checks pass.
Disposable browser profiles were removed. The report records local checkpoint
disposition; no push or deployment is authorized.
All new/touched declarations are ambient with no exports; CameraSyncService
is directly in services/types.d.ts. FOV synchronization, debounce/coalescing and
structured errors remain deferred. No follow-on implementation is selected.
The Earth scene resize correction is complete. Both renderers apply
device scaling once to physical drawing-buffer dimensions. Flat types, the
normal build and all 240 browser tests pass, as do native layout checks at
100%, 125% and 200% scaling. See flat/scene-resize.md for diagnosis and evidence.
Opening comparison now chooses the registered page type not already active:
Flat beside Spherical, or Spherical beside Flat. Closing and reopening recomputes
the choice without replacing the primary view. Flat types, the normal build and
all 241 browser tests pass, including both selections, fresh comparison lifetimes and rollback
of a failed alternative mount. The Flat entry owns this selection policy.
Independent compass toggles and camera-synchronized directional ribbons
are complete for both Earth toolbars. See flat/directional-ribbon.md. Flat types,
239 browser tests, the normal production build and live layout/native-input checks
pass. Evidence is under .codex-tmp/direction-ribbon/20261108/.
The Sun/Polaris focus menu is implemented for both Earth views. The owning
note is flat/celestial-focus.md. Menu tests, types, focused geometry tests and
real browser aiming/GPU comparisons pass. Checkpoint disposition is recorded
in the camera-sync service plan's final report.
Global date/time settings also have a localized Now action beside Apply. It
sets the shared clock to the current instant and replaces unfinished drafts.
Flat types, normal build and all 235 browser tests pass; the regression covers
both clock updates and draft replacement when the instant is unchanged.
Spherical Earth M1-M4 are complete: real atmosphere, curved green ground,
Sun/stars, independently scoped icon controls and retained scene/cache updates.
Final shader comparisons, GPU-completed one/mixed/two-view timings, failure/context/
lifetime checks and separate-parent discoverable deployment all pass. Live depth
encoding and immediate context-loss retirement fix the issues found by those checks.
Current evidence lives under
.codex-tmp/spherical-earth/m2-m4-20261108/ and the execution record.
The time-zone/IntlDate design decisions remain in the date-field adaptation note:
Temporal with a polyfill when needed, current-user locale formatting, and explicit
locale/time-zone parser inputs rather than a `localize` dependency. Possible time
parsing remains tentative. Those changes are outside the spherical feature plan.
The owned-content cleanup remains complete; its execution record is linked
from the Flat entry. The spherical execution record owns the M1 handoff; the
whole-repository checkpoint for the preceding cleanup remains 263eb193.

Shared MUI controls use AppContext small/outlined defaults; explicit supported
props win. All UI copy uses the selected localization service, without
localizationEnabled, localize switches or fallback text. PanelButton delegates
its popup, dismissal and focus behavior to MUI Popover. The single-row toolbar
preserves workspace-owned scene/settings/lifetimes and feature-owned controls.

The owner deferred the transferred IntlDate parser adaptation and reclassification
of utilities incorrectly called models. Models are exclusively services.
Engineering standards reviewers remain cancelled; checkpoint-adviser monitoring
remains active. The dome-cache experiment remains suspended. Promote the six
local authoring rules only after Polylith skills review work is complete.

## Minimal Reload Sources

1. [Repository instructions](../../AGENTS.md).
2. [Flat entry](flat/README.md).
3. [Celestial focus menu](flat/celestial-focus.md).
4. [Directional ribbon](flat/directional-ribbon.md).
5. [Scene resizing](flat/scene-resize.md).
6. [Sync Window design](flat/sync-window-design.md).
7. [Camera-sync service plan](flat/camera-sync-service-plan.md).
8. [Camera-sync UI plan](flat/camera-sync-ui-plan.md).
