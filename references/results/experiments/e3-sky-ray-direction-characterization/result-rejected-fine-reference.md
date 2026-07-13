E3 - Finite-Path Transfer Convergence and Control Selection

Question:
What least incident-direction count, with the other retained controls fixed, keeps every declared displayed-colour error plus fine-reference and display-transform uncertainty strictly below 1 Delta E ITP?

Inputs:
{
  "schemaVersion": 2,
  "experiment": {
    "id": "E3",
    "name": "Finite-Path Transfer Convergence and Control Selection",
    "question": "What least incident-direction count, with the other retained controls fixed, keeps every declared displayed-colour error plus fine-reference and display-transform uncertainty strictly below 1 Delta E ITP?"
  },
  "generation": {
    "method": "deterministic Cartesian physical matrix and deterministic rotated reference replicates",
    "randomModule": "../Random.js",
    "randomSeed": 238157862,
    "physicalCaseCount": 84
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
    "strictRule": "observed Delta E ITP + U(fine reference) + U(display transform) < 1"
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
  "productionControls": {
    "pathIntervals": 40,
    "sourceTransmittanceIntervals": 20,
    "incidentDirections": 34,
    "incidentAltitudeBins": 48,
    "incidentRotationTurns": 0
  },
  "isolatedRefinements": [
    {
      "id": "path-refined",
      "pathIntervals": 80,
      "sourceTransmittanceIntervals": 20,
      "incidentDirections": 34,
      "incidentAltitudeBins": 48,
      "incidentRotationTurns": 0
    },
    {
      "id": "source-refined",
      "pathIntervals": 40,
      "sourceTransmittanceIntervals": 40,
      "incidentDirections": 34,
      "incidentAltitudeBins": 48,
      "incidentRotationTurns": 0
    },
    {
      "id": "directions-refined",
      "pathIntervals": 40,
      "sourceTransmittanceIntervals": 20,
      "incidentDirections": 68,
      "incidentAltitudeBins": 48,
      "incidentRotationTurns": 0
    },
    {
      "id": "altitude-refined",
      "pathIntervals": 40,
      "sourceTransmittanceIntervals": 20,
      "incidentDirections": 34,
      "incidentAltitudeBins": 96,
      "incidentRotationTurns": 0
    }
  ],
  "fineReference": {
    "levels": [
      {
        "id": "reference-level-0",
        "pathIntervals": 80,
        "sourceTransmittanceIntervals": 40,
        "incidentDirections": 68,
        "incidentAltitudeBins": 96,
        "incidentRotationTurns": 0
      },
      {
        "id": "reference-level-1",
        "pathIntervals": 160,
        "sourceTransmittanceIntervals": 80,
        "incidentDirections": 136,
        "incidentAltitudeBins": 192,
        "incidentRotationTurns": 0
      },
      {
        "id": "reference-level-2",
        "pathIntervals": 320,
        "sourceTransmittanceIntervals": 160,
        "incidentDirections": 272,
        "incidentAltitudeBins": 384,
        "incidentRotationTurns": 0
      }
    ],
    "rotations": {
      "seed": 238157862,
      "method": "deterministic pseudorandom azimuthal rotations in turns",
      "values": [
        0,
        0.5018797814846039,
        0.5778498351573944,
        0.32525381445884705
      ]
    },
    "selectedValue": "spectral mean of the four level-2 rotated replicates",
    "uncertainty": "max of four-rotation-mean level-0-to-level-1 and level-1-to-level-2 Delta E ITP plus maximum level-2 replicate-to-mean Delta E ITP"
  },
  "incidentDirectionSearch": {
    "fixedControls": {
      "pathIntervals": 40,
      "sourceTransmittanceIntervals": 20,
      "incidentAltitudeBins": 48,
      "incidentRotationTurns": 0
    },
    "minimumCount": 4,
    "initialUpperCount": 68,
    "maximumCount": 136,
    "method": "bracket and integer-bisect a passing count, then evaluate every lower integer to discover the least passing value despite non-monotonic Fibonacci-lattice error"
  },
  "diagnostics": {
    "spectralNorm": "maximum absolute per-channel difference",
    "acceptanceMetric": "Delta E ITP after the declared common display mapping",
    "interpretation": "numerical convergence under the declared case and display boundary; not physical accuracy"
  },
  "caseGeneration": {
    "expression": "sunCases x distancesMeters x endpointSpectra",
    "physicalCaseCount": 84,
    "caseIdsAppearInResultTables": true
  }
}

Iterations: 84 physical cases; 1596 numerical case evaluations; 19 distinct control/rotation configurations

Fine-reference uncertainty:
| iteration | case | level 0 to 1 Delta E ITP | level 1 to 2 Delta E ITP | systematic envelope | rotation spread | U(fine reference) | classification |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | low-sun-z87--000000m--black | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 2 | low-sun-z87--000000m--neutral-unit | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 3 | low-sun-z87--000000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 4 | low-sun-z87--000000m--blue-step | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 5 | low-sun-z87--000000m--green-peak | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 6 | low-sun-z87--000000m--red-step | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 7 | low-sun-z87--000100m--black | 9.587477e-1 | 9.332070e-1 | 9.587477e-1 | 7.684347e-1 | 1.727182e+0 | decreasing |
| 8 | low-sun-z87--000100m--neutral-unit | 3.447627e-11 | 3.318668e-11 | 3.447627e-11 | 7.004330e-11 | 1.045196e-10 | decreasing |
| 9 | low-sun-z87--000100m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 10 | low-sun-z87--000100m--blue-step | 3.309282e-4 | 3.320168e-4 | 3.320168e-4 | 3.073471e-4 | 6.393639e-4 | non-monotonic-or-unresolved |
| 11 | low-sun-z87--000100m--green-peak | 9.869849e-4 | 5.849585e-4 | 9.869849e-4 | 1.139481e-4 | 1.100933e-3 | decreasing |
| 12 | low-sun-z87--000100m--red-step | 1.950013e-3 | 1.155723e-3 | 1.950013e-3 | 2.251309e-4 | 2.175144e-3 | decreasing |
| 13 | low-sun-z87--001000m--black | 1.726709e+0 | 1.624936e+0 | 1.726709e+0 | 1.307662e+0 | 3.034371e+0 | decreasing |
| 14 | low-sun-z87--001000m--neutral-unit | 7.726312e-10 | 6.920646e-10 | 7.726312e-10 | 5.788826e-10 | 1.351514e-9 | decreasing |
| 15 | low-sun-z87--001000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 16 | low-sun-z87--001000m--blue-step | 3.758800e-3 | 3.758918e-3 | 3.758918e-3 | 3.477275e-3 | 7.236193e-3 | non-monotonic-or-unresolved |
| 17 | low-sun-z87--001000m--green-peak | 1.098156e-2 | 6.548094e-3 | 1.098156e-2 | 1.210192e-3 | 1.219176e-2 | decreasing |
| 18 | low-sun-z87--001000m--red-step | 2.063205e-2 | 1.230297e-2 | 2.063205e-2 | 2.273797e-3 | 2.290584e-2 | decreasing |
| 19 | low-sun-z87--005000m--black | 1.840507e+0 | 1.666706e+0 | 1.840507e+0 | 1.308221e+0 | 3.148727e+0 | decreasing |
| 20 | low-sun-z87--005000m--neutral-unit | 4.666666e-7 | 3.387035e-7 | 4.666666e-7 | 1.772897e-7 | 6.439563e-7 | decreasing |
| 21 | low-sun-z87--005000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 22 | low-sun-z87--005000m--blue-step | 3.040175e-2 | 3.000041e-2 | 3.040175e-2 | 2.767246e-2 | 5.807421e-2 | decreasing |
| 23 | low-sun-z87--005000m--green-peak | 8.123617e-2 | 4.968162e-2 | 8.123617e-2 | 7.125460e-3 | 8.836163e-2 | decreasing |
| 24 | low-sun-z87--005000m--red-step | 1.652061e+0 | 1.607397e+0 | 1.652061e+0 | 1.489223e+0 | 3.141284e+0 | decreasing |
| 25 | low-sun-z87--020000m--black | 1.568646e+0 | 1.328248e+0 | 1.568646e+0 | 9.749208e-1 | 2.543567e+0 | decreasing |
| 26 | low-sun-z87--020000m--neutral-unit | 1.125154e-2 | 7.894213e-3 | 1.125154e-2 | 2.823781e-3 | 1.407532e-2 | decreasing |
| 27 | low-sun-z87--020000m--neutral-high | 5.337500e-12 | 0.000000e+0 | 5.337500e-12 | 0.000000e+0 | 5.337500e-12 | decreasing |
| 28 | low-sun-z87--020000m--blue-step | 9.048567e-1 | 8.622430e-1 | 9.048567e-1 | 7.329716e-1 | 1.637828e+0 | decreasing |
| 29 | low-sun-z87--020000m--green-peak | 5.803590e-1 | 3.815266e-1 | 5.803590e-1 | 4.266364e-2 | 6.230226e-1 | decreasing |
| 30 | low-sun-z87--020000m--red-step | 1.636585e+0 | 1.467127e+0 | 1.636585e+0 | 1.244703e+0 | 2.881288e+0 | decreasing |
| 31 | low-sun-z87--050000m--black | 1.468980e+0 | 1.203920e+0 | 1.468980e+0 | 8.332568e-1 | 2.302237e+0 | decreasing |
| 32 | low-sun-z87--050000m--neutral-unit | 6.586840e-1 | 5.162988e-1 | 6.586840e-1 | 3.086897e-1 | 9.673737e-1 | decreasing |
| 33 | low-sun-z87--050000m--neutral-high | 4.918468e-2 | 3.297346e-2 | 4.918468e-2 | 5.913057e-3 | 5.509774e-2 | decreasing |
| 34 | low-sun-z87--050000m--blue-step | 1.058699e+0 | 9.197459e-1 | 1.058699e+0 | 7.154285e-1 | 1.774128e+0 | decreasing |
| 35 | low-sun-z87--050000m--green-peak | 1.031044e+0 | 7.581372e-1 | 1.031044e+0 | 3.414678e-1 | 1.372512e+0 | decreasing |
| 36 | low-sun-z87--050000m--red-step | 1.507977e+0 | 1.250219e+0 | 1.507977e+0 | 9.092070e-1 | 2.417184e+0 | decreasing |
| 37 | low-sun-z87--100000m--black | 1.484705e+0 | 1.174187e+0 | 1.484705e+0 | 7.790725e-1 | 2.263777e+0 | decreasing |
| 38 | low-sun-z87--100000m--neutral-unit | 1.402017e+0 | 1.099572e+0 | 1.402017e+0 | 7.140266e-1 | 2.116044e+0 | decreasing |
| 39 | low-sun-z87--100000m--neutral-high | 1.039397e+0 | 7.548076e-1 | 1.039397e+0 | 3.706647e-1 | 1.410062e+0 | decreasing |
| 40 | low-sun-z87--100000m--blue-step | 1.456934e+0 | 1.155380e+0 | 1.456934e+0 | 7.710158e-1 | 2.227950e+0 | decreasing |
| 41 | low-sun-z87--100000m--green-peak | 1.422929e+0 | 1.113448e+0 | 1.422929e+0 | 7.177566e-1 | 2.140686e+0 | decreasing |
| 42 | low-sun-z87--100000m--red-step | 1.488756e+0 | 1.179062e+0 | 1.488756e+0 | 7.879326e-1 | 2.276689e+0 | decreasing |
| 43 | high-sun-z21--000000m--black | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 44 | high-sun-z21--000000m--neutral-unit | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 45 | high-sun-z21--000000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 46 | high-sun-z21--000000m--blue-step | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 47 | high-sun-z21--000000m--green-peak | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 48 | high-sun-z21--000000m--red-step | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 49 | high-sun-z21--000100m--black | 6.975084e-1 | 3.600565e-1 | 6.975084e-1 | 3.130927e-1 | 1.010601e+0 | decreasing |
| 50 | high-sun-z21--000100m--neutral-unit | 7.382219e-11 | 4.377430e-11 | 7.382219e-11 | 3.074591e-11 | 1.045681e-10 | decreasing |
| 51 | high-sun-z21--000100m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 52 | high-sun-z21--000100m--blue-step | 4.283289e-4 | 2.209210e-4 | 4.283289e-4 | 1.915340e-4 | 6.198629e-4 | decreasing |
| 53 | high-sun-z21--000100m--green-peak | 5.314734e-3 | 2.023801e-3 | 5.314734e-3 | 2.622627e-3 | 7.937361e-3 | decreasing |
| 54 | high-sun-z21--000100m--red-step | 1.048812e-2 | 3.993746e-3 | 1.048812e-2 | 5.175454e-3 | 1.566358e-2 | decreasing |
| 55 | high-sun-z21--001000m--black | 1.354444e+0 | 7.062096e-1 | 1.354444e+0 | 6.032250e-1 | 1.957669e+0 | decreasing |
| 56 | high-sun-z21--001000m--neutral-unit | 1.426169e-9 | 5.837587e-10 | 1.426169e-9 | 6.832684e-10 | 2.109437e-9 | decreasing |
| 57 | high-sun-z21--001000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 58 | high-sun-z21--001000m--blue-step | 4.818342e-3 | 2.483556e-3 | 4.818342e-3 | 2.154094e-3 | 6.972437e-3 | decreasing |
| 59 | high-sun-z21--001000m--green-peak | 5.184083e-2 | 1.972028e-2 | 5.184083e-2 | 2.555413e-2 | 7.739496e-2 | decreasing |
| 60 | high-sun-z21--001000m--red-step | 9.647024e-2 | 3.669521e-2 | 9.647024e-2 | 4.755026e-2 | 1.440205e-1 | decreasing |
| 61 | high-sun-z21--005000m--black | 1.530781e+0 | 8.041218e-1 | 1.530781e+0 | 6.779996e-1 | 2.208780e+0 | decreasing |
| 62 | high-sun-z21--005000m--neutral-unit | 1.263989e-6 | 4.779669e-7 | 1.263989e-6 | 6.227181e-7 | 1.886707e-6 | decreasing |
| 63 | high-sun-z21--005000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | decreasing |
| 64 | high-sun-z21--005000m--blue-step | 3.753721e-2 | 1.929913e-2 | 3.753721e-2 | 1.676723e-2 | 5.430444e-2 | decreasing |
| 65 | high-sun-z21--005000m--green-peak | 2.251606e-1 | 8.532741e-2 | 2.251606e-1 | 1.105775e-1 | 3.357381e-1 | decreasing |
| 66 | high-sun-z21--005000m--red-step | 1.792873e+0 | 9.050576e-1 | 1.792873e+0 | 8.015709e-1 | 2.594444e+0 | decreasing |
| 67 | high-sun-z21--020000m--black | 1.327684e+0 | 7.006752e-1 | 1.327684e+0 | 5.855805e-1 | 1.913264e+0 | decreasing |
| 68 | high-sun-z21--020000m--neutral-unit | 1.827257e-2 | 6.875900e-3 | 1.827257e-2 | 8.982559e-3 | 2.725513e-2 | decreasing |
| 69 | high-sun-z21--020000m--neutral-high | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 2.830820e-11 | 2.830820e-11 | decreasing |
| 70 | high-sun-z21--020000m--blue-step | 1.272725e+0 | 6.781356e-1 | 1.272725e+0 | 5.597599e-1 | 1.832485e+0 | decreasing |
| 71 | high-sun-z21--020000m--green-peak | 4.575414e-1 | 1.719285e-1 | 4.575414e-1 | 2.239881e-1 | 6.815295e-1 | decreasing |
| 72 | high-sun-z21--020000m--red-step | 1.415414e+0 | 7.120540e-1 | 1.415414e+0 | 6.330879e-1 | 2.048502e+0 | decreasing |
| 73 | high-sun-z21--050000m--black | 1.172121e+0 | 6.205512e-1 | 1.172121e+0 | 5.183221e-1 | 1.690443e+0 | decreasing |
| 74 | high-sun-z21--050000m--neutral-unit | 4.158406e-1 | 1.933773e-1 | 4.158406e-1 | 1.948723e-1 | 6.107129e-1 | decreasing |
| 75 | high-sun-z21--050000m--neutral-high | 6.721581e-2 | 2.556612e-2 | 6.721581e-2 | 3.329588e-2 | 1.005117e-1 | decreasing |
| 76 | high-sun-z21--050000m--blue-step | 1.068882e+0 | 5.697821e-1 | 1.068882e+0 | 4.711269e-1 | 1.540008e+0 | decreasing |
| 77 | high-sun-z21--050000m--green-peak | 4.937763e-1 | 2.282660e-1 | 4.937763e-1 | 2.324269e-1 | 7.262032e-1 | decreasing |
| 78 | high-sun-z21--050000m--red-step | 1.037473e+0 | 5.251753e-1 | 1.037473e+0 | 4.664228e-1 | 1.503896e+0 | decreasing |
| 79 | high-sun-z21--100000m--black | 1.126458e+0 | 6.074777e-1 | 1.126458e+0 | 5.038751e-1 | 1.630333e+0 | decreasing |
| 80 | high-sun-z21--100000m--neutral-unit | 9.453644e-1 | 5.039625e-1 | 9.453644e-1 | 4.260273e-1 | 1.371392e+0 | decreasing |
| 81 | high-sun-z21--100000m--neutral-high | 5.200008e-1 | 2.473532e-1 | 5.200008e-1 | 2.494679e-1 | 7.694687e-1 | decreasing |
| 82 | high-sun-z21--100000m--blue-step | 1.114044e+0 | 6.008453e-1 | 1.114044e+0 | 4.983314e-1 | 1.612376e+0 | decreasing |
| 83 | high-sun-z21--100000m--green-peak | 9.943861e-1 | 5.333091e-1 | 9.943861e-1 | 4.467021e-1 | 1.441088e+0 | decreasing |
| 84 | high-sun-z21--100000m--red-step | 1.050989e+0 | 5.620270e-1 | 1.050989e+0 | 4.721496e-1 | 1.523139e+0 | decreasing |

Fine-reference summary:
{
  "maximumSystematicEnvelopeDeltaEItp": 1.8405065417151505,
  "maximumRotationSpreadDeltaEItp": 1.4892230463930387,
  "maximumTotalDeltaEItp": 3.14872720504221,
  "nonMonotonicCaseCount": 2
}

Production and isolated-refinement comparisons:
| configuration | max observed Delta E ITP | max U-bounded Delta E ITP | worst case | max final spectral delta | accepted | elapsed ms |
| --- | ---: | ---: | --- | ---: | --- | ---: |
| production | 1.605806e+1 | 1.865251e+1 | high-sun-z21--005000m--red-step | 1.444577e-2 | no | 51.839 |
| path-refined | 1.535915e+1 | 1.795359e+1 | high-sun-z21--005000m--red-step | 1.354874e-2 | no | 87.657 |
| source-refined | 1.706900e+1 | 2.007733e+1 | low-sun-z87--005000m--red-step | 2.185789e-2 | no | 50.529 |
| directions-refined | 5.549255e+0 | 8.143699e+0 | high-sun-z21--005000m--red-step | 8.581554e-3 | no | 94.810 |
| altitude-refined | 1.460024e+1 | 1.719468e+1 | high-sun-z21--005000m--red-step | 1.294907e-2 | no | 65.476 |

Incident-direction search:
| order | directions | max observed Delta E ITP | max U-bounded Delta E ITP | worst case | accepted | elapsed ms |
| ---: | ---: | ---: | ---: | --- | --- | ---: |
| 1 | 4 | 9.032595e+1 | 9.346724e+1 | low-sun-z87--005000m--red-step | no | 12.935 |
| 2 | 68 | 5.549255e+0 | 8.143699e+0 | high-sun-z21--005000m--red-step | no | 94.810 |
| 3 | 136 | 6.691408e+0 | 9.840135e+0 | low-sun-z87--005000m--black | no | 212.110 |

Conclusion:
Not accepted. No tested incident-direction count produced a strict sub-JND upper bound for every declared case after adding fine-reference and display-transform uncertainty. The report preserves the controlling case and uncertainty terms; no replacement count is justified.
