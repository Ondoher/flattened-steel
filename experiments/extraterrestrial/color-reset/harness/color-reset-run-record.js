import {join} from 'node:path';

import {initializeRunRecord, resolveRunRoots} from '../../harness/lib/run-record.js';
import {OUTPUT_ROOT} from '../../harness/lib/roots.js';

export const COLOR_RESET_RUN_NAMESPACE = 'color-reset';
export const COLOR_RESET_OUTPUT_ROOT = join(OUTPUT_ROOT, COLOR_RESET_RUN_NAMESPACE);
export const COLOR_RESET_RUNS_ROOT = join(COLOR_RESET_OUTPUT_ROOT, 'runs');
export const COLOR_RESET_BROWSER_PROFILES_ROOT = join(COLOR_RESET_OUTPUT_ROOT, 'browser-profiles');

const COLOR_RESET_ROOT_REQUEST = Object.freeze({
	runNamespace: COLOR_RESET_RUN_NAMESPACE,
});

/**
 * Resolve the fixed color-reset output and run roots.
 *
 * @returns {ReturnType<typeof resolveRunRoots>}
 */
export function resolveColorResetRunRoots() {
	return resolveRunRoots(COLOR_RESET_ROOT_REQUEST);
}

/**
 * Initialize one color-reset experiment before any qualifying work begins.
 *
 * @param {{
 *   slug: string,
 *   command: string,
 *   inputs: Record<string, unknown>,
 *   provenance: Record<string, unknown>,
 *   environment: Record<string, unknown>,
 *   references: Record<string, unknown>,
 * }} request
 * @returns {ReturnType<typeof initializeRunRecord>}
 */
export function initializeColorResetRunRecord(request) {
	if (request === null || typeof request !== 'object') {
		throw new TypeError('Color-reset run request must be an object.');
	}
	if ('roots' in request) {
		throw new Error('Color-reset runners may not override their run roots.');
	}
	for (const field of ['inputs', 'provenance']) {
		if (request[field] === null || typeof request[field] !== 'object' || Array.isArray(request[field])) {
			throw new TypeError(`Color-reset ${field} must be a record.`);
		}
	}
	return initializeRunRecord({
		...request,
		inputs: {
			...request.inputs,
			runNamespace: COLOR_RESET_RUN_NAMESPACE,
		},
		provenance: {
			...request.provenance,
			runNamespace: COLOR_RESET_RUN_NAMESPACE,
		},
		roots: COLOR_RESET_ROOT_REQUEST,
	});
}
