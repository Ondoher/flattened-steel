# E1 - Finite-Object Atmospheric Transfer

## Question

What finite-object invariants and material-boundary requirements follow from applying Bruneton's channel-wise endpoint-radiance-times-transmittance plus in-scatter relation to the simplified opaque-matte boundary?

## Inputs

```json
{
  "basis": {
    "channelCount": 15,
    "supportNanometers": [
      360,
      830
    ],
    "sampleMeaning": "contiguous-bin-average spectral-radiance density"
  },
  "physicalDataTypes": {
    "endpointRadiance": "spectral-radiance density",
    "pathRadiance": "spectral-radiance density",
    "transmittance": "dimensionless spectral transmittance",
    "extinction": "spectral extinction coefficient",
    "distance": "path length"
  },
  "formula": "L_observed[i] = T[i] * L_endpoint[i] + L_path[i]",
  "tolerances": {
    "absolute": 1e-14,
    "relative": 1e-12
  },
  "scalarInputs": {
    "linearityLeftScale": 0.25,
    "linearityRightScale": 1.75,
    "beerLambertDistanceMeters": 25000,
    "perturbedChannel": 9,
    "perturbation": 3
  },
  "packets": {
    "black": [
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
    ],
    "neutral": [
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
    ],
    "redBiased": [
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
    ],
    "blueBiased": [
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
    ],
    "darkForestGreen": [
      0.02,
      0.02,
      0.03,
      0.05,
      0.12,
      0.28,
      0.42,
      0.31,
      0.16,
      0.08,
      0.04,
      0.03,
      0.02,
      0.02,
      0.02
    ],
    "varyingTransmittance": [
      0.15,
      0.20714285714285713,
      0.2642857142857143,
      0.32142857142857145,
      0.37857142857142856,
      0.4357142857142857,
      0.4928571428571429,
      0.55,
      0.6071428571428572,
      0.6642857142857144,
      0.7214285714285714,
      0.7785714285714287,
      0.8357142857142859,
      0.8928571428571429,
      0.9500000000000001
    ],
    "pathRadiance": [
      0.01,
      0.02,
      0.03,
      0.04,
      0.05,
      0.06,
      0.07,
      0.08,
      0.09,
      0.1,
      0.11,
      0.12,
      0.13,
      0.14,
      0.15
    ],
    "extinctionPerMeter": [
      0.000002,
      0.0000024,
      0.0000028,
      0.0000032,
      0.0000036,
      0.000004,
      0.0000044,
      0.0000048,
      0.000005199999999999999,
      0.0000056,
      0.000006,
      0.0000064,
      0.000006799999999999999,
      0.000007199999999999999,
      0.0000076
    ],
    "farTransmittance": [
      0.82,
      0.8099999999999999,
      0.7999999999999999,
      0.7899999999999999,
      0.7799999999999999,
      0.7699999999999999,
      0.76,
      0.75,
      0.74,
      0.73,
      0.72,
      0.71,
      0.7,
      0.69,
      0.6799999999999999
    ],
    "farPathRadiance": [
      0.002,
      0.004,
      0.006,
      0.008,
      0.01,
      0.012,
      0.014,
      0.016,
      0.018000000000000002,
      0.02,
      0.022,
      0.024,
      0.026000000000000002,
      0.028,
      0.03
    ],
    "nearTransmittance": [
      0.9,
      0.892,
      0.884,
      0.876,
      0.868,
      0.86,
      0.852,
      0.844,
      0.8360000000000001,
      0.8280000000000001,
      0.8200000000000001,
      0.812,
      0.804,
      0.796,
      0.788
    ],
    "nearPathRadiance": [
      0.045,
      0.042,
      0.039,
      0.036000000000000004,
      0.033,
      0.03,
      0.027,
      0.024,
      0.021,
      0.018000000000000002,
      0.015,
      0.012,
      0.009000000000000001,
      0.006,
      0.003
    ]
  }
}
```

## Iterations

Iterations: 7
| iteration | case | inputs | maximum absolute residual | maximum relative residual | limit | accepted |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 1 | zero-distance identity | endpoint=redBiased; distance=0 m; extinction=extinctionPerMeter; path=zeros | 0.000000e+0 | 0.000000e+0 | 1.010000e-12 | yes |
| 2 | black endpoint isolates path radiance | endpoint=black; transmittance=varyingTransmittance; path=pathRadiance | 0.000000e+0 | 0.000000e+0 | 1.010000e-12 | yes |
| 3 | zero transmittance removes endpoint | endpoint=neutral; transmittance=zeros; path=pathRadiance | 0.000000e+0 | 0.000000e+0 | 1.010000e-12 | yes |
| 4 | attenuated endpoint is linear | endpoints=blueBiased,redBiased; scales=0.25,1.75; transmittance=varyingTransmittance; path=zeros | 2.220446e-16 | 2.075010e-16 | 1.684375e-12 | yes |
| 5 | spectral channels remain independent | endpoint=darkForestGreen; changedChannel=9; delta=3; transmittance=varyingTransmittance; path=pathRadiance | 0.000000e+0 | 0.000000e+0 | 2.002857e-12 | yes |
| 6 | Beer-Lambert transmittance | endpoint=neutral; extinction=extinctionPerMeter; distance=25000 m; path=zeros | 0.000000e+0 | 0.000000e+0 | 1.010000e-12 | yes |
| 7 | consecutive segments compose | endpoint=redBiased; segments=far,near; each segment supplies transmittance and path radiance | 1.110223e-16 | 1.922371e-16 | 1.010000e-12 | yes |

## Conclusion

Accepted. The channel-wise finite-transfer relation satisfies the zero-distance, endpoint-isolation, endpoint-linearity, spectral-channel, Beer-Lambert, and consecutive-segment invariants using only endpoint radiance, spectral transmittance, and path radiance. It therefore supports replacing the RGB band-average proxy with a spectral finite-object boundary.
