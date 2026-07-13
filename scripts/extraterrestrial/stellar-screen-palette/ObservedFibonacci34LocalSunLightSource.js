import {PAIRED_FIBONACCI_34_DIRECTION_DOMAIN} from
	'../candidate/src/algorithm32/domains/consts.js';
import {sha256Descriptor} from
	'../candidate/src/algorithm32/descriptors/descriptorSupport.js';
import {LocalSunCache} from
	'../candidate/src/algorithm32/light-sources/LocalSunCache.js';
import {LocalSunCacheController} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheController.js';
import {LocalSunCacheSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheSource.js';
import LocalSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/LocalSunConstructionDomainSelection.js';
import {LocalSunLightSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunLightSource.js';
import {createLocalSunCacheFingerprint} from
	'../candidate/src/algorithm32/light-sources/local-sun-cache-fingerprint.js';
import {createLocalSunCacheBuildPlan} from
	'../candidate/src/algorithm32/light-sources/local-sun-cache-plan.js';

function deepFreeze(value) {
	if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
		return value;
	}
	for (const child of Object.values(value)) deepFreeze(child);
	return Object.freeze(value);
}

const OBSERVATION_POLICY_BODY = {
	id: 'contained-observed-local-sun-default-paired-fibonacci34-v1',
	selectionOwner:
		'scripts/extraterrestrial/candidate LocalSunConstructionDomainSelection.fromGeometry',
	selectionOptions: 'none-candidate-defaults-only',
	incomingDirectionDomainId:
		PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.id,
	incomingDirectionDomainContentHash:
		PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.contentHash,
	incomingDirectionCount: 34,
	probePolicy: 'none-record-exact-zero-probe-scalars',
	lifecyclePolicy:
		'candidate-controller-cancellation-fingerprint-reuse-atomic-publication-and-disposal',
};

/** Identify the observation-only wrapper around the normal candidate F34 path. */
export const OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY = deepFreeze({
	...OBSERVATION_POLICY_BODY,
	contentHash: sha256Descriptor(OBSERVATION_POLICY_BODY),
});

function requireCandidateFibonacci34Selection(value) {
	if (!(value instanceof LocalSunConstructionDomainSelection)
			|| value.incomingDirectionCount !== 34
			|| value.incomingDirectionDomain.id
				!== PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.id
			|| value.incomingDirectionDomain.contentHash
				!== PAIRED_FIBONACCI_34_DIRECTION_DOMAIN.contentHash) {
		throw new TypeError(
			'Observed local-Sun source requires the normal candidate paired-Fibonacci-34 construction-domain selection.',
		);
	}
	return value;
}

function selectCandidateFibonacci34Domain(geometry) {
	return requireCandidateFibonacci34Selection(
		LocalSunConstructionDomainSelection.fromGeometry(geometry),
	);
}

/**
 * Build the unchanged candidate graph with its normal from-geometry F34
 * selection made explicit so the selected plan can be recorded.
 */
export function createObservedFibonacci34LocalSunCacheBuildPlan(request) {
	const domainSelection = requireCandidateFibonacci34Selection(
		request.domainSelection
			?? selectCandidateFibonacci34Domain(request.geometry),
	);
	return {
		domainSelection,
		plan: createLocalSunCacheBuildPlan({
			source: request.source,
			atmosphere: request.atmosphere,
			geometry: request.geometry,
			groundBoundary: request.groundBoundary,
			maximumScatteringOrder: request.maximumScatteringOrder,
			domainSelection,
		}),
	};
}

/**
 * Observe the ordinary candidate controller execution without changing its
 * construction domain, probes, fingerprint, cache, or lifecycle behavior.
 */
export class ObservedFibonacci34LocalSunCacheController extends
	LocalSunCacheController {
	constructor(request) {
		super(request);
		this._observedBuildRecords = request.buildRecords;
		this._observedLastDomainSelection = null;
	}

	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrentGeneration(generation, cancellation);
		const domainSelection = selectCandidateFibonacci34Domain(
			request.geometry,
		);
		this._observedLastDomainSelection = domainSelection;
		const observedBuild =
			createObservedFibonacci34LocalSunCacheBuildPlan({
				source: this._source,
				atmosphere: request.atmosphere,
				geometry: request.geometry,
				groundBoundary: request.groundBoundary,
				maximumScatteringOrder:
					request.maximumScatteringOrder,
				domainSelection,
			});
		const plan = observedBuild.plan;
		const fingerprint = createLocalSunCacheFingerprint(
			plan,
			this._backend.capabilities,
		);
		this._requireCurrentGeneration(generation, cancellation);

		if (this._active !== null && this._activeFingerprint === fingerprint) {
			return this._active;
		}

		const artifact = await this._executor.execute(plan, {
			scheduler: this._scheduler,
			signal: cancellation.signal,
		});
		try {
			this._requireCurrentGeneration(generation, cancellation);
		} catch (error) {
			artifact.dispose();
			throw error;
		}

		this._observedBuildRecords.push({
			policy: OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY.id,
			policyContentHash:
				OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY.contentHash,
			domainSelectionId: domainSelection.id,
			incomingDirectionDomainId:
				domainSelection.incomingDirectionDomain.id,
			incomingDirectionDomainContentHash:
				domainSelection.incomingDirectionDomain.contentHash,
			incomingDirectionCount: domainSelection.incomingDirectionCount,
			outgoingDirectionDomainId:
				domainSelection.outgoingDirectionDomain.id,
			outgoingDirectionCount: domainSelection.outgoingDirectionCount,
			positionDomainId: domainSelection.positionDomain.id,
			positionCount: domainSelection.positionCount,
			zCount: domainSelection.zCount,
			rhoCount: domainSelection.rhoCount,
			spectralBasisId: domainSelection.spectralBasis.id,
			spectralChannelCount: domainSelection.spectralChannelCount,
			radiancePacking: {
				id: domainSelection.radiancePacking.id,
				directionCount:
					domainSelection.radiancePacking.directionCount,
				positionCount:
					domainSelection.radiancePacking.positionCount,
				wavelengthCount:
					domainSelection.radiancePacking.wavelengthCount,
				scalarCount: domainSelection.radiancePacking.scalarCount,
			},
			scatteringDensityPacking: {
				id: domainSelection.scatteringDensityPacking.id,
				directionCount:
					domainSelection.scatteringDensityPacking.directionCount,
				positionCount:
					domainSelection.scatteringDensityPacking.positionCount,
				wavelengthCount:
					domainSelection.scatteringDensityPacking.wavelengthCount,
				scalarCount:
					domainSelection.scatteringDensityPacking.scalarCount,
			},
			maximumScatteringOrder: request.maximumScatteringOrder,
			planIdentity: plan.identity,
			planResult: plan.result,
			fields: plan.fields.map((field) => ({
				id: field.id,
				storage: field.storage,
				quantity: field.descriptor.quantity,
				units: field.descriptor.units,
				directionRole: field.descriptor.directionRole,
				order: field.descriptor.order,
				directionDomainId: field.descriptor.directionDomain.id,
				layout: field.descriptor.layout,
			})),
			passes: plan.passes.map((pass) => ({
				id: pass.id,
				kind: pass.kind,
				order: pass.order,
				inputs: pass.inputs,
				output: pass.output,
			})),
			probeScalarCount: 0,
			diagnostics: artifact.diagnostics,
		});

		const cache = new LocalSunCache(
			artifact,
			this._source.createResourceReport(plan, artifact.diagnostics),
		);
		const previous = this._active;
		this._active = cache;
		this._activeFingerprint = fingerprint;
		previous?.dispose();
		return cache;
	}

	get observedLastDomainSelection() {
		return this._observedLastDomainSelection;
	}

	get controlledLastDomainSelection() {
		return this._observedLastDomainSelection;
	}
}

/** Candidate finite/local Sun with observation-only F34 build records. */
export class ObservedFibonacci34LocalSunLightSource extends LocalSunLightSource {
	constructor(configuration) {
		super(configuration);
		this._observedBuildRecords = [];
	}

	createCacheController({backend, scheduler}) {
		const constructionSource = new LocalSunCacheSource({
			source: this,
			shellFactCache: this._constructionShellFactCache,
		});

		return new ObservedFibonacci34LocalSunCacheController({
			source: constructionSource,
			backend,
			scheduler,
			buildRecords: this._observedBuildRecords,
		});
	}

	observedDomainSelectionForGeometry(geometry) {
		return selectCandidateFibonacci34Domain(geometry);
	}

	controlledDomainSelectionForGeometry(geometry) {
		return this.observedDomainSelectionForGeometry(geometry);
	}

	get observedBuildRecords() {
		return this._observedBuildRecords;
	}

	get controlledBuildRecords() {
		return this._observedBuildRecords;
	}
}

export default ObservedFibonacci34LocalSunLightSource;
