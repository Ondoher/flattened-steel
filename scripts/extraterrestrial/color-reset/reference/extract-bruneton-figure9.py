#!/usr/bin/env python3
"""Losslessly extract the Figure 9 sunrise panels from the retained paper.

The program is intentionally a pure reader: it writes one deterministic JSON
document to stdout and never creates a file.  The caller owns any artifact
materialization inside an immutable color-reset run.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import sys
from typing import Any

from pypdf import PdfReader


SCHEMA_ID = "bruneton-figure9-sunrise-xobjects-v1"
EXPECTED_PDF_SHA256 = (
    "a1220d40bc0ed6fd35e8fe728365fb5b371a615051d505dcd611f61ff22dd5c5"
)
PDF_PAGE_INDEX = 10
PRINTED_PAGE = 11
WIDTH = 1024
HEIGHT = 576
MODE = "RGB"
EXPECTED_RESULT_SHA256 = (
    "6f4359eebd6eaad3d418b0598f1359d56f3b2e42b2721908352f12891f98ed7d"
)

PANELS = (
    (
        "Im195",
        "nishita93",
        "Nishita93",
        "4bf9b52a580c4b57ed6b8f3d2f3e82586e47b5396ec9007f02cf8cf3f29e9e03",
    ),
    (
        "Im196",
        "nishita96",
        "Nishita96",
        "094596d2387dd5a7a5c6ca5051bf2271175868b1210c2a8c87f2372e19e3c582",
    ),
    (
        "Im197",
        "preetham",
        "Preetham",
        "4dcb62d011bfed95ea157256062d636094f78592c647eb23fee26435cdffb146",
    ),
    (
        "Im198",
        "oneal",
        "O'Neal",
        "f1e1eb9fa45fbe51bcf106c12d8cd0a2eab78398c67af9a7fd13a00659a709ba",
    ),
    (
        "Im199",
        "haber",
        "Haber",
        "9af05f47dd94feb1d57e4783e4245d1eeba87b42c7ba86f7073c405427264f08",
    ),
    (
        "Im200",
        "bruneton",
        "Bruneton",
        "e3ca229bdad0f9252ddf22781cc8e1bdbbe9669bd85274a13ffafa4a9196738f",
    ),
    (
        "Im201",
        "elek",
        "Elek",
        "51d7706dfaae8f5a20b1ddf3c3d9df390a21e32af43e834bb170a6a4ad4e78b4",
    ),
    (
        "Im202",
        "hosek",
        "Hosek",
        "74aa2a073b406953544c5f40ff5570f30250dc13a52bab3b784ec22380b01bb9",
    ),
)


def sha256_file(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    byte_length = 0
    with path.open("rb") as stream:
        while True:
            chunk = stream.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
            byte_length += len(chunk)
    return digest.hexdigest(), byte_length


def fail(message: str) -> None:
    raise ValueError(message)


def extract(pdf_path: Path) -> dict[str, Any]:
    if not pdf_path.is_file():
        fail(f"PDF input is not a regular file: {pdf_path}")

    pdf_sha256, pdf_byte_length = sha256_file(pdf_path)
    if pdf_sha256 != EXPECTED_PDF_SHA256:
        fail(
            "Retained PDF identity mismatch: "
            f"expected {EXPECTED_PDF_SHA256}, received {pdf_sha256}"
        )

    reader = PdfReader(str(pdf_path))
    if len(reader.pages) <= PDF_PAGE_INDEX:
        fail(
            f"PDF has {len(reader.pages)} pages; page index {PDF_PAGE_INDEX} is absent"
        )
    page = reader.pages[PDF_PAGE_INDEX]
    resources = page.get("/Resources")
    if resources is None or resources.get("/XObject") is None:
        fail(f"Page index {PDF_PAGE_INDEX} has no image XObject resources")
    xobjects = resources["/XObject"]

    image_by_object: dict[str, Any] = {}
    for image_file in page.images:
        object_name = Path(image_file.name).stem
        if object_name in image_by_object:
            fail(f"Duplicate extracted image object name: {object_name}")
        image_by_object[object_name] = image_file

    combined_digest = hashlib.sha256()
    total_byte_length = 0
    panel_records: list[dict[str, Any]] = []
    for object_name, model_id, model_label, expected_sha256 in PANELS:
        resource_name = f"/{object_name}"
        if resource_name not in xobjects:
            fail(f"Required page XObject {resource_name} is absent")
        xobject = xobjects[resource_name].get_object()
        if str(xobject.get("/Subtype")) != "/Image":
            fail(f"{resource_name} is not an image XObject")
        if int(xobject.get("/Width", -1)) != WIDTH:
            fail(f"{resource_name} width is not {WIDTH}")
        if int(xobject.get("/Height", -1)) != HEIGHT:
            fail(f"{resource_name} height is not {HEIGHT}")
        if str(xobject.get("/ColorSpace")) != "/DeviceRGB":
            fail(f"{resource_name} color space is not /DeviceRGB")
        if int(xobject.get("/BitsPerComponent", -1)) != 8:
            fail(f"{resource_name} is not 8 bits per component")

        if object_name not in image_by_object:
            fail(f"pypdf did not expose required image {object_name}")
        image_file = image_by_object[object_name]
        if image_file.name != f"{object_name}.png":
            fail(
                f"{object_name} did not extract as the expected PNG name: "
                f"{image_file.name}"
            )
        if image_file.image.size != (WIDTH, HEIGHT):
            fail(
                f"{object_name} decoded size is {image_file.image.size}, "
                f"not {(WIDTH, HEIGHT)}"
            )
        if image_file.image.mode != MODE:
            fail(f"{object_name} decoded mode is {image_file.image.mode}, not {MODE}")

        data = bytes(image_file.data)
        result_sha256 = hashlib.sha256(data).hexdigest()
        if result_sha256 != expected_sha256:
            fail(
                f"{object_name} extracted SHA-256 mismatch: expected "
                f"{expected_sha256}, received {result_sha256}"
            )
        combined_digest.update(data)
        total_byte_length += len(data)
        panel_records.append(
            {
                "base64": base64.b64encode(data).decode("ascii"),
                "bitDepthPerComponent": 8,
                "byteLength": len(data),
                "colorMode": MODE,
                "fileName": image_file.name,
                "heightPixels": HEIGHT,
                "mimeType": "image/png",
                "modelId": model_id,
                "modelLabel": model_label,
                "objectName": object_name,
                "pdfResourceName": resource_name,
                "sha256": result_sha256,
                "widthPixels": WIDTH,
                "xObjectColorSpace": "/DeviceRGB",
                "xObjectFilter": str(xobject.get("/Filter")),
            }
        )

    result_sha256 = combined_digest.hexdigest()
    if result_sha256 != EXPECTED_RESULT_SHA256:
        fail(
            "Combined extraction SHA-256 mismatch: expected "
            f"{EXPECTED_RESULT_SHA256}, received {result_sha256}"
        )

    return {
        "extraction": {
            "method": "pypdf PageObject.images lossless PNG extraction",
            "pypdfVersion": importlib.metadata.version("pypdf"),
            "pythonImplementation": platform.python_implementation(),
            "pythonVersion": platform.python_version(),
            "tool": "pypdf",
            "transformations": [],
            "writesFiles": False,
        },
        "panels": panel_records,
        "resultIdentity": {
            "algorithm": "SHA-256",
            "byteLength": total_byte_length,
            "objectOrder": [panel[0] for panel in PANELS],
            "operation": "SHA-256 of the exact extracted PNG byte streams concatenated in objectOrder",
            "sha256": result_sha256,
        },
        "schemaId": SCHEMA_ID,
        "source": {
            "figure": 9,
            "inputBasename": pdf_path.name,
            "pdfByteLength": pdf_byte_length,
            "pdfPageIndex": PDF_PAGE_INDEX,
            "pdfSha256": pdf_sha256,
            "printedPage": PRINTED_PAGE,
            "row": "sunrise",
            "title": "A Qualitative and Quantitative Evaluation of 8 Clear Sky Models",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Extract Bruneton paper Figure 9 sunrise XObjects Im195 through "
            "Im202 as one stdout JSON document"
        )
    )
    parser.add_argument("pdf_path", type=Path, help="path to the retained paper PDF")
    arguments = parser.parse_args()
    try:
        result = extract(arguments.pdf_path)
    except Exception as error:  # The CLI must fail closed without partial JSON.
        print(f"extract-bruneton-figure9.py: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=True, separators=(",", ":"), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
