import {evaluateOrders, prepareViewPlan} from '../numerics/view.js';
import {validateChannelDiagnostics} from '../continuation/capture/diagnostics.js';

const FIELD_IDS = ['J1', 'J2', 'J3', 'J4'];
const TRANSPORT_FIELD_IDS = ['L1', 'L2', 'L3'];

/** Reject invalid capture state. @param {unknown} condition @param {string} message */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Hash exact bytes through Web Crypto. @param {Uint8Array} bytes @returns {Promise<string>} */
async function digest(bytes) {
	const buffer = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buffer).set(bytes);
	const result = await crypto.subtle.digest('SHA-256', buffer);
	return Array.from(new Uint8Array(result), (value) => value.toString(16).padStart(2, '0')).join('');
}

/** Encode little-endian binary64 spectra. @param {SkyGpuChannelHeader} header @param {Float64Array} values @returns {ArrayBuffer} */
function channelBytes(header, values) {
	const metadata = new TextEncoder().encode(JSON.stringify(header));
	const buffer = new ArrayBuffer(4 + metadata.length + values.length * 8);
	const bytes = new Uint8Array(buffer);
	const data = new DataView(bytes.buffer);
	data.setUint32(0, metadata.length, true);
	bytes.set(metadata, 4);
	for (let index = 0; index < values.length; index++)
		data.setFloat64(4 + metadata.length + index * 8, values[index], true);
	return buffer;
}

/**
 * Execute the compact recipe through an authenticated dynamic compiler URL.
 * Sparse pure fields live for one channel; only binary64 spectra leave the page.
 * @param {string} apiUrl - This host's unguessable loopback endpoint prefix.
 * @param {string} compilerUrl - Allowlisted, hash-authenticated production module URL.
 * @param {SkyGpuBrowserEvaluation} [evaluationCapability] - Optional experiment-owned sparse preparation/evaluation; omitted uses the original four-order view calculation.
 * @returns {Promise<SkyGpuBrowserResult>} - Browser observations and cleanup request.
 */
export async function runGpuBrowser(apiUrl, compilerUrl, evaluationCapability) {
	const started = performance.now();
	const response = await fetch(`${apiUrl}/control`);
	requireCondition(response.ok, 'Cannot load the compact GPU control.');
	/** @type {SkyGpuControl} */
	const control = await response.json();
	/** @type {SkyGpuCompilerModule} */
	const compiler = await import(compilerUrl);
	requireCondition(
		typeof compiler.compileDistantSunSceneCacheWavelength === 'function',
		'Authenticated compiler capability is missing.',
	);
	requireCondition(
		new Uint8Array(Uint32Array.of(1).buffer)[0] === 1,
		'Sparse field hashing requires little-endian typed arrays.',
	);
	const plan = evaluationCapability
		? evaluationCapability.prepare(control.buildRequest, control.scenes, control.controls, control.continuation)
		: prepareViewPlan(control.buildRequest, control.scenes, control.controls);
	requireCondition(
		plan.rayCount === control.scenes.length * 81 &&
			plan.views.length === control.controls.viewIntervals.length * control.controls.solarInterpolations.length &&
			plan.representations.length === control.controls.representations.length,
		'GPU view capability changed the declared main spectrum shape.',
	);
	const coordinateWords = new Uint32Array(plan.coordinates.length * 2);
	for (const [index, point] of plan.coordinates.entries()) {
		coordinateWords[index * 2] = point.x;
		coordinateWords[index * 2 + 1] = point.y;
	}
	const coordinateSha256 = await digest(new Uint8Array(coordinateWords.buffer));
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
	requireCondition(gl, 'WebGL2 is required.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = {
		vendor: String(gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR)),
		renderer: String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER)),
		version: String(gl.getParameter(gl.VERSION)),
		shadingLanguageVersion: String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION)),
		maximumTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
		maximumViewport: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
	};
	const domains = control.buildRequest.transportSpec.domains;
	const widthJ = domains.outgoing.directionCount,
		widthL = domains.incoming.directionCount;
	const height = domains.position.count * domains.solarZenith.count;
	requireCondition(widthJ === 6 * domains.outgoing.faceWidth ** 2, 'Outgoing texture width and face width disagree.');
	for (const width of [widthJ, widthL])
		requireCondition(
			width <= renderer.maximumTextureSize && width <= renderer.maximumViewport[0],
			'Requested field width exceeds actual GPU limits.',
		);
	requireCondition(
		height <= renderer.maximumTextureSize && height <= renderer.maximumViewport[1],
		'Requested field height exceeds actual GPU limits.',
	);
	requireCondition(
		!/swiftshader|llvmpipe|software rasterizer/iu.test(renderer.renderer),
		'Software recurrence is outside this GPU experiment.',
	);
	for (const point of plan.coordinates)
		requireCondition(
			Number.isInteger(point.x) &&
				point.x >= 0 &&
				point.x < widthJ &&
				Number.isInteger(point.y) &&
				point.y >= 0 &&
				point.y < height,
			'Sparse coordinate escaped the requested field.',
		);
	let peakLiveFieldBytes = 0,
		contextLossRequested = false;
	const progress = async (message, completed) => {
		const result = await fetch(`${apiUrl}/progress`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({phase: 'gpu', message, completed, total: control.channels.length}),
		});
		requireCondition(result.ok, 'Owning run rejected GPU progress.');
	};
	try {
		await progress(`Renderer ${renderer.renderer}; ${plan.coordinates.length} sparse coordinates.`, 0);
		for (const [ordinal, channel] of control.channels.entries()) {
			/** @type {Float32Array[]} */
			const pureOrders = [];
			let transportCallbacks = 0;
			const cumulative = new Float32Array(plan.coordinates.length);
			/** @type {SkyGpuFieldCheck[]} */
			const fieldChecks = [];
			/** @type {SkyGpuEvaluation | null} */
			let evaluation = null;
			let evaluationMilliseconds = 0;
			const compilerReport = await compiler.compileDistantSunSceneCacheWavelength({
				gl,
				buildRequest: control.buildRequest,
				wavelengthIndex: channel,
				compileSceneCaches: false,
				fieldProbeCoordinates: Object.fromEntries(FIELD_IDS.map((field) => [field, plan.coordinates])),
				reportProgress: async (stage) => {
					if (
						stage === 'programs-compiled' ||
						stage.endsWith(`:${domains.solarZenith.count}/${domains.solarZenith.count}`)
					)
						await progress(`Channel ${channel}: ${stage}`, ordinal);
				},
				onFieldProbes: async ({fieldId, wavelengthIndex, values}) => {
					requireCondition(wavelengthIndex === channel, 'Compiler callback channel changed.');
					if (TRANSPORT_FIELD_IDS.includes(fieldId)) {
						// Unrequested fields still invoke the observer with no coordinates/values.
						requireCondition(
							fieldId === TRANSPORT_FIELD_IDS[transportCallbacks] &&
								transportCallbacks + 1 === pureOrders.length &&
								values.length === 0,
							'Unrequested transport-field callback changed order or contained values.',
						);
						transportCallbacks++;
						return;
					}
					requireCondition(
						fieldId === FIELD_IDS[pureOrders.length],
						'Compiler field/channel callback order changed.',
					);
					requireCondition(values.length === plan.coordinates.length, 'Sparse callback length changed.');
					const pure = new Float32Array(values.length);
					let minimum = Infinity,
						maximum = -Infinity;
					for (let index = 0; index < values.length; index++) {
						const entry = values[index],
							point = plan.coordinates[index];
						requireCondition(
							entry.x === point.x && entry.y === point.y,
							'Compiler changed sparse coordinate ordering.',
						);
						requireCondition(
							Number.isFinite(entry.value) && entry.value >= 0,
							'Compiler emitted an invalid pure field value.',
						);
						pure[index] = entry.value;
						cumulative[index] =
							pureOrders.length === 0 ? pure[index] : Math.fround(cumulative[index] + pure[index]);
						minimum = Math.min(minimum, pure[index]);
						maximum = Math.max(maximum, pure[index]);
					}
					fieldChecks.push({
						fieldId,
						count: pure.length,
						minimum,
						maximum,
						pureSha256: await digest(new Uint8Array(pure.buffer)),
						cumulativeSha256: await digest(new Uint8Array(cumulative.buffer)),
					});
					pureOrders.push(pure);
					if (fieldId === 'J4') {
						const before = performance.now();
						evaluation = evaluationCapability
							? await evaluationCapability.evaluate(control.buildRequest, plan, channel, pureOrders)
							: evaluateOrders(control.buildRequest, plan, channel, pureOrders);
						evaluationMilliseconds = performance.now() - before;
					}
				},
			});
			requireCondition(
				evaluation !== null && pureOrders.length === 4 && transportCallbacks === 3,
				'Compiler did not finish all four sparse orders and three transport callbacks.',
			);
			requireCondition(
				compilerReport.wavelength.index === channel &&
					compilerReport.finalLiveFieldBytes === 0 &&
					compilerReport.compiledCaches.length === 0,
				'Compiler report failed channel/resource/cache checks.',
			);
			requireCondition(
				compilerReport.fieldLayout.widthJ === widthJ &&
					compilerReport.fieldLayout.widthL === widthL &&
					compilerReport.fieldLayout.height === height &&
					compilerReport.fieldLayout.scalarBytes === 4,
				'Compiler field layout disagrees with preflight.',
			);
			requireCondition(
				!gl.isContextLost() && gl.getError() === gl.NO_ERROR,
				'WebGL failed after sparse evaluation.',
			);
			peakLiveFieldBytes = Math.max(peakLiveFieldBytes, compilerReport.peakLiveFieldBytes);
			if (evaluation.diagnostics !== undefined) {
				requireCondition(
					control.continuation !== undefined,
					'GPU continuation diagnostics require an explicit capture recipe.',
				);
			}
			/** @type {SkyGpuChannelHeader} */
			const header = {
				channel,
				shape: evaluation.shape,
				fieldChecks,
				compilerReport,
				evaluationMilliseconds,
				...(evaluation.diagnostics === undefined
					? {}
					: {diagnostics: validateChannelDiagnostics(evaluation.diagnostics)}),
			};
			const upload = await fetch(`${apiUrl}/channel/${channel}`, {
				method: 'POST',
				headers: {'content-type': 'application/octet-stream'},
				body: channelBytes(header, evaluation.values),
			});
			requireCondition(upload.ok, 'Owning run rejected channel spectra.');
			pureOrders.length = 0;
			evaluation = null;
			await progress(`Channel ${channel} spectra retained.`, ordinal + 1);
		}
	} finally {
		const lose = gl.getExtension('WEBGL_lose_context');
		if (lose) {
			lose.loseContext();
			contextLossRequested = true;
		}
		canvas.remove();
	}
	return {
		schemaId: 'sky-gpu-browser-result-v1',
		channels: [...control.channels],
		renderer,
		plan: {
			coordinateCount: plan.coordinates.length,
			coordinateSha256,
			rayCount: plan.rayCount,
			viewCount: plan.views.length,
		},
		peakLiveFieldBytes,
		elapsedMilliseconds: performance.now() - started,
		contextLossRequested,
	};
}
