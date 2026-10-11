# Sun Disc Coverage Diagnostic

The owner-selected GPU readback confirms spurious positive Sun coverage outside
the mathematical circle. This follow-up diagnoses the checker-like Flat180
fringe; it does not implement a production fix or repeat full celestial qualification.

The immutable [00679 readback](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00679-sun-coverage/result.json)
and [00678 resource guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00678-resource-bound/result.json)
retain input shaders, captured parameters, executable/source hashes, browser
identity and complete `coverage.f32le` data: a 96 by 96 R32F tile, little-endian,
bottom-left row-major. No browser profile remains.

## Derivation

The diagnostic authenticates the complete parent inventory of
`00674-p5-celestial`. It reads the actual Flat180 radius/centre and requires both
production shader source hashes to match the parent capture. It executes the
unchanged shared coverage shader with s16 sampling, R32F storage and linear
filtering. A second draw executes the unchanged coverage consumer at 100
original screen-pixel positions. No atmosphere construction, spectrum, display
conversion or image editing participates in these draws.

The independent support check measures the nearest distance from the circle
centre to each pixel square. A distance at least the actual binary32 radius
implies exactly zero overlap; this classification avoids signed-area cancellation.

## Results And Limits

- Of 8,652 mathematically disjoint tile samples, **8,475 have positive GPU
  coverage**. Maximum false coverage is **1.17206946e-6**.
- The actual filtered consumer gives **32 disjoint outer screen pixels**
  positive coverage. The four central pixels have legitimate overlap. At image
  row 205, columns 357–362 have approximately
  `1.21e-7, 3.73e-9, 2.26e-7, 2.26e-7, 4.19e-9, 1.21e-7` coverage.
  These alternating values correspond to the bright/dim pattern in the parent
  PNG. The real consumer multiplies positive coverage by intense Sun radiance.
- WebGL error is zero; the context reports ANGLE/NVIDIA RTX2060/D3D11. The
  observation is hardware/driver-specific, not a universal GPU claim.
- The original shader sums signed segment/sector areas, then takes
  `clamp(abs(area),0,1)`. Numerical residuals outside the circle become positive
  light contributions. The readback isolates this coverage defect; it does not
  separate intrinsic approximation, rounding and compiler optimization.
- The legitimate saturated square core and false outer fringe are separate.
  This readback does not resolve white saturation or alter color conversion.

Production code and historical runs remain unchanged. A subsequent correction
should enforce exact zero for geometrically disjoint squares, preserve partial
overlap, and verify local and distant behavior. No fix or P6 recording was performed.

The default 8 GiB free-memory reserve and 8 GiB owned-process ceiling were used;
no exception was selected. Sampled private peak was 220,540,928 bytes; minimum
machine-free memory was 15,313,842,176 bytes. These are not VRAM observations.
Browser profile and heavy lock are absent after cleanup.

Diagnostic-tool source completion requires the matching exit-0 CLEAN
[primary/audit receipt](../../../../../.codex-tmp/review-standards/session-yxKzCA/validation.json).
A missing, stale or non-CLEAN receipt keeps that gate open. This separate review
does not relabel the original P5-Celestial receipt or certify a repair.

Reproduce with the default guard:

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- read-sun-coverage.js
```
