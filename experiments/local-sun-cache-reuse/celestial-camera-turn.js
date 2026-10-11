import * as THREE from 'three';

/** Orient an owned capture camera without changing its physical lighting state.
 * @param {LocalSunShellPublishedFrame} frame - Prepared Sun-facing frame, with its own camera and generation.
 * @param {number} [elevationDegrees] - Optional target elevation above the horizon; omission retains the original pitch.
 * @param {number} [yawDegrees] - Azimuth relative to the prepared Sun-facing view; 0 retains that azimuth, 180 faces away.
 * @returns {LocalSunCelestialCameraTurn} - Original orientation for restoration and verified turned-view facts.
 */
export function orientCaptureCamera(frame, elevationDegrees, yawDegrees = 180) {
	if (!frame.celestial) throw new Error('Camera turn requires a celestial frame.');
	if (yawDegrees !== 0 && yawDegrees !== 180) throw new Error('Capture yaw must be 0 or 180 degrees.');
	if (elevationDegrees !== undefined && (!Number.isFinite(elevationDegrees) || elevationDegrees < 0 || elevationDegrees >= 90))
		throw new Error('Target camera elevation must be finite and in [0, 90) degrees.');
	const camera = frame.celestial.camera,
		restoreQuaternion = camera.quaternion.clone(),
		position = camera.position.clone(),
		cache = frame.cache,
		before = camera.getWorldDirection(new THREE.Vector3());
	camera.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(yawDegrees)));
	const expected = new THREE.Vector3((yawDegrees === 180 ? -1 : 1)*before.x, before.y, (yawDegrees === 180 ? -1 : 1)*before.z);
	if (elevationDegrees !== undefined) {
		const elevation = THREE.MathUtils.degToRad(elevationDegrees), horizontal = Math.hypot(expected.x, expected.z);
		if (!(horizontal > 0)) throw new Error('Camera azimuth is undefined at the zenith.');
		expected.set(expected.x / horizontal * Math.cos(elevation), Math.sin(elevation), expected.z / horizontal * Math.cos(elevation));
		camera.lookAt(camera.position.clone().add(expected));
	}
	camera.updateMatrixWorld();
	frame.celestial.render();
	const after = camera.getWorldDirection(new THREE.Vector3()),
		material = /** @type {THREE.RawShaderMaterial} */ (
			/** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */ (frame.viewPass).material
		),
		center = material.uniforms.uSunScreenCenterPixels.value,
		sunCenter = Array.isArray(center) ? center : [center.x, center.y],
		sunDirection = new THREE.Vector3(frame.directionToSource[0], frame.directionToSource[2], -frame.directionToSource[1]);
	const sunBehindCamera = after.dot(sunDirection) < 0;
	if (after.distanceTo(expected) > 1e-10 || !position.equals(camera.position) || frame.cache !== cache ||
		(yawDegrees === 180 && (!sunBehindCamera || sunCenter[0] !== -1000000 || sunCenter[1] !== -1000000)) ||
		(yawDegrees === 0 && sunBehindCamera))
		throw new Error('Camera-only azimuth/elevation verification failed.');
	return {restoreQuaternion, proof: {
		yawDegrees, beforeDirection: before.toArray(), afterDirection: after.toArray(),
		positionUnchanged: true, pitchUnchanged: elevationDegrees === undefined, atmosphericCacheUnchanged: true,
		elevationDegrees: THREE.MathUtils.radToDeg(Math.asin(after.y)), elevationVerified: true,
		sunBehindCamera, sunScreenCenterPixels: [...sunCenter],
	}};
}
