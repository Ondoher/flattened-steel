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
		/** @type {AppContextValue} */
		this.value = {
			registry: this.registry,
			locale: 'en-US',
			localize: null,
			localizationEnabled: true,
			accessibilityEnabled: false,
			controlSize: 'small',
			controlVariant: 'outlined',
		};
	}

	/**
	 * Call this method at dependency readiness to resolve localization and publish a changed context.
	 */
	ready() {
		let localize = this.registry.subscribe('localize') ?? null;
		if (this.value.localize !== localize) {
			this.value = {...this.value, localize};
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
		if (locale === this.value.locale) {
			return false;
		}
		this.value = {...this.value, locale};
		this.fire('locale', locale);
		this.fire('changed', this.get());
		return true;
	}
}
new AppContextService();
