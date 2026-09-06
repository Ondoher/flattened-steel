#!/usr/bin/env python3
"""Independent pinned-Python evaluator for CameraColorModel T1 response gates."""

import json
import platform
import sys

import colour
import numpy as np


def normalized(values):
    total = float(np.sum(values))
    return (values / total).tolist() if total > 0 else [0.0, 0.0, 0.0]


def main():
    payload = json.load(sys.stdin)
    weights = np.asarray(payload["matrix3x15"], dtype=np.float64)
    rows = []
    for item in payload["cases"]:
        spectrum = np.asarray(item["spectrum"], dtype=np.float64)
        response = weights @ spectrum
        rows.append({
            "id": item["id"],
            "scale": item["scale"],
            "sensorPhotonIntegrals": response.tolist(),
            "normalizedSensorResponse": normalized(response),
        })
    json.dump({
        "schemaId": "camera-color-t1-oracle-v1",
        "environment": {
            "python": platform.python_version(),
            "colour": colour.__version__,
            "numpy": np.__version__,
        },
        "rows": rows,
    }, sys.stdout, separators=(",", ":"), allow_nan=False)


if __name__ == "__main__":
    main()
