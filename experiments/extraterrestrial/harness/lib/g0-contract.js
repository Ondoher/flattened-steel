import { createHash } from 'node:crypto';

export const CELESTIAL_CONTRACT_SCHEMA_VERSION = 'celestial-contract-v1';
export const G0_DECISION_MANIFEST_SCHEMA_VERSION = 'g0-decision-manifest-v1';
export const G0_CONTAINMENT_EVIDENCE_SCHEMA_VERSION = 'g0-containment-evidence-v1';
export const G0_PROOF_ID = 'g0-boundary-and-contract-v1';

const FAMILY_ID = 'spherical-sun-stars-radial-v1';
const FIXTURE_ID = 'g0-synthetic-celestial-v1';
const MANIFEST_ID = 'stage12-g0-contract-v1';
const SOURCE_ROOT = 'experiments/extraterrestrial';
const OUTPUT_ROOT = 'tmp/extraterrestrial';
const POINT_MEMBER_CAPACITY = 16;
const SPECTRAL_CHANNEL_COUNT = 15;
const NATIVE_BASIS_ID = 'algorithm32-native-15-spectral-basis-v1';
const NATIVE_BASIS_FINGERPRINT =
	'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891';
const SPECTRAL_SEMANTICS = 'contiguous-wavelength-bin-average';
const PROVIDER_ID = 'etx-analytic-placement-provider-v1';
const PROVIDER_FINGERPRINT =
	'sha256:c513ae1c686f022f89153515cef956167e119f84b2fad4963a70489c291f8a35';
const CELESTIAL_FRAME_ID = 'etx-synthetic-celestial-rh-v1';
const BODY_FRAME_ID = 'etx-synthetic-body-fixed-rh-v1';
const MODEL_FRAME_ID = 'etx-synthetic-model-rh-y-up-v1';
const TIME_SCALE = 'etx-synthetic-linear-seconds-v1';
const ORIGIN_CONVENTION = 'observer-independent-infinite-direction';
const DIRECTION_CONVENTION = 'receiver-to-source';
const RECEIVER_ID = 'etx-equator-one-kilometer-v1';
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const DECISION_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/u;
const VECTOR_TOLERANCE = 1e-12;

const EXACT_BODY_FROM_CELESTIAL = Object.freeze([
	Object.freeze([0, -1, 0]),
	Object.freeze([1, 0, 0]),
	Object.freeze([0, 0, 1]),
]);
const EXACT_MODEL_FROM_BODY = Object.freeze([
	Object.freeze([1, 0, 0]),
	Object.freeze([0, 0, 1]),
	Object.freeze([0, -1, 0]),
]);
const EXACT_MODEL_FROM_CELESTIAL = Object.freeze([
	Object.freeze([0, -1, 0]),
	Object.freeze([0, 0, 1]),
	Object.freeze([-1, 0, 0]),
]);

const REQUIRED_DECISIONS = Object.freeze({
	'architecture.owner-map': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'architecture.cache-slots': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'composition.order': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'spectral.native-15-basis': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'source.quantity-contract': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'roster.first-family': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'identity.static-vs-live': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'identity.camera-exclusion': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'live-state.packet-semantics': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'sun.shared-canonical-identity': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'capability.first-family': Object.freeze({
		status: 'fixed',
		ownerGoal: 'G0',
	}),
	'capacity.point-members': Object.freeze({
		status: 'provisional',
		ownerGoal: 'G0',
		reconsiderByGoal: 'G6',
	}),
	'api.internal-live-ingress-names': Object.freeze({
		status: 'provisional',
		ownerGoal: 'G0',
		reconsiderByGoal: '12.10',
	}),
	'field.coordinates-and-stencils': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G1',
		reconsiderByGoal: 'G1',
	}),
	'transport.point-controls-and-tolerances': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G3',
		reconsiderByGoal: 'G3',
	}),
	'transport.sun-controls-and-tolerances': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G4',
		reconsiderByGoal: 'G4',
	}),
	'raster.visibility-response-quadrature': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G5',
		reconsiderByGoal: 'G5',
	}),
	'gpu.executor-packing-and-final-capacity': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G6',
		reconsiderByGoal: 'G6',
	}),
	'browser.live-gpu-adapter': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G7',
		reconsiderByGoal: 'G7',
	}),
	'qualification.hardware-and-budgets': Object.freeze({
		status: 'deferred',
		ownerGoal: 'G8',
		reconsiderByGoal: 'G8',
	}),
	'api.public-contract-names': Object.freeze({
		status: 'deferred',
		ownerGoal: '12.10',
		reconsiderByGoal: '12.10',
	}),
});

export const REQUIRED_G0_PROOF_ASSERTIONS = Object.freeze([
	'baseline.candidate-identical',
	'claim.g0-only',
	'containment.boundary-evidence',
	'fixture.schema-and-typed-measures',
	'geometry.exact-named-frame-transforms',
	'identity.camera-excluded',
	'identity.placement-only-query-change',
	'negative.classified-contract-errors',
	'roster.canonical-layer-and-member-order',
	'sun.shared-canonical-identity',
]);

const REQUIRED_CONTAINMENT_FLAGS = Object.freeze([
	'baselineImmutable',
	'baselineProbesPassed',
	'candidateByteIdentical',
	'contentReferencesVerified',
	'dependencyClosureContained',
	'generatedOutputUntracked',
	'immutableRunProtocolVerified',
	'outputRootIgnored',
	'outputWritesContained',
	'protectedFingerprintsUnchanged',
	'sourceWritesContained',
	'symlinkAndJunctionEscapesRejected',
]);

/**
 * A stable, machine-classified G0 contract rejection.
 */
export class G0ContractError extends Error {
	/**
	 * @param {string} code Stable error code.
	 * @param {string} path JSON-style path to the rejected value.
	 * @param {string} message Human-readable explanation.
	 * @param {string} [classification] Broad failure classification.
	 */
	constructor(code, path, message, classification = 'contract') {
		super(message);
		this.name = 'G0ContractError';
		this.code = code;
		this.path = path;
		this.classification = classification;
	}
}

function reject(code, path, message, classification = 'contract') {
	throw new G0ContractError(code, path, message, classification);
}

function isPlainObject(value) {
	if (value == null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function requireObject(value, path) {
	if (!isPlainObject(value)) {
		reject('SCHEMA_TYPE_MISMATCH', path, `${path} must be a plain object.`, 'schema');
	}
	return value;
}

function requireArray(value, path) {
	if (!Array.isArray(value)) {
		reject('SCHEMA_TYPE_MISMATCH', path, `${path} must be an array.`, 'schema');
	}
	return value;
}

function requireString(value, path) {
	if (typeof value !== 'string' || value.length === 0) {
		reject('SCHEMA_TYPE_MISMATCH', path, `${path} must be a nonempty string.`, 'schema');
	}
	return value;
}

function requireFiniteNumber(value, path) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		reject('SCHEMA_TYPE_MISMATCH', path, `${path} must be a finite number.`, 'schema');
	}
	return value;
}

function requireInteger(value, path) {
	if (!Number.isSafeInteger(value)) {
		reject('SCHEMA_TYPE_MISMATCH', path, `${path} must be a safe integer.`, 'schema');
	}
	return value;
}

function requireFingerprint(value, path) {
	requireString(value, path);
	if (!SHA256_PATTERN.test(value)) {
		reject('FINGERPRINT_FORMAT_INVALID', path, `${path} must be a sha256 fingerprint.`, 'identity');
	}
	return value;
}

function requireExact(value, expected, code, path, message, classification = 'contract') {
	if (value !== expected) {
		reject(code, path, message, classification);
	}
	return value;
}

function unknownFieldCode(key) {
	if (/camera|projection|fov|viewport|pixel|display|exposure|depthbuffer/iu.test(key)) {
		return 'CAMERA_FIELD_PROHIBITED';
	}
	if (/opaque|opacity|foreground/iu.test(key)) {
		return 'OPAQUE_LAYER_UNSUPPORTED';
	}
	return 'SCHEMA_UNKNOWN_FIELD';
}

function requireOnlyKeys(object, allowedKeys, path) {
	const allowed = new Set(allowedKeys);
	for (const key of Object.keys(object)) {
		if (!allowed.has(key)) {
			reject(
				unknownFieldCode(key),
				`${path}.${key}`,
				`${path}.${key} is not part of the G0 contract.`,
				unknownFieldCode(key) === 'SCHEMA_UNKNOWN_FIELD' ? 'schema' : 'capability',
			);
		}
	}
}

/**
 * Serialize JSON-compatible data with deterministic object-key ordering.
 *
 * @param {unknown} value JSON-compatible value.
 * @param {string} [path] Diagnostic path.
 * @returns {string} Canonical JSON text.
 */
export function canonicalJson(value, path = '$') {
	if (value === null) {
		return 'null';
	}
	if (typeof value === 'string' || typeof value === 'boolean') {
		return JSON.stringify(value);
	}
	if (typeof value === 'number') {
		requireFiniteNumber(value, path);
		return JSON.stringify(Object.is(value, -0) ? 0 : value);
	}
	if (Array.isArray(value)) {
		return `[${value.map((item, index) => canonicalJson(item, `${path}[${index}]`)).join(',')}]`;
	}
	if (isPlainObject(value)) {
		const entries = Object.keys(value)
			.sort()
			.map((key) => {
				const child = value[key];
				if (child === undefined) {
					reject(
						'CANONICAL_VALUE_UNSUPPORTED',
						`${path}.${key}`,
						'Undefined values cannot be fingerprinted.',
						'identity',
					);
				}
				return `${JSON.stringify(key)}:${canonicalJson(child, `${path}.${key}`)}`;
			});
		return `{${entries.join(',')}}`;
	}
	reject(
		'CANONICAL_VALUE_UNSUPPORTED',
		path,
		`${path} is not canonical JSON data.`,
		'identity',
	);
}

/**
 * Return the deterministic SHA-256 identity of JSON-compatible data.
 *
 * @param {unknown} value Identity-bearing value.
 * @returns {string} sha256-prefixed fingerprint.
 */
export function canonicalFingerprint(value) {
	return `sha256:${createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`;
}

function canonicalClone(value) {
	return JSON.parse(canonicalJson(value));
}

function sameCanonicalValue(left, right) {
	return canonicalJson(left) === canonicalJson(right);
}

function compareCanonicalStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function without(object, excludedKeys) {
	const excluded = new Set(excludedKeys);
	return Object.fromEntries(
		Object.entries(object).filter(([key]) => !excluded.has(key)),
	);
}

function multiplyMatrixVector(matrix, vector) {
	return matrix.map((row) =>
		row.reduce((sum, coefficient, index) => sum + coefficient * vector[index], 0));
}

function multiplyMatrices(left, right) {
	return left.map((row) =>
		right[0].map((_value, columnIndex) =>
			row.reduce(
				(sum, coefficient, index) => sum + coefficient * right[index][columnIndex],
				0,
			)));
}

function determinant3(matrix) {
	return (
		matrix[0][0] * (
			matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]
		)
		- matrix[0][1] * (
			matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]
		)
		+ matrix[0][2] * (
			matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]
		)
	);
}

function vectorLength(vector) {
	return Math.sqrt(vector.reduce((sum, component) => sum + component * component, 0));
}

function dot(left, right) {
	return left.reduce((sum, component, index) => sum + component * right[index], 0);
}

function vectorsNear(left, right, tolerance = VECTOR_TOLERANCE) {
	return (
		Array.isArray(left)
		&& Array.isArray(right)
		&& left.length === right.length
		&& left.every((value, index) =>
			Math.abs(value - right[index]) <= tolerance)
	);
}

function requireVector3(value, path, { unit = false } = {}) {
	const vector = requireArray(value, path);
	if (vector.length !== 3) {
		reject('VECTOR_SHAPE_INVALID', path, `${path} must contain exactly three components.`, 'schema');
	}
	vector.forEach((component, index) => requireFiniteNumber(component, `${path}[${index}]`));
	if (unit && Math.abs(vectorLength(vector) - 1) > VECTOR_TOLERANCE) {
		reject('DIRECTION_NOT_UNIT', path, `${path} must be a unit vector.`, 'placement');
	}
	return [...vector];
}

function requireMatrix3(value, path) {
	const rows = requireArray(value, path);
	if (rows.length !== 3) {
		reject('MATRIX_SHAPE_INVALID', path, `${path} must have three rows.`, 'schema');
	}
	return rows.map((row, index) => requireVector3(row, `${path}[${index}]`));
}

function normalizeEpoch(value, path) {
	const epoch = requireObject(value, path);
	requireOnlyKeys(epoch, ['value', 'units', 'timeScale'], path);
	requireFiniteNumber(epoch.value, `${path}.value`);
	requireExact(
		epoch.units,
		'seconds',
		'EPOCH_UNITS_MISMATCH',
		`${path}.units`,
		'The G0 synthetic epoch is expressed in seconds.',
		'placement',
	);
	requireExact(
		epoch.timeScale,
		TIME_SCALE,
		'TIME_SCALE_MISMATCH',
		`${path}.timeScale`,
		'Placement state uses an incompatible time scale.',
		'placement',
	);
	return canonicalClone(epoch);
}

function normalizeSpectralBasis(value, path) {
	const basis = requireObject(value, path);
	requireOnlyKeys(
		basis,
		['kind', 'id', 'schemaRevision', 'semantics', 'channelCount', 'channels', 'contentHash'],
		path,
	);
	requireExact(
		basis.kind,
		'algorithm32-spectral-basis',
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.kind`,
		'The G0 fixture requires the Algorithm32 native spectral basis.',
		'spectral',
	);
	requireExact(
		basis.id,
		NATIVE_BASIS_ID,
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.id`,
		'The G0 fixture requires the native 15-channel basis.',
		'spectral',
	);
	requireExact(
		basis.schemaRevision,
		'algorithm32-spectral-basis-v1',
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.schemaRevision`,
		'The spectral-basis schema revision is incompatible.',
		'spectral',
	);
	requireExact(
		basis.semantics,
		SPECTRAL_SEMANTICS,
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.semantics`,
		'The spectral sample semantics are incompatible.',
		'spectral',
	);
	requireExact(
		basis.channelCount,
		SPECTRAL_CHANNEL_COUNT,
		'SPECTRAL_CHANNEL_COUNT_MISMATCH',
		`${path}.channelCount`,
		'The G0 fixture requires exactly 15 channels.',
		'spectral',
	);
	const channels = requireArray(basis.channels, `${path}.channels`);
	if (channels.length !== SPECTRAL_CHANNEL_COUNT) {
		reject(
			'SPECTRAL_CHANNEL_COUNT_MISMATCH',
			`${path}.channels`,
			'The native basis must contain exactly 15 channel descriptors.',
			'spectral',
		);
	}
	const channelIds = new Set();
	for (let index = 0; index < channels.length; index += 1) {
		const channelPath = `${path}.channels[${index}]`;
		const channel = requireObject(channels[index], channelPath);
		requireOnlyKeys(channel, ['id', 'center', 'width'], channelPath);
		requireString(channel.id, `${channelPath}.id`);
		if (channelIds.has(channel.id)) {
			reject(
				'SPECTRAL_CHANNEL_DUPLICATE',
				`${channelPath}.id`,
				'The spectral basis contains a duplicate channel id.',
				'spectral',
			);
		}
		channelIds.add(channel.id);
		for (const componentName of ['center', 'width']) {
			const componentPath = `${channelPath}.${componentName}`;
			const component = requireObject(channel[componentName], componentPath);
			requireOnlyKeys(component, ['value', 'units'], componentPath);
			requireFiniteNumber(component.value, `${componentPath}.value`);
			requireExact(
				component.units,
				'nanometers',
				'SPECTRAL_BASIS_MISMATCH',
				`${componentPath}.units`,
				'Native basis wavelengths and widths use nanometers.',
				'spectral',
			);
		}
		if (channel.width.value <= 0) {
			reject(
				'SPECTRAL_BASIS_MISMATCH',
				`${channelPath}.width.value`,
				'Spectral channel width must be positive.',
				'spectral',
			);
		}
	}
	requireFingerprint(basis.contentHash, `${path}.contentHash`);
	// Production's SpectralBasis identity derives channelCount from channels,
	// so channelCount is validated above but is not part of its content hash.
	const computedHash = canonicalFingerprint(without(basis, ['channelCount', 'contentHash']));
	if (computedHash !== basis.contentHash || computedHash !== NATIVE_BASIS_FINGERPRINT) {
		reject(
			'SPECTRAL_BASIS_MISMATCH',
			`${path}.contentHash`,
			'The native basis content fingerprint does not match its channel data.',
			'spectral',
		);
	}
	return canonicalClone(basis);
}

function normalizeProviderContract(value, path) {
	const provider = requireObject(value, path);
	requireOnlyKeys(
		provider,
		[
			'id',
			'frameId',
			'originConvention',
			'directionConvention',
			'timeScale',
			'placementForms',
			'provenanceLabel',
			'contentFingerprint',
		],
		path,
	);
	requireExact(
		provider.id,
		PROVIDER_ID,
		'PROVIDER_MISMATCH',
		`${path}.id`,
		'The fixture requires the named analytic placement provider.',
		'placement',
	);
	requireExact(
		provider.frameId,
		CELESTIAL_FRAME_ID,
		'FRAME_MISMATCH',
		`${path}.frameId`,
		'The placement provider uses the wrong celestial frame.',
		'placement',
	);
	requireExact(
		provider.originConvention,
		ORIGIN_CONVENTION,
		'ORIGIN_MISMATCH',
		`${path}.originConvention`,
		'The placement provider uses the wrong origin convention.',
		'placement',
	);
	requireExact(
		provider.directionConvention,
		DIRECTION_CONVENTION,
		'DIRECTION_CONVENTION_MISMATCH',
		`${path}.directionConvention`,
		'The placement provider uses the wrong direction convention.',
		'placement',
	);
	requireExact(
		provider.timeScale,
		TIME_SCALE,
		'TIME_SCALE_MISMATCH',
		`${path}.timeScale`,
		'The placement provider uses the wrong time scale.',
		'placement',
	);
	const placementForms = requireArray(provider.placementForms, `${path}.placementForms`);
	if (!sameCanonicalValue([...placementForms].sort(), ['distant-direction', 'infinite-direction'])) {
		reject(
			'PROVIDER_MISMATCH',
			`${path}.placementForms`,
			'The placement provider must support exactly the first-family placement forms.',
			'placement',
		);
	}
	requireExact(
		provider.provenanceLabel,
		'synthetic-mechanics-only-no-astronomy-claim',
		'PROVENANCE_MISMATCH',
		`${path}.provenanceLabel`,
		'The synthetic provider must remain explicitly non-astronomical.',
		'provenance',
	);
	requireFingerprint(provider.contentFingerprint, `${path}.contentFingerprint`);
	const computedHash = canonicalFingerprint(without(provider, ['contentFingerprint']));
	if (computedHash !== provider.contentFingerprint || computedHash !== PROVIDER_FINGERPRINT) {
		reject(
			'PROVIDER_FINGERPRINT_MISMATCH',
			`${path}.contentFingerprint`,
			'The placement-provider fingerprint does not match the contract.',
			'identity',
		);
	}
	return canonicalClone(provider);
}

function normalizeSpectralMeasure(value, sourceKind, basis, path) {
	const measure = requireObject(value, path);
	requireOnlyKeys(
		measure,
		[
			'quantity',
			'units',
			'basisId',
			'basisFingerprint',
			'semantics',
			'values',
			'provenance',
		],
		path,
	);
	const expectedQuantity = sourceKind === 'point'
		? 'spectral-irradiance-density'
		: 'spectral-radiance-density';
	const expectedUnits = sourceKind === 'point'
		? 'W m^-2 nm^-1'
		: 'W m^-2 sr^-1 nm^-1';
	requireExact(
		measure.quantity,
		expectedQuantity,
		'SOURCE_KIND_MEASURE_MISMATCH',
		`${path}.quantity`,
		'Source kind and spectral measure are incompatible.',
		'spectral',
	);
	requireExact(
		measure.units,
		expectedUnits,
		'SPECTRAL_UNITS_MISMATCH',
		`${path}.units`,
		'The spectral measure uses incompatible units.',
		'spectral',
	);
	requireExact(
		measure.basisId,
		basis.id,
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.basisId`,
		'The source measure uses the wrong spectral basis.',
		'spectral',
	);
	requireFingerprint(measure.basisFingerprint, `${path}.basisFingerprint`);
	requireExact(
		measure.basisFingerprint,
		basis.contentHash,
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.basisFingerprint`,
		'The source measure basis fingerprint does not match the fixture basis.',
		'spectral',
	);
	requireExact(
		measure.semantics,
		basis.semantics,
		'SPECTRAL_BASIS_MISMATCH',
		`${path}.semantics`,
		'The source measure uses the wrong sample semantics.',
		'spectral',
	);
	const values = requireArray(measure.values, `${path}.values`);
	if (values.length !== SPECTRAL_CHANNEL_COUNT) {
		reject(
			'SPECTRAL_CHANNEL_COUNT_MISMATCH',
			`${path}.values`,
			'Every source measure must contain exactly 15 values.',
			'spectral',
		);
	}
	values.forEach((sample, index) => {
		requireFiniteNumber(sample, `${path}.values[${index}]`);
		if (sample < 0) {
			reject(
				'SPECTRAL_VALUE_INVALID',
				`${path}.values[${index}]`,
				'Fixture spectral values must be nonnegative.',
				'spectral',
			);
		}
	});
	const provenance = requireObject(measure.provenance, `${path}.provenance`);
	requireOnlyKeys(provenance, ['label', 'uncertaintyStatus'], `${path}.provenance`);
	requireString(provenance.label, `${path}.provenance.label`);
	requireExact(
		provenance.uncertaintyStatus,
		'synthetic-exact',
		'PROVENANCE_MISMATCH',
		`${path}.provenance.uncertaintyStatus`,
		'G0 mechanics values are labeled synthetic-exact.',
		'provenance',
	);
	return canonicalClone(measure);
}

function normalizeSupport(value, sourceKind, path) {
	const support = requireObject(value, path);
	if (sourceKind === 'point') {
		requireOnlyKeys(support, ['kind'], path);
		requireExact(
			support.kind,
			'point',
			'POINT_SUPPORT_MISMATCH',
			`${path}.kind`,
			'Point sources must use point support.',
			'capability',
		);
		return canonicalClone(support);
	}
	requireOnlyKeys(support, ['kind', 'angularRadius'], path);
	requireExact(
		support.kind,
		'uniform-disk',
		'EXTENDED_SUPPORT_UNSUPPORTED',
		`${path}.kind`,
		'The first extended family supports only a uniform disk.',
		'capability',
	);
	const radius = requireObject(support.angularRadius, `${path}.angularRadius`);
	requireOnlyKeys(radius, ['value', 'units'], `${path}.angularRadius`);
	requireFiniteNumber(radius.value, `${path}.angularRadius.value`);
	if (radius.value <= 0 || radius.value >= Math.PI / 2) {
		reject(
			'ANGULAR_SUPPORT_INVALID',
			`${path}.angularRadius.value`,
			'The distant uniform disk requires a positive bounded angular radius.',
			'capability',
		);
	}
	requireExact(
		radius.units,
		'radians',
		'ANGULAR_SUPPORT_UNITS_MISMATCH',
		`${path}.angularRadius.units`,
		'Angular support is expressed in radians.',
		'capability',
	);
	return canonicalClone(support);
}

function normalizeSourceDefinition(value, basis, provider, path) {
	const source = requireObject(value, path);
	requireOnlyKeys(
		source,
		[
			'sourceId',
			'sourceKind',
			'placementKind',
			'depth',
			'spectralMeasure',
			'support',
			'placementProviderContractFingerprint',
			'radiometryFingerprint',
			'supportFingerprint',
			'sourceDefinitionFingerprint',
		],
		path,
	);
	requireString(source.sourceId, `${path}.sourceId`);
	if (!ID_PATTERN.test(source.sourceId)) {
		reject(
			'SOURCE_ID_INVALID',
			`${path}.sourceId`,
			'Source ids must be lowercase kebab identifiers.',
			'schema',
		);
	}
	if (!['point', 'extended'].includes(source.sourceKind)) {
		reject(
			'SOURCE_KIND_UNSUPPORTED',
			`${path}.sourceKind`,
			'The first family supports only point and extended source kinds.',
			'capability',
		);
	}
	const expectedPlacementKind = source.sourceKind === 'point'
		? 'infinite-direction'
		: 'distant-direction';
	requireExact(
		source.placementKind,
		expectedPlacementKind,
		'FINITE_PLACEMENT_UNSUPPORTED',
		`${path}.placementKind`,
		'The first family supports only infinite point and distant extended placement.',
		'capability',
	);
	requireExact(
		source.depth,
		'infinite',
		'FINITE_PLACEMENT_UNSUPPORTED',
		`${path}.depth`,
		'The first family rejects finite celestial depth.',
		'capability',
	);
	const spectralMeasure = normalizeSpectralMeasure(
		source.spectralMeasure,
		source.sourceKind,
		basis,
		`${path}.spectralMeasure`,
	);
	const support = normalizeSupport(source.support, source.sourceKind, `${path}.support`);
	requireFingerprint(
		source.placementProviderContractFingerprint,
		`${path}.placementProviderContractFingerprint`,
	);
	requireExact(
		source.placementProviderContractFingerprint,
		provider.contentFingerprint,
		'PROVIDER_MISMATCH',
		`${path}.placementProviderContractFingerprint`,
		'The source definition references an incompatible placement provider.',
		'placement',
	);

	const radiometryFingerprint = canonicalFingerprint(spectralMeasure);
	const supportFingerprint = canonicalFingerprint(support);
	if (
		source.radiometryFingerprint != null
		&& source.radiometryFingerprint !== radiometryFingerprint
	) {
		reject(
			'RADIOMETRY_FINGERPRINT_MISMATCH',
			`${path}.radiometryFingerprint`,
			'The supplied radiometry fingerprint is stale or malformed.',
			'identity',
		);
	}
	if (
		source.supportFingerprint != null
		&& source.supportFingerprint !== supportFingerprint
	) {
		reject(
			'SUPPORT_FINGERPRINT_MISMATCH',
			`${path}.supportFingerprint`,
			'The supplied support fingerprint is stale or malformed.',
			'identity',
		);
	}
	const definitionIdentity = {
		sourceId: source.sourceId,
		sourceKind: source.sourceKind,
		placementKind: source.placementKind,
		depth: source.depth,
		radiometryFingerprint,
		supportFingerprint,
		placementProviderContractFingerprint: source.placementProviderContractFingerprint,
	};
	const sourceDefinitionFingerprint = canonicalFingerprint(definitionIdentity);
	if (
		source.sourceDefinitionFingerprint != null
		&& source.sourceDefinitionFingerprint !== sourceDefinitionFingerprint
	) {
		reject(
			'SOURCE_DEFINITION_FINGERPRINT_MISMATCH',
			`${path}.sourceDefinitionFingerprint`,
			'The supplied source-definition fingerprint is stale or malformed.',
			'identity',
		);
	}
	return {
		sourceId: source.sourceId,
		sourceKind: source.sourceKind,
		placementKind: source.placementKind,
		depth: source.depth,
		spectralMeasure,
		support,
		placementProviderContractFingerprint: source.placementProviderContractFingerprint,
		radiometryFingerprint,
		supportFingerprint,
		sourceDefinitionFingerprint,
	};
}

function normalizeGeometry(value, path) {
	const geometry = requireObject(value, path);
	requireOnlyKeys(geometry, ['body', 'frames', 'transforms', 'receiver'], path);

	const body = requireObject(geometry.body, `${path}.body`);
	requireOnlyKeys(body, ['bodyId', 'bottomRadius', 'topRadius'], `${path}.body`);
	requireExact(
		body.bodyId,
		'etx-synthetic-spherical-body-v1',
		'GEOMETRY_FIXTURE_MISMATCH',
		`${path}.body.bodyId`,
		'The G0 fixture uses one named synthetic spherical body.',
		'geometry',
	);
	for (const [name, expected] of [['bottomRadius', 6360000], ['topRadius', 6420000]]) {
		const valuePath = `${path}.body.${name}`;
		const unitValue = requireObject(body[name], valuePath);
		requireOnlyKeys(unitValue, ['value', 'units'], valuePath);
		requireExact(
			unitValue.value,
			expected,
			'GEOMETRY_FIXTURE_MISMATCH',
			`${valuePath}.value`,
			'The synthetic body radius differs from the frozen mechanics fixture.',
			'geometry',
		);
		requireExact(
			unitValue.units,
			'meters',
			'GEOMETRY_UNITS_MISMATCH',
			`${valuePath}.units`,
			'Spherical-body radii use meters.',
			'geometry',
		);
	}

	const frames = requireObject(geometry.frames, `${path}.frames`);
	requireOnlyKeys(frames, ['celestial', 'body', 'model'], `${path}.frames`);
	const celestialFrame = requireObject(frames.celestial, `${path}.frames.celestial`);
	requireOnlyKeys(
		celestialFrame,
		['frameId', 'handedness', 'axisMeaning'],
		`${path}.frames.celestial`,
	);
	requireExact(
		celestialFrame.frameId,
		CELESTIAL_FRAME_ID,
		'FRAME_MISMATCH',
		`${path}.frames.celestial.frameId`,
		'The fixture celestial frame id is wrong.',
		'geometry',
	);
	requireExact(
		celestialFrame.handedness,
		'right',
		'FRAME_MISMATCH',
		`${path}.frames.celestial.handedness`,
		'The fixture celestial frame is right handed.',
		'geometry',
	);
	if (!sameCanonicalValue(celestialFrame.axisMeaning, ['+x-reference', '+y-east', '+z-north'])) {
		reject(
			'FRAME_MISMATCH',
			`${path}.frames.celestial.axisMeaning`,
			'The fixture celestial axes are not the frozen named axes.',
			'geometry',
		);
	}
	for (const [name, expectedId] of [['body', BODY_FRAME_ID], ['model', MODEL_FRAME_ID]]) {
		const framePath = `${path}.frames.${name}`;
		const frame = requireObject(frames[name], framePath);
		const allowed = name === 'model'
			? ['frameId', 'handedness', 'units']
			: ['frameId', 'handedness'];
		requireOnlyKeys(frame, allowed, framePath);
		requireExact(
			frame.frameId,
			expectedId,
			'FRAME_MISMATCH',
			`${framePath}.frameId`,
			'The named fixture frame is incompatible.',
			'geometry',
		);
		requireExact(
			frame.handedness,
			'right',
			'FRAME_MISMATCH',
			`${framePath}.handedness`,
			'Every mechanics fixture frame is right handed.',
			'geometry',
		);
		if (name === 'model') {
			requireExact(
				frame.units,
				'meters',
				'GEOMETRY_UNITS_MISMATCH',
				`${framePath}.units`,
				'The fixture model frame uses meters.',
				'geometry',
			);
		}
	}

	const transforms = requireObject(geometry.transforms, `${path}.transforms`);
	requireOnlyKeys(
		transforms,
		['bodyFromCelestial', 'modelFromBody', 'modelFromCelestial'],
		`${path}.transforms`,
	);
	const bodyFromCelestial = requireMatrix3(
		transforms.bodyFromCelestial,
		`${path}.transforms.bodyFromCelestial`,
	);
	const modelFromBody = requireMatrix3(
		transforms.modelFromBody,
		`${path}.transforms.modelFromBody`,
	);
	const modelFromCelestial = requireMatrix3(
		transforms.modelFromCelestial,
		`${path}.transforms.modelFromCelestial`,
	);
	if (!sameCanonicalValue(bodyFromCelestial, EXACT_BODY_FROM_CELESTIAL)) {
		reject(
			'TRANSFORM_CONTRACT_MISMATCH',
			`${path}.transforms.bodyFromCelestial`,
			'The celestial-to-body transform differs from the frozen fixture.',
			'geometry',
		);
	}
	if (!sameCanonicalValue(modelFromBody, EXACT_MODEL_FROM_BODY)) {
		reject(
			'TRANSFORM_CONTRACT_MISMATCH',
			`${path}.transforms.modelFromBody`,
			'The body-to-model transform differs from the frozen fixture.',
			'geometry',
		);
	}
	const composed = multiplyMatrices(modelFromBody, bodyFromCelestial);
	if (
		!sameCanonicalValue(modelFromCelestial, EXACT_MODEL_FROM_CELESTIAL)
		|| !sameCanonicalValue(modelFromCelestial, composed)
	) {
		reject(
			'TRANSFORM_CONTRACT_MISMATCH',
			`${path}.transforms.modelFromCelestial`,
			'The combined celestial-to-model transform is not the exact matrix product.',
			'geometry',
		);
	}
	for (const [name, matrix] of [
		['bodyFromCelestial', bodyFromCelestial],
		['modelFromBody', modelFromBody],
		['modelFromCelestial', modelFromCelestial],
	]) {
		if (Math.abs(determinant3(matrix) - 1) > VECTOR_TOLERANCE) {
			reject(
				'TRANSFORM_HANDEDNESS_INVALID',
				`${path}.transforms.${name}`,
				'Fixture transforms must preserve a right-handed orthonormal basis.',
				'geometry',
			);
		}
	}

	const receiver = requireObject(geometry.receiver, `${path}.receiver`);
	requireOnlyKeys(
		receiver,
		[
			'receiverId',
			'geographic',
			'bodyPositionModelMeters',
			'receiverPositionModelMeters',
			'upModel',
		],
		`${path}.receiver`,
	);
	requireExact(
		receiver.receiverId,
		RECEIVER_ID,
		'RECEIVER_MISMATCH',
		`${path}.receiver.receiverId`,
		'The fixture receiver id is incompatible.',
		'geometry',
	);
	const geographic = requireObject(receiver.geographic, `${path}.receiver.geographic`);
	requireOnlyKeys(
		geographic,
		['latitude', 'longitude', 'altitude'],
		`${path}.receiver.geographic`,
	);
	for (const [name, expectedValue, expectedUnits] of [
		['latitude', 0, 'degrees'],
		['longitude', 0, 'degrees'],
		['altitude', 1000, 'meters'],
	]) {
		const valuePath = `${path}.receiver.geographic.${name}`;
		const unitValue = requireObject(geographic[name], valuePath);
		requireOnlyKeys(unitValue, ['value', 'units'], valuePath);
		requireExact(
			unitValue.value,
			expectedValue,
			'RECEIVER_MISMATCH',
			`${valuePath}.value`,
			'The receiver differs from the frozen equatorial fixture.',
			'geometry',
		);
		requireExact(
			unitValue.units,
			expectedUnits,
			'GEOMETRY_UNITS_MISMATCH',
			`${valuePath}.units`,
			'The receiver coordinate uses incompatible units.',
			'geometry',
		);
	}
	const bodyPosition = requireVector3(
		receiver.bodyPositionModelMeters,
		`${path}.receiver.bodyPositionModelMeters`,
	);
	const receiverPosition = requireVector3(
		receiver.receiverPositionModelMeters,
		`${path}.receiver.receiverPositionModelMeters`,
	);
	const upModel = requireVector3(receiver.upModel, `${path}.receiver.upModel`, { unit: true });
	if (
		!sameCanonicalValue(bodyPosition, [6361000, 0, 0])
		|| !sameCanonicalValue(receiverPosition, [6361000, 0, 0])
		|| !sameCanonicalValue(upModel, [1, 0, 0])
	) {
		reject(
			'RECEIVER_MISMATCH',
			`${path}.receiver`,
			'The receiver model packet differs from the frozen mechanics fixture.',
			'geometry',
		);
	}
	return {
		body: canonicalClone(body),
		frames: canonicalClone(frames),
		transforms: {
			bodyFromCelestial,
			modelFromBody,
			modelFromCelestial,
		},
		receiver: canonicalClone(receiver),
	};
}

function normalizeRoster(value, sourceById, path) {
	const roster = requireObject(value, path);
	requireOnlyKeys(roster, ['layers', 'foregroundEdges'], path);
	const foregroundEdges = requireArray(roster.foregroundEdges, `${path}.foregroundEdges`);
	if (foregroundEdges.length !== 0) {
		reject(
			'FOREGROUND_EDGES_UNSUPPORTED',
			`${path}.foregroundEdges`,
			'The first family permits no celestial foreground edges.',
			'capability',
		);
	}
	const layers = requireArray(roster.layers, `${path}.layers`);
	if (layers.length !== 2) {
		reject(
			'ROSTER_SHAPE_INVALID',
			`${path}.layers`,
			'The first family contains exactly the stars and Sun layers.',
			'roster',
		);
	}

	const pointLayer = requireObject(layers[0], `${path}.layers[0]`);
	requireOnlyKeys(
		pointLayer,
		['layerId', 'kind', 'compositionPolicy', 'fixedCapacity', 'members'],
		`${path}.layers[0]`,
	);
	for (const [key, expected] of [
		['layerId', 'stars'],
		['kind', 'infinite-point-set'],
		['compositionPolicy', 'additive'],
	]) {
		requireExact(
			pointLayer[key],
			expected,
			'ROSTER_SHAPE_INVALID',
			`${path}.layers[0].${key}`,
			'The point-set layer does not match the first-family roster.',
			'roster',
		);
	}
	requireInteger(pointLayer.fixedCapacity, `${path}.layers[0].fixedCapacity`);
	requireExact(
		pointLayer.fixedCapacity,
		POINT_MEMBER_CAPACITY,
		'POINT_CAPACITY_MISMATCH',
		`${path}.layers[0].fixedCapacity`,
		'G0 uses the provisional hard capacity of 16 members.',
		'capacity',
	);
	const members = requireArray(pointLayer.members, `${path}.layers[0].members`);
	if (members.length > pointLayer.fixedCapacity) {
		reject(
			'POINT_CAPACITY_EXCEEDED',
			`${path}.layers[0].members`,
			'The point-set roster exceeds its provisional hard capacity.',
			'capacity',
		);
	}
	const uniqueMembers = new Set();
	for (let index = 0; index < members.length; index += 1) {
		const memberPath = `${path}.layers[0].members[${index}]`;
		const memberId = requireString(members[index], memberPath);
		if (uniqueMembers.has(memberId)) {
			reject(
				'ROSTER_MEMBER_DUPLICATE',
				memberPath,
				'The aggregate point layer contains a duplicate source member.',
				'roster',
			);
		}
		uniqueMembers.add(memberId);
		const source = sourceById.get(memberId);
		if (source == null || source.sourceKind !== 'point') {
			reject(
				'ROSTER_MEMBER_INCOMPATIBLE',
				memberPath,
				'Every point-layer member must reference a defined point source.',
				'roster',
			);
		}
	}
	const canonicalPointIds = [...uniqueMembers].sort();

	const extendedLayer = requireObject(layers[1], `${path}.layers[1]`);
	requireOnlyKeys(
		extendedLayer,
		['layerId', 'kind', 'compositionPolicy', 'sourceId'],
		`${path}.layers[1]`,
	);
	for (const [key, expected] of [
		['layerId', 'sun'],
		['kind', 'distant-extended'],
		['compositionPolicy', 'additive'],
		['sourceId', 'sun'],
	]) {
		requireExact(
			extendedLayer[key],
			expected,
			'ROSTER_SHAPE_INVALID',
			`${path}.layers[1].${key}`,
			'The extended layer does not match the first-family Sun roster.',
			'roster',
		);
	}
	const sun = sourceById.get(extendedLayer.sourceId);
	if (sun == null || sun.sourceKind !== 'extended') {
		reject(
			'ROSTER_MEMBER_INCOMPATIBLE',
			`${path}.layers[1].sourceId`,
			'The Sun layer must reference the canonical extended Sun definition.',
			'roster',
		);
	}
	const rosterSourceIds = new Set([...canonicalPointIds, extendedLayer.sourceId]);
	if (
		rosterSourceIds.size !== sourceById.size
		|| [...sourceById.keys()].some((sourceId) => !rosterSourceIds.has(sourceId))
	) {
		reject(
			'ROSTER_SOURCE_SET_MISMATCH',
			path,
			'The roster must contain every and only the active source definitions.',
			'roster',
		);
	}

	const pointSourceIndices = Object.fromEntries(
		canonicalPointIds.map((sourceId, index) => [sourceId, index]),
	);
	const extendedSourceIndices = { [extendedLayer.sourceId]: 0 };
	return {
		layers: [
			{
				layerId: 'stars',
				kind: 'infinite-point-set',
				compositionPolicy: 'additive',
				fixedCapacity: pointLayer.fixedCapacity,
				members: canonicalPointIds.map((memberId) => ({
					memberId,
					sourceIndex: pointSourceIndices[memberId],
					pointFieldIndex: pointSourceIndices[memberId],
				})),
			},
			{
				layerId: 'sun',
				kind: 'distant-extended',
				compositionPolicy: 'additive',
				sourceId: extendedLayer.sourceId,
				sourceIndex: 0,
				extendedFieldIndex: 0,
			},
		],
		foregroundEdges: [],
		pointSourceIndices,
		extendedSourceIndices,
	};
}

function normalizeObservationState(value, stateEpoch, geometry, path) {
	const observation = requireObject(value, path);
	requireOnlyKeys(
		observation,
		['celestialFrameId', 'bodyFrameId', 'modelFrameId', 'receiverId'],
		path,
	);
	for (const [key, expected] of [
		['celestialFrameId', CELESTIAL_FRAME_ID],
		['bodyFrameId', BODY_FRAME_ID],
		['modelFrameId', MODEL_FRAME_ID],
		['receiverId', RECEIVER_ID],
	]) {
		requireExact(
			observation[key],
			expected,
			'OBSERVATION_STATE_MISMATCH',
			`${path}.${key}`,
			'The observation state references an incompatible named fixture component.',
			'geometry',
		);
	}
	const observationTransformFingerprint = canonicalFingerprint({
		epoch: stateEpoch,
		observationState: observation,
		bodyFromCelestial: geometry.transforms.bodyFromCelestial,
		modelFromBody: geometry.transforms.modelFromBody,
		receiverPositionModelMeters: geometry.receiver.receiverPositionModelMeters,
	});
	return {
		...canonicalClone(observation),
		observationTransformFingerprint,
	};
}

function normalizePlacementState(value, stateEpoch, source, provider, geometry, path) {
	const placement = requireObject(value, path);
	requireOnlyKeys(
		placement,
		[
			'sourceId',
			'direction',
			'frameId',
			'originConvention',
			'directionConvention',
			'epoch',
			'placementProviderContractFingerprint',
			'placementStateFingerprint',
		],
		path,
	);
	requireExact(
		placement.sourceId,
		source.sourceId,
		'PLACEMENT_SOURCE_MISMATCH',
		`${path}.sourceId`,
		'Placement state does not match its source definition.',
		'placement',
	);
	const direction = requireVector3(placement.direction, `${path}.direction`, { unit: true });
	requireExact(
		placement.frameId,
		provider.frameId,
		'FRAME_MISMATCH',
		`${path}.frameId`,
		'Placement state uses an incompatible celestial frame.',
		'placement',
	);
	requireExact(
		placement.originConvention,
		provider.originConvention,
		'ORIGIN_MISMATCH',
		`${path}.originConvention`,
		'Placement state uses an incompatible origin convention.',
		'placement',
	);
	requireExact(
		placement.directionConvention,
		provider.directionConvention,
		'DIRECTION_CONVENTION_MISMATCH',
		`${path}.directionConvention`,
		'Placement state uses an incompatible direction convention.',
		'placement',
	);
	const epoch = normalizeEpoch(placement.epoch, `${path}.epoch`);
	if (!sameCanonicalValue(epoch, stateEpoch)) {
		reject(
			'EPOCH_MISMATCH',
			`${path}.epoch`,
			'Source placement epoch must exactly match the live state epoch.',
			'placement',
		);
	}
	requireFingerprint(
		placement.placementProviderContractFingerprint,
		`${path}.placementProviderContractFingerprint`,
	);
	requireExact(
		placement.placementProviderContractFingerprint,
		provider.contentFingerprint,
		'PROVIDER_MISMATCH',
		`${path}.placementProviderContractFingerprint`,
		'Placement state references an incompatible provider contract.',
		'placement',
	);
	const placementIdentity = {
		sourceId: source.sourceId,
		direction,
		frameId: placement.frameId,
		originConvention: placement.originConvention,
		directionConvention: placement.directionConvention,
		epoch,
		placementProviderContractFingerprint: placement.placementProviderContractFingerprint,
	};
	const placementStateFingerprint = canonicalFingerprint(placementIdentity);
	if (
		placement.placementStateFingerprint != null
		&& placement.placementStateFingerprint !== placementStateFingerprint
	) {
		reject(
			'PLACEMENT_STATE_FINGERPRINT_MISMATCH',
			`${path}.placementStateFingerprint`,
			'The supplied evaluated-placement fingerprint is stale or malformed.',
			'identity',
		);
	}
	const directionToSourceModel = multiplyMatrixVector(
		geometry.transforms.modelFromCelestial,
		direction,
	);
	if (dot(directionToSourceModel, geometry.receiver.upModel) <= 0) {
		reject(
			'FIXTURE_DIRECTION_NOT_CLEAR',
			`${path}.direction`,
			'Every positive G0 mechanics direction is intentionally above the fixture horizon.',
			'placement',
		);
	}
	return {
		...placementIdentity,
		placementStateFingerprint,
		directionToSourceModel,
	};
}

function normalizeState(value, sourceById, provider, geometry, path) {
	const state = requireObject(value, path);
	requireOnlyKeys(state, ['stateId', 'epoch', 'observationState', 'placements'], path);
	const stateId = requireString(state.stateId, `${path}.stateId`);
	const epoch = normalizeEpoch(state.epoch, `${path}.epoch`);
	const observationState = normalizeObservationState(
		state.observationState,
		epoch,
		geometry,
		`${path}.observationState`,
	);
	const placements = requireArray(state.placements, `${path}.placements`);
	if (placements.length !== sourceById.size) {
		reject(
			'PLACEMENT_SET_MISMATCH',
			`${path}.placements`,
			'Each live state must contain exactly one placement for every active source.',
			'placement',
		);
	}
	const placementBySourceId = new Map();
	for (let index = 0; index < placements.length; index += 1) {
		const placementPath = `${path}.placements[${index}]`;
		const placement = requireObject(placements[index], placementPath);
		const sourceId = requireString(placement.sourceId, `${placementPath}.sourceId`);
		if (placementBySourceId.has(sourceId)) {
			reject(
				'PLACEMENT_SOURCE_DUPLICATE',
				`${placementPath}.sourceId`,
				'Each source may have only one evaluated placement per live state.',
				'placement',
			);
		}
		const source = sourceById.get(sourceId);
		if (source == null) {
			reject(
				'PLACEMENT_SOURCE_MISMATCH',
				`${placementPath}.sourceId`,
				'Placement state references an unknown source.',
				'placement',
			);
		}
		placementBySourceId.set(
			sourceId,
			normalizePlacementState(
				placement,
				epoch,
				source,
				provider,
				geometry,
				placementPath,
			),
		);
	}
	for (const sourceId of sourceById.keys()) {
		if (!placementBySourceId.has(sourceId)) {
			reject(
				'PLACEMENT_SET_MISMATCH',
				`${path}.placements`,
				`Placement state is missing ${sourceId}.`,
				'placement',
			);
		}
	}
	return {
		stateId,
		epoch,
		observationState,
		placements: [...placementBySourceId.values()].sort((left, right) =>
			compareCanonicalStrings(left.sourceId, right.sourceId)),
	};
}

function normalizeSharedSun(value, sourceById, states, path) {
	const sharedSun = requireObject(value, path);
	requireOnlyKeys(sharedSun, ['canonicalSourceId', 'consumerReferences'], path);
	requireExact(
		sharedSun.canonicalSourceId,
		'sun',
		'SUN_CANONICAL_IDENTITY_MISMATCH',
		`${path}.canonicalSourceId`,
		'The canonical first-family Sun source id is sun.',
		'identity',
	);
	const source = sourceById.get(sharedSun.canonicalSourceId);
	if (source == null || source.sourceKind !== 'extended') {
		reject(
			'SUN_CANONICAL_IDENTITY_MISMATCH',
			`${path}.canonicalSourceId`,
			'The canonical Sun must resolve to the extended Sun definition.',
			'identity',
		);
	}
	const references = requireArray(sharedSun.consumerReferences, `${path}.consumerReferences`);
	if (references.length !== 2) {
		reject(
			'SUN_CANONICAL_IDENTITY_MISMATCH',
			`${path}.consumerReferences`,
			'Exactly the atmospheric and visible-disk consumers reference the canonical Sun.',
			'identity',
		);
	}
	const requiredConsumers = new Set(['atmospheric-sun', 'visible-sun-disk']);
	const seenConsumers = new Set();
	const normalizedReferences = references.map((reference, index) => {
		const referencePath = `${path}.consumerReferences[${index}]`;
		const object = requireObject(reference, referencePath);
		requireOnlyKeys(object, ['consumerId', 'sourceId'], referencePath);
		requireString(object.consumerId, `${referencePath}.consumerId`);
		if (!requiredConsumers.has(object.consumerId) || seenConsumers.has(object.consumerId)) {
			reject(
				'SUN_CANONICAL_IDENTITY_MISMATCH',
				`${referencePath}.consumerId`,
				'Sun consumer ids must be unique atmospheric and visible-disk identities.',
				'identity',
			);
		}
		seenConsumers.add(object.consumerId);
		requireExact(
			object.sourceId,
			sharedSun.canonicalSourceId,
			'SUN_CANONICAL_IDENTITY_MISMATCH',
			`${referencePath}.sourceId`,
			'Both Sun consumers must reference the same canonical source.',
			'identity',
		);
		return canonicalClone(object);
	});
	return {
		canonicalSourceId: sharedSun.canonicalSourceId,
		consumerReferences: normalizedReferences.sort((left, right) =>
			compareCanonicalStrings(left.consumerId, right.consumerId)),
		sourceIdentity: {
			sourceDefinitionFingerprint: source.sourceDefinitionFingerprint,
			radiometryFingerprint: source.radiometryFingerprint,
			supportFingerprint: source.supportFingerprint,
			placementProviderContractFingerprint: source.placementProviderContractFingerprint,
		},
		stateIdentities: Object.fromEntries(states.map((state) => {
			const placement = state.placements.find(({ sourceId }) => sourceId === 'sun');
			return [
				state.stateId,
				{
					placementStateFingerprint: placement.placementStateFingerprint,
					directionToSourceModel: placement.directionToSourceModel,
				},
			];
		})),
	};
}

function normalizeCameraVariants(value, path) {
	const variants = requireArray(value, path);
	if (variants.length < 2) {
		reject(
			'CAMERA_NEGATIVE_CONTROL_MISSING',
			path,
			'At least two camera variants are required to prove camera exclusion.',
			'proof',
		);
	}
	const ids = new Set();
	return variants.map((variant, index) => {
		const variantPath = `${path}[${index}]`;
		const object = requireObject(variant, variantPath);
		requireOnlyKeys(
			object,
			[
				'variantId',
				'orientationQuaternion',
				'projection',
				'verticalFovRadians',
				'viewport',
				'display',
			],
			variantPath,
		);
		const variantId = requireString(object.variantId, `${variantPath}.variantId`);
		if (ids.has(variantId)) {
			reject(
				'CAMERA_VARIANT_DUPLICATE',
				`${variantPath}.variantId`,
				'Camera variant ids must be unique.',
				'proof',
			);
		}
		ids.add(variantId);
		const quaternion = requireArray(
			object.orientationQuaternion,
			`${variantPath}.orientationQuaternion`,
		);
		if (quaternion.length !== 4) {
			reject(
				'CAMERA_VARIANT_INVALID',
				`${variantPath}.orientationQuaternion`,
				'Camera orientation must contain four quaternion components.',
				'proof',
			);
		}
		quaternion.forEach((component, componentIndex) =>
			requireFiniteNumber(component, `${variantPath}.orientationQuaternion[${componentIndex}]`));
		requireString(object.projection, `${variantPath}.projection`);
		requireFiniteNumber(object.verticalFovRadians, `${variantPath}.verticalFovRadians`);
		const viewport = requireArray(object.viewport, `${variantPath}.viewport`);
		if (
			viewport.length !== 2
			|| viewport.some((component) => !Number.isSafeInteger(component) || component <= 0)
		) {
			reject(
				'CAMERA_VARIANT_INVALID',
				`${variantPath}.viewport`,
				'Camera viewport must contain two positive integers.',
				'proof',
			);
		}
		requireString(object.display, `${variantPath}.display`);
		return canonicalClone(object);
	});
}

function physicalFieldFingerprint(fixture) {
	return canonicalFingerprint({
		cacheKind: 'celestial-contribution-cache',
		family: fixture.family,
		spectralBasis: {
			id: fixture.spectralBasis.id,
			contentHash: fixture.spectralBasis.contentHash,
			semantics: fixture.spectralBasis.semantics,
		},
		placementProviderContractFingerprint:
			fixture.placementProviderContract.contentFingerprint,
		geometryDomain: {
			familyId: fixture.family.familyId,
			body: fixture.geometry.body,
			frameIds: {
				celestial: fixture.geometry.frames.celestial.frameId,
				body: fixture.geometry.frames.body.frameId,
				model: fixture.geometry.frames.model.frameId,
			},
		},
		sources: fixture.sources.map((source) => ({
			sourceId: source.sourceId,
			sourceKind: source.sourceKind,
			sourceDefinitionFingerprint: source.sourceDefinitionFingerprint,
			radiometryFingerprint: source.radiometryFingerprint,
			supportFingerprint: source.supportFingerprint,
			placementProviderContractFingerprint:
				source.placementProviderContractFingerprint,
		})),
		roster: fixture.roster,
	});
}

function runtimeCompatibilityFingerprint() {
	return canonicalFingerprint({
		queryContractVersion: 'celestial-live-query-contract-v1',
		geometryTransformContractVersion: 'synthetic-named-frame-transform-v1',
		cameraPhysicalFieldDependency: false,
		rendererNeutralRasterInvariant: {
			cameraIsLiveOnly: true,
			exactPixelSolidAngleRequired: true,
			orderedPixelCornerRaysRequired: true,
			pointResponseMustNormalize: true,
		},
		policyRealization: {
			fieldCoordinates: 'deferred-g1',
			visibilityAndRaster: 'deferred-g5',
			gpuRepresentation: 'deferred-g6',
		},
	});
}

function queryStateFingerprint(normalizedFixture, state) {
	return canonicalFingerprint({
		physicalFieldFingerprint: normalizedFixture.identities.physicalFieldFingerprint,
		runtimeCompatibilityFingerprint:
			normalizedFixture.identities.runtimeCompatibilityFingerprint,
		stateId: state.stateId,
		epoch: state.epoch,
		observationTransformFingerprint:
			state.observationState.observationTransformFingerprint,
		receiverPositionModelMeters:
			normalizedFixture.geometry.receiver.receiverPositionModelMeters,
		placements: state.placements.map((placement) => ({
			sourceId: placement.sourceId,
			placementStateFingerprint: placement.placementStateFingerprint,
			directionToSourceModel: placement.directionToSourceModel,
		})),
	});
}

function assertExpectedFixtureResults(normalized, expected, path) {
	const value = requireObject(expected, path);
	requireOnlyKeys(
		value,
		[
			'canonicalLayerIds',
			'canonicalPointMemberIds',
			'pointSourceIndices',
			'extendedSourceIndices',
			'modelDirections',
		],
		path,
	);
	const layerIds = normalized.roster.layers.map(({ layerId }) => layerId);
	if (!sameCanonicalValue(layerIds, value.canonicalLayerIds)) {
		reject(
			'EXPECTED_RESULT_MISMATCH',
			`${path}.canonicalLayerIds`,
			'Canonical layer ids differ from the mechanics fixture expectation.',
			'proof',
		);
	}
	const pointMemberIds = normalized.roster.layers[0].members.map(({ memberId }) => memberId);
	if (!sameCanonicalValue(pointMemberIds, value.canonicalPointMemberIds)) {
		reject(
			'EXPECTED_RESULT_MISMATCH',
			`${path}.canonicalPointMemberIds`,
			'Canonical point-member order differs from the fixture expectation.',
			'proof',
		);
	}
	if (!sameCanonicalValue(normalized.roster.pointSourceIndices, value.pointSourceIndices)) {
		reject(
			'EXPECTED_RESULT_MISMATCH',
			`${path}.pointSourceIndices`,
			'Point source indices differ from the fixture expectation.',
			'proof',
		);
	}
	if (!sameCanonicalValue(normalized.roster.extendedSourceIndices, value.extendedSourceIndices)) {
		reject(
			'EXPECTED_RESULT_MISMATCH',
			`${path}.extendedSourceIndices`,
			'Extended source indices differ from the fixture expectation.',
			'proof',
		);
	}
	const expectedModelDirections = requireObject(value.modelDirections, `${path}.modelDirections`);
	for (const state of normalized.states) {
		const expectedState = requireObject(
			expectedModelDirections[state.stateId],
			`${path}.modelDirections.${state.stateId}`,
		);
		for (const placement of state.placements) {
			const expectedDirection = expectedState[placement.sourceId];
			if (!vectorsNear(placement.directionToSourceModel, expectedDirection)) {
				reject(
					'EXPECTED_RESULT_MISMATCH',
					`${path}.modelDirections.${state.stateId}.${placement.sourceId}`,
					'Geometry transform output differs from the exact expected direction.',
					'proof',
				);
			}
		}
	}
}

/**
 * Validate and normalize the G0 synthetic contract fixture.
 *
 * The returned data contains derived fingerprints and geometry-resolved
 * mechanics only. It does not contain transported fields or a cache.
 *
 * @param {unknown} fixture Authored G0 fixture.
 * @returns {object} Deterministic normalized contract mechanics.
 */
export function normalizeG0ContractFixture(fixture) {
	const root = requireObject(fixture, '$');
	requireOnlyKeys(
		root,
		[
			'schemaVersion',
			'fixtureId',
			'claimBoundary',
			'family',
			'spectralBasis',
			'placementProviderContract',
			'geometry',
			'sources',
			'rosterInput',
			'sharedSun',
			'states',
			'cameraVariants',
			'expected',
		],
		'$',
	);
	requireExact(
		root.schemaVersion,
		CELESTIAL_CONTRACT_SCHEMA_VERSION,
		'SCHEMA_VERSION_MISMATCH',
		'$.schemaVersion',
		'Fixture schema version is incompatible.',
		'schema',
	);
	requireExact(
		root.fixtureId,
		FIXTURE_ID,
		'FIXTURE_ID_MISMATCH',
		'$.fixtureId',
		'Unexpected G0 fixture id.',
		'schema',
	);
	requireString(root.claimBoundary, '$.claimBoundary');

	const family = requireObject(root.family, '$.family');
	requireOnlyKeys(
		family,
		['familyId', 'geometryKind', 'atmosphereKind', 'compositionPolicy', 'representation'],
		'$.family',
	);
	requireExact(
		family.familyId,
		FAMILY_ID,
		'FAMILY_UNSUPPORTED',
		'$.family.familyId',
		'G0 supports only the selected spherical Sun-and-stars family.',
		'capability',
	);
	for (const [key, expected] of [
		['geometryKind', 'concentric-spherical-ground-and-atmosphere'],
		['atmosphereKind', 'radially-symmetric'],
		['compositionPolicy', 'additive'],
		['representation', 'unrealized-contract-only'],
	]) {
		requireExact(
			family[key],
			expected,
			key === 'compositionPolicy' ? 'OPAQUE_LAYER_UNSUPPORTED' : 'FAMILY_UNSUPPORTED',
			`$.family.${key}`,
			'The fixture exceeds or contradicts the first-family G0 contract.',
			'capability',
		);
	}

	const spectralBasis = normalizeSpectralBasis(root.spectralBasis, '$.spectralBasis');
	const placementProviderContract = normalizeProviderContract(
		root.placementProviderContract,
		'$.placementProviderContract',
	);
	const geometry = normalizeGeometry(root.geometry, '$.geometry');

	const sourceInputs = requireArray(root.sources, '$.sources');
	const sourceById = new Map();
	for (let index = 0; index < sourceInputs.length; index += 1) {
		const source = normalizeSourceDefinition(
			sourceInputs[index],
			spectralBasis,
			placementProviderContract,
			`$.sources[${index}]`,
		);
		if (sourceById.has(source.sourceId)) {
			reject(
				'SOURCE_ID_DUPLICATE',
				`$.sources[${index}].sourceId`,
				'Every source definition must have a unique source id.',
				'roster',
			);
		}
		sourceById.set(source.sourceId, source);
	}
	const sources = [...sourceById.values()].sort((left, right) =>
		compareCanonicalStrings(left.sourceId, right.sourceId));
	const canonicalSourceById = new Map(sources.map((source) => [source.sourceId, source]));
	const roster = normalizeRoster(root.rosterInput, canonicalSourceById, '$.rosterInput');

	const stateInputs = requireArray(root.states, '$.states');
	if (stateInputs.length !== 2) {
		reject(
			'LIVE_STATE_SET_MISMATCH',
			'$.states',
			'The G0 mechanics fixture contains exactly t0 and t1.',
			'proof',
		);
	}
	const stateIds = new Set();
	const states = stateInputs.map((state, index) => {
		const normalized = normalizeState(
			state,
			canonicalSourceById,
			placementProviderContract,
			geometry,
			`$.states[${index}]`,
		);
		if (stateIds.has(normalized.stateId)) {
			reject(
				'LIVE_STATE_ID_DUPLICATE',
				`$.states[${index}].stateId`,
				'Fixture live-state ids must be unique.',
				'proof',
			);
		}
		stateIds.add(normalized.stateId);
		return normalized;
	}).sort((left, right) => compareCanonicalStrings(left.stateId, right.stateId));
	if (!sameCanonicalValue(states.map(({ stateId }) => stateId), ['t0', 't1'])) {
		reject(
			'LIVE_STATE_SET_MISMATCH',
			'$.states',
			'The G0 mechanics fixture contains exactly t0 and t1.',
			'proof',
		);
	}
	const cameraVariants = normalizeCameraVariants(root.cameraVariants, '$.cameraVariants');

	const normalized = {
		schemaVersion: root.schemaVersion,
		fixtureId: root.fixtureId,
		claimBoundary: root.claimBoundary,
		family: canonicalClone(family),
		spectralBasis,
		placementProviderContract,
		geometry,
		sources,
		roster,
		states,
		cameraVariants,
		identities: {
			physicalFieldFingerprint: null,
			runtimeCompatibilityFingerprint: runtimeCompatibilityFingerprint(),
			queryStateFingerprints: {},
		},
	};
	normalized.identities.physicalFieldFingerprint = physicalFieldFingerprint(normalized);
	normalized.identities.queryStateFingerprints = Object.fromEntries(
		states.map((state) => [state.stateId, queryStateFingerprint(normalized, state)]),
	);
	normalized.sharedSun = normalizeSharedSun(
		root.sharedSun,
		canonicalSourceById,
		states,
		'$.sharedSun',
	);
	assertExpectedFixtureResults(normalized, root.expected, '$.expected');
	return normalized;
}

function normalizeContentReference(value, path) {
	const reference = requireObject(value, path);
	requireOnlyKeys(reference, ['id', 'version', 'path', 'sha256'], path);
	requireString(reference.id, `${path}.id`);
	if (!DECISION_ID_PATTERN.test(reference.id)) {
		reject(
			'CONTENT_REFERENCE_INVALID',
			`${path}.id`,
			'Content-reference id has an invalid form.',
			'manifest',
		);
	}
	requireString(reference.version, `${path}.version`);
	requireString(reference.path, `${path}.path`);
	if (!reference.path.startsWith(`${SOURCE_ROOT}/`)) {
		reject(
			'CONTENT_REFERENCE_ESCAPE',
			`${path}.path`,
			'Manifest content references must stay under the experiment source root.',
			'containment',
		);
	}
	requireFingerprint(reference.sha256, `${path}.sha256`);
	return canonicalClone(reference);
}

function normalizeDecision(value, path) {
	const decision = requireObject(value, path);
	requireOnlyKeys(
		decision,
		[
			'id',
			'status',
			'value',
			'constraints',
			'ownerGoal',
			'reconsiderByGoal',
			'changeRule',
			'rationale',
		],
		path,
	);
	requireString(decision.id, `${path}.id`);
	if (!DECISION_ID_PATTERN.test(decision.id)) {
		reject(
			'DECISION_ID_INVALID',
			`${path}.id`,
			'Decision id has an invalid form.',
			'manifest',
		);
	}
	if (!['fixed', 'provisional', 'deferred'].includes(decision.status)) {
		reject(
			'DECISION_STATUS_INVALID',
			`${path}.status`,
			'Decision status must be fixed, provisional, or deferred.',
			'manifest',
		);
	}
	const constraints = requireArray(decision.constraints, `${path}.constraints`);
	if (constraints.length === 0) {
		reject(
			'DECISION_CONSTRAINTS_MISSING',
			`${path}.constraints`,
			'Every G0 decision records at least one governing constraint.',
			'manifest',
		);
	}
	constraints.forEach((constraint, index) =>
		requireString(constraint, `${path}.constraints[${index}]`));
	requireString(decision.ownerGoal, `${path}.ownerGoal`);
	requireString(decision.changeRule, `${path}.changeRule`);
	requireString(decision.rationale, `${path}.rationale`);
	if (decision.status === 'fixed' || decision.status === 'provisional') {
		if (!Object.hasOwn(decision, 'value')) {
			reject(
				'DECISION_VALUE_MISSING',
				`${path}.value`,
				'Fixed and provisional decisions require an explicit value.',
				'manifest',
			);
		}
		canonicalJson(decision.value, `${path}.value`);
	}
	if (decision.status === 'deferred' && Object.hasOwn(decision, 'value')) {
		reject(
			'DEFERRED_DECISION_PRETENDS_RESOLUTION',
			`${path}.value`,
			'Deferred G0 decisions name constraints and deadlines, not invented values.',
			'manifest',
		);
	}
	if (decision.status === 'provisional' || decision.status === 'deferred') {
		requireString(decision.reconsiderByGoal, `${path}.reconsiderByGoal`);
	} else if (Object.hasOwn(decision, 'reconsiderByGoal')) {
		reject(
			'FIXED_DECISION_HAS_DEADLINE',
			`${path}.reconsiderByGoal`,
			'Fixed decisions are changed only by a new manifest and proof.',
			'manifest',
		);
	}
	return canonicalClone(decision);
}

/**
 * Validate the G0 decision manifest without consulting mutable topic documents.
 *
 * @param {unknown} value Candidate decision manifest.
 * @returns {object} Canonically ordered manifest content.
 */
export function normalizeG0DecisionManifest(value) {
	const manifest = requireObject(value, '$decisionManifest');
	requireOnlyKeys(
		manifest,
		[
			'schemaVersion',
			'manifestId',
			'familyId',
			'experimentRoots',
			'baselineManifest',
			'candidateSeed',
			'schemas',
			'fixtures',
			'decisions',
			'proofAssertions',
			'contentHash',
		],
		'$decisionManifest',
	);
	requireExact(
		manifest.schemaVersion,
		G0_DECISION_MANIFEST_SCHEMA_VERSION,
		'SCHEMA_VERSION_MISMATCH',
		'$decisionManifest.schemaVersion',
		'Decision-manifest schema version is incompatible.',
		'manifest',
	);
	requireExact(
		manifest.manifestId,
		MANIFEST_ID,
		'MANIFEST_ID_MISMATCH',
		'$decisionManifest.manifestId',
		'Unexpected G0 decision-manifest id.',
		'manifest',
	);
	requireExact(
		manifest.familyId,
		FAMILY_ID,
		'FAMILY_UNSUPPORTED',
		'$decisionManifest.familyId',
		'Decision manifest targets the wrong cache family.',
		'manifest',
	);

	const roots = requireObject(manifest.experimentRoots, '$decisionManifest.experimentRoots');
	requireOnlyKeys(roots, ['source', 'output'], '$decisionManifest.experimentRoots');
	requireExact(
		roots.source,
		SOURCE_ROOT,
		'CONTAINMENT_ROOT_MISMATCH',
		'$decisionManifest.experimentRoots.source',
		'The decision manifest source root is outside the experiment.',
		'containment',
	);
	requireExact(
		roots.output,
		OUTPUT_ROOT,
		'CONTAINMENT_ROOT_MISMATCH',
		'$decisionManifest.experimentRoots.output',
		'The decision manifest output root is outside the ignored experiment output.',
		'containment',
	);

	const baseline = requireObject(manifest.baselineManifest, '$decisionManifest.baselineManifest');
	requireOnlyKeys(baseline, ['path', 'aggregateHash'], '$decisionManifest.baselineManifest');
	requireString(baseline.path, '$decisionManifest.baselineManifest.path');
	if (!baseline.path.startsWith(`${SOURCE_ROOT}/`)) {
		reject(
			'CONTENT_REFERENCE_ESCAPE',
			'$decisionManifest.baselineManifest.path',
			'The sealed baseline manifest must remain under the experiment source root.',
			'containment',
		);
	}
	requireFingerprint(
		baseline.aggregateHash,
		'$decisionManifest.baselineManifest.aggregateHash',
	);

	const candidate = requireObject(manifest.candidateSeed, '$decisionManifest.candidateSeed');
	requireOnlyKeys(
		candidate,
		['aggregateHash', 'identicalToBaseline'],
		'$decisionManifest.candidateSeed',
	);
	requireFingerprint(candidate.aggregateHash, '$decisionManifest.candidateSeed.aggregateHash');
	requireExact(
		candidate.identicalToBaseline,
		true,
		'CANDIDATE_NOT_IDENTICAL',
		'$decisionManifest.candidateSeed.identicalToBaseline',
		'The G0 candidate must begin byte-identical to the sealed baseline.',
		'baseline',
	);
	if (candidate.aggregateHash !== baseline.aggregateHash) {
		reject(
			'CANDIDATE_NOT_IDENTICAL',
			'$decisionManifest.candidateSeed.aggregateHash',
			'Candidate and baseline aggregate hashes differ.',
			'baseline',
		);
	}

	const normalizeReferences = (references, path) => {
		const array = requireArray(references, path);
		const byId = new Map();
		for (let index = 0; index < array.length; index += 1) {
			const reference = normalizeContentReference(array[index], `${path}[${index}]`);
			if (byId.has(reference.id)) {
				reject(
					'CONTENT_REFERENCE_DUPLICATE',
					`${path}[${index}].id`,
					'Manifest content-reference ids must be unique.',
					'manifest',
				);
			}
			byId.set(reference.id, reference);
		}
		return [...byId.values()].sort((left, right) =>
			compareCanonicalStrings(left.id, right.id));
	};
	const schemas = normalizeReferences(manifest.schemas, '$decisionManifest.schemas');
	const fixtures = normalizeReferences(manifest.fixtures, '$decisionManifest.fixtures');
	for (const requiredReference of [
		['schemas', schemas, CELESTIAL_CONTRACT_SCHEMA_VERSION],
		['schemas', schemas, G0_DECISION_MANIFEST_SCHEMA_VERSION],
		['fixtures', fixtures, FIXTURE_ID],
	]) {
		const [collectionName, references, id] = requiredReference;
		if (!references.some((reference) => reference.id === id)) {
			reject(
				'CONTENT_REFERENCE_MISSING',
				`$decisionManifest.${collectionName}`,
				`Decision manifest must identify ${id}.`,
				'manifest',
			);
		}
	}

	const decisionInputs = requireArray(manifest.decisions, '$decisionManifest.decisions');
	const decisionsById = new Map();
	for (let index = 0; index < decisionInputs.length; index += 1) {
		const decision = normalizeDecision(
			decisionInputs[index],
			`$decisionManifest.decisions[${index}]`,
		);
		if (decisionsById.has(decision.id)) {
			reject(
				'DECISION_DUPLICATE',
				`$decisionManifest.decisions[${index}].id`,
				'Decision ids must be unique.',
				'manifest',
			);
		}
		decisionsById.set(decision.id, decision);
	}
	for (const [id, expected] of Object.entries(REQUIRED_DECISIONS)) {
		const decision = decisionsById.get(id);
		if (decision == null) {
			reject(
				'DECISION_MISSING',
				'$decisionManifest.decisions',
				`Required G0 decision ${id} is missing.`,
				'manifest',
			);
		}
		for (const key of ['status', 'ownerGoal']) {
			if (decision[key] !== expected[key]) {
				reject(
					'DECISION_CLASSIFICATION_MISMATCH',
					`$decisionManifest.decisions.${id}.${key}`,
					`${id} must be classified as ${expected[key]} for ${key}.`,
					'manifest',
				);
			}
		}
		if (
			expected.reconsiderByGoal != null
			&& decision.reconsiderByGoal !== expected.reconsiderByGoal
		) {
			reject(
				'DECISION_DEADLINE_MISMATCH',
				`$decisionManifest.decisions.${id}.reconsiderByGoal`,
				`${id} must be reconsidered by ${expected.reconsiderByGoal}.`,
				'manifest',
			);
		}
	}
	if (decisionsById.size !== Object.keys(REQUIRED_DECISIONS).length) {
		reject(
			'DECISION_SET_MISMATCH',
			'$decisionManifest.decisions',
			'The G0 manifest contains a decision outside the frozen minimal decision set.',
			'manifest',
		);
	}
	const capacityDecision = decisionsById.get('capacity.point-members');
	if (capacityDecision.value !== POINT_MEMBER_CAPACITY) {
		reject(
			'POINT_CAPACITY_MISMATCH',
			'$decisionManifest.decisions.capacity.point-members.value',
			'The provisional G0 point-member capacity is 16.',
			'capacity',
		);
	}

	const proofAssertions = requireArray(
		manifest.proofAssertions,
		'$decisionManifest.proofAssertions',
	);
	const assertionSet = new Set();
	proofAssertions.forEach((assertionId, index) => {
		requireString(assertionId, `$decisionManifest.proofAssertions[${index}]`);
		if (!DECISION_ID_PATTERN.test(assertionId)) {
			reject(
				'PROOF_ASSERTION_ID_INVALID',
				`$decisionManifest.proofAssertions[${index}]`,
				'Proof assertion id has an invalid form.',
				'manifest',
			);
		}
		if (assertionSet.has(assertionId)) {
			reject(
				'PROOF_ASSERTION_DUPLICATE',
				`$decisionManifest.proofAssertions[${index}]`,
				'Proof assertion ids must be unique.',
				'manifest',
			);
		}
		assertionSet.add(assertionId);
	});
	for (const requiredAssertion of REQUIRED_G0_PROOF_ASSERTIONS) {
		if (!assertionSet.has(requiredAssertion)) {
			reject(
				'PROOF_ASSERTION_MISSING',
				'$decisionManifest.proofAssertions',
				`Required proof assertion ${requiredAssertion} is missing.`,
				'manifest',
			);
		}
	}

	requireFingerprint(manifest.contentHash, '$decisionManifest.contentHash');
	const computedHash = canonicalFingerprint(without(manifest, ['contentHash']));
	if (manifest.contentHash !== computedHash) {
		reject(
			'MANIFEST_FINGERPRINT_MISMATCH',
			'$decisionManifest.contentHash',
			'Decision-manifest content hash does not match its deterministic body.',
			'identity',
		);
	}
	return {
		...canonicalClone(without(manifest, [
			'schemas',
			'fixtures',
			'decisions',
			'proofAssertions',
			'contentHash',
		])),
		schemas,
		fixtures,
		decisions: [...decisionsById.values()].sort((left, right) =>
			compareCanonicalStrings(left.id, right.id)),
		proofAssertions: [...assertionSet].sort(),
		contentHash: manifest.contentHash,
	};
}

/**
 * Validate the externally gathered G0 containment evidence packet.
 *
 * This function evaluates facts; it does not inspect or mutate the filesystem.
 *
 * @param {unknown} value Containment verifier output.
 * @returns {object} Canonical evidence packet.
 */
export function normalizeG0ContainmentEvidence(value) {
	const evidence = requireObject(value, '$containmentEvidence');
	requireOnlyKeys(
		evidence,
		[
			'schemaVersion',
			'sourceRoot',
			'outputRoot',
			...REQUIRED_CONTAINMENT_FLAGS,
		],
		'$containmentEvidence',
	);
	requireExact(
		evidence.schemaVersion,
		G0_CONTAINMENT_EVIDENCE_SCHEMA_VERSION,
		'SCHEMA_VERSION_MISMATCH',
		'$containmentEvidence.schemaVersion',
		'Containment-evidence schema version is incompatible.',
		'containment',
	);
	requireExact(
		evidence.sourceRoot,
		SOURCE_ROOT,
		'CONTAINMENT_ROOT_MISMATCH',
		'$containmentEvidence.sourceRoot',
		'Containment evidence resolved the wrong source root.',
		'containment',
	);
	requireExact(
		evidence.outputRoot,
		OUTPUT_ROOT,
		'CONTAINMENT_ROOT_MISMATCH',
		'$containmentEvidence.outputRoot',
		'Containment evidence resolved the wrong output root.',
		'containment',
	);
	for (const flag of REQUIRED_CONTAINMENT_FLAGS) {
		requireExact(
			evidence[flag],
			true,
			'CONTAINMENT_ASSERTION_FAILED',
			`$containmentEvidence.${flag}`,
			`Containment assertion ${flag} did not pass.`,
			'containment',
		);
	}
	return canonicalClone(evidence);
}

function classifiedError(error) {
	if (error instanceof G0ContractError) {
		return {
			code: error.code,
			path: error.path,
			classification: error.classification,
			message: error.message,
		};
	}
	return {
		code: 'UNCLASSIFIED_FAILURE',
		path: '$',
		classification: 'internal',
		message: error instanceof Error ? error.message : String(error),
	};
}

function runExpectedFailure({ id, expectedCode, expectedPath, execute }) {
	try {
		execute();
		return {
			id,
			accepted: false,
			expectedCode,
			expectedPath,
			actual: {
				code: 'NO_ERROR',
				path: '$',
			},
		};
	} catch (error) {
		const actual = classifiedError(error);
		return {
			id,
			accepted: actual.code === expectedCode && actual.path === expectedPath,
			expectedCode,
			expectedPath,
			actual: {
				code: actual.code,
				path: actual.path,
				classification: actual.classification,
			},
		};
	}
}

function fixtureMutationCase(fixture, definition) {
	return {
		...definition,
		execute() {
			const mutated = canonicalClone(fixture);
			definition.mutate(mutated);
			normalizeG0ContractFixture(mutated);
		},
	};
}

function evaluateNegativeControls(fixture, decisionManifest, containmentEvidence) {
	const fixtureCases = [
		{
			id: 'negative.wrong-units',
			expectedCode: 'SPECTRAL_UNITS_MISMATCH',
			expectedPath: '$.sources[0].spectralMeasure.units',
			mutate: (value) => {
				value.sources[0].spectralMeasure.units = 'W m^-2 sr^-1 nm^-1';
			},
		},
		{
			id: 'negative.wrong-basis',
			expectedCode: 'SPECTRAL_BASIS_MISMATCH',
			expectedPath: '$.sources[0].spectralMeasure.basisFingerprint',
			mutate: (value) => {
				value.sources[0].spectralMeasure.basisFingerprint =
					'sha256:0000000000000000000000000000000000000000000000000000000000000000';
			},
		},
		{
			id: 'negative.wrong-channel-count',
			expectedCode: 'SPECTRAL_CHANNEL_COUNT_MISMATCH',
			expectedPath: '$.sources[0].spectralMeasure.values',
			mutate: (value) => {
				value.sources[0].spectralMeasure.values.pop();
			},
		},
		{
			id: 'negative.kind-measure-mismatch',
			expectedCode: 'SOURCE_KIND_MEASURE_MISMATCH',
			expectedPath: '$.sources[0].spectralMeasure.quantity',
			mutate: (value) => {
				value.sources[0].sourceKind = 'extended';
				value.sources[0].placementKind = 'distant-direction';
			},
		},
		{
			id: 'negative.nonunit-direction',
			expectedCode: 'DIRECTION_NOT_UNIT',
			expectedPath: '$.states[0].placements[0].direction',
			mutate: (value) => {
				value.states[0].placements[0].direction = [2, 0, 0];
			},
		},
		{
			id: 'negative.frame-mismatch',
			expectedCode: 'FRAME_MISMATCH',
			expectedPath: '$.states[0].placements[0].frameId',
			mutate: (value) => {
				value.states[0].placements[0].frameId = 'camera-frame';
			},
		},
		{
			id: 'negative.origin-mismatch',
			expectedCode: 'ORIGIN_MISMATCH',
			expectedPath: '$.states[0].placements[0].originConvention',
			mutate: (value) => {
				value.states[0].placements[0].originConvention = 'camera-origin';
			},
		},
		{
			id: 'negative.time-scale-mismatch',
			expectedCode: 'TIME_SCALE_MISMATCH',
			expectedPath: '$.states[0].placements[0].epoch.timeScale',
			mutate: (value) => {
				value.states[0].placements[0].epoch.timeScale = 'UTC';
			},
		},
		{
			id: 'negative.provider-mismatch',
			expectedCode: 'PROVIDER_MISMATCH',
			expectedPath: '$.states[0].placements[0].placementProviderContractFingerprint',
			mutate: (value) => {
				value.states[0].placements[0].placementProviderContractFingerprint =
					'sha256:0000000000000000000000000000000000000000000000000000000000000000';
			},
		},
		{
			id: 'negative.missing-placement',
			expectedCode: 'PLACEMENT_SET_MISMATCH',
			expectedPath: '$.states[0].placements',
			mutate: (value) => {
				value.states[0].placements.pop();
			},
		},
		{
			id: 'negative.duplicate-placement',
			expectedCode: 'PLACEMENT_SOURCE_DUPLICATE',
			expectedPath: '$.states[0].placements[1].sourceId',
			mutate: (value) => {
				value.states[0].placements[1].sourceId =
					value.states[0].placements[0].sourceId;
			},
		},
		{
			id: 'negative.duplicate-roster-member',
			expectedCode: 'ROSTER_MEMBER_DUPLICATE',
			expectedPath: '$.rosterInput.layers[0].members[1]',
			mutate: (value) => {
				value.rosterInput.layers[0].members[1] =
					value.rosterInput.layers[0].members[0];
			},
		},
		{
			id: 'negative.foreground-edge',
			expectedCode: 'FOREGROUND_EDGES_UNSUPPORTED',
			expectedPath: '$.rosterInput.foregroundEdges',
			mutate: (value) => {
				value.rosterInput.foregroundEdges.push({
					foreground: 'sun',
					background: 'stars',
				});
			},
		},
		{
			id: 'negative.opacity',
			expectedCode: 'OPAQUE_LAYER_UNSUPPORTED',
			expectedPath: '$.rosterInput.layers[1].opacity',
			mutate: (value) => {
				value.rosterInput.layers[1].opacity = 'opaque';
			},
		},
		{
			id: 'negative.finite-placement',
			expectedCode: 'FINITE_PLACEMENT_UNSUPPORTED',
			expectedPath: '$.sources[0].depth',
			mutate: (value) => {
				value.sources[0].depth = 'finite';
			},
		},
		{
			id: 'negative.moon-kind',
			expectedCode: 'SOURCE_KIND_UNSUPPORTED',
			expectedPath: '$.sources[2].sourceKind',
			mutate: (value) => {
				value.sources[2].sourceKind = 'moon';
			},
		},
		{
			id: 'negative.profiled-disk',
			expectedCode: 'EXTENDED_SUPPORT_UNSUPPORTED',
			expectedPath: '$.sources[2].support.kind',
			mutate: (value) => {
				value.sources[2].support.kind = 'profiled-disk';
			},
		},
		{
			id: 'negative.flat-family',
			expectedCode: 'FAMILY_UNSUPPORTED',
			expectedPath: '$.family.familyId',
			mutate: (value) => {
				value.family.familyId = 'flat-sun-stars-v1';
			},
		},
		{
			id: 'negative.capacity',
			expectedCode: 'POINT_CAPACITY_EXCEEDED',
			expectedPath: '$.rosterInput.layers[0].members',
			mutate: (value) => {
				value.rosterInput.layers[0].members = Array.from(
					{ length: POINT_MEMBER_CAPACITY + 1 },
					(_unused, index) => `star-${index}`,
				);
			},
		},
		{
			id: 'negative.static-fingerprint',
			expectedCode: 'SOURCE_DEFINITION_FINGERPRINT_MISMATCH',
			expectedPath: '$.sources[0].sourceDefinitionFingerprint',
			mutate: (value) => {
				value.sources[0].sourceDefinitionFingerprint =
					'sha256:0000000000000000000000000000000000000000000000000000000000000000';
			},
		},
		{
			id: 'negative.placement-fingerprint',
			expectedCode: 'PLACEMENT_STATE_FINGERPRINT_MISMATCH',
			expectedPath: '$.states[0].placements[0].placementStateFingerprint',
			mutate: (value) => {
				value.states[0].placements[0].placementStateFingerprint =
					'sha256:0000000000000000000000000000000000000000000000000000000000000000';
			},
		},
		{
			id: 'negative.shared-sun',
			expectedCode: 'SUN_CANONICAL_IDENTITY_MISMATCH',
			expectedPath: '$.sharedSun.consumerReferences[1].sourceId',
			mutate: (value) => {
				value.sharedSun.consumerReferences[1].sourceId = 'sun-visible-copy';
			},
		},
		{
			id: 'negative.camera-in-static-definition',
			expectedCode: 'CAMERA_FIELD_PROHIBITED',
			expectedPath: '$.sources[0].cameraDirection',
			mutate: (value) => {
				value.sources[0].cameraDirection = [0, 0, -1];
			},
		},
	].map((definition) => fixtureMutationCase(fixture, definition));

	const decisionDeadline = {
		id: 'negative.deferred-decision-deadline',
		expectedCode: 'DECISION_DEADLINE_MISMATCH',
		expectedPath:
			'$decisionManifest.decisions.field.coordinates-and-stencils.reconsiderByGoal',
		execute() {
			const mutated = canonicalClone(decisionManifest);
			const decision = mutated.decisions.find(({ id }) =>
				id === 'field.coordinates-and-stencils');
			decision.reconsiderByGoal = 'G2';
			mutated.contentHash = canonicalFingerprint(without(mutated, ['contentHash']));
			normalizeG0DecisionManifest(mutated);
		},
	};
	const containmentEscape = {
		id: 'negative.output-root-escape',
		expectedCode: 'CONTAINMENT_ROOT_MISMATCH',
		expectedPath: '$containmentEvidence.outputRoot',
		execute() {
			const mutated = canonicalClone(containmentEvidence);
			mutated.outputRoot = 'experiments/extraterrestrial/generated-output';
			normalizeG0ContainmentEvidence(mutated);
		},
	};
	return [...fixtureCases, decisionDeadline, containmentEscape].map(runExpectedFailure);
}

function createRejectedProof(error) {
	const classified = classifiedError(error);
	const body = {
		proofId: G0_PROOF_ID,
		status: 'rejected',
		accepted: false,
		claimBoundary:
			'G0 contract mechanics only; no cache, transport, raster, visibility, or GPU implementation claim.',
		summary: {
			assertionCount: 1,
			acceptedAssertionCount: 0,
			rejectedAssertionCount: 1,
			negativeControlCount: 0,
		},
		assertions: [
			{
				id: 'input.contract-valid',
				accepted: false,
				error: classified,
			},
		],
		negativeControls: [],
	};
	return {
		...body,
		proofFingerprint: canonicalFingerprint(body),
	};
}

/**
 * Evaluate the complete deterministic G0 contract proof.
 *
 * Filesystem containment facts are supplied by the owning boundary verifier.
 * This function performs no I/O and never creates run output. Its accepted
 * result proves only contract mechanics and G0 boundary facts.
 *
 * @param {object} input Proof inputs.
 * @param {unknown} input.fixture Authored synthetic fixture.
 * @param {unknown} input.decisionManifest Sealed G0 decision manifest.
 * @param {unknown} input.containmentEvidence Boundary verifier facts.
 * @returns {object} Deterministic accepted or rejected proof result.
 */
export function runG0ContractProof({
	fixture,
	decisionManifest,
	containmentEvidence,
}) {
	try {
		const normalizedFixture = normalizeG0ContractFixture(fixture);
		const normalizedManifest = normalizeG0DecisionManifest(decisionManifest);
		const normalizedContainment =
			normalizeG0ContainmentEvidence(containmentEvidence);
		const t0Fingerprint =
			normalizedFixture.identities.queryStateFingerprints.t0;
		const t1Fingerprint =
			normalizedFixture.identities.queryStateFingerprints.t1;

		const reorderedInput = canonicalClone(fixture);
		reorderedInput.sources.reverse();
		reorderedInput.rosterInput.layers[0].members.reverse();
		reorderedInput.states.forEach((state) => state.placements.reverse());
		const reorderedNormalized = normalizeG0ContractFixture(reorderedInput);

		const sharedSunIdentityRows = normalizedFixture.states.map((state) => {
			const placement = state.placements.find(({ sourceId }) => sourceId === 'sun');
			return normalizedFixture.sharedSun.consumerReferences.map(({ consumerId }) => ({
				consumerId,
				sourceDefinitionFingerprint:
					normalizedFixture.sharedSun.sourceIdentity.sourceDefinitionFingerprint,
				radiometryFingerprint:
					normalizedFixture.sharedSun.sourceIdentity.radiometryFingerprint,
				placementProviderContractFingerprint:
					normalizedFixture.sharedSun.sourceIdentity
						.placementProviderContractFingerprint,
				placementStateFingerprint: placement.placementStateFingerprint,
			}));
		});
		const sharedSunMatches = sharedSunIdentityRows.every((rows) =>
			sameCanonicalValue(
				without(rows[0], ['consumerId']),
				without(rows[1], ['consumerId']),
			));

		const cameraIndependentFingerprints =
			normalizedFixture.cameraVariants.map(() => ({
				physicalFieldFingerprint:
					normalizedFixture.identities.physicalFieldFingerprint,
				queryStateFingerprint:
					normalizedFixture.identities.queryStateFingerprints.t0,
			}));
		const cameraExcluded = cameraIndependentFingerprints.every((identity) =>
			sameCanonicalValue(identity, cameraIndependentFingerprints[0]));

		const negativeControls = evaluateNegativeControls(
			fixture,
			decisionManifest,
			containmentEvidence,
		);
		const assertions = [
			{
				id: 'baseline.candidate-identical',
				accepted:
					normalizedManifest.candidateSeed.identicalToBaseline
					&& normalizedManifest.candidateSeed.aggregateHash
						=== normalizedManifest.baselineManifest.aggregateHash
					&& normalizedContainment.candidateByteIdentical,
			},
			{
				id: 'claim.g0-only',
				accepted:
					normalizedFixture.family.representation === 'unrealized-contract-only'
					&& /no astronomical, atmospheric-transport, cache-realization, raster, visibility, or GPU claim/iu
						.test(normalizedFixture.claimBoundary),
			},
			{
				id: 'containment.boundary-evidence',
				accepted: REQUIRED_CONTAINMENT_FLAGS.every((flag) =>
					normalizedContainment[flag] === true),
			},
			{
				id: 'fixture.schema-and-typed-measures',
				accepted:
					normalizedFixture.sources.length === 3
					&& normalizedFixture.sources.filter(({ sourceKind }) =>
						sourceKind === 'point').every(({ spectralMeasure }) =>
						spectralMeasure.quantity === 'spectral-irradiance-density'
						&& spectralMeasure.units === 'W m^-2 nm^-1'
						&& spectralMeasure.values.length === SPECTRAL_CHANNEL_COUNT)
					&& normalizedFixture.sources.filter(({ sourceKind }) =>
						sourceKind === 'extended').every(({ spectralMeasure }) =>
						spectralMeasure.quantity === 'spectral-radiance-density'
						&& spectralMeasure.units === 'W m^-2 sr^-1 nm^-1'
						&& spectralMeasure.values.length === SPECTRAL_CHANNEL_COUNT),
			},
			{
				id: 'geometry.exact-named-frame-transforms',
				accepted: normalizedFixture.states.every((state) =>
					state.placements.every((placement) =>
						vectorsNear(
							placement.directionToSourceModel,
							fixture.expected.modelDirections[state.stateId][placement.sourceId],
						))),
			},
			{
				id: 'identity.camera-excluded',
				accepted: cameraExcluded,
			},
			{
				id: 'identity.placement-only-query-change',
				accepted:
					t0Fingerprint !== t1Fingerprint
					&& normalizedFixture.identities.physicalFieldFingerprint
						=== reorderedNormalized.identities.physicalFieldFingerprint,
			},
			{
				id: 'negative.classified-contract-errors',
				accepted: negativeControls.every(({ accepted }) => accepted),
			},
			{
				id: 'roster.canonical-layer-and-member-order',
				accepted:
					sameCanonicalValue(
						normalizedFixture.roster.layers.map(({ layerId }) => layerId),
						['stars', 'sun'],
					)
					&& sameCanonicalValue(
						normalizedFixture.roster.layers[0].members.map(({ memberId }) =>
							memberId),
						['star-alpha', 'star-beta'],
					)
					&& normalizedFixture.roster.foregroundEdges.length === 0
					&& normalizedFixture.identities.physicalFieldFingerprint
						=== reorderedNormalized.identities.physicalFieldFingerprint,
			},
			{
				id: 'sun.shared-canonical-identity',
				accepted: sharedSunMatches,
			},
		].sort((left, right) => compareCanonicalStrings(left.id, right.id));
		const accepted = assertions.every((assertion) => assertion.accepted);
		const body = {
			proofId: G0_PROOF_ID,
			status: accepted ? 'accepted' : 'rejected',
			accepted,
			claimBoundary:
				'G0 contract mechanics only; no cache, transport, raster, visibility, or GPU implementation claim.',
			summary: {
				assertionCount: assertions.length,
				acceptedAssertionCount:
					assertions.filter((assertion) => assertion.accepted).length,
				rejectedAssertionCount:
					assertions.filter((assertion) => !assertion.accepted).length,
				negativeControlCount: negativeControls.length,
			},
			assertions,
			negativeControls,
			identities: {
				decisionManifestFingerprint: normalizedManifest.contentHash,
				fixtureFingerprint: canonicalFingerprint(fixture),
				physicalFieldFingerprint:
					normalizedFixture.identities.physicalFieldFingerprint,
				runtimeCompatibilityFingerprint:
					normalizedFixture.identities.runtimeCompatibilityFingerprint,
				queryStateFingerprints:
					normalizedFixture.identities.queryStateFingerprints,
				sourceDefinitionFingerprints: Object.fromEntries(
					normalizedFixture.sources.map((source) => [
						source.sourceId,
						source.sourceDefinitionFingerprint,
					]),
				),
				placementStateFingerprints: Object.fromEntries(
					normalizedFixture.states.map((state) => [
						state.stateId,
						Object.fromEntries(state.placements.map((placement) => [
							placement.sourceId,
							placement.placementStateFingerprint,
						])),
					]),
				),
			},
			mechanics: {
				layerIds:
					normalizedFixture.roster.layers.map(({ layerId }) => layerId),
				pointMemberIds:
					normalizedFixture.roster.layers[0].members.map(({ memberId }) =>
						memberId),
				pointSourceIndices: normalizedFixture.roster.pointSourceIndices,
				extendedSourceIndices: normalizedFixture.roster.extendedSourceIndices,
				modelDirections: Object.fromEntries(
					normalizedFixture.states.map((state) => [
						state.stateId,
						Object.fromEntries(state.placements.map((placement) => [
							placement.sourceId,
							placement.directionToSourceModel,
						])),
					]),
				),
				sharedSun: normalizedFixture.sharedSun,
			},
		};
		return {
			...body,
			proofFingerprint: canonicalFingerprint(body),
		};
	} catch (error) {
		return createRejectedProof(error);
	}
}
