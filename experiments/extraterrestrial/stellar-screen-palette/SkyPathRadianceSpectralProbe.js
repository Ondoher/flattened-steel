import * as THREE from 'three';

import {Algorithm32ShaderAssembler} from
	'../candidate/src/algorithm32/shader/Algorithm32ShaderAssembler.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderTextureDescriptor,
	createShaderUniformDescriptor,
} from '../candidate/src/algorithm32/shader/shaderContribution.js';

const DIRECTION_VALUE_KEY = 'diagnostic.skySpectralDirections';
const OUTPUT_CHANNEL_VALUE_KEY = 'diagnostic.skySpectralOutputChannel';
const DIRECTION_UNIFORM_NAME = 'uSkySpectralDirections';
const OUTPUT_CHANNEL_UNIFORM_NAME = 'uSkySpectralOutputChannel';
const FULLSCREEN_VERTEX_SHADER = `
precision highp float;
in vec3 position;
out vec2 vUv;
void main() {
	vUv = position.xy * 0.5 + 0.5;
	gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

export const SKY_SPECTRAL_PROBE_ELEVATIONS_DEGREES = Object.freeze([
	0, 0.25, 0.5, 1, 2, 3, 5, 7.5, 10, 15, 20, 30, 45, 60, 75,
]);

export const SKY_SPECTRAL_PROBE_REGULAR_AZIMUTH_OFFSETS_DEGREES =
	Object.freeze(Array.from({length: 37}, (_value, index) => -90 + index * 5));

export const SKY_SPECTRAL_PROBE_EXTRA_AZIMUTH_OFFSETS_DEGREES =
	Object.freeze([-31, 52]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function radians(degrees) {
	return degrees * Math.PI / 180;
}

function stripVersion(source) {
	return source.replace(/^#version\s+300\s+es\s*/u, '');
}

function normalizeAzimuthDegrees(degrees) {
	let result = degrees;
	while (result < -180) result += 360;
	while (result >= 180) result -= 360;
	return result;
}

function directionAt(azimuthDegrees, elevationDegrees) {
	const azimuth = radians(azimuthDegrees);
	const elevation = radians(elevationDegrees);
	const horizontal = Math.cos(elevation);
	return /** @type {UnitVector3} */ ([
		Math.sin(azimuth) * horizontal,
		Math.cos(azimuth) * horizontal,
		Math.sin(elevation),
	]);
}

/** Build a source-relative sky grid with dense coverage near the horizon. */
export function createSkyPathRadianceProbeGrid({sourceAzimuthDegrees}) {
	if (!Number.isFinite(sourceAzimuthDegrees)) {
		throw new TypeError('Sky spectral probe requires a finite source azimuth.');
	}
	const offsets = [
		...SKY_SPECTRAL_PROBE_REGULAR_AZIMUTH_OFFSETS_DEGREES,
		...SKY_SPECTRAL_PROBE_EXTRA_AZIMUTH_OFFSETS_DEGREES,
	].sort((left, right) => left - right);
	requireCondition(new Set(offsets).size === offsets.length,
		'Sky spectral azimuth offsets must be unique.');
	const probes = [];
	for (const elevationDegrees of SKY_SPECTRAL_PROBE_ELEVATIONS_DEGREES) {
		for (const sourceAzimuthOffsetDegrees of offsets) {
			const azimuthDegrees = normalizeAzimuthDegrees(
				sourceAzimuthDegrees + sourceAzimuthOffsetDegrees,
			);
			probes.push(Object.freeze({
				index: probes.length,
				id: `source-offset-${sourceAzimuthOffsetDegrees}-elevation-${elevationDegrees}`,
				sourceAzimuthOffsetDegrees,
				azimuthDegrees,
				elevationDegrees,
				directionModel: directionAt(azimuthDegrees, elevationDegrees),
			}));
		}
	}
	return Object.freeze(probes);
}

function createDirectionTexture(probes) {
	const values = new Float32Array(probes.length * 4);
	for (const probe of probes) {
		values.set(probe.directionModel, probe.index * 4);
		values[probe.index * 4 + 3] = 1;
	}
	const texture = new THREE.DataTexture(
		values,
		probes.length,
		1,
		THREE.RGBAFormat,
		THREE.FloatType,
	);
	texture.internalFormat = 'RGBA32F';
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.generateMipmaps = false;
	texture.needsUpdate = true;
	return texture;
}

function fixedInitialStateBlock() {
	return `ShaderState createInitialShaderState(vec2 uv) {
	ShaderState state;
	state.uv = uv;
	state.sceneDepth = 0.0;
	state.sceneHitMask = 0.0;
	state.ray = ViewRay(vec3(0.0), vec3(0.0, 0.0, 1.0));
	state.bounds = PathBounds(0.0, 0.0, 0.0, false, false, true);
	state.medium = MediumSample(zeroSpectral(), zeroSpectral(), zeroSpectral(), zeroSpectral());
	state.pathRadiance = zeroSpectral();
	state.celestialRadiance = zeroSpectral();
	state.preDisplayRadiance = zeroSpectral();
	state.transmittance = oneSpectral();
	state.sceneLinearSrgb = vec3(0.0);
	state.outputRgba = vec4(0.0, 0.0, 0.0, 1.0);
	return state;
}`;
}

function fixedRayBlock(probeCount) {
	return `ViewRay reconstructViewRay(vec2 textureCoordinates) {
	int probeIndex = clamp(
		int(floor(textureCoordinates.x * float(${probeCount}))),
		0,
		${probeCount - 1}
	);
	vec3 direction = normalize(texelFetch(
		${DIRECTION_UNIFORM_NAME},
		ivec2(probeIndex, 0),
		0
	).xyz);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`;
}

function outputContribution() {
	return createShaderContribution({
		id: 'diagnostic-sky-path-radiance-spectral-output',
		owner: 'color',
		provides: ['diagnostic.skyPathRadianceSpectralOutput'],
		requires: ['transport.evaluatePathRadiance'],
		textures: [createShaderTextureDescriptor(
			DIRECTION_UNIFORM_NAME,
			'sampler2D',
			DIRECTION_VALUE_KEY,
		)],
		uniforms: [createShaderUniformDescriptor(
			OUTPUT_CHANNEL_UNIFORM_NAME,
			'int',
			OUTPUT_CHANNEL_VALUE_KEY,
			0,
		)],
		mainHooks: [createShaderSourceBlock(
			'diagnostic-sky-path-radiance-spectral-main',
			'diagnosticOutput',
			1000,
			`outColor = vec4(state.pathRadiance.c[${OUTPUT_CHANNEL_UNIFORM_NAME}], 0.0, 0.0, 1.0);`,
		)],
	});
}

function createProbeAssembly(sourceAssembly, probeCount) {
	let initialStateReplacementCount = 0;
	let rayReplacementCount = 0;
	const contributions = sourceAssembly.contributions.map((contribution) => ({
		...contribution,
		functions: contribution.functions.map((block) => {
			if (block.id === 'runtime-initial-state') {
				initialStateReplacementCount += 1;
				return {...block, code: fixedInitialStateBlock()};
			}
			if (block.id === 'geometry-reconstruct-helper') {
				rayReplacementCount += 1;
				return {...block, code: fixedRayBlock(probeCount)};
			}
			return block;
		}),
	}));
	requireCondition(initialStateReplacementCount === 1,
		`Expected one runtime initial-state block; found ${initialStateReplacementCount}.`);
	requireCondition(rayReplacementCount === 1,
		`Expected one geometry ray block; found ${rayReplacementCount}.`);
	contributions.push(outputContribution());
	return new Algorithm32ShaderAssembler().assemble({
		descriptor: sourceAssembly.descriptor,
		contributions,
		mainRequiredSymbols: [
			...sourceAssembly.validationReport.requiredSymbols,
			'diagnostic.skyPathRadianceSpectralOutput',
		],
		systemProvidedSymbols: [],
	});
}

function createProbeUniforms(assembly, sourceRuntime, directionTexture) {
	const uniforms = {};
	for (const contribution of assembly.contributions) {
		for (const uniform of contribution.uniforms) {
			const value = uniform.valueKey === OUTPUT_CHANNEL_VALUE_KEY
				? 0
				: sourceRuntime.getUniformValue(uniform.name);
			uniforms[uniform.name] = {value: value ?? uniform.defaultValue ?? null};
		}
		for (const texture of contribution.textures) {
			const value = texture.valueKey === DIRECTION_VALUE_KEY
				? directionTexture
				: sourceRuntime.getUniformValue(texture.name);
			uniforms[texture.name] = {value: value ?? null};
		}
	}
	return uniforms;
}

/** Read diffuse atmospheric path radiance before celestial composition/Color. */
export async function readSkyPathRadianceSpectra({
	renderer,
	sourceAssembly,
	sourceRuntime,
	probes,
	spectralChannelCount,
}) {
	requireCondition(Array.isArray(probes) && probes.length > 0,
		'Sky spectral probe directions are required.');
	requireCondition(Number.isSafeInteger(spectralChannelCount)
		&& spectralChannelCount > 0,
		'Sky spectral channel count is invalid.');
	const directionTexture = createDirectionTexture(probes);
	const assembly = createProbeAssembly(sourceAssembly, probes.length);
	const uniforms = createProbeUniforms(assembly, sourceRuntime, directionTexture);
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3 ?? '300 es',
		vertexShader: FULLSCREEN_VERTEX_SHADER,
		fragmentShader: stripVersion(assembly.fragmentShaderSource),
		uniforms,
		depthTest: false,
		depthWrite: false,
		blending: THREE.NoBlending,
	});
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', new THREE.BufferAttribute(
		new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
		3,
	));
	const scene = new THREE.Scene();
	const mesh = new THREE.Mesh(geometry, material);
	mesh.frustumCulled = false;
	scene.add(mesh);
	const camera = new THREE.Camera();
	const target = new THREE.WebGLRenderTarget(probes.length, 1, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.internalFormat = 'RGBA32F';
	const previousTarget = renderer.getRenderTarget();
	const spectra = Array.from(
		{length: probes.length},
		() => new Float32Array(spectralChannelCount),
	);
	try {
		if (typeof renderer.compileAsync === 'function') {
			await renderer.compileAsync(scene, camera);
		} else {
			renderer.compile(scene, camera);
		}
		const pixels = new Float32Array(probes.length * 4);
		for (let channelIndex = 0;
			channelIndex < spectralChannelCount;
			channelIndex += 1) {
			uniforms[OUTPUT_CHANNEL_UNIFORM_NAME].value = channelIndex;
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			renderer.readRenderTargetPixels(
				target,
				0,
				0,
				probes.length,
				1,
				pixels,
			);
			for (let probeIndex = 0;
				probeIndex < probes.length;
				probeIndex += 1) {
				spectra[probeIndex][channelIndex] = pixels[probeIndex * 4];
			}
		}
	} finally {
		renderer.setRenderTarget(previousTarget);
		target.dispose();
		geometry.dispose();
		material.dispose();
		directionTexture.dispose();
	}
	return {
		spectra: spectra.map((values) => Array.from(values)),
		probeAssemblySourceHash: assembly.sourceHash,
	};
}

