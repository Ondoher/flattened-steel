import * as THREE from 'three';

import {
	LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID,
} from '../local-sun-consts.js';
import {
	createLocalSunShellFactCache,
} from '../create-local-sun-shell-fact-cache.js';
import { LocalSunLightSource } from '../LocalSunLightSource.js';
import { createTestSourceIrradiance } from './spectralTestValues.js';

describe('LocalSunLightSource', () => {
	it('describes the configured finite point source', () => {
		const source = createLocalSource();

		expect(source.id).toBe('test-local');
		expect(source.describe()).toEqual(jasmine.objectContaining({
			kind: 'local-sun-light-source',
			sourceKey: 'test-local',
			position: {
				coordinates: [4_800_000, 0, 4_800_000],
				units: 'meters',
			},
			referenceDistance: distance(10),
			radius: distance(1),
			distanceFalloff: true,
			sourceTransmittanceIntervalCount: 15,
			spectralChannelCount: 2,
		}));
	});

	it('contributes cumulative-cache-only local-source identity to final-view assembly', () => {
		const source = createLocalSource();
		const contribution =
			source.createShaderContribution({
				descriptor: {
					lightSource: {
						fingerprint:
							'test-local-source-fingerprint',
						compatibilityTags: [
							'finite-point-source',
						],
					},
				},
			});

		expect(contribution).toEqual(jasmine.objectContaining({
			id:
				LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID,
			owner: 'lightSource',
			descriptorFingerprint:
				'test-local-source-fingerprint',
			compatibilityTags: [
				'finite-point-source',
			],
			provides: [],
			requires: [],
			functions: [],
			mainHooks: [],
			diagnostics: {
				mode: 'cumulative-cache-only',
				sourceKey: 'test-local',
				directViewTerm: false,
			},
		}));
	});

	it('creates an attachment-owned local GPU cache controller', () => {
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

	it('samples direct lighting with finite-distance falloff', () => {
		const source = createLocalSource();
		const sample = source.sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 0, 2],
			},
		});

		expect(sample.sourceIrradiance.values).toEqual([0.5, 1]);
		expect(sample.sourceIrradiance.quantity).toBe('spectral-irradiance-density');
		expect(sample.sourceIrradiance.units).toBe('W m^-2 nm^-1');
		expect(sample.directionToLight).toEqual([0, 0, 1]);
		expect(sample.metadata).toEqual(jasmine.objectContaining({
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
		}));
	});

	it('describes construction facts while public lighting stays continuous', () => {
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
		const facts = createLocalSunShellFactCache({
			sourceConfiguration: source.configuration,
		});
		const distanceFromSource =
			0.5 * (facts.boundaries[1] + facts.boundaries[2]);
		const request = {
			sourceRelativePosition: {
				distanceFromSource: distance(distanceFromSource),
				directionToSource: [0, 0, 1],
			},
		};
		const continuous = source.sampleDirectLighting(request);

		expect(continuous.metadata).not.toEqual(
			jasmine.objectContaining({
				constructionLightKind:
					'shell-held-arithmetic-mean',
			}),
		);
		expect(source.describe().constructionLight)
			.toEqual(jasmine.objectContaining({
				kind: 'shell-held-arithmetic-mean',
				factIdentity: facts.descriptor.identity,
				shellCount: 2_048,
			}));
	});

	it('normalizes supported distance units once at source and sample boundaries', () => {
		const source = createLocalSource({
			position: {
				coordinates: [4_800, 0, 4_800],
				units: 'kilometers',
			},
			referenceDistance: { value: 0.01, units: 'kilometers' },
			radius: { value: 0.001, units: 'kilometers' },
		});
		const sample = source.sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: { value: 0.02, units: 'kilometers' },
				directionToSource: [0, 0, 1],
			},
		});

		expect(source.configuration.position).toEqual({
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		});
		expect(source.configuration.referenceDistance).toEqual(distance(10));
		expect(source.configuration.radius).toEqual(distance(1));
		expect(sample.sourceIrradiance.values).toEqual([0.5, 1]);
		expect(sample.metadata.distanceFromSource).toEqual(distance(20));
	});

	it('supports radius clamping and disabled distance falloff', () => {
		const clamped = createLocalSource().sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(0.5),
				directionToSource: [0, 1, 0],
			},
		});
		const noFalloff = createLocalSource({ distanceFalloff: false }).sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
		});

		expect(clamped.sourceIrradiance.values).toEqual([200, 400]);
		expect(clamped.metadata).toEqual(jasmine.objectContaining({
			safeDistance: distance(1),
			distanceClampedToRadius: true,
			incidentScale: 200,
		}));
		expect(noFalloff.sourceIrradiance.values).toEqual([2, 4]);
		expect(noFalloff.metadata).toEqual(jasmine.objectContaining({
			falloffScale: 1,
			incidentScale: 2,
		}));
	});

	it('resolves finite source path limits', () => {
		const source = createLocalSource();

		expect(source.resolveSourcePathLimit({
			sourceRelativePosition: { distanceFromSource: distance(20) },
		})).toEqual({
			maxDistance: distance(20),
			reason: 'finite-local-source-distance',
		});
		expect(source.resolveSourcePathLimit()).toEqual({
			maxDistance: null,
			reason: 'finite-local-source-distance',
		});
	});

	it('resolves reference-relative neutral scene light scales', () => {
		const source = createLocalSource();
		const reference = source.resolveSceneLightScales({
			sourceRelativePosition: {
				distanceFromSource: distance(10),
				directionToSource: [0, 1, 0],
			},
		});
		const half = source.resolveSceneLightScales({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
		});

		expect(reference.directLightScale).toEqual({ value: 1, units: '1' });
		expect(reference.ambientLightScale).toEqual({ value: 1, units: '1' });
		expect(reference.localLightScale).toEqual({ value: 1, units: '1' });
		expect(half.directLightScale.value).toBeCloseTo(0.25, 12);
		expect(half.directLightScale.units).toBe('1');
		expect(half.ambientLightScale.value).toBeCloseTo(0.25, 12);
		expect(half.ambientLightScale.units).toBe('1');
		expect(half.localLightScale.value).toBeCloseTo(0.25, 12);
		expect(half.localLightScale.units).toBe('1');
		expect(half.policy).toBe('local-source-reference-incident-scene-light-scale');
	});

	it('creates source-owned Three point and ambient lights for endpoints', () => {
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
		expect(pointLight.userData).toEqual(jasmine.objectContaining({
			algorithm32SourceLight: true,
			sourceKey: 'test-local',
			observerIncidentScale: 0.5,
			endpointSceneIncidentScale: 0.5,
			endpointSceneLightScalePolicy: 'observer-incident-scale',
		}));
		expect(objects.sceneObjects).toEqual([]);
		expect(objects.metadata).toEqual(jasmine.objectContaining({
			owner: 'LocalSunLightSource',
			lightingPolicy: 'source-driven-flat-local-point-light',
			ambientIntensityRange: {
				min: 0.06,
				max: 0.5,
			},
			ambientLightScale: { value: 0.25, units: '1' },
			ambientIntensity: 0.16999999999999998,
			pointLightIntensity: 1,
			directionToSource: [0, 1, 0],
		}));
		expect(objects.metadata.shadow).toEqual({ enabled: false, objects: [] });
	});

	it('scales ambient lighting between configured bounds with the local light scale', () => {
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

	it('accepts a canonical endpoint indirect-fill request', () => {
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
		expect(objects.metadata.endpointIndirectFill).toEqual(jasmine.objectContaining({
			enabled: true,
			policy: 'opposite-directional-fill',
			intensityRatio: 0.2,
			distance: sceneDistance(50),
			role: 'vacuum-endpoint-opposite-directional-approximation',
		}));
	});

	it('defaults ambient bounds to absolute scene-light intensities', () => {
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
		expect(objects.metadata.ambientLightScale).toEqual({ value: 1, units: '1' });
	});

	it('adds observer-scaled scene lighting to a supplied Three scene', () => {
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

	it('creates source-owned Three directional shadow lights for endpoints', () => {
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
				objects: [{
					focus: scenePosition(1, 2, 3),
					extent: sceneDistance(5),
					lightDistance: sceneDistance(12),
					mapSize: pixelSize(64, 32),
					normalBias: sceneDistance(0.03),
					radius: pixelDistance(2),
					shadowIntensity: 0.75,
				}],
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
			expect(objects.metadata).toEqual(jasmine.objectContaining({
			lightingPolicy: 'source-driven-flat-local-directional-shadow-light',
			shadowPolicy: 'three-shadow-map-from-local-source-direction',
			shadowDirectionPolicy: 'per-shadow-focus-to-local-source-position',
		}));
		expect(objects.metadata.shadow).toEqual(jasmine.objectContaining({
			enabled: true,
			objects: [jasmine.objectContaining({
				mapSize: pixelSize(64, 32),
				normalBias: sceneDistance(0.03),
				radius: pixelDistance(2),
			})],
		}));
		expect(objects.metadata.shadowObjects).toBeUndefined();
	});

	it('creates one source-owned directional shadow light per shadow object', () => {
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

	it('rejects removed singleton shadow fields and untyped shadow measurements', () => {
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

		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: {
				enabled: true,
				objects: [{}],
				mapSize: pixelSize(64, 64),
			},
		})).toThrowError(/not part of the canonical shadow contract/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: {
				enabled: true,
				objects: [{ mapSize: 64 }],
			},
		})).toThrowError(/mapSize.*pixels/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: {
				enabled: true,
				objects: [{ normalBias: 0.02 }],
			},
		})).toThrowError(/normalBias.*scene-units/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: {
				enabled: true,
				objects: [{ radius: 1 }],
			},
		})).toThrowError(/radius.*pixels/);
	});

	it('rejects explicit null optional lighting and shadow values', () => {
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

		expect(() => source.addSceneLighting({ ...baseRequest, sourcePosition: null }))
			.toThrowError(/sourcePosition.*scene-units/);
		expect(() => source.addSceneLighting({ ...baseRequest, observerPosition: null }))
			.toThrowError(/observerPosition.*scene-units/);
		expect(() => source.addSceneLighting({ ...baseRequest, endpointColorStatus: null }))
			.toThrowError(/endpointColorStatus/);
		expect(() => source.addSceneLighting({ ...baseRequest, shadow: null }))
			.toThrowError(/shadow/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: { enabled: true, objects: [{ objectKey: null }] },
		})).toThrowError(/objectKey/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: { enabled: true, objects: [{ mapSize: null }] },
		})).toThrowError(/mapSize.*pixels/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			shadow: { enabled: true, objects: [{ radius: null }] },
		})).toThrowError(/radius.*pixels/);
	});

	it('rejects invalid endpoint scaling and indirect-fill requests', () => {
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

		expect(() => source.addSceneLighting({
			...baseRequest,
			endpointSceneLightScalePolicy: null,
		})).toThrowError(/endpointSceneLightScalePolicy/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			endpointSceneLightScalePolicy: 'other',
		})).toThrowError(/endpointSceneLightScalePolicy/);
		expect(() => source.addSceneLighting({ ...baseRequest, endpointIndirectFill: null }))
			.toThrowError(/endpointIndirectFill.*object/);
		expect(() => source.addSceneLighting({ ...baseRequest, endpointIndirectFill: {} }))
			.toThrowError(/endpointIndirectFill.enabled/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			endpointIndirectFill: { enabled: true, policy: null },
		})).toThrowError(/endpointIndirectFill.policy/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			endpointIndirectFill: { enabled: true, policy: 'other' },
		})).toThrowError(/endpointIndirectFill.policy/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			endpointIndirectFill: { enabled: true, intensityRatio: -0.1 },
		})).toThrowError(/intensityRatio.*non-negative/);
		expect(() => source.addSceneLighting({
			...baseRequest,
			endpointIndirectFill: { enabled: true, distance: null },
		})).toThrowError(/endpointIndirectFill.distance.*scene-units/);
	});

	it('rejects inconsistent shadow camera and extent requests', () => {
		const source = createLocalSource();
		const addShadow = (shadowObject) => source.addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			shadow: { enabled: true, objects: [shadowObject] },
		});

		expect(() => addShadow({ extent: sceneDistance(0) }))
			.toThrowError(/extent.*greater than zero/);
		expect(() => addShadow({
			extent: sceneDistance(20),
			lightDistance: sceneDistance(20),
		})).toThrowError(/lightDistance.*twice/);
		expect(() => addShadow({ cameraNear: sceneDistance(0) }))
			.toThrowError(/cameraNear.*greater than zero/);
		expect(() => addShadow({
			cameraNear: sceneDistance(2),
			cameraFar: sceneDistance(2),
		})).toThrowError(/cameraFar.*cameraNear/);
		expect(() => addShadow({
			cameraLeft: sceneDistance(1),
			cameraRight: sceneDistance(1),
		})).toThrowError(/cameraRight.*cameraLeft/);
		expect(() => addShadow({
			cameraBottom: sceneDistance(1),
			cameraTop: sceneDistance(1),
		})).toThrowError(/cameraTop.*cameraBottom/);
	});

	it('configures app-authored Three objects for local source shadows', () => {
		const source = createLocalSource();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

		expect(source.configureThreeShadowObject(mesh, {
			receiveShadow: false,
			includeDescendants: false,
			layerIndex: 5,
		})).toBe(mesh,
		);
		expect(mesh.castShadow).toBeTrue();
		expect(mesh.receiveShadow).toBeFalse();
		expect(mesh.layers.mask & (1 << 5)).toBe(1 << 5);
		expect(mesh.userData).toEqual(jasmine.objectContaining({
			algorithm32ShadowObject: true,
			shadowPolicy: 'three-shadow-map-from-local-source-direction',
			shadowSourceKey: 'test-local',
			shadowLayerIndex: 5,
		}));
		expect(mesh.userData.algorithm32ShadowConfiguration).toEqual(jasmine.objectContaining({
			owner: 'LocalSunLightSource',
			sourceKey: 'test-local',
			shadowPolicy: 'three-shadow-map-from-local-source-direction',
			receiveShadow: false,
			includeDescendants: false,
			configuredNodeCount: 1,
		}));
	});

	it('fails loudly for invalid source configuration or lighting requests', () => {
		expect(() => new LocalSunLightSource()).toThrowError(/configuration/);
		expect(() => createLocalSource({ sourceKey: '' })).toThrowError(/sourceKey/);
		expect(() => createLocalSource({ position: null })).toThrowError(/position/);
		expect(() => createLocalSource({ sourceIrradiance: [] })).toThrowError(/SpectralPacket/);
		expect(() => createLocalSource({ referenceDistance: distance(0) })).toThrowError(/valid ranges/);
		expect(() => createLocalSource({ distanceFalloff: null })).toThrowError(/distanceFalloff/);
		expect(() => createLocalSource({
			sourceTransmittanceIntervalCount: 0,
		})).toThrowError(/sourceTransmittanceIntervalCount/);
		expect(() => createLocalSource().sampleDirectLighting()).toThrowError(/sourceRelativePosition/);
		expect(() => createLocalSource().sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
			},
		})).toThrowError(/directionToSource/);
		expect(() => createLocalSource().sampleDirectLighting({
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 0, 0],
			},
		})).toThrowError(/non-zero/);
		expect(() => createLocalSource().addSceneLighting({ THREE })).toThrowError(/sourcePosition/);
		expect(() => createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			calibrationScalar: Number.NaN,
		})).toThrowError(/calibrationScalar.*finite/);
		expect(() => createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			observerPosition: scenePosition(0, 0, 0),
			ambientIntensityRange: { min: Number.POSITIVE_INFINITY, max: 1 },
		})).toThrowError(/ambientIntensityRange\.min.*finite/);
		expect(() => createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			ambientIntensityRange: { min: -0.1, max: 1 },
		})).toThrowError(/ambientIntensityRange\.min.*non-negative/);
		expect(() => createLocalSource().addSceneLighting({
			THREE,
			sourceRelativePosition: {
				distanceFromSource: distance(20),
				directionToSource: [0, 1, 0],
			},
			sourcePosition: scenePosition(0, 10, 0),
			ambientIntensityRange: { min: 1, max: 0.5 },
		})).toThrowError(/ambientIntensityRange\.max.*min/);
		expect(() => createLocalSource().configureThreeShadowObject(null)).toThrowError(/Three object/);
	});
});

function createLocalSource(overrides = {}) {
	return new LocalSunLightSource({
		sourceKey: 'test-local',
		position: {
			coordinates: [4_800_000, 0, 4_800_000],
			units: 'meters',
		},
		sourceIrradiance: createTestSourceIrradiance([1, 2]),
		referenceDistance: distance(10),
		referenceSpectralIncidentScale: 2,
		radius: distance(1),
		distanceFalloff: true,
		...overrides,
	});
}

function expectVectorCloseTo(actual, expected, precision = 12) {
	expect(actual.length).toBe(expected.length);
	for (let index = 0; index < expected.length; index += 1) {
		expect(actual[index]).toBeCloseTo(expected[index], precision);
	}
}

function distance(value) {
	return { value, units: 'meters' };
}

function sceneDistance(value) {
	return { value, units: 'scene-units' };
}

function pixelDistance(value) {
	return { value, units: 'pixels' };
}

function pixelSize(width, height) {
	return { width, height, units: 'pixels' };
}

function scenePosition(x, y, z) {
	return { coordinates: [x, y, z], units: 'scene-units' };
}
