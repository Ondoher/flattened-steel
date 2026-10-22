"""Render measured/model zenith colors with one common, documented CIE transform."""
import csv
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys
sys.dont_write_bytecode=True
from evidence import Run, digest
from inventory import REPO_ROOT, checked_path
from model import interp

MATRIX=[[12831/3959,-329/214,-1974/3959],[-851781/878810,1648619/878810,36519/878810],[705/12673,-2585/12673,705/667]]


def xyz_to_rgb(xyz):
    """Convert absolute XYZ to signed linear sRGB/D65 without adaptation."""
    return [sum(a*b for a,b in zip(row,xyz)) for row in MATRIX]


def color(points,cmf):
    """Integrate linear spectra times linear1nm CIE functions exactly per cell."""
    xyz=[0.,0.,0.]
    for wave in range(400,800):
        a,b=interp(wave,points),interp(wave+1,points)
        for axis in range(3):
            x,y=cmf[wave][axis],cmf[wave+1][axis]
            xyz[axis]+=683/1000*(2*a*x+a*y+b*x+2*b*y)/6
    rgb=xyz_to_rgb(xyz);total=sum(xyz)
    return {'xyz':xyz,'linearSrgb':rgb,'xy':[xyz[0]/total,xyz[1]/total],'luminanceCdPerSquareMeter':xyz[1]}


def display(rgb,gain):
    """Apply one exposure and standard sRGB encoding; record any gamut clipping."""
    scaled=[x*gain for x in rgb]
    clipped=[i for i,x in enumerate(scaled) if x<0 or x>1]
    linear=[max(0,min(1,x)) for x in scaled]
    encoded=[12.92*x if x<=.0031308 else 1.055*x**(1/2.4)-.055 for x in linear]
    integer=[round(255*x) for x in encoded]
    return {'rgb8':integer,'hex':'#'+''.join(f'{x:02x}' for x in integer),'clippedChannels':clipped,'gain':gain}


def figure(readings,equal):
    """Create a labelled native SVG whose essential content is the color data."""
    title='Matched zenith colors — equal luminance' if equal else 'Matched zenith colors — common exposure'
    subtitle='Brightness normalized separately; compare hue only.' if equal else 'One exposure for every swatch; measured brightness differences retained.'
    parts=['<svg xmlns="http://www.w3.org/2000/svg" width="980" height="590" viewBox="0 0 980 590">',
        '<rect width="980" height="590" fill="#f4f4f4"/><g font-family="Arial,sans-serif" fill="#222">',
        f'<text x="30" y="35" font-size="23">{title}</text>',f'<text x="30" y="62" font-size="15">{subtitle}</text>',
        '<text x="30" y="86" font-size="14">ARM SGP · 22 August 2023 · looking straight up · 400–800 nm</text>']
    for i,label in enumerate(['ARM measured','libRadtran · full','Production · corrected']):
        parts.append(f'<text x="{30+315*i}" y="122" font-size="19">{label}</text>')
    for j,(case,label) in enumerate([('pilot','Pilot · 22:20–22:24 UTC'),('reserved','Reserved · 22:00–22:04 UTC')]):
        top=168+j*196
        parts.append(f'<text x="30" y="{top-17}" font-size="16">{label}</text>')
        for i,source in enumerate(['ARM','libRadtran','production']):
            entry=next(r for r in readings if r['case']==case and r['source']==source)
            d=entry['equalLuminanceDisplay' if equal else 'commonExposureDisplay']
            parts.append(f'<rect x="{30+315*i}" y="{top}" width="290" height="148" fill="{d["hex"]}" stroke="#bbb"/>')
    parts.append('<text x="30" y="565" font-size="13">CIE 1931 2° → linear sRGB → sRGB encoding. No white-balance adjustment. Conditional model colors.</text></g></svg>')
    return '\n'.join(parts)+'\n'


def main():
    """Authenticate spectra, reuse existing channels and render two matched comparisons."""
    with Run('zenith-swatches',['swatches.py','model.py','case.py','netcdf.py'],'Matched ARM/libRadtran/production zenith color swatches') as run:
        physical=run.parent('00034-visible-inputs')
        generated=run.parent('00035-color-caches')
        library=run.parent('00037-color-lib')
        retained=run.parent('00028-prod-caches')
        old_library=run.parent('00029-lib-comparison')
        observations=run.parent('00023-case-freeze')
        contract=json.loads((physical/'contract.json').read_text())
        prod=json.loads((generated/'corrected-spectra.json').read_text())
        old_prod=json.loads((retained/'corrected-spectra.json').read_text())
        lib=json.loads((library/'result.json').read_text())['results']
        old_lib=json.loads((old_library/'result.json').read_text())['results']
        native=json.loads((observations/'cases.json').read_text())['cases']
        cie_path=checked_path(REPO_ROOT/'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv')
        raw=cie_path.read_bytes()
        if hashlib.md5(raw).hexdigest()!='17cca777db64b17170f06f67ce9d3ab7':raise ValueError('CIE reference changed')
        (run.path/'CIE_xyz_1931_2deg.csv').write_bytes(raw)
        cmf={int(row[0]):list(map(float,row[1:])) for row in csv.reader(raw.decode().splitlines())}
        white=xyz_to_rgb([.3127/.329,1,(1-.3127-.329)/.329])
        if max(abs(x-1) for x in white)>1e-12:raise ValueError('D65 matrix control failed')
        readings=[];spectra=[];native_checks=[];maximum_replay_relative=0
        for case in contract['cases']:
            key=case['id'];wavelengths=[c['wavelengthNanometers'] for c in contract['channels']]
            production={v['wavelengthNanometers']:v['radianceMilliwatts'] for record in [old_prod,prod]
                        for v in record['outputs'] if v['case']==key and v['intervals']==480}
            if sorted(production)!=wavelengths:raise ValueError('Production visible coverage incomplete')
            lib_rows=next(r for r in lib if r['case']==key)['rows']
            old_rows=next(r for r in old_lib if r['id']==key+'-full-central')['rows']
            lookup=dict(lib_rows)
            replay=max(abs(lookup[w]-v)/max(v,1e-12) for w,v in old_rows)
            maximum_replay_relative=max(maximum_replay_relative,replay)
            if replay>1e-5:raise ValueError('Extension changed retained libRadtran channels')
            sets={'ARM':list(zip(wavelengths,case['measuredBandsMilliwatts'])),
                  'libRadtran':lib_rows,'production':[(w,production[w]) for w in wavelengths]}
            for source,points in sets.items():
                if any(v<0 or not math.isfinite(v) for _,v in points):raise ValueError('Invalid spectrum')
                value=color(points,cmf)
                double=color([(w,2*v) for w,v in points],cmf)
                if max(abs(a*2-b) for a,b in zip(value['xyz'],double['xyz']))>1e-9:raise ValueError('Color linearity failed')
                readings.append({'case':key,'source':source,**value})
                spectra.append({'case':key,'source':source,'wavelengthNanometers':[w for w,_ in points],
                                'radianceMilliwattsPerSquareMeterPerSteradianPerNanometer':[v for _,v in points]})
            measured=next(c for c in native if c['id']==key)
            actual=color(list(zip(measured['wavelengthNanometers'],measured['radianceMilliwattsPerSquareMeterPerSteradianPerNanometer'])),cmf)
            common=next(r for r in readings if r['case']==key and r['source']=='ARM')
            native_checks.append({'case':key,'nativeMeasuredColor':actual,
                'sampledMinusNativeChromaticity':[a-b for a,b in zip(common['xy'],actual['xy'])],
                'sampledRelativeLuminanceChangePercent':100*(common['xyz'][1]/actual['xyz'][1]-1)})
        exposure=.85/max(max(r['linearSrgb']) for r in readings)
        equal_y=.85/max(max(r['linearSrgb'])/r['xyz'][1] for r in readings)
        for reading in readings:
            reading['commonExposureDisplay']=display(reading['linearSrgb'],exposure)
            reading['equalLuminanceDisplay']=display(reading['linearSrgb'],equal_y/reading['xyz'][1])
            if reading['commonExposureDisplay']['clippedChannels'] or reading['equalLuminanceDisplay']['clippedChannels']:
                raise ValueError('Unexpected gamut clipping; revise display rather than conceal it')
        run.json('colors.json',{'readings':readings,'commonExposureGain':exposure,'equalDisplayLuminance':equal_y,
            'transform':'CIE1931 2degree,400-800nm exact integral of piecewise-linear spectrum*CMF on1nm cells;683lm/W, inputmW divided1000; preciseD65 XYZ-to-linear-sRGB matrix; standard sRGB encoding; no adaptation',
            'exposureRule':'One gain=.85/maximum linearRGB component across all six readings; no per-source exposure or white balance',
            'equalLuminanceRule':'Separate diagnostic only: each XYZ scaled to the sameY, chosen once to avoid gamut clipping',
            'reference':{'path':cie_path.relative_to(REPO_ROOT).as_posix(),'sha256':digest(cie_path),'md5':'17cca777db64b17170f06f67ce9d3ab7'},
            'nativeSamplingChecks':native_checks,'retainedLibReplayMaximumRelative':maximum_replay_relative,
            'limits':contract['assumptions'],'direction':'Zenith at ARM SGP, nominal90degree elevation, matching pilot/reserved times; not horizon'})
        run.json('spectra.json',spectra)
        for equal,name in [(False,'common-exposure'),(True,'equal-luminance')]:
            svg=run.path/(name+'.svg');svg.write_text(figure(readings,equal),encoding='utf-8',newline='\n')
            with (run.path/(name+'-chrome.log')).open('xb') as log:
                subprocess.run(['C:/Program Files/Google/Chrome/Application/chrome.exe','--headless=new','--no-first-run','--no-default-browser-check',
                    '--disable-background-networking',f'--user-data-dir={run.path / (name+"-profile")}',
                    '--hide-scrollbars','--window-size=980,590',f'--screenshot={run.path / (name+".png")}',svg.as_uri()],
                    stdout=log,stderr=subprocess.STDOUT,check=True,timeout=60)
            if not (run.path/(name+'.png')).is_file():raise ValueError('Swatch image missing')
        run.json('result.json',{'completed':True,'cases':2,'sources':3,'samples':26,'wavelengthRangeNanometers':[400,800],
            'direction':'zenith','existingChannelsUnchanged':True,'retainedLibReplayMaximumRelative':maximum_replay_relative,
            'controls':{'D65white':white,'linearity':True,'gamutClipping':False},'accuracyQualified':False})
        print(json.dumps({'colors':[{k:r[k] for k in ['case','source','xy','luminanceCdPerSquareMeter','commonExposureDisplay','equalLuminanceDisplay']} for r in readings],
                          'nativeSamplingChecks':native_checks,'replayRelative':maximum_replay_relative}),flush=True)

if __name__=='__main__':main()
