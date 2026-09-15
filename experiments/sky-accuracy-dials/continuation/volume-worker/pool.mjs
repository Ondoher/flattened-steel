import {Worker} from 'node:worker_threads';

/** Create a bounded in-memory executor without changing any numerical admission.
 * The caller authenticates source and inputs, owns evidence and cumulative resource
 * accounting, and always awaits close in a finally block. Guard/callback failures
 * preserve their exact thrown identity after termination of all owned workers.
 * @param {SkyTransportSpec} spec - Fixed matched physical input, cloned on creation.
 * @param {readonly number[]} channels - Fixed channel order, cloned on creation.
 * @param {SkyVolumeWorkerOptions} options - Worker, deadline and caller resource bounds.
 * @returns {SkyVolumeWorkerPool} Reusable ordered batches and explicit worker teardown.
 */
export function createVolumeWorkerPool(spec, channels, options) {
	if (!Number.isInteger(options.workerCount) || options.workerCount < 1 || options.workerCount > 4)
		throw new RangeError('Volume pool requires one through four workers.');
	if (!Number.isFinite(options.deadlineEpochMilliseconds) || options.deadlineEpochMilliseconds <= Date.now())
		throw new RangeError('Volume pool requires a finite future deadline.');
	if (
		typeof options.guard !== 'function' ||
		(options.onComplete !== undefined && typeof options.onComplete !== 'function')
	)
		throw new TypeError('Volume pool guards and completion callbacks must be functions.');
	const {workerCount, deadlineEpochMilliseconds, guard, onComplete} = options;
	/** @type {SkyVolumeWorkerData} */
	const data = structuredClone({spec, channels, deadlineEpochMilliseconds});
	/** @type {SkyVolumeWorkerSlot[]} */
	const slots = [];
	/** @type {SkyVolumeWorkerBatch | null} */
	let active = null;
	/** @type {Promise<void> | null} */
	let shutdown = null;
	/** @type {unknown} */
	let terminalError;
	let closed = false;
	const timer = setInterval(check, 500);
	timer.unref();

	/** End the pool once and join all workers before rejecting an active batch.
	 * @param {unknown} error - Original terminal cause, including arbitrary guard throws.
	 */
	function stop(error) {
		if (closed) return;
		closed = true;
		terminalError = error;
		clearInterval(timer);
		const pending = active;
		active = null;
		shutdown = Promise.allSettled(slots.map(async (slot) => slot.worker.terminate())).then((outcomes) => {
			const failures = outcomes.filter((outcome) => outcome.status === 'rejected');
			if (failures.length)
				throw new AggregateError(
					failures.map((failure) => failure.reason),
					'Volume worker teardown failed.',
				);
		});
		// The active batch retains its original failure even if a join also fails;
		// close separately reports join failures after all termination attempts settle.
		void shutdown.then(
			() => pending?.reject(error),
			() => pending?.reject(error),
		);
	}

	/** Run on the main thread every 500 ms and on each received message.
	 * @returns {boolean} Whether work may continue after the caller's guard.
	 */
	function check() {
		if (closed) return false;
		try {
			guard();
			if (Date.now() >= deadlineEpochMilliseconds) throw new RangeError('Volume pool deadline exceeded.');
			return !closed;
		} catch (error) {
			stop(error);
			return false;
		}
	}

	/** Assign at most one pending task to this worker.
	 * @param {SkyVolumeWorkerSlot} slot - An idle owned worker.
	 */
	function dispatch(slot) {
		if (closed || !active || slot.index !== null || active.next >= active.tasks.length) return;
		const index = active.next++;
		slot.index = index;
		/** @type {SkyVolumeWorkerRequest} */
		const request = {index, task: active.tasks[index]};
		try {
			slot.worker.postMessage(request);
		} catch (error) {
			stop(error);
		}
	}

	/** Accept only the result owned by this worker, then refill its one-task queue.
	 * @param {SkyVolumeWorkerSlot} slot - Sending worker.
	 * @param {SkyVolumeWorkerReply} message - Result from the fixed authored worker entry.
	 */
	function receive(slot, message) {
		if (!check()) return;
		const batch = active;
		if (
			!batch ||
			slot.index === null ||
			message?.index !== slot.index ||
			message.row?.id !== batch.tasks[slot.index].id ||
			!message.row.result ||
			!Number.isFinite(message.row.elapsedMilliseconds) ||
			message.row.elapsedMilliseconds < 0 ||
			batch.rows[slot.index] !== null
		) {
			stop(new Error('Volume worker returned an unexpected or incomplete result.'));
			return;
		}
		batch.rows[slot.index] = message.row;
		slot.index = null;
		batch.completed++;
		try {
			onComplete?.(batch.completed, message.row.id);
		} catch (error) {
			stop(error);
			return;
		}
		if (!check()) return;
		if (batch.completed === batch.tasks.length) {
			if (batch.rows.some((row) => row === null)) {
				stop(new Error('Volume worker batch ended with missing results.'));
				return;
			}
			active = null;
			batch.resolve(/** @type {SkyVolumeWorkerRow[]} */ (batch.rows));
		} else dispatch(slot);
	}

	/** @param {readonly SkyVolumeWorkerTask[]} tasks - Zero through 4096 unique caller rays.
	 * @returns {Promise<SkyVolumeWorkerRow[]>} Complete ordered batch or an explicit failure.
	 */
	async function evaluate(tasks) {
		if (closed) throw terminalError;
		if (active) throw new Error('Volume pool already has an active batch.');
		if (
			!Array.isArray(tasks) ||
			tasks.length > 4096 ||
			tasks.some(
				(task) =>
					!task ||
					typeof task.id !== 'string' ||
					!task.id.length ||
					!Array.isArray(task.origin) ||
					task.origin.length !== 3 ||
					!task.origin.every(Number.isFinite) ||
					!Array.isArray(task.direction) ||
					task.direction.length !== 3 ||
					!task.direction.every(Number.isFinite),
			) ||
			new Set(tasks.map((task) => task.id)).size !== tasks.length
		)
			throw new RangeError('Volume batches require at most 4096 uniquely identified finite physical rays.');
		const copied = structuredClone(tasks);
		return new Promise((resolve, reject) => {
			active = {tasks: copied, rows: Array(copied.length).fill(null), next: 0, completed: 0, resolve, reject};
			if (!check()) return;
			if (!copied.length) {
				active = null;
				resolve([]);
				return;
			}
			try {
				while (slots.length < workerCount) {
					const worker = new Worker(new URL('./worker.mjs', import.meta.url), {
						workerData: data,
						resourceLimits: {maxOldGenerationSizeMb: 512},
						execArgv: [],
					});
					/** @type {SkyVolumeWorkerSlot} */
					const slot = {worker, index: null};
					slots.push(slot);
					worker.on('message', (message) => receive(slot, message));
					worker.on('messageerror', (error) => {
						if (check()) stop(error);
					});
					worker.on('error', (error) => {
						if (check()) stop(error);
					});
					worker.on('exit', (code) => {
						if (check()) stop(new Error(`Volume worker exited unexpectedly with code ${code}.`));
					});
				}
				for (const slot of slots) dispatch(slot);
			} catch (error) {
				stop(error);
			}
		});
	}

	/** Cancel any active batch, then await all worker exits.
	 * @returns {Promise<void>} Joined pool; rejects only if worker termination itself failed.
	 */
	async function close() {
		stop(new Error('Volume pool closed before completion.'));
		await shutdown;
	}

	return {evaluate, close};
}
