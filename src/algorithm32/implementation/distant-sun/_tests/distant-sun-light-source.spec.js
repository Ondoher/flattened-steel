import * as THREE from 'three';

import {DistantSunCacheController} from '../cache/DistantSunCacheController.js';
import {DistantSunLightSource} from '../DistantSunLightSource.js';
import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../../profiles/index.js';
import {createTestSourceIrradiance} from '../../../light-source-support/_tests/spectral-test-values.js';

describe('DistantSunLightSource', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains an explicitly supplied aligned source packet', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sourceIrradiance = createTestSourceIrradiance([1, 2, 3]);
		const source = new DistantSunLightSource({
			angularRadius: {value: 0.004, units: 'radians'},
			sourceIrradiance,
		});
		source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [1, 0, 0]});

		expect(source.configuration.sourceIrradiance).toBe(sourceIrradiance);
		expect(source.sampleDirectLighting().sourceIrradiance).toBe(sourceIrradiance);
	});

	it('accepts one geometry placement, treats its exact repeat as a no-op, and rejects replacement', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new DistantSunLightSource({
			angularRadius: {value: 0.004, units: 'radians'},
		});
		const placement = /** @type {GeometryResolvedLightSourcePlacement} */ ({
			kind: 'distant-direction',
			directionToLight: [1, 0, 0],
		});

		expect(source.geometryPlacementKind).toBe('distant-direction');
		source.configureGeometryPlacement(placement);
		const configuration = source.configuration;
		source.configureGeometryPlacement(placement);
		expect(source.configuration).toBe(configuration);
		expect(
			/** Invoke a forbidden replacement placement. */ () =>
				source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [0, 1, 0]}),
		).toThrowError(/replace/);
		expect(source.configuration).toBe(configuration);
	});

	it('rejects an incompatible geometry placement before accepting a valid one', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new DistantSunLightSource({
			angularRadius: {value: 0.004, units: 'radians'},
		});

		expect(
			/** Invoke an incompatible placement family. */ () =>
				source.configureGeometryPlacement({
					kind: 'finite-position',
					position: {coordinates: [1, 0, 0], units: 'meters'},
				}),
		).toThrowError(/distant-direction/);
		source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [1, 0, 0]});
		expect(source.configuration.directionToLight).toEqual([1, 0, 0]);
	});
	it('exposes the configured distant source directly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();

		expect(source.id).toBe('distant-sun');
		expect(source.configuration.directionToLight).toEqual([1, 0, 0]);
		expect(source.configuration.angularRadius).toEqual({value: 0.004, units: 'radians'});
		expect(source.configuration.sourceIrradiance).toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
	});

	it('exposes one derived celestial view without changing atmospheric source facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const observation = /** @type {GeometryObservation} */ (
			/** @type {unknown} */ ({instant: '2024-06-21T03:26:03.503Z'})
		);
		const definition = source.celestialSourceDefinition;
		const expectedSolidAngle = 2 * Math.PI * (1 - Math.cos(0.004));

		expect(source.kind).toBe('distant-uniform-sun');
		expect(definition.id).toBe(source.id);
		expect(definition.angularRadius).toBe(source.configuration.angularRadius);
		expect(definition.profile).toBe('uniform-disk');
		expect(definition.surfaceRadiance.values[0]).toBeCloseTo(
			source.sourceIrradiance.values[0] / expectedSolidAngle,
			12,
		);
		expect(source.celestialSourceDefinition).toBe(definition);
		expect(source.createCelestialPlacementState(observation)).toEqual({
			sourceId: source.id,
			kind: 'distant-uniform-sun',
			observation,
		});
		expect(source.createCelestialCacheFragment(/** @type {CelestialCacheBuildRequest} */ ({}))).toEqual({
			sourceId: source.id,
			sourceKind: 'distant-uniform-sun',
			quantity: 'spectral-radiance-density',
			units: 'W m^-2 sr^-1 nm^-1',
			channelCount: 15,
			support: {
				angularRadius: definition.angularRadius,
				profile: 'uniform-disk',
			},
		});
		expect(source.describeCelestialSourceIdentity()).toEqual({
			id: source.id,
			kind: 'distant-uniform-sun',
			definitionHash: jasmine.stringMatching(/^sha256:[0-9a-f]{64}$/),
		});
	});

	it('preserves zero-radius atmospheric construction while rejecting unsupported celestial access', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new DistantSunLightSource({angularRadius: {value: 0, units: 'radians'}});
		source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [1, 0, 0]});

		expect(source.configuration.angularRadius.value).toBe(0);
		expect(
			/** Read the unsupported zero-area celestial definition. */ () => source.celestialSourceDefinition,
		).toThrowError(/positive angular radius/);
	});

	it('normalizes supported angular units at the source boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource({
			angularRadius: {value: 1, units: 'degrees'},
		});

		expect(source.configuration.angularRadius).toEqual({
			value: Math.PI / 180,
			units: 'radians',
		});
	});

	it('creates an independent cache controller for each renderer attachment', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const backend = /** @type {CacheGpuBackend} */ ({});
		const scheduler = /** @type {CacheBuildScheduler} */ ({
			/**
			 * Called by scheduler to yield control. The promise rejects if the scheduler cannot yield; this scheduling operation is not cancellable once started.
			 */ yieldControl: async () => {},
		});
		const model = /** @type {Algorithm32ExecutionModel} */ (/** @type {unknown} */ ({lightSource: source}));
		const first = source.createCacheController({model, backend, scheduler});
		const second = source.createCacheController({model, backend, scheduler});

		expect(first instanceof DistantSunCacheController).toBeTrue();
		expect(second instanceof DistantSunCacheController).toBeTrue();
		expect(second).not.toBe(first);
		expect(first.active).toBeNull();
		first.dispose();
		second.dispose();
	});

	it('contributes its accepted source direction from live configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const contribution = source.createShaderContribution();

		expect(contribution.provides).toEqual(['light.directionToAtmosphericSource']);
		expect(contribution.requires).toEqual([]);
		expect(contribution.uniforms).toEqual([
			{
				name: 'uDistantSunDirection',
				type: 'vec3',
				valueKey: 'lightSource.direction',
				defaultValue: [1, 0, 0],
			},
		]);
		expect(contribution.functions[0].code).toContain('vec3 directionToAtmosphericSource(vec3 positionMeters)');
		expect(contribution.functions[0].code).not.toContain('sampleIncidentIrradiance');
		expect(contribution.mainHooks).toEqual([]);
	});

	it('samples direct lighting and resolves an unbounded source path', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource({
			directionToLight: [10, 0, 0],
		});

		const sample = source.sampleDirectLighting();

		expect(sample.sourceIrradiance).toBe(source.configuration.sourceIrradiance);
		expect(sample.sourceIrradiance).toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
		expect(sample.sourceIrradiance.quantity).toBe('spectral-irradiance-density');
		expect(sample.sourceIrradiance.units).toBe('W m^-2 nm^-1');
		expect(sample).toEqual(
			jasmine.objectContaining({
				directionToLight: [1, 0, 0],
				metadata: {
					directionFromSource: [-1, -0, -0],
					angularRadius: {value: 0.004, units: 'radians'},
				},
			}),
		);
		expect(source.resolveSourcePathLimit()).toEqual({
			maxDistance: null,
			reason: 'distant-source-to-atmosphere-boundary',
		});
	});

	it('resolves twilight-aware neutral scene light scales', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const sunrise = source.resolveSceneLightScales({
			directionToSource: [1, 0, 0],
			observerUp: [0, 1, 0],
			twilightStartSourceUpDot: -0.2,
			fullAmbientSourceUpDot: 0.2,
		});
		const night = source.resolveSceneLightScales({
			directionToSource: [0, -1, 0],
			observerUp: [0, 1, 0],
			twilightStartSourceUpDot: -0.2,
			fullAmbientSourceUpDot: 0.2,
		});
		const daylight = source.resolveSceneLightScales({
			directionToSource: [0, 1, 0],
			observerUp: [0, 1, 0],
			twilightStartSourceUpDot: -0.2,
			fullAmbientSourceUpDot: 0.2,
		});

		expect(sunrise.sourceUpDot).toBeCloseTo(0, 12);
		expect(sunrise.directLightScale).toEqual({value: 0, units: '1'});
		expect(sunrise.ambientLightScale.value).toBeCloseTo(0.5, 12);
		expect(sunrise.ambientLightScale.units).toBe('1');
		expect(night.directLightScale).toEqual({value: 0, units: '1'});
		expect(night.ambientLightScale).toEqual({value: 0, units: '1'});
		expect(daylight.directLightScale).toEqual({value: 1, units: '1'});
		expect(daylight.ambientLightScale).toEqual({value: 1, units: '1'});
		expect(daylight.localLightScale).toEqual({value: 1, units: '1'});
		expect(daylight.policy).toBe('distant-source-twilight-aware-scene-light-scale');
	});

	it('uses the facade scene-scale operation while creating Three lighting', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const sceneLightScales = {
			directLightScale: {value: 0.75, units: '1'},
			ambientLightScale: {value: 0.25, units: '1'},
			localLightScale: {value: 0.25, units: '1'},
			sourceUpDot: 0.5,
			policy: 'test-facade-scene-scale',
		};
		const resolveSceneLightScales = spyOn(source, 'resolveSceneLightScales').and.returnValue(sceneLightScales);

		const objects = source.addSceneLighting({
			THREE,
			directionToSource: [0, 1, 0],
			ambientIntensityRange: {min: 0, max: 4},
		});

		expect(resolveSceneLightScales).toHaveBeenCalledWith(jasmine.objectContaining({directionToSource: [0, 1, 0]}));
		expect(objects.metadata.ambientIntensity).toBe(1);
		expect(objects.metadata.ambientLightScale).toBe(sceneLightScales.ambientLightScale);
	});

	it('creates source-owned Three directional lighting objects for endpoints', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createDistantSource().addSceneLighting({
			THREE,
			directionToSource: [0, 1, 0],
			focus: scenePosition(1, 2, 3),
			lightDistance: sceneDistance(10),
			intensity: 4,
			ambientIntensity: 0.5,
			shadow: {
				enabled: true,
				objects: [
					{
						focus: scenePosition(1, 2, 3),
						extent: sceneDistance(5),
						lightDistance: sceneDistance(10),
						mapSize: pixelSize(64, 32),
						normalBias: sceneDistance(0.03),
						radius: pixelDistance(2),
						shadowIntensity: 0.75,
					},
				],
			},
		});
		const ambient = objects.lights[0];
		const sourceLight = objects.lights[1];
		const target = objects.sceneObjects[0];

		expect(ambient instanceof THREE.AmbientLight).toBeTrue();
		expect(sourceLight instanceof THREE.DirectionalLight).toBeTrue();
		expect(sourceLight.position.toArray()).toEqual([1, 12, 3]);
		expect(sourceLight.intensity).toBe(4);
		expect(sourceLight.castShadow).toBeTrue();
		expect(sourceLight.shadow.mapSize.width).toBe(64);
		expect(sourceLight.shadow.mapSize.height).toBe(32);
		expect(sourceLight.shadow.normalBias).toBe(0.03);
		expect(sourceLight.shadow.radius).toBe(2);
		expect(sourceLight.shadow.intensity).toBe(0.75);
		expect(sourceLight.target).toBe(target);
		expect(target.position.toArray()).toEqual([1, 2, 3]);
		expect(sourceLight.userData).toEqual(
			jasmine.objectContaining({
				algorithm32SourceLight: true,
				sourceKey: 'distant-sun',
				lightingRole: 'source-directional-light',
				directionToSource: [0, 1, 0],
			}),
		);
		expect(objects.metadata).toEqual(
			jasmine.objectContaining({
				owner: 'DistantSunLightSource',
				lightingPolicy: 'source-driven-distant-directional-light',
				intensity: 4,
				ambientIntensity: 0.5,
				ambientIntensityRange: {
					min: 0.06,
					max: 0.5,
				},
				ambientLightScale: {value: 1, units: '1'},
				directLightScale: {value: 1, units: '1'},
				directionToSource: [0, 1, 0],
				focus: scenePosition(1, 2, 3),
				lightDistance: sceneDistance(10),
				shadowPolicy: 'three-shadow-map-from-distant-source-direction',
			}),
		);
		expect(objects.metadata.shadow).toEqual(
			jasmine.objectContaining({
				enabled: true,
				objects: [
					jasmine.objectContaining({
						mapSize: pixelSize(64, 32),
						normalBias: sceneDistance(0.03),
						radius: pixelDistance(2),
					}),
				],
			}),
		);
		expect(objects.metadata.shadowObjects).toBeUndefined();
	});

	it('requires finite ambient intensity through the public scene-lighting boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createDistantSource().addSceneLighting({
					THREE,
					ambientIntensity: Number.NaN,
				}),
		).toThrowError(/ambientIntensity.*finite/);
	});

	it('adds source-owned scene lighting to a supplied Three scene', /** Called by Jasmine to exercise the named behavior. */ () => {
		const scene = new THREE.Scene();
		const objects = createDistantSource().addSceneLighting({
			THREE,
			scene,
			directionToSource: [0, 1, 0],
			focus: scenePosition(1, 2, 3),
			intensity: 4,
			ambientIntensity: 1,
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[1] instanceof THREE.DirectionalLight).toBeTrue();
		expect(scene.children).toContain(objects.lights[0]);
		expect(scene.children).toContain(objects.lights[1]);
		expect(scene.children).toContain(objects.sceneObjects[0]);
		expect(objects.metadata.ambientIntensity).toBe(1);
		expect(objects.metadata.shadow).toEqual({enabled: false, objects: []});
	});

	it('scales ambient lighting between configured bounds with the twilight scale', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createDistantSource().addSceneLighting({
			THREE,
			directionToSource: [1, 0, 0],
			focus: scenePosition(1, 2, 3),
			ambientIntensityRange: {
				min: 0.2,
				max: 1.0,
			},
			twilightStartSourceUpDot: -0.2,
			fullAmbientSourceUpDot: 0.2,
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[0].intensity).toBeCloseTo(0.6, 12);
		expect(objects.metadata.ambientLightScale.value).toBeCloseTo(0.5, 12);
		expect(objects.metadata.ambientLightScale.units).toBe('1');
		expect(objects.metadata.ambientIntensityRange).toEqual({
			min: 0.2,
			max: 1.0,
		});
	});

	it('defaults ambient bounds to absolute scene-light intensities', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createDistantSource().addSceneLighting({
			THREE,
			directionToSource: [0, 1, 0],
			focus: scenePosition(1, 2, 3),
			intensity: 4,
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[0].intensity).toBeCloseTo(0.5, 12);
		expect(objects.metadata.ambientIntensityRange).toEqual({
			min: 0.06,
			max: 0.5,
		});
		expect(objects.metadata.ambientLightScale).toEqual({value: 1, units: '1'});
	});

	it('keeps default no-light ambient slightly above black', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createDistantSource().addSceneLighting({
			THREE,
			directionToSource: [0, -1, 0],
			focus: scenePosition(1, 2, 3),
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[0].intensity).toBeCloseTo(0.06, 12);
		expect(objects.metadata.ambientLightScale).toEqual({value: 0, units: '1'});
	});

	it('creates one source-owned directional shadow light per shadow object', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createDistantSource().addSceneLighting({
			THREE,
			directionToSource: [0, 1, 0],
			intensity: 4,
			shadow: {
				enabled: true,
				objects: [
					{
						objectKey: 'near-box',
						layerIndex: 5,
						focus: scenePosition(1, 2, 3),
						extent: sceneDistance(5),
						cameraLeft: sceneDistance(-1),
						cameraRight: sceneDistance(2),
						cameraTop: sceneDistance(3),
						cameraBottom: sceneDistance(-4),
						mapSize: pixelSize(64, 32),
						radius: pixelDistance(0),
					},
					{
						objectKey: 'far-box',
						layerIndex: 6,
						focus: scenePosition(4, 5, 6),
						extent: sceneDistance(20),
						mapSize: pixelSize(128, 64),
					},
				],
			},
		});
		const ambient = objects.lights[0];
		const firstLight = objects.lights[1];
		const secondLight = objects.lights[2];

		expect(objects.lights.length).toBe(3);
		expect(ambient instanceof THREE.AmbientLight).toBeTrue();
		expect(firstLight instanceof THREE.DirectionalLight).toBeTrue();
		expect(secondLight instanceof THREE.DirectionalLight).toBeTrue();
		expect(firstLight.intensity).toBeCloseTo(2);
		expect(secondLight.intensity).toBeCloseTo(2);
		expect(firstLight.castShadow).toBeTrue();
		expect(secondLight.castShadow).toBeTrue();
		expect(firstLight.shadow.intensity).toBe(2);
		expect(secondLight.shadow.intensity).toBe(2);
		expect(firstLight.shadow.camera.left).toBe(-1);
		expect(firstLight.shadow.camera.right).toBe(2);
		expect(firstLight.shadow.camera.top).toBe(3);
		expect(firstLight.shadow.camera.bottom).toBe(-4);
		expect(firstLight.shadow.radius).toBe(0);
		expect(firstLight.shadow.mapSize.width).toBe(64);
		expect(firstLight.shadow.mapSize.height).toBe(32);
		expect(secondLight.shadow.mapSize.width).toBe(128);
		expect(secondLight.shadow.mapSize.height).toBe(64);
		expect(secondLight.shadow.camera.left).toBe(-20);
		expect(firstLight.shadow.camera.layers.mask).toBe(1 << 5);
		expect(secondLight.shadow.camera.layers.mask).toBe(1 << 6);
		expect(firstLight.userData.shadowObjectKey).toBe('near-box');
		expect(secondLight.userData.shadowObjectKey).toBe('far-box');
		expect(objects.sceneObjects[0].position.toArray()).toEqual([1, 2, 3]);
		expect(objects.sceneObjects[1].position.toArray()).toEqual([4, 5, 6]);
		expect(objects.metadata.shadow.objects.length).toBe(2);
		expect(objects.metadata.shadowObjects).toBeUndefined();
	});

	it('rejects removed singleton shadow fields and untyped shadow measurements', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const baseRequest = {
			THREE,
			directionToSource: [0, 1, 0],
			focus: scenePosition(1, 2, 3),
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {
						enabled: true,
						objects: [{}],
						mapSize: pixelSize(64, 64),
					},
				}),
		).toThrowError(/not part of the canonical shadow contract/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {
						enabled: true,
						objects: [{mapSize: 64}],
					},
				}),
		).toThrowError(/mapSize.*pixels/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {
						enabled: true,
						objects: [{normalBias: 0.02}],
					},
				}),
		).toThrowError(/normalBias.*scene-units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {
						enabled: true,
						objects: [{radius: 1}],
					},
				}),
		).toThrowError(/radius.*pixels/);
	});

	it('rejects explicit null optional lighting and shadow values', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const baseRequest = {
			THREE,
			directionToSource: [0, 1, 0],
			focus: scenePosition(1, 2, 3),
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => source.addSceneLighting({...baseRequest, focus: null}),
		).toThrowError(/focus.*scene-units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => source.addSceneLighting({...baseRequest, lightDistance: null}),
		).toThrowError(/lightDistance.*scene-units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => source.addSceneLighting({...baseRequest, shadow: null}),
		).toThrowError(/shadow/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {enabled: true, objects: [{objectKey: null}]},
				}),
		).toThrowError(/objectKey/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {enabled: true, objects: [{mapSize: null}]},
				}),
		).toThrowError(/mapSize.*pixels/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {enabled: true, objects: [{radius: null}]},
				}),
		).toThrowError(/radius.*pixels/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					shadow: {enabled: true, objects: [{layerIndex: null}]},
				}),
		).toThrowError(/layerIndex/);
	});

	it('rejects inconsistent shadow camera and extent requests', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		/**
		 * Called by add shadow to add shadow.
		 * @param shadowObject - The shadow object value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const addShadow = (shadowObject) =>
			source.addSceneLighting({
				THREE,
				directionToSource: [0, 1, 0],
				shadow: {enabled: true, objects: [shadowObject]},
			});

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => addShadow({extent: sceneDistance(0)}),
		).toThrowError(/extent.*greater than zero/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				addShadow({
					extent: sceneDistance(20),
					lightDistance: sceneDistance(20),
				}),
		).toThrowError(/lightDistance.*twice/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => addShadow({cameraNear: sceneDistance(0)}),
		).toThrowError(/cameraNear.*greater than zero/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				addShadow({
					cameraNear: sceneDistance(2),
					cameraFar: sceneDistance(2),
				}),
		).toThrowError(/cameraFar.*cameraNear/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				addShadow({
					cameraLeft: sceneDistance(1),
					cameraRight: sceneDistance(1),
				}),
		).toThrowError(/cameraRight.*cameraLeft/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				addShadow({
					cameraBottom: sceneDistance(1),
					cameraTop: sceneDistance(1),
				}),
		).toThrowError(/cameraTop.*cameraBottom/);
	});

	it('configures app-authored Three objects for distant source shadows', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createDistantSource();
		const group = new THREE.Group();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

		group.add(mesh);

		expect(source.configureThreeShadowObject(group)).toBe(group);
		expect(group.castShadow).toBeTrue();
		expect(group.receiveShadow).toBeTrue();
		expect(mesh.castShadow).toBeTrue();
		expect(mesh.receiveShadow).toBeTrue();
		expect(mesh.userData).toEqual(
			jasmine.objectContaining({
				algorithm32ShadowObject: true,
				shadowPolicy: 'three-shadow-map-from-distant-source-direction',
				shadowSourceKey: 'distant-sun',
			}),
		);
		expect(group.userData.algorithm32ShadowConfiguration).toEqual(
			jasmine.objectContaining({
				owner: 'DistantSunLightSource',
				sourceKey: 'distant-sun',
				shadowPolicy: 'three-shadow-map-from-distant-source-direction',
				configuredNodeCount: 2,
			}),
		);
	});

	it('fails loudly for invalid source configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => new DistantSunLightSource(),
		).toThrowError(/configuration/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createDistantSource({directionToLight: [0, 0, 0]}),
		).toThrowError(/non-zero/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createDistantSource().resolveSceneLightScales({
					twilightStartSourceUpDot: Number.NaN,
				}),
		).toThrowError(/twilightStartSourceUpDot.*finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createDistantSource().addSceneLighting({
					THREE,
					intensity: Number.POSITIVE_INFINITY,
				}),
		).toThrowError(/intensity.*finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createDistantSource().addSceneLighting({
					THREE,
					ambientIntensityRange: {min: 0, max: Number.NaN},
				}),
		).toThrowError(/ambientIntensityRange\.max.*finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createDistantSource().addSceneLighting({
					THREE,
					ambientIntensityRange: {min: -0.1, max: 1},
				}),
		).toThrowError(/ambientIntensityRange\.min.*non-negative/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createDistantSource().addSceneLighting({
					THREE,
					ambientIntensityRange: {min: 1, max: 0.5},
				}),
		).toThrowError(/ambientIntensityRange\.max.*min/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createDistantSource().addSceneLighting(),
		).toThrowError(/THREE/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createDistantSource().configureThreeShadowObject(null),
		).toThrowError(/Three object/);
	});
});

/**
 * Called by this module to create distant source.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createDistantSource(overrides = {}) {
	const {directionToLight = [1, 0, 0], ...intrinsicOverrides} = overrides;
	const source = new DistantSunLightSource({
		angularRadius: {value: 0.004, units: 'radians'},
		...intrinsicOverrides,
	});
	source.configureGeometryPlacement({kind: 'distant-direction', directionToLight});

	return source;
}

/**
 * Called by this module to scene distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function sceneDistance(value) {
	return {value, units: 'scene-units'};
}

/**
 * Called by this module to pixel distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function pixelDistance(value) {
	return {value, units: 'pixels'};
}

/**
 * Called by this module to pixel size.
 * @param width - The width value accepted by the operation.
 * @param height - The height value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function pixelSize(width, height) {
	return {width, height, units: 'pixels'};
}

/**
 * Called by this module to scene position.
 * @param x - The x value accepted by the operation.
 * @param y - The y value accepted by the operation.
 * @param z - The z value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function scenePosition(x, y, z) {
	return {coordinates: [x, y, z], units: 'scene-units'};
}
