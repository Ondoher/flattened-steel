import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralBasis,
	createSpectralPacket,
} from '../../quantities/index.js';
import { Reference } from '../Reference.js';

const REFERENCE_TEST_BASIS = createSpectralBasis({
	id: 'reference-test-basis',
	channels: [{
		id: 'reference-test-550',
		center: { value: 550, units: 'nanometers' },
		width: { value: 1, units: 'nanometers' },
	}],
});

/**
 * Create one typed calculator result for Reference tests.
 *
 * @param {number} pathRadiance - Supplies path radiance density.
 * @param {number} transmittance - Supplies view transmittance.
 * @returns {PathRadiance} The calculator result.
 */
function createCalculatedPath(pathRadiance = 0, transmittance = 1) {
	return {
		pathRadiance: /** @type {SpectralRadiancePacket} */ (/** @type {unknown} */ (
			createSpectralPacket({
				basis: REFERENCE_TEST_BASIS,
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				values: [pathRadiance],
				provenanceIdentity: `reference-test:path-radiance:${pathRadiance}`,
			})
		)),
		transmittance: /** @type {SpectralTransmittancePacket} */ (
			/** @type {unknown} */ (createSpectralPacket({
				basis: REFERENCE_TEST_BASIS,
				quantity: SPECTRAL_QUANTITIES.TRANSMITTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: [transmittance],
				provenanceIdentity: `reference-test:transmittance:${transmittance}`,
			}))
		),
	};
}

/**
 * Create an operation-ready cumulative CPU cache test double.
 *
 * @param {string} id - Supplies the test identity.
 * @returns {CpuScatteringCache} The cache test double.
 */
function createScatteringCache(id) {
	return /** @type {CpuScatteringCache} */ (/** @type {unknown} */ ({
		descriptor: { id },
		sampleResolved() {
			throw new Error('Reference orchestration tests do not sample the cache.');
		},
		dispose() {},
	}));
}

describe('Reference', () => {
	it('delegates evaluation through geometry, path integration, and calculator radiance', () => {
		const viewRaySegment = {
			ray: {
				origin: { coordinates: [0, 0, 0], units: 'meters' },
				direction: [0, 0, 1],
			},
			startDistance: { value: 0, units: 'meters' },
			endDistance: { value: 10, units: 'meters' },
		};
		const pathIntegrationPoints = [{ pointIndex: 0 }];
		const scatteringCache = createScatteringCache('configured-cache');
		const geometry = {
			resolveViewRaySegment: jasmine.createSpy('resolveViewRaySegment').and.returnValue(viewRaySegment),
		};
		const calculatedPath = createCalculatedPath(0.25, 0.75);
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: jasmine.createSpy('buildEndpointTrapezoidPathIntegrationPoints')
				.and.returnValue(pathIntegrationPoints),
			computeRadiance: jasmine.createSpy('computeRadiance').and.returnValue(calculatedPath),
		};
		const reference = new Reference({
			model: { geometry },
			calculator,
			executionControls: { pathIntervalCount: 4 },
			scatteringCache,
		});

		const result = reference.evaluate({ viewRay: { direction: [0, 0, 1] } });

		expect(geometry.resolveViewRaySegment).toHaveBeenCalledWith({ direction: [0, 0, 1] });
		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints).toHaveBeenCalledWith(viewRaySegment, 4);
		expect(calculator.computeRadiance).toHaveBeenCalledWith(
			viewRaySegment,
			pathIntegrationPoints,
			{ scatteringCache },
		);
		expect(result).toEqual({
			pathRadiance: calculatedPath.pathRadiance,
			transmittance: calculatedPath.transmittance,
			viewRaySegment,
			pathIntegrationPoints,
		});
		expect(result.pathRadiance).toBe(calculatedPath.pathRadiance);
		expect(result.transmittance).toBe(calculatedPath.transmittance);
	});

	it('uses the production 15-interval control when no override is supplied', () => {
		const viewRaySegment = {
			ray: {
				origin: { coordinates: [0, 0, 0], units: 'meters' },
				direction: [0, 0, 1],
			},
			startDistance: { value: 0, units: 'meters' },
			endDistance: { value: 1, units: 'meters' },
		};
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints:
				jasmine.createSpy('build path').and.returnValue([]),
			computeRadiance:
				jasmine.createSpy('compute radiance')
					.and.returnValue(createCalculatedPath()),
		};
		const reference = new Reference({
			model: {
				geometry: {
					resolveViewRaySegment: () => viewRaySegment,
				},
			},
			calculator,
			scatteringCache: createScatteringCache('default-control-cache'),
		});

		reference.evaluate();

		expect(calculator.buildEndpointTrapezoidPathIntegrationPoints)
			.toHaveBeenCalledOnceWith(viewRaySegment, 15);
	});

	it('rejects evaluation without a cumulative scattering cache', () => {
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: () => [],
			computeRadiance: jasmine.createSpy('computeRadiance')
				.and.returnValue(createCalculatedPath()),
		};
		const reference = new Reference({
			model: {
				geometry: {
					resolveViewRaySegment: () => ({
						ray: {
							origin: { coordinates: [0, 0, 0], units: 'meters' },
							direction: [0, 0, 1],
						},
						startDistance: { value: 0, units: 'meters' },
						endDistance: { value: 0, units: 'meters' },
					}),
				},
			},
			calculator,
		});

		expect(() => reference.evaluate({})).toThrowError(/cumulative scattering cache/);
	});

	it('rejects explicit null for optional nonnullable dependencies and controls', () => {
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: () => [],
			computeRadiance: () => createCalculatedPath(),
		};
		const model = {
			geometry: {
				resolveViewRaySegment: () => ({
					ray: {
						origin: { coordinates: [0, 0, 0], units: 'meters' },
						direction: [0, 0, 1],
					},
					startDistance: { value: 0, units: 'meters' },
					endDistance: { value: 0, units: 'meters' },
				}),
			},
		};

		expect(() => new Reference({ model, calculator: null })).toThrowError(/calculator/);
		expect(() => new Reference({ model, calculator, executionControls: null }))
			.toThrowError(/executionControls/);

		const reference = new Reference({
			model,
			calculator,
			scatteringCache: createScatteringCache('configured-cache'),
		});
		expect(() => reference.evaluate({ pathIntervalCount: null }))
			.toThrowError(/positive integer/);
	});

	it('defaults an absent viewRay at the geometry boundary', () => {
		const resolveViewRaySegment = jasmine.createSpy('resolveViewRaySegment').and.returnValue({
			ray: {
				origin: { coordinates: [0, 0, 0], units: 'meters' },
				direction: [0, 0, 1],
			},
			startDistance: { value: 0, units: 'meters' },
			endDistance: { value: 0, units: 'meters' },
		});
		const reference = new Reference({
			model: { geometry: { resolveViewRaySegment } },
			calculator: {
				buildEndpointTrapezoidPathIntegrationPoints: () => [],
				computeRadiance: () => createCalculatedPath(),
			},
			scatteringCache: createScatteringCache('configured-cache'),
		});

		reference.evaluate({});

		expect(resolveViewRaySegment).toHaveBeenCalledWith({});
	});

	it('uses a request cache override and otherwise keeps the configured cache', () => {
		const configuredCache = createScatteringCache('configured-cache');
		const requestCache = createScatteringCache('request-cache');
		const calculator = {
			buildEndpointTrapezoidPathIntegrationPoints: () => [],
			computeRadiance: jasmine.createSpy('computeRadiance')
				.and.returnValue(createCalculatedPath()),
		};
		const reference = new Reference({
			model: {
				geometry: {
					resolveViewRaySegment: () => ({
						ray: {
							origin: { coordinates: [0, 0, 0], units: 'meters' },
							direction: [0, 0, 1],
						},
						startDistance: { value: 0, units: 'meters' },
						endDistance: { value: 0, units: 'meters' },
					}),
				},
			},
			calculator,
			scatteringCache: configuredCache,
		});

		reference.evaluate({ scatteringCache: undefined });

		expect(calculator.computeRadiance.calls.mostRecent().args[2]).toEqual({
			scatteringCache: configuredCache,
		});

		reference.evaluate({ scatteringCache: requestCache });

		expect(calculator.computeRadiance.calls.mostRecent().args[2]).toEqual({
			scatteringCache: requestCache,
		});
		expect(() => reference.evaluate({ scatteringCache: null }))
			.toThrowError(/cumulative scattering cache/);
	});
});
