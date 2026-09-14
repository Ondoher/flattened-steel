/** Resolve a named numerical work profile before physical reference execution.
 * Increasing a work allowance does not change tolerances or numerical admission.
 * @param {SkyPhysicalReferenceProfile} [profile='standard'] - Explicit bounded work profile.
 * @returns {SkyPhysicalReferencePolicy} Readonly policy suitable for pre-compute provenance.
 */
export function physicalReferencePolicy(profile = 'standard') {
	if (!['standard', 'simpson-expanded-medium'].includes(profile))
		throw new RangeError('Unknown physical reference work profile.');
	return {
		profile,
		maximumMediumEvaluations: {
			gauss: 262144,
			simpson: profile === 'simpson-expanded-medium' ? 1048576 : 262144,
		},
		maximumOuterEvaluations: 2048,
		maximumColumnEvaluations: 4096,
		tolerancePolicy:
			'All caps are shared across the two passes of one physical ray/method, except the per-column cap. Coarse/fine tolerance scales remain 4/1. Column optical-depth comparison is 1e-9+1e-8*abs(tau), scaled by the pass. Fine outer radiance tolerance t(L)=1e-9+1e-6*abs(L) W. Admission requires local convergence, pass difference<=4*t(coarse)+t(fine), fine outer remainder<=t(fine), independent method difference<=t(gauss)+t(simpson), and finite nonnegative inner allowance. No admission gate changes with profile.',
	};
}
