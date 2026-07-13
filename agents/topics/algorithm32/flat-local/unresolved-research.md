# Flat/Local Cache Promotion Work

Status: selected-domain evidence owner. Stage 9 is complete and accepted
within the measured control, configuration, angular, browser-domain, and
hardware qualification boundaries below. V4 owns selection and v5 verifies
the promoted production default.

The existing configured flat geometry, Star-backed finite-distance point Sun,
and completed ground recurrence are selected behavior. The abandoned
flat/local experiment established feasibility but did not select the
production cache. The selected controls below come from production-owner
studies and explicit project decisions, not inheritance from that harness.

## Selected Position Domain

The selected domain is
`profile-z19-rho15-add-50km-4p5mm`. It uses clamped bilinear interpolation
over 285 positions. Production stores exact fractions and scales them by the
configured atmosphere top and cache radial maximum:

```text
z fractions:
0, 1/400, 1/200, 1/100, 3/200, 3/100, 1/20, 7/100, 1/10,
7/50, 1/5, 1/4, 3/8, 1/2, 5/8, 3/4, 7/8, 99/100, 1

rho fractions:
0, 1/96, 1/48, 1/24, 1/12, 1/8, 1/4, 3/8, 1/2, 5/8,
3/4, 7/8, 15/16, 47/48, 1
```

For the qualified 100,000 m by 4,800,000 m diagnostic configuration these
produce:

```text
z meters:
0, 250, 500, 1000, 1500, 3000, 5000, 7000, 10000, 14000,
20000, 25000, 37500, 50000, 62500, 75000, 87500, 99000, 100000

rho meters:
0, 50000, 100000, 200000, 400000, 600000, 1200000, 1800000,
2400000, 3000000, 3600000, 4200000, 4500000, 4700000, 4800000
```

The v4 report selected this profile under the unchanged spatial limits of
`0.1` maximum normalized L-infinity and `0.02` maximum p95 normalized RMS.
The winning maxima are `0.00502984504201558` and
`0.001092614831589967`. Every compared `J1`, `J2`, `J3`, `J4`, and
`Jthrough4` field passes and contains no negative or non-finite scalar.

Its logical resident cumulative field is `74,795,400` bytes against the
`83,886,080`-byte ceiling. V4 estimated a `403,628,992`-byte peak tracked
upper bound. V5 measures `389,675,392` logical peak-tracked bytes against the
`469,762,048`-byte ceiling. These are owner-reported logical resource facts;
renderer/driver overhead and supported-hardware timing are not qualified.

The selected fractions make other configured bounds executable but do not
extend the convergence claim beyond the measured 100 km/4.8 Mm case.
The observer dome remains final-view-only and does not truncate reusable cache
construction.

## Convergence Evidence

The current and preserved reports are:

| Report                                                                                                 |   Bytes | SHA-256                                                            | Result                                                                                                                  |
| ------------------------------------------------------------------------------------------------------ | ------: | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v1-containing-lower.json`             |  38,475 | `6eab318246a66979245a57cea7138038fff15a8cfe31457ec162662d4da925ab` | rejected the containing-lower implementation and every bounded v1 candidate                                             |
| `archives/algorithm32-flat-local-cache-domain-convergence/failure-diagnostic-v1-containing-lower.json` |  41,607 | `6d1821867b083a4c4964b13797204246184da050c9dfddf3c53284a3386b9690` | attributed the dominant error to coarse spatial lookup and recurrence amplification; no point/direction wiring mismatch |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v2-bilinear-bounded.json`             |  40,207 | `ec49e9aaf3e5f38322097243b5ff4d3a259c4d718d7cf1530ccc13c052c6bf67` | rejected every 25-126-position bounded v2 candidate                                                                     |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v3-radial-attribution.json`           |  36,531 | `5b5650a98ff95b8f55e74cb0c48ed57053906cd8db2c8b957347928d9f04da93` | rejected the 171-285-position radial ladder and identified the withheld 50 km and 4.5 Mm radii                          |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-v4-observed-worst-nodes.json`         | 128,109 | `0e656ddd9034a1a2528935a025e1a88de8bcb3da66eef1fd4747f3619c33772e` | selected the combined 19-by-15 candidate under v4's predeclared spatial and resource gates                              |
| `archives/algorithm32-flat-local-cache-domain-convergence/report-post-promotion.json`                  |  37,114 | `4164791f97a67e9d8516c383ced28971f9fb1d9d064a6ab9611cd57097296e19` | verified the promoted default and retained the current production selection                                             |

`report.json` currently duplicates the v4 bytes for the ordinary runner
output. The versioned v1-v4 files are the durable evidence identities.

The resource ceilings did not remain constant across the evidence lineage.
V1's 8 MiB/31-position local cap was rejected as inconsistent with the
accepted spherical W27 cache, which already retains `12,597,120` bytes over
48 positions. V2 predeclared 32 MiB resident and 192 MiB peak tracked limits;
v3 predeclared 80 MiB and 448 MiB to test the bounded 285-position radial
ladder. V4 retained the v3 ceilings unchanged. Each revision and the prior
report it used for attribution were frozen before that revision's candidate
output was observed.

The studies execute production geometry, source, cache, transport, and
recurrence owners. They are not a separately rewritten correctness
implementation and do not claim continuous-field or scientific truth.

## Post-Promotion Verification

V5 contains only the already-selected 19-by-15 candidate and does not reopen
selection. It reproduces the v4 spatial maxima exactly, records current
production source hashes, realizes the expected physical node arrays through
the default production path, and decides
`retain-current-production-selection` with no production change required.

Actual selected-domain production facts are:

| Fact                            |                   Value |
| ------------------------------- | ----------------------: |
| positions                       |                     285 |
| outgoing directions             |             4,374 (W27) |
| packed transport queries        |                   9,690 |
| maximum taps per query          | 236 of the declared 256 |
| transport bytes                 |             164,652,480 |
| total packed-data bytes         |             164,707,792 |
| resident cumulative-field bytes |              74,795,400 |
| peak field bytes                |             224,967,600 |
| peak tracked logical bytes      |             389,675,392 |

Default-domain realization, spatial comparison, tap bound, resident limit,
and peak-tracked limit all pass. The qualification boundary still excludes
driver allocation, supported-hardware timing, and release performance.

## Retained Accuracy And Angular Limits

The project-selected source-transmittance and stored-field transport interval
counts remain 15. Their v4 15-versus-60 characterizations do not pass the
declared numerical limits:

| Study                       | Maximum normalized L-infinity |     p95 normalized RMS | Limit            |
| --------------------------- | ----------------------------: | ---------------------: | ---------------- |
| source transmittance `J1`   |          `0.1383037213124355` | `0.059926328718050564` | `0.02` / `0.005` |
| stored-field transport `L1` |          `2.9966866364064524` |   `0.6023613465061933` | `0.05` / `0.01`  |

V1 and v2 treated these controls as gating and therefore rejected promotion.
After those failures were preserved, v3 and v4 predeclared them as non-gating
selected-control characterizations because the count is an explicit project
selection; that disposition does not turn either result into a pass. They
remain accuracy limitations for future transport-control work.

The W9-to-W27 primary-field supporting study has maximum normalized
L-infinity `0.12356395218299981` and p95 normalized RMS
`0.019647247068740492`; it fails the `0.1` maximum while passing the `0.02`
p95 limit. This rejects W9 as sufficient. It does not reject W27 or establish
beyond-W27 convergence because production has no denser W owner.

## Selected Local-Sun Behavior

- The implementation retains the existing configured point Sun and its typed spectral irradiance at
  a reference distance, physical position, inverse-square falloff, radius
  near-source clamp, deterministic center behavior, and finite source-path
  bound.
- Its primary `J1` remains independent of later-order recurrence, and every
  Star-produced primitive/primary output is compared against the sealed gold.
- The first required source owns one concrete cache. Generalized multiple local
  sources and normalized/incremental cache reuse remain future capabilities,
  not Stage 9 decisions.
- Source-dependent changes trigger a full atomic rebuild. Incremental reuse
  requires separate future evidence.
- Atmospheric illumination and renderer endpoint lighting remain distinct
  consumers of the same configured source facts.

## Required Ground And Occlusion Behavior

- Ground-bound incident segments use the selected production ground reflection
  contract and retain atmosphere transport through the hit.
- The completed Stage 8 ground recurrence participates at every applicable
  local-cache order. Omitted, explicit-zero, and nonzero boundaries are covered
  through the CPU/GPU construction and lifecycle seams.
- Atmospheric shadows from scene objects, volumetric shafts, and moving
  blockers are deferred unless explicitly promoted; view-ray shortening alone
  does not imply cache-construction occlusion.

## Numerical And Runtime Evidence

- The selected R32F policy preserves the existing per-quantity
  absolute-plus-relative bounds and names the v4 report by path and hash.
- The bounded Karma/WebGL lane passes W3/N4 field probes and cumulative runtime
  lookup plus production-W27/N1 public ShaderBuilder transport for three rays
  and 90 spectral scalars.
- The lane does not contain W3/N4 numerical complete rays or a selected-domain
  W27/N4 numerical run. A bounded W27/N4 attempt exceeded `904.064` seconds
  against the 120-second bounded-build criterion and was reverted. No frozen
  gate requires that matrix cell, so it remains hardening rather than a reason
  to overstate existing evidence.
- Lifecycle checks cover reuse, invalidation, supersession,
  failure/cancellation preservation, and disposal.
- Supported-hardware selected-domain allocation, cold/rebuild time, staging
  responsiveness, and runtime cost remain Stage 15 qualification work. The
  bounded Chromium lane is conformance evidence, not that qualification.

## Open Dome-Aware Nonlinear Index Research

The
[local-Sun whole-flat-world cache design](../cache/local-sun-cache-design.md)
owns the newly proposed scattering-aligned factorized base-fact shell
representation. It is a separate candidate family whose selected executable
contracts are encoded and hashed in `base-fact-family-v1`. Its Step 2 harness
qualification is accepted in run `000222`; Step 3 is complete: the frozen
one-count-at-a-time ladder reached its first passing tested count at
`N = 2,048` in run `000234`, after complete rejected runs through `N = 1,024`.
Step 4's artifact-only closeout is accepted in run `000237`; it does not
select or implement a production cache.
It does not reopen or supersede the selected scaled 19-by-15
`z`/source-subpoint-`rho` domain.

Its current representation contains one configured source's
`U_c = N + 1` radial-boundary table and a `V = 48` atmosphere table. It has
no `U * V` or around-shell table;
exact query ray length controls world-boundary clipping. The packed binary64
fact block is `8N + 1,168` bytes. `V` reuses the production Native-48
numeric altitudes as flat-ground-relative meters with clamped
actual-neighbor-linear lookup; it is selected representation identity but not
a deciding error axis. The study will compare continuous direct
light with the arithmetic mean of the two boundary light levels held
throughout each shell. Deciding spatial samples are radial only. The selected
`fixed-direct-primary-response-bank-v1` projection normalizes whole-world
direct-primary radiance at `[0, 0, 5] m` for every source case and five
retained local-Sun ray roles, scales each response by the continuous or
shell-held light, and applies E8 plus E2's strict
`observed Delta E_ITP + 1.485163121927885e-10 < 1` rule. The bounded matrix
has at most `41,670` comparisons per completed count. Geometry and boundary
fixtures are nondeciding qualification; success is scoped to the fixed
response diagnostic rather than every world position or complete render. Its
family-wide minimum innermost-shell width is `1.5 m`; the centered source
controls the width backstop at `N = 1,484,977` and `11,880,984` packed bytes.
The `12,597,120`-byte distant-Sun field is only the sizing guide. The deciding
ladder stops at the first completed count in the frozen sequence where every
required sample passes the frozen uncertainty-inclusive human-perception gate,
or otherwise at that width backstop. Operational failure or interruption is
an incomplete attempt, not a scientific terminal, and either stop reports the
final five completed counts. Completing the study would not select or
implement a production cache.
The resulting curves are also profile-facing evidence rather than a request
for one global cache size, but the current light-only study selects no
application profile or override. The
[Flat32 application design](../production/flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies)
owns that future profile and feature-policy behavior.

The terminal sparse-position lineage and its retained evidence remain owned by
the
[earlier dome-aware nonlinear position-index proposal](../cache/cache-design.md#proposed-flatlocal-dome-aware-nonlinear-position-index).
The shell design is not another refinement of that lineage.

The terminal
[local-Sun shell-cache characterization plan](../experiments/local-sun-shell-cache-experiment-plan.md)
owns the closed family's execution order and accepted history. The retired
runnable tree, lane rules, and immutable runs are indexed by the
[Algorithm32-Star evidence archive](../archive/algorithm32-star/README.md).
The
[terminal prior plan](../experiments/star-flat-local-cache-plan.md)
continues to own the accepted boundary/coordinate and rejected v2-v4
evidence.

The terminal study recorded a newly explicit gap: neither current production
nor the retained Algorithm32-star flat code contains an accepted
map/world-centered atmosphere boundary that participates in view, source, and
reusable construction paths. The old observer-centered dome is a final-view
diagnostic boundary, and the old repository's `ext-025` full-world edge
verification remained pending. Selecting the physical boundary was therefore
the first research decision; it must not be presented as recovered Star
behavior.

Once that boundary is pinned, an off-center finite source breaks the current
source-centered rotational reduction. A nonlinear remap of `rho` alone remains
two-dimensional and cannot distinguish same-`z`/same-`rho` points at different
map radii. The terminal candidate family used a canonical two-center
axial/transverse half-domain, sparse tetrahedral cells, packed opaque node IDs,
and geometry-owned four-tap barycentric stencils. Exact CSR/ragged transport
was evaluated independently so storage padding was not confused with physical
dimensionality.

The standalone Algorithm32-Star package is closed and must not be reopened.
Its retained primitives are path-pinned validation evidence; its other source
and run records are archive-internal. A future flat/local follow-up requires a
new isolated lane, source identity, fixtures, and run namespace. Archived Star
dense-reference evidence may inform that work but is not thereby an official
independent experiment or a runtime dependency. Any accepted replacement
still requires a scoped no-Star-producer amendment to the production authority
contract, the separate official-experiment route, a current-production
J1-J4/Jthrough4 convergence, CPU/GPU, lifecycle, resource, and application
study, and an explicit promotion decision.

The plan's
[archived Stage 0 evidence](../experiments/star-flat-local-cache-plan.md)
accepts focused test run `000175` and nonphysical smoke run `000176`; the
smoke invoked no physical calculation and constructed no geometry, cache, GPU
work, or render. The
[Stage 1 boundary input decision](../experiments/flat-world-atmosphere-boundary-decision.md)
now selects and content-pins the North-Pole AEQD map frame,
`C = [0, 0] m`, `R = 20,015,114.442035925 m`, the South-Pole
transparent-exit rim seam, and the 100 km flat-atmosphere apex. Stage 1
focused run `000180` passes all 52 tests, and deciding run `000181` passes all
8 frozen boundary gates; the plan retains rejected focused-test runs `000178`
and `000179` as pre-acceptance evidence. The content-addressed Stage 1 matrix
froze the exact geometry, rim, all-path, medium, finite-source, and adjacent-
binary32 cases before output.
Its binary32 realization is the same physical sphere evaluated with a
map-radius-scaled factored implicit equation and a 32-ULP non-contact gate.

The plan's
[archived Stage 2 evidence](../experiments/star-flat-local-cache-plan.md)
accepts focused run `000182` and deciding run `000183`. The current
`[z, rhoSun]` key aliases all four frozen cases despite distinct exits or
fields among the three non-reflection pairs; `[z, x, abs(y)]` separates those
pairs, the joint-reflection control is exact, and both continuity sequences
contract. This accepts only the coordinate invariant for the frozen direct
binary64 slice. No replacement cache, production node count, interpolation
rule, or resource result is selected by Stage 2.

Stage 3's initial discard-only boundary-cell rule was rejected by
pre-execution proof, without candidate output or a numbered run, because its
ordinary uncollapsed barycentrics left part of both collapsed boundary slabs
uncovered. Candidate-v2 replaced it with source-cube-local quotient
coordinates `(u, u * v, w)` at the center, `(u, v, w)` in the interior, and
`(u, v, (1 - u) * w)` at the rim. Pre-execution audit also corrected that
candidate's evidence matrix before output so the old-gap probes, global
exhaustive locator, independent topology, physical-mapping and metric
oracles, observed primitive-call accounting, and recursive import closure
were genuinely independent.

The plan's
[archived Stage 3 evidence](../experiments/star-flat-local-cache-plan.md)
now records the complete predeclared node-additive path:

| Candidate                   | Focused evidence                     | Deciding evidence         | Result                                  |
| --------------------------- | ------------------------------------ | ------------------------- | --------------------------------------- |
| v2, 295 nodes / 1,260 cells | run `000194`, 123 tests accepted     | run `000195`, 15/16 gates | rejected on held-out direct-J2 accuracy |
| v3, 305 nodes / 1,296 cells | run `000197`, 144/144 tests accepted | run `000198`, 16/19 gates | rejected only on H/V accuracy           |
| v4, 319 nodes / 1,345 cells | run `000201`, 165/165 tests accepted | run `000202`, 16/20 gates | rejected only on H/V/W accuracy         |

Candidate-v3's H maximum normalized L-infinity / p95 normalized RMS is
`0.891560716143075` / `0.3982647449659014`; V is
`0.665113743081585` / `0.24696158884240738`. Its combined resident and peak
tracked logical sizes are `80,088,908` and `431,994,660` bytes.

The terminal candidate-v4 is the frozen resource-saturating ten-star
refinement. Its retained policy raw SHA-256 is
`ec7fc018c13776ab9ff45910f4d8ec8fbaf879f3be6ece081c745ec50b399bc8`,
and its retained matrix raw SHA-256 is
`a385ca2996f7e87a462cc64e989198ebe797760ef226af812f279296cb6bdc35`.
Run `000202` reports H at
`0.38124590303594585` / `0.17052603364464278`, V at
`0.491972686064957` / `0.20214936622655572`, and the freshly frozen
independent W surface at
`6.968497055654817` / `3.0195444147383035`, all against the unchanged
`0.1` / `0.02` limits. Every structural, resource, provenance, and
independence gate passes; only the four frozen accuracy gate IDs fail. Two
score H and one each score V and W, with all three metric surfaces reported
separately.

Candidate-v4 retains `83,764,776` combined resident bytes and projects
`451,821,040` peak tracked logical bytes. Only `121,304` resident bytes remain.
One additional unchanged node requires at least `262,464` bytes before added
cell or accelerator storage, while the 320-node field alone would occupy
`83,980,800` bytes and exceed the `83,886,080`-byte ceiling by `94,720`
bytes.

This is the terminal result for further node-additive refinement of the
predeclared path under the unchanged W27/native-15/four-tap resident field.
Stage 4 remains blocked, and the selected production 19-by-15 cache is
unchanged. The result does not prove that every arbitrary placement of at
most 319 nodes fails, reject a separately designed field compression or
representation, or reject exact ragged transport. The ragged track remains a
separate exact-storage question and cannot repair position-reconstruction
error. Any new position study must therefore begin as a separately
predeclared representation or candidate family rather than continuing this
closed refinement path. The
[scattering-aligned shell design](../cache/local-sun-cache-design.md) is the
current separately scoped proposal. Its selected contracts are content-pinned
and its harness qualification passes; no deciding count has yet been run and
no further scientific input choice is currently open.

## Explicitly Rejected Defaults

The historical 512-direction Bruneton quadrature, phase-integrated `J2`
quantity, provisional five-by-eight outgoing grid, `z`/`rho` sampling nodes,
interpolation policy, ground-reflection omission, and source intensity policy
are not selected controls. The old Algorithm32-star name and harness are not
production architecture.
