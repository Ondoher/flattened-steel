/** Public registry contract implemented by the AppPagesService application service. */
interface AppPagesService extends EventBus {
	/**
	 * Call this method to register or update a page record.
	 *
	 * @param page - The page value required by this operation.
	 * @returns - The add operation result.
	 */
	add(page: AppPageRecord): AppPageRecord;
	/**
	 * Call this method to read the current service value.
	 *
	 * @returns - The get operation result.
	 */
	get(): AppPageRecord[];
	/**
	 * Call this method to find a page by its stable identifier.
	 *
	 * @param id - The id value required by this operation.
	 * @returns - The getById operation result.
	 */
	getById(id: string): AppPageRecord | null;
	/**
	 * Call this method to find a page by its URL slug.
	 *
	 * @param slug - The slug value required by this operation.
	 * @returns - The getBySlug operation result.
	 */
	getBySlug(slug: string): AppPageRecord | null;
	/**
	 * Call this method to read the executor-selected default page.
	 *
	 * @returns - The getDefault operation result.
	 */
	getDefault(): AppPageRecord | null;
}
