import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import os from 'node:os';

/** Existing OS runtime; no generated program, compilation or dependency installation. */
export const powershell = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
/** Fixed read-only OS query, not caller-supplied shell text. */
export const processQuery =
	"$ErrorActionPreference='Stop'; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,PrivatePageCount,WorkingSetSize,CreationDate | ConvertTo-Json -Compress";

/** Retire identities of descendants already observed absent, retaining both launch roots.
 * An absent descendant is no longer owned. A later process with that PID must
 * establish ownership through the current parent chain, never through history.
 * @param {Map<number,string>} births - Previous observed owned generations.
 * @param {Map<number,LocalSunCimProcess>} census - Current validated census.
 * @param {number} wrapperPid - Stable wrapper identity, never retired here.
 * @param {number} rootPid - Stable requested launch identity, never retired here.
 * @returns {void} - Only already absent non-root identities are removed.
 */
export function retireAbsentDescendants(births, census, wrapperPid, rootPid) {
	for (const pid of births.keys()) if (pid !== wrapperPid && pid !== rootPid && !census.has(pid)) births.delete(pid);
}

/** Sample an owned process tree through an existing OS command from JavaScript.
 * @returns {LocalSunScriptResourceSampler} - Sequential ten-second queries and explicit retirement.
 */
export function createWindowsProcessTelemetry() {
	if (process.platform !== 'win32') throw new Error('Windows process telemetry is required.');
	let stopped = false;
	/** @type {Promise<LocalSunHostResourceSample> | null} */ let pending = null;
	/** @type {AbortController | null} */ let cancellation = null;
	/** Birth identities retained while observed live; changed live PIDs and roots fail closed. @type {Map<number,string>} */
	const births = new Map();
	return {
		sample(rootPid) {
			if (stopped || pending || !Number.isSafeInteger(rootPid) || rootPid <= 0)
				return Promise.reject(new Error('Telemetry requires a live, sequential owned-root request.'));
			const abort = new AbortController();
			cancellation = abort;
			const started = performance.now();
			const operation = (async () => {
				const result = await promisify(execFile)(
					powershell,
					['-NoProfile', '-NonInteractive', '-Command', processQuery],
					{windowsHide: true, timeout: 10000, maxBuffer: 2 * 1024 * 1024, signal: abort.signal},
				);
				if (stopped || result.stderr.trim()) throw new Error('Resource query failed or retired.');
				const parsed = JSON.parse(result.stdout);
				/** @type {LocalSunCimProcess[]} */ const rows = Array.isArray(parsed) ? parsed : [parsed];
				const byPid = new Map();
				for (const row of rows) {
					if (
						!Number.isSafeInteger(row.ProcessId) ||
						row.ProcessId < 0 ||
						!Number.isSafeInteger(row.ParentProcessId) ||
						row.ParentProcessId < 0 ||
						byPid.has(row.ProcessId)
					)
						throw new Error('Malformed or duplicate process census identity.');
					byPid.set(row.ProcessId, row);
				}
				const owned = new Set([process.pid]);
				retireAbsentDescendants(births, byPid, process.pid, rootPid);
				// Preserve ownership of already observed descendants when an ancestor
				// exits. A recycled PID is never silently admitted to this owned tree.
				for (const [pid, birth] of births)
					if (byPid.has(pid)) {
						if (byPid.get(pid).CreationDate !== birth) throw new Error('Owned PID was reused.');
						owned.add(pid);
					}
				let changed = true;
				while (changed) {
					changed = false;
					for (const row of rows)
						if (!owned.has(row.ProcessId) && owned.has(row.ParentProcessId)) {
							owned.add(row.ProcessId);
							changed = true;
						}
				}
				if (!byPid.has(process.pid) || (!owned.has(rootPid) && !births.has(rootPid)))
					throw new Error('Requested process root is absent or outside wrapper ownership.');
				let privateBytes = 0,
					workingSetBytes = 0;
				for (const pid of owned) {
					const row = byPid.get(pid);
					if (!row || typeof row.CreationDate !== 'string' || !row.CreationDate)
						throw new Error('Owned process has no readable birth identity.');
					if (births.has(pid) && births.get(pid) !== row.CreationDate)
						throw new Error('Owned PID was reused; resource ownership cannot be established.');
					births.set(pid, row.CreationDate);
					const privateValue = Number(row.PrivatePageCount),
						workingValue = Number(row.WorkingSetSize);
					if (
						row.PrivatePageCount == null ||
						row.WorkingSetSize == null ||
						row.PrivatePageCount === '' ||
						row.WorkingSetSize === '' ||
						!Number.isSafeInteger(privateValue) ||
						privateValue < 0 ||
						!Number.isSafeInteger(workingValue) ||
						workingValue < 0
					)
						throw new Error('Owned process memory is unavailable.');
					privateBytes += privateValue;
					workingSetBytes += workingValue;
				}
				const freeBytes = os.freemem();
				if (![privateBytes, workingSetBytes, freeBytes].every((v) => Number.isSafeInteger(v) && v >= 0))
					throw new Error('Aggregate resource counters are invalid.');
				return {
					privateBytes,
					workingSetBytes,
					pids: [...owned].sort((a, b) => a - b),
					freeBytes,
					timestamp: new Date().toISOString(),
					collectorMilliseconds: performance.now() - started,
				};
			})();
			pending = operation;
			void operation
				.finally(() => {
					pending = null;
					cancellation = null;
				})
				.catch(() => {});
			return operation;
		},
		async stop() {
			stopped = true;
			cancellation?.abort();
			try {
				await pending;
			} catch {
				/* Sampling failure is delivered to its caller. */
			}
		},
	};
}
