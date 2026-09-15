import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {readSourceReconstruction} from './read.mjs';
import {evaluateSourceReconstruction} from './index.mjs';
import {sourceReconstructionProof} from './proof.mjs';
import {
	readPhaseBaseline,
	evaluatePhaseReconstruction,
	phaseReconstructionProof,
	phaseReconstructionReport,
} from './phase.mjs';
import {
	readTransmissionBaseline,
	transmissionCrossCoordinates,
	evaluateTransmissionCross,
	evaluateTransmissionReconstruction,
	transmissionReconstructionProof,
	transmissionReconstructionReport,
} from './transmission.mjs';
import {
	readColumnBaseline,
	evaluateColumnReconstruction,
	columnReconstructionProof,
	columnReconstructionReport,
} from './column.mjs';
import {readSourceGridBaseline, evaluateSourceGrid, sourceGridProof, sourceGridReport} from './grid.mjs';

const reserve = 768 * 1024;
/** @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let size = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		size += chunk.length;
	}
	assert.equal(size, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}
/** Reuse admitted columns for one bounded decomposition. New local hypotheses
 * are separate from prior source-count predictions and all Kider scores.
 * @param {string} registrationRun @param {string} predictionRun @param {string} targetRun
 * @param {string|null} [phaseParentRun] - A prior source reconstruction selects the registered phase attribution.
 * @param {string|null} [transmissionParentRun] - Prior phase attribution selects crossed-coordinate transmission attribution.
 * @param {string|null} [columnParentRun] - Prior transmission attribution selects retained-column representation controls.
 * @param {string|null} [gridParentRun] - Prior column controls select the original-grid interaction.
 * @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runSourceReconstruction(
	registrationRun,
	predictionRun,
	targetRun,
	phaseParentRun = null,
	transmissionParentRun = null,
	columnParentRun = null,
	gridParentRun = null,
) {
	assert.ok(transmissionParentRun === null || phaseParentRun !== null);
	assert.ok(columnParentRun === null || transmissionParentRun !== null);
	assert.ok(gridParentRun === null || columnParentRun !== null);
	const allocatedBytes = (transmissionParentRun === null ? 3 : 4) * 1024 ** 2;
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const input = readSourceReconstruction(registration, predictionRun, targetRun);
	const phaseBaseline =
		phaseParentRun === null ? null : readPhaseBaseline(registration, phaseParentRun, predictionRun, targetRun);
	const transmissionBaseline =
		transmissionParentRun === null
			? null
			: readTransmissionBaseline(
					registration,
					transmissionParentRun,
					/** @type {string} */ (phaseParentRun),
					predictionRun,
					targetRun,
				);
	const columnBaseline =
		columnParentRun === null
			? null
			: readColumnBaseline(
					registration,
					columnParentRun,
					/** @type {string} */ (phaseParentRun),
					/** @type {string} */ (transmissionParentRun),
					predictionRun,
					targetRun,
				);
	const gridBaseline =
		gridParentRun === null
			? null
			: readSourceGridBaseline(
					registration,
					gridParentRun,
					/** @type {string} */ (columnParentRun),
					predictionRun,
					targetRun,
				);
	const caseId = gridBaseline
		? 'source-grid'
		: columnBaseline
			? 'column-reconstruction'
			: transmissionBaseline
				? 'transmission-reconstruction'
				: phaseBaseline
					? 'phase-reconstruction'
					: 'source-reconstruction';
	const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/' + caseId + '-plan.md';
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes),
		sources = sourceIdentities();
	assert.ok(planBytes.toString().includes('compensation-attribution-v1'));
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				...input.identities,
				...(phaseBaseline?.identities ?? []),
				...(transmissionBaseline?.identities ?? []),
				...(columnBaseline?.identities ?? []),
				...(gridBaseline?.identities ?? []),
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	const maximumJobMilliseconds = Math.min(300000, admission.timeoutMilliseconds);
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation: gridBaseline
			? 'Exactly replay column controls, restore original solar-grid reconstruction and propagate source integration/count errors and analytic endpoint-derivative predictions through the corrected first-order representation.'
			: columnBaseline
				? 'Exactly replay transmission attribution and evaluate linear, density-factored and finite-top-adjusted geometric source-column representations from retained independent columns. No new integration, GPU work or measurement input.'
				: transmissionBaseline
					? 'Replay phase attribution and split transmission error into solar and altitude components with independently integrated crossed-coordinate columns, preserving original sample weights and physical inputs.'
					: phaseBaseline
						? 'Exactly replay the source/reconstruction baseline, then separate outgoing interpolation, solar-phase coupling and source-transmission reconstruction with analytic phase and retained independent columns. No Kider input, GPU work or new source integration.'
						: 'Separate finite source integration from raw and species-factored first-order reconstruction at the exact retained source-audit samples. Reuse independent source columns; no new optical integral, GPU capture or measured radiance.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: caseId,
			caseId,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			predictionRun,
			targetRun,
			phaseParentRun,
			transmissionParentRun,
			columnParentRun,
			gridParentRun,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			projection: 'Original bottom-interval view16 midpoints with one fixed midpoint attenuation rule.',
			gpuArithmeticParity: false,
			fullViewAccuracy: false,
			measurementInputs: false,
		},
	};
	const run = createRun(
			gridBaseline
				? 'source-grid'
				: columnBaseline
					? 'column-recon'
					: transmissionBaseline
						? 'trans-recon'
						: phaseBaseline
							? 'phase-recon'
							: 'src-reconstruct',
			recipe,
		),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	const work = {mediumEvaluations: 0, columnCalls: 0, trapezoidEvaluations: 0};
	/** @type {SkyTransmissionCross[]} */ const crosses = [];
	/** @type {Record<string,SkySourceAuditState>[]} */ let localChecks = [];
	/** @type {DialFileIdentity[]} */ const crossIdentities = [];
	let lastGuard = 0;
	/** @returns {void} */ function guard() {
		assert.ok(
			Date.now() - started < maximumJobMilliseconds - 30000,
			'Transmission job reached finalization reserve.',
		);
		if (Date.now() - lastGuard >= 1000) {
			run.guard();
			lastGuard = Date.now();
		}
	}
	/** @type {Error|null} */ let failure = null;
	/** @type {ReturnType<typeof evaluateSourceReconstruction>|null} */ let result = null;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation:
				'Derive ' + name + ' from the recorded source/reconstruction equations and authenticated parents.',
		},
		terminal = false,
	) {
		assert.ok(Date.now() - started < maximumJobMilliseconds - (terminal ? 0 : 30000));
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - reserve);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress(
			caseId,
			phaseBaseline
				? 'Replaying the baseline and isolating phase versus transmission reconstruction.'
				: 'Reusing admitted columns to isolate source and reconstruction errors at matching samples.',
		);
		write(caseId + '-plan.md', planBytes, {
			parents: [plan],
			operation:
				'Retain the exact scientific expectations, hypotheses and stopping criteria before derived responses.',
		});
		const packed = Buffer.from(
			JSON.stringify(sources.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
		);
		write('sources.json.gz', gzipSync(packed, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
			},
		});
		write('proof.json', sourceReconstructionProof());
		if (phaseBaseline) write('phase-proof.json', phaseReconstructionProof());
		if (columnBaseline) write('column-proof.json', columnReconstructionProof());
		if (gridBaseline) write('source-grid-proof.json', sourceGridProof());
		if (transmissionBaseline && !columnBaseline) {
			write('transmission-proof.json', transmissionReconstructionProof());
			const coordinates = transmissionCrossCoordinates(input.input);
			write('cross-coordinates.json', coordinates);
			for (const coordinate of coordinates) {
				guard();
				const cross = evaluateTransmissionCross(input.input, coordinate, work, guard);
				crosses.push(cross);
				crossIdentities.push(write('cross-' + String(crosses.length).padStart(2, '0') + '.json', cross));
				assert.ok(
					cross.references.every((reference) => reference.resolved),
					'Unresolved crossed-coordinate reference.',
				);
				if (crosses.length % 8 === 0)
					run.progress(caseId, 'Completed ' + crosses.length + '/64 independent crossed-coordinate columns.');
			}
		}
		write('compatibility.json', input.compatibility, {
			parents: [...input.identities],
			operation:
				'Authenticate retained source-audit identities and unchanged relevant numerical collaborators; preserve original full source snapshots as parents.',
		});
		result =
			gridBaseline && columnBaseline && transmissionBaseline && phaseBaseline
				? evaluateSourceGrid(
						input.input,
						input.columns,
						phaseBaseline,
						transmissionBaseline,
						columnBaseline,
						gridBaseline,
					)
				: columnBaseline && transmissionBaseline && phaseBaseline
					? evaluateColumnReconstruction(
							input.input,
							input.columns,
							phaseBaseline,
							transmissionBaseline,
							columnBaseline,
						)
					: transmissionBaseline && phaseBaseline
						? evaluateTransmissionReconstruction(
								input.input,
								input.columns,
								phaseBaseline,
								transmissionBaseline,
								crosses,
							)
						: phaseBaseline
							? evaluatePhaseReconstruction(input.input, input.columns, phaseBaseline)
							: evaluateSourceReconstruction(input.input, input.columns);
		if (columnBaseline && result && 'localChecks' in result)
			localChecks = /** @type {Record<string,SkySourceAuditState>[]} */ (result.localChecks);
		write(
			'decomposition.json',
			{
				schemaId: gridBaseline
					? 'sky-source-grid-v1'
					: columnBaseline
						? 'sky-column-reconstruction-v1'
						: transmissionBaseline
							? 'sky-transmission-reconstruction-v1'
							: phaseBaseline
								? 'sky-phase-reconstruction-v1'
								: 'sky-source-reconstruction-v1',
				densityUnits: 'W m^-3 sr^-1 nm^-1',
				projectionUnits: 'W m^-2 sr^-1 nm^-1',
				empiricalAllowance:
					'Conditional on admitted column allowances and the fixed density/phase equations; not a rigorous bound on shared physical-model error.',
				gpuArithmeticParity: false,
				fullViewingIntegral: false,
				...result,
			},
			{
				parents: [
					definition,
					...input.identities,
					...(phaseBaseline?.identities ?? []),
					...(transmissionBaseline?.identities ?? []),
					...crossIdentities,
					...(columnBaseline?.identities ?? []),
					...(gridBaseline?.identities ?? []),
				],
				operation: gridBaseline
					? 'Use only original altitude/solar anchors to reconstruct normalized geometric source columns for independent, S80, S160 and endpoint-derivative predicted-S160 inputs. Retain all local errors, responses, allowances and frozen group tests.'
					: columnBaseline
						? 'Apply the frozen three source-column representations to the retained independently integrated geometric columns, then form optical depth and transmission. Retain per-species allowance propagation and every local/group prediction.'
						: transmissionBaseline
							? 'Exactly replay the earlier phase decomposition and split its transmission remainder R-D=(R-H)+(H-D), using independent exact-solar altitude-anchor columns. Retain all passes, allowances, local signs and frozen predicates.'
							: phaseBaseline
								? 'Exactly replay every baseline row and group, then compute F-D=(F-B)+(B-A)+(A-D) with analytic phase at anchor-local and actual-query directions. Retain local and projected outgoing, solar-phase and transmission contributions, allowances and all frozen predicates.'
								: 'At each sample reconstruct S80, S160 and reference-illuminated raw/split/factored fields in binary64 and Float32. Compute R80-D*=(R80-R*)+(R*-D*) and fixed positive-weight projections; preserve local signs, empirical allowances and all failed/unresolved hypotheses.',
			},
		);
		const lines = [
			'# Source integration and reconstruction attribution',
			'',
			'Scientific comparison at the retained bottom-interval samples. Kider values are not used.',
			'Projection values below are W m^-2 sr^-1 nm^-1 from fixed common sample weights; they are not complete sky-radiance integrals.',
			'',
			'| Ray | Channel | Source effect | Reconstruction remainder | Total S80 error | Total S160 error | Factored remainder |',
			'| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
			...result.groups.map(
				(row) =>
					'| ' +
					row.probeId +
					' | ' +
					row.channel +
					' | ' +
					row.projected.source.value +
					' | ' +
					row.projected.reconstruction.value +
					' | ' +
					row.projected.total80.value +
					' | ' +
					row.projected.total160.value +
					' | ' +
					row.projected.factored.value +
					' |',
			),
			'',
			'| Ray | Channel | Positive reconstruction | Negative source effect | Positive S160 response | Raw error grows | Factored error reduction >=80% |',
			'| --- | ---: | --- | --- | --- | --- | --- |',
			...result.groups.map(
				(row) =>
					'| ' + row.probeId + ' | ' + row.channel + ' | ' + Object.values(row.checks).join(' | ') + ' |',
			),
			'',
			'The JSON retains every sample, local contrary/unresolved sign, storage contrast, allowance and accounting identity. A group gate cannot establish a universal local trend.',
			'The source term is measured after the same nonlinear reconstruction. The reconstruction remainder includes altitude, outgoing and solar representation plus storage; it is not a pure altitude-error estimate.',
			'These are derived-output attribution hypotheses using previously known source columns, not a new withheld-setting forecast. No GPU parity, complete viewing integral, later-order correction or Kider improvement is established.',
			'',
		];
		write(
			'report.md',
			Buffer.from(
				gridBaseline
					? sourceGridReport(result.groups)
					: columnBaseline
						? columnReconstructionReport(result.groups, localChecks)
						: transmissionBaseline
							? transmissionReconstructionReport(result.groups)
							: phaseBaseline
								? phaseReconstructionReport(result.groups)
								: lines.join('\n'),
			),
		);
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup();
	try {
		write(
			'execution.json',
			{
				completed: failure === null,
				physicalIntegrationsExecuted: work.columnCalls,
				work,
				completedCrossCoordinates: crosses.length,
				gpuJobsExecuted: 0,
				cleanup,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				failure: failure?.message ?? null,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: caseId,
		caseId,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		physicalIntegrationsExecuted: work.columnCalls,
		work,
		completedCrossCoordinates: crosses.length,
		sampleCount: result?.rows.length ?? 0,
		groupCount: result?.groups.length ?? 0,
		localPredicates: localChecks,
		passedPredicates:
			result?.groups.flatMap((row) => Object.values(row.checks)).filter((state) => state === 'passed').length ??
			0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Source reconstruction failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.ok(process.argv.length >= 5 && process.argv.length <= 9);
	console.log(
		JSON.stringify(
			await runSourceReconstruction(
				process.argv[2],
				process.argv[3],
				process.argv[4],
				process.argv[5] ?? null,
				process.argv[6] ?? null,
				process.argv[7] ?? null,
				process.argv[8] ?? null,
			),
		),
	);
}
