import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import {ExperimentRun} from './ExperimentRun.js';
import {openNativeParent} from './native-parent-reader.js';
import {readParent} from './parent-evidence.js';
import {hash, repositoryRoot, checkPath} from './run-boundary.js';
import {residual} from './native-spectral-comparison.js';

/** Reject incomplete evidence before deriving a claim.
 * @param {unknown} condition - Explicit observed assertion.
 * @param {string} message - Failure meaning.
 * @returns {void} - Throws on failure.
 */
function requireEvidence(condition, message) {
	if (!condition) throw new Error(message);
}

/** Compute the frozen nearest-rank percentile.
 * @param {number[]} values - Finite observed timings or ratios.
 * @param {number} fraction - Fraction in (0,1].
 * @returns {number} - Observed percentile, never an average of failures.
 */
function percentile(values, fraction) {
	requireEvidence(values.length && values.every(Number.isFinite), 'Missing finite percentile samples.');
	return [...values].sort((a, b) => a - b)[Math.ceil(fraction * values.length) - 1];
}

/** Compare a complete source inventory independent of asynchronous bundler discovery order.
 * @param {LocalSunEnvironmentArtifactIdentity[]} inputs - Authenticated path/size/hash records.
 * @returns {string} - Canonically ordered identity; duplicate paths reject.
 */
function closureIdentity(inputs) {
	requireEvidence(new Set(inputs.map((v) => v.path)).size === inputs.length, 'Duplicate source inventory path.');
	return JSON.stringify([...inputs].sort((a, b) => a.path.localeCompare(b.path)));
}

/** Compare whole-trajectory derivatives after joining every original slot.
 * @param {number[][]} a - Independent control spectra.
 * @param {number[][]} b - Reused spectra at identical exact states.
 * @returns {LocalSunShellTemporalDerivativeResidual} - Per-channel normalized maxima.
 */
function derivatives(a, b) {
	const peaks = a[0].map((_, c) => Math.max(1e-30, ...a.map((v) => Math.abs(v[c]))));
	let first = 0,
		second = 0;
	for (let i = 1; i < a.length; i++)
		for (let c = 0; c < peaks.length; c++) {
			first = Math.max(first, Math.abs(b[i][c] - b[i - 1][c] - (a[i][c] - a[i - 1][c])) / peaks[c]);
			if (i > 1)
				second = Math.max(
					second,
					Math.abs(b[i][c] - 2 * b[i - 1][c] + b[i - 2][c] - (a[i][c] - 2 * a[i - 1][c] + a[i - 2][c])) /
						peaks[c],
				);
		}
	return {first, second};
}

/** Check an actual exact-state application frame, including coherent receiver/shadows.
 * @param {LocalSunCurrentApplicationRow} row - Complete measured frame.
 * @returns {void} - Throws on missing or failing quantities.
 */
function frameCheck(row) {
	requireEvidence(
		row.measuredGpuPackets.length === 96 &&
			row.measuredGpuPackets.every((packet) =>
				[packet.radiance, packet.transmittance].every(
					(values) => values.length === 15 && values.every((v) => Number.isFinite(v) && v >= -1e-9),
				),
			),
		'Missing or invalid Native15 view measurements.',
	);
	for (const value of [row.cpuGpu, row.transmission])
		requireEvidence(
			value.count === 1440 &&
				value.failures === 0 &&
				value.nonfinite === 0 &&
				value.negative === 0 &&
				Number.isFinite(value.maximumRatio) &&
				value.maximumRatio <= 1,
			'CPU/GPU spectral frame failure.',
		);
	requireEvidence(
		row.endpointMaximumMeters <= 0.01 &&
			row.coverage.admitted.length === 96 &&
			row.coverage.excluded.length === 0 &&
			row.previousCompleteDuringPreparation,
		'Incomplete path, coverage or publication.',
	);
	requireEvidence(
		row.receiver.identity.startsWith(row.identity + ':receiver-exact-v1'),
		'Receiver does not belong to the published exact frame.',
	);
	for (const packet of [
		row.receiver.directNormal,
		row.receiver.directHorizontal,
		row.receiver.diffuseHorizontal,
		row.receiver.totalHorizontal,
	])
		requireEvidence(
			packet.values.length === 15 && Array.from(packet.values).every((v) => Number.isFinite(v) && v >= -1e-9),
			'Incomplete receiver spectrum.',
		);
	if (row.scene)
		requireEvidence(
			row.scene.lights.length === 6 &&
				row.scene.lights.every(
					(light) =>
						light.receiverIdentity === row.receiver.identity &&
						light.spectralIdentity === row.receiver.directNormal.contentHash &&
						light.direction.length === 3 &&
						light.direction.every(Number.isFinite) &&
						light.mapSize[0] === 4096 &&
						light.mapSize[1] === 4096,
				),
			'Scene lighting/shadow publication mismatch.',
		);
	if (row.preservedPixelsBitIdentical !== null)
		requireEvidence(row.preservedPixelsBitIdentical, 'Old complete pixels changed during replacement.');
}

/** Qualify current-contract app/lifecycle and joined independent-cache trajectories.
 * @returns {Promise<void>} - Sealed claim matrix; source review remains separate.
 */
async function main() {
	const run = await ExperimentRun.create('p45-app-report');
	try {
		/** @type {Omit<LocalSunParentArtifact,'bytes'>[]} */ const parents = [];
		/** Retain authenticated derivation metadata without retaining all image bytes.
		 * @param {LocalSunParentArtifact} artifact - Already authenticated consumed input.
		 * @returns {void} - Appends its complete identity.
		 */
		const retain = (artifact) => {
			const {bytes, ...identity} = artifact;
			parents.push(identity);
		};
		/** Read and authenticate one parent, retaining its exact derivation identity.
		 * @param {string} name - Sealed run. @param {string} artifact - Listed artifact.
		 * @returns {Promise<LocalSunParentArtifact>} - Immutable observed bytes.
		 */
		const parent = async (name, artifact) => {
			const p = await readParent(name, artifact);
			retain(p);
			return p;
		};
		/** @type {LocalSunCurrentLoadedApplication[]} */ const loaded = [];
		/** Authenticate the matching owned child and selected resource stop policy.
		 * @param {LocalSunCurrentJobIdentity} pair - Immutable child/guard identities.
		 * @returns {Promise<LocalSunHostResourceResult>} - Qualified sampled measurements.
		 */
		const loadGuard = async (pair) => {
			const guard = JSON.parse(new TextDecoder().decode((await parent(pair.guard, 'result.json')).bytes));
			const limits = JSON.parse(new TextDecoder().decode((await parent(pair.guard, 'inputs.json')).bytes));
			const tail = new TextDecoder().decode((await parent(pair.guard, 'stdout-tail.txt')).bytes);
			const matchingChild = tail.split(/\r?\n/u).some((line) => {
				try {
					const terminal = JSON.parse(line);
					return terminal.run === pair.capture && terminal.failure == null;
				} catch {
					return false;
				}
			});
			const approvedP5Exception =
				limits.temporaryException?.scope === 'Remaining P5 pinned current-application temporal captures only' &&
				limits.temporaryException.authorization ===
					'Owner: "Approve 6 GiB reserve for remaining P5 captures", 2026-10-10.' &&
				limits.temporaryException.reserveMiB === 6144 &&
				limits.temporaryException.defaultReserveMiB === 8192 &&
				limits.launcher.script === 'run-rotation.js' &&
				limits.launcher.arguments.includes('--current-application') &&
				limits.launcher.arguments.includes('--shell=00478-p3-contract') &&
				limits.launcher.arguments.some((v) =>
					/^--temporal=00265-p5-time-inputs:flat-(0|45|90|135|180):(control|reuse)$/.test(v),
				);
			const reserveBytes = approvedP5Exception ? 6442450944 : 8589934592;
			requireEvidence(
				guard.resourceQualified &&
					guard.exitCode === 0 &&
					!guard.failure &&
					(!limits.temporaryException || approvedP5Exception) &&
					limits.limits.reserveBytes === reserveBytes &&
					limits.limits.maximumBytes <= 8589934592 &&
					limits.limits.maximumMilliseconds <= 600000 &&
					guard.minimumFreeBytes >= reserveBytes &&
					matchingChild,
				'Unqualified or unrelated resource guard.',
			);
			return guard;
		};
		/** Load one current app and its independently authenticated resource guard.
		 * @param {LocalSunCurrentJobIdentity} pair - Capture/guard identity.
		 * @returns {Promise<LocalSunCurrentLoadedApplication>} - Complete checked measurement.
		 */
		const load = async (pair) => {
			const reader = await openNativeParent(pair.capture, 'recipe.json');
			retain(reader.metadata);
			const recipe = /** @type {LocalSunRotationRecipe} */ (
				JSON.parse(new TextDecoder().decode(reader.metadata.bytes))
			);
			const observed = await reader.read('result.json'),
				inputs = await reader.read('inputs.json');
			retain(observed);
			retain(inputs);
			const parsed = JSON.parse(new TextDecoder().decode(observed.bytes));
			// Allocation-event traces remain in their authenticated parents. This verifier
			// retains every claim quantity, but does not retain repeated trace inventories.
			delete parsed.webglResources;
			for (const row of parsed.results) delete row.webglResources;
			const data = /** @type {LocalSunCurrentApplicationCapture} */ (parsed);
			const guard = await loadGuard(pair);
			const current = JSON.parse(new TextDecoder().decode(inputs.bytes));
			requireEvidence(
				recipe.currentApplication &&
					current.parents.some(
						(p) =>
							p.artifact === 'contract.json' &&
							p.artifactSha256 === '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704',
					) &&
					current.parents.some(
						(p) =>
							p.artifact === 'layout.json' &&
							p.artifactSha256 === 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864',
					) &&
					current.parents.some(
						(p) =>
							p.artifact === 'gates.json' &&
							p.artifactSha256 === 'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d',
					),
				'Unpinned application contract.',
			);
			requireEvidence(
				data.schema === 'local-sun-shell-application-v1' &&
					data.applicationPayload.upperBytes <= 1200000000 &&
					Number.isFinite(data.pageResponsiveness.maximumGapMilliseconds) &&
					data.pageResponsiveness.maximumGapMilliseconds >= 0 &&
					!data.glErrors.length &&
					!data.cleanupErrors.length &&
					data.resourceInventory.fields === 0 &&
					data.resourceInventory.data === 0,
				'Application payload, missing responsiveness measurement or cleanup failure.',
			);
			for (const row of data.results) frameCheck(row);
			const value = {...pair, reader, recipe, data, inputs: current, resource: guard};
			loaded.push(value);
			return value;
		};
		const p4Argument = process.argv.find((v) => v.startsWith('--p4='))?.slice(5);
		/** @type {LocalSunCurrentLoadedApplication[]} */ const p4 = [];
		for (const value of p4Argument?.split(',') ?? []) {
			const [capture, guard, ...extra] = value.split('@');
			requireEvidence(capture && guard && !extra.length, 'Malformed P4 pair.');
			p4.push(await load({capture, guard}));
		}
		const coverageArgument = process.argv.find((v) => v.startsWith('--coverage='))?.slice(11);
		let futureCoverage = null;
		if (coverageArgument) {
			const [capture, guard, ...extra] = coverageArgument.split('@');
			requireEvidence(capture && guard && !extra.length, 'Malformed future-coverage pair.');
			await loadGuard({capture, guard});
			futureCoverage = JSON.parse(new TextDecoder().decode((await parent(capture, 'result.json')).bytes));
			const provenance = JSON.parse(new TextDecoder().decode((await parent(capture, 'inputs.json')).bytes));
			requireEvidence(
				futureCoverage.schema === 'current-workload-coverage-v1' &&
					futureCoverage.covered &&
					futureCoverage.frameStates === 1801 &&
					futureCoverage.queries === 1801 * 22 &&
					futureCoverage.allocatedOmittedNodes === 0 &&
					futureCoverage.omittedBands.join(',') === '0,1,2,3,4,5' &&
					futureCoverage.minimumMarginMeters >= 0 &&
					futureCoverage.maximumRhoMeters === 33378000 &&
					provenance.dateBasis === '2024-12-14T12:00:00.000Z' &&
					provenance.parents.some(
						(p) =>
							p.artifact === 'contract.json' &&
							p.artifactSha256 === '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704',
					),
				'Unqualified future workload coverage.',
			);
		}
		requireEvidence(
			process.argv
				.slice(2)
				.every(
					(v) =>
						!v.startsWith('--') ||
						v.startsWith('--p4=') ||
						v.startsWith('--coverage=') ||
						v.startsWith('--jobs='),
				),
			'Unknown qualification option.',
		);
		const matrixArguments = process.argv.slice(2).filter((v) => !v.startsWith('--'));
		/** @type {LocalSunCurrentMatrixJob[]} */ const jobs = [];
		// A failed grouping does not invalidate independently sealed accepted children.
		// Authenticate each explicit child through load(), never accept the failed group.
		const explicitJobs = process.argv.find((v) => v.startsWith('--jobs='))?.slice(7);
		for (const descriptor of explicitJobs?.split(',') ?? []) {
			const [state, workload, mode, pair, ...extra] = descriptor.split(':');
			const [capture, guard, ...pairExtra] = (pair ?? '').split('@');
			requireEvidence(
				!extra.length &&
					!pairExtra.length &&
					capture &&
					guard &&
					['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'].includes(state) &&
					['sky', 'scene'].includes(workload) &&
					['control', 'reuse'].includes(mode),
				'Malformed explicit accepted-child descriptor.',
			);
			jobs.push({
				state,
				scene: workload === 'scene',
				mode: /** @type {LocalSunShellTemporalMode} */ (mode),
				capture,
				guard,
				elapsedMilliseconds: null,
			});
		}
		for (const name of matrixArguments) {
			const value = JSON.parse(new TextDecoder().decode((await parent(name, 'result.json')).bytes));
			requireEvidence(
				value.schema === 'current-matrix-v1' && Array.isArray(value.jobs),
				'Invalid current matrix.',
			);
			jobs.push(...value.jobs);
		}
		const trajectories = [];
		const cadence = [new PNG({width: 720, height: 414 * 5}), new PNG({width: 720, height: 414 * 5})];
		const frozen = JSON.parse(
			new TextDecoder().decode((await parent('00265-p5-time-inputs', 'states.json')).bytes),
		);
		const acceptance = JSON.parse(
			new TextDecoder().decode((await parent('00019-acceptance', 'acceptance.json')).bytes),
		);
		for (const scene of [false, true])
			for (const state of ['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180']) {
				const selected = jobs.filter((job) => job.scene === scene && job.state === state);
				if (!selected.length) continue;
				/** @type {Map<number,LocalSunCurrentApplicationSample>[]} */ const modes = [new Map(), new Map()];
				for (const job of selected) {
					requireEvidence(job.mode === 'control' || job.mode === 'reuse', 'Unexpected temporal mode.');
					const item = await load(job);
					requireEvidence(
						item.recipe.shellTemporalMode === job.mode && item.recipe.shellScene === scene,
						'Matrix/recipe disagreement.',
					);
					requireEvidence(
						item.data.results.length === item.recipe.shellTemporalStates.length,
						'Incomplete requested trajectory.',
					);
					for (let i = 0; i < item.data.results.length; i++) {
						const row = item.data.results[i],
							expected = item.recipe.shellTemporalStates[i],
							original = frozen.trajectories.find((t) => t.id === state)?.states[row.artifactKey];
						requireEvidence(
							original &&
								JSON.stringify(expected) === JSON.stringify(original) &&
								row.artifactKey === expected.slot &&
								JSON.stringify(row.observation) === JSON.stringify(expected.state.observation) &&
								JSON.stringify(row.source.position) ===
									JSON.stringify(expected.state.geometry.sourcePosition) &&
								row.physicalCacheIdentity === item.data.results[0].physicalCacheIdentity &&
								row.reused === i > 0,
							'Exact state, canonical identity or actual reuse mismatch.',
						);
						const mode = modes[job.mode === 'control' ? 0 : 1];
						requireEvidence(!mode.has(row.artifactKey), 'Repeated trajectory slot.');
						mode.set(row.artifactKey, {row, item});
					}
				}
				requireEvidence(
					modes[0].size === modes[1].size && modes[0].size > 1,
					'Missing matched trajectory frames.',
				);
				const slots = [...modes[0].keys()].sort((a, b) => a - b),
					histogram = new Array(256).fill(0),
					a = [],
					b = [];
				for (const slot of slots) {
					const left = modes[0].get(slot),
						right = modes[1].get(slot),
						expected = frozen.trajectories.find((t) => t.id === state).states[slot];
					requireEvidence(
						right &&
							JSON.stringify(left.row.observation) === JSON.stringify(expected.state.observation) &&
							JSON.stringify(left.row.source) === JSON.stringify(right.row.source) &&
							left.item.recipe.shellImplementationIdentity ===
								right.item.recipe.shellImplementationIdentity &&
							closureIdentity(left.item.inputs.inputs) === closureIdentity(right.item.inputs.inputs),
						'Paired physical or executable identities differ.',
					);
					const flatten = /** @param {LocalSunCurrentApplicationRow} row - Actual Native15 measurements. */ (
						row,
					) => [
						...row.measuredGpuPackets.flatMap((p) => [...p.radiance, ...p.transmittance]),
						...Array.from(row.receiver.directNormal.values),
						...Array.from(row.receiver.directHorizontal.values),
						...Array.from(row.receiver.diffuseHorizontal.values),
						...Array.from(row.receiver.totalHorizontal.values),
					];
					a.push(flatten(left.row));
					b.push(flatten(right.row));
					const images = [];
					for (const sample of [left, right]) {
						const image = await sample.item.reader.read('angle-' + slot + '-application.png');
						retain(image);
						const png = PNG.sync.read(image.bytes);
						requireEvidence(png.width === 720 && png.height === 414, 'Changed image viewport.');
						images.push(png.data);
					}
					for (let i = 0; i < images[0].length; i++)
						if (i % 4 !== 3) histogram[Math.abs(images[0][i] - images[1][i])]++;
					if (slot === 60)
						images[1].copy(cadence[scene ? 1 : 0].data, (Number(state.slice(5)) / 45) * 720 * 414 * 4);
				}
				const parity = residual(b.flat(), a.flat(), 1e-9, 0.0001),
					motion = derivatives(a, b),
					total = histogram.reduce((s, n) => s + n, 0);
				let maximum = 255;
				while (maximum > 0 && histogram[maximum] === 0) maximum--;
				let sum = 0,
					p95 = 0;
				for (; p95 < 256; p95++) {
					sum += histogram[p95];
					if (sum >= Math.ceil(0.95 * total)) break;
				}
				const warm = [...modes[1].values()].flatMap((v) => v.row.warmFrameMilliseconds ?? []),
					warmP95 = warm.length ? percentile(warm, 0.95) : null;
				const avoided = 1 - selected.filter((j) => j.mode === 'reuse').length / slots.length;
				requireEvidence(
					parity.failures === 0 &&
						motion.first <= 0.002 &&
						motion.second <= 0.004 &&
						maximum <= 2 &&
						p95 <= 1,
					'Temporal spectral or image comparison failure.',
				);
				trajectories.push({
					state,
					scene,
					count: slots.length,
					complete: slots.length === 120 && slots.every((v, i) => v === i),
					parity,
					...motion,
					rgb: {maximum, p95, total},
					warmP95,
					warmMedian: warm.length ? percentile(warm, 0.5) : null,
					warmSamples: warm.length,
					maximumWarmFrameP95Milliseconds: acceptance.limits.maximumWarmFrameP95Milliseconds,
					warmQualified: warm.length >= 7 && warmP95 <= acceptance.limits.maximumWarmFrameP95Milliseconds,
					avoidedFraction: avoided,
					reuseBenefitQualified: avoided >= 0.9,
					controlBuilds: selected.filter((j) => j.mode === 'control').length,
					reuseBuilds: selected.filter((j) => j.mode === 'reuse').length,
				});
			}
		const lifecycle = p4.flatMap((v) => v.data.lifecycle),
			replacement = p4.find((v) => v.recipe.shellReplacements),
			coverage = p4.find((v) => v.recipe.shellCoverageExit);
		const p4Qualified =
			[
				'compile-failure',
				'caller-cancel',
				'resource-reject',
				'superseded-GPU-build',
				'disposal-with-live-frame-lease',
			].every((mode) => lifecycle.some((v) => v.mode === mode && v.preserved)) &&
			!!replacement &&
			replacement.data.results.length === 4 &&
			replacement.data.results.slice(1).every((v) => !v.reused) &&
			!!coverage &&
			!!coverage.data.coverageExit?.oldQueryRejected;
		const replacementTimings = [
			...(replacement?.data.results.slice(1) ?? []),
			...(coverage?.data.results.filter((row) => row.artifactKey === 3001) ?? []),
		].map((row) => ({
			label: row.label,
			milliseconds: row.preparedMilliseconds,
			maximumMilliseconds: acceptance.limits.maximumReplacementMilliseconds,
			qualified: row.preparedMilliseconds <= acceptance.limits.maximumReplacementMilliseconds,
			stages: row.stageMilliseconds,
		}));
		const replacementLatencyQualified =
			replacementTimings.length === 4 && replacementTimings.every((row) => row.qualified);
		const p5Qualified =
			p4Qualified && !!futureCoverage && trajectories.length === 10 && trajectories.every((v) => v.complete);
		const performanceTargetsMet =
			replacementLatencyQualified &&
			loaded.every((v) => v.data.pageResponsiveness.maximumGapMilliseconds <= 100) &&
			trajectories.every((v) => v.warmQualified && v.reuseBenefitQualified);
		if (trajectories.length === 10 && trajectories.every((v) => v.complete)) {
			await run.write('sky-cadence.png', PNG.sync.write(cadence[0]));
			await run.write('scene-cadence.png', PNG.sync.write(cadence[1]));
		}
		if (replacement) {
			const stack = new PNG({width: 720, height: 414 * replacement.data.results.length});
			for (const [index, row] of replacement.data.results.entries()) {
				const image = await replacement.reader.read('angle-' + row.artifactKey + '-application.png');
				retain(image);
				const png = PNG.sync.read(image.bytes);
				requireEvidence(png.width === 720 && png.height === 414, 'Changed replacement viewport.');
				png.data.copy(stack.data, index * 720 * 414 * 4);
			}
			await run.write('replacement-stack.png', PNG.sync.write(stack));
		}
		const metrics = loaded.map((v) => ({
			capture: v.capture,
			guard: v.guard,
			pageGap: v.data.pageResponsiveness.maximumGapMilliseconds,
			payload: v.data.applicationPayload.upperBytes,
			peakPrivateBytes: v.resource.peakPrivateBytes,
			peakWorkingSetBytes: v.resource.peakWorkingSetBytes,
			minimumFreeBytes: v.resource.minimumFreeBytes,
			coldPreparedMilliseconds: v.data.results[0].preparedMilliseconds,
			exactStatePreparedP95Milliseconds:
				v.data.results.length > 1
					? percentile(
							v.data.results.slice(1).map((r) => r.preparedMilliseconds),
							0.95,
						)
					: null,
			preparedMilliseconds: v.data.results.map((r) => r.preparedMilliseconds),
		}));
		const implementation = [];
		for (const name of [
			'qualify-current-application.js',
			'ExperimentRun.js',
			'native-parent-reader.js',
			'parent-evidence.js',
			'run-boundary.js',
			'native-spectral-comparison.js',
		]) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			implementation.push({path: path.relative(repositoryRoot, file).replaceAll('\\', '/'), sha256: hash(bytes)});
			await run.write('source-' + name, bytes);
		}
		const source = await readFile(new URL(import.meta.url));
		const pngMetadata = path.join(repositoryRoot, 'node_modules/pngjs/package.json');
		await checkPath(repositoryRoot, pngMetadata);
		await run.write('source-qualifier.js', source);
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'current-app-qualification-input-v1',
					command: process.argv.slice(1),
					parents,
					implementation,
					pngjsMetadataSha256: hash(await readFile(pngMetadata)),
					imageDerivation:
						'Copy unchanged 720x414 RGBA capture bytes into vertical PNG stacks. Cadence uses reuse slot 60 in Flat0/45/90/135/180 order. Replacement stack uses canonical, height, atmosphere, power order. No colour or exposure adjustment.',
					implementationSha256: hash(source),
					node: process.version,
					operation:
						'Authenticate sealed current-contract app and guard evidence; validate exact-frame CPU/GPU/receiver/shadow/publication; compare complete matched Native15 trajectories and PNG histograms, including joined derivatives. Independently built canonical controls replace per-frame fresh constructions under the unchanged P3-D covariance defense.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'current-app-qualification-v2',
					performanceAcceptance: 'owner-2026-10-10-timing-and-speedup-informative-only',
					performanceTargetsMet,
					p4Qualified,
					p5Qualified,
					replacementLatencyQualified,
					replacementTimings,
					trajectories,
					metrics,
					lifecycle,
					coverageExit: coverage?.data.coverageExit,
					futureCoverage,
					claim: 'Current engineering consistency/resource disposition; quantified absolute physical error and source-review completion remain separate.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(JSON.stringify({run: run.name, p4Qualified, p5Qualified, trajectories: trajectories.length}));
	} catch (error) {
		await run.finish('failed', String(error.stack ?? error));
		throw error;
	}
}
await main();
