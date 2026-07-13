import { ShaderCompatibilityValidator as DefaultShaderCompatibilityValidator } from './ShaderCompatibilityValidator.js';
import { acceptShaderAssemblyCollections } from './shaderCollectionValidation.js';
import { stableHash } from './stableHash.js';

/** @type {readonly ShaderOwnerId[]} */
const OWNER_ORDER = [
	'runtime',
	'geometry',
	'lightSource',
	'atmosphere',
	'cache',
	'transport',
	'color',
];

/** @type {readonly ShaderSourceSlot[]} */
const SOURCE_SLOTS = [
	'declareTypes',
	'declareConstants',
	'declareHelpers',
	'reconstructRay',
	'resolvePathBounds',
	'sampleAtmosphere',
	'sampleLightSource',
	'sampleScatteringCache',
	'sampleCelestialCache',
	'evaluateTransport',
	'evaluateCelestialRadiance',
	'composeSpectralRadiance',
	'composeSceneColor',
	'encodeOutput',
	'diagnosticOutput',
];

/** @type {readonly ShaderSourceSlot[]} */
const MAIN_HOOK_SLOTS = [
	'reconstructRay',
	'resolvePathBounds',
	'sampleAtmosphere',
	'sampleLightSource',
	'sampleScatteringCache',
	'evaluateTransport',
	'evaluateCelestialRadiance',
	'composeSpectralRadiance',
	'composeSceneColor',
	'encodeOutput',
	'diagnosticOutput',
];

const GLSL_DIRECTIVE_PREFIX = String.fromCharCode(35);

/**
 * Create a setup-time validation error with structured details.
 *
 * @param {ShaderSymbolValidationReport} validationReport - Supplies the report.
 * @returns {Error} Return the validation error.
 */
function createShaderValidationError(validationReport) {
	const error = /** @type {Error & {
	 * code: string,
	 * details: ShaderSymbolValidationReport,
	 * }} */ (new Error('Shader contributions do not satisfy the required symbol inventory.'));

	error.name = 'ShaderConfigurationError';
	error.code = 'SHADER_SYMBOL_VALIDATION_FAILED';
	error.details = validationReport;

	return error;
}

/**
 * Return a contribution list property or an empty array.
 *
 * @param {ShaderContribution} contribution - Supplies the contribution.
 * @template {keyof ShaderContribution} Property
 * @param {Property} property - Supplies the property name.
 * @returns {ShaderContribution[Property]} Return the selected property.
 */
function listEntries(contribution, property) {
	return contribution[property];
}

/**
 * Return the owner sort position.
 *
 * @param {ShaderOwnerId} owner - Supplies the owner id.
 * @returns {number} Return the sort position.
 */
function ownerIndex(owner) {
	const index = OWNER_ORDER.indexOf(owner);

	return index === -1 ? OWNER_ORDER.length : index;
}

/**
 * Compare contributions by accepted owner order then id.
 *
 * @param {ShaderContribution} a - Supplies the left contribution.
 * @param {ShaderContribution} b - Supplies the right contribution.
 * @returns {number} Return sort order.
 */
function compareContributions(a, b) {
	return ownerIndex(a.owner) - ownerIndex(b.owner)
		|| a.id.localeCompare(b.id);
}

/**
 * Compare sorted line entries inside a contribution group.
 *
 * @param {{ contribution: ShaderContribution, line: string }} a - Supplies the left entry.
 * @param {{ contribution: ShaderContribution, line: string }} b - Supplies the right entry.
 * @returns {number} Return sort order.
 */
function compareByContributionThenLine(a, b) {
	return compareContributions(a.contribution, b.contribution)
		|| a.line.localeCompare(b.line);
}

/**
 * Return source blocks for one shader slot.
 *
 * @param {readonly ShaderContribution[]} contributions - Supplies the contributions.
 * @param {ShaderSourceSlot} slot - Supplies the slot name.
 * @param {'functions' | 'mainHooks'} property - Supplies the block property.
 * @returns {string} Return combined source blocks.
 */
function blocksForSlot(contributions, slot, property) {
	return contributions
		.flatMap((contribution) => listEntries(contribution, property)
			.filter((block) => block.slot === slot)
			.map((block) => ({ contribution, block })))
		.sort((a, b) =>
			a.block.order - b.block.order
			|| compareContributions(a.contribution, b.contribution)
			|| a.block.id.localeCompare(b.block.id))
		.map((entry) => entry.block.code)
		.join('\n\n');
}

/**
 * Build the fragment shader source for sorted contributions.
 *
 * @param {readonly ShaderContribution[]} contributions - Supplies sorted contributions.
 * @returns {string} Return GLSL source.
 */
function assembleFragmentShader(contributions) {
	const defineSource = contributions
		.flatMap((contribution) => listEntries(contribution, 'defines')
			.map((line) => ({ contribution, line })))
		.sort(compareByContributionThenLine)
		.map((entry) => entry.line)
		.join('\n');
	const uniformSource = contributions
		.flatMap((contribution) => [
			...listEntries(contribution, 'uniforms')
				.map((uniform) => `uniform ${uniform.type} ${uniform.name};`),
			...listEntries(contribution, 'textures')
				.map((texture) => `uniform ${texture.type} ${texture.name};`),
		].map((line) => ({ contribution, line })))
		.sort(compareByContributionThenLine)
		.map((entry) => entry.line)
		.join('\n');
	const functionSource = SOURCE_SLOTS
		.map((slot) => blocksForSlot(contributions, slot, 'functions'))
		.filter(Boolean)
		.join('\n\n');
	const hookSource = MAIN_HOOK_SLOTS
		.map((slot) => blocksForSlot(contributions, slot, 'mainHooks'))
		.filter(Boolean)
		.join('\n\t');

	return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
precision highp sampler2D;
precision highp sampler3D;
precision highp sampler2DArray;

in vec2 vUv;
out vec4 outColor;

${defineSource}

${uniformSource}

${functionSource}

void main() {
	ShaderState state = createInitialShaderState(vUv);
	${hookSource}
}
`;
}

/**
 * Assemble validated owner contributions into deterministic GLSL source.
 */
export class Algorithm32ShaderAssembler {
	/**
	 * Store the compatibility validator used before source assembly.
	 *
	 * @type {ShaderCompatibilityValidator}
	 */
	_validator;

	/**
	 * Create a shader assembler.
	 *
	 * @param {ShaderAssemblerConfiguration} [configuration] - Supplies optional collaborators.
	 */
	constructor(configuration = {}) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('Shader assembler configuration must be an object when supplied.');
		}

		const validator = configuration.validator === undefined
			? new DefaultShaderCompatibilityValidator()
			: configuration.validator;

		if (!validator || typeof validator.validate !== 'function') {
			throw new TypeError('Shader assembler validator must expose validate().');
		}

		this._validator = validator;
	}

	/**
	 * Assemble one shader request after validating contribution compatibility.
	 *
	 * @param {ShaderAssemblyRequest} request - Supplies the shader assembly request.
	 * @returns {ShaderAssemblyResult} Return the accepted shader assembly.
	 */
	assemble(request) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Shader assembly request is required.');
		}

		const collections = acceptShaderAssemblyCollections(request);
		const acceptedRequest = {
			...request,
			...collections,
		};
		const validationReport = this._validator.validate(acceptedRequest);

		if (validationReport.status !== 'accepted') {
			throw createShaderValidationError(validationReport);
		}

		const contributions = [...collections.contributions].sort(compareContributions);
		const fragmentShaderSource = assembleFragmentShader(contributions);
		const bindingRequirements = contributions
			.flatMap((contribution) => contribution.bindingRequirements)
			.sort((a, b) => a.id.localeCompare(b.id));

		return {
			status: 'accepted',
			descriptor: request.descriptor,
			fragmentShaderSource,
			sourceHash: stableHash(fragmentShaderSource),
			contributions,
			validationReport,
			bindingRequirements,
			diagnostics: {
				ownerOrder: OWNER_ORDER,
				sourceSlots: SOURCE_SLOTS,
				mainHookSlots: MAIN_HOOK_SLOTS,
			},
		};
	}
}
