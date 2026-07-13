import {CanonicalAtmosphere, DistantSunLightSource, SphericalEarthGeometry} from '../../../index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../canonical-atmosphere/consts.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../cache/consts.js';
import {createNativeExecutionProfile} from '../../../../profiles/native-15/native-15-profile.js';
import {DistantSunCelestialGpuBuilder} from '../DistantSunCelestialGpuBuilder.js';

const OBSERVATION = {
	instant: '2024-06-21T03:26:03.503Z',
	location: {
		latitude: {value: 0, units: /** @type {const} */ ('degrees')},
		longitude: {value: 0, units: /** @type {const} */ ('degrees')},
	},
};

/** Create one complete spherical distant-Sun GPU fixture. */
function createFixture() {
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
		id: 'distant-sun-celestial-gpu-test-roster',
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
	return {model, source, geometry, placement, query};
}

/** Create a deterministic neutral backend test double. */
function createBackend() {
	const state = {compiled: [], submissions: [], disposedFields: 0, disposedPrograms: 0};
	const backend = /** @type {CacheGpuBackend & CacheProbeReader} */ ({
		id: 'distant-sun-celestial-neutral-backend',
		capabilities: {
			id: 'distant-sun-celestial-neutral-capabilities',
			api: 'test-webgl2',
			scalarFormat: 'R32F',
			supportsArrayRenderTargets: true,
			supportsFloatSampling: true,
			maximumTextureSize: 4096,
			maximumArrayLayers: 256,
		},
		allocateField(spec) {
			return {
				...spec,
				backendId: this.id,
				dispose() {
					state.disposedFields += 1;
				},
			};
		},
		compile(shader) {
			state.compiled.push(shader);
			return {
				id: shader.id,
				sourceHash: shader.sourceHash,
				dispose() {
					state.disposedPrograms += 1;
				},
			};
		},
		submitLayer(request) {
			state.submissions.push(request);
		},
		createRuntimeBinding({field, valueKey}) {
			return {id: `${this.id}:${valueKey}`, valueKey, fieldId: field.id, backendId: this.id};
		},
		installRuntimeBindings() {},
		dispose() {},
		async readSelectedScalars({field, coordinates}) {
			return {
				fieldId: field.id,
				samples: coordinates.map((coordinate) => ({coordinates: coordinate, value: 0.25})),
			};
		},
	});
	return {backend, state};
}

describe('DistantSunCelestialGpuBuilder', /** Called by Jasmine to register the named suite. */ () => {
	it('derives one exact field and one owner-assembled direct-transport pass', () => {
		const fixture = createFixture();
		const {backend} = createBackend();
		const builder = new DistantSunCelestialGpuBuilder({...fixture, backend});
		const plan = builder.createBuildPlan(fixture);
		const repeated = builder.createBuildPlan(fixture);

		expect(plan.execution.fields).toEqual([
			{id: 'distant-sun-celestial-transport', storage: {format: 'R32F', width: 11, height: 13, layers: 15}},
		]);
		expect(plan.execution.passes.length).toBe(1);
		expect(plan.execution.passes[0].inputs).toEqual([]);
		expect(plan.execution.passes[0].modules.map(({owner}) => owner).sort()).toEqual([
			'atmosphere',
			'cache',
			'geometry',
			'lightSource',
		]);
		expect(plan.execution.valueKey).toBe('cache.celestial.sunTransport');
		expect(plan.descriptor.logicalField.quantity).toBe('spectral-radiance-density');
		expect(plan.supportMask.values.length).toBe(143);
		expect(plan.identity.contentHash).toBe(repeated.identity.contentHash);
	});

	it('executes 15 layers, publishes the distinct opaque binding, and retains bounded probes', async () => {
		const fixture = createFixture();
		const {backend, state} = createBackend();
		const builder = new DistantSunCelestialGpuBuilder({...fixture, backend});
		const plan = builder.createBuildPlan(fixture);
		const coordinates = [
			{receiverIndex: 0, directionIndex: 0, wavelengthIndex: 0},
			{receiverIndex: 12, directionIndex: 10, wavelengthIndex: 14},
		];
		const result = await builder.execute(plan, {probeReader: backend, probeCoordinates: coordinates});
		const shader = state.compiled[0];

		expect(state.compiled.length).toBe(1);
		expect(state.submissions.length).toBe(15);
		expect(state.submissions.map(({layer}) => layer)).toEqual(Array.from({length: 15}, (_value, index) => index));
		expect(shader.source).toContain('uCelestialSunSurfaceRadiance');
		expect(shader.source).toContain('cacheCelestialPathTransmittance');
		expect(shader.source).not.toContain('cachePrimaryJ1');
		expect(shader.source).not.toContain('cacheRayleighPhase');
		expect(result.artifact.runtimeBindings.bindings).toEqual([
			jasmine.objectContaining({
				valueKey: 'cache.celestial.sunTransport',
				fieldId: 'distant-sun-celestial-transport',
			}),
		]);
		expect(result.artifact.diagnostics.memory.residentFieldStorage).toEqual({value: 8_580, units: 'bytes'});
		expect(result.artifact.diagnostics.passes[0].probe.samples.map(({value}) => value)).toEqual([0.25, 0.25]);
		expect(result.cpuReference.scalarCount).toBe(2145);
		expect(state.disposedPrograms).toBe(1);
		expect(state.disposedFields).toBe(0);
		result.artifact.dispose();
		result.artifact.dispose();
		expect(state.disposedFields).toBe(1);
	});

	it('rejects foreign executable plans and insufficient GPU capabilities', async () => {
		const fixture = createFixture();
		const {backend} = createBackend();
		const builder = new DistantSunCelestialGpuBuilder({...fixture, backend});
		const plan = builder.createBuildPlan(fixture);
		const other = new DistantSunCelestialGpuBuilder({...fixture, backend});

		await expectAsync(other.execute(plan)).toBeRejectedWithError(/created by this builder/u);
		expect(
			/** Construct with insufficient array-layer capacity. */ () =>
				new DistantSunCelestialGpuBuilder({
					...fixture,
					backend: {...backend, capabilities: {...backend.capabilities, maximumArrayLayers: 14}},
				}),
		).toThrowError(/does not support/u);
	});
});
