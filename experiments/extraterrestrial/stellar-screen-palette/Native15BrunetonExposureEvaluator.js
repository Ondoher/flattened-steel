const DISPLAY_TONE_MAP_K = 1 / (5 * 683);

const LINEAR_SRGB_WEIGHTS = [
	[14.749358550069186, -12.461809444307793, 87.0946400969207],
	[526.2783136675116, -458.55532519841455, 3237.2612774897575],
	[4860.670464118019, -4772.7836927559265, 39151.920333292415],
	[-3060.0889637085575, 630.8578131011398, 29358.021601771536],
	[-13632.173462494251, 13736.143434391024, 4381.701642849098],
	[-16218.356823408865, 31693.381438654007, -2831.7761080281125],
	[13090.311666839618, 25900.771554214934, -3445.8601281741517],
	[50412.333624759995, 5985.729871526668, -1751.5249369399994],
	[40037.66348377322, -2711.74301170623, -470.97288279674353],
	[10784.85206753291, -1100.5301263483966, -80.95993013896909],
	[1404.8097211248464, -151.91580336427623, -9.471889119435332],
	[162.89272907807108, -17.68227705091523, -1.089886496392673],
	[17.002541340620876, -1.8456545849604458, -0.1137609522231646],
	[1.938132985276144, -0.21038756748325607, -0.012967705204170663],
	[0.21580616718156756, -0.02342611824797461, -0.0014439210507229407],
];

const luminance = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

/** Exact contained CPU counterpart of the native-15 Bruneton exposure shader. */
export class Native15BrunetonExposureEvaluator {
	/** Project one native-15 spectrum to Bruneton's linear sRGB. */
	project(spectrum) {
		if (!spectrum || spectrum.length !== 15) throw new TypeError('A native-15 spectrum is required.');
		const rgb = [0, 0, 0];
		for (let channel = 0; channel < 15; channel += 1) {
			for (let output = 0; output < 3; output += 1) rgb[output] += spectrum[channel] * LINEAR_SRGB_WEIGHTS[channel][output];
		}
		return rgb;
	}

	/** Apply one global exposure inside the unchanged Figure-1 exponential. */
	map(linearRgb, exposure) {
		if (!Number.isFinite(exposure) || exposure <= 0) throw new RangeError('Exposure must be positive and finite.');
		return linearRgb.map((value) => 1 - Math.exp(-Math.max(0, value) * DISPLAY_TONE_MAP_K * exposure));
	}

	/** Quantize mapped display channels to the ordinary eight-bit output boundary. */
	quantize(mappedRgb) {
		return mappedRgb.map((value) => Math.max(0, Math.min(255, Math.round(value * 255))));
	}

	/** Evaluate one spectrum completely. */
	evaluate(spectrum, exposure) {
		const linearRgb = this.project(spectrum);
		const mappedRgb = this.map(linearRgb, exposure);
		const byteRgb = this.quantize(mappedRgb);
		return {linearRgb, linearLuminance: luminance(linearRgb.map((value) => Math.max(0, value))), mappedRgb, mappedLuminance: luminance(mappedRgb), byteRgb, byteLuminance: luminance(byteRgb)};
	}
}

export const NATIVE15_BRUNETON_EXPOSURE_CONTRACT = {
	id: 'native15-bruneton-global-exposure-evaluator-v1',
	toneMapK: DISPLAY_TONE_MAP_K,
	operation: 'display = 1 - exp(-max(linear-srgb, 0) * toneMapK * globalExposure)',
};
