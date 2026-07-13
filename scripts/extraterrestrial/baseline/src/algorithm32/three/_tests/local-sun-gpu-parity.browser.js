import * as THREE from
	'../../../../node_modules/three/build/three.module.js';

import { CacheGpuExecutor } from
	'../../caches/gpu/CacheGpuExecutor.js';
import { CachePassAssembler } from
	'../../caches/gpu/CachePassAssembler.js';
import {
	PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
} from '../../domains/consts.js';
import {
	createLocalSunCacheBuildPlan,
} from '../../light-sources/local-sun-cache-plan.js';
import { ThreeCacheBackend } from '../ThreeCacheBackend.js';
import {
	createLocalSunGpuParityGroundBoundary,
	createLocalSunGpuParityOwners,
} from './local-sun-gpu-parity-support.js';

const POLICY_URL =
	'/base/src/algorithm32/fixtures/local-sun-gpu-cache-parity-policy.json';
const CPU_GOLD_URL =
	'/base/src/algorithm32/light-sources/fixtures/'
	+ 'algorithm32-star-local-sun-shell-cpu-gold.json';

const GOLD_KEY_BY_FIELD_ID = {
	'local-sun-j1': 'j1',
	'local-sun-l1': 'l1',
	'local-sun-j2': 'j2',
	'local-sun-l2': 'l2',
	'local-sun-j3': 'j3',
	'local-sun-l3': 'l3',
	'local-sun-j4': 'j4',
	'local-sun-j-through-1': 'cumulative',
	'local-sun-j-through-2': 'cumulative',
	'local-sun-j-through-4': 'cumulative',
};

const N4_PROBE_GROUPS = [
	['local-sun-j1'],
	['local-sun-l1', 'local-sun-l2'],
	['local-sun-l3'],
	['local-sun-j2'],
	['local-sun-j3'],
	['local-sun-j4'],
];
const N2_PROBE_GROUPS = [
	['local-sun-j1'],
	['local-sun-l1'],
	['local-sun-j2'],
];
const N1_PROBE_GROUPS = [['local-sun-j1']];

/** Fetch one checked JSON fixture from Karma's served repository tree. */
async function fetchJson(url) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Could not load ${url}: HTTP ${response.status}.`);
	}
	return response.json();
}

/**
 * Project the three current production CPU N4 ground cases off the browser
 * main thread.
 *
 * @param {Record<string, any>} policy - Supplies the declared albedo values.
 * @returns {Promise<Record<string, any>>} The complete CPU projection.
 */
function projectCpuN4Fields(policy) {
	const worker = new Worker(
		new URL(
			'./local-sun-cpu-parity-worker.js',
			import.meta.url,
		),
		{ type: 'module' },
	);
	const timeoutMilliseconds = 300_000;

	return new Promise((resolve, reject) => {
		let settled = false;
		const settle = (callback, value) => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timeout);
			worker.terminate();
			callback(value);
		};
		const timeout = setTimeout(() => {
			settle(
				reject,
				new Error(
					'Local-Sun CPU parity worker exceeded '
					+ `${timeoutMilliseconds} ms.`,
				),
			);
		}, timeoutMilliseconds);

		worker.addEventListener('message', ({ data }) => {
			if (data.type === 'progress') {
				console.info(
					'Algorithm32 local-Sun CPU projection: '
					+ `${data.caseId} completed in `
					+ `${data.buildMilliseconds} ms.`,
				);
				return;
			}
			if (data.type === 'complete') {
				settle(resolve, data.projection);
				return;
			}
			if (data.type === 'error') {
				const error = new Error(data.error.message);
				error.name = data.error.name;
				error.stack = data.error.stack;
				settle(reject, error);
			}
		});
		worker.addEventListener('error', (event) => {
			settle(
				reject,
				new Error(
					event.message
					|| 'Local-Sun CPU parity worker failed.',
				),
			);
		});
		worker.postMessage({
			explicitZeroAlbedo:
				policy.groundCases.explicitZeroAlbedo.value,
			nonzeroAlbedo:
				policy.groundCases.nonzeroAlbedo.value,
		});
	});
}

/** Create one order-specific GPU plan from the bounded owners. */
function createPlan(owners, maximumScatteringOrder, groundBoundary = null) {
	return createLocalSunCacheBuildPlan({
		source: owners.cacheSource,
		atmosphere: owners.atmosphere,
		geometry: owners.geometry,
		groundBoundary,
		maximumScatteringOrder,
		domainSelection: owners.domainSelection,
	});
}

/** Expand one entire bounded field in its canonical layer-major order. */
function fullFieldCoordinates(field) {
	const coordinates = [];
	for (let wavelengthIndex = 0;
		wavelengthIndex < field.storage.layers;
		wavelengthIndex += 1) {
		for (let positionIndex = 0;
			positionIndex < field.storage.height;
			positionIndex += 1) {
			for (let directionIndex = 0;
				directionIndex < field.storage.width;
				directionIndex += 1) {
				coordinates.push({
					directionIndex,
					positionIndex,
					wavelengthIndex,
				});
			}
		}
	}
	return coordinates;
}

/** Expand the predeclared reflective-ground probe lattice for one field. */
function groundProbeCoordinates(field, policy) {
	const directionIndices = field.storage.width === 34
		? policy.groundCases.boundedProbeIndices
			.incomingPairedFibonacci34
		: policy.groundCases.boundedProbeIndices.outgoingW3;
	const coordinates = [];
	for (let wavelengthIndex = 0;
		wavelengthIndex < field.storage.layers;
		wavelengthIndex += 1) {
		for (const positionIndex of
			policy.groundCases.boundedProbeIndices.position) {
			for (const directionIndex of directionIndices) {
				coordinates.push({
					directionIndex,
					positionIndex,
					wavelengthIndex,
				});
			}
		}
	}
	return coordinates;
}

/** Find one trusted logical field specification. */
function fieldSpec(plan, fieldId) {
	const field = plan.fields.find(({ id }) => id === fieldId);
	if (!field) {
		throw new Error(`${plan.identity.id} has no field ${fieldId}.`);
	}
	return field;
}

/** Select values from a complete canonical field by checked coordinates. */
function selectValues(values, field, coordinates) {
	const layerSize = field.storage.width * field.storage.height;
	return coordinates.map((coordinate) => values[
		coordinate.wavelengthIndex * layerSize
			+ coordinate.positionIndex * field.storage.width
			+ coordinate.directionIndex
	]);
}

/**
 * Observe public backend handles and every data/readback boundary.
 */
class ObservedCacheBackend {
	constructor(backend) {
		this._backend = backend;
		this.id = backend.id;
		this.capabilities = backend.capabilities;
		this.liveFields = new Set();
		this.livePrograms = new Set();
		this.compiledShaders = [];
		this.probeRequests = [];
	}

	allocateField(spec) {
		const field = this._backend.allocateField(spec);
		const dispose = field.dispose.bind(field);
		let active = true;
		field.dispose = () => {
			if (!active) {
				return;
			}
			active = false;
			dispose();
			this.liveFields.delete(field);
		};
		this.liveFields.add(field);
		return field;
	}

	async compile(shader) {
		this.compiledShaders.push(shader);
		const program = await this._backend.compile(shader);
		const dispose = program.dispose.bind(program);
		let active = true;
		program.dispose = () => {
			if (!active) {
				return;
			}
			active = false;
			dispose();
			this.livePrograms.delete(program);
		};
		this.livePrograms.add(program);
		return program;
	}

	submitLayer(request) {
		this._backend.submitLayer(request);
	}

	createRuntimeBinding(field) {
		return this._backend.createRuntimeBinding(field);
	}

	installRuntimeBindings(request) {
		this._backend.installRuntimeBindings(request);
	}

	async readSelectedScalars(request) {
		this.probeRequests.push({
			fieldId: request.field.descriptor.id,
			storage: request.field.storage,
			coordinates: request.coordinates.map((value) => ({ ...value })),
		});
		return this._backend.readSelectedScalars(request);
	}

	dispose() {
		this._backend.dispose();
	}
}

/** Yield construction without introducing a fixed wait. */
function yieldControl() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Return pass-produced values from one bounded conformance execution. */
async function executeProbeGroup(
	executor,
	backend,
	plan,
	fieldIds,
	readResult,
	buildTimings,
	coordinateFactory = fullFieldCoordinates,
) {
	const probes = fieldIds.map((fieldId) => {
		const field = fieldSpec(plan, fieldId);
		return {
			field: fieldId,
			coordinates: coordinateFactory(field),
		};
	});
	let artifact;
	try {
		const startedAt = performance.now();
		artifact = await executor.execute(plan, {
			probeReader: backend,
			probes,
			scheduler: { yieldControl },
		});
		const values = new Map();
		for (const fieldId of fieldIds) {
			const passIndex = plan.passes.findIndex(
				({ output }) => output === fieldId,
			);
			const diagnostic = artifact.diagnostics.passes[passIndex];
			expect(diagnostic.probe)
				.withContext(`${fieldId} must be read after its producing pass.`)
				.toBeDefined();
			values.set(
				fieldId,
				diagnostic.probe.samples.map((sample) => sample.value),
			);
		}
		if (readResult) {
			const resultSpec = fieldSpec(plan, plan.result);
			const result = await backend.readSelectedScalars({
				field: artifact.result,
				coordinates: coordinateFactory(resultSpec),
			});
			values.set(
				plan.result,
				result.samples.map((sample) => sample.value),
			);
		}
		const buildMilliseconds = performance.now() - startedAt;
		buildTimings.push({
			planId: plan.identity.id,
			fieldIds: [...fieldIds],
			buildMilliseconds,
		});
		console.info(
			'Algorithm32 local-Sun GPU conformance execution: '
			+ `${fieldIds.join('+')} completed in `
			+ `${buildMilliseconds} ms.`,
		);
		return values;
	} finally {
		artifact?.dispose();
	}
}

/** Execute the minimum field-scoped groups needed for one complete order. */
async function executeCompleteOrder(
	executor,
	backend,
	plan,
	groups,
	buildTimings,
) {
	const values = new Map();
	for (let index = 0; index < groups.length; index += 1) {
		const group = await executeProbeGroup(
			executor,
			backend,
			plan,
			groups[index],
			index === 0,
			buildTimings,
		);
		for (const [fieldId, fieldValues] of group) {
			values.set(fieldId, fieldValues);
		}
	}
	return values;
}

/** Execute all predeclared reflective fields in one bounded N4 build. */
async function executeGroundCase(
	executor,
	backend,
	plan,
	policy,
	buildTimings,
) {
	const pureFieldIds = [
		'local-sun-j1',
		'local-sun-l1',
		'local-sun-j2',
		'local-sun-l2',
		'local-sun-j3',
		'local-sun-l3',
		'local-sun-j4',
	];
	return executeProbeGroup(
		executor,
		backend,
		plan,
		pureFieldIds,
		true,
		buildTimings,
		(field) => groundProbeCoordinates(field, policy),
	);
}

/** Select one field's predeclared absolute-plus-relative comparison bound. */
function fieldBound(fieldId, policy, precision = 'r32f') {
	const bounds = precision === 'r32f'
		? policy.r32fBounds
		: policy.binary64Bounds;
	if (fieldId.includes('j-through')) {
		return bounds.cumulativeScatteringDensity;
	}
	return /^local-sun-l[123]$/u.test(fieldId)
		? bounds.pureRadiance
		: bounds.pureScatteringDensity;
}

/** Compare one scalar vector under the declared numerical rule. */
function compareValues(actual, expected, bound, label) {
	const failures = [];
	let maximumAbsoluteResidual = 0;
	expect(actual.length).withContext(label).toBe(expected.length);
	for (let index = 0; index < expected.length; index += 1) {
		const residual = Math.abs(actual[index] - expected[index]);
		const allowed =
			bound.absolute + bound.relative * Math.abs(expected[index]);
		maximumAbsoluteResidual =
			Math.max(maximumAbsoluteResidual, residual);
		if (!Number.isFinite(actual[index]) || residual > allowed) {
			if (failures.length < 20) {
				failures.push({
					index,
					actual: actual[index],
					expected: expected[index],
					residual,
					allowed,
				});
			}
		}
	}
	expect(failures).withContext(label).toEqual([]);
	return maximumAbsoluteResidual;
}

/** Convert binary32 values to their raw unsigned bit patterns. */
function float32Bits(values) {
	const floats = Float32Array.from(values);
	return Array.from(new Uint32Array(floats.buffer));
}

/** Require exact binary32 equality without emitting a full-array diff. */
function expectSameFloat32(left, right, label) {
	const leftBits = float32Bits(left);
	const rightBits = float32Bits(right);
	const mismatches = [];
	expect(rightBits.length).withContext(label).toBe(leftBits.length);
	for (let index = 0; index < leftBits.length; index += 1) {
		if (leftBits[index] !== rightBits[index] && mismatches.length < 20) {
			mismatches.push({
				index,
				left: leftBits[index],
				right: rightBits[index],
			});
		}
	}
	expect(mismatches).withContext(label).toEqual([]);
}

/** Require at least one checked binary32 scalar to change. */
function expectFloat32Difference(left, right, label) {
	const leftBits = float32Bits(left);
	const rightBits = float32Bits(right);
	expect(rightBits.some((value, index) => value !== leftBits[index]))
		.withContext(label)
		.toBeTrue();
}

/** Extract one logical field's Star gold values. */
function goldValues(gold, maximumScatteringOrder, fieldId) {
	return gold.requestedOrders[
		`n${maximumScatteringOrder}`
	].fields[GOLD_KEY_BY_FIELD_ID[fieldId]].values;
}

/** Select a complete GPU field down to the reflective probe coordinates. */
function selectGpuGroundValues(values, plan, fieldId, policy) {
	const field = fieldSpec(plan, fieldId);
	return selectValues(
		values,
		field,
		groundProbeCoordinates(field, policy),
	);
}

/** Assert cumulative output equals the sum of its pure GPU orders. */
function expectCumulativeSum(fields, cumulativeId, policy, label) {
	const cumulative = fields.get(cumulativeId);
	const expected = cumulative.map((_value, index) =>
		fields.get('local-sun-j1')[index]
			+ fields.get('local-sun-j2')[index]
			+ fields.get('local-sun-j3')[index]
			+ fields.get('local-sun-j4')[index]);
	compareValues(
		cumulative,
		expected,
		policy.r32fBounds.cumulativeScatteringDensity,
		label,
	);
}

/** Drain WebGL errors and return their numeric identities. */
function drainWebGlErrors(context) {
	const errors = [];
	for (let error = context.getError();
		error !== context.NO_ERROR;
		error = context.getError()) {
		errors.push(error);
	}
	return errors;
}

/** Create a real WebGL renderer and its observed production backend. */
function createGpuHarness() {
	const canvas = document.createElement('canvas');
	document.body.appendChild(canvas);
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: false,
		alpha: false,
		depth: false,
		stencil: false,
	});
	renderer.debug.checkShaderErrors = true;
	renderer.setPixelRatio(1);
	renderer.setSize(64, 4, false);
	const backend = new ObservedCacheBackend(
		new ThreeCacheBackend({ THREE, renderer }),
	);
	const executor = new CacheGpuExecutor({
		backend,
		assembler: new CachePassAssembler(),
	});

	return {
		renderer,
		canvas,
		backend,
		executor,
		dispose() {
			executor.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss?.();
			canvas.remove();
		},
	};
}

describe('Algorithm32 local-Sun GPU Stage 9.6', () => {
	it('pins the active policy, exact facts, and enabled controller boundary', async () => {
		const [policy, gold] = await Promise.all([
			fetchJson(POLICY_URL),
			fetchJson(CPU_GOLD_URL),
		]);
		const owners = createLocalSunGpuParityOwners();

		expect(policy.schema).toBe(
			'algorithm32-flat-local-gpu-cache-parity-policy-v3',
		);
		expect(policy.status).toBe(
			'stage-9.6-implemented-omitted-ground-star-validated-reflective-validation-pending',
		);
		expect(Array.from(owners.shellFactCache.boundaries))
			.toEqual(gold.facts.boundaries.values);
		expect(Array.from(owners.shellFactCache.heldIncidentScales))
			.toEqual(gold.facts.heldScales.values);
		expect(
			PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
		).toEqual(gold.inputs.domains.incoming.unitVectors);
		const controller = owners.physicalSource.createCacheController({
			backend: /** @type {any} */ ({
				capabilities: {
					id: 'local-sun-browser-controller-capabilities',
				},
			}),
		});

		expect(controller.active).toBeNull();
		controller.dispose();
	});

	it('publishes, reuses, replaces, and disposes through the public controller', async () => {
		const owners = createLocalSunGpuParityOwners();
		const harness = createGpuHarness();
		const controller =
			owners.physicalSource.createCacheController({
				backend: harness.backend,
				scheduler: { yieldControl },
			});
		const request = {
			atmosphere: owners.atmosphere,
			geometry: owners.geometry,
			groundBoundary: null,
			spectralBasis:
				owners.domainSelection.spectralBasis,
			maximumScatteringOrder: 1,
		};

		try {
			const first =
				await controller.createScatteringCache(
					request,
				);
			const compiledShaderCount =
				harness.backend.compiledShaders.length;

			expect(controller.active).toBe(first);
			expect(first.resources.sourceFacts.total).toEqual({
				value: 32_776,
				units: 'bytes',
			});
			expect(first.resources.boundaryTexture).toEqual({
				value: 8_196,
				units: 'bytes',
			});
			expect(first.resources.packedTransportData).toEqual({
				value: 0,
				units: 'bytes',
			});
			expect(first.resources.executor.residentFieldStorage)
				.toEqual({
					value: 1_049_760,
					units: 'bytes',
				});
			expect(harness.backend.liveFields.size).toBe(1);
			expect(harness.backend.livePrograms.size).toBe(0);

			const reused =
				await controller.createScatteringCache(
					request,
				);
			expect(reused).toBe(first);
			expect(harness.backend.compiledShaders.length)
				.toBe(compiledShaderCount);

			const replacement =
				await controller.createScatteringCache({
					...request,
					maximumScatteringOrder: 2,
				});
			expect(replacement).not.toBe(first);
			expect(controller.active).toBe(replacement);
			expect(() => first.getRuntimeBindings())
				.toThrowError(/disposed/u);
			expect(replacement.resources.packedTransportData)
				.toEqual({
					value: 0,
					units: 'bytes',
				});
			expect(harness.backend.liveFields.size).toBe(1);
			expect(harness.backend.livePrograms.size).toBe(0);
			expect(drainWebGlErrors(
				harness.renderer.getContext(),
			)).toEqual([]);
		} finally {
			controller.dispose();
			expect(harness.backend.livePrograms.size).toBe(0);
			expect(harness.backend.liveFields.size).toBe(0);
			harness.dispose();
		}
	});

	it('passes complete omitted-ground fields, graph isolation, prefixes, and reflective implementation checks', async () => {
		const [policy, gold] = await Promise.all([
			fetchJson(POLICY_URL),
			fetchJson(CPU_GOLD_URL),
		]);
		const owners = createLocalSunGpuParityOwners();
		const zeroGround = createLocalSunGpuParityGroundBoundary(
			policy.groundCases.explicitZeroAlbedo.value,
			'stage-9.6.3-zero-ground',
		);
		const nonzeroGround = createLocalSunGpuParityGroundBoundary(
			policy.groundCases.nonzeroAlbedo.value,
			'stage-9.6.3-nonzero-ground',
		);
		const plans = {
			n1: createPlan(owners, 1),
			n2: createPlan(owners, 2),
			n4: createPlan(owners, 4),
			zero: createPlan(owners, 4, zeroGround),
			nonzero: createPlan(owners, 4, nonzeroGround),
		};
		for (const order of [1, 2, 4]) {
			expect(plans[`n${order}`].passes.map(({ id }) => id))
				.toEqual(policy.expectedPassGraphs[`n${order}`]);
		}

		const cpuProjection = await projectCpuN4Fields(policy);
		const cpuFields = {
			omitted:
				new Map(Object.entries(
					cpuProjection.cases.omitted.fields,
				)),
			zero:
				new Map(Object.entries(
					cpuProjection.cases.zero.fields,
				)),
			nonzero:
				new Map(Object.entries(
					cpuProjection.cases.nonzero.fields,
				)),
		};
		const gpuBuildTimings = [];
		const gpuStartedAt = performance.now();
		const harness = createGpuHarness();
		let gpuN4;

		try {
			gpuN4 = await executeCompleteOrder(
				harness.executor,
				harness.backend,
				plans.n4,
				N4_PROBE_GROUPS,
				gpuBuildTimings,
			);
			const gpuN2 = await executeCompleteOrder(
				harness.executor,
				harness.backend,
				plans.n2,
				N2_PROBE_GROUPS,
				gpuBuildTimings,
			);
			const gpuN1 = await executeCompleteOrder(
				harness.executor,
				harness.backend,
				plans.n1,
				N1_PROBE_GROUPS,
				gpuBuildTimings,
			);
			const gpuGround = {
				zero: await executeGroundCase(
					harness.executor,
					harness.backend,
					plans.zero,
					policy,
					gpuBuildTimings,
				),
				nonzero: await executeGroundCase(
					harness.executor,
					harness.backend,
					plans.nonzero,
					policy,
					gpuBuildTimings,
				),
			};

			let n4ScalarCount = 0;
			for (const [fieldId, actual] of gpuN4) {
				const expectedGold = goldValues(gold, 4, fieldId);
				const currentCpu = cpuFields.omitted.get(fieldId);
				compareValues(
					actual,
					expectedGold,
					fieldBound(fieldId, policy),
					`${fieldId} GPU versus independent Star gold`,
				);
				compareValues(
					actual,
					currentCpu,
					fieldBound(fieldId, policy),
					`${fieldId} GPU versus current production CPU`,
				);
				compareValues(
					currentCpu,
					expectedGold,
					fieldBound(fieldId, policy, 'binary64'),
					`${fieldId} current production CPU versus Star gold`,
				);
				n4ScalarCount += actual.length;
			}
			expect(n4ScalarCount).toBe(
				policy.boundedComparisonDomain.fieldScalarCount,
			);

			let omittedGroundComparedScalarCount = n4ScalarCount;
			for (const [maximum, fields] of [
				[1, gpuN1],
				[2, gpuN2],
			]) {
				for (const [fieldId, actual] of fields) {
					compareValues(
						actual,
						goldValues(gold, maximum, fieldId),
						fieldBound(fieldId, policy),
						`N${maximum} ${fieldId} versus Star gold`,
					);
					omittedGroundComparedScalarCount += actual.length;
				}
			}
			expect(omittedGroundComparedScalarCount).toBe(
				policy.authority.cpuComparisonReport
					.fieldComparedScalarCount,
			);

			expectSameFloat32(
				gpuN1.get('local-sun-j1'),
				gpuN2.get('local-sun-j1'),
				'N1 and N2 J1 shared prefix',
			);
			expectSameFloat32(
				gpuN2.get('local-sun-j1'),
				gpuN4.get('local-sun-j1'),
				'N2 and N4 J1 shared prefix',
			);
			expectSameFloat32(
				gpuN2.get('local-sun-l1'),
				gpuN4.get('local-sun-l1'),
				'N2 and N4 continuous L1 shared prefix',
			);
			expectSameFloat32(
				gpuN2.get('local-sun-j2'),
				gpuN4.get('local-sun-j2'),
				'N2 and N4 J2 shared prefix',
			);
			expectSameFloat32(
				gpuN1.get('local-sun-j1'),
				gpuN1.get('local-sun-j-through-1'),
				'N1 copy result',
			);
			expectCumulativeSum(
				gpuN4,
				'local-sun-j-through-4',
				policy,
				'omitted-ground cumulative pure-order sum',
			);

			const groundFieldIds = [
				'local-sun-j1',
				'local-sun-l1',
				'local-sun-j2',
				'local-sun-l2',
				'local-sun-j3',
				'local-sun-l3',
				'local-sun-j4',
				'local-sun-j-through-4',
			];
			const omittedGround = new Map();
			const groundComparedScalarCounts = {
				zero: 0,
				nonzero: 0,
			};
			for (const fieldId of groundFieldIds) {
				omittedGround.set(
					fieldId,
					selectGpuGroundValues(
						gpuN4.get(fieldId),
						plans.n4,
						fieldId,
						policy,
					),
				);
				for (const groundKind of ['zero', 'nonzero']) {
					const coordinates = groundProbeCoordinates(
						fieldSpec(plans[groundKind], fieldId),
						policy,
					);
					const expectedCpu = selectValues(
						cpuFields[groundKind].get(fieldId),
						fieldSpec(plans[groundKind], fieldId),
						coordinates,
					);
					compareValues(
						gpuGround[groundKind].get(fieldId),
						expectedCpu,
						fieldBound(fieldId, policy),
						`${groundKind} ${fieldId} GPU versus production CPU`,
					);
					groundComparedScalarCounts[groundKind] +=
						gpuGround[groundKind].get(fieldId).length;
				}
				expectSameFloat32(
					omittedGround.get(fieldId),
					gpuGround.zero.get(fieldId),
					`explicit-zero ${fieldId} isolation`,
				);
			}

			for (const fieldId of ['local-sun-j1', 'local-sun-l1']) {
				expectSameFloat32(
					omittedGround.get(fieldId),
					gpuGround.nonzero.get(fieldId),
					`nonzero ground leaves ${fieldId} unchanged`,
				);
			}
			for (const fieldId of [
				'local-sun-j2',
				'local-sun-l2',
				'local-sun-j3',
				'local-sun-l3',
				'local-sun-j4',
				'local-sun-j-through-4',
			]) {
				expectFloat32Difference(
					omittedGround.get(fieldId),
					gpuGround.nonzero.get(fieldId),
					`nonzero ground must affect ${fieldId}`,
				);
			}
			expectCumulativeSum(
				gpuGround.zero,
				'local-sun-j-through-4',
				policy,
				'explicit-zero cumulative pure-order sum',
			);
			expectCumulativeSum(
				gpuGround.nonzero,
				'local-sun-j-through-4',
				policy,
				'nonzero-ground cumulative pure-order sum',
			);
			for (const groundKind of ['zero', 'nonzero']) {
				expect(groundComparedScalarCounts[groundKind]).toBe(
					policy.groundCases.boundedProbeIndices
						.scalarCountPerCase,
				);
			}

			const shellBindings =
				harness.backend.compiledShaders.flatMap((shader) =>
					shader.bindings
						.filter(({ spec }) =>
							spec.id.includes('local-sun-shell'))
						.map((binding) => ({ shader, binding })));
			expect(shellBindings.length).toBeGreaterThan(0);
			expect(shellBindings.every(({ shader }) =>
				shader.output.id === 'local-sun-j1'))
				.toBeTrue();
			const boundaryBindings = shellBindings.filter(
				({ binding }) =>
					binding.spec.id === 'local-sun-shell-boundaries',
			);
			expect(boundaryBindings.every(({ binding }) =>
				binding.value.values.length === 2049
				&& binding.value.values.length * 4 === 8196))
				.toBeTrue();
			expect(boundaryBindings.length).toBeGreaterThan(0);
			const boundaryUploadScalarCount =
				boundaryBindings[0].binding.value.values.length;
			const boundaryUploadBytes =
				boundaryUploadScalarCount
				* Float32Array.BYTES_PER_ELEMENT;
			expect(boundaryUploadScalarCount).toBe(
				policy.resourceCriteria
					.factBoundaryTextureScalarCount,
			);
			expect(boundaryUploadBytes).toBe(
				policy.resourceCriteria.factBoundaryTextureBytes,
			);
			expect(boundaryBindings[0].binding.value.values)
				.toEqual(Array.from(Float32Array.from(
					owners.shellFactCache.boundaries,
				)));

			const uploadedQuantities =
				harness.backend.compiledShaders.flatMap(({ bindings }) =>
					bindings
						.filter(({ spec }) => spec.kind === 'data')
						.map(({ value }) => value.quantity));
			expect(uploadedQuantities).not.toContain(
				'spectral-radiance-density',
			);
			expect(uploadedQuantities).not.toContain(
				'spectral-scattering-density',
			);
			expect(harness.backend.probeRequests.every(
				({ coordinates }) => coordinates.length <= 4096,
			)).toBeTrue();
			expect(harness.backend.livePrograms.size).toBe(0);
			expect(harness.backend.liveFields.size).toBe(0);
			expect(drainWebGlErrors(harness.renderer.getContext()))
				.toEqual([]);
			const maximumGpuBuildMilliseconds = Math.max(
				...gpuBuildTimings.map(
					({ buildMilliseconds }) =>
						buildMilliseconds,
				),
			);
			expect(maximumGpuBuildMilliseconds).toBeLessThanOrEqual(
				policy.resourceCriteria
					.boundedBrowserBuildMillisecondsMaximum,
			);

			console.info(
				'Algorithm32 local-Sun Stage 9.6.3 evidence: '
				+ JSON.stringify({
					n4ComparedScalarCount: n4ScalarCount,
					omittedGroundComparedScalarCount,
					groundComparedScalarCountPerCase:
						groundComparedScalarCounts,
					boundaryUploadBytes,
					cpuBuildMilliseconds:
						cpuProjection.buildMilliseconds,
					gpuBuildMilliseconds:
						performance.now() - gpuStartedAt,
					maximumGpuBuildMilliseconds,
					readbackRequestCount:
						harness.backend.probeRequests.length,
					reflectiveClaim:
						'implemented-validation-pending',
				}),
			);
		} finally {
			harness.dispose();
			expect(harness.backend.livePrograms.size).toBe(0);
			expect(harness.backend.liveFields.size).toBe(0);
		}
	});
});
