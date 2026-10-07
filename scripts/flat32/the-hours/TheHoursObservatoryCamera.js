/** Fluid observer-local camera choreography for the full-day observatory film. */
export class TheHoursObservatoryCamera {
	/**
	 * Creates a camera director around a caller-owned Three camera.
	 *
	 * @param {TheHoursCameraConfiguration} configuration - Camera and film duration.
	 */
	constructor(configuration) {
		this._camera = configuration.camera;
		this._durationSeconds = configuration.durationSeconds;
		this._camera.near = 0.0005;
		this._camera.far = 500;
	}

	/**
	 * Called by choreography to ease a scalar between authored keyframes.
	 *
	 * @param {number} seconds - Time on the normalized sixty-second score.
	 * @param {readonly number[][]} keys - Ordered time/value pairs.
	 * @returns {number} - Smoothly interpolated value.
	 */
	_curve(seconds, keys) {
		let index = keys.findIndex((key) => key[0] >= seconds);
		if (index <= 0) return keys[index === 0 ? 0 : keys.length - 1][1];
		const previous = keys[index - 1];
		const next = keys[index];
		const fraction = (seconds - previous[0]) / (next[0] - previous[0]);
		const eased = fraction * fraction * (3 - 2 * fraction);
		return previous[1] + (next[1] - previous[1]) * eased;
	}

	/**
	 * Call this method to place the camera for one exact astronomical frame.
	 * Sunrise and sunset look directly at the Sun; the daytime arc retains the
	 * Sun near the upper frame while the armillary supplies a foreground reference.
	 *
	 * @param {TheHoursSolarFrame} frame - Exact solar state and animation timestamp.
	 * @returns {TheHoursCameraSnapshot} - Recoverable camera pose in meters and degrees.
	 */
	apply(frame) {
		const seconds = (frame.animationSeconds / this._durationSeconds) * 60;
		const direction = frame.directionToSunScene;
		const horizontalLength = Math.hypot(direction[0], direction[2]);
		const east = direction[0] / horizontalLength;
		const south = direction[2] / horizontalLength;
		const radius = this._curve(seconds, [
			[0, 165],
			[7, 122],
			[12, 100],
			[18, 87],
			[30, 36],
			[42, 87],
			[48, 100],
			[53, 132],
			[60, 205],
		]);
		const height = this._curve(seconds, [
			[0, 26],
			[7, 19],
			[12, 18],
			[18, 12],
			[30, 5.5],
			[42, 12],
			[48, 18],
			[53, 26],
			[60, 44],
		]);
		const side = this._curve(seconds, [
			[0, -36],
			[12, -28],
			[23, -12],
			[30, 0],
			[37, 12],
			[48, 28],
			[60, 42],
		]);
		const fieldOfViewDegrees = this._curve(seconds, [
			[0, 66],
			[7, 58],
			[12, 55],
			[18, 60],
			[30, 80],
			[42, 60],
			[48, 55],
			[53, 60],
			[60, 72],
		]);
		const authoredElevation = this._curve(seconds, [
			[0, 25],
			[7, 5],
			[12, 0],
			[18, 7],
			[30, 42],
			[42, 7],
			[48, 0],
			[53, 10],
			[60, 34],
		]);
		const solarElevation = 90 - frame.solarZenithDegrees;
		const elevationDegrees = Math.max(authoredElevation, solarElevation - fieldOfViewDegrees / 2 + 5);
		const elevationRadians = (elevationDegrees * Math.PI) / 180;
		const positionMeters = [-east * radius - south * side, height, -south * radius + east * side];
		const viewDirection = [
			east * Math.cos(elevationRadians),
			Math.sin(elevationRadians),
			south * Math.cos(elevationRadians),
		];
		const camera = this._camera;
		camera.position.set(positionMeters[0] / 1000, positionMeters[1] / 1000, positionMeters[2] / 1000);
		camera.up.set(0, 1, 0);
		camera.fov = fieldOfViewDegrees;
		camera.lookAt(
			camera.position.x + viewDirection[0],
			camera.position.y + viewDirection[1],
			camera.position.z + viewDirection[2],
		);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		return {positionMeters, viewDirection, fieldOfViewDegrees, elevationDegrees};
	}
}
