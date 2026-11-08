/**
 * Resolves supplied UI text through the selected translator, including disabled mode.
 *
 * @param {AppContextValue} context - The current global application context.
 * @param {LocalizedText} [value] - Phrase key and optional replacements.
 * @param {Record<string, string | number>} [replacements] - Phrase replacement values.
 * @param {number} [cardinal] - The plural-selection cardinal value.
 * @param {boolean} [escapeHtml] - Whether replacement markup is escaped.
 * @returns {string} - The resolved display text.
 */
export function resolveComponentText(context, value, replacements, cardinal, escapeHtml = false) {
	if (value === undefined || value === null || value === '') {
		return '';
	}
	if (typeof value === 'string') {
		return context.localize.translate(value, replacements, cardinal, context.locale, escapeHtml);
	}
	return context.localize.translate(value.phrase, value.replacements, value.cardinal, context.locale, escapeHtml);
}
