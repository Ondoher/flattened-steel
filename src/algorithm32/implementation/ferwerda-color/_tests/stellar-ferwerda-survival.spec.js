import {STANDARD_STELLAR_MEMBER_DATA} from '../../star-field/consts.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from '../../star-field/StellarPointPresentation.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../../spectral-values/index.js';
import {FerwerdaColorDisplayModel} from '../FerwerdaColorDisplayModel.js';

const PHOTOPIC_RGB_WEIGHTS = [0.2126, 0.7152, 0.0722];
const ADAPTATION_CONTROLS = [5070.201700912994, 3632.4668027619023, 100, 10, 1, 0.1, 0.01, 0.001];

function luminance(rgb) {
	return rgb.reduce((sum, value, index) => sum + value * PHOTOPIC_RGB_WEIGHTS[index], 0);
}

function rank(values) {
	const result = new Array(values.length);
	values
		.map((value, index) => ({value, index}))
		.sort((left, right) => left.value - right.value)
		.forEach((entry, index) => (result[entry.index] = index));
	return result;
}

function rankCorrelation(left, right) {
	const leftRanks = rank(left);
	const rightRanks = rank(right);
	const mean = (left.length - 1) / 2;
	let numerator = 0;
	let leftSquare = 0;
	let rightSquare = 0;
	for (let index = 0; index < left.length; index += 1) {
		const leftDelta = leftRanks[index] - mean;
		const rightDelta = rightRanks[index] - mean;
		numerator += leftDelta * rightDelta;
		leftSquare += leftDelta * leftDelta;
		rightSquare += rightDelta * rightDelta;
	}
	return numerator / Math.sqrt(leftSquare * rightSquare);
}

function createStellarPacket(member, scale = 1) {
	return new SpectralPacket({
		basis: NATIVE_15_SPECTRAL_BASIS,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values: member.values.map(
			(value) =>
				value * STELLAR_ONE_PIXEL_PRESENTATION.calibration.baseIrradianceToBoundaryRadianceScale * scale,
		),
		provenanceIdentity: `stellar-ferwerda-survival:${member.id}:${scale}`,
	});
}

function createModel(adaptationLuminance) {
	return new FerwerdaColorDisplayModel({
		adaptation: {
			kind: 'receiver-local-brightness-proxy',
			luminance: {value: adaptationLuminance, units: 'cd m^-2'},
			provenanceId: `stellar-ferwerda-survival:${adaptationLuminance}`,
		},
	});
}

describe('historical base-scale stellar Ferwerda control', () => {
	it('preserves its pre-CR6C brightness variation and ordering through the complete cone/rod range', () => {
		const packets = STANDARD_STELLAR_MEMBER_DATA.map((member) => createStellarPacket(member));
		const referenceModel = createModel(ADAPTATION_CONTROLS[0]);
		const preColorLuminances = packets.map((packet) =>
			luminance(referenceModel.radianceToLinearSrgb(packet)),
		);
		const uniquePreColorCount = new Set(preColorLuminances).size;
		const meanDisplayLuminances = [];

		for (const adaptationLuminance of ADAPTATION_CONTROLS) {
			const model = createModel(adaptationLuminance);
			const outputs = packets.map((packet) => model.convert({radiance: packet}).channels);
			const displayLuminances = outputs.map(luminance);
			meanDisplayLuminances.push(
				displayLuminances.reduce((sum, value) => sum + value, 0) / displayLuminances.length,
			);

			expect(outputs.every((rgb) => rgb.every((value) => Number.isFinite(value) && value >= 0 && value <= 1))).toBeTrue();
			expect(outputs.filter((rgb) => Math.max(...rgb) === 0).length).toBe(0);
			expect(outputs.filter((rgb) => Math.min(...rgb) === 1).length).toBe(0);
			expect(new Set(displayLuminances).size / uniquePreColorCount).toBeGreaterThan(0.96);
			expect(rankCorrelation(preColorLuminances, displayLuminances)).toBeGreaterThan(0.9999);

			const fixedSpectrumLadder = [0.01, 0.1, 1].map((scale) =>
				luminance(
					model.convert({
						radiance: createStellarPacket(STANDARD_STELLAR_MEMBER_DATA.at(-1), scale),
					}).channels,
				),
			);
			expect(fixedSpectrumLadder[0]).toBeLessThan(fixedSpectrumLadder[1]);
			expect(fixedSpectrumLadder[1]).toBeLessThan(fixedSpectrumLadder[2]);
		}

		for (let index = 1; index < meanDisplayLuminances.length; index += 1) {
			expect(meanDisplayLuminances[index]).toBeGreaterThan(meanDisplayLuminances[index - 1]);
		}
		expect(createModel(ADAPTATION_CONTROLS[0]).parameters.rodBlend).toBe(0);
		expect(createModel(ADAPTATION_CONTROLS.at(-1)).parameters.rodBlend).toBeGreaterThan(0.9999);
	});
});
