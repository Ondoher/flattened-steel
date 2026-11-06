/**
 * Fixed shallow-cap geometry in physical meters, independent of any cache.
 */
export const diskRadius = Math.PI * 6371.0088 * 1000;

/**
 * Selected initial atmosphere apex in meters.
 */
export const apex = 100000;

/**
 * Supporting-sphere center height, below the ground plane.
 */
export const centerZ = (apex * apex - diskRadius * diskRadius) / (2 * apex);

/**
 * Supporting-sphere radius in meters.
 */
export const sphereRadius = apex - centerZ;

/**
 * Evaluates cap height without subtracting world-scale sphere heights.
 *
 * @param {number} radius - Horizontal map radius in meters.
 * @returns {number} - Cap height, or a negative value outside the disk.
 */
export function capHeight(radius) {
	if (radius > diskRadius) {
		return -Infinity;
	}
	return ((diskRadius - radius) * (diskRadius + radius)) / (Math.sqrt(sphereRadius * sphereRadius - radius * radius) - centerZ);
}

/**
 * Calculates stable signed clearance to the supporting sphere for cap-interior points.
 * Outside points require separate finite-cap classification.
 *
 * @param {readonly number[]} point - World-space point in meters.
 * @returns {number} - Positive interior clearance in meters, zero at the cap.
 */
export function clearance(point) {
	const r = Math.hypot(point[0], point[1]);
	const z = point[2];
	const numerator = (diskRadius - r) * (diskRadius + r) - z * (z - 2 * centerZ);
	return numerator / (sphereRadius + Math.hypot(r, z - centerZ));
}

/**
 * Recovers map radius from altitude and sample-to-dome distance.
 *
 * @param {number} altitude - Altitude in meters.
 * @param {number} distance - Nonnegative shortest distance to the curved cap.
 * @returns {number} - Horizontal radius in meters.
 */
export function radiusAt(altitude, distance) {
	const first = apex - altitude - distance;
	const second = sphereRadius + altitude - centerZ - distance;
	if (first < -1e-8 || altitude < 0 || distance < 0) {
		throw new RangeError('Coordinate outside the atmospheric cap.');
	}
	return Math.sqrt(Math.max(0, first) * second);
}

/**
 * Resolves the atmosphere interval along a normalized ray, including outside origins.
 *
 * @param {readonly number[]} origin - World-space origin in meters.
 * @param {readonly number[]} direction - Unit propagation direction.
 * @returns {DomeInterval} - Entry/exit distances and finite-disk ground contact.
 */
export function interval(origin, direction) {
	const [x, y, z] = origin;
	const [vx, vy, vz] = direction;
	const a = vx * vx + vy * vy + vz * vz;
	const b = x * vx + y * vy + (z - centerZ) * vz;
	const r = Math.hypot(x, y);
	const c = (r - diskRadius) * (r + diskRadius) + z * (z - 2 * centerZ);
	const discriminant = b * b - a * c;
	if (discriminant < 0) {
		return {entry: 0, exit: 0, ground: false};
	}
	const root = Math.sqrt(discriminant);
	const q = -b - (b < 0 ? -root : root);
	let first = q === 0 ? 0 : q / a;
	let second = q === 0 ? 0 : c / q;
	if (first > second) {
		[first, second] = [second, first];
	}
	let entry = Math.max(0, first);
	let exit = second;
	let ground = false;
	if (vz < 0) {
		const hit = -z / vz;
		const gx = x + vx * hit;
		const gy = y + vy * hit;
		if (hit >= 0 && Math.hypot(gx, gy) <= diskRadius + 1e-7 && hit <= exit) {
			exit = hit;
			ground = true;
		}
	} else if (vz > 0) {
		entry = Math.max(entry, -z / vz);
	} else if (z < 0) {
		return {entry: 0, exit: 0, ground: false};
	}
	if (exit < entry || exit < 0) {
		return {entry: 0, exit: 0, ground: false};
	}
	return {entry, exit: Math.max(entry, exit), ground};
}
