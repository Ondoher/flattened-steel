# Flat Earth Time: Degrees From Closest

Status: owner-requested design discussion, 2026-11-05. This records implementation
notes and UI intent, not an implementation plan, app change, or accepted comp.

## Selected Meaning And Placement

The owner wants an alternate Flat Earth time input expressed as **degrees from
closest**. They confirmed that this means the Sun's angular position before or
after its closest approach to the selected location, with zero degrees at closest
approach. This is position around the daily orbit, not solar elevation, azimuth,
or camera FOV.

The owner selected a separate configuration pane and now requests a visible
slider on the Flat Earth page toolbar, plus a slider and numeric edit field in
Flat Earth configuration. The [updated comps](configuration-toolbar-comps.md#shared-time-slider-update)
show both surfaces for discussion.

The feature-owned **Flat Earth time** pane shows the degrees input, its closest-
approach reference, the relevant date basis, and the resolved date/time. The
page-toolbar slider exposes that same angle and provides access to the pane. Both surfaces
must use the same model-service operation and current value; they do not create
two time owners. Keep camera and time controls recognizably grouped.

A proposed signed presentation is zero at closest, negative before, positive
after. The exact display range, precision, wrap convention and date-rollover
behavior are not selected. A time-pane explanation can establish the reference;
the toolbar should remain concise while retaining angle units and time meaning.

## Slider And Numeric Entry Working Proposal

The owner suggested a slider together with a numeric entry field. Treat these
as two synchronized controls for one degrees-from-closest value, not separate
settings. The full pair belongs in the dedicated Time pane; the page toolbar
shows a slider, current angle readout, and Time settings entry.

A clearly marked zero reference makes closest approach easy to find. Under the
proposed signed convention, the slider can show before and after on either side
of zero. Its final endpoints, precision and wrap/day behavior remain open; the
slider must not silently settle those domain choices.

Proposed interaction: slider movement requests shared-time changes for exploration;
numeric entry supports precise angles. Typing an incomplete value must remain a
draft rather than forcing a scene change or replacing the user's text. On valid
numeric acceptance, the slider and shared date/time reflect that same angle.
Changes from another time editor or playback update both controls, with deliberate
handling of an active numeric draft.

Keep scene updates responsive by coalescing requests to the latest angle while
preserving a coherent displayed frame. Requested angle and currently displayed
result can differ during preparation; existing per-view update feedback must
communicate that distinction. This proposes interaction behavior, not an
implementation or measured performance result.

## Existing Engine Support

Production [FlatEarthGeometry.resolveObservationInstant](../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js)
already accepts the **closest-angle** policy with a date basis, geographic
location, and unit-bearing angle. Its
[request contract](../../../src/algorithm32/implementation/flat-earth/types.d.ts)
describes a clockwise angle from closest approach. The
[FlatSynchronizer](../../../src/algorithm32/implementation/flat-earth/synchronization/FlatSynchronizer.js)
uses the date for seasonal state and the daily anchor, then converts angle and
location into a canonical UTC instant. Positive angles follow the model's clockwise
orbit convention. Angle wraps are normalized within that daily orbit.

[Flat32's location/time controller](../../../src/flat32/LocationTimeController.js)
already uses that public production geometry resolver for its flat-time presets.
This is read-only integration reference; Flat must not import the test bed.
The app's feature-owned model-service can use the production capability directly.
Do not replace geometry-owned conversion with a guessed local-noon calculation.

The date remains necessary: the angle alone does not supply seasonal state.
A signed before/after editor needs explicit day selection around a wrap; simply
passing a negative angle into the existing normalized orbit is not a complete
policy for preserving the intended previous/next day. Resolved calendar/clock
feedback should make that consequence clear.

The app-wide animation loop's current phase is relative to its startup epoch.
It is not automatically degrees from the Sun's closest approach. Closest-angle
readback must use the physical observation's geometry/location reference rather
than relabeling that animation phase.

## Selected Shared-Time Ownership

The owner explicitly selected **update shared time for both views**. Degrees from
closest is another editor for the same canonical timestamp. The Flat Earth
feature owns this interpretation/editor and resolves the angle through production
geometry, then updates the main current-time capability. Ordinary date/time entry
and both views continue to reflect that same instant. No per-view time override
or second simulation clock is selected.

Feature ownership does not make the time write view-local. Place the dedicated
**Flat Earth time** pane in shared configuration and make its shared effect clear.
The Flat Earth feature contributes that pane through the generic configuration
interface; the global configuration editor does not import the page's controls.
Per-view Camera settings remain independently scoped as before.

The toolbar comp uses a distinct **Shared time** row with **Degrees from closest**,
the current signed angle, a visible slider, and **Time settings**. The dedicated
shared pane shows the synchronized slider/numeric pair, date basis, reference and
resolved device date/time. Both toolbar entries highlight when that shared pane
is open. Camera controls stay in their own rows; Page settings retains its
view-specific target. The shared surface distinguishes **Location and time**
from **Flat Earth time**. These are presentation proposals for the requested
placements, not accepted breakpoints or an implemented provider.

The angle readout and ordinary clock readout are two representations of one
instant. Whichever editor changes it, both views and both readouts update. A page
settings surface that promises all changes affect View 2 only must not present
this shared-time control as an ordinary view-local option. Its shared target must
be explicit in navigation and registration.

## Further Interaction Decisions

Define whether the angle is simply an alternate editing/readout representation
or a retained input mode; changing representation should not silently move time.
Choose the date/closest-approach occurrence used for a requested angle, signed
wrap behavior, numeric precision, and explicit acceptance versus immediate
adjustment. Keep unfinished angle drafts distinct from accepted time.

When another time editor or playback changes the accepted instant, derive the
current displayed angle from that instant and location. An unfinished draft needs
the same deliberate update/retention treatment as other editors. Location changes
also change the closest-approach reference; decide whether to preserve the instant
or hold the angle, rather than implying both can remain unchanged.

The [four-state slider comp update](configuration-toolbar-comps.md#shared-time-slider-update)
shows the requested placements. Application source and configuration providers
remain unchanged. The shared-time rule and existing
[provider contract](component-service-proposal.md#configuration-provider-contract)
remain the structural context. The owner-requested
[implementation plan](workspace-comps-implementation-plan.md) now sequences this
work; execution has not begun.
