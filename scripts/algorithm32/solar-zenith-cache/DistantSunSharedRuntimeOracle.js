import {open} from 'node:fs/promises';
import Inventory from './DistantSunSharedCacheGenerationInventory.js';
import Graph from './DistantSunSharedCacheGenerationGraph.js';
import Codec from './DistantSunSharedCacheGenerationCodec.js';

/** Independent exact GPU probe values read from immutable dense control payloads. */
export default class DistantSunSharedRuntimeOracle {
	/** Call this method to authenticate parent metadata and construct coordinate ownership.
	 *
	 * @param {SharedGenerationFiles} files - Contained repository reader.
	 *
	 * @param {string} root - Immutable shared package parent.
	 *
	 * @param {DistantSunSharedCacheFileIdentity} report - Qualified report identity.
	 *
	 * @returns {Promise<DistantSunSharedRuntimeOracle>} - Prepared read-only oracle.
	 */
	async load(files, root, report, candidate = false) {
		this._files = files;
		this._candidateRoot = candidate ? root : undefined;
		this._inventory = await new Inventory().load(files);
		this._graph = await new Graph().read({
			files,
			candidateRoot: root,
			reportArtifact: report,
			signal: new AbortController().signal,
		});
		this._coordinates = new Map();
		for (const scene of this._inventory.scenes)
			for (const [row, key] of scene.coordinates.entries())
				if (!this._coordinates.has(key)) this._coordinates.set(key, {scene, row});
		return this;
	}

	/** Call this method to produce bounded first/last-row, face, edge, seam, and padding probes.
	 *
	 * @param {string} id - Authenticated shared block identity.
	 *
	 * @returns {Promise<SharedQualificationOracleBlock>} - Independent dense parents, addressing, and exact expected bits.
	 */
	async block(id) {
		const block = this._graph.blockIndex.blocks.find((item) => item.id === id);
		if (!block) throw new RangeError('Unknown oracle block.');
		const rows = [0, block.rowCount - 1];
		if (block.rowCount < 64) rows.push(block.rowCount);
		const samples = [],
			parents = [];
		let decoded;
		if (this._candidateRoot) {
			const artifact = {...block.encoded, path: `${this._candidateRoot}/${block.encoded.path}`};
			decoded = new Codec().decode(await this._files.read(artifact.path, artifact), block.decoded.byteLength);
			if (this._files.hash(decoded) !== block.decoded.sha256)
				throw new Error('Candidate oracle decoded hash mismatch.');
			parents.push({artifact, decoded: block.decoded});
		}
		for (const row of [...new Set(rows)]) {
			const channels = [];
			if (row < block.rowCount && decoded) {
				for (let channel = 0; channel < 15; channel++) {
					const start = (channel * block.rowCount + row) * 4058 * 4;
					channels.push(decoded.subarray(start, start + 4058 * 4));
				}
			} else if (row < block.rowCount) {
				const owner = this._coordinates.get(block.coordinates[row].join(':'));
				const artifact = {
					...owner.scene.manifest.exactSeamPayload,
					path: `${owner.scene.base}/${owner.scene.manifest.exactSeamPayload.path}`,
				};
				const handle = await open(await this._files.resolve(artifact.path), 'r');
				try {
					if ((await handle.stat()).size !== artifact.byteLength)
						throw new Error('Dense oracle parent length changed.');
					for (let channel = 0; channel < 15; channel++) {
						const bytes = Buffer.alloc(4058 * 4),
							offset = (channel * owner.scene.coordinates.length + owner.row) * bytes.length;
						if ((await handle.read(bytes, 0, bytes.length, offset)).bytesRead !== bytes.length)
							throw new Error('Dense oracle row truncated.');
						channels.push(bytes);
					}
					parents.push({
						row,
						coordinate: block.coordinates[row],
						artifact,
						denseRow: owner.row,
						denseRowCount: owner.scene.coordinates.length,
					});
				} finally {
					await handle.close();
				}
			}
			for (let face = 0; face < 6; face++)
				for (const [u, v] of [
					[0, 0],
					[26, 0],
					[0, 26],
					[26, 26],
					[13, 13],
					[0, 13],
					[26, 13],
					[13, 0],
					[13, 26],
				])
					for (let packet = 0; packet < 4; packet++) {
						const unique = this._inventory.directionBytes.readUInt16LE((face * 729 + v * 27 + u) * 2);
						const expected = Array.from({length: 4}, (_, component) => {
							const channel = packet * 4 + component;
							return row < block.rowCount && channel < 15
								? channels[channel].readUInt32LE(unique * 4)
								: 0;
						});
						samples.push({row, face, u, v, packet, expected});
					}
		}
		return {
			blockId: id,
			rowCount: block.rowCount,
			parents,
			samples,
			operation: this._candidateRoot
				? 'Authenticated candidate decode; Float32 bits at ((channel * blockRowCount + row) * 4058 + logicalToUnique[face*729+v*27+u]) * 4; padding and synthetic channel15 are zero'
				: 'dense Float32 bits at ((channel * denseRowCount + denseRow) * 4058 + logicalToUnique[face*729+v*27+u]) * 4; padding and synthetic channel15 are zero',
		};
	}
}
