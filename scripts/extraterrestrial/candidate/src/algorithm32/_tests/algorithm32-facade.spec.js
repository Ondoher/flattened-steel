import { Algorithm32 } from '../Algorithm32.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../profiles/index.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from '../quantities/index.js';

function distance(value) {
	return {
		value,
		units: 'meters',
	};
}

/**
 * Create one native-basis spectral packet for a facade test double.
 *
 * @param {SpectralQuantity} quantity - Supplies the quantity.
 * @param {SpectralUnits} units - Supplies the units.
 * @param {number} value - Supplies the value repeated across the native basis.
 * @param {string} provenanceIdentity - Supplies test provenance.
 * @returns {SpectralPacket} The validated spectral packet.
 */
function spectralPacket(quantity, units, value, provenanceIdentity) {
	return createSpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity,
		units,
		values: Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(value),
		provenanceIdentity,
	});
}

function position(coordinates) {
	return {
		coordinates,
		units: 'meters',
	};
}

/**
 * Create a production-shaped set of model doubles.
 *
 * @param {string} id - Supplies an id suffix.
 * @returns {{ lightSource: object, atmosphere: object, geometry: object }} The models.
 */
function createModels(id = 'test') {
	return {
		lightSource: {
			describe() {
				return { kind: 'algorithm32-light-source-model', id: `light-${id}`, fingerprint: `light:${id}` };
			},
			createCacheController() {
				return {
					active: null,
					createScatteringCache() {
						return Promise.reject(new Error('test controller is not used'));
					},
					dispose() {},
				};
			},
			sampleDirectLighting() {
				return {
					sourceIrradiance: spectralPacket(
						SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
						SPECTRAL_UNITS.IRRADIANCE_DENSITY,
						1,
						`algorithm32-facade-source-${id}`,
					),
					directionToLight: [0, 0, 1],
				};
			},
			resolveSourcePathLimit() {
				return {
					maxDistance: null,
					reason: 'test-directional',
				};
			},
		},
		atmosphere: {
			describe() {
				return { kind: 'algorithm32-atmosphere-model', id: `atmosphere-${id}`, fingerprint: `atmosphere:${id}` };
			},
			sampleMedium() {
				return {
					extinction: spectralPacket(
						SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
						SPECTRAL_UNITS.INVERSE_LENGTH,
						0,
						`algorithm32-facade-extinction-${id}`,
					),
					scattering: spectralPacket(
						SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
						SPECTRAL_UNITS.INVERSE_LENGTH,
						0,
						`algorithm32-facade-scattering-${id}`,
					),
					rayleighScattering: spectralPacket(
						SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
						SPECTRAL_UNITS.INVERSE_LENGTH,
						0,
						`algorithm32-facade-rayleigh-${id}`,
					),
					mieScattering: spectralPacket(
						SPECTRAL_QUANTITIES.SCATTERING_COEFFICIENT,
						SPECTRAL_UNITS.INVERSE_LENGTH,
						0,
						`algorithm32-facade-mie-scattering-${id}`,
					),
					mieExtinction: spectralPacket(
						SPECTRAL_QUANTITIES.EXTINCTION_COEFFICIENT,
						SPECTRAL_UNITS.INVERSE_LENGTH,
						0,
						`algorithm32-facade-mie-extinction-${id}`,
					),
					absorption: spectralPacket(
						SPECTRAL_QUANTITIES.ABSORPTION_COEFFICIENT,
						SPECTRAL_UNITS.INVERSE_LENGTH,
						0,
						`algorithm32-facade-absorption-${id}`,
					),
					density: {},
				};
			},
			integrateOpticalDepth() {
				return {
					blockedByGround: false,
					opticalDepth: spectralPacket(
						SPECTRAL_QUANTITIES.OPTICAL_DEPTH,
						SPECTRAL_UNITS.DIMENSIONLESS,
						0,
						`algorithm32-facade-optical-depth-${id}`,
					),
					transmittance: spectralPacket(
						SPECTRAL_QUANTITIES.TRANSMITTANCE,
						SPECTRAL_UNITS.DIMENSIONLESS,
						1,
						`algorithm32-facade-transmittance-${id}`,
					),
				};
			},
			samplePhase() {
				return {
					rayleighPhase: { value: 1, units: 'sr^-1' },
					miePhase: { value: 0, units: 'sr^-1' },
				};
			},
		},
		geometry: {
			describe() {
				return { kind: 'algorithm32-geometry-model', id: `geometry-${id}`, fingerprint: `geometry:${id}` };
			},
			resolveViewRaySegment() {
				return {
					ray: {
						origin: position([0, 0, 0]),
						direction: [0, 0, 1],
					},
					startDistance: distance(0),
					endDistance: distance(0),
				};
			},
			resolveAtmosphereCoordinate() {
				return {
					altitude: distance(0),
				};
			},
			resolveAtmospherePath() {
				return {
					start: { altitude: distance(0) },
					end: { altitude: distance(0) },
					length: distance(0),
				};
			},
			resolveSourceRelativePosition() {
				return {
					directionFromSource: [0, 0, -1],
					distanceFromSource: null,
				};
			},
			resolveScatteringCachePositionStencil() {
				return {
					indices: [0, 0],
					weights: [1, 0],
				};
			},
			resolveScatteringCacheDirectionStencil() {
				return {
					indices: [0, 0, 0, 0],
					weights: [1, 0, 0, 0],
				};
			},
		},
	};
}

/**
 * Create a valid Algorithm32 config for tests.
 *
 * @param {string} id - Supplies an id suffix.
 * @returns {object} The config.
 */
function createConfig(id = 'test') {
	return {
		...createModels(id),
		spectral: NATIVE_15_SPECTRAL_BASIS,
		execution: {
			pathIntervalCount: 1,
		},
		shader: {
			mode: 'test',
		},
	};
}

describe('Algorithm32', () => {
	it('creates readonly config snapshots with shared model descriptors', () => {
		const config = createConfig();
		const algorithm32 = new Algorithm32(config);
		const snapshot = algorithm32.config;

		expect(snapshot.version).toBe(1);
		expect(snapshot.config.spectral).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(snapshot.model.spectral.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(snapshot.model.version).toBe(1);
		expect(snapshot.model.lightSource.id).toBe('light-test');
		expect(snapshot.model.atmosphere.id).toBe('atmosphere-test');
		expect(snapshot.model.geometry.id).toBe('geometry-test');
	});

	it('accepts an optional configured Color instance at facade creation', () => {
		const color = {
			describe() {
				return { kind: 'algorithm32-color', id: 'color-test', fingerprint: 'color:test' };
			},
			convert() {
				return { rgba: [1, 1, 1, 1] };
			},
		};
		const algorithm32 = new Algorithm32({
			...createConfig(),
			color,
		});

		expect(algorithm32.config.config.color).toBe(color);
	});

	it('defaults only omitted optional config sections', () => {
		const omitted = createConfig();
		delete omitted.color;
		delete omitted.execution;
		delete omitted.shader;
		const algorithm32 = new Algorithm32(omitted);

		expect(algorithm32.config.config.color).toBeUndefined();
		expect(algorithm32.config.config.execution).toEqual({
			maximumScatteringOrder: 4,
		});
		expect(algorithm32.config.config.shader).toEqual({});
	});

	it('replaces config as a full lifecycle version update', () => {
		const algorithm32 = new Algorithm32(createConfig('first'));
		const nextSnapshot = algorithm32.setConfig(createConfig('second'));

		expect(nextSnapshot.version).toBe(2);
		expect(nextSnapshot.model.lightSource.id).toBe('light-second');
		expect(algorithm32.config.version).toBe(2);
	});

	it('accepts N1, N2, and N4 while resolving omission to N4', () => {
		for (const maximumScatteringOrder of [1, 2, 4]) {
			const algorithm32 = new Algorithm32({
				...createConfig(),
				execution: { maximumScatteringOrder },
			});
			expect(algorithm32.config.config.execution.maximumScatteringOrder)
				.toBe(maximumScatteringOrder);
			algorithm32.dispose();
		}

		for (const maximumScatteringOrder of [0, 3, 5]) {
			expect(() => new Algorithm32({
				...createConfig(),
				execution: { maximumScatteringOrder },
			})).toThrowError(/maximumScatteringOrder/);
		}
	});

	it('accepts only supported semantic execution values at facade ingress', () => {
		const algorithm32 = new Algorithm32({
			...createConfig(),
			execution: {
				pathIntervalCount: 12,
				sourceTransmittanceIntervalCount: 8,
				pathSampleDistribution: { kind: 'tangent-density-adaptive-soft-v1' },
			},
		});

		expect(algorithm32.config.config.execution).toEqual({
			pathIntervalCount: 12,
			sourceTransmittanceIntervalCount: 8,
			pathSampleDistribution: { kind: 'tangent-density-adaptive-soft-v1' },
			maximumScatteringOrder: 4,
		});
		algorithm32.dispose();

		for (const [name, value] of [
			['pathIntervalCount', 0],
			['pathIntervalCount', 1.5],
			['sourceTransmittanceIntervalCount', Number.POSITIVE_INFINITY],
		]) {
			expect(() => new Algorithm32({
				...createConfig(),
				execution: { [name]: value },
			})).toThrowError(new RegExp(name));
		}

		expect(() => new Algorithm32({
			...createConfig(),
			execution: {
				pathSampleDistribution: { kind: 'unsupported' },
			},
		})).toThrowError(/pathSampleDistribution/u);
	});

	it('delegates CPU/reference evaluation through the configured reference collaborator', () => {
		const algorithm32 = new Algorithm32(createConfig());
		const result = algorithm32.evaluate({
			scatteringCache: {
				descriptor: {
					field: {
						positionDomain: {},
						directionDomain: {},
					},
				},
				sampleResolved() {
					return spectralPacket(
						SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
						SPECTRAL_UNITS.SCATTERING_DENSITY,
						0,
						'algorithm32-facade-cumulative-cache',
					);
				},
				dispose() {},
			},
		});

		expect(result.pathRadiance.values).toEqual(
			Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0),
		);
		expect(result.pathRadiance.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(result.transmittance.values).toEqual(
			Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(1),
		);
		expect(result.transmittance.units).toBe(SPECTRAL_UNITS.DIMENSIONLESS);
		expect(result.viewRaySegment.endDistance).toEqual(distance(0));
	});

	it('builds an awaited shader handle through setup-time attachment', async () => {
		const algorithm32 = new Algorithm32(createConfig());
		const handle = await algorithm32.setupShader({
			composer: {},
			scene: {},
			camera: {},
			viewportSize: { width: 1, height: 1, units: 'pixels' },
			cacheBackend: {},
		});

		expect(handle.getDiagnostics()).toEqual({
			status: 'deferred',
			modelVersion: 1,
		});
		expect(handle.setConfig).toEqual(jasmine.any(Function));
		expect(handle.setColor).toBeUndefined();
		expect(handle.setScene).toBeUndefined();
		expect(handle.setCamera).toBeUndefined();
	});

	it('keeps low-level assembly inputs out of the public setup surface', () => {
		const algorithm32 = new Algorithm32(createConfig());
		const bindingValues = { 'runtime.test': 2 };
		const setup = /** @type {ShaderSetupRequest} */ ({
			composer: {},
			scene: {},
			camera: {},
			viewportSize: { width: 1, height: 1, units: 'pixels' },
			cacheBackend: {},
			bindingValues,
		});
		Object.assign(setup, {
			descriptor: { id: 'caller-descriptor' },
			contributions: [{ id: 'caller-contribution' }],
			mainRequiredSymbols: ['caller.main'],
			systemProvidedSymbols: ['caller.system'],
		});

		const buildRequest = algorithm32._createShaderBuildRequest(
			setup,
			algorithm32.config,
		);

		expect(buildRequest.bindingValues).toBe(bindingValues);
		expect(buildRequest.descriptor).toBeUndefined();
		expect(buildRequest.contributions).toBeUndefined();
		expect(buildRequest.mainRequiredSymbols).toBeUndefined();
		expect(buildRequest.systemProvidedSymbols).toBeUndefined();
	});

	it('fails loudly for deferred debug views and disposed operations', () => {
		expect(() => new Algorithm32({
			...createConfig(),
			shader: {
				debugView: 'experiment-only',
			},
		})).toThrowError(/debug views are deferred/);

		const algorithm32 = new Algorithm32(createConfig());
		algorithm32.dispose();

		expect(() => algorithm32.config).toThrowError(/disposed/);
	});
});
