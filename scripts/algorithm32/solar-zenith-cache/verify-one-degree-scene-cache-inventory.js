#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const INDEX_SCHEMA_ID = 'algorithm32-distant-sun-one-degree-inventory-index-v1';

function argument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

function jsonBytes(value) {
	return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256Bytes(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function sha256File(target) {
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(target)) hash.update(chunk);
	return hash.digest('hex');
}

async function requireOrdinaryFile(target, label) {
	const linkFacts = await lstat(target);
	if (linkFacts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const facts = await stat(target);
	if (!facts.isFile()) throw new Error(`${label} must be a file.`);
	return facts;
}

async function verifyReference(packageRoot, reference, label) {
	if (path.basename(reference.path) !== reference.path) throw new Error(`${label} path must be local.`);
	const target = path.join(packageRoot, reference.path);
	const facts = await requireOrdinaryFile(target, label);
	if (facts.size !== reference.byteLength) throw new Error(`${label} byte length does not match its manifest.`);
	if ((await sha256File(target)) !== reference.sha256)
		throw new Error(`${label} SHA-256 does not match its manifest.`);
	return facts.size;
}

async function main() {
	const started = Date.now();
	const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
	const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
	const inventoryRoot = await realpath(path.resolve(argument('--inventory-root')));
	const outputRoot = path.resolve(argument('--output'));
	if (!inventoryRoot.startsWith(`${evidenceRoot}${path.sep}`)) {
		throw new Error('Verified inventory must remain under tmp/extraterrestrial.');
	}
	if (!outputRoot.startsWith(`${evidenceRoot}${path.sep}`)) {
		throw new Error('Verification output must remain under tmp/extraterrestrial.');
	}
	if ((await lstat(inventoryRoot)).isSymbolicLink()) throw new Error('Inventory root must not be a link.');
	try {
		await stat(outputRoot);
		throw new Error('Verification output already exists and must not be overwritten.');
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}
	await mkdir(outputRoot, {recursive: false});
	if ((await realpath(outputRoot)) !== outputRoot) throw new Error('Verification output must resolve exactly.');

	const indexPath = path.join(inventoryRoot, 'one-degree-inventory-index.json');
	const indexBytes = await readFile(indexPath);
	const index = JSON.parse(indexBytes.toString('utf8'));
	if (index.schemaId !== INDEX_SCHEMA_ID || index.accepted !== true || index.packageCount !== 109) {
		throw new Error('Inventory index does not declare the complete accepted 109-package domain.');
	}
	const identities = new Set();
	let totalOracleByteLength = 0;
	let totalExactRuntimeByteLength = 0;
	let totalCompilerElapsedMilliseconds = 0;
	let largestRuntimePackage = null;
	for (let degrees = 0; degrees <= 108; degrees += 1) {
		const record = index.packages[degrees];
		const expectedId = `solar-zenith-${`${degrees}`.padStart(3, '0')}-degrees`;
		if (record.id !== expectedId || record.solarZenithDegrees !== degrees) {
			throw new Error(`Inventory package ${degrees} does not own its exact integer-degree slot.`);
		}
		if (identities.has(record.cacheIdentity)) throw new Error(`Duplicate cache identity at ${expectedId}.`);
		identities.add(record.cacheIdentity);
		const packageRoot = await realpath(record.path);
		if (!packageRoot.startsWith(`${inventoryRoot}${path.sep}`)) {
			throw new Error(`Package ${expectedId} escapes the immutable inventory root.`);
		}
		if ((await lstat(packageRoot)).isSymbolicLink()) throw new Error(`Package ${expectedId} must not be a link.`);
		const manifestPath = path.join(packageRoot, record.manifestPath);
		const manifestBytes = await readFile(manifestPath);
		if (sha256Bytes(manifestBytes) !== record.manifestSha256) {
			throw new Error(`Package ${expectedId} manifest SHA-256 does not match its index record.`);
		}
		const manifest = JSON.parse(manifestBytes.toString('utf8'));
		if (manifest.cacheIdentity !== record.cacheIdentity || manifest.sceneSun.id !== expectedId) {
			throw new Error(`Package ${expectedId} manifest identity does not match its index record.`);
		}
		const ledgerPath = path.join(packageRoot, manifest.ledgerPath);
		await requireOrdinaryFile(ledgerPath, `${expectedId} ledger`);
		if ((await sha256File(ledgerPath)) !== manifest.ledgerSha256) {
			throw new Error(`Package ${expectedId} ledger SHA-256 does not match its manifest.`);
		}
		const oracleByteLength = await verifyReference(packageRoot, manifest.oraclePayload, `${expectedId} oracle`);
		const exactPayloadByteLength = await verifyReference(
			packageRoot,
			manifest.exactSeamPayload,
			`${expectedId} exact payload`,
		);
		const indexByteLength = await verifyReference(
			packageRoot,
			manifest.logicalToUniqueIndex,
			`${expectedId} logical direction index`,
		);
		const exactRuntimeByteLength = exactPayloadByteLength + indexByteLength;
		if (oracleByteLength !== record.oracleByteLength || exactRuntimeByteLength !== record.exactRuntimeByteLength) {
			throw new Error(`Package ${expectedId} aggregate byte lengths do not match its index record.`);
		}
		totalOracleByteLength += oracleByteLength;
		totalExactRuntimeByteLength += exactRuntimeByteLength;
		totalCompilerElapsedMilliseconds += record.compilerElapsedMilliseconds;
		if (largestRuntimePackage === null || exactRuntimeByteLength > largestRuntimePackage.byteLength) {
			largestRuntimePackage = {id: expectedId, byteLength: exactRuntimeByteLength};
		}
		process.stdout.write(`[${degrees + 1}/109] verified ${expectedId}\n`);
	}
	if (
		totalOracleByteLength !== index.totalOracleByteLength ||
		totalExactRuntimeByteLength !== index.totalExactRuntimeByteLength
	) {
		throw new Error('Verified inventory totals do not match the finalized index.');
	}

	const report = {
		schemaId: 'algorithm32-distant-sun-one-degree-inventory-verification-v1',
		accepted: true,
		inventoryRoot,
		inventoryIndexPath: indexPath,
		inventoryIndexSha256: sha256Bytes(indexBytes),
		packageCount: index.packageCount,
		startSolarZenithDegrees: index.control.startSolarZenithDegrees,
		endSolarZenithDegrees: index.control.endSolarZenithDegrees,
		uniqueCacheIdentityCount: identities.size,
		totalOracleByteLength,
		totalExactRuntimeByteLength,
		largestRuntimePackage,
		totalCompilerElapsedMilliseconds,
		meanCompilerElapsedMilliseconds: totalCompilerElapsedMilliseconds / index.packageCount,
		verificationElapsedMilliseconds: Date.now() - started,
		checks: [
			'exact continuous integer-degree ownership from 0 through 108',
			'unique cache identity per package',
			'manifest SHA-256 and scene identity',
			'packed-row ledger SHA-256',
			'oracle R32F payload byte length and SHA-256',
			'exact-seam R32F payload byte length and SHA-256',
			'logical-to-unique R16UI index byte length and SHA-256',
			'aggregate oracle and exact-runtime byte totals',
		],
		qualification: index.control.qualification,
	};
	await writeFile(path.join(outputRoot, 'verification-report.json'), jsonBytes(report), {flag: 'wx'});
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await main();
