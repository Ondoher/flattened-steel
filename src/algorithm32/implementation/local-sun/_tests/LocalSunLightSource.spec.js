import * as THREE from 'three';

import {LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID} from '../consts.js';
import {LocalSunShellFactCache} from '../cache/LocalSunShellFactCache.js';
import {LocalSunLightSource} from '../LocalSunLightSource.js';
import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from '../../../profiles/index.js';
import {createTestSourceIrradiance} from '../../../light-source-support/_tests/spectral-test-values.js';

describe('LocalSunLightSource', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains and neutrally scales an explicitly supplied aligned source packet', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sourceIrradiance = createTestSourceIrradiance([1, 2, 3]);
		const source = new LocalSunLightSource({
			sourceKey: 'custom-spectrum-local',
			sourceIrradiance,
			referenceDistance: distance(10),
			referenceSpectralIncidentScale: 2,
			radius: distance(1),
			distanceFalloff: false,
		});
		source.configureGeometryPlacement({
			kind: 'finite-position',
			position: {coordinates: [4_800_000, 0, 4_800_000], units: 'meters'},
		});
		const sample = source.sampleDirectLighting({
			sourceRelativePosition: {directionToSource: [1, 0, 0], distanceFromSource: distance(10)},
		});

		expect(source.configuration.sourceIrradiance).toBe(sourceIrradiance);
		expect(sample.sourceIrradiance.basis).toBe(sourceIrradiance.basis);
		expect(sample.sourceIrradiance.values).toEqual([2, 4, 6]);
	});

	it('accepts one geometry placement, treats its exact repeat as a no-op, and rejects replacement', /** Called by Jasmine to exercise the named behavior. */ () => {
		const position = {coordinates: [4_800_000, 0, 4_800_000], units: 'meters'};
		const source = new LocalSunLightSource({
			sourceKey: 'binding-local',
			referenceDistance: distance(10),
			referenceSpectralIncidentScale: 2,
			radius: distance(1),
			distanceFalloff: true,
		});
		const placement = /** @type {GeometryResolvedLightSourcePlacement} */ ({kind: 'finite-position', position});

		expect(source.geometryPlacementKind).toBe('finite-position');
		source.configureGeometryPlacement(placement);
		const configuration = source.configuration;
		source.configureGeometryPlacement(placement);
		expect(source.configuration).toBe(configuration);
		expect(
			/** Invoke a forbidden replacement placement. */ () =>
				source.configureGeometryPlacement({
					kind: 'finite-position',
					position: {coordinates: [4_799_999, 0, 4_800_000], units: 'meters'},
				}),
		).toThrowError(/replace/);
		expect(source.configuration).toBe(configuration);
	});

	it('rejects an incompatible geometry placement before accepting a valid one', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = new LocalSunLightSource({
			sourceKey: 'binding-family-local',
			referenceDistance: distance(10),
			referenceSpectralIncidentScale: 2,
			radius: distance(1),
			distanceFalloff: true,
		});

		expect(
			/** Invoke an incompatible placement family. */ () =>
				source.configureGeometryPlacement({kind: 'distant-direction', directionToLight: [1, 0, 0]}),
		).toThrowError(/finite-position/);
		source.configureGeometryPlacement({
			kind: 'finite-position',
			position: {coordinates: [4_800_000, 0, 4_800_000], units: 'meters'},
		});
		expect(source.configuration.position.coordinates).toEqual([4_800_000, 0, 4_800_000]);
	});
	it('exposes the configured finite point source directly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();

		expect(source.id).toBe('test-local');
		expect(source.configuration).toEqual(
			jasmine.objectContaining({
				sourceKey: 'test-local',
				position: {
					coordinates: [4_800_000, 0, 4_800_000],
					units: 'meters',
				},
				referenceDistance: distance(10),
				radius: distance(1),
				distanceFalloff: true,
				sourceTransmittanceIntervalCount: 15,
			}),
		);
		expect(source.configuration.sourceIrradiance).toBe(NATIVE_SOURCE_IRRADIANCE_DENSITY);
	});

	it('shares one configured finite-disk definition with the celestial path', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const definition = source.celestialSourceDefinition;
		const referenceSolidAngle = 2 * Math.PI * (1 - Math.sqrt(1 - 1 / 100));

		expect(source.kind).toBe('finite-local-sun');
		expect(definition).toEqual(
			jasmine.objectContaining({
				id: 'test-local',
				kind: 'finite-local-sun',
				radius: distance(1),
				centerHeight: distance(4_800_000),
				profile: 'uniform-disk',
			}),
		);
		expect(definition.surfaceRadiance.values).toEqual(
			NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map((value) => (value * 2) / referenceSolidAngle),
		);
		expect(source.celestialSourceDefinition).toBe(definition);
		expect(source.createCelestialPlacementState(createObservation())).toEqual({
			sourceId: 'test-local',
			kind: 'finite-local-sun',
			frame: 'celestial-rh-v1',
			epoch: {instant: '2026-03-20T12:00:00.000Z', timeScale: 'utc'},
			position: source.configuration.position,
		});
	});

	it('contributes cumulative-cache-only local-source identity to final-view assembly', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const contribution = source.createShaderContribution();

		expect(contribution).toEqual(
			jasmine.objectContaining({
				id: LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID,
				owner: 'lightSource',
				provides: [],
				requires: [],
				functions: [],
				mainHooks: [],
				diagnostics: {
					mode: 'cumulative-cache-only',
					sourceKey: 'test-local',
					directViewTerm: false,
				},
			}),
		);
	});

	it('creates an attachment-owned local GPU cache controller', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const controller = source.createCacheController({
			backend: /** @type {any} */ ({
				capabilities: {
					id: 'local-source-spec-backend',
				},
			}),
		});

		expect(controller.active).toBeNull();
		controller.dispose();
	});

	it('samples direct lighting with finite-distance falloff', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const sample = source.sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 0, 2],
			},
		});

		expect(sample.sourceIrradiance.values).toEqual(
			NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map((value) => value * 0.5),
		);
		expect(sample.sourceIrradiance.quantity).toBe('spectral-irradiance-density');
		expect(sample.sourceIrradiance.units).toBe('W m^-2 nm^-1');
		expect(sample.directionToLight).toEqual([0, 0, 1]);
		expect(sample.metadata).toEqual(
			jasmine.objectContaining({
				sourceKey: 'test-local',
				distanceFromSource: distance(20),
				safeDistance: distance(20),
				radius: distance(1),
				referenceDistance: distance(10),
				referenceSpectralIncidentScale: 2,
				falloffScale: 0.25,
				incidentScale: 0.5,
				distanceClampedToRadius: false,
				spectralScaleKind: 'neutral-no-tint',
			}),
		);
	});

	it('keeps shell facts construction-owned while public lighting stays continuous', /** Called by Jasmine to exercise the named behavior. */ () => {
		const position = {
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		};
		const source = createLocalSource({
			position,
			referenceDistance: distance(4_800_000),
			referenceSpectralIncidentScale: 1,
			radius: distance(25_749.504),
		});
		const facts = new LocalSunShellFactCache({
			sourceConfiguration: source.configuration,
		});
		const distanceFromSource = 0.5 * (facts.boundaries[1] + facts.boundaries[2]);
		const request = {
			sourceRelativePosition: {
				distanceFromSource: distance(distanceFromSource),
				directionToSource: [0, 0, 1],
			},
		};
		const continuous = source.sampleDirectLighting(request);

		expect(continuous.metadata).not.toEqual(
			jasmine.objectContaining({
				constructionLightKind: 'shell-held-arithmetic-mean',
			}),
		);
		expect(facts.id).toBe('algorithm32-local-sun-shell-facts');
		expect(facts.shellCount).toBe(2_048);
	});

	it('normalizes supported distance units once at source and sample boundaries', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource({
			position: {
				coordinates: [4_800, 0, 4_800],
				units: 'kilometers',
			},
			referenceDistance: {value: 0.01, units: 'kilometers'},
			radius: {value: 0.001, units: 'kilometers'},
		});
		const sample = source.sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: {value: 0.02, units: 'kilometers'},
				directionToSource: [0, 0, 1],
			},
		});

		expect(source.configuration.position).toEqual({
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		});
		expect(source.configuration.referenceDistance).toEqual(distance(10));
		expect(source.configuration.radius).toEqual(distance(1));
		expect(sample.sourceIrradiance.values).toEqual(
			NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map((value) => value * 0.5),
		);
		expect(sample.metadata.distanceFromSource).toEqual(distance(20));
	});

	it('supports radius clamping and disabled distance falloff', /** Called by Jasmine to exercise the named behavior. */ () => {
		const clamped = createLocalSource().sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(0.5),
				directionToSource: [0, 1, 0],
			},
		});
		const noFalloff = createLocalSource({distanceFalloff: false}).sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
		});

		expect(clamped.sourceIrradiance.values).toEqual(
			NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map((value) => value * 200),
		);
		expect(clamped.metadata).toEqual(
			jasmine.objectContaining({
				safeDistance: distance(1),
				distanceClampedToRadius: true,
				incidentScale: 200,
			}),
		);
		expect(noFalloff.sourceIrradiance.values).toEqual(
			NATIVE_SOURCE_IRRADIANCE_DENSITY.values.map((value) => value * 2),
		);
		expect(noFalloff.metadata).toEqual(
			jasmine.objectContaining({
				falloffScale: 1,
				incidentScale: 2,
			}),
		);
	});

	it('resolves finite source path limits', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();

		expect(
			source.resolveSourcePathLimit({
				sourceRelativePosition: {distanceFromSource: distance(20)},
			}),
		).toEqual({
			maxDistance: distance(20),
			reason: 'finite-local-source-distance',
		});
		expect(source.resolveSourcePathLimit()).toEqual({
			maxDistance: null,
			reason: 'finite-local-source-distance',
		});
	});

	it('resolves reference-relative neutral scene light scales', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const reference = source.resolveSceneLightScales({
			sourceRelativePosition: {
				distanceFromSource: distance(10),
				directionToSource: [0, 1, 0],
			},
		});
		const halfDistanceScales = source.resolveSceneLightScales({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
		});

		expect(reference.directLightScale).toEqual({value: 1, units: '1'});
		expect(reference.ambientLightScale).toEqual({value: 1, units: '1'});
		expect(reference.localLightScale).toEqual({value: 1, units: '1'});
		expect(halfDistanceScales.directLightScale.value).toBeCloseTo(0.25, 12);
		expect(halfDistanceScales.directLightScale.units).toBe('1');
		expect(halfDistanceScales.ambientLightScale.value).toBeCloseTo(0.25, 12);
		expect(halfDistanceScales.ambientLightScale.units).toBe('1');
		expect(halfDistanceScales.localLightScale.value).toBeCloseTo(0.25, 12);
		expect(halfDistanceScales.localLightScale.units).toBe('1');
		expect(halfDistanceScales.policy).toBe('local-source-reference-incident-scene-light-scale');
	});

	it('creates source-owned Three point and ambient lights for endpoints', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			calibrationScalar: 2,
			ambientIntensity: 0.5,
			endpointSceneLightScalePolicy: 'observer-incident-scale',
		});
		const ambient = objects.lights[0];
		const pointLight = objects.lights[1];

		expect(ambient instanceof THREE.AmbientLight).toBeTrue();
		expect(pointLight instanceof THREE.PointLight).toBeTrue();
		expect(pointLight.position.toArray()).toEqual([0, 10, 0]);
		expect(pointLight.decay).toBe(0);
		expect(ambient.intensity).toBeCloseTo(0.17, 12);
		expect(pointLight.intensity).toBeCloseTo(1, 12);
		expect(pointLight.userData).toEqual(
			jasmine.objectContaining({
				algorithm32SourceLight: true,
				sourceKey: 'test-local',
				observerIncidentScale: 0.5,
				endpointSceneIncidentScale: 0.5,
				endpointSceneLightScalePolicy: 'observer-incident-scale',
			}),
		);
		expect(objects.sceneObjects).toEqual([]);
		expect(objects.metadata).toEqual(
			jasmine.objectContaining({
				owner: 'LocalSunLightSource',
				lightingPolicy: 'source-driven-flat-local-point-light',
				ambientIntensityRange: {
					min: 0.06,
					max: 0.5,
				},
				ambientLightScale: {value: 0.25, units: '1'},
				ambientIntensity: 0.16999999999999998,
				pointLightIntensity: 1,
				directionToSource: [0, 1, 0],
			}),
		);
		expect(objects.metadata.shadow).toEqual({enabled: false, objects: []});
	});

	it('scales ambient lighting between configured bounds with the local light scale', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			ambientIntensityRange: {
				min: 0.2,
				max: 1,
			},
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[0].intensity).toBeCloseTo(0.4, 12);
		expect(objects.metadata.ambientLightScale.value).toBeCloseTo(0.25, 12);
		expect(objects.metadata.ambientLightScale.units).toBe('1');
		expect(objects.metadata.ambientIntensityRange).toEqual({
			min: 0.2,
			max: 1,
		});
	});

	it('accepts a canonical endpoint indirect-fill request', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			endpointIndirectFill: {
				enabled: true,
				policy: 'opposite-directional-fill',
				intensityRatio: 0.2,
				distance: sceneDistance(50),
			},
		});

		expect(objects.lights.length).toBe(3);
		expect(objects.metadata.endpointIndirectFill).toEqual(
			jasmine.objectContaining({
				enabled: true,
				policy: 'opposite-directional-fill',
				intensityRatio: 0.2,
				distance: sceneDistance(50),
				role: 'vacuum-endpoint-opposite-directional-approximation',
			}),
		);
	});

	it('defaults ambient bounds to absolute scene-light intensities', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(10),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[0].intensity).toBeCloseTo(0.5, 12);
		expect(objects.metadata.ambientIntensityRange).toEqual({
			min: 0.06,
			max: 0.5,
		});
		expect(objects.metadata.ambientLightScale).toEqual({value: 1, units: '1'});
	});

	it('adds observer-scaled scene lighting to a supplied Three scene', /** Called by Jasmine to exercise the named behavior. */ () => {
		const scene = new THREE.Scene();
		const objects = createLocalSource().addSceneLighting({
			THREE,
			scene,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			calibrationScalar: 4,
			ambientIntensity: 1,
			endpointSceneLightScalePolicy: 'observer-incident-scale',
		});

		expect(objects.lights[0] instanceof THREE.AmbientLight).toBeTrue();
		expect(objects.lights[1] instanceof THREE.PointLight).toBeTrue();
		expect(objects.lights[0].intensity).toBeCloseTo(0.295, 12);
		expect(objects.lights[1].intensity).toBeCloseTo(2, 12);
		expect(scene.children).toContain(objects.lights[0]);
		expect(scene.children).toContain(objects.lights[1]);
		expect(objects.metadata.ambientIntensity).toBeCloseTo(0.295, 12);
	});

	it('creates source-owned Three directional shadow lights for endpoints', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			shadow: {
				enabled: true,
				objects: [
					{
						focus: scenePosition(1, 2, 3),
						extent: sceneDistance(5),
						lightDistance: sceneDistance(12),
						mapSize: pixelSize(64, 32),
						normalBias: sceneDistance(0.03),
						radius: pixelDistance(2),
						shadowIntensity: 0.75,
					},
				],
			},
		});
		const sourceLight = objects.lights[1];
		const target = objects.sceneObjects[0];
		const expectedShadowDirection = [-1 / Math.sqrt(74), 8 / Math.sqrt(74), -3 / Math.sqrt(74)];

		expect(sourceLight instanceof THREE.DirectionalLight).toBeTrue();
		expectVectorCloseTo(sourceLight.position.toArray(), [
			1 + expectedShadowDirection[0] * 12,
			2 + expectedShadowDirection[1] * 12,
			3 + expectedShadowDirection[2] * 12,
		]);
		expect(sourceLight.castShadow).toBeTrue();
		expect(sourceLight.shadow.mapSize.width).toBe(64);
		expect(sourceLight.shadow.mapSize.height).toBe(32);
		expect(sourceLight.shadow.normalBias).toBe(0.03);
		expect(sourceLight.shadow.radius).toBe(2);
		expect(sourceLight.shadow.intensity).toBe(0.75);
		expect(sourceLight.shadow.camera.left).toBe(-5);
		expect(sourceLight.target).toBe(target);
		expectVectorCloseTo(sourceLight.userData.directionToSource, expectedShadowDirection);
		expect(target.position.toArray()).toEqual([1, 2, 3]);
		expect(objects.metadata).toEqual(
			jasmine.objectContaining({
				lightingPolicy: 'source-driven-flat-local-directional-shadow-light',
				shadowPolicy: 'three-shadow-map-from-local-source-direction',
				shadowDirectionPolicy: 'per-shadow-focus-to-local-source-position',
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

	it('creates one source-owned directional shadow light per shadow object', /** Called by Jasmine to exercise the named behavior. */ () => {
		const objects = createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			shadow: {
				enabled: true,
				objects: [
					{
						objectKey: 'near-box',
						layerIndex: 5,
						focus: scenePosition(1, 2, 3),
						extent: sceneDistance(5),
						mapSize: pixelSize(64, 32),
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
		const firstLight = objects.lights[1];
		const secondLight = objects.lights[2];

		expect(objects.lights.length).toBe(3);
		expect(firstLight instanceof THREE.DirectionalLight).toBeTrue();
		expect(secondLight instanceof THREE.DirectionalLight).toBeTrue();
		expect(firstLight.intensity).toBeCloseTo(secondLight.intensity);
		expect(firstLight.castShadow).toBeTrue();
		expect(secondLight.castShadow).toBeTrue();
		expect(firstLight.shadow.intensity).toBe(2);
		expect(secondLight.shadow.intensity).toBe(2);
		expect(firstLight.shadow.camera.left).toBe(-5);
		expect(secondLight.shadow.camera.left).toBe(-20);
		expect(firstLight.shadow.camera.layers.mask).toBe(1 << 5);
		expect(secondLight.shadow.camera.layers.mask).toBe(1 << 6);
		expect(firstLight.shadow.mapSize.width).toBe(64);
		expect(firstLight.shadow.mapSize.height).toBe(32);
		expect(secondLight.shadow.mapSize.width).toBe(128);
		expect(secondLight.shadow.mapSize.height).toBe(64);
		expect(firstLight.userData.shadowObjectKey).toBe('near-box');
		expect(secondLight.userData.shadowObjectKey).toBe('far-box');
		expect(objects.sceneObjects[0].position.toArray()).toEqual([1, 2, 3]);
		expect(objects.sceneObjects[1].position.toArray()).toEqual([4, 5, 6]);
		expect(objects.metadata.shadow.objects.length).toBe(2);
		expect(objects.metadata.shadowObjects).toBeUndefined();
	});

	it('rejects untyped shadow measurements', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const baseRequest = {
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
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
		const source = createLocalSource();
		const baseRequest = {
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => source.addSceneLighting({...baseRequest, sourcePosition: null}),
		).toThrowError(/sourcePosition.*scene-units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => source.addSceneLighting({...baseRequest, observerPosition: null}),
		).toThrowError(/observerPosition.*scene-units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => source.addSceneLighting({...baseRequest, endpointColorStatus: null}),
		).toThrowError(/endpointColorStatus/);
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
	});

	it('rejects invalid endpoint scaling and indirect-fill requests', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const baseRequest = {
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					endpointSceneLightScalePolicy: null,
				}),
		).toThrowError(/endpointSceneLightScalePolicy/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					endpointSceneLightScalePolicy: 'other',
				}),
		).toThrowError(/endpointSceneLightScalePolicy/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					endpointIndirectFill: {enabled: true, policy: null},
				}),
		).toThrowError(/endpointIndirectFill.policy/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					endpointIndirectFill: {enabled: true, policy: 'other'},
				}),
		).toThrowError(/endpointIndirectFill.policy/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					endpointIndirectFill: {enabled: true, intensityRatio: -0.1},
				}),
		).toThrowError(/intensityRatio.*non-negative/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				source.addSceneLighting({
					...baseRequest,
					endpointIndirectFill: {enabled: true, distance: null},
				}),
		).toThrowError(/endpointIndirectFill.distance.*scene-units/);
	});

	it('rejects inconsistent shadow camera and extent requests', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		/**
		 * Called by add shadow to add shadow.
		 * @param shadowObject - The shadow object value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const addShadow = (shadowObject) =>
			source.addSceneLighting({
				THREE,
				sourceRelativePosition: {
					distanceFromSource: distance(20),
					directionToSource: [0, 1, 0],
				},
				sourcePosition: scenePosition(0, 10, 0),
				observerPosition: scenePosition(0, 0, 0),
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

	it('configures app-authored Three objects for local source shadows', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = createLocalSource();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

		expect(
			source.configureThreeShadowObject(mesh, {
				receiveShadow: false,
				includeDescendants: false,
				layerIndex: 5,
			}),
		).toBe(mesh);
		expect(mesh.castShadow).toBeTrue();
		expect(mesh.receiveShadow).toBeFalse();
		expect(mesh.layers.mask & (1 << 5)).toBe(1 << 5);
		expect(mesh.userData).toEqual(
			jasmine.objectContaining({
				algorithm32ShadowObject: true,
				shadowPolicy: 'three-shadow-map-from-local-source-direction',
				shadowSourceKey: 'test-local',
				shadowLayerIndex: 5,
			}),
		);
		expect(mesh.userData.algorithm32ShadowConfiguration).toEqual(
			jasmine.objectContaining({
				owner: 'LocalSunLightSource',
				sourceKey: 'test-local',
				shadowPolicy: 'three-shadow-map-from-local-source-direction',
				receiveShadow: false,
				includeDescendants: false,
				configuredNodeCount: 1,
			}),
		);
	});

	it('fails loudly for invalid source configuration or lighting requests', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource({sourceKey: ''}),
		).toThrowError(/sourceKey/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource({position: null}),
		).toThrowError(/position/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource({referenceDistance: distance(0)}),
		).toThrowError(/valid ranges/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource({distanceFalloff: null}),
		).toThrowError(/distanceFalloff/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createLocalSource({
					sourceTransmittanceIntervalCount: 0,
				}),
		).toThrowError(/sourceTransmittanceIntervalCount/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource().sampleDirectLighting(),
		).toThrowError(/sourceRelativePosition/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createLocalSource().sampleDirectLighting({
					sourceRelativePosition: {
						distanceFromSource: distance(20),
						directionToSource: [0, 0, 0],
					},
				}),
		).toThrowError(/non-zero/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource().addSceneLighting({THREE}),
		).toThrowError(/sourcePosition/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createLocalSource().addSceneLighting({
					THREE,
					sourceRelativePosition: {
						distanceFromSource: distance(20),
						directionToSource: [0, 1, 0],
					},
					sourcePosition: scenePosition(0, 10, 0),
					observerPosition: scenePosition(0, 0, 0),
					calibrationScalar: Number.NaN,
				}),
		).toThrowError(/calibrationScalar.*finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createLocalSource().addSceneLighting({
					THREE,
					sourceRelativePosition: {
						distanceFromSource: distance(20),
						directionToSource: [0, 1, 0],
					},
					sourcePosition: scenePosition(0, 10, 0),
					observerPosition: scenePosition(0, 0, 0),
					ambientIntensityRange: {min: Number.POSITIVE_INFINITY, max: 1},
				}),
		).toThrowError(/ambientIntensityRange\.min.*finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createLocalSource().addSceneLighting({
					THREE,
					sourceRelativePosition: {
						distanceFromSource: distance(20),
						directionToSource: [0, 1, 0],
					},
					sourcePosition: scenePosition(0, 10, 0),
					ambientIntensityRange: {min: -0.1, max: 1},
				}),
		).toThrowError(/ambientIntensityRange\.min.*non-negative/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createLocalSource().addSceneLighting({
					THREE,
					sourceRelativePosition: {
						distanceFromSource: distance(20),
						directionToSource: [0, 1, 0],
					},
					sourcePosition: scenePosition(0, 10, 0),
					ambientIntensityRange: {min: 1, max: 0.5},
				}),
		).toThrowError(/ambientIntensityRange\.max.*min/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createLocalSource().configureThreeShadowObject(null),
		).toThrowError(/Three object/);
	});
});

/**
 * Called by this module to create local source.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createLocalSource(overrides = {}) {
	const {position = {coordinates: [4_800_000, 0, 4_800_000], units: 'meters'}, ...intrinsicOverrides} = overrides;
	const source = new LocalSunLightSource({
		sourceKey: 'test-local',
		referenceDistance: distance(10),
		referenceSpectralIncidentScale: 2,
		radius: distance(1),
		distanceFalloff: true,
		...intrinsicOverrides,
	});
	source.configureGeometryPlacement({kind: 'finite-position', position});

	return source;
}

/** Create the fixed observation used by celestial placement tests. */
function createObservation() {
	return {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: 0, units: 'degrees'},
			longitude: {value: 0, units: 'degrees'},
		},
	};
}

/**
 * Called by this module to expect vector close to.
 * @param actual - The actual value accepted by the operation.
 * @param expected - The expected value accepted by the operation.
 * @param precision - The precision value accepted by the operation.
 */
function expectVectorCloseTo(actual, expected, precision = 12) {
	expect(actual.length).toBe(expected.length);
	for (let index = 0; index < expected.length; index += 1) {
		expect(actual[index]).toBeCloseTo(expected[index], precision);
	}
}

/**
 * Called by this module to distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function distance(value) {
	return {value, units: 'meters'};
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
