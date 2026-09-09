/** Owner of deterministic scheduling and one-shot failure delivery for a run heartbeat. */
export default class ExperimentRunHeartbeat {
	/** @type {() => Promise<void>} */ _operation;
	/** @type {CacheOptimizationHeartbeatScheduler} */ _scheduler;
	/** @type {(() => void) | null} */ _cancel = null;
	/** @type {Promise<void>} */ _pending = Promise.resolve();
	/** @type {unknown} */ _failure = null;

	/**
	 * Creates a heartbeat around one progress operation and one scheduling resource.
	 *
	 * @param {() => Promise<void>} operation - Progress operation invoked by each heartbeat.
	 * @param {CacheOptimizationHeartbeatScheduler} [scheduler] - Interval scheduler collaborator.
	 */
	constructor(operation, scheduler) {
		this._operation = operation;
		this._scheduler = scheduler ?? ((callback, intervalMilliseconds) => this._scheduleInterval(callback, intervalMilliseconds));
	}

	/**
	 * Called by the default scheduler to own the native interval resource.
	 *
	 * @param {() => void} callback - Interval callback.
	 * @param {number} intervalMilliseconds - Heartbeat interval.
	 * @returns {() => void} - Cancellation operation.
	 */
	_scheduleInterval(callback, intervalMilliseconds) {
		const handle = setInterval(callback, intervalMilliseconds);
		return () => clearInterval(handle);
	}

	/** Call this method to start the heartbeat interval; it throws when already active, and callers must retain the existing interval. */
	start() {
		if (this._cancel) throw new Error('Experiment progress heartbeat is already active.');
		this._cancel = this._scheduler(() => {
			const pending = this._pending.then(this._operation);
			this._pending = pending.catch((error) => {
				this._failure = error;
				this._cancelActiveInterval();
			});
		}, 10_000);
	}

	/**
	 * Call this method to stop the interval, settle pending work, and deliver a saved failure once.
	 * Rejects the saved operation failure once; callers may call again before failed run finalization.
	 *
	 * @returns {Promise<void>} - Completion after pending heartbeat work settles.
	 */
	async stop() {
		this._cancelActiveInterval();
		await this._pending;
		const failure = this._failure;
		this._failure = null;
		if (failure) throw failure;
	}

	/** Stop and release the scheduling resource when it is active. */
	_cancelActiveInterval() {
		if (this._cancel) this._cancel();
		this._cancel = null;
	}
}
