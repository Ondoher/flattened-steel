import assert from 'node:assert/strict';
import {identity, readRepository, sha256} from '../../io/files.mjs';
import {evaluateOrders, sampleDensity} from '../../numerics/view.js';
import {medium} from '../../numerics/direct.js';
import {prepareDensityOrderFields, sampleHigherDensityOrder, evaluateDensityOrders} from '../density-view/evaluate.js';
import {densityScatterFragment, densityTransportFragment, requireDensityMode} from './kernels.js';
import {densityStages, verifyDensityLifetimes} from './plan.js';
import {compileDensityOrders} from './driver.js';

/** Minimal tracked WebGL dispatch double: it verifies object ownership and
 * callback-failure cleanup, not shader compilation or shader numerical results.
 * @param {number | null} failCreation - One-based allocation to reject, or null.
 * @returns {SkyDensityGlHarness} Tracked context capability and observations.
 */
function trackedGl(failCreation) {
	/** @type {Set<SkyDensityMockObject>} */ const live = new Set();
	let allocations = 0,
		draws = 0;
	/** Own one fake object. @param {string} kind @returns {SkyDensityMockObject | null} */
	const allocate = (kind) => {
		allocations++;
		if (allocations === failCreation) return null;
		const value = {kind, id: allocations};
		live.add(value);
		return value;
	};
	/** Release one fake object. @param {SkyDensityMockObject} object @returns {void} */
	const release = (object) => {
		assert.ok(live.delete(object), 'GPU object released twice or never owned.');
	};
	/** Discard inert mock arguments. @param {...unknown} _args @returns {void} */
	const noop = (..._args) => {};
	const context = {
		MAX_TEXTURE_SIZE: 1,
		MAX_VIEWPORT_DIMS: 2,
		R32F: 3,
		RED: 4,
		RG32F: 5,
		RG: 6,
		RGBA32F: 7,
		RGBA: 8,
		FLOAT: 9,
		TEXTURE_2D: 10,
		TEXTURE_MIN_FILTER: 11,
		TEXTURE_MAG_FILTER: 12,
		TEXTURE_WRAP_S: 13,
		TEXTURE_WRAP_T: 14,
		NEAREST: 15,
		CLAMP_TO_EDGE: 16,
		VERTEX_SHADER: 17,
		FRAGMENT_SHADER: 18,
		COMPILE_STATUS: 19,
		LINK_STATUS: 20,
		FRAMEBUFFER: 21,
		COLOR_ATTACHMENT0: 22,
		FRAMEBUFFER_COMPLETE: 23,
		TEXTURE0: 24,
		TRIANGLES: 25,
		NO_ERROR: 0,
		BLEND: 26,
		getExtension: () => ({}),
		/** Return explicit hardware dimensions. @param {number} name @returns {number | Int32Array} */
		getParameter: (name) => (name === 1 ? 16384 : new Int32Array([16384, 16384])),
		createTexture: () => allocate('texture'),
		deleteTexture: release,
		isTexture: (/** @type {SkyDensityMockObject} */ value) => live.has(value),
		createProgram: () => allocate('program'),
		deleteProgram: release,
		createShader: () => allocate('shader'),
		deleteShader: release,
		createFramebuffer: () => allocate('framebuffer'),
		deleteFramebuffer: release,
		createVertexArray: () => allocate('vertex-array'),
		deleteVertexArray: release,
		bindTexture: noop,
		texParameteri: noop,
		texImage2D: noop,
		shaderSource: noop,
		compileShader: noop,
		attachShader: noop,
		detachShader: noop,
		linkProgram: noop,
		getShaderParameter: () => true,
		getProgramParameter: () => true,
		getShaderInfoLog: () => '',
		getProgramInfoLog: () => '',
		bindFramebuffer: noop,
		framebufferTexture2D: noop,
		checkFramebufferStatus: () => 23,
		getError: () => 0,
		disable: noop,
		useProgram: noop,
		bindVertexArray: noop,
		activeTexture: noop,
		uniform1i: noop,
		getUniformLocation: () => ({}),
		viewport: noop,
		finish: noop,
		drawArrays: () => {
			draws++;
		},
		readPixels: noop,
	};
	return {
		// The dispatch double intentionally implements only the methods invoked by
		// this driver. No incomplete capability escapes the manufactured proof.
		gl: /** @type {WebGL2RenderingContext} */ (/** @type {unknown} */ (context)),
		observe: () => ({liveObjects: live.size, allocations, draws}),
	};
}

/** Manufactured one-ray operator using the real reconstruction/transport code.
 * @returns {SkyViewPlan} Bounded eight-tap, two-altitude solar stencil.
 */
function manufacturedPlan() {
	const coordinates = Array.from({length: 8}, (_, index) => ({
		x: 0,
		y: index,
		altitudeIndex: Math.floor(index / 4),
		solarIndex: index % 4,
		directionIndex: 0,
		label: `proof-${index}`,
	}));
	/** @type {SkyViewSample[]} */ const samples = [0, 500, 1500].map((altitude, index) => ({
		point: [0, 0, 6360000 + altitude],
		step: 100,
		altitude,
		altitudeWeights: [1 - index / 2, index / 2],
		directionWeights: [1],
		solarFraction: 0.375,
		firstSolarInterval: false,
		lastSolarInterval: false,
		indices: [0, 1, 2, 3, 4, 5, 6, 7],
	}));
	const ray = {
		sceneIndex: 0,
		sceneId: 'density-proof',
		time: '09:30',
		gridX: 0,
		gridY: 0,
		origin: /** @type {SkyVector3} */ ([0, 0, 6360000]),
		worldDirection: /** @type {SkyVector3} */ ([0, 0, 1]),
		length: 300,
		samples,
	};
	return {
		schemaId: 'sky-view-plan-v1',
		coordinates,
		rayCount: 1,
		representations: ['grouped'],
		views: [
			{
				id: 'density-proof',
				viewRule: 'altitude-segmented',
				intervalCount: 1,
				minimumSampleCount: 3,
				maximumSampleCount: 3,
				solarInterpolation: 'monotone-cubic',
				rays: [ray],
			},
		],
	};
}

/** Prove streaming dependencies, grouping controls and failure cleanup.
 * Uses the supplied physical control for ordinary medium coefficients, with an
 * explicitly separate constant-density manufactured case for scaling identities.
 * @param {SkyGpuControl} control - Authenticated control used by the owning runner.
 * @returns {Promise<SkyDensityProof>} Compact self-verifying implementation evidence.
 */
export async function verifyDensityImplementation(control) {
	let checks = 0;
	/** Count each explicit invariant. @param {unknown} value @param {string} message @returns {void} */
	const check = (value, message) => {
		assert.ok(value, message);
		checks++;
	};
	const productionPath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
	const parentPath = 'experiments/sky-accuracy-dials/orders/kernels.js';
	const production = readRepository(productionPath).toString().replaceAll('\r\n', '\n');
	const parent = readRepository(parentPath).toString().replaceAll('\r\n', '\n');
	/** Extract one shader generator body, including its literal GLSL terminator.
	 * @param {string} source - Authenticated repository source text.
	 * @param {string} name - Exact admitted fragment generator.
	 * @returns {string} Generator body excluding its leading JSDoc.
	 */
	const fragmentBody = (source, name) => {
		const start = source.indexOf(`function ${name}(`);
		assert.ok(start >= 0, `Missing fragment generator ${name}`);
		const body = source.indexOf('{', start),
			end = source.indexOf('\n}`;\n}', body);
		assert.ok(end > body, `Missing fragment terminator ${name}`);
		return source.slice(body, end + 7);
	};
	const unchangedFragments = ['directBaseFragment', 'j1Fragment', 'l1Fragment', 'transportFragment'].map((name) => {
		const original = fragmentBody(production, name),
			retained = fragmentBody(parent, name);
		check(original === retained, `Exact production shader parent is preserved for ${name}.`);
		return {name, sha256: sha256(original)};
	});
	const largestLayout = verifyDensityLifetimes(6 * 51 ** 2, 2048, 63 * 180);
	check(largestLayout.passCount === 13 && largestLayout.finalBytes === 0, 'Thirteen passes close every field.');
	check(
		largestLayout.peakBytes === 4 * (63 * 180) * (6 * 51 ** 2 + 3 * 2048),
		'Peak is exactly one J plus three L fields.',
	);
	check(largestLayout.samePreviousOrders.join(',') === '2,3,4', 'Both species use the same preceding radiance.');
	check(largestLayout.groundOrders.join(',') === '2,3', 'Only transported higher orders apply ground reflection.');
	assert.throws(() => verifyDensityLifetimes(6 * 51 ** 2, 4096, 63 * 180));
	checks++;
	assert.throws(() => requireDensityMode('combined'));
	checks++;
	const stages = densityStages();
	check(stages[2].program === 'analytic-l1' && stages[2].inputs.length === 0, 'Analytic L1 does not read cached J1.');
	for (const mode of /** @type {readonly SkyDensityMode[]} */ (['splitraw', 'factored'])) {
		const rayleigh = densityTransportFragment('', 'rayleigh', mode),
			mie = densityTransportFragment('', 'mie', mode);
		check(
			rayleigh.includes('if (false) {') && !rayleigh.includes('if (hitsGround && GROUND_ALBEDO > 0.0) {'),
			'Rayleigh transport disables its ground branch.',
		);
		check(
			mie.split('if (hitsGround && GROUND_ALBEDO > 0.0) {').length === 2,
			'Mie transport adds exactly one ground branch.',
		);
		check(
			mie.indexOf('radiance += texelFetch(uRayleighL') < mie.indexOf('if (hitsGround &&'),
			'Species transport is combined before the single ground term.',
		);
		for (const species of /** @type {readonly SkyDensitySpecies[]} */ (['rayleigh', 'mie'])) {
			const scatter = densityScatterFragment('', species, mode),
				transport = densityTransportFragment('', species, mode);
			check(
				scatter.includes(`incomingRadiance * ${species}Phase(outgoing, incoming) * incomingRecord.w`),
				'Both controls share lighting summation order.',
			);
			check(
				scatter.includes(
					mode === 'factored'
						? 'outputValue = lighting;'
						: `outputValue = medium.${species}Scattering * lighting;`,
				),
				'Density storage location is explicit.',
			);
			check(
				transport.includes(
					mode === 'factored'
						? `(medium.${species}Scattering * sampleJ(uPreviousJ, point, direction))`
						: 'transmittance * sampleJ(uPreviousJ, point, direction) * measure',
				),
				'Query density matches the representation.',
			);
		}
	}
	const plan = manufacturedPlan(),
		first = Float32Array.from([1, 2, 4, 8, 2, 4, 8, 16], (value) => value * 2 ** -20);
	const higher = [1, 2, 3].map((scale) => Float32Array.from(first, (value) => value * scale));
	const zero = [new Float32Array(8), new Float32Array(8), new Float32Array(8)];
	const original = evaluateOrders(control.buildRequest, plan, 0, [first, ...higher]);
	for (const species of /** @type {readonly SkyDensitySpecies[]} */ (['rayleigh', 'mie'])) {
		const fields = species === 'rayleigh' ? {rayleigh: higher, mie: zero} : {rayleigh: zero, mie: higher};
		const result = evaluateDensityOrders(control.buildRequest, plan, 0, first, fields, 'splitraw');
		for (let index = 0; index < result.values.length; index++)
			check(
				result.values[index] === original.values[index],
				'A zero second species preserves the grouped scalar evaluator exactly.',
			);
		const factored = evaluateDensityOrders(control.buildRequest, plan, 0, first, fields, 'factored');
		check(factored.values[0] === original.values[0], 'Raw final J1 is exact under both higher-density modes.');
	}
	const folded = prepareDensityOrderFields(first, {rayleigh: higher, mie: higher});
	check(folded.first === first, 'Raw J1 retains its captured identity.');
	for (const species of [folded.rayleigh, folded.mie])
		for (let index = 0; index < 8; index++)
			check(
				species[3][index] === Math.fround(Math.fround(higher[0][index] + higher[1][index]) + higher[2][index]),
				'Higher orders are left-folded in Float32 per species.',
			);
	const constantSpec = {
		...control.buildRequest.transportSpec,
		atmosphere: {
			...control.buildRequest.transportSpec.atmosphere,
			rayleighScaleHeightMeters: Infinity,
			mieScaleHeightMeters: Infinity,
			mieSingleScatteringAlbedo: 1,
		},
		domains: {
			...control.buildRequest.transportSpec.domains,
			spectrum: {
				...control.buildRequest.transportSpec.domains.spectrum,
				channels: control.buildRequest.transportSpec.domains.spectrum.channels.map((channel) => ({
					...channel,
					rayleighScatteringPerMeter: 2 ** -20,
					mieExtinctionPerMeter: 2 ** -21,
				})),
			},
		},
	};
	const factoredFields = prepareDensityOrderFields(first, {rayleigh: higher, mie: higher});
	const rawFields = prepareDensityOrderFields(first, {
		rayleigh: higher.map((field) => Float32Array.from(field, (value) => value * 2 ** -20)),
		mie: higher.map((field) => Float32Array.from(field, (value) => value * 2 ** -21)),
	});
	for (const sample of plan.views[0].rays[0].samples)
		for (const solar of /** @type {readonly SkySolarInterpolation[]} */ (['linear', 'monotone-cubic']))
			for (let order = 1; order <= 4; order++)
				check(
					sampleHigherDensityOrder(constantSpec, 0, rawFields, sample, solar, order, 'splitraw') ===
						sampleHigherDensityOrder(constantSpec, 0, factoredFields, sample, solar, order, 'factored'),
					'Constant power-of-two density commutes with the matched reconstruction and storage.',
				);
	const sample = plan.views[0].rays[0].samples[1],
		coefficients = medium(control.buildRequest.transportSpec, 0, sample.altitude);
	check(
		sampleHigherDensityOrder(
			control.buildRequest.transportSpec,
			0,
			factoredFields,
			sample,
			'monotone-cubic',
			4,
			'factored',
		) ===
			coefficients[1] * sampleDensity(factoredFields.rayleigh[3], sample, 'monotone-cubic') +
				coefficients[2] * sampleDensity(factoredFields.mie[3], sample, 'monotone-cubic'),
		'Variable-density query uses both exact physical coefficients.',
	);
	const a = Float32Array.from([0, 1, 8, 9, 0, 1, 8, 9]),
		b = Float32Array.from([8, 1, 0, 0, 8, 1, 0, 0]),
		combined = Float32Array.from(a, (value, index) => value + b[index]);
	const groupingDifference =
		sampleDensity(combined, sample, 'monotone-cubic') -
		sampleDensity(a, sample, 'monotone-cubic') -
		sampleDensity(b, sample, 'monotone-cubic');
	check(
		Math.abs(groupingDifference) > 1e-4,
		'Nonlinear species grouping is observably different and cannot be silently combined.',
	);
	const roundedCoefficient = Math.fround(Math.PI),
		roundedDensity = Math.fround(0.000017 * Math.PI),
		storageDifference = 0.000017 * roundedCoefficient - roundedDensity;
	check(storageDifference !== 0, 'Coefficient-storage rounding is a separately observable control.');
	const roundingWitness = Math.fround(Math.fround(16777216 + 1) + 1) - Math.fround(16777216 + Math.fround(1 + 1));
	check(roundingWitness === -2, 'Float32 order grouping can change values.');
	/** Invoke the actual driver against tracked inert dispatch. @param {number | null} failCreation @param {boolean} failCallback @returns {Promise<number>} */
	const dispatch = async (failCreation, failCallback) => {
		const harness = trackedGl(failCreation);
		/** @type {string[]} */ const captured = [];
		const operation = compileDensityOrders({
			gl: harness.gl,
			buildRequest: control.buildRequest,
			wavelengthIndex: 0,
			reportProgress: async () => {},
			fieldProbeCoordinates: {},
			onFieldProbes: async (event) => {
				captured.push(event.fieldId);
				if (failCallback && event.fieldId === 'J2-mie') throw new Error('intentional callback rejection');
			},
			commonModule: {createDistantSunSceneCacheCommonShaderSource: () => ''},
			compileSceneCaches: false,
			densityMode: 'factored',
		});
		if (failCreation !== null || failCallback) {
			await assert.rejects(operation);
			checks++;
		} else {
			const result = await operation;
			check(
				result.passCount === 13 && result.finalLiveFieldBytes === 0,
				'Actual driver dispatch closes the declared stage ledger.',
			);
			check(
				captured.join(',') === 'J1,L1,J2-rayleigh,J2-mie,L2,J3-rayleigh,J3-mie,L3,J4-rayleigh,J4-mie',
				'Sparse callbacks preserve the declared species and transport order.',
			);
			check(
				harness.observe().draws === 13 * control.buildRequest.transportSpec.domains.solarZenith.count,
				'Every declared stage executes every solar partition.',
			);
		}
		check(harness.observe().liveObjects === 0, 'Every tracked GPU object is released on success or failure.');
		return harness.observe().allocations;
	};
	const allocationCount = await dispatch(null, false);
	await dispatch(null, true);
	for (let failure = 1; failure <= allocationCount; failure++) await dispatch(failure, false);
	return {
		schemaId: 'sky-density-recurrence-proof-v1',
		checks,
		passed: true,
		shaderParents: [identity(productionPath), identity(parentPath)],
		unchangedFragments,
		largestLayout,
		witnesses: {
			groupingDifference,
			storageDifference,
			roundingWitness,
			ownedAllocationFailureSites: allocationCount,
		},
		scope: 'Manufactured CPU reconstruction identities, generated shader structure and tracked inert-WebGL driver lifetime/failure dispatch. Actual shader compilation, numerical recurrence parity and device memory require the separately authenticated GPU capture.',
	};
}
