import path from 'node:path';
import Inventory from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationInventory.js';
import Planner from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheInventory.js';
import Staging from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheStaging.js';
import Host from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheCompilerHost.js';
import Package from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationPackage.js';
import Verifier from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationVerifier.js';
import {StrobingCompilerFiles} from './StrobingCompilerFiles.js';
import {StrobingRun} from './StrobingRun.js';

const probeOnly = process.argv[2] === '--probe';
const surfaceLimitMeters = probeOnly && process.argv[3] ? Number(process.argv[3]) : 4;
if (process.argv.length > (probeOnly ? 4 : 2) || ![2, 4, 8].includes(surfaceLimitMeters))
	throw new Error('Use no arguments or --probe [2|4|8].');
const run = await StrobingRun.allocate(probeOnly ? 'field-compile' : 'stable-ground');
const files = new StrobingCompilerFiles(run);
const runRoot = path.relative(StrobingRun.repositoryRoot, run.directory).replaceAll('\\', '/');
const stagingRoot = `${runRoot}/staging`,
	candidateRoot = `${runRoot}/candidate`;
const cancellation = new AbortController();
const interrupt = () => cancellation.abort(new Error('Generation interrupted.'));
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
/** @type {Staging | undefined} */ let staging;
try {
	await run.progress({
		phase: 'authenticate',
		message: 'Authenticating the production inventory before contained regeneration.',
	});
	const inventory = await new Inventory().load(files);
	/** @type {StrobingCompilerBuildRequest} */ (inventory.buildRequest).transportSpec.numerical.surfaceLimitMeters =
		surfaceLimitMeters;
	const planned = new Planner().create(
		inventory.buildRequest,
		inventory.scenes.map((scene) => ({
			id: scene.manifest.sceneSun.id,
			instant: scene.manifest.sceneSun.instant,
			zenithDegrees: scene.ordinal,
			observerAltitudeMeters: scene.ledger.support.observerAltitude.value,
		})),
		probeOnly ? [6] : Array.from({length: 15}, (_, index) => index),
	);
	if (JSON.stringify(planned.coordinates) !== JSON.stringify(inventory.coordinates))
		throw new Error('Candidate coordinate inventory changed.');
	await run.writeJson('parameters.json', {
		buildRequest: inventory.buildRequest,
		unionLedger: inventory.unionLedger,
		wavelengths: planned.wavelengths,
		surfaceLimitMeters,
		correction:
			'Stable quadratic roots with factored radial offset; clamp a bottom-sphere offset within 1 metre to zero to represent the exact surface under Earth-scale Float32 rounding. Evaluate the ground-row surface limit at the declared small positive height to separate it from Float32 surface ambiguity. Retain Native48/Z180/W27/F68/Native15/N4, 8x8 blocks, and all physical inputs.',
	});
	const sourcePaths = [
		'experiments/distant-sun-recording-strobing/generate-candidate.js',
		'experiments/distant-sun-recording-strobing/StrobingCompilerFiles.js',
		'experiments/distant-sun-recording-strobing/compiler/DistantSunSceneCacheGpuCompiler.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
		...[
			'DistantSunSharedCacheGenerationInventory',
			'DistantSunPointLocalCacheInventory',
			'DistantSunPointLocalCacheStaging',
			'DistantSunPointLocalCacheCompilerHost',
			'DistantSunPointLocalCacheCompilerBrowser',
			'DistantSunSharedCacheGenerationPackage',
			'DistantSunSharedCacheGenerationCodec',
			'DistantSunSharedCacheGenerationVerifier',
		].map((name) => `scripts/algorithm32/solar-zenith-cache/${name}.js`),
	];
	await run.writeJson('implementation.json', {
		sources: await Promise.all(sourcePaths.map((file) => StrobingRun.identity(StrobingRun.repositoryRoot, file))),
		moduleSubstitution: {
			route: 'DistantSunSceneCacheGpuCompiler.js',
			source: 'experiments/distant-sun-recording-strobing/compiler/DistantSunSceneCacheGpuCompiler.js',
		},
	});
	const sourceArtifact = await StrobingRun.identity(StrobingRun.repositoryRoot, `${runRoot}/implementation.json`);
	const parameterArtifact = await StrobingRun.identity(StrobingRun.repositoryRoot, `${runRoot}/parameters.json`);
	const implementation = {id: 'strobing-stable-ground-compiler', version: '1.1.0', sha256: sourceArtifact.sha256};
	const parents = [
		{role: 'immutable-control-catalog', artifact: inventory.catalogArtifact},
		{role: 'generator-source', artifact: sourceArtifact},
		{role: 'common-field-parameters', artifact: parameterArtifact},
	];
	/** @param {Readonly<Record<string, unknown>>} event Compiler activity. */
	const progress = async (event) => {
		if (
			event.phase === 'gpu-stage' &&
			!String(event.stage).endsWith(':180/180') &&
			!String(event.stage).endsWith(':J4')
		)
			return;
		return run.progress({
			phase: typeof event.phase === 'string' ? event.phase : 'compile',
			message: JSON.stringify(event).slice(0, 1800),
		});
	};
	staging = new Staging(planned);
	await staging.allocate(files, stagingRoot);
	const gpu = await new Host().run({
		files,
		runRoot,
		inventory: planned,
		staging,
		signal: cancellation.signal,
		chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		maximumMilliseconds: 900000,
		progress,
	});
	const stagedBytes = staging.complete();
	await staging.close();
	staging = undefined;
	await run.writeJson('gpu.json', gpu);
	parents.push({
		role: 'common-field-gpu-execution',
		artifact: await StrobingRun.identity(StrobingRun.repositoryRoot, `${runRoot}/gpu.json`),
	});
	if (probeOnly) {
		const rows = [];
		for (const [ordinal, block] of planned.blocks.entries()) {
			if (!block.coordinates.some(([altitude, zenith]) => altitude <= 8 && zenith >= 65 && zenith <= 85))
				continue;
			const bytes = await files.read(`${stagingRoot}/block-${String(ordinal).padStart(3, '0')}.f32`);
			for (const [row, [altitude, zenith]] of block.coordinates.entries()) {
				if (altitude > 8 || zenith < 65 || zenith > 85) continue;
				let sum = 0;
				for (let direction = 0; direction < 4058; direction++)
					sum += bytes.readFloatLE((row * 4058 + direction) * 4);
				rows.push({altitude, zenithDegrees: zenith + 0.5, channel: 6, meanDirections: sum / 4058});
			}
		}
		await run.writeJson('field.json', {
			rows: rows.sort((a, b) => a.altitude - b.altitude || a.zenithDegrees - b.zenithDegrees),
		});
		await run.finish(
			'accepted',
			{purpose: 'single-wavelength-field-proof', stagedBytes, visualAcceptance: 'not-a-rendered-qualification'},
			['chrome-profile'],
		);
	} else {
		await files.directory(candidateRoot);
		const candidate = await new Package({
			files,
			inventory,
			candidateRoot,
			stagingRoot,
			implementation,
			parents,
			parametersSha256: parameterArtifact.sha256,
			browserVersion: gpu.userAgent,
			signal: cancellation.signal,
			progress,
		}).finalize();
		const verification = await new Verifier().verify({
			files,
			inventory,
			candidate,
			candidateRoot,
			stagingRoot,
			signal: cancellation.signal,
			progress,
		});
		await run.writeJson('verification.json', verification);
		await run.finish(
			'accepted',
			{
				purpose: 'candidate-package-generation',
				packageSetIdentity: candidate.report.packageSetIdentity,
				packageRoot: `${runRoot}/candidate`,
				report: candidate.reportArtifact,
				stagedBytes,
				visualAcceptance: 'pending-rendered-comparison',
			},
			['chrome-profile'],
		);
	}
} catch (error) {
	await staging?.close();
	await run.finish(
		cancellation.signal.aborted ? 'interrupted' : 'failed',
		{error: error instanceof Error ? error.stack : String(error)},
		['chrome-profile'],
	);
	process.exitCode = 1;
} finally {
	process.removeListener('SIGINT', interrupt);
	process.removeListener('SIGTERM', interrupt);
}
