/**
 * App-wide current-time and animation capability. Frame events carry coherent timestamp and relative day phases.
 * configuration-updated and playback-updated events carry snapshots; error reports scheduling failure.
 */
interface AnimationLoopService extends EventBus {
	/**
	 * Call this method to initialize the device-local current time in fixed mode.
	 *
	 * @param options - Optional startup epoch and scheduling settings.
	 */
	start(options?: FlatAnimationLoopStartOptions): void;

	/**
	 * Call this method to enable owned scheduling for live playback after dependency readiness.
	 */
	ready(): void;

	/**
	 * Call this method to release the owned timer while retaining current time.
	 */
	stop(): void;

	/**
	 * Call this method to configure shared solar/sidereal periods and optional playback.
	 *
	 * @param animation - Cycle durations describing one shared simulation speed.
	 * @returns - Independent updated frame.
	 */
	configure(animation?: FlatAnimationLoopConfiguration | null): FlatAnimationFrame;

	/**
	 * Call this method to resume live playback or hold a fixed pose.
	 *
	 * @param playback - Playback settings; omitted means live.
	 * @returns - Accepted playback snapshot.
	 */
	setPlayback(playback?: FlatAnimationPlayback): FlatAnimationPlayback;

	/**
	 * Call this method to read playback settings.
	 *
	 * @returns - Independent playback snapshot.
	 */
	getPlayback(): FlatAnimationPlayback;

	/**
	 * Call this method to read both day periods and their common speed.
	 *
	 * @returns - Independent cycle timing snapshots.
	 */
	getCycles(): FlatAnimationCycles;

	/**
	 * Call this method to read the current shared instant.
	 *
	 * @returns - Integer milliseconds since the Unix epoch.
	 */
	getTimestamp(): EpochTimestamp;

	/**
	 * Call this method to seek to a shared instant without changing playback mode.
	 *
	 * @param timestamp - Integer milliseconds since the Unix epoch.
	 * @returns - Whether the current instant changed.
	 * @throws {RangeError} - The timestamp cannot represent a valid Date.
	 */
	setTimestamp(timestamp: EpochTimestamp): boolean;

	/**
	 * Call this method to read the current coherent animation frame.
	 *
	 * @returns - Independent timestamp, timing, cycle, and playback snapshots.
	 */
	getFrame(): FlatAnimationFrame;

	/**
	 * Call this method to read signed simulation seconds since the startup epoch.
	 *
	 * @returns - Elapsed simulation seconds.
	 */
	getSimulatedElapsedSeconds(): number;

	/**
	 * Call this method to read relative solar and sidereal phase angles.
	 *
	 * @returns - Angles in radians, independent of astronomical orientation.
	 */
	getRotationAngles(): FlatAnimationRotationAngles;

	/**
	 * Call this method to advance shared time from a monotonic clock sample.
	 *
	 * @param timestampMs - Optional host sample in milliseconds on the performance.now() timeline.
	 * @returns - Emitted frame snapshot.
	 */
	advance(timestampMs?: number): FlatAnimationFrame;

	/**
	 * Call this method to subscribe to shared timestamp and animation frames.
	 *
	 * @param callback - Consumer receiving each disposable frame.
	 * @returns - Exact listener identity owned by the caller.
	 */
	listenFrame(callback: (frame: FlatAnimationFrame) => void): string;

	/**
	 * Call this method to release the exact frame listener owned by the caller.
	 *
	 * @param listenerId - Identity returned by listenFrame.
	 */
	unlistenFrame(listenerId: string): void;
}
