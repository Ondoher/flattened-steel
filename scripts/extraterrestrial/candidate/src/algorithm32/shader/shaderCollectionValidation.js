const CONTRIBUTION_COLLECTION_FIELDS = [
	'compatibilityTags',
	'provides',
	'requires',
	'defines',
	'uniforms',
	'textures',
	'functions',
	'mainHooks',
	'bindingRequirements',
];

/**
 * Accept an optional collection, defaulting only an absent value.
 *
 * @param {unknown} value - Supplies the candidate collection.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {readonly unknown[]} The accepted collection.
 */
export function acceptOptionalArray(value, label) {
	if (value === undefined) {
		return [];
	}

	if (!Array.isArray(value)) {
		throw new TypeError(`${label} must be an array when supplied.`);
	}

	return value;
}

/**
 * Validate collection-valued fields carried by one contribution.
 *
 * @param {unknown} value - Supplies the candidate contribution.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {ShaderContribution} The accepted contribution.
 */
export function acceptShaderContributionCollections(value, label) {
	if (!value || typeof value !== 'object') {
		throw new TypeError(`${label} must be an object.`);
	}

	const contribution = /** @type {ShaderContribution} */ (value);

	/** @type {Record<string, readonly unknown[]>} */
	const normalizedCollections = {};

	for (const fieldName of CONTRIBUTION_COLLECTION_FIELDS) {
		normalizedCollections[fieldName] = acceptOptionalArray(
			contribution[fieldName],
			`${label}.${fieldName}`,
		);
	}

	return /** @type {ShaderContribution} */ ({
		...contribution,
		...normalizedCollections,
	});
}

/**
 * Validate the collection-valued fields of one assembly request.
 *
 * @param {ShaderAssemblyRequest} request - Supplies the candidate request.
 * @returns {{ contributions: readonly ShaderContribution[], mainRequiredSymbols: readonly string[], systemProvidedSymbols: readonly string[] }} Accepted collections.
 */
export function acceptShaderAssemblyCollections(request) {
	const candidateContributions = acceptOptionalArray(
		request.contributions,
		'Shader assembly contributions',
	);
	const mainRequiredSymbols = /** @type {readonly string[]} */ (
		acceptOptionalArray(request.mainRequiredSymbols, 'Shader assembly mainRequiredSymbols')
	);
	const systemProvidedSymbols = /** @type {readonly string[]} */ (
		acceptOptionalArray(request.systemProvidedSymbols, 'Shader assembly systemProvidedSymbols')
	);

	const contributions = candidateContributions.map((contribution, index) =>
		acceptShaderContributionCollections(contribution, `Shader assembly contribution ${index}`));

	return {
		contributions,
		mainRequiredSymbols,
		systemProvidedSymbols,
	};
}
