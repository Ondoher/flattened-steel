/**
 * Public registry contract implemented by the AppPagesService application service.
 */
interface AppPagesService extends EventBus {
	/**
	 * Call this method to register or update a page record.
	 *
	 * @param page - Page metadata identifying its controller, route, label, and ordering.
	 * @returns - Registered page metadata.
	 */
	add(page: AppPageRecord): AppPageRecord;

	/**
	 * Call this method to read defensive copies of registered pages in navigation order.
	 *
	 * @returns - Registered page metadata ordered by configured order and page identity.
	 */
	get(): AppPageRecord[];

	/**
	 * Call this method to find a page by its stable identifier.
	 *
	 * @param id - Stable registered page identity.
	 * @returns - Matching page metadata, or null when the page is unavailable.
	 */
	getById(id: string): AppPageRecord | null;

	/**
	 * Call this method to find a page by its URL slug.
	 *
	 * @param slug - Application-relative URL slug to match.
	 * @returns - Matching page metadata, or null when the slug is unknown.
	 */
	getBySlug(slug: string): AppPageRecord | null;

	/**
	 * Call this method to read the executor-selected default page.
	 *
	 * @returns - Explicitly configured default page, or null when none is registered.
	 */
	getDefault(): AppPageRecord | null;
}
