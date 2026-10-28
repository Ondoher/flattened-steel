import {Service} from '@polylith/core';
/**
 * Global application-context owner for registry, locale, localization, and accessibility state.
 *
 * @implements {AppContextService}
 */
export class AppContextService extends Service {
	/**
	 * Creates the application-context service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('app-context', registry);
		this.implement(['start', 'get', 'setLocale']);
	}
	/** Call this method to initialize the context with generated feature flags. */
	start() {
		this.value = {
			registry: this.registry,
			locale: 'en-US',
			localize: this.registry.subscribe('localize'),
			localizationEnabled: true,
			accessibilityEnabled: false,
		};
	}
	/**
	 * Call this method to read a defensive application-context value.
	 *
	 * @returns {AppContextValue} - The current context.
	 */
	get() {
		return {...this.value};
	}
	/**
	 * Call this method to replace the current locale when its phrases are loaded.
	 *
	 * @param {string} locale - The next locale.
	 * @returns {boolean} - Whether the locale changed.
	 */
	setLocale(locale) {
		if (!this.value.localize.supportsLocale(locale)) {
			console.warn(`Locale is not loaded: ${locale}`);
			return false;
		}
		if (locale === this.value.locale) return false;
		this.value = {...this.value, locale};
		this.fire('locale', locale);
		this.fire('changed', this.get());
		return true;
	}
}
new AppContextService();
