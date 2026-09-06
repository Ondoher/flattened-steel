import { createSpectralBasis } from '../../quantities/index.js';
import { SpectralModel } from '../SpectralModel.js';

/**
 * Create an equally spaced test spectral basis.
 *
 * @param {string} id - Supplies the basis identity.
 * @param {readonly number[]} centers - Supplies channel centers in nanometers.
 * @param {number} width - Supplies the contiguous channel width in nanometers.
 * @returns {SpectralBasis} The validated spectral basis.
 */
function spectralBasis(id, centers, width) {
	return createSpectralBasis({
		id,
		channels: centers.map((center) => ({
			id: `w${center}`,
			center: { value: center, units: 'nanometers' },
			width: { value: width, units: 'nanometers' },
		})),
	});
}

/**
 * Create a valid spectral model for tests.
 *
 * @returns {SpectralModel} The initialized spectral model.
 */
function createSpectralModel() {
	return new SpectralModel({
		basis: spectralBasis('spectral-model-test-a', [360, 400, 440], 40),
		fingerprint: 'initial-spectral-fingerprint',
		version: 7,
	});
}

describe('SpectralModel', () => {
	it('retains the accepted unit-bearing basis and exposes descriptor state', () => {
		const basis = spectralBasis('spectral-model-test-b', [360, 400, 440], 40);
		const model = new SpectralModel({
			basis,
			fingerprint: 'basis-a',
			version: 2,
		});

		expect(model.basis).toBe(basis);
		expect(model.wavelengths).toEqual([
			{ value: 360, units: 'nanometers' },
			{ value: 400, units: 'nanometers' },
			{ value: 440, units: 'nanometers' },
		]);
		expect(model.channelCount).toBe(3);
		expect(model.fingerprint).toBe('basis-a');
		expect(model.version).toBe(2);
		expect(model.describe()).toEqual({
			kind: 'algorithm32-spectral-model',
			basis,
			channelCount: 3,
			fingerprint: 'basis-a',
			version: 2,
		});
	});

	it('replaces the complete spectral basis and increments the model version', () => {
		const model = createSpectralModel();
		const nextBasis = spectralBasis('spectral-model-test-c', [500, 600], 100);
		const descriptor = model.replaceBasis(nextBasis);
		const fingerprint = `spectral:${nextBasis.contentHash}`;

		expect(model.basis).toBe(nextBasis);
		expect(model.version).toBe(8);
		expect(model.fingerprint).toBe(fingerprint);
		expect(descriptor).toEqual({
			kind: 'algorithm32-spectral-model',
			basis: nextBasis,
			channelCount: 2,
			fingerprint,
			version: 8,
		});
	});

	it('requires the canonical spectral-basis value at its ownership boundary', () => {
		expect(() => new SpectralModel({
			basis: /** @type {SpectralBasis} */ ({}),
			version: 1,
		})).toThrowError(/SpectralBasis/);
	});

	it('derives only an absent fingerprint and rejects supplied invalid values', () => {
		const basis = spectralBasis('spectral-model-test-d', [550], 20);
		const model = new SpectralModel({ basis, version: 1 });

		expect(model.fingerprint).toBe(`spectral:${basis.contentHash}`);
		expect(() => new SpectralModel({ basis, fingerprint: null, version: 1 }))
			.toThrowError(/fingerprint/);
		expect(() => new SpectralModel({ basis, fingerprint: '', version: 1 }))
			.toThrowError(/fingerprint/);
	});

	it('validates a replacement at the model ownership boundary', () => {
		const model = createSpectralModel();

		expect(() => model.replaceBasis(
			/** @type {SpectralBasis} */ ({}),
		)).toThrowError(/SpectralBasis/);
	});

	it('returns unit-bearing wavelengths by channel index and fails on invalid indexes', () => {
		const model = createSpectralModel();

		expect(model.getWavelength(1)).toEqual({ value: 400, units: 'nanometers' });
		expect(() => model.getWavelength(-1)).toThrowError(RangeError);
		expect(() => model.getWavelength(3)).toThrowError(RangeError);
	});
});
