/** Build the fixed factor catalog. The run recipe authenticates the historical
 * hypothesis report and continuation plan; new assessments supply current outcomes.
 * @returns {readonly SkyClosureFactor[]}
 */
export function buildCoverage() {
	return [
		{
			factorId: 'source',
			stage: 'both',
			controls: 'Source optical-depth integration count S.',
			range: 'Historical S20/40/80; continuation S80/160 in initial and refined backgrounds.',
			regeneration:
				'Source refinement changes J1 and descendants; analytic runtime first order must use matching S.',
			originalPrediction:
				'Finer source integration changes every order. After S20/40, the locked S80 response was one quarter of the preceding change; no original Kider-improvement promise.',
			method: 'Isolated count ladders, first-affected-order checks, held finer outputs, source/transport factorials and representation controls; continuation checks response dependence on the refined background.',
			historicalOutcome:
				'The local response prediction passed. Refinement brightened the sampled sky and worsened aggregate Kider RMSE with cached first order, while the score trend reversed under analytic first order.',
			currentEvidenceQuestion:
				'Does the remaining source response shrink and remain directionally stable after related numerical corrections, with an adequate independent error allowance?',
			restrictions: [
				'A passed radiance-response forecast does not qualify measurement-improving accuracy.',
				'The historical law is restricted to its tested settings and representations; a ladder difference is sensitivity, not a remainder bound.',
			],
		},
		{
			factorId: 'transport',
			stage: 'generation',
			controls: 'Recurrence-path integration count T.',
			range: 'Historical T40/80/160; continuation T160/320 and incoming-placement interactions.',
			regeneration: 'Recompute transported radiance and J2 onward; pure J1 stays unchanged.',
			originalPrediction:
				'Refining transport changes L1 and later orders while preserving J1. The later locked finer-level forecast used the quarter-change law.',
			method: 'Isolated transport ladders, homogeneous-medium integration proofs, order invariance, source/transport and incoming/transport factorials; continuation adds background and placement controls.',
			historicalOutcome:
				'The local transport prediction passed and refinement darkened the sampled sky. The same response improved the cached-J1 aggregate score but worsened the analytic-J1 score; incoming/transport additivity failed at tested settings.',
			currentEvidenceQuestion:
				'How much transport error remains, and does changing incoming placement alter its response or only the score contribution?',
			restrictions: [
				'Analytic L1 transport can have quadrature error without cache interpolation.',
				'Homogeneous proofs isolate a mechanism but do not bound all atmospheric transport or attenuation errors.',
			],
		},
		{
			factorId: 'altitude',
			stage: 'generation',
			controls: 'Retained near-ground altitude nodes P and their fixed nested refinement.',
			range: 'Historical P48/51/55/63; continuation P48/55/63 ladder and P48/55 representation matrix.',
			regeneration: 'Rebuild fields and query support for each altitude grid; regenerate affected later orders.',
			originalPrediction:
				'Near-ground refinement should mainly remove a local first-order reconstruction bias. The locked P55 whole-output forecast retained only its modeled J1 correction.',
			method: 'Nested node refinement, first/higher response separation, analytic-J1 controls and complete altitude/representation comparisons.',
			historicalOutcome:
				'The modeled first-order response agreed closely, but material low-elevation higher-order changes caused the complete-output forecast to fail. Finer responses diminished without establishing a monotone radiance law.',
			currentEvidenceQuestion:
				'Does matched density factorization reduce altitude sensitivity through the actual regenerated recurrence, and which response survives a finer background?',
			restrictions: [
				'A local grid edit can affect distant directions through recurrence.',
				'Diminishing changes do not establish altitude accuracy; arbitrary whole-altitude redistribution is deferred.',
			],
		},
		{
			factorId: 'outgoing',
			stage: 'generation',
			controls: 'Outgoing cubed-sphere face width W.',
			range: 'Historical and continuation W27/39/51; the grids are not nested.',
			regeneration: 'Rebuild directional fields and their descendants; account for increased field memory.',
			originalPrediction:
				'A finer outgoing grid should change sharp solar-lobe reconstruction most; continuous first order should be independent of W. No quantitative correction was locked.',
			method: 'Isolated grids, angular response maps and analytic-J1 substitution; continuation compares successive grids on a refined source/transport/altitude background.',
			historicalOutcome:
				'Most observed sensitivity lay near the Sun and fell sharply with analytic first order. The screen score improved modestly, without a qualified width-to-error law.',
			currentEvidenceQuestion:
				'Does outgoing-grid sensitivity remain material after other refinements, and can independent-location evidence bound its remainder?',
			restrictions: [
				'W51 is the planned layout ceiling, not an exact solution.',
				'Outgoing-resolution by density-factorization interactions are deferred; historical screening improvements do not qualify full-boundary accuracy.',
			],
		},
		{
			factorId: 'incoming-count',
			stage: 'generation',
			controls: 'Positive-weight incoming angular quadrature count I.',
			range: 'Historical Fibonacci 68 and product GL32/128/512/2048; continuation I512/2048 with bounded CPU-only local finer rules.',
			regeneration: 'Recompute phase-weighted scattering and J2 onward; J1 must remain unchanged.',
			originalPrediction:
				'More accurate positive-weight quadrature should improve the angular integral. Two later locked finer-level sky forecasts used a quarter-change response law.',
			method: 'Manufactured phase integrals, actual-sky count ladders, J1 invariance, held finer targets and local continuous-L1/J2 comparisons where resolved.',
			historicalOutcome:
				'Manufactured phase integration improved strongly and finer product rules improved the screen score. Both sky-response predictions failed as the spatial/spectral response rotated despite shrinking in norm.',
			currentEvidenceQuestion:
				'How much error comes from integrating phase times transported radiance, and do local references distinguish angular count from transport and reconstruction effects?',
			restrictions: [
				'Phase-only accuracy does not establish accuracy of the real sky integrand.',
				'The two failed count laws remain failed; a density reference uses density units and cannot directly score radiance.',
			],
		},
		{
			factorId: 'incoming-placement-aspect',
			stage: 'generation',
			controls: 'Incoming azimuth placement and cosine-by-azimuth aspect ratio at fixed count.',
			range: 'Continuation I512 midpoint/endpoint placement, 16x32 versus 8x64, and I2048 endpoint refinement.',
			regeneration:
				'Regenerate J2 onward with checked weights and distinct nodes; retain the same physical inputs and analytic L1.',
			originalPrediction:
				'The continuation asks whether equal-count placement or aspect changes resolve angular structure that count-only refinement misses; its isolated mechanism questions do not specify a quantitative response.',
			method: 'Matched-count controls, weight/moment checks, local-J2 witnesses and prospective placement-by-transport and placement-by-density joint targets.',
			historicalOutcome:
				'The first campaign demonstrated incoming-response failures and incoming/transport interaction, but did not isolate these equal-count placement and aspect controls.',
			currentEvidenceQuestion:
				'Do placement and aspect explain the failed count law, and are their isolated and joint responses predictable within the declared screen?',
			restrictions: [
				'No matched finite CPU endpoint/aspect reference is implied by midpoint-only finite controls.',
				'Do not select the winning distribution by Kider score alone or transfer a local angular envelope to the complete N4 solution.',
			],
		},
		{
			factorId: 'uniform-view',
			stage: 'runtime',
			controls: 'Uniform final-view sample count, interval distribution and altitude-segment subdivisions.',
			range: 'Historical quadratic Q30/60/120 and segment subdivisions 1/2/4/8; continuation subdivisions 4/8/16.',
			regeneration:
				'The runtime control leaves recurrence fields unchanged; evidence capture needs the required query-support union.',
			originalPrediction:
				'A smooth second-order correction should quarter on doubling. After failure, splitting at altitude knots was expected to restore a useful local convergence law.',
			method: 'Matched-field integration ladders, locked finer predictions, grouping controls and independent fixed-field quadrature references.',
			historicalOutcome:
				'The original count prediction failed. Coarse segmented refinement still missed its gate, while a sufficiently refined segmented forecast passed; aggregate and noon Kider trends differed.',
			currentEvidenceQuestion:
				'Which segment counts demonstrably reduce integration error on each representation, and does that numerical improvement survive changed backgrounds?',
			restrictions: [
				'A reference to the same fixed field qualifies view integration only.',
				'The finest retained uniform view is not exact; an observed near-quarter response is not automatically a passed prospective forecast.',
			],
		},
		{
			factorId: 'adaptive-view',
			stage: 'runtime',
			controls:
				'Adaptive allocation within the registered dyadic view-query union at bounded evaluation budgets.',
			range: 'Continuation dyadic levels 1/2/4/8/16; matched uniform budgets 4P/8P/16P on raw and factored final-J1 backgrounds.',
			regeneration:
				'Recurrence fields stay fixed; preparing the full 31P query union is separately charged construction work.',
			originalPrediction:
				'Adaptive allocation may reduce fixed-field integration error more efficiently than uniform allocation; no magnitude or success was assumed for every ray.',
			method: 'Equal-budget comparisons with independent view references; retain actual queried nodes, rejected trials, medium evaluations, reconstructions and support-construction costs.',
			historicalOutcome:
				'The first campaign tested uniform and altitude-segmented integration, but did not establish an adaptive operational control.',
			currentEvidenceQuestion:
				'Does adaptive allocation reduce reference error at equal counted work, including after final-J1 correction, without missed angular or altitude structure?',
			restrictions: [
				'Active-node count is not total work; rejected trial evaluations count.',
				'An adaptive indicator can miss unsampled structure. Component-only extra-time probes do not become complete Kider conditions.',
			],
		},
		{
			factorId: 'final-j1',
			stage: 'both',
			controls:
				'Final-view first-order representation: cumulative, grouped raw, continuous and density-factored species.',
			range: 'Historical raw/grouped/continuous and P48/P55 factored-J1 diagnostics; continuation matched raw/factored final J1.',
			regeneration:
				'Grouping and continuous substitution can reuse later fields; factored coefficients need retained species support. Changing final J1 alone does not regenerate later recurrence orders.',
			originalPrediction:
				'Direct phase, density and source transmittance should reduce first-order reconstruction error; factoring density should remove much of its altitude sensitivity.',
			method: 'Matched-field grouping controls, finite-quadrature continuous comparisons, split-species rounding controls and independent physical-J1 references with causal field checks.',
			historicalOutcome:
				'Factorization strongly reduced the tested first-order reconstruction error and altitude sensitivity, while frozen first-order substitutions worsened the aggregate screen score.',
			currentEvidenceQuestion:
				'Does independently bounded physical-J1 error fall, and how much lost compensation explains the resulting complete-score regression?',
			restrictions: [
				'A finite-quadrature direct calculation is not an exact physical reference.',
				'The remaining discrepancy contains higher-order numerical error, omitted orders and physical/observation discrepancy; it is not physics alone.',
			],
		},
		{
			factorId: 'higher-density',
			stage: 'both',
			controls: 'Combined raw, split-species raw and density-factored J2-J4 representation.',
			range: 'Continuation three representations at P48/P55, plus final-J1 and incoming-placement combinations.',
			regeneration:
				'Store explicit Rayleigh/Mie coefficient fields and regenerate affected transport and later orders; apply ground contributions once.',
			originalPrediction:
				'Moving physical density to query locations may reduce altitude reconstruction error through the higher-order recurrence; split raw controls distinguish grouping from density placement.',
			method: 'Complete representation-by-altitude matrix, matched analytic L1 and raw final J1, order-resolved contrasts, SSE identities and prospectively registered joint targets.',
			historicalOutcome:
				'The first campaign established the value of first-order factorization as a diagnostic, but did not build or qualify a factorized multiple-scattering solver.',
			currentEvidenceQuestion:
				'Does higher-order factorization reduce a referenced error and altitude dependence, or merely change cancellation and the regenerated field?',
			restrictions: [
				'Combined J cannot uniquely recover two species coefficients.',
				'Combined-to-split includes grouping, storage roundoff and regenerated feedback; split-to-factored retains coefficient-roundoff limits.',
				'Fixed-field references check integration of each changed field, not correctness between fields.',
			],
		},
		{
			factorId: 'solar-interpolation',
			stage: 'both',
			controls: 'Solar-angle reconstruction operator and, separately, solar-grid placement.',
			range: 'Historical linear versus monotone cubic on Z180; continuation keeps Z180 and its declared reconstruction.',
			regeneration:
				'Changing interpolation can reuse fields; changing the solar grid would require a separate coordinate implementation and regenerated fields.',
			originalPrediction:
				'Fractional-angle reconstruction was expected to be a small contributor, especially near noon; no numerical forecast was locked.',
			method: 'Matched-field linear/cubic screen comparison and explicit grouping controls; grid replacement is deferred.',
			historicalOutcome:
				'The operator difference was small in the three-condition screen and linear reconstruction slightly worsened its score. That screen did not test the noon-specific expectation.',
			currentEvidenceQuestion:
				'Do grouping and interpolation limits remain explicit when interpreting the continuation representations and effective order increments?',
			restrictions: [
				'Neither operator was shown exact and no alternative solar grid was qualified.',
				'Nonlinear interpolation means reconstructing a sum differs from summing reconstructions; cumulative differences need not be pure-order contributions.',
			],
		},
		{
			factorId: 'precision',
			stage: 'both',
			controls: 'Arithmetic precision, Float32 packing and accumulation order.',
			range: 'Historical matched production parity and repeated controls; continuation bounded binary64 component calculations and matched Float32 witnesses.',
			regeneration:
				'Changing stored precision or recurrence arithmetic needs new fields; a runtime-only arithmetic comparison can reuse the same declared inputs.',
			originalPrediction:
				'Matched arithmetic and independent comparisons should bound harness and roundoff effects below the responses under investigation.',
			method: 'Baseline parity, unchanged repeats, order-prefix checks, explicit storage/accumulation controls and independent component references.',
			historicalOutcome:
				'Baseline parity and repeatability passed at a scale far below the measured responses. No systematic precision sweep was performed.',
			currentEvidenceQuestion:
				'Which component differences are bounded roundoff, and which still combine packing, reconstruction and quadrature effects?',
			restrictions: [
				'Agreement with a matched implementation cannot exclude a shared bias.',
				'Binary64 arithmetic alone does not make a reference adequate or isolate Float32 error.',
			],
		},
		{
			factorId: 'geometry',
			stage: 'both',
			controls: 'Ray intersections, observer height, angular frames and the ground-side boundary convention.',
			range: 'Fixed fitted Sun/observer geometry and anchored policy; continuation selected exact-ground local probes.',
			regeneration:
				'A physical boundary or observer change can alter generation and evaluation; geometry probes preserve the registered physical inputs.',
			originalPrediction:
				'Stable roots and matched surface/frame geometry should bound arithmetic artifacts without confounding sampling controls.',
			method: 'Exact geometry joins, numerical boundary checks and retained ground-density reconstruction witnesses; separate matched ground-knot and atmospheric-side-limit questions.',
			historicalOutcome:
				'Geometry remained fixed and baseline parity passed. The first campaign did not isolate a geometry or surface-boundary correction.',
			currentEvidenceQuestion:
				'Can local ground witnesses and independent calculations distinguish numerical reconstruction from an unresolved ground-boundary convention?',
			restrictions: [
				'A matched exact-ground convention does not establish the physical positive-height limit.',
				'Preserve tiny recorded altitude weights rather than silently snapping coordinates; no new geometry calibration is qualified.',
			],
		},
		{
			factorId: 'scattering-tail',
			stage: 'both',
			controls: 'Scattering-order truncation and its interaction with integration controls.',
			range: 'Historical N4/N5/N6 at baseline, T160 and I512 on two channels; continuation references remain finite N4.',
			regeneration:
				'Orders beyond a retained prefix require additional recurrence passes; selecting already retained cumulative orders is a runtime evaluation choice.',
			originalPrediction:
				'After observing material blue fourth-order radiance, the diagnostic asked whether omitted orders remained material and depended on sampling; it had no locked finer-order forecast.',
			method: 'Actual six-order recurrence, exact four-order prefix checks and all-time two-channel spectra under transport and incoming refinement.',
			historicalOutcome:
				'Later radiance additions remained positive and material but diminished. Refinement reduced them; pooled two-channel Kider agreement worsened at N5/N6, with different wavelength trends.',
			currentEvidenceQuestion:
				'Which continuation conclusions are valid at finite N4 despite the separately unresolved scattering tail?',
			restrictions: [
				'No full-spectrum N6 or infinite-order reference was established.',
				'An earlier order fitting Kider better is not convergence evidence; nonlinear cumulative increments are not separately integrated pure orders.',
			],
		},
		{
			factorId: 'physical-parameters',
			stage: 'both',
			controls: 'Atmosphere, aerosol/phase/profile, ground and observation-response assumptions.',
			range: 'Matched physical and measurement inputs remain fixed throughout the bounded continuation.',
			regeneration:
				'A changed physical model would require a separately declared solver/observation experiment and affected fields.',
			originalPrediction:
				'Keep physical inputs fixed until numerical effects are understood; propose any later physical or observation correction separately.',
			method: 'Use bounded numerical references and residual accounting before assigning persistent measurement discrepancies to physical or observation assumptions.',
			historicalOutcome:
				'Persistent solar and low-elevation residuals were mapped, but their physical cause was not identified and no physical-model calibration was performed.',
			currentEvidenceQuestion:
				'Is the unresolved numerical remainder sufficiently bounded to motivate a distinct physical or observation hypothesis?',
			restrictions: [
				'A shared hotspot across models does not by itself identify shared physics error.',
				'Do not use numerical settings as hidden physical calibration or claim an unknown instrument response has been measured.',
			],
		},
	];
}
