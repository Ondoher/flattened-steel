"""Verify sealed evidence and explicit scientific witnesses without changing parents."""
import ast
import json
import math
from pathlib import Path
import subprocess
import sys
import time
sys.dont_write_bytecode=True
from evidence import Run, digest
from inventory import OUTPUT_ROOT, SOURCE_ROOT, checked_path


def main():
    """Authenticate retained history, admitted comparisons and a rendered spectral plot."""
    with Run('verification',['verify.py'],'Final read-only evidence/scientific proof and native SVG render') as run:
        counts={'runs':0,'artifacts':0,'bytes':0};states=[]
        started=time.monotonic()
        for parent in sorted((OUTPUT_ROOT/'runs').iterdir()):
            if parent==run.path:continue
            seal_path=checked_path(parent/'sealed.json')
            if not seal_path.exists():raise ValueError('Earlier run is not finalized: '+parent.name)
            seal=json.loads(seal_path.read_text())
            artifacts=seal['artifacts']
            expected={a['path'] for a in artifacts}
            actual={p.relative_to(parent).as_posix() for p in parent.rglob('*') if p.is_file() and p!=seal_path}
            if actual!=expected:raise ValueError('Manifest file-set mismatch: '+parent.name)
            for entry in artifacts:
                path=checked_path(parent/entry['path']);path.relative_to(parent)
                if path.stat().st_size!=entry['bytes'] or digest(path)!=entry['sha256']:raise ValueError('Changed evidence: '+str(path))
                counts['artifacts']+=1;counts['bytes']+=entry['bytes']
            counts['runs']+=1
            states.append({'run':parent.name,'state':seal['state'],'sealSha256':digest(seal_path)})
            run.event('hash-verification',parent.name,completed=counts['runs'])
        run.json('parent-history.json',{'counts':counts,'runs':states})
        physical=run.parent('00025-physical-inputs')
        production=run.parent('00028-prod-caches')
        report=run.parent('00032-comparison')
        contract=json.loads((physical/'contract.json').read_text())
        results=json.loads((production/'result.json').read_text())['summaries']
        for record in results:
            spec=record['request']['transportSpec']
            for channel,expected in zip(spec['domains']['spectrum']['channels'],contract['channels']):
                for name in ['rayleighScatteringPerMeter','mieExtinctionPerMeter','groundAlbedo','mieSingleScatteringAlbedo','miePhaseTable']:
                    if channel[name]!=expected[name]:raise ValueError('Production physical input mismatch')
                if channel['sourceIrradianceDensityWattsPerSquareMeterPerNanometer']!=expected['sourceIrradianceWattsPerSquareMeterPerNanometer']:raise ValueError('Source unit mismatch')
            if any(not math.isfinite(v['radianceMilliwatts']) or v['radianceMilliwatts']<0 for v in record['outputs']):raise ValueError('Invalid radiance')
            if spec['numerical']['maximumScatteringOrder']!=4:raise ValueError('Order contract changed')
        for path in SOURCE_ROOT.glob('*.py'):ast.parse(path.read_text(),filename=str(path))
        subprocess.run(['node','node_modules/typescript/bin/tsc','-p','experiments/arm-spectral-validation/jsconfig.json'],check=True,cwd=SOURCE_ROOT.parent.parent)
        # Rasterize the authored numerical SVG for visual inspection; no AI-generated imagery.
        (run.path/'pilot-spectra.svg').write_bytes((report/'pilot-spectra.svg').read_bytes())
        chrome=Path('C:/Program Files/Google/Chrome/Application/chrome.exe')
        with (run.path/'chrome.log').open('xb') as log:
            subprocess.run([str(chrome),'--headless=new','--no-first-run','--no-default-browser-check',
                '--disable-background-networking',f'--user-data-dir={run.path / "chrome-profile"}',
                '--hide-scrollbars','--window-size=820,425',f'--screenshot={run.path / "pilot-spectra.png"}',
                (run.path/'pilot-spectra.svg').as_uri()],stdout=log,stderr=subprocess.STDOUT,check=True,timeout=60)
        if not (run.path/'pilot-spectra.png').is_file():raise ValueError('Native SVG render missing')
        run.json('result.json',{'verified':True,'counts':counts,'verificationWallSeconds':time.monotonic()-started,
            'proofs':['all earlier run file sets, sizes and SHA256 match, including retained failed attempts',
                'production per-channel coefficients/phase/source exactly match frozen conditional inputs',
                'all reported production radiances finite/nonnegative; N4 order contract',
                'current Python AST and local TypeScript pass','native scientific SVG rendered to PNG'],
            'limits':'Integrity, input and reported-output proof, not absolute instrument calibration or full numerical convergence certification'})
        print(json.dumps(counts),flush=True)

if __name__=='__main__':main()
