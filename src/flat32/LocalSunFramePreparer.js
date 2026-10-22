import * as THREE from 'three';
import {Algorithm32, Algorithm32Bindings} from '../algorithm32/implementation/frame-runtime/index.js';
import {FlatEarthGeometry} from '../algorithm32/implementation/index.js';
import {resolveLocalSunFrameView} from './local-sun-frame-view.js';

/** Renderer-owned isolated shader, receiver measurement and complete-frame preflight for the compact local source. */
export class LocalSunFramePreparer {
	/** External scene/renderer and explicit physical scale/depth choices.
	 *
	 * @type {Flat32LocalFramePreparerConfiguration}
	 */ _configuration;

	/** Called by staging and rendering to refresh only this frame's camera/display bindings.
	 *
	 * @param {Algorithm32BindingValues} bindingValues - Candidate binding aggregate.
	 * @param {Algorithm32} algorithm - Candidate physical facade.
	 * @returns {void} - No value.
	 */
	_updateBindings(bindingValues, algorithm) {
		this._configuration.updatePresentationBindings?.(bindingValues, algorithm);
		Algorithm32Bindings.update({
			bindingValues,
			camera: this._configuration.sceneRuntime.camera,
			props: {config: algorithm.config.config, sceneScale: this._configuration.sceneScale},
		});
	}

	/** Called by preparation to reject failed compilation or an incomplete real composed frame.
	 * Scene/output readback errors, nonfinite pixels, incomplete shader frames or non-runnable
	 * programs throw; discard the candidate and report the failed preflight before retrying.
	 *
	 * @param {ShaderHandle} handle - Independently staged shader.
	 * @param {Flat32AtmosphereComposerResources} resources - Candidate composer/targets.
	 * @returns {Flat32LocalFramePreflight} - Actual staged scene-input and composed pixel observations.
	 */
	_preflight(handle, resources) {
		const renderer = this._configuration.sceneRuntime.renderer;
		const previous = renderer.getRenderTarget();
		resources.composer.renderToScreen = false;
		try {
			const context = renderer.getContext(),
				input = new Float32Array(4);
			renderer.setRenderTarget(resources.renderTarget);
			renderer.render(this._configuration.sceneRuntime.scene, this._configuration.sceneRuntime.camera);
			context.readPixels(0, 0, 1, 1, context.RGBA, context.FLOAT, input);
			if (context.getError() !== context.NO_ERROR || input.some((value) => !Number.isFinite(value)))
				throw new Error('Local frame scene input readback failed.');
			resources.composer.render();
			const diagnostics = /** @type {Flat32LocalFrameShaderDiagnostics} */ (handle.getDiagnostics());
			if ((diagnostics.runtime?.frameCount ?? 0) < 1 || (diagnostics.runtime?.renderErrorCount ?? 0) > 0)
				throw new Error('Local frame preflight did not complete its ordinary shader frame.');
			if (context.getError() !== context.NO_ERROR)
				throw new Error('Local frame preflight reported a WebGL error.');
			if (
				renderer.info.programs.some(
					(program) =>
						/** @type {Flat32LocalFrameProgramDiagnostics} */ (program).diagnostics?.runnable === false,
				)
			)
				throw new Error('Local frame preflight contains a non-runnable shader program.');
			const {width, height} = this._configuration.sceneRuntime.viewportSize;
			const pixels = new Float32Array(width * height * 4);
			// The ordinary composer supports both RGBA16F and RGBA32F targets.
			// Read as FLOAT into Float32Array, matching the established runtime's
			// scene-color readback rather than interpreting half-float bits as floats.
			renderer.setRenderTarget(resources.composer.readBuffer);
			context.readPixels(0, 0, width, height, context.RGBA, context.FLOAT, pixels);
			if (context.getError() !== context.NO_ERROR)
				throw new Error('Local frame preflight output readback failed.');
			if (pixels.some((value) => !Number.isFinite(value)))
				throw new Error('Local frame preflight contains nonfinite composed output.');
			return {
				outputPixel: [pixels[0], pixels[1], pixels[2], pixels[3]],
				sceneInputPixel: [input[0], input[1], input[2], input[3]],
			};
		} finally {
			renderer.setRenderTarget(previous);
		}
	}

	/** Called by candidate teardown to attempt every owned disposal even when one resource owner fails.
	 * AggregateError reports failed algorithm, composer or target disposal after every release
	 * was attempted; report all causes and do not reuse the retired candidate.
	 *
	 * @param {Algorithm32} algorithm - Candidate facade owning its shader/receiver resources.
	 * @param {Flat32AtmosphereComposerResources} resources - Candidate composer/targets.
	 * @returns {void} - No value.
	 */
	_disposeCandidate(algorithm, resources) {
		const errors = [];
		try {
			algorithm.dispose();
		} catch (error) {
			errors.push(error);
		}
		try {
			resources.composer.dispose();
		} catch (error) {
			errors.push(error);
		}
		try {
			resources.renderTarget.dispose();
		} catch (error) {
			errors.push(error);
		}
		if (errors.length) throw new AggregateError(errors, 'Local frame candidate cleanup failed.');
	}

	/** Creates a staging owner that borrows the application scene/renderer without publishing anything.
	 *
	 * @param {Flat32LocalFramePreparerConfiguration} configuration - Complete scene, scale and depth capability.
	 */
	constructor(configuration) {
		this._configuration = configuration;
	}

	/** Called by staging, publication and rendering to admit the complete current camera cone.
	 *
	 * @param {LocalSunCompactConstructionProfile} profile - Exact live physical geometry and coverage.
	 * @returns {void} - Supported view, otherwise explicit rejection before rendering.
	 */
	_validateCurrentView(profile) {
		const view = resolveLocalSunFrameView(this._configuration.sceneRuntime.camera);
		const geometry = /** @type {FlatEarthGeometry} */ (profile.models.geometry);
		geometry.resolveCompactViewSupport({
			origin: geometry.mapObserverLocalScenePointToModelPosition(view.cameraPosition, {
				sceneScale: this._configuration.sceneScale,
			}),
			forward: geometry.mapObserverLocalSceneDirectionToModelDirection(view.cameraDirection),
			halfAngle: view.halfAngle,
			coverageRadius: profile.domains.topology.coverageRadius,
		});
	}

	/** Call this method to prepare a complete ordinary shader and measured exact-state receiver/celestial aggregate.
	 * Caller cancellation rejects with the signal's reason; discard this incomplete candidate.
	 * Invalid profile, celestial or color configuration rejects before staging; correct those inputs.
	 * Renderer allocation, shader setup, receiver measurement or preflight failure rejects;
	 * retain the published frame and report the failed device/setup operation before retrying.
	 * Unsupported camera coverage rejects; move the camera into accepted support before retrying.
	 * Staging failure attempts candidate and borrowed-cache cleanup; AggregateError includes any
	 * cleanup failures alongside the original cause. Report every cause and never publish partial contents.
	 *
	 * @param {LocalSunFrameStageRequest} request - Exact live profile and canonical cache lease.
	 * @returns {Promise<LocalSunPreparedFrameContents>} - Complete isolated frame, ready for atomic publication.
	 */
	async prepare(request) {
		request.signal.throwIfAborted();
		const {sceneRuntime, sceneScale, sceneDepthMax} = this._configuration;
		// Display targets are owned by the renderer and scale with its viewport.
		// Their size is independent of the selected physical cache payload.
		const algorithm = new Algorithm32({
			profile: request.profile.createExecutionProfile(
				this._configuration.createCelestialSources?.(request.profile) ?? null,
			),
			color: this._configuration.createColorModel(),
			presentationFilterRegistry: this._configuration.presentationFilterRegistry,
		});
		let resources;
		try {
			resources = sceneRuntime.createAtmosphereComposer();
			const bindingValues = Algorithm32Bindings.create(THREE, sceneDepthMax);
			this._updateBindings(bindingValues, algorithm);
			const handle = await algorithm.setupShader({
				THREE,
				composer: resources.composer,
				scene: sceneRuntime.scene,
				camera: sceneRuntime.camera,
				viewportSize: sceneRuntime.viewportSize,
				sceneScale,
				sceneDepthMax,
				bindingValues,
				cacheBackend: request.backend,
				preparedScatteringCacheController: request.cacheController,
				performanceCallback: this._configuration.performanceCallback,
				performanceSampleIntervalFrames: 1,
				performanceMaxPendingQueries: 4,
				signal: request.signal,
			});
			await handle.prepare(sceneRuntime.renderer);
			request.signal.throwIfAborted();
			const receiverLight = await handle.prepareReceiverEnvironmentLight({
				THREE,
				renderer: sceneRuntime.renderer,
				backend: request.backend,
				geometry: request.profile.models.geometry,
				lightSource: request.profile.models.lightSource,
				observation: request.profile.models.geometry.configuration.observation,
				scatteringCache: request.cacheController.active,
				identity: request.identity,
				signal: request.signal,
			});
			handle.publishReceiverEnvironmentLight(
				receiverLight,
				request.profile.models.geometry.configuration.observation,
			);
			const sceneLighting = this._configuration.endpointScene?.prepareLocalSunLighting?.(
				/** @type {FlatEarthGeometry} */ (
					request.profile.models.geometry
				).mapModelPositionToObserverLocalScenePoint(request.profile.models.lightSource.configuration.position, {
					sceneScale,
				}),
				receiverLight,
				algorithm.config.config.color,
			);
			this._validateCurrentView(request.profile);
			const preflight = this._preflight(handle, resources);
			request.signal.throwIfAborted();
			let disposed = false;
			return {
				shaderReady: true,
				/** Report this packet's shader and resource observations.
				 *
				 * @returns {Flat32LocalFrameShaderDiagnostics} - Current renderer-owned diagnostics.
				 */
				getDiagnostics: () => handle.getDiagnostics(),
				/** Reject an unsupported current camera cone before publication or rendering; correct the view before retrying.
				 *
				 * @returns {void} - Current view is supported.
				 */
				validateView: () => this._validateCurrentView(request.profile),
				preflight,
				...(sceneLighting ? {sceneLighting} : {}),
				receiverLight,
				celestialInputs: {
					observation: request.profile.models.geometry.configuration.observation,
					sourcePosition: request.profile.models.lightSource.configuration.position,
					receiverPosition: request.profile.models.geometry.configuration.observerPosition,
					sourceRadius: request.profile.models.lightSource.configuration.radius,
					stellarAdaptationLuminance: receiverLight.stellarAdaptationLuminance,
					receiverLightIdentity: receiverLight.identity,
				},
				bindingValues,
				/** Render one live supported packet. Retired packets, unsupported views or renderer failures throw;
				 * the caller stops this operation and reports failure before preparing a valid replacement.
				 *
				 * @returns {void} - One complete frame is rendered.
				 */
				renderFrame: () => {
					if (disposed) throw new Error('Retired local frame cannot render.');
					this._validateCurrentView(request.profile);
					this._updateBindings(bindingValues, algorithm);
					resources.composer.renderToScreen = true;
					resources.composer.render();
				},
				/** Retire the packet and attempt every owned release once. Report aggregate cleanup failures;
				 * a retired packet must not be rendered or reused after teardown.
				 *
				 * @returns {void} - Packet resources have been released or their failures reported.
				 */
				dispose: () => {
					if (disposed) return;
					disposed = true;
					this._disposeCandidate(algorithm, resources);
				},
			};
		} catch (error) {
			const errors = [error];
			try {
				if (resources) this._disposeCandidate(algorithm, resources);
				else algorithm.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			try {
				request.cacheController.dispose();
			} catch (cleanupError) {
				errors.push(cleanupError);
			}
			if (errors.length > 1) throw new AggregateError(errors, 'Local frame preparation and cleanup failed.');
			throw error;
		}
	}
}
