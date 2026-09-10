import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/index.js';
import {
	DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT,
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
	DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID,
	DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
	DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
	DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT,
	DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT,
} from './consts.js';

/** Executable Native15 shared-block to RGBA packet-atlas mapping. */
export default class DistantSunSharedCachePacketLayout {
	/**
	 * Called by packet operations to require one integer inside an inclusive range.
	 *
	 * @param {number} value - Candidate integer.
	 * @param {number} minimum - Inclusive lower bound.
	 * @param {number} maximum - Inclusive upper bound.
	 * @param {string} label - Diagnostic label.
	 * @returns {number} - Accepted integer.
	 */
	_requireInteger(value, minimum, maximum, label) {
		if (!Number.isInteger(value) || value < minimum || value > maximum) {
			throw new RangeError(`${label} is outside the packet-layout domain.`);
		}
		return value;
	}

	/**
	 * Called by packet construction to require the executable W27 logical-to-unique seam map.
	 *
	 * @param {Uint16Array} logicalToUniqueIndex - Candidate logical-to-unique direction map.
	 * @returns {Uint16Array} - Accepted direction map.
	 */
	_requireLogicalToUniqueIndex(logicalToUniqueIndex) {
		if (
			!(logicalToUniqueIndex instanceof Uint16Array) ||
			logicalToUniqueIndex.length !== DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT
		) {
			throw new RangeError('Shared-cache logical-to-unique direction map has an incompatible shape.');
		}
		const executable = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices;
		for (
			let logicalDirectionIndex = 0;
			logicalDirectionIndex < logicalToUniqueIndex.length;
			logicalDirectionIndex += 1
		) {
			if (logicalToUniqueIndex[logicalDirectionIndex] !== executable[logicalDirectionIndex]) {
				throw new RangeError('Shared-cache logical-to-unique direction map differs from executable W27.');
			}
		}
		return logicalToUniqueIndex;
	}

	/**
	 * Call this method to resolve one decoded wavelength-major Float32 source index.
	 * Out-of-domain indices or row counts throw; callers must stop packet construction.
	 *
	 * @param {number} channelIndex - Native15 spectral channel index.
	 * @param {number} blockRowIndex - Populated coordinate row within the decoded block.
	 * @param {number} uniqueDirectionIndex - Exact-seam W27 direction index.
	 * @param {number} blockRowCount - Populated coordinate-row count in the block.
	 * @returns {number} - Flat decoded Float32 source index.
	 */
	resolveSourceIndex(channelIndex, blockRowIndex, uniqueDirectionIndex, blockRowCount) {
		this._requireInteger(
			blockRowCount,
			1,
			DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
			'Shared-cache block row count',
		);
		this._requireInteger(
			channelIndex,
			0,
			DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT - 1,
			'Shared-cache spectral channel index',
		);
		this._requireInteger(blockRowIndex, 0, blockRowCount - 1, 'Shared-cache block row index');
		this._requireInteger(
			uniqueDirectionIndex,
			0,
			DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT - 1,
			'Shared-cache unique direction index',
		);
		return (
			(channelIndex * blockRowCount + blockRowIndex) * DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT +
			uniqueDirectionIndex
		);
	}

	/**
	 * Call this method to resolve one logical W27/Native15 sample into packet-atlas coordinates.
	 * Out-of-domain indices or resident slots throw; callers must stop packet construction.
	 *
	 * @param {number} channelIndex - Native15 spectral channel index.
	 * @param {number} blockRowIndex - Coordinate row within the 64-row packet block.
	 * @param {number} logicalDirectionIndex - Logical W27 direction index.
	 * @param {number} residentSlot - Packet-atlas array layer.
	 * @returns {DistantSunSharedCachePacketDestination} - Exact layer, texel, and RGBA component destination.
	 */
	resolveDestination(channelIndex, blockRowIndex, logicalDirectionIndex, residentSlot) {
		this._requireInteger(
			channelIndex,
			0,
			DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT - 1,
			'Shared-cache spectral channel index',
		);
		this._requireInteger(
			blockRowIndex,
			0,
			DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT - 1,
			'Shared-cache block row index',
		);
		this._requireInteger(
			logicalDirectionIndex,
			0,
			DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT - 1,
			'Shared-cache logical direction index',
		);
		this._requireInteger(residentSlot, 0, 0xffff - 1, 'Shared-cache resident slot');

		const faceIndex = Math.floor(logicalDirectionIndex / 729);
		const faceLocalIndex = logicalDirectionIndex - faceIndex * 729;
		const vIndex = Math.floor(faceLocalIndex / 27);
		const uIndex = faceLocalIndex - vIndex * 27;
		const packetGroupIndex = Math.floor(channelIndex / 4);

		return {
			layer: residentSlot,
			y: blockRowIndex * 27 + vIndex,
			x: packetGroupIndex * 162 + faceIndex * 27 + uIndex,
			component: channelIndex % 4,
		};
	}

	/**
	 * Call this method to expand one authenticated decoded block into one complete packet layer.
	 * Source Float32 bit patterns are copied without numerical conversion. The synthetic sixteenth
	 * component and every unpopulated packet row remain exact positive zero.
	 * Incompatible hashes, shapes, mappings, or decoded bytes throw; callers must not upload the packet.
	 *
	 * @param {DistantSunSharedCachePacketBuildRequest} request - Authenticated block and direction-map values.
	 * @returns {DistantSunSharedCachePacketBlock} - Packet-ready block with fixed RGBA32F storage facts.
	 */
	pack(request) {
		const blockRowCount = this._requireInteger(
			request.blockRowCount,
			1,
			DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT,
			'Shared-cache block row count',
		);
		if (!(request.decodedValues instanceof Float32Array)) {
			throw new TypeError('Shared-cache decoded block values must be Float32Array.');
		}
		const expectedDecodedValueCount =
			blockRowCount *
			DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT *
			DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT;
		if (request.decodedValues.length !== expectedDecodedValueCount) {
			throw new RangeError('Shared-cache decoded block length differs from its populated row count.');
		}
		const logicalToUniqueIndex = this._requireLogicalToUniqueIndex(request.logicalToUniqueIndex);
		const packetValues = new Float32Array(
			DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH * DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT * 4,
		);
		const decodedBits = new Uint32Array(
			request.decodedValues.buffer,
			request.decodedValues.byteOffset,
			request.decodedValues.length,
		);
		const packetBits = new Uint32Array(packetValues.buffer);

		for (let blockRowIndex = 0; blockRowIndex < blockRowCount; blockRowIndex += 1) {
			for (
				let logicalDirectionIndex = 0;
				logicalDirectionIndex < DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT;
				logicalDirectionIndex += 1
			) {
				const uniqueDirectionIndex = logicalToUniqueIndex[logicalDirectionIndex];
				for (
					let channelIndex = 0;
					channelIndex < DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT;
					channelIndex += 1
				) {
					const sourceIndex = this.resolveSourceIndex(
						channelIndex,
						blockRowIndex,
						uniqueDirectionIndex,
						blockRowCount,
					);
					const destination = this.resolveDestination(channelIndex, blockRowIndex, logicalDirectionIndex, 0);
					const destinationIndex =
						(destination.y * DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH + destination.x) * 4 +
						destination.component;
					packetBits[destinationIndex] = decodedBits[sourceIndex];
				}
			}
		}

		return {
			schemaId: DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID,
			logicalBlockId: request.logicalBlockId,
			decodedSha256: request.decodedSha256,
			logicalToUniqueIndexSha256: request.logicalToUniqueIndexSha256,
			blockRowCount,
			storage: {
				format: 'RGBA32F',
				width: DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH,
				height: DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT,
				layers: 1,
				xFastest: true,
				flipY: false,
			},
			values: packetValues,
		};
	}
}
