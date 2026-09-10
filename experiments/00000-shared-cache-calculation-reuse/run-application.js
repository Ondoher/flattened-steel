import ExperimentRun from './ExperimentRun.js';
import ApplicationControls from './ApplicationControls.js';
import ApplicationTileProof from './ApplicationTileProof.js';
import CompilerDerivation from './CompilerDerivation.js';
import GpuProofHost from './GpuProofHost.js';

const run = new ExperimentRun();
await run.start('application');
let sink;
try {
	const controls = await new ApplicationControls().load(run);
	const original = (
		await run.read('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js')
	).toString('utf8');
	const compiler = new CompilerDerivation().derive(original);
	await run.write('compiler.js', Buffer.from(compiler));
	const sourceRoot = 'experiments/00000-shared-cache-calculation-reuse';
	const sources = new Map([
		['compiler.js', Buffer.from(compiler)],
		['RetainedGpuSession.js', await run.read(`${sourceRoot}/RetainedGpuSession.js`)],
		['browser.js', await run.read(`${sourceRoot}/browser.js`)],
	]);
	const channels = process.argv.includes('--subset')
		? 1
		: controls.inventory.buildRequest.transportSpec.domains.spectrum.channels.length;
	const jobs = [
		{
			id: 'application-union',
			buildRequest: controls.inventory.buildRequest,
			ledger: controls.inventory.unionLedger,
			wavelengths: Array.from({length: channels}, (_, index) => index),
		},
	];
	await run.write('parameters.json', {
		jobs,
		operation:
			'unchanged shaders; exact-layout texture reuse; full-source program reuse; completion at field boundaries',
		acceptance: {
			exact: true,
			maximumTextureBytes: 512 * 1024 * 1024,
			maximumPrograms: 256,
			fewerAllocationsOrFinishes: true,
		},
		comparison: 'qualified shared generator, not independent per-scene builds',
	});
	await run.read('scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js');
	sink = new ApplicationTileProof(run, controls);
	await sink.start();
	const abort = new AbortController();
	const interrupt = () => abort.abort(new Error('Interrupted by owner.'));
	process.once('SIGINT', interrupt);
	let gpu;
	try {
		gpu = await new GpuProofHost().run({
			run,
			jobs,
			sources,
			signal: abort.signal,
			acceptTile: (...args) => sink.accept(...args),
			maximumMilliseconds: 900000,
		});
	} finally {
		process.removeListener('SIGINT', interrupt);
	}
	await sink.close();
	const artifact = sink.complete(channels);
	run.artifacts.push(artifact);
	await run.write('gpu.json', gpu);
	await run.finish('accepted', {
		stages: channels === 1 ? ['E3'] : ['E3', 'E4-calculation'],
		exactChannels: channels,
		exactUnionRows: controls.inventory.coordinates.length,
		impliedExactSceneReconstructions: channels === 15 ? 109 : 0,
		candidate: artifact,
		baselineGpuMilliseconds: controls.parents['common-field-gpu-execution'].elapsedMilliseconds,
		candidateGpuMilliseconds: gpu.elapsedMilliseconds,
		stats: gpu.stats,
		limitations: [
			'Different host comparison/transfer costs; phase timing is not an isolated compute speedup.',
			'Exact full-scene reconstruction also relies on the separate accepted E2 inventory-map proof.',
		],
	});
} catch (error) {
	await sink?.close();
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
