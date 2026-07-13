# E4 - Point-Source Flux Conservation

## Question

What point-response normalization and raster-boundary accounting conserve transported point flux when it is distributed as pixel spectral radiance?

## Inputs

```json
{
  "basis": {
    "channelCount": 15,
    "sampleMeaning": "spectral-flux-density packet on the adopted canonical basis"
  },
  "physicalDataTypes": {
    "sourcePacket": "spectral flux density",
    "pixelValue": "spectral radiance density",
    "responseWeight": "normalized dimensionless point-response mass",
    "pixelSolidAngle": "solid angle"
  },
  "formulas": {
    "pixelRadiance": "L_lambda_i = F_lambda * p_i / Omega_i",
    "accountedFlux": "sum_i(L_lambda_i * Omega_i)",
    "edgeAccounting": "on-raster flux + off-raster flux = source flux"
  },
  "roundingBound": {
    "arithmetic": "IEEE-754 binary64",
    "gamma": "gamma(n) = n*epsilon/(1-n*epsilon)",
    "safetyFactor": 8
  },
  "sourcePackets": {
    "primary": [
      2e-13,
      6.000000000000001e-13,
      1.2000000000000001e-12,
      2e-12,
      3e-12,
      4.2e-12,
      5.6e-12,
      7.2e-12,
      9e-12,
      1.1e-11,
      1.32e-11,
      1.56e-11,
      1.82e-11,
      2.1000000000000002e-11,
      2.4e-11
    ],
    "secondary": [
      9.25e-13,
      8.65e-13,
      8.050000000000001e-13,
      7.45e-13,
      6.85e-13,
      6.250000000000001e-13,
      5.649999999999999e-13,
      5.05e-13,
      4.45e-13,
      3.85e-13,
      3.2500000000000003e-13,
      2.65e-13,
      2.0499999999999998e-13,
      1.45e-13,
      8.5e-14
    ]
  },
  "cases": [
    {
      "id": "interior",
      "description": "Four-pixel interior response.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "p00",
              "weight": 0.25,
              "solidAngleSteradians": 0.000002,
              "onRaster": true
            },
            {
              "pixelId": "p10",
              "weight": 0.25,
              "solidAngleSteradians": 0.0000021,
              "onRaster": true
            },
            {
              "pixelId": "p01",
              "weight": 0.25,
              "solidAngleSteradians": 0.0000022,
              "onRaster": true
            },
            {
              "pixelId": "p11",
              "weight": 0.25,
              "solidAngleSteradians": 0.0000023,
              "onRaster": true
            }
          ]
        }
      ]
    },
    {
      "id": "subpixel",
      "description": "Asymmetric subpixel response.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "p00",
              "weight": 0.125,
              "solidAngleSteradians": 0.0000017,
              "onRaster": true
            },
            {
              "pixelId": "p10",
              "weight": 0.375,
              "solidAngleSteradians": 0.0000018,
              "onRaster": true
            },
            {
              "pixelId": "p01",
              "weight": 0.125,
              "solidAngleSteradians": 0.0000019,
              "onRaster": true
            },
            {
              "pixelId": "p11",
              "weight": 0.375,
              "solidAngleSteradians": 0.000002,
              "onRaster": true
            }
          ]
        }
      ]
    },
    {
      "id": "edge",
      "description": "Half of the response lies beyond one raster edge.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "edge-on-0",
              "weight": 0.3,
              "solidAngleSteradians": 0.0000024,
              "onRaster": true
            },
            {
              "pixelId": "edge-on-1",
              "weight": 0.2,
              "solidAngleSteradians": 0.0000025,
              "onRaster": true
            },
            {
              "pixelId": "edge-off-0",
              "weight": 0.3,
              "solidAngleSteradians": 0.0000024,
              "onRaster": false
            },
            {
              "pixelId": "edge-off-1",
              "weight": 0.2,
              "solidAngleSteradians": 0.0000025,
              "onRaster": false
            }
          ]
        }
      ]
    },
    {
      "id": "corner",
      "description": "Only one response entry remains on raster.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "corner-on",
              "weight": 0.16,
              "solidAngleSteradians": 0.000003,
              "onRaster": true
            },
            {
              "pixelId": "corner-off-x",
              "weight": 0.24,
              "solidAngleSteradians": 0.0000031,
              "onRaster": false
            },
            {
              "pixelId": "corner-off-y",
              "weight": 0.24,
              "solidAngleSteradians": 0.0000032,
              "onRaster": false
            },
            {
              "pixelId": "corner-off-xy",
              "weight": 0.36,
              "solidAngleSteradians": 0.0000033,
              "onRaster": false
            }
          ]
        }
      ]
    },
    {
      "id": "fully-off-raster",
      "description": "The complete normalized response is off raster.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "off-0",
              "weight": 0.25,
              "solidAngleSteradians": 0.0000027,
              "onRaster": false
            },
            {
              "pixelId": "off-1",
              "weight": 0.25,
              "solidAngleSteradians": 0.0000028,
              "onRaster": false
            },
            {
              "pixelId": "off-2",
              "weight": 0.25,
              "solidAngleSteradians": 0.0000029,
              "onRaster": false
            },
            {
              "pixelId": "off-3",
              "weight": 0.25,
              "solidAngleSteradians": 0.000003,
              "onRaster": false
            }
          ]
        }
      ]
    },
    {
      "id": "fine-resolution",
      "description": "Small pixel solid angles represent a fine raster.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "fine-0",
              "weight": 0.5,
              "solidAngleSteradians": 1e-7,
              "onRaster": true
            },
            {
              "pixelId": "fine-1",
              "weight": 0.5,
              "solidAngleSteradians": 1.2e-7,
              "onRaster": true
            }
          ]
        }
      ]
    },
    {
      "id": "wide-field",
      "description": "Large pixel solid angles represent a wider field of view.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "wide-0",
              "weight": 0.5,
              "solidAngleSteradians": 0.000008,
              "onRaster": true
            },
            {
              "pixelId": "wide-1",
              "weight": 0.5,
              "solidAngleSteradians": 0.000009,
              "onRaster": true
            }
          ]
        }
      ]
    },
    {
      "id": "overlapping-sources",
      "description": "Two sources contribute linearly to one shared pixel.",
      "sources": [
        {
          "sourceId": "primary",
          "flux": [
            2e-13,
            6.000000000000001e-13,
            1.2000000000000001e-12,
            2e-12,
            3e-12,
            4.2e-12,
            5.6e-12,
            7.2e-12,
            9e-12,
            1.1e-11,
            1.32e-11,
            1.56e-11,
            1.82e-11,
            2.1000000000000002e-11,
            2.4e-11
          ],
          "footprint": [
            {
              "pixelId": "shared",
              "weight": 1,
              "solidAngleSteradians": 0.000002,
              "onRaster": true
            }
          ]
        },
        {
          "sourceId": "secondary",
          "flux": [
            9.25e-13,
            8.65e-13,
            8.050000000000001e-13,
            7.45e-13,
            6.85e-13,
            6.250000000000001e-13,
            5.649999999999999e-13,
            5.05e-13,
            4.45e-13,
            3.85e-13,
            3.2500000000000003e-13,
            2.65e-13,
            2.0499999999999998e-13,
            1.45e-13,
            8.5e-14
          ],
          "footprint": [
            {
              "pixelId": "shared",
              "weight": 0.5,
              "solidAngleSteradians": 0.000002,
              "onRaster": true
            },
            {
              "pixelId": "secondary-neighbor",
              "weight": 0.5,
              "solidAngleSteradians": 0.0000025,
              "onRaster": true
            }
          ]
        }
      ]
    }
  ]
}
```

## Iterations

Iterations: 8

| iteration | case | sources | response mass on/off | maximum mass residual | maximum partition residual | maximum total residual | maximum additivity residual | accepted |
| ---: | --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | interior | 1 | 1.000000e+0 / 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 2 | subpixel | 1 | 1.000000e+0 / 0.000000e+0 | 0.000000e+0 | 8.077936e-28 | 8.077936e-28 | 8.077936e-28 | yes |
| 3 | edge | 1 | 5.000000e-1 / 5.000000e-1 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 4 | corner | 1 | 1.600000e-1 / 8.400000e-1 | 0.000000e+0 | 3.231174e-27 | 3.231174e-27 | 0.000000e+0 | yes |
| 5 | fully-off-raster | 1 | 0.000000e+0 / 1.000000e+0 | 0.000000e+0 | 3.231174e-27 | 3.231174e-27 | 0.000000e+0 | yes |
| 6 | fine-resolution | 1 | 1.000000e+0 / 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 7 | wide-field | 1 | 1.000000e+0 / 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 8 | overlapping-sources | 2 | 2.000000e+0 / 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | 3.231174e-27 | 3.231174e-27 | yes |

## Maximum observed residuals

```json
{
  "responseMassResidual": 0,
  "partitionFluxResidual": 3.2311742677852644e-27,
  "totalFluxResidual": 3.2311742677852644e-27,
  "overlappingAdditivityResidual": 3.2311742677852644e-27
}
```

## Conclusion

Accepted. A normalized point response conserves every channel of the input spectral flux when each pixel receives L_lambda_i = F_lambda * p_i / Omega_i. On-raster and explicitly off-raster response mass account for the complete flux without edge renormalization; the result is invariant to pixel solid angle and overlapping sources add linearly.
