import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/index.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';

function requireCondition(value, message) { if (!value) throw new Error(message); }

/** Thin diagnostic adapter around the unchanged contained Algorithm32 colorer. */
export class CapturedBrunetonColorTransform {
	constructor({ exposure = 1 } = {}) { requireCondition(Number.isFinite(exposure) && exposure > 0, 'Bruneton exposure must be positive.'); this.colorer = new BrunetonColorDisplayModel(); this.exposure = exposure; }
	transformSpectrum(spectrum) {
		requireCondition(spectrum.length === 15 && spectrum.every((value) => Number.isFinite(value) && value >= 0), 'Bruneton capture transform requires one finite nonnegative native-15 spectrum.');
		const radiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: spectrum, provenanceIdentity: 'captured-pre-display-radiance' });
		const signedLinearRec709 = this.colorer.radianceToLinearSrgb(radiance); const exposedLinearRec709 = signedLinearRec709.map((value) => value * this.exposure); const encodedSrgb = this.colorer.linearSrgbToDisplayRgb(exposedLinearRec709);
		return { spectrum: [...spectrum], signedLinearRec709, exposedLinearRec709, linearRec709: encodedSrgb, encodedSrgb, gamutLimited: false, blackLimited: encodedSrgb.every((value) => value === 0), whiteLimited: encodedSrgb.every((value) => value === 1) };
	}
	describe() { return { id: `${this.colorer.id}-exposure-${this.exposure}`, implementation: 'unchanged contained Algorithm32 BrunetonColorDisplayModel public radianceToLinearSrgb and linearSrgbToDisplayRgb operations', ...this.colorer.describeDisplayConversion(), fixedExposure: this.exposure, localBrightnessInput: false, adaptation: false, replacementProjection: false, replacementToneCurve: false, sourceSpecificRules: false }; }
}
