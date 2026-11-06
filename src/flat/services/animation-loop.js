import {Service} from '@polylith/core';

const TAU = Math.PI * 2;
const DEFAULT_INTERVAL_MS = 16;
const DEFAULT_SOLAR_DAY_HOURS = 24;
const DEFAULT_SOLAR_DISPLAY_SECONDS = 40;
const DEFAULT_SIDEREAL_DAY_HOURS = 23.9344696;

/**
 * Call this function to select an omitted numeric setting or reject a nonfinite clock value.
 *
 * @param {number|null|undefined} value - Optional numeric setting.
 * @param {number} fallback - Default for an omitted value.
 * @returns {number} - Finite numeric value.
 */
function finiteNumber(value, fallback) {
	let result = value ?? fallback;
	if (!Number.isFinite(result)) {
		throw new RangeError('Animation clock values must be finite.');
	}
	return result;
}

/**
 * Call this function to resolve a positive cycle duration or interval.
 *
 * @param {number|undefined} value - Optional duration.
 * @param {number} fallback - Default for an omitted duration.
 * @returns {number} - Positive finite duration.
 */
function positiveNumber(value, fallback) {
	let result = finiteNumber(value, fallback);
	if (result <= 0) {
		throw new RangeError('Animation durations must be positive.');
	}
	return result;
}

/**
 * Call this function to reject a timestamp that cannot represent an application instant.
 *
 * @param {EpochTimestamp} timestamp - Unix epoch milliseconds.
 */
function validateTimestamp(timestamp) {
	if (!Number.isInteger(timestamp) || Number.isNaN(new Date(timestamp).getTime())) {
		throw new RangeError('A valid timestamp in integer Unix epoch milliseconds is required.');
	}
}

/**
 * Call this function to normalize a rotation angle into the positive `0..TAU` range.
 *
 * @param {number} angleRad - Provide a rotation angle in radians.
 * @returns {number} - Resolved finite value.
 */
export function normalizeRotationAngleRad(angleRad) {
	const angle = finiteNumber(angleRad, 0);

	return ((angle % TAU) + TAU) % TAU;
}

/**
 * Call this function to wrap positive or negative elapsed simulation time into a cycle.
 *
 * @param {number} simulatedElapsedSeconds - Elapsed simulation seconds from the shared epoch.
 * @param {number} simulatedDurationSeconds - Seconds per complete cycle.
 * @returns {number} - Fraction within [0, 1).
 */
function cycleRatioFromSimulatedSeconds(simulatedElapsedSeconds, simulatedDurationSeconds) {
	const cyclePosition = simulatedElapsedSeconds / simulatedDurationSeconds;

	return ((cyclePosition % 1) + 1) % 1;
}

/**
 * Call this function to derive one cycle's phase and completed count from shared elapsed time.
 *
 * @param {number} simulatedElapsedSeconds - Elapsed simulation seconds from the shared epoch.
 * @param {FlatAnimationCycleTiming} cycle - Resolved cycle timing.
 * @returns {FlatAnimationCycleState} - Independent cycle-state snapshot.
 */
function cycleStateFromSimulatedSeconds(simulatedElapsedSeconds, cycle) {
	const cycleRatio = cycleRatioFromSimulatedSeconds(simulatedElapsedSeconds, cycle.simulatedDurationSeconds);

	return {
		...cycle,
		cycleRatio,
		rotationAngleRad: cycleRatio * TAU,
		completedCycles: Math.floor(simulatedElapsedSeconds / cycle.simulatedDurationSeconds),
	};
}

/**
 * Call this function to resolve solar and sidereal periods on one shared simulation clock.
 *
 * The solar display duration defines the real-to-simulated-time scale. The
 * sidereal display duration is derived from that same scale unless the scene
 * explicitly provides a compatible one. A sidereal-only display duration can also
 * determine the shared speed.
 *
 * @param {FlatAnimationLoopConfiguration | null | undefined} animation - Provide animation settings.
 * @returns {FlatAnimationCycles} - Resolved periods and one real-to-simulation time scale.
 */
export function resolveAnimationCycles(animation = null) {
	const solarInput = animation?.solarDay ?? {};
	const siderealInput = animation?.siderealDay ?? {};
	const solarSimulatedDurationHours = positiveNumber(solarInput.simulatedDurationHours, DEFAULT_SOLAR_DAY_HOURS);
	const solarSimulatedDurationSeconds = solarSimulatedDurationHours * 60 * 60;
	const siderealSimulatedDurationHours = positiveNumber(
		siderealInput.simulatedDurationHours,
		DEFAULT_SIDEREAL_DAY_HOURS,
	);
	const siderealSimulatedDurationSeconds = siderealSimulatedDurationHours * 60 * 60;
	const solarDisplayDurationSeconds = positiveNumber(
		solarInput.displayDurationSeconds,
		siderealInput.displayDurationSeconds == null
			? DEFAULT_SOLAR_DISPLAY_SECONDS
			: (positiveNumber(siderealInput.displayDurationSeconds, DEFAULT_SOLAR_DISPLAY_SECONDS) *
					solarSimulatedDurationSeconds) /
					siderealSimulatedDurationSeconds,
	);
	const simulatedSecondsPerRealSecond = positiveNumber(
		solarSimulatedDurationSeconds / solarDisplayDurationSeconds,
		1,
	);
	const siderealDisplayDurationSeconds = positiveNumber(
		siderealSimulatedDurationSeconds / simulatedSecondsPerRealSecond,
		1,
	);
	if (
		siderealInput.displayDurationSeconds != null &&
		Math.abs(siderealInput.displayDurationSeconds - siderealDisplayDurationSeconds) >
			siderealDisplayDurationSeconds * 1e-9
	) {
		throw new RangeError('Solar and sidereal display durations must describe the same simulation speed.');
	}

	return {
		simulatedSecondsPerRealSecond,
		solarDay: {
			id: 'solarDay',
			simulatedDurationHours: solarSimulatedDurationHours,
			simulatedDurationSeconds: solarSimulatedDurationSeconds,
			displayDurationSeconds: solarDisplayDurationSeconds,
		},
		siderealDay: {
			id: 'siderealDay',
			simulatedDurationHours: siderealSimulatedDurationHours,
			simulatedDurationSeconds: siderealSimulatedDurationSeconds,
			displayDurationSeconds: siderealDisplayDurationSeconds,
		},
	};
}

/**
 * Call this function to resolve a fixed pose or retain the current live simulation time.
 *
 * @param {FlatAnimationPlayback | null | undefined} playback - Provide playback settings.
 * @param {number} currentSimulatedElapsedSeconds - Provide the current simulated elapsed time.
 * @param {FlatAnimationCycles} cycles - Provide resolved cycle timing.
 * @returns {number} - Resolved finite value.
 */
export function resolvePlaybackSimulatedElapsedSeconds(
	playback,
	currentSimulatedElapsedSeconds = 0,
	cycles = resolveAnimationCycles(),
) {
	if (playback?.mode !== 'fixed') {
		return finiteNumber(currentSimulatedElapsedSeconds, 0);
	}

	if (playback.fixedSimulatedElapsedSeconds != null) {
		return finiteNumber(playback.fixedSimulatedElapsedSeconds, currentSimulatedElapsedSeconds);
	}
	if (playback.fixedSolarRotationAngleRad != null) {
		const cycleRatio = normalizeRotationAngleRad(playback.fixedSolarRotationAngleRad) / TAU;
		return cycleRatio * cycles.solarDay.simulatedDurationSeconds;
	}
	return currentSimulatedElapsedSeconds;
}

/**
 * Owns Flat's shared current timestamp and solar/sidereal animation frames.
 * Adapted from the archived Flat runtime; cycles measure rotation relative to the startup epoch.
 *
 * @implements {AnimationLoopService}
 */
export class AnimationLoopService extends Service {
	/**
	 * Creates the app-local clock capability without starting a timer.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('animation-loop', registry);
		this.implement([
			'start',
			'ready',
			'stop',
			'configure',
			'setPlayback',
			'getPlayback',
			'getCycles',
			'getTimestamp',
			'setTimestamp',
			'getFrame',
			'getSimulatedElapsedSeconds',
			'getRotationAngles',
			'advance',
			'listenFrame',
			'unlistenFrame',
		]);
		this.timerId = null;
	}

	/**
	 * Call this method to initialize a fixed current time before registry readiness.
	 *
	 * @param {FlatAnimationLoopStartOptions} [options] - Startup epoch and interval settings.
	 */
	start(options = {}) {
		this.stop();
		let now = new Date();
		now.setSeconds(0, 0);
		this.epochTimestamp = options.initialTimestampMs ?? now.getTime();
		validateTimestamp(this.epochTimestamp);
		this.intervalMs = positiveNumber(options.intervalMs, DEFAULT_INTERVAL_MS);
		this.autoStart = options.autoStart !== false;
		this.cycles = resolveAnimationCycles();
		this.playback = /** @type {FlatAnimationPlayback} */ ({mode: 'fixed'});
		this.simulatedElapsedSeconds = 0;
		this.previousSimulatedElapsedSeconds = 0;
		this.realElapsedSeconds = 0;
		this.frameIndex = 0;
		this.lastTimestampMs = performance.now();
		this.frame = this._createFrame(0);
	}

	/**
	 * Call this method to enable the timer for live playback after registry readiness.
	 */
	ready() {
		this._ready = true;
		this.lastTimestampMs = performance.now();
		this._syncInterval();
	}

	/**
	 * Call this method to release this service's timer without resetting the selected time.
	 */
	stop() {
		this._ready = false;
		this._clearInterval();
	}

	/**
	 * Called by lifecycle and playback changes to release the exact owned interval.
	 */
	_clearInterval() {
		if (this.timerId != null) {
			clearInterval(this.timerId);
		}
		this.timerId = null;
	}

	/**
	 * Called after lifecycle/settings changes to retain at most one live-playback interval.
	 */
	_syncInterval() {
		this._clearInterval();
		if (this._ready && this.autoStart && this.playback.mode === 'live') {
			this.timerId = setInterval(() => this._onTick(), this.intervalMs);
		}
	}

	/**
	 * Called by the owned interval to publish a frame or stop at an invalid clock range.
	 */
	_onTick() {
		try {
			this.advance();
		} catch (error) {
			this.stop();
			this.fire('error', error);
		}
	}

	/**
	 * Call this method to configure shared day periods without changing the current time by default.
	 *
	 * @param {FlatAnimationLoopConfiguration|null} [animation] - Shared cycle timing and optional playback.
	 * @returns {FlatAnimationFrame} - Updated frame snapshot.
	 */
	configure(animation = null) {
		let cycles = resolveAnimationCycles(animation);
		let playback = animation?.playback ? {...animation.playback} : this.getPlayback();
		this._applySettings(cycles, playback);
		this.fire('configuration-updated', this.getCycles());
		this._publishFrame();
		return this.getFrame();
	}

	/**
	 * Call this method to start/resume live playback or hold a fixed simulation pose.
	 *
	 * @param {FlatAnimationPlayback} [playback] - Live mode or a fixed pose; omitted means live.
	 * @returns {FlatAnimationPlayback} - Accepted playback snapshot.
	 */
	setPlayback(playback = {mode: 'live'}) {
		this._applySettings(this.cycles, {...playback});
		this.fire('playback-updated', this.getPlayback());
		this._publishFrame();
		return this.getPlayback();
	}

	/**
	 * Called by configuration and playback commands to settle the old speed before applying settings.
	 *
	 * @param {FlatAnimationCycles} cycles - Resolved shared periods.
	 * @param {FlatAnimationPlayback} playback - Next playback settings.
	 */
	_applySettings(cycles, playback) {
		let elapsed = resolvePlaybackSimulatedElapsedSeconds(playback, this.simulatedElapsedSeconds, cycles);
		validateTimestamp(Math.round(this.epochTimestamp + elapsed * 1000));
		this._advanceTime(performance.now());
		elapsed = resolvePlaybackSimulatedElapsedSeconds(playback, this.simulatedElapsedSeconds, cycles);
		this.cycles = cycles;
		this.playback = playback;
		this.simulatedElapsedSeconds = elapsed;
		this.previousSimulatedElapsedSeconds = elapsed;
		this.frame = this._createFrame(0);
		this._syncInterval();
	}

	/**
	 * Call this method to read an independent playback snapshot.
	 *
	 * @returns {FlatAnimationPlayback} - Current playback settings.
	 */
	getPlayback() {
		return {...this.playback};
	}

	/**
	 * Call this method to read shared simulation speed and independent cycle snapshots.
	 *
	 * @returns {FlatAnimationCycles} - Solar/sidereal timing at one common speed.
	 */
	getCycles() {
		return {...this.cycles, solarDay: {...this.cycles.solarDay}, siderealDay: {...this.cycles.siderealDay}};
	}

	/**
	 * Call this method to read the current absolute instant for all views.
	 *
	 * @returns {EpochTimestamp} - Integer Unix epoch milliseconds.
	 */
	getTimestamp() {
		return Math.round(this.epochTimestamp + this.simulatedElapsedSeconds * 1000);
	}

	/**
	 * Call this method to seek to an absolute instant while retaining the playback mode and day periods.
	 *
	 * @param {EpochTimestamp} timestamp - Integer Unix epoch milliseconds.
	 * @returns {boolean} - Whether the current instant changed.
	 * @throws {RangeError} - The timestamp cannot represent a valid Date.
	 */
	setTimestamp(timestamp) {
		validateTimestamp(timestamp);
		if (this.getTimestamp() === timestamp) {
			return false;
		}
		this.simulatedElapsedSeconds = (timestamp - this.epochTimestamp) / 1000;
		this.previousSimulatedElapsedSeconds = this.simulatedElapsedSeconds;
		this.lastTimestampMs = performance.now();
		if (this.playback.mode === 'fixed') {
			this.playback = {
				mode: 'fixed',
				fixedSimulatedElapsedSeconds: this.simulatedElapsedSeconds,
				reason: this.playback.reason,
			};
		}
		this.frame = this._createFrame(0);
		this._publishFrame();
		return true;
	}

	/**
	 * Call this method to read the most recent frame without exposing internal mutable state.
	 *
	 * @returns {FlatAnimationFrame} - Independent frame, playback, cycles, and phase data.
	 */
	getFrame() {
		return {
			...this.frame,
			playback: {...this.frame.playback},
			cycles: this.getCycles(),
			solarDay: {...this.frame.solarDay},
			siderealDay: {...this.frame.siderealDay},
			rotationAngles: {...this.frame.rotationAngles},
		};
	}

	/**
	 * Call this method to read elapsed simulation seconds relative to the startup epoch.
	 *
	 * @returns {number} - Signed simulation seconds from the shared epoch.
	 */
	getSimulatedElapsedSeconds() {
		return this.simulatedElapsedSeconds;
	}

	/**
	 * Call this method to read relative solar/sidereal cycle angles for rendering consumers.
	 *
	 * @returns {FlatAnimationRotationAngles} - Radians in [0, 2*pi); these are cycle phases, not astronomical orientation.
	 */
	getRotationAngles() {
		return {...this.frame.rotationAngles};
	}

	/**
	 * Called by advancement and settings changes to update time from a monotonic clock sample.
	 *
	 * @param {number} timestampMs - Monotonic clock milliseconds, on the performance.now() timeline.
	 * @returns {number} - Nonnegative real elapsed seconds.
	 */
	_advanceTime(timestampMs) {
		let current = finiteNumber(timestampMs, performance.now());
		let delta = Math.max(0, (current - this.lastTimestampMs) / 1000);
		let elapsed = this.simulatedElapsedSeconds;
		if (this.playback.mode === 'live') {
			elapsed += delta * this.cycles.simulatedSecondsPerRealSecond;
		}
		validateTimestamp(Math.round(this.epochTimestamp + elapsed * 1000));
		this.previousSimulatedElapsedSeconds = this.simulatedElapsedSeconds;
		this.simulatedElapsedSeconds = elapsed;
		this.realElapsedSeconds += delta;
		this.lastTimestampMs = Math.max(current, this.lastTimestampMs);
		return delta;
	}

	/**
	 * Call this method to advance all consumers from one shared monotonic clock sample.
	 *
	 * @param {number} [timestampMs] - Optional host-provided performance.now() timeline sample in milliseconds.
	 * @returns {FlatAnimationFrame} - Emitted frame snapshot.
	 */
	advance(timestampMs = performance.now()) {
		let delta = this._advanceTime(timestampMs);
		this.frameIndex++;
		this.frame = this._createFrame(delta);
		this._publishFrame();
		return this.getFrame();
	}

	/**
	 * Called after a transition to publish a disposable frame rather than internal state.
	 */
	_publishFrame() {
		this.fire('frame', this.getFrame());
	}

	/**
	 * Called by transitions to project one coherent timestamp and both relative day phases.
	 *
	 * @param {number} deltaRealSeconds - Seconds since the previous real clock sample.
	 * @returns {FlatAnimationFrame} - Current coherent frame.
	 */
	_createFrame(deltaRealSeconds) {
		let solarDay = cycleStateFromSimulatedSeconds(this.simulatedElapsedSeconds, this.cycles.solarDay);
		let siderealDay = cycleStateFromSimulatedSeconds(this.simulatedElapsedSeconds, this.cycles.siderealDay);
		return {
			timestamp: this.getTimestamp(),
			epochTimestamp: this.epochTimestamp,
			simulatedElapsedSeconds: this.simulatedElapsedSeconds,
			previousSimulatedElapsedSeconds: this.previousSimulatedElapsedSeconds,
			deltaSimulatedSeconds: this.simulatedElapsedSeconds - this.previousSimulatedElapsedSeconds,
			realElapsedSeconds: this.realElapsedSeconds,
			deltaRealSeconds,
			frameIndex: this.frameIndex,
			playback: this.getPlayback(),
			cycles: this.getCycles(),
			solarDay,
			siderealDay,
			rotationAngles: {solarDayRad: solarDay.rotationAngleRad, siderealDayRad: siderealDay.rotationAngleRad},
		};
	}

	/**
	 * Call this method to observe shared time and animation frames.
	 *
	 * @param {(frame: FlatAnimationFrame) => void} callback - Frame consumer.
	 * @returns {string} - Exact listener identity owned by the caller.
	 */
	listenFrame(callback) {
		return this.listen('frame', callback);
	}

	/**
	 * Call this method to release the caller's exact frame subscription.
	 *
	 * @param {string} listenerId - Identity returned by listenFrame.
	 */
	unlistenFrame(listenerId) {
		this.unlisten('frame', listenerId);
	}
}

export default AnimationLoopService;
new AnimationLoopService();
