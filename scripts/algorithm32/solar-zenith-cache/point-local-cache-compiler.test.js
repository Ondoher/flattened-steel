import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {createBrunetonProductionProfile} from '../../experiments/b1-directional-sky-radiance/production-profile.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from './DistantSunSceneCacheNumerics.js';
import DistantSunSharedCacheGenerator from './DistantSunSharedCacheGenerator.js';
import DistantSunPointLocalCacheInventory from './DistantSunPointLocalCacheInventory.js';
import DistantSunPointLocalCachePackage from './DistantSunPointLocalCachePackage.js';
import DistantSunPointLocalCacheReader from './DistantSunPointLocalCacheReader.js';
import DistantSunPointLocalCacheStaging from './DistantSunPointLocalCacheStaging.js';
import DistantSunSharedCacheGenerationFiles from './DistantSunSharedCacheGenerationFiles.js';
import {DistantSunPointLocalProfileCompilerInputs} from './DistantSunPointLocalProfileCompilerInputs.js';
import {DISTANT_SUN_SCENE_CACHE_OZONE_CROSS_SECTIONS_SQUARE_METERS} from './consts.js';
import {NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';
import {createFlat32Atmosphere} from '../../../src/flat32/Flat32Atmosphere.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const proofRoot = 'tmp/algorithm32/point-local-cache-compiler';

test('projects complete configurable aerosols while preserving canonical defaults and numerics', () => {
	const scene = DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene();
	const canonical = DistantSunSceneCacheCompilerInputs.createInputSet(scene).buildRequest;
	const atmosphere = createFlat32Atmosphere();
	const selectedConstants = {
		...atmosphere.constants,
		mieScaleHeight: {value: 2400, units: /** @type {const} */ ('meters')},
		mieAngstromBeta: 0.010000000000138879,
		mieSingleScatteringAlbedo: 0.95,
		miePhaseFunctionG: 0.85,
	};
	const selected = DistantSunSceneCacheCompilerInputs.createInputSet(scene, {
		aerosolConstants: selectedConstants,
	}).buildRequest;
	const expected = structuredClone(canonical);
	expected.transportSpec.atmosphere = {
		...canonical.transportSpec.atmosphere,
		id: 'algorithm32-configured-aerosols-no-ozone-v1',
		mieScaleHeightMeters: 2400,
		mieAngstromBeta: 0.010000000000138879,
		mieSingleScatteringAlbedo: 0.95,
		miePhaseFunctionG: 0.85,
	};
	assert.deepEqual(selected, expected);
	assert.equal(
		DistantSunSceneCacheCompilerInputs.createInputSet(scene, {
			aerosolConstants: {...selectedConstants, mieAngstromAlpha: -0.2},
		}).buildRequest.transportSpec.atmosphere.mieAngstromAlpha,
		-0.2,
	);
	assert.equal(canonical.transportSpec.atmosphere.mieScaleHeightMeters, 1200);
	assert.equal(canonical.transportSpec.atmosphere.mieAngstromBeta, 0.04);
	assert.equal(canonical.transportSpec.atmosphere.mieSingleScatteringAlbedo, 0.8);
	assert.equal(canonical.transportSpec.atmosphere.miePhaseFunctionG, 0.7);
	assert.ok(Math.abs(selectedConstants.mieAngstromBeta * -Math.expm1(-60000 / 2400) - 0.01) < 1e-16);
	assert.throws(
		() =>
			DistantSunSceneCacheCompilerInputs.createInputSet(scene, {
				aerosolConstants: selectedConstants,
				mieAngstromBeta: 0,
			}),
		/complete aerosol constants/u,
	);
});

async function reference() {
	return JSON.parse(
		await readFile(path.join(repositoryRoot, 'experiments/point-local-cache-builder/bruneton-inputs.json'), 'utf8'),
	);
}

function smallInventory() {
	const directionBytes = Buffer.alloc(4 * Uint16Array.BYTES_PER_ELEMENT);
	[0, 1, 2, 0].forEach((value, index) => directionBytes.writeUInt16LE(value, index * 2));
	return {
		buildRequest: {transportSpec: {domains: {spectrum: {id: 'fixture'}}}},
		directionBytes,
		coordinates: [
			[0, 0],
			[0, 1],
		],
		blocks: [
			{
				tile: {altitudeIndex: 0, solarZenithIndex: 0},
				coordinates: [
					[0, 0],
					[0, 1],
				],
			},
		],
		scenes: [
			{
				ordinal: 0,
				request: {id: 'reverse', zenithDegrees: 1, observerAltitudeMeters: 0},
				ledger: {rows: []},
				keys: ['0:1', '0:0'],
				indexes: [1, 0],
			},
		],
		wavelengths: [2, 5],
		channelCount: 2,
		logicalDirectionCount: 4,
		uniqueDirectionCount: 3,
		maximumDecodedBlockBytes: 16 * 1024 * 1024,
		maximumEncodedBlockBytes: 17 * 1024 * 1024,
		unionLedger: {retainedBlockCount: 2, rows: []},
	};
}

function tile(channel) {
	const bytes = Buffer.alloc(2 * 4 * Float32Array.BYTES_PER_ELEMENT);
	for (let row = 0; row < 2; row += 1) {
		const values = [channel * 100 + row * 10, channel * 100 + row * 10 + 1, channel * 100 + row * 10 + 2];
		for (const [logical, unique] of [0, 1, 2, 0].entries()) {
			bytes.writeFloatLE(values[unique], (row * 4 + logical) * 4);
		}
	}
	return bytes;
}

test('numerical candidates have distinct Native15 and Direct40 identities while retaining logical ground coordinates', () => {
	const scene = DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene();
	const profile = createBrunetonProductionProfile({
		time: '10:15',
		fittedAzimuthDegrees: 98.59994923191232,
		maximumScatteringOrder: 4,
	});
	const controls = [
		DistantSunSceneCacheCompilerInputs.createInputSet(scene),
		DistantSunPointLocalProfileCompilerInputs.createInputSet(profile),
	];
	const identities = controls.map((control) => new Set([control.numericalIdentity]));
	for (const numericalPolicy of [2, 4, 8]
		.map((height) => DistantSunSceneCacheNumerics.createSurfaceLimit(height))
		.concat(DistantSunSceneCacheNumerics.createAnchoredRadial())) {
		const options = /** @type {DistantSunSceneCacheCompilerOptions} */ ({
			numericalPolicy,
			solarInterpolation: 'monotone-cubic',
		});
		const candidates = [
			DistantSunSceneCacheCompilerInputs.createInputSet(scene, options),
			DistantSunPointLocalProfileCompilerInputs.createInputSet(profile, options),
		];
		for (const [index, candidate] of candidates.entries()) {
			const spec = candidate.buildRequest.transportSpec;
			assert.ok(
				!identities[index].has(candidate.numericalIdentity),
				'Numerical selections must not collide with a control or another candidate.',
			);
			identities[index].add(candidate.numericalIdentity);
			assert.deepEqual(spec.numerical.geometryPolicy, numericalPolicy);
			assert.equal(spec.numerical.solarInterpolation, 'monotone-cubic');
			assert.deepEqual(spec.domains, controls[index].buildRequest.transportSpec.domains);
			assert.equal(spec.domains.position.nodes[0].altitudeMeters, 0);
		}
	}
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch([profile], {
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		solarInterpolation: 'monotone-cubic',
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);
	const coordinates = new Set(inventory.coordinates.map((coordinate) => coordinate.join(':')));
	const linearInput = DistantSunPointLocalProfileCompilerInputs.createBatch([profile]);
	const linearInventory = new DistantSunPointLocalCacheInventory().create(
		linearInput.buildRequest,
		linearInput.scenes,
		linearInput.wavelengths,
	);
	for (const [sceneIndex, sceneRecord] of inventory.scenes.entries())
		for (const row of linearInventory.scenes[sceneIndex].ledger.rows) {
			const retained = sceneRecord.ledger.rows[row.altitudeIndex];
			assert.equal(retained.firstSolarZenithIndex, Math.max(0, row.firstSolarZenithIndex - 1));
			assert.equal(retained.lastSolarZenithIndex, Math.min(179, row.lastSolarZenithIndex + 1));
			for (
				let zenith = Math.max(0, row.firstSolarZenithIndex - 1);
				zenith <= Math.min(179, row.lastSolarZenithIndex + 1);
				zenith++
			) {
				assert.ok(
					coordinates.has(`${row.altitudeIndex}:${zenith}`),
					'The Direct40 candidate must include its complete cubic stencil.',
				);
				const packed = retained.firstPackedRow + zenith - retained.firstSolarZenithIndex;
				assert.deepEqual(
					inventory.coordinates[sceneRecord.indexes[packed]],
					[row.altitudeIndex, zenith],
					'The materialized scene must retain every cubic halo row.',
				);
			}
		}
});

test('projects Direct40 into the receiver-local Z180 compiler and plans the accepted 17-scene union', async () => {
	const control = await reference();
	const profiles = control.scenes.map((scene) =>
		createBrunetonProductionProfile({
			time: scene.time,
			fittedAzimuthDegrees: scene.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		}),
	);
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
		ids: control.scenes.map((scene) => scene.id),
	});
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);

	assert.equal(input.buildRequest.transportSpec.shaderProfile.coordinateContract, 'scene-cache-receiver-local-v1');
	assert.equal(input.buildRequest.transportSpec.domains.solarZenith.count, 180);
	assert.equal(input.buildRequest.transportSpec.domains.spectrum.channels.length, 40);
	assert.equal(input.buildRequest.transportSpec.source.directionToLight, undefined);
	for (const [index, scene] of input.scenes.entries()) {
		assert.ok(Math.abs(scene.zenithDegrees - control.scenes[index].zenithDegrees) < 1e-12);
	}
	assert.equal(inventory.scenes.length, 17);
	assert.equal(inventory.coordinates.length, 1951);
	assert.equal(inventory.blocks.length, 96);
	assert.equal(inventory.channelCount, 40);
	assert.ok(inventory.blocks.every((block) => block.coordinates.length * 40 * 4058 * 4 <= 16 * 1024 * 1024));

	const duplicates = Array.from({length: 257}, (_unused, index) => ({
		...input.scenes[index % input.scenes.length],
		id: `copy-${index}`,
	}));
	const duplicateInventory = new DistantSunPointLocalCacheInventory().create(input.buildRequest, duplicates, [0]);
	assert.equal(duplicateInventory.scenes.length, 257);
	assert.deepEqual(duplicateInventory.coordinates, inventory.coordinates);
});

test('preserves the fixed Native15 request and ledger identities', () => {
	const input = DistantSunSceneCacheCompilerInputs.createInputSet(
		DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene(),
	);
	assert.equal(
		CanonicalValueHash.sha256Value(input.buildRequest),
		'sha256:e3daaf2ee2600caef707c3c1106ae6c03b25577b9f075316511c3c0962645e4b',
	);
	// Preserve the historical ozone control independently of the deployed no-ozone profile.
	const historical = structuredClone(input.buildRequest);
	historical.transportSpec.atmosphere.id = 'algorithm32-canonical-plus-bruneton-ozone-300du-v1';
	const ozone = historical.transportSpec.atmosphere.ozone;
	ozone.id = 'bruneton-earth-demo-ozone-34f14e7-v1';
	ozone.absorptionEnabled = true;
	ozone.dobsonUnits = 300;
	delete ozone.maximumDensityPerCubicMeter;
	ozone.crossSectionTable.values = DISTANT_SUN_SCENE_CACHE_OZONE_CROSS_SECTIONS_SQUARE_METERS;
	assert.equal(
		CanonicalValueHash.sha256Value(historical),
		'sha256:364d05afddbe0fec61f8941fa25ae71b70835706102946f025689d29ff65bf04',
	);
	assert.equal(
		CanonicalValueHash.sha256Value(input.ledger.toRecord()),
		'sha256:b5e38741359b0e60ce6155a47941a000192c7aec1b6240d48bf3ab3bb032f671',
	);
});

test('projects the named near-ground grid without changing any other transport input', async () => {
	const control = await reference();
	const options = {
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
		solarInterpolation: 'monotone-cubic',
	};
	const profiles = control.scenes.map((scene) =>
		createBrunetonProductionProfile({
			time: scene.time,
			fittedAzimuthDegrees: scene.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
			positionDomain: 'native51-near-ground',
		}),
	);
	const originals = control.scenes.map((scene) =>
		createBrunetonProductionProfile({
			time: scene.time,
			fittedAzimuthDegrees: scene.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		}),
	);
	const input = DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {
		...options,
		positionDomain: 'native51-near-ground',
		ids: control.scenes.map((scene) => scene.id),
	});
	const original = DistantSunPointLocalProfileCompilerInputs.createBatch(originals, options);
	const comparable = structuredClone(input.buildRequest.transportSpec);
	comparable.domains.position = original.buildRequest.transportSpec.domains.position;
	assert.deepEqual(comparable, original.buildRequest.transportSpec);
	assert.notEqual(input.numericalIdentity, original.numericalIdentity);
	assert.notEqual(input.constructionProfileIdentity.contentHash, original.constructionProfileIdentity.contentHash);
	assert.deepEqual(
		input.buildRequest.transportSpec.domains.position.nodes.slice(0, 5).map((node) => node.altitudeMeters),
		[0, 468.75, 937.5, 1406.25, 1875],
	);
	const inventory = new DistantSunPointLocalCacheInventory().create(
		input.buildRequest,
		input.scenes,
		input.wavelengths,
	);
	assert.equal(inventory.coordinates.length, 2149);
	assert.equal(inventory.blocks.length, 106);
	assert.equal(inventory.coordinates.length * 4058 * 40 * 4, 1395302720);
	for (const scene of inventory.scenes) {
		assert.equal(scene.ledger.rows.length, 51);
		for (const row of scene.ledger.rows) {
			assert.deepEqual(
				row.altitude,
				NATIVE_51_NEAR_GROUND_POSITION_DOMAIN_OWNER.nodes[row.altitudeIndex].coordinate,
			);
			for (let zenith = row.firstSolarZenithIndex; zenith <= row.lastSolarZenithIndex; zenith += 1) {
				const packed = row.firstPackedRow + zenith - row.firstSolarZenithIndex;
				assert.deepEqual(inventory.coordinates[scene.indexes[packed]], [row.altitudeIndex, zenith]);
			}
		}
	}
	assert.throws(
		() => DistantSunPointLocalProfileCompilerInputs.createBatch(profiles, {positionDomain: 'native48'}),
		/disagrees/u,
	);
	const altered = structuredClone(input.buildRequest);
	altered.transportSpec.domains.position.nodes[1].altitudeMeters = 500;
	assert.throws(
		() => new DistantSunPointLocalCacheInventory().create(altered, input.scenes, input.wavelengths),
		/exact supported/u,
	);
	const mislabeled = structuredClone(input.buildRequest);
	mislabeled.transportSpec.domains.position.id = original.buildRequest.transportSpec.domains.position.id;
	assert.throws(
		() => new DistantSunPointLocalCacheInventory().create(mislabeled, input.scenes, input.wavelengths),
		/exact supported/u,
	);
});

test('projects an explicit Native51 compiler request while explicit Native48 remains identical to omission', () => {
	const scene = DistantSunSceneCacheCompilerInputs.createQualifiedSanJoseNauticalScene();
	const original = DistantSunSceneCacheCompilerInputs.createInputSet(scene);
	assert.deepEqual(DistantSunSceneCacheCompilerInputs.createInputSet(scene, {positionDomain: 'native48'}), original);
	const candidate = DistantSunSceneCacheCompilerInputs.createInputSet(scene, {
		positionDomain: 'native51-near-ground',
	});
	assert.equal(candidate.ledger.rows.length, 51);
	assert.equal(candidate.buildRequest.transportSpec.domains.position.count, 51);
	assert.notEqual(candidate.numericalIdentity, original.numericalIdentity);
	const comparable = structuredClone(candidate.buildRequest.transportSpec);
	comparable.domains.position = original.buildRequest.transportSpec.domains.position;
	assert.deepEqual(comparable, original.buildRequest.transportSpec);
	assert.throws(
		() => DistantSunSceneCacheCompilerInputs.createInputSet(scene, {positionDomain: 'native96'}),
		/Unsupported/u,
	);
});

test('stages variable dimensions and package expansion preserves exact Float32 bits', async () => {
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	await files.directory(proofRoot);
	const runRoot = `${proofRoot}/test-${randomUUID()}`;
	await files.directory(runRoot);
	const inventory = smallInventory();
	const stagingRoot = `${runRoot}/staging`;
	const staging = new DistantSunPointLocalCacheStaging(inventory);
	await staging.allocate(files, stagingRoot);
	try {
		await assert.rejects(staging.accept(1, 0, tile(1)), /order or extent/u);
		await staging.accept(0, 0, tile(0));
		await staging.accept(1, 0, tile(1));
		assert.equal(staging.complete(), 2 * 2 * 3 * 4);
	} finally {
		await staging.close();
	}
	const packaged = await new DistantSunPointLocalCachePackage().write({
		files,
		root: `${runRoot}/package`,
		stagingRoot,
		inventory,
		implementation: {id: 'fixture-compiler', version: '1', sha256: '0'.repeat(64)},
		gpu: {
			accepted: true,
			elapsedMilliseconds: 1,
			wavelengths: [],
			userAgent: 'fixture',
			gpu: {api: 'fixture', renderer: 'fixture'},
			maximumReadbackBytes: 32,
			unionAccumulatorBytes: 64,
		},
		signal: new AbortController().signal,
	});
	const reader = new DistantSunPointLocalCacheReader();
	assert.equal(packaged.packet.layout.maximumEncodedBlockBytes, 17 * 1024 * 1024);
	await reader.prepareStaging(files, packaged.packet, stagingRoot);
	const directions = await reader.readDirectionMap(files, packaged.packet);
	const channel = await reader.readChannel(files, packaged.packet, 1);
	const expanded = reader.expand(files, packaged.packet, 0, channel, directions);
	assert.deepEqual([...expanded], [110, 111, 112, 110, 100, 101, 102, 100]);
	const unique = reader.expandUnique(files, packaged.packet, 0, channel);
	assert.deepEqual(
		[...new Float32Array(unique.buffer, unique.byteOffset, unique.length / 4)],
		[110, 111, 112, 100, 101, 102],
	);

	const corrupt = structuredClone(packaged.packet);
	corrupt.scenes[0].indexes[0] = 0;
	const {packageIdentity: _discarded, ...record} = corrupt;
	corrupt.packageIdentity = `sha256:${files.hash(JSON.stringify(record))}`;
	assert.throws(() => reader.expand(files, corrupt, 0, channel, directions), /reconstruction index/u);
	assert.throws(() => reader.expandUnique(files, corrupt, 0, channel), /reconstruction index/u);

	const unbounded = structuredClone(packaged.packet);
	unbounded.layout.maximumDecodedBlockBytes = Number.MAX_SAFE_INTEGER;
	const {packageIdentity: _unboundedIdentity, ...unboundedRecord} = unbounded;
	unbounded.packageIdentity = `sha256:${files.hash(JSON.stringify(unboundedRecord))}`;
	assert.throws(() => reader.expand(files, unbounded, 0, channel, directions), /dimensions are inconsistent/u);

	const oversizedEncoded = structuredClone(packaged.packet);
	oversizedEncoded.layout.maximumEncodedBlockBytes = Number.MAX_SAFE_INTEGER;
	const {packageIdentity: _encodedIdentity, ...encodedRecord} = oversizedEncoded;
	oversizedEncoded.packageIdentity = `sha256:${files.hash(JSON.stringify(encodedRecord))}`;
	assert.throws(() => reader.expand(files, oversizedEncoded, 0, channel, directions), /dimensions are inconsistent/u);
});

test('terminalizes package-directory setup failure inside a new compiler run', async () => {
	const runRoot = `${proofRoot}/test-${randomUUID()}`;
	const originalDirectory = DistantSunSharedCacheGenerationFiles.prototype.directory;
	DistantSunSharedCacheGenerationFiles.prototype.directory = function (relativePath) {
		if (relativePath === `${runRoot}/package`) throw new Error('fixture package setup failure');
		return originalDirectory.call(this, relativePath);
	};
	try {
		const compiler = new DistantSunSharedCacheGenerator({chromePath: path.join(repositoryRoot, 'chrome.exe')});
		await assert.rejects(
			compiler.compile({
				outputDirectory: runRoot,
				buildRequest: {},
				scenes: [],
				wavelengths: [],
				signal: new AbortController().signal,
			}),
			/fixture package setup failure/u,
		);
	} finally {
		DistantSunSharedCacheGenerationFiles.prototype.directory = originalDirectory;
	}
	const failure = JSON.parse(await readFile(path.join(repositoryRoot, runRoot, 'failure.json'), 'utf8'));
	assert.equal(failure.accepted, false);
});

test('rejects unsupported coordinate contracts and selections before GPU execution', async () => {
	const control = await reference();
	const profile = createBrunetonProductionProfile({
		time: control.scenes[0].time,
		fittedAzimuthDegrees: control.scenes[0].fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
	});
	const input = DistantSunPointLocalProfileCompilerInputs.createInputSet(profile);
	const scene = DistantSunPointLocalProfileCompilerInputs.createScene(profile);
	assert.throws(
		() =>
			new DistantSunPointLocalCacheInventory().create(
				{
					...input.buildRequest,
					transportSpec: {
						...input.buildRequest.transportSpec,
						shaderProfile: {coordinateContract: 'production-source-aligned-v1'},
					},
				},
				[scene],
				[0],
			),
		/receiver-local/u,
	);
	assert.throws(
		() => new DistantSunPointLocalCacheInventory().create(input.buildRequest, [scene], [0, 0]),
		/unique in-range/u,
	);
	const compiler = new DistantSunSharedCacheGenerator({chromePath: path.join(repositoryRoot, 'chrome.exe')});
	const files = new DistantSunSharedCacheGenerationFiles(repositoryRoot);
	await assert.rejects(compiler._createRun(files, 'src/generated-cache'), /must be below/u);
	await assert.rejects(compiler._createRun(files, proofRoot), /must be below/u);
});
