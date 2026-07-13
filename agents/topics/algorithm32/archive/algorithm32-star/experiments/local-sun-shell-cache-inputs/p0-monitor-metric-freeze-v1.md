# P0 Monitor And Metric Freeze v1

Status: approved design input for P0 F6 and F9. It is a diagnostic monitor
and descriptive metric policy; it sets no acceptance threshold or cache size.

## Shared Monitor

The monitor has no DirectJ2 correction or reduced response packet. It is one
shared diagnostic vector, evaluated only on regression samples:

    D(p) = (
      z / H,
      density(z) / density(0),
      h(abs(x)) / H,
      rMin / r(p)
    )

Density is sampled from the pinned canonical atmosphere at the physical
altitude. H, h, rMin, and r are the selected analytic geometry facts. Ground,
cap, rim, source axis, and outside-domain are separate categorical feature
flags, not scalar coordinates.

The scalar monitor norm is ordinary Euclidean norm over the four normalized
components. Nested 33x33, 65x65, and 129x129 sigma/v regression grids must
preserve every feature classification and have a maximum corresponding-sample
norm change no greater than 0.001 between the last two grids. The monitor may
report coverage gaps, but cannot change N, radial boundaries, packet contents,
or the frozen row formula.

## Direct Error

For every held-out position, W27 direction, and native spectral channel,
record absolute component error:

    e(q,d,l) = cachedJ2(q,d,l) - directJ2(q,d,l)
    absError(q,d,l) = abs(e(q,d,l))

For each position/direction packet, record absolute RMS across its 15 native
channels and relative RMS only when the direct packet RMS is nonzero:

    packetRms = sqrt(sum_l(e^2) / 15)
    directPacketRms = sqrt(sum_l(directJ2^2) / 15)
    relativePacketRms = packetRms / directPacketRms

A zero direct packet records its relative metric as not-applicable and retains
absolute error. Reports include maximum absolute component error, packet RMS,
nearest-rank p95 of applicable relative packet RMS, the exact worst query,
and all values separated by source case and required feature bin. These are
descriptive outputs, not pass/fail limits.

## Required Feature Bins

- ordinary interior
- ground-adjacent interior
- cap-adjacent interior
- map center
- source subpoint/source axis
- near rim and exact rim
- near-source and far-source distance
- structured row boundary and radial boundary
- reflected partner

## Reporting And Measurement

Every shell row reports N, source case, dimensions, valid nodes, projected
field bytes, projected complete bytes, direct metrics, monitor diagnostics,
and direct stencil type. Resource and timing mechanics remain F9-open until
their isolated allocation and clock protocol are separately frozen.

## Approved Scope

This closes F6 and the error/reporting portion of F9. It makes no numerical
quality decision.

