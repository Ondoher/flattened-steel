# Canonical Production B1-B3 Result

Status: C1.9 executed on 2026-09-10; closeout rejected by the fixed B1 ceiling.
C1.10 and release item C1 remain open. No threshold, physical profile, compiler,
or production runtime was changed in response to this result.

## Result

| Gate | Observed | Disposition |
| --- | --- | --- |
| Complete production boundary | 17 conditions, 81 directions each, 40 direct spectral coordinates; 55,080 finite, nonnegative values | pass |
| B1 existing classification | favorable | pass |
| B1 closeout ceiling | 11.831044211622888 versus maximum 11.820391604126252 mW m^-2 sr^-1 nm^-1 | fail |
| B2 existing classification | favorable; RMSE 2.834261691366828 W m^-2 | pass |
| B3 classification and mismatch record | favorable; all five required mismatch fields present | pass |
| B3 same-run consistency | difference 0.00000021162288810216978 versus tolerance 0.000001 mW m^-2 sr^-1 nm^-1 | pass |
| Six original B1 figures | three SVG charts and three PNG panels; explicit Basic Bruneton display control | generated and hash-verified |

The B1 excess is 0.010652607496636435 mW m^-2 sr^-1 nm^-1, or
0.09012059712909526%. The broader favorable classification does not override
the independent closeout ceiling. B3 reports the same unrounded aggregate as
B1; its consistency check reads the six-decimal B1 report and therefore has
the small rounding residual above. Physical scoring excludes Color, display
encoding, tone mapping, and human-vision presentation filters.

## Immutable Evidence

All following roots are below
`tmp/extraterrestrial/production-color-reset/p8/` and preserve their parents:

| Root | Purpose |
| --- | --- |
| `c1-9-canonical-v8-assets-000001` | complete corrected direct-40 v8 asset set, compiler evidence and payloads |
| `c1-9-canonical-v8-boundary-000001` | production GPU manifest, table, 31-channel cube, B1 report and six figures |
| `c1-9-canonical-v8-scores-000001` | retained rejected combined-score attempt; no accepted score manifest published |
| `c1-9-same-asset-final-view-1245-000001` | bounded binary64 final-view comparison using the identical R32F asset |
| `c1-9-execution-000001` | invocation control, logs, independent B2/B3 reports, rejected aggregate result, interpretation and artifact verification |

Production revision: `428ccc9cb0b33211a99313e35944429843e1e731`.
The adapter is `algorithm32-production-b1-direct40-offline-asset-adapter-v8`.
The set identity is
`algorithm32-b1-direct40-cache-set-sha256:fbe39f35cafad630e2e29219f25c38bf88512f4d380380e4502727839ad4d274`;
its manifest SHA-256 is
`7b5d94048dc51a45b42d3e5ed62f147b88578eeef372535dd6437d590660deb5`.

The GPU run is `current-production-b1-gpu-shaders-20260910T200227676Z`.
Its manifest SHA-256 is
`89a343475b6c7d0b78533c3b8ab134dbfe0286e1c7d229df2a31805f962bebfc`;
table SHA-256 is
`30516f2c605d8466170c7ea500eaa95eccb5f0512c9d0e0e67801c1fc1fab6f4`;
cube SHA-256 is
`fc333f5ad4ed2e5404b83f2e62d35990c75223c13808bae376b9f884e9856952`.

The complete set passed the standalone asset verifier. The production GPU
measurement took 58.781 seconds on the RTX 2060/D3D11 path and recorded resource,
context, browser, and server cleanup. The 51 focused production-B checks pass.
Compilation and scoring used separate fresh, real P8 directories. The older
generator/scorer can overwrite reused output roots; this execution did not
reuse one. No public reference result or prior run was replaced.

The final `c1-9-execution-000001/artifact-index.json` authenticates 103 artifacts,
all 42,687 cube scalars exactly match their parent table, and all six figures
match the original generator's lengths and hashes. Its SHA-256 is
`bc7a64cad139b54bc3c71b92bca358dbb34c7f39b6856bc4b5eeb1268c19aa68`.

## Failure Localization And Follow-Up

The subsequent [ground-contact investigation](production-b-family-ground-contact-investigation.md)
confirms matching direct-40 profiles and locates the material discrepancy in
the historical 12:45 ground-contact classification. Its isolated replay and
CPU correction resolve that numerical cause. The original rejection below
remains unchanged; the follow-up owns the remaining benchmark-authority decision.

The first regenerated asset and direction map exactly reproduce the accepted
C1.8 v8 payload hashes. The historical GPU table that supplied the closeout
ceiling declares the same 40/20/68/48, W27, cumulative-J4 controls. Its maximum
pointwise difference from the current table is 0.006097778677940369
W m^-2 sr^-1 nm^-1 at 12:45, grid 8/4, channel 4. This historical comparison
does not establish which implementation is physically correct.

At 12:45, independent binary64 final-view evaluation of the **same current
R32F asset** agrees with all 3,240 GPU values at RMS
1.5287467188286315e-8 and maximum absolute difference
1.3674533397289856e-7 W m^-2 sr^-1 nm^-1. These pass the existing final-view
parity envelope. The reused diagnostic helper calls its comparator input
`cpuTablePath` and labels it `cpu-reference`; in this invocation that input is
the current GPU table. Its other table is the actual binary64 evaluation of
the same R32F asset. This is not independent CPU cache-construction parity.
The self-describing `c1-9-execution-000001/same-asset-interpretation.json`
wrapper pins the parent report, both source-table derivations, exact hashes,
helper implementation, and actual meaning of the legacy labels. The original
diagnostic is preserved unchanged.

The same-asset evidence points away from a final-view shader error for the
largest historical discrepancy. The linked follow-up subsequently isolated
the cause through bounded historical GPU interventions without requiring the
previously considered 78-minute independent CPU construction. Reuse this
complete set and existing bounded evidence wherever inputs remain unchanged.
