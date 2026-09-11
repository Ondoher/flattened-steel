import Codec from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationCodec.js';
import {open} from 'node:fs/promises';

/** Bounded production-codec packaging and exact indexed scene expansion.
 * @implements {BuilderPackageReader}
 */
export default class CachePackage {
	/** Decoded block identities owned by the current qualification run. */
	_decoded = new Map();

	/** Call this method to authenticate and decode each shared block once for repeated channel reads.
	 * Derivatives remain in the new run; source packages are never changed.
	 * @param {BuilderRun} run - Current evidence owner.
	 * @param {BuilderPackage} packet - Complete shared package.
	 * @returns {Promise<void>} - Completion after bounded decoded blocks are persisted and identified.
	 */
	async prepare(run, packet) {
		if (packet.blocks.every((block) => this._decoded.has(block.decodedSha256))) return;
		if (this._decoded.size) throw new Error('Reader is only partially prepared.');
		for (const [index, block] of packet.blocks.entries()) {
			const bytes = new Codec().decode(await run.read(block.artifact.path, block.artifact), block.decodedBytes);
			if (run.files.hash(bytes) !== block.decodedSha256) throw new Error('Decoded block mismatch.');
			const artifact = await run.write(`decoded-${String(index).padStart(3, '0')}.f32`, bytes);
			this._decoded.set(block.decodedSha256, artifact);
		}
	}

	/** Call this method to authenticate and reuse a prior run's decoded staging blocks without copying them.
	 * The sealed package supplies each expected decoded identity; the prior run remains read-only.
	 * @param {BuilderRun} run - Current evidence owner.
	 * @param {BuilderPackage} packet - Complete shared package.
	 * @param {string} sourceRoot - Prior immutable run root containing staging blocks.
	 * @returns {Promise<void>} - Completion after all decoded identities are authenticated.
	 */
	async prepareStaging(run, packet, sourceRoot) {
		if (this._decoded.size) throw new Error('Reader already prepared.');
		for (const [index, block] of packet.blocks.entries()) {
			const path = `${sourceRoot}/staging/block-${String(index).padStart(3, '0')}.f32`;
			const expected = {path, byteLength: block.decodedBytes, sha256: block.decodedSha256};
			await run.read(path, expected, block.decodedBytes);
			this._decoded.set(block.decodedSha256, expected);
		}
	}
	/** Call this method to encode completed staging blocks with explicit domains and spectral selection.
	 * @param {BuilderRun} run - Current evidence owner.
	 * @param {BuilderInventory} inventory - Complete shared inventory.
	 * @returns {Promise<BuilderPackage>} - Written package metadata and authenticated blocks.
	 */
	async write(run, inventory) {
		const codec = new Codec();
		const blocks = [];
		for (const [index, block] of inventory.blocks.entries()) {
			const name = `block-${String(index).padStart(3, '0')}`;
			const stagingPath = `${run.root}/staging/${name}.f32`;
			const bytes = await run.files.read(stagingPath);
			const expected = block.coordinates.length * inventory.channelCount * inventory.uniqueCount * 4;
			if (bytes.length !== expected) throw new Error('Staging shape mismatch.');
			const decodedSha256 = run.files.hash(bytes);
			const encoded = codec.encode(bytes);
			const artifact = await run.write(`${name}.zst`, encoded);
			blocks.push({
				coordinates: block.coordinates,
				artifact,
				decodedBytes: bytes.length,
				decodedSha256,
			});
			this._decoded.set(decodedSha256, {path: stagingPath, byteLength: bytes.length, sha256: decodedSha256});
		}
		const directionMap = await run.write('directions.u16', inventory.directionBytes);
		const result = {
			schemaId: 'point-local-builder-cache-v1',
			buildRequest: inventory.buildRequest,
			wavelengths: inventory.wavelengths,
			channelCount: inventory.channelCount,
			directionCount: inventory.directionCount,
			uniqueCount: inventory.uniqueCount,
			coordinates: inventory.coordinates,
			scenes: inventory.scenes,
			blocks,
			directionMap,
			layout: 'block[channel][coordinate][unique-direction]',
			quantity: 'spectral scattering density',
			units: 'W m^-3 sr^-1 nm^-1',
			derivation: {
				operation:
					'production point-local N4 recurrence; exact direction seam collapse; indexed union; byte-lane shuffle and Zstandard level 6',
				parents: [...run.parents.values()],
			},
		};
		const manifest = await run.write('cache.json', result);
		return JSON.parse((await run.files.read(manifest.path, manifest)).toString('utf8'));
	}

	/** Call this method to decode one complete spectral inventory under per-block bounds.
	 * Corrupt blocks, missing coverage, or invalid channel selections reject before expansion.
	 * @param {CacheReuseRun} run - Authenticated input reader.
	 * @param {BuilderPackage} packet - Package metadata.
	 * @param {number} channel - Materialized channel ordinal.
	 * @returns {Promise<Buffer>} - Unique-direction Float32 rows in inventory order.
	 */
	async readChannel(run, packet, channel) {
		if (
			packet.schemaId !== 'point-local-builder-cache-v1' ||
			!Number.isInteger(channel) ||
			channel < 0 ||
			channel >= packet.channelCount
		)
			throw new Error('Invalid cache channel.');
		const rowBytes = packet.uniqueCount * 4;
		const result = Buffer.alloc(packet.coordinates.length * rowBytes);
		const indexes = new Map(packet.coordinates.map((coordinate, index) => [coordinate.join(':'), index]));
		const seen = new Set();
		for (const block of packet.blocks) {
			const channelBytes = block.coordinates.length * rowBytes;
			if (block.decodedBytes !== packet.channelCount * channelBytes) throw new Error('Decoded shape mismatch.');
			let bytes;
			const decoded = this._decoded.get(block.decodedSha256);
			if (decoded) {
				const handle = await open(await run.files.resolve(decoded.path), 'r');
				bytes = Buffer.alloc(channelBytes);
				try {
					let offset = 0;
					while (offset < bytes.length) {
						const result = await handle.read(
							bytes,
							offset,
							bytes.length - offset,
							channel * channelBytes + offset,
						);
						if (!result.bytesRead) throw new Error('Decoded channel truncated.');
						offset += result.bytesRead;
					}
				} finally {
					await handle.close();
				}
			} else {
				const full = new Codec().decode(
					await run.read(block.artifact.path, block.artifact),
					block.decodedBytes,
				);
				if (run.files.hash(full) !== block.decodedSha256) throw new Error('Decoded block mismatch.');
				bytes = full.subarray(channel * channelBytes, (channel + 1) * channelBytes);
			}
			for (const [row, coordinate] of block.coordinates.entries()) {
				const index = indexes.get(coordinate.join(':'));
				if (index === undefined || seen.has(index)) throw new Error('Invalid block coverage.');
				seen.add(index);
				const offset = row * rowBytes;
				bytes.copy(result, index * rowBytes, offset, offset + rowBytes);
			}
		}
		if (seen.size !== packet.coordinates.length) throw new Error('Incomplete cache inventory.');
		return result;
	}

	/** Call this method to reconstruct a scene from shared rows and exact direction indexes.
	 * Invalid mapping or buffer lengths reject; this operation performs no scattering calculations.
	 * @param {BuilderPackage} packet - Validated package metadata.
	 * @param {number} sceneIndex - Scene position in the input list.
	 * @param {Buffer} channel - Complete unique-direction inventory for one channel.
	 * @param {Buffer} directions - Authenticated logical-to-unique direction mapping.
	 * @returns {Float32Array} - Dense logical scene values in production packed-row order.
	 */
	expand(packet, sceneIndex, channel, directions) {
		const scene = packet.scenes[sceneIndex];
		if (
			!scene ||
			directions.length !== packet.directionCount * 2 ||
			channel.length !== packet.coordinates.length * packet.uniqueCount * 4
		)
			throw new Error('Expansion input shape mismatch.');
		const values = new Float32Array(scene.indexes.length * packet.directionCount);
		const words = new Uint32Array(values.buffer);
		for (const [row, index] of scene.indexes.entries()) {
			if (
				!Number.isInteger(index) ||
				index < 0 ||
				index >= packet.coordinates.length ||
				packet.coordinates[index].join(':') !== scene.keys[row]
			)
				throw new Error('Invalid scene index.');
			for (let logical = 0; logical < packet.directionCount; logical++) {
				const unique = directions.readUInt16LE(logical * 2);
				if (unique >= packet.uniqueCount) throw new Error('Invalid direction index.');
				words[row * packet.directionCount + logical] = channel.readUInt32LE(
					(index * packet.uniqueCount + unique) * 4,
				);
			}
		}
		return values;
	}
}
