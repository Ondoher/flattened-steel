import {open} from 'node:fs/promises';
import DistantSunSharedCacheGenerationCodec from './DistantSunSharedCacheGenerationCodec.js';
import {
	DISTANT_SUN_POINT_LOCAL_MAXIMUM_DECODED_BLOCK_BYTES,
	DISTANT_SUN_POINT_LOCAL_MAXIMUM_ENCODED_BLOCK_BYTES,
} from './DistantSunPointLocalCacheInventory.js';
import {DISTANT_SUN_POINT_LOCAL_CACHE_SCHEMA_ID} from './DistantSunPointLocalCachePackage.js';

/** Bounded reader and exact scene expander for the production point-local package. */
export default class DistantSunPointLocalCacheReader {
	/** @type {Map<string, DistantSunSharedCacheFileIdentity>} */ _decoded = new Map();

	_accept(files, packet) {
		if (!packet || packet.schemaId !== DISTANT_SUN_POINT_LOCAL_CACHE_SCHEMA_ID) {
			throw new RangeError('Point-local cache schema is incompatible.');
		}
		const {packageIdentity, ...record} = packet;
		if (packageIdentity !== `sha256:${files.hash(JSON.stringify(record))}`) {
			throw new RangeError('Point-local cache identity does not cover its serialized record.');
		}
		const layout = packet.layout;
		if (
			!Number.isInteger(layout.channelCount) ||
			layout.channelCount < 1 ||
			layout.channelCount !== layout.wavelengthIndexes.length ||
			!Number.isInteger(layout.coordinateCount) ||
			layout.coordinateCount !== packet.coordinates.length ||
			!Number.isInteger(layout.logicalDirectionCount) ||
			!Number.isInteger(layout.uniqueDirectionCount) ||
			layout.uniqueDirectionCount < 1 ||
			layout.uniqueDirectionCount > layout.logicalDirectionCount ||
			!Number.isInteger(layout.maximumDecodedBlockBytes) ||
			layout.maximumDecodedBlockBytes < 1 ||
			layout.maximumDecodedBlockBytes > DISTANT_SUN_POINT_LOCAL_MAXIMUM_DECODED_BLOCK_BYTES ||
			!Number.isInteger(layout.maximumEncodedBlockBytes) ||
			layout.maximumEncodedBlockBytes < 1 ||
			layout.maximumEncodedBlockBytes > DISTANT_SUN_POINT_LOCAL_MAXIMUM_ENCODED_BLOCK_BYTES
		) {
			throw new RangeError('Point-local cache dimensions are inconsistent.');
		}
		const owners = new Set();
		for (const [index, block] of packet.blocks.entries()) {
			if (block.ordinal !== index || block.coordinates.length === 0) {
				throw new RangeError('Point-local cache block order is inconsistent.');
			}
			const expected =
				block.coordinates.length *
				layout.channelCount *
				layout.uniqueDirectionCount *
				Float32Array.BYTES_PER_ELEMENT;
			if (
				block.decoded.byteLength !== expected ||
				expected > layout.maximumDecodedBlockBytes ||
				block.encoded.byteLength > layout.maximumEncodedBlockBytes
			) {
				throw new RangeError('Point-local cache block byte dimensions are inconsistent.');
			}
			for (const coordinate of block.coordinates) {
				const key = coordinate.join(':');
				if (owners.has(key)) throw new RangeError('Point-local cache coordinate has multiple block owners.');
				owners.add(key);
			}
		}
		if (
			owners.size !== packet.coordinates.length ||
			packet.coordinates.some((coordinate) => !owners.has(coordinate.join(':'))) ||
			packet.directionMap.byteLength !== layout.logicalDirectionCount * Uint16Array.BYTES_PER_ELEMENT
		) {
			throw new RangeError('Point-local cache block or direction coverage is incomplete.');
		}
		return packet;
	}

	/** Authenticate and reuse the compiler's decoded staging blocks without copying them. */
	async prepareStaging(files, packet, stagingRoot) {
		this._accept(files, packet);
		if (this._decoded.size) throw new Error('Point-local cache reader is already prepared.');
		for (const block of packet.blocks) {
			const path = `${stagingRoot}/block-${String(block.ordinal).padStart(3, '0')}.f32`;
			const expected = {path, ...block.decoded};
			await files.read(path, expected, packet.layout.maximumDecodedBlockBytes);
			this._decoded.set(block.decoded.sha256, expected);
		}
	}

	/** Decode and authenticate every block once into a caller-owned contained directory. */
	async prepare(files, packet, decodedRoot) {
		this._accept(files, packet);
		if (this._decoded.size) throw new Error('Point-local cache reader is already prepared.');
		await files.directory(decodedRoot);
		const codec = new DistantSunSharedCacheGenerationCodec();
		for (const block of packet.blocks) {
			const encoded = await files.read(block.encoded.path, block.encoded, packet.layout.maximumEncodedBlockBytes);
			const decoded = codec.decode(encoded, block.decoded.byteLength);
			if (files.hash(decoded) !== block.decoded.sha256)
				throw new Error('Point-local decoded block identity failed.');
			const artifact = await files.write(
				`${decodedRoot}/block-${String(block.ordinal).padStart(3, '0')}.f32`,
				decoded,
			);
			this._decoded.set(block.decoded.sha256, artifact);
		}
	}

	/** Read one selected package channel into canonical shared-coordinate order. */
	async readChannel(files, packet, channel) {
		this._accept(files, packet);
		if (!Number.isInteger(channel) || channel < 0 || channel >= packet.layout.channelCount) {
			throw new RangeError('Point-local cache channel is out of range.');
		}
		const rowBytes = packet.layout.uniqueDirectionCount * Float32Array.BYTES_PER_ELEMENT;
		const result = Buffer.alloc(packet.coordinates.length * rowBytes);
		const indexes = new Map(packet.coordinates.map((coordinate, index) => [coordinate.join(':'), index]));
		const seen = new Set();
		const codec = new DistantSunSharedCacheGenerationCodec();
		for (const block of packet.blocks) {
			const channelBytes = block.coordinates.length * rowBytes;
			let bytes;
			const decoded = this._decoded.get(block.decoded.sha256);
			if (decoded) {
				const handle = await open(await files.resolve(decoded.path), 'r');
				bytes = Buffer.alloc(channelBytes);
				try {
					let offset = 0;
					while (offset < bytes.length) {
						const read = await handle.read(
							bytes,
							offset,
							bytes.length - offset,
							channel * channelBytes + offset,
						);
						if (read.bytesRead === 0) throw new Error('Point-local decoded channel is truncated.');
						offset += read.bytesRead;
					}
				} finally {
					await handle.close();
				}
			} else {
				const encoded = await files.read(
					block.encoded.path,
					block.encoded,
					packet.layout.maximumEncodedBlockBytes,
				);
				const full = codec.decode(encoded, block.decoded.byteLength);
				if (files.hash(full) !== block.decoded.sha256)
					throw new Error('Point-local decoded block identity failed.');
				bytes = full.subarray(channel * channelBytes, (channel + 1) * channelBytes);
			}
			for (const [row, coordinate] of block.coordinates.entries()) {
				const index = indexes.get(coordinate.join(':'));
				if (index === undefined || seen.has(index))
					throw new RangeError('Point-local block coverage is invalid.');
				seen.add(index);
				bytes.copy(result, index * rowBytes, row * rowBytes, (row + 1) * rowBytes);
			}
		}
		if (seen.size !== packet.coordinates.length)
			throw new RangeError('Point-local channel coverage is incomplete.');
		return result;
	}

	/** Read and validate the serialized logical-to-unique direction map. */
	async readDirectionMap(files, packet) {
		this._accept(files, packet);
		const bytes = await files.read(packet.directionMap.path, packet.directionMap);
		for (let logical = 0; logical < packet.layout.logicalDirectionCount; logical += 1) {
			if (bytes.readUInt16LE(logical * 2) >= packet.layout.uniqueDirectionCount) {
				throw new RangeError('Point-local direction index is out of range.');
			}
		}
		return bytes;
	}

	/** Reconstruct one scene's dense logical rows without performing scattering calculations. */
	expand(files, packet, sceneIndex, channel, directions) {
		this._accept(files, packet);
		const scene = packet.scenes[sceneIndex];
		if (
			!scene ||
			directions.byteLength !== packet.layout.logicalDirectionCount * Uint16Array.BYTES_PER_ELEMENT ||
			channel.byteLength !== packet.layout.coordinateCount * packet.layout.uniqueDirectionCount * 4
		) {
			throw new RangeError('Point-local scene expansion input shape is incompatible.');
		}
		const values = new Float32Array(scene.indexes.length * packet.layout.logicalDirectionCount);
		const words = new Uint32Array(values.buffer);
		for (const [row, index] of scene.indexes.entries()) {
			if (
				!Number.isInteger(index) ||
				index < 0 ||
				index >= packet.coordinates.length ||
				packet.coordinates[index].join(':') !== scene.keys[row]
			) {
				throw new RangeError('Point-local scene reconstruction index is incompatible.');
			}
			for (let logical = 0; logical < packet.layout.logicalDirectionCount; logical += 1) {
				const unique = directions.readUInt16LE(logical * Uint16Array.BYTES_PER_ELEMENT);
				if (unique >= packet.layout.uniqueDirectionCount)
					throw new RangeError('Point-local direction index is out of range.');
				words[row * packet.layout.logicalDirectionCount + logical] = channel.readUInt32LE(
					(index * packet.layout.uniqueDirectionCount + unique) * Float32Array.BYTES_PER_ELEMENT,
				);
			}
		}
		return values;
	}
}
