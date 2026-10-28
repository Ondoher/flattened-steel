import {Service} from '@polylith/core';
/**
 * Page-metadata registry and ordering owner for the application shell.
 *
 * @implements {AppPagesService}
 */
export class AppPagesService extends Service {
	/**
	 * Creates the page registry service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('app-pages', registry);
		this.implement(['start', 'add', 'get', 'getById', 'getBySlug', 'getDefault']);
	}
	/** Call this method to initialize an empty page collection. */
	start() {
		this.pages = [];
	}
	/**
	 * Call this method to register or update one validated page record.
	 *
	 * @param {AppPageRecord} page - The page metadata to install.
	 * @returns {AppPageRecord} - A defensive copy of the installed record.
	 * @throws {Error} - When identifiers, URL slugs, or default-page ownership conflict.
	 */
	add(page) {
		if (!page?.id) throw new Error('Page id is required');
		const next = {order: 0, urlSlug: page.id, ...page};
		const slugConflict = this.pages.find((item) => item.id !== next.id && item.urlSlug === next.urlSlug);
		if (slugConflict) throw new Error(`Duplicate page URL slug: ${next.urlSlug}`);
		if (next.default && this.pages.some((item) => item.id !== next.id && item.default))
			throw new Error('Multiple default pages');
		const index = this.pages.findIndex((item) => item.id === next.id);
		if (index < 0) {
			this.pages.push(next);
			this.fire('page-added', {...next});
		} else {
			this.pages[index] = {...this.pages[index], ...next};
			this.fire('page-updated', {...this.pages[index]});
		}
		this.fire('updated', this.get());
		return this.getById(next.id);
	}
	/**
	 * Call this method to read ordered defensive page records.
	 *
	 * @returns {AppPageRecord[]} - The registered pages.
	 */
	get() {
		return this.pages
			.map((item) => ({...item}))
			.sort((a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id)));
	}
	/**
	 * Call this method to find a page by its identifier.
	 *
	 * @param {string} id - The stable page identifier.
	 * @returns {AppPageRecord | null} - The matching page or no record.
	 */
	getById(id) {
		const page = this.pages.find((item) => item.id === id);
		return page ? {...page} : null;
	}
	/**
	 * Call this method to find a page by its URL slug.
	 *
	 * @param {string} slug - The page URL slug.
	 * @returns {AppPageRecord | null} - The matching page or no record.
	 */
	getBySlug(slug) {
		const page = this.pages.find((item) => item.urlSlug === slug);
		return page ? {...page} : null;
	}
	/**
	 * Call this method to read the executor-selected default page.
	 *
	 * @returns {AppPageRecord | null} - The default page or no record.
	 */
	getDefault() {
		const page = this.pages.find((item) => item.default);
		return page ? {...page} : null;
	}
}
new AppPagesService();
