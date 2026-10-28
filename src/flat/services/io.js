import {Service} from '@polylith/core';
/**
 * HTTP service that centrally adds deployment and locale requirements.
 *
 * @implements {IoService}
 */
export class IoService extends Service {
	/**
	 * Creates the HTTP service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('io', registry);
		this.implement(['request']);
	}
	/**
	 * Called by request handling to resolve an app-relative route below the document base.
	 *
	 * @param {string} url - The caller-supplied URL or app-relative route.
	 * @returns {string} - The resolved request URL.
	 */
	resolveUrl(url) {
		const value = String(url);
		if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) return value;
		return new URL(value.replace(/^\/+/, ''), document.baseURI).toString();
	}
	/**
	 * Call this method to issue an HTTP request with centrally owned headers.
	 *
	 * @param {string} url - The request URL or app-relative route.
	 * @param {RequestInit} options - Fetch options and caller-owned headers.
	 * @returns {Promise<Response | null>} - The response, or null after a transport failure.
	 */
	async request(url, options = {}) {
		const locale = this.registry.subscribe('app-context')?.get?.().locale || 'en-US';
		try {
			return await fetch(this.resolveUrl(url), {
				...options,
				headers: {
					Accept: 'application/json',
					'Accept-Language': locale,
					...(options.body ? {'Content-Type': 'application/json'} : {}),
					...options.headers,
				},
			});
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}
new IoService();
