import {
	assertUnitValue,
	normalizeUnitValue,
} from './UnitValue.js';
import { requiredString } from '../descriptors/descriptorSupport.js';

/** Identify the supported interpretation of each spectral channel. */
export const SPECTRAL_SAMPLE_SEMANTICS = /** @type {const} */ ({
	BIN_AVERAGE: 'contiguous-wavelength-bin-average',
});

/** Identify the current spectral-basis schema. */
export const SPECTRAL_BASIS_SCHEMA_REVISION = 'algorithm32-spectral-basis-v1';

const CANONICAL_CHANNEL_UNITS = 'nanometers';

/**
 * Compare derived binary64 bin boundaries at machine-scale tolerance.
 *
 * @param {number} left - Supplies the first boundary.
 * @param {number} right - Supplies the second boundary.
 * @returns {boolean} Whether the boundaries agree within tolerance.
 */
function nearlyEqual(left, right) {
	const scale = Math.max(1, Math.abs(left), Math.abs(right));
	return Math.abs(left - right) <= 32 * Number.EPSILON * scale;
}

/**
 * Normalize basis channels into canonical wavelength units.
 *
 * @param {unknown} value - Supplies candidate channels.
 * @returns {readonly SpectralBasisChannel[]} The ordered channels.
 */
export function normalizeSpectralBasisChannels(value) {
	if (!Array.isArray(value) || value.length < 1) {
		throw new TypeError('SpectralBasis.channels must be a non-empty array.');
	}

	const ids = new Set();
	let previousCenter = Number.NEGATIVE_INFINITY;
	let previousUpperBoundary = null;
	const channels = value.map((channel, index) => {
		const label = `SpectralBasis.channels[${index}]`;

		if (channel === null || typeof channel !== 'object' || Array.isArray(channel)) {
			throw new TypeError(`${label} must be an object.`);
		}

		const keys = Object.keys(channel).sort();
		if (keys.length !== 3 || keys[0] !== 'center' || keys[1] !== 'id' || keys[2] !== 'width') {
			throw new TypeError(`${label} must have exactly id, center, and width properties.`);
		}

		const id = requiredString(channel.id, `${label}.id`);
		if (ids.has(id)) {
			throw new RangeError(`SpectralBasis channel id ${id} is duplicated.`);
		}
		ids.add(id);

		assertUnitValue(channel.center, `${label}.center`);
		assertUnitValue(channel.width, `${label}.width`);
		const center = normalizeUnitValue(channel.center, CANONICAL_CHANNEL_UNITS, `${label}.center`);
		const width = normalizeUnitValue(channel.width, CANONICAL_CHANNEL_UNITS, `${label}.width`);

		if (center.value <= 0) {
			throw new RangeError(`${label}.center.value must be greater than zero.`);
		}

		if (width.value <= 0) {
			throw new RangeError(`${label}.width.value must be greater than zero.`);
		}

		if (center.value <= previousCenter) {
			throw new RangeError('SpectralBasis channel centers must be strictly increasing.');
		}

		const lowerBoundary = center.value - width.value / 2;
		const upperBoundary = center.value + width.value / 2;

		if (lowerBoundary <= 0) {
			throw new RangeError('SpectralBasis wavelength bins must remain greater than zero.');
		}

		if (previousUpperBoundary !== null
			&& !nearlyEqual(lowerBoundary, previousUpperBoundary)) {
			throw new RangeError(
				'SpectralBasis channels must describe contiguous, nonoverlapping wavelength bins.',
			);
		}

		previousCenter = center.value;
		previousUpperBoundary = upperBoundary;

		return { id, center, width };
	});

	return channels;
}
