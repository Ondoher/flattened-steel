"""Authenticate acquired ARM payloads and inventory their native NetCDF metadata."""

import hashlib
import json
from pathlib import Path
import re
import sys
import threading
import time

sys.dont_write_bytecode = True
from inventory import checked_path, write_json, utc, SOURCE_ROOT, REPO_ROOT, OUTPUT_ROOT
from netcdf import NetCDF


def digest(path):
    """Hash a checked input in bounded memory."""
    value = hashlib.sha256()
    with checked_path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def main():
    """Record real file headers and coordinates without accepting a scientific case."""
    runs = checked_path(OUTPUT_ROOT / "runs")
    sequence = -1
    for entry in runs.iterdir():
        checked_path(entry)
        match = re.fullmatch(r"(\d{5})-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)", entry.name)
        if not match or not entry.is_dir() or len(match[2]) > 16:
            raise ValueError("Malformed run entry")
        sequence = max(sequence, int(match[1]))
    if sequence >= 99999:
        raise ValueError("Run sequence exhausted")
    run = checked_path(runs / f"{sequence + 1:05d}-nc-inventory")
    run.mkdir()
    lock = threading.Lock()

    def event(phase, message, **extra):
        with lock, (run / "progress.jsonl").open("a", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps({"timestamp": utc(), "phase": phase, "message": message, **extra}) + "\n")
            stream.flush()

    stop = threading.Event()

    def heartbeat():
        while not stop.wait(25):
            event("inspect", "Authenticating or decoding acquired ARM inputs")

    event("start", "Inspecting actual ARM NetCDF files")
    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
    state = "accepted"
    started = time.monotonic()
    outputs, parents = [], []
    try:
        for source in ["inventory.py", "netcdf.py", "inspect_nc.py"]:
            with (run / source).open("xb") as stream:
                stream.write(checked_path(SOURCE_ROOT / source).read_bytes())
        for name in ["00008-arm-sonde", "00009-arm-optics"]:
            parent = checked_path(runs / name)
            seal_path = checked_path(parent / "sealed.json")
            seal = json.loads(seal_path.read_text())
            if seal["state"] != "accepted":
                raise ValueError("Acquisition parent did not accept its file integrity")
            for entry in seal["artifacts"]:
                path = checked_path(parent / entry["path"])
                path.relative_to(parent)
                if path.stat().st_size != entry["bytes"] or digest(path) != entry["sha256"]:
                    raise ValueError("Acquisition parent changed")
            parents.append({"run": name, "sealSha256": digest(seal_path)})
            for source in sorted((parent / "raw").iterdir()):
                source = checked_path(source)
                event("inspect", source.name)
                dataset = NetCDF(source)
                try:
                    coordinates = {}
                    for coordinate in ["base_time", "time_offset", "time", "wavelength", "wavelengths", "height", "range", "lat", "lon", "alt"]:
                        if coordinate in dataset.variables:
                            shape = dataset.variables[coordinate]["dimensions"]
                            if len(shape) <= 1 and (not shape or shape[0]["size"] <= 100000):
                                coordinates[coordinate] = dataset.read(coordinate)
                    record = {"sourceRun": name, "sourceFile": source.name, "sourceSha256": digest(source),
                        "globalAttributes": dataset.global_attributes, "dimensions": dataset.dimensions,
                        "variables": dataset.variables, "coordinates": coordinates,
                        "decoder": dataset.tool_identity(), "scientificCaseAccepted": False}
                finally:
                    dataset.close()
                artifact = source.name + ".json"
                write_json(run / artifact, record)
                outputs.append({"artifact": artifact, "sourceFile": source.name, "variables": len(record["variables"])})
                print(json.dumps(outputs[-1]), flush=True)
        write_json(run / "result.json", {"parents": parents, "files": outputs,
            "elapsedSeconds": time.monotonic() - started, "scientificCaseAccepted": False,
            "scope": "Authenticated NetCDF decoding and metadata, not clear-sky or uncertainty qualification"})
    except BaseException:
        state = "interrupted" if isinstance(sys.exc_info()[1], KeyboardInterrupt) else "failed"
        raise
    finally:
        stop.set()
        thread.join()
        event("terminal", "NetCDF inventory finalized", state=state)
        artifacts = [{"path": path.name, "bytes": path.stat().st_size, "sha256": digest(path)} for path in sorted(run.iterdir())]
        write_json(run / "sealed.json", {"state": state, "finishedAt": utc(),
            "scope": "NetCDF decoding evidence only", "artifacts": artifacts})
        print("Run: " + run.name, flush=True)


if __name__ == "__main__":
    main()
