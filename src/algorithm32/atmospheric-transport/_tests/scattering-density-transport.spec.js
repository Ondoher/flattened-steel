import {CpuDirectionalSpectralField} from '../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../sampling-domains/direction/cubed-sphere/consts.js';
import {DistantSunFieldPacking} from '../../implementation/distant-sun/cache/DistantSunFieldPacking.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralBasis, SpectralPacket} from '../../spectral-values/index.js';
import {transportPureScatteringDensity} from '../scattering-density-transport.js';
import {ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY} from '../consts.js';

describe('pure scattering-density transport', /** Called by Jasmine to register the named test suite. */ () => {
	it('uses production tap and path accumulation through source-owned construction policies', /** Called by Jasmine to exercise the named behavior. */ () => {
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
		const expectedDirectionStencil = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(cacheDirection);
		const channelValues = [
			[10, 20, 30, 40],
			[3, 6, 9, 12],
		];
		const scatteringWriter = scatteringDensity.createWriter();

		expectedDirectionStencil.indices.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param directionIndex - The direction index value accepted by the operation.
			 * @param tapIndex - The tap index value accepted by the operation.
			 */ (directionIndex, tapIndex) => {
				channelValues.forEach(
					/**
					 * Called by Array.prototype.forEach to process one collection value.
					 * @param values - The values value accepted by the operation.
					 * @param wavelengthIndex - The wavelength index value accepted by the operation.
					 */ (values, wavelengthIndex) => {
						scatteringWriter.writeScalar(
							{
								directionIndex,
								positionIndex: 0,
								wavelengthIndex,
							},
							values[tapIndex],
						);
					},
				);
			},
		);
		scatteringDensity.seal();
		outputRadiance.createWriter().fill(99);

		const physicalDirection = /** @type {const} */ ([0, 1, 0]);
		const raySegment = {
			ray: {
				origin: {coordinates: [0, 0, 0], units: 'meters'},
				direction: physicalDirection,
			},
			startDistance: {value: 0, units: 'meters'},
			endDistance: {value: 2, units: 'meters'},
		};
		const path = [pathPoint(0, 0, 0, 1), pathPoint(1, 2, 2, 1)];
		const viewPositionLookup = jasmine.createSpy('resolveScatteringCachePositionStencil');
		const constructionPositionLookup = jasmine
			.createSpy('resolveScatteringCacheConstructionPositionStencil')
			.and.returnValue({indices: [0], weights: [1]});
		const directionStencils = [];
		const resolveDirectionStencil = jasmine.createSpy('resolveDirectionStencil').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param direction - The direction value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (direction) => {
				const stencil = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(direction);
				directionStencils.push(stencil);
				return stencil;
			},
		);
		const resolveBuildCoordinate = jasmine.createSpy('resolveBuildCoordinate').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param request - The request accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (request) => ({
				coordinateKey: `synthetic:${request.positionIndex}:${request.directionIndex}`,
				coordinates: [request.positionIndex, request.directionIndex],
				altitudeBinIndex: request.positionIndex,
				directionIndex: request.directionIndex,
				altitude: request.positionNode.coordinate,
				incomingDirection: request.incomingDirection,
			}),
		);
		const geometry = {
			expressPhysicalScatteringCacheDirection: jasmine
				.createSpy('expressPhysicalScatteringCacheDirection')
				.and.returnValue(physicalDirection),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay').and.returnValue(raySegment),
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate').and.callFake(
				/**
				 * Called by the Jasmine spy to handle one callback invocation.
				 * @param position - The position value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (position) => ({
					altitude: {value: position.coordinates[1], units: 'meters'},
				}),
			),
			resolveScatteringCachePositionStencil: viewPositionLookup,
			expressScatteringCacheDirection: jasmine
				.createSpy('expressScatteringCacheDirection')
				.and.returnValue(cacheDirection),
		};
		const resolvePhysicalRadianceDirection = jasmine.createSpy('resolvePhysicalRadianceDirection').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param request - The request accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (request) =>
				geometry.expressPhysicalScatteringCacheDirection({
					cacheDirection: request.cacheDirection,
				}),
		);
		const medium = createMediumSample(context.basis, [0, 0]);
		const segmentTransmittance = /** @type {SpectralTransmittancePacket} */ (
			new SpectralPacket({
				basis: context.basis,
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: [0.25, 0.5],
				provenanceIdentity: 'synthetic-transport-segment-transmittance',
			})
		);
		const atmosphere = {
			sampleMedium: jasmine.createSpy('sampleMedium').and.returnValue(medium),
		};
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine
				.createSpy('buildEndpointTrapezoidPathIntegrationPoints')
				.and.returnValue(path),
			computeTrapezoidSegmentTransmittance: jasmine
				.createSpy('computeTrapezoidSegmentTransmittance')
				.and.returnValue(segmentTransmittance),
		};
		const onProgress = jasmine.createSpy('onProgress');

		expect(
			transportPureScatteringDensity({
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
			}),
		).toBe(outputRadiance);

		const sampledDensity = channelValues.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param values - The values value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (values) => {
				let sum = 0;
				for (let tapIndex = 0; tapIndex < values.length; tapIndex += 1) {
					sum += values[tapIndex] * expectedDirectionStencil.weights[tapIndex];
				}
				return sum;
			},
		);
		const expectedRadiance = sampledDensity.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param density - The density value accepted by the operation.
			 * @param wavelengthIndex - The wavelength index value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (density, wavelengthIndex) => {
				let radiance = density;
				radiance += segmentTransmittance.values[wavelengthIndex] * density;
				return radiance;
			},
		);

		expect(outputRadiance.isSealed).toBeTrue();
		expect(readSpectrum(outputRadiance)).toEqual(expectedRadiance);
		expect(expectedDirectionStencil.indices).toEqual([258, 259, 285, 286]);
		expect(directionStencils).toEqual([expectedDirectionStencil, expectedDirectionStencil]);
		expect(resolveBuildCoordinate).toHaveBeenCalledTimes(1);
		expect(resolvePhysicalRadianceDirection).toHaveBeenCalledTimes(1);
		expect(geometry.expressPhysicalScatteringCacheDirection).toHaveBeenCalledTimes(1);
		expect(geometry.resolveCacheBuildRay).toHaveBeenCalledTimes(1);
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints).toHaveBeenCalledWith(raySegment, 15);
		expect(constructionPositionLookup).toHaveBeenCalledTimes(2);
		expect(constructionPositionLookup.calls.argsFor(0)[0].atmosphereCoordinate).toEqual({
			altitude: {value: 0, units: 'meters'},
		});
		expect(constructionPositionLookup.calls.argsFor(1)[0].atmosphereCoordinate).toEqual({
			altitude: {value: 2, units: 'meters'},
		});
		expect(viewPositionLookup).not.toHaveBeenCalled();
		expect(resolveDirectionStencil).toHaveBeenCalledTimes(2);
		expect(calculator.computeTrapezoidSegmentTransmittance).toHaveBeenCalledOnceWith(
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

	it('accepts pure J1 only as an invokable diagnostic and leaves blocked rays zero', /** Called by Jasmine to exercise the named behavior. */ () => {
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

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				transportPureScatteringDensity({
					scatteringDensity,
					outputRadiance,
					...collaborators,
				}),
		).not.toThrow();
		expect(outputRadiance.order).toEqual({kind: 'pure', value: 1});
		expect(outputRadiance.provenanceIdentity).toBe(ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY);
		expect(outputRadiance.isSealed).toBeTrue();
		expect(readSpectrum(outputRadiance)).toEqual([0, 0]);
		expect(collaborators.calculator.buildEndpointTrapezoidPathIntegrationPoints).not.toHaveBeenCalled();
		expect(collaborators.resolveDirectionStencil).not.toHaveBeenCalled();
	});

	it('keeps independently attributed physical provenance on the field', /** Called by Jasmine to exercise the named behavior. */ () => {
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
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				transportPureScatteringDensity({
					scatteringDensity,
					outputRadiance,
					...createBlockedRayCollaborators(context, 2),
				}),
		).not.toThrow();
		expect(outputRadiance.provenanceIdentity).toBe('independently-reproduced-from-description');
		expect(outputRadiance.isSealed).toBeTrue();
		expect(readSpectrum(outputRadiance)).toEqual([0, 0]);
	});
});

/**
 * Called by this module to create blocked ray collaborators.
 * @param context - The execution context accepted by the operation.
 * @param scatteringOrder - The scattering order value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createBlockedRayCollaborators(context, scatteringOrder) {
	return {
		geometry: {
			expressPhysicalScatteringCacheDirection: jasmine
				.createSpy('expressPhysicalScatteringCacheDirection')
				.and.returnValue([1, 0, 0]),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay').and.returnValue(null),
			resolveAtmosphereCoordinate: jasmine.createSpy('resolveAtmosphereCoordinate'),
			expressScatteringCacheDirection: jasmine.createSpy('expressScatteringCacheDirection'),
		},
		atmosphere: {
			sampleMedium: jasmine.createSpy('sampleMedium'),
		},
		calculator: {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine.createSpy(
				'buildEndpointTrapezoidPathIntegrationPoints',
			),
			computeTrapezoidSegmentTransmittance: jasmine.createSpy('computeTrapezoidSegmentTransmittance'),
		},
		scatteringOrder,
		positionNodes: context.positionNodes,
		positionCount: context.positionCount,
		radianceUnitVectors: context.radianceUnitVectors,
		radianceDirectionCount: context.radianceDirectionCount,
		spectralChannelCount: context.spectralChannelCount,
		resolvePositionStencil: jasmine.createSpy('resolvePositionStencil'),
		resolveDirectionStencil: jasmine.createSpy('resolveDirectionStencil'),
		resolvePhysicalRadianceDirection: jasmine
			.createSpy('resolvePhysicalRadianceDirection')
			.and.returnValue([1, 0, 0]),
		resolveBuildCoordinate: jasmine.createSpy('resolveBuildCoordinate').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param request - The request accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (request) => ({
				coordinateKey: 'blocked:0:0',
				coordinates: [request.positionIndex, request.directionIndex],
				altitude: request.positionNode.coordinate,
				incomingDirection: request.incomingDirection,
			}),
		),
		pathIntervalCount: 15,
	};
}

/**
 * Called by this module to create context.
 * @returns - The result produced by the operation.
 */
function createContext() {
	const basis = new SpectralBasis({
		id: 'synthetic-transport-basis',
		channels: [
			{
				id: 'first',
				center: {value: 400, units: 'nanometers'},
				width: {value: 20, units: 'nanometers'},
			},
			{
				id: 'second',
				center: {value: 420, units: 'nanometers'},
				width: {value: 20, units: 'nanometers'},
			},
		],
	});
	const positionNodes = [
		{
			index: 0,
			coordinate: {value: 2, units: 'meters'},
			role: 'synthetic-position',
			metadata: {},
		},
	];
	const positionDomain = /** @type {PositionDomain} */ ({
		id: 'synthetic-transport-position',
		count: positionNodes.length,
		nodes: positionNodes,
	});
	const radianceUnitVectors = /** @type {readonly UnitVector3[]} */ ([[1, 0, 0]]);
	const radianceDirectionDomain = /** @type {DirectionDomain} */ ({
		id: 'synthetic-transport-radiance-direction',
		directionCount: radianceUnitVectors.length,
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
		directionCount: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount,
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
 * Called by this module to create a complete typed medium sample for the transport collaboration seam.
 *
 * @param {SpectralBasis} basis - Supplies the ordered wavelength basis.
 * @param {readonly number[]} extinctionValues - Supplies total extinction values.
 * @returns {AtmosphereSample} - The typed synthetic medium.
 */
function createMediumSample(basis, extinctionValues) {
	const zero = extinctionValues.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @returns - The callback result returned to its caller.
		 */ () => 0,
	);
	/**
	 * Called by packet to packet.
	 * @param quantity - The quantity value accepted by the operation.
	 * @param units - The units value accepted by the operation.
	 * @param values - The values value accepted by the operation.
	 * @param provenanceIdentity - The provenance identity value accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ const packet = (quantity, units, values, provenanceIdentity) =>
		new SpectralPacket({
			basis,
			quantity,
			units,
			values,
			provenanceIdentity,
		});

	return {
		extinction: /** @type {SpectralExtinctionCoefficientPacket} */ (
			packet(
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				extinctionValues,
				'synthetic-transport-extinction',
			)
		),
		scattering: /** @type {SpectralScatteringCoefficientPacket} */ (
			packet(
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				zero,
				'synthetic-transport-scattering',
			)
		),
		rayleighScattering: /** @type {SpectralScatteringCoefficientPacket} */ (
			packet(
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				zero,
				'synthetic-transport-rayleigh-scattering',
			)
		),
		mieScattering: /** @type {SpectralScatteringCoefficientPacket} */ (
			packet(
				SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				zero,
				'synthetic-transport-mie-scattering',
			)
		),
		mieExtinction: /** @type {SpectralExtinctionCoefficientPacket} */ (
			packet(
				SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				zero,
				'synthetic-transport-mie-extinction',
			)
		),
		absorption: /** @type {SpectralAbsorptionCoefficientPacket} */ (
			packet(
				SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
				SPECTRAL_UNITS.INVERSE_LENGTH,
				zero,
				'synthetic-transport-absorption',
			)
		),
		density: {
			rayleigh: 0,
			mie: 0,
			absorption: 0,
		},
	};
}

/**
 * Called by this module to create field.
 * @param context - The execution context accepted by the operation.
 * @param input2 - The destructured input accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createField(
	context,
	{
		id,
		kind,
		order,
		provenanceIdentity = kind === 'radiance'
			? ALGORITHM32_PRODUCTION_TRANSPORT_PROVENANCE_IDENTITY
			: `synthetic:${id}`,
	},
) {
	const radiance = kind === 'radiance';
	const packing = radiance ? context.radiancePacking : context.scatteringPacking;

	return new CpuDirectionalSpectralField({
		id,
		order: {kind: 'pure', value: order},
		provenanceIdentity,
		packing,
	});
}

/**
 * Called by this module to path point.
 * @param pointIndex - The point index value accepted by the operation.
 * @param distanceAlongRay - The distance along ray value accepted by the operation.
 * @param intervalLengthFromPrevious - The interval length from previous value accepted by the operation.
 * @param measure - The measure value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function pathPoint(pointIndex, distanceAlongRay, intervalLengthFromPrevious, measure) {
	return {
		pointIndex,
		distanceAlongRay: {value: distanceAlongRay, units: 'meters'},
		intervalLengthFromPrevious: {
			value: intervalLengthFromPrevious,
			units: 'meters',
		},
		trapezoidWeight: 1,
		measure: {value: measure, units: 'meters'},
	};
}

/**
 * Called by this module to normalized.
 * @param vector - The vector value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function normalized(vector) {
	const length = Math.hypot(...vector);
	return vector.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value) => value / length,
	);
}

/**
 * Called by this module to read spectrum.
 * @param field - The field value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function readSpectrum(field) {
	const reader = field.createReader();
	return [0, 1].map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param wavelengthIndex - The wavelength index value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (wavelengthIndex) =>
			reader.readScalar({
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex,
			}),
	);
}
