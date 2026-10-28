import {Service} from '@polylith/core';
/**
 * Browser-history service that owns deployment-aware page URL parsing and writes.
 *
 * @implements {UrlService}
 */
export class UrlService extends Service {
	/**
	 * Creates the URL service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('url', registry);
		this.implement(['ready', 'stop', 'getPageSlug', 'pathForSlug', 'pushPageSlug', 'replacePageSlug']);
	}
	/** Call this method when browser event wiring can be installed. */
	ready() {
		this.stop();
		this.popState = () => this.fire('changed', {pageSlug: this.getPageSlug()});
		window.addEventListener('popstate', this.popState);
	}
	/** Call this method to remove the exact browser-history listener. */
	stop() {
		if (this.popState) window.removeEventListener('popstate', this.popState);
		this.popState = null;
	}
	/**
	 * Called by URL operations to obtain the deployment-aware base path.
	 *
	 * @returns {string} - The application base path.
	 */
	basePath() {
		return new URL(document.baseURI).pathname.replace(/\/$/, '');
	}
	/**
	 * Call this method to read the first page slug relative to the deployment base.
	 *
	 * @returns {string} - The decoded page slug or empty text.
	 */
	getPageSlug() {
		const base = this.basePath();
		const path = location.pathname;
		const relative =
			path === base ? '' : path.startsWith(`${base}/`) ? path.slice(base.length + 1) : path.replace(/^\/+/, '');
		const segment = relative.split('/')[0];
		return segment ? decodeURIComponent(segment) : '';
	}
	/**
	 * Call this method to build an application-relative path.
	 *
	 * @param {string} slug - The page slug.
	 * @returns {string} - The encoded application path.
	 */
	pathForSlug(slug = '') {
		const clean = String(slug).replace(/^\/+|\/+$/g, '');
		return clean ? `${this.basePath()}/${encodeURIComponent(clean)}` : `${this.basePath()}/`;
	}
	/**
	 * Call this method to push a page slug into browser history.
	 *
	 * @param {string} slug - The page slug.
	 */
	pushPageSlug(slug) {
		this.write(slug, 'pushState');
	}
	/**
	 * Call this method to replace the current page slug in browser history.
	 *
	 * @param {string} slug - The page slug.
	 */
	replacePageSlug(slug) {
		this.write(slug, 'replaceState');
	}
	/**
	 * Called by public history operations to avoid redundant writes.
	 *
	 * @param {string} slug - The page slug.
	 * @param {'pushState' | 'replaceState'} method - The history method.
	 */
	write(slug, method) {
		const path = this.pathForSlug(slug);
		if (location.pathname !== path) history[method]({}, '', path);
	}
}
new UrlService();
