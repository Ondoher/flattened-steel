import assert from 'node:assert/strict';
import {createRun, verifyRun, readRepository, identity} from '../io/files.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {render} from '../distant-horizon/attribution-common.mjs';
import {packet} from './packet.mjs';
import {color, rgb} from './color.mjs';
import {orderBudget} from './order-budget.mjs';
import {loadCase} from '../paper-b1/diagnosis-data.mjs';
const labels = {
	Baseline40: 'Paper baseline (T40)',
	Corrected60: 'Corrected (T60 + norm)',
	Independent: 'Independent',
	libRadtran: 'libRadtran',
};

/** Read only authenticated finalized reference data.
 * @template T @param {string} root @param {string} file @returns {{seal:DialFileIdentity,value:T}}
 */
function saved(root, file) {
	const seal = verifyRun(root);
	return {seal, value: JSON.parse(readRepository(root + '/' + file).toString())};
}

/** Reduce coherent batch spectra to physical colors and sampling intervals.
 * @param {number[][]} samples @param {PaperRayPacket} p @returns {{spectrum:number[],half:number[],Y:number,Yhalf:number,maxRelative95:number}}
 */
function statistics(samples, p) {
	const spectrum = p.centers.map((_, c) => samples.reduce((s, r) => s + r[c], 0) / samples.length),
		half = p.centers.map((_, c) => halfWidth(samples.map((r) => r[c]))),
		Y = color(spectrum, p.centers).Y;
	return {
		spectrum,
		half,
		Y,
		Yhalf: halfWidth(samples.map((s) => color(s, p.centers).Y)),
		maxRelative95: Math.max(...half.map((h, c) => h / Math.max(1e-12, spectrum[c]))),
	};
}

/** Convert the independent order tallies into cumulative per-batch spectra.
 * @param {PaperRayGpuBatch[]} batches @param {PaperRayPacket} p @param {number} ray @param {number} order
 * @param {string} [profile='main'] @returns {number[][]}
 */
function gpuSamples(batches, p, ray, order, profile = 'main') {
	const count = profile === 'main' ? 24 : 8;
	return Array.from({length: count}, (_, batch) =>
		p.centers.map((_, channel) => {
			const r = batches.find(
				(b) => b.group === ray && b.channel === channel && b.batch === batch && b.profile === profile,
			);
			assert.ok(r);
			return order === 0 ? r.means[0] : r.means.slice(1, order + 1).reduce((s, x) => s + x, 0);
		}),
	);
}

/** Validate geometry/order convention and spectral importance before full references.
 * @param {string} gpuRoot @param {string} libRoot @param {string|undefined} nearRoot @returns {Promise<void>}
 */
async function qualify(gpuRoot, libRoot, nearRoot) {
	const p = packet(),
		g = saved(gpuRoot, 'direct-n1.json'),
		e = saved(libRoot, 'readings.json');
	const near = nearRoot ? saved(nearRoot, 'readings.json') : null;
	const exact = /** @type {{channel:number,ray:string,N1:number,relative64:number}[]} */ (g.value),
		readings = /** @type {PaperRayLibReading[]} */ (e.value);
	if (near) {
		const n = /** @type {PaperRayLibReading[]} */ (near.value);
		assert.equal(n.length, 2);
		const first = n[0];
		readings.splice(
			readings.findIndex((r) => r.config.id === 'n1-near'),
			1,
			{
				...first,
				config: {...first.config, id: 'n1-near'},
				spectrum: first.spectrum.map((_, i) => n.reduce((s, r) => s + r.spectrum[i], 0) / n.length),
			},
		);
	}
	const run = createRun('h57-qualify', {
		parents: [...p.parents, g.seal, e.seal, ...(near ? [near.seal] : [])],
		operation:
			'Pilot validation of MYSTIC maxscatters1 against independent direct N1, ordinary wavelength calculation and128/256 optical-layer refinement.',
		parameters: {N1RelativeTolerance: 0.05, importanceN4RelativeTolerance: 0.08, layerRelativeTolerance: 0.03},
	});
	let failure = null;
	try {
		const checks = [];
		for (const id of ['n1-direct', 'n1-near']) {
			const row = readings.find((r) => r.config.id === id);
			assert.ok(row);
			for (let i = 0; i < row.config.channels.length; i++) {
				const c = row.config.channels[i],
					d = exact.find((r) => r.channel === c && r.ray === p.rays[row.config.ray].id);
				assert.ok(d);
				const relative = row.spectrum[i] / d.N1 - 1;
				checks.push({id, channel: c, relative, dense64Relative: d.relative64});
				assert.ok(Math.abs(relative) < 0.05, `${id} channel${c}: order/geometry mismatch ${relative}`);
				assert.ok(Math.abs(d.relative64) < 1e-5);
			}
		}
		for (const [a, b, limit] of [['n4-direct', 'n4-fine', 0.03]]) {
			const first = readings.find((r) => r.config.id === a),
				second = readings.find((r) => r.config.id === b);
			assert.ok(first && second);
			const relative = first.spectrum.map((v, i) => v / second.spectrum[i] - 1);
			checks.push({a, b, relative});
			assert.ok(
				relative.every((v) => Math.abs(v) < Number(limit)),
				`${a}/${b}: ${relative}`,
			);
		}
		run.write('checks.json', checks);
		run.write('admission.json', {
			accepted: true,
			N1Convention:
				'mc_maxscatters1 matches independent first atmospheric scattering; surface reflection uses the same interaction counter.',
			importance: 'Unavailable in the installed build; all admitted runs calculate each wavelength ordinarily.',
			layerControl: '128/256 prefix4 pilot comparison passes the declared3% criterion.',
			scope: 'Pilot operational and coarse accuracy admission; final sampling precision and convergence remain separately reported.',
		});
	} catch (e) {
		failure = e;
	}
	run.cleanup();
	run.finish(failure ? 'rejected' : 'accepted', {failure: failure ? String(failure) : null});
	verifyRun(run.path);
	assert.equal(failure, null, String(failure));
	console.log(JSON.stringify({run: run.path, accepted: true}));
}

/** Render cumulative-order colors and exact spectral comparisons, explicitly blanking unavailable orders.
 * @param {string} gpuRoot @param {string|undefined} libRoot @returns {Promise<void>}
 */
async function report(gpuRoot, libRoot) {
	const p = packet(),
		g = saved(gpuRoot, 'batches.json'),
		batches = /** @type {PaperRayGpuBatch[]} */ (g.value),
		external = libRoot ? saved(libRoot, 'readings.json') : null,
		readings = /** @type {PaperRayLibReading[]} */ (external?.value ?? []);
	const cacheCases = [
		{label: 'Baseline40', input: p.base},
		{label: 'Corrected60', input: p.joint},
		{label: 'Transport60', input: loadCase('tmp/experiments/sky-accuracy-dials/runs/00349-h56-t60')},
		{label: 'Normalized40', input: loadCase('tmp/experiments/sky-accuracy-dials/runs/00350-h56-norm40')},
	];
	const parents = [
		...p.parents,
		g.seal,
		...cacheCases.slice(2).map((c) => c.input.seal),
		...(external ? [external.seal] : []),
		identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
		identity('src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js'),
	];
	const lux = color(p.rays[0].medium.sourceIrradiance, p.centers).Y;
	const run = createRun(libRoot ? 'h57-order-report' : 'h57-progress', {
		parents,
		operation:
			'Matched Direct40 cumulative1-4, separately reconstructed pure-order errors, all-order tails and swatches/spectra from authenticated numerical results, common CIE midpoint/p2 mapping and paper source illumination, with empirical uncertainty.',
		parameters: {
			gpuRoot,
			libRoot: libRoot ?? null,
			lux,
			centers: p.centers,
			limits: 'Cache is cumulative through4 only. References count Lambertian reflection as an interaction. No per-swatch scaling, normalization, white balance or synthetic order values.',
		},
	});
	let failure = null;
	try {
		const rows = [];
		for (let ray = 0; ray < 3; ray++) {
			const witness = p.rays[ray],
				index = witness.t * 81 + witness.x * 9 + witness.y;
			for (const [method, data] of [
				['Baseline40', p.base],
				['Corrected60', p.joint],
			])
				for (let order = 1; order <= 4; order++) {
					const input = /** @type {B1DiagnosticCase} */ (data),
						spectrum = input.channels.map((c) => c.values[(order - 1) * 1386 + index]);
					rows.push({
						ray,
						method: String(method),
						order,
						spectrum,
						half: Array(40).fill(0),
						Y: color(spectrum, p.centers).Y,
						Yhalf: 0,
						maxRelative95: 0,
					});
				}
			for (const order of [1, 2, 3, 4, 0]) {
				const samples = gpuSamples(batches, p, ray, order),
					s = statistics(samples, p),
					control = gpuSamples(batches, p, ray, order, 'control64'),
					paired = control.map((v, i) => color(v, p.centers).Y - color(samples[i], p.centers).Y);
				rows.push({
					ray,
					method: 'Independent',
					order,
					...s,
					quadratureDeltaY: paired.reduce((a, v) => a + v, 0) / paired.length,
					quadratureDeltaHalf: halfWidth(paired),
				});
				if (libRoot) {
					const r = readings.filter((r) => r.config.ray === ray && r.config.order === order);
					assert.equal(r.length, 4);
					rows.push({
						ray,
						method: 'libRadtran',
						order,
						...statistics(
							r.map((r) => r.spectrum),
							p,
						),
					});
				}
			}
		}
		run.write('comparison.json', {
			rays: p.rays,
			centers: p.centers,
			lux,
			rows,
			precisionTargets: {relativeY95: 0.03, relativeBand95: 0.1},
		});
		const comparison = [
			'ray\tcache\treference\tcumulative_order\tY_cache\tY_reference\tY_reference_95_half\tY_cache_relative_percent\tscored_spectral_RMSE_mW\tscored_spectral_bias_mW',
		];
		const increments = ['ray\tmethod\tinteraction_order\tincrement_Y\tinterpretation'];
		const incrementTotals = new Map();
		for (let ray = 0; ray < 3; ray++)
			for (const method of ['Baseline40', 'Corrected60', 'Independent', 'libRadtran'])
				for (let order = 1; order <= 4; order++) {
					const row = rows.find((r) => r.ray === ray && r.method === method && r.order === order);
					if (!row) continue;
					const previous =
						order > 1
							? rows.find((r) => r.ray === ray && r.method === method && r.order === order - 1)
							: undefined;
					const key = ray + '/' + method;
					incrementTotals.set(key, (incrementTotals.get(key) ?? 0) + row.Y - (previous?.Y ?? 0));
					increments.push(
						[
							p.rays[ray].id,
							method,
							order,
							row.Y - (previous?.Y ?? 0),
							method === 'Independent'
								? 'Physical-order Monte Carlo tally'
								: method === 'libRadtran'
									? 'Difference of separately sampled cumulative prefixes'
									: 'Difference of cumulative cache reconstructions',
						].join('\t'),
					);
					if (method === 'Baseline40' || method === 'Corrected60')
						for (const reference of ['Independent', 'libRadtran']) {
							const target = rows.find(
								(r) => r.ray === ray && r.method === reference && r.order === order,
							);
							if (!target) continue;
							const delta = row.spectrum.slice(0, 31).map((v, c) => v - target.spectrum[c]);
							comparison.push(
								[
									p.rays[ray].id,
									method,
									reference,
									order,
									row.Y,
									target.Y,
									target.Yhalf,
									100 * (row.Y / target.Y - 1),
									1000 * Math.sqrt(delta.reduce((s, v) => s + v * v, 0) / delta.length),
									(1000 * delta.reduce((s, v) => s + v, 0)) / delta.length,
								].join('\t'),
							);
						}
				}
		run.write('cache-to-reference.tsv', comparison.join('\n') + '\n');
		run.write('increment-budget.tsv', increments.join('\n') + '\n');
		const identities = rows
			.filter((r) => r.order === 4)
			.map((r) => ({ray: r.ray, method: r.method, residual: incrementTotals.get(r.ray + '/' + r.method) - r.Y}));
		assert.ok(identities.every((r) => Math.abs(r.residual) < 1e-8));
		run.write('increment-identities.json', identities);
		const orderFigure = orderBudget(run, p, batches, cacheCases);
		const dense = saved(gpuRoot, 'direct-n1.json'),
			direct = /** @type {{channel:number,ray:string,N1:number,relative64:number}[]} */ (dense.value);
		run.write(
			'controls.json',
			{
				directN1: direct.map((d) => {
					const ray = p.rays.findIndex((r) => r.id === d.ray),
						row = rows.find((r) => r.ray === ray && r.method === 'Independent' && r.order === 1);
					assert.ok(row);
					return {
						...d,
						gpuRelative: row.spectrum[d.channel] / d.N1 - 1,
						gpu95Relative: row.half[d.channel] / d.N1,
					};
				}),
				groundOffsetMeters: 1,
				limits: 'Float32 spherical geometry and a1m surface origin offset are numerical approximations; paired source/view quadrature and external layer controls do not certify every aspect of convergence.',
			},
			{
				parents: [g.seal, dense.seal],
				operation:
					'Independent binary64 direct N1 versus GPU Monte Carlo N1; record exact quadrature and empirical sampling differences.',
			},
		);
		const width = 1440,
			height = 1750,
			columns = [1, 2, 3, 4, 0],
			methods = ['Baseline40', 'Corrected60', 'Independent', 'libRadtran'];
		const svg = [
			`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#202124"><text x="20" y="32" font-size="25">Selected paper rays: cumulative scattering orders</text><text x="20" y="57" font-size="14">Direct40, spherical paper atmosphere and spectral grass. Fixed CIE midpoint / production p2 mapping; no exposure fitting.</text><text x="20" y="80" font-size="14">Reference order count includes surface reflection. All orders is distinct from N1-4. Y in cd/m2; +/- empirical95% sampling intervals.</text>`,
		];
		columns.forEach((n, c) =>
			svg.push(
				`<text x="${260 + c * 230}" y="114" font-size="18">${n === 1 ? 'First order N1' : n ? 'Cumulative N1-' + n : 'All orders'}</text>`,
			),
		);
		p.rays.forEach((ray, r) => {
			const top = 150 + r * 510;
			svg.push(
				`<text x="20" y="${top}" font-size="18">${ray.id}: ${ray.time}, elevation ${ray.elevation.toFixed(2)} deg, Sun separation ${ray.separation.toFixed(2)} deg</text>`,
			);
			methods.forEach((method, m) => {
				const y = top + 24 + m * 115;
				svg.push(`<text x="20" y="${y + 40}" font-size="17">${labels[method]}</text>`);
				columns.forEach((order, c) => {
					const row = rows.find((v) => v.ray === r && v.method === method && v.order === order),
						x = 250 + c * 230;
					if (!row) {
						svg.push(
							`<rect x="${x}" y="${y}" width="210" height="66" fill="#eee"/><text x="${x + 8}" y="${y + 36}" font-size="12">${method === 'libRadtran' ? 'Reference pending' : 'Not built beyond N4'}</text>`,
						);
						return;
					}
					const codes = rgb(row.spectrum, p.centers, lux);
					svg.push(
						`<rect x="${x}" y="${y}" width="210" height="66" fill="rgb(${codes.join(',')})"/><text x="${x}" y="${y + 84}" font-size="12">Y ${row.Y.toFixed(1)}${row.Yhalf ? ' +/- ' + row.Yhalf.toFixed(1) : ''}</text><text x="${x}" y="${y + 101}" font-size="11">R/B ${color(row.spectrum, p.centers).RB.toFixed(3)}</text>`,
					);
				});
			});
		});
		svg.push(
			'<text x="20" y="1690" font-size="13">T denotes cache transport intervals. Both cache cases use the same40-wavelength paper physical setup.</text><text x="20" y="1721" font-size="13">Scientific swatches from solved spectra, not scene screenshots. Baseline/corrected are exact saved cache evaluations; references include sampling uncertainty.</text></g></svg>',
		);
		const spectraWidth = 1440,
			spectraHeight = 1350,
			plots = [
				`<svg xmlns="http://www.w3.org/2000/svg" width="${spectraWidth}" height="${spectraHeight}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#202124"><text x="20" y="30" font-size="23">Selected-ray spectra through scattering orders</text><text x="20" y="55" font-size="13">Common scale within each row. W m^-2 sr^-1 nm^-1. Shading: empirical95% sampling intervals, excluding discretization error.</text>`,
			];
		const colors = ['#d16b28', '#9b2e80', '#18865b', '#2669b3'];
		p.rays.forEach((ray, r) => {
			const y = 105 + r * 400;
			plots.push(`<text x="20" y="${y - 10}" font-size="17">${ray.id}: ${ray.time}</text>`);
			const max =
				Math.max(...rows.filter((v) => v.ray === r).flatMap((v) => v.spectrum.map((s, c) => s + v.half[c]))) *
				1.04;
			for (let c = 0; c < 5; c++) {
				const order = columns[c],
					selected = methods
						.map((method, i) => {
							const row = rows.find((v) => v.ray === r && v.method === method && v.order === order);
							return row ? {row, color: colors[i]} : null;
						})
						.filter(Boolean);
				if (!selected.length) continue;
				const x = 60 + c * 275,
					w = 240,
					h = 265,
					top = y + 40;
				plots.push(
					`<text x="${x}" y="${y + 15}" font-size="14">${order === 1 ? 'First order N1' : order ? 'Cumulative N1-' + order : 'All orders'}</text><path d="M${x} ${top}V${top + h}H${x + w}" fill="none" stroke="#aaa"/>`,
				);
				for (const value of [0, max / 2, max]) {
					const yy = top + h - (value / max) * h;
					plots.push(
						`<path d="M${x} ${yy}h${w}" stroke="#eee"/><text x="${x - 4}" y="${yy + 3}" text-anchor="end" font-size="9">${value.toFixed(2)}</text>`,
					);
				}
				for (const wave of [400, 500, 600, 700, 800]) {
					const xx = x + ((wave - 360) / (818.25 - 360)) * w;
					plots.push(
						`<text x="${xx}" y="${top + h + 17}" text-anchor="middle" font-size="10">${wave}</text>`,
					);
				}
				for (const s of selected) {
					const point = (v, i) =>
						`${x + ((p.centers[i] - 360) / (818.25 - 360)) * w},${top + h - (v / max) * h}`;
					if (s.row.half.some((v) => v > 0)) {
						const upper = s.row.spectrum.map((v, i) => point(v + s.row.half[i], i)),
							lower = s.row.spectrum.map((v, i) => point(Math.max(0, v - s.row.half[i]), i)).reverse();
						plots.push(
							`<polygon points="${[...upper, ...lower].join(' ')}" fill="${s.color}" opacity="0.13"/>`,
						);
					}
					plots.push(
						`<polyline points="${s.row.spectrum.map(point).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2"/>`,
					);
				}
				plots.push(`<text x="${x}" y="${top + h + 34}" font-size="11">Wavelength (nm)</text>`);
			}
		});
		methods.forEach((method, i) =>
			plots.push(
				`<text x="${30 + i * 350}" y="1330" font-size="16" fill="${colors[i]}">${labels[method]}</text>`,
			),
		);
		plots.push('</g></svg>');
		await render(run, [
			orderFigure,
			{name: 'swatches', svg: svg.join(''), width, height},
			{name: 'spectra', svg: plots.join(''), width: spectraWidth, height: spectraHeight},
		]);
		const referenceRows = rows.filter((r) => r.method === 'Independent' || r.method === 'libRadtran');
		run.write(
			'precision.json',
			referenceRows.map((r) => ({
				ray: r.ray,
				method: r.method,
				order: r.order,
				Y95Relative: r.Yhalf / r.Y,
				band95MaximumRelative: r.maxRelative95,
				YTargetMet: r.Yhalf / r.Y <= 0.03,
				bandTargetMet: r.maxRelative95 <= 0.1,
				quadratureDeltaY: r['quadratureDeltaY'] ?? null,
				quadratureDeltaHalf: r['quadratureDeltaHalf'] ?? null,
			})),
		);
	} catch (e) {
		failure = e;
	}
	run.cleanup();
	run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null});
	verifyRun(run.path);
	assert.equal(failure, null, String(failure));
	console.log(JSON.stringify({run: run.path}));
}
const mode = process.argv[2];
assert.ok(mode === 'qualify' || mode === 'report');
if (mode === 'qualify') await qualify(process.argv[3], process.argv[4], process.argv[5]);
else await report(process.argv[3], process.argv[4]);
