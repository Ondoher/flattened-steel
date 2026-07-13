import { scaleSpectralPacket } from '../quantities/index.js';

/**
 * Adapt one continuous local Sun to the shell-held primary-J1 construction
 * contract without expanding the source's public runtime surface.
 */
export default class LocalSunConstructionLightSource {
	/** @type {LocalSunConstructionContinuousSource} */
	_source;
	/** @type {LocalSunShellFactCache} */
	_shellFactCache;

	/**
	 * Create one construction-only light-source collaborator.
	 *
	 * @param {LocalSunConstructionLightSourceDefinition} definition - Supplies
	 * the continuous source and its independently owned shell facts.
	 */
	constructor(definition) {
		this._source = definition.source;
		this._shellFactCache = definition.shellFactCache;
	}

	/**
	 * Identify the configured physical source.
	 *
	 * @returns {string} The source id.
	 */
	get id() {
		return this._source.id;
	}

	/**
	 * Return the physical source descriptor.
	 *
	 * @returns {object} The source descriptor.
	 */
	describe() {
		return this._source.describe();
	}

	/**
	 * Resolve the physical source's finite path limit.
	 *
	 * @param {unknown} request - Supplies source-relative path facts.
	 * @returns {SourcePathLimit} The physical source path limit.
	 */
	resolveSourcePathLimit(request) {
		return this._source.resolveSourcePathLimit(request);
	}

	/**
	 * Preserve the physical source's fail-closed controller boundary.
	 *
	 * @param {CacheControllerRequest} request - Supplies renderer owners.
	 * @returns {CacheController} The delegated controller.
	 */
	createCacheController(request) {
		return this._source.createCacheController(request);
	}

	/**
	 * Sample the construction-only shell-held primary-J1 amplitude.
	 *
	 * @param {object} [request] - Supplies source-relative sample facts.
	 * @returns {DirectLightingSample} The construction lighting sample.
	 */
	sampleDirectLighting(request = {}) {
		const continuous =
			this._source.sampleDirectLighting(request);
		const continuousMetadata =
			/** @type {LocalSunContinuousDirectLightingMetadata} */ (
				continuous.metadata
			);
		const distanceMeters =
			continuousMetadata.distanceFromSource.value;
		const shell =
			this._shellFactCache.resolveShell(distanceMeters);
		const continuousIncidentScale =
			continuousMetadata.incidentScale;
		const ratio = continuousIncidentScale === 0
			? 0
			: shell.heldIncidentScale
				/ continuousIncidentScale;

		return {
			...continuous,
			sourceIrradiance:
				/** @type {SpectralIrradiancePacket} */ (
					scaleSpectralPacket(
						this._source.configuration
							.sourceIrradiance,
						shell.heldIncidentScale,
					)
				),
			metadata: {
				...continuousMetadata,
				constructionLightKind:
					'shell-held-arithmetic-mean',
				shellIndex: shell.shellIndex,
				continuousIncidentScale,
				heldIncidentScale:
					shell.heldIncidentScale,
				shellDistanceClamped: shell.clamped,
				shellScaleRatio: ratio,
			},
		};
	}
}
