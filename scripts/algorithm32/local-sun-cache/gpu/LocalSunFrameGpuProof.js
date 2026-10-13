import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {LocalSunFramePreparer} from '../../../../src/flat32/LocalSunFramePreparer.js';
import {LocalSunFrameController} from '../../../../src/algorithm32/implementation/local-sun/cache/frames/LocalSunFrameController.js';
import {createFlat32ColorDisplayModel} from '../../../../src/flat32/Flat32ColorDisplayModel.js';
import {LocalSunFrameGpuSamples} from './LocalSunFrameGpuSamples.js';

/** Actual ordinary shader/receiver preparation and canonical field reuse proof; outputs remain in new immutable host runs. */
export class LocalSunFrameGpuProof {
	/** Called by qualification to provide genuine Three scene/composer capabilities on the owned renderer.
	 *
	 * @param {LocalSunFrameGpuRenderer} renderer - External owned proof renderer.
	 * @param {Flat32SceneColorPrecision} precision - Exact offscreen compositor storage.
	 * @returns {LocalSunFrameGpuScene} - Real isolated frame resources and a bounded output reader.
	 */
	_createScene(renderer, precision) {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
		/** @type {Flat32AtmosphereComposerResources|null} */ let current = null;
		const capability = {
			scene,
			camera,
			renderer,
			viewportSize: {width: 4, height: 4, units: /** @type {const} */ ('pixels')},
			createAtmosphereComposer: () => {
				const renderTarget = new THREE.WebGLRenderTarget(4, 4, {
					type: precision === 'float16' ? THREE.HalfFloatType : THREE.FloatType,
					format: THREE.RGBAFormat,
				});
				const composer = new EffectComposer(renderer, renderTarget);
				const renderPass = new RenderPass(scene, camera);
				composer.setSize(4, 4);
				composer.addPass(renderPass);
				current = {composer, renderTarget, renderPass};
				return current;
			},
		};
		return {
			capability,
			readOutput: () => {
				if (!current) throw new Error('No actual composed frame');
				const values = new Float32Array(64);
				const previous = renderer.getRenderTarget(),
					context = renderer.getContext();
				try {
					renderer.setRenderTarget(current.composer.readBuffer);
					context.readPixels(0, 0, 4, 4, context.RGBA, context.FLOAT, values);
					if (context.getError() !== 0) throw new Error('Actual composed output readback failed');
				} finally {
					renderer.setRenderTarget(previous);
				}
				return Array.from(values);
			},
		};
	}

	/** Called by qualification to declare retained movement poses before observing candidate outputs.
	 *
	 * @param {LocalSunCompactConstructionProfile} profile - Accepted source/geometry family.
	 * @param {readonly LocalSunFrameGpuMovementState[]} movement - Authenticated historical observation/source controls.
	 * @returns {readonly LocalSunFrameGpuPose[]} - Explicit rotational/translation cases and actual day states.
	 */
	_poses(profile, movement) {
		const observation = profile.models.geometry.configuration.observation;
		/** @type {LocalSunFrameGpuPose[]} */ const poses = [];
		for (const degrees of [0, 17, 45, 90, 135, 180, 271]) {
			const angle = (degrees * Math.PI) / 180;
			poses.push({
				label: 'rotation-' + degrees,
				observation,
				sourcePosition: {coordinates: [2000, -1000, 4828032], units: 'meters'},
				receiverPosition: {
					coordinates: [
						2000 + 1000000 * Math.cos(angle) - 300000 * Math.sin(angle),
						-1000 + 1000000 * Math.sin(angle) + 300000 * Math.cos(angle),
						2,
					],
					units: 'meters',
				},
			});
		}
		for (const [index, [x, y]] of [
			[0, 0],
			[250, 0],
			[0, -1000],
			[10000, 10000],
		].entries())
			poses.push({
				label: 'translation-' + index,
				observation,
				sourcePosition: {coordinates: [x, y, 4828032], units: 'meters'},
				receiverPosition: {coordinates: [x + 1000000, y + 300000, 2], units: 'meters'},
			});
		for (const [index, state] of movement.entries())
			poses.push({
				label: 'exact-day-' + index,
				observation: state.observation,
				receiverPosition: state.receiverPosition,
				expectedSourcePosition: state.sourcePosition,
			});
		return poses;
	}

	/** Called by field qualification to verify every scalar and retain exact physical identity.
	 *
	 * @param {PreparedLocalSunFrame} frame - Published complete frame.
	 * @param {LocalSunGpuProofBackend} backend - Current opaque field reader.
	 * @param {LocalSunFrameGpuHashLabel} label - Exact independently constructed field identity.
	 * @returns {Promise<LocalSunFrameGpuHash>} - Complete field validity and identity.
	 */
	async _hash(frame, backend, label) {
		const lease = frame.borrowCache();
		try {
			const field = await backend.readRuntimeBindingField(lease.getRuntimeBindings().bindings[0]);
			let negative = 0;
			for (const value of field.values) {
				if (!Number.isFinite(value)) throw new Error('Canonical frame field is nonfinite');
				if (value < 0) negative++;
			}
			const buffer = field.values.buffer;
			if (!(buffer instanceof ArrayBuffer)) throw new Error('Owned whole-field readback buffer required');
			for (let offset = 0; offset < field.values.byteLength; offset += 2 * 1024 * 1024) {
				const body = new Uint8Array(
					buffer,
					field.values.byteOffset + offset,
					Math.min(2 * 1024 * 1024, field.values.byteLength - offset),
				);
				const response = await fetch('/frame-digest/' + label + '/' + offset, {method: 'POST', body});
				if (!response.ok) throw new Error('Complete field digest transfer failed');
			}
			const response = await fetch('/frame-digest/' + label);
			if (!response.ok) throw new Error('Whole-field digest unavailable');
			const digest = /** @type {LocalSunFrameGpuDigestReply} */ (await response.json());
			if (digest.bytes !== field.values.byteLength || !/^[a-f0-9]{64}$/.test(digest.sha256))
				throw new Error('Incomplete or invalid whole-field digest');
			return {sha256: digest.sha256, scalars: field.values.length, negative};
		} finally {
			lease.dispose();
		}
	}

	/** Called by paired comparisons to enforce the original absolute-plus-relative reuse gate.
	 *
	 * @param {readonly number[]} actual - Reused physical values.
	 * @param {readonly number[]} expected - Independently rebuilt field values at the same live state.
	 * @param {readonly number[]} floors - Per-value original absolute floors.
	 * @param {readonly number[]} [relatives] - Explicit per-value relative gates; endpoints use zero, other physical quantities default to 0.0001.
	 * @returns {LocalSunGpuScalarResidual} - Paired residuals; no tolerance is selected from observations.
	 */
	_compare(actual, expected, floors, relatives) {
		if (
			actual.length !== expected.length ||
			floors.length !== actual.length ||
			(relatives && relatives.length !== actual.length)
		)
			throw new Error('Paired quantity shape mismatch');
		const result = {count: actual.length, failures: 0, maximumRatio: 0, maximumAbsolute: 0};
		for (let index = 0; index < actual.length; index++) {
			const error = Math.abs(actual[index] - expected[index]),
				ratio = error / (floors[index] + (relatives?.[index] ?? 0.0001) * Math.abs(expected[index]));
			result.maximumAbsolute = Math.max(result.maximumAbsolute, error);
			result.maximumRatio = Math.max(result.maximumRatio, ratio);
			if (!Number.isFinite(ratio) || ratio > 1) result.failures++;
		}
		if (result.failures) throw new Error('Fresh/reused physical gate failed: ' + JSON.stringify(result));
		return result;
	}

	/** Called by exact display/adaptation comparisons where no physical tolerance has been selected.
	 *
	 * @param {readonly number[]} actual - Reused values.
	 * @param {readonly number[]} expected - Fresh-control values.
	 * @returns {LocalSunGpuScalarResidual} - Exact identity observations.
	 */
	_compareExact(actual, expected) {
		if (actual.length !== expected.length) throw new Error('Exact paired quantity shape mismatch');
		const result = {count: actual.length, failures: 0, maximumRatio: 0, maximumAbsolute: 0};
		for (let i = 0; i < actual.length; i++) {
			if (!Number.isFinite(actual[i]) || actual[i] !== expected[i]) result.failures++;
			result.maximumAbsolute = Math.max(result.maximumAbsolute, Math.abs(actual[i] - expected[i]));
		}
		if (result.failures) throw new Error('Exact rebuilt/reused display or adaptation identity failed');
		return result;
	}

	/** Called by actual backend instrumentation to reject excess payload before allocation.
	 *
	 * @param {LocalSunGpuCandidateState} state - Successful live handle accounting.
	 * @param {number} bytes - Candidate allocation payload.
	 * @param {number} reserved - External retained field and complete shader/composer/receiver reservation.
	 * @returns {void} - Admission, or explicit rejection before allocation.
	 */
	_admit(state, bytes, reserved) {
		if (state.allocatedBytes + bytes + reserved > 1600000000)
			throw new Error('Actual observed P3 payload would exceed the owned GPU ceiling');
	}

	/** Called by observed successful teardown to preserve idempotent actual owner accounting.
	 *
	 * @param {LocalSunGpuCandidateState} state - Live handles and bytes.
	 * @param {LocalSunGpuCandidateHandle} handle - Same real backend handle.
	 * @param {number} bytes - Owned payload.
	 * @param {LocalSunGpuCandidateHandle['dispose']} dispose - Original real disposer.
	 * @returns {void} - Underlying resource released before its accounting is removed.
	 */
	_releaseHandle(state, handle, bytes, dispose) {
		dispose();
		if (state.handles.delete(handle)) state.allocatedBytes -= bytes;
	}

	/** Called by backend instrumentation to observe the real resource without replacing numerical execution.
	 *
	 * @template {LocalSunGpuCandidateHandle} Handle
	 * @param {LocalSunGpuCandidateState} state - Live accounting.
	 * @param {Handle} handle - Original backend-owned handle.
	 * @param {number} bytes - Exact logical payload.
	 * @returns {Handle} - Same handle with successful teardown observed.
	 */
	_observeHandle(state, handle, bytes) {
		state.handles.add(handle);
		state.allocatedBytes += bytes;
		state.peakBytes = Math.max(state.peakBytes, state.allocatedBytes);
		const dispose = handle.dispose.bind(handle);
		handle.dispose = () => this._releaseHandle(state, handle, bytes, dispose);
		return handle;
	}

	/** Called by initial proof staging to construct both independent canonical fields before retaining compiler-heavy view programs.
	 * GPU construction remains serial; actual shader/receiver stages also serialize after the pair is ready.
	 *
	 * @param {LocalSunFramePreparer} preparer - Actual renderer-owned stage implementation.
	 * @param {LocalSunFrameStageRequest} request - Genuine exact-state candidate and cache lease.
	 * @param {LocalSunFrameGpuStageSequencer} state - Proof-owned initial pair gate and serialized stage tail.
	 * @returns {Promise<LocalSunPreparedFrameContents>} - Actual complete staged frame.
	 */
	async _stage(preparer, request, state) {
		request.signal.throwIfAborted();
		if (state.readyCount < 2) {
			state.readyCount++;
			if (state.readyCount === 1) state.releaseFirst();
			else state.releasePair();
			await state.pairReady;
		}
		request.signal.throwIfAborted();
		const operation = state.tail.then(() => preparer.prepare(request));
		state.tail = operation.then(
			() => {},
			() => {},
		);
		return operation;
	}

	/** Call this method to execute actual isolated shader/receiver stages and ordinary live cache lookup.
	 *
	 * @param {LocalSunFrameGpuProofRequest} request - Accepted profile, owned renderer/backend and retained external bytes.
	 * @returns {Promise<LocalSunFrameGpuProofReport>} - Actual preparation, publication and binding/resource evidence.
	 */
	async verify({
		profile,
		backend,
		renderer,
		retainedBytes,
		movement,
		expectedFieldHash,
		sceneColorPrecision = 'float32',
	}) {
		const reusedScene = this._createScene(renderer, sceneColorPrecision),
			freshScene = this._createScene(renderer, sceneColorPrecision);
		const configuration = {
			createColorModel: () => createFlat32ColorDisplayModel(),
			sceneScale: {value: 1, units: /** @type {const} */ ('meters-per-scene-unit')},
			sceneDepthMax: {value: 100000, units: /** @type {const} */ ('meters')},
		};
		const preparer = new LocalSunFramePreparer({...configuration, sceneRuntime: reusedScene.capability}),
			freshPreparer = new LocalSunFramePreparer({...configuration, sceneRuntime: freshScene.capability});
		/** @type {LocalSunFrameGpuStageSequencer} */ const stages = {
			readyCount: 0,
			tail: Promise.resolve(),
			firstReady: Promise.resolve(),
			pairReady: Promise.resolve(),
			releaseFirst: () => {},
			releasePair: () => {},
		};
		stages.firstReady = new Promise((resolve) => {
			stages.releaseFirst = resolve;
		});
		stages.pairReady = new Promise((resolve) => {
			stages.releasePair = resolve;
		});
		const controller = new LocalSunFrameController({
				backend,
				stageFrame: (request) => this._stage(preparer, request, stages),
			}),
			freshController = new LocalSunFrameController({
				backend,
				stageFrame: (request) => this._stage(freshPreparer, request, stages),
			});
		const fields = [];
		for (const id of profile.numerical.maximumScatteringOrder === 4
			? ['cumulative']
			: Array.from(
					{length: profile.numerical.maximumScatteringOrder},
					(_, index) => 'local-sun-j' + (index + 1),
				)) {
			const response = await fetch('/gold/' + id);
			if (!response.ok) throw new Error('Authenticated independent live controls unavailable');
			fields.push(new Float32Array(await response.arrayBuffer()));
		}
		const samples = new LocalSunFrameGpuSamples({backend, renderer, fields});
		const submit = backend.submitLayer.bind(backend);
		const allocate = backend.allocateField.bind(backend),
			compile = backend.compile.bind(backend),
			upload = backend.uploadImmutableTexture.bind(backend);
		/** @type {LocalSunGpuCandidateState} */ const ownership = {
			handles: new Set(),
			allocatedBytes: 0,
			peakBytes: 0,
		};
		const reserved = 32 * 1024 * 1024;
		backend.allocateField =
			/** Called by real construction to admit and observe its output allocation.
			 *
			 * @param {CacheFieldSpec} request - Actual owner-selected field storage.
			 * @returns {GpuCacheField} - Same real opaque field with successful disposal observed.
			 */ (request) => {
				const bytes = request.storage.width * request.storage.height * request.storage.layers * 4;
				this._admit(ownership, bytes, reserved);
				return this._observeHandle(ownership, allocate(request), bytes);
			};
		backend.compile =
			/** Called by real construction and receiver reduction to admit and observe program/data resources.
			 *
			 * @param {CacheShader} shader - Genuine owner-assembled shader and data.
			 * @returns {Promise<CacheGpuProgram>} - Same actual compiled program.
			 */ async (shader) => {
				const bytes =
					shader.bindings
						.filter((binding) => binding.spec.kind === 'data')
						.reduce(
							(sum, binding) => sum + /** @type {CacheDataBinding} */ (binding).value.values.length * 4,
							0,
						) + 36;
				this._admit(ownership, bytes, reserved);
				return this._observeHandle(ownership, await compile(shader), bytes);
			};
		backend.uploadImmutableTexture =
			/** Called by cache publication to admit and observe retained auxiliary textures.
			 *
			 * @param {CacheImmutableTextureUploadRequest} request - Actual immutable data allocation.
			 * @returns {CacheImmutableTexture} - Same real texture, with successful release observed.
			 */ (request) => {
				this._admit(ownership, request.values.byteLength, reserved);
				return this._observeHandle(ownership, upload(request), request.values.byteLength);
			};
		let submissions = 0,
			baselineHash,
			freshHash;
		backend.submitLayer = (request) => {
			if (request.output.id.startsWith('compact-')) submissions++;
			return submit(request);
		};
		const frames = [];
		try {
			for (const [index, pose] of this._poses(profile, movement).entries()) {
				console.log('P3 live frame ' + pose.label + '; prepare reused and independently rebuilt controls');
				const live = profile.createLiveProfile(pose);
				if (
					pose.expectedSourcePosition &&
					live.models.lightSource.configuration.position.coordinates.some(
						(value, i) => Math.abs(value - pose.expectedSourcePosition.coordinates[i]) > 1e-7,
					)
				)
					throw new Error('Public geometry day placement differs from frozen independent fixture');
				const before = controller.active;
				const preparationStarted = performance.now();
				const firstSubmissions = submissions;
				const request = {
					profile: live,
					viewRays: [
						{
							origin: live.models.geometry.configuration.observerPosition,
							direction: /** @type {UnitVector3} */ ([0, 0, 1]),
						},
					],
					presentationIdentity: 'p3-ordinary-preflight',
					otherOwnedGpuBytes: {
						value: retainedBytes + 32 * 1024 * 1024,
						units: /** @type {const} */ ('bytes'),
					},
				};
				let frame,
					freshFrame,
					prepareMilliseconds,
					freshPrepareMilliseconds,
					reusedSubmissions,
					freshSubmissions;
				if (index === 0) {
					const pending = controller.prepareLocalFrame(request);
					await Promise.race([stages.firstReady, pending.then(() => {})]);
					console.log(
						'P3 retained canonical field ready; constructing independent canonical control before view staging',
					);
					reusedSubmissions = submissions - firstSubmissions;
					const freshBefore = submissions,
						freshStarted = performance.now();
					const freshPending = freshController.prepareLocalFrame(request);
					try {
						[frame, freshFrame] = await Promise.all([pending, freshPending]);
					} catch (error) {
						stages.releasePair();
						throw error;
					}
					prepareMilliseconds = performance.now() - preparationStarted;
					freshPrepareMilliseconds = performance.now() - freshStarted;
					freshSubmissions = submissions - freshBefore;
				} else {
					frame = await controller.prepareLocalFrame(request);
					prepareMilliseconds = performance.now() - preparationStarted;
					reusedSubmissions = submissions - firstSubmissions;
					const freshBefore = submissions,
						freshStarted = performance.now();
					freshFrame = await freshController.prepareLocalFrame(request);
					freshPrepareMilliseconds = performance.now() - freshStarted;
					freshSubmissions = submissions - freshBefore;
				}
				console.log(
					'P3 reused and fresh complete ' + pose.label + '; field identity and physical samples next',
				);
				if (controller.active !== before) throw new Error('Preparation altered the displayed complete frame');
				if (index > 0 && reusedSubmissions !== 0)
					throw new Error('Admitted live motion rebuilt its canonical field');
				const publication = controller.publishPreparedLocalFrame(frame);
				if (publication.retirementErrors.length || controller.active !== frame)
					throw new Error('Complete ordinary frame publication failed.');
				const reusedOutput = reusedScene.readOutput();
				if (index === 0 && (freshSubmissions === 0 || reusedSubmissions === 0))
					throw new Error('Separate fresh construction was not executed');
				if (freshController.publishPreparedLocalFrame(freshFrame).retirementErrors.length)
					throw new Error('Independent frame retirement failed');
				if (index === 0) {
					baselineHash = await this._hash(frame, backend, 'retained');
					freshHash = await this._hash(freshFrame, backend, 'fresh');
					if (baselineHash.sha256 !== freshHash.sha256 || baselineHash.sha256 !== expectedFieldHash)
						throw new Error(
							'Complete independently rebuilt canonical fields differ from qualified baseline',
						);
				}
				const reusedSamples = await samples.sample(frame),
					freshSamples = await samples.sample(freshFrame);
				const sampleFloors = reusedSamples.values.map((_value, i) =>
					i % 3 === 2
						? 0.01
						: i % 3 === 1
							? 1e-7
							: reusedSamples.queries[Math.floor(i / 45)].mode === 0
								? 1e-12
								: 1e-9,
				);
				const physical = this._compare(
					reusedSamples.values,
					freshSamples.values,
					sampleFloors,
					reusedSamples.values.map((_value, index) => (index % 3 === 2 ? 0 : 0.0001)),
				);
				const lighting = frame.contents.receiverLight,
					freshLighting = freshFrame.contents.receiverLight;
				const receiverValues = [
						...lighting.directNormal.values,
						...lighting.directHorizontal.values,
						...lighting.diffuseHorizontal.values,
					],
					freshValues = [
						...freshLighting.directNormal.values,
						...freshLighting.directHorizontal.values,
						...freshLighting.diffuseHorizontal.values,
					];
				const receiver = this._compare(
					receiverValues,
					freshValues,
					receiverValues.map(() => 1e-9),
				);
				const adaptation = this._compareExact(
					[lighting.stellarAdaptationLuminance.value],
					[freshLighting.stellarAdaptationLuminance.value],
				);
				const output = this._compareExact(reusedOutput, freshScene.readOutput());
				const borrow = frame.borrowCache();
				try {
					frames.push({
						label: pose.label,
						identity: frame.identity,
						constructionIdentity: frame.constructionIdentity,
						sourcePosition: frame.contents.celestialInputs.sourcePosition,
						observation: pose.observation,
						receiverPosition: pose.receiverPosition,
						receiverIdentity: lighting.identity,
						bindings: borrow.getRuntimeBindings().bindings.length,
						priorHeldDuringPreparation: true,
						reusedSubmissions,
						freshSubmissions,
						prepareMilliseconds,
						freshPrepareMilliseconds,
						physical,
						receiver,
						adaptation,
						output,
						cpu: reusedSamples.cpu,
						endpoints: reusedSamples.endpoints,
						samples: reusedSamples.values,
						negativeSamples: reusedSamples.negative,
					});
				} finally {
					borrow.dispose();
				}
			}
			if (
				new Set(frames.map((frame) => frame.constructionIdentity)).size !== 1 ||
				new Set(frames.map((frame) => frame.identity)).size !== frames.length ||
				frames.some((frame) => frame.bindings !== 7)
			)
				throw new Error('Live identity/reuse contract failed.');
			controller.dispose();
			freshController.dispose();
			await Promise.all([controller.whenReleased(), freshController.whenReleased()]);
			if (ownership.handles.size || ownership.allocatedBytes)
				throw new Error('P3 frame resources leaked after final release');
			return {
				state: 'passed',
				sceneColorPrecision,
				frames,
				baselineHash,
				freshHash,
				ownership: {
					peakObservedPayloadBytes: ownership.peakBytes,
					reservedExternalAndFrameBytes: reserved,
					completeObservedAdmissionBytes: ownership.peakBytes + reserved,
					handlesAfterDisposal: ownership.handles.size,
					bytesAfterDisposal: ownership.allocatedBytes,
				},
				comparisonMeaning:
					'Separate fresh canonical construction, then identical qualified construction inputs shared within each control while all exact live poses are staged independently. CPU samples use immutable independently generated physical fields.',
			};
		} finally {
			stages.releasePair();
			samples.dispose();
			try {
				controller.dispose();
			} finally {
				freshController.dispose();
				backend.submitLayer = submit;
				backend.allocateField = allocate;
				backend.compile = compile;
				backend.uploadImmutableTexture = upload;
			}
			await Promise.all([controller.whenReleased(), freshController.whenReleased()]);
		}
	}
}
