import * as THREE from '../../../node_modules/three/build/three.module.js';

import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {ThreeCacheBackend} from '../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {ShaderContributions} from '../../../src/algorithm32/shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../../src/algorithm32/shader-assembly/base/ShaderSource.js';
import {ProductionProgressCacheBackend} from '../b1-directional-sky-radiance/ProductionProgressCacheBackend.js';
import {FrameDomain} from './FrameDomain.js';

const GRID_WIDTH = 9;
const CHANNEL_COUNT = 40;
const CHANNELS_PER_READ = 4;
let session = null;

function createSpectralReadoutOwner() {
	const viewDirections = [];
	for (let gridY = 0; gridY < GRID_WIDTH; gridY += 1) {
		for (let gridX = 0; gridX < GRID_WIDTH; gridX += 1) {
			viewDirections.push(FrameDomain.createViewDirection(gridX, gridY));
		}
	}
	return {
		createShaderContribution() {
			return ShaderContributions.createShaderContribution({
				id: 'color-frame-parity-native-spectral-readout',
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
						'frame-parity-view-directions',
						'declareConstants',
						100,
						`const vec3 B1_VIEW_DIRECTIONS[81] = vec3[81](${viewDirections
							.map((direction) => ShaderSource.formatVec3(direction))
							.join(', ')});`,
					),
				],
				mainHooks: [
					ShaderContributions.createShaderSourceBlock(
						'frame-parity-main-view-ray',
						'reconstructRay',
						100,
						`ivec2 b1Pixel = clamp(ivec2(gl_FragCoord.xy), ivec2(0), ivec2(8));
int b1DirectionIndex = b1Pixel.y * 9 + b1Pixel.x;
state.ray.direction = B1_VIEW_DIRECTIONS[b1DirectionIndex];`,
					),
					ShaderContributions.createShaderSourceBlock(
						'frame-parity-main-compose',
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
						'frame-parity-main-output',
						'encodeOutput',
						0,
						'outColor = state.outputRgba;',
					),
				],
				bindingRequirements: [
					ShaderContributions.createShaderBindingRequirement(
						'frame-parity.spectral-channel-base',
						'color',
						'uniform',
						'frame',
						'b1.spectralChannelBase',
						true,
					),
				],
				diagnostics: {mode: 'retained-frame-native-spectral-readout'},
			});
		},
	};
}

function createRenderer() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: false,
	});
	if (!context || !context.getExtension('EXT_color_buffer_float')) {
		throw new Error('Frame-parity GPU generation requires WebGL2 float render targets.');
	}
	if (context.getParameter(context.MAX_ARRAY_TEXTURE_LAYERS) < CHANNEL_COUNT) {
		throw new Error('Frame-parity GPU generation requires at least 40 array-texture layers.');
	}
	if (context.getShaderPrecisionFormat(context.FRAGMENT_SHADER, context.HIGH_FLOAT).precision <= 0) {
		throw new Error('Frame-parity GPU generation requires highp fragment precision.');
	}
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.debug.checkShaderErrors = true;
	renderer.setPixelRatio(1);
	renderer.setSize(GRID_WIDTH, GRID_WIDTH, false);
	return {renderer, context, canvas};
}

function createZeroTexture() {
	const texture = new THREE.DataTexture(
		new Uint8Array(GRID_WIDTH * GRID_WIDTH * CHANNELS_PER_READ),
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

function createComposer() {
	return {
		passes: [],
		addPass(pass) {
			this.passes.push(pass);
		},
		removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index !== -1) this.passes.splice(index, 1);
		},
	};
}

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
				console.log(`[Frame GPU progress] ${message}`);
			},
		}),
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(90, 1, 0.1, 10),
		zeroTextures,
		output,
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

export function disposeGpuSession() {
	if (!session) return;
	const current = session;
	session = null;
	current.output.dispose();
	for (const texture of current.zeroTextures) texture.dispose();
	current.backend.dispose();
	current.renderer.setRenderTarget(null);
	current.renderer.dispose();
	current.renderer.forceContextLoss();
	current.canvas.remove();
}

export async function generateGpuCondition(request) {
	if (!session) throw new Error('Frame-parity GPU session is not initialized.');
	const condition = {time: request.time, sun: {fittedAzimuthDegrees: request.fittedAzimuthDegrees}};
	const {renderer, context, backend, scene, camera, zeroTextures, output, bindingValues} = session;
	const profile = FrameDomain.createProfile(
		condition,
		request.maximumScatteringOrder,
		'retained-z-up',
		request.groundVariant ?? 'production',
		request.boundaryAltitudeMeters ?? 2,
	);
	const algorithm = new Algorithm32({profile, color: createSpectralReadoutOwner()});
	const composer = createComposer();
	let handle;
	try {
		console.log(`[Frame GPU progress] ${request.time} J${request.maximumScatteringOrder} setup started`);
		handle = await algorithm.setupShader({
			THREE,
			composer,
			scene,
			camera,
			viewportSize: {width: GRID_WIDTH, height: GRID_WIDTH, units: 'pixels'},
			cacheBackend: backend,
			bindingValues,
			logger: {
				warn(message, error) {
					throw error instanceof Error ? error : new Error(`${message}: ${String(error)}`);
				},
			},
		});
		if (context.isContextLost()) throw new Error('GPU context was lost during cache construction.');
		const runtimePass = composer.passes.at(-1);
		if (!runtimePass || typeof runtimePass.render !== 'function')
			throw new Error('Runtime pass was not installed.');
		const fragmentShaderSource = runtimePass.material.fragmentShader;
		console.log(
			`[Frame GPU progress] ${request.time} J${request.maximumScatteringOrder} cache complete; final shader ${fragmentShaderSource.length} characters`,
		);
		const preparationStartedAt = performance.now();
		await handle.prepare(renderer);
		console.log(
			`[Frame GPU progress] ${request.time} J${request.maximumScatteringOrder} final shader prepared in ${(performance.now() - preparationStartedAt).toFixed(1)}ms`,
		);
		const spectra = Array.from({length: GRID_WIDTH * GRID_WIDTH}, () => Array(CHANNEL_COUNT));
		const readback = new Float32Array(GRID_WIDTH * GRID_WIDTH * CHANNELS_PER_READ);
		for (let channelBase = 0; channelBase < CHANNEL_COUNT; channelBase += CHANNELS_PER_READ) {
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
		if (spectra.some((spectrum) => spectrum.some((value) => !Number.isFinite(value) || value < 0))) {
			throw new Error('Frame-parity GPU readback contains an invalid radiance value.');
		}
		const rendererInformation = context.getExtension('WEBGL_debug_renderer_info');
		console.log(`[Frame GPU progress] ${request.time} J${request.maximumScatteringOrder} readback complete`);
		return {
			values: spectra,
			profile: {id: profile.id, contentHash: profile.contentHash},
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
		};
	} finally {
		handle?.dispose();
		algorithm.dispose();
	}
}
