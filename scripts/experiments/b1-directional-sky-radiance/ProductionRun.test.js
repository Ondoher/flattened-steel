import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

import {CAPTURE_TIMES} from './benchmark.js';
import {PAPER_PHYSICAL_PROFILE_CONTENT_HASH, PAPER_PHYSICAL_PROFILE_ID} from './candidate-provenance.js';
import {B1_PHYSICAL_MEASUREMENT_BOUNDARY} from '../../algorithm32/production-b-experiments/B1MeasurementBoundary.js';
import {B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY} from '../../algorithm32/production-b-experiments/B1Direct40OfflineAssetAdapter.js';
import B1Direct40CacheAssetSetManifest, {
	B1_DIRECT40_PROFILE_FAMILY,
} from '../../algorithm32/production-b-experiments/B1Direct40CacheAssetSetManifest.js';
import {ProductionRun} from './ProductionRun.js';
import {makeCube} from '../b3-matched-atmosphere-solver/cube.js';

function sha256(text) {
	return createHash('sha256').update(text).digest('hex');
}

function createCompleteRun(directory, {backend = 'cpu-reference-binary64'} = {}) {
	const gpu = backend === 'gpu-production-shaders-r32f';
	const productionRevision = gpu ? 'test-production-revision' : null;
	const assetSet = gpu
		? B1Direct40CacheAssetSetManifest.createRecord({
				profileFamily: B1_DIRECT40_PROFILE_FAMILY,
				productionRevision,
				assets: CAPTURE_TIMES.map((localTime, index) => ({
					condition: {id: `b1-${localTime}`, localTime, fittedAzimuthDegrees: 90 + index},
					manifestPath: `condition-${localTime.replace(':', '')}/asset-manifest-${String(index).padStart(64, '0')}.json`,
					manifestSha256: String(index).padStart(64, '0'),
					assetIdentity: `algorithm32-b1-direct40-cache-sha256:${String(index + 1).padStart(64, '0')}`,
					profile: {id: `test-${localTime}`, contentHash: `sha256:${'0'.repeat(64)}`},
				})),
			})
		: null;
	const assetSetText = assetSet ? `${JSON.stringify(assetSet, null, 2)}\n` : null;
	const assetSetManifestSha256 = assetSetText ? sha256(assetSetText) : null;
	const outputs = [];
	for (const order of ProductionRun.REQUIRED_ORDERS) {
		const table = `j${order}.tsv`;
		const provenance = `j${order}-provenance.json`;
		const cube = `j${order}-cube.json`;
		const tableLines = [
			['model', 'time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join(
				'\t',
			),
		];
		for (const time of CAPTURE_TIMES) {
			for (let x = 0; x < 9; x += 1) {
				for (let y = 0; y < 9; y += 1) {
					tableLines.push(['proposed', time, x, y, ...Array(40).fill('0')].join('\t'));
				}
			}
		}
		const tableText = `${tableLines.join('\n')}\n`;
		const provenanceRecord = {
			schema: 'algorithm32-current-production-b1-provenance-v2',
			runId: 'test-run',
			backend,
			gpuCapabilities: gpu ? {webglVersion: 'WebGL 2 test'} : null,
			modelNameInBenchmarkTables: 'proposed',
			profileId: `paper-j${order}`,
			presentationName: `Algorithm32 Paper J${order}`,
			physicalProfileId: PAPER_PHYSICAL_PROFILE_ID,
			physicalProfileContentHash: PAPER_PHYSICAL_PROFILE_CONTENT_HASH,
			order,
			rowCount: CAPTURE_TIMES.length * 81,
			completeCanonicalBoundary: true,
			physicalMeasurementBoundary: B1_PHYSICAL_MEASUREMENT_BOUNDARY,
			spectralChannelCount: 40,
			nativeSpectralBoundary: {
				channelCount: 40,
				sampleSemantics: 'point-sampled-spectral-density',
				projection: 'identity-direct-40',
			},
			profiles: CAPTURE_TIMES.map((time) => ({
				id: `test-${time}`,
				contentHash: `sha256:${'0'.repeat(64)}`,
				time,
			})),
			table: {name: table, sha256: sha256(tableText)},
		};
		const provenanceText = `${JSON.stringify(provenanceRecord)}\n`;
		const cubeText = `${JSON.stringify(
			makeCube(
				Array.from({length: 17}, () => Array.from({length: 81}, () => Array(31).fill(0))),
				{runId: 'test-run', order, table, tableSha256: sha256(tableText)},
			),
		)}\n`;
		writeFileSync(join(directory, table), tableText);
		writeFileSync(join(directory, provenance), provenanceText);
		writeFileSync(join(directory, cube), cubeText);
		const output = {
			order,
			table,
			tableSha256: sha256(tableText),
			provenance,
			provenanceSha256: sha256(provenanceText),
			cube,
			cubeSha256: sha256(cubeText),
			derivation: {
				inputAssetSetIdentity: assetSet?.setIdentity ?? null,
				inputProfileHashes: CAPTURE_TIMES.map((time) => ({
					time,
					id: `test-${time}`,
					contentHash: `sha256:${'0'.repeat(64)}`,
				})),
				operation: 'test production final-view derivation',
			},
		};
		if (order === 4) {
			const defaultProvenanceText = `${JSON.stringify({
				...provenanceRecord,
				profileId: 'paper',
				presentationName: 'Algorithm32 Paper',
			})}\n`;
			output.defaultProvenance = 'default-provenance.json';
			output.defaultProvenanceSha256 = sha256(defaultProvenanceText);
			writeFileSync(join(directory, output.defaultProvenance), defaultProvenanceText);
		}
		outputs.push(output);
	}
	writeFileSync(
		join(directory, 'manifest.json'),
		JSON.stringify({
			schema: ProductionRun.MANIFEST_SCHEMA,
			runId: 'test-run',
			status: 'COMPLETE',
			backend,
			executionIdentity: gpu
				? 'algorithm32-b1-production-gpu-final-view-r32f-v1'
				: 'algorithm32-b1-cpu-reference-binary64-v1',
			canonicality: {kind: 'canonical-candidate', publicationEligible: true},
			productionRevision,
			compilerIdentity: gpu
				? B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY
				: 'algorithm32-b1-cpu-reference-binary64-v1',
			assetSetIdentity: assetSet?.setIdentity ?? null,
			assetSet,
			assetSetManifest: assetSet
				? {
						name: `asset-set-manifest-${assetSetManifestSha256}.json`,
						sha256: assetSetManifestSha256,
					}
				: null,
			assets:
				assetSet?.assets.map((asset) => ({
					condition: asset.condition.localTime,
					assetIdentity: asset.assetIdentity,
					manifestSha256: asset.manifestSha256,
					profileId: asset.profile.id,
					profileContentHash: asset.profile.contentHash,
				})) ?? [],
			gpuCapabilities: gpu ? {webglVersion: 'WebGL 2 test'} : null,
			conditions: CAPTURE_TIMES,
			orders: ProductionRun.REQUIRED_ORDERS,
			profileHashes: CAPTURE_TIMES.flatMap((time) =>
				ProductionRun.REQUIRED_ORDERS.map((order) => ({
					order,
					time,
					id: `test-${time}`,
					contentHash: `sha256:${'0'.repeat(64)}`,
				})),
			),
			profileFamily: ProductionRun.CANONICAL_PROFILE_FAMILY,
			incomingDirectionVariant: ProductionRun.CANONICAL_INCOMING_DIRECTION_VARIANT,
			outputs,
		}),
	);
}

function mutateJson(path, mutation) {
	const value = JSON.parse(readFileSync(path, 'utf8'));
	mutation(value);
	const text = `${JSON.stringify(value)}\n`;
	writeFileSync(path, text);
	return sha256(text);
}

test('resolves the Bruneton J4 scorer input from one complete production-run manifest', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		const run = ProductionRun.load(directory);
		const paths = ProductionRun.candidatePaths(run);
		assert.match(paths.proposedPath, /j4\.tsv$/);
		assert.match(paths.proposedProvenancePath, /default-provenance\.json$/);
		assert.match(paths.proposedCubePath, /j4-cube\.json$/);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});

test('rejects a production-run file changed after manifest finalization', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		writeFileSync(join(directory, 'j4.tsv'), 'changed\n');
		assert.throws(() => ProductionRun.load(directory), /SHA-256/);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});

test('rejects noncanonical profile families, incoming domains, conditions, and orders', () => {
	for (const mutate of [
		(manifest) => (manifest.profileFamily = 'native'),
		(manifest) => (manifest.incomingDirectionVariant = 'reflection-completed-136'),
		(manifest) => manifest.conditions.reverse(),
		(manifest) => (manifest.orders = [3]),
	]) {
		const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
		try {
			createCompleteRun(directory);
			mutateJson(join(directory, 'manifest.json'), mutate);
			assert.throws(
				() => ProductionRun.load(directory),
				/canonical production run|paper profile|canonical 17-condition|canonicality/iu,
			);
		} finally {
			rmSync(directory, {recursive: true, force: true});
		}
	}
});

test('authenticates the GPU revision, compiler, complete asset set, profiles, and output derivation', () => {
	const validDirectory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(validDirectory, {backend: 'gpu-production-shaders-r32f'});
		const run = ProductionRun.load(validDirectory);
		assert.equal(run.manifest.assets.length, 17);
		assert.equal(run.manifest.productionRevision, 'test-production-revision');
		assert.equal(run.manifest.compilerIdentity, B1_DIRECT40_OFFLINE_ASSET_ADAPTER_IDENTITY);
	} finally {
		rmSync(validDirectory, {recursive: true, force: true});
	}

	for (const mutation of [
		(manifest) => (manifest.productionRevision = 'changed-revision'),
		(manifest) => (manifest.compilerIdentity = 'changed-compiler'),
		(manifest) => (manifest.gpuCapabilities.webglVersion = 'changed WebGL identity'),
		(manifest) => (manifest.assetSetIdentity = `algorithm32-b1-direct40-cache-set-sha256:${'f'.repeat(64)}`),
		(manifest) => (manifest.assetSetManifest.sha256 = 'f'.repeat(64)),
		(manifest) => (manifest.assetSet.assets[0].profile.contentHash = `sha256:${'f'.repeat(64)}`),
		(manifest) => (manifest.assets[0].assetIdentity = `algorithm32-b1-direct40-cache-sha256:${'f'.repeat(64)}`),
		(manifest) => (manifest.profileHashes[0].contentHash = `sha256:${'f'.repeat(64)}`),
		(manifest) => (manifest.outputs[0].derivation.inputProfileHashes[0].contentHash = `sha256:${'f'.repeat(64)}`),
	]) {
		const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
		try {
			createCompleteRun(directory, {backend: 'gpu-production-shaders-r32f'});
			mutateJson(join(directory, 'manifest.json'), mutation);
			assert.throws(
				() => ProductionRun.load(directory),
				/asset|profile|compiler|revision|derivation|identity|capabilities/iu,
			);
		} finally {
			rmSync(directory, {recursive: true, force: true});
		}
	}
});

test('rejects a changed default-provenance alias even when its updated hash is recorded', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		const defaultProvenanceSha256 = mutateJson(join(directory, 'default-provenance.json'), (provenance) => {
			provenance.profileId = 'changed-default';
		});
		mutateJson(join(directory, 'manifest.json'), (manifest) => {
			manifest.outputs[0].defaultProvenanceSha256 = defaultProvenanceSha256;
		});
		assert.throws(() => ProductionRun.load(directory), /Default provenance alias/u);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});

test('rejects semantically mismatched provenance even when its updated hash is recorded', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		const provenanceSha256 = mutateJson(join(directory, 'j4-provenance.json'), (provenance) => {
			provenance.nativeSpectralBoundary.projection = 'native15-to-direct40';
		});
		mutateJson(join(directory, 'manifest.json'), (manifest) => {
			manifest.outputs[0].provenanceSha256 = provenanceSha256;
		});
		assert.throws(() => ProductionRun.load(directory), /canonical direct-40 paper boundary/u);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});

test('rejects a Color, tone, encoding, or presentation contribution in scoring provenance', () => {
	for (const mutate of [
		(boundary) => (boundary.colorDisplayModel = 'color-reset-slope-078-p9'),
		(boundary) => (boundary.toneMapping = 'aces'),
		(boundary) => (boundary.displayEncoding = 'srgb'),
		(boundary) => boundary.stellarPresentationFilters.push('human-low-light-chroma-v1'),
	]) {
		const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
		try {
			createCompleteRun(directory);
			const provenanceSha256 = mutateJson(join(directory, 'j4-provenance.json'), (provenance) => {
				mutate(provenance.physicalMeasurementBoundary);
			});
			mutateJson(join(directory, 'manifest.json'), (manifest) => {
				manifest.outputs[0].provenanceSha256 = provenanceSha256;
			});
			assert.throws(() => ProductionRun.load(directory), /native-spectral and Color-free/u);
		} finally {
			rmSync(directory, {recursive: true, force: true});
		}
	}
});

test('rejects changed B3 axes even when the cube and manifest hashes agree', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		const cubeSha256 = mutateJson(join(directory, 'j4-cube.json'), (cube) => {
			cube.wavelengthsNm[0] += 1;
		});
		mutateJson(join(directory, 'manifest.json'), (manifest) => {
			manifest.outputs[0].cubeSha256 = cubeSha256;
		});
		assert.throws(() => ProductionRun.load(directory), /cube axes or values/u);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});
