import {execFile} from 'node:child_process';
import {freemem} from 'node:os';

/** Measure only the runner and the owned Chrome descendant tree on Windows.
 * No command lines, unrelated process identities or private user data are retained.
 * @param {SkyGpuResourceObservationRequest} request - Owned process identities and cancellation.
 * @returns {Promise<SkyContinuationMemoryObservation>} Actual private-memory observation.
 */
export async function observeMemory(request) {
	if (process.platform !== 'win32') throw new Error('This continuation memory monitor requires Windows.');
	if (![request.hostPid, request.chromePid].every((pid) => Number.isSafeInteger(pid) && pid > 0))
		throw new RangeError('Memory measurement requires valid owned process identifiers.');
	const script = `
$taskProcesses = @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,PrivatePageCount)
$taskOwned = [System.Collections.Generic.HashSet[int]]::new()
[void]$taskOwned.Add(${request.chromePid})
do {
  $taskAdded = $false
  foreach ($taskProcess in $taskProcesses) {
    if ($taskOwned.Contains([int]$taskProcess.ParentProcessId)) {
      if ($taskOwned.Add([int]$taskProcess.ProcessId)) { $taskAdded = $true }
    }
  }
} while ($taskAdded)
[void]$taskOwned.Add(${request.hostPid})
$taskBytes = [double]0
$taskCount = 0
foreach ($taskProcess in $taskProcesses) {
  if ($taskOwned.Contains([int]$taskProcess.ProcessId)) {
    $taskBytes += [double]$taskProcess.PrivatePageCount
    $taskCount++
  }
}
@{privateBytes=$taskBytes;processCount=$taskCount} | ConvertTo-Json -Compress
`;
	const text = await new Promise((resolve, reject) => {
		execFile(
			'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
			['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
			{windowsHide: true, timeout: 8000, maxBuffer: 16384, signal: request.signal},
			(error, stdout) => (error ? reject(error) : resolve(stdout)),
		);
	});
	const value = JSON.parse(String(text));
	if (
		!Number.isSafeInteger(value.privateBytes) ||
		value.privateBytes <= 0 ||
		!Number.isInteger(value.processCount) ||
		value.processCount < 2
	)
		throw new Error('Owned process private-memory measurement is incomplete.');
	return {
		timestamp: new Date().toISOString(),
		elapsedMilliseconds: request.elapsedMilliseconds,
		privateBytes: value.privateBytes,
		processCount: value.processCount,
		availableBytes: freemem(),
	};
}
