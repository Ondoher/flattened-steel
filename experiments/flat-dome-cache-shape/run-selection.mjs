import assert from 'node:assert/strict';
import {cases} from './physical.mjs';
import {topology} from './topology.mjs';
import {diskRadius} from './geometry.mjs';
import {createRun, identity} from './io.mjs';
import {acceptedRuns, readEvidence, runsRoot} from './evidence.mjs';
import {compare, referenceMap, summarize} from './analysis.mjs';

const development = acceptedRuns('m3-dev-analysis').at(-1);
const diagnosticRuns = ['path', 'angle', 'beta'].map((kind) => acceptedRuns(`m3-refine-${kind}`).at(-1));
assert.ok(
	development && diagnosticRuns.every(Boolean),
	'Complete planned development/diagnostic evidence before freezing selection.',
);
const parents = [development, ...diagnosticRuns, `${runsRoot}/00017-m3-probe-dev`];
const run = createRun(
	'm3-selection',
	parents.map((p) => identity(`${p}/manifest.json`)),
);
try {
	const dev = readEvidence(`${development}/results.json`);
	const reference = referenceMap(readEvidence(`${runsRoot}/00017-m3-probe-dev/results.json`).rows);
	const selected = cases().filter((item) => item.id.startsWith('s0.5-'));
	const baseline = dev.results.find((r) => r.count === 32);
	const diagnostics = diagnosticRuns.map((root) => {
		const candidate = readEvidence(`${root}/candidate-n32-s500-r0.json`);
		const lookup = new Map(candidate.results.map((row) => [row.id, row]));
		return {
			root,
			registration: readEvidence(`${root}/registration.json`).refine,
			summary: summarize(
				selected.map((item) => compare(lookup.get(item.id), reference.get(item.id), dev.floors)),
			),
			metadata: candidate.metadata,
		};
	});
	const tiers = [0.005, 0.01, 0.02, 0.05].map((tier) => ({
		tier,
		smallestPointEstimateCount: dev.results.find((r) => r.summary.spectral.p95 <= tier)?.count ?? null,
		conservativeSupportedCount:
			dev.results.find((r) => {
				const values = r.physical
					.filter((row) => !row.perOrder[4].dark)
					.map(
						(row) =>
							row.perOrder[4].relative +
							row.perOrder[4].conservativeBandHalf95 / row.perOrder[4].referenceIntegrated,
					)
					.sort((a, b) => a - b);
				return values[Math.ceil(values.length * 0.95) - 1] <= tier;
			})?.count ?? null,
	}));
	const selection = {
		development,
		counts: dev.results.map((r) => r.count),
		tiers,
		provisionalBalancedCount: 12,
		provisionalLowerCostCount: 6,
		selectionReason:
			'N12 is the first studied knee around2% with substantially lower worst error than N6/N8; N6 is the low-cost comparison. Higher counts remain measured tradeoffs, not a proven universal optimum. Held-out results have not been used for either choice.',
		diagnostics,
		baselineMiddleSun: baseline.strata.find(
			(s) => s.key === 'sourceRadius' && Math.abs(s.value - diskRadius * 0.5) < 1,
		),
		floorPolicy: dev.floors,
		packingCapacity: [64, 65, 66, 80, 96].map((count) => ({
			count,
			maximumRequiredHeight: Math.max(
				...[0.375, 0.5, 0.625].map((s) => topology(count, diskRadius * s).nodes.length),
			),
			measuredMaximumTextureSize: 16384,
		})),
		heldOutPolicy:
			'Freeze these counts/choices before one evaluation of144 off-panel rays. If validation changes selection, record the change and run a fresh confirmation subset; do not call reused validation untouched.',
	};
	run.write('selection.json', selection);
	run.finish('accepted', {
		message:
			'Development-only choices, tiers, non-slice diagnostics, and actual packing limit frozen before held-out accuracy evaluation.',
		counts: selection.counts,
		provisionalBalancedCount: selection.provisionalBalancedCount,
	});
	console.log(
		JSON.stringify({
			run: run.root,
			tiers,
			diagnostics: diagnostics.map((r) => ({
				kind: r.registration,
				p95: r.summary.spectral.p95,
				worst: r.summary.worst,
			})),
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
