import {diskRadius, clearance, interval, capHeight} from './geometry.mjs';
import {medium, cases} from './physical.mjs';
import {weights, color} from './color.mjs';

/**
 * Freezes framing and spectral ground normalization before viewing any image.
 *
 * @returns {Record<string, unknown>} - Complete physical and display settings.
 */
export function sceneSettings() {
	const latitude = -79.76667;
	const longitude = -82.86667;
	const radius = (diskRadius * (90 - latitude)) / 180;
	const origin = [radius, 0, 5000];
	const longitudeRadians = (longitude * Math.PI) / 180;
	const desiredY = ((96 / 255 + 0.055) / 1.055) ** 2.4;
	const groundShape = medium.wavelengths.map(
		(wavelength, channel) =>
			medium.sourceIrradiance[channel] * (0.08 + 0.92 * Math.exp(-0.5 * ((wavelength - 550) / 35) ** 2)),
	);
	const sourceY = color(groundShape).xyz[1];
	const groundScalar = desiredY / (0.06 * sourceY);
	const groundSpectrum = groundShape.map((value) => value * groundScalar);
	return {
		locationName: 'Union Glacier Camp',
		origin,
		latitude,
		longitude,
		mapOrigin: [radius * Math.sin(longitudeRadians), radius * Math.cos(longitudeRadians), origin[2]],
		mapSourcePosition: [
			(diskRadius / 2) * Math.sin(longitudeRadians),
			(diskRadius / 2) * Math.cos(longitudeRadians),
			4828032,
		],
		frameDerivation:
			'AEQD radius = R * (90 - latitudeDegrees) / 180. Map axes [r*sin(longitude), r*cos(longitude), z]. Rotate observer, source and rays together by longitudeDegrees - 90 into the canonical source-positive-X cache frame; inverse rotation is 90 - longitudeDegrees. Fixed cap and disk are invariant under this rotation.',
		degreesFromClosest: 0,
		sunElevationDegrees: (Math.atan2(4828032 - origin[2], radius - diskRadius / 2) * 180) / Math.PI,
		viewBearings: {towardSun: 0, awayFromSun: 180},
		diskRadius,
		distanceInside: diskRadius - radius,
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
			'S_i = sourceShape_i * (0.08 + 0.92 * exp(-0.5 * ((wavelengthNm_i - 550) / 35)^2)); G_i = S_i * inverseSRGB(96/255) / (exposure * CIE_Y(S)). Green diagnostic endpoint, preserving prior gray96 luminance. G has authored spectral radiance units W m^-2 sr^-1 nm^-1, not physical surface albedo. Compose spectrally before display; no ground feedback into cache.',
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
