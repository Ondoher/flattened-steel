import {createHash} from 'node:crypto';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';

import {CAPTURE_TIMES, parseSpectraTsv} from './benchmark.js';
import {PAPER_PHYSICAL_PROFILE_CONTENT_HASH, PAPER_PHYSICAL_PROFILE_ID} from './candidate-provenance.js';
import {requireB1PhysicalMeasurementBoundary} from '../../algorithm32/production-b-experiments/B1MeasurementBoundary.js';
import {
	B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY,
	B1_DIRECT40_OFFLINE_ASSET_ADAPTER_LEGACY_IDENTITIES,
} from '../../algorithm32/production-b-experiments/B1Direct40OfflineAssetAdapter.js';
import B1Direct40CacheAssetSetManifest from '../../algorithm32/production-b-experiments/B1Direct40CacheAssetSetManifest.js';
import {validateCube} from '../b3-matched-atmosphere-solver/cube.js';

const MANIFEST_SCHEMA = 'algorithm32-current-production-b1-run-v3';
const REQUIRED_ORDERS = Object.freeze([4]);
const EXECUTION_BACKENDS = Object.freeze(['cpu-reference-binary64', 'gpu-production-shaders-r32f']);
const CANONICAL_PROFILE_FAMILY = 'paper';
const CANONICAL_INCOMING_DIRECTION_VARIANT = 'production-68';
const CANONICAL_SPECTRAL_CHANNEL_COUNT = 40;
const CANONICAL_DIRECTION_COUNT = 81;
const CPU_REFERENCE_EXECUTION_IDENTITY = 'algorithm32-b1-cpu-reference-binary64-v1';
const GPU_EXECUTION_IDENTITY = 'algorithm32-b1-production-gpu-final-view-r32f-v1';
const SHA256 = /^[a-f0-9]{64}$/u;
const CONTENT_HASH = /^sha256:[a-f0-9]{64}$/u;
const ASSET_IDENTITY = /^algorithm32-b1-direct40-cache-sha256:[a-f0-9]{64}$/u;

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function readJson(path, label) {
	let value;
	try {
		value = JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${path}`, {cause: error});
	}
	return value;
}

function resolveManifestPath(path) {
	const absolute = resolve(path);
	if (!existsSync(absolute)) throw new Error(`Production run does not exist: ${absolute}`);
	return statSync(absolute).isDirectory() ? join(absolute, 'manifest.json') : absolute;
}

function resolveRunFile(runDirectory, name, label) {
	if (typeof name !== 'string' || name.length === 0 || basename(name) !== name) {
		throw new Error(`${label} must name a direct file in the production run directory.`);
	}
	const path = resolve(runDirectory, name);
	if (dirname(path) !== runDirectory || !existsSync(path)) {
		throw new Error(`${label} does not exist in the production run: ${path}`);
	}
	return path;
}

function verifyFile(runDirectory, record, nameKey, hashKey, label) {
	const path = resolveRunFile(runDirectory, record[nameKey], label);
	const bytes = readFileSync(path);
	if (sha256(bytes) !== record[hashKey]) {
		throw new Error(`${label} SHA-256 does not match the production-run manifest: ${path}`);
	}
	return path;
}

function verifyProvenance(path, record, manifest) {
	const provenance = readJson(path, `J${record.order} provenance`);
	if (provenance.schema !== 'algorithm32-current-production-b1-provenance-v2') {
		throw new Error(`J${record.order} provenance schema is incompatible.`);
	}
	if (provenance.runId !== manifest.runId || provenance.order !== record.order) {
		throw new Error(`J${record.order} provenance does not identify its production run and order.`);
	}
	if (provenance.backend !== manifest.backend) {
		throw new Error(`J${record.order} provenance backend does not match its production run.`);
	}
	if (
		(manifest.backend === 'gpu-production-shaders-r32f' &&
			JSON.stringify(provenance.gpuCapabilities) !== JSON.stringify(manifest.gpuCapabilities)) ||
		(manifest.backend === 'cpu-reference-binary64' && provenance.gpuCapabilities !== null)
	) {
		throw new Error(`J${record.order} provenance GPU capabilities do not match its production run.`);
	}
	if (
		provenance.rowCount !== manifest.conditions.length * CANONICAL_DIRECTION_COUNT ||
		provenance.completeCanonicalBoundary !== (manifest.conditions.length === CAPTURE_TIMES.length)
	) {
		throw new Error(`J${record.order} provenance boundary size does not match the production-run manifest.`);
	}
	if (
		provenance.modelNameInBenchmarkTables !== 'proposed' ||
		provenance.physicalProfileId !== PAPER_PHYSICAL_PROFILE_ID ||
		provenance.physicalProfileContentHash !== PAPER_PHYSICAL_PROFILE_CONTENT_HASH ||
		provenance.spectralChannelCount !== CANONICAL_SPECTRAL_CHANNEL_COUNT ||
		provenance.nativeSpectralBoundary?.channelCount !== CANONICAL_SPECTRAL_CHANNEL_COUNT ||
		provenance.nativeSpectralBoundary?.sampleSemantics !== 'point-sampled-spectral-density' ||
		provenance.nativeSpectralBoundary?.projection !== 'identity-direct-40'
	) {
		throw new Error(`J${record.order} provenance does not identify the canonical direct-40 paper boundary.`);
	}
	requireB1PhysicalMeasurementBoundary(provenance.physicalMeasurementBoundary);
	if (
		!Array.isArray(provenance.profiles) ||
		provenance.profiles.length !== manifest.conditions.length ||
		provenance.profiles.some(
			(profile, index) =>
				profile.time !== manifest.conditions[index] ||
				typeof profile.id !== 'string' ||
				!/^sha256:[0-9a-f]{64}$/.test(profile.contentHash),
		)
	) {
		throw new Error(`J${record.order} provenance profiles do not match the ordered production conditions.`);
	}
	const expectedProfiles = manifest.profileHashes
		.filter((profile) => profile.order === record.order)
		.map(({time, id, contentHash}) => ({time, id, contentHash}));
	const actualProfiles = provenance.profiles.map(({time, id, contentHash}) => ({time, id, contentHash}));
	if (
		JSON.stringify(actualProfiles) !== JSON.stringify(expectedProfiles) ||
		JSON.stringify(record.derivation?.inputProfileHashes) !== JSON.stringify(expectedProfiles) ||
		record.derivation?.inputAssetSetIdentity !== manifest.assetSetIdentity
	) {
		throw new Error(`J${record.order} output derivation does not match the run profile and asset inputs.`);
	}
	if (provenance.table?.name !== record.table || provenance.table?.sha256 !== record.tableSha256) {
		throw new Error(`J${record.order} provenance does not identify its finalized table.`);
	}
	return provenance;
}

function verifyDefaultProvenance(path, primaryProvenance) {
	const defaultProvenance = readJson(path, 'Default provenance');
	const expected = {
		...primaryProvenance,
		profileId: primaryProvenance.profileId.replace(/^paper-j4/u, 'paper'),
		presentationName: primaryProvenance.presentationName.replace(/ Paper J4/u, ' Paper'),
	};
	if (JSON.stringify(defaultProvenance) !== JSON.stringify(expected)) {
		throw new Error('Default provenance alias does not match its exact J4 production parent.');
	}
}

function verifyTable(path, order, conditions, requireCanonical) {
	if (requireCanonical) {
		const models = parseSpectraTsv(path);
		if (models.size !== 1 || !models.has('proposed')) {
			throw new Error(`J${order} production table must contain exactly one proposed model.`);
		}
		return;
	}
	const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	const header = lines.shift()?.split('\t') ?? [];
	if (
		header.length !== 44 ||
		JSON.stringify(header.slice(0, 4)) !== JSON.stringify(['model', 'time', 'grid_x', 'grid_y']) ||
		lines.length !== conditions.length * CANONICAL_DIRECTION_COUNT
	) {
		throw new Error(`J${order} bounded production table shape is incompatible.`);
	}
	const counts = new Map(conditions.map((time) => [time, 0]));
	const coordinates = new Map(conditions.map((time) => [time, new Set()]));
	for (const line of lines) {
		const fields = line.split('\t');
		const gridX = Number(fields[2]);
		const gridY = Number(fields[3]);
		if (
			fields.length !== 44 ||
			fields[0] !== 'proposed' ||
			!counts.has(fields[1]) ||
			!Number.isInteger(gridX) ||
			!Number.isInteger(gridY) ||
			gridX < 0 ||
			gridX > 8 ||
			gridY < 0 ||
			gridY > 8 ||
			fields.slice(2).some((value) => !Number.isFinite(Number(value))) ||
			fields.slice(4).some((value) => Number(value) < 0)
		) {
			throw new Error(`J${order} bounded production table content is incompatible.`);
		}
		const coordinate = `${gridX}/${gridY}`;
		if (coordinates.get(fields[1]).has(coordinate)) {
			throw new Error(`J${order} bounded production table repeats a direction coordinate.`);
		}
		coordinates.get(fields[1]).add(coordinate);
		counts.set(fields[1], counts.get(fields[1]) + 1);
	}
	if ([...counts.values()].some((count) => count !== CANONICAL_DIRECTION_COUNT)) {
		throw new Error(`J${order} bounded production table does not cover each selected condition.`);
	}
}

function verifyCube(path, order, record, manifest) {
	try {
		const cube = validateCube(readJson(path, `J${order} cube`));
		if (
			cube.provenance?.runId !== manifest.runId ||
			cube.provenance?.order !== order ||
			cube.provenance?.table !== record.table ||
			cube.provenance?.tableSha256 !== record.tableSha256
		) {
			throw new Error('Cube provenance does not identify its exact B1 table parent.');
		}
	} catch (error) {
		throw new Error(`J${order} production cube axes or values are incompatible.`, {cause: error});
	}
}

function verifyRunDerivation(manifest, requireCanonical) {
	const completeCanonicalSelection =
		manifest.profileFamily === CANONICAL_PROFILE_FAMILY &&
		manifest.incomingDirectionVariant === CANONICAL_INCOMING_DIRECTION_VARIANT &&
		Array.isArray(manifest.orders) &&
		manifest.orders.length === REQUIRED_ORDERS.length &&
		manifest.orders.every((order, index) => order === REQUIRED_ORDERS[index]) &&
		Array.isArray(manifest.conditions) &&
		manifest.conditions.length === CAPTURE_TIMES.length &&
		manifest.conditions.every((time, index) => time === CAPTURE_TIMES[index]);
	const expectedCanonicality = {
		kind: completeCanonicalSelection ? 'canonical-candidate' : 'bounded-or-diagnostic',
		publicationEligible: completeCanonicalSelection,
	};
	if (JSON.stringify(manifest.canonicality) !== JSON.stringify(expectedCanonicality)) {
		throw new Error('Production-run canonicality does not match its selected boundary.');
	}
	if (requireCanonical && manifest.canonicality.publicationEligible !== true) {
		throw new Error('Bounded or diagnostic production runs are not eligible for canonical scoring or publication.');
	}
	if (
		!Array.isArray(manifest.orders) ||
		!Array.isArray(manifest.profileHashes) ||
		manifest.profileHashes.length !== manifest.conditions.length * manifest.orders.length
	) {
		throw new Error('Production-run profile hash inventory is incomplete.');
	}
	for (let conditionIndex = 0; conditionIndex < manifest.conditions.length; conditionIndex += 1) {
		for (let orderIndex = 0; orderIndex < manifest.orders.length; orderIndex += 1) {
			const record = manifest.profileHashes[conditionIndex * manifest.orders.length + orderIndex];
			if (
				record?.time !== manifest.conditions[conditionIndex] ||
				record?.order !== manifest.orders[orderIndex] ||
				typeof record?.id !== 'string' ||
				!CONTENT_HASH.test(record?.contentHash)
			) {
				throw new Error('Production-run profile hash inventory is incompatible.');
			}
		}
	}
	if (manifest.backend === 'gpu-production-shaders-r32f') {
		const assetSet = new B1Direct40CacheAssetSetManifest(manifest.assetSet).toRecord();
		const acceptedCompilerIdentity =
			manifest.compilerIdentity === B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY ||
			(!requireCanonical && B1_DIRECT40_OFFLINE_ASSET_ADAPTER_LEGACY_IDENTITIES.includes(manifest.compilerIdentity));
		if (
			manifest.executionIdentity !== GPU_EXECUTION_IDENTITY ||
			typeof manifest.productionRevision !== 'string' ||
			manifest.productionRevision !== assetSet.productionRevision ||
			!acceptedCompilerIdentity ||
			manifest.assetSetIdentity !== assetSet.setIdentity ||
			manifest.assetSetManifest?.sha256 !== sha256(`${JSON.stringify(assetSet, null, 2)}\n`) ||
			manifest.assetSetManifest?.name !== `asset-set-manifest-${manifest.assetSetManifest?.sha256}.json` ||
			!SHA256.test(manifest.assetSetManifest?.sha256) ||
			JSON.stringify(manifest.assets) !==
				JSON.stringify(
					assetSet.assets.map((asset) => ({
						condition: asset.condition.localTime,
						assetIdentity: asset.assetIdentity,
						manifestSha256: asset.manifestSha256,
						profileId: asset.profile.id,
						profileContentHash: asset.profile.contentHash,
					})),
				)
		) {
			throw new Error('GPU production-run asset derivation is incompatible.');
		}
		if (
			manifest.assets.length !== CAPTURE_TIMES.length ||
			manifest.assets.some(
				(asset, index) =>
					asset.condition !== CAPTURE_TIMES[index] ||
					!ASSET_IDENTITY.test(asset.assetIdentity) ||
					!SHA256.test(asset.manifestSha256) ||
					!CONTENT_HASH.test(asset.profileContentHash),
			)
		) {
			throw new Error('GPU production-run must authenticate all 17 ordered assets.');
		}
		for (const profile of manifest.profileHashes) {
			const asset = manifest.assets.find((candidate) => candidate.condition === profile.time);
			if (profile.order === 4 && (asset?.profileId !== profile.id || asset.profileContentHash !== profile.contentHash)) {
				throw new Error('GPU production-run profile hashes do not match their cache assets.');
			}
		}
	} else if (
		manifest.executionIdentity !== CPU_REFERENCE_EXECUTION_IDENTITY ||
		manifest.productionRevision !== null ||
		manifest.compilerIdentity !== CPU_REFERENCE_EXECUTION_IDENTITY ||
		manifest.assetSetIdentity !== null ||
		manifest.assetSet !== null ||
		manifest.assetSetManifest !== null ||
		!Array.isArray(manifest.assets) ||
		manifest.assets.length !== 0
	) {
		throw new Error('CPU reference and GPU asset derivation identities must remain distinct.');
	}
}

function load(path, {requireCanonical = true} = {}) {
	const manifestPath = resolveManifestPath(path);
	if (!existsSync(manifestPath)) throw new Error(`Production-run manifest not found: ${manifestPath}`);
	const manifest = readJson(manifestPath, 'Production-run manifest');
	const runDirectory = dirname(manifestPath);
	if (manifest.schema !== MANIFEST_SCHEMA || manifest.status !== 'COMPLETE') {
		throw new Error(`Production-run manifest must be a complete ${MANIFEST_SCHEMA} record.`);
	}
	if (typeof manifest.runId !== 'string' || manifest.runId.length === 0) {
		throw new Error('Production-run manifest must identify its run.');
	}
	if (!EXECUTION_BACKENDS.includes(manifest.backend)) {
		throw new Error('Production-run manifest must identify one supported execution backend.');
	}
	if (
		requireCanonical &&
		(manifest.profileFamily !== CANONICAL_PROFILE_FAMILY ||
			manifest.incomingDirectionVariant !== CANONICAL_INCOMING_DIRECTION_VARIANT)
	) {
		throw new Error('Canonical production run must identify the paper profile and production-68 incoming domain.');
	}
	if (manifest.backend === 'gpu-production-shaders-r32f' && !manifest.gpuCapabilities) {
		throw new Error('GPU production runs must record their WebGL capability identity.');
	}
	if (!Array.isArray(manifest.outputs)) throw new Error('Production-run manifest outputs must be an array.');
	if (!Array.isArray(manifest.conditions)) throw new Error('Production-run manifest conditions must be an array.');
	verifyRunDerivation(manifest, requireCanonical);
	if (
		requireCanonical &&
		(!Array.isArray(manifest.orders) ||
			manifest.orders.length !== REQUIRED_ORDERS.length ||
			manifest.orders.some((order, index) => order !== REQUIRED_ORDERS[index]) ||
			manifest.outputs.length !== REQUIRED_ORDERS.length)
	) {
		throw new Error('Canonical production run must contain only the paper/default J4 boundary.');
	}
	if (
		requireCanonical &&
		(manifest.conditions.length !== CAPTURE_TIMES.length ||
			manifest.conditions.some((time, index) => time !== CAPTURE_TIMES[index]))
	) {
		throw new Error('Production run must contain the complete canonical 17-condition boundary in order.');
	}
	const outputsByOrder = new Map();
	for (const record of manifest.outputs) {
		if (!Number.isInteger(record.order) || outputsByOrder.has(record.order)) {
			throw new Error(`Production-run output order is invalid or duplicated: ${record.order}.`);
		}
		const provenancePath = verifyFile(
			runDirectory,
			record,
			'provenance',
			'provenanceSha256',
			`J${record.order} provenance`,
		);
		const provenance = verifyProvenance(provenancePath, record, manifest);
		const tablePath = verifyFile(runDirectory, record, 'table', 'tableSha256', `J${record.order} table`);
		verifyTable(tablePath, record.order, manifest.conditions, requireCanonical);
		const cubePath = record.cube
			? verifyFile(runDirectory, record, 'cube', 'cubeSha256', `J${record.order} cube`)
			: null;
		if (cubePath) verifyCube(cubePath, record.order, record, manifest);
		const defaultProvenancePath = record.defaultProvenance
			? verifyFile(runDirectory, record, 'defaultProvenance', 'defaultProvenanceSha256', 'Default provenance')
			: null;
		if (defaultProvenancePath) verifyDefaultProvenance(defaultProvenancePath, provenance);
		const output = {
			order: record.order,
			tablePath,
			provenancePath,
			cubePath,
			defaultProvenancePath,
		};
		outputsByOrder.set(record.order, Object.freeze(output));
	}
	if (requireCanonical) {
		for (const order of REQUIRED_ORDERS) {
			const output = outputsByOrder.get(order);
			if (!output?.cubePath)
				throw new Error(`Canonical production run is missing the complete J${order} boundary cube.`);
		}
		if (!outputsByOrder.get(4).defaultProvenancePath) {
			throw new Error('Canonical production run is missing the Default provenance alias for its J4 boundary.');
		}
	}
	return Object.freeze({manifestPath, runDirectory, manifest, outputsByOrder});
}

function candidatePaths(run) {
	const defaultOutput = run.outputsByOrder.get(4);
	return Object.freeze({
		proposedPath: defaultOutput.tablePath,
		proposedProvenancePath: defaultOutput.defaultProvenancePath,
		proposedCubePath: defaultOutput.cubePath,
	});
}

/** Validated current-production B1 run and scorer-input resolver. */
export const ProductionRun = Object.freeze({
	MANIFEST_SCHEMA,
	REQUIRED_ORDERS,
	EXECUTION_BACKENDS,
	CANONICAL_PROFILE_FAMILY,
	CANONICAL_INCOMING_DIRECTION_VARIANT,
	CANONICAL_SPECTRAL_CHANNEL_COUNT,
	CANONICAL_DIRECTION_COUNT,
	load,
	candidatePaths,
});
