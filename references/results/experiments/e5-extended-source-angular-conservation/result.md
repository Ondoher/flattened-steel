# E5 - Extended-Source Angular Conservation

## Question

What angular-integration relationship conserves extended spectral radiance over ordinary and cosine-projected solid angle?

## Inputs

```json
{
  "basis": {
    "channelCount": 15,
    "sampleMeaning": "spectral-radiance-density packet on the adopted canonical basis"
  },
  "physicalDataTypes": {
    "samplePacket": "spectral radiance density",
    "solidAngleWeight": "solid angle",
    "projectionCosine": "dimensionless directional projection",
    "integratedOrdinaryPacket": "solid-angle-integrated spectral radiance density",
    "integratedProjectedPacket": "cosine-projected spectral irradiance density"
  },
  "formulas": {
    "ordinary": "I_lambda = sum_j(L_lambda_j * DeltaOmega_j)",
    "projected": "E_lambda = sum_j(L_lambda_j * cosTheta_j * DeltaOmega_j)",
    "capSolidAngle": "Omega = 2*pi*(1-cos(alpha))",
    "projectedCapSolidAngle": "Omega_projected = pi*sin(alpha)^2",
    "normalizedLinearLimbProfile": [
      "L(mu) = L_base * ((1-u)+u*mu)/(1-u/3)",
      "mu = sqrt(1-(sin(theta)/sin(alpha))^2)"
    ],
    "rasterAccounting": "on-raster integral + off-raster integral = full-support integral"
  },
  "deterministicGenerators": {
    "uniform": "equal-solid-angle radial bands in cos(theta), crossed with equal azimuth sectors",
    "linearLimb": "equal projected-area annuli using exact annular mean of mu",
    "collapsed": "one sample with full cap solid angle and mean projection cos(alpha/2)^2"
  },
  "roundingBound": {
    "arithmetic": "IEEE-754 binary64",
    "gamma": "gamma(n) = n*epsilon/(1-n*epsilon)",
    "safetyFactor": 16
  },
  "baseRadiancePacket": [
    0.0000115,
    0.0000177,
    0.0000239,
    0.0000246,
    0.0000308,
    0.00003150000000000001,
    0.00003770000000000001,
    0.00004390000000000001,
    0.00004460000000000001,
    0.0000508,
    0.000051500000000000005,
    0.000057700000000000007,
    0.00006390000000000001,
    0.00006460000000000001,
    0.0000708
  ],
  "cases": [
    {
      "id": "uniform-spherical-cap",
      "description": "A fully visible, wide uniform spherical cap.",
      "profile": "uniform",
      "angularRadiusRadians": 0.7,
      "radialBands": 12,
      "azimuthSamples": 24,
      "onRasterAzimuthSamples": 24,
      "compareOrdinary": true,
      "compareProjected": true
    },
    {
      "id": "uniform-angular-disk",
      "description": "A fully visible uniform angular disk.",
      "profile": "uniform",
      "angularRadiusRadians": 0.08,
      "radialBands": 8,
      "azimuthSamples": 20,
      "onRasterAzimuthSamples": 20,
      "compareOrdinary": true,
      "compareProjected": true
    },
    {
      "id": "normalized-linear-limb-profile",
      "description": "A projected-flux-normalized linear limb-darkening profile.",
      "profile": "linear-limb",
      "angularRadiusRadians": 0.00465,
      "limbCoefficient": 0.6,
      "radialBands": 32,
      "azimuthSamples": 16,
      "onRasterAzimuthSamples": 16,
      "compareOrdinary": false,
      "compareProjected": true
    },
    {
      "id": "clipped-support",
      "description": "Three eighths of a uniform cap remain on raster.",
      "profile": "uniform",
      "angularRadiusRadians": 0.14,
      "radialBands": 10,
      "azimuthSamples": 8,
      "onRasterAzimuthSamples": 3,
      "compareOrdinary": true,
      "compareProjected": true
    },
    {
      "id": "fully-off-raster",
      "description": "The complete uniform cap lies off raster.",
      "profile": "uniform",
      "angularRadiusRadians": 0.11,
      "radialBands": 6,
      "azimuthSamples": 12,
      "onRasterAzimuthSamples": 0,
      "compareOrdinary": true,
      "compareProjected": true
    },
    {
      "id": "resolved-small-angle",
      "description": "A small uniform disk represented by many directional samples.",
      "profile": "uniform",
      "angularRadiusRadians": 0.00001,
      "radialBands": 8,
      "azimuthSamples": 16,
      "onRasterAzimuthSamples": 16,
      "compareOrdinary": true,
      "compareProjected": true
    },
    {
      "id": "collapsed-small-angle",
      "description": "The same small uniform disk collapsed to one angular sample.",
      "profile": "collapsed-uniform",
      "angularRadiusRadians": 0.00001,
      "radialBands": 1,
      "azimuthSamples": 1,
      "onRasterAzimuthSamples": 1,
      "compareOrdinary": true,
      "compareProjected": true
    }
  ]
}
```

## Iterations

Iterations: 7

| iteration | case | samples | on/off support | ordinary residual / limit | projected residual / limit | maximum partition residual | accepted |
| ---: | --- | ---: | --- | --- | --- | ---: | --- |
| 1 | uniform-spherical-cap | 288 | 1.000000e+0 / 0.000000e+0 | 4.201283e-19 / 6.466689e-16 | 2.168404e-19 / 5.706343e-16 | 4.201283e-19 | yes |
| 2 | uniform-angular-disk | 160 | 1.000000e+0 / 0.000000e+0 | 3.811648e-21 / 4.913126e-18 | 4.023406e-21 / 4.905270e-18 | 4.023406e-21 | yes |
| 3 | normalized-linear-limb-profile | 512 | 1.000000e+0 / 0.000000e+0 | not tested | 1.571643e-23 / 5.269392e-20 | 1.571643e-23 | yes |
| 4 | clipped-support | 80 | 3.750000e-1 / 6.250000e-1 | 2.541099e-21 / 7.607729e-18 | 3.388132e-21 / 7.570512e-18 | 2.541099e-21 | yes |
| 5 | fully-off-raster | 72 | 0.000000e+0 / 1.000000e+0 | 3.388132e-21 / 4.241053e-18 | 3.388132e-21 / 4.228237e-18 | 3.388132e-21 | yes |
| 6 | resolved-small-angle | 128 | 1.000000e+0 / 0.000000e+0 | 5.364254e-29 / 6.163650e-26 | 3.470988e-29 / 6.163650e-26 | 5.364254e-29 | yes |
| 7 | collapsed-small-angle | 1 | 1.000000e+0 / 0.000000e+0 | 0.000000e+0 / 1.422381e-27 | 3.155444e-30 / 1.422381e-27 | 3.155444e-30 | yes |

## Resolved/collapsed small-angle comparison

```json
{
  "ordinary": {
    "maximumAbsoluteResidual": 5.36425415550288e-29,
    "maximumLimit": 6.211062287052773e-26,
    "accepted": true
  },
  "projected": {
    "maximumAbsoluteResidual": 3.470987982972452e-29,
    "maximumLimit": 6.2110622868975e-26,
    "accepted": true
  }
}
```

## Maximum observed residuals

```json
{
  "analyticResidual": 4.2012834183813297e-19,
  "resolvedCollapsedResidual": 5.36425415550288e-29
}
```

## Conclusion

Accepted. Extended spectral radiance is conserved by summing L_lambda_j * DeltaOmega_j for ordinary angular integration and L_lambda_j * cosTheta_j * DeltaOmega_j for projected integration. Normalized limb profiles preserve their declared projected integral; on-raster and off-raster support partition the full result without renormalization; and resolved and collapsed representations converge to the same analytic small-angle integral.
