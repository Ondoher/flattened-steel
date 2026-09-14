/** Versioned numerical-policy ingress for both production compiler coordinate systems. */
export const DistantSunSceneCacheNumerics = {
	/** Create the undisplaced logical-surface policy with anchored radial heights.
	 * @returns {DistantSunSceneCacheNumericalPolicy} - Explicit revision-two geometry policy.
	 */
	createAnchoredRadial() {
		return this.accept({
			id: 'algorithm32-anchored-radial-surface-v2',
			revision: 2,
			rootMethod: 'stable-factored',
			positionMethod: 'anchored-radial',
			surfaceLimit: {value: 0, units: 'meters'},
			surfaceTolerance: {value: 0, units: 'meters'},
			positiveRootTolerance: {value: 0.001, units: 'meters'},
		});
	},
	/** Create an explicit stable-root surface-limit candidate.
	 * @param {number} [surfaceLimitMeters] - One-sided logical ground evaluation height in metres.
	 * @returns {DistantSunSceneCacheNumericalPolicy} - Complete executable candidate policy.
	 * @throws {RangeError} - When the surface height is outside the registered candidate range.
	 */
	createSurfaceLimit(surfaceLimitMeters = 4) {
		return this.accept({
			id: `algorithm32-stable-sphere-surface-${surfaceLimitMeters}m-v1`,
			revision: 1,
			rootMethod: 'stable-factored',
			surfaceLimit: {value: surfaceLimitMeters, units: 'meters'},
			surfaceTolerance: {value: 1, units: 'meters'},
			positiveRootTolerance: {value: 0.001, units: 'meters'},
		});
	},

	/** Validate a serialized candidate at compiler ingress; omission retains the historical equations.
	 * @param {DistantSunSceneCacheNumericalPolicy | undefined} policy - Explicit candidate or legacy omission.
	 * @returns {DistantSunSceneCacheNumericalPolicy | undefined} - Independent accepted values.
	 * @throws {TypeError} - For an incomplete or unsupported policy shape.
	 * @throws {RangeError} - For unsupported numerical parameters.
	 */
	accept(policy) {
		if (policy === undefined) return undefined;
		const anchored = policy?.revision === 2;
		const keys = anchored
			? 'id,positionMethod,positiveRootTolerance,revision,rootMethod,surfaceLimit,surfaceTolerance'
			: 'id,positiveRootTolerance,revision,rootMethod,surfaceLimit,surfaceTolerance';
		if (
			!policy ||
			typeof policy !== 'object' ||
			Array.isArray(policy) ||
			Object.keys(policy).sort().join(',') !== keys ||
			typeof policy.id !== 'string' ||
			policy.id.length === 0 ||
			![1, 2].includes(policy.revision) ||
			(anchored && policy.positionMethod !== 'anchored-radial') ||
			policy.rootMethod !== 'stable-factored'
		) {
			throw new TypeError('Unsupported scene-cache numerical policy.');
		}
		for (const quantity of [policy.surfaceLimit, policy.surfaceTolerance, policy.positiveRootTolerance]) {
			if (
				!quantity ||
				Object.keys(quantity).sort().join(',') !== 'units,value' ||
				quantity.units !== 'meters' ||
				!Number.isFinite(quantity.value)
			) {
				throw new TypeError('Scene-cache numerical lengths require finite metre values.');
			}
		}
		if (
			(anchored
				? policy.surfaceLimit.value !== 0 || policy.surfaceTolerance.value !== 0
				: ![2, 4, 8].includes(policy.surfaceLimit.value) || policy.surfaceTolerance.value !== 1) ||
			policy.positiveRootTolerance.value !== 0.001
		) {
			throw new RangeError('Scene-cache numerical parameters are outside the registered surface candidates.');
		}
		return structuredClone(policy);
	},
};
