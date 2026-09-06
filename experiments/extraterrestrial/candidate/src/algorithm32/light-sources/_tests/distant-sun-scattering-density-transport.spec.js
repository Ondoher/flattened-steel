import {
	FIBONACCI_34_DIRECTION_DOMAIN,
	NATIVE_48_POSITION_DOMAIN,
} from '../../domains/index.js';
import {
	ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY,
} from '../../transport/consts.js';
import { createDistantSunCpuPureScatteringDensityField } from '../DistantSunCpuFields.js';
import {
	buildDistantSunCpuTransportedRadiance,
} from '../distant-sun-scattering-density-transport.js';
import {
	DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
} from '../consts.js';

describe('distant-Sun stored scattering-density transport', () => {
	it('owns native coordinates, distant framing, W27 lookup, and the selected control', () => {
		const scatteringDensity = createDistantSunCpuPureScatteringDensityField({
			id: 'diagnostic-distant-j2',
			order: 2,
		});
		scatteringDensity.seal();
		const path = [{
			pointIndex: 0,
			distanceAlongRay: { value: 0, units: 'meters' },
			intervalLengthFromPrevious: { value: 0, units: 'meters' },
			trapezoidWeight: 0.5,
			measure: { value: 0, units: 'meters' },
		}];
		const geometry = {
			expressPhysicalIncomingRadianceDirection: jasmine.createSpy(
				'expressPhysicalIncomingRadianceDirection',
			).and.callFake((cacheDirection) => cacheDirection),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay')
				.and.callFake((coordinate) => {
					if (coordinate.altitudeBinIndex !== 0 || coordinate.directionIndex !== 0) {
						return null;
					}

					return {
						ray: {
							origin: { coordinates: [0, 0, 0], units: 'meters' },
							direction: coordinate.incomingDirection,
						},
						startDistance: { value: 0, units: 'meters' },
						endDistance: { value: 0, units: 'meters' },
					};
				}),
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate')
				.and.returnValue({ altitude: { value: 2, units: 'meters' } }),
			resolveScatteringCacheConstructionPositionStencil: jasmine.createSpy(
				'resolveScatteringCacheConstructionPositionStencil',
			).and.returnValue({ indices: [0], weights: [1] }),
			expressScatteringCacheDirection: jasmine.createSpy(
				'expressScatteringCacheDirection',
			).and.returnValue([1, 0, 0]),
		};
		const atmosphere = {
			sampleMedium: jasmine.createSpy('sampleMedium')
				.and.returnValue({ extinction: Array(15).fill(0) }),
		};
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine.createSpy(
				'buildEndpointTrapezoidPathIntegrationPoints',
			).and.returnValue(path),
			computeTrapezoidSegmentTransmittance: jasmine.createSpy(
				'computeTrapezoidSegmentTransmittance',
			),
		};

		const radiance = buildDistantSunCpuTransportedRadiance({
			scatteringDensity,
			geometry,
			atmosphere,
			calculator,
			scatteringOrder: 2,
			transportIntervalCount:
				DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
			id: 'diagnostic-distant-transported-l2',
		});

		expect(radiance.isSealed).toBeTrue();
		expect(radiance.descriptor.id).toBe('diagnostic-distant-transported-l2');
		expect(radiance.descriptor.order).toEqual({ kind: 'pure', value: 2 });
		expect(radiance.descriptor.provenanceIdentity)
			.toBe(ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY);
		expect(radiance.descriptor.directionDomain.contentHash)
			.toBe(FIBONACCI_34_DIRECTION_DOMAIN.contentHash);
		expect(geometry.expressPhysicalIncomingRadianceDirection)
			.toHaveBeenCalledTimes(
				NATIVE_48_POSITION_DOMAIN.count * FIBONACCI_34_DIRECTION_DOMAIN.count,
			);
		expect(geometry.resolveCacheBuildRay).toHaveBeenCalledTimes(
			NATIVE_48_POSITION_DOMAIN.count * FIBONACCI_34_DIRECTION_DOMAIN.count,
		);
		const firstCoordinate = geometry.resolveCacheBuildRay.calls.first().args[0];
		expect(firstCoordinate).toEqual({
			coordinateKey: 'native-48-fibonacci-34:0:0',
			coordinates: [0, 0],
			altitudeBinIndex: 0,
			directionIndex: 0,
			altitude: NATIVE_48_POSITION_DOMAIN.nodes[0].coordinate,
			incomingDirection: FIBONACCI_34_DIRECTION_DOMAIN.unitVectors[0],
		});
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints)
			.toHaveBeenCalledWith(
				jasmine.any(Object),
				DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
			);
		expect(geometry.resolveScatteringCacheConstructionPositionStencil)
			.toHaveBeenCalledTimes(1);
		expect(geometry.expressScatteringCacheDirection).toHaveBeenCalledTimes(1);
		expect(calculator.computeTrapezoidSegmentTransmittance).not.toHaveBeenCalled();
		expect(radiance.createReader().readScalar({
			positionIndex: 0,
			directionIndex: 0,
			wavelengthIndex: 0,
		})).toBe(0);
	});
});
