import path from 'node:path';
import {TheHoursRun} from './TheHoursRun.js';
import {TheHoursRetainedInputs} from './TheHoursRetainedInputs.js';
import {TheHoursMedia} from './TheHoursMedia.js';
import {TheHoursTemporalMeasurement} from './temporal-measurement.js';
import {TheHoursHorizonMeasurement} from './horizon-measurement.js';
import {TheHoursRecurrenceMeasurement} from './recurrence-measurement.js';

const [parentRoot, manifestBytes, manifestSha256] = process.argv.slice(2);
if (!Number.isSafeInteger(Number(manifestBytes)) || !/^[a-f0-9]{64}$/u.test(manifestSha256 ?? ''))
	throw new Error('Supply the exact sealed film root and manifest identity.');
const run = new TheHoursRun({
	outputRoot: '.codex-tmp/p3-strobing-20261007/runs',
	evidenceRoot: 'C:/dev/flattened-steel',
});
const inputs = new TheHoursRetainedInputs({
	run,
	parentRoot,
	manifest: {path: 'artifact-manifest.json', byteLength: Number(manifestBytes), sha256: manifestSha256},
});
await run.allocate('film-qualification');
let heartbeatTail = Promise.resolve();
const heartbeat = setInterval(
	/** Called during independent decoding to retain bounded progress. */ () => {
		heartbeatTail = heartbeatTail.then(() => run.progress({phase: 'working', parentRoot}));
	},
	15000,
);
try {
	await inputs.load();
	const configuration = /** @type {TheHoursBrowserConfiguration} */ (await inputs.json('configuration.json'));
	const trace = /** @type {TheHoursBrowserResult} */ (await inputs.json('scene-trace.json'));
	if (
		configuration.width !== 3840 ||
		configuration.height !== 2160 ||
		configuration.durationSeconds !== 60 ||
		configuration.startSeconds !== 0 ||
		configuration.sceneColorPrecision !== 'float32' ||
		configuration.colorModel !== 'color-reset-slope-078-p2' ||
		trace.frames.length !== 1800 ||
		trace.recording.frameCount !== 1800 ||
		trace.recording.renderedSourceStateCount !== 1800 ||
		trace.recording.heldOutputSlotCount !== 0
	)
		throw new Error('Full film lacks complete original native presentations.');
	const output = /** @type {TheHoursVideoOutput} */ (trace.recording.output);
	const packets = output.packets;
	if (
		packets.length !== 1800 ||
		packets.some(
			(packet, index) =>
				packet.packetIndex !== index || packet.timestampMicroseconds !== Math.round((index * 1000000) / 30),
		)
	)
		throw new Error('Encoded packets do not match the complete original ideal cadence.');
	for (const [index, frame] of trace.frames.entries()) {
		const ordinal = frame.solarZenithDegrees >= 108 ? null : Math.floor(frame.solarZenithDegrees + 0.5);
		if (
			frame.animationSeconds !== index / 30 ||
			frame.instant !== configuration.original.frames[index].instant ||
			JSON.stringify(frame.camera) !== JSON.stringify(configuration.original.frames[index].camera) ||
			Math.abs(frame.solarZenithDegrees - configuration.original.frames[index].solarZenithDegrees) > 1e-10 ||
			frame.sharedCache.sceneOrdinal !== ordinal ||
			frame.sharedCache.gpuBytes > 859963392 ||
			frame.sharedCache.failures !== 0 ||
			frame.receiverLightIdentity !== frame.receiverLight.identity ||
			frame.lighting.receiverLightIdentity !== frame.receiverLight.identity ||
			frame.color.illuminanceLux !== frame.receiverLight.photopicTotalHorizontalIlluminance.value ||
			!frame.runtime.installed ||
			frame.runtime.shaderErrors.length
		)
			throw new Error(`Full film source/camera/lighting/publication mismatch at slot ${index}.`);
	}
	const video = await inputs.path('recording/original-workflow.mp4'),
		media = new TheHoursMedia(run);
	const decoded = await media.measure('workflow-full-decoded', ['-i', video], 1800);
	const source = trace.frames.map((frame, index) => ({frameIndex: index, regions: frame.sourceRegions}));
	const sourceTemporal = TheHoursTemporalMeasurement.evaluate(source, trace.frames),
		encodedTemporal = TheHoursTemporalMeasurement.evaluate(decoded, trace.frames);
	const horizon = {
		source: TheHoursHorizonMeasurement.evaluate(source, trace.frames),
		encoded: TheHoursHorizonMeasurement.evaluate(decoded, trace.frames),
	};
	if (Object.values(horizon).some((value) => value.windows.length !== 2))
		throw new Error('Full film must retain both complete horizon windows.');
	const recurrence = {
		source: TheHoursRecurrenceMeasurement.evaluate(source, trace.frames),
		encoded: TheHoursRecurrenceMeasurement.evaluate(decoded, trace.frames),
	};
	let maximumLosslessCaptureMeanDifference = 0;
	for (const capture of trace.recording.captures) {
		const index = capture.slotIndex;
		const image = await inputs.path(`frames/${String(index).padStart(4, '0')}.png`);
		const native = await media.measure(`native-capture-${index}`, ['-i', image], 1, {width: 3840, height: 2160});
		for (const [region, value] of Object.entries(native[0].regions))
			maximumLosslessCaptureMeanDifference = Math.max(
				maximumLosslessCaptureMeanDifference,
				Math.abs(value.meanLuma - source[index].regions[region].meanLuma),
			);
	}
	if (maximumLosslessCaptureMeanDifference > 1e-10)
		throw new Error('Native lossless milestones differ from the recorded source presentation.');
	const directory = await run.directory('deliverables');
	await media.execute('downscaled-copy', [
		'-n',
		'-i',
		video,
		'-an',
		'-vf',
		'scale=1024:576:flags=lanczos',
		'-c:v',
		'libx264',
		'-preset',
		'medium',
		'-crf',
		'18',
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'+faststart',
		path.join(directory, 'the-hours-1024x576.mp4'),
	]);
	const pass =
		sourceTemporal.pass &&
		encodedTemporal.pass &&
		Object.values(horizon).every((value) => value.pass) &&
		Object.values(recurrence).every((value) => value.pass);
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(
		await run.finish(pass ? 'accepted' : 'rejected', {
			parentRoot,
			frameCount: 1800,
			sourceTemporal,
			encodedTemporal,
			horizon,
			recurrence,
			maximumLosslessCaptureMeanDifference,
			completeStateAndPresentationSlots: true,
			pass,
			acceptance: 'Automated full-film gates only; native owner inspection and mapped source review remain open.',
		}),
	);
	if (!pass) process.exitCode = 2;
} catch (error) {
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(await run.finish('failed', {parentRoot, message: String(error), stack: error.stack}));
	process.exitCode = 1;
}
