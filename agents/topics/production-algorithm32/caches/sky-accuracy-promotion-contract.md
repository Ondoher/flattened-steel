# Sky accuracy production transfer contract

Selected method: Corrected60 + Sun-focused outgoing k=.35. The
[plan](sky-accuracy-promotion-plan.md) owns milestones and gates; the
[status](sky-accuracy-promotion-status.md) owns execution and qualification.

## Executable policy and representation

`DistantSunScatteringAccuracy` owns the explicit construction/mapping selection.
Omission retains `legacy`; `corrected60` is the matched correction-only control;
`corrected60-sun035` is the selected candidate. Corrected methods use 60 transport
intervals per segment. Source transmittance20, incoming F68, physical atmosphere,
order ceiling N4 and final-view integration retain their own existing owners.

The normalized higher-order scatter result is exactly the retained operation:
`sum - mieSum + mieSum / max(mieMass, 1e-12)`, where `sum` is the original complete
angular sum, `mieSum` its incident-radiance-weighted Mie contribution, and
`mieMass` the sampled Mie phase times incoming solid-angle weights. This applies
to higher-order J construction, not analytic direct L1 or physical phase/SSA.

The outgoing map preserves all4374 slots and their existing seam aliases:
`tan(theta_physical/2)=.35*tan(theta_grid/2)`. Construction uses the forward
map; recurrence and final lookup use its inverse about each actual solar row's
Sun axis before combining taps. Receiver-local rows use their tabulated solar
zenith; source-aligned coordinates use their local +X source axis. The Sun and
anti-Sun endpoints remain finite. Incoming directions/weights are unchanged;
there is no outgoing quadrature Jacobian.

## Named production owners

| Responsibility | Implementation owner | Required transfer |
| --- | --- | --- |
| Executable policy and shared CPU/GLSL map | `src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js` | Accept explicit methods; retain legacy default; own map equations |
| Native15/profile construction inputs and numerical hashes | `scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js`, `DistantSunPointLocalProfileCompilerInputs.js` | Carry explicit policy and effective intervals into authenticated inputs |
| Complete J/L recurrence | `scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js` | Forward J nodes, inverse every J lookup, exact higher-order normalization; preserve direct L1 |
| Browser module/control delivery and implementation provenance | `DistantSunPointLocalCacheCompilerHost.js`, `DistantSunPointLocalCacheCompilerBrowser.js`, `DistantSunSharedCacheGenerator.js` under the same compiler folder | Serve only authenticated allowlisted source; keep run capability independent of module placement; fingerprint numerical dependencies |
| Packaged binary64 Q30 evaluation | `scripts/algorithm32/solar-zenith-cache/DistantSunBrunetonView.js` | Resolve a distinct inverse map at every solar interpolation tap |
| Shared serialization and ingress | `DistantSunSharedCacheGenerationPackage.js` in the compiler folder; `DistantSunSharedCacheFormat.js` in the runtime cache folder | New configuration v2 carries explicit corrected policy; immutable v1 remains legacy |
| Shared controller and packet lookup | `DistantSunSharedCacheController.js`, `DistantSunSharedCache.js`, `DistantSunSharedCacheCubicLookup.js` in the runtime cache folder | Reject package/lookup mismatch; preserve policy through complete publications and darkness; use per-row linear/cubic coordinates |
| Dense runtime ingress and lookup | `DistantSunSceneCacheManifest.js`, `DistantSunSceneCache.js` in the runtime cache folder | Runtime manifest v3 carries corrected policy; existing v2 remains legacy; reject mismatched lookup |
| Application selection | `src/flat32/SharedDistantCacheAssets.js` and its existing selection contract | Pass explicit expected policy; change no deployed default during implementation |
| Server selection | `server/flat32/features/shared-cache/DistantSunSharedCachePackageService.js` | Require the selected package and lookup policy to agree before serving it; omission retains legacy |
| Publication selection | `scripts/algorithm32/solar-zenith-cache/publish-shared-runtime.js` | Accept explicit `--scattering-accuracy`; authenticate package/policy agreement before copying, and verify the same policy after publication; omission stays legacy |
| Matched Toronto qualification input | `scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheAerosolOptics.js` | Accept explicit per-channel SSA and normalized phase tables; preserve canonical fallback, aerosol extinction, density and amount |

Qualification must exercise real packaged data, exact seams, row-specific cubic
support, legacy/candidate rejection in both directions, finite/nonnegative fields,
CPU/GPU agreement and lifecycle behavior. Package dimensions alone never select
the mapping. Numerical identities cover the executable policy; descriptive
provenance is not an algorithm selector.

## Evidence and review boundary

The suspension record pins accepted H61/H63 evidence. It remains read-only input,
not an experimental execution dependency. Actual Native51/Direct40 paper replay
and the Native48/Native15 production bridge are separate qualification claims.
Later reconstruction branches, local-Sun mapping, atmosphere composition and
display changes are outside this transfer.

The production context and standards were loaded and the current baseline was
captured before source edits. Calibration readiness still reports stale; this
prevents starting standards reviewers or claiming a compliant handoff. It does
not by itself prohibit primary implementation/self-verification. Required
production review remains an open P3/completion gate. No external governance
source or calibration record is edited as part of this transfer.
