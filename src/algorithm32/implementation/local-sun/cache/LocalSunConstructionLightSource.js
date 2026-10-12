import {SpectralMath} from '../../../spectral-values/index.js';
import DistanceMath from '../../../math/DistanceMath.js';

/**
 * Adapt one continuous local Sun to the shell-held primary-J1 construction
 * contract without expanding the source's public runtime surface.
 */
export default class LocalSunConstructionLightSource {
	/**
	 * Source value.
	 *
	 *  @type {LocalSunConstructionContinuousSource}
	 *
	 */
	_source;
	/**
	 * Shell fact cache value.
	 *
	 *  @type {LocalSunShellFactCache}
	 *
	 */
	_shellFactCache;

	/**
	 * Called by construction sampling to validate the continuous collaborator's unknown metadata before use.
	 * Extra metadata is preserved; source distance is normalized to metres and incident scale remains dimensionless.
	 *
	 * @param {unknown} metadata - Untrusted direct-light sample metadata.
	 * @returns {LocalSunContinuousDirectLightingMetadata} - Copied validated construction inputs.
	 * @throws {TypeError} - Metadata, distance units or finite scalar shape is invalid.
	 * @throws {RangeError} - Normalized distance or incident scale is negative or outside finite support.
	 */
	_acceptContinuousMetadata(metadata) {
		if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
			throw new TypeError('Continuous source metadata must be an object.');
		const candidate = /** @type {LocalSunConstructionMetadataIngress} */ (metadata);
		DistanceMath.assertDistance(candidate.distanceFromSource, 'Continuous source metadata distance');
		const distance = DistanceMath.toMeters(/** @type {Distance} */ (candidate.distanceFromSource));
		const scale = candidate.incidentScale;
		if (typeof scale !== 'number' || !Number.isFinite(scale))
			throw new TypeError('Continuous source metadata incident scale must be finite.');
		if (!Number.isFinite(distance) || distance < 0 || scale < 0)
			throw new RangeError('Continuous source metadata requires nonnegative finite physical values.');
		return {...candidate, distanceFromSource: DistanceMath.inMeters(distance), incidentScale: scale};
	}

	/**
	 * Creates one construction-only light-source collaborator.
	 *
	 * @param {LocalSunConstructionLightSourceDefinition} definition - Supplies
	 * the continuous source and its independently owned shell facts.
	 *
	 */
	constructor(definition) {
		this._source = definition.source;
		this._shellFactCache = definition.shellFactCache;
	}

	/**
	 * Value that identifies the configured physical source.
	 *
	 * @returns {string} - The source id.
	 */
	get id() {
		return this._source.id;
	}

	/**
	 * Call this method to resolve the physical source's finite path limit.
	 *
	 * @param {unknown} request - Supplies source-relative path facts.
	 * @returns {SourcePathLimit} - The physical source path limit.
	 */
	resolveSourcePathLimit(request) {
		return this._source.resolveSourcePathLimit(request);
	}

	/**
	 * Call this method to preserve the physical source's fail-closed controller boundary.
	 *
	 * @param {CacheControllerRequest} request - Supplies renderer owners.
	 * @returns {CacheController} - The delegated controller.
	 */
	createCacheController(request) {
		return this._source.createCacheController(request);
	}

	/**
	 * Call this method to sample the construction-only shell-held primary-J1 amplitude.
	 *
	 * @param {object} [request] - Supplies source-relative sample facts.
	 * @returns {DirectLightingSample} - The construction lighting sample.
	 * @throws {TypeError} - The continuous source returns invalid metadata or distance units.
	 * @throws {RangeError} - Metadata values or the queried distance violate admitted physical support.
	 */
	sampleDirectLighting(request = {}) {
		const continuous = this._source.sampleDirectLighting(request);
		const continuousMetadata = this._acceptContinuousMetadata(continuous.metadata);
		const distanceMeters = continuousMetadata.distanceFromSource.value;
		const shell = this._shellFactCache.resolveShell(distanceMeters);
		const continuousIncidentScale = continuousMetadata.incidentScale;
		const ratio = continuousIncidentScale === 0 ? 0 : shell.heldIncidentScale / continuousIncidentScale;

		return {
			...continuous,
			sourceIrradiance: /** @type {SpectralIrradiancePacket} */ (
				SpectralMath.scaleSpectralPacket(this._source.configuration.sourceIrradiance, shell.heldIncidentScale)
			),
			metadata: {
				...continuousMetadata,
				constructionLightKind: 'shell-held-arithmetic-mean',
				shellIndex: shell.shellIndex,
				continuousIncidentScale,
				heldIncidentScale: shell.heldIncidentScale,
				shellDistanceClamped: shell.clamped,
				shellScaleRatio: ratio,
			},
		};
	}
}
