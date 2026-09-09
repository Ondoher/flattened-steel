import {open} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Assemble one padded target ledger from exact fresh parent seam payloads. */
export default class E3UnionAssembler {
	/** @type {number} */ _rowByteLength;
	/** @type {number} */ _channelCount;

	/** @param {number} rowByteLength - Canonical unique-direction row length. @param {number} channelCount - Wavelength count. */
	constructor(rowByteLength, channelCount) {
		this._rowByteLength = rowByteLength;
		this._channelCount = channelCount;
	}

	/**
	 * Assemble a padded ledger into a newly created output file without retaining
	 * more than one copy range in memory.
	 *
	 * @param {string} targetPath - New run-local target seam path.
	 * @param {CacheOptimizationRowLedger} target - Target padded ledger.
	 * @param {readonly E3UnionSource[]} sources - Fresh parent seam sources.
	 * @param {number} centerDegrees - Selected target bin center.
	 * @returns {Promise<{sha256: string, byteLength: number, parentIds: readonly string[]}>} - Authenticated output identity.
	 */
	async assemble(targetPath, target, sources, centerDegrees) {
		const output = await open(targetPath, 'wx+');
		const handles = new Map();
		const rowSources = [];
		try {
			for (const row of target.rows) {
				for (let zenith = row.firstSolarZenithIndex; zenith <= row.lastSolarZenithIndex; zenith += 1) {
					const selected = this._selectSource(sources, centerDegrees, row.altitudeIndex, zenith);
					rowSources.push({targetPackedRow: row.firstPackedRow + zenith - row.firstSolarZenithIndex, source: selected.source, sourcePackedRow: selected.packedRow});
				}
			}
			const buffer = Buffer.allocUnsafe(this._rowByteLength);
			for (let channel = 0; channel < this._channelCount; channel += 1) {
				for (const row of rowSources) {
					let handle = handles.get(row.source.path);
					if (!handle) {
						handle = await open(row.source.path, 'r');
						handles.set(row.source.path, handle);
					}
					await this._readExactly(handle, buffer, (channel * row.source.ledger.retainedBlockCount + row.sourcePackedRow) * this._rowByteLength);
					await this._writeExactly(output, buffer, (channel * target.retainedBlockCount + row.targetPackedRow) * this._rowByteLength);
				}
			}
			await output.sync();
		} finally {
			await Promise.all([...handles.values()].map((handle) => handle.close()));
			await output.close();
		}
		const completed = await open(targetPath, 'r');
		let bytes;
		try {
			bytes = await completed.readFile();
		} finally {
			await completed.close();
		}
		return {sha256: createHash('sha256').update(bytes).digest('hex'), byteLength: bytes.byteLength, parentIds: [...new Set(rowSources.map((row) => row.source.id))]};
	}

	_selectSource(sources, center, altitudeIndex, zenithIndex) {
		const candidates = sources.map((source) => {
			const row = source.ledger.rows[altitudeIndex];
			const packedRow = zenithIndex < row.firstSolarZenithIndex || zenithIndex > row.lastSolarZenithIndex ? null : row.firstPackedRow + zenithIndex - row.firstSolarZenithIndex;
			return {source, packedRow};
		}).filter((candidate) => candidate.packedRow !== null).sort((left, right) => Math.abs(left.source.degrees - center) - Math.abs(right.source.degrees - center) || left.source.degrees - right.source.degrees);
		if (candidates.length === 0) throw new Error(`E3 has no fresh parent for ${altitudeIndex}:${zenithIndex}.`);
		return candidates[0];
	}

	async _readExactly(handle, buffer, position) {
		let offset = 0;
		while (offset < buffer.byteLength) {
			const {bytesRead} = await handle.read(buffer, offset, buffer.byteLength - offset, position + offset);
			if (bytesRead === 0) throw new Error('E3 parent payload ended early.');
			offset += bytesRead;
		}
	}

	async _writeExactly(handle, buffer, position) {
		let offset = 0;
		while (offset < buffer.byteLength) {
			const {bytesWritten} = await handle.write(buffer, offset, buffer.byteLength - offset, position + offset);
			if (bytesWritten === 0) throw new Error('E3 assembly write made no progress.');
			offset += bytesWritten;
		}
	}
}
