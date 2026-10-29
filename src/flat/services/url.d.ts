/**
 * Public registry contract implemented by the UrlService application service.
 */
interface UrlService extends EventBus {
	/**
	 * Call this method to remove the owned browser-history listener.
	 */
	stop(): void;

	/**
	 * Call this method to read the page slug from the current URL.
	 *
	 * @returns - Application-relative page slug, or an empty string for the app root.
	 */
	getPageSlug(): string;

	/**
	 * Call this method to build an application path for a page slug.
	 *
	 * @param slug - Optional application-relative page slug; omission denotes the app root.
	 * @returns - Path below the current deployment's application mount.
	 */
	pathForSlug(slug?: string): string;

	/**
	 * Call this method to push a page slug into browser history.
	 *
	 * @param slug - Application-relative page slug to add to browser history.
	 */
	pushPageSlug(slug: string): void;

	/**
	 * Call this method to replace the current page slug in browser history.
	 *
	 * @param slug - Application-relative page slug replacing the current history entry.
	 */
	replacePageSlug(slug: string): void;
}
