"""Screen a fixed day of actual spectra/cloud profiles before model comparison."""

import bisect
import json
import math
from pathlib import Path
import statistics
import sys

sys.dont_write_bytecode = True
from evidence import Run
from netcdf import NetCDF


def nearest(values, target):
    """Return the closest sorted coordinate index, including both endpoints."""
    index = bisect.bisect_left(values, target)
    candidates = [i for i in [index - 1, index] if 0 <= i < len(values)]
    return min(candidates, key=lambda i: abs(values[i] - target))


def main():
    """Retain fixed-grid screening data; no spectrum is fitted or scored here."""
    with Run("day-screen", ["netcdf.py", "screen.py"], "M1 measured-day quality screening; no model score") as run:
        spectra_parent = run.parent("00009-arm-optics")
        run.parent("00008-arm-sonde")
        run.parent("00013-spectral-quality")
        spectra = NetCDF(spectra_parent / "raw/sgpsaszevisC1.a1.20230822.000001.nc")
        lidar = NetCDF(spectra_parent / "raw/sgprlproffex1thorC1.c0.20230822.000000.nc")
        try:
            times, wavelengths = spectra.read("time"), spectra.read("wavelength")
            response = spectra.read("responsivity")
            geometry = {name: spectra.read(name) for name in ["solar_zenith", "solar_azimuth", "integration_time", "number_of_scans", "collector_x_tilt", "collector_y_tilt", "inner_band_angle"]}
            lidar_times, heights = lidar.read("time"), lidar.read("height_high")
            masks, qc = lidar.read("feature_mask"), lidar.read("qc_profile")
            nh = len(heights)
            visible = [i for i, wavelength in enumerate(wavelengths) if 400 <= wavelength <= 800]
            bands = {str(center): [i for i in visible if abs(wavelengths[i] - center) <= 2] for center in [440, 550, 675, 780]}
            rows, selected = [], []
            for seconds in range(13 * 3600, 24 * 3600, 300):
                index = nearest(times, seconds)
                if abs(times[index] - seconds) > 120:
                    continue
                profile_index = nearest(lidar_times, seconds)
                mask = masks[profile_index * nh:(profile_index + 1) * nh]
                clouds = sum(1 for flag in mask if int(flag) & (4 | 8))
                spectrum = spectra.read("zenith_radiance", [index, 0], [1, len(wavelengths)])
                counts = [spectrum[i] * response[i] * geometry["integration_time"][index] for i in visible
                          if spectrum[i] >= 0 and response[i] > 0]
                record = {"secondsUtc": times[index], "spectrumIndex": index,
                    "solarZenithDegrees": geometry["solar_zenith"][index],
                    "solarAzimuthDegrees": geometry["solar_azimuth"][index],
                    "lidarSecondsUtc": lidar_times[profile_index], "lidarQc": qc[profile_index],
                    "cloudOrRainBins": clouds,
                    "radianceBandsWattsPerSquareMeterPerSteradianPerMicrometer": {band: statistics.mean(spectrum[i] for i in indices) for band, indices in bands.items()},
                    "maximumReconstructedDarkSubtractedCounts": max(counts) if counts else None,
                    "validVisibleFraction": sum(spectrum[i] >= 0 for i in visible) / len(visible),
                    **{name: values[index] for name, values in geometry.items() if name not in ["solar_zenith", "solar_azimuth"]}}
                rows.append(record)
                if seconds in [15 * 3600, 18 * 3600, 22 * 3600, 23 * 3600]:
                    selected.append({"secondsUtc": times[index], "wavelengthNanometers": wavelengths,
                                     "radianceWattsPerSquareMeterPerSteradianPerMicrometer": spectrum})
            run.json("screen.json", {"grid": "nearest measured spectrum every5minutes from13:00 to23:55UTC, maximum120second mismatch",
                "radiometricConversion": "Native W/(m2 um sr); numerically equal to mW/(m2 nm sr)",
                "saturationProxy": "radiance * responsivity * integrationTime; dark-subtracted estimate, not raw-count saturation proof",
                "rows": rows, "spectra": selected, "scientificCaseAccepted": False})
            clean = [row for row in rows if row["lidarQc"] == 0 and row["cloudOrRainBins"] == 0]
            run.json("result.json", {"sampledSpectra": len(rows), "lidarCloudFreeSamples": len(clean),
                "nativeWavelengthRangeNanometers": [min(wavelengths), max(wavelengths)],
                "reconstructedCountsRange": [min(row["maximumReconstructedDarkSubtractedCounts"] for row in rows), max(row["maximumReconstructedDarkSubtractedCounts"] for row in rows)],
                "scientificCaseAccepted": False})
            for row in rows:
                if row["secondsUtc"] % 3600 < 120 or 22 * 3600 <= row["secondsUtc"] <= 23.6 * 3600:
                    print(json.dumps(row), flush=True)
        finally:
            spectra.close()
            lidar.close()


if __name__ == "__main__":
    main()
