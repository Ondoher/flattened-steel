import {Service} from '@polylith/core';
/**
 * Global application-context owner for registry, locale, feature flags and control defaults.
 *
 * @implements {AppContextServiceContract}
 */
export class AppContextService extends Service {
	/**
	 * Creates the application-context service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('app-context', registry);
		this.implement(['start', 'ready', 'get', 'setLocale']);
	}

	/**
	 * Call this method to initialize the context with feature flags and shared control defaults.
	 */
	start() {
		let locale = 'en-US';
		/**
		 * @type {AppContextValue}
		 */
		this.value = {
			registry: this.registry,
			locale,
			localize: null,
			accessibilityEnabled: false,
			controlSize: 'small',
			controlVariant: 'outlined',
		};
	}

	/**
	 * Call this method at dependency readiness to select the shared translator before publishing context.
	 */
	ready() {
		let localize = /** @type {LocalizeService} */ (this.registry.subscribe('localize'));
		let locale = this.value.locale;
		if (this.value.localize !== localize) {
			localize.setLocale(locale);
			this.value = {...this.value, localize, locale};
			this.fire('changed', this.get());
		}
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
	 * Call this method to select a loaded translator and publish its matching locale.
	 *
	 * @param {string} locale - The next locale.
	 * @returns {boolean} - Whether the locale changed.
	 */
	setLocale(locale) {
		if (!this.value.localize.supportsLocale(locale)) {
			console.warn(`Locale is not loaded: ${locale}`);
			return false;
		}
		if (locale === this.value.locale) {
			return false;
		}
		this.value.localize.setLocale(locale);
		this.value = {...this.value, locale};
		this.fire('locale', locale);
		this.fire('changed', this.get());
		return true;
	}
}
new AppContextService();
