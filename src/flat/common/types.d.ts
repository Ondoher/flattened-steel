/**
 * Shared Polylith event API implemented by application services.
 */
type EventBus = import('@polylith/core').EventBus;

/**
 * Application registry supplied by the owning runtime.
 */
type Registry = import('@polylith/core').Registry;

/**
 * Public application context capability declared by its owning service.
 */
type AppContextServiceContract = import('../services/app-context.js').AppContextService;

/**
 * defines the parameters be inserted into a translation phrase
 * these are indicated by a %{name} in the translation text
 */
type LocalizeReplacements = Record<string, string | number>;

/**
 * This can be used to specify all parts of a translation for ease of use
 */
type LocalizePhrase = {
	/**
	 * the string that is used to lookup the translation
	 */
	phrase: string;
	/**
	 * the replacements to use in the translation
	 */
	replacements?: LocalizeReplacements;
	/**
	 * the number to use when searching for the correct translation
	 */
	cardinal?: number;
};

/**
 * A phrase key, optionally paired with named replacements and plural selection.
 */
type LocalizedText = string | LocalizePhrase;

/**
 * Translation capability consumed by presentation components.
 */
interface LocalizationProvider extends EventBus {
	/**
	 * Call this method during application configuration to select the default translator.
	 *
	 * @param locale - Loaded locale, or disabled for pass-through text and replacements.
	 */
	setLocale(locale: string): void;

	/**
	 * Call this method to resolve a phrase for the current locale.
	 *
	 * @param key - The phrase key to resolve.
	 * @param replacements - Optional named replacement values.
	 * @param cardinal - Optional value used to select a plural form.
	 * @param locale - Optional loaded locale; defaults to the selected service locale.
	 * @param escapeHtml - Whether replacement markup is escaped; defaults to false.
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

/**
 * Global values supplied to React presentation components.
 */
type AppContextValue = {
	/**
	 * Service registry used by the current application.
	 */
	registry: Registry;
	/**
	 * Current translator locale used by client and HTTP services; disabled when localization is off.
	 */
	locale: 'en-US' | string;
	/**
	 * Localization service supplied before presentation is mounted.
	 */
	localize: LocalizationProvider | null;
	/**
	 * Whether authored accessibility metadata should be added when native semantics are insufficient.
	 */
	accessibilityEnabled: boolean;
	/**
	 * Default size supplied when constructing MUI controls that support the size property.
	 */
	controlSize: 'small';
	/**
	 * Default appearance supplied when constructing MUI controls that support outlined presentation.
	 */
	controlVariant: 'outlined';
};

/**
 * Page metadata registered with the application shell.
 */
type AppPageRecord = {
	/**
	 * Stable page identifier.
	 */
	id: string;
	/**
	 * Localization phrase key for the page label.
	 */
	label: string;
	/**
	 * URL path segment owned by the page.
	 */
	urlSlug: string;
	/**
	 * Navigation ordering value.
	 */
	order: number;
	/**
	 * Whether the executor selected this page as the application default.
	 */
	default?: boolean;
	/**
	 * Registry name of the feature controller that mounts the page.
	 */
	controller: string;
};

/**
 * Disposable per-view projection of coordinator notifications and workspace eligibility.
 */
type CameraSyncViewState = {
	/**
	 * Last subscription notification; now actions leave this value unchanged.
	 */
	mode: CameraSyncMode;

	/**
	 * Whether the workspace currently has two populated views.
	 */
	available: boolean;
};

/**
 * Instance-specific receiver construction owned by a ready feature controller.
 */
type ViewCameraSyncReceiverOptions = {
	/**
	 * Unique registered name including the mounted view lifetime.
	 */
	name: string;

	/**
	 * Owning application registry, never the installation/master registry.
	 */
	registry: unknown;

	/**
	 * Application-local coordinator capability.
	 */
	coordinator: CameraSyncService;

	/**
	 * Notification delegated to the exact owning session.
	 */
	onSynced: (mode: CameraSyncMode) => void;

	/**
	 * Non-echoing camera operation delegated to the exact owning session.
	 */
	applyControls: (controls: CameraSyncControls) => Promise<Error | void>;
};

/**
 * Owner-managed receiver capability, created after application readiness.
 */
interface ViewCameraSyncReceiverService extends CameraSyncReceiver {
	/**
	 * Call this method to join synchronization with the initial requested controls.
	 *
	 * @param controls - Initial orientation and elevation.
	 */
	connect(controls: CameraSyncControls): void;

	/**
	 * Call this method to report a user-origin change.
	 *
	 * @param controls - Latest requested controls.
	 */
	publish(controls: CameraSyncControls): void;

	/**
	 * Call this method to request a mode through the owning controller.
	 *
	 * @param mode - Requested action.
	 */
	request(mode: CameraSyncMode): void;

	/**
	 * Call this method to retire callbacks and unregister the receiver.
	 */
	retire(): void;
}

/**
 * Completion shared by requests for the same pending physical height.
 */
type SceneHeightRequest = {
	/**
	 * Requested physical height in meters.
	 */
	heightMeters: number;

	/**
	 * Outcome settled by acceptance, supersession, failure or detachment.
	 */
	promise: Promise<Error | void>;

	/**
	 * Idempotent completion invoked before retiring the owned request.
	 */
	complete: (error?: Error) => void;
};
