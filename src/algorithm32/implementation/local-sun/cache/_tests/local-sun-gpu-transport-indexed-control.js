import {createHash} from 'node:crypto';
import {
	createDefaultAuthorityOwners,
	createSealedAuthorityDomainSelection,
} from './local-sun-gpu-transport-authority.js';

/** Default local transport path integration interval count. */
const TRANSPORT_INTERVAL_COUNT = 15;

/**
 * Called by the indexed control to append one unsigned 32-bit integer in a
 * host-independent byte order.
 *
 * @param {ReturnType<typeof createHash>} hash - The receiving SHA-256 hash.
 * @param {number} value - The unsigned integer value.
 * @returns {void} - No value.
 */
function updateUint32(hash, value) {
	const bytes = new Uint8Array(4);
	new DataView(bytes.buffer).setUint32(0, value, true);
	hash.update(bytes);
}

/**
 * Call this method to hash active-only CSR transport data in the same logical
 * order as the sealed fixed-row control.
 *
 * @param {FlatIndexedTransportData} data - The compact transport data.
 * @param {number} spectralChannelCount - The native spectral width.
 * @returns {Readonly<{queryOffsetsSha256: string, sourcesSha256: string, coefficientsSha256: string}>} - The logical row-control hashes.
 */
function hashIndexedTransportData(data, spectralChannelCount) {
	const sourcesHash = createHash('sha256');
	const coefficientsHash = createHash('sha256');
	for (let queryIndex = 0; queryIndex < data.queryCount; queryIndex += 1) {
		const rowStart = data.queryOffsets[queryIndex];
		const rowEnd = data.queryOffsets[queryIndex + 1];
		updateUint32(sourcesHash, queryIndex);
		updateUint32(sourcesHash, rowEnd - rowStart);
		for (let activeTapIndex = rowStart; activeTapIndex < rowEnd; activeTapIndex += 1) {
			updateUint32(sourcesHash, data.sourceDirectionIndices[activeTapIndex]);
			updateUint32(sourcesHash, data.sourcePositionNodeIds[activeTapIndex]);
			for (let wavelengthIndex = 0; wavelengthIndex < spectralChannelCount; wavelengthIndex += 1) {
				const bytes = new Uint8Array(4);
				new DataView(bytes.buffer).setFloat32(
					0,
					data.coefficients[activeTapIndex * spectralChannelCount + wavelengthIndex],
					true,
				);
				coefficientsHash.update(bytes);
			}
		}
	}

	return {
		queryOffsetsSha256: createHash('sha256').update(new Uint8Array(data.queryOffsets.buffer)).digest('hex'),
		sourcesSha256: sourcesHash.digest('hex'),
		coefficientsSha256: coefficientsHash.digest('hex'),
	};
}

/**
 * Call this method to build the default indexed transport data and report the
 * sealed fixed-row equivalence facts without building a fixed-width payload.
 *
 * @returns {Readonly<{queryCount: number, activeTapCount: number, transportBytes: number, queryOffsetsSha256: string, sourcesSha256: string, coefficientsSha256: string}>} - The compact representation facts and logical control hashes.
 */
export function createDefaultIndexedTransportControl() {
	const {atmosphere, geometry} = createDefaultAuthorityOwners();
	const domains = createSealedAuthorityDomainSelection(geometry);
	const data = geometry.createIndexedTransportData({
		atmosphere,
		domains,
		intervalCount: TRANSPORT_INTERVAL_COUNT,
	});
	const hashes = hashIndexedTransportData(data, domains.spectralChannelCount);

	return {
		queryCount: data.queryCount,
		activeTapCount: data.activeTapCount,
		transportBytes:
			data.queryOffsets.byteLength +
			data.sourceDirectionIndices.byteLength +
			data.sourcePositionNodeIds.byteLength +
			data.coefficients.byteLength,
		...hashes,
	};
}
