import { RUNTIME_NUMERICAL_CONTROLS } from
	'../constants/Algorithm32CanonicalData.js';
import { SpectralCalculator as DefaultSpectralCalculator } from './SpectralCalculator.js';

/**
 * Run CPU/reference Algorithm32 evaluations against a configured shared model.
 */
export class Reference {
	/**
	 * Resolve a view-ray request, defaulting only an absent value.
	 *
	 * @param {object | undefined} value - Supplies the view-ray request.
	 * @returns {object} The resolved view-ray request.
	 */
	_resolveViewRay(value) {
		return value === undefined ? {} : value;
	}

	/**
	 * Store the facade-owned shared model consumed by reference evaluations.
	 *
	 * @type {SharedModel}
	 */
	_model;

	/**
	 * Store the shared spectral calculator.
	 *
	 * @type {SpectralCalculator}
	 */
	_calculator;

	/**
	 * Store the configured default cumulative CPU scattering cache.
	 *
	 * @type {CpuScatteringCache | null}
	 */
	_scatteringCache;

	/**
	 * Store numerical execution controls.
	 *
	 * @type {ExecutionConfig}
	 */
	_executionControls;

	/**
	 * Create a CPU/reference algorithm execution collaborator.
	 *
	 * @param {ReferenceDependencies} dependencies - Supplies the shared model
	 * and implementation services used by reference evaluations.
	 */
	constructor(dependencies) {
		if (!dependencies || typeof dependencies !== 'object') {
			throw new TypeError('Reference dependencies are required.');
		}

		if (!dependencies.model) {
			throw new TypeError('Reference requires a shared model.');
		}

		this._model = dependencies.model;
		this._scatteringCache = dependencies.scatteringCache === undefined
			? null
			: dependencies.scatteringCache;
		if (dependencies.executionControls !== undefined
			&& (dependencies.executionControls === null
				|| typeof dependencies.executionControls !== 'object'
				|| Array.isArray(dependencies.executionControls))) {
			throw new TypeError('Reference executionControls must be an object when supplied.');
		}

		if (dependencies.calculator !== undefined
			&& (dependencies.calculator === null
				|| typeof dependencies.calculator !== 'object'
				|| typeof dependencies.calculator.buildEndpointTrapezoidPathIntegrationPoints !== 'function'
				|| typeof dependencies.calculator.computeRadiance !== 'function')) {
			throw new TypeError('Reference calculator must implement the spectral calculation boundary when supplied.');
		}

		this._executionControls = {
			...(dependencies.executionControls === undefined
				? {}
				: dependencies.executionControls),
		};
		this._calculator = dependencies.calculator === undefined
			? new DefaultSpectralCalculator({
			geometry: this._model.geometry,
			atmosphere: this._model.atmosphere,
			lightSource: this._model.lightSource,
			spectralBasis: this._model.spectral.basis,
			executionControls: this._executionControls,
		})
			: dependencies.calculator;
	}

	/**
	 * Get the facade-owned shared model consumed by reference evaluations.
	 *
	 * @returns {SharedModel} The shared model.
	 */
	get model() {
		return this._model;
	}

	/**
	 * Get the shared spectral calculator.
	 *
	 * @returns {SpectralCalculator} The spectral calculator.
	 */
	get calculator() {
		return this._calculator;
	}

	/**
	 * Resolve the path interval count for one evaluation.
	 *
	 * @param {number | undefined} requestedPathIntervalCount - Supplies the
	 * request-level interval count.
	 * @returns {number} The resolved interval count.
	 */
	_resolvePathIntervalCount(requestedPathIntervalCount) {
		const configuredPathIntervalCount = this._executionControls.pathIntervalCount;
		const pathIntervalCount = requestedPathIntervalCount !== undefined
			? requestedPathIntervalCount
			: configuredPathIntervalCount !== undefined
				? configuredPathIntervalCount
				: RUNTIME_NUMERICAL_CONTROLS.pathIntervalCount;

		if (!Number.isInteger(pathIntervalCount) || pathIntervalCount < 1) {
			throw new RangeError('pathIntervalCount must be a positive integer.');
		}

		return pathIntervalCount;
	}

	/**
	 * Resolve the cumulative CPU scattering cache for one evaluation.
	 *
	 * @param {EvaluationRequest} request - Supplies one accepted evaluation
	 * request.
	 * @returns {CpuScatteringCache} The resolved cumulative cache.
	 */
	_resolveScatteringCache(request) {
		if (
			!Object.hasOwn(request, 'scatteringCache')
			|| request.scatteringCache === undefined
		) {
			if (this._scatteringCache === null) {
				throw new TypeError(
					'CPU/reference evaluation requires a cumulative scattering cache.',
				);
			}

			return this._scatteringCache;
		}

		if (request.scatteringCache === null) {
			throw new TypeError(
				'CPU/reference evaluation requires a cumulative scattering cache.',
			);
		}

		return request.scatteringCache;
	}

	/**
	 * Create the public spectral evaluation result from resolved path facts and
	 * calculated path radiance.
	 *
	 * @param {RaySegment} viewRaySegment - Supplies the resolved ray segment.
	 * @param {readonly PathIntegrationPoint[]} pathIntegrationPoints - Supplies
	 * path integration points.
	 * @param {PathRadiance} pathRadiance - Supplies computed path radiance.
	 * @returns {EvaluationResult} The spectral evaluation result.
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
	 * Evaluate Algorithm32 spectral radiance and transmittance for one ray
	 * request.
	 *
	 * The evaluation follows the reconciled owner-query flow: geometry resolves
	 * the finite view ray segment, the calculator builds endpoint/trapezoid path
	 * points, and reusable spectral transport computes path radiance plus view
	 * transmittance. A request cache overrides the configured cumulative CPU
	 * cache. Optical-depth and Beer-Lambert transmittance transport that cache's
	 * cumulative local scattering density to the observer. [1][2]
	 *
	 * @param {EvaluationRequest} request - Supplies one accepted evaluation
	 * request.
	 * @returns {EvaluationResult} The spectral evaluation result.
	 */
	evaluate(request = {}) {
		if (!request || typeof request !== 'object') {
			throw new TypeError('Evaluation request must be an object.');
		}

		const viewRaySegment = this.model.geometry.resolveViewRaySegment(
			this._resolveViewRay(request.viewRay),
		);
		const pathIntervalCount = this._resolvePathIntervalCount(request.pathIntervalCount);
		const pathIntegrationPoints = this.calculator.buildEndpointTrapezoidPathIntegrationPoints(
			viewRaySegment,
			pathIntervalCount,
		);
		const scatteringCache = this._resolveScatteringCache(request);
		const pathRadiance = this.calculator.computeRadiance(
			viewRaySegment,
			pathIntegrationPoints,
			{ scatteringCache },
		);

		return this._createEvaluationResult(viewRaySegment, pathIntegrationPoints, pathRadiance);
	}

	/**
	 * Dispose resources owned by the reference execution collaborator.
	 *
	 * @returns {void}
	 */
	dispose() {
	}
}


