import * as THREE from 'three';
import {ThreeCacheBackend} from '../../../../algorithm32/implementation/three-cache-backend/ThreeCacheBackend.js';
import {LocalSunFrameController} from '../../../../algorithm32/implementation/local-sun/cache/frames/LocalSunFrameController.js';
import {LocalSunCompactProfileSelection} from '../../../../algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js';
import DistanceMath from '../../../../algorithm32/math/DistanceMath.js';

/**
 * Owns transferable canvas/context resources so startup construction survives the first page mount.
 */
export class FlatEarthGraphics {
	/**
	 * Creates one graphics context without requiring a selected page, location or camera model record.
	 *
	 * @param {HTMLCanvasElement} [canvas] - Existing surface when recreating a released renderer.
	 */
	constructor(canvas = document.createElement('canvas')) {
		this.canvas = canvas;
		this.renderer = new THREE.WebGLRenderer({canvas, antialias: false});
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.NoToneMapping;
		this.renderer.setSize(1, 1, false);
		try {
			this.backend = new ThreeCacheBackend({THREE, renderer: this.renderer});
		} catch (error) {
			this.renderer.dispose();
			throw error;
		}
		/** @type {LocalSunFrameStageFactory|null} */
		this.stageFrame = null;
		/** @type {((profile: LocalSunCompactConstructionProfile) => readonly LocalSunFrameSupportRay[])|null} */
		this.resolveViewRays = null;
		this.frames = new LocalSunFrameController({
			backend: this.backend,
			scheduler: {yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0))},
			stageFrame: (request) => this.stageFrame(request),
			resolveViewRays: (profile) => this.resolveViewRays(profile),
		});
		this._onContextLost = (event) => {
			event.preventDefault();
			try {
				this.frames.handleContextLoss();
			} catch (error) {
				console.error('Flat Earth cache context-loss cleanup failed.', error);
			}
		};
		canvas.addEventListener('webglcontextlost', this._onContextLost);
		/** @type {Promise<void>|null} */
		this.warming = null;
		/** @type {Promise<void>|null} */
		this.release = null;
	}

	/**
	 * Call this method to start construction once; the seed selects no accepted application observation.
	 * Canonical construction removes live horizontal placement and receiver elevation before building.
	 *
	 * @returns {Promise<void>} - Completion after reusable physical construction, without a rendered frame.
	 */
	warm() {
		if (!this.warming) {
			let profile = FlatEarthGraphics.createProfile(
				{
					instant: '2000-01-01T12:00:00.000Z',
					location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
				},
				{value: 5, units: 'meters'},
			);
			this.warming = this.frames.prepareCache(profile);
		}
		return this.warming;
	}

	/**
	 * Call this method to select the same physical policy for startup construction and live frames.
	 *
	 * @param {GeometryObservation} observation - Exact observation used by the profile's physical owners.
	 * @param {Distance} observerHeight - Physical receiver elevation.
	 * @returns {LocalSunCompactConstructionProfile} - Production native15/N4 compact profile.
	 */
	static createProfile(observation, observerHeight) {
		return new LocalSunCompactProfileSelection().create({
			observation,
			observerPosition: {coordinates: [0, 0, DistanceMath.toMeters(observerHeight)], units: 'meters'},
			viewRayLimit: {value: 1926774, units: 'meters'},
			maximumScatteringOrder: 4,
		});
	}

	/**
	 * Call this method to cancel construction and release the context after all pending cache borrowers finish.
	 *
	 * @returns {Promise<void>} - Completion after every graphics owner has been released.
	 */
	dispose() {
		this.release ??= this._dispose();
		return this.release;
	}

	/**
	 * Called once by disposal to attempt all releases and report concrete cleanup failures.
	 *
	 * @returns {Promise<void>} - Completion after backend and renderer release.
	 */
	async _dispose() {
		this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
		let errors = [];
		for (let release of [
			() => this.frames.dispose(),
			() => this.frames.whenReleased(),
			() => this.backend.dispose(),
			() => this.renderer.dispose(),
		]) {
			try {
				await release();
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Flat Earth graphics release failed.');
		}
	}
}
