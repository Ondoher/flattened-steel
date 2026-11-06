import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {PNG} from 'pngjs';
import puppeteer from 'puppeteer';
import {createRun, checked, identity} from './io.mjs';
import {acceptedRuns, readEvidence, runsRoot} from './evidence.mjs';
import {color, errors} from './color.mjs';
import {integrated, quantile} from './analysis.mjs';
import {diskRadius} from './geometry.mjs';
import {altitudes, topology} from './topology.mjs';
import {reportClient} from './report-client.mjs';

const development = acceptedRuns('m3-dev-analysis').at(-1);
const validation = acceptedRuns('m3-validation').at(-1);
const selection = acceptedRuns('m3-selection').at(-1);
const native = acceptedRuns('m3-guide-merged').at(-1);
const timing = acceptedRuns('m3-timing').at(-1);
const optics = acceptedRuns('m3-optics').at(-1);
const production = acceptedRuns('m3-prod-control').at(-1);
const awayProof = acceptedRuns('m3-away-proof').at(-1);
assert.ok(
	[development, validation, selection, native, timing, optics, production, awayProof].every(Boolean),
	'Complete all measurement parents before final reporting.',
);
const parents = [development, validation, selection, native, timing, optics, production, awayProof];
const run = createRun('m4-report', [
	...parents.map((p) => identity(`${p}/manifest.json`)),
	identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
]);
let browser;
let failure;
try {
	const dev = readEvidence(`${development}/results.json`);
	const val = readEvidence(`${validation}/results.json`);
	assert.ok(!val.selectionChanged, 'A changed selection requires fresh confirmation before this final report.');
	const frozen = readEvidence(`${selection}/selection.json`);
	const nativeRows = readEvidence(`${native}/readings.json`);
	const productionControl = readEvidence(`${production}/results.json`);
	const opticsControl = readEvidence(`${optics}/results.json`);
	const nativeMap = new Map(nativeRows.map((row) => [row.id, row]));
	const guides = dev.results[0].physical.map((row) => {
		const guide = nativeMap.get(row.id);
		assert.ok(guide, `Missing actual guide spectrum: ${row.id}`);
		const validSigma = guide.standardError.every((v) => v !== null);
		const half95 = validSigma ? 1.96 * integrated(guide.standardError) : null;
		const radiance = integrated(guide.spectrum);
		return {
			...guide,
			color: color(guide.spectrum),
			highColor: color(guide.spectrum, 0.48),
			probeDifference: errors(guide.spectrum, row.spectra[1]),
			uncertaintyLabel: validSigma
				? radiance > 0
					? 'Conservative band 95% allowance ' +
						((100 * half95) / radiance).toFixed(1) +
						'%; native all-orders/slab guide'
					: 'No recorded photons; native zero estimate does not establish a tight upper bound'
				: 'Native uncertainty unavailable in channels ' +
					guide.unavailableUncertaintyChannels.join(', ') +
					'; dark/rare-event guide unresolved',
		};
	});
	const timingRegistration = readEvidence(`${timing}/registration.json`);
	const timings = frozen.counts.map((count) => {
		const builds = Array.from(
			{length: timingRegistration.repeats},
			(_, i) => readEvidence(`${timing}/candidate-n${count}-s500-r${i}.json`).metadata,
		);
		const values = builds.map((b) => b.buildMilliseconds);
		return {
			count,
			source: 500,
			median: quantile(values, 0.5),
			minimum: Math.min(...values),
			maximum: Math.max(...values),
			builds,
		};
	});
	const results = dev.results.map((result) => ({
		...result,
		physical: result.physical.map((row) => ({
			...row,
			highColors: row.spectra.map((s) => color(s, 0.48)),
			unresolvedZeroHigherOrders:
				row.physical.end > row.physical.entry
					? [1, 2, 3]
							.filter((order) => row.perOrder[order].referenceIntegrated === 0)
							.map((order) => order + 1)
					: [],
		})),
	}));
	const strips = [];
	for (const count of frozen.counts) {
		for (const source of [375, 500, 625]) {
			const layout = topology(count, (diskRadius * source) / 1000);
			strips.push({
				count,
				source,
				rows: altitudes.map((z, zi) => {
					const row = layout.rows[zi * 17 + 8];
					const adjacentTo = [2, 100, 1000, 5000, 10000, 20000, 40000].filter(
						(height) =>
							(z <= height && height <= (altitudes[zi + 1] ?? z)) ||
							((altitudes[zi - 1] ?? z) <= height && height <= z),
					);
					const nominal = Array.from({length: count}, (_, i) => (100000 - z) * (i / (count - 1)) ** 2);
					return {
						z,
						adjacentTo,
						nodes: layout.nodes.slice(row.offset, row.offset + row.count).map((node) => ({
							meters: node.distance,
							fraction: node.distance / Math.max(1, 100000 - z),
							boundary: !nominal.some((d) => Math.abs(d - node.distance) <= 1e-7),
						})),
					};
				}),
			});
		}
	}
	const data = {
		diskRadius,
		results,
		validation: val,
		selection: frozen,
		guides,
		timings,
		strips,
		parents,
		referenceFloors: dev.floors,
		units: 'Spectral radiance W m^-2 sr^-1 nm^-1; integrated radiance W m^-2 sr^-1; photopic luminance cd m^-2.',
		coverage:
			'567 development rays,144 held-out rays,9 boundary/mirror controls, Native15 full360-830nm bins, three finite-point-Sun map radii. Cumulative order1-4; pure orders retained. libRadtran uses all orders in a local-height slab with locally matched parallel source.',
		display:
			'Measured spectra integrated with authenticated CIE1931 two-degree1nm table and Native15 bin widths. D65 linear-sRGB matrix; common exposure0.06, secondary0.48. No per-cell fitting, normalization, white balance, or auto-exposure. DeltaE76 uses the same fixed D65 exposure. Clipping flags retained.',
		uncertainty:
			'Eight8192-path batch means per active ray/channel. Direct J1 control variate; raw sampled J1 sanity retained. Student t(df7)=2.365 marginal intervals. Integrated spectral/color batch covariance retained. Conservative sum of channel95% half-widths is a descriptive allowance, not a simultaneous95% family-wise guarantee. Native standard deviations are actual mc_std output; unavailable/zero-photon cells do not provide reliable relative precision.',
		measurement:
			'Three fresh field builds per count at the middle Sun offset in a single idle GPU/browser campaign. Programs reused between fields; no field reused. Compilation, first query lazy work, field inspection, and uploads separately recorded. Primary build excludes inspection. Browser wall times with gl.finish/readback, not timer-query GPU time. Source-offset ranges come from single discovery observations; source .375/.625 are not triplicate timing claims. CPU typed input/inspection payloads recorded; opaque driver/program memory and JS-object heap not measured.',
	};
	Object.assign(data, {
		timingEnvironment:
			'This experiment reference GPU jobs were closed during repeated field measurements. External workstation activity and hardware-level GPU isolation were not controlled; reported values are observed workstation wall times.',
		guideCoverage:
			'Actual native swatches cover the567 development rays. The144 held-out rays and nine boundary/mirror controls are cache/probe comparisons; no native finite-cap control is implied.',
		zeroEventPolicy:
			'All-zero sampled higher orders in nonempty atmosphere are unresolved rare-event estimates. Their zero sample variance is not proof of an exactly zero physical order. Dark per-order cases are excluded from relative-error summaries; raw batches and absolute error remain available.',
		awayGuideSharedPhysics: readEvidence(`${awayProof}/results.json`),
		timingTelemetry: readEvidence(`${timing}/telemetry.json`),
		productionControl,
		opticsControl,
		productionComparison: results.map((r) => ({
			count: r.count,
			cases: r.builds.map((b) => ({
				sourceRadius: b.sourceRadius,
				positionNodeRatio: b.nodes / productionControl.nodes,
				estimatedSingleFieldAtProductionOutgoingResolutionBytes:
					b.nodes * productionControl.outgoingDirections * productionControl.wavelengths * 4,
				note: 'Source-derived scalar estimate, not measured allocation/build or a qualified resolution transfer.',
			})),
		})),
	});
	run.write('results.json', data);
	run.write(
		'reference-compatibility.csv',
		'observable,candidate,independent_probe,libRadtran\nPure_J1,analytic_source_and_view_integration,converged_binary64_control_variate_with_raw_GPU_sanity,not_separated\nPure_J2_J3_J4,deterministic_cached_Neumann_orders,independently_sampled_same_cap_and_finite_source,not_separated\nCumulative_J1_J4,supports_primary_count_errors,matched_geometry_and_order_reference,all_orders_slab_parallel_guide_not_a_J4_tier_reference\nSource_and_view_transmission,actual_shader_compared_on576_rays,independent_binary64_geometry_and_columns,native_internal_only_not_exported_as_transmittance\nAll_orders_radiance,not_implemented_beyond_J4,matched_slab_parallel_controls_only,actual_local_height_slab_parallel_source_all_orders_with_native_sigma\nColor,Native15_spectrum_same_CIE_display,Native15_spectrum_same_CIE_display,actual_Native15_guide_spectrum_same_CIE_display_with_geometry_limitations\n',
	);
	const csv = [
		'count,id,altitude_m,cap_distance_m,source_radius_m,view,spectral_percent,luminance_percent,deltaE76,absolute_radiance_error,probe_integrated_half95,probe_band_allowance,cache_rgb,probe_rgb,native_rgb,native_unavailable_sigma',
	];
	for (const result of results) {
		for (const row of result.physical) {
			const guide = guides.find((g) => g.id === row.id);
			csv.push(
				[
					result.count,
					row.id,
					row.physical.altitude,
					row.physical.distance,
					row.physical.sourceRadius,
					row.physical.view,
					100 * row.perOrder[4].relative,
					100 * row.luminanceRelative,
					row.deltaE76,
					row.perOrder[4].absolute,
					row.perOrder[4].integratedHalf95,
					row.perOrder[4].conservativeBandHalf95,
					row.colors[0].rgb.join(':'),
					row.colors[1].rgb.join(':'),
					guide.color.rgb.join(':'),
					guide.unavailableUncertaintyChannels.join(':'),
				].join(','),
			);
		}
	}
	run.write('accuracy.csv', csv.join('\n') + '\n');
	run.write(
		'validation.csv',
		'count,p95_percent,maximum_percent\n' +
			val.results
				.map((r) => [r.count, r.summary.spectral.p95 * 100, r.summary.spectral.maximum * 100].join(','))
				.join('\n') +
			'\n',
	);
	run.write(
		'summary.csv',
		'count,dev_p95_percent,validation_p95_percent,max_resident_mib,middle_sun_build_median_s,build_min_s,build_max_s\n' +
			results
				.map((r) => {
					const t = timings.find((t) => t.count === r.count);
					return [
						r.count,
						r.summary.spectral.p95 * 100,
						val.results.find((v) => v.count === r.count).summary.spectral.p95 * 100,
						Math.max(...r.builds.map((m) => m.retainedCacheTextureBytes)) / 1048576,
						t.median / 1000,
						t.minimum / 1000,
						t.maximum / 1000,
					].join(',');
				})
				.join('\n') +
			'\n',
	);
	for (const result of results) {
		for (const source of [375, 500, 625]) {
			const rows = result.physical.filter(
				(r) => Math.round((r.physical.sourceRadius / diskRadius) * 1000) === source,
			);
			for (const exposure of [0.06, 0.48]) {
				const image = new PNG({width: 600, height: rows.length * 14});
				for (const [index, row] of rows.entries()) {
					const guide = guides.find((g) => g.id === row.id);
					const colors =
						exposure === 0.06 ? [...row.colors, guide.color] : [...row.highColors, guide.highColor];
					for (let method = 0; method < 3; method++) {
						for (let y = index * 14; y < (index + 1) * 14; y++) {
							for (let x = method * 200; x < (method + 1) * 200; x++) {
								const offset = (y * 600 + x) * 4;
								for (let k = 0; k < 3; k++) {
									image.data[offset + k] = colors[method].rgb[k];
								}
								image.data[offset + 3] = 255;
							}
						}
					}
				}
				run.write(`swatches-n${result.count}-s${source}-${exposure}.png`, PNG.sync.write(image));
			}
		}
		run.progress('plates', `Generated physical three-method PNG plates for N=${result.count}.`);
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	const worstHighOrders = results.find((r) => r.count === 12).summary.pureOrders;
	const description = `# Flat dome quadratic slice-count results\n\nStudied counts: ${frozen.counts.join(', ')}. Retain N12 as a provisional balanced study configuration and N6 as a lower-cost comparison; these are measured compromises, not production approval or a universal optimum.\n\n|N|Development p95|Held-out p95|Maximum resident MiB|Middle-Sun build median s|\n|---:|---:|---:|---:|---:|\n${results.map((r) => `|${r.count}|${(r.summary.spectral.p95 * 100).toFixed(3)}%|${(val.results.find((v) => v.count === r.count).summary.spectral.p95 * 100).toFixed(3)}%|${(Math.max(...r.builds.map((m) => m.retainedCacheTextureBytes)) / 1048576).toFixed(2)}|${(timings.find((t) => t.count === r.count).median / 1000).toFixed(3)}|`).join('\n')}\n\nThe high-count floor is partly angular: doubling construction quadrature barely changes it; increasing angular support improves it, while doubling source-distance support alone does not. These separate controls diagnose the primary representation; they do not silently replace it. Pure higher-order relative errors are materially larger than cumulative errors: N12 J2/J3/J4 p95=${worstHighOrders
		.slice(1)
		.map((r) => (100 * r.p95).toFixed(2) + '%')
		.join(
			'/',
		)}.\n\nNative outputs are actual libRadtran MYSTIC calculations, but local-height slab/parallel-source/all-orders geometry is unmatched to finite-cap/finite-source J4. Dark estimates can have substantial photon noise or unavailable native standard deviations. Guide swatches are not a substitute for matched accuracy.\n\nThe standalone index.html contains filters, all physical swatches, node strips, metrics, reference uncertainty, and links to CSV/JSON/PNG. results.json retains spectra, XYZ/RGB/Lab, clipping flags, per-order errors, controls, strata, timing metadata, and derivation parents. No other slice distribution or production update was attempted.\n`;
	const productionNotice = `This study uses 96 incoming and 98 outgoing angular directions. Existing production uses ${productionControl.incomingDirections} incoming/${productionControl.outgoingDirections} outgoing directions and ${productionControl.nodes} positions; its source-derived single FP32 field payload is ${(productionControl.nominalSingleFloatFieldBytes / 1048576).toFixed(2)} MiB. The experiment has different geometry, positions, representation, and angular precision. Its measured memory/build times do not predict production performance at production angular resolution. The JSON includes position-node ratios and explicitly estimated scalar payloads at the existing outgoing resolution; these are not measured builds. Actual source/view attenuation absolute discrepancies are ${opticsControl.maximumSourceAbsoluteError.toExponential(3)}/${opticsControl.maximumViewAbsoluteError.toExponential(3)}.`;
	run.write('summary.md', description + '\n' + productionNotice + '\n');
	const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Flat dome cache: quadratic slice counts</title><style>body{background:#121212;color:#eee;font:15px system-ui;margin:28px;line-height:1.45}a,button{color:#abd3fa}h1{font-size:28px}p{max-width:1100px}table{border-collapse:collapse;width:100%;margin:18px 0}td,th{border:1px solid #555;padding:9px;text-align:left;vertical-align:top}th{background:#252525}button,select{background:#191919;color:#abd3fa;border:1px solid #888;padding:5px;font:inherit}.filters{display:flex;gap:18px;flex-wrap:wrap;position:sticky;top:0;background:#121212;padding:12px 0}.swatch{height:62px;min-width:150px;border:1px solid #aaa}small{font-size:11px}#strips svg{display:block;width:100%;height:28px}#strips>div{margin:12px 0}.scope{border-left:4px solid #abd3fa;padding-left:15px}details{max-width:360px}</style><h1>Flat dome cache: quadratic slice-count study</h1><p class="scope">All colors below come from measured spectral radiance. The independent probe matches the finite cap and finite point source through fourth scattering order. Actual libRadtran colors are explicitly a local-height slab, parallel-source, all-orders guide. Native guide differences do not enter cache J4 accuracy tiers.</p><p>Provisional study choices: <strong>N12 balanced</strong>, <strong>N6 lower cost</strong>. The untouched 144-ray validation matrix retained these point-estimate comparison tiers. No globally optimal count, universal sub-percent accuracy, exact native dome validation, or production readiness is claimed.</p><p><a href="summary.md">Concise result summary</a> · <a href="summary.csv">Count summary CSV</a> · <a href="accuracy.csv">All development rows CSV</a> · <a href="validation.csv">Held-out CSV</a> · <a href="results.json">Complete spectra, metrics, controls, provenance JSON</a></p><h2>Count / accuracy / size / construction</h2><p>Primary error is integrated absolute spectral error / integrated independent radiance, with fixed reference-only dark floors. Equal weight per non-dark physical case; vacuum controls retained separately. Resident sizes include cumulative field and lookup textures; peak includes build/verification fields. All higher-order fields can be released after accumulation. Timings are three fresh middle-Sun builds with reused programs, excluding inspection. Source-offset ranges are discovery observations.</p><table id="summary"></table><h2>Descriptive accuracy tiers</h2><p>These are engineering comparisons, not owner-selected requirements. Sampling allowances are descriptive conservative band sums, not simultaneous confidence guarantees. Probe integrated-radiance p95 marginal95% half-width is approximately 0.266% on development cases.</p><ul id="tiers"></ul><h2>Non-slice error controls</h2><table id="diagnostics"></table><p>Path:24→48 integration nodes; angle:8×12→12×16 incoming quadrature plus two polar outgoing addresses; beta:17→33 source-distance rows. All use N32, quadratic distance placement, and the same middle-Sun development rays. Angular refinement improves the plateau; it does not establish convergence. Future work should improve directional representation before assuming additional distance slices solve the remaining error.</p><h2>Measured colors by physical position</h2><div class="filters">${['count', 'source', 'altitude', 'view', 'exposure'].map((id) => `<label id="control-${id}">${id === 'source' ? 'Sun map radius / disk radius ×1000' : id}<br></label>`).join('')}</div><p id="shown"></p><p id="plate"></p><table id="swatches"></table><h2>Slice positions and off-node reconstruction</h2><p>Actual cache altitude nodes adjacent to the selected panel are shown at a representative valid source-distance row. Blue: selected global quadratic nodes; orange: additional counted valid-row boundary support. Endpoint/deduplication policies remain fixed across N. Above panels use common physical positions, including off-node clearances; they are not node-only comparisons.</p><div id="strips"></div><h2>Pure scattering orders</h2><p>Higher-order relative errors can be large even when their contribution to total radiance is small. Dark per-order denominators use separate reference-only floors. See raw batch data and complete JSON before interpreting tiny J4 estimates. All-zero sampled higher orders in nonempty atmosphere are unresolved rare events, not known physical zeros. Their zero sample variance is not an established uncertainty bound.</p><table id="orders"></table><h2>Reproduction and limits</h2><p>${data.coverage}</p><p>${data.display}</p><p>${data.uncertainty}</p><p>${data.measurement}</p><p>Parents: ${parents.join('; ')}. Exact source snapshots, commands, equations/parameters, tool inputs/outputs, and hashes remain in their immutable run manifests. Current fixed packing reaches the actual 16384 texture-height limit just beyond the largest studied count for at least one Sun position; alternative packing is untested. Source at the exact map center is a chart degeneracy not covered by these three configurations. No camera-specific cache is introduced.</p><script>(${reportClient.toString()})(${JSON.stringify(JSON.stringify(data)).replaceAll('<', '\\u003c')});</script></html>`;
	run.write(
		'index.html',
		html
			.replace(
				'</style>',
				'#swatches{table-layout:fixed}#swatches th:first-child,#swatches td:first-child{width:25%;overflow-wrap:anywhere}#swatches th:nth-child(2),#swatches td:nth-child(2),#swatches th:nth-child(3),#swatches td:nth-child(3),#swatches th:nth-child(4),#swatches td:nth-child(4){width:19%}#swatches th:last-child,#swatches td:last-child{width:18%}</style>',
			)
			.replace(
				'<h2>Count / accuracy / size / construction</h2>',
				'<p class="scope">' +
					productionNotice +
					'</p><p>Program compilation: ' +
					(timings[0].builds[0].compilationMilliseconds / 1000).toFixed(3) +
					' s. First query, including lazy first-use work: ' +
					(timings[0].builds[0].queryMilliseconds / 1000).toFixed(3) +
					' s. These startup costs are additional to field construction. Upload, inspection, lookup, and CPU payload metadata remain in results.json.</p><h2>Count / accuracy / size / construction</h2>',
			),
	);
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({headless: 'new', userDataDir: profile});
	const page = await browser.newPage();
	const errorsSeen = [];
	page.on('pageerror', (error) => errorsSeen.push(String(error)));
	await page.setViewport({width: 1600, height: 1000});
	await page.goto(pathToFileURL(path.join(run.root, 'index.html')).href);
	await page.waitForSelector('#swatches .swatch');
	await page.screenshot({path: path.join(run.root, 'report-preview.png'), fullPage: false});
	await page.$eval('#swatches', (node) => node.scrollIntoView());
	await page.screenshot({path: path.join(run.root, 'swatch-preview.png'), fullPage: false});
	const checks = await page.evaluate(() => ({
		rows: document.querySelectorAll('#swatches tr').length - 1,
		swatches: document.querySelectorAll('#swatches .swatch').length,
		summaryCounts: document.querySelectorAll('#summary button').length,
	}));
	assert.equal(checks.rows, 27);
	assert.equal(checks.swatches, 81);
	assert.equal(checks.summaryCounts, frozen.counts.length);
	await page.select('select#exposure', '0.48');
	await page.select('select#altitude', '40000');
	assert.equal(await page.$$eval('#swatches .swatch', (nodes) => nodes.length), 81);
	assert.equal(errorsSeen.length, 0, errorsSeen.join('\n'));
	run.write('render-check.json', {
		checks,
		errorsSeen,
		exercised:
			'Initial N12/middle Sun/1km allviews, then secondary exposure and40km altitude; actual standalone file with no external requests.',
	});
	console.log(
		JSON.stringify({
			run: run.root,
			counts: frozen.counts,
			guides: guides.length,
			validationChangedSelection: val.selectionChanged,
		}),
	);
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => {
		failure ??= error;
	});
	run.finish(failure ? 'failed' : 'accepted', {
		message: failure
			? String(failure)
			: 'Full standalone measured three-method report, raw spectra/metrics, PNG plates, held-out results, repeated timings, and actual browser rendering retained.',
	});
}
if (failure) {
	throw failure;
}
