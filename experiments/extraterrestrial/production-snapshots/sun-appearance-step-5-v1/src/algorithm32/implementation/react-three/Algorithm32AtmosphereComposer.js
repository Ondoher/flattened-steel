import React from 'react';
import {createPortal} from '@react-three/fiber';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';

import {Algorithm32} from '../algorithm32/Algorithm32.js';
import {ThreeCacheBackend} from '../three-cache-backend/ThreeCacheBackend.js';
import {Algorithm32Bindings} from './Algorithm32Bindings.js';
import {Algorithm32R3FValues} from './Algorithm32R3FValues.js';
import {Algorithm32ThreeResources} from './Algorithm32ThreeResources.js';
import {DEFAULT_ALGORITHM32_SCENE_SCALE} from './consts.js';

/** Object that wraps arbitrary Three/R3F children in a production Algorithm32 composer chain. */
export class Algorithm32AtmosphereComposer extends React.Component {
	/**
	 * Called by algorithm32 atmosphere composer to create the default Algorithm32 facade.
	 *
	 * @param {Config} config - Supplies the Algorithm32 configuration.
	 * @returns {Algorithm32} - Return the configured facade.
	 */
	_createDefaultAlgorithm32(config) {
		return new Algorithm32(config);
	}

	/**
	 * Called by algorithm32 atmosphere composer to create the default mutable renderer binding values.
	 *
	 * @param {Algorithm32DefaultBindingValuesRequest} request - Supplies renderer setup values.
	 * @returns {Record<string, unknown>} - Return mutable binding values.
	 */
	_createDefaultBindingValues({THREE: threeNamespace, props}) {
		return Algorithm32Bindings.create(threeNamespace, props.sceneDepthMax);
	}

	/**
	 * Called by algorithm32 atmosphere composer to create the default scene-color render target.
	 *
	 * @param {Algorithm32SceneColorRenderTargetRequest} request - Supplies renderer setup values.
	 * @returns {unknown} - Return the render target.
	 */
	_createDefaultRenderTarget({THREE: threeNamespace, viewportSize}) {
		return Algorithm32ThreeResources.createSceneColorRenderTarget({
			THREE: threeNamespace,
			viewportSize,
		});
	}

	/**
	 * Called by algorithm32 atmosphere composer to compare two shallow object snapshots. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {object | null} left - Supplies the left snapshot.
	 * @param {object | null} right - Supplies the right snapshot.
	 * @returns {boolean} - Return whether both snapshots contain identical values.
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

		return leftKeys.every(
			/**
			 * Called by Array.prototype.every to test one collection value against the shared condition.
			 * @param key - The identity key accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (key) => left[key] === right[key],
		);
	}

	/**
	 * Called by algorithm32 atmosphere composer to dispose one Three material or material collection.
	 *
	 * @param {unknown} material - Supplies material state to dispose.
	 * @returns {void} -
	 */
	_disposeMaterial(material) {
		if (Array.isArray(material)) {
			for (const entry of material) {
				entry?.dispose?.();
			}
			return;
		}

		const candidate = /** @type {{ dispose?: () => void } | null} */ (material);
		candidate?.dispose?.();
	}

	/**
	 * Called by algorithm32 atmosphere composer to dispose one Three object and its owned geometry and materials.
	 *
	 * @param {unknown} object - Supplies the object to dispose.
	 * @returns {void} -
	 */
	_disposeThreeObject(object) {
		const candidate =
			/** @type {{
			 * parent?: { remove?: (object: unknown) => void },
			 * traverse?: (visitor: (child: {
			 * geometry?: { dispose?: () => void },
			 * material?: unknown,
			 * }) => void) => void,
			 * } | null} */ (object);
		candidate?.parent?.remove?.(object);
		candidate?.traverse?.(
			/**
			 * Called by the scene traversal to process one traversed scene object.
			 * @param child - The child value accepted by the operation.
			 */ (child) => {
				child.geometry?.dispose?.();
				this._disposeMaterial(child.material);
			},
		);
	}

	/** Default props value. */ static defaultProps = {
		enabled: true,
		background: '#060912',
		sceneScale: DEFAULT_ALGORITHM32_SCENE_SCALE,
		sceneDepthMax: null,
		logger: console,
		setupOptions: null,
		includeRequiredObjects: true,
		createRequiredObjects: Algorithm32ThreeResources.createRequiredThreeObjects,
		requiredObjectsKey: null,
		createAlgorithm32: null,
		createBindingValues: null,
		createRenderTarget: null,
		updateBindingValues: Algorithm32Bindings.update,
		onSetupError: null,
		onSetupReady: null,
	};

	/**
	 * Called by algorithm32 atmosphere composer to check whether renderer inputs require composer reconstruction.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {boolean} - Return whether composer inputs changed.
	 */
	_composerInputsChanged(previousProps) {
		return (
			previousProps.renderer !== this.props.renderer ||
			previousProps.camera !== this.props.camera ||
			previousProps.createRenderTarget !== this.props.createRenderTarget
		);
	}

	/**
	 * Called by algorithm32 atmosphere composer to check whether Algorithm32 setup inputs changed.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {boolean} - Return whether runtime setup inputs changed.
	 */
	_setupInputsChanged(previousProps) {
		return (
			previousProps.enabled !== this.props.enabled ||
			previousProps.config !== this.props.config ||
			previousProps.camera !== this.props.camera ||
			previousProps.sceneScale !== this.props.sceneScale ||
			previousProps.sceneDepthMax !== this.props.sceneDepthMax ||
			previousProps.createAlgorithm32 !== this.props.createAlgorithm32 ||
			previousProps.createBindingValues !== this.props.createBindingValues ||
			previousProps.setupOptions !== this.props.setupOptions
		);
	}

	/**
	 * Called by algorithm32 atmosphere composer to check whether an installed handle can transactionally apply the only changed setup input.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {boolean} - Return whether only Algorithm32 config changed.
	 */
	_canRefreshRuntimeConfig(previousProps) {
		return (
			Boolean(this._algorithm32 && this._shaderHandle) &&
			previousProps.config !== this.props.config &&
			previousProps.enabled === this.props.enabled &&
			previousProps.camera === this.props.camera &&
			previousProps.sceneScale === this.props.sceneScale &&
			previousProps.sceneDepthMax === this.props.sceneDepthMax &&
			previousProps.createAlgorithm32 === this.props.createAlgorithm32 &&
			previousProps.createBindingValues === this.props.createBindingValues &&
			previousProps.setupOptions === this.props.setupOptions
		);
	}

	/**
	 * Called by algorithm32 atmosphere composer to select the prop values that determine required Three objects.
	 *
	 * @param {object} props - Supplies the active component props.
	 * @returns {object} - Return the required-object input snapshot.
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
	 * Called by algorithm32 atmosphere composer to apply the configured solid-scene background.
	 *
	 * @param {object} props - Supplies the active component props.
	 * @returns {void} -
	 */
	_updateBackground(props) {
		if (!props.background) {
			this._solidScene.background = null;
			return;
		}

		this._solidScene.background = props.background.isColor ? props.background : new THREE.Color(props.background);
	}

	/**
	 * Called by algorithm32 atmosphere composer to update caller-owned binding values for one frame.
	 *
	 * @param {unknown} frameState - Supplies the active renderer frame state.
	 * @param {number} delta - Supplies elapsed frame time.
	 * @returns {void} -
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
	 * Called by algorithm32 atmosphere composer to check whether an asynchronous setup generation remains current.
	 *
	 * @param {number} generation - Supplies the candidate setup generation.
	 * @returns {boolean} - Return whether the generation may publish results.
	 */
	_isCurrentSetup(generation) {
		return this._mounted && generation === this._setupGeneration;
	}

	/**
	 * Called by algorithm32 atmosphere composer to resolve the current unit-bearing viewport size.
	 *
	 * @returns {PixelSize} - Return the accepted viewport dimensions.
	 */
	_viewportSize() {
		return Algorithm32R3FValues.viewportSize(this.props.size);
	}

	/**
	 * Called by algorithm32 atmosphere composer to publish state through React or update pre-mount state directly.
	 *
	 * @param {object} nextState - Supplies the state fields to publish.
	 * @returns {void} -
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
	 * Called by algorithm32 atmosphere composer to dispose the active shader handle and Algorithm32 facade.
	 *
	 * @returns {void} -
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
	 * Called by algorithm32 atmosphere composer to dispose the active composer and render-target state.
	 *
	 * @returns {void} -
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
	 * Called by algorithm32 atmosphere composer to dispose all currently owned required Three objects.
	 *
	 * @returns {void} -
	 */
	_disposeRequiredObjects() {
		for (const object of this._requiredObjects) {
			this._disposeThreeObject(object);
		}

		this._requiredObjects = [];
		this._requiredObjectsPacket = null;
	}

	/**
	 * Called by required-object synchronization to accept a result at the composer boundary.
	 *
	 * @param {unknown} value - Supplies the custom or default result.
	 * @returns {Algorithm32RequiredObjectsPacket} - The accepted required-object packet.
	 */
	_acceptRequiredObjectsPacket(value) {
		return /** @type {Algorithm32RequiredObjectsPacket} */ (value);
	}

	/**
	 * Called by algorithm32 atmosphere composer to reconcile geometry- and source-owned Three objects.
	 *
	 * @param {object} props - Supplies the active component props.
	 * @returns {void} -
	 */
	_syncRequiredObjects(props) {
		const nextInput = this._requiredObjectsInputsFor(props);

		if (this._shallowEqualObject(nextInput, this._requiredObjectsInput)) {
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
			this._requiredObjectsPacket = this._acceptRequiredObjectsPacket(
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
	 * Called by algorithm32 atmosphere composer to recreate the composer and its initial render pass.
	 *
	 * @returns {void} -
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

		const createRenderTarget = this.props.createRenderTarget ?? this._createDefaultRenderTarget.bind(this);

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
	 * Called by algorithm32 atmosphere composer to create the composer when its required renderer inputs are available.
	 *
	 * @returns {void} -
	 */
	_ensureComposer() {
		if (!this._composer && this.props.renderer && this.props.camera) {
			this._recreateComposer();
		}
	}

	/**
	 * Called by algorithm32 atmosphere composer to start one generation-safe Algorithm32 shader setup.
	 *
	 * @returns {void} -
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

		if (!this.props.enabled || !this.props.config || !this._composer || !this._cacheBackend || !this.props.camera) {
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
		const createAlgorithm32 = this.props.createAlgorithm32 ?? this._createDefaultAlgorithm32.bind(this);
		const createBindingValues = this.props.createBindingValues ?? this._createDefaultBindingValues.bind(this);
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

		algorithm32
			.setupShader(setupRequest)
			.then(
				/**
				 * Called by the promise continuation to handle one callback invocation.
				 * @param shaderHandle - The shader handle value accepted by the operation.
				 */ (shaderHandle) => {
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
				},
			)
			.catch(
				/**
				 * Called by the promise rejection handler to handle one callback invocation.
				 * @param error - The error observed by the operation.
				 */ (error) => {
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
				},
			);
	}

	/**
	 * Called by algorithm32 atmosphere composer to rebuild the active attachment transactionally for a config-only update. The handle retains its prior runtime and cache when the replacement fails.
	 *
	 * @returns {void} -
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
		shaderHandle
			.setConfig(this.props.config)
			.then(
				/** Called by the promise continuation to handle one callback invocation. */ () => {
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
				},
			)
			.catch(
				/**
				 * Called by the promise rejection handler to handle one callback invocation.
				 * @param error - The error observed by the operation.
				 */ (error) => {
					if (!this._isCurrentSetup(generation) || shaderHandle !== this._shaderHandle) {
						return;
					}
					this.props.logger?.error?.('Algorithm32 shader refresh failed.', error);
					this._setStateIfMounted({
						setupError: error,
						shaderReady: true,
					});
					this.props.onSetupError?.(error);
				},
			);
	}

	/**
	 * Creates an Algorithm32 atmosphere composer.
	 *
	 * @param {object} props - Supplies renderer, model, and presentation inputs.
	 *
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
	 * Call this method to mount the composer and start runtime setup.
	 *
	 * @returns {void} -
	 */
	componentDidMount() {
		this._mounted = true;
		this._ensureComposer();
		this._setupRuntime();
	}

	/**
	 * Call this method to reconcile composer and runtime state after prop changes.
	 *
	 * @param {object} previousProps - Supplies the preceding prop snapshot.
	 * @returns {void} -
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
	 * Call this method to dispose runtime and renderer resources before unmounting.
	 *
	 * @returns {void} -
	 */
	componentWillUnmount() {
		this._mounted = false;
		this._disposeRuntime();
		this._disposeComposer();
		this._disposeRequiredObjects();
	}

	/**
	 * Call this method to called by the R3F bridge on each frame. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {object} frameState - Supplies R3F frame state.
	 * @param {number} delta - Supplies frame delta time.
	 * @returns {boolean} - True when the Algorithm32 composer rendered the frame.
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
	 * Call this method to return the composer scene that receives endpoint children.
	 *
	 * @returns {THREE.Scene} - The solid scene.
	 */
	getSolidScene() {
		return this._solidScene;
	}

	/**
	 * Call this method to return the scene the bridge should render while Algorithm32 is not ready. Conditional result values are selected from the accepted input and current state.
	 *
	 * @returns {THREE.Scene | null} - The fallback scene, or null when disabled.
	 */
	getFallbackScene() {
		return this.props.enabled ? this._solidScene : null;
	}

	/**
	 * Call this method to render children directly or portal them into the solid scene.
	 *
	 * @returns {React.ReactNode} - Return the component presentation.
	 */
	render() {
		if (!this.props.enabled) {
			return React.createElement(React.Fragment, null, this.props.children);
		}

		return createPortal(this.props.children, this._solidScene);
	}
}
