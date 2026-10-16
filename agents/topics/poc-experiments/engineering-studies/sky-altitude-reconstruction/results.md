# Inter-Order Altitude Reconstruction Results

The legacy single-bin altitude stencil does **not** explain the old white horizon in the matched production noon view. It makes a measurable but very small difference: display-linear horizon luminance rises **0.0804%**. The hue remains blue-gray.

![Current production versus legacy altitude reconstruction](../../../../../tmp/experiments/sky-altitude-reconstruction/runs/00000-altitude-noon/comparison.png)

Left: current production linear altitude reconstruction. Right: legacy floor-selected bin, retaining the same current F68 directions and every other construction, view and display control.

## Measured Effect

Central-half image bands use exact perspective camera elevation. Luminance is calculated by inverse sRGB transfer and weights 0.2126/0.7152/0.0722, after the fixed production presentation transform; these are **display measurements, not raw radiance or paper RMSE**.

| Elevation | Luminance change | Production mean RGB8    | Legacy mean RGB8        |
| --------- | ---------------: | ----------------------- | ----------------------- |
| 0.25–1°   |         +0.0804% | 185.777,195.982,221.209 | 185.906,196.049,221.170 |
| 3–5°      |         +0.2059% | 190.204,208.681,232.307 | 190.396,208.882,232.393 |
| 20–25°    |         +0.1962% | 117.678,153.403,212.437 | 117.782,153.548,212.572 |

Horizon R/B changes only 0.83983→0.84056. RGB range divided by maximum changes 0.16017→0.15944. That slight warming/desaturation is insufficient to recover the archived bright white appearance.

## Isolation And Higher Orders

Fresh production F68 channel7 (595nm) matches all 1,088 deployed probes exactly: maximum absolute and relative differences are zero. All **32,640** baseline/variant J1/J2 comparisons are identical (1,088 nodes ×15 wavelengths ×2 orders).

At 595nm, sums of J3 across sampled nodes increase1.1817%; J4 increases4.5605%. Restricting to the12 sampled nodes at0/1875/3125m within2° of the noon solar zenith gives +0.4790% J3 and +2.8307% J4. First and second orders remain unchanged there as well.

The selected probe direction is receiver-local +Z, **zenith**. These are scattering-density samples across cache nodes, not horizon radiances; their sums are diagnostic summaries, not angular integrals or a decomposition of the photographed horizon. The rendered full-spectrum comparison establishes the actual total horizon effect. Higher-order values can change several percent while the combined sky changes little because earlier orders contribute too.

## Provenance, Verification And Limits

- Capture: accepted immutable run `00000-altitude-noon`; all15 wavelengths, real RTX2060 ANGLE/D3D11 GPU, San Jose2024-06-20T20:08:46.261Z, solar zenith13.890169°, observer5m,1024×768,60° horizontal FOV, pitch5°, cross-Sun90° heading.
- [Exact transform](../../../../../tmp/experiments/sky-altitude-reconstruction/runs/00000-altitude-noon/transform.json): two reversible replacements select the existing legacy stencil branch and rename the diagnostic export. Current production compiler bytes remain unchanged. The source graph, generated compiler, inputs, package identity, tool identity and packet/channel hashes are retained.
- [Derived metrics](../../../../../tmp/experiments/sky-altitude-reconstruction/runs/00001-altitude-report/metrics.json): new accepted report run verifies the parent seal and derives measurements without repeating GPU science. Both run seals and their complete artifact inventories pass verification; owned scratch is absent.
- Capture execution565.812s (9min25.812s), including setup; report derivation about1s. Logical candidate atlas429,981,696bytes, separately owned; whole-process/transient GPU peak was not measured. Owned scratch high water252,995,058bytes. No host/GPU free-memory admission guard was added.
- No new paper RMSE, matched independent N4 correctness reference or candidate twilight qualification. This experiment neither promotes the legacy stencil nor proves which reconstruction is physically more accurate.

## Conclusion And Follow-Up Boundary

Reject altitude-bin selection **alone** as a sufficient explanation of the historic white horizon for this production noon configuration. It affects J3/J4, but restoring that one legacy behavior leaves the horizon essentially unchanged. The old image also differs in other construction and view controls; this result does not isolate their interactions.

A further experiment could isolate the old source-aligned angular frame while keeping direction count and other controls fixed, or test the old treatment of ground-ending incoming paths. Neither is executed or selected automatically here. The failed horizon2048 angular candidate stays retired, current production stays intact, and Sky Accuracy Dials stays suspended.
