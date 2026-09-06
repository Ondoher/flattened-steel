import { CpuDirectionalSpectralField } from '../../caches/CpuDirectionalSpectralField.js';
import {
	DIRECTION_DOMAIN_ROLES,
	DIRECTIONAL_FIELD_QUANTITIES,
	DIRECTIONAL_FIELD_UNITS,
	createDirectionalSpectralFieldDescriptor,
} from '../../caches/DirectionalSpectralFieldDescriptor.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	createCubedSphereW27DirectionStencil,
} from '../../domains/CubedSphereW27DirectionDomain.js';
import { DirectionDomainDescriptor } from '../../domains/DirectionDomainDescriptor.js';
import { PositionDomainDescriptor } from '../../domains/PositionDomainDescriptor.js';
import { DistantSunFieldPacking } from
	'../../light-sources/DistantSunFieldPacking.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralBasis,
	createSpectralPacket,
} from '../../quantities/index.js';
import {
	transportPureScatteringDensity,
} from '../scattering-density-transport.js';
import {
	ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY,
} from '../consts.js';

describe('pure scattering-density transport', () => {
	it('ports Star tap and path accumulation through source-owned construction policies', () => {
		const context = createContext();
		const scatteringDensity = createField(context, {
			id: 'synthetic-j2',
			kind: 'scattering',
			order: 2,
		});
		const outputRadiance = createField(context, {
			id: 'synthetic-l2',
			kind: 'radiance',
			order: 2,
		});
		const cacheDirection = normalized([1, 0.2, -0.3]);
		const expectedDirectionStencil = createCubedSphereW27DirectionStencil(
			cacheDirection,
		);
		const channelValues = [
			[10, 20, 30, 40],
			[3, 6, 9, 12],
		];
		const scatteringWriter = scatteringDensity.createWriter();

		expectedDirectionStencil.indices.forEach((directionIndex, tapIndex) => {
			channelValues.forEach((values, wavelengthIndex) => {
				scatteringWriter.writeScalar({
					directionIndex,
					positionIndex: 0,
					wavelengthIndex,
				}, values[tapIndex]);
			});
		});
		scatteringDensity.seal();
		outputRadiance.createWriter().fill(99);

		const physicalDirection = /** @type {const} */ ([0, 1, 0]);
		const raySegment = {
			ray: {
				origin: { coordinates: [0, 0, 0], units: 'meters' },
				direction: physicalDirection,
			},
			startDistance: { value: 0, units: 'meters' },
			endDistance: { value: 2, units: 'meters' },
		};
		const path = [
			pathPoint(0, 0, 0, 1),
			pathPoint(1, 2, 2, 1),
		];
		const viewPositionLookup = jasmine.createSpy('resolveScatteringCachePositionStencil');
		const constructionPositionLookup = jasmine.createSpy(
			'resolveScatteringCacheConstructionPositionStencil',
		).and.returnValue({ indices: [0], weights: [1] });
		const directionStencils = [];
		const resolveDirectionStencil = jasmine.createSpy(
			'resolveDirectionStencil',
		).and.callFake((direction) => {
			const stencil = createCubedSphereW27DirectionStencil(direction);
			directionStencils.push(stencil);
			return stencil;
		});
		const resolveBuildCoordinate = jasmine.createSpy(
			'resolveBuildCoordinate',
		).and.callFake((request) => ({
			coordinateKey: `synthetic:${request.positionIndex}:${request.directionIndex}`,
			coordinates: [request.positionIndex, request.directionIndex],
			altitudeBinIndex: request.positionIndex,
			directionIndex: request.directionIndex,
			altitude: request.positionNode.coordinate,
			incomingDirection: request.incomingDirection,
		}));
		const geometry = {
			expressPhysicalScatteringCacheDirection: jasmine.createSpy(
				'expressPhysicalScatteringCacheDirection',
			).and.returnValue(physicalDirection),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay')
				.and.returnValue(raySegment),
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate')
				.and.callFake((position) => ({
					altitude: { value: position.coordinates[1], units: 'meters' },
				})),
			resolveScatteringCachePositionStencil: viewPositionLookup,
			expressScatteringCacheDirection: jasmine.createSpy(
				'expressScatteringCacheDirection',
			).and.returnValue(cacheDirection),
		};
		const resolvePhysicalRadianceDirection = jasmine.createSpy(
			'resolvePhysicalRadianceDirection',
		).and.callFake((request) => geometry.expressPhysicalScatteringCacheDirection({
			cacheDirection: request.cacheDirection,
		}));
		const medium = createMediumSample(context.basis, [0, 0]);
		const segmentTransmittance = /** @type {SpectralTransmittancePacket} */ (
			createSpectralPacket({
				basis: context.basis,
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: [0.25, 0.5],
				provenanceIdentity: 'synthetic-transport-segment-transmittance',
			})
		);
		const atmosphere = {
			sampleMedium: jasmine.createSpy('sampleMedium')
				.and.returnValue(medium),
		};
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine.createSpy(
				'buildEndpointTrapezoidPathIntegrationPoints',
			).and.returnValue(path),
			computeTrapezoidSegmentTransmittance: jasmine.createSpy(
				'computeTrapezoidSegmentTransmittance',
			).and.returnValue(segmentTransmittance),
		};
		const onProgress = jasmine.createSpy('onProgress');

		expect(transportPureScatteringDensity({
			scatteringDensity,
			outputRadiance,
			geometry,
			atmosphere,
			calculator,
			scatteringOrder: 2,
			positionNodes: context.positionNodes,
			positionCount: context.positionCount,
			radianceUnitVectors: context.radianceUnitVectors,
			radianceDirectionCount: context.radianceDirectionCount,
			spectralChannelCount: context.spectralChannelCount,
			resolvePositionStencil: constructionPositionLookup,
			resolveDirectionStencil,
			resolveBuildCoordinate,
			resolvePhysicalRadianceDirection,
			pathIntervalCount: 15,
			onProgress,
		})).toBe(outputRadiance);

		const sampledDensity = channelValues.map((values) => {
			let sum = 0;
			for (let tapIndex = 0; tapIndex < values.length; tapIndex += 1) {
				sum += values[tapIndex] * expectedDirectionStencil.weights[tapIndex];
			}
			return sum;
		});
		const expectedRadiance = sampledDensity.map((density, wavelengthIndex) => {
			let radiance = density;
			radiance += segmentTransmittance.values[wavelengthIndex] * density;
			return radiance;
		});

		expect(outputRadiance.isSealed).toBeTrue();
		expect(readSpectrum(outputRadiance)).toEqual(expectedRadiance);
		expect(expectedDirectionStencil.indices).toEqual([258, 259, 285, 286]);
		expect(directionStencils).toEqual([
			expectedDirectionStencil,
			expectedDirectionStencil,
		]);
		expect(resolveBuildCoordinate).toHaveBeenCalledTimes(1);
		expect(resolvePhysicalRadianceDirection).toHaveBeenCalledTimes(1);
		expect(geometry.expressPhysicalScatteringCacheDirection)
			.toHaveBeenCalledTimes(1);
		expect(geometry.resolveCacheBuildRay).toHaveBeenCalledTimes(1);
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints)
			.toHaveBeenCalledWith(raySegment, 15);
		expect(constructionPositionLookup).toHaveBeenCalledTimes(2);
		expect(constructionPositionLookup.calls.argsFor(0)[0].atmosphereCoordinate)
			.toEqual({ altitude: { value: 0, units: 'meters' } });
		expect(constructionPositionLookup.calls.argsFor(1)[0].atmosphereCoordinate)
			.toEqual({ altitude: { value: 2, units: 'meters' } });
		expect(viewPositionLookup).not.toHaveBeenCalled();
		expect(resolveDirectionStencil).toHaveBeenCalledTimes(2);
		expect(calculator.computeTrapezoidSegmentTransmittance)
			.toHaveBeenCalledOnceWith(
				medium.extinction,
				medium.extinction,
				path[1].intervalLengthFromPrevious,
			);
		expect(onProgress).toHaveBeenCalledOnceWith({
			phase: 'transport',
			order: 2,
			completed: 1,
			total: 1,
		});
	});

	it('accepts pure J1 only as an invokable diagnostic and leaves blocked rays zero', () => {
		const context = createContext();
		const scatteringDensity = createField(context, {
			id: 'diagnostic-j1',
			kind: 'scattering',
			order: 1,
		});
		const outputRadiance = createField(context, {
			id: 'diagnostic-l1',
			kind: 'radiance',
			order: 1,
		});
		scatteringDensity.seal();
		const collaborators = createBlockedRayCollaborators(context, 1);

		expect(() => transportPureScatteringDensity({
			scatteringDensity,
			outputRadiance,
			...collaborators,
		})).not.toThrow();
		expect(outputRadiance.descriptor.order).toEqual({ kind: 'pure', value: 1 });
		expect(outputRadiance.descriptor.provenanceIdentity)
			.toBe(ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY);
		expect(outputRadiance.isSealed).toBeTrue();
		expect(readSpectrum(outputRadiance)).toEqual([0, 0]);
		expect(collaborators.calculator.buildEndpointTrapezoidPathIntegrationPoints)
			.not.toHaveBeenCalled();
		expect(collaborators.resolveDirectionStencil).not.toHaveBeenCalled();
	});

	it('keeps independently attributed descriptors as reporting metadata', () => {
		const context = createContext();
		const scatteringDensity = createField(context, {
			id: 'provenance-j2',
			kind: 'scattering',
			order: 2,
		});
		const outputRadiance = createField(context, {
			id: 'provenance-l2',
			kind: 'radiance',
			order: 2,
			provenanceIdentity: 'independently-reproduced-from-description',
		});
		scatteringDensity.seal();
		expect(() => transportPureScatteringDensity({
			scatteringDensity,
			outputRadiance,
			...createBlockedRayCollaborators(context, 2),
		})).not.toThrow();
		expect(outputRadiance.descriptor.provenanceIdentity)
			.toBe('independently-reproduced-from-description');
		expect(outputRadiance.isSealed).toBeTrue();
		expect(readSpectrum(outputRadiance)).toEqual([0, 0]);
	});
});

function createBlockedRayCollaborators(context, scatteringOrder) {
	return {
		geometry: {
			expressPhysicalScatteringCacheDirection: jasmine.createSpy(
				'expressPhysicalScatteringCacheDirection',
			).and.returnValue([1, 0, 0]),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay')
				.and.returnValue(null),
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate'),
			expressScatteringCacheDirection: jasmine.createSpy(
				'expressScatteringCacheDirection',
			),
		},
		atmosphere: {
			sampleMedium: jasmine.createSpy('sampleMedium'),
		},
		calculator: {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine.createSpy(
				'buildEndpointTrapezoidPathIntegrationPoints',
			),
			computeTrapezoidSegmentTransmittance: jasmine.createSpy(
				'computeTrapezoidSegmentTransmittance',
			),
		},
		scatteringOrder,
		positionNodes: context.positionNodes,
		positionCount: context.positionCount,
		radianceUnitVectors: context.radianceUnitVectors,
		radianceDirectionCount: context.radianceDirectionCount,
		spectralChannelCount: context.spectralChannelCount,
		resolvePositionStencil: jasmine.createSpy('resolvePositionStencil'),
		resolveDirectionStencil: jasmine.createSpy('resolveDirectionStencil'),
		resolvePhysicalRadianceDirection: jasmine.createSpy(
			'resolvePhysicalRadianceDirection',
		).and.returnValue([1, 0, 0]),
		resolveBuildCoordinate: jasmine.createSpy('resolveBuildCoordinate')
			.and.callFake((request) => ({
				coordinateKey: 'blocked:0:0',
				coordinates: [request.positionIndex, request.directionIndex],
				altitude: request.positionNode.coordinate,
				incomingDirection: request.incomingDirection,
			})),
		pathIntervalCount: 15,
	};
}

function createContext() {
	const basis = createSpectralBasis({
		id: 'synthetic-transport-basis',
		channels: [
			{
				id: 'first',
				center: { value: 400, units: 'nanometers' },
				width: { value: 20, units: 'nanometers' },
			},
			{
				id: 'second',
				center: { value: 420, units: 'nanometers' },
				width: { value: 20, units: 'nanometers' },
			},
		],
	});
	const positionNodes = [{
		index: 0,
		coordinate: { value: 2, units: 'meters' },
		role: 'synthetic-position',
	}];
	const positionDomain = new PositionDomainDescriptor({
		id: 'synthetic-transport-position',
		schemaRevision: 'synthetic-transport-position-schema-v1',
		generatorRevision: 'synthetic-transport-position-generator-v1',
		mapping: { kind: 'synthetic-position-mapping' },
		frame: { kind: 'synthetic-position-frame' },
		interpolation: { kind: 'synthetic-view-only-interpolation' },
		precision: 'binary64',
		nodes: positionNodes,
	});
	const radianceUnitVectors =
		/** @type {readonly UnitVector3[]} */ ([[1, 0, 0]]);
	const radianceDirectionDomain = new DirectionDomainDescriptor({
		id: 'synthetic-transport-radiance-direction',
		schemaRevision: 'synthetic-transport-direction-schema-v1',
		generatorRevision: 'synthetic-transport-direction-generator-v1',
		frame: { kind: 'synthetic-source-frame' },
		topology: { kind: 'synthetic-radiance-node' },
		interpolation: { kind: 'exact-quadrature-node-only' },
		precision: 'binary64',
		unitVectors: radianceUnitVectors,
		integrationWeights: {
			values: [4 * Math.PI],
			units: 'steradians',
		},
	});
	const radiancePacking = new DistantSunFieldPacking({
		id: 'synthetic-transport-radiance-packing',
		directionCount: 1,
		positionCount: 1,
		wavelengthCount: 2,
	});
	const scatteringPacking = new DistantSunFieldPacking({
		id: 'synthetic-transport-scattering-packing',
		directionCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN.count,
		positionCount: 1,
		wavelengthCount: 2,
	});

	return {
		basis,
		positionNodes,
		positionCount: positionNodes.length,
		positionDomain,
		radianceUnitVectors,
		radianceDirectionCount: radianceUnitVectors.length,
		spectralChannelCount: basis.channelCount,
		radianceDirectionDomain,
		radiancePacking,
		scatteringPacking,
	};
}

/**
 * Create a complete typed medium sample for the transport collaboration seam.
 *
 * @param {SpectralBasis} basis - Supplies the ordered wavelength basis.
 * @param {readonly number[]} extinctionValues - Supplies total extinction values.
 * @returns {AtmosphereSample} The typed synthetic medium.
 */
function createMediumSample(basis, extinctionValues) {
	const zero = extinctionValues.map(() => 0);
	const packet = (
		quantity,
		units,
		values,
		provenanceIdentity,
	) => createSpectralPacket({
		basis,
		quantity,
		units,
		values,
		provenanceIdentity,
	});

	return {
		extinction: /** @type {SpectralExtinctionCoefficientPacket} */ (packet(
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			extinctionValues,
			'synthetic-transport-extinction',
		)),
		scattering: /** @type {SpectralScatteringCoefficientPacket} */ (packet(
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			zero,
			'synthetic-transport-scattering',
		)),
		rayleighScattering: /** @type {SpectralScatteringCoefficientPacket} */ (packet(
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			zero,
			'synthetic-transport-rayleigh-scattering',
		)),
		mieScattering: /** @type {SpectralScatteringCoefficientPacket} */ (packet(
			SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			zero,
			'synthetic-transport-mie-scattering',
		)),
		mieExtinction: /** @type {SpectralExtinctionCoefficientPacket} */ (packet(
			SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			zero,
			'synthetic-transport-mie-extinction',
		)),
		absorption: /** @type {SpectralAbsorptionCoefficientPacket} */ (packet(
			SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
			SPECTRAL_UNITS.INVERSE_LENGTH,
			zero,
			'synthetic-transport-absorption',
		)),
		density: {
			rayleigh: 0,
			mie: 0,
			absorption: 0,
		},
	};
}

function createField(
	context,
	{
		id,
		kind,
		order,
		provenanceIdentity = kind === 'radiance'
			? ALGORITHM32_STAR_TRANSPORT_PROVENANCE_IDENTITY
			: `synthetic:${id}`,
	},
) {
	const radiance = kind === 'radiance';
	const packing = radiance ? context.radiancePacking : context.scatteringPacking;
	const descriptor = createDirectionalSpectralFieldDescriptor({
		id,
		quantity: radiance
			? DIRECTIONAL_FIELD_QUANTITIES.RADIANCE_DENSITY
			: DIRECTIONAL_FIELD_QUANTITIES.SCATTERING_DENSITY,
		units: radiance
			? DIRECTIONAL_FIELD_UNITS.RADIANCE_DENSITY
			: DIRECTIONAL_FIELD_UNITS.SCATTERING_DENSITY,
		directionRole: radiance
			? DIRECTION_DOMAIN_ROLES.INCOMING_RADIANCE
			: DIRECTION_DOMAIN_ROLES.OUTGOING_SCATTERING_DENSITY,
		basis: context.basis,
		positionDomain: context.positionDomain,
		directionDomain: radiance
			? context.radianceDirectionDomain
			: CUBED_SPHERE_W27_DIRECTION_DOMAIN,
		precision: 'binary64',
		layout: packing.layout,
		order: { kind: 'pure', value: order },
		provenanceIdentity,
	});

	return new CpuDirectionalSpectralField({ descriptor, packing });
}

function pathPoint(pointIndex, distanceAlongRay, intervalLengthFromPrevious, measure) {
	return {
		pointIndex,
		distanceAlongRay: { value: distanceAlongRay, units: 'meters' },
		intervalLengthFromPrevious: {
			value: intervalLengthFromPrevious,
			units: 'meters',
		},
		trapezoidWeight: 1,
		measure: { value: measure, units: 'meters' },
	};
}

function normalized(vector) {
	const length = Math.hypot(...vector);
	return vector.map((value) => value / length);
}

function readSpectrum(field) {
	const reader = field.createReader();
	return [0, 1].map((wavelengthIndex) => reader.readScalar({
		directionIndex: 0,
		positionIndex: 0,
		wavelengthIndex,
	}));
}
