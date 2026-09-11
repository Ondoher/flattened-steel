# Current Point-Local Cache Builder Evaluation

Scope: read-only evaluation requested by the owner after locating the unrelated
B1 adapter defect. No optimization implementation or new generation is included.
Accepted Color Reset run 65 remains the correctness authority for later B1 work.

## Actual Starting Point

The entry is `npm run build:algorithm32:distant-sun-cache:shared`:
`generate-shared-cache.js` -> `DistantSunSharedCacheGenerator` -> inventory,
one browser/context, `DistantSunSceneCacheGpuCompiler`, block staging, packaging,
and verification. These files live under
`scripts/algorithm32/solar-zenith-cache/`.

The inventory explicitly selects `scene-cache-receiver-local-v1` and retains
the altitude/local-Sun-angle domain. All compatible scenes share one common
recurrence per wavelength; their cache contents are indexed subsets of its
result inventory. Changing the requested time changes the required scene ledger,
not the physical common-field calculation. Different spectra, atmosphere,
ground, geometry, quadrature, or algorithm versions require compatible work
identities before any sharing claim.

The production control set has 109 scenes, 70,756 requested coordinate rows,
5,494 unique output rows, and 89 stored blocks. This sharing already exists.
The GPU recurrence still evaluates the full 48 x 180 altitude/zenith field,
then extracts the requested union. Output deduplication is not a proof that
intermediate calculations are minimal.

## Measured Baseline

The [qualified production run](../../../production-algorithm32/caches/shared-generation-qualification.md)
generated all 109 scenes in **286.679 seconds**, including final qualification.
Its recorded phases are:

| Phase | Seconds | Scope |
| --- | ---: | --- |
| Browser execution | 81.603 | Includes calculation, setup, readback, and delivery |
| Compression and metadata | 50.011 | Sequential block processing and exact codec round trips |
| Final verification | 149.145 | Persisted graph/blocks plus all original control payloads |
| Other work | 5.920 | Remainder of the complete measured run |

Inside the browser interval, recorded field passes total 19.880 seconds,
readback 1.808 seconds, and delivery 29.975 seconds. The remaining 29.940 seconds
includes setup, compilation, accumulation, probes, and other unseparated work;
it is **not** a measured shader-compilation duration. Verification spends 14.022
seconds authenticating blocks and about 135.122 seconds on the remaining work,
including 17.228 GB of exact control comparisons.

These are existing observations, not predicted optimized timings. Preserve
separate kernel, generation, and complete-qualification measurements.

## Opportunities In This Builder

| Priority | Opportunity | Evidence and proposed boundary |
| --- | --- | --- |
| First | Reusable stage programs and resources | The context is already retained, but each wavelength creates and deletes six programs and its textures. Supply changing spectral values as uniforms/buffers; retain programs by structural compatibility and pool exact-layout storage. Preserve local-angle coordinates and floating-point acceptance. |
| First | Fewer dispatches and waits | `drawField` issues one draw and `gl.finish()` for each of 180 zenith slices, across 120 field passes. Batch compatible slices with bounded work per dispatch and synchronize only where a dependency/readback requires it. Shader row coordinates already derive from `gl_FragCoord.y`. |
| First arithmetic candidate | Shared angular phase tables | On the receiver-local branch, incoming/outgoing phase directions are the stored local vectors. Rayleigh phase depends only on their dot product; Mie phase additionally depends on `g`. J2/J3/J4 repeat these same pairs across positions, zeniths, wavelengths, and orders. A 4,374 x 68 table with two Float32 components is about 2.38 MB. Preserve the exact GPU formula and validate effects of materialization/rounding before accepting it. |
| Next | Shared transport geometry and weights | L1/L2/L3 repeatedly find ray branches and sample positions; L2/L3 also repeat the same medium/transmittance calculation for a given wavelength. Reuse geometry across compatible wavelengths and attenuation weights across orders, while keeping spectral attenuation wavelength-dependent. Plan bounded tiles because a complete path/stencil inventory can be large. |
| Next | Batched transfer, staging, and verification I/O | Staging writes one 16,232-byte unique row at a time. Verification separately reads actual/expected rows for every scene/channel, revisiting shared rows. Coalesce contiguous accesses and cache bounded blocks while still checking every required control byte and reconstructed hash. This targets measured wall time without weakening qualification. |
| Later | Bounded compression pipeline | Compression/metadata takes 50 seconds. Independent block encoding can use bounded workers or overlap with completed staging, with deterministic output and retained round-trip checks. Extra buffers must fit the memory budget. |
| Later research | Demand-driven intermediate work | The 5,494 requested rows do not imply that other recurrence rows are unnecessary. Trace the transitive interpolation/ray/scattering dependencies before pruning anything. Never remove the local Sun-angle dimension to reduce work. |

The existing factoring of direct-source transmittance into `direct-base`, and
the shared scatter/transport programs across scattering orders within a
wavelength, are also baseline behavior rather than new savings.

## Input-Driven Generalization

The qualified wrapper is intentionally tied to its control fixture: 109 scenes,
5,494 union rows, 89 blocks, 15 wavelengths, and canonical ordering are asserted
or embedded across inventory, browser, staging, packaging, and verification.
The low-level compiler already accepts build requests and scene-cache requests.

Separate the general builder from the fixed qualification fixture. Accept a
scene list and complete physical/numerical configuration, derive channel counts,
row shapes and package references, and retain the known fixture's exact checks
in its qualification path. Scene count has no baked-in limit; hardware residency
and dispatch sizes have explicit bounds. Group by compatible physical inputs,
compute one union per group, and persist/reload unique results without recomputing.
Later B1 support must adapt this point-local path, not reuse the old B1 adapter.

## Small Validation Gates

1. Establish one end-to-end path through this current builder with a tiny
   representative request set, including daylight and twilight/local-angle
   coverage. Explicitly assert the receiver-local contract and varying local
   zenith lookup. Reuse authenticated application controls.
2. Measure resource counts and separate compilation, calculation, readback,
   delivery, packaging, and verification. No new full baseline run is needed
   until a claim requires a comparable measurement absent from existing data.
3. Try one mechanism at a time. Two wavelengths are sufficient for program
   reuse; a repeated/overlapping scene request must add no duplicate common-field
   calculation. Keep the required full recurrence support even for small outputs.
4. For the phase table or transport reuse, compare exact results and a bounded
   intermediate probe against the unchanged implementation. Existing final
   caches are output oracles, not automatically intermediate oracles.
5. Continue only after exactness and a measured phase-time improvement pass.
   Report the total-time effect separately. Widen to the full application set
   once for the selected candidate, and handle B1 profile qualification afterward.

The previous application resource-reuse evidence may inform these choices;
the 17-scene source-aligned B1 timing cannot characterize this builder.
