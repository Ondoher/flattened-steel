import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralBasis, SpectralPacket} from '../../spectral-values/index.js';
import {Reference} from '../Reference.js';

/** Reference test basis constant. */
const REFERENCE_TEST_BASIS = new SpectralBasis({
	id: 'reference-test-basis',
	channels: [
		{
			id: 'reference-test-550',
			center: {value: 550, units: 'nanometers'},
			width: {value: 1, units: 'nanometers'},
		},
	],
});

/**
 * Called by this module to create one typed calculator result for Reference tests.
 *
 * @param {number} pathRadiance - Supplies path radiance density.
 * @param {number} transmittance - Supplies view transmittance.
 * @returns {PathRadiance} - The calculator result.
 */
function createCalculatedPath(pathRadiance = 0, transmittance = 1) {
	return {
		pathRadiance: /** @type {SpectralRadiancePacket} */ (
			/** @type {unknown} */ (
				new SpectralPacket({
					basis: REFERENCE_TEST_BASIS,
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
					values: [pathRadiance],
					provenanceIdentity: `reference-test:path-radiance:${pathRadiance}`,
				})
			)
		),
		transmittance: /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (
				new SpectralPacket({
					basis: REFERENCE_TEST_BASIS,
					quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					values: [transmittance],
					provenanceIdentity: `reference-test:transmittance:${transmittance}`,
				})
			)
		),
	};
}

/**
 * Called by this module to create an operation-ready cumulative CPU cache test double.
 *
 * @param {string} id - Supplies the test identity.
 * @returns {CpuScatteringCache} - The cache test double.
 */
function createScatteringCache(id) {
	return /** @type {CpuScatteringCache} */ (
		/** @type {unknown} */ ({
			sampleProvenanceIdentity: id,
			/**
			 * Call this method to sample resolved.
			 * @throws {Error} - When the operation cannot complete its caller-observable contract.
			 */ sampleResolved() {
				throw new Error('Reference orchestration tests do not sample the cache.');
			},
			/** Call this method to dispose. */ dispose() {},
		})
	);
}

/**
 * Called by this module to create a focused aggregate model with a fixed view schedule.
 *
 * @param {object} geometry - Geometry double.
 * @param {number} [intervalCount] - Profile-owned interval count.
 * @returns {SharedModel} - Focused aggregate model.
 */
function createReferenceModel(geometry, intervalCount = 15) {
	return /** @type {SharedModel} */ (
		/** @type {unknown} */ ({
			geometry,
			profile: {numerical: {viewPath: {intervalCount, sampleDistribution: null}}},
		})
	);
}

describe('Reference', /** Called by Jasmine to register the named test suite. */ () => {
	it('delegates evaluation through geometry, path integration, and calculator radiance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const viewRaySegment = {
			ray: {
				origin: {coordinates: [0, 0, 0], units: 'meters'},
				direction: [0, 0, 1],
			},
			startDistance: {value: 0, units: 'meters'},
			endDistance: {value: 10, units: 'meters'},
		};
		const pathIntegrationPoints = [{pointIndex: 0}];
		const scatteringCache = createScatteringCache('configured-cache');
		const geometry = {
			resolveViewRaySegment: jasmine.createSpy('resolveViewRaySegment').and.returnValue(viewRaySegment),
		};
		const calculatedPath = createCalculatedPath(0.25, 0.75);
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine
				.createSpy('buildEndpointTrapezoidPathIntegrationPoints')
				.and.returnValue(pathIntegrationPoints),
			computeRadiance: jasmine.createSpy('computeRadiance').and.returnValue(calculatedPath),
		};
		const reference = new Reference({
			model: createReferenceModel(geometry, 4),
			calculator,
			scatteringCache,
		});

		const result = reference.evaluate({viewRay: {direction: [0, 0, 1]}});

		expect(geometry.resolveViewRaySegment).toHaveBeenCalledWith({direction: [0, 0, 1]});
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints).toHaveBeenCalledWith(viewRaySegment, 4);
		expect(calculator.computeRadiance).toHaveBeenCalledWith(viewRaySegment, pathIntegrationPoints, {
			scatteringCache,
		});
		expect(result).toEqual({
			pathRadiance: calculatedPath.pathRadiance,
			transmittance: calculatedPath.transmittance,
			viewRaySegment,
			pathIntegrationPoints,
		});
		expect(result.pathRadiance).toBe(calculatedPath.pathRadiance);
		expect(result.transmittance).toBe(calculatedPath.transmittance);
	});

	it('uses the production 15-interval option when no override is supplied', /** Called by Jasmine to exercise the named behavior. */ () => {
		const viewRaySegment = {
			ray: {
				origin: {coordinates: [0, 0, 0], units: 'meters'},
				direction: [0, 0, 1],
			},
			startDistance: {value: 0, units: 'meters'},
			endDistance: {value: 1, units: 'meters'},
		};
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine.createSpy('build path').and.returnValue([]),
			computeRadiance: jasmine.createSpy('compute radiance').and.returnValue(createCalculatedPath()),
		};
		const reference = new Reference({
			model: createReferenceModel({
				/**
				 * Called by reference to resolve view ray segment.
				 * @returns - The callback result returned to its caller.
				 */ resolveViewRaySegment: () => viewRaySegment,
			}),
			calculator,
			scatteringCache: createScatteringCache('default-option-cache'),
		});

		reference.evaluate();

		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints).toHaveBeenCalledOnceWith(viewRaySegment, 15);
	});

	it('rejects evaluation without a cumulative scattering cache', /** Called by Jasmine to exercise the named behavior. */ () => {
		const calculator = {
			/**
			 * Called by calculator to build endpoint trapezoid path integration points.
			 * @returns - The callback result returned to its caller.
			 */ buildEndpointTrapezoidPathIntegrationPoints: () => [],
			computeRadiance: jasmine.createSpy('computeRadiance').and.returnValue(createCalculatedPath()),
		};
		const reference = new Reference({
			model: createReferenceModel({
				/**
				 * Called by reference to resolve view ray segment.
				 * @returns - The callback result returned to its caller.
				 */ resolveViewRaySegment: () => ({
						ray: {
							origin: {coordinates: [0, 0, 0], units: 'meters'},
							direction: [0, 0, 1],
						},
						startDistance: {value: 0, units: 'meters'},
						endDistance: {value: 0, units: 'meters'},
				}),
			}),
			calculator,
		});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => reference.evaluate({}),
		).toThrowError(/cumulative scattering cache/);
	});

	it('defaults an absent viewRay at the geometry boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const resolveViewRaySegment = jasmine.createSpy('resolveViewRaySegment').and.returnValue({
			ray: {
				origin: {coordinates: [0, 0, 0], units: 'meters'},
				direction: [0, 0, 1],
			},
			startDistance: {value: 0, units: 'meters'},
			endDistance: {value: 0, units: 'meters'},
		});
		const reference = new Reference({
			model: createReferenceModel({resolveViewRaySegment}),
			calculator: {
				/**
				 * Called by reference to build endpoint trapezoid path integration points.
				 * @returns - The callback result returned to its caller.
				 */ buildEndpointTrapezoidPathIntegrationPoints: () => [],
				/**
				 * Called by reference to compute radiance.
				 * @returns - The callback result returned to its caller.
				 */ computeRadiance: () => createCalculatedPath(),
			},
			scatteringCache: createScatteringCache('configured-cache'),
		});

		reference.evaluate({});

		expect(resolveViewRaySegment).toHaveBeenCalledWith({});
	});

	it('uses a request cache override and otherwise keeps the configured cache', /** Called by Jasmine to exercise the named behavior. */ () => {
		const configuredCache = createScatteringCache('configured-cache');
		const requestCache = createScatteringCache('request-cache');
		const calculator = {
			/**
			 * Called by calculator to build endpoint trapezoid path integration points.
			 * @returns - The callback result returned to its caller.
			 */ buildEndpointTrapezoidPathIntegrationPoints: () => [],
			computeRadiance: jasmine.createSpy('computeRadiance').and.returnValue(createCalculatedPath()),
		};
		const reference = new Reference({
			model: createReferenceModel({
				/**
				 * Called by reference to resolve view ray segment.
				 * @returns - The callback result returned to its caller.
				 */ resolveViewRaySegment: () => ({
						ray: {
							origin: {coordinates: [0, 0, 0], units: 'meters'},
							direction: [0, 0, 1],
						},
						startDistance: {value: 0, units: 'meters'},
						endDistance: {value: 0, units: 'meters'},
				}),
			}),
			calculator,
			scatteringCache: configuredCache,
		});

		reference.evaluate({scatteringCache: undefined});

		expect(calculator.computeRadiance.calls.mostRecent().args[2]).toEqual({
			scatteringCache: configuredCache,
		});

		reference.evaluate({scatteringCache: requestCache});

		expect(calculator.computeRadiance.calls.mostRecent().args[2]).toEqual({
			scatteringCache: requestCache,
		});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => reference.evaluate({scatteringCache: null}),
		).toThrowError(/cumulative scattering cache/);
	});
});
