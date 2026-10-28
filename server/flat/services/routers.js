import {Service} from '@polylith/core';
/**
 * Ordered registry of feature-owned server routers.
 *
 * @implements {RoutersService}
 */
export class RoutersService extends Service {
	/**
	 * Creates the router registry service.
	 *
	 * @param {unknown} registry - The owning Polylith registry.
	 */
	constructor(registry) {
		super('routers', registry);
		this.implement(['start', 'add', 'get', 'setLast']);
	}
	/** Call this method to initialize the ordered router collection. */
	start() {
		this.names = [];
		this.last = null;
	}
	/**
	 * Call this method to append a feature router.
	 *
	 * @param {string} name - The router service name.
	 */
	add(name) {
		if (this.names.includes(name) || this.last === name) throw new Error(`Duplicate router registration: ${name}`);
		this.names.push(name);
	}
	/**
	 * Call this method to reserve a final catch-all router.
	 *
	 * @param {string} name - The final router service name.
	 */
	setLast(name) {
		if (this.last !== null || this.names.includes(name))
			throw new Error('Only one final router may be registered.');
		this.last = name;
	}
	/**
	 * Call this method to read router names in installation order.
	 *
	 * @returns {string[]} - The ordered router names.
	 */
	get() {
		return this.last ? [...this.names, this.last] : [...this.names];
	}
}
new RoutersService();
