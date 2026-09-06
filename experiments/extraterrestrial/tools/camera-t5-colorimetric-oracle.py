#!/usr/bin/env python3
"""Independent relative-camera colorimetric oracle for the T5 prerequisite."""

import hashlib
import json
import platform
from pathlib import Path
import sys

import colour
import numpy as np


DOMAIN_START = 380.0
DOMAIN_END = 780.0
REFERENCE_WAVELENGTHS = np.arange(DOMAIN_START, DOMAIN_END + 1.0, 1.0)


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_csv_curve(path, column_count):
    values = np.loadtxt(path, delimiter=",")
    require(values.ndim == 2 and values.shape[1] == column_count, f"Invalid CSV shape: {path}")
    return values[:, 0], values[:, 1:].T


def interpolate_zero(wavelengths, values, targets):
    return np.interp(targets, wavelengths, values, left=0.0, right=0.0)


def trapz(values, wavelengths=REFERENCE_WAVELENGTHS):
    return float(np.trapezoid(values, wavelengths))


def native_bin_average(values, center, width):
    lower = center - width / 2.0
    upper = center + width / 2.0
    interior = REFERENCE_WAVELENGTHS[
        (REFERENCE_WAVELENGTHS > lower) & (REFERENCE_WAVELENGTHS < upper)
    ]
    points = np.concatenate(([lower], interior, [upper]))
    samples = interpolate_zero(REFERENCE_WAVELENGTHS, values, points)
    return float(np.trapezoid(samples, points) / width)


def compile_native_weights(responses, bins):
    weights = []
    for response in responses:
        row = []
        for channel in bins:
            lower = channel["centerNanometers"] - channel["widthNanometers"] / 2.0
            upper = channel["centerNanometers"] + channel["widthNanometers"] / 2.0
            interior = REFERENCE_WAVELENGTHS[
                (REFERENCE_WAVELENGTHS > lower) & (REFERENCE_WAVELENGTHS < upper)
            ]
            points = np.concatenate(([lower], interior, [upper]))
            samples = interpolate_zero(REFERENCE_WAVELENGTHS, response, points)
            row.append(float(np.trapezoid(samples, points)))
        weights.append(row)
    return np.asarray(weights, dtype=np.float64)


def camera_response_1nm(reflectance, illuminant, responses):
    product = reflectance * illuminant
    raw = np.asarray([trapz(product * response) for response in responses], dtype=np.float64)
    white = np.asarray([trapz(illuminant * response) for response in responses], dtype=np.float64)
    require(np.all(white > 0), "A camera white response is not positive.")
    return raw / white


def camera_raw_and_wb_1nm(reflectance, illuminant, responses):
    product = reflectance * illuminant
    raw = np.asarray([trapz(product * response) for response in responses], dtype=np.float64)
    white = np.asarray([trapz(illuminant * response) for response in responses], dtype=np.float64)
    require(np.all(white > 0), "A camera white response is not positive.")
    reference = white[1]
    raw_normalized = raw / reference
    multipliers = reference / white
    return raw_normalized, multipliers, raw_normalized * multipliers


def camera_response_native(reflectance, illuminant, weights, bins):
    product = reflectance * illuminant
    product_bins = np.asarray(
        [native_bin_average(product, item["centerNanometers"], item["widthNanometers"]) for item in bins],
        dtype=np.float64,
    )
    white_bins = np.asarray(
        [native_bin_average(illuminant, item["centerNanometers"], item["widthNanometers"]) for item in bins],
        dtype=np.float64,
    )
    raw = weights @ product_bins
    white = weights @ white_bins
    require(np.all(white > 0), "A native camera white response is not positive.")
    return raw / white


def camera_raw_and_wb_native(reflectance, illuminant, weights, bins):
    product = reflectance * illuminant
    product_bins = np.asarray(
        [native_bin_average(product, item["centerNanometers"], item["widthNanometers"]) for item in bins],
        dtype=np.float64,
    )
    white_bins = np.asarray(
        [native_bin_average(illuminant, item["centerNanometers"], item["widthNanometers"]) for item in bins],
        dtype=np.float64,
    )
    raw = weights @ product_bins
    white = weights @ white_bins
    require(np.all(white > 0), "A native camera white response is not positive.")
    reference = white[1]
    raw_normalized = raw / reference
    multipliers = reference / white
    return raw_normalized, multipliers, raw_normalized * multipliers


def target_xyz_d65(reflectance, d65, cmfs):
    normalization = 1.0 / trapz(d65 * cmfs[1])
    return np.asarray(
        [normalization * trapz(reflectance * d65 * cmf) for cmf in cmfs],
        dtype=np.float64,
    )


def delta_e_2000(left_xyz, right_xyz):
    d65_xy = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["D65"]
    left_lab = colour.XYZ_to_Lab(np.asarray(left_xyz), illuminant=d65_xy)
    right_lab = colour.XYZ_to_Lab(np.asarray(right_xyz), illuminant=d65_xy)
    return np.asarray(colour.delta_E(left_lab, right_lab, method="CIE 2000"), dtype=np.float64)


def metrics(rows):
    camera_1nm = np.asarray([row["camera1nm"] for row in rows], dtype=np.float64)
    camera_native = np.asarray([row["cameraNative15"] for row in rows], dtype=np.float64)
    target = np.asarray([row["targetXyzD65"] for row in rows], dtype=np.float64)
    predicted_1nm = np.asarray([row["predictedXyz1nm"] for row in rows], dtype=np.float64)
    predicted_native = np.asarray([row["predictedXyzNative15"] for row in rows], dtype=np.float64)
    channel_relative = np.abs(camera_native - camera_1nm) / np.maximum(np.abs(camera_1nm), 1e-15)
    de_1nm = delta_e_2000(target, predicted_1nm)
    de_native = delta_e_2000(target, predicted_native)
    de_added = delta_e_2000(predicted_1nm, predicted_native)
    return {
        "count": len(rows),
        "cameraNative15MaximumRelativeError": float(np.max(channel_relative)),
        "cameraNative15MeanRelativeError": float(np.mean(channel_relative)),
        "matrix1nmXyzRmse": float(np.sqrt(np.mean((predicted_1nm - target) ** 2))),
        "matrixNative15XyzRmse": float(np.sqrt(np.mean((predicted_native - target) ** 2))),
        "deltaE2000ToTarget1nmMean": float(np.mean(de_1nm)),
        "deltaE2000ToTarget1nmMaximum": float(np.max(de_1nm)),
        "deltaE2000ToTargetNative15Mean": float(np.mean(de_native)),
        "deltaE2000ToTargetNative15Maximum": float(np.max(de_native)),
        "deltaE2000Native15Versus1nmMean": float(np.mean(de_added)),
        "deltaE2000Native15Versus1nmMaximum": float(np.max(de_added)),
        "deltaE2000Native15Versus1nmP95": float(np.percentile(de_added, 95)),
    }


def main():
    payload = json.load(sys.stdin)
    source_root = Path(payload["sourceRoot"])
    manifest = json.loads((source_root / "source-manifest.json").read_text(encoding="utf-8"))
    source_hashes = {item["path"]: item["sha256"] for item in manifest["sources"]}
    for relative, expected in source_hashes.items():
        require(sha256(source_root / relative) == expected, f"Source hash changed: {relative}")

    installed_colour_module = Path(
        sys.modules["colour.characterisation.datasets.colour_checkers.sds"].__file__
    )
    require(
        sha256(installed_colour_module) == source_hashes["colour-0.4.6-colorchecker-sds.py"],
        "Installed Colour Ohta source does not match the retained source module.",
    )

    camera_document = json.loads(
        (source_root / "Canon_EOS_5D_Mark_IV_380_780_5.json").read_text(encoding="utf-8")
    )
    camera_data = camera_document["spectral_data"]["data"]["main"]
    camera_wavelengths = np.asarray(sorted(float(item) for item in camera_data), dtype=np.float64)
    camera_values = np.asarray(
        [camera_data[str(int(wavelength))] for wavelength in camera_wavelengths], dtype=np.float64
    ).T
    responses = np.asarray(
        [interpolate_zero(camera_wavelengths, row, REFERENCE_WAVELENGTHS) for row in camera_values],
        dtype=np.float64,
    )

    training_document = json.loads((source_root / "training_spectral.json").read_text(encoding="utf-8"))
    training_data = training_document["spectral_data"]["data"]["main"]
    training_wavelengths = np.asarray(sorted(float(item) for item in training_data), dtype=np.float64)
    training_names = training_document["spectral_data"]["index"]["main"]
    training_samples = np.asarray(
        [training_data[str(int(wavelength))] for wavelength in training_wavelengths], dtype=np.float64
    ).T
    training_reflectances = np.asarray(
        [interpolate_zero(training_wavelengths, row, REFERENCE_WAVELENGTHS) for row in training_samples],
        dtype=np.float64,
    )

    cie_wavelengths, cie_rows = load_csv_curve(source_root / "CIE_xyz_1931_2deg.csv", 4)
    cmfs = np.asarray(
        [interpolate_zero(cie_wavelengths, row, REFERENCE_WAVELENGTHS) for row in cie_rows],
        dtype=np.float64,
    )
    illuminants = {}
    for name, filename in {
        "D55": "CIE_illum_D55.csv",
        "D65": "CIE_std_illum_D65.csv",
        "D75": "CIE_illum_D75.csv",
    }.items():
        wavelengths, rows = load_csv_curve(source_root / filename, 2)
        illuminants[name] = interpolate_zero(wavelengths, rows[0], REFERENCE_WAVELENGTHS)

    ohta = colour.SDS_COLOURCHECKERS["ColorChecker N Ohta"]
    ohta_names = list(ohta.keys())
    ohta_reflectances = []
    for name in ohta_names:
        spectral_distribution = ohta[name]
        source_wavelengths = np.asarray(spectral_distribution.wavelengths, dtype=np.float64)
        source_values = np.asarray(spectral_distribution.values, dtype=np.float64)
        ohta_reflectances.append(
            interpolate_zero(source_wavelengths, source_values, REFERENCE_WAVELENGTHS)
        )
    ohta_reflectances = np.asarray(ohta_reflectances, dtype=np.float64)

    bins = payload["nativeBins"]
    native_weights = compile_native_weights(responses, bins)
    d55 = illuminants["D55"]
    d65 = illuminants["D65"]

    training_camera_1nm = np.asarray(
        [camera_response_1nm(row, d55, responses) for row in training_reflectances],
        dtype=np.float64,
    )
    training_target = np.asarray(
        [target_xyz_d65(row, d65, cmfs) for row in training_reflectances],
        dtype=np.float64,
    )
    fitted_columns, _, rank, singular_values = np.linalg.lstsq(
        training_camera_1nm, training_target, rcond=None
    )
    require(rank == 3, "The 190-patch camera fit is not full rank.")
    sensor_to_xyz = fitted_columns.T

    def make_row(identifier, name, reflectance, illuminant_name, role):
        illuminant = illuminants[illuminant_name]
        raw_1nm, wb_1nm, camera_1nm = camera_raw_and_wb_1nm(reflectance, illuminant, responses)
        raw_native, wb_native, camera_native = camera_raw_and_wb_native(
            reflectance, illuminant, native_weights, bins
        )
        target = target_xyz_d65(reflectance, d65, cmfs)
        return {
            "id": identifier,
            "name": name,
            "role": role,
            "captureIlluminant": illuminant_name,
            "rawNormalized1nm": raw_1nm.tolist(),
            "whiteBalanceMultipliers1nm": wb_1nm.tolist(),
            "camera1nm": camera_1nm.tolist(),
            "rawNormalizedNative15": raw_native.tolist(),
            "whiteBalanceMultipliersNative15": wb_native.tolist(),
            "cameraNative15": camera_native.tolist(),
            "targetXyzD65": target.tolist(),
            "predictedXyz1nm": (sensor_to_xyz @ camera_1nm).tolist(),
            "predictedXyzNative15": (sensor_to_xyz @ camera_native).tolist(),
        }

    training_rows = [
        make_row(f"training/D55/{index:03d}", name, training_reflectances[index], "D55", "fit")
        for index, name in enumerate(training_names)
    ]
    validation = {}
    for illuminant_name in ("D55", "D65", "D75"):
        validation[illuminant_name] = [
            make_row(
                f"ohta/{illuminant_name}/{index:02d}",
                name,
                ohta_reflectances[index],
                illuminant_name,
                "independent-validation",
            )
            for index, name in enumerate(ohta_names)
        ]

    white = np.ones_like(REFERENCE_WAVELENGTHS)
    white_checks = {}
    for illuminant_name, illuminant in illuminants.items():
        raw_1nm, wb_1nm, balanced_1nm = camera_raw_and_wb_1nm(
            white, illuminant, responses
        )
        raw_native, wb_native, balanced_native = camera_raw_and_wb_native(
            white, illuminant, native_weights, bins
        )
        white_checks[illuminant_name] = {
            "rawNormalized1nm": raw_1nm.tolist(),
            "whiteBalanceMultipliers1nm": wb_1nm.tolist(),
            "camera1nm": balanced_1nm.tolist(),
            "rawNormalizedNative15": raw_native.tolist(),
            "whiteBalanceMultipliersNative15": wb_native.tolist(),
            "cameraNative15": balanced_native.tolist(),
        }

    all_validation_rows = [row for name in ("D55", "D65", "D75") for row in validation[name]]
    result = {
        "schemaId": "camera-t5-colorimetric-oracle-v1",
        "environment": {
            "python": platform.python_version(),
            "colour": colour.__version__,
            "numpy": np.__version__,
        },
        "configuration": {
            "domainNanometers": [DOMAIN_START, DOMAIN_END],
            "referenceIntervalNanometers": 1,
            "sourceIntervalNanometers": 5,
            "interpolation": "piecewise-linear",
            "extrapolation": "zero",
            "responseSemantics": "effective relative response; no photon conversion",
            "characterizationIlluminant": "D55",
            "outputReferenceIlluminant": "D65",
            "trainingDataset": "rawtoaces-data 190-patch",
            "validationDataset": "ColorChecker N Ohta, all 24 patches",
            "validationIlluminants": ["D55", "D65", "D75"],
            "excludedIlluminants": ["A"],
            "matrixFit": "unconstrained ordinary least squares, 190 rows",
            "whiteBalance": "per-channel division by perfect-diffuser response",
            "deltaE2000": "Colour CIE 2000, kL=kC=kH=1, D65 Lab reference",
        },
        "sourceHashes": source_hashes,
        "native15": {
            "bins": bins,
            "cameraWeights3x15": native_weights.tolist(),
        },
        "fit": {
            "rank": int(rank),
            "singularValues": singular_values.tolist(),
            "sensorToXyzD65Matrix": sensor_to_xyz.tolist(),
            "metrics": metrics(training_rows),
            "rows": training_rows,
        },
        "validation": {
            name: {"metrics": metrics(rows), "rows": rows} for name, rows in validation.items()
        },
        "combinedValidationMetrics": metrics(all_validation_rows),
        "perfectDiffuserChecks": white_checks,
        "claimLimit": (
            "Relative camera-color characterization over piecewise-linear 5 nm source data. "
            "The 1 nm path is a numerical integration reference, not 1 nm measurement evidence."
        ),
    }
    json.dump(result, sys.stdout, separators=(",", ":"), allow_nan=False)


if __name__ == "__main__":
    main()
