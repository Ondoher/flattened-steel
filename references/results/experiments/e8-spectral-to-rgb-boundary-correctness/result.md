# E8 - Spectral-to-RGB Boundary Correctness

## Question

What single output-boundary transformation converts the adopted 15-channel Bruneton-family completed spectral-radiance packet into reproducible RGB while preserving channel, quantity, unit, and bin semantics and exposing every non-spectral display policy?

## Inputs

```json
{
  "canonicalPacket": {
    "channelCount": 15,
    "wavelengthsNanometers": [
      375.6666666666667,
      407,
      438.3333333333333,
      469.66666666666663,
      501,
      532.3333333333333,
      563.6666666666666,
      595,
      626.3333333333333,
      657.6666666666666,
      689,
      720.3333333333333,
      751.6666666666666,
      783,
      814.3333333333333
    ],
    "binWidthNanometers": 31.333333333333332,
    "unit": "W m^-2 sr^-1 nm^-1",
    "basis": "bruneton-15-bin-average-360-830-nm",
    "semantics": "bin-average spectral radiance density"
  },
  "cieData": "references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv",
  "interpolation": "linear at each channel center",
  "efficacyLumensPerWatt": 683,
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
  "displayPolicy": {
    "negativeLinearClamp": 0,
    "toneMap": "1-exp(-max(0,c)/(5*683))",
    "finalClamp": [
      0,
      1
    ],
    "transfer": "continuous display-linear sRGB; encoding is outside this experiment boundary"
  },
  "cases": [
    {
      "id": "basis-01",
      "kind": "projection",
      "values": [
        1,
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
      "id": "basis-02",
      "kind": "projection",
      "values": [
        0,
        1,
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
      "id": "basis-03",
      "kind": "projection",
      "values": [
        0,
        0,
        1,
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
      "id": "basis-04",
      "kind": "projection",
      "values": [
        0,
        0,
        0,
        1,
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
      "id": "basis-05",
      "kind": "projection",
      "values": [
        0,
        0,
        0,
        0,
        1,
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
      "id": "basis-06",
      "kind": "projection",
      "values": [
        0,
        0,
        0,
        0,
        0,
        1,
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
      "id": "basis-07",
      "kind": "projection",
      "values": [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
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
      "id": "basis-08",
      "kind": "projection",
      "values": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
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
      "id": "basis-09",
      "kind": "projection",
      "values": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      "id": "basis-10",
      "kind": "projection",
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
        1,
        0,
        0,
        0,
        0,
        0
      ]
    },
    {
      "id": "basis-11",
      "kind": "projection",
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
        1,
        0,
        0,
        0,
        0
      ]
    },
    {
      "id": "basis-12",
      "kind": "projection",
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
        1,
        0,
        0,
        0
      ]
    },
    {
      "id": "basis-13",
      "kind": "projection",
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
        1,
        0,
        0
      ]
    },
    {
      "id": "basis-14",
      "kind": "projection",
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
        1,
        0
      ]
    },
    {
      "id": "basis-15",
      "kind": "projection",
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
        1
      ]
    },
    {
      "id": "positive-combination",
      "kind": "projection",
      "values": [
        0.0001,
        0.00024,
        0.00041999999999999996,
        0.0004,
        0.0006000000000000001,
        0.0008399999999999999,
        0.0007,
        0.00096,
        0.00126,
        0.001,
        0.00132,
        0.0016799999999999999,
        0.0013000000000000002,
        0.00168,
        0.0021000000000000003
      ]
    },
    {
      "id": "signed-combination",
      "kind": "projection",
      "values": [
        0.00002,
        -0.00004,
        0.00006000000000000001,
        -0.00008,
        0.0001,
        -0.00012000000000000002,
        0.00014000000000000001,
        -0.00016,
        0.00018,
        -0.0002,
        0.00022,
        -0.00024000000000000003,
        0.00026000000000000003,
        -0.00028000000000000003,
        0.00030000000000000003
      ]
    },
    {
      "id": "near-zero",
      "kind": "projection",
      "values": [
        1e-15,
        2e-15,
        3.0000000000000002e-15,
        4e-15,
        5.000000000000001e-15,
        6.0000000000000005e-15,
        7e-15,
        8e-15,
        9.000000000000001e-15,
        1.0000000000000002e-14,
        1.1e-14,
        1.2000000000000001e-14,
        1.3000000000000001e-14,
        1.4e-14,
        1.5000000000000002e-14
      ]
    },
    {
      "id": "high-radiance",
      "kind": "projection",
      "values": [
        25,
        50,
        75,
        100,
        125,
        150,
        175,
        200,
        225,
        250,
        275,
        300,
        325,
        350,
        375
      ]
    },
    {
      "id": "composition-label-set-a",
      "kind": "projection",
      "labels": [
        "path",
        "endpoint",
        "extended",
        "point"
      ],
      "values": [
        0.00031000000000000005,
        0.00037000000000000005,
        0.00043000000000000004,
        0.0004900000000000001,
        0.00043000000000000004,
        0.00029000000000000006,
        0.00035,
        0.00041000000000000005,
        0.00035000000000000005,
        0.0004100000000000001,
        0.00027,
        0.00033000000000000005,
        0.00027,
        0.00033,
        0.00039000000000000005
      ]
    },
    {
      "id": "composition-label-set-b",
      "kind": "projection",
      "labels": [
        "material-x",
        "source-y"
      ],
      "values": [
        0.00031000000000000005,
        0.00037000000000000005,
        0.00043000000000000004,
        0.0004900000000000001,
        0.00043000000000000004,
        0.00029000000000000006,
        0.00035,
        0.00041000000000000005,
        0.00035000000000000005,
        0.0004100000000000001,
        0.00027,
        0.00033000000000000005,
        0.00027,
        0.00033,
        0.00039000000000000005
      ]
    },
    {
      "id": "missing-unit-rejected",
      "kind": "rejection",
      "values": {
        "values": [
          0.0001,
          0.00024,
          0.00041999999999999996,
          0.0004,
          0.0006000000000000001,
          0.0008399999999999999,
          0.0007,
          0.00096,
          0.00126,
          0.001,
          0.00132,
          0.0016799999999999999,
          0.0013000000000000002,
          0.00168,
          0.0021000000000000003
        ],
        "basis": "bruneton-15-bin-average-360-830-nm",
        "sampleSemantics": "bin-average spectral radiance density"
      }
    },
    {
      "id": "wrong-basis-rejected",
      "kind": "rejection",
      "values": {
        "values": [
          0.0001,
          0.00024,
          0.00041999999999999996,
          0.0004,
          0.0006000000000000001,
          0.0008399999999999999,
          0.0007,
          0.00096,
          0.00126,
          0.001,
          0.00132,
          0.0016799999999999999,
          0.0013000000000000002,
          0.00168,
          0.0021000000000000003
        ],
        "unit": "W m^-2 sr^-1 nm^-1",
        "basis": "point-samples",
        "sampleSemantics": "point spectral radiance density"
      }
    }
  ]
}
```

## Iterations

Iterations: 23

| iteration | case | kind | XYZ residual | linear-sRGB residual | display-RGB residual | accepted |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 1 | basis-01 | projection | 0.000000e+0 | 0.000000e+0 | 3.122502e-17 | yes |
| 2 | basis-02 | projection | 0.000000e+0 | 0.000000e+0 | 5.551115e-17 | yes |
| 3 | basis-03 | projection | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 4 | basis-04 | projection | 7.105427e-15 | 3.637979e-12 | 1.665335e-16 | yes |
| 5 | basis-05 | projection | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 6 | basis-06 | projection | 3.552714e-15 | 3.637979e-12 | 0.000000e+0 | yes |
| 7 | basis-07 | projection | 3.552714e-15 | 1.091394e-11 | 1.110223e-16 | yes |
| 8 | basis-08 | projection | 0.000000e+0 | 0.000000e+0 | 1.110223e-16 | yes |
| 9 | basis-09 | projection | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 10 | basis-10 | projection | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 11 | basis-11 | projection | 0.000000e+0 | 0.000000e+0 | 0.000000e+0 | yes |
| 12 | basis-12 | projection | 0.000000e+0 | 0.000000e+0 | 6.938894e-18 | yes |
| 13 | basis-13 | projection | 1.734723e-18 | 3.552714e-15 | 3.989864e-17 | yes |
| 14 | basis-14 | projection | 0.000000e+0 | 0.000000e+0 | 2.200930e-17 | yes |
| 15 | basis-15 | projection | 1.355253e-20 | 5.551115e-17 | 4.784042e-18 | yes |
| 16 | positive-combination | projection | 1.387779e-17 | 2.842171e-14 | 4.683753e-17 | yes |
| 17 | signed-combination | projection | 4.336809e-19 | 1.276756e-15 | 2.795886e-17 | yes |
| 18 | near-zero | projection | 0.000000e+0 | 1.033976e-25 | 4.476554e-17 | yes |
| 19 | high-radiance | projection | 3.637979e-12 | 9.313226e-9 | 0.000000e+0 | yes |
| 20 | composition-label-set-a | projection | 0.000000e+0 | 7.105427e-15 | 4.857226e-17 | yes |
| 21 | composition-label-set-b | projection | 0.000000e+0 | 7.105427e-15 | 4.857226e-17 | yes |
| 22 | missing-unit-rejected | rejection | n/a | n/a | n/a | yes |
| 23 | wrong-basis-rejected | rejection | n/a | n/a | n/a | yes |

## Cross-case invariants

```json
{
  "basisReconstruction": {
    "residual": 2.842170943040401e-14,
    "limit": 9.102922523371579e-11,
    "accepted": true
  },
  "sourceAndMaterialLabelInvariance": {
    "residual": 0,
    "limit": 9.102036833325441e-15,
    "accepted": true
  },
  "binWidthAppliedExactlyOnce": true,
  "negativeLinearAndFinalClampCaseObserved": true
}
```

## Conclusion

Accepted. The canonical 15-channel bin-average spectral-radiance packet converts reproducibly through exactly-once bin-width integration against the official CIE table, 683 lm/W scaling, and the declared XYZ-to-linear-sRGB matrix. All spectral contributions compose before one global display mapping; source and material labels do not alter the result; noncanonical or unitless packets are rejected; and negative and high linear values are handled only by the exposed final display policy.
