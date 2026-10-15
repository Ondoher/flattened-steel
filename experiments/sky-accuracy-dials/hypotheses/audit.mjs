import assert from 'node:assert/strict';
import {identity, readRepository} from '../io/files.mjs';
import {miePhase, gaussRule} from '../horizon/diagnosis-transport.mjs';

const upstream =
	'references/downloads/bruneton-clear-sky-models-4df2ec6609bc-full/clear-sky-models-4df2ec6609bc0127a478bd34fff29c94352579cc/';
const lr = 'references/downloads/libradtran-2.0.1/libRadtran-2.0.1/src/';

/** Legendre polynomial recurrence independent of the archived C++ implementation.
 * @param {number} k @param {number} mu @returns {number}
 */
function legendre(k, mu) {
	let p = 1,
		previous = 0;
	for (let n = 1; n <= k; n++) {
		const old = p;
		p = ((2 * n - 1) * mu * p - (n - 1) * previous) / n;
		previous = old;
	}
	return p;
}

/** Audit pinned source and independently quantify its normalized phase representation.
 * This is a formulation contrast, not a newly executed libRadtran solution.
 * @param {SmallRayInputs} inputs @param {DialFileIdentity[]} parents
 * @returns {HypothesisAuditResult}
 */
export function auditReference(inputs, parents) {
	const paths = [
		upstream + 'atmosphere/model/libradtran/libradtran.cc',
		upstream + 'atmosphere/atmosphere.cc',
		upstream + 'atmosphere/atmosphere.h',
		lr + 'aerosol.c',
		lr + 'ancillary.c',
		'references/downloads/libradtran-2.0.1/BUILD-PROVENANCE.md',
		'scripts/experiments/b1-directional-sky-radiance/external-reference/b1_reference_driver.cc',
	];
	const sources = paths.map((path) => identity(path));
	parents.push(...sources);
	const texts = sources.map((source) => readRepository(source.path, source).toString());
	assert.ok(texts[0].includes('constexpr int kNumMoments = 20;') && texts[0].includes('sum / (2.0 * kNumSamples)'));
	assert.ok(texts[4].includes('mom_s[CAOTH_AER][0] = bsca_s[CAOTH_AER] * momk / mom0_s[CAOTH_AER]'));
	const g = inputs.medium.g;
	// Reproduce the adapter's explicit [0,1] midpoint formula; libRadtran divides by moment zero.
	const raw = Array.from({length: 20}, (_, k) => {
		let sum = 0;
		for (let i = 0; i < 1000; i++) {
			const mu = (i + 0.5) / 1000;
			sum += legendre(k, mu) * miePhase(mu, g);
		}
		return sum / 2000;
	});
	const moments = raw.map((value) => value / raw[0]);
	const rule = gaussRule(256);
	const fullSphereMoments = Array.from({length: 20}, (_, k) =>
		rule.nodes.reduce(
			(sum, t, i) => sum + 4 * Math.PI * rule.weights[i] * legendre(k, 2 * t - 1) * miePhase(2 * t - 1, g),
			0,
		),
	);
	const normalization = fullSphereMoments[0];
	assert.ok(Math.abs(normalization - 1) < 1e-11);
	const forwardMass = 4 * Math.PI * raw[0];
	const prediction = {
		registeredBeforeContrast: true,
		mechanism: 'Forward-only aerosol moments, then moment-zero normalization and 20-term truncation.',
		expected:
			'Near-forward phase generally rises after forward-hemisphere renormalization; truncation adds angle-dependent ringing. Test each exact cosine, including off-Sun controls.',
		limit: 'P1 consequence only; no claim that this explains all-order or retained output without an exact input/executable replay.',
	};
	const phaseRows = inputs.rays.map((ray) => {
		const mu = ray.direction[2],
			continuous = miePhase(mu, g);
		const represented = moments.reduce((sum, b, k) => sum + (2 * k + 1) * b * legendre(k, mu), 0) / (4 * Math.PI);
		return {
			ray: ray.id,
			cosine: mu,
			continuousPerSr: continuous,
			adapter20PerSr: represented,
			ratio: represented / continuous,
		};
	});
	/** @type {HypothesisAuditEntry[]} */ const ledger = [
		{
			field: 'Aerosol phase equation / g / SSA',
			status: 'match',
			detail: 'Both source definitions use Cornette-Shanks g=0.7 and SSA=0.8; g is the shape parameter, not an independently matched first moment.',
			sources: sources.slice(0, 3),
		},
		{
			field: 'Aerosol phase numerical representation',
			status: 'difference',
			detail: 'Adapter integrates Legendre moments on mu in [0,1], 1000 midpoint samples, 20 moments. Pinned libRadtran normalizes each moment by moment zero. Our continuous solver evaluates the full-sphere normalized analytic law. This is an angle-dependent formulation discrepancy.',
			sources: [sources[0], sources[3], sources[4]],
		},
		{
			field: 'Vertical representation',
			status: 'difference',
			detail: 'Adapter uses 100 layers; Rayleigh optical depths are layer integrals, aerosol extinction is sampled at altitude boundaries with the uppermost set to zero. Continuous exponential profiles are not identical to this vertical discretization.',
			sources: [sources[0]],
		},
		{
			field: 'Source/view convention and altitude',
			status: 'match',
			detail: 'Spherical benchmark rays originate at the ground surface, source along +Z; reference asserts altitude=0, umu=-cos(view zenith). Source-relative scattering cosine is +direction.z in our convention.',
			sources: [sources[0], sources[6]],
		},
		{
			field: 'Relative azimuth',
			status: 'difference',
			detail: 'Reference adapter rounds view-relative azimuth to 0.25 degree before solver input; our retained rays keep their original directions.',
			sources: [sources[0]],
		},
		{
			field: 'Spectrum, units, material control',
			status: 'match',
			detail: 'Fixed paper source spectrum and wavelength points, output per_nm in radiance density; exponential HR=8km/HM=1.2km, alpha=.8/beta=.04, grass ground. No molecular absorption, Rayleigh depolarization zero. Parent packets authenticate exact sampled coefficients.',
			sources: [sources[0], sources[1], sources[2], sources[6]],
		},
		{
			field: 'Solver / stream count / convergence',
			status: 'unknown',
			detail: 'Pinned adapter selects pseudospherical and disort_intcor moments but does not explicitly set solver or stream count. Exact emitted deck, effective settings and a matched convergence ladder for retained published rows have not been recovered. Do not substitute current defaults.',
			sources: [sources[0], sources[5]],
		},
		{
			field: 'Retained reference execution identity',
			status: 'unknown',
			detail: 'Local build provenance records libRadtran 2.0.1 and a preexisting WSL executable, but does not authenticate the precise execution/configuration that produced every retained published row. No installation, compilation or new external run is authorized by this stage.',
			sources: [sources[5], sources[6]],
		},
	];
	return {ledger, moments, fullSphereMoments, normalization, forwardMass, phaseRows, prediction};
}
