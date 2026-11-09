import {Registry, Service} from '@polylith/core';
import {CameraSync} from '../camera-sync.js';

/**
 * Instance-specific registered receiver recording public synchronization callbacks.
 */
class CameraReceiver extends Service {
	/**
	 * Creates an isolated receiver without renderer or UI dependencies.
	 *
	 * @param {string} name - Unique participant service name.
	 * @param {unknown} registry - Owning test registry.
	 */
	constructor(name, registry) {
		super(name, registry);
		this.notifications = [];
		this.changes = [];
		this.onSynced = null;
		this.onCameraChanged = null;
		this.implement(['synced', 'cameraChanged']);
	}

	/**
	 * Call this method to record an action or effective synchronization mode.
	 *
	 * @param {CameraSyncMode} mode - Service notification.
	 */
	synced(mode) {
		this.notifications.push(mode);
		this.onSynced?.(mode);
	}

	/**
	 * Call this method to record applied controls without echoing an update.
	 *
	 * @param {CameraSyncControls} controls - Delivered independent snapshot.
	 * @returns {Promise<void>} - Completed application.
	 */
	async cameraChanged(controls) {
		this.changes.push(controls);
		return this.onCameraChanged?.(controls);
	}
}

describe('Camera synchronization service', () => {
	let registry, implementation, sync, first, second, firstHandle, secondHandle, firstControls, secondControls;

	beforeEach(() => {
		registry = new Registry();
		implementation = new CameraSync(registry);
		implementation.start();
		sync = registry.subscribe('camera-sync');
		first = new CameraReceiver('camera-view-1', registry);
		second = new CameraReceiver('camera-view-2', registry);
		firstHandle = sync.register('camera-view-1');
		secondHandle = sync.register('camera-view-2');
		firstControls = {orientation: [0, 0, 0, 1], observerHeightMeters: 5};
		secondControls = {orientation: [0, 1, 0, 0], observerHeightMeters: 50};
		sync.update(firstHandle, firstControls);
		sync.update(secondHandle, secondControls);
	});

	afterEach(() => {
		implementation.stop();
	});

	it('copies peer settings once for now and remembers subsequent source changes without a subscription', () => {
		sync.sync(firstHandle, 'now');
		expect(first.changes).toEqual([secondControls]);
		expect(first.notifications).toEqual(['now']);
		expect(second.changes).toEqual([]);
		let next = {...secondControls, observerHeightMeters: 100};
		sync.update(secondHandle, next);
		expect(first.changes.length).toBe(1);
		sync.sync(firstHandle, 'now');
		expect(first.changes[1]).toEqual(next);
	});

	it('copies immediately and follows only the other participant for them', () => {
		sync.sync(firstHandle, 'them');
		expect(first.changes).toEqual([secondControls]);
		expect(first.notifications).toEqual(['them']);
		let next = {...firstControls, observerHeightMeters: 10};
		sync.update(firstHandle, next);
		expect(second.changes).toEqual([]);
		sync.update(secondHandle, next);
		expect(first.changes).toEqual([secondControls, next]);
	});

	it('copies only to the caller initially for both, notifies both and forwards later changes either way', () => {
		sync.sync(firstHandle, 'both');
		expect(first.changes).toEqual([secondControls]);
		expect(second.changes).toEqual([]);
		expect(first.notifications).toEqual(['both']);
		expect(second.notifications).toEqual(['both']);
		let next = {...firstControls, observerHeightMeters: 20};
		sync.update(firstHandle, next);
		expect(second.changes).toEqual([next]);
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([secondControls, firstControls]);
	});

	it('combines reciprocal them requests into both and notifies each participant', () => {
		sync.sync(firstHandle, 'them');
		sync.sync(secondHandle, 'them');
		expect(first.notifications).toEqual(['them', 'both']);
		expect(second.notifications).toEqual(['both']);
		expect(second.changes).toEqual([secondControls]);
		sync.update(firstHandle, firstControls);
		expect(second.changes[1]).toEqual(firstControls);
		sync.update(secondHandle, secondControls);
		expect(first.changes[1]).toEqual(secondControls);
	});

	it('preserves a one-way subscription after a direct now action', () => {
		sync.sync(firstHandle, 'them');
		sync.sync(firstHandle, 'now');
		expect(first.notifications).toEqual(['them', 'now']);
		sync.update(firstHandle, firstControls);
		expect(second.changes).toEqual([]);
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([secondControls, secondControls, firstControls]);
	});

	it('preserves both through direct now, them and repeated both requests independently of UI availability', () => {
		sync.sync(firstHandle, 'both');
		sync.sync(firstHandle, 'now');
		sync.sync(firstHandle, 'them');
		sync.sync(secondHandle, 'both');
		expect(first.notifications).toEqual(['both', 'now', 'both', 'both']);
		expect(second.notifications).toEqual(['both', 'both', 'both']);
		sync.update(firstHandle, firstControls);
		expect(second.changes.at(-1)).toEqual(firstControls);
		sync.update(secondHandle, secondControls);
		expect(first.changes.at(-1)).toEqual(secondControls);
	});

	it('lets either participant cancel all synchronization, including repeated off requests', () => {
		sync.sync(firstHandle, 'both');
		sync.sync(secondHandle, 'off');
		sync.sync(firstHandle, 'off');
		sync.update(firstHandle, firstControls);
		sync.update(secondHandle, secondControls);
		expect(first.changes).toEqual([secondControls]);
		expect(second.changes).toEqual([]);
		expect(first.notifications.at(-1)).toBe('off');
		expect(second.notifications.at(-1)).toBe('off');
	});

	it('owns copied input and delivery snapshots and remembers delivered settings without an echo', () => {
		secondControls.orientation[0] = 0.5;
		secondControls.observerHeightMeters = 1000;
		sync.sync(firstHandle, 'now');
		expect(first.changes[0]).toEqual({orientation: [0, 1, 0, 0], observerHeightMeters: 50});
		first.changes[0].orientation[1] = 0.25;
		first.changes[0].observerHeightMeters = 2000;
		sync.sync(secondHandle, 'now');
		expect(second.changes[0]).toEqual({orientation: [0, 1, 0, 0], observerHeightMeters: 50});
	});

	it('does nothing without a peer or its initial state and does not queue later subscription activation', () => {
		sync.unregister(secondHandle);
		for (let mode of ['now', 'them', 'both']) {
			sync.sync(firstHandle, mode);
		}
		second = new CameraReceiver('camera-view-2', registry);
		secondHandle = sync.register('camera-view-2');
		for (let mode of ['now', 'them', 'both']) {
			sync.sync(firstHandle, mode);
		}
		expect(first.changes).toEqual([]);
		expect(first.notifications).toEqual([]);
		expect(second.notifications).toEqual([]);
		sync.update(secondHandle, secondControls);
		expect(first.changes).toEqual([]);
		sync.update(firstHandle, firstControls);
		expect(second.changes).toEqual([]);
		sync.sync(secondHandle, 'now');
		expect(second.changes).toEqual([firstControls]);
	});

	it('invokes newer changes while prior calls are unresolved and ignores reverse completion order', async () => {
		let complete = [];
		let pending = [];
		first.onCameraChanged = () => {
			let result = new Promise((resolve) => complete.push(resolve));
			pending.push(result);
			return result;
		};
		sync.sync(firstHandle, 'both');
		let latest = {...secondControls, observerHeightMeters: 200};
		sync.update(secondHandle, latest);
		expect(complete.length).toBe(2);
		expect(first.changes).toEqual([secondControls, latest]);
		complete[1]();
		await pending[1];
		complete[0]();
		await pending[0];
		sync.sync(secondHandle, 'now');
		expect(second.changes).toEqual([latest]);
		expect(first.notifications).toEqual(['both']);
		expect(second.notifications).toEqual(['both', 'now']);
	});

	it('ignores returned errors without rolling back requested controls or changing subscriptions', async () => {
		let diagnostic = spyOn(console, 'error');
		first.onCameraChanged = () => new Error('not ready');
		sync.sync(firstHandle, 'both');
		let latest = {...secondControls, observerHeightMeters: 300};
		sync.update(secondHandle, latest);
		await Promise.resolve();
		sync.sync(secondHandle, 'now');
		expect(first.changes).toEqual([secondControls, latest]);
		expect(second.changes).toEqual([latest]);
		expect(first.notifications).toEqual(['both']);
		expect(diagnostic).not.toHaveBeenCalled();
	});

	for (let retirement of ['off', 'unregister', 'stop']) {
		it('keeps pending completion from reviving delivery after ' + retirement, async () => {
			let complete;
			let pending = new Promise((resolve) => {
				complete = resolve;
			});
			first.onCameraChanged = () => pending;
			sync.sync(firstHandle, 'both');
			if (retirement === 'off') {
				sync.sync(secondHandle, 'off');
			} else if (retirement === 'unregister') {
				sync.unregister(firstHandle);
			} else {
				implementation.stop();
			}
			let notifications = [...second.notifications];
			sync.update(secondHandle, {...secondControls, observerHeightMeters: 100});
			complete();
			await pending;
			await Promise.resolve();
			expect(first.changes).toEqual([secondControls]);
			expect(second.notifications).toEqual(notifications);
			if (retirement !== 'off') {
				expect(registry.subscribe('camera-view-1')).toBeUndefined();
			}
		});
	}

	it('removes the exact receiver, cancels its relationship and leaves stale handles harmless', () => {
		sync.sync(firstHandle, 'both');
		sync.unregister(secondHandle);
		expect(registry.subscribe('camera-view-2')).toBeUndefined();
		expect(registry.subscribe('camera-view-1')).toBe(first.serviceObject);
		expect(first.notifications).toEqual(['both', 'off']);
		second = new CameraReceiver('camera-view-2', registry);
		let replacement = sync.register('camera-view-2');
		expect(replacement).not.toBe(secondHandle);
		sync.update(replacement, secondControls);
		sync.sync(firstHandle, 'both');
		sync.unregister(secondHandle);
		sync.update(secondHandle, firstControls);
		sync.sync(secondHandle, 'off');
		sync.update(firstHandle, firstControls);
		expect(second.changes).toEqual([firstControls]);
		expect(registry.subscribe('camera-view-2')).toBe(second.serviceObject);
	});

	it('protects a replacement receiver under the same name while an old call is pending', async () => {
		let complete;
		let pending = new Promise((resolve) => {
			complete = resolve;
		});
		first.onCameraChanged = () => pending;
		sync.sync(firstHandle, 'both');
		let replacement = new CameraReceiver('camera-view-1', registry);
		sync.update(secondHandle, {...secondControls, observerHeightMeters: 100});
		expect(first.changes.length).toBe(1);
		expect(replacement.changes).toEqual([]);
		sync.unregister(firstHandle);
		expect(registry.subscribe('camera-view-1')).toBe(replacement.serviceObject);
		let replacementHandle = sync.register('camera-view-1');
		sync.update(replacementHandle, firstControls);
		sync.sync(secondHandle, 'both');
		complete();
		await pending;
		await Promise.resolve();
		expect(replacement.changes).toEqual([]);
		expect(second.changes).toEqual([firstControls]);
		sync.update(secondHandle, secondControls);
		expect(replacement.changes).toEqual([secondControls]);
	});

	it('keeps independent application registries and foreign handles isolated', () => {
		let otherRegistry = new Registry();
		let otherImplementation = new CameraSync(otherRegistry);
		otherImplementation.start();
		try {
			let otherSync = otherRegistry.subscribe('camera-sync');
			let otherFirst = new CameraReceiver('camera-view-1', otherRegistry);
			let otherSecond = new CameraReceiver('camera-view-2', otherRegistry);
			let otherFirstHandle = otherSync.register('camera-view-1');
			let otherSecondHandle = otherSync.register('camera-view-2');
			otherSync.update(otherFirstHandle, firstControls);
			otherSync.update(otherSecondHandle, secondControls);
			sync.sync(firstHandle, 'both');
			otherSync.sync(otherFirstHandle, 'both');
			sync.sync(otherFirstHandle, 'off');
			sync.unregister(otherSecondHandle);
			otherSync.update(firstHandle, firstControls);
			otherSync.unregister(secondHandle);
			sync.update(secondHandle, firstControls);
			expect(first.changes).toEqual([secondControls, firstControls]);
			expect(otherFirst.changes).toEqual([secondControls]);
			expect(otherSecond.changes).toEqual([]);
			expect(otherRegistry.subscribe('camera-view-2')).toBe(otherSecond.serviceObject);
		} finally {
			otherImplementation.stop();
		}
	});

	it('reports ownership and ambiguous-pair conflicts without disturbing existing participants', () => {
		new CameraReceiver('camera-view-3', registry);
		expect(() => sync.register('camera-view-3')).toThrowError(/unambiguous pair/);
		expect(() => sync.register('camera-view-1')).toThrowError(/already registered/);
		sync.unregister(secondHandle);
		expect(() => sync.register('missing-camera')).toThrowError(/not registered in this application/);
		sync.update(firstHandle, firstControls);
		expect(registry.subscribe('camera-view-1')).toBe(first.serviceObject);
	});

	it('cleans up idempotently and accepts fresh handles after restart without reviving the old lifetime', () => {
		sync.sync(firstHandle, 'both');
		implementation.start();
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([secondControls, firstControls]);
		implementation.stop();
		implementation.stop();
		expect(registry.subscribe('camera-view-1')).toBeUndefined();
		expect(registry.subscribe('camera-view-2')).toBeUndefined();
		expect(() => sync.register('camera-view-1')).toThrowError(/stopped/);
		implementation.start();
		first = new CameraReceiver('camera-view-1', registry);
		second = new CameraReceiver('camera-view-2', registry);
		let replacementFirst = sync.register('camera-view-1');
		let replacementSecond = sync.register('camera-view-2');
		sync.update(replacementFirst, firstControls);
		sync.update(replacementSecond, secondControls);
		sync.sync(replacementFirst, 'both');
		sync.sync(firstHandle, 'off');
		sync.unregister(secondHandle);
		sync.update(replacementSecond, firstControls);
		expect(first.changes).toEqual([secondControls, firstControls]);
	});

	it('contains unexpected callback throws and rejections without suppressing other notifications', async () => {
		let diagnostic = spyOn(console, 'error');
		first.onSynced = () => {
			throw new Error('unexpected notification failure');
		};
		first.onCameraChanged = () => Promise.reject(new Error('unexpected application rejection'));
		sync.sync(firstHandle, 'both');
		expect(second.notifications).toEqual(['both']);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(diagnostic.calls.count()).toBe(2);
		first.onSynced = null;
		first.onCameraChanged = null;
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([secondControls, firstControls]);
	});

	it('contains an unexpected synchronous camera callback throw and continues future delivery', () => {
		let diagnostic = spyOn(console, 'error');
		let receiver = registry.subscribe('camera-view-1');
		let original = receiver.cameraChanged;
		receiver.cameraChanged = () => {
			throw new Error('unexpected synchronous application failure');
		};
		sync.sync(firstHandle, 'both');
		expect(diagnostic).toHaveBeenCalledTimes(1);
		expect(second.notifications).toEqual(['both']);
		receiver.cameraChanged = original;
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([firstControls]);
	});

	it('respects off called synchronously from the initial camera callback without restoring both', () => {
		first.onCameraChanged = () => sync.sync(firstHandle, 'off');
		sync.sync(firstHandle, 'both');
		expect(first.notifications).toEqual(['off']);
		expect(second.notifications).toEqual(['off']);
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([secondControls]);
	});

	it('does not notify a peer removed synchronously by the initial camera callback', () => {
		first.onCameraChanged = () => sync.unregister(secondHandle);
		sync.sync(firstHandle, 'both');
		expect(first.notifications).toEqual(['off']);
		expect(second.notifications).toEqual([]);
		expect(registry.subscribe('camera-view-2')).toBeUndefined();
	});

	it('stops obsolete both notifications when the first synced callback cancels the relationship', () => {
		first.onSynced = (mode) => {
			if (mode === 'both') {
				sync.sync(firstHandle, 'off');
			}
		};
		sync.sync(firstHandle, 'both');
		expect(first.notifications).toEqual(['both', 'off']);
		expect(second.notifications).toEqual(['off']);
		sync.update(secondHandle, firstControls);
		expect(first.changes).toEqual([secondControls]);
	});

	it('honors unregister called by a synced callback without invoking obsolete peer notifications', () => {
		first.onSynced = (mode) => {
			if (mode === 'both') {
				sync.unregister(firstHandle);
			}
		};
		sync.sync(firstHandle, 'both');
		expect(registry.subscribe('camera-view-1')).toBeUndefined();
		expect(second.notifications).toEqual(['off']);
		expect(second.changes).toEqual([]);
	});

	it('keeps a newer relationship initiated by an off callback instead of continuing obsolete off notifications', () => {
		first.onSynced = (mode) => {
			if (mode === 'off') {
				sync.sync(firstHandle, 'both');
			}
		};
		sync.sync(firstHandle, 'off');
		expect(first.notifications).toEqual(['off', 'both']);
		expect(second.notifications).toEqual(['both']);
		sync.update(firstHandle, firstControls);
		expect(second.changes).toEqual([firstControls]);
	});
});
