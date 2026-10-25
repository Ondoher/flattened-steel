"""Scientific figures from already verified trace statistics; no solver or fitting."""
import json, os, pathlib, sys

destination = pathlib.Path(sys.argv[1]).resolve()
libraries = pathlib.Path(sys.argv[2]).resolve()
assert destination.is_dir() and libraries.is_dir()
assert 'tmp/experiments/clean-horizon-profiles/runs/' in destination.as_posix()
sys.path.insert(0, str(libraries / 'python'))
os.environ['MPLCONFIGDIR'] = str(destination / 'matplotlib-cache')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

data = json.loads((destination / 'comparison.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.size': 11, 'svg.fonttype': 'none', 'axes.grid': True,
                     'grid.alpha': .22, 'savefig.facecolor': 'white'})

def save(fig, name):
    fig.canvas.draw()
    for suffix in ['png', 'svg']:
        target = destination / (name + '.' + suffix)
        assert not target.exists()
        fig.savefig(target, dpi=180, bbox_inches='tight', pad_inches=.12)
    plt.close(fig)

for height in [500, 2000]:
    rows = [r for r in data['rows'] if r['height'] == height]
    rows.sort(key=lambda r: r['deltaDegrees'])
    d = np.array([r['deltaDegrees'] for r in rows])
    ref = np.array([r['referenceY'] for r in rows])
    hw = np.array([r['referenceYHalfWidth95'] for r in rows])
    prod = np.array([r['productionY'] for r in rows])
    fine = np.array([r['fineViewY'] for r in rows])
    error = 100 * (prod / ref - 1)
    fine_error = 100 * (fine / ref - 1)
    low = 100 * (prod / (ref + hw) - 1)
    high = 100 * (prod / np.maximum(ref - hw, 1e-20) - 1)
    fig, axes = plt.subplots(1, 3, figsize=(14, 9), sharey=True,
                             gridspec_kw={'width_ratios': [4, 1.7, 3]}, layout='constrained')
    axes[0].fill_betweenx(d, ref-hw, ref+hw, color='black', alpha=.17, label=data['uncertaintyLabel'])
    axes[0].plot(ref, d, color='black', label='MYSTIC all orders')
    axes[0].plot(prod, d, color='#0077ba', label='Production N4, 30 view intervals')
    axes[0].plot(fine, d, '--', color='#c35a10', label='Same N4 field, 480 view intervals')
    axes[0].set_xlabel('Luminance (cd m$^{-2}$), native15 CIE bin integration')
    axes[0].set_ylabel('Degrees above geometric horizon')
    axes[0].legend(fontsize=9, loc='best')
    colors = np.array([[r['productionDisplayRgb'], r['referenceDisplayRgb']] for r in rows]) / 255
    edges = np.r_[max(0, d[0]-(d[1]-d[0])/2), (d[:-1]+d[1:])/2, d[-1]+(d[-1]-d[-2])/2]
    axes[1].pcolormesh([0,1,2], edges, colors, shading='flat', rasterized=True)
    axes[1].set_xticks([.5,1.5], ['Production', 'MYSTIC'], rotation=30)
    axes[1].set_xlabel('Common exposure\nOne color per sampled angular cell')
    axes[1].grid(False)
    axes[2].fill_betweenx(d, low, high, color='#0077ba', alpha=.17)
    axes[2].plot(error, d, color='#0077ba', label='Production / reference − 1')
    axes[2].plot(fine_error, d, '--', color='#c35a10', label='480-interval diagnostic')
    axes[2].axvline(0, color='black', linewidth=.8)
    axes[2].set_xlabel('Relative luminance difference (%)')
    axes[2].legend(fontsize=9)
    axes[0].set_ylim(0,2.03)
    fig.suptitle(f'San Jose noon, {height:,} m — ARM-informed atmosphere\nDirectional trace; same optics/source/black ground, N4 versus all orders')
    save(fig, f'vertical-{height}')

    fig, axes = plt.subplots(2, 1, figsize=(13, 8), sharex=True, layout='constrained')
    axes[0].fill_between(d, ref-hw, ref+hw, color='black', alpha=.17)
    axes[0].plot(d, ref, 'k-', label='MYSTIC all orders, '+str(data['seedCount'])+' seed(s)')
    axes[0].plot(d, prod, color='#0077ba', label='Production N4 / 30 intervals')
    axes[0].plot(d, fine, '--', color='#c35a10', label='Same N4 / 480 intervals')
    axes[0].set_ylabel('Luminance (cd m$^{-2}$)')
    axes[0].legend()
    axes[1].fill_between(d, low, high, color='#0077ba', alpha=.17)
    axes[1].plot(d, error, color='#0077ba')
    axes[1].plot(d, fine_error, '--', color='#c35a10')
    axes[1].axhline(0, color='black', linewidth=.8)
    axes[1].set_ylabel('Production / MYSTIC − 1 (%)')
    axes[1].set_xlabel('Degrees above geometric horizon; fine sampling through 2°, sparse controls to 5°')
    axes[1].set_xlim(0,5.05)
    fig.suptitle(f'Broader vertical context — {height:,} m, San Jose noon')
    save(fig, f'context-{height}')

    selection = []
    for chosen in [min(rows, key=lambda r:r['deltaDegrees']), min(rows,key=lambda r:abs(r['deltaDegrees']-1.2))] + sorted(rows,key=lambda r:abs(r['relativeY']),reverse=True):
        if chosen['queryId'] not in [r['queryId'] for r in selection]: selection.append(chosen)
        if len(selection) == 3: break
    fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharex=True, layout='constrained')
    wavelengths = np.array(data['wavelengthsNanometers'])
    for ax, r in zip(axes, selection):
        spectrum = np.array(r['referenceSpectrum'])
        uncertainty = np.array(r['referenceSpectralHalfWidth95'])
        ax.fill_between(wavelengths, spectrum-uncertainty, spectrum+uncertainty, color='black', alpha=.17)
        ax.plot(wavelengths, spectrum, 'k.-', label='MYSTIC ±95%')
        ax.plot(wavelengths, r['productionSpectrum'], '.-', color='#0077ba', label='Production N4')
        ax.plot(wavelengths, r['fineViewSpectrum'], '--', color='#c35a10', label='480-interval view')
        ax.set_title(f"{r['deltaDegrees']:.4f}° above limb\nY difference {r['relativeY']*100:+.1f}%")
        ax.set_xlabel('Native spectral bin center (nm)')
    axes[0].set_ylabel('Radiance (W m$^{-2}$ sr$^{-1}$ nm$^{-1}$)')
    axes[-1].legend(fontsize=9)
    fig.suptitle(f'Matched ray spectra — {height:,} m; lines connect native15 bin samples')
    save(fig, f'spectra-{height}')

(destination / 'plot-runtime.json').write_text(json.dumps({'matplotlib':matplotlib.__version__,'numpy':np.__version__,'python':sys.version,'figurePolicy':'Only charts of measured/calculated quantities and actual color samples. Numeric results remain selectable JSON/CSV/HTML.'},indent=2))
