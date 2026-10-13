import * as THREE from 'three';

/** Call this function to resolve renderer view facts without projecting into physical coordinates.
 *
 * @param {THREE.PerspectiveCamera} camera - Current ordinary camera.
 * @returns {Flat32LocalFrameViewRequest} - Symmetric perspective cone and scene origin/direction.
 */
export function resolveLocalSunFrameView(camera) {
	if (camera.view?.enabled || camera.filmOffset !== 0)
		throw new RangeError('Compact ordinary view requires a symmetric perspective camera.');
	const tangent = Math.tan((camera.getEffectiveFOV() * Math.PI) / 360);
	if (!Number.isFinite(tangent) || tangent <= 0 || !Number.isFinite(camera.aspect) || camera.aspect <= 0)
		throw new RangeError('Finite ordinary perspective field required.');
	camera.updateWorldMatrix(true, false);
	const position = camera.getWorldPosition(new THREE.Vector3()),
		direction = camera.getWorldDirection(new THREE.Vector3());
	return {
		cameraPosition: {coordinates: [position.x, position.y, position.z], units: 'scene-units'},
		cameraDirection: [direction.x, direction.y, direction.z],
		halfAngle: {value: Math.atan(Math.hypot(tangent, tangent * camera.aspect)), units: 'radians'},
	};
}
