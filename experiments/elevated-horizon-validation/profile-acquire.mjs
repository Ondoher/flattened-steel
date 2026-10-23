import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync, createWriteStream, readFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createRun, source, identity, root} from './io.mjs';

const run = createRun('profile-acquire', 'Acquire published OPAC data; record download failures and continue.', [
	identity('scripts/libradtran/installation.json'),
	identity('agents/topics/poc-experiments/engineering-studies/elevated-horizon-validation/alternate-profiles-plan.md'),
]);
const sources = [
	{file: 'opac_40b.zip', url: 'https://zenodo.org/records/7275005/files/opac_40b.zip?download=1', citation: '10.5281/zenodo.7275005'},
	{file: 'optprop_v2.1.tar.gz', url: 'https://www.libradtran.org/lib/exe/fetch.php?media=download%3Aoptprop_v2.1.tar.gz', citation: 'Official libRadtran additional optical properties'},
];
const attempts = [];
let failure;
try {
	mkdirSync(run.absolute + '/archives');
	if (process.argv[2] === 'python') {
		const result = await python('profile-download.py');
		run.write('download-transport.log', result.stdout + result.stderr);
		assert.equal(result.code, 0, result.stderr);
		attempts.push(...JSON.parse(readFileSync(run.absolute + '/downloads.json', 'utf8')));
	} else {
	for (const item of sources) {
		const start = Date.now();
		run.progress('download', item.file);
		let attempt;
		try {
			const response = await fetch(item.url, {signal: AbortSignal.timeout(90000)});
			assert.ok(response.ok && response.body, 'HTTP ' + response.status);
			const headers = Object.fromEntries(response.headers.entries());
			await pipeline(Readable.fromWeb(response.body), createWriteStream(run.absolute + '/archives/' + item.file, {flags: 'wx'}));
			attempt = {...item, state: 'downloaded', resolvedUrl: response.url, headers, artifact: identity(run.path + '/archives/' + item.file)};
		} catch (error) {
			attempt = {...item, state: 'failed', error: String(error), decision: 'Logged failure; continue to next source without repeated download attempts.'};
		}
		attempts.push({...attempt, seconds: (Date.now() - start) / 1000});
		run.write('attempt-' + item.file + '.json', attempts.at(-1));
		console.log(JSON.stringify(attempts.at(-1)));
	}
	run.write('downloads.json', attempts);
	}
	const result = await python('profile-archive.py');
	run.write('archive-inspection.log', result.stdout + result.stderr);
	assert.equal(result.code, 0, result.stderr);
} catch (error) { failure = String(error); }
run.finish(failure ? 'failed' : 'accepted', {failure, transport: process.argv[2] ?? 'node', downloads: attempts.map((a) => ({file: a.file, state: a.state}))});
if (failure) throw new Error(failure);

/** Run an owned Python acquisition helper while preserving heartbeat updates. */
async function python(script) {
	return await new Promise((resolve, reject) => {
		const child = spawn('python', [source + '/' + script, run.path], {cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
		let stdout = '', stderr = '';
		child.stdout.on('data', (b) => { stdout += b; });
		child.stderr.on('data', (b) => { stderr += b; });
		child.on('error', reject);
		child.on('close', (code) => resolve({code, stdout, stderr}));
	});
}
