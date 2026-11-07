import {diskRadius, clearance, interval, capHeight} from './geometry.mjs';
import {medium, cases} from './physical.mjs';
import {weights, color} from './color.mjs';

/**
 * Freezes framing and spectral ground normalization before viewing any image.
 *
 * @returns {Record<string, unknown>} - Complete physical and display settings.
 */
export function sceneSettings() {
	const origin = [diskRadius - 5000, 0, 20];
	const desiredY = ((96 / 255 + 0.055) / 1.055) ** 2.4;
	const sourceY = color(medium.sourceIrradiance).xyz[1];
	const groundScalar = desiredY / (0.06 * sourceY);
	const groundSpectrum = medium.sourceIrradiance.map((value) => value * groundScalar);
	return {
		origin,
		latitude: 90 - (180 * origin[0]) / diskRadius,
		longitude: 90,
		diskRadius,
		distanceInside: 5000,
		eyeHeight: origin[2],
		localCapHeight: capHeight(origin[0]),
		capClearance: clearance(origin),
		sourcePosition: [diskRadius / 2, 0, 4828032],
		sourceRadius: diskRadius / 2,
		horizontalFov: 90,
		pitch: 0,
		finalWidth: 1280,
		finalHeight: 720,
		exposure: 0.06,
		cacheCount: 12,
		groundScalar,
		groundSpectrum,
		groundColor: color(groundSpectrum),
		colorWeights: weights,
		groundDerivation:
			'G_i = sourceShape_i * inverseSRGB(96/255) / (exposure * CIE_Y(sourceShape)). G has authored spectral radiance units W m^-2 sr^-1 nm^-1, not physical surface albedo. Compose spectrally before display; no ground feedback into cache.',
	};
}

/**
 * Defines a physical ray at one exact full-frame bottom-origin pixel center.
 *
 * @param {number[]} origin - Physical camera origin.
 * @param {number} sign - Outward +1 or inward -1.
 * @param {number} x - Bottom-origin pixel column.
 * @param {number} y - Bottom-origin pixel row.
 * @param {number} [width] - Full-frame width.
 * @param {number} [height] - Full-frame height.
 * @returns {DomeCase} - Independent binary64 camera and atmosphere interval.
 */
export function pixelCase(origin, sign, x, y, width = 1280, height = 720) {
	const nx = (2 * (x + 0.5)) / width - 1;
	const ny = (2 * (y + 0.5)) / height - 1;
	const vector = [sign, -sign * nx, (ny * height) / width];
	const length = Math.hypot(...vector);
	const direction = vector.map((v) => v / length);
	const bounds = interval(origin, direction);
	return {
		id: `${sign === 1 ? 'outward' : 'inward'}-x${x}-y${y}`,
		sourceRadius: diskRadius / 2,
		altitude: origin[2],
		fraction: clearance(origin) / (100000 - origin[2]),
		distance: clearance(origin),
		origin,
		direction,
		entry: bounds.entry,
		end: bounds.exit,
		view: sign === 1 ? 'outward' : 'inward',
	};
}

/**
 * Supplies existing benchmark comparisons plus new ground/rim pixel cases.
 *
 * @param {number[]} origin - Current camera location.
 * @returns {DomeCase[]} - Frozen parity cases independent of cache node positions.
 */
export function sceneQueries(origin) {
	const pixels = [
		[640, 360],
		[640, 354],
		[640, 350],
		[640, 400],
		[100, 400],
		[1179, 400],
		[640, 700],
		[640, 10],
	];
	return [...cases(true), ...[1, -1].flatMap((sign) => pixels.map(([x, y]) => pixelCase(origin, sign, x, y)))];
}
