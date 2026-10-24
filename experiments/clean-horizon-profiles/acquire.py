"""Acquire ATom documentation/metadata without credentials or TLS bypasses."""
import hashlib
import json
import pathlib
import platform
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
RUN = ROOT / sys.argv[1]
RUN.resolve().relative_to(ROOT / 'tmp/experiments/clean-horizon-profiles/runs')
assert not (RUN / 'manifest.json').exists()
for ancestor in [RUN, *RUN.parents]:
    assert not ancestor.is_symlink()
records = []

def fetch(name, url):
    """Download one named public resource and retain its exact response bytes."""
    start = time.monotonic()
    destination = RUN / 'downloads' / name
    destination.parent.mkdir(exist_ok=True)
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'clean-horizon-research/1.0'})
        with urllib.request.urlopen(request, timeout=40) as response:
            body = response.read()
            destination.write_bytes(body)
            record = {'name': name, 'url': url, 'status': response.status,
                      'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest(),
                      'contentType': response.headers.get('Content-Type'),
                      'resolvedHostPath': urllib.parse.urlsplit(response.url)._replace(query='', fragment='').geturl(),
                      'state': 'downloaded'}
    except Exception as error:
        body = None
        record = {'name': name, 'url': url, 'state': 'failed',
                  'error': type(error).__name__ + ': ' + str(error),
                  'decision': 'Retain failed request and continue to a distinct authoritative source.'}
    record['seconds'] = time.monotonic() - start
    records.append(record)
    print(json.dumps(record), flush=True)
    return body

fetch('dictionary.csv', 'https://data.ornldaac.earthdata.nasa.gov/public/atom/ATom_Aerosol_Properties_V2/comp/Data_Dictionary_ATom_Aerosol_Properties_V2.csv')
fetch('guide.pdf', 'https://data.ornldaac.earthdata.nasa.gov/public/atom/ATom_Aerosol_Properties_V2/comp/ATom_Aerosol_Properties_V2.pdf')
fetch('collection.json', 'https://cmr.earthdata.nasa.gov/search/concepts/C2698465642-ORNL_CLOUD.umm_json')
body = fetch('granules.json', 'https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=C2698465642-ORNL_CLOUD&page_size=100')
if body:
    inventory = json.loads(body)
    candidates = []
    for entry in inventory.get('feed', {}).get('entry', []):
        links = [link for link in entry.get('links', []) if link.get('rel', '').endswith('/data#') and not link.get('inherited')]
        candidates.append({'id': entry.get('id'), 'title': entry.get('title'), 'sizeMB': entry.get('granule_size'), 'links': links})
    (RUN / 'granule-inventory.json').write_text(json.dumps(candidates, indent=2))
    print(json.dumps({'granules': len(candidates), 'inventory': candidates}), flush=True)
    # Inspect one individual optical file rather than a complete bundle.
    nc = [item for item in candidates if any(link.get('href', '').endswith('.nc') for link in item['links'])]
    if nc:
        nc.sort(key=lambda item: float(item.get('sizeMB') or 1e20))
        link = next(link['href'] for link in nc[0]['links'] if link['href'].endswith('.nc'))
        fetch('sample.nc', link)
(RUN / 'acquisition.json').write_text(json.dumps({'python': sys.version, 'platform': platform.platform(), 'requests': records}, indent=2))
