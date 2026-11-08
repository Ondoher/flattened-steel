# Toolbar Plan Critique

Reviewed: 2026-11-08, independently by `toolbar_plan_critique_20261108` through
the create-plan skill. Scope: the saved toolbar plan against the selected icon
direction, current popup/gesture/contribution code and owner constraints.
This was a read-only plan critique; no source review or implementation occurred.

The reviewer found the direction and early Sky/clock slice appropriate and
recommended six concrete revisions. All were incorporated into the
[current plan](toolbar-implementation-plan.md); none were rejected.

| Finding                                                                                                                                | Incorporated change                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup-to-settings ordering can deliver stale intent or restore focus incorrectly.                                                      | Store one pending intent; deliver after MUI dismissal/restoration; cancel on unmount, page change or reopen. Verify configuration both closed and already open.                               |
| Closing the popup must release both Slider/MUI drag state and the time-service token; the old contribution ID participates in cleanup. | M1 requires both layers to end and rejects further seeks during exit. M2 updates the merged contribution's exact cleanup and checks mid-edit closure.                                         |
| The missing-location state was underspecified.                                                                                         | Clock remains reachable, with an explanation and existing location-settings shortcut; only the unavailable slider is disabled.                                                                |
| Native button routing, choice semantics and localization ownership need explicit contracts.                                            | Forward native attributes including data-view-id; retain selected/disabled choice semantics; resolve LocalizedText once and use an internal prepared-text contract for composed presentation. |
| Overflow can widen a viewport or produce an unusable popup.                                                                            | Require shrinkable contribution wrappers, overflow in the intended region, viewport-bounded popups, usable slider width and keyboard exposure of scrolled commands.                           |
| M1 images could be mistaken for proof of the final single-row layout.                                                                  | M1 shows real Sky/clock controls in the current layout; final composition remains M2. Image context and meaningful comparison conditions are recorded.                                        |

No extra research, service redesign, standards-review gate or deferred parser/
utility repair was added. Proposed interaction defaults remain proposals for
execution under future owner authorization. The plan is ready for handoff;
implementation has not started.
