import {
	CanonicalAtmosphere,
	FlatEarthGeometry,
	UniformLambertianGroundBoundary,
} from '../../../../implementation/index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../../implementation/canonical-atmosphere/consts.js';
import {CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/cubed-sphere/consts.js';
import {PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../../sampling-domains/direction/fibonacci/consts.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
	createNativeExecutionProfile,
	createNativeProductionProfile,
} from '../../../../profiles/native-15/native-15-profile.js';
import {SpectralCalculator} from '../../../../atmospheric-transport/spectral/SpectralCalculator.js';
import LocalSunConstructionDomainSelection from '../LocalSunConstructionDomainSelection.js';
import LocalSunConstructionLightSource from '../LocalSunConstructionLightSource.js';
import LocalSunCpuCache from '../LocalSunCpuCache.js';
import LocalSunCpuFields from '../LocalSunCpuFields.js';
import {LocalSunCacheProvider} from '../LocalSunCacheProvider.js';
import {LocalSunLightSource} from '../../LocalSunLightSource.js';
import {LocalSunShellFactCache} from '../LocalSunShellFactCache.js';
import {LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY, LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY} from '../consts.js';
import {LOCAL_SUN_TRANSPORT_INTERVAL_COUNT} from '../../consts.js';

describe('local-Sun binary64 scattering cache', /** Called by Jasmine to register the named test suite. */ () => {
	it('allocates fresh mutable members of every source-owned CPU field family', /** Called by Jasmine to exercise the named behavior. */ () => {
		const {domainSelection} = createFixture();
		const firstRadiance = LocalSunCpuFields.createPureRadiance({
			id: 'local-sun-fresh-radiance',
			order: 1,
			domainSelection,
		});
		const secondRadiance = LocalSunCpuFields.createPureRadiance({
			id: 'local-sun-fresh-radiance',
			order: 1,
			domainSelection,
		});
		const firstPureScattering = LocalSunCpuFields.createPureScatteringDensity({
			id: 'local-sun-fresh-pure-scattering',
			order: 2,
			domainSelection,
		});
		const secondPureScattering = LocalSunCpuFields.createPureScatteringDensity({
			id: 'local-sun-fresh-pure-scattering',
			order: 2,
			domainSelection,
		});
		const firstCumulativeScattering = LocalSunCpuFields.createCumulativeScatteringDensity({
			id: 'local-sun-fresh-cumulative-scattering',
			cumulativeThroughOrder: 3,
			domainSelection,
		});
		const secondCumulativeScattering = LocalSunCpuFields.createCumulativeScatteringDensity({
			id: 'local-sun-fresh-cumulative-scattering',
			cumulativeThroughOrder: 3,
			domainSelection,
		});

		expect(firstRadiance).not.toBe(secondRadiance);
		expect(firstPureScattering).not.toBe(secondPureScattering);
		expect(firstCumulativeScattering).not.toBe(secondCumulativeScattering);
		expect(firstRadiance.scalarCount).toBe(domainSelection.radiancePacking.scalarCount);
		expect(firstPureScattering.scalarCount).toBe(domainSelection.scatteringDensityPacking.scalarCount);
		expect(firstCumulativeScattering.scalarCount).toBe(domainSelection.scatteringDensityPacking.scalarCount);
		expect(firstRadiance.provenanceIdentity).toBe(LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY);
		expect(firstPureScattering.order).toEqual({kind: 'pure', value: 2});
		expect(firstCumulativeScattering.order).toEqual({
			kind: 'cumulative-through',
			value: 3,
			included: [1, 2, 3],
		});
		expect(firstRadiance.isSealed).toBeFalse();

		firstRadiance.createWriter().writeScalarAtOffset(0, 7);
		firstRadiance.seal();
		secondRadiance.seal();
		expect(firstRadiance.createReader().readScalarAtOffset(0)).toBe(7);
		expect(secondRadiance.createReader().readScalarAtOffset(0)).toBe(0);
	});

	it('builds distinct N1, N2, and N4 pure graphs through stored-field transport', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const firstOrderResult = build(fixture, 1);
		const secondOrderResult = build(fixture, 2);
		const fourthOrderResult = build(fixture, 4);

		expect(fixture.domainSelection.spectralBasis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(fixture.domainSelection.spectralChannelCount).toBe(15);
		expect(firstOrderResult.pureScatteringDensityByOrder.length).toBe(1);
		expect(firstOrderResult.pureRadianceByOrder.length).toBe(0);
		expect(secondOrderResult.pureScatteringDensityByOrder.length).toBe(2);
		expect(secondOrderResult.pureRadianceByOrder.length).toBe(1);
		expect(fourthOrderResult.pureScatteringDensityByOrder.length).toBe(4);
		expect(fourthOrderResult.pureRadianceByOrder.length).toBe(3);

		expect(secondOrderResult.pureRadianceByOrder[0].order).toEqual({
			kind: 'pure',
			value: 1,
		});
		expect(fourthOrderResult.pureRadianceByOrder[1].order.value).toBe(2);
		expect(fourthOrderResult.pureRadianceByOrder[2].order.value).toBe(3);
		expect(fourthOrderResult.options.transportIntervalCount).toBe(15);
		expect(fourthOrderResult.options.maximumScatteringOrder).toBe(4);

		const fields = fourthOrderResult.pureScatteringDensityByOrder;
		const cumulative = fourthOrderResult.cumulativeScatteringDensity.createReader();
		const readers = fields.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param field - The field value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (field) => field.createReader(),
		);
		for (const coordinates of fixture.probes) {
			const expected = readers.reduce(
				/**
				 * Called by Array.prototype.reduce to accumulate one collection value.
				 * @param sum - The sum value accepted by the operation.
				 * @param reader - The reader value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sum, reader) => sum + reader.readScalar(coordinates),
				0,
			);
			expect(cumulative.readScalar(coordinates)).toBe(expected);
			expect(Number.isFinite(expected)).toBeTrue();
			expect(expected).toBeGreaterThanOrEqual(0);
		}

		const secondOrderPrimaryScatteringReader = secondOrderResult.pureScatteringDensityByOrder[0].createReader();
		const fourthOrderPrimaryScatteringReader = fourthOrderResult.pureScatteringDensityByOrder[0].createReader();
		const secondOrderPrimaryRadianceReader = secondOrderResult.pureRadianceByOrder[0].createReader();
		const fourthOrderPrimaryRadianceReader = fourthOrderResult.pureRadianceByOrder[0].createReader();
		for (const coordinates of fixture.probes) {
			expect(secondOrderPrimaryScatteringReader.readScalar(coordinates)).toBe(
				fourthOrderPrimaryScatteringReader.readScalar(coordinates),
			);
		}
		for (const coordinates of fixture.radianceProbes) {
			expect(secondOrderPrimaryRadianceReader.readScalar(coordinates)).toBe(
				fourthOrderPrimaryRadianceReader.readScalar(coordinates),
			);
		}
	});

	it('uses the source-owned source-path interval count in CPU output', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fourIntervalFixture = createFixture({
			sourceTransmittanceIntervalCount: 4,
		});
		const eightIntervalFixture = createFixture({
			sourceTransmittanceIntervalCount: 8,
		});
		const repeatedEightIntervalFixture = createFixture({
			sourceTransmittanceIntervalCount: 8,
		});
		const fourIntervals = build(fourIntervalFixture, 1).pureScatteringDensityByOrder[0];
		const eightIntervals = build(eightIntervalFixture, 1).pureScatteringDensityByOrder[0];
		const repeatedEightIntervals = build(repeatedEightIntervalFixture, 1).pureScatteringDensityByOrder[0];

		expect(maximumFieldDifference(fourIntervals, eightIntervals)).toBeGreaterThan(0);
		expect(maximumFieldDifference(eightIntervals, repeatedEightIntervals)).toBe(0);
	});

	it('uses the cache controls retained by the aggregate model', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fourIntervalFixture = createFixture({transportIntervalCount: 4});
		const sixIntervalFixture = createFixture({transportIntervalCount: 6});
		const fromProfile = fourIntervalFixture.lightSource.buildCpuScatteringCache({
			model: fourIntervalFixture.model,
		});
		const selectedSix = sixIntervalFixture.lightSource.buildCpuScatteringCache({
			model: sixIntervalFixture.model,
		});

		expect(fromProfile.maximumScatteringOrder).toBe(1);
		expect(fromProfile.options).toEqual({
			transportIntervalCount: 4,
			maximumScatteringOrder: 1,
		});
		expect(selectedSix.options).toEqual({
			transportIntervalCount: 6,
			maximumScatteringOrder: 1,
		});
	});

	it('isolates shell-held amplitude to J1 and its cumulative contribution', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const shellHeld = build(fixture, 4);
		const continuousJ1 = buildContinuousJ1Control(fixture);

		expect(
			maximumFieldDifference(
				continuousJ1.pureScatteringDensityByOrder[0],
				shellHeld.pureScatteringDensityByOrder[0],
			),
		).toBeGreaterThan(0);
		for (let orderIndex = 1; orderIndex < 4; orderIndex += 1) {
			expect(
				maximumFieldDifference(
					continuousJ1.pureScatteringDensityByOrder[orderIndex],
					shellHeld.pureScatteringDensityByOrder[orderIndex],
				),
			).toBe(0);
		}
		for (let orderIndex = 0; orderIndex < 3; orderIndex += 1) {
			expect(
				maximumFieldDifference(
					continuousJ1.pureRadianceByOrder[orderIndex],
					shellHeld.pureRadianceByOrder[orderIndex],
				),
			).toBe(0);
		}
		expect(maximumCumulativeIsolationRatio(shellHeld, continuousJ1)).toBeLessThanOrEqual(1);
		expect(
			fixture.lightSource.sampleDirectLighting({
				sourceRelativePosition: fixture.geometry.resolveSourceRelativePosition({
					position: {
						coordinates: [0, 0, 5],
						units: 'meters',
					},
				}),
			}).metadata,
		).not.toEqual(
			jasmine.objectContaining({
				constructionLightKind: 'shell-held-arithmetic-mean',
			}),
		);
	});

	it('rejects a local source whose owned position differs from geometry', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const mismatchedSource = new LocalSunLightSource({
			sourceKey: 'mismatched-local-sun-cpu-test',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: 1,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
			sourceTransmittanceIntervalCount: 4,
		});
		mismatchedSource.configureGeometryPlacement({
			kind: 'finite-position',
			position: {coordinates: [4799999, 0, 4800000], units: 'meters'},
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				mismatchedSource.buildCpuScatteringCache({
					model: createExecutionModel(fixture, {lightSource: mismatchedSource}),
				}),
		).toThrowError(/source-owned position exactly/u);
	});

	it('builds N1 through the public source and samples the stored cumulative field exactly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const result = fixture.lightSource.buildCpuScatteringCache({
			model: fixture.model,
		});
		const cache = new LocalSunCpuCache(result);
		const packet = cache.sampleResolved({
			positionStencil: {indices: [0], weights: [1]},
			directionStencil: {indices: [0], weights: [1]},
		});
		const cumulative = result.cumulativeScatteringDensity.createReader();

		expect(result.maximumScatteringOrder).toBe(1);
		expect(result.pureScatteringDensityByOrder.length).toBe(1);
		expect(result.pureRadianceByOrder).toEqual([]);
		packet.values.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param value - The value accepted by the operation.
			 * @param wavelengthIndex - The wavelength index value accepted by the operation.
			 */ (value, wavelengthIndex) => {
				expect(value).toBe(
					cumulative.readScalar({
						positionIndex: 0,
						directionIndex: 0,
						wavelengthIndex,
					}),
				);
			},
		);

		cache.dispose();
	});

	it('samples the local concrete CPU cache with four-position and four-direction stencils', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const result = build(fixture, 1);
		const cache = new LocalSunCpuCache(result);
		const position = {
			coordinates: [2400000, 0, 50000],
			units: 'meters',
		};
		const atmosphereCoordinate = fixture.geometry.resolveAtmosphereCoordinate(position);
		const physicalOutgoingDirection = [0.2672612419124244, 0.5345224838248488, 0.8017837257372732];
		const positionStencil = fixture.geometry.resolveScatteringCachePositionStencil({
			position,
			atmosphereCoordinate,
		});
		const directionStencil = fixture.domainSelection.resolveOutgoingDirectionStencil(
			fixture.geometry.expressScatteringCacheDirection({
				position,
				physicalOutgoingDirection,
			}),
		);
		const packet = cache.sampleResolved({
			positionStencil,
			directionStencil,
		});

		expect(positionStencil.indices.length).toBe(4);
		expect(directionStencil.indices.length).toBe(4);
		expect(packet.values.length).toBe(15);
		expect(packet.values.every(Number.isFinite)).toBeTrue();
		expect(
			packet.values.every(
				/**
				 * Called by Array.prototype.every to test one collection value against the shared condition.
				 * @param value - The value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (value) => value >= 0,
			),
		).toBeTrue();

		cache.dispose();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				cache.sampleResolved({
					positionStencil: {indices: [0], weights: [1]},
					directionStencil: {indices: [0], weights: [1]},
				}),
		).toThrowError(/disposed/u);
	});

	it('carries direct and pure-order ground illumination through J2, J3, and J4', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const black = build(fixture, 4);
		const groundBoundary = new UniformLambertianGroundBoundary({material: 'grass'});
		const profile = createNativeProductionProfile({
			id: 'local-sun-cpu-reflective-profile',
			albedo: groundBoundary.albedo,
		});
		const reflective = buildFixtureRecurrence(fixture, {
			maximumScatteringOrder: 4,
			profile,
			groundBoundary,
		});

		const maximumDifferences = reflective.pureScatteringDensityByOrder.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param field - The field value accepted by the operation.
			 * @param orderIndex - The order index value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (field, orderIndex) => maximumFieldDifference(field, black.pureScatteringDensityByOrder[orderIndex]),
		);

		expect(maximumDifferences[0]).toBe(0);
		expect(maximumDifferences[1]).toBeGreaterThan(0);
		expect(maximumDifferences[2]).toBeGreaterThan(0);
		expect(maximumDifferences[3]).toBeGreaterThan(0);
		expect(reflective.cumulativeScatteringDensity.id).not.toBe(black.cumulativeScatteringDensity.id);
	});
});

/**
 * Called by this module to build.
 * @param fixture - The fixture value accepted by the operation.
 * @param maximumScatteringOrder - The maximum scattering order value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function build(fixture, maximumScatteringOrder) {
	return buildFixtureRecurrence(fixture, {
		maximumScatteringOrder,
		primaryLightSource: fixture.constructionLightSource,
	});
}

/**
 * Called by this module to build the same recurrence while changing only the J1 light adapter from shell-held to the finite source's continuous sample.
 *
 * @param {LocalSunCpuCacheTestFixture} fixture - Supplies fixed owners.
 * @returns {LocalSunCpuCacheResult} - The continuous-J1 isolation control.
 */
function buildContinuousJ1Control(fixture) {
	return buildFixtureRecurrence(fixture, {
		maximumScatteringOrder: 4,
		primaryLightSource: fixture.lightSource,
	});
}

/**
 * Called by this module to execute the internal bounded-domain CPU comparison seam.
 *
 * @param {LocalSunCpuCacheTestFixture} fixture - Supplies fixed owners.
 * @param {LocalSunCpuCacheFixtureRecurrenceRequest} request - Supplies the isolated recurrence choice.
 * @returns {LocalSunCpuCacheResult} - The completed bounded result.
 */
function buildFixtureRecurrence(fixture, request) {
	const profile = request.profile ?? DEFAULT_NATIVE_PRODUCTION_PROFILE;
	const model = /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			geometry: fixture.geometry,
			atmosphere: fixture.atmosphere,
			lightSource: fixture.lightSource,
			profile: {
				...profile,
				spectral: {...profile.spectral, basis: NATIVE_15_SPECTRAL_BASIS},
				numerical: {
					...profile.numerical,
					sourcePathTransmittance: {intervalCount: fixture.sourceTransmittanceIntervalCount},
				},
			},
		})
	);
	const calculator = new SpectralCalculator({
		model,
	});

	return fixture.cacheProvider._buildCpuCache({
		atmosphere: fixture.atmosphere,
		geometry: fixture.geometry,
		lightSource: request.primaryLightSource ?? fixture.constructionLightSource,
		profile,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		calculator,
		sourceTransmittanceIntervalCount: fixture.sourceTransmittanceIntervalCount,
		transportIntervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		domainSelection: fixture.domainSelection,
		groundBoundary: request.groundBoundary ?? null,
		maximumScatteringOrder: request.maximumScatteringOrder,
		operations: {
			/**
			 * Called by build fixture recurrence to create scattering kernel.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ createScatteringKernel: ({scatteringOrder, groundIlluminationRadiance}) =>
				fixture.cacheProvider._createLaterOrderScatteringKernel({
					geometry: fixture.geometry,
					atmosphere: fixture.atmosphere,
					calculator,
					domainSelection: fixture.domainSelection,
					scatteringOrder,
					groundIlluminationRadiance,
					groundBoundary: request.groundBoundary ?? null,
					lightSource: fixture.lightSource,
					sourceTransmittanceIntervalCount: fixture.sourceTransmittanceIntervalCount,
				}),
			/**
			 * Called by build fixture recurrence to build transported radiance.
			 * @param input1 - The destructured input accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ buildTransportedRadiance: ({scatteringDensity, scatteringOrder, id}) =>
				fixture.cacheProvider._buildTransportedRadiance({
					scatteringDensity,
					scatteringOrder,
					geometry: fixture.geometry,
					atmosphere: fixture.atmosphere,
					calculator,
					domainSelection: fixture.domainSelection,
					pathIntervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
					id,
				}),
			scatteringProvenanceIdentity: LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
		},
	});
}

/**
 * Called by this module to create one bounded local-Sun CPU cache fixture.
 *
 * @param input1 - The destructured input accepted by the operation.
 * @returns {LocalSunCpuCacheTestFixture} - The physical owners, executable domains, and probes.
 */
function createFixture({sourceTransmittanceIntervalCount = 4, transportIntervalCount = 15} = {}) {
	const geometry = new FlatEarthGeometry({
		observerPosition: {
			coordinates: [0, 0, 5],
			units: 'meters',
		},
		topAltitude: {value: 100000, units: 'meters'},
		localLightSourceHeight: {value: 4800000, units: 'meters'},
		projectionRadius: {value: 48000000, units: 'meters'},
		cacheAltitudeNodes: [
			{value: 0, units: 'meters'},
			{value: 100000, units: 'meters'},
		],
		cacheRadialNodes: [
			{value: 0, units: 'meters'},
			{value: 4800000, units: 'meters'},
		],
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
	});
	const lightSource = new LocalSunLightSource({
		sourceKey: 'local-sun-cpu-test',
		referenceDistance: {value: 4800000, units: 'meters'},
		referenceSpectralIncidentScale: 1,
		radius: {value: 25749.504, units: 'meters'},
		distanceFalloff: true,
		sourceTransmittanceIntervalCount,
	});
	geometry.configureLightSource({
		lightSource,
		observation: {
			instant: '2026-03-20T12:00:00.000Z',
			location: {
				latitude: {value: -0.27940210679735955, units: 'degrees'},
				longitude: {value: -1.5903827852862762, units: 'degrees'},
			},
		},
	});
	const constructionLightSource = new LocalSunConstructionLightSource({
		source: lightSource,
		shellFactCache: new LocalSunShellFactCache({
			sourceConfiguration: lightSource.configuration,
		}),
	});
	const cacheProvider = new LocalSunCacheProvider({
		source: lightSource,
		configuration: lightSource.configuration,
	});
	const positionDomainOwner = geometry.createLocalSunCachePositionDomain();
	const domainSelection = new LocalSunConstructionDomainSelection({
		id: 'local-sun-cpu-test-z2-rho2-paired-rotated-fibonacci68-w3',
		positionDomainOwner,
		incomingDirectionDomainOwner: PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
		outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId: 'local-sun-cpu-test-radiance-packing',
		scatteringDensityPackingId: 'local-sun-cpu-test-density-packing',
	});
	const fixture = {
		atmosphere,
		geometry,
		lightSource,
		constructionLightSource,
		cacheProvider,
		sourceTransmittanceIntervalCount,
		domainSelection,
		probes: [
			{
				directionIndex: 4,
				positionIndex: 0,
				wavelengthIndex: 0,
			},
			{
				directionIndex: 13,
				positionIndex: 2,
				wavelengthIndex: 7,
			},
			{
				directionIndex: 49,
				positionIndex: 3,
				wavelengthIndex: 14,
			},
		],
		radianceProbes: [
			{
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex: 0,
			},
			{
				directionIndex: 17,
				positionIndex: 2,
				wavelengthIndex: 7,
			},
			{
				directionIndex: 33,
				positionIndex: 3,
				wavelengthIndex: 14,
			},
		],
	};
	return {
		...fixture,
		model: createExecutionModel(fixture, {transportIntervalCount}),
	};
}

/**
 * Called by this module to create one immutable aggregate execution model.
 * @param fixture - The local physical owners and domains.
 * @param options - The selected model overrides.
 * @returns - The aggregate model double.
 */
function createExecutionModel(fixture, options = {}) {
	const lightSource = options.lightSource ?? fixture.lightSource;
	const groundBoundary = options.groundBoundary ?? null;
	const profile = createNativeExecutionProfile({
		lightSource,
		atmosphere: fixture.atmosphere,
		geometry: fixture.geometry,
		groundBoundary,
		observation: fixture.geometry.configuration.observation,
		domains: {
			positions: fixture.domainSelection.positionDomain,
			incomingDirections: fixture.domainSelection.incomingDirectionDomain,
			outgoingDirections: fixture.domainSelection.outgoingDirectionDomain,
		},
		execution: {
			maximumScatteringOrder: options.maximumScatteringOrder ?? 1,
			sourceTransmittanceIntervalCount: fixture.sourceTransmittanceIntervalCount,
		},
	});
	const selectedProfile = {
		...profile,
		numerical: {
			...profile.numerical,
			cacheConstruction: {
				...profile.numerical.cacheConstruction,
				transportIntervalCount: options.transportIntervalCount ?? 15,
			},
		},
	};
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource,
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			groundBoundary,
			profile: selectedProfile,
		})
	);
}

/**
 * Called by this module to measure the cumulative-delta identity under its predeclared binary64 bound.
 *
 * @param {LocalSunCpuCacheResult} shellHeld - Supplies the selected build.
 * @param {LocalSunCpuCacheResult} continuous - Supplies the isolation control.
 * @returns {number} - Maximum residual divided by its allowed error.
 */
function maximumCumulativeIsolationRatio(shellHeld, continuous) {
	const shellJ1 = shellHeld.pureScatteringDensityByOrder[0].createReader();
	const continuousJ1 = continuous.pureScatteringDensityByOrder[0].createReader();
	const shellCumulative = shellHeld.cumulativeScatteringDensity.createReader();
	const continuousCumulative = continuous.cumulativeScatteringDensity.createReader();
	let maximumRatio = 0;

	for (let offset = 0; offset < shellCumulative.scalarCount; offset += 1) {
		const expectedDifference = shellJ1.readScalarAtOffset(offset) - continuousJ1.readScalarAtOffset(offset);
		const actualDifference =
			shellCumulative.readScalarAtOffset(offset) - continuousCumulative.readScalarAtOffset(offset);
		const residual = Math.abs(actualDifference - expectedDifference);
		const allowed = 1e-18 + 1e-12 * Math.abs(expectedDifference);
		maximumRatio = Math.max(maximumRatio, residual / allowed);
	}

	return maximumRatio;
}

/**
 * Called by this module to maximum field difference.
 * @param leftField - The left field value accepted by the operation.
 * @param rightField - The right field value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function maximumFieldDifference(leftField, rightField) {
	const left = leftField.createReader();
	const right = rightField.createReader();
	let maximum = 0;

	for (let offset = 0; offset < left.scalarCount; offset += 1) {
		maximum = Math.max(maximum, Math.abs(left.readScalarAtOffset(offset) - right.readScalarAtOffset(offset)));
	}

	return maximum;
}
