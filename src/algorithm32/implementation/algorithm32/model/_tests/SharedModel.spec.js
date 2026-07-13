import {SpectralBasis} from '../../../../spectral-values/index.js';
import {SharedModel} from '../SharedModel.js';
import {SpectralModel} from '../SpectralModel.js';

describe('SharedModel', /** Called by Jasmine to register the named test suite. */ () => {
	it('constructs the spectral model from the accepted unit-bearing basis', /** Called by Jasmine to exercise the named behavior. */ () => {
		const lightSource = /** @type {LightSourceModel} */ (
			/** @type {unknown} */ ({
				id: 'light-source-test',
			})
		);
		const atmosphere = /** @type {AtmosphereModel} */ (
			/** @type {unknown} */ ({
				id: 'atmosphere-test',
			})
		);
		const geometry = /** @type {GeometryModel} */ (
			/** @type {unknown} */ ({
				id: 'geometry-test',
			})
		);
		const groundBoundary = /** @type {GroundBoundary} */ (/** @type {unknown} */ ({id: 'ground-test'}));
		const spectralBasis = new SpectralBasis({
			id: 'shared-model-test-basis',
			channels: [380, 500, 620].map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param center - The center value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (center) => ({
					id: `w${center}`,
					center: {value: center, units: 'nanometers'},
					width: {value: 120, units: 'nanometers'},
				}),
			),
		});
		const profile = /** @type {Algorithm32ExecutionProfile} */ (
			/** @type {unknown} */ ({
				spectral: {basis: spectralBasis},
				models: {lightSource, atmosphere, geometry, groundBoundary, celestialSources: null},
			})
		);
		const model = new SharedModel({
			version: 4,
			profile,
		});

		expect(model.version).toBe(4);
		expect(model.profile).toBe(profile);
		expect(model.lightSource).toBe(lightSource);
		expect(model.atmosphere).toBe(atmosphere);
		expect(model.geometry).toBe(geometry);
		expect(model.groundBoundary).toBe(groundBoundary);
		expect(model.celestialSources).toBeNull();
		expect(model.spectral instanceof SpectralModel).toBe(true);
		expect(model.spectral.basis).toBe(spectralBasis);
		expect(model.spectral.channelCount).toBe(3);
		expect(model.spectral.version).toBe(4);
	});
});
