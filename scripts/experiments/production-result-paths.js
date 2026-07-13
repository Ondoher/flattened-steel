import {join, resolve} from 'node:path';

const DEFAULT_EXPERIMENT_RESULTS_ROOT = resolve('references/results/experiments');

/**
 * Call this function to resolve the stable folder name for a production execution backend.
 *
 * @param {string} backend - The production-run backend identity or CLI backend selection.
 * @returns {string} - The backend-specific result folder name.
 */
export function resolveProductionBackendDirectory(backend) {
	if (backend === 'cpu' || backend === 'cpu-reference-binary64') return 'cpu';
	if (backend === 'gpu' || backend === 'gpu-production-shaders-r32f') return 'gpu';
	throw new RangeError(`Unsupported production result backend: ${backend}`);
}

/**
 * Call this function to resolve an experiment's backend-specific result directory.
 *
 * @param {string | undefined} outputRoot - The optional parent result folder.
 * @param {string} experimentDirectory - The experiment-owned directory name.
 * @param {string} backend - The production-run backend identity or CLI backend selection.
 * @returns {string} - The absolute experiment and backend-specific result directory.
 */
export function resolveProductionResultRoot(outputRoot, experimentDirectory, backend) {
	return join(
		resolve(outputRoot ?? DEFAULT_EXPERIMENT_RESULTS_ROOT),
		experimentDirectory,
		resolveProductionBackendDirectory(backend),
	);
}

export {DEFAULT_EXPERIMENT_RESULTS_ROOT};
