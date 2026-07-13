#!/usr/bin/env node

import {
	lstat,
	readFile,
	stat,
} from "node:fs/promises";
import {
	basename,
	resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

import {
	ARTIFACT_MANIFEST_SCHEMA_ID,
	ARTIFACT_SET_ENCODING,
	REQUIRED_RUN_RECORDS,
	RUN_RESULT_SCHEMA_ID,
	TERMINAL_CONCLUSIONS,
	collectArtifactRecords,
	computeArtifactSetSha256,
	parseRunId,
	resolveExistingRunDirectory,
	resolveRunRoots,
} from "../harness/lib/run-record.js";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

if (
	process.argv[1] !== undefined
	&& resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	await main(process.argv.slice(2));
}

/**
 * Recompute and validate a terminal run without writing or repairing it.
 *
 * @param {string} selector
 * @returns {Promise<Record<string, unknown>>}
 */
export async function verifyRun(selector) {
	const roots = resolveRunRoots();
	const runDirectory = await resolveExistingRunDirectory(selector, roots);
	const identity = parseRunId(basename(runDirectory));
	const manifestPath = resolve(runDirectory, "artifact-manifest.json");
	const manifestInfoBefore = await lstat(manifestPath);
	if (
		manifestInfoBefore.isSymbolicLink()
		|| !manifestInfoBefore.isFile()
	) {
		throw new Error("Terminal artifact manifest is not a real regular file.");
	}
	const manifestBytes = await readFile(manifestPath);
	const manifestInfoAfter = await lstat(manifestPath);
	if (!sameFileSnapshot(manifestInfoBefore, manifestInfoAfter)) {
		throw new Error("Artifact manifest changed while it was read.");
	}
	const manifest = parseJson(manifestBytes, "artifact-manifest.json");
	validateManifestShape(manifest, identity);

	const artifacts = await collectArtifactRecords(runDirectory);
	const expectedArtifacts = manifest.artifacts;
	if (artifacts.length !== expectedArtifacts.length) {
		throw new Error("Terminal artifact count differs from the manifest.");
	}
	for (let index = 0; index < artifacts.length; index += 1) {
		const actual = artifacts[index];
		const expected = expectedArtifacts[index];
		if (
			actual.path !== expected.path
			|| actual.byteLength !== expected.byteLength
			|| actual.sha256 !== expected.sha256
		) {
			throw new Error(
				`Terminal artifact differs from manifest: ${actual.path}`,
			);
		}
	}

	const artifactBytes = artifacts.reduce(
		(sum, artifact) => sum + artifact.byteLength,
		0,
	);
	const artifactSetSha256 = computeArtifactSetSha256(artifacts);
	if (
		manifest.artifactCount !== artifacts.length
		|| manifest.artifactBytes !== artifactBytes
		|| manifest.artifactSetSha256 !== artifactSetSha256
	) {
		throw new Error("Terminal artifact aggregate differs from the manifest.");
	}

	await verifyRequiredRecords({
		runDirectory,
		identity,
		manifest,
	});
	await verifyManifestWasLast({
		runDirectory,
		manifestInfo: manifestInfoAfter,
		artifacts,
	});

	return {
		verified: true,
		runId: identity.runId,
		runNumber: identity.runNumber,
		slug: identity.slug,
		conclusion: manifest.conclusion,
		artifactCount: artifacts.length,
		artifactBytes,
		artifactSetSha256,
	};
}

/**
 * @param {string[]} argumentsList
 * @returns {Promise<void>}
 */
async function main(argumentsList) {
	if (argumentsList.length !== 1) {
		process.stderr.write(
			"Usage: node runners/verify-run.js <run-id-or-contained-path>\n",
		);
		process.exitCode = 2;
		return;
	}
	try {
		const summary = await verifyRun(argumentsList[0]);
		process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${JSON.stringify({
			verified: false,
			error: {
				name: error instanceof Error ? error.name : "Error",
				message: error instanceof Error ? error.message : String(error),
			},
		}, null, 2)}\n`);
		process.exitCode = 1;
	}
}

/**
 * @param {Record<string, any>} manifest
 * @param {{runId: string, runNumber: number, slug: string}} identity
 * @returns {void}
 */
function validateManifestShape(manifest, identity) {
	if (
		manifest?.schemaId !== ARTIFACT_MANIFEST_SCHEMA_ID
		|| manifest.runId !== identity.runId
		|| manifest.runNumber !== identity.runNumber
		|| manifest.slug !== identity.slug
		|| !TERMINAL_CONCLUSIONS.includes(manifest.conclusion)
		|| manifest.hashAlgorithm !== "sha256"
		|| manifest.artifactSetEncoding !== ARTIFACT_SET_ENCODING
		|| !sameStringArray(
			manifest.requiredRecords,
			REQUIRED_RUN_RECORDS,
		)
		|| !Number.isSafeInteger(manifest.artifactCount)
		|| manifest.artifactCount < REQUIRED_RUN_RECORDS.length
		|| !Number.isSafeInteger(manifest.artifactBytes)
		|| manifest.artifactBytes < 0
		|| !SHA256_PATTERN.test(manifest.artifactSetSha256)
		|| !Array.isArray(manifest.artifacts)
		|| manifest.artifacts.length !== manifest.artifactCount
		|| !isIsoDate(manifest.initializedAt)
		|| !isIsoDate(manifest.finalizedAt)
		|| Date.parse(manifest.finalizedAt) < Date.parse(manifest.initializedAt)
	) {
		throw new Error("Artifact manifest metadata is invalid.");
	}
	computeArtifactSetSha256(manifest.artifacts);
}

/**
 * @param {{
 *   runDirectory: string,
 *   identity: {runId: string, runNumber: number, slug: string},
 *   manifest: Record<string, any>,
 * }} request
 * @returns {Promise<void>}
 */
async function verifyRequiredRecords({
	runDirectory,
	identity,
	manifest,
}) {
	const artifactPaths = new Set(
		manifest.artifacts.map((artifact) => artifact.path),
	);
	for (const required of REQUIRED_RUN_RECORDS) {
		if (!artifactPaths.has(required)) {
			throw new Error(`Manifest omits required run record: ${required}`);
		}
	}

	const result = parseJson(
		await readFile(resolve(runDirectory, "result.json")),
		"result.json",
	);
	if (
		result?.schemaId !== RUN_RESULT_SCHEMA_ID
		|| result.runId !== identity.runId
		|| result.runNumber !== identity.runNumber
		|| result.slug !== identity.slug
		|| result.state !== "terminal"
		|| result.conclusion !== manifest.conclusion
		|| result.initializedAt !== manifest.initializedAt
		|| result.finalizedAt !== manifest.finalizedAt
	) {
		throw new Error("Terminal result identity differs from the manifest.");
	}

	const report = await readFile(
		resolve(runDirectory, "report.md"),
		"utf8",
	);
	const command = await readFile(
		resolve(runDirectory, "command.txt"),
		"utf8",
	);
	if (report.trim() === "" || command.trim() === "") {
		throw new Error("Terminal report and command must be non-empty.");
	}
	for (const jsonPath of [
		"inputs.json",
		"provenance.json",
		"environment.json",
		"references/manifest.json",
	]) {
		parseJson(
			await readFile(resolve(runDirectory, ...jsonPath.split("/"))),
			jsonPath,
		);
	}
}

/**
 * Detect obvious post-terminal writes using filesystem ordering metadata.
 *
 * Equal timestamps are valid on filesystems with coarse timestamp precision.
 *
 * @param {{
 *   runDirectory: string,
 *   manifestInfo: import("node:fs").Stats,
 *   artifacts: readonly {path: string}[],
 * }} request
 * @returns {Promise<void>}
 */
async function verifyManifestWasLast({
	runDirectory,
	manifestInfo,
	artifacts,
}) {
	for (const artifact of artifacts) {
		const info = await stat(
			resolve(runDirectory, ...artifact.path.split("/")),
		);
		if (info.mtimeMs > manifestInfo.mtimeMs) {
			throw new Error(
				`Artifact is newer than the terminal manifest: ${artifact.path}`,
			);
		}
	}
}

/**
 * @param {Buffer} bytes
 * @param {string} label
 * @returns {Record<string, any>}
 */
function parseJson(bytes, label) {
	let result;
	try {
		result = JSON.parse(bytes.toString("utf8"));
	} catch {
		throw new Error(`${label} is not valid JSON.`);
	}
	if (
		result === null
		|| typeof result !== "object"
		|| Array.isArray(result)
	) {
		throw new Error(`${label} must contain a JSON object.`);
	}
	return result;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isIsoDate(value) {
	return typeof value === "string"
		&& Number.isFinite(Date.parse(value))
		&& new Date(value).toISOString() === value;
}

/**
 * @param {unknown} left
 * @param {readonly string[]} right
 * @returns {boolean}
 */
function sameStringArray(left, right) {
	return Array.isArray(left)
		&& left.length === right.length
		&& left.every(
			(value, index) =>
				typeof value === "string"
				&& value === right[index],
		);
}

/**
 * @param {import("node:fs").Stats} left
 * @param {import("node:fs").Stats} right
 * @returns {boolean}
 */
function sameFileSnapshot(left, right) {
	return left.dev === right.dev
		&& left.ino === right.ino
		&& left.size === right.size
		&& left.mtimeMs === right.mtimeMs
		&& left.ctimeMs === right.ctimeMs;
}
