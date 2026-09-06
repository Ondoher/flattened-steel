"""Apply the pinned OCIO 2.4.2 ACES 2 built-ins to raw RGBA float32 data."""

from array import array
import ctypes
import json
import os
import sys

import PyOpenColorIO as ocio
import PyOpenColorIO.PyOpenColorIO as ocio_extension


FIXED_SCENE_SCALE = 0.00029282576866764276
RENDERING_STYLE = "ACES-OUTPUT - ACES2065-1_to_CIE-XYZ-D65 - SDR-100nit-REC709_2.0"
DISPLAY_STYLE = "DISPLAY - CIE-XYZ-D65_to_sRGB"
AP0_TO_XYZ_STYLE = "UTILITY - ACES-AP0_to_CIE-XYZ-D65_BFD"
AP1_TO_AP0_STYLE = "ACEScg_to_ACES2065-1"

# IEC/ITU Rec.709-D65 linear RGB to CIE XYZ (Y=1).  The following inverse
# ACES-AP0 utility built-in owns the Bradford D65-to-ACES-white adaptation.
REC709_TO_XYZ_D65 = (
    0.4123907992659595,
    0.35758433938387796,
    0.1804807884018343,
    0.0,
    0.21263900587151036,
    0.7151686787677559,
    0.07219231536073371,
    0.0,
    0.01933081871559185,
    0.11919477979462599,
    0.9505321522496607,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
)


def builtin(style, direction=ocio.TRANSFORM_DIR_FORWARD):
    transform = ocio.BuiltinTransform()
    transform.setStyle(style)
    transform.setDirection(direction)
    return transform


def make_processor(mode):
    group = ocio.GroupTransform()
    matrix = list(REC709_TO_XYZ_D65)
    for row in range(3):
        for column in range(3):
            matrix[row * 4 + column] *= FIXED_SCENE_SCALE
    input_matrix = ocio.MatrixTransform()
    input_matrix.setMatrix(matrix)
    group.appendTransform(input_matrix)
    group.appendTransform(builtin(AP0_TO_XYZ_STYLE, ocio.TRANSFORM_DIR_INVERSE))
    if mode == "ap1":
        group.appendTransform(builtin(AP1_TO_AP0_STYLE, ocio.TRANSFORM_DIR_INVERSE))
    elif mode == "final":
        group.appendTransform(builtin(RENDERING_STYLE))
        group.appendTransform(builtin(DISPLAY_STYLE))
    else:
        raise ValueError("mode must be final or ap1")
    return ocio.Config.CreateRaw().getProcessor(group).getDefaultCPUProcessor()


def resolved_import_artifacts():
    artifacts = {}
    for module in sys.modules.values():
        for role, attribute in (("module", "__file__"), ("cache", "__cached__")):
            module_path = getattr(module, attribute, None)
            if not module_path:
                continue
            resolved = os.path.realpath(module_path)
            key = os.path.normcase(resolved)
            artifact = artifacts.setdefault(
                key,
                {"path": resolved, "roles": set(), "exists": os.path.isfile(resolved)},
            )
            artifact["roles"].add(role)
    return [
        {
            "path": artifact["path"],
            "roles": sorted(artifact["roles"]),
            "exists": artifact["exists"],
        }
        for _, artifact in sorted(artifacts.items())
    ]


def loaded_ocio_dll_path():
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.GetModuleHandleW.argtypes = [ctypes.c_wchar_p]
    kernel32.GetModuleHandleW.restype = ctypes.c_void_p
    kernel32.GetModuleFileNameW.argtypes = [
        ctypes.c_void_p,
        ctypes.c_wchar_p,
        ctypes.c_uint32,
    ]
    kernel32.GetModuleFileNameW.restype = ctypes.c_uint32
    module = kernel32.GetModuleHandleW("OpenColorIO_2_4.dll")
    if not module:
        raise OSError(ctypes.get_last_error(), "OpenColorIO_2_4.dll is not loaded")
    buffer = ctypes.create_unicode_buffer(32768)
    length = kernel32.GetModuleFileNameW(module, buffer, len(buffer))
    if length == 0 or length >= len(buffer):
        raise OSError(ctypes.get_last_error(), "Cannot resolve loaded OpenColorIO DLL")
    return os.path.realpath(buffer.value)


def main(argv):
    if len(argv) not in (5, 6):
        raise ValueError(
            "usage: aces-ocio-cross-check.py <input.raw> <width> <height> "
            "<output.raw> [final|ap1]"
        )
    input_path, width_text, height_text, output_path = argv[1:5]
    mode = argv[5] if len(argv) == 6 else "final"
    width = int(width_text)
    height = int(height_text)
    if width < 1 or height < 1:
        raise ValueError("dimensions must be positive")
    expected_bytes = width * height * 4 * 4
    if os.path.getsize(input_path) != expected_bytes:
        raise ValueError("input raw byte count is invalid")
    pixels = array("f")
    with open(input_path, "rb") as stream:
        pixels.fromfile(stream, width * height * 4)
    processor = make_processor(mode)
    for offset in range(0, len(pixels), 4):
        transformed = processor.applyRGB(
            [pixels[offset], pixels[offset + 1], pixels[offset + 2]]
        )
        pixels[offset] = transformed[0]
        pixels[offset + 1] = transformed[1]
        pixels[offset + 2] = transformed[2]
    with open(output_path, "xb") as stream:
        pixels.tofile(stream)
    print(json.dumps({
        "schemaId": "aces-ocio-cross-check-v1",
        "ocioVersion": ocio.__version__,
        "pythonExecutable": os.path.realpath(sys.executable),
        "pythonVersion": sys.version,
        "pythonFlags": {
            "isolated": sys.flags.isolated,
            "noSite": sys.flags.no_site,
            "noUserSite": sys.flags.no_user_site,
            "dontWriteBytecode": sys.flags.dont_write_bytecode,
        },
        "pythonImportArtifacts": resolved_import_artifacts(),
        "pythonPath": [
            os.path.realpath(entry) if entry else entry for entry in sys.path
        ],
        "modulePath": os.path.realpath(ocio.__file__),
        "extensionPath": os.path.realpath(ocio_extension.__file__),
        "loadedOcioDllPath": loaded_ocio_dll_path(),
        "width": width,
        "height": height,
        "mode": mode,
        "inputConversion": "linear Rec.709/D65 * fixed K -> XYZ/D65 -> inverse AP0/XYZ Bradford utility",
        "renderingStyle": RENDERING_STYLE,
        "displayStyle": DISPLAY_STYLE,
        "ap1Style": AP1_TO_AP0_STYLE,
    }, sort_keys=True))


if __name__ == "__main__":
    main(sys.argv)
