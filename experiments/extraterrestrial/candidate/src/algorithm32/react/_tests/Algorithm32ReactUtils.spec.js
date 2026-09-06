import * as THREE from 'three';

import {
	acceptAlgorithm32RequiredThreeObjectsPacket,
	algorithm32RenderPriority,
	algorithm32ViewportSize,
	createAlgorithm32BindingValues,
	createAlgorithm32RequiredThreeObjects,
	createAlgorithm32SceneColorRenderTarget,
	updateAlgorithm32BindingValues,
} from '../Algorithm32ReactUtils.js';

describe('Algorithm32ReactUtils', () => {
	it('accepts a complete required-object factory packet and rejects invalid packets', () => {
		const object = new THREE.Object3D();
		const packet = acceptAlgorithm32RequiredThreeObjectsPacket({
			objects: [object],
			metadata: { owner: 'test' },
		});

		expect(packet.objects).toEqual([object]);
		for (const invalidPacket of [null, {}, { objects: null }, { objects: {} }]) {
			expect(() => acceptAlgorithm32RequiredThreeObjectsPacket(invalidPacket))
				.toThrowError(/required Three objects factory/);
		}
	});

	it('creates common camera binding values with optional scene-depth override', () => {
		const defaultBindings = createAlgorithm32BindingValues(THREE);
		const overrideBindings = createAlgorithm32BindingValues(THREE, distance(42));

		expect(defaultBindings['geometry.inverseProjectionMatrix'])
			.toEqual(jasmine.any(THREE.Matrix4));
		expect(defaultBindings['geometry.inverseViewMatrix'])
			.toEqual(jasmine.any(THREE.Matrix4));
		expect(defaultBindings['geometry.cameraWorldPosition'])
			.toEqual(jasmine.any(THREE.Vector3));
		expect(defaultBindings['geometry.cameraGroundRelativePosition'])
			.toEqual(jasmine.any(THREE.Vector3));
		expect(defaultBindings['geometry.sceneTermination']).toEqual(distance(0));
		expect(defaultBindings['geometry.sceneDepthMax']).toBeUndefined();
		expect(overrideBindings['geometry.sceneDepthMax']).toEqual(distance(42));
		expect(() => createAlgorithm32BindingValues(THREE, 42)).toThrowError(/finite distance/);
	});

	it('updates live camera matrices and geometry-owned model coordinates', () => {
		const bindingValues = createAlgorithm32BindingValues(THREE);
		const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 1000);
		camera.position.set(1, 2, 3);
		const geometry = {
			mapObserverLocalScenePointToModelPosition: jasmine.createSpy('mapPoint')
				.and.callFake((point) => ({
					coordinates: point.coordinates.map((value) => value + 10),
					units: 'meters',
				})),
			resolveGroundRelativePosition: jasmine.createSpy('resolveGroundRelativePosition')
				.and.callFake((position) => ({
					coordinates: position.coordinates.map((value) => value - 10),
					units: 'meters',
				})),
		};
		const sceneScaleValue = sceneScale(1000);

		updateAlgorithm32BindingValues({
			bindingValues,
			camera,
			props: {
				config: { geometry },
				sceneScale: sceneScaleValue,
			},
		});

		expect(geometry.mapObserverLocalScenePointToModelPosition).toHaveBeenCalledWith(
			{ coordinates: [1, 2, 3], units: 'scene-units' },
			{ sceneScale: sceneScaleValue },
		);
		expect(bindingValues['geometry.inverseProjectionMatrix'])
			.toEqual(camera.projectionMatrixInverse);
		expect(bindingValues['geometry.inverseViewMatrix']).toEqual(camera.matrixWorld);
		expect(bindingValues['geometry.cameraWorldPosition'].toArray())
			.toEqual([11, 12, 13]);
		expect(bindingValues['geometry.cameraGroundRelativePosition'].toArray())
			.toEqual([1, 2, 3]);

		camera.position.set(4, 5, 6);
		updateAlgorithm32BindingValues({
			bindingValues,
			camera,
			props: {
				config: { geometry },
				sceneScale: sceneScaleValue,
			},
		});
		expect(bindingValues['geometry.cameraWorldPosition'].toArray())
			.toEqual([14, 15, 16]);
		expect(bindingValues['geometry.cameraGroundRelativePosition'].toArray())
			.toEqual([4, 5, 6]);
	});

	it('creates a configurable scene-color render target', () => {
		const target = createAlgorithm32SceneColorRenderTarget({
			THREE,
			viewportSize: pixelSize(64, 32),
			type: THREE.HalfFloatType,
			name: 'test.sceneColor',
			colorSpace: THREE.LinearSRGBColorSpace,
		});

		expect(target).toEqual(jasmine.any(THREE.WebGLRenderTarget));
		expect(target.width).toBe(64);
		expect(target.height).toBe(32);
		expect(target.texture.type).toBe(THREE.HalfFloatType);
		expect(target.texture.name).toBe('test.sceneColor');
		expect(target.texture.colorSpace).toBe(THREE.LinearSRGBColorSpace);

		target.dispose();
	});

	it('defaults only absent render-target options and rejects supplied invalid values', () => {
		const request = {
			THREE,
			viewportSize: pixelSize(4, 2),
		};
		const target = createAlgorithm32SceneColorRenderTarget(request);

		expect(target.texture.name).toBe('Algorithm32.sceneColor');
		expect(() => createAlgorithm32SceneColorRenderTarget({ ...request, type: null }))
			.toThrowError(/type/);
		expect(() => createAlgorithm32SceneColorRenderTarget({ ...request, name: null }))
			.toThrowError(/name/);
		expect(() => createAlgorithm32SceneColorRenderTarget({ ...request, colorSpace: null }))
			.toThrowError(/colorSpace/);

		target.dispose();
	});

	it('creates required Three objects from geometry and light source abstractions', () => {
		const visualObject = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
		const raycastObject = new THREE.Object3D();
		const light = new THREE.DirectionalLight();
		const target = new THREE.Object3D();
		const config = {
			geometry: {
				createThreeEndpointObjects: jasmine.createSpy('createThreeEndpointObjects').and.returnValue({
					visualObjects: [visualObject],
					raycastObjects: [raycastObject],
					metadata: { owner: 'test-geometry' },
				}),
			},
			lightSource: {
				addSceneLighting: jasmine.createSpy('addSceneLighting').and.returnValue({
					lights: [light],
					sceneObjects: [target],
					metadata: { owner: 'test-light' },
				}),
			},
		};
		const packet = createAlgorithm32RequiredThreeObjects({
			THREE,
			config,
			sceneScale: sceneScale(1000),
			geometryEndpointRequest: { name: 'test-ground' },
			lightingRequest: { focus: scenePosition([1, 2, 3]) },
		});

		expect(config.geometry.createThreeEndpointObjects).toHaveBeenCalledWith(jasmine.objectContaining({
			sceneScale: sceneScale(1000),
			name: 'test-ground',
		}));
		expect(config.lightSource.addSceneLighting).toHaveBeenCalledWith(jasmine.objectContaining({
			THREE,
			focus: scenePosition([1, 2, 3]),
		}));
		expect(packet.objects).toEqual([visualObject, raycastObject, light, target]);
		expect(light.userData.algorithm32SceneInput).toBeFalse();
		expect(target.userData.algorithm32SceneInput).toBeFalse();

		visualObject.geometry.dispose();
		visualObject.material.dispose();
	});

	it('defaults only absent owner requests and rejects invalid resolved requests', () => {
		const config = {
			geometry: {
				createThreeEndpointObjects: jasmine.createSpy('createThreeEndpointObjects')
					.and.returnValue(null),
			},
		};

		expect(() => createAlgorithm32RequiredThreeObjects({
			THREE,
			config,
			geometryEndpointRequest: null,
		})).toThrowError(/owner request/);
		expect(() => createAlgorithm32RequiredThreeObjects({
			THREE,
			config,
			geometryEndpointRequest: () => null,
		})).toThrowError(/owner request/);
		expect(() => createAlgorithm32RequiredThreeObjects({
			THREE,
			config,
			geometryEndpointRequest: 'invalid',
		})).toThrowError(/owner request/);
	});

	it('rejects malformed geometry and light-source owner packets', () => {
		for (const endpointPacket of [
			null,
			{},
			{ visualObjects: null, raycastObjects: [] },
			{ visualObjects: [], raycastObjects: null },
			{ visualObjects: [], raycastObjects: [] },
		]) {
			expect(() => createAlgorithm32RequiredThreeObjects({
				THREE,
				config: {
					geometry: {
						createThreeEndpointObjects: () => endpointPacket,
					},
				},
			})).toThrowError(/geometry endpoint owner/);
		}

		for (const lightingPacket of [
			null,
			{},
			{ lights: null },
			{ lights: [], sceneObjects: null },
			{ lights: [] },
		]) {
			expect(() => createAlgorithm32RequiredThreeObjects({
				THREE,
				config: {
					lightSource: {
						addSceneLighting: () => lightingPacket,
					},
				},
			})).toThrowError(/light-source owner/);
		}
	});

	it('defaults only an absent optional light-source scene object collection', () => {
		const light = new THREE.DirectionalLight();
		const packet = createAlgorithm32RequiredThreeObjects({
			THREE,
			config: {
				lightSource: {
					addSceneLighting: () => ({
						lights: [light],
						metadata: null,
					}),
				},
			},
		});

		expect(packet.objects).toEqual([light]);
		expect(packet.lightingObjects.sceneObjects).toBeUndefined();
	});

	it('defaults only absent viewport dimensions and rejects supplied invalid values', () => {
		expect(algorithm32ViewportSize({ width: 12.8 }))
			.toEqual(pixelSize(12, 1));
		expect(algorithm32ViewportSize(undefined))
			.toEqual(pixelSize(1, 1));

		for (const invalidSize of [
			null,
			{ width: 0, height: 1 },
			{ width: -1, height: 1 },
			{ width: Number.NaN, height: 1 },
			{ width: '12', height: 1 },
			{ width: 1, height: null },
		]) {
			expect(() => algorithm32ViewportSize(invalidSize)).toThrow();
		}
	});

	it('defaults only an absent render priority and rejects supplied invalid values', () => {
		expect(algorithm32RenderPriority(undefined)).toBe(1);
		expect(algorithm32RenderPriority(0)).toBe(0);
		expect(algorithm32RenderPriority(-2.5)).toBe(-2.5);

		for (const invalidPriority of [null, '1', Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(() => algorithm32RenderPriority(invalidPriority)).toThrowError(/renderPriority/);
		}
	});
});

function pixelSize(width, height) {
	return { width, height, units: 'pixels' };
}

function distance(value) {
	return { value, units: 'meters' };
}

function scenePosition(coordinates) {
	return { coordinates, units: 'scene-units' };
}

function sceneScale(value) {
	return { value, units: 'meters-per-scene-unit' };
}
