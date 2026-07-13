# Algorithm32 Paper-Profile Whole-Algorithm Conclusion

Status: **accepted**. Runs `000170`, `000167`, `000168`, `000166`, and
`000169` are the current Default and J2-through-J5 paper-profile boundaries.
Runs `000160` through `000164` remain valid black-ground comparison evidence;
runs `000155` through `000159` are superseded diagnostic evidence and must not
be used for numerical or scientific claims.

## Question And Boundary

How does Algorithm32 Default and the retained cumulative n-order recurrence
through J5 compare with the published Bruneton/Kider observables when the
calculation itself uses the paper's 40 wavelength coordinates and published
physical-input profile, without the native 15-to-40 projection?

Every candidate uses the same direct 40-channel paper profile, 17 Kider times,
81 directions per time, 40 view intervals, 20 source-transmittance intervals,
34 incoming directions, and 48 altitude nodes. J2 through J5 additionally use
the selected W27 outgoing domain, view-only interpolation between actual
neighboring altitude nodes, and the profile's grass spectral albedo through a
uniform Lambertian ground boundary. The albedo is profile data, not a constant
embedded in the boundary or scattering implementation. The unchanged Default
reference does not implement this n-order ground boundary and remains the
black-ground family baseline.

The external authorities are Bruneton's
[clear-sky model comparison paper](https://arxiv.org/abs/1612.04336), the
pinned `clear-sky-models` revision
`4df2ec6609bc0127a478bd34fff29c94352579cc`, and the downloaded Kider
measurement set recorded by the B1--B3 reports.

## Current Results

| candidate | sealed run | B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | B1 | B2 RMSE / bias / worst residual (W m^-2) | B2 | B3-minus-B1 (mW m^-2 sr^-1 nm^-1) |
| --- | --- | ---: | --- | ---: | --- | ---: |
| Algorithm32 Paper | `000170` | 16.101693 | limited | 9.020744 / -8.807923 / 11.964868 | favorable | `+2.025534e-7` |
| Algorithm32 Paper J2 | `000167` | 14.153018 | favorable | 5.286845 / -4.993601 / 7.880811 | favorable | `+4.329267e-7` |
| Algorithm32 Paper J3 | `000168` | 12.260324 | favorable | 3.202446 / -2.704566 / 5.541506 | favorable | `-3.748868e-8` |
| Algorithm32 Paper J4 | `000166` | 11.925783 | favorable | 2.629376 / -2.004084 / 4.793030 | favorable | `+8.355263e-9` |
| Algorithm32 Paper J5 | `000169` | 11.869640 | favorable | 2.431866 / -1.741777 / 4.498620 | favorable | `-1.778421e-7` |

Default is limited only because its 13:15 B1 value is `17.414261`, exceeding
the predeclared favorable threshold `17.4` by `0.014261`. Its aggregate and
the other two displayed Figure 5 times are favorable. Every J2-through-J5 B1
criterion is favorable. Every candidate is favorable under B2, and every B3
aggregate reproduces its candidate-labelled B1 aggregate within the required
`1e-6`.

The adjacent-candidate B1 reductions are `1.948675`, `1.892694`, `0.334541`,
and `0.056143` from Default through J5. The corresponding B2 RMSE reductions
are `3.733899`, `2.084399`, `0.573070`, and `0.197510 W m^-2`. The Default to
J2 change includes both the n-order method and enabling the profile-owned
ground boundary, so it is not an isolated scattering-order delta. These are bounded
in-sample improvements, not a convergence proof or a release-order decision.

Subsequent project policy selects cumulative J4 as Algorithm32's default going
forward. The active figures therefore display the paper J4 boundary solely as
Algorithm32. This document preserves the preselection comparison and its
stable subject labels; J5 remains retained comparison evidence, not the
default.

Under the current nomenclature, plain `Algorithm32` means order 4. Other
orders carry a subscript on the name, such as `Algorithm32₂` or
`Algorithm32₅`; `Algorithm32₄` is valid when explicit comparison benefits from
showing the assumed order. The paper-profile labels below remain unchanged
evidence identities.

Durable reports and active figures:

- [B1 directional sky radiance](b1-directional-sky-radiance/result.md)
- [B2 hemispherical sky irradiance](b2-hemispherical-sky-irradiance/result.md)
- [B3 matched-atmosphere solver context](b3-matched-atmosphere-solver/result.md)
- [B1 aggregate figure](b1-directional-sky-radiance/figures/b1-aggregate-rmse.svg)
- [B1 extended Figure 5 error domes](b1-directional-sky-radiance/figures/b1-figure5-relative-error-domes.svg)
- [B2 irradiance figure](b2-hemispherical-sky-irradiance/figures/b2-diffuse-sky-irradiance.svg)
- [B3 fixed-baseline figure](b3-matched-atmosphere-solver/figures/b3-fixed-baseline-residuals.svg)

## Superseded-Run Diagnosis

The first paper-profile series, runs `000155` through `000159`, passed its
structural checks but is numerically invalid. The paper profile introduced an
exact 0 m cache boundary that exposed a pre-existing spherical-ground
intersection error:

```text
valid inward ground hit: distance = 0
old predicate:           distance > 0
old result:              no ground hit
transport result:        ray exits the far side of the atmosphere
```

The false path was approximately `12,780 km`. With 40 transport intervals,
the first unattenuated trapezoid contribution represented `159.75 km`; at
360 nm its raw scattering multiplier was approximately `20.3`. Reapplying
that error in the recurrence caused the apparent J3-through-J5 runaway.

`SphericalEarthGeometry.distanceToGroundBoundary` now preserves a
zero-distance inward hit within a scale-aware floating-point tolerance, and
atmosphere-exit selection accepts `groundDistance >= 0`. Regression tests
cover radial and oblique inward rays at the exact boundary, outward rays, and
the existing elevated 2 m case. The corrected runs use this implementation.

Native 15-channel results are not retroactively changed by this diagnosis:
their first physical cache node and observer boundary are 2 m above ground,
so an inward ray has a positive ground-intersection distance and already
followed the intended branch. The correction nevertheless closes the general
geometry contract for any exact ground-boundary caller.

## Claim Boundary

The current result supports the narrow claim that the direct 40-channel
Algorithm32 paper-profile candidates are finite, nonnegative, internally
consistent, and compare at least within the declared limited/favorable model
distribution on the fitted Kider conditions. It does not establish
out-of-sample accuracy, equality with libRadtran, flat-geometry or local-source
accuracy, general ground-reflection accuracy, GPU parity, performance adequacy,
convergence beyond J5, or that the downstream J4 default is uniquely optimal.

For n-order J2 through J5, four declared physical/numerical differences remain:
multiple-scattering treatment, incident angular quadrature, vertical/path
discretization, and geometry approximation. The unchanged Default comparison
also retains ground reflection as a fifth mismatch.
