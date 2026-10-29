/**
 * Public registry contract implemented by the LocalizeService application service.
 */
interface LocalizeService extends EventBus {
	/**
	 * Call this method to determine whether a locale has loaded phrase data.
	 *
	 * @param locale - Locale whose translator must already be loaded.
	 * @returns - Whether the localization service can translate that locale.
	 */
	supportsLocale(locale: string): boolean;

	/**
	 * Call this method to resolve a phrase for the current locale.
	 *
	 * @param key - Phrase key in the selected locale's catalog.
	 * @param replacements - Optional named values substituted into the phrase.
	 * @param cardinal - Optional value selecting a locale-specific plural form.
	 * @param locale - Optional loaded locale; defaults to en-US.
	 * @param escapeHtml - Whether replacement markup is escaped; defaults to false.
	 * @returns - Resolved phrase, or empty text after a failed lookup.
	 */
	translate(
		key: string,
		replacements?: Record<string, string | number>,
		cardinal?: number,
		locale?: string,
		escapeHtml?: boolean,
	): string;

	/**
	 * Call this method to substitute named values into controlled phrase-compatible content.
	 *
	 * @param value - Controlled content containing named replacement placeholders.
	 * @param replacements - Optional named values supplied to the placeholders.
	 * @param escapeHtml - Whether replacement markup is escaped; defaults to false.
	 * @returns - Content with the supplied replacement values applied.
	 */
	replace(value: string, replacements?: Record<string, string | number>, escapeHtml?: boolean): string;
}
