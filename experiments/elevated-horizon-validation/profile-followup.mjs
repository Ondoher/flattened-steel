import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRun, identity, checked, command, source} from './io.mjs';

const parent = 'tmp/experiments/elevated-horizon-validation/runs/00026-opac-screen';
assert.equal(JSON.parse(readFileSync(checked(parent + '/manifest.json'), 'utf8')).state, 'accepted');
const run = createRun(
	'opac-followup',
	'Earned continental-clean follow-ups: converge both horizons, molecular controls, 2 km and low-altitude solar/dusk checks.',
	[
		identity(parent + '/manifest.json'),
		identity('tmp/experiments/elevated-horizon-validation/runs/00028-opac-report/analysis.json'),
	],
);
const phases = [
	['fine', 'bruneton,continental_clean'],
	['controls', 'molecular'],
	['mid', 'bruneton,continental_clean,molecular'],
	['glow', 'bruneton,continental_clean,molecular'],
	['pre10', 'bruneton,continental_clean'],
	['sunset', 'bruneton,continental_clean'],
];
const results = [];
run.write('branch.json', {
	evidence:
		'Continental-clean increases 5m contrast at +/-.1 degrees by .09475 with conservative95 half-width .01194; 10km is not improved. The new owner-requested 5m case earns the low-altitude controls.',
	prediction:
		'Its prescribed lower near-ground extinction retains a stronger surface boundary and nonzero near-Sun scattering; high-altitude haze may remain.',
	criteria:
		'Retain physically faithful scenarios; test resolved contrast and raw spectral/neighborhood changes, expose adverse dusk changes. Do not select a production profile.',
	phases,
	estimatedAdditionalMinutes: [10, 20],
	noAdaptiveHumidityOrMeasuredReconstruction: 'Not yet earned; no fitted aerosol amount or hybrid model.',
});
for (const [mode, profiles] of phases) {
	run.progress('phase', mode, {completed: results.length, total: phases.length});
	const result = await command(run, mode, [source + '/profile-reference.mjs', mode, profiles]);
	const last = result.stdout
		.trim()
		.split(/\r?\n/u)
		.filter((line) => line.startsWith('{"run":'))
		.at(-1);
	const found = last ? JSON.parse(last).run : null;
	results.push({
		mode,
		profiles,
		code: result.code,
		run: found,
		seconds: result.seconds,
		error: result.code ? result.stderr.slice(-3000) : null,
	});
	run.write('receipt-' + mode + '.json', results.at(-1));
	console.log(JSON.stringify(results.at(-1)));
}
run.write('results.json', results);
run.finish(results.some((r) => r.code !== 0) ? 'failed' : 'accepted', {results});
