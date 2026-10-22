"""Authenticate completed cases, score descriptive residuals and plot spectra."""
import json
import math
import statistics as stats
import sys
sys.dont_write_bytecode=True
from case import plot
from evidence import Run


def metrics(actual,reference):
    """Compute absolute and fractional spectral errors with an explicit low-signal floor."""
    delta=[a-b for a,b in zip(actual,reference)]
    relative=[d/max(abs(b),1) for d,b in zip(delta,reference)]
    return {'rmseMilliwatts':math.sqrt(stats.mean(d*d for d in delta)),
        'biasMilliwatts':stats.mean(delta),'meanRelativeBiasPercent':100*stats.mean(relative),
        'rmsRelativePercent':100*math.sqrt(stats.mean(d*d for d in relative)),
        'maximumAbsoluteRelativePercent':100*max(abs(d) for d in relative)}


def main():
    """Use unchanged primary settings for reserved confirmation; no score-based selection."""
    with Run('comparison',['comparison_report.py','case.py'],'M3/M4 descriptive ARM comparison, numerical and attribution limits') as run:
        physical=run.parent('00025-physical-inputs')
        production=run.parent('00028-prod-caches')
        library=run.parent('00029-lib-comparison')
        refine=run.parent('00030-prod-refinement')
        convergence=run.parent('00031-prod-convergence')
        frozen=run.parent('00023-case-freeze')
        contract=json.loads((physical/'contract.json').read_text())
        observations=json.loads((frozen/'cases.json').read_text())
        prod=json.loads((production/'result.json').read_text())['summaries']
        lib=json.loads((library/'result.json').read_text())['results']
        wave=[c['wavelengthNanometers'] for c in contract['channels']]
        corrected=next(v for v in prod if v['variant']=='corrected')
        legacy=next(v for v in prod if v['variant']=='legacy')
        rows=[];curves={};numerical=[]
        def values(record,case,intervals=480):
            return [r['radianceMilliwatts'] for r in record['outputs'] if r['case']==case and r['intervals']==intervals]
        for case in contract['cases']:
            key=case['id'];arm=case['measuredBandsMilliwatts'];corr=values(corrected,key)
            full=next(r for r in lib if r['id']==key+'-full-central')
            projected=next(r for r in lib if r['id']==key+'-projected-central')
            fv=[v[1] for v in full['rows']];pv=[v[1] for v in projected['rows']]
            curves[key]={'wavelengthNanometers':wave,'ARM':arm,'corrected':corr,'libFull':fv,'libProjected':pv}
            for name,actual,reference in [('corrected/ARM',corr,arm),('lib-full/ARM',fv,arm),('lib-projected/ARM',pv,arm),
                                          ('corrected/lib-projected',corr,pv),('lib-full/lib-projected',fv,pv)]:
                rows.append({'case':key,'comparison':name,**metrics(actual,reference)})
            if key=='pilot':
                old=values(legacy,key);curves[key]['legacy']=old
                rows.append({'case':key,'comparison':'legacy/ARM',**metrics(old,arm)})
                rows.append({'case':key,'comparison':'legacy/lib-projected',**metrics(old,pv)})
            numerical.append({'case':key,'comparison':'production view240/480',**metrics(values(corrected,key,240),corr)})
            observation=next(c for c in observations['cases'] if c['id']==key)
            measured=list(zip(observation['wavelengthNanometers'],observation['radianceMilliwattsPerSquareMeterPerSteradianPerNanometer']))
            series=[('ARM',[(w,v) for w,v in measured if 438<=w<=677]),('production',list(zip(wave,corr))),
                    ('lib projected',list(zip(wave,pv))),('lib full',list(zip(wave,fv)))]
            plot(run.path/f'{key}-spectra.svg',series,'Wavelength (nm)','Radiance (mW / m2 / nm / sr)')
            plot(run.path/f'{key}-residuals.svg',[(name,list(zip(wave,[100*(v/a-1) for v,a in zip(curve,arm)])))
                for name,curve in [('production',corr),('lib projected',pv),('lib full',fv)]],
                'Wavelength (nm)','Residual relative to ARM (%)')
        for representation in ['full','projected']:
            base=next(r for r in lib if r['id']==f'pilot-{representation}-central')
            refined=next(r for r in lib if r['id']==f'pilot-{representation}-streams64')
            numerical.append({'case':'pilot','comparison':f'lib {representation} streams32/64',
                              **metrics([v[1] for v in base['rows']],[v[1] for v in refined['rows']])})
        base=next(r for r in lib if r['id']=='pilot-full-central')
        refined=next(r for r in lib if r['id']=='pilot-full-layers125')
        numerical.append({'case':'pilot','comparison':'lib layers250/125',
                          **metrics([v[1] for v in base['rows']],[v[1] for v in refined['rows']])})
        diagnostics=[]
        primary550=curves['pilot']['corrected'][4]
        for parent in [refine,convergence]:
            for record in json.loads((parent/'result.json').read_text())['summaries']:
                actual=values(record,'pilot')[0]
                diagnostics.append({'variant':record['variant'],'wavelengthNanometers':550,'radianceMilliwatts':actual,
                    'changeFromPrimaryPercent':100*(actual/primary550-1),'buildWallSeconds':record['compilation']['elapsedMilliseconds']/1000})
        scenarios=[r for r in lib if r['case']=='pilot' and r['scenario']['id'] in [s['id'] for s in contract['scenarios']]]
        envelope={'wavelengthNanometers':wave,'minimum':[min(r['rows'][i][1] for r in scenarios) for i in range(len(wave))],
                  'maximum':[max(r['rows'][i][1] for r in scenarios) for i in range(len(wave))],
                  'interpretation':'Selected coherent input scenarios only; no certified total uncertainty or confidence interval'}
        run.json('spectra.json',curves)
        run.json('scores.json',{'units':'mW m^-2 nm^-1 sr^-1','bands':wave,'relativeDenominatorFloor':1,
            'scores':rows,'numericalSensitivity':numerical,'productionDiagnostics550nm':diagnostics,'inputScenarioEnvelope':envelope,
            'disposition':'Inconclusive observational accuracy: unknown absolute calibration and approximate optical/measurement operator. Conditional production/lib agreement and legacy discrepancy are supported only under frozen inputs.',
            'heldOut':'22:00-22:04 selected before predictions; same shared physical mapping and production controls applied without tuning; correlated repeatability, not independent calibration validation'})
        columns=['case','comparison','rmseMilliwatts','biasMilliwatts','meanRelativeBiasPercent','rmsRelativePercent','maximumAbsoluteRelativePercent']
        (run.path/'scores.tsv').write_text('\t'.join(columns)+'\n'+'\n'.join('\t'.join(str(r[c]) for c in columns) for r in rows)+'\n')
        timing={'productionBuildSeconds':{r['variant']:r['compilation']['elapsedMilliseconds']/1000 for r in prod},
            'libSolverSeconds':sum(r['solverWallSeconds'] for r in lib),'libCaseCount':len(lib),
            'scope':'Measured solver/build work, excluding acquisition, startup, hashing, analysis and reporting'}
        run.json('timing.json',timing)
        run.json('result.json',{'completed':'Conditional three-way pilot/confirmation, numerical and scenario characterization',
            'observationalAccuracyQualified':False,'productionChanged':False,'scores':rows,'timing':timing})
        print(json.dumps({'scores':rows,'numericalSensitivity':numerical,'diagnostics':diagnostics,'timing':timing}),flush=True)

if __name__=='__main__':main()
