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
} from '../../orders/kernels.js';
import {groundBoundaryScatterFragment} from './kernels.js';

/** SHA-256 exact bytes through the browser-compatible Web Crypto interface.
 * @param {Uint8Array} bytes - Owned transient bytes.
 * @returns {Promise<string>} Lowercase SHA-256.
 */
export async function groundBoundaryDigest(bytes) {
	const copied = new Uint8Array(bytes.byteLength);
	copied.set(bytes);
	const digest = await crypto.subtle.digest('SHA-256', copied.buffer);
	return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

/** Hash every non-ground Float32 row using bounded solar-block readback.
 * A manifest digest hashes the ordered chunk descriptors, not the concatenated
 * field bytes. Every selected byte participates and the ground rows alone are omitted.
 * @param {number} width - Outgoing scalar columns.
 * @param {number} altitudeCount - Complete receiver heights per solar block.
 * @param {number} solarCount - Complete original solar count.
 * @param {SkyGroundBoundaryRowReader} readRows - Fill the reused buffer from contiguous rows.
 * @param {SkyGroundBoundaryProgress} progress - Awaited progress/guard callback.
 * @returns {Promise<SkyGroundBoundaryFieldHash>} Exact complete non-ground manifest.
 */
export async function hashGroundBoundaryRows(width, altitudeCount, solarCount, readRows, progress) {
	requireCondition(
		[width, altitudeCount, solarCount].every(Number.isSafeInteger) &&
			width > 0 &&
			altitudeCount > 1 &&
			solarCount > 0,
		'Invalid ground-boundary hash dimensions.',
	);
	requireCondition(new Uint8Array(Uint32Array.of(1).buffer)[0] === 1, 'Little-endian Float32 readback is required.');
	const rowsPerChunk = altitudeCount - 1;
	requireCondition(width * rowsPerChunk * 4 <= 8 * 1024 ** 2, 'Ground-boundary readback chunk exceeds its cap.');
	const values = new Float32Array(width * rowsPerChunk);
	/** @type {SkyGroundBoundaryHashChunk[]} */ const chunks = [];
	for (let solar = 0; solar < solarCount; solar++) {
		const firstRow = solar * altitudeCount + 1;
		readRows(firstRow, rowsPerChunk, values);
		requireCondition(
			values.every((value) => Number.isFinite(value) && value >= 0),
			'Invalid non-ground J2 field value.',
		);
		chunks.push({
			firstRow,
			rowCount: rowsPerChunk,
			byteLength: values.byteLength,
			sha256: await groundBoundaryDigest(new Uint8Array(values.buffer)),
		});
		if (solar % 10 === 9 || solar === solarCount - 1) await progress('hash:' + (solar + 1) + '/' + solarCount);
	}
	const manifest = {
		schemaId: 'sky-ground-boundary-field-hash-v1',
		width,
		altitudeCount,
		solarCount,
		selection: 'all-non-ground-rows',
		encoding: 'float32-little-endian',
		chunks,
	};
	return {
		...manifest,
		scalarCount: width * rowsPerChunk * solarCount,
		maximumReadbackBytes: values.byteLength,
		manifestSha256: await groundBoundaryDigest(new TextEncoder().encode(JSON.stringify(manifest))),
	};
}

/** Freeze the sequential shadow lifecycle's actual scalar recurrence bound.
 * @param {number} widthJ - Raw outgoing field columns.
 * @param {number} widthL - Incoming field columns.
 * @param {number} height - Altitude times solar rows.
 * @returns {SkyGroundBoundaryMemory} Byte-exact logical storage, excluding host/GPU overhead.
 */
export function groundBoundaryMemory(widthJ, widthL, height) {
	requireCondition(
		[widthJ, widthL, height].every((value) => Number.isSafeInteger(value) && value > 0),
		'Invalid ground-boundary field dimensions.',
	);
	const jBytes = widthJ * height * 4,
		lBytes = widthL * height * 4;
	const peakScalarBytes = Math.max(jBytes + 2 * lBytes, jBytes + height * 8);
	requireCondition(peakScalarBytes <= 1024 ** 3, 'Ground-boundary scalar recurrence exceeds the original 1 GiB cap.');
	return {
		jBytes,
		lBytes,
		peakScalarBytes,
		simultaneousShadowBytes: 2 * jBytes + lBytes,
		maximumScalarBytes: 1024 ** 3,
		shadowReleasedBeforeCorrected: true,
	};
}

/** Execute N1-N4 with one unmodified J2 shadow and one J2-only boundary intervention.
 * Stored L1, later scattering and all reflected-ground transport remain unchanged.
 * The parent runner authenticates historical sparse hashes and assesses ground/view predictions.
 * @param {SkyGroundBoundaryCompileRequest} request - Frozen controls, sparse union and ground proof taps.
 * @returns {Promise<SkyGroundBoundaryCompilerReport>} Actual GPU work and exactness evidence; numerical gates remain separate.
 */
export async function compileGroundBoundary({
	gl,
	buildRequest,
	wavelengthIndex,
	reportProgress,
	fieldProbeCoordinates,
	onFieldProbes,
	commonModule,
	compileSceneCaches,
	groundProbeCoordinates,
}) {
	requireCondition(compileSceneCaches === false, 'Ground-boundary diagnostics cannot allocate scene packages.');
	requireCondition(gl.getExtension('EXT_color_buffer_float'), 'Float32 render targets are required.');
	const spec = /** @type {SkySixBuildRequest} */ (buildRequest).transportSpec;
	const domains = spec.domains;
	requireCondition(
		[0, 8].includes(wavelengthIndex) &&
			[48, 55].includes(domains.position.count) &&
			domains.incoming.directionCount === 512 &&
			domains.outgoing.faceWidth === 27 &&
			domains.solarZenith.count === 180 &&
			spec.numerical.sourcePathTransmittanceIntervalCount === 80 &&
			spec.numerical.transportIntervalCount === 160,
		'Only the registered H/P55 partial spectral controls are admitted.',
	);
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
	/** @type {SkySixCommonParameters} */
	const commonParameters = {
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
	};
	const common = commonModule.createDistantSunSceneCacheCommonShaderSource(commonParameters);

	const widthJ = domains.outgoing.directionCount,
		widthL = domains.incoming.directionCount,
		height = domains.position.count * domains.solarZenith.count;
	const memory = groundBoundaryMemory(widthJ, widthL, height);
	requireCondition(
		Array.isArray(groundProbeCoordinates) &&
			groundProbeCoordinates.length > 0 &&
			groundProbeCoordinates.length <= 128,
		'Require one through 128 declared ground verification taps.',
	);
	const groundKeys = new Set();
	for (const point of groundProbeCoordinates) {
		requireCondition(
			Number.isInteger(point.x) &&
				Number.isInteger(point.y) &&
				point.x >= 0 &&
				point.x < widthJ &&
				point.y >= 0 &&
				point.y < height &&
				point.y % domains.position.count === 0,
			'Invalid exact-ground proof tap.',
		);
		const key = point.x + ':' + point.y;
		requireCondition(!groundKeys.has(key), 'Duplicate ground proof tap.');
		groundKeys.add(key);
	}
	const originalUnion = JSON.stringify(fieldProbeCoordinates.J1);
	requireCondition(
		Array.isArray(fieldProbeCoordinates.J1) &&
			fieldProbeCoordinates.J1.length > 0 &&
			['J2-shadow', 'J2', 'J3', 'J4'].every((id) => JSON.stringify(fieldProbeCoordinates[id]) === originalUnion),
		'Original sparse union and ordering must match for J1, shadow J2 and corrected J2-J4.',
	);
	requireCondition(
		['L1', 'L2', 'L3'].every((id) => !fieldProbeCoordinates[id]?.length),
		'Transport fields use structural preservation, not sparse evidence callbacks.',
	);
	const maximumTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
		maximumViewport = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
	for (const width of [widthJ, widthL])
		requireCondition(
			width <= maximumTextureSize &&
				width <= maximumViewport[0] &&
				height <= maximumTextureSize &&
				height <= maximumViewport[1],
			'Ground-boundary field exceeds hardware dimensions.',
		);
	const framebuffer = gl.createFramebuffer(),
		vertexArray = gl.createVertexArray();
	requireCondition(framebuffer && vertexArray, 'Cannot allocate ground-boundary framebuffer state.');
	/** @type {Map<string,SkySixField>} */ const resources = new Map();
	/** @type {WebGLTexture[]} */ const directionTextures = [];
	/** @type {WebGLProgram[]} */ const programs = [];
	const ledger = [],
		timings = [];
	let liveBytes = 0,
		peakLiveBytes = 0;
	/** @type {SkyGroundBoundaryParity|null} */ let boundaryParity = null;
	/** @type {SkyGroundBoundaryGroundSample[]} */ let groundSamples = [];
	/** @type {SkyGroundBoundaryL1Preservation|null} */ let l1Preservation = null;
	/** Allocate one retained stage. @param {string} id @param {number} width @param {number} [internalFormat] @param {number} [format] @param {number} [components] @returns {SkySixField} */
	const allocate = (id, width, internalFormat = Number(gl.R32F), format = Number(gl.RED), components = 1) => {
		requireCondition(!resources.has(id), 'Duplicate live recurrence stage.');
		const bytes = width * height * components * 4;
		requireCondition(
			liveBytes + bytes <= memory.peakScalarBytes,
			'Ground-boundary lifecycle exceeds its frozen sequential peak.',
		);
		const texture = createTexture(gl, {width, height, internalFormat, format});
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
		requireCondition(
			resources.get(output.id) === output && inputs.every((input) => input[1] !== output.texture),
			'Ground-boundary draw cannot alias any input texture.',
		);
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
	/** Read only selected row spans in caller order.
	 * @param {SkySixField} field - Live output texture.
	 * @param {readonly SkyGroundBoundaryCoordinate[]} coordinates - Validated ordinary or ground support.
	 * @returns {SkyGpuFieldProbe[]} Exact Float32 values in original order.
	 */
	const readSelected = (field, coordinates) => {
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
		return values;
	};
	/** Report one original sparse union, with an explicit additional shadow identity.
	 * @param {SkySixField} field - Original or corrected live output.
	 * @returns {Promise<void>} Awaited caller-owned hash/capture handling.
	 */
	const capture = async (field) => {
		const values = readSelected(field, fieldProbeCoordinates[field.id] ?? []);
		await onFieldProbes({fieldId: field.id, wavelengthIndex, values});
	};
	/** Read complete non-ground field evidence through one bounded reusable buffer.
	 * @param {SkySixField} field - Live shadow or corrected J2.
	 * @returns {Promise<SkyGroundBoundaryFieldHash>} Ordered complete manifest.
	 */
	const hashNonGround = async (field) => {
		const started = performance.now();
		bindFramebuffer(gl, framebuffer, field.texture);
		const result = await hashGroundBoundaryRows(
			widthJ,
			domains.position.count,
			domains.solarZenith.count,
			(firstRow, rowCount, values) => {
				gl.readPixels(0, firstRow, widthJ, rowCount, gl.RED, gl.FLOAT, values);
				requireNoGlError(gl, field.id + ' full non-ground readback');
			},
			(stage) => reportProgress(field.id + ':' + stage),
		);
		timings.push({
			id: field.id + ':non-ground-hash',
			milliseconds: performance.now() - started,
			outputField: null,
			inputFields: [field.id],
		});
		ledger.push({
			operation: 'readback-hash',
			id: field.id,
			scalarCount: result.scalarCount,
			maximumReadbackBytes: result.maximumReadbackBytes,
			manifestSha256: result.manifestSha256,
		});
		return result;
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
			groundBoundaryScatterFragment(common),
		];
		for (const [index, fragment] of fragments.entries())
			programs.push(createProgram(gl, fragment, `Ground-boundary program ${index}`));
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
		for (let order = 2; order <= 4; order++) {
			/** @type {SkyGroundBoundaryFieldHash|null} */ let shadowHash = null;
			/** @type {SkyGpuFieldProbe[]} */ let shadowGround = [];
			const preservedL1 = order === 2 ? previous : null;
			if (order === 2) {
				requireCondition(
					previous.id === 'L1' && gl.isTexture(previous.texture),
					'J2 shadow must borrow original L1.',
				);
				const shadow = allocate('J2-shadow', widthJ);
				await draw(shadow, programs[3], [
					[0, previous.texture, 'uPreviousL', previous.id],
					[1, incoming, 'uF68Directions', 'F68-directions'],
					[2, outgoing, 'uOutgoingDirections', 'outgoing-directions'],
				]);
				await capture(shadow);
				shadowGround = readSelected(shadow, groundProbeCoordinates);
				shadowHash = await hashNonGround(shadow);
				release(shadow);
				requireCondition(
					!resources.has('J2-shadow') && resources.get('L1') === preservedL1,
					'Shadow must be released while original L1 remains live.',
				);
			}
			const density = allocate(`J${order}`, widthJ);
			await draw(density, programs[order === 2 ? 5 : 3], [
				[0, previous.texture, 'uPreviousL', previous.id],
				[1, incoming, 'uF68Directions', 'F68-directions'],
				[2, outgoing, 'uOutgoingDirections', 'outgoing-directions'],
			]);
			await capture(density);
			if (order === 2) {
				const correctedHash = await hashNonGround(density);
				requireCondition(
					shadowHash && shadowHash.manifestSha256 === correctedHash.manifestSha256,
					'Ground-boundary intervention changed a non-ground J2 byte.',
				);
				boundaryParity = {shadow: shadowHash, corrected: correctedHash, equal: true};
				const correctedGround = readSelected(density, groundProbeCoordinates);
				groundSamples = correctedGround.map((point, index) => ({
					x: point.x,
					y: point.y,
					solarZenithIndex: point.y / domains.position.count,
					outgoingDirectionFloat32: /** @type {SkyVector3} */ ([
						Math.fround(domains.outgoing.unitVectors[point.x][0]),
						Math.fround(domains.outgoing.unitVectors[point.x][1]),
						Math.fround(domains.outgoing.unitVectors[point.x][2]),
					]),
					shadowValue: shadowGround[index].value,
					correctedValue: point.value,
					difference: point.value - shadowGround[index].value,
				}));
				requireCondition(
					preservedL1 === previous &&
						resources.get('L1') === preservedL1 &&
						gl.isTexture(previous.texture) &&
						density.texture !== previous.texture,
					'Original L1 identity changed.',
				);
				l1Preservation = {
					schemaId: 'sky-ground-boundary-l1-structural-v1',
					fieldId: 'L1',
					createdOnce: true,
					scatterInputFieldIds: ['L1', 'L1'],
					scatterOutputFieldIds: ['J2-shadow', 'J2'],
					sameTextureObject: true,
					outputAliasingRejected: true,
					uploadsAfterCreation: 0,
					drawsTargetingL1AfterCreation: 0,
					shadowReleasedBeforeCorrected: true,
				};
			}
			if (order === 4) {
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
		requireNoGlError(gl, 'Ground-boundary N4 completion');
		requireCondition(
			boundaryParity && l1Preservation && liveBytes === 0 && peakLiveBytes === memory.peakScalarBytes,
			'Ground-boundary execution or streamed lifecycle is incomplete.',
		);
		const incomingPackedFloat32 = Array.from(
			Float32Array.from(
				domains.incoming.unitVectors.flatMap((vector, index) => [
					...vector,
					domains.incoming.integrationWeightsSteradians[index],
				]),
			),
		);
		const shaderDerivation = {
			originalScatterSha256: await groundBoundaryDigest(new TextEncoder().encode(fragments[3])),
			correctedScatterSha256: await groundBoundaryDigest(new TextEncoder().encode(fragments[5])),
			operation: 'Two exact source-anchor replacements; the distinct fragment is selected only for J2.',
		};
		return {
			schemaId: 'sky-ground-boundary-wavelength-result-v1',
			boundary: {
				schemaId: 'sky-ground-boundary-compiler-evidence-v1',
				actualOrders: [1, 2, 3, 4],
				shadowFieldId: 'J2-shadow',
				correctedFieldIds: ['J1', 'J2', 'J3', 'J4'],
				nonGroundParity: boundaryParity,
				l1Preservation,
				groundSamples,
				memory,
				predictionInputs: {
					commonParameters,
					incomingPackedFloat32,
					groundHemisphere: 'incomingRecord.z < 0',
					sourceQuantity: 'sourceIrradianceDensityWattsPerSquareMeterPerNanometer',
					sourceTransmittanceOperation: 'multiply',
				},
				shaderDerivation,
				groundNumericalGate: 'pending-independent-runner-assessment',
				historicalParityScope:
					'Caller compares J1 and J2-shadow only on the authenticated original sparse union.',
			},
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
