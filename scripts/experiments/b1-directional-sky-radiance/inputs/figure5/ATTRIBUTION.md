# Bruneton Comparison Figure 5 Relative-Error Panels

These 27 PNG files are the individual relative-error sky-dome panels embedded
in Figure 5 of:

Eric Bruneton, “A Qualitative and Quantitative Evaluation of 8 Clear Sky
Models,” _IEEE Transactions on Visualization and Computer Graphics_ 23(12), 2017. DOI: 10.1109/TVCG.2016.2622272. The author manuscript is available as
[arXiv:1612.04336v1](https://arxiv.org/abs/1612.04336).

The files were extracted directly from the pinned paper PDF on zero-based page
7 (printed page 8). Each source panel is a separate 256 by 256, 8-bit RGBA
image XObject. The extraction preserves the embedded image bytes and does not
rasterize or crop the PDF page, execute any atmosphere model, resample a panel,
or modify its pixels.

The PDF stores the panels in row-major order:

| Figure row | Solar zenith | XObjects        | PDF objects |
| ---------- | -----------: | --------------- | ----------- |
| 10:15      |   41 degrees | `Im158`–`Im166` | 663–671     |
| 11:15      |   31 degrees | `Im167`–`Im175` | 672–680     |
| 13:15      |   21 degrees | `Im176`–`Im184` | 681–689     |

Within each row the order is `Nishita93`, `Nishita96`, `Preetham`, `O'Neal`,
`Haber`, `Bruneton`, `Elek`, `Hosek`, and `libRadtran`. The retained semantic
filenames encode that row and model mapping. These images are outputs of
Bruneton’s comparison implementations and publication pipeline; they are not
claimed to be image files published by each named model’s original authors.

The dome color is the directional relative error after integrating model and
measured spectral radiance from 360 through 720 nm. The number printed under a
dome in the paper is instead the spectral-radiance RMSE over 81 directions and
31 wavelength samples. The exact formula, spherical interpolation, discrete
palette, projection, and annotation procedure are retained in the pinned
`clear-sky-models` source identified by `metadata.json`.

The pinned source PDF SHA-256 is
`a1220d40bc0ed6fd35e8fe728365fb5b371a615051d505dcd611f61ff22dd5c5`.
Individual retained-file hashes are recorded in
`references/downloads/manifest.json` and checked by the B1 Figure 5 runner.

The arXiv record identifies the arXiv.org perpetual, non-exclusive submission
agreement between the submitter and arXiv. That agreement is not treated here
as a downstream reuse license. These unmodified panels are retained as
attributed scholarly reference excerpts for research comparison; no broader
reuse or relicensing right is asserted.
