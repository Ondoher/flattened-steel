/** Dot product without production geometry helpers.
 * @param {SkyVector3} a - First vector.
 * @param {SkyVector3} b - Second vector.
 * @returns {number} Scalar dot product.
 */
export function volumeDot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Evaluate a physical ray point.
 * @param {SkyVector3} origin - Origin in metres.
 * @param {SkyVector3} direction - Unit direction.
 * @param {number} distance - Distance in metres.
 * @returns {SkyVector3} Physical position in metres.
 */
export function volumePoint(origin, direction, distance) {
	return [
		origin[0] + distance * direction[0],
		origin[1] + distance * direction[1],
		origin[2] + distance * direction[2],
	];
}

/** Stable quadratic roots including a repeated contact.
 * @param {number} a - Quadratic coefficient.
 * @param {number} b - Half the linear coefficient.
 * @param {number} c - Constant coefficient.
 * @returns {number[]} Increasing real roots; empty for no intersection.
 */
function roots(a, b, c) {
	if (a === 0) return b === 0 ? [] : [-c / (2 * b)];
	const discriminant = b * b - a * c;
	if (discriminant < 0) return [];
	const root = Math.sqrt(discriminant),
		q = -b - (b >= 0 ? root : -root);
	return q === 0 ? [0] : [q / a, c / q].sort((left, right) => left - right);
}

/** Forward exit from the enclosing top sphere using a stable outward root.
 * @param {SkyVector3} origin - Inside-or-on atmosphere position, in metres.
 * @param {SkyVector3} direction - Unit direction.
 * @param {number} radius - Top radius in metres.
 * @returns {number} Nonnegative atmosphere-exit distance in metres.
 */
export function volumeSphereExit(origin, direction, radius) {
	const r = Math.hypot(...origin),
		projection = volumeDot(origin, direction);
	const delta = (radius - r) * (radius + r),
		root = Math.sqrt(Math.max(0, projection * projection + delta));
	return projection >= 0
		? root + projection === 0
			? 0
			: Math.max(0, delta / (root + projection))
		: root - projection;
}

/** Direct-source visibility for the +Z collimated source.
 * @param {number} bottomRadius - Opaque ground radius in metres.
 * @param {SkyVector3} point - Scattering position in metres.
 * @returns {boolean} True outside the open shadow cylinder or on its tangent boundary.
 */
export function volumeSourceVisible(bottomRadius, point) {
	return point[2] >= 0 || Math.hypot(point[0], point[1]) >= bottomRadius;
}

/** Resolve first contact and split closest approach, terminator and shadow cylinder.
 * Surface-inward rays are excluded: the existing exact-ground inward-zero
 * recurrence convention is not silently replaced by a positive-height limit.
 * @param {SkyTransportSpec} spec - Validated physical sphere radii.
 * @param {SkyVector3} origin - In-atmosphere physical position in metres.
 * @param {SkyVector3} direction - Unit look direction.
 * @returns {SkyVolumeGeometry} Finite terminated geometry with smooth open segments.
 */
export function resolveVolumeGeometry(spec, origin, direction) {
	const bottom = spec.planet.bottomRadiusMeters,
		top = spec.planet.topRadiusMeters;
	if (
		origin.length !== 3 ||
		direction.length !== 3 ||
		[...origin, ...direction].some((value) => !Number.isFinite(value)) ||
		Math.abs(Math.hypot(...direction) - 1) > 1e-12
	)
		throw new RangeError('Volume reference requires finite triples and a unit direction.');
	const radius = Math.hypot(...origin),
		projection = volumeDot(origin, direction);
	if (radius < bottom - 1e-6 || radius > top + 1e-6)
		throw new RangeError('Volume reference origin must lie in the atmosphere.');
	const surface = Math.abs(radius - bottom) <= 1e-6;
	if (surface && projection < -1e-6)
		throw new RangeError('Exact-ground inward rays retain the separate recurrence boundary convention.');
	const groundRoots = surface ? [] : roots(1, projection, (radius - bottom) * (radius + bottom));
	const ground = groundRoots.find((value) => value >= 0) ?? Infinity;
	const exit = volumeSphereExit(origin, direction, top),
		lengthMeters = Math.min(ground, exit);
	if (!Number.isFinite(lengthMeters) || lengthMeters < 0) throw new RangeError('Invalid volume ray extent.');
	/** @type {SkyVolumeBoundary} */ const boundary = ground <= exit ? 'ground' : 'top';
	/** @type {SkyVolumeBranch} */ const branch = surface
		? 'surface-outward'
		: projection >= 0
			? 'volume-outward'
			: boundary === 'ground'
				? 'volume-ground'
				: 'volume-escaping';
	const candidates = [0, lengthMeters, -projection];
	if (direction[2] !== 0) candidates.push(-origin[2] / direction[2]);
	const radial = Math.hypot(origin[0], origin[1]);
	candidates.push(
		...roots(
			direction[0] ** 2 + direction[1] ** 2,
			origin[0] * direction[0] + origin[1] * direction[1],
			(radial - bottom) * (radial + bottom),
		),
	);
	const breaks = [
		...new Set(candidates.filter((value) => Number.isFinite(value) && value >= 0 && value <= lengthMeters)),
	].sort((a, b) => a - b);
	/** @type {SkyVolumeSegment[]} */ const segments = [];
	for (let i = 1; i < breaks.length; i++) {
		const startMeters = breaks[i - 1],
			endMeters = breaks[i];
		if (endMeters > startMeters)
			segments.push({
				startMeters,
				endMeters,
				sourceVisible: volumeSourceVisible(
					bottom,
					volumePoint(origin, direction, (startMeters + endMeters) / 2),
				),
			});
	}
	return {
		origin: [...origin],
		direction: [...direction],
		lengthMeters,
		endpoint: volumePoint(origin, direction, lengthMeters),
		boundary,
		branch,
		segments,
	};
}

/** Map a monotone-radius branch through sqrt(radius - branch-minimum radius).
 * The absolute Jacobian stays finite at closest approach; inward segments are
 * integrated in reverse ray order with a positive path measure.
 * @param {SkyVolumeGeometry} geometry - Independently split physical ray.
 * @param {SkyVolumeSegment} segment - One monotone-radius interval.
 * @returns {SkyVolumeMap} Independent altitude map and coordinate extent.
 */
export function volumeAltitudeMap(geometry, segment) {
	const projection = volumeDot(geometry.origin, geometry.direction);
	const outward = projection + (segment.startMeters + segment.endMeters) / 2 >= 0;
	const lowDistance = outward ? segment.startMeters : segment.endMeters,
		sign = outward ? 1 : -1;
	const radius = Math.hypot(...volumePoint(geometry.origin, geometry.direction, lowDistance));
	const radialProjection = Math.abs(projection + lowDistance),
		length = segment.endMeters - segment.startMeters;
	const radialIncrement = length * (2 * radialProjection + length);
	const endHeight = radialIncrement / (Math.sqrt(radius * radius + radialIncrement) + radius);
	return {
		endCoordinate: Math.sqrt(Math.max(0, endHeight)),
		evaluate: (coordinate) => {
			const height = coordinate * coordinate,
				delta = height * (2 * radius + height);
			const root = Math.sqrt(radialProjection * radialProjection + delta);
			const distance = root + radialProjection === 0 ? 0 : delta / (root + radialProjection);
			return {
				distance: lowDistance + sign * distance,
				jacobian: root === 0 ? Math.sqrt(2 * radius) : (2 * coordinate * (radius + height)) / root,
			};
		},
	};
}
