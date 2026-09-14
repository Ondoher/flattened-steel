import {
	directBaseFragment,
	j1Fragment,
	l1Fragment,
	bindFramebuffer,
	requireCondition,
	requireNoGlError,
} from '../../orders/kernels.js';
import {densityScatterFragment, densityTransportFragment, requireDensityMode} from './kernels.js';
import {densityStages, verifyDensityLifetimes} from './plan.js';

const VERTEX_SOURCE = `#version 300 es
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: gl_VertexID == 1 ? vec2(3.0, -1.0)
		: vec2(-1.0, 3.0);
	gl_Position = vec4(position, 0.0, 1.0);
}`;

/** Stream split-species N4 without changing analytic L1 or raw cached J1.
 * Scalar lifetimes are checked before allocation and at each pass. Every owned
 * GPU object is registered immediately and disposed even when callbacks reject.
 * @param {SkyDensityCompileRequest} request - Explicit contained compiler inputs.
 * @returns {Promise<SkyGpuCompilerReport>} Dependency, lifetime and timing evidence.
 */
export async function compileDensityOrders({
	gl,
	buildRequest,
	wavelengthIndex,
	reportProgress,
	fieldProbeCoordinates,
	onFieldProbes,
	commonModule,
	compileSceneCaches,
	densityMode,
}) {
	requireDensityMode(densityMode);
	requireCondition(compileSceneCaches === false, 'Density interventions cannot allocate scene packages.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'Float32 render targets are required.');
	const spec = /** @type {SkySixBuildRequest} */ (buildRequest).transportSpec;
	const domains = spec.domains;
	const channel = domains.spectrum.channels[wavelengthIndex];
	requireCondition(Number.isInteger(wavelengthIndex) && channel, 'Selected wavelength index is outside Direct40.');
	requireCondition(spec.numerical.maximumScatteringOrder === 4, 'Density recurrence is fixed to N4.');
	const coordinateContract = spec.shaderProfile?.coordinateContract ?? 'scene-cache-receiver-local-v1';
	requireCondition(
		coordinateContract === 'scene-cache-receiver-local-v1',
		'Only the receiver-local density recurrence is admitted.',
	);
	const ozone = spec.atmosphere.ozone;
	const coordinate =
		(channel.centerNanometers - ozone.crossSectionTable.minimumNanometers) /
		ozone.crossSectionTable.spacingNanometers;
	const lower = Math.floor(coordinate),
		upper = Math.min(ozone.crossSectionTable.values.length - 1, lower + 1),
		fraction = coordinate - lower;
	const ozoneCrossSection =
		ozone.crossSectionTable.values[lower] * (1 - fraction) + ozone.crossSectionTable.values[upper] * fraction;
	const common = commonModule.createDistantSunSceneCacheCommonShaderSource({
		wavelengthNanometers: channel.centerNanometers,
		sourceIrradiance: channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
		ozoneCrossSection,
		ozoneMaximumDensity: ozone.maximumDensityPerCubicMeter ?? 5.374e18,
		rayleighScattering: channel.rayleighScatteringPerMeter ?? null,
		mieExtinction: channel.mieExtinctionPerMeter ?? null,
		groundAlbedo: channel.groundAlbedo ?? 0,
		bottomRadiusMeters: spec.planet.bottomRadiusMeters,
		topRadiusMeters: spec.planet.topRadiusMeters,
		rayleighScaleHeightMeters: spec.atmosphere.rayleighScaleHeightMeters,
		mieScaleHeightMeters: spec.atmosphere.mieScaleHeightMeters,
		rayleighCoefficientScalePerMeter: spec.atmosphere.rayleighCoefficientScalePerMeter,
		mieAngstromAlpha: spec.atmosphere.mieAngstromAlpha,
		mieAngstromBeta: spec.atmosphere.mieAngstromBeta,
		mieSingleScatteringAlbedo: spec.atmosphere.mieSingleScatteringAlbedo,
		miePhaseFunctionG: spec.atmosphere.miePhaseFunctionG,
		sourcePathTransmittanceIntervalCount: spec.numerical.sourcePathTransmittanceIntervalCount,
		incomingDirectionCount: domains.incoming.directionCount,
		transportIntervalCount: spec.numerical.transportIntervalCount,
		outgoingFaceWidth: domains.outgoing.faceWidth,
		positionAltitudesMeters: domains.position.nodes.map((node) => node.altitudeMeters),
		solarZenithDegrees: domains.solarZenith.nodes.map((node) => node.solarZenithDegrees),
		coordinateContract,
		sourceDirection: spec.source.directionToLight,
		numericalPolicy: spec.numerical.geometryPolicy,
	});
	const widthJ = domains.outgoing.directionCount,
		widthL = domains.incoming.directionCount,
		height = domains.position.count * domains.solarZenith.count;
	const lifetime = verifyDensityLifetimes(widthJ, widthL, height);
	const maximumTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE));
	const maximumViewport = Array.from(/** @type {Int32Array} */ (gl.getParameter(gl.MAX_VIEWPORT_DIMS)));
	for (const width of [widthJ, widthL])
		requireCondition(
			width <= maximumTextureSize &&
				width <= maximumViewport[0] &&
				height <= maximumTextureSize &&
				height <= maximumViewport[1],
			'Density fields exceed GPU dimensions.',
		);
	/** @type {Map<string,SkySixField>} */ const resources = new Map();
	/** @type {Set<WebGLTexture>} */ const textures = new Set();
	/** @type {Set<WebGLShader>} */ const shaders = new Set();
	/** @type {Map<SkyDensityStage['program'],WebGLProgram>} */ const programs = new Map();
	/** @type {Set<WebGLProgram>} */ const ownedPrograms = new Set();
	/** @type {SkyDensityLedgerEntry[]} */ const ledger = [];
	/** @type {SkyDensityTiming[]} */ const timings = [];
	/** @type {WebGLFramebuffer | null} */ let framebuffer = null;
	/** @type {WebGLVertexArrayObject | null} */ let vertexArray = null;
	let liveBytes = 0,
		peakLiveBytes = 0;

	/** Allocate and immediately own a texture, including failed initialization.
	 * @param {SkySixTextureOptions} options - Exact storage description.
	 * @returns {WebGLTexture} Initialized owned texture.
	 */
	const texture = ({width, height: rows, internalFormat = gl.R32F, format = gl.RED, data = null}) => {
		const value = gl.createTexture();
		requireCondition(value, 'Cannot allocate density texture.');
		textures.add(value);
		gl.bindTexture(gl.TEXTURE_2D, value);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, rows, 0, format, gl.FLOAT, data);
		requireNoGlError(gl, 'Density texture initialization');
		return value;
	};
	/** Preserve exact Float32 direction/weight packing.
	 * @param {readonly SkyVector3[]} vectors - Physical rule vectors.
	 * @param {readonly number[] | null} weights - Positive solid-angle weights or null.
	 * @returns {WebGLTexture} Owned RGBA32F direction texture.
	 */
	const directions = (vectors, weights) => {
		const data = new Float32Array(4 * vectors.length);
		for (const [index, vector] of vectors.entries()) {
			data.set(vector, 4 * index);
			data[4 * index + 3] = weights?.[index] ?? 0;
		}
		return texture({width: vectors.length, height: 1, internalFormat: gl.RGBA32F, format: gl.RGBA, data});
	};
	/** Compile/link while retaining failure-path ownership of every object.
	 * @param {SkyDensityStage['program']} id - Exact planned program key.
	 * @param {string} fragment - Generated fragment body.
	 * @returns {void} Inserts one owned linked program.
	 */
	const program = (id, fragment) => {
		const value = gl.createProgram();
		requireCondition(value, 'Cannot allocate density program.');
		ownedPrograms.add(value);
		/** @type {WebGLShader[]} */ const attached = [];
		for (const [kind, source] of /** @type {readonly (readonly [number,string])[]} */ ([
			[gl.VERTEX_SHADER, VERTEX_SOURCE],
			[gl.FRAGMENT_SHADER, fragment],
		])) {
			const shader = gl.createShader(kind);
			requireCondition(shader, 'Cannot allocate density shader.');
			shaders.add(shader);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
				throw new Error(`${id} compilation failed: ${gl.getShaderInfoLog(shader)}`);
			gl.attachShader(value, shader);
			attached.push(shader);
		}
		gl.linkProgram(value);
		if (!gl.getProgramParameter(value, gl.LINK_STATUS))
			throw new Error(`${id} link failed: ${gl.getProgramInfoLog(value)}`);
		for (const shader of attached) {
			gl.detachShader(value, shader);
			gl.deleteShader(shader);
			shaders.delete(shader);
		}
		programs.set(id, value);
	};
	/** Allocate one validated live scalar stage.
	 * @param {SkyDensityStage} stage - Actual pass plan.
	 * @returns {SkySixField} Owned output field.
	 */
	const allocate = (stage) => {
		requireCondition(!resources.has(stage.id), 'Duplicate live density stage.');
		const width = stage.layout === 'J' ? widthJ : stage.layout === 'L' ? widthL : 1;
		const components = stage.layout === 'base' ? 2 : 1;
		const bytes = 4 * width * height * components;
		requireCondition(liveBytes + bytes <= lifetime.peakBytes, 'Actual density lifetime exceeded its preflight.');
		const field = {
			id: stage.id,
			width,
			height,
			bytes,
			texture: texture({
				width,
				height,
				internalFormat: components === 2 ? gl.RG32F : gl.R32F,
				format: components === 2 ? gl.RG : gl.RED,
			}),
		};
		resources.set(stage.id, field);
		liveBytes += bytes;
		peakLiveBytes = Math.max(peakLiveBytes, liveBytes);
		ledger.push({operation: 'allocate', id: stage.id, bytes, liveBytes});
		return field;
	};
	/** Dispose exactly one consumed scalar field.
	 * @param {string} id - Planned live field identity.
	 * @returns {void} Removes the field and records deletion.
	 */
	const release = (id) => {
		const field = resources.get(id);
		requireCondition(field, 'Cannot release absent density field.');
		gl.deleteTexture(field.texture);
		textures.delete(field.texture);
		resources.delete(id);
		liveBytes -= field.bytes;
		const isTextureAfterDelete = gl.isTexture(field.texture);
		ledger.push({operation: 'release', id, bytes: field.bytes, liveBytes, isTextureAfterDelete});
		requireCondition(!isTextureAfterDelete, 'Density texture remained live after release.');
	};
	/** Capture only declared row spans and preserve caller coordinate order.
	 * @param {SkySixField} field - Current outgoing density or incoming radiance.
	 * @returns {Promise<void>} Awaited callback before any source field is disposed.
	 */
	const capture = async (field) => {
		const fallback = field.id.replace(/-(rayleigh|mie)$/, '');
		const coordinates = fieldProbeCoordinates[field.id] ?? fieldProbeCoordinates[fallback] ?? [];
		/** @type {Map<number,SkyDensityReadbackSpan>} */ const rows = new Map();
		for (const coordinate of coordinates) {
			requireCondition(
				Number.isInteger(coordinate.x) &&
					coordinate.x >= 0 &&
					coordinate.x < field.width &&
					Number.isInteger(coordinate.y) &&
					coordinate.y >= 0 &&
					coordinate.y < height,
				'Density sparse coordinate escaped field.',
			);
			const span = rows.get(coordinate.y) ?? {first: coordinate.x, last: coordinate.x};
			span.first = Math.min(span.first, coordinate.x);
			span.last = Math.max(span.last, coordinate.x);
			rows.set(coordinate.y, span);
		}
		bindFramebuffer(gl, framebuffer, field.texture);
		for (const [row, span] of rows) {
			span.values = new Float32Array(span.last - span.first + 1);
			gl.readPixels(span.first, row, span.values.length, 1, gl.RED, gl.FLOAT, span.values);
			requireNoGlError(gl, `${field.id} sparse readback`);
		}
		const values = coordinates.map((coordinate) => {
			const span = rows.get(coordinate.y),
				value = span.values[coordinate.x - span.first];
			requireCondition(Number.isFinite(value) && value >= 0, 'Invalid density sparse scalar.');
			return {...coordinate, value};
		});
		await onFieldProbes({fieldId: field.id, wavelengthIndex, values});
	};
	try {
		framebuffer = gl.createFramebuffer();
		vertexArray = gl.createVertexArray();
		requireCondition(framebuffer && vertexArray, 'Cannot allocate density draw state.');
		gl.disable(gl.BLEND);
		const incoming = directions(domains.incoming.unitVectors, domains.incoming.integrationWeightsSteradians);
		const outgoing = directions(domains.outgoing.unitVectors, null);
		program('direct', directBaseFragment(common));
		program('first', j1Fragment(common));
		program('analytic-l1', l1Fragment(common, false));
		for (const species of /** @type {readonly SkyDensitySpecies[]} */ (['rayleigh', 'mie'])) {
			program(
				species === 'rayleigh' ? 'scatter-rayleigh' : 'scatter-mie',
				densityScatterFragment(common, species, densityMode),
			);
			program(
				species === 'rayleigh' ? 'transport-rayleigh' : 'transport-mie',
				densityTransportFragment(common, species, densityMode),
			);
		}
		await reportProgress('density-programs-compiled');
		for (const stage of densityStages()) {
			for (const id of stage.inputs) requireCondition(resources.has(id), 'Density pass input is not live.');
			const output = allocate(stage),
				selected = programs.get(stage.program);
			/** @type {SkySixBinding[]} */ const bindings = [];
			if (stage.program === 'first')
				bindings.push(
					[0, resources.get('direct-base').texture, 'uDirectBase', 'direct-base'],
					[1, outgoing, 'uOutgoingDirections', 'outgoing-directions'],
				);
			if (stage.program === 'analytic-l1') bindings.push([0, incoming, 'uF68Directions', 'incoming-directions']);
			if (stage.program.startsWith('scatter-'))
				bindings.push(
					[0, resources.get(stage.inputs[0]).texture, 'uPreviousL', stage.inputs[0]],
					[1, incoming, 'uF68Directions', 'incoming-directions'],
					[2, outgoing, 'uOutgoingDirections', 'outgoing-directions'],
				);
			if (stage.program.startsWith('transport-')) {
				bindings.push(
					[0, resources.get(stage.inputs[0]).texture, 'uPreviousJ', stage.inputs[0]],
					[1, incoming, 'uF68Directions', 'incoming-directions'],
					[2, resources.get(stage.inputs[1]).texture, 'uPreviousL', stage.inputs[1]],
				);
				if (stage.program === 'transport-mie')
					bindings.push([3, resources.get(stage.inputs[2]).texture, 'uRayleighL', stage.inputs[2]]);
			}
			if (bindings.some((binding) => binding[1] === output.texture))
				throw new Error('Density pass would sample its own output.');
			const started = performance.now();
			bindFramebuffer(gl, framebuffer, output.texture);
			gl.useProgram(selected);
			gl.bindVertexArray(vertexArray);
			for (const [unit, input, name] of bindings) {
				gl.activeTexture(gl.TEXTURE0 + unit);
				gl.bindTexture(gl.TEXTURE_2D, input);
				gl.uniform1i(gl.getUniformLocation(selected, name), unit);
			}
			for (let zenith = 0; zenith < domains.solarZenith.count; zenith++) {
				gl.viewport(0, zenith * domains.position.count, output.width, domains.position.count);
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				gl.finish();
				requireNoGlError(gl, `${stage.id} solar row ${zenith}`);
				if (zenith % 10 === 9 || zenith === domains.solarZenith.count - 1)
					await reportProgress(`${stage.id}:${zenith + 1}/${domains.solarZenith.count}`);
			}
			const inputFields = bindings.map((binding) => binding[3]);
			timings.push({id: stage.id, milliseconds: performance.now() - started, outputField: stage.id, inputFields});
			ledger.push({operation: 'pass', id: stage.id, outputField: stage.id, inputFields});
			if (stage.capture) await capture(output);
			for (const id of stage.release) release(id);
		}
		requireCondition(
			liveBytes === 0 && resources.size === 0 && peakLiveBytes === lifetime.peakBytes,
			'Density allocation ledger did not close exactly.',
		);
		requireNoGlError(gl, 'Density recurrence completion');
		return {
			schemaId: 'sky-density-wavelength-result-v1',
			wavelength: {index: wavelengthIndex, centerNanometers: channel.centerNanometers},
			fieldLayout: {widthJ, widthL, height, scalarBytes: 4},
			capabilities: {maximumTextureSize, maximumViewport},
			compiledCaches: [],
			ledger,
			timings,
			peakLiveFieldBytes: peakLiveBytes,
			finalLiveFieldBytes: liveBytes,
			actualOrders: [1, 2, 3, 4],
			coordinateContract,
			densityMode,
			passCount: lifetime.passCount,
			groundRecurrence:
				'Analytic L1 unchanged; each higher Ln adds Rayleigh transport, Mie transport and one reflection of L(n-1).',
			glErrors: 0,
		};
	} finally {
		for (const value of textures) gl.deleteTexture(value);
		for (const value of ownedPrograms) gl.deleteProgram(value);
		for (const value of shaders) gl.deleteShader(value);
		resources.clear();
		textures.clear();
		ownedPrograms.clear();
		shaders.clear();
		programs.clear();
		if (vertexArray) gl.deleteVertexArray(vertexArray);
		if (framebuffer) gl.deleteFramebuffer(framebuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindVertexArray(null);
	}
}
