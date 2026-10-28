import {Service} from '@polylith/core';
import {registry} from '../registry.js';

/** Ordered HTTP router contributions owned by the Flat32 server app.
 *
 * @implements {import('./routers.js').RoutersService}
 */
export class RoutersService extends Service {
	/** Creates the router collection in the supplied app registry.
	 *
	 * @param {unknown} [ownerRegistry] - Explicit registry for isolated composition.
	 */
	constructor(ownerRegistry = registry) {
		super('routers', ownerRegistry);
		this.implement(['start', 'add', 'get', 'setLast']);
	}

	/** Call this method to initialize an empty contribution collection.
	 *
	 * @returns {void} - Previous startup contributions released.
	 */
	start() {
		/** @type {string[]} */ this._names = [];
		/** @type {string|null} */ this._last = null;
	}

	/** Called by registration to reject invalid or duplicate service names.
	 *
	 * @param {string} name - Candidate router service identifier.
	 * @returns {void} - Identifier accepted.
	 * @throws {Error} - Invalid or duplicate registration requires configuration repair.
	 */
	_requireName(name) {
		if (typeof name !== 'string' || !name.trim()) throw new Error('Router service name is required.');
		if (this._names.includes(name) || this._last === name)
			throw new Error(`Duplicate router registration: ${name}`);
	}

	/** Call this method during readiness to append a feature HTTP router.
	 *
	 * @param {string} name - Registered router service identifier.
	 * @returns {void} - Contribution appended.
	 * @throws {Error} - Invalid or duplicate identifiers require configuration repair.
	 */
	add(name) {
		this._requireName(name);
		this._names.push(name);
	}

	/** Call this method to reserve the app's single final fallback router.
	 *
	 * @param {string} name - Registered final router service identifier.
	 * @returns {void} - Final contribution selected.
	 * @throws {Error} - A duplicate or second final router requires configuration repair.
	 */
	setLast(name) {
		this._requireName(name);
		if (this._last !== null) throw new Error('Only one final router may be registered.');
		this._last = name;
	}

	/** Call this method to read a defensive installation-order snapshot.
	 *
	 * @returns {string[]} - Ordinary routers followed by the optional final router.
	 */
	get() {
		return this._last === null ? [...this._names] : [...this._names, this._last];
	}
}

new RoutersService();
