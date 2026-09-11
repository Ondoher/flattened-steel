# B3 - Matched-Atmosphere Solver Benchmark

## Question

What directional spectral-radiance error do the proposed formulas produce against the same Kider measurements under the matched representable physical inputs, and how does that score compare with the paper's published libRadtran result?

## Inputs

```json
{
  "productionBoundary": {
    "schema": "algorithm32-current-production-benchmark-boundary-v1",
    "runId": "current-production-b1-gpu-shaders-20260911T182339616Z",
    "backend": "gpu-production-shaders-r32f",
    "productionRevision": "sha256:b9cb6142814132be78d841580f44f4f49b814de20820893d070e814bc8e3b7ab",
    "compilerIdentity": "algorithm32-production-shared-cache-generator",
    "assetSetIdentity": "algorithm32-b1-direct40-cache-set-sha256:19531e95cfca6a007a0bd72e2d73c7ea4855fd69a624e39b4e4009fa111d9f0c",
    "manifestPath": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\gpu\\manifest.json",
    "manifestSha256": "c0c2547cc9560b0d821dd7f2aa33a41e1fc6f8eb9f9a3867559edb71f5683147",
    "order": 4,
    "tableSha256": "20a8fdca9ab86d7dded9c832b1b3fb1ead18a0947a1951850008489ff1cd7010",
    "provenanceSha256": "b2a8aee6c87f4c729a6c7baf442b181e992fc209b35297f0e33bafe420331905",
    "cubeSha256": "04d2d9dcbcab6ac671b159adff4a8843161ba096dce05e8c42792ebaa78c3c9c"
  },
  "authorities": {
    "brunetonComparisonRevision": "4df2ec6609bc0127a478bd34fff29c94352579cc",
    "libRadtranVersion": "2.0.1"
  },
  "fixedAtmosphere": {
    "earthRadiusKm": 6360,
    "atmosphereTopKm": 60,
    "rayleighScaleHeightKm": 8,
    "aerosolScaleHeightKm": 1.2,
    "aerosolSingleScatteringAlbedo": 0.8,
    "aerosolPhaseFunction": "Cornette-Shanks",
    "rayleighAbsorption": 0,
    "rayleighDepolarization": 0,
    "groundBrdf": "Lambertian grass spectral albedo",
    "solarSpectrum": "40-bin ASTM G-173 extraterrestrial irradiance packet",
    "molecularScattering": "Penndorf 1957 at 15 C",
    "layerCount": 100,
    "phaseMomentCount": 20,
    "geometry": "pseudospherical",
    "outputProcess": "per_nm",
    "outputFields": [
      "lambda",
      "uu"
    ],
    "solverDirectiveInBrunetonDeck": "omitted",
    "resolvedSolverForLibRadtran201": "DISORT",
    "streamDirectiveInBrunetonDeck": "omitted",
    "resolvedRadianceStreamsForLibRadtran201": 16,
    "disortIntensityCorrection": "moments",
    "altitudeKm": 0
  },
  "publishedTargets": {
    "coarse": {
      "alpha": 0.8,
      "beta": 0.04,
      "g": 0.7,
      "rmseMilliwatt": 11.48
    },
    "refined": {
      "alpha": 0.816,
      "beta": 0.0384,
      "g": 0.704,
      "rmseMilliwatt": 11.45
    },
    "broadNearMinimumRegion": {
      "alpha": [
        0.6,
        0.9
      ],
      "beta": [
        0.038,
        0.042
      ],
      "g": [
        0.68,
        0.73
      ]
    },
    "twoPercentIsosurfaceRmseMilliwatt": 11.68
  },
  "axes": {
    "conditions": 17,
    "conditionRange": "09h30-13h30",
    "directions": 81,
    "fullWavelengthFormula": "lambda_i = 360 nm + i * 11.75 nm, i=0..39",
    "scoredWavelengthsNm": [
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
    "scoreShape": [
      17,
      81,
      31
    ]
  },
  "coarseGrid": {
    "alpha": [
      0,
      0.2,
      0.4,
      0.6,
      0.8,
      1,
      1.2,
      1.4,
      1.6,
      1.8,
      2
    ],
    "beta": [
      0.02,
      0.04,
      0.06,
      0.08,
      0.1,
      0.12,
      0.14,
      0.16,
      0.18,
      0.2
    ],
    "g": [
      0.5,
      0.6,
      0.7,
      0.8,
      0.9
    ],
    "caseCount": 550
  },
  "suppliedInputs": {
    "measurements": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\measurement-boundary.tsv",
      "sha256": "a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74",
      "bytes": 1168155
    },
    "proposedCube": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\gpu\\algorithm32-current-production-gpu-j4-cube.json",
      "sha256": "04d2d9dcbcab6ac671b159adff4a8843161ba096dce05e8c42792ebaa78c3c9c",
      "bytes": 1281531
    },
    "mismatchMap": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-mismatch-map.json",
      "sha256": "8f2bb573fe9f157ce624c9bfd07b02ece1f817e3cf4c008bbffcd06d25d2107b",
      "bytes": 1598
    },
    "judgmentRules": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-judgment-rules.json",
      "sha256": "d39313453bf1ade6a75fbf8f066404da902f7d7ab32f340c41750cdb2cf99062",
      "bytes": 4546
    },
    "b1Result": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\gpu\\result.md",
      "sha256": "f724ee2157405a4cb575caf52ff1127f7447537788d8434452e8fcd057961e82",
      "bytes": 13540,
      "candidateLabel": "Algorithm32-Paper",
      "aggregateRmseMilliwatt": 11.554014
    }
  },
  "durableArtifacts": {},
  "mismatchMap": {
    "schema": "algorithm32-b3-mismatch-map-v1",
    "subject": "Current-production cache-backed Algorithm32 Paper candidate evaluated with the published paper-comparison physical-input profile",
    "mismatches": [
      {
        "field": "ground reflection",
        "disposition": "Algorithm32 Paper has no ground-reflection contribution, while the matched libRadtran setup uses Lambertian grass spectral albedo. This remains an explicit scope limitation."
      },
      {
        "field": "multiple-scattering treatment",
        "disposition": "Algorithm32 Paper uses the production cumulative-through-order-4 incident-radiance approximation rather than libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality."
      },
      {
        "field": "incident angular quadrature",
        "disposition": "Algorithm32 Paper uses 34 pinned source-oriented equal-weight Fibonacci primary directions represented by the production reflection-completed 68-direction domain; the retained libRadtran DISORT calculation uses 16 streams."
      },
      {
        "field": "vertical and path discretization",
        "disposition": "Algorithm32 Paper uses analytic exponential density profiles, 48 physical altitude nodes, 30 quadratically distributed view-path intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls."
      },
      {
        "field": "geometry approximation",
        "disposition": "Algorithm32 Paper uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical."
      }
    ]
  },
  "mismatchMapJ2": null,
  "mismatchMapJ3": null,
  "mismatchMapJ4": null,
  "mismatchMapJ5": null,
  "judgmentRules": {
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1",
    "declaredOn": "2026-07-18",
    "declaredBeforeProposedResults": true,
    "subject": "Algorithm32 Paper CPU evaluation, direct 40-channel paper physical profile with Default 40/20/34/48 numerical controls",
    "profileSelection": "The content-addressed algorithm32-paper-comparison-v1 physical profile and direct 40-coordinate spectral boundary were fixed before this complete Kider B1/B2/B3 result. These rules copy the already frozen production Default comparator thresholds without tuning.",
    "spectralBoundary": {
      "nativeRepresentation": "40 point-sampled spectral-radiance-density channels at the paper coordinates lambda_i = 360 + 11.75*i nanometers for i=0..39",
      "benchmarkProjection": "Identity. Every transported Algorithm32 Paper channel is already one unchanged paper-comparison wavelength coordinate. No 15-to-40 hold, interpolation, source-specific correction, RGB conversion, or fitted scale is applied.",
      "reason": "This evaluates the Algorithm32 equations directly on the paper's physical spectral input and scoring coordinates while leaving the numerical method under test unchanged."
    },
    "b3MismatchBoundary": {
      "expectedFieldCount": 5,
      "expectedFields": [
        "ground reflection",
        "multiple-scattering treatment",
        "incident angular quadrature",
        "vertical and path discretization",
        "geometry approximation"
      ],
      "alignedFieldsNotDeclaredAsMismatches": [
        "spectral representation",
        "molecular-scattering parameterization",
        "observer altitude",
        "solar source treatment"
      ]
    },
    "publishedComparatorScale": {
      "b1AggregateRmseMilliwatt": {
        "favorableMedian": 18.3,
        "limitedUpperQuartile": 41.5
      },
      "b1Figure5RmseMilliwattByTime": {
        "10:15": {
          "favorableMedian": 17.7,
          "limitedUpperQuartile": 39.9
        },
        "11:15": {
          "favorableMedian": 18.7,
          "limitedUpperQuartile": 42.8
        },
        "13:15": {
          "favorableMedian": 17.4,
          "limitedUpperQuartile": 40.5
        }
      },
      "b2RmseWattsPerSquareMeter": {
        "favorableMedian": 12.0182815531215,
        "limitedUpperQuartile": 20.496807820233318
      },
      "b2AbsoluteBiasWattsPerSquareMeter": {
        "favorableMedian": 11.94158717515906,
        "limitedUpperQuartile": 20.44040293869519
      },
      "b2WorstAbsoluteResidualWattsPerSquareMeter": {
        "favorableMedian": 14.100659,
        "limitedUpperQuartile": 23.056024
      },
      "b2EvidenceQualification": "The B2 numeric comparator curves are optional reproductions from the pinned published comparison code because Figure 8 does not publish a numeric table."
    },
    "rules": [
      "Output validity requires all Algorithm32 Paper directional spectral-radiance samples and derived irradiances to be finite and nonnegative, with the complete 17-time by 81-direction boundary present.",
      "B1 is favorable when aggregate RMSE is no greater than the published-model median 18.3 mW m^-2 sr^-1 nm^-1 and all three printed Figure 5 times are no greater than their medians: 17.7 at 10:15, 18.7 at 11:15, and 17.4 at 13:15. B1 is limited when every corresponding value is no greater than the published-model upper quartile: 41.5 aggregate, 39.9, 42.8, and 40.5. It is adverse otherwise.",
      "B2 is favorable when RMSE, absolute bias, and worst absolute residual against the 17-point measured irradiance curve are no greater than the published-source-model medians 12.0182815531215, 11.94158717515906, and 14.100659 W m^-2. It is limited when all three are no greater than the upper-quartile values 20.496807820233318, 20.44040293869519, and 23.056024 W m^-2. It is adverse otherwise.",
      "B3 must reproduce B1's aggregate RMSE within 0.000001 mW m^-2 sr^-1 nm^-1 and must retain exactly the five predeclared genuine mismatch fields. It reports that same-measurement score beside the paper's published libRadtran values 11.48 coarse and 11.45 refined. B3 inherits B1's classification; it is context rather than a third independent acceptance vote and is not a pointwise libRadtran comparison.",
      "The whole-algorithm benchmark conclusion is favorable when output validity, B1, and B2 are favorable and B3 is consistent and fully mapped; limited when neither B1 nor B2 is adverse, at least one is limited, and B3 is consistent and fully mapped; and adverse when output validity fails, either B1 or B2 is adverse, B3 is inconsistent, or a material mismatch is concealed.",
      "No favorable classification establishes out-of-sample accuracy, flat-geometry accuracy, finite-local-source accuracy, ground-reflection accuracy, equality with libRadtran, or release adequacy. All five declared differences remain limitations."
    ]
  },
  "judgmentRulesJ2": null,
  "judgmentRulesJ3": null,
  "judgmentRulesJ4": null,
  "judgmentRulesJ5": null
}
```

## Iterations

Stage iterations: 4

| iteration | stage | status | detail |
| ---: | --- | --- | --- |
| 1 | Contract verification | passed | 11/11 pinned-contract checks passed. |
| 2 | Published benchmark reference | adopted | Adopted Bruneton's published coarse minimum alpha=0.8, beta=0.04, g=0.7, RMSE=11.48 mW/(m^2 sr nm), plus the published refined result, without requiring a local rerun of all 550 cases. |
| 3 | Algorithm32 Paper scoring | complete | Scored the Algorithm32 Paper 17x81x31 cube against the same Kider measurements: RMSE 11.554014 mW/(m^2 sr nm), versus the paper's published libRadtran 11.48. |
| 4 | B3 acceptance | accepted | The published benchmark reference was adopted and Algorithm32 Paper was scored under predeclared rules. |

## Contract verification

| check | accepted |
| --- | --- |
| pinned comparison source revision | yes |
| pinned libRadtran release | yes |
| 40-sample 360-830 source basis | yes |
| 31 scored wavelengths in 360-720 interval | yes |
| 17 measured conditions | yes |
| 17 fitted solar azimuths | yes |
| 81 Shirley-Chiu directions | yes |
| source-equivalent uvspec rectangular direction grid | yes |
| 11x10x5 coarse grid | yes |
| published coarse target occurs once | yes |
| resolved DISORT radiance defaults | yes |

## Proposed method versus Kider measurements - Algorithm32 Paper

| iteration | condition | samples | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) |
| ---: | --- | ---: | ---: | ---: |
| 1 | 09h30 | 2511 | 1.319146e+1 | 9.439434e-2 |
| 2 | 09h45 | 2511 | 1.064128e+1 | 5.664140e-2 |
| 3 | 10h00 | 2511 | 1.012101e+1 | 5.421739e-2 |
| 4 | 10h15 | 2511 | 9.098044e+0 | 5.099367e-2 |
| 5 | 10h30 | 2511 | 8.280009e+0 | 4.363924e-2 |
| 6 | 10h45 | 2511 | 9.343761e+0 | 7.542567e-2 |
| 7 | 11h00 | 2511 | 1.229128e+1 | 1.110834e-1 |
| 8 | 11h15 | 2511 | 1.076671e+1 | 9.143680e-2 |
| 9 | 11h30 | 2511 | 8.867563e+0 | 5.095313e-2 |
| 10 | 11h45 | 2511 | 8.735331e+0 | 5.314118e-2 |
| 11 | 12h00 | 2511 | 9.451456e+0 | 5.272267e-2 |
| 12 | 12h15 | 2511 | 1.564467e+1 | 1.489892e-1 |
| 13 | 12h30 | 2511 | 1.857671e+1 | 1.915373e-1 |
| 14 | 12h45 | 2511 | 1.230436e+1 | 8.769862e-2 |
| 15 | 13h00 | 2511 | 1.071656e+1 | 4.512775e-2 |
| 16 | 13h15 | 2511 | 1.122867e+1 | 3.834084e-2 |
| 17 | 13h30 | 2511 | 1.215121e+1 | 4.728410e-2 |

Aggregate: 42687 samples; RMSE 1.155401e+1 mW m^-2 sr^-1 nm^-1; maximum absolute residual 1.915373e-1 W m^-2 sr^-1 nm^-1.

## Published libRadtran comparison - Algorithm32-Paper

Algorithm32-Paper's measurement RMSE is 1.155401e+1 mW m^-2 sr^-1 nm^-1. The paper reports 11.48 for the matched libRadtran coarse result and 11.45 for its refined result. The candidate-minus-published-coarse difference is 7.401395e-2 mW m^-2 sr^-1 nm^-1, and the ratio is 1.006447e+0. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.

## Predeclared B3 classification - Algorithm32 Paper

Classification inherited from B1: **FAVORABLE**.

Durable B1 result: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\gpu\result.md` (SHA-256 `f724ee2157405a4cb575caf52ff1127f7447537788d8434452e8fcd057961e82`; 13540 bytes).

| consistency value | result |
| --- | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.155401e+1 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.155401e+1 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | -4.674239e-8 |
| permitted absolute difference | 1.000000e-6 |
| consistency result | passed |

Comparison-map completeness: **passed**; 5/5 required declarations supplied (5 mismatches; 0 matches).

| declared mismatch | disposition |
| --- | --- |
| ground reflection | Algorithm32 Paper has no ground-reflection contribution, while the matched libRadtran setup uses Lambertian grass spectral albedo. This remains an explicit scope limitation. |
| multiple-scattering treatment | Algorithm32 Paper uses the production cumulative-through-order-4 incident-radiance approximation rather than libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality. |
| incident angular quadrature | Algorithm32 Paper uses 34 pinned source-oriented equal-weight Fibonacci primary directions represented by the production reflection-completed 68-direction domain; the retained libRadtran DISORT calculation uses 16 streams. |
| vertical and path discretization | Algorithm32 Paper uses analytic exponential density profiles, 48 physical altitude nodes, 30 quadratically distributed view-path intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls. |
| geometry approximation | Algorithm32 Paper uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical. |

## Acceptance meaning

The paper and pinned comparison source are the authority for the published 550-case aerosol-search result; rerunning that search locally is an optional cross-check, not an acceptance prerequisite. Contract verification proves only that the runner encodes the published comparison boundary. A local fixed-case execution or supplied coarse table proves only the stated cross-check. Each candidate cube is independently scored against the same Kider measurements and its RMSE is placed beside the paper's published libRadtran RMSE; no candidate requires a locally regenerated libRadtran cube. Because the aerosol parameters were fitted to these measurements, these are in-sample comparisons rather than independent validation, and without a published pointwise libRadtran cube they do not establish sample-by-sample solver agreement. Each candidate requires its explicit mismatch map and pre-result judgment record. This official run selects only the authenticated current-production cumulative J4 boundary; the retained five-profile comparison is a separate workflow.

## Conclusion

Accepted. The published libRadtran benchmark and aerosol-search result were adopted as the external reference, and Algorithm32 Paper was scored against the same Kider measurements at the 17x81x31 directional spectral-radiance boundary under predeclared judgment rules. Its B3 classification remains **favorable** by inheritance from B1: its 1.155401e+1 mW m^-2 sr^-1 nm^-1 score agrees with durable B1 within 1.000000e-6, and the complete mismatch map records all 5 required declarations.
