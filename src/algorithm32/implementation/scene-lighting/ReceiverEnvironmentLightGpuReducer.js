import {CacheValues} from '../../gpu-cache-runtime/CacheValues.js';
import {GpuFieldExecutor} from '../../gpu-cache-runtime/GpuFieldExecutor.js';
import {CacheBuildModules} from '../../shader-assembly/cache-pass/CacheBuildModules.js';
import {CachePassAssembler} from '../../shader-assembly/cache-pass/CachePassAssembler.js';
import {SPECTRAL_QUANTITIES, SPECTRAL_UNITS, SpectralPacket} from '../../spectral-values/index.js';
import {RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE} from './ReceiverEnvironmentLightQuadrature.js';

const FIELD_ID = 'receiver-environment-light-irradiance';
const VALUE_KEY = 'lighting.receiverEnvironmentIrradiance';

/** GPU implementation of the fixed native-basis radiance-to-irradiance reduction. */
export class ReceiverEnvironmentLightGpuReducer {
	/** Creates a reducer with optional runtime-owned program retention.
	 *
	 * @param {ReceiverEnvironmentLightReducerDependencies} dependencies - External renderer backend and retention policy.
	 */
	constructor({backend, retainProgram = false}) {
		if (
			backend?.capabilities?.scalarFormat !== 'R32F' ||
			backend.capabilities.supportsArrayRenderTargets !== true
		) {
			throw new RangeError('Receiver environment-light GPU reducer requires an R32F array backend.');
		}
		this._backend = backend;
		this._retainProgram = retainProgram;
	}

	/** @type {CacheGpuBackend & CacheProbeReader} */ _backend;
	/** Retained compiled reduction program, independent of transient fields. @type {CacheGpuProgram | null} */
	_program = null;
	/** Terminal owner lifecycle. */ _disposed = false;

	/**
	 * Reduce exactly one radiance per canonical direction to native spectral irradiance.
	 *
	 * @param {ReceiverEnvironmentLightGpuReductionRequest} request - Batch result from common transport.
	 * @returns {Promise<SpectralIrradiancePacket>} - GPU-reduced receiver irradiance.
	 */
	async reduce(request) {
		if (this._disposed) throw new Error('Receiver environment-light GPU reducer is disposed.');
		request.signal?.throwIfAborted();
		if (
			!Array.isArray(request?.radiances) ||
			request.radiances.length !== RECEIVER_ENVIRONMENT_LIGHT_QUADRATURE.length
		) {
			throw new RangeError(
				'Receiver environment-light GPU reduction requires one radiance per quadrature direction.',
			);
		}
		const first = /** @type {SpectralRadiancePacket} */ (
			SpectralPacket.assert(request.radiances[0], {
				quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
				units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			})
		);
		const channelCount = first.basis.channelCount;
		const packedValues = new Float32Array(request.radiances.length * channelCount);
		for (const [directionIndex, candidate] of request.radiances.entries()) {
			const radiance = /** @type {SpectralRadiancePacket} */ (
				SpectralPacket.assert(candidate, {
					quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
					units: SPECTRAL_UNITS.RADIANCE_DENSITY,
				})
			);
			if (radiance.basis.contentHash !== first.basis.contentHash) {
				throw new TypeError('Receiver environment-light GPU radiances must share one spectral basis.');
			}
			for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
				packedValues[channelIndex * request.radiances.length + directionIndex] = radiance.values[channelIndex];
			}
		}
		const packed = CacheValues.createData({
			id: 'receiver-environment-light-radiance-batch-v1',
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			shape: [request.radiances.length, 1, channelCount],
			values: packedValues,
		});
		const output = {
			id: FIELD_ID,
			storage: {format: /** @type {const} */ ('R32F'), width: 1, height: 1, layers: channelCount},
		};
		const module = CacheBuildModules.createBuildModule({
			id: 'receiver-environment-light-gpu-reduction-module-v1',
			owner: 'cache',
			provides: ['lighting.receiverEnvironmentIrradiance'],
			requires: [],
			bindings: [
				{
					spec: {
						id: 'receiver-environment-radiance-batch',
						name: 'uReceiverEnvironmentRadiance',
						kind: 'data',
						shaderType: 'sampler2DArray',
						frequency: 'build',
					},
					value: packed,
				},
			],
			blocks: [
				{
					id: 'receiver-environment-light-gpu-reduction-main',
					phase: 'main',
					order: 0,
					source: `float irradiance = 0.0;
for (int directionIndex = 0; directionIndex < ${request.radiances.length}; directionIndex += 1) {
	irradiance += texelFetch(uReceiverEnvironmentRadiance, ivec3(directionIndex, 0, a32CacheWavelengthLayer), 0).r;
}
a32CacheOutput = irradiance * ${Math.PI / request.radiances.length};`,
				},
			],
		});
		const pass = {
			id: 'receiver-environment-light-gpu-reduction',
			kind: /** @type {const} */ ('transport'),
			order: /** @type {const} */ (1),
			inputs: [],
			output: FIELD_ID,
			modules: [module],
		};
		const plan = {
			fields: [output],
			passes: [pass],
			result: FIELD_ID,
			valueKey: /** @type {CacheRuntimeValueKey} */ (VALUE_KEY),
		};
		const coordinates = Array.from({length: channelCount}, (_, wavelengthIndex) => ({
			directionIndex: 0,
			positionIndex: 0,
			wavelengthIndex,
		}));
		const executor = new GpuFieldExecutor({backend: this._backend, assembler: new CachePassAssembler()});
		let artifact;
		try {
			if (this._retainProgram && !this._program) {
				const candidate = await this._backend.compile(new CachePassAssembler().assemble(pass, output));
				if (this._disposed || request.signal?.aborted) {
					candidate.dispose();
					throw new Error('Receiver reduction preparation was canceled.');
				}
				// Another first-use request may have retained the same GL program while compilation yielded.
				if (this._program) candidate.dispose();
				else this._program = candidate;
			}
			artifact = await executor.execute(plan, {
				signal: request.signal,
				probeReader: this._backend,
				probes: [{field: FIELD_ID, coordinates}],
			});
			const probe = artifact.diagnostics.passes[0].probe;
			if (!probe || probe.samples.length !== channelCount)
				throw new Error('Receiver environment-light GPU reduction did not return its native channels.');
			return /** @type {SpectralIrradiancePacket} */ (
				new SpectralPacket({
					basis: first.basis,
					quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
					units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
					semantics: first.semantics,
					values: probe.samples.map((sample) => sample.value),
					provenanceIdentity: `receiver-environment-light-gpu:${packed.contentHash}`,
				})
			);
		} finally {
			artifact?.dispose();
			executor.dispose();
		}
	}

	/** Call this method to release an explicitly retained program after its runtime retires.
	 *
	 * @returns {void}
	 */
	dispose() {
		this._disposed = true;
		this._program?.dispose();
		this._program = null;
	}
}
