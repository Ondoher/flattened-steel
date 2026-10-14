import * as THREE from 'three';
import {FlatEarthGeometry} from '../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '../../../../src/algorithm32/implementation/local-sun/LocalSunLightSource.js';
import {CanonicalAtmosphere} from '../../../../src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunCompactConstructionProfile} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactConstructionProfile.js';
import {ThreeCacheBackend} from '../../../../src/algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {LocalSunCompactCache} from '../../../../src/algorithm32/implementation/local-sun/cache/LocalSunCompactCache.js';
import {Algorithm32} from '../../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {LocalSunRuntimeProof} from './LocalSunRuntimeProof.js';
import {LocalSunOmissionProof} from './LocalSunOmissionProof.js';
import {LocalSunGpuCleanupProof} from './LocalSunGpuCleanupProof.js';
import {LocalSunFrameGpuProof} from './LocalSunFrameGpuProof.js';

/** Production GPU construction and ordinary-cache proof entry used only by the bounded offline host. */
export class LocalSunGpuBrowserProof {
	/** Call this method to construct and qualify the selected GPU/consumer control in the owned browser.
	 *
	 * @param {LocalSunGpuBrowserProofRequest} request - Authenticated physical controls and bounded qualification mode.
	 * @returns {Promise<LocalSunGpuBrowserProofReport>} - Complete physical comparisons and logical resources.
	 */
	async verify({
		p0,
		controls,
		order,
		full,
		runtime,
		omission,
		cleanup,
		reuse = false,
		movement = [],
		qualifiedFieldHash,
		sourceScale = 1,
		sceneColorPrecision = 'float32',
		trajectoryPoses,
	}) {
		let spatial = p0.controls;
		let geometry = new FlatEarthGeometry({
			topAltitude: {value: spatial.geometry.atmosphereTop.value, units: 'meters'},
			localLightSourceHeight: {value: spatial.geometry.sourceHeight.value, units: 'meters'},
			projectionRadius: {value: 6360000, units: 'meters'},
		});
		let lightSource = new LocalSunLightSource({
			sourceKey: 'compact-gpu-proof',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: sourceScale,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
		});
		/** @type {GeometryObservation} */ let observation = {
			instant: '2024-12-14T17:27:41.487Z',
			location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
		};
		geometry.configureLightSource({
			lightSource,
			observation,
			placement: {
				kind: 'finite-position',
				position: {coordinates: [0, 0, spatial.geometry.sourceHeight.value], units: 'meters'},
			},
		});
		let profile = new LocalSunCompactConstructionProfile({
			geometry,
			atmosphere: new CanonicalAtmosphere(),
			lightSource,
			groundBoundary: null,
			maximumScatteringOrder: order,
			topologyControls: {
				coverageRadius: {value: spatial.geometry.coverageRadius.value, units: 'meters'},
				altitudes: spatial.rows.map((row) => ({
					value: row.altitude.value,
					units: /** @type {const} */ ('meters'),
				})),
				bandRadii: [spatial.bands[0].innerRadius, ...spatial.bands.map((band) => band.outerRadius)].map(
					(value) => ({value: value.value, units: /** @type {const} */ ('meters')}),
				),
				boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			},
			provenanceIdentity: 'p0:74a7cb03:production-gpu-proof',
		});
		let algorithm = new Algorithm32({profile: profile.createExecutionProfile()});
		let canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		let renderer = new THREE.WebGLRenderer({canvas, context: canvas.getContext('webgl2', {antialias: false})});
		renderer.setSize(4, 4, false);
		let backend = new ThreeCacheBackend({THREE, renderer});
		let context = renderer.getContext();
		let debug = context.getExtension('WEBGL_debug_renderer_info');
		let rendererName = String(context.getParameter(debug?.UNMASKED_RENDERER_WEBGL ?? context.RENDERER));
		/** @type {LocalSunGpuRendererIdentity} */
		let rendererIdentity = {
			version: String(context.getParameter(context.VERSION)),
			vendor: String(context.getParameter(debug?.UNMASKED_VENDOR_WEBGL ?? context.VENDOR)),
			renderer: rendererName,
			assessment: /SwiftShader|Microsoft Basic Render|llvmpipe|software/i.test(rendererName)
				? 'software'
				: 'unknown',
		};
		let controller;
		/** @type {LocalSunGpuFieldObservation[]} */ let observations = [];
		let pending = [];
		let failures = 0;
		let started = performance.now();
		let compile = backend.compile.bind(backend);
		let submit = backend.submitLayer.bind(backend);
		backend.compile =
			/** Called by the executor to drain field comparisons before releasing their predecessors.
			 * Rejection of a pending comparison prevents further construction.
			 *
			 * @param {CacheShader} shader - Next owner-assembled shader.
			 * @returns {Promise<CacheGpuProgram>} - Owned compiled program after comparison completion.
			 */ async (shader) => {
				await Promise.all(pending);
				pending = [];
				return compile(shader);
			};
		backend.submitLayer =
			/** Called by the executor to submit a real layer and observe each completed physical field.
			 * Comparisons reject through the queued promise; no expected data constructs the candidate.
			 *
			 * @param {CacheLayerSubmission} request - Actual output field, pass and wavelength layer.
			 * @returns {void} - Real submission followed by queued complete-field comparison.
			 */ (request) => {
				submit(request);
				if (request.layer !== request.output.storage.layers - 1) return;
				let id = request.output.id;
				if (!/^compact-(j[1-4]|l[1-3]|j-through-[124])$/.test(id)) return;
				let binding = backend.createRuntimeBinding({
					field: request.output,
					valueKey: 'cache.cumulativeScatteringDensity',
				});
				pending.push(
					backend.readRuntimeBindingField(binding).then(
						/** Called by readback completion to qualify physical scalars and optionally export a new candidate payload.
						 * Rejection records a failed proof and prevents subsequent graph execution.
						 *
						 * @param {CacheScalarFieldReadback} field - Complete actual R32F field.
						 * @returns {Promise<void>} - Comparisons and selected new-run export completion.
						 */ async (field) => {
							let nonfinite = 0,
								negative = 0;
							for (let value of field.values) {
								if (!Number.isFinite(value)) nonfinite++;
								if (value < 0) negative++;
							}
							let sha256 = Array.from(
								new Uint8Array(await crypto.subtle.digest('SHA-256', field.values.slice().buffer)),
								(value) => value.toString(16).padStart(2, '0'),
							).join('');
							let gold = controls.controls.find((control) => control.id === 'local-sun-' + id.slice(8));
							let comparison = {count: 0, failures: 0, maximumRatio: 0, maximumAbsolute: 0};
							if (gold)
								for (let position of gold.selected)
									for (let [index, spectrum] of position.values.entries())
										for (let channel = 0; channel < 15; channel++) {
											let direction = gold.id.includes('-l') ? index : gold.directions[index];
											let actual =
												field.values[
													(channel * field.storage.height + position.positionIndex) *
														field.storage.width +
														direction
												];
											let expected = spectrum[channel] * sourceScale;
											let error = Math.abs(actual - expected),
												ratio =
													error /
													((gold.id.includes('-l') ? 1e-9 : 1e-12) +
														0.002 * Math.abs(expected));
											comparison.count++;
											comparison.maximumRatio = Math.max(comparison.maximumRatio, ratio);
											comparison.maximumAbsolute = Math.max(comparison.maximumAbsolute, error);
											if (!Number.isFinite(ratio) || ratio > 1) comparison.failures++;
										}
							if (sourceScale === 0) {
								comparison.count = field.values.length;
								comparison.failures = field.values.reduce(
									(sum, value) => sum + (value === 0 ? 0 : 1),
									0,
								);
							}
							failures += nonfinite + comparison.failures;
							if (full) {
								let ids = id.startsWith('compact-j-through-')
									? Number(id.split('-').at(-1)) === 4
										? ['cumulative']
										: Array.from(
												{length: Number(id.split('-').at(-1))},
												(_, index) => 'local-sun-j' + (index + 1),
											)
									: ['local-sun-' + id.slice(8)];
								let expected = [];
								for (let goldId of ids) {
									let reply = await fetch('/gold/' + goldId);
									if (!reply.ok) throw new Error('Whole-field control unavailable');
									expected.push(new Float32Array(await reply.arrayBuffer()));
								}
								comparison.whole = {
									count: field.values.length,
									failures: 0,
									maximumRatio: 0,
									worstIndex: -1,
								};
								for (let index = 0; index < field.values.length; index++) {
									let value = expected.reduce((sum, values) => sum + values[index], 0);
									let ratio =
										Math.abs(field.values[index] - value) /
										((id.includes('-l') ? 1e-9 : 1e-12) + 0.002 * Math.abs(value));
									if (ratio > comparison.whole.maximumRatio) {
										comparison.whole.maximumRatio = ratio;
										comparison.whole.worstIndex = index;
									}
									if (!Number.isFinite(ratio) || ratio > 1) comparison.whole.failures++;
								}
								failures += comparison.whole.failures;
								let bytes = new Uint8Array(
									field.values.buffer,
									field.values.byteOffset,
									field.values.byteLength,
								);
								for (let offset = 0; offset < bytes.length; offset += 4194304) {
									let reply = await fetch('/field/' + id + '/' + offset, {
										method: 'POST',
										body: bytes.slice(offset, Math.min(offset + 4194304, bytes.length)),
									});
									if (!reply.ok) throw new Error('Candidate export failed');
								}
							}
							observations.push({id, storage: field.storage, nonfinite, negative, sha256, comparison});
							console.log(JSON.stringify(observations.at(-1)));
						},
					),
				);
			};
		try {
			console.log('profile accepted; GPU graph preparation N' + order);
			controller = lightSource.createCacheController({
				model: algorithm._model,
				backend,
				scheduler: {yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0))},
			});
			let cache = await controller.createScatteringCache({
				otherOwnedGpuBytes: {value: runtime ? 8 * 1024 ** 2 : 0, units: 'bytes'},
			});
			await Promise.all(pending);
			if (!(cache instanceof LocalSunCompactCache)) throw new Error('Ordinary compact cache required');
			if (failures) throw new Error('GPU physical comparisons failed: ' + failures);
			/** @type {LocalSunGpuBrowserProofReport} */ let result = {
				state: 'passed',
				order,
				observations,
				resources: cache.resources,
				milliseconds: performance.now() - started,
				capabilities: backend.capabilities,
				rendererIdentity,
				profileHash: profile.contentHash,
				runtimeBindings: cache.getRuntimeBindings().bindings.length,
				glError: renderer.getContext().getError(),
			};
			if (runtime)
				result.runtime = await new LocalSunRuntimeProof().verify({
					profile,
					model: algorithm._model,
					cache,
					backend,
					renderer,
					order,
				});
			if (omission) {
				backend.compile = compile;
				backend.submitLayer = submit;
				result.omission = await new LocalSunOmissionProof().verify({
					profile,
					backend,
					compactHashes: new Map(observations.map((observation) => [observation.id, observation.sha256])),
					retainedBytes:
						cache.resources.executor.residentFieldStorage.value +
						cache.resources.retainedAuxiliaryBytes.value,
				});
			}
			if (cleanup) {
				backend.compile = compile;
				backend.submitLayer = submit;
				result.cleanup = await new LocalSunGpuCleanupProof().verify({
					backend,
					priorCache: cache,
					createProfile:
						/** Called by cleanup qualification to create an independently owned candidate with the same accepted physical controls.
						 *
						 * @param {SupportedCacheScatteringOrder} maximum - Requested candidate truncation.
						 * @returns {LocalSunCompactConstructionProfile} - Genuine new profile; prior cache is unchanged.
						 */ (maximum) =>
							new LocalSunCompactConstructionProfile({
								geometry,
								atmosphere: profile.models.atmosphere,
								lightSource,
								groundBoundary: null,
								maximumScatteringOrder: maximum,
								topologyControls: {
									coverageRadius: {value: spatial.geometry.coverageRadius.value, units: 'meters'},
									altitudes: spatial.rows.map((row) => ({
										value: row.altitude.value,
										units: /** @type {const} */ ('meters'),
									})),
									bandRadii: [
										spatial.bands[0].innerRadius,
										...spatial.bands.map((band) => band.outerRadius),
									].map((value) => ({value: value.value, units: /** @type {const} */ ('meters')})),
									boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
								},
								provenanceIdentity: 'p0:74a7cb03:cleanup-control',
							}),
				});
			}
			if (reuse) {
				backend.compile = compile;
				backend.submitLayer = submit;
				if ((!trajectoryPoses && movement.length !== 5) || !qualifiedFieldHash)
					throw new Error('Authenticated day controls and P2 field identity required');
				const retainedBytes =
					cache.resources.executor.residentFieldStorage.value + cache.resources.retainedAuxiliaryBytes.value;
				// This completed control already supplied its qualified field observations.
				// Release it before staging the old/new pair; no displayed frame is discarded.
				controller.dispose();
				controller = null;
				result.reuse = await new LocalSunFrameGpuProof().verify({
					profile,
					backend,
					renderer,
					movement,
					expectedFieldHash: qualifiedFieldHash,
					sceneColorPrecision,
					retainedBytes: retainedBytes,
					poses: trajectoryPoses,
				});
				result.glError = renderer.getContext().getError();
			}
			if (result.glError !== 0) throw new Error('WebGL error ' + result.glError);
			return result;
		} finally {
			controller?.dispose();
			backend.dispose();
			renderer.dispose();
			algorithm.dispose();
		}
	}
}

/** Owned offline browser RPC surface; application runtime never imports this entry. */
let scope = /** @type {LocalSunGpuProofBrowserScope} */ (/** @type {unknown} */ (globalThis));
scope.runCompactGpu = (request) => new LocalSunGpuBrowserProof().verify(request);
