# Local-Sun Held Source-Amplitude Qualification

This bounded P1 slice qualifies source strength for the frozen compact-domain
control. The [port status](local-sun-cache-promotion-status.md) owns completion
and next work. Scattering fields, transport, GPU, other profiles and application
selection retain their separate gates.

## Independent Authority

The production-owned
[held-strength fixture](../../../../src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-held-amplitude-controls.json)
is derived by offline `LocalSunAmplitudeControls`. Its producer imports only
approved literal Native15 calibration data, authenticated by byte hash; it imports
no executable production source, shell or spectral scaling algorithm. The existing
P0 fixture supplies authenticated geometry and its complete original derivation
record. Both parent identities and the new producer identity are retained.
No historical fixture or experiment run is changed.

For h=4,828,032 m, H=100,000 m and R=33,378,000 m, dmin=h-H and dmax²=h²+R².
With t=(i+0.5)/2048 for i=0..2047:

```text
a_i = 4,800,000² × [(1-t)/dmin² + t/dmax²]
```

Equal spacing of inverse-square boundary values makes this affine midpoint exactly
the arithmetic mean of adjacent endpoint scales. The production routine instead
evaluates falloff at its two computed distance endpoints and averages them.
Expected values do not come from that routine or observed candidate output.
This proves analytic algorithm agreement, without an absolute physical-error claim.

Source radius is 25,749.504 m, reference incident scale is 1 and inverse-square
falloff is enabled. All admitted distances exceed the source radius; its clamp
is inactive. Changed emission, radius clipping, disabled falloff, intersecting
sources and different geometries are not qualified by this control.

## Source And Spectral Meaning

Held scales are dimensionless. Each expected Native15 channel is the authenticated
reference irradiance density times a_i, retaining 15 contiguous wavelength-bin
averages and W m^-2 nm^-1 units. There is no bandwidth multiplication, total-power
conversion, tint or radius gain. This is the approved shared source calibration.

`LocalSunConstructionLightSource` holds primary-J1 construction amplitude.
Physical `LocalSunLightSource` remains continuous for direct-light sampling; the
proof independently compares that output at the same queries. Scattering
recurrence and complete direct-L1 transport remain separate P1 gates.
The construction adapter validates its collaborator's unknown sample metadata
before consuming it: object shape, supported distance units, finite normalized
nonnegative distance and finite nonnegative incident scale. Invalid data fails
explicitly; accepted kilometre distances normalize to metres. This ingress fix
does not change the held-amplitude equation or the continuous source calculation.

## Comparison Boundary

The vector, input identities and allowances were frozen before this slice's
candidate scoring. Earlier P1 code already computed held values but explicitly
left them unqualified; those outputs did not determine this authority or its limits.
Each comparison requires:

```text
absolute error <= absolute allowance + 1e-12 × abs(expected)
```

Absolute allowances are 1e-14 for dimensionless scales and 1e-14 W m^-2 nm^-1
for irradiance density. These conservative binary64 algebra allowances were
selected before scoring and are distinct from future CPU/GPU quantity gates.
Nonfinite or negative source values fail.

The proof checks every held band, exact candidate lower boundary, independently
frozen P0 midpoint and the final
outer endpoint. Construction and continuous samples retain quantity, units,
channel identities/centers/widths and bin semantics. Modifying a returned scale
copy must not mutate its owner. Support rejection remains covered by the previous
compact-domain proof.

```text
node scripts/algorithm32/local-sun-cache/source-amplitude/LocalSunAmplitudeControls.js
node scripts/algorithm32/local-sun-cache/source-amplitude/LocalSunAmplitudeProof.js
npx --no-install tsc -p scripts/algorithm32/local-sun-cache/source-amplitude/jsconfig.json
```

Controls `--derive` explicitly authors a new fixture and rejects an existing one.
Proof `--out <new-plan-run-directory>` creates new ignored evidence only below
`tmp/production-local-sun-cache-promotion/runs/`. It copies both authorities,
records implementation/tool/configuration identities and writes a terminal
artifact-hash manifest. Existing runs are rejected; failed partial writes remain
inspectable without a passed manifest. Paths derive from maintained repository
identity and reject links rather than depending on the working directory.

The selected comparison is
[00006-held-amplitude](../../../../tmp/production-local-sun-cache-promotion/runs/00006-held-amplitude/comparison.json).
Its completion requires the matching primary/audit receipt linked by status;
numerical proof success alone does not establish standards-review completion.
