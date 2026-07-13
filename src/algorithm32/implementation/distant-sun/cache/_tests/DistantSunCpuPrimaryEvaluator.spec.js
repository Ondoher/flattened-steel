import {CpuDirectionalSpectralField} from '../../../../light-source-support/cache/CpuDirectionalSpectralField.js';
import {DistantSunLightSource} from '../../DistantSunLightSource.js';
import {
	DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
	DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY,
	NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';
import {DistantSunCpuPrimaryEvaluator} from '../DistantSunCpuPrimaryEvaluator.js';

describe('DistantSunCpuPrimaryEvaluator', /** Called by Jasmine to register the named test suite. */ () => {
	it('writes direct L1 in position, direction, and wavelength order', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const evaluator = createEvaluator(source);
		const domainSelection = createOnePositionDomainSelection();
		const geometry = createRadianceGeometry();
		const calculator = createIndexedRadianceCalculator();
		const field = evaluator.buildPrimaryRadiance({
			model: createPrimaryModel(source, geometry, domainSelection, 7),
			calculator,
		});
		const reader = field.createReader();

		expect(field.isSealed).toBeTrue();
		expect(field.order).toEqual({kind: 'pure', value: 1});
		expect(field.provenanceIdentity).toBe(DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY);
		expect(geometry.expressPhysicalIncomingRadianceDirection).toHaveBeenCalledTimes(
			domainSelection.incomingDirectionCount,
		);
		expect(geometry.resolveCacheBuildRay).toHaveBeenCalledTimes(domainSelection.incomingDirectionCount);
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints).toHaveBeenCalledTimes(
			domainSelection.incomingDirectionCount,
		);
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints.calls.first().args[1]).toBe(7);
		expect(calculator.computeDirectRadiance).toHaveBeenCalledTimes(domainSelection.incomingDirectionCount);
		expect(
			reader.readScalar({
				positionIndex: 0,
				directionIndex: 0,
				wavelengthIndex: 0,
			}),
		).toBe(1);
		expect(
			reader.readScalar({
				positionIndex: 0,
				directionIndex: domainSelection.incomingDirectionCount - 1,
				wavelengthIndex: domainSelection.spectralChannelCount - 1,
			}),
		).toBe(domainSelection.incomingDirectionCount);
	});

	it('clears the mutable field and preserves the thrown error when evaluation fails', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		let allocatedField = null;
		const evaluator = createEvaluator(
			source,
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param field - The field value accepted by the operation.
			 */ (field) => {
				allocatedField = field;
			},
		);
		const failure = new Error('test direct-radiance failure');
		let evaluationCount = 0;
		const calculator = /** @type {DistantSunPrimaryRadianceCalculator} */ ({
			/**
			 * Call this method to build endpoint trapezoid path integration points.
			 * @returns - The result produced by the operation.
			 */ buildEndpointTrapezoidPathIntegrationPoints() {
				return [];
			},
			/**
			 * Call this method to compute direct radiance.
			 * @returns - The result produced by the operation.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ computeDirectRadiance() {
				evaluationCount += 1;
				if (evaluationCount === 2) {
					throw failure;
				}
				return {pathRadiance: {values: Array(15).fill(9)}};
			},
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
				 */ () =>
				evaluator.buildPrimaryRadiance({
					model: createPrimaryModel(source, createRadianceGeometry(), createOnePositionDomainSelection(), 3),
					calculator,
				}),
		).toThrow(failure);
		expect(allocatedField).not.toBeNull();

		const field = /** @type {CpuDirectionalSpectralFieldContract} */ (allocatedField);
		expect(field.isSealed).toBeFalse();
		field.seal();
		expect(field.createReader().readScalarAtOffset(0)).toBe(0);
	});
});

/**
 * Called by this module to create the configured source used by direct-primary evaluator tests.
 *
 * @returns {DistantSunLightSource} - The configured distant source.
 *
 */
function createDistantSource() {
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004, units: 'radians'},
	});
	source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [1, 0, 0]});

	return source;
}

/**
 * Called by this module to create a primary evaluator with provider-equivalent field allocation.
 *
 * @param {DistantSunLightSource} source - The configured source.
 * @param {(field: CpuDirectionalSpectralFieldContract) => void} [observeAllocation] - The optional allocation observer.
 * @returns {DistantSunCpuPrimaryEvaluator} - The configured primary evaluator.
 *
 */
function createEvaluator(source, observeAllocation) {
	return new DistantSunCpuPrimaryEvaluator(source, source.configuration, {
		/**
		 * Call this method to create pure radiance field.
		 * @param definition - The definition value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ createPureRadianceField(definition) {
			const domainSelection = definition.domainSelection ?? NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
			const field = new CpuDirectionalSpectralField({
				id: definition.id,
				provenanceIdentity: definition.provenanceIdentity ?? DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY,
				order: {kind: 'pure', value: definition.order},
				packing: domainSelection.radiancePacking,
			});
			observeAllocation?.(field);
			return field;
		},
		/**
		 * Call this method to create pure scattering density field.
		 * @throws {Error} - When the operation cannot complete its caller-observable contract.
		 */ createPureScatteringDensityField() {
			throw new Error('direct-primary tests must not allocate scattering-density storage.');
		},
	});
}

/**
 * Called by this module to create a reduced executable domain that retains every incoming direction.
 *
 * @returns {DistantSunConstructionDomainSelection} - The one-position selection.
 *
 */
function createOnePositionDomainSelection() {
	const selected = NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

	return /** @type {DistantSunConstructionDomainSelection} */ ({
		...selected,
		positionNodes: [selected.positionNodes[0]],
		positionCount: 1,
	});
}

/**
 * Called by this module to create a focused aggregate model for direct-primary evaluation.
 *
 * @param {DistantSunLightSource} source - Configured distant source.
 * @param {DistantSunPrimaryRadianceGeometry} geometry - Direct-radiance geometry.
 * @param {DistantSunConstructionDomainSelection} domainSelection - Executable domains.
 * @param {number} transportIntervalCount - Profile-owned transport count.
 * @returns {SharedModel} - Focused aggregate execution model.
 */
function createPrimaryModel(source, geometry, domainSelection, transportIntervalCount) {
	const atmosphere = /** @type {AtmosphereModel} */ (/** @type {unknown} */ ({}));
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			lightSource: source,
			atmosphere,
			geometry,
			profile: {
				id: 'distant-primary-focused-profile',
				spectral: {
					basis: domainSelection.spectralBasis,
					sourceIrradianceDensity: source.sourceIrradiance,
				},
				numerical: {
					cacheConstruction: {transportIntervalCount},
					sourcePathTransmittance: {intervalCount: 15},
				},
				domains: {
					positions: {
						...domainSelection.positionDomain,
						nodes: domainSelection.positionNodes,
						count: domainSelection.positionCount,
					},
					incomingDirections: domainSelection.incomingDirectionDomain,
					outgoingDirections: domainSelection.outgoingDirectionDomain,
				},
			},
		})
	);
}

/**
 * Called by this module to create geometry that encodes the requested direction index in each ray origin.
 *
 * @returns {DistantSunPrimaryRadianceGeometry & jasmine.SpyObj<Pick<DistantSunPrimaryRadianceGeometry, DistantSunPrimaryRadianceGeometrySpyMethod>>} - The indexed-ray geometry.
 *
 */
function createRadianceGeometry() {
	return /** @type {DistantSunPrimaryRadianceGeometry & jasmine.SpyObj<Pick<DistantSunPrimaryRadianceGeometry, DistantSunPrimaryRadianceGeometrySpyMethod>>} */ (
		/** @type {unknown} */ ({
			expressPhysicalIncomingRadianceDirection: jasmine
				.createSpy('expressPhysicalIncomingRadianceDirection')
				.and.callFake(
					/**
					 * Called by the Jasmine spy to handle one callback invocation.
					 * @param direction - The direction value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (direction) => direction,
				),
			resolveCacheBuildRay: jasmine.createSpy('resolveCacheBuildRay').and.callFake(
				/**
				 * Called by the Jasmine spy to handle one callback invocation.
				 * @param coordinate - The coordinate value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (coordinate) => ({
					ray: {
						origin: {coordinates: [coordinate.directionIndex, 0, 0], units: 'meters'},
						direction: coordinate.incomingDirection,
					},
					startDistance: {value: 0, units: 'meters'},
					endDistance: {value: 1, units: 'meters'},
				}),
			),
		})
	);
}

/**
 * Called by this module to create a calculator whose output identifies the incoming direction under evaluation.
 *
 * @returns {DistantSunPrimaryRadianceCalculator & jasmine.SpyObj<DistantSunPrimaryRadianceCalculator>} - The indexed-radiance calculator.
 *
 */
function createIndexedRadianceCalculator() {
	return /** @type {DistantSunPrimaryRadianceCalculator & jasmine.SpyObj<DistantSunPrimaryRadianceCalculator>} */ ({
		buildEndpointTrapezoidPathIntegrationPoints: jasmine
			.createSpy('buildEndpointTrapezoidPathIntegrationPoints')
			.and.returnValue([]),
		computeDirectRadiance: jasmine.createSpy('computeDirectRadiance').and.callFake(
			/**
			 * Called by the Jasmine spy to handle one callback invocation.
			 * @param raySegment - The ray segment value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (raySegment) => ({
				pathRadiance: {values: Array(15).fill(raySegment.ray.origin.coordinates[0] + 1)},
			}),
		),
	});
}
