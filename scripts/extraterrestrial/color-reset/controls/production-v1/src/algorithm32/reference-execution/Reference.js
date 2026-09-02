import {SpectralCalculator as DefaultSpectralCalculator} from '../atmospheric-transport/spectral/SpectralCalculator.js';

/** Object that runs CPU/reference Algorithm32 evaluations against a configured shared model. */
export class Reference {
	/**
	 * Called by reference to resolve a view-ray request, defaulting only an absent value. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {object | undefined} value - Supplies the view-ray request.
	 * @returns {object} - The resolved view-ray request.
	 */
	_resolveViewRay(value) {
		return value === undefined ? {} : value;
	}

	/**
	 * Value that stores the facade-owned shared model consumed by reference evaluations.
	 *
	 * @type {SharedModel}
	 *
	 */
	_model;

	/**
	 * Value that stores the shared spectral calculator.
	 *
	 * @type {SpectralCalculator}
	 *
	 */
	_calculator;

	/**
	 * Value that stores the configured default cumulative CPU scattering cache.
	 *
	 * @type {CpuScatteringCache | null}
	 *
	 */
	_scatteringCache;

	/**
	 * Creates a CPU/reference algorithm execution collaborator.
	 *
	 * @param {ReferenceDependencies} dependencies - Supplies the shared model
	 * and implementation services used by reference evaluations.
	 *
	 */
	constructor(dependencies) {
		this._model = dependencies.model;
		this._scatteringCache = dependencies.scatteringCache === undefined ? null : dependencies.scatteringCache;

		this._calculator =
			dependencies.calculator === undefined
				? new DefaultSpectralCalculator({
						model: this._model,
					})
				: dependencies.calculator;
	}

	/**
	 * Value that gets the facade-owned shared model consumed by reference evaluations.
	 *
	 * @returns {SharedModel} - The shared model.
	 */
	get model() {
		return this._model;
	}

	/**
	 * Value that gets the shared spectral calculator.
	 *
	 * @returns {SpectralCalculator} - The spectral calculator.
	 */
	get calculator() {
		return this._calculator;
	}

	/**
	 * Called by reference to resolve the cumulative CPU scattering cache for one evaluation. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {EvaluationRequest} request - Supplies one accepted evaluation
	 * request.
	 * @returns {CpuScatteringCache} - The resolved cumulative cache.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 */
	_resolveScatteringCache(request) {
		if (!Object.hasOwn(request, 'scatteringCache') || request.scatteringCache === undefined) {
			if (this._scatteringCache === null) {
				throw new TypeError('CPU/reference evaluation requires a cumulative scattering cache.');
			}

			return this._scatteringCache;
		}

		if (request.scatteringCache === null) {
			throw new TypeError('CPU/reference evaluation requires a cumulative scattering cache.');
		}

		return request.scatteringCache;
	}

	/**
	 * Called by reference to create the public spectral evaluation result from resolved path facts and calculated path radiance.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the resolved ray segment.
	 * @param {readonly PathIntegrationPoint[]} pathIntegrationPoints - Supplies
	 * path integration points.
	 * @param {PathRadiance} pathRadiance - Supplies computed path radiance.
	 * @returns {EvaluationResult} - The spectral evaluation result.
	 */
	_createEvaluationResult(viewRaySegment, pathIntegrationPoints, pathRadiance) {
		return {
			pathRadiance: pathRadiance.pathRadiance,
			transmittance: pathRadiance.transmittance,
			viewRaySegment,
			pathIntegrationPoints,
		};
	}

	/**
	 * Call this method to evaluate Algorithm32 spectral radiance and transmittance for one ray request. The evaluation follows the reconciled owner-query flow: geometry resolves the finite view ray segment, the calculator builds endpoint/trapezoid path points, and reusable spectral transport computes path radiance plus view transmittance. A request cache overrides the configured cumulative CPU cache. Optical-depth and Beer-Lambert transmittance transport that cache's cumulative local scattering density to the observer. [1][2].
	 *
	 * @param {EvaluationRequest} request - Supplies one accepted evaluation
	 * request.
	 * @returns {EvaluationResult} - The spectral evaluation result.
	 */
	evaluate(request = {}) {
		const viewRaySegment = this.model.geometry.resolveViewRaySegment(this._resolveViewRay(request.viewRay));
		const pathIntervalCount = this.model.profile.numerical.viewPath.intervalCount;
		const pathIntegrationPoints =
			this.model.profile.numerical.viewPath.sampleDistribution?.kind === 'quadratic-near-observer-v1'
				? this.calculator.buildQuadraticMidpointPathIntegrationPoints(viewRaySegment, pathIntervalCount)
				: this.calculator.buildEndpointTrapezoidPathIntegrationPoints(viewRaySegment, pathIntervalCount);
		const scatteringCache = this._resolveScatteringCache(request);
		const pathRadiance = this.calculator.computeRadiance(viewRaySegment, pathIntegrationPoints, {scatteringCache});

		return this._createEvaluationResult(viewRaySegment, pathIntegrationPoints, pathRadiance);
	}

	/**
	 * Call this method to dispose resources owned by the reference execution collaborator.
	 *
	 * @returns {void} -
	 */
	dispose() {}
}
