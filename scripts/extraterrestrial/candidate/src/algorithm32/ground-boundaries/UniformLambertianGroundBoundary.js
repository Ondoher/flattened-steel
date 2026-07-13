import {
	requiredString,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import { createCacheBuildModule } from '../caches/gpu/cacheBuildContracts.js';
import {
	assertCompatibleSpectralBases,
	assertSpectralPacket,
	createSpectralPacket,
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
} from '../quantities/index.js';
import {
	DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID,
	GROUND_CACHE_REFLECTANCE_SYMBOL,
	GROUND_BOUNDARY_SCHEMA_REVISION,
	LAMBERTIAN_BRDF_SCALE,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME,
	UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID,
	UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX,
	UNIFORM_LAMBERTIAN_GROUND_MODEL,
} from './consts.js';

/** Own an explicitly configured spatially uniform Lambertian BRDF. */
export class UniformLambertianGroundBoundary {
	/** @type {GroundBoundaryDescriptor} */
	_descriptor;
	/** @type {SpectralBrdfPacket} */
	_brdf;

	/**
	 * Create a boundary from profile-supplied spectral reflectance.
	 *
	 * @param {UniformLambertianGroundBoundaryOptions} options - Supplies the
	 * accepted albedo packet and optional boundary identity.
	 */
	constructor(options = /** @type {UniformLambertianGroundBoundaryOptions} */ ({})) {
		const id = requiredString(
			options.id === undefined ? DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID : options.id,
			'UniformLambertianGroundBoundary.id',
		);
		const albedo = this._acceptAlbedo(options.albedo);

		/** @readonly */
		this.id = id;
		/** @readonly */
		this.albedo = albedo;
		this._descriptor = this._createDescriptor(id, albedo);
		this._brdf = this._createBrdfPacket(albedo);
	}

	/**
	 * Accept a physical spectral hemispherical-reflectance packet.
	 *
	 * @param {unknown} packet - Supplies the candidate packet.
	 * @returns {SpectralReflectancePacket} The accepted packet.
	 */
	_acceptAlbedo(packet) {
		const albedo = /** @type {SpectralReflectancePacket} */ (assertSpectralPacket(packet, {
			quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
			units: SPECTRAL_UNITS.DIMENSIONLESS,
		}));

		if (albedo.values.some((value) => value < 0 || value > 1)) {
			throw new RangeError(
				'UniformLambertianGroundBoundary albedo values must be in [0, 1].',
			);
		}

		return albedo;
	}

	/**
	 * Create declarative boundary identity metadata.
	 *
	 * @param {string} id - Supplies the configured boundary id.
	 * @param {SpectralReflectancePacket} albedo - Supplies the accepted albedo.
	 * @returns {GroundBoundaryDescriptor} The content-hashed descriptor.
	 */
	_createDescriptor(id, albedo) {
		const identity = {
			kind: /** @type {const} */ ('algorithm32-ground-boundary'),
			id,
			schemaRevision: GROUND_BOUNDARY_SCHEMA_REVISION,
			model: UNIFORM_LAMBERTIAN_GROUND_MODEL,
			quantity: /** @type {const} */ ('spectral-brdf'),
			units: /** @type {const} */ ('sr^-1'),
			brdf: 'lambertian',
			spectralBasisHash: albedo.basisHash,
			albedoHash: albedo.contentHash,
		};

		return ({
			...identity,
			contentHash: sha256Descriptor(identity),
		});
	}

	/**
	 * Create the typed Lambertian BRDF packet.
	 *
	 * @param {SpectralReflectancePacket} albedo - Supplies accepted reflectance.
	 * @returns {SpectralBrdfPacket} The typed BRDF.
	 */
	_createBrdfPacket(albedo) {
		return /** @type {SpectralBrdfPacket} */ (createSpectralPacket({
			quantity: SPECTRAL_QUANTITIES.BRDF,
			units: SPECTRAL_UNITS.INVERSE_SOLID_ANGLE,
			basis: albedo.basis,
			semantics: albedo.semantics,
			values: albedo.values.map((value) => value * LAMBERTIAN_BRDF_SCALE),
			provenanceIdentity:
				`${UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX}:${albedo.contentHash}`,
		}));
	}

	/**
	 * Return declarative boundary identity metadata.
	 *
	 * @returns {GroundBoundaryDescriptor} The boundary descriptor.
	 */
	describe() {
		return ({ ...this._descriptor });
	}

	/**
	 * Evaluate the uniform spectral BRDF on the requested exact basis.
	 *
	 * @param {GroundBrdfRequest} request - Supplies the geometry-owned hit,
	 * direction pair, and requested basis.
	 * @returns {SpectralBrdfPacket} The typed Lambertian BRDF.
	 */
	evaluateBrdf(request) {
		assertCompatibleSpectralBases(
			this.albedo.basis,
			request.spectralBasis,
			'Uniform Lambertian BRDF basis',
		);

		return this._brdf;
	}

	/**
	 * Contribute the typed Lambertian BRDF used by reflective cache passes.
	 *
	 * @param {CacheBuildContext} _context - Supplies the resolved scatter pass.
	 * @returns {CacheBuildModule} The executable ground-BRDF module.
	 */
	createCacheModule(_context) {
		return createCacheBuildModule({
			id: UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID,
			owner: 'ground',
			provides: [GROUND_CACHE_REFLECTANCE_SYMBOL],
			requires: [],
			blocks: [{
				id: UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID,
				phase: 'function',
				order: 0,
				source: `float ${UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME}(
	int wavelengthIndex
) {
	return ${UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME}[wavelengthIndex];
}`,
			}],
			bindings: [{
				spec: {
					id: UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID,
					name: UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME,
					kind: 'uniform',
					shaderType: `float[${this._brdf.basis.channelCount}]`,
					frequency: 'build',
				},
				value: this._brdf,
			}],
		});
	}
}
