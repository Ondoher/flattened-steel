import * as THREE from 'three';

/**
 * Actual rasterized ground mesh with an analytically clipped circular boundary.
 * Capture writes physical distance, hit and spectral material identity together.
 */
export class FiniteGroundObject extends THREE.Mesh {
	/**
	 * Constructs a covering plane in the observer-local frame with one shared mask.
	 *
	 * @param {DomeSceneRequest} request - Frozen disk and shader definition.
	 * @param {DomeThreeUniforms} uniforms - Actual camera, origin and viewport.
	 */
	constructor(request, uniforms) {
		const geometry = new THREE.PlaneGeometry(2 * request.diskRadius, 2 * request.diskRadius);
		geometry.rotateX(-Math.PI / 2);
		const material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader: request.shaders.groundVertex.replace(/^#version[^\n]*\n/, ''),
			fragmentShader: request.shaders.ground.replace(/^#version[^\n]*\n/, ''),
			uniforms,
			side: THREE.DoubleSide,
			depthTest: false,
			depthWrite: false,
		});
		super(geometry, material);
		this.captureMaterial = material;
		this.position.x = -request.origin[0];
		this.name = 'finite-disk-ground';
		this.frustumCulled = false;
		this.userData.spectralMaterialId = 1;
	}

	/**
	 * Releases only this object's geometry/material, never the completed cache.
	 *
	 * @returns {void} - Releases ground resources.
	 */
	dispose() {
		this.geometry.dispose();
		this.captureMaterial.dispose();
	}
}
