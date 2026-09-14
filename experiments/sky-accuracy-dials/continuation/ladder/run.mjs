import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {freemem} from 'node:os';
import {gzipSync} from 'node:zlib';
import {checkedAbsolute, createRun, identity, listFiles, readRepository, storage, verifyRun} from '../../io/files.mjs';
import {loadInputs} from '../../execution.mjs';
import {measurements} from '../../processing.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {assertLadderPrefix, readLadderCapture} from './read.mjs';
import {evaluateLadder} from './evaluate.mjs';
import {referenceLadderProof} from './proof.mjs';
import {readPhysicalFirst} from './physical/read.mjs';
import {evaluatePhysicalFirst} from './physical/evaluate.mjs';
import {physicalFirstProof} from './physical/proof.mjs';

const MiB = 1024 ** 2;

/** Authenticate the actual executable using bounded memory.
 * @param {DialContinuationToolIdentity} expected @param {() => void} progress @returns {Promise<void>}
 */
async function authenticateNode(expected, progress) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let count = 0,
		lastProgress = Date.now();
	progress();
	for await (const chunk of createReadStream(checkedAbsolute(process.execPath))) {
		hash.update(chunk);
		count += chunk.length;
		if (Date.now() - lastProgress >= 5000) {
			progress();
			lastProgress = Date.now();
		}
	}
	progress();
	assert.equal(count, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Retain null literally and use standard CSV escaping.
 * @param {SkyContinuationAnalysisTable} table @returns {string}
 */
function csv(table) {
	/** @param {SkyContinuationAnalysisCell} value @returns {string} */
	const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
	return `${table.columns.map(cell).join(',')}\n${table.rows.map((row) => row.map(cell).join(',')).join('\n')}\n`;
}

/** Consume only actual accepted R0..Rk captures and preserve their unresolved finite-N4 limits.
 * This is retrospective assessment, never a new prospective convergence forecast.
 * @param {string} registrationRun - Exact accepted C0 record.
 * @param {readonly string[]} captureRuns - One accepted capture per rung in contiguous R0..Rk order.
 * @returns {Promise<DialExecutionResult>} Accepted diagnostic does not mean its reference is adequate.
 */
export async function assessReferenceLadder(registrationRun, captureRuns) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	assert.ok(Array.isArray(captureRuns) && captureRuns.length >= 1 && captureRuns.length <= 12);
	assert.equal(new Set(captureRuns).size, captureRuns.length);
	const planSnapshot = {...registration.record.plan, path: `${registration.run}/continuation-plan.md`};
	readRepository(planSnapshot.path, planSnapshot);
	const admission = admitJob(registration, 'cpu', 'component', 3 * MiB, 'C2');
	await authenticateNode(registration.record.host.node, () => {});
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const inputs = loadInputs(),
		measured = measurements(),
		physicalFirst = readPhysicalFirst(registration),
		parentSeals = captureRuns.map((path) => verifyRun(path));
	const sourcePaths = listFiles('experiments/sky-accuracy-dials').filter((path) =>
		/\.(?:mjs|js|ts|json)$/u.test(path),
	);
	const sources = sourcePaths.map((path) => identity(path));
	/** @type {DialDerivation} */ const recipe = {
		parents: [
			registration.seal,
			registration.record.inputs,
			planSnapshot,
			measured.sourceIdentity,
			...physicalFirst.parents,
			...parentSeals,
			...sources,
			...(admission.usage.invalidEvidence ?? []).map((item) => item.seal),
			...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		],
		operation:
			'Authenticate a contiguous registered raw R0-R11 prefix, score matched grouped N1-N4 outputs, reproduce all available fixed-field envelopes, retain observed sensitivities and background dependence, and require every material numerical component before declaring finite-N4 reference adequacy.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C2',
			caseId: 'reference-ladder-assessment',
			admission,
			node: registration.record.host.node,
			sources,
			captureRuns,
			selectors: {
				representation: 'grouped',
				solar: 'monotone-cubic',
				viewSubdivisions: [8, 16],
				orders: [1, 2, 3, 4],
			},
			equations: {
				physicalFirst:
					'At each frozen probe/channel, compare independently integrated grouped N1 with the continuous physical-J1 reference from 00109. Combine physical and fixed-field allowances explicitly. For N4 component residuals use n=L1-P, p=L4-L1+P-M, r=n+p, and retain n², p², 2*n*p. The remaining discrepancy p changes across rungs and is not physics-only.',
				delta: 'Delta=Cn(candidate)-Cn(control); effective increment change=Delta(Cn)-Delta(Cn-1), with actual cumulative reconstruction. This is not a separately interpolated pure-Jn view.',
				sensitivity:
					'2*L2(observed response) is an explicitly unqualified sensitivity allowance heuristic, not a bound on remaining error.',
				view: 'Fixed fields only: U=L2(per-probe independent envelope allowances); D=L2(L8-reference)-L2(L16-reference); gate U<=0.2D and D>2U. Missing/empty groups retain null.',
				compensation:
					'Only resolved fixed-field references: n=L8-reference; p=reference-measurement; r=L8-measurement; SSE(r)=SSE(n)+SSE(p)+2*n.p. p includes all cache/recurrence numerical error and physical/observation discrepancy.',
				backgrounds:
					'Source (R7-R9) versus (R1-R0); transport (R7-R10) versus (R2-R1); altitude (R7-R11) versus (R4-R3). Several other factors change, so these are combined background responses, not isolated factorial interactions.',
				adequacy:
					'Utotal=sum(qualified component allowances) only when every material component and interaction qualifies; any missing/unqualified term makes Utotal=null. R7 and its R8-R11 variants are reference members, not exact solutions.',
			},
		},
	};
	const initialBytes = storage().retainedBytes,
		run = createRun('c2-ladder-assess', recipe),
		definition = identity(`${run.path}/definition.json`);
	/** @type {DialFileIdentity|null} */ let seal = null;
	let accepted = false,
		lastProgress = 0;
	const guard = () => {
		const now = Date.now();
		if (now - lastProgress >= 15000) {
			run.progress('ladder', 'Authenticating retained rungs and evaluating matched finite scopes.');
			lastProgress = now;
		}
		const current = run.guard();
		assert.ok(now - started < admission.timeoutMilliseconds, 'Ladder assessment exhausted remaining CPU time.');
		assert.ok(freemem() >= registration.budgets.hostHeadroomBytes, 'Host headroom floor reached.');
		assert.ok(
			current.retainedBytes - initialBytes < admission.allocatedBytes - 256 * 1024,
			'Preserve ladder failure and seal reserve.',
		);
		assert.ok(
			current.retainedBytes - registration.initialStorage.retainedBytes <= registration.budgets.newRetainedBytes,
		);
	};
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	const write = (
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} using the exact sources, selectors, parents and equations in this frozen ladder recipe.`,
		},
	) => {
		guard();
		const bytes = Buffer.isBuffer(value)
			? value
			: Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
		assert.ok(bytes.length + storage().retainedBytes - initialBytes < admission.allocatedBytes - 256 * 1024);
		return run.write(name, bytes, derivation);
	};
	try {
		guard();
		/** @type {SkyLadderSource[]} */ const loaded = [];
		for (const [index, path] of captureRuns.entries()) {
			run.progress(
				'read-rung',
				`Authenticate R${index} controls, spectra and independent fixed-field methods.`,
				index,
				captureRuns.length,
			);
			loaded.push(readLadderCapture(path, index, registration, inputs, guard));
			await new Promise((resolve) => setImmediate(resolve));
		}
		assertLadderPrefix(loaded.map((source) => source.loaded.caseId));
		const proof = referenceLadderProof(),
			physicalProof = physicalFirstProof(),
			physicalTables = evaluatePhysicalFirst(loaded, registration, measured, physicalFirst, guard),
			tables = {
				...evaluateLadder(loaded, registration, measured, guard),
				'physical-first-points': physicalTables.points,
				'physical-first-groups': physicalTables.groups,
				'physical-first-coverage': physicalTables.coverage,
			};
		const invariantColumn = tables.contrasts.columns.indexOf('expected_C1_invariance_pass');
		const invariance = {
			passed: !tables.contrasts.rows.some((row) => row[invariantColumn] === false),
			checkedGroupCount: tables.contrasts.rows.filter((row) => row[invariantColumn] !== null).length,
			failedGroupCount: tables.contrasts.rows.filter((row) => row[invariantColumn] === false).length,
		};
		/** @type {DialFileIdentity[]} */ const artifacts = [];
		for (const [name, table] of Object.entries(tables)) {
			for (const row of table.rows) {
				assert.equal(row.length, table.columns.length);
				assert.ok(row.every((cell) => typeof cell !== 'number' || Number.isFinite(cell)));
			}
			artifacts.push(write(`${name}.json.gz`, gzipSync(JSON.stringify(table), {level: 9})));
			// All cells remain in canonical JSON; retain CSV only for the two human summary tables.
			if (['scores', 'adequacy'].includes(name)) artifacts.push(write(`${name}.csv`, csv(table)));
		}
		artifacts.push(
			write(
				'ground-density.json.gz',
				gzipSync(JSON.stringify(loaded.flatMap((source) => source.ground)), {level: 9}),
			),
		);
		write('proof.json', proof);
		write('physical-first-proof.json', physicalProof);
		const viewGateColumn = tables.views.columns.indexOf('qualified_local_view_control');
		const limitations = [
			'All comparisons are retrospective. No incoming Richardson/quarter-law retry or new prospective qualification is performed.',
			'Numerical screen scope is three registered times by 81 rays by six channels; Kider scores use only the five available registered measurement channels. Components are 40 baseline-error/geometry-selected rays by four channels, and remain biased. Neither is the full 17-time, 31-channel boundary.',
			'Grouped N1-N4, monotone-cubic Z180 and view subdivisions 8/16 are held explicit. Subdivision counts are per physical altitude segment; changing P changes the actual midpoint count. Historical R0 extra views are not used.',
			'Angular/elevation groups overlap and include empty groups. Missing scalar pairs are never removed from a norm. Empty, incomplete, and below-floor direction comparisons remain null.',
			'Twice an observed step or placement difference is an unqualified sensitivity heuristic. A decreasing step or better Kider score cannot validate an extrapolated remainder. R8 is a same-count placement change; R9-R11 each branch from R7.',
			'Independent fixed-field envelopes can qualify local view integration. They retain Float32 recurrence and interpolation, do not resolve actual angular J2-J4 error, and cannot qualify the complete N4 solver.',
			'Whole-N4 adequacy is unresolved: outgoing/angular remainders, other missing material terms and interactions have no qualified complete allowance here. This assessment cannot substitute a largest profile or a physical-J1/manufactured-phase proof for those missing controls.',
			'Fixed-field compensation is diagnostic of final-view error only. Its remaining residual includes cache/recurrence numerical error, omitted scattering tail, physical-model and observation discrepancies; it is not physics-only.',
			'Optional ground records retain source-density units and raw tap derivations. They are not radiance references or a propagated local-J2/N4 error bound. Independent local-J2 evidence is assessed by its separate owner.',
			'Ground time/grid/origin identities remain exact. Browser-versus-Node unit-direction components may differ by at most8*Number.EPSILON from independent binary64 trigonometry; original captured directions are preserved. This is coordinate-address validation, not an added numerical-reference allowance or a changed scoring gate.',
			'Physical-first tables compare the same biased forty-probe/four-channel set with the independent continuous J1 reference. They assess first-order numerical error and component residual compensation only; a changing higher-order remainder is retained, not treated as invariant or attributed solely to physics.',
		];
		const summary = {
			schemaId: 'sky-continuation-reference-ladder-assessment-v1',
			representation: 'grouped',
			solarInterpolation: 'monotone-cubic',
			units: 'W m^-2 sr^-1 nm^-1',
			prefix: loaded.map((source) => source.loaded.caseId),
			missingCases: Array.from({length: 12 - loaded.length}, (_, index) => `r${loaded.length + index}`),
			invariance,
			proof,
			physicalFirst: {
				run: physicalFirst.run,
				parents: physicalFirst.parents,
				proof: physicalProof,
				pointRows: physicalTables.points.rows.length,
				groupRows: physicalTables.groups.rows.length,
				coverageRows: physicalTables.coverage.rows.length,
			},
			finiteN4ReferenceAdequate: false,
			totalReferenceAllowanceW: null,
			fullRegisteredBoundary: false,
			prospective: false,
			localView: {
				groupCount: tables.views.rows.length,
				qualified: tables.views.rows.filter((row) => row[viewGateColumn] === true).length,
				rejected: tables.views.rows.filter((row) => row[viewGateColumn] === false).length,
				unavailable: tables.views.rows.filter((row) => row[viewGateColumn] === null).length,
			},
			sources: loaded.map((source) => ({
				run: source.run,
				seal: source.loaded.sealIdentity,
				caseId: source.loaded.caseId,
				controls: source.loaded.control.controls,
				diagnosticArtifacts: source.diagnostics,
				envelopeCount: source.envelopes.size,
				resolvedEnvelopeCount: [...source.envelopes.values()].filter((row) => row.errorAllowance !== null)
					.length,
			})),
			artifacts,
			limitations,
		};
		write('summary.json', summary);
		const scoreCase = tables.scores.columns.indexOf('case'),
			scoreQ = tables.scores.columns.indexOf('view_subdivisions'),
			scoreOrder = tables.scores.columns.indexOf('order'),
			scoreGroup = tables.scores.columns.indexOf('group'),
			scoreValue = tables.scores.columns.indexOf('Kider_rmse_mW');
		const scoreRows = tables.scores.rows.filter(
			(row) => row[scoreOrder] === 4 && row[scoreGroup] === 'screen/all-three-times/all-rays',
		);
		write(
			'report.md',
			`# C2 reference ladder assessment\n\nAuthenticated ${loaded.length} contiguous rungs (${summary.prefix.join(', ')}). C1 invariance checks: ${invariance.passed ? 'passed where available' : 'FAILED; dependent scientific conclusions are rejected'}. This record assesses existing outcomes; it makes no prospective prediction.\n\nWhole finite-N4 reference adequacy remains unresolved, with total allowance null. ${summary.localView.qualified} local fixed-field view groups qualify the registered 8-to-16 reduction gate, ${summary.localView.rejected} reject it, and ${summary.localView.unavailable} remain unavailable. These local gates do not establish cache or whole-solver accuracy.\n\n| Case | Subdivisions per altitude segment | Grouped N4 screen RMSE (mW) |\n| --- | ---: | ---: |\n${scoreRows.map((row) => `| ${row[scoreCase]} | ${row[scoreQ]} | ${row[scoreValue] === null ? 'unavailable' : Number(row[scoreValue]).toPrecision(10)} |`).join('\n')}\n\n- [All condition/group/order scores](scores.csv)\n- [Per-group reference adequacy and missing components](adequacy.csv)\n- [Complete coverage, selectors and source identities](summary.json)\n- Compressed JSON tables retain signed order responses, combined background dependence, independent local-view checks and fixed-field compensation, and distances to every available R7-R11 member.\n\n${limitations.map((item) => `- ${item}`).join('\n')}\n`,
		);
		const snapshots = [];
		for (const source of sources) {
			guard();
			snapshots.push({identity: source, utf8: readRepository(source.path, source).toString()});
		}
		write('sources.json.gz', gzipSync(JSON.stringify(snapshots), {level: 9}), {
			parents: [definition],
			operation:
				'Losslessly preserve the exact complete experiment JS/MJS/type/JSON source snapshot pinned in the recipe; this includes every executed ladder helper and its current collaborators.',
		});
		for (const parent of recipe.parents) {
			guard();
			readRepository(parent.path, parent);
		}
		await authenticateNode(registration.record.host.node, guard);
		guard();
		accepted = invariance.passed;
		seal = run.finish(accepted ? 'accepted' : 'rejected', {
			caseId: 'reference-ladder-assessment',
			jobElapsedMilliseconds: Date.now() - started,
			sourceCount: loaded.length,
			invariance,
			finiteN4ReferenceAdequate: false,
			cleanup: run.cleanup(),
		});
	} catch (error) {
		run.finish('failed', {
			caseId: 'reference-ladder-assessment',
			jobElapsedMilliseconds: Date.now() - started,
			message: String(error),
			stack: error.stack,
			cleanup: run.cleanup(),
		});
		verifyRun(run.path);
		throw error;
	}
	verifyRun(run.path);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.equal(terminal.state, accepted ? 'accepted' : 'rejected');
	assert.ok(
		seal.byteLength + terminal.artifacts.reduce((sum, artifact) => sum + artifact.byteLength, 0) <=
			admission.allocatedBytes,
	);
	return {run: run.path, seal, accepted};
}
