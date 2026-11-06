/**
 * Shared live playback or an explicitly fixed pose relative to the startup epoch.
 */
interface FlatAnimationPlayback {
	/**
	 * Select live interval-driven playback or a fixed simulation pose.
	 */
	mode: 'live' | 'fixed';

	/**
	 * Store the fixed simulated elapsed time in seconds.
	 */
	fixedSimulatedElapsedSeconds?: number;

	/**
	 * Store the fixed solar-day rotation angle in radians.
	 */
	fixedSolarRotationAngleRad?: number;

	/**
	 * Explain why a fixed playback pose was selected.
	 */
	reason?: string;
}

/**
 * Resolved simulated and display durations for one complete day cycle.
 */
interface FlatAnimationCycleTiming {
	/**
	 * Identify the cycle.
	 */
	id: 'solarDay' | 'siderealDay';

	/**
	 * Store simulated duration in hours.
	 */
	simulatedDurationHours: number;

	/**
	 * Store simulated duration in seconds.
	 */
	simulatedDurationSeconds: number;

	/**
	 * Store real display seconds per full cycle.
	 */
	displayDurationSeconds: number;
}

/**
 * One relative cycle phase derived from the shared elapsed simulation time.
 */
interface FlatAnimationCycleState extends FlatAnimationCycleTiming {
	/**
	 * Store normalized position within the current cycle.
	 */
	cycleRatio: number;

	/**
	 * Store rotation angle for this cycle.
	 */
	rotationAngleRad: number;

	/**
	 * Count completed cycles.
	 */
	completedCycles: number;
}

/**
 * Solar and sidereal periods driven by one common simulation speed.
 */
interface FlatAnimationCycles {
	/**
	 * Store simulated seconds advanced per real second.
	 */
	simulatedSecondsPerRealSecond: number;

	/**
	 * Store solar-day cycle timing.
	 */
	solarDay: FlatAnimationCycleTiming;

	/**
	 * Store sidereal-day cycle timing.
	 */
	siderealDay: FlatAnimationCycleTiming;
}

/**
 * Application-wide cycle settings; both display periods must describe one shared speed.
 */
interface FlatAnimationLoopConfiguration {
	/**
	 * Store animation playback behavior.
	 */
	playback?: FlatAnimationPlayback;

	/**
	 * Store the solar-day loop.
	 */
	solarDay?: FlatAnimationCycleConfiguration;

	/**
	 * Store the sidereal-day loop.
	 */
	siderealDay?: FlatAnimationCycleConfiguration;
}

/**
 * Coherent current instant, elapsed times, and relative solar/sidereal phase snapshot.
 */
interface FlatAnimationFrame {
	/**
	 * Current absolute instant in integer Unix epoch milliseconds.
	 */
	timestamp: EpochTimestamp;

	/**
	 * Startup epoch in Unix epoch milliseconds; cycle phases are relative to this reference.
	 */
	epochTimestamp: EpochTimestamp;

	/**
	 * Store the resolved simulated elapsed time.
	 */
	simulatedElapsedSeconds: number;

	/**
	 * Store the previously resolved simulated elapsed time.
	 */
	previousSimulatedElapsedSeconds: number;

	/**
	 * Store the simulated-time delta since the previous frame.
	 */
	deltaSimulatedSeconds: number;

	/**
	 * Store elapsed real service time in seconds.
	 */
	realElapsedSeconds: number;

	/**
	 * Store elapsed real time for this frame.
	 */
	deltaRealSeconds: number;

	/**
	 * Count frames emitted by the animation loop.
	 */
	frameIndex: number;

	/**
	 * Store the playback settings used to resolve this frame.
	 */
	playback: FlatAnimationPlayback;

	/**
	 * Store resolved cycle timing.
	 */
	cycles: FlatAnimationCycles;

	/**
	 * Store solar-day cycle state.
	 */
	solarDay: FlatAnimationCycleState;

	/**
	 * Store sidereal-day cycle state.
	 */
	siderealDay: FlatAnimationCycleState;

	/**
	 * Store named rotation angles for consumers.
	 */
	rotationAngles: FlatAnimationRotationAngles;
}

/**
 * Startup epoch and scheduling options for the app-owned animation clock.
 */
interface FlatAnimationLoopStartOptions {
	/**
	 * Store milliseconds between service-owned interval ticks after ready.
	 */
	intervalMs?: number;

	/**
	 * Disable service-owned scheduling for a host-driven clock; readiness and live mode are still required otherwise.
	 */
	autoStart?: boolean;

	/**
	 * Store the initial absolute simulation epoch in Unix milliseconds; omitted uses the device clock at minute precision.
	 */
	initialTimestampMs?: EpochTimestamp;
}

/**
 * Relative day-cycle rotation angles in radians, each within [0, 2*pi).
 */
type FlatAnimationRotationAngles = {
	/**
	 * Relative solar day phase, not a calibrated astronomical orientation.
	 */
	solarDayRad: number;
	/**
	 * Relative sidereal day phase, not a calibrated astronomical orientation.
	 */
	siderealDayRad: number;
};

/**
 * Caller-supplied durations for a day cycle on the common animation clock.
 */
interface FlatAnimationCycleConfiguration {
	/**
	 * Positive simulation hours per complete rotation; defaults retain the archived day periods.
	 */
	simulatedDurationHours?: number;

	/**
	 * Positive real seconds per rotation. Omitted companion duration is derived from the common speed.
	 */
	displayDurationSeconds?: number;
}
