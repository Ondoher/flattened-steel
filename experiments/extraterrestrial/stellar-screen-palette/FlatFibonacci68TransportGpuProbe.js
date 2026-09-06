import {sha256Descriptor} from
	'../candidate/src/algorithm32/descriptors/descriptorSupport.js';
import {
	CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY,
	createControlledFlatTransportFetchBlockSource,
} from './ControlledFlatEarthFibonacci68TransportGeometry.js';

const QUERY_COUNT = 285 * 68;
const INCOMING_DIRECTION_COUNT = 68;
const POSITION_COUNT = 285;
const WAVELENGTH_COUNT = 15;
const QUERY_COLUMN_COUNT = 3;
const QUERY_ROW_COUNT = QUERY_COUNT / QUERY_COLUMN_COUNT;
const MAXIMUM_PROBE_SCALAR_COUNT = 4096;
const FLOAT32_UNIT_ROUNDOFF = 2 ** -24;
const FLOAT32_MINIMUM_SUBNORMAL = 2 ** -149;
const CONTROLLED_MODULE_ID =
	'contained-flat-earth-tiled-transport-module-v1';
const CONTROLLED_BLOCK_ID = 'flat-geometry-transport-data';
const BINARY32_REPLAY_EQUATION = {
	product:
		'p_i = fround(fround(inputDensity_i) * fround(coefficient_i))',
	sum: 's_0 = 0; s_(i+1) = fround(s_i + p_i)',
	absoluteError: '|gpuOutput - s_n|',
	forwardBound:
		'max(8 * gamma_(2n) * sum_i |inputDensity_i * coefficient_i|, 8 * (2n) * 2^-149), where gamma_k = (k * 2^-24) / (1 - k * 2^-24)',
	zeroPolicy:
		'An individual selected pair may be exact zero only when both the canonical binary32 replay and GPU output are exact zero; each transport pass must retain at least one strictly positive selected pair.',
};

const TRANSPORT_BINDING_SPECS = {
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
	queryColumnCount: {
		id: 'controlled-flat-transport-query-column-count',
		name: 'CACHE_TRANSPORT_QUERY_COLUMN_COUNT',
		kind: 'define',
		shaderType: 'int',
		frequency: 'build',
	},
};

const TRANSPORT_PASS_CONTRACTS = [
	{
		id: 'j2-to-l2',
		inputProducerPassId: 'local-sun-scatter-l1-to-j2',
		transportPassId: 'local-sun-transport-j2-to-l2',
		inputFieldId: 'local-sun-j2',
		outputFieldId: 'local-sun-l2',
	},
	{
		id: 'j3-to-l3',
		inputProducerPassId: 'local-sun-scatter-l2-to-j3',
		transportPassId: 'local-sun-transport-j3-to-l3',
		inputFieldId: 'local-sun-j3',
		outputFieldId: 'local-sun-l3',
	},
];

function deepFreeze(value) {
	if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
		return value;
	}
	for (const child of Object.values(value)) deepFreeze(child);
	return Object.freeze(value);
}

function requireCondition(condition, message, ErrorType = Error) {
	if (!condition) throw new ErrorType(message);
}

function exactRecord(value, expected) {
	return value !== null
		&& typeof value === 'object'
		&& Object.keys(value).length === Object.keys(expected).length
		&& Object.entries(expected).every(([key, expectedValue]) =>
			value[key] === expectedValue);
}

function exactShape(value, expected, label) {
	requireCondition(
		Array.isArray(value)
			&& value.length === expected.length
			&& value.every((extent, index) => extent === expected[index]),
		`${label} must have shape ${JSON.stringify(expected)}.`,
		RangeError,
	);
}

function requireHash(value, label) {
	requireCondition(
		typeof value === 'string' && /^sha256:[a-f0-9]{64}$/u.test(value),
		`${label} must be a SHA-256 identity.`,
		TypeError,
	);
	return value;
}

function coordinateKey(coordinate) {
	return `${coordinate.directionIndex}:${coordinate.positionIndex}`
		+ `:${coordinate.wavelengthIndex}`;
}

function createPair(queryIndex, wavelengthIndex, role) {
	return {
		id: `q${queryIndex}-w${wavelengthIndex}`,
		queryIndex,
		wavelengthIndex,
		role,
	};
}

function mandatoryPairs() {
	return [
		createPair(0, 0, 'first-query-column-0-and-layer-0'),
		createPair(1, 14, 'first-query-column-1-and-layer-14'),
		createPair(2, 0, 'first-row-column-2-before-row-seam'),
		createPair(3, 14, 'second-row-column-0-after-row-seam'),
		createPair(QUERY_COUNT - 1, 0, 'last-query'),
	];
}

function optionalPairGroups() {
	return [
		{
			id: 'incoming-direction-to-position-row-seam',
			pairs: [
				createPair(67, 0, 'last-direction-of-first-position'),
				createPair(68, 14, 'first-direction-of-second-position'),
			],
		},
		{
			id: 'middle-query-layer-0',
			pairs: [createPair(QUERY_COUNT / 2, 0, 'middle-query')],
		},
		{
			id: 'middle-query-layer-14',
			pairs: [createPair(QUERY_COUNT / 2, 14, 'middle-query')],
		},
	];
}

export const FLAT_FIBONACCI68_TRANSPORT_GPU_PROBE_POLICY = deepFreeze({
	id: 'contained-flat-fibonacci68-packed-transport-gpu-probe-v1',
	queryCount: QUERY_COUNT,
	incomingDirectionCount: INCOMING_DIRECTION_COUNT,
	positionCount: POSITION_COUNT,
	wavelengthCount: WAVELENGTH_COUNT,
	queryColumnCount: QUERY_COLUMN_COUNT,
	queryRowCount: QUERY_ROW_COUNT,
	maximumProbeScalarCount: MAXIMUM_PROBE_SCALAR_COUNT,
	maximumLogicalTapCount:
		CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
			.maximumLogicalTapCount,
	transportPassIds: TRANSPORT_PASS_CONTRACTS.map(
		(contract) => contract.transportPassId,
	),
	mandatoryPairs: mandatoryPairs(),
	optionalPairGroups: optionalPairGroups(),
	operation:
		'Probe every active input scalar and the output scalar for selected logical query/wavelength pairs in both existing Flat N4 transport passes, then independently replay the packed source/coefficient dot product.',
});

/** Pure policy audit suitable for a focused structural smoke. */
export function auditFlatFibonacci68TransportGpuProbeStructure() {
	const pairs = FLAT_FIBONACCI68_TRANSPORT_GPU_PROBE_POLICY.mandatoryPairs;
	const columns = [...new Set(
		pairs.map((pair) => pair.queryIndex % QUERY_COLUMN_COUNT),
	)].sort((left, right) => left - right);
	const layers = [...new Set(
		pairs.map((pair) => pair.wavelengthIndex),
	)].sort((left, right) => left - right);
	const worstCaseProbeScalarCount = TRANSPORT_PASS_CONTRACTS.length
		* pairs.length
		* (
			FLAT_FIBONACCI68_TRANSPORT_GPU_PROBE_POLICY
				.maximumLogicalTapCount + 1
		);
	const body = {
		schemaId: 'flat-fibonacci68-transport-gpu-probe-structure-v1',
		policyId: FLAT_FIBONACCI68_TRANSPORT_GPU_PROBE_POLICY.id,
		mandatoryPairCount: pairs.length,
		mandatoryPairs: pairs,
		coveredQueryColumns: columns,
		coveredCoefficientLayers: layers,
		coversQueryTwoToThreeRowSeam:
			pairs.some((pair) => pair.queryIndex === 2)
			&& pairs.some((pair) => pair.queryIndex === 3),
		coversLastQuery:
			pairs.some((pair) => pair.queryIndex === QUERY_COUNT - 1),
		transportPassCount: TRANSPORT_PASS_CONTRACTS.length,
		worstCaseProbeScalarCount,
		maximumProbeScalarCount: MAXIMUM_PROBE_SCALAR_COUNT,
	};
	requireCondition(
		JSON.stringify(columns) === JSON.stringify([0, 1, 2])
			&& JSON.stringify(layers) === JSON.stringify([0, 14])
			&& body.coversQueryTwoToThreeRowSeam
			&& body.coversLastQuery
			&& worstCaseProbeScalarCount <= MAXIMUM_PROBE_SCALAR_COUNT,
		'Flat FIB68 transport GPU probe policy lost mandatory address coverage.',
	);
	return deepFreeze({
		...body,
		accepted: true,
		contentHash: sha256Descriptor(body),
	});
}

function requireExactlyOne(values, predicate, label) {
	const matches = values.filter(predicate);
	requireCondition(matches.length === 1, `${label} must occur exactly once.`);
	return matches[0];
}

function requireField(fields, id) {
	const field = fields.get(id);
	requireCondition(field !== undefined, `Cache plan field ${id} is unavailable.`);
	return field;
}

function requireBinding(module, expectedSpec, label) {
	const binding = requireExactlyOne(
		module.bindings,
		(candidate) => candidate.spec.id === expectedSpec.id
			|| candidate.spec.name === expectedSpec.name,
		`${label} binding`,
	);
	requireCondition(
		exactRecord(binding.spec, expectedSpec),
		`${label} binding specification changed.`,
	);
	return binding;
}

function requireControlledModule(pass) {
	const module = requireExactlyOne(
		pass.modules,
		(candidate) => candidate.id === CONTROLLED_MODULE_ID,
		`${pass.id} controlled transport module`,
	);
	requireCondition(module.owner === 'geometry',
		`${pass.id} controlled transport module has the wrong owner.`);
	requireHash(module.contentHash, `${pass.id} controlled module`);
	const block = requireExactlyOne(
		module.blocks,
		(candidate) => candidate.id === CONTROLLED_BLOCK_ID,
		`${pass.id} controlled transport fetch block`,
	);
	requireCondition(
		exactRecord(block, {
			id: CONTROLLED_BLOCK_ID,
			phase: 'function',
			order: 0,
			source: createControlledFlatTransportFetchBlockSource(),
		}),
		`${pass.id} controlled transport fetch block changed.`,
	);
	return {
		module,
		sources: requireBinding(
			module,
			TRANSPORT_BINDING_SPECS.sources,
			`${pass.id} transport sources`,
		).value,
		coefficients: requireBinding(
			module,
			TRANSPORT_BINDING_SPECS.coefficients,
			`${pass.id} transport coefficients`,
		).value,
		tapCount: requireBinding(
			module,
			TRANSPORT_BINDING_SPECS.tapCount,
			`${pass.id} transport tap count`,
		).value,
		queryColumnCount: requireBinding(
			module,
			TRANSPORT_BINDING_SPECS.queryColumnCount,
			`${pass.id} transport query-column count`,
		).value,
	};
}

function cloneStorage(storage) {
	return {
		format: storage.format,
		width: storage.width,
		height: storage.height,
		layers: storage.layers,
	};
}

function descriptorIdentity(descriptor) {
	return {
		id: descriptor.id,
		contentHash: requireHash(descriptor.contentHash, descriptor.id),
	};
}

function requireTransportPass(plan, fields, contract) {
	const pass = requireExactlyOne(
		plan.passes,
		(candidate) => candidate.id === contract.transportPassId,
		`${contract.transportPassId} pass`,
	);
	requireCondition(
		pass.kind === 'transport'
			&& pass.inputs.length === 1
			&& pass.inputs[0] === contract.inputFieldId
			&& pass.output === contract.outputFieldId,
		`${contract.transportPassId} field topology changed.`,
	);
	const inputField = requireField(fields, contract.inputFieldId);
	const outputField = requireField(fields, contract.outputFieldId);
	exactShape(
		[
			inputField.storage.width,
			inputField.storage.height,
			inputField.storage.layers,
		],
		[4374, POSITION_COUNT, WAVELENGTH_COUNT],
		`${contract.inputFieldId} storage`,
	);
	exactShape(
		[
			outputField.storage.width,
			outputField.storage.height,
			outputField.storage.layers,
		],
		[INCOMING_DIRECTION_COUNT, POSITION_COUNT, WAVELENGTH_COUNT],
		`${contract.outputFieldId} storage`,
	);
	return {
		contract,
		pass,
		inputField,
		outputField,
		controlled: requireControlledModule(pass),
	};
}

function requireSharedTransport(plan, request) {
	requireCondition(request.maximumScatteringOrder === 4,
		'Flat transport GPU probe requires the complete N4 graph.');
	requireCondition(
		request.domainSelection?.incomingDirectionCount
			=== INCOMING_DIRECTION_COUNT
			&& request.domainSelection?.positionCount === POSITION_COUNT
			&& request.domainSelection?.spectralChannelCount === WAVELENGTH_COUNT,
		'Flat transport GPU probe requires the exact 68 by 285 by 15 domain.',
	);
	requireCondition(
		plan.identity?.id === 'algorithm32-local-sun-cache-construction-v3',
		'Flat transport GPU probe received the wrong cache plan.',
	);
	requireHash(plan.identity.contentHash, 'Flat local-Sun cache plan');

	const fields = new Map(plan.fields.map((field) => [field.id, field]));
	requireCondition(fields.size === plan.fields.length,
		'Flat cache plan contains duplicate field ids.');
	const transports = TRANSPORT_PASS_CONTRACTS.map((contract) =>
		requireTransportPass(plan, fields, contract));
	const allControlledModules = plan.passes.flatMap((pass) =>
		pass.modules.filter((module) => module.id === CONTROLLED_MODULE_ID));
	requireCondition(
		allControlledModules.length === 2
			&& transports.every((transport) =>
				allControlledModules.includes(transport.controlled.module)),
		'Flat N4 plan must contain exactly its two controlled transport modules.',
	);

	const first = transports[0].controlled;
	for (const transport of transports.slice(1)) {
		const controlled = transport.controlled;
		requireCondition(
			controlled.module.contentHash === first.module.contentHash
				&& controlled.sources === first.sources
				&& controlled.coefficients === first.coefficients
				&& controlled.tapCount === first.tapCount
				&& controlled.queryColumnCount === first.queryColumnCount,
			'The two Flat transport passes must share one exact packed kernel.',
		);
	}

	const tapCount = first.tapCount;
	requireCondition(
		Number.isSafeInteger(tapCount)
			&& tapCount >= 1
			&& tapCount
				<= CONTROLLED_FLAT_FIBONACCI68_TRANSPORT_PACKING_POLICY
					.maximumLogicalTapCount,
		'Flat transport tap count is outside the controlled bound.',
		RangeError,
	);
	requireCondition(first.queryColumnCount === QUERY_COLUMN_COUNT,
		'Flat transport must use exactly three physical query columns.');
	const sources = first.sources;
	const coefficients = first.coefficients;
	requireHash(sources.contentHash, 'Flat transport source data');
	requireHash(coefficients.contentHash, 'Flat transport coefficient data');
	exactShape(
		sources.shape,
		[tapCount * 3 * QUERY_COLUMN_COUNT, QUERY_ROW_COUNT],
		'Flat transport source data',
	);
	exactShape(
		coefficients.shape,
		[tapCount * QUERY_COLUMN_COUNT, QUERY_ROW_COUNT, WAVELENGTH_COUNT],
		'Flat transport coefficient data',
	);
	requireCondition(
		sources.values.length === sources.shape[0] * sources.shape[1]
			&& coefficients.values.length
				=== coefficients.shape[0]
					* coefficients.shape[1]
					* coefficients.shape[2],
		'Flat packed transport scalar counts do not match their physical shapes.',
		RangeError,
	);

	return {
		planIdentity: {
			id: plan.identity.id,
			contentHash: plan.identity.contentHash,
		},
		transports,
		tapCount,
		queryColumnCount: first.queryColumnCount,
		sources,
		coefficients,
		moduleIdentity: {
			id: first.module.id,
			contentHash: first.module.contentHash,
			instanceCount: allControlledModules.length,
		},
	};
}

function decodePair(shared, pair) {
	requireCondition(
		Number.isSafeInteger(pair.queryIndex)
			&& pair.queryIndex >= 0
			&& pair.queryIndex < QUERY_COUNT
			&& Number.isSafeInteger(pair.wavelengthIndex)
			&& pair.wavelengthIndex >= 0
			&& pair.wavelengthIndex < WAVELENGTH_COUNT,
		`Transport probe pair ${pair.id} is outside the logical domain.`,
		RangeError,
	);
	const queryColumn = pair.queryIndex % shared.queryColumnCount;
	const queryRow = Math.floor(pair.queryIndex / shared.queryColumnCount);
	const outputCoordinate = {
		directionIndex: pair.queryIndex % INCOMING_DIRECTION_COUNT,
		positionIndex: Math.floor(
			pair.queryIndex / INCOMING_DIRECTION_COUNT,
		),
		wavelengthIndex: pair.wavelengthIndex,
	};
	const sourceWidth = shared.sources.shape[0];
	const coefficientWidth = shared.coefficients.shape[0];
	const coefficientHeight = shared.coefficients.shape[1];
	const terms = [];
	let inactiveTapCount = 0;
	for (let tapIndex = 0; tapIndex < shared.tapCount; tapIndex += 1) {
		const sourceX = (
			queryColumn * shared.tapCount + tapIndex
		) * 3;
		const physicalSourceOffset = queryRow * sourceWidth + sourceX;
		const logicalSourceOffset =
			(pair.queryIndex * shared.tapCount + tapIndex) * 3;
		const sourceDirectionIndex =
			shared.sources.values[physicalSourceOffset];
		const sourcePositionIndex =
			shared.sources.values[physicalSourceOffset + 1];
		const active = shared.sources.values[physicalSourceOffset + 2];
		const coefficientX = queryColumn * shared.tapCount + tapIndex;
		const physicalCoefficientOffset = (
			pair.wavelengthIndex * coefficientHeight + queryRow
		) * coefficientWidth + coefficientX;
		const logicalCoefficientOffset = (
			pair.wavelengthIndex * QUERY_COUNT + pair.queryIndex
		) * shared.tapCount + tapIndex;
		const coefficient =
			shared.coefficients.values[physicalCoefficientOffset];
		requireCondition(
			sourceDirectionIndex
				=== shared.sources.values[logicalSourceOffset]
				&& sourcePositionIndex
					=== shared.sources.values[logicalSourceOffset + 1]
				&& active
					=== shared.sources.values[logicalSourceOffset + 2]
				&& coefficient
					=== shared.coefficients.values[logicalCoefficientOffset],
			`Transport probe pair ${pair.id} found a logical/physical packing mismatch.`,
		);
		requireCondition(
			Number.isFinite(sourceDirectionIndex)
				&& Number.isFinite(sourcePositionIndex)
				&& (active === 0 || active === 1)
				&& Number.isFinite(coefficient)
				&& coefficient >= 0,
			`Transport probe pair ${pair.id} contains invalid packed tap data.`,
		);
		if (active === 0) {
			requireCondition(
				sourceDirectionIndex === 0
					&& sourcePositionIndex === 0
					&& coefficient === 0,
				`Transport probe pair ${pair.id} has a nonzero inactive tap.`,
			);
			inactiveTapCount += 1;
			continue;
		}
		for (const transport of shared.transports) {
			requireCondition(
				Number.isSafeInteger(sourceDirectionIndex)
					&& sourceDirectionIndex >= 0
					&& sourceDirectionIndex
						< transport.inputField.storage.width
					&& Number.isSafeInteger(sourcePositionIndex)
					&& sourcePositionIndex >= 0
					&& sourcePositionIndex
						< transport.inputField.storage.height,
				`Transport probe pair ${pair.id} has an out-of-range active source.`,
				RangeError,
			);
		}
		terms.push({
			tapIndex,
			sourceDirectionIndex,
			sourcePositionIndex,
			coefficient,
		});
	}
	requireCondition(terms.length > 0,
		`Transport probe pair ${pair.id} has no active tap.`);
	const selectedTransportContentHash = sha256Descriptor({
		pair: {
			queryIndex: pair.queryIndex,
			wavelengthIndex: pair.wavelengthIndex,
		},
		terms,
		inactiveTapCount,
	});
	return {
		...pair,
		queryColumn,
		queryRow,
		outputCoordinate,
		terms,
		inactiveTapCount,
		selectedTransportContentHash,
	};
}

function createCoordinateMaps(transports, decodedPairs) {
	return transports.map((transport) => {
		const input = new Map();
		const output = new Map();
		for (const pair of decodedPairs) {
			for (const term of pair.terms) {
				const coordinate = {
					directionIndex: term.sourceDirectionIndex,
					positionIndex: term.sourcePositionIndex,
					wavelengthIndex: pair.wavelengthIndex,
				};
				input.set(coordinateKey(coordinate), coordinate);
			}
			output.set(
				coordinateKey(pair.outputCoordinate),
				pair.outputCoordinate,
			);
		}
		return {transport, input, output};
	});
}

function probeScalarCount(coordinateMaps) {
	return coordinateMaps.reduce(
		(total, value) => total + value.input.size + value.output.size,
		0,
	);
}

function selectPairs(shared) {
	const selected = mandatoryPairs().map((pair) => decodePair(shared, pair));
	let coordinateMaps = createCoordinateMaps(shared.transports, selected);
	requireCondition(
		probeScalarCount(coordinateMaps) <= MAXIMUM_PROBE_SCALAR_COUNT,
		'Mandatory Flat transport GPU probes exceed the executor bound.',
		RangeError,
	);
	const acceptedOptionalGroupIds = [];
	const skippedOptionalGroupIds = [];
	for (const group of optionalPairGroups()) {
		const decodedGroup = group.pairs.map((pair) => decodePair(shared, pair));
		const candidatePairs = [...selected, ...decodedGroup];
		const candidateMaps = createCoordinateMaps(
			shared.transports,
			candidatePairs,
		);
		if (probeScalarCount(candidateMaps) <= MAXIMUM_PROBE_SCALAR_COUNT) {
			selected.push(...decodedGroup);
			coordinateMaps = candidateMaps;
			acceptedOptionalGroupIds.push(group.id);
		} else {
			skippedOptionalGroupIds.push(group.id);
		}
	}
	return {
		selected,
		coordinateMaps,
		acceptedOptionalGroupIds,
		skippedOptionalGroupIds,
		probeScalarCount: probeScalarCount(coordinateMaps),
	};
}

function createProbes(selection) {
	return selection.coordinateMaps.flatMap((value) => [
		{
			field: value.transport.contract.inputFieldId,
			coordinates: [...value.input.values()],
		},
		{
			field: value.transport.contract.outputFieldId,
			coordinates: [...value.output.values()],
		},
	]);
}

function compactTransport(transport) {
	return {
		id: transport.contract.id,
		inputProducerPassId: transport.contract.inputProducerPassId,
		transportPassId: transport.contract.transportPassId,
		inputFieldId: transport.contract.inputFieldId,
		outputFieldId: transport.contract.outputFieldId,
		inputFieldDescriptor: descriptorIdentity(
			transport.inputField.descriptor,
		),
		outputFieldDescriptor: descriptorIdentity(
			transport.outputField.descriptor,
		),
		inputStorage: cloneStorage(transport.inputField.storage),
		outputStorage: cloneStorage(transport.outputField.storage),
	};
}

function prepareProbe(request) {
	const structuralAudit = auditFlatFibonacci68TransportGpuProbeStructure();
	const shared = requireSharedTransport(request.plan, request);
	const selection = selectPairs(shared);
	const probes = createProbes(selection);
	requireCondition(
		probes.reduce(
			(total, probe) => total + probe.coordinates.length,
			0,
		) === selection.probeScalarCount,
		'Flat transport GPU probe accounting is inconsistent.',
	);
	const selectedPairs = selection.selected.map((pair) => ({
		id: pair.id,
		queryIndex: pair.queryIndex,
		wavelengthIndex: pair.wavelengthIndex,
		role: pair.role,
		queryColumn: pair.queryColumn,
		queryRow: pair.queryRow,
		outputCoordinate: {...pair.outputCoordinate},
		terms: pair.terms.map((term) => ({...term})),
		inactiveTapCount: pair.inactiveTapCount,
		selectedTransportContentHash: pair.selectedTransportContentHash,
	}));
	return {
		probes,
		prepared: {
			structuralAudit,
			planIdentity: shared.planIdentity,
			moduleIdentity: shared.moduleIdentity,
			transportData: {
				tapCount: shared.tapCount,
				queryColumnCount: shared.queryColumnCount,
				sources: {
					id: shared.sources.id,
					contentHash: shared.sources.contentHash,
					shape: [...shared.sources.shape],
				},
				coefficients: {
					id: shared.coefficients.id,
					contentHash: shared.coefficients.contentHash,
					shape: [...shared.coefficients.shape],
				},
			},
			transports: shared.transports.map(compactTransport),
			selectedPairs,
			coordinateMaps: selection.coordinateMaps.map((value) => ({
				transportId: value.transport.contract.id,
				inputCoordinates: [...value.input.values()],
				outputCoordinates: [...value.output.values()],
			})),
			acceptedOptionalGroupIds: selection.acceptedOptionalGroupIds,
			skippedOptionalGroupIds: selection.skippedOptionalGroupIds,
			probeScalarCount: selection.probeScalarCount,
		},
	};
}

function requireProbePass(diagnostics, passId, field) {
	const diagnostic = requireExactlyOne(
		diagnostics.passes,
		(candidate) => candidate.id === passId,
		`${passId} diagnostic`,
	);
	requireCondition(
		diagnostic.probe !== undefined
			&& diagnostic.probe.descriptor.id === field.descriptor.id
			&& diagnostic.probe.descriptor.contentHash
				=== field.descriptor.contentHash,
		`${passId} did not return the expected field probe.`,
	);
	return diagnostic.probe;
}

function mapProbeSamples(probe, expectedCoordinates, label) {
	requireCondition(
		Array.isArray(probe.samples)
			&& probe.samples.length === expectedCoordinates.length,
		`${label} returned the wrong scalar count.`,
	);
	const expected = new Map(expectedCoordinates.map((coordinate) => [
		coordinateKey(coordinate),
		coordinate,
	]));
	const samples = new Map();
	for (const sample of probe.samples) {
		const key = coordinateKey(sample.coordinates);
		requireCondition(
			expected.has(key)
				&& !samples.has(key)
				&& Number.isFinite(sample.value)
				&& sample.value >= 0,
			`${label} returned an invalid, duplicate, or unexpected scalar.`,
		);
		samples.set(key, sample.value);
	}
	requireCondition(samples.size === expected.size,
		`${label} omitted a requested scalar.`);
	return samples;
}

function forwardErrorTolerance(termCount, absoluteTermSum) {
	const operationCount = Math.max(1, termCount * 2);
	const scaledRoundoff = operationCount * FLOAT32_UNIT_ROUNDOFF;
	requireCondition(scaledRoundoff < 1,
		'Flat transport probe cannot derive a finite binary32 error bound.');
	const gamma = scaledRoundoff / (1 - scaledRoundoff);
	return Math.max(
		8 * gamma * absoluteTermSum,
		8 * operationCount * FLOAT32_MINIMUM_SUBNORMAL,
	);
}

function evaluateTransport(prepared, transport, coordinates, diagnostics) {
	const inputProbe = requireProbePass(
		diagnostics,
		transport.inputProducerPassId,
		{descriptor: transport.inputFieldDescriptor},
	);
	const outputProbe = requireProbePass(
		diagnostics,
		transport.transportPassId,
		{descriptor: transport.outputFieldDescriptor},
	);
	const inputSamples = mapProbeSamples(
		inputProbe,
		coordinates.inputCoordinates,
		`${transport.id} input`,
	);
	const outputSamples = mapProbeSamples(
		outputProbe,
		coordinates.outputCoordinates,
		`${transport.id} output`,
	);
	const pairResults = [];
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	let maximumTolerance = 0;
	let evaluatedActiveTapCount = 0;
	for (const pair of prepared.selectedPairs) {
		let canonicalSum = 0;
		let absoluteTermSum = 0;
		const usedInputSamples = [];
		for (const term of pair.terms) {
			const coordinate = {
				directionIndex: term.sourceDirectionIndex,
				positionIndex: term.sourcePositionIndex,
				wavelengthIndex: pair.wavelengthIndex,
			};
			const density = inputSamples.get(coordinateKey(coordinate));
			requireCondition(
				Number.isFinite(density) && density >= 0,
				`${transport.id} pair ${pair.id} lacks a finite nonnegative input.`,
			);
			const product = Math.fround(
				Math.fround(density) * Math.fround(term.coefficient),
			);
			canonicalSum = Math.fround(canonicalSum + product);
			absoluteTermSum += Math.abs(density * term.coefficient);
			usedInputSamples.push({coordinate, value: density});
		}
		const actual = outputSamples.get(
			coordinateKey(pair.outputCoordinate),
		);
		const tolerance = forwardErrorTolerance(
			pair.terms.length,
			absoluteTermSum,
		);
		const absoluteError = Math.abs(actual - canonicalSum);
		const exactZeroPair = canonicalSum === 0 && actual === 0;
		const strictlyPositivePair = canonicalSum > 0 && actual > 0;
		const relativeError = exactZeroPair
			? 0
			: absoluteError / canonicalSum;
		requireCondition(
			Number.isFinite(canonicalSum)
				&& canonicalSum >= 0
				&& Number.isFinite(actual)
				&& actual >= 0
				&& (exactZeroPair || strictlyPositivePair)
				&& Number.isFinite(absoluteError)
				&& Number.isFinite(relativeError)
				&& absoluteError <= tolerance,
			`${transport.id} pair ${pair.id} failed its packed GPU dot-product oracle: ${JSON.stringify({canonicalSum, actual, absoluteError, tolerance})}`,
		);
		maximumAbsoluteError = Math.max(maximumAbsoluteError, absoluteError);
		maximumRelativeError = Math.max(maximumRelativeError, relativeError);
		maximumTolerance = Math.max(maximumTolerance, tolerance);
		evaluatedActiveTapCount += pair.terms.length;
		pairResults.push({
			id: pair.id,
			queryIndex: pair.queryIndex,
			wavelengthIndex: pair.wavelengthIndex,
			queryColumn: pair.queryColumn,
			queryRow: pair.queryRow,
			activeTapCount: pair.terms.length,
			inactiveTapCount: pair.inactiveTapCount,
			terms: pair.terms.map((term) => ({...term})),
			selectedTransportContentHash:
				pair.selectedTransportContentHash,
			inputSamples: usedInputSamples,
			inputSamplesContentHash: sha256Descriptor({
				pairId: pair.id,
				samples: usedInputSamples,
			}),
			expectedCanonicalBinary32: canonicalSum,
			actualBinary32: actual,
			absoluteError,
			relativeError,
			tolerance,
			exactZeroPair,
			accepted: true,
		});
	}
	const nonzeroPairCount = pairResults.filter((pair) =>
		pair.actualBinary32 > 0).length;
	const exactZeroPairCount = pairResults.filter((pair) =>
		pair.exactZeroPair).length;
	requireCondition(
		nonzeroPairCount >= 1
			&& pairResults.every((pair) => pair.accepted),
		`${transport.id} must retain at least one strictly positive selected pair while every selected pair passes its binary32 oracle.`,
	);
	return {
		id: transport.id,
		inputProducerPassId: transport.inputProducerPassId,
		transportPassId: transport.transportPassId,
		inputFieldId: transport.inputFieldId,
		outputFieldId: transport.outputFieldId,
		inputProbeScalarCount: inputSamples.size,
		outputProbeScalarCount: outputSamples.size,
		evaluatedActiveTapCount,
		pairCount: pairResults.length,
		nonzeroPairCount,
		exactZeroPairCount,
		maximumAbsoluteError,
		maximumRelativeError,
		maximumTolerance,
		pairs: pairResults,
		accepted: true,
	};
}

/** Pure zero/nonzero control for the retained binary32 replay evidence. */
export function auditFlatFibonacci68TransportGpuProbeEvaluation() {
	const inputDescriptor = {
		id: 'synthetic-flat-transport-input',
		contentHash: sha256Descriptor({
			id: 'synthetic-flat-transport-input',
			kind: 'probe-evaluation-control',
		}),
	};
	const outputDescriptor = {
		id: 'synthetic-flat-transport-output',
		contentHash: sha256Descriptor({
			id: 'synthetic-flat-transport-output',
			kind: 'probe-evaluation-control',
		}),
	};
	const zeroTerm = {
		tapIndex: 0,
		sourceDirectionIndex: 0,
		sourcePositionIndex: 0,
		coefficient: 1,
	};
	const positiveTerm = {
		tapIndex: 0,
		sourceDirectionIndex: 1,
		sourcePositionIndex: 0,
		coefficient: 2,
	};
	const selectedPairs = [
		{
			id: 'synthetic-zero',
			queryIndex: 0,
			wavelengthIndex: 0,
			queryColumn: 0,
			queryRow: 0,
			outputCoordinate: {
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex: 0,
			},
			terms: [zeroTerm],
			inactiveTapCount: 0,
			selectedTransportContentHash: sha256Descriptor({
				pair: {queryIndex: 0, wavelengthIndex: 0},
				terms: [zeroTerm],
				inactiveTapCount: 0,
			}),
		},
		{
			id: 'synthetic-positive',
			queryIndex: 1,
			wavelengthIndex: 0,
			queryColumn: 1,
			queryRow: 0,
			outputCoordinate: {
				directionIndex: 1,
				positionIndex: 0,
				wavelengthIndex: 0,
			},
			terms: [positiveTerm],
			inactiveTapCount: 0,
			selectedTransportContentHash: sha256Descriptor({
				pair: {queryIndex: 1, wavelengthIndex: 0},
				terms: [positiveTerm],
				inactiveTapCount: 0,
			}),
		},
	];
	const transport = {
		id: 'synthetic-zero-and-positive',
		inputProducerPassId: 'synthetic-producer',
		transportPassId: 'synthetic-transport',
		inputFieldId: inputDescriptor.id,
		outputFieldId: outputDescriptor.id,
		inputFieldDescriptor: inputDescriptor,
		outputFieldDescriptor: outputDescriptor,
	};
	const coordinates = {
		inputCoordinates: selectedPairs.map((pair) => ({
			directionIndex: pair.terms[0].sourceDirectionIndex,
			positionIndex: pair.terms[0].sourcePositionIndex,
			wavelengthIndex: pair.wavelengthIndex,
		})),
		outputCoordinates: selectedPairs.map((pair) => ({
			...pair.outputCoordinate,
		})),
	};
	const diagnostics = {
		passes: [
			{
				id: transport.inputProducerPassId,
				probe: {
					descriptor: inputDescriptor,
					samples: [
						{coordinates: coordinates.inputCoordinates[0], value: 0},
						{coordinates: coordinates.inputCoordinates[1], value: 3},
					],
				},
			},
			{
				id: transport.transportPassId,
				probe: {
					descriptor: outputDescriptor,
					samples: [
						{coordinates: coordinates.outputCoordinates[0], value: 0},
						{coordinates: coordinates.outputCoordinates[1], value: 6},
					],
				},
			},
		],
	};
	const result = evaluateTransport(
		{selectedPairs},
		transport,
		coordinates,
		diagnostics,
	);
	const body = {
		schemaId: 'flat-fibonacci68-transport-gpu-probe-evaluation-smoke-v1',
		policyId: FLAT_FIBONACCI68_TRANSPORT_GPU_PROBE_POLICY.id,
		equation: BINARY32_REPLAY_EQUATION,
		pairCount: result.pairCount,
		nonzeroPairCount: result.nonzeroPairCount,
		exactZeroPairCount: result.exactZeroPairCount,
		pairs: result.pairs,
	};
	requireCondition(
		result.accepted
			&& result.pairCount === 2
			&& result.nonzeroPairCount === 1
			&& result.exactZeroPairCount === 1
			&& result.pairs[0].exactZeroPair === true
			&& result.pairs[0].expectedCanonicalBinary32 === 0
			&& result.pairs[0].actualBinary32 === 0
			&& result.pairs[1].exactZeroPair === false
			&& result.pairs[1].expectedCanonicalBinary32 === 6
			&& result.pairs[1].actualBinary32 === 6,
		'Flat transport GPU probe zero/nonzero evaluation smoke failed.',
	);
	return deepFreeze({
		...body,
		accepted: true,
		contentHash: sha256Descriptor(body),
	});
}

function evaluatePreparedDiagnostics(prepared, value) {
	const diagnostics = value?.diagnostics ?? value;
	requireCondition(
		diagnostics !== null
			&& typeof diagnostics === 'object'
			&& Array.isArray(diagnostics.passes),
		'Flat transport GPU probe requires cache execution diagnostics.',
		TypeError,
	);
	const probedPassIds = diagnostics.passes
		.filter((pass) => pass.probe !== undefined)
		.map((pass) => pass.id)
		.sort();
	const expectedProbedPassIds = prepared.transports.flatMap((transport) => [
		transport.inputProducerPassId,
		transport.transportPassId,
	]).sort();
	requireCondition(
		JSON.stringify(probedPassIds) === JSON.stringify(expectedProbedPassIds),
		'Flat N4 execution returned an unexpected probed-pass ledger.',
	);
	const transportResults = prepared.transports.map((transport) => {
		const coordinates = requireExactlyOne(
			prepared.coordinateMaps,
			(candidate) => candidate.transportId === transport.id,
			`${transport.id} prepared coordinates`,
		);
		return evaluateTransport(
			prepared,
			transport,
			coordinates,
			diagnostics,
		);
	});
	const body = {
		schemaId: 'flat-fibonacci68-packed-transport-gpu-proof-v1',
		policyId: FLAT_FIBONACCI68_TRANSPORT_GPU_PROBE_POLICY.id,
		accepted: true,
		equation: BINARY32_REPLAY_EQUATION,
		structuralAudit: prepared.structuralAudit,
		syntheticEvaluationAudit:
			auditFlatFibonacci68TransportGpuProbeEvaluation(),
		planIdentity: prepared.planIdentity,
		controlledModule: prepared.moduleIdentity,
		transportData: prepared.transportData,
		probeSelection: {
			probeScalarCount: prepared.probeScalarCount,
			maximumProbeScalarCount: MAXIMUM_PROBE_SCALAR_COUNT,
			selectedPairCount: prepared.selectedPairs.length,
			selectedPairs: prepared.selectedPairs.map((pair) => ({
				id: pair.id,
				queryIndex: pair.queryIndex,
				wavelengthIndex: pair.wavelengthIndex,
				role: pair.role,
				queryColumn: pair.queryColumn,
				queryRow: pair.queryRow,
				inactiveTapCount: pair.inactiveTapCount,
				selectedTransportContentHash:
					pair.selectedTransportContentHash,
				terms: pair.terms.map((term) => ({...term})),
			})),
			acceptedOptionalGroupIds: prepared.acceptedOptionalGroupIds,
			skippedOptionalGroupIds: prepared.skippedOptionalGroupIds,
		},
		transportPasses: transportResults,
	};
	requireCondition(
		prepared.probeScalarCount <= MAXIMUM_PROBE_SCALAR_COUNT
			&& prepared.moduleIdentity.instanceCount === 2
			&& transportResults.length === 2
			&& transportResults.every((transport) =>
				transport.accepted
					&& transport.nonzeroPairCount >= 1
					&& transport.nonzeroPairCount
						+ transport.exactZeroPairCount
						=== transport.pairCount
					&& transport.pairs.every((pair) => pair.accepted)),
		'Flat packed transport GPU proof did not satisfy its complete ledger.',
	);
	return deepFreeze({
		...body,
		contentHash: sha256Descriptor(body),
	});
}

/**
 * Create one exactly-once probe control for ControlledLocalSunLightSource.
 * The callback inspects the already-built plan and adds only bounded readbacks;
 * it neither changes the graph nor uploads another transport texture.
 */
export function createFlatFibonacci68TransportGpuProbe() {
	let prepared = null;
	let evidence = null;
	const probeFactory = (request) => {
		requireCondition(prepared === null && evidence === null,
			'Flat transport GPU probe factory may run only once.');
		const result = prepareProbe(request);
		prepared = result.prepared;
		return result.probes;
	};
	const evaluateDiagnostics = (diagnostics) => {
		if (evidence !== null) return evidence;
		requireCondition(prepared !== null,
			'Flat transport GPU probe must be prepared before evaluation.');
		evidence = evaluatePreparedDiagnostics(prepared, diagnostics);
		prepared = null;
		return evidence;
	};
	return Object.freeze({probeFactory, evaluateDiagnostics});
}

export default createFlatFibonacci68TransportGpuProbe;
