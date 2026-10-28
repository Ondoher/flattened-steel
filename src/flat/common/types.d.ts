/** Shared Polylith event API implemented by application services. */
type EventBus = import('@polylith/core').EventBus;

/** Translation capability consumed by presentation components. */
interface LocalizationProvider {
	/**
	 * Call this method to resolve a phrase for the current locale.
	 *
	 * @param key - The phrase key to resolve.
	 * @param replacements - Optional named replacement values.
	 * @param cardinal - Optional value used to select a plural form.
	 * @returns - The resolved text, or empty text when the phrase is unavailable.
	 */
	translate(
		key: string,
		replacements?: Record<string, string | number>,
		cardinal?: number,
		locale?: string,
		escapeHtml?: boolean,
	): string;
	/**
	 * Call this method to determine whether a locale has loaded phrases.
	 *
	 * @param locale - The candidate locale.
	 * @returns - Whether phrases are loaded for the locale.
	 */
	supportsLocale(locale: string): boolean;
	/**
	 * Call this method to apply validated replacements to controlled content.
	 *
	 * @param value - The controlled content.
	 * @param replacements - Optional named replacement values.
	 * @param escapeHtml - Whether replacement markup is escaped.
	 * @returns - The replaced content.
	 */
	replace(value: string, replacements?: Record<string, string | number>, escapeHtml?: boolean): string;
}

/** Global values supplied to React presentation components. */
type AppContextValue = {
	/** Service registry used by the current application. */
	registry: unknown;
	/** Current locale used by client and HTTP services. */
	locale: 'en-US' | string;
	/** Optional localization service available to presentation components. */
	localize: LocalizationProvider | null;
	/** Whether presentation components should interpret configured text as phrase keys. */
	localizationEnabled: boolean;
	/** Whether authored accessibility metadata should be added when native semantics are insufficient. */
	accessibilityEnabled: boolean;
};

/** Page metadata registered with the application shell. */
type AppPageRecord = {
	/** Stable page identifier. */
	id: string;
	/** Literal page label or localization phrase key. */
	label: string;
	/** URL path segment owned by the page. */
	urlSlug: string;
	/** Optional literal label used when localization mode is disabled. */
	literalLabel?: string;
	/** Navigation ordering value. */
	order: number;
	/** Whether the executor selected this page as the application default. */
	default?: boolean;
	/** Registry name of the feature controller that mounts the page. */
	controller: string;
};

/** Presentation state exposed by the app controller through its view service. */
type AppShellState = {
	/** Identifier of the active page, or no selection. */
	activePageId: string | null;
	/** Whether the current URL identifies an unknown page. */
	notFound: boolean;
	/** Controller-mounted presentation for the active page. */
	pageComponent: import('react').ReactNode;
	/** Ordered defensive page metadata. */
	pages: AppPageRecord[];
};
