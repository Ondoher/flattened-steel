# Rejected E3 diagnostic: finite-horizontal accuracy gate

Project disposition: **rejected for applicability**. The generated calculation
below internally passed its declared strict-below-three display criterion at
188 directions, but its 84-case matrix used one fixed ground-level horizontal
view, arbitrary finite path lengths, and synthetic endpoint spectra. It did not
sample observer-to-top-atmosphere sky rays and therefore cannot select the
production sky-cache direction count. The measurements are preserved as
diagnostic history; **188 is not an adopted value**.

## Preserved generated report

### E3 - Bruneton-Referenced Incident-Direction Calibration

Question:
What is the least Algorithm32 Fibonacci incident-direction count whose completed displayed colours remain within E2's strict first-release acceptable-accuracy boundary of the same inputs evaluated with Bruneton's published 16 by 32 incident-direction quadrature?

Inputs:
{
  "schemaVersion": 3,
  "experiment": {
    "id": "E3",
    "name": "Bruneton-Referenced Incident-Direction Calibration",
    "question": "What is the least Algorithm32 Fibonacci incident-direction count whose completed displayed colours remain within E2's strict first-release acceptable-accuracy boundary of the same inputs evaluated with Bruneton's published 16 by 32 incident-direction quadrature?"
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
    "acceptableAccuracyBoundaryDeltaEItp": 3,
    "displayTransformUncertaintyDeltaEItp": 1.485163121927885e-10,
    "referenceUncertaintyDeltaEItp": 0,
    "strictRule": "observed Delta E ITP + U(display transform) < 3; the pinned Bruneton-512 calculation defines the benchmark rather than estimating the continuous-integral truth",
    "diagnosticRule": "observed Delta E ITP + U(display transform) < 1 marks potential indistinguishability but does not govern first-release acceptance",
    "authorityScope": "ITU-R BT.2124-0 Annex 4 says below 3 Delta E ITP may be acceptable for reference-display accuracy and that application needs vary"
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

Iterations: 84 paired physical cases per configuration; 15624 numerical case evaluations; 186 distinct quadrature/count configurations

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
  "elapsedMilliseconds": 572.5441,
  "role": "Pinned Bruneton-512 benchmark, not a continuous-integral truth estimate"
}

Current Algorithm32 comparison:
| directions | max observed Delta E ITP | max bounded Delta E ITP | worst case | max second-order spectral delta | max final spectral delta | accepted | elapsed ms |
| ---: | ---: | ---: | --- | ---: | ---: | --- | ---: |
| 34 | 1.742671e+1 | 1.742671e+1 | high-sun-z21--005000m--red-step | 2.762466e-2 | 2.762466e-2 | no | 47.090 |

Incident-direction search:
| order | directions | max observed Delta E ITP | max bounded Delta E ITP | worst case | max second-order spectral delta | max final spectral delta | accepted | elapsed ms |
| ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | ---: |
| 1 | 4 | 9.585430e+1 | 9.585430e+1 | low-sun-z87--005000m--red-step | 3.430284e-1 | 3.430284e-1 | no | 9.110 |
| 2 | 5 | 8.800845e+1 | 8.800845e+1 | low-sun-z87--005000m--red-step | 2.709530e-1 | 2.709530e-1 | no | 10.546 |
| 3 | 6 | 8.091521e+1 | 8.091521e+1 | low-sun-z87--005000m--red-step | 2.228398e-1 | 2.228398e-1 | no | 10.684 |
| 4 | 7 | 7.465027e+1 | 7.465027e+1 | low-sun-z87--005000m--red-step | 1.885382e-1 | 1.885382e-1 | no | 15.450 |
| 5 | 8 | 6.897816e+1 | 6.897816e+1 | low-sun-z87--005000m--red-step | 1.627663e-1 | 1.627663e-1 | no | 11.122 |
| 6 | 9 | 6.396222e+1 | 6.396222e+1 | low-sun-z87--005000m--red-step | 1.427608e-1 | 1.427608e-1 | no | 13.028 |
| 7 | 10 | 5.936972e+1 | 5.936972e+1 | low-sun-z87--005000m--red-step | 1.267260e-1 | 1.267260e-1 | no | 14.148 |
| 8 | 11 | 5.533554e+1 | 5.533554e+1 | low-sun-z87--005000m--red-step | 1.136766e-1 | 1.136766e-1 | no | 15.090 |
| 9 | 12 | 5.160889e+1 | 5.160889e+1 | low-sun-z87--005000m--red-step | 1.027861e-1 | 1.027861e-1 | no | 15.644 |
| 10 | 13 | 4.829386e+1 | 4.829386e+1 | low-sun-z87--005000m--red-step | 9.361108e-2 | 9.361108e-2 | no | 17.253 |
| 11 | 14 | 4.520930e+1 | 4.520930e+1 | low-sun-z87--005000m--red-step | 8.574335e-2 | 8.574335e-2 | no | 17.472 |
| 12 | 15 | 4.246599e+1 | 4.246599e+1 | low-sun-z87--005000m--red-step | 7.896542e-2 | 7.896542e-2 | no | 19.218 |
| 13 | 16 | 3.988769e+1 | 3.988769e+1 | low-sun-z87--005000m--red-step | 7.303269e-2 | 7.303269e-2 | no | 20.649 |
| 14 | 17 | 3.761697e+1 | 3.761697e+1 | low-sun-z87--005000m--red-step | 6.784613e-2 | 6.784613e-2 | no | 21.967 |
| 15 | 18 | 3.546353e+1 | 3.546353e+1 | low-sun-z87--005000m--red-step | 6.323445e-2 | 6.323445e-2 | no | 20.872 |
| 16 | 19 | 3.355565e+1 | 3.355565e+1 | low-sun-z87--005000m--red-step | 5.914240e-2 | 5.914240e-2 | no | 22.852 |
| 17 | 20 | 3.173709e+1 | 3.173709e+1 | low-sun-z87--005000m--red-step | 5.546172e-2 | 5.546172e-2 | no | 22.094 |
| 18 | 21 | 3.013881e+1 | 3.013881e+1 | low-sun-z87--005000m--red-step | 5.216852e-2 | 5.216852e-2 | no | 24.563 |
| 19 | 22 | 2.859514e+1 | 2.859514e+1 | low-sun-z87--005000m--red-step | 4.917277e-2 | 4.917277e-2 | no | 25.856 |
| 20 | 23 | 2.722629e+1 | 2.722629e+1 | low-sun-z87--005000m--red-step | 4.646455e-2 | 4.646455e-2 | no | 27.203 |
| 21 | 24 | 2.589455e+1 | 2.589455e+1 | low-sun-z87--005000m--red-step | 4.398025e-2 | 4.398025e-2 | no | 28.546 |
| 22 | 25 | 2.471647e+1 | 2.471647e+1 | low-sun-z87--005000m--red-step | 4.171767e-2 | 4.171767e-2 | no | 29.349 |
| 23 | 26 | 2.356036e+1 | 2.356036e+1 | low-sun-z87--005000m--red-step | 3.962684e-2 | 3.962684e-2 | no | 30.408 |
| 24 | 27 | 2.255747e+1 | 2.255747e+1 | low-sun-z87--005000m--red-step | 3.771798e-2 | 3.771798e-2 | no | 31.194 |
| 25 | 28 | 2.156038e+1 | 2.156038e+1 | low-sun-z87--005000m--red-step | 3.594090e-2 | 3.594090e-2 | no | 32.666 |
| 26 | 29 | 2.068144e+1 | 2.068144e+1 | low-sun-z87--005000m--red-step | 3.430399e-2 | 3.430399e-2 | no | 33.806 |
| 27 | 30 | 1.980427e+1 | 1.980427e+1 | low-sun-z87--005000m--red-step | 3.277305e-2 | 3.277305e-2 | no | 39.147 |
| 28 | 31 | 1.933100e+1 | 1.933100e+1 | high-sun-z21--005000m--red-step | 3.135823e-2 | 3.135823e-2 | no | 34.973 |
| 29 | 32 | 1.874139e+1 | 1.874139e+1 | high-sun-z21--005000m--red-step | 3.002673e-2 | 3.002673e-2 | no | 36.015 |
| 30 | 33 | 1.820417e+1 | 1.820417e+1 | high-sun-z21--005000m--red-step | 2.879226e-2 | 2.879226e-2 | no | 35.278 |
| 31 | 34 | 1.742671e+1 | 1.742671e+1 | high-sun-z21--005000m--red-step | 2.762466e-2 | 2.762466e-2 | no | 47.090 |
| 32 | 35 | 1.707188e+1 | 1.707188e+1 | high-sun-z21--005000m--red-step | 2.653634e-2 | 2.653634e-2 | no | 37.089 |
| 33 | 36 | 1.694689e+1 | 1.694689e+1 | high-sun-z21--005000m--red-step | 2.550381e-2 | 2.550381e-2 | no | 39.341 |
| 34 | 37 | 1.615441e+1 | 1.615441e+1 | high-sun-z21--005000m--red-step | 2.454222e-2 | 2.454222e-2 | no | 42.810 |
| 35 | 38 | 1.553803e+1 | 1.553803e+1 | high-sun-z21--005000m--red-step | 2.362503e-2 | 2.362503e-2 | no | 42.232 |
| 36 | 39 | 1.512731e+1 | 1.512731e+1 | high-sun-z21--005000m--red-step | 2.276544e-2 | 2.276544e-2 | no | 43.430 |
| 37 | 40 | 1.454238e+1 | 1.454238e+1 | high-sun-z21--005000m--red-step | 2.194368e-2 | 2.194368e-2 | no | 46.042 |
| 38 | 41 | 1.488334e+1 | 1.488334e+1 | high-sun-z21--005000m--red-step | 2.117213e-2 | 2.117213e-2 | no | 45.205 |
| 39 | 42 | 1.453045e+1 | 1.453045e+1 | high-sun-z21--005000m--red-step | 2.043209e-2 | 2.043209e-2 | no | 48.107 |
| 40 | 43 | 1.420162e+1 | 1.420162e+1 | high-sun-z21--005000m--red-step | 1.973848e-2 | 1.973848e-2 | no | 48.374 |
| 41 | 44 | 1.369572e+1 | 1.369572e+1 | high-sun-z21--005000m--red-step | 1.907054e-2 | 1.907054e-2 | no | 48.488 |
| 42 | 45 | 1.380392e+1 | 1.380392e+1 | high-sun-z21--005000m--red-step | 1.844084e-2 | 1.844084e-2 | no | 46.972 |
| 43 | 46 | 1.339859e+1 | 1.339859e+1 | high-sun-z21--005000m--red-step | 1.783396e-2 | 1.783396e-2 | no | 50.527 |
| 44 | 47 | 1.299265e+1 | 1.299265e+1 | high-sun-z21--005000m--red-step | 1.726260e-2 | 1.726260e-2 | no | 55.333 |
| 45 | 48 | 1.218437e+1 | 1.218437e+1 | high-sun-z21--005000m--red-step | 1.670963e-2 | 1.670963e-2 | no | 48.888 |
| 46 | 49 | 1.145646e+1 | 1.145646e+1 | high-sun-z21--005000m--red-step | 1.618762e-2 | 1.618762e-2 | no | 49.786 |
| 47 | 50 | 1.097272e+1 | 1.097272e+1 | high-sun-z21--005000m--red-step | 1.568143e-2 | 1.568143e-2 | no | 53.850 |
| 48 | 51 | 1.074060e+1 | 1.074060e+1 | high-sun-z21--005000m--red-step | 1.520248e-2 | 1.520248e-2 | no | 57.615 |
| 49 | 52 | 1.035737e+1 | 1.035737e+1 | high-sun-z21--005000m--red-step | 1.473753e-2 | 1.473753e-2 | no | 54.826 |
| 50 | 53 | 1.005793e+1 | 1.005793e+1 | high-sun-z21--005000m--red-step | 1.429948e-2 | 1.429948e-2 | no | 54.570 |
| 51 | 54 | 9.549982e+0 | 9.549982e+0 | high-sun-z21--005000m--red-step | 1.387253e-2 | 1.387253e-2 | no | 54.084 |
| 52 | 55 | 9.103467e+0 | 9.103467e+0 | high-sun-z21--005000m--red-step | 1.346781e-2 | 1.346781e-2 | no | 55.663 |
| 53 | 56 | 8.741037e+0 | 8.741037e+0 | high-sun-z21--005000m--red-step | 1.307340e-2 | 1.307340e-2 | no | 58.687 |
| 54 | 57 | 9.014265e+0 | 9.014265e+0 | high-sun-z21--005000m--red-step | 1.269984e-2 | 1.269984e-2 | no | 61.779 |
| 55 | 58 | 8.727933e+0 | 8.727933e+0 | high-sun-z21--005000m--red-step | 1.233476e-2 | 1.233476e-2 | no | 60.652 |
| 56 | 59 | 8.504808e+0 | 8.504808e+0 | high-sun-z21--005000m--red-step | 1.198959e-2 | 1.198959e-2 | no | 61.191 |
| 57 | 60 | 8.442831e+0 | 8.442831e+0 | high-sun-z21--005000m--red-step | 1.165136e-2 | 1.165136e-2 | no | 60.973 |
| 58 | 61 | 8.339697e+0 | 8.339697e+0 | high-sun-z21--005000m--red-step | 1.133017e-2 | 1.133017e-2 | no | 62.202 |
| 59 | 62 | 8.103317e+0 | 8.103317e+0 | high-sun-z21--005000m--red-step | 1.101557e-2 | 1.101557e-2 | no | 62.919 |
| 60 | 63 | 8.231313e+0 | 8.231313e+0 | high-sun-z21--005000m--red-step | 1.071811e-2 | 1.071811e-2 | no | 63.537 |
| 61 | 64 | 7.976745e+0 | 7.976745e+0 | high-sun-z21--005000m--red-step | 1.042554e-2 | 1.042554e-2 | no | 64.372 |
| 62 | 65 | 7.578247e+0 | 7.578247e+0 | high-sun-z21--005000m--red-step | 1.014770e-2 | 1.014770e-2 | no | 65.044 |
| 63 | 66 | 7.296093e+0 | 7.296093e+0 | high-sun-z21--005000m--red-step | 9.874366e-3 | 9.874366e-3 | no | 66.045 |
| 64 | 67 | 7.170119e+0 | 7.170119e+0 | high-sun-z21--005000m--red-step | 9.614664e-3 | 9.614664e-3 | no | 67.343 |
| 65 | 68 | 6.916864e+0 | 6.916864e+0 | high-sun-z21--005000m--red-step | 9.358877e-3 | 9.358877e-3 | no | 67.465 |
| 66 | 69 | 6.756125e+0 | 6.756125e+0 | high-sun-z21--005000m--red-step | 9.117138e-3 | 9.117138e-3 | no | 71.093 |
| 67 | 70 | 6.498594e+0 | 6.498594e+0 | high-sun-z21--005000m--red-step | 8.878175e-3 | 8.878175e-3 | no | 75.470 |
| 68 | 71 | 6.389574e+0 | 6.389574e+0 | high-sun-z21--005000m--red-step | 8.650872e-3 | 8.650872e-3 | no | 72.819 |
| 69 | 72 | 6.131308e+0 | 6.131308e+0 | high-sun-z21--005000m--red-step | 8.426456e-3 | 8.426456e-3 | no | 72.741 |
| 70 | 73 | 6.248166e+0 | 6.248166e+0 | high-sun-z21--005000m--red-step | 8.213651e-3 | 8.213651e-3 | no | 74.344 |
| 71 | 74 | 5.847417e+0 | 5.847417e+0 | high-sun-z21--005000m--red-step | 8.002801e-3 | 8.002801e-3 | no | 75.803 |
| 72 | 75 | 6.214164e+0 | 6.214164e+0 | high-sun-z21--005000m--red-step | 7.802810e-3 | 7.802810e-3 | no | 75.694 |
| 73 | 76 | 6.000504e+0 | 6.000504e+0 | high-sun-z21--005000m--red-step | 7.604348e-3 | 7.604348e-3 | no | 76.688 |
| 74 | 77 | 5.950315e+0 | 5.950315e+0 | high-sun-z21--005000m--red-step | 7.415539e-3 | 7.415539e-3 | no | 78.153 |
| 75 | 78 | 5.774719e+0 | 5.774719e+0 | high-sun-z21--005000m--red-step | 7.228280e-3 | 7.228280e-3 | no | 78.074 |
| 76 | 79 | 5.221653e+0 | 5.221653e+0 | high-sun-z21--005000m--red-step | 7.051294e-3 | 7.051294e-3 | no | 88.174 |
| 77 | 80 | 4.979003e+0 | 4.979003e+0 | high-sun-z21--005000m--red-step | 6.874980e-3 | 6.874980e-3 | no | 80.897 |
| 78 | 81 | 4.810727e+0 | 4.810727e+0 | high-sun-z21--005000m--red-step | 6.707265e-3 | 6.707265e-3 | no | 81.288 |
| 79 | 82 | 4.180439e+0 | 4.180439e+0 | high-sun-z21--005000m--red-step | 6.524220e-3 | 6.524220e-3 | no | 81.376 |
| 80 | 83 | 4.083425e+0 | 4.083425e+0 | high-sun-z21--005000m--red-step | 6.365972e-3 | 6.365972e-3 | no | 81.024 |
| 81 | 84 | 3.883197e+0 | 3.883197e+0 | high-sun-z21--005000m--red-step | 6.208172e-3 | 6.208172e-3 | no | 82.919 |
| 82 | 85 | 3.979318e+0 | 3.979318e+0 | high-sun-z21--005000m--red-step | 6.058953e-3 | 6.058953e-3 | no | 84.168 |
| 83 | 86 | 4.114613e+0 | 4.114613e+0 | high-sun-z21--005000m--red-step | 5.909681e-3 | 5.909681e-3 | no | 89.742 |
| 84 | 87 | 4.125279e+0 | 4.125279e+0 | high-sun-z21--005000m--red-step | 5.767657e-3 | 5.767657e-3 | no | 85.976 |
| 85 | 88 | 5.625291e+0 | 5.625291e+0 | high-sun-z21--005000m--red-step | 5.625844e-3 | 5.625844e-3 | no | 86.864 |
| 86 | 89 | 5.636171e+0 | 5.636171e+0 | high-sun-z21--005000m--red-step | 5.491668e-3 | 5.491668e-3 | no | 89.354 |
| 87 | 90 | 5.747913e+0 | 5.747913e+0 | high-sun-z21--005000m--red-step | 5.357090e-3 | 5.357090e-3 | no | 90.481 |
| 88 | 91 | 5.771004e+0 | 5.771004e+0 | high-sun-z21--005000m--red-step | 5.229344e-3 | 5.229344e-3 | no | 90.573 |
| 89 | 92 | 5.677415e+0 | 5.677415e+0 | high-sun-z21--005000m--red-step | 5.103261e-3 | 5.103261e-3 | no | 91.667 |
| 90 | 93 | 5.657089e+0 | 5.657089e+0 | high-sun-z21--005000m--red-step | 4.983525e-3 | 4.983525e-3 | no | 95.850 |
| 91 | 94 | 5.526664e+0 | 5.526664e+0 | high-sun-z21--005000m--red-step | 4.864031e-3 | 4.864031e-3 | no | 98.170 |
| 92 | 95 | 5.346083e+0 | 5.346083e+0 | high-sun-z21--005000m--red-step | 4.750667e-3 | 4.750667e-3 | no | 93.685 |
| 93 | 96 | 5.245471e+0 | 5.245471e+0 | high-sun-z21--005000m--red-step | 4.637081e-3 | 4.637081e-3 | no | 93.972 |
| 94 | 97 | 5.247507e+0 | 5.247507e+0 | high-sun-z21--005000m--red-step | 4.528567e-3 | 4.528567e-3 | no | 96.904 |
| 95 | 98 | 5.147458e+0 | 5.147458e+0 | high-sun-z21--005000m--red-step | 4.420047e-3 | 4.420047e-3 | no | 101.537 |
| 96 | 99 | 5.113383e+0 | 5.113383e+0 | high-sun-z21--005000m--red-step | 4.316679e-3 | 4.316679e-3 | no | 98.711 |
| 97 | 100 | 4.983331e+0 | 4.983331e+0 | high-sun-z21--005000m--red-step | 4.213014e-3 | 4.213014e-3 | no | 98.078 |
| 98 | 101 | 5.043659e+0 | 5.043659e+0 | high-sun-z21--005000m--red-step | 4.114452e-3 | 4.114452e-3 | no | 98.593 |
| 99 | 102 | 4.986814e+0 | 4.986814e+0 | high-sun-z21--005000m--red-step | 4.015415e-3 | 4.015415e-3 | no | 99.891 |
| 100 | 103 | 4.899021e+0 | 4.899021e+0 | high-sun-z21--005000m--red-step | 3.920828e-3 | 3.920828e-3 | no | 105.743 |
| 101 | 104 | 4.842735e+0 | 4.842735e+0 | high-sun-z21--005000m--red-step | 3.825944e-3 | 3.825944e-3 | no | 101.126 |
| 102 | 105 | 4.842777e+0 | 4.842777e+0 | high-sun-z21--005000m--red-step | 3.819424e-3 | 3.819424e-3 | no | 106.329 |
| 103 | 106 | 4.768254e+0 | 4.768254e+0 | high-sun-z21--005000m--red-step | 3.754992e-3 | 3.754992e-3 | no | 103.293 |
| 104 | 107 | 4.600029e+0 | 4.600029e+0 | high-sun-z21--005000m--red-step | 3.608482e-3 | 3.608482e-3 | no | 105.252 |
| 105 | 108 | 4.510303e+0 | 4.510303e+0 | high-sun-z21--005000m--red-step | 3.541241e-3 | 3.541241e-3 | no | 115.050 |
| 106 | 109 | 4.489759e+0 | 4.489759e+0 | high-sun-z21--005000m--red-step | 3.520715e-3 | 3.520715e-3 | no | 115.502 |
| 107 | 110 | 4.435582e+0 | 4.435582e+0 | high-sun-z21--005000m--red-step | 3.481070e-3 | 3.481070e-3 | no | 107.269 |
| 108 | 111 | 4.438783e+0 | 4.438783e+0 | high-sun-z21--005000m--red-step | 3.480846e-3 | 3.480846e-3 | no | 120.184 |
| 109 | 112 | 4.375751e+0 | 4.375751e+0 | high-sun-z21--005000m--red-step | 3.434476e-3 | 3.434476e-3 | no | 121.888 |
| 110 | 113 | 4.399891e+0 | 4.399891e+0 | high-sun-z21--005000m--red-step | 3.446278e-3 | 3.446278e-3 | no | 119.789 |
| 111 | 114 | 4.334866e+0 | 4.334866e+0 | high-sun-z21--005000m--red-step | 3.396846e-3 | 3.396846e-3 | no | 123.079 |
| 112 | 115 | 4.330454e+0 | 4.330454e+0 | high-sun-z21--005000m--red-step | 3.388506e-3 | 3.388506e-3 | no | 122.387 |
| 113 | 116 | 4.252001e+0 | 4.252001e+0 | high-sun-z21--005000m--red-step | 3.330142e-3 | 3.330142e-3 | no | 115.890 |
| 114 | 117 | 4.234531e+0 | 4.234531e+0 | high-sun-z21--005000m--red-step | 3.313328e-3 | 3.313328e-3 | no | 126.127 |
| 115 | 118 | 4.327045e+0 | 4.327045e+0 | high-sun-z21--005000m--red-step | 3.386799e-3 | 3.386799e-3 | no | 116.401 |
| 116 | 119 | 4.347894e+0 | 4.347894e+0 | high-sun-z21--005000m--red-step | 3.407081e-3 | 3.407081e-3 | no | 122.181 |
| 117 | 120 | 4.550438e+0 | 4.550438e+0 | high-sun-z21--005000m--red-step | 3.578015e-3 | 3.578015e-3 | no | 118.189 |
| 118 | 121 | 4.536015e+0 | 4.536015e+0 | high-sun-z21--005000m--red-step | 3.567818e-3 | 3.567818e-3 | no | 122.940 |
| 119 | 122 | 4.453567e+0 | 4.453567e+0 | high-sun-z21--005000m--red-step | 3.497189e-3 | 3.497189e-3 | no | 118.799 |
| 120 | 123 | 4.242219e+0 | 4.242219e+0 | high-sun-z21--005000m--red-step | 3.319636e-3 | 3.319636e-3 | no | 163.957 |
| 121 | 124 | 4.148815e+0 | 4.148815e+0 | high-sun-z21--005000m--red-step | 3.244108e-3 | 3.244108e-3 | no | 134.960 |
| 122 | 125 | 4.155409e+0 | 4.155409e+0 | high-sun-z21--005000m--red-step | 3.249653e-3 | 3.249653e-3 | no | 125.465 |
| 123 | 126 | 4.050440e+0 | 4.050440e+0 | high-sun-z21--005000m--red-step | 3.164142e-3 | 3.164142e-3 | no | 137.969 |
| 124 | 127 | 3.878389e+0 | 3.878389e+0 | high-sun-z21--005000m--red-step | 3.031921e-3 | 3.031921e-3 | no | 133.730 |
| 125 | 128 | 4.282819e+0 | 4.282819e+0 | high-sun-z21--005000m--red-step | 3.349827e-3 | 3.349827e-3 | no | 130.853 |
| 126 | 129 | 4.306301e+0 | 4.306301e+0 | high-sun-z21--005000m--red-step | 3.371521e-3 | 3.371521e-3 | no | 136.875 |
| 127 | 130 | 4.259815e+0 | 4.259815e+0 | high-sun-z21--005000m--red-step | 3.331470e-3 | 3.331470e-3 | no | 132.358 |
| 128 | 131 | 4.467093e+0 | 4.467093e+0 | high-sun-z21--005000m--red-step | 3.508615e-3 | 3.508615e-3 | no | 132.748 |
| 129 | 132 | 4.443227e+0 | 4.443227e+0 | high-sun-z21--005000m--red-step | 3.486605e-3 | 3.486605e-3 | no | 133.500 |
| 130 | 133 | 4.477896e+0 | 4.477896e+0 | high-sun-z21--005000m--red-step | 3.517122e-3 | 3.517122e-3 | no | 136.356 |
| 131 | 134 | 4.441623e+0 | 4.441623e+0 | high-sun-z21--005000m--red-step | 3.485325e-3 | 3.485325e-3 | no | 135.255 |
| 132 | 135 | 4.469895e+0 | 4.469895e+0 | high-sun-z21--005000m--red-step | 3.511247e-3 | 3.511247e-3 | no | 139.686 |
| 133 | 136 | 4.554413e+0 | 4.554413e+0 | high-sun-z21--005000m--red-step | 3.583637e-3 | 3.583637e-3 | no | 139.394 |
| 134 | 137 | 4.555173e+0 | 4.555173e+0 | high-sun-z21--005000m--red-step | 3.585746e-3 | 3.585746e-3 | no | 141.894 |
| 135 | 138 | 4.492706e+0 | 4.492706e+0 | high-sun-z21--005000m--red-step | 3.532746e-3 | 3.532746e-3 | no | 144.459 |
| 136 | 139 | 4.626463e+0 | 4.626463e+0 | high-sun-z21--005000m--red-step | 3.651196e-3 | 3.651196e-3 | no | 162.344 |
| 137 | 140 | 4.484985e+0 | 4.484985e+0 | high-sun-z21--005000m--red-step | 3.529235e-3 | 3.529235e-3 | no | 163.299 |
| 138 | 141 | 4.493593e+0 | 4.493593e+0 | high-sun-z21--005000m--red-step | 3.538897e-3 | 3.538897e-3 | no | 141.576 |
| 139 | 142 | 4.440544e+0 | 4.440544e+0 | high-sun-z21--005000m--red-step | 3.493800e-3 | 3.493800e-3 | no | 157.140 |
| 140 | 143 | 4.434992e+0 | 4.434992e+0 | high-sun-z21--005000m--red-step | 3.491079e-3 | 3.491079e-3 | no | 145.886 |
| 141 | 144 | 4.370868e+0 | 4.370868e+0 | high-sun-z21--005000m--red-step | 3.436526e-3 | 3.436526e-3 | no | 151.774 |
| 142 | 145 | 4.374857e+0 | 4.374857e+0 | high-sun-z21--005000m--red-step | 3.442308e-3 | 3.442308e-3 | no | 146.652 |
| 143 | 146 | 4.463680e+0 | 4.463680e+0 | high-sun-z21--005000m--red-step | 3.518016e-3 | 3.518016e-3 | no | 156.149 |
| 144 | 147 | 4.587845e+0 | 4.587845e+0 | high-sun-z21--005000m--red-step | 3.628459e-3 | 3.628459e-3 | no | 148.503 |
| 145 | 148 | 4.527720e+0 | 4.527720e+0 | high-sun-z21--005000m--red-step | 3.577660e-3 | 3.577660e-3 | no | 154.486 |
| 146 | 149 | 4.442671e+0 | 4.442671e+0 | high-sun-z21--005000m--red-step | 3.505776e-3 | 3.505776e-3 | no | 157.450 |
| 147 | 150 | 4.380650e+0 | 4.380650e+0 | high-sun-z21--005000m--red-step | 3.453181e-3 | 3.453181e-3 | no | 157.874 |
| 148 | 151 | 4.373763e+0 | 4.373763e+0 | high-sun-z21--005000m--red-step | 3.449528e-3 | 3.449528e-3 | no | 158.028 |
| 149 | 152 | 4.301399e+0 | 4.301399e+0 | high-sun-z21--005000m--red-step | 3.388114e-3 | 3.388114e-3 | no | 159.575 |
| 150 | 153 | 4.264406e+0 | 4.264406e+0 | high-sun-z21--005000m--red-step | 3.358663e-3 | 3.358663e-3 | no | 154.032 |
| 151 | 154 | 4.171718e+0 | 4.171718e+0 | high-sun-z21--005000m--red-step | 3.280566e-3 | 3.280566e-3 | no | 159.915 |
| 152 | 155 | 4.150204e+0 | 4.150204e+0 | high-sun-z21--005000m--red-step | 3.264917e-3 | 3.264917e-3 | no | 152.542 |
| 153 | 156 | 3.998295e+0 | 3.998295e+0 | high-sun-z21--005000m--red-step | 3.135114e-3 | 3.135114e-3 | no | 155.295 |
| 154 | 157 | 3.975074e+0 | 3.975074e+0 | high-sun-z21--005000m--red-step | 3.117496e-3 | 3.117496e-3 | no | 158.041 |
| 155 | 158 | 3.899572e+0 | 3.899572e+0 | high-sun-z21--005000m--red-step | 3.053833e-3 | 3.053833e-3 | no | 159.019 |
| 156 | 159 | 3.980016e+0 | 3.980016e+0 | high-sun-z21--005000m--red-step | 3.124652e-3 | 3.124652e-3 | no | 159.952 |
| 157 | 160 | 3.905850e+0 | 3.905850e+0 | high-sun-z21--005000m--red-step | 3.062027e-3 | 3.062027e-3 | no | 157.009 |
| 158 | 161 | 3.895403e+0 | 3.895403e+0 | high-sun-z21--005000m--red-step | 3.055306e-3 | 3.055306e-3 | no | 171.391 |
| 159 | 162 | 3.827441e+0 | 3.827441e+0 | high-sun-z21--005000m--red-step | 2.998263e-3 | 2.998263e-3 | no | 158.846 |
| 160 | 163 | 4.097489e+0 | 4.097489e+0 | high-sun-z21--005000m--red-step | 3.227703e-3 | 3.227703e-3 | no | 162.228 |
| 161 | 164 | 4.047527e+0 | 4.047527e+0 | high-sun-z21--005000m--red-step | 3.184901e-3 | 3.184901e-3 | no | 168.284 |
| 162 | 165 | 4.225835e+0 | 4.225835e+0 | high-sun-z21--005000m--red-step | 3.332994e-3 | 3.332994e-3 | no | 169.374 |
| 163 | 166 | 4.180515e+0 | 4.180515e+0 | high-sun-z21--005000m--red-step | 3.294127e-3 | 3.294127e-3 | no | 163.318 |
| 164 | 167 | 4.174945e+0 | 4.174945e+0 | high-sun-z21--005000m--red-step | 3.291147e-3 | 3.291147e-3 | no | 165.451 |
| 165 | 168 | 4.108636e+0 | 4.108636e+0 | high-sun-z21--005000m--red-step | 3.235268e-3 | 3.235268e-3 | no | 165.181 |
| 166 | 169 | 4.078565e+0 | 4.078565e+0 | high-sun-z21--005000m--red-step | 3.211885e-3 | 3.211885e-3 | no | 171.275 |
| 167 | 170 | 4.000443e+0 | 4.000443e+0 | high-sun-z21--005000m--red-step | 3.146293e-3 | 3.146293e-3 | no | 178.296 |
| 168 | 171 | 3.897233e+0 | 3.897233e+0 | high-sun-z21--005000m--red-step | 3.060387e-3 | 3.060387e-3 | no | 171.347 |
| 169 | 172 | 3.821226e+0 | 3.821226e+0 | high-sun-z21--005000m--red-step | 2.996946e-3 | 2.996946e-3 | no | 169.878 |
| 170 | 173 | 3.783909e+0 | 3.783909e+0 | high-sun-z21--005000m--red-step | 2.968023e-3 | 2.968023e-3 | no | 170.208 |
| 171 | 174 | 3.618716e+0 | 3.618716e+0 | high-sun-z21--005000m--red-step | 2.827814e-3 | 2.827814e-3 | no | 177.692 |
| 172 | 175 | 3.661241e+0 | 3.661241e+0 | high-sun-z21--005000m--red-step | 2.864093e-3 | 2.864093e-3 | no | 181.037 |
| 173 | 176 | 3.600898e+0 | 3.600898e+0 | high-sun-z21--005000m--red-step | 2.813631e-3 | 2.813631e-3 | no | 183.935 |
| 174 | 177 | 3.592663e+0 | 3.592663e+0 | high-sun-z21--005000m--red-step | 2.809035e-3 | 2.809035e-3 | no | 182.035 |
| 175 | 178 | 3.528050e+0 | 3.528050e+0 | high-sun-z21--005000m--red-step | 2.755682e-3 | 2.755682e-3 | no | 179.982 |
| 176 | 179 | 3.496231e+0 | 3.496231e+0 | high-sun-z21--005000m--red-step | 2.731467e-3 | 2.731467e-3 | no | 175.704 |
| 177 | 180 | 3.416326e+0 | 3.416326e+0 | high-sun-z21--005000m--red-step | 2.665539e-3 | 2.665539e-3 | no | 177.834 |
| 178 | 181 | 3.312411e+0 | 3.312411e+0 | high-sun-z21--005000m--red-step | 2.579726e-3 | 2.579726e-3 | no | 184.687 |
| 179 | 182 | 3.229164e+0 | 3.229164e+0 | high-sun-z21--005000m--red-step | 2.511584e-3 | 2.511584e-3 | no | 183.576 |
| 180 | 183 | 3.288546e+0 | 3.288546e+0 | high-sun-z21--005000m--red-step | 2.564893e-3 | 2.564893e-3 | no | 183.080 |
| 181 | 184 | 3.144467e+0 | 3.144467e+0 | high-sun-z21--005000m--red-step | 2.444722e-3 | 2.444722e-3 | no | 181.021 |
| 182 | 185 | 3.120185e+0 | 3.120185e+0 | high-sun-z21--005000m--red-step | 2.426857e-3 | 2.426857e-3 | no | 194.836 |
| 183 | 186 | 3.051761e+0 | 3.051761e+0 | high-sun-z21--005000m--red-step | 2.370869e-3 | 2.370869e-3 | no | 194.219 |
| 184 | 187 | 3.037656e+0 | 3.037656e+0 | high-sun-z21--005000m--red-step | 2.361868e-3 | 2.361868e-3 | no | 187.906 |
| 185 | 188 | 2.972025e+0 | 2.972025e+0 | high-sun-z21--005000m--red-step | 2.308426e-3 | 2.308426e-3 | yes | 184.457 |

Selected incident-direction count: 188. The other controls remain fixed at path=40, source-transmittance=20, and altitude-bins=48.

Selected-count per-case results:
| iteration | case | candidate display linear sRGB | Bruneton-512 display linear sRGB | observed Delta E ITP | U(reference) | U(display transform) | upper bound | max second-order spectral delta | max final spectral delta | accepted |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | low-sun-z87--000000m--black | [0.000000, 0.000000, 0.000000] | [0.000000, 0.000000, 0.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 2 | low-sun-z87--000000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 3 | low-sun-z87--000000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 4 | low-sun-z87--000000m--blue-step | [0.000000, 0.9711045, 1.000000] | [0.000000, 0.9711045, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 5 | low-sun-z87--000000m--green-peak | [0.9999998, 1.000000, 0.6414468] | [0.9999998, 1.000000, 0.6414468] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 6 | low-sun-z87--000000m--red-step | [0.9999999, 0.000000, 0.5655145] | [0.9999999, 0.000000, 0.5655145] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 7 | low-sun-z87--000100m--black | [0.01153230, 0.005633234, 0.001567623] | [0.01157472, 0.005754593, 0.001651702] | 4.804048e-1 | 0.000000e+0 | 1.485163e-10 | 4.804048e-1 | 6.353096e-6 | 6.353096e-6 | yes |
| 8 | low-sun-z87--000100m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 1.344023e-11 | 0.000000e+0 | 1.485163e-10 | 1.619565e-10 | 6.353096e-6 | 6.353096e-6 | yes |
| 9 | low-sun-z87--000100m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 6.353096e-6 | 6.353096e-6 | yes |
| 10 | low-sun-z87--000100m--blue-step | [0.000000, 0.9705874, 1.000000] | [0.000000, 0.9705910, 1.000000] | 2.722052e-4 | 0.000000e+0 | 1.485163e-10 | 2.722053e-4 | 6.353096e-6 | 6.353096e-6 | yes |
| 11 | low-sun-z87--000100m--green-peak | [0.9999998, 1.000000, 0.6371851] | [0.9999998, 1.000000, 0.6372156] | 1.895165e-3 | 0.000000e+0 | 1.485163e-10 | 1.895165e-3 | 6.353096e-6 | 6.353096e-6 | yes |
| 12 | low-sun-z87--000100m--red-step | [0.9999999, 0.000000, 0.5624293] | [0.9999999, 0.000000, 0.5624662] | 3.744273e-3 | 0.000000e+0 | 1.485163e-10 | 3.744273e-3 | 6.353096e-6 | 6.353096e-6 | yes |
| 13 | low-sun-z87--001000m--black | [0.1070914, 0.05338888, 0.01488012] | [0.1074670, 0.05450849, 0.01567530] | 1.098234e+0 | 0.000000e+0 | 1.485163e-10 | 1.098234e+0 | 6.136657e-5 | 6.136657e-5 | yes |
| 14 | low-sun-z87--001000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 6.513421e-10 | 0.000000e+0 | 1.485163e-10 | 7.998584e-10 | 6.136657e-5 | 6.136657e-5 | yes |
| 15 | low-sun-z87--001000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 6.136657e-5 | 6.136657e-5 | yes |
| 16 | low-sun-z87--001000m--blue-step | [0.000000, 0.9656593, 1.000000] | [0.000000, 0.9656999, 1.000000] | 3.093118e-3 | 0.000000e+0 | 1.485163e-10 | 3.093118e-3 | 6.136657e-5 | 6.136657e-5 | yes |
| 17 | low-sun-z87--001000m--green-peak | [0.9999996, 0.9999999, 0.5987820] | [0.9999996, 0.9999999, 0.5991059] | 2.097990e-2 | 0.000000e+0 | 1.485163e-10 | 2.097990e-2 | 6.136657e-5 | 6.136657e-5 | yes |
| 18 | low-sun-z87--001000m--red-step | [0.9999997, 0.000000, 0.5350940] | [0.9999997, 0.000000, 0.5354692] | 3.941123e-2 | 0.000000e+0 | 1.485163e-10 | 3.941123e-2 | 6.136657e-5 | 6.136657e-5 | yes |
| 19 | low-sun-z87--005000m--black | [0.3999707, 0.2147927, 0.05982316] | [0.4011250, 0.2188474, 0.06298900] | 1.379205e+0 | 0.000000e+0 | 1.485163e-10 | 1.379205e+0 | 2.642333e-4 | 2.642333e-4 | yes |
| 20 | low-sun-z87--005000m--neutral-unit | [1.000000, 0.9999995, 0.9999953] | [1.000000, 0.9999995, 0.9999953] | 6.688303e-7 | 0.000000e+0 | 1.485163e-10 | 6.689789e-7 | 2.642333e-4 | 2.642333e-4 | yes |
| 21 | low-sun-z87--005000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 2.642333e-4 | 2.642333e-4 | yes |
| 22 | low-sun-z87--005000m--blue-step | [0.000000, 0.9378532, 0.9999992] | [0.000000, 0.9381741, 0.9999992] | 2.504221e-2 | 0.000000e+0 | 1.485163e-10 | 2.504221e-2 | 2.642333e-4 | 2.642333e-4 | yes |
| 23 | low-sun-z87--005000m--green-peak | [0.9999954, 0.9999961, 0.4355194] | [0.9999954, 0.9999961, 0.4374202] | 1.516285e-1 | 0.000000e+0 | 1.485163e-10 | 1.516285e-1 | 2.642333e-4 | 2.642333e-4 | yes |
| 24 | low-sun-z87--005000m--red-step | [0.9999964, 0.1109326, 0.4253168] | [0.9999964, 0.1155236, 0.4272519] | 1.470173e+0 | 0.000000e+0 | 1.485163e-10 | 1.470173e+0 | 2.642333e-4 | 2.642333e-4 | yes |
| 25 | low-sun-z87--020000m--black | [0.7617301, 0.4695439, 0.1235102] | [0.7630541, 0.4765157, 0.1301339] | 1.410018e+0 | 0.000000e+0 | 1.485163e-10 | 1.410018e+0 | 6.587969e-4 | 6.587969e-4 | yes |
| 26 | low-sun-z87--020000m--neutral-unit | [0.9999580, 0.9970647, 0.9500041] | [0.9999583, 0.9971032, 0.9503819] | 1.684552e-2 | 0.000000e+0 | 1.485163e-10 | 1.684552e-2 | 6.587969e-4 | 6.587969e-4 | yes |
| 27 | low-sun-z87--020000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 2.780893e-11 | 0.000000e+0 | 1.485163e-10 | 1.763252e-10 | 6.587969e-4 | 6.587969e-4 | yes |
| 28 | low-sun-z87--020000m--blue-step | [0.6701918, 0.7859365, 0.9740818] | [0.6720245, 0.7887499, 0.9742776] | 2.486300e-1 | 0.000000e+0 | 1.485163e-10 | 2.486300e-1 | 6.587969e-4 | 6.587969e-4 | yes |
| 29 | low-sun-z87--020000m--green-peak | [0.9985868, 0.9936758, 0.1112153] | [0.9985946, 0.9937589, 0.1179319] | 9.865758e-1 | 0.000000e+0 | 1.485163e-10 | 9.865758e-1 | 6.587969e-4 | 6.587969e-4 | yes |
| 30 | low-sun-z87--020000m--red-step | [0.9987787, 0.4075552, 0.2001644] | [0.9987855, 0.4153418, 0.2062089] | 1.411967e+0 | 0.000000e+0 | 1.485163e-10 | 1.411967e+0 | 6.587969e-4 | 6.587969e-4 | yes |
| 31 | low-sun-z87--050000m--black | [0.8719041, 0.5703381, 0.1342266] | [0.8729253, 0.5776040, 0.1418358] | 1.393577e+0 | 0.000000e+0 | 1.485163e-10 | 1.393577e+0 | 8.428668e-4 | 8.428668e-4 | yes |
| 32 | low-sun-z87--050000m--neutral-unit | [0.9793995, 0.7987939, 0.2615820] | [0.9795637, 0.8021964, 0.2680719] | 7.151270e-1 | 0.000000e+0 | 1.485163e-10 | 7.151270e-1 | 8.428668e-4 | 8.428668e-4 | yes |
| 33 | low-sun-z87--050000m--neutral-high | [1.000000, 0.9997821, 0.8236462] | [1.000000, 0.9997858, 0.8251962] | 7.948404e-2 | 0.000000e+0 | 1.485163e-10 | 7.948404e-2 | 8.428668e-4 | 8.428668e-4 | yes |
| 34 | low-sun-z87--050000m--blue-step | [0.8717260, 0.6193270, 0.3372647] | [0.8727486, 0.6257645, 0.3430894] | 7.839336e-1 | 0.000000e+0 | 1.485163e-10 | 7.839336e-1 | 8.428668e-4 | 8.428668e-4 | yes |
| 35 | low-sun-z87--050000m--green-peak | [0.9552236, 0.7783591, 0.09638958] | [0.9555805, 0.7821072, 0.1043314] | 1.337341e+0 | 0.000000e+0 | 1.485163e-10 | 1.337341e+0 | 8.428668e-4 | 8.428668e-4 | yes |
| 36 | low-sun-z87--050000m--red-step | [0.9583647, 0.5519931, 0.1316501] | [0.9586967, 0.5595692, 0.1392819] | 1.462473e+0 | 0.000000e+0 | 1.485163e-10 | 1.462473e+0 | 8.428668e-4 | 8.428668e-4 | yes |
| 37 | low-sun-z87--100000m--black | [0.8933814, 0.5892112, 0.1321481] | [0.8942908, 0.5964038, 0.1398626] | 1.392489e+0 | 0.000000e+0 | 1.485163e-10 | 1.392489e+0 | 8.708755e-4 | 8.708755e-4 | yes |
| 38 | low-sun-z87--100000m--neutral-unit | [0.9158185, 0.6124929, 0.1305002] | [0.9165365, 0.6192779, 0.1382293] | 1.361762e+0 | 0.000000e+0 | 1.485163e-10 | 1.361762e+0 | 8.708755e-4 | 8.708755e-4 | yes |
| 39 | low-sun-z87--100000m--neutral-high | [0.9899615, 0.7707924, 0.1155269] | [0.9900471, 0.7748057, 0.1233892] | 1.253300e+0 | 0.000000e+0 | 1.485163e-10 | 1.253300e+0 | 8.708755e-4 | 8.708755e-4 | yes |
| 40 | low-sun-z87--100000m--blue-step | [0.8940878, 0.5923769, 0.1394365] | [0.8949911, 0.5995141, 0.1470862] | 1.351010e+0 | 0.000000e+0 | 1.485163e-10 | 1.351010e+0 | 8.708755e-4 | 8.708755e-4 | yes |
| 41 | low-sun-z87--100000m--green-peak | [0.9063048, 0.6109184, 0.1263785] | [0.9071039, 0.6177310, 0.1341443] | 1.384295e+0 | 0.000000e+0 | 1.485163e-10 | 1.384295e+0 | 8.708755e-4 | 8.708755e-4 | yes |
| 42 | low-sun-z87--100000m--red-step | [0.9083111, 0.5859213, 0.1308044] | [0.9090931, 0.5931716, 0.1385308] | 1.408366e+0 | 0.000000e+0 | 1.485163e-10 | 1.408366e+0 | 8.708755e-4 | 8.708755e-4 | yes |
| 43 | high-sun-z21--000000m--black | [0.000000, 0.000000, 0.000000] | [0.000000, 0.000000, 0.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 44 | high-sun-z21--000000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 45 | high-sun-z21--000000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 46 | high-sun-z21--000000m--blue-step | [0.000000, 0.9711045, 1.000000] | [0.000000, 0.9711045, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 47 | high-sun-z21--000000m--green-peak | [0.9999998, 1.000000, 0.6414468] | [0.9999998, 1.000000, 0.6414468] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 48 | high-sun-z21--000000m--red-step | [0.9999999, 0.000000, 0.5655145] | [0.9999999, 0.000000, 0.5655145] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 0.000000e+0 | 0.000000e+0 | yes |
| 49 | high-sun-z21--000100m--black | [0.005272276, 0.007052840, 0.01202757] | [0.004979115, 0.006734893, 0.01165053] | 1.158398e+0 | 0.000000e+0 | 1.485163e-10 | 1.158398e+0 | 1.916598e-5 | 1.916598e-5 | yes |
| 50 | high-sun-z21--000100m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 5.293210e-11 | 0.000000e+0 | 1.485163e-10 | 2.014484e-10 | 1.916598e-5 | 1.916598e-5 | yes |
| 51 | high-sun-z21--000100m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 1.916598e-5 | 1.916598e-5 | yes |
| 52 | high-sun-z21--000100m--blue-step | [0.000000, 0.9706294, 1.000000] | [0.000000, 0.9706200, 1.000000] | 7.131254e-4 | 0.000000e+0 | 1.485163e-10 | 7.131256e-4 | 1.916598e-5 | 1.916598e-5 | yes |
| 53 | high-sun-z21--000100m--green-peak | [0.9999998, 1.000000, 0.6409861] | [0.9999998, 1.000000, 0.6408491] | 8.463615e-3 | 0.000000e+0 | 1.485163e-10 | 8.463616e-3 | 1.916598e-5 | 1.916598e-5 | yes |
| 54 | high-sun-z21--000100m--red-step | [0.9999999, 0.000000, 0.5670135] | [0.9999999, 0.000000, 0.5668483] | 1.670195e-2 | 0.000000e+0 | 1.485163e-10 | 1.670195e-2 | 1.916598e-5 | 1.916598e-5 | yes |
| 55 | high-sun-z21--001000m--black | [0.05028953, 0.06639126, 0.1094905] | [0.04755421, 0.06348676, 0.1062288] | 2.256091e+0 | 0.000000e+0 | 1.485163e-10 | 2.256091e+0 | 1.844038e-4 | 1.844038e-4 | yes |
| 56 | high-sun-z21--001000m--neutral-unit | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 2.293786e-9 | 0.000000e+0 | 1.485163e-10 | 2.442302e-9 | 1.844038e-4 | 1.844038e-4 | yes |
| 57 | high-sun-z21--001000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 1.844038e-4 | 1.844038e-4 | yes |
| 58 | high-sun-z21--001000m--blue-step | [0.000000, 0.9661310, 1.000000] | [0.000000, 0.9660256, 1.000000] | 8.021386e-3 | 0.000000e+0 | 1.485163e-10 | 8.021386e-3 | 1.844038e-4 | 1.844038e-4 | yes |
| 59 | high-sun-z21--001000m--green-peak | [0.9999996, 0.9999999, 0.6373148] | [0.9999996, 0.9999999, 0.6359864] | 8.244984e-2 | 0.000000e+0 | 1.485163e-10 | 8.244984e-2 | 1.844038e-4 | 1.844038e-4 | yes |
| 60 | high-sun-z21--001000m--red-step | [0.9999997, 0.000000, 0.5797433] | [0.9999997, 0.000000, 0.5782040] | 1.534184e-1 | 0.000000e+0 | 1.485163e-10 | 1.534184e-1 | 1.844038e-4 | 1.844038e-4 | yes |
| 61 | high-sun-z21--005000m--black | [0.2072266, 0.2605036, 0.3833087] | [0.1969054, 0.2503610, 0.3738465] | 2.556376e+0 | 0.000000e+0 | 1.485163e-10 | 2.556376e+0 | 7.811781e-4 | 7.811781e-4 | yes |
| 62 | high-sun-z21--005000m--neutral-unit | [1.000000, 0.9999996, 0.9999969] | [1.000000, 0.9999996, 0.9999969] | 2.002953e-6 | 0.000000e+0 | 1.485163e-10 | 2.003102e-6 | 7.811781e-4 | 7.811781e-4 | yes |
| 63 | high-sun-z21--005000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 0.000000e+0 | 0.000000e+0 | 1.485163e-10 | 1.485163e-10 | 7.811781e-4 | 7.811781e-4 | yes |
| 64 | high-sun-z21--005000m--blue-step | [0.000000, 0.9414711, 0.9999995] | [0.000000, 0.9406683, 0.9999994] | 6.247137e-2 | 0.000000e+0 | 1.485163e-10 | 6.247137e-2 | 7.811781e-4 | 7.811781e-4 | yes |
| 65 | high-sun-z21--005000m--green-peak | [0.9999939, 0.9999963, 0.6297396] | [0.9999938, 0.9999962, 0.6240585] | 3.564689e-1 | 0.000000e+0 | 1.485163e-10 | 3.564689e-1 | 7.811781e-4 | 7.811781e-4 | yes |
| 66 | high-sun-z21--005000m--red-step | [0.9999953, 0.1626897, 0.6230474] | [0.9999952, 0.1512056, 0.6172636] | 2.972025e+0 | 0.000000e+0 | 1.485163e-10 | 2.972025e+0 | 7.811781e-4 | 7.811781e-4 | yes |
| 67 | high-sun-z21--020000m--black | [0.4765612, 0.5416735, 0.6620276] | [0.4574382, 0.5253401, 0.6503365] | 2.224151e+0 | 0.000000e+0 | 1.485163e-10 | 2.224151e+0 | 1.825692e-3 | 1.825692e-3 | yes |
| 68 | high-sun-z21--020000m--neutral-unit | [0.9999078, 0.9974638, 0.9807217] | [0.9999044, 0.9973734, 0.9800548] | 2.881590e-2 | 0.000000e+0 | 1.485163e-10 | 2.881590e-2 | 1.825692e-3 | 1.825692e-3 | yes |
| 69 | high-sun-z21--020000m--neutral-high | [1.000000, 1.000000, 1.000000] | [1.000000, 1.000000, 1.000000] | 2.830820e-11 | 0.000000e+0 | 1.485163e-10 | 1.768245e-10 | 1.825692e-3 | 1.825692e-3 | yes |
| 70 | high-sun-z21--020000m--blue-step | [0.2754671, 0.8150441, 0.9900060] | [0.2489975, 0.8084528, 0.9896603] | 2.138062e+0 | 0.000000e+0 | 1.485163e-10 | 2.138062e+0 | 1.825692e-3 | 1.825692e-3 | yes |
| 71 | high-sun-z21--020000m--green-peak | [0.9968953, 0.9945357, 0.6572868] | [0.9967819, 0.9943410, 0.6454316] | 7.194240e-1 | 0.000000e+0 | 1.485163e-10 | 7.194240e-1 | 1.825692e-3 | 1.825692e-3 | yes |
| 72 | high-sun-z21--020000m--red-step | [0.9973170, 0.4881138, 0.6915853] | [0.9972190, 0.4698717, 0.6809166] | 2.345010e+0 | 0.000000e+0 | 1.485163e-10 | 2.345010e+0 | 1.825692e-3 | 1.825692e-3 | yes |
| 73 | high-sun-z21--050000m--black | [0.5990206, 0.6383641, 0.7181804] | [0.5784080, 0.6216029, 0.7068469] | 1.968662e+0 | 0.000000e+0 | 1.485163e-10 | 1.968662e+0 | 2.233982e-3 | 2.233982e-3 | yes |
| 74 | high-sun-z21--050000m--neutral-unit | [0.9355141, 0.8306497, 0.7596361] | [0.9321992, 0.8228006, 0.7499698] | 6.791159e-1 | 0.000000e+0 | 1.485163e-10 | 6.791159e-1 | 2.233982e-3 | 2.233982e-3 | yes |
| 75 | high-sun-z21--050000m--neutral-high | [1.000000, 0.9998166, 0.9425947] | [1.000000, 0.9998081, 0.9402862] | 1.067684e-1 | 0.000000e+0 | 1.485163e-10 | 1.067684e-1 | 2.233982e-3 | 2.233982e-3 | yes |
| 76 | high-sun-z21--050000m--blue-step | [0.5984631, 0.6795969, 0.7842717] | [0.5778219, 0.6647467, 0.7755962] | 1.798444e+0 | 0.000000e+0 | 1.485163e-10 | 1.798444e+0 | 2.233982e-3 | 2.233982e-3 | yes |
| 77 | high-sun-z21--050000m--green-peak | [0.8598360, 0.8134503, 0.7058640] | [0.8526308, 0.8048040, 0.6940352] | 8.044917e-1 | 0.000000e+0 | 1.485163e-10 | 8.044917e-1 | 2.233982e-3 | 2.233982e-3 | yes |
| 78 | high-sun-z21--050000m--red-step | [0.8696688, 0.6229235, 0.7173417] | [0.8629691, 0.6054467, 0.7059745] | 1.724247e+0 | 0.000000e+0 | 1.485163e-10 | 1.724247e+0 | 2.233982e-3 | 2.233982e-3 | yes |
| 79 | high-sun-z21--100000m--black | [0.6255621, 0.6530887, 0.7229431] | [0.6050083, 0.6364113, 0.7116741] | 1.906673e+0 | 0.000000e+0 | 1.485163e-10 | 1.906673e+0 | 2.308426e-3 | 2.308426e-3 | yes |
| 80 | high-sun-z21--100000m--neutral-unit | [0.7043599, 0.6727501, 0.7224170] | [0.6881315, 0.6570179, 0.7111266] | 1.596552e+0 | 0.000000e+0 | 1.485163e-10 | 1.596552e+0 | 2.308426e-3 | 2.308426e-3 | yes |
| 81 | high-sun-z21--100000m--neutral-high | [0.9647455, 0.8064341, 0.7176369] | [0.9628103, 0.7971286, 0.7061520] | 8.645763e-1 | 0.000000e+0 | 1.485163e-10 | 8.645763e-1 | 2.308426e-3 | 2.308426e-3 | yes |
| 82 | high-sun-z21--100000m--blue-step | [0.6280429, 0.6557621, 0.7252699] | [0.6076252, 0.6392133, 0.7140955] | 1.885686e+0 | 0.000000e+0 | 1.485163e-10 | 1.885686e+0 | 2.308426e-3 | 2.308426e-3 | yes |
| 83 | high-sun-z21--100000m--green-peak | [0.6709482, 0.6714204, 0.7211012] | [0.6528857, 0.6556243, 0.7097572] | 1.681222e+0 | 0.000000e+0 | 1.485163e-10 | 1.681222e+0 | 2.308426e-3 | 2.308426e-3 | yes |
| 84 | high-sun-z21--100000m--red-step | [0.6779942, 0.6503104, 0.7225141] | [0.6603185, 0.6334994, 0.7112276] | 1.775922e+0 | 0.000000e+0 | 1.485163e-10 | 1.775922e+0 | 2.308426e-3 | 2.308426e-3 | yes |

Conclusion:
Accepted. Within the declared 84-case physical matrix and common display mapping, 188 is the least Algorithm32 Fibonacci incident-direction count in the declared 4-to-512 domain whose worst completed-colour difference from the pinned Bruneton-512 benchmark remains strictly below 3 Delta E ITP after adding display-transform uncertainty. Candidate and reference share every declared input and non-angular control; only the incident quadrature differs. The result establishes agreement with that pinned benchmark over this case domain. It does not claim that Bruneton-512 is the continuous integral, establish independent physical accuracy, or cover a different atmosphere, display mapping, or input domain.
