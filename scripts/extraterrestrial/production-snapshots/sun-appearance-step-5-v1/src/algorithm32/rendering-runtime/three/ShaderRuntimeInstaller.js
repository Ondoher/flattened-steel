import DistanceMath from '../../math/DistanceMath.js';
import SceneMath from '../../math/SceneMath.js';
import {PixelMath} from '../../math/PixelMath.js';
import {EMPTY_SHADER_BUILD_CONTEXT} from '../consts.js';
import {FIGURE1_DISPLAY_CONSTANTS} from '../../implementation/bruneton-color/consts.js';
import {SkyExposureRuntime} from '../../implementation/bruneton-color/three/SkyExposureRuntime.js';
import {SceneInputCapture} from './SceneInputCapture.js';
import {ShaderRuntimePass} from './ShaderRuntimePass.js';

/** Three composer installation for assembled Algorithm32 runtime shaders. */
export class ShaderRuntimeInstaller {
	/**
	 * Facade-owned shared model used to resolve geometry runtime facts.
	 *
	 * @type {SharedModel}
	 */
	_model;

	/**
	 * Creates a Three runtime installer for one facade-owned shared model.
	 *
	 * @param {SharedModel} model - The facade-owned shared model.
	 */
	constructor(model) {
		this._model = model;
	}

	/**
	 * Called by ShaderRuntimeInstaller to remove a pass from a composer that exposes a removable surface.
	 *
	 * @param {unknown} composer - The composer that owns the pass.
	 * @param {unknown} pass - The pass to remove.
	 * @returns {void} - No return value.
	 */
	_removeComposerPass(composer, pass) {
		const candidate = /** @type {ShaderRuntimeComposer} */ (composer);

		if (typeof candidate?.removePass === 'function') {
			candidate.removePass(pass);
			return;
		}

		if (Array.isArray(candidate?.passes)) {
			const index = candidate.passes.indexOf(pass);

			if (index !== -1) {
				candidate.passes.splice(index, 1);
			}
		}
	}

	/**
	 * Called by ShaderRuntimeInstaller to normalize an accepted setup value at the GLSL uniform boundary. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {string} valueKey - The logical binding key.
	 * @param {unknown} value - The accepted binding or owner default.
	 * @returns {unknown} - The shader-compatible scalar, vector, or unchanged value.
	 */
	_normalizeShaderUniformValue(valueKey, value) {
		if (value == null) {
			return value;
		}

		if (valueKey === 'runtime.viewportSize') {
			return PixelMath.pixelSizeToShaderValue(/** @type {PixelSize} */ (value));
		}

		if (valueKey === 'geometry.sceneTermination' || valueKey === 'geometry.sceneDepthMax') {
			return DistanceMath.toMeters(/** @type {Distance} */ (value));
		}

		return value;
	}

	/**
	 * Called by ShaderRuntimeInstaller to resolve a uniform value from setup-provided values or an owner default.
	 *
	 * @param {ShaderRuntimeBindingValues} bindingValues - The setup binding values.
	 * @param {ShaderUniformDeclaration} uniform - The uniform declaration.
	 * @returns {unknown} - The resolved uniform value.
	 */
	_resolveBindingValue(bindingValues, uniform) {
		if (Object.hasOwn(bindingValues, uniform.valueKey)) {
			return this._normalizeShaderUniformValue(uniform.valueKey, bindingValues[uniform.valueKey]);
		}

		return Object.hasOwn(uniform, 'defaultValue') ? uniform.defaultValue : null;
	}

	/**
	 * Called by ShaderRuntimeInstaller to create a render-time refresh for caller-owned mutable binding values.
	 *
	 * @param {ShaderAssemblyResult} assembly - The installed uniform declarations.
	 * @param {ShaderRuntimeUniformMap} uniforms - The installed uniforms.
	 * @param {ShaderRuntimeBindingValues} bindingValues - The live caller-owned record.
	 * @returns {() => void} - The uniform refresh operation.
	 */
	_createUniformValueRefresher(assembly, uniforms, bindingValues) {
		const liveUniforms = assembly.contributions.flatMap(
			/**
			 * Called by Array.prototype.flatMap to transform and flatten one collection value.
			 * @param contribution - The contribution value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (contribution) =>
				contribution.uniforms
					.filter(
						/**
						 * Called by Array.prototype.filter to test whether one collection value is retained.
						 * @param uniform - The uniform value accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (uniform) => Object.hasOwn(bindingValues, uniform.valueKey),
					)
					.map(
						/**
						 * Called by Array.prototype.map to transform one collection value.
						 * @param uniform - The uniform value accepted by the operation.
						 * @returns - The callback result returned to its caller.
						 */ (uniform) => ({
							declaration: uniform,
							runtime: uniforms[uniform.name],
						}),
					),
		);

		return /** Called by create uniform value refresher to handle one invocation of the declared operation. */ () => {
			for (const uniform of liveUniforms) {
				uniform.runtime.value = this._resolveBindingValue(bindingValues, uniform.declaration);
			}
		};
	}

	/**
	 * Called by ShaderRuntimeInstaller to determine whether a prepared required binding has a usable value.
	 *
	 * @param {ShaderRuntimeBindingValues} bindingValues - The prepared values.
	 * @param {string} valueKey - The runtime binding key.
	 * @returns {boolean} - Whether the key has a non-nullish value.
	 */
	_hasAvailableBindingValue(bindingValues, valueKey) {
		return (
			Object.hasOwn(bindingValues, valueKey) &&
			bindingValues[valueKey] !== null &&
			bindingValues[valueKey] !== undefined
		);
	}

	/**
	 * Called by ShaderRuntimeInstaller to determine whether an accepted assembly references one binding value key.
	 *
	 * @param {ShaderAssemblyResult} assembly - The accepted shader assembly.
	 * @param {string} valueKey - The binding value key.
	 * @returns {boolean} - Whether the assembly references the value key.
	 */
	_assemblyUsesValueKey(assembly, valueKey) {
		for (const binding of assembly.bindingRequirements) {
			if (binding.valueKey === valueKey) {
				return true;
			}
		}

		for (const contribution of assembly.contributions) {
			for (const uniform of contribution.uniforms) {
				if (uniform.valueKey === valueKey) {
					return true;
				}
			}

			for (const texture of contribution.textures) {
				if (texture.valueKey === valueKey) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Called by ShaderRuntimeInstaller to resolve the geometry-owned scene-depth cap fallback.
	 *
	 * @param {GeometryModel | undefined} geometry - The configured geometry.
	 * @param {ShaderSetupRequest} setup - The setup-time runtime facts.
	 * @param {SceneScale} sceneScale - The renderer scene-to-physical scale.
	 * @returns {Distance | null} - The geometry-owned cap or null.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_geometrySceneDepthMax(geometry, setup, sceneScale) {
		if (typeof geometry?.resolveSceneDepthMax !== 'function') {
			return null;
		}

		const camera = /** @type {ShaderRuntimeCameraCandidate} */ (setup.camera);
		let cameraScenePosition = null;

		if (camera?.position) {
			const {x, y, z} = camera.position;

			if (
				![x, y, z].every(
					/**
					 * Called by Array.prototype.every to test one collection value against the shared condition.
					 * @param coordinate - The coordinate value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate),
				)
			) {
				throw new TypeError('Shader setup camera position must contain finite coordinates.');
			}

			cameraScenePosition = SceneMath.positionInSceneUnits(/** @type {[number, number, number]} */ ([x, y, z]));
		}
		const value = geometry.resolveSceneDepthMax({
			camera: setup.camera,
			cameraScenePosition,
			sceneScale,
		});

		return value ?? null;
	}

	/**
	 * Called by ShaderRuntimeInstaller to create scene-input capture configuration from setup and facade config.
	 *
	 * @param {ShaderBuildRequest} request - The build request.
	 * @param {GeometryModel | undefined} geometry - The configured geometry.
	 * @returns {ShaderRuntimeSceneInputCaptureConfig} - The normalized capture configuration.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_runtimeSceneInputCaptureConfig(request, geometry) {
		const shaderConfig = request.config?.config?.shader === undefined ? {} : request.config.config.shader;
		const setup = request.setup;
		const sceneScale =
			setup.sceneScale !== undefined
				? setup.sceneScale
				: shaderConfig.sceneScale !== undefined
					? shaderConfig.sceneScale
					: SceneMath.scaleInMetersPerSceneUnit(1);
		SceneMath.assertSceneScale(sceneScale, 'Shader setup sceneScale');
		const geometryDepthMax = this._geometrySceneDepthMax(geometry, setup, sceneScale);
		const sceneDepthMax =
			setup.sceneDepthMax !== undefined
				? setup.sceneDepthMax
				: shaderConfig.sceneDepthMax !== undefined
					? shaderConfig.sceneDepthMax
					: geometryDepthMax === null
						? DistanceMath.inMeters(100000)
						: geometryDepthMax;
		DistanceMath.assertDistance(sceneDepthMax, 'Shader setup sceneDepthMax');

		if (DistanceMath.toMeters(sceneDepthMax) <= 0) {
			throw new RangeError('Shader setup sceneDepthMax must be positive.');
		}

		return {
			viewportSize: setup.viewportSize,
			sceneDepthMax,
			sceneScale,
		};
	}

	/**
	 * Called by ShaderRuntimeInstaller to determine whether a required uniform has an owner-provided default.
	 *
	 * @param {readonly ShaderContribution[]} contributions - The accepted contributions.
	 * @param {string} valueKey - The runtime uniform key.
	 * @returns {boolean} - Whether a non-nullish uniform default exists.
	 */
	_hasAvailableUniformDefault(contributions, valueKey) {
		for (const contribution of contributions) {
			for (const uniform of contribution.uniforms) {
				if (
					uniform.valueKey === valueKey &&
					Object.hasOwn(uniform, 'defaultValue') &&
					uniform.defaultValue !== null &&
					uniform.defaultValue !== undefined
				) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Called by ShaderRuntimeInstaller to create renderer-produced scene input bindings needed by the runtime shader.
	 *
	 * @param {ShaderBuildRequest} request - The build request.
	 * @param {ShaderAssemblyResult} assembly - The accepted shader source.
	 * @param {ShaderRuntimeBindingValues} bindingValues - The known binding values.
	 * @returns {ShaderRuntimeSceneInputBindings} - The scene-input capture and binding patch.
	 */
	_createRuntimeSceneInputBindings(request, assembly, bindingValues) {
		/** @type {ShaderRuntimeBindingValues} */
		const bindingPatch = {};
		const needsDepthTexture = this._assemblyUsesValueKey(assembly, 'runtime.sceneDepthTexture');
		const needsHitTexture = this._assemblyUsesValueKey(assembly, 'runtime.sceneHitTexture');
		const needsViewportSize = this._assemblyUsesValueKey(assembly, 'runtime.viewportSize');
		const needsSceneDepthMax = this._assemblyUsesValueKey(assembly, 'geometry.sceneDepthMax');
		const missingDepthTexture =
			needsDepthTexture && !this._hasAvailableBindingValue(bindingValues, 'runtime.sceneDepthTexture');
		const missingHitTexture =
			needsHitTexture && !this._hasAvailableBindingValue(bindingValues, 'runtime.sceneHitTexture');
		const missingSceneDepthMax =
			needsSceneDepthMax && !this._hasAvailableBindingValue(bindingValues, 'geometry.sceneDepthMax');
		let captureConfig = null;
		let sceneInputCapture = null;

		if (missingDepthTexture || missingHitTexture) {
			captureConfig = this._runtimeSceneInputCaptureConfig(request, this._model.geometry);

			sceneInputCapture = new SceneInputCapture({
				THREE: /** @type {SceneInputCaptureThreeNamespace} */ (request.setup.THREE),
				scene: /** @type {SceneInputCaptureScene} */ (request.setup.scene),
				camera: /** @type {SceneInputCaptureCamera} */ (request.setup.camera),
				performanceCallback: request.setup.performanceCallback,
				performanceSampleIntervalFrames: request.setup.performanceSampleIntervalFrames,
				performanceMaxPendingQueries: request.setup.performanceMaxPendingQueries,
				...captureConfig,
			});
			const captureValues = sceneInputCapture.bindingValues();

			if (missingDepthTexture) {
				bindingPatch['runtime.sceneDepthTexture'] = captureValues['runtime.sceneDepthTexture'];
			}

			if (missingHitTexture) {
				bindingPatch['runtime.sceneHitTexture'] = captureValues['runtime.sceneHitTexture'];
			}
		}

		if (needsViewportSize) {
			bindingPatch['runtime.viewportSize'] = sceneInputCapture
				? sceneInputCapture.viewportSize
				: request.setup.viewportSize;
		}

		if (missingSceneDepthMax) {
			if (!captureConfig) {
				captureConfig = this._runtimeSceneInputCaptureConfig(request, this._model.geometry);
			}
			bindingPatch['geometry.sceneDepthMax'] = captureConfig.sceneDepthMax;
		}

		return {
			sceneInputCapture,
			bindingValues: bindingPatch,
		};
	}

	/**
	 * Called by ShaderRuntimeInstaller to require setup values for every required shader binding.
	 *
	 * @param {ShaderAssemblyResult} assembly - The shader binding requirements.
	 * @param {ShaderRuntimeBindingValues} bindingValues - The prepared binding values.
	 * @param {CacheRuntimeBindings | null} runtimeBindings - The opaque cache bindings accepted by the backend.
	 * @returns {void} - No return value.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_assertRequiredBindingsAvailable(assembly, bindingValues, runtimeBindings = null) {
		const cacheValueKeys = /** @type {Set<string>} */ (
			new Set(
				runtimeBindings?.bindings.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param binding - The binding value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (binding) => binding.valueKey,
				) ?? [],
			)
		);
		for (const binding of assembly.bindingRequirements) {
			if (!binding.required) {
				continue;
			}

			if (this._hasAvailableBindingValue(bindingValues, binding.valueKey)) {
				continue;
			}

			if (binding.kind === 'texture' && cacheValueKeys.has(binding.valueKey)) {
				continue;
			}

			if (
				binding.kind === 'uniform' &&
				this._hasAvailableUniformDefault(assembly.contributions, binding.valueKey)
			) {
				continue;
			}

			throw new TypeError(`Required shader binding ${binding.id} (${binding.valueKey}) is missing.`);
		}
	}

	/**
	 * Called by ShaderRuntimeInstaller to collect independently owned cache resources into one backend installation request.
	 *
	 * @param {ShaderBuildContext} buildContext - The automatic setup context.
	 * @returns {CacheRuntimeBindings | null} - The combined binding collection or null when no cache resource is present.
	 * @throws {TypeError} - When resources from different backends are combined.
	 */
	_collectRuntimeBindings(buildContext) {
		const resources = [
			buildContext.scatteringCache,
			buildContext.distantSunCelestialCache,
			buildContext.stellarPointSetCache,
			buildContext.flatFiniteSunCache,
		].filter(
			/**
			 * Called by Array.prototype.filter to retain one installed cache resource.
			 *
			 * @param {GpuScatteringCache | CelestialCacheResource | null} resource - The candidate resource.
			 * @returns {resource is GpuScatteringCache | CelestialCacheResource} - Whether the resource is installed.
			 */
			(resource) => resource !== null,
		);

		if (resources.length === 0) {
			return null;
		}

		const bindingGroups = resources.map(
			/**
			 * Called by Array.prototype.map to read one resource's opaque bindings.
			 *
			 * @param {GpuScatteringCache | CelestialCacheResource} resource - The installed resource.
			 * @returns {CacheRuntimeBindings} - The resource binding collection.
			 */
			(resource) => resource.getRuntimeBindings(),
		);
		const backendId = bindingGroups[0].backendId;

		if (bindingGroups.some((group) => group.backendId !== backendId)) {
			throw new TypeError('Shader cache resources must share one renderer backend.');
		}

		return {
			backendId,
			bindings: bindingGroups.flatMap((group) => group.bindings),
		};
	}

	/**
	 * Called by ShaderRuntimeInstaller to create runtime uniforms from contribution declarations.
	 *
	 * @param {ShaderAssemblyResult} assembly - The accepted assembly.
	 * @param {ShaderRuntimeBindingValues} bindingValues - The initial binding values.
	 * @returns {ShaderRuntimeUniformMap} - The runtime uniforms.
	 */
	_createUniforms(assembly, bindingValues) {
		/** @type {ShaderRuntimeUniformMap} */
		const uniforms = {};

		for (const contribution of assembly.contributions) {
			for (const uniform of contribution.uniforms) {
				uniforms[uniform.name] = {
					value: this._resolveBindingValue(bindingValues, uniform),
				};
			}

			for (const texture of contribution.textures) {
				uniforms[texture.name] = {
					value: Object.hasOwn(bindingValues, texture.valueKey) ? bindingValues[texture.valueKey] : null,
				};
			}
		}

		return uniforms;
	}

	/**
	 * Call this method to install an assembled Algorithm32 shader on a Three composer when one is available.
	 *
	 * @param {ShaderBuildRequest} request - The accepted build request.
	 * @param {ShaderAssemblyResult} assembly - The accepted shader source.
	 * @param {ShaderBuildContext} [buildContext] - The automatic setup context.
	 * @returns {ShaderRuntimeArtifact | null} - The installed runtime state or null when no composer surface exists.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	install(request, assembly, buildContext = EMPTY_SHADER_BUILD_CONTEXT) {
		const composer = /** @type {ShaderRuntimeComposer} */ (request.setup.composer);
		const THREE = /** @type {ShaderRuntimePassThreeNamespace | undefined} */ (request.setup.THREE);

		if (typeof composer?.addPass !== 'function') {
			return null;
		}

		if (!THREE) {
			throw new TypeError('Shader setup requires THREE when installing a composer pass.');
		}

		let sceneInputCapture = null;
		let skyExposureRuntime = null;
		let pass = null;
		let sceneInputCaptureInstalled = false;
		let passInstalled = false;

		try {
			const preparedBindingValues = request.bindingValues === undefined ? {} : request.bindingValues;
			const runtimeSceneInputs = this._createRuntimeSceneInputBindings(request, assembly, preparedBindingValues);
			sceneInputCapture = runtimeSceneInputs.sceneInputCapture;
			const initialBindingValues = {
				...preparedBindingValues,
				...runtimeSceneInputs.bindingValues,
			};
			const runtimeBindings = this._collectRuntimeBindings(buildContext);
			/** @type {ShaderRuntimeUniformMap} */
			const uniforms = {};
			if (this._assemblyUsesValueKey(assembly, 'color.skyExposureCoefficientTexture')) {
				const geometry = /** @type {GeometryModel & SkyExposureGeometryCapability} */ (this._model.geometry);
				skyExposureRuntime = new SkyExposureRuntime({
					THREE: /** @type {SkyExposureRuntimeThreeNamespace} */ (THREE),
					fragmentShaderSource: assembly.fragmentShaderSource,
					uniforms,
					plan: geometry.createSkyExposureMeterPlan(),
					paperFigure1ToneMapK: FIGURE1_DISPLAY_CONSTANTS.paperFigure1ToneMapK,
					performanceCallback: request.setup.performanceCallback,
					performanceSampleIntervalFrames: request.setup.performanceSampleIntervalFrames,
					performanceMaxPendingQueries: request.setup.performanceMaxPendingQueries,
				});
			}
			const bindingValues = {
				...initialBindingValues,
				...(skyExposureRuntime?.bindingValues() ?? {}),
			};
			this._assertRequiredBindingsAvailable(assembly, bindingValues, runtimeBindings);
			Object.assign(uniforms, this._createUniforms(assembly, bindingValues));
			const refreshUniformValues = this._createUniformValueRefresher(assembly, uniforms, preparedBindingValues);
			if (runtimeBindings) {
				/** @type {ShaderRuntimeUniformMap} */
				const cacheUniforms = {};
				for (const contribution of assembly.contributions) {
					for (const texture of contribution.textures) {
						if (uniforms[texture.name]) {
							cacheUniforms[texture.valueKey] = uniforms[texture.name];
						}
					}
				}
				request.setup.cacheBackend.installRuntimeBindings({
					bindings: runtimeBindings,
					uniforms: cacheUniforms,
				});
			}
			pass = new ShaderRuntimePass({
				THREE,
				fragmentShaderSource: assembly.fragmentShaderSource,
				sourceHash: assembly.sourceHash,
				uniforms,
				viewportSize: request.setup.viewportSize,
				sceneInputCapture,
				refreshUniformValues,
				beforeRender: skyExposureRuntime
					? (renderer, deltaTimeSeconds) =>
							skyExposureRuntime.render(/** @type {SkyExposureRuntimeRenderer} */ (renderer), {
								deltaTimeSeconds,
							})
					: null,
				logger: request.setup.logger === undefined ? null : request.setup.logger,
				performanceCallback: request.setup.performanceCallback,
				performanceSampleIntervalFrames: request.setup.performanceSampleIntervalFrames,
				performanceMaxPendingQueries: request.setup.performanceMaxPendingQueries,
			});

			if (sceneInputCapture) {
				composer.addPass(sceneInputCapture);
				sceneInputCaptureInstalled = true;
			}

			composer.addPass(pass);
			passInstalled = true;

			return {
				/**
				 * Called by install to prepare.
				 * @param renderer - The renderer value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ prepare: async (renderer) => {
					if (skyExposureRuntime) {
						await skyExposureRuntime.prepare(/** @type {SkyExposureRuntimeRenderer} */ (renderer));
					}
					await pass.prepare(renderer);
				},
				/** Called by install to dispose. */ dispose: () => {
					this._removeComposerPass(composer, pass);
					pass.dispose();
					skyExposureRuntime?.dispose();
					if (sceneInputCapture) {
						this._removeComposerPass(composer, sceneInputCapture);
						sceneInputCapture.dispose();
					}
				},
				/**
				 * Called by install to read diagnostics.
				 * @returns - The callback result returned to its caller.
				 */ getDiagnostics: () => ({
					.../** @type {object} */ (pass.getDiagnostics()),
					skyExposure: skyExposureRuntime?.getDiagnostics() ?? null,
				}),
			};
		} catch (error) {
			if (passInstalled && pass) {
				this._removeComposerPass(composer, pass);
			}

			if (sceneInputCaptureInstalled && sceneInputCapture) {
				this._removeComposerPass(composer, sceneInputCapture);
			}

			pass?.dispose?.();
			skyExposureRuntime?.dispose?.();
			sceneInputCapture?.dispose?.();
			throw error;
		}
	}
}
