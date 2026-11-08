# Active Topic

Current active topic: flat.
Canonical entry: [Flat](flat/README.md).
Focus: Spherical Earth M1-M4 are complete: real atmosphere, curved green ground,
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
3. [Spherical Earth execution](flat/spherical-earth-implementation-execution.md).
4. [Spherical Earth implementation plan](flat/spherical-earth-implementation-plan.md).
