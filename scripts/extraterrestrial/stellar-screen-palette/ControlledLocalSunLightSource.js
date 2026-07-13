import {LocalSunCache} from
	'../candidate/src/algorithm32/light-sources/LocalSunCache.js';
import {LocalSunCacheController} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheController.js';
import {LocalSunCacheSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheSource.js';
import {LocalSunLightSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunLightSource.js';
import {createLocalSunCacheFingerprint} from
	'../candidate/src/algorithm32/light-sources/local-sun-cache-fingerprint.js';
import {createLocalSunCacheBuildPlan} from
	'../candidate/src/algorithm32/light-sources/local-sun-cache-plan.js';
import {
	CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY,
	ControlledLocalSunConstructionDomainSelection,
} from './ControlledLocalSunConstructionDomainSelection.js';

function requireControlledSelection(value) {
	if (!(value instanceof ControlledLocalSunConstructionDomainSelection)) {
		throw new TypeError(
			'Controlled local-Sun source requires the contained reflection-completed-Fibonacci-68 construction-domain selection.',
		);
	}
	return value;
}

function createDomainSelectionFactory(control) {
	if (control.domainSelectionFactory !== undefined) {
		if (typeof control.domainSelectionFactory !== 'function') {
			throw new TypeError('domainSelectionFactory must be a function.');
		}
		return (geometry) => requireControlledSelection(
			control.domainSelectionFactory(geometry),
		);
	}

	const selectionOptions = control.selectionOptions ?? {};
	return (geometry) =>
		ControlledLocalSunConstructionDomainSelection.fromGeometry(
			geometry,
			selectionOptions,
		);
}

/** Build the unchanged candidate graph with the explicit contained selection. */
export function createControlledLocalSunCacheBuildPlan(request) {
	const domainSelection = requireControlledSelection(
		request.domainSelection
			?? ControlledLocalSunConstructionDomainSelection.fromGeometry(
				request.geometry,
				request.selectionOptions,
			),
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
 * Preserve the candidate local-Sun controller while injecting one explicit
 * reflection-completed incoming quadrature into its otherwise unchanged GPU
 * construction plan.
 */
export class ControlledLocalSunCacheController extends LocalSunCacheController {
	constructor(request) {
		super(request);
		this._controlledDomainSelectionFactory =
			request.domainSelectionFactory;
		this._controlledProbeFactory = request.probeFactory ?? null;
		this._controlledBuildRecords = request.buildRecords;
		this._controlledLastDomainSelection = null;
	}

	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrentGeneration(generation, cancellation);
		const domainSelection = requireControlledSelection(
			this._controlledDomainSelectionFactory(request.geometry),
		);
		this._controlledLastDomainSelection = domainSelection;
		const controlledBuild = createControlledLocalSunCacheBuildPlan({
			source: this._source,
			atmosphere: request.atmosphere,
			geometry: request.geometry,
			groundBoundary: request.groundBoundary,
			maximumScatteringOrder: request.maximumScatteringOrder,
			domainSelection,
		});
		const plan = controlledBuild.plan;
		const fingerprint = createLocalSunCacheFingerprint(
			plan,
			this._backend.capabilities,
		);
		this._requireCurrentGeneration(generation, cancellation);

		if (this._active !== null && this._activeFingerprint === fingerprint) {
			return this._active;
		}

		const probes = this._controlledProbeFactory === null
			? []
			: (this._controlledProbeFactory({
				plan,
				domainSelection,
				maximumScatteringOrder: request.maximumScatteringOrder,
			}) ?? []);
		const artifact = await this._executor.execute(plan, {
			scheduler: this._scheduler,
			signal: cancellation.signal,
			...(probes.length === 0 ? {} : {
				probes,
				probeReader: this._backend,
			}),
		});
		try {
			this._requireCurrentGeneration(generation, cancellation);
		} catch (error) {
			artifact.dispose();
			throw error;
		}

		this._controlledBuildRecords.push({
			policy: CONTROLLED_LOCAL_SUN_FIBONACCI68_POLICY.id,
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
				directionCount: domainSelection.radiancePacking.directionCount,
				positionCount: domainSelection.radiancePacking.positionCount,
				wavelengthCount: domainSelection.radiancePacking.wavelengthCount,
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
			probeScalarCount: probes.reduce(
				(total, probe) => total + probe.coordinates.length,
				0,
			),
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

	get controlledLastDomainSelection() {
		return this._controlledLastDomainSelection;
	}
}

/**
 * A candidate finite/local Sun whose sole experimental transport policy is
 * the fixed contained reflection-completed incoming quadrature.
 */
export class ControlledLocalSunLightSource extends LocalSunLightSource {
	constructor(configuration, control = {}) {
		super(configuration);
		this._controlledDomainSelectionFactory =
			createDomainSelectionFactory(control);
		this._controlledProbeFactory = control.probeFactory ?? null;
		this._controlledBuildRecords = [];
	}

	createCacheController({backend, scheduler}) {
		const constructionSource = new LocalSunCacheSource({
			source: this,
			shellFactCache: this._constructionShellFactCache,
		});

		return new ControlledLocalSunCacheController({
			source: constructionSource,
			backend,
			scheduler,
			domainSelectionFactory:
				this._controlledDomainSelectionFactory,
			probeFactory: this._controlledProbeFactory,
			buildRecords: this._controlledBuildRecords,
		});
	}

	controlledDomainSelectionForGeometry(geometry) {
		return this._controlledDomainSelectionFactory(geometry);
	}

	get controlledBuildRecords() {
		return this._controlledBuildRecords;
	}
}
