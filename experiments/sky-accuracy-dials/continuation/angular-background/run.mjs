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
import {readAngularBackground} from './read.mjs';
import {evaluateAngularBackground, angularBackgroundProof, angularBackgroundReport} from './index.mjs';
import {
	readAngularRegionsBaseline,
	evaluateAngularRegions,
	angularRegionsProof,
	angularRegionsReport,
} from './regions.mjs';

/** @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Reuse immutable incident nodes for one bounded mathematical decomposition.
 * @param {string} registrationRun @param {string|null} [baselineRun] @returns {Promise<{run:string,seal:DialFileIdentity}>}
 */
export async function runAngularBackground(registrationRun, baselineRun = null) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		allocatedBytes = 4 * 1024 ** 2;
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const input = readAngularBackground(registration);
	const regionBaseline = baselineRun === null ? null : readAngularRegionsBaseline(registration, baselineRun);
	const caseId = regionBaseline ? 'angular-regions' : 'angular-background';
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
				...(regionBaseline?.identities ?? []),
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((r) => r.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	const maximumJobMilliseconds = Math.min(300000, admission.timeoutMilliseconds);
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation: regionBaseline
			? 'Replay the preceding angular-background decomposition and partition directional responses with fixed smooth Sun, horizon and other weights, preserving each mirrored phase weight. No new integration or angular oracle.'
			: 'Authenticate retained angular factorial incident nodes and exact historical sums, then split their radial, azimuth, joint and interaction responses into fixed-background phase-mass changes and directional-field changes. No new angular oracle, source integration, GPU work or Kider input.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: caseId,
			caseId,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			baselineRun,
			node: registration.record.host.node,
			sourceIdentities: sources,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			target: 'p-0930-5-7:h1000',
			channels: [0, 8],
			rules: input.cells.map((c) => c.id),
			referenceMeanAdmitted: false,
			absoluteAngularError: false,
			gpuArithmeticParity: false,
		},
	};
	const run = createRun(regionBaseline ? 'angular-regions' : 'angular-bg', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	/** @type {Error|null} */ let failure = null;
	/** @type {ReturnType<typeof evaluateAngularBackground>|null} */ let result = null;
	/** @type {ReturnType<typeof evaluateAngularRegions>|null} */ let regionResult = null;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [terminal] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation:
				'Derive ' + name + ' from authenticated retained angular nodes and the fixed-background decomposition.',
		},
		terminal = false,
	) {
		assert.ok(Date.now() - started < maximumJobMilliseconds - (terminal ? 0 : 30000));
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - 768 * 1024);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress(
			caseId,
			'Retained incident nodes and historical sums authenticated; decomposing unchanged angular responses.',
		);
		write(caseId + '-plan.md', planBytes, {
			parents: [plan],
			operation: 'Retain exact prospective hypotheses, comparison scope and stopping conditions.',
		});
		const snapshot = Buffer.from(
			JSON.stringify(sources.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
		);
		write('sources.json.gz', gzipSync(snapshot, {level: 9}), {
			parents: sources,
			operation: 'Encode exact implementation bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: snapshot.length,
				uncompressedSha256: sha256(snapshot),
			},
		});
		write(
			'inputs.json',
			{
				spec: input.spec,
				cells: input.cells.map((c) => ({
					id: c.id,
					target: c.target,
					representativeCount: c.nodes.length,
					rows: c.rows,
				})),
				identities: input.identities,
			},
			{
				parents: [...input.identities],
				operation:
					'Retain physical inputs, selected rule identities and exactly replayed historical sums; compressed incident parents retain all original node values.',
			},
		);
		write('proof.json', angularBackgroundProof());
		if (regionBaseline) {
			write('regions-proof.json', angularRegionsProof());
			regionResult = evaluateAngularRegions(input, regionBaseline);
		} else result = evaluateAngularBackground(input);
		write(
			'decomposition.json',
			{
				schemaId: regionBaseline ? 'sky-angular-regions-v1' : 'sky-angular-background-v1',
				densityUnits: 'W m^-3 sr^-1 nm^-1',
				incidentUnits: 'W m^-2 sr^-1 nm^-1',
				mean: 'Retained r16-a32 solid-angle mean; fixed diagnostic constant, not an admitted continuous angular reference.',
				allowance:
					'Incident numerical and arithmetic allowances only; no unmeasured angular remainder is included.',
				...(regionResult ?? result),
			},
			{
				parents: [definition, ...input.identities, ...(regionBaseline?.identities ?? [])],
				operation: regionBaseline
					? 'Replay all prior components/responses; apply fixed nonnegative partition weights separately to both mirror phase terms; retain three regional directional contributions and all fourteen frozen sign/dominance predicates.'
					: 'Use retained Gauss/Simpson incident means and allowances; compute per-species phase masses and fixed mean backgrounds, independently sum directional residuals, and split each factorial response. Retain all six frozen dominance predicates.',
			},
		);
		if (regionResult) write('report.md', Buffer.from(angularRegionsReport(regionResult)));
		else {
			assert.ok(result);
			write('report.md', Buffer.from(angularBackgroundReport(result)));
		}
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
				physicalIntegrationsExecuted: 0,
				gpuJobsExecuted: 0,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				cleanup,
				failure: failure?.message ?? null,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const predicates =
		regionResult?.predicates ?? result?.responses.map((r) => r.backgroundSmall).filter((s) => s !== null) ?? [];
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: caseId,
		caseId,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		physicalIntegrationsExecuted: 0,
		gpuJobsExecuted: 0,
		predicateCount: predicates.length,
		passedPredicates: predicates.filter((s) => s === 'passed').length,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyMechanismTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, a) => sum + a.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Angular background failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.ok(process.argv.length === 3 || process.argv.length === 4);
	console.log(JSON.stringify(await runAngularBackground(process.argv[2], process.argv[3] ?? null)));
}
