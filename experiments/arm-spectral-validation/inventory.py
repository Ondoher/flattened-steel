"""Acquire bounded public ARM metadata into an immutable experiment run.

This runner makes unauthenticated requests only. It records access failures as
inventory evidence, never as evidence that atmospheric measurements are absent.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request


SOURCE_ROOT = Path(__file__).absolute().parent
REPO_ROOT = SOURCE_ROOT.parent.parent
OUTPUT_ROOT = REPO_ROOT / "tmp/experiments/arm-spectral-validation"
MAX_BYTES = 8 * 1024 * 1024


def checked_path(path):
    """Reject redirected ancestors and require a path inside this repository."""
    path = path.absolute()
    path.relative_to(REPO_ROOT)
    for entry in [path, *path.parents]:
        if entry == REPO_ROOT.parent:
            break
        if entry.exists() and (
            entry.is_symlink()
            or (hasattr(entry, "is_junction") and entry.is_junction())
            or str(entry.resolve()).lower() != str(entry).lower()
        ):
            raise ValueError("Redirected boundary: " + str(entry))
    return path


def write_json(path, value):
    """Create a UTF-8 JSON artifact exclusively; completed bytes are not reused."""
    with checked_path(path).open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, indent=2)
        stream.write("\n")


def utc():
    """Return an unambiguous UTC event timestamp."""
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def main():
    """Acquire only the supplied public URL inventory and seal its artifacts."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--requests", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", args.name) or len(args.name) > 16:
        raise ValueError("Run name must be descriptive kebab-case of at most16 characters")
    for marker in [REPO_ROOT / ".git", REPO_ROOT / "AGENTS.md"]:
        if not marker.exists():
            raise ValueError("Missing repository identity marker")
    request_path = checked_path(REPO_ROOT / args.requests)
    request_path.relative_to(SOURCE_ROOT)
    requests = json.loads(request_path.read_text(encoding="utf-8"))
    for request in requests:
        parsed = urllib.parse.urlsplit(request["url"])
        if parsed.scheme != "https" or parsed.username or parsed.password:
            raise ValueError("Only public HTTPS URLs without credentials are supported")
        if set(urllib.parse.parse_qs(parsed.query)) & {"user", "token", "password", "key", "access_token"}:
            raise ValueError("Credential parameters are forbidden in this public inventory")
        if not re.fullmatch(r"[a-z0-9-]+", request["id"]):
            raise ValueError("Unsafe request identity")
    runs = checked_path(OUTPUT_ROOT / "runs")
    runs.mkdir(exist_ok=True)
    sequences = []
    for entry in runs.iterdir():
        checked_path(entry)
        match = re.fullmatch(r"(\d{5})-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)", entry.name)
        if not match or len(match[2]) > 16 or not entry.is_dir():
            raise ValueError("Malformed run entry: " + entry.name)
        sequences.append(int(match[1]))
    sequence = max(sequences, default=-1) + 1
    if sequence > 99999:
        raise ValueError("Run sequence exhausted")
    run = checked_path(runs / f"{sequence:05d}-{args.name}")
    run.mkdir()
    lock = threading.Lock()

    def event(phase, message, **extra):
        with lock, (run / "progress.jsonl").open("a", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps({"timestamp": utc(), "phase": phase, "message": message, **extra}) + "\n")
            stream.flush()

    stop = threading.Event()

    def heartbeat():
        while not stop.wait(25):
            event("acquire", "Public metadata request remains active")

    started = time.monotonic()
    event("start", "Acquiring bounded public metadata", total=len(requests), completed=0)
    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
    results = []
    state = "accepted"
    try:
        write_json(run / "request.json", {
            "purpose": "M1 public metadata and access feasibility, not scientific qualification",
            "requests": requests,
            "python": platform.python_version(),
            "maximumResponseBytes": MAX_BYTES,
            "source": str(Path(__file__).relative_to(REPO_ROOT)).replace("\\", "/"),
            "sourceSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "requestSha256": hashlib.sha256(request_path.read_bytes()).hexdigest(),
            "authentication": "none; public requests only",
        })
        for index, request in enumerate(requests):
            event("acquire", request["id"], completed=index, total=len(requests))
            record = {**request, "acquiredAt": utc()}
            try:
                req = urllib.request.Request(request["url"], headers={"User-Agent": "ARM-spectral-validation/0.1"})
                try:
                    response = urllib.request.urlopen(req, timeout=25)
                except urllib.error.HTTPError as error:
                    response = error
                with response:
                    body = response.read(MAX_BYTES + 1)
                    if len(body) > MAX_BYTES:
                        raise ValueError("Response exceeds bounded metadata allowance")
                    record.update({
                        "status": response.status,
                        "finalUrl": response.url,
                        "contentType": response.headers.get("Content-Type"),
                        "etag": response.headers.get("ETag"),
                        "lastModified": response.headers.get("Last-Modified"),
                    })
                filename = request["id"] + ".body"
                checked_path(run / filename).write_bytes(body)
                record.update({"artifact": filename, "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest()})
                if body.startswith(b"<!DOCTYPE") or b"<html" in body[:1000]:
                    record["scriptSources"] = re.findall(r'<script[^>]+src=["\']([^"\']+)', body.decode("utf-8", "replace"))
            except Exception as error:
                record["error"] = {"type": type(error).__name__, "message": str(error)[:300]}
            results.append(record)
            print(json.dumps({key: record.get(key) for key in ["id", "status", "bytes", "error", "scriptSources"]}), flush=True)
        write_json(run / "result.json", {"results": results, "elapsedSeconds": time.monotonic() - started,
            "scope": "Public access/metadata inventory only; no matched case accepted"})
    except BaseException:
        state = "interrupted" if isinstance(__import__("sys").exc_info()[1], KeyboardInterrupt) else "failed"
        raise
    finally:
        stop.set()
        thread.join()
        event("terminal", "Inventory runner finalized", state=state, completed=len(results), total=len(requests))
        artifacts = []
        for artifact in sorted(run.iterdir()):
            checked_path(artifact)
            content = artifact.read_bytes()
            artifacts.append({"path": artifact.name, "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
        write_json(run / "sealed.json", {"state": state, "scope": "metadata acquisition operation only",
            "finishedAt": utc(), "artifacts": artifacts})
        print("Run: " + str(run), flush=True)


if __name__ == "__main__":
    main()
