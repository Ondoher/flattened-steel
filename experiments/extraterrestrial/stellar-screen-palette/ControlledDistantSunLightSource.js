import {DistantSunCacheController} from
	'../candidate/src/algorithm32/light-sources/DistantSunCacheController.js';
import {DistantSunCache} from
	'../candidate/src/algorithm32/light-sources/DistantSunCache.js';
import {DistantSunLightSource} from
	'../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import {createDistantSunCacheBuildPlan} from
	'../candidate/src/algorithm32/light-sources/distant-sun-cache-plan.js';
import {createDistantSunCacheFingerprint} from
	'../candidate/src/algorithm32/light-sources/distant-sun-cache-fingerprint.js';
import DistantSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/DistantSunConstructionDomainSelection.js';

function requireSelection(value) {
	if (!(value instanceof DistantSunConstructionDomainSelection)) {
		throw new TypeError(
			'Controlled distant-Sun source requires one candidate-compatible construction-domain selection.',
		);
	}
	return value;
}

/**
 * Preserve the candidate controller while injecting the one construction
 * domain that its public request currently drops. The selected plan, GPU
 * executor, cache wrapper, cancellation, publication, and runtime path remain
 * the unmodified contained candidate implementations.
 */
export class ControlledDistantSunCacheController extends DistantSunCacheController {
	constructor(request) {
		super(request);
		this._controlledDomainSelection = requireSelection(request.domainSelection);
		this._controlledProbeFactory = request.probeFactory ?? null;
		this._controlledBuildRecords = request.buildRecords;
	}

	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrentGeneration(generation, cancellation);
		const plan = createDistantSunCacheBuildPlan({
			source: this._source,
			atmosphere: request.atmosphere,
			geometry: request.geometry,
			groundBoundary: request.groundBoundary,
			maximumScatteringOrder: request.maximumScatteringOrder,
			domainSelection: this._controlledDomainSelection,
		});
		const fingerprint = createDistantSunCacheFingerprint(
			plan,
			this._backend.capabilities,
		);
		this._requireCurrentGeneration(generation, cancellation);

		if (this._active !== null && this._activeFingerprint === fingerprint) {
			return this._active;
		}

		const probes = this._controlledProbeFactory === null
			? []
			: this._controlledProbeFactory({
				plan,
				domainSelection: this._controlledDomainSelection,
				maximumScatteringOrder: request.maximumScatteringOrder,
			});
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
			policy: 'candidate-controller-single-domain-injection-v1',
			domainSelectionId: this._controlledDomainSelection.id,
			incomingDirectionDomainId:
				this._controlledDomainSelection.incomingDirectionDomain.id,
			incomingDirectionDomainContentHash:
				this._controlledDomainSelection.incomingDirectionDomain.contentHash,
			incomingDirectionCount:
				this._controlledDomainSelection.incomingDirectionCount,
			outgoingDirectionDomainId:
				this._controlledDomainSelection.outgoingDirectionDomain.id,
			outgoingDirectionCount:
				this._controlledDomainSelection.outgoingDirectionCount,
			positionDomainId:
				this._controlledDomainSelection.positionDomain.id,
			positionCount: this._controlledDomainSelection.positionCount,
			maximumScatteringOrder: request.maximumScatteringOrder,
			planIdentity: plan.identity,
			planResult: plan.result,
			fields: plan.fields.map((field) => ({
				id: field.id,
				storage: field.storage,
				descriptorContentHash: field.descriptor.contentHash,
				descriptor: {
					kind: field.descriptor.kind,
					schemaRevision: field.descriptor.schemaRevision,
					quantity: field.descriptor.quantity,
					units: field.descriptor.units,
					directionRole: field.descriptor.directionRole,
					sampleSemantics: field.descriptor.sampleSemantics,
					order: field.descriptor.order,
					precision: field.descriptor.precision,
					provenanceIdentity:
						field.descriptor.provenanceIdentity,
					basis: {
						id: field.descriptor.basis.id,
						contentHash: field.descriptor.basis.contentHash,
					},
					positionDomain: {
						id: field.descriptor.positionDomain.id,
						contentHash:
							field.descriptor.positionDomain.contentHash,
					},
					directionDomain: {
						id: field.descriptor.directionDomain.id,
						contentHash:
							field.descriptor.directionDomain.contentHash,
					},
					layout: {
						id: field.descriptor.layout.id,
						contentHash: field.descriptor.layout.contentHash,
					},
				},
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

		const cache = new DistantSunCache(artifact);
		const previous = this._active;
		this._active = cache;
		this._activeFingerprint = fingerprint;
		previous?.dispose();
		return cache;
	}
}

/** A candidate distant Sun whose sole experimental policy is one fixed domain. */
export class ControlledDistantSunLightSource extends DistantSunLightSource {
	constructor(configuration, control) {
		super(configuration);
		this._controlledDomainSelection = requireSelection(control.domainSelection);
		this._controlledProbeFactory = control.probeFactory ?? null;
		this._controlledBuildRecords = [];
	}

	createCacheController({backend, scheduler}) {
		return new ControlledDistantSunCacheController({
			source: this,
			backend,
			scheduler,
			domainSelection: this._controlledDomainSelection,
			probeFactory: this._controlledProbeFactory,
			buildRecords: this._controlledBuildRecords,
		});
	}

	get controlledDomainSelection() {
		return this._controlledDomainSelection;
	}

	get controlledBuildRecords() {
		return this._controlledBuildRecords;
	}
}
