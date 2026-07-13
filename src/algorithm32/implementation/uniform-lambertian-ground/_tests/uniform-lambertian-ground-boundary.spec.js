import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/index.js';
import {
	SpectralBasis,
	SpectralPacket,
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
} from '../../../spectral-values/index.js';
import {UniformLambertianGroundBoundary} from '../../index.js';
import {GRASS_NATIVE_15_ALBEDO_VALUES} from '../consts.js';

/**
 * Called by this module to create a ground BRDF request.
 *
 * @param {SpectralBasis} spectralBasis - Supplies the requested basis.
 * @returns {GroundBrdfRequest} - The request.
 */
function createRequest(spectralBasis) {
	return {
		hit: {
			position: {coordinates: [0, 0, 0], units: 'meters'},
			normal: [0, 0, 1],
			distance: {value: 1, units: 'meters'},
		},
		incomingDirection: [0, 0, 1],
		outgoingDirection: [0, 1, 0],
		spectralBasis,
	};
}

describe('UniformLambertianGroundBoundary', /** Called by Jasmine to register the named test suite. */ () => {
	it('constructs the pinned Native-15 grass albedo and Lambertian BRDF', /** Called by Jasmine to exercise the named behavior. */ () => {
		const boundary = new UniformLambertianGroundBoundary({
			id: 'test-lambertian-grass-v1',
			material: 'grass',
		});
		const bidirectionalReflectance = boundary.evaluateBrdf(createRequest(NATIVE_15_SPECTRAL_BASIS));

		expect(boundary.id).toBe('test-lambertian-grass-v1');
		expect(boundary.model).toBe('uniform-lambertian-spectral-ground-v1');
		expect(boundary.material).toBe('grass');
		expect(boundary.albedo.quantity).toBe(SPECTRAL_QUANTITIES.REFLECTANCE);
		expect(boundary.albedo.units).toBe(SPECTRAL_UNITS.DIMENSIONLESS);
		expect(boundary.albedo.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(boundary.albedo.values).toEqual(GRASS_NATIVE_15_ALBEDO_VALUES);
		expect(boundary.albedo.provenanceIdentity).toBe('algorithm32-bruneton-grass-native-15-bin-average-v1:grass');
		expect(bidirectionalReflectance.quantity).toBe(SPECTRAL_QUANTITIES.BRDF);
		expect(bidirectionalReflectance.units).toBe(SPECTRAL_UNITS.INVERSE_SOLID_ANGLE);
		expect(bidirectionalReflectance.basis).toBe(NATIVE_15_SPECTRAL_BASIS);
		expect(bidirectionalReflectance.values).toEqual(
			GRASS_NATIVE_15_ALBEDO_VALUES.map(
				/**
				 * Called by Array.prototype.map to convert albedo to Lambertian BRDF.
				 * @param value - Supplies one albedo value.
				 * @returns - The corresponding inverse-solid-angle BRDF.
				 */ (value) => value * (1 / Math.PI),
			),
		);
		expect(boundary.evaluateBrdf(createRequest(NATIVE_15_SPECTRAL_BASIS))).toBe(bidirectionalReflectance);
	});

	it('contributes the owned grass BRDF to reflective cache construction', /** Called by Jasmine to exercise the named behavior. */ () => {
		const boundary = new UniformLambertianGroundBoundary({material: 'grass'});
		const module = boundary.createCacheModule(/** @type {CacheBuildContext} */ (/** @type {unknown} */ ({})));
		const brdfBinding = module.bindings.find(
			/**
			 * Called by Array.prototype.find to select the ground BRDF binding.
			 * @param input - Supplies one binding.
			 * @returns - True for the ground BRDF binding.
			 */ ({spec: fieldSpecification}) => fieldSpecification.id === 'uniform-lambertian-ground-cache-brdf',
		);
		const source = module.blocks
			.map(
				/**
				 * Called by Array.prototype.map to select module source.
				 * @param input - Supplies one block.
				 * @returns - The block source.
				 */ ({source: blockSource}) => blockSource,
			)
			.join('\n');

		expect(module.owner).toBe('ground');
		expect(module.provides).toEqual(['ground.reflectance']);
		expect(brdfBinding?.value).toEqual(
			jasmine.objectContaining({
				quantity: SPECTRAL_QUANTITIES.BRDF,
				units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
				values: GRASS_NATIVE_15_ALBEDO_VALUES.map(
					/**
					 * Called by Array.prototype.map to convert albedo to Lambertian BRDF.
					 * @param value - Supplies one albedo value.
					 * @returns - The corresponding inverse-solid-angle BRDF.
					 */ (value) => value * (1 / Math.PI),
				),
			}),
		);
		expect(source).toContain('float cacheGroundBrdf(');
		expect(source).toContain('return uCacheGroundBrdf[wavelengthIndex];');
	});

	it('retains exact point-sampled albedo and derives its Lambertian BRDF', /** Called by Jasmine to exercise the named behavior. */ () => {
		const basis = new SpectralBasis({
			id: 'ground-point-sampled-test',
			semantics: SPECTRAL_SAMPLE_SEMANTICS.POINT_SAMPLED_SPECTRAL_DENSITY,
			channels: [
				{id: 'a', center: {value: 360, units: 'nanometers'}, width: {value: 11.75, units: 'nanometers'}},
				{id: 'b', center: {value: 500, units: 'nanometers'}, width: {value: 11.75, units: 'nanometers'}},
				{id: 'c', center: {value: 818.25, units: 'nanometers'}, width: {value: 11.75, units: 'nanometers'}},
			],
		});
		const albedo = /** @type {SpectralReflectancePacket} */ (
			new SpectralPacket({
				basis,
				quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				values: [0.1, 0.2, 0.3],
				provenanceIdentity: 'ground-point-sampled-test',
			})
		);
		const boundary = new UniformLambertianGroundBoundary({id: 'exact-ground', albedo});
		const brdf = boundary.evaluateBrdf(createRequest(basis));

		expect(boundary.albedo).toBe(albedo);
		expect(boundary.material).toBeNull();
		expect(brdf.basis).toBe(basis);
		expect(brdf.values).toEqual([0.1 * (1 / Math.PI), 0.2 * (1 / Math.PI), 0.3 * (1 / Math.PI)]);
	});

	it('requires the grass material and rejects unimplemented selections', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const options of [{}, {material: 'snow'}, {material: 'ocean'}]) {
			expect(
				/**
				 * Called by Jasmine to invoke the rejected construction.
				 * @returns - The constructed boundary when unexpectedly accepted.
				 */ () =>
					new UniformLambertianGroundBoundary(
						/** @type {UniformLambertianGroundBoundaryOptions} */ (/** @type {unknown} */ (options)),
					),
			).toThrowError(/material must be "grass"/u);
		}
	});

	it('rejects implicit resampling onto another spectral basis', /** Called by Jasmine to exercise the named behavior. */ () => {
		const incompatibleBasis = new SpectralBasis({
			id: 'incompatible-ground-basis',
			semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
			channels: NATIVE_15_SPECTRAL_BASIS.channels.map(
				/**
				 * Called by Array.prototype.map to shift the first channel.
				 * @param channel - Supplies one Native-15 channel.
				 * @returns - The copied channel.
				 */ (channel) => ({
					...channel,
					center: {
						...channel.center,
						value: channel.center.value + 1,
					},
				}),
			),
		});
		const boundary = new UniformLambertianGroundBoundary({material: 'grass'});

		expect(
			/**
			 * Called by Jasmine to invoke the incompatible evaluation.
			 * @returns - The BRDF when unexpectedly accepted.
			 */ () => boundary.evaluateBrdf(createRequest(incompatibleBasis)),
		).toThrowError(/basis are incompatible/u);
	});
});
