import {
	BLACK_GROUND_BOUNDARY_IDENTITY,
} from '../../caches/ScatteringCacheDescriptor.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	NATIVE_48_POSITION_DOMAIN,
	createCubedSphereW27DirectionStencil,
	flattenCubedSphereW27NodeIndex,
} from '../../domains/index.js';
import {
	STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
} from '../fixtures/star-parity-consts.js';
import { SphericalEarthGeometry } from '../../geometries/SphericalEarthGeometry.js';
import {
	UniformLambertianGroundBoundary,
} from '../../ground-boundaries/index.js';
import { CanonicalAtmosphere } from '../../atmospheres/CanonicalAtmosphere.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
	createNativeProductionProfile,
} from '../../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import {
	buildDistantSunCpuCache,
} from '../distant-sun-cpu-cache-build.js';
import {
	createDistantSunCpuPureRadianceField,
} from '../DistantSunCpuFields.js';
import { DistantSunCpuCache } from '../DistantSunCpuCache.js';
import { DistantSunLightSource } from '../DistantSunLightSource.js';

describe('distant-Sun CPU scattering-cache build', () => {
	it('constructs physical J1 and publishes identical Jthrough1 with an order-1 descriptor', () => {
		const fixture = createPhysicalFixture();
		const constructionIdentities = createConstructionIdentities();
		const result = buildDistantSunCpuCache({
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			lightSource: fixture.lightSource,
			profile: fixture.profile,
			constructionIdentities,
			maximumScatteringOrder: 1,
		});
		const pureJ1 = result.pureScatteringDensityByOrder[0];
		const cumulativeJthrough1 = result.cumulativeScatteringDensity;

		expect(result.maximumScatteringOrder).toBe(1);
		expect(result.pureScatteringDensityByOrder.length).toBe(1);
		expect(result.pureRadianceByOrder).toEqual([]);
		expect(pureJ1.isSealed).toBeTrue();
		expect(cumulativeJthrough1.isSealed).toBeTrue();
		expect(cumulativeJthrough1).not.toBe(pureJ1);
		expect(pureJ1.scalarCount).toBe(3149280);
		expect(cumulativeJthrough1.scalarCount).toBe(pureJ1.scalarCount);

		const pureReader = pureJ1.createReader();
		const cumulativeReader = cumulativeJthrough1.createReader();
		const physicalSamples = [
			{
				coordinates: {
					directionIndex: flattenCubedSphereW27NodeIndex(0, 13, 13),
					positionIndex: 0,
					wavelengthIndex: 1,
				},
				value: 2,
			},
			{
				coordinates: {
					directionIndex: flattenCubedSphereW27NodeIndex(1, 13, 13),
					positionIndex: 0,
					wavelengthIndex: 7,
				},
				value: 0,
			},
			{
				coordinates: {
					directionIndex: flattenCubedSphereW27NodeIndex(2, 13, 13),
					positionIndex: 0,
					wavelengthIndex: 14,
				},
				value: 1,
			},
			{
				coordinates: {
					directionIndex: flattenCubedSphereW27NodeIndex(0, 13, 13),
					positionIndex: 0,
					wavelengthIndex: 0,
				},
				value: 0,
			},
			{
				coordinates: {
					directionIndex: flattenCubedSphereW27NodeIndex(0, 13, 13),
					positionIndex: 1,
					wavelengthIndex: 1,
				},
				value: 0,
			},
		];
		physicalSamples.forEach(({ coordinates, value }) => {
			expect(pureReader.readScalar(coordinates)).toBe(value);
			expect(cumulativeReader.readScalar(coordinates)).toBe(value);
		});

		expect(fixture.counts.directLighting).toBe(1);
		expect(fixture.counts.cacheBuildRay).toBe(48);
		expect(fixture.counts.medium).toBe(48);
		expect(fixture.counts.sourcePath).toBe(1);
		expect(fixture.counts.opticalDepth).toBe(1);
		expect(fixture.counts.phase).toBe(4374);

		expect(result.descriptor.kind).toBe('scattering-cache');
		expect(result.descriptor.field).toBe(cumulativeJthrough1.descriptor);
		expect(result.descriptor.field.precision).toBe('binary64');
		expect(result.descriptor.field.order).toEqual({
			kind: 'cumulative-through',
			value: 1,
			included: [1],
		});
		expect(result.descriptor.controls.maximumScatteringOrder).toBe(1);
		expect(result.descriptor.controls.transportIntervalCount).toBe(15);
		expect(result.descriptor.incomingDirectionDomain.count).toBe(34);
		expect(result.descriptor.constructionIdentities.source)
			.toEqual(constructionIdentities.source);
		expect(result.descriptor.constructionIdentities.atmosphere)
			.toEqual(constructionIdentities.atmosphere);
		expect(result.descriptor.constructionIdentities.geometry)
			.toEqual(constructionIdentities.geometry);
		expect(result.descriptor.constructionIdentities.boundary)
			.toEqual(BLACK_GROUND_BOUNDARY_IDENTITY);
	});

	it('runs the native N=1 path through the production atmosphere, geometry, and source', () => {
		const atmosphere = new CanonicalAtmosphere({
			constants: CANONICAL_ATMOSPHERE_CONSTANTS,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		});
		const geometry = new SphericalEarthGeometry({
			bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
			topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
			observerHeight: { value: 2, units: 'meters' },
			observerUpDirection: [1, 0, 0],
			directionToSource: [0, 1, 0],
			cacheAltitudeBinCount: 48,
			cacheBoundaryAltitude: { value: 2, units: 'meters' },
			sourceTransmittanceIntervalCount: 20,
		});
		const lightSource = new DistantSunLightSource({
			directionToLight: [0, 1, 0],
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			angularRadius: { value: 0.004675, units: 'radians' },
		});
		const result = lightSource.buildCpuScatteringCache({
			atmosphere,
			geometry,
			constructionIdentities: createConstructionIdentities(),
			maximumScatteringOrder: 1,
		});
		const forwardCoordinates = {
			directionIndex: flattenCubedSphereW27NodeIndex(0, 13, 13),
			positionIndex: 0,
			wavelengthIndex: 7,
		};
		const backwardCoordinates = {
			...forwardCoordinates,
			directionIndex: flattenCubedSphereW27NodeIndex(1, 13, 13),
		};
		const pureReader = result.pureScatteringDensityByOrder[0].createReader();
		const cumulativeReader = result.cumulativeScatteringDensity.createReader();
		const pureValue = pureReader.readScalar(forwardCoordinates);
		const backwardValue = pureReader.readScalar(backwardCoordinates);
		const cumulativeValue = cumulativeReader.readScalar(forwardCoordinates);
		const residentCache = new DistantSunCpuCache(result);
		const samplePosition = {
			coordinates: [CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius.value + 2, 0, 0],
			units: 'meters',
		};
		const atmosphereCoordinate = geometry.resolveAtmosphereCoordinate(samplePosition);
		const positionStencil = geometry.resolveScatteringCachePositionStencil({
			position: samplePosition,
			atmosphereCoordinate,
		});
		const cacheDirection = geometry.expressScatteringCacheDirection({
			position: samplePosition,
			physicalOutgoingDirection: [0, 1, 0],
		});
		const directionStencil = createCubedSphereW27DirectionStencil(cacheDirection);
		const sampledPacket = residentCache.sampleResolved({
			positionStencil,
			directionStencil,
		});

		expect(pureValue).toBeGreaterThan(0);
		expect(Number.isFinite(pureValue)).toBeTrue();
		expect(pureValue).toBeGreaterThan(backwardValue);
		expect(cumulativeValue).toBe(pureValue);
		expect(result.descriptor.controls.maximumScatteringOrder).toBe(1);
		expect(result.descriptor.controls.transportIntervalCount).toBe(15);
		expect(positionStencil).toEqual({ indices: [0], weights: [1] });
		expect(directionStencil).toEqual({
			indices: [forwardCoordinates.directionIndex],
			weights: [1],
		});
		sampledPacket.values.forEach((value, wavelengthIndex) => {
			expect(value).toBe(cumulativeReader.readScalar({
				...forwardCoordinates,
				wavelengthIndex,
			}));
		});
		residentCache.dispose();
	});

	it('executes N=2 as J1, L1, J2, then cumulative without transporting J2', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const operations = createDeterministicRecurrenceOperations(events);
		const result = buildDistantSunCpuCache({
			...fixture,
			constructionIdentities: {
				...createConstructionIdentities(),
				boundary: BLACK_GROUND_BOUNDARY_IDENTITY,
			},
			maximumScatteringOrder: 2,
			operations,
		});

		expect(events).toEqual(['J1', 'L1', 'J2<-L1']);
		expect(operations.createScatteringKernel.calls.allArgs()).toEqual([[
			{
				scatteringOrder: 2,
				groundIlluminationRadiance: null,
			},
		]]);
		expect(operations.buildTransportedRadiance).not.toHaveBeenCalled();
		expect(result.maximumScatteringOrder).toBe(2);
		expect(result.pureScatteringDensityByOrder.map(
			(field) => field.descriptor.order.value,
		)).toEqual([1, 2]);
		expect(result.pureScatteringDensityByOrder[1]
			.descriptor.provenanceIdentity).toBe(
			'test-deterministic-recurrence-kernel-v1',
		);
		expect(result.pureRadianceByOrder.map(
			(field) => field.descriptor.order.value,
		)).toEqual([1]);
		expect(result.cumulativeScatteringDensity.createReader()
			.readScalarAtOffset(0)).toBe(2);
		expect(result.descriptor.controls.maximumScatteringOrder).toBe(2);
		expect(result.descriptor.controls.transportIntervalCount).toBe(15);
		expect(result.descriptor.field).toBe(
			result.cumulativeScatteringDensity.descriptor,
		);
	});

	it('executes N=4 through J4 with only J2->L2 and J3->L3 transport', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const operations = createDeterministicRecurrenceOperations(events);
		const groundBoundary = createZeroGroundBoundary();
		const result = buildDistantSunCpuCache({
			...fixture,
			constructionIdentities: createConstructionIdentities(),
			maximumScatteringOrder: 4,
			groundBoundary,
			operations,
		});

		expect(events).toEqual([
			'J1',
			'L1',
			'J2<-L1',
			'L2<-J2',
			'J3<-L2',
			'L3<-J3',
			'J4<-L3',
		]);
		expect(operations.buildTransportedRadiance.calls.count()).toBe(2);
		expect(operations.buildTransportedRadiance.calls.allArgs().map(
			([request]) => request.scatteringDensity.descriptor.order.value,
		)).toEqual([2, 3]);
		const kernelRequests = operations.createScatteringKernel.calls.allArgs().map(
			([request]) => request,
		);
		expect(kernelRequests.map(({ scatteringOrder }) => scatteringOrder))
			.toEqual([2, 3, 4]);
		expect(kernelRequests[0].groundIlluminationRadiance).toBeNull();
		expect(kernelRequests[1].groundIlluminationRadiance)
			.toBe(result.pureRadianceByOrder[0]);
		expect(kernelRequests[2].groundIlluminationRadiance)
			.toBe(result.pureRadianceByOrder[1]);
		expect(kernelRequests.every(({ groundIlluminationRadiance }) =>
			groundIlluminationRadiance !== result.cumulativeScatteringDensity,
		)).toBeTrue();
		expect(result.maximumScatteringOrder).toBe(4);
		expect(result.pureScatteringDensityByOrder.map(
			(field) => field.descriptor.order.value,
		)).toEqual([1, 2, 3, 4]);
		expect(result.pureRadianceByOrder.map(
			(field) => field.descriptor.order.value,
		)).toEqual([1, 2, 3]);
		expect(result.pureScatteringDensityByOrder.slice(1).every(
			(field) => field.descriptor.provenanceIdentity
				=== 'test-deterministic-recurrence-kernel-v1',
		)).toBeTrue();
		expect(result.cumulativeScatteringDensity.createReader()
			.readScalarAtOffset(0)).toBe(9);
		expect(result.descriptor.controls.maximumScatteringOrder).toBe(4);
		expect(result.descriptor.controls.transportIntervalCount).toBe(15);
		expect(result.pureScatteringDensityByOrder[0].descriptor.id)
			.toBe('algorithm32-distant-sun-cpu-pure-j1-v1');
		expect(result.pureRadianceByOrder[0].descriptor.id)
			.toBe('algorithm32-distant-sun-cpu-pure-l1-v1');
		for (const field of result.pureScatteringDensityByOrder.slice(1)) {
			expect(field.descriptor.id)
				.toContain('-ground-sha256:test-zero-lambertian-ground');
		}
		for (const field of result.pureRadianceByOrder.slice(1)) {
			expect(field.descriptor.id)
				.toContain('-ground-sha256:test-zero-lambertian-ground');
		}
		expect(result.cumulativeScatteringDensity.descriptor.id)
			.toContain('-ground-sha256:test-zero-lambertian-ground');
		expect(result.descriptor.constructionIdentities.boundary)
			.toEqual(groundBoundary.describe());
	});

	it('defaults the public source to the N=4 physical transport contract', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const source = new DistantSunLightSource({
			directionToLight: [1, 0, 0],
			sourceIrradiance: fixture.profile.spectral.sourceIrradianceDensity,
			angularRadius: { value: 0.004675, units: 'radians' },
		});
		const request = {
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			profile: fixture.profile,
			constructionIdentities: createConstructionIdentities(),
		};

		expect(() => source.buildCpuScatteringCache(request)).toThrowError(
			/N=4 stored-field transport geometry must implement resolveScattering/u,
		);
		expect(events).toEqual([]);
	});

	it('requires reflective public builds to match explicit profile-owned albedo', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const source = new DistantSunLightSource({
			directionToLight: [1, 0, 0],
			sourceIrradiance: fixture.profile.spectral.sourceIrradianceDensity,
			angularRadius: { value: 0.004675, units: 'radians' },
		});
		const profileAlbedo = createFixtureSpectralPacket(
			SPECTRAL_QUANTITIES.REFLECTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
			Array(15).fill(0.1),
			'profile-ground-albedo',
		);
		const otherAlbedo = createFixtureSpectralPacket(
			SPECTRAL_QUANTITIES.REFLECTANCE,
			SPECTRAL_UNITS.DIMENSIONLESS,
			Array(15).fill(0.2),
			'other-ground-albedo',
		);
		const profile = createNativeProductionProfile({
			id: 'test-reflective-profile-v1',
			albedo: profileAlbedo,
		});
		const groundBoundary = new UniformLambertianGroundBoundary({
			albedo: otherAlbedo,
		});
		const request = {
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			constructionIdentities: createConstructionIdentities(),
			maximumScatteringOrder: 2,
			groundBoundary,
		};

		expect(() => source.buildCpuScatteringCache(request))
			.toThrowError(/requires an explicit profile-owned ground albedo/u);
		expect(() => source.buildCpuScatteringCache({ ...request, profile }))
			.toThrowError(/must match the explicit profile albedo and spectral basis/u);
		expect(events).toEqual([]);
	});

	it('preserves J1 while giving explicit zero ground a distinct cache identity', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const groundBoundary = createZeroGroundBoundary();
		const groundDescriptor = groundBoundary.describe();

		const result = buildDistantSunCpuCache({
			...fixture,
			constructionIdentities: {
				...createConstructionIdentities(),
				boundary: BLACK_GROUND_BOUNDARY_IDENTITY,
			},
			maximumScatteringOrder: 1,
			groundBoundary,
		});

		expect(events).toEqual(['J1']);
		expect(result.pureScatteringDensityByOrder[0].descriptor.id)
			.toBe('algorithm32-distant-sun-cpu-pure-j1-v1');
		expect(result.pureScatteringDensityByOrder[0].createReader()
			.readScalarAtOffset(0)).toBe(0);
		expect(result.descriptor.constructionIdentities.boundary)
			.toEqual(groundDescriptor);
		expect(result.descriptor.constructionIdentities.boundary)
			.not.toEqual(BLACK_GROUND_BOUNDARY_IDENTITY);
		expect(result.cumulativeScatteringDensity.descriptor.id)
			.toContain('-ground-sha256:test-zero-lambertian-ground');
	});

	it('rejects unsupported public maximum and interval values before construction', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const source = new DistantSunLightSource({
			directionToLight: [1, 0, 0],
			sourceIrradiance: fixture.profile.spectral.sourceIrradianceDensity,
			angularRadius: { value: 0.004675, units: 'radians' },
		});
		const request = {
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			profile: fixture.profile,
			constructionIdentities: createConstructionIdentities(),
		};

		expect(() => source.buildCpuScatteringCache({
			...request,
			maximumScatteringOrder: 3,
		})).toThrowError(/must be one of 1, 2, 4/u);
		expect(() => source.buildCpuScatteringCache({
			...request,
			maximumScatteringOrder: 1,
			transportIntervalCount: 0,
		})).toThrowError(/must be a positive integer/u);
		expect(events).toEqual([]);
	});

	it('uses the frozen 40-interval count only when an offline build requests it', () => {
		const events = [];
		const fixture = createZeroPathRecurrenceFixture(events);
		const result = buildDistantSunCpuCache({
			...fixture,
			constructionIdentities: createConstructionIdentities(),
			maximumScatteringOrder: 1,
			transportIntervalCount:
				STAR_PARITY_DISTANT_SUN_TRANSPORT_INTERVAL_COUNT,
		});

		expect(result.descriptor.controls.transportIntervalCount).toBe(40);
		expect(result.descriptor.controls.maximumScatteringOrder).toBe(1);
		expect(events).toEqual(['J1']);
	});
});

function createZeroPathRecurrenceFixture(events) {
	const sourcePacket = DEFAULT_NATIVE_PRODUCTION_PROFILE
		.spectral.sourceIrradianceDensity;
	const sourceValues = sourcePacket.values;
	const zeroSpectrum = () => sourceValues.map(() => 0);
	let sawPrimaryScattering = false;
	let sawPrimaryRadiance = false;
	const atmosphere = {
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		describe() {
			return { kind: 'canonical-atmosphere' };
		},
		sampleMedium() {
			const zeroValues = zeroSpectrum();
			return {
				extinction: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'zero-extinction',
				),
				scattering: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'zero-scattering',
				),
				rayleighScattering: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'zero-rayleigh-scattering',
				),
				mieScattering: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'zero-mie-scattering',
				),
				mieExtinction: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'zero-mie-extinction',
				),
				absorption: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'zero-absorption',
				),
				density: {},
			};
		},
		integrateOpticalDepth() {
			return {
				blockedByGround: false,
				opticalDepth: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
					SPECTRAL_UNITS.DIMENSIONLESS,
					zeroSpectrum(),
					'zero-optical-depth',
				),
				transmittance: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.TRANSMITTANCE,
					SPECTRAL_UNITS.DIMENSIONLESS,
					sourceValues.map(() => 1),
					'unit-transmittance',
				),
			};
		},
		samplePhase() {
			return {
				rayleighPhase: { value: 0, units: 'sr^-1' },
				miePhase: { value: 0, units: 'sr^-1' },
			};
		},
	};
	const geometry = {
		describe() {
			return {
				kind: 'spherical-earth-geometry',
				bottomRadius: NATIVE_48_POSITION_DOMAIN.mapping.bottomRadius,
				topRadius: NATIVE_48_POSITION_DOMAIN.mapping.topRadius,
				directionToSource: [1, 0, 0],
				observerLocalSceneFrame: { up: [1, 0, 0] },
			};
		},
		resolveCacheBuildRay(coordinate) {
			if (coordinate.coordinateKey.startsWith('native-48-position:')
				&& !sawPrimaryScattering) {
				events.push('J1');
				sawPrimaryScattering = true;
			}
			if (coordinate.coordinateKey.startsWith('native-48-fibonacci-34:')
				&& !sawPrimaryRadiance) {
				events.push('L1');
				sawPrimaryRadiance = true;
			}
			return null;
		},
		resolveAtmosphereCoordinate() {
			return { altitude: { value: 2, units: 'meters' } };
		},
		resolveAtmospherePath() {
			return { samples: [] };
		},
		resolveSourceRelativePosition() {
			return {};
		},
		expressPhysicalIncomingRadianceDirection(cacheDirection) {
			return cacheDirection;
		},
	};
	const lightSource = {
		describe() {
			return {
				kind: 'distant-sun-light-source',
				directionToLight: [1, 0, 0],
			};
		},
		sampleDirectLighting() {
			return {
				sourceIrradiance: sourcePacket,
				directionToLight: [1, 0, 0],
			};
		},
		resolveSourcePathLimit() {
			return { maxDistance: null, reason: 'test-distant-source' };
		},
	};

	return {
		atmosphere,
		geometry,
		lightSource,
		profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
		calculator: {
			buildEndpointTrapezoidPathIntegrationPoints() {
				return [];
			},
			computeDirectRadiance() {
				return {
					pathRadiance: createFixtureSpectralPacket(
						SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
						SPECTRAL_UNITS.RADIANCE_DENSITY,
						zeroSpectrum(),
						'zero-path-radiance',
					),
				};
			},
		},
	};
}

function createDeterministicRecurrenceOperations(events) {
	const createScatteringKernel = jasmine.createSpy(
		'createScatteringKernel',
	).and.callFake(() => ({
		buildPureScatteringOrder({ previousRadiance, outputScattering }) {
			const previousOrder = previousRadiance.descriptor.order.value;
			const scatteringOrder = outputScattering.descriptor.order.value;
			events.push(`J${scatteringOrder}<-L${previousOrder}`);
			outputScattering.fill(scatteringOrder);
		},
	}));
	const buildTransportedRadiance = jasmine.createSpy(
		'buildTransportedRadiance',
	).and.callFake(({ scatteringDensity, id }) => {
		const scatteringOrder = scatteringDensity.descriptor.order.value;
		events.push(
			`L${scatteringOrder}<-J${scatteringDensity.descriptor.order.value}`,
		);
		const radiance = createDistantSunCpuPureRadianceField({
			id,
			order: scatteringOrder,
		});
		const writer = radiance.createWriter();
		writer.fill(scatteringOrder);
		radiance.seal();
		return radiance;
	});

	return {
		createScatteringKernel,
		scatteringProvenanceIdentity:
			'test-deterministic-recurrence-kernel-v1',
		buildTransportedRadiance,
	};
}

function createPhysicalFixture() {
	const sourceValues = Array.from(
		{ length: NATIVE_15_SPECTRAL_BASIS.channelCount },
		(_unused, index) => index === 0 ? 0 : 2,
	);
	const sourcePacket = createSpectralPacket({
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		basis: NATIVE_15_SPECTRAL_BASIS,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		values: sourceValues,
		provenanceIdentity: 'test-stage32-zero-leading-source-v1',
	});
	const profile = createNativeProductionProfile({
		id: 'test-stage32-native-profile-v1',
		sourceIrradianceDensity: sourcePacket,
	});
	const counts = {
		directLighting: 0,
		cacheBuildRay: 0,
		medium: 0,
		sourcePath: 0,
		opticalDepth: 0,
		phase: 0,
	};
	const zero = () => sourceValues.map(() => 0);
	const atmosphere = {
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		describe() {
			return { kind: 'canonical-atmosphere' };
		},
		sampleMedium(coordinate) {
			counts.medium += 1;
			const scattering = coordinate.altitude.value === 2;
			const zeroValues = zero();
			const rayleighValues = sourceValues.map(() => scattering ? 2 : 0);
			const mieValues = sourceValues.map(() => scattering ? 3 : 0);
			return {
				extinction: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'physical-extinction',
				),
				scattering: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					rayleighValues.map((value, index) => value + mieValues[index]),
					'physical-scattering',
				),
				rayleighScattering: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					rayleighValues,
					'physical-rayleigh-scattering',
				),
				mieScattering: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					mieValues,
					'physical-mie-scattering',
				),
				mieExtinction: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					mieValues,
					'physical-mie-extinction',
				),
				absorption: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
					SPECTRAL_UNITS.INVERSE_LENGTH,
					zeroValues,
					'physical-absorption',
				),
				density: {},
			};
		},
		integrateOpticalDepth() {
			counts.opticalDepth += 1;
			return {
				blockedByGround: false,
				opticalDepth: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
					SPECTRAL_UNITS.DIMENSIONLESS,
					sourceValues.map(() => Math.log(2)),
					'physical-optical-depth',
				),
				transmittance: createFixtureSpectralPacket(
					SPECTRAL_QUANTITIES.TRANSMITTANCE,
					SPECTRAL_UNITS.DIMENSIONLESS,
					sourceValues.map(() => 0.5),
					'physical-transmittance',
				),
			};
		},
		samplePhase(request) {
			counts.phase += 1;
			if (request.incomingDirection[0] !== 1
				|| request.incomingDirection[1] !== 0
				|| request.incomingDirection[2] !== 0) {
				throw new Error('test expected source-local positive-x incoming direction');
			}
			const directionCosine = request.viewDirection[0];
			return {
				rayleighPhase: { value: (directionCosine + 1) / 2, units: 'sr^-1' },
				miePhase: { value: 0, units: 'sr^-1' },
			};
		},
	};
	const geometry = {
		describe() {
			return {
				kind: 'spherical-earth-geometry',
				bottomRadius: NATIVE_48_POSITION_DOMAIN.mapping.bottomRadius,
				topRadius: NATIVE_48_POSITION_DOMAIN.mapping.topRadius,
				directionToSource: [0, 1, 0],
			};
		},
		resolveCacheBuildRay(coordinate) {
			counts.cacheBuildRay += 1;
			return {
				ray: {
					origin: {
						coordinates: [coordinate.altitude.value, 0, 0],
						units: 'meters',
					},
					direction: coordinate.incomingDirection,
				},
				startDistance: { value: 0, units: 'meters' },
				endDistance: { value: 1, units: 'meters' },
			};
		},
		resolveAtmosphereCoordinate(position) {
			return {
				altitude: {
					value: position.coordinates[0],
					units: position.units,
				},
			};
		},
		resolveAtmospherePath(request) {
			counts.sourcePath += 1;
			const coordinate = this.resolveAtmosphereCoordinate(request.ray.origin);
			return {
				start: coordinate,
				end: coordinate,
				length: request.endDistance,
				samples: [],
			};
		},
	};
	const lightSource = {
		describe() {
			return { kind: 'distant-sun-light-source' };
		},
		sampleDirectLighting() {
			counts.directLighting += 1;
			return {
				sourceIrradiance: sourcePacket,
				directionToLight: [0, 1, 0],
			};
		},
		resolveSourcePathLimit() {
			return {
				maxDistance: null,
				reason: 'test-distant-source',
			};
		},
	};

	return {
		atmosphere,
		geometry,
		lightSource,
		profile,
		counts,
	};
}

function createFixtureSpectralPacket(quantity, units, values, provenanceIdentity) {
	return createSpectralPacket({
		quantity,
		units,
		basis: NATIVE_15_SPECTRAL_BASIS,
		values,
		provenanceIdentity: `distant-cache-build-test:${provenanceIdentity}`,
	});
}

function createConstructionIdentities() {
	return {
		source: {
			id: 'test-distant-sun-source-v1',
			contentHash: 'sha256:test-distant-sun-source-and-profile',
		},
		atmosphere: {
			id: 'test-atmosphere-with-profile-v1',
			contentHash: 'sha256:test-atmosphere-with-profile',
		},
		geometry: {
			id: 'test-spherical-geometry-v1',
			contentHash: 'sha256:test-spherical-geometry',
		},
	};
}

function createZeroGroundBoundary() {
	const descriptor = {
		id: 'test-zero-lambertian-ground-v1',
		contentHash: 'sha256:test-zero-lambertian-ground',
	};

	return {
		id: descriptor.id,
		describe: () => descriptor,
		evaluateBrdf() {
			throw new Error('deterministic recurrence must not evaluate ground BRDF.');
		},
	};
}
