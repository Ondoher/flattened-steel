# Stage 9.6 Containment Inventory

Focus: Cache construction, storage, reconstruction, loading, and optimization.

Related owners: [qualification](../qualification/stage-9.6-containment-inventory.md).

## Current Execution Boundary

The current source-owned CPU path has these mechanics:

```text
N1: J1(shell-held), Jthrough1 = J1

N2: J1(shell-held), L1(continuous), J2 = scatter(L1),
    Jthrough2 = J1 + J2

N4: N2, L2 = transport(J2), J3 = scatter(L2),
    Jthrough3 = Jthrough2 + J3,
    L3 = transport(J3), J4 = scatter(L3),
    Jthrough4 = Jthrough3 + J4
```

`LocalSunLightSource` derives mandatory source-paired shell facts internally.
Its caller configuration no longer selects a shell count, identity, or
continuous-versus-shell strategy. The source retains its shell-fact owner in
a private instance property outside the public normalized configuration
snapshot. The public CPU request also has no construction-domain injection;
`LocalSunLightSource.buildCpuScatteringCache()` always derives the selected
paired-Fibonacci-34 production domain. Bounded domain injection remains only
on the internal comparison/build seam.

`local-sun-primary-scattering-density.js` receives the construction-only
shell-held light adapter for `J1`.
`local-sun-primary-radiance.js` constructs `L1` from the continuous source
calculator and does not read shell facts or stored `J1`.
`local-sun-scattering-density-transport.js` rejects every input except pure
`J2` or pure `J3`. Generic scatter and cumulative addition retain their
existing production owners.

The independent Star-only gold fixture at the retired path
`src/algorithm32/light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-gold.json`
has identity
`algorithm32-star-local-sun-shell-cpu-gold-v3-sha256:bb3a1f871a375e53d9c180899003041afc4dda93cbe3fe69e62080481bd8d0c9`
and file SHA-256
`61532368d7efa2d4a60fc932a901097a8e583ccb0eb3593eb9b26d29c2674985`.
It was generated without importing or executing a production module,
authenticates its 24-file capture closure, and executes the bounded z2/rho2,
paired-Fibonacci-34, W3, native-15, omitted-ground N1, N2, and N4 requests
independently.

The authenticated production comparison report at the retired path
`src/algorithm32/light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-comparison-report.json`
has identity
`algorithm32-star-local-sun-shell-cpu-comparison-report-v3-sha256:358f1abbbc910774be040baae85d240c2d2d0ca14c9eb4f51bb96af5ceaddd5a`,
file SHA-256
`d5fa37c70729eec944f59a7802f51b3a66dfb875969f0f1d076ab9ab0ea2c399`,
and state `passed`. It authenticates the frozen sources and complete
production inputs and covers the three matching requests with 40,560 field
scalar comparisons, 26,900 core exact leaves, 224 exact input-authentication
leaves, 29 behavioral edge records, 648 resident exact-node/direction
samples, and 9,720 resident sampled scalars, all with zero mismatches. The
compared facts, fields, shared prefixes, cumulative identities, public CPU
entrypoint, zero query-time shell scaling, and predeclared tolerances all
pass. This closes Stage 9.6.2a only for the declared omitted-ground CPU
boundary.

No independent physical reflective local-ground output has been established
for this changed flat/local recurrence. Omitted ground does not validate
explicit-zero or nonzero reflective ground. CPU/GPU agreement and the
spherical Stage 8 report cannot close that evidence gap. The user has deferred
only this independent Star evidence work. Reflective local-ground behavior
remains required in production CPU/GPU implementation and tests; its claim
remains validation-pending until the evidence work is resumed.

The GPU construction boundary now has these mechanics and evidence:

- `LocalSunCacheSource` binds the deterministically converted 2,049-scalar
  R32 shell-boundary payload only in `primary-j1`; continuous `direct-l1`,
  scatter, stored transport, accumulation, ground work, and query-time code
  contain no shell binding;
- `local-sun-cache-plan.js` emits exact N1/N2/N4 direct-`L1` graphs and has no
  stored `J1 -> L1` pass;
- N1 and N2 create no packed transport payload, while N4 creates one logical
  `CacheTransportData` payload and reuses its source and coefficient
  `CacheData` values in both later transport passes;
- `src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json` is the sole
  v3 policy and is pinned to the unchanged v3 CPU gold and refreshed passing
  comparison report;
- the focused Chrome 150 lane passes `3/3` with 40,560
  omitted-ground comparisons across N1/N2/N4, including 22,320 N4 scalars,
  plus 3,300 explicit-zero and 3,300 nonzero reflective CPU/GPU probes, all
  with zero mismatches;
- exact shared prefixes, the 8,196-byte boundary upload, no CPU `J`/`L`
  upload, readback requests no larger than 4,096 scalars, zero WebGL errors,
  and a 5,224.8 ms slowest bounded build pass; and
- `LocalSunLightSource.createCacheController()` publishes through the verified
  source-owned controller lifecycle.

Run `000335` supplies GPU method, tolerance, and resource authority only. Its
4/4 path controls do not supply scalar gold for production's 15/15 controls.
