import DistantSunSharedCacheTransport from './DistantSunSharedCacheTransport.js';

/** @type {Map<DistantSunSharedCacheTransport, {borrowers: number, owned: boolean}>} */
const owners = new Map();

/**
 * Explicit application lifetimes sharing the engine's process-wide transport.
 */
export const DistantSunSharedCacheOwnership = {
	/**
	 * Call this method to acquire an independent application borrow, creating transport only once.
	 *
	 * @param {() => DistantSunSharedCacheTransportDefinition} createDefinition - Lazy dependencies for a new transport.
	 * @returns {DistantSunSharedCacheTransportBorrow} - Borrow released after that application's consumers retire.
	 */
	acquire(createDefinition) {
		let transport = DistantSunSharedCacheTransport.current;
		let owned = !transport;
		transport ??= new DistantSunSharedCacheTransport(createDefinition());
		let entry = owners.get(transport);
		if (!entry) {
			entry = {borrowers: 0, owned};
			owners.set(transport, entry);
		}
		entry.borrowers++;
		let released = false;
		return {
			transport,
			/**
			 * Call this method after this application's packet consumers retire.
			 * Repeated release leaves other application borrowers unchanged.
			 */
			release() {
				if (released) {
					return;
				}
				released = true;
				entry.borrowers--;
				if (entry.borrowers === 0) {
					owners.delete(transport);
					if (entry.owned) {
						transport.dispose();
					}
				}
			},
		};
	},
};
