# Point-Local Cache Builder Experiment Status

Status: complete; application, no-ozone Bruneton, and 300 DU ozone evidence accepted.

## Current State

The contained adaptation of the current production point-local builder accepts
explicit scene lists, spectral channels, and profiles. It preserves the local
Sun-angle dimension, existing common-field sharing, and unchanged production
GPU compiler. Its bounded shared inventory expands through scene indexes into
the complete logical cache. No production implementation changed.

Application ozone remains enabled at 300 DU. The Bruneton profile uses 40 spectra,
spectral grass, zero ozone absorption, 40 transport intervals, source quadrature
20, and N4; final view integration uses Q30. Native48/Z180/W27 remain explicit
compatibility requirements. Scene counts are input-driven; the duplicate-request
proof covers 257 requests without additional unique coordinate work.

## Accepted Results

- Application daylight/twilight proof at wavelengths 0 and 14: all 10,847,520
  calculated Float32 values and 16,271,280 expanded values match existing controls
  exactly, including the duplicate scene. GPU generation took 9.475 seconds.
- Bruneton: 17 scenes and 40 channels use 1,951 shared coordinate rows in 96
  blocks. GPU generation took 189.261 seconds. The cache contains 1,266,745,280
  decoded bytes, compressed to 473,129,073 bytes.
- All 55,080 final radiances pass the limits declared before calculation.
  Maximum absolute difference from run 65 is 1.2442944258284072e-8
  W m^-2 sr^-1 nm^-1; RMS difference is 6.653422900404403e-10 in the same units.
- Aggregate score: 11.554012509934566 versus run 65's 11.554012538468113
  mW m^-2 sr^-1 nm^-1. Difference: -2.8533547080655808e-8.
- The 10:15, 11:15, and 13:15 comparison figures have identical pixels and PNG
  hashes to the corresponding run 65 renders through the same figure pipeline.
- Qualification reused the saved cache, decoded each block once, and took
  approximately 2 minutes 38 seconds. This is an extensibility/correctness result;
  the experiment does not claim a new speedup over the current builder.
- The ozone follow-up retained the same 17 scenes, 40 channels, 1,951 shared
  coordinates, grass ground, F68/W27 domains, N4 cache, and Q30 final view. The
  single GPU execution took 164.544 seconds.
- Ozone decreased all 55,080 radiances. The ozone-on/off RMS difference is
  0.0012799007571183687 W m^-2 sr^-1 nm^-1; mean signed difference is
  -0.00070057941874008. The maximum decrease is 0.014062830593571884 at
  09:30, direction (4, 7), and 571.5 nm.
- B1 aggregate RMSE changed from 11.554012509934566 to 11.687280425413878
  mW m^-2 sr^-1 nm^-1, a 0.13326791547931194 increase (1.153434%). Five of
  17 conditions improved and twelve worsened. The largest improvement was
  09:45 (-0.7124574129982939); the largest worsening was 11:00
  (+0.4879137642945963), in the same RMSE units.
- The strongest spectral effect is around the Chappuis band: the largest RMS
  channel difference occurs at 571.5 nm, followed by 559.75, 595, and 583.25 nm.
  All three selected figure renders differ from the ozone-off control.

## Evidence and Run Dispositions

All paths below are direct children of
`tmp/experiments/point-local-cache-builder/`.

| Run | Disposition | Evidence |
| --- | --- | --- |
| `00000-profiles` | accepted, sealed | Authenticated profiles and predeclared numeric limits. |
| `00001-app-proof` | failed, sealed | Sandboxed Chrome exited before loading; no calculation result. |
| `00002-app-proof` | accepted, sealed | Exact application GPU and indexed-expansion comparison. |
| `00003-bruneton` | failed, sealed; completed cache retained | GPU generation and package completed. Subsequent in-memory comparison rejected signed zero versus JSON-normalized zero. The serialized package is authenticated input to later qualification; this run itself is not accepted. |
| `00004-run-controls` | accepted, sealed | Allocation, nonreuse, lock, containment, suffix limits, exhaustion, and terminal immutability proof. Nested numbered directories are allocator fixtures. |
| `00005-b1-qualification` | interrupted, unsealed; excluded from sealed and accepted evidence | Process stopped after detecting repeated full-block decoding per wavelength. Preserve the partial attempt untouched. Its progress is diagnostic history only; it has no terminal manifest or acceptance claim. |
| `00006-b1-qualification` | accepted, sealed | Reuses authenticated run 00003 cache with serialized metadata and one-time block decoding; full run 65 radiance, score, and figure comparison. |
| `00007-verify` | accepted, sealed | Verifies 263 artifacts across six sealed parent runs, input rejection, 257-request sharing, and serialized cache expansion. |
| `00008-b1-ozone` | failed, sealed; completed ozone cache retained | The only ozone GPU generation completed and packaged. Evaluation then encountered the known signed-zero versus serialized-zero metadata distinction. |
| `00009-ozone-eval` | accepted, sealed | Authenticates and reuses run 00008 staging without GPU regeneration or decoded copies; compares the complete ozone result with run 00006. |
| `00010-verify` | failed, sealed | First final verifier attempt applied the signed-zero-sensitive comparison to an in-memory control profile. |
| `00011-verify` | accepted, sealed | Verifies 380 artifacts across eight sealed evidence runs, serialized expansion, the ozone-only profile delta, and all 55,080 ozone comparisons. |

The cache is `00003-bruneton/cache.json`. Qualification artifacts are
`00006-b1-qualification/b1-comparison.json`, `b1.tsv`, `b1-scores.svg`, and
`b1-10h15.png`, `b1-11h15.png`, `b1-13h15.png` with adjacent `target-*.png` files.
Run manifests retain implementation snapshots, tool identities, input hashes,
derivation operations, and artifact identities.

The ozone cache is `00008-b1-ozone/cache.json`. Ozone comparison artifacts are
under `00009-ozone-eval/`: `b1-comparison.json`, `b1.tsv`, `b1-scores.svg`,
three `b1-*.png` figures, and their adjacent ozone-off `target-*.png` controls.

## Review and Verification

Scaffold normalization, topic refresh, folder mapping, calibration, formatting,
and generated-guide checks passed. Focused architecture/correctness reviews
found no material calculation or package defect. The lifecycle finding for
unsealed run 00005 is resolved by the explicit excluded/interrupted disposition
above, without reopening prior output. Verification follows the owner's
consolidated review waiver; no exhaustive standards-compliance ledger is claimed.

The final verifier passed 380 sealed artifact hashes across eight evidence runs,
serialized package expansion, invalid domain/ozone inputs, corrupt scene indexes,
duplicate-request sharing, the ozone-only profile delta, and ozone result shape.
Focused JavaScript type checking and formatting passed. Formatting after the
run changed source layout only; no calculation rerun was necessary.

## Remaining Boundaries

No blocker to experiment completion. Production promotion is complete under the
[production point-local compiler plan](../../../production-algorithm32/caches/point-local-compiler-promotion-plan.md);
runtime adoption remains a separate decision. The application proof deliberately
samples two wavelengths and daylight/twilight scenes; it is not a new full
109-scene qualification. The Bruneton comparison covers the full requested 17
by 40 set.

The shared `start-experiment` skill still specifies the wrong outer-folder
numbering. Automatic approval review rejected its proposed repair because
changing future experiment workflows needs separate authorization. The skill is
unchanged; this experiment follows the owner's explicit unnumbered outer folder,
direct five-digit runs starting at zero, and sixteen-character suffix limit.
Historical experiment folders and runs remain untouched.

## Ozone Follow-up

The complete 17-scene, 40-channel point-local ozone workload is accepted as
execution evidence. The pre-GPU gate authenticates every column, density-profile,
table-coordinate, unit, and cross-section field used by both GPU construction
and Q30 final-view extinction. Run `00006` is the authenticated ozone-off
control. The result measures the ozone effect; no independent ozone-on radiance
oracle exists, and the higher Kider RMSE does not establish an adoption decision.
