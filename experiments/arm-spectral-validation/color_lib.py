"""Extend libRadtran zenith spectra; seal the small-file bundle on Windows."""
import argparse
import json
import math
import subprocess
import sys
sys.dont_write_bytecode=True
from compare_lib import bundle
from evidence import Run
from inventory import REPO_ROOT, SOURCE_ROOT


def linux_path(path):
    """Translate a checked repository path to the existing WSL drive mount."""
    path=path.resolve();path.relative_to(REPO_ROOT)
    drive=path.drive[0].lower()
    return '/mnt/'+drive+'/'+path.as_posix().split(':/',1)[1]


def main():
    """Solve both frozen intervals, using measured-constrained full-profile optics."""
    parser=argparse.ArgumentParser();parser.add_argument('--input-run',required=True);args=parser.parse_args()
    with Run('color-lib',['color_lib.py','linux_case.py','compare_lib.py','solver.py','model.py','case.py','netcdf.py'],'Matched zenith libRadtran visible-range extension') as run:
        physical=run.parent(args.input_run)
        smoke=run.parent('00022-solver-smoke')
        contract=json.loads((physical/'contract.json').read_text())
        config=json.loads((smoke/'installation.json').read_text())
        run.json('installation.json',config)
        (run.path/'data-identity.json').write_bytes((smoke/'data-identity.json').read_bytes())
        results=[]
        for case in contract['cases']:
            key=case['id']+'-full';path=run.path/key
            run.event('solver',key)
            witness=bundle(path,contract,case,'full',{'id':'central'},32)
            with (path/'launcher.log').open('xb') as log:
                subprocess.run([config['wslExecutable'],'-d',config['distribution'],'-u',config['user'],'--exec','python3','-B',
                    linux_path(SOURCE_ROOT/'linux_case.py'),'--case',linux_path(path)],stdout=log,stderr=subprocess.STDOUT,
                    stdin=subprocess.DEVNULL,timeout=240,check=True)
            rows=[[float(v) for v in line.split()] for line in (path/'stdout.txt').read_text().splitlines() if line.strip()]
            if len(rows)!=len(contract['channels']) or any(len(row)!=2 or not math.isfinite(row[1]) or row[1]<0 or row[0]!=c['wavelengthNanometers'] for row,c in zip(rows,contract['channels'])):
                raise ValueError('Invalid visible-range solver output')
            results.append({'case':case['id'],'representation':'full','rows':rows,'witness':witness,
                            'execution':json.loads((path/'execution.json').read_text())})
            print(json.dumps({'case':case['id'],'channels':len(rows),'execution':results[-1]['execution']}),flush=True)
        run.json('result.json',{'results':results,'rangeNanometers':[400,800],'quantity':'Zenith spectral radiance mW m^-2 nm^-1 sr^-1',
            'limits':'Same conditional scalar continuum atmosphere; full profile, all orders; common visible-range color projection only'})

if __name__=='__main__':main()
