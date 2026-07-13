import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';
import DistantSunConstructionDomainSelection from '../DistantSunConstructionDomainSelection.js';
import {SpectralBasis, SPECTRAL_SAMPLE_SEMANTICS} from '../../../../spectral-values/index.js';

describe('distant-Sun construction-domain selections', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains the Native48/reflection-completed-Fibonacci68/W27 production field extents', /** Called by Jasmine to exercise the named behavior. */ () => {
		const selection = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

		expect(selection.kind).toBe('distant-sun-construction-domain-selection');
		expect(selection.id).toBe('algorithm32-distant-sun-cpu-native48-w27-v1');
		expect(selection.positionCount).toBe(48);
		expect(selection.incomingDirectionCount).toBe(68);
		expect(selection.outgoingDirectionCount).toBe(4374);
		expect(selection.radiancePacking.id).toBe(
			'algorithm32-distant-sun-reflection-completed-fibonacci-68-radiance-packing-v1',
		);
		expect(selection.scatteringDensityPacking.id).toBe('algorithm32-distant-sun-w27-scattering-density-packing-v1');
		expectPacking(selection.radiancePacking, {direction: 68, position: 48, wavelength: 15}, 48960);
		expectPacking(selection.scatteringDensityPacking, {direction: 4374, position: 48, wavelength: 15}, 3149280);
	});

	it('owns the complete Native16/W9 full-field parity extents', /** Called by Jasmine to exercise the named behavior. */ () => {
		const selection = NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

		expect(
			selection.positionNodes.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param node - The node value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (node) => node.coordinate.value,
			),
		).toEqual([
			0, 5625, 9375, 13125, 16875, 20625, 24375, 28125, 31875, 35625, 39375, 43125, 46875, 50625, 54375, 58125,
		]);
		expect(selection.outgoingPositiveFaceCenterIndices).toEqual({
			positiveX: 40,
			positiveY: 202,
			positiveZ: 364,
		});
		expectPacking(selection.radiancePacking, {direction: 68, position: 16, wavelength: 15}, 16320);
		expectPacking(selection.scatteringDensityPacking, {direction: 486, position: 16, wavelength: 15}, 116640);
	});

	it('owns the complete Native4/W3 explicit-zero parity extents', /** Called by Jasmine to exercise the named behavior. */ () => {
		const selection = NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;

		expect(
			selection.positionNodes.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param node - The node value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (node) => node.coordinate.value,
			),
		).toEqual([0, 22500, 37500, 52500]);
		expect(selection.outgoingPositiveFaceCenterIndices).toEqual({
			positiveX: 4,
			positiveY: 22,
			positiveZ: 40,
		});
		expectPacking(selection.radiancePacking, {direction: 68, position: 4, wavelength: 15}, 4080);
		expectPacking(selection.scatteringDensityPacking, {direction: 54, position: 4, wavelength: 15}, 3240);
	});

	it('keeps executable owners coherent with selected facts and lookup', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const selection of [
			DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
			NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
		]) {
			expect(selection.positionDomain.count).toBe(selection.positionCount);
			expect(selection.incomingDirectionDomain.directionCount).toBe(selection.incomingDirectionCount);
			expect(selection.outgoingDirectionDomain.directionCount).toBe(selection.outgoingDirectionCount);
			expect(selection.incomingIntegrationWeights.values).toHaveSize(selection.incomingDirectionCount);
			expect(selection.resolveOutgoingDirectionStencil([1, 0, 0])).toEqual({
				indices: [selection.outgoingPositiveFaceCenterIndices.positiveX],
				weights: [1],
			});
		}
	});

	it('constructs a direct-40 profile adapter with exact packing round trips', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = new SpectralBasis({
			id: 'test-direct-40-basis',
			semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
			channels: Array.from({length: 40}, (_unused, index) => ({
				id: `sample-${index}`,
				center: {value: 360 + index * 10, units: 'nanometers'},
				width: {value: 10, units: 'nanometers'},
			})),
		});
		const native = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
		const profile = /** @type {Algorithm32ExecutionProfile} */ (
			/** @type {unknown} */ ({
				id: 'test-direct-40-profile',
				spectral: {basis},
				domains: {
					positions: native.positionDomain,
					incomingDirections: native.incomingDirectionDomain,
					outgoingDirections: native.outgoingDirectionDomain,
				},
			})
		);
		const selection = DistantSunConstructionDomainSelection.fromProfile(profile);
		const coordinates = {
			directionIndex: selection.outgoingDirectionCount - 1,
			positionIndex: selection.positionCount - 1,
			wavelengthIndex: 39,
		};
		const offset = selection.scatteringDensityPacking.offset(coordinates);

		expect(selection.spectralBasis).toBe(basis);
		expect(selection.spectralChannelCount).toBe(40);
		expect(selection.radiancePacking.wavelengthCount).toBe(40);
		expect(selection.scatteringDensityPacking.wavelengthCount).toBe(40);
		expect(selection.scatteringDensityPacking.coordinatesAt(offset)).toEqual(coordinates);
	});
});

/**
 * Called by this module to expect packing.
 * @param packing - The packing value accepted by the operation.
 * @param shape - The shape value accepted by the operation.
 * @param scalarCount - The scalar count value accepted by the operation.
 */
function expectPacking(packing, shape, scalarCount) {
	expect(packing.directionCount).toBe(shape.direction);
	expect(packing.positionCount).toBe(shape.position);
	expect(packing.wavelengthCount).toBe(shape.wavelength);
	expect(packing.scalarCount).toBe(scalarCount);
}
