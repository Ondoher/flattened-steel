import * as THREE from
	"../../../../node_modules/three/build/three.module.js";

import {
	CUMULATIVE_SCATTERING_DENSITY_FIELD_IDS,
	GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
	GROUND_CPU_PARITY_PROJECTION_SCHEMA_ID,
	GROUND_PARITY_CASE_IDS,
	GROUND_PARITY_PROJECTION_ENDPOINT,
	GROUND_PARITY_PROJECTION_SCHEMA_ID,
	GROUND_PARITY_SHA256_PATTERN,
	GROUND_PARITY_SOURCE_DATA_SET_ID,
	GROUND_PARITY_SOURCE_MANIFEST_SCHEMA_ID,
	MAXIMUM_GROUND_PARITY_PROJECTION_JSON_BYTES,
	PURE_RADIANCE_FIELD_IDS,
	PURE_SCATTERING_DENSITY_FIELD_IDS,
} from
	"../../../../scripts/algorithm32-star/parity-data-set/browser/consts.js";
import StarGroundGpuParityHarness from
	"./StarGroundGpuParityHarness.js";
import {
	STAR_GROUND_GPU_PARITY_BUILD_TIMEOUT_MILLISECONDS,
	STAR_GROUND_GPU_PARITY_CUMULATIVE_PASS_IDS,
	STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS,
	STAR_GROUND_GPU_PARITY_REFLECTIVE_EVIDENCE_FIELD_IDS,
	STAR_GROUND_GPU_PARITY_REPORT_SCHEMA_ID,
} from "./star-ground-gpu-parity-consts.js";

/** Fetch the Node-authenticated projection from the dedicated Karma host. */
async function fetchProjection() {
	const response = await fetch(GROUND_PARITY_PROJECTION_ENDPOINT, {
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error(
			`Could not load Star ground projection: HTTP ${response.status} `
			+ `${await response.text()}`,
		);
	}
	return response.json();
}

/** Find one stable id in a projected array. */
function itemById(items, id, label) {
	const item = items.find((candidate) => candidate.id === id);
	if (item === undefined) {
		throw new Error(`Projection has no ${label} ${id}.`);
	}
	return item;
}

/** Require one all-wavelength scalar probe to be finite and domain-aligned. */
function expectProbe(probe, wavelengthCount, positionDomain, directionDomain) {
	expect(positionDomain.selectedIndices).toContain(probe.positionIndex);
	expect(directionDomain.selectedIndices).toContain(probe.directionIndex);
	expect(probe.values.length).toBe(wavelengthCount);
	expect(probe.values.every(Number.isFinite)).toBeTrue();
}

/** Find the probe at one exact logical position/direction coordinate. */
function probeAt(field, positionIndex, directionIndex) {
	const probe = field.probes.find((candidate) =>
		candidate.positionIndex === positionIndex
		&& candidate.directionIndex === directionIndex);
	if (probe === undefined) {
		throw new Error(
			`${field.id} has no probe at (${positionIndex}, ${directionIndex}).`,
		);
	}
	return probe;
}

/** Reconstruct one cumulative scalar in the declared left-associated order. */
function expectedCumulativeScalar(
	pureFields,
	order,
	positionIndex,
	directionIndex,
	wavelengthIndex,
) {
	let value = probeAt(
		itemById(pureFields, "J1", "pure field"),
		positionIndex,
		directionIndex,
	).values[wavelengthIndex];
	for (let currentOrder = 2; currentOrder <= order; currentOrder += 1) {
		value += probeAt(
			itemById(pureFields, `J${currentOrder}`, "pure field"),
			positionIndex,
			directionIndex,
		).values[wavelengthIndex];
	}
	return value;
}

/** Require the projection to contain no archive payload or address metadata. */
function expectSmallProjection(projection) {
	const serialized = JSON.stringify(projection);
	const byteLength = new TextEncoder().encode(serialized).byteLength;
	expect(byteLength).toBeLessThanOrEqual(
		MAXIMUM_GROUND_PARITY_PROJECTION_JSON_BYTES,
	);
	expect(byteLength).toBeLessThan(
		projection.sourceAuthentication.payloadByteLength,
	);
	expect(serialized.includes("fields.f64le")).toBeFalse();
	expect(serialized.includes('"byteOffset"')).toBeFalse();
	expect(projection.payload).toBeUndefined();
	expect(projection.sections).toBeUndefined();
}

describe("Algorithm32 authenticated Star ground projection", () => {
	let projection;

	beforeAll(async () => {
		projection = await fetchProjection();
	});

	it("serves one authenticated small projection instead of the sealed pack", () => {
		expect(projection.schemaId).toBe(GROUND_PARITY_PROJECTION_SCHEMA_ID);
		expect(projection.sourceAuthentication).toEqual(jasmine.objectContaining({
			verified: true,
			semanticManifestSchemaId:
				GROUND_PARITY_SOURCE_MANIFEST_SCHEMA_ID,
			dataSetId: GROUND_PARITY_SOURCE_DATA_SET_ID,
			schemaVersion: 1,
			state: "completed",
		}));
		expect(
			GROUND_PARITY_SHA256_PATTERN.test(
				projection.sourceAuthentication.payloadSha256,
			),
		).toBeTrue();
		expect(projection.sourceAuthentication.verifiedSectionCount).toBe(205);
		expect(projection.projectionPolicy.cpuComparison.binary64Spectral)
			.toEqual(jasmine.objectContaining({
				rule: "absolute-or-relative",
				absolute: 4e-18,
				relative: 1e-12,
				starZero: "exact-numerical-zero",
			}));
		expect(projection.projectionPolicy.gpuComparison.construction)
			.toEqual(jasmine.objectContaining({
				rule: "absolute-plus-relative-times-oracle",
			}));
		expectSmallProjection(projection);
	});

	it("retains exactly the omitted, reflective, and explicit-zero cases", () => {
		expect(projection.cases.map((candidate) => candidate.id)).toEqual(
			GROUND_PARITY_CASE_IDS,
		);
		const omitted = itemById(
			projection.cases,
			GROUND_PARITY_CASE_IDS[0],
			"case",
		);
		const reflective = itemById(
			projection.cases,
			GROUND_PARITY_CASE_IDS[1],
			"case",
		);
		const explicitZero = itemById(
			projection.cases,
			GROUND_PARITY_CASE_IDS[2],
			"case",
		);

		expect(omitted.inputs.ground).toEqual(jasmine.objectContaining({
			kind: "omitted",
			capturePath: "omitted-canonical-black",
		}));
		expect(reflective.inputs.ground).toEqual(jasmine.objectContaining({
			kind: "uniform-lambertian",
			capturePath: "explicit-nonzero-boundary",
		}));
		expect(
			reflective.inputs.ground.spectralAlbedo.values.every(
				(value) => value > 0,
			),
		).toBeTrue();
		expect(explicitZero.inputs.ground).toEqual(jasmine.objectContaining({
			kind: "uniform-lambertian",
			capturePath: "explicit-zero-micro-build",
		}));
		expect(
			explicitZero.inputs.ground.spectralAlbedo.values.every(
				(value) => value === 0,
			),
		).toBeTrue();
	});

	it("aligns every pure probe with authenticated physical domain facts", () => {
		for (const groundCase of projection.cases) {
			expect(groundCase.pureFields.map((field) => field.id)).toEqual([
				...PURE_SCATTERING_DENSITY_FIELD_IDS,
				...PURE_RADIANCE_FIELD_IDS,
			]);
			const wavelengthDomain = itemById(
				projection.domains,
				groundCase.domainIds.wavelength,
				"wavelength domain",
			);
			const positionDomain = itemById(
				projection.domains,
				groundCase.domainIds.position,
				"position domain",
			);
			const incomingDomain = itemById(
				projection.domains,
				groundCase.domainIds.incomingDirection,
				"incoming direction domain",
			);
			const outgoingDomain = itemById(
				projection.domains,
				groundCase.domainIds.outgoingDirection,
				"outgoing direction domain",
			);
			expect(wavelengthDomain.selectedIndices.length).toBe(
				wavelengthDomain.count,
			);
			expect(wavelengthDomain.wavelengths.length).toBe(
				wavelengthDomain.count,
			);

			for (const field of groundCase.pureFields) {
				expect(GROUND_PARITY_SHA256_PATTERN.test(
					field.source.sectionSha256,
				)).toBeTrue();
				expect(field.probes.length).toBe(6);
				const directionDomain = field.id.startsWith("J")
					? outgoingDomain
					: incomingDomain;
				for (const probe of field.probes) {
					expectProbe(
						probe,
						wavelengthDomain.count,
						positionDomain,
						directionDomain,
					);
				}
			}
		}
	});

	it("retains exact left-associated cumulative values for GPU result probes", () => {
		for (const groundCase of projection.cases) {
			expect(
				groundCase.cumulativeFields.map((field) => field.id),
			).toEqual(CUMULATIVE_SCATTERING_DENSITY_FIELD_IDS);
			for (
				let orderIndex = 0;
				orderIndex < groundCase.cumulativeFields.length;
				orderIndex += 1
			) {
				const cumulative = groundCase.cumulativeFields[orderIndex];
				expect(cumulative.verifiedExactInStar).toBeTrue();
				expect(
					GROUND_PARITY_SHA256_PATTERN.test(
						cumulative.directCanonicalSha256,
					),
				).toBeTrue();
				for (const probe of cumulative.probes) {
					for (
						let wavelengthIndex = 0;
						wavelengthIndex < probe.values.length;
						wavelengthIndex += 1
					) {
						expect(probe.values[wavelengthIndex]).toBe(
							expectedCumulativeScalar(
								groundCase.pureFields,
								orderIndex + 1,
								probe.positionIndex,
								probe.directionIndex,
								wavelengthIndex,
							),
						);
					}
				}
			}
		}
	});
});

describe("Algorithm32 production ground WebGL parity", () => {
	let projection;

	beforeAll(async () => {
		projection = await fetchProjection();
	}, STAR_GROUND_GPU_PARITY_BUILD_TIMEOUT_MILLISECONDS);

	it("matches Star and production CPU for omitted, reflective, and zero ground", async () => {
		expect(projection.productionCpu).toEqual(jasmine.objectContaining({
			schemaId: GROUND_CPU_PARITY_PROJECTION_SCHEMA_ID,
			precision: "binary64",
			execution: "production-owners-in-node-worker-thread",
			maximumScatteringOrder: 4,
		}));
		expect(
			projection.productionCpu.cases.map((candidate) => candidate.id),
		).toEqual([
			...GROUND_PARITY_CASE_IDS,
			GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
		]);

		const report = await new StarGroundGpuParityHarness({
			THREE,
			projection,
		}).run();
		console.info(
			`Algorithm32 ground WebGL parity: ${JSON.stringify(report)}`,
		);

		expect(report.schemaId).toBe(
			STAR_GROUND_GPU_PARITY_REPORT_SCHEMA_ID,
		);
		expect(report.status).toBe("passed");
		expect(report.failures).toEqual([]);
		expect(report.coverage.gaps).toEqual([]);
		expect(report.coverage.executedCaseIds).toEqual([
			...GROUND_PARITY_CASE_IDS,
			GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
		]);
		expect(report.totals).toEqual(jasmine.objectContaining({
			caseCount: 4,
			executedFieldCount:
				4 * STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS.length,
			executedFieldScalarCount: 4 * 10 * 6 * 15,
			residentScalarCount: 4 * 6 * 15,
			exactScalarCount: 2 * 10 * 6 * 15 + 6 * 15,
			failureCount: 0,
			coverageGapCount: 0,
		}));

		for (const caseReport of report.cases) {
			expect(caseReport.comparisons.map(
				(comparison) => comparison.fieldId,
			)).toEqual(STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS);
			expect(caseReport.comparisons.filter(
				(comparison) =>
					comparison.evidence === "actual-n4-cumulative-pass",
			).map((comparison) => comparison.fieldId)).toEqual(
				STAR_GROUND_GPU_PARITY_CUMULATIVE_PASS_IDS,
			);
			expect(caseReport.passIds.some(
				(passId) => passId.includes("j-through-1"),
			)).toBeFalse();
			expect(caseReport.logicalFirstOrder.evidence).toContain(
				"no-Jthrough1-copy-pass-is-executed",
			);
			expect(caseReport.logicalFirstOrder.scalarCount).toBe(6 * 15);
			expect(caseReport.resident).toEqual(jasmine.objectContaining({
				fieldId: "Jthrough4",
				coverage: "six-complete-native-15-probe-spectra",
				scalarCount: 6 * 15,
				policy: projection.projectionPolicy.gpuComparison
					.resident.cumulativeScatteringDensity,
			}));
			expect(
				caseReport.resident.gpuVsProducingPassExact.failureCount,
			).toBe(0);
			expect(caseReport.readbacks.mode).toBe(
				"selected-scalars-only",
			);
			expect(caseReport.readbacks.fields.length).toBe(10);
			expect(caseReport.readbacks.fields.every(
				(readback) =>
					readback.scalarCount === 6 * 15
					&& readback.scalarCount
						< readback.fullFieldScalarCount,
			)).toBeTrue();
			expect(caseReport.failures).toEqual([]);
		}

		expect(report.explicitZeroVersusOmitted).toEqual(
			jasmine.objectContaining({
				rule: "exact-numerical-value",
				zeroCaseId: GROUND_PARITY_CASE_IDS[2],
				omittedCaseId:
					GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
				exactScalarCount: 2 * 10 * 6 * 15 + 6 * 15,
				failureCount: 0,
				failures: [],
			}),
		);
		expect(
			report.explicitZeroVersusOmitted.fields.every(
				(field) =>
					field.cpu.failureCount === 0
					&& field.gpu.failureCount === 0,
			),
		).toBeTrue();
		expect(report.reflectiveBranchEvidence).toEqual(
			jasmine.objectContaining({
				coordinateMismatchCount: 0,
				failureCount: 0,
				failures: [],
			}),
		);
		expect(
			report.reflectiveBranchEvidence.starDifferentialScalarCount,
		).toBeGreaterThan(0);
		expect(
			report.reflectiveBranchEvidence.gpuDifferentialScalarCount,
		).toBeGreaterThan(0);
		expect(
			report.reflectiveBranchEvidence
				.overlappingDifferentialScalarCount,
		).toBeGreaterThan(0);
		expect(
			report.reflectiveBranchEvidence.fields.map(
				(field) => field.fieldId,
			),
		).toEqual(
			STAR_GROUND_GPU_PARITY_REFLECTIVE_EVIDENCE_FIELD_IDS,
		);
		for (const field of report.reflectiveBranchEvidence.fields) {
			expect(field.star.differentialScalarCount).toBeGreaterThan(0);
			expect(field.gpu.differentialScalarCount).toBeGreaterThan(0);
			expect(
				field.overlappingDifferentialScalarCount,
			).toBeGreaterThan(0);
			expect(field.failureCount).toBe(0);
			expect(field.failures).toEqual([]);
		}
	}, STAR_GROUND_GPU_PARITY_BUILD_TIMEOUT_MILLISECONDS);
});
