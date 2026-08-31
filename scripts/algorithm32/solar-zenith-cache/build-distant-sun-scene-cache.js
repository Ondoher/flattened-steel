#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import DistantSunSceneCacheOfflineCompiler from './DistantSunSceneCacheOfflineCompiler.js';

/**
 * Called by this command to read one required named argument.
 *
 * @param {string} name - The command-line argument name.
 * @returns {string} - The supplied argument value.
 */
function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) {
		throw new Error(`${name} is required.`);
	}
	return value;
}

const compiler = new DistantSunSceneCacheOfflineCompiler({
	chromePath: path.resolve(requireArgument('--chrome')),
});
const sceneArgumentIndex = process.argv.indexOf('--scene');
const scenePath = sceneArgumentIndex < 0 ? null : process.argv[sceneArgumentIndex + 1];
if (sceneArgumentIndex >= 0 && (!scenePath || scenePath.startsWith('--'))) {
	throw new Error('--scene requires a scene JSON path.');
}
const result = await compiler.compile({
	outputDirectory: path.resolve(requireArgument('--output')),
	...(scenePath ? {scene: JSON.parse(await readFile(path.resolve(scenePath), 'utf8'))} : {}),
});

process.stdout.write(
	`${JSON.stringify(
		{
			outputDirectory: result.outputDirectory,
			manifestPath: result.manifestPath,
			manifestSha256: result.manifestSha256,
			cacheIdentity: result.manifest.cacheIdentity,
			oraclePayload: result.manifest.oraclePayload,
			exactSeamPayload: result.manifest.exactSeamPayload,
			logicalToUniqueIndex: result.manifest.logicalToUniqueIndex,
		},
		null,
		2,
	)}\n`,
);
