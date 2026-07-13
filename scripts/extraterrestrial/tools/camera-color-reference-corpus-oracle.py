#!/usr/bin/env python3
"""Generate pinned Colour ColorChecker/illuminant native-15 reference spectra."""
import json
import platform
import sys
import colour
import numpy as np

def aligned(sd, shape):
    return np.asarray(sd.copy().align(shape).values, dtype=np.float64)

def bin_average(wavelengths, values, center, width):
    lower, upper = center - width / 2, center + width / 2
    inside = wavelengths[(wavelengths > lower) & (wavelengths < upper)]
    points = np.concatenate(([lower], inside, [upper]))
    return float(np.trapezoid(np.interp(points, wavelengths, values), points) / width)

def main():
    payload = json.load(sys.stdin)
    shape = colour.SpectralShape(360, 830, 1)
    wavelengths = np.arange(360, 831, dtype=np.float64)
    checker = colour.SDS_COLOURCHECKERS["ColorChecker N Ohta"]
    held = set(payload["heldOutPatchIndicesZeroBased"])
    records = []
    for illuminant_name in ("A", "D55", "D65", "D75"):
        illuminant = aligned(colour.SDS_ILLUMINANTS[illuminant_name], shape)
        illuminant /= float(np.max(illuminant))
        for index, (name, reflectance_sd) in enumerate(checker.items()):
            relative = aligned(reflectance_sd, shape) * illuminant
            spectrum = [bin_average(wavelengths, relative, row["centerNanometers"], row["widthNanometers"]) for row in payload["nativeBins"]]
            records.append({"id": f"colorchecker/{illuminant_name}/{index:02d}", "patchIndex": index, "patchName": name, "illuminant": illuminant_name, "partition": "held-out" if index in held else "training", "relativeNative15": spectrum})
    json.dump({"schemaId":"camera-color-reference-corpus-colour-v1","environment":{"python":platform.python_version(),"colour":colour.__version__,"numpy":np.__version__},"normalization":"illuminant peak normalized to one; reflectance product remains relative and receives an explicit authored radiance scale before CameraColorModel","records":records},sys.stdout,separators=(",",":"),allow_nan=False)

if __name__ == "__main__": main()
