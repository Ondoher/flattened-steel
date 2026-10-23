import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createRun, identity, source, checked, command} from './io.mjs';

const run = createRun(
	'solver-doctor',
	'Authenticate installed libRadtran using contained adapted launcher and worker.',
	[identity('scripts/libradtran/installation.json'), identity(source + '/tool-adaptation.json')],
);
let failure;
try {
	const result = await command(run, 'doctor', [source + '/cli.js', 'doctor'], {HORIZON_TOOL_PARENT: run.absolute});
	assert.equal(result.code, 0, result.stdout + result.stderr);
	const directory = run.path + '/tools/' + readdirSync(checked(run.path + '/tools'))[0];
	const manifest = JSON.parse(readFileSync(checked(directory + '/manifest.json'), 'utf8'));
	assert.equal(manifest.status, 'succeeded');
	run.write('doctor-result.json', {solver: manifest.solver, data: manifest.data, seconds: result.seconds});
} catch (error) {
	failure = String(error);
}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) throw new Error(failure);
