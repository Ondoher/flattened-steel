import {createHash} from 'node:crypto';
import {copyFile, lstat, mkdir, readFile, readdir, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const INVENTORY_SCHEMA = 'algorithm32-distant-sun-one-degree-inventory-index-v1';
const VERIFICATION_SCHEMA = 'algorithm32-distant-sun-one-degree-inventory-verification-v1';
const CATALOG_SCHEMA = 'algorithm32-distant-sun-runtime-catalog-v1';
const PACKAGE_SCHEMA = 'algorithm32-distant-sun-runtime-package-set-v1';
const CACHE_IDENTITY_PREFIX = 'algorithm32-distant-sun-scene-cache-sha256:';

function argument(name) {
	const index = process.argv.indexOf(name);
	if (index < 0 || index + 1 >= process.argv.length) throw new Error(`${name} is required.`);
	return process.argv[index + 1];
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function requireOrdinaryFile(file, label) {
	const facts = await lstat(file);
	if (facts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(file);
	if (!(await stat(resolved)).isFile()) throw new Error(`${label} is not a file.`);
	return resolved;
}

async function requireOrdinaryDirectory(directory, label) {
	const linkFacts = await lstat(directory);
	if (linkFacts.isSymbolicLink()) throw new Error(`${label} must not be a symlink or junction.`);
	const resolved = await realpath(directory);
	if (!(await stat(resolved)).isDirectory()) throw new Error(`${label} is not a directory.`);
	return resolved;
}

async function manifestAt(packageRoot) {
	const entries = await readdir(packageRoot);
	const manifests = entries.filter((name) => /^scene-cache-manifest-[a-f0-9]{64}\.json$/u.test(name));
	if (manifests.length !== 1) {
		throw new Error(`Package ${packageRoot} must contain exactly one scene-cache manifest.`);
	}
	const bytes = await readFile(path.join(packageRoot, manifests[0]));
	return {name: manifests[0], bytes, record: JSON.parse(bytes.toString('utf8'))};
}

function requireContinuousInventory(index) {
	if (index.schemaId !== INVENTORY_SCHEMA || index.accepted !== true || index.packageCount !== 109) {
		throw new Error('Deployment input is not the accepted 109-package one-degree inventory.');
	}
	const packages = [...index.packages].sort((left, right) => left.solarZenithDegrees - right.solarZenithDegrees);
	for (let degrees = 0; degrees <= 108; degrees += 1) {
		const entry = packages[degrees];
		if (entry?.solarZenithDegrees !== degrees || entry.id !== `solar-zenith-${String(degrees).padStart(3, '0')}-degrees`) {
			throw new Error(`Deployment input does not own exact solar-zenith degree ${degrees}.`);
		}
	}
	return packages;
}

function requireVerifiedInventory(verification, indexPath, indexBytes) {
	if (
		verification.schemaId !== VERIFICATION_SCHEMA ||
		verification.accepted !== true ||
		verification.packageCount !== 109 ||
		verification.inventoryIndexSha256 !== sha256(indexBytes) ||
		path.resolve(verification.inventoryIndexPath) !== indexPath
	) {
		throw new Error('Deployment input does not match its accepted byte-verification report.');
	}
}

function cacheHash(cacheIdentity) {
	if (!cacheIdentity.startsWith(CACHE_IDENTITY_PREFIX)) {
		throw new Error('Scene-cache identity is not content-addressed.');
	}
	const value = cacheIdentity.slice(CACHE_IDENTITY_PREFIX.length);
	if (!/^[a-f0-9]{64}$/u.test(value)) throw new Error('Scene-cache identity hash is malformed.');
	return value;
}

async function main() {
	const indexPath = await requireOrdinaryFile(path.resolve(argument('--inventory-index')), 'Inventory index');
	const verificationPath = await requireOrdinaryFile(
		path.resolve(argument('--verification-report')),
		'Inventory verification report',
	);
	const outputRoot = path.resolve(argument('--output-root'));
	const outputParent = await realpath(path.dirname(outputRoot));
	const relativeOutput = path.relative(REPOSITORY_ROOT, path.join(outputParent, path.basename(outputRoot)));
	if (relativeOutput.startsWith('..') || path.isAbsolute(relativeOutput)) {
		throw new Error('Deployment output must remain inside the repository.');
	}
	try {
		await stat(outputRoot);
		throw new Error('Deployment output already exists; packaging never overwrites prior output.');
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}

	const indexBytes = await readFile(indexPath);
	const inventory = JSON.parse(indexBytes.toString('utf8'));
	const verification = JSON.parse(await readFile(verificationPath, 'utf8'));
	requireVerifiedInventory(verification, indexPath, indexBytes);
	const packages = requireContinuousInventory(inventory);
	const runtimeEntries = [];
	await mkdir(outputRoot, {recursive: false});
	const packageOutputRoot = path.join(outputRoot, 'packages');
	await mkdir(packageOutputRoot);

	for (const selected of packages) {
		const sourceRoot = await requireOrdinaryDirectory(selected.path, `Package ${selected.id}`);
		const manifest = await manifestAt(sourceRoot);
		if (
			manifest.name !== selected.manifestPath ||
			sha256(manifest.bytes) !== selected.manifestSha256 ||
			manifest.record.cacheIdentity !== selected.cacheIdentity ||
			JSON.stringify(manifest.record.sceneSun) !== JSON.stringify(selected.sceneSun)
		) {
			throw new Error(`Deployment package ${selected.id} does not match the verified inventory index.`);
		}

		const runtimeFiles = [
			manifest.name,
			manifest.record.ledgerPath,
			manifest.record.exactSeamPayload.path,
			manifest.record.logicalToUniqueIndex.path,
		];
		const relativePackageRoot = `packages/${cacheHash(selected.cacheIdentity)}/`;
		const destination = path.join(outputRoot, relativePackageRoot);
		await mkdir(destination);
		let byteLength = 0;
		for (const name of runtimeFiles) {
			if (path.basename(name) !== name) {
				throw new Error(`Package ${selected.id} contains a nonlocal runtime path.`);
			}
			const source = await requireOrdinaryFile(path.join(sourceRoot, name), `Package ${selected.id} ${name}`);
			const sourceFacts = await stat(source);
			await copyFile(source, path.join(destination, name));
			byteLength += sourceFacts.size;
		}
		if (sha256(await readFile(path.join(destination, manifest.name))) !== selected.manifestSha256) {
			throw new Error(`Packaged manifest hash changed for ${selected.id}.`);
		}

		runtimeEntries.push({
			id: selected.id,
			representativeSolarZenithDegrees: selected.solarZenithDegrees,
			assetPath: relativePackageRoot,
			manifestPath: manifest.name,
			manifestSha256: selected.manifestSha256,
			cacheIdentity: selected.cacheIdentity,
			expected: {
				sceneSun: manifest.record.sceneSun,
				atmosphereIdentity: manifest.record.atmosphereIdentity,
				geometryIdentity: manifest.record.geometryIdentity,
				groundIdentity: manifest.record.groundIdentity,
				numericalIdentity: manifest.record.numericalIdentity,
			},
			files: runtimeFiles,
			byteLength,
		});
		process.stdout.write(`packaged ${selected.id}\n`);
	}

	const catalog = {
		schemaId: CATALOG_SCHEMA,
		accepted: true,
		binning: {
			kind: 'nearest-integer-half-up-v1',
			startSolarZenithDegrees: 0,
			endSolarZenithDegrees: 108,
			incrementDegrees: 1,
			minimumInputDegrees: 0,
			maximumInputExclusiveDegrees: 108.5,
		},
		packages: runtimeEntries,
		derivation: {
			inventorySchemaId: inventory.schemaId,
			inventoryIndexSha256: sha256(indexBytes),
			verificationSchemaId: verification.schemaId,
			verificationReportSha256: sha256(await readFile(verificationPath)),
			operation: 'copy manifest, ledger, exact R32F payload, and R16UI index into content-addressed runtime packages',
			implementation: 'scripts/algorithm32/solar-zenith-cache/package-production-scene-caches.js',
		},
		totalByteLength: runtimeEntries.reduce((sum, entry) => sum + entry.byteLength, 0),
	};
	const catalogBytes = Buffer.from(`${JSON.stringify(catalog, null, 2)}\n`);
	const catalogSha256 = sha256(catalogBytes);
	const catalogName = `distant-sun-runtime-catalog-${catalogSha256}.json`;
	await writeFile(path.join(outputRoot, catalogName), catalogBytes);
	const report = {
		schemaId: PACKAGE_SCHEMA,
		accepted: true,
		catalogPath: catalogName,
		catalogSha256,
		packageCount: runtimeEntries.length,
		totalByteLength: catalog.totalByteLength,
	};
	await writeFile(path.join(outputRoot, 'package-report.json'), `${JSON.stringify(report, null, 2)}\n`);
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await main();
