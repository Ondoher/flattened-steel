import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRun, identity} from './io.mjs';
import {acceptedRuns, readEvidence, runsRoot} from './evidence.mjs';
import {verifyScene} from './scene-verification.mjs';
import {referenceMap, compare, darkFloors, summarize} from './analysis.mjs';
import {sceneQueries} from './scene-settings.mjs';

const selectedArgument = process.argv.indexOf('--render-run');
const render =
	selectedArgument >= 0
		? `${runsRoot}/${process.argv[selectedArgument + 1]}`
		: (acceptedRuns('r4-three-final').at(-1) ?? acceptedRuns('r3-three-pilot').at(-1));
const probe = acceptedRuns('r2-scene-probe').at(-1);
assert.ok(render && probe);
const run = createRun(
	'r2-scene-check',
	[render, probe, `${runsRoot}/00043-r1-three-cache`].map((p) => identity(`${p}/manifest.json`)),
);
try {
	const registration = readEvidence(`${render}/registration.json`);
	const telemetry = readEvidence(`${render}/telemetry.json`);
	const checks = verifyScene(telemetry, registration.request);
	const reference = referenceMap(readEvidence(`${probe}/results.json`).rows);
	const cases = sceneQueries(registration.request.origin).filter(
		(item) => item.id.startsWith('outward-') || item.id.startsWith('inward-'),
	);
	const floors = darkFloors(reference, cases);
	const baseline = readEvidence(`${runsRoot}/00043-r1-three-cache/three-query.json`);
	const intrinsic = cases.map((item) => ({
		...compare(
			baseline.find((row) => row.id === item.id),
			reference.get(item.id),
			floors,
		),
		physical: item,
	}));
	const actual = [];
	for (const frame of telemetry.frames) {
		for (const row of frame.diagnostics) {
			const id = `${frame.heading === 1 ? 'outward' : 'inward'}-x${row.x}-y${row.y}`;
			const ref = reference.get(id);
			if (!ref || frame.width !== 1280 || frame.height !== 720) {
				continue;
			}
			// Reference pure orders remain independent. Here only the final scene's
			// cumulative air result is compared; never invent a per-order separation.
			const cached = {id, orders: [row.air, Array(15).fill(0), Array(15).fill(0), Array(15).fill(0)]};
			const compared = compare(cached, ref, floors);
			actual.push({
				id,
				spectralRelative: compared.perOrder[4].relative,
				absolute: compared.perOrder[4].absolute,
				referenceRelativeHalf95: compared.perOrder[4].relativeHalf95,
				geometry: row.bounds,
				groundHit: row.expectedHit,
			});
		}
	}
	const metadata = {
		render,
		probe,
		shader: identity(`${render}/scene.glsl`),
		liveCacheIdentity: telemetry.identity,
		checks,
		intrinsicQuerySummary: summarize(intrinsic),
		intrinsicQueries: intrinsic,
		actualSceneAir: actual,
		interpretation:
			'Port/capture/display invariants are checked independently of intrinsic N12 approximation. Probe is matched to the new physical camera rays; no old2% aggregate accuracy guarantee is imposed. Final-scene cumulative samples are not mislabeled pure-order measurements.',
	};
	run.write('results.json', metadata);
	run.finish('accepted', {
		message:
			'Actual scene input, spectral composition, display and cache reuse pass; intrinsic/new scene-ray errors reported against matched independent probe.',
		sceneSamples: actual.length,
		intrinsicCases: intrinsic.length,
	});
	console.log(
		JSON.stringify({
			run: run.root,
			checks: {
				maxDisplay: checks.maxDisplayCodeDifference,
				maxTransmission: checks.maximumTransmissionAbsoluteError,
				maxComposition: checks.maximumCompositionAbsoluteError,
				maxInterval: checks.maximumIntervalAbsoluteError,
			},
			intrinsic: metadata.intrinsicQuerySummary.spectral,
			actual,
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
