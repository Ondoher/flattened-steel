/** Smooth a normalized camera transition with zero first and second endpoint derivatives.
 * @param {number} fraction - Unit-interval transition position.
 * @returns {number} - Eased fraction.
 */
function ease(fraction) {
	return fraction ** 3 * (10 + fraction * (-15 + 6 * fraction));
}

/** Integrate a two-second smoothstep speed ramp from rest.
 * @param {number} seconds - Elapsed ramp seconds in [0, 2].
 * @returns {number} - Integrated seconds of unit-speed motion.
 */
function rampIntegral(seconds) {
	const fraction = seconds / 2;
	return 2 * (fraction ** 3 - 0.5 * fraction ** 4);
}

/** Sample the continuous 90-second camera and normalized physical clock score.
 * The central 70 seconds integrate two two-second speed ramps and 66 seconds
 * at unit speed. Dividing the resulting area by 68 makes precisely one day.
 * @param {number} seconds - Film time in the closed interval [0, 90].
 * @returns {LocalSunFilmClockSample} - Detached deterministic camera/clock facts.
 * @throws {RangeError} Film time is nonfinite or outside the score.
 */
export function sampleFilmClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > 90) throw new RangeError('Film time must lie in [0, 90] seconds.');
	const orbitSeconds = Math.max(0, Math.min(70, seconds - 10));
	const integral = orbitSeconds < 2 ? rampIntegral(orbitSeconds) : orbitSeconds > 68 ? 68 - rampIntegral(70 - orbitSeconds) : orbitSeconds - 1;
	const sourceProgress = integral / 68;
	const phase = sourceProgress * 2 * Math.PI;
	/** @type {LocalSunFilmSceneTriple} */
	let cameraMeters = [12 * Math.sin(phase), 10 - 2 * Math.cos(phase), 8 * Math.sin(2 * phase)];
	let verticalFieldOfViewDegrees = 18;
	if (seconds < 10) {
		const approach = ease(seconds / 10);
		cameraMeters = [-16 * (1 - approach), 6 + 2 * approach, 28 * (1 - approach)];
		verticalFieldOfViewDegrees = 45 - 27 * approach;
	} else if (seconds > 80) {
		const departure = ease((seconds - 80) / 10);
		cameraMeters = [16 * departure, 8 - 2 * departure, 28 * departure];
		verticalFieldOfViewDegrees = 18 + 27 * departure;
	}
	return {filmSeconds: seconds, sourceProgress, sourcePhaseDegrees: 180 + 360 * sourceProgress, verticalFieldOfViewDegrees, cameraMeters};
}

/** Aim the Sun at a fixed upper-third location while retaining the physical clock.
 * @param {number} seconds - Film time in [0, 90].
 * @param {UnitVector3} directionToSource - Physical observer-to-Sun east/north/up unit vector.
 * @returns {LocalSunFilmCameraSample} - Camera position in meters and look target in scene units.
 * @throws {TypeError} Source direction is invalid or is not a unit vector.
 */
export function sampleFilmCamera(seconds, directionToSource) {
	if (directionToSource.length !== 3 || directionToSource.some(value => !Number.isFinite(value)) || Math.abs(Math.hypot(...directionToSource) - 1) > 1e-6) throw new TypeError('Film camera requires a finite physical unit direction.');
	const clock = sampleFilmClock(seconds);
	const azimuth = Math.atan2(directionToSource[0], directionToSource[1]);
	const elevation = Math.asin(Math.max(-1, Math.min(1, directionToSource[2])));
	const lookElevation = elevation - Math.atan(0.32 * Math.tan(clock.verticalFieldOfViewDegrees * Math.PI / 360));
	const cosine = Math.cos(lookElevation);
	/** @type {LocalSunFilmSceneTriple} */
	const targetScene = [clock.cameraMeters[0] / 1000 + Math.sin(azimuth) * cosine, clock.cameraMeters[1] / 1000 + Math.sin(lookElevation), clock.cameraMeters[2] / 1000 - Math.cos(azimuth) * cosine];
	return {...clock, targetScene, sunElevationDegrees: elevation * 180 / Math.PI, sunAzimuthDegrees: ((azimuth * 180 / Math.PI) % 360 + 360) % 360};
}
