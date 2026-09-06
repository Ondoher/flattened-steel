const DEVELOPMENT_INTERFACE_ID = 'camera-development-v1';
const IDENTITY_CLAMP_OPERATOR = 'identity-clamp';

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function requireTriplet(value, label) {
	requireCondition(Array.isArray(value) && value.length === 3, `${label} must have three channels.`);
	requireCondition(value.every(Number.isFinite), `${label} contains a non-finite value.`);
}

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

export function validateCameraDevelopmentProfile(development) {
	requireCondition(development && typeof development === 'object' && !Array.isArray(development), 'Development profile is required.');
	requireCondition(development.interfaceId === DEVELOPMENT_INTERFACE_ID, `Development interface must be ${DEVELOPMENT_INTERFACE_ID}.`);
	requireCondition(development.operator === IDENTITY_CLAMP_OPERATOR, `Unsupported development operator: ${development.operator}.`);
	requireTriplet(development.linearMinimum, 'Development minimum');
	requireTriplet(development.linearMaximum, 'Development maximum');
	for (let index = 0; index < 3; index += 1) {
		requireCondition(development.linearMinimum[index] <= development.linearMaximum[index], 'Development bounds are reversed.');
	}
	return development;
}

export function applyCameraDevelopment(development, linearRgb) {
	validateCameraDevelopmentProfile(development);
	requireTriplet(linearRgb, 'Pre-development linear RGB');
	return linearRgb.map((value, index) => clamp(
		value,
		development.linearMinimum[index],
		development.linearMaximum[index],
	));
}

export {DEVELOPMENT_INTERFACE_ID, IDENTITY_CLAMP_OPERATOR};
