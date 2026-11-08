import DistantSunSharedCacheTransport from '../DistantSunSharedCacheTransport.js';
import {DistantSunSharedCacheOwnership} from '../DistantSunSharedCacheOwnership.js';

/**
 * Shared-module application lifetime checks; transport scheduling has its own suite.
 */
describe('Shared-cache application ownership', () => {
	for (const firstName of ['Flat', 'Flat32']) {
		it('keeps transport alive after original creator ' + firstName + ' stops and supports restart', () => {
			const preparer = {
				prepare: async () => {
					throw new Error('No decode expected');
				},
				dispose: jasmine.createSpy('dispose'),
			};
			const first = DistantSunSharedCacheOwnership.acquire(() => ({preparer}));
			const second = DistantSunSharedCacheOwnership.acquire(() => {
				throw new Error('Must reuse transport');
			});
			expect(first.transport).toBe(second.transport);
			first.release();
			first.release();
			expect(preparer.dispose).not.toHaveBeenCalled();
			const restarted = DistantSunSharedCacheOwnership.acquire(() => {
				throw new Error('Must reuse surviving app');
			});
			expect(restarted.transport).toBe(second.transport);
			second.release();
			expect(DistantSunSharedCacheTransport.current).toBe(restarted.transport);
			restarted.release();
			expect(preparer.dispose).toHaveBeenCalledTimes(1);
			expect(DistantSunSharedCacheTransport.current).toBeUndefined();
		});
	}
});
