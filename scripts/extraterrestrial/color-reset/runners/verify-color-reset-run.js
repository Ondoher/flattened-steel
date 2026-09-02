#!/usr/bin/env node

import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {verifyRun} from '../../runners/verify-run.js';
import {resolveColorResetRunRoots} from '../harness/color-reset-run-record.js';

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main(process.argv.slice(2));
}

/**
 * Verify a terminal color-reset run without writing to it.
 *
 * @param {string} selector
 * @returns {Promise<Record<string, unknown>>}
 */
export function verifyColorResetRun(selector) {
	return verifyRun(selector, resolveColorResetRunRoots());
}

/**
 * @param {string[]} argumentsList
 * @returns {Promise<void>}
 */
async function main(argumentsList) {
	if (argumentsList.length !== 1) {
		process.stderr.write(
			'Usage: node color-reset/runners/verify-color-reset-run.js ' + '<run-id-or-contained-path>\n',
		);
		process.exitCode = 2;
		return;
	}
	try {
		const summary = await verifyColorResetRun(argumentsList[0]);
		process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(
			`${JSON.stringify(
				{
					verified: false,
					error: {
						name: error instanceof Error ? error.name : 'Error',
						message: error instanceof Error ? error.message : String(error),
					},
				},
				null,
				2,
			)}\n`,
		);
		process.exitCode = 1;
	}
}
