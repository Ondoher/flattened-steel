import Random from '../../../scripts/experiments/Random.js';
import {
	BoundedChunkSink,
	DeterministicCanvasRecorder,
	MediabunnyCanvasOutput,
	WebCodecsEncoderSelector,
} from '../../../scripts/animation-evidence/index.js';
import {StrobingSolarState} from './StrobingSolarState.js';
import {StrobingFrameMeasurement} from './StrobingFrameMeasurement.js';
import {ObservatoryCamera} from '../../distant-sun-shadow-animation-evidence/creative/ObservatoryCamera.js';
import {ObservatoryScene} from '../../distant-sun-shadow-animation-evidence/creative/ObservatoryScene.js';
import {DesertSceneLighting} from '../../distant-sun-shadow-animation-evidence/creative/DesertSceneLighting.js';

/**
 * Call this function to encode a bounded byte batch for the browser/Node bridge.
 *
 * @param {Uint8Array} bytes - Bounded payload bytes.
 * @returns {string} - Base64-encoded payload.
 */
function encodeBytes(bytes) {
	let binary = '';
	for (let offset = 0; offset < bytes.length; offset += 0x8000)
		binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
	return btoa(binary);
}

/**
 * Call this function to retain one exact presentation frame as a PNG artifact.
 *
 * @param {OffscreenCanvas} canvas - Retained full-resolution presentation canvas.
 * @param {string} name - Safe artifact basename without extension.
 * @returns {Promise<unknown>} - Node artifact receipt.
 */
async function capture(canvas, name) {
	const blob = await canvas.convertToBlob({type: 'image/png'});
	return window.__creativeCapture(
		name,
		`data:image/png;base64,${encodeBytes(new Uint8Array(await blob.arrayBuffer()))}`,
	);
}

/**
 * Call this function to draw restrained opening/closing typography over the
 * physically rendered image, without changing its color or lighting.
 *
 * @param {OffscreenCanvasRenderingContext2D} context - Presentation drawing context.
 * @param {number} seconds - Film position in seconds.
 * @param {number} width - Native canvas width in pixels.
 * @param {number} height - Native canvas height in pixels.
 * @returns {void}
 */
function drawTitles(context, seconds, width, height) {
	const opening = Math.min(1, seconds / 0.8, (5 - seconds) / 1.2);
	const closing = Math.min(1, (seconds - 56) / 1.6, (60 - seconds) / 0.8);
	const opacity = Math.max(0, opening, closing);
	if (opacity === 0) return;
	const scale = width / 3840;
	context.save();
	context.globalAlpha = opacity * 0.9;
	context.fillStyle = '#e5dfcf';
	context.textAlign = 'left';
	context.font = `${46 * scale}px Georgia, serif`;
	context.fillText(opening > 0 ? 'THE HOURS' : 'THE HOURS / ALGORITHM32', width * 0.055, height * 0.9);
	context.globalAlpha = opacity * 0.65;
	context.font = `${22 * scale}px Arial, sans-serif`;
	context.fillText(opening > 0 ? 'An observatory of light' : 'One day. One sky.', width * 0.055, height * 0.925);
	context.restore();
}

/**
 * Call this function to install the creative scene behind the existing
 * atmosphere runtime's scene/lighting contract. The original scene is disposed;
 * neither its source nor any production source is modified.
 *
 * @param {CreativeApplication} application - Contained exposed application instance.
 * @param {ObservatoryScene} observatory - Creative opaque scene owner.
 * @param {DesertSceneLighting} lighting - Independently cloned lighting owner.
 * @returns {void}
 */
function connectScene(application, observatory, lighting) {
	/** @type {CreativeEndpointScene} */
	const endpoint = {
		install: () => endpoint.describe(),
		applyMode: () => undefined,
		describe: () => ({...observatory.describe(), ...lighting.describe()}),
		updateDistantSunLighting: (direction, receiver, color) =>
			lighting.updateFromDistantSun(
				direction,
				receiver,
				/** @type {Color & ObservatoryColorProjection} */ (color),
			),
		getSceneDepthEndpointPositions: () => observatory.getSceneDepthEndpointPositions(),
		dispose: () => {
			lighting.dispose();
			observatory.dispose();
		},
	};
	application._endpointScene.dispose();
	application._endpointScene = endpoint;
	application._modeController._endpointScene = endpoint;
	if (application._modeController._activeRuntime)
		application._modeController._activeRuntime._endpointScene = endpoint;
	application._sceneSummary = endpoint.describe();
}

/**
 * Call this function to create preview stills or the complete ideal-cadence
 * film through the reusable animation-evidence recorder. GPU rendering remains
 * Algorithm32; encoding wall time is not presented as animation performance.
 *
 * @param {StrobingRenderConfiguration} configuration - Validated launcher options.
 * @returns {Promise<CreativeRenderResult>} - Scene, camera, encoder, and media evidence.
 */
export async function renderCreativeAnimation(configuration) {
	if (!['preview', 'video'].includes(configuration.mode)) throw new TypeError('Unsupported creative render mode.');
	const application = window.__creativeApplication;
	if (!application?._modeController?._activeRuntime) throw new Error('Creative application is not ready.');
	const three = window.__creativeThree ?? (await import(configuration.threeModuleUrl));
	const runtime = application._sceneRuntime;
	application._cancelLocationTimeRefresh();
	if (runtime._frameRequest !== null) cancelAnimationFrame(runtime._frameRequest);
	runtime._frameRequest = null;
	runtime._started = false;
	// Offline capture owns every render. Complete prepared publications synchronously
	// between frames; JavaScript cannot interleave one with the synchronous render.
	/** @type {StrobingSceneRuntime} */ (runtime).atFrameBoundary = async (operation, signal) => {
		signal.throwIfAborted();
		operation();
	};
	const presentation = new OffscreenCanvas(configuration.width, configuration.height);
	const sourceMeasurement = new StrobingFrameMeasurement();
	const context = presentation.getContext('2d', {alpha: false});
	if (!context) throw new Error('Presentation canvas is unavailable.');
	const solar = new StrobingSolarState(application, configuration);
	await solar.initialize({
		durationSeconds: 60,
		prepareLighting: false,
		onProgress: window.__creativeProgress,
	});
	const solarDescription = solar.describe();
	const observatory = new ObservatoryScene({
		three,
		scene: runtime.scene,
		geometry: application._modeController._activeMode.geometry,
		random: Random,
		seed: configuration.seed,
		sunriseDirectionScene: solarDescription.sunriseDirectionScene,
		sunsetDirectionScene: solarDescription.sunsetDirectionScene,
	});
	const lighting = new DesertSceneLighting({
		three,
		parent: runtime.scene,
		shadowExtentMeters: 450,
		shadowFocusMeters: [0, 12, 0],
		neutralLambertianClass: window.__creativeNeutralLambertianSceneLighting,
		neutralReflectance: window.__creativeNeutralReflectance,
	});
	connectScene(application, observatory, lighting);
	const director = new ObservatoryCamera({camera: runtime.camera, durationSeconds: 60});
	/** @type {CreativeFrameTrace[]} */
	const trace = [];
	/** @type {unknown[]} */
	const snapshots = [];
	const frameCount = Math.round(configuration.durationSeconds * configuration.framesPerSecond);
	const gl = runtime.canvas.getContext('webgl2');
	if (!gl) throw new Error('WebGL2 is unavailable.');
	if (gl.drawingBufferWidth !== configuration.width || gl.drawingBufferHeight !== configuration.height)
		throw new Error('Native drawing buffer does not match requested output.');

	/**
	 * Called by preview or recording to render one exact film state.
	 *
	 * @param {number} seconds - Animation position in seconds.
	 * @returns {Promise<CreativeFrameTrace>} - Recoverable solar/camera/light state.
	 */
	const renderFrame = async (seconds) => {
		const state = await solar.apply(seconds);
		let camera = director.apply(state);
		if (!configuration.fullFilm) {
			camera = configuration.fixedCamera;
			runtime.camera.position.set(
				.../** @type {[number, number, number]} */ (camera.positionMeters.map((value) => value / 1000)),
			);
			runtime.camera.up.set(0, 1, 0);
			runtime.camera.fov = camera.fieldOfViewDegrees;
			const target = camera.positionMeters.map((value, index) => value / 1000 + camera.viewDirection[index]);
			runtime.camera.lookAt(.../** @type {[number, number, number]} */ (target));
			runtime.camera.updateProjectionMatrix();
			runtime.camera.updateMatrixWorld(true);
		}
		observatory.update(seconds, Math.max(0, Math.cos((state.solarZenithDegrees * Math.PI) / 180)));
		lighting.updateFromDistantSun(
			state.directionToSunModel,
			state.receiverLight,
			/** @type {Color & ObservatoryColorProjection} */ (state.colorDisplayModel),
		);
		const active = application._modeController._activeRuntime;
		active._shaderHandle._buildResult.celestialGenerationParticipant?.markDirty('view');
		runtime.refreshShadowMaps();
		runtime._renderOperation();
		const diagnostics = active._shaderHandle.getDiagnostics();
		const celestial = active._shaderHandle._buildResult.celestialGenerationParticipant?.getDiagnostics();
		if (!active._installed || (diagnostics.runtime?.renderErrorCount ?? 0) !== 0)
			throw new Error(diagnostics.runtime?.lastRenderError ?? 'Algorithm32 atmosphere fell back during capture.');
		if (
			!celestial?.publicationState.active ||
			(celestial.sun.failedGenerationCount ?? 0) !== 0 ||
			(celestial.stellar?.failedGenerationCount ?? 0) !== 0
		)
			throw new Error(
				celestial?.sun.lastError ?? celestial?.stellar?.lastError ?? 'Celestial publication is incomplete.',
			);
		if (gl.isContextLost()) throw new Error('WebGL context lost while rendering.');
		context.drawImage(runtime.canvas, 0, 0, configuration.width, configuration.height);
		if (configuration.fullFilm) drawTitles(context, seconds, configuration.width, configuration.height);
		const entry = {
			color: {
				response: configuration.colorResponse,
				model: state.colorDisplayModel.id,
				illuminanceLux: state.receiverLight.photopicTotalHorizontalIlluminance.value,
				adaptationLuminance: state.receiverLight.totalHorizontalLuminanceProxy,
				gain: /** @type {Color & StrobingColorDiagnostics} */ (state.colorDisplayModel).displayGain(
					state.receiverLight.photopicTotalHorizontalIlluminance,
				),
				gainLogElasticity: /** @type {Color & StrobingColorDiagnostics} */ (
					state.colorDisplayModel
				).displayGainLogElasticity(state.receiverLight.photopicTotalHorizontalIlluminance),
			},
			sourceRegions: sourceMeasurement.measure(presentation),
			animationSeconds: seconds,
			instant: state.instant,
			solarZenithDegrees: state.solarZenithDegrees,
			directionToSunModel: state.directionToSunModel,
			camera,
			cacheIdentity: state.cacheIdentity,
			sharedCache:
				/** @type {StrobingActiveMode} */ (
					application._modeController._activeMode
				).lightSource.sharedCacheAttachment?.diagnostics() ?? null,
			sharedScene: runtime.canvas.dataset.flat32SharedSceneOrdinal ?? null,
			sharedGeneration: runtime.canvas.dataset.flat32SharedGeneration ?? null,
			modeChanged: state.modeChanged,
			receiverLightIdentity: state.receiverLight.identity,
			lighting: lighting.describe(),
		};
		trace.push(entry);
		return entry;
	};

	/** @type {AnimationEvidenceRecorderResult | null} */
	let recording = null;
	/** @type {CreativeEncoderSelection | null} */
	let encoderSelection = null;
	if (configuration.mode === 'preview') {
		if (configuration.ablation) {
			const attachment = /** @type {StrobingActiveMode} */ (application._modeController._activeMode).lightSource
				.sharedCacheAttachment;
			attachment.setRoute([82, 83]);
			await renderFrame(16.3);
			await capture(presentation, 'ablation-scene-82');
			const view = attachment.active;
			const originalPublication = view.getRuntimePublication.bind(view);
			view.getRuntimePublication = () => {
				const publication = originalPublication();
				return {...publication, values: {...publication.values, 'cache.sharedSceneOrdinal': 83}};
			};
			try {
				await renderFrame(16.3);
				await capture(presentation, 'ablation-scene-83');
			} finally {
				view.getRuntimePublication = originalPublication;
			}
			await renderFrame(16.3);
			await capture(presentation, 'ablation-scene-82-repeat');
		} else {
			const previewSeconds = [0, 7, 12, 18, 18 + 1 / 30, 30, 42, 48, 48 + 1 / 30, 53, 59.9];
			for (const seconds of previewSeconds) {
				await window.__creativeProgress({
					phase: 'preview',
					message: `Rendering ${seconds}s preview.`,
					completed: snapshots.length,
					total: previewSeconds.length,
				});
				await renderFrame(seconds);
				snapshots.push(
					await capture(presentation, `the-hours-${String(Math.round(seconds * 1000)).padStart(5, '0')}`),
				);
			}
		}
	} else {
		await solar.initialize({
			durationSeconds: 60,
			prepareLighting: true,
			onProgress: window.__creativeProgress,
		});
		const mediabunny = await import(configuration.mediabunnyModuleUrl);
		/** @type {Omit<VideoEncoderConfig, 'codec'>} */
		const encoderConfig = {
			width: configuration.width,
			height: configuration.height,
			framerate: configuration.framesPerSecond,
			bitrate: 40_000_000,
			bitrateMode: 'variable',
			latencyMode: 'quality',
			avc: {format: 'avc'},
		};
		encoderSelection = await WebCodecsEncoderSelector.select([
			{
				id: 'avc-high-5.2-hardware',
				config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'prefer-hardware'},
			},
			{
				id: 'avc-high-5.2-auto',
				config: {...encoderConfig, codec: 'avc1.640034', hardwareAcceleration: 'no-preference'},
			},
		]);
		let byteOffset = 0;
		const chunks = new BoundedChunkSink({
			maximumBatchBytes: 4 * 1024 * 1024,
			publishBatch: async (bytes, index) => {
				await window.__creativeWriteVideoChunk(index, byteOffset, encodeBytes(bytes));
				byteOffset += bytes.byteLength;
			},
			finalize: async () => {
				await window.__creativeFinalizeVideo({
					byteLength: byteOffset,
					frameCount,
					durationSeconds: configuration.durationSeconds,
					title: 'The Hours',
					cadence: 'ideal-choreography',
				});
			},
		});
		const output = new MediabunnyCanvasOutput({
			mediabunny,
			canvas: presentation,
			writable: chunks.writable(),
			framesPerSecond: configuration.framesPerSecond,
			codec: 'avc',
			fullCodecString: 'avc1.640034',
			hardwareAcceleration: /** @type {HardwareAcceleration} */ (
				encoderSelection.selectedConfig.hardwareAcceleration
			),
			bitrate: encoderConfig.bitrate,
			metadata: {
				title: 'The Hours — An Observatory of Light',
				comment:
					'Algorithm32 sky and spectral illumination. Ideal offline choreography, not a runtime performance measurement.',
			},
		});
		const mapping = Array.from({length: frameCount}, (_, slotIndex) => ({
			slotIndex,
			mappingKind: 'ideal-choreography',
			timestampMicroseconds: Math.round((slotIndex * 1_000_000) / configuration.framesPerSecond),
			mappingEquationId: 'the-hours-ideal-cadence-v1',
			sourceFrameId: slotIndex,
			sourceAnimationCallbackMicroseconds: Math.round((slotIndex * 1_000_000) / configuration.framesPerSecond),
			heldFromPreviousSlot: false,
			measuredFrameAdvance: slotIndex === 0 ? 0 : 1,
			state: {animationSeconds: configuration.startSeconds + slotIndex / configuration.framesPerSecond},
		}));
		recording = await new DeterministicCanvasRecorder({
			mapping,
			framesPerSecond: configuration.framesPerSecond,
			presentationCanvas: presentation,
			videoOutput: output,
			render: async (entry) => {
				await renderFrame(/** @type {CreativeReplayState} */ (entry.state).animationSeconds);
			},
			captureSlots: new Set(
				configuration.fullFilm
					? [0, 7, 12, 18, 30, 42, 48, 53, 59].map((seconds) => seconds * configuration.framesPerSecond)
					: mapping.map((entry) => entry.slotIndex),
			),
			capture: async (entry) =>
				capture(presentation, `the-hours-frame-${String(entry.slotIndex).padStart(4, '0')}`),
			reportProgress: async (completed, total) =>
				window.__creativeProgress({
					phase: 'encode',
					message: `Rendered ${completed} of ${total} ideal frames.`,
					completed,
					total,
				}),
		}).record();
	}
	await window.__creativeWriteTrace({
		schemaId: 'the-hours-scene-trace-v1',
		approach: 'ideal-choreography',
		framesPerSecond: configuration.framesPerSecond,
		durationSeconds: configuration.durationSeconds,
		seed: configuration.seed,
		solar: solar.describe(),
		scene: observatory.describe(),
		frames: trace,
	});
	return {
		title: 'The Hours',
		approach: 'ideal-choreography',
		configuration,
		scene: observatory.describe(),
		solar: solar.describe(),
		snapshots,
		encoderSelection,
		recording,
		webglError: gl.getError(),
		contextLost: gl.isContextLost(),
	};
}
