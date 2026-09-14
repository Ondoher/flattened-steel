import DistantSunSceneCacheManifest from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheManifest.js';
import DistantSunSceneCacheLedger from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCacheLedger.js';
import {
	NATIVE_48_POSITION_DOMAIN_OWNER,
	SOLAR_ZENITH_180_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from '../../../src/algorithm32/sampling-domains/index.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';
import {SHARED_GENERATION_CONTROL_ROOT, SHARED_GENERATION_CONTROL_CATALOG_SHA256} from './consts.js';

/** Immutable-control authenticator and common-coordinate-ledger builder. */
export default class DistantSunSharedCacheGenerationInventory {
	/**
	 * Call this method to load all control metadata and derive the exact 8x8 union.
	 * Missing, corrupt, incompatible, or incomplete control data rejects; callers must stop before generation.
	 *
	 * @param {SharedGenerationFiles} files - Repository-contained artifact reader.
	 * @param {DistantSunSceneCacheCompilerOptions} [options] - Explicit candidate policy and lookup support.
	 * @returns {Promise<SharedGenerationInventory>} - Validated control and common field request.
	 */
	async load(files, options = {}) {
		const root = SHARED_GENERATION_CONTROL_ROOT;
		const catalogPath = `${root}/distant-sun-runtime-catalog-${SHARED_GENERATION_CONTROL_CATALOG_SHA256}.json`;
		const catalogBytes = await files.read(catalogPath);
		if (files.hash(catalogBytes) !== SHARED_GENERATION_CONTROL_CATALOG_SHA256)
			throw new Error('The production control catalog identity changed.');
		const catalog = JSON.parse(catalogBytes.toString('utf8'));
		if (
			catalog.schemaId !== 'algorithm32-distant-sun-runtime-catalog-v1' ||
			catalog.accepted !== true ||
			catalog.packages.length !== 109
		)
			throw new Error('The production control catalog is incompatible.');
		const scenes = [];
		const coordinates = new Map();
		/** @type {Buffer | null} */
		let directionBytes = null;
		for (const [ordinal, entry] of catalog.packages.entries()) {
			if (
				entry.representativeSolarZenithDegrees !== ordinal ||
				entry.id !== `solar-zenith-${String(ordinal).padStart(3, '0')}-degrees`
			)
				throw new Error('Control scenes are not canonically ordered.');
			const base = `${root}/${entry.assetPath.replace(/\/$/u, '')}`;
			const manifestBytes = await files.read(`${base}/${entry.manifestPath}`);
			if (files.hash(manifestBytes) !== entry.manifestSha256)
				throw new Error('Control manifest authentication failed.');
			const manifest = new DistantSunSceneCacheManifest(JSON.parse(manifestBytes.toString('utf8'))).record;
			if (
				manifest.cacheIdentity !== entry.cacheIdentity ||
				manifest.selection.representativeSolarZenithDegrees !== ordinal
			)
				throw new Error('Control manifest selection is incompatible.');
			const ledgerBytes = await files.read(`${base}/${manifest.ledgerPath}`);
			if (files.hash(ledgerBytes) !== manifest.ledgerSha256)
				throw new Error('Control ledger authentication failed.');
			const ledger = DistantSunSceneCacheLedger.fromRecord(JSON.parse(ledgerBytes.toString('utf8')), {
				positionDomain: NATIVE_48_POSITION_DOMAIN_OWNER,
				solarZenithDomain: SOLAR_ZENITH_180_DOMAIN_OWNER,
				outgoingDirectionDomain: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
				spectralBasis: NATIVE_15_SPECTRAL_BASIS,
			}).toRecord();
			if (manifest.exactSeamPayload.byteLength !== ledger.retainedBlockCount * 4058 * 15 * 4)
				throw new Error('Control spectral length is incompatible.');
			const indexBytes = await files.read(
				`${base}/${manifest.logicalToUniqueIndex.path}`,
				manifest.logicalToUniqueIndex,
			);
			if (directionBytes === null) directionBytes = indexBytes;
			else if (!directionBytes.equals(indexBytes)) throw new Error('Control scenes disagree about exact seams.');
			const sceneCoordinates = [];
			for (const row of ledger.rows)
				for (let z = row.firstSolarZenithIndex; z <= row.lastSolarZenithIndex; z += 1) {
					const key = `${row.altitudeIndex}:${z}`;
					sceneCoordinates.push(key);
					coordinates.set(key, [row.altitudeIndex, z]);
				}
			scenes.push({
				ordinal,
				base,
				manifest,
				ledger,
				coordinates: sceneCoordinates,
				manifestArtifact: {
					path: `${base}/${entry.manifestPath}`,
					byteLength: manifestBytes.byteLength,
					sha256: entry.manifestSha256,
				},
			});
		}
		const ordered = [...coordinates.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		if (ordered.length !== 5494) throw new Error('The control union differs from the accepted 5494 coordinates.');
		if (options.solarInterpolation === 'monotone-cubic') {
			for (const scene of scenes)
				for (const row of scene.ledger.rows) {
					for (
						let zenith = Math.max(0, row.firstSolarZenithIndex - 1);
						zenith <= Math.min(SOLAR_ZENITH_180_DOMAIN_OWNER.count - 1, row.lastSolarZenithIndex + 1);
						zenith++
					) {
						coordinates.set(`${row.altitudeIndex}:${zenith}`, [row.altitudeIndex, zenith]);
					}
				}
			ordered.splice(
				0,
				ordered.length,
				...[...coordinates.values()].sort((left, right) => left[0] - right[0] || left[1] - right[1]),
			);
		}
		const groups = new Map();
		for (const [a, z] of ordered) {
			const altitudeIndex = Math.floor(a / 8) * 8;
			const solarZenithIndex = Math.floor(z / 8) * 8;
			const key = `${altitudeIndex}:${solarZenithIndex}`;
			if (!groups.has(key)) groups.set(key, {tile: {altitudeIndex, solarZenithIndex}, coordinates: []});
			groups.get(key).coordinates.push([a, z]);
		}
		const blocks = [...groups.values()].sort(
			(a, b) => a.tile.altitudeIndex - b.tile.altitudeIndex || a.tile.solarZenithIndex - b.tile.solarZenithIndex,
		);
		if (options.solarInterpolation !== 'monotone-cubic' && blocks.length !== 89)
			throw new Error('The control union differs from the accepted 89 blocks.');
		let firstPackedRow = 0;
		const rows = scenes[0].ledger.rows.map((row) => {
			const values = ordered.filter((c) => c[0] === row.altitudeIndex).map((c) => c[1]);
			if (values.length !== values.at(-1) - values[0] + 1)
				throw new Error('The union requires a noncontiguous altitude span.');
			const result = {
				...row,
				firstSolarZenithIndex: values[0],
				lastSolarZenithIndex: values.at(-1),
				firstPackedRow,
				packedRowCount: values.length,
			};
			firstPackedRow += values.length;
			return result;
		});
		const unionLedger = {
			...scenes[0].ledger,
			rows,
			retainedBlockCount: ordered.length,
			oracleByteLength: ordered.length * 4374 * 15 * 4,
			exactSeamByteLength: ordered.length * 4058 * 15 * 4 + 8748,
		};
		const input = DistantSunSceneCacheCompilerInputs.createInputSet(
			{
				sceneSun: scenes[0].manifest.sceneSun,
				support: scenes[0].ledger.support,
			},
			options,
		);
		const buildRequest = {
			...input.buildRequest,
			transportSpec: {
				...input.buildRequest.transportSpec,
				shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'},
			},
		};
		return {
			scenes,
			coordinates: ordered,
			blocks,
			unionLedger,
			buildRequest,
			configuration: {
				atmosphereIdentity: buildRequest.transportSpec.atmosphere.id,
				geometryIdentity: buildRequest.transportSpec.planet.id,
				groundIdentity: buildRequest.transportSpec.ground.id,
				numericalIdentity: input.numericalIdentity,
			},
			directionBytes,
			catalogArtifact: {
				path: catalogPath,
				byteLength: catalogBytes.byteLength,
				sha256: SHARED_GENERATION_CONTROL_CATALOG_SHA256,
			},
		};
	}
}
