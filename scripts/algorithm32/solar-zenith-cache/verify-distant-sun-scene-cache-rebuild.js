#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

import DistantSunSceneCacheManifest from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheManifest.js';

/**
 * Called by this command to read one required named argument.
 *
 * @param {string} name - The command-line argument name.
 * @returns {string} - The supplied argument value.
 */
function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

/**
 * Called by this command to hash one exact payload.
 *
 * @param {Buffer} bytes - The payload bytes.
 * @returns {string} - The lowercase SHA-256 hash.
 */
function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Called by this command to read one manifest-owned payload without leaving the package.
 *
 * @param {string} packageDirectory - The canonical package directory.
 * @param {DistantSunSceneCachePayloadReference} reference - The accepted manifest payload reference.
 * @returns {Promise<Buffer>} - The exact payload bytes.
 */
async function readPayload(packageDirectory, reference) {
	const target = await realpath(path.join(packageDirectory, reference.path));
	if (!target.startsWith(`${packageDirectory}${path.sep}`)) {
		throw new Error('Scene-cache rebuild payload escapes its package.');
	}
	const bytes = await readFile(target);
	if (bytes.byteLength !== reference.byteLength || sha256(bytes) !== reference.sha256) {
		throw new Error(`Scene-cache rebuild payload failed its manifest identity: ${reference.path}.`);
	}
	return bytes;
}

const packageDirectory = await realpath(path.resolve(requireArgument('--package')));
const manifestPath = await realpath(path.join(packageDirectory, requireArgument('--manifest')));
if (!manifestPath.startsWith(`${packageDirectory}${path.sep}`)) {
	throw new Error('Scene-cache rebuild manifest escapes its package.');
}
const manifestRecord = JSON.parse(await readFile(manifestPath, 'utf8'));
const manifest = new DistantSunSceneCacheManifest(manifestRecord);
await Promise.all([
	readPayload(packageDirectory, manifest.record.oraclePayload),
	readPayload(packageDirectory, manifest.record.exactSeamPayload),
	readPayload(packageDirectory, manifest.record.logicalToUniqueIndex),
]);
const expected = {
	oracle: requireArgument('--expected-oracle-sha256'),
	exactSeam: requireArgument('--expected-seam-sha256'),
	logicalToUniqueIndex: requireArgument('--expected-index-sha256'),
};
const actual = {
	oracle: manifest.record.oraclePayload.sha256,
	exactSeam: manifest.record.exactSeamPayload.sha256,
	logicalToUniqueIndex: manifest.record.logicalToUniqueIndex.sha256,
};
if (Object.keys(expected).some((key) => expected[key] !== actual[key])) {
	throw new Error('Production scene-cache rebuild differs from the qualified deterministic identities.');
}
const proof = {
	schemaId: 'algorithm32-distant-sun-scene-cache-deterministic-rebuild-proof-v1',
	accepted: true,
	claim: 'The production-owned offline compiler reproduced the sealed P9 oracle and P10 exact-seam identities.',
	qualifiedControls: {
		oracle: '000572-point-local-scene-cache-p9-w27-asset',
		exactSeam: '000579-point-local-scene-cache-p10-seam-dedup',
	},
	expected,
	actual,
	manifest: path.basename(manifestPath),
	cacheIdentity: manifest.record.cacheIdentity,
};
await writeFile(
	path.join(packageDirectory, 'deterministic-rebuild-proof.json'),
	`${JSON.stringify(proof, null, 2)}\n`,
	{flag: 'wx'},
);
process.stdout.write(`${JSON.stringify(proof, null, 2)}\n`);
