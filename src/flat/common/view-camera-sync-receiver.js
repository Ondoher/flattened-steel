import {Service} from '@polylith/core';

/**
 * Instance-specific registered adapter between camera-sync and one mounted scene owner.
 *
 * @implements {ViewCameraSyncReceiverService}
 */
export class ViewCameraSyncReceiver extends Service {
	/**
	 * Creates the callback receiver without joining synchronization before its owner is ready.
	 *
	 * @param {ViewCameraSyncReceiverOptions} options - Exact owner lifetime and delegated operations.
	 */
	constructor(options) {
		super(options.name, options.registry);
		this._name = options.name;
		this._registeredReceiver = this.registry.subscribe(options.name);
		this._coordinator = options.coordinator;
		this._onSynced = options.onSynced;
		this._applyControls = options.applyControls;
		this._retired = false;
		/** @type {CameraSyncHandle|null} */
		this._handle = null;
		this.implement(['connect', 'publish', 'request', 'retire', 'synced', 'cameraChanged']);
	}

	/**
	 * Call this method to join the coordinator and supply requested controls before renderer preparation.
	 *
	 * @param {CameraSyncControls} controls - Initial requested orientation and height.
	 */
	connect(controls) {
		if (this._retired || this._handle) {
			return;
		}
		this._handle = this._coordinator.register(this._name);
		this._coordinator.update(this._handle, controls);
	}

	/**
	 * Call this method to publish only user-origin camera-control changes.
	 *
	 * @param {CameraSyncControls} controls - Latest requested controls.
	 */
	publish(controls) {
		if (!this._retired && this._handle) {
			this._coordinator.update(this._handle, controls);
		}
	}

	/**
	 * Call this method to relay an owner-approved menu action.
	 *
	 * @param {CameraSyncMode} mode - Requested action.
	 */
	request(mode) {
		if (!this._retired && this._handle) {
			this._coordinator.sync(this._handle, mode);
		}
	}

	/**
	 * Call this method to invalidate delegates and remove this exact receiver registration.
	 */
	retire() {
		if (this._retired) {
			return;
		}
		this._retired = true;
		if (this._handle) {
			this._coordinator.unregister(this._handle);
			this._handle = null;
		} else if (this.registry.subscribe(this._name) === this._registeredReceiver) {
			this.registry.unregister(this._name);
		}
	}

	/**
	 * Call this method to project coordinator notifications into the original scene owner.
	 *
	 * @param {CameraSyncMode} mode - Initiated action or current relationship.
	 */
	synced(mode) {
		if (!this._retired) {
			this._onSynced(mode);
		}
	}

	/**
	 * Call this method to apply incoming controls without publishing an echo or blocking other calls.
	 *
	 * @param {CameraSyncControls} controls - Requested camera settings.
	 * @returns {Promise<Error|void>} - Application outcome, with expected failure returned rather than thrown.
	 */
	async cameraChanged(controls) {
		if (this._retired) {
			return new Error('Camera receiver has been retired.');
		}
		try {
			return await this._applyControls(controls);
		} catch (error) {
			return error;
		}
	}
}
