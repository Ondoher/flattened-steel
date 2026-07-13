import * as THREE from '../../../node_modules/three/build/three.module.js';

import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {ShaderContributions} from '../../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../../src/algorithm32/shader-assembly/base/ShaderSource.js';
import {ProductionProgressCacheBackend} from '../b1-directional-sky-radiance/ProductionProgressCacheBackend.js';
import {createRetainedFrameProfile, createRetainedFrameViewDirection} from './retained-frame-profile.js';

const GRID_WIDTH = 9;
const CHANNELS_PER_READ = 4;
let session = null;

/**
 * Called by the GPU benchmark lane to create a shader-only spectral readout owner.
 * The contribution overrides the camera ray with the benchmark's exact 81 directions
 * after production geometry reconstruction, then exposes four post-transport spectral
 * channels without applying display conversion.
 *
 * @returns {{createShaderContribution(request: ShaderContributionRequest): ShaderContribution}} - The benchmark readout owner.
 */
function createSpectralReadoutOwner() {
	const viewDirections = [];
	for (let gridY = 0; gridY < GRID_WIDTH; gridY += 1) {
		for (let gridX = 0; gridX < GRID_WIDTH; gridX += 1) {
			viewDirections.push(createRetainedFrameViewDirection(gridX, gridY));
		}
	}

	return {
		/**
		 * Call this method to contribute benchmark ray injection and native spectral readout.
		 *
		 * @param {ShaderContributionRequest} _request - The retained aggregate execution model.
		 * @returns {ShaderContribution} - The diagnostic terminal contribution.
		 */
		createShaderContribution(_request) {
			return ShaderContributions.createShaderContribution({
				id: 'color-b1-native-spectral-readout',
				owner: 'color',
				provides: ['color.composeSceneColor', 'color.encodeOutput'],
				requires: ['runtime.initialState', 'geometry.reconstructViewRay', 'transport.evaluatePathRadiance'],
				uniforms: [
					ShaderContributions.createShaderUniformDeclaration(
						'uB1SpectralChannelBase',
						'int',
						'b1.spectralChannelBase',
					),
				],
				functions: [
					ShaderContributions.createShaderSourceBlock(
						'b1-view-directions',
						'declareConstants',
						100,
						`const vec3 B1_VIEW_DIRECTIONS[81] = vec3[81](${viewDirections
							.map((direction) => ShaderSource.formatVec3(direction))
							.join(', ')});`,
					),
				],
				mainHooks: [
					ShaderContributions.createShaderSourceBlock(
						'b1-main-view-ray',
						'reconstructRay',
						100,
						`ivec2 b1Pixel = clamp(ivec2(gl_FragCoord.xy), ivec2(0), ivec2(8));
int b1DirectionIndex = b1Pixel.y * 9 + b1Pixel.x;
state.ray.direction = B1_VIEW_DIRECTIONS[b1DirectionIndex];`,
					),
					ShaderContributions.createShaderSourceBlock(
						'b1-main-compose',
						'composeSceneColor',
						0,
						`state.outputRgba = vec4(
	state.pathRadiance.channels[uB1SpectralChannelBase],
	state.pathRadiance.channels[uB1SpectralChannelBase + 1],
	state.pathRadiance.channels[uB1SpectralChannelBase + 2],
	state.pathRadiance.channels[uB1SpectralChannelBase + 3]
);`,
					),
					ShaderContributions.createShaderSourceBlock(
						'b1-main-output',
						'encodeOutput',
						0,
						'outColor = state.outputRgba;',
					),
				],
				bindingRequirements: [
					ShaderContributions.createShaderBindingRequirement(
						'b1.spectral-channel-base',
						'color',
						'uniform',
						'frame',
						'b1.spectralChannelBase',
						true,
					),
				],
				diagnostics: {
					mode: 'b1-native-spectral-readout',
					spectralChannelsPerRead: CHANNELS_PER_READ,
				},
			});
		},
	};
}

/**
 * Called by the browser harness to create one WebGL2 renderer with the required float target support.
 *
 * @returns {{renderer: THREE.WebGLRenderer, context: WebGL2RenderingContext, canvas: HTMLCanvasElement}} - The GPU resources.
 */
function createRenderer() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
	});
	if (!context) throw new Error('B1 GPU generation requires WebGL2.');
	if (!context.getExtension('EXT_color_buffer_float')) {
		throw new Error('B1 GPU generation requires EXT_color_buffer_float.');
	}
	if (context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS) < 40) {
		throw new Error('B1 GPU generation requires at least 40 array-texture layers.');
	}
	if (context.getShaderPrecisionFormat(context.FRAGMENT_SHADER, context.HIGH_FLOAT).precision <= 0) {
		throw new Error('B1 GPU generation requires highp fragment precision.');
	}

	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.debug.checkShaderErrors = true;
	renderer.setPixelRatio(1);
	renderer.setSize(GRID_WIDTH, GRID_WIDTH, false);
	return {renderer, context, canvas};
}

/**
 * Called by the browser harness to create a nearest-filtered zero-valued runtime texture.
 *
 * @returns {THREE.DataTexture} - The initialized texture.
 */
function createZeroTexture() {
	const texture = new THREE.DataTexture(
		new Uint8Array(GRID_WIDTH * GRID_WIDTH * 4),
		GRID_WIDTH,
		GRID_WIDTH,
		THREE.RGBAFormat,
		THREE.UnsignedByteType,
	);
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.colorSpace = THREE.NoColorSpace;
	texture.needsUpdate = true;
	return texture;
}

/**
 * Called by the browser harness to create its minimal composer surface.
 *
 * @returns {ShaderRuntimeComposer} - The mutable pass collection.
 */
function createComposer() {
	return {
		passes: [],
		/** @param {unknown} pass - The installed pass. */
		addPass(pass) {
			this.passes.push(pass);
		},
		/** @param {unknown} pass - The removed pass. */
		removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index !== -1) this.passes.splice(index, 1);
		},
	};
}

/** Initialize the one WebGL context shared by every B1 condition in a run. */
export function initializeGpuSession() {
	if (session) return;
	const rendererResources = createRenderer();
	const zeroTextures = [createZeroTexture(), createZeroTexture(), createZeroTexture()];
	const output = new THREE.WebGLRenderTarget(GRID_WIDTH, GRID_WIDTH, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		internalFormat: 'RGBA32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	output.texture.colorSpace = THREE.NoColorSpace;
	const productionBackend = new ThreeCacheBackend({THREE, renderer: rendererResources.renderer});
	session = {
		...rendererResources,
		backend: new ProductionProgressCacheBackend({
			backend: productionBackend,
			report(message) {
				console.log(`[B1 GPU progress] ${message}`);
			},
		}),
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(90, 1, 0.1, 10),
		zeroTextures,
		output,
		warmAlgorithm: null,
		warmHandle: null,
		warmFragmentShaderSource: null,
		bindingValues: {
			'b1.spectralChannelBase': 0,
			'geometry.inverseProjectionMatrix': new THREE.Matrix4(),
			'geometry.inverseViewMatrix': new THREE.Matrix4(),
			'runtime.sceneColorTexture': zeroTextures[0],
			'runtime.sceneDepthTexture': zeroTextures[1],
			'runtime.sceneHitTexture': zeroTextures[2],
			'runtime.viewportSize': {width: GRID_WIDTH, height: GRID_WIDTH, units: 'pixels'},
		},
	};
}

/** Dispose the shared B1 WebGL session after every requested condition completes. */
export function disposeGpuSession() {
	if (!session) return;
	const current = session;
	session = null;
	current.warmHandle?.dispose();
	current.warmAlgorithm?.dispose();
	current.output.dispose();
	for (const texture of current.zeroTextures) texture.dispose();
	current.backend.dispose();
	current.renderer.setRenderTarget(null);
	current.renderer.dispose();
	current.renderer.forceContextLoss();
	current.canvas.remove();
}

/**
 * Call this function to generate one B1 condition through production GPU cache and final-view shaders.
 *
 * @param {{time: string, fittedAzimuthDegrees: number, maximumScatteringOrder: number, incomingDirectionVariant?: string, measureGpuCompletion?: boolean}} request - The condition request.
 * @returns {Promise<{values: number[][], capabilities: object, shaderDiagnostics: unknown}>} - The 81 direct-40 radiance spectra and GPU identity.
 */
export async function generateGpuCondition(request) {
	if (!session) throw new Error('B1 GPU session must be initialized before generation.');
	const {renderer, context, backend, scene, camera, zeroTextures, output, bindingValues} = session;
	const logger = {
		/** @param {string} message - The runtime message. @param {unknown} error - The failure. */
		warn(message, error) {
			throw error instanceof Error ? error : new Error(`${message}: ${String(error)}`);
		},
	};
	if (request.incomingDirectionVariant?.startsWith('bruneton-angular-') && session.warmHandle === null) {
		const warmProfile = createRetainedFrameProfile({
			...request,
			incomingDirectionVariant: 'production-34',
		});
		const warmComposer = createComposer();
		session.warmAlgorithm = new Algorithm32({profile: warmProfile, color: createSpectralReadoutOwner()});
		console.log(`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} final shader warmup started`);
		session.warmHandle = await session.warmAlgorithm.setupShader({
			THREE,
			composer: warmComposer,
			scene,
			camera,
			viewportSize: {width: GRID_WIDTH, height: GRID_WIDTH, units: 'pixels'},
			cacheBackend: backend,
			bindingValues,
			logger,
		});
		session.warmFragmentShaderSource = warmComposer.passes.at(-1)?.material.fragmentShader ?? null;
		await session.warmHandle.prepare(renderer);
		if (context.isContextLost()) throw new Error('B1 GPU context was lost during final shader warmup.');
		const warmBuildResult = session.warmHandle._buildResult;
		if (!warmBuildResult?.cacheController) {
			throw new Error('B1 GPU final shader warmup did not retain a disposable cache controller.');
		}
		warmBuildResult.cacheController.dispose();
		warmBuildResult.cacheController = null;
		console.log(
			`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} final shader warmup complete; warmup cache released`,
		);
	}
	const profile = createRetainedFrameProfile(request);
	const algorithm = new Algorithm32({profile, color: createSpectralReadoutOwner()});
	const composer = createComposer();
	let handle;

	try {
		console.log(`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} setup started`);
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width: GRID_WIDTH, height: GRID_WIDTH, units: 'pixels'},
			cacheBackend: backend,
			bindingValues,
			logger,
		});
		console.log(`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} cache complete`);
		if (context.isContextLost()) throw new Error('B1 GPU context was lost during cache construction.');
		if (request.incomingDirectionVariant?.startsWith('bruneton-angular-')) {
			const residentProbe = await backend.readResidentProbe();
			console.log(
				`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} resident cache probe ${residentProbe.samples
					.map((sample) => sample.value)
					.join(', ')}`,
			);
		}
		const runtimePass = composer.passes.at(-1);
		if (!runtimePass || typeof runtimePass.render !== 'function') {
			throw new Error('B1 GPU generation did not install a runtime shader pass.');
		}
		const fragmentShaderSource = runtimePass.material.fragmentShader;
		if (session.warmFragmentShaderSource !== null && fragmentShaderSource !== session.warmFragmentShaderSource) {
			throw new Error('B1 GPU final shader warmup source differed from the Bruneton-512 runtime shader.');
		}
		const shaderSourceMetrics = {
			characterCount: fragmentShaderSource.length,
			utf8ByteCount: new TextEncoder().encode(fragmentShaderSource).byteLength,
			lineCount: fragmentShaderSource.split('\n').length,
		};
		console.log(
			`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} assembled final shader ${shaderSourceMetrics.characterCount} characters, ${shaderSourceMetrics.lineCount} lines`,
		);

		let cacheGpuDrainDurationMilliseconds = null;
		if (request.measureGpuCompletion) {
			const cacheGpuDrainStartedAt = performance.now();
			context.finish();
			cacheGpuDrainDurationMilliseconds = performance.now() - cacheGpuDrainStartedAt;
			console.log(
				`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} explicit cache GPU drain completed in ${cacheGpuDrainDurationMilliseconds.toFixed(1)}ms`,
			);
		}

		console.log(
			`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} final shader preparation started`,
		);
		const finalShaderPreparationStartedAt = performance.now();
		await handle.prepare(renderer);
		if (context.isContextLost()) throw new Error('B1 GPU context was lost during final shader preparation.');
		const failedPrograms = renderer.info.programs.filter((program) => program.diagnostics?.runnable === false);
		if (failedPrograms.length > 0) {
			const diagnostics = failedPrograms
				.map(
					(program) =>
						program.diagnostics?.programLog ||
						program.diagnostics?.fragmentShader?.log ||
						program.diagnostics?.vertexShader?.log ||
						'unknown shader compilation failure',
				)
				.join('\n');
			throw new Error(`B1 GPU final shader was not runnable:\n${diagnostics}`);
		}
		const finalShaderPreparationDurationMilliseconds = performance.now() - finalShaderPreparationStartedAt;
		console.log(`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} final shader prepared`);
		console.log(
			`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} final shader preparation took ${finalShaderPreparationDurationMilliseconds.toFixed(1)}ms`,
		);

		const readbackStartedAt = performance.now();
		const spectra = Array.from({length: GRID_WIDTH * GRID_WIDTH}, () => Array(40));
		const readback = new Float32Array(GRID_WIDTH * GRID_WIDTH * CHANNELS_PER_READ);
		for (let channelBase = 0; channelBase < 40; channelBase += CHANNELS_PER_READ) {
			bindingValues['b1.spectralChannelBase'] = channelBase;
			runtimePass.render(renderer, output, {texture: zeroTextures[0]});
			renderer.readRenderTargetPixels(output, 0, 0, GRID_WIDTH, GRID_WIDTH, readback);
			for (let directionIndex = 0; directionIndex < spectra.length; directionIndex += 1) {
				for (let channelOffset = 0; channelOffset < CHANNELS_PER_READ; channelOffset += 1) {
					spectra[directionIndex][channelBase + channelOffset] =
						readback[directionIndex * CHANNELS_PER_READ + channelOffset];
				}
			}
		}
		const readbackDurationMilliseconds = performance.now() - readbackStartedAt;
		console.log(`[B1 GPU progress] ${request.time} J${request.maximumScatteringOrder} readback complete`);
		if (context.isContextLost()) throw new Error('B1 GPU context was lost during spectral readback.');
		const glErrors = [];
		for (let error = context.getError(); error !== context.NO_ERROR; error = context.getError()) {
			glErrors.push(error);
		}
		if (glErrors.length > 0) throw new Error(`B1 GPU generation observed WebGL errors: ${glErrors.join(', ')}`);
		if (spectra.every((spectrum) => spectrum.every((value) => value === 0))) {
			throw new Error('B1 GPU spectral readback was identically zero.');
		}
		const rendererInformation = context.getExtension('WEBGL_debug_renderer_info');
		return {
			values: spectra,
			capabilities: {
				threeRevision: THREE.REVISION,
				webglVersion: context.getParameter(context.VERSION),
				shadingLanguageVersion: context.getParameter(context.SHADING_LANGUAGE_VERSION),
				renderer: context.getParameter(context.RENDERER),
				unmaskedVendor: rendererInformation
					? context.getParameter(rendererInformation.UNMASKED_VENDOR_WEBGL)
					: null,
				unmaskedRenderer: rendererInformation
					? context.getParameter(rendererInformation.UNMASKED_RENDERER_WEBGL)
					: null,
				maximumArrayLayers: context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS),
				maximumTextureSize: context.getParameter(context.MAX_TEXTURE_SIZE),
			},
			shaderDiagnostics: handle.getDiagnostics(),
			shaderSourceMetrics,
			executionTimings: {
				cacheGpuDrainDurationMilliseconds,
				finalShaderPreparationDurationMilliseconds,
				readbackDurationMilliseconds,
			},
		};
	} finally {
		handle?.dispose();
		algorithm.dispose();
	}
}
