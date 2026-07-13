import {PixelMath} from '../../math/PixelMath.js';
import {ValueValidation} from '../../validation/ValueValidation.js';

/** Request-backed Three resource resolution and construction methods. */
export const Algorithm32ThreeResources = {
	/**
	 * Call this method to resolve an owner request from a direct value or request factory.
	 *
	 * @param {unknown} value - The direct request or request factory.
	 * @param {Algorithm32ThreeResourcesRequest} context - The factory evaluation context.
	 * @returns {Algorithm32ThreeOwnerRequest} - The resolved owner request.
	 */
	resolveOwnerRequest(value, context) {
		if (value === undefined) {
			return {};
		}

		const resolved = typeof value === 'function' ? value(context) : value;

		return /** @type {Algorithm32ThreeOwnerRequest} */ (resolved);
	},

	/**
	 * Call this method to create geometry- and light-source-owned Three objects required by Algorithm32. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {Algorithm32ThreeResourcesRequest} [request] - The config, Three namespace, scale, and owner requests.
	 * @returns {Algorithm32RequiredThreeObjects} - The created owner-object packet.
	 */
	createRequiredThreeObjects(request = {}) {
		const config = request.config;
		const geometry = config?.geometry;
		const lightSource = config?.lightSource;
		const sceneScale = request.sceneScale;
		const geometryRequest = Algorithm32ThreeResources.resolveOwnerRequest(request.geometryEndpointRequest, request);
		const lightingRequest = Algorithm32ThreeResources.resolveOwnerRequest(request.lightingRequest, request);
		const endpointObjects =
			typeof geometry?.createThreeEndpointObjects === 'function'
				? /** @type {GeometryThreeEndpointObjects} */ (
						geometry.createThreeEndpointObjects({
							sceneScale,
							...geometryRequest,
						})
					)
				: null;
		const createLightingObjects =
			typeof lightSource?.addSceneLighting === 'function' ? lightSource.addSceneLighting.bind(lightSource) : null;
		const lightingObjects =
			typeof createLightingObjects === 'function'
				? /** @type {LightSourceThreeLightingObjects} */ (
						createLightingObjects({
							THREE: request.THREE,
							...lightingRequest,
						})
					)
				: null;
		const endpointVisualObjects = endpointObjects === null ? [] : endpointObjects.visualObjects;
		const endpointRaycastObjects = endpointObjects === null ? [] : endpointObjects.raycastObjects;
		const lights = lightingObjects === null ? [] : lightingObjects.lights;
		const lightingSceneObjects =
			lightingObjects === null
				? []
				: lightingObjects.sceneObjects === undefined
					? []
					: lightingObjects.sceneObjects;

		for (const object of [...lights, ...lightingSceneObjects]) {
			const candidate = /** @type {Algorithm32SceneInputObject | null} */ (object);
			if (candidate?.userData) {
				candidate.userData.algorithm32SceneInput = false;
			}
		}

		return {
			objects: [...endpointVisualObjects, ...endpointRaycastObjects, ...lights, ...lightingSceneObjects],
			endpointObjects,
			lightingObjects,
			metadata: {
				geometry: endpointObjects === null ? null : endpointObjects.metadata,
				lighting: lightingObjects === null ? null : lightingObjects.metadata,
			},
		};
	},

	/**
	 * Call this method to create the default Algorithm32 scene-color render target.
	 *
	 * @param {Algorithm32SceneColorRenderTargetRequest} request - The render-target facts.
	 * @returns {Algorithm32SceneColorRenderTarget} - The created render target.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	createSceneColorRenderTarget({
		THREE,
		viewportSize,
		type = THREE.HalfFloatType,
		name = 'Algorithm32.sceneColor',
		colorSpace,
	}) {
		const acceptedViewportSize = PixelMath.acceptPixelSize(
			viewportSize,
			'Algorithm32 scene-color render target viewportSize',
		);
		if (typeof type !== 'number' || !Number.isFinite(type)) {
			throw new TypeError('Algorithm32 scene-color render target type must be a finite number.');
		}
		const acceptedName = ValueValidation.requiredString(name, 'Algorithm32 scene-color render target name');
		const acceptedColorSpace =
			colorSpace === undefined
				? undefined
				: ValueValidation.requiredString(colorSpace, 'Algorithm32 scene-color render target colorSpace');
		const target = new THREE.WebGLRenderTarget(acceptedViewportSize.width, acceptedViewportSize.height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			type,
			depthBuffer: true,
			stencilBuffer: false,
		});

		target.texture.name = acceptedName;

		if (acceptedColorSpace !== undefined) {
			target.texture.colorSpace = acceptedColorSpace;
		}

		return target;
	},
};
