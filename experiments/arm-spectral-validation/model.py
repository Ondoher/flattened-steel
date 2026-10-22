"""Derive full and representable atmospheres from observations, never radiance fits."""
import ast
import bisect
import json
import math
import re
import statistics as stats
import sys
sys.dont_write_bytecode=True
from case import records, plot
from evidence import Run, digest
from inventory import REPO_ROOT, checked_path
from netcdf import NetCDF

WAVELENGTHS=[440,470,500,530,550,580,610,640,675]


def interp(x, points):
    """Linearly interpolate a sorted measured table with explicit endpoint clamping."""
    if x<=points[0][0]:return points[0][1]
    if x>=points[-1][0]:return points[-1][1]
    i=bisect.bisect_left([p[0] for p in points],x)
    a,b=points[i-1],points[i]
    return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])


def integral(points):
    """Integrate the declared piecewise-linear representation exactly."""
    return sum((b[0]-a[0])*(a[1]+b[1])/2 for a,b in zip(points,points[1:]))


def phase(row,wavelength):
    """Interpolate complete Level1.5 phase values then normalize in cosine space."""
    tables={w:sorted((math.cos(math.radians(float(k.split('[')[0]))),float(v)) for k,v in row.items()
                    if re.fullmatch(r'[\d.]+\['+str(w)+r'nm\]',k)) for w in [440,675,870,1020]}
    if any(len(t)!=83 or any(p[1]<0 for p in t) for t in tables.values()):raise ValueError('Incomplete phase input')
    mu=[p[0] for p in tables[440]]
    values=[interp(wavelength,[(w,tables[w][i][1]) for w in tables]) for i in range(len(mu))]
    area=integral(list(zip(mu,values)))
    return {'mu':mu,'pdf':[v/area for v in values],'preNormalizationIntegral':area}


def main():
    """Freeze the small conditional comparison and coherent sensitivity scenarios."""
    with Run('physical-inputs',['model.py','case.py','netcdf.py'],'M2 physical projection and frozen conditional comparison contract') as run:
        frozen=run.parent('00023-case-freeze')
        optical=run.parent('00009-arm-optics')
        sonde=run.parent('00008-arm-sonde')
        phases=run.parent('00019-phase-coverage')
        smoke=run.parent('00022-solver-smoke')
        source=json.loads((frozen/'cases.json').read_text())
        case=source['cases'][0]
        data=json.loads((smoke/'installation.json').read_text())['dataDirectory']
        from pathlib import Path
        data=Path(data)
        solar_path=data/'solar_flux/atlas_plus_modtran'
        solar=[tuple(map(float,line.split()[:2])) for line in solar_path.read_text().splitlines() if line.strip() and not line.startswith('#')]
        afgl_path=data/'atmmod/afglus.dat'
        afgl=sorted([list(map(float,line.split())) for line in afgl_path.read_text().splitlines() if line.strip() and not line.startswith('#')])
        const_path=checked_path(REPO_ROOT/'scripts/algorithm32/solar-zenith-cache/consts.js')
        cross=ast.literal_eval('['+const_path.read_text().split('SQUARE_METERS = [',1)[1].split('];',1)[0]+']')
        (run.path/'production-consts.js').write_bytes(const_path.read_bytes())
        dayfraction=234+sum(case['utcSecondsInterval'])/2/86400
        aod=min(source['aodLevel2'],key=lambda r:abs(float(r['Day_of_Year(Fraction)'])-dayfraction))
        ssa=next(r for r in source['ssaLevel15'] if r['Time(hh:mm:ss)']=='22:21:37')
        phase_row=next(r for r in records(phases/'phase-level15.body') if r['Date(dd:mm:yyyy)']=='22:08:2023' and r['Time(hh:mm:ss)']=='22:21:37')
        aod_table=sorted((float(re.search(r'(\d+)nm',k)[1]),float(v)) for k,v in aod.items() if re.fullmatch(r'AOD_\d+nm',k) and float(v)>0)
        # Sonde pressure and temperature are measured; above its ceiling extend AFGL
        # with continuity at the last measured density, retaining the assumed extension.
        nc=NetCDF(sonde/'raw/sgpsondewnpnC1.b1.20230822.233100.cdf')
        try:
            z,p,t=nc.read('alt'),nc.read('pres'),nc.read('tdry')
            thermo=sorted((zz-318,pp/(tt+273.15)) for zz,pp,tt in zip(z,p,t) if zz>=300 and pp>0 and -100<tt<60)
        finally:nc.close()
        # Collapse identical sonde altitude entries by their arithmetic mean.
        grouped={}
        for z,v in thermo:grouped.setdefault(z,[]).append(v)
        thermo=sorted((z,stats.mean(v)) for z,v in grouped.items())
        surface=interp(0,thermo)
        ceiling=thermo[-1][0]
        reference=[(r[0]*1000-318,r[1]/r[2]) for r in afgl]
        extension_scale=thermo[-1][1]/interp(ceiling,reference)
        grid=sorted(set([0,60_000,10_000,25_000,40_000]+[z for z in range(0,60001,250)]))
        molecular=[(z,(interp(z,thermo) if z<=ceiling else interp(z,reference)*extension_scale)/surface) for z in grid]
        hr=integral(molecular)
        h=case['lidar']['heightKilometersAGL']
        ext=case['lidar']['profiles']['extinction_be']
        # Omit the near-field overlap region by a prespecified150m cutoff.
        # This is a conditional profile reconstruction, not a quality claim about those bins.
        measured=[(z*1000,stats.mean(row[i] for row in ext)) for i,z in enumerate(h) if .15<=z<=12
                  and all(0<=row[i]<10 for row in ext)]
        if len(measured)<20:raise ValueError('Insufficient lidar support')
        full_shape=[(z,interp(z,measured) if z<=measured[-1][0] else 0) for z in grid]
        aerosol_area=integral(full_shape)
        hm=integral([(z,z*v) for z,v in full_shape])/aerosol_area
        full_shape=[(z,v/aerosol_area) for z,v in full_shape]
        molecular_projected=[(z,math.exp(-z/hr)) for z in grid]
        aerosol_projected=[(z,math.exp(-z/hm)/(hm*-math.expm1(-60000/hm))) for z in grid]
        # Production ozone shape is explicitly representable; actual ozone column is
        # provider metadata in AERONET, not a measured vertical ozone profile.
        ozone_du=float(aod['Ozone(Dobson)'])
        ozone_full=[(z,interp((z+318)/1000,[(r[0],r[4]) for r in afgl])) for z in grid]
        ozone_area=integral(ozone_full)
        ozone_full=[(z,v/ozone_area) for z,v in ozone_full]
        ozone_projected=[(z,max(0,1-abs(z-25000)/15000)/15000) for z in grid]
        earth_distance_scale=1+.033*math.cos(2*math.pi*234/365)
        channels=[]
        for wavelength in WAVELENGTHS:
            optical_depth=math.exp(interp(math.log(wavelength),[(math.log(w),math.log(v)) for w,v in aod_table]))
            phase_table=phase(phase_row,wavelength)
            albedo=interp(wavelength,[(w,float(ssa[f'Surface_Albedo[{w}m]'])) for w in [440,675,870,1020]])
            omega=interp(wavelength,[(w,float(ssa[f'Single_Scattering_Albedo[{w}nm]'])) for w in [440,675,870,1020]])
            irradiance=stats.mean(interp(wavelength-2+i*.05,solar) for i in range(81))*earth_distance_scale/1000
            channels.append({'wavelengthNanometers':wavelength,'aerosolOpticalDepth':optical_depth,
                'sourceIrradianceWattsPerSquareMeterPerNanometer':irradiance,
                'rayleighScatteringPerMeter':1.24062e-6*(wavelength/1000)**-4*surface/(1013.25/288.15),
                'mieExtinctionPerMeter':optical_depth/(hm*-math.expm1(-60000/hm)),
                'mieSingleScatteringAlbedo':omega,'groundAlbedo':albedo,
                'miePhaseTable':{'mu':phase_table['mu'],'pdf':phase_table['pdf']},
                'phaseRawCosineIntegral':phase_table['preNormalizationIntegral'],
                'ozoneCrossSectionSquareMeters':interp(wavelength,[(360+10*i,v) for i,v in enumerate(cross)])})
        profiles={'gridMetersAGL':grid,'molecularFull':molecular,'molecularProjected':molecular_projected,
            'aerosolFullNormalizedPerMeter':full_shape,'aerosolProjectedNormalizedPerMeter':aerosol_projected,
            'ozoneFullNormalizedPerMeter':ozone_full,'ozoneProjectedNormalizedPerMeter':ozone_projected,
            'rayleighScaleHeightMeters':hr,'mieScaleHeightMeters':hm,'sondeCeilingMetersAGL':ceiling,
            'ozoneDobsonUnits':ozone_du,'ozoneMaximumDensityPerCubicMeter':ozone_du*2.687e20/15000,
            'ozoneCrossSectionTable':cross}
        cases=[]
        for c in source['cases']:
            measured_bands=[stats.mean(v for w,v in zip(c['wavelengthNanometers'],c['radianceMilliwattsPerSquareMeterPerSteradianPerNanometer']) if abs(w-channel['wavelengthNanometers'])<=2) for channel in channels]
            apparent=c['solarZenithApparentDegreesMean']; elevation=90-apparent
            refraction=(1.02/math.tan(math.radians(elevation+10.3/(elevation+5.11))))/60
            cases.append({'id':c['id'],'solarZenithGeometricDegrees':apparent+refraction,
                'solarZenithApparentDegrees':apparent,'refractionApproximationDegrees':refraction,
                'utcSecondsInterval':c['utcSecondsInterval'],'measuredBandsMilliwatts':measured_bands,
                'observerAltitudeMetersAGL':0,'reserved':c['reservedForConfirmation']})
        contract={'scope':'Conditional continuum characterization; not certified observational accuracy',
            'channels':channels,'profiles':profiles,'cases':cases,
            'operator':'4nm rectangular bands centered at nine440-675nm continuum positions; solar source averaged on0.05nm grid; approximate unknown instrument response; equal widths so unweighted band RMSE',
            'geometry':'Spherical production; DISORT pseudo-spherical direct beam, moderate SZA. Zenith umu=-1. Instrument collector tilt/FOV treated by geometry sensitivity.',
            'source':{'file':str(solar_path),'sha256':sha_local(solar_path),'units':'installed mW m^-2 nm^-1 converted toW',
                'earthDistanceScale':earth_distance_scale,'formula':'1+.033*cos(2*pi*DOY/365), DOY234'},
            'referenceAtmosphere':{'file':str(afgl_path),'sha256':sha_local(afgl_path)},
            'assumptions':['Lidar below150m filled from first valid height, above12km zero; profile normalized to independent AOD at each wavelength; wavelength-independent shape',
                'Evening sonde profile used; AFGL molecular extension above ceiling; no radiance fitting',
                'AFGL ozone vertical shape normalized to AERONET ancillary297.9DU; projected triangle is a distinct shape',
                'SSA, full phase and spectral ground albedo are conditional Level1.5 retrievals; no measured altitude dependence',
                'Rayleigh uses production scalar lambda^-4 coefficient and measured P/T scaling, zero depolarization in both; polarization unmodeled',
                'Other gas absorption omitted at selected continuum bands; absence is not a verified negligible-error bound',
                'No absolute calibration upper bound; all ARM residuals descriptive and final accuracy disposition must remain inconclusive'],
            'scenarios':[{'id':'aod-low','aodDelta':-.02},{'id':'aod-high','aodDelta':.02},
                {'id':'ssa-low','ssaDelta':-.05},{'id':'ssa-high','ssaDelta':.05},
                {'id':'albedo-low','albedoDelta':-.03},{'id':'albedo-high','albedoDelta':.03},
                {'id':'joint-low','aodDelta':-.02,'ssaDelta':-.05,'albedoDelta':-.03},
                {'id':'joint-high','aodDelta':.02,'ssaDelta':.05,'albedoDelta':.03}],
            'uncertaintyInterpretation':'Coherent deterministic scenario sensitivity, not confidence limits or guaranteed total bounds; AOD .02 from ARM uncertainty guidance, SSA .05 spans same-day variation, albedo .03 exploratory surface mismatch',
            'controls':{'streams':32,'moments':128,'refineStreams':64,'layerSpacingMeters':250,'maximumOrderProduction':4,
                'productionViewIntervals':240,'productionViewRefineIntervals':480}}
        run.json('contract.json',contract)
        plot(run.path/'profiles.svg',[('lidar/AOD',[(z/1000,v*1000) for z,v in full_shape if z<=6000]),
            ('exponential',[(z/1000,v*1000) for z,v in aerosol_projected if z<=6000])],
            'Height AGL (km)','Normalized aerosol density (1/km)')
        run.json('result.json',{'inputsFrozen':True,'noRadianceFitting':True,'observationalAccuracyGate':False,
            'conditionalSolverCharacterizationPermitted':True,'rayleighScaleHeightMeters':hr,'mieScaleHeightMeters':hm,
            'channels':len(channels),'heldOutPreserved':True,'calibrationUpperBound':None})
        print(json.dumps({'rayleighH':hr,'mieH':hm,'ozoneDU':ozone_du,'channels':len(channels)}),flush=True)


def sha_local(path):
    """Identify a referenced installed data file previously authenticated by the smoke."""
    import hashlib
    return hashlib.sha256(path.read_bytes()).hexdigest()

if __name__=='__main__':main()
