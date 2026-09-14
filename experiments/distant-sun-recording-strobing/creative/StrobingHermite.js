/** Shape-preserving interpolation of uniformly spaced physical measurements. */
export class StrobingHermite {
	/** @param {number} a @param {number} b @returns {number} */
	static slope(a, b) {
		return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
	}
	/** @param {number} a @param {number} b @param {number} c @param {number} d @param {number} t @returns {number} */
	static value(a, b, c, d, t) {
		const t2 = t * t,
			t3 = t2 * t;
		return (
			(2 * t3 - 3 * t2 + 1) * b +
			(t3 - 2 * t2 + t) * this.slope(b - a, c - b) +
			(-2 * t3 + 3 * t2) * c +
			(t3 - t2) * this.slope(c - b, d - c)
		);
	}
}
