/** Owns the qualified distant-Sun construction and outgoing-coordinate policies.
 * H61/H63's retained equations and scope are documented in the production
 * sky-accuracy-promotion plan. Incoming integration and physical optics are unchanged.
 */
export const DistantSunScatteringAccuracy = Object.freeze({
	/** Accept an explicit executable accuracy selection at configuration ingress.
	 * @param {unknown} [value] - Omission retains the deployed legacy policy.
	 * @returns {DistantSunScatteringAccuracyMethod} - Accepted method.
	 * @throws {RangeError} - Unsupported selections must be rejected by the caller.
	 */
	accept(value = 'legacy') {
		if (value !== 'legacy' && value !== 'corrected60' && value !== 'corrected60-sun035')
			throw new RangeError('Unsupported distant-Sun scattering accuracy selection.');
		return value;
	},
	/** Resolve the outgoing half-angle scale for an accepted selection.
	 * @param {DistantSunScatteringAccuracyMethod} method - Accepted method.
	 * @returns {number} - Dimensionless scale; one retains the ordinary grid.
	 */
	focus(method) {
		return method === 'corrected60-sun035' ? 0.35 : 1;
	},
	/** Resolve construction intervals without changing the legacy caller's control.
	 * @param {DistantSunScatteringAccuracyMethod} method - Accepted method.
	 * @param {number} legacyIntervals - Existing profile's interval count.
	 * @returns {number} - Construction intervals per path segment.
	 */
	transportIntervals(method, legacyIntervals) {
		return method === 'legacy' ? legacyIntervals : 60;
	},
	/** Map an accepted unit direction about the row's unit Sun axis.
	 * The H61 half-angle map is tan(physical/2)=scale*tan(grid/2).
	 * @param {UnitVector3} direction - Grid direction, or physical direction for the inverse.
	 * @param {UnitVector3} sun - Sun axis expressed in the same frame as the direction.
	 * @param {DistantSunScatteringAccuracyMethod} method - Accepted method.
	 * @param {boolean} [inverse=false] - Resolve a physical query into grid coordinates.
	 * @returns {UnitVector3} - Mapped unit direction, including finite Sun and anti-Sun limits.
	 */
	map(direction, sun, method, inverse = false) {
		const focus = this.focus(method);
		if (focus === 1) return [direction[0], direction[1], direction[2]];
		const scale = inverse ? 1 / focus : focus;
		const cosine = direction[0] * sun[0] + direction[1] * sun[1] + direction[2] * sun[2];
		const denominator = 1 + scale * scale + (1 - scale * scale) * cosine;
		const axial = 1 - scale * scale + (scale - 1) ** 2 * cosine;
		/** @type {UnitVector3} */
		const mapped = [
			(2 * scale * direction[0] + axial * sun[0]) / denominator,
			(2 * scale * direction[1] + axial * sun[1]) / denominator,
			(2 * scale * direction[2] + axial * sun[2]) / denominator,
		];
		const length = Math.hypot(...mapped);
		return [mapped[0] / length, mapped[1] / length, mapped[2] / length];
	},
	/** Emit the same H61 map for construction and runtime shader consumers.
	 * @returns {string} - GLSL; the caller supplies the row axis and forward or reciprocal scale.
	 */
	createShaderSource() {
		return `vec3 distantSunOutgoingMap(vec3 direction, vec3 sun, float scale) {
	if (scale == 1.0) return direction;
	float cosine = dot(direction, sun);
	float denominator = 1.0 + scale * scale + (1.0 - scale * scale) * cosine;
	return normalize((2.0 * scale * direction
		+ (1.0 - scale * scale + (scale - 1.0) * (scale - 1.0) * cosine) * sun) / denominator);
}`;
	},
	/** Emit inverse lookup for the production receiver-local solar domain.
	 * @param {DistantSunScatteringAccuracyMethod} method - Accepted method.
	 * @param {SolarZenithDomain} domain - Executable solar row geometry supplied by the cache owner.
	 * @returns {string} - GLSL mapping each solar row before its cubed-sphere lookup.
	 */
	createLookupShaderSource(method, domain) {
		return `${this.createShaderSource()}
vec3 distantSceneDirectionCoordinate(vec3 direction);
vec3 distantSunRowCoordinate(vec3 direction, int row) {
	float theta = (float(row) + ${(domain.firstCenter.value / domain.spacing.value).toExponential(17)}) * ${domain.spacing.value.toExponential(17)};
	vec3 sun = vec3(sin(theta), 0.0, cos(theta));
	return distantSceneDirectionCoordinate(distantSunOutgoingMap(direction, sun, ${(1 / this.focus(method)).toExponential(17)}));
}`;
	},
});
