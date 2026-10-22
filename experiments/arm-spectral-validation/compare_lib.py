"""Solve full/projected ARM-constrained atmospheres and declared sensitivities."""
import argparse
import json
import math
from pathlib import Path
import sys
sys.dont_write_bytecode=True
from evidence import Run
from model import integral, interp
from solver import execute, installed, sha


def moments(table,count=128):
    """Integrate the piecewise-linear cosine PDF against Legendre polynomials.

    Uses polynomial antiderivatives on every cell; no angular resampling or HG
    substitution. Coefficient0 is1. Coefficient1 is the actual table mean cosine.
    """
    nodes,pdf=table['mu'],table['pdf']
    def primitive(x):
        p=[1,x]
        for n in range(1,count+1):p.append(((2*n+1)*x*p[n]-n*p[n-1])/(n+1))
        ints=[x]+[(p[n+1]-p[n-1])/(2*n+1) for n in range(1,count+1)]
        mu_ints=[x*x/2]+[(n+1)/(2*n+1)*ints[n+1]+n/(2*n+1)*ints[n-1] for n in range(1,count)]
        return ints,mu_ints
    primitives=[primitive(x) for x in nodes]
    output=[0.]*count
    for i,(x,y) in enumerate(zip(nodes,nodes[1:])):
        a=(pdf[i+1]-pdf[i])/(y-x);b=pdf[i]-a*x
        for n in range(count):
            output[n]+=a*(primitives[i+1][1][n]-primitives[i][1][n])+b*(primitives[i+1][0][n]-primitives[i][0][n])
    if abs(output[0]-1)>1e-10:raise ValueError('Phase integral witness failed')
    output[0]=1
    if any(not math.isfinite(x) or abs(x)>1+1e-9 for x in output):raise ValueError('Invalid phase moment')
    return output


def bundle(path, contract, case, representation, scenario, streams, spacing=250):
    """Write a complete explicitly matched scalar continuum optical bundle."""
    profiles=contract['profiles'];channels=contract['channels']
    z=list(range(60000,-1,-spacing))
    if z[-1]!=0:z.append(0)
    path.mkdir()
    def put(name,rows):
        with (path/name).open('x',encoding='utf-8',newline='\n') as stream:
            stream.write('\n'.join(rows)+'\n')
    put('wavelengths.txt',[str(c['wavelengthNanometers']) for c in channels])
    put('solar.txt',[f"{c['wavelengthNanometers']} {c['sourceIrradianceWattsPerSquareMeterPerNanometer']*1000:.16g}" for c in channels])
    put('albedo.txt',[f"{c['wavelengthNanometers']} {max(0,min(1,c['groundAlbedo']+scenario.get('albedoDelta',0))):.16g}" for c in channels])
    full=representation=='full'
    molecular=profiles['molecularFull' if full else 'molecularProjected']
    aerosol=profiles['aerosolFullNormalizedPerMeter' if full else 'aerosolProjectedNormalizedPerMeter']
    ozone=profiles['ozoneFullNormalizedPerMeter' if full else 'ozoneProjectedNormalizedPerMeter']
    put('atmosphere.txt',[f'{h/1000:.9g} {1013.25*math.exp(-h/8000):.16g} 288.15 {2.5469e19*math.exp(-h/8000):.16g}' for h in z])
    molecular_layers=[];aerosol_layers=[];ozone_layers=[]
    for upper,lower in zip(z,z[1:]):
        # Full profile and its refinement preserve the same piecewise-linear source.
        if full:
            molecular_layers.append((upper-lower)*(interp(upper,molecular)+interp(lower,molecular))/2)
            aerosol_layers.append((upper-lower)*(interp(upper,aerosol)+interp(lower,aerosol))/2)
        else:
            hr,hm=profiles['rayleighScaleHeightMeters'],profiles['mieScaleHeightMeters']
            molecular_layers.append(hr*(math.exp(-lower/hr)-math.exp(-upper/hr)))
            aerosol_layers.append((math.exp(-lower/hm)-math.exp(-upper/hm))/-math.expm1(-60000/hm))
        ozone_layers.append((upper-lower)*(interp(upper,ozone)+interp(lower,ozone))/2)
    header=' '.join(str(h/1000) for h in z)
    put('scattering.txt',[header]+[' '.join(map(str,[c['wavelengthNanometers'],*[c['rayleighScatteringPerMeter']*v for v in molecular_layers]])) for c in channels])
    put('absorption.txt',[header]+[' '.join(map(str,[c['wavelengthNanometers'],*[c['ozoneCrossSectionSquareMeters']*profiles['ozoneDobsonUnits']*2.687e20*v for v in ozone_layers]])) for c in channels])
    phase=[moments(c['miePhaseTable']) for c in channels]
    index=[f'{z[0]/1000} NULL']
    for i,(upper,lower) in enumerate(zip(z,z[1:])):
        name=f'aerosol-{i:03d}.txt';index.append(f'{lower/1000} {name}')
        rows=[]
        for c,terms in zip(channels,phase):
            tau=max(0,c['aerosolOpticalDepth']+scenario.get('aodDelta',0))*aerosol_layers[i]
            omega=max(0,min(1,c['mieSingleScatteringAlbedo']+scenario.get('ssaDelta',0)))
            rows.append(' '.join(map(str,[c['wavelengthNanometers'],tau/(upper-lower)*1000,omega,*terms])))
        put(name,rows)
    put('aerosols.txt',index)
    data=json.loads((path.parent/'installation.json').read_text())['dataDirectory']
    put('input.inp',[f'data_files_path {data}/','atmosphere_file atmosphere.txt',
        'source solar solar.txt per_nm','wavelength_grid_file wavelengths.txt','spline_file wavelengths.txt',
        'mol_tau_file sca scattering.txt','mol_tau_file abs absorption.txt','mol_abs_param none',
        'rayleigh_depol 0','earth_radius 6360','aerosol_default','aerosol_file explicit aerosols.txt',
        'albedo_file albedo.txt','zout 0',f"sza {case['solarZenithGeometricDegrees']+scenario.get('zenithDelta',0):.12g}",
        'phi0 0','umu -1','phi 180','rte_solver disort','disort_intcor moments','pseudospherical',f'number_of_streams {streams}',
        'output_user lambda uu','quiet'])
    return {'phaseMoments':phase,'molecularColumnIntegralMeters':sum(molecular_layers),
        'aerosolNormalizedColumn':sum(aerosol_layers),'ozoneNormalizedColumn':sum(ozone_layers),
        'witness':'SourceW*1000=mW; phase moment0=1; umu=-1 views zenith; projected layer columns analytically equal production exponentials'}


def main():
    """Retain central, refinement and correlated-scenario results serially."""
    parser=argparse.ArgumentParser();parser.add_argument('--input-run',required=True)
    args=parser.parse_args()
    with Run('lib-comparison',['compare_lib.py','solver.py','model.py','case.py','netcdf.py'],'M3 conditional libRadtran full/projected spectra and sensitivity') as run:
        parent=run.parent(args.input_run);smoke=run.parent('00022-solver-smoke')
        contract=json.loads((parent/'contract.json').read_text())
        config=json.loads((smoke/'installation.json').read_text());run.json('installation.json',config)
        exe=installed(config['executable'])
        if sha(exe)!=config['expectedSha256']:raise ValueError('Solver changed after smoke')
        # Recheck every installed dependency against the complete smoke identity.
        data_identity=json.loads((smoke/'data-identity.json').read_text())
        for entry in data_identity['files']:
            path=installed(Path(config['dataDirectory'])/entry['path'])
            if sha(path)!=entry['sha256']:raise ValueError('Installed data changed')
        jobs=[]
        pilot,reserved=contract['cases']
        for case in [pilot,reserved]:
            for rep in ['full','projected']:jobs.append((case,rep,{'id':'central'},32,250))
        for rep in ['full','projected']:jobs.append((pilot,rep,{'id':'streams64'},64,250))
        jobs.append((pilot,'full',{'id':'layers125'},32,125))
        for scenario in contract['scenarios']:jobs.append((pilot,'projected',scenario,32,250))
        jobs.append((pilot,'projected',{'id':'solar-halfdegree','zenithDelta':.5},32,250))
        results=[]
        for i,(case,rep,scenario,streams,spacing) in enumerate(jobs):
            key=f"{case['id']}-{rep}-{scenario['id']}"
            run.event('solver',key,completed=i,total=len(jobs))
            path=run.path/key
            witness=bundle(path,contract,case,rep,scenario,streams,spacing)
            elapsed=execute(exe,path,run,timeout=180)
            rows=[[float(x) for x in line.split()] for line in (path/'stdout.txt').read_text().splitlines() if line.strip()]
            if len(rows)!=len(contract['channels']) or any(len(r)!=2 or r[1]<0 or not math.isfinite(r[1]) or r[0]!=c['wavelengthNanometers'] for r,c in zip(rows,contract['channels'])):
                raise ValueError('Unexpected solver output')
            result={'id':key,'case':case['id'],'representation':rep,'scenario':scenario,'streams':streams,
                'spacingMeters':spacing,'solverWallSeconds':elapsed,'rows':rows,'witness':witness}
            run.json(key+'/result.json',result);results.append(result)
            print(json.dumps({'id':key,'seconds':elapsed,'radianceMilliwatts':[r[1] for r in rows]}),flush=True)
        run.json('result.json',{'results':results,'accuracyQualified':False,'units':'mW m^-2 nm^-1 sr^-1',
            'limits':'Conditional inputs, approximate measurement operator, no certified absolute calibration bound; DISORT full orders differs from productionN4'})

if __name__=='__main__':main()
