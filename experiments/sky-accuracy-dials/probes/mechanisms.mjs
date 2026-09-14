import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';

const PHASE_REFERENCE = 'https://ebruneton.github.io/precomputed_atmospheric_scattering/atmosphere/functions.glsl.html';
const FOUR_PI = 4 * Math.PI;

/** Abort on an invalid manufactured invariant; observed approximation errors remain results.
 * @param {boolean} condition - Whether the invariant holds. @param {string} message - Failed invariant.
 * @returns {void}
 */
function requireProof(condition, message) {
	if (!condition) throw new Error(`Mechanism proof failed: ${message}`);
}

/** Scalar product of accepted unit vectors.
 * @param {SkyVector3} a - First vector. @param {SkyVector3} b - Second vector. @returns {number} Scalar product.
 */
function dot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Normalized Rayleigh phase, 3(1+mu^2)/(16 pi), in inverse steradians.
 * Equation: Bruneton's RayleighPhaseFunction at PHASE_REFERENCE; its analytic
 * normalization is 2*pi*3/(16*pi)*[mu+mu^3/3] from -1 to 1 = 1.
 * @param {number} mu - Direction cosine. @returns {number} Inverse-steradian phase.
 */
function rayleigh(mu) {
	return (3 * (1 + mu * mu)) / (16 * Math.PI);
}

/** Cornette-Shanks phase from Bruneton's MiePhaseFunction at PHASE_REFERENCE.
 * p(mu)=3/(8*pi)*(1-g^2)/(2+g^2)*(1+mu^2)/(1+g^2-2*g*mu)^(3/2).
 * Its full-sphere integral is one; this proof independently checks the scalar
 * 2*pi integral over mu using adaptive Simpson, not an incoming product rule.
 * @param {number} mu - Direction cosine. @param {number} g - Asymmetry parameter strictly between -1 and 1.
 * @returns {number} Inverse-steradian phase.
 */
function mie(mu, g) {
	return (3 * (1 - g * g) * (1 + mu * mu)) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * mu) ** 1.5);
}

/** Independent scalar adaptive Simpson integration with a corrected local estimate.
 * A tolerance comparison is an empirical estimate, not an interval-arithmetic proof.
 * @param {(x: number) => number} integrand - Finite smooth scalar function.
 * @param {number} lower - Lower limit. @param {number} upper - Upper limit.
 * @param {number} tolerance - Requested absolute error estimate.
 * @returns {SkyAdaptiveIntegral} Integral, local error estimate and evaluation cost.
 */
function adaptiveIntegral(integrand, lower, upper, tolerance) {
	let evaluations = 0,
		estimatedAbsoluteError = 0;
	/** @param {number} x - Evaluation coordinate. @returns {number} Finite integrand. */
	const evaluate = (x) => {
		const value = integrand(x);
		requireProof(Number.isFinite(value) && ++evaluations <= 200000, 'finite bounded adaptive reference evaluation');
		return value;
	};
	/** @param {number} a - Lower endpoint. @param {number} b - Upper endpoint.
	 * @param {number} fa - Lower value. @param {number} fm - Midpoint value. @param {number} fb - Upper value.
	 * @param {number} whole - Parent Simpson estimate. @param {number} budget - Local error budget.
	 * @param {number} depth - Remaining bisection depth. @returns {number} Corrected integral.
	 */
	const visit = (a, b, fa, fm, fb, whole, budget, depth) => {
		const middle = (a + b) / 2,
			leftMiddle = evaluate((a + middle) / 2),
			rightMiddle = evaluate((middle + b) / 2);
		const left = ((middle - a) * (fa + 4 * leftMiddle + fm)) / 6;
		const right = ((b - middle) * (fm + 4 * rightMiddle + fb)) / 6;
		const correction = (left + right - whole) / 15;
		if (Math.abs(correction) <= budget) {
			estimatedAbsoluteError += Math.abs(correction);
			return left + right + correction;
		}
		requireProof(depth > 0, 'adaptive reference reached requested estimated tolerance');
		return (
			visit(a, middle, fa, leftMiddle, fm, left, budget / 2, depth - 1) +
			visit(middle, b, fm, rightMiddle, fb, right, budget / 2, depth - 1)
		);
	};
	const fa = evaluate(lower),
		fm = evaluate((lower + upper) / 2),
		fb = evaluate(upper);
	const value = visit(lower, upper, fa, fm, fb, ((upper - lower) * (fa + 4 * fm + fb)) / 6, tolerance, 28);
	return {value, estimatedAbsoluteError, evaluations};
}

/** Independent orientation sweep containing coordinate axes and 257 Fibonacci directions.
 * These are evaluation orientations, not integration nodes or a measured-sky sample.
 * @returns {readonly SkyVector3[]} Fixed reproducible unit-vector sweep.
 */
function outgoingDirections() {
	/** @type {SkyVector3[]} */
	const directions = [
		[1, 0, 0],
		[-1, 0, 0],
		[0, 1, 0],
		[0, -1, 0],
		[0, 0, 1],
		[0, 0, -1],
	];
	for (let index = 0; index < 257; index++) {
		const z = 1 - (2 * (index + 0.5)) / 257,
			angle = (index + 0.371) * Math.PI * (3 - Math.sqrt(5));
		const radial = Math.sqrt(1 - z * z);
		directions.push([radial * Math.cos(angle), radial * Math.sin(angle), z]);
	}
	return directions;
}

/** Reject malformed angular rules without normalizing their vectors, phases or weights.
 * @param {SkyIncomingDomain} domain - Caller-supplied integration rule. @returns {number} Solid-angle sum.
 */
function validateDomain(domain) {
	requireProof(typeof domain.id === 'string' && domain.id.length > 0, 'incoming identity is nonempty');
	requireProof(
		Number.isInteger(domain.directionCount) &&
			domain.directionCount > 0 &&
			domain.unitVectors.length === domain.directionCount &&
			domain.integrationWeightsSteradians.length === domain.directionCount,
		'incoming shape matches declared count',
	);
	let sum = 0;
	for (let index = 0; index < domain.directionCount; index++) {
		const vector = domain.unitVectors[index],
			weight = domain.integrationWeightsSteradians[index];
		requireProof(
			vector.length === 3 && vector.every(Number.isFinite) && Math.abs(dot(vector, vector) - 1) <= 2e-12,
			'incoming directions are unit vectors',
		);
		requireProof(Number.isFinite(weight) && weight > 0, 'incoming weights are positive and finite');
		sum += weight;
	}
	requireProof(Math.abs(sum - FOUR_PI) <= 2e-10, 'incoming weights cover four pi');
	return sum;
}

/** Constant-radiance phase integration across the fixed orientation sweep.
 * @param {SkyIncomingDomain} domain - Unmodified incoming rule.
 * @param {readonly SkyVector3[]} directions - Outgoing evaluation orientations.
 * @param {(cosine: number) => number} phase - Normalized physical phase.
 * @returns {SkyPhaseOrientationSummary} Compact measured rule error.
 */
function phaseSummary(domain, directions, phase) {
	let minimum = Infinity,
		maximum = -Infinity,
		maximumAbsoluteError = -Infinity,
		sumSquared = 0;
	let worstDirection = directions[0];
	for (const direction of directions) {
		let integral = 0;
		for (let index = 0; index < domain.directionCount; index++)
			integral += domain.integrationWeightsSteradians[index] * phase(dot(direction, domain.unitVectors[index]));
		const error = Math.abs(integral - 1);
		requireProof(Number.isFinite(integral) && integral > 0, 'positive finite phase integral');
		minimum = Math.min(minimum, integral);
		maximum = Math.max(maximum, integral);
		sumSquared += error * error;
		if (error > maximumAbsoluteError) {
			maximumAbsoluteError = error;
			worstDirection = direction;
		}
	}
	return {
		minimum,
		maximum,
		maximumAbsoluteError,
		rmsError: Math.sqrt(sumSquared / directions.length),
		worstDirection,
	};
}

/** Normalization checks independent of every supplied angular rule.
 * @param {readonly SkyIncomingDomain[]} domains - Unmodified integration rules.
 * @param {readonly SkyVector3[]} directions - Independent outgoing orientations.
 * @returns {SkyPhaseProof} Reference qualification and observed angular errors.
 */
function phaseProof(domains, directions) {
	const rayleighReference = adaptiveIntegral((mu) => 2 * Math.PI * rayleigh(mu), -1, 1, 2e-13);
	const mieReference = adaptiveIntegral((mu) => 2 * Math.PI * mie(mu, 0.7), -1, 1, 2e-13);
	const refined = adaptiveIntegral((mu) => 2 * Math.PI * mie(mu, 0.7), -1, 1, 1e-14);
	const mieReferenceRefinementDifference = Math.abs(mieReference.value - refined.value);
	requireProof(
		Math.abs(rayleighReference.value - 1) < 5e-12 &&
			Math.abs(mieReference.value - 1) < 5e-12 &&
			Math.abs(refined.value - 1) < 5e-12 &&
			mieReferenceRefinementDifference < 5e-12,
		'independent phase references agree with analytic normalization',
	);
	return {
		exactIntegral: 1,
		mieG: 0.7,
		outgoingDirections: directions,
		rayleighReference,
		mieReference,
		mieReferenceRefinementDifference,
		rules: domains.map((domain) => ({
			ruleId: domain.id,
			directionCount: domain.directionCount,
			weightSumSteradians: validateDomain(domain),
			rayleigh: phaseSummary(domain, directions, rayleigh),
			mie: phaseSummary(domain, directions, (mu) => mie(mu, 0.7)),
		})),
	};
}

/** Verify exact algebraic Rayleigh closure without claiming exact incoming moments.
 * From p_R(mu)=3(1+mu^2)/(16*pi), S_R(u)=3/(16*pi)*(M0+u^T*M2*u).
 * For L(w)=1+0.3*w_z+0.7*w_z^2, sphere symmetry gives M0=4*pi*(1+0.7/3),
 * Mxx=Myy=4*pi*(1/3+0.7/15), Mzz=4*pi*(1/3+0.7/5); cross terms vanish.
 * Thus S_R(u)=1+0.7*(3+u_z^2)/10. No interpolation assumption enters this identity.
 * @param {readonly SkyIncomingDomain[]} domains - Accepted angular rules.
 * @param {readonly SkyVector3[]} directions - Independent outgoing orientations.
 * @returns {SkyRayleighMomentProof} Algebraic and continuum errors reported separately.
 */
function momentProof(domains, directions) {
	const analyticZerothMoment = FOUR_PI * (1 + 0.7 / 3);
	const analyticSecondMoment = [
		FOUR_PI * (1 / 3 + 0.7 / 15),
		FOUR_PI * (1 / 3 + 0.7 / 15),
		FOUR_PI * (1 / 3 + 0.7 / 5),
		0,
		0,
		0,
	];
	const scalar = (z) => 1 + 0.3 * z + 0.7 * z * z;
	const numerical = [
		adaptiveIntegral((z) => 2 * Math.PI * scalar(z), -1, 1, 1e-12).value,
		adaptiveIntegral((z) => Math.PI * scalar(z) * (1 - z * z), -1, 1, 1e-12).value,
		adaptiveIntegral((z) => 2 * Math.PI * scalar(z) * z * z, -1, 1, 1e-12).value,
	];
	const referenceMaximumAbsoluteError = Math.max(
		...numerical.map((value, index) =>
			Math.abs(value - [analyticZerothMoment, analyticSecondMoment[0], analyticSecondMoment[2]][index]),
		),
	);
	requireProof(referenceMaximumAbsoluteError < 5e-12, 'independent polynomial moments match analytic moments');
	const rules = domains.map((domain) => {
		let zerothMoment = 0;
		const secondMoment = [0, 0, 0, 0, 0, 0];
		for (let index = 0; index < domain.directionCount; index++) {
			const [x, y, z] = domain.unitVectors[index],
				weightedRadiance = scalar(z) * domain.integrationWeightsSteradians[index];
			zerothMoment += weightedRadiance;
			[x * x, y * y, z * z, x * y, x * z, y * z].forEach((value, axis) => {
				secondMoment[axis] += value * weightedRadiance;
			});
		}
		let maximumClosureDifference = 0,
			maximumAnalyticError = 0;
		for (const direction of directions) {
			const [x, y, z] = direction;
			const quadratic =
				x * x * secondMoment[0] +
				y * y * secondMoment[1] +
				z * z * secondMoment[2] +
				2 * (x * y * secondMoment[3] + x * z * secondMoment[4] + y * z * secondMoment[5]);
			const momentValue = (3 * (zerothMoment + quadratic)) / (16 * Math.PI);
			let direct = 0;
			for (let index = 0; index < domain.directionCount; index++)
				direct +=
					scalar(domain.unitVectors[index][2]) *
					domain.integrationWeightsSteradians[index] *
					rayleigh(dot(direction, domain.unitVectors[index]));
			maximumClosureDifference = Math.max(maximumClosureDifference, Math.abs(direct - momentValue));
			maximumAnalyticError = Math.max(maximumAnalyticError, Math.abs(direct - (1 + (0.7 * (3 + z * z)) / 10)));
		}
		requireProof(
			maximumClosureDifference < 2e-12,
			'Rayleigh moment contraction equals direct evaluation on identical nodes',
		);
		return {ruleId: domain.id, maximumClosureDifference, maximumAnalyticError, zerothMoment, secondMoment};
	});
	return {
		radianceEquation: 'L(w)=1+0.3*w_z+0.7*w_z^2',
		analyticResponseEquation: 'S_R(u)=1+0.7*(3+u_z^2)/10',
		analyticZerothMoment,
		analyticSecondMoment,
		referenceMaximumAbsoluteError,
		rules,
	};
}

/** Manufactured positive-addition stress under explicit Float32 rounding after every addition.
 * gamma_n=n*u/(1-n*u), u=2^-24, bounds accumulation error for exact inputs
 * without overflow or underflow. This is an arithmetic demonstration, not a GPU equivalence check.
 * @returns {SkyPrecisionProof} Summation sensitivity and a small four-order surrogate.
 */
function precisionProof() {
	const smallTermCount = 4096,
		smallTerm = 2 ** -26,
		exactSum = 1 + smallTermCount * smallTerm;
	const terms = [1, ...Array(smallTermCount).fill(smallTerm)];
	const add32 = (sum, value) => Math.fround(sum + Math.fround(value));
	const largeFirstFloat32 = terms.reduce(add32, 0),
		smallFirstFloat32 = [...terms].reverse().reduce(add32, 0);
	let pairs = [...terms];
	while (pairs.length > 1) {
		const next = [];
		for (let index = 0; index < pairs.length; index += 2)
			next.push(index + 1 < pairs.length ? Math.fround(pairs[index] + pairs[index + 1]) : pairs[index]);
		pairs = next;
	}
	const pairwiseFloat32 = pairs[0],
		binary64 = terms.reduce((sum, value) => sum + value, 0);
	const largeFirstAbsoluteError = Math.abs(largeFirstFloat32 - exactSum),
		nU = terms.length * 2 ** -24;
	const forwardErrorBound = (nU / (1 - nU)) * exactSum;
	requireProof(
		binary64 === exactSum && smallFirstFloat32 === exactSum && largeFirstFloat32 === 1,
		'exact positive stress sum and expected small-term loss',
	);
	requireProof(
		largeFirstAbsoluteError <= forwardErrorBound && Math.abs(pairwiseFloat32 - exactSum) < largeFirstAbsoluteError,
		'roundoff bound and pairwise improvement in this stress case',
	);
	const orderTerms = [1, 0.001, 0.00001, 0.0000001];
	return {
		exactSum,
		smallTermCount,
		smallTerm,
		largeFirstFloat32,
		smallFirstFloat32,
		pairwiseFloat32,
		binary64,
		largeFirstAbsoluteError,
		forwardErrorBound,
		orderTerms,
		fourOrderFloat32: orderTerms.reduce(add32, 0),
		fourOrderBinary64: orderTerms.reduce((sum, value) => sum + value, 0),
		scope: 'Manufactured summation with Math.fround at each input/addition; excludes GPU compiler choices, transcendental functions, geometry, interpolation and measured sky errors.',
	};
}

/** Exercise the actual read-only production harmonic-slope interpolation owner.
 * @returns {SkyCubicGroupingProof} Fixed nonnegative example separating nonlinear groupings.
 */
function cubicProof() {
	const firstOrderSamples = [0, 1, 2, 3],
		higherOrderSamples = [3, 2, 2, 3],
		sum = firstOrderSamples.map((value, index) => value + higherOrderSamples[index]);
	/** @param {readonly number[]} values - Four samples. @param {number} fraction - Accepted fraction. @returns {number} Actual production cubic. */
	const sample = (values, fraction) =>
		DistantSunSolarInterpolation.sample(values[0], values[1], values[2], values[3], fraction);
	let maximumHomogeneityResidual = 0;
	for (const values of [firstOrderSamples, higherOrderSamples, sum]) {
		requireProof(sample(values, 0) === values[1] && sample(values, 1) === values[2], 'cubic preserves exact knots');
		for (let index = 0; index <= 20; index++) {
			const t = index / 20,
				value = sample(values, t);
			requireProof(
				value >= Math.min(values[1], values[2]) - 1e-14 && value <= Math.max(values[1], values[2]) + 1e-14,
				'cubic preserves interval range in fixed examples',
			);
			maximumHomogeneityResidual = Math.max(
				maximumHomogeneityResidual,
				Math.abs(
					sample(
						values.map((item) => 2 * item),
						t,
					) -
						2 * value,
				),
			);
		}
	}
	const fraction = 0.5,
		cumulative = sample(sum, fraction),
		first = sample(firstOrderSamples, fraction),
		grouped = first + sample(higherOrderSamples, fraction);
	const replacementFirstOrder = 1.45,
		frozenIncrementReplacement = cumulative - first + replacementFirstOrder;
	const coherentGroupedReplacement = replacementFirstOrder + sample(higherOrderSamples, fraction);
	requireProof(
		Math.abs(cumulative - grouped + 1 / 6) < 1e-14 && maximumHomogeneityResidual < 1e-14,
		'cubic is positively homogeneous but not additive',
	);
	requireProof(
		Math.abs(frozenIncrementReplacement - coherentGroupedReplacement - (cumulative - grouped)) < 1e-14,
		'frozen and coherent replacements retain the measured grouping difference',
	);
	return {
		firstOrderSamples,
		higherOrderSamples,
		fraction,
		cumulative,
		grouped,
		groupingDifference: cumulative - grouped,
		replacementFirstOrder,
		frozenIncrementReplacement,
		coherentGroupedReplacement,
		maximumHomogeneityResidual,
		implementationPath: 'src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js',
	};
}

/** Smooth positive known-function quadrature with two midpoint placement choices.
 * @returns {SkyMidpointProof} Actual lower-level prediction check and error ratios.
 */
function midpointProof() {
	const exactIntegral = -Math.expm1(-12.5) / 12.5;
	const ladders = [1, 2].map((power) => {
		const levels = [30, 60, 120].map((intervals) => {
			let integral = 0;
			for (let index = 0; index < intervals; index++) {
				const lower = (index / intervals) ** power,
					upper = ((index + 1) / intervals) ** power;
				integral += Math.exp((-12.5 * (lower + upper)) / 2) * (upper - lower);
			}
			return {intervals, integral, error: integral - exactIntegral};
		});
		const errorRatios = levels.slice(1).map((level, index) => Math.abs(levels[index].error / level.error));
		const predictedLastDelta = (levels[1].integral - levels[0].integral) / 4,
			observedLastDelta = levels[2].integral - levels[1].integral;
		const relativePredictionError = Math.abs(predictedLastDelta - observedLastDelta) / Math.abs(observedLastDelta);
		requireProof(
			levels.every((level) => level.error < 0) && errorRatios.every((ratio) => ratio > 3.9 && ratio < 4.1),
			'smooth convex midpoint refinement has decreasing negative error and second-order ratios',
		);
		requireProof(
			relativePredictionError < 0.02,
			'lower-level second-order model predicts the last manufactured midpoint change within two percent',
		);
		return {
			placement: `cell edges x_i=(i/N)^${power}; physical midpoint (x_i+x_(i+1))/2`,
			levels,
			errorRatios,
			predictedLastDelta,
			observedLastDelta,
			relativePredictionError,
		};
	});
	return {integrandEquation: 'integral from 0 to 1 of exp(-12.5*x) dx', exactIntegral, ladders};
}

/** Constant source j and extinction kappa isolate the outer radiance quadrature.
 * L = integral_0^D j*exp(-kappa*s) ds = j*(1-exp(-kappa*D))/kappa.
 * Summing the geometric series on N uniform cells, Delta=D/N and x=kappa*Delta/2,
 * gives L_trapezoid/L=x*coth(x) and L_midpoint/L=x/sinh(x). For x>0,
 * tanh(x)<x<sinh(x), hence the trapezoid overestimates and midpoint underestimates.
 * Their relative errors begin +x^2/3 and -x^2/6, respectively. Direct sums below
 * are independent of these ratio expressions. The algebra assumes exact optical
 * depth and a constant source; it does not isolate an actual atmosphere's terms.
 * @returns {SkyHomogeneousTransportProof} Signed bias, exact ratio checks and refinement evidence.
 */
function homogeneousTransportProof() {
	const pathLength = 1,
		sourceDensity = 1,
		quadraticRegimeMaximumX = 0.125;
	const ladders = [0.1, 1, 5, 20, 40].map((opticalDepth) => {
		const extinction = opticalDepth / pathLength,
			exactRadiance = (-sourceDensity * Math.expm1(-opticalDepth)) / extinction;
		const levels = [20, 40, 80].map((intervals) => {
			const step = pathLength / intervals,
				x = (extinction * step) / 2;
			let trapezoidRadiance = 0,
				midpointRadiance = 0;
			for (let index = 0; index < intervals; index++) {
				const lower = index * step,
					upper = (index + 1) * step;
				trapezoidRadiance +=
					(sourceDensity * step * (Math.exp(-extinction * lower) + Math.exp(-extinction * upper))) / 2;
				midpointRadiance += sourceDensity * step * Math.exp((-extinction * (lower + upper)) / 2);
			}
			const trapezoidRatio = trapezoidRadiance / exactRadiance,
				midpointRatio = midpointRadiance / exactRadiance;
			const exactTrapezoidRatio = x / Math.tanh(x),
				exactMidpointRatio = x / Math.sinh(x);
			requireProof(
				Math.abs(trapezoidRatio - exactTrapezoidRatio) < 2e-14 &&
					Math.abs(midpointRatio - exactMidpointRatio) < 2e-14,
				'independently summed homogeneous radiances match the geometric-series ratios',
			);
			const trapezoidRelativeError = trapezoidRatio - 1,
				midpointRelativeError = midpointRatio - 1;
			requireProof(
				trapezoidRelativeError > 0 && midpointRelativeError < 0,
				'homogeneous outer trapezoid and midpoint have opposite signed errors',
			);
			if (x <= quadraticRegimeMaximumX)
				requireProof(
					Math.abs(trapezoidRelativeError / ((x * x) / 3) - 1) < 0.01 &&
						Math.abs(midpointRelativeError / (-(x * x) / 6) - 1) < 0.01,
					'homogeneous signed biases follow their quadratic leading terms in the declared small-cell regime',
				);
			return {
				intervals,
				x,
				trapezoidRadiance,
				midpointRadiance,
				trapezoidRatio,
				midpointRatio,
				exactTrapezoidRatio,
				exactMidpointRatio,
				trapezoidRelativeError,
				midpointRelativeError,
			};
		});
		const refinements = levels.slice(1).map((level, index) => {
			const previous = levels[index],
				trapezoidErrorRatio = previous.trapezoidRelativeError / level.trapezoidRelativeError,
				midpointErrorRatio = previous.midpointRelativeError / level.midpointRelativeError;
			requireProof(
				level.trapezoidRadiance < previous.trapezoidRadiance &&
					level.midpointRadiance > previous.midpointRadiance,
				'homogeneous refinement approaches analytic radiance monotonically from opposite sides',
			);
			const quadraticRegime = previous.x <= quadraticRegimeMaximumX;
			if (quadraticRegime)
				requireProof(
					Math.abs(trapezoidErrorRatio - 4) < 0.04 && Math.abs(midpointErrorRatio - 4) < 0.04,
					'homogeneous errors decrease by approximately four in the declared quadratic regime',
				);
			return {
				coarseIntervals: previous.intervals,
				fineIntervals: level.intervals,
				trapezoidErrorRatio,
				midpointErrorRatio,
				quadraticRegime,
			};
		});
		return {opticalDepth, extinction, exactRadiance, levels, refinements};
	});
	return {
		pathLength,
		sourceDensity,
		radianceEquation: 'L=integral_0^D j*exp(-kappa*s) ds=j*(1-exp(-kappa*D))/kappa',
		ratioEquations: 'Delta=D/N; x=kappa*Delta/2; L_trapezoid/L=x*coth(x)>1; L_midpoint/L=x/sinh(x)<1',
		quadraticRegimeMaximumX,
		ladders,
		scope: 'Manufactured homogeneous medium in arbitrary consistent units, with exact optical depth and constant source. Excludes inner optical-depth quadrature, varying atmosphere/source, interpolation, boundaries and recurrence; no attribution of actual atmospheric or Kider errors.',
	};
}

/** Constant lighting isolates exponential density from actual atmosphere transport.
 * Raw linear interpolation of a convex exponential has positive bias. Separately
 * storing constant Rayleigh/Mie lighting coefficients makes this special case exact.
 * Actual varying lighting still requires coefficient interpolation and qualification.
 * @returns {SkyDensityFactorizationProof} Mechanism evidence, not a production-field reconstruction.
 */
function densityProof() {
	const upperAltitudeMeters = 1875,
		validationCount = 4096;
	/** @param {number} height - Height in metres. @returns {number} Manufactured source. */
	const source = (height) => 0.2 * Math.exp(-height / 8000) + 0.8 * Math.exp(-height / 1200);
	const levels = [1, 2, 4, 8].map((intervals) => {
		let squared = 0,
			maximumAbsoluteError = 0,
			sum = 0,
			factorizedMaximumAbsoluteError = 0;
		for (let index = 0; index < validationCount; index++) {
			const height = (upperAltitudeMeters * (index + 0.5)) / validationCount,
				cell = Math.min(intervals - 1, Math.floor((height / upperAltitudeMeters) * intervals));
			const lower = (upperAltitudeMeters * cell) / intervals,
				upper = (upperAltitudeMeters * (cell + 1)) / intervals,
				fraction = (height - lower) / (upper - lower);
			const raw = source(lower) * (1 - fraction) + source(upper) * fraction;
			const factored =
				(0.2 * (1 - fraction) + 0.2 * fraction) * Math.exp(-height / 8000) +
				(0.8 * (1 - fraction) + 0.8 * fraction) * Math.exp(-height / 1200);
			const error = raw - source(height);
			requireProof(error >= -1e-15, 'convex density raw interpolation has nonnegative bias');
			squared += error * error;
			sum += error;
			maximumAbsoluteError = Math.max(maximumAbsoluteError, Math.abs(error));
			factorizedMaximumAbsoluteError = Math.max(
				factorizedMaximumAbsoluteError,
				Math.abs(factored - source(height)),
			);
		}
		requireProof(
			factorizedMaximumAbsoluteError < 5e-16,
			'constant-lighting factorization removes manufactured density interpolation error',
		);
		return {
			intervals,
			rmsError: Math.sqrt(squared / validationCount),
			maximumAbsoluteError,
			meanSignedError: sum / validationCount,
			factorizedMaximumAbsoluteError,
		};
	});
	requireProof(
		levels.slice(1).every((level, index) => level.rmsError < levels[index].rmsError / 3),
		'raw density ladder approaches its known analytic solution',
	);
	return {
		sourceEquation: 'J(h)=0.2*exp(-h/8000)+0.8*exp(-h/1200)',
		upperAltitudeMeters,
		validationCount,
		levels,
		scope: 'Exact factorization here requires constant and separately retained Rayleigh/Mie lighting coefficients. A combined scalar J does not identify those two coefficients; varying-light interpolation and recurrence remain unqualified.',
	};
}

/** Run bounded deterministic numerical proofs without I/O, GPU work or measured data.
 * Caller owns immutable output and source/input provenance. A returned result means
 * the stated manufactured invariants passed; incoming-rule approximation errors
 * are observations and are never silently forced below an acceptance threshold.
 * @param {SkyMechanismProofRequest} request - Actual incoming rules to probe.
 * @returns {SkyMechanismProofResult} Compact mechanism calibration for an evidence run.
 */
export function runMechanismProofs(request) {
	requireProof(
		Array.isArray(request.incomingDomains) &&
			request.incomingDomains.length > 0 &&
			request.incomingDomains.length <= 16 &&
			new Set(request.incomingDomains.map((domain) => domain.id)).size === request.incomingDomains.length,
		'one to sixteen uniquely identified incoming rules',
	);
	for (const domain of request.incomingDomains) {
		requireProof(domain.directionCount <= 8192, 'bounded incoming rule size');
		validateDomain(domain);
	}
	const directions = outgoingDirections();
	return {
		schemaId: 'sky-accuracy-dials-manufactured-mechanisms-v1',
		scope: 'Manufactured mechanism checks only; neither actual Kider accuracy nor actual GPU recurrence convergence is established.',
		references: [PHASE_REFERENCE],
		incomingPhase: phaseProof(request.incomingDomains, directions),
		rayleighMoments: momentProof(request.incomingDomains, directions),
		precision: precisionProof(),
		cubicGrouping: cubicProof(),
		midpoint: midpointProof(),
		homogeneousTransport: homogeneousTransportProof(),
		densityFactorization: densityProof(),
		passedInvariants: [
			'incoming geometry and positive weights cover the unit sphere',
			'independent physical phase references integrate to one within 5e-12',
			'Rayleigh moment contraction equals direct same-node integration within 2e-12',
			'independent polynomial moments match analytic values within 5e-12',
			'known Float32 stress loss obeys a forward-error bound',
			'production cubic preserves knots and exhibits the predicted nonadditivity',
			'known smooth midpoint change prediction is within two percent',
			'homogeneous outer trapezoid and midpoint match analytic ratios and converge from opposite sides',
			'homogeneous radiance biases follow quadratic scaling in the declared small-cell regime',
			'constant-lighting factorization removes manufactured density interpolation bias',
		],
	};
}
