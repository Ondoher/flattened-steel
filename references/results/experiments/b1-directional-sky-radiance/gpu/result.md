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

Input table: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\gpu\algorithm32-current-production-gpu-j4.tsv`

Input table SHA-256: `d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`; bytes: 1180809.

### Algorithm32 Paper (published physical-input profile) metrics

| local time | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) | threshold classification |
| --- | ---: | ---: | --- |
| 09:30 | 12.836926 | 7.829668e-2 | reported |
| 09:45 | 11.315242 | 5.950517e-2 | reported |
| 10:00 | 11.040177 | 5.470874e-2 | reported |
| 10:15 | 10.322954 | 5.109780e-2 | favorable |
| 10:30 | 9.188136 | 4.299147e-2 | reported |
| 10:45 | 9.513006 | 6.220244e-2 | reported |
| 11:00 | 11.797682 | 9.916119e-2 | reported |
| 11:15 | 11.301898 | 8.023313e-2 | favorable |
| 11:30 | 9.715355 | 5.261255e-2 | reported |
| 11:45 | 9.880972 | 5.253153e-2 | reported |
| 12:00 | 10.110572 | 5.045577e-2 | reported |
| 12:15 | 15.252470 | 1.357914e-1 | reported |
| 12:30 | 18.058182 | 1.781234e-1 | reported |
| 12:45 | 12.157365 | 7.641910e-2 | reported |
| 13:00 | 11.246285 | 4.835339e-2 | reported |
| 13:15 | 11.529090 | 3.806328e-2 | favorable |
| 13:30 | 12.327977 | 4.390303e-2 | reported |

Candidate aggregate RMSE [Algorithm32-Paper]: 11.820392 mW m^-2 sr^-1 nm^-1.
Algorithm32 Paper (published physical-input profile) boundary validity: passed (55080 finite values; 0 negative).

### Canonical B1 classification

Algorithm32 Paper (published physical-input profile) classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| Aggregate RMSE | 11.820392 | 18.300000 | 41.500000 | favorable |
| 10:15 RMSE | 10.322954 | 17.700000 | 39.900000 | favorable |
| 11:15 RMSE | 11.301898 | 18.700000 | 42.800000 | favorable |
| 13:15 RMSE | 11.529090 | 17.400000 | 40.500000 | favorable |

Verified candidate provenance: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\gpu\algorithm32-current-production-gpu-default-provenance.json` (SHA-256 `a88771c686a3067e07cecadab26a67d4e8659d9a076b056ae1ecc1e91a8770ac`; run `current-production-b1-gpu-shaders-20260813T022114257Z`; backend `gpu-production-shaders-r32f`; model `proposed`; 1377 rows; 40 transported spectral channels; controls 40/20/68/48; W27/4374/Jthrough4).

Predeclared judgment rules: `C:\dev\flattened-steel\scripts\experiments\whole-algorithm-paper-judgment-rules.json` (SHA-256 `fd4f61f649fc3ed1b549e7ce8b7267d98e4f8c0bc7c31123ac13280a35788e29`).

## N-order proposed-method stage

Status: **UNRUN**.

No independently supplied Algorithm32₂ (paper profile; cumulative scattering through order 2) spectra table was supplied. Whole-algorithm judgment rules must be fixed before this stage runs.

## N-order proposed-method stage

Status: **UNRUN**.

No independently supplied Algorithm32₃ (paper profile; cumulative scattering through order 3) spectra table was supplied. Whole-algorithm judgment rules must be fixed before this stage runs.

## N-order proposed-method stage

Status: **UNRUN**.

No independently supplied Algorithm32₄ (paper profile; cumulative scattering through order 4) spectra table was supplied. Whole-algorithm judgment rules must be fixed before this stage runs.

## N-order proposed-method stage

Status: **UNRUN**.

No independently supplied Algorithm32₅ (paper profile; cumulative scattering through order 5) spectra table was supplied. Whole-algorithm judgment rules must be fixed before this stage runs.

## Candidate score comparison

| candidate | role | controls | aggregate RMSE (mW m^-2 sr^-1 nm^-1) | boundary | classification |
| --- | --- | --- | ---: | --- | --- |
| Algorithm32 Paper (published physical-input profile) | canonical paper-input profile | 40/20/68/48; W27/4374/Jthrough4 | 11.820392 | valid | favorable |

## Conclusion

Accepted and classified **favorable** under the supplied rules. The paper values and pinned comparison source were adopted as the external benchmark, the complete proposed-method boundary was scored without changing its observable or metric, and all 17 per-time values plus the aggregate are reported. No Algorithm32 production-profile name is attached without a verified provenance sidecar.
