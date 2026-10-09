import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {ExperimentRun} from './ExperimentRun.js';
import {openNativeParent} from './native-parent-reader.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {residual} from './native-spectral-comparison.js';

/** Compare fresh/reused temporal derivatives with a per-channel trajectory peak.
 * @param {number[][]} fresh - Independently built spectra in exact-time order.
 * @param {number[][]} reused - Canonical-cache spectra at identical exact times.
 * @returns {LocalSunShellTemporalDerivativeResidual} - Maximum normalized derivative residuals; this stricter per-channel normalization cannot hide weak channels.
 */
function derivatives(fresh, reused) {
	const peaks = fresh[0].map((_, c) => Math.max(1e-30, ...fresh.map((values) => Math.abs(values[c]))));
	let first = 0,
		second = 0;
	for (let i = 1; i < fresh.length; i++)
		for (let c = 0; c < peaks.length; c++) {
			first = Math.max(
				first,
				Math.abs(reused[i][c] - reused[i - 1][c] - (fresh[i][c] - fresh[i - 1][c])) / peaks[c],
			);
			if (i > 1)
				second = Math.max(
					second,
					Math.abs(
						reused[i][c] -
							2 * reused[i - 1][c] +
							reused[i - 2][c] -
							(fresh[i][c] - 2 * fresh[i - 1][c] + fresh[i - 2][c]),
					) / peaks[c],
				);
		}
	return {first, second};
}

/** Authenticate and compare actual fresh/reused GPU trajectories, without encoding video.
 * @returns {Promise<void>} - Sealed temporal/parity evidence, with bounded diagnostics explicitly distinguished from complete 120-state qualification.
 */
async function main() {
	const run = await ExperimentRun.create('p5-time-proof');
	try {
		const implementation = [];
		for (const name of [
			'prove-shell-temporal.js',
			'native-parent-reader.js',
			'parent-evidence.js',
			'run-boundary.js',
			'ExperimentRun.js',
			'native-spectral-comparison.js',
			'run-rotation.js',
		]) {
			const target = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, target);
			const bytes = await readFile(target);
			implementation.push({
				path: path.relative(repositoryRoot, target).replaceAll('\\', '/'),
				sha256: hash(bytes),
			});
			await run.write('source-' + name, bytes);
		}
		if (process.argv.length !== 4) throw new Error('Fresh and reused sealed exact-time application runs required.');
		const readers = await Promise.all(process.argv.slice(2).map((name) => openNativeParent(name, 'recipe.json'))),
			parents = [];
		const captures = [],
			recipes = [],
			inputs = [],
			gateParents = [];
		for (const reader of readers) {
			const observed = await reader.read('result.json'),
				recipe = reader.metadata,
				input = await reader.read('inputs.json'),
				gates = await reader.read('gates.json');
			parents.push({...observed, bytes: new Uint8Array()}, recipe, input, gates);
			gateParents.push(gates);
			const full = /** @type {LocalSunShellTemporalCapture} */ (
				JSON.parse(new TextDecoder().decode(observed.bytes))
			);
			// Retain every measured proof quantity, but not repeated allocation-event
			// inventories already authenticated in the immutable parent. This bounds
			// verifier retention without dropping any numerical or resource claim.
			captures.push({
				schema: full.schema,
				applicationPayload: full.applicationPayload,
				pageResponsiveness: full.pageResponsiveness,
				results: full.results.map((row) => ({
					artifactKey: row.artifactKey,
					observation: row.observation,
					source: row.source,
					receiver: row.receiver,
					measuredGpuPackets: row.measuredGpuPackets,
					reused: row.reused,
					cpuGpu: row.cpuGpu,
					transmission: row.transmission,
					endpointMaximumMeters: row.endpointMaximumMeters,
					coverage: row.coverage,
					preparedMilliseconds: row.preparedMilliseconds,
					warmFrameMilliseconds: row.warmFrameMilliseconds,
				})),
			});
			recipes.push(/** @type {LocalSunRotationRecipe} */ (JSON.parse(new TextDecoder().decode(recipe.bytes))));
			inputs.push(JSON.parse(new TextDecoder().decode(input.bytes)));
		}
		const [fresh, reused] = captures,
			[freshRecipe, reusedRecipe] = recipes,
			count = fresh.results.length;
		if (gateParents[0].artifactSha256 !== gateParents[1].artifactSha256)
			throw new Error('Fresh/reused frozen gate identity differs.');
		const gates = JSON.parse(new TextDecoder().decode(gateParents[0].bytes));
		if (
			gates.temporal.maximumNormalizedFirstDifferenceResidual !== 0.002 ||
			gates.temporal.maximumNormalizedSecondDifferenceResidual !== 0.004 ||
			gates.temporal.displayMaximumAbsoluteByteDifference !== 2 ||
			gates.temporal.displayP95AbsoluteByteDifference !== 1 ||
			gates.completeRay.maximumEndpointDifferenceMeters !== 0.01 ||
			gates.quantities.some((q) => q.reuseRelative !== 0.0001)
		)
			throw new Error('Temporal proof does not support a changed acceptance policy.');
		const normalizedRecipes = recipes.map(({shellTemporalMode, ...physical}) => physical);
		const runtimeInputs = inputs.map((input) =>
			input.inputs
				.filter((identity) => identity.path !== 'experiments/local-sun-cache-reuse/run-rotation.js')
				.sort((a, b) => a.path.localeCompare(b.path)),
		);
		const launcherPath = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-rotation.js');
		await checkPath(repositoryRoot, launcherPath);
		const launcher = await readFile(launcherPath, 'utf8'),
			timeoutPattern =
				/protocolTimeout:\s*recipe\.shellTemporalStates\?\.length\s*===\s*120\s*\?\s*10800000\s*:\s*1800000,/u;
		if (launcher.split(timeoutPattern).length !== 2)
			throw new Error('Expected exact full-trajectory launcher timeout statement.');
		const launcherHashes = [hash(launcher), hash(launcher.replace(timeoutPattern, 'protocolTimeout: 1800000,'))];
		if (
			inputs.some(
				(input) =>
					!launcherHashes.includes(
						input.inputs.find(
							(identity) => identity.path === 'experiments/local-sun-cache-reuse/run-rotation.js',
						)?.sha256,
					),
			)
		)
			throw new Error('Launcher differs beyond the exact protocol-timeout correction.');
		if (
			captures.some((c) => c.schema !== 'local-sun-shell-application-v1') ||
			![2, 120].includes(count) ||
			reused.results.length !== count ||
			freshRecipe.shellTemporalMode !== 'fresh' ||
			reusedRecipe.shellTemporalMode !== 'reuse' ||
			JSON.stringify(freshRecipe.shellTemporalStates) !== JSON.stringify(reusedRecipe.shellTemporalStates) ||
			freshRecipe.shellScene !== reusedRecipe.shellScene ||
			JSON.stringify(normalizedRecipes[0]) !== JSON.stringify(normalizedRecipes[1]) ||
			JSON.stringify(runtimeInputs[0]) !== JSON.stringify(runtimeInputs[1]) ||
			freshRecipe.shellImplementationIdentity !== reusedRecipe.shellImplementationIdentity
		)
			throw new Error('Exact-state inventory, profile, scene or executable closure differs.');
		if (fresh.results.some((r) => r.reused) || reused.results.some((r, i) => r.reused !== i > 0))
			throw new Error('Fresh/reused comparison did not execute separate actual cache constructions and reuse.');
		const histogram = new Array(256).fill(0),
			families = [];
		for (let i = 0; i < count; i++) {
			const a = fresh.results[i],
				b = reused.results[i],
				expected = freshRecipe.shellTemporalStates[i];
			if (
				a.artifactKey !== expected.slot ||
				b.artifactKey !== expected.slot ||
				JSON.stringify(a.observation) !== JSON.stringify(expected.state.observation) ||
				JSON.stringify(b.observation) !== JSON.stringify(a.observation) ||
				JSON.stringify(a.source) !== JSON.stringify(b.source) ||
				a.measuredGpuPackets.length !== 96 ||
				b.measuredGpuPackets.length !== 96 ||
				[a, b].some((row) =>
					row.measuredGpuPackets.some(
						(packet) => packet.radiance.length !== 15 || packet.transmittance.length !== 15,
					),
				)
			)
				throw new Error('Incomplete physical state or measured ray inventory.');
			for (const [which, reader] of readers.entries()) {
				const parent = await reader.read(`angle-${expected.slot}-application.png`);
				parents.push(parent);
				const image = PNG.sync.read(parent.bytes);
				if (image.width !== 720 || image.height !== 414) throw new Error('Frozen frame dimensions changed.');
				if (which === 0) families.push(image.data);
				else {
					const reference = families.pop();
					for (let pixel = 0; pixel < image.data.length; pixel++)
						if (pixel % 4 !== 3) histogram[Math.abs(image.data[pixel] - reference[pixel])]++;
				}
			}
		}
		const quantities = [];
		for (const quantity of [
			'radiance',
			'transmittance',
			'directNormal',
			'directHorizontal',
			'diffuseHorizontal',
			'totalHorizontal',
		]) {
			const values = captures.map((capture) =>
				capture.results.map((row) =>
					quantity === 'radiance' || quantity === 'transmittance'
						? row.measuredGpuPackets.flatMap((packet) => packet[quantity])
						: Array.from(row.receiver[quantity].values),
				),
			);
			if (
				values.some((rows) =>
					rows.some(
						(row) =>
							row.length !== values[0][0].length ||
							row.some(
								(value) =>
									!Number.isFinite(value) || value < -(quantity === 'transmittance' ? 1e-7 : 1e-9),
							),
					),
				)
			)
				throw new Error('Nonfinite, negative or incomplete temporal spectrum.');
			const parity = residual(
					values[1].flat(),
					values[0].flat(),
					quantity === 'transmittance' ? 1e-7 : 1e-9,
					0.0001,
				),
				motion = derivatives(values[0], values[1]);
			quantities.push({
				quantity,
				parity,
				...motion,
				qualified: parity.failures === 0 && motion.first <= 0.002 && motion.second <= 0.004,
			});
		}
		const pixels = histogram.reduce((sum, n) => sum + n, 0);
		let maximum = 255;
		while (maximum > 0 && histogram[maximum] === 0) maximum--;
		let cumulative = 0,
			p95 = 0;
		for (; p95 < 256; p95++) {
			cumulative += histogram[p95];
			if (cumulative >= Math.ceil(0.95 * pixels)) break;
		}
		const frameProof = captures.every((c) =>
			c.results.every(
				(row) =>
					row.cpuGpu.failures === 0 &&
					row.transmission.failures === 0 &&
					row.endpointMaximumMeters <= 0.01 &&
					row.coverage.admitted.length === 96 &&
					row.coverage.excluded.length === 0,
			),
		);
		const temporalQualified =
			count === 120 && quantities.every((q) => q.qualified) && maximum <= 2 && p95 <= 1 && frameProof;
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'shell-temporal-comparison-input-v1',
					parents: parents.map(({bytes, ...identity}) => identity),
					implementation,
					tools: {node: process.version},
					command: process.argv.slice(1),
					operation:
						'Authenticate complete parent inventories; compare the entire physical recipe except fresh/reuse instance mode and the complete executable application/phase-worker/host bundle identity. All runtime collaborator identities must match; only the Node launcher source may differ for an extended full-trajectory protocol timeout, and both launcher identities remain in authenticated parent provenance. Compare all actual 96x15 GPU rays and exact measured receiver spectra per identical physical state. Compute first/second differences normalized by each channel trajectory peak, plus complete PNG RGB histograms. No interpolation, synthetic fresh values, source-run mutation or video encoding.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'shell-temporal-comparison-v1',
					count,
					scene: freshRecipe.shellScene === true,
					quantities,
					rgb: {histogram, count: pixels, maximum, p95},
					frameProof,
					temporalQualified,
					builds: {fresh: count, reused: 1, avoidedFraction: (count - 1) / count},
					resourceObservations: captures.map((c) => ({
						payload: c.applicationPayload.upperBytes,
						pageGap: c.pageResponsiveness.maximumGapMilliseconds,
						preparedMilliseconds: c.results.map((r) => r.preparedMilliseconds),
						warmFrames: c.results
							.filter((r) => r.warmFrameMilliseconds?.length)
							.map((r) => ({slot: r.artifactKey, milliseconds: r.warmFrameMilliseconds})),
					})),
					qualified: false,
					claim: 'Temporal/parity evidence only. A two-state run is diagnostic and cannot qualify derivatives over the frozen 120-state trajectory. Physical accuracy, full five-state matrix, exclusive repeated timing, complete resources and source review remain separate gates.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(
			JSON.stringify({
				run: run.name,
				count,
				temporalQualified,
				quantities: quantities.map((q) => ({
					quantity: q.quantity,
					first: q.first,
					second: q.second,
					failures: q.parity.failures,
				})),
				rgb: {maximum, p95},
				qualified: false,
			}),
		);
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
