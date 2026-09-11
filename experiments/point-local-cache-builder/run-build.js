import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import ExperimentRun from './ExperimentRun.js';
import ProfileInputs from './ProfileInputs.js';
import CacheInventory from './CacheInventory.js';
import CacheStaging from './CacheStaging.js';
import CachePackage from './CachePackage.js';
import ApplicationProof from './ApplicationProof.js';
import ApplicationControls from '../00000-shared-cache-calculation-reuse/ApplicationControls.js';
import GpuProofHost from '../00000-shared-cache-calculation-reuse/GpuProofHost.js';

const bruneton = process.argv.includes('--bruneton');
const run = new ExperimentRun();
await run.start(bruneton ? 'bruneton' : 'app-proof');
let staging;
try {
	const profiles = new ProfileInputs();
	const buildRequest = bruneton ? profiles.bruneton() : profiles.application();
	const scenes = bruneton
		? profiles.brunetonScenes()
		: [
				{id: 'daylight', zenithDegrees: 40, observerAltitudeMeters: 1.7},
				{id: 'twilight', zenithDegrees: 99, observerAltitudeMeters: 1.7},
				{id: 'daylight-again', zenithDegrees: 40, observerAltitudeMeters: 1.7},
			];
	const wavelengths = bruneton ? buildRequest.transportSpec.domains.spectrum.channels.map((_, i) => i) : [0, 14];
	const inputArgument = process.argv.indexOf('--input');
	const input =
		inputArgument < 0
			? {buildRequest, scenes, wavelengths}
			: JSON.parse((await run.read(process.argv[inputArgument + 1])).toString('utf8'));
	const inventory = new CacheInventory().create(input.buildRequest, input.scenes, input.wavelengths);
	await run.write('input.json', input);
	await run.write('inventory.json', {...inventory, directionBytes: undefined});
	const compiler = await run.read('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js');
	await run.write('compiler.js', compiler);
	for (const path of [
		'scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationStaging.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationCodec.js',
		'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js',
		'experiments/00000-shared-cache-calculation-reuse/GpuProofHost.js',
	])
		await run.read(path);
	let proof;
	if (!bruneton) proof = new ApplicationProof(run, await new ApplicationControls().load(run), inventory);
	staging = new CacheStaging(inventory);
	await staging.allocate(run.files, run.root + '/staging');
	const abort = new AbortController();
	const interrupt = () => abort.abort(new Error('Interrupted by owner.'));
	process.once('SIGINT', interrupt);
	let gpu;
	try {
		gpu = await new GpuProofHost().run({
			run,
			jobs: [
				{
					id: 'point-local-union',
					buildRequest: input.buildRequest,
					ledger: inventory.unionLedger,
					wavelengths: input.wavelengths,
				},
			],
			sources: new Map([
				['compiler.js', compiler],
				['browser.js', await run.read('experiments/point-local-cache-builder/browser.js')],
			]),
			signal: abort.signal,
			maximumMilliseconds: 900000,
			acceptTile: async (job, wavelength, row, bytes) => {
				if (job !== 0) throw new Error('Unexpected job.');
				await proof?.tile(wavelength, row, bytes);
				await staging.accept(input.wavelengths.indexOf(wavelength), row, bytes);
			},
		});
	} finally {
		process.removeListener('SIGINT', interrupt);
	}
	await staging.close();
	const stagedBytes = staging.complete();
	await run.write('gpu.json', gpu);
	run.progress({phase: 'package', message: 'Encoding complete shared inventory with the production codec.'});
	const packageOwner = new CachePackage();
	const packet = await packageOwner.write(run, inventory);
	const directions = await run.read(packet.directionMap.path, packet.directionMap);
	let expandedValues = 0;
	let evaluation;
	if (bruneton) {
		const evaluatorPath = await run.files.resolve('experiments/point-local-cache-builder/BrunetonEvaluation.js');
		const {default: Evaluation} = await import(pathToFileURL(evaluatorPath).href);
		evaluation = await new Evaluation().run(run, packet, packageOwner, directions);
	} else {
		for (let channel = 0; channel < packet.channelCount; channel++) {
			const unique = await packageOwner.readChannel(run, packet, channel);
			for (let sceneIndex = 0; sceneIndex < packet.scenes.length; sceneIndex++) {
				const values = packageOwner.expand(packet, sceneIndex, unique, directions);
				const scene = packet.scenes[sceneIndex];
				for (let row = 0; row < scene.indexes.length; row++) {
					const expected = await proof.row(
						packet.coordinates[scene.indexes[row]],
						packet.wavelengths[channel],
					);
					for (let logical = 0; logical < packet.directionCount; logical++) {
						assert.equal(
							new Uint32Array(values.buffer)[row * packet.directionCount + logical],
							expected.readUInt32LE(directions.readUInt16LE(logical * 2) * 4),
						);
						expandedValues++;
					}
				}
			}
		}
	}
	await run.finish(evaluation?.accepted === false ? 'rejected' : 'accepted', {
		stage: bruneton ? 5 : 4,
		uniqueRows: inventory.coordinates.length,
		scenes: inventory.scenes.length,
		wavelengths: inventory.wavelengths,
		stagedBytes,
		gpuMilliseconds: gpu.elapsedMilliseconds,
		exactGpuValues: proof?.comparedValues,
		expandedValues,
		evaluation,
	});
} catch (error) {
	await staging?.close();
	await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
}
