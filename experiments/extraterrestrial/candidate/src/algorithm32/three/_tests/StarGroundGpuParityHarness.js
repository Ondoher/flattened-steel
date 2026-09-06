import { CanonicalAtmosphere } from "../../atmospheres/CanonicalAtmosphere.js";
import { CacheGpuExecutor } from "../../caches/gpu/CacheGpuExecutor.js";
import { CachePassAssembler } from "../../caches/gpu/CachePassAssembler.js";
import {
	CANONICAL_ATMOSPHERE_CONSTANTS,
} from "../../constants/Algorithm32CanonicalData.js";
import {
	STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS,
} from "../../light-sources/fixtures/star-parity-consts.js";
import { SphericalEarthGeometry } from "../../geometries/SphericalEarthGeometry.js";
import {
	UniformLambertianGroundBoundary,
} from "../../ground-boundaries/UniformLambertianGroundBoundary.js";
import { DistantSunLightSource } from "../../light-sources/DistantSunLightSource.js";
import { createDistantSunCacheBuildPlan } from
	"../../light-sources/distant-sun-cache-plan.js";
import {
	NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
	NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from "../../light-sources/consts.js";
import {
	DEFAULT_NATIVE_PRODUCTION_PROFILE,
	NATIVE_15_SPECTRAL_BASIS,
	createNativeProductionProfile,
} from "../../profiles/native-15-profile.js";
import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_UNITS,
	createSpectralPacket,
} from "../../quantities/index.js";
import { ThreeCacheBackend } from "../ThreeCacheBackend.js";
import {
	CUMULATIVE_SCATTERING_DENSITY_FIELD_IDS,
	GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
	GROUND_CPU_PARITY_PROJECTION_SCHEMA_ID,
	GROUND_PARITY_CASE_IDS,
} from
	"../../../../scripts/algorithm32-star/parity-data-set/browser/consts.js";
import {
	STAR_GROUND_GPU_PARITY_CUMULATIVE_PASS_IDS,
	STAR_GROUND_GPU_PARITY_CPU_LOGICAL_FIRST_ORDER_EVIDENCE,
	STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS,
	STAR_GROUND_GPU_PARITY_FAILURE_SAMPLE_LIMIT,
	STAR_GROUND_GPU_PARITY_FIELD_NAME_BY_PLAN_ID,
	STAR_GROUND_GPU_PARITY_FIRST_ORDER_GPU_EVIDENCE,
	STAR_GROUND_GPU_PARITY_MAXIMUM_SCATTERING_ORDER,
	STAR_GROUND_GPU_PARITY_PURE_RADIANCE_IDS,
	STAR_GROUND_GPU_PARITY_PURE_SCATTERING_IDS,
	STAR_GROUND_GPU_PARITY_REFLECTIVE_EVIDENCE_FIELD_IDS,
	STAR_GROUND_GPU_PARITY_REPORT_SCHEMA_ID,
	STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID,
} from "./star-ground-gpu-parity-consts.js";

/**
 * Execute the dedicated reduced-domain production WebGL parity gate.
 *
 * Star values are authenticated by the Node middleware. The production CPU
 * values are independently executed in its worker thread. This class runs
 * only the production GPU graphs on the browser main thread.
 */
export default class StarGroundGpuParityHarness {
	/** @type {Record<string, any>} */
	_three;

	/** @type {Record<string, any>} */
	_projection;

	/** @type {HTMLCanvasElement | null} */
	_canvas = null;

	/** @type {WebGL2RenderingContext | null} */
	_context = null;

	/** @type {Record<string, any> | null} */
	_renderer = null;

	/** @type {boolean} */
	_disposed = false;

	/**
	 * @param {{
	 *   THREE: Record<string, any>,
	 *   projection: Record<string, any>,
	 * }} request
	 */
	constructor({ THREE, projection }) {
		this._three = THREE;
		this._projection = projection;
	}

	/**
	 * Execute four production N4 GPU graphs and return a bounded JSON report.
	 *
	 * @returns {Promise<Record<string, any>>}
	 */
	async run() {
		this._validateProjection();
		this._createRenderer();
		const report = this._createReport();
		/** @type {Map<string, Record<string, any>>} */
		const executions = new Map();

		try {
			for (const definition of this._caseDefinitions()) {
				try {
					const execution = await this._executeGpuCase(definition);
					executions.set(definition.id, execution);
					const caseReport = this._compareCase({
						definition,
						execution,
					});
					report.cases.push(caseReport);
					this._accumulateCaseTotals(report, caseReport);
					this._appendFailures(report, caseReport.failures);
				} catch (error) {
					const failure = {
						kind: "case-execution",
						caseId: definition.id,
						error: this._serializeError(error),
					};
					report.failures.push(failure);
					report.totals.failureCount += 1;
					report.coverage.gaps.push({
						caseId: definition.id,
						kind: "gpu-case-not-completed",
					});
				}
			}

			if (executions.size === 4) {
				report.explicitZeroVersusOmitted =
					this._compareExplicitZeroAndOmitted(executions);
				report.totals.failureCount +=
					report.explicitZeroVersusOmitted.failureCount;
				report.totals.exactScalarCount =
					report.explicitZeroVersusOmitted.exactScalarCount;
				this._appendFailures(
					report,
					report.explicitZeroVersusOmitted.failures,
				);
				report.reflectiveBranchEvidence =
					this._compareReflectiveBranchEvidence(executions);
				report.totals.failureCount +=
					report.reflectiveBranchEvidence.failureCount;
				this._appendFailures(
					report,
					report.reflectiveBranchEvidence.failures,
				);
			} else {
				report.coverage.gaps.push({
					kind: "explicit-zero-versus-omitted-not-executed",
				});
			}

			report.coverage.executedCaseIds =
				[...executions.keys()];
			report.coverage.gpuCaseCount = executions.size;
			report.coverage.gaps.push(
				...this._coverageGaps(executions),
			);
			report.totals.coverageGapCount = report.coverage.gaps.length;
			report.renderer.webGlErrors = this._drainWebGlErrors();
			if (report.renderer.webGlErrors.length > 0) {
				report.totals.failureCount +=
					report.renderer.webGlErrors.length;
				this._appendFailures(report, [{
					kind: "webgl-errors",
					values: report.renderer.webGlErrors,
				}]);
			}
			report.renderer.resourcesAfterCases = this._rendererResourceCounts();
			report.status = report.totals.failureCount === 0
				&& report.totals.coverageGapCount === 0
				? "passed"
				: "failed";
			return report;
		} finally {
			this.dispose();
		}
	}

	/** Release renderer, context, and DOM resources idempotently. */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._renderer?.setRenderTarget(null);
		this._renderer?.dispose();
		this._renderer?.forceContextLoss();
		this._canvas?.remove();
		this._renderer = null;
		this._context = null;
		this._canvas = null;
	}

	/** @returns {void} */
	_validateProjection() {
		if (this._projection?.sourceAuthentication?.verified !== true) {
			throw new Error(
				"Ground WebGL parity requires authenticated Star projection.",
			);
		}
		if (
			this._projection.productionCpu?.schemaId
				!== GROUND_CPU_PARITY_PROJECTION_SCHEMA_ID
			|| this._projection.productionCpu?.selectionId
				!== this._projection.projectionPolicy?.selectionId
		) {
			throw new Error(
				"Ground WebGL parity requires the aligned production CPU projection.",
			);
		}
		if (
			this._projection.productionCpu.cases.length !== 4
			|| this._projection.cases.length !== 3
		) {
			throw new Error(
				"Ground WebGL parity requires three Star cases and four CPU builds.",
			);
		}
	}

	/** @returns {void} */
	_createRenderer() {
		this._canvas = document.createElement("canvas");
		this._context = this._canvas.getContext("webgl2", {
			alpha: false,
			antialias: false,
			depth: false,
			preserveDrawingBuffer: false,
			stencil: false,
		});
		if (this._context === null) {
			throw new Error("Ground WebGL parity requires WebGL2.");
		}
		this._renderer = new this._three.WebGLRenderer({
			canvas: this._canvas,
			context: this._context,
		});
		this._renderer.debug.checkShaderErrors = true;
	}

	/** @returns {Record<string, any>} */
	_createReport() {
		return {
			schemaId: STAR_GROUND_GPU_PARITY_REPORT_SCHEMA_ID,
			status: "running",
			sourceAuthentication: structuredClone(
				this._projection.sourceAuthentication,
			),
			selectionId: this._projection.projectionPolicy.selectionId,
			maximumScatteringOrder:
				STAR_GROUND_GPU_PARITY_MAXIMUM_SCATTERING_ORDER,
			precision: {
				star: "binary64",
				cpu: this._projection.productionCpu.precision,
				gpu: "R32F",
			},
			policies: {
				cpu: structuredClone(
					this._projection.projectionPolicy.cpuComparison,
				),
				gpu: structuredClone(
					this._projection.projectionPolicy.gpuComparison,
				),
			},
			firstOrderEvidence: {
				gpu: STAR_GROUND_GPU_PARITY_FIRST_ORDER_GPU_EVIDENCE,
				cpu: STAR_GROUND_GPU_PARITY_CPU_LOGICAL_FIRST_ORDER_EVIDENCE,
				actualN4CumulativePasses: [
					...STAR_GROUND_GPU_PARITY_CUMULATIVE_PASS_IDS,
				],
			},
			renderer: {
				description: this._rendererDescription(),
				resourcesBeforeCases: this._rendererResourceCounts(),
			},
			coverage: {
				requiredCaseIds: [
					...GROUND_PARITY_CASE_IDS,
					GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
				],
				requiredPureFieldIds: [
					...STAR_GROUND_GPU_PARITY_PURE_SCATTERING_IDS,
					...STAR_GROUND_GPU_PARITY_PURE_RADIANCE_IDS,
				],
				requiredActualCumulativePassIds: [
					...STAR_GROUND_GPU_PARITY_CUMULATIVE_PASS_IDS,
				],
				residentFieldId:
					STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID,
				executedCaseIds: [],
				gpuCaseCount: 0,
				gaps: [],
			},
			cases: [],
			explicitZeroVersusOmitted: null,
			reflectiveBranchEvidence: null,
			failures: [],
			totals: {
				caseCount: 0,
				executedFieldCount: 0,
				executedFieldScalarCount: 0,
				comparisonScalarCount: 0,
				residentScalarCount: 0,
				exactScalarCount: 0,
				failureCount: 0,
				coverageGapCount: 0,
			},
		};
	}

	/** @returns {Record<string, any>[]} */
	_caseDefinitions() {
		const omitted = this._starCaseById(GROUND_PARITY_CASE_IDS[0]);
		const reflective = this._starCaseById(GROUND_PARITY_CASE_IDS[1]);
		const explicitZero = this._starCaseById(GROUND_PARITY_CASE_IDS[2]);
		return [
			{
				id: omitted.id,
				starCase: omitted,
				domainSelection:
					NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
				forceOmittedGround: true,
			},
			{
				id: reflective.id,
				starCase: reflective,
				domainSelection:
					NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
				forceOmittedGround: false,
			},
			{
				id: explicitZero.id,
				starCase: explicitZero,
				domainSelection:
					NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
				forceOmittedGround: false,
			},
			{
				id: GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
				starCase: explicitZero,
				domainSelection:
					NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
				forceOmittedGround: true,
			},
		];
	}

	/**
	 * @param {string} caseId - Supplies caseId.
	 * @returns {Record<string, any>}
	 */
	_starCaseById(caseId) {
		for (const groundCase of this._projection.cases) {
			if (groundCase.id === caseId) {
				return groundCase;
			}
		}
		throw new Error(`Star projection has no case ${caseId}.`);
	}

	/**
	 * @param {string} caseId - Supplies caseId.
	 * @returns {Record<string, any>}
	 */
	_cpuCaseById(caseId) {
		for (const groundCase of this._projection.productionCpu.cases) {
			if (groundCase.id === caseId) {
				return groundCase;
			}
		}
		throw new Error(`CPU projection has no case ${caseId}.`);
	}

	/**
	 * @param {() => void} resolve - Supplies resolve.
	 * @returns {void}
	 */
	_scheduleYieldResolution(resolve) {
		setTimeout(resolve, 0);
	}

	/** @returns {Promise<void>} */
	_yieldControl() {
		return new Promise(this._scheduleYieldResolution);
	}

	/**
	 * @param {CacheBuildPlan} plan - Supplies plan.
	 * @returns {string[]}
	 */
	_passIds(plan) {
		const passIds = [];
		for (const pass of plan.passes) {
			passIds.push(pass.id);
		}
		return passIds;
	}

	/**
	 * @param {Record<string, any>} definition - Supplies definition.
	 * @returns {Promise<Record<string, any>>}
	 */
	async _executeGpuCase(definition) {
		const owners = this._createOwners(definition);
		const plan = createDistantSunCacheBuildPlan({
			atmosphere: owners.atmosphere,
			geometry: owners.geometry,
			source: owners.source,
			groundBoundary: owners.groundBoundary,
			domainSelection: definition.domainSelection,
			maximumScatteringOrder:
				STAR_GROUND_GPU_PARITY_MAXIMUM_SCATTERING_ORDER,
			constructionControls:
				STAR_PARITY_DISTANT_SUN_CACHE_CONSTRUCTION_CONTROLS[
					STAR_GROUND_GPU_PARITY_MAXIMUM_SCATTERING_ORDER
				],
		});
		const rawBackend = new ThreeCacheBackend({
			THREE: this._three,
			renderer: this._renderer,
		});
		const executor = new CacheGpuExecutor({
			backend: rawBackend,
			assembler: new CachePassAssembler(),
		});
		const probes = this._createGpuProbes(plan, definition.starCase);
		const resourcesBefore = this._rendererResourceCounts();
		const startedAt = performance.now();
		let artifact;

		try {
			artifact = await executor.execute(plan, {
				probeReader: rawBackend,
				probes,
				scheduler: {
					yieldControl: () => this._yieldControl(),
				},
			});
			const buildDuration = performance.now() - startedAt;
			const fields = this._collectGpuPassFields(plan, artifact);
			const residentProjection = this._projectedFieldById(
				definition.starCase,
				STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID,
			);
			const residentCoordinates =
				this._coordinatesForProjection(residentProjection);
			const resident = await rawBackend.readSelectedScalars({
				field: artifact.result,
				coordinates: residentCoordinates,
			});
			const readbacks = this._describeBoundedReadbacks({
				plan,
				probes,
				residentCoordinateCount: residentCoordinates.length,
			});
			return {
				id: definition.id,
				starCaseId: definition.starCase.id,
				domainSelectionId: definition.domainSelection.id,
				groundCapturePath: definition.forceOmittedGround
					? "omitted-canonical-black"
					: definition.starCase.inputs.ground.capturePath,
				buildDuration: {
					value: buildDuration,
					units: "milliseconds",
				},
				plan: {
					passIds: this._passIds(plan),
					result: plan.result,
				},
				fields,
				resident: {
					fieldId: STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID,
					samples: resident.samples,
				},
				readbacks,
				memory: structuredClone(artifact.diagnostics.memory),
				webGlErrors: this._drainWebGlErrors(),
				resourcesBefore,
			};
		} finally {
			artifact?.dispose();
			executor.dispose();
			rawBackend.dispose();
		}
	}

	/**
	 * @param {Record<string, any>} definition - Supplies definition.
	 * @returns {Record<string, any>}
	 */
	_createOwners(definition) {
		const ground = definition.forceOmittedGround
			? null
			: definition.starCase.inputs.ground;
		const albedo = ground === null || ground.kind === "omitted"
			? null
			: /** @type {SpectralReflectancePacket} */ (
				createSpectralPacket({
					quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
					units: SPECTRAL_UNITS.DIMENSIONLESS,
					basis: NATIVE_15_SPECTRAL_BASIS,
					semantics: NATIVE_15_SPECTRAL_BASIS.semantics,
					values: ground.spectralAlbedo.values,
					provenanceIdentity:
						`algorithm32-ground-gpu-browser-${definition.id}`,
				})
			);
		const profile = albedo === null
			? DEFAULT_NATIVE_PRODUCTION_PROFILE
			: createNativeProductionProfile({
				id: `${definition.id}-gpu-browser-profile-v1`,
				albedo,
			});
		const groundBoundary = albedo === null
			? null
			: new UniformLambertianGroundBoundary({
				id: `${definition.id}-gpu-browser-ground-v1`,
				albedo,
			});
		const directionToLight =
			definition.starCase.inputs.scene.directionToLight;
		const atmosphere = new CanonicalAtmosphere({
			constants: CANONICAL_ATMOSPHERE_CONSTANTS,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		});
		const geometry = new SphericalEarthGeometry({
			bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
			topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
			observerHeight: { value: 2, units: "meters" },
			observerUpDirection: [0, 0, 1],
			directionToSource: directionToLight,
			cacheAltitudeBinCount: definition.domainSelection.positionCount,
			cacheBoundaryAltitude: { value: 2, units: "meters" },
			sourceTransmittanceIntervalCount:
				definition.starCase.inputs.controls
					.sourceTransmittanceIntervalCount,
		});
		const source = new DistantSunLightSource({
			directionToLight,
			sourceIrradiance: profile.spectral.sourceIrradianceDensity,
			angularRadius: { value: 0, units: "radians" },
		});
		return {
			atmosphere,
			geometry,
			source,
			groundBoundary,
		};
	}

	/**
	 * @param {CacheBuildPlan} plan - Supplies plan.
	 * @param {Record<string, any>} starCase - Supplies starCase.
	 * @returns {CacheProbe[]}
	 */
	_createGpuProbes(plan, starCase) {
		const probes = [];
		for (const field of plan.fields) {
			const fieldName = this._fieldName(field.id);
			const projection = this._projectedFieldById(starCase, fieldName);
			probes.push({
				field: field.id,
				coordinates: this._coordinatesForProjection(projection),
			});
		}
		return probes;
	}

	/**
	 * @param {string} planFieldId - Supplies planFieldId.
	 * @returns {string}
	 */
	_fieldName(planFieldId) {
		const fieldName =
			STAR_GROUND_GPU_PARITY_FIELD_NAME_BY_PLAN_ID[planFieldId];
		if (fieldName === undefined) {
			throw new Error(`No parity field name exists for ${planFieldId}.`);
		}
		return fieldName;
	}

	/**
	 * @param {Record<string, any>} starCase - Supplies starCase.
	 * @param {string} fieldId - Supplies fieldId.
	 * @returns {Record<string, any>}
	 */
	_projectedFieldById(starCase, fieldId) {
		const fields = fieldId.startsWith("Jthrough")
			? starCase.cumulativeFields
			: starCase.pureFields;
		for (const field of fields) {
			if (field.id === fieldId) {
				return field;
			}
		}
		throw new Error(`${starCase.id} has no projected field ${fieldId}.`);
	}

	/**
	 * @param {Record<string, any>} projection - Supplies projection.
	 * @returns {DirectionalSpectralFieldCoordinates[]}
	 */
	_coordinatesForProjection(projection) {
		const coordinates = [];
		for (const probe of projection.probes) {
			for (
				let wavelengthIndex = 0;
				wavelengthIndex < probe.values.length;
				wavelengthIndex += 1
			) {
				coordinates.push({
					positionIndex: probe.positionIndex,
					directionIndex: probe.directionIndex,
					wavelengthIndex,
				});
			}
		}
		return coordinates;
	}

	/**
	 * @param {CacheBuildPlan} plan - Supplies plan.
	 * @param {CacheBuildArtifact} artifact - Supplies artifact.
	 * @returns {Map<string, readonly Record<string, any>[]>}
	 */
	_collectGpuPassFields(plan, artifact) {
		if (artifact.diagnostics.passes.length !== plan.passes.length) {
			throw new Error("GPU diagnostics do not match the N4 pass graph.");
		}
		const fields = new Map();
		for (let index = 0; index < plan.passes.length; index += 1) {
			const pass = plan.passes[index];
			const diagnostic = artifact.diagnostics.passes[index];
			if (
				diagnostic.id !== pass.id
				|| diagnostic.probe === undefined
			) {
				throw new Error(
					`GPU pass ${pass.id} has no aligned bounded probe.`,
				);
			}
			fields.set(
				this._fieldName(pass.output),
				diagnostic.probe.samples,
			);
		}
		return fields;
	}

	/**
	 * @param {{
	 *   plan: CacheBuildPlan,
	 *   probes: readonly CacheProbe[],
	 *   residentCoordinateCount: number,
	 * }} request
	 * @returns {Record<string, any>}
	 */
	_describeBoundedReadbacks({ plan, probes, residentCoordinateCount }) {
		const fields = [];
		for (const probe of probes) {
			const field = this._planFieldById(plan, probe.field);
			const fullScalarCount = field.storage.width
				* field.storage.height
				* field.storage.layers;
			if (probe.coordinates.length >= fullScalarCount) {
				throw new Error(
					`${probe.field} parity readback is not bounded.`,
				);
			}
			fields.push({
				fieldId: this._fieldName(probe.field),
				scalarCount: probe.coordinates.length,
				fullFieldScalarCount: fullScalarCount,
			});
		}
		return {
			mode: "selected-scalars-only",
			fields,
			resident: {
				fieldId: STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID,
				scalarCount: residentCoordinateCount,
				coverage: "six-complete-native-15-probe-spectra",
			},
		};
	}

	/**
	 * @param {CacheBuildPlan} plan - Supplies plan.
	 * @param {string} fieldId - Supplies fieldId.
	 * @returns {CacheFieldStorage}
	 */
	_planFieldById(plan, fieldId) {
		for (const field of plan.fields) {
			if (field.id === fieldId) {
				return field;
			}
		}
		throw new Error(`Probe references unknown field ${fieldId}.`);
	}

	/**
	 * @param {{
	 *   definition: Record<string, any>,
	 *   execution: Record<string, any>,
	 * }} request
	 * @returns {Record<string, any>}
	 */
	_compareCase({ definition, execution }) {
		const cpuCase = this._cpuCaseById(definition.id);
		const comparisons = [];
		const failures = [];
		let scalarCount = 0;
		let missingGpuPassCount = 0;
		for (const fieldId of STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS) {
			const starField = this._projectedFieldById(
				definition.starCase,
				fieldId,
			);
			const cpuField = this._cpuFieldById(cpuCase, fieldId);
			const gpuSamples = execution.fields.get(fieldId);
			if (gpuSamples === undefined) {
				missingGpuPassCount += 1;
				failures.push({
					kind: "missing-gpu-pass-probe",
					caseId: definition.id,
					fieldId,
				});
				continue;
			}
			const starSamples = this._flattenProjectedField(starField);
			const cpuSamples = this._flattenProjectedField(cpuField);
			const cpuVsStar = this._compareBinary64({
				caseId: definition.id,
				fieldId,
				actual: cpuSamples,
				oracle: starSamples,
				label: "cpu-vs-star",
			});
			const gpuVsStar = this._compareGpu({
				caseId: definition.id,
				fieldId,
				actual: gpuSamples,
				oracle: starSamples,
				label: "gpu-vs-star",
			});
			const gpuVsCpu = this._compareGpu({
				caseId: definition.id,
				fieldId,
				actual: gpuSamples,
				oracle: cpuSamples,
				label: "gpu-vs-cpu",
			});
			scalarCount += starSamples.length;
			failures.push(
				...cpuVsStar.failures,
				...gpuVsStar.failures,
				...gpuVsCpu.failures,
			);
			comparisons.push({
				fieldId,
				evidence: fieldId.startsWith("Jthrough")
					? "actual-n4-cumulative-pass"
					: "actual-n4-pure-field-pass",
				probeSpectrumCount: starField.probes.length,
				scalarCount: starSamples.length,
				cpuVsStar: this._comparisonSummary(cpuVsStar),
				gpuVsStar: this._comparisonSummary(gpuVsStar),
				gpuVsCpu: this._comparisonSummary(gpuVsCpu),
			});
		}

		const logicalFirstOrder = this._compareLogicalFirstOrder({
			definition,
			cpuCase,
			execution,
		});
		failures.push(...logicalFirstOrder.failures);
		const resident = this._compareResidentField({
			definition,
			cpuCase,
			execution,
		});
		failures.push(...resident.failures);
		if (execution.webGlErrors.length > 0) {
			failures.push({
				kind: "case-webgl-errors",
				caseId: definition.id,
				values: execution.webGlErrors,
			});
		}
		const failureCount = this._comparisonFailureCount(comparisons)
			+ missingGpuPassCount
			+ logicalFirstOrder.cpuVsStar.failureCount
			+ logicalFirstOrder.gpuVsStar.failureCount
			+ logicalFirstOrder.gpuVsCpu.failureCount
			+ resident.gpuVsStar.failureCount
			+ resident.gpuVsCpu.failureCount
			+ resident.gpuVsPass.failureCount
			+ execution.webGlErrors.length;
		return {
			caseId: definition.id,
			starCaseId: definition.starCase.id,
			groundCapturePath: execution.groundCapturePath,
			domainSelectionId: execution.domainSelectionId,
			cpuBuildDuration: structuredClone(cpuCase.buildDuration),
			gpuBuildDuration: execution.buildDuration,
			passIds: execution.plan.passIds,
			comparisons,
			logicalFirstOrder: {
				evidence: STAR_GROUND_GPU_PARITY_FIRST_ORDER_GPU_EVIDENCE,
				cpuEvidence:
					STAR_GROUND_GPU_PARITY_CPU_LOGICAL_FIRST_ORDER_EVIDENCE,
				scalarCount: logicalFirstOrder.scalarCount,
				cpuVsStar:
					this._comparisonSummary(logicalFirstOrder.cpuVsStar),
				gpuVsStar:
					this._comparisonSummary(logicalFirstOrder.gpuVsStar),
				gpuVsCpu:
					this._comparisonSummary(logicalFirstOrder.gpuVsCpu),
			},
			resident: {
				fieldId: STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID,
				coverage: "six-complete-native-15-probe-spectra",
				policy: structuredClone(
					this._projection.projectionPolicy.gpuComparison
						.resident.cumulativeScatteringDensity,
				),
				scalarCount: resident.scalarCount,
				gpuVsStar: this._comparisonSummary(resident.gpuVsStar),
				gpuVsCpu: this._comparisonSummary(resident.gpuVsCpu),
				gpuVsProducingPassExact:
					this._comparisonSummary(resident.gpuVsPass),
			},
			readbacks: execution.readbacks,
			memory: execution.memory,
			scalarCount,
			comparisonScalarCount:
				scalarCount * 3
				+ logicalFirstOrder.scalarCount * 3
				+ resident.scalarCount * 3,
			failureCount,
			failures,
		};
	}

	/**
	 * @param {readonly Record<string, any>[]} comparisons - Supplies comparisons.
	 * @returns {number}
	 */
	_comparisonFailureCount(comparisons) {
		let failureCount = 0;
		for (const comparison of comparisons) {
			failureCount += comparison.cpuVsStar.failureCount
				+ comparison.gpuVsStar.failureCount
				+ comparison.gpuVsCpu.failureCount;
		}
		return failureCount;
	}

	/**
	 * @param {Record<string, any>} cpuCase - Supplies cpuCase.
	 * @param {string} fieldId - Supplies fieldId.
	 * @returns {Record<string, any>}
	 */
	_cpuFieldById(cpuCase, fieldId) {
		for (const field of cpuCase.fields) {
			if (field.id === fieldId) {
				return field;
			}
		}
		throw new Error(`${cpuCase.id} has no CPU field ${fieldId}.`);
	}

	/**
	 * @param {Record<string, any>} field - Supplies field.
	 * @returns {Record<string, any>[]}
	 */
	_flattenProjectedField(field) {
		const samples = [];
		for (const probe of field.probes) {
			for (
				let wavelengthIndex = 0;
				wavelengthIndex < probe.values.length;
				wavelengthIndex += 1
			) {
				samples.push({
					coordinates: {
						positionIndex: probe.positionIndex,
						directionIndex: probe.directionIndex,
						wavelengthIndex,
					},
					value: probe.values[wavelengthIndex],
				});
			}
		}
		return samples;
	}

	/**
	 * @param {Record<string, any>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareLogicalFirstOrder({ definition, cpuCase, execution }) {
		const star = this._flattenProjectedField(
			this._projectedFieldById(
				definition.starCase,
				CUMULATIVE_SCATTERING_DENSITY_FIELD_IDS[0],
			),
		);
		const cpu = this._flattenProjectedField(
			this._cpuFieldById(
				cpuCase,
				CUMULATIVE_SCATTERING_DENSITY_FIELD_IDS[0],
			),
		);
		const gpu = execution.fields.get("J1");
		if (gpu === undefined) {
			throw new Error(`${definition.id} has no GPU J1 pass probe.`);
		}
		const cpuVsStar = this._compareBinary64({
			caseId: definition.id,
			fieldId: "logical-Jthrough1",
			actual: cpu,
			oracle: star,
			label: "cpu-vs-star",
		});
		const gpuVsStar = this._compareGpu({
			caseId: definition.id,
			fieldId: "logical-Jthrough1",
			actual: gpu,
			oracle: star,
			label: "gpu-vs-star",
		});
		const gpuVsCpu = this._compareGpu({
			caseId: definition.id,
			fieldId: "logical-Jthrough1",
			actual: gpu,
			oracle: cpu,
			label: "gpu-vs-cpu",
		});
		return {
			scalarCount: star.length,
			cpuVsStar,
			gpuVsStar,
			gpuVsCpu,
			failures: [
				...cpuVsStar.failures,
				...gpuVsStar.failures,
				...gpuVsCpu.failures,
			],
		};
	}

	/**
	 * @param {Record<string, any>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareResidentField({ definition, cpuCase, execution }) {
		const fieldId = STAR_GROUND_GPU_PARITY_RESIDENT_FIELD_ID;
		const star = this._flattenProjectedField(
			this._projectedFieldById(definition.starCase, fieldId),
		);
		const cpu = this._flattenProjectedField(
			this._cpuFieldById(cpuCase, fieldId),
		);
		const pass = execution.fields.get(fieldId);
		if (pass === undefined) {
			throw new Error(`${definition.id} has no Jthrough4 pass probe.`);
		}
		const resident = execution.resident.samples;
		const gpuVsStar = this._compareResidentGpu({
			caseId: definition.id,
			fieldId: "resident-Jthrough4",
			actual: resident,
			oracle: star,
			label: "gpu-vs-star",
		});
		const gpuVsCpu = this._compareResidentGpu({
			caseId: definition.id,
			fieldId: "resident-Jthrough4",
			actual: resident,
			oracle: cpu,
			label: "gpu-vs-cpu",
		});
		const gpuVsPass = this._compareExact({
			caseId: definition.id,
			fieldId: "resident-Jthrough4",
			actual: resident,
			oracle: pass,
			label: "resident-vs-producing-pass",
		});
		return {
			scalarCount: resident.length,
			gpuVsStar,
			gpuVsCpu,
			gpuVsPass,
			failures: [
				...gpuVsStar.failures,
				...gpuVsCpu.failures,
				...gpuVsPass.failures,
			],
		};
	}

	/**
	 * @param {Record<string, Record<string, any>>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareBinary64({ caseId, fieldId, actual, oracle, label }) {
		const policy =
			this._projection.projectionPolicy.cpuComparison.binary64Spectral;
		return this._compareSamples({
			caseId,
			fieldId,
			actual,
			oracle,
			label,
			policy,
		});
	}

	/**
	 * @param {Record<string, Record<string, any>>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareGpu({ caseId, fieldId, actual, oracle, label }) {
		return this._compareGpuAgainstBound({
			caseId,
			fieldId,
			actual,
			oracle,
			label,
			bound: this._gpuBound(fieldId),
		});
	}

	/**
	 * @param {Record<string, Record<string, any>>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareResidentGpu({ caseId, fieldId, actual, oracle, label }) {
		return this._compareGpuAgainstBound({
			caseId,
			fieldId,
			actual,
			oracle,
			label,
			bound:
				this._projection.projectionPolicy.gpuComparison
					.resident.cumulativeScatteringDensity,
		});
	}

	/**
	 * @param {Record<string, any>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareGpuAgainstBound({
		caseId,
		fieldId,
		actual,
		oracle,
		label,
		bound,
	}) {
		return this._compareSamples({
			caseId,
			fieldId,
			actual,
			oracle,
			label,
			policy: {
				rule: "absolute-plus-relative-times-oracle",
				absolute: bound.absolute,
				relative: bound.relative,
			},
		});
	}

	/**
	 * @param {Record<string, Record<string, any>>} request - Supplies request.
	 * @returns {Record<string, any>}
	 */
	_compareExact({ caseId, fieldId, actual, oracle, label }) {
		return this._compareSamples({
			caseId,
			fieldId,
			actual,
			oracle,
			label,
			policy: {
				rule: "exact-numerical-value",
			},
		});
	}

	/**
	 * @param {string} fieldId - Supplies fieldId.
	 * @returns {{absolute: number, relative: number}}
	 */
	_gpuBound(fieldId) {
		const policy =
			this._projection.projectionPolicy.gpuComparison.construction;
		if (fieldId.includes("Jthrough")) {
			return policy.cumulativeScatteringDensity;
		}
		if (fieldId.startsWith("L")) {
			return policy.pureRadiance;
		}
		return policy.pureScatteringDensity;
	}

	/**
	 * @param {{
	 *   caseId: string,
	 *   fieldId: string,
	 *   actual: readonly Record<string, any>[],
	 *   oracle: readonly Record<string, any>[],
	 *   label: string,
	 *   policy: Record<string, any>,
	 * }} request
	 * @returns {Record<string, any>}
	 */
	_compareSamples(request) {
		let failureCount = 0;
		let maximumAbsoluteResidual = 0;
		let maximumRelativeResidual = 0;
		const failures = [];
		const scalarCount = Math.max(
			request.actual?.length ?? 0,
			request.oracle?.length ?? 0,
		);
		for (let index = 0; index < scalarCount; index += 1) {
			const actual = request.actual?.[index];
			const oracle = request.oracle?.[index];
			const coordinatesMatch = actual !== undefined
				&& oracle !== undefined
				&& this._coordinatesEqual(
					actual.coordinates,
					oracle.coordinates,
				);
			const actualValue = actual?.value;
			const oracleValue = oracle?.value;
			const finite = Number.isFinite(actualValue)
				&& Number.isFinite(oracleValue);
			const residual = finite
				? Math.abs(actualValue - oracleValue)
				: Number.POSITIVE_INFINITY;
			const relative = finite && oracleValue !== 0
				? residual / Math.abs(oracleValue)
				: residual;
			maximumAbsoluteResidual = Math.max(
				maximumAbsoluteResidual,
				residual,
			);
			maximumRelativeResidual = Math.max(
				maximumRelativeResidual,
				relative,
			);
			const passed = coordinatesMatch
				&& finite
				&& this._sampleAccepted({
					actual: actualValue,
					oracle: oracleValue,
					policy: request.policy,
				});
			if (passed) {
				continue;
			}
			failureCount += 1;
			if (failures.length < STAR_GROUND_GPU_PARITY_FAILURE_SAMPLE_LIMIT) {
				failures.push({
					kind: "numerical-parity",
					caseId: request.caseId,
					fieldId: request.fieldId,
					comparison: request.label,
					index,
					coordinates: oracle?.coordinates
						?? actual?.coordinates
						?? null,
					actual: actualValue,
					oracle: oracleValue,
					residual,
					allowed: Number.isFinite(oracleValue)
						? this._allowedComparison({
							oracle: oracleValue,
							policy: request.policy,
						})
						: null,
					coordinatesMatch,
				});
			}
		}
		return {
			scalarCount,
			failureCount,
			maximumAbsoluteResidual,
			maximumRelativeResidual,
			failures,
		};
	}

	/**
	 * @param {{
	 *   actual: number,
	 *   oracle: number,
	 *   policy: Record<string, any>,
	 * }} request
	 * @returns {boolean}
	 */
	_sampleAccepted({ actual, oracle, policy }) {
		if (policy.rule === "exact-numerical-value") {
			return actual === oracle;
		}
		const absolute = Math.abs(actual - oracle);
		if (policy.rule === "absolute-or-relative") {
			if (oracle === 0) {
				return actual === 0;
			}
			return absolute <= policy.absolute
				|| absolute / Math.abs(oracle) <= policy.relative;
		}
		if (policy.rule === "absolute-plus-relative-times-oracle") {
			return absolute
				<= policy.absolute + policy.relative * Math.abs(oracle);
		}
		throw new Error(`Unknown ground parity policy ${policy.rule}.`);
	}

	/**
	 * @param {{
	 *   oracle: number,
	 *   policy: Record<string, any>,
	 * }} request
	 * @returns {Record<string, any>}
	 */
	_allowedComparison({ oracle, policy }) {
		if (policy.rule === "exact-numerical-value") {
			return { rule: policy.rule };
		}
		if (policy.rule === "absolute-or-relative") {
			return {
				rule: policy.rule,
				absolute: policy.absolute,
				relative: policy.relative,
				oracle,
			};
		}
		if (policy.rule === "absolute-plus-relative-times-oracle") {
			return {
				rule: policy.rule,
				value:
					policy.absolute + policy.relative * Math.abs(oracle),
			};
		}
		throw new Error(`Unknown ground parity policy ${policy.rule}.`);
	}

	/**
	 * @param {Record<string, any>} left - Supplies left.
	 * @param {Record<string, any>} right - Supplies right.
	 * @returns {boolean}
	 */
	_coordinatesEqual(left, right) {
		return left?.positionIndex === right?.positionIndex
			&& left?.directionIndex === right?.directionIndex
			&& left?.wavelengthIndex === right?.wavelengthIndex;
	}

	/**
	 * @param {Record<string, any>} comparison - Supplies comparison.
	 * @returns {Record<string, any>}
	 */
	_comparisonSummary(comparison) {
		return {
			scalarCount: comparison.scalarCount,
			failureCount: comparison.failureCount,
			maximumAbsoluteResidual: comparison.maximumAbsoluteResidual,
			maximumRelativeResidual: comparison.maximumRelativeResidual,
		};
	}

	/**
	 * @param {Map<string, Record<string, any>>} executions - Supplies executions.
	 * @returns {Record<string, any>}
	 */
	_compareExplicitZeroAndOmitted(executions) {
		const zeroId = GROUND_PARITY_CASE_IDS[2];
		const omittedId = GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID;
		const zeroGpu = executions.get(zeroId);
		const omittedGpu = executions.get(omittedId);
		const zeroCpu = this._cpuCaseById(zeroId);
		const omittedCpu = this._cpuCaseById(omittedId);
		if (zeroGpu === undefined || omittedGpu === undefined) {
			throw new Error(
				"Explicit-zero exact comparison requires both GPU executions.",
			);
		}
		const fields = [];
		const failures = [];
		let exactScalarCount = 0;
		let failureCount = 0;
		for (const fieldId of STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS) {
			const cpuComparison = this._compareExact({
				caseId: zeroId,
				fieldId,
				actual: this._flattenProjectedField(
					this._cpuFieldById(zeroCpu, fieldId),
				),
				oracle: this._flattenProjectedField(
					this._cpuFieldById(omittedCpu, fieldId),
				),
				label: "explicit-zero-cpu-vs-matching-omitted-cpu",
			});
			const gpuComparison = this._compareExact({
				caseId: zeroId,
				fieldId,
				actual: zeroGpu.fields.get(fieldId),
				oracle: omittedGpu.fields.get(fieldId),
				label: "explicit-zero-gpu-vs-matching-omitted-gpu",
			});
			exactScalarCount += cpuComparison.scalarCount
				+ gpuComparison.scalarCount;
			failureCount += cpuComparison.failureCount
				+ gpuComparison.failureCount;
			failures.push(
				...cpuComparison.failures,
				...gpuComparison.failures,
			);
			fields.push({
				fieldId,
				cpu: this._comparisonSummary(cpuComparison),
				gpu: this._comparisonSummary(gpuComparison),
			});
		}
		const residentComparison = this._compareExact({
			caseId: zeroId,
			fieldId: "resident-Jthrough4",
			actual: zeroGpu.resident.samples,
			oracle: omittedGpu.resident.samples,
			label: "explicit-zero-resident-vs-matching-omitted-resident",
		});
		exactScalarCount += residentComparison.scalarCount;
		failureCount += residentComparison.failureCount;
		failures.push(...residentComparison.failures);
		return {
			rule: "exact-numerical-value",
			zeroCaseId: zeroId,
			omittedCaseId: omittedId,
			fields,
			resident: this._comparisonSummary(residentComparison),
			exactScalarCount,
			failureCount,
			failures,
		};
	}

	/**
	 * Require the nonzero Lambertian branch to change affected Star and GPU
	 * outputs on the same Native16/W9 coordinates.
	 *
	 * @param {Map<string, Record<string, any>>} executions - Supplies executions.
	 * @returns {Record<string, any>}
	 */
	_compareReflectiveBranchEvidence(executions) {
		const omittedId = GROUND_PARITY_CASE_IDS[0];
		const reflectiveId = GROUND_PARITY_CASE_IDS[1];
		const omittedGpu = executions.get(omittedId);
		const reflectiveGpu = executions.get(reflectiveId);
		if (omittedGpu === undefined || reflectiveGpu === undefined) {
			throw new Error(
				"Reflective evidence requires omitted and reflective GPU cases.",
			);
		}
		const omittedStar = this._starCaseById(omittedId);
		const reflectiveStar = this._starCaseById(reflectiveId);
		const fields = [];
		const failures = [];
		let starDifferentialScalarCount = 0;
		let gpuDifferentialScalarCount = 0;
		let overlappingDifferentialScalarCount = 0;
		let coordinateMismatchCount = 0;
		let failureCount = 0;
		for (
			const fieldId
			of STAR_GROUND_GPU_PARITY_REFLECTIVE_EVIDENCE_FIELD_IDS
		) {
			const starResult = this._countDifferentials(
				this._flattenProjectedField(
					this._projectedFieldById(reflectiveStar, fieldId),
				),
				this._flattenProjectedField(
					this._projectedFieldById(omittedStar, fieldId),
				),
			);
			const gpuResult = this._countDifferentials(
				reflectiveGpu.fields.get(fieldId),
				omittedGpu.fields.get(fieldId),
			);
			const star = this._differentialSummary(starResult);
			const gpu = this._differentialSummary(gpuResult);
			const overlappingDifferentialCount =
				this._countOverlappingDifferentials({
					left: starResult.differentialCoordinateKeys,
					right: gpuResult.differentialCoordinateKeys,
				});
			const fieldFailures = this._reflectiveFieldFailures({
				fieldId,
				star,
				gpu,
				overlappingDifferentialScalarCount:
					overlappingDifferentialCount,
			});
			starDifferentialScalarCount += star.differentialScalarCount;
			gpuDifferentialScalarCount += gpu.differentialScalarCount;
			overlappingDifferentialScalarCount +=
				overlappingDifferentialCount;
			coordinateMismatchCount += star.coordinateMismatchCount
				+ gpu.coordinateMismatchCount;
			failureCount += fieldFailures.failureCount;
			failures.push(...fieldFailures.failures);
			fields.push({
				fieldId,
				star,
				gpu,
				overlappingDifferentialScalarCount:
					overlappingDifferentialCount,
				failureCount: fieldFailures.failureCount,
				failures: fieldFailures.failures,
			});
		}
		return {
			fieldIds: [
				...STAR_GROUND_GPU_PARITY_REFLECTIVE_EVIDENCE_FIELD_IDS,
			],
			fields,
			starDifferentialScalarCount,
			gpuDifferentialScalarCount,
			overlappingDifferentialScalarCount,
			coordinateMismatchCount,
			failureCount,
			failures,
		};
	}

	/**
	 * @param {readonly Record<string, any>[]} left - Supplies left.
	 * @param {readonly Record<string, any>[]} right - Supplies right.
	 * @returns {{
	 *   scalarCount: number,
	 *   differentialScalarCount: number,
	 *   coordinateMismatchCount: number,
	 *   differentialCoordinateKeys: Set<string>,
	 * }}
	 */
	_countDifferentials(left, right) {
		const scalarCount = Math.max(left?.length ?? 0, right?.length ?? 0);
		let differentialScalarCount = 0;
		let coordinateMismatchCount = 0;
		/** @type {Set<string>} */
		const differentialCoordinateKeys = new Set();
		for (let index = 0; index < scalarCount; index += 1) {
			if (
				!this._coordinatesEqual(
					left?.[index]?.coordinates,
					right?.[index]?.coordinates,
				)
			) {
				coordinateMismatchCount += 1;
				continue;
			}
			if (
				Number.isFinite(left[index].value)
				&& Number.isFinite(right[index].value)
				&& left[index].value !== right[index].value
			) {
				differentialScalarCount += 1;
				differentialCoordinateKeys.add(
					this._coordinateKey(left[index].coordinates),
				);
			}
		}
		return {
			scalarCount,
			differentialScalarCount,
			coordinateMismatchCount,
			differentialCoordinateKeys,
		};
	}

	/**
	 * @param {Record<string, any>} result - Supplies result.
	 * @returns {Record<string, number>}
	 */
	_differentialSummary(result) {
		return {
			scalarCount: result.scalarCount,
			differentialScalarCount: result.differentialScalarCount,
			coordinateMismatchCount: result.coordinateMismatchCount,
		};
	}

	/**
	 * @param {{
	 *   left: Set<string>,
	 *   right: Set<string>,
	 * }} request
	 * @returns {number}
	 */
	_countOverlappingDifferentials({ left, right }) {
		let count = 0;
		for (const coordinateKey of left) {
			if (right.has(coordinateKey)) {
				count += 1;
			}
		}
		return count;
	}

	/**
	 * @param {{
	 *   fieldId: string,
	 *   star: Record<string, number>,
	 *   gpu: Record<string, number>,
	 *   overlappingDifferentialScalarCount: number,
	 * }} request
	 * @returns {{
	 *   failureCount: number,
	 *   failures: Record<string, any>[],
	 * }}
	 */
	_reflectiveFieldFailures({
		fieldId,
		star,
		gpu,
		overlappingDifferentialScalarCount,
	}) {
		const failures = [];
		let failureCount = 0;
		if (star.differentialScalarCount === 0) {
			failureCount += 1;
			failures.push({
				kind: "missing-star-reflective-differential",
				fieldId,
			});
		}
		if (gpu.differentialScalarCount === 0) {
			failureCount += 1;
			failures.push({
				kind: "missing-gpu-reflective-differential",
				fieldId,
			});
		}
		if (
			star.differentialScalarCount > 0
			&& gpu.differentialScalarCount > 0
			&& overlappingDifferentialScalarCount === 0
		) {
			failureCount += 1;
			failures.push({
				kind: "missing-overlapping-reflective-differential",
				fieldId,
			});
		}
		const fieldCoordinateMismatchCount =
			star.coordinateMismatchCount + gpu.coordinateMismatchCount;
		if (fieldCoordinateMismatchCount > 0) {
			failureCount += fieldCoordinateMismatchCount;
			failures.push({
				kind: "reflective-differential-coordinate-mismatch",
				fieldId,
				count: fieldCoordinateMismatchCount,
			});
		}
		return {
			failureCount,
			failures,
		};
	}

	/**
	 * @param {Record<string, number>} coordinates - Supplies coordinates.
	 * @returns {string}
	 */
	_coordinateKey(coordinates) {
		return `${coordinates.positionIndex}:`
			+ `${coordinates.directionIndex}:`
			+ `${coordinates.wavelengthIndex}`;
	}

	/**
	 * @param {Record<string, any>} report - Supplies report.
	 * @param {Record<string, any>} caseReport - Supplies caseReport.
	 * @returns {void}
	 */
	_accumulateCaseTotals(report, caseReport) {
		report.totals.caseCount += 1;
		report.totals.executedFieldCount += caseReport.comparisons.length;
		report.totals.executedFieldScalarCount += caseReport.scalarCount;
		report.totals.comparisonScalarCount +=
			caseReport.comparisonScalarCount;
		report.totals.residentScalarCount += caseReport.resident.scalarCount;
		report.totals.failureCount += caseReport.failureCount;
	}

	/**
	 * @param {Record<string, any>} report - Supplies report.
	 * @param {readonly Record<string, any>[]} failures - Supplies failures.
	 * @returns {void}
	 */
	_appendFailures(report, failures) {
		for (const failure of failures) {
			if (
				report.failures.length
				< STAR_GROUND_GPU_PARITY_FAILURE_SAMPLE_LIMIT
			) {
				report.failures.push(failure);
			}
		}
	}

	/**
	 * @param {Map<string, Record<string, any>>} executions - Supplies executions.
	 * @returns {Record<string, any>[]}
	 */
	_coverageGaps(executions) {
		const gaps = [];
		for (const requiredCaseId of [
			...GROUND_PARITY_CASE_IDS,
			GROUND_CPU_PARITY_MATCHING_OMITTED_CASE_ID,
		]) {
			const execution = executions.get(requiredCaseId);
			if (execution === undefined) {
				gaps.push({
					caseId: requiredCaseId,
					kind: "missing-gpu-case",
				});
				continue;
			}
			for (
				const fieldId
				of STAR_GROUND_GPU_PARITY_EXECUTED_FIELD_IDS
			) {
				if (!execution.fields.has(fieldId)) {
					gaps.push({
						caseId: requiredCaseId,
						fieldId,
						kind: "missing-gpu-pass-probe",
					});
				}
			}
		}
		return gaps;
	}

	/** @returns {Record<string, any>} */
	_rendererDescription() {
		const extension =
			this._context.getExtension("WEBGL_debug_renderer_info");
		return {
			threeRevision: this._three.REVISION,
			vendor: extension
				? this._context.getParameter(
					extension.UNMASKED_VENDOR_WEBGL,
				)
				: this._context.getParameter(this._context.VENDOR),
			renderer: extension
				? this._context.getParameter(
					extension.UNMASKED_RENDERER_WEBGL,
				)
				: this._context.getParameter(this._context.RENDERER),
			webglVersion:
				this._context.getParameter(this._context.VERSION),
		};
	}

	/** @returns {Record<string, number>} */
	_rendererResourceCounts() {
		return {
			geometries: this._renderer.info.memory.geometries,
			textures: this._renderer.info.memory.textures,
			programs: this._renderer.info.programs?.length ?? 0,
		};
	}

	/** @returns {number[]} */
	_drainWebGlErrors() {
		const errors = [];
		for (
			let error = this._context.getError();
			error !== this._context.NO_ERROR;
			error = this._context.getError()
		) {
			errors.push(error);
		}
		return errors;
	}

	/**
	 * @param {unknown} error - Supplies error.
	 * @returns {Record<string, any>}
	 */
	_serializeError(error) {
		return {
			name: error instanceof Error ? error.name : "Error",
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		};
	}
}
