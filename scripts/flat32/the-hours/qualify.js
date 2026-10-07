import path from 'node:path';
import {TheHoursRun} from './TheHoursRun.js';
import {TheHoursRetainedInputs} from './TheHoursRetainedInputs.js';
import {TheHoursMedia} from './TheHoursMedia.js';
import {TheHoursTemporalMeasurement} from './temporal-measurement.js';
import {TheHoursHorizonMeasurement} from './horizon-measurement.js';
import {TheHoursRecurrenceMeasurement} from './recurrence-measurement.js';
import {TheHoursHost} from './TheHoursHost.js';

const [parentRoot, manifestByteLength, manifestSha256] = process.argv.slice(2);
const workflowBitrate = Number(
	process.argv.find((value) => value.startsWith('--workflow-bitrate='))?.split('=')[1] ?? 40000000,
);
const hardwareAcceleration = process.argv.includes('--software') ? 'prefer-software' : 'prefer-hardware';
if (![40000000, 80000000, 160000000].includes(workflowBitrate))
	throw new Error('Select a registered 40, 80 or 160Mbps encoding policy.');
if (!/^[a-f0-9]{64}$/u.test(manifestSha256 ?? '') || !Number.isSafeInteger(Number(manifestByteLength)))
	throw new Error('Supply the exact retained capture root, manifest byte length and SHA-256.');
const run = new TheHoursRun({
	outputRoot: '.codex-tmp/p3-strobing-20261007/runs',
	evidenceRoot: 'C:/dev/flattened-steel',
});
const inputs = new TheHoursRetainedInputs({
	run,
	parentRoot,
	manifest: {path: 'artifact-manifest.json', byteLength: Number(manifestByteLength), sha256: manifestSha256},
});
await run.allocate('qualification');
let heartbeatTail = Promise.resolve();
const heartbeat = setInterval(
	/** Called while independent decoding or encoding is busy to retain bounded progress. */ () => {
		heartbeatTail = heartbeatTail.then(() => run.progress({phase: 'working', parentRoot}));
	},
	15000,
);
try {
	await inputs.load();
	const configuration = /** @type {TheHoursBrowserConfiguration} */ (await inputs.json('configuration.json'));
	const trace = /** @type {TheHoursBrowserResult} */ (await inputs.json('scene-trace.json'));
	const frameCount = configuration.durationSeconds * 30;
	if (
		trace.frames.length !== frameCount ||
		trace.recording.frameCount !== frameCount ||
		trace.frames.some(
			(frame, index) => Math.abs(frame.animationSeconds - configuration.startSeconds - index / 30) > 1e-12,
		)
	)
		throw new Error('Parent native source trace lacks complete exact presentations.');
	for (let index = 0; index < frameCount; index += 1)
		await inputs.path(`frames/${String(index).padStart(4, '0')}.png`);
	const sequence = path.join(path.dirname(await inputs.path('frames/0000.png')), '%04d.png');
	const originalWorkflow = await inputs.path('recording/original-workflow.mp4');
	const media = new TheHoursMedia(run);
	const source = await media.measure('lossless-native', ['-framerate', '30', '-i', sequence], frameCount, {
		width: configuration.width,
		height: configuration.height,
	});
	const originalSource = await media.measure(
		'lossless-original-detector',
		['-framerate', '30', '-i', sequence],
		frameCount,
	);
	const maximumNativeMeanDifference = Math.max(
		...source.flatMap((frame, index) =>
			Object.entries(frame.regions).map(([region, value]) =>
				Math.abs(value.meanLuma - trace.frames[index].sourceRegions[region].meanLuma),
			),
		),
	);
	if (maximumNativeMeanDifference > 1e-10)
		throw new Error('Retained lossless native frames differ from the measured presentation.');
	const independentDirectory = await run.directory('independent');
	const independentVideo = path.join(independentDirectory, 'lossless-source-x264.mp4');
	await media.execute('independent-encode', [
		'-n',
		'-framerate',
		'30',
		'-i',
		sequence,
		'-an',
		'-c:v',
		'libx264',
		'-preset',
		'slow',
		'-profile:v',
		'high',
		'-level:v',
		'5.2',
		'-b:v',
		'40M',
		'-pix_fmt',
		'yuv420p',
		'-r',
		'30',
		'-movflags',
		'+faststart',
		independentVideo,
	]);
	const encoded = await media.measure('independent-decoded', ['-i', independentVideo], frameCount);
	const workflowControl = await media.measure(
		'original-workflow-control-decoded',
		['-i', originalWorkflow],
		frameCount,
	);
	let workflow = workflowControl,
		replay = null;
	if (workflowBitrate !== 40000000 || hardwareAcceleration === 'prefer-software') {
		const host = new TheHoursHost({run, inputs});
		try {
			await host.start(configuration.width, configuration.height);
			replay = await host.reencode({
				width: configuration.width,
				height: configuration.height,
				durationSeconds: configuration.durationSeconds,
				startSeconds: configuration.startSeconds,
				bitrate: workflowBitrate,
				hardwareAcceleration,
				mediabunnyModuleUrl: '/mediabunny.js',
				sourceMeans: trace.frames.map((frame) => frame.sourceRegions),
			});
		} finally {
			await host.dispose();
		}
		await run.writeJson('workflow-replay.json', replay);
		workflow = await media.measure(
			'original-workflow-candidate-decoded',
			['-i', await run.outputPath('recording/original-workflow.mp4')],
			frameCount,
		);
	}
	const sourceTemporal = TheHoursTemporalMeasurement.evaluate(source, trace.frames),
		originalSourceTemporal = TheHoursTemporalMeasurement.evaluate(originalSource, trace.frames),
		encodedTemporal = TheHoursTemporalMeasurement.evaluate(encoded, trace.frames),
		workflowTemporal = TheHoursTemporalMeasurement.evaluate(workflow, trace.frames);
	const horizon =
		configuration.startSeconds === 10 || configuration.startSeconds === 46
			? {
					source: TheHoursHorizonMeasurement.evaluate(source, trace.frames),
					independent: TheHoursHorizonMeasurement.evaluate(encoded, trace.frames),
					originalWorkflow: TheHoursHorizonMeasurement.evaluate(workflow, trace.frames),
				}
			: null;
	const recurrence =
		configuration.startSeconds === 3
			? {
					source: TheHoursRecurrenceMeasurement.evaluate(source, trace.frames),
					independent: TheHoursRecurrenceMeasurement.evaluate(encoded, trace.frames),
					originalWorkflow: TheHoursRecurrenceMeasurement.evaluate(workflow, trace.frames),
				}
			: null;
	const pass =
		sourceTemporal.pass &&
		originalSourceTemporal.pass &&
		encodedTemporal.pass &&
		workflowTemporal.pass &&
		(!horizon || Object.values(horizon).every((value) => value.pass)) &&
		(!recurrence || Object.values(recurrence).every((value) => value.pass));
	const result = {
		parentRoot,
		frameCount,
		sourceTemporal,
		originalSourceTemporal,
		workflowBitrate,
		hardwareAcceleration,
		workflowControlTemporal: TheHoursTemporalMeasurement.evaluate(workflowControl, trace.frames),
		replay,
		encodedTemporal,
		workflowTemporal,
		horizon,
		recurrence,
		maximumNativeMeanDifference,
		pass,
		retainedEarlyPublications:
			configuration.startSeconds === 3
				? [112, 125].map((originalIndex) => ({
						originalIndex,
						clipIndex: originalIndex - 90,
						physical: trace.frames[originalIndex - 90],
						neighbors: source.slice(originalIndex - 92, originalIndex - 87),
					}))
				: [],
		acceptance: 'Automated short detector only; native owner inspection and full-film gates remain open',
	};
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(await run.finish(pass ? 'accepted' : 'rejected', result));
	if (!pass) process.exitCode = 2;
} catch (error) {
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(await run.finish('failed', {parentRoot, message: String(error), stack: error.stack}));
	process.exitCode = 1;
}
