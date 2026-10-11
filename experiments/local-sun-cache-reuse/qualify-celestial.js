import path from 'node:path';
import {readFile, access} from 'node:fs/promises';
import {Input, BufferSource, ALL_FORMATS} from 'mediabunny';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, outputRoot, checkPath, hash, hashFile} from './run-boundary.js';

/** Authenticate bounded celestial delivery, current executable inputs and reserve restoration.
 *
 * This data-only qualifier rejects missing or stale parents, incomplete GPU
 * gates, resource failures, retained profiles/locks or an unexpected preview.
 * It creates new evidence and never changes a parent run.
 * @returns {Promise<void>} - Sealed aggregate qualification and derivation.
 */
async function main() {
	const run = await ExperimentRun.create('celestial-report');
	let failure = null;
	try {
		if (process.argv.length !== 6)
			throw new Error('Sun capture, combined capture, matching guard and admission proof required.');
		const [sunName, combinedName, guardName, admissionName] = process.argv.slice(2),
			parents = [];
		/** Read one complete authenticated parent artifact.
		 *
		 * @param {string} name - Sealed accepted run.
		 * @param {string} artifact - Manifest-listed input.
		 * @returns {Promise<Uint8Array>} - Authenticated bytes.
		 */
		async function load(name, artifact) {
			const parent = await readParent(name, artifact);
			parents.push({...parent, bytes: undefined});
			return parent.bytes;
		}
		const decode = (/** @type {Uint8Array} */ bytes) => JSON.parse(new TextDecoder().decode(bytes));
		const sun = decode(await load(sunName, 'result.json')),
			combined = decode(await load(combinedName, 'result.json')),
			guard = decode(await load(guardName, 'result.json')),
			guardInput = decode(await load(guardName, 'inputs.json')),
			inputs = decode(await load(combinedName, 'inputs.json')),
			admission = decode(await load(admissionName, 'result.json'));
		if (
			sun.stage !== 'sun' ||
			sun.rows.length !== 3 ||
			combined.schema !== 'local-sun-p5-celestial-delivery-v2' ||
			combined.stage !== 'combined' ||
			combined.rows.length !== 3 ||
			combined.glError !== 0 ||
			combined.cacheCount !== 1 ||
			!combined.sceneOcclusion ||
			!combined.cancellationVerified ||
			combined.cleanup.length !== 4
		)
			throw new Error('Incomplete physical/celestial delivery.');
		if (
			!combined.lifecycle ||
			Object.entries(combined.lifecycle).some(
				([name, value]) => name !== 'scope' && name !== 'diagnostics' && value !== true,
			) ||
			combined.preview?.frames !== 24 ||
			combined.preview?.frameRate !== 12
		)
			throw new Error('Incomplete lifecycle/preview gates.');
		for (const row of combined.rows) {
			const t = row.transport,
				s = row.starProof;
			if (
				!row.litPixels ||
				t.maxAbsolute > 3e-6 ||
				t.maxRelative > 3e-5 ||
				t.sunCenterCoverage <= 0 ||
				Math.abs(t.radiusPixels - t.expectedRadiusPixels) > 1e-6 ||
				s.catalogCount !== 2000 ||
				!s.occupiedPixels ||
				s.maxProjectedPixelDifference > 0.1 ||
				s.maxPixelDifference > 1 ||
				s.maxPaletteRelative > 1e-5 ||
				s.maxConsumerRelative > 3e-5 ||
				!s.consumerSpectrum.some((v) => v > 0)
			)
				throw new Error('A focused GPU geometry/spectral gate failed.');
		}
		for (const row of combined.cleanup)
			for (const child of [row.sun, row.stellar])
				if (child.status !== 'disposed' || child.createdTargetCount !== child.disposedTargetCount)
					throw new Error('Celestial cleanup counts disagree.');
		if (
			guard.exitCode !== 0 ||
			guard.failure ||
			!guard.resourceQualified ||
			guardInput.limits.maximumBytes !== 8589934592 ||
			guardInput.limits.reserveBytes !== 6442450944 ||
			guardInput.limits.maximumMilliseconds !== 600000 ||
			guardInput.launcher.script !== 'run-celestial.js' ||
			guardInput.launcher.arguments.join() !== '--stage=combined' ||
			!guardInput.temporaryException.scope.includes('excludes P6')
		)
			throw new Error('Wrong resource scope or failed guard.');
		const launcher = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/run-celestial.js');
		if (hash(await readFile(launcher)) !== guardInput.launcher.sha256)
			throw new Error('Guarded launcher source is stale.');
		for (const identity of inputs.sources) {
			const file = path.resolve(repositoryRoot, identity.path);
			await checkPath(repositoryRoot, file);
			const observed = await hashFile(repositoryRoot, file);
			if (observed.sha256 !== identity.sha256 || observed.byteLength !== identity.byteLength)
				throw new Error('Captured executable/source input is stale: ' + identity.path);
		}
		if (
			admission.schema !== 'p5-celestial-admission-conventions-v1' ||
			admission.rows.length !== 6 ||
			admission.rows.some((row) => row.heavyChildLaunched) ||
			admission.overhead.length !== 15 ||
			admission.defaultReserveGiB !== 8
		)
			throw new Error('Admission/convention proof incomplete.');
		/** Require the named transient output to be absent.
		 *
		 * @param {string} target - Contained profile/lock path.
		 * @returns {Promise<void>} - Rejection if any artifact is retained or inspection fails.
		 */
		async function absent(target) {
			await checkPath(outputRoot, target);
			try {
				await access(target);
			} catch (error) {
				if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
				throw error;
			}
			throw new Error('Transient output remains: ' + target);
		}
		await absent(path.join(outputRoot, 'heavy-execution.lock'));
		for (const name of [sunName, combinedName]) await absent(path.join(outputRoot, 'runs', name, 'profile'));
		for (const id of ['flat-0', 'flat-90', 'flat-180']) {
			await load(sunName, id + '-sun.png');
			await load(combinedName, id + '-combined.png');
		}
		await load(combinedName, 'flat-180-stars.png');
		await load(combinedName, 'flat-180-star-index.png');
		const preview = await load(combinedName, 'preview.mp4'),
			media = new Input({source: new BufferSource(preview), formats: ALL_FORMATS});
		let previewFacts;
		try {
			const track = await media.getPrimaryVideoTrack();
			previewFacts = {
				durationSeconds: await media.computeDuration(),
				codec: track?.codec,
				width: track?.codedWidth,
				height: track?.codedHeight,
			};
			if (
				previewFacts.durationSeconds !== 2 ||
				previewFacts.width !== 720 ||
				previewFacts.height !== 414 ||
				previewFacts.codec !== 'avc'
			)
				throw new Error('Unexpected bounded preview container.');
		} finally {
			media.dispose();
		}
		const sourceFiles = [];
		for (const name of ['qualify-celestial.js', 'parent-evidence.js', 'run-boundary.js', 'ExperimentRun.js']) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, file);
			sourceFiles.push({path: path.relative(repositoryRoot, file), ...(await hashFile(repositoryRoot, file))});
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					command: process.argv,
					node: process.version,
					parents,
					sources: sourceFiles,
					operation:
						'Authenticate complete sealed parent inventories and executable inputs; evaluate frozen focused gates; read MP4 metadata; verify no retained Chrome profile or execution lock. Source-review completion is a separate maintained-ledger gate.',
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'p5-celestial-qualification-v1',
					numericalDeliveryQualified: true,
					sunRun: sunName,
					combinedRun: combinedName,
					guardRun: guardName,
					admissionRun: admissionName,
					rows: combined.rows,
					preview: previewFacts,
					lifecycle: combined.lifecycle,
					cancellationVerified: combined.cancellationVerified,
					sceneOcclusion: combined.sceneOcclusion,
					cleanup: combined.cleanup,
					costs: {
						elapsedMilliseconds: combined.elapsedMilliseconds,
						logicalPeakBytes: combined.peakAdmittedBytes,
						sampledPrivatePeakBytes: guard.peakPrivateBytes,
						sampledWorkingSetPeakBytes: guard.peakWorkingSetBytes,
						minimumMachineFreeBytes: guard.minimumFreeBytes,
					},
					defaultReserveRestored: true,
					limits: 'Three standard Sun-facing scenes, catalog-wide projection and palette checks, one selected stellar consumer probe per scene, explicit context callbacks and draw failure. No absolute physical accuracy, real device-loss exercise, production promotion or full P6 film.',
				},
				null,
				'\t',
			),
		);
	} catch (error) {
		failure = error instanceof Error ? error.stack : String(error);
		process.exitCode = 1;
	} finally {
		await run.finish(failure ? 'failed' : 'accepted', failure);
		console.log(run.name);
		if (failure) console.log(failure);
	}
}
await main();
