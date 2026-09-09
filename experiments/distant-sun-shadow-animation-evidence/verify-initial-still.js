#!/usr/bin/env node

import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {ArtifactManifest} from '../../scripts/animation-evidence/node.js';
import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

/**
 * Call this function to stop when a verification invariant is false.
 * @param {unknown} value Value that must be truthy.
 * @param {string} message Failure message.
 * @returns {asserts value}
 */
function requireValue(value, message) {
	if (!value) throw new Error(message);
}

/**
 * Call this function to decide whether a target is below its root.
 * @param {string} root Absolute root.
 * @param {string} target Absolute target.
 * @returns {boolean} True when contained.
 */
function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Call this function to resolve a real file contained by one verified run.
 * @param {string} runRoot Canonical run root.
 * @param {string} relativePath Slash-separated run-relative path.
 * @param {string} label Human-readable boundary label.
 * @returns {Promise<string>} Canonical contained file path.
 */
async function requireRunFile(runRoot, relativePath, label) {
	requireValue(
		typeof relativePath === 'string' &&
			!path.isAbsolute(relativePath) &&
			!relativePath.includes('\\') &&
			relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
		`Unsafe ${label} path.`,
	);
	const expected = path.join(runRoot, ...relativePath.split('/'));
	const actual = await realpath(expected);
	const information = await lstat(expected);
	requireValue(
		isWithin(runRoot, actual) &&
			information.isFile() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} escaped the run or crossed a reparse boundary.`,
	);
	return actual;
}

/**
 * Call this function to validate a retained still result at JSON ingress.
 * @param {unknown} value Parsed JSON value.
 * @returns {asserts value is ShadowStillResult}
 */
function validateResult(value) {
	requireValue(value !== null && typeof value === 'object', 'Result must be an object.');
	const result = /** @type {Record<string, unknown>} */ (value);
	requireValue(
		result.schemaId === 'distant-sun-shadow-animation-evidence-initial-still-result-v1' &&
			['accepted', 'rejected'].includes(/** @type {string} */ (result.state)),
		'Result schema or state is invalid.',
	);
	requireValue(result.capture !== null && typeof result.capture === 'object', 'Result capture must be an object.');
	const capture = /** @type {Record<string, unknown>} */ (result.capture);
	requireValue(
		capture !== null &&
			typeof capture.path === 'string' &&
			/^captures\/[a-z0-9-]+\.png$/u.test(capture.path) &&
			Number.isSafeInteger(capture.byteLength) &&
			/** @type {number} */ (capture.byteLength) > 0 &&
			typeof capture.sha256 === 'string' &&
			/^[0-9a-f]{64}$/u.test(capture.sha256),
		'Result capture identity is invalid.',
	);
	requireValue(result.pixels !== null && typeof result.pixels === 'object', 'Result pixels are invalid.');
	const pixels = /** @type {Record<string, unknown>} */ (result.pixels);
	requireValue(
		['width', 'height', 'uniqueSampledColors', 'meanLuma', 'darkPixelFraction', 'brightPixelFraction'].every(
			(key) => typeof pixels[key] === 'number' && Number.isFinite(pixels[key]),
		),
		'Result pixel measurements are incomplete.',
	);
	requireValue(result.sceneFacts !== null && typeof result.sceneFacts === 'object', 'Result scene facts are invalid.');
	const sceneFacts = /** @type {Record<string, unknown>} */ (result.sceneFacts);
	requireValue(
		typeof sceneFacts.cameraFieldOfViewDegrees === 'number' && sceneFacts.endpoint !== null && typeof sceneFacts.endpoint === 'object',
		'Result camera or endpoint facts are invalid.',
	);
	const endpoint = /** @type {Record<string, unknown>} */ (sceneFacts.endpoint);
	requireValue(
		['shadowCasterCount', 'shadowMapCount', 'shadowMapWidth', 'shadowMapHeight'].every(
			(key) => Number.isSafeInteger(endpoint[key]),
		),
		'Result endpoint facts are incomplete.',
	);
}

/**
 * Call this function to validate a retained artifact manifest at JSON ingress.
 * @param {unknown} value Parsed JSON value.
 * @returns {asserts value is ShadowStillArtifactManifest}
 */
function validateManifest(value) {
	requireValue(value !== null && typeof value === 'object', 'Artifact manifest must be an object.');
	const manifest = /** @type {Record<string, unknown>} */ (value);
	requireValue(
		manifest.schemaId === 'distant-sun-shadow-animation-evidence-artifact-manifest-v1' &&
			['accepted', 'rejected'].includes(/** @type {string} */ (manifest.state)) &&
			Array.isArray(manifest.artifacts) &&
			typeof manifest.artifactSetSha256 === 'string' &&
			/^[0-9a-f]{64}$/u.test(manifest.artifactSetSha256),
		'Artifact manifest schema is invalid.',
	);
	for (const artifactValue of manifest.artifacts) {
		requireValue(artifactValue !== null && typeof artifactValue === 'object', 'Artifact entry is invalid.');
		const artifact = /** @type {Record<string, unknown>} */ (artifactValue);
		requireValue(
			typeof artifact.path === 'string' &&
				!path.isAbsolute(artifact.path) &&
				!artifact.path.includes('\\') &&
				artifact.path.split('/').every((segment) => segment && segment !== '.' && segment !== '..') &&
				Number.isSafeInteger(artifact.byteLength) &&
				/** @type {number} */ (artifact.byteLength) >= 0 &&
				typeof artifact.sha256 === 'string' &&
				/^[0-9a-f]{64}$/u.test(artifact.sha256),
			'Artifact entry identity is invalid.',
		);
	}
}

/**
 * Call this function to independently verify one completed still run.
 * @returns {Promise<void>} Completion promise.
 */
async function main() {
	const runId = process.argv[2];
	requireValue(typeof runId === 'string' && /^\d+-initial-shadow-still$/u.test(runId), 'Supply one safe still run id.');
	const repositoryRoot = await realpath(REPOSITORY_ROOT);
	const outputRoot = await realpath(OUTPUT_ROOT);
	const runDirectory = path.join(outputRoot, 'runs', runId);
	const runReal = await realpath(runDirectory);
	const information = await lstat(runDirectory);
	requireValue(
		isWithin(repositoryRoot, outputRoot) &&
			isWithin(outputRoot, runReal) &&
			information.isDirectory() &&
			!information.isSymbolicLink() &&
			runReal.toLowerCase() === runDirectory.toLowerCase(),
		'Run directory escaped containment or crossed a reparse boundary.',
	);
	const result = JSON.parse(await readFile(await requireRunFile(runReal, 'result.json', 'Result'), 'utf8'));
	const manifest = JSON.parse(
		await readFile(await requireRunFile(runReal, 'artifact-manifest.json', 'Artifact manifest'), 'utf8'),
	);
	validateResult(result);
	validateManifest(manifest);
	requireValue(result.state === 'accepted' && manifest.state === 'accepted', 'Run is not accepted.');
	await ArtifactManifest.verify(runReal, manifest);
	const captureArtifact = manifest.artifacts.find((artifact) => artifact.path === result.capture.path);
	requireValue(
		captureArtifact?.byteLength === result.capture.byteLength &&
			captureArtifact.sha256 === result.capture.sha256,
		'Result capture identity differs from the verified artifact manifest.',
	);
	const png = await readFile(await requireRunFile(runReal, result.capture.path, 'Capture'));
	requireValue(png.readUInt32BE(0) === 0x89504e47 && png.toString('ascii', 1, 4) === 'PNG', 'Capture is not PNG.');
	requireValue(png.readUInt32BE(16) === 3840 && png.readUInt32BE(20) === 2160, 'PNG dimensions changed.');
	requireValue(result.sceneFacts.cameraFieldOfViewDegrees === 55, 'Camera FOV changed.');
	requireValue(result.sceneFacts.endpoint.shadowCasterCount === 6, 'Review-object count changed.');
	requireValue(result.sceneFacts.endpoint.shadowMapCount === 6, 'Shadow-map count changed.');
	requireValue(result.sceneFacts.endpoint.shadowMapWidth === 4096, 'Shadow-map width changed.');
	requireValue(result.sceneFacts.endpoint.shadowMapHeight === 4096, 'Shadow-map height changed.');
	console.log(
		JSON.stringify(
			{
				ok: true,
				runId,
				artifactSetSha256: manifest.artifactSetSha256,
				capture: result.capture,
				pixels: result.pixels,
			},
			null,
			2,
		),
	);
}

await main();
