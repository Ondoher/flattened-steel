# Shared Runtime Qualification

Status: P7 qualification accepted for bounded discrete time selection on the
declared target. Production selection remains dense until P8 publication.
This document owns the combined release
evidence; the [plan](distant-sun-cache-optimization-plan.md) owns completion.

## Immutable Numerical Parent

Reuse the [P2 generated package](shared-generation-qualification.md), package
identity `7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99`.
All 109 dense controls reconstructed exactly. The complete set is 505,724,079
bytes and generation took 286,678.8677 ms. Numerical inputs and generated data
have not changed; repeating generation would add no evidence.

## Combined Runtime Evidence

Run roots below are relative to
`tmp/production-algorithm32/distant-sun-shared-block-cache/qualification/`.
Every completed run and its artifacts remain immutable, including failed runs.
The proof source is
`scripts/algorithm32/solar-zenith-cache/qualify-shared-runtime.js`.

| Execution | Run | Result SHA-256 |
| --- | --- | --- |
| Exact GPU inventory, lifecycle, and rendered controls | `2026-09-10T17-29-21-002Z-a5f1df32-d229-4123-af35-8f552873ed80` | `052fce78337e92214a3a92971170d0f892fc5d41c19eb2f9628f3f7f2772f9e1` |
| Matched native-4K candidate/control timing | `2026-09-10T17-33-20-541Z-1b3dc7fa-1742-4f6a-9ae4-8a02974ed44f` | `b70580e66dd582fa0ef17d8f70d64a12e5ec58f56133f474ce2df2388b318f97` |
| Native-4K forward/reverse motion and forced misses | `2026-09-10T17-45-31-999Z-53839897-a4a0-4470-be0a-4406434ab11b` | `cd543fc41402d0d3f553bca8883ba2bbc288354e5dfea63fc8a2532c7b3bdc6f` |
| Separate trace-derived 4K recording and HTML replay | `2026-09-10T17-47-44-313Z-8da4ab64-2c10-406f-9ca6-eed3677ff666` | `42274b980e5b874f81c131370fb2e4f318a03bbc20e62e11d81f869eb9761e4d` |
| Transition GPU queries and receiver-stage timings | `2026-09-10T17-49-52-627Z-bfe7aac5-1303-4dd4-8a5a-43b9b379b1a4` | `6b9837f7f3c8c66a83a7ac169e3eff27d75e5f2c35b35e616366b513630e644b` |
| Target-qualified dual-atlas large jumps | `2026-09-10T17-56-08-356Z-13bed6dc-dc95-4125-9b7b-246293a7912f` | `4544d8f0f881d9f32208adab945858b614cef22ee80b2ded0eb078ec4f2e5dce` |
| Exact rendered controls after program retention | `2026-09-10T18-07-56-408Z-0ac73c68-a45a-4f2a-a941-216468912061` | `e2cbb591998d9f9db7c12fbbac7790f0ba1534581dafd53f955535f3ddd22e9e` |
| Final 4K forward/reverse timing | `2026-09-10T18-12-28-973Z-133f0408-6f89-4eaa-9d31-d2080e1be167` | `fc8f744b417dcbb15b52f9166d3c07a15722267a6ab1664e1c2091d59a84125c` |
| Final ordered trace-faithful replay | `2026-09-10T18-15-22-618Z-3ee09837-328d-4708-8100-762d73be8bf6` | `d7160aa4e32ca16d07ca8a9d7c3667029e5dbf9c811166ba91d54ababe21c067` |
| Final restoration and disposal with strict browser-error acceptance | `2026-09-10T18-31-41-446Z-3693335a-f8b1-4761-9312-9c694a9b6008` | `6fc31258f574f626b2860b7116775dc5c51f7b9239254dc1f0c955318b630aac` |

The correctness run performed 158,976 exact Float32 component-bit comparisons
across every one of the 89 blocks, using dense-control row reads independently
of the production packetizer. It traversed all 109 GPU scene manifests. First
and last populated rows, partial-block padding, all 15 channels, every RGBA
component, six faces, corners, edge centers, and face centers were covered.
The [P5 metadata proof](shared-residency-verification.md) and
[P6 shader proof](shared-runtime-verification.md) supply complete ledger,
sentinel, shader-addressing, and final-bin checks.

All 220 observed physical application frames had coherent cache, atmospheric
source, geometry, and endpoint receiver-light identities. Actual supersession,
unqualified large-jump preservation, dark release, and context loss/restoration
preserved visible state. Review found old-context disposal errors in that older
run; its cleanup is not final lifecycle authority. The final dedicated lifecycle
run passes supersession, held misses, darkness, restoration, and application
disposal with all console errors and WebGL invalid-operation warnings rejected.
Scene geometry, composer targets, and shadow maps release their old GPU state
while the context is lost. Restoration retains the latest observation, including illuminated
ordinal 108 for input 107.75 degrees. Explicit darkness begins at input 108.

Complete 1280x720 RGBA8 frames at 90 and 91 degrees differed from the dense
control by at most one display quantization step. Of 3,686,400 channel bytes,
1,268 and 753 respectively differed. Exact spectral packet data has zero bit
tolerance; the display comparison does not weaken that requirement.

## Target And Performance Boundary

The observed target is NVIDIA RTX 2060, Chrome 153, ANGLE D3D11, Three r180,
device-pixel ratio 1. Both renderers retain Native15, N4, and production Q30.
After five warm-up observations, native 3840x2160 mean GPU time was:

| Field of view | Shared | Dense control |
| --- | --- | --- |
| 78 degrees | 91.59 ms | 95.04 ms |
| 55 degrees | 91.88 ms | 99.39 ms |

The later matched run after receiver-program retention measured about 88.15 ms
shared versus 86.08/86.28 ms dense, with mean frame walls near 89–91 ms. Across
both matched runs the paths have comparable stable-frame cost, approximately
10–11 FPS at Q30; these short runs do not establish a durable speed advantage.
They do not reproduce the experiment's Q10 22–23 FPS claim.
The known gray-horizon appearance remains outside this cache-format change.

Prepared metadata usually takes 10–20 ms. Retaining receiver-light sampling and
reduction programs lowered measured warm physical time changes to a 482.90 ms
mean at native 4K, with additional delay for new predicted blocks. The old
coherent scene remains visible until the complete new light/cache state is
ready. This supports bounded discrete time changes; it does not establish
smooth continuously changing time. The final replay preserves each measured
hold in its original forward/reverse order. Earlier recordings and failed
retention experiments remain evidence, not final playback authority.

The final bounded trace observed 429,981,696 atlas bytes, 322,486,272 explicitly
pinned host bytes, and 398,751,608 JavaScript heap bytes, with 110 coherent
rendered frames and no mismatch. The separate large-jump run observed a maximum
859,963,392 atlas bytes, 627,056,640 pinned host bytes, and 719,492,389 heap bytes;
all 634 observed frames remained coherent. The two-atlas qualification applies
only to this declared RTX 2060/Chrome 153/ANGLE D3D11 target. JavaScript heap and
explicit cache bytes do not measure total browser/native/driver memory.

## Integration And Remaining Gates

The complete Algorithm32 suite passed 641 specs. The basic Flat32 integration
suite passed 35 specs with its full-cache case intentionally excluded; the
independent real application proof above supplies shared-cache integration.
The full Three/GPU suite passed 31 of 32 specs. Its sole failure is the sealed
local-Sun indexed-R32F fixture hash: expected `656d29e15a67876f6aaff12cec6c5d3c77bd4068f7d629ade76ee12f1ac59325`,
actual `59ee2ac971d0e1cac07ceb14cb47f5daa8badb07640ede2981e276f264002119`.
The actual fixture is byte-identical to commit `8402f146` before promotion.
Its numerical comparisons passed. Preserve the sealed fixture and disclose the
pre-existing integrity mismatch rather than changing its evidence.

P7 found and fixed integer-sampler precision in the real application shader,
time-control metadata preventing stable mode reuse, and context restoration
using an obsolete source/observation identity. Receiver program retention
initially exposed stale uniform objects; the corrected sampler preserves the
existing uniform objects and reproduces the original exact frame hashes.
Focused final checks passed eight Algorithm32 specs, ten Flat32 specs, two
server specs, Algorithm32 and shared-runtime type checking, and repository
formatting. The affected Flat32 test bundle was rebuilt successfully.

Global reviewer calibration was independently renewed: 32 obligations, all 14
seeded violations detected, four compliant controls, and 68 helper tests passed.
The complete deferred P3–P7 review inventory expands to 31,927 obligations
across four lanes and 82 paths; primary review plus independent audit would
require 63,854 judgments. At the effort reevaluation break the owner explicitly
approved consolidated final correctness/lifecycle/security reviews plus
rollout verification, omitting that ledger. No full standards-compliance result
will be claimed. Consolidated correctness/lifecycle and security/integrity
reviews are complete. The evidence review's cleanup finding is fixed and its
focused follow-up approved. A concurrent first-use reducer ownership guard is
covered by a passing GPU test: two simultaneous reductions and later reuse link
one GL program, preserve the numerical result, and leave zero programs after
owner disposal. The router bridge is the remaining P8 rollout requirement.

The performance review accepts the measured bounded discrete-selection behavior
with coherent holds. Continuous time animation at the experiment's Q10 cadence
is unqualified; preserving the production design's Q30 arithmetic takes
precedence over claiming that cadence. This is an explicit performance-boundary
decision under the owner's authorization to resolve remaining questions, and
does not relax any data, numerical, or lifecycle gate. Larger residency remains
disabled unless the observed device/browser/backend matches its qualified target.
P8 publication, observation, and bridge cleanup remain pending.
