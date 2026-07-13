import * as THREE from 'three';

import {Algorithm32AtmosphereComposer} from '../Algorithm32AtmosphereComposer.js';
import {Algorithm32Bindings} from '../Algorithm32Bindings.js';
import {Algorithm32R3FValues} from '../Algorithm32R3FValues.js';
import {Algorithm32ThreeResources} from '../Algorithm32ThreeResources.js';

describe('Algorithm32 React adapter namespaces', /** Called by Jasmine to register the named test suite. */ () => {
	it('accepts a complete required-object packet through the composer boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		const object = new THREE.Object3D();
		const composer = new Algorithm32AtmosphereComposer({
			...Algorithm32AtmosphereComposer.defaultProps,
			background: null,
			config: {},
			/**
			 * Called by composer to create required objects.
			 * @returns - The callback result returned to its caller.
			 */ createRequiredObjects: () => ({
				objects: [object],
				metadata: {owner: 'test'},
			}),
		});

		expect(composer.getSolidScene().children).toEqual([object]);
	});

	it('creates common camera binding values with optional scene-depth override', /** Called by Jasmine to exercise the named behavior. */ () => {
		const defaultBindings = Algorithm32Bindings.create(THREE);
		const overrideBindings = Algorithm32Bindings.create(THREE, distance(42));

		expect(defaultBindings['geometry.inverseProjectionMatrix']).toEqual(jasmine.any(THREE.Matrix4));
		expect(defaultBindings['geometry.inverseViewMatrix']).toEqual(jasmine.any(THREE.Matrix4));
		expect(defaultBindings['geometry.cameraWorldPosition']).toEqual(jasmine.any(THREE.Vector3));
		expect(defaultBindings['geometry.cameraGroundRelativePosition']).toEqual(jasmine.any(THREE.Vector3));
		expect(defaultBindings['geometry.sceneTermination']).toEqual(distance(0));
		expect(defaultBindings['geometry.sceneDepthMax']).toBeUndefined();
		expect(overrideBindings['geometry.sceneDepthMax']).toEqual(distance(42));
		expect(overrideBindings).not.toBe(defaultBindings);
		expect(overrideBindings['geometry.inverseProjectionMatrix']).not.toBe(
			defaultBindings['geometry.inverseProjectionMatrix'],
		);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => Algorithm32Bindings.create(THREE, 42),
		).toThrowError(/finite distance/);
	});

	it('updates live camera matrices and geometry-owned model coordinates', /** Called by Jasmine to exercise the named behavior. */ () => {
		const bindingValues = Algorithm32Bindings.create(THREE);
		const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 1000);
		camera.position.set(1, 2, 3);
		const geometry = {
			mapObserverLocalScenePointToModelPosition: jasmine.createSpy('mapPoint').and.callFake(
				/**
				 * Called by the Jasmine spy to handle one callback invocation.
				 * @param point - The point value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (point) => ({
					coordinates: point.coordinates.map(
						/**
						 * Called by Array.prototype.map to transform one collection value.
						 * @param value - The value accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (value) => value + 10,
					),
					units: 'meters',
				}),
			),
			resolveGroundRelativePosition: jasmine.createSpy('resolveGroundRelativePosition').and.callFake(
				/**
				 * Called by the Jasmine spy to handle one callback invocation.
				 * @param position - The position value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (position) => ({
					coordinates: position.coordinates.map(
						/**
						 * Called by Array.prototype.map to transform one collection value.
						 * @param value - The value accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (value) => value - 10,
					),
					units: 'meters',
				}),
			),
		};
		const sceneScaleValue = sceneScale(1000);

		Algorithm32Bindings.update({
			bindingValues,
			camera,
			props: {
				config: {geometry},
				sceneScale: sceneScaleValue,
			},
		});

		expect(geometry.mapObserverLocalScenePointToModelPosition).toHaveBeenCalledWith(
			{coordinates: [1, 2, 3], units: 'scene-units'},
			{sceneScale: sceneScaleValue},
		);
		expect(bindingValues['geometry.inverseProjectionMatrix']).toEqual(camera.projectionMatrixInverse);
		expect(bindingValues['geometry.inverseViewMatrix']).toEqual(camera.matrixWorld);
		expect(bindingValues['geometry.cameraWorldPosition'].toArray()).toEqual([11, 12, 13]);
		expect(bindingValues['geometry.cameraGroundRelativePosition'].toArray()).toEqual([1, 2, 3]);

		camera.position.set(4, 5, 6);
		Algorithm32Bindings.update({
			bindingValues,
			camera,
			props: {
				config: {geometry},
				sceneScale: sceneScaleValue,
			},
		});
		expect(bindingValues['geometry.cameraWorldPosition'].toArray()).toEqual([14, 15, 16]);
		expect(bindingValues['geometry.cameraGroundRelativePosition'].toArray()).toEqual([4, 5, 6]);
	});

	it('creates a configurable scene-color render target', /** Called by Jasmine to exercise the named behavior. */ () => {
		const request = {
			THREE,
			viewportSize: pixelSize(64, 32),
			type: THREE.HalfFloatType,
			name: 'test.sceneColor',
			colorSpace: THREE.LinearSRGBColorSpace,
		};
		const target = Algorithm32ThreeResources.createSceneColorRenderTarget(request);
		const second = Algorithm32ThreeResources.createSceneColorRenderTarget(request);

		expect(target).toEqual(jasmine.any(THREE.WebGLRenderTarget));
		expect(second).not.toBe(target);
		expect(second.texture).not.toBe(target.texture);
		expect(target.width).toBe(64);
		expect(target.height).toBe(32);
		expect(target.texture.type).toBe(THREE.HalfFloatType);
		expect(target.texture.name).toBe('test.sceneColor');
		expect(target.texture.colorSpace).toBe(THREE.LinearSRGBColorSpace);

		target.dispose();
		second.dispose();
	});

	it('resolves owner-request factories against the full adapter context', /** Called by Jasmine to exercise the named behavior. */ () => {
		const context = {sceneScale: sceneScale(10)};
		const factory = jasmine.createSpy('ownerRequest').and.returnValue({name: 'generated'});

		expect(Algorithm32ThreeResources.resolveOwnerRequest(factory, context)).toEqual({name: 'generated'});
		expect(factory).toHaveBeenCalledOnceWith(context);
		expect(Algorithm32ThreeResources.resolveOwnerRequest(undefined, context)).toEqual({});
		expect(Algorithm32ThreeResources.resolveOwnerRequest(undefined, context)).not.toBe(
			Algorithm32ThreeResources.resolveOwnerRequest(undefined, context),
		);
	});

	it('defaults only absent render-target options and rejects supplied invalid values', /** Called by Jasmine to exercise the named behavior. */ () => {
		const request = {
			THREE,
			viewportSize: pixelSize(4, 2),
		};
		const target = Algorithm32ThreeResources.createSceneColorRenderTarget(request);

		expect(target.texture.name).toBe('Algorithm32.sceneColor');
		expect(target.texture.type).toBe(THREE.HalfFloatType);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => Algorithm32ThreeResources.createSceneColorRenderTarget({...request, type: null}),
		).toThrowError(/type/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => Algorithm32ThreeResources.createSceneColorRenderTarget({...request, name: null}),
		).toThrowError(/name/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => Algorithm32ThreeResources.createSceneColorRenderTarget({...request, colorSpace: null}),
		).toThrowError(/colorSpace/);

		target.dispose();
	});

	it('creates required Three objects from geometry and light source abstractions', /** Called by Jasmine to exercise the named behavior. */ () => {
		const visualObject = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
		const raycastObject = new THREE.Object3D();
		const light = new THREE.DirectionalLight();
		const target = new THREE.Object3D();
		const config = {
			geometry: {
				createThreeEndpointObjects: jasmine.createSpy('createThreeEndpointObjects').and.returnValue({
					visualObjects: [visualObject],
					raycastObjects: [raycastObject],
					metadata: {owner: 'test-geometry'},
				}),
			},
			lightSource: {
				addSceneLighting: jasmine.createSpy('addSceneLighting').and.returnValue({
					lights: [light],
					sceneObjects: [target],
					metadata: {owner: 'test-light'},
				}),
			},
		};
		const packet = Algorithm32ThreeResources.createRequiredThreeObjects({
			THREE,
			config,
			sceneScale: sceneScale(1000),
			geometryEndpointRequest: {name: 'test-ground'},
			lightingRequest: {focus: scenePosition([1, 2, 3])},
		});

		expect(config.geometry.createThreeEndpointObjects).toHaveBeenCalledWith(
			jasmine.objectContaining({
				sceneScale: sceneScale(1000),
				name: 'test-ground',
			}),
		);
		expect(config.lightSource.addSceneLighting).toHaveBeenCalledWith(
			jasmine.objectContaining({
				THREE,
				focus: scenePosition([1, 2, 3]),
			}),
		);
		expect(packet.objects).toEqual([visualObject, raycastObject, light, target]);
		expect(light.userData.algorithm32SceneInput).toBeFalse();
		expect(target.userData.algorithm32SceneInput).toBeFalse();

		visualObject.geometry.dispose();
		visualObject.material.dispose();
	});

	it('defaults only an absent optional light-source scene object collection', /** Called by Jasmine to exercise the named behavior. */ () => {
		const light = new THREE.DirectionalLight();
		const packet = Algorithm32ThreeResources.createRequiredThreeObjects({
			THREE,
			config: {
				lightSource: {
					/**
					 * Called by packet to add scene lighting.
					 * @returns - The callback result returned to its caller.
					 */ addSceneLighting: () => ({
						lights: [light],
						metadata: null,
					}),
				},
			},
		});

		expect(packet.objects).toEqual([light]);
		expect(packet.lightingObjects.sceneObjects).toBeUndefined();
	});

	it('defaults only absent viewport dimensions and rejects supplied invalid values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(Algorithm32R3FValues.viewportSize({width: 12.8})).toEqual(pixelSize(12, 1));
		expect(Algorithm32R3FValues.viewportSize(undefined)).toEqual(pixelSize(1, 1));

		for (const invalidSize of [
			null,
			{width: 0, height: 1},
			{width: -1, height: 1},
			{width: Number.NaN, height: 1},
			{width: '12', height: 1},
			{width: 1, height: null},
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => Algorithm32R3FValues.viewportSize(invalidSize),
			).toThrow();
		}
	});

	it('defaults only an absent render priority and rejects supplied invalid values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(Algorithm32R3FValues.renderPriority(undefined)).toBe(1);
		expect(Algorithm32R3FValues.renderPriority(0)).toBe(0);
		expect(Algorithm32R3FValues.renderPriority(-2.5)).toBe(-2.5);

		for (const invalidPriority of [null, '1', Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => Algorithm32R3FValues.renderPriority(invalidPriority),
			).toThrowError(/renderPriority/);
		}
	});
});

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
 * Called by this module to distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function distance(value) {
	return {value, units: 'meters'};
}

/**
 * Called by this module to scene position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function scenePosition(coordinates) {
	return {coordinates, units: 'scene-units'};
}

/**
 * Called by this module to scene scale.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function sceneScale(value) {
	return {value, units: 'meters-per-scene-unit'};
}
