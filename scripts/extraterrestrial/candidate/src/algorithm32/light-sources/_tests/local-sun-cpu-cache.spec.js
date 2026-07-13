import { CanonicalAtmosphere } from
	'../../atmospheres/CanonicalAtmosphere.js';
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from '../../constants/Algorithm32CanonicalData.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
} from '../../domains/consts.js';
import { FlatEarthGeometry } from
	'../../geometries/FlatEarthGeometry.js';
import {
	UniformLambertianGroundBoundary,
} from '../../ground-boundaries/index.js';
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	NATIVE_SOURCE_IRRADIANCE_DENSITY,
	createNativeProductionProfile,
} from '../../profiles/native-15-profile.js';
import {
	SpectralCalculator,
} from '../../implementation/SpectralCalculator.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../../quantities/index.js';
import LocalSunConstructionDomainSelection from
	'../LocalSunConstructionDomainSelection.js';
import LocalSunConstructionLightSource from
	'../LocalSunConstructionLightSource.js';
import LocalSunCpuCache from '../LocalSunCpuCache.js';
import { LocalSunLightSource } from '../LocalSunLightSource.js';
import {
	createLocalSunShellFactCache,
} from '../create-local-sun-shell-fact-cache.js';
import {
	buildLocalSunCpuCache,
} from '../local-sun-cpu-cache-build.js';
import {
	createLocalSunLaterOrderScatteringKernel,
} from '../local-sun-later-order-scattering-density.js';
import {
	LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
	LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
} from '../local-sun-consts.js';
import {
	buildLocalSunCpuTransportedRadiance,
} from '../local-sun-scattering-density-transport.js';

describe('local-Sun binary64 scattering cache', () => {
	it('builds distinct N1, N2, and N4 pure graphs through stored-field transport', () => {
		const fixture = createFixture();
		const n1 = build(fixture, 1);
		const n2 = build(fixture, 2);
		const n4 = build(fixture, 4);

		expect(fixture.domainSelection.spectralBasis)
			.toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(fixture.domainSelection.spectralChannelCount)
			.toBe(15);
		expect(n1.pureScatteringDensityByOrder.length).toBe(1);
		expect(n1.pureRadianceByOrder.length).toBe(0);
		expect(n2.pureScatteringDensityByOrder.length).toBe(2);
		expect(n2.pureRadianceByOrder.length).toBe(1);
		expect(n4.pureScatteringDensityByOrder.length).toBe(4);
		expect(n4.pureRadianceByOrder.length).toBe(3);

		expect(n2.pureRadianceByOrder[0].descriptor.order).toEqual({
			kind: 'pure',
			value: 1,
		});
		expect(n4.pureRadianceByOrder[1].descriptor.order.value).toBe(2);
		expect(n4.pureRadianceByOrder[2].descriptor.order.value).toBe(3);
		expect(n4.descriptor.controls.transportIntervalCount).toBe(15);
		expect(n4.descriptor.controls.maximumScatteringOrder).toBe(4);

		const fields = n4.pureScatteringDensityByOrder;
		const cumulative = n4.cumulativeScatteringDensity.createReader();
		const readers = fields.map((field) => field.createReader());
		for (const coordinates of fixture.probes) {
			const expected = readers.reduce(
				(sum, reader) => sum + reader.readScalar(coordinates),
				0,
			);
			expect(cumulative.readScalar(coordinates)).toBe(expected);
			expect(Number.isFinite(expected)).toBeTrue();
			expect(expected).toBeGreaterThanOrEqual(0);
		}

		const n2J1 = n2.pureScatteringDensityByOrder[0].createReader();
		const n4J1 = n4.pureScatteringDensityByOrder[0].createReader();
		const n2L1 = n2.pureRadianceByOrder[0].createReader();
		const n4L1 = n4.pureRadianceByOrder[0].createReader();
		for (const coordinates of fixture.probes) {
			expect(n2J1.readScalar(coordinates))
				.toBe(n4J1.readScalar(coordinates));
		}
		for (const coordinates of fixture.radianceProbes) {
			expect(n2L1.readScalar(coordinates))
				.toBe(n4L1.readScalar(coordinates));
		}
	});

	it('uses the source-owned source-path interval count in CPU output', () => {
		const fourIntervalFixture = createFixture({
			sourceTransmittanceIntervalCount: 4,
		});
		const eightIntervalFixture = createFixture({
			sourceTransmittanceIntervalCount: 8,
		});
		const repeatedEightIntervalFixture = createFixture({
			sourceTransmittanceIntervalCount: 8,
		});
		const fourIntervals =
			build(fourIntervalFixture, 1)
				.pureScatteringDensityByOrder[0];
		const eightIntervals =
			build(eightIntervalFixture, 1)
				.pureScatteringDensityByOrder[0];
		const repeatedEightIntervals =
			build(repeatedEightIntervalFixture, 1)
				.pureScatteringDensityByOrder[0];

		expect(
			maximumFieldDifference(
				fourIntervals,
				eightIntervals,
			),
		).toBeGreaterThan(0);
		expect(
			maximumFieldDifference(
				eightIntervals,
				repeatedEightIntervals,
			),
		).toBe(0);
	});

	it('isolates shell-held amplitude to J1 and its cumulative contribution', () => {
		const fixture = createFixture();
		const shellHeld = build(fixture, 4);
		const continuousJ1 =
			buildContinuousJ1Control(fixture);

		expect(maximumFieldDifference(
			continuousJ1.pureScatteringDensityByOrder[0],
			shellHeld.pureScatteringDensityByOrder[0],
		)).toBeGreaterThan(0);
		for (let orderIndex = 1; orderIndex < 4; orderIndex += 1) {
			expect(maximumFieldDifference(
				continuousJ1.pureScatteringDensityByOrder[
					orderIndex
				],
				shellHeld.pureScatteringDensityByOrder[
					orderIndex
				],
			)).toBe(0);
		}
		for (let orderIndex = 0; orderIndex < 3; orderIndex += 1) {
			expect(maximumFieldDifference(
				continuousJ1.pureRadianceByOrder[orderIndex],
				shellHeld.pureRadianceByOrder[orderIndex],
			)).toBe(0);
		}
		expect(maximumCumulativeIsolationRatio(
			shellHeld,
			continuousJ1,
		)).toBeLessThanOrEqual(1);
		expect(
			fixture.lightSource.sampleDirectLighting({
				sourceRelativePosition:
					fixture.geometry
						.resolveSourceRelativePosition({
							position: {
								coordinates: [0, 0, 5],
								units: 'meters',
							},
						}),
			}).metadata,
		).not.toEqual(jasmine.objectContaining({
			constructionLightKind:
				'shell-held-arithmetic-mean',
		}));
	});

	it('rejects a local source whose owned position differs from geometry', () => {
		const fixture = createFixture();
		const mismatchedSource = new LocalSunLightSource({
			sourceKey: 'mismatched-local-sun-cpu-test',
			position: {
				coordinates: [4799999, 0, 4800000],
				units: 'meters',
			},
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			referenceDistance: { value: 4800000, units: 'meters' },
			referenceSpectralIncidentScale: 1,
			radius: { value: 25749.504, units: 'meters' },
			distanceFalloff: true,
			sourceTransmittanceIntervalCount: 4,
		});

		expect(() => mismatchedSource.buildCpuScatteringCache({
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
			constructionIdentities: fixture.constructionIdentities,
			maximumScatteringOrder: 1,
		})).toThrowError(/source-owned position exactly/u);
	});

	it('builds N1 through the public source and samples the stored cumulative field exactly', () => {
		const fixture = createFixture();
		const result = fixture.lightSource.buildCpuScatteringCache({
			atmosphere: fixture.atmosphere,
			geometry: fixture.geometry,
			profile: DEFAULT_NATIVE_PRODUCTION_PROFILE,
			constructionIdentities: fixture.constructionIdentities,
			maximumScatteringOrder: 1,
			sourceTransmittanceIntervalCount:
				fixture.sourceTransmittanceIntervalCount,
		});
		const cache = new LocalSunCpuCache(result);
		const packet = cache.sampleResolved({
			positionStencil: { indices: [0], weights: [1] },
			directionStencil: { indices: [0], weights: [1] },
		});
		const cumulative = result.cumulativeScatteringDensity
			.createReader();

		expect(result.maximumScatteringOrder).toBe(1);
		expect(result.pureScatteringDensityByOrder.length).toBe(1);
		expect(result.pureRadianceByOrder).toEqual([]);
		packet.values.forEach((value, wavelengthIndex) => {
			expect(value).toBe(cumulative.readScalar({
				positionIndex: 0,
				directionIndex: 0,
				wavelengthIndex,
			}));
		});

		cache.dispose();
	});

	it('samples the local concrete CPU cache with four-position and four-direction stencils', () => {
		const fixture = createFixture();
		const result = build(fixture, 1);
		const cache = new LocalSunCpuCache(result);
		const position = {
			coordinates: [2400000, 0, 50000],
			units: 'meters',
		};
		const atmosphereCoordinate =
			fixture.geometry.resolveAtmosphereCoordinate(position);
		const physicalOutgoingDirection = [
			0.2672612419124244,
			0.5345224838248488,
			0.8017837257372732,
		];
		const positionStencil =
			fixture.geometry.resolveScatteringCachePositionStencil({
				position,
				atmosphereCoordinate,
			});
		const directionStencil =
			fixture.domainSelection.resolveOutgoingDirectionStencil(
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
		expect(packet.values.every((value) => value >= 0)).toBeTrue();

		cache.dispose();
		expect(() => cache.sampleResolved({
			positionStencil: { indices: [0], weights: [1] },
			directionStencil: { indices: [0], weights: [1] },
		})).toThrowError(/disposed/u);
	});

	it('carries direct and pure-order ground illumination through J2, J3, and J4', () => {
		const fixture = createFixture();
		const black = build(fixture, 4);
		const albedo = createSpectralPacket({
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
			basis: NATIVE_15_SPECTRAL_BASIS,
			values: Array(15).fill(0.25),
			provenanceIdentity:
				'local-sun-cpu-test:ground-albedo',
		});
		const profile = createNativeProductionProfile({
			id: 'local-sun-cpu-reflective-profile',
			albedo,
		});
		const groundBoundary =
			new UniformLambertianGroundBoundary({ albedo });
		const reflective =
			buildFixtureRecurrence(fixture, {
				maximumScatteringOrder: 4,
				profile,
				groundBoundary,
			});

		const maximumDifferences =
			reflective.pureScatteringDensityByOrder.map(
				(field, orderIndex) => maximumFieldDifference(
					field,
					black.pureScatteringDensityByOrder[
						orderIndex
					],
				),
			);

		expect(maximumDifferences[0]).toBe(0);
		expect(maximumDifferences[1]).toBeGreaterThan(0);
		expect(maximumDifferences[2]).toBeGreaterThan(0);
		expect(maximumDifferences[3]).toBeGreaterThan(0);
	});
});

function build(fixture, maximumScatteringOrder) {
	return buildFixtureRecurrence(fixture, {
		maximumScatteringOrder,
		primaryLightSource:
			fixture.constructionLightSource,
	});
}

/**
 * Build the same recurrence while changing only the J1 light adapter from
 * shell-held to the finite source's continuous sample.
 *
 * @param {ReturnType<typeof createFixture>} fixture - Supplies fixed owners.
 * @returns {LocalSunCpuCacheResult} The continuous-J1 isolation control.
 */
function buildContinuousJ1Control(fixture) {
	return buildFixtureRecurrence(fixture, {
		maximumScatteringOrder: 4,
		primaryLightSource: fixture.lightSource,
	});
}

/**
 * Execute the internal bounded-domain CPU comparison seam.
 *
 * @param {ReturnType<typeof createFixture>} fixture - Supplies fixed owners.
 * @param {Readonly<{
 *   maximumScatteringOrder: SupportedCacheScatteringOrder,
 *   primaryLightSource?: LightSourceModel,
 *   profile?: NativeProductionProfile,
 *   groundBoundary?: GroundBoundary | null,
 * }>} request - Supplies the isolated recurrence choice.
 * @returns {LocalSunCpuCacheResult} The completed bounded result.
 */
function buildFixtureRecurrence(fixture, request) {
	const calculator = new SpectralCalculator({
		geometry: fixture.geometry,
		atmosphere: fixture.atmosphere,
		lightSource: fixture.lightSource,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		executionControls: {
			pathIntervalCount:
				LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
			sourceTransmittanceIntervalCount:
				fixture.sourceTransmittanceIntervalCount,
		},
	});

	return buildLocalSunCpuCache({
		atmosphere: fixture.atmosphere,
		geometry: fixture.geometry,
		lightSource:
			request.primaryLightSource
			?? fixture.constructionLightSource,
		profile:
			request.profile
			?? DEFAULT_NATIVE_PRODUCTION_PROFILE,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		calculator,
		sourceTransmittanceIntervalCount:
			fixture.sourceTransmittanceIntervalCount,
		constructionIdentities:
			fixture.constructionIdentities,
		domainSelection: fixture.domainSelection,
		groundBoundary: request.groundBoundary ?? null,
		maximumScatteringOrder:
			request.maximumScatteringOrder,
		operations: {
			createScatteringKernel: ({
				scatteringOrder,
				groundIlluminationRadiance,
			}) => createLocalSunLaterOrderScatteringKernel({
				geometry: fixture.geometry,
				atmosphere: fixture.atmosphere,
				calculator,
				domainSelection: fixture.domainSelection,
				scatteringOrder,
				groundIlluminationRadiance,
				groundBoundary:
					request.groundBoundary ?? null,
				lightSource: fixture.lightSource,
				sourceTransmittanceIntervalCount:
					fixture.sourceTransmittanceIntervalCount,
			}),
			buildTransportedRadiance: ({
				scatteringDensity,
				scatteringOrder,
				id,
			}) => buildLocalSunCpuTransportedRadiance({
				scatteringDensity,
				scatteringOrder,
				geometry: fixture.geometry,
				atmosphere: fixture.atmosphere,
				calculator,
				domainSelection: fixture.domainSelection,
				pathIntervalCount:
					LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
				id,
			}),
			scatteringProvenanceIdentity:
				LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY,
		},
	});
}

function createFixture({
	sourceTransmittanceIntervalCount = 4,
} = {}) {
	const sourcePosition = {
		coordinates: [4800000, 0, 4800000],
		units: 'meters',
	};
	const geometry = new FlatEarthGeometry({
		observerPosition: {
			coordinates: [0, 0, 5],
			units: 'meters',
		},
		sourcePosition,
		topAltitude: { value: 100000, units: 'meters' },
		cacheRadialMaximum: { value: 4800000, units: 'meters' },
		cacheAltitudeNodes: [
			{ value: 0, units: 'meters' },
			{ value: 100000, units: 'meters' },
		],
		cacheRadialNodes: [
			{ value: 0, units: 'meters' },
			{ value: 4800000, units: 'meters' },
		],
	});
	const atmosphere = new CanonicalAtmosphere({
		constants: CANONICAL_ATMOSPHERE_CONSTANTS,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const lightSource = new LocalSunLightSource({
		sourceKey: 'local-sun-cpu-test',
		position: sourcePosition,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		referenceDistance: { value: 4800000, units: 'meters' },
		referenceSpectralIncidentScale: 1,
		radius: { value: 25749.504, units: 'meters' },
		distanceFalloff: true,
		sourceTransmittanceIntervalCount,
	});
	const constructionLightSource =
		new LocalSunConstructionLightSource({
			source: lightSource,
			shellFactCache:
				createLocalSunShellFactCache({
					sourceConfiguration:
						lightSource.configuration,
				}),
		});
	const positionDomainOwner =
		geometry.createLocalSunCachePositionDomain();
	const domainSelection =
		new LocalSunConstructionDomainSelection({
		id: 'local-sun-cpu-test-z2-rho2-paired-fibonacci34-w3',
		positionDomainOwner,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			radiancePackingId:
				'local-sun-cpu-test-radiance-packing',
			scatteringDensityPackingId:
				'local-sun-cpu-test-density-packing',
		});
	const constructionIdentities = {
		source: {
			id: lightSource.id,
			contentHash: 'local-sun-cpu-test-source',
		},
		atmosphere: {
			id: atmosphere.id,
			contentHash: 'local-sun-cpu-test-atmosphere',
		},
		geometry: {
			id: geometry.id,
			contentHash: 'local-sun-cpu-test-geometry',
		},
	};

	return {
		atmosphere,
		geometry,
		lightSource,
		constructionLightSource,
		sourceTransmittanceIntervalCount,
		domainSelection,
		constructionIdentities,
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
}

/**
 * Measure the cumulative-delta identity under its predeclared binary64 bound.
 *
 * @param {LocalSunCpuCacheResult} shellHeld - Supplies the selected build.
 * @param {LocalSunCpuCacheResult} continuous - Supplies the isolation control.
 * @returns {number} Maximum residual divided by its allowed error.
 */
function maximumCumulativeIsolationRatio(shellHeld, continuous) {
	const shellJ1 =
		shellHeld.pureScatteringDensityByOrder[0].createReader();
	const continuousJ1 =
		continuous.pureScatteringDensityByOrder[0].createReader();
	const shellCumulative =
		shellHeld.cumulativeScatteringDensity.createReader();
	const continuousCumulative =
		continuous.cumulativeScatteringDensity.createReader();
	let maximumRatio = 0;

	for (let offset = 0;
		offset < shellCumulative.scalarCount;
		offset += 1) {
		const expectedDifference =
			shellJ1.readScalarAtOffset(offset)
			- continuousJ1.readScalarAtOffset(offset);
		const actualDifference =
			shellCumulative.readScalarAtOffset(offset)
			- continuousCumulative.readScalarAtOffset(offset);
		const residual =
			Math.abs(actualDifference - expectedDifference);
		const allowed =
			1e-18 + 1e-12 * Math.abs(expectedDifference);
		maximumRatio = Math.max(
			maximumRatio,
			residual / allowed,
		);
	}

	return maximumRatio;
}

function maximumFieldDifference(leftField, rightField) {
	const left = leftField.createReader();
	const right = rightField.createReader();
	let maximum = 0;

	for (let offset = 0; offset < left.scalarCount; offset += 1) {
		maximum = Math.max(
			maximum,
			Math.abs(
				left.readScalarAtOffset(offset)
				- right.readScalarAtOffset(offset),
			),
		);
	}

	return maximum;
}
