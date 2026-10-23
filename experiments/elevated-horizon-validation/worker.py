"""Bounded Linux execution worker for the repository's external libRadtran tool.

The host copies this file and every case input into a fresh run. External solver
and data files are read-only. Successful execution is not scientific validation.
"""

import hashlib
import json
import math
import os
from pathlib import Path
import platform
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone


def timestamp():
    """Return an ISO UTC execution timestamp."""
    return datetime.now(timezone.utc).isoformat()


def write_json(filename, value):
    """Create one artifact exclusively; existing artifacts cause run failure."""
    with filename.open("x", encoding="utf-8") as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write("\n")


def digest_file(filename):
    """Return an exact file SHA-256; inaccessible files fail the current run."""
    digest = hashlib.sha256()
    with filename.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def unlinked_path(filename):
    """Resolve an existing path without links; linked/missing paths fail this run."""
    for ancestor in [filename, *filename.parents]:
        if ancestor.is_symlink():
            raise ValueError(f"Linked path is unsupported: {ancestor}")
    return filename.resolve(strict=True)


def data_identity(directory):
    """Fingerprint all installed data files; links and nonregular files fail the run."""
    root = unlinked_path(directory)
    entries = []
    for parent, directories, filenames in os.walk(root, followlinks=False):
        directories.sort()
        for name in directories:
            unlinked_path(Path(parent) / name)
        for name in sorted(filenames):
            filename = unlinked_path(Path(parent) / name)
            if not filename.is_file():
                raise ValueError(f"Nonregular data file: {filename}")
            entries.append({"path": filename.relative_to(root).as_posix(),
                            "bytes": filename.stat().st_size,
                            "sha256": digest_file(filename)})
    payload = json.dumps(entries, separators=(",", ":"), ensure_ascii=True).encode("ascii")
    if not entries:
        raise ValueError("Configured solver data directory is empty")
    return {"path": str(root), "files": entries,
            "sha256": hashlib.sha256(payload).hexdigest(),
            "bytes": sum(entry["bytes"] for entry in entries)}


def verify_inputs(run, entries):
    """Authenticate copied host inputs; changed or escaping paths fail the run."""
    for entry in entries:
        filename = unlinked_path(run / entry["path"])
        filename.relative_to(run)
        if filename.stat().st_size != entry["bytes"] or digest_file(filename) != entry["sha256"]:
            raise ValueError(f"Input identity changed: {entry['path']}")


def check_cancel(run):
    """Fail an owner-cancelled run so its subprocess and manifest finalize normally."""
    if (run / "cancel.request").exists():
        raise InterruptedError("Host requested cancellation")


def execute_solver(executable, directory, run, timeout_seconds, progress):
    """Run uvspec in an isolated process group, retaining raw streams and killing on timeout.

    Nonzero exit/timeout raises after logs close. The caller preserves a failed
    manifest; diagnose the retained stderr and create a new run rather than retry
    inside this directory. No detached child survives handled cancellation.
    """
    process = None
    with (run / "stdout.txt").open("xb") as stdout, (run / "stderr.txt").open("xb") as stderr:
        try:
            process = subprocess.Popen([str(executable), "-i", "input.inp"],
                                       cwd=directory, stdout=stdout, stderr=stderr,
                                       stdin=subprocess.DEVNULL, start_new_session=True)
            deadline = time.monotonic() + timeout_seconds
            while process.poll() is None and time.monotonic() < deadline:
                check_cancel(run)
                try:
                    process.wait(timeout=min(5, max(0.01, deadline - time.monotonic())))
                except subprocess.TimeoutExpired:
                    progress.write(json.dumps({"at": timestamp(), "phase": "solver-running"}) + "\n")
                    progress.flush()
                    print("libRadtran: solver running", flush=True)
            if process.poll() is None:
                raise TimeoutError(f"Solver exceeded {timeout_seconds} seconds")
            if process.returncode:
                raise RuntimeError(f"uvspec exited with status {process.returncode}; inspect stderr.txt")
        finally:
            if process is not None and process.poll() is None:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
    if not (run / "stdout.txt").stat().st_size:
        raise ValueError("uvspec produced no stdout; inspect stderr.txt")


def check_smoke(filename):
    """Require three finite positive radiances at the declared wavelengths.

    Shape/value mismatch raises; this operational check does not prove physical
    accuracy, matched inputs, convergence or agreement with another solver.
    """
    rows = [[float(value) for value in line.split()] for line in filename.read_text().splitlines() if line.strip()]
    if len(rows) != 3 or any(len(row) != 2 for row in rows):
        raise ValueError("Smoke output must contain three wavelength/radiance rows")
    for row, wavelength in zip(rows, [450, 550, 650]):
        if row[0] != wavelength or not math.isfinite(row[1]) or row[1] <= 0:
            raise ValueError(f"Invalid smoke radiance at {wavelength} nm")
    return {"check": "three finite positive spectral radiances", "rows": rows,
            "accuracyQualified": False}


def interrupted(_signum, _frame):
    """Turn Linux cancellation/deadline into handled cleanup and failed evidence."""
    raise InterruptedError("Linux worker interrupted or total execution deadline exceeded")


def main():
    """Execute one authenticated request and finalize its raw evidence manifest.

    Failures after run-root validation produce a failed manifest and exit 1.
    Malformed startup requests fail before execution. Callers inspect artifacts,
    correct their case/setup and allocate a new run; no automatic retry occurs.
    """
    request_file = unlinked_path(Path(sys.argv[1]))
    request = json.loads(request_file.read_text())
    run = unlinked_path(Path(request["runDirectory"]))
    if request_file.parent != run or run.parent.name != "tools" or run.parent.parent.parent.name != "runs" or run.parent.parent.parent.parent.name != "elevated-horizon-validation" or run.parent.parent.parent.parent.parent.name != "experiments" or run.parent.parent.parent.parent.parent.parent.name != "tmp":
        raise ValueError("Worker requires the host-owned ignored run boundary")
    write_json(run / "started.json", {"at": timestamp(), "pid": os.getpid()})
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    signal.signal(signal.SIGALRM, interrupted)
    signal.alarm(request["timeoutSeconds"] + 90)
    started = time.monotonic()
    manifest = {"schema": "libradtran-tool-result/1", "startedAt": timestamp(),
                "command": request["command"], "case": request["case"],
                "status": "failed", "accuracyQualified": False,
                "dependencyCoverage": "Copied bundle and configured installed data tree; bundle author owns input closure.",
                "runtime": {"python": sys.version, "platform": platform.platform()}}
    with (run / "progress.jsonl").open("x", encoding="utf-8") as progress:
        try:
            verify_inputs(run, request["inputs"])
            config = request["installation"]
            executable = unlinked_path(Path(config["executable"]))
            executable_hash = digest_file(executable)
            if executable_hash != config["expectedSha256"]:
                raise ValueError("Executable SHA-256 differs from the selected build")
            version = subprocess.run([str(executable), "-v"], capture_output=True, text=True, timeout=10, check=True)
            version_text = (version.stdout + version.stderr).strip()
            write_json(run / "version.json", {"argv": [str(executable), "-v"], "exitCode": version.returncode,
                                              "stdout": version.stdout, "stderr": version.stderr})
            if version_text != f"uvspec, version {config['expectedVersion']}":
                raise ValueError("Unexpected libRadtran version output")
            print(f"libRadtran: {version_text}; hashing installed data", flush=True)
            before_data = data_identity(Path(config["dataDirectory"]))
            write_json(run / "data-files.json", before_data)
            manifest["solver"] = {"path": str(executable), "sha256": executable_hash, "version": version_text}
            manifest["data"] = {"path": before_data["path"], "sha256": before_data["sha256"],
                                "files": len(before_data["files"]), "bytes": before_data["bytes"]}
            check_cancel(run)
            if request["command"] != "doctor":
                bundle = unlinked_path(run / "case")
                execution = run / "execution"
                execution.mkdir()
                # Preserve original bytes and resolve only the explicitly documented data token.
                for parent, directories, filenames in os.walk(bundle):
                    relative = Path(parent).relative_to(bundle)
                    target = execution / relative
                    if relative.parts:
                        target.mkdir()
                    for name in filenames:
                        source = Path(parent) / name
                        content = source.read_bytes()
                        if source.suffix == ".inp":
                            content = content.replace(b"@LIBRADTRAN_DATA@", str(before_data["path"]).encode("utf-8"))
                        with (target / name).open("xb") as stream:
                            stream.write(content)
                manifest["solverCommand"] = {"argv": [str(executable), "-i", "input.inp"], "cwd": str(execution)}
                progress.write(json.dumps({"at": timestamp(), "phase": "solver-start"}) + "\n")
                progress.flush()
                execute_solver(executable, execution, run, request["timeoutSeconds"], progress)
                if request["command"] == "smoke":
                    manifest["smoke"] = check_smoke(run / "stdout.txt")
            after_data = data_identity(Path(config["dataDirectory"]))
            check_cancel(run)
            if before_data != after_data or executable_hash != digest_file(executable):
                raise ValueError("Solver/data identity changed during execution")
            verify_inputs(run, request["inputs"])
            manifest["status"] = "succeeded"
        except Exception as error:
            manifest["error"] = {"type": type(error).__name__, "message": str(error)}
            print(f"libRadtran: {type(error).__name__}: {error}", file=sys.stderr, flush=True)
        finally:
            signal.alarm(0)
            progress.write(json.dumps({"at": timestamp(), "phase": manifest["status"]}) + "\n")
    manifest["finishedAt"] = timestamp()
    manifest["elapsedSeconds"] = time.monotonic() - started
    manifest["artifacts"] = [{"path": filename.relative_to(run).as_posix(), "bytes": filename.stat().st_size,
                              "sha256": digest_file(filename)} for filename in sorted(run.rglob("*")) if filename.is_file()]
    write_json(run / "manifest.json", manifest)
    print(f"libRadtran: {manifest['status']} ({manifest['elapsedSeconds']:.3f}s)", flush=True)
    return 0 if manifest["status"] == "succeeded" else 1


if __name__ == "__main__":
    sys.exit(main())
