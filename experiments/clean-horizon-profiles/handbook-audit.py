"""Retain primary instrument documentation and search its actual optical conventions."""
import hashlib
import json
import pathlib
import sys
import urllib.request
from pypdf import PdfReader

ROOT = pathlib.Path(__file__).resolve().parents[2]
RUN = ROOT / sys.argv[1]
RUN.resolve().relative_to(ROOT/'tmp/experiments/clean-horizon-profiles/runs')
records = []
for name, url in [
    ('raman', 'https://www.arm.gov/publications/tech_reports/doe-sc-arm-tr-224.pdf'),
    ('psap', 'https://www.arm.gov/publications/tech_reports/handbooks/psap_handbook.pdf'),
]:
    record = {'name': name, 'url': url}
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            raw = response.read()
        assert raw.startswith(b'%PDF')
        path = RUN/(name+'.pdf'); path.write_bytes(raw)
        pages = [page.extract_text() or '' for page in PdfReader(path).pages]
        (RUN/(name+'.txt')).write_text('\n'.join(pages), encoding='utf-8')
        excerpts = []
        for index, text in enumerate(pages):
            for line in text.splitlines():
                if any(key in line.lower() for key in ['355', 'overlap', 'standard temperature', '1013', '273', 'near-field', 'near field']):
                    excerpts.append({'page': index+1, 'text': line})
        record.update({'state': 'downloaded', 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'excerpts': excerpts})
    except Exception as error:
        record.update({'state': 'failed', 'error': str(error)})
    records.append(record)
    print(json.dumps(record), flush=True)
(RUN/'documentation.json').write_text(json.dumps(records, indent=2))
