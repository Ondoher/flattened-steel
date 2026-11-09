import {getCameraHeading} from '../../common/camera-heading.js';
import DistanceMath from '../../../algorithm32/math/DistanceMath.js';

/**
 * Owns one view's cancellable preparation and renderer lifetime, independently of other open views.
 */
export class SphericalEarthSession {
	/**
	 * Creates an unmounted session using its feature's registered model capability.
	 *
	 * @param {string} viewId - Exact workspace view identity.
	 * @param {SphericalEarthModelService} model - Registered camera and observation model capability.
	 * @param {(state: SphericalEarthSceneState) => void} onChange - Controller-owned state publication.
	 * @param {SphericalEarthRuntimeFactory} createRuntime - Controller-supplied renderer and service collaborators.
	 */
	constructor(viewId, model, onChange, createRuntime) {
		this.viewId = viewId;
		this.onChange = onChange;
		this.createRuntime = createRuntime;
		this.model = model;
		/** @type {SphericalEarthSceneLifecycleState} */
		this.state = {status: 'waiting', observation: null, renderedObservation: null, error: null};
		this.canvas = null;
		/** @type {SphericalEarthRuntimeCapability|null} */
		this.runtime = null;
		this.release = Promise.resolve();
		this.generation = 0;
		this.mountGeneration = 0;
		this.processing = false;
		this.cancellation = null;
		/** @type {Distance|null} */
		this.pendingHeight = null;
		/** @type {SceneHeightRequest|null} */
		this._heightRequest = null;
		/** @type {CameraSyncViewState} */
		this.syncState = {mode: 'off', available: false};
		/** @type {((controls: CameraSyncControls) => void)|null} */
		this.onCameraControlsChanged = null;
		this.lookStatus = /** @type {SphericalEarthCameraState['lookStatus']} */ ('idle');
	}

	/**
	 * Call this method to read a disposable scene-state projection.
	 *
	 * @returns {SphericalEarthSceneState} - Current requested and displayed observation identities.
	 */
	getState() {
		let camera = this.model.getCamera(this.viewId);
		return structuredClone({
			...this.state,
			sync: {...this.syncState},
			shader: this.model.getShaderOptions(this.viewId),
			camera: {
				...camera,
				headingDegrees: getCameraHeading(camera.orientation),
				pendingHeightMeters: this.pendingHeight ? DistanceMath.toMeters(this.pendingHeight) : null,
				lookStatus: this.lookStatus,
			},
		});
	}

	/**
	 * Called after a session transition to publish a disposable snapshot.
	 */
	_emit() {
		this.onChange(this.getState());
	}

	/**
	 * Call this method when the shared location/time changes, preserving the previous coherent frame during preparation.
	 *
	 * @param {ApplicationConfiguration} configuration - Shared accepted values.
	 */
	update(configuration) {
		let observation = this.model.getObservation(configuration);
		if (JSON.stringify(observation) === JSON.stringify(this.state.observation)) {
			return;
		}
		this.generation++;
		if (!observation || JSON.stringify(observation.location) !== JSON.stringify(this.state.observation?.location)) {
			this.cancellation?.abort();
		}
		this.state.observation = observation;
		this.state.status = observation ? 'preparing' : 'waiting';
		this.state.error = null;
		this._emit();
		void this._process();
	}

	/**
	 * Call this method to attach the exact React-owned canvas after prior graphics release completes.
	 *
	 * @param {HTMLCanvasElement} canvas - Newly mounted scene surface.
	 */
	attach(canvas) {
		if (this.canvas === canvas) {
			return;
		}
		if (this.canvas) {
			this.detach(this.canvas);
		}
		this.canvas = canvas;
		let generation = ++this.mountGeneration;
		void this.release.then(() => {
			if (generation !== this.mountGeneration || this.canvas !== canvas) {
				return;
			}
			try {
				this.runtime = this.createRuntime(
					canvas,
					this.model,
					this.viewId,
					(error) => {
						if (generation === this.mountGeneration && this.canvas === canvas) {
							this._fail(error);
						}
					},
					(change) => {
						if (generation === this.mountGeneration && this.canvas === canvas) {
							let previous = this.model.getCamera(this.viewId).orientation;
							let changed = previous.some((value, index) => value !== change.orientation[index]);
							this.model.setOrientation(this.viewId, change.orientation);
							this.lookStatus = change.lookStatus;
							this._emit();
							if (changed) {
								this.onCameraControlsChanged?.(this.getCameraControls());
							}
						}
					},
				);
				void this._process();
			} catch (error) {
				this._fail(error);
			}
		});
	}

	/**
	 * Call this method to release only the graphics lifetime belonging to the supplied canvas.
	 *
	 * @param {HTMLCanvasElement} canvas - Exact surface being detached.
	 */
	detach(canvas) {
		if (this.canvas !== canvas) {
			return;
		}
		this._settleHeight(new Error('Camera surface was detached.'));
		this.mountGeneration++;
		this.generation++;
		this.cancellation?.abort();
		this.canvas = null;
		this.lookStatus = 'idle';
		let runtime = this.runtime;
		this.runtime = null;
		this.state.renderedObservation = null;
		this.release = this.release
			.then(async () => {
				if (runtime) {
					await runtime.dispose();
				}
			})
			.catch((error) => {
				console.error('Spherical Earth graphics release failed.', error);
			});
	}

	/**
	 * Called by renderer failures to retain a concrete error and cancel unfinished work.
	 *
	 * @param {Error} error - Preparation or renderer failure.
	 */
	_fail(error) {
		this._settleHeight(error);
		this.cancellation?.abort();
		this.state.status = 'error';
		this.state.error = error.message;
		this._emit();
	}

	/**
	 * Call this method to rebuild the current canvas after a reported graphics failure.
	 */
	retry() {
		if (this.runtime?.canRetryRetained() && this.state.renderedObservation) {
			this.generation++;
			this.cancellation?.abort();
			this.state.status = 'preparing';
			this.state.error = null;
			this._emit();
			void this._process();
			return;
		}
		let canvas = this.canvas;
		if (!canvas) {
			return;
		}
		this.detach(canvas);
		this.state.status = this.state.observation ? 'preparing' : 'waiting';
		this.state.error = null;
		this._emit();
		this.attach(canvas);
	}

	/**
	 * Call this method to request a new physical elevation while retaining the previous complete frame.
	 *
	 * @param {Distance} height - Requested height above ground.
	 */
	setObserverHeight(height) {
		let previous = this.getCameraControls().observerHeightMeters;
		void this._requestObserverHeight(height);
		if (this.getCameraControls().observerHeightMeters !== previous) {
			this.onCameraControlsChanged?.(this.getCameraControls());
		}
	}

	/**
	 * Called by height commands to reuse an identical pending request or schedule the latest physical height.
	 *
	 * @param {Distance} height - Requested observer height.
	 * @returns {Promise<Error|void>} - Acceptance, supersession, failure or detachment outcome.
	 */
	_requestObserverHeight(height) {
		let accepted = this.model.resolveHeight(height);
		let targetMeters = this.pendingHeight?.value ?? this.model.getCamera(this.viewId).observerHeightMeters;
		if (accepted.value === targetMeters) {
			return this._heightRequest?.promise ?? Promise.resolve();
		}
		this._settleHeight(new Error('Camera height request was superseded.'));
		if (!this.state.observation || !this.runtime) {
			this.model.acceptHeight(this.viewId, accepted);
			this._emit();
			return Promise.resolve();
		}
		/** @type {(error?: Error) => void} */
		let complete;
		/** @type {Promise<Error|void>} */
		let promise = new Promise((resolve) => {
			complete = resolve;
		});
		this._heightRequest = {heightMeters: accepted.value, promise, complete};
		this.pendingHeight = accepted;
		this.generation++;
		this.cancellation?.abort();
		this.state.status = 'preparing';
		this.state.error = null;
		this._emit();
		void this._process();
		return promise;
	}

	/**
	 * Call this method to change independent framing without reconstructing the scattering cache.
	 *
	 * @param {number} degrees - Vertical perspective FOV.
	 */
	setFieldOfView(degrees) {
		let previous = this.model.getCamera(this.viewId).fieldOfViewDegrees;
		this.model.setFieldOfView(this.viewId, degrees);
		try {
			this.runtime?.setFieldOfView(degrees);
			this._emit();
		} catch (error) {
			this.model.setFieldOfView(this.viewId, previous);
			this._fail(error);
		}
	}

	/**
	 * Call this method to change this view's shader presentation without preparing a new observation.
	 *
	 * @param {SphericalEarthSkyRenderMode} mode - Complete sky composition selection.
	 */
	setSkyRenderMode(mode) {
		let previous = this.model.getShaderOptions(this.viewId).mode;
		if (mode === previous) {
			return;
		}
		this.model.setSkyRenderMode(this.viewId, mode);
		try {
			this.runtime?.refreshShaderOptions();
			this._emit();
		} catch (error) {
			this.model.setSkyRenderMode(this.viewId, previous);
			try {
				this.runtime?.refreshShaderOptions();
			} catch (restoreError) {
				error = new AggregateError([error, restoreError], 'Could not apply or restore the sky presentation.');
			}
			this._fail(error);
		}
	}

	/**
	 * Call this method to aim only this view at the Sun in its displayed observation.
	 */
	centerOnSun() {
		try {
			this.runtime?.centerOnSun();
		} catch (error) {
			this._fail(error);
		}
	}

	/**
	 * Call this method to aim only this view at Polaris in its displayed observation.
	 */
	centerOnPolaris() {
		try {
			this.runtime?.centerOnPolaris();
		} catch (error) {
			this._fail(error);
		}
	}

	/**
	 * Call this method to toggle ribbon presentation without preparing another physical frame.
	 */
	toggleCompass() {
		this.model.toggleCompass(this.viewId);
		this._emit();
	}

	/**
	 * Called by height acceptance or retirement to settle the exact owned pending request.
	 *
	 * @param {Error} [error] - Failure or supersession; omission denotes acceptance.
	 */
	_settleHeight(error) {
		let request = this._heightRequest;
		this._heightRequest = null;
		request?.complete(error);
	}

	/**
	 * Call this method to read the latest requested synchronized controls, including pending height.
	 *
	 * @returns {CameraSyncControls} - Independent requested orientation and elevation.
	 */
	getCameraControls() {
		let camera = this.model.getCamera(this.viewId);
		return {
			orientation: [...camera.orientation],
			observerHeightMeters: this.pendingHeight?.value ?? camera.observerHeightMeters,
		};
	}

	/**
	 * Call this method to project a subscription notification without treating now as a persistent mode.
	 *
	 * @param {CameraSyncMode} mode - Coordinator notification.
	 */
	setSyncMode(mode) {
		if (mode !== 'now' && mode !== this.syncState.mode) {
			this.syncState.mode = mode;
			this._emit();
		}
	}

	/**
	 * Call this method to project workspace availability without changing subscriptions.
	 *
	 * @param {boolean} available - Whether two populated workspace views exist.
	 */
	setSyncAvailable(available) {
		if (available !== this.syncState.available) {
			this.syncState.available = available;
			this._emit();
		}
	}

	/**
	 * Call this method to apply received settings without publishing a camera update echo.
	 *
	 * @param {CameraSyncControls} controls - Latest requested orientation and height.
	 * @returns {Promise<Error|void>} - Request outcome; newer calls can overlap this one.
	 */
	async applyCameraControls(controls) {
		try {
			let height = this.model.resolveHeight({value: controls.observerHeightMeters, units: 'meters'});
			this.runtime?.setOrientation(controls.orientation);
			this.model.setOrientation(this.viewId, [...controls.orientation]);
			this._emit();
			return await this._requestObserverHeight(height);
		} catch (error) {
			this._fail(error);
			return error;
		}
	}

	/**
	 * Called by attachment and shared changes to run one serial latest-request preparation lane.
	 *
	 * @returns {Promise<void>} - Completion of the current queued work.
	 */
	async _process() {
		if (this.processing || !this.runtime || !this.state.observation) {
			return;
		}
		let runtime = this.runtime;
		this.processing = true;
		try {
			while (runtime === this.runtime && this.state.observation) {
				let generation = this.generation;
				let observation = this.state.observation;
				let height = this.pendingHeight ?? {
					value: this.model.getCamera(this.viewId).observerHeightMeters,
					units: 'meters',
				};
				let cancellation = new AbortController();
				this.cancellation = cancellation;
				try {
					let publication = await runtime.prepare(observation, cancellation.signal, height);
					if (runtime === this.runtime && !cancellation.signal.aborted) {
						this.model.acceptHeight(this.viewId, height);
						if (this._heightRequest?.heightMeters === height.value) {
							this._settleHeight();
						}
						if (this.pendingHeight === height) {
							this.pendingHeight = null;
						}
						this.state.renderedObservation = observation;
						this.state.status = generation === this.generation ? 'ready' : 'preparing';
						this.state.error = null;
						if (publication.retirementErrors.length) {
							this.state.status = 'error';
							let details = publication.retirementErrors.map((error) => String(error)).join('; ');
							this.state.error = `The new scene was displayed, but previous resource cleanup failed: ${details}`;
						}
						this._emit();
					}
				} catch (error) {
					if (!cancellation.signal.aborted && generation === this.generation && runtime === this.runtime) {
						this.pendingHeight = null;
						this._fail(error);
					}
				}
				if (generation === this.generation) {
					break;
				}
			}
		} finally {
			this.processing = false;
			if (runtime !== this.runtime && this.runtime) {
				void this._process();
			}
		}
	}
}
