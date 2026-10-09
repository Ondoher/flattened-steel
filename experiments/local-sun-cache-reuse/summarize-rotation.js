import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

/** Require every scalar, including finite and nonnegative checks, to pass.
 * @param {LocalSunRotationResidual} result - Complete measured residual.
 * @returns {boolean} - Whether this comparison passed its frozen limit.
 */
function passed(result) {
	return result.count > 0 && result.failures === 0 && result.nonfinite === 0 && result.negative === 0;
}

/** Derive an honest P2 counterexample disposition from authenticated captured facts.
 * This is rotation parity qualification, not an independent physical reference.
 * @returns {Promise<void>} - New sealed evidence, preserving all parent artifacts.
 */
async function main() {
	const name = process.argv[2];
	const parent = await readParent(name, 'result.json');
	/** @type {LocalSunRotationCapture} */
	const capture = JSON.parse(new TextDecoder().decode(parent.bytes));
	const expectedAngles = [0, 17, 45, 90, 135, 180, 271];
	if (
		capture.schema !== 'local-sun-p2-rotation-v1' ||
		capture.diagnostic ||
		JSON.stringify(capture.angles) !== JSON.stringify(expectedAngles) ||
		capture.results.length !== 7 ||
		capture.images.length !== 7 ||
		capture.glErrors.length
	)
		throw new Error('Incomplete selected-profile capture.');
	const run = await ExperimentRun.create('p2-handoff');
	let failure = null;
	try {
		const recipeParent = await readParent(name, 'recipe.json');
		const recipe = JSON.parse(new TextDecoder().decode(recipeParent.bytes));
		const corrected = recipe.candidate === 'precision';
		const angleParent = await readParent(name, 'angle-0.json');
		const angleZero = JSON.parse(new TextDecoder().decode(angleParent.bytes));
		const spatialCount = corrected ? 19 * angleZero.geometry.radialNodes.length : 285;
		if (
			corrected &&
			(angleZero.geometry.altitudeNodes.length !== 19 ||
				spatialCount <= 285 ||
				!(angleZero.maximumRayRadiance > 0.001))
		)
			throw new Error('Corrective profile or nonzero physical signal is missing.');
		const rows = capture.results.map((row, index) => {
			if (
				row.degrees !== expectedAngles[index] ||
				row.fields.length !== 10 ||
				row.fields.some(
					(field) =>
						field.storage.height !== spatialCount ||
						field.storage.layers !== 15 ||
						field.reuse.count !== field.storage.width * spatialCount * 15,
				)
			)
				throw new Error('Missing complete selected fields.');
			const spatial = [row.spatial, ...row.orderSpatial];
			return {
				degrees: row.degrees,
				fieldReuse: row.fields.every((field) => passed(field.reuse)),
				fieldMaximumLimitRatio: Math.max(...row.fields.map((field) => field.reuse.maximumRatio)),
				directFrameReconstruction: spatial.every((value) => passed(value.directFrame)),
				strictRotationAwayFromAxis: spatial.every((value) => passed(value.inverseTransformAwayFromAxis)),
				strictRotationAtAxis: spatial.every((value) => passed(value.inverseTransformAtAxis)),
				axisMaximumLimitRatio: Math.max(...spatial.map((value) => value.inverseTransformAtAxis.maximumRatio)),
				cpuRayReuse: passed(row.rayReuse),
				gpuRayReuse: passed(row.gpuReuse),
				cpuGpuRadiance: passed(row.cpuGpu),
				cpuGpuTransmission: passed(row.transmission),
				strictEquivalentCpuRays: passed(row.equivalentCpuResidual),
				strictEquivalentGpuRays: passed(row.equivalentGpuResidual),
				worldFixedCoveredRays: row.coverage.admitted.length,
				worldFixedExcludedRays: row.coverage.excluded.length,
				equivalentCoveredRays: row.equivalentCoverage.admitted.length,
				equivalentExcludedRays: row.equivalentCoverage.excluded.length,
				endpointMaximumMeters: row.endpointMaximumMeters,
				endpointFailures: row.endpointFailures,
				axisApproach: row.axisApproach,
				buildAndReadbackMilliseconds: row.buildMilliseconds,
			};
		});
		const fullRotationAdmission = rows.every(
			(row) =>
				row.fieldReuse &&
				row.directFrameReconstruction &&
				row.strictRotationAwayFromAxis &&
				row.strictRotationAtAxis &&
				row.cpuRayReuse &&
				row.gpuRayReuse &&
				row.cpuGpuRadiance &&
				row.cpuGpuTransmission &&
				row.strictEquivalentCpuRays &&
				row.strictEquivalentGpuRays &&
				row.worldFixedExcludedRays === 0 &&
				row.equivalentExcludedRays === 0 &&
				row.endpointFailures === 0,
		);
		const source = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/summarize-rotation.js');
		await checkPath(repositoryRoot, source);
		const sourceSha256 = hash(await readFile(source));
		const originalParent = await readParent('00027-p2-selected', 'angle-0.json');
		const original = JSON.parse(new TextDecoder().decode(originalParent.bytes));
		const currentPolicyComparison = original.rays.cpuFresh.map((ray, index) => ({
			index,
			originallyCovered: original.coverage.admitted.includes(index),
			maximumAbsoluteRadianceChange: Math.max(
				...ray.radiance.map((value, c) => Math.abs(angleZero.rays.cpuFresh[index].radiance[c] - value)),
			),
			originalEndpointMeters: ray.segment.endDistance.value,
			candidateEndpointMeters: angleZero.rays.cpuFresh[index].segment.endDistance.value,
		}));
		const result = {
			schema: 'local-sun-p2-disposition-v1',
			parent: {...parent, bytes: undefined},
			additionalParents: [recipeParent, angleParent, originalParent].map((value) => ({
				...value,
				bytes: undefined,
			})),
			candidate: recipe.candidate ?? 'original-control',
			spatialCount,
			currentPolicyComparison,
			geometry: angleZero.geometry,
			measuredRegion: corrected
				? {
						angles: expectedAngles,
						source: recipe.state.geometry.sourcePosition,
						observer: recipe.state.geometry.observerPosition,
						viewDirections: 96,
						minimumViewingPathRadialDistanceMeters:
							recipe.state.geometry.cacheRadialMaximum.value -
							recipe.state.geometry.observerCenteredDome.maxObserverViewRayExtent.value,
						rule: 'Measured fixed-offset rotation parity only; no continuous-angle, translated placement or independent physical-accuracy admission.',
					}
				: null,
			derivation: {
				operation:
					'Every frozen scalar comparison must pass including finite/nonnegative gates; strict transforms, full ray coverage and centimetre endpoints remain required.',
				implementation: 'experiments/local-sun-cache-reuse/summarize-rotation.js',
				sourceSha256,
				parameters: {reuseRelative: 0.0001, cpuGpuRelative: 0.002, endpointMeters: 0.01},
			},
			rows,
			images: capture.images,
			fullRotationAdmission,
			p2Exit: fullRotationAdmission
				? 'rotation parity measured; independent physical/resource qualification still required'
				: 'identified selected-profile counterexamples; unrestricted reuse rejected',
			p3Eligibility: fullRotationAdmission
				? 'Separate owner selection and remaining qualification required'
				: 'No qualified complete-ray region declared. Do not begin P3 translation from these results.',
			limitations: [
				'Axis approach is measured separately: a covariant frame does not establish azimuth-independent physical continuity of the existing finite angular reconstruction.',
				'Two-part endpoint readback proves the compensated boundary calculation; transport sample positions and ordinary shader PathBounds remain FP32. No public precision contract is promoted.',
				'CPU reconstruction reads measured GPU fields and is not an independent higher-order physical oracle.',
				'Field hashes and complete residual counts retained; no duplicated full field arrays.',
				'Clip uses canonical cache and fixed adaptation; paired stills check fresh/reused output. No per-frame temporal qualification.',
				'No general resource, in-app replacement, physical accuracy or film qualification is claimed.',
			],
		};
		await run.write('result.json', JSON.stringify(result, null, '\t'));
		const summary = `# P2 result\n\n${result.p2Exit}.\n\nAll seven selected N4/W27/F68/Native15 placements were measured, with ${spatialCount} spatial nodes and ten complete fields. See [result](result.json) for individual pass/fail facts, original-policy comparison and parent hashes.\n\n[17-degree labeled image](../${name}/angle-17-comparison.png), [fresh/reused blink](../${name}/blink-17.mp4), [rotation clip](../${name}/rotation.mp4). These are diagnostic visual evidence, not unrestricted reuse qualification.\n\n${result.p3Eligibility}\n\nThe owning [P2 correction document](../../../../../agents/topics/poc-experiments/engineering-studies/local-sun-cache-reuse/p2-corrections.md) retains decisions, review authority, verification and remaining work.\n`;
		await run.write('summary.md', summary);
	} catch (error) {
		failure = String(error.stack ?? error);
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}

await main();
