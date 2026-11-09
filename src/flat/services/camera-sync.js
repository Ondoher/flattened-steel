import {Service} from '@polylith/core';

/**
 * Application-local camera participants, requested settings and directional subscriptions.
 *
 * @implements {CameraSyncService}
 */
export class CameraSync extends Service {
	/**
	 * Creates the service capability without activating application startup or locating receivers.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('camera-sync', registry);
		/** @type {Map<CameraSyncHandle, CameraSyncParticipant>} */
		this._participants = new Map();
		this._revision = 0;
		this._running = false;
		this.implement(['start', 'stop', 'register', 'unregister', 'update', 'sync']);
	}

	/**
	 * Called by ownership boundaries to retain an independent requested-controls snapshot.
	 *
	 * @param {CameraSyncControls} controls - Typed requested settings.
	 * @returns {CameraSyncControls} - Independent record and quaternion.
	 */
	_copyControls(controls) {
		return {orientation: [...controls.orientation], observerHeightMeters: controls.observerHeightMeters};
	}

	/**
	 * Called by delivery to require the exact live registration and receiver identity.
	 *
	 * @param {CameraSyncParticipant} participant - Original registration record.
	 * @returns {boolean} - Whether this record still owns its receiver service.
	 */
	_isCurrent(participant) {
		return (
			this._participants.get(participant.handle) === participant &&
			this.registry.subscribe(participant.serviceName) === participant.receiver
		);
	}

	/**
	 * Called by pair operations to locate the other participant without depending on a UI.
	 *
	 * @param {CameraSyncParticipant} participant - Requesting registration.
	 * @returns {CameraSyncParticipant|null} - Other registered participant, if present.
	 */
	_other(participant) {
		for (let other of this._participants.values()) {
			if (other !== participant) {
				return other;
			}
		}
		return null;
	}

	/**
	 * Called by callbacks to report an unexpected failure without changing synchronization policy.
	 *
	 * @param {unknown} error - Unexpected throw or promise rejection.
	 */
	_reportFailure(error) {
		console.error('Camera synchronization callback failed.', error);
	}

	/**
	 * Called by transitions to notify one still-owned receiver synchronously.
	 *
	 * @param {CameraSyncParticipant} participant - Exact destination registration.
	 * @param {CameraSyncMode} mode - Initiated action or effective relationship.
	 */
	_notify(participant, mode) {
		if (!this._isCurrent(participant)) {
			return;
		}
		try {
			participant.receiver.synced(mode);
		} catch (error) {
			this._reportFailure(error);
		}
	}

	/**
	 * Called by synchronization to record requested state before invoking an overlapping async receiver.
	 * Returned Error values are ignored; only unexpected throws or rejections are diagnosed.
	 *
	 * @param {CameraSyncParticipant} participant - Exact destination registration.
	 * @param {CameraSyncControls} controls - Source requested settings.
	 */
	_deliver(participant, controls) {
		if (!this._isCurrent(participant)) {
			return;
		}
		participant.controls = this._copyControls(controls);
		try {
			void participant.receiver
				.cameraChanged(this._copyControls(participant.controls))
				.catch((error) => this._reportFailure(error));
		} catch (error) {
			this._reportFailure(error);
		}
	}

	/**
	 * Called by off requests to cancel subscriptions before notifying potentially reentrant receivers.
	 */
	_cancel() {
		let participants = [...this._participants.values()];
		for (let participant of participants) {
			participant.follows = null;
		}
		let revision = ++this._revision;
		for (let participant of participants) {
			if (revision !== this._revision) {
				return;
			}
			this._notify(participant, 'off');
		}
	}

	/**
	 * Call this method to accept participants during this application-service lifetime.
	 */
	start() {
		this._running = true;
	}

	/**
	 * Call this method to stop accepting updates and release every exact owned receiver registration.
	 */
	stop() {
		this._running = false;
		for (let handle of [...this._participants.keys()]) {
			this.unregister(handle);
		}
	}

	/**
	 * Call this method to register an independently named service for one camera participant.
	 *
	 * @param {string} serviceName - Existing receiver in this application's registry.
	 * @returns {CameraSyncHandle} - Non-reused registration identity.
	 * @throws {Error} - The service is stopped, ownership conflicts, the receiver is missing, or peer selection is ambiguous.
	 */
	register(serviceName) {
		if (!this._running) {
			throw new Error('Camera synchronization service is stopped.');
		}
		for (let participant of this._participants.values()) {
			if (participant.serviceName === serviceName) {
				throw new Error('Camera synchronization receiver is already registered.');
			}
		}
		if (this._participants.size === 2) {
			throw new Error('Camera synchronization requires an unambiguous pair of participants.');
		}
		let receiver = /** @type {CameraSyncReceiver} */ (this.registry.subscribe(serviceName));
		if (!receiver) {
			throw new Error('Camera synchronization receiver is not registered in this application.');
		}
		let handle = Symbol(serviceName);
		this._participants.set(handle, {handle, serviceName, receiver, controls: null, follows: null});
		this._revision++;
		return handle;
	}

	/**
	 * Call this method to retire participation and remove its exact owned receiver service.
	 *
	 * @param {CameraSyncHandle} handle - Original registration; stale and foreign handles have no effect.
	 */
	unregister(handle) {
		let participant = this._participants.get(handle);
		if (!participant) {
			return;
		}
		let other = this._other(participant);
		let linked = participant.follows !== null || other?.follows === handle;
		this._participants.delete(handle);
		this._revision++;
		if (other) {
			other.follows = null;
		}
		if (this.registry.subscribe(participant.serviceName) === participant.receiver) {
			this.registry.unregister(participant.serviceName);
		}
		if (linked && other) {
			this._notify(other, 'off');
		}
	}

	/**
	 * Call this method to publish initial or user-requested settings without waiting for receiver completion.
	 *
	 * @param {CameraSyncHandle} handle - Source registration; stale or foreign handles have no effect.
	 * @param {CameraSyncControls} cameraControls - Requested settings, copied before retention and delivery.
	 */
	update(handle, cameraControls) {
		let participant = this._participants.get(handle);
		if (!this._running || !participant || !this._isCurrent(participant)) {
			return;
		}
		participant.controls = this._copyControls(cameraControls);
		let other = this._other(participant);
		if (other?.follows === handle) {
			this._deliver(other, participant.controls);
		}
	}

	/**
	 * Call this method to copy peer settings and establish or cancel directional subscriptions.
	 * Missing peer state makes positive requests no-ops; callbacks may reenter without restoring older transitions.
	 *
	 * @param {CameraSyncHandle} handle - Requesting registration; stale or foreign handles have no effect.
	 * @param {CameraSyncMode} mode - Supported action, independent of UI availability.
	 */
	sync(handle, mode) {
		let participant = this._participants.get(handle);
		if (!this._running || !participant || !this._isCurrent(participant)) {
			return;
		}
		if (mode === 'off') {
			this._cancel();
			return;
		}
		let other = this._other(participant);
		if (!other?.controls || !this._isCurrent(other)) {
			return;
		}
		let controls = this._copyControls(other.controls);
		if (mode === 'both' || mode === 'them') {
			participant.follows = other.handle;
		}
		if (mode === 'both') {
			other.follows = participant.handle;
		}
		let revision = ++this._revision;
		this._deliver(participant, controls);
		if (revision !== this._revision) {
			return;
		}
		if (mode === 'now') {
			this._notify(participant, 'now');
		} else if (other.follows === participant.handle) {
			this._notify(participant, 'both');
			if (revision === this._revision) {
				this._notify(other, 'both');
			}
		} else {
			this._notify(participant, 'them');
		}
	}
}
