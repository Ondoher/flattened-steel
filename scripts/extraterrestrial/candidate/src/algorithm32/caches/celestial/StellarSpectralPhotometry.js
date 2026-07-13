import { NATIVE_15_SPECTRAL_BASIS } from '../../profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../../quantities/index.js';

const SPEED_OF_LIGHT_METERS_PER_SECOND = 299792458;
const CLASS_ORDER = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

function finite(value, label) { if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite.`); return value; }
function fingerprint(value) { let hash = 0xcbf29ce484222325n; for (const character of JSON.stringify(value)) { hash ^= BigInt(character.codePointAt(0)); hash = BigInt.asUintN(64, hash * 0x100000001b3n); } return `fnv1a64-canonical-json-v1:${hash.toString(16).padStart(16, '0')}`; }
function interpolate(wavelengths, values, wavelength) {
	if (wavelength < wavelengths[0] || wavelength > wavelengths[wavelengths.length - 1]) throw new RangeError('Spectral input does not cover required wavelength.');
	let upper = 1; while (upper < wavelengths.length && wavelengths[upper] < wavelength) upper += 1;
	if (upper === wavelengths.length) return values.at(-1);
	const lower = upper - 1; const ratio = (wavelength - wavelengths[lower]) / (wavelengths[upper] - wavelengths[lower]);
	return values[lower] * (1 - ratio) + values[upper] * ratio;
}
function knotsInRange(wavelengths, lower, upper) { return [lower, ...wavelengths.filter((value) => value > lower && value < upper), upper]; }
function binAverage(template, lower, upper) {
	const knots = knotsInRange(template.wavelengthNanometers, lower, upper); let integral = 0;
	for (let index = 1; index < knots.length; index += 1) { const a = knots[index - 1]; const b = knots[index]; integral += (interpolate(template.wavelengthNanometers, template.normalizedFlux, a) + interpolate(template.wavelengthNanometers, template.normalizedFlux, b)) * (b - a) / 2; }
	return integral / (upper - lower);
}
function filterValue(filter, wavelength) { return interpolate(filter.wavelengthNanometers, filter.transmission, wavelength); }
function weightedMeanBins(channels, values, filter) {
	let weighted = 0; let weight = 0;
	for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
		const channel = channels[channelIndex]; const lower = channel.center.value - channel.width.value / 2; const upper = channel.center.value + channel.width.value / 2;
		for (let filterIndex = 1; filterIndex < filter.wavelengthNanometers.length; filterIndex += 1) {
			const a = Math.max(lower, filter.wavelengthNanometers[filterIndex - 1]); const b = Math.min(upper, filter.wavelengthNanometers[filterIndex]);
			if (b <= a) continue;
			const responseIntegral = (filterValue(filter, a) + filterValue(filter, b)) * (b - a) / 2;
			weighted += values[channelIndex] * responseIntegral; weight += responseIntegral;
		}
	}
	if (!(weighted > 0 && weight > 0)) throw new RangeError('Native spectral bins have no positive filter response.');
	return weighted / weight;
}
function luminosityClass(type) { return /(III|II|IV|V|I)/i.exec(type)?.[1].toUpperCase() ?? null; }
function spectralClass(type) { return /([OBAFGKM])\s*(\d(?:\.\d)?)/i.exec(type); }
function zeroPointFluxDensity(filter) { const wavelengthMeters = filter.pivotWavelengthNanometers * 1e-9; return filter.zeroPointJy * 1e-26 * SPEED_OF_LIGHT_METERS_PER_SECOND / (wavelengthMeters * wavelengthMeters) * 1e-9; }
function bToVRatio(metric) { return metric.binnedB / metric.binnedV; }
function bracket(metrics, targetRatio) {
	const lower = metrics.filter((metric) => bToVRatio(metric) <= targetRatio).sort((left, right) => bToVRatio(left) - bToVRatio(right)).at(-1);
	const upper = metrics.filter((metric) => bToVRatio(metric) >= targetRatio).sort((left, right) => bToVRatio(left) - bToVRatio(right))[0];
	if (!lower || !upper) return null;
	const lowerRatio = bToVRatio(lower); const upperRatio = bToVRatio(upper);
	return Object.freeze({ lower, upper, fraction: upperRatio === lowerRatio ? 0 : (targetRatio - lowerRatio) / (upperRatio - lowerRatio) });
}

/** Materialize catalog apparent flux into native-15 top-of-atmosphere packets. */
export class StellarSpectralPhotometry {
	constructor({ templates, johnsonB, johnsonV, inputIdentity, spectralBasis = NATIVE_15_SPECTRAL_BASIS }) {
		if (!Array.isArray(templates) || templates.length < 1) throw new TypeError('Stellar photometry requires templates.');
		if (!johnsonB?.id?.includes('Johnson.B') || !johnsonV?.id?.includes('Johnson.V')) throw new TypeError('Stellar photometry requires SVO Johnson B and V filters.');
		if (!inputIdentity || typeof inputIdentity !== 'object') throw new TypeError('Stellar photometry requires input identity.');
		this.templates = Object.freeze([...templates]); this.johnsonB = johnsonB; this.johnsonV = johnsonV; this.spectralBasis = spectralBasis;
		this.templateMetrics = Object.freeze(this.templates.map((template) => {
			const binnedValues = spectralBasis.channels.map((channel) => binAverage(template, channel.center.value - channel.width.value / 2, channel.center.value + channel.width.value / 2));
			return Object.freeze({ template, binnedValues: Object.freeze(binnedValues), binnedB: weightedMeanBins(spectralBasis.channels, binnedValues, johnsonB), binnedV: weightedMeanBins(spectralBasis.channels, binnedValues, johnsonV) });
		}));
		this.inputIdentity = Object.freeze({ ...inputIdentity, spectralBasisHash: spectralBasis.contentHash, policy: 'pickles-bracketed-bv-johnson-bv-vega-v2' });
		this.identity = fingerprint(this.inputIdentity);
	}

	describeStaticIdentity() { return Object.freeze({ kind: 'stellar-spectral-photometry', identity: this.identity, ...this.inputIdentity }); }

	_selectBracket(member) {
		const parsed = spectralClass(member.spectralType);
		const [ , letter = null, subtypeText = null ] = parsed ?? [];
		void subtypeText;
		const desiredLuminosity = luminosityClass(member.spectralType);
		const targetRatio = zeroPointFluxDensity(this.johnsonB) / zeroPointFluxDensity(this.johnsonV) * 10 ** (-0.4 * member.bMinusV);
		const spectralCandidates = letter === null ? [] : this.templateMetrics.filter((metric) => metric.template.spectralClass === letter.toUpperCase());
		const luminosityCandidates = desiredLuminosity ? spectralCandidates.filter((metric) => metric.template.luminosityClass === desiredLuminosity) : [];
		const groups = [
			{ candidates: luminosityCandidates, selection: 'spectral-type-luminosity-bv-bracket' },
			{ candidates: spectralCandidates, selection: 'spectral-type-bv-bracket' },
			{ candidates: this.templateMetrics, selection: 'global-bv-bracket-fallback' },
		];
		for (const group of groups) {
			const selected = bracket(group.candidates, targetRatio);
			if (selected) return Object.freeze({ ...selected, selection: group.selection, targetRatio });
		}
		throw new RangeError(`No Pickles templates bracket B-V for ${member.memberId}.`);
	}

	materialize(members) {
		if (!Array.isArray(members) || members.length !== 500) throw new RangeError('Stellar photometry requires the fixed 500-member roster.');
		const vZero = zeroPointFluxDensity(this.johnsonV);
		return members.map((member) => {
			finite(member.visualMagnitude, 'Stellar V magnitude'); finite(member.bMinusV, 'Stellar B-V');
			const choice = this._selectBracket(member);
			const normalizedValues = choice.lower.binnedValues.map((value, index) => ((1 - choice.fraction) * value / choice.lower.binnedV) + (choice.fraction * choice.upper.binnedValues[index] / choice.upper.binnedV));
			const scale = vZero * 10 ** (-0.4 * member.visualMagnitude);
			const values = normalizedValues.map((value) => value * scale);
			if (values.some((value) => !(value >= 0) || !Number.isFinite(value))) throw new RangeError(`Invalid materialized stellar packet: ${member.memberId}`);
			const templateId = choice.lower.template.id === choice.upper.template.id ? choice.lower.template.id : `${choice.lower.template.id}+${choice.upper.template.id}`;
			const sourceIrradiance = createSpectralPacket({ basis: this.spectralBasis, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values, provenanceIdentity: `stellar-photometry:${this.identity}:${member.memberId}:${templateId}` });
			return Object.freeze({ memberId: member.memberId, sourceIrradiance, templateId, templateSelection: choice.selection, templateBlendFraction: choice.fraction });
		});
	}
}

export default StellarSpectralPhotometry;
