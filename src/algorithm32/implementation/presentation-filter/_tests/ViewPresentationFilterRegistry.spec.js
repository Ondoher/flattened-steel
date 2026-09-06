import {
	HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS,
	ViewPresentationFilterRegistry,
	humanLowLightChromaRetention,
	humanMesopicRodWeight,
} from '../ViewPresentationFilterRegistry.js';

const MESOPIC = {
	id: 'human-mesopic-luminance-v1',
	stage: 'source-linear',
	target: 'stellar',
	enabled: true,
	parameters: {maximumRodContribution: 0.5},
};
const CHROMA = {
	id: 'human-low-light-chroma-v1',
	stage: 'source-linear',
	target: 'stellar',
	enabled: true,
	parameters: {maximumChromaRetention: 0.65},
};
const SYNTHETIC_SCOTOPIC_WEIGHTS = Object.freeze([0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

function luminance(rgb) {
	return rgb.reduce((sum, value, index) => sum + value * HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS[index], 0);
}

describe('view-presentation filter registry', () => {
	it('keeps empty, disabled, and nonstellar paths as exact object identity', () => {
		const rgb = Object.freeze([-0.25, 1.5, 3]);
		expect(new ViewPresentationFilterRegistry().applySourceLinear(rgb, {target: 'stellar'})).toBe(rgb);
		expect(
			new ViewPresentationFilterRegistry([{...CHROMA, enabled: false}]).applySourceLinear(rgb, {
				target: 'stellar',
			}),
		).toBe(rgb);
		expect(new ViewPresentationFilterRegistry([CHROMA]).applySourceLinear(rgb, {target: 'sky'})).toBe(rgb);
	});

	it('enforces registration, selected parameters, uniqueness, stage, target, and order', () => {
		expect(() => new ViewPresentationFilterRegistry([CHROMA, MESOPIC])).toThrowError(/must precede/);
		expect(() => new ViewPresentationFilterRegistry([CHROMA, CHROMA])).toThrowError(/unique/);
		expect(() => new ViewPresentationFilterRegistry([{...CHROMA, stage: 'display-output'}])).toThrowError(
			/unimplemented stage/,
		);
		expect(() => new ViewPresentationFilterRegistry([{...CHROMA, target: 'solar'}])).toThrowError(
			/unimplemented target/,
		);
		expect(
			() => new ViewPresentationFilterRegistry([{...CHROMA, parameters: {maximumChromaRetention: 0.4}}]),
		).toThrowError(/must equal 0.65/);
	});

	it('assigns deterministic order and a configuration-sensitive identity', () => {
		const full = new ViewPresentationFilterRegistry([MESOPIC, CHROMA]);
		const equivalent = new ViewPresentationFilterRegistry([MESOPIC, CHROMA]);
		const chromaOnly = new ViewPresentationFilterRegistry([{...MESOPIC, enabled: false}, CHROMA]);

		expect(full.filters.map(({order}) => order)).toEqual([0, 1]);
		expect(full.identity).toBe(equivalent.identity);
		expect(full.identity).not.toBe(chromaOnly.identity);
		expect(full.identity).toMatch(/^sha256:[0-9a-f]{64}$/);
	});

	it('reproduces the selected logarithmic mesopic response and luminance blend', () => {
		expect(humanMesopicRodWeight(5)).toBe(0);
		expect(humanMesopicRodWeight(0.005)).toBe(0.5);
		const registry = new ViewPresentationFilterRegistry([MESOPIC], {
			scotopicLuminanceWeights: SYNTHETIC_SCOTOPIC_WEIGHTS,
		});
		const source = [1, 1, 1];
		const transportedNative15 = new Array(15).fill(0);
		transportedNative15[4] = 1;
		const result = registry.applySourceLinear(source, {
			target: 'stellar',
			transportedNative15,
			adaptationLuminanceCdM2: 0.005,
		});

		expect(luminance(result)).toBeCloseTo(1.5, 12);
		expect(result).toEqual([1.5, 1.5, 1.5]);
	});

	it('preserves luminance while reducing chroma with no signed-component clamp', () => {
		const registry = new ViewPresentationFilterRegistry([CHROMA]);
		const source = [-10, 3, 5];
		const result = registry.applySourceLinear(source, {target: 'stellar', visualMagnitude: 1.6});

		expect(humanLowLightChromaRetention(3.2)).toBe(0);
		expect(humanLowLightChromaRetention(0)).toBe(0.65);
		expect(luminance(result)).toBeCloseTo(luminance(source), 14);
		expect(result[0]).toBeLessThan(0);
	});

	it('applies the selected full chain in declared mesopic-then-chroma order', () => {
		const transportedNative15 = new Array(15).fill(0);
		transportedNative15[4] = 1;
		const metadata = {
			target: 'stellar',
			visualMagnitude: 1.6,
			transportedNative15,
			adaptationLuminanceCdM2: 0.005,
		};
		const source = [1, 1, 1];
		const mesopic = new ViewPresentationFilterRegistry([MESOPIC], {
			scotopicLuminanceWeights: SYNTHETIC_SCOTOPIC_WEIGHTS,
		}).applySourceLinear(source, metadata);
		const expected = new ViewPresentationFilterRegistry([CHROMA]).applySourceLinear(mesopic, metadata);
		const actual = new ViewPresentationFilterRegistry([MESOPIC, CHROMA], {
			scotopicLuminanceWeights: SYNTHETIC_SCOTOPIC_WEIGHTS,
		}).applySourceLinear(source, metadata);

		expect(actual).toEqual(expected);
	});

	it('emits only the selected source-linear stellar hooks without a clamp', () => {
		const physical = new ViewPresentationFilterRegistry().createStellarSourceLinearShaderHook();
		const full = new ViewPresentationFilterRegistry([MESOPIC, CHROMA], {
			scotopicLuminanceWeights: SYNTHETIC_SCOTOPIC_WEIGHTS,
		}).createStellarSourceLinearShaderHook();

		expect(physical.stage).toBe('source-linear');
		expect(physical.target).toBe('stellar');
		expect(physical.source).not.toContain('rodWeight');
		expect(physical.source).not.toContain('magnitudeT');
		expect(full.source).toContain('rodWeight');
		expect(full.source).toContain('magnitudeT');
		expect(full.source).not.toContain('clamp(filteredRgb');
		const contribution = new ViewPresentationFilterRegistry([MESOPIC, CHROMA], {
			scotopicLuminanceWeights: SYNTHETIC_SCOTOPIC_WEIGHTS,
		}).createShaderContribution();
		expect(contribution.provides).toEqual(['presentation.applyStellarSourceLinear']);
		expect(contribution.uniforms[0]).toEqual(
			jasmine.objectContaining({
				name: 'uStellarAdaptationLuminanceCdM2',
				valueKey: 'presentation.stellar.adaptationLuminanceCdM2',
			}),
		);
		expect(contribution.functions[0].code).toContain('applyStellarSourceLinearPresentationFilters');
		expect(() => new ViewPresentationFilterRegistry().createShaderContribution()).toThrowError(
			/Disabled presentation filters/,
		);
	});

	it('fails closed when mesopic execution lacks its local authenticated weights', () => {
		const registry = new ViewPresentationFilterRegistry([MESOPIC]);
		expect(() => registry.createStellarSourceLinearShaderHook()).toThrowError(/authenticated local/);
		expect(() =>
			registry.applySourceLinear([1, 1, 1], {
				target: 'stellar',
				transportedNative15: new Array(15).fill(1),
				adaptationLuminanceCdM2: 0.005,
			}),
		).toThrowError(/authenticated local/);
	});
});
