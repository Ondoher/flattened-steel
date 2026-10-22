"""Read ARM NetCDF through the existing Linux libnetcdf, without new packages.

The native library owns file-format decoding. This adapter exposes metadata and
explicit numeric hyperslabs; it does not implement scattering or retrievals.
"""

import ctypes as c
import ctypes.util
import hashlib
import math
from pathlib import Path
import subprocess


class NetCDF:
    """Read one checked dataset using the installed NetCDF C API."""

    def __init__(self, path):
        self.path = Path(path)
        name = ctypes.util.find_library("netcdf")
        if not name:
            raise RuntimeError("An existing NetCDF shared library is required")
        self.lib = c.CDLL(name)
        intp = c.POINTER(c.c_int)
        sizep = c.POINTER(c.c_size_t)
        charp = c.POINTER(c.c_char)
        signatures = {
            "nc_open": ([c.c_char_p, c.c_int, intp], c.c_int),
            "nc_close": ([c.c_int], c.c_int),
            "nc_inq": ([c.c_int, intp, intp, intp, intp], c.c_int),
            "nc_inq_dim": ([c.c_int, c.c_int, charp, sizep], c.c_int),
            "nc_inq_var": ([c.c_int, c.c_int, charp, intp, intp, intp, intp], c.c_int),
            "nc_inq_attname": ([c.c_int, c.c_int, c.c_int, charp], c.c_int),
            "nc_inq_att": ([c.c_int, c.c_int, c.c_char_p, intp, sizep], c.c_int),
            "nc_get_att_text": ([c.c_int, c.c_int, c.c_char_p, charp], c.c_int),
            "nc_get_att_double": ([c.c_int, c.c_int, c.c_char_p, c.POINTER(c.c_double)], c.c_int),
            "nc_get_vara_double": ([c.c_int, c.c_int, sizep, sizep, c.POINTER(c.c_double)], c.c_int),
            "nc_strerror": ([c.c_int], c.c_char_p),
            "nc_inq_libvers": ([], c.c_char_p),
        }
        for function, (args, result) in signatures.items():
            method = getattr(self.lib, function)
            method.argtypes, method.restype = args, result
        handle = c.c_int()
        self.check(self.lib.nc_open(str(self.path).encode(), 0, c.byref(handle)))
        self.handle = handle.value
        ndims, nvars, natts, unlimited = (c.c_int() for _ in range(4))
        self.check(self.lib.nc_inq(self.handle, c.byref(ndims), c.byref(nvars), c.byref(natts), c.byref(unlimited)))
        self.dimensions = {}
        for index in range(ndims.value):
            name, length = c.create_string_buffer(257), c.c_size_t()
            self.check(self.lib.nc_inq_dim(self.handle, index, name, c.byref(length)))
            self.dimensions[index] = {"name": name.value.decode(), "size": length.value}
        self.variables = {}
        for index in range(nvars.value):
            name, kind, count, attributes = c.create_string_buffer(257), c.c_int(), c.c_int(), c.c_int()
            dimensions = (c.c_int * max(1, ndims.value))()
            self.check(self.lib.nc_inq_var(self.handle, index, name, c.byref(kind), c.byref(count), dimensions, c.byref(attributes)))
            self.variables[name.value.decode()] = {"id": index, "type": kind.value,
                "dimensions": [self.dimensions[dimensions[i]] for i in range(count.value)],
                "attributes": self.attributes(index, attributes.value)}
        self.global_attributes = self.attributes(-1, natts.value)

    def check(self, code):
        """Raise a decoded native-library failure without discarding source data."""
        if code:
            raise RuntimeError(self.lib.nc_strerror(code).decode())

    def attributes(self, variable, count):
        """Read bounded scalar/vector/text metadata with exact names and types."""
        result = {}
        for index in range(count):
            name = c.create_string_buffer(257)
            self.check(self.lib.nc_inq_attname(self.handle, variable, index, name))
            kind, length = c.c_int(), c.c_size_t()
            self.check(self.lib.nc_inq_att(self.handle, variable, name.value, c.byref(kind), c.byref(length)))
            if length.value > 65536:
                raise ValueError("Unexpectedly large metadata attribute")
            if kind.value == 2:
                text = c.create_string_buffer(length.value + 1)
                self.check(self.lib.nc_get_att_text(self.handle, variable, name.value, text))
                value = text.raw[:length.value].decode("utf-8", "replace")
            elif kind.value in [1, 3, 4, 5, 6, 7, 8, 9, 10, 11]:
                values = (c.c_double * max(1, length.value))()
                self.check(self.lib.nc_get_att_double(self.handle, variable, name.value, values))
                value = [values[i] if math.isfinite(values[i]) else str(values[i]) for i in range(length.value)]
                value = value[0] if len(value) == 1 else value
            else:
                value = {"unsupportedAttributeType": kind.value, "length": length.value}
            result[name.value.decode()] = value
        return result

    def read(self, name, start=None, count=None):
        """Read an explicit bounded numeric slice, retaining fill values for caller masking."""
        variable = self.variables[name]
        shape = [dimension["size"] for dimension in variable["dimensions"]]
        start = start if start is not None else [0] * len(shape)
        count = count if count is not None else shape
        if len(start) != len(shape) or len(count) != len(shape):
            raise ValueError("Hyperslab rank differs")
        if any(begin < 0 or length < 0 or begin + length > size for begin, length, size in zip(start, count, shape)):
            raise ValueError("Hyperslab escapes variable")
        size = math.prod(count)
        if size > 2000000:
            raise ValueError("Read a smaller explicit slab")
        values = (c.c_double * max(1, size))()
        begin = (c.c_size_t * max(1, len(start)))(*start)
        lengths = (c.c_size_t * max(1, len(count)))(*count)
        self.check(self.lib.nc_get_vara_double(self.handle, variable["id"], begin, lengths, values))
        return [values[i] for i in range(size)]

    def close(self):
        """Release only this dataset handle."""
        self.check(self.lib.nc_close(self.handle))

    def tool_identity(self):
        """Record exact installed decoder identity, without changing its installation."""
        listing = subprocess.check_output(["ldconfig", "-p"], text=True)
        matches = [line.split("=>", 1)[1].strip() for line in listing.splitlines()
                   if "libnetcdf.so.19 " in line and "=>" in line]
        actual = Path(matches[0]).resolve(strict=True) if matches else None
        return {"version": self.lib.nc_inq_libvers().decode(), "library": str(actual),
                "sha256": hashlib.sha256(actual.read_bytes()).hexdigest() if actual else None}
