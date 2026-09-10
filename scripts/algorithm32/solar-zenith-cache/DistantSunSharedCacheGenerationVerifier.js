import {createHash} from 'node:crypto';
import {open} from 'node:fs/promises';
import DistantSunSharedCacheGenerationCodec from './DistantSunSharedCacheGenerationCodec.js';
import DistantSunSharedCacheGenerationGraph from './DistantSunSharedCacheGenerationGraph.js';

/** Persisted-block control-payload reconstruction verifier. */
export default class DistantSunSharedCacheGenerationVerifier {
	/**
	 * Reads an exact bounded range and rejects truncation.
	 *
	 * @param {SharedGenerationFileHandle} handle - Read-only source.
	 * @param {Buffer} bytes - Caller-owned bounded destination.
	 * @param {number} position - Absolute file offset.
	 * @returns {Promise<void>} - Completion after the range is full.
	 */
	async _read(handle, bytes, position) {
		let offset = 0;
		while (offset < bytes.byteLength) {
			const result = await handle.read(bytes, offset, bytes.byteLength - offset, position + offset);
			if (result.bytesRead === 0) throw new Error('An immutable reconstruction input was truncated.');
			offset += result.bytesRead;
		}
	}
	/**
	 * Call this method to verify encoded artifacts and stream all 109 exact control comparisons.
	 * Metadata, block, or control mismatch, I/O failure, or cancellation rejects; callers must not publish the candidate.
	 *
	 * @param {SharedGenerationVerificationRequest} options - Candidate, staging, immutable controls, and cancellation.
	 * @returns {Promise<SharedGenerationVerificationResult>} - Per-scene exactness and bounded-memory evidence.
	 */
	async verify(options) {
		const {files, inventory, candidate, candidateRoot, stagingRoot, signal, progress} = options;
		const handles = [];
		const owners = new Map();
		const codec = new DistantSunSharedCacheGenerationCodec();
		const started = performance.now();
		const graph = await new DistantSunSharedCacheGenerationGraph().read({
			files,
			candidateRoot,
			reportArtifact: candidate.reportArtifact,
			signal,
		});
		try {
			for (const [ordinal, block] of graph.blockIndex.blocks.entries()) {
				signal.throwIfAborted();
				const encoded = await files.read(`${candidateRoot}/${block.encoded.path}`, block.encoded);
				const decoded = codec.decode(encoded, block.decoded.byteLength);
				if (files.hash(decoded) !== block.decoded.sha256)
					throw new Error('Persisted block decoded identity is incompatible.');
				const stagingPath = `${stagingRoot}/block-${String(ordinal).padStart(3, '0')}.f32`;
				const staged = await files.read(stagingPath, {...block.decoded, path: stagingPath});
				if (!decoded.equals(staged)) throw new Error('Persisted encoded block differs from verified staging.');
				const handle = await open(await files.resolve(stagingPath), 'r');
				handles.push(handle);
				for (const [row, coordinate] of block.coordinates.entries()) {
					const key = coordinate.join(':');
					if (owners.has(key)) throw new Error('Persisted block index duplicates a coordinate.');
					owners.set(key, {handle, row, count: block.rowCount});
				}
			}
			const blockVerificationMilliseconds = performance.now() - started;
			const rowBytes = 4058 * 4;
			const actualRow = Buffer.alloc(rowBytes);
			const expectedRow = Buffer.alloc(rowBytes);
			const scenes = [];
			let comparedBytes = 0;
			for (const source of inventory.scenes) {
				signal.throwIfAborted();
				const persistedScene = graph.scenes[source.ordinal];
				if (
					persistedScene.id !== source.manifest.sceneSun.id ||
					persistedScene.reconstructedPayload.sha256 !== source.manifest.exactSeamPayload.sha256 ||
					persistedScene.reconstructedPayload.byteLength !== source.manifest.exactSeamPayload.byteLength
				)
					throw new Error('Persisted scene reconstruction identity differs from the immutable control.');
				const expected = await open(
					await files.resolve(`${source.base}/${source.manifest.exactSeamPayload.path}`),
					'r',
				);
				const actualHash = createHash('sha256');
				const expectedHash = createHash('sha256');
				try {
					if ((await expected.stat()).size !== source.manifest.exactSeamPayload.byteLength)
						throw new Error('Control payload length changed.');
					for (let channel = 0; channel < 15; channel += 1)
						for (let row = 0; row < source.coordinates.length; row += 1) {
							const owner = owners.get(source.coordinates[row]);
							if (!owner) throw new Error('Persisted block index omits a control coordinate.');
							await this._read(owner.handle, actualRow, (channel * owner.count + owner.row) * rowBytes);
							await this._read(
								expected,
								expectedRow,
								(channel * source.coordinates.length + row) * rowBytes,
							);
							if (!actualRow.equals(expectedRow))
								throw new Error(
									`Shared reconstruction differs at scene ${source.ordinal}, wavelength ${channel}, coordinate ${source.coordinates[row]}.`,
								);
							actualHash.update(actualRow);
							expectedHash.update(expectedRow);
							comparedBytes += rowBytes;
						}
				} finally {
					await expected.close();
				}
				const sha256 = actualHash.digest('hex');
				if (sha256 !== expectedHash.digest('hex') || sha256 !== source.manifest.exactSeamPayload.sha256)
					throw new Error('Control reconstruction digest differs from its immutable identity.');
				scenes.push({
					id: source.manifest.sceneSun.id,
					byteLength: source.manifest.exactSeamPayload.byteLength,
					sha256,
					exact: true,
				});
				await progress({phase: 'reconstruction', completed: scenes.length, total: inventory.scenes.length});
			}
			return {
				accepted: true,
				scenes,
				comparedBytes,
				blockVerificationMilliseconds,
				elapsedMilliseconds: performance.now() - started,
				comparisonBufferBytes: actualRow.byteLength + expectedRow.byteLength,
				metadataArtifactCount: graph.metadataArtifactCount,
				metadataBytes: graph.metadataBytes,
			};
		} finally {
			await Promise.all(handles.map((handle) => handle.close()));
		}
	}
}
