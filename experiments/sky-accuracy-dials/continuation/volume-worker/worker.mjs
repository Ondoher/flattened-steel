import {isMainThread, parentPort, workerData} from 'node:worker_threads';
import {evaluateVolumeFirstOrder} from '../volume-reference/index.mjs';

if (isMainThread || !parentPort) throw new Error('Volume worker requires its owning pool.');
const port = parentPort;
const {spec, channels, deadlineEpochMilliseconds} = /** @type {SkyVolumeWorkerData} */ (workerData);

/** Enforce the caller's absolute deadline within the numerical evaluator. */
function guard() {
	if (Date.now() >= deadlineEpochMilliseconds) throw new RangeError('Volume worker deadline exceeded.');
}

port.on('messageerror', (error) => {
	throw error;
});
port.on(
	'message',
	/** @param {SkyVolumeWorkerRequest} request - Owning pool's single outstanding task. */ (request) => {
		guard();
		const started = performance.now();
		const result = evaluateVolumeFirstOrder(spec, request.task.origin, request.task.direction, channels, {
			profile: 'simpson-expanded-medium',
			outerStrategy: 'global',
			guard,
		});
		guard();
		/** @type {SkyVolumeWorkerReply} */
		const reply = {
			index: request.index,
			row: {
				id: request.task.id,
				result,
				elapsedMilliseconds: Math.max(0, performance.now() - started),
			},
		};
		port.postMessage(reply);
	},
);
