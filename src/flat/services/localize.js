import {Service} from '@polylith/core';
import phrases from '../phrases/en-US.json';
/**
 * Call this function to parse a phrase JSON document without hiding configuration failures.
 *
 * @param {string} source - The serialized phrase document.
 * @returns {Record<string, unknown>} - The parsed phrase collection.
 */
export function parsePhraseJson(source) {
	const value = JSON.parse(source);
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new SyntaxError('Phrase JSON must contain an object.');
	return value;
}
/**
 * Call this function to replace validated named tokens in controlled text.
 *
 * @param {string} value - The text containing named tokens.
 * @param {Record<string, string | number>} replacements - Named replacement values.
 * @param {boolean} escapeHtml - Whether replacement markup characters are escaped.
 * @returns {string} - Text with supported replacements applied.
 */
export function replaceText(value, replacements = {}, escapeHtml = false) {
	return String(value).replace(/%\{([^}]+)\}/g, (_, name) => {
		const replacement = replacements[name];
		if (replacement === undefined) {
			console.warn(`Missing replacement: ${name}`);
			return '';
		}
		if (
			(typeof replacement !== 'string' && typeof replacement !== 'number') ||
			(typeof replacement === 'number' && !Number.isFinite(replacement))
		) {
			console.error(`Invalid replacement: ${name}`);
			return '';
		}
		const result = String(replacement);
		return escapeHtml
			? result.replace(
					/[&<>"']/g,
					(character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[character],
				)
			: result;
	});
}
/**
 * Call this function to create a translator for one locale and phrase collection.
 *
 * @param {string} locale - The locale used for plural selection.
 * @param {Record<string, unknown>} source - The phrase values to resolve.
 * @returns {Function} - The configured phrase translator.
 */
export function createTranslator(locale = 'en-US', source = phrases) {
	const pluralRules = new Intl.PluralRules(locale);
	/**
	 * Call this function to resolve one phrase and its replacements.
	 *
	 * @param {string} key - The phrase key to resolve.
	 * @param {Record<string, string | number>} replacements - Named replacement values.
	 * @param {number} [cardinal] - The cardinal value used for plural selection.
	 * @param {boolean} [escapeHtml] - Whether replacement markup characters are escaped.
	 * @returns {string} - The resolved phrase, or empty text when it is unavailable or invalid.
	 */
	function translate(key, replacements = {}, cardinal, escapeHtml = false) {
		let value = source[key];
		if (value === undefined) {
			console.warn(`Missing translation: ${key}`);
			return '';
		}
		if (Array.isArray(value)) {
			console.warn(`Unsupported translation value: ${key}`);
			return '';
		}
		if (value && typeof value === 'object') {
			if (!Object.hasOwn(value, 'other')) {
				console.error(`Plural translation lacks other: ${key}`);
				return '';
			}
			value = value[pluralRules.select(Number(cardinal))] ?? value.other;
		}
		if (typeof value !== 'string') {
			console.warn(`Unsupported translation value: ${key}`);
			return '';
		}
		return replaceText(value, replacements, escapeHtml);
	}
	return translate;
}
/**
 * Locale service that owns the generated en-US translator.
 *
 * @implements {LocalizeService}
 */
export class LocalizeService extends Service {
	/**
	 * Creates the localization service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('localize', registry);
		this.implement(['start', 'supportsLocale', 'translate', 'replace']);
	}
	/** Call this method to initialize the loaded translator collection. */
	start() {
		this.translators = new Map([['en-US', createTranslator('en-US', phrases)]]);
	}
	/**
	 * Call this method to determine whether a locale has loaded phrases.
	 *
	 * @param {string} locale - The candidate locale.
	 * @returns {boolean} - Whether the locale is loaded.
	 */
	supportsLocale(locale) {
		return this.translators.has(locale);
	}
	/**
	 * Call this method to resolve a phrase through a loaded translator.
	 *
	 * @param {string} key - The phrase key.
	 * @param {Record<string, string | number>} replacements - Named values.
	 * @param {number} cardinal - The plural cardinal.
	 * @param {string} locale - The requested locale.
	 * @param {boolean} escapeHtml - Whether replacement markup is escaped.
	 * @returns {string} - The resolved phrase.
	 */
	translate(key, replacements = {}, cardinal, locale = 'en-US', escapeHtml = false) {
		const translator = this.translators.get(locale);
		if (!translator) {
			console.warn(`Locale is not loaded: ${locale}`);
			return '';
		}
		return translator(key, replacements, cardinal, escapeHtml);
	}
	/**
	 * Call this method to apply phrase-compatible replacements to controlled content.
	 *
	 * @param {string} value - The controlled content.
	 * @param {Record<string, string | number>} replacements - Named values.
	 * @param {boolean} escapeHtml - Whether replacement markup is escaped.
	 * @returns {string} - The replaced content.
	 */
	replace(value, replacements = {}, escapeHtml = false) {
		return replaceText(value, replacements, escapeHtml);
	}
}
new LocalizeService();
