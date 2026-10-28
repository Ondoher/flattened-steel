/** Public registry contract implemented by the LocalizeService application service. */
interface LocalizeService extends EventBus {
	/**
	 * Call this method to invoke the supportsLocale service operation.
	 *
	 * @param locale - The locale value required by this operation.
	 * @returns - The supportsLocale operation result.
	 */
	supportsLocale(locale: string): boolean;
	/**
	 * Call this method to resolve a phrase for the current locale.
	 *
	 * @param key - The key value required by this operation.
	 * @param replacements - The replacements value required by this operation.
	 * @param cardinal - The cardinal value required by this operation.
	 * @param locale - The locale value required by this operation.
	 * @param escapeHtml - The escapeHtml value required by this operation.
	 * @returns - The translate operation result.
	 */
	translate(
		key: string,
		replacements?: Record<string, string | number>,
		cardinal?: number,
		locale?: string,
		escapeHtml?: boolean,
	): string;
	/**
	 * Call this method to invoke the replace service operation.
	 *
	 * @param value - The value value required by this operation.
	 * @param replacements - The replacements value required by this operation.
	 * @param escapeHtml - The escapeHtml value required by this operation.
	 * @returns - The replace operation result.
	 */
	replace(value: string, replacements?: Record<string, string | number>, escapeHtml?: boolean): string;
}
