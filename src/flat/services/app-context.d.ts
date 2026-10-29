/**
 * Public registry contract implemented by the AppContextService application service.
 */
export interface AppContextService extends EventBus {
	/**
	 * Call this method to read a defensive snapshot of the application context.
	 *
	 * @returns - Current locale, presentation flags, registry, and localization capability.
	 */
	get(): AppContextValue;

	/**
	 * Call this method to replace the current application locale.
	 *
	 * @param locale - Locale with phrases already loaded by the localization service.
	 * @returns - Whether the locale changed; false when it is already selected or unavailable.
	 */
	setLocale(locale: string): boolean;
}
