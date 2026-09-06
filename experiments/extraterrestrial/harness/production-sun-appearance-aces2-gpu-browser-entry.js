import {createAces2GpuCanvas, createAces2Rec709100NitGpuTransform} from './lib/aces2-rec709-100nit-gpu.js';
import {runProductionSunAppearanceGpuVisualScene} from './lib/production-sun-appearance-gpu-visual-scene.js';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function bytesToBase64(bytes) {
	let output = '';
	const chunkSize = 0x8000;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) {
		output += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize)));
	}
	return btoa(output);
}

function base64ToBytes(value, expectedByteLength, label) {
	const binary = atob(value);
	requireCondition(binary.length === expectedByteLength, `${label} base64 byte count is inconsistent.`);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

function base64ToFloat32(value, expectedByteLength, label) {
	const bytes = base64ToBytes(value, expectedByteLength, label);
	requireCondition(bytes.byteLength % 4 === 0, `${label} is not float32-aligned.`);
	return new Float32Array(bytes.buffer);
}

function orderedConditions(fixture) {
	return [
		...(fixture.distant?.conditions ?? []).map((condition) => ({family: 'distant', condition})),
		...(fixture.flat?.conditions ?? []).map((condition) => ({family: 'flat', condition})),
	];
}

function conditionShard(conditions, index) {
	const request = conditions[index];
	return {
		id: `aces-evidence-${String(index + 1).padStart(2, '0')}-${request.family}-${request.condition.id}`,
		conditionIndex: index + 1,
		conditionCount: conditions.length,
		family: request.family,
		conditionId: request.condition.id,
	};
}

function previewMetadata(preview) {
	if (preview === null) return null;
	return {
		width: preview.width,
		height: preview.height,
		channels: preview.channels,
		verticalFovDegrees: preview.verticalFovDegrees,
		cameraSampleId: preview.cameraSampleId,
		encoding: preview.encoding,
		rowOrigin: preview.rowOrigin,
		channelOrder: preview.channelOrder,
		byteLength: preview.byteLength,
		finite: preview.finite,
		minimumSignedRgb: preview.minimumSignedRgb,
		maximumSignedRgb: preview.maximumSignedRgb,
	};
}

function sanitizeCondition(condition) {
	return {
		...condition,
		shaderSource: undefined,
		preview: previewMetadata(condition.preview),
	};
}

function sanitizeScene(result) {
	return {
		schemaVersion: result.schemaVersion,
		fixtureId: result.fixtureId,
		executionShard: result.executionShard,
		executionBackend: result.executionBackend,
		productionPath: result.productionPath,
		cpuReferenceUsed: result.cpuReferenceUsed,
		sourcePathConvergenceEvaluated: result.sourcePathConvergenceEvaluated,
		renderer: result.renderer,
		outputContract: result.outputContract,
		condition: sanitizeCondition(result.condition),
		claimLimits: result.claimLimits,
	};
}

function rawOrderingForScene(scene) {
	return scene.condition.viewports.flatMap((viewport) =>
		viewport.rawOrdering.comparisons.map((comparison) => ({
			...comparison,
			id: `${comparison.id}:gpu`,
			lane: 'gpu',
		})),
	);
}

function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function retainedPreview(scene) {
	const frame = scene.condition.preview;
	if (frame === null) return null;
	requireCondition(
		frame.finite === true && frame.channels === 4,
		`Scene ${scene.condition.id} returned an invalid preview.`,
	);
	return {
		conditionId: scene.condition.id,
		family: scene.condition.family,
		width: frame.width,
		height: frame.height,
		rowOrigin: frame.rowOrigin,
		channelOrder: frame.channelOrder,
		encoding: frame.encoding,
		byteLength: frame.byteLength,
		dataBase64: frame.dataBase64,
	};
}

function requireHardwareWebgl(renderer, label) {
	const facts = renderer?.webgl ?? renderer;
	const identity = [facts?.renderer, facts?.unmaskedRenderer, facts?.vendor, facts?.unmaskedVendor]
		.filter((value) => typeof value === 'string')
		.join(' | ');
	requireCondition(identity.length > 0, `${label} exposes no WebGL renderer identity.`);
	requireCondition(
		!/swiftshader|llvmpipe|software|warp|microsoft basic render/iu.test(identity),
		`${label} resolved to a software renderer: ${identity}`,
	);
	return identity;
}

async function collectGpuEvidence(fixture, reportProgress) {
	const conditions = orderedConditions(fixture);
	requireCondition(
		conditions.length === fixture.sampling.requiredConditionCount,
		'GPU evidence condition inventory differs from the frozen fixture.',
	);
	const scenes = [];
	const retainedPreviews = new Map();
	const rawOrdering = [];
	for (let index = 0; index < conditions.length; index += 1) {
		const shard = conditionShard(conditions, index);
		await reportProgress({
			stage: 'evidence-condition-start',
			conditionIndex: index + 1,
			conditionCount: conditions.length,
			conditionId: shard.conditionId,
		});
		const result = await runProductionSunAppearanceGpuVisualScene(fixture, reportProgress, shard);
		requireHardwareWebgl(result.renderer, `GPU evidence condition ${shard.conditionId}`);
		scenes.push(sanitizeScene(result));
		rawOrdering.push(...rawOrderingForScene(result));
		const preview = retainedPreview(result);
		if (preview !== null) retainedPreviews.set(preview.conditionId, preview);
		await reportProgress({
			stage: 'evidence-condition-complete',
			conditionIndex: index + 1,
			conditionCount: conditions.length,
			conditionId: shard.conditionId,
		});
	}
	const sampleCount = scenes.reduce(
		(sum, scene) =>
			sum + scene.condition.viewports.reduce((viewportSum, viewport) => viewportSum + viewport.samples.length, 0),
		0,
	);
	requireCondition(sampleCount === fixture.sampling.requiredSampleCount, 'GPU evidence sample count is incomplete.');
	requireCondition(
		rawOrdering.length === fixture.sampling.requiredRawOrderingPairCount,
		'GPU evidence raw-order pair count is incomplete.',
	);
	rawOrdering.sort((left, right) => compareStrings(left.id, right.id));
	requireCondition(
		new Set(rawOrdering.map((comparison) => comparison.id)).size === rawOrdering.length,
		'GPU evidence raw-order comparison identities are not unique.',
	);
	const frames = [...retainedPreviews.values()];
	requireCondition(
		frames.length === 2,
		'GPU evidence did not retain exactly two authored signed-float preview frames.',
	);
	return {
		browserEvidence: {
			schemaVersion: 'aces2-sun-appearance-same-run-gpu-evidence-v1',
			fixtureId: fixture.id,
			executionBackend: 'gpu',
			productionPath: 'sealed production snapshot normal GPU path',
			cpuReferenceUsed: false,
			sourcePathConvergenceEvaluated: false,
			conditions: scenes.map((scene) => scene.condition),
			renderers: scenes.map((scene) => ({conditionId: scene.condition.id, renderer: scene.renderer})),
			outputContracts: scenes.map((scene) => ({
				conditionId: scene.condition.id,
				outputContract: scene.outputContract,
			})),
			rawOrdering: {
				passed: rawOrdering.every((comparison) => comparison.gpuStrictlyOrdered),
				comparisonCount: rawOrdering.length,
				comparisons: rawOrdering,
			},
			sampleCount,
		},
		frames,
	};
}

function decodeEvaluationInput(request) {
	requireCondition(
		request?.schemaVersion === 'aces2-glsl-evaluation-input-v1',
		'Host returned an invalid GLSL request.',
	);
	requireCondition(request.authorized === true, 'Host did not authorize GLSL evaluation.');
	const pixelCount = Number(request.pixelCount);
	requireCondition(Number.isSafeInteger(pixelCount) && pixelCount > 0, 'GLSL evaluation pixel count is invalid.');
	const expectedByteLength = pixelCount * 16;
	const values = base64ToFloat32(request.rgba32fBase64, expectedByteLength, 'GLSL evaluation input');
	return {pixelCount, values};
}

function transformGrid(transform, gl, request, outputRoute) {
	const input = decodeEvaluationInput(request);
	const maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	const width = Math.min(input.pixelCount, maximumTextureSize, gl.drawingBufferWidth);
	const height = Math.ceil(input.pixelCount / width);
	requireCondition(
		height <= gl.drawingBufferHeight,
		'Comprehensive GLSL grid exceeds the default framebuffer bounds.',
	);
	const padded = new Float32Array(width * height * 4);
	padded.set(input.values);
	const floatOutput = transform.transformFloat(padded, width, height).subarray(0, input.pixelCount * 4);
	const codeOutput = transform
		.transformDefaultFramebufferCodes(padded, width, height, outputRoute.shaderEncodesSrgb)
		.subarray(0, input.pixelCount * 4);
	return {
		schemaVersion: 'aces2-glsl-evaluation-output-v1',
		pixelCount: input.pixelCount,
		packedWidth: width,
		packedHeight: height,
		floatEncoding: 'float32-le-rgba-base64',
		floatByteLength: floatOutput.byteLength,
		floatBase64: bytesToBase64(new Uint8Array(floatOutput.buffer, floatOutput.byteOffset, floatOutput.byteLength)),
		codeEncoding: 'rgba8-base64',
		codeByteLength: codeOutput.byteLength,
		codesBase64: bytesToBase64(codeOutput),
		outputRoute,
	};
}

function resolveOutputRoute(browserEvidence) {
	const contracts = browserEvidence.outputContracts.map((entry) => entry.outputContract);
	const classifications = new Set(contracts.map((entry) => entry.defaultFramebufferQ8?.classification));
	const officialEncodings = new Set(contracts.map((entry) => entry.requiredOfficialCtlEncoding));
	requireCondition(
		classifications.size === 1 && officialEncodings.size === 1,
		'Same-run framebuffer output contracts disagree.',
	);
	const classification = [...classifications][0];
	const requiredOfficialCtlEncoding = [...officialEncodings][0];
	requireCondition(
		(classification === 'identity-q8' && requiredOfficialCtlEncoding === 'srgb-piecewise') ||
			(classification === 'srgb-oetf-q8' && requiredOfficialCtlEncoding === 'none-renderer-supplies-srgb-oetf'),
		'Same-run framebuffer output contract is unresolved.',
	);
	return {
		classification,
		requiredOfficialCtlEncoding,
		shaderEncodesSrgb: classification === 'identity-q8',
		finalCodes: 'actual default-framebuffer RGBA8 readback',
	};
}

function tableEvidence(transform) {
	return {
		schemaVersion: 'aces2-rec709-100nit-derived-tables-v1',
		reach: Array.from(transform.parameters.reachTable),
		cuspJmGammaHue: Array.from(transform.parameters.cuspTexture),
		limitJ: transform.parameters.compression.limitJ,
		forwardLimit: transform.parameters.tone.forwardLimit,
		hueSearchRange: transform.parameters.compression.hueSearchRange,
		lookupContract: {
			cuspJm: 'full padded binary search initialized by wrapped floor(h*360/360)+1; normalized interval weight',
			upperHullGamma:
				'narrowed padded binary search initialized by wrapped floor(h*362/360)+1; unnormalized h-h_lo weight',
		},
	};
}

function renderPreview(transform, frame, scene, outputRoute) {
	const signedFrame = base64ToFloat32(frame.dataBase64, frame.byteLength, `Signed scene frame ${frame.conditionId}`);
	const codes = transform.transformDefaultFramebufferCodes(
		signedFrame,
		frame.width,
		frame.height,
		outputRoute.shaderEncodesSrgb,
	);
	return {
		conditionId: frame.conditionId,
		family: frame.family,
		width: frame.width,
		height: frame.height,
		rowOrigin: frame.rowOrigin,
		channelOrder: 'RGBA',
		encoding: 'srgb-piecewise-rgba8-base64',
		byteLength: codes.byteLength,
		codesBase64: bytesToBase64(codes),
		outputRoute,
		scene: sanitizeScene(scene),
	};
}

async function rerenderPreview(transform, fixture, reportProgress, conditionId, outputRoute) {
	const conditions = orderedConditions(fixture);
	const index = conditions.findIndex((request) => request.condition.id === conditionId);
	requireCondition(index >= 0, `GPU scene fixture lacks preview condition ${conditionId}.`);
	requireCondition(
		conditions[index].condition.requiredPreview === true,
		`${conditionId} is not an authored preview.`,
	);
	const scene = await runProductionSunAppearanceGpuVisualScene(
		fixture,
		reportProgress,
		conditionShard(conditions, index),
	);
	requireHardwareWebgl(scene.renderer, `GPU preview rerender ${conditionId}`);
	const frame = retainedPreview(scene);
	requireCondition(frame !== null, `GPU preview rerender ${conditionId} returned no signed frame.`);
	return renderPreview(transform, frame, scene, outputRoute);
}

export async function runAces2SunAppearanceGpuVisualCandidate({
	decisionFixture,
	sceneFixture,
	reportProgress = async () => {},
	requestGlslEvaluation = async () => ({authorized: false}),
	authorizePreviews = async () => ({authorized: false}),
}) {
	requireCondition(
		decisionFixture?.schemaVersion === 'aces2-sun-appearance-gpu-visual-candidate-v1',
		'ACES GPU decision fixture is unsupported.',
	);
	requireCondition(
		sceneFixture?.schemaVersion === 'production-sun-appearance-gpu-visual-v1',
		'GPU scene fixture is unsupported.',
	);
	requireCondition(typeof reportProgress === 'function', 'ACES GPU progress reporter must be a function.');
	requireCondition(typeof requestGlslEvaluation === 'function', 'ACES GPU reference requester must be a function.');
	requireCondition(typeof authorizePreviews === 'function', 'ACES GPU preview authorizer must be a function.');
	requireCondition(
		decisionFixture.generatedInputReuse === false,
		'ACES GPU decision fixture must forbid generated input reuse.',
	);
	requireCondition(
		new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 4,
		'ACES GPU evidence requires a little-endian browser runtime.',
	);

	await reportProgress({stage: 'same-run-gpu-evidence-start'});
	const evidence = await collectGpuEvidence(sceneFixture, reportProgress);
	await reportProgress({stage: 'same-run-gpu-evidence-complete', sampleCount: evidence.browserEvidence.sampleCount});
	const outputRoute = resolveOutputRoute(evidence.browserEvidence);
	const glslRequest = await requestGlslEvaluation({
		browserEvidence: evidence.browserEvidence,
		frames: evidence.frames,
		outputRoute,
	});
	if (glslRequest?.authorized !== true) {
		return {
			schemaVersion: 'aces2-sun-appearance-gpu-visual-candidate-browser-v1',
			decisionFixtureId: decisionFixture.id,
			sceneFixtureId: sceneFixture.id,
			browserEvidence: evidence.browserEvidence,
			glslRequest,
			previewAuthorization: {authorized: false, reason: 'official-reference-gate-did-not-authorize-glsl'},
			previews: [],
			generatedInputReuse: false,
		};
	}

	const maximumViewportWidth = Math.max(...sceneFixture.viewports.map((viewport) => viewport.widthPixels));
	const maximumViewportHeight = Math.max(...sceneFixture.viewports.map((viewport) => viewport.heightPixels));
	const {canvas, gl} = createAces2GpuCanvas(maximumViewportWidth, maximumViewportHeight);
	document.body.append(canvas);
	const transform = createAces2Rec709100NitGpuTransform(gl);
	try {
		const debug = gl.getExtension('WEBGL_debug_renderer_info');
		const transformWebgl = {
			version: gl.getParameter(gl.VERSION),
			shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			vendor: gl.getParameter(gl.VENDOR),
			renderer: gl.getParameter(gl.RENDERER),
			unmaskedVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
			unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
			contextAttributes: gl.getContextAttributes(),
		};
		requireHardwareWebgl(transformWebgl, 'ACES GPU transform');
		await reportProgress({stage: 'glsl-grid-start', pixelCount: glslRequest.pixelCount});
		const glsl = transformGrid(transform, gl, glslRequest, outputRoute);
		const tables = tableEvidence(transform);
		await reportProgress({stage: 'glsl-grid-complete', pixelCount: glsl.pixelCount});
		const previewAuthorization = await authorizePreviews({
			transformId: transform.id,
			profile: transform.parameters.profile,
			glsl,
			tables,
			webgl: transformWebgl,
		});
		const previews = [];
		if (previewAuthorization?.authorized === true) {
			for (const conditionId of decisionFixture.previewConditionIds) {
				await reportProgress({stage: 'candidate-preview-start', conditionId});
				previews.push(await rerenderPreview(transform, sceneFixture, reportProgress, conditionId, outputRoute));
				await reportProgress({stage: 'candidate-preview-complete', conditionId});
			}
		}
		return {
			schemaVersion: 'aces2-sun-appearance-gpu-visual-candidate-browser-v1',
			decisionFixtureId: decisionFixture.id,
			sceneFixtureId: sceneFixture.id,
			transformId: transform.id,
			profile: transform.parameters.profile,
			browserEvidence: evidence.browserEvidence,
			glsl,
			tables,
			previewAuthorization,
			previews,
			claimBoundary:
				'Appearance Steps 5.4-5.5 first-view checkpoint only; final production CPU/refined verification and promotion remain deferred.',
			generatedInputReuse: false,
		};
	} finally {
		transform.dispose();
		gl.getExtension('WEBGL_lose_context')?.loseContext();
		canvas.remove();
	}
}
