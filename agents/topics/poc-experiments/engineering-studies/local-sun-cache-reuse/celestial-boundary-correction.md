# Celestial Ray-Boundary Correction

The owner clarified that the geometry-resolved camera-ray termination, including
the observer dome, ends atmospheric view transport. The prior celestial adapter
instead evaluated a separate full flat slab to 100 km altitude. That incorrectly
extended celestial attenuation beyond the selected view boundary whenever the
dome terminated the ray first. Historical captures remain immutable evidence
of their original policy.

The contained correction installs the shared production celestial consumer
without modifying its transmission expression. It uses `state.transmittance`
already accumulated by the experimental view transport. Sun/star spectra enter
as boundary radiance, are attenuated once, and combine with atmospheric path
radiance before the shared display response. Catalog, placement, physical source,
atmospheric cache, receiver adaptation and production code are unchanged.

Focused proofs now run the actual geometry-bound and transport shader before
evaluating the consumer. Sun-facing, zenith, one-degree and horizontal rays
record CPU/GPU geometry endpoints and compare Native15 transmission with the
existing CPU analytic atmosphere operation over the measured GPU segment.
The unchanged geometry's binary32 intersection residuals are informative,
separate from the unchanged spectral agreement limits. Occupied stellar and
human-vision probes reconstruct the actual raster ray and use that same path.
The proof rejects reintroduction of the full-slab helper. No quantitative
absolute model-accuracy claim follows from shared-method agreement.

## Execution And Completion

New immutable [00712 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00712-p5-celestial/flat-180-combined.png)
repeats the latest Flat180 view at 65-degree elevation, original Sun azimuth
and 1024-by-768, with p2 and shared human-vision filters. The
[result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00712-p5-celestial/result.json)
and [input inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00712-p5-celestial/inputs.json)
record source/tool identities and actual GPU proof measurements.

Four transmission rows pass unchanged limits: largest absolute residual
5.76e-7 and relative residual 6.55e-6. Source-facing Sun coverage times boundary
spectrum times view transmission and exact scene masking pass. The 2,000-member
catalog retains 1,509 occupied pixels and 32 collision pixels; palette residual
is 9.32e-8 and actual consumer residual is 5.23e-8. Shared human-vision CPU/GPU
agreement is 9.83e-8. Adaptation remains 31.0953061 cd m^-2 with zero rod weight.
Lifecycle, publication compatibility, cancellation, disposal, one atmospheric
cache and zero WebGL-error checks pass.

Compared with immutable 00706 at the identical camera/display state, the
star-only PNG is pixel-identical: 11 nonzero RGB pixels, maxima (4, 4, 5)/255.
The combined PNG has 15 changed pixels. This direct comparison decodes both
1024-by-768 PNGs using Node 25.4.0 and the repository's `pngjs`; it counts a pixel
as changed when any corresponding RGB byte differs, without rescaling, and
counts any nonzero RGB byte for stellar visibility. Inputs are the corresponding
`flat-180-combined.png` and `flat-180-stars.png` artifacts in each linked run's
sealed manifest. The corrected boundary policy does not materially increase
visible stars in this upward view.

Browser execution took 76.291 seconds. Default
[00711 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00711-resource-bound/result.json)
passes with sampled peak private memory 4.63 GiB and minimum machine-free
memory 12.88 GiB. Browser profile and heavy lock are removed. Production has no
Git diff. Local authored JavaScript type checking and repository formatting pass.
No video or production promotion is selected.

Failed 00708/00710 captures and their guards remain immutable. An initially
introduced strict endpoint check rejected binary32 dome intersections: the
source-facing GPU distance differs by 5.48 m over a 596.7 km ray, and the
one-degree/horizontal endpoints differ by about 9.7 m. These are observations
of the unchanged geometry, not a relaxation of frozen spectral gates. The
accepted proof isolates transport by checking the CPU analytic equation over
the measured GPU segment, while retaining both endpoint versions in its rows.
This unit does not requalify or repair the geometry intersection implementation.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-toward-up-180
```

The review baseline was captured before edits in
`.codex-tmp/review-standards/session-fRGqrh/baseline.json`. Changed adapter,
transport/presentation proofs, contracts and relevant unchanged collaborators
require fresh mapped primary/audit evidence. Earlier receipts retain their
original scope. Numerical delivery is accepted. Implementation completion
requires matching exit-0 CLEAN validation at
`.codex-tmp/review-standards/session-fRGqrh/validation.json`; missing, stale or
non-CLEAN evidence keeps the source gate open. The baseline was captured before
edits; the draft request is not completion authority.
