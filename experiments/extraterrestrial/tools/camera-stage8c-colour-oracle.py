#!/usr/bin/env python3
"""Colour 0.4.6 oracle for the Stage 8c authored generic Bayer QE profile."""

import json
import platform
import sys

import colour
import numpy as np


def sample_piecewise(pairs, wavelengths):
    source_wavelengths = np.asarray([row[0] for row in pairs], dtype=float)
    source_values = np.asarray([row[1] for row in pairs], dtype=float)
    return np.interp(wavelengths, source_wavelengths, source_values,
                     left=source_values[0], right=source_values[-1])


def align_sd(sd, shape):
    return np.asarray(sd.copy().align(shape).values, dtype=float)


def project_reflectance(reflectance, illuminant, bases):
    denominator = float(np.sum(illuminant * bases[1]))
    return np.asarray([float(np.sum(reflectance * illuminant * basis)) / denominator
                       for basis in bases], dtype=float)


def integrate_linear_samples(wavelengths, values, lower, upper):
    interior = wavelengths[(wavelengths > lower) & (wavelengths < upper)]
    points = np.concatenate(([lower], interior, [upper]))
    return float(np.trapezoid(np.interp(points, wavelengths, values), points))


def main():
    payload = json.load(sys.stdin)
    shape_config = payload["spectralShape"]
    shape = colour.SpectralShape(shape_config["startNanometers"],
                                 shape_config["endNanometers"],
                                 shape_config["intervalNanometers"])
    wavelengths = np.arange(shape.start, shape.end + shape.interval,
                            shape.interval, dtype=float)
    relative = np.asarray([sample_piecewise(payload["responses"][channel], wavelengths)
                           for channel in ("r", "g", "b")], dtype=float)
    qe = relative / float(np.max(relative)) * payload["peakQuantumEfficiency"]
    raw_photon_bases = qe * (wavelengths[np.newaxis, :] * 1e-9)
    cmfs = np.asarray(colour.MSDS_CMFS["CIE 1931 2 Degree Standard Observer"]
                      .copy().align(shape).values, dtype=float).T
    d55 = align_sd(colour.SDS_ILLUMINANTS["D55"], shape)
    d65 = align_sd(colour.SDS_ILLUMINANTS["D65"], shape)
    raw_white = np.sum(d55[np.newaxis, :] * raw_photon_bases, axis=1)
    white_balance = float(np.max(raw_white)) / raw_white
    photon_bases = raw_photon_bases * white_balance[:, np.newaxis]
    checker = colour.SDS_COLOURCHECKERS[payload["colourCheckerDataset"]]
    names = list(checker.keys())
    reflectances = np.asarray([align_sd(checker[name], shape) for name in names], dtype=float)
    camera_rows = np.asarray([project_reflectance(row, d55, photon_bases)
                              for row in reflectances], dtype=float)
    target_rows = np.asarray([project_reflectance(row, d65, cmfs)
                              for row in reflectances], dtype=float)
    held_out = set(payload["heldOutPatchIndicesZeroBased"])
    training = [index for index in range(len(names)) if index not in held_out]
    fitted_columns, _, rank, singular = np.linalg.lstsq(
        camera_rows[training], target_rows[training], rcond=None)
    matrix = fitted_columns.T
    predicted = camera_rows @ fitted_columns
    d65_xy = colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["D65"]
    delta_e = np.asarray(colour.delta_E(
        colour.XYZ_to_Lab(target_rows, illuminant=d65_xy),
        colour.XYZ_to_Lab(predicted, illuminant=d65_xy), method="CIE 2000"), dtype=float)
    weights = [[integrate_linear_samples(
        wavelengths, raw_photon_bases[channel],
        native["centerNanometers"] - native["widthNanometers"] / 2,
        native["centerNanometers"] + native["widthNanometers"] / 2)
                for native in payload["nativeBins"]] for channel in range(3)]
    result = {
        "schemaId": "camera-stage8c-colour-oracle-v1",
        "environment": {"python": platform.python_version(), "colour": colour.__version__,
                        "numpy": np.__version__},
        "configuration": {"trainingPatchIndicesZeroBased": training,
                          "heldOutPatchIndicesZeroBased": sorted(held_out)},
        "alignedData": {"wavelengthsNanometers": wavelengths.tolist(),
                        "quantumEfficiency": qe.tolist(),
                        "rawPhotonBases": raw_photon_bases.tolist(),
                        "photonCharacterizationBases": photon_bases.tolist()},
        "derived": {"photonNative15IntegralsMeter": weights,
                    "whiteBalanceMultipliers": white_balance.tolist(),
                    "sensorToXyzD65Matrix": matrix.tolist(),
                    "cameraPatchRows": camera_rows.tolist(),
                    "targetXyzRows": target_rows.tolist(),
                    "fitRank": int(rank), "fitSingularValues": singular.tolist(),
                    "fitXyzRmse": float(np.sqrt(np.mean((predicted-target_rows)**2))),
                    "heldOutMeanDeltaE2000": float(np.mean(delta_e[sorted(held_out)])),
                    "heldOutMaximumDeltaE2000": float(np.max(delta_e[sorted(held_out)]))}
    }
    json.dump(result, sys.stdout, separators=(",", ":"), allow_nan=False)


if __name__ == "__main__":
    main()
