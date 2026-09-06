const HALF_PI = Math.PI / 2;

/** Literal Figure 1 low-Sun source-marker azimuth from the author code. */
export const FIGURE1_LOW_SUN_AZIMUTH_RADIANS = (-25.83454348280912 * Math.PI) / 180;

/** Literal Figure 9 source azimuth from the author code. */
export const FIGURE9_SOURCE_AZIMUTH_RADIANS = (-30 * Math.PI) / 180;

/** Literal Figure 9 apparent solar-disk diameter from the author code. */
export const FIGURE9_SOLAR_DIAMETER_RADIANS = (0.5357 * Math.PI) / 180;

/** Literal Figure 9 apparent solar-disk radius from the author code. */
export const FIGURE9_SOLAR_RADIUS_RADIANS = FIGURE9_SOLAR_DIAMETER_RADIANS / 2;

/** Exact paper Figure 1 equidistant-dome raster dimensions. */
export const FIGURE1_EQUIDISTANT_DOME_SIZE = 256;

/** Exact paper Figure 9 pinhole raster dimensions and field of view. */
export const FIGURE9_PINHOLE_CONTRACT = Object.freeze({
	width: 1024,
	height: 576,
	horizontalFieldOfViewRadians: HALF_PI,
	verticalFieldOfViewRadians: 2 * Math.atan(576 / 1024),
});

function requireFiniteVector3(value, label) {
	if ((!Array.isArray(value) && !ArrayBuffer.isView(value)) || value.length !== 3) {
		throw new TypeError(`${label} must contain exactly three values.`);
	}
	const copy = Array.from(value);
	if (!copy.every(Number.isFinite)) throw new TypeError(`${label} values must be finite.`);
	const length = Math.hypot(...copy);
	if (!(length > 0)) throw new RangeError(`${label} must be nonzero.`);
	return Object.freeze(copy.map((component) => component / length));
}

function dot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function acceptOrientation(value = PAPER_Z_UP_IDENTITY_ORIENTATION) {
	const rightLocal = requireFiniteVector3(value.rightLocal, 'Projection right basis');
	const forwardLocal = requireFiniteVector3(value.forwardLocal, 'Projection forward basis');
	const upLocal = requireFiniteVector3(value.upLocal, 'Projection up basis');
	const tolerance = 1e-10;
	if (
		Math.abs(dot(rightLocal, forwardLocal)) > tolerance ||
		Math.abs(dot(rightLocal, upLocal)) > tolerance ||
		Math.abs(dot(forwardLocal, upLocal)) > tolerance
	) {
		throw new RangeError('Projection orientation basis must be orthogonal.');
	}
	const handedness = dot(cross(rightLocal, forwardLocal), upLocal);
	if (Math.abs(handedness - 1) > tolerance) {
		throw new RangeError('Projection orientation basis must be right-handed.');
	}
	return Object.freeze({rightLocal, forwardLocal, upLocal});
}

function orientDirection(canonicalDirection, orientation) {
	const value = [
		canonicalDirection[0] * orientation.rightLocal[0] +
			canonicalDirection[1] * orientation.forwardLocal[0] +
			canonicalDirection[2] * orientation.upLocal[0],
		canonicalDirection[0] * orientation.rightLocal[1] +
			canonicalDirection[1] * orientation.forwardLocal[1] +
			canonicalDirection[2] * orientation.upLocal[1],
		canonicalDirection[0] * orientation.rightLocal[2] +
			canonicalDirection[1] * orientation.forwardLocal[2] +
			canonicalDirection[2] * orientation.upLocal[2],
	];
	const length = Math.hypot(...value);
	return [value[0] / length, value[1] / length, value[2] / length];
}

/**
 * Canonical paper coordinates are Z-up: +X is image-right on the horizon and
 * +Y is the projection's azimuth-zero forward direction.
 */
export const PAPER_Z_UP_IDENTITY_ORIENTATION = Object.freeze({
	rightLocal: Object.freeze([1, 0, 0]),
	forwardLocal: Object.freeze([0, 1, 0]),
	upLocal: Object.freeze([0, 0, 1]),
});

/** Rotate the complete paper projection around the observer-local Z-up axis. */
export function createPaperProjectionAzimuthOrientation(forwardAzimuthRadians) {
	if (!Number.isFinite(forwardAzimuthRadians)) {
		throw new TypeError('Projection forward azimuth must be finite.');
	}
	const sine = Math.sin(forwardAzimuthRadians);
	const cosine = Math.cos(forwardAzimuthRadians);
	return acceptOrientation({
		rightLocal: [cosine, -sine, 0],
		forwardLocal: [sine, cosine, 0],
		upLocal: [0, 0, 1],
	});
}

/**
 * Rotate a paper projection so one observer-local source direction appears at
 * the requested paper azimuth. This supports source-relative plates without
 * removing the geographic orientation option above.
 */
export function createSourceRelativePaperOrientation({directionToSourceLocal, paperSourceAzimuthRadians}) {
	const direction = requireFiniteVector3(directionToSourceLocal, 'Direction to source');
	if (!Number.isFinite(paperSourceAzimuthRadians)) {
		throw new TypeError('Paper source azimuth must be finite.');
	}
	const horizontalLength = Math.hypot(direction[0], direction[1]);
	if (!(horizontalLength > 1e-12)) {
		throw new RangeError('Source-relative orientation requires a non-zenith source direction.');
	}
	const sourceAzimuthRadians = Math.atan2(direction[0], direction[1]);
	return createPaperProjectionAzimuthOrientation(sourceAzimuthRadians - paperSourceAzimuthRadians);
}

/** Create the author-code-exact 256 by 256 Figure 1 equidistant hemisphere. */
export function createFigure1EquidistantDomeProjection({orientation = PAPER_Z_UP_IDENTITY_ORIENTATION} = {}) {
	const acceptedOrientation = acceptOrientation(orientation);
	const width = FIGURE1_EQUIDISTANT_DOME_SIZE;
	const height = FIGURE1_EQUIDISTANT_DOME_SIZE;
	const pixelCount = width * height;
	const pixelDirectionIndices = new Int32Array(pixelCount);
	pixelDirectionIndices.fill(-1);
	const directionStorage = new Float32Array(pixelCount * 3);
	let directionCount = 0;

	for (let row = 0; row < height; row += 1) {
		for (let column = 0; column < width; column += 1) {
			const x = (column + 0.5 - width / 2) / (width / 2);
			const y = (height / 2 - 0.5 - row) / (height / 2);
			const radius = Math.hypot(x, y);
			if (radius >= 1) continue;
			const viewZenithRadians = radius * HALF_PI;
			const viewAzimuthRadians = Math.atan2(x, -y);
			const sineZenith = Math.sin(viewZenithRadians);
			const direction = orientDirection(
				[
					sineZenith * Math.sin(viewAzimuthRadians),
					sineZenith * Math.cos(viewAzimuthRadians),
					Math.cos(viewZenithRadians),
				],
				acceptedOrientation,
			);
			const pixelIndex = column + row * width;
			pixelDirectionIndices[pixelIndex] = directionCount;
			directionStorage.set(direction, directionCount * 3);
			directionCount += 1;
		}
	}

	return Object.freeze({
		id: 'bruneton-paper-figure1-equidistant-dome-256-v1',
		kind: 'equidistant-upper-hemisphere',
		width,
		height,
		pixelCount,
		directionCount,
		directionsLocal: directionStorage.slice(0, directionCount * 3),
		pixelDirectionIndices,
		outsidePixel: Object.freeze([0, 0, 0, 255]),
		orientation: acceptedOrientation,
		contract: Object.freeze({
			pixelCenterX: 'x = (column + 0.5 - 128) / 128',
			pixelCenterY: 'y = (128 - 0.5 - row) / 128',
			outside: 'sqrt(x*x + y*y) >= 1',
			viewZenithRadians: 'sqrt(x*x + y*y) * pi / 2',
			viewAzimuthRadians: 'atan2(x, -y)',
			canonicalDirection: '[sin(zenith)*sin(azimuth), sin(zenith)*cos(azimuth), cos(zenith)]',
		}),
	});
}

/** Create the author-code-exact 1024 by 576 Figure 9 pinhole direction field. */
export function createFigure9PinholeProjection({orientation = PAPER_Z_UP_IDENTITY_ORIENTATION} = {}) {
	const acceptedOrientation = acceptOrientation(orientation);
	const {width, height, horizontalFieldOfViewRadians, verticalFieldOfViewRadians} = FIGURE9_PINHOLE_CONTRACT;
	const halfVerticalFov = verticalFieldOfViewRadians / 2;
	const left = [1, 0, 0];
	const top = [0, -Math.sin(halfVerticalFov), Math.cos(halfVerticalFov)];
	const focalLengthPixels = width / (2 * Math.tan(horizontalFieldOfViewRadians / 2));
	const center = [0, Math.cos(halfVerticalFov) * focalLengthPixels, Math.sin(halfVerticalFov) * focalLengthPixels];
	const pixelCount = width * height;
	const directionsLocal = new Float32Array(pixelCount * 3);

	for (let row = 0; row < height; row += 1) {
		for (let column = 0; column < width; column += 1) {
			const leftOffset = column - width / 2;
			const topOffset = height - 1 - row - height / 2;
			const unnormalized = [
				center[0] + left[0] * leftOffset + top[0] * topOffset,
				center[1] + left[1] * leftOffset + top[1] * topOffset,
				center[2] + left[2] * leftOffset + top[2] * topOffset,
			];
			const length = Math.hypot(...unnormalized);
			const direction = orientDirection(
				[unnormalized[0] / length, unnormalized[1] / length, unnormalized[2] / length],
				acceptedOrientation,
			);
			directionsLocal.set(direction, (column + row * width) * 3);
		}
	}

	return Object.freeze({
		id: 'bruneton-paper-figure9-pinhole-1024x576-hfov90-v1',
		kind: 'pinhole',
		width,
		height,
		pixelCount,
		directionCount: pixelCount,
		directionsLocal,
		pixelDirectionIndices: null,
		outsidePixel: null,
		orientation: acceptedOrientation,
		contract: Object.freeze({
			horizontalFieldOfViewRadians,
			verticalFieldOfViewRadians,
			focalLengthPixels,
			left: Object.freeze(left),
			top: Object.freeze(top),
			center: Object.freeze(center),
			pixelRay: 'normalize(center + left*(column-width/2) + top*(height-1-row-height/2))',
			horizonPlacement: 'lower raster edge',
		}),
	});
}
