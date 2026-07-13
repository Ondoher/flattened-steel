import * as THREE from 'three';

import {ThreeLighting} from '../ThreeLighting.js';

describe('ThreeLighting', /** Called by Jasmine to register the named test suite. */ () => {
	it('defaults only an absent optional lighting scene-object collection', /** Called by Jasmine to exercise the named behavior. */ () => {
		const scene = new THREE.Scene();
		const light = new THREE.DirectionalLight();

		ThreeLighting.addObjectsToScene(scene, {
			lights: [light],
			metadata: null,
		});

		expect(scene.children).toEqual([light]);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.addObjectsToScene(scene, {
					lights: null,
					metadata: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.addObjectsToScene(scene, {
					lights: [],
					sceneObjects: null,
					metadata: null,
				}),
		).toThrow();
	});

	it('configures one Three object tree from the source-owned shadow contract', /** Called by Jasmine to exercise the named behavior. */ () => {
		const group = new THREE.Group();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
		group.add(mesh);

		expect(
			ThreeLighting.configureShadowObject(
				group,
				{
					owner: 'test-source',
					sourceKey: 'test-source',
					shadowPolicy: 'test-shadow-policy',
				},
				{
					layerIndex: 7,
				},
			),
		).toBe(group);
		expect(group.castShadow).toBeTrue();
		expect(group.receiveShadow).toBeTrue();
		expect(mesh.castShadow).toBeTrue();
		expect(mesh.receiveShadow).toBeTrue();
		expect(group.layers.mask & (1 << 7)).toBe(1 << 7);
		expect(mesh.layers.mask & (1 << 7)).toBe(1 << 7);
		expect(group.userData.algorithm32ShadowConfiguration).toEqual(
			jasmine.objectContaining({
				owner: 'test-source',
				sourceKey: 'test-source',
				shadowPolicy: 'test-shadow-policy',
				layerIndex: 7,
				configuredNodeCount: 2,
			}),
		);
	});

	it('supports an explicit root-only no-receive configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		const group = new THREE.Group();
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
		group.add(mesh);

		ThreeLighting.configureShadowObject(
			group,
			{
				owner: 'test-source',
				sourceKey: 'test-source',
				shadowPolicy: 'test-shadow-policy',
			},
			{
				receiveShadow: false,
				includeDescendants: false,
			},
		);

		expect(group.castShadow).toBeTrue();
		expect(group.receiveShadow).toBeFalse();
		expect(mesh.castShadow).toBeFalse();
		expect(mesh.receiveShadow).toBeFalse();
	});

	it('rejects missing objects and explicitly invalid options', /** Called by Jasmine to exercise the named behavior. */ () => {
		const owner = {
			owner: 'test-source',
			sourceKey: 'test-source',
			shadowPolicy: 'test-shadow-policy',
		};

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ThreeLighting.configureShadowObject(null, owner),
		).toThrowError(/Three object/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, {
					layerIndex: 32,
				}),
		).toThrowError(/0 to 31/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, {
					castShadow: 'yes',
				}),
		).toThrowError(/castShadow must be boolean/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, {
					includeDescendants: 1,
				}),
		).toThrowError(/includeDescendants must be boolean/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, null),
		).toThrowError(/request must be an object/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, {
					layerIndex: null,
				}),
		).toThrowError(/layerIndex/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, {
					shadowPolicy: null,
				}),
		).toThrowError(/shadowPolicy/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				ThreeLighting.configureShadowObject(new THREE.Object3D(), owner, {
					sourceKey: null,
				}),
		).toThrowError(/sourceKey/);
	});
});
