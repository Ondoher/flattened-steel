import {Service} from '@polylith/core';

/** Standard Flat32 client HTTP policy and JSON transport boundary. */
/** @implements {Flat32IoService} */
export class Flat32Io extends Service {
	/**
	 * Creates and registers the Flat32 HTTP owner.
	 *
	 */
	constructor() {
		super('io');
		this.implement(['requestJson']);
	}

	/**
	 * Called by request execution to require one supported method, route, and optional signal.
	 *
	 * @param {Flat32IoJsonRequest} request - Candidate JSON request.
	 * @returns {Flat32IoJsonRequest} - Accepted JSON request.
	 */
	_requireRequest(request) {
		if (request === null || typeof request !== 'object') throw new TypeError('Flat32 io request is required.');
		if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
			throw new RangeError('Flat32 io request method is unsupported.');
		}
		if ((typeof request.route !== 'string' || request.route.length === 0) && !(request.route instanceof URL)) {
			throw new TypeError('Flat32 io request route is required.');
		}
		if (request.signal !== undefined && !(request.signal instanceof globalThis.AbortSignal)) {
			throw new TypeError('Flat32 io request signal is incompatible.');
		}
		return request;
	}

	/**
	 * Called by request execution to select the current locale or the required fallback.
	 *
	 * @returns {string} - Current canonical locale or `en-US` when none is available.
	 */
	_locale() {
		const appContext = /** @type {{get?: () => {locale?: unknown}} | undefined} */ (
			this.registry.subscribe('app-context')
		);
		const locale = appContext?.get?.()?.locale;
		if (locale === null || locale === undefined || locale === '') return 'en-US';
		if (typeof locale !== 'string') throw new TypeError('Flat32 current locale must be a string.');
		return locale;
	}

	/**
	 * Call this method to execute one ordinary application request and return its parsed JSON value.
	 * HTTP failures and malformed JSON reject with stable transport diagnostics; callers retain
	 * feature-specific recovery and presentation policy. Invalid requests or locale state reject before transport,
	 * fetch failures propagate, and caller cancellation rejects through the supplied signal; callers must stop the
	 * feature continuation and apply its own last-good or cancellation policy.
	 *
	 * @param {Flat32IoJsonRequest} request - Method, route, optional feature data, and cancellation signal.
	 * @returns {Promise<unknown>} - Parsed JSON response value.
	 */
	async requestJson(request) {
		const accepted = this._requireRequest(request);
		/** @type {Record<string, string>} */
		const headers = {
			accept: 'application/json',
			'accept-language': this._locale(),
		};
		/** @type {RequestInit} */
		const options = {method: accepted.method, headers, signal: accepted.signal};
		if (accepted.data !== undefined) {
			headers['content-type'] = 'application/json';
			options.body = JSON.stringify(accepted.data);
		}
		const response = await fetch(accepted.route, options);
		if (!response.ok) throw new Error(`Flat32 io request failed with HTTP ${response.status}.`);
		try {
			return await response.json();
		} catch (error) {
			throw new Error('Flat32 io response contained malformed JSON.', {cause: error});
		}
	}
}

new Flat32Io();
