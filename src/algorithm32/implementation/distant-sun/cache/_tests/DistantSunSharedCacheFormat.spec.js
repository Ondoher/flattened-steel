import {NATIVE_15_SPECTRAL_BASIS} from '../../../../profiles/index.js';
import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
} from '../../../../sampling-domains/index.js';
import {
	DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH,
	DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID,
} from '../consts.js';
import DistantSunSceneCacheLedger from '../DistantSunSceneCacheLedger.js';
import DistantSunSharedCacheFormat from '../DistantSunSharedCacheFormat.js';

describe('DistantSunSharedCacheFormat', /** Called by Jasmine to register shared-format behavior. */ () => {
	const format = new DistantSunSharedCacheFormat();

	it('accepts the selected codec, graph root, catalog, configuration, blocks, and scene', /** Called by Jasmine to exercise the complete positive ingress. */ () => {
		const fixture = createFixture();

		expect(format.parseCodecProfile(JSON.stringify(fixture.codecProfile))).toEqual(fixture.codecProfile);
		expect(format.parsePackageSetReport(JSON.stringify(fixture.packageSet))).toEqual(fixture.packageSet);
		expect(format.parseRuntimeCatalog(JSON.stringify(fixture.catalog))).toEqual(fixture.catalog);
		expect(format.parseConfigurationManifest(JSON.stringify(fixture.configuration))).toEqual(fixture.configuration);
		expect(format.parseBlockIndex(JSON.stringify(fixture.blockIndex), fixture.configuration)).toEqual(
			fixture.blockIndex,
		);
		expect(
			format.parseSceneManifest(JSON.stringify(fixture.scene), fixture.configuration, fixture.blockIndex),
		).toEqual(fixture.scene);
	});

	it('rejects unsupported schemas, unknown properties, unsafe paths, codec drift, and 4x8 blocks', /** Called by Jasmine to prove exact version and layout rejection. */ () => {
		const fixture = createFixture();
		expect(() => format.acceptPackageSetReport({...fixture.packageSet, schemaId: 'unknown'})).toThrowError(
			/unsupported/u,
		);
		expect(() => format.acceptPackageSetReport({...fixture.packageSet, alias: true})).toThrowError(/properties/u);
		expect(() =>
			format.acceptPackageSetReport({
				...fixture.packageSet,
				runtimeCatalog: {...fixture.packageSet.runtimeCatalog, path: '../catalog.json'},
			}),
		).toThrowError(/contained/u);
		expect(() => format.acceptCodecProfile({...fixture.codecProfile, level: 3})).toThrowError(/unsupported/u);
		expect(() =>
			format.acceptConfigurationManifest({
				...fixture.configuration,
				blockGrid: {...fixture.configuration.blockGrid, altitudeCount: 4},
			}),
		).toThrowError(/8x8/u);
	});

	it('rejects duplicate ownership, coordinate gaps, oversized declarations, and corrupt artifact identities', /** Called by Jasmine to prove block-index fail-closed behavior. */ () => {
		const fixture = createFixture();
		const duplicatedBlocks = structuredClone(fixture.blockIndex.blocks);
		duplicatedBlocks[1].coordinates[0] = [...duplicatedBlocks[0].coordinates[0]];
		expect(() =>
			format.acceptBlockIndex({...fixture.blockIndex, blocks: duplicatedBlocks}, fixture.configuration),
		).toThrowError(/outside its tile|duplicated/u);
		expect(() =>
			format.acceptBlockIndex(
				{...fixture.blockIndex, distinctCoordinateCount: fixture.blockIndex.distinctCoordinateCount + 1},
				fixture.configuration,
			),
		).toThrowError(/gap/u);

		const oversizedBlocks = structuredClone(fixture.blockIndex.blocks);
		oversizedBlocks[0].decoded.byteLength = 16 * 1024 * 1024 + 4;
		expect(() =>
			format.acceptBlockIndex({...fixture.blockIndex, blocks: oversizedBlocks}, fixture.configuration),
		).toThrowError(/oversized/u);

		const corruptBlocks = structuredClone(fixture.blockIndex.blocks);
		corruptBlocks[0].encoded.path = `blocks/${'f'.repeat(64)}.zst`;
		expect(() =>
			format.acceptBlockIndex({...fixture.blockIndex, blocks: corruptBlocks}, fixture.configuration),
		).toThrowError(/artifact identity/u);
	});

	it('keeps logical decoded identities separate while permitting encoded-artifact deduplication', /** Called by Jasmine to prove content-addressed encoded reuse. */ () => {
		const fixture = createFixture();
		const blocks = structuredClone(fixture.blockIndex.blocks);
		blocks[1].encoded = {...blocks[0].encoded};
		const encodedOutput = blocks[1].derivation.outputs.find((output) => output.role === 'encoded-block');
		encodedOutput.byteLength = blocks[0].encoded.byteLength;
		encodedOutput.sha256 = blocks[0].encoded.sha256;

		expect(format.acceptBlockIndex({...fixture.blockIndex, blocks}, fixture.configuration).blocks[1].id).not.toBe(
			blocks[0].id,
		);
		expect(blocks[1].encoded.sha256).toBe(blocks[0].encoded.sha256);
	});

	it('rejects incompatible physics, missing scene coordinates, and corrupt reconstructed identities', /** Called by Jasmine to prove scene compatibility and reconstruction gates. */ () => {
		const fixture = createFixture();
		expect(() =>
			format.acceptSceneManifest(
				{
					...fixture.scene,
					compatibility: {...fixture.scene.compatibility, atmosphereIdentity: 'different'},
				},
				fixture.configuration,
				fixture.blockIndex,
			),
		).toThrowError(/physically incompatible/u);
		expect(() =>
			format.acceptSceneManifest(
				{...fixture.scene, coordinates: fixture.scene.coordinates.slice(1)},
				fixture.configuration,
				fixture.blockIndex,
			),
		).toThrowError(/cover/u);
		expect(() =>
			format.acceptSceneManifest(
				{
					...fixture.scene,
					reconstructedPayload: {...fixture.scene.reconstructedPayload, sha256: 'f'.repeat(64)},
				},
				fixture.configuration,
				fixture.blockIndex,
			),
		).toThrowError(/authenticate/u);
	});

	it('rejects malformed JSON before accepting a serialized record', /** Called by Jasmine to prove parser syntax diagnostics. */ () => {
		expect(() => format.parsePackageSetReport('{')).toThrowError(/malformed/u);
	});
});

/** Called by this spec to create one deterministic lowercase SHA-256-shaped identity. */
function hash(index) {
	return index.toString(16).padStart(64, '0');
}

/** Called by this spec to create one complete derivation with exact output identities. */
function derivation(outputs, seed) {
	return {
		schemaId: DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID,
		parents: [{role: 'control', artifact: {path: `parents/${seed}.json`, byteLength: 1, sha256: hash(seed)}}],
		operationId: 'algorithm32-shared-cache-test-operation-v1',
		equationId: 'algorithm32-shared-cache-test-equation-v1',
		implementation: {id: 'test-implementation', version: '1.0.0', sha256: hash(seed + 1)},
		tools: [{id: 'node', version: 'test'}],
		parametersSha256: hash(seed + 2),
		outputs,
	};
}

/** Called by this spec to create one production-shaped shared-cache contract graph. */
function createFixture() {
	const codecProfile = {
		schemaId: DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID,
		id: 'algorithm32-distant-sun-shared-cache-zstandard-level-6-v1',
		compression: 'zstandard',
		level: 6,
		shuffle: 'float32-byte-lane-v1',
		decodedScalar: 'float32-little-endian',
		implementation: {id: 'zstd-test', version: '1.0.0', sha256: hash(1)},
	};
	const configurationIdentity = hash(2);
	const configuration = {
		schemaId: DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID,
		configurationIdentity,
		atmosphereIdentity: 'algorithm32-atmosphere:test',
		geometryIdentity: 'algorithm32-spherical-geometry:test',
		groundIdentity: 'algorithm32-ground:test',
		numericalIdentity: 'algorithm32-native48-z180-w27-f68-native15-n4-q30:test',
		directionLayout: {
			id: 'algorithm32-distant-sun-w27-exact-seam-u16-v1',
			uniqueDirectionCount: 4058,
			logicalDirectionCount: 4374,
			logicalToUniqueIndex: {path: 'direction/logical-to-unique.u16', byteLength: 8748, sha256: hash(3)},
		},
		spectralLayout: {id: 'Native15', channelCount: 15, order: 'wavelength-major', scalar: 'float32-little-endian'},
		coordinateDomains: {
			altitude: {firstIndex: 0, count: 48},
			solarZenith: {firstIndex: 0, count: 180, binWidthDegrees: 1},
		},
		blockGrid: {
			altitudeCount: 8,
			solarZenithCount: 8,
			coordinateOrder: 'altitude-then-solar-zenith',
			payloadOrder: 'wavelength-then-coordinate-then-direction',
			omitUnpopulatedCoordinates: true,
		},
		codecProfile,
		blockIndex: {path: 'indexes/blocks.json', byteLength: 1, sha256: hash(4)},
	};
	const sceneSun = {
		id: 'solar-zenith-090-degrees',
		instant: '2024-06-21T03:26:03.503Z',
		directionToSourceUpEastNorth: [0, -1, 0],
		sourceIdentity: 'algorithm32-native-distant-collimated-sun-v1',
	};
	const ledger = new DistantSunSceneCacheLedger({
		sceneSun,
		support: {
			id: 'shared-cache-format-test-support',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 2, units: 'meters'},
			observerSolarZenith: {value: Math.PI / 2, units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
		positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
		solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
		outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	});
	const coordinates = ledger.rows.flatMap((row) =>
		Array.from({length: row.packedRowCount}, (_unused, offset) => [
			row.altitudeIndex,
			row.firstSolarZenithIndex + offset,
		]),
	);
	const grouped = new Map();
	for (const coordinate of coordinates) {
		const altitudeTile = Math.floor(coordinate[0] / 8) * 8;
		const solarZenithTile = Math.floor(coordinate[1] / 8) * 8;
		const key = `${altitudeTile}:${solarZenithTile}`;
		if (!grouped.has(key)) grouped.set(key, {altitudeTile, solarZenithTile, coordinates: []});
		grouped.get(key).coordinates.push(coordinate);
	}
	const blocks = [...grouped.values()]
		.sort(
			(left, right) =>
				left.altitudeTile * 180 + left.solarZenithTile - (right.altitudeTile * 180 + right.solarZenithTile),
		)
		.map((group, blockOrdinal) => {
			const decodedSha256 = hash(100 + blockOrdinal * 5);
			const encodedSha256 = hash(101 + blockOrdinal * 5);
			const decodedByteLength = group.coordinates.length * DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH;
			const encodedByteLength = Math.max(1, Math.floor(decodedByteLength / 2));
			return {
				id: `algorithm32-distant-sun-shared-block:${configurationIdentity}:a${String(group.altitudeTile).padStart(2, '0')}:z${String(group.solarZenithTile).padStart(3, '0')}`,
				tile: {altitudeIndex: group.altitudeTile, solarZenithIndex: group.solarZenithTile},
				rowCount: group.coordinates.length,
				coordinates: group.coordinates,
				decoded: {byteLength: decodedByteLength, sha256: decodedSha256},
				encoded: {
					path: `blocks/${encodedSha256}.zst`,
					byteLength: encodedByteLength,
					sha256: encodedSha256,
				},
				codecProfileId: codecProfile.id,
				shuffle: 'float32-byte-lane-v1',
				derivation: derivation(
					[
						{role: 'decoded-block', byteLength: decodedByteLength, sha256: decodedSha256},
						{role: 'encoded-block', byteLength: encodedByteLength, sha256: encodedSha256},
					],
					2000 + blockOrdinal * 4,
				),
			};
		});
	const blockIndex = {
		schemaId: DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID,
		configurationIdentity,
		rowByteLength: DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH,
		distinctCoordinateCount: coordinates.length,
		blocks,
	};
	const coordinateOwners = new Map();
	for (const block of blocks)
		for (const coordinate of block.coordinates) coordinateOwners.set(coordinate.join(':'), block.id);
	const requiredBlockIds = [];
	const seenBlockIds = new Set();
	for (const coordinate of coordinates) {
		const blockId = coordinateOwners.get(coordinate.join(':'));
		if (!seenBlockIds.has(blockId)) {
			seenBlockIds.add(blockId);
			requiredBlockIds.push(blockId);
		}
	}
	const reconstructedSha256 = hash(5);
	const reconstructedByteLength = coordinates.length * DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH;
	const scene = {
		schemaId: DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID,
		id: 'solar-zenith-090-degrees',
		representativeSolarZenithDegrees: 90,
		selection: {
			representativeSolarZenithDegrees: 90,
			minimumInputDegrees: 89.5,
			maximumInputExclusiveDegrees: 90.5,
		},
		sceneSun,
		compatibility: {
			configurationIdentity,
			atmosphereIdentity: configuration.atmosphereIdentity,
			geometryIdentity: configuration.geometryIdentity,
			groundIdentity: configuration.groundIdentity,
			numericalIdentity: configuration.numericalIdentity,
		},
		ledger: ledger.toRecord(),
		coordinates,
		requiredBlockIds,
		reconstructedPayload: {byteLength: reconstructedByteLength, sha256: reconstructedSha256},
		derivation: derivation(
			[{role: 'reconstructed-scene', byteLength: reconstructedByteLength, sha256: reconstructedSha256}],
			6,
		),
	};
	const catalog = {
		schemaId: DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID,
		configurationIdentity,
		selection: {
			kind: 'ledger-covered-nearest-integer-half-up-v1',
			darkFromSolarZenithDegrees: 108,
			startSolarZenithDegrees: 0,
			endSolarZenithDegrees: 108,
			incrementDegrees: 1,
			minimumInputDegrees: 0,
			maximumInputExclusiveDegrees: 108,
		},
		scenes: Array.from({length: 109}, (_unused, sceneOrdinal) => ({
			id: `solar-zenith-${String(sceneOrdinal).padStart(3, '0')}-degrees`,
			representativeSolarZenithDegrees: sceneOrdinal,
			manifest: {
				path: `scenes/scene-${String(sceneOrdinal).padStart(3, '0')}-${hash(10000 + sceneOrdinal)}.json`,
				byteLength: 1,
				sha256: hash(10000 + sceneOrdinal),
			},
		})),
	};
	const packageSet = {
		schemaId: DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID,
		packageSetIdentity: hash(7),
		derivation: derivation([{role: 'package-set', byteLength: 1, sha256: hash(7)}], 8),
		generator: {id: 'algorithm32-shared-cache-generator', version: '1.0.0', sha256: hash(9)},
		codecProfile,
		configurations: [{path: 'configurations/native.json', byteLength: 1, sha256: hash(10)}],
		runtimeCatalog: {path: 'catalog/runtime.json', byteLength: 1, sha256: hash(11)},
	};
	return {codecProfile, packageSet, catalog, configuration, blockIndex, scene};
}
