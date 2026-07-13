import {CanonicalAtmosphere, DistantSunLightSource, SphericalEarthGeometry} from '../../../index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../canonical-atmosphere/consts.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../cache/consts.js';
import {createNativeExecutionProfile} from '../../../../profiles/native-15/native-15-profile.js';

const OBSERVATION = {
	instant: '2024-06-21T03:26:03.503Z',
	location: {
		latitude: {value: 0, units: /** @type {const} */ ('degrees')},
		longitude: {value: 0, units: /** @type {const} */ ('degrees')},
	},
};

/**
 * Create one complete spherical distant-Sun controller fixture.
 *
 * @param {CacheGpuBackend} backend - External construction backend.
 * @param {CacheBuildScheduler} [scheduler] - Optional safe-boundary scheduler.
 * @returns {{model: SharedModel, source: DistantSunLightSource, controller: DistantSunCelestialCacheController, request: DistantSunCelestialCacheBuildRequest}} - Controller and exact request.
 */
function createFixture(backend, scheduler) {
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
	const source = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 2, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sourceTransmittanceIntervalCount: 20,
	});
	geometry.configureLightSource({
		lightSource: source,
		observation: OBSERVATION,
		placement: {kind: 'distant-direction', directionToLight: [0, 1, 0]},
	});
	const roster = /** @type {SphericalSunStarsSourceRoster} */ ({
		id: 'distant-sun-celestial-controller-test-roster',
		family: 'spherical-sun-stars-radial-v1',
		sun: source,
		stars: null,
	});
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const profile = createNativeExecutionProfile({
		lightSource: source,
		atmosphere,
		geometry,
		groundBoundary: null,
		observation: OBSERVATION,
		celestialSources: roster,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: {sourceTransmittanceIntervalCount: 20, maximumScatteringOrder: 4},
	});
	const model = /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: source,
			atmosphere,
			geometry,
			groundBoundary: null,
			celestialSources: roster,
			profile,
		})
	);
	const placements = geometry.resolveCelestialPlacements({roster, observation: OBSERVATION});
	const placement = /** @type {Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>} */ (
		placements[0]
	);
	const query = /** @type {SphericalCelestialQueryPacket} */ (
		geometry.createCelestialQueryPacket(roster, placements)
	);
	return {
		model,
		source,
		controller: source.createDistantSunCelestialCacheController({model, backend, scheduler}),
		request: {placement, query},
	};
}

/**
 * Create one controllable neutral backend.
 *
 * @returns {{backend: CacheGpuBackend & CacheProbeReader, state: {capabilities: CacheGpuCapabilities, failAllocation: boolean, compiled: number, submissions: number, allocatedFields: number, disposedFields: number, disposedPrograms: number, backendDisposals: number, lastProbeRequest: CacheProbeRequest | null}}} - Backend and observable state.
 */
function createBackend() {
	const state = {
		capabilities: {
			id: 'distant-sun-celestial-controller-capabilities-v1',
			api: 'test-webgl2',
			scalarFormat: /** @type {const} */ ('R32F'),
			supportsArrayRenderTargets: true,
			supportsFloatSampling: true,
			maximumTextureSize: 4096,
			maximumArrayLayers: 256,
		},
		failAllocation: false,
		compiled: 0,
		submissions: 0,
		allocatedFields: 0,
		disposedFields: 0,
		disposedPrograms: 0,
		backendDisposals: 0,
		lastProbeRequest: /** @type {CacheProbeRequest | null} */ (null),
	};
	const backend = /** @type {CacheGpuBackend & CacheProbeReader} */ ({
		id: 'distant-sun-celestial-controller-backend',
		get capabilities() {
			return state.capabilities;
		},
		allocateField(spec) {
			if (state.failAllocation) {
				throw new Error('Injected distant-Sun celestial allocation failure.');
			}
			state.allocatedFields += 1;
			return {
				...spec,
				backendId: this.id,
				dispose() {
					state.disposedFields += 1;
				},
			};
		},
		compile(shader) {
			state.compiled += 1;
			return {
				id: shader.id,
				sourceHash: shader.sourceHash,
				dispose() {
					state.disposedPrograms += 1;
				},
			};
		},
		submitLayer() {
			state.submissions += 1;
		},
		createRuntimeBinding({field, valueKey}) {
			return {id: `${this.id}:${valueKey}`, valueKey, fieldId: field.id, backendId: this.id};
		},
		installRuntimeBindings() {},
		dispose() {
			state.backendDisposals += 1;
		},
		async readSelectedScalars(request) {
			state.lastProbeRequest = request;
			return {
				fieldId: request.field.id,
				samples: request.coordinates.map(
					/**
					 * Called by Array.prototype.map to return one deterministic probe sample.
					 * @param {DirectionalSpectralFieldCoordinates} coordinates - Requested coordinate.
					 * @returns {{coordinates: DirectionalSpectralFieldCoordinates, value: number}} - Probe sample.
					 */
					(coordinates) => ({coordinates, value: 0.25}),
				),
			};
		},
	});
	return {backend, state};
}

/**
 * Create a scheduler that blocks only its first safe-boundary yield.
 *
 * @returns {{scheduler: CacheBuildScheduler, reached: Promise<void>, release(): void}} - Controllable first yield.
 */
function createBlockingScheduler() {
	let reachedResolver = /** @type {() => void} */ (() => {});
	let releaseResolver = /** @type {() => void} */ (() => {});
	let blocked = false;
	const reached = new Promise(
		/** Called by Promise construction to retain the first-yield notification. */ (resolve) => {
			reachedResolver = resolve;
		},
	);
	const blockedYield = new Promise(
		/** Called by Promise construction to retain the first-yield release. */ (resolve) => {
			releaseResolver = resolve;
		},
	);
	return {
		scheduler: {
			yieldControl() {
				if (blocked) {
					return Promise.resolve();
				}
				blocked = true;
				reachedResolver();
				return blockedYield;
			},
		},
		reached,
		release() {
			releaseResolver();
		},
	};
}

describe('DistantSunCelestialCacheController', /** Called by Jasmine to register the named suite. */ () => {
	it('publishes one complete resource with binding, probes, lookup, and idempotent disposal', async () => {
		const {backend, state} = createBackend();
		const {model, source, controller, request} = createFixture(backend);
		const resource = await controller.build(request);
		const contribution = resource.createShaderContribution();
		const liveContribution = resource.createLiveShaderContribution({
			model,
			queryPacket: request.query,
			source,
		});
		const probe = await resource.readSelectedScalars(backend, [
			{receiverIndex: 4, directionIndex: 2, wavelengthIndex: 7},
		]);

		expect(controller.active).toBe(resource);
		expect(resource.sourceId).toBe('distant-sun');
		expect(resource.resourceIdentity).toBeTruthy();
		expect(resource.getRuntimeBindings().bindings).toEqual([
			jasmine.objectContaining({valueKey: 'cache.celestial.sunTransport'}),
		]);
		expect(contribution.provides).toEqual(['cache.sampleDistantSunCelestialRadiance']);
		expect(contribution.requires).toEqual(['geometry.celestialCacheStencilTypes']);
		expect(contribution.functions[0].slot).toBe('sampleCelestialCache');
		expect(contribution.functions[0].code).toContain('receiverWeights');
		expect(liveContribution.provides).toEqual(['celestial.evaluateRadiance']);
		expect(liveContribution.requires).toEqual(
			jasmine.arrayContaining([
				'runtime.sceneHitTexture',
				'geometry.reconstructViewRay',
				'geometry.resolveCelestialCacheStencil',
				'geometry.resolveDistantSunDiskSupport',
				'cache.sampleDistantSunCelestialRadiance',
			]),
		);
		expect(liveContribution.functions.map((block) => block.code).join('\n')).toContain(
			'DISTANT_SUN_CELESTIAL_SAMPLE_OFFSETS[4]',
		);
		expect(liveContribution.functions.map((block) => block.code).join('\n')).toContain(
			'texelFetch(uSceneHitTexture, samplePixel, 0)',
		);
		expect(liveContribution.functions.map((block) => block.code).join('\n')).toContain(
			'any(greaterThanEqual(sampleTextureCoordinates, vec2(1.0)))',
		);
		expect(liveContribution.mainHooks).toEqual([jasmine.objectContaining({slot: 'evaluateCelestialRadiance'})]);
		expect(state.lastProbeRequest?.coordinates).toEqual([
			{positionIndex: 4, directionIndex: 2, wavelengthIndex: 7},
		]);
		expect(probe.samples[0].value).toBe(0.25);

		controller.dispose();
		controller.dispose();
		expect(state.disposedFields).toBe(1);
		expect(state.backendDisposals).toBe(0);
		expect(() => resource.getRuntimeBindings()).toThrowError(/disposed/u);
	});

	it('reuses the exact active plan without another GPU execution', async () => {
		const {backend, state} = createBackend();
		const {controller, request} = createFixture(backend);
		const first = await controller.build(request);
		const second = await controller.build(request);

		expect(second).toBe(first);
		expect(state.compiled).toBe(1);
		expect(state.submissions).toBe(15);
		expect(state.allocatedFields).toBe(1);
		controller.dispose();
	});

	it('enforces bounded probe coordinates and validates external readback', async () => {
		const {backend} = createBackend();
		const {controller, request} = createFixture(backend);
		const resource = await controller.build(request);

		await expectAsync(
			resource.readSelectedScalars(backend, [{receiverIndex: 13, directionIndex: 0, wavelengthIndex: 0}]),
		).toBeRejectedWithError(/receiverIndex/u);
		await expectAsync(
			resource.readSelectedScalars(backend, [
				{receiverIndex: 0, directionIndex: 0, wavelengthIndex: 0},
				{receiverIndex: 0, directionIndex: 0, wavelengthIndex: 0},
			]),
		).toBeRejectedWithError(/duplicate/u);
		const mismatchedReader = /** @type {CacheProbeReader} */ ({
			async readSelectedScalars() {
				return {
					fieldId: 'foreign-field',
					samples: [],
				};
			},
		});
		await expectAsync(
			resource.readSelectedScalars(mismatchedReader, [{receiverIndex: 0, directionIndex: 0, wavelengthIndex: 0}]),
		).toBeRejectedWithError(/does not match/u);
		controller.dispose();
	});

	it('preserves the last valid resource on failure and disposes it only after complete replacement', async () => {
		const {backend, state} = createBackend();
		const {controller, request} = createFixture(backend);
		const first = await controller.build(request);
		state.capabilities = {...state.capabilities, id: 'distant-sun-celestial-controller-capabilities-v2'};
		state.failAllocation = true;

		await expectAsync(controller.build(request)).toBeRejectedWithError(/Injected/u);
		expect(controller.active).toBe(first);
		expect(state.disposedFields).toBe(0);

		state.failAllocation = false;
		const replacement = await controller.build(request);
		expect(replacement).not.toBe(first);
		expect(replacement.resourceIdentity).not.toBe(first.resourceIdentity);
		expect(controller.active).toBe(replacement);
		expect(state.disposedFields).toBe(1);
		expect(() => first.getRuntimeBindings()).toThrowError(/disposed/u);
		controller.dispose();
		expect(state.disposedFields).toBe(2);
		expect(state.backendDisposals).toBe(0);
	});

	it('rejects caller cancellation without publishing and releases staging', async () => {
		const {backend, state} = createBackend();
		const blocking = createBlockingScheduler();
		const {controller, request} = createFixture(backend, blocking.scheduler);
		const cancellation = new AbortController();
		const operation = controller.build({...request, signal: cancellation.signal});
		await blocking.reached;
		cancellation.abort();
		blocking.release();

		await expectAsync(operation).toBeRejectedWithError(/aborted|cancelled/u);
		expect(controller.active).toBeNull();
		expect(state.disposedFields).toBe(1);
		controller.dispose();
		expect(state.backendDisposals).toBe(0);
	});

	it('serializes supersession so only the newest complete generation publishes', async () => {
		const {backend, state} = createBackend();
		const blocking = createBlockingScheduler();
		const {controller, request} = createFixture(backend, blocking.scheduler);
		const superseded = controller.build(request);
		await blocking.reached;
		const current = controller.build(request);
		blocking.release();

		await expectAsync(superseded).toBeRejectedWithError(/aborted|cancelled|superseded/u);
		const published = await current;
		expect(controller.active).toBe(published);
		expect(state.compiled).toBe(2);
		expect(state.allocatedFields).toBe(2);
		expect(state.disposedFields).toBe(1);
		controller.dispose();
		expect(state.disposedFields).toBe(2);
		expect(state.backendDisposals).toBe(0);
	});
});
