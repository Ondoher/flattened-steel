import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import ExperimentRun from './ExperimentRun.js';

const run = new ExperimentRun();
await run.start('view-isolation');
try {
	const git = (...args) =>
		execFileSync('git', ['-C', run.repository, ...args], {encoding: 'utf8', windowsHide: true}).trim();
	const implementationRevision = git('rev-parse', 'HEAD');
	assert.equal(
		git(
			'status',
			'--porcelain=v1',
			'--untracked-files=all',
			'--',
			'scripts',
			'src',
			'references',
			'package.json',
			'package-lock.json',
		),
		'',
	);
	const load = async (relative) => {
		await run.read(relative);
		return import(pathToFileURL(await run.files.resolve(relative)).href);
	};
	const {Algorithm32} = await load('src/algorithm32/implementation/algorithm32/Algorithm32.js');
	const {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER: directions} = await load(
		'src/algorithm32/sampling-domains/index.js',
	);
	const {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} = await load(
		'src/algorithm32/spectral-values/index.js',
	);
	const {CanonicalValueHash} = await load('src/algorithm32/value-identity/CanonicalValueHash.js');
	const {createBrunetonProductionProfile, createViewDirection} = await load(
		'scripts/experiments/b1-directional-sky-radiance/production-profile.js',
	);
	const benchmark = await load('scripts/experiments/b1-directional-sky-radiance/benchmark.js');
	const {PRODUCTION_GPU_PARITY_LIMITS} = await load(
		'scripts/experiments/b1-directional-sky-radiance/compare-production-backends.js',
	);
	const dataset = benchmark.loadKiderDataset();
	assert.equal(dataset.rawAcquisitionSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.rawAcquisitionSha256);
	assert.equal(dataset.processedGridSha256, benchmark.EXPECTED_DATASET_FINGERPRINTS.processedGridSha256);
	const targetPath =
		'tmp/extraterrestrial/color-reset/runs/000065-color-reset-qualification/data/b1-point-local-direct40-w27-q30.tsv';
	const currentPath =
		'tmp/extraterrestrial/production-color-reset/p8/c1-9-canonical-v8-boundary-000001/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-j4.tsv';
	assert.equal(
		run.files.hash(await run.read(targetPath)),
		'e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634',
	);
	assert.equal(
		run.files.hash(await run.read(currentPath)),
		'30516f2c605d8466170c7ea500eaa95eccb5f0512c9d0e0e67801c1fc1fab6f4',
	);
	const target = benchmark
		.parseSpectraTsv(await run.files.resolve(targetPath))
		.values()
		.next().value;
	const current = benchmark
		.parseSpectraTsv(await run.files.resolve(currentPath))
		.values()
		.next().value;
	const sourceRun =
		'tmp/experiments/00000-shared-cache-calculation-reuse/runs/2026-09-10T22-23-13-107Z-direct40-321ad547-9fd1-4443-b89a-d5ad5b8a576d';
	const seal = JSON.parse((await run.read(`${sourceRun}/sealed.json`)).toString('utf8'));
	assert.equal(seal.state, 'accepted');
	const times = process.argv.slice(2);
	if (!times.length) times.push('10:15');
	const results = [];
	const profileRecords = [];
	for (const time of times) {
		const condition = dataset.conditions.find((c) => c.time === time);
		assert.ok(condition, 'Unknown time');
		const parent = seal.result.results.find((r) => r.id === `b1-${time}`).artifact;
		assert.ok(parent.path.startsWith(`${sourceRun}/`));
		const bytes = await run.read(parent.path, parent);
		const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
		const base = createBrunetonProductionProfile({
			time,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		});
		const cache = {
			sampleProvenanceIdentity: parent.sha256,
			sampleCumulativeScatteringDensity(request) {
				const positions = request.geometry.resolveScatteringCachePositionStencil({
					position: request.context.position,
					atmosphereCoordinate: request.context.atmosphereCoordinate,
				});
				const outgoing = request.geometry.resolveScatteringCacheDirectionStencil({
					position: request.context.position,
					physicalOutgoingDirection: request.context.physicalOutgoingDirection,
				});
				const samples = new Float64Array(40);
				for (let p = 0; p < positions.indices.length; p++)
					for (let d = 0; d < outgoing.indices.length; d++) {
						const unique = directions.logicalToUniqueDirectionIndices[outgoing.indices[d]];
						const weight = positions.weights[p] * outgoing.weights[d];
						for (let channel = 0; channel < 40; channel++)
							samples[channel] +=
								values[
									(channel * 48 + positions.indices[p]) * directions.uniqueDirectionCount + unique
								] * weight;
					}
				return new SpectralPacket({
					quantity: SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
					units: SPECTRAL_UNITS.SCATTERING_DENSITY,
					basis: base.spectral.basis,
					semantics: base.spectral.basis.semantics,
					values: samples,
					provenanceIdentity: parent.sha256,
				});
			},
			dispose() {},
		};
		for (const [label, intervalCount, quadratic] of [
			['U40', 40, false],
			['U30', 30, false],
			['Q40', 40, true],
			['Q30', 30, true],
		]) {
			const numerical = {
				...base.numerical,
				viewPath: {intervalCount, sampleDistribution: quadratic ? {kind: 'quadratic-near-observer-v1'} : null},
			};
			const profile = {
				...base,
				id: `${base.id}:diagnostic-${label}`,
				numerical,
				contentHash: CanonicalValueHash.sha256Value({parent: base.contentHash, numerical}),
				provenanceIdentity: `${base.provenanceIdentity}:view-isolation-${label}`,
			};
			profileRecords.push({
				time,
				label,
				parentProfile: base.contentHash,
				profileId: profile.id,
				profileContentHash: profile.contentHash,
				numerical,
			});
			const algorithm = new Algorithm32({profile});
			const started = performance.now();
			const rows = [];
			try {
				for (let x = 0; x < 9; x++)
					for (let y = 0; y < 9; y++) {
						const spectrum = algorithm.evaluate({
							viewRay: {direction: createViewDirection(x, y)},
							scatteringCache: cache,
						}).pathRadiance.values;
						for (let channel = 0; channel < 40; channel++)
							rows.push({
								x,
								y,
								channel,
								value: spectrum[channel],
								target: target.get(time)[x][y][channel],
								current: current.get(time)[x][y][channel],
								measured: condition.grid[x][y][channel],
							});
					}
			} finally {
				algorithm.dispose();
			}
			const rmse = (key, selected) =>
				Math.sqrt(selected.reduce((s, r) => s + (r.value - r[key]) ** 2, 0) / selected.length);
			const scored = rows.filter((r) => benchmark.SCORE_SAMPLE_INDICES.includes(r.channel));
			const result = {
				time,
				label,
				elapsedMilliseconds: performance.now() - started,
				currentParityRmse: rmse('current', rows),
				currentParityMaximum: Math.max(...rows.map((r) => Math.abs(r.value - r.current))),
				targetDifferenceRmseMilliwatt: 1000 * rmse('target', scored),
				measurementRmseMilliwatt: 1000 * rmse('measured', scored),
			};
			if (label === 'U40') {
				assert.ok(result.currentParityRmse <= PRODUCTION_GPU_PARITY_LIMITS.rmse);
				assert.ok(result.currentParityMaximum <= PRODUCTION_GPU_PARITY_LIMITS.maximumAbsoluteDifference);
			}
			await run.write(`${time.replace(':', '')}-${label}.json`, rows);
			results.push(result);
			run.progress({
				phase: 'view-isolation',
				completed: results.length,
				total: times.length * 4,
				message: JSON.stringify(result),
			});
		}
	}
	await run.write('profiles.json', profileRecords);
	await run.write('view-isolation.json', {
		implementationRevision,
		implementationScope:
			'Production implementation, scorers, references, and dependency manifests verified clean at execution start.',
		operation:
			'Same authenticated R32F cache, physical profile and CPU consumer; vary only view interval count and sample distribution. U40 must reproduce recorded GPU boundary within existing parity limits before interpreting interventions.',
		rawAcquisitionSha256: dataset.rawAcquisitionSha256,
		processedGridSha256: dataset.processedGridSha256,
		results,
	});
	await run.finish('accepted', {newGpuCalculations: 0, results});
} catch (error) {
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
