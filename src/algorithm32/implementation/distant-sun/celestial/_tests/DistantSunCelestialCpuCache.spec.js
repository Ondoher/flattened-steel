import {DistantSunLightSource, SphericalEarthGeometry} from '../../../index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../../spectral-values/index.js';
import {DistantSunCelestialCpuCache} from '../DistantSunCelestialCpuCache.js';

const OBSERVATION = {
	instant: '2024-06-21T03:26:03.503Z',
	location: {
		latitude: {value: 0, units: /** @type {const} */ ('degrees')},
		longitude: {value: 0, units: /** @type {const} */ ('degrees')},
	},
};

/**
 * Create one native-15 transmittance packet.
 *
 * @param {readonly number[]} values - Exact channel values.
 * @returns {SpectralTransmittancePacket} - Validated packet.
 */
function transmittancePacket(values) {
	return /** @type {SpectralTransmittancePacket} */ (
		new SpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			values,
			provenanceIdentity: 'distant-sun-celestial-cpu-test-transmittance',
		})
	);
}

/**
 * Create one configured source, geometry, atmosphere, placement, and model.
 *
 * @param {Readonly<{
 * intervalCount?: number,
 * atmosphereId?: string,
 * variableTransport?: boolean,
 * forceUnsupportedOrigin?: boolean,
 * transportValue?: number,
 * topRadiusMeters?: number,
 * angularRadiusRadians?: number
 * }>} [options] - Fixture choices.
 * @returns {Readonly<{
 * cache: DistantSunCelestialCpuCache,
 * source: DistantSunLightSource,
 * geometry: SphericalEarthGeometry,
 * domain: CelestialContributionDomainDescription,
 * placement: Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>,
 * calls: AtmospherePath[]
 * }>} - Built fixture.
 */
function createFixture(options = {}) {
	const intervalCount = options.intervalCount ?? 3;
	const source = new DistantSunLightSource({
		angularRadius: {value: options.angularRadiusRadians ?? 0.004, units: 'radians'},
	});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6_360_000, units: 'meters'},
		topRadius: {value: options.topRadiusMeters ?? 6_420_000, units: 'meters'},
		observerHeight: {value: 1_000, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		sourceTransmittanceIntervalCount: intervalCount,
	});
	geometry.configureLightSource({
		lightSource: source,
		observation: OBSERVATION,
		placement: {kind: 'distant-direction', directionToLight: [0, 0, 1]},
	});
	const roster = /** @type {SphericalSunStarsSourceRoster} */ ({
		id: 'distant-sun-celestial-cpu-test-roster',
		family: 'spherical-sun-stars-radial-v1',
		sun: source,
		stars: null,
	});
	const placements = geometry.resolveCelestialPlacements({roster, observation: OBSERVATION});
	const placement = /** @type {Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>} */ (
		placements[0]
	);
	const domain = geometry.describeCelestialContributionDomain();
	const calls = /** @type {AtmospherePath[]} */ ([]);
	const atmosphere = /** @type {AtmosphereModel} */ (
		/** @type {unknown} */ ({
			id: options.atmosphereId ?? 'distant-sun-celestial-cpu-test-atmosphere',
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			/**
			 * Integrate one geometry-owned source path.
			 * @param {AtmospherePath} path - Geometry path.
			 * @returns {OpticalDepthSample} - Deterministic transmittance.
			 */
			integrateOpticalDepth(path) {
				calls.push(path);
				const altitudeFraction = Math.min(1, path.start.altitude.value / 60_000);
				const base =
					options.transportValue ?? (options.variableTransport ? 0.25 + 0.5 * altitudeFraction : 0.5);
				return /** @type {OpticalDepthSample} */ (
					/** @type {unknown} */ ({
						blockedByGround: false,
						opticalDepth: null,
						transmittance: transmittancePacket(
							Array.from({length: 15}, (_unused, index) => base * (1 - index / 100)),
						),
					})
				);
			},
		})
	);
	const geometryOwner = /** @type {GeometryModel & CelestialGeometryCapability} */ (
		options.forceUnsupportedOrigin
			? /** @type {unknown} */ ({
					id: geometry.id,
					celestialCapabilityFamily: geometry.celestialCapabilityFamily,
					describeCelestialContributionDomain: geometry.describeCelestialContributionDomain.bind(geometry),
					/**
					 * Create a production geometry sample with one explicit unsupported control.
					 * @param {CelestialBuildSampleRequest} request - Exact field coordinate.
					 * @returns {CelestialBuildSample} - Geometry sample.
					 */
					createCelestialBuildSample(request) {
						const sample = geometry.createCelestialBuildSample(request);
						return request.receiverIndex === 0 && request.directionIndex === 0
							? {...sample, supported: false}
							: sample;
					},
				})
			: geometry
	);
	const model = /** @type {Algorithm32ExecutionModel} */ (
		/** @type {unknown} */ ({
			profile: {numerical: {sourcePathTransmittance: {intervalCount}}},
			lightSource: source,
			atmosphere,
			geometry: geometryOwner,
			groundBoundary: null,
			celestialSources: roster,
		})
	);
	const cache = new DistantSunCelestialCpuCache({model, domain, placement, source});
	return {cache, source, geometry, domain, placement, calls};
}

describe('DistantSunCelestialCpuCache', /** Called by Jasmine to register the named suite. */ () => {
	it('builds the exact binary64 13 by 11 by 15 field through Step 4 geometry paths', () => {
		const {cache, source, calls} = createFixture();
		const surface = source.celestialSourceDefinition.surfaceRadiance.values;
		const supportedCount = cache.supportMask.values.reduce((sum, value) => sum + value, 0);

		expect(cache.scalarCount).toBe(2145);
		expect(cache.description.shape).toEqual({directionCount: 11, receiverCount: 13, channelCount: 15});
		expect(cache.description.quantity).toBe('spectral-radiance-density');
		expect(cache.description.units).toBe('W m^-2 sr^-1 nm^-1');
		expect(cache.description.sourceDefinitionHash).toBe(source.describeCelestialSourceIdentity().definitionHash);
		expect(cache.description.domainIdentity).toMatch(/^sha256:[0-9a-f]{64}$/u);
		expect(cache.description.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/u);
		expect(cache.supportMask.values.length).toBe(143);
		expect(calls.length).toBe(supportedCount);
		expect(calls.every((path) => path.samples?.length === 4)).toBeTrue();

		for (let receiverIndex = 0; receiverIndex < 13; receiverIndex += 1) {
			for (let directionIndex = 0; directionIndex < 11; directionIndex += 1) {
				const supported = cache.supportMask.values[receiverIndex * 11 + directionIndex] === 1;
				for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
					const actual = cache.readScalar({receiverIndex, directionIndex, wavelengthIndex});
					const expected = supported ? surface[wavelengthIndex] * 0.5 * (1 - wavelengthIndex / 100) : 0;
					expect(actual).toBe(expected);
				}
			}
		}

		const snapshot = cache.snapshot();
		expect(snapshot.values).not.toBe(cache.snapshot().values);
		expect(snapshot.values.length).toBe(2145);
	});

	it('writes exact zero for unsupported construction nodes without integrating them', () => {
		const {cache, calls} = createFixture({forceUnsupportedOrigin: true});

		expect(cache.supportMask.values[0]).toBe(0);
		for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
			expect(cache.readScalar({receiverIndex: 0, directionIndex: 0, wavelengthIndex})).toBe(0);
		}
		expect(calls.length).toBe(cache.supportMask.values.reduce((sum, value) => sum + value, 0));
	});

	it('applies only the supplied two-by-two geometry stencils and returns typed exact-zero classifications', () => {
		const {cache} = createFixture({variableTransport: true});
		const receiverStencil = /** @type {CelestialReceiverStencil} */ ({
			contentHash: 'receiver-stencil',
			classification: 'valid',
			valid: true,
			altitude: {value: 0, units: 'meters'},
			indices: [5, 6],
			weights: [0.25, 0.75],
		});
		const directionStencil = /** @type {CelestialDirectionStencil} */ ({
			contentHash: 'direction-stencil',
			classification: 'clear',
			valid: true,
			directionCoordinate: 0.8,
			indices: [7, 8],
			weights: [0.4, 0.6],
		});
		const result = cache.lookup({receiverStencil, directionStencil});
		const expected =
			0.25 * 0.4 * cache.readScalar({receiverIndex: 5, directionIndex: 7, wavelengthIndex: 0}) +
			0.25 * 0.6 * cache.readScalar({receiverIndex: 5, directionIndex: 8, wavelengthIndex: 0}) +
			0.75 * 0.4 * cache.readScalar({receiverIndex: 6, directionIndex: 7, wavelengthIndex: 0}) +
			0.75 * 0.6 * cache.readScalar({receiverIndex: 6, directionIndex: 8, wavelengthIndex: 0});

		expect(result.classification).toBe('clear');
		expect(result.radiance.values[0]).toBeCloseTo(expected, 14);
		expect(result.radiance.quantity).toBe(SPECTRAL_QUANTITIES.RADIANCE_DENSITY);

		const blocked = cache.lookup({
			receiverStencil,
			directionStencil: {...directionStencil, classification: 'ground-horizon', valid: false},
		});
		const outside = cache.lookup({
			receiverStencil: {...receiverStencil, classification: 'out-of-domain', valid: false},
			directionStencil,
		});
		expect(blocked.classification).toBe('ground-horizon');
		expect(outside.classification).toBe('out-of-domain');
		expect(blocked.radiance.values).toEqual(Array(15).fill(0));
		expect(outside.radiance.values).toEqual(Array(15).fill(0));
	});

	it('derives stable logical identity from source, domain, atmosphere, and numerical owners', () => {
		const first = createFixture();
		const repeated = new DistantSunCelestialCpuCache({
			model: /** @type {Algorithm32ExecutionModel} */ (
				/** @type {unknown} */ ({
					profile: {numerical: {sourcePathTransmittance: {intervalCount: 3}}},
					lightSource: first.source,
					atmosphere: {
						id: 'distant-sun-celestial-cpu-test-atmosphere',
						spectralBasis: NATIVE_15_SPECTRAL_BASIS,
						integrateOpticalDepth: () => ({
							blockedByGround: false,
							opticalDepth: null,
							transmittance: transmittancePacket(
								Array.from({length: 15}, (_value, index) => 0.5 * (1 - index / 100)),
							),
						}),
					},
					geometry: first.geometry,
					groundBoundary: null,
					celestialSources: {
						id: 'repeated-roster',
						family: 'spherical-sun-stars-radial-v1',
						sun: first.source,
						stars: null,
					},
				})
			),
			domain: first.domain,
			placement: first.placement,
			source: first.source,
		});
		const changedAtmosphere = createFixture({atmosphereId: 'changed-atmosphere'});
		const changedNumerics = createFixture({intervalCount: 4});
		const changedSource = createFixture({angularRadiusRadians: 0.005});
		const changedDomain = createFixture({topRadiusMeters: 6_430_000});

		expect(repeated.description.contentHash).toBe(first.cache.description.contentHash);
		expect(repeated.supportMask.contentHash).toBe(first.cache.supportMask.contentHash);
		expect(changedAtmosphere.cache.description.contentHash).not.toBe(first.cache.description.contentHash);
		expect(changedNumerics.cache.description.contentHash).not.toBe(first.cache.description.contentHash);
		expect(changedSource.cache.description.contentHash).not.toBe(first.cache.description.contentHash);
		expect(changedDomain.cache.description.contentHash).not.toBe(first.cache.description.contentHash);
	});

	it('rejects nonfinite or out-of-range atmosphere transport before publishing a field', () => {
		expect(
			/** Build with transport above the physical interval. */ () => createFixture({transportValue: 1.01}),
		).toThrowError(/within \[0, 1\]/u);
		expect(/** Build with nonfinite transport. */ () => createFixture({transportValue: Number.NaN})).toThrowError(
			/finite/u,
		);
	});
});
