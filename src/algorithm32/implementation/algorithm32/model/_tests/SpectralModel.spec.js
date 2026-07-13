import {SpectralBasis} from '../../../../spectral-values/index.js';
import {SpectralModel} from '../SpectralModel.js';

/**
 * Called by this module to create an equally spaced test spectral basis.
 *
 * @param {string} id - Supplies the basis identity.
 * @param {readonly number[]} centers - Supplies channel centers in nanometers.
 * @param {number} width - Supplies the contiguous channel width in nanometers.
 * @returns {SpectralBasis} - The validated spectral basis.
 */
function spectralBasis(id, centers, width) {
	return new SpectralBasis({
		id,
		channels: centers.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param center - The center value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (center) => ({
				id: `w${center}`,
				center: {value: center, units: 'nanometers'},
				width: {value: width, units: 'nanometers'},
			}),
		),
	});
}

/**
 * Called by this module to create a valid spectral model for tests.
 *
 * @returns {SpectralModel} - The initialized spectral model.
 */
function createSpectralModel() {
	return new SpectralModel({
		basis: spectralBasis('spectral-model-test-a', [360, 400, 440], 40),
		version: 7,
	});
}

describe('SpectralModel', /** Called by Jasmine to register the named test suite. */ () => {
	it('retains the accepted unit-bearing basis and exposes direct spectral state', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = spectralBasis('spectral-model-test-b', [360, 400, 440], 40);
		const model = new SpectralModel({
			basis,
			version: 2,
		});

		expect(model.basis).toBe(basis);
		expect(model.wavelengths).toEqual([
			{value: 360, units: 'nanometers'},
			{value: 400, units: 'nanometers'},
			{value: 440, units: 'nanometers'},
		]);
		expect(model.channelCount).toBe(3);
		expect(model.version).toBe(2);
	});

	it('requires the canonical spectral-basis value at its ownership boundary', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				new SpectralModel({
					basis: /** @type {SpectralBasis} */ ({}),
					version: 1,
				}),
		).toThrowError(/SpectralBasis/);
	});

	it('returns unit-bearing wavelengths by channel index and fails on invalid indexes', /** Called by Jasmine to exercise the named behavior. */ () => {
		const model = createSpectralModel();

		expect(model.getWavelength(1)).toEqual({value: 400, units: 'nanometers'});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => model.getWavelength(-1),
		).toThrowError(RangeError);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => model.getWavelength(3),
		).toThrowError(RangeError);
	});
});
