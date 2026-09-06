// @ts-expect-error The loopback proof host owns this allowlisted browser URL.
import * as THREE from '/modules/vendor/three.module.js';
// @ts-expect-error The loopback proof host owns this allowlisted browser URL.
import DistantSunSceneCacheController from '/modules/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheController.js';
// @ts-expect-error The loopback proof host owns this allowlisted browser URL.
import {ThreeCacheBackend} from '/modules/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
// @ts-expect-error The loopback proof host owns this allowlisted browser URL.
import {resolveDistantSunSceneCache} from '/modules/flat32/DistantSunSceneCacheResolver.js';
// @ts-expect-error The loopback proof host owns this allowlisted browser URL.
import CacheOptimizationContracts from '/modules/experiment/lib/CacheOptimizationContracts.js';

const {acceptBrowserControl, acceptNetworkSnapshot} = CacheOptimizationContracts;

/**
 * Current Chrome heap usage when exposed by the measurement environment.
 *
 * @returns {number | null} - Used JavaScript heap bytes or null when unavailable.
 */
function heapBytes() {
	return Number.isFinite(performance.memory?.usedJSHeapSize) ? performance.memory.usedJSHeapSize : null;
}

/**
 * Read the current proof-host response counters.
 *
 * @returns {Promise<CacheOptimizationNetworkSnapshot>} - Cumulative static-response counters.
 */
async function networkSnapshot() {
	const response = await fetch('/request-metrics', {cache: 'no-store'});
	if (!response.ok) throw new Error(`Request metrics failed with HTTP ${response.status}.`);
	return acceptNetworkSnapshot(await response.json(), 'Network snapshot');
}

/**
 * Wait until the proof host observes the selected asset's manifest request.
 *
 * @param {CacheOptimizationBrowserAsset} selectedAsset - Delayed browser asset.
 * @param {number} previousCount - Path count before starting the operation.
 * @returns {Promise<void>} - Completion after request ingress is observable.
 */
async function waitForManifestRequest(selectedAsset, previousCount) {
	const requestPath = `${selectedAsset.assetRoot}${selectedAsset.loadRequest.manifestPath}`;
	const deadline = performance.now() + 30_000;
	while (performance.now() < deadline) {
		if ((await networkSnapshot()).paths[requestPath]?.count > previousCount) return;
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
	throw new Error(`C0 timed out waiting for request ingress: ${requestPath}`);
}

/**
 * Derive response work performed between two cumulative snapshots.
 *
 * @param {CacheOptimizationNetworkSnapshot} before - Counters before the scenario.
 * @param {CacheOptimizationNetworkSnapshot} after - Counters after the scenario.
 * @returns {CacheOptimizationNetworkDifference} - Scenario-local response counters.
 */
function networkDifference(before, after) {
	let uniqueRequestCount = 0;
	for (const [urlPath, current] of Object.entries(after.paths)) {
		if (current.count > (before.paths[urlPath]?.count ?? 0)) uniqueRequestCount += 1;
	}
	return {
		requestCount: after.requestCount - before.requestCount,
		responseByteLength: after.responseByteLength - before.responseByteLength,
		uniqueRequestCount,
	};
}

/**
 * Measure one asynchronous lifecycle operation and its proof-host response work.
 *
 * @param {CacheOptimizationBrowserStageId} id - Stable scenario identifier.
 * @param {CacheOptimizationBrowserOperation} operation - Scenario operation.
 * @returns {Promise<CacheOptimizationBrowserMeasurement>} - Scenario measurement.
 */
async function measure(id, operation) {
	const networkBefore = await networkSnapshot();
	const browserHeapBeforeBytes = heapBytes();
	let peakBrowserHeapBytes = browserHeapBeforeBytes;
	const sampler = setInterval(() => {
		const sample = heapBytes();
		if (sample !== null) peakBrowserHeapBytes = Math.max(peakBrowserHeapBytes ?? 0, sample);
	}, 10);
	const started = performance.now();
	let value;
	try {
		value = await operation();
	} finally {
		clearInterval(sampler);
	}
	const browserElapsedMilliseconds = performance.now() - started;
	const browserHeapAfterBytes = heapBytes();
	if (browserHeapAfterBytes !== null) {
		peakBrowserHeapBytes = Math.max(peakBrowserHeapBytes ?? 0, browserHeapAfterBytes);
	}
	const networkAfter = await networkSnapshot();
	return /** @type {CacheOptimizationBrowserMeasurement} */ ({
		id,
		browserElapsedMilliseconds,
		browserHeapBeforeBytes,
		browserHeapAfterBytes,
		peakBrowserHeapBytes,
		network: networkDifference(networkBefore, networkAfter),
		value,
	});
}

/**
 * Wait for one WebGL context event with a bounded timeout.
 *
 * @param {HTMLCanvasElement} canvas - Event source.
 * @param {CacheOptimizationContextEventName} name - Context event name.
 * @returns {Promise<void>} - Completion after the event occurs.
 */
function waitForContextEvent(canvas, name) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			canvas.removeEventListener(name, listener);
			reject(new Error(`C0 timed out waiting for ${name}.`));
		}, 30_000);
		const listener = (event) => {
			if (name === 'webglcontextlost') event.preventDefault();
			clearTimeout(timer);
			resolve();
		};
		canvas.addEventListener(name, listener, {once: true});
	});
}

/**
 * Describe one rejected value without imposing a production error shape.
 *
 * @param {Promise<unknown>} operation - Operation expected to reject.
 * @returns {Promise<CacheOptimizationRejectionIdentity>} - Observed rejection identity.
 */
async function observeRejection(operation) {
	try {
		await operation;
	} catch (error) {
		return {
			type: typeof error,
			name: error?.name ?? null,
			message: error?.message ?? String(error),
		};
	}
	throw new Error('Expected the operation to reject, but it completed.');
}

/**
 * Require one promise to reject with an abort-classified error.
 *
 * @param {Promise<unknown>} operation - Operation expected to abort.
 * @returns {Promise<CacheOptimizationAbortRejectionIdentity>} - Observed AbortError identity.
 */
async function requireAbort(operation) {
	const rejection = await observeRejection(operation);
	if (rejection.name !== 'AbortError') {
		throw new Error(`Expected an AbortError, received ${rejection.type}: ${rejection.message}.`);
	}
	return /** @type {CacheOptimizationAbortRejectionIdentity} */ (rejection);
}

/**
 * Resolve one configured browser asset.
 *
 * @param {CacheOptimizationBrowserControl} control - C0 browser control.
 * @param {CacheOptimizationBrowserAssetRole} name - Asset role.
 * @returns {CacheOptimizationBrowserAsset} - Selected asset.
 */
function asset(control, name) {
	const selected = control.assets[name];
	if (!selected) throw new Error(`C0 browser control lacks asset ${name}.`);
	return selected;
}

/**
 * Execute the current production cache lifecycle as the C0 browser control.
 * Rejects control fetch/validation, WebGL, lifecycle, cancellation, measurement, or cleanup failures; callers must retain the last-good production state and reject C0.
 *
 * @returns {Promise<CacheOptimizationBrowserBaselineResult>} - Exact lifecycle and resource observations.
 */
export async function runC0BaselineBrowser() {
	const controlResponse = await fetch('/control.json', {cache: 'no-store'});
	if (!controlResponse.ok) throw new Error(`Browser control failed with HTTP ${controlResponse.status}.`);
	const control = acceptBrowserControl(await controlResponse.json());
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
	});
	if (!context) throw new Error('C0 production baseline requires WebGL2.');
	let renderer;
	let backend;
	let controller;
	const stages = [];
	/** @type {CacheOptimizationBrowserBaselineResult | undefined} */
	let outcome;
	let executionError;

	try {
		renderer = new THREE.WebGLRenderer({canvas, context});
		backend = new ThreeCacheBackend({THREE, renderer});
		controller = new DistantSunSceneCacheController({
			backend,
			asset: asset(control, 'cold90'),
		});
		let coldCache;
		const cold = await measure('cold-90', async () => {
			coldCache = await controller.createScatteringCache();
			return {cacheIdentity: coldCache.cacheIdentity, resources: controller.resources};
		});
		stages.push(cold);

		const reuse = await measure('exact-reuse-90', async () => {
			const reused = await controller.createScatteringCache();
			if (reused !== coldCache) throw new Error('C0 exact reuse returned a different cache.');
			return {cacheIdentity: reused.cacheIdentity, reusedSameObject: true};
		});
		stages.push(reuse);

		for (const [id, name] of [
			['adjacent-91', 'adjacent91'],
			['nonadjacent-30', 'nonadjacent30'],
			['warm-90', 'warm90'],
		]) {
			const stage = await measure(/** @type {CacheOptimizationBrowserStageId} */ (id), async () => {
				const loaded = await controller.replaceSceneCache(
					asset(control, /** @type {CacheOptimizationBrowserAssetRole} */ (name)),
				);
				return {cacheIdentity: loaded.cacheIdentity, resources: controller.resources};
			});
			stages.push(stage);
		}

		const activeBeforeFailure = controller.active;
		const failedReplacement = await measure('failed-replacement', async () => {
			try {
				await controller.replaceSceneCache(control.failedAsset);
			} catch (error) {
				if (controller.active !== activeBeforeFailure) {
					throw new Error('C0 failed replacement did not preserve the active cache.');
				}
				return {name: error.name, message: error.message, preservedActive: true};
			}
			throw new Error('C0 failed replacement unexpectedly completed.');
		});
		stages.push(failedReplacement);

		const supersession = await measure('superseded-91-by-92', async () => {
			const delayedAsset = asset(control, 'delayed91');
			const delayedPath = `${delayedAsset.assetRoot}${delayedAsset.loadRequest.manifestPath}`;
			const previousCount = (await networkSnapshot()).paths[delayedPath]?.count ?? 0;
			const superseded = controller.replaceSceneCache(delayedAsset);
			await waitForManifestRequest(delayedAsset, previousCount);
			const replacement = controller.replaceSceneCache(asset(control, 'replacement92'));
			const supersededError = await requireAbort(superseded);
			const published = await replacement;
			if (controller.active !== published) throw new Error('C0 supersession did not publish the latest cache.');
			return {supersededError, publishedCacheIdentity: published.cacheIdentity, resources: controller.resources};
		});
		stages.push(supersession);

		const activeBeforeCancellation = controller.active;
		const cancellation = await measure('caller-cancelled-93', async () => {
			const abortController = new AbortController();
			const delayedAsset = asset(control, 'delayed93');
			const delayedPath = `${delayedAsset.assetRoot}${delayedAsset.loadRequest.manifestPath}`;
			const previousCount = (await networkSnapshot()).paths[delayedPath]?.count ?? 0;
			const pending = controller.replaceSceneCache(delayedAsset, {
				signal: abortController.signal,
			});
			await waitForManifestRequest(delayedAsset, previousCount);
			abortController.abort();
			const cancellationError = await requireAbort(pending);
			if (controller.active !== activeBeforeCancellation) {
				throw new Error('C0 caller cancellation did not preserve the active cache.');
			}
			return {cancellationError, preservedActive: true};
		});
		if (
			cancellation.network.requestCount !== 1 ||
			cancellation.network.uniqueRequestCount !== 1 ||
			cancellation.network.responseByteLength !== 0
		) {
			throw new Error('C0 cancellation transport accounting changed.');
		}
		stages.push(cancellation);

		const extension = context.getExtension('WEBGL_lose_context');
		if (!extension) throw new Error('C0 context restoration requires WEBGL_lose_context.');
		const restoration = await measure('context-restoration-92', async () => {
			const lost = waitForContextEvent(canvas, 'webglcontextlost');
			extension.loseContext();
			await lost;
			controller.handleContextLoss();
			if (controller.active !== null) throw new Error('C0 context loss retained invalid cache resources.');
			// Continue on the next rendered frame so the loss event has fully unwound
			// before requesting restoration; no elapsed-time assumption is involved.
			await new Promise((resolve) => requestAnimationFrame(() => resolve()));
			const restoredEvent = waitForContextEvent(canvas, 'webglcontextrestored');
			extension.restoreContext();
			await restoredEvent;
			const restored = await controller.restoreSceneCache();
			if (controller.active !== restored) throw new Error('C0 context restoration did not publish its cache.');
			return {cacheIdentity: restored.cacheIdentity, resources: controller.resources};
		});
		if (
			restoration.network.requestCount !== 1 ||
			restoration.network.uniqueRequestCount !== 1 ||
			restoration.network.responseByteLength !== 161_183_760
		) {
			throw new Error('C0 restoration transport accounting changed.');
		}
		stages.push(restoration);

		const darkBoundary = [107.999, 108, 180].map((solarZenithDegrees) => {
			const resolution = resolveDistantSunSceneCache(control.catalog, solarZenithDegrees, '/package-root/');
			return {
				solarZenithDegrees,
				status: resolution.status,
				representativeSolarZenithDegrees: resolution.representativeSolarZenithDegrees ?? null,
			};
		});
		if (
			darkBoundary[0].status !== 'ready' ||
			darkBoundary[1].status !== 'dark' ||
			darkBoundary[2].status !== 'dark'
		) {
			throw new Error('C0 dark-boundary resolver behavior changed.');
		}

		const debugRenderer = context.getExtension('WEBGL_debug_renderer_info');
		const webglError = context.getError();
		if (webglError !== context.NO_ERROR) throw new Error(`C0 browser control produced WebGL error ${webglError}.`);
		outcome = {
			schemaId: 'distant-sun-cache-optimization-c0-browser-baseline-v1',
			accepted: true,
			gpu: {
				api: context.getParameter(context.VERSION),
				renderer: debugRenderer
					? context.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL)
					: context.getParameter(context.RENDERER),
			},
			stages,
			darkBoundary,
			finalResources: controller.resources,
			webglError,
		};
	} catch (error) {
		executionError = error;
	} finally {
		const cleanupErrors = [];
		for (const cleanup of [
			() => controller?.dispose(),
			() => backend?.dispose(),
			() => renderer?.dispose(),
			() => renderer?.forceContextLoss(),
			() => canvas.remove(),
		]) {
			try {
				cleanup();
			} catch (error) {
				cleanupErrors.push(error);
			}
		}
		if (executionError && cleanupErrors.length) {
			throw new AggregateError([executionError, ...cleanupErrors], 'Browser control and resource cleanup failed.');
		}
		if (executionError) throw executionError;
		if (cleanupErrors.length) throw new AggregateError(cleanupErrors, 'Browser control resource cleanup failed.');
	}
	if (!outcome) throw new Error('C0 browser control ended without a result.');
	return outcome;
}
