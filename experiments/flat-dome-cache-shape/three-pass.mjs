import * as THREE from 'three';
import {ShaderRuntimePass} from 'dome-runtime-pass';

/**
 * Creates the unchanged production fullscreen runtime with experiment uniforms.
 *
 * @param {string} source - Complete GLSL3 fragment shader.
 * @param {DomeThreeUniforms} uniforms - Explicit live bindings.
 * @param {number} width - Target pixel width.
 * @param {number} height - Target pixel height.
 * @returns {ShaderRuntimePass} - Production runtime owning its material and quad.
 */
export function createPass(source, uniforms, width, height) {
	let fingerprint = 2166136261;
	for (let i = 0; i < source.length; i++) {
		fingerprint = Math.imul(fingerprint ^ source.charCodeAt(i), 16777619);
	}
	return new ShaderRuntimePass({
		THREE,
		uniforms,
		fragmentShaderSource: source,
		sourceHash: 'fnv1a32:' + (fingerprint >>> 0).toString(16),
		viewportSize: {width, height, units: 'pixels'},
		logger: null,
	});
}

/**
 * Allocates a Three-owned nearest-filtered FP32 target with physical values.
 *
 * @param {number} width - Texture width.
 * @param {number} height - Texture height.
 * @param {number} [count] - Number of color attachments.
 * @returns {DomeThreeTarget} - Owned render target.
 */
export function floatTarget(width, height, count = 1) {
	const target = new THREE.WebGLRenderTarget(width, height, {
		type: THREE.FloatType,
		format: THREE.RGBAFormat,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
		count,
	});
	for (const texture of target.textures) {
		texture.internalFormat = 'RGBA32F';
		texture.colorSpace = THREE.NoColorSpace;
		texture.generateMipmaps = false;
	}
	return target;
}

/**
 * Uploads explicit physical data without color or orientation transformations.
 *
 * @param {number[]} values - RGBA-packed scalar values.
 * @param {number} width - Width.
 * @param {number} height - Height.
 * @returns {DomeThreeTexture} - Owned data texture.
 */
export function dataTexture(values, width, height) {
	const texture = new THREE.DataTexture(new Float32Array(values), width, height, THREE.RGBAFormat, THREE.FloatType);
	texture.colorSpace = THREE.NoColorSpace;
	texture.needsUpdate = true;
	return texture;
}

/**
 * Fails on actual GL/runtime errors instead of retaining an old framebuffer.
 *
 * @param {DomeThreeRenderer} renderer - Actual renderer.
 * @param {ShaderRuntimePass} pass - Runtime pass.
 * @returns {void} - Throws on a failed draw.
 */
export function checkDraw(renderer, pass) {
	const gl = renderer.getContext();
	gl.finish();
	const diagnostics = pass.getDiagnostics();
	if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR || diagnostics.renderErrorCount > 0) {
		throw new Error('Three draw failed: ' + JSON.stringify(diagnostics));
	}
}
