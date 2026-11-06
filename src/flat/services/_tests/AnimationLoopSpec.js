import {Registry} from '@polylith/core';
import {
	AnimationLoopService,
	resolveAnimationCycles,
	resolvePlaybackSimulatedElapsedSeconds,
} from '../animation-loop.js';
import {ConfigurationService} from '../configuration.js';

/**
 * Call this function to create an isolated host-driven clock at the Unix epoch.
 *
 * @returns {AnimationLoopService} - Initialized fixed clock.
 */
function createClock() {
	let clock = new AnimationLoopService(new Registry());
	clock.start({autoStart: false, initialTimestampMs: 0});
	return clock;
}

describe('app-wide animation clock', () => {
	beforeEach(() => {
		spyOn(performance, 'now').and.returnValue(0);
	});

	it('starts fixed and shares solar/sidereal periods on a single scale', () => {
		let clock = createClock();
		let cycles = clock.getCycles();
		expect(clock.getTimestamp()).toBe(0);
		expect(clock.getPlayback().mode).toBe('fixed');
		expect(clock.advance(1000).timestamp).toBe(0);
		expect(cycles.simulatedSecondsPerRealSecond).toBe(2160);
		expect(cycles.solarDay.displayDurationSeconds).toBe(40);
		expect(cycles.siderealDay.displayDurationSeconds).toBeCloseTo(39.89078266666667, 8);
		let sidereal = resolveAnimationCycles({siderealDay: {displayDurationSeconds: 40}});
		expect(sidereal.siderealDay.displayDurationSeconds).toBeCloseTo(40, 10);
		expect(sidereal.solarDay.displayDurationSeconds).toBeGreaterThan(40);
	});

	it('advances one absolute timestamp and both phases, including complete days', () => {
		let clock = createClock();
		clock.setPlayback({mode: 'live'});
		let first = clock.advance(1000);
		expect(first.timestamp).toBe(2160000);
		expect(first.simulatedElapsedSeconds).toBe(2160);
		expect(first.previousSimulatedElapsedSeconds).toBe(0);
		expect(first.deltaSimulatedSeconds).toBe(2160);
		expect(first.rotationAngles.solarDayRad).toBeCloseTo(Math.PI / 20, 8);
		expect(first.rotationAngles.siderealDayRad).toBeGreaterThan(first.rotationAngles.solarDayRad);
		let day = clock.advance(40000);
		expect(day.timestamp).toBe(86400000);
		expect(day.solarDay.completedCycles).toBe(1);
		expect(day.solarDay.rotationAngleRad).toBeCloseTo(0, 8);
		expect(day.siderealDay.completedCycles).toBe(1);
	});

	it('resolves fixed elapsed and angle poses and pauses without jumping back to zero', () => {
		let clock = createClock();
		clock.setPlayback({mode: 'live'});
		clock.advance(1000);
		performance.now.and.returnValue(1000);
		clock.setPlayback({mode: 'fixed'});
		expect(clock.advance(2000).timestamp).toBe(2160000);
		clock.configure({playback: {mode: 'fixed', fixedSolarRotationAngleRad: Math.PI}});
		expect(clock.getSimulatedElapsedSeconds()).toBe(43200);
		expect(clock.advance(40000).rotationAngles.solarDayRad).toBeCloseTo(Math.PI, 8);
		expect(resolvePlaybackSimulatedElapsedSeconds({mode: 'fixed', fixedSimulatedElapsedSeconds: 7}, 12.5)).toBe(7);
	});

	it('seeks during live or fixed playback and handles epoch zero and negative relative elapsed time', () => {
		let clock = createClock();
		clock.setTimestamp(-1000);
		expect(clock.getFrame().timestamp).toBe(-1000);
		expect(clock.getFrame().solarDay.rotationAngleRad).toBeGreaterThan(0);
		expect(clock.setTimestamp(0)).toBeTrue();
		expect(clock.setTimestamp(0)).toBeFalse();
		clock.setPlayback({mode: 'live'});
		clock.setTimestamp(10000);
		expect(clock.getPlayback().mode).toBe('live');
		expect(clock.advance(1000).timestamp).toBe(2170000);
	});

	it('settles the old speed before reconfiguration and does not count a backward clock sample twice', () => {
		let clock = createClock();
		clock.setPlayback({mode: 'live'});
		performance.now.and.returnValue(1000);
		clock.configure({solarDay: {displayDurationSeconds: 86400}});
		expect(clock.getTimestamp()).toBe(2160000);
		expect(clock.advance(2000).timestamp).toBe(2161000);
		expect(clock.advance(1500).timestamp).toBe(2161000);
		expect(clock.advance(3000).timestamp).toBe(2162000);
	});

	it('owns one timer after readiness, advances without an explicit sample, and releases it exactly', () => {
		jasmine.clock().install();
		let clock = new AnimationLoopService(new Registry());
		try {
			clock.start({initialTimestampMs: 0});
			clock.setPlayback({mode: 'live'});
			expect(clock.timerId).toBeNull();
			let frames = jasmine.createSpy('frames');
			clock.listenFrame(frames);
			clock.ready();
			clock.ready();
			performance.now.and.returnValue(1000);
			jasmine.clock().tick(16);
			expect(clock.getTimestamp()).toBe(2160000);
			expect(frames).toHaveBeenCalledTimes(1);
			clock.stop();
			clock.stop();
			performance.now.and.returnValue(2000);
			jasmine.clock().tick(160);
			expect(frames).toHaveBeenCalledTimes(1);
			expect(clock.timerId).toBeNull();
			clock.ready();
			performance.now.and.returnValue(3000);
			jasmine.clock().tick(16);
			expect(clock.getTimestamp()).toBe(4320000);
		} finally {
			clock.stop();
			jasmine.clock().uninstall();
		}
	});

	it('protects frame snapshots and removes exact listeners without affecting another app clock', () => {
		let first = createClock();
		let second = createClock();
		let frames = [];
		let id = first.listenFrame((frame) => {
			frames.push(frame);
			frame.solarDay.rotationAngleRad = 999;
			frame.cycles.solarDay.simulatedDurationSeconds = 1;
			frame.playback.mode = 'live';
		});
		first.setTimestamp(1000);
		expect(first.getPlayback().mode).toBe('fixed');
		expect(first.getFrame().solarDay.rotationAngleRad).not.toBe(999);
		expect(first.getCycles().solarDay.simulatedDurationSeconds).toBe(86400);
		expect(second.getTimestamp()).toBe(0);
		first.unlistenFrame(id);
		first.setTimestamp(2000);
		expect(frames.length).toBe(1);
	});

	it('delegates configuration timestamps to the clock and replaces only its owned listener on readiness', () => {
		let registry = new Registry();
		let clock = new AnimationLoopService(registry);
		let configuration = new ConfigurationService(registry);
		clock.start({autoStart: false, initialTimestampMs: 0});
		configuration.start();
		configuration.ready();
		configuration.ready();
		let changed = jasmine.createSpy('changed');
		configuration.listen('changed', changed);
		clock.setTimestamp(1000);
		expect(configuration.get().timestamp).toBe(1000);
		expect(changed).toHaveBeenCalledTimes(1);
		expect(changed.calls.mostRecent().args[1]).toEqual(['timestamp']);
		configuration.setTimestamp(2000);
		expect(clock.getTimestamp()).toBe(2000);
		clock.advance(1000);
		expect(changed).toHaveBeenCalledTimes(2);
		configuration.start();
		clock.setTimestamp(3000);
		expect(changed).toHaveBeenCalledTimes(2);
		configuration.ready();
		expect(configuration.get().timestamp).toBe(3000);
		expect(changed).toHaveBeenCalledTimes(3);
		configuration.stop();
	});

	it('rejects invalid numeric settings and incompatible speeds without changing accepted settings', () => {
		let clock = createClock();
		for (let timestamp of [NaN, Infinity, 1.5, 8640000000000001]) {
			expect(() => clock.setTimestamp(timestamp)).toThrowError(RangeError);
		}
		expect(() => clock.configure({solarDay: {displayDurationSeconds: 0}})).toThrowError(RangeError);
		expect(() =>
			clock.configure({solarDay: {displayDurationSeconds: 40}, siderealDay: {displayDurationSeconds: 60}}),
		).toThrowError(RangeError);
		expect(clock.getTimestamp()).toBe(0);
		expect(clock.getCycles().solarDay.displayDurationSeconds).toBe(40);
	});
});
