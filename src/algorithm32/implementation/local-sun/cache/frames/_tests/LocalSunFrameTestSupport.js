import {readFileSync} from 'node:fs';
import {FlatEarthGeometry} from '../../../../flat-earth/FlatEarthGeometry.js';
import {LocalSunLightSource} from '../../../LocalSunLightSource.js';
import {CanonicalAtmosphere} from '../../../../canonical-atmosphere/CanonicalAtmosphere.js';
import {LocalSunCompactConstructionProfile} from '../../LocalSunCompactConstructionProfile.js';
import {LocalLightLevelCalculator} from '../../../../scene-lighting/LocalLightLevelCalculator.js';
import {SpectralMath} from '../../../../../spectral-values/index.js';

/** Virtual resource backend and genuine accepted physical profiles for frame-lifecycle tests, without numerical GPU claims. */
export class LocalSunFrameTestSupport {
	/** Outstanding opaque owner handles.
	 *
	 * @type {Set<object>}
	 */ handles = new Set();
	/** Total submitted layers, for observable reuse assertions.
	 *
	 * @type {number}
	 */ submissions = 0;
	/** Completed staged-frame disposals.
	 *
	 * @type {number}
	 */ stagedDisposals = 0;
	/** Backend identity.
	 *
	 * @type {string}
	 */ id = 'frame-lifecycle-spec';
	/** Accepted virtual resource capabilities.
	 *
	 * @type {CacheGpuCapabilities}
	 */ capabilities = {
		id: 'frame-lifecycle-capabilities',
		api: 'virtual resource lifecycle only',
		scalarFormat: 'R32F',
		supportsArrayRenderTargets: true,
		supportsFloatSampling: true,
		maximumTextureSize: 16384,
		maximumArrayLayers: 256,
	};

	/** Called by virtual owners to account for one once-disposed handle.
	 *
	 * @param {object} handle - Owned opaque handle.
	 * @returns {void} - No value.
	 */
	_track(handle) {
		this.handles.add(handle);
	}

	/** Call this method to build a genuine N1 profile from the immutable checked P0 shape controls.
	 *
	 * @param {number} [scale] - Supported one or zero source intensity.
	 * @returns {LocalSunCompactConstructionProfile} - Accepted physical control.
	 */
	static createProfile(scale = 1) {
		const {controls} = JSON.parse(
			readFileSync(new URL('../../fixtures/local-sun-compact-p0-controls.json', import.meta.url), 'utf8'),
		);
		const geometry = new FlatEarthGeometry({
			topAltitude: controls.geometry.atmosphereTop,
			localLightSourceHeight: controls.geometry.sourceHeight,
			projectionRadius: {value: 6360000, units: 'meters'},
		});
		const lightSource = new LocalSunLightSource({
			sourceKey: 'frame-lifecycle-control',
			referenceDistance: {value: 4800000, units: 'meters'},
			referenceSpectralIncidentScale: scale,
			radius: {value: 25749.504, units: 'meters'},
			distanceFalloff: true,
		});
		geometry.configureLightSource({
			lightSource,
			observation: {
				instant: '2024-12-14T17:27:41.487Z',
				location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
			},
			placement: {
				kind: 'finite-position',
				position: {coordinates: [0, 0, controls.geometry.sourceHeight.value], units: 'meters'},
			},
		});
		return new LocalSunCompactConstructionProfile({
			geometry,
			lightSource,
			atmosphere: new CanonicalAtmosphere(),
			groundBoundary: null,
			maximumScatteringOrder: 1,
			topologyControls: {
				coverageRadius: controls.geometry.coverageRadius,
				altitudes: controls.rows.map((row) => row.altitude),
				bandRadii: [controls.bands[0].innerRadius, ...controls.bands.map((band) => band.outerRadius)],
				boundaryExtinctionLengthMultiples: [0.25, 0.5, 1, 2, 4, 8, 16],
			},
			provenanceIdentity: 'checked-p0-frame-lifecycle-control',
		});
	}

	/** Call this method to declare exact live state and complete ray/budget inputs.
	 *
	 * @param {LocalSunCompactConstructionProfile} profile - Genuine paired profile.
	 * @returns {LocalSunFrameRequest} - Complete candidate request.
	 */
	static request(profile) {
		return {
			profile,
			viewRays: [{origin: profile.models.geometry.configuration.observerPosition, direction: [0, 0, 1]}],
			presentationIdentity: 'frame-lifecycle-display',
			otherOwnedGpuBytes: {value: 16 * 1024 * 1024, units: 'bytes'},
		};
	}

	/** Call this method to retain virtual field ownership without allocating numerical payload.
	 *
	 * @param {CacheFieldSpec} specification - Exact field shape.
	 * @returns {GpuCacheField} - Virtual lifecycle field.
	 */
	allocateField(specification) {
		const field = {
			...specification,
			backendId: this.id,
			/** Release this virtual field handle.
			 *
			 * @returns {boolean} - Whether the handle was still tracked.
			 */ dispose: () => this.handles.delete(field),
		};
		this._track(field);
		return field;
	}

	/** Call this method to retain virtual program ownership without executing GLSL.
	 *
	 * @param {CacheShader} shader - Real assembled production source.
	 * @returns {CacheGpuProgram} - Virtual lifecycle program.
	 */
	compile(shader) {
		const program = {
			id: shader.id,
			sourceHash: shader.sourceHash,
			/** Release this virtual program handle.
			 *
			 * @returns {boolean} - Whether the handle was still tracked.
			 */ dispose: () => this.handles.delete(program),
		};
		this._track(program);
		return program;
	}

	/** Call this method to observe submitted layers; no spectral values are fabricated.
	 *
	 * @param {CacheLayerSubmission} _request - Real assembled layer operation.
	 * @returns {void} - No value.
	 */
	submitLayer(_request) {
		this.submissions++;
	}

	/** Call this method to create an opaque virtual field binding.
	 *
	 * @param {CacheRuntimeBindingRequest} request - Field and destination key.
	 * @returns {CacheRuntimeBinding} - Opaque lifecycle binding.
	 */
	createRuntimeBinding(request) {
		return {id: request.field.id, fieldId: request.field.id, valueKey: request.valueKey, backendId: this.id};
	}

	/** Call this method to retain one virtual auxiliary owner.
	 *
	 * @param {CacheImmutableTextureUploadRequest} request - Actual immutable auxiliary inputs.
	 * @returns {CacheImmutableTexture} - Virtual owner/binding.
	 */
	uploadImmutableTexture(request) {
		const texture = {
			id: request.id,
			storage: request.storage,
			backendId: this.id,
			runtimeBinding: {id: request.id, fieldId: request.id, valueKey: request.valueKey, backendId: this.id},
			/** Release this virtual texture handle.
			 *
			 * @returns {boolean} - Whether the handle was still tracked.
			 */ dispose: () => this.handles.delete(texture),
		};
		this._track(texture);
		return texture;
	}

	/** Simulate packed-resource ownership only; this backend makes no numerical GPU claim.
	 *
	 * @param {CacheRuntimeFieldPackingRequest} request - Real controller-selected scalar source.
	 * @returns {CacheImmutableTexture} - Virtual immutable packed handle.
	 */
	packRuntimeField(request) {
		return this.uploadImmutableTexture({
			id: request.id,
			valueKey: request.valueKey,
			storage: {
				...request.source.storage,
				format: 'RGBA32F',
				layers: Math.ceil(request.source.storage.layers / 4),
			},
			values: new Float32Array(0),
		});
	}

	/** Call this method to satisfy the virtual install contract; physical binding validation is browser-proof work.
	 *
	 * @returns {void} - No value.
	 */
	installRuntimeBindings() {}

	/** Call this method only when a lifecycle proof unexpectedly requests numerical data.
	 * Always rejects because the virtual backend has no numerical field; fail that proof and
	 * use a physical GPU proof for numerical assertions rather than accepting this as cache data.
	 *
	 * @returns {Promise<CacheProbeResult>} - Always rejects; no numerical gold exists in this backend.
	 */
	async readSelectedScalars() {
		throw new Error('Virtual lifecycle backend cannot supply numerical values.');
	}

	/** Call this method to stage zero-valued typed measurement data solely for lifecycle/publication assertions.
	 *
	 * @param {LocalSunFrameStageRequest} request - Genuine exact physical state and owned lease.
	 * @returns {Promise<LocalSunPreparedFrameContents>} - Virtual lifecycle aggregate; numerical qualification is separate.
	 */
	async stage(request) {
		const dark = SpectralMath.scaleSpectralPacket(request.profile.spectral.sourceIrradianceDensity, 0);
		const calculator = new LocalLightLevelCalculator({lightSource: request.profile.models.lightSource});
		const receiverLight = calculator.combineReceiverLight({
			identity: request.identity,
			directNormal: dark,
			directHorizontal: dark,
			diffuseHorizontal: dark,
			stellarAdaptationLuminance: {value: 0, units: 'cd m^-2'},
		});
		let disposed = false;
		return {
			shaderReady: true,
			receiverLight,
			celestialInputs: {
				observation: request.profile.models.geometry.configuration.observation,
				sourcePosition: request.profile.models.lightSource.configuration.position,
				receiverPosition: request.profile.models.geometry.configuration.observerPosition,
				sourceRadius: request.profile.models.lightSource.configuration.radius,
				stellarAdaptationLuminance: receiverLight.stellarAdaptationLuminance,
				receiverLightIdentity: receiverLight.identity,
			},
			bindingValues: {frame: request.identity},
			/** Render a live virtual packet; retired packets throw and must be discarded. */
			renderFrame: () => {
				if (disposed) throw new Error('Retired virtual frame');
			},
			/** Retire this virtual staged packet once and record the release. */
			dispose: () => {
				if (!disposed) {
					disposed = true;
					this.stagedDisposals++;
				}
			},
		};
	}
}
