# Resolved Moon Follow-Up

Focus: Physical and numerical claim authority.

Related owners: [color-celestial](../../production-algorithm32/color-celestial/moon-follow-up.md).

## Required Follow-Up Design Decisions

Before implementation, select and fingerprint:

- lunar shape, radius convention, body-fixed axes, texture projection, and
  mesh-versus-analytic intersection contract;
- ephemeris/body-orientation provider, celestial frames, epoch, time scale,
  observer state, and objective accuracy cases;
- spectral texture or reflectance reconstruction, BRDF/photometric law,
  normal/topography policy, and source-data provenance;
- finite versus extended solar illumination, phase/terminator behavior, and
  whether eclipses, Earthshine, terrain shadows, opposition behavior, and
  thermal emission are in the first resolved-Moon family;
- the cache-private transport factorization and its invalidation boundary;
- celestial depth/mask precision, Moon-over-star exact-direction visibility,
  partial-pixel limb integration, and CPU/GPU parity policy; and
- numerical, resource, build-time, and frame-time budgets.

An RGB lunar texture may be used only by a separately labeled presentation
path. A physical path requires spectral reflectance/radiance data or a
declared and independently qualified spectral reconstruction.
