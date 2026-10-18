# H66 Camera-facing outgoing grid at sunset

Status: complete through accepted00445; [results](camera-grid-results.md) own
the figures, numerical outcome and preserved startup qualifications.
Compare the same-count Sun-focused
outgoing grid with a rigidly rotated copy whose dense region follows the camera
view, to assess sunset sensitivity to outgoing representation. Production and
earlier evidence remain read-only.

## Frozen experiment

Use H65 sunset controls unchanged: Toronto phase/SSA with canonical aerosol
amount/profile, San Jose, observer5m, solar zenith89.9579152265degrees, Native15,
F68 incoming, normalized aerosol weights, source20 and transport60. Query the
same0.05/3/20degree rays at5degree Sun-relative azimuth, Q30/Q120 and pure plus
cumulative N1-N4. Reuse authenticated H65 independent/libRadtran references.

The primary camera axis is the0.05degree/5degree view direction in the receiver
local frame. This is the backward viewing vector used by the cache, rather than
its negation. The other elevations are off-axis controls. This fixed local axis
does not track each quadrature point exactly; report actual lookup offsets.

Keep k=.35 and all4374 outgoing slots. At each solar row rotate the original
Sun-centered warped grid rigidly from that row's Sun axis to the camera axis.
Apply the exact inverse rotation before the original inverse warp in every J
lookup, including recurrence and final probes. Change no phase, incoming weight,
physical source direction, altitude grid, solar grid or path integration setting.
Do not rotate only the lookup of an unchanged cache.

## Proof and execution

1. Check unit vectors, forward/inverse agreement, seam identities, preserved
   pairwise angles and unchanged node counts. Record query offsets and node
   coverage at the observer and along the primary path.
2. Replay three Sun-focused wavelengths against saved H64 outputs through every
   pure/cumulative order and Q30/Q120 ray (relative tolerance5e-6). Rebuild the
   complete camera-facing recurrence at all15 bands on the GPU, serially.
3. Retain compact selected-ray spectra, compiler/browser identities and renderer
   evidence. One new immutable run owns execution, report and verification to
   stay within the approved728MiB retained limit. No new external solver run.
4. Compare both orientations, ordinary Corrected60, independent N1-N4/all and
   libRadtran. Render shared-exposure swatches and spectra with order budgets.
   Record relative spectral and Y changes, without fitting display parameters.
5. Verify immutable parent identities, unchanged physical controls, complete
   coverage, finite/nonnegative outputs and cleanup. Run local types and inspect
   images. No dedicated experiment reviewers; checkpoint advice remains separate.

This tests outgoing representation in the full recurrence and final readout
together. Improvement would support that mechanism but would not isolate its
stage. Little change would constrain this rotation, not rule out all outgoing
interpolation errors. This is a selected-ray diagnostic, not B1 qualification,
production promotion or a full-scene render.
