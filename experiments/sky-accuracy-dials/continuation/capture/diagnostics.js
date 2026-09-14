import {validateGroundDensityCapture} from './ground.js';
import {validateAdaptiveCapture} from './adaptive.js';

/** Reject malformed or unbounded browser-supplied component evidence. @param {unknown} condition @param {string} message */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Validate one explicit bounded diagnostic identifier. @param {unknown} value @returns {boolean} */
function identifier(value) {
	return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/u.test(value);
}

/**
 * Admit the fixed continuation metadata schema without weakening spectral checks.
 * This validates transport identities, finite radiance, bounded work counts and
 * row uniqueness. Scientific allowances remain the owning reference method's claim.
 * @param {unknown} value - Parsed browser metadata at the host boundary.
 * @returns {SkyContinuationChannelDiagnostics} - The validated original record.
 */
export function validateChannelDiagnostics(value) {
	requireCondition(
		value !== null && typeof value === 'object' && !Array.isArray(value),
		'GPU diagnostics must be a record.',
	);
	const record = /** @type {SkyContinuationChannelDiagnostics} */ (value);
	if (record.groundDensities !== undefined) validateGroundDensityCapture(record.groundDensities);
	if (record.operations !== undefined) validateAdaptiveCapture(record.operations);
	requireCondition(
		record.schemaId === 'sky-continuation-channel-diagnostics-v1' &&
			record.scope === 'component-probes' &&
			record.units === 'W m^-2 sr^-1 nm^-1',
		'GPU diagnostic schema, scope or units are invalid.',
	);
	for (const count of [record.queryCount, record.evaluationCount, record.preparationEvaluationCount])
		requireCondition(Number.isSafeInteger(count) && count >= 0, 'GPU diagnostic work count is invalid.');
	requireCondition(
		typeof record.allowancePolicy === 'string' &&
			record.allowancePolicy.length > 0 &&
			record.allowancePolicy.length <= 4096,
		'GPU diagnostic allowance policy is missing or unbounded.',
	);
	requireCondition(
		Array.isArray(record.probes) && record.probes.length <= 4096,
		'GPU diagnostic rows exceed the bounded contract.',
	);
	const identities = new Set();
	let evaluationCount = 0;
	for (const probe of record.probes) {
		requireCondition(
			probe !== null && typeof probe === 'object' && !Array.isArray(probe),
			'GPU diagnostic row must be a record.',
		);
		for (const value of [probe.probeId, probe.sceneId, probe.methodId, probe.representationId])
			requireCondition(identifier(value), 'GPU diagnostic identity is invalid.');
		requireCondition(
			typeof probe.time === 'string' && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/u.test(probe.time),
			'GPU diagnostic time is invalid.',
		);
		for (const index of [probe.gridX, probe.gridY])
			requireCondition(
				Number.isInteger(index) && index >= 0 && index <= 8,
				'GPU diagnostic grid index is invalid.',
			);
		requireCondition(
			Number.isInteger(probe.order) && probe.order >= 1 && probe.order <= 4,
			'GPU diagnostic order is invalid.',
		);
		requireCondition(Number.isFinite(probe.value) && probe.value >= 0, 'GPU diagnostic radiance is invalid.');
		requireCondition(
			probe.errorAllowance === null || (Number.isFinite(probe.errorAllowance) && probe.errorAllowance >= 0),
			'GPU diagnostic allowance is invalid.',
		);
		requireCondition(
			Number.isSafeInteger(probe.evaluationCount) && probe.evaluationCount >= 0,
			'GPU diagnostic evaluation count is invalid.',
		);
		const key = JSON.stringify([probe.probeId, probe.methodId, probe.representationId, probe.order]);
		if (probe.limitations !== undefined)
			requireCondition(
				Array.isArray(probe.limitations) &&
					probe.limitations.length <= 16 &&
					probe.limitations.every(
						(reason) => typeof reason === 'string' && reason.length > 0 && reason.length <= 1024,
					),
				'GPU diagnostic limitations are unbounded.',
			);
		requireCondition(!identities.has(key), 'GPU diagnostic row identity is duplicated.');
		identities.add(key);
		evaluationCount += probe.evaluationCount;
	}
	requireCondition(
		Number.isSafeInteger(evaluationCount) && evaluationCount === record.evaluationCount,
		'GPU diagnostic aggregate work count disagrees with its rows.',
	);
	return record;
}
