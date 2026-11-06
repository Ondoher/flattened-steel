/**
 * Mounts the standalone evidence report using only its embedded immutable data.
 *
 * @param {string} serialized - Serialized report data, avoiding external requests.
 * @returns {void} - Writes the report's interactive tables and measured colors.
 */
export function reportClient(serialized) {
	const data = JSON.parse(serialized);
	const number = (v, digits = 3) => Number(v).toFixed(digits);
	const percent = (v) => number(v * 100);
	const mib = (v) => number(v / 1048576, 2);
	const el = (id) => document.getElementById(id);
	/** @type {Record<string, HTMLSelectElement>} */
	const controls = Object.fromEntries(
		['count', 'source', 'altitude', 'view', 'exposure'].map((id) => [id, document.createElement('select')]),
	);
	const populate = (id, values, initial) => {
		controls[id].id = id;
		controls[id].innerHTML = values.map((value) => '<option value="' + value + '">' + value + '</option>').join('');
		controls[id].value = String(initial);
		el('control-' + id).append(controls[id]);
	};
	populate(
		'count',
		data.results.map((r) => r.count),
		12,
	);
	populate('source', [375, 500, 625], 500);
	populate('altitude', ['all', 2, 100, 1000, 5000, 10000, 20000, 40000], 1000);
	populate('view', ['all', 'away-low', 'sunward', 'zenith'], 'all');
	populate('exposure', [0.06, 0.48], 0.06);
	el('summary').innerHTML =
		'<tr><th>Nominal slices</th><th>Dev p95</th><th>Held-out p95</th><th>Dev maximum</th><th>Resident MiB range</th><th>Actual nodes range</th><th>Middle-Sun build median [range], s</th><th>Peak owned MiB range</th></tr>' +
		data.results
			.map((r) => {
				const v = data.validation.results.find((v) => v.count === r.count);
				const t = data.timings.find((t) => t.count === r.count);
				const range = (key, format) =>
					format(Math.min(...r.builds.map((b) => b[key]))) +
					' - ' +
					format(Math.max(...r.builds.map((b) => b[key])));
				return (
					'<tr><td><button data-count="' +
					r.count +
					'">' +
					r.count +
					'</button></td><td>' +
					percent(r.summary.spectral.p95) +
					'%</td><td>' +
					percent(v.summary.spectral.p95) +
					'%</td><td>' +
					percent(r.summary.spectral.maximum) +
					'%</td><td>' +
					range('retainedCacheTextureBytes', mib) +
					'</td><td>' +
					range('nodes', (n) => n) +
					'</td><td>' +
					number(t.median / 1000) +
					' [' +
					number(t.minimum / 1000) +
					', ' +
					number(t.maximum / 1000) +
					']</td><td>' +
					range('peakOwnedTextureBytes', mib) +
					'</td></tr>'
				);
			})
			.join('');
	el('tiers').innerHTML = data.selection.tiers
		.map(
			(t) =>
				'<li>' +
				percent(t.tier) +
				'% p95: smallest tested point estimate N=' +
				(t.smallestPointEstimateCount ?? 'none') +
				'; including the conservative per-band sampling allowance: N=' +
				(t.conservativeSupportedCount ?? 'none') +
				'.</li>',
		)
		.join('');
	el('diagnostics').innerHTML =
		'<tr><th>Series, middle Sun, N32</th><th>p95 spectral</th><th>Worst</th></tr><tr><td>Primary</td><td>' +
		percent(data.selection.baselineMiddleSun.spectral.p95) +
		'%</td><td>' +
		percent(data.selection.baselineMiddleSun.spectral.maximum) +
		'%</td></tr>' +
		data.selection.diagnostics
			.map(
				(d) =>
					'<tr><td>' +
					d.registration +
					'</td><td>' +
					percent(d.summary.spectral.p95) +
					'%</td><td>' +
					percent(d.summary.spectral.maximum) +
					'%</td></tr>',
			)
			.join('');
	const render = () => {
		const count = Number(controls.count.value),
			source = Number(controls.source.value),
			altitude = controls.altitude.value,
			view = controls.view.value,
			exposure = Number(controls.exposure.value);
		const result = data.results.find((r) => r.count === count);
		const rows = result.physical.filter(
			(r) =>
				Math.round((r.physical.sourceRadius / data.diskRadius) * 1000) === source &&
				(altitude === 'all' || r.physical.altitude === Number(altitude)) &&
				(view === 'all' || r.physical.view === view),
		);
		el('shown').textContent =
			rows.length +
			' physical rows. All colors share exposure ' +
			exposure +
			'; clipping is flagged. Colors are diffuse path radiance, without terrain or direct solar disk.';
		el('swatches').innerHTML =
			'<tr><th>Physical ray / Euclidean cap distance</th><th>New cache J1-J4</th><th>Independent probe J1-J4</th><th>Actual libRadtran guide, all orders</th><th>Cache vs probe</th></tr>' +
			rows
				.map((r) => {
					const guide = data.guides.find((g) => g.id === r.id);
					const colors = exposure === 0.06 ? [...r.colors, guide.color] : [...r.highColors, guide.highColor];
					const swatches = colors
						.map(
							(c, method) =>
								'<td><div class="swatch" style="background:rgb(' +
								c.rgb.join(',') +
								')"></div><small>RGB ' +
								c.rgb.join(', ') +
								(c.clipped ? ' · CLIPPED / OUT OF GAMUT' : '') +
								'</small><br><small>' +
								(method === 1
									? 'Probe integrated 95% half-width ' + percent(r.perOrder[4].relativeHalf95) + '%'
									: method === 2
										? guide.uncertaintyLabel
										: 'Deterministic reconstruction') +
								'</small></td>',
						)
						.join('');
					return (
						'<tr><td>' +
						r.id +
						'<br>' +
						r.physical.altitude +
						' m altitude; d=' +
						number(r.physical.distance, 2) +
						' m (' +
						r.physical.fraction +
						' of maximum)</td>' +
						swatches +
						'<td>' +
						percent(r.perOrder[4].relative) +
						'% spectral<br>' +
						percent(r.luminanceRelative) +
						'% luminance<br>ΔE76 ' +
						number(r.deltaE76) +
						'<details><summary>Orders / radiance</summary>Pure J1-J4 errors: ' +
						r.perOrder
							.slice(0, 4)
							.map((p) => percent(p.relative) + '%')
							.join(', ') +
						'<br>Integrated probe radiance: ' +
						r.perOrder[4].referenceIntegrated.toExponential(5) +
						' W m⁻² sr⁻¹<br>Absolute spectral error: ' +
						r.perOrder[4].absolute.toExponential(5) +
						'<br>Native/probe spectral difference (unmatched physics): ' +
						percent(guide.probeDifference.relativeSpectral) +
						'%</details></td></tr>'
					);
				})
				.join('');
		const layout = data.strips.find((s) => s.count === count && s.source === source);
		el('strips').innerHTML = layout.rows
			.filter((r) => altitude === 'all' || r.adjacentTo.includes(Number(altitude)))
			.map(
				(r) =>
					'<div>' +
					r.z +
					' m cache altitude; source-distance row β=0.5; ' +
					r.nodes.length +
					' valid nodes (includes counted boundary support)<svg viewBox="0 0 1000 24" role="img" aria-label="Actual valid slice positions"><path d="M0 12H1000" stroke="#888"/>' +
					r.nodes
						.map(
							(n) =>
								'<path d="M' +
								number(n.fraction * 1000) +
								' 2V22" stroke="' +
								(n.boundary ? '#f5ba70' : '#abd3fa') +
								'" stroke-width="2"/>',
						)
						.join('') +
					'</svg></div>',
			)
			.join('');
		el('plate').innerHTML =
			'<a href="swatches-n' +
			count +
			'-s' +
			source +
			'-0.06.png">Full primary PNG plate</a> · <a href="swatches-n' +
			count +
			'-s' +
			source +
			'-0.48.png">Full secondary PNG plate</a> · row labels/order are in results.json';
		el('orders').innerHTML =
			'<tr><th>Pure order</th><th>Median relative error</th><th>p95 relative error</th><th>Maximum relative error</th></tr>' +
			result.summary.pureOrders
				.map(
					(p, i) =>
						'<tr><td>J' +
						(i + 1) +
						'</td><td>' +
						percent(p.median) +
						'%</td><td>' +
						percent(p.p95) +
						'%</td><td>' +
						percent(p.maximum) +
						'%</td></tr>',
				)
				.join('');
	};
	for (const control of Object.values(controls)) {
		control.addEventListener('change', render);
	}
	for (const button of document.querySelectorAll('button[data-count]')) {
		button.addEventListener('click', () => {
			controls.count.value = button.getAttribute('data-count');
			render();
		});
	}
	render();
}
