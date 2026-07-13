E3 - Bruneton-Referenced Incident-Direction Calibration

Question:
What is the least Algorithm32 Fibonacci incident-direction count whose completed displayed colours remain within E2's strict perceptual boundary of the same inputs evaluated with Bruneton's published 16 by 32 incident-direction quadrature?

Inputs:
{
  "schemaVersion": 3,
  "experiment": {
    "id": "E3",
    "name": "Bruneton-Referenced Incident-Direction Calibration",
    "question": "What is the least Algorithm32 Fibonacci incident-direction count whose completed displayed colours remain within E2's strict perceptual boundary of the same inputs evaluated with Bruneton's published 16 by 32 incident-direction quadrature?"
  },
  "generation": {
    "method": "deterministic Cartesian physical matrix",
    "physicalCaseCount": 84,
    "pairedComparison": "Every candidate and reference receives the same atmosphere, source, finite path, endpoint spectrum, non-angular numerical controls, spectral basis, and display mapping. Only the incident angular quadrature differs."
  },
  "spectralBasis": {
    "channelCount": 15,
    "supportNanometers": [
      360,
      830
    ],
    "binWidthNanometers": 31.333333333333332,
    "wavelengthsNanometers": [
      375.666666666667,
      407,
      438.333333333333,
      469.666666666667,
      501,
      532.333333333333,
      563.666666666667,
      595,
      626.333333333333,
      657.666666666667,
      689,
      720.333333333333,
      751.666666666667,
      783,
      814.333333333333
    ],
    "solarIrradiance": [
      1.068866666667,
      1.729673,
      1.862071666667,
      2.022063333333,
      1.908154,
      1.883391,
      1.834246666667,
      1.76744,
      1.65952,
      1.548102333333,
      1.45078,
      1.340960333333,
      1.262433333333,
      1.175208,
      1.090824
    ],
    "sampleMeaning": "centered samples representing contiguous spectral bins"
  },
  "physicalDataTypes": {
    "endpointSpectrum": "spectral-radiance density",
    "distance": "finite path length",
    "sourcePosition": "solar direction",
    "atmosphereExtinction": "spectral extinction coefficient",
    "transmittance": "dimensionless spectral transmittance",
    "pathRadiance": "spectral-radiance density",
    "displayedColour": "continuous clamped linear-display sRGB"
  },
  "atmosphere": {
    "geometry": "spherical Earth atmosphere; ground-level horizontal view path",
    "bottomRadiusMeters": 6360000,
    "topRadiusMeters": 6420000,
    "observerHeightMeters": 2,
    "rayleighScaleHeightMeters": 8000,
    "mieScaleHeightMeters": 1200,
    "rayleighCoefficientScale": 0.00000124062,
    "mieAngstromAlpha": 0.8,
    "mieAngstromBeta": 0.04,
    "mieSingleScatteringAlbedo": 0.8,
    "miePhaseAsymmetry": 0.7,
    "ozoneAbsorption": 0,
    "groundCoupling": false
  },
  "displayMapping": {
    "cieDataset": "references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv",
    "cieObserver": "CIE 1931 2 degree",
    "cieInterpolation": "linear at each canonical wavelength",
    "spectralIntegration": "sum CMF(lambda_i) * L_i * 31.333333333333332 nm",
    "luminousEfficacyLumensPerWatt": 683,
    "xyzToLinearSrgbMatrix": [
      [
        3.2406,
        -1.5372,
        -0.4986
      ],
      [
        -0.9689,
        1.8758,
        0.0415
      ],
      [
        0.0557,
        -0.204,
        1.057
      ]
    ],
    "negativePolicy": "clamp each negative linear-sRGB channel to zero",
    "exposureAndToneMap": "1 - exp(-max(0, linearSrgb) / (5 * 683))",
    "outputClamp": [
      0,
      1
    ],
    "transferFunction": "none before the E2 continuous display comparison",
    "scope": "retained Bruneton Figure 1 first-release comparison display"
  },
  "e2Criterion": {
    "visibilityBoundaryDeltaEItp": 1,
    "displayTransformUncertaintyDeltaEItp": 1.485163121927885e-10,
    "referenceUncertaintyDeltaEItp": 0,
    "strictRule": "observed Delta E ITP + U(display transform) < 1; the pinned Bruneton-512 calculation defines the benchmark rather than estimating the continuous-integral truth"
  },
  "referenceQuadrature": {
    "pathIntervals": 40,
    "sourceTransmittanceIntervals": 20,
    "incidentAltitudeBins": 48,
    "incidentQuadrature": "bruneton-query-oriented-16x32-midpoint",
    "incidentDirections": 512,
    "id": "bruneton-compute-scattering-density-16x32-midpoint-34f14e745cff-v1",
    "polarSampleCount": 16,
    "azimuthSampleCount": 32,
    "solidAngleWeight": "sin(theta) * (pi / 16) * (pi / 16)",
    "normalization": "published midpoint weights are not renormalized",
    "frame": "query-oriented local frame with local zenith as +z and outgoing direction in the x/z plane",
    "source": {
      "author": "Eric Bruneton",
      "repository": "https://github.com/ebruneton/precomputed_atmospheric_scattering",
      "commit": "34f14e745cff948f4ca3157d1b62a445ffa7286f",
      "file": "atmosphere/functions.glsl",
      "function": "ComputeScatteringDensity",
      "lines": "1163-1220",
      "retainedPath": "references/downloads/bruneton-precomputed-atmosphere-34f14e7/functions.glsl",
      "retainedSha256": "fae5b16bdd2b5a1d1a8b423c5b76973984eaf9b7514c349fe74b1d44d0c9f498",
      "license": "BSD-3-Clause"
    }
  },
  "sharedControls": {
    "pathIntervals": 40,
    "sourceTransmittanceIntervals": 20,
    "incidentAltitudeBins": 48
  },
  "currentAlgorithm32Controls": {
    "pathIntervals": 40,
    "sourceTransmittanceIntervals": 20,
    "incidentAltitudeBins": 48,
    "incidentQuadrature": "algorithm32-source-oriented-fibonacci",
    "incidentDirections": 34,
    "incidentRotationTurns": 0
  },
  "incidentDirectionSearch": {
    "fixedControls": {
      "pathIntervals": 40,
      "sourceTransmittanceIntervals": 20,
      "incidentAltitudeBins": 48,
      "incidentQuadrature": "algorithm32-source-oriented-fibonacci",
      "incidentRotationTurns": 0
    },
    "minimumCount": 4,
    "maximumCount": 512,
    "method": "evaluate every integer in ascending order and stop at the first passing count; exhaustive lower-count evaluation is required because Fibonacci-lattice error is not monotonic"
  },
  "sunCases": [
    {
      "id": "low-sun-z87",
      "solarZenithDegrees": 87,
      "solarAltitudeDegrees": 3,
      "solarAzimuthDegrees": -25.83454348280912
    },
    {
      "id": "high-sun-z21",
      "solarZenithDegrees": 21,
      "solarAltitudeDegrees": 69,
      "solarAzimuthDegrees": 85.31410016049729
    }
  ],
  "distancesMeters": [
    0,
    100,
    1000,
    5000,
    20000,
    50000,
    100000
  ],
  "endpointSpectra": [
    {
      "id": "black",
      "values": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      "id": "neutral-unit",
      "values": [
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    },
    {
      "id": "neutral-high",
      "values": [
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10,
        10
      ]
    },
    {
      "id": "blue-step",
      "values": [
        1,
        1,
        1,
        1,
        1,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05
      ]
    },
    {
      "id": "green-peak",
      "values": [
        0.05,
        0.05,
        0.05,
        0.21666666666666712,
        0.4777777777777753,
        0.7388888888888838,
        1,
        0.7388888888888914,
        0.47777777777778285,
        0.21666666666666667,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05
      ]
    },
    {
      "id": "red-step",
      "values": [
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        0.05,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ]
    }
  ],
  "diagnostics": {
    "spectralNorm": "maximum absolute per-channel difference",
    "acceptanceMetric": "Delta E ITP after the declared common display mapping",
    "decidingStatistic": "maximum across all declared physical cases",
    "interpretation": "agreement with the pinned Bruneton-512 benchmark under the declared case and display boundary; not proof of continuous quadrature convergence or independent physical accuracy"
  },
  "caseGeneration": {
    "expression": "sunCases x distancesMeters x endpointSpectra",
    "physicalCaseCount": 84,
    "caseIdsAppearInResultTables": true
  }
}

Iterations: 84 paired physical cases per configuration; 42840 numerical case evaluations; 510 distinct quadrature/count configurations

Reference evaluation:
{
  "controls": {
    "pathIntervals": 40,
    "sourceTransmittanceIntervals": 20,
    "incidentAltitudeBins": 48,
    "incidentQuadrature": "bruneton-query-oriented-16x32-midpoint",
    "incidentDirections": 512,
    "id": "bruneton-compute-scattering-density-16x32-midpoint-34f14e745cff-v1",
    "polarSampleCount": 16,
    "azimuthSampleCount": 32,
    "solidAngleWeight": "sin(theta) * (pi / 16) * (pi / 16)",
    "normalization": "published midpoint weights are not renormalized",
    "frame": "query-oriented local frame with local zenith as +z and outgoing direction in the x/z plane",
    "source": {
      "author": "Eric Bruneton",
      "repository": "https://github.com/ebruneton/precomputed_atmospheric_scattering",
      "commit": "34f14e745cff948f4ca3157d1b62a445ffa7286f",
      "file": "atmosphere/functions.glsl",
      "function": "ComputeScatteringDensity",
      "lines": "1163-1220",
      "retainedPath": "references/downloads/bruneton-precomputed-atmosphere-34f14e7/functions.glsl",
      "retainedSha256": "fae5b16bdd2b5a1d1a8b423c5b76973984eaf9b7514c349fe74b1d44d0c9f498",
      "license": "BSD-3-Clause"
    }
  },
  "physicalCaseCount": 84,
  "computedOnce": true,
  "elapsedMilliseconds": 572.3086,
  "role": "Pinned Bruneton-512 benchmark, not a continuous-integral truth estimate"
}

Current Algorithm32 comparison:
| directions | max observed Delta E ITP | max bounded Delta E ITP | worst case | max second-order spectral delta | max final spectral delta | accepted | elapsed ms |
| ---: | ---: | ---: | --- | ---: | ---: | --- | ---: |
| 34 | 1.742671e+1 | 1.742671e+1 | high-sun-z21--005000m--red-step | 2.762466e-2 | 2.762466e-2 | no | 46.010 |

Incident-direction search:
| order | directions | max observed Delta E ITP | max bounded Delta E ITP | worst case | max second-order spectral delta | max final spectral delta | accepted | elapsed ms |
| ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | ---: |
| 1 | 4 | 9.585430e+1 | 9.585430e+1 | low-sun-z87--005000m--red-step | 3.430284e-1 | 3.430284e-1 | no | 10.076 |
| 2 | 5 | 8.800845e+1 | 8.800845e+1 | low-sun-z87--005000m--red-step | 2.709530e-1 | 2.709530e-1 | no | 9.652 |
| 3 | 6 | 8.091521e+1 | 8.091521e+1 | low-sun-z87--005000m--red-step | 2.228398e-1 | 2.228398e-1 | no | 9.452 |
| 4 | 7 | 7.465027e+1 | 7.465027e+1 | low-sun-z87--005000m--red-step | 1.885382e-1 | 1.885382e-1 | no | 12.745 |
| 5 | 8 | 6.897816e+1 | 6.897816e+1 | low-sun-z87--005000m--red-step | 1.627663e-1 | 1.627663e-1 | no | 11.531 |
| 6 | 9 | 6.396222e+1 | 6.396222e+1 | low-sun-z87--005000m--red-step | 1.427608e-1 | 1.427608e-1 | no | 12.461 |
| 7 | 10 | 5.936972e+1 | 5.936972e+1 | low-sun-z87--005000m--red-step | 1.267260e-1 | 1.267260e-1 | no | 12.769 |
| 8 | 11 | 5.533554e+1 | 5.533554e+1 | low-sun-z87--005000m--red-step | 1.136766e-1 | 1.136766e-1 | no | 15.798 |
| 9 | 12 | 5.160889e+1 | 5.160889e+1 | low-sun-z87--005000m--red-step | 1.027861e-1 | 1.027861e-1 | no | 18.899 |
| 10 | 13 | 4.829386e+1 | 4.829386e+1 | low-sun-z87--005000m--red-step | 9.361108e-2 | 9.361108e-2 | no | 17.927 |
| 11 | 14 | 4.520930e+1 | 4.520930e+1 | low-sun-z87--005000m--red-step | 8.574335e-2 | 8.574335e-2 | no | 18.808 |
| 12 | 15 | 4.246599e+1 | 4.246599e+1 | low-sun-z87--005000m--red-step | 7.896542e-2 | 7.896542e-2 | no | 20.196 |
| 13 | 16 | 3.988769e+1 | 3.988769e+1 | low-sun-z87--005000m--red-step | 7.303269e-2 | 7.303269e-2 | no | 21.103 |
| 14 | 17 | 3.761697e+1 | 3.761697e+1 | low-sun-z87--005000m--red-step | 6.784613e-2 | 6.784613e-2 | no | 22.185 |
| 15 | 18 | 3.546353e+1 | 3.546353e+1 | low-sun-z87--005000m--red-step | 6.323445e-2 | 6.323445e-2 | no | 22.912 |
| 16 | 19 | 3.355565e+1 | 3.355565e+1 | low-sun-z87--005000m--red-step | 5.914240e-2 | 5.914240e-2 | no | 23.346 |
| 17 | 20 | 3.173709e+1 | 3.173709e+1 | low-sun-z87--005000m--red-step | 5.546172e-2 | 5.546172e-2 | no | 22.857 |
| 18 | 21 | 3.013881e+1 | 3.013881e+1 | low-sun-z87--005000m--red-step | 5.216852e-2 | 5.216852e-2 | no | 24.893 |
| 19 | 22 | 2.859514e+1 | 2.859514e+1 | low-sun-z87--005000m--red-step | 4.917277e-2 | 4.917277e-2 | no | 28.380 |
| 20 | 23 | 2.722629e+1 | 2.722629e+1 | low-sun-z87--005000m--red-step | 4.646455e-2 | 4.646455e-2 | no | 34.453 |
| 21 | 24 | 2.589455e+1 | 2.589455e+1 | low-sun-z87--005000m--red-step | 4.398025e-2 | 4.398025e-2 | no | 30.006 |
| 22 | 25 | 2.471647e+1 | 2.471647e+1 | low-sun-z87--005000m--red-step | 4.171767e-2 | 4.171767e-2 | no | 31.220 |
| 23 | 26 | 2.356036e+1 | 2.356036e+1 | low-sun-z87--005000m--red-step | 3.962684e-2 | 3.962684e-2 | no | 32.464 |
| 24 | 27 | 2.255747e+1 | 2.255747e+1 | low-sun-z87--005000m--red-step | 3.771798e-2 | 3.771798e-2 | no | 30.612 |
| 25 | 28 | 2.156038e+1 | 2.156038e+1 | low-sun-z87--005000m--red-step | 3.594090e-2 | 3.594090e-2 | no | 31.233 |
| 26 | 29 | 2.068144e+1 | 2.068144e+1 | low-sun-z87--005000m--red-step | 3.430399e-2 | 3.430399e-2 | no | 32.347 |
| 27 | 30 | 1.980427e+1 | 1.980427e+1 | low-sun-z87--005000m--red-step | 3.277305e-2 | 3.277305e-2 | no | 34.152 |
| 28 | 31 | 1.933100e+1 | 1.933100e+1 | high-sun-z21--005000m--red-step | 3.135823e-2 | 3.135823e-2 | no | 34.815 |
| 29 | 32 | 1.874139e+1 | 1.874139e+1 | high-sun-z21--005000m--red-step | 3.002673e-2 | 3.002673e-2 | no | 34.485 |
| 30 | 33 | 1.820417e+1 | 1.820417e+1 | high-sun-z21--005000m--red-step | 2.879226e-2 | 2.879226e-2 | no | 35.069 |
| 31 | 34 | 1.742671e+1 | 1.742671e+1 | high-sun-z21--005000m--red-step | 2.762466e-2 | 2.762466e-2 | no | 46.010 |
| 32 | 35 | 1.707188e+1 | 1.707188e+1 | high-sun-z21--005000m--red-step | 2.653634e-2 | 2.653634e-2 | no | 38.298 |
| 33 | 36 | 1.694689e+1 | 1.694689e+1 | high-sun-z21--005000m--red-step | 2.550381e-2 | 2.550381e-2 | no | 39.058 |
| 34 | 37 | 1.615441e+1 | 1.615441e+1 | high-sun-z21--005000m--red-step | 2.454222e-2 | 2.454222e-2 | no | 39.189 |
| 35 | 38 | 1.553803e+1 | 1.553803e+1 | high-sun-z21--005000m--red-step | 2.362503e-2 | 2.362503e-2 | no | 43.212 |
| 36 | 39 | 1.512731e+1 | 1.512731e+1 | high-sun-z21--005000m--red-step | 2.276544e-2 | 2.276544e-2 | no | 40.960 |
| 37 | 40 | 1.454238e+1 | 1.454238e+1 | high-sun-z21--005000m--red-step | 2.194368e-2 | 2.194368e-2 | no | 42.333 |
| 38 | 41 | 1.488334e+1 | 1.488334e+1 | high-sun-z21--005000m--red-step | 2.117213e-2 | 2.117213e-2 | no | 44.120 |
| 39 | 42 | 1.453045e+1 | 1.453045e+1 | high-sun-z21--005000m--red-step | 2.043209e-2 | 2.043209e-2 | no | 44.662 |
| 40 | 43 | 1.420162e+1 | 1.420162e+1 | high-sun-z21--005000m--red-step | 1.973848e-2 | 1.973848e-2 | no | 46.953 |
| 41 | 44 | 1.369572e+1 | 1.369572e+1 | high-sun-z21--005000m--red-step | 1.907054e-2 | 1.907054e-2 | no | 52.865 |
| 42 | 45 | 1.380392e+1 | 1.380392e+1 | high-sun-z21--005000m--red-step | 1.844084e-2 | 1.844084e-2 | no | 48.517 |
| 43 | 46 | 1.339859e+1 | 1.339859e+1 | high-sun-z21--005000m--red-step | 1.783396e-2 | 1.783396e-2 | no | 50.935 |
| 44 | 47 | 1.299265e+1 | 1.299265e+1 | high-sun-z21--005000m--red-step | 1.726260e-2 | 1.726260e-2 | no | 51.794 |
| 45 | 48 | 1.218437e+1 | 1.218437e+1 | high-sun-z21--005000m--red-step | 1.670963e-2 | 1.670963e-2 | no | 53.383 |
| 46 | 49 | 1.145646e+1 | 1.145646e+1 | high-sun-z21--005000m--red-step | 1.618762e-2 | 1.618762e-2 | no | 59.483 |
| 47 | 50 | 1.097272e+1 | 1.097272e+1 | high-sun-z21--005000m--red-step | 1.568143e-2 | 1.568143e-2 | no | 57.035 |
| 48 | 51 | 1.074060e+1 | 1.074060e+1 | high-sun-z21--005000m--red-step | 1.520248e-2 | 1.520248e-2 | no | 61.853 |
| 49 | 52 | 1.035737e+1 | 1.035737e+1 | high-sun-z21--005000m--red-step | 1.473753e-2 | 1.473753e-2 | no | 59.398 |
| 50 | 53 | 1.005793e+1 | 1.005793e+1 | high-sun-z21--005000m--red-step | 1.429948e-2 | 1.429948e-2 | no | 57.547 |
| 51 | 54 | 9.549982e+0 | 9.549982e+0 | high-sun-z21--005000m--red-step | 1.387253e-2 | 1.387253e-2 | no | 56.667 |
| 52 | 55 | 9.103467e+0 | 9.103467e+0 | high-sun-z21--005000m--red-step | 1.346781e-2 | 1.346781e-2 | no | 57.267 |
| 53 | 56 | 8.741037e+0 | 8.741037e+0 | high-sun-z21--005000m--red-step | 1.307340e-2 | 1.307340e-2 | no | 58.226 |
| 54 | 57 | 9.014265e+0 | 9.014265e+0 | high-sun-z21--005000m--red-step | 1.269984e-2 | 1.269984e-2 | no | 59.369 |
| 55 | 58 | 8.727933e+0 | 8.727933e+0 | high-sun-z21--005000m--red-step | 1.233476e-2 | 1.233476e-2 | no | 71.713 |
| 56 | 59 | 8.504808e+0 | 8.504808e+0 | high-sun-z21--005000m--red-step | 1.198959e-2 | 1.198959e-2 | no | 62.941 |
| 57 | 60 | 8.442831e+0 | 8.442831e+0 | high-sun-z21--005000m--red-step | 1.165136e-2 | 1.165136e-2 | no | 65.823 |
| 58 | 61 | 8.339697e+0 | 8.339697e+0 | high-sun-z21--005000m--red-step | 1.133017e-2 | 1.133017e-2 | no | 63.295 |
| 59 | 62 | 8.103317e+0 | 8.103317e+0 | high-sun-z21--005000m--red-step | 1.101557e-2 | 1.101557e-2 | no | 64.676 |
| 60 | 63 | 8.231313e+0 | 8.231313e+0 | high-sun-z21--005000m--red-step | 1.071811e-2 | 1.071811e-2 | no | 65.531 |
| 61 | 64 | 7.976745e+0 | 7.976745e+0 | high-sun-z21--005000m--red-step | 1.042554e-2 | 1.042554e-2 | no | 66.359 |
| 62 | 65 | 7.578247e+0 | 7.578247e+0 | high-sun-z21--005000m--red-step | 1.014770e-2 | 1.014770e-2 | no | 68.660 |
| 63 | 66 | 7.296093e+0 | 7.296093e+0 | high-sun-z21--005000m--red-step | 9.874366e-3 | 9.874366e-3 | no | 72.123 |
| 64 | 67 | 7.170119e+0 | 7.170119e+0 | high-sun-z21--005000m--red-step | 9.614664e-3 | 9.614664e-3 | no | 79.411 |
| 65 | 68 | 6.916864e+0 | 6.916864e+0 | high-sun-z21--005000m--red-step | 9.358877e-3 | 9.358877e-3 | no | 77.503 |
| 66 | 69 | 6.756125e+0 | 6.756125e+0 | high-sun-z21--005000m--red-step | 9.117138e-3 | 9.117138e-3 | no | 84.772 |
| 67 | 70 | 6.498594e+0 | 6.498594e+0 | high-sun-z21--005000m--red-step | 8.878175e-3 | 8.878175e-3 | no | 73.407 |
| 68 | 71 | 6.389574e+0 | 6.389574e+0 | high-sun-z21--005000m--red-step | 8.650872e-3 | 8.650872e-3 | no | 80.198 |
| 69 | 72 | 6.131308e+0 | 6.131308e+0 | high-sun-z21--005000m--red-step | 8.426456e-3 | 8.426456e-3 | no | 79.705 |
| 70 | 73 | 6.248166e+0 | 6.248166e+0 | high-sun-z21--005000m--red-step | 8.213651e-3 | 8.213651e-3 | no | 75.589 |
| 71 | 74 | 5.847417e+0 | 5.847417e+0 | high-sun-z21--005000m--red-step | 8.002801e-3 | 8.002801e-3 | no | 75.694 |
| 72 | 75 | 6.214164e+0 | 6.214164e+0 | high-sun-z21--005000m--red-step | 7.802810e-3 | 7.802810e-3 | no | 77.385 |
| 73 | 76 | 6.000504e+0 | 6.000504e+0 | high-sun-z21--005000m--red-step | 7.604348e-3 | 7.604348e-3 | no | 77.984 |
| 74 | 77 | 5.950315e+0 | 5.950315e+0 | high-sun-z21--005000m--red-step | 7.415539e-3 | 7.415539e-3 | no | 81.232 |
| 75 | 78 | 5.774719e+0 | 5.774719e+0 | high-sun-z21--005000m--red-step | 7.228280e-3 | 7.228280e-3 | no | 85.107 |
| 76 | 79 | 5.221653e+0 | 5.221653e+0 | high-sun-z21--005000m--red-step | 7.051294e-3 | 7.051294e-3 | no | 87.422 |
| 77 | 80 | 4.979003e+0 | 4.979003e+0 | high-sun-z21--005000m--red-step | 6.874980e-3 | 6.874980e-3 | no | 90.231 |
| 78 | 81 | 4.810727e+0 | 4.810727e+0 | high-sun-z21--005000m--red-step | 6.707265e-3 | 6.707265e-3 | no | 82.817 |
| 79 | 82 | 4.180439e+0 | 4.180439e+0 | high-sun-z21--005000m--red-step | 6.524220e-3 | 6.524220e-3 | no | 82.109 |
| 80 | 83 | 4.083425e+0 | 4.083425e+0 | high-sun-z21--005000m--red-step | 6.365972e-3 | 6.365972e-3 | no | 86.444 |
| 81 | 84 | 3.883197e+0 | 3.883197e+0 | high-sun-z21--005000m--red-step | 6.208172e-3 | 6.208172e-3 | no | 85.096 |
| 82 | 85 | 3.979318e+0 | 3.979318e+0 | high-sun-z21--005000m--red-step | 6.058953e-3 | 6.058953e-3 | no | 90.822 |
| 83 | 86 | 4.114613e+0 | 4.114613e+0 | high-sun-z21--005000m--red-step | 5.909681e-3 | 5.909681e-3 | no | 93.021 |
| 84 | 87 | 4.125279e+0 | 4.125279e+0 | high-sun-z21--005000m--red-step | 5.767657e-3 | 5.767657e-3 | no | 87.048 |
| 85 | 88 | 5.625291e+0 | 5.625291e+0 | high-sun-z21--005000m--red-step | 5.625844e-3 | 5.625844e-3 | no | 88.379 |
| 86 | 89 | 5.636171e+0 | 5.636171e+0 | high-sun-z21--005000m--red-step | 5.491668e-3 | 5.491668e-3 | no | 88.210 |
| 87 | 90 | 5.747913e+0 | 5.747913e+0 | high-sun-z21--005000m--red-step | 5.357090e-3 | 5.357090e-3 | no | 90.598 |
| 88 | 91 | 5.771004e+0 | 5.771004e+0 | high-sun-z21--005000m--red-step | 5.229344e-3 | 5.229344e-3 | no | 94.301 |
| 89 | 92 | 5.677415e+0 | 5.677415e+0 | high-sun-z21--005000m--red-step | 5.103261e-3 | 5.103261e-3 | no | 92.948 |
| 90 | 93 | 5.657089e+0 | 5.657089e+0 | high-sun-z21--005000m--red-step | 4.983525e-3 | 4.983525e-3 | no | 95.289 |
| 91 | 94 | 5.526664e+0 | 5.526664e+0 | high-sun-z21--005000m--red-step | 4.864031e-3 | 4.864031e-3 | no | 99.412 |
| 92 | 95 | 5.346083e+0 | 5.346083e+0 | high-sun-z21--005000m--red-step | 4.750667e-3 | 4.750667e-3 | no | 116.576 |
| 93 | 96 | 5.245471e+0 | 5.245471e+0 | high-sun-z21--005000m--red-step | 4.637081e-3 | 4.637081e-3 | no | 105.124 |
| 94 | 97 | 5.247507e+0 | 5.247507e+0 | high-sun-z21--005000m--red-step | 4.528567e-3 | 4.528567e-3 | no | 98.388 |
| 95 | 98 | 5.147458e+0 | 5.147458e+0 | high-sun-z21--005000m--red-step | 4.420047e-3 | 4.420047e-3 | no | 100.194 |
| 96 | 99 | 5.113383e+0 | 5.113383e+0 | high-sun-z21--005000m--red-step | 4.316679e-3 | 4.316679e-3 | no | 122.024 |
| 97 | 100 | 4.983331e+0 | 4.983331e+0 | high-sun-z21--005000m--red-step | 4.213014e-3 | 4.213014e-3 | no | 107.981 |
| 98 | 101 | 5.043659e+0 | 5.043659e+0 | high-sun-z21--005000m--red-step | 4.114452e-3 | 4.114452e-3 | no | 104.908 |
| 99 | 102 | 4.986814e+0 | 4.986814e+0 | high-sun-z21--005000m--red-step | 4.015415e-3 | 4.015415e-3 | no | 103.554 |
| 100 | 103 | 4.899021e+0 | 4.899021e+0 | high-sun-z21--005000m--red-step | 3.920828e-3 | 3.920828e-3 | no | 101.655 |
| 101 | 104 | 4.842735e+0 | 4.842735e+0 | high-sun-z21--005000m--red-step | 3.825944e-3 | 3.825944e-3 | no | 102.452 |
| 102 | 105 | 4.842777e+0 | 4.842777e+0 | high-sun-z21--005000m--red-step | 3.819424e-3 | 3.819424e-3 | no | 115.023 |
| 103 | 106 | 4.768254e+0 | 4.768254e+0 | high-sun-z21--005000m--red-step | 3.754992e-3 | 3.754992e-3 | no | 111.815 |
| 104 | 107 | 4.600029e+0 | 4.600029e+0 | high-sun-z21--005000m--red-step | 3.608482e-3 | 3.608482e-3 | no | 111.553 |
| 105 | 108 | 4.510303e+0 | 4.510303e+0 | high-sun-z21--005000m--red-step | 3.541241e-3 | 3.541241e-3 | no | 107.071 |
| 106 | 109 | 4.489759e+0 | 4.489759e+0 | high-sun-z21--005000m--red-step | 3.520715e-3 | 3.520715e-3 | no | 108.901 |
| 107 | 110 | 4.435582e+0 | 4.435582e+0 | high-sun-z21--005000m--red-step | 3.481070e-3 | 3.481070e-3 | no | 116.349 |
| 108 | 111 | 4.438783e+0 | 4.438783e+0 | high-sun-z21--005000m--red-step | 3.480846e-3 | 3.480846e-3 | no | 130.911 |
| 109 | 112 | 4.375751e+0 | 4.375751e+0 | high-sun-z21--005000m--red-step | 3.434476e-3 | 3.434476e-3 | no | 121.117 |
| 110 | 113 | 4.399891e+0 | 4.399891e+0 | high-sun-z21--005000m--red-step | 3.446278e-3 | 3.446278e-3 | no | 115.823 |
| 111 | 114 | 4.334866e+0 | 4.334866e+0 | high-sun-z21--005000m--red-step | 3.396846e-3 | 3.396846e-3 | no | 122.836 |
| 112 | 115 | 4.330454e+0 | 4.330454e+0 | high-sun-z21--005000m--red-step | 3.388506e-3 | 3.388506e-3 | no | 131.800 |
| 113 | 116 | 4.252001e+0 | 4.252001e+0 | high-sun-z21--005000m--red-step | 3.330142e-3 | 3.330142e-3 | no | 115.454 |
| 114 | 117 | 4.234531e+0 | 4.234531e+0 | high-sun-z21--005000m--red-step | 3.313328e-3 | 3.313328e-3 | no | 114.940 |
| 115 | 118 | 4.327045e+0 | 4.327045e+0 | high-sun-z21--005000m--red-step | 3.386799e-3 | 3.386799e-3 | no | 123.213 |
| 116 | 119 | 4.347894e+0 | 4.347894e+0 | high-sun-z21--005000m--red-step | 3.407081e-3 | 3.407081e-3 | no | 120.055 |
| 117 | 120 | 4.550438e+0 | 4.550438e+0 | high-sun-z21--005000m--red-step | 3.578015e-3 | 3.578015e-3 | no | 123.927 |
| 118 | 121 | 4.536015e+0 | 4.536015e+0 | high-sun-z21--005000m--red-step | 3.567818e-3 | 3.567818e-3 | no | 127.366 |
| 119 | 122 | 4.453567e+0 | 4.453567e+0 | high-sun-z21--005000m--red-step | 3.497189e-3 | 3.497189e-3 | no | 124.291 |
| 120 | 123 | 4.242219e+0 | 4.242219e+0 | high-sun-z21--005000m--red-step | 3.319636e-3 | 3.319636e-3 | no | 139.003 |
| 121 | 124 | 4.148815e+0 | 4.148815e+0 | high-sun-z21--005000m--red-step | 3.244108e-3 | 3.244108e-3 | no | 146.489 |
| 122 | 125 | 4.155409e+0 | 4.155409e+0 | high-sun-z21--005000m--red-step | 3.249653e-3 | 3.249653e-3 | no | 138.323 |
| 123 | 126 | 4.050440e+0 | 4.050440e+0 | high-sun-z21--005000m--red-step | 3.164142e-3 | 3.164142e-3 | no | 135.717 |
| 124 | 127 | 3.878389e+0 | 3.878389e+0 | high-sun-z21--005000m--red-step | 3.031921e-3 | 3.031921e-3 | no | 134.479 |
| 125 | 128 | 4.282819e+0 | 4.282819e+0 | high-sun-z21--005000m--red-step | 3.349827e-3 | 3.349827e-3 | no | 145.779 |
| 126 | 129 | 4.306301e+0 | 4.306301e+0 | high-sun-z21--005000m--red-step | 3.371521e-3 | 3.371521e-3 | no | 138.675 |
| 127 | 130 | 4.259815e+0 | 4.259815e+0 | high-sun-z21--005000m--red-step | 3.331470e-3 | 3.331470e-3 | no | 144.168 |
| 128 | 131 | 4.467093e+0 | 4.467093e+0 | high-sun-z21--005000m--red-step | 3.508615e-3 | 3.508615e-3 | no | 135.528 |
| 129 | 132 | 4.443227e+0 | 4.443227e+0 | high-sun-z21--005000m--red-step | 3.486605e-3 | 3.486605e-3 | no | 145.667 |
| 130 | 133 | 4.477896e+0 | 4.477896e+0 | high-sun-z21--005000m--red-step | 3.517122e-3 | 3.517122e-3 | no | 144.907 |
| 131 | 134 | 4.441623e+0 | 4.441623e+0 | high-sun-z21--005000m--red-step | 3.485325e-3 | 3.485325e-3 | no | 145.838 |
| 132 | 135 | 4.469895e+0 | 4.469895e+0 | high-sun-z21--005000m--red-step | 3.511247e-3 | 3.511247e-3 | no | 133.889 |
| 133 | 136 | 4.554413e+0 | 4.554413e+0 | high-sun-z21--005000m--red-step | 3.583637e-3 | 3.583637e-3 | no | 141.394 |
| 134 | 137 | 4.555173e+0 | 4.555173e+0 | high-sun-z21--005000m--red-step | 3.585746e-3 | 3.585746e-3 | no | 140.102 |
| 135 | 138 | 4.492706e+0 | 4.492706e+0 | high-sun-z21--005000m--red-step | 3.532746e-3 | 3.532746e-3 | no | 142.801 |
| 136 | 139 | 4.626463e+0 | 4.626463e+0 | high-sun-z21--005000m--red-step | 3.651196e-3 | 3.651196e-3 | no | 147.197 |
| 137 | 140 | 4.484985e+0 | 4.484985e+0 | high-sun-z21--005000m--red-step | 3.529235e-3 | 3.529235e-3 | no | 145.988 |
| 138 | 141 | 4.493593e+0 | 4.493593e+0 | high-sun-z21--005000m--red-step | 3.538897e-3 | 3.538897e-3 | no | 139.855 |
| 139 | 142 | 4.440544e+0 | 4.440544e+0 | high-sun-z21--005000m--red-step | 3.493800e-3 | 3.493800e-3 | no | 143.564 |
| 140 | 143 | 4.434992e+0 | 4.434992e+0 | high-sun-z21--005000m--red-step | 3.491079e-3 | 3.491079e-3 | no | 148.615 |
| 141 | 144 | 4.370868e+0 | 4.370868e+0 | high-sun-z21--005000m--red-step | 3.436526e-3 | 3.436526e-3 | no | 153.528 |
| 142 | 145 | 4.374857e+0 | 4.374857e+0 | high-sun-z21--005000m--red-step | 3.442308e-3 | 3.442308e-3 | no | 143.295 |
| 143 | 146 | 4.463680e+0 | 4.463680e+0 | high-sun-z21--005000m--red-step | 3.518016e-3 | 3.518016e-3 | no | 144.506 |
| 144 | 147 | 4.587845e+0 | 4.587845e+0 | high-sun-z21--005000m--red-step | 3.628459e-3 | 3.628459e-3 | no | 149.087 |
| 145 | 148 | 4.527720e+0 | 4.527720e+0 | high-sun-z21--005000m--red-step | 3.577660e-3 | 3.577660e-3 | no | 159.309 |
| 146 | 149 | 4.442671e+0 | 4.442671e+0 | high-sun-z21--005000m--red-step | 3.505776e-3 | 3.505776e-3 | no | 157.888 |
| 147 | 150 | 4.380650e+0 | 4.380650e+0 | high-sun-z21--005000m--red-step | 3.453181e-3 | 3.453181e-3 | no | 179.520 |
| 148 | 151 | 4.373763e+0 | 4.373763e+0 | high-sun-z21--005000m--red-step | 3.449528e-3 | 3.449528e-3 | no | 159.136 |
| 149 | 152 | 4.301399e+0 | 4.301399e+0 | high-sun-z21--005000m--red-step | 3.388114e-3 | 3.388114e-3 | no | 159.405 |
| 150 | 153 | 4.264406e+0 | 4.264406e+0 | high-sun-z21--005000m--red-step | 3.358663e-3 | 3.358663e-3 | no | 164.711 |
| 151 | 154 | 4.171718e+0 | 4.171718e+0 | high-sun-z21--005000m--red-step | 3.280566e-3 | 3.280566e-3 | no | 157.154 |
| 152 | 155 | 4.150204e+0 | 4.150204e+0 | high-sun-z21--005000m--red-step | 3.264917e-3 | 3.264917e-3 | no | 157.454 |
| 153 | 156 | 3.998295e+0 | 3.998295e+0 | high-sun-z21--005000m--red-step | 3.135114e-3 | 3.135114e-3 | no | 158.041 |
| 154 | 157 | 3.975074e+0 | 3.975074e+0 | high-sun-z21--005000m--red-step | 3.117496e-3 | 3.117496e-3 | no | 159.394 |
| 155 | 158 | 3.899572e+0 | 3.899572e+0 | high-sun-z21--005000m--red-step | 3.053833e-3 | 3.053833e-3 | no | 154.764 |
| 156 | 159 | 3.980016e+0 | 3.980016e+0 | high-sun-z21--005000m--red-step | 3.124652e-3 | 3.124652e-3 | no | 158.984 |
| 157 | 160 | 3.905850e+0 | 3.905850e+0 | high-sun-z21--005000m--red-step | 3.062027e-3 | 3.062027e-3 | no | 158.765 |
| 158 | 161 | 3.895403e+0 | 3.895403e+0 | high-sun-z21--005000m--red-step | 3.055306e-3 | 3.055306e-3 | no | 188.343 |
| 159 | 162 | 3.827441e+0 | 3.827441e+0 | high-sun-z21--005000m--red-step | 2.998263e-3 | 2.998263e-3 | no | 177.606 |
| 160 | 163 | 4.097489e+0 | 4.097489e+0 | high-sun-z21--005000m--red-step | 3.227703e-3 | 3.227703e-3 | no | 169.316 |
| 161 | 164 | 4.047527e+0 | 4.047527e+0 | high-sun-z21--005000m--red-step | 3.184901e-3 | 3.184901e-3 | no | 163.552 |
| 162 | 165 | 4.225835e+0 | 4.225835e+0 | high-sun-z21--005000m--red-step | 3.332994e-3 | 3.332994e-3 | no | 183.522 |
| 163 | 166 | 4.180515e+0 | 4.180515e+0 | high-sun-z21--005000m--red-step | 3.294127e-3 | 3.294127e-3 | no | 169.540 |
| 164 | 167 | 4.174945e+0 | 4.174945e+0 | high-sun-z21--005000m--red-step | 3.291147e-3 | 3.291147e-3 | no | 175.499 |
| 165 | 168 | 4.108636e+0 | 4.108636e+0 | high-sun-z21--005000m--red-step | 3.235268e-3 | 3.235268e-3 | no | 174.242 |
| 166 | 169 | 4.078565e+0 | 4.078565e+0 | high-sun-z21--005000m--red-step | 3.211885e-3 | 3.211885e-3 | no | 183.039 |
| 167 | 170 | 4.000443e+0 | 4.000443e+0 | high-sun-z21--005000m--red-step | 3.146293e-3 | 3.146293e-3 | no | 187.097 |
| 168 | 171 | 3.897233e+0 | 3.897233e+0 | high-sun-z21--005000m--red-step | 3.060387e-3 | 3.060387e-3 | no | 171.815 |
| 169 | 172 | 3.821226e+0 | 3.821226e+0 | high-sun-z21--005000m--red-step | 2.996946e-3 | 2.996946e-3 | no | 184.688 |
| 170 | 173 | 3.783909e+0 | 3.783909e+0 | high-sun-z21--005000m--red-step | 2.968023e-3 | 2.968023e-3 | no | 177.875 |
| 171 | 174 | 3.618716e+0 | 3.618716e+0 | high-sun-z21--005000m--red-step | 2.827814e-3 | 2.827814e-3 | no | 181.123 |
| 172 | 175 | 3.661241e+0 | 3.661241e+0 | high-sun-z21--005000m--red-step | 2.864093e-3 | 2.864093e-3 | no | 188.904 |
| 173 | 176 | 3.600898e+0 | 3.600898e+0 | high-sun-z21--005000m--red-step | 2.813631e-3 | 2.813631e-3 | no | 189.437 |
| 174 | 177 | 3.592663e+0 | 3.592663e+0 | high-sun-z21--005000m--red-step | 2.809035e-3 | 2.809035e-3 | no | 194.885 |
| 175 | 178 | 3.528050e+0 | 3.528050e+0 | high-sun-z21--005000m--red-step | 2.755682e-3 | 2.755682e-3 | no | 195.569 |
| 176 | 179 | 3.496231e+0 | 3.496231e+0 | high-sun-z21--005000m--red-step | 2.731467e-3 | 2.731467e-3 | no | 198.585 |
| 177 | 180 | 3.416326e+0 | 3.416326e+0 | high-sun-z21--005000m--red-step | 2.665539e-3 | 2.665539e-3 | no | 196.053 |
| 178 | 181 | 3.312411e+0 | 3.312411e+0 | high-sun-z21--005000m--red-step | 2.579726e-3 | 2.579726e-3 | no | 185.368 |
| 179 | 182 | 3.229164e+0 | 3.229164e+0 | high-sun-z21--005000m--red-step | 2.511584e-3 | 2.511584e-3 | no | 195.622 |
| 180 | 183 | 3.288546e+0 | 3.288546e+0 | high-sun-z21--005000m--red-step | 2.564893e-3 | 2.564893e-3 | no | 214.781 |
| 181 | 184 | 3.144467e+0 | 3.144467e+0 | high-sun-z21--005000m--red-step | 2.444722e-3 | 2.444722e-3 | no | 191.788 |
| 182 | 185 | 3.120185e+0 | 3.120185e+0 | high-sun-z21--005000m--red-step | 2.426857e-3 | 2.426857e-3 | no | 185.267 |
| 183 | 186 | 3.051761e+0 | 3.051761e+0 | high-sun-z21--005000m--red-step | 2.370869e-3 | 2.370869e-3 | no | 192.620 |
| 184 | 187 | 3.037656e+0 | 3.037656e+0 | high-sun-z21--005000m--red-step | 2.361868e-3 | 2.361868e-3 | no | 188.569 |
| 185 | 188 | 2.972025e+0 | 2.972025e+0 | high-sun-z21--005000m--red-step | 2.308426e-3 | 2.308426e-3 | no | 195.762 |
| 186 | 189 | 2.942513e+0 | 2.942513e+0 | high-sun-z21--005000m--red-step | 2.286402e-3 | 2.286402e-3 | no | 197.960 |
| 187 | 190 | 2.980109e+0 | 2.980109e+0 | high-sun-z21--005000m--red-step | 2.318746e-3 | 2.318746e-3 | no | 198.831 |
| 188 | 191 | 2.966793e+0 | 2.966793e+0 | high-sun-z21--005000m--red-step | 2.309719e-3 | 2.309719e-3 | no | 195.053 |
| 189 | 192 | 2.906585e+0 | 2.906585e+0 | high-sun-z21--005000m--red-step | 2.260370e-3 | 2.260370e-3 | no | 199.527 |
| 190 | 193 | 2.888781e+0 | 2.888781e+0 | high-sun-z21--005000m--red-step | 2.247960e-3 | 2.247960e-3 | no | 199.953 |
| 191 | 194 | 2.819578e+0 | 2.819578e+0 | high-sun-z21--005000m--red-step | 2.191532e-3 | 2.191532e-3 | no | 197.254 |
| 192 | 195 | 2.782306e+0 | 2.782306e+0 | high-sun-z21--005000m--red-step | 2.162920e-3 | 2.162920e-3 | no | 201.141 |
| 193 | 196 | 2.700590e+0 | 2.700590e+0 | high-sun-z21--005000m--red-step | 2.096241e-3 | 2.096241e-3 | no | 208.672 |
| 194 | 197 | 2.668480e+0 | 2.668480e+0 | high-sun-z21--005000m--red-step | 2.072174e-3 | 2.072174e-3 | no | 203.019 |
| 195 | 198 | 2.585631e+0 | 2.585631e+0 | high-sun-z21--005000m--red-step | 2.004825e-3 | 2.004825e-3 | no | 213.040 |
| 196 | 199 | 2.539527e+0 | 2.539527e+0 | high-sun-z21--005000m--red-step | 1.969307e-3 | 1.969307e-3 | no | 199.502 |
| 197 | 200 | 2.391457e+0 | 2.391457e+0 | high-sun-z21--005000m--red-step | 1.851091e-3 | 1.851091e-3 | no | 208.709 |
| 198 | 201 | 2.291670e+0 | 2.291670e+0 | high-sun-z21--005000m--red-step | 1.777520e-3 | 1.777520e-3 | no | 198.867 |
| 199 | 202 | 2.217027e+0 | 2.217027e+0 | high-sun-z21--005000m--red-step | 1.723285e-3 | 1.723285e-3 | no | 199.671 |
| 200 | 203 | 2.026299e+0 | 2.026299e+0 | high-sun-z21--005000m--red-step | 1.579692e-3 | 1.579692e-3 | no | 210.082 |
| 201 | 204 | 2.150219e+0 | 2.150219e+0 | high-sun-z21--005000m--red-step | 1.671409e-3 | 1.671409e-3 | no | 211.227 |
| 202 | 205 | 2.127114e+0 | 2.127114e+0 | high-sun-z21--005000m--red-step | 1.652536e-3 | 1.652536e-3 | no | 213.329 |
| 203 | 206 | 1.848178e+0 | 1.848178e+0 | low-sun-z87--005000m--red-step | 1.248333e-3 | 1.248333e-3 | no | 212.661 |
| 204 | 207 | 1.861676e+0 | 1.861676e+0 | low-sun-z87--005000m--red-step | 1.197205e-3 | 1.197205e-3 | no | 209.347 |
| 205 | 208 | 1.886542e+0 | 1.886542e+0 | low-sun-z87--005000m--red-step | 1.175530e-3 | 1.175530e-3 | no | 204.659 |
| 206 | 209 | 1.899474e+0 | 1.899474e+0 | low-sun-z87--005000m--red-step | 1.232025e-3 | 1.232025e-3 | no | 214.087 |
| 207 | 210 | 1.923960e+0 | 1.923960e+0 | low-sun-z87--005000m--red-step | 1.208682e-3 | 1.208682e-3 | no | 222.471 |
| 208 | 211 | 1.936509e+0 | 1.936509e+0 | low-sun-z87--005000m--red-step | 1.197241e-3 | 1.197241e-3 | no | 265.025 |
| 209 | 212 | 1.960559e+0 | 1.960559e+0 | low-sun-z87--005000m--red-step | 1.160454e-3 | 1.160454e-3 | no | 209.848 |
| 210 | 213 | 1.973291e+0 | 1.973291e+0 | low-sun-z87--005000m--red-step | 1.195623e-3 | 1.195623e-3 | no | 215.092 |
| 211 | 214 | 2.012369e+0 | 2.012369e+0 | low-sun-z87--005000m--red-step | 1.171401e-3 | 1.171401e-3 | no | 214.317 |
| 212 | 215 | 2.015688e+0 | 2.015688e+0 | low-sun-z87--005000m--red-step | 1.175605e-3 | 1.175605e-3 | no | 226.725 |
| 213 | 216 | 2.038725e+0 | 2.038725e+0 | low-sun-z87--005000m--red-step | 1.191020e-3 | 1.191020e-3 | no | 216.478 |
| 214 | 217 | 2.050654e+0 | 2.050654e+0 | low-sun-z87--005000m--red-step | 1.200867e-3 | 1.200867e-3 | no | 213.791 |
| 215 | 218 | 2.073559e+0 | 2.073559e+0 | low-sun-z87--005000m--red-step | 1.216152e-3 | 1.216152e-3 | no | 279.326 |
| 216 | 219 | 2.085307e+0 | 2.085307e+0 | low-sun-z87--005000m--red-step | 1.225845e-3 | 1.225845e-3 | no | 302.603 |
| 217 | 220 | 2.107966e+0 | 2.107966e+0 | low-sun-z87--005000m--red-step | 1.240943e-3 | 1.240943e-3 | no | 272.893 |
| 218 | 221 | 2.118913e+0 | 2.118913e+0 | low-sun-z87--005000m--red-step | 1.250137e-3 | 1.250137e-3 | no | 241.736 |
| 219 | 222 | 2.140952e+0 | 2.140952e+0 | low-sun-z87--005000m--red-step | 1.264845e-3 | 1.264845e-3 | no | 230.885 |
| 220 | 223 | 2.152240e+0 | 2.152240e+0 | low-sun-z87--005000m--red-step | 1.274182e-3 | 1.274182e-3 | no | 239.674 |
| 221 | 224 | 2.174093e+0 | 2.174093e+0 | low-sun-z87--005000m--red-step | 1.288744e-3 | 1.288744e-3 | no | 229.198 |
| 222 | 225 | 2.184696e+0 | 2.184696e+0 | low-sun-z87--005000m--red-step | 1.297649e-3 | 1.297649e-3 | no | 250.211 |
| 223 | 226 | 2.206139e+0 | 2.206139e+0 | low-sun-z87--005000m--red-step | 1.311935e-3 | 1.311935e-3 | no | 233.469 |
| 224 | 227 | 2.216721e+0 | 2.216721e+0 | low-sun-z87--005000m--red-step | 1.320771e-3 | 1.320771e-3 | no | 239.029 |
| 225 | 228 | 2.237946e+0 | 2.237946e+0 | low-sun-z87--005000m--red-step | 1.334887e-3 | 1.334887e-3 | no | 237.021 |
| 226 | 229 | 2.248613e+0 | 2.248613e+0 | low-sun-z87--005000m--red-step | 1.343729e-3 | 1.343729e-3 | no | 250.509 |
| 227 | 230 | 2.269633e+0 | 2.269633e+0 | low-sun-z87--005000m--red-step | 1.357691e-3 | 1.357691e-3 | no | 228.611 |
| 228 | 231 | 2.279369e+0 | 2.279369e+0 | low-sun-z87--005000m--red-step | 1.365972e-3 | 1.365972e-3 | no | 229.916 |
| 229 | 232 | 2.299763e+0 | 2.299763e+0 | low-sun-z87--005000m--red-step | 1.379549e-3 | 1.379549e-3 | no | 243.330 |
| 230 | 233 | 2.309869e+0 | 2.309869e+0 | low-sun-z87--005000m--red-step | 1.387988e-3 | 1.387988e-3 | no | 262.646 |
| 231 | 234 | 2.330166e+0 | 2.330166e+0 | low-sun-z87--005000m--red-step | 1.401469e-3 | 1.401469e-3 | no | 240.426 |
| 232 | 235 | 2.339957e+0 | 2.339957e+0 | low-sun-z87--005000m--red-step | 1.409688e-3 | 1.409688e-3 | no | 239.737 |
| 233 | 236 | 2.360023e+0 | 2.360023e+0 | low-sun-z87--005000m--red-step | 1.422997e-3 | 1.422997e-3 | no | 237.634 |
| 234 | 237 | 2.369363e+0 | 2.369363e+0 | low-sun-z87--005000m--red-step | 1.430919e-3 | 1.430919e-3 | no | 239.196 |
| 235 | 238 | 2.389024e+0 | 2.389024e+0 | low-sun-z87--005000m--red-step | 1.443965e-3 | 1.443965e-3 | no | 233.490 |
| 236 | 239 | 2.398625e+0 | 2.398625e+0 | low-sun-z87--005000m--red-step | 1.451997e-3 | 1.451997e-3 | no | 237.209 |
| 237 | 240 | 2.418119e+0 | 2.418119e+0 | low-sun-z87--005000m--red-step | 1.464916e-3 | 1.464916e-3 | no | 239.086 |
| 238 | 241 | 2.426963e+0 | 2.426963e+0 | low-sun-z87--005000m--red-step | 1.472488e-3 | 1.472488e-3 | no | 251.836 |
| 239 | 242 | 2.446001e+0 | 2.446001e+0 | low-sun-z87--005000m--red-step | 1.485118e-3 | 1.485118e-3 | no | 242.797 |
| 240 | 243 | 2.455049e+0 | 2.455049e+0 | low-sun-z87--005000m--red-step | 1.492756e-3 | 1.492756e-3 | no | 247.199 |
| 241 | 244 | 2.473992e+0 | 2.473992e+0 | low-sun-z87--005000m--red-step | 1.505293e-3 | 1.505293e-3 | no | 241.043 |
| 242 | 245 | 2.483012e+0 | 2.483012e+0 | low-sun-z87--005000m--red-step | 1.512878e-3 | 1.512878e-3 | no | 260.875 |
| 243 | 246 | 2.501794e+0 | 2.501794e+0 | low-sun-z87--005000m--red-step | 1.525290e-3 | 1.525290e-3 | no | 285.629 |
| 244 | 247 | 2.510072e+0 | 2.510072e+0 | low-sun-z87--005000m--red-step | 1.532428e-3 | 1.532428e-3 | no | 285.352 |
| 245 | 248 | 2.528328e+0 | 2.528328e+0 | low-sun-z87--005000m--red-step | 1.544518e-3 | 1.544518e-3 | no | 264.534 |
| 246 | 249 | 2.536961e+0 | 2.536961e+0 | low-sun-z87--005000m--red-step | 1.551817e-3 | 1.551817e-3 | no | 271.030 |
| 247 | 250 | 2.555121e+0 | 2.555121e+0 | low-sun-z87--005000m--red-step | 1.563822e-3 | 1.563822e-3 | no | 270.892 |
| 248 | 251 | 2.563309e+0 | 2.563309e+0 | low-sun-z87--005000m--red-step | 1.570836e-3 | 1.570836e-3 | no | 256.578 |
| 249 | 252 | 2.581211e+0 | 2.581211e+0 | low-sun-z87--005000m--red-step | 1.582661e-3 | 1.582661e-3 | no | 279.041 |
| 250 | 253 | 2.589260e+0 | 2.589260e+0 | low-sun-z87--005000m--red-step | 1.589557e-3 | 1.589557e-3 | no | 266.625 |
| 251 | 254 | 3.672195e+0 | 3.672195e+0 | low-sun-z87--005000m--black | 1.027412e-2 | 1.027412e-2 | no | 292.817 |
| 252 | 255 | 3.662981e+0 | 3.662981e+0 | low-sun-z87--005000m--black | 1.026996e-2 | 1.026996e-2 | no | 310.781 |
| 253 | 256 | 3.661410e+0 | 3.661410e+0 | low-sun-z87--005000m--black | 1.026481e-2 | 1.026481e-2 | no | 289.566 |
| 254 | 257 | 3.652111e+0 | 3.652111e+0 | low-sun-z87--005000m--black | 1.026033e-2 | 1.026033e-2 | no | 294.470 |
| 255 | 258 | 3.650523e+0 | 3.650523e+0 | low-sun-z87--005000m--black | 1.025474e-2 | 1.025474e-2 | no | 299.974 |
| 256 | 259 | 3.641418e+0 | 3.641418e+0 | low-sun-z87--005000m--black | 1.024964e-2 | 1.024964e-2 | no | 291.149 |
| 257 | 260 | 3.639953e+0 | 3.639953e+0 | low-sun-z87--005000m--black | 1.024344e-2 | 1.024344e-2 | no | 288.126 |
| 258 | 261 | 3.630909e+0 | 3.630909e+0 | low-sun-z87--005000m--black | 1.023768e-2 | 1.023768e-2 | no | 289.244 |
| 259 | 262 | 3.629526e+0 | 3.629526e+0 | low-sun-z87--005000m--black | 1.023078e-2 | 1.023078e-2 | no | 348.779 |
| 260 | 263 | 3.620424e+0 | 3.620424e+0 | low-sun-z87--005000m--black | 1.022435e-2 | 1.022435e-2 | no | 284.403 |
| 261 | 264 | 3.619007e+0 | 3.619007e+0 | low-sun-z87--005000m--black | 1.021669e-2 | 1.021669e-2 | no | 334.247 |
| 262 | 265 | 3.609986e+0 | 3.609986e+0 | low-sun-z87--005000m--black | 1.020933e-2 | 1.020933e-2 | no | 367.135 |
| 263 | 266 | 3.608572e+0 | 3.608572e+0 | low-sun-z87--005000m--black | 1.020076e-2 | 1.020076e-2 | no | 286.271 |
| 264 | 267 | 3.599469e+0 | 3.599469e+0 | low-sun-z87--005000m--black | 1.019254e-2 | 1.019254e-2 | no | 296.961 |
| 265 | 268 | 3.598039e+0 | 3.598039e+0 | low-sun-z87--005000m--black | 1.018303e-2 | 1.018303e-2 | no | 297.084 |
| 266 | 269 | 3.589027e+0 | 3.589027e+0 | low-sun-z87--005000m--black | 1.017377e-2 | 1.017377e-2 | no | 297.477 |
| 267 | 270 | 3.587641e+0 | 3.587641e+0 | low-sun-z87--005000m--black | 1.016321e-2 | 1.016321e-2 | no | 349.935 |
| 268 | 271 | 3.578631e+0 | 3.578631e+0 | low-sun-z87--005000m--black | 1.015282e-2 | 1.015282e-2 | no | 322.146 |
| 269 | 272 | 3.577218e+0 | 3.577218e+0 | low-sun-z87--005000m--black | 1.014113e-2 | 1.014113e-2 | no | 318.273 |
| 270 | 273 | 3.568005e+0 | 3.568005e+0 | low-sun-z87--005000m--black | 1.012972e-2 | 1.012972e-2 | no | 317.259 |
| 271 | 274 | 3.566443e+0 | 3.566443e+0 | low-sun-z87--005000m--black | 1.011692e-2 | 1.011692e-2 | no | 284.756 |
| 272 | 275 | 3.557296e+0 | 3.557296e+0 | low-sun-z87--005000m--black | 1.010424e-2 | 1.010424e-2 | no | 299.519 |
| 273 | 276 | 3.555711e+0 | 3.555711e+0 | low-sun-z87--005000m--black | 1.009022e-2 | 1.009022e-2 | no | 331.313 |
| 274 | 277 | 3.546484e+0 | 3.546484e+0 | low-sun-z87--005000m--black | 1.007635e-2 | 1.007635e-2 | no | 497.843 |
| 275 | 278 | 3.544858e+0 | 3.544858e+0 | low-sun-z87--005000m--black | 1.006111e-2 | 1.006111e-2 | no | 397.217 |
| 276 | 279 | 3.535535e+0 | 3.535535e+0 | low-sun-z87--005000m--black | 1.004604e-2 | 1.004604e-2 | no | 345.020 |
| 277 | 280 | 3.533810e+0 | 3.533810e+0 | low-sun-z87--005000m--black | 1.002958e-2 | 1.002958e-2 | no | 372.983 |
| 278 | 281 | 3.524440e+0 | 3.524440e+0 | low-sun-z87--005000m--black | 1.001318e-2 | 1.001318e-2 | no | 333.019 |
| 279 | 282 | 3.522599e+0 | 3.522599e+0 | low-sun-z87--005000m--black | 9.995451e-3 | 9.995451e-3 | no | 343.242 |
| 280 | 283 | 3.512986e+0 | 3.512986e+0 | low-sun-z87--005000m--black | 9.977898e-3 | 9.977898e-3 | no | 363.246 |
| 281 | 284 | 3.510971e+0 | 3.510971e+0 | low-sun-z87--005000m--black | 9.958956e-3 | 9.958956e-3 | no | 411.626 |
| 282 | 285 | 3.501379e+0 | 3.501379e+0 | low-sun-z87--005000m--black | 9.940103e-3 | 9.940103e-3 | no | 406.791 |
| 283 | 286 | 3.499313e+0 | 3.499313e+0 | low-sun-z87--005000m--black | 9.919911e-3 | 9.919911e-3 | no | 448.379 |
| 284 | 287 | 3.489619e+0 | 3.489619e+0 | low-sun-z87--005000m--black | 9.899812e-3 | 9.899812e-3 | no | 397.489 |
| 285 | 288 | 3.487451e+0 | 3.487451e+0 | low-sun-z87--005000m--black | 9.878396e-3 | 9.878396e-3 | no | 384.008 |
| 286 | 289 | 3.477495e+0 | 3.477495e+0 | low-sun-z87--005000m--black | 9.857175e-3 | 9.857175e-3 | no | 368.031 |
| 287 | 290 | 3.475104e+0 | 3.475104e+0 | low-sun-z87--005000m--black | 9.834611e-3 | 9.834611e-3 | no | 347.170 |
| 288 | 291 | 3.465104e+0 | 3.465104e+0 | low-sun-z87--005000m--black | 9.812131e-3 | 9.812131e-3 | no | 368.908 |
| 289 | 292 | 3.462580e+0 | 3.462580e+0 | low-sun-z87--005000m--black | 9.788390e-3 | 9.788390e-3 | no | 361.217 |
| 290 | 293 | 3.452376e+0 | 3.452376e+0 | low-sun-z87--005000m--black | 9.764829e-3 | 9.764829e-3 | no | 349.673 |
| 291 | 294 | 3.449709e+0 | 3.449709e+0 | low-sun-z87--005000m--black | 9.739988e-3 | 9.739988e-3 | no | 363.250 |
| 292 | 295 | 3.439417e+0 | 3.439417e+0 | low-sun-z87--005000m--black | 9.715324e-3 | 9.715324e-3 | no | 383.151 |
| 293 | 296 | 3.436634e+0 | 3.436634e+0 | low-sun-z87--005000m--black | 9.689411e-3 | 9.689411e-3 | no | 354.521 |
| 294 | 297 | 3.426228e+0 | 3.426228e+0 | low-sun-z87--005000m--black | 9.663638e-3 | 9.663638e-3 | no | 374.868 |
| 295 | 298 | 3.423285e+0 | 3.423285e+0 | low-sun-z87--005000m--black | 9.636680e-3 | 9.636680e-3 | no | 456.671 |
| 296 | 299 | 3.412561e+0 | 3.412561e+0 | low-sun-z87--005000m--black | 9.609995e-3 | 9.609995e-3 | no | 517.599 |
| 297 | 300 | 3.409369e+0 | 3.409369e+0 | low-sun-z87--005000m--black | 9.582098e-3 | 9.582098e-3 | no | 425.265 |
| 298 | 301 | 3.398626e+0 | 3.398626e+0 | low-sun-z87--005000m--black | 9.554385e-3 | 9.554385e-3 | no | 411.694 |
| 299 | 302 | 3.395333e+0 | 3.395333e+0 | low-sun-z87--005000m--black | 9.525539e-3 | 9.525539e-3 | no | 385.166 |
| 300 | 303 | 3.384437e+0 | 3.384437e+0 | low-sun-z87--005000m--black | 9.496931e-3 | 9.496931e-3 | no | 391.880 |
| 301 | 304 | 3.381020e+0 | 3.381020e+0 | low-sun-z87--005000m--black | 9.467206e-3 | 9.467206e-3 | no | 360.598 |
| 302 | 305 | 3.369905e+0 | 3.369905e+0 | low-sun-z87--005000m--black | 9.437794e-3 | 9.437794e-3 | no | 384.882 |
| 303 | 306 | 3.366290e+0 | 3.366290e+0 | low-sun-z87--005000m--black | 9.407268e-3 | 9.407268e-3 | no | 424.459 |
| 304 | 307 | 3.355090e+0 | 3.355090e+0 | low-sun-z87--005000m--black | 9.376982e-3 | 9.376982e-3 | no | 424.542 |
| 305 | 308 | 3.351314e+0 | 3.351314e+0 | low-sun-z87--005000m--black | 9.345666e-3 | 9.345666e-3 | no | 426.719 |
| 306 | 309 | 3.339850e+0 | 3.339850e+0 | low-sun-z87--005000m--black | 9.314706e-3 | 9.314706e-3 | no | 315.199 |
| 307 | 310 | 3.335887e+0 | 3.335887e+0 | low-sun-z87--005000m--black | 9.282696e-3 | 9.282696e-3 | no | 322.988 |
| 308 | 311 | 3.324389e+0 | 3.324389e+0 | low-sun-z87--005000m--black | 9.251008e-3 | 9.251008e-3 | no | 344.302 |
| 309 | 312 | 3.320338e+0 | 3.320338e+0 | low-sun-z87--005000m--black | 9.218323e-3 | 9.218323e-3 | no | 341.741 |
| 310 | 313 | 3.308726e+0 | 3.308726e+0 | low-sun-z87--005000m--black | 9.185962e-3 | 9.185962e-3 | no | 372.525 |
| 311 | 314 | 3.304547e+0 | 3.304547e+0 | low-sun-z87--005000m--black | 9.152651e-3 | 9.152651e-3 | no | 414.525 |
| 312 | 315 | 3.292640e+0 | 3.292640e+0 | low-sun-z87--005000m--black | 9.119779e-3 | 9.119779e-3 | no | 432.935 |
| 313 | 316 | 3.288227e+0 | 3.288227e+0 | low-sun-z87--005000m--black | 9.085941e-3 | 9.085941e-3 | no | 413.695 |
| 314 | 317 | 3.276301e+0 | 3.276301e+0 | low-sun-z87--005000m--black | 9.052455e-3 | 9.052455e-3 | no | 362.404 |
| 315 | 318 | 3.271784e+0 | 3.271784e+0 | low-sun-z87--005000m--black | 9.018083e-3 | 9.018083e-3 | no | 368.469 |
| 316 | 319 | 3.259690e+0 | 3.259690e+0 | low-sun-z87--005000m--black | 8.984140e-3 | 8.984140e-3 | no | 402.088 |
| 317 | 320 | 3.255063e+0 | 3.255063e+0 | low-sun-z87--005000m--black | 8.949309e-3 | 8.949309e-3 | no | 380.868 |
| 318 | 321 | 3.242855e+0 | 3.242855e+0 | low-sun-z87--005000m--black | 8.914937e-3 | 8.914937e-3 | no | 390.251 |
| 319 | 322 | 3.238109e+0 | 3.238109e+0 | low-sun-z87--005000m--black | 8.879696e-3 | 8.879696e-3 | no | 396.482 |
| 320 | 323 | 3.225832e+0 | 3.225832e+0 | low-sun-z87--005000m--black | 8.844865e-3 | 8.844865e-3 | no | 426.181 |
| 321 | 324 | 3.220962e+0 | 3.220962e+0 | low-sun-z87--005000m--black | 8.809233e-3 | 8.809233e-3 | no | 383.812 |
| 322 | 325 | 3.208417e+0 | 3.208417e+0 | low-sun-z87--005000m--black | 8.774128e-3 | 8.774128e-3 | no | 405.510 |
| 323 | 326 | 3.203360e+0 | 3.203360e+0 | low-sun-z87--005000m--black | 8.738196e-3 | 8.738196e-3 | no | 398.477 |
| 324 | 327 | 3.190842e+0 | 3.190842e+0 | low-sun-z87--005000m--black | 8.702725e-3 | 8.702725e-3 | no | 406.159 |
| 325 | 328 | 3.185742e+0 | 3.185742e+0 | low-sun-z87--005000m--black | 8.666486e-3 | 8.666486e-3 | no | 438.832 |
| 326 | 329 | 3.173135e+0 | 3.173135e+0 | low-sun-z87--005000m--black | 8.630736e-3 | 8.630736e-3 | no | 420.133 |
| 327 | 330 | 3.167964e+0 | 3.167964e+0 | low-sun-z87--005000m--black | 8.594240e-3 | 8.594240e-3 | no | 431.044 |
| 328 | 331 | 3.155152e+0 | 3.155152e+0 | low-sun-z87--005000m--black | 8.558314e-3 | 8.558314e-3 | no | 412.999 |
| 329 | 332 | 3.149821e+0 | 3.149821e+0 | low-sun-z87--005000m--black | 8.521631e-3 | 8.521631e-3 | no | 423.971 |
| 330 | 333 | 3.137010e+0 | 3.137010e+0 | low-sun-z87--005000m--black | 8.485439e-3 | 8.485439e-3 | no | 370.156 |
| 331 | 334 | 3.131600e+0 | 3.131600e+0 | low-sun-z87--005000m--black | 8.448560e-3 | 8.448560e-3 | no | 408.348 |
| 332 | 335 | 3.118617e+0 | 3.118617e+0 | low-sun-z87--005000m--black | 8.412258e-3 | 8.412258e-3 | no | 374.891 |
| 333 | 336 | 3.113114e+0 | 3.113114e+0 | low-sun-z87--005000m--black | 8.375251e-3 | 8.375251e-3 | no | 408.265 |
| 334 | 337 | 3.100131e+0 | 3.100131e+0 | low-sun-z87--005000m--black | 8.338805e-3 | 8.338805e-3 | no | 422.613 |
| 335 | 338 | 3.094598e+0 | 3.094598e+0 | low-sun-z87--005000m--black | 8.301683e-3 | 8.301683e-3 | no | 374.346 |
| 336 | 339 | 3.081583e+0 | 3.081583e+0 | low-sun-z87--005000m--black | 8.265099e-3 | 8.265099e-3 | no | 380.379 |
| 337 | 340 | 3.075989e+0 | 3.075989e+0 | low-sun-z87--005000m--black | 8.227882e-3 | 8.227882e-3 | no | 406.699 |
| 338 | 341 | 3.062743e+0 | 3.062743e+0 | low-sun-z87--005000m--black | 8.191304e-3 | 8.191304e-3 | no | 405.205 |
| 339 | 342 | 3.056996e+0 | 3.056996e+0 | low-sun-z87--005000m--black | 8.154066e-3 | 8.154066e-3 | no | 374.588 |
| 340 | 343 | 3.043822e+0 | 3.043822e+0 | low-sun-z87--005000m--black | 8.117384e-3 | 8.117384e-3 | no | 399.961 |
| 341 | 344 | 3.038066e+0 | 3.038066e+0 | low-sun-z87--005000m--black | 8.080102e-3 | 8.080102e-3 | no | 386.805 |
| 342 | 345 | 3.024821e+0 | 3.024821e+0 | low-sun-z87--005000m--black | 8.043422e-3 | 8.043422e-3 | no | 427.147 |
| 343 | 346 | 3.019044e+0 | 3.019044e+0 | low-sun-z87--005000m--black | 8.006140e-3 | 8.006140e-3 | no | 415.320 |
| 344 | 347 | 3.005712e+0 | 3.005712e+0 | low-sun-z87--005000m--black | 7.969498e-3 | 7.969498e-3 | no | 414.265 |
| 345 | 348 | 2.999869e+0 | 2.999869e+0 | low-sun-z87--005000m--black | 7.932253e-3 | 7.932253e-3 | no | 425.350 |
| 346 | 349 | 2.986565e+0 | 2.986565e+0 | low-sun-z87--005000m--black | 7.895585e-3 | 7.895585e-3 | no | 425.444 |
| 347 | 350 | 2.980682e+0 | 2.980682e+0 | low-sun-z87--005000m--black | 7.858367e-3 | 7.858367e-3 | no | 413.665 |
| 348 | 351 | 2.967206e+0 | 2.967206e+0 | low-sun-z87--005000m--black | 7.821818e-3 | 7.821818e-3 | no | 432.156 |
| 349 | 352 | 2.961242e+0 | 2.961242e+0 | low-sun-z87--005000m--black | 7.784689e-3 | 7.784689e-3 | no | 447.185 |
| 350 | 353 | 2.947856e+0 | 2.947856e+0 | low-sun-z87--005000m--black | 7.748176e-3 | 7.748176e-3 | no | 467.265 |
| 351 | 354 | 2.941928e+0 | 2.941928e+0 | low-sun-z87--005000m--black | 7.711121e-3 | 7.711121e-3 | no | 420.501 |
| 352 | 355 | 2.928541e+0 | 2.928541e+0 | low-sun-z87--005000m--black | 7.674681e-3 | 7.674681e-3 | no | 428.606 |
| 353 | 356 | 2.922616e+0 | 2.922616e+0 | low-sun-z87--005000m--black | 7.637719e-3 | 7.637719e-3 | no | 501.251 |
| 354 | 357 | 2.909068e+0 | 2.909068e+0 | low-sun-z87--005000m--black | 7.601450e-3 | 7.601450e-3 | no | 446.212 |
| 355 | 358 | 2.903046e+0 | 2.903046e+0 | low-sun-z87--005000m--black | 7.564635e-3 | 7.564635e-3 | no | 451.371 |
| 356 | 359 | 2.889596e+0 | 2.889596e+0 | low-sun-z87--005000m--black | 7.528428e-3 | 7.528428e-3 | no | 481.541 |
| 357 | 360 | 2.883589e+0 | 2.883589e+0 | low-sun-z87--005000m--black | 7.491730e-3 | 7.491730e-3 | no | 377.339 |
| 358 | 361 | 2.870067e+0 | 2.870067e+0 | low-sun-z87--005000m--black | 7.455701e-3 | 7.455701e-3 | no | 382.884 |
| 359 | 362 | 2.864062e+0 | 2.864062e+0 | low-sun-z87--005000m--black | 7.419160e-3 | 7.419160e-3 | no | 393.995 |
| 360 | 363 | 2.850569e+0 | 2.850569e+0 | low-sun-z87--005000m--black | 7.383286e-3 | 7.383286e-3 | no | 369.793 |
| 361 | 364 | 2.844586e+0 | 2.844586e+0 | low-sun-z87--005000m--black | 7.346912e-3 | 7.346912e-3 | no | 388.745 |
| 362 | 365 | 2.831144e+0 | 2.831144e+0 | low-sun-z87--005000m--black | 7.311160e-3 | 7.311160e-3 | no | 369.699 |
| 363 | 366 | 2.825171e+0 | 2.825171e+0 | low-sun-z87--005000m--black | 7.274946e-3 | 7.274946e-3 | no | 375.482 |
| 364 | 367 | 2.811568e+0 | 2.811568e+0 | low-sun-z87--005000m--black | 7.239441e-3 | 7.239441e-3 | no | 365.755 |
| 365 | 368 | 2.805525e+0 | 2.805525e+0 | low-sun-z87--005000m--black | 7.203439e-3 | 7.203439e-3 | no | 386.762 |
| 366 | 369 | 2.792066e+0 | 2.792066e+0 | low-sun-z87--005000m--black | 7.168074e-3 | 7.168074e-3 | no | 388.875 |
| 367 | 370 | 2.786095e+0 | 2.786095e+0 | low-sun-z87--005000m--black | 7.132253e-3 | 7.132253e-3 | no | 390.820 |
| 368 | 371 | 2.772649e+0 | 2.772649e+0 | low-sun-z87--005000m--black | 7.097089e-3 | 7.097089e-3 | no | 394.982 |
| 369 | 372 | 2.766726e+0 | 2.766726e+0 | low-sun-z87--005000m--black | 7.061471e-3 | 7.061471e-3 | no | 386.378 |
| 370 | 373 | 2.753210e+0 | 2.753210e+0 | low-sun-z87--005000m--black | 7.026555e-3 | 7.026555e-3 | no | 394.938 |
| 371 | 374 | 2.747261e+0 | 2.747261e+0 | low-sun-z87--005000m--black | 6.991170e-3 | 6.991170e-3 | no | 380.568 |
| 372 | 375 | 2.733856e+0 | 2.733856e+0 | low-sun-z87--005000m--black | 6.956413e-3 | 6.956413e-3 | no | 373.121 |
| 373 | 376 | 2.727943e+0 | 2.727943e+0 | low-sun-z87--005000m--black | 6.921234e-3 | 6.921234e-3 | no | 388.248 |
| 374 | 377 | 2.714448e+0 | 2.714448e+0 | low-sun-z87--005000m--black | 6.886752e-3 | 6.886752e-3 | no | 387.184 |
| 375 | 378 | 2.708538e+0 | 2.708538e+0 | low-sun-z87--005000m--black | 6.851818e-3 | 6.851818e-3 | no | 389.254 |
| 376 | 379 | 2.695164e+0 | 2.695164e+0 | low-sun-z87--005000m--black | 6.817546e-3 | 6.817546e-3 | no | 384.959 |
| 377 | 380 | 2.689341e+0 | 2.689341e+0 | low-sun-z87--005000m--black | 6.782842e-3 | 6.782842e-3 | no | 390.002 |
| 378 | 381 | 2.676035e+0 | 2.676035e+0 | low-sun-z87--005000m--black | 6.748780e-3 | 6.748780e-3 | no | 417.877 |
| 379 | 382 | 2.670266e+0 | 2.670266e+0 | low-sun-z87--005000m--black | 6.714306e-3 | 6.714306e-3 | no | 463.377 |
| 380 | 383 | 2.656832e+0 | 2.656832e+0 | low-sun-z87--005000m--black | 6.680547e-3 | 6.680547e-3 | no | 468.749 |
| 381 | 384 | 2.651018e+0 | 2.651018e+0 | low-sun-z87--005000m--black | 6.646346e-3 | 6.646346e-3 | no | 432.728 |
| 382 | 385 | 2.637751e+0 | 2.637751e+0 | low-sun-z87--005000m--black | 6.612779e-3 | 6.612779e-3 | no | 465.338 |
| 383 | 386 | 2.632023e+0 | 2.632023e+0 | low-sun-z87--005000m--black | 6.578814e-3 | 6.578814e-3 | no | 474.390 |
| 384 | 387 | 2.618757e+0 | 2.618757e+0 | low-sun-z87--005000m--black | 6.545521e-3 | 6.545521e-3 | no | 528.451 |
| 385 | 388 | 2.613096e+0 | 2.613096e+0 | low-sun-z87--005000m--black | 6.511813e-3 | 6.511813e-3 | no | 472.664 |
| 386 | 389 | 2.599860e+0 | 2.599860e+0 | low-sun-z87--005000m--black | 6.478791e-3 | 6.478791e-3 | no | 485.084 |
| 387 | 390 | 2.594245e+0 | 2.594245e+0 | low-sun-z87--005000m--black | 6.445351e-3 | 6.445351e-3 | no | 498.301 |
| 388 | 391 | 2.581125e+0 | 2.581125e+0 | low-sun-z87--005000m--black | 6.412542e-3 | 6.412542e-3 | no | 520.289 |
| 389 | 392 | 2.575569e+0 | 2.575569e+0 | low-sun-z87--005000m--black | 6.379350e-3 | 6.379350e-3 | no | 475.594 |
| 390 | 393 | 2.562342e+0 | 2.562342e+0 | low-sun-z87--005000m--black | 6.346861e-3 | 6.346861e-3 | no | 468.040 |
| 391 | 394 | 2.556780e+0 | 2.556780e+0 | low-sun-z87--005000m--black | 6.313955e-3 | 6.313955e-3 | no | 499.331 |
| 392 | 395 | 2.543734e+0 | 2.543734e+0 | low-sun-z87--005000m--black | 6.281692e-3 | 6.281692e-3 | no | 483.235 |
| 393 | 396 | 2.538293e+0 | 2.538293e+0 | low-sun-z87--005000m--black | 6.249042e-3 | 6.249042e-3 | no | 504.282 |
| 394 | 397 | 2.525317e+0 | 2.525317e+0 | low-sun-z87--005000m--black | 6.217037e-3 | 6.217037e-3 | no | 584.450 |
| 395 | 398 | 2.519966e+0 | 2.519966e+0 | low-sun-z87--005000m--black | 6.184650e-3 | 6.184650e-3 | no | 536.747 |
| 396 | 399 | 2.506920e+0 | 2.506920e+0 | low-sun-z87--005000m--black | 6.152959e-3 | 6.152959e-3 | no | 533.566 |
| 397 | 400 | 2.938056e+0 | 2.938056e+0 | low-sun-z87--005000m--black | 7.398021e-3 | 7.398021e-3 | no | 509.518 |
| 398 | 401 | 2.925276e+0 | 2.925276e+0 | low-sun-z87--005000m--black | 7.367407e-3 | 7.367407e-3 | no | 464.368 |
| 399 | 402 | 2.918915e+0 | 2.918915e+0 | low-sun-z87--005000m--black | 7.336412e-3 | 7.336412e-3 | no | 480.203 |
| 400 | 403 | 2.906116e+0 | 2.906116e+0 | low-sun-z87--005000m--black | 7.306074e-3 | 7.306074e-3 | no | 473.774 |
| 401 | 404 | 2.899801e+0 | 2.899801e+0 | low-sun-z87--005000m--black | 7.275327e-3 | 7.275327e-3 | no | 447.519 |
| 402 | 405 | 2.887095e+0 | 2.887095e+0 | low-sun-z87--005000m--black | 7.245219e-3 | 7.245219e-3 | no | 485.254 |
| 403 | 406 | 2.880860e+0 | 2.880860e+0 | low-sun-z87--005000m--black | 7.214708e-3 | 7.214708e-3 | no | 512.160 |
| 404 | 407 | 2.868237e+0 | 2.868237e+0 | low-sun-z87--005000m--black | 7.184799e-3 | 7.184799e-3 | no | 493.439 |
| 405 | 408 | 2.862061e+0 | 2.862061e+0 | low-sun-z87--005000m--black | 7.154509e-3 | 7.154509e-3 | no | 499.294 |
| 406 | 409 | 2.849357e+0 | 2.849357e+0 | low-sun-z87--005000m--black | 7.124888e-3 | 7.124888e-3 | no | 487.251 |
| 407 | 410 | 2.843169e+0 | 2.843169e+0 | low-sun-z87--005000m--black | 7.094851e-3 | 7.094851e-3 | no | 521.134 |
| 408 | 411 | 2.830622e+0 | 2.830622e+0 | low-sun-z87--005000m--black | 7.065410e-3 | 7.065410e-3 | no | 520.980 |
| 409 | 412 | 2.824531e+0 | 2.824531e+0 | low-sun-z87--005000m--black | 7.035586e-3 | 7.035586e-3 | no | 490.471 |
| 410 | 413 | 2.812024e+0 | 2.812024e+0 | low-sun-z87--005000m--black | 7.006377e-3 | 7.006377e-3 | no | 519.847 |
| 411 | 414 | 2.806011e+0 | 2.806011e+0 | low-sun-z87--005000m--black | 6.976775e-3 | 6.976775e-3 | no | 488.372 |
| 412 | 415 | 2.793511e+0 | 2.793511e+0 | low-sun-z87--005000m--black | 6.947811e-3 | 6.947811e-3 | no | 481.927 |
| 413 | 416 | 2.787531e+0 | 2.787531e+0 | low-sun-z87--005000m--black | 6.918441e-3 | 6.918441e-3 | no | 495.769 |
| 414 | 417 | 2.775147e+0 | 2.775147e+0 | low-sun-z87--005000m--black | 6.889646e-3 | 6.889646e-3 | no | 485.944 |
| 415 | 418 | 2.769230e+0 | 2.769230e+0 | low-sun-z87--005000m--black | 6.860477e-3 | 6.860477e-3 | no | 504.306 |
| 416 | 419 | 2.756798e+0 | 2.756798e+0 | low-sun-z87--005000m--black | 6.831942e-3 | 6.831942e-3 | no | 504.083 |
| 417 | 420 | 2.750908e+0 | 2.750908e+0 | low-sun-z87--005000m--black | 6.803001e-3 | 6.803001e-3 | no | 472.858 |
| 418 | 421 | 2.738617e+0 | 2.738617e+0 | low-sun-z87--005000m--black | 6.774650e-3 | 6.774650e-3 | no | 481.342 |
| 419 | 422 | 2.732833e+0 | 2.732833e+0 | low-sun-z87--005000m--black | 6.745909e-3 | 6.745909e-3 | no | 475.160 |
| 420 | 423 | 2.720620e+0 | 2.720620e+0 | low-sun-z87--005000m--black | 6.717745e-3 | 6.717745e-3 | no | 510.039 |
| 421 | 424 | 2.714914e+0 | 2.714914e+0 | low-sun-z87--005000m--black | 6.689201e-3 | 6.689201e-3 | no | 510.764 |
| 422 | 425 | 2.702638e+0 | 2.702638e+0 | low-sun-z87--005000m--black | 6.661287e-3 | 6.661287e-3 | no | 518.762 |
| 423 | 426 | 2.696929e+0 | 2.696929e+0 | low-sun-z87--005000m--black | 6.632965e-3 | 6.632965e-3 | no | 453.390 |
| 424 | 427 | 2.684806e+0 | 2.684806e+0 | low-sun-z87--005000m--black | 6.605202e-3 | 6.605202e-3 | no | 478.100 |
| 425 | 428 | 2.679186e+0 | 2.679186e+0 | low-sun-z87--005000m--black | 6.577064e-3 | 6.577064e-3 | no | 437.145 |
| 426 | 429 | 2.667075e+0 | 2.667075e+0 | low-sun-z87--005000m--black | 6.549520e-3 | 6.549520e-3 | no | 431.234 |
| 427 | 430 | 2.661525e+0 | 2.661525e+0 | low-sun-z87--005000m--black | 6.521582e-3 | 6.521582e-3 | no | 428.026 |
| 428 | 431 | 2.649483e+0 | 2.649483e+0 | low-sun-z87--005000m--black | 6.494237e-3 | 6.494237e-3 | no | 484.624 |
| 429 | 432 | 2.644006e+0 | 2.644006e+0 | low-sun-z87--005000m--black | 6.466495e-3 | 6.466495e-3 | no | 465.239 |
| 430 | 433 | 2.632070e+0 | 2.632070e+0 | low-sun-z87--005000m--black | 6.439301e-3 | 6.439301e-3 | no | 446.802 |
| 431 | 434 | 2.626661e+0 | 2.626661e+0 | low-sun-z87--005000m--black | 6.411737e-3 | 6.411737e-3 | no | 524.480 |
| 432 | 435 | 2.614654e+0 | 2.614654e+0 | low-sun-z87--005000m--black | 6.384782e-3 | 6.384782e-3 | no | 441.773 |
| 433 | 436 | 2.609252e+0 | 2.609252e+0 | low-sun-z87--005000m--black | 6.357423e-3 | 6.357423e-3 | no | 465.837 |
| 434 | 437 | 2.597410e+0 | 2.597410e+0 | low-sun-z87--005000m--black | 6.330616e-3 | 6.330616e-3 | no | 462.628 |
| 435 | 438 | 2.592120e+0 | 2.592120e+0 | low-sun-z87--005000m--black | 6.303430e-3 | 6.303430e-3 | no | 450.448 |
| 436 | 439 | 2.580339e+0 | 2.580339e+0 | low-sun-z87--005000m--black | 6.276803e-3 | 6.276803e-3 | no | 446.616 |
| 437 | 440 | 2.575137e+0 | 2.575137e+0 | low-sun-z87--005000m--black | 6.249796e-3 | 6.249796e-3 | no | 446.518 |
| 438 | 441 | 2.563334e+0 | 2.563334e+0 | low-sun-z87--005000m--black | 6.223382e-3 | 6.223382e-3 | no | 515.236 |
| 439 | 442 | 2.558153e+0 | 2.558153e+0 | low-sun-z87--005000m--black | 6.196570e-3 | 6.196570e-3 | no | 541.566 |
| 440 | 443 | 2.546489e+0 | 2.546489e+0 | low-sun-z87--005000m--black | 6.170288e-3 | 6.170288e-3 | no | 549.294 |
| 441 | 444 | 2.541387e+0 | 2.541387e+0 | low-sun-z87--005000m--black | 6.143641e-3 | 6.143641e-3 | no | 556.634 |
| 442 | 445 | 2.529697e+0 | 2.529697e+0 | low-sun-z87--005000m--black | 6.117572e-3 | 6.117572e-3 | no | 517.869 |
| 443 | 446 | 2.524644e+0 | 2.524644e+0 | low-sun-z87--005000m--black | 6.091111e-3 | 6.091111e-3 | no | 534.563 |
| 444 | 447 | 2.513077e+0 | 2.513077e+0 | low-sun-z87--005000m--black | 6.065204e-3 | 6.065204e-3 | no | 582.214 |
| 445 | 448 | 2.508125e+0 | 2.508125e+0 | low-sun-z87--005000m--black | 6.038915e-3 | 6.038915e-3 | no | 488.600 |
| 446 | 449 | 2.496653e+0 | 2.496653e+0 | low-sun-z87--005000m--black | 6.013155e-3 | 6.013155e-3 | no | 468.009 |
| 447 | 450 | 2.491781e+0 | 2.491781e+0 | low-sun-z87--005000m--black | 5.987030e-3 | 5.987030e-3 | no | 456.891 |
| 448 | 451 | 2.480234e+0 | 2.480234e+0 | low-sun-z87--005000m--black | 5.961490e-3 | 5.961490e-3 | no | 521.660 |
| 449 | 452 | 2.475361e+0 | 2.475361e+0 | low-sun-z87--005000m--black | 5.935556e-3 | 5.935556e-3 | no | 457.916 |
| 450 | 453 | 2.463982e+0 | 2.463982e+0 | low-sun-z87--005000m--black | 5.910143e-3 | 5.910143e-3 | no | 463.509 |
| 451 | 454 | 2.459214e+0 | 2.459214e+0 | low-sun-z87--005000m--black | 5.884368e-3 | 5.884368e-3 | no | 501.957 |
| 452 | 455 | 2.447870e+0 | 2.447870e+0 | low-sun-z87--005000m--black | 5.859137e-3 | 5.859137e-3 | no | 525.304 |
| 453 | 456 | 2.443185e+0 | 2.443185e+0 | low-sun-z87--005000m--black | 5.833532e-3 | 5.833532e-3 | no | 553.140 |
| 454 | 457 | 2.431874e+0 | 2.431874e+0 | low-sun-z87--005000m--black | 5.808485e-3 | 5.808485e-3 | no | 571.287 |
| 455 | 458 | 2.427245e+0 | 2.427245e+0 | low-sun-z87--005000m--black | 5.783056e-3 | 5.783056e-3 | no | 597.422 |
| 456 | 459 | 2.416059e+0 | 2.416059e+0 | low-sun-z87--005000m--black | 5.758138e-3 | 5.758138e-3 | no | 529.138 |
| 457 | 460 | 2.411506e+0 | 2.411506e+0 | low-sun-z87--005000m--black | 5.732865e-3 | 5.732865e-3 | no | 514.571 |
| 458 | 461 | 2.400260e+0 | 2.400260e+0 | low-sun-z87--005000m--black | 5.708156e-3 | 5.708156e-3 | no | 482.529 |
| 459 | 462 | 2.395730e+0 | 2.395730e+0 | low-sun-z87--005000m--black | 5.683064e-3 | 5.683064e-3 | no | 519.866 |
| 460 | 463 | 2.384644e+0 | 2.384644e+0 | low-sun-z87--005000m--black | 5.658494e-3 | 5.658494e-3 | no | 517.299 |
| 461 | 464 | 2.380231e+0 | 2.380231e+0 | low-sun-z87--005000m--black | 5.633561e-3 | 5.633561e-3 | no | 522.029 |
| 462 | 465 | 2.369223e+0 | 2.369223e+0 | low-sun-z87--005000m--black | 5.609144e-3 | 5.609144e-3 | no | 558.302 |
| 463 | 466 | 2.364899e+0 | 2.364899e+0 | low-sun-z87--005000m--black | 5.584370e-3 | 5.584370e-3 | no | 621.279 |
| 464 | 467 | 2.353841e+0 | 2.353841e+0 | low-sun-z87--005000m--black | 5.560156e-3 | 5.560156e-3 | no | 618.051 |
| 465 | 468 | 2.349527e+0 | 2.349527e+0 | low-sun-z87--005000m--black | 5.535562e-3 | 5.535562e-3 | no | 551.937 |
| 466 | 469 | 2.338629e+0 | 2.338629e+0 | low-sun-z87--005000m--black | 5.511469e-3 | 5.511469e-3 | no | 572.434 |
| 467 | 470 | 2.334409e+0 | 2.334409e+0 | low-sun-z87--005000m--black | 5.487027e-3 | 5.487027e-3 | no | 605.351 |
| 468 | 471 | 2.323507e+0 | 2.323507e+0 | low-sun-z87--005000m--black | 5.463122e-3 | 5.463122e-3 | no | 557.162 |
| 469 | 472 | 2.319355e+0 | 2.319355e+0 | low-sun-z87--005000m--black | 5.438850e-3 | 5.438850e-3 | no | 607.406 |
| 470 | 473 | 2.308547e+0 | 2.308547e+0 | low-sun-z87--005000m--black | 5.415106e-3 | 5.415106e-3 | no | 598.499 |
| 471 | 474 | 2.304483e+0 | 2.304483e+0 | low-sun-z87--005000m--black | 5.390998e-3 | 5.390998e-3 | no | 631.284 |
| 472 | 475 | 2.293787e+0 | 2.293787e+0 | low-sun-z87--005000m--black | 5.367386e-3 | 5.367386e-3 | no | 689.918 |
| 473 | 476 | 2.289804e+0 | 2.289804e+0 | low-sun-z87--005000m--black | 5.343430e-3 | 5.343430e-3 | no | 621.690 |
| 474 | 477 | 2.279030e+0 | 2.279030e+0 | low-sun-z87--005000m--black | 5.320025e-3 | 5.320025e-3 | no | 590.922 |
| 475 | 478 | 2.275054e+0 | 2.275054e+0 | low-sun-z87--005000m--black | 5.296249e-3 | 5.296249e-3 | no | 599.976 |
| 476 | 479 | 2.264457e+0 | 2.264457e+0 | low-sun-z87--005000m--black | 5.272969e-3 | 5.272969e-3 | no | 588.821 |
| 477 | 480 | 2.260598e+0 | 2.260598e+0 | low-sun-z87--005000m--black | 5.249343e-3 | 5.249343e-3 | no | 575.527 |
| 478 | 481 | 2.250055e+0 | 2.250055e+0 | low-sun-z87--005000m--black | 5.226228e-3 | 5.226228e-3 | no | 581.655 |
| 479 | 482 | 2.246288e+0 | 2.246288e+0 | low-sun-z87--005000m--black | 5.202761e-3 | 5.202761e-3 | no | 666.976 |
| 480 | 483 | 2.235744e+0 | 2.235744e+0 | low-sun-z87--005000m--black | 5.179830e-3 | 5.179830e-3 | no | 597.551 |
| 481 | 484 | 2.232015e+0 | 2.232015e+0 | low-sun-z87--005000m--black | 5.156535e-3 | 5.156535e-3 | no | 575.758 |
| 482 | 485 | 2.221616e+0 | 2.221616e+0 | low-sun-z87--005000m--black | 5.133724e-3 | 5.133724e-3 | no | 584.083 |
| 483 | 486 | 2.217973e+0 | 2.217973e+0 | low-sun-z87--005000m--black | 5.110578e-3 | 5.110578e-3 | no | 621.685 |
| 484 | 487 | 2.207532e+0 | 2.207532e+0 | low-sun-z87--005000m--black | 5.087962e-3 | 5.087962e-3 | no | 666.888 |
| 485 | 488 | 2.203931e+0 | 2.203931e+0 | low-sun-z87--005000m--black | 5.064987e-3 | 5.064987e-3 | no | 626.602 |
| 486 | 489 | 2.193635e+0 | 2.193635e+0 | low-sun-z87--005000m--black | 5.042513e-3 | 5.042513e-3 | no | 698.241 |
| 487 | 490 | 2.190148e+0 | 2.190148e+0 | low-sun-z87--005000m--black | 5.019693e-3 | 5.019693e-3 | no | 648.719 |
| 488 | 491 | 2.179948e+0 | 2.179948e+0 | low-sun-z87--005000m--black | 4.997360e-3 | 4.997360e-3 | no | 723.434 |
| 489 | 492 | 2.176552e+0 | 2.176552e+0 | low-sun-z87--005000m--black | 4.974691e-3 | 4.974691e-3 | no | 618.922 |
| 490 | 493 | 2.166283e+0 | 2.166283e+0 | low-sun-z87--005000m--black | 4.952556e-3 | 4.952556e-3 | no | 604.450 |
| 491 | 494 | 2.162892e+0 | 2.162892e+0 | low-sun-z87--005000m--black | 4.930063e-3 | 4.930063e-3 | no | 568.845 |
| 492 | 495 | 2.152801e+0 | 2.152801e+0 | low-sun-z87--005000m--black | 4.908046e-3 | 4.908046e-3 | no | 632.989 |
| 493 | 496 | 2.149518e+0 | 2.149518e+0 | low-sun-z87--005000m--black | 4.885700e-3 | 4.885700e-3 | no | 603.524 |
| 494 | 497 | 2.139447e+0 | 2.139447e+0 | low-sun-z87--005000m--black | 4.863857e-3 | 4.863857e-3 | no | 667.328 |
| 495 | 498 | 2.136247e+0 | 2.136247e+0 | low-sun-z87--005000m--black | 4.841670e-3 | 4.841670e-3 | no | 689.918 |
| 496 | 499 | 2.126235e+0 | 2.126235e+0 | low-sun-z87--005000m--black | 4.819993e-3 | 4.819993e-3 | no | 691.536 |
| 497 | 500 | 2.123108e+0 | 2.123108e+0 | low-sun-z87--005000m--black | 4.797968e-3 | 4.797968e-3 | no | 592.789 |
| 498 | 501 | 2.113228e+0 | 2.113228e+0 | low-sun-z87--005000m--black | 4.776414e-3 | 4.776414e-3 | no | 599.207 |
| 499 | 502 | 2.110186e+0 | 2.110186e+0 | low-sun-z87--005000m--black | 4.754536e-3 | 4.754536e-3 | no | 630.139 |
| 500 | 503 | 2.100235e+0 | 2.100235e+0 | low-sun-z87--005000m--black | 4.733178e-3 | 4.733178e-3 | no | 647.112 |
| 501 | 504 | 2.097213e+0 | 2.097213e+0 | low-sun-z87--005000m--black | 4.711471e-3 | 4.711471e-3 | no | 589.117 |
| 502 | 505 | 2.087439e+0 | 2.087439e+0 | low-sun-z87--005000m--black | 4.690240e-3 | 4.690240e-3 | no | 622.640 |
| 503 | 506 | 2.084540e+0 | 2.084540e+0 | low-sun-z87--005000m--black | 4.668680e-3 | 4.668680e-3 | no | 574.303 |
| 504 | 507 | 2.074841e+0 | 2.074841e+0 | low-sun-z87--005000m--black | 4.647600e-3 | 4.647600e-3 | no | 626.627 |
| 505 | 508 | 2.072039e+0 | 2.072039e+0 | low-sun-z87--005000m--black | 4.626190e-3 | 4.626190e-3 | no | 632.159 |
| 506 | 509 | 2.062307e+0 | 2.062307e+0 | low-sun-z87--005000m--black | 4.605294e-3 | 4.605294e-3 | no | 582.964 |
| 507 | 510 | 2.059528e+0 | 2.059528e+0 | low-sun-z87--005000m--black | 4.584052e-3 | 4.584052e-3 | no | 599.914 |
| 508 | 511 | 2.049963e+0 | 2.049963e+0 | low-sun-z87--005000m--black | 4.563271e-3 | 4.563271e-3 | no | 633.504 |
| 509 | 512 | 2.047282e+0 | 2.047282e+0 | low-sun-z87--005000m--black | 4.542172e-3 | 4.542172e-3 | no | 625.179 |

No count passed. The closest tested count was 206, with worst bounded Delta E ITP 1.84817823418718.

Closest tested-count per-case results:
| iteration | case | candidate display linear sRGB | Bruneton-512 display linear sRGB | observed Delta E ITP | U(reference) | U(display transform) | upper bound | max second-order spectral delta | max final spectral delta | accepted |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | low-sun-z87--000000m--black | [0.000000, 0.000000, 0.000000] | [0.000000, 0.000000, 0.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 2 | low-sun-z87--000000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 3 | low-sun-z87--000000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 4 | low-sun-z87--000000m--blue-step | [0.000000, 0.9711045, 1.000000] | [0.000000, 0.9711045, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 5 | low-sun-z87--000000m--green-peak | [0.9999998, 1.000000, 0.6414468] | [0.9999998, 1.000000, 0.6414468] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 6 | low-sun-z87--000000m--red-step | [0.9999999, 0.000000, 0.5655145] | [0.9999999, 0.000000, 0.5655145] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 7 | low-sun-z87--000100m--black | [0.01147386, 0.005601571, 0.001560805] | [0.01157472, 0.005754593, 0.001651702] | 5.700245e-1 | 0.000000e+0 | 1.485163e-10 | 5.700245e-1 | 7.595513e-6 | 7.595513e-6 | yes |
| 8 | low-sun-z87--000100m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 3.135160e-11 | 0.000000e+0 | 1.485163e-10 | 1.798679e-10 | 7.595513e-6 | 7.595513e-6 | yes |
| 9 | low-sun-z87--000100m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 7.595513e-6 | 7.595513e-6 | yes |
| 10 | low-sun-z87--000100m--blue-step | [0.000000, 0.9705864, 1.000000] | [0.000000, 0.9705910, 1.000000] | 3.432232e-4 | 0.000000e+0 | 1.485163e-10 | 3.432233e-4 | 7.595513e-6 | 7.595513e-6 | yes |
| 11 | low-sun-z87--000100m--green-peak | [0.9999998, 1.000000, 0.6371826] | [0.9999998, 1.000000, 0.6372156] | 2.048845e-3 | 0.000000e+0 | 1.485163e-10 | 2.048845e-3 | 7.595513e-6 | 7.595513e-6 | yes |
| 12 | low-sun-z87--000100m--red-step | [0.9999999, 0.000000, 0.5624264] | [0.9999999, 0.000000, 0.5624662] | 4.047898e-3 | 0.000000e+0 | 1.485163e-10 | 4.047898e-3 | 7.595513e-6 | 7.595513e-6 | yes |
| 13 | low-sun-z87--001000m--black | [0.1065764, 0.05309656, 0.01481594] | [0.1074670, 0.05450849, 0.01567530] | 1.259650e+0 | 0.000000e+0 | 1.485163e-10 | 1.259650e+0 | 7.359516e-5 | 7.359516e-5 | no |
| 14 | low-sun-z87--001000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 7.480244e-10 | 0.000000e+0 | 1.485163e-10 | 8.965407e-10 | 7.359516e-5 | 7.359516e-5 | yes |
| 15 | low-sun-z87--001000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 7.359516e-5 | 7.359516e-5 | yes |
| 16 | low-sun-z87--001000m--blue-step | [0.000000, 0.9656487, 1.000000] | [0.000000, 0.9656999, 1.000000] | 3.900712e-3 | 0.000000e+0 | 1.485163e-10 | 3.900712e-3 | 7.359516e-5 | 7.359516e-5 | yes |
| 17 | low-sun-z87--001000m--green-peak | [0.9999996, 0.9999999, 0.5987559] | [0.9999996, 0.9999999, 0.5991059] | 2.267350e-2 | 0.000000e+0 | 1.485163e-10 | 2.267350e-2 | 7.359516e-5 | 7.359516e-5 | yes |
| 18 | low-sun-z87--001000m--red-step | [0.9999997, 0.000000, 0.5350637] | [0.9999997, 0.000000, 0.5354692] | 4.259286e-2 | 0.000000e+0 | 1.485163e-10 | 4.259286e-2 | 7.359516e-5 | 7.359516e-5 | yes |
| 19 | low-sun-z87--005000m--black | [0.3984175, 0.2137311, 0.05957295] | [0.4011250, 0.2188474, 0.06298900] | 1.563457e+0 | 0.000000e+0 | 1.485163e-10 | 1.563457e+0 | 3.210060e-4 | 3.210060e-4 | no |
| 20 | low-sun-z87--005000m--neutral-unit | [1.000000, 0.9999995, 0.9999953] | [1.000000, 0.9999995, 0.9999953] | 7.212659e-7 | 0.000000e+0 | 1.485163e-10 | 7.214144e-7 | 3.210060e-4 | 3.210060e-4 | yes |
| 21 | low-sun-z87--005000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 3.210060e-4 | 3.210060e-4 | yes |
| 22 | low-sun-z87--005000m--blue-step | [0.000000, 0.9377692, 0.9999992] | [0.000000, 0.9381741, 0.9999992] | 3.160002e-2 | 0.000000e+0 | 1.485163e-10 | 3.160002e-2 | 3.210060e-4 | 3.210060e-4 | yes |
| 23 | low-sun-z87--005000m--green-peak | [0.9999953, 0.9999961, 0.4353692] | [0.9999954, 0.9999961, 0.4374202] | 1.636294e-1 | 0.000000e+0 | 1.485163e-10 | 1.636294e-1 | 3.210060e-4 | 3.210060e-4 | yes |
| 24 | low-sun-z87--005000m--red-step | [0.9999964, 0.1097305, 0.4251639] | [0.9999964, 0.1155236, 0.4272519] | 1.848178e+0 | 0.000000e+0 | 1.485163e-10 | 1.848178e+0 | 3.210060e-4 | 3.210060e-4 | no |
| 25 | low-sun-z87--020000m--black | [0.7600318, 0.4677070, 0.1230234] | [0.7630541, 0.4765157, 0.1301339] | 1.575162e+0 | 0.000000e+0 | 1.485163e-10 | 1.575162e+0 | 8.135585e-4 | 8.135585e-4 | no |
| 26 | low-sun-z87--020000m--neutral-unit | [0.9999577, 0.9970545, 0.9499763] | [0.9999583, 0.9971032, 0.9503819] | 1.802380e-2 | 0.000000e+0 | 1.485163e-10 | 1.802380e-2 | 8.135585e-4 | 8.135585e-4 | yes |
| 27 | low-sun-z87--020000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 2.780893e-11 | 0.000000e+0 | 1.485163e-10 | 1.763252e-10 | 8.135585e-4 | 8.135585e-4 | yes |
| 28 | low-sun-z87--020000m--blue-step | [0.6678410, 0.7851952, 0.9740674] | [0.6720245, 0.7887499, 0.9742776] | 3.737672e-1 | 0.000000e+0 | 1.485163e-10 | 3.737672e-1 | 8.135585e-4 | 8.135585e-4 | yes |
| 29 | low-sun-z87--020000m--green-peak | [0.9985767, 0.9936539, 0.1107217] | [0.9985946, 0.9937589, 0.1179319] | 1.059509e+0 | 0.000000e+0 | 1.485163e-10 | 1.059509e+0 | 8.135585e-4 | 8.135585e-4 | no |
| 30 | low-sun-z87--020000m--red-step | [0.9987700, 0.4055036, 0.1997202] | [0.9987855, 0.4153418, 0.2062089] | 1.705521e+0 | 0.000000e+0 | 1.485163e-10 | 1.705521e+0 | 8.135585e-4 | 8.135585e-4 | no |
| 31 | low-sun-z87--050000m--black | [0.8706390, 0.5684159, 0.1337106] | [0.8729253, 0.5776040, 0.1418358] | 1.541119e+0 | 0.000000e+0 | 1.485163e-10 | 1.541119e+0 | 1.041028e-3 | 1.041028e-3 | no |
| 32 | low-sun-z87--050000m--neutral-unit | [0.9791960, 0.7978937, 0.2611419] | [0.9795637, 0.8021964, 0.2680719] | 7.721414e-1 | 0.000000e+0 | 1.485163e-10 | 7.721414e-1 | 1.041028e-3 | 1.041028e-3 | yes |
| 33 | low-sun-z87--050000m--neutral-high | [1.000000, 0.9997811, 0.8235411] | [1.000000, 0.9997858, 0.8251962] | 8.486375e-2 | 0.000000e+0 | 1.485163e-10 | 8.486375e-2 | 1.041028e-3 | 1.041028e-3 | yes |
| 34 | low-sun-z87--050000m--blue-step | [0.8704591, 0.6176240, 0.3368697] | [0.8727486, 0.6257645, 0.3430894] | 9.140179e-1 | 0.000000e+0 | 1.485163e-10 | 9.140179e-1 | 1.041028e-3 | 1.041028e-3 | yes |
| 35 | low-sun-z87--050000m--green-peak | [0.9547813, 0.7773676, 0.09585106] | [0.9555805, 0.7821072, 0.1043314] | 1.429810e+0 | 0.000000e+0 | 1.485163e-10 | 1.429810e+0 | 1.041028e-3 | 1.041028e-3 | no |
| 36 | low-sun-z87--050000m--red-step | [0.9579535, 0.5499888, 0.1311326] | [0.9586967, 0.5595692, 0.1392819] | 1.646609e+0 | 0.000000e+0 | 1.485163e-10 | 1.646609e+0 | 1.041028e-3 | 1.041028e-3 | no |
| 37 | low-sun-z87--100000m--black | [0.8922618, 0.5873064, 0.1316382] | [0.8942908, 0.5964038, 0.1398626] | 1.535436e+0 | 0.000000e+0 | 1.485163e-10 | 1.535436e+0 | 1.075734e-3 | 1.075734e-3 | no |
| 38 | low-sun-z87--100000m--neutral-unit | [0.9149345, 0.6106961, 0.1299893] | [0.9165365, 0.6192779, 0.1382293] | 1.495558e+0 | 0.000000e+0 | 1.485163e-10 | 1.495558e+0 | 1.075734e-3 | 1.075734e-3 | no |
| 39 | low-sun-z87--100000m--neutral-high | [0.9898561, 0.7697296, 0.1150072] | [0.9900471, 0.7748057, 0.1233892] | 1.344488e+0 | 0.000000e+0 | 1.485163e-10 | 1.344488e+0 | 1.075734e-3 | 1.075734e-3 | no |
| 40 | low-sun-z87--100000m--blue-step | [0.8929756, 0.5904868, 0.1389308] | [0.8949911, 0.5995141, 0.1470862] | 1.491589e+0 | 0.000000e+0 | 1.485163e-10 | 1.491589e+0 | 1.075734e-3 | 1.075734e-3 | no |
| 41 | low-sun-z87--100000m--green-peak | [0.9053208, 0.6091143, 0.1258652] | [0.9071039, 0.6177310, 0.1341443] | 1.517297e+0 | 0.000000e+0 | 1.485163e-10 | 1.517297e+0 | 1.075734e-3 | 1.075734e-3 | no |
| 42 | low-sun-z87--100000m--red-step | [0.9073482, 0.5840013, 0.1302936] | [0.9090931, 0.5931716, 0.1385308] | 1.557311e+0 | 0.000000e+0 | 1.485163e-10 | 1.557311e+0 | 1.075734e-3 | 1.075734e-3 | no |
| 43 | high-sun-z21--000000m--black | [0.000000, 0.000000, 0.000000] | [0.000000, 0.000000, 0.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 44 | high-sun-z21--000000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 45 | high-sun-z21--000000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 46 | high-sun-z21--000000m--blue-step | [0.000000, 0.9711045, 1.000000] | [0.000000, 0.9711045, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 47 | high-sun-z21--000000m--green-peak | [0.9999998, 1.000000, 0.6414468] | [0.9999998, 1.000000, 0.6414468] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 48 | high-sun-z21--000000m--red-step | [0.9999999, 0.000000, 0.5655145] | [0.9999999, 0.000000, 0.5655145] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 49 | high-sun-z21--000100m--black | [0.005154510, 0.006900784, 0.01183235] | [0.004979115, 0.006734893, 0.01165053] | 6.317629e-1 | 0.000000e+0 | 1.485163e-10 | 6.317629e-1 | 9.887930e-6 | 9.887930e-6 | yes |
| 50 | high-sun-z21--000100m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 2.994782e-11 | 0.000000e+0 | 1.485163e-10 | 1.784641e-10 | 9.887930e-6 | 9.887930e-6 | yes |
| 51 | high-sun-z21--000100m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 9.887930e-6 | 9.887930e-6 | yes |
| 52 | high-sun-z21--000100m--blue-step | [0.000000, 0.9706249, 1.000000] | [0.000000, 0.9706200, 1.000000] | 3.720781e-4 | 0.000000e+0 | 1.485163e-10 | 3.720782e-4 | 9.887930e-6 | 9.887930e-6 | yes |
| 53 | high-sun-z21--000100m--green-peak | [0.9999998, 1.000000, 0.6409151] | [0.9999998, 1.000000, 0.6408491] | 4.081522e-3 | 0.000000e+0 | 1.485163e-10 | 4.081522e-3 | 9.887930e-6 | 9.887930e-6 | yes |
| 54 | high-sun-z21--000100m--red-step | [0.9999999, 0.000000, 0.5669279] | [0.9999999, 0.000000, 0.5668483] | 8.054495e-3 | 0.000000e+0 | 1.485163e-10 | 8.054495e-3 | 9.887930e-6 | 9.887930e-6 | yes |
| 55 | high-sun-z21--001000m--black | [0.04919111, 0.06500321, 0.1078027] | [0.04755421, 0.06348676, 0.1062288] | 1.246398e+0 | 0.000000e+0 | 1.485163e-10 | 1.246398e+0 | 9.400353e-5 | 9.400353e-5 | no |
| 56 | high-sun-z21--001000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 1.115851e-9 | 0.000000e+0 | 1.485163e-10 | 1.264367e-9 | 9.400353e-5 | 9.400353e-5 | yes |
| 57 | high-sun-z21--001000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 9.400353e-5 | 9.400353e-5 | yes |
| 58 | high-sun-z21--001000m--blue-step | [0.000000, 0.9660806, 1.000000] | [0.000000, 0.9660256, 1.000000] | 4.188083e-3 | 0.000000e+0 | 1.485163e-10 | 4.188083e-3 | 9.400353e-5 | 9.400353e-5 | yes |
| 59 | high-sun-z21--001000m--green-peak | [0.9999996, 0.9999999, 0.6366274] | [0.9999996, 0.9999999, 0.6359864] | 3.980049e-2 | 0.000000e+0 | 1.485163e-10 | 3.980049e-2 | 9.400353e-5 | 9.400353e-5 | yes |
| 60 | high-sun-z21--001000m--red-step | [0.9999997, 0.000000, 0.5789468] | [0.9999997, 0.000000, 0.5782040] | 7.406440e-2 | 0.000000e+0 | 1.485163e-10 | 7.406440e-2 | 9.400353e-5 | 9.400353e-5 | yes |
| 61 | high-sun-z21--005000m--black | [0.2030871, 0.2556698, 0.3784222] | [0.1969054, 0.2503610, 0.3738465] | 1.427242e+0 | 0.000000e+0 | 1.485163e-10 | 1.427242e+0 | 3.792598e-4 | 3.792598e-4 | no |
| 62 | high-sun-z21--005000m--neutral-unit | [1.000000, 0.9999996, 0.9999969] | [1.000000, 0.9999996, 0.9999969] | 9.674543e-7 | 0.000000e+0 | 1.485163e-10 | 9.676028e-7 | 3.792598e-4 | 3.792598e-4 | yes |
| 63 | high-sun-z21--005000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 3.792598e-4 | 3.792598e-4 | yes |
| 64 | high-sun-z21--005000m--blue-step | [0.000000, 0.9410885, 0.9999995] | [0.000000, 0.9406683, 0.9999994] | 3.270370e-2 | 0.000000e+0 | 1.485163e-10 | 3.270370e-2 | 3.792598e-4 | 3.792598e-4 | yes |
| 65 | high-sun-z21--005000m--green-peak | [0.9999938, 0.9999963, 0.6268057] | [0.9999938, 0.9999962, 0.6240585] | 1.726629e-1 | 0.000000e+0 | 1.485163e-10 | 1.726629e-1 | 3.792598e-4 | 3.792598e-4 | yes |
| 66 | high-sun-z21--005000m--red-step | [0.9999952, 0.1572165, 0.6200605] | [0.9999952, 0.1512056, 0.6172636] | 1.562671e+0 | 0.000000e+0 | 1.485163e-10 | 1.562671e+0 | 3.792598e-4 | 3.792598e-4 | no |
| 67 | high-sun-z21--020000m--black | [0.4689050, 0.5339316, 0.6560019] | [0.4574382, 0.5253401, 0.6503365] | 1.256941e+0 | 0.000000e+0 | 1.485163e-10 | 1.256941e+0 | 9.042170e-4 | 9.042170e-4 | no |
| 68 | high-sun-z21--020000m--neutral-unit | [0.9999064, 0.9974210, 0.9803780] | [0.9999044, 0.9973734, 0.9800548] | 1.394493e-2 | 0.000000e+0 | 1.485163e-10 | 1.394493e-2 | 9.042170e-4 | 9.042170e-4 | yes |
| 69 | high-sun-z21--020000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 9.042170e-4 | 9.042170e-4 | yes |
| 70 | high-sun-z21--020000m--blue-step | [0.2648695, 0.8119199, 0.9898278] | [0.2489975, 0.8084528, 0.9896603] | 1.273751e+0 | 0.000000e+0 | 1.485163e-10 | 1.273751e+0 | 9.042170e-4 | 9.042170e-4 | no |
| 71 | high-sun-z21--020000m--green-peak | [0.9968499, 0.9944434, 0.6511765] | [0.9967819, 0.9943410, 0.6454316] | 3.494899e-1 | 0.000000e+0 | 1.485163e-10 | 3.494899e-1 | 9.042170e-4 | 9.042170e-4 | yes |
| 72 | high-sun-z21--020000m--red-step | [0.9972778, 0.4794672, 0.6860866] | [0.9972190, 0.4698717, 0.6809166] | 1.238088e+0 | 0.000000e+0 | 1.485163e-10 | 1.238088e+0 | 9.042170e-4 | 9.042170e-4 | no |
| 73 | high-sun-z21--050000m--black | [0.5907628, 0.6304374, 0.7123320] | [0.5784080, 0.6216029, 0.7068469] | 1.114609e+0 | 0.000000e+0 | 1.485163e-10 | 1.114609e+0 | 1.189721e-3 | 1.189721e-3 | no |
| 74 | high-sun-z21--050000m--neutral-unit | [0.9341861, 0.8269378, 0.7546480] | [0.9321992, 0.8228006, 0.7499698] | 3.466246e-1 | 0.000000e+0 | 1.485163e-10 | 3.466246e-1 | 1.189721e-3 | 1.189721e-3 | yes |
| 75 | high-sun-z21--050000m--neutral-high | [1.000000, 0.9998126, 0.9414035] | [1.000000, 0.9998081, 0.9402862] | 5.169157e-2 | 0.000000e+0 | 1.485163e-10 | 5.169157e-2 | 1.189721e-3 | 1.189721e-3 | yes |
| 76 | high-sun-z21--050000m--blue-step | [0.5901939, 0.6725740, 0.7797949] | [0.5778219, 0.6647467, 0.7755962] | 1.031035e+0 | 0.000000e+0 | 1.485163e-10 | 1.031035e+0 | 1.189721e-3 | 1.189721e-3 | no |
| 77 | high-sun-z21--050000m--green-peak | [0.8569494, 0.8093613, 0.6997600] | [0.8526308, 0.8048040, 0.6940352] | 4.155819e-1 | 0.000000e+0 | 1.485163e-10 | 4.155819e-1 | 1.189721e-3 | 1.189721e-3 | yes |
| 78 | high-sun-z21--050000m--red-step | [0.8669848, 0.6146584, 0.7114759] | [0.8629691, 0.6054467, 0.7059745] | 9.086959e-1 | 0.000000e+0 | 1.485163e-10 | 9.086959e-1 | 1.189721e-3 | 1.189721e-3 | yes |
| 79 | high-sun-z21--100000m--black | [0.6173208, 0.6452021, 0.7171246] | [0.6050083, 0.6364113, 0.7116741] | 1.078242e+0 | 0.000000e+0 | 1.485163e-10 | 1.078242e+0 | 1.248333e-3 | 1.248333e-3 | no |
| 80 | high-sun-z21--100000m--neutral-unit | [0.6978529, 0.6653105, 0.7165875] | [0.6881315, 0.6570179, 0.7111266] | 8.830838e-1 | 0.000000e+0 | 1.485163e-10 | 8.830838e-1 | 1.248333e-3 | 1.248333e-3 | yes |
| 81 | high-sun-z21--100000m--neutral-high | [0.9639695, 0.8020336, 0.7117069] | [0.9628103, 0.7971286, 0.7061520] | 4.403492e-1 | 0.000000e+0 | 1.485163e-10 | 4.403492e-1 | 1.248333e-3 | 1.248333e-3 | yes |
| 82 | high-sun-z21--100000m--blue-step | [0.6198562, 0.6479364, 0.7195002] | [0.6076252, 0.6392133, 0.7140955] | 1.066409e+0 | 0.000000e+0 | 1.485163e-10 | 1.066409e+0 | 1.248333e-3 | 1.248333e-3 | no |
| 83 | high-sun-z21--100000m--green-peak | [0.6637058, 0.6639507, 0.7152440] | [0.6528857, 0.6556243, 0.7097572] | 9.408618e-1 | 0.000000e+0 | 1.485163e-10 | 9.408618e-1 | 1.248333e-3 | 1.248333e-3 | yes |
| 84 | high-sun-z21--100000m--red-step | [0.6709069, 0.6423607, 0.7166866] | [0.6603185, 0.6334994, 0.7112276] | 9.863869e-1 | 0.000000e+0 | 1.485163e-10 | 9.863869e-1 | 1.248333e-3 | 1.248333e-3 | yes |

Conclusion:
Not accepted. No tested incident-direction count produced a strict sub-JND difference from the pinned Bruneton-512 benchmark for every declared case after adding display-transform uncertainty. The report preserves the controlling case; no replacement count is justified.
