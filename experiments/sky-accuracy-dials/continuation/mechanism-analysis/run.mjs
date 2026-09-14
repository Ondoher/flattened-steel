import assert from 'node:assert/strict';
import path from 'node:path';
import {isBuiltin} from 'node:module';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {gzipSync, gunzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../../io/files.mjs';
import {measurements} from '../../processing.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {readMechanismAssessmentInputs, readMechanismAssessment} from './read.mjs';
import {evaluateMechanismResponses} from './evaluate.mjs';
import {evaluateAdaptiveMechanisms} from './adaptive/evaluate.mjs';
import {mechanismAssessmentProof} from './proof.mjs';

const MiB = 1024 ** 2;
const LIMITATIONS = [
	'Ground time/grid/origin identities remain exact. Independently recomputed browser/Node unit-direction components admit only8*Number.EPSILON absolute coordinate roundoff, preserving original captured vectors. This coordinate-address check neither changes numerical-reference allowances nor relaxes scoring gates.',
	'C3 is retrospective mechanism analysis. Original qualitative hypotheses remain in the sealed catalog; these observations do not become prospective forecasts. C4 predictions have their own assessment.',
	'The numerical screen contains three times,81rays,and six channels; Kider uses only0,8,16,24,30. Channel39 is spectral only. Forty deliberately selected component probes and four ground probes do not represent the full17-time boundary.',
	'Adaptive budgets include every queried trial node; prepared31P sparse support is reported separately. No GPU-job duration is presented as runtime view-evaluation cost. Budgets,orders,and angular/elevation strata overlap.',
	'Only the six-rule reference-envelope allowance contains final-integration plus attenuation uncertainty. Its allowance is empirical. Other retained method allowances cover attenuation only.',
	'The positive local reduction criterion is U<=0.2D and D>2U. Worsening uses the same separation gate on abs(D), with an explicit negative reduction. A null allowance remains unresolved, never zero.',
	'Density grouping and query-density changes regenerate higher orders. Their own fixed-field references qualify integration of those fields, not the correctness of changed recurrence values. Float32 storage and feedback effects remain coupled.',
	'Local J2 comparisons use exact-ground zero-inward-L1 and unitsW m^-3 sr^-1 nm^-1. Matched finite CPU controls exist only for midpoint I512/I2048; endpoint/aspect GPU differences also include packing and reconstruction. No silent Lambertian boundary correction is made.',
	'No adequate whole-N4 numerical reference covers the complete registered boundary. Lower Kider RMSE, predictable responses, and local numerical improvements do not alone qualify combined accuracy. C5 is proposed skipped for this missing admission evidence.',
];

/** Exact static CPU dependency closure plus nearest ambient declarations.
 * Dynamic experiment imports are not used by this assessor; package imports fail closed.
 * @returns {readonly DialFileIdentity[]}
 */
function assessmentSources() {
	const queue = [
		'experiments/sky-accuracy-dials/continuation/mechanism-analysis/run.mjs',
		// Canonical normalized-table and channel-metadata contracts live in a
		// declaration-only sibling, so no executable import can discover them.
		'experiments/sky-accuracy-dials/continuation/analysis/types.d.ts',
	];
	/** @type {Map<string,DialFileIdentity>} */ const found = new Map();
	while (queue.length) {
		const file = queue.shift();
		if (found.has(file)) continue;
		const bytes = readRepository(file);
		found.set(file, identity(file, bytes));
		for (const match of bytes
			.toString()
			.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu)) {
			if (isBuiltin(match[1])) continue;
			assert.ok(match[1].startsWith('.'), 'Unexpected CPU package dependency.');
			queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])));
		}
	}
	const declarations = sourceIdentities().filter((source) => source.path.endsWith('/types.d.ts'));
	for (const file of [...found.keys()]) {
		const nearest = declarations
			.filter((source) => file.startsWith(`${path.posix.dirname(source.path)}/`))
			.sort((a, b) => b.path.length - a.path.length)[0];
		if (nearest) found.set(nearest.path, nearest);
	}
	return [...found.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Stream-authenticate the actual Node binary without retaining its bytes.
 * @param {DialContinuationToolIdentity} expected @param {() => void} progress @returns {Promise<void>}
 */
async function authenticateNode(expected, progress) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0,
		last = Date.now();
	progress();
	for await (const chunk of createReadStream(checkedAbsolute(process.execPath))) {
		hash.update(chunk);
		bytes += chunk.length;
		if (Date.now() - last >= 5000) {
			progress();
			last = Date.now();
		}
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
	progress();
}

/** Validate lossless compact table shape and finite numerical cells.
 * @param {SkyContinuationAnalysisTable} table @returns {void}
 */
function validateTable(table) {
	assert.ok(table.columns.length > 0 && new Set(table.columns).size === table.columns.length);
	for (const row of table.rows) {
		assert.equal(row.length, table.columns.length);
		for (const value of row)
			assert.ok(
				value === null ||
					typeof value === 'string' ||
					typeof value === 'boolean' ||
					(typeof value === 'number' && Number.isFinite(value)),
			);
	}
}

/** Standard CSV escaping, including literal null for unresolved values.
 * @param {SkyContinuationAnalysisTable} table @returns {Buffer}
 */
function csv(table) {
	/** @param {SkyContinuationAnalysisCell} value @returns {string} */ const cell = (value) =>
		`"${String(value).replaceAll('"', '""')}"`;
	return Buffer.from(`${[table.columns, ...table.rows].map((row) => row.map(cell).join(',')).join('\n')}\n`);
}

/** Assess all registered C3 outcomes using only existing immutable evidence.
 * No construction or new numerical reference is executed by this CPU consumer.
 * @param {string} registrationRun - Exact original C0 registration.
 * @param {string} catalogRun - Exact prospective mechanism catalog.
 * @param {readonly string[]} captureRuns - The ten accepted C3 captures, one per case.
 * @param {string} localJ2Run - Exact completed00113 independent point reference.
 * @param {string} ladderAssessmentRun - Accepted actual contiguous R0..Rk assessment.
 * @returns {Promise<DialExecutionResult>} Accepted analysis, distinct from numerical qualification.
 */
export async function assessMechanisms(registrationRun, catalogRun, captureRuns, localJ2Run, ladderAssessmentRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'cpu', 'component', 4 * MiB, 'C3');
	await authenticateNode(registration.record.host.node, () => {});
	const sources = assessmentSources(),
		inputs = readMechanismAssessmentInputs(
			registrationRun,
			catalogRun,
			captureRuns,
			localJ2Run,
			ladderAssessmentRun,
			() => {},
		),
		measured = measurements();
	assert.deepEqual(admission.usage.allocationAmendment?.seal, inputs.catalog.record.allocation);
	const plan = {...registration.record.plan, path: `${registration.run}/continuation-plan.md`};
	readRepository(plan.path, plan);
	const parents = [
		...new Map(
			[
				...inputs.parents,
				measured.sourceIdentity,
				plan,
				...(admission.usage.invalidEvidence ?? []).map((item) => item.seal),
			].map((item) => [item.path, item]),
		).values(),
	];
	const initial = storage().retainedBytes,
		run = createRun('c3-mech-assess', {
			parents,
			operation:
				'Authenticate the complete registered C3 matrix and exact H pair; compare counted adaptive versus uniform view integration against each frozen field, matched density representation/altitude factorials using full signed spectra and exact SSE identities, and incoming source-density changes against limited independent local J2 references. Preserve every unresolved reference and propose C5 non-admission when no whole-N4 reference exists.',
			parameters: {
				continuationRegistration: registrationRun,
				mechanismRegistration: catalogRun,
				jobKind: 'cpu',
				scope: 'component',
				phase: 'C3',
				caseId: 'mechanism-assessment',
				admission,
				node: registration.record.host.node,
				sourceIdentities: sources,
				captureRuns,
				localJ2Run,
				ladderAssessmentRun,
				equations: {
					spectral:
						'delta=candidate-baseline; factorial=(P55fact-P48fact)-(P55split-P48split), with analogous grouping interaction.',
					sse: 'SSE(r+d)-SSE(r)=2r.d+d.d; the factorial correction uses r=additivePrediction-measurement. Score interaction additionally contains2*dA.dB.',
					view: 'D=abs(uniform-reference)-abs(adaptive-reference). Only the independently reproduced six-rule envelope supplies total integration+attenuation U.',
					incoming:
						'J2=groundDensities.pureDensities[1], matched exact origin/direction. Density-reference residual is not radiance or Kider error.',
					fullBoundary:
						'Unavailable complete numerical reference => wholeN4=false; no favorable subset or zero-error substitution.',
				},
				limitations: LIMITATIONS,
			},
		});
	let closed = false,
		lastProgress = 0;
	const definition = identity(`${run.path}/definition.json`);
	// Every artifact links through this immutable definition to the complete input
	// graph. Repeating hundreds of input identities in each table's manifest would
	// consume the evidence allowance without adding a derivation edge.
	/** @type {DialDerivation} */ const derived = {
		parents: [definition],
		operation:
			'Apply the exact C3 equations, selectors, parent identities, and implementation recorded in definition.json; retain this compact derived assessment artifact.',
	};
	const guard = () => {
		const current = run.guard();
		assert.ok(Date.now() - started < admission.timeoutMilliseconds, 'C3 CPU elapsed allowance exhausted.');
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
		if (Date.now() - lastProgress >= 5000) {
			run.progress('mechanism-assessment', 'Assessing compact immutable V/D/I evidence.');
			lastProgress = Date.now();
		}
		return current;
	};
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	const write = (name, value, derivation) => {
		const current = guard(),
			bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(
			current.retainedBytes - initial + bytes.length < admission.allocatedBytes - 384 * 1024,
			'C3 assessment would consume its protected terminal reserve.',
		);
		return run.write(name, bytes, derivation ?? derived);
	};
	try {
		run.progress(
			'mechanism-assessment',
			'Evaluating all ten C3 cases with separate measurement and component scopes.',
		);
		const proof = mechanismAssessmentProof(),
			response = evaluateMechanismResponses(inputs, measured);
		guard();
		const adaptive = evaluateAdaptiveMechanisms(
			inputs.captures.filter((source) => source.caseId.startsWith('v-')),
			measured,
		);
		guard();
		/** @type {DialFileIdentity[]} */ const artifacts = [];
		/** @param {string} name @param {SkyContinuationAnalysisTable} table @returns {void} */
		const table = (name, table) => {
			validateTable(table);
			const bytes = Buffer.from(JSON.stringify(table)),
				compressed = gzipSync(bytes, {level: 9});
			assert.ok(gunzipSync(compressed).equals(bytes));
			artifacts.push(
				write(`${name}.json.gz`, compressed, {
					parents: [definition],
					operation:
						'Losslessly retain a normalized exact numerical table from the complete input graph and equations in definition.json; null is unresolved. No values are rounded, resampled, or selected for favorable scores.',
					parameters: {
						schemaId: 'sky-normalized-analysis-table-v1',
						uncompressedByteLength: bytes.length,
						uncompressedSha256: sha256(bytes),
						columns: table.columns,
						node: process.version,
					},
				}),
			);
		};
		for (const [name, value] of /** @type {readonly (readonly [string,SkyContinuationAnalysisTable])[]} */ ([
			['density-contrasts', response.contrasts],
			['density-spectrum-layout', response.spectrumLayout],
			['fixed-field-integration', response.fixedFields],
			['incoming-density', response.incoming],
			['incoming-finite-controls', response.finiteControls],
			['invariance', response.invariance],
			['scores', response.scores],
			['adaptive', adaptive.table],
			['adaptive-work', adaptive.work],
			['adaptive-scores', adaptive.scores],
		]))
			table(name, value);
		const packed = gzipSync(response.spectra, {level: 9});
		assert.ok(gunzipSync(packed).equals(response.spectra));
		artifacts.push(
			write('density-spectra.f64.gz', packed, {
				parents: [definition],
				operation:
					'Retain all seven signed density contrasts and two altitude interaction vectors as f64le with exact slice offsets in density-spectrum-layout.json.gz; time/y*9+x/channel0,8,16,24,30,39 order.',
				parameters: {
					uncompressedByteLength: response.spectra.length,
					uncompressedSha256: sha256(response.spectra),
					units: 'W m^-2 sr^-1 nm^-1',
				},
			}),
		);
		const scoreGroup = response.scores.columns.indexOf('group');
		const ordinaryScores = {
			...response.scores,
			rows: response.scores.rows.filter((row) => String(row[scoreGroup]).endsWith('/all-rays')),
		};
		artifacts.push(
			write('scores.csv', csv(ordinaryScores), {
				parents: [definition],
				operation:
					'Retain the complete all-rays aggregate and each-time score rows; overlapping angular-stratum scores remain losslessly in scores.json.gz.',
			}),
			write('adaptive-scores.csv', csv(adaptive.scores)),
			write('proof.json', proof),
		);
		const snapshots = [];
		for (const source of sources) {
			guard();
			snapshots.push({...source, base64: readRepository(source.path, source).toString('base64')});
		}
		const snapshot = Buffer.from(JSON.stringify(snapshots)),
			compressed = gzipSync(snapshot, {level: 9});
		assert.ok(gunzipSync(compressed).equals(snapshot));
		artifacts.push(
			write('sources.json.gz', compressed, {
				parents: [...sources],
				operation:
					'Snapshot the complete static relative CPU import closure plus nearest ambient types as exact path/byteLength/SHA256/base64 JSON; Node builtins are identified by the authenticated executable.',
				parameters: {
					schemaId: 'sky-source-base64-snapshot-v1',
					uncompressedByteLength: snapshot.length,
					uncompressedSha256: sha256(snapshot),
					node: process.version,
					wholeExperimentSourceFingerprintedByRun: true,
				},
			}),
		);
		const localJ2Adequate = inputs.localJ2.record.envelopes.filter((row) => row.empiricalAllowance !== null).length;
		/** @type {SkyMechanismAssessmentSummary} */ const summary = {
			schemaId: 'sky-mechanism-assessment-v1',
			sources: {
				registration: registration.seal,
				catalog: inputs.catalog.seal,
				allocation: inputs.catalog.record.allocation,
				captures: inputs.captures.map((source) => ({caseId: source.caseId, seal: source.input.seal})),
				localJ2: inputs.localJ2.input.seal,
				ladderAssessment: inputs.ladder.seal,
			},
			scope: {
				times: registration.record.scopes.screen.times,
				channels: registration.record.scopes.screen.channels,
				scoreChannels: [0, 8, 16, 24, 30],
				views: [8, 16],
				orders: [1, 2, 3, 4],
				ordinaryRayCount: 243,
			},
			packages: {view: adaptive.summary, density: response.densitySummary, incoming: response.incomingSummary},
			referenceAdequacy: {wholeN4: false, localJ2Adequate, localJ2Total: inputs.localJ2.record.envelopes.length},
			completeRegisteredMatrix: true,
			c5Decision: {
				status: 'skip-proposed',
				candidateCaseIds: [],
				reason: 'No independently adequate whole-N4 reference covers the registered full boundary; component evidence and known-measurement screen gains do not satisfy C5 admission.',
			},
			artifacts,
			limitations: LIMITATIONS,
		};
		artifacts.push(write('adequacy.json', summary.referenceAdequacy));
		artifacts.push(
			write('factor-coverage.json', {
				registeredCases: inputs.catalog.record.cases.filter((item) => item.phase === 'C3'),
				completeRegisteredMatrix: true,
				densityMatrix: [
					['r0', 'd48-split', 'd48-factored'],
					['d55-raw', 'd55-split', 'd55-factored'],
				],
				incomingPairs: [
					['r0', 'i512-end'],
					['r0', 'i512-aspect'],
					['i512-end', 'i2048-end'],
				],
				adaptiveBackgrounds: ['v-raw', 'v-factored'],
				unqualifiedWholeN4: true,
				c5Decision: summary.c5Decision,
			}),
		);
		write('summary.json', summary);
		write(
			'report.md',
			Buffer.from(
				`# C3 mechanism assessment\n\nAll ten registered cases and both exact historical H parents are authenticated. This is retrospective assessment of the three-time screen.\n\nAdaptive comparisons: ${adaptive.summary.localNumericalComparisons.improved} locally improved, ${adaptive.summary.localNumericalComparisons.worsened} locally worsened, ${adaptive.summary.localNumericalComparisons.unresolved} unresolved scalar comparisons across overlapping budgets and orders. Counts include the registered component scope, not independent whole-sky samples.\n\nDensity: ${response.densitySummary.classification} Signed spectral vectors, matched altitude interactions, and exact residual/SSE terms are retained.\n\nIncoming: ${response.incomingSummary.localNumericalComparisons.improved} locally improved, ${response.incomingSummary.localNumericalComparisons.worsened} locally worsened, ${response.incomingSummary.localNumericalComparisons.unresolved} unresolved density comparisons; ${localJ2Adequate}/16 independent local references have admitted empirical allowances.\n\nWhole-N4 reference adequacy remains unresolved. C5 is proposed skipped because its numerical-reference admission is unmet.\n\n[Exact scopes and source identities](summary.json), [ordinary scores](scores.csv), [adaptive scores](adaptive-scores.csv), and compressed normalized tables retain all values without score-based selection.\n\n${LIMITATIONS.map((item) => `- ${item}`).join('\n')}\n`,
			),
		);
		for (const parent of parents) {
			guard();
			readRepository(parent.path, parent);
		}
		for (const source of sources) {
			guard();
			readRepository(source.path, source);
		}
		await authenticateNode(registration.record.host.node, guard);
		guard();
		run.cleanup();
		const seal = run.finish('accepted', {
			caseId: 'mechanism-assessment',
			jobElapsedMilliseconds: Date.now() - started,
			completeRegisteredMatrix: true,
			wholeN4AccuracyQualified: false,
			allocatedBytes: admission.allocatedBytes,
			sourceCount: inputs.captures.length,
			proofChecks: proof.checks,
		});
		closed = true;
		assert.deepEqual(verifyRun(run.path), seal);
		assert.ok(storage().retainedBytes - initial <= admission.allocatedBytes);
		readMechanismAssessment(registrationRun, catalogRun, run.path);
		return {run: run.path, seal, accepted: true};
	} catch (error) {
		if (!closed) {
			run.cleanup();
			run.finish('failed', {
				caseId: 'mechanism-assessment',
				jobElapsedMilliseconds: Date.now() - started,
				failure: String(error),
			});
		}
		throw error;
	}
}
