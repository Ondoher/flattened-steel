# Contained Human-Vision Stellar Integration

The owner selected the globe application's human-vision stellar filters with
the existing p2 color model, original 2,000-star catalog and physical Flat180
state. The [design basis](p5-celestial-design.md#shared-human-vision-stellar-presentation)
owns the integration and cache-compatibility contracts. Production is unchanged.

## Result And Visibility

The latest owner-selected camera return is recorded under
[Camera Turned Back At The Same Tilt](#camera-turned-back-at-the-same-tilt).
The original away-view integration evidence below remains immutable.

New immutable [00704 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00704-p5-celestial/flat-180-combined.png)
keeps the opposite-Sun azimuth, 65-degree elevation and 1024-by-768 raster from
the [00700 physical-presentation comparison](sun-disc-correction.md#upward-camera-and-new-capture-size).
The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00704-p5-celestial/result.json)
records the actual response and authenticated production scotopic package.

Five pixels are occupied, without collisions. The probe's Native15 consumer
spectrum is identical to 00700; its magnitude is 4.1499996 at bottom-left pixel
(553, 620). Measured receiver adaptation is 31.0953061 cd m^-2. The shared
mesopic equation gives zero rod contribution at or above 5 cd m^-2, so this
frame gets no mesopic luminance increase. The chroma filter neutralizes the
probe because its magnitude exceeds 3.2: physical linear RGB
(0.06174339, 0.06813173, 0.08947894) becomes
(0.06831484, 0.06831484, 0.06831484). These are source-linear values before
p2's ambient gain and output encoding, not normalized display RGB.

The [star-only PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00704-p5-celestial/flat-180-stars.png)
remains exact black after p2 encoding and 8-bit quantization. Python Pillow
inspection finds zero nonzero RGB pixels and zero extrema in each channel.
Comparing every RGB pixel of the new combined PNG with 00700 finds zero changed
pixels. The [occupancy diagnostic](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00704-p5-celestial/flat-180-star-index.png)
shows the five placements independently of brightness. Float readback verifies
the integration; this frame does not demonstrate perceptually visible stars.
No extra gain, false night state or catalog expansion was introduced.

## Verification And Reproduction

The actual assembled color shader contains the exact shared filter hook and
uses the measured receiver adaptation scalar. Its publication tuple matches
the facade's receiver identity, p2 model, filter registry and scotopic weights.
CPU/GPU projection and filtering agree with maximum relative component
residual 9.93e-8, within 3e-5 above a 1e-10 denominator floor. Six synthetic
adaptation checks at 0, 0.005, 0.05, 0.5, 5 and 50 cd m^-2 exercise the same
equations using the actual probe spectrum. At the dark endpoint, neutral RGB
becomes 0.12700189; this is equation evidence, not the capture lighting state.

Changing the executor's presentation proof callback replaces its output while
retaining static catalog table/textures. The callback is restored before image
capture; facade-owned lighting bindings are never overridden. All 2,000
members retain CPU/GPU projection agreement (maximum 0.02127 pixel). Palette
and transported-consumer relative residuals are 7.08e-8 and 4.38e-8. One
atmospheric cache, scene masking, compatible reuse, observation/parallax/resize
replacement, failed-staging rollback, context callbacks, cancellation and
disposal pass. WebGL error is zero.

The [inputs](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00704-p5-celestial/inputs.json)
retain pinned parent controls/layout, executable input hashes, read-only catalog
and human-vision package assets, bundle/worker identities and contained
Sun-correction/camera derivations. Browser execution took 49.863 seconds.
Default [00703 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00703-resource-bound/result.json)
passed: sampled peak private bytes 4.06 GiB, minimum machine-free memory
12.44 GiB. Browser profile and heavy lock were removed. No video was generated.

Initial attempt 00702 and guard 00701 remain immutable failure evidence. The
focused proof used an invalid spectral quantity constant; accepted execution
uses the existing radiance-density quantity and units. Local authored
JavaScript type checking passes. Source completion requires the matching
exit-0 CLEAN primary/audit receipt at
`.codex-tmp/review-standards/session-QerVun/validation.json`. Missing, stale or
non-CLEAN evidence keeps this unit open. Earlier receipts retain their original
scope. The baseline was captured before this integration.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-away-up-180
```

The previous `p2-combined-away-up-180` preset retains physical presentation for
comparison. Further visibility diagnosis and P6 recording remain separate
selections. This integration does not change atmospheric assumptions, stellar
placement, physical emission or the production application.

## Camera Turned Back At The Same Tilt

The owner requested a 180-degree azimuth return from 00704 while preserving
its upward tilt. New immutable [00706 combined PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00706-p5-celestial/flat-180-combined.png)
keeps the same physical Flat180 control, camera position, 65-degree elevation,
1024-by-768 raster, p2 model, human-vision filters and original catalog.
The new `p2-human-toward-up` preset uses the original Sun azimuth. Its yaw is
recorded as zero relative to the prepared Sun-facing camera, equivalent to
180 degrees back from 00704. The camera helper checks azimuth/elevation and
unchanged position/cache. The Sun is ahead in azimuth but below this upward
field: its projected centre is (512, -437.13) in bottom-left coordinates.

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00706-p5-celestial/result.json)
contains 1,509 occupied stellar pixels, with 32 collision pixels, compared with
five in 00704. All 2,000 catalog members pass CPU/GPU checks. Maximum continuous
projection residual is 0.0430 pixel, within 0.1; the largest integer boundary
movement is one pixel. Palette and transported-consumer relative residuals are
9.32e-8 and 4.59e-8. The selected probe magnitude is -1.46. Measured adaptation
remains 31.0953061 cd m^-2, with zero rod contribution. Shared filter CPU/GPU
residual is 9.29e-8. Publication replacement/static-input reuse, scene masking,
lifecycle, cancellation, disposal, one-cache and zero WebGL-error checks pass.

The [star-only PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00706-p5-celestial/flat-180-stars.png)
has 11 nonzero RGB pixels, with maxima (4, 4, 5) out of 255. Python Pillow
inspection uses `Image.getextrema` and counts pixels with any nonzero RGB
channel. The stars remain very faint at the unchanged lighting/display state.
The [occupancy PNG](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00706-p5-celestial/flat-180-star-index.png)
shows placement independently of brightness.

The [input inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00706-p5-celestial/inputs.json)
records controls, executable/bundle identities and the new camera derivation.
Browser execution took 46.399 seconds. Default [00705 guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00705-resource-bound/result.json)
passed with sampled peak private bytes 4.48 GiB and minimum free memory
12.78 GiB. Profile and heavy lock are removed; no video was generated.
Production has no Git diff. Local JavaScript type checking passes.

Source completion for this camera-preset unit requires the matching exit-0
CLEAN primary/audit receipt at
`.codex-tmp/review-standards/session-vmHyaE/validation.json`. Missing, stale or
non-CLEAN evidence keeps the unit open; earlier receipts retain their frozen
scope. Its baseline was captured before changing the preset/helper.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-toward-up-180
```
