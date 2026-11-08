# Active Topic

Current active topic: component-refactor.
Canonical entry: [Component Refactor](component-refactor/README.md).
Focus: Flat icon-toolbar M1–M3 implementation and verification are complete.
Types, 218 built-in browser tests, the normal production build and final
actual-app checks pass. The execution record owns current status,
consequential decisions, recovery evidence and checkpoints.

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
2. [Component Refactor entry](component-refactor/README.md).
3. [Toolbar direction](component-refactor/toolbar-refactor.md).
4. [Toolbar implementation plan](component-refactor/toolbar-implementation-plan.md).
5. [Toolbar execution record](component-refactor/toolbar-implementation-execution.md).
