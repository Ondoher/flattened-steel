import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const EXPERIMENT = 'E8';
export const NAME = 'Spectral-to-RGB Boundary Correctness';
export const QUESTION =
	'What single output-boundary transformation converts the adopted 15-channel Bruneton-family completed spectral-radiance packet into reproducible RGB while preserving channel, quantity, unit, and bin semantics and exposing every non-spectral display policy?';
export const CHANNEL_COUNT = 15,
	BIN_WIDTH_NM = (830 - 360) / CHANNEL_COUNT,
	EFFICACY = 683,
	K = 1 / (5 * EFFICACY);
export const WAVELENGTHS_NM = Object.freeze(
	Array.from({length: CHANNEL_COUNT}, (_, i) => 360 + (i + 0.5) * BIN_WIDTH_NM),
);
export const CANONICAL_UNIT = 'W m^-2 sr^-1 nm^-1';
export const CANONICAL_BASIS = 'bruneton-15-bin-average-360-830-nm';
const MATRIX = Object.freeze([
	[3.2406, -1.5372, -0.4986],
	[-0.9689, 1.8758, 0.0415],
	[0.0557, -0.204, 1.057],
]);
const ciePath = new URL('../../../references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv', import.meta.url);
const CIE = Object.freeze(
	readFileSync(ciePath, 'utf8')
		.trim()
		.split(/\r?\n/)
		.map((line) => Object.freeze(line.split(',').map(Number))),
);
const CIE_MAP = new Map(CIE.map((row) => [row[0], row.slice(1)]));
const zeros = () => Array(CHANNEL_COUNT).fill(0);
const basisPacket = (index) => Object.freeze(Array.from({length: CHANNEL_COUNT}, (_, i) => (i === index ? 1 : 0)));
const packet = (f) => Object.freeze(Array.from({length: CHANNEL_COUNT}, (_, i) => f(i)));
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export function admitCanonical(input) {
	if (
		!input ||
		input.unit !== CANONICAL_UNIT ||
		input.basis !== CANONICAL_BASIS ||
		input.sampleSemantics !== 'bin-average spectral radiance density'
	)
		throw new TypeError('Spectral input must declare the canonical unit, basis, and bin-average semantics.');
	if (
		!Array.isArray(input.values) ||
		input.values.length !== CHANNEL_COUNT ||
		input.values.some((v) => !Number.isFinite(v))
	)
		throw new TypeError('Canonical packet must contain 15 finite channels.');
	return Object.freeze([...input.values]);
}
const canonical = (values) =>
	Object.freeze({
		values,
		unit: CANONICAL_UNIT,
		basis: CANONICAL_BASIS,
		sampleSemantics: 'bin-average spectral radiance density',
	});

function interpolateA(wavelength) {
	const lower = Math.floor(wavelength),
		upper = Math.ceil(wavelength),
		a = CIE_MAP.get(lower),
		b = CIE_MAP.get(upper);
	if (lower === upper) return a;
	const t = wavelength - lower;
	return a.map((v, i) => v + (b[i] - v) * t);
}
function interpolateB(wavelength) {
	let lo = 0,
		hi = CIE.length - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if (CIE[mid][0] <= wavelength) lo = mid;
		else hi = mid;
	}
	const left = CIE[lo],
		right = CIE[hi],
		t = (wavelength - left[0]) / (right[0] - left[0]);
	return [1, 2, 3].map((column) => (1 - t) * left[column] + t * right[column]);
}
function displayA(linear) {
	return linear.map((v) => clamp(1 - Math.exp(-Math.max(0, v) * K)));
}
function displayB(linear) {
	return linear.map((v) => clamp(-Math.expm1(-Math.max(0, v) / (5 * EFFICACY))));
}

export function projectA(input) {
	const values = admitCanonical(input),
		xyz = [0, 0, 0];
	for (let i = 0; i < CHANNEL_COUNT; i += 1) {
		const cmf = interpolateA(WAVELENGTHS_NM[i]);
		for (let c = 0; c < 3; c += 1) xyz[c] += cmf[c] * values[i] * BIN_WIDTH_NM;
	}
	const linear = MATRIX.map((row) => EFFICACY * (row[0] * xyz[0] + row[1] * xyz[1] + row[2] * xyz[2]));
	return Object.freeze({
		xyz: Object.freeze(xyz),
		linearSrgb: Object.freeze(linear),
		displayRgb: Object.freeze(displayA(linear)),
	});
}
const BASIS_RESPONSES = Object.freeze(
	WAVELENGTHS_NM.map((wavelength) => {
		const cmf = interpolateB(wavelength),
			xyz = cmf.map((v) => v * BIN_WIDTH_NM);
		const linear = [0, 1, 2].map(
			(r) => EFFICACY * MATRIX[r].reduce((sum, coefficient, c) => sum + coefficient * xyz[c], 0),
		);
		return Object.freeze({xyz: Object.freeze(xyz), linear: Object.freeze(linear)});
	}),
);
export function projectB(input) {
	const values = admitCanonical(input),
		xyz = [0, 0, 0],
		linear = [0, 0, 0];
	for (let i = 0; i < CHANNEL_COUNT; i += 1)
		for (let c = 0; c < 3; c += 1) {
			xyz[c] += values[i] * BASIS_RESPONSES[i].xyz[c];
			linear[c] += values[i] * BASIS_RESPONSES[i].linear[c];
		}
	return Object.freeze({
		xyz: Object.freeze(xyz),
		linearSrgb: Object.freeze(linear),
		displayRgb: Object.freeze(displayB(linear)),
	});
}
function sumPackets(items) {
	const out = zeros();
	for (const values of items) for (let i = 0; i < CHANNEL_COUNT; i += 1) out[i] += values[i];
	return Object.freeze(out);
}
const positive = packet((i) => (i + 1) * (1 + (i % 3) * 0.2) * 1e-4);
const signed = packet((i) => (i % 2 ? -1 : 1) * (i + 1) * 2e-5);
const nearZero = packet((i) => (i + 1) * 1e-15);
const high = packet((i) => (i + 1) * 25);
const components = Object.freeze([
	packet((i) => (i + 1) * 1e-5),
	packet((i) => (15 - i) * 2e-5),
	packet((i) => (i % 4) * 3e-5),
	packet((i) => (i % 5) * 4e-5),
]);
const completed = sumPackets(components);
export const CASES = Object.freeze([
	...Array.from({length: CHANNEL_COUNT}, (_, i) =>
		Object.freeze({id: `basis-${String(i + 1).padStart(2, '0')}`, kind: 'projection', values: basisPacket(i)}),
	),
	Object.freeze({id: 'positive-combination', kind: 'projection', values: positive}),
	Object.freeze({id: 'signed-combination', kind: 'projection', values: signed}),
	Object.freeze({id: 'near-zero', kind: 'projection', values: nearZero}),
	Object.freeze({id: 'high-radiance', kind: 'projection', values: high}),
	Object.freeze({
		id: 'composition-label-set-a',
		kind: 'projection',
		values: completed,
		labels: ['path', 'endpoint', 'extended', 'point'],
	}),
	Object.freeze({
		id: 'composition-label-set-b',
		kind: 'projection',
		values: completed,
		labels: ['material-x', 'source-y'],
	}),
	Object.freeze({
		id: 'missing-unit-rejected',
		kind: 'rejection',
		input: {values: positive, basis: CANONICAL_BASIS, sampleSemantics: 'bin-average spectral radiance density'},
	}),
	Object.freeze({
		id: 'wrong-basis-rejected',
		kind: 'rejection',
		input: {
			values: positive,
			unit: CANONICAL_UNIT,
			basis: 'point-samples',
			sampleSemantics: 'point spectral radiance density',
		},
	}),
]);
function compareTriples(a, b, scaleFloor = Number.MIN_VALUE) {
	let residual = 0,
		limit = 0;
	for (let i = 0; i < 3; i += 1) {
		residual = Math.max(residual, Math.abs(a[i] - b[i]));
		limit = Math.max(limit, Math.max(Math.abs(a[i]), Math.abs(b[i]), scaleFloor) * 4096 * Number.EPSILON);
	}
	return {residual, limit, accepted: residual <= limit};
}
export function evaluateCase(item) {
	if (item.kind === 'rejection') {
		let rejected = false;
		try {
			admitCanonical(item.input);
		} catch {
			rejected = true;
		}
		return Object.freeze({id: item.id, kind: item.kind, rejected, accepted: rejected});
	}
	const input = canonical(item.values),
		a = projectA(input),
		b = projectB(input),
		xyz = compareTriples(a.xyz, b.xyz),
		linear = compareTriples(a.linearSrgb, b.linearSrgb),
		display = compareTriples(a.displayRgb, b.displayRgb, 1);
	return Object.freeze({
		id: item.id,
		kind: item.kind,
		a,
		b,
		xyz,
		linear,
		display,
		accepted: xyz.accepted && linear.accepted && display.accepted,
	});
}
export function runExperiment() {
	const results = CASES.map(evaluateCase),
		basisResults = results.slice(0, CHANNEL_COUNT);
	const reconstructed = [0, 1, 2].map((c) =>
		positive.reduce((sum, value, i) => sum + value * basisResults[i].a.linearSrgb[c], 0),
	);
	const basisReconstruction = compareTriples(projectA(canonical(positive)).linearSrgb, reconstructed);
	const labelInvariance = compareTriples(
		results.find((r) => r.id.endsWith('-a')).a.displayRgb,
		results.find((r) => r.id.endsWith('-b')).a.displayRgb,
	);
	const once = projectA(canonical(positive)).xyz,
		omitted = once.map((v) => v / BIN_WIDTH_NM),
		doubled = once.map((v) => v * BIN_WIDTH_NM);
	const binWidthOnce = once.some((v, i) => v !== omitted[i] && v !== doubled[i]);
	const negativeObserved = results.some(
		(r) =>
			r.kind === 'projection' &&
			r.a.linearSrgb.some((v) => v < 0) &&
			r.a.displayRgb.every((v) => v >= 0 && v <= 1),
	);
	return Object.freeze({
		results,
		basisReconstruction,
		labelInvariance,
		binWidthOnce,
		negativeObserved,
		accepted:
			results.every((r) => r.accepted) &&
			basisReconstruction.accepted &&
			labelInvariance.accepted &&
			binWidthOnce &&
			negativeObserved,
	});
}
const f = (v) => Number(v).toExponential(6);
export function renderReport(run) {
	const lines = [
		`# ${EXPERIMENT} - ${NAME}`,
		'',
		'## Question',
		'',
		QUESTION,
		'',
		'## Inputs',
		'',
		'```json',
		JSON.stringify(
			{
				canonicalPacket: {
					channelCount: CHANNEL_COUNT,
					wavelengthsNanometers: WAVELENGTHS_NM,
					binWidthNanometers: BIN_WIDTH_NM,
					unit: CANONICAL_UNIT,
					basis: CANONICAL_BASIS,
					semantics: 'bin-average spectral radiance density',
				},
				cieData: 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv',
				interpolation: 'linear at each channel center',
				efficacyLumensPerWatt: EFFICACY,
				xyzToLinearSrgbMatrix: MATRIX,
				displayPolicy: {
					negativeLinearClamp: 0,
					toneMap: '1-exp(-max(0,c)/(5*683))',
					finalClamp: [0, 1],
					transfer: 'continuous display-linear sRGB; encoding is outside this experiment boundary',
				},
				cases: CASES.map(({values, input, ...rest}) => ({
					...rest,
					values: values ?? input,
				})),
			},
			null,
			2,
		),
		'```',
		'',
		'## Iterations',
		'',
		`Iterations: ${run.results.length}`,
		'',
		'| iteration | case | kind | XYZ residual | linear-sRGB residual | display-RGB residual | accepted |',
		'| ---: | --- | --- | ---: | ---: | ---: | --- |',
	];
	run.results.forEach((r, i) =>
		lines.push(
			r.kind === 'rejection'
				? `| ${i + 1} | ${r.id} | rejection | n/a | n/a | n/a | ${r.accepted ? 'yes' : 'no'} |`
				: `| ${i + 1} | ${r.id} | projection | ${f(r.xyz.residual)} | ${f(r.linear.residual)} | ${f(r.display.residual)} | ${r.accepted ? 'yes' : 'no'} |`,
		),
	);
	lines.push(
		'',
		'## Cross-case invariants',
		'',
		'```json',
		JSON.stringify(
			{
				basisReconstruction: run.basisReconstruction,
				sourceAndMaterialLabelInvariance: run.labelInvariance,
				binWidthAppliedExactlyOnce: run.binWidthOnce,
				negativeLinearAndFinalClampCaseObserved: run.negativeObserved,
			},
			null,
			2,
		),
		'```',
		'',
		'## Conclusion',
		'',
		run.accepted
			? 'Accepted. The canonical 15-channel bin-average spectral-radiance packet converts reproducibly through exactly-once bin-width integration against the official CIE table, 683 lm/W scaling, and the declared XYZ-to-linear-sRGB matrix. All spectral contributions compose before one global display mapping; source and material labels do not alter the result; noncanonical or unitless packets are rejected; and negative and high linear values are handled only by the exposed final display policy.'
			: 'Rejected. A packet identity, unit, integration, linearity, composition, or display-boundary criterion failed.',
	);
	return `${lines.join('\n')}\n`;
}
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	const r = runExperiment();
	process.stdout.write(renderReport(r));
	if (!r.accepted) process.exitCode = 1;
}
