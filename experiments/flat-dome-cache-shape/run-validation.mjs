import assert from 'node:assert/strict';
import {validationCases} from './physical.mjs';
import {createRun, identity} from './io.mjs';
import {acceptedRuns, discovery, readEvidence} from './evidence.mjs';
import {compare, referenceMap, summarize} from './analysis.mjs';

const frozen = acceptedRuns('m3-selection').at(-1);
const probe = acceptedRuns('m3-probe-val').at(-1);
assert.ok(frozen && probe, 'Freeze development choices and complete the independent held-out probe first.');
const inventory = discovery();
const run = createRun(
	'm3-validation',
	[frozen, probe, ...inventory.parents].map((p) => identity(`${p}/manifest.json`)),
);
try {
	const selection = readEvidence(`${frozen}/selection.json`);
	const reference = referenceMap(readEvidence(`${probe}/results.json`).rows);
	const physical = validationCases();
	const results = selection.counts.map((count) => {
		const lookup = new Map(
			[375, 500, 625]
				.flatMap((s) => readEvidence(inventory.builds.get(`n${count}-s${s}`)).results)
				.map((row) => [row.id, row]),
		);
		const rows = physical.map((item) => ({
			...compare(lookup.get(item.id), reference.get(item.id), selection.floorPolicy),
			physical: item,
		}));
		return {count, summary: summarize(rows), physical: rows};
	});
	const balanced = results.find((r) => r.count === selection.provisionalBalancedCount);
	const lowCost = results.find((r) => r.count === selection.provisionalLowerCostCount);
	const selectionChanged = balanced.summary.spectral.p95 > 0.02 || lowCost.summary.spectral.p95 > 0.05;
	run.write('results.json', {
		selection: frozen,
		probe,
		results,
		selectionChanged,
		interpretation:
			'One evaluation of the untouched off-panel matrix. The development choices remain provisional performance/quality compromises, not owner-approved error ceilings.',
	});
	run.finish('accepted', {
		message: selectionChanged
			? 'Held-out matrix evaluated; development choice requires fresh confirmation before changing the recommendation.'
			: 'Held-out matrix evaluated once; provisional balanced and low-cost choices retain their descriptive2% and5% point-estimate tiers.',
		selectionChanged,
	});
	console.log(
		JSON.stringify({
			run: run.root,
			selectionChanged,
			counts: results.map((r) => ({count: r.count, p95: r.summary.spectral.p95, worst: r.summary.worst})),
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
