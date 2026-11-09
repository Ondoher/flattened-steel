"""Package only the existing compiler's small geometry/control inputs, never cache radiance."""
from pathlib import Path
import base64
import gzip
import hashlib
import json

repository = Path(__file__).resolve().parents[3]
destination = Path(__file__).resolve().parent
relative_root = 'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1'
root = repository / relative_root
catalog_name = 'distant-sun-runtime-catalog-2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac.json'
catalog = root / catalog_name
record = json.loads(catalog.read_text(encoding='utf-8'))
files = {catalog}
for entry in record['packages']:
    base = root / entry['assetPath']
    manifest = base / entry['manifestPath']
    metadata = json.loads(manifest.read_text(encoding='utf-8'))
    files.update([manifest, base / metadata['ledgerPath'], base / metadata['logicalToUniqueIndex']['path']])
entries = []
payload = []
for file in sorted(files):
    assert file.resolve().is_relative_to(root.resolve()) and not file.is_symlink()
    data = file.read_bytes()
    relative = file.relative_to(root).as_posix()
    entries.append({'path': relative, 'byteLength': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    payload.append({'path': relative, 'base64': base64.b64encode(data).decode('ascii')})
decoded = (json.dumps(payload, separators=(',', ':')) + '\n').encode()
compressed = gzip.compress(decoded, compresslevel=9, mtime=0)
(destination / 'cache-control-seed.json.gz').write_bytes(compressed)
manifest = {
    'schema': 'flat-deployment-cache-control-seed-v1',
    'targetRoot': relative_root,
    'catalog': catalog_name,
    'catalogSha256': hashlib.sha256(catalog.read_bytes()).hexdigest(),
    'derivation': 'Exact read-only copies of catalog, per-scene manifest, geometry ledger and direction index; base64 JSON, then gzip. No scattering/radiance payloads.',
    'producer': 'agents/topics/deploy/make-control-seed.py',
    'producerSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'archive': 'cache-control-seed.json.gz',
    'archiveByteLength': len(compressed),
    'archiveSha256': hashlib.sha256(compressed).hexdigest(),
    'decodedByteLength': len(decoded),
    'fileCount': len(entries),
    'sourceBytes': sum(item['byteLength'] for item in entries),
    'files': entries,
}
(destination / 'cache-control-seed.manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: manifest[key] for key in ['fileCount', 'sourceBytes', 'archiveByteLength', 'archiveSha256']}))
