#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import puppeteer from 'puppeteer';

import {ArtifactManifest} from './node.js';

const SOURCE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SOURCE_DIRECTORY, '..', '..');
const OUTPUT_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'animation-evidence');
const CHROME_EXECUTABLE =
	process.env.ANIMATION_EVIDENCE_CHROME_EXECUTABLE ??
	(process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);

/**
 * Call this function to hash bytes with SHA-256.
 * @param {Uint8Array} bytes Bytes to hash.
 * @returns {string} Lowercase hexadecimal digest.
 */
function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Call this function to test whether a resolved path remains within a root.
 * @param {string} root Resolved root path.
 * @param {string} target Resolved target path.
 * @returns {boolean} Whether the target is contained.
 */
function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Call this function to execute a real browser WebCodecs compatibility qualification.
 * @returns {Promise<void>} Qualification completion promise.
 */
async function main() {
	if (!isWithin(path.join(REPOSITORY_ROOT, 'tmp'), OUTPUT_ROOT)) {
		throw new Error('Animation-evidence output root escaped repository tmp.');
	}
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const runId = `${Date.now()}-browser-compatibility`;
	const runDirectory = path.join(OUTPUT_ROOT, runId);
	await mkdir(runDirectory);
	const pagePath = path.join(runDirectory, 'probe.html');
	await writeFile(
		pagePath,
		'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Animation evidence codec probe</title></head><body>WebCodecs probe</body></html>\n',
		{flag: 'wx'},
	);
	const browser = await puppeteer.launch({
		headless: true,
		...(CHROME_EXECUTABLE ? {executablePath: CHROME_EXECUTABLE} : {}),
		args: [
			'--allow-file-access-from-files',
			'--enable-gpu',
			'--ignore-gpu-blocklist',
			'--disable-background-timer-throttling',
			'--disable-breakpad',
			'--disable-crash-reporter',
			'--noerrdialogs',
		],
	});
	try {
		const page = await browser.newPage();
		await page.goto(pathToFileURL(pagePath).href, {waitUntil: 'load'});
		const moduleUrl = pathToFileURL(path.join(SOURCE_DIRECTORY, 'index.js')).href;
		const selected = await page.evaluate(async (url) => {
			const {WebCodecsEncoderSelector} = await import(url);
			const shared = {
				width: 640,
				height: 360,
				bitrate: 4_000_000,
				framerate: 60,
				bitrateMode: 'variable',
				latencyMode: 'quality',
				avc: {format: 'avc'},
			};
			return WebCodecsEncoderSelector.select([
				{
					id: 'avc-high-5.2-prefer-hardware',
					config: {...shared, codec: 'avc1.640034', hardwareAcceleration: 'prefer-hardware'},
				},
				{
					id: 'avc-high-5.2-no-preference',
					config: {...shared, codec: 'avc1.640034', hardwareAcceleration: 'no-preference'},
				},
				{
					id: 'avc-baseline-prefer-hardware',
					config: {...shared, codec: 'avc1.42001e', hardwareAcceleration: 'prefer-hardware'},
				},
				{
					id: 'avc-baseline-no-preference',
					config: {...shared, codec: 'avc1.42001e', hardwareAcceleration: 'no-preference'},
				},
			]);
		}, moduleUrl);
		const result = {
			schemaId: 'animation-evidence-browser-compatibility-v1',
			toolVersion: '1.0.0',
			runId,
			accepted: true,
			browserVersion: await browser.version(),
			probe: selected,
			claimBoundary:
				'Real WebCodecs capability and one-frame encode at 640x360. The sealed S9 parent remains the actual 4K AVC/fragmented-MP4 finalization and decode oracle.',
		};
		await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
		const sourceBytes = await readFile(fileURLToPath(import.meta.url));
		await writeFile(
			path.join(runDirectory, 'provenance.json'),
			`${JSON.stringify(
				{
					schemaId: 'animation-evidence-browser-compatibility-provenance-v1',
					operation:
						'Load the reusable browser entrypoint from a local file, probe ordered caller-owned AVC candidates, and require one successful encoded WebCodecs frame.',
					source: {
						path: 'scripts/animation-evidence/verify-browser-compatibility.js',
						sha256: sha256(sourceBytes),
					},
					sealedContainerOracle: {
						runId: '1788923711177-s9-deterministic-video',
						artifactSetSha256: '07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01',
						publishedByRunId: '1788926658377-s9-published-evidence',
					},
				},
				null,
				2,
			)}\n`,
			{flag: 'wx'},
		);
		const manifest = await ArtifactManifest.create(runDirectory);
		await writeFile(
			path.join(runDirectory, 'artifact-manifest.json'),
			`${JSON.stringify({schemaId: 'animation-evidence-artifact-manifest-v1', ...manifest}, null, 2)}\n`,
			{flag: 'wx'},
		);
		process.stdout.write(
			`${JSON.stringify({runDirectory, ...result, artifactSetSha256: manifest.artifactSetSha256}, null, 2)}\n`,
		);
	} finally {
		await browser.close();
	}
}

await main();
