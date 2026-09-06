# Bruneton Ozone Reference And Qualification Gates

This contained oracle freezes the first ozone implementation to Bruneton's
commit-pinned Earth demo: 300 DU, 233 K retained cross sections, and the linear
10--25--40 km density profile. It is not a production runtime dependency and it
does not authorize tuning ozone from screenshots.

## Physics and data gates

- Preserve all 48 cross sections from 360 through 830 nm at 10 nm spacing.
- Use `1 DU = 2.687e20 molecules m^-2`, so 300 DU is exactly
  `8.061e22 molecules m^-2` in this authority.
- The normalized triangular profile integrates to 15,000 m, giving a peak
  number density of `5.374e18 molecules m^-3`.
- Evaluate the retained table piecewise-linearly at each execution-basis
  coordinate. This is Bruneton's retained-table behavior; it does not invent
  higher-resolution spectral information.
- At 595 nm, both Native-15 and direct-40 have the common anchor
  `sigma = 4.86e-25 m^2`, peak `beta_O3 = 2.611764e-6 m^-1`, vertical optical
  depth `0.03917646`, and vertical ozone-only transmittance
  `exp(-0.03917646)`.

Run the finite authority proof with:

```text
node experiments/extraterrestrial/ozone/audit-bruneton-ozone-reference.js
```

## Production wiring gates

Ozone is absorption only:

```text
total extinction = Rayleigh scattering + Mie extinction + ozone absorption
total scattering = Rayleigh scattering + Mie scattering
```

The CPU `AtmosphereSample.absorption` packet must contain the ozone term, and
`extinction` must include it. Rayleigh/Mie packets, phase functions, and total
scattering must be unchanged. Runtime `sampleAtmosphere` and construction
`cacheExtinction` must use the identical ozone profile and aligned coefficient
packet.

Because the existing construction graph calls shared `cacheExtinction`, one
correct connection must affect all of these paths:

1. source-to-first-scatter transmittance in `primary-j1` and `direct-l1`;
2. view transport while constructing direct and later-order radiance;
3. transport from each preceding order before the next scattering-density
   calculation;
4. finite-segment transmittance for reflected ground radiance;
5. final cache-to-camera transport;
6. direct distant/finite Sun and stellar view transmittance.

No scattering-density source may add ozone, and ozone receives no phase
function.

## Identity and compatibility gates

- Default ozone-off construction must remain byte-for-byte compatible: existing
  atmosphere/profile identities, CPU packets, runtime shader source, cache
  modules and bindings, cache products, and B1 output cannot change.
- An ozone-on atmosphere must have a distinct content-derived identity covering
  table authority, temperature, column, density profile, spectral projection,
  and aligned coefficients. It must never reuse an ozone-off cache.
- Native-15 and direct-40 coefficient packets must carry their own basis and
  provenance identities; neither may be silently projected through the other.
- CPU and GLSL density/coefficient values must agree at 0, 10, 17.5, 25, 32.5,
  40, and 60 km for all channels.

## Numerical and B1 gates

- Prove vertical optical depth analytically and with the ordinary integrator.
  Then prove slant and near-tangent paths, splitting at the 10, 25, and 40 km
  profile boundaries if the current fixed intervals do not converge.
- Preserve the existing 17-condition no-ozone B1 result as the exact
  compatibility control.
- Ozone-on requires a newly generated, separately identified Bruneton reference
  with the same ozone table/profile and otherwise identical B1 atmosphere,
  source, geometry, spectrum, and numerical controls. Scoring ozone-on against
  the existing no-ozone table is diagnostic only.
- Run all 17 conditions, physical spectral RMSE, per-condition RMSE, and the
  complete standard B1 figure inventory. Accepting that execution as evidence
  does not accept ozone as the default: an adoption accuracy gate belongs to a
  separately generated, physically matched ozone-on reference and twilight
  convergence qualification.
