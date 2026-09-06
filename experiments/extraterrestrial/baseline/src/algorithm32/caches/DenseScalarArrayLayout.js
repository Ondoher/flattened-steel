import {
	assertImmutableDescriptorRecord,
	immutableDescriptorData,
	positiveInteger,
	requiredString,
	sha256Descriptor,
} from '../descriptors/descriptorSupport.js';
import { assertUnitValue, createUnitValue } from '../quantities/UnitValue.js';

export const DENSE_SCALAR_ARRAY_LAYOUT_SCHEMA_REVISION =
	'algorithm32-dense-scalar-array-layout-schema-v1';

const BYTES_PER_SCALAR = Float64Array.BYTES_PER_ELEMENT;

/**
 * Return a safe-integer product for one declared storage dimension.
 *
 * @param {number} left - Supplies the accumulated dimension product.
 * @param {number} right - Supplies the next dimension size.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {number} The validated product.
 */
function checkedProduct(left, right, label) {
	const result = left * right;

	if (!Number.isSafeInteger(result)) {
		throw new RangeError(`${label} size must be a safe integer.`);
	}

	return result;
}

/**
 * Create declarative metadata for one dense binary64 directional field.
 *
 * Direction is the fastest-changing axis, followed by position and then
 * wavelength. This descriptor reports identity and storage facts only. It
 * does not calculate offsets, allocate arrays, pack values, or expose access
 * behavior.
 *
	 * @param {DenseScalarArrayLayoutDefinition} definition - Supplies logical
	 * field dimensions and identity.
	 * @returns {DenseScalarArrayLayoutDescriptor} Return the immutable layout descriptor.
 */
export function createDenseScalarArrayLayout(definition) {
	if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
		throw new TypeError('dense scalar-array layout must be an object.');
	}

	const directionCount = positiveInteger(definition.directionCount, 'direction count');
	const positionCount = positiveInteger(definition.positionCount, 'position count');
	const wavelengthCount = positiveInteger(definition.wavelengthCount, 'wavelength count');
	const scalarCount = checkedProduct(
		checkedProduct(directionCount, positionCount, 'dense scalar-array shape'),
		wavelengthCount,
		'dense scalar-array shape',
	);
	const storageValue = checkedProduct(
		scalarCount,
		BYTES_PER_SCALAR,
		'dense scalar-array storage',
	);
	const body = immutableDescriptorData(/** @type {const} */ ({
		kind: 'dense-scalar-array-layout',
		id: requiredString(definition.id, 'dense scalar-array layout id'),
		schemaRevision: requiredString(
			definition.schemaRevision === undefined
				? DENSE_SCALAR_ARRAY_LAYOUT_SCHEMA_REVISION
				: definition.schemaRevision,
			'dense scalar-array layout schema revision',
		),
		format: 'Float64Array',
		precision: 'binary64',
		axes: {
			fastest: 'direction',
			middle: 'position',
			slowest: 'wavelength',
		},
		shape: {
			direction: directionCount,
			position: positionCount,
			wavelength: wavelengthCount,
		},
		scalarCount,
		storage: createUnitValue({
			value: storageValue,
			units: 'bytes',
		}),
	}));

	return /** @type {DenseScalarArrayLayoutDescriptor} */ (immutableDescriptorData({
		...body,
		contentHash: sha256Descriptor(body),
	}));
}

/**
 * Validate declarative dense binary64 directional-field layout metadata.
 *
 * @param {unknown} value - Supplies the candidate layout.
 * @param {string} [label] - Supplies a diagnostic label.
	 * @returns {DenseScalarArrayLayoutDescriptor} Return the validated layout.
 */
export function assertDenseScalarArrayLayout(
	value,
	label = 'dense scalar-array layout',
) {
	if (!value || typeof value !== 'object') {
		throw new TypeError(
			`${label} must be a dense scalar-array layout descriptor.`,
		);
	}
	const candidate = /** @type {Partial<DenseScalarArrayLayoutDescriptor>} */ (value);

	if (candidate.kind !== 'dense-scalar-array-layout') {
		throw new TypeError(
			`${label} must be a dense scalar-array layout descriptor.`,
		);
	}

	requiredString(candidate.id, `${label} id`);
	requiredString(candidate.schemaRevision, `${label} schema revision`);

	if (candidate.format !== 'Float64Array' || candidate.precision !== 'binary64') {
		throw new TypeError(
			`${label} must use Float64Array binary64 scalar storage.`,
		);
	}

	if (candidate.axes?.fastest !== 'direction'
		|| candidate.axes?.middle !== 'position'
		|| candidate.axes?.slowest !== 'wavelength') {
		throw new TypeError(
			`${label} axes must order direction, position, then wavelength from fastest to slowest.`,
		);
	}

	const directionCount = positiveInteger(
		candidate.shape?.direction,
		`${label} direction count`,
	);
	const positionCount = positiveInteger(
		candidate.shape?.position,
		`${label} position count`,
	);
	const wavelengthCount = positiveInteger(
		candidate.shape?.wavelength,
		`${label} wavelength count`,
	);
	const scalarCount = checkedProduct(
		checkedProduct(directionCount, positionCount, `${label} shape`),
		wavelengthCount,
		`${label} shape`,
	);

	if (candidate.scalarCount !== scalarCount) {
		throw new TypeError(`${label} scalar count does not match its shape.`);
	}

	assertUnitValue(candidate.storage, `${label} storage`);
	const expectedStorage = checkedProduct(
		scalarCount,
		BYTES_PER_SCALAR,
		`${label} storage`,
	);

	if (candidate.storage?.units !== 'bytes'
		|| candidate.storage.value !== expectedStorage) {
		throw new TypeError(`${label} storage does not match its binary64 shape.`);
	}

	const body = {
		kind: candidate.kind,
		id: candidate.id,
		schemaRevision: candidate.schemaRevision,
		format: candidate.format,
		precision: candidate.precision,
		axes: candidate.axes,
		shape: candidate.shape,
		scalarCount: candidate.scalarCount,
		storage: candidate.storage,
	};

	if (candidate.contentHash !== sha256Descriptor(body)) {
		throw new TypeError(`${label} content hash does not match its data.`);
	}

	assertImmutableDescriptorRecord(candidate, [
		'kind',
		'id',
		'schemaRevision',
		'format',
		'precision',
		'axes',
		'shape',
		'scalarCount',
		'storage',
		'contentHash',
	], label);
	assertImmutableDescriptorRecord(
		candidate.axes,
		['fastest', 'middle', 'slowest'],
		`${label} axes`,
	);
	assertImmutableDescriptorRecord(
		candidate.shape,
		['direction', 'position', 'wavelength'],
		`${label} shape`,
	);
	assertImmutableDescriptorRecord(
		candidate.storage,
		['value', 'units'],
		`${label} storage`,
	);

	return /** @type {DenseScalarArrayLayoutDescriptor} */ (candidate);
}
export default createDenseScalarArrayLayout;
