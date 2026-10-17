import {createOutgoingDomain} from './math.js';

/** @readonly @type {SkyControls} */
const DEFAULTS = {
	altitudeCount: 48,
	outgoingWidth: 27,
	incoming: {kind: 'production-f68'},
	sourceIntervals: 20,
	transportIntervals: 40,
	viewRule: 'quadratic',
	viewIntervals: [30],
	solarInterpolations: ['monotone-cubic'],
	representations: ['cumulative'],
};

/** Reject accidental coupled controls and unsupported parameter values.
 * @param {SkyControlInput} [input] - User-selected controls.
 * @returns {SkyControls} Complete validated selection.
 */
export function acceptControls(input = {}) {
	if (!input || typeof input !== 'object' || Array.isArray(input))
		throw new TypeError('Numerical controls must be an object.');
	for (const key of Object.keys(input))
		if (!(key in DEFAULTS)) throw new RangeError(`Unsupported numerical control: ${key}`);
	const controls = {
		...DEFAULTS,
		...input,
		incoming: {...(input.incoming ?? DEFAULTS.incoming)},
		viewIntervals: [
			...(input.viewIntervals ?? (input.viewRule === 'altitude-segmented' ? [1] : DEFAULTS.viewIntervals)),
		],
		solarInterpolations: [...(input.solarInterpolations ?? DEFAULTS.solarInterpolations)],
		representations: [...(input.representations ?? DEFAULTS.representations)],
	};
	if (
		![48, 51, 55, 63].includes(controls.altitudeCount) ||
		![27, 39, 51].includes(controls.outgoingWidth) ||
		![20, 40, 80, 160].includes(controls.sourceIntervals) ||
		![40, 60, 80, 160, 320].includes(controls.transportIntervals)
	)
		throw new RangeError('Unsupported numerical count.');
	if (!['quadratic', 'altitude-segmented'].includes(controls.viewRule))
		throw new RangeError('Unsupported final-view rule.');
	validateSelection(controls.viewIntervals, controls.viewRule === 'quadratic' ? [30, 60, 120] : [1, 2, 4, 8, 16]);
	validateSelection(controls.solarInterpolations, ['monotone-cubic', 'linear']);
	validateSelection(controls.representations, [
		'cumulative',
		'grouped',
		'analytic-n1',
		'frozen-increment-analytic-n1',
	]);
	const incoming = controls.incoming;
	if (incoming.kind === 'production-f68') {
		if (Object.keys(incoming).some((key) => key !== 'kind'))
			throw new RangeError('Production F68 does not accept product-rule counts.');
	} else if (incoming.kind === 'gauss-legendre-product') {
		if (
			Object.keys(incoming).some(
				(key) => !['kind', 'muCount', 'azimuthCount', 'azimuthPlacement'].includes(key),
			) ||
			![4, 8, 16, 32].includes(incoming.muCount) ||
			![8, 16, 32, 64].includes(incoming.azimuthCount) ||
			(incoming.azimuthPlacement !== undefined &&
				!['midpoint', 'endpoint-aware'].includes(incoming.azimuthPlacement))
		)
			throw new RangeError('The product rule requires explicit supported cosine and azimuth counts.');
		// Omission and explicit midpoint are the same historical control, including JSON identity.
		if (incoming.azimuthPlacement !== 'endpoint-aware') delete incoming.azimuthPlacement;
	} else throw new RangeError('Unknown incoming quadrature family.');
	return controls;
}

/** Validate a nonempty ordered selection without inferring a mixed union tuple.
 * @param {readonly unknown[]} values - Submitted selection.
 * @param {readonly unknown[]} allowed - Supported literal values.
 * @returns {void}
 */
function validateSelection(values, allowed) {
	if (!values.length || new Set(values).size !== values.length || values.some((value) => !allowed.includes(value)))
		throw new RangeError('View and representation selections must be supported and unique.');
}

/** Positive Gauss-Legendre quadrature on [-1,1], mirrored exactly about zero.
 * @param {number} count - Even node count.
 * @returns {readonly SkyQuadratureNode[]} Increasing nodes and positive weights.
 */
export function gaussLegendre(count) {
	if (![4, 8, 16, 32].includes(count)) throw new RangeError('Unsupported Gauss-Legendre count.');
	const values = new Array(count);
	for (let root = 0; root < count / 2; root++) {
		let x = Math.cos((Math.PI * (root + 0.75)) / (count + 0.5)),
			derivative = 0,
			converged = false;
		for (let iteration = 0; iteration < 64; iteration++) {
			let p0 = 1,
				p1 = x;
			for (let degree = 2; degree <= count; degree++) {
				const next = ((2 * degree - 1) * x * p1 - (degree - 1) * p0) / degree;
				p0 = p1;
				p1 = next;
			}
			derivative = (count * (x * p1 - p0)) / (x * x - 1);
			const next = x - p1 / derivative;
			if (Math.abs(next - x) <= 4 * Number.EPSILON) {
				x = next;
				converged = true;
				break;
			}
			x = next;
		}
		if (!converged) throw new Error('Gauss-Legendre root did not converge.');
		let p0 = 1,
			p1 = x;
		for (let degree = 2; degree <= count; degree++) {
			const next = ((2 * degree - 1) * x * p1 - (degree - 1) * p0) / degree;
			p0 = p1;
			p1 = next;
		}
		derivative = (count * (x * p1 - p0)) / (x * x - 1);
		const weight = 2 / ((1 - x * x) * derivative * derivative);
		if (!(weight > 0) || !Number.isFinite(weight)) throw new Error('Invalid Gaussian integration weight.');
		values[root] = {node: -x, weight};
		values[count - root - 1] = {node: x, weight};
	}
	if (Math.abs(values.reduce((sum, value) => sum + value.weight, 0) - 2) > 1e-13)
		throw new Error('Gaussian weights do not integrate a constant.');
	return values;
}

/** A positive angular ladder with an explicit receiver-local azimuth placement.
 * Historical midpoint pairs retain their exact order and arithmetic. The endpoint-aware
 * rule emits azimuth zero and pi once per cosine ring, with exact positive zero y,
 * then mirrored interior pairs. Equal azimuth weights integrate dmu*dphi without
 * phase-value renormalization. Changing placement is a distinct same-count intervention.
 * @param {number} muCount - Cosine count.
 * @param {number} azimuthCount - Azimuth count.
 * @param {SkyAzimuthPlacement} [azimuthPlacement] - Historical midpoint or named endpoint-aware rule.
 * @returns {SkyIncomingDomain} Explicit receiver-local quadrature.
 */
export function createProductQuadrature(muCount, azimuthCount, azimuthPlacement = 'midpoint') {
	if (![8, 16, 32, 64].includes(azimuthCount)) throw new RangeError('Unsupported azimuth count.');
	if (!['midpoint', 'endpoint-aware'].includes(azimuthPlacement))
		throw new RangeError('Unsupported azimuth placement.');
	const nodes = gaussLegendre(muCount),
		step = (2 * Math.PI) / azimuthCount;
	/** @type {SkyVector3[]} */ const vectors = [];
	const weights = [];
	for (const {node, weight} of nodes) {
		const radial = Math.sqrt(Math.max(0, 1 - node * node));
		if (azimuthPlacement === 'endpoint-aware') {
			vectors.push([radial, 0, node], [-radial, 0, node]);
			weights.push(weight * step, weight * step);
			for (let index = 1; index < azimuthCount / 2; index++) {
				const angle = index * step,
					x = radial * Math.cos(angle),
					y = radial * Math.sin(angle);
				vectors.push([x, y, node], [x, -y, node]);
				weights.push(weight * step, weight * step);
			}
		} else {
			for (let index = 0; index < azimuthCount / 2; index++) {
				const angle = (index + 0.5) * step,
					x = radial * Math.cos(angle),
					y = radial * Math.sin(angle);
				vectors.push([x, y, node], [x, -y, node]);
				weights.push(weight * step, weight * step);
			}
		}
	}
	if (
		vectors.length !== muCount * azimuthCount ||
		Math.abs(weights.reduce((sum, value) => sum + value, 0) - 4 * Math.PI) > 1e-12
	)
		throw new Error('Angular quadrature coverage is invalid.');
	return {
		id:
			azimuthPlacement === 'midpoint'
				? `sky-accuracy-dials-gl-${muCount}x${azimuthCount}-v1`
				: `sky-accuracy-dials-gl-${muCount}x${azimuthCount}-endpoint-aware-v1`,
		directionCount: vectors.length,
		unitVectors: vectors,
		integrationWeightsSteradians: weights,
	};
}

/** Derive only declared numerical interventions from a pinned Native48 request.
 * @param {SkyBuildRequest} baseline - Authenticated physical baseline.
 * @param {SkyControlInput} [input] - Requested independent knobs.
 * @returns {SkyDerivedProfile} Derived request and layout, retaining all parent physical values.
 */
export function deriveProfile(baseline, input = {}) {
	const controls = acceptControls(input),
		original = baseline.transportSpec;
	if (
		original.domains.position.count !== 48 ||
		original.domains.position.nodes.length !== 48 ||
		original.domains.outgoing.faceWidth !== 27 ||
		original.domains.outgoing.directionCount !== 4374 ||
		original.domains.incoming.directionCount !== 68 ||
		original.domains.spectrum.channels.length !== 40 ||
		original.domains.solarZenith.count !== 180 ||
		original.numerical.maximumScatteringOrder !== 4
	)
		throw new RangeError('The starting profile must be the pinned Native48/F68/W27/Z180/Direct40/N4 baseline.');
	if (
		original.atmosphere.ozone.absorptionEnabled !== false ||
		original.numerical.geometryPolicy?.positionMethod !== 'anchored-radial' ||
		(original.shaderProfile?.coordinateContract ?? 'scene-cache-receiver-local-v1') !==
			'scene-cache-receiver-local-v1'
	)
		throw new RangeError('The fixed physical and anchored coordinate controls are required.');
	for (const [index, node] of original.domains.solarZenith.nodes.entries())
		if (node.solarZenithDegrees !== index + 0.5)
			throw new RangeError('The compiler requires fixed Z180 solar nodes.');
	const request = structuredClone(baseline),
		spec = request.transportSpec;
	const additions = controls.altitudeCount - 48,
		firstUpper = original.domains.position.nodes[1].altitudeMeters;
	if (original.domains.position.nodes[0].altitudeMeters !== 0 || firstUpper !== 1875)
		throw new RangeError('Unexpected original near-ground interval.');
	const nodes =
		additions === 0
			? spec.domains.position.nodes
			: [
					spec.domains.position.nodes[0],
					...Array.from({length: additions}, (_unused, index) => ({
						index: index + 1,
						altitudeMeters: ((index + 1) * firstUpper) / (additions + 1),
					})),
					...spec.domains.position.nodes.slice(1),
				].map((node, index) => ({...node, index}));
	const incoming =
		controls.incoming.kind === 'production-f68'
			? spec.domains.incoming
			: createProductQuadrature(
					controls.incoming.muCount,
					controls.incoming.azimuthCount,
					controls.incoming.azimuthPlacement,
				);
	const outgoing =
		controls.outgoingWidth === 27 ? spec.domains.outgoing : createOutgoingDomain(controls.outgoingWidth);
	const buildRequest = {
		...request,
		id: `sky-accuracy-dials-p${controls.altitudeCount}-w${controls.outgoingWidth}-${incoming.id}-s${controls.sourceIntervals}-t${controls.transportIntervals}-n4-v1`,
		transportSpec: {
			...spec,
			domains: {
				...spec.domains,
				position:
					additions === 0
						? spec.domains.position
						: {
								...spec.domains.position,
								id: `sky-accuracy-dials-near-ground-${controls.altitudeCount}-v1`,
								count: controls.altitudeCount,
								nodes,
							},
				incoming,
				outgoing,
			},
			numerical: {
				...spec.numerical,
				sourcePathTransmittanceIntervalCount: controls.sourceIntervals,
				transportIntervalCount: controls.transportIntervals,
			},
		},
	};
	const widthJ = outgoing.directionCount,
		widthL = incoming.directionCount,
		height = nodes.length * 180;
	if (widthJ > 16384 || widthL > 16384 || height > 16384)
		throw new RangeError('Selected domain exceeds the established flattened texture dimensions.');
	return {
		buildRequest,
		controls,
		layout: {widthJ, widthL, height, estimatedPeakFieldBytes: 4 * height * (widthJ + 2 * widthL)},
	};
}
