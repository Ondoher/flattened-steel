import {DistantSunLightSource, SphericalEarthGeometry, StellarPointSetSource} from '../../index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {StellarPointSetCpuCache} from '../StellarPointSetCpuCache.js';
import {STELLAR_POINT_SET_CACHE_LAYOUT} from '../consts.js';

const OBSERVATION = {
	instant: '2026-08-17T04:00:00.000Z',
	location: {latitude: {value: 37.3382, units: 'degrees'}, longitude: {value: -121.8863, units: 'degrees'}},
};

function transmittancePacket(value) {
	return new SpectralPacket({basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE, units: SPECTRAL_UNITS.DIMENSIONLESS, values: Array(15).fill(value), provenanceIdentity: 'stellar-cache-test-transmittance'});
}

function createFixture(backend = null) {
	const sun = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const stars = new StellarPointSetSource();
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6_360_000, units: 'meters'}, topRadius: {value: 6_420_000, units: 'meters'},
		observerHeight: {value: 10, units: 'meters'}, observerUpDirection: [0, 0, 1], sourceTransmittanceIntervalCount: 3,
	});
	geometry.configureLightSource({lightSource: sun, observation: OBSERVATION, placement: {kind: 'distant-direction', directionToLight: [0, 0, 1]}});
	const roster = /** @type {SphericalSunStarsSourceRoster} */ ({id: 'stellar-cache-test-roster', family: 'spherical-sun-stars-radial-v1', sun, stars});
	let integrationCount = 0;
	const atmosphere = /** @type {AtmosphereModel} */ (/** @type {unknown} */ ({
		id: 'stellar-cache-test-atmosphere', spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		integrateOpticalDepth() { integrationCount += 1; return {blockedByGround: false, opticalDepth: null, transmittance: transmittancePacket(0.5)}; },
	}));
	const model = /** @type {SharedModel} */ (/** @type {unknown} */ ({
		lightSource: sun, atmosphere, geometry, celestialSources: roster,
		profile: {numerical: {sourcePathTransmittance: {intervalCount: 3}}},
	}));
	const placements = geometry.resolveCelestialPlacements({roster, observation: OBSERVATION});
	const placement = /** @type {Extract<CelestialResolvedPlacement, {readonly kind: 'static-stellar-point-set'}>} */ (placements[1]);
	const query = /** @type {SphericalCelestialQueryPacket} */ (geometry.createCelestialQueryPacket(roster, placements));
	return {model, stars, geometry, placement, query, backend, integrationCount: () => integrationCount};
}

function createBackend() {
	const state = {compiled: 0, submissions: 0, fields: 0, disposedFields: 0};
	const backend = /** @type {CacheGpuBackend} */ ({
		id: 'stellar-cache-test-backend',
		capabilities: {id: 'stellar-cache-test-capabilities', api: 'test-webgl2', scalarFormat: 'R32F', supportsArrayRenderTargets: true, supportsFloatSampling: true, maximumTextureSize: 4096, maximumArrayLayers: 256},
		compile(shader) { state.compiled += 1; return {id: shader.id, sourceHash: shader.sourceHash, dispose() {}}; },
		allocateField(spec) { state.fields += 1; return {...spec, backendId: this.id, dispose() { state.disposedFields += 1; }}; },
		submitLayer() { state.submissions += 1; },
		createRuntimeBinding({field, valueKey}) { return {id: `${this.id}:${valueKey}`, valueKey, fieldId: field.id, backendId: this.id}; },
		installRuntimeBindings() {}, dispose() {},
	});
	return {backend, state};
}

describe('StellarPointSetCache production promotion', () => {
	it('builds the complete transport field once per domain node and preserves zero capacity slots', () => {
		const fixture = createFixture();
		const domain = fixture.geometry.describeCelestialContributionDomain();
		const cache = new StellarPointSetCpuCache({model: fixture.model, domain, placement: fixture.placement, source: fixture.stars});
		const firstSource = fixture.stars.celestialSourceDefinition.members[0].spectralIrradiance.values[0];
		const packed = cache.packedValues();

		// The eleven exact ground-horizon nodes remain zero and never ask atmosphere to integrate.
		expect(fixture.integrationCount()).toBe(132);
		expect(cache.readScalar({memberIndex: 0, directionIndex: 10, receiverIndex: 12, wavelengthIndex: 0})).toBe(firstSource * 0.5);
		expect(packed.length).toBe(352 * 210 * 15);
		const unusedX = (500 % 32) * 11;
		const unusedY = Math.floor(500 / 32) * 13;
		expect(packed[unusedY * 352 + unusedX]).toBe(0);
		expect(cache.descriptor.valueKey).toBe('cache.celestial.starTransport');
	});

	it('publishes and exactly reuses the tiled resource with its bounded live raster contribution', async () => {
		const {backend, state} = createBackend();
		const fixture = createFixture(backend);
		const controller = fixture.stars.createStellarPointSetCacheController({model: fixture.model, backend});
		const request = {placement: fixture.placement, query: fixture.query};
		const first = await controller.build(request);
		const repeated = await controller.build(request);
		const lookup = first.createShaderContribution();
		const live = first.createLiveShaderContribution({queryPacket: fixture.query});

		expect(repeated).toBe(first);
		expect(state.compiled).toBe(1);
		expect(state.submissions).toBe(15);
		expect(first.getRuntimeBindings().bindings[0].valueKey).toBe('cache.celestial.starTransport');
		expect(lookup.functions[0].code).toContain('tileX * 11');
		expect(live.functions.map((block) => block.code).join('\n')).toContain('stellarPointSetDirection(memberIndex)');
		expect(live.uniforms).toEqual([
			{
				name: 'uStellarPointMemberCount',
				type: 'int',
				valueKey: 'celestial.stellarPointSetMemberCount',
				defaultValue: 500,
			},
		]);
		expect(live.functions.map((block) => block.code).join('\n')).toContain('memberIndex < uStellarPointMemberCount');
		expect(live.functions.map((block) => block.code).join('\n')).toContain('irradiance.channels[channelIndex] / pixelSolidAngle');
		expect(live.mainHooks[0].code).toBe('addStellarPointSetRadiance(celestialRadiance, state);');

		controller.dispose();
		controller.dispose();
		expect(state.disposedFields).toBe(1);
		expect(() => first.getRuntimeBindings()).toThrowError(/disposed/u);
	});
});
