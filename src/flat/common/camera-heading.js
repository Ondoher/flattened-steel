/**
 * Call this function to project a scene camera's quaternion onto clockwise azimuth from north.
 * Scene axes are east/right, up and south/back; at the zenith or nadir the camera's right axis retains yaw.
 *
 * @param {SceneCameraOrientation} orientation - Accepted unit quaternion in scene coordinates.
 * @returns {number} - Heading in degrees within [0, 360).
 */
export function getCameraHeading(orientation) {
	let [x, y, z, w] = orientation;
	let east = -2 * (x * z + w * y);
	let north = 1 - 2 * (x * x + y * y);
	let radians = Math.atan2(east, north);
	if (Math.hypot(east, north) < 1e-10) {
		radians = Math.atan2(2 * (x * z - w * y), 1 - 2 * (y * y + z * z));
	}
	return ((radians * 180) / Math.PI + 360) % 360;
}
