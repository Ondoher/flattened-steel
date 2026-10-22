"""Run the installed libRadtran read-only, with all artifacts inside this lane."""
import hashlib
import json
import math
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
sys.dont_write_bytecode=True
from evidence import Run
from inventory import REPO_ROOT, checked_path


def sha(path):
    """Hash an installed dependency without changing it."""
    result=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):result.update(block)
    return result.hexdigest()


def installed(path):
    """Require an existing ordinary installed path without linked ancestors."""
    path=Path(path)
    if any(p.is_symlink() for p in [path,*path.parents]):raise ValueError('Linked installed path')
    return path.resolve(strict=True)


def execute(exe, directory, run, timeout=180):
    """Retain raw streams and terminate only this owned process group on interruption."""
    started=time.monotonic()
    process=None
    with (directory/'stdout.txt').open('xb') as out,(directory/'stderr.txt').open('xb') as err:
        try:
            process=subprocess.Popen([str(exe),'-i','input.inp'],cwd=directory,stdout=out,stderr=err,
                                     stdin=subprocess.DEVNULL,start_new_session=True)
            while process.poll() is None:
                try:process.wait(timeout=min(5,max(.01,timeout-(time.monotonic()-started))))
                except subprocess.TimeoutExpired:
                    if time.monotonic()-started>=timeout:raise TimeoutError('Bounded libRadtran solve exceeded deadline')
            if process.returncode:raise RuntimeError(f'libRadtran exit{process.returncode}; inspect retained stderr.txt')
        finally:
            if process is not None and process.poll() is None:
                os.killpg(process.pid,signal.SIGKILL);process.wait()
    return time.monotonic()-started


def main():
    """Prove installed operational readiness using zenith radiance at three wavelengths."""
    with Run('solver-smoke',['solver.py'],'M2 installed solver operational smoke; not physical validation') as run:
        config_path=checked_path(REPO_ROOT/'scripts/libradtran/installation.json')
        config=json.loads(config_path.read_text())
        run.json('installation.json',config)
        exe=installed(config['executable']);data=installed(config['dataDirectory'])
        identity=sha(exe)
        if identity!=config['expectedSha256']:raise ValueError('Installed solver identity changed')
        version=subprocess.run([str(exe),'-v'],capture_output=True,text=True,check=True,timeout=10)
        if (version.stdout+version.stderr).strip()!=f"uvspec, version {config['expectedVersion']}":raise ValueError('Unexpected solver version')
        run.json('version.json',{'stdout':version.stdout,'stderr':version.stderr,'sha256':identity})
        run.event('dependencies','Fingerprinting installed read-only solver data')
        entries=[]
        for base,dirs,files in os.walk(data,followlinks=False):
            for name in sorted(dirs):installed(Path(base)/name)
            for name in sorted(files):
                path=installed(Path(base)/name)
                entries.append({'path':path.relative_to(data).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
        entries.sort(key=lambda r:r['path'])
        run.json('data-identity.json',{'root':str(data),'files':entries,
            'sha256':hashlib.sha256(json.dumps(entries,sort_keys=True).encode()).hexdigest()})
        (run.path/'wavelengths.txt').write_text('450\n550\n650\n')
        (run.path/'input.inp').write_text('\n'.join([
            f'data_files_path {data}/',f'atmosphere_file {data}/atmmod/afglus.dat',
            f'source solar {data}/solar_flux/atlas_plus_modtran','wavelength_grid_file wavelengths.txt',
            'spline_file wavelengths.txt','rte_solver disort','number_of_streams 16',
            'sza 57','phi0 0','umu -1','phi 180','zout 0','albedo 0',
            'output_user lambda uu','quiet','']))
        run.event('solver','Executing three-wavelength zenith smoke')
        elapsed=execute(exe,run.path,run)
        rows=[[float(v) for v in line.split()] for line in (run.path/'stdout.txt').read_text().splitlines() if line.strip()]
        if len(rows)!=3 or any(len(r)!=2 or r[0]!=w or not math.isfinite(r[1]) or r[1]<=0 for r,w in zip(rows,[450,550,650])):
            raise ValueError('Smoke radiance shape or values invalid')
        run.json('result.json',{'operationalSmokeAccepted':True,'matchedARMCase':False,'accuracyQualified':False,
            'rows':rows,'radianceUnits':'mW m^-2 nm^-1 sr^-1','solverWallSeconds':elapsed,
            'geometry':'DISORT, sza57degrees, zenith observer at ground; default atmosphere and source',
            'limits':'Operational smoke only; no production or ARM matching or numerical convergence claim'})
        print(json.dumps({'rows':rows,'solverWallSeconds':elapsed}),flush=True)

if __name__=='__main__':main()
