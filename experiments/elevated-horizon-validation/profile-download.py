"""Acquire authoritative alternatives once using system HTTPS; never disable TLS."""
import hashlib
import json
import pathlib
import shutil
import sys
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
RUN = ROOT / sys.argv[1]
RUN.resolve().relative_to(ROOT / 'tmp/experiments/elevated-horizon-validation/runs')
assert not (RUN / 'manifest.json').exists()
for ancestor in [RUN, *RUN.parents]:
    assert not ancestor.is_symlink()
results = []
sources = [
    ('opac_40b.zip', 'https://zenodo.org/api/records/7275005/files/opac_40b.zip/content'),
    ('optprop_v2.1.tar.gz', 'https://www.libradtran.org/lib/exe/fetch.php?media=download%3Aoptprop_v2.1.tar.gz'),
]
for name, url in sources:
    start = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            headers = dict(response.headers)
            resolved = response.url
            with (RUN / 'archives' / name).open('xb') as stream:
                shutil.copyfileobj(response, stream)
        digest = hashlib.sha256()
        with (RUN / 'archives' / name).open('rb') as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(block)
        result = {'file': name, 'url': url, 'state': 'downloaded', 'resolvedUrl': resolved,
                  'headers': headers, 'bytes': (RUN / 'archives' / name).stat().st_size, 'sha256': digest.hexdigest(),
                  'transport': 'Python urllib system trust; no TLS verification bypass'}
    except Exception as error:
        result = {'file': name, 'url': url, 'state': 'failed', 'error': f'{type(error).__name__}: {error}',
                  'decision': 'Record acquisition failure and proceed; no automatic retry.'}
    result['seconds'] = time.monotonic() - start
    results.append(result)
    print(json.dumps(result), flush=True)
with (RUN / 'downloads.json').open('x', encoding='utf-8', newline='\n') as stream:
    json.dump(results, stream, indent=2)
    stream.write('\n')
