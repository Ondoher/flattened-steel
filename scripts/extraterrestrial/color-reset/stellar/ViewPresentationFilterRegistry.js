/** Stable identity of the first contained view-presentation filter registry. */
export const VIEW_PRESENTATION_FILTER_REGISTRY_ID =
	'view-presentation-filter-registry-v1';

/** The only execution hook authorized by CR6D. */
export const CR6D_IMPLEMENTED_FILTER_STAGE = 'source-linear';

/** The only semantic target authorized by CR6D. */
export const CR6D_IMPLEMENTED_FILTER_TARGET = 'stellar';

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function acceptRgb(rgb, label) {
	requireCondition(rgb?.length === 3, `${label} must contain exactly three channels.`);
	const accepted = Array.from(rgb, Number);
	requireCondition(accepted.every(Number.isFinite), `${label} must be finite.`);
	return accepted;
}

/**
 * Validate one explicit, ordered filter configuration against registered
 * implementations. No callback or unregistered shader surface is accepted.
 *
 * @param {object} configuration
 * @param {ReadonlyMap<string, object>} implementations
 * @returns {object}
 */
export function acceptViewPresentationFilterConfiguration(configuration, implementations) {
	requireCondition(
		configuration?.schemaId === VIEW_PRESENTATION_FILTER_REGISTRY_ID,
		'View-presentation filter configuration identity changed.',
	);
	requireCondition(Array.isArray(configuration.filters), 'View-presentation filters must be an array.');
	const ids = new Set();
	for (let index = 0; index < configuration.filters.length; index += 1) {
		const filter = configuration.filters[index];
		requireCondition(filter && typeof filter === 'object', `View filter ${index} is invalid.`);
		requireCondition(typeof filter.id === 'string' && filter.id.length > 0, `View filter ${index} lacks an id.`);
		requireCondition(!ids.has(filter.id), `View filter id ${filter.id} is duplicated.`);
		ids.add(filter.id);
		requireCondition(filter.order === index, `View filter ${filter.id} order changed.`);
		requireCondition(typeof filter.enabled === 'boolean', `View filter ${filter.id} enabled flag is invalid.`);
		requireCondition(
			filter.stage === CR6D_IMPLEMENTED_FILTER_STAGE,
			`View filter ${filter.id} requests an unimplemented stage.`,
		);
		requireCondition(
			filter.target === CR6D_IMPLEMENTED_FILTER_TARGET,
			`View filter ${filter.id} requests an unimplemented target.`,
		);
		const implementation = implementations.get(filter.id);
		requireCondition(implementation, `View filter ${filter.id} is not registered.`);
		requireCondition(
			implementation.id === filter.id &&
				implementation.stage === filter.stage &&
				implementation.target === filter.target &&
				typeof implementation.apply === 'function',
			`View filter ${filter.id} implementation contract changed.`,
		);
	}
	return configuration;
}

/**
 * Apply the enabled source-linear filters for one declared semantic source.
 * Disabled and empty registries return the input scalar values without
 * arithmetic, which is the CR6C identity path.
 *
 * @param {ArrayLike<number>} rgb
 * @param {{target: string, visualMagnitude: number}} metadata
 * @param {object} configuration
 * @param {ReadonlyMap<string, object>} implementations
 * @returns {[number, number, number]}
 */
export function applySourceLinearViewPresentationFilters(
	rgb,
	metadata,
	configuration,
	implementations,
) {
	const accepted = acceptRgb(rgb, 'Source-linear filter input');
	acceptViewPresentationFilterConfiguration(configuration, implementations);
	requireCondition(
		metadata?.target === CR6D_IMPLEMENTED_FILTER_TARGET &&
			Number.isFinite(metadata.visualMagnitude),
		'Source-linear stellar filter metadata changed.',
	);
	let result = accepted;
	for (const filter of configuration.filters) {
		if (!filter.enabled || filter.stage !== CR6D_IMPLEMENTED_FILTER_STAGE || filter.target !== metadata.target) {
			continue;
		}
		result = acceptRgb(
			implementations.get(filter.id).apply(result, metadata, filter.parameters),
			`View filter ${filter.id} output`,
		);
	}
	return /** @type {[number, number, number]} */ (result);
}
