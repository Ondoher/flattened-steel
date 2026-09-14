import {
	bindFramebuffer,
	createDirectionTexture,
	createProgram,
	createTexture,
	directBaseFragment,
	j1Fragment,
	l1Fragment,
	scatterFragment,
	transportFragment,
	requireCondition,
	requireNoGlError,
} from './kernels.js';

/** Execute six real receiver-local pure orders using unchanged production GLSL.
 * First-order incoming transport remains independently integrated, as in production.
 * Higher transport consumes Jn and L(n-1), retaining its reflected-ground contribution.
 * @param {SkySixCompileRequest} request
 * @returns {Promise<SkyGpuCompilerReport>}
 */
export async function compileSixOrders({
	gl,
	buildRequest,
	wavelengthIndex,
	reportProgress,
	fieldProbeCoordinates,
	onFieldProbes,
	commonModule,
	compileSceneCaches,
}) {
	requireCondition(compileSceneCaches === false, 'Six-order diagnostics cannot allocate scene packages.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'Float32 render targets are required.');
	const spec = /** @type {SkySixBuildRequest} */ (buildRequest).transportSpec;
	const domains = spec.domains;
	const channel = domains.spectrum.channels[wavelengthIndex];
	requireCondition(channel, 'Selected wavelength index is outside Native15.');
	const ozone = spec.atmosphere.ozone;
	const coordinate =
		(channel.centerNanometers - ozone.crossSectionTable.minimumNanometers) /
		ozone.crossSectionTable.spacingNanometers;
	const lower = Math.floor(coordinate);
	const upper = Math.min(ozone.crossSectionTable.values.length - 1, lower + 1);
	const fraction = coordinate - lower;
	const ozoneCrossSection =
		ozone.crossSectionTable.values[lower] * (1 - fraction) + ozone.crossSectionTable.values[upper] * fraction;
	const shaderProfile = spec.shaderProfile ?? {};
	const coordinateContract = shaderProfile.coordinateContract ?? 'scene-cache-receiver-local-v1';
	requireCondition(
		coordinateContract === 'scene-cache-receiver-local-v1',
		'Only the authenticated receiver-local recurrence is admitted.',
	);
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
	const maximumTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
		maximumViewport = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
	for (const width of [widthJ, widthL])
		requireCondition(
			width <= maximumTextureSize &&
				width <= maximumViewport[0] &&
				height <= maximumTextureSize &&
				height <= maximumViewport[1],
			'Six-order field exceeds hardware dimensions.',
		);
	const framebuffer = gl.createFramebuffer(),
		vertexArray = gl.createVertexArray();
	requireCondition(framebuffer && vertexArray, 'Cannot allocate six-order framebuffer state.');
	/** @type {Map<string,SkySixField>} */ const resources = new Map();
	/** @type {WebGLTexture[]} */ const directionTextures = [];
	/** @type {WebGLProgram[]} */ const programs = [];
	const ledger = [],
		timings = [];
	let liveBytes = 0,
		peakLiveBytes = 0;
	/** Allocate one retained stage. @param {string} id @param {number} width @param {number} [internalFormat] @param {number} [format] @param {number} [components] @returns {SkySixField} */
	const allocate = (id, width, internalFormat = Number(gl.R32F), format = Number(gl.RED), components = 1) => {
		requireCondition(!resources.has(id), 'Duplicate live recurrence stage.');
		const texture = createTexture(gl, {width, height, internalFormat, format}),
			bytes = width * height * components * 4;
		const field = {id, texture, width, height, bytes};
		resources.set(id, field);
		liveBytes += bytes;
		peakLiveBytes = Math.max(peakLiveBytes, liveBytes);
		ledger.push({operation: 'allocate', id, bytes, liveBytes});
		return field;
	};
	/** Release a consumed stage. @param {SkySixField} field */
	const release = (field) => {
		requireCondition(resources.get(field.id) === field, 'Cannot release a foreign field.');
		gl.deleteTexture(field.texture);
		resources.delete(field.id);
		liveBytes -= field.bytes;
		ledger.push({
			operation: 'release',
			id: field.id,
			bytes: field.bytes,
			liveBytes,
			isTextureAfterDelete: gl.isTexture(field.texture),
		});
	};
	/** Preserve the production solar-row draw partition. @param {SkySixField} output @param {WebGLProgram} program @param {readonly SkySixBinding[]} inputs */
	const draw = async (output, program, inputs) => {
		const started = performance.now();
		bindFramebuffer(gl, framebuffer, output.texture);
		gl.useProgram(program);
		gl.bindVertexArray(vertexArray);
		for (const [unit, texture, name] of inputs) {
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1i(gl.getUniformLocation(program, name), unit);
		}
		for (let zenith = 0; zenith < domains.solarZenith.count; zenith++) {
			gl.viewport(0, zenith * domains.position.count, output.width, domains.position.count);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.finish();
			requireNoGlError(gl, `${output.id} solar-zenith ${zenith}`);
			if (zenith % 10 === 9 || zenith === domains.solarZenith.count - 1)
				await reportProgress(`${output.id}:${zenith + 1}/${domains.solarZenith.count}`);
		}
		timings.push({
			id: output.id,
			milliseconds: performance.now() - started,
			outputField: output.id,
			inputFields: inputs.map((input) => input[3]),
		});
		ledger.push({
			operation: 'pass',
			id: output.id,
			outputField: output.id,
			inputFields: inputs.map((input) => input[3]),
		});
	};
	/** Read only requested row spans in fixed sparse order. @param {SkySixField} field */
	const capture = async (field) => {
		const coordinates = fieldProbeCoordinates[field.id] ?? [];
		/** @type {Map<number,SkySixSpan>} */ const rows = new Map();
		for (const coordinate of coordinates) {
			requireCondition(
				Number.isInteger(coordinate.x) &&
					coordinate.x >= 0 &&
					coordinate.x < field.width &&
					Number.isInteger(coordinate.y) &&
					coordinate.y >= 0 &&
					coordinate.y < height,
				'Sparse coordinate escaped field.',
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
			requireNoGlError(gl, `${field.id} readback row ${row}`);
		}
		const values = coordinates.map((coordinate) => ({
			...coordinate,
			value: rows.get(coordinate.y).values[coordinate.x - rows.get(coordinate.y).first],
		}));
		await onFieldProbes({fieldId: field.id, wavelengthIndex, values});
	};
	try {
		const incoming = createDirectionTexture(
			gl,
			domains.incoming.unitVectors,
			domains.incoming.integrationWeightsSteradians,
		);
		directionTextures.push(incoming);
		const outgoing = createDirectionTexture(gl, domains.outgoing.unitVectors);
		directionTextures.push(outgoing);
		const fragments = [
			directBaseFragment(common),
			j1Fragment(common),
			l1Fragment(common, false),
			scatterFragment(common, false),
			transportFragment(common, false),
		];
		for (const [index, fragment] of fragments.entries())
			programs.push(createProgram(gl, fragment, `Six-order program ${index}`));
		await reportProgress('programs-compiled');
		const direct = allocate('direct-base', 1, gl.RG32F, gl.RG, 2);
		await draw(direct, programs[0], []);
		const first = allocate('J1', widthJ);
		await draw(first, programs[1], [
			[0, direct.texture, 'uDirectBase', 'direct-base'],
			[1, outgoing, 'uOutgoingDirections', 'outgoing-directions'],
		]);
		await capture(first);
		release(first);
		release(direct);
		let previous = allocate('L1', widthL);
		await draw(previous, programs[2], [[0, incoming, 'uF68Directions', 'F68-directions']]);
		await capture(previous);
		for (let order = 2; order <= 6; order++) {
			const density = allocate(`J${order}`, widthJ);
			await draw(density, programs[3], [
				[0, previous.texture, 'uPreviousL', previous.id],
				[1, incoming, 'uF68Directions', 'F68-directions'],
				[2, outgoing, 'uOutgoingDirections', 'outgoing-directions'],
			]);
			await capture(density);
			if (order === 6) {
				release(density);
				release(previous);
				break;
			}
			const next = allocate(`L${order}`, widthL);
			await draw(next, programs[4], [
				[0, density.texture, 'uPreviousJ', density.id],
				[1, incoming, 'uF68Directions', 'F68-directions'],
				[2, previous.texture, 'uPreviousL', previous.id],
			]);
			await capture(next);
			release(density);
			release(previous);
			previous = next;
		}
		requireNoGlError(gl, 'Six-order completion');
		return {
			schemaId: 'sky-order-wavelength-result-v1',
			wavelength: {index: wavelengthIndex, centerNanometers: channel.centerNanometers},
			fieldLayout: {widthJ, widthL, height, scalarBytes: 4},
			capabilities: {maximumTextureSize, maximumViewport},
			compiledCaches: [],
			ledger,
			timings,
			peakLiveFieldBytes: peakLiveBytes,
			finalLiveFieldBytes: liveBytes,
			actualOrders: [1, 2, 3, 4, 5, 6],
			coordinateContract,
			groundRecurrence: 'Ln transports Jn and reflects L(n-1); L1 retains direct ground illumination',
			glErrors: 0,
		};
	} finally {
		for (const field of resources.values()) gl.deleteTexture(field.texture);
		resources.clear();
		for (const program of programs) gl.deleteProgram(program);
		for (const texture of directionTextures) gl.deleteTexture(texture);
		gl.deleteVertexArray(vertexArray);
		gl.deleteFramebuffer(framebuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindVertexArray(null);
	}
}
