# B1 - Directional Sky-Radiance Benchmark

Overall status: **ACCEPTED**.

## Question

What directional spectral-radiance residuals result when the published measurements, eight paper-model curves, libRadtran result, and each proposed numerical profile are evaluated on the same 17-time, 81-direction, common-wavelength grid with the same scoring method?

## Inputs

```json
{
  "authorities": {
    "paper": "references/downloads/bruneton-clear-sky-models-paper-1612.04336/paper.pdf",
    "perTimeLocator": "Figure 5, page 8: bottom-left RMSE values",
    "aggregateLocator": "Sections 5.3, 6.4, 7.4, 8.4, 9.4, 10.4, 11.4, and 12.4; Section 3.4 for libRadtran",
    "implementation": "Bruneton clear-sky-models revision 4df2ec6609bc0127a478bd34fff29c94352579cc, atmosphere/comparisons.cc"
  },
  "measurementRoot": "C:\\dev\\flattened-steel\\references\\downloads\\kider-clear-sky-framework-2014\\radiance-2013-05-27-bruneton-subset\\extracted\\",
  "captureDate": "2013-05-27",
  "captureClock": "local EDT; Bruneton adds four hours for UTC solar position",
  "location": {
    "name": "Cornell University, Frank H. T. Rhodes Hall",
    "latitudeDegrees": 42.44337,
    "longitudeDegrees": -76.48163
  },
  "times": [
    "09:30",
    "09:45",
    "10:00",
    "10:15",
    "10:30",
    "10:45",
    "11:00",
    "11:15",
    "11:30",
    "11:45",
    "12:00",
    "12:15",
    "12:30",
    "12:45",
    "13:00",
    "13:15",
    "13:30"
  ],
  "inputGrid": {
    "captures": 17,
    "directionsPerCapture": 81,
    "sourceWavelengths": {
      "minimumNm": 350,
      "maximumNm": 2500,
      "spacingNm": 1,
      "count": 2151
    }
  },
  "resampling": {
    "count": 40,
    "minimumNm": 360,
    "maximumParameterNm": 830,
    "spacingNm": 11.75,
    "formula": "lambda_i = 360 + (830 - 360) * i / 40, i=0..39; source values linearly interpolated"
  },
  "preprocessing": {
    "directionMap": "Bruneton retained 9x9 Shirley-Chiu square-to-disk map",
    "azimuthConversion": "Kider counterclockwise-from-north to conventional clockwise-from-north by canonical grid y := 8 - sourceY",
    "anomalyRepair": "canonical grid (8,4), source sample 0, replaced by mean of canonical (8,3) and (8,5), source samples 1 and 31",
    "solarAzimuth": "axis-of-symmetry minimum over theoretical azimuth +/-20 degrees at 0.2-degree steps, using retained bicubic hemisphere interpolation"
  },
  "scoring": {
    "wavelengthPredicate": "lambda_i >= 360 nm && lambda_i <= 720 nm",
    "scoreSampleIndices": [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30
    ],
    "scoreSampleWavelengthsNm": [
      360,
      371.75,
      383.5,
      395.25,
      407,
      418.75,
      430.5,
      442.25,
      454,
      465.75,
      477.5,
      489.25,
      501,
      512.75,
      524.5,
      536.25,
      548,
      559.75,
      571.5,
      583.25,
      595,
      606.75,
      618.5,
      630.25,
      642,
      653.75,
      665.5,
      677.25,
      689,
      700.75,
      712.5
    ],
    "scoreSampleCountPerDirection": 31,
    "rmse": "sqrt(sum((model - measurement)^2) / (81 * 31))",
    "aggregate": "sqrt(sum(per_time_rmse^2) / 17)",
    "relativeDirectionalError": "(integral_360^720 model - integral_360^720 measurement) / integral_360^720 measurement",
    "radianceUnit": "W m^-2 sr^-1 nm^-1"
  },
  "acquisitionFingerprints": {
    "rawTimeAndIndexOrderedSha256": "cab6098aac3f5380ea981a27ef5b0531a9818c3a59aef7abcacb43f53f510de9",
    "repaired40SampleCanonicalGridSha256": "18d5a3d02ffe688bf18afcc96bd39962de7a610870cc4bbe685fa6ac415be27e"
  },
  "durableMeasurementBoundary": {
    "path": "references/results/experiments/b1-directional-sky-radiance/measurement-boundary.tsv",
    "sha256": "a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74"
  }
}
```

## Iterations

Iterations: 17

| iteration | local time | UTC | spectra | source values | 40-sample values | scored values | solar zenith | fitted solar azimuth | min radiance | max radiance | input valid |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 09:30 | 13:30 | 81 | 174231 | 3240 | 2511 | 48.937947 degrees | 91.142462 degrees | 3.471886e-3 | 3.888924e-1 | yes |
| 2 | 09:45 | 13:45 | 81 | 174231 | 3240 | 2511 | 46.208826 degrees | 93.894304 degrees | 3.618098e-3 | 2.721582e-1 | yes |
| 3 | 10:00 | 14:00 | 81 | 174231 | 3240 | 2511 | 43.508069 degrees | 96.233177 degrees | 3.855309e-3 | 2.186515e-1 | yes |
| 4 | 10:15 | 14:15 | 81 | 174231 | 3240 | 2511 | 40.846007 degrees | 98.599949 degrees | 4.147707e-3 | 2.538959e-1 | yes |
| 5 | 10:30 | 14:30 | 81 | 174231 | 3240 | 2511 | 38.235216 degrees | 100.643729 degrees | 4.371379e-3 | 2.672392e-1 | yes |
| 6 | 10:45 | 14:45 | 81 | 174231 | 3240 | 2511 | 35.691221 degrees | 104.823429 degrees | 4.649031e-3 | 3.216251e-1 | yes |
| 7 | 11:00 | 15:00 | 81 | 174231 | 3240 | 2511 | 33.233422 degrees | 108.209148 degrees | 4.923757e-3 | 3.597893e-1 | yes |
| 8 | 11:15 | 15:15 | 81 | 174231 | 3240 | 2511 | 30.886221 degrees | 111.682709 degrees | 4.989122e-3 | 3.344539e-1 | yes |
| 9 | 11:30 | 15:30 | 81 | 174231 | 3240 | 2511 | 28.680351 degrees | 116.936113 degrees | 5.092007e-3 | 2.500539e-1 | yes |
| 10 | 11:45 | 15:45 | 81 | 174231 | 3240 | 2511 | 26.654199 degrees | 122.265680 degrees | 5.247992e-3 | 1.939633e-1 | yes |
| 11 | 12:00 | 16:00 | 81 | 174231 | 3240 | 2511 | 24.854694 degrees | 130.758581 degrees | 5.300829e-3 | 2.411723e-1 | yes |
| 12 | 12:15 | 16:15 | 81 | 174231 | 3240 | 2511 | 23.336871 degrees | 134.868282 degrees | 5.486389e-3 | 3.594802e-1 | yes |
| 13 | 12:30 | 16:30 | 81 | 174231 | 3240 | 2511 | 22.160769 degrees | 143.978537 degrees | 5.615668e-3 | 4.007269e-1 | yes |
| 14 | 12:45 | 16:45 | 81 | 174231 | 3240 | 2511 | 21.384403 degrees | 153.765059 degrees | 5.918695e-3 | 2.878756e-1 | yes |
| 15 | 13:00 | 17:00 | 81 | 174231 | 3240 | 2511 | 21.053025 degrees | 162.577701 degrees | 5.956434e-3 | 2.037588e-1 | yes |
| 16 | 13:15 | 17:15 | 81 | 174231 | 3240 | 2511 | 21.187917 degrees | 174.269375 degrees | 6.014695e-3 | 2.511894e-1 | yes |
| 17 | 13:30 | 17:30 | 81 | 174231 | 3240 | 2511 | 21.780231 degrees | 179.873453 degrees | 6.112912e-3 | 2.680992e-1 | yes |

Measurement-grid result: **READY**. All 1,377 official spectra, 2,961,927 source radiance values, 55,080 resampled values, and 42,687 scored values passed structural, direction-map, finite-value, resampling, and preprocessing checks.

## Published Figure 5 per-time oracle

| time | Nishita93 | Nishita96 | Preetham | O'Neal | Haber | Bruneton | Elek | Hosek | libRadtran |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10:15 | 24.7 | 17.7 | 92.4 | 49.7 | 12.6 | 9.0 | 9.0 | 39.9 | 9.3 |
| 11:15 | 26.8 | 18.7 | 88.4 | 49.8 | 15.2 | 11.1 | 11.1 | 42.8 | 11.1 |
| 13:15 | 28.0 | 17.4 | 83.3 | 48.4 | 14.9 | 11.0 | 11.0 | 40.5 | 10.9 |

## Published aggregate oracle

Predeclared reproduction tolerance: +/-0.051 mW m^-2 sr^-1 nm^-1 after the source's one-decimal rounding.

| model | published aggregate RMSE (mW m^-2 sr^-1 nm^-1) |
| --- | ---: |
| Nishita93 | 26.6 |
| Nishita96 | 18.3 |
| Preetham | 88.1 |
| O'Neal | 49.5 |
| Haber | 14.7 |
| Bruneton | 11.3 |
| Elek | 11.3 |
| Hosek | 41.5 |
| libRadtran | 11.5 |

The paper additionally reports the adopted libRadtran coarse-fit value as 11.48 before one-decimal display rounding.

## Published-reference stage

Status: **ADOPTED**.

The paper values and pinned comparison-source revision are the external authority; regenerating every published model locally is an optional cross-check.

## Optional local published-code cross-check

Status: **FAILED**.

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\published-models.tsv`

Input table SHA-256: `4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4`; bytes: 10368278.

Oracle checks: 31/36 passed; missing models: none.

| model | reproduced aggregate RMSE (mW m^-2 sr^-1 nm^-1) | published | rounded difference | result |
| --- | ---: | ---: | ---: | --- |
| Nishita93 | 26.62122465 | 26.6 | 0.0 | reproduced |
| Nishita96 | 18.00470098 | 18.3 | -0.3 | different |
| Preetham | 88.13606132 | 88.1 | 0.0 | reproduced |
| O'Neal | 49.51569595 | 49.5 | 0.0 | reproduced |
| Haber | 14.74749890 | 14.7 | 0.0 | reproduced |
| Bruneton | 11.28323859 | 11.3 | 0.0 | reproduced |
| Elek | 11.28323859 | 11.3 | 0.0 | reproduced |
| Hosek | 41.45931825 | 41.5 | 0.0 | reproduced |
| libRadtran | 11.48054694 | 11.5 | 0.0 | reproduced |

The following predeclared one-decimal checks did not reproduce:

| model | scope | reproduced | published | difference |
| --- | --- | ---: | ---: | ---: |
| Nishita96 | 10:15 | 17.5 | 17.7 | -0.2 |
| Nishita96 | 11:15 | 18.5 | 18.7 | -0.2 |
| Nishita96 | 13:15 | 16.9 | 17.4 | -0.5 |
| Nishita96 | aggregate | 18.0 | 18.3 | -0.3 |
| libRadtran | 13:15 | 11.0 | 10.9 | 0.1 |

## Algorithm32 Paper (published physical-input profile) canonical candidate stage

Status: **SCORED**.

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-proposed.tsv`

Input table SHA-256: `c292cd6873bf104e702c289d0624b7dec12d5e9606178f033754cdd1ce5a5f8a`; bytes: 1186318.

### Algorithm32 Paper (published physical-input profile) metrics

| local time | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) | threshold classification |
| --- | ---: | ---: | --- |
| 09:30 | 14.429331 | 9.759693e-2 | reported |
| 09:45 | 12.881076 | 4.280248e-2 | reported |
| 10:00 | 13.332932 | 4.550714e-2 | reported |
| 10:15 | 13.391437 | 4.473705e-2 | favorable |
| 10:30 | 13.456260 | 4.022977e-2 | reported |
| 10:45 | 14.695846 | 7.974047e-2 | reported |
| 11:00 | 16.597574 | 1.132690e-1 | reported |
| 11:15 | 15.847147 | 9.667341e-2 | favorable |
| 11:30 | 14.000060 | 4.032398e-2 | reported |
| 11:45 | 14.124965 | 4.031137e-2 | reported |
| 12:00 | 14.709377 | 4.320392e-2 | reported |
| 12:15 | 19.954819 | 1.515512e-1 | reported |
| 12:30 | 22.619302 | 1.921606e-1 | reported |
| 12:45 | 17.562642 | 9.069535e-2 | reported |
| 13:00 | 16.897398 | 5.143671e-2 | reported |
| 13:15 | 17.414261 | 5.322547e-2 | limited |
| 13:30 | 18.267089 | 5.891907e-2 | reported |

Candidate aggregate RMSE [Algorithm32-Paper]: 16.101693 mW m^-2 sr^-1 nm^-1.
Algorithm32 Paper (published physical-input profile) boundary validity: passed (55080 finite values; 0 negative).

### Canonical B1 classification

Algorithm32 Paper (published physical-input profile) classification: **LIMITED**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| Aggregate RMSE | 16.101693 | 18.300000 | 41.500000 | favorable |
| 10:15 RMSE | 13.391437 | 17.700000 | 39.900000 | favorable |
| 11:15 RMSE | 15.847147 | 18.700000 | 42.800000 | favorable |
| 13:15 RMSE | 17.414261 | 17.400000 | 40.500000 | limited |

Verified candidate provenance: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-boundary-provenance.json` (SHA-256 `847afe14e0e8c5bdb5b4b8a2cfdbdd080de827edcc585a651674ca4162ff99b5`; run `000170-algorithm32-paper-kider-b1-b2-b3-boundary`; model `proposed`; 1377 rows; 40 transported spectral channels; controls 40/20/34/48).

Predeclared judgment rules: `C:\dev\flattened-steel\scripts\experiments\whole-algorithm-paper-judgment-rules.json` (SHA-256 `fd4f61f649fc3ed1b549e7ce8b7267d98e4f8c0bc7c31123ac13280a35788e29`).

## Algorithm32₂ (paper profile; cumulative scattering through order 2) comparative candidate stage

Status: **SCORED**.

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j2-proposed.tsv`

Input table SHA-256: `1bff6bc423ff51f25db2b7c25ab96c92931779b475c13ed5dffe5470f0e4583a`; bytes: 1182440.

### Algorithm32₂ (paper profile; cumulative scattering through order 2) metrics

| local time | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) | threshold classification |
| --- | ---: | ---: | --- |
| 09:30 | 14.045985 | 8.156474e-2 | reported |
| 09:45 | 12.783860 | 5.824827e-2 | reported |
| 10:00 | 12.797571 | 5.346776e-2 | reported |
| 10:15 | 12.322818 | 4.952951e-2 | favorable |
| 10:30 | 11.505566 | 4.091319e-2 | reported |
| 10:45 | 12.141653 | 6.432023e-2 | reported |
| 11:00 | 14.157930 | 1.012552e-1 | reported |
| 11:15 | 13.583491 | 8.221882e-2 | favorable |
| 11:30 | 12.242087 | 5.165015e-2 | reported |
| 11:45 | 12.440599 | 5.163053e-2 | reported |
| 12:00 | 12.763353 | 4.894589e-2 | reported |
| 12:15 | 17.535041 | 1.373066e-1 | reported |
| 12:30 | 20.173003 | 1.796705e-1 | reported |
| 12:45 | 14.999491 | 7.799966e-2 | reported |
| 13:00 | 14.353637 | 4.628765e-2 | reported |
| 13:15 | 14.614222 | 4.686799e-2 | favorable |
| 13:30 | 15.413536 | 5.266063e-2 | reported |

Candidate aggregate RMSE [Algorithm32-Paper-J2]: 14.153018 mW m^-2 sr^-1 nm^-1.
Algorithm32₂ (paper profile; cumulative scattering through order 2) boundary validity: passed (55080 finite values; 0 negative).

### Canonical B1 classification

Algorithm32₂ (paper profile; cumulative scattering through order 2) classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| Aggregate RMSE | 14.153018 | 18.300000 | 41.500000 | favorable |
| 10:15 RMSE | 12.322818 | 17.700000 | 39.900000 | favorable |
| 11:15 RMSE | 13.583491 | 18.700000 | 42.800000 | favorable |
| 13:15 RMSE | 14.614222 | 17.400000 | 40.500000 | favorable |

Verified candidate provenance: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j2-boundary-provenance.json` (SHA-256 `698b555dc6f705233c509b900c66b70e47d5c2015ed658fa2cc427d097353c92`; run `000167-algorithm32-paper-n-order-j2-kider-b1-b2-b3-boundary`; model `proposed`; 1377 rows; 40 transported spectral channels; controls 40/20/34/48; W27/4374/Jthrough2).

Predeclared judgment rules: `C:\dev\flattened-steel\scripts\experiments\whole-algorithm-paper-j2-judgment-rules.json` (SHA-256 `572d1a408d157f1fcb23182d632e51706c84bce60f23759b06d33ddb7041ba5b`).

## Algorithm32₃ (paper profile; cumulative scattering through order 3) comparative candidate stage

Status: **SCORED**.

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j3-proposed.tsv`

Input table SHA-256: `c27fb28b5ff55538a5f88fe3f17bc0c2c9aa3737212d164709a3d87cab95efd1`; bytes: 1181147.

### Algorithm32₃ (paper profile; cumulative scattering through order 3) metrics

| local time | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) | threshold classification |
| --- | ---: | ---: | --- |
| 09:30 | 13.123388 | 7.866624e-2 | reported |
| 09:45 | 11.624154 | 5.968770e-2 | reported |
| 10:00 | 11.347383 | 5.488324e-2 | reported |
| 10:15 | 10.636198 | 5.048582e-2 | favorable |
| 10:30 | 9.493075 | 4.281763e-2 | reported |
| 10:45 | 9.915975 | 6.245439e-2 | reported |
| 11:00 | 12.106169 | 9.941064e-2 | reported |
| 11:15 | 11.598388 | 8.046212e-2 | favorable |
| 11:30 | 10.128346 | 5.249176e-2 | reported |
| 11:45 | 10.330800 | 5.245351e-2 | reported |
| 12:00 | 10.597079 | 4.993500e-2 | reported |
| 12:15 | 15.767819 | 1.359726e-1 | reported |
| 12:30 | 18.553316 | 1.783067e-1 | reported |
| 12:45 | 12.726072 | 7.662023e-2 | reported |
| 13:00 | 11.965398 | 4.780725e-2 | reported |
| 13:15 | 12.128626 | 4.236133e-2 | favorable |
| 13:30 | 13.035239 | 4.837841e-2 | reported |

Candidate aggregate RMSE [Algorithm32-Paper-J3]: 12.260324 mW m^-2 sr^-1 nm^-1.
Algorithm32₃ (paper profile; cumulative scattering through order 3) boundary validity: passed (55080 finite values; 0 negative).

### Canonical B1 classification

Algorithm32₃ (paper profile; cumulative scattering through order 3) classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| Aggregate RMSE | 12.260324 | 18.300000 | 41.500000 | favorable |
| 10:15 RMSE | 10.636198 | 17.700000 | 39.900000 | favorable |
| 11:15 RMSE | 11.598388 | 18.700000 | 42.800000 | favorable |
| 13:15 RMSE | 12.128626 | 17.400000 | 40.500000 | favorable |

Verified candidate provenance: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j3-boundary-provenance.json` (SHA-256 `59c444bec23386838c623a8a6b5011acf1097bf213d6a7a756b0b893c0cd577c`; run `000168-algorithm32-paper-n-order-j3-kider-b1-b2-b3-boundary`; model `proposed`; 1377 rows; 40 transported spectral channels; controls 40/20/34/48; W27/4374/Jthrough3).

Predeclared judgment rules: `C:\dev\flattened-steel\scripts\experiments\whole-algorithm-paper-j3-judgment-rules.json` (SHA-256 `02b4d61f4a78c85460b3d7cfa366eeec1b5cce16999d1499302775fdb2566495`).

## Algorithm32₄ (paper profile; cumulative scattering through order 4) comparative candidate stage

Status: **SCORED**.

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j4-proposed.tsv`

Input table SHA-256: `84916e87161d8ce7ba52eab15e7c053bd9cc39242bd72ae6fd5a014790ecc3c6`; bytes: 1180691.

### Algorithm32₄ (paper profile; cumulative scattering through order 4) metrics

| local time | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) | threshold classification |
| --- | ---: | ---: | --- |
| 09:30 | 13.089926 | 7.813006e-2 | reported |
| 09:45 | 11.561475 | 5.993083e-2 | reported |
| 10:00 | 11.147314 | 5.513078e-2 | reported |
| 10:15 | 10.359799 | 5.125506e-2 | favorable |
| 10:30 | 9.248141 | 4.342317e-2 | reported |
| 10:45 | 9.536291 | 6.203770e-2 | reported |
| 11:00 | 11.690647 | 9.902663e-2 | reported |
| 11:15 | 11.212044 | 8.012395e-2 | favorable |
| 11:30 | 9.788337 | 5.266153e-2 | reported |
| 11:45 | 9.954974 | 5.261288e-2 | reported |
| 12:00 | 10.184977 | 5.070127e-2 | reported |
| 12:15 | 15.427531 | 1.356933e-1 | reported |
| 12:30 | 18.242745 | 1.780205e-1 | reported |
| 12:45 | 12.269948 | 7.631907e-2 | reported |
| 13:00 | 11.457373 | 4.845680e-2 | reported |
| 13:15 | 11.577412 | 4.122824e-2 | favorable |
| 13:30 | 12.531893 | 4.724827e-2 | reported |

Candidate aggregate RMSE [Algorithm32-Paper-J4]: 11.925783 mW m^-2 sr^-1 nm^-1.
Algorithm32₄ (paper profile; cumulative scattering through order 4) boundary validity: passed (55080 finite values; 0 negative).

### Canonical B1 classification

Algorithm32₄ (paper profile; cumulative scattering through order 4) classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| Aggregate RMSE | 11.925783 | 18.300000 | 41.500000 | favorable |
| 10:15 RMSE | 10.359799 | 17.700000 | 39.900000 | favorable |
| 11:15 RMSE | 11.212044 | 18.700000 | 42.800000 | favorable |
| 13:15 RMSE | 11.577412 | 17.400000 | 40.500000 | favorable |

Verified candidate provenance: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j4-boundary-provenance.json` (SHA-256 `03d00239777291eb4e0a161210873afee06cc361b3f1f3f7ac333b36e9a07c5f`; run `000166-algorithm32-paper-n-order-j4-kider-b1-b2-b3-boundary`; model `proposed`; 1377 rows; 40 transported spectral channels; controls 40/20/34/48; W27/4374/Jthrough4).

Predeclared judgment rules: `C:\dev\flattened-steel\scripts\experiments\whole-algorithm-paper-j4-judgment-rules.json` (SHA-256 `f143268cdcbbe07b5192538fee472ef424ff6c6345e8461a4e277078474b8d05`).

## Algorithm32₅ (paper profile; cumulative scattering through order 5) comparative candidate stage

Status: **SCORED**.

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j5-proposed.tsv`

Input table SHA-256: `3d9302cd955af81281eecf791c51cf1d4570094fd1ec9e7255f0bb6b022016b6`; bytes: 1180521.

### Algorithm32₅ (paper profile; cumulative scattering through order 5) metrics

| local time | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) | threshold classification |
| --- | ---: | ---: | --- |
| 09:30 | 13.126223 | 7.799551e-2 | reported |
| 09:45 | 11.612410 | 5.999297e-2 | reported |
| 10:00 | 11.121760 | 5.519142e-2 | reported |
| 10:15 | 10.306556 | 5.150001e-2 | favorable |
| 10:30 | 9.269336 | 4.369552e-2 | reported |
| 10:45 | 9.494490 | 6.189668e-2 | reported |
| 11:00 | 11.586322 | 9.891766e-2 | reported |
| 11:15 | 11.120220 | 8.003775e-2 | favorable |
| 11:30 | 9.772376 | 5.272020e-2 | reported |
| 11:45 | 9.904346 | 5.266487e-2 | reported |
| 12:00 | 10.114977 | 5.095760e-2 | reported |
| 12:15 | 15.362238 | 1.356003e-1 | reported |
| 12:30 | 18.177109 | 1.779308e-1 | reported |
| 12:45 | 12.176791 | 7.622422e-2 | reported |
| 13:00 | 11.337438 | 4.865288e-2 | reported |
| 13:15 | 11.438180 | 4.088348e-2 | favorable |
| 13:30 | 12.414182 | 4.686369e-2 | reported |

Candidate aggregate RMSE [Algorithm32-Paper-J5]: 11.869640 mW m^-2 sr^-1 nm^-1.
Algorithm32₅ (paper profile; cumulative scattering through order 5) boundary validity: passed (55080 finite values; 0 negative).

### Canonical B1 classification

Algorithm32₅ (paper profile; cumulative scattering through order 5) classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| Aggregate RMSE | 11.869640 | 18.300000 | 41.500000 | favorable |
| 10:15 RMSE | 10.306556 | 17.700000 | 39.900000 | favorable |
| 11:15 RMSE | 11.120220 | 18.700000 | 42.800000 | favorable |
| 13:15 RMSE | 11.438180 | 17.400000 | 40.500000 | favorable |

Verified candidate provenance: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\algorithm32-paper-j5-boundary-provenance.json` (SHA-256 `3fa950e61e6152c75f50c17fe70bcf93f16df57b3aa69646d7917496454974a7`; run `000169-algorithm32-paper-n-order-j5-kider-b1-b2-b3-boundary`; model `proposed`; 1377 rows; 40 transported spectral channels; controls 40/20/34/48; W27/4374/Jthrough5).

Predeclared judgment rules: `C:\dev\flattened-steel\scripts\experiments\whole-algorithm-paper-j5-judgment-rules.json` (SHA-256 `9914e8ed14d8572b2314016d7099c75a2ac7da0644e9d749d00562444c8b12d7`).

## Candidate score comparison

| candidate | role | controls | aggregate RMSE (mW m^-2 sr^-1 nm^-1) | boundary | classification |
| --- | --- | --- | ---: | --- | --- |
| Algorithm32 Paper (published physical-input profile) | canonical paper-input profile | 40/20/34/48 | 16.101693 | valid | limited |
| Algorithm32₂ (paper profile; cumulative scattering through order 2) | comparative paper-input profile | 40/20/34/48; W27/4374/Jthrough2 | 14.153018 | valid | favorable |
| Algorithm32₃ (paper profile; cumulative scattering through order 3) | comparative paper-input profile | 40/20/34/48; W27/4374/Jthrough3 | 12.260324 | valid | favorable |
| Algorithm32₄ (paper profile; cumulative scattering through order 4) | comparative paper-input profile | 40/20/34/48; W27/4374/Jthrough4 | 11.925783 | valid | favorable |
| Algorithm32₅ (paper profile; cumulative scattering through order 5) | comparative paper-input profile | 40/20/34/48; W27/4374/Jthrough5 | 11.869640 | valid | favorable |

Algorithm32 Paper (published physical-input profile) is the family baseline. Algorithm32₂ (paper profile; cumulative scattering through order 2), Algorithm32₃ (paper profile; cumulative scattering through order 3), Algorithm32₄ (paper profile; cumulative scattering through order 4), Algorithm32₅ (paper profile; cumulative scattering through order 5) are separately generated cumulative n-order candidates evaluated under the same published observable and frozen comparator thresholds.

## Figure 5 relative-error visualization

The extended Figure 5 chart reuses the paper PDF's 27 embedded model-panel image XObjects unchanged across nine published columns and appends three Algorithm32 panels from the selected cumulative-J4 boundary: three locally generated panels and ten total columns. Default and J5 are omitted from the active figure while all five candidate boundaries remain scored in this report. The local panels use the pinned Figure 5 spherical bicubic interpolation, 41-color percentage palette, equidistant projection, fitted Sun marker, and 81 sample markers.

[Open the self-contained Figure 5 chart](figures/b1-figure5-relative-error-domes.svg).

| candidate | time | spectral RMSE (mW m^-2 sr^-1 nm^-1) | displayed | decoded RGBA SHA-256 | panel |
| --- | --- | ---: | ---: | --- | --- |
| Algorithm32 | 10:15 | 10.359799 | 10.4 | _recorded in generated chart metadata_ | [PNG](figures/b1-figure5-algorithm32-10h15-z41.png) |
| Algorithm32 | 11:15 | 11.212044 | 11.2 | _recorded in generated chart metadata_ | [PNG](figures/b1-figure5-algorithm32-11h15-z31.png) |
| Algorithm32 | 13:15 | 11.577412 | 11.6 | _recorded in generated chart metadata_ | [PNG](figures/b1-figure5-algorithm32-13h15-z21.png) |

The dome color is the relative error of band-integrated 360–720 nm directional radiance. The number below each dome is the separate 81-direction by 31-wavelength spectral RMSE. This visualization adds neither a new threshold nor another independent benchmark vote.

## Conclusion

Accepted. Algorithm32 Paper (published physical-input profile) is classified **limited**, Algorithm32₂ (paper profile; cumulative scattering through order 2) is classified **favorable**, Algorithm32₃ (paper profile; cumulative scattering through order 3) is classified **favorable**, Algorithm32₄ (paper profile; cumulative scattering through order 4) is classified **favorable**, Algorithm32₅ (paper profile; cumulative scattering through order 5) is classified **favorable** under independently pinned rules. All five complete boundaries were scored without changing the published observable or metric.
