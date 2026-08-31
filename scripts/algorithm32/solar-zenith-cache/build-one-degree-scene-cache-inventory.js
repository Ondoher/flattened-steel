#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, stat, statfs, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import DistantSunSceneCacheOfflineCompiler from './DistantSunSceneCacheOfflineCompiler.js';

const SOURCE_IDENTITY = 'algorithm32-native-distant-collimated-sun-v1';
const SUPPORT_IDENTITY = 'san-jose-fixed-observer-complete-rotation-v1';
const CONTROL_SCHEMA_ID = 'algorithm32-distant-sun-one-degree-inventory-control-v1';
const INDEX_SCHEMA_ID = 'algorithm32-distant-sun-one-degree-inventory-index-v1';
const CANONICAL_INSTANT = '2000-01-01T12:00:00.000Z';
const MINIMUM_FREE_BYTES = 45 * 1024 ** 3;

function argument(name, fallback = null) {
	const index = process.argv.indexOf(name);
	if (index < 0) return fallback;
	const value = process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
	return value;
}

function integerArgument(name, fallback) {
	const value = Number(argument(name, `${fallback}`));
	if (!Number.isInteger(value)) throw new Error(`${name} must be an integer.`);
	return value;
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value) {
	return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function degreeId(degrees) {
	return `solar-zenith-${`${degrees}`.padStart(3, '0')}-degrees`;
}

function createScene(degrees) {
	const radians = (degrees * Math.PI) / 180;
	const directionToSourceUpEastNorth = [Math.cos(radians), -Math.sin(radians), 0];

	return {
		sceneSun: {
			id: degreeId(degrees),
			instant: CANONICAL_INSTANT,
			directionToSourceUpEastNorth,
			sourceIdentity: SOURCE_IDENTITY,
		},
		support: {
			id: SUPPORT_IDENTITY,
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 1.7, units: 'meters'},
			observerSolarZenith: {value: radians, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
	};
}

async function requireNoLink(target, label) {
	const facts = await lstat(target);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	return facts;
}

async function validatePackage(attemptRoot, scene) {
	await requireNoLink(attemptRoot, 'Inventory package attempt');
	const reportPath = path.join(attemptRoot, 'compiler-report.json');
	const report = JSON.parse(await readFile(reportPath, 'utf8'));
	if (report.accepted !== true) throw new Error(`Package ${attemptRoot} is not accepted.`);
	if (path.basename(report.manifestPath) !== report.manifestPath) {
		throw new Error(`Package ${attemptRoot} has a nonlocal manifest path.`);
	}
	const manifestBytes = await readFile(path.join(attemptRoot, report.manifestPath));
	if (sha256(manifestBytes) !== report.manifestSha256) {
		throw new Error(`Package ${attemptRoot} manifest hash does not match its compiler report.`);
	}
	const manifest = JSON.parse(manifestBytes.toString('utf8'));
	if (JSON.stringify(manifest.sceneSun) !== JSON.stringify(scene.sceneSun)) {
		throw new Error(`Package ${attemptRoot} does not represent the requested canonical scene Sun.`);
	}
	for (const reference of [manifest.oraclePayload, manifest.exactSeamPayload, manifest.logicalToUniqueIndex]) {
		if (path.basename(reference.path) !== reference.path) {
			throw new Error(`Package ${attemptRoot} contains a nonlocal payload path.`);
		}
		const payloadFacts = await requireNoLink(path.join(attemptRoot, reference.path), 'Inventory payload');
		if (!payloadFacts.isFile() || payloadFacts.size !== reference.byteLength) {
			throw new Error(`Package ${attemptRoot} payload shape does not match its manifest.`);
		}
	}
	const ledgerFacts = await requireNoLink(path.join(attemptRoot, manifest.ledgerPath), 'Inventory ledger');
	if (!ledgerFacts.isFile()) throw new Error(`Package ${attemptRoot} ledger is not a file.`);

	return {
		id: scene.sceneSun.id,
		solarZenithDegrees: Math.round((scene.support.observerSolarZenith.value * 180) / Math.PI),
		solarZenithRadians: scene.support.observerSolarZenith.value,
		path: attemptRoot,
		manifestPath: report.manifestPath,
		manifestSha256: report.manifestSha256,
		cacheIdentity: report.cacheIdentity,
		sceneSun: manifest.sceneSun,
		retainedBlockCount: report.browser.retainedBlockCount,
		compilerElapsedMilliseconds: report.browser.elapsedMilliseconds,
		oracleByteLength: manifest.oraclePayload.byteLength,
		exactRuntimeByteLength: manifest.exactSeamPayload.byteLength + manifest.logicalToUniqueIndex.byteLength,
	};
}

async function acceptedAttempt(sceneRoot, scene) {
	let entries;
	try {
		entries = await readdir(sceneRoot, {withFileTypes: true});
	} catch (error) {
		if (error.code === 'ENOENT') return null;
		throw error;
	}
	const attempts = entries
		.filter((entry) => entry.isDirectory() && /^attempt-[0-9]{3}$/u.test(entry.name))
		.map((entry) => entry.name)
		.sort();
	for (const attempt of attempts) {
		try {
			return await validatePackage(path.join(sceneRoot, attempt), scene);
		} catch {
			// A failed or interrupted attempt remains immutable evidence. A resume uses a new attempt.
		}
	}
	return null;
}

async function nextAttemptRoot(sceneRoot) {
	await mkdir(sceneRoot, {recursive: true});
	await requireNoLink(sceneRoot, 'Inventory scene directory');
	const attempts = (await readdir(sceneRoot))
		.map((name) => /^attempt-([0-9]{3})$/u.exec(name))
		.filter(Boolean)
		.map((match) => Number(match[1]));
	const next = (attempts.length === 0 ? 0 : Math.max(...attempts)) + 1;
	return path.join(sceneRoot, `attempt-${`${next}`.padStart(3, '0')}`);
}

async function main() {
	const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
	const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
	const chromePath = path.resolve(argument('--chrome'));
	const outputRoot = path.resolve(argument('--output'));
	const startDegrees = integerArgument('--start-degrees', 0);
	const endDegrees = integerArgument('--end-degrees', 108);
	if (startDegrees < 0 || endDegrees > 180 || startDegrees > endDegrees) {
		throw new RangeError('Inventory range must be an ascending integer interval inside 0 through 180 degrees.');
	}
	if (!outputRoot.startsWith(`${evidenceRoot}${path.sep}`)) {
		throw new Error('One-degree inventory output must remain under tmp/extraterrestrial.');
	}
	await requireNoLink(chromePath, 'Chrome executable');

	const control = {
		schemaId: CONTROL_SCHEMA_ID,
		startSolarZenithDegrees: startDegrees,
		endSolarZenithDegrees: endDegrees,
		incrementDegrees: 1,
		canonicalDirectionConvention: '[cos(solarZenith), -sin(solarZenith), 0] in Up/East/North',
		canonicalInstant: CANONICAL_INSTANT,
		supportIdentity: SUPPORT_IDENTITY,
		qualification: {
			deploymentEligible: false,
			reason: 'Inventory construction does not qualify darkness cutoff, nearest-degree bin ownership, within-bin error, or azimuth reuse.',
		},
		derivation: {
			operation:
				'build one independent production Native48/Z180/W27/F68/Native15/N4 scene-cache package for every integer observer solar-zenith angle',
			implementation: 'scripts/algorithm32/solar-zenith-cache/build-one-degree-scene-cache-inventory.js',
			compilerImplementation: 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheOfflineCompiler.js',
		},
	};
	const controlPath = path.join(outputRoot, 'inventory-control.json');
	try {
		await requireNoLink(outputRoot, 'Inventory output root');
		const existing = JSON.parse(await readFile(controlPath, 'utf8'));
		if (JSON.stringify(existing) !== JSON.stringify(control)) {
			throw new Error('Existing inventory control does not match the requested build.');
		}
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
		await mkdir(outputRoot, {recursive: false});
		if ((await realpath(outputRoot)) !== outputRoot) throw new Error('Inventory output must resolve exactly.');
		await writeFile(controlPath, jsonBytes(control), {flag: 'wx'});
	}
	const finalIndexPath = path.join(outputRoot, 'one-degree-inventory-index.json');
	try {
		await stat(finalIndexPath);
		throw new Error('One-degree inventory is already finalized and immutable.');
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}
	const freeBytes = Number((await statfs(outputRoot)).bavail) * Number((await statfs(outputRoot)).bsize);
	if (freeBytes < MINIMUM_FREE_BYTES) {
		throw new Error(`One-degree inventory requires at least ${MINIMUM_FREE_BYTES} free bytes before execution.`);
	}

	const compiler = new DistantSunSceneCacheOfflineCompiler({chromePath});
	const packages = [];
	const total = endDegrees - startDegrees + 1;
	for (let degrees = startDegrees; degrees <= endDegrees; degrees += 1) {
		const scene = createScene(degrees);
		const sceneRoot = path.join(outputRoot, degreeId(degrees));
		let record = await acceptedAttempt(sceneRoot, scene);
		if (record === null) {
			const attemptRoot = await nextAttemptRoot(sceneRoot);
			const ordinal = degrees - startDegrees + 1;
			process.stdout.write(
				`[${ordinal}/${total}] building ${scene.sceneSun.id} in ${path.basename(attemptRoot)}\n`,
			);
			try {
				await compiler.compile({outputDirectory: attemptRoot, scene});
				record = await validatePackage(attemptRoot, scene);
			} catch (error) {
				const failurePath = path.join(sceneRoot, `failure-${path.basename(attemptRoot)}.json`);
				await writeFile(
					failurePath,
					jsonBytes({
						schemaId: 'algorithm32-distant-sun-one-degree-inventory-failure-v1',
						attempt: attemptRoot,
						error: {name: error.name, message: error.message, stack: error.stack},
					}),
					{flag: 'wx'},
				);
				throw error;
			}
			process.stdout.write(
				`[${ordinal}/${total}] accepted ${record.id}: ${record.cacheIdentity} (${record.compilerElapsedMilliseconds} ms)\n`,
			);
		} else {
			process.stdout.write(`resuming with accepted ${record.id}: ${record.cacheIdentity}\n`);
		}
		packages.push(record);
	}

	const index = {
		schemaId: INDEX_SCHEMA_ID,
		accepted: true,
		deploymentEligible: false,
		control,
		packageCount: packages.length,
		packages,
		totalOracleByteLength: packages.reduce((sum, entry) => sum + entry.oracleByteLength, 0),
		totalExactRuntimeByteLength: packages.reduce((sum, entry) => sum + entry.exactRuntimeByteLength, 0),
	};
	await writeFile(finalIndexPath, jsonBytes(index), {flag: 'wx'});
	process.stdout.write(`${JSON.stringify(index, null, 2)}\n`);
}

await main();
