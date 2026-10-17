import assert from 'node:assert/strict';
import {color, rgb} from './color.mjs';

/** Render absolute retained-libRadtran discrepancies alongside newly matched physical references.
 * @param {DialRun} run @param {PaperRayPacket} p
 * @param {{ray:number,method:string,order:number,spectrum:number[],half:number[],Y:number,Yhalf:number}[]} rows
 * @param {number} lux @returns {{name:string,svg:string,width:number,height:number}[]}
 */
export function measuredFigures(run, p, rows, lux) {
	const colors = ['#222222', '#d16b28', '#9b2e80', '#18865b', '#2669b3'];
	const labels = [
		'Retained libRadtran total',
		'Baseline T40, N1-4',
		'Corrected T60+norm, N1-4',
		'Independent, all orders',
		'New libRadtran, all orders',
	];
	const width = 1500,
		height = 1320;
	const swatches = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="1020"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#222"><text x="25" y="35" font-size="25">Largest B1 disagreement with retained libRadtran</text><text x="25" y="64" font-size="15">Ranked over all1377 time/ray cells using corrected N4 RMSE,31 scored bands. Colors use all40 bands and one fixed p2 mapping.</text><text x="25" y="87" font-size="14">Cache: N1-4. Physical references: all orders. Retained reference has no order decomposition. Same gain; no exposure fitting.</text>`,
	];
	const plots = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#222"><text x="25" y="34" font-size="25">Worst B1 rays: spectra and signed error against retained libRadtran</text><text x="25" y="60" font-size="14">mW m^-2 sr^-1 nm^-1. Same vertical scale within each column. Shading: empirical95% sampling intervals.</text><text x="25" y="83" font-size="14">Selection uses retained all-order libRadtran outputs. Fresh solvers match the explicit paper packet. Exact RMSE:31 bands360-712.5nm.</text>`,
	];
	const sets = p.rays.map((ray, r) => {
		const measured = Array.from(
			p.target.values.slice((ray.t * 81 + ray.ray) * 40, (ray.t * 81 + ray.ray + 1) * 40),
		);
		const targetColor = color(measured, p.centers);
		const models = ['Baseline40', 'Corrected60', 'Independent', 'libRadtran']
			.map((method) =>
				rows.find(
					(v) =>
						v.ray === r &&
						v.method === method &&
						v.order === (method === 'Independent' || method === 'libRadtran' ? 0 : 4),
				),
			)
			.filter(Boolean);
		const curves = [{spectrum: measured, half: Array(40).fill(0), Y: targetColor.Y, Yhalf: 0}, ...models];
		return {ray, curves, models, measured};
	});
	const metrics = [
		'rank\ttime\tray\televation_deg\tsun_separation_deg\tmethod\tRMSE_vs_retained_lib_mW\tbias_vs_retained_lib_mW\tY\tY_95_half',
	];
	const max =
		Math.max(...sets.flatMap((s) => s.curves.flatMap((c) => c.spectrum.map((v, i) => 1000 * (v + c.half[i]))))) *
		1.04;
	const residualBound =
		Math.max(
			...sets.flatMap((s) =>
				s.models.flatMap((c) => c.spectrum.map((v, i) => 1000 * (Math.abs(v - s.measured[i]) + c.half[i]))),
			),
		) * 1.05;
	for (const [r, {ray, curves, models, measured}] of sets.entries()) {
		const rank = p.ranking[r];
		assert.deepEqual([rank.t, rank.ray], [ray.t, ray.ray]);
		const top = 140 + r * 285;
		swatches.push(
			`<text x="25" y="${top}" font-size="19">#${r + 1}: ${ray.time}; ray${ray.ray}; elevation${ray.elevation.toFixed(2)}deg; Sun separation${ray.separation.toFixed(2)}deg; corrected reference RMSE${rank.correctedRmse.toFixed(2)}</text>`,
		);
		curves.forEach((c, i) => {
			const x = 25 + i * 295,
				delta = c.spectrum.slice(0, 31).map((v, k) => 1000 * (v - measured[k]));
			const rmse = Math.sqrt(delta.reduce((s, v) => s + v * v, 0) / 31),
				bias = delta.reduce((s, v) => s + v, 0) / 31;
			if (i === 1) assert.ok(Math.abs(rmse - rank.baselineRmse) < 1e-8);
			if (i === 2) assert.ok(Math.abs(rmse - rank.correctedRmse) < 1e-8);
			metrics.push(
				[r + 1, ray.time, ray.ray, ray.elevation, ray.separation, labels[i], rmse, bias, c.Y, c.Yhalf].join(
					'\t',
				),
			);
			swatches.push(
				`<text x="${x}" y="${top + 31}" font-size="16">${labels[i]}</text><rect x="${x}" y="${top + 45}" width="275" height="120" fill="rgb(${rgb(c.spectrum, p.centers, lux).join(',')})"/><text x="${x}" y="${top + 188}" font-size="15">Y ${c.Y.toFixed(0)}${c.Yhalf ? ' +/-' + c.Yhalf.toFixed(0) : ''} cd/m2</text><text x="${x}" y="${top + 212}" font-size="15">Reference RMSE ${rmse.toFixed(2)}; bias ${bias.toFixed(2)}</text>`,
			);
		});
		const py = 140 + r * 375;
		plots.push(
			`<text x="25" y="${py}" font-size="19">#${r + 1}: ${ray.time}, ${ray.elevation.toFixed(2)}deg elevation, ${ray.separation.toFixed(2)}deg from Sun</text>`,
		);
		for (let panel = 0; panel < 2; panel++) {
			const x = 85 + panel * 745,
				y = py + 35,
				w = 620,
				h = 250;
			const lo = panel ? -residualBound : 0,
				hi = panel ? residualBound : max;
			const px = (i) => x + ((p.centers[i] - 360) / (818.25 - 360)) * w,
				yy = (v) => y + h - ((v - lo) / (hi - lo)) * h;
			plots.push(
				`<path d="M${x} ${y}V${y + h}H${x + w}" stroke="#777" fill="none"/><text x="${x}" y="${y - 10}" font-size="15">${panel ? 'Signed residual: method minus retained libRadtran' : 'Total spectra: retained / cacheN4 / physical all orders'}</text>`,
			);
			for (const value of panel ? [-residualBound, 0, residualBound] : [0, max / 2, max])
				plots.push(
					`<path d="M${x} ${yy(value)}h${w}" stroke="${value === 0 ? '#999' : '#ddd'}"/><text x="${x - 7}" y="${yy(value) + 4}" text-anchor="end" font-size="12">${value.toFixed(1)}</text>`,
				);
			for (const wave of [360, 450, 550, 650, 720, 818.25]) {
				const xx = x + ((wave - 360) / (818.25 - 360)) * w;
				plots.push(`<text x="${xx}" y="${y + h + 20}" text-anchor="middle" font-size="12">${wave}</text>`);
			}
			curves.forEach((c, i) => {
				const values = c.spectrum.map((v, k) => 1000 * (v - (panel ? measured[k] : 0)));
				if (i > 2) {
					const upper = values.map((v, k) => `${px(k)},${yy(v + 1000 * c.half[k])}`),
						lower = values.map((v, k) => `${px(k)},${yy(v - 1000 * c.half[k])}`).reverse();
					plots.push(
						`<polygon points="${[...upper, ...lower].join(' ')}" fill="${colors[i]}" opacity="0.12"/>`,
					);
				}
				plots.push(
					`<path d="${values.map((v, k) => `${k ? 'L' : 'M'}${px(k)},${yy(v)}`).join(' ')}" stroke="${colors[i]}" fill="none" stroke-width="${i === 0 ? 2 : 2.3}" ${i === 0 ? 'stroke-dasharray="7 5"' : ''}/>`,
				);
			});
		}
	}
	labels.forEach((label, i) =>
		plots.push(`<text x="${25 + i * 295}" y="1300" font-size="15" fill="${colors[i]}">${label}</text>`),
	);
	swatches.push('</g></svg>');
	plots.push('</g></svg>');
	run.write('retained-lib-comparison.tsv', metrics.join('\n') + '\n');
	return [
		{name: 'reference-swatches', svg: swatches.join(''), width, height: 1020},
		{name: 'reference-residuals', svg: plots.join(''), width, height},
	];
}
