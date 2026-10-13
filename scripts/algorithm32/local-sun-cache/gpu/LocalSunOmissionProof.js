import {CacheGpuExecutor} from '../../../../src/algorithm32/gpu-cache-runtime/CacheGpuExecutor.js';
import {CachePassAssembler} from '../../../../src/algorithm32/shader-assembly/cache-pass/CachePassAssembler.js';
import {CacheBuildModules} from '../../../../src/algorithm32/shader-assembly/cache-pass/CacheBuildModules.js';
import {CacheValues} from '../../../../src/algorithm32/gpu-cache-runtime/CacheValues.js';
import {LocalSunCompactGpuPlan} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactGpuPlan.js';

/** Equivalent unculled control retaining proven empty bands without changing occupied numerical equations. */
export class LocalSunOmissionProof {
	/** Call this method to prove exact occupied-field identity and exact-zero omitted slots.
	 *
	 * @param {LocalSunOmissionProofRequest} request - Genuine compact graph, actual backend and frozen compact hashes.
	 * @returns {Promise<LocalSunOmissionProofReport>} - Exact identities and logical allocation/dispatch accounting.
	 */
	async verify({profile, backend, compactHashes, retainedBytes}) {
		let topology = profile.domains.topology;
		let emptySlots = topology.omittedBands.length * topology.rows.length;
		for (let bandId of topology.omittedBands) {
			let band = topology.bands[bandId];
			if (band.admitted || band.outerRadius.value >= topology.sourceHeight.value - topology.atmosphereTop.value)
				throw new Error('Omission is not strictly empty');
		}
		let owned = new LocalSunCompactGpuPlan(profile);
		let compact = owned.createBuildPlan();
		let fields = compact.fields.map((field) => ({
			...field,
			storage: {...field.storage, height: field.storage.height + emptySlots},
		}));
		let guard = CacheBuildModules.createBuildModule({
			id: 'proof-empty-band-guard',
			owner: 'cache',
			provides: ['proof.emptyBandGuard'],
			requires: [],
			bindings: [],
			blocks: [
				{
					id: 'proof-empty-band-guard-main',
					phase: 'main',
					order: -100,
					source: `if(int(gl_FragCoord.y)>=${topology.positionCount}) {a32CacheOutput=0.0;return;}`,
				},
			],
		});
		let passes = compact.passes.map((pass) => ({
			...pass,
			modules: [
				...pass.modules.map((module) =>
					module.blocks.some((block) => block.phase === 'main')
						? CacheBuildModules.createBuildModule({
								...module,
								requires: [...module.requires, 'proof.emptyBandGuard'],
							})
						: module,
				),
				guard,
			],
		}));
		let plan = {
			fields,
			passes,
			result: compact.result,
			identity: CacheValues.createPlanIdentity('proof-equivalent-unculled-v1', fields, passes, {
				occupiedProfile: profile.contentHash,
			}),
		};
		let scattering = fields[0].storage.width * fields[0].storage.height * 15 * 4;
		let incoming = 1920 * fields[0].storage.height * 15 * 4;
		let estimate = 3 * scattering + incoming + 33592320 + retainedBytes + 8 * 1024 ** 2;
		if (estimate > 1600000000) throw new Error('Unculled control exceeds P0 admission');
		let pending = [],
			observations = [];
		let originalSubmit = backend.submitLayer.bind(backend),
			originalCompile = backend.compile.bind(backend);
		backend.compile = async (shader) => {
			await Promise.all(pending);
			pending = [];
			return originalCompile(shader);
		};
		backend.submitLayer = (request) => {
			originalSubmit(request);
			if (request.layer !== request.output.storage.layers - 1 || !compactHashes.has(request.output.id)) return;
			let binding = backend.createRuntimeBinding({
				field: request.output,
				valueKey: 'cache.cumulativeScatteringDensity',
			});
			pending.push(
				backend.readRuntimeBindingField(binding).then(async (field) => {
					let occupied = new Float32Array(field.storage.width * topology.positionCount * 15);
					let emptyNonzero = 0,
						nonfinite = 0;
					for (let channel = 0; channel < 15; channel++) {
						let offset = channel * field.storage.width * field.storage.height;
						occupied.set(
							field.values.subarray(offset, offset + topology.positionCount * field.storage.width),
							channel * topology.positionCount * field.storage.width,
						);
						for (
							let index = offset + topology.positionCount * field.storage.width;
							index < offset + field.storage.width * field.storage.height;
							index++
						)
							if (field.values[index] !== 0) emptyNonzero++;
					}
					for (let value of field.values) if (!Number.isFinite(value)) nonfinite++;
					let sha256 = Array.from(
						new Uint8Array(await crypto.subtle.digest('SHA-256', occupied.buffer)),
						(value) => value.toString(16).padStart(2, '0'),
					).join('');
					if (sha256 !== compactHashes.get(request.output.id) || emptyNonzero || nonfinite)
						throw new Error('Exact occupied omission identity failed ' + request.output.id);
					observations.push({
						id: request.output.id,
						sha256,
						emptyNonzero,
						nonfinite,
						occupiedScalars: occupied.length,
						emptyScalars: emptySlots * field.storage.width * 15,
					});
					console.log('exact unculled identity ' + request.output.id);
				}),
			);
		};
		let executor = new CacheGpuExecutor({backend, assembler: new CachePassAssembler()}),
			artifact;
		try {
			artifact = await executor.execute(plan, {
				scheduler: {yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0))},
			});
			await Promise.all(pending);
			return {
				occupiedNodes: topology.positionCount,
				emptySlots,
				totalPositions: topology.positionCount + emptySlots,
				observations,
				resources: artifact.diagnostics.memory,
				estimatedOwnedBytes: estimate,
			};
		} finally {
			artifact?.dispose();
			executor.dispose();
			backend.compile = originalCompile;
			backend.submitLayer = originalSubmit;
		}
	}
}
