import {BrunetonColorDisplayModel} from '../controls/production-v1/src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';

/**
 * CR1-only diagnostic view of the composed linear field immediately before
 * Bruneton display encoding. This changes no spectral, transport, scene, or
 * cache operation; it replaces only the final encode seam for float-target
 * readback.
 */
export class Cr1LinearFieldDiagnosticColorDisplayModel extends BrunetonColorDisplayModel {
	/** Stable identity of the contained diagnostic Color view. */
	get id() {
		return 'color-reset-pre-display-linear-rgb-v1';
	}

	/** Return the unencoded composed linear-sRGB field for offscreen capture. */
	_displayEncodeBlock() {
		return `vec4 encodeDisplayOutput(vec3 linearSrgb) {
	return vec4(linearSrgb, 1.0);
}`;
	}
}
