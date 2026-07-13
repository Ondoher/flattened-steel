# B3 - Matched-Atmosphere Solver Benchmark

## Question

What directional spectral-radiance error do the proposed formulas produce against the same Kider measurements under the matched representable physical inputs, and how does that score compare with the paper's published libRadtran result?

## Inputs

```json
{
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
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-proposed-cube.json",
      "sha256": "243c301241911f7d367b4cd41bb2a4cd0732173b2fc587c08572fc3dbaca0f82",
      "bytes": 876138
    },
    "mismatchMap": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-mismatch-map.json",
      "sha256": "b1f2a1a07974f2ad9e26a146ea5766872ffc5a04615b67ac53c8bfe0f7d87ac0",
      "bytes": 1536
    },
    "judgmentRules": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-judgment-rules.json",
      "sha256": "fd4f61f649fc3ed1b549e7ce8b7267d98e4f8c0bc7c31123ac13280a35788e29",
      "bytes": 4641
    },
    "b1Result": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\result.md",
      "sha256": "b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9",
      "bytes": 26239,
      "candidateLabel": "Algorithm32-Paper",
      "aggregateRmseMilliwatt": 16.101693
    },
    "proposedJ2Cube": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j2-proposed-cube.json",
      "sha256": "519e71add0295889442a24e7a92d9a77ed745b796a0375bde20ff5cb49b17452",
      "bytes": 874812
    },
    "mismatchMapJ2": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j2-mismatch-map.json",
      "sha256": "e8ce648724e0a62bf24875b25740b4ea21d60c4b02c47f1ae359334b8f1d2c74",
      "bytes": 1441
    },
    "judgmentRulesJ2": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j2-judgment-rules.json",
      "sha256": "572d1a408d157f1fcb23182d632e51706c84bce60f23759b06d33ddb7041ba5b",
      "bytes": 4630
    },
    "b1ResultJ2": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\result.md",
      "sha256": "b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9",
      "bytes": 26239,
      "candidateLabel": "Algorithm32-Paper-J2",
      "aggregateRmseMilliwatt": 14.153018
    },
    "proposedJ3Cube": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j3-proposed-cube.json",
      "sha256": "7b28c92c1db51ce8c92f2229d5a5df7b56382e0f316797b6aee8152f4adfbfff",
      "bytes": 874111
    },
    "mismatchMapJ3": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j3-mismatch-map.json",
      "sha256": "168307b2febc91bff39f4e7e7631fda96cdfc5dfb93ce3ac7ad6f17a8f9700a9",
      "bytes": 1446
    },
    "judgmentRulesJ3": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j3-judgment-rules.json",
      "sha256": "02b4d61f4a78c85460b3d7cfa366eeec1b5cce16999d1499302775fdb2566495",
      "bytes": 4630
    },
    "b1ResultJ3": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\result.md",
      "sha256": "b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9",
      "bytes": 26239,
      "candidateLabel": "Algorithm32-Paper-J3",
      "aggregateRmseMilliwatt": 12.260324
    },
    "proposedJ4Cube": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j4-proposed-cube.json",
      "sha256": "af71e302164deaee7c18ca8cb80d8276ab1f6c5bf85d7ace4648713424d19504",
      "bytes": 873433
    },
    "mismatchMapJ4": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j4-mismatch-map.json",
      "sha256": "e6231ea8084b87aaf49f8f84d804bec010544b8e0697ed56debe29e4f37b7b2e",
      "bytes": 1451
    },
    "judgmentRulesJ4": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j4-judgment-rules.json",
      "sha256": "f143268cdcbbe07b5192538fee472ef424ff6c6345e8461a4e277078474b8d05",
      "bytes": 4630
    },
    "b1ResultJ4": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\result.md",
      "sha256": "b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9",
      "bytes": 26239,
      "candidateLabel": "Algorithm32-Paper-J4",
      "aggregateRmseMilliwatt": 11.925783
    },
    "proposedJ5Cube": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j5-proposed-cube.json",
      "sha256": "f265e33664b779abc6dba5ebcee873e7973e166310eff8a5b27e6fc590a622b2",
      "bytes": 873453
    },
    "mismatchMapJ5": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\b3-matched-atmosphere-solver\\algorithm32-paper-j5-mismatch-map.json",
      "sha256": "e8b381d2f94c197bc53ede370f0db0cef42693843f92f29d670c8415a4917c4e",
      "bytes": 1456
    },
    "judgmentRulesJ5": {
      "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j5-judgment-rules.json",
      "sha256": "9914e8ed14d8572b2314016d7099c75a2ac7da0644e9d749d00562444c8b12d7",
      "bytes": 4630
    },
    "b1ResultJ5": {
      "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\result.md",
      "sha256": "b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9",
      "bytes": 26239,
      "candidateLabel": "Algorithm32-Paper-J5",
      "aggregateRmseMilliwatt": 11.86964
    }
  },
  "durableArtifacts": {},
  "mismatchMap": {
    "schema": "algorithm32-b3-mismatch-map-v1",
    "subject": "Algorithm32 Paper CPU candidate evaluated with the published paper-comparison physical-input profile",
    "mismatches": [
      {
        "field": "ground reflection",
        "disposition": "Algorithm32 Paper has no ground-reflection contribution, while the matched libRadtran setup uses Lambertian grass spectral albedo. This remains an explicit scope limitation."
      },
      {
        "field": "multiple-scattering treatment",
        "disposition": "Algorithm32 Paper uses the production Default second-order incident-radiance approximation rather than libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality."
      },
      {
        "field": "incident angular quadrature",
        "disposition": "Algorithm32 Paper uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature; the retained libRadtran DISORT calculation uses 16 streams."
      },
      {
        "field": "vertical and path discretization",
        "disposition": "Algorithm32 Paper uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls."
      },
      {
        "field": "geometry approximation",
        "disposition": "Algorithm32 Paper uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical."
      }
    ]
  },
  "mismatchMapJ2": {
    "schema": "algorithm32-b3-mismatch-map-v1",
    "subject": "Algorithm32 Paper J2 CPU candidate evaluated with the published paper-comparison physical-input profile",
    "mismatches": [
      {
        "field": "multiple-scattering treatment",
        "disposition": "Algorithm32 Paper J2 stores and integrates cumulative J1 + J2 scattering density and stops the recurrence after order 2 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality."
      },
      {
        "field": "incident angular quadrature",
        "disposition": "Algorithm32 Paper J2 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams."
      },
      {
        "field": "vertical and path discretization",
        "disposition": "Algorithm32 Paper J2 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls."
      },
      {
        "field": "geometry approximation",
        "disposition": "Algorithm32 Paper J2 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical."
      }
    ]
  },
  "mismatchMapJ3": {
    "schema": "algorithm32-b3-mismatch-map-v1",
    "subject": "Algorithm32 Paper J3 CPU candidate evaluated with the published paper-comparison physical-input profile",
    "mismatches": [
      {
        "field": "multiple-scattering treatment",
        "disposition": "Algorithm32 Paper J3 stores and integrates cumulative J1 + J2 + J3 scattering density and stops the recurrence after order 3 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality."
      },
      {
        "field": "incident angular quadrature",
        "disposition": "Algorithm32 Paper J3 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams."
      },
      {
        "field": "vertical and path discretization",
        "disposition": "Algorithm32 Paper J3 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls."
      },
      {
        "field": "geometry approximation",
        "disposition": "Algorithm32 Paper J3 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical."
      }
    ]
  },
  "mismatchMapJ4": {
    "schema": "algorithm32-b3-mismatch-map-v1",
    "subject": "Algorithm32 Paper J4 CPU candidate evaluated with the published paper-comparison physical-input profile",
    "mismatches": [
      {
        "field": "multiple-scattering treatment",
        "disposition": "Algorithm32 Paper J4 stores and integrates cumulative J1 + J2 + J3 + J4 scattering density and stops the recurrence after order 4 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality."
      },
      {
        "field": "incident angular quadrature",
        "disposition": "Algorithm32 Paper J4 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams."
      },
      {
        "field": "vertical and path discretization",
        "disposition": "Algorithm32 Paper J4 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls."
      },
      {
        "field": "geometry approximation",
        "disposition": "Algorithm32 Paper J4 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical."
      }
    ]
  },
  "mismatchMapJ5": {
    "schema": "algorithm32-b3-mismatch-map-v1",
    "subject": "Algorithm32 Paper J5 CPU candidate evaluated with the published paper-comparison physical-input profile",
    "mismatches": [
      {
        "field": "multiple-scattering treatment",
        "disposition": "Algorithm32 Paper J5 stores and integrates cumulative J1 + J2 + J3 + J4 + J5 scattering density and stops the recurrence after order 5 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality."
      },
      {
        "field": "incident angular quadrature",
        "disposition": "Algorithm32 Paper J5 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams."
      },
      {
        "field": "vertical and path discretization",
        "disposition": "Algorithm32 Paper J5 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls."
      },
      {
        "field": "geometry approximation",
        "disposition": "Algorithm32 Paper J5 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical."
      }
    ]
  },
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
  "judgmentRulesJ2": {
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1",
    "declaredOn": "2026-07-18",
    "declaredBeforeProposedResults": true,
    "subject": "Algorithm32 Paper J2 n-order CPU candidate, direct 40-channel paper physical profile with W27 cumulative scattering through order 2",
    "profileSelection": "The content-addressed algorithm32-paper-comparison-v1 physical profile, direct 40-coordinate spectral boundary, and Jthrough2 numerical identity were fixed before this complete Kider B1/B2/B3 result. These rules copy the already frozen production Default comparator thresholds without tuning.",
    "spectralBoundary": {
      "nativeRepresentation": "40 point-sampled spectral-radiance-density channels at the paper coordinates lambda_i = 360 + 11.75*i nanometers for i=0..39",
      "benchmarkProjection": "Identity. Every transported Algorithm32 Paper J2 channel is already one unchanged paper-comparison wavelength coordinate. No 15-to-40 hold, interpolation, source-specific correction, RGB conversion, or fitted scale is applied.",
      "reason": "This evaluates the Algorithm32 J2 equations directly on the paper's physical spectral input and scoring coordinates while leaving the numerical method under test unchanged."
    },
    "b3MismatchBoundary": {
      "expectedFieldCount": 4,
      "expectedFields": [
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
      "Output validity requires all Algorithm32 Paper J2 directional spectral-radiance samples and derived irradiances to be finite and nonnegative, with the complete 17-time by 81-direction boundary present.",
      "B1 is favorable when aggregate RMSE is no greater than the published-model median 18.3 mW m^-2 sr^-1 nm^-1 and all three printed Figure 5 times are no greater than their medians: 17.7 at 10:15, 18.7 at 11:15, and 17.4 at 13:15. B1 is limited when every corresponding value is no greater than the published-model upper quartile: 41.5 aggregate, 39.9, 42.8, and 40.5. It is adverse otherwise.",
      "B2 is favorable when RMSE, absolute bias, and worst absolute residual against the 17-point measured irradiance curve are no greater than the published-source-model medians 12.0182815531215, 11.94158717515906, and 14.100659 W m^-2. It is limited when all three are no greater than the upper-quartile values 20.496807820233318, 20.44040293869519, and 23.056024 W m^-2. It is adverse otherwise.",
      "B3 must reproduce B1's aggregate RMSE within 0.000001 mW m^-2 sr^-1 nm^-1 and must retain exactly the five predeclared genuine mismatch fields. It reports that same-measurement score beside the paper's published libRadtran values 11.48 coarse and 11.45 refined. B3 inherits B1's classification; it is context rather than a third independent acceptance vote and is not a pointwise libRadtran comparison.",
      "The whole-algorithm benchmark conclusion is favorable when output validity, B1, and B2 are favorable and B3 is consistent and fully mapped; limited when neither B1 nor B2 is adverse, at least one is limited, and B3 is consistent and fully mapped; and adverse when output validity fails, either B1 or B2 is adverse, B3 is inconsistent, or a material mismatch is concealed.",
      "No favorable classification establishes out-of-sample accuracy, flat-geometry accuracy, finite-local-source accuracy, ground-reflection accuracy, equality with libRadtran, convergence beyond J2, or release adequacy. All five declared differences remain limitations."
    ]
  },
  "judgmentRulesJ3": {
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1",
    "declaredOn": "2026-07-18",
    "declaredBeforeProposedResults": true,
    "subject": "Algorithm32 Paper J3 n-order CPU candidate, direct 40-channel paper physical profile with W27 cumulative scattering through order 3",
    "profileSelection": "The content-addressed algorithm32-paper-comparison-v1 physical profile, direct 40-coordinate spectral boundary, and Jthrough3 numerical identity were fixed before this complete Kider B1/B2/B3 result. These rules copy the already frozen production Default comparator thresholds without tuning.",
    "spectralBoundary": {
      "nativeRepresentation": "40 point-sampled spectral-radiance-density channels at the paper coordinates lambda_i = 360 + 11.75*i nanometers for i=0..39",
      "benchmarkProjection": "Identity. Every transported Algorithm32 Paper J3 channel is already one unchanged paper-comparison wavelength coordinate. No 15-to-40 hold, interpolation, source-specific correction, RGB conversion, or fitted scale is applied.",
      "reason": "This evaluates the Algorithm32 J3 equations directly on the paper's physical spectral input and scoring coordinates while leaving the numerical method under test unchanged."
    },
    "b3MismatchBoundary": {
      "expectedFieldCount": 4,
      "expectedFields": [
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
      "Output validity requires all Algorithm32 Paper J3 directional spectral-radiance samples and derived irradiances to be finite and nonnegative, with the complete 17-time by 81-direction boundary present.",
      "B1 is favorable when aggregate RMSE is no greater than the published-model median 18.3 mW m^-2 sr^-1 nm^-1 and all three printed Figure 5 times are no greater than their medians: 17.7 at 10:15, 18.7 at 11:15, and 17.4 at 13:15. B1 is limited when every corresponding value is no greater than the published-model upper quartile: 41.5 aggregate, 39.9, 42.8, and 40.5. It is adverse otherwise.",
      "B2 is favorable when RMSE, absolute bias, and worst absolute residual against the 17-point measured irradiance curve are no greater than the published-source-model medians 12.0182815531215, 11.94158717515906, and 14.100659 W m^-2. It is limited when all three are no greater than the upper-quartile values 20.496807820233318, 20.44040293869519, and 23.056024 W m^-2. It is adverse otherwise.",
      "B3 must reproduce B1's aggregate RMSE within 0.000001 mW m^-2 sr^-1 nm^-1 and must retain exactly the five predeclared genuine mismatch fields. It reports that same-measurement score beside the paper's published libRadtran values 11.48 coarse and 11.45 refined. B3 inherits B1's classification; it is context rather than a third independent acceptance vote and is not a pointwise libRadtran comparison.",
      "The whole-algorithm benchmark conclusion is favorable when output validity, B1, and B2 are favorable and B3 is consistent and fully mapped; limited when neither B1 nor B2 is adverse, at least one is limited, and B3 is consistent and fully mapped; and adverse when output validity fails, either B1 or B2 is adverse, B3 is inconsistent, or a material mismatch is concealed.",
      "No favorable classification establishes out-of-sample accuracy, flat-geometry accuracy, finite-local-source accuracy, ground-reflection accuracy, equality with libRadtran, convergence beyond J3, or release adequacy. All five declared differences remain limitations."
    ]
  },
  "judgmentRulesJ4": {
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1",
    "declaredOn": "2026-07-18",
    "declaredBeforeProposedResults": true,
    "subject": "Algorithm32 Paper J4 n-order CPU candidate, direct 40-channel paper physical profile with W27 cumulative scattering through order 4",
    "profileSelection": "The content-addressed algorithm32-paper-comparison-v1 physical profile, direct 40-coordinate spectral boundary, and Jthrough4 numerical identity were fixed before this complete Kider B1/B2/B3 result. These rules copy the already frozen production Default comparator thresholds without tuning.",
    "spectralBoundary": {
      "nativeRepresentation": "40 point-sampled spectral-radiance-density channels at the paper coordinates lambda_i = 360 + 11.75*i nanometers for i=0..39",
      "benchmarkProjection": "Identity. Every transported Algorithm32 Paper J4 channel is already one unchanged paper-comparison wavelength coordinate. No 15-to-40 hold, interpolation, source-specific correction, RGB conversion, or fitted scale is applied.",
      "reason": "This evaluates the Algorithm32 J4 equations directly on the paper's physical spectral input and scoring coordinates while leaving the numerical method under test unchanged."
    },
    "b3MismatchBoundary": {
      "expectedFieldCount": 4,
      "expectedFields": [
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
      "Output validity requires all Algorithm32 Paper J4 directional spectral-radiance samples and derived irradiances to be finite and nonnegative, with the complete 17-time by 81-direction boundary present.",
      "B1 is favorable when aggregate RMSE is no greater than the published-model median 18.3 mW m^-2 sr^-1 nm^-1 and all three printed Figure 5 times are no greater than their medians: 17.7 at 10:15, 18.7 at 11:15, and 17.4 at 13:15. B1 is limited when every corresponding value is no greater than the published-model upper quartile: 41.5 aggregate, 39.9, 42.8, and 40.5. It is adverse otherwise.",
      "B2 is favorable when RMSE, absolute bias, and worst absolute residual against the 17-point measured irradiance curve are no greater than the published-source-model medians 12.0182815531215, 11.94158717515906, and 14.100659 W m^-2. It is limited when all three are no greater than the upper-quartile values 20.496807820233318, 20.44040293869519, and 23.056024 W m^-2. It is adverse otherwise.",
      "B3 must reproduce B1's aggregate RMSE within 0.000001 mW m^-2 sr^-1 nm^-1 and must retain exactly the five predeclared genuine mismatch fields. It reports that same-measurement score beside the paper's published libRadtran values 11.48 coarse and 11.45 refined. B3 inherits B1's classification; it is context rather than a third independent acceptance vote and is not a pointwise libRadtran comparison.",
      "The whole-algorithm benchmark conclusion is favorable when output validity, B1, and B2 are favorable and B3 is consistent and fully mapped; limited when neither B1 nor B2 is adverse, at least one is limited, and B3 is consistent and fully mapped; and adverse when output validity fails, either B1 or B2 is adverse, B3 is inconsistent, or a material mismatch is concealed.",
      "No favorable classification establishes out-of-sample accuracy, flat-geometry accuracy, finite-local-source accuracy, ground-reflection accuracy, equality with libRadtran, convergence beyond J4, or release adequacy. All five declared differences remain limitations."
    ]
  },
  "judgmentRulesJ5": {
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1",
    "declaredOn": "2026-07-18",
    "declaredBeforeProposedResults": true,
    "subject": "Algorithm32 Paper J5 n-order CPU candidate, direct 40-channel paper physical profile with W27 cumulative scattering through order 5",
    "profileSelection": "The content-addressed algorithm32-paper-comparison-v1 physical profile, direct 40-coordinate spectral boundary, and Jthrough5 numerical identity were fixed before this complete Kider B1/B2/B3 result. These rules copy the already frozen production Default comparator thresholds without tuning.",
    "spectralBoundary": {
      "nativeRepresentation": "40 point-sampled spectral-radiance-density channels at the paper coordinates lambda_i = 360 + 11.75*i nanometers for i=0..39",
      "benchmarkProjection": "Identity. Every transported Algorithm32 Paper J5 channel is already one unchanged paper-comparison wavelength coordinate. No 15-to-40 hold, interpolation, source-specific correction, RGB conversion, or fitted scale is applied.",
      "reason": "This evaluates the Algorithm32 J5 equations directly on the paper's physical spectral input and scoring coordinates while leaving the numerical method under test unchanged."
    },
    "b3MismatchBoundary": {
      "expectedFieldCount": 4,
      "expectedFields": [
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
      "Output validity requires all Algorithm32 Paper J5 directional spectral-radiance samples and derived irradiances to be finite and nonnegative, with the complete 17-time by 81-direction boundary present.",
      "B1 is favorable when aggregate RMSE is no greater than the published-model median 18.3 mW m^-2 sr^-1 nm^-1 and all three printed Figure 5 times are no greater than their medians: 17.7 at 10:15, 18.7 at 11:15, and 17.4 at 13:15. B1 is limited when every corresponding value is no greater than the published-model upper quartile: 41.5 aggregate, 39.9, 42.8, and 40.5. It is adverse otherwise.",
      "B2 is favorable when RMSE, absolute bias, and worst absolute residual against the 17-point measured irradiance curve are no greater than the published-source-model medians 12.0182815531215, 11.94158717515906, and 14.100659 W m^-2. It is limited when all three are no greater than the upper-quartile values 20.496807820233318, 20.44040293869519, and 23.056024 W m^-2. It is adverse otherwise.",
      "B3 must reproduce B1's aggregate RMSE within 0.000001 mW m^-2 sr^-1 nm^-1 and must retain exactly the five predeclared genuine mismatch fields. It reports that same-measurement score beside the paper's published libRadtran values 11.48 coarse and 11.45 refined. B3 inherits B1's classification; it is context rather than a third independent acceptance vote and is not a pointwise libRadtran comparison.",
      "The whole-algorithm benchmark conclusion is favorable when output validity, B1, and B2 are favorable and B3 is consistent and fully mapped; limited when neither B1 nor B2 is adverse, at least one is limited, and B3 is consistent and fully mapped; and adverse when output validity fails, either B1 or B2 is adverse, B3 is inconsistent, or a material mismatch is concealed.",
      "No favorable classification establishes out-of-sample accuracy, flat-geometry accuracy, finite-local-source accuracy, ground-reflection accuracy, equality with libRadtran, convergence beyond J5, or release adequacy. All five declared differences remain limitations."
    ]
  }
}
```

## Iterations

Stage iterations: 11

| iteration | stage | status | detail |
| ---: | --- | --- | --- |
| 1 | Contract verification | passed | 11/11 pinned-contract checks passed. |
| 2 | Published benchmark reference | adopted | Adopted Bruneton's published coarse minimum alpha=0.8, beta=0.04, g=0.7, RMSE=11.48 mW/(m^2 sr nm), plus the published refined result, without requiring a local rerun of all 550 cases. |
| 3 | Fixed-parameter reference cases | not-run | Needs --uvspec, --external-output, or --reference-cube. No solver output was fabricated. |
| 4 | Published fixed-target score | not-run | Optional cross-check needs both --measurements and a complete local libRadtran reference cube. |
| 5 | Optional local coarse-search cross-check | not-run | The exact 550-case grid is represented, but no externally computed complete table was supplied. |
| 6 | Algorithm32 Paper scoring | complete | Scored the Algorithm32 Paper 17x81x31 cube against the same Kider measurements: RMSE 16.101693 mW/(m^2 sr nm), versus the paper's published libRadtran 11.48. |
| 7 | Algorithm32 Paper J2 comparative scoring | complete | Independently scored the W27 cumulative-through-order-2 17x81x31 cube against the same Kider measurements: RMSE 14.153018 mW/(m^2 sr nm), versus the paper's published libRadtran 11.48. |
| 8 | Algorithm32 Paper J3 comparative scoring | complete | Independently scored the W27 cumulative-through-order-3 17x81x31 cube against the same Kider measurements: RMSE 12.260324 mW/(m^2 sr nm), versus the paper's published libRadtran 11.48. |
| 9 | Algorithm32 Paper J4 comparative scoring | complete | Independently scored the W27 cumulative-through-order-4 17x81x31 cube against the same Kider measurements: RMSE 11.925783 mW/(m^2 sr nm), versus the paper's published libRadtran 11.48. |
| 10 | Algorithm32 Paper J5 comparative scoring | complete | Independently scored the W27 cumulative-through-order-5 17x81x31 cube against the same Kider measurements: RMSE 11.869640 mW/(m^2 sr nm), versus the paper's published libRadtran 11.48. |
| 11 | B3 acceptance | accepted | The published benchmark reference was adopted and Algorithm32 Paper was scored under predeclared rules. Algorithm32 Paper J2 was also independently scored. Algorithm32 Paper J3 was also independently scored. Algorithm32 Paper J4 was also independently scored. Algorithm32 Paper J5 was also independently scored. |

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
| 1 | 09h30 | 2511 | 1.442933e+1 | 9.759693e-2 |
| 2 | 09h45 | 2511 | 1.288108e+1 | 4.280248e-2 |
| 3 | 10h00 | 2511 | 1.333293e+1 | 4.550714e-2 |
| 4 | 10h15 | 2511 | 1.339144e+1 | 4.473705e-2 |
| 5 | 10h30 | 2511 | 1.345626e+1 | 4.022977e-2 |
| 6 | 10h45 | 2511 | 1.469585e+1 | 7.974047e-2 |
| 7 | 11h00 | 2511 | 1.659757e+1 | 1.132690e-1 |
| 8 | 11h15 | 2511 | 1.584715e+1 | 9.667341e-2 |
| 9 | 11h30 | 2511 | 1.400006e+1 | 4.032398e-2 |
| 10 | 11h45 | 2511 | 1.412496e+1 | 4.031137e-2 |
| 11 | 12h00 | 2511 | 1.470938e+1 | 4.320392e-2 |
| 12 | 12h15 | 2511 | 1.995482e+1 | 1.515512e-1 |
| 13 | 12h30 | 2511 | 2.261930e+1 | 1.921606e-1 |
| 14 | 12h45 | 2511 | 1.756264e+1 | 9.069535e-2 |
| 15 | 13h00 | 2511 | 1.689740e+1 | 5.143671e-2 |
| 16 | 13h15 | 2511 | 1.741426e+1 | 5.322547e-2 |
| 17 | 13h30 | 2511 | 1.826709e+1 | 5.891907e-2 |

Aggregate: 42687 samples; RMSE 1.610169e+1 mW m^-2 sr^-1 nm^-1; maximum absolute residual 1.921606e-1 W m^-2 sr^-1 nm^-1.

## Proposed method versus Kider measurements - Algorithm32 Paper J2

| iteration | condition | samples | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) |
| ---: | --- | ---: | ---: | ---: |
| 1 | 09h30 | 2511 | 1.404598e+1 | 8.156474e-2 |
| 2 | 09h45 | 2511 | 1.278386e+1 | 5.824827e-2 |
| 3 | 10h00 | 2511 | 1.279757e+1 | 5.346776e-2 |
| 4 | 10h15 | 2511 | 1.232282e+1 | 4.952951e-2 |
| 5 | 10h30 | 2511 | 1.150557e+1 | 4.091319e-2 |
| 6 | 10h45 | 2511 | 1.214165e+1 | 6.432023e-2 |
| 7 | 11h00 | 2511 | 1.415793e+1 | 1.012552e-1 |
| 8 | 11h15 | 2511 | 1.358349e+1 | 8.221882e-2 |
| 9 | 11h30 | 2511 | 1.224209e+1 | 5.165015e-2 |
| 10 | 11h45 | 2511 | 1.244060e+1 | 5.163053e-2 |
| 11 | 12h00 | 2511 | 1.276335e+1 | 4.894589e-2 |
| 12 | 12h15 | 2511 | 1.753504e+1 | 1.373066e-1 |
| 13 | 12h30 | 2511 | 2.017300e+1 | 1.796705e-1 |
| 14 | 12h45 | 2511 | 1.499949e+1 | 7.799966e-2 |
| 15 | 13h00 | 2511 | 1.435364e+1 | 4.628765e-2 |
| 16 | 13h15 | 2511 | 1.461422e+1 | 4.686799e-2 |
| 17 | 13h30 | 2511 | 1.541354e+1 | 5.266063e-2 |

Aggregate: 42687 samples; RMSE 1.415302e+1 mW m^-2 sr^-1 nm^-1; maximum absolute residual 1.796705e-1 W m^-2 sr^-1 nm^-1.

## Proposed method versus Kider measurements - Algorithm32 Paper J3

| iteration | condition | samples | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) |
| ---: | --- | ---: | ---: | ---: |
| 1 | 09h30 | 2511 | 1.312339e+1 | 7.866624e-2 |
| 2 | 09h45 | 2511 | 1.162415e+1 | 5.968770e-2 |
| 3 | 10h00 | 2511 | 1.134738e+1 | 5.488324e-2 |
| 4 | 10h15 | 2511 | 1.063620e+1 | 5.048582e-2 |
| 5 | 10h30 | 2511 | 9.493075e+0 | 4.281763e-2 |
| 6 | 10h45 | 2511 | 9.915975e+0 | 6.245439e-2 |
| 7 | 11h00 | 2511 | 1.210617e+1 | 9.941064e-2 |
| 8 | 11h15 | 2511 | 1.159839e+1 | 8.046212e-2 |
| 9 | 11h30 | 2511 | 1.012835e+1 | 5.249176e-2 |
| 10 | 11h45 | 2511 | 1.033080e+1 | 5.245351e-2 |
| 11 | 12h00 | 2511 | 1.059708e+1 | 4.993500e-2 |
| 12 | 12h15 | 2511 | 1.576782e+1 | 1.359726e-1 |
| 13 | 12h30 | 2511 | 1.855332e+1 | 1.783067e-1 |
| 14 | 12h45 | 2511 | 1.272607e+1 | 7.662023e-2 |
| 15 | 13h00 | 2511 | 1.196540e+1 | 4.780725e-2 |
| 16 | 13h15 | 2511 | 1.212863e+1 | 4.236133e-2 |
| 17 | 13h30 | 2511 | 1.303524e+1 | 4.837841e-2 |

Aggregate: 42687 samples; RMSE 1.226032e+1 mW m^-2 sr^-1 nm^-1; maximum absolute residual 1.783067e-1 W m^-2 sr^-1 nm^-1.

## Proposed method versus Kider measurements - Algorithm32 Paper J4

| iteration | condition | samples | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) |
| ---: | --- | ---: | ---: | ---: |
| 1 | 09h30 | 2511 | 1.308993e+1 | 7.813006e-2 |
| 2 | 09h45 | 2511 | 1.156147e+1 | 5.993083e-2 |
| 3 | 10h00 | 2511 | 1.114731e+1 | 5.513078e-2 |
| 4 | 10h15 | 2511 | 1.035980e+1 | 5.125506e-2 |
| 5 | 10h30 | 2511 | 9.248141e+0 | 4.342317e-2 |
| 6 | 10h45 | 2511 | 9.536291e+0 | 6.203770e-2 |
| 7 | 11h00 | 2511 | 1.169065e+1 | 9.902663e-2 |
| 8 | 11h15 | 2511 | 1.121204e+1 | 8.012395e-2 |
| 9 | 11h30 | 2511 | 9.788337e+0 | 5.266153e-2 |
| 10 | 11h45 | 2511 | 9.954974e+0 | 5.261288e-2 |
| 11 | 12h00 | 2511 | 1.018498e+1 | 5.070127e-2 |
| 12 | 12h15 | 2511 | 1.542753e+1 | 1.356933e-1 |
| 13 | 12h30 | 2511 | 1.824275e+1 | 1.780205e-1 |
| 14 | 12h45 | 2511 | 1.226995e+1 | 7.631907e-2 |
| 15 | 13h00 | 2511 | 1.145737e+1 | 4.845680e-2 |
| 16 | 13h15 | 2511 | 1.157741e+1 | 4.122824e-2 |
| 17 | 13h30 | 2511 | 1.253189e+1 | 4.724827e-2 |

Aggregate: 42687 samples; RMSE 1.192578e+1 mW m^-2 sr^-1 nm^-1; maximum absolute residual 1.780205e-1 W m^-2 sr^-1 nm^-1.

## Proposed method versus Kider measurements - Algorithm32 Paper J5

| iteration | condition | samples | RMSE (mW m^-2 sr^-1 nm^-1) | maximum absolute residual (W m^-2 sr^-1 nm^-1) |
| ---: | --- | ---: | ---: | ---: |
| 1 | 09h30 | 2511 | 1.312622e+1 | 7.799551e-2 |
| 2 | 09h45 | 2511 | 1.161241e+1 | 5.999297e-2 |
| 3 | 10h00 | 2511 | 1.112176e+1 | 5.519142e-2 |
| 4 | 10h15 | 2511 | 1.030656e+1 | 5.150001e-2 |
| 5 | 10h30 | 2511 | 9.269336e+0 | 4.369552e-2 |
| 6 | 10h45 | 2511 | 9.494490e+0 | 6.189668e-2 |
| 7 | 11h00 | 2511 | 1.158632e+1 | 9.891766e-2 |
| 8 | 11h15 | 2511 | 1.112022e+1 | 8.003775e-2 |
| 9 | 11h30 | 2511 | 9.772376e+0 | 5.272020e-2 |
| 10 | 11h45 | 2511 | 9.904346e+0 | 5.266487e-2 |
| 11 | 12h00 | 2511 | 1.011498e+1 | 5.095760e-2 |
| 12 | 12h15 | 2511 | 1.536224e+1 | 1.356003e-1 |
| 13 | 12h30 | 2511 | 1.817711e+1 | 1.779308e-1 |
| 14 | 12h45 | 2511 | 1.217679e+1 | 7.622422e-2 |
| 15 | 13h00 | 2511 | 1.133744e+1 | 4.865288e-2 |
| 16 | 13h15 | 2511 | 1.143818e+1 | 4.088348e-2 |
| 17 | 13h30 | 2511 | 1.241418e+1 | 4.686369e-2 |

Aggregate: 42687 samples; RMSE 1.186964e+1 mW m^-2 sr^-1 nm^-1; maximum absolute residual 1.779308e-1 W m^-2 sr^-1 nm^-1.

## Published libRadtran comparison - Algorithm32-Paper

Algorithm32-Paper's measurement RMSE is 1.610169e+1 mW m^-2 sr^-1 nm^-1. The paper reports 11.48 for the matched libRadtran coarse result and 11.45 for its refined result. The candidate-minus-published-coarse difference is 4.621693e+0 mW m^-2 sr^-1 nm^-1, and the ratio is 1.402587e+0. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.

## Published libRadtran comparison - Algorithm32-Paper-J2

Algorithm32-Paper-J2's measurement RMSE is 1.415302e+1 mW m^-2 sr^-1 nm^-1. The paper reports 11.48 for the matched libRadtran coarse result and 11.45 for its refined result. The candidate-minus-published-coarse difference is 2.673018e+0 mW m^-2 sr^-1 nm^-1, and the ratio is 1.232841e+0. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.

## Published libRadtran comparison - Algorithm32-Paper-J3

Algorithm32-Paper-J3's measurement RMSE is 1.226032e+1 mW m^-2 sr^-1 nm^-1. The paper reports 11.48 for the matched libRadtran coarse result and 11.45 for its refined result. The candidate-minus-published-coarse difference is 7.803240e-1 mW m^-2 sr^-1 nm^-1, and the ratio is 1.067972e+0. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.

## Published libRadtran comparison - Algorithm32-Paper-J4

Algorithm32-Paper-J4's measurement RMSE is 1.192578e+1 mW m^-2 sr^-1 nm^-1. The paper reports 11.48 for the matched libRadtran coarse result and 11.45 for its refined result. The candidate-minus-published-coarse difference is 4.457830e-1 mW m^-2 sr^-1 nm^-1, and the ratio is 1.038831e+0. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.

## Published libRadtran comparison - Algorithm32-Paper-J5

Algorithm32-Paper-J5's measurement RMSE is 1.186964e+1 mW m^-2 sr^-1 nm^-1. The paper reports 11.48 for the matched libRadtran coarse result and 11.45 for its refined result. The candidate-minus-published-coarse difference is 3.896398e-1 mW m^-2 sr^-1 nm^-1, and the ratio is 1.033941e+0. These are scores against the same measurements, not a sample-by-sample candidate-versus-libRadtran residual.

## Predeclared B3 classification - Algorithm32 Paper

Classification inherited from B1: **LIMITED**.

Durable B1 result: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\result.md` (SHA-256 `b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9`; 26239 bytes).

| consistency value | result |
| --- | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.610169e+1 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.610169e+1 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | 2.025534e-7 |
| permitted absolute difference | 1.000000e-6 |
| consistency result | passed |

Comparison-map completeness: **passed**; 5/5 required declarations supplied (5 mismatches; 0 matches).

| declared mismatch | disposition |
| --- | --- |
| ground reflection | Algorithm32 Paper has no ground-reflection contribution, while the matched libRadtran setup uses Lambertian grass spectral albedo. This remains an explicit scope limitation. |
| multiple-scattering treatment | Algorithm32 Paper uses the production Default second-order incident-radiance approximation rather than libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality. |
| incident angular quadrature | Algorithm32 Paper uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature; the retained libRadtran DISORT calculation uses 16 streams. |
| vertical and path discretization | Algorithm32 Paper uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls. |
| geometry approximation | Algorithm32 Paper uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical. |

## Predeclared B3 classification - Algorithm32 Paper J2

Classification inherited from B1: **FAVORABLE**.

Durable B1 result: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\result.md` (SHA-256 `b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9`; 26239 bytes).

| consistency value | result |
| --- | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.415302e+1 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.415302e+1 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | 2.703108e-7 |
| permitted absolute difference | 1.000000e-6 |
| consistency result | passed |

Comparison-map completeness: **passed**; 4/4 required declarations supplied (4 mismatches; 0 matches).

| declared mismatch | disposition |
| --- | --- |
| multiple-scattering treatment | Algorithm32 Paper J2 stores and integrates cumulative J1 + J2 scattering density and stops the recurrence after order 2 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality. |
| incident angular quadrature | Algorithm32 Paper J2 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams. |
| vertical and path discretization | Algorithm32 Paper J2 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls. |
| geometry approximation | Algorithm32 Paper J2 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical. |

## Predeclared B3 classification - Algorithm32 Paper J3

Classification inherited from B1: **FAVORABLE**.

Durable B1 result: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\result.md` (SHA-256 `b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9`; 26239 bytes).

| consistency value | result |
| --- | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.226032e+1 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.226032e+1 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | 9.451247e-9 |
| permitted absolute difference | 1.000000e-6 |
| consistency result | passed |

Comparison-map completeness: **passed**; 4/4 required declarations supplied (4 mismatches; 0 matches).

| declared mismatch | disposition |
| --- | --- |
| multiple-scattering treatment | Algorithm32 Paper J3 stores and integrates cumulative J1 + J2 + J3 scattering density and stops the recurrence after order 3 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality. |
| incident angular quadrature | Algorithm32 Paper J3 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams. |
| vertical and path discretization | Algorithm32 Paper J3 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls. |
| geometry approximation | Algorithm32 Paper J3 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical. |

## Predeclared B3 classification - Algorithm32 Paper J4

Classification inherited from B1: **FAVORABLE**.

Durable B1 result: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\result.md` (SHA-256 `b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9`; 26239 bytes).

| consistency value | result |
| --- | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.192578e+1 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.192578e+1 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | 8.355263e-9 |
| permitted absolute difference | 1.000000e-6 |
| consistency result | passed |

Comparison-map completeness: **passed**; 4/4 required declarations supplied (4 mismatches; 0 matches).

| declared mismatch | disposition |
| --- | --- |
| multiple-scattering treatment | Algorithm32 Paper J4 stores and integrates cumulative J1 + J2 + J3 + J4 scattering density and stops the recurrence after order 4 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality. |
| incident angular quadrature | Algorithm32 Paper J4 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams. |
| vertical and path discretization | Algorithm32 Paper J4 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls. |
| geometry approximation | Algorithm32 Paper J4 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical. |

## Predeclared B3 classification - Algorithm32 Paper J5

Classification inherited from B1: **FAVORABLE**.

Durable B1 result: `C:\dev\flattened-steel\references\results\experiments\b1-directional-sky-radiance\result.md` (SHA-256 `b6cb46ae4949572a4f58ded7f004cea4be267b3780017a29cf5712fb0b78c7c9`; 26239 bytes).

| consistency value | result |
| --- | ---: |
| B1 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.186964e+1 |
| B3 aggregate RMSE (mW m^-2 sr^-1 nm^-1) | 1.186964e+1 |
| B3 minus B1 (mW m^-2 sr^-1 nm^-1) | -1.778421e-7 |
| permitted absolute difference | 1.000000e-6 |
| consistency result | passed |

Comparison-map completeness: **passed**; 4/4 required declarations supplied (4 mismatches; 0 matches).

| declared mismatch | disposition |
| --- | --- |
| multiple-scattering treatment | Algorithm32 Paper J5 stores and integrates cumulative J1 + J2 + J3 + J4 + J5 scattering density and stops the recurrence after order 5 rather than resolving libRadtran DISORT's fuller multiple-scattering solution. Aggregate-score proximity does not establish component, order-by-order, or pointwise equality. |
| incident angular quadrature | Algorithm32 Paper J5 uses the pinned 34-direction source-oriented equal-weight Fibonacci incoming quadrature and the separate W27 source-aligned cubed-sphere outgoing reconstruction; the retained libRadtran DISORT calculation uses 16 streams. |
| vertical and path discretization | Algorithm32 Paper J5 uses analytic exponential density profiles, 48 physical altitude nodes, 40 view-path and higher-order transport intervals, and 20 source-transmittance intervals; libRadtran uses its retained layered atmosphere and solver controls. |
| geometry approximation | Algorithm32 Paper J5 uses exact ray intersections with its spherical atmosphere; the retained libRadtran setup is pseudospherical. |

## Acceptance meaning

The paper and pinned comparison source are the authority for the published 550-case aerosol-search result; rerunning that search locally is an optional cross-check, not an acceptance prerequisite. Contract verification proves only that the runner encodes the published comparison boundary. A local fixed-case execution or supplied coarse table proves only the stated cross-check. Each candidate cube is independently scored against the same Kider measurements and its RMSE is placed beside the paper's published libRadtran RMSE; no candidate requires a locally regenerated libRadtran cube. Because the aerosol parameters were fitted to these measurements, these are in-sample comparisons rather than independent validation, and without a published pointwise libRadtran cube they do not establish sample-by-sample solver agreement. Each candidate requires its explicit mismatch map and pre-result judgment record. Algorithm32 Paper is the selected family baseline; its J2 through J5 variants are the active n-order candidates.

## Conclusion

Accepted. The published libRadtran benchmark and aerosol-search result were adopted as the external reference, and Algorithm32 Paper was scored against the same Kider measurements at the 17x81x31 directional spectral-radiance boundary under predeclared judgment rules. Its B3 classification remains **limited** by inheritance from B1: its 1.610169e+1 mW m^-2 sr^-1 nm^-1 score agrees with durable B1 within 1.000000e-6, and the complete mismatch map records all 5 required declarations. Algorithm32 Paper J2 was independently scored at 1.415302e+1 mW m^-2 sr^-1 nm^-1. It inherits B1 classification **favorable**, agrees with its candidate-labelled B1 aggregate within 1.000000e-6, and has a complete 4-field comparison map (4 mismatches; 0 matches). Algorithm32 Paper J3 was independently scored at 1.226032e+1 mW m^-2 sr^-1 nm^-1. It inherits B1 classification **favorable**, agrees with its candidate-labelled B1 aggregate within 1.000000e-6, and has a complete 4-field comparison map (4 mismatches; 0 matches). Algorithm32 Paper J4 was independently scored at 1.192578e+1 mW m^-2 sr^-1 nm^-1. It inherits B1 classification **favorable**, agrees with its candidate-labelled B1 aggregate within 1.000000e-6, and has a complete 4-field comparison map (4 mismatches; 0 matches). Algorithm32 Paper J5 was independently scored at 1.186964e+1 mW m^-2 sr^-1 nm^-1. It inherits B1 classification **favorable**, agrees with its candidate-labelled B1 aggregate within 1.000000e-6, and has a complete 4-field comparison map (4 mismatches; 0 matches).
