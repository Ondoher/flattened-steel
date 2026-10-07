import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRun, identity, readRepository, sourceIdentities, verifyRun} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {aerosolAuthorization} from './authorization.mjs';

const start = Date.now(),
	registration = readRegistration('tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration');
const admission = admitJob(registration, 'cpu', 'component', 262144, 'C6'),
	auth = aerosolAuthorization();
const sources = sourceIdentities();
const parents = [
	registration.seal,
	auth.plan,
	auth.through,
	...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
];
const run = createRun('aerosol-data', {
	parents,
	operation: 'Retain public NASA AERONET responses for one frozen regional aerosol sensitivity; no sky evaluation.',
	parameters: {
		continuationRegistration: registration.run,
		jobKind: 'cpu',
		scope: 'component',
		phase: 'C6',
		allocatedBytes: 262144,
		site: 'Toronto',
		date: '2013-05-27',
		selectedUtc: '13:19:01',
	},
});
let failure = null;
try {
	const base =
		'https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_inv_v3?site=Toronto&year=2013&month=5&day=27&year2=2013&month2=5&day2=27&AVG=10&if_no_html=1';
	const urls = Object.fromEntries(
		[
			['ssa', 'SSA', 'ALM15'],
			['phase', 'PFN', 'ALM15'],
			['asymmetry', 'ASY', 'ALM15'],
			['quality', 'SSA', 'ALM20'],
		].map(([name, product, level]) => [name, base + '&product=' + product + '&' + level + '=1']),
	);
	const script =
		'import urllib.request,json,sys\nu=json.loads(sys.argv[1])\nout={}\nfor k,v in u.items():\n with urllib.request.urlopen(v,timeout=25) as r:\n  b=r.read(131073)\n  assert len(b)<=131072\n  out[k]=b.decode("utf-8")\nprint(json.dumps(out))';
	run.progress('download', 'Fetching four fixed public records');
	const raw = JSON.parse(
		execFileSync('python', ['-c', script, JSON.stringify(urls)], {
			encoding: 'utf8',
			timeout: 115000,
			maxBuffer: 524288,
			windowsHide: true,
		}),
	);
	const derivation = {
		parents: [identity(run.path + '/definition.json')],
		operation: 'Exact UTF-8 response text from the recorded NASA URLs; no numeric modification.',
	};
	for (const [name, value] of Object.entries(raw)) {
		assert.equal(typeof value, 'string');
		run.write(name + '.txt', String(value), derivation);
	}
	run.write(
		'provenance.json',
		{
			urls,
			retrievedAt: new Date().toISOString(),
			runtime: process.version,
			python: execFileSync('python', ['--version'], {encoding: 'utf8', windowsHide: true}).trim(),
			sources,
		},
		derivation,
	);
	run.write('plan.md', readRepository(auth.plan.path, auth.plan), derivation);
	run.write(
		'data-source.mjs',
		readRepository('experiments/sky-accuracy-dials/continuation/aerosol-sensitivity/data.mjs'),
		derivation,
	);
} catch (e) {
	failure = e instanceof Error ? e : new Error(String(e));
}
const cleanup = run.cleanup();
const seal = run.finish(failure ? 'failed' : 'accepted', {
	jobElapsedMilliseconds: Date.now() - start,
	failure: failure?.message ?? null,
	cleanup,
});
assert.deepEqual(verifyRun(run.path), seal);
console.log(
	JSON.stringify({
		run: run.path,
		seal,
		usage: campaignUsage(registration).retainedBytesByPhase,
		failure: failure?.message,
	}),
);
if (failure) throw failure;
