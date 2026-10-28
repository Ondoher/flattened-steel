/** Public registry contract implemented by the AppContextService application service. */
interface AppContextService extends EventBus {
	/**
	 * Call this method to read the current service value.
	 *
	 * @returns - The get operation result.
	 */
	get(): AppContextValue;
	/**
	 * Call this method to replace the current application locale.
	 *
	 * @param locale - The locale value required by this operation.
	 * @returns - The setLocale operation result.
	 */
	setLocale(locale: string): boolean;
}
