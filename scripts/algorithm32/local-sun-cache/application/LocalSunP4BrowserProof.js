import {Flat32Application} from '../../../../src/flat32/Flat32Application.js';
import {Algorithm32Runtime} from '../../../../src/flat32/Algorithm32Runtime.js';
import {FlatLocalMode} from '../../../../src/flat32/FlatLocalMode.js';
import {loadBrightest2000StellarCatalogPackage} from '../../../../src/flat32/Brightest2000StellarCatalogPackageLoader.js';
import {loadHumanVisionFilterPackage} from '../../../../src/flat32/HumanVisionFilterPackageLoader.js';
import {LocalSunP4CelestialProof} from './LocalSunP4CelestialProof.js';

/** Offline proof of the actual ordinary application's explicit compact successor. */
export class LocalSunP4BrowserProof {
	/** Called by browser qualification to wait for an observable terminal state.
	 *
	 * @param {()=>boolean} predicate - Exact required condition.
	 * @param {HTMLElement} root - Actual application shell.
	 * @returns {Promise<void>} - Required state, or actual failure/timeout.
	 */
	async _wait(predicate, root) {
		const deadline = performance.now() + 360000;
		while (!predicate()) {
			const error = root.querySelector('#flat32-error');
			if (error instanceof HTMLElement && !error.hidden && error.textContent) throw new Error(error.textContent);
			if (performance.now() > deadline)
				throw new Error('Ordinary compact application did not reach the declared complete state.');
			await new Promise(
				/** Called by polling to yield until the next observation. */ (resolve) => setTimeout(resolve, 50),
			);
		}
	}
	/** Call this method to qualify ordinary source controls, complete receiver/celestial state and cache sharing.
	 *
	 * @param {SupportedCacheScatteringOrder} order - Qualified physical scattering order.
	 * @returns {Promise<LocalSunP4ApplicationReport>} - Actual ordinary-scene observations; no frame-rate or minimum-memory claim.
	 */
	async run(order) {
		const started = performance.now();
		const controlsResponse = await fetch('/controls.json');
		if (!controlsResponse.ok) throw new Error('Frozen P4 controls unavailable.');
		const fixture =
			/**
			 *
			 * @type {LocalSunP4ControlsFixture}
			 */ (await controlsResponse.json());
		const catalog = await loadBrightest2000StellarCatalogPackage('/catalog/manifest.json');
		const vision = await loadHumanVisionFilterPackage('/vision/manifest.json');
		const root = document.createElement('div');
		root.id = 'p4-application';
		document.body.append(root);
		const style = document.createElement('style');
		style.textContent = '.flat32-viewport{width:128px;height:96px}';
		document.head.append(style);
		const application = new Flat32Application(root, {
			initialModeKind: 'flat-local',
			localSunCachePolicy: 'compact-v9-native15',
			maximumScatteringOrder: order,
			colorDisplayModelConfiguration: {model: 'color-reset-slope-078-p2'},
			stellarCatalog: 'brightest-2000',
			brightest2000StellarCatalogDefinition: catalog,
			scotopicLuminanceWeights: vision.scotopicLuminanceWeights,
			presentationFilters: [
				{
					id: 'human-mesopic-luminance-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumRodContribution: 0.5},
				},
				{
					id: 'human-low-light-chroma-v1',
					stage: 'source-linear',
					target: 'stellar',
					enabled: true,
					parameters: {maximumChromaRetention: 0.65},
				},
			],
		});
		const rows = [];
		try {
			application.start();
			await this._wait(
				/** Called by startup polling to detect the first published frame. */ () =>
					application._publishedState !== null,
				root,
			);
			const scene = application._sceneRuntime;
			if (!scene) throw new Error('Ordinary application renderer missing.');
			const gl = scene.renderer.getContext(),
				debug = gl.getExtension('WEBGL_debug_renderer_info');
			const renderer = String(gl.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
			if (/SwiftShader|llvmpipe|Microsoft Basic Render|software/i.test(renderer))
				throw new Error('Hardware P4 qualification requires a real GPU renderer.');
			let constructionIdentity;
			for (const action of ['initial', 'location', '135', '180']) {
				if (action !== 'initial') {
					const previous = application._publishedState;
					const button =
						action === 'location'
							? root.querySelector('#flat32-location-control')
							: root.querySelector('[data-flat32-time="' + (action === '135' ? 3 : 4) + '"]');
					if (!(button instanceof HTMLButtonElement)) throw new Error('Ordinary source control missing.');
					button.click();
					if (application._publishedState !== previous)
						throw new Error('Pending input relabeled the displayed frame before publication.');
					await this._wait(
						/** Called by control polling to detect complete replacement publication. */ () =>
							application._publishedState !== previous,
						root,
					);
				}
				const runtime =
					/**
					 *
					 * @type {Algorithm32Runtime|null}
					 */ (application._modeController?._activeRuntime);
				const owner = runtime?._localFrameController,
					frame = owner?.active;
				if (!frame || !runtime || !application._publishedState)
					throw new Error('Ordinary local frame not installed.');
				const mode =
					/**
					 *
					 * @type {FlatLocalMode}
					 */ (application._modeController._activeMode);
				const geometry = mode.geometry;
				const source = geometry.mapModelPositionToObserverLocalScenePoint(
					frame.profile.models.lightSource.configuration.position,
					{sceneScale: mode.sceneScale},
				);
				scene.camera.lookAt(source.coordinates[0], source.coordinates[1], source.coordinates[2]);
				scene.camera.updateMatrixWorld(true);
				frame.contents.renderFrame();
				await this._wait(
					/** Called by celestial polling to require complete Sun and stellar resources. */ () => {
						const diagnostics =
							/**
							 *
							 * @type {Flat32ShaderDiagnostics}
							 */ (frame.contents.getDiagnostics?.());
						return (
							diagnostics?.runtime?.stellarGeneration?.publicationState?.active?.completion ===
								'complete' &&
							diagnostics?.runtime?.celestialGeneration?.sun?.publicationState?.active?.completion ===
								'complete'
						);
					},
					root,
				);
				if (constructionIdentity !== undefined && frame.constructionIdentity !== constructionIdentity)
					throw new Error('Admitted observation update rebuilt canonical construction.');
				constructionIdentity = frame.constructionIdentity;
				const diagnostics =
					/**
					 *
					 * @type {Flat32ShaderDiagnostics}
					 */ (frame.contents.getDiagnostics?.());
				const lighting = application._endpointScene.describe();
				const measured = frame.contents.receiverLight;
				if (frame.contents.celestialInputs.receiverLightIdentity !== measured.identity)
					throw new Error('Celestial/receiver identity mismatch.');
				if (gl.getError() !== gl.NO_ERROR) throw new Error('Ordinary application emitted a WebGL error.');
				const control = fixture.rows.find(
					/** Called by control selection to match the predeclared action. */ (row) => row.action === action,
				);
				if (!control) throw new Error('Predeclared source-control case missing.');
				const staging = mode.createLocalFramePreparerConfiguration(
					scene,
					application._endpointScene,
					runtime._lastSummary.sceneDepthMax,
				);
				const roster = staging.createCelestialSources(frame.profile);
				const celestial = new LocalSunP4CelestialProof().verify({
					frame,
					renderer: scene.renderer,
					camera: scene.camera,
					geometry,
					stars: roster.stars,
					control,
					fixture,
					presentation: {
						colorIdentity: staging.createColorModel().id,
						filterRegistryIdentity: staging.presentationFilterRegistry.identity,
						scotopicWeightsIdentity:
							staging.presentationFilterRegistry.createStellarSourceLinearShaderHook()
								.scotopicWeightsIdentity,
						receiverLightIdentity: measured.identity,
						adaptationLuminanceCdM2: measured.stellarAdaptationLuminance.value,
					},
				});
				frame.contents.renderFrame();
				const imageDataUrl = scene.canvas.toDataURL('image/png');
				rows.push({
					action,
					observation: application._publishedState.observation,
					sourcePosition: frame.profile.models.lightSource.configuration.position,
					constructionIdentity: frame.constructionIdentity,
					frameIdentity: frame.identity,
					receiverIdentity: measured.identity,
					directNormal: [...measured.directNormal.values],
					diffuseHorizontal: [...measured.diffuseHorizontal.values],
					adaptation: measured.stellarAdaptationLuminance,
					lighting,
					stellarGenerationCount: diagnostics.runtime.stellarGeneration.generationCount,
					sunGenerationCount: diagnostics.runtime.celestialGeneration.sun.generationCount,
					celestial,
					imageDataUrl,
				});
			}
			const currentRuntime =
				/**
				 *
				 * @type {Algorithm32Runtime}
				 */ (application._modeController._activeRuntime);
			const active = currentRuntime._localFrameController.active;
			const identity = active.constructionIdentity;
			scene.camera.fov = 45;
			scene.camera.updateProjectionMatrix();
			await new Promise(
				/** Called by camera qualification to await two ordinary render frames. */ (resolve) =>
					requestAnimationFrame(
						/** Called by camera qualification to wait for the second frame. */ () =>
							requestAnimationFrame(resolve),
					),
			);
			if (currentRuntime._localFrameController.active.constructionIdentity !== identity)
				throw new Error('Camera-only update rebuilt physical construction.');
			const retained = currentRuntime._localFrameController.active;
			const mode =
				/**
				 *
				 * @type {FlatLocalMode}
				 */ (application._modeController._activeMode);
			const createRequest = mode.createLocalFrameRequest;
			// Inject an explicitly unsupported support ray at the existing request
			// boundary; execute the actual application failure and retry owners.
			mode.createLocalFrameRequest =
				/** Called by failure qualification to inject an unsupported physical support ray.
				 *
				 * @param {GeometryObservation} observation - Exact request instant and geography.
				 * @param {UnitValue<'bytes'>} bytes - Complete logical resource reservation.
				 * @param {Flat32LocalFrameViewRequest} view - Supported current camera cone.
				 * @returns {LocalSunFrameRequest} - Candidate with explicitly unsupported physical support.
				 */ function (observation, bytes, view) {
					const request = createRequest.call(this, observation, bytes, view);
					return {
						...request,
						viewRays: [{origin: {coordinates: [1000000000, 0, 5], units: 'meters'}, direction: [0, 0, 1]}],
					};
				};
			try {
				await application._setupAtmosphere(application._state);
			} finally {
				mode.createLocalFrameRequest = createRequest;
			}
			const error = root.querySelector('#flat32-error');
			if (
				!(error instanceof HTMLElement) ||
				error.hidden ||
				!error.textContent ||
				currentRuntime._localFrameController.active !== retained ||
				scene.canvas.dataset.flat32RenderPath !== 'algorithm32'
			)
				throw new Error(
					'Ordinary unsupported request did not retain the complete displayed frame and report failure.',
				);
			await application._setupAtmosphere(application._state);
			if (
				currentRuntime._localFrameController.active === retained ||
				currentRuntime._localFrameController.active.constructionIdentity !== identity
			)
				throw new Error('Ordinary retry did not publish a complete reused frame.');
			const beforeCancellation = currentRuntime._localFrameController.active;
			const cancellation = new AbortController();
			cancellation.abort();
			let cancelled = false;
			try {
				await currentRuntime.prepareLocalFrame(
					createRequest.call(
						mode,
						application._state.observation,
						currentRuntime._localFrameAdditionalBytes(),
						{
							cameraPosition: {
								coordinates: [
									scene.camera.position.x,
									scene.camera.position.y,
									scene.camera.position.z,
								],
								units: 'scene-units',
							},
							cameraDirection: [0, 0, -1],
							halfAngle: {value: 0.1, units: 'radians'},
						},
					),
					cancellation.signal,
				);
			} catch (reason) {
				cancelled = reason instanceof DOMException && reason.name === 'AbortError';
			}
			if (!cancelled || currentRuntime._localFrameController.active !== beforeCancellation)
				throw new Error('Cancelled candidate replaced the complete displayed frame.');
			const runtime = currentRuntime;
			application.dispose();
			await runtime.whenLocalFrameResourcesReleased();
			return {
				schema: 'local-sun-p4-ordinary-application-v1',
				state: 'passed',
				order,
				renderer,
				rows,
				cameraOnlyReuse: true,
				unsupportedRetained: true,
				retryReused: true,
				cancellationRetained: true,
				cleanupComplete: true,
				elapsedMilliseconds: performance.now() - started,
			};
		} finally {
			application.dispose();
			root.remove();
			style.remove();
		}
	}
}
