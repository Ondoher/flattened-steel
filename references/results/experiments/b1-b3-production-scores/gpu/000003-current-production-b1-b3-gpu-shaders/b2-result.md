# B2 - Hemispherical Sky-Irradiance Benchmark

Status: accepted; Figure 8 diffuse-sky measurement aggregate completed and the Algorithm32 Paper boundary scored.

## Question

What 360-720 nm diffuse-sky irradiance curve follows from applying Bruneton's published interpolation and integration procedure to the 17 Kider directional spectral-radiance fields?

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
    "proposedMethodDirectionalSpectra": "Algorithm32 Paper supplied and scored with predeclared judgment rules"
  },
  "proposedInput": {
    "path": "C:\\dev\\flattened-steel\\references\\results\\experiments\\b1-directional-sky-radiance\\gpu\\algorithm32-current-production-gpu-j4.tsv",
    "bytes": 1181013,
    "sha256": "20a8fdca9ab86d7dded9c832b1b3fb1ead18a0947a1951850008489ff1cd7010"
  },
  "proposedJ2Input": null,
  "proposedJ3Input": null,
  "proposedJ4Input": null,
  "proposedJ5Input": null,
  "judgmentRules": {
    "path": "C:\\dev\\flattened-steel\\scripts\\experiments\\whole-algorithm-paper-judgment-rules.json",
    "bytes": 4546,
    "sha256": "d39313453bf1ade6a75fbf8f066404da902f7d7ab32f340c41750cdb2cf99062",
    "schema": "algorithm32-whole-algorithm-judgment-rules-v1"
  },
  "j2JudgmentRules": null,
  "j3JudgmentRules": null,
  "j4JudgmentRules": null,
  "j5JudgmentRules": null
}
```

## Iterations

Iterations: 17

| iteration | local time | measured diffuse sky (W m^-2) | Nishita93 (W m^-2) | Nishita96 (W m^-2) | Preetham (W m^-2) | O'Neal (W m^-2) | Haber (W m^-2) | Bruneton (W m^-2) | Elek (W m^-2) | Hosek (W m^-2) | libRadtran (W m^-2) | Algorithm32 Paper current-production J4 (W m^-2) | residual (W m^-2) | stage result |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 09:30 | 58.631996 | 42.282154 | 47.172419 | 147.900710 | 20.955145 | 55.652263 | 61.029366 | 61.029366 | 79.446872 | 60.543716 | 60.635216 | 2.003220 | measurement, source models, and current-production J4 aggregate scored |
| 2 | 09:45 | 58.873408 | 43.001897 | 48.195632 | 150.713157 | 21.160221 | 56.426382 | 61.925369 | 61.925369 | 80.965952 | 61.407632 | 61.584072 | 2.710664 | measurement, source models, and current-production J4 aggregate scored |
| 3 | 10:00 | 60.297294 | 43.694718 | 49.198546 | 153.006451 | 21.352404 | 57.136301 | 62.750551 | 62.750551 | 82.292581 | 62.213518 | 62.440598 | 2.143304 | measurement, source models, and current-production J4 aggregate scored |
| 4 | 10:15 | 62.348815 | 44.360912 | 50.184310 | 154.800084 | 21.532044 | 57.800133 | 63.465499 | 63.465499 | 83.447766 | 62.977983 | 62.947191 | 0.598375 | measurement, source models, and current-production J4 aggregate scored |
| 5 | 10:30 | 64.231283 | 44.968127 | 51.120439 | 156.104609 | 21.698283 | 58.373520 | 64.109992 | 64.109992 | 84.437192 | 63.679210 | 63.916450 | -0.314833 | measurement, source models, and current-production J4 aggregate scored |
| 6 | 10:45 | 65.740681 | 45.478913 | 51.974170 | 156.992604 | 21.849958 | 58.855171 | 64.649799 | 64.649799 | 85.264447 | 64.280856 | 64.411901 | -1.328781 | measurement, source models, and current-production J4 aggregate scored |
| 7 | 11:00 | 66.831454 | 45.881401 | 52.730796 | 157.456624 | 21.986444 | 59.208511 | 65.070092 | 65.070092 | 85.931049 | 64.771163 | 62.378692 | -4.452763 | measurement, source models, and current-production J4 aggregate scored |
| 8 | 11:15 | 65.841090 | 46.196827 | 53.415194 | 157.571108 | 22.107873 | 59.487740 | 65.398910 | 65.398910 | 86.451564 | 65.160593 | 65.145606 | -0.695484 | measurement, source models, and current-production J4 aggregate scored |
| 9 | 11:30 | 64.384477 | 46.467918 | 54.065632 | 157.613942 | 22.214875 | 59.722571 | 65.684765 | 65.684765 | 86.869875 | 65.478678 | 65.369492 | 0.985014 | measurement, source models, and current-production J4 aggregate scored |
| 10 | 11:45 | 64.163323 | 46.729217 | 54.711228 | 157.736391 | 22.307817 | 59.947601 | 65.968025 | 65.968025 | 87.219346 | 65.753355 | 65.558485 | 1.395163 | measurement, source models, and current-production J4 aggregate scored |
| 11 | 12:00 | 64.988379 | 46.986127 | 55.343795 | 157.991144 | 22.386359 | 60.159561 | 66.252186 | 66.252186 | 87.515616 | 65.998643 | 65.841177 | 0.852797 | measurement, source models, and current-production J4 aggregate scored |
| 12 | 12:15 | 68.144874 | 47.201726 | 55.904815 | 158.297632 | 22.449087 | 60.337281 | 66.492854 | 66.492854 | 87.748242 | 66.207824 | 65.692797 | -2.452077 | measurement, source models, and current-production J4 aggregate scored |
| 13 | 12:30 | 70.022563 | 47.358367 | 56.350011 | 158.529094 | 22.495191 | 60.455918 | 66.667718 | 66.667718 | 87.906117 | 66.373584 | 66.035665 | -3.986899 | measurement, source models, and current-production J4 aggregate scored |
| 14 | 12:45 | 68.624873 | 47.451423 | 56.643400 | 158.623657 | 22.524272 | 60.517655 | 66.771620 | 66.771620 | 87.989825 | 66.484614 | 65.926071 | -2.698802 | measurement, source models, and current-production J4 aggregate scored |
| 15 | 13:00 | 68.152500 | 47.500239 | 56.780357 | 158.734856 | 22.536658 | 60.548313 | 66.826851 | 66.826851 | 88.034417 | 66.534455 | 66.127951 | -2.024549 | measurement, source models, and current-production J4 aggregate scored |
| 16 | 13:15 | 69.193624 | 47.502821 | 56.746851 | 158.889502 | 22.532215 | 60.548234 | 66.830732 | 66.830732 | 88.048771 | 66.518003 | 66.040156 | -3.153469 | measurement, source models, and current-production J4 aggregate scored |
| 17 | 13:30 | 69.586610 | 47.423786 | 56.512669 | 158.737674 | 22.510061 | 60.481512 | 66.741931 | 66.741931 | 87.974466 | 66.431381 | 65.968531 | -3.618078 | measurement, source models, and current-production J4 aggregate scored |

## Predeclared B2 classification - Algorithm32 Paper

Classification: **FAVORABLE**.

| criterion | observed | favorable maximum | limited maximum | result |
| --- | ---: | ---: | ---: | --- |
| RMSE | 2.406574 | 12.018282 | 20.496808 | favorable |
| Absolute bias | 0.825717 | 11.941587 | 20.440403 | favorable |
| Worst absolute residual | 4.452763 | 14.100659 | 23.056024 | favorable |

## Conclusion

Accepted. The 17-point diffuse-sky measurement curve was regenerated from B1's measured directional-radiance field with the pinned Figure 8 source procedure. This is an integral transform of the same Kider radiance measurements, not independent pyranometer evidence. The source measurement contributes no direct-Sun term. The nine source-model curves were also integrated from the complete pinned-source B1 spectral boundary. This generates the local Figure 8 model columns but does not by itself prove agreement with a separately digitized published plot. Algorithm32 Paper: RMSE 2.406574 W m^-2, bias -0.825717 W m^-2, worst absolute residual 4.452763 W m^-2 at 11:00. Its classification is **favorable** under the rules fixed before its results. The authenticated production run selects cumulative J4; the retained five-profile comparison is a separate workflow.

## Acceptance boundary

- Measurement aggregate stage completed: yes.
- Published external Figure 8 reference adopted: adopted.
- Published paper-model columns completed: generated from pinned source boundary.
- Algorithm32 Paper column completed: scored.
- Authenticated current-production order: J4.
- Retained five-profile comparison: separate non-production workflow.
- Full B2 accepted: yes.
