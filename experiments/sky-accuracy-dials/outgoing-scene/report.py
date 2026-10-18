"""Derive compact scene comparison images and decoded-pixel/timing statistics.

Called by the immutable Node report owner. Reads only checked experiment runs;
PNG or JSON is returned on stdout so only the owner writes evidence artifacts.
"""
import json
import math
import os
from pathlib import Path
import statistics
import stat
import sys
from io import BytesIO
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

REPO = Path(__file__).resolve().parents[3]
RUNS = REPO / 'tmp/experiments/sky-accuracy-dials/runs'


def checked(name):
    """Resolve an ordinary experiment input, rejecting links along the path."""
    p = REPO / name
    assert p.is_absolute() and p.resolve().is_relative_to(RUNS.resolve())
    cursor = p
    while cursor != REPO:
        assert not cursor.is_symlink() and not (getattr(cursor.lstat(), 'st_file_attributes', 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT)
        cursor = cursor.parent
    assert p.is_file()
    return p


def load(root, name):
    return Image.open(checked(root + '/' + name)).convert('RGB')


def diff_stats(a, b):
    diff = ImageChops.difference(a, b)
    stat = ImageStat.Stat(diff)
    # Decoded 8-bit display differences, not radiometric or spectral RMSE.
    return {'maximumCodeDifference': max(v[1] for v in stat.extrema),
            'meanAbsoluteCodeDifference': sum(stat.mean) / 3,
            'rmsCodeDifference': math.sqrt(sum(v*v for v in stat.rms) / 3),
            'changedPixels': sum(pixel != (0, 0, 0) for pixel in diff.get_flattened_data())}


def font(size):
    return ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', size)


def eotf(value):
    return value/12.92 if value <= .04045 else ((value+.055)/1.055)**2.4


def summary(root):
    data = json.loads(checked(root + '/captures.json').read_text())
    result = json.loads(checked(root + '/result.json').read_text())
    baseline = 'original' if result.get('atmosphereProfile') == 'toronto' else 'deployed'
    entries = []
    for heading in sorted({c['heading'] for c in data}):
        images = {v: load(root, f'{v}-{heading}.png') for v in [baseline, 'corrected', 'focused']}
        item = {'heading': heading, 'focusedVsCorrected': diff_stats(images['focused'], images['corrected']),
                ('focusedVsOriginal' if baseline == 'original' else 'focusedVsDeployed'): diff_stats(images['focused'], images[baseline]), 'variants': {}}
        for capture in [c for c in data if c['heading'] == heading]:
            facts = capture['facts']
            timing = {}
            for key in ['gpuMilliseconds', 'cpuSubmitMilliseconds']:
                values = facts[key]
                timing[key] = ({'count': len(values), 'median': statistics.median(values),
                                'minimum': min(values), 'maximum': max(values)} if values else None)
            image = images[capture['variant']]
            # Sky and near-horizon bands exclude the ground and main review objects.
            # These are decoded display codes; retain fixed coordinates for inspection.
            bands = {}
            horizon_y = 384 + math.tan(math.radians(5)) / (math.tan(math.radians(30)) / (4/3)) * 384
            for name, box in [('upper', (20, 50, 1004, 100)), ('horizon', (20, int(horizon_y)-10, 1004, int(horizon_y)-2))]:
                mean = ImageStat.Stat(image.crop(box)).mean
                bands[name] = {'box': box, 'meanDisplayRgb': mean,
                               'weightedDisplayCode': .2126*mean[0] + .7152*mean[1] + .0722*mean[2],
                               'meanRelativeDisplayLuminance': sum(.2126*eotf(r/255)+.7152*eotf(g/255)+.0722*eotf(b/255) for r,g,b in image.crop(box).get_flattened_data()) / ((box[2]-box[0])*(box[3]-box[1]))}
            item['variants'][capture['variant']] = {'timing': timing, 'displayBands': bands,
                'pixels': [{'x': p['x'], 'y': p['y'], 'rgb': image.getpixel((p['x'], p['y']))}
                           for p in facts['pixelCoordinates']], 'facts': facts}
        entries.append(item)
    identity = None
    if result['profile'] == 'noon':
        identity = diff_stats(load(root, 'corrected-180.png'), load(root, 'identity-180.png'))
        assert identity['maximumCodeDifference'] == 0, 'Identity publication changed decoded pixels'
    return {'scene': result['profile'], 'atmosphereProfile': result.get('atmosphereProfile', 'canonical'), 'entries': entries, 'identityPublication': identity,
            'runtimeScope': '12 warmed samples per view, GPU timer when valid; CPU submit is separate.',
            'photometryScope': 'Display RGB codes and relative display luminance via sRGB EOTF after fixed production mapping; not pre-display physical sky radiance.',
            'legacyIdentity': diff_stats(load('tmp/experiments/sky-accuracy-dials/runs/' + ('00344-h53-scene-tor' if baseline == 'original' else '00343-h53-scene-prod'),'candidate-noon.png'),load(root,'corrected-180.png')) if result['profile']=='noon' else None,
            'densitySpectra': {'corrected': result['baseline']['packetReports']['densitySpectra'],
                               'focused': result['candidate']['packetReports']['densitySpectra']}}


def image(root):
    captures = json.loads(checked(root + '/captures.json').read_text())
    result = json.loads(checked(root + '/result.json').read_text())
    scene = result['profile']
    toronto = result.get('atmosphereProfile') == 'toronto'
    headings = sorted({c['heading'] for c in captures})
    width, panel_h = 512, 384
    out = Image.new('RGB', (width*4, 72 + len(headings)*(panel_h+56)), 'white')
    draw = ImageDraw.Draw(out)
    scene_label = 'sunset +60 minutes' if scene == 'twilight60' else scene
    title = 'H63 | Toronto phase/SSA' if toronto else 'H62'
    draw.text((15, 10), f'{title} | San Jose {scene_label} | matched camera and production display', font=font(23), fill='#182332')
    draw.text((15, 42), 'Native15 / Native48 / F68 / N1-4. Focused uses the H61 outgoing grid. Difference is absolute display-code difference x8.', font=font(17), fill='#334155')
    for row, heading in enumerate(headings):
        images = [load(root, f'{v}-{heading}.png') for v in ['original' if toronto else 'deployed', 'corrected', 'focused']]
        diff = ImageChops.difference(images[1], images[2]).point(lambda value: min(255, value*8))
        labels = ['Toronto: Original15' if toronto else 'Deployed: original15', 'Corrected60: ordinary grid', 'Focused60: Sun-focused grid', '|Focused - Corrected| x8']
        top = 72 + row*(panel_h+56)
        for i, (im, label) in enumerate(zip(images+[diff], labels)):
            draw.text((i*width+12, top+4), f'{heading} deg | {label}', font=font(19), fill='#182332')
            out.paste(im.resize((width, panel_h), Image.Resampling.LANCZOS), (i*width, top+34))
    stream = BytesIO()
    out.save(stream, format='PNG', optimize=True)
    return stream.getvalue()


def spectra(root):
    result = json.loads(checked(root + '/result.json').read_text())
    control = json.loads(checked(root + '/control.json').read_text())
    waves = [c['centerNanometers'] for c in control['baseline']['transportSpec']['domains']['spectrum']['channels']]
    pair = [result['baseline']['packetReports']['densitySpectra'], result['candidate']['packetReports']['densitySpectra']]
    out = Image.new('RGB', (1440, 430), 'white')
    draw = ImageDraw.Draw(out)
    title = 'H63 | Toronto phase/SSA' if result.get('atmosphereProfile') == 'toronto' else 'H62'
    draw.text((16, 8), f"{title} | {result['profile']} | Observer-level cumulative source density",font=font(23),fill='#182332')
    draw.text((16, 40), 'Not integrated pixel radiance. Corrected60: blue; Focused60: orange. Same linear scale within each panel.',font=font(17),fill='#334155')
    for i in range(3):
        x0,y0,w,h=60+i*475,110,380,245
        draw.text((x0,78),pair[0][i]['id'],font=font(19),fill='#182332')
        values=[v for p in pair for v in p[i]['spectrum'] if v is not None]
        maximum=max(values) if values else 1
        maximum=maximum if maximum>0 else 1
        draw.rectangle((x0,y0,x0+w,y0+h),outline='#b9c2cf')
        draw.text((x0,y0-20),f'{maximum:.3g}',font=font(13),fill='#334155')
        for data,color in zip(pair,['#2868b1','#dc7629']):
            points=[(x0+(wave-waves[0])/(waves[-1]-waves[0])*w,y0+h-v/maximum*h) for wave,v in zip(waves,data[i]['spectrum']) if v is not None]
            if len(points)>1:draw.line(points,fill=color,width=3)
        draw.text((x0,y0+h+8),f'{waves[0]:.1f} nm',font=font(14),fill='#334155')
        draw.text((x0+w-60,y0+h+8),f'{waves[-1]:.1f} nm',font=font(14),fill='#334155')
    stream=BytesIO();out.save(stream,format='PNG',optimize=True);return stream.getvalue()


if __name__ == '__main__':
    mode, root = sys.argv[1:]
    if mode == 'summary':
        sys.stdout.write(json.dumps(summary(root), separators=(',', ':')))
    elif mode == 'tools':
        import PIL
        sys.stdout.write(json.dumps({'python':sys.version,'pillow':PIL.__version__}))
    else:
        assert mode in ['image','spectra']
        sys.stdout.buffer.write(image(root) if mode=='image' else spectra(root))
