import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('distant-Sun construction-domain selections', () => {
	it('retains the Native48/Fibonacci34/W27 production field extents', () => {
		const selection =
			DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

		expect(selection.kind)
			.toBe('distant-sun-construction-domain-selection');
		expect(selection.id)
			.toBe('algorithm32-distant-sun-cpu-native48-w27-v1');
		expect(selection.positionCount).toBe(48);
		expect(selection.incomingDirectionCount).toBe(34);
		expect(selection.outgoingDirectionCount).toBe(4374);
		expect(selection.radiancePacking.id).toBe(
			'algorithm32-distant-sun-fibonacci-34-radiance-packing-v1',
		);
		expect(selection.scatteringDensityPacking.id).toBe(
			'algorithm32-distant-sun-w27-scattering-density-packing-v1',
		);
		expectPacking(
			selection.radiancePacking,
			{ direction: 34, position: 48, wavelength: 15 },
			24480,
		);
		expectPacking(
			selection.scatteringDensityPacking,
			{ direction: 4374, position: 48, wavelength: 15 },
			3149280,
		);
	});

	it('owns the complete Native16/W9 full-field parity extents', () => {
		const selection =
			NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

		expect(selection.positionNodes.map(
			(node) => node.coordinate.value,
		)).toEqual([
			2,
			5625,
			9375,
			13125,
			16875,
			20625,
			24375,
			28125,
			31875,
			35625,
			39375,
			43125,
			46875,
			50625,
			54375,
			58125,
		]);
		expect(selection.outgoingPositiveFaceCenterIndices).toEqual({
			positiveX: 40,
			positiveY: 202,
			positiveZ: 364,
		});
		expectPacking(
			selection.radiancePacking,
			{ direction: 34, position: 16, wavelength: 15 },
			8160,
		);
		expectPacking(
			selection.scatteringDensityPacking,
			{ direction: 486, position: 16, wavelength: 15 },
			116640,
		);
	});

	it('owns the complete Native4/W3 explicit-zero parity extents', () => {
		const selection =
			NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

		expect(selection.positionNodes.map(
			(node) => node.coordinate.value,
		)).toEqual([2, 22500, 37500, 52500]);
		expect(selection.outgoingPositiveFaceCenterIndices).toEqual({
			positiveX: 4,
			positiveY: 22,
			positiveZ: 40,
		});
		expectPacking(
			selection.radiancePacking,
			{ direction: 34, position: 4, wavelength: 15 },
			2040,
		);
		expectPacking(
			selection.scatteringDensityPacking,
			{ direction: 54, position: 4, wavelength: 15 },
			3240,
		);
	});

	it('keeps executable facts coherent with selected metadata and lookup', () => {
		for (const selection of [
			DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
		]) {
			expect(selection.positionDomain.count).toBe(selection.positionCount);
			expect(selection.incomingDirectionDomain.count)
				.toBe(selection.incomingDirectionCount);
			expect(selection.outgoingDirectionDomain.count)
				.toBe(selection.outgoingDirectionCount);
			expect(selection.incomingIntegrationWeights.values)
				.toHaveSize(selection.incomingDirectionCount);
			expect(selection.resolveOutgoingDirectionStencil([1, 0, 0]))
				.toEqual({
					indices: [
						selection.outgoingPositiveFaceCenterIndices.positiveX,
					],
					weights: [1],
				});
		}
	});
});

function expectPacking(packing, shape, scalarCount) {
	expect(packing.layout.shape).toEqual(shape);
	expect(packing.scalarCount).toBe(scalarCount);
	expect(packing.layout.storage).toEqual({
		value: scalarCount * Float64Array.BYTES_PER_ELEMENT,
		units: 'bytes',
	});
}
