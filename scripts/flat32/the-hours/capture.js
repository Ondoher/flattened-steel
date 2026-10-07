import {createHash} from 'node:crypto';
import {TheHoursRun} from './TheHoursRun.js';
import {TheHoursPackageInputs} from './TheHoursPackageInputs.js';
import {TheHoursHost} from './TheHoursHost.js';
import {TheHoursShortGate} from './TheHoursShortGate.js';
import {
	THE_HOURS_PACKAGE_ROOT,
	THE_HOURS_PACKAGE_REPORT,
	THE_HOURS_ORIGINAL,
	THE_HOURS_SHORT_CONTROLS,
	THE_HOURS_PRESENTATION_FILTERS,
} from './consts.js';

const operation = process.argv[2] ?? 'proof';
if (
	![
		'proof',
		'scenes',
		'film',
		'daylight',
		'sunrise',
		'sunset',
		'early-ground',
		'early-ground-float32',
		'daylight-float32',
		'sunrise-float32',
		'sunset-float32',
	].includes(operation)
)
	throw new Error(
		'Select a registered short proof operation. Full film requires a separate accepted short-proof gate.',
	);
const run = new TheHoursRun({outputRoot: '.codex-tmp/p3-strobing-20261007/runs', evidenceRoot: 'D:/flattened-steel'});
const inputs = new TheHoursPackageInputs({run, packageRoot: THE_HOURS_PACKAGE_ROOT, report: THE_HOURS_PACKAGE_REPORT});
const host = new TheHoursHost({run, inputs});
await run.allocate(operation);
let heartbeatTail = Promise.resolve();
const heartbeat = setInterval(
	/** Called by the task timer to retain progress while shader preparation is busy. */ () => {
		heartbeatTail = heartbeatTail.then(() => run.progress({phase: 'working', operation}));
	},
	15000,
);
try {
	const gate =
		operation === 'film'
			? await new TheHoursShortGate(run).admit({
					path: process.argv[3],
					byteLength: Number(process.argv[4]),
					sha256: process.argv[5],
				})
			: null;
	const packageProof = await inputs.authenticate();
	await run.writeJson('package-proof.json', packageProof);
	const original = /** @type {TheHoursOriginalTrace} */ (await run.parentJson(THE_HOURS_ORIGINAL));
	const controlName = operation.replace(/-float32$/u, '');
	const control = THE_HOURS_SHORT_CONTROLS[controlName]
		? /** @type {TheHoursOriginalControl} */ (await run.parentJson(THE_HOURS_SHORT_CONTROLS[controlName]))
		: null;
	if (
		control &&
		(control.colorResponse !== 'monotone-p2' ||
			control.durationSeconds !== 4 ||
			control.framesPerSecond !== 30 ||
			control.seed !== 3202609)
	)
		throw new Error('Selected POC short control is incompatible.');
	const width = operation === 'film' || operation.startsWith('early-ground') ? 3840 : 1280,
		height = operation === 'film' || operation.startsWith('early-ground') ? 2160 : 720;
	await host.start(width, height);
	const proof = await host.proof();
	await run.writeJson('gpu-proof.json', proof);
	let trace;
	if (operation !== 'proof') {
		const configuration = {
			original,
			width,
			height,
			colorModel: 'color-reset-slope-078-p2',
			startSeconds: {film: 0, scenes: 30, daylight: 16, sunrise: 10, sunset: 46, 'early-ground': 3}[controlName],
			durationSeconds:
				operation === 'film' ? 60 : operation === 'scenes' ? 0 : operation.startsWith('early-ground') ? 2 : 4,
			sceneColorPrecision:
				operation === 'film' || operation === 'scenes' || operation.endsWith('-float32')
					? 'float32'
					: 'float16',
			bitrate: gate?.filmBitrate ?? 40000000,
			fixedCamera: control?.fixedCamera,
			originalPresentationFilters: THE_HOURS_PRESENTATION_FILTERS,
			mediabunnyModuleUrl: '/mediabunny.js',
			asset: {
				rootUrl: '/cache/',
				report: THE_HOURS_PACKAGE_REPORT,
				packageSetIdentity: packageProof.packageSetIdentity,
				solarInterpolation: 'monotone-cubic',
				transitionQualification: {
					evidenceId: `sha256:${createHash('sha256').update(JSON.stringify(proof.budget)).digest('hex')}`,
					targetId: proof.budget.targetId,
					maximumBytes: proof.budget.maximumBytes,
				},
			},
		};
		await run.writeJson('configuration.json', configuration);
		if (operation === 'scenes') {
			const scenes = await host.qualifyScenes(/** @type {TheHoursBrowserConfiguration} */ (configuration));
			await run.writeJson('scene-publication-proof.json', scenes);
		} else trace = await host.record(/** @type {TheHoursBrowserConfiguration} */ (configuration));
		if (trace) await run.writeJson('scene-trace.json', trace);
	}
	await host.dispose();
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(
		await run.finish('accepted', {
			operation,
			packageProof,
			proof,
			frameCount: trace?.frames.length ?? 0,
			acceptance:
				operation === 'proof'
					? 'GPU/color/package proof only'
					: 'capture completed; temporal and encoding qualification pending',
		}),
	);
} catch (error) {
	await host.dispose();
	clearInterval(heartbeat);
	await heartbeatTail;
	console.log(await run.finish('failed', {operation, message: String(error), stack: error.stack}));
	process.exitCode = 1;
}
