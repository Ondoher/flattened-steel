import assert from 'node:assert/strict';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {color} from './color.mjs';

/** Retain pure-order budgets and render signed cache errors.
 * @param {DialRun} run @param {PaperRayPacket} p
 * @param {PaperRayGpuBatch[]} batches
 * @param {{label:string,input:B1DiagnosticCase}[]} cases
 * @returns {{name:string,svg:string,width:number,height:number}}
 */
export function orderBudget(run, p, batches, cases) {
	const main = batches.filter((b) => b.profile === 'main');
	assert.equal(main.length, 24 * 40 * 3);
	const lookup = new Map(main.map((b) => [b.group + '/' + b.channel + '/' + b.batch, b]));
	/** @param {number} ray @param {number} order @returns {number[][]} */
	function samples(ray, order) {
		return Array.from({length: 24}, (_, batch) =>
			p.centers.map((_, c) => {
				const b = lookup.get(ray + '/' + c + '/' + batch);
				assert.ok(b);
				return order === 0 ? b.means[0] - b.means.slice(1, 5).reduce((s, v) => s + v, 0) : b.means[order];
			}),
		);
	}
	/** @param {number[][]} set @returns {{spectrum:number[],Y:number,Yhalf:number}} */
	function stats(set) {
		const spectrum = p.centers.map((_, c) => set.reduce((s, v) => s + v[c], 0) / set.length);
		return {spectrum, Y: color(spectrum, p.centers).Y, Yhalf: halfWidth(set.map((v) => color(v, p.centers).Y))};
	}
	/** @type {PaperRayBudgetRow[]} */ const rows = [];
	const reconstruction = [],
		tails = [];
	for (let ray = 0; ray < 3; ray++) {
		const witness = p.rays[ray],
			index = witness.t * 81 + witness.x * 9 + witness.y;
		for (let order = 1; order <= 4; order++)
			rows.push({
				ray,
				method: 'Independent',
				order,
				...stats(samples(ray, order)),
				interpretation: 'Isolated physical interaction order from the same Monte Carlo histories.',
			});
		const through4 = rows.filter((r) => r.ray === ray).reduce((s, r) => s + r.Y, 0);
		tails.push({ray, witness: witness.id, ...stats(samples(ray, 0)), through4Y: through4});
		for (const {label, input} of cases) {
			let sum = 0;
			for (let order = 1; order <= 4; order++) {
				const spectrum = input.channels.map((c) => c.metadata.compilerReport.pureRaySpectra[order - 1][index]);
				assert.ok(spectrum.every(Number.isFinite));
				const Y = color(spectrum, p.centers).Y;
				sum += Y;
				rows.push({
					ray,
					method: label,
					order,
					spectrum,
					Y,
					Yhalf: 0,
					interpretation:
						'Saved separately reconstructed pure-order cache field; not a difference of cumulative reconstructions.',
				});
				const cumulativeY = color(
					input.channels.map((c) => c.values[(order - 1) * 1386 + index]),
					p.centers,
				).Y;
				reconstruction.push({
					ray,
					method: label,
					order,
					cumulativeY,
					pureSumY: sum,
					remainderY: cumulativeY - sum,
				});
			}
		}
	}
	const tsv = ['ray\tmethod\torder\tY\tY_95_half\terror_vs_independent_Y\tscored_spectral_RMSE_mW\tinterpretation'];
	for (const row of rows) {
		const ref = rows.find((r) => r.ray === row.ray && r.order === row.order && r.method === 'Independent');
		assert.ok(ref);
		const delta = row.spectrum.slice(0, 31).map((v, c) => v - ref.spectrum[c]);
		tsv.push(
			[
				p.rays[row.ray].id,
				row.method,
				row.order,
				row.Y,
				row.Yhalf,
				row.Y - ref.Y,
				1000 * Math.sqrt(delta.reduce((s, v) => s + v * v, 0) / 31),
				row.interpretation,
			].join('\t'),
		);
	}
	run.write('pure-orders.json', rows);
	run.write('pure-orders.tsv', tsv.join('\n') + '\n');
	run.write('reconstruction.json', reconstruction);
	run.write(
		'tail.json',
		tails.map((t) => ({...t, relativeToN4: t.Y / t.through4Y, relativeHalfToN4: t.Yhalf / t.through4Y})),
	);
	const plotted = ['Baseline40', 'Corrected60'],
		colors = ['#d16b28', '#9b2e80'];
	const effects = rows
		.filter((r) => plotted.includes(r.method))
		.map((r) => {
			const ref = rows.find((v) => v.ray === r.ray && v.order === r.order && v.method === 'Independent');
			assert.ok(ref);
			return {...r, error: r.Y - ref.Y, half: ref.Yhalf};
		});
	const bound = Math.ceil(Math.max(...effects.map((r) => Math.abs(r.error) + r.half)) / 50) * 50;
	const width = 1440,
		height = 740,
		zero = 365,
		scale = 185 / bound;
	const s = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#202124"><text x="24" y="32" font-size="24">Where order errors cancel: cache minus independent physical reference</text><text x="24" y="58" font-size="14">Brightness error in cd/m2 for each separately reconstructed pure order. Positive = too bright; negative = too dim.</text>`,
	];
	['Paper baseline (transport40)', 'Corrected (transport60 + normalized Mie)'].forEach((label, i) =>
		s.push(
			`<rect x="${30 + i * 550}" y="79" width="23" height="13" fill="${colors[i]}"/><text x="${63 + i * 550}" y="91" font-size="16">${label}</text>`,
		),
	);
	p.rays.forEach((ray, r) => {
		const left = 30 + r * 470,
			x = left + 50,
			w = 375;
		s.push(
			`<text x="${left}" y="128" font-size="18">${ray.id}</text><text x="${left}" y="151" font-size="13">${ray.elevation.toFixed(2)} deg elevation; ${ray.separation.toFixed(2)} deg from Sun</text>`,
		);
		for (let t = -2; t <= 2; t++) {
			const value = (t * bound) / 2,
				y = zero - value * scale;
			s.push(
				`<path d="M${x} ${y}H${x + w}" stroke="${t === 0 ? '#555' : '#ddd'}" fill="none"/><text x="${x - 7}" y="${y + 4}" text-anchor="end" font-size="12">${value.toFixed(0)}</text>`,
			);
		}
		for (let order = 1; order <= 4; order++) {
			const center = x + 45 + (order - 1) * 85;
			s.push(`<text x="${center + 12}" y="582" text-anchor="middle" font-size="16">N${order}</text>`);
			plotted.forEach((method, m) => {
				const e = effects.find((e) => e.ray === r && e.order === order && e.method === method);
				assert.ok(e);
				const bx = center - 16 + m * 28,
					y = zero - e.error * scale;
				s.push(
					`<rect x="${bx}" y="${Math.min(zero, y)}" width="23" height="${Math.max(0.5, Math.abs(e.error) * scale)}" fill="${colors[m]}"/><path d="M${bx + 11.5} ${zero - (e.error + e.half) * scale}V${zero - (e.error - e.half) * scale}M${bx + 7} ${zero - (e.error + e.half) * scale}h9M${bx + 7} ${zero - (e.error - e.half) * scale}h9" stroke="#222" stroke-width="1" fill="none"/>`,
				);
			});
		}
		const ref = rows.filter((v) => v.ray === r && v.method === 'Independent').reduce((a, v) => a + v.Y, 0);
		plotted.forEach((method, m) => {
			const cumulative = reconstruction.find((v) => v.ray === r && v.method === method && v.order === 4);
			assert.ok(cumulative);
			s.push(
				`<text x="${left}" y="${620 + 25 * m}" font-size="15" fill="${colors[m]}">Through-N4 total error: ${(cumulative.cumulativeY - ref).toFixed(1)} cd/m2</text>`,
			);
		});
	});
	s.push(
		'<text x="24" y="691" font-size="13">Whiskers: shared independent-reference empirical95% intervals. Do not add them as independent errors.</text><text x="24" y="716" font-size="13">Total errors include the cumulative-reconstruction remainder, recorded separately. Physical reference and cache use the same paper atmosphere and grass.</text></g></svg>',
	);
	return {name: 'order-errors', svg: s.join(''), width, height};
}
