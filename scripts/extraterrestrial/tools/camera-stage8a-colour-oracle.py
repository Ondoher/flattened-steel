#!/usr/bin/env python3
"""Independent Colour 0.4.6 oracle for the Stage 8a relative camera proof."""

import json
import platform
import sys

import colour
import numpy as np


def sample_piecewise(pairs, wavelengths):
    source_wavelengths = np.asarray([row[0] for row in pairs], dtype=float)
    source_values = np.asarray([row[1] for row in pairs], dtype=float)
    return np.interp(
        wavelengths,
        source_wavelengths,
        source_values,
        left=source_values[0],
        right=source_values[-1],
    )


def align_sd(sd, shape):
    return np.asarray(sd.copy().align(shape).values, dtype=float)


def integrate_linear_samples(wavelengths, values, lower, upper):
    interior = wavelengths[(wavelengths > lower) & (wavelengths < upper)]
    points = np.concatenate(([lower], interior, [upper]))
    sampled = np.interp(points, wavelengths, values)
    return float(np.trapezoid(sampled, points))


def compile_weights(wavelengths, rows, bins):
    return [
        [
            integrate_linear_samples(
                wavelengths,
                row,
                channel["centerNanometers"] - channel["widthNanometers"] / 2,
                channel["centerNanometers"] + channel["widthNanometers"] / 2,
            )
            for channel in bins
        ]
        for row in rows
    ]


def project_reflectance(reflectance, illuminant, bases):
    denominator = float(np.sum(illuminant * bases[1]))
    return np.asarray(
        [float(np.sum(reflectance * illuminant * basis)) / denominator for basis in bases],
        dtype=float,
    )


def main():
    payload = json.load(sys.stdin)
    shape_config = payload["spectralShape"]
    shape = colour.SpectralShape(
        shape_config["startNanometers"],
        shape_config["endNanometers"],
        shape_config["intervalNanometers"],
    )
    wavelengths = np.arange(shape.start, shape.end + shape.interval, shape.interval, dtype=float)

    responses = np.asarray(
        [sample_piecewise(payload["responses"][channel], wavelengths) for channel in ("r", "g", "b")],
        dtype=float,
    )
    cmfs = np.asarray(
        colour.MSDS_CMFS["CIE 1931 2 Degree Standard Observer"].copy().align(shape).values,
        dtype=float,
    ).T
    d55 = align_sd(colour.SDS_ILLUMINANTS["D55"], shape)
    d65 = align_sd(colour.SDS_ILLUMINANTS["D65"], shape)
    checker = colour.SDS_COLOURCHECKERS[payload["colourCheckerDataset"]]
    patch_names = list(checker.keys())
    reflectances = np.asarray([align_sd(checker[name], shape) for name in patch_names], dtype=float)

    sensor_white_green = float(np.sum(d55 * responses[1]))
    sensor_white_y = float(np.sum(d55 * cmfs[1]))
    camera_rows = np.asarray(
        [project_reflectance(reflectance, d55, responses) for reflectance in reflectances],
        dtype=float,
    )
    target_rows = np.asarray(
        [
            project_reflectance(reflectance, d65, cmfs) * (sensor_white_y / sensor_white_green)
            for reflectance in reflectances
        ],
        dtype=float,
    )

    held_out = set(payload["heldOutPatchIndicesZeroBased"])
    training_indices = [index for index in range(len(patch_names)) if index not in held_out]
    held_out_indices = sorted(held_out)
    fitted_columns, _, rank, singular_values = np.linalg.lstsq(
        camera_rows[training_indices], target_rows[training_indices], rcond=None
    )
    sensor_to_xyz = fitted_columns.T
    predicted = camera_rows @ fitted_columns

    d65_xy = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["D65"]
    target_lab = colour.XYZ_to_Lab(target_rows, illuminant=d65_xy)
    predicted_lab = colour.XYZ_to_Lab(predicted, illuminant=d65_xy)
    delta_e = np.asarray(colour.delta_E(target_lab, predicted_lab, method="CIE 2000"), dtype=float)
    residual = predicted - target_rows

    result = {
        "schemaId": "camera-stage8a-colour-oracle-v1",
        "environment": {
            "python": platform.python_version(),
            "colour": colour.__version__,
            "numpy": np.__version__,
        },
        "configuration": {
            "spectralShape": shape_config,
            "characterizationIlluminant": "D55",
            "outputIlluminant": "D65",
            "colourCheckerDataset": payload["colourCheckerDataset"],
            "trainingPatchIndicesZeroBased": training_indices,
            "heldOutPatchIndicesZeroBased": held_out_indices,
        },
        "alignedData": {
            "wavelengthsNanometers": wavelengths.tolist(),
            "sensorResponses": responses.tolist(),
            "cie1931": cmfs.tolist(),
            "d55": d55.tolist(),
            "d65": d65.tolist(),
            "patchNames": patch_names,
            "reflectances": reflectances.tolist(),
        },
        "derived": {
            "cameraNative15Weights": compile_weights(wavelengths, responses, payload["nativeBins"]),
            "idealCie1931Native15Weights": compile_weights(wavelengths, cmfs, payload["nativeBins"]),
            "sensorToXyzD65Matrix": sensor_to_xyz.tolist(),
            "cameraPatchRows": camera_rows.tolist(),
            "targetXyzRows": target_rows.tolist(),
            "predictedXyzRows": predicted.tolist(),
            "sensorWhiteGreen": sensor_white_green,
            "sensorWhiteY": sensor_white_y,
            "fitRank": int(rank),
            "fitSingularValues": singular_values.tolist(),
            "fitXyzRmse": float(np.sqrt(np.mean(residual * residual))),
            "deltaE2000": delta_e.tolist(),
            "trainingMeanDeltaE2000": float(np.mean(delta_e[training_indices])),
            "trainingMaximumDeltaE2000": float(np.max(delta_e[training_indices])),
            "heldOutMeanDeltaE2000": float(np.mean(delta_e[held_out_indices])),
            "heldOutMaximumDeltaE2000": float(np.max(delta_e[held_out_indices])),
        },
    }
    json.dump(result, sys.stdout, separators=(",", ":"), allow_nan=False)


if __name__ == "__main__":
    main()
