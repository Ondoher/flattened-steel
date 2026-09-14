// Contained species-streaming adaptation of gpu/browser.js. The seven actual
// source fields retain separate identities; no four-field surrogate is emitted.
import {compileDensityOrders} from '../density/driver.js';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {prepareMechanismDensityViews, evaluateMechanismDensityViews} from './evaluate.js';

const FIELD_IDS = ['J1', 'J2-rayleigh', 'J2-mie', 'J3-rayleigh', 'J3-mie', 'J4-rayleigh', 'J4-mie'];
const EVENTS = ['J1', 'L1', 'J2-rayleigh', 'J2-mie', 'L2', 'J3-rayleigh', 'J3-mie', 'L3', 'J4-rayleigh', 'J4-mie'];

/** Fail at the first invalid capture invariant. @param {unknown} condition @param {string} message */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Hash exact little-endian field words. @param {Uint8Array} bytes @returns {Promise<string>} */
async function digest(bytes) {
	const owned = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(owned).set(bytes);
	const result = await crypto.subtle.digest('SHA-256', owned);
	return Array.from(new Uint8Array(result), (value) => value.toString(16).padStart(2, '0')).join('');
}

/** Preserve the existing authenticated channel envelope.
 * @param {SkyGpuChannelHeader} header - Exact seven-source/four-order metadata.
 * @param {Float64Array} values - Ordinary grouped spectra.
 * @returns {ArrayBuffer} Length-prefixed JSON plus little-endian binary64 words.
 */
function channelBytes(header, values) {
	const metadata = new TextEncoder().encode(JSON.stringify(header)),
		buffer = new ArrayBuffer(4 + metadata.length + values.length * 8),
		bytes = new Uint8Array(buffer),
		data = new DataView(buffer);
	data.setUint32(0, metadata.length, true);
	bytes.set(metadata, 4);
	for (const [index, value] of values.entries()) data.setFloat64(4 + metadata.length + index * 8, value, true);
	return buffer;
}

/** Stream one registered sequential-species N4 construction through an isolated page.
 * The dynamic production module supplies only its authenticated physical/common
 * shader generator; the contained density driver owns species recurrence staging.
 * @param {string} apiUrl - Run-owned loopback capability.
 * @param {string} compilerUrl - Authenticated production common-shader module.
 * @returns {Promise<SkyGpuBrowserResult>} Bounded capture and context-disposal observations.
 */
export async function runGpuBrowser(apiUrl, compilerUrl) {
	const started = performance.now(),
		response = await fetch(`${apiUrl}/control`);
	requireCondition(response.ok, 'Cannot load the authenticated mechanism control.');
	/** @type {SkyGpuControl} */ const control = await response.json();
	/** @type {SkySixCommonModule} */ const commonModule = await import(compilerUrl);
	requireCondition(
		typeof commonModule.createDistantSunSceneCacheCommonShaderSource === 'function',
		'Production common-shader capability is absent.',
	);
	requireCondition(
		new Uint8Array(Uint32Array.of(1).buffer)[0] === 1,
		'Field hashing requires little-endian typed arrays.',
	);
	const selection = control.continuation;
	requireCondition(
		selection && ['split-raw', 'factored'].includes(selection.higherRepresentation),
		'Species mode is not explicitly registered.',
	);
	/** @type {SkyDensityMode} */ const densityMode =
		selection.higherRepresentation === 'split-raw' ? 'splitraw' : 'factored';
	const prepared = prepareMechanismDensityViews(control),
		plan = prepared.view;
	requireCondition(
		plan.rayCount === control.scenes.length * 81 &&
			plan.views.length === 2 &&
			plan.representations.length === 1 &&
			plan.representations[0] === 'grouped',
		'Species adapter changed the ordinary spectrum shape.',
	);
	const coordinateWords = new Uint32Array(plan.coordinates.length * 2);
	for (const [index, point] of plan.coordinates.entries()) {
		coordinateWords[index * 2] = point.x;
		coordinateWords[index * 2 + 1] = point.y;
	}
	const coordinateSha256 = await digest(new Uint8Array(coordinateWords.buffer));
	const canvas = document.createElement('canvas'),
		gl = canvas.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
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
	const domains = control.buildRequest.transportSpec.domains,
		widthJ = domains.outgoing.directionCount,
		widthL = domains.incoming.directionCount,
		height = domains.position.count * domains.solarZenith.count;
	requireCondition(widthJ === 6 * domains.outgoing.faceWidth ** 2, 'Outgoing shape disagrees with its face width.');
	for (const width of [widthJ, widthL])
		requireCondition(
			width <= renderer.maximumTextureSize && width <= renderer.maximumViewport[0],
			'Mechanism width exceeds actual hardware limits.',
		);
	requireCondition(
		height <= renderer.maximumTextureSize && height <= renderer.maximumViewport[1],
		'Mechanism height exceeds actual hardware limits.',
	);
	requireCondition(
		!/swiftshader|llvmpipe|software rasterizer/iu.test(renderer.renderer),
		'Software recurrence is outside this experiment.',
	);
	for (const point of plan.coordinates)
		requireCondition(
			Number.isInteger(point.x) &&
				point.x >= 0 &&
				point.x < widthJ &&
				Number.isInteger(point.y) &&
				point.y >= 0 &&
				point.y < height,
			'Sparse support escaped the declared texture.',
		);
	let peakLiveFieldBytes = 0,
		contextLossRequested = false;
	/** Await the owning process before continuing expensive GPU work.
	 * @param {string} message - Bounded progress detail.
	 * @param {number} completed - Completed wavelength count.
	 */
	async function progress(message, completed) {
		const accepted = await fetch(`${apiUrl}/progress`, {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({phase: 'gpu', message, completed, total: control.channels.length}),
		});
		requireCondition(accepted.ok, 'Owning mechanism run rejected progress.');
	}
	try {
		await progress(`Renderer ${renderer.renderer}; ${plan.coordinates.length} species support coordinates.`, 0);
		for (const [ordinal, channel] of control.channels.entries()) {
			/** @type {Float32Array[]} */ const captured = [];
			/** @type {SkyGpuFieldCheck[]} */ const fieldChecks = [];
			const rayleighCumulative = new Float32Array(plan.coordinates.length),
				mieCumulative = new Float32Array(plan.coordinates.length);
			let callbackIndex = 0;
			const compilerReport = await compileDensityOrders({
				gl,
				buildRequest: control.buildRequest,
				wavelengthIndex: channel,
				compileSceneCaches: false,
				commonModule,
				densityMode,
				fieldProbeCoordinates: Object.fromEntries(FIELD_IDS.map((field) => [field, plan.coordinates])),
				reportProgress: async (stage) => {
					if (
						stage === 'programs-compiled' ||
						stage.endsWith(`:${domains.solarZenith.count}/${domains.solarZenith.count}`)
					)
						await progress(`Channel ${channel}: ${stage}`, ordinal);
				},
				onFieldProbes: async ({fieldId, wavelengthIndex, values}) => {
					requireCondition(
						wavelengthIndex === channel && fieldId === EVENTS[callbackIndex],
						'Species callback identity/order changed.',
					);
					callbackIndex++;
					if (fieldId.startsWith('L')) {
						requireCondition(values.length === 0, 'Unrequested transport callback retained values.');
						return;
					}
					requireCondition(
						fieldId === FIELD_IDS[captured.length] && values.length === plan.coordinates.length,
						'Species sparse field shape changed.',
					);
					const pure = new Float32Array(values.length);
					const cumulative =
						fieldId === 'J1' ? pure : fieldId.endsWith('rayleigh') ? rayleighCumulative : mieCumulative;
					let minimum = Infinity,
						maximum = -Infinity;
					for (const [index, entry] of values.entries()) {
						const point = plan.coordinates[index];
						requireCondition(
							entry.x === point.x && entry.y === point.y,
							'Compiler changed sparse coordinate ordering.',
						);
						requireCondition(
							Number.isFinite(entry.value) && entry.value >= 0,
							'Species source value is invalid.',
						);
						pure[index] = entry.value;
						if (fieldId !== 'J1') cumulative[index] = cumulative[index] + pure[index];
						requireCondition(
							Number.isFinite(cumulative[index]),
							'Species Float32 accumulation overflowed.',
						);
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
					captured.push(pure);
				},
			});
			requireCondition(
				callbackIndex === EVENTS.length && captured.length === 7,
				'The complete seven-source/three-transport sequence did not finish.',
			);
			requireCondition(
				compilerReport.schemaId === 'sky-density-wavelength-result-v1' &&
					compilerReport.wavelength.index === channel &&
					compilerReport.finalLiveFieldBytes === 0 &&
					compilerReport.compiledCaches.length === 0,
				'Species compiler completion/resource contract failed.',
			);
			requireCondition(
				compilerReport.fieldLayout.widthJ === widthJ &&
					compilerReport.fieldLayout.widthL === widthL &&
					compilerReport.fieldLayout.height === height &&
					compilerReport.fieldLayout.scalarBytes === 4,
				'Species compiler layout differs from its registered forecast.',
			);
			requireCondition(compilerReport.peakLiveFieldBytes <= 1024 ** 3, 'Species scalar fields exceeded one GiB.');
			const before = performance.now(),
				evaluation = evaluateMechanismDensityViews(control, prepared, channel, captured),
				evaluationMilliseconds = performance.now() - before;
			requireCondition(
				!gl.isContextLost() && gl.getError() === gl.NO_ERROR,
				'WebGL failed during species capture.',
			);
			peakLiveFieldBytes = Math.max(peakLiveFieldBytes, compilerReport.peakLiveFieldBytes);
			/** @type {SkyGpuChannelHeader} */
			const header = {
				channel,
				shape: evaluation.shape,
				fieldChecks,
				compilerReport,
				evaluationMilliseconds,
				...(evaluation.diagnostics ? {diagnostics: validateChannelDiagnostics(evaluation.diagnostics)} : {}),
			};
			const upload = await fetch(`${apiUrl}/channel/${channel}`, {
				method: 'POST',
				headers: {'content-type': 'application/octet-stream'},
				body: channelBytes(header, evaluation.values),
			});
			requireCondition(upload.ok, 'Owning mechanism run rejected species spectra.');
			captured.length = 0;
			await progress(`Channel ${channel} species spectra retained.`, ordinal + 1);
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
