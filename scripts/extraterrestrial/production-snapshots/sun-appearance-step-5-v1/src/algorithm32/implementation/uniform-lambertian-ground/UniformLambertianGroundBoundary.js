import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../profiles/index.js';
import {
	SpectralBasis,
	SpectralPacket as SpectralPacketClass,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../../spectral-values/index.js';
import {ValueValidation} from '../../validation/ValueValidation.js';
import {
	DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID,
	GRASS_ALBEDO_PROVENANCE_IDENTITY,
	GRASS_NATIVE_15_ALBEDO_VALUES,
	GROUND_CACHE_REFLECTANCE_SYMBOL,
	LAMBERTIAN_BRDF_SCALE,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID,
	UNIFORM_LAMBERTIAN_GROUND_MATERIAL,
	UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX,
	UNIFORM_LAMBERTIAN_GROUND_MODEL,
} from './consts.js';

/**
 * Owns the built-in grass spatially uniform Lambertian BRDF.
 *
 * @implements {GroundBoundary}
 * @implements {CacheBuildContributor}
 */
export class UniformLambertianGroundBoundary {
	/**
	 * Brdf value.
	 *
	 *  @type {SpectralBrdfPacket}
	 *
	 */
	_brdf;

	/**
	 * Creates a boundary from one named built-in material.
	 *
	 * @param {UniformLambertianGroundBoundaryOptions} options - Supplies the
	 * accepted material and optional boundary identity.
	 *
	 */
	constructor(options = /** @type {UniformLambertianGroundBoundaryOptions} */ ({})) {
		const id = ValueValidation.requiredString(
			options.id === undefined ? DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID : options.id,
			'UniformLambertianGroundBoundary.id',
		);
		if (options.albedo !== undefined && options.material !== undefined) {
			throw new TypeError('UniformLambertianGroundBoundary accepts either material or albedo, not both.');
		}
		const material = options.albedo === undefined ? this._acceptMaterial(options.material) : null;
		const albedo =
			options.albedo === undefined
				? this._createAlbedoPacket(/** @type {UniformLambertianGroundMaterial} */ (material))
				: this._acceptAlbedoPacket(options.albedo);

		/** @readonly */
		this.id = id;
		/** @readonly */
		this.model = UNIFORM_LAMBERTIAN_GROUND_MODEL;
		/** @readonly */
		this.material = material;
		/** @readonly */
		this.albedo = albedo;
		this._brdf = this._createBrdfPacket(albedo);
	}

	/**
	 * Called by uniform lambertian ground boundary to accept its built-in material selection.
	 *
	 * @param {unknown} value - Supplies the candidate material.
	 * @returns {UniformLambertianGroundMaterial} - The accepted material.
	 * @throws {RangeError} - When the material is unsupported.
	 */
	_acceptMaterial(value) {
		if (value !== UNIFORM_LAMBERTIAN_GROUND_MATERIAL) {
			throw new RangeError('UniformLambertianGroundBoundary.material must be "grass".');
		}

		return value;
	}

	/**
	 * Called by uniform lambertian ground boundary to construct the owned Native-15 grass albedo packet.
	 *
	 * @param {UniformLambertianGroundMaterial} material - Supplies the accepted material.
	 * @returns {SpectralReflectancePacket} - The owned albedo packet.
	 */
	_createAlbedoPacket(material) {
		return /** @type {SpectralReflectancePacket} */ (
			new SpectralPacketClass({
				quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
				basis: NATIVE_15_SPECTRAL_BASIS,
				semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
				values: GRASS_NATIVE_15_ALBEDO_VALUES,
				provenanceIdentity: `${GRASS_ALBEDO_PROVENANCE_IDENTITY}:${material}`,
			})
		);
	}

	/**
	 * Called by construction to accept one exact aligned spectral albedo.
	 *
	 * @param {unknown} value - Supplies the candidate albedo packet.
	 * @returns {SpectralReflectancePacket} - The accepted packet.
	 */
	_acceptAlbedoPacket(value) {
		const albedo = /** @type {SpectralReflectancePacket} */ (
			SpectralPacketClass.assert(value, {
				quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
				units: SPECTRAL_UNITS.DIMENSIONLESS,
			})
		);
		if (albedo.values.some((entry) => entry < 0 || entry > 1)) {
			throw new RangeError('UniformLambertianGroundBoundary albedo values must be in [0, 1].');
		}
		return albedo;
	}

	/**
	 * Called by uniform lambertian ground boundary to create the typed Lambertian BRDF packet.
	 *
	 * @param {SpectralReflectancePacket} albedo - Supplies accepted reflectance.
	 * @returns {SpectralBrdfPacket} - The typed BRDF.
	 */
	_createBrdfPacket(albedo) {
		return /** @type {SpectralBrdfPacket} */ (
			new SpectralPacketClass({
				quantity: SPECTRAL_QUANTITIES.BRDF,
				units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
				basis: albedo.basis,
				semantics: albedo.semantics,
				values: albedo.values.map(
					/**
					 * Called by Array.prototype.map to transform one collection value.
					 * @param value - The value accepted by the operation.
					 * @returns - The callback result returned to its caller.
					 */ (value) => value * LAMBERTIAN_BRDF_SCALE,
				),
				provenanceIdentity: `${UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX}:${albedo.contentHash}`,
			})
		);
	}

	/**
	 * Call this method to evaluate the uniform spectral BRDF on the requested exact basis.
	 *
	 * @param {GroundBrdfRequest} request - Supplies the geometry-owned hit,
	 * direction pair, and requested basis.
	 * @returns {SpectralBrdfPacket} - The typed Lambertian BRDF.
	 */
	evaluateBrdf(request) {
		SpectralBasis.assertCompatible(this.albedo.basis, request.spectralBasis, 'Uniform Lambertian BRDF basis');

		return this._brdf;
	}

	/**
	 * Call this method to contribute the typed Lambertian BRDF used by reflective cache passes.
	 *
	 * @param {CacheBuildContext} _context - Supplies the resolved scatter pass.
	 * @returns {CacheBuildModule} - The executable ground-BRDF module.
	 */
	createCacheModule(_context) {
		return CacheBuildModules.createBuildModule({
			id: UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID,
			owner: 'ground',
			provides: [GROUND_CACHE_REFLECTANCE_SYMBOL],
			requires: [],
			blocks: [
				{
					id: UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID,
					phase: 'function',
					order: 0,
					source: `float ${UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME}(
	int wavelengthIndex
) {
	return ${UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME}[wavelengthIndex];
}`,
				},
			],
			bindings: [
				{
					spec: {
						id: UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID,
						name: UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME,
						kind: 'uniform',
						shaderType: `float[${this._brdf.basis.channelCount}]`,
						frequency: 'build',
					},
					value: this._brdf,
				},
			],
		});
	}
}
