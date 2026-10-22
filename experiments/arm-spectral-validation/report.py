"""Verify and summarize public M1 inventory without accepting a scientific case."""

import hashlib
import json
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
from inventory import checked_path, write_json, utc, SOURCE_ROOT, REPO_ROOT, OUTPUT_ROOT


def sha(path):
    """Identify a checked regular input or output by its exact bytes."""
    return hashlib.sha256(checked_path(path).read_bytes()).hexdigest()


def main():
    """Authenticate previous runs and create a fresh, reproducible M1 report."""
    runs = checked_path(OUTPUT_ROOT / "runs")
    parents = []
    for parent in sorted(runs.iterdir()):
        checked_path(parent)
        match = re.fullmatch(r"(\d{5})-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)", parent.name)
        if not match or len(match[2]) > 16 or not parent.is_dir():
            raise ValueError("Malformed run identity")
        seal = json.loads((parent / "sealed.json").read_text(encoding="utf-8"))
        for entry in seal["artifacts"]:
            artifact = checked_path(parent / entry["path"])
            artifact.relative_to(parent)
            if artifact.stat().st_size != entry["bytes"] or sha(artifact) != entry["sha256"]:
                raise ValueError("Parent artifact identity changed: " + str(artifact))
        parents.append({"run": parent.name, "sealSha256": sha(parent / "sealed.json")})
    sequence = max(int(parent["run"][:5]) for parent in parents) + 1
    if sequence > 99999:
        raise ValueError("Run sequence exhausted")
    run = checked_path(runs / f"{sequence:05d}-m1-report")
    run.mkdir()
    # Pin the exact tool sources used by this derivation and all preceding acquisitions.
    for source in [SOURCE_ROOT / "inventory.py", Path(__file__)]:
        with (run / source.name).open("xb") as stream:
            stream.write(checked_path(source).read_bytes())
    request_sources = []
    for source in sorted(SOURCE_ROOT.glob("*-requests.json")):
        name = "source-" + source.name
        with (run / name).open("xb") as stream:
            stream.write(checked_path(source).read_bytes())
        request_sources.append({"path": name, "sha256": sha(run / name)})
    coverage = checked_path(runs / "00003-exact-coverage")
    streams = []
    for label in ["twst", "sasze", "sonde", "lidar"]:
        obj = json.loads((coverage / f"{label}-exact.body").read_text())
        entry = obj["hits"]["hits"][0]["_source"]
        streams.append({"role": label, **{key: entry.get(key) for key in [
            "datastream", "doi", "dataLevel", "start_date", "end_date", "limited_access"
        ]}})
    files = []
    for label in ["sasze", "sonde", "lidar", "twst"]:
        obj = json.loads((coverage / f"{label}-day.body").read_text())
        for hit in obj["hits"]["hits"]:
            entry = hit["_source"]
            if ".20230822." in entry["file_name"]:
                files.append({"role": label, **entry, "contentsAcquired": False,
                    "contentSha256": None, "qualityQualified": False})
    core_files = [entry for entry in files if entry["role"] != "twst"]
    # A unit witness only: this is not a measurement or a solver result.
    per_micrometer = 100
    per_nanometer_watts = per_micrometer / 1000
    per_nanometer_milliwatts = per_nanometer_watts * 1000
    assert per_nanometer_watts == 0.1 and per_nanometer_milliwatts == per_micrometer
    receipt = {
        "createdAt": utc(), "reportVersion": 2,
        "derivation": "Verify parent seals; select exact datastream fields and file dates; summarize access outcomes",
        "supersedes": "00005-m1-report had a pretty-printed object in progress.jsonl; this derivative repairs JSON Lines formatting only",
        "parents": parents, "toolSources": [{"path": name, "sha256": sha(run / name)} for name in ["inventory.py", "report.py"]],
        "requestSources": request_sources,
        "milestone": "M1 inventory completed; case qualification held for access",
        "planComplete": False, "scientificCaseAccepted": False,
        "observationSpectraAvailableLocally": False,
        "candidate": {"site": "SGP C1", "date": "2023-08-22", "view": "zenith", "streams": streams, "files": files},
        "preferredSpectralStream": "sgpsaszevisC1.a1",
        "selectionReason": "Calibrated a1 visible radiance stream; TWST00 is raw and needs separate processing/calibration qualification",
        "coreFullDayFileBytes": sum(entry["file_size"] for entry in core_files),
        "access": {"publicMetadata": "accessible", "piArchiveContentsHttpStatus": 401,
            "ordinaryDownloadWithoutRequiredCredentialsHttpStatus": 400,
            "ownerReportedArmAccountOrLocalFiles": "neither",
            "nextExternalAction": "Owner registers ARM account and makes authorized data access available without storing credentials in evidence"},
        "limits": [
            "File inventory confirms existence, not calibration, clear sky, compatible profile or data quality",
            "The11:30 and23:31UTC radiosondes are not simultaneous with every daytime spectrum; profile variability must be assessed",
            "Aerosol phase/SSA, ground albedo, gas/solar inputs and exact quality notices remain unqualified",
            "No production or libRadtran atmosphere comparison has run",
            "The absence of a NetCDF decoder on the current Windows Python environment is a pending ingestion consideration, not a reason to alter scientific gates",
        ],
        "unitsWitness": {"input": {"value": per_micrometer, "unit": "W m^-2 sr^-1 um^-1"},
            "outputWattsPerNanometer": per_nanometer_watts,
            "outputMilliwattsPerNanometer": per_nanometer_milliwatts,
            "authority": "SI length/power conversion; actual file units must still be verified"},
    }
    write_json(run / "result.json", receipt)
    lines = ["role\tfile\tbytes\tstartUtc\tendUtc\tcontentsAcquired"]
    for entry in files:
        lines.append("\t".join(str(entry[key]) for key in ["role", "file_name", "file_size", "start_time", "end_time", "contentsAcquired"]))
    with (run / "candidate-files.tsv").open("x", encoding="utf-8", newline="\n") as stream:
        stream.write("\n".join(lines) + "\n")
    with (run / "progress.jsonl").open("x", encoding="utf-8", newline="\n") as stream:
        stream.write(json.dumps({"timestamp": utc(), "phase": "terminal", "state": "accepted",
            "message": "M1 metadata report and parent verification complete; scientific comparison remains held"}) + "\n")
    artifacts = [{"path": path.name, "bytes": path.stat().st_size, "sha256": sha(path)} for path in sorted(run.iterdir())]
    write_json(run / "sealed.json", {"state": "accepted", "scope": "M1 metadata/report integrity only; no scientific case acceptance",
        "finishedAt": utc(), "artifacts": artifacts})
    print(json.dumps({"run": run.name, "coreFiles": len(core_files), "coreFullDayFileBytes": receipt["coreFullDayFileBytes"],
        "verifiedParents": len(parents), "planComplete": False}))


if __name__ == "__main__":
    main()
