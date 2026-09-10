import DistantSunSceneCacheController from './reference/DistantSunSceneCacheController.js';
import {DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES} from '../consts.js';

const RESIDENT_BYTES = 150_235_908;

/** @param {string} identity - Cache identity. @returns {DistantSunSceneCacheAssetSelection} - Exact selection. */
function asset(identity) {
	return /** @type {DistantSunSceneCacheAssetSelection} */ ({
		assetRoot: `https://assets.invalid/${identity}/`,
		loadRequest: {
			manifestPath: 'manifest.json',
			manifestSha256: identity.padEnd(64, '0').slice(0, 64),
			cacheIdentity: identity,
			expected: {},
		},
	});
}

/** @param {string} identity - Cache identity. @param {number} [bytes] - Logical payload. */
function cache(identity, bytes = RESIDENT_BYTES) {
	return {
		cacheIdentity: identity,
		resources: {
			residentTextureBytes: {value: bytes, units: /** @type {const} */ ('bytes')},
			hostStagingBytes: {value: bytes, units: /** @type {const} */ ('bytes')},
		},
		disposeCount: 0,
		dispose() {
			this.disposeCount += 1;
		},
	};
}

/** @returns {{promise: Promise<import('../DistantSunSceneCache.js').default>, resolve(value: import('../DistantSunSceneCache.js').default): void, reject(error: Error): void}} */
function deferred() {
	let resolve = /** @type {(value: import('../DistantSunSceneCache.js').default) => void} */ (() => {});
	let reject = /** @type {(error: Error) => void} */ (() => {});
	const promise = new Promise((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return {promise, resolve, reject};
}

/** @param {Map<string, unknown>} outcomes - Load outcome by identity. */
function fixture(outcomes) {
	const loadRequests = [];
	const controller = new DistantSunSceneCacheController({
		backend: /** @type {CacheGpuBackend} */ ({}),
		asset: asset('first'),
		loaderFactory(selection) {
			return {
				load(request) {
					loadRequests.push(request);
					const outcome = outcomes.get(selection.loadRequest.cacheIdentity);
					if (outcome instanceof Error) return Promise.reject(outcome);
					if (outcome && typeof outcome === 'object' && 'promise' in outcome) {
						request.signal?.addEventListener(
							'abort',
							() => {
								const error = new Error('Fake scene-cache load aborted.');
								error.name = 'AbortError';
								outcome.reject(error);
							},
							{once: true},
						);
						return outcome.promise;
					}
					return Promise.resolve(/** @type {import('../DistantSunSceneCache.js').default} */ (outcome));
				},
			};
		},
	});
	return {controller, loadRequests};
}

describe('DistantSunSceneCacheController', () => {
	it('reuses an exact active cache and reports qualified logical bytes', async () => {
		const first = cache('first');
		const {controller, loadRequests} = fixture(new Map([['first', first]]));
		const published = await controller.createScatteringCache();
		const reused = await controller.createScatteringCache();

		expect(reused).toBe(published);
		expect(loadRequests.length).toBe(1);
		expect(controller.resources).toEqual({
			maximumResidentTextureBytes: {value: 185_326_380, units: 'bytes'},
			maximumAtomicTransitionTextureBytes: {value: 370_652_760, units: 'bytes'},
			maximumTransitionWithStagingBytes: {value: 717_171_648, units: 'bytes'},
			activeResidentTextureBytes: {value: RESIDENT_BYTES, units: 'bytes'},
			lastTransitionTextureBytes: {value: RESIDENT_BYTES, units: 'bytes'},
			lastTransitionWithStagingBytes: {value: 2 * RESIDENT_BYTES, units: 'bytes'},
		});
		controller.dispose();
	});

	it('preserves the active cache on failure and swaps only after complete replacement', async () => {
		const first = cache('first');
		const second = cache('second');
		const pending = deferred();
		const outcomes = new Map([
			['first', first],
			['failed', new Error('Injected replacement failure.')],
			['second', pending],
		]);
		const {controller} = fixture(outcomes);
		await controller.createScatteringCache();
		await expectAsync(controller.replaceSceneCache(asset('failed'))).toBeRejectedWithError(/Injected/u);
		expect(controller.active).toBe(first);
		expect(first.disposeCount).toBe(0);

		const replacement = controller.replaceSceneCache(asset('second'));
		await Promise.resolve();
		expect(controller.active).toBe(first);
		pending.resolve(/** @type {import('../DistantSunSceneCache.js').default} */ (second));
		expect(await replacement).toBe(second);
		expect(controller.active).toBe(second);
		expect(first.disposeCount).toBe(1);
		expect(controller.resources.lastTransitionTextureBytes.value).toBe(2 * RESIDENT_BYTES);
		expect(controller.resources.lastTransitionWithStagingBytes.value).toBe(3 * RESIDENT_BYTES);
		controller.dispose();
	});

	it('supersedes incomplete work without poisoning a later generation', async () => {
		const obsolete = deferred();
		const latest = cache('latest');
		const {controller} = fixture(
			new Map([
				['first', obsolete],
				['latest', latest],
			]),
		);
		const firstLoad = controller.createScatteringCache();
		await Promise.resolve();
		const latestLoad = controller.replaceSceneCache(asset('latest'));

		await expectAsync(firstLoad).toBeRejectedWithError(/aborted|superseded/u);
		expect(await latestLoad).toBe(latest);
		expect(controller.active).toBe(latest);
		controller.dispose();
	});

	it('keeps caller cancellation generation-local and restores by complete re-upload', async () => {
		const cancelled = deferred();
		const first = cache('first');
		const restored = cache('first');
		const outcomes = new Map([['first', cancelled]]);
		const {controller} = fixture(outcomes);
		const cancellation = new AbortController();
		const cancelledLoad = controller.createScatteringCache({signal: cancellation.signal});
		await Promise.resolve();
		cancellation.abort();
		await expectAsync(cancelledLoad).toBeRejectedWithError(/aborted/u);

		outcomes.set('first', first);
		expect(await controller.createScatteringCache()).toBe(first);
		controller.handleContextLoss();
		expect(controller.active).toBeNull();
		expect(first.disposeCount).toBe(1);
		outcomes.set('first', restored);
		expect(await controller.restoreSceneCache()).toBe(restored);
		controller.dispose();
		controller.dispose();
		expect(restored.disposeCount).toBe(1);
	});

	it('rejects an oversized complete candidate and preserves the prior cache', async () => {
		const first = cache('first');
		const oversized = cache('oversized', DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES + 1);
		const {controller} = fixture(
			new Map([
				['first', first],
				['oversized', oversized],
			]),
		);
		await controller.createScatteringCache();
		await expectAsync(controller.replaceSceneCache(asset('oversized'))).toBeRejectedWithError(/resident-byte/u);
		expect(controller.active).toBe(first);
		expect(oversized.disposeCount).toBe(1);
		controller.dispose();
	});
});
