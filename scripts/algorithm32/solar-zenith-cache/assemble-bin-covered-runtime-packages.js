import {createHash} from 'node:crypto';
import {open} from 'node:fs/promises';
import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import DistantSunSceneCacheLedger from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {
	DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../src/algorithm32/sampling-domains/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';

const INVENTORY_SCHEMA = 'algorithm32-distant-sun-one-degree-inventory-index-v1';
const VERIFICATION_SCHEMA = 'algorithm32-distant-sun-one-degree-inventory-verification-v1';
const CATALOG_SCHEMA = 'algorithm32-distant-sun-runtime-catalog-v1';
const PACKAGE_SET_SCHEMA = 'algorithm32-distant-sun-bin-covered-runtime-package-set-v1';
const LEDGER_SCHEMA = 'algorithm32-distant-sun-packed-row-ledger-v1';
const CACHE_IDENTITY_PREFIX = 'algorithm32-distant-sun-scene-cache-sha256:';
const ROW_BYTE_LENGTH = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT;
const LOGICAL_ROW_BYTE_LENGTH =
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount * Float32Array.BYTES_PER_ELEMENT;
const CHANNEL_COUNT = NATIVE_15_SPECTRAL_BASIS.channelCount;

function argument(name) {
	const index = process.argv.indexOf(name);
	if (index < 0 || index + 1 >= process.argv.length) throw new Error(`${name} is required.`);
	return process.argv[index + 1];
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function jsonBytes(value) {
	return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

async function ordinaryFile(file, label) {
	const facts = await lstat(file);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(file);
	if (!(await stat(resolved)).isFile()) throw new Error(`${label} must be a file.`);
	return resolved;
}

async function ordinaryDirectory(directory, label) {
	const facts = await lstat(directory);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(directory);
	if (!(await stat(resolved)).isDirectory()) throw new Error(`${label} must be a directory.`);
	return resolved;
}

function scene(degrees, sceneSun) {
	return {
		sceneSun,
		support: {
			id: 'san-jose-fixed-observer-complete-rotation-v1',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 1.7, units: 'meters'},
			observerSolarZenith: {value: (degrees * Math.PI) / 180, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
	};
}

function exactLedger(degrees, sceneSun) {
	return new DistantSunSceneCacheLedger({
		...scene(degrees, sceneSun),
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
}

function paddedLedger(centerDegrees, sceneSun) {
	const minimumInputDegrees = Math.max(0, centerDegrees - 0.5);
	const maximumInputExclusiveDegrees = centerDegrees === 108 ? 108 : centerDegrees + 0.5;
	const lower = exactLedger(minimumInputDegrees, sceneSun);
	const upper = exactLedger(maximumInputExclusiveDegrees - 1e-9, sceneSun);
	let firstPackedRow = 0;
	const rows = lower.rows.map((lowerRow, altitudeIndex) => {
		const upperRow = upper.rows[altitudeIndex];
		const firstSolarZenithIndex = Math.min(
			lowerRow.firstSolarZenithIndex,
			upperRow.firstSolarZenithIndex,
		);
		const lastSolarZenithIndex = Math.max(lowerRow.lastSolarZenithIndex, upperRow.lastSolarZenithIndex);
		const packedRowCount = lastSolarZenithIndex - firstSolarZenithIndex + 1;
		const row = {
			altitudeIndex,
			altitude: lowerRow.altitude,
			firstSolarZenithIndex,
			lastSolarZenithIndex,
			firstPackedRow,
			packedRowCount,
		};
		firstPackedRow += packedRowCount;
		return row;
	});
	return {
		selection: {representativeSolarZenithDegrees: centerDegrees, minimumInputDegrees, maximumInputExclusiveDegrees},
		record: {
			schemaId: LEDGER_SCHEMA,
			sceneSun,
			support: exactLedger(centerDegrees, sceneSun).support,
			rows,
			retainedBlockCount: firstPackedRow,
			oracleByteLength: firstPackedRow * LOGICAL_ROW_BYTE_LENGTH * CHANNEL_COUNT,
			exactSeamByteLength:
				firstPackedRow * ROW_BYTE_LENGTH * CHANNEL_COUNT +
				CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount * Uint16Array.BYTES_PER_ELEMENT,
		},
	};
}

function sourcePackedRow(source, altitudeIndex, solarZenithIndex) {
	const row = source.ledger.rows[altitudeIndex];
	if (
		solarZenithIndex < row.firstSolarZenithIndex ||
		solarZenithIndex > row.lastSolarZenithIndex
	) return null;
	return row.firstPackedRow + solarZenithIndex - row.firstSolarZenithIndex;
}

function chooseSource(sources, centerDegrees, altitudeIndex, solarZenithIndex) {
	const candidates = sources
		.map((source) => ({source, packedRow: sourcePackedRow(source, altitudeIndex, solarZenithIndex)}))
		.filter((candidate) => candidate.packedRow !== null)
		.sort(
			(left, right) =>
				Math.abs(left.source.degrees - centerDegrees) - Math.abs(right.source.degrees - centerDegrees) ||
				left.source.degrees - right.source.degrees,
		);
	if (candidates.length === 0) {
		throw new Error(`No inventory parent owns altitude ${altitudeIndex}, solar zenith ${solarZenithIndex}.`);
	}
	return candidates[0];
}

function cacheHash(cacheIdentity) {
	const value = cacheIdentity.startsWith(CACHE_IDENTITY_PREFIX)
		? cacheIdentity.slice(CACHE_IDENTITY_PREFIX.length)
		: '';
	if (!/^[a-f0-9]{64}$/u.test(value)) throw new Error('Runtime cache identity is malformed.');
	return value;
}

async function loadSources(inventory) {
	const sources = [];
	for (const entry of inventory.packages) {
		const root = await ordinaryDirectory(entry.path, entry.id);
		const manifestBytes = await readFile(await ordinaryFile(path.join(root, entry.manifestPath), entry.id));
		if (sha256(manifestBytes) !== entry.manifestSha256) throw new Error(`${entry.id} manifest hash changed.`);
		const manifest = JSON.parse(manifestBytes.toString('utf8'));
		const ledgerBytes = await readFile(await ordinaryFile(path.join(root, manifest.ledgerPath), entry.id));
		if (sha256(ledgerBytes) !== manifest.ledgerSha256) throw new Error(`${entry.id} ledger hash changed.`);
		const exactPath = await ordinaryFile(path.join(root, manifest.exactSeamPayload.path), entry.id);
		sources.push({
			degrees: entry.solarZenithDegrees,
			entry,
			manifest,
			ledger: JSON.parse(ledgerBytes.toString('utf8')),
			exactPath,
			handle: await open(exactPath, 'r'),
		});
	}
	return sources;
}

async function fillTargetPayload(target, sources, centerDegrees) {
	const targetBytes = Buffer.allocUnsafe(target.record.retainedBlockCount * ROW_BYTE_LENGTH * CHANNEL_COUNT);
	const rowSources = [];
	for (const row of target.record.rows) {
		for (let solarZenithIndex = row.firstSolarZenithIndex; solarZenithIndex <= row.lastSolarZenithIndex; solarZenithIndex += 1) {
			const selected = chooseSource(sources, centerDegrees, row.altitudeIndex, solarZenithIndex);
			rowSources.push({
				targetPackedRow: row.firstPackedRow + solarZenithIndex - row.firstSolarZenithIndex,
				altitudeIndex: row.altitudeIndex,
				solarZenithIndex,
				source: selected.source,
				sourcePackedRow: selected.packedRow,
			});
		}
	}
	const groups = [];
	for (const row of rowSources) {
		const previous = groups.at(-1);
		if (
			previous &&
			previous.source === row.source &&
			previous.targetPackedRow + previous.count === row.targetPackedRow &&
			previous.sourcePackedRow + previous.count === row.sourcePackedRow
		) {
			previous.count += 1;
		} else {
			groups.push({...row, count: 1});
		}
	}
	for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
		for (const group of groups) {
			const byteLength = group.count * ROW_BYTE_LENGTH;
			const sourceOffset =
				(channel * group.source.ledger.retainedBlockCount + group.sourcePackedRow) * ROW_BYTE_LENGTH;
			const targetOffset =
				(channel * target.record.retainedBlockCount + group.targetPackedRow) * ROW_BYTE_LENGTH;
			const result = await group.source.handle.read(targetBytes, targetOffset, byteLength, sourceOffset);
			if (result.bytesRead !== byteLength) throw new Error('Runtime row parent ended before the declared payload shape.');
		}
	}
	return {bytes: targetBytes, rowSources};
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const indexPath = await ordinaryFile(path.resolve(argument('--inventory-index')), 'Inventory index');
const verificationPath = await ordinaryFile(path.resolve(argument('--verification-report')), 'Verification report');
const outputRoot = path.resolve(argument('--output-root'));
if (!outputRoot.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('Runtime package output must remain under tmp/extraterrestrial.');
}
try {
	await stat(outputRoot);
	throw new Error('Runtime package output already exists; derivatives are immutable.');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
const indexBytes = await readFile(indexPath);
const inventory = JSON.parse(indexBytes.toString('utf8'));
const verificationBytes = await readFile(verificationPath);
const verification = JSON.parse(verificationBytes.toString('utf8'));
if (
	inventory.schemaId !== INVENTORY_SCHEMA ||
	inventory.accepted !== true ||
	inventory.packageCount !== 109 ||
	verification.schemaId !== VERIFICATION_SCHEMA ||
	verification.accepted !== true ||
	verification.inventoryIndexSha256 !== sha256(indexBytes)
) {
	throw new Error('Runtime package assembly requires the accepted byte-verified 109-cache inventory.');
}
await mkdir(outputRoot);
const packagesRoot = path.join(outputRoot, 'packages');
await mkdir(packagesRoot);
const sources = await loadSources(inventory);
const firstIndexBytes = await readFile(path.join(sources[0].entry.path, sources[0].manifest.logicalToUniqueIndex.path));
const firstIndexHash = sha256(firstIndexBytes);
for (const source of sources) {
	if (source.manifest.logicalToUniqueIndex.sha256 !== firstIndexHash) {
		throw new Error(`${source.entry.id} does not use the common exact W27 direction index.`);
	}
}

const coordinateHashes = new Map();
const catalogEntries = [];
try {
	for (let centerDegrees = 0; centerDegrees <= 108; centerDegrees += 1) {
		const canonical = sources[centerDegrees];
		const target = paddedLedger(centerDegrees, canonical.manifest.sceneSun);
		const assembled = await fillTargetPayload(target, sources, centerDegrees);
		for (const row of assembled.rowSources) {
			const hash = createHash('sha256');
			for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
				const offset =
					(channel * target.record.retainedBlockCount + row.targetPackedRow) * ROW_BYTE_LENGTH;
				hash.update(assembled.bytes.subarray(offset, offset + ROW_BYTE_LENGTH));
			}
			const identity = hash.digest('hex');
			const coordinate = `${row.altitudeIndex}:${row.solarZenithIndex}`;
			const prior = coordinateHashes.get(coordinate);
			if (prior !== undefined && prior !== identity) {
				throw new Error(`Inventory parents disagree at shared spectral coordinate ${coordinate}.`);
			}
			coordinateHashes.set(coordinate, identity);
		}

		const exactSha256 = sha256(assembled.bytes);
		const exactPath = `exact-seam-native15-c4-w27-${exactSha256}.f32`;
		const ledgerBytes = jsonBytes(target.record);
		const ledgerSha256 = sha256(ledgerBytes);
		const ledgerPath = `packed-row-ledger-${ledgerSha256}.json`;
		const parentIdentities = [...new Set(assembled.rowSources.map((row) => row.source.entry.cacheIdentity))];
		const compatibility = {
			sceneSun: canonical.manifest.sceneSun,
			numericalIdentity: canonical.manifest.numericalIdentity,
			selection: target.selection,
			ledgerSha256,
			exactSha256,
			logicalToUniqueIndexSha256: firstIndexHash,
		};
		const cacheIdentity = `${CACHE_IDENTITY_PREFIX}${sha256(jsonBytes(compatibility))}`;
		const manifest = {
			schemaId: DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID,
			cacheIdentity,
			selection: target.selection,
			sceneSun: canonical.manifest.sceneSun,
			atmosphereIdentity: canonical.manifest.atmosphereIdentity,
			geometryIdentity: canonical.manifest.geometryIdentity,
			groundIdentity: canonical.manifest.groundIdentity,
			numericalIdentity: canonical.manifest.numericalIdentity,
			ledgerPath,
			ledgerSha256,
			exactSeamPayload: {
				path: exactPath,
				byteLength: assembled.bytes.byteLength,
				sha256: exactSha256,
				codecId: canonical.manifest.exactSeamPayload.codecId,
			},
			logicalToUniqueIndex: {
				...canonical.manifest.logicalToUniqueIndex,
				path: `w27-logical-to-unique-${firstIndexHash}.u16`,
			},
			derivation: {
				schemaId: 'algorithm32-distant-sun-bin-covered-runtime-derivation-v1',
				parentInventoryIndexSha256: sha256(indexBytes),
				parentCacheIdentities: parentIdentities,
				operation:
					'form the union ledger required by both limiting angles of the half-open resolver bin and copy each exact Native15 row from the nearest verified inventory parent that owns the coordinate',
				parameters: target.selection,
				implementation:
					'scripts/algorithm32/solar-zenith-cache/assemble-bin-covered-runtime-packages.js',
				outputs: {ledgerSha256, exactSha256, logicalToUniqueIndexSha256: firstIndexHash},
			},
		};
		const manifestBytes = jsonBytes(manifest);
		const manifestSha256 = sha256(manifestBytes);
		const manifestPath = `scene-cache-manifest-${manifestSha256}.json`;
		const relativePackageRoot = `packages/${cacheHash(cacheIdentity)}/`;
		const packageRoot = path.join(outputRoot, relativePackageRoot);
		await mkdir(packageRoot);
		await writeFile(path.join(packageRoot, exactPath), assembled.bytes, {flag: 'wx'});
		await writeFile(path.join(packageRoot, ledgerPath), ledgerBytes, {flag: 'wx'});
		await writeFile(path.join(packageRoot, manifestPath), manifestBytes, {flag: 'wx'});
		await writeFile(path.join(packageRoot, manifest.logicalToUniqueIndex.path), firstIndexBytes, {flag: 'wx'});
		catalogEntries.push({
			id: canonical.entry.id,
			representativeSolarZenithDegrees: centerDegrees,
			minimumInputDegrees: target.selection.minimumInputDegrees,
			maximumInputExclusiveDegrees: target.selection.maximumInputExclusiveDegrees,
			assetPath: relativePackageRoot,
			manifestPath,
			manifestSha256,
			cacheIdentity,
			expected: {
				sceneSun: manifest.sceneSun,
				atmosphereIdentity: manifest.atmosphereIdentity,
				geometryIdentity: manifest.geometryIdentity,
				groundIdentity: manifest.groundIdentity,
				numericalIdentity: manifest.numericalIdentity,
			},
			byteLength:
				assembled.bytes.byteLength + ledgerBytes.byteLength + manifestBytes.byteLength + firstIndexBytes.byteLength,
			retainedBlockCount: target.record.retainedBlockCount,
			parentCacheIdentityCount: parentIdentities.length,
		});
		process.stdout.write(`assembled bin ${centerDegrees}: ${target.record.retainedBlockCount} blocks\n`);
	}
} finally {
	await Promise.all(sources.map((source) => source.handle.close()));
}

const catalog = {
	schemaId: CATALOG_SCHEMA,
	accepted: true,
	darkFromSolarZenithDegrees: 108,
	binning: {
		kind: 'ledger-covered-nearest-integer-half-up-v1',
		startSolarZenithDegrees: 0,
		endSolarZenithDegrees: 108,
		incrementDegrees: 1,
		minimumInputDegrees: 0,
		maximumInputExclusiveDegrees: 108,
	},
	packages: catalogEntries,
	derivation: {
		inventoryIndexSha256: sha256(indexBytes),
		verificationReportSha256: sha256(verificationBytes),
		sharedCoordinateHashCount: coordinateHashes.size,
		implementation: 'scripts/algorithm32/solar-zenith-cache/assemble-bin-covered-runtime-packages.js',
	},
	totalByteLength: catalogEntries.reduce((sum, entry) => sum + entry.byteLength, 0),
};
const catalogBytes = jsonBytes(catalog);
const catalogSha256 = sha256(catalogBytes);
const catalogPath = `distant-sun-runtime-catalog-${catalogSha256}.json`;
await writeFile(path.join(outputRoot, catalogPath), catalogBytes, {flag: 'wx'});
const report = {
	schemaId: PACKAGE_SET_SCHEMA,
	accepted: true,
	catalogPath,
	catalogSha256,
	packageCount: catalogEntries.length,
	totalByteLength: catalog.totalByteLength,
	maximumResidentByteLength: Math.max(
		...catalogEntries.map((entry) => entry.retainedBlockCount * ROW_BYTE_LENGTH * CHANNEL_COUNT + firstIndexBytes.byteLength),
	),
	sharedCoordinateHashCount: coordinateHashes.size,
};
await writeFile(path.join(outputRoot, 'package-report.json'), jsonBytes(report), {flag: 'wx'});
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
