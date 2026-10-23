"""Inspect/extract published optical data inside one new host-owned run only."""
import hashlib
import json
import pathlib
import stat
import sys
import tarfile
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
RUN = ROOT / sys.argv[1]
assert RUN.resolve() == RUN.absolute()
RUN.relative_to(ROOT / 'tmp/experiments/elevated-horizon-validation/runs')
assert not (RUN / 'manifest.json').exists()
for ancestor in [RUN, *RUN.parents]:
    assert not ancestor.is_symlink()


def target_path(base, name):
    """Validate every archive member before extracting regular files."""
    relative = pathlib.PurePosixPath(name.replace('\\', '/'))
    assert not relative.is_absolute() and '..' not in relative.parts
    assert not any(':' in component for component in relative.parts)
    target = base.joinpath(*relative.parts)
    target.resolve().relative_to(base.resolve())
    return target


attempts = json.loads((RUN / 'downloads.json').read_text(encoding='utf-8'))
results = []
for attempt in attempts:
    if attempt['state'] != 'downloaded':
        results.append({'file': attempt['file'], 'state': 'unavailable'})
        continue
    archive = RUN / 'archives' / attempt['file']
    base = RUN / 'data' / attempt['file'].split('.')[0]
    entries, extracted = [], []
    try:
        base.mkdir(parents=True)
        if archive.suffix == '.zip':
            with zipfile.ZipFile(archive) as bundle:
                for item in bundle.infolist():
                    destination = target_path(base, item.filename)
                    assert not stat.S_ISLNK(item.external_attr >> 16)
                    entries.append({'path': item.filename, 'bytes': item.file_size})
                    if item.is_dir():
                        continue
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    body = bundle.read(item)
                    with destination.open('xb') as stream:
                        stream.write(body)
                    extracted.append({'path': destination.relative_to(RUN).as_posix(), 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        else:
            with tarfile.open(archive, 'r:gz') as bundle:
                for item in bundle:
                    destination = target_path(base, item.name)
                    assert item.isdir() or item.isfile()
                    entries.append({'path': item.name, 'bytes': item.size})
                    if not item.isfile() or 'opac' not in item.name.lower():
                        continue
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    body = bundle.extractfile(item).read()
                    with destination.open('xb') as stream:
                        stream.write(body)
                    extracted.append({'path': destination.relative_to(RUN).as_posix(), 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})
        results.append({'file': attempt['file'], 'state': 'usable-data', 'entries': entries, 'extracted': extracted})
        print(attempt['file'], len(entries), 'members;', len(extracted), 'data files extracted')
    except Exception as error:
        results.append({'file': attempt['file'], 'state': 'failed-inspection', 'error': str(error), 'entries': entries, 'extracted': extracted})
        print(attempt['file'], type(error).__name__, str(error))
with (RUN / 'archive-inventory.json').open('x', encoding='utf-8', newline='\n') as stream:
    json.dump(results, stream, indent=2)
    stream.write('\n')
