import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {outputRoot, checkPath} from './run-boundary.js';

/** Require the live resource wrapper's inherited launch capability before heavy work.
 * This prevents accidental unguarded launches; it is not a hostile-process security boundary.
 * @returns {Promise<void>} - Admission only while the exact exclusive owner remains live.
 */
export async function requireHeavyExecution() {
	const capability = process.env.LOCAL_SUN_HEAVY_EXECUTION;
	if (!capability) throw new Error('Heavy work requires run-resource-bounded.js.');
	/** @type {LocalSunHeavyExecutionOwnership} */ const owner = JSON.parse(capability);
	if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0 || owner.pid === process.pid ||
		!/^\d{5}-resource-bound$/u.test(owner.run) ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(owner.nonce))
		throw new Error('Invalid heavy-execution launch capability.');
	const lock = path.join(outputRoot, 'heavy-execution.lock');
	await checkPath(outputRoot, lock);
	if (await readFile(lock, 'utf8') !== capability) throw new Error('Heavy-execution owner changed.');
	process.kill(owner.pid, 0);
}
