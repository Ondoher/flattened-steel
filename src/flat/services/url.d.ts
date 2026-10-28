/** Public registry contract implemented by the UrlService application service. */
interface UrlService extends EventBus {
	/**
	 * Call this method to invoke the stop service operation.
	 */
	stop(): void;
	/**
	 * Call this method to read the page slug from the current URL.
	 *
	 * @returns - The getPageSlug operation result.
	 */
	getPageSlug(): string;
	/**
	 * Call this method to build an application path for a page slug.
	 *
	 * @param slug - The slug value required by this operation.
	 * @returns - The pathForSlug operation result.
	 */
	pathForSlug(slug?: string): string;
	/**
	 * Call this method to push a page slug into browser history.
	 *
	 * @param slug - The slug value required by this operation.
	 */
	pushPageSlug(slug: string): void;
	/**
	 * Call this method to replace the current page slug in browser history.
	 *
	 * @param slug - The slug value required by this operation.
	 */
	replacePageSlug(slug: string): void;
}
