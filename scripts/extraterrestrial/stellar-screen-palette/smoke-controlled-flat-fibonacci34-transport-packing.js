import {createCacheData} from
	'../candidate/src/algorithm32/caches/gpu/cacheBuildContracts.js';
import {sha256Descriptor} from
	'../candidate/src/algorithm32/descriptors/descriptorSupport.js';
import {CanonicalAtmosphere} from
	'../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from
	'../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {NATIVE_15_SPECTRAL_BASIS} from
	'../candidate/src/algorithm32/profiles/native-15-profile.js';
import {FlatEarthGeometry} from
	'../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import {createLocalSunShellFactCache} from
	'../candidate/src/algorithm32/light-sources/create-local-sun-shell-fact-cache.js';
import {createLocalSunCacheBuildPlan} from
	'../candidate/src/algorithm32/light-sources/local-sun-cache-plan.js';
import {LocalSunCacheSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunCacheSource.js';
import {LocalSunLightSource} from
	'../candidate/src/algorithm32/light-sources/LocalSunLightSource.js';
import {
	CONTROLLED_FLAT_FIBONACCI34_TRANSPORT_PACKING_POLICY,
	ControlledFlatEarthFibonacci34TransportGeometry,
	PINNED_BASE_FLAT_TRANSPORT_FETCH_BLOCK_SOURCE,
	createControlledFlatTransportFetchBlockSource,
	deriveControlledFlatTransportPacking,
	tileControlledFlatTransportData,
} from './ControlledFlatEarthFibonacci34TransportGeometry.js';
import LocalSunConstructionDomainSelection from
	'../candidate/src/algorithm32/light-sources/LocalSunConstructionDomainSelection.js';
import {NATIVE_SOURCE_IRRADIANCE_DENSITY} from
	'../candidate/src/algorithm32/profiles/native-15-profile.js';
import {OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY} from
	'./ObservedFibonacci34LocalSunLightSource.js';

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

function expectThrow(callback, pattern, message) {
	let error;
	try {
		callback();
	} catch (candidate) {
		error = candidate;
	}
	assert(error instanceof Error && pattern.test(error.message), message);
}

function exactRecord(left, right) {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	return leftKeys.length === rightKeys.length
		&& leftKeys.every((key) => left[key] === right[key]);
}

function exactBinding(left, right) {
	return exactRecord(left.spec, right.spec) && left.value === right.value;
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function planTopology(plan) {
	return {
		fields: plan.fields.map((field) => ({
			id: field.id,
			storage: field.storage,
			descriptorContentHash: field.descriptor.contentHash,
		})),
		passes: plan.passes.map((pass) => ({
			id: pass.id,
			kind: pass.kind,
			order: pass.order,
			inputs: pass.inputs,
			output: pass.output,
			moduleOwners: pass.modules.map((module) => module.owner),
		})),
		result: plan.result,
	};
}

function createReducedN4PlanOwners(Geometry) {
	const sourcePosition = position([4_800_000, 0, 4_800_000]);
	const geometry = new Geometry({
		observerPosition: position([0, 0, 5]),
		sourcePosition,
		topAltitude: distance(100_000),
		cacheRadialMaximum: distance(4_800_000),
	});
	const sourceConfiguration = {
		sourceKey: 'contained-flat-fib34-transport-packing-smoke',
		position: sourcePosition,
		sourceIrradiance: NATIVE_SOURCE_IRRADIANCE_DENSITY,
		referenceDistance: distance(4_800_000),
		referenceSpectralIncidentScale: 1,
		radius: distance(25_749.504),
		distanceFalloff: true,
		sourceTransmittanceIntervalCount: 15,
	};
	const physicalSource = new LocalSunLightSource(sourceConfiguration);
	const shellFactCache = createLocalSunShellFactCache({
		sourceConfiguration: physicalSource.configuration,
	});
	return {
		geometry,
		atmosphere: new CanonicalAtmosphere({
			constants: CANONICAL_ATMOSPHERE_CONSTANTS,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		}),
		source: new LocalSunCacheSource({
			source: physicalSource,
			shellFactCache,
		}),
	};
}

function sourcePhysicalOffset(packing, queryIndex, tapIndex, componentIndex) {
	const columns = packing.physical.queryColumnCount;
	const row = Math.floor(queryIndex / columns);
	const column = queryIndex % columns;
	const x = ((column * packing.logical.tapCount + tapIndex) * 3)
		+ componentIndex;
	return row * packing.physical.sources.shape[0] + x;
}

function coefficientPhysicalOffset(
	packing,
	queryIndex,
	tapIndex,
	wavelengthIndex,
) {
	const columns = packing.physical.queryColumnCount;
	const row = Math.floor(queryIndex / columns);
	const column = queryIndex % columns;
	const width = packing.physical.coefficients.shape[0];
	const height = packing.physical.coefficients.shape[1];
	const x = column * packing.logical.tapCount + tapIndex;
	return (wavelengthIndex * height + row) * width + x;
}

const actualWorstCase = deriveControlledFlatTransportPacking({
	queryCount: 285 * 34,
	tapCount:
		CONTROLLED_FLAT_FIBONACCI34_TRANSPORT_PACKING_POLICY
			.maximumLogicalTapCount,
	wavelengthCount: 15,
});
assert(actualWorstCase.physical.queryColumnCount === 2,
	'FIB34 default packing must use exactly two query columns.');
assert(actualWorstCase.physical.queryRowCount === 4845,
	'FIB34 query rows must be 4,845.');
assert(actualWorstCase.physical.sources.shape[0] === 1536,
	'Worst-case source width must be 1,536.');
assert(actualWorstCase.physical.coefficients.shape[0] === 512,
	'Worst-case coefficient width must be 512.');
assert([ 
	actualWorstCase.physical.queryRowCount,
	actualWorstCase.physical.sources.shape[0],
	actualWorstCase.physical.coefficients.shape[0],
].every((extent) => extent
	<= CONTROLLED_FLAT_FIBONACCI34_TRANSPORT_PACKING_POLICY.maximumTextureSize),
'Every FIB34 physical texture axis must fit the evidenced 8,192 limit.');
assert(OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY.incomingDirectionCount === 34
	&& OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY.selectionOptions
		=== 'none-candidate-defaults-only'
	&& /^sha256:[0-9a-f]{64}$/u.test(
		OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY.contentHash,
	),
'The observed local-Sun wrapper must identify the unmodified candidate F34 selection and no probes.');

expectThrow(
	() => deriveControlledFlatTransportPacking({
		queryCount: 10,
		tapCount: 1,
		wavelengthCount: 1,
		minimumQueryColumnCount: 1,
	}),
	/at least two/u,
	'One-column policy must be rejected.',
);

const queryCount = 31;
const tapCount = 2;
const wavelengthCount = 3;
const sourceValues = Array.from(
	{length: queryCount * tapCount * 3},
	(_unused, index) => index + 0.25,
);
const coefficientValues = Array.from(
	{length: wavelengthCount * queryCount * tapCount},
	(_unused, index) => -index - 0.5,
);
const logical = {
	queryCount,
	tapCount,
	sources: createCacheData({
		id: 'smoke-flat-transport-sources',
		quantity: 'transport-source-address-and-active-flag',
		units: '1',
		shape: [tapCount * 3, queryCount],
		values: sourceValues,
	}),
	coefficients: createCacheData({
		id: 'smoke-flat-transport-coefficients',
		quantity: 'transport-path-coefficient',
		units: 'meters',
		shape: [tapCount, queryCount, wavelengthCount],
		values: coefficientValues,
	}),
};
const tiled = tileControlledFlatTransportData(logical, {
	maximumTextureSize: 24,
	minimumQueryColumnCount: 2,
});
const packing = tiled.controlledPacking.packing;
assert(packing.physical.queryColumnCount === 2
	&& packing.physical.queryRowCount === 16
	&& packing.physical.unusedQuerySlotCount === 1,
'Synthetic non-divisible queries must use a two-by-sixteen grid.');

let preservedSourceScalarCount = 0;
for (let queryIndex = 0; queryIndex < queryCount; queryIndex += 1) {
	for (let tapIndex = 0; tapIndex < tapCount; tapIndex += 1) {
		for (let componentIndex = 0; componentIndex < 3; componentIndex += 1) {
			const logicalOffset =
				(queryIndex * tapCount + tapIndex) * 3 + componentIndex;
			assert(
				tiled.sources.values[sourcePhysicalOffset(
					packing,
					queryIndex,
					tapIndex,
					componentIndex,
				)] === logical.sources.values[logicalOffset],
				'Source tiling changed a logical scalar.',
			);
			preservedSourceScalarCount += 1;
		}
	}
}

let preservedCoefficientScalarCount = 0;
for (
	let wavelengthIndex = 0;
	wavelengthIndex < wavelengthCount;
	wavelengthIndex += 1
) {
	for (let queryIndex = 0; queryIndex < queryCount; queryIndex += 1) {
		for (let tapIndex = 0; tapIndex < tapCount; tapIndex += 1) {
			const logicalOffset =
				(wavelengthIndex * queryCount + queryIndex) * tapCount
					+ tapIndex;
			assert(
				tiled.coefficients.values[coefficientPhysicalOffset(
					packing,
					queryIndex,
					tapIndex,
					wavelengthIndex,
				)] === logical.coefficients.values[logicalOffset],
				'Coefficient tiling changed a logical scalar.',
			);
			preservedCoefficientScalarCount += 1;
		}
	}
}

const sourcePaddingCount = tiled.sources.values.filter(
	(value) => value === 0,
).length;
const coefficientPaddingCount = tiled.coefficients.values.filter(
	(value) => value === 0,
).length;
assert(
	sourcePaddingCount === packing.physical.sources.paddingScalarCount
		&& coefficientPaddingCount
			=== packing.physical.coefficients.paddingScalarCount,
	'Every physical padding scalar must be exact zero.',
);
assert(tiled.sources.contentHash !== logical.sources.contentHash
	&& tiled.coefficients.contentHash !== logical.coefficients.contentHash,
'Physical shape changes must change both CacheData identities.');
assert(Object.isFrozen(tiled.controlledPacking)
	&& Object.isFrozen(tiled.controlledPacking.packing)
	&& Object.isFrozen(tiled.controlledPacking.packing.physical.sources.shape),
'Packing diagnostics must be deeply immutable.');
assert(tiled.controlledPacking.sourceValuesSameObject === false
	&& tiled.controlledPacking.coefficientValuesSameObject === false,
'A padded packing diagnostic must report that both value arrays were reframed.');

function nonReadableValues(length) {
	return new Proxy({length}, {
		get(target, property) {
			if (property === 'length') return target.length;
			throw new Error('Divisible full-path values were unexpectedly read.');
		},
		ownKeys() {
			throw new Error('Divisible full-path values were unexpectedly hashed.');
		},
	});
}

function indexReadableValues(length, valueAtIndex) {
	return new Proxy({length}, {
		get(target, property) {
			if (property === 'length') return target.length;
			const index = Number(property);
			if (Number.isSafeInteger(index) && index >= 0 && index < length) {
				return valueAtIndex(index);
			}
			throw new Error('Worst-case seam evidence read outside its declared scalar extent.');
		},
		ownKeys() {
			throw new Error('Worst-case seam values were unexpectedly iterated or hashed.');
		},
	});
}

const fullSourceValues = nonReadableValues(9690 * 3);
const fullCoefficientValues = nonReadableValues(9690 * 15);
const fullDivisibleLogical = {
	queryCount: 9690,
	tapCount: 1,
	sources: {
		id: 'full-divisible-source-parent',
		quantity: 'transport-source-address-and-active-flag',
		units: '1',
		shape: [3, 9690],
		values: fullSourceValues,
		contentHash: `sha256:${'1'.repeat(64)}`,
	},
	coefficients: {
		id: 'full-divisible-coefficient-parent',
		quantity: 'transport-path-coefficient',
		units: 'meters',
		shape: [1, 9690, 15],
		values: fullCoefficientValues,
		contentHash: `sha256:${'2'.repeat(64)}`,
	},
};
const fullDivisibleTiled = tileControlledFlatTransportData(
	fullDivisibleLogical,
);
assert(fullDivisibleTiled.sources.values === fullSourceValues
	&& fullDivisibleTiled.coefficients.values === fullCoefficientValues
	&& fullDivisibleTiled.controlledPacking.sourceValuesSameObject === true
	&& fullDivisibleTiled.controlledPacking
		.coefficientValuesSameObject === true
	&& fullDivisibleTiled.controlledPacking.packing.physical
		.unusedQuerySlotCount === 0,
'The divisible 9,690-query path must preserve both parent value references and add no padding.');

const seamTapCount =
	CONTROLLED_FLAT_FIBONACCI34_TRANSPORT_PACKING_POLICY
		.maximumLogicalTapCount;
const seamSourceValues = indexReadableValues(
	9_690 * seamTapCount * 3,
	(index) => index + 0.25,
);
const seamCoefficientValues = indexReadableValues(
	9_690 * seamTapCount * 15,
	(index) => -index - 0.5,
);
const seamTiled = tileControlledFlatTransportData({
	queryCount: 9_690,
	tapCount: seamTapCount,
	sources: {
		id: 'full-fib34-seam-source-parent',
		quantity: 'transport-source-address-and-active-flag',
		units: '1',
		shape: [seamTapCount * 3, 9_690],
		values: seamSourceValues,
		contentHash: `sha256:${'3'.repeat(64)}`,
	},
	coefficients: {
		id: 'full-fib34-seam-coefficient-parent',
		quantity: 'transport-path-coefficient',
		units: 'meters',
		shape: [seamTapCount, 9_690, 15],
		values: seamCoefficientValues,
		contentHash: `sha256:${'4'.repeat(64)}`,
	},
});
const seamPacking = seamTiled.controlledPacking.packing;
const seamQueryIndices = [0, 1, 2, 9_687, 9_688, 9_689];
const seamAddressAudits = seamQueryIndices.map((queryIndex) => {
	const queryColumn = queryIndex
		% seamPacking.physical.queryColumnCount;
	const queryRow = Math.floor(
		queryIndex / seamPacking.physical.queryColumnCount,
	);
	const tapIndex = seamTapCount - 1;
	const sourceComponentIndex = 2;
	const wavelengthIndex = 14;
	const sourceX = ((queryColumn * seamTapCount + tapIndex) * 3)
		+ sourceComponentIndex;
	const coefficientX = queryColumn * seamTapCount + tapIndex;
	const sourceLogicalOffset =
		(queryIndex * seamTapCount + tapIndex) * 3
			+ sourceComponentIndex;
	const sourceOffset = sourcePhysicalOffset(
		seamPacking,
		queryIndex,
		tapIndex,
		sourceComponentIndex,
	);
	const coefficientLogicalOffset =
		(wavelengthIndex * 9_690 + queryIndex) * seamTapCount
			+ tapIndex;
	const coefficientOffset = coefficientPhysicalOffset(
		seamPacking,
		queryIndex,
		tapIndex,
		wavelengthIndex,
	);
	assert(queryColumn >= 0
		&& queryColumn < seamPacking.physical.queryColumnCount
		&& queryRow >= 0
		&& queryRow < seamPacking.physical.queryRowCount
		&& sourceX >= 0
		&& sourceX < seamPacking.physical.sources.shape[0]
		&& coefficientX >= 0
		&& coefficientX
			< seamPacking.physical.coefficients.shape[0]
		&& wavelengthIndex
			< seamPacking.physical.coefficients.shape[2]
		&& sourceOffset >= 0
		&& sourceOffset
			< seamPacking.physical.sources.scalarCount
		&& coefficientOffset >= 0
		&& coefficientOffset
			< seamPacking.physical.coefficients.scalarCount,
	'Every declared FIB34 seam probe must remain inside every physical texture axis and scalar extent.');
	assert(sourceOffset === sourceLogicalOffset
		&& coefficientOffset === coefficientLogicalOffset
		&& seamTiled.sources.values[sourceOffset]
			=== seamSourceValues[sourceLogicalOffset]
		&& seamTiled.coefficients.values[coefficientOffset]
			=== seamCoefficientValues[coefficientLogicalOffset],
	'Two-column physical addressing must preserve the exact logical value at every declared seam probe.');
	return {
		queryIndex,
		queryColumn,
		queryRow,
		tapIndex,
		sourceComponentIndex,
		wavelengthIndex,
		sourceX,
		coefficientX,
		sourceLogicalOffset,
		sourcePhysicalOffset: sourceOffset,
		coefficientLogicalOffset,
		coefficientPhysicalOffset: coefficientOffset,
	};
});
assert(seamTiled.sources.values === seamSourceValues
	&& seamTiled.coefficients.values === seamCoefficientValues
	&& seamTiled.controlledPacking.sourceValuesSameObject === true
	&& seamTiled.controlledPacking.coefficientValuesSameObject === true
	&& seamAddressAudits[1].queryColumn === 1
	&& seamAddressAudits[2].queryColumn === 0
	&& seamAddressAudits[2].queryRow === 1
	&& seamAddressAudits.at(-1).sourceX
		=== seamPacking.physical.sources.shape[0] - 1
	&& seamAddressAudits.at(-1).coefficientX
		=== seamPacking.physical.coefficients.shape[0] - 1
	&& seamAddressAudits.at(-1).sourcePhysicalOffset
		=== seamPacking.physical.sources.scalarCount - 1
	&& seamAddressAudits.at(-1).coefficientPhysicalOffset
		=== seamPacking.physical.coefficients.scalarCount - 1,
'The seam set must cross column 1 to the next row and reach the final source component and wavelength-14 coefficient scalar exactly.');

const shaderSource = createControlledFlatTransportFetchBlockSource();
assert(shaderSource.includes(
	'queryIndex % CACHE_TRANSPORT_QUERY_COLUMN_COUNT'),
'GLSL must derive the physical query column.');
assert(shaderSource.includes(
	'queryIndex / CACHE_TRANSPORT_QUERY_COLUMN_COUNT'),
'GLSL must derive the physical query row.');
assert(shaderSource.includes(
	'queryCoordinate.x * CACHE_TRANSPORT_TAP_COUNT + tapIndex'),
'GLSL must retain tap-fastest addressing inside each query column.');
assert(!shaderSource.includes('ivec2(sourceOffset, queryIndex)')
	&& !shaderSource.includes('ivec3(tapIndex, queryIndex, wavelengthIndex)'),
'GLSL must not retain either unbounded query-height fetch.');

const distance = (value) => ({value, units: 'meters'});
const position = (coordinates) => ({coordinates, units: 'meters'});
const geometry = new ControlledFlatEarthFibonacci34TransportGeometry({
	observerPosition: position([0, 0, 5]),
	sourcePosition: position([0, 6283427.593407407, 4828032]),
	topAltitude: distance(100000),
	cacheRadialMaximum: distance(6283427.593407407),
	sceneSkyRayLimit: distance(1926774),
	observerCenteredDome: {
		centerPolicy: 'observer-centered',
		apexAltitude: distance(100000),
		maxObserverViewRayExtent: distance(1926774),
	},
});
const domains =
	LocalSunConstructionDomainSelection.fromGeometry(
		geometry,
		{zCount: 2, rhoCount: 2},
	);
const atmosphere = new CanonicalAtmosphere({
	constants: CANONICAL_ATMOSPHERE_CONSTANTS,
	spectralBasis: NATIVE_15_SPECTRAL_BASIS,
});
const integratedTransportData = geometry.createTransportData({
	atmosphere,
	domains,
	intervalCount: 15,
});
const integratedTransportContext = {
	kind: 'transport',
	domains,
	transportData: integratedTransportData,
};
const pinnedBaseModule = FlatEarthGeometry.prototype.createCacheModule.call(
	geometry,
	integratedTransportContext,
);
const integratedModule = geometry.createCacheModule(
	integratedTransportContext,
);
const integratedDiagnostic =
	geometry.controlledTransportPackingDiagnostics[0];
const integratedGeometryDescriptor = geometry.describe();
const integratedFetchBlocks = integratedModule.blocks.filter(
	(block) => block.id === 'flat-geometry-transport-data',
);
const integratedColumnBindings = integratedModule.bindings.filter(
	(binding) => binding.spec.name
		=== 'CACHE_TRANSPORT_QUERY_COLUMN_COUNT',
);
const integratedModuleDiagnostic =
	geometry.controlledTransportModuleDiagnostics[0];
const stalePackingDiagnostic = {
	...integratedDiagnostic,
	outputs: {
		...integratedDiagnostic.outputs,
		sources: {
			...integratedDiagnostic.outputs.sources,
			contentHash: `sha256:${'0'.repeat(64)}`,
		},
	},
};
expectThrow(
	() => geometry.createCacheModule({
		...integratedTransportContext,
		transportData: {
			...integratedTransportData,
			controlledPacking: stalePackingDiagnostic,
		},
	}),
	/does not describe the exact bound transport data/u,
	'A stale packing diagnostic with a substituted output identity must be rejected before module publication.',
);
const baseFetchBlock = pinnedBaseModule.blocks.find(
	(block) => block.id === 'flat-geometry-transport-data',
);
const untouchedBaseBlocks = pinnedBaseModule.blocks.filter(
	(block) => block.id !== 'flat-geometry-transport-data',
);
const untouchedControlledBlocks = integratedModule.blocks.filter(
	(block) => block.id !== 'flat-geometry-transport-data',
);
const untouchedControlledBindings = integratedModule.bindings.filter(
	(binding) => binding.spec.name
		!== 'CACHE_TRANSPORT_QUERY_COLUMN_COUNT',
);
assert(geometry.controlledTransportPackingDiagnostics.length === 1
	&& Object.isFrozen(geometry.controlledTransportPackingDiagnostics)
	&& integratedDiagnostic === integratedTransportData.controlledPacking,
'The geometry must publish one immutable diagnostic for its one derivation.');
assert(integratedTransportData.queryCount === 4 * 34
	&& integratedDiagnostic.packing.logical.queryCount === 4 * 34,
'The reduced integration must retain all four-by-34 logical queries.');
assert(integratedFetchBlocks.length === 1
	&& integratedFetchBlocks[0].source === shaderSource
	&& integratedColumnBindings.length === 1
	&& integratedColumnBindings[0].value
		=== integratedDiagnostic.packing.physical.queryColumnCount,
'The integrated transport module must replace exactly one fetch block and bind its exact column count.');
assert(baseFetchBlock.source
	=== PINNED_BASE_FLAT_TRANSPORT_FETCH_BLOCK_SOURCE,
'The inherited base fetch block must equal the complete pinned source.');
assert(untouchedControlledBlocks.length === untouchedBaseBlocks.length
	&& untouchedBaseBlocks.every((block, index) =>
		exactRecord(block, untouchedControlledBlocks[index]))
	&& untouchedControlledBindings.length
		=== pinnedBaseModule.bindings.length
	&& pinnedBaseModule.bindings.every((binding, index) =>
		exactBinding(binding, untouchedControlledBindings[index])),
'Every block and binding outside the one fetch replacement/new define must remain exactly equal.');
assert(geometry.controlledTransportModuleDiagnostics.length === 1
	&& Object.isFrozen(geometry.controlledTransportModuleDiagnostics)
	&& Object.isFrozen(integratedModuleDiagnostic)
	&& integratedModuleDiagnostic.untouchedBlockCount
		=== untouchedBaseBlocks.length
	&& integratedModuleDiagnostic.untouchedBindingCount
		=== pinnedBaseModule.bindings.length,
'The exact replacement audit must be exposed as one immutable module diagnostic.');
assert(integratedModule.id
	=== 'contained-flat-earth-fibonacci34-tiled-transport-module-v1',
'The integrated module must expose the contained transport identity.');
assert(integratedGeometryDescriptor.kind === 'flat-earth-geometry'
	&& integratedGeometryDescriptor.controlledTransportPacking.policyId
		=== CONTROLLED_FLAT_FIBONACCI34_TRANSPORT_PACKING_POLICY.id
	&& integratedGeometryDescriptor.controlledTransportPacking
		.minimumQueryColumnCount === 2
	&& Object.isFrozen(
		integratedGeometryDescriptor.controlledTransportPacking,
	),
'Geometry identity must include the immutable contained packing/addressing policy.');

const baselinePlanOwners = createReducedN4PlanOwners(FlatEarthGeometry);
const controlledPlanOwners = createReducedN4PlanOwners(
	ControlledFlatEarthFibonacci34TransportGeometry,
);
const baselinePlanDomains =
	LocalSunConstructionDomainSelection.fromGeometry(
		baselinePlanOwners.geometry,
		{zCount: 2, rhoCount: 2},
	);
const controlledPlanDomains =
	LocalSunConstructionDomainSelection.fromGeometry(
		controlledPlanOwners.geometry,
		{zCount: 2, rhoCount: 2},
	);
assert(baselinePlanDomains.incomingDirectionCount === 34
	&& controlledPlanDomains.incomingDirectionCount === 34
	&& baselinePlanDomains.outgoingDirectionCount === 4_374
	&& controlledPlanDomains.outgoingDirectionCount === 4_374
	&& baselinePlanDomains.positionCount === 4
	&& controlledPlanDomains.positionCount === 4,
'Both reduced plans must use the same real controlled FIB34/W27/z2-rho2 domains.');
assert(baselinePlanDomains.positionDomain.contentHash
		=== controlledPlanDomains.positionDomain.contentHash
	&& baselinePlanDomains.outgoingDirectionDomain.contentHash
		=== controlledPlanDomains.outgoingDirectionDomain.contentHash
	&& baselinePlanDomains.incomingDirectionDomain.contentHash
		=== controlledPlanDomains.incomingDirectionDomain.contentHash
	&& baselinePlanDomains.spectralBasis.contentHash
		=== controlledPlanDomains.spectralBasis.contentHash,
'Baseline and tiled-plan construction domains must be physically identical.');

const baselinePlan = createLocalSunCacheBuildPlan({
	...baselinePlanOwners,
	groundBoundary: null,
	maximumScatteringOrder: 4,
	domainSelection: baselinePlanDomains,
});
const controlledPlan = createLocalSunCacheBuildPlan({
	...controlledPlanOwners,
	groundBoundary: null,
	maximumScatteringOrder: 4,
	domainSelection: controlledPlanDomains,
});
const baselineTopology = planTopology(baselinePlan);
const controlledTopology = planTopology(controlledPlan);
assert(baselinePlan.fields.length === 10
	&& controlledPlan.fields.length === 10
	&& baselinePlan.passes.length === 10
	&& controlledPlan.passes.length === 10
	&& exactJson(baselineTopology, controlledTopology),
'The tiled adapter must preserve the complete real N4 10-pass/10-field graph topology.');
assert(baselinePlan.identity.contentHash
	!== controlledPlan.identity.contentHash,
'The tiled physical transport modules must change the complete plan identity.');

let tiledTransportModuleCount = 0;
let unchangedNontransportModuleCount = 0;
let unchangedTransportCompanionModuleCount = 0;
const transportModuleAudits = [];
for (let passIndex = 0; passIndex < baselinePlan.passes.length; passIndex += 1) {
	const baselinePass = baselinePlan.passes[passIndex];
	const controlledPass = controlledPlan.passes[passIndex];
	assert(baselinePass.modules.length === controlledPass.modules.length,
		'N4 pass module cardinality changed.');
	for (
		let moduleIndex = 0;
		moduleIndex < baselinePass.modules.length;
		moduleIndex += 1
	) {
		const baselineModule = baselinePass.modules[moduleIndex];
		const controlledModule = controlledPass.modules[moduleIndex];
		if (controlledPass.kind === 'transport'
			&& controlledModule.owner === 'geometry') {
			tiledTransportModuleCount += 1;
			assert(baselineModule.owner === 'geometry'
				&& baselineModule.id
					=== 'algorithm32-flat-earth-transport-module-v3'
				&& controlledModule.id
					=== 'contained-flat-earth-fibonacci34-tiled-transport-module-v1'
				&& baselineModule.contentHash
					!== controlledModule.contentHash,
			'The only changed N4 module must be the tiled geometry transport module.');
			assert(exactJson(baselineModule.provides, controlledModule.provides)
				&& exactJson(baselineModule.requires, controlledModule.requires),
			'The tiled transport module must preserve its graph capabilities.');

			const baseSourceBinding = baselineModule.bindings.find(
				(binding) => binding.spec.name === 'uCacheTransportSources',
			);
			const baseCoefficientBinding = baselineModule.bindings.find(
				(binding) => binding.spec.name
					=== 'uCacheTransportCoefficients',
			);
			const controlledSourceBinding = controlledModule.bindings.find(
				(binding) => binding.spec.name === 'uCacheTransportSources',
			);
			const controlledCoefficientBinding = controlledModule.bindings.find(
				(binding) => binding.spec.name
					=== 'uCacheTransportCoefficients',
			);
			const columnBindings = controlledModule.bindings.filter(
				(binding) => binding.spec.name
					=== 'CACHE_TRANSPORT_QUERY_COLUMN_COUNT',
			);
			assert(baseSourceBinding && baseCoefficientBinding
				&& controlledSourceBinding && controlledCoefficientBinding
				&& exactRecord(
					baseSourceBinding.spec,
					controlledSourceBinding.spec,
				)
				&& exactRecord(
					baseCoefficientBinding.spec,
					controlledCoefficientBinding.spec,
				)
				&& controlledModule.bindings.length
					=== baselineModule.bindings.length + 1
				&& columnBindings.length === 1,
			'Transport bindings may change only their physical data values plus one collision-free column define.');
			const packingDiagnostic = controlledPlanOwners.geometry
				.controlledTransportPackingDiagnostics[0];
			assert(packingDiagnostic.inputs.sources.contentHash
					=== baseSourceBinding.value.contentHash
				&& packingDiagnostic.inputs.coefficients.contentHash
					=== baseCoefficientBinding.value.contentHash
				&& packingDiagnostic.outputs.sources.contentHash
					=== controlledSourceBinding.value.contentHash
				&& packingDiagnostic.outputs.coefficients.contentHash
					=== controlledCoefficientBinding.value.contentHash,
			'Tiled transport CacheData identities must derive from the exact logical N4 parents bound by the baseline plan.');
			transportModuleAudits.push({
				passId: controlledPass.id,
				order: controlledPass.order,
				baselineModule: {
					id: baselineModule.id,
					contentHash: baselineModule.contentHash,
				},
				controlledModule: {
					id: controlledModule.id,
					contentHash: controlledModule.contentHash,
				},
				queryColumnCount: columnBindings[0].value,
			});
		} else {
			assert(baselineModule.id === controlledModule.id
				&& baselineModule.owner === controlledModule.owner
				&& baselineModule.contentHash
					=== controlledModule.contentHash,
			'Every module outside the two geometry transport replacements must remain exact.');
			if (controlledPass.kind === 'transport') {
				unchangedTransportCompanionModuleCount += 1;
			} else {
				unchangedNontransportModuleCount += 1;
			}
		}
	}
}
const reducedPlanPackingDiagnostics = controlledPlanOwners.geometry
	.controlledTransportPackingDiagnostics;
const reducedPlanModuleDiagnostics = controlledPlanOwners.geometry
	.controlledTransportModuleDiagnostics;
assert(tiledTransportModuleCount === 2
	&& baselinePlan.passes.filter((pass) => pass.kind === 'transport').length
		=== 2
	&& controlledPlan.passes.filter((pass) => pass.kind === 'transport').length
		=== 2
	&& reducedPlanPackingDiagnostics.length === 1
	&& reducedPlanModuleDiagnostics.length === 2
	&& reducedPlanModuleDiagnostics.every(Object.isFrozen)
	&& exactJson(
		reducedPlanModuleDiagnostics[0],
		reducedPlanModuleDiagnostics[1],
	),
'The real reduced N4 plan must derive once and install exactly two immutable tiled transport modules.');
assert(exactJson(
	transportModuleAudits.map(({passId, order}) => ({passId, order})),
	[
		{passId: 'local-sun-transport-j2-to-l2', order: 2},
		{passId: 'local-sun-transport-j3-to-l3', order: 3},
	],
), 'The tiled modules must replace exactly the J2-to-L2 and J3-to-L3 transport passes.');

const controlledPlanBindingNames = controlledPlan.passes.flatMap(
	(pass) => pass.modules.flatMap(
		(module) => module.bindings.map((binding) => binding.spec.name),
	),
);
assert(controlledPlanBindingNames.filter(
	(name) => name === 'CACHE_TRANSPORT_QUERY_COLUMN_COUNT',
).length === 2,
'The new query-column define must occur exactly once in each transport pass and nowhere else.');

const result = {
	smokeId: 'controlled-flat-fibonacci34-transport-packing-smoke-v1',
	accepted: true,
	policy: CONTROLLED_FLAT_FIBONACCI34_TRANSPORT_PACKING_POLICY,
	observedLocalSunPolicy: OBSERVED_LOCAL_SUN_FIBONACCI34_POLICY,
	actualWorstCase,
	synthetic: {
		packing: tiled.controlledPacking,
		preservedSourceScalarCount,
		preservedCoefficientScalarCount,
		sourcePaddingCount,
		coefficientPaddingCount,
		shaderSourceContentHash: sha256Descriptor({shaderSource}),
	},
	fullDivisibleReferenceIdentity: {
		queryCount: fullDivisibleLogical.queryCount,
		queryColumnCount: fullDivisibleTiled.controlledPacking.packing
			.physical.queryColumnCount,
		queryRowCount: fullDivisibleTiled.controlledPacking.packing
			.physical.queryRowCount,
		sourceValuesSameObject:
			fullDivisibleTiled.sources.values === fullSourceValues,
		coefficientValuesSameObject:
			fullDivisibleTiled.coefficients.values
				=== fullCoefficientValues,
		sourceContentHash: fullDivisibleTiled.sources.contentHash,
		coefficientContentHash:
			fullDivisibleTiled.coefficients.contentHash,
	},
	fullFib34SeamEvidence: {
		packingContentHash: seamPacking.contentHash,
		sourceValuesSameObject:
			seamTiled.controlledPacking.sourceValuesSameObject,
		coefficientValuesSameObject:
			seamTiled.controlledPacking.coefficientValuesSameObject,
		queryIndices: seamQueryIndices,
		lastTapIndex: seamTapCount - 1,
		lastSourceComponentIndex: 2,
		lastWavelengthIndex: 14,
		addressAudits: seamAddressAudits,
	},
	integratedReducedPlanSurface: {
		geometryControlledTransportPacking:
			integratedGeometryDescriptor.controlledTransportPacking,
		domainSelectionId: domains.id,
		incomingDirectionCount: domains.incomingDirectionCount,
		outgoingDirectionCount: domains.outgoingDirectionCount,
		positionCount: domains.positionCount,
		transportQueryCount: integratedTransportData.queryCount,
		packingDiagnostic: integratedDiagnostic,
		module: {
			id: integratedModule.id,
			contentHash: integratedModule.contentHash,
			queryColumnCount: integratedColumnBindings[0].value,
			fetchBlockContentHash: sha256Descriptor({
				source: integratedFetchBlocks[0].source,
			}),
			diagnostic: integratedModuleDiagnostic,
		},
	},
	reducedRealN4Plan: {
		baselineIdentity: baselinePlan.identity,
		controlledIdentity: controlledPlan.identity,
		fieldCount: controlledPlan.fields.length,
		passCount: controlledPlan.passes.length,
		result: controlledPlan.result,
		topologyContentHash: sha256Descriptor(controlledTopology),
		tiledTransportModuleCount,
		unchangedNontransportModuleCount,
		unchangedTransportCompanionModuleCount,
		transportModuleAudits,
		packingDiagnostic: reducedPlanPackingDiagnostics[0],
		moduleDiagnostics: reducedPlanModuleDiagnostics,
	},
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
