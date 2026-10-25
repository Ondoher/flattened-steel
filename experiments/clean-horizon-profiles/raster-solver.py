"""Run independent point rays in a persistent WSL batch; never modify source evidence."""
import concurrent.futures, hashlib, json, math, os, pathlib, subprocess, sys, time

def checked(p):
    p=pathlib.Path(p)
    assert p.is_absolute()
    for item in [p,*p.parents]:
        assert not item.is_symlink(),str(item)
    assert p.resolve(strict=True)==p
    return p

def digest(p):
    return hashlib.sha256(checked(p).read_bytes()).hexdigest()

run=checked(sys.argv[1]);repo=checked(sys.argv[2]);registration=json.loads((run/'registration.json').read_text())
assert run.is_relative_to(repo/'tmp/experiments/clean-horizon-profiles/runs')
installation=json.loads((repo/'scripts/libradtran/installation.json').read_text())
executable=checked(installation['executable']);assert digest(executable)==installation['expectedSha256']
data=checked(installation['dataDirectory'])
before={p.relative_to(data).as_posix():digest(p) for p in sorted(data.rglob('*')) if p.is_file()}
def save(p,obj):
    with p.open('x',encoding='utf-8') as f:json.dump(obj,f,allow_nan=False)
save(run/'installed-before.json',{'executable':str(executable),'sha256':digest(executable),'dataFiles':before,'python':sys.version})
started=time.monotonic()

def solve(c):
    work=run/'pixels'/c['id'];work.mkdir(parents=True,exist_ok=False)
    optics=checked(run/'optics'/str(c['observerHeight']))
    deck=(optics/'input.inp').read_text().replace('@LIBRADTRAN_DATA@',str(data))
    for token,name in [('atmosphere_file','atmosphere.txt'),('source solar','solar.txt'),('wavelength_grid_file','wavelengths.txt'),('mol_tau_file sca','scattering.txt'),('mol_tau_file abs','absorption.txt'),('aerosol_species_file','species.txt')]:
        deck=deck.replace(token+' '+name,token+' '+str(optics/name))
    deck=deck.replace('aerosol_species_library ./','aerosol_species_library '+str(optics)+'/')
    lines=deck.splitlines()
    replacements={'umu':str(-math.sin(math.radians(c['elevationDegrees']))),'phi':str(abs(c['azimuthDegrees'])),'mc_photons':str(c['photons']),'mc_randomseed':str(c['seed'])}
    deck='\n'.join(line.split()[0]+' '+replacements[line.split()[0]] if line.split() and line.split()[0] in replacements else line for line in lines)+'\n'
    (work/'input.inp').write_text(deck,encoding='utf-8')
    begin=time.monotonic()
    with (work/'stdout.txt').open('xb') as out,(work/'stderr.txt').open('xb') as err:
        p=subprocess.run([str(executable),'-i','input.inp'],cwd=work,stdout=out,stderr=err,timeout=300,check=False)
    assert p.returncode==0,(c['id'],p.returncode,(work/'stderr.txt').read_text())
    raw=checked(work/'mc.rad.spc');rows=[[float(v) for v in line.split()] for line in raw.read_text().splitlines()]
    assert len(rows)==15
    for row,w in zip(rows,registration['wavelengths']):
        assert abs(row[0]-w)<.002 and math.isfinite(row[-1]) and row[-1]>0,(c['id'],row)
    spectrum=[r[-1]/1000 for r in rows]
    result={'config':c,'spectrum':spectrum,'raw':{'path':raw.relative_to(repo).as_posix(),'sha256':digest(raw)},'seconds':time.monotonic()-begin}
    save(work/'reading.json',result)
    return result

results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    futures={pool.submit(solve,c):c for c in registration['configs']}
    for future in concurrent.futures.as_completed(futures):
        r=future.result();results.append(r)
        if len(results)%32==0 or len(results)<=4:print(json.dumps({'completed':len(results),'total':len(futures),'seconds':time.monotonic()-started,'last':r['config']['id']}),flush=True)
after={p.relative_to(data).as_posix():digest(p) for p in sorted(data.rglob('*')) if p.is_file()}
assert before==after and digest(executable)==installation['expectedSha256']
save(run/'readings.json',sorted(results,key=lambda r:r['config']['id']))
save(run/'solver-verification.json',{'cases':len(results),'elapsedSeconds':time.monotonic()-started,'installedExecutableAndDataUnchanged':True,'photonsPerWavelengthPerRay':registration['photons'],'concurrency':4,'runtime':sys.version})
