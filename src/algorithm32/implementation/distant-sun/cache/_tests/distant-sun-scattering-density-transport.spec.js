import {
	NATIVE_48_POSITION_DOMAIN_OWNER,
	REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
} from '../../../../sampling-domains/index.js';
import {ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY} from '../../../../atmospheric-transport/consts.js';
import {CpuDirectionalSpectralField} from '../../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
} from '../consts.js';
import {DistantSunCpuMultipleScatteringEvaluator} from '../DistantSunCpuMultipleScatteringEvaluator.js';

describe('distant-Sun stored scattering-density transport', /** Called by Jasmine to register the named test suite. */ () => {
	it('owns native coordinates, distant framing, W27 lookup, and the selected option', /** Called by Jasmine to exercise the named behavior. */ () => {
		const scatteringDensity = new CpuDirectionalSpectralField({
			id: 'diagnostic-distant-j2',
			provenanceIdentity: DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
			order: {kind: 'pure', value: 2},
			packing: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.scatteringDensityPacking,
		});
		scatteringDensity.seal();
		const path = [
			{
				pointIndex: 0,
				distanceAlongRay: {value: 0, units: 'meters'},
				intervalLengthFromPrevious: {value: 0, units: 'meters'},
				trapezoidWeight: 0.5,
				measure: {value: 0, units: 'meters'},
			},
		];
		const geometry = {
			expressPhysicalIncomingRadianceDirection: jasmine
				.createSpy('expressPhysicalIncomingRadianceDirection')
				.and.callFake(
					/**
					 * Called by the Jasmine spy to handle one callback invocation.
					 * @param cacheDirection - The cache direction value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (cacheDirection) => cacheDirection,
				),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay').and.callFake(
				/**
				 * Called by the Jasmine spy to handle one callback invocation. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
				 * @param coordinate - The coordinate value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (coordinate) => {
					if (coordinate.altitudeBinIndex !== 0 || coordinate.directionIndex !== 0) {
						return null;
					}

					return {
						ray: {
							origin: {coordinates: [0, 0, 0], units: 'meters'},
							direction: coordinate.incomingDirection,
						},
						startDistance: {value: 0, units: 'meters'},
						endDistance: {value: 0, units: 'meters'},
					};
				},
			),
			resolveAtmosphereCoordinate: jasmine
				.createSpy('resolveAtmosphereCoordinate')
				.and.returnValue({altitude: {value: 2, units: 'meters'}}),
			resolveScatteringCacheConstructionPositionStencil: jasmine
				.createSpy('resolveScatteringCacheConstructionPositionStencil')
				.and.returnValue({indices: [0], weights: [1]}),
			expressScatteringCacheDirection: jasmine
				.createSpy('expressScatteringCacheDirection')
				.and.returnValue([1, 0, 0]),
		};
		const atmosphere = {
			sampleMedium: jasmine.createSpy('sampleMedium').and.returnValue({extinction: Array(15).fill(0)}),
		};
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine
				.createSpy('buildEndpointTrapezoidPathIntegrationPoints')
				.and.returnValue(path),
			computeTrapezoidSegmentTransmittance: jasmine.createSpy('computeTrapezoidSegmentTransmittance'),
		};

		const evaluator = new DistantSunCpuMultipleScatteringEvaluator(
			/** @type {DistantSunCacheProviderSource} */ (/** @type {unknown} */ ({})),
			/** @type {DistantSunLightSourceConfig} */ (/** @type {unknown} */ ({directionToLight: [1, 0, 0]})),
			{
				/**
				 * Call this method to create pure radiance field.
				 * @param definition - The definition value accepted by the operation.
				 * @returns - The result produced by the operation.
				 */ createPureRadianceField(definition) {
					const domainSelection =
						definition.domainSelection ?? DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
					return new CpuDirectionalSpectralField({
						id: definition.id,
						provenanceIdentity: definition.provenanceIdentity ?? DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
						order: {kind: 'pure', value: definition.order},
						packing: domainSelection.radiancePacking,
					});
				},
			},
		);
		const radiance = evaluator.buildTransportedRadiance({
			scatteringDensity,
			geometry,
			atmosphere,
			calculator,
			scatteringOrder: 2,
			domainSelection: DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			transportIntervalCount: DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
			id: 'diagnostic-distant-transported-l2',
		});

		expect(radiance.isSealed).toBeTrue();
		expect(radiance.id).toBe('diagnostic-distant-transported-l2');
		expect(radiance.order).toEqual({kind: 'pure', value: 2});
		expect(radiance.provenanceIdentity).toBe(ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY);
		expect(geometry.expressPhysicalIncomingRadianceDirection).toHaveBeenCalledTimes(
			NATIVE_48_POSITION_DOMAIN_OWNER.count *
				REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount,
		);
		expect(geometry.resolveCacheBuildRay).toHaveBeenCalledTimes(
			NATIVE_48_POSITION_DOMAIN_OWNER.count *
				REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.directionCount,
		);
		const firstCoordinate = geometry.resolveCacheBuildRay.calls.first().args[0];
		expect(firstCoordinate).toEqual({
			coordinateKey: 'native-48-fibonacci-68:0:0',
			coordinates: [0, 0],
			altitudeBinIndex: 0,
			directionIndex: 0,
			altitude: NATIVE_48_POSITION_DOMAIN_OWNER.nodes[0].coordinate,
			incomingDirection: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER.unitVectors[0],
		});
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints).toHaveBeenCalledWith(
			jasmine.any(Object),
			DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
		);
		expect(geometry.resolveScatteringCacheConstructionPositionStencil).toHaveBeenCalledTimes(1);
		expect(geometry.expressScatteringCacheDirection).toHaveBeenCalledTimes(1);
		expect(calculator.computeTrapezoidSegmentTransmittance).not.toHaveBeenCalled();
		expect(
			radiance.createReader().readScalar({
				positionIndex: 0,
				directionIndex: 0,
				wavelengthIndex: 0,
			}),
		).toBe(0);
	});
});
