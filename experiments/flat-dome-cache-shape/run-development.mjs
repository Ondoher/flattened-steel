import {readFileSync} from 'node:fs';
import path from 'node:path';
import {cases, controlCases} from './physical.mjs';
import {createRun, checked, identity, repository} from './io.mjs';
import {compare, darkFloors, referenceMap, summarize} from './analysis.mjs';

const root = 'tmp/experiments/flat-dome-cache-shape/runs';
const cache = `${root}/00014-m3-cache-sweep`;
const probe = `${root}/00017-m3-probe-dev`;
const read = (filename) => JSON.parse(readFileSync(checked(path.join(repository, filename)), 'utf8'));
const run = createRun('m3-dev-analysis', [identity(`${cache}/manifest.json`), identity(`${probe}/manifest.json`)]);
try {
	const reference = referenceMap(read(`${probe}/results.json`).rows);
	const selected = cases();
	const floors = darkFloors(reference, selected);
	const results = [];
	for (const count of [2, 4, 8, 16, 32, 64]) {
		const physical = [];
		const controls = [];
		const builds = [];
		for (const source of [375, 500, 625]) {
			const candidate = read(`${cache}/candidate-n${count}-s${source}-r0.json`);
			builds.push(candidate.metadata);
			const lookup = new Map(candidate.results.map((row) => [row.id, row]));
			for (const item of [...selected, ...controlCases()].filter((item) => Math.round(item.sourceRadius / 20015114.442035925 * 1000) === source)) {
				const row = {...compare(lookup.get(item.id), reference.get(item.id), floors), physical: item};
				(item.id.startsWith('control-') ? controls : physical).push(row);
			}
		}
		const strata = [];
		for (const key of ['altitude', 'fraction', 'view', 'sourceRadius']) {
			for (const value of [...new Set(physical.map((row) => row.physical[key]))]) {
				strata.push({key, value, ...summarize(physical.filter((row) => row.physical[key] === value))});
			}
		}
		results.push({count, summary: summarize(physical), builds, strata, physical, controls});
	}
	run.write('results.json', {floors, policy: 'Development only. Held-out candidate values are not accessed. Equal physical-case weighting; vacuum/dark results retained separately from tier denominators. Native guide is not a J4 tier authority.', results});
	run.write('summary.csv', 'count,p95_percent,median_percent,max_percent,probe_p95_half95_percent,max_resident_mib,max_build_seconds,worst\n' + results.map((r) => [r.count, r.summary.spectral.p95 * 100, r.summary.spectral.median * 100, r.summary.spectral.maximum * 100, r.summary.uncertainty.p95 * 100, Math.max(...r.builds.map((m) => m.retainedCacheTextureBytes)) / 1048576, Math.max(...r.builds.map((m) => m.buildMilliseconds)) / 1000, r.summary.worst.id].join(',')).join('\n') + '\n');
	run.finish('accepted', {message: 'Development-only count errors calculated with independent-reference dark floors and retained per-order uncertainty; no held-out accuracy inspected.'});
	console.log(readFileSync(path.join(run.root, 'summary.csv'), 'utf8'));
	console.log(run.root);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
