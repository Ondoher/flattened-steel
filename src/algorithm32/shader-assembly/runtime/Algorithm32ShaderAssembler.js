import {ShaderCompatibilityValidator as DefaultShaderCompatibilityValidator} from './ShaderCompatibilityValidator.js';
import {StableValueHash} from '../../value-identity/StableValueHash.js';

/**
 * Owner order constant.
 *
 *  @type {readonly ShaderOwnerId[]}
 *
 */
const OWNER_ORDER = [
	'runtime',
	'geometry',
	'lightSource',
	'atmosphere',
	'cache',
	'celestialCache',
	'transport',
	'color',
];

/**
 * Source slots constant.
 *
 *  @type {readonly ShaderSourceSlot[]}
 *
 */
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

/**
 * Main hook slots constant.
 *
 *  @type {readonly ShaderSourceSlot[]}
 *
 */
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

/** Glsl directive prefix constant. */
const GLSL_DIRECTIVE_PREFIX = String.fromCharCode(35);

/** Deterministic assembler for validated owner contributions and GLSL source. */
export class Algorithm32ShaderAssembler {
	/**
	 * Called by assembly to create a setup-time validation error with structured details.
	 *
	 * @param {ShaderSymbolValidationReport} validationReport - The rejected compatibility report.
	 * @returns {ShaderConfigurationError} - The structured validation error.
	 */
	_createShaderValidationError(validationReport) {
		const error = /** @type {ShaderConfigurationError} */ (
			new Error('Shader contributions do not satisfy the required symbol inventory.')
		);

		error.name = 'ShaderConfigurationError';
		error.code = 'SHADER_SYMBOL_VALIDATION_FAILED';
		error.details = validationReport;

		return error;
	}

	/**
	 * Called by source assembly to read one contribution list property.
	 *
	 * @template {keyof ShaderContribution} Property
	 * @param {ShaderContribution} contribution - The contribution containing the property.
	 * @param {Property} property - The property name.
	 * @returns {ShaderContribution[Property]} - The selected property value.
	 */
	_listEntries(contribution, property) {
		return contribution[property];
	}

	/**
	 * Called by contribution ordering to resolve one owner's stable sort position. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {ShaderOwnerId} owner - The contribution owner.
	 * @returns {number} - The stable sort position.
	 */
	_ownerIndex(owner) {
		const index = OWNER_ORDER.indexOf(owner);

		return index === -1 ? OWNER_ORDER.length : index;
	}

	/**
	 * Called by source assembly to compare contributions by owner order and identifier.
	 *
	 * @param {ShaderContribution} left - The left contribution.
	 * @param {ShaderContribution} right - The right contribution.
	 * @returns {number} - The deterministic comparison result.
	 */
	_compareContributions(left, right) {
		return this._ownerIndex(left.owner) - this._ownerIndex(right.owner) || left.id.localeCompare(right.id);
	}

	/**
	 * Called by source assembly to compare line entries within contribution groups.
	 *
	 * @param {ShaderContributionLineEntry} left - The left line entry.
	 * @param {ShaderContributionLineEntry} right - The right line entry.
	 * @returns {number} - The deterministic comparison result.
	 */
	_compareByContributionThenLine(left, right) {
		return this._compareContributions(left.contribution, right.contribution) || left.line.localeCompare(right.line);
	}

	/**
	 * Called by fragment assembly to collect ordered source blocks for one shader slot.
	 *
	 * @param {readonly ShaderContribution[]} contributions - The sorted contributions.
	 * @param {ShaderSourceSlot} slot - The source slot.
	 * @param {ShaderSourceBlockProperty} property - The contribution block property.
	 * @returns {string} - The combined source blocks.
	 */
	_blocksForSlot(contributions, slot, property) {
		return contributions
			.flatMap((contribution) =>
				this._listEntries(contribution, property)
					.filter((block) => block.slot === slot)
					.map((block) => ({
						contribution,
						block,
					})),
			)
			.sort(
				(left, right) =>
					left.block.order - right.block.order ||
					this._compareContributions(left.contribution, right.contribution) ||
					left.block.id.localeCompare(right.block.id),
			)
			.map((entry) => entry.block.code)
			.join('\n\n');
	}

	/**
	 * Called by assembly to build fragment shader source for sorted contributions.
	 *
	 * @param {readonly ShaderContribution[]} contributions - The sorted contributions.
	 * @returns {string} - The complete GLSL fragment source.
	 */
	_assembleFragmentShader(contributions) {
		const defineSource = contributions
			.flatMap((contribution) =>
				this._listEntries(contribution, 'defines').map((line) => ({
					contribution,
					line,
				})),
			)
			.sort((left, right) => this._compareByContributionThenLine(left, right))
			.map((entry) => entry.line)
			.join('\n');
		const uniformSource = contributions
			.flatMap((contribution) =>
				[
					...this._listEntries(contribution, 'uniforms').map(
						(uniform) => `uniform ${uniform.type} ${uniform.name};`,
					),
					...this._listEntries(contribution, 'textures').map(
						(texture) => `uniform ${texture.type} ${texture.name};`,
					),
				].map((line) => ({
					contribution,
					line,
				})),
			)
			.sort((left, right) => this._compareByContributionThenLine(left, right))
			.map((entry) => entry.line)
			.join('\n');
		const functionSource = SOURCE_SLOTS.map((slot) => this._blocksForSlot(contributions, slot, 'functions'))
			.filter(Boolean)
			.join('\n\n');
		const hookSource = MAIN_HOOK_SLOTS.map((slot) => this._blocksForSlot(contributions, slot, 'mainHooks'))
			.filter(Boolean)
			.join('\n\t');

		return `${GLSL_DIRECTIVE_PREFIX}version 300 es
precision highp float;
precision highp sampler2D;
precision highp usampler2D;
precision highp isampler2D;
precision highp sampler3D;
precision highp sampler2DArray;

in vec2 screenTextureCoordinates;
out vec4 outColor;

${defineSource}

${uniformSource}

${functionSource}

void main() {
	ShaderState state = createInitialShaderState(screenTextureCoordinates);
	${hookSource}
}
`;
	}
	/**
	 * Value that stores the compatibility validator used before source assembly.
	 *
	 * @type {ShaderCompatibilityValidator}
	 *
	 */
	_validator;

	/**
	 * Creates a shader assembler with an optional compatibility collaborator.
	 *
	 * @param {ShaderAssemblerConfiguration} [configuration] - Supplies optional collaborators.
	 */
	constructor(configuration = {}) {
		const validator =
			configuration.validator === undefined ? new DefaultShaderCompatibilityValidator() : configuration.validator;

		this._validator = validator;
	}

	/**
	 * Call this method to assemble one shader request after validating contribution compatibility.
	 *
	 * @param {ShaderAssemblyRequest} request - Supplies the shader assembly request.
	 * @returns {ShaderAssemblyResult} - Return the accepted shader assembly.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	assemble(request) {
		const validationReport = this._validator.validate(request);

		if (validationReport.status !== 'accepted') {
			throw this._createShaderValidationError(validationReport);
		}

		const contributions = [...request.contributions].sort((left, right) => this._compareContributions(left, right));
		const fragmentShaderSource = this._assembleFragmentShader(contributions);
		const bindingRequirements = contributions
			.flatMap((contribution) => contribution.bindingRequirements)
			.sort((leftBlock, rightBlock) => leftBlock.id.localeCompare(rightBlock.id));

		return {
			status: 'accepted',
			fragmentShaderSource,
			sourceHash: StableValueHash.stableHash(fragmentShaderSource),
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
