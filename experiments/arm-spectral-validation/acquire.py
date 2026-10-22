"""Acquire selected ARM files with credentials kept in process memory only.

The token is read with a non-echoing console prompt. URLs containing credentials,
raw authentication failures and account identifiers are never persisted. Every
invocation allocates a new run and preserves successful partial acquisitions.
"""

import argparse
import getpass
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

sys.dont_write_bytecode = True
from inventory import checked_path, write_json, utc, SOURCE_ROOT, REPO_ROOT, OUTPUT_ROOT


class RestrictedRedirect(urllib.request.HTTPRedirectHandler):
    """Allow provider-local redirects without forwarding credentials elsewhere."""

    def redirect_request(self, request, response, code, message, headers, new_url):
        parsed = urllib.parse.urlsplit(new_url)
        if parsed.scheme != "https" or parsed.hostname != "adc.arm.gov":
            raise ValueError("Download redirect left the selected ARM provider")
        return super().redirect_request(request, response, code, message, headers, new_url)


def main():
    """Download one explicit catalog subset, retaining no secret in its evidence."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--username", required=True)
    parser.add_argument("--role", choices=["sonde", "sasze", "lidar", "twst", "optics", "all"], default="sonde")
    args = parser.parse_args()
    if not args.username.strip() or any(character in args.username for character in ":\r\n\0"):
        raise ValueError("Invalid ARM username")
    token = getpass.getpass("ARM access token (not echoed or retained): ").strip()
    if not token or any(character in token for character in ":\r\n\0"):
        raise ValueError("Invalid ARM access token")
    authorization = args.username + ":" + token
    selected = checked_path(OUTPUT_ROOT / "runs/00007-m1-report/result.json")
    seal_path = checked_path(selected.parent / "sealed.json")
    seal = json.loads(seal_path.read_text(encoding="utf-8"))
    for entry in seal["artifacts"]:
        path = checked_path(selected.parent / entry["path"])
        path.relative_to(selected.parent)
        if path.stat().st_size != entry["bytes"] or hashlib.sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
            raise ValueError("Candidate parent identity changed")
    selection = json.loads(selected.read_text(encoding="utf-8"))
    roles = ["sonde", "sasze", "lidar"] if args.role == "all" else (["sasze", "lidar"] if args.role == "optics" else [args.role])
    files = [entry for entry in selection["candidate"]["files"] if entry["role"] in roles]
    for entry in files:
        if not re.fullmatch(r"sgp[a-zA-Z0-9]+\.[a-z0-9]+\.20230822\.\d{6}\.(?:nc|cdf|raw\.nc\.tar)", entry["file_name"]):
            raise ValueError("Unexpected candidate filename")
    runs = checked_path(OUTPUT_ROOT / "runs")
    sequences = []
    for path in runs.iterdir():
        checked_path(path)
        match = re.fullmatch(r"(\d{5})-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)", path.name)
        if not match or len(match[2]) > 16 or not path.is_dir():
            raise ValueError("Malformed run directory")
        sequences.append(int(match[1]))
    sequence = max(sequences, default=-1) + 1
    if sequence > 99999:
        raise ValueError("Run sequence exhausted")
    run = checked_path(runs / f"{sequence:05d}-arm-{args.role}")
    run.mkdir()
    raw = run / "raw"
    raw.mkdir()
    for source in [checked_path(Path(__file__)), checked_path(SOURCE_ROOT / "inventory.py")]:
        with (run / source.name).open("xb") as stream:
            stream.write(source.read_bytes())
    write_json(run / "request.json", {
        "purpose": "M1 acquisition only; measurements remain scientifically unqualified",
        "parentRun": selected.parent.name,
        "parentSealSha256": hashlib.sha256(seal_path.read_bytes()).hexdigest(),
        "authentication": "ARM account and token supplied in process memory; not persisted",
        "endpoint": "https://adc.arm.gov/armlive/saveData", "files": files,
    })
    lock = threading.Lock()

    def event(phase, message, **extra):
        with lock, (run / "progress.jsonl").open("a", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps({"timestamp": utc(), "phase": phase, "message": message, **extra}) + "\n")
            stream.flush()

    stop = threading.Event()

    def heartbeat():
        while not stop.wait(25):
            event("download", "ARM acquisition remains active; credentials omitted")

    event("start", "Acquiring authenticated ARM files", completed=0, total=len(files))
    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
    opener = urllib.request.build_opener(RestrictedRedirect())
    outcomes = []
    state = "accepted"
    started = time.monotonic()
    try:
        for index, entry in enumerate(files):
            filename = entry["file_name"]
            event("download", filename, completed=index, total=len(files))
            url = "https://adc.arm.gov/armlive/saveData?" + urllib.parse.urlencode({"user": authorization, "file": filename})
            record = {"file": filename, "acquiredAt": utc(), "endpoint": "https://adc.arm.gov/armlive/saveData"}
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "ARM-spectral-validation/0.1"})
                with opener.open(request, timeout=45) as response:
                    if response.status != 200:
                        raise ValueError("ARM did not return a successful data response")
                    prefix = response.read(512)
                    # ARM files may be classic NetCDF or HDF5. An HTML/JSON login/error is not data.
                    is_tar = prefix[257:262] == b"ustar" and filename.endswith(".tar")
                    if not (prefix[:3] == b"CDF" or prefix[:8] == b"\x89HDF\r\n\x1a\n" or is_tar):
                        raise ValueError("ARM response is not a recognized NetCDF/HDF5 payload")
                    destination = checked_path(raw / filename)
                    count = len(prefix)
                    digest = hashlib.sha256(prefix)
                    with destination.open("xb") as output:
                        output.write(prefix)
                        while True:
                            block = response.read(1024 * 1024)
                            if not block:
                                break
                            count += len(block)
                            if count > entry["file_size"] + 1024 * 1024:
                                raise ValueError("Response exceeds catalog-size allowance")
                            digest.update(block)
                            output.write(block)
                    if count != entry["file_size"]:
                        raise ValueError("Payload size differs from selected catalog identity")
                    record.update({"status": "downloaded", "bytes": count, "sha256": digest.hexdigest(),
                                   "signature": "tar" if is_tar else ("classic-netcdf" if prefix[:3] == b"CDF" else "hdf5"),
                                   "qualityQualified": False})
            except urllib.error.HTTPError as error:
                record.update({"status": "failed", "httpStatus": error.code,
                    "error": "ARM rejected the authenticated request; response URL/body not retained"})
                state = "failed"
            except Exception as error:
                # The error type is useful and cannot contain the secret-bearing request URL.
                message = str(error).replace(authorization, "[redacted]").replace(token, "[redacted]").replace(args.username, "[account]")
                record.update({"status": "failed", "errorType": type(error).__name__, "error": message[:200]})
                state = "failed"
            outcomes.append(record)
            print(json.dumps(record), flush=True)
            if record["status"] == "failed":
                break
        write_json(run / "result.json", {"state": state, "files": outcomes,
            "elapsedSeconds": time.monotonic() - started, "scientificCaseAccepted": False})
    except BaseException:
        state = "interrupted" if isinstance(sys.exc_info()[1], KeyboardInterrupt) else "failed"
        raise
    finally:
        authorization = ""
        token = ""
        stop.set()
        thread.join()
        event("terminal", "Authenticated acquisition finalized", state=state, completed=len(outcomes), total=len(files))
        artifacts = []
        for path in sorted(run.rglob("*")):
            checked_path(path)
            if path.is_file():
                digest = hashlib.sha256()
                with path.open("rb") as stream:
                    for block in iter(lambda: stream.read(1024 * 1024), b""):
                        digest.update(block)
                artifacts.append({"path": path.relative_to(run).as_posix(), "bytes": path.stat().st_size,
                                  "sha256": digest.hexdigest()})
        write_json(run / "sealed.json", {"state": state, "scope": "acquisition integrity only; no scientific qualification",
            "finishedAt": utc(), "artifacts": artifacts})
        print("Run: " + str(run), flush=True)


if __name__ == "__main__":
    main()
