# B2 - Hemispherical Sky-Irradiance Benchmark

Status: accepted; Figure 8 diffuse-sky measurement aggregate completed and Algorithm32 Paper plus J2 through J5 boundaries scored.

## Question

What 360-720 nm diffuse-sky irradiance curve follows from applying Bruneton's published interpolation and integration procedure to the 17 Kider directional spectral-radiance fields?

## Inputs

```json
{
  "scientificBoundary": "Aggregate of B1's 17x81 measured directional spectral-radiance field; not pyranometer evidence and not an independent measurement observable.",
  "authorities": {
    "paper": "Eric Bruneton, A Qualitative and Quantitative Evaluation of 8 Clear Sky Models, arXiv:1612.04336v1, Figure 8",
    "measurement": "Kider et al., A Framework for the Experimental Comparison of Solar and Skydome Illumination (2014)",
    "comparisonSource": "https://github.com/ebruneton/clear-sky-models/tree/4df2ec6609bc0127a478bd34fff29c94352579cc"
  },
  "dataset": {
    "path": "references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/extracted",
    "conditions": 17,
    "directionalFilesPerCondition": 81,
    "directionalFilesTotal": 1377,
    "bytes": 84397571,
    "sha256": "1a1805bf170d6d573fc6a745297f19f236601a8ec8fbf9b2c844901cdc1a9af8",
    "identityAlgorithm": "SHA-256(relative UTF-8 path || NUL || file bytes || NUL), condition order then numeric sample-index order",
    "rawWavelengthRangeNanometers": [
      350,
      2500
    ],
    "rawSpacingNanometers": 1,
    "units": "W m^-2 sr^-1 nm^-1"
  },
  "preprocessing": {
    "sourceSpectralPacket": {
      "sampleCount": 40,
      "minimumNanometers": 360,
      "maximumNanometers": 830,
      "sampleSpacingNanometers": 11.75
    },
    "rawToPacketInterpolation": "linear",
    "directionMap": "Kider sample order -> source 9x9 Shirley-Chiu square/disk field; flip square y for counterclockwise-to-clockwise azimuth conversion",
    "knownBadSample": "sample 0 / grid[8][4] replaced by mean(grid[8][3], grid[8][5])",
    "angularInterpolation": "Bruneton HemisphericalFunction bicubic rings, zenith derivative extrapolation, and horizon second-derivative extrapolation",
    "angularQuadrature": {
      "n": 100,
      "zenithSamples": 50,
      "azimuthSamples": 200,
      "totalDirections": 10000,
      "zenithRule": "theta_i=(i+0.5)*pi/100, i=0..49",
      "azimuthRule": "phi_j=j*pi/100, j=0..199",
      "differentialSolidAngleRule": "sin(theta_i)*(pi/100)*(pi/100) sr",
      "projectionRule": "cos(theta_i)"
    },
    "spectralIntegration": {
      "rangeNanometers": {
        "minimumNanometers": 360,
        "maximumNanometers": 720
      },
      "rule": "pinned dimensional_types subset integral: fixed packet value over each clipped [sample(i), sample(i+1)) bin",
      "linearReordering": "the scalar runner integrates each of the 81 spectral packets before bicubic angular integration; the independent test proves this commutes with the source order because resampling, bicubic interpolation, angular quadrature, and spectral integration are linear"
    },
    "directSunTreatment": "excluded: MeasuredAtmosphere::GetSunIrradiance returns the zero spectrum; plotted measurement total equals diffuse sky"
  },
  "pendingInputs": {
    "paperModelCurves": "generated; independent numeric extraction of Figure 8 remains pending",
    "proposedMethodDirectionalSpectra": "Algorithm32 Paper supplied and scored with predeclared judgment rules",
    "proposedJ2DirectionalSpectra": "Algorithm32 Paper J2 supplied and independently scored with its pre-result judgment record",
    "proposedJ3DirectionalSpectra": "Algorithm32 Paper J3 supplied and independently scored with its pre-result judgment record",
    "proposedJ4DirectionalSpectra": "Algorithm32 Paper J4 supplied and independently scored with its pre-result judgment record",
    "proposedJ5DirectionalSpectra": "Algorithm32 Paper J5 supplied and independently scored with its pre-result judgment record"
  },
  "proposedInput": {
    "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\algorithm32-paper-proposed.tsv",
    "bytes": 1186318,
    "sha256": "c292cd6873bf104e702c289d0624b7dec12d5e9606178f033754cdd1ce5a5f8a"
  },
  "proposedJ2Input": {
    "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\algorithm32-paper-j2-proposed.tsv",
    "bytes": 1182440,
    "sha256": "1bff6bc423ff51f25db2b7c25ab96c92931779b475c13ed5dffe5470f0e4583a"
  },
  "proposedJ3Input": {
    "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\algorithm32-paper-j3-proposed.tsv",
    "bytes": 1181147,
    "sha256": "c27fb28b5ff55538a5f88fe3f17bc0c2c9aa3737212d164709a3d87cab95efd1"
  },
  "proposedJ4Input": {
    "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\algorithm32-paper-j4-proposed.tsv",
    "bytes": 1180691,
    "sha256": "84916e87161d8ce7ba52eab15e7c053bd9cc39242bd72ae6fd5a014790ecc3c6"
  },
  "proposedJ5Input": {
    "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\algorithm32-paper-j5-proposed.tsv",
    "bytes": 1180521,
    "sha256": "3d9302cd955af81281eecf791c51cf1d4570094fd1ec9e7255f0bb6b022016b6"
  },
  "judgmentRules": {
    "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-judgment-rules.json",
    "bytes": 4641,
    "sha256": "fd4f61f649fc3ed1b549e7ce8b7267d98e4f8c0bc7c31123ac13280a35788e29",
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1"
  },
  "j2JudgmentRules": {
    "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j2-judgment-rules.json",
    "bytes": 4630,
    "sha256": "572d1a408d157f1fcb23182d632e51706c84bce60f23759b06d33ddb7041ba5b",
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1"
  },
  "j3JudgmentRules": {
    "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j3-judgment-rules.json",
    "bytes": 4630,
    "sha256": "02b4d61f4a78c85460b3d7cfa366eeec1b5cce16999d1499302775fdb2566495",
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1"
  },
  "j4JudgmentRules": {
    "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j4-judgment-rules.json",
    "bytes": 4630,
    "sha256": "f143268cdcbbe07b5192538fee472ef424ff6c6345e8461a4e277078474b8d05",
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1"
  },
  "j5JudgmentRules": {
    "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-j5-judgment-rules.json",
    "bytes": 4630,
    "sha256": "9914e8ed14d8572b2314016d7099c75a2ac7da0644e9d749d00562444c8b12d7",
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1"
  }
}
```

## Iterations

Iterations: 17

| iteration | local time | measured diffuse sky (W m^-2) | Nishita93 (W m^-2) | Nishita96 (W m^-2) | Preetham (W m^-2) | O'Neal (W m^-2) | Haber (W m^-2) | Bruneton (W m^-2) | Elek (W m^-2) | Hosek (W m^-2) | libRadtran (W m^-2) | Algorithm32 Paper (W m^-2) | Default residual (W m^-2) | Algorithm32 Paper J2 (W m^-2) | J2 residual (W m^-2) | Algorithm32 Paper J3 (W m^-2) | J3 residual (W m^-2) | Algorithm32 Paper J4 (W m^-2) | J4 residual (W m^-2) | Algorithm32 Paper J5 (W m^-2) | J5 residual (W m^-2) | stage result |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 09:30 | 58.631996 | 42.282154 | 47.172419 | 147.900710 | 20.955145 | 55.652263 | 61.029366 | 61.029366 | 79.446872 | 60.543716 | 52.412623 | -6.219373 | 55.587320 | -3.044677 | 57.798538 | -0.833458 | 58.434790 | -0.197206 | 58.653005 | 0.021009 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 2 | 09:45 | 58.873408 | 43.001897 | 48.195632 | 150.713157 | 21.160221 | 56.426382 | 61.925369 | 61.925369 | 80.965952 | 61.407632 | 53.278363 | -5.595045 | 56.565127 | -2.308281 | 58.832722 | -0.040686 | 59.521467 | 0.648059 | 59.779855 | 0.906447 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 3 | 10:00 | 60.297294 | 43.694718 | 49.198546 | 153.006451 | 21.352404 | 57.136301 | 62.750551 | 62.750551 | 82.292581 | 62.213518 | 54.127967 | -6.169327 | 57.489085 | -2.808209 | 59.748459 | -0.548836 | 60.394190 | 0.096896 | 60.605561 | 0.308267 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 4 | 10:15 | 62.348815 | 44.360912 | 50.184310 | 154.800084 | 21.532044 | 57.800133 | 63.465499 | 63.465499 | 83.447766 | 62.977983 | 55.055610 | -7.293206 | 58.574951 | -3.773865 | 60.831941 | -1.516874 | 61.439381 | -0.909435 | 61.619799 | -0.729016 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 5 | 10:30 | 64.231283 | 44.968127 | 51.120439 | 156.104609 | 21.698283 | 58.373520 | 64.109992 | 64.109992 | 84.437192 | 63.679210 | 55.539045 | -8.692238 | 59.124856 | -5.106428 | 61.454324 | -2.776959 | 62.178759 | -2.052524 | 62.456998 | -1.774285 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 6 | 10:45 | 65.740681 | 45.478913 | 51.974170 | 156.992604 | 21.849958 | 58.855171 | 64.649799 | 64.649799 | 85.264447 | 64.280856 | 55.951289 | -9.789392 | 59.724472 | -6.016209 | 62.024446 | -3.716236 | 62.770823 | -2.969859 | 63.080407 | -2.660275 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 7 | 11:00 | 66.831454 | 45.881401 | 52.730796 | 157.456624 | 21.986444 | 59.208511 | 65.070092 | 65.070092 | 85.931049 | 64.771163 | 56.410766 | -10.420689 | 60.197493 | -6.633961 | 62.410348 | -4.421106 | 63.038961 | -3.792494 | 63.248885 | -3.582569 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 8 | 11:15 | 65.841090 | 46.196827 | 53.415194 | 157.571108 | 22.107873 | 59.487740 | 65.398910 | 65.398910 | 86.451564 | 65.160593 | 56.799946 | -9.041144 | 60.653462 | -5.187628 | 62.843502 | -2.997588 | 63.450383 | -2.390707 | 63.648294 | -2.192796 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 9 | 11:30 | 64.384477 | 46.467918 | 54.065632 | 157.613942 | 22.214875 | 59.722571 | 65.684765 | 65.684765 | 86.869875 | 65.478678 | 57.061836 | -7.322641 | 60.993008 | -3.391470 | 63.335491 | -1.048986 | 64.107866 | -0.276612 | 64.433355 | 0.048877 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 10 | 11:45 | 64.163323 | 46.729217 | 54.711228 | 157.736391 | 22.307817 | 59.947601 | 65.968025 | 65.968025 | 87.219346 | 65.753355 | 57.259987 | -6.903335 | 61.281927 | -2.881395 | 63.554863 | -0.608460 | 64.284807 | 0.121485 | 64.582172 | 0.418850 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 11 | 12:00 | 64.988379 | 46.986127 | 55.343795 | 157.991144 | 22.386359 | 60.159561 | 66.252186 | 66.252186 | 87.515616 | 65.998643 | 57.529856 | -7.458524 | 61.533650 | -3.454729 | 63.804323 | -1.184056 | 64.534771 | -0.453608 | 64.832104 | -0.156275 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 12 | 12:15 | 68.144874 | 47.201726 | 55.904815 | 158.297632 | 22.449087 | 60.337281 | 66.492854 | 66.492854 | 87.748242 | 66.207824 | 57.796659 | -10.348214 | 61.915534 | -6.229340 | 64.222538 | -3.922336 | 64.978353 | -3.166521 | 65.293016 | -2.851858 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 13 | 12:30 | 70.022563 | 47.358367 | 56.350011 | 158.529094 | 22.495191 | 60.455918 | 66.667718 | 66.667718 | 87.906117 | 66.373584 | 58.057695 | -11.964868 | 62.141753 | -7.880811 | 64.481058 | -5.541506 | 65.229534 | -4.793030 | 65.523943 | -4.498620 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 14 | 12:45 | 68.624873 | 47.451423 | 56.643400 | 158.623657 | 22.524272 | 60.517655 | 66.771620 | 66.771620 | 87.989825 | 66.484614 | 58.309636 | -10.315237 | 62.381791 | -6.243082 | 64.799100 | -3.825773 | 65.576836 | -3.048037 | 65.877921 | -2.746952 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 15 | 13:00 | 68.152500 | 47.500239 | 56.780357 | 158.734856 | 22.536658 | 60.548313 | 66.826851 | 66.826851 | 88.034417 | 66.534455 | 58.268314 | -9.884187 | 62.371547 | -5.780953 | 64.657237 | -3.495263 | 65.333998 | -2.818502 | 65.569460 | -2.583041 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 16 | 13:15 | 69.193624 | 47.502821 | 56.746851 | 158.889502 | 22.532215 | 60.548234 | 66.830732 | 66.830732 | 88.048771 | 66.518003 | 58.276064 | -10.917561 | 62.323554 | -6.870070 | 64.609631 | -4.583993 | 65.286905 | -3.906719 | 65.522925 | -3.670700 | measurement, source models, Default, and J2 through J5 aggregates scored |
| 17 | 13:30 | 69.586610 | 47.423786 | 56.512669 | 158.737674 | 22.510061 | 60.481512 | 66.741931 | 66.741931 | 87.974466 | 66.431381 | 58.186901 | -11.399709 | 62.306507 | -7.280103 | 64.671107 | -4.915503 | 65.425988 | -4.160622 | 65.719331 | -3.867279 | measurement, source models, Default, and J2 through J5 aggregates scored |

## Predeclared B2 classification - Algorithm32 Paper

Classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| RMSE | 9.020744 | 12.018282 | 20.496808 | favorable |
| Absolute bias | 8.807923 | 11.941587 | 20.440403 | favorable |
| Worst absolute residual | 11.964868 | 14.100659 | 23.056024 | favorable |

## Predeclared B2 classification - Algorithm32 Paper J2

Classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| RMSE | 5.286845 | 12.018282 | 20.496808 | favorable |
| Absolute bias | 4.993601 | 11.941587 | 20.440403 | favorable |
| Worst absolute residual | 7.880811 | 14.100659 | 23.056024 | favorable |

## Predeclared B2 classification - Algorithm32 Paper J3

Classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| RMSE | 3.202446 | 12.018282 | 20.496808 | favorable |
| Absolute bias | 2.704566 | 11.941587 | 20.440403 | favorable |
| Worst absolute residual | 5.541506 | 14.100659 | 23.056024 | favorable |

## Predeclared B2 classification - Algorithm32 Paper J4

Classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| RMSE | 2.629376 | 12.018282 | 20.496808 | favorable |
| Absolute bias | 2.004084 | 11.941587 | 20.440403 | favorable |
| Worst absolute residual | 4.793030 | 14.100659 | 23.056024 | favorable |

## Predeclared B2 classification - Algorithm32 Paper J5

Classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| RMSE | 2.431866 | 12.018282 | 20.496808 | favorable |
| Absolute bias | 1.741777 | 11.941587 | 20.440403 | favorable |
| Worst absolute residual | 4.498620 | 14.100659 | 23.056024 | favorable |

## Conclusion

Accepted. The 17-point diffuse-sky measurement curve was regenerated from B1's measured directional-radiance field with the pinned Figure 8 source procedure. This is an integral transform of the same Kider radiance measurements, not independent pyranometer evidence. The source measurement contributes no direct-Sun term. The nine source-model curves were also integrated from the complete pinned-source B1 spectral boundary. This generates the local Figure 8 model columns but does not by itself prove agreement with a separately digitized published plot. Algorithm32 Paper: RMSE 9.020744 W m^-2, bias -8.807923 W m^-2, worst absolute residual 11.964868 W m^-2 at 12:30. Its classification is **favorable** under the rules fixed before its results. Algorithm32 Paper J2: RMSE 5.286845 W m^-2, bias -4.993601 W m^-2, worst absolute residual 7.880811 W m^-2 at 12:30. Its classification is **favorable** under the rules fixed before its results. Algorithm32 Paper J3: RMSE 3.202446 W m^-2, bias -2.704566 W m^-2, worst absolute residual 5.541506 W m^-2 at 12:30. Its classification is **favorable** under the rules fixed before its results. Algorithm32 Paper J4: RMSE 2.629376 W m^-2, bias -2.004084 W m^-2, worst absolute residual 4.793030 W m^-2 at 12:30. Its classification is **favorable** under the rules fixed before its results. Algorithm32 Paper J5: RMSE 2.431866 W m^-2, bias -1.741777 W m^-2, worst absolute residual 4.498620 W m^-2 at 12:30. Its classification is **favorable** under the rules fixed before its results.

## Acceptance boundary

- Measurement aggregate stage completed: yes.
- Published external Figure 8 reference adopted: adopted.
- Published paper-model columns completed: generated from pinned source boundary.
- Algorithm32 Paper column completed: scored.
- Algorithm32 Paper J2 column completed: scored.
- Algorithm32 Paper J3 column completed: scored.
- Algorithm32 Paper J4 column completed: scored.
- Algorithm32 Paper J5 column completed: scored.
- All five candidate profiles scored: yes.
- Full B2 accepted: yes.
