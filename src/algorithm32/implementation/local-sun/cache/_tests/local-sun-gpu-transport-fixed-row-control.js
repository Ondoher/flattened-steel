import {createHash} from 'node:crypto';
import {
	createDefaultAuthorityOwners,
	createSealedAuthorityDomainSelection,
} from './local-sun-gpu-transport-authority.js';

/** Default local transport path integration interval count. */
const TRANSPORT_INTERVAL_COUNT = 15;

/**
 * Called by the fixed-row control to append one unsigned 32-bit integer in a
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
 * Called by the fixed-row control to append one canonical Float32 value.
 *
 * @param {ReturnType<typeof createHash>} hash - The receiving SHA-256 hash.
 * @param {number} value - The Float64 intermediate coefficient value.
 * @returns {void} - No value.
 */
function updateFloat32(hash, value) {
	const bytes = new Uint8Array(4);
	new DataView(bytes.buffer).setFloat32(0, Math.fround(value), true);
	hash.update(bytes);
}

/**
 * Call this method to stream the default Flat/local active transport rows into
 * stable control hashes without allocating the padded fixed-width payload.
 *
 * @param {(progress: Readonly<{completed: number, total: number}>) => void} [onProgress] - Optional row-progress observer.
 * @returns {Readonly<{queryCount: number, activeTapCount: number, maximumTapCount: number, queryOffsetsSha256: string, sourcesSha256: string, coefficientsSha256: string}>} - The canonical default-profile row-control facts.
 */
export function createDefaultFixedRowControl(onProgress) {
	const {atmosphere, geometry} = createDefaultAuthorityOwners();
	const domains = createSealedAuthorityDomainSelection(geometry);
	const queryCount = domains.positionCount * domains.incomingDirectionCount;
	const offsets = new Uint32Array(queryCount + 1);
	const sourcesHash = createHash('sha256');
	const coefficientsHash = createHash('sha256');
	let activeTapCount = 0;
	let maximumTapCount = 0;

	geometry.forEachTransportQueryTap(
		{
			atmosphere,
			domains,
			intervalCount: TRANSPORT_INTERVAL_COUNT,
		},
		({queryIndex, taps}) => {
			offsets[queryIndex] = activeTapCount;
			updateUint32(sourcesHash, queryIndex);
			updateUint32(sourcesHash, taps.length);
			maximumTapCount = Math.max(maximumTapCount, taps.length);

			for (const tap of taps) {
				updateUint32(sourcesHash, tap.sourceDirectionIndex);
				updateUint32(sourcesHash, tap.sourcePositionIndex);
				for (const coefficient of tap.coefficients) {
					updateFloat32(coefficientsHash, coefficient);
				}
			}

			activeTapCount += taps.length;
			offsets[queryIndex + 1] = activeTapCount;
			onProgress?.({completed: queryIndex + 1, total: queryCount});
		},
	);

	return {
		queryCount,
		activeTapCount,
		maximumTapCount,
		queryOffsetsSha256: createHash('sha256').update(new Uint8Array(offsets.buffer)).digest('hex'),
		sourcesSha256: sourcesHash.digest('hex'),
		coefficientsSha256: coefficientsHash.digest('hex'),
	};
}
