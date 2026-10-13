import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';

/** Invariant physical Cornette–Shanks phase matrix for a shared rotated angular frame. */
export class CanonicalMiePhaseMatrix {
	/** Identified scalar FP32 phase input. @readonly @type {CacheData} */
	data;

	/** Creates the exact physical phase matrix once from the accepted atmosphere and angular domains.
	 *
	 * @param {CanonicalMiePhaseMatrixDefinition} definition - Physical phase and actual unit-vector inventories.
	 */
	constructor(definition) {
		const {atmosphere, incoming, outgoing} = definition;
		const asymmetry = atmosphere.constants.miePhaseFunctionG;
		const factor = ((3 / (8 * Math.PI)) * (1 - asymmetry * asymmetry)) / (2 + asymmetry * asymmetry);
		let values = new Float32Array(incoming.directionCount * outgoing.directionCount);
		for (let outgoingIndex = 0; outgoingIndex < outgoing.directionCount; outgoingIndex++) {
			let outgoingDirection = outgoing.unitVectors[outgoingIndex];
			for (let incomingIndex = 0; incomingIndex < incoming.directionCount; incomingIndex++) {
				let incomingDirection = incoming.unitVectors[incomingIndex];
				let cosine = Math.max(
					-1,
					Math.min(
						1,
						outgoingDirection[0] * incomingDirection[0] +
							outgoingDirection[1] * incomingDirection[1] +
							outgoingDirection[2] * incomingDirection[2],
					),
				);
				values[outgoingIndex * incoming.directionCount + incomingIndex] =
					(factor * (1 + cosine * cosine)) / (1 + asymmetry * asymmetry - 2 * asymmetry * cosine) ** 1.5;
			}
		}
		this.data = CacheValues.createData({
			id: incoming.id + ':' + outgoing.id + ':canonical-mie-phase',
			quantity: 'phase-function',
			units: 'sr^-1',
			shape: [incoming.directionCount, outgoing.directionCount],
			values,
		});
	}
}
