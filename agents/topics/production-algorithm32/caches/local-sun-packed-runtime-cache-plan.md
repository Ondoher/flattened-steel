# Local Sun Packed Runtime Cache Architecture and Plan

Status: implementation delivered for qualification on 2026-10-14. The owner
authorized independent execution after comparing local and distant cache lookups.
Completion requires the matching execution and review evidence linked below.

## Goal and scope

Use the distant cache's four-float spectral packing and shared lookup setup to
reduce local-Sun runtime lookup cost. Each view-ray sample continues to read
cached cumulative scattering density. Preserve the local cache's compact
geometry, angular support, spectral restoration, FP32 precision, physical
equations and selected view integration policy.

This is a runtime representation change. The
[current adoption](local-sun-flat32-adoption.md) owns application selection.
Existing experimental and production evidence remains immutable.

## Architecture

Keep the scalar construction graph. Once its cumulative density field is
complete, run a GPU packing pass to produce a renderer-owned `RGBA32F` runtime
texture array. Pack spectral channels 0–3, 4–7, 8–11 and 12–14 into four groups;
the final unused component is zero. RGBA components are four float storage
slots, with no display-color or opacity meaning.

The selected layout is direction × compact position × four spectral
group layers. It preserves existing direction addresses and explicit
interpolation without importing the distant cache's solar-angle dimension or
packet residency machinery. For the current profile it is 4374 × 1049 × 4.
Actual backend allocation and device capability failures remain explicit errors.

At each ray sample, compute the live-to-canonical transform, spatial stencil,
ordinary and axis angular stencils, and shared geometric quantities once.
Fetch and interpolate four spectral values together. Preserve the existing
per-channel normalization/restoration equation and its per-spatial-tap factors;
store those factors in a 4 × 1049 RGBA32F metadata texture. Packing
copies physical density values; it does not bake in a different interpolation
policy or enable hardware filtering across flattened direction addresses.

The backend owns GPU allocation, packing execution and opaque bindings. The
cache owns the packed representation and its identity. Existing frame leases
and atomic publication expose only a complete packed cache. Conversion stays
on the GPU and occurs once per constructed cache, rather than per frame.

All recurrence consumers finish before the completed cache is wrapped. Release
the scalar artifact after successful packing and auxiliary upload; frame reuse
borrows the packed representation. Explicit diagnostic readback unpacks that
representation into logical wavelength-major scalars. Production conversion and
rendering perform no CPU readback. Failed packing, cancellation and context loss preserve the previously
published frame and release candidate resources.

## Expected cost

For four spatial taps and four angular taps, density fetch instructions fall
from up to 15 × 4 × 4 = 240 scalar reads to 4 × 4 × 4 = 64 vector reads per
sample. This excludes metadata/factor reads and is not a frame-rate prediction.
Sixteen stored components for fifteen channels add about 6.7% density payload
before padding. Report conversion peak and retained allocations separately;
do not introduce frontend cache-size admission checks or viewport-based limits.

## Implementation plan

1. **Measure and freeze contracts.** Wire the existing performance timer through
   the compact frame preparer. Capture GPU pass time at a fixed view and
   2560 × 1440, independently from cache setup time. Define packing addresses,
   padding, versioned representation identity, ownership and scalar lifetime.
2. **Add GPU packing.** Extend the renderer backend with a focused FP32 vector
   output/conversion capability; its current construction-field contract is
   scalar `R32F`. Pack the completed density and required factors without a
   production CPU readback or a rewrite of the construction graph.
3. **Implement vector lookup.** Share geometry setup across spectral groups,
   preserve axis handling and restoration weights, then connect the packed
   cache through existing bindings, leases, publication and disposal.
4. **Prove equivalence and lifecycle.** Compare packed components and lookup
   results with the scalar path at ordinary samples, seams, axis nodes,
   altitude/radial boundaries and transformed reused frames. Use existing
   numerical tolerances; check cancellation, allocation failure, context
   restoration and cleanup. Exercise applicable N1/N2/N4 cache paths without
   expanding higher-order application qualification.
5. **Measure and adopt.** Compare steady-state GPU pass timings under matched
   hardware, view, resolution and warmed-up conditions. Record setup cost and
   retained/peak cache bytes. Complete focused checks and one coherent mapped
   primary review plus independent audit before reporting implementation complete.

Success requires equivalent spectral output, correct ownership and a measured
runtime improvement. If improvement is insufficient, profile the remaining
lookup and frame costs before changing numerical sampling or cache geometry.

## Execution and completion evidence

The [execution summary](../../../../.codex-tmp/local-sun-packed-runtime/summary.md)
owns exact commands, source identities, tests, timings, decisions and remaining
limitations. Initial matched RTX 2060 measurements at 2560 × 1440 reduced the
mean atmosphere-pass GPU time from 704.896 ms to 151.772 ms across eight samples
per path. This establishes an improvement in the measured pass, not smooth
animation or a general hardware guarantee. Final measurements are recorded in
the summary. Construction fields and numerical selections retain their original
identities; the runtime representation has its own `runtime-rgba32f-groups-v1`
identity.

The completed packed density occupies 293,652,864 bytes, with 167,128 bytes of
runtime metadata. Scalar-result plus packed-target overlap is 568,952,424 bytes,
excluding metadata, prior frames and driver overhead. Executor diagnostics refer
to the earlier construction stage and do not describe current retained storage.
These are logical payloads, not available-VRAM measurements or frontend quotas.

Only the matching [CLEAN primary and independent audit receipt](../../../../.codex-tmp/review-standards/session-0bVWiv/validation.json)
completes the implementation gate. That unit also covers the preceding frontend
memory-policy correction against its current collaborators; the unfinished
memory-only review and earlier completed adoption retain their original scopes.

## Implementation references

- [Distant packed lookup](../../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js)
  and [selected cubic lookup](../../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js).
- [Local runtime binding and lookup](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCache.js)
  and [scalar graph and reconstruction](../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactGpuPlan.js).
- [Renderer backend](../../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js)
  and [local frame preparation](../../../../src/flat32/LocalSunFramePreparer.js).
