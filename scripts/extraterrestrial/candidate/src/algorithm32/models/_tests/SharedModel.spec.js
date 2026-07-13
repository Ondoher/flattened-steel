import { createSpectralBasis } from '../../quantities/index.js';
import { SharedModel } from '../SharedModel.js';
import { SpectralModel } from '../SpectralModel.js';

/**
 * Create a simple descriptor-bearing model implementation for aggregate tests.
 *
 * @param {string} kind - Supplies the descriptor kind.
 * @returns {{ id: string, describe: function(): object }} The model double.
 */
function createDescribedModel(kind) {
	return {
		id: `${kind}-test`,
		describe() {
			return {
				kind,
				id: this.id,
			};
		},
	};
}

describe('SharedModel', () => {
	it('constructs the spectral model from the accepted unit-bearing basis', () => {
		const lightSource = createDescribedModel('light-source');
		const atmosphere = createDescribedModel('atmosphere');
		const geometry = createDescribedModel('geometry');
		const spectralBasis = createSpectralBasis({
			id: 'shared-model-test-basis',
			channels: [380, 500, 620].map((center) => ({
				id: `w${center}`,
				center: { value: center, units: 'nanometers' },
				width: { value: 120, units: 'nanometers' },
			})),
		});
		const model = new SharedModel({
			version: 4,
			lightSource,
			atmosphere,
			geometry,
			spectralBasis,
		});
		const spectralFingerprint = `spectral:${spectralBasis.contentHash}`;

		expect(model.version).toBe(4);
		expect(model.lightSource).toBe(lightSource);
		expect(model.atmosphere).toBe(atmosphere);
		expect(model.geometry).toBe(geometry);
		expect(model.spectral instanceof SpectralModel).toBe(true);
		expect(model.spectral.basis).toBe(spectralBasis);
		expect(model.spectral.fingerprint).toBe(spectralFingerprint);
		expect(model.snapshot()).toEqual({
			version: 4,
			lightSource: {
				kind: 'light-source',
				id: 'light-source-test',
			},
			atmosphere: {
				kind: 'atmosphere',
				id: 'atmosphere-test',
			},
			geometry: {
				kind: 'geometry',
				id: 'geometry-test',
			},
			spectral: {
				kind: 'algorithm32-spectral-model',
				basis: spectralBasis,
				channelCount: 3,
				fingerprint: spectralFingerprint,
				version: 4,
			},
		});
	});
});
