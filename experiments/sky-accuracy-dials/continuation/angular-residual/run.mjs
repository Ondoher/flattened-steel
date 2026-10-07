import assert from 'node:assert/strict';
import {gzipSync, gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {
	createRun,
	identity,
	readRepository,
	outputRelative,
	sourceIdentities,
	sha256,
	verifyRun,
	checkedAbsolute,
	storage,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {renderClosurePlot} from '../closure/plotting/render.mjs';
import {inputs} from './inputs.mjs';
import {analyze, proof, edges} from './analysis.mjs';
import {plots} from './plots.mjs';
const root = outputRelative + '/runs/';
const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/';
async function main() {
	const checks = proof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({checks}));
		return;
	}
	assert.ok(['preflight', 'execute'].includes(process.argv[2]));
	if (process.argv[2] === 'preflight') {
		const a = inputs();
		console.log(JSON.stringify({checks, compatibility: a.checks, parents: a.parents}));
		return;
	}
	const started = Date.now(),
		registration = readRegistration(root + '00099-c0-registration');
	const admission = admitJob(registration, 'cpu', 'component', 1536 * 1024, 'C6');
	const maximumJobMilliseconds = Math.min(10 * 60000, admission.timeoutMilliseconds);
	const plan = identity(topic + 'angular-residual-plan.md'),
		base = identity(root + '00226-remain-observe/sources.json.gz'),
		sources = sourceIdentities();
	const input = inputs();
	const analysis = {...analyze(input.rows), direct: input.direct, checks: input.checks};
	assert.ok(Date.now() - started < maximumJobMilliseconds - 30000);
	const nodeBytes = readFileSync(checkedAbsolute(process.execPath));
	const parents = [
		registration.seal,
		plan,
		base,
		...input.parents,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Retained-data Sun-angle residual stratification and leave-one-time-out cubic cosine diagnostics at exact time/elevation/wavelength; no new transport integration or production correction.',
		parameters: {
			caseId: 'angular-residual-v1',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C6',
			allocatedBytes: 1536 * 1024,
			maximumJobMilliseconds,
			nearSunDegrees: 20,
			angleEdges: edges,
			channels: Array.from({length: 31}, (_, i) => i),
			basis: [1, 2, 3],
			validation: 'leave-one-time-out; held-time ring means are observed',
			node: {
				path: process.execPath,
				version: process.version,
				byteLength: nodeBytes.length,
				sha256: sha256(nodeBytes),
			},
			gpuJobs: 0,
			newRadianceIntegrations: 0,
		},
	};
	const run = createRun('angular-residual', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path}));
	const write = (name, value) =>
		run.write(name, value, {
			parents: [definition],
			operation:
				'Retain exact plan/source identities or deterministic matched comparison under the frozen recipe.',
		});
	let failure = null;
	try {
		write('plan.md', readRepository(plan.path, plan));
		const old = JSON.parse(gunzipSync(readRepository(base.path, base)).toString());
		for (const s of old) assert.equal(sha256(Buffer.from(s.base64, 'base64')), s.sha256);
		write(
			'sources-delta.json.gz',
			gzipSync(
				Buffer.from(
					JSON.stringify({
						base,
						currentSources: sources,
						changed: sources
							.filter((s) => !old.some((o) => o.path === s.path && o.sha256 === s.sha256))
							.map((s) => ({...s, base64: readRepository(s.path, s).toString('base64')})),
					}),
				),
				{level: 9},
			),
		);
		write('proof.json', {checks, ...analysis.checks});
		write('analysis.json.gz', gzipSync(Buffer.from(JSON.stringify(analysis)), {level: 9}));
		const plotRequests = plots(analysis, identity(run.path + '/analysis.json.gz'));
		write('plot-requests.json', plotRequests);
		for (const request of plotRequests) {
			run.progress('plot', request.name);
			const rendered = await renderClosurePlot(request);
			run.write(request.name, rendered.contents, {
				parents: [definition, ...request.sources, rendered.renderer],
				operation: 'Standard .NET scientific chart from retained angular bin means.',
				parameters: {request, tool: rendered.tool},
			});
		}
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		assert.ok(Date.now() - started < maximumJobMilliseconds);
		run.progress(
			'complete',
			'Angular summaries, held-time contrasts, input identities and manufactured checks verified.',
		);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup(),
		seal = run.finish(failure ? 'failed' : 'accepted', {
			caseId: 'angular-residual-v1',
			jobElapsedMilliseconds: Date.now() - started,
			checks,
			failure: failure?.message ?? null,
			cleanup,
		});
	assert.deepEqual(verifyRun(run.path), seal);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			seal,
			failure: failure?.message,
			retainedBytes: storage().retainedBytes,
			retainedC6: usage.retainedBytesByPhase.C6,
			remainingC6:
				usage.effectivePhaseAllocations.find((a) => a.phase === 'C6').retainedBytes -
				usage.retainedBytesByPhase.C6,
			summaries: analysis.summaries.filter((s) => s.band === 'all').map(({folds, ...s}) => s),
		}),
	);
	if (failure) throw failure;
}
await main();
