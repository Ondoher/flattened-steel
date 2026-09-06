import React from 'react';
import { createPortal } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { Algorithm32 } from '../Algorithm32.js';
import { ThreeCacheBackend } from '../three/ThreeCacheBackend.js';
import {
	acceptAlgorithm32RequiredThreeObjectsPacket,
	algorithm32ViewportSize,
	createAlgorithm32BindingValues,
	createAlgorithm32RequiredThreeObjects,
	createAlgorithm32SceneColorRenderTarget,
	updateAlgorithm32BindingValues,
} from './Algorithm32ReactUtils.js';
import { DEFAULT_ALGORITHM32_SCENE_SCALE } from './consts.js';

/**
 * Wrap arbitrary Three/R3F children in a production Algorithm32 composer chain.
 */
export default class Algorithm32AtmosphereComposer extends React.Component {
	/**
	 * Create the default Algorithm32 facade.
	 *
	 * @param {Config} config - Supplies the Algorithm32 configuration.
	 * @returns {Algorithm32} Return the configured facade.
	 */
	_createDefaultAlgorithm32(config) {
		return new Algorithm32(config);
	}

	/**
	 * Create the default mutable renderer binding values.
	 *
	 * @param {object} request - Supplies renderer setup values.
	 * @param {object} request.THREE - Supplies the Three namespace.
	 * @param {object} request.props - Supplies active composer properties.
	 * @returns {Record<string, unknown>} Return mutable binding values.
	 */
	_createDefaultBindingValues({ THREE: threeNamespace, props }) {
		return createAlgorithm32BindingValues(
			threeNamespace,
			props.sceneDepthMax,
		);
	}

	/**
	 * Create the default scene-color render target.
	 *
	 * @param {object} request - Supplies renderer setup values.
	 * @param {object} request.THREE - Supplies the Three namespace.
	 * @param {PixelSize} request.viewportSize - Supplies target dimensions.
	 * @returns {unknown} Return the render target.
	 */
	_createDefaultRenderTarget({
		THREE: threeNamespace,
		viewportSize,
	}) {
		return createAlgorithm32SceneColorRenderTarget({
			THREE: threeNamespace,
			viewportSize,
		});
	}

	/**
	 * Compare two shallow object snapshots.
	 *
	 * @param {object | null} left - Supplies the left snapshot.
	 * @param {object | null} right - Supplies the right snapshot.
	 * @returns {boolean} Return whether both snapshots contain identical values.
	 */
	_shallowEqualObject(left, right) {
		if (left === right) {
			return true;
		}

		if (!left || !right) {
			return false;
		}

		const leftKeys = Object.keys(left);
		const rightKeys = Object.keys(right);

		if (leftKeys.length !== rightKeys.length) {
			return false;
		}

		return leftKeys.every((key) => left[key] === right[key]);
	}

	/**
	 * Dispose one Three material or material collection.
	 *
	 * @param {unknown} material - Supplies material state to dispose.
	 * @returns {void}
	 */
	_disposeMaterial(material) {
		if (Array.isArray(material)) {
			for (const entry of material) {
				entry?.dispose?.();
			}
			return;
		}

		const candidate =
			/** @type {{ dispose?: () => void } | null} */ (material);
		candidate?.dispose?.();
	}

	/**
	 * Dispose one Three object and its owned geometry and materials.
	 *
	 * @param {unknown} object - Supplies the object to dispose.
	 * @returns {void}
	 */
	_disposeThreeObject(object) {
		const candidate = /** @type {{
		 * parent?: { remove?: (object: unknown) => void },
		 * traverse?: (visitor: (child: {
		 * geometry?: { dispose?: () => void },
		 * material?: unknown,
		 * }) => void) => void,
		 * } | null} */ (object);
		candidate?.parent?.remove?.(object);
		candidate?.traverse?.((child) => {
			child.geometry?.dispose?.();
			this._disposeMaterial(
				child.material,
			);
		});
	}

	static defaultProps = {
		enabled: true,
		background: '#060912',
		sceneScale: DEFAULT_ALGORITHM32_SCENE_SCALE,
		sceneDepthMax: null,
		logger: console,
		setupOptions: null,
		includeRequiredObjects: true,
		createRequiredObjects: createAlgorithm32RequiredThreeObjects,
		requiredObjectsKey: null,
		createAlgorithm32: null,
		createBindingValues: null,
		createRenderTarget: null,
		updateBindingValues: updateAlgorithm32BindingValues,
		onSetupError: null,
		onSetupReady: null,
	};

	/**
	 * Check whether renderer inputs require composer reconstruction.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {boolean} Return whether composer inputs changed.
	 */
	_composerInputsChanged(previousProps) {
		return previousProps.renderer !== this.props.renderer
			|| previousProps.camera !== this.props.camera
			|| previousProps.createRenderTarget !== this.props.createRenderTarget;
	}

	/**
	 * Check whether Algorithm32 setup inputs changed.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {boolean} Return whether runtime setup inputs changed.
	 */
	_setupInputsChanged(previousProps) {
		return previousProps.enabled !== this.props.enabled
			|| previousProps.config !== this.props.config
			|| previousProps.camera !== this.props.camera
			|| previousProps.sceneScale !== this.props.sceneScale
			|| previousProps.sceneDepthMax !== this.props.sceneDepthMax
			|| previousProps.createAlgorithm32 !== this.props.createAlgorithm32
			|| previousProps.createBindingValues !== this.props.createBindingValues
			|| previousProps.setupOptions !== this.props.setupOptions;
	}

	/**
	 * Check whether an installed handle can transactionally apply the only
	 * changed setup input.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {boolean} Return whether only Algorithm32 config changed.
	 */
	_canRefreshRuntimeConfig(previousProps) {
		return Boolean(this._algorithm32 && this._shaderHandle)
			&& previousProps.config !== this.props.config
			&& previousProps.enabled === this.props.enabled
			&& previousProps.camera === this.props.camera
			&& previousProps.sceneScale === this.props.sceneScale
			&& previousProps.sceneDepthMax === this.props.sceneDepthMax
			&& previousProps.createAlgorithm32 === this.props.createAlgorithm32
			&& previousProps.createBindingValues === this.props.createBindingValues
			&& previousProps.setupOptions === this.props.setupOptions;
	}

	/**
	 * Select the prop values that determine required Three objects.
	 *
	 * @param {object} props - Supplies the active component props.
	 * @returns {object} Return the required-object input snapshot.
	 */
	_requiredObjectsInputsFor(props) {
		return {
			enabled: props.enabled,
			config: props.config,
			sceneScale: props.sceneScale,
			includeRequiredObjects: props.includeRequiredObjects,
			createRequiredObjects: props.createRequiredObjects,
			geometryEndpointRequest: props.geometryEndpointRequest,
			lightingRequest: props.lightingRequest,
			requiredObjectsKey: props.requiredObjectsKey,
		};
	}

	/**
	 * Apply the configured solid-scene background.
	 *
	 * @param {object} props - Supplies the active component props.
	 * @returns {void}
	 */
	_updateBackground(props) {
		if (!props.background) {
			this._solidScene.background = null;
			return;
		}

		this._solidScene.background = props.background.isColor
			? props.background
			: new THREE.Color(props.background);
	}

	/**
	 * Update caller-owned binding values for one frame.
	 *
	 * @param {unknown} frameState - Supplies the active renderer frame state.
	 * @param {number} delta - Supplies elapsed frame time.
	 * @returns {void}
	 */
	_updateBindingValues(frameState, delta) {
		if (!this._bindingValues || this.props.updateBindingValues === null) {
			return;
		}

		this.props.updateBindingValues({
			bindingValues: this._bindingValues,
			camera: this.props.camera,
			delta,
			frameState,
			props: this.props,
		});
	}

	/**
	 * Check whether an asynchronous setup generation remains current.
	 *
	 * @param {number} generation - Supplies the candidate setup generation.
	 * @returns {boolean} Return whether the generation may publish results.
	 */
	_isCurrentSetup(generation) {
		return this._mounted && generation === this._setupGeneration;
	}

	/**
	 * Resolve the current unit-bearing viewport size.
	 *
	 * @returns {PixelSize} Return the accepted viewport dimensions.
	 */
	_viewportSize() {
		return algorithm32ViewportSize(this.props.size);
	}

	/**
	 * Publish state through React or update pre-mount state directly.
	 *
	 * @param {object} nextState - Supplies the state fields to publish.
	 * @returns {void}
	 */
	_setStateIfMounted(nextState) {
		if (this._mounted) {
			this.setState(nextState);
		} else {
			this.state = {
				...this.state,
				...nextState,
			};
		}
	}

	/**
	 * Dispose the active shader handle and Algorithm32 facade.
	 *
	 * @returns {void}
	 */
	_disposeRuntime() {
		this._setupGeneration += 1;
		this._pendingSetupCancellation?.abort();
		this._pendingSetupCancellation = null;
		this._shaderHandle?.dispose?.();
		this._algorithm32?.dispose?.();
		this._shaderHandle = null;
		this._algorithm32 = null;
		this._bindingValues = null;
	}

	/**
	 * Dispose the active composer and render-target state.
	 *
	 * @returns {void}
	 */
	_disposeComposer() {
		this._cacheBackend?.dispose?.();
		this._composer?.dispose?.();
		this._renderTarget?.dispose?.();
		this._cacheBackend = null;
		this._composer = null;
		this._renderTarget = null;
		this._renderPass = null;
	}

	/**
	 * Dispose all currently owned required Three objects.
	 *
	 * @returns {void}
	 */
	_disposeRequiredObjects() {
		for (const object of this._requiredObjects) {
			this._disposeThreeObject(
				object,
			);
		}

		this._requiredObjects = [];
		this._requiredObjectsPacket = null;
	}

	/**
	 * Reconcile geometry- and source-owned Three objects.
	 *
	 * @param {object} props - Supplies the active component props.
	 * @returns {void}
	 */
	_syncRequiredObjects(props) {
		const nextInput =
			this._requiredObjectsInputsFor(
				props,
			);

		if (this._shallowEqualObject(
			nextInput,
			this._requiredObjectsInput,
		)) {
			return;
		}

		this._disposeRequiredObjects();
		this._requiredObjectsInput = nextInput;
		this._requiredObjectsError = null;

		if (!props.enabled || !props.includeRequiredObjects || !props.config) {
			this._requiredObjectsPacket = null;
			return;
		}

		try {
			this._requiredObjectsPacket = acceptAlgorithm32RequiredThreeObjectsPacket(
				props.createRequiredObjects({
				THREE,
				config: props.config,
				sceneScale: props.sceneScale,
				geometryEndpointRequest: props.geometryEndpointRequest,
				lightingRequest: props.lightingRequest,
				props,
				}),
			);
			this._requiredObjects = [...this._requiredObjectsPacket.objects];

			for (const object of this._requiredObjects) {
				if (object && !object.parent) {
					this._solidScene.add(object);
				}
			}
		} catch (error) {
			this._requiredObjectsError = error;
			this._requiredObjectsPacket = null;
			this._requiredObjects = [];
			this.props.logger?.error?.('Algorithm32 required Three object setup failed.', error);
		}
	}

	/**
	 * Recreate the composer and its initial render pass.
	 *
	 * @returns {void}
	 */
	_recreateComposer() {
		this._disposeRuntime();
		this._disposeComposer();

		if (!this.props.renderer || !this.props.camera) {
			return;
		}

		const viewportSize = this._viewportSize();
		const widthPixels = viewportSize.width;
		const heightPixels = viewportSize.height;

		const createRenderTarget = this.props.createRenderTarget
			?? this._createDefaultRenderTarget.bind(this);

		this._renderTarget = createRenderTarget({
			THREE,
			viewportSize,
			props: this.props,
		});
		this._composer = new EffectComposer(this.props.renderer, this._renderTarget);
		this._cacheBackend = new ThreeCacheBackend({
			THREE,
			renderer: this.props.renderer,
		});
		this._renderPass = new RenderPass(this._solidScene, this.props.camera);
		this._composer.setPixelRatio(1);
		this._composer.setSize(widthPixels, heightPixels);
		this._composer.addPass(this._renderPass);
		this._composerNeedsSetup = true;
	}

	/**
	 * Create the composer when its required renderer inputs are available.
	 *
	 * @returns {void}
	 */
	_ensureComposer() {
		if (!this._composer && this.props.renderer && this.props.camera) {
			this._recreateComposer();
		}
	}

	/**
	 * Start one generation-safe Algorithm32 shader setup.
	 *
	 * @returns {void}
	 */
	_setupRuntime() {
		this._composerNeedsSetup = false;

		if (this._requiredObjectsError) {
			this._setStateIfMounted({
				setupError: this._requiredObjectsError,
				shaderReady: Boolean(this._shaderHandle),
			});
			return;
		}

		if (!this.props.enabled
			|| !this.props.config
			|| !this._composer
			|| !this._cacheBackend
			|| !this.props.camera) {
			this._disposeRuntime();
			this._setStateIfMounted({
				setupError: null,
				shaderReady: false,
			});
			return;
		}

		const generation = ++this._setupGeneration;
		this._pendingSetupCancellation?.abort();
		const setupCancellation = new AbortController();
		this._pendingSetupCancellation = setupCancellation;
		const viewportSize = this._viewportSize();
		const createAlgorithm32 = this.props.createAlgorithm32
			?? this._createDefaultAlgorithm32.bind(this);
		const createBindingValues = this.props.createBindingValues
			?? this._createDefaultBindingValues.bind(this);
		const algorithm32 = createAlgorithm32(this.props.config);
		const bindingValues = createBindingValues({
			THREE,
			config: this.props.config,
			props: this.props,
		});
		const setupRequest = {
			logger: this.props.logger,
			...(this.props.setupOptions ?? {}),
			THREE,
			composer: this._composer,
			scene: this._solidScene,
			camera: this.props.camera,
			viewportSize,
			sceneScale: this.props.sceneScale,
			bindingValues,
			cacheBackend: this._cacheBackend,
			signal: setupCancellation.signal,
		};

		if (this.props.sceneDepthMax !== null) {
			setupRequest.sceneDepthMax = this.props.sceneDepthMax;
		}

		const previousAlgorithm32 = this._algorithm32;
		const previousShaderHandle = this._shaderHandle;
		this._setStateIfMounted({
			setupError: null,
			shaderReady: Boolean(previousShaderHandle),
		});
		if (this.props.updateBindingValues !== null) {
			this.props.updateBindingValues({
				bindingValues,
				camera: this.props.camera,
				delta: 0,
				frameState: null,
				props: this.props,
			});
		}

		algorithm32.setupShader(setupRequest).then((shaderHandle) => {
			if (this._pendingSetupCancellation === setupCancellation) {
				this._pendingSetupCancellation = null;
			}
			if (!this._isCurrentSetup(generation)) {
				shaderHandle.dispose();
				algorithm32.dispose();
				return;
			}

			this._algorithm32 = algorithm32;
			this._shaderHandle = shaderHandle;
			this._bindingValues = bindingValues;
			previousShaderHandle?.dispose?.();
			previousAlgorithm32?.dispose?.();
			this._setStateIfMounted({
				setupError: null,
				shaderReady: true,
			});
			this.props.onSetupReady?.({
				algorithm32,
				bindingValues,
				shaderHandle,
				solidScene: this._solidScene,
			});
		}).catch((error) => {
			if (this._pendingSetupCancellation === setupCancellation) {
				this._pendingSetupCancellation = null;
			}
			algorithm32.dispose();
			if (!this._isCurrentSetup(generation)) {
				return;
			}

			this.props.logger?.error?.('Algorithm32 shader setup failed.', error);
			this._setStateIfMounted({
				setupError: error,
				shaderReady: Boolean(this._shaderHandle),
			});
			this.props.onSetupError?.(error);
		});
	}

	/**
	 * Rebuild the active attachment transactionally for a config-only update.
	 * The handle retains its prior runtime and cache when the replacement fails.
	 *
	 * @returns {void}
	 */
	_refreshRuntimeConfig() {
		if (!this._shaderHandle || !this.props.config) {
			this._setupRuntime();
			return;
		}

		this._pendingSetupCancellation?.abort();
		this._pendingSetupCancellation = null;
		const generation = ++this._setupGeneration;
		const shaderHandle = this._shaderHandle;
		this._setStateIfMounted({
			setupError: null,
			shaderReady: true,
		});
		shaderHandle.setConfig(this.props.config).then(() => {
			if (!this._isCurrentSetup(generation) || shaderHandle !== this._shaderHandle) {
				return;
			}
			this._setStateIfMounted({
				setupError: null,
				shaderReady: true,
			});
			this.props.onSetupReady?.({
				algorithm32: this._algorithm32,
				bindingValues: this._bindingValues,
				shaderHandle,
				solidScene: this._solidScene,
			});
		}).catch((error) => {
			if (!this._isCurrentSetup(generation) || shaderHandle !== this._shaderHandle) {
				return;
			}
			this.props.logger?.error?.('Algorithm32 shader refresh failed.', error);
			this._setStateIfMounted({
				setupError: error,
				shaderReady: true,
			});
			this.props.onSetupError?.(error);
		});
	}

	/**
	 * Create an Algorithm32 atmosphere composer.
	 *
	 * @param {object} props - Supplies renderer, model, and presentation inputs.
	 */
	constructor(props) {
		super(props);

		this.state = {
			setupError: null,
			shaderReady: false,
		};

		this._mounted = false;
		this._setupGeneration = 0;
		this._pendingSetupCancellation = null;
		this._composer = null;
		this._cacheBackend = null;
		this._renderTarget = null;
		this._renderPass = null;
		this._algorithm32 = null;
		this._shaderHandle = null;
		this._bindingValues = null;
		this._solidScene = new THREE.Scene();
		this._requiredObjects = [];
		this._requiredObjectsPacket = null;
		this._requiredObjectsInput = null;
		this._requiredObjectsError = null;
		this._composerNeedsSetup = false;
		this._updateBackground(props);
		this._syncRequiredObjects(props);
	}

	/**
	 * Mount the composer and start runtime setup.
	 *
	 * @returns {void}
	 */
	componentDidMount() {
		this._mounted = true;
		this._ensureComposer();
		this._setupRuntime();
	}

	/**
	 * Reconcile composer and runtime state after prop changes.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {void}
	 */
	componentDidUpdate(previousProps) {
		this._updateBackground(this.props);
		this._syncRequiredObjects(this.props);

		if (this._composerInputsChanged(previousProps)) {
			this._recreateComposer();
		} else if (this._composer) {
			const viewportSize = this._viewportSize();
			const widthPixels = viewportSize.width;
			const heightPixels = viewportSize.height;

			this._composer.setPixelRatio(1);
			this._composer.setSize(widthPixels, heightPixels);
		}

		if (this._setupInputsChanged(previousProps) || this._composerNeedsSetup) {
			if (!this._composerNeedsSetup && this._canRefreshRuntimeConfig(previousProps)) {
				this._refreshRuntimeConfig();
			} else {
				this._setupRuntime();
			}
		}
	}

	/**
	 * Dispose runtime and renderer resources before unmounting.
	 *
	 * @returns {void}
	 */
	componentWillUnmount() {
		this._mounted = false;
		this._disposeRuntime();
		this._disposeComposer();
		this._disposeRequiredObjects();
	}

	/**
	 * Called by the R3F bridge on each frame.
	 *
	 * @param {object} frameState - Supplies R3F frame state.
	 * @param {number} delta - Supplies frame delta time.
	 * @returns {boolean} True when the Algorithm32 composer rendered the frame.
	 */
	renderAlgorithm32Frame(frameState, delta) {
		if (!this.props.enabled || !this.state.shaderReady || !this._composer) {
			return false;
		}

		this._updateBindingValues(frameState, delta);
		this._composer.render(delta);

		return true;
	}

	/**
	 * Return the composer scene that receives endpoint children.
	 *
	 * @returns {THREE.Scene} The solid scene.
	 */
	getSolidScene() {
		return this._solidScene;
	}

	/**
	 * Return the scene the bridge should render while Algorithm32 is not ready.
	 *
	 * @returns {THREE.Scene | null} The fallback scene, or null when disabled.
	 */
	getFallbackScene() {
		return this.props.enabled ? this._solidScene : null;
	}

	/**
	 * Render children directly or portal them into the solid scene.
	 *
	 * @returns {React.ReactNode} Return the component presentation.
	 */
	render() {
		if (!this.props.enabled) {
			return React.createElement(
				React.Fragment,
				null,
				this.props.children,
			);
		}

		return createPortal(this.props.children, this._solidScene);
	}
}
