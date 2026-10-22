import * as THREE from 'three';
import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {EndpointScene} from './EndpointScene.js';
import {ThreeSceneRuntime} from './ThreeSceneRuntime.js';

/** Isolated candidate scene/camera borrowing the renderer; publication retains a reversible accepted view.
 * @implements {Flat32SceneRuntimeCapability}
 * @implements {Flat32SceneStage}
 */
export class StagedSceneRuntime {
	/** Creates a physically positioned candidate without mutating the displayed scene.
	 * Endpoint construction failures throw; discard the candidate before preparing a replacement.
	 * @param {ThreeSceneRuntime} host - Actual application renderer and frame-boundary owner.
	 * @param {Flat32Mode} mode - Candidate geometry and physical height.
	 * @param {() => boolean} getObjectsVisible - Current review-object selection, read again at publication.
	 */
	constructor(host, mode, getObjectsVisible) {
		this._host = host;
		this._scene = new THREE.Scene();
		this._scene.background = host.scene.background;
		this._camera = host.camera.clone();
		this._camera.position.y = DistanceMath.toMeters(mode.observerHeight) / mode.sceneScale.value;
		this._camera.updateMatrixWorld(true);
		this._previous = {scene: host.scene, camera: host.camera};
		this._published = false;
		this._getObjectsVisible = getObjectsVisible;
		/** Owned candidate endpoints and measured Sun lighting. */
		this.endpointScene = new EndpointScene(this._scene, {reviewObjectsEnabled: getObjectsVisible()});
		try {
			this.endpointScene.install();
			this.endpointScene.applyMode(
				mode.describe().pairing === 'flat/local' ? 'flat-local' : 'spherical-distant',
				mode.geometry,
			);
		} catch (error) {
			this.endpointScene.dispose();
			throw error;
		}
	}
	/** Candidate renderer capability, retained as the runtime's live view after publication. */
	get sceneRuntime() {
		return this;
	}
	/** Candidate visual scene, owned by this stage. */
	get scene() {
		return this._scene;
	}
	/** Candidate physical camera, retained after publication. */
	get camera() {
		return this._camera;
	}
	/** Borrowed actual output canvas. */
	get canvas() {
		return this._host.canvas;
	}
	/** Borrowed actual GPU renderer. */
	get renderer() {
		return this._host.renderer;
	}
	/** Live host viewport, in pixels. */
	get viewportSize() {
		return this._host.viewportSize;
	}
	/** Call this method to register normal context ownership on the actual renderer.
	 * @param {Flat32ContextLifecycleParticipant} participant - Candidate resource owner.
	 * @returns {Flat32ContextLifecycleRemoval} - Removal operation.
	 */
	addContextLifecycleParticipant(participant) {
		return this._host.addContextLifecycleParticipant(participant);
	}
	/** Call this method to commit complete state at the actual host's frame boundary.
	 * Host suspension, cancellation and callback failures propagate; discard the candidate.
	 * @param {() => void} operation - Complete synchronous publication.
	 * @param {AbortSignal} signal - Cancellation owner.
	 * @returns {Promise<void>} - Boundary completion.
	 */
	atFrameBoundary(operation, signal) {
		return this._host.atFrameBoundary(operation, signal);
	}
	/** Call this method to request fresh shared-renderer shadow maps. @returns {void} - Request set. */
	refreshShadowMaps() {
		this._host.refreshShadowMaps();
	}
	/** Call this method to create composition targets using this isolated scene/camera.
	 * Allocation failures propagate; discard the incomplete runtime.
	 * @param {Flat32SceneViewSelection} [view] - Optional preparation camera on the retained scene.
	 * @returns {Flat32AtmosphereComposerResources} - Caller-owned composer and targets.
	 */
	createAtmosphereComposer(view = {scene: this._scene, camera: this._camera}) {
		return this._host.createAtmosphereComposer(view);
	}
	/** Call this method to allocate composition for a runtime that owns the returned composer.
	 * @returns {Flat32AtmosphereComposer} - Newly created candidate composer.
	 */
	prepareAtmosphereComposer() {
		return this.createAtmosphereComposer().composer;
	}
	/** Call this method to install the complete candidate render operation after publication.
	 * Unpublished stages throw; publish this view before installing it.
	 * @param {Flat32RenderOperation} operation - Complete ordinary runtime frame.
	 * @returns {void} - Host frame operation replaced.
	 */
	installRenderOperation(operation) {
		if (!this._published) throw new Error('Publish the candidate scene before its render operation.');
		this._host.installRenderOperation(operation);
	}
	/** Call this method to restore direct rendering only when this view owns the displayed scene.
	 * @returns {void} - Pending candidates leave the current display intact.
	 */
	restoreDirectRendering() {
		if (this._published) this._host.restoreDirectRendering();
	}
	/** Call this method to atomically adopt the staged height and retain the latest yaw/pitch.
	 * Host failure propagates; invoke revert and retain the previous runtime.
	 * @returns {void} - Complete candidate scene and camera installed.
	 */
	publish() {
		this.endpointScene.setObjectsVisible(this._getObjectsVisible());
		this._previous = {scene: this._host.scene, camera: this._host.camera};
		this._camera.quaternion.copy(this._host.camera.quaternion);
		this._camera.aspect = this._host.camera.aspect;
		this._camera.updateProjectionMatrix();
		this._camera.updateMatrixWorld(true);
		this._host.publishSceneView({scene: this._scene, camera: this._camera});
		this._published = true;
	}
	/** Call this method to restore the previous accepted view after failed publication. @returns {void} - Prior view restored. */
	revert() {
		if (this._published) {
			this._host.publishSceneView(this._previous);
			this._published = false;
		}
	}
	/** Call this method to retire owned endpoints after runtime disposal. @returns {void} - Visual resources released. */
	dispose() {
		this.endpointScene.dispose();
		this._scene.clear();
	}
}
