import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../controls/production-v1/src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	SpectralPacket,
} from '../controls/production-v1/src/algorithm32/spectral-values/index.js';

/** Stable identity for the unchanged production-v1 Bruneton E8 projection. */
export const CR3_NATIVE15_LINEAR_PROJECTION_ID =
	'color-reset-cr3-production-v1-bruneton-e8-native15-linear-v1';

/** Exact accepted Native15 basis identity used by CR2 and CR3. */
export const CR3_PRESENTATION_NATIVE15_BASIS_HASH = NATIVE_15_SPECTRAL_BASIS.contentHash;

const CHANNEL_COUNT = NATIVE_15_SPECTRAL_BASIS.channelCount;
const COLOR_MODEL = new BrunetonColorDisplayModel();

function requireFiniteVector(values, count, label) {
	if ((!Array.isArray(values) && !ArrayBuffer.isView(values)) || values.length !== count) {
		throw new RangeError(`${label} must contain exactly ${count} values.`);
	}
	const copy = Array.from(values);
	if (!copy.every(Number.isFinite)) throw new TypeError(`${label} values must be finite.`);
	return copy;
}

function radiancePacket(values, provenanceIdentity) {
	return /** @type {SpectralRadiancePacket} */ (new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
		values,
		provenanceIdentity,
	}));
}

function buildProjectionWeights() {
	const red = [];
	const green = [];
	const blue = [];
	for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
		const values = new Array(CHANNEL_COUNT).fill(0);
		values[channelIndex] = 1;
		const projected = COLOR_MODEL.radianceToLinearSrgb(radiancePacket(
			values,
			`${CR3_NATIVE15_LINEAR_PROJECTION_ID}:basis-vector-${channelIndex}`,
		));
		red.push(projected[0]);
		green.push(projected[1]);
		blue.push(projected[2]);
	}
	return Object.freeze({
		id: CR3_NATIVE15_LINEAR_PROJECTION_ID,
		basisHash: CR3_PRESENTATION_NATIVE15_BASIS_HASH,
		red: Object.freeze(red),
		green: Object.freeze(green),
		blue: Object.freeze(blue),
	});
}

/** Fixed production-v1 E8 rows. Wavelength-bin widths are already included. */
export const CR3_NATIVE15_LINEAR_SRGB_WEIGHTS = buildProjectionWeights();

/** Project a finite Native15 spectral-radiance vector through unchanged E8. */
export function projectCr3Native15ValuesToLinearSrgb(values) {
	const checked = requireFiniteVector(values, CHANNEL_COUNT, 'CR3 Native15 presentation input');
	let red = 0;
	let green = 0;
	let blue = 0;
	for (let channelIndex = 0; channelIndex < CHANNEL_COUNT; channelIndex += 1) {
		const value = checked[channelIndex];
		red += value * CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.red[channelIndex];
		green += value * CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.green[channelIndex];
		blue += value * CR3_NATIVE15_LINEAR_SRGB_WEIGHTS.blue[channelIndex];
	}
	return Object.freeze([red, green, blue]);
}

/** The exact unchanged Bruneton model used only after physical surface response. */
export function createCr3NeutralSurfaceColorModel() {
	return new BrunetonColorDisplayModel();
}

export const CR3_NEUTRAL_SURFACE_PRESENTATION_CONTRACT = Object.freeze({
	schemaId: 'algorithm32-color-reset-cr3-neutral-surface-presentation-v1',
	colorId: COLOR_MODEL.id,
	projectionId: CR3_NATIVE15_LINEAR_PROJECTION_ID,
	basisHash: CR3_PRESENTATION_NATIVE15_BASIS_HASH,
	channelCount: CHANNEL_COUNT,
	inputQuantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
	inputUnits: SPECTRAL_UNITS.RADIANCE_DENSITY,
	operation: 'unchanged production-v1 Bruneton E8 Native15 projection followed by unchanged Figure 1 display mapping',
});
