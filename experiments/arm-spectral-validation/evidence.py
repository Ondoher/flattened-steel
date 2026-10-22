"""Small immutable-run context for contained, non-authenticated calculations."""

import hashlib
import json
from pathlib import Path
import re
import sys
import threading

sys.dont_write_bytecode = True
from inventory import checked_path, write_json, utc, SOURCE_ROOT, OUTPUT_ROOT


def digest(path):
    """Identify a checked regular file with a streaming SHA-256."""
    value = hashlib.sha256()
    with checked_path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


class Run:
    """Allocate one exclusive run, retain parents/tools and seal closed outputs."""

    def __init__(self, name, sources, scope):
        if not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", name) or len(name) > 16:
            raise ValueError("Invalid run suffix")
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
        self.path = checked_path(runs / f"{sequence + 1:05d}-{name}")
        self.path.mkdir()
        self.scope, self.parents = scope, []
        self.lock, self.stop = threading.Lock(), threading.Event()
        for source in list(dict.fromkeys(["inventory.py", "evidence.py", *sources])):
            original = checked_path(SOURCE_ROOT / source)
            with (self.path / source).open("xb") as stream:
                stream.write(original.read_bytes())

    def event(self, phase, message, **extra):
        """Flush a single monitorable JSON Lines event."""
        with self.lock, (self.path / "progress.jsonl").open("a", encoding="utf-8", newline="\n") as stream:
            stream.write(json.dumps({"timestamp": utc(), "phase": phase, "message": message, **extra}) + "\n")
            stream.flush()

    def __enter__(self):
        self.event("start", self.scope)
        def heartbeat():
            while not self.stop.wait(25):
                self.event("active", self.scope)
        self.thread = threading.Thread(target=heartbeat, daemon=True)
        self.thread.start()
        return self

    def parent(self, name):
        """Verify an immutable parent before consuming its data and retain its seal."""
        parent = checked_path(OUTPUT_ROOT / "runs" / name)
        seal_path = checked_path(parent / "sealed.json")
        seal = json.loads(seal_path.read_text())
        if seal["state"] != "accepted":
            raise ValueError("Parent is not an accepted operation: " + name)
        for entry in seal["artifacts"]:
            artifact = checked_path(parent / entry["path"])
            artifact.relative_to(parent)
            if artifact.stat().st_size != entry["bytes"] or digest(artifact) != entry["sha256"]:
                raise ValueError("Parent bytes changed: " + name)
        self.parents.append({"run": name, "sealSha256": digest(seal_path)})
        return parent

    def json(self, name, value):
        """Create one JSON artifact exclusively, with no non-finite JSON numbers."""
        target = checked_path(self.path / name)
        target.relative_to(self.path)
        with target.open("x", encoding="utf-8", newline="\n") as stream:
            json.dump(value, stream, indent=2, allow_nan=False)
            stream.write("\n")

    def __exit__(self, kind, value, traceback):
        state = "accepted" if kind is None else ("interrupted" if kind is KeyboardInterrupt else "failed")
        self.json("derivation.json", {"parents": self.parents, "scope": self.scope})
        # Keep progress alive during potentially large cache/bundle hashing. Close
        # the journal last so its final hash cannot race an append.
        artifacts = [{"path": path.relative_to(self.path).as_posix(), "bytes": path.stat().st_size,
            "sha256": digest(path)} for path in sorted(self.path.rglob("*"))
            if path.is_file() and path != self.path / "progress.jsonl"]
        self.stop.set()
        self.thread.join()
        self.event("terminal", self.scope, state=state)
        journal = self.path / "progress.jsonl"
        artifacts.append({"path":"progress.jsonl", "bytes":journal.stat().st_size,"sha256":digest(journal)})
        artifacts.sort(key=lambda artifact: artifact['path'])
        self.json("sealed.json", {"state": state, "finishedAt": utc(), "scope": self.scope, "artifacts": artifacts})
        print("Run: " + self.path.name, flush=True)
        return False
