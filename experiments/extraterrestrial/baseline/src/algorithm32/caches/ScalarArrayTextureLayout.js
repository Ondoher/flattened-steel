import { sha256Descriptor } from '../descriptors/descriptorSupport.js';

export const SCALAR_ARRAY_TEXTURE_LAYOUT_SCHEMA_REVISION =
	'algorithm32-scalar-array-texture-layout-schema-v1';

/**
 * Emit descriptive metadata for the selected R32F array-texture layout.
 *
 * The concrete source cache owns executable allocation, indexing, packing,
 * and shader addressing. This factory trusts its typed source-owned facts and
 * only derives reporting/accounting metadata and its stable identity.
 *
 * @param {ScalarArrayTextureLayoutDefinition} definition - Supplies logical
 * domain sizes and identity.
 * @returns {ScalarArrayTextureLayoutDescriptor} The layout metadata.
 */
export function createScalarArrayTextureLayout(definition) {
	const scalarCount = definition.directionCount
		* definition.positionCount
		* definition.wavelengthCount;
	const body = /** @type {const} */ ({
		kind: 'scalar-array-texture-layout',
		id: definition.id,
		schemaRevision: definition.schemaRevision === undefined
			? SCALAR_ARRAY_TEXTURE_LAYOUT_SCHEMA_REVISION
			: definition.schemaRevision,
		format: 'R32F',
		precision: 'binary32',
		axes: {
			x: 'direction',
			y: 'position',
			layer: 'wavelength',
		},
		shape: {
			direction: definition.directionCount,
			position: definition.positionCount,
			wavelength: definition.wavelengthCount,
		},
		channelCount: 1,
		storage: {
			value: scalarCount * 4,
			units: 'bytes',
		},
	});

	return {
		...body,
		contentHash: sha256Descriptor(body),
	};
}
