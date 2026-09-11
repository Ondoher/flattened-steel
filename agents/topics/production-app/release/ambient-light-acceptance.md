# Ambient-Light Appearance Acceptance

Status: A0-A7 complete; the owner accepted the retained lighting candidate.
This is the substantive owner for release coordination item C3.

The [runtime design](../runtime-integration/ambient-light-design.md) owns the
physical-E8-to-unitless-Three bridge. The
[review procedure](../../poc-flat32/appearance-review/ambient-light-design.md)
is diagnostic; it cannot select a calibration or supply release acceptance.

## A7 — Lighting-Only Review

Review matched candidate runs `000016`/`000017` at sunset plus one hour and
`000018`/`000019` at sunset in the ambient-light evidence lane. They show
zero WebGL errors and no white-geometry regression. The recorded A6 gates are
both type checks, Algorithm32 `610/610`, and the exact-cache Flat32 lane `25/25`.
These are retained results, not tests rerun by document migration.

The project owner accepts the retained sunset and sunset-plus-one-hour
candidate, including the very dark plus-one-hour geometry. No replacement
scene-light calibration equation is selected. The accepted result does not
alter or compensate in atmosphere, Color, or the diagnostic toggle. A7 and C3
are complete independently of the full Color/star cadence C2.

Completed A0-A6 steps and rejected `000014`/`000015` comparisons are in the
[original plan](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/production/ambient-light-plan.md).
