import {FlatEarthGeometry} from
	'../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import {createCacheBuildModule} from
	'../candidate/src/algorithm32/caches/gpu/cacheBuildContracts.js';
import {sha256Descriptor} from
	'../candidate/src/algorithm32/descriptors/descriptorSupport.js';

const SOURCE_COMPONENT_COUNT = 3;

function deepFreeze(value) {
	if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
		return value;
	}
	for (const child of Object.values(value)) deepFreeze(child);
	return Object.freeze(value);
}

function positiveSafeInteger(value, label) {
	if (!Number.isSafeInteger(value) || value < 1) {
		throw new RangeError(`${label} must be a positive safe integer.`);
	}
	return value;
}

function exactShape(value, expected, label) {
	if (!Array.isArray(value)
		|| value.length !== expected.length
		|| value.some((extent, index) => extent !== expected[index])) {
		throw new RangeError(
			`${label} must have shape ${JSON.stringify(expected)}.`,
		);
	}
}

function scalarCount(shape) {
	return shape.reduce((total, extent) => total * extent, 1);
}

export const PINNED_BASE_FLAT_TRANSPORT_FETCH_BLOCK_SOURCE =
	`int cacheTransportQueryIndex(
	int outputDirectionIndex,
	int outputPositionIndex
) {
	return outputPositionIndex * CACHE_DIRECTION_COUNT
		+ outputDirectionIndex;
}

ivec3 cacheTransportSource(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	int sourceOffset = tapIndex * 3;
	return ivec3(
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset, queryIndex),
			0
		).r + 0.5),
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset + 1, queryIndex),
			0
		).r + 0.5),
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset + 2, queryIndex),
			0
		).r + 0.5)
	);
}

float cacheTransportCoefficient(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex,
	int wavelengthIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	return texelFetch(
		uCacheTransportCoefficients,
		ivec3(tapIndex, queryIndex, wavelengthIndex),
		0
	).r;
}`.trim();

const PINNED_BASE_TRANSPORT_BLOCK = deepFreeze({
	id: 'flat-geometry-transport-data',
	phase: 'function',
	order: 0,
	source: PINNED_BASE_FLAT_TRANSPORT_FETCH_BLOCK_SOURCE,
});

const PINNED_BASE_TRANSPORT_BINDING_SPECS = deepFreeze({
	sources: {
		id: 'flat-geometry-transport-sources',
		name: 'uCacheTransportSources',
		kind: 'data',
		shaderType: 'sampler2D',
		frequency: 'build',
	},
	coefficients: {
		id: 'flat-geometry-transport-coefficients',
		name: 'uCacheTransportCoefficients',
		kind: 'data',
		shaderType: 'sampler2DArray',
		frequency: 'build',
	},
	tapCount: {
		id: 'flat-geometry-transport-tap-count',
		name: 'CACHE_TRANSPORT_TAP_COUNT',
		kind: 'define',
		shaderType: 'int',
		frequency: 'build',
	},
});

const CONTROLLED_QUERY_COLUMN_BINDING_SPEC = deepFreeze({
	id: 'controlled-flat-transport-query-column-count',
	name: 'CACHE_TRANSPORT_QUERY_COLUMN_COUNT',
	kind: 'define',
	shaderType: 'int',
	frequency: 'build',
});

const CACHE_DATA_REFRAMING_OPERATION_ID =
	'contained-flat-transport-query-column-cache-data-reframing-v1';

function exactRecord(value, expected) {
	return value !== null
		&& typeof value === 'object'
		&& Object.keys(value).length === Object.keys(expected).length
		&& Object.entries(expected).every(([key, expectedValue]) =>
			value[key] === expectedValue);
}

function sameShape(left, right) {
	return Array.isArray(left)
		&& Array.isArray(right)
		&& left.length === right.length
		&& left.every((extent, index) => extent === right[index]);
}

function requireControlledPackingMatchesTransportData(diagnostic, data) {
	const wavelengthCount = data?.coefficients?.shape?.[2];
	const packing = diagnostic?.packing;
	const sources = data?.sources;
	const coefficients = data?.coefficients;
	const diagnosticSources = diagnostic?.outputs?.sources;
	const diagnosticCoefficients = diagnostic?.outputs?.coefficients;
	if (diagnostic?.policyId
			!== CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY.id
		|| diagnostic.packingContentHash !== packing?.contentHash
		|| packing?.logical?.queryCount !== data?.queryCount
		|| packing?.logical?.tapCount !== data?.tapCount
		|| packing?.logical?.wavelengthCount !== wavelengthCount
		|| !sameShape(packing?.physical?.sources?.shape, sources?.shape)
		|| !sameShape(
			packing?.physical?.coefficients?.shape,
			coefficients?.shape,
		)
		|| packing?.physical?.sources?.scalarCount !== sources?.values?.length
		|| packing?.physical?.coefficients?.scalarCount
			!== coefficients?.values?.length
		|| (packing?.physical?.sources?.paddingScalarCount === 0
			&& diagnostic?.sourceValuesSameObject !== true)
		|| (packing?.physical?.coefficients?.paddingScalarCount === 0
			&& diagnostic?.coefficientValuesSameObject !== true)
		|| diagnosticSources?.id !== sources?.id
		|| diagnosticSources?.contentHash !== sources?.contentHash
		|| !sameShape(diagnosticSources?.shape, sources?.shape)
		|| diagnosticSources?.scalarCount !== sources?.values?.length
		|| diagnosticCoefficients?.id !== coefficients?.id
		|| diagnosticCoefficients?.contentHash
			!== coefficients?.contentHash
		|| !sameShape(
			diagnosticCoefficients?.shape,
			coefficients?.shape,
		)
		|| diagnosticCoefficients?.scalarCount
			!== coefficients?.values?.length) {
		throw new TypeError(
			'Controlled Flat transport packing diagnostic does not describe the exact bound transport data.',
		);
	}
	return packing;
}

export const CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY =
	deepFreeze({
		id: 'contained-flat-fibonacci68-transport-query-column-tiling-v1',
		maximumTextureSize: 8192,
		minimumQueryColumnCount: 3,
		sourceComponentCount: SOURCE_COMPONENT_COUNT,
		transportIntervalCount: 15,
		pathSampleCount: 16,
		maximumPositionStencilTapCount: 4,
		maximumDirectionStencilTapCount: 4,
		maximumLogicalTapCount: 256,
		baseTransportFetchBlockContentHash: sha256Descriptor({
			source: PINNED_BASE_FLAT_TRANSPORT_FETCH_BLOCK_SOURCE,
		}),
		baseTransportBindingSpecsContentHash: sha256Descriptor(
			PINNED_BASE_TRANSPORT_BINDING_SPECS,
		),
		cacheDataReframingOperationId: CACHE_DATA_REFRAMING_OPERATION_ID,
		logicalOrdering:
			'position-major query, incoming-direction-fastest; tap-fastest within each query; wavelength-layer-major coefficients',
		operation:
			'Reinterpret consecutive logical query rows as at least three physical query columns. Query q maps to column q modulo C and row floor(q / C); tap and source-component order remain unchanged.',
		runtimeDependencyPolicy:
			'Contained adapter over experiments/extraterrestrial/candidate FlatEarthGeometry; no production dependency or edit.',
	});

/**
 * Derive a bounded physical texture layout without changing a logical sample.
 */
export function deriveControlledFlatTransportPacking({
	queryCount,
	tapCount,
	wavelengthCount,
	maximumTextureSize =
		CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY.maximumTextureSize,
	minimumQueryColumnCount =
		CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
			.minimumQueryColumnCount,
}) {
	positiveSafeInteger(queryCount, 'queryCount');
	positiveSafeInteger(tapCount, 'tapCount');
	positiveSafeInteger(wavelengthCount, 'wavelengthCount');
	positiveSafeInteger(maximumTextureSize, 'maximumTextureSize');
	positiveSafeInteger(minimumQueryColumnCount, 'minimumQueryColumnCount');
	if (minimumQueryColumnCount < 3) {
		throw new RangeError('minimumQueryColumnCount must be at least three.');
	}

	const minimumColumnsForBoundedHeight = Math.ceil(
		queryCount / maximumTextureSize,
	);
	const queryColumnCount = Math.max(
		minimumQueryColumnCount,
		minimumColumnsForBoundedHeight,
	);
	const queryRowCount = Math.ceil(queryCount / queryColumnCount);
	const querySlotCount = queryColumnCount * queryRowCount;
	const sourceLogicalRowWidth = tapCount * SOURCE_COMPONENT_COUNT;
	const coefficientLogicalRowWidth = tapCount;
	const sourcePhysicalWidth = sourceLogicalRowWidth * queryColumnCount;
	const coefficientPhysicalWidth =
		coefficientLogicalRowWidth * queryColumnCount;
	const sourceShape = [sourcePhysicalWidth, queryRowCount];
	const coefficientShape = [
		coefficientPhysicalWidth,
		queryRowCount,
		wavelengthCount,
	];

	if (queryRowCount > maximumTextureSize
		|| sourcePhysicalWidth > maximumTextureSize
		|| coefficientPhysicalWidth > maximumTextureSize) {
		throw new RangeError(
			'Controlled Flat transport tiling cannot fit the logical query/tap extents inside the configured texture limit.',
		);
	}

	const body = {
		schemaId: 'controlled-flat-transport-packing-v1',
		policyId: CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY.id,
		maximumTextureSize,
		minimumQueryColumnCount,
		logical: {
			queryCount,
			tapCount,
			wavelengthCount,
			sourceComponentCount: SOURCE_COMPONENT_COUNT,
			sourceShape: [sourceLogicalRowWidth, queryCount],
			coefficientShape: [
				coefficientLogicalRowWidth,
				queryCount,
				wavelengthCount,
			],
			sourceScalarCount:
				sourceLogicalRowWidth * queryCount,
			coefficientScalarCount:
				coefficientLogicalRowWidth * queryCount * wavelengthCount,
		},
		physical: {
			queryColumnCount,
			queryRowCount,
			querySlotCount,
			unusedQuerySlotCount: querySlotCount - queryCount,
			sources: {
				shape: sourceShape,
				scalarCount: scalarCount(sourceShape),
				paddingScalarCount:
					(querySlotCount - queryCount) * sourceLogicalRowWidth,
			},
			coefficients: {
				shape: coefficientShape,
				scalarCount: scalarCount(coefficientShape),
				paddingScalarCount:
					(querySlotCount - queryCount)
						* coefficientLogicalRowWidth
						* wavelengthCount,
			},
			allTextureAxesWithinLimit: true,
		},
		addressing: {
			queryColumn: 'queryIndex % queryColumnCount',
			queryRow: 'queryIndex / queryColumnCount',
			sourceX:
				'((queryColumn * tapCount + tapIndex) * 3) + componentIndex',
			coefficientX: '(queryColumn * tapCount) + tapIndex',
		},
	};
	return deepFreeze({
		...body,
		contentHash: sha256Descriptor(body),
	});
}

function frameLayerMajorValues({
	values,
	logicalLayerStride,
	physicalLayerStride,
	layerCount,
}) {
	if (values.length !== logicalLayerStride * layerCount) {
		throw new RangeError('Logical transport data length does not match its shape.');
	}
	if (logicalLayerStride === physicalLayerStride) return values;

	const framed = new Array(physicalLayerStride * layerCount).fill(0);
	for (let layer = 0; layer < layerCount; layer += 1) {
		const logicalStart = layer * logicalLayerStride;
		const physicalStart = layer * physicalLayerStride;
		for (let index = 0; index < logicalLayerStride; index += 1) {
			framed[physicalStart + index] = values[logicalStart + index];
		}
	}
	return framed;
}

function createReframedCacheData({
	input,
	id,
	shape,
	logicalLayerStride,
	physicalLayerStride,
	layerCount,
	packing,
}) {
	const values = frameLayerMajorValues({
		values: input.values,
		logicalLayerStride,
		physicalLayerStride,
		layerCount,
	});
	const body = {
		id,
		quantity: input.quantity,
		units: input.units,
		shape: [...shape],
		values,
	};
	const identity = {
		kind: 'derived-cache-data-content-identity',
		operationId: CACHE_DATA_REFRAMING_OPERATION_ID,
		parent: {
			id: input.id,
			contentHash: input.contentHash,
			shape: [...input.shape],
			scalarCount: input.values.length,
		},
		packingContentHash: packing.contentHash,
		output: {
			id,
			shape: [...shape],
			scalarCount: values.length,
			logicalLayerStride,
			physicalLayerStride,
			layerCount,
			zeroPaddingOperation:
				physicalLayerStride === logicalLayerStride
					? 'none-reference-preserved'
					: 'append-exact-zero-at-each-layer-tail',
			zeroPaddingScalarCount:
				(physicalLayerStride - logicalLayerStride) * layerCount,
		},
	};
	return {
		...body,
		contentHash: sha256Descriptor(identity),
	};
}

/**
 * Reframe the two canonical Flat transport data arrays. Logical rows stay in
 * their original byte-for-byte order; only row width and the matching shader
 * address change. Padding, when required, is exact zero at each layer tail.
 */
export function tileControlledFlatTransportData(logical, options = {}) {
	positiveSafeInteger(logical.queryCount, 'logical.queryCount');
	positiveSafeInteger(logical.tapCount, 'logical.tapCount');
	const wavelengthCount = logical.coefficients?.shape?.[2];
	positiveSafeInteger(wavelengthCount, 'logical coefficient wavelength count');
	const sourceLogicalWidth = logical.tapCount * SOURCE_COMPONENT_COUNT;
	exactShape(
		logical.sources?.shape,
		[sourceLogicalWidth, logical.queryCount],
		'logical.sources',
	);
	exactShape(
		logical.coefficients?.shape,
		[logical.tapCount, logical.queryCount, wavelengthCount],
		'logical.coefficients',
	);
	const packing = deriveControlledFlatTransportPacking({
		queryCount: logical.queryCount,
		tapCount: logical.tapCount,
		wavelengthCount,
		...options,
	});
	const sources = createReframedCacheData({
		input: logical.sources,
		id: `${logical.sources.id}-query-column-tiled-v1`,
		shape: packing.physical.sources.shape,
		logicalLayerStride: packing.logical.sourceScalarCount,
		physicalLayerStride: packing.physical.sources.scalarCount,
		layerCount: 1,
		packing,
	});
	const coefficients = createReframedCacheData({
		input: logical.coefficients,
		id: `${logical.coefficients.id}-query-column-tiled-v1`,
		shape: packing.physical.coefficients.shape,
		logicalLayerStride:
			logical.tapCount * logical.queryCount,
		physicalLayerStride:
			packing.physical.coefficients.shape[0]
				* packing.physical.coefficients.shape[1],
		layerCount: wavelengthCount,
		packing,
	});
	const sourceValuesSameObject =
		sources.values === logical.sources.values;
	const coefficientValuesSameObject =
		coefficients.values === logical.coefficients.values;
	if ((packing.physical.sources.paddingScalarCount === 0
			&& !sourceValuesSameObject)
		|| (packing.physical.coefficients.paddingScalarCount === 0
			&& !coefficientValuesSameObject)) {
		throw new Error(
			'Zero-padding-free controlled Flat transport packing must preserve the exact parent value references.',
		);
	}
	const derivationBody = {
		schemaId: 'controlled-flat-transport-packing-diagnostic-v1',
		policyId: packing.policyId,
		packingContentHash: packing.contentHash,
		operation:
			'Logical Flat transport values are retained in exact order and reinterpreted through query-column tiling; only zero layer-tail padding may be added.',
		cacheDataReframingOperationId: CACHE_DATA_REFRAMING_OPERATION_ID,
		sourceValuesSameObject,
		coefficientValuesSameObject,
		inputs: {
			sources: {
				id: logical.sources.id,
				contentHash: logical.sources.contentHash,
				shape: [...logical.sources.shape],
				scalarCount: logical.sources.values.length,
			},
			coefficients: {
				id: logical.coefficients.id,
				contentHash: logical.coefficients.contentHash,
				shape: [...logical.coefficients.shape],
				scalarCount: logical.coefficients.values.length,
			},
		},
		outputs: {
			sources: {
				id: sources.id,
				contentHash: sources.contentHash,
				shape: [...sources.shape],
				scalarCount: sources.values.length,
			},
			coefficients: {
				id: coefficients.id,
				contentHash: coefficients.contentHash,
				shape: [...coefficients.shape],
				scalarCount: coefficients.values.length,
			},
		},
		packing,
	};
	const controlledPacking = deepFreeze({
		...derivationBody,
		contentHash: sha256Descriptor(derivationBody),
	});

	return {
		...logical,
		sources,
		coefficients,
		controlledPacking,
	};
}

/** Exact replacement for only the original Flat transport-data fetch block. */
export function createControlledFlatTransportFetchBlockSource() {
	return `int cacheTransportQueryIndex(
	int outputDirectionIndex,
	int outputPositionIndex
) {
	return outputPositionIndex * CACHE_DIRECTION_COUNT
		+ outputDirectionIndex;
}

ivec2 cacheTransportQueryCoordinate(
	int outputDirectionIndex,
	int outputPositionIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	return ivec2(
		queryIndex % CACHE_TRANSPORT_QUERY_COLUMN_COUNT,
		queryIndex / CACHE_TRANSPORT_QUERY_COLUMN_COUNT
	);
}

ivec3 cacheTransportSource(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex
) {
	ivec2 queryCoordinate = cacheTransportQueryCoordinate(
		outputDirectionIndex,
		outputPositionIndex
	);
	int sourceOffset = (
		queryCoordinate.x * CACHE_TRANSPORT_TAP_COUNT + tapIndex
	) * 3;
	return ivec3(
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset, queryCoordinate.y),
			0
		).r + 0.5),
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset + 1, queryCoordinate.y),
			0
		).r + 0.5),
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset + 2, queryCoordinate.y),
			0
		).r + 0.5)
	);
}

float cacheTransportCoefficient(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex,
	int wavelengthIndex
) {
	ivec2 queryCoordinate = cacheTransportQueryCoordinate(
		outputDirectionIndex,
		outputPositionIndex
	);
	int coefficientX =
		queryCoordinate.x * CACHE_TRANSPORT_TAP_COUNT + tapIndex;
	return texelFetch(
		uCacheTransportCoefficients,
		ivec3(coefficientX, queryCoordinate.y, wavelengthIndex),
		0
	).r;
}`.trim();
}

function requirePinnedBaseTransportModule(base, context) {
	if (base.id !== 'algorithm32-flat-earth-transport-module-v3'
		|| base.owner !== 'geometry') {
		throw new Error('Controlled Flat transport inherited the wrong base module.');
	}
	const matchingBlocks = base.blocks.filter(
		(block) => block.id === PINNED_BASE_TRANSPORT_BLOCK.id,
	);
	if (matchingBlocks.length !== 1
		|| !exactRecord(matchingBlocks[0], PINNED_BASE_TRANSPORT_BLOCK)) {
		throw new Error(
			'Controlled Flat transport base fetch block differs from its full pinned source contract.',
		);
	}

	const bindingsByRole = {};
	for (const [role, expectedSpec] of Object.entries(
		PINNED_BASE_TRANSPORT_BINDING_SPECS,
	)) {
		const matches = base.bindings.filter(
			(binding) => binding.spec.id === expectedSpec.id,
		);
		if (matches.length !== 1
			|| !exactRecord(matches[0].spec, expectedSpec)) {
			throw new Error(
				`Controlled Flat transport ${role} binding differs from its pinned specification.`,
			);
		}
		bindingsByRole[role] = matches[0];
	}
	if (bindingsByRole.sources.value !== context.transportData.sources
		|| bindingsByRole.coefficients.value
			!== context.transportData.coefficients
		|| bindingsByRole.tapCount.value !== context.transportData.tapCount) {
		throw new Error(
			'Controlled Flat transport base bindings do not reference the exact tiled data and logical tap count.',
		);
	}
	if (base.bindings.some((binding) =>
		binding.spec.id === CONTROLLED_QUERY_COLUMN_BINDING_SPEC.id
			|| binding.spec.name === CONTROLLED_QUERY_COLUMN_BINDING_SPEC.name)) {
		throw new Error(
			'Controlled Flat transport query-column define collides with a base binding.',
		);
	}
	return {
		block: matchingBlocks[0],
		bindingsByRole,
	};
}

/**
 * Contained Flat geometry whose sole change is bounded physical packing for
 * the already-derived local N4 transport lookup arrays.
 */
export class ControlledFlatEarthFibonacci68TransportGeometry extends
	FlatEarthGeometry {
	constructor(configuration, packingOptions = {}) {
		super(configuration);
		this._controlledTransportPackingOptions = Object.freeze({
			maximumTextureSize: packingOptions.maximumTextureSize
				?? CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
					.maximumTextureSize,
			minimumQueryColumnCount: packingOptions.minimumQueryColumnCount
				?? CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
					.minimumQueryColumnCount,
		});
		const geometryDescriptorBody = {
			kind: 'contained-flat-transport-query-column-tiling',
			policyId:
				CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY.id,
			maximumTextureSize:
				this._controlledTransportPackingOptions.maximumTextureSize,
			minimumQueryColumnCount:
				this._controlledTransportPackingOptions.minimumQueryColumnCount,
			sourceComponentCount: SOURCE_COMPONENT_COUNT,
			queryColumnAddress: 'queryIndex % queryColumnCount',
			queryRowAddress: 'queryIndex / queryColumnCount',
			sourceXAddress:
				'((queryColumn * tapCount + tapIndex) * 3) + componentIndex',
			coefficientXAddress:
				'(queryColumn * tapCount) + tapIndex',
		};
		this._controlledTransportGeometryDescriptor = deepFreeze({
			...geometryDescriptorBody,
			contentHash: sha256Descriptor(geometryDescriptorBody),
		});
		this._controlledTransportPackingDiagnostics = [];
		this._controlledTransportModuleDiagnostics = [];
	}

	describe() {
		return {
			...super.describe(),
			controlledTransportPacking:
				this._controlledTransportGeometryDescriptor,
		};
	}

	createTransportData(request) {
		if (request.intervalCount
			!== CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
				.transportIntervalCount) {
			throw new RangeError(
				'Controlled Flat FIB68 transport requires exactly 15 intervals.',
			);
		}
		if (request.domains?.incomingDirectionCount !== 68
			|| request.domains?.incomingUnitVectors?.length !== 68) {
			throw new RangeError(
				'Controlled Flat FIB68 transport requires exactly 68 incoming directions.',
			);
		}
		if (request.domains?.spectralChannelCount !== 15
			|| request.domains?.spectralBasis?.channelCount !== 15
			|| request.domains?.spectralBasis?.channels?.length !== 15) {
			throw new RangeError(
				'Controlled Flat FIB68 transport requires exactly 15 wavelengths.',
			);
		}
		const logical = super.createTransportData(request);
		if (logical.coefficients?.shape?.[2] !== 15
			|| logical.tapCount
				> CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
					.maximumLogicalTapCount) {
			throw new RangeError(
				'Controlled Flat FIB68 transport produced an invalid wavelength or tap extent.',
			);
		}
		const tiled = tileControlledFlatTransportData(
			logical,
			this._controlledTransportPackingOptions,
		);
		this._controlledTransportPackingDiagnostics.push(
			tiled.controlledPacking,
		);
		return tiled;
	}

	createCacheModule(context) {
		const base = super.createCacheModule(context);
		if (context.kind !== 'transport') return base;

		const diagnostic = context.transportData?.controlledPacking;
		const packing = requireControlledPackingMatchesTransportData(
			diagnostic,
			context.transportData,
		);
		const pinnedBase = requirePinnedBaseTransportModule(base, context);
		const blocks = base.blocks.map((block) =>
			block.id === 'flat-geometry-transport-data'
				? {
					...block,
					source: createControlledFlatTransportFetchBlockSource(),
				}
				: block);
		const bindings = [
			...base.bindings,
			{
				spec: CONTROLLED_QUERY_COLUMN_BINDING_SPEC,
				value: packing.physical.queryColumnCount,
			},
		];
		const controlledModule = createCacheBuildModule({
			id: 'contained-flat-earth-tiled-transport-module-v1',
			owner: base.owner,
			provides: base.provides,
			requires: base.requires,
			blocks,
			bindings,
		});
		const replacementBlock = controlledModule.blocks.find(
			(block) => block.id === PINNED_BASE_TRANSPORT_BLOCK.id,
		);
		const moduleDiagnosticBody = {
			schemaId: 'controlled-flat-transport-module-diagnostic-v1',
			policyId:
				CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY.id,
			baseModule: {id: base.id, contentHash: base.contentHash},
			controlledModule: {
				id: controlledModule.id,
				contentHash: controlledModule.contentHash,
			},
			baseFetchBlockContentHash: sha256Descriptor({
				source: pinnedBase.block.source,
			}),
			replacementFetchBlockContentHash: sha256Descriptor({
				source: replacementBlock.source,
			}),
			pinnedBindingSpecsContentHash:
				CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
					.baseTransportBindingSpecsContentHash,
			queryColumnCount:
				packing.physical.queryColumnCount,
			untouchedBlockCount: base.blocks.length - 1,
			untouchedBindingCount: base.bindings.length,
		};
		this._controlledTransportModuleDiagnostics.push(deepFreeze({
			...moduleDiagnosticBody,
			contentHash: sha256Descriptor(moduleDiagnosticBody),
		}));
		return controlledModule;
	}

	get controlledTransportPackingPolicy() {
		return CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY;
	}

	get controlledTransportPackingDiagnostics() {
		return Object.freeze([
			...this._controlledTransportPackingDiagnostics,
		]);
	}

	get controlledTransportModuleDiagnostics() {
		return Object.freeze([
			...this._controlledTransportModuleDiagnostics,
		]);
	}
}

export default ControlledFlatEarthFibonacci68TransportGeometry;
