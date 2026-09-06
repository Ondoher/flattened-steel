import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {DistantSunLightSource, SphericalEarthGeometry, StellarPointSetSource} from '../../index.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {Algorithm32ShaderAssembler} from '../../../shader-assembly/runtime/Algorithm32ShaderAssembler.js';
import {ShaderRuntimeInstaller} from '../../../rendering-runtime/three/ShaderRuntimeInstaller.js';
import {StellarScreenPaletteGenerationPass} from '../../../rendering-runtime/three/StellarScreenPaletteGenerationPass.js';
import {SunDiskTileGenerationPass} from '../../../rendering-runtime/three/SunDiskTileGenerationPass.js';
import {CelestialScreenPaletteConsumerShaderContribution} from '../../../celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from '../StellarPointPresentation.js';
import {loadBrightest2000StellarCatalogPackage} from '../../../../flat32/Brightest2000StellarCatalogPackageLoader.js';

export const STELLAR_QUALIFICATION_OBSERVATION = {
	instant: '2024-06-21T06:26:03.503Z',
	location: {
		latitude: {value: 37.3382, units: 'degrees'},
		longitude: {value: -121.8863, units: 'degrees'},
	},
};

export const STELLAR_QUALIFICATION_VIEW = {
	projection: 'perspective',
	modelViewProjectionMatrix: [
		0.36084391824351614, 0, 0, 0, 0, 0.577350269189626, 0, 0, 0, 0, -1.02020202020202, -1, 0, 0,
		-0.20202020202020202, 0,
	],
	inverseProjectionMatrix: [2.7712812921102032, 0, 0, 0, 0, 1.732050807568877, 0, 0, 0, 0, 0, -4.95, 0, 0, -1, 5.05],
	viewportSize: {width: 32, height: 20, units: 'pixels'},
};

const ARCSECONDS_TO_RADIANS = 0.00000484813681109536;
const TWO_PI = Math.PI * 2;

/** Create exact perspective facts for one viewport/FOV invariance control. */
function createPerspectiveView(width, height, verticalFieldOfViewDegrees) {
	const camera = new THREE.PerspectiveCamera(verticalFieldOfViewDegrees, width / height, 0.1, 10);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	const modelViewProjection = new THREE.Matrix4().multiplyMatrices(
		camera.projectionMatrix,
		camera.matrixWorldInverse,
	);
	return {
		projection: 'perspective',
		modelViewProjectionMatrix: modelViewProjection.toArray(),
		inverseProjectionMatrix: camera.projectionMatrixInverse.toArray(),
		viewportSize: {width, height, units: 'pixels'},
	};
}

/** Create the fixed model-space geometry used by shader and independent oracle. */
export function createCelestialOwners(directionToLight = [0, 0, 1]) {
	const sun = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6_360_000, units: 'meters'},
		topRadius: {value: 6_420_000, units: 'meters'},
		observerHeight: {value: 10, units: 'meters'},
		sceneFrame: {kind: 'model-space'},
	});
	geometry.configureLightSource({
		lightSource: sun,
		observation: STELLAR_QUALIFICATION_OBSERVATION,
		...(directionToLight === null ? {} : {placement: {kind: 'distant-direction', directionToLight}}),
	});
	return {sun, geometry};
}

/** Create only the configured geometry for existing stellar oracle helpers. */
export function createGeometry() {
	return createCelestialOwners().geometry;
}

/** Compile one complete GLSL ES 3 shader and include its diagnostic on failure. */
function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader) || 'Stellar generation shader compilation failed.');
	}

	return shader;
}

/** Link one compiled vertex/fragment pair. */
function linkProgram(gl, vertexSource, fragmentSource) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(program) || 'Stellar generation program link failed.');
	}
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	return program;
}

/** Compile and link one standard celestial generation stage. */
function compileStage(gl, stage) {
	const program = linkProgram(gl, stage.vertexShaderSource, stage.fragmentShaderSource);
	gl.deleteProgram(program);
}

/** Normalize one three-vector. */
function normalize3(value) {
	const length = Math.hypot(value[0], value[1], value[2]);
	return [value[0] / length, value[1] / length, value[2] / length];
}

/** Normalize one angular value into the half-open zero-to-two-pi range. */
function normalizeRadians(value) {
	return ((value % TWO_PI) + TWO_PI) % TWO_PI;
}

/** Multiply one column-major four-matrix by one four-vector. */
function multiplyMatrix4Vector4(matrix, vector) {
	return [0, 1, 2, 3].map(
		/** @param {number} row - Output row. */
		(row) =>
			matrix[row] * vector[0] +
			matrix[4 + row] * vector[1] +
			matrix[8 + row] * vector[2] +
			matrix[12 + row] * vector[3],
	);
}

/** Resolve one catalog direction through the independent fixed-observation CPU oracle. */
function projectDirection(catalogDirection, uniforms, view = STELLAR_QUALIFICATION_VIEW) {
	const direction = normalize3(catalogDirection);
	const rightAscension = normalizeRadians(Math.atan2(direction[1], direction[0]));
	const declination = Math.asin(Math.max(-1, Math.min(1, direction[2])));
	const t = Math.fround(uniforms.get('uStellarJulianCenturiesSinceJ2000'));
	const t2 = t * t;
	const t3 = t2 * t;
	const t4 = t3 * t;
	const t5 = t4 * t;
	const zeta =
		(2.650545 + 2306.083227 * t + 0.2988499 * t2 + 0.01801828 * t3 - 0.000005971 * t4 - 0.0000003173 * t5) *
		ARCSECONDS_TO_RADIANS;
	const z =
		(-2.650545 + 2306.077181 * t + 1.0927348 * t2 + 0.01826837 * t3 - 0.000028596 * t4 - 0.0000002904 * t5) *
		ARCSECONDS_TO_RADIANS;
	const theta =
		(2004.191903 * t - 0.4294934 * t2 - 0.04182264 * t3 - 0.000007089 * t4 - 0.0000001274 * t5) *
		ARCSECONDS_TO_RADIANS;
	const shiftedRightAscension = rightAscension + zeta;
	const a = Math.cos(declination) * Math.sin(shiftedRightAscension);
	const b =
		Math.cos(theta) * Math.cos(declination) * Math.cos(shiftedRightAscension) -
		Math.sin(theta) * Math.sin(declination);
	const c =
		Math.sin(theta) * Math.cos(declination) * Math.cos(shiftedRightAscension) +
		Math.cos(theta) * Math.sin(declination);
	const meanRightAscension = normalizeRadians(Math.atan2(a, b) + z);
	const meanDeclination = Math.asin(Math.max(-1, Math.min(1, c)));
	const gmstHours =
		6.697375 +
		0.065707485828 * Math.fround(uniforms.get('uStellarDaysAtZeroHoursSinceJ2000')) +
		1.0027379 * Math.fround(uniforms.get('uStellarHoursSinceZero')) +
		0.0854103 * t +
		0.0000258 * t * t;
	const longitude = Math.fround(uniforms.get('uStellarObserverLongitudeRadians'));
	const latitude = Math.fround(uniforms.get('uStellarObserverLatitudeRadians'));
	const hourAngle = normalizeRadians(normalizeRadians(gmstHours * (Math.PI / 12)) + longitude - meanRightAscension);
	const cosineDeclination = Math.cos(meanDeclination);
	const east = -cosineDeclination * Math.sin(hourAngle);
	const north =
		Math.sin(meanDeclination) * Math.cos(latitude) - cosineDeclination * Math.cos(hourAngle) * Math.sin(latitude);
	const up =
		Math.sin(meanDeclination) * Math.sin(latitude) + cosineDeclination * Math.cos(hourAngle) * Math.cos(latitude);
	if (up <= 0) return {classification: 'below-horizon'};

	const clip = multiplyMatrix4Vector4(view.modelViewProjectionMatrix, [east, up, -north, 0]);
	if (!(clip[3] > 0)) return {classification: 'behind-camera'};
	const ndc = [clip[0] / clip[3], clip[1] / clip[3]];
	const screen = [(ndc[0] + 1) * 0.5 * view.viewportSize.width, (1 - ndc[1]) * 0.5 * view.viewportSize.height];
	if (
		screen[0] < 0 ||
		screen[0] >= view.viewportSize.width ||
		screen[1] < 0 ||
		screen[1] >= view.viewportSize.height
	) {
		return {classification: 'outside-viewport'};
	}
	return {classification: 'occupied', pixel: [Math.floor(screen[0]), Math.floor(screen[1])]};
}

/** Construct the independent member classification and resolved-spectrum oracle. */
export function createCpuOracle(source, geometryContribution, view = STELLAR_QUALIFICATION_VIEW) {
	const layout = source.layout;
	const memberValues = source.copyMemberValues();
	const spectra = source.copySpectralValues();
	const uniforms = new Map(geometryContribution.uniforms.map((uniform) => [uniform.name, uniform.defaultValue]));
	const pixelMembers = new Map();
	const classifications = new Map();
	for (let memberIndex = 0; memberIndex < layout.memberCount; memberIndex += 1) {
		const offset = memberIndex * layout.memberComponentCount;
		const projected = projectDirection(memberValues.subarray(offset, offset + 3), uniforms, view);
		classifications.set(memberIndex, projected);
		if (projected.classification !== 'occupied') continue;
		const key = `${projected.pixel[0]},${projected.pixel[1]}`;
		if (!pixelMembers.has(key)) pixelMembers.set(key, []);
		pixelMembers.get(key).push(memberIndex);
	}

	const screenIndex = new Uint16Array(view.viewportSize.width * view.viewportSize.height);
	const palette = new Float64Array((layout.memberCount + 1) * layout.spectralChannelCount);
	const visualMagnitudes = new Float64Array(layout.memberCount + 1);
	const inputTotals = new Float64Array(layout.spectralChannelCount);
	for (const [key, pixelMemberIndices] of pixelMembers) {
		const pixel = key.split(',').map(Number);
		const representativeIndex = pixelMemberIndices[0] + 1;
		const framebufferY = view.viewportSize.height - 1 - pixel[1];
		screenIndex[framebufferY * view.viewportSize.width + pixel[0]] = representativeIndex;
		for (const memberIndex of pixelMemberIndices) {
			for (let channel = 0; channel < layout.spectralChannelCount; channel += 1) {
				const irradiance = spectra[channel * layout.memberCount + memberIndex];
				palette[representativeIndex * layout.spectralChannelCount + channel] +=
					irradiance * STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale;
				inputTotals[channel] += irradiance;
			}
		}
		const combinedVisualFlux = pixelMemberIndices.reduce(
			(sum, memberIndex) => sum + 10 ** (-0.4 * Number(memberValues[memberIndex * 4 + 3])),
			0,
		);
		visualMagnitudes[representativeIndex] = -2.5 * Math.log10(combinedVisualFlux);
	}
	return {classifications, pixelMembers, screenIndex, palette, visualMagnitudes, inputTotals};
}

/** Create one nearest-sampled two-dimensional texture. */
function createTexture(gl, internalFormat, width, height) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, width, height);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	return texture;
}

/** Upload the immutable CR6G-shaped split source textures. */
function createSourceTextures(gl, source) {
	const layout = source.layout;
	const members = createTexture(gl, gl.RGBA32F, layout.memberCount, 1);
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, layout.memberCount, 1, gl.RGBA, gl.FLOAT, source.copyMemberValues());
	const spectra = createTexture(gl, gl.R32F, layout.memberCount, layout.spectralChannelCount);
	gl.texSubImage2D(
		gl.TEXTURE_2D,
		0,
		0,
		0,
		layout.memberCount,
		layout.spectralChannelCount,
		gl.RED,
		gl.FLOAT,
		source.copySpectralValues(),
	);
	return {members, spectra};
}

/** Apply source, screen-index, and geometry uniforms to one linked stage program. */
function applyUniforms(
	gl,
	program,
	geometryContribution,
	sourceTextures,
	screenIndexTexture = null,
	view = STELLAR_QUALIFICATION_VIEW,
) {
	gl.useProgram(program);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, sourceTextures.members);
	gl.uniform1i(gl.getUniformLocation(program, 'uStellarSourceMembers'), 0);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, sourceTextures.spectra);
	gl.uniform1i(gl.getUniformLocation(program, 'uStellarSourceSpectra'), 1);
	if (screenIndexTexture !== null) {
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, screenIndexTexture);
		gl.uniform1i(gl.getUniformLocation(program, 'uStellarScreenIndex'), 2);
	}
	for (const uniform of geometryContribution.uniforms) {
		const location = gl.getUniformLocation(program, uniform.name);
		if (location === null) continue;
		const value =
			uniform.name === 'uStellarModelViewProjectionMatrix'
				? view.modelViewProjectionMatrix
				: uniform.name === 'uStellarInverseProjectionMatrix'
					? view.inverseProjectionMatrix
					: uniform.name === 'uStellarViewportSize'
						? [view.viewportSize.width, view.viewportSize.height]
						: uniform.defaultValue;
		if (uniform.type === 'mat4') gl.uniformMatrix4fv(location, false, value);
		else if (uniform.type === 'ivec2') gl.uniform2iv(location, value);
		else gl.uniform1f(location, value);
	}
}

/** Require one framebuffer to be complete. */
function expectCompleteFramebuffer(gl) {
	expect(gl.checkFramebufferStatus(gl.FRAMEBUFFER)).toBe(gl.FRAMEBUFFER_COMPLETE);
}

/** Execute the two production shader stages and read back their persistent logical outputs. */
function executeStages(gl, stages, source, geometryContribution, view = STELLAR_QUALIFICATION_VIEW) {
	const layout = source.layout;
	const sourceTextures = createSourceTextures(gl, source);
	const screenIndexTexture = createTexture(gl, gl.R16UI, view.viewportSize.width, view.viewportSize.height);
	const paletteRowCount = stages[0].stellarLayout.rowCount;
	const paletteTexture = createTexture(gl, gl.R32F, layout.memberCount + 1, paletteRowCount);
	const depth = gl.createRenderbuffer();
	const framebuffer = gl.createFramebuffer();
	const vertexArray = gl.createVertexArray();
	const programs = stages.map((stage) => linkProgram(gl, stage.vertexShaderSource, stage.fragmentShaderSource));
	const resources = {sourceTextures, screenIndexTexture, paletteTexture, depth, framebuffer, vertexArray, programs};

	gl.bindVertexArray(vertexArray);
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, screenIndexTexture, 0);
	gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, view.viewportSize.width, view.viewportSize.height);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
	expectCompleteFramebuffer(gl);
	gl.viewport(0, 0, view.viewportSize.width, view.viewportSize.height);
	gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
	gl.clearBufferuiv(gl.COLOR, 0, new Uint32Array([0, 0, 0, 0]));
	gl.clearDepth(1);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LESS);
	gl.depthMask(true);
	gl.disable(gl.BLEND);
	applyUniforms(gl, programs[0], geometryContribution, sourceTextures, null, view);
	gl.drawArrays(gl.POINTS, 0, layout.memberCount);

	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, paletteTexture, 0);
	expectCompleteFramebuffer(gl);
	gl.viewport(0, 0, layout.memberCount + 1, paletteRowCount);
	gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
	gl.disable(gl.DEPTH_TEST);
	applyUniforms(gl, programs[1], geometryContribution, sourceTextures, screenIndexTexture, view);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.finish();

	const palette = new Float32Array((layout.memberCount + 1) * paletteRowCount);
	gl.readPixels(0, 0, layout.memberCount + 1, paletteRowCount, gl.RED, gl.FLOAT, palette);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, screenIndexTexture, 0);
	const screenIndex = new Uint16Array(view.viewportSize.width * view.viewportSize.height);
	gl.readPixels(
		0,
		0,
		view.viewportSize.width,
		view.viewportSize.height,
		gl.RED_INTEGER,
		gl.UNSIGNED_SHORT,
		screenIndex,
	);

	return {screenIndex, palette, resources};
}

/** Delete every test-owned WebGL handle. */
function disposeExecution(gl, resources) {
	for (const program of resources.programs) gl.deleteProgram(program);
	gl.deleteVertexArray(resources.vertexArray);
	gl.deleteFramebuffer(resources.framebuffer);
	gl.deleteRenderbuffer(resources.depth);
	gl.deleteTexture(resources.paletteTexture);
	gl.deleteTexture(resources.screenIndexTexture);
	gl.deleteTexture(resources.sourceTextures.members);
	gl.deleteTexture(resources.sourceTextures.spectra);
}

/** Fetch resolved palette values through the same integer-index lookup used by the later consumer. */
function readRuntimeResolvedSpectra(renderer, generation) {
	const width = generation.screenIndex.width;
	const height = generation.screenIndex.height;
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RedFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.internalFormat = 'R32F';
	const uniforms = {
		uScreenIndex: {value: generation.screenIndex.texture},
		uPalette: {value: generation.palette.texture},
		uChannel: {value: 0},
		uReadIndex: {value: false},
	};
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: `
			precision highp float;
			void main() {
				vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0) :
					(gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`,
		fragmentShader: `
			precision highp float;
			precision highp int;
			precision highp usampler2D;
			uniform usampler2D uScreenIndex;
			uniform sampler2D uPalette;
			uniform int uChannel;
			uniform bool uReadIndex;
			out vec4 outColor;
			void main() {
				uint index = texelFetch(uScreenIndex, ivec2(gl_FragCoord.xy), 0).r;
				float value = uReadIndex ? float(index) : texelFetch(uPalette, ivec2(int(index), uChannel), 0).r;
				outColor = vec4(value, 0.0, 0.0, 1.0);
			}
		`,
		uniforms,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
	const scene = new THREE.Scene();
	scene.add(new THREE.Mesh(geometry, material));
	const camera = new THREE.Camera();
	const readback = new Float32Array(width * height);
	const indices = new Uint16Array(width * height);
	const spectra = Array.from({length: 15}, () => new Float32Array(width * height));
	const previousTarget = renderer.getRenderTarget();
	try {
		uniforms.uReadIndex.value = true;
		renderer.setRenderTarget(target);
		renderer.render(scene, camera);
		renderer.readRenderTargetPixels(target, 0, 0, width, height, readback);
		for (let pixel = 0; pixel < readback.length; pixel += 1) indices[pixel] = readback[pixel];
		uniforms.uReadIndex.value = false;
		for (let channel = 0; channel < spectra.length; channel += 1) {
			uniforms.uChannel.value = channel;
			renderer.render(scene, camera);
			renderer.readRenderTargetPixels(target, 0, 0, width, height, spectra[channel]);
		}
		return {indices, spectra};
	} finally {
		renderer.setRenderTarget(previousTarget);
		target.dispose();
		material.dispose();
		geometry.dispose();
	}
}

/** Wait for one real browser context loss/restoration cycle and notify the generation participant. */
function restoreRuntimeContext(canvas, pass, extension) {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Stellar runtime context restoration timed out.')), 10000);
		canvas.addEventListener(
			'webglcontextlost',
			(event) => {
				event.preventDefault();
				pass.handleContextLoss();
				setTimeout(() => extension.restoreContext(), 0);
			},
			{once: true},
		);
		canvas.addEventListener(
			'webglcontextrestored',
			() => {
				clearTimeout(timeout);
				pass.handleContextRestoration();
				resolve();
			},
			{once: true},
		);
		extension.loseContext();
	});
}

/** Assemble the production consumer with a minimal deterministic atmosphere-state harness. */
function createConsumerAssembly(stellarSource, sun) {
	const runtime = ShaderContributions.createShaderContribution({
		id: 'stellar-consumer-browser-runtime',
		owner: 'runtime',
		provides: ['runtime.initialState'],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uViewportSizePixels',
				'vec2',
				'consumerTest.viewportSize',
				[32, 20],
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uConsumerTestTransmittance',
				'float',
				'consumerTest.transmittance',
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uConsumerTestSceneHitMask',
				'float',
				'consumerTest.sceneHitMask',
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'stellar-consumer-browser-types',
				'declareTypes',
				0,
				`const int SPECTRAL_CHANNEL_COUNT = 15;
struct SpectralValue { float channels[15]; };
struct ShaderState { vec2 textureCoordinates; float sceneHitMask; SpectralValue transmittance; };
SpectralValue zeroSpectral() {
	SpectralValue value;
	for (int channelIndex = 0; channelIndex < 15; channelIndex += 1) value.channels[channelIndex] = 0.0;
	return value;
}
ShaderState createInitialShaderState(vec2 textureCoordinates) {
	ShaderState state;
	state.textureCoordinates = textureCoordinates;
	state.sceneHitMask = uConsumerTestSceneHitMask;
	for (int channelIndex = 0; channelIndex < 15; channelIndex += 1) {
		state.transmittance.channels[channelIndex] = uConsumerTestTransmittance;
	}
	return state;
}`,
			),
		],
	});
	const transport = ShaderContributions.createShaderContribution({
		id: 'stellar-consumer-browser-transport',
		owner: 'transport',
		provides: ['transport.evaluatePathRadiance'],
	});
	const celestial = new CelestialScreenPaletteConsumerShaderContribution({
		includeStars: true,
		surfaceRadiance: sun.celestialSourceDefinition.surfaceRadiance,
	}).createShaderContribution();
	const output = ShaderContributions.createShaderContribution({
		id: 'stellar-consumer-browser-output',
		owner: 'color',
		provides: ['color.consumerTestOutput'],
		requires: ['celestial.evaluateRadiance'],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'stellar-consumer-browser-output-main',
				'encodeOutput',
				0,
				'outColor = vec4(celestialRadiance.channels[0], celestialRadiance.channels[1], celestialRadiance.channels[2], 1.0);',
			),
		],
	});
	return new Algorithm32ShaderAssembler().assemble({
		contributions: [runtime, transport, celestial, output],
		mainRequiredSymbols: [
			'runtime.initialState',
			'transport.evaluatePathRadiance',
			'celestial.evaluateRadiance',
			'color.consumerTestOutput',
		],
		systemProvidedSymbols: [],
	});
}

describe('stellar screen-palette generation GLSL', /** Called by Jasmine to register the named test suite. */ () => {
	it('generates a continuous source-local Sun tile with conserved projected area', async () => {
		const canvas = document.createElement('canvas');
		const renderer = new THREE.WebGLRenderer({canvas, antialias: false, depth: false, stencil: false});
		const viewportSize = {width: 128, height: 128, units: 'pixels'};
		renderer.setSize(viewportSize.width, viewportSize.height, false);
		expect(renderer.getContext().getExtension('EXT_color_buffer_float')).not.toBeNull();
		const {sun, geometry} = createCelestialOwners([0, 0, -1]);
		const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		const pass = new SunDiskTileGenerationPass({
			THREE,
			roster: {
				id: 'sun-tile-browser-roster',
				family: 'spherical-sun-stars-radial-v1',
				sun,
				stars: null,
			},
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
			camera,
			viewportSize,
			sceneScale: {metersPerSceneUnit: 1},
		});
		let copyTarget = null;
		let copyMaterial = null;
		let copyGeometry = null;
		try {
			await pass.prepare(renderer);
			pass.render(renderer);
			const generation = pass.publicationState.active;
			expect(generation.completion).toBe('complete');
			const resolution = generation.coverage.width;
			copyTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
				format: THREE.RedFormat,
				type: THREE.FloatType,
				depthBuffer: false,
				stencilBuffer: false,
			});
			copyTarget.texture.internalFormat = 'R32F';
			copyMaterial = new THREE.RawShaderMaterial({
				glslVersion: THREE.GLSL3,
				vertexShader: `precision highp float;
void main() {
	vec2 position = gl_VertexID == 0 ? vec2(-1.0, -1.0)
		: (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
	gl_Position = vec4(position, 0.0, 1.0);
}`,
				fragmentShader: `precision highp float;
precision highp int;
uniform sampler2D uCoverage;
layout(location = 0) out highp float outCoverage;
void main() { outCoverage = texelFetch(uCoverage, ivec2(gl_FragCoord.xy), 0).r; }`,
				uniforms: {uCoverage: {value: generation.coverage.texture}},
				depthTest: false,
				depthWrite: false,
			});
			copyGeometry = new THREE.BufferGeometry();
			copyGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
			const scene = new THREE.Scene();
			const mesh = new THREE.Mesh(copyGeometry, copyMaterial);
			mesh.frustumCulled = false;
			scene.add(mesh);
			renderer.setRenderTarget(copyTarget);
			renderer.render(scene, new THREE.Camera());
			const coverage = new Float32Array(resolution * resolution);
			renderer.readRenderTargetPixels(copyTarget, 0, 0, resolution, resolution, coverage);
			const positive = [...coverage].filter((value) => value > 0);
			expect(positive.length).toBeGreaterThan(0);
			expect(positive.some((value) => value < 1)).toBeTrue();
			expect(Math.max(...positive)).toBeLessThanOrEqual(1);
			const radiusPixels =
				Math.tan(sun.celestialSourceDefinition.angularRadius.value) *
				Math.abs(camera.projectionMatrix.elements[5]) *
				viewportSize.height *
				0.5;
			const projectedArea = coverage.reduce((sum, value) => sum + value, 0) / (16 * 16);
			expect(Math.abs(projectedArea - Math.PI * radiusPixels * radiusPixels)).toBeLessThan(0.002);
		} finally {
			renderer.setRenderTarget(null);
			copyTarget?.dispose();
			copyMaterial?.dispose();
			copyGeometry?.dispose();
			pass.dispose();
			renderer.dispose();
		}
	});

	it('compiles and links the production point-index and sparse-palette stages in WebGL2', /** Called by Jasmine to exercise the named behavior. */ () => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2', {antialias: false, depth: true, stencil: false});
		expect(gl).not.toBeNull();
		const geometry = createGeometry();
		const stages = new StellarPointSetSource().createStellarGenerationStages({
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});

		for (const stage of stages) compileStage(gl, stage);
	});

	it('matches the independent fixed-observation oracle for classification, collisions, spectra, conservation, and packing', /** Called by Jasmine to exercise the named behavior. */ () => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2', {antialias: false, depth: true, stencil: false});
		expect(gl).not.toBeNull();
		expect(gl.getExtension('EXT_color_buffer_float')).not.toBeNull();
		const geometry = createGeometry();
		const geometryContribution = geometry.createStellarGenerationShaderContribution({
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});
		const stellarSource = new StellarPointSetSource();
		const source = stellarSource.createStellarGenerationSourceTable();
		const stages = stellarSource.createStellarGenerationStages({
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});
		const oracle = createCpuOracle(source, geometryContribution);
		const execution = executeStages(gl, stages, source, geometryContribution);

		try {
			expect(Array.from(execution.screenIndex)).toEqual(Array.from(oracle.screenIndex));
			const occupiedPixels = oracle.pixelMembers.size;
			const collisionPixels = [...oracle.pixelMembers.values()].filter((members) => members.length > 1).length;
			const uniquePixels = occupiedPixels - collisionPixels;
			expect(occupiedPixels).toBeGreaterThan(0);
			expect(collisionPixels).toBeGreaterThan(0);
			expect(uniquePixels).toBeGreaterThan(0);
			expect(occupiedPixels).toBeLessThan(
				STELLAR_QUALIFICATION_VIEW.viewportSize.width * STELLAR_QUALIFICATION_VIEW.viewportSize.height,
			);
			expect(oracle.classifications.size).toBe(source.layout.memberCount);
			expect(
				[...oracle.classifications.values()].filter((result) => result.classification === 'below-horizon')
					.length,
			).toBeGreaterThan(0);
			expect(
				[...oracle.classifications.values()].filter((result) => result.classification === 'outside-viewport')
					.length,
			).toBeGreaterThan(0);

			const representativeIndices = new Set(oracle.screenIndex);
			representativeIndices.delete(0);
			let maximumRelativeResidual = 0;
			const outputTotals = new Float64Array(source.layout.spectralChannelCount);
			for (let entry = 0; entry <= source.layout.memberCount; entry += 1) {
				for (let channel = 0; channel < source.layout.spectralChannelCount; channel += 1) {
					const offset = channel * (source.layout.memberCount + 1) + entry;
					const gpuValue = execution.palette[offset];
					const expectedValue = oracle.palette[entry * source.layout.spectralChannelCount + channel];
					if (!representativeIndices.has(entry)) {
						expect(gpuValue).toBe(0);
						continue;
					}
					const residual = Math.abs(gpuValue - expectedValue) / Math.max(Math.abs(expectedValue), 1e-30);
					maximumRelativeResidual = Math.max(maximumRelativeResidual, residual);
					outputTotals[channel] +=
						gpuValue / STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale;
				}
			}
			expect(maximumRelativeResidual).toBeLessThan(0.0002);
			for (let channel = 0; channel < source.layout.spectralChannelCount; channel += 1) {
				const conservationResidual =
					Math.abs(outputTotals[channel] - oracle.inputTotals[channel]) /
					Math.max(Math.abs(oracle.inputTotals[channel]), 1e-30);
				expect(conservationResidual).toBeLessThan(0.0002);
			}
			expect(Math.max(...execution.screenIndex)).toBeLessThanOrEqual(source.layout.memberCount);
		} finally {
			disposeExecution(gl, execution.resources);
		}
	});

	it('recasts the exact brightest-2,000 package through GPU readback and collision conservation', async () => {
		const definition = await loadBrightest2000StellarCatalogPackage(
			'/base/server/flat32/data/brightest-2000-stellar-package-v1/manifest.json',
		);
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2', {antialias: false, depth: true, stencil: false});
		expect(gl).not.toBeNull();
		expect(gl.getExtension('EXT_color_buffer_float')).not.toBeNull();
		const geometry = createGeometry();
		const geometryContribution = geometry.createStellarGenerationShaderContribution({
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});
		const stellarSource = new StellarPointSetSource({catalogDefinition: definition});
		const source = stellarSource.createStellarGenerationSourceTable();
		const stages = stellarSource.createStellarGenerationStages({
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});
		const oracle = createCpuOracle(source, geometryContribution);
		const execution = executeStages(gl, stages, source, geometryContribution);
		try {
			expect(source.layout.memberCount).toBe(2000);
			expect(source.copyMemberValues().byteLength + source.copySpectralValues().byteLength).toBe(152000);
			expect(gl.getParameter(gl.MAX_TEXTURE_SIZE)).toBeGreaterThanOrEqual(2001);
			expect(Array.from(execution.screenIndex)).toEqual(Array.from(oracle.screenIndex));
			expect([...oracle.pixelMembers.values()].some((members) => members.length > 1)).toBeTrue();
			const representatives = new Set(oracle.screenIndex);
			representatives.delete(0);
			const outputTotals = new Float64Array(source.layout.spectralChannelCount);
			for (const entry of representatives) {
				for (let channel = 0; channel < source.layout.spectralChannelCount; channel += 1) {
					const offset = channel * (source.layout.memberCount + 1) + entry;
					const expected = oracle.palette[entry * source.layout.spectralChannelCount + channel];
					const actual = execution.palette[offset];
					expect(Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-30)).toBeLessThan(0.0003);
					outputTotals[channel] += actual / STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale;
				}
				const magnitudeOffset = 15 * (source.layout.memberCount + 1) + entry;
				expect(execution.palette[magnitudeOffset]).toBeCloseTo(oracle.visualMagnitudes[entry], 5);
			}
			for (let channel = 0; channel < source.layout.spectralChannelCount; channel += 1) {
				expect(
					Math.abs(outputTotals[channel] - oracle.inputTotals[channel]) /
						Math.max(oracle.inputTotals[channel], 1e-30),
				).toBeLessThan(0.0003);
			}
		} finally {
			disposeExecution(gl, execution.resources);
		}

		const renderer = new THREE.WebGLRenderer({canvas: document.createElement('canvas'), antialias: false});
		renderer.setSize(32, 20, false);
		const camera = new THREE.PerspectiveCamera(120, 32 / 20, 0.1, 10);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		const pass = new StellarScreenPaletteGenerationPass({
			THREE,
			source: stellarSource,
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
			camera,
			viewportSize: STELLAR_QUALIFICATION_VIEW.viewportSize,
		});
		try {
			await pass.prepare(renderer);
			pass.render(renderer);
			const first = pass.publicationState.active;
			expect(first.layout.entryCapacity).toBe(2001);
			camera.rotateY(0.125);
			camera.updateMatrixWorld(true);
			pass.render(renderer);
			expect(pass.publicationState.active.id).not.toBe(first.id);
			pass.handleContextLoss();
			expect(pass.publicationState.active).toBeNull();
			pass.handleContextRestoration();
			pass.render(renderer);
			expect(pass.publicationState.active.completion).toBe('complete');
			expect(pass.getDiagnostics()).toEqual(
				jasmine.objectContaining({
					generationCount: 3,
					contextLossCount: 1,
					createdTargetCount: 6,
					disposedTargetCount: 4,
				}),
			);
		} finally {
			pass.dispose();
			expect(pass.getDiagnostics().disposedTargetCount).toBe(6);
			renderer.dispose();
		}
	});

	it('keeps one-pixel stellar palette values invariant across viewport size and field of view', () => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2', {antialias: false, depth: true, stencil: false});
		expect(gl).not.toBeNull();
		expect(gl.getExtension('EXT_color_buffer_float')).not.toBeNull();
		const geometry = createGeometry();
		const geometryContribution = geometry.createStellarGenerationShaderContribution({
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});
		const stellarSource = new StellarPointSetSource();
		const source = stellarSource.createStellarGenerationSourceTable();
		const stages = stellarSource.createStellarGenerationStages({
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
		});
		const views = [
			createPerspectiveView(32, 20, 120),
			createPerspectiveView(64, 40, 120),
			createPerspectiveView(64, 40, 78),
		];
		const oracles = views.map((view) => createCpuOracle(source, geometryContribution, view));
		const executions = views.map((view) => executeStages(gl, stages, source, geometryContribution, view));
		try {
			const uniquelyRepresentedMembers = oracles.map(
				(oracle) => new Set([...oracle.pixelMembers.values()].filter((members) => members.length === 1).flat()),
			);
			const memberIndex = [...uniquelyRepresentedMembers[0]].find((candidate) =>
				uniquelyRepresentedMembers.slice(1).every((members) => members.has(candidate)),
			);
			expect(memberIndex).toBeDefined();
			const entryIndex = memberIndex + 1;
			for (const execution of executions) {
				expect([...execution.screenIndex].filter((entry) => entry === entryIndex).length).toBe(1);
			}
			for (let channel = 0; channel < source.layout.spectralChannelCount; channel += 1) {
				const offset = channel * (source.layout.memberCount + 1) + entryIndex;
				const values = executions.map((execution) => execution.palette[offset]);
				expect(values[1]).toBe(values[0]);
				expect(values[2]).toBe(values[0]);
			}
		} finally {
			for (const execution of executions) disposeExecution(gl, execution.resources);
		}
	});

	it('runs as a Three pipeline pass, supports live integer lookup, and rebuilds after context restoration', async () => {
		const canvas = document.createElement('canvas');
		const renderer = new THREE.WebGLRenderer({canvas, antialias: false, depth: true, stencil: false});
		renderer.setSize(32, 20, false);
		const gl = renderer.getContext();
		expect(gl.getExtension('EXT_color_buffer_float')).not.toBeNull();
		const contextExtension = gl.getExtension('WEBGL_lose_context');
		expect(contextExtension).not.toBeNull();
		const geometry = createGeometry();
		const stellarSource = new StellarPointSetSource();
		const source = stellarSource.createStellarGenerationSourceTable();
		const oracle = createCpuOracle(
			source,
			geometry.createStellarGenerationShaderContribution({observation: STELLAR_QUALIFICATION_OBSERVATION}),
		);
		const camera = new THREE.PerspectiveCamera(120, 32 / 20, 0.1, 10);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		const pass = new StellarScreenPaletteGenerationPass({
			THREE,
			source: stellarSource,
			geometry,
			observation: STELLAR_QUALIFICATION_OBSERVATION,
			camera,
			viewportSize: STELLAR_QUALIFICATION_VIEW.viewportSize,
		});

		try {
			await pass.prepare(renderer);
			pass.render(renderer);
			const generation = pass.publicationState.active;
			expect(generation.completion).toBe('complete');
			expect(generation.screenIndex).toEqual(jasmine.objectContaining({format: 'R16UI', width: 32, height: 20}));
			expect(generation.palette).toEqual(jasmine.objectContaining({format: 'R32F', width: 501, height: 16}));
			const lookup = readRuntimeResolvedSpectra(renderer, generation);
			expect(Array.from(lookup.indices)).toEqual(Array.from(oracle.screenIndex));
			let maximumRelativeResidual = 0;
			for (let pixel = 0; pixel < lookup.indices.length; pixel += 1) {
				const entry = lookup.indices[pixel];
				for (let channel = 0; channel < 15; channel += 1) {
					const expected = oracle.palette[entry * 15 + channel];
					const residual =
						Math.abs(lookup.spectra[channel][pixel] - expected) / Math.max(Math.abs(expected), 1e-30);
					maximumRelativeResidual = Math.max(maximumRelativeResidual, residual);
				}
			}
			expect(maximumRelativeResidual).toBeLessThan(0.0002);

			const firstIdentity = generation.id;
			const firstIndexTexture = generation.screenIndex.texture;
			pass.markDirty('view');
			pass.render(renderer);
			expect(pass.publicationState.active.id).toBe(firstIdentity);
			expect(pass.publicationState.active.screenIndex.texture).not.toBe(firstIndexTexture);
			const refreshedLookup = readRuntimeResolvedSpectra(renderer, pass.publicationState.active);
			expect(Array.from(refreshedLookup.indices)).toEqual(Array.from(oracle.screenIndex));
			await restoreRuntimeContext(canvas, pass, contextExtension);
			expect(pass.publicationState.active).toBeNull();
			pass.render(renderer);
			expect(pass.publicationState.active.id).toBe(firstIdentity);
			expect(pass.getDiagnostics()).toEqual(
				jasmine.objectContaining({
					contextLossCount: 1,
					generationCount: 3,
					createdTargetCount: 6,
					disposedTargetCount: 4,
				}),
			);
			const restoredLookup = readRuntimeResolvedSpectra(renderer, pass.publicationState.active);
			expect(Array.from(restoredLookup.indices)).toEqual(Array.from(oracle.screenIndex));
		} finally {
			pass.dispose();
			renderer.dispose();
		}
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({status: 'disposed', createdTargetCount: 6, disposedTargetCount: 6}),
		);
	});

	it('keeps the below-horizon Sun absent and the San Jose night field as one-pixel stellar points', async () => {
		const canvas = document.createElement('canvas');
		const renderer = new THREE.WebGLRenderer({canvas, antialias: false, depth: true, stencil: false});
		renderer.setSize(32, 20, false);
		expect(renderer.getContext().getExtension('EXT_color_buffer_float')).not.toBeNull();
		const {sun, geometry} = createCelestialOwners(null);
		const stellarSource = new StellarPointSetSource();
		const source = stellarSource.createStellarGenerationSourceTable();
		const oracle = createCpuOracle(
			source,
			geometry.createStellarGenerationShaderContribution({observation: STELLAR_QUALIFICATION_OBSERVATION}),
		);
		const camera = new THREE.PerspectiveCamera(120, 32 / 20, 0.1, 10);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		const composer = {
			passes: [],
			addPass(pass) {
				this.passes.push(pass);
			},
			removePass(pass) {
				this.passes.splice(this.passes.indexOf(pass), 1);
			},
		};
		const bindingValues = {'consumerTest.transmittance': 0.25, 'consumerTest.sceneHitMask': 0};
		const runtime = new ShaderRuntimeInstaller({
			geometry,
			celestialSources: {
				id: 'stellar-consumer-browser-roster',
				family: 'spherical-sun-stars-radial-v1',
				sun,
				stars: stellarSource,
			},
			profile: {models: {sourcePlacement: {observation: STELLAR_QUALIFICATION_OBSERVATION}}},
		}).install(
			{
				setup: {THREE, composer, camera, viewportSize: STELLAR_QUALIFICATION_VIEW.viewportSize},
				bindingValues,
			},
			createConsumerAssembly(stellarSource, sun),
		);
		const target = new THREE.WebGLRenderTarget(32, 20, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false,
		});
		const pixel = new Float32Array(4);
		const frame = new Float32Array(32 * 20 * 4);
		try {
			await runtime.prepare(renderer);
			composer.passes[0].render(renderer);
			composer.passes[1].render(renderer, target, target);
			const [pixelKey, members] = [...oracle.pixelMembers.entries()][0];
			const [x, topY] = pixelKey.split(',').map(Number);
			const framebufferY = 20 - 1 - topY;
			renderer.readRenderTargetPixels(target, x, framebufferY, 1, 1, pixel);
			const entry = members[0] + 1;
			for (let channel = 0; channel < 3; channel += 1) {
				const expected = oracle.palette[entry * 15 + channel] * 0.25;
				const residual = Math.abs(pixel[channel] - expected) / Math.max(Math.abs(expected), 1e-30);
				expect(residual).toBeLessThan(0.0002);
			}
			renderer.readRenderTargetPixels(target, 0, 0, 32, 20, frame);
			let nonzeroPixelCount = 0;
			for (let offset = 0; offset < frame.length; offset += 4) {
				if (frame[offset] > 0 || frame[offset + 1] > 0 || frame[offset + 2] > 0) nonzeroPixelCount += 1;
			}
			expect(nonzeroPixelCount).toBe(oracle.pixelMembers.size);

			bindingValues['consumerTest.sceneHitMask'] = 1;
			composer.passes[1].render(renderer, target, target);
			renderer.readRenderTargetPixels(target, x, framebufferY, 1, 1, pixel);
			expect(Array.from(pixel.slice(0, 3))).toEqual([0, 0, 0]);
		} finally {
			runtime.dispose();
			target.dispose();
			renderer.dispose();
		}
	});
});
