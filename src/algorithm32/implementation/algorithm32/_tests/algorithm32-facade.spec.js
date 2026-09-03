import {Algorithm32} from '../Algorithm32.js';
import {NATIVE_15_SPECTRAL_BASIS, NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/index.js';
import {LocalLightLevelCalculator} from '../../scene-lighting/LocalLightLevelCalculator.js';

/**
 * Called by this module to distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function distance(value) {
	return {
		value,
		units: 'meters',
	};
}

/**
 * Called by this module to create one native-basis spectral packet for a facade test double.
 *
 * @param {SpectralQuantity} quantity - Supplies the quantity.
 * @param {SpectralUnits} units - Supplies the units.
 * @param {number} value - Supplies the value repeated across the native basis.
 * @param {string} provenanceIdentity - Supplies test provenance.
 * @returns {SpectralPacket} - The validated spectral packet.
 */
function spectralPacket(quantity, units, value, provenanceIdentity) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity,
		units,
		values: Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(value),
		provenanceIdentity,
	});
}

/**
 * Called by this module to position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function position(coordinates) {
	return {
		coordinates,
		units: 'meters',
	};
}

/**
 * Called by this module to create a production-shaped set of model doubles.
 *
 * @param {string} id - Supplies an id suffix.
 * @returns {Algorithm32FacadeModelDoubles} - The models.
 */
function createModels(id = 'test') {
	return {
		lightSource: {
			id: `light-source-${id}`,
			sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
			geometryPlacementKind: 'distant-direction',
			/** Accept the geometry-resolved placement. */
			configureGeometryPlacement() {},
			/**
			 * Call this method to create cache controller.
			 * @returns - The result produced by the operation.
			 */ createCacheController() {
				return {
					active: null,
					/**
					 * Call this method to create scattering cache.
					 * @returns - The result produced by the operation.
					 */ createScatteringCache() {
						return Promise.reject(new Error('test controller is not used'));
					},
					/** Call this method to dispose. */ dispose() {},
				};
			},
			/**
			 * Call this method to sample direct lighting.
			 * @returns - The result produced by the operation.
			 */ sampleDirectLighting() {
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
			/**
			 * Call this method to resolve source path limit.
			 * @returns - The result produced by the operation.
			 */ resolveSourcePathLimit() {
				return {
					maxDistance: null,
					reason: 'test-directional',
				};
			},
		},
		atmosphere: {
			id: `atmosphere-${id}`,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			/**
			 * Call this method to sample medium.
			 * @returns - The result produced by the operation.
			 */ sampleMedium() {
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
			/**
			 * Call this method to integrate optical depth.
			 * @returns - The result produced by the operation.
			 */ integrateOpticalDepth() {
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
			/**
			 * Call this method to sample phase.
			 * @returns - The result produced by the operation.
			 */ samplePhase() {
				return {
					rayleighPhase: {value: 1, units: 'sr^-1'},
					miePhase: {value: 0, units: 'sr^-1'},
				};
			},
		},
		geometry: {
			id: `geometry-${id}`,
			/** Configure the selected light source before model construction. */
			configureLightSource(request) {
				const placement = request.placement ?? {
					kind: 'distant-direction',
					directionToLight: [0, 0, 1],
				};
				request.lightSource.configureGeometryPlacement(placement);
				return placement;
			},
			/**
			 * Call this method to resolve view ray segment.
			 * @returns - The result produced by the operation.
			 */ resolveViewRaySegment() {
				return {
					ray: {
						origin: position([0, 0, 0]),
						direction: [0, 0, 1],
					},
					startDistance: distance(0),
					endDistance: distance(0),
				};
			},
			/**
			 * Call this method to resolve atmosphere coordinate.
			 * @returns - The result produced by the operation.
			 */ resolveAtmosphereCoordinate() {
				return {
					altitude: distance(0),
				};
			},
			/**
			 * Call this method to resolve atmosphere path.
			 * @returns - The result produced by the operation.
			 */ resolveAtmospherePath() {
				return {
					start: {altitude: distance(0)},
					end: {altitude: distance(0)},
					length: distance(0),
				};
			},
			/**
			 * Call this method to resolve source relative position.
			 * @returns - The result produced by the operation.
			 */ resolveSourceRelativePosition() {
				return {
					directionFromSource: [0, 0, -1],
					distanceFromSource: null,
				};
			},
			/**
			 * Call this method to resolve scattering cache position stencil.
			 * @returns - The result produced by the operation.
			 */ resolveScatteringCachePositionStencil() {
				return {
					indices: [0, 0],
					weights: [1, 0],
				};
			},
			/**
			 * Call this method to resolve scattering cache direction stencil.
			 * @returns - The result produced by the operation.
			 */ resolveScatteringCacheDirectionStencil() {
				return {
					indices: [0, 0, 0, 0],
					weights: [1, 0, 0, 0],
				};
			},
		},
	};
}

/**
 * Called by this module to create a valid Algorithm32 config for tests.
 *
 * @param {string} id - Supplies an id suffix.
 * @returns {object} - The config.
 */
function createConfig(id = 'test') {
	return {
		...createModels(id),
		observation: {
			instant: '2026-06-21T12:00:00.000Z',
			location: {
				latitude: {value: 0, units: 'degrees'},
				longitude: {value: 0, units: 'degrees'},
			},
		},
		execution: {
			pathIntervalCount: 1,
		},
		shader: {
			mode: 'test',
		},
	};
}

/**
 * Called by this module to create a spherical Sun-only celestial configuration.
 *
 * @param {string} id - Supplies an id suffix.
 * @param {string} rosterId - Supplies the roster identity.
 * @returns {object} - The celestial configuration.
 */
function createCelestialConfig(id, rosterId) {
	const config = createConfig(id);
	config.lightSource.kind = 'distant-uniform-sun';
	config.lightSource.celestialSourceDefinition = {
		id: config.lightSource.id,
		kind: 'distant-uniform-sun',
		angularRadius: {value: 0.25, units: 'degrees'},
		surfaceRadiance: spectralPacket(
			SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			SPECTRAL_UNITS.RADIANCE_DENSITY,
			2,
			`algorithm32-facade-celestial-radiance-${id}`,
		),
		profile: 'uniform-disk',
	};
	config.lightSource.describeCelestialSourceIdentity = /** Return an unused test source identity. */ () => ({});
	config.lightSource.createCelestialPlacementState = /** Return an unused test placement state. */ () => ({});
	config.lightSource.createCelestialCacheFragment = /** Return an unused test fragment. */ () => ({});
	config.geometry.celestialCapabilityFamily = 'spherical-sun-stars-radial-v1';
	config.geometry.describeCelestialContributionDomain = /** Return an unused test domain. */ () => ({});
	config.geometry.resolveCelestialPlacements = /** Return unused test placements. */ () => [];
	config.geometry.createCelestialBuildSample = /** Return an unused test sample. */ () => ({});
	config.geometry.createCelestialQueryPacket = /** Return unused test query facts. */ () => ({});
	config.celestialSources = {
		id: rosterId,
		family: 'spherical-sun-stars-radial-v1',
		sun: config.lightSource,
		stars: null,
	};
	return config;
}

describe('Algorithm32', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates a receiver-local lighting calculator with each prepared facade configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		const algorithm32 = new Algorithm32(createConfig('local-light-calculator-a'));
		const initialCalculator = algorithm32._localLightLevelCalculator;

		expect(initialCalculator).toEqual(jasmine.any(LocalLightLevelCalculator));
		algorithm32.setConfig(createConfig('local-light-calculator-b'));
		expect(algorithm32._localLightLevelCalculator).toEqual(jasmine.any(LocalLightLevelCalculator));
		expect(algorithm32._localLightLevelCalculator).not.toBe(initialCalculator);

		algorithm32.dispose();
	});

	it('publishes unsmoothed local-light exposure through one facade-owned live binding', /** Called by Jasmine to exercise the named behavior. */ () => {
		const algorithm32 = new Algorithm32(createConfig('local-light-adaptation'));
		const callerBindings = {'runtime.test': 2};
		const bindings = algorithm32._createRuntimeBindingValues(callerBindings);

		expect(bindings['color.exposureModifier']).toBe(1);
		expect(bindings['color.brightnessProxy']).toBeGreaterThanOrEqual(0);
		expect(bindings['color.totalHorizontalIlluminance.value']).toBeGreaterThanOrEqual(0);
		expect(bindings['color.sceneLuminanceScale']).toBeGreaterThan(0);
		expect(algorithm32.sourceBrightness.value).toBe(bindings['color.sceneLuminanceScale']);
		const sourceBrightness = bindings['color.sceneLuminanceScale'];
		const adaptation = algorithm32.setAdaptingLuminance({value: 0, units: 'cd m^-2'});
		expect(adaptation.adaptingLuminanceProxy).toEqual({value: 0, units: 'cd m^-2'});
		expect(adaptation.exposureModifier).toBeCloseTo(10.50268593548108, 12);
		expect(bindings['color.exposureModifier']).toBe(adaptation.exposureModifier);
		expect(bindings['color.brightnessProxy']).toBe(0);
		callerBindings['runtime.test'] = 3;
		expect(bindings['runtime.test']).toBe(3);
		algorithm32.setAdaptingLuminance({value: 5, units: 'cd m^-2'});
		expect(bindings['color.exposureModifier']).toBe(1);
		expect(bindings['color.brightnessProxy']).toBe(5);
		expect(bindings['color.sceneLuminanceScale']).toBe(sourceBrightness);

		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				algorithm32._createRuntimeBindingValues({'color.exposureModifier': 4}),
		).toThrowError(TypeError, 'color.exposureModifier is owned by the Algorithm32 facade.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				algorithm32._createRuntimeBindingValues({'color.brightnessProxy': 4}),
		).toThrowError(TypeError, 'color.brightnessProxy is owned by the Algorithm32 facade.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				algorithm32._createRuntimeBindingValues({'color.totalHorizontalIlluminance.value': 4}),
		).toThrowError(TypeError, 'color.totalHorizontalIlluminance.value is owned by the Algorithm32 facade.');
		expect(
			/** Called by Jasmine to invoke the rejected operation. */ () =>
				algorithm32._createRuntimeBindingValues({'color.sceneLuminanceScale': 4}),
		).toThrowError(TypeError, 'color.sceneLuminanceScale is owned by the Algorithm32 facade.');

		algorithm32.dispose();
	});

	it('initializes the live target from configured Sun-only receiver support', /** Called by Jasmine to exercise the named behavior. */ () => {
		const config = createConfig('sun-only-night-adaptation');
		config.lightSource.sampleDirectLighting = /** Return the configured source below the horizon. */ () => ({
			sourceIrradiance: spectralPacket(
				SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				1,
				'algorithm32-facade-sun-only-night',
			),
			directionToLight: [0, 0, -1],
		});
		const algorithm32 = new Algorithm32(config);
		const bindings = algorithm32._createRuntimeBindingValues();

		expect(bindings['color.brightnessProxy']).toBe(0);
		expect(bindings['color.exposureModifier']).toBeCloseTo(10.50268593548108, 12);

		algorithm32.dispose();
	});

	it('publishes direct-normal separately and adds diffuse light only to total-horizontal state', async () => {
		const config = createConfig('receiver-light-addition');
		config.lightSource.sampleDirectLighting = /** Return a source whose center cosine is one half. */ () => ({
			sourceIrradiance: spectralPacket(
				SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
				SPECTRAL_UNITS.IRRADIANCE_DENSITY,
				2,
				'algorithm32-facade-receiver-direct-normal',
			),
			directionToLight: [Math.sqrt(0.75), 0, 0.5],
		});
		const algorithm32 = new Algorithm32(config);
		const initial = algorithm32.receiverLight;

		expect(initial.directNormal.values.every((value) => value === 2)).toBeTrue();
		expect(initial.directHorizontal.values.every((value) => value === 1)).toBeTrue();
		expect(initial.diffuseHorizontal.values.every((value) => value === 0)).toBeTrue();
		expect(initial.totalHorizontal.values.every((value) => value === 1)).toBeTrue();
		expect(algorithm32.brightnessProxy).toEqual(initial.totalHorizontalLuminanceProxy);
		expect(algorithm32.totalHorizontalIlluminance).toEqual(initial.photopicTotalHorizontalIlluminance);

		const diffuse = spectralPacket(
			SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			3,
			'algorithm32-facade-receiver-diffuse-horizontal',
		);
		const radiance = spectralPacket(
			SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			SPECTRAL_UNITS.RADIANCE_DENSITY,
			0,
			'algorithm32-facade-receiver-radiance-placeholder',
		);
		const measured = await algorithm32._publishReceiverEnvironmentLight({
			identity: 'algorithm32-facade-receiver-cache-generation',
			sampleIncomingRadiance: (directions) => directions.map(() => radiance),
			reduceIncomingRadiance: () => diffuse,
		});

		expect(measured.directNormal).toBe(initial.directNormal);
		expect(measured.directHorizontal).toBe(initial.directHorizontal);
		expect(measured.diffuseHorizontal).toBe(diffuse);
		expect(measured.totalHorizontal.values.every((value) => value === 4)).toBeTrue();
		expect(algorithm32.receiverLight).toBe(measured);
		expect(algorithm32.brightnessProxy).toEqual(measured.totalHorizontalLuminanceProxy);
		expect(algorithm32.totalHorizontalIlluminance).toEqual(measured.photopicTotalHorizontalIlluminance);
		algorithm32.dispose();
	});

	it('creates config snapshots with direct accepted config and version', /** Called by Jasmine to exercise the named behavior. */ () => {
		const config = createConfig();
		const algorithm32 = new Algorithm32(config);
		const snapshot = algorithm32.config;

		expect(snapshot.version).toBe(1);
		expect(snapshot.config.lightSource).toBe(config.lightSource);
		expect(snapshot.config.atmosphere).toBe(config.atmosphere);
		expect(snapshot.config.geometry).toBe(config.geometry);
		const profile = algorithm32._model.profile;
		expect(profile.kind).toBe('algorithm32-execution-profile');
		expect(profile.spectral.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(profile.models.lightSource).toBe(config.lightSource);
		expect(profile.models.atmosphere).toBe(config.atmosphere);
		expect(profile.models.geometry).toBe(config.geometry);
		expect(profile.models.groundBoundary).toBeNull();
		expect(snapshot.config.celestialSources).toBeNull();
		expect(profile.models.celestialSources).toBeNull();
		expect(algorithm32._model.celestialSources).toBeNull();
		expect(profile.models.sourcePlacement).toEqual({
			kind: 'geometry-observation',
			observation: snapshot.config.observation,
		});
		expect(profile.numerical.viewPath).toEqual({intervalCount: 1, sampleDistribution: null});
		expect(profile.numerical.cacheConstruction.maximumScatteringOrder).toBe(4);
		expect(profile.domains.positions.count).toBe(48);
		expect(profile.domains.outgoingDirections).toBe(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER);
		algorithm32.dispose();
	});

	it('normalizes one enabled roster into the profile and keys identity only when enabled', /** Called by Jasmine to exercise the named behavior. */ () => {
		const omitted = new Algorithm32(createConfig('celestial-identity'));
		const explicitNull = new Algorithm32({...createConfig('celestial-identity'), celestialSources: null});
		const enabledConfig = createCelestialConfig('celestial-identity', 'celestial-roster-a');
		const enabled = new Algorithm32(enabledConfig);
		const changed = new Algorithm32(createCelestialConfig('celestial-identity', 'celestial-roster-b'));

		expect(explicitNull._model.profile.contentHash).toBe(omitted._model.profile.contentHash);
		expect(enabled.config.config.celestialSources).toBe(enabledConfig.celestialSources);
		expect(enabled._model.profile.models.celestialSources).toBe(enabledConfig.celestialSources);
		expect(enabled._model.celestialSources).toBe(enabledConfig.celestialSources);
		expect(enabled._model.profile.contentHash).not.toBe(omitted._model.profile.contentHash);
		expect(changed._model.profile.contentHash).not.toBe(enabled._model.profile.contentHash);

		changed.dispose();
		enabled.dispose();
		explicitNull.dispose();
		omitted.dispose();
	});

	it('retains an explicit profile and installs its exact geometry placement', /** Called by Jasmine to exercise the named behavior. */ () => {
		const seed = new Algorithm32(createConfig('profile-seed'));
		const seedProfile = seed._model.profile;
		const models = createModels('explicit');
		const placement = {
			kind: /** @type {const} */ ('distant-direction'),
			directionToLight: /** @type {UnitVector3} */ ([0, 0, 1]),
		};
		const profile = {
			...seedProfile,
			numerical: {
				...seedProfile.numerical,
				cacheConstruction: {
					...seedProfile.numerical.cacheConstruction,
					maximumScatteringOrder: /** @type {const} */ (5),
				},
			},
			models: {
				...models,
				groundBoundary: null,
				celestialSources: null,
				sourcePlacement: {
					kind: /** @type {const} */ ('explicit-geometry-placement'),
					observation: createConfig().observation,
					placement,
				},
			},
		};
		const algorithm32 = new Algorithm32({profile});

		expect(algorithm32.config.config.profile).toBe(profile);
		expect(algorithm32._model.profile).toBe(profile);
		expect(algorithm32._model.lightSource).toBe(models.lightSource);
		expect(algorithm32._model.atmosphere).toBe(models.atmosphere);
		expect(algorithm32._model.geometry).toBe(models.geometry);
		expect(profile.models.sourcePlacement.placement).toBe(placement);
		expect(algorithm32._model.profile.numerical.cacheConstruction.maximumScatteringOrder).toBe(5);
		algorithm32.dispose();
		seed.dispose();
	});

	it('rejects a mixed or invalid explicit profile before geometry placement', /** Called by Jasmine to exercise the named behavior. */ () => {
		const seed = new Algorithm32(createConfig('rejection-seed'));
		const models = createModels('rejected');
		const configureLightSource = jasmine.createSpy('configureLightSource');
		models.geometry.configureLightSource = configureLightSource;
		const invalidProfile = {
			...seed._model.profile,
			contentHash: 'not-a-hash',
			models: {
				...models,
				groundBoundary: null,
				sourcePlacement: seed._model.profile.models.sourcePlacement,
			},
		};

		expect(
			/** Invoke invalid explicit profile construction. */ () => new Algorithm32({profile: invalidProfile}),
		).toThrowError(/contentHash/);
		expect(configureLightSource).not.toHaveBeenCalled();
		expect(
			/** Invoke mixed-form construction. */ () =>
				new Algorithm32({profile: seed._model.profile, observation: createConfig().observation}),
		).toThrowError(/cannot be mixed/);
		expect(
			/** Invoke mixed celestial profile construction. */ () =>
				new Algorithm32({profile: seed._model.profile, celestialSources: null}),
		).toThrowError(/cannot be mixed/);
		const {celestialSources: _celestialSources, ...modelsWithoutCelestialSources} = seed._model.profile.models;
		expect(
			/** Invoke incomplete explicit profile construction. */ () =>
				new Algorithm32({
					profile: {
						...seed._model.profile,
						models: modelsWithoutCelestialSources,
					},
				}),
		).toThrowError(/nullable celestialSources/);
		expect(
			/** Invoke undefined-roster explicit profile construction. */ () =>
				new Algorithm32({
					profile: {
						...seed._model.profile,
						models: {
							...seed._model.profile.models,
							celestialSources: undefined,
						},
					},
				}),
		).toThrowError(/roster object or null/);
		seed.dispose();
	});

	it('accepts an optional configured Color instance at facade creation', /** Called by Jasmine to exercise the named behavior. */ () => {
		const color = {
			/**
			 * Call this method to convert.
			 * @returns - The result produced by the operation.
			 */ convert() {
				return {rgba: [1, 1, 1, 1]};
			},
		};
		const algorithm32 = new Algorithm32({
			...createConfig(),
			color,
		});

		expect(algorithm32.config.config.color).toBe(color);
	});

	it('defaults only omitted optional config sections', /** Called by Jasmine to exercise the named behavior. */ () => {
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

	it('replaces config as a full lifecycle version update', /** Called by Jasmine to exercise the named behavior. */ () => {
		const algorithm32 = new Algorithm32(createConfig('first'));
		const nextConfig = createConfig('second');
		const nextSnapshot = algorithm32.setConfig(nextConfig);

		expect(nextSnapshot.version).toBe(2);
		expect(nextSnapshot.config.lightSource).toBe(nextConfig.lightSource);
		expect(algorithm32.config.version).toBe(2);
	});

	it('accepts N1, N2, and N4 while resolving omission to N4', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const maximumScatteringOrder of [1, 2, 4]) {
			const algorithm32 = new Algorithm32({
				...createConfig(),
				execution: {maximumScatteringOrder},
			});
			expect(algorithm32.config.config.execution.maximumScatteringOrder).toBe(maximumScatteringOrder);
			algorithm32.dispose();
		}

		for (const maximumScatteringOrder of [0, 3, 5]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () =>
					new Algorithm32({
						...createConfig(),
						execution: {maximumScatteringOrder},
					}),
			).toThrowError(/maximumScatteringOrder/);
		}
	});

	it('accepts only supported semantic execution values at facade ingress', /** Called by Jasmine to exercise the named behavior. */ () => {
		const algorithm32 = new Algorithm32({
			...createConfig(),
			execution: {
				pathIntervalCount: 12,
				sourceTransmittanceIntervalCount: 8,
				pathSampleDistribution: {kind: 'tangent-density-adaptive-soft-v1'},
			},
		});

		expect(algorithm32.config.config.execution).toEqual({
			pathIntervalCount: 12,
			sourceTransmittanceIntervalCount: 8,
			pathSampleDistribution: {kind: 'tangent-density-adaptive-soft-v1'},
			maximumScatteringOrder: 4,
		});
		algorithm32.dispose();

		for (const [name, value] of [
			['pathIntervalCount', 0],
			['pathIntervalCount', 1.5],
			['sourceTransmittanceIntervalCount', Number.POSITIVE_INFINITY],
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () =>
					new Algorithm32({
						...createConfig(),
						execution: {[name]: value},
					}),
			).toThrowError(new RegExp(name));
		}

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new Algorithm32({
					...createConfig(),
					execution: {
						pathSampleDistribution: {kind: 'unsupported'},
					},
				}),
		).toThrowError(/pathSampleDistribution/u);
	});

	it('delegates CPU/reference evaluation through the configured reference collaborator', /** Called by Jasmine to exercise the named behavior. */ () => {
		const algorithm32 = new Algorithm32(createConfig());
		const result = algorithm32.evaluate({
			scatteringCache: {
				sampleProvenanceIdentity: 'algorithm32-facade-cumulative-cache',
				/**
				 * Call this method to sample resolved.
				 * @returns - The result produced by the operation.
				 */ sampleCumulativeScatteringDensity() {
					return spectralPacket(
						SPECTRAL_QUANTITIES.SCATTERING_DENSITY,
						SPECTRAL_UNITS.SCATTERING_DENSITY,
						0,
						'algorithm32-facade-cumulative-cache',
					);
				},
				/** Call this method to dispose. */ dispose() {},
			},
		});

		expect(result.pathRadiance.values).toEqual(Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(0));
		expect(result.pathRadiance.units).toBe(SPECTRAL_UNITS.RADIANCE_DENSITY);
		expect(result.transmittance.values).toEqual(Array(NATIVE_15_SPECTRAL_BASIS.channelCount).fill(1));
		expect(result.transmittance.units).toBe(SPECTRAL_UNITS.DIMENSIONLESS);
		expect(result.viewRaySegment.endDistance).toEqual(distance(0));
	});

	it('builds an awaited shader handle through setup-time attachment', /**
	 * Called by Jasmine to exercise the named behavior. A rejected promise fails the active spec, and Jasmine cannot cancel the callback once it has started.
	 */ async () => {
		const algorithm32 = new Algorithm32(createConfig());
		const handle = await algorithm32.setupShader({
			composer: {},
			scene: {},
			camera: {},
			viewportSize: {width: 1, height: 1, units: 'pixels'},
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

	it('keeps low-level assembly inputs out of the public setup surface', /** Called by Jasmine to exercise the named behavior. */ () => {
		const algorithm32 = new Algorithm32(createConfig());
		const bindingValues = {'runtime.test': 2};
		const setup = /** @type {ShaderSetupRequest} */ ({
			composer: {},
			scene: {},
			camera: {},
			viewportSize: {width: 1, height: 1, units: 'pixels'},
			cacheBackend: {},
			bindingValues,
		});
		Object.assign(setup, {
			contributions: [{id: 'caller-contribution'}],
			mainRequiredSymbols: ['caller.main'],
			systemProvidedSymbols: ['caller.system'],
		});

		const buildRequest = algorithm32._createShaderBuildRequest(setup, algorithm32.config);

		expect(buildRequest.bindingValues).not.toBe(bindingValues);
		expect(buildRequest.bindingValues['runtime.test']).toBe(2);
		expect(buildRequest.bindingValues['color.exposureModifier']).toBe(1);
		bindingValues['runtime.test'] = 3;
		expect(buildRequest.bindingValues['runtime.test']).toBe(3);
		expect(buildRequest.contributions).toBeUndefined();
		expect(buildRequest.mainRequiredSymbols).toBeUndefined();
		expect(buildRequest.systemProvidedSymbols).toBeUndefined();
	});

	it('fails loudly for deferred debug views and disposed operations', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new Algorithm32({
					...createConfig(),
					shader: {
						debugView: 'experiment-only',
					},
				}),
		).toThrowError(/debug views are deferred/);

		const algorithm32 = new Algorithm32(createConfig());
		algorithm32.dispose();

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => algorithm32.config,
		).toThrowError(/disposed/);
	});
});
