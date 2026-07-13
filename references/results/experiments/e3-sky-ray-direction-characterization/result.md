# E3 - Bruneton-Referenced Sky-Ray Direction Characterization

## Question

How does completed sky-ray output differ from the pinned Bruneton 16 by 32 incident-direction benchmark as Algorithm32 Fibonacci direction count increases through the practical 4-to-68 cost envelope, and where does the current count 34 lie on that curve?

## Inputs

```json
{
  "schemaVersion": 4,
  "experiment": {
    "id": "E3",
    "name": "Bruneton-Referenced Sky-Ray Direction Characterization",
    "question": "How does completed sky-ray output differ from the pinned Bruneton 16 by 32 incident-direction benchmark as Algorithm32 Fibonacci direction count increases through the practical 4-to-68 cost envelope, and where does the current count 34 lie on that curve?"
  },
  "generation": {
    "method": "deterministic Cartesian physical matrix",
    "physicalCaseCount": 24,
    "pairedComparison": "Every candidate and reference receives the same atmosphere, distant Sun, observer, view ray to the top-atmosphere boundary, non-angular numerical controls, spectral basis, and display mapping. Only the incident angular quadrature differs."
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
    "sourcePosition": "solar direction",
    "viewDirection": "observer sky-ray direction",
    "distance": "derived distance from observer to top-atmosphere boundary",
    "atmosphereExtinction": "spectral extinction coefficient",
    "transmittance": "dimensionless spectral transmittance",
    "pathRadiance": "spectral-radiance density",
    "displayedColour": "continuous clamped linear-display sRGB"
  },
  "atmosphere": {
    "geometry": "spherical Earth atmosphere; ground observer and upward sky rays terminating at top atmosphere",
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
  "displayDifferenceDiagnostics": {
    "visibilityBoundaryDeltaEItp": 1,
    "acceptableAccuracyBoundaryDeltaEItp": 3,
    "displayTransformUncertaintyDeltaEItp": 1.485163121927885e-10,
    "referenceUncertaintyDeltaEItp": 0,
    "interpretation": "Delta E ITP is reported as a common display-difference scale. The below-1 potential-visibility and below-3 reference-display accuracy values are diagnostics, not an automatic atmospheric-model validity gate. A visible model difference is not by itself a physically wrong sky result.",
    "authorityScope": "ITU-R BT.2124-0 Annex 4 says below 3 Delta E ITP may be acceptable for reference-display accuracy and that application needs vary; it does not define acceptable physical-model error"
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
    "maximumCount": 68,
    "method": "evaluate every integer in the declared practical envelope because Fibonacci-lattice error is not monotonic; report accuracy and work without selecting a count from a post hoc perceptual threshold"
  },
  "firstReleaseDecisionPolicy": {
    "authority": "project engineering policy informed by the measured curve and qualitative dome comparison",
    "maximumProductionDirectionCount": 34,
    "rule": "within the cost-neutral envelope, retain the tested count with the lowest benchmark error",
    "interpretation": "selects a practical first-release approximation; does not assert perceptual indistinguishability or numerical convergence"
  },
  "sunCases": [
    {
      "id": "low-sun-z87",
      "solarZenithDegrees": 87,
      "solarAltitudeDegrees": 3,
      "solarAzimuthDegrees": 0
    },
    {
      "id": "sun-z41",
      "solarZenithDegrees": 41,
      "solarAltitudeDegrees": 49,
      "solarAzimuthDegrees": 0
    },
    {
      "id": "sun-z31",
      "solarZenithDegrees": 31,
      "solarAltitudeDegrees": 59,
      "solarAzimuthDegrees": 0
    },
    {
      "id": "high-sun-z21",
      "solarZenithDegrees": 21,
      "solarAltitudeDegrees": 69,
      "solarAzimuthDegrees": 0
    }
  ],
  "skyDirectionRoles": [
    "zenith",
    "solar-axis",
    "circumsolar-zenithward-5deg",
    "horizon-sunward",
    "horizon-cross-sun",
    "horizon-antisunward"
  ],
  "diagnostics": {
    "spectralNorm": "maximum absolute per-channel difference",
    "displayMetric": "Delta E ITP after the declared common display mapping",
    "reportedStatistics": "mean, median, 95th percentile, and maximum across all declared sky rays",
    "costMetric": "incident-direction count relative to current count 34",
    "interpretation": "agreement with the pinned Bruneton-512 benchmark under the declared sky-query and display boundary; not proof of continuous quadrature convergence, perceptual indistinguishability, or independent physical accuracy"
  },
  "caseGeneration": {
    "expression": "four Sun zeniths x six named observer-to-top-atmosphere sky rays",
    "physicalCaseCount": 24,
    "caseIdsAppearInResultTables": true
  }
}
```

## Execution

Iterations: 24 paired physical cases per configuration; 1584 numerical case evaluations; 66 distinct quadrature/count configurations

### Reference evaluation

```json
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
  "physicalCaseCount": 24,
  "computedOnce": true,
  "role": "Pinned Bruneton-512 benchmark, not a continuous-integral truth estimate"
}
```

## Current Algorithm32 comparison

| directions | work / current | mean Delta E ITP | median | p95 | maximum | cases below 1 | cases below 3 | p95 relative Y error | max relative Y error | log-Y correlation | aggregate Y ratio | worst case |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 34 | 1.000000 | 2.150588e+0 | 1.042747e+0 | 6.179398e+0 | 9.651290e+0 | 10/24 | 17/24 | 2.918520e-1 | 2.918520e-1 | 0.994991056 | 1.075211725 | low-sun-z87--horizon-cross-sun |

## Practical-envelope accuracy/cost curve

| order | directions | work / current | mean Delta E ITP | median | p95 | maximum | below 1 | below 3 | p95 relative Y error | max relative total-spectrum error | max relative J2 / reference-total | log-Y correlation | aggregate Y ratio | worst case |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 4 | 0.117647 | 8.105604e+0 | 3.105132e+0 | 3.315247e+1 | 3.315247e+1 | 7/24 | 11/24 | 3.043156e+0 | 2.503101e+0 | 2.503101e+0 | 0.920416226 | 1.742475484 | low-sun-z87--solar-axis |
| 2 | 5 | 0.147059 | 6.974032e+0 | 2.476888e+0 | 3.098065e+1 | 3.098065e+1 | 7/24 | 13/24 | 2.417932e+0 | 1.990903e+0 | 1.990903e+0 | 0.936007246 | 1.584743697 | low-sun-z87--solar-axis |
| 3 | 6 | 0.176471 | 6.422931e+0 | 3.403216e+0 | 2.875596e+1 | 2.875596e+1 | 7/24 | 11/24 | 1.999860e+0 | 1.648971e+0 | 1.648971e+0 | 0.946120647 | 1.471838961 | low-sun-z87--solar-axis |
| 4 | 7 | 0.205882 | 5.607902e+0 | 1.883758e+0 | 2.676954e+1 | 2.676954e+1 | 8/24 | 15/24 | 1.702695e+0 | 1.405311e+0 | 1.405311e+0 | 0.955154309 | 1.402666505 | low-sun-z87--solar-axis |
| 5 | 8 | 0.235294 | 5.103548e+0 | 1.324588e+0 | 2.482451e+1 | 2.482451e+1 | 9/24 | 15/24 | 1.478873e+0 | 1.222216e+0 | 1.222216e+0 | 0.962217892 | 1.348995451 | low-sun-z87--solar-axis |
| 6 | 9 | 0.264706 | 5.364707e+0 | 1.462878e+0 | 2.316445e+1 | 2.316445e+1 | 9/24 | 15/24 | 1.305783e+0 | 1.080179e+0 | 1.080179e+0 | 0.962409566 | 1.353627930 | low-sun-z87--solar-axis |
| 7 | 10 | 0.294118 | 4.898975e+0 | 1.140264e+0 | 2.154168e+1 | 2.154168e+1 | 11/24 | 15/24 | 1.166626e+0 | 9.663021e-1 | 9.663021e-1 | 0.966535171 | 1.299852798 | low-sun-z87--solar-axis |
| 8 | 11 | 0.323529 | 4.579080e+0 | 2.345974e+0 | 2.020022e+1 | 2.020022e+1 | 9/24 | 13/24 | 1.053725e+0 | 8.735065e-1 | 8.735065e-1 | 0.974621824 | 1.268995691 | low-sun-z87--solar-axis |
| 9 | 12 | 0.352941 | 4.320769e+0 | 2.878152e+0 | 1.886597e+1 | 1.886597e+1 | 10/24 | 12/24 | 9.590487e-1 | 7.959639e-1 | 7.959639e-1 | 0.977063097 | 1.234717615 | low-sun-z87--solar-axis |
| 10 | 13 | 0.382353 | 3.893317e+0 | 8.691938e-1 | 1.774132e+1 | 1.774132e+1 | 12/24 | 14/24 | 8.794678e-1 | 7.305560e-1 | 7.305560e-1 | 0.981017184 | 1.225350730 | low-sun-z87--solar-axis |
| 11 | 14 | 0.411765 | 3.739733e+0 | 8.908733e-1 | 1.660548e+1 | 1.660548e+1 | 12/24 | 13/24 | 8.107765e-1 | 6.743231e-1 | 6.743231e-1 | 0.982259451 | 1.202363383 | low-sun-z87--solar-axis |
| 12 | 15 | 0.441176 | 3.628908e+0 | 1.314923e+0 | 1.565775e+1 | 1.565775e+1 | 11/24 | 14/24 | 7.517019e-1 | 6.257635e-1 | 6.257635e-1 | 0.984987429 | 1.199719655 | low-sun-z87--solar-axis |
| 13 | 16 | 0.470588 | 3.481984e+0 | 1.767336e+0 | 1.468271e+1 | 1.468271e+1 | 11/24 | 15/24 | 6.995925e-1 | 5.831259e-1 | 5.831259e-1 | 0.985409495 | 1.180393018 | low-sun-z87--solar-axis |
| 14 | 17 | 0.500000 | 3.486061e+0 | 1.827310e+0 | 1.391087e+1 | 1.409849e+1 | 10/24 | 15/24 | 6.541926e-1 | 5.457321e-1 | 5.457321e-1 | 0.985719122 | 1.166559709 | low-sun-z87--horizon-cross-sun |
| 15 | 18 | 0.529412 | 3.532701e+0 | 1.559104e+0 | 1.309777e+1 | 1.387057e+1 | 11/24 | 14/24 | 6.134581e-1 | 5.123589e-1 | 5.123589e-1 | 0.986002989 | 1.165772241 | low-sun-z87--horizon-cross-sun |
| 16 | 19 | 0.558824 | 3.916594e+0 | 3.152750e+0 | 1.244819e+1 | 1.386230e+1 | 10/24 | 11/24 | 5.774194e-1 | 4.826533e-1 | 4.826533e-1 | 0.987887990 | 1.182220435 | low-sun-z87--horizon-cross-sun |
| 17 | 20 | 0.588235 | 3.463595e+0 | 9.539284e-1 | 1.175539e+1 | 1.353386e+1 | 12/24 | 14/24 | 5.446782e-1 | 4.558131e-1 | 4.558131e-1 | 0.988644883 | 1.159771977 | low-sun-z87--horizon-cross-sun |
| 18 | 21 | 0.617647 | 3.475304e+0 | 1.957725e+0 | 1.120659e+1 | 1.347353e+1 | 11/24 | 13/24 | 5.154255e-1 | 4.316729e-1 | 4.316729e-1 | 0.989211778 | 1.150473760 | low-sun-z87--horizon-cross-sun |
| 19 | 22 | 0.647059 | 3.264366e+0 | 1.346228e+0 | 1.060365e+1 | 1.311974e+1 | 10/24 | 14/24 | 4.885291e-1 | 4.096210e-1 | 4.096210e-1 | 0.990408785 | 1.144991830 | low-sun-z87--horizon-cross-sun |
| 20 | 23 | 0.676471 | 3.240055e+0 | 2.036369e+0 | 1.012857e+1 | 1.295011e+1 | 11/24 | 14/24 | 4.642930e-1 | 3.896109e-1 | 3.896109e-1 | 0.990441715 | 1.135125542 | low-sun-z87--horizon-cross-sun |
| 21 | 24 | 0.705882 | 3.186281e+0 | 2.014387e+0 | 9.596003e+0 | 1.255725e+1 | 11/24 | 13/24 | 4.417993e-1 | 3.711713e-1 | 3.711713e-1 | 0.990301479 | 1.122052311 | low-sun-z87--horizon-cross-sun |
| 22 | 25 | 0.735294 | 2.947019e+0 | 8.466433e-1 | 9.183465e+0 | 1.238048e+1 | 12/24 | 15/24 | 4.213976e-1 | 3.543172e-1 | 3.543172e-1 | 0.992222669 | 1.120799368 | low-sun-z87--horizon-cross-sun |
| 23 | 26 | 0.764706 | 2.784169e+0 | 1.063975e+0 | 8.714697e+0 | 1.198869e+1 | 11/24 | 15/24 | 4.023249e-1 | 3.386771e-1 | 3.386771e-1 | 0.992301368 | 1.109175373 | low-sun-z87--horizon-cross-sun |
| 24 | 27 | 0.794118 | 2.758772e+0 | 1.282095e+0 | 8.372278e+0 | 1.178447e+1 | 10/24 | 15/24 | 3.850031e-1 | 3.243268e-1 | 3.243268e-1 | 0.991933036 | 1.098153334 | low-sun-z87--horizon-cross-sun |
| 25 | 28 | 0.823529 | 2.751278e+0 | 1.486182e+0 | 7.968517e+0 | 1.139482e+1 | 11/24 | 14/24 | 3.686819e-1 | 3.109194e-1 | 3.109194e-1 | 0.992632410 | 1.102715088 | low-sun-z87--horizon-cross-sun |
| 26 | 29 | 0.852941 | 2.516779e+0 | 3.470272e-1 | 7.664409e+0 | 1.116003e+1 | 12/24 | 15/24 | 3.537325e-1 | 2.985301e-1 | 2.985301e-1 | 0.993706892 | 1.100793745 | low-sun-z87--horizon-cross-sun |
| 27 | 30 | 0.882353 | 2.387746e+0 | 4.038754e-1 | 7.302483e+0 | 1.077358e+1 | 12/24 | 15/24 | 3.395754e-1 | 2.868976e-1 | 2.868976e-1 | 0.993725517 | 1.089573194 | low-sun-z87--horizon-cross-sun |
| 28 | 31 | 0.911765 | 2.324872e+0 | 9.642056e-1 | 7.032562e+0 | 1.056944e+1 | 12/24 | 16/24 | 3.265612e-1 | 2.761035e-1 | 2.761035e-1 | 0.994800091 | 1.095567353 | low-sun-z87--horizon-cross-sun |
| 29 | 32 | 0.941176 | 2.174856e+0 | 6.111727e-1 | 6.703920e+0 | 1.021471e+1 | 13/24 | 16/24 | 3.141645e-1 | 2.659176e-1 | 2.659176e-1 | 0.994911170 | 1.087906280 | low-sun-z87--horizon-cross-sun |
| 30 | 33 | 0.970588 | 2.157637e+0 | 6.869655e-1 | 6.471803e+0 | 9.991881e+0 | 12/24 | 16/24 | 3.027682e-1 | 2.564448e-1 | 2.564448e-1 | 0.995037803 | 1.081362691 | low-sun-z87--horizon-cross-sun |
| 31 | 34 | 1.000000 | 2.150588e+0 | 1.042747e+0 | 6.179398e+0 | 9.651290e+0 | 10/24 | 17/24 | 2.918520e-1 | 2.474647e-1 | 2.474647e-1 | 0.994991056 | 1.075211725 | low-sun-z87--horizon-cross-sun |
| 32 | 35 | 1.029412 | 2.192005e+0 | 9.438143e-1 | 5.973105e+0 | 9.441566e+0 | 12/24 | 16/24 | 2.817712e-1 | 2.390772e-1 | 2.390772e-1 | 0.995744469 | 1.087663650 | low-sun-z87--horizon-cross-sun |
| 33 | 36 | 1.058824 | 2.255219e+0 | 1.155576e+0 | 6.408873e+0 | 9.120722e+0 | 11/24 | 16/24 | 2.720803e-1 | 2.310985e-1 | 2.310985e-1 | 0.996033255 | 1.089923115 | low-sun-z87--horizon-cross-sun |
| 34 | 37 | 1.088235 | 2.119600e+0 | 8.627161e-1 | 5.533064e+0 | 8.931463e+0 | 12/24 | 16/24 | 2.631351e-1 | 2.236370e-1 | 2.236370e-1 | 0.995968136 | 1.079918642 | low-sun-z87--horizon-cross-sun |
| 35 | 38 | 1.117647 | 2.073720e+0 | 4.801566e-1 | 5.404133e+0 | 8.638083e+0 | 13/24 | 17/24 | 2.544852e-1 | 2.165079e-1 | 2.165079e-1 | 0.995733272 | 1.075460163 | low-sun-z87--horizon-cross-sun |
| 36 | 39 | 1.147059 | 2.068565e+0 | 6.666607e-1 | 6.027764e+0 | 8.439416e+0 | 13/24 | 18/24 | 2.464585e-1 | 2.098124e-1 | 2.098124e-1 | 0.996031281 | 1.073127571 | low-sun-z87--horizon-cross-sun |
| 37 | 40 | 1.176471 | 1.969230e+0 | 1.052909e+0 | 5.111427e+0 | 8.166594e+0 | 11/24 | 17/24 | 2.386804e-1 | 2.034017e-1 | 2.034017e-1 | 0.996405823 | 1.067498281 | low-sun-z87--horizon-cross-sun |
| 38 | 41 | 1.205882 | 1.797028e+0 | 3.750785e-1 | 5.055854e+0 | 7.997377e+0 | 13/24 | 18/24 | 2.314526e-1 | 1.973679e-1 | 1.973679e-1 | 0.996948958 | 1.067790751 | low-sun-z87--horizon-cross-sun |
| 39 | 42 | 1.235294 | 1.773915e+0 | 3.689207e-1 | 4.889673e+0 | 7.745975e+0 | 14/24 | 18/24 | 2.244153e-1 | 1.915690e-1 | 1.915690e-1 | 0.996733276 | 1.064158411 | low-sun-z87--horizon-cross-sun |
| 40 | 43 | 1.264706 | 1.799563e+0 | 4.333658e-1 | 4.813359e+0 | 7.581592e+0 | 13/24 | 17/24 | 2.179099e-1 | 1.861196e-1 | 1.861196e-1 | 0.996631184 | 1.061313636 | low-sun-z87--horizon-cross-sun |
| 41 | 44 | 1.294118 | 1.783744e+0 | 7.576555e-1 | 4.652539e+0 | 7.351130e+0 | 13/24 | 17/24 | 2.115453e-1 | 1.808642e-1 | 1.808642e-1 | 0.996588551 | 1.057207060 | low-sun-z87--horizon-cross-sun |
| 42 | 45 | 1.323529 | 1.913144e+0 | 1.269480e+0 | 4.589900e+0 | 7.191327e+0 | 11/24 | 16/24 | 2.056234e-1 | 1.759030e-1 | 1.759030e-1 | 0.996998429 | 1.063294605 | low-sun-z87--horizon-cross-sun |
| 43 | 46 | 1.352941 | 1.789225e+0 | 1.070862e+0 | 4.447518e+0 | 6.981323e+0 | 11/24 | 17/24 | 1.998286e-1 | 1.711147e-1 | 1.711147e-1 | 0.996848648 | 1.057321852 | low-sun-z87--horizon-cross-sun |
| 44 | 47 | 1.382353 | 1.741414e+0 | 5.521994e-1 | 4.371901e+0 | 6.837311e+0 | 12/24 | 18/24 | 1.944274e-1 | 1.665849e-1 | 1.665849e-1 | 0.997137891 | 1.056224998 | low-sun-z87--horizon-cross-sun |
| 45 | 48 | 1.411765 | 1.560626e+0 | 5.613540e-1 | 4.240138e+0 | 6.654549e+0 | 13/24 | 18/24 | 1.891308e-1 | 1.622068e-1 | 1.622068e-1 | 0.997546542 | 1.053176534 | low-sun-z87--horizon-cross-sun |
| 46 | 49 | 1.441176 | 1.655608e+0 | 9.363152e-1 | 4.161731e+0 | 6.508792e+0 | 12/24 | 18/24 | 1.841868e-1 | 1.580560e-1 | 1.580560e-1 | 0.997348671 | 1.055273878 | low-sun-z87--horizon-cross-sun |
| 47 | 50 | 1.470588 | 1.632286e+0 | 8.011105e-1 | 4.040411e+0 | 6.335649e+0 | 13/24 | 17/24 | 1.793171e-1 | 1.540315e-1 | 1.540315e-1 | 0.997075005 | 1.051665884 | low-sun-z87--horizon-cross-sun |
| 48 | 51 | 1.500000 | 1.497183e+0 | 4.364002e-1 | 3.978587e+0 | 6.204735e+0 | 12/24 | 19/24 | 1.747733e-1 | 1.502144e-1 | 1.502144e-1 | 0.997748972 | 1.052772632 | low-sun-z87--horizon-cross-sun |
| 49 | 52 | 1.529412 | 1.517581e+0 | 8.393440e-1 | 3.879659e+0 | 6.049382e+0 | 12/24 | 19/24 | 1.702909e-1 | 1.465080e-1 | 1.465080e-1 | 0.997851270 | 1.050987131 | low-sun-z87--horizon-cross-sun |
| 50 | 53 | 1.558824 | 1.582104e+0 | 1.204560e+0 | 3.815690e+0 | 5.927729e+0 | 10/24 | 19/24 | 1.661254e-1 | 1.429969e-1 | 1.429969e-1 | 0.997850004 | 1.049284270 | low-sun-z87--horizon-cross-sun |
| 51 | 54 | 1.588235 | 1.456855e+0 | 9.437470e-1 | 3.732718e+0 | 5.789131e+0 | 12/24 | 19/24 | 1.619980e-1 | 1.395783e-1 | 1.395783e-1 | 0.997936867 | 1.045224844 | low-sun-z87--horizon-cross-sun |
| 52 | 55 | 1.617647 | 1.521172e+0 | 6.613735e-1 | 3.676091e+0 | 5.669097e+0 | 12/24 | 20/24 | 1.581405e-1 | 1.363272e-1 | 1.363272e-1 | 0.997684369 | 1.042570902 | low-sun-z87--horizon-cross-sun |
| 53 | 56 | 1.647059 | 1.407495e+0 | 7.650210e-1 | 3.606061e+0 | 5.537961e+0 | 13/24 | 20/24 | 1.543068e-1 | 1.331542e-1 | 1.331542e-1 | 0.998007948 | 1.048151705 | low-sun-z87--horizon-cross-sun |
| 54 | 57 | 1.676471 | 1.344237e+0 | 7.990887e-1 | 3.552892e+0 | 5.430697e+0 | 12/24 | 22/24 | 1.507304e-1 | 1.301392e-1 | 1.301392e-1 | 0.998555383 | 1.051672144 | low-sun-z87--horizon-cross-sun |
| 55 | 58 | 1.705882 | 1.300519e+0 | 7.507655e-1 | 3.498195e+0 | 5.312535e+0 | 13/24 | 22/24 | 1.471694e-1 | 1.271928e-1 | 1.271928e-1 | 0.998555723 | 1.048770362 | low-sun-z87--horizon-cross-sun |
| 56 | 59 | 1.735294 | 1.263282e+0 | 6.771997e-1 | 3.453180e+0 | 5.222015e+0 | 13/24 | 22/24 | 1.438784e-1 | 1.244056e-1 | 1.244056e-1 | 0.998583209 | 1.045986525 | low-sun-z87--horizon-cross-sun |
| 57 | 60 | 1.764706 | 1.353776e+0 | 6.835703e-1 | 3.408520e+0 | 5.107588e+0 | 13/24 | 21/24 | 1.405625e-1 | 1.216602e-1 | 1.216602e-1 | 0.998119740 | 1.041003488 | low-sun-z87--horizon-cross-sun |
| 58 | 61 | 1.794118 | 1.305624e+0 | 8.347904e-1 | 3.363684e+0 | 5.019243e+0 | 13/24 | 21/24 | 1.374889e-1 | 1.190582e-1 | 1.190582e-1 | 0.998363693 | 1.041311826 | low-sun-z87--horizon-cross-sun |
| 59 | 62 | 1.823529 | 1.297963e+0 | 5.132789e-1 | 3.328669e+0 | 4.914623e+0 | 13/24 | 22/24 | 1.343955e-1 | 1.164962e-1 | 1.164962e-1 | 0.998643704 | 1.043822320 | low-sun-z87--horizon-cross-sun |
| 60 | 63 | 1.852941 | 1.389898e+0 | 1.088748e+0 | 3.472293e+0 | 4.825227e+0 | 11/24 | 20/24 | 1.315308e-1 | 1.140675e-1 | 1.140675e-1 | 0.998743497 | 1.046994616 | low-sun-z87--horizon-cross-sun |
| 61 | 64 | 1.882353 | 1.350726e+0 | 7.577769e-1 | 3.259932e+0 | 4.735033e+0 | 12/24 | 20/24 | 1.286485e-1 | 1.116771e-1 | 1.116771e-1 | 0.998821319 | 1.045826348 | low-sun-z87--horizon-cross-sun |
| 62 | 65 | 1.911765 | 1.204954e+0 | 5.305736e-1 | 3.218226e+0 | 4.658503e+0 | 13/24 | 22/24 | 1.259774e-1 | 1.094095e-1 | 1.094095e-1 | 0.998872580 | 1.041388403 | low-sun-z87--horizon-cross-sun |
| 63 | 66 | 1.941176 | 1.136416e+0 | 4.590491e-1 | 3.200326e+0 | 4.571624e+0 | 14/24 | 22/24 | 1.232663e-1 | 1.071645e-1 | 1.071645e-1 | 0.998809413 | 1.036958447 | low-sun-z87--horizon-cross-sun |
| 64 | 67 | 1.970588 | 1.076452e+0 | 4.570995e-1 | 3.153090e+0 | 4.491637e+0 | 13/24 | 22/24 | 1.207554e-1 | 1.050343e-1 | 1.050343e-1 | 0.999018355 | 1.036683934 | low-sun-z87--horizon-cross-sun |
| 65 | 68 | 2.000000 | 1.046401e+0 | 4.085210e-1 | 3.141366e+0 | 4.422527e+0 | 15/24 | 22/24 | 1.182183e-1 | 1.029313e-1 | 1.029313e-1 | 0.998996075 | 1.034615724 | low-sun-z87--horizon-cross-sun |

## Current-count per-ray results

| iteration | case | candidate display linear sRGB | Bruneton-512 display linear sRGB | Delta E ITP | relative Y error | relative total-spectrum error | relative J2 / reference-total | below 1 diagnostic | below 3 diagnostic |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 | low-sun-z87--zenith | [0.1026966, 0.1215376, 0.1433757] | [0.09953952, 0.1192738, 0.1432412] | 1.344729e+0 | 2.090836e-2 | 1.865038e-2 | 1.865038e-2 | no | yes |
| 2 | low-sun-z87--solar-axis | [0.9999975, 0.9962901, 0.4612934] | [0.9999608, 0.9862364, 0.3835483] | 6.179398e+0 | 2.918520e-1 | 2.474647e-1 | 2.474647e-1 | no | no |
| 3 | low-sun-z87--circumsolar-zenithward-5deg | [0.9991567, 0.9740769, 0.5806133] | [0.9971254, 0.9505232, 0.5378069] | 2.908108e+0 | 2.116090e-1 | 1.942357e-1 | 1.942357e-1 | no | yes |
| 4 | low-sun-z87--horizon-sunward | [0.9999975, 0.9962901, 0.4612934] | [0.9999608, 0.9862364, 0.3835483] | 6.179398e+0 | 2.918520e-1 | 2.474647e-1 | 2.474647e-1 | no | no |
| 5 | low-sun-z87--horizon-cross-sun | [0.4795135, 0.3776946, 0.1884452] | [0.4206303, 0.3230086, 0.1605566] | 9.651290e+0 | 2.096406e-1 | 1.960010e-1 | 1.960010e-1 | no | no |
| 6 | low-sun-z87--horizon-antisunward | [0.6076222, 0.4764968, 0.2284769] | [0.5727806, 0.4383264, 0.1986454] | 5.651240e+0 | 1.167801e-1 | 1.090779e-1 | 1.090779e-1 | no | no |
| 7 | sun-z41--zenith | [0.3815693, 0.4566297, 0.6299407] | [0.3783575, 0.4516057, 0.6236049] | 6.961187e-1 | 1.481725e-2 | 1.611101e-2 | 1.611101e-2 | yes | yes |
| 8 | sun-z41--solar-axis | [0.9923367, 0.9916224, 0.9947641] | [0.9919004, 0.9910431, 0.9942507] | 3.909319e-2 | 1.391342e-2 | 1.527663e-2 | 1.527663e-2 | yes | yes |
| 9 | sun-z41--circumsolar-zenithward-5deg | [0.9848920, 0.9840516, 0.9899557] | [0.9841708, 0.9831230, 0.9891252] | 6.337541e-2 | 1.359903e-2 | 1.489037e-2 | 1.489037e-2 | yes | yes |
| 10 | sun-z41--horizon-sunward | [0.9585862, 0.9543967, 0.9573427] | [0.9642531, 0.9630044, 0.9679022] | 6.284446e-1 | 6.077130e-2 | 6.527936e-2 | 6.527936e-2 | yes | yes |
| 11 | sun-z41--horizon-cross-sun | [0.7218070, 0.7725877, 0.8386729] | [0.6876027, 0.7354272, 0.8048653] | 3.359346e+0 | 1.114012e-1 | 1.102765e-1 | 1.102765e-1 | no | no |
| 12 | sun-z41--horizon-antisunward | [0.7348011, 0.7766139, 0.8345348] | [0.7312237, 0.7848891, 0.8507636] | 1.042747e+0 | 2.085060e-2 | 4.019195e-2 | 4.019195e-2 | no | yes |
| 13 | sun-z31--zenith | [0.5360218, 0.5918054, 0.7343497] | [0.5347735, 0.5899727, 0.7323972] | 1.981987e-1 | 4.806136e-3 | 4.991951e-3 | 4.991951e-3 | yes | yes |
| 14 | sun-z31--solar-axis | [0.9872972, 0.9867446, 0.9922268] | [0.9867338, 0.9860418, 0.9916447] | 4.779468e-2 | 1.189670e-2 | 1.297294e-2 | 1.297294e-2 | yes | yes |
| 15 | sun-z31--circumsolar-zenithward-5deg | [0.9784336, 0.9780283, 0.9869029] | [0.9776278, 0.9770451, 0.9860766] | 6.768306e-2 | 1.140679e-2 | 1.238315e-2 | 1.238315e-2 | yes | yes |
| 16 | sun-z31--horizon-sunward | [0.9122270, 0.9232508, 0.9460033] | [0.8993383, 0.9090052, 0.9328532] | 1.066070e+0 | 6.950562e-2 | 7.171360e-2 | 7.171360e-2 | no | yes |
| 17 | sun-z31--horizon-cross-sun | [0.7241501, 0.7769307, 0.8476344] | [0.6904988, 0.7401587, 0.8151065] | 3.299001e+0 | 1.105358e-1 | 1.085947e-1 | 1.085947e-1 | no | no |
| 18 | sun-z31--horizon-antisunward | [0.6779358, 0.7302585, 0.8060875] | [0.7013677, 0.7585955, 0.8350791] | 2.560113e+0 | 7.632840e-2 | 8.105125e-2 | 8.105125e-2 | no | yes |
| 19 | high-sun-z21--zenith | [0.7525200, 0.7779121, 0.8623872] | [0.7512458, 0.7763198, 0.8608955] | 1.355941e-1 | 4.624664e-3 | 4.870343e-3 | 4.870343e-3 | yes | yes |
| 20 | high-sun-z21--solar-axis | [0.9826105, 0.9823010, 0.9899121] | [0.9819585, 0.9814976, 0.9892484] | 5.495634e-2 | 1.095014e-2 | 1.208135e-2 | 1.208135e-2 | yes | yes |
| 21 | high-sun-z21--circumsolar-zenithward-5deg | [0.9733084, 0.9733348, 0.9845476] | [0.9724564, 0.9723021, 0.9836817] | 7.147002e-2 | 1.042393e-2 | 1.145069e-2 | 1.145069e-2 | yes | yes |
| 22 | high-sun-z21--horizon-sunward | [0.8083269, 0.8325644, 0.8815604] | [0.8194660, 0.8452838, 0.8922120] | 1.022446e+0 | 4.089298e-2 | 3.925827e-2 | 3.925827e-2 | no | yes |
| 23 | high-sun-z21--horizon-cross-sun | [0.7283293, 0.7815058, 0.8533017] | [0.6921547, 0.7428054, 0.8209668] | 3.470508e+0 | 1.170913e-1 | 1.120047e-1 | 1.120047e-1 | no | no |
| 24 | high-sun-z21--horizon-antisunward | [0.6657941, 0.7163907, 0.7973740] | [0.6786515, 0.7371063, 0.8205353] | 1.876992e+0 | 5.401756e-2 | 5.974948e-2 | 5.974948e-2 | no | yes |

## Conclusion

Completed. The report characterizes every integer Fibonacci count from 4 through 68 over 24 actual observer-to-top-atmosphere sky rays. Current count 34 has mean, p95, and maximum Delta E ITP values of 2.150588146330829, 6.1793980746262696, and 9.651289567809977. The lowest maximum within the declared two-times-work envelope occurs at count 68; the lowest mean occurs at count 68. Running-best maximum-error counts are 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68. No count is selected by an automatic perceptual threshold. Values below 1 and 3 Delta E ITP remain display-difference diagnostics; they are not treated as definitions of atmospheric-model correctness. Under the separate cost-neutral first-release policy, 34 is the best tested count that does not increase current angular work. At that count the log-luminance correlation is 0.9949910564153577, aggregate luminance is 1.075211725375909 times the benchmark, and the mean Delta E ITP is 2.150588146330829; the largest differences remain in low-Sun horizon queries. This supports retaining 34 as a practical first-release approximation with an explicit limitation, not as an imperceptible or numerically converged result. This result is an accuracy/cost characterization against a pinned finite benchmark, not a claim of continuous convergence or independent physical truth.
