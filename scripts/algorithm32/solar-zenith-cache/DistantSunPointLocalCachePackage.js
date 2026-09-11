import DistantSunSharedCacheGenerationCodec from './DistantSunSharedCacheGenerationCodec.js';

export const DISTANT_SUN_POINT_LOCAL_CACHE_SCHEMA_ID = 'algorithm32-point-local-shared-cache-v1';

/** Production package writer for one complete variable point-local shared inventory. */
export default class DistantSunPointLocalCachePackage {
	/**
	 * Encode bounded staging blocks and publish a self-describing indexed cache manifest.
	 * @param {DistantSunPointLocalPackageWriteRequest} options - Complete staging, derivation, and output boundary.
	 */
	async write({files, root, stagingRoot, inventory, implementation, gpu, signal, progress = async (_event) => {}}) {
		for (const folder of ['blocks', 'direction']) await files.directory(`${root}/${folder}`);
		const codec = new DistantSunSharedCacheGenerationCodec();
		const blocks = [];
		for (const [index, block] of inventory.blocks.entries()) {
			signal.throwIfAborted();
			const stagingPath = `${stagingRoot}/block-${String(index).padStart(3, '0')}.f32`;
			const expectedByteLength =
				block.coordinates.length *
				inventory.channelCount *
				inventory.uniqueDirectionCount *
				Float32Array.BYTES_PER_ELEMENT;
			const decoded = await files.read(stagingPath, null, inventory.maximumDecodedBlockBytes);
			if (decoded.byteLength !== expectedByteLength) {
				throw new RangeError('Point-local staging block length differs from its serialized dimensions.');
			}
			const encoded = codec.encode(decoded);
			if (encoded.byteLength > inventory.maximumEncodedBlockBytes) {
				throw new RangeError('Point-local encoded block exceeds its production byte bound.');
			}
			const encodedHash = files.hash(encoded);
			const artifact = await files.write(
				`${root}/blocks/${String(index).padStart(3, '0')}-${encodedHash}.zst`,
				encoded,
			);
			blocks.push({
				ordinal: index,
				tile: block.tile,
				coordinates: block.coordinates,
				decoded: {byteLength: decoded.byteLength, sha256: files.hash(decoded)},
				encoded: artifact,
				codec: 'float32-byte-lane-v1+zstandard-level-6',
			});
			await progress({phase: 'package-block', completed: index + 1, total: inventory.blocks.length});
		}
		const directionMap = await files.write(`${root}/direction/logical-to-unique.u16`, inventory.directionBytes);
		const record = {
			schemaId: DISTANT_SUN_POINT_LOCAL_CACHE_SCHEMA_ID,
			compilerIdentity: implementation.id,
			implementation,
			buildRequest: inventory.buildRequest,
			physicalQuantity: {
				name: 'cumulative spectral scattering density through J4',
				units: 'W m^-3 sr^-1 nm^-1',
				spectralBasisId: inventory.buildRequest.transportSpec.domains.spectrum.id,
			},
			layout: {
				id: 'point-local-block-wavelength-coordinate-unique-direction-f32le-v1',
				channelCount: inventory.channelCount,
				wavelengthIndexes: inventory.wavelengths,
				logicalDirectionCount: inventory.logicalDirectionCount,
				uniqueDirectionCount: inventory.uniqueDirectionCount,
				coordinateCount: inventory.coordinates.length,
				maximumDecodedBlockBytes: inventory.maximumDecodedBlockBytes,
				maximumEncodedBlockBytes: inventory.maximumEncodedBlockBytes,
			},
			coordinates: inventory.coordinates,
			scenes: inventory.scenes,
			blocks,
			directionMap,
			gpu,
			derivation: {
				operation:
					'one receiver-local full-domain cumulative J4 recurrence per selected wavelength; interpolation-closed scene union extraction; exact W27 seam collapse; bounded block encoding',
				inputs: {
					buildRequestSha256: files.hash(JSON.stringify(inventory.buildRequest)),
					sceneRequestsSha256: files.hash(JSON.stringify(inventory.scenes.map((scene) => scene.request))),
				},
			},
		};
		const packet = {...record, packageIdentity: `sha256:${files.hash(JSON.stringify(record))}`};
		const manifest = await files.write(`${root}/cache.json`, Buffer.from(`${JSON.stringify(packet)}\n`));
		return {packet, manifest};
	}
}
