import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {residual, rotate} from './rotation-model.js';

/** Require all retained scalar observations to pass their exact frozen gate.
 * @param {LocalSunRotationResidual} value - Complete numerical comparison.
 * @param {number} [count] - Required scalar count where fixed.
 * @returns {boolean} - Ordinary consistency only.
 */
function passed(value, count) {
	return (
		value.count > 0 &&
		(count === undefined || value.count === count) &&
		value.failures === 0 &&
		value.nonfinite === 0 &&
		value.negative === 0 &&
		Number.isFinite(value.maximumRatio) &&
		value.maximumRatio <= 1
	);
}

/** Authenticate and qualify the frozen current movement matrix without changing parents.
 * @returns {Promise<void>} - New sealed consistency disposition; no performance or physical error bound.
 */
async function main() {
	const run = await ExperimentRun.create('p3-move-report');
	try {
		const parents = [];
		/** @param {string} name - Sealed parent. @param {string} artifact - Listed artifact.
		 * @returns {Promise<LocalSunParentArtifact>} - Authenticated exact input.
		 */
		const parent = async (name, artifact) => {
			const p = await readParent(name, artifact);
			parents.push(p);
			return p;
		};
		const contract = await parent('00478-p3-contract', 'contract.json'),
			gates = await parent('00478-p3-contract', 'gates.json'),
			layout = await parent('00478-p3-contract', 'layout.json'),
			controlsParent = await parent('00018-controls', 'controls.json');
		if (
			contract.artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
			gates.artifactSha256 !== 'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d' ||
			layout.artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864'
		)
			throw Error('Frozen P3 identity changed');
		const controls = JSON.parse(new TextDecoder().decode(controlsParent.bytes));
		const poses = [
			...[0, 17, 45, 90, 135, 180, 271].map((key) => ({key, degrees: key, offset: [0, 0], state: 'flat-0'})),
			...[
				[250, 0],
				[0, -1000],
				[10000, 10000],
			].map((offset, i) => ({key: 1000 + i, degrees: 0, offset, state: 'flat-0'})),
			...[45, 90, 135, 180].map((angle, i) => {
				const state = controls.states.find((s) => s.id === 'flat-' + angle),
					base = controls.states.find((s) => s.id === 'flat-0');
				return {
					key: 2001 + i,
					degrees: 0,
					offset: [
						state.geometry.sourcePosition.coordinates[0] - base.geometry.sourcePosition.coordinates[0],
						state.geometry.sourcePosition.coordinates[1] - base.geometry.sourcePosition.coordinates[1],
					],
					state: state.id,
				};
			}),
		];
		const ids = [
			'local-sun-j1',
			'local-sun-j2',
			'local-sun-j3',
			'local-sun-j4',
			'local-sun-l1',
			'local-sun-l2',
			'local-sun-l3',
			'local-sun-j-through-2',
			'local-sun-j-through-3',
			'local-sun-j-through-4',
		].sort();
		const rows = [],
			resources = [];
		let canonicalFields = null,
			closure = null,
			bundleIdentity = null;
		const seen = new Set();
		if (process.argv.length !== 8) throw Error('Five final capture@resource pairs and frame-policy proof required');
		for (const pair of process.argv.slice(2, -1)) {
			const [name, resourceName, ...extra] = pair.split('@');
			if (!name || !resourceName || extra.length) throw Error('Invalid capture pair');
			/** @type {LocalSunRotationCapture} */ const capture = JSON.parse(
				new TextDecoder().decode((await parent(name, 'result.json')).bytes),
			);
			/** @type {LocalSunRotationRecipe} */ const recipe = JSON.parse(
				new TextDecoder().decode((await parent(name, 'recipe.json')).bytes),
			);
			const inputs = JSON.parse(new TextDecoder().decode((await parent(name, 'inputs.json')).bytes)),
				bundle = await parent(name, 'bundle.js');
			const source = JSON.stringify(
				inputs.inputs
					.filter((v) => v.path !== 'experiments/local-sun-cache-reuse/run-rotation.js')
					.sort((a, b) => a.path.localeCompare(b.path)),
			);
			if (closure && closure !== source) throw Error('Capture source closures differ');
			closure = source;
			if (bundleIdentity && bundleIdentity !== bundle.artifactSha256) throw Error('Capture bundles differ');
			bundleIdentity = bundle.artifactSha256;
			if ((await parent(name, 'contract.json')).artifactSha256 !== contract.artifactSha256)
				throw Error('Capture contract differs');
			if (
				inputs.bundleSha256 !== hash(bundle.bytes) ||
				!recipe.currentMovement ||
				recipe.motion ||
				recipe.diagnostic ||
				recipe.shellApplication ||
				capture.glErrors.length ||
				hash(new TextEncoder().encode(JSON.stringify(recipe.shellLayout))) !==
					hash(new TextEncoder().encode(JSON.stringify(JSON.parse(new TextDecoder().decode(layout.bytes)))))
			)
				throw Error('Invalid current movement recipe');
			if (JSON.stringify(recipe.state) !== JSON.stringify(controls.states.find((s) => s.id === 'flat-0')))
				throw Error('Canonical fixture differs');
			if (
				recipe.currentOrbitalStates &&
				JSON.stringify(recipe.currentOrbitalStates) !== JSON.stringify(controls.states)
			)
				throw Error('Orbital fixtures differ');
			if (
				capture.results.length !== recipe.shellPoses?.length ||
				capture.images.length !== capture.results.length
			)
				throw Error('Missing pose or image');
			const resource = JSON.parse(new TextDecoder().decode((await parent(resourceName, 'result.json')).bytes)),
				limits = JSON.parse(new TextDecoder().decode((await parent(resourceName, 'inputs.json')).bytes)),
				tail = await parent(resourceName, 'stdout-tail.txt');
			if (
				!resource.resourceQualified ||
				resource.failure ||
				resource.exitCode !== 0 ||
				limits.temporaryException ||
				limits.limits.reserveBytes !== 8589934592 ||
				limits.limits.maximumBytes > 8589934592 ||
				limits.limits.maximumMilliseconds > 600000 ||
				resource.minimumFreeBytes < 8589934592 ||
				resource.peakPrivateBytes > 8589934592 ||
				resource.peakWorkingSetBytes > 8589934592 ||
				!new TextDecoder().decode(tail.bytes).includes(name)
			)
				throw Error('Resource guard did not qualify');
			resources.push({capture: name, resource: resourceName, ...resource});
			/** @type {LocalSunCurrentMovementEntry | null} */ let canonicalEntry = null;
			for (let index = 0; index < capture.results.length; index++) {
				const pose = recipe.shellPoses[index],
					expected = poses.find((p) => p.key === pose.key);
				if (
					!expected ||
					pose.degrees !== expected.degrees ||
					JSON.stringify(pose.offset) !== JSON.stringify(expected.offset)
				)
					throw Error('Unexpected frozen pose');
				/** @type {LocalSunCurrentMovementEntry} */ const entry = JSON.parse(
					new TextDecoder().decode((await parent(name, 'angle-' + pose.key + '.json')).bytes),
				);
				if (
					entry.artifactKey !== pose.key ||
					entry.stateId !== expected.state ||
					JSON.stringify(entry.exactTime) !==
						JSON.stringify(controls.states.find((s) => s.id === expected.state).observation) ||
					JSON.stringify(entry.fields) !== JSON.stringify(capture.results[index].fields)
				)
					throw Error('Pose identity differs');
				if (JSON.stringify(entry.fields.map((f) => f.id).sort()) !== JSON.stringify(ids))
					throw Error('Missing fields');
				if (index === 0 && pose.key !== 0) throw Error('Canonical pose must lead each group');
				canonicalEntry ??= entry;
				if (!canonicalFields) canonicalFields = entry.fields;
				const fieldIdentity = entry.fields.every((f) => {
					const base = canonicalFields.find((b) => b.id === f.id),
						v = f.identityProof;
					return (
						!!v &&
						v.nonfinite === 0 &&
						v.negativeBeyondAbsolute === 0 &&
						f.sha256 === v.sha256 &&
						f.sha256 === base.sha256 &&
						f.storage.format === 'R32F' &&
						f.storage.height === 1049 &&
						f.storage.layers === 15 &&
						f.storage.width === (f.id.startsWith('local-sun-l') ? 1920 : 4374) &&
						JSON.stringify(f.storage) === JSON.stringify(base.storage)
					);
				});
				const flatten = (/** @type {LocalSunRotationGpuRayResult[] | LocalSunRotationRayResult[]} */ values) =>
					values.flatMap((v) => v.radiance);
				const r = entry.rays,
					state = controls.states.find((s) => s.id === expected.state),
					rotatedSource = rotate(state.geometry.sourcePosition.coordinates, pose.degrees),
					sourcePosition = [rotatedSource[0], rotatedSource[1], rotatedSource[2]];
				if (pose.key < 2000) {
					sourcePosition[0] += pose.offset[0];
					sourcePosition[1] += pose.offset[1];
				}
				const fullSupport = [r.cpuFresh, r.cpuReused, r.equivalentCpu].every((values) =>
					values.every(
						(ray) =>
							ray.samples.length > 1 &&
							ray.samples.every(
								({coordinates: p, units}) =>
									units === 'meters' &&
									p.length === 3 &&
									p.every(Number.isFinite) &&
									Math.hypot(p[0] - sourcePosition[0], p[1] - sourcePosition[1]) <= 33378000 + 1e-6 &&
									p[2] >= -1e-6 &&
									p[2] <= 100000 + 1e-6,
							),
					),
				);
				const viewCounts = [
					r.cpuFresh,
					r.cpuReused,
					r.gpuFresh,
					r.gpuReused,
					r.equivalentCpu,
					r.equivalentGpu,
				].every(
					(v) => v.length === 96 && v.every((p) => p.radiance.length === 15 && p.transmittance.length === 15),
				);
				const checks = {
					fieldIdentity,
					viewCounts,
					spatial:
						entry.spatial.queries === 164354 &&
						entry.spatial.directions === 37 &&
						entry.spatial.spatialPoints === 4442 &&
						passed(entry.spatial.directFrame, entry.spatial.queries * 15) &&
						passed(entry.spatial.inverseTransformAwayFromAxis) &&
						passed(entry.spatial.inverseTransformAtAxis) &&
						entry.spatial.inverseTransformAwayFromAxis.count +
							entry.spatial.inverseTransformAtAxis.count ===
							entry.spatial.queries * 15,
					axis: passed(entry.axisApproach, 2100),
					cpuReuse: passed(residual(flatten(r.cpuReused), flatten(r.cpuFresh), 1e-9, 1e-4), 1440),
					gpuReuse: passed(residual(flatten(r.gpuReused), flatten(r.gpuFresh), 1e-9, 1e-4), 1440),
					cpuGpu: passed(residual(flatten(r.gpuFresh), flatten(r.cpuFresh), 1e-9, 0.002), 1440),
					transmission: passed(
						residual(
							r.gpuFresh.flatMap((p) => p.transmittance),
							r.cpuFresh.flatMap((p) => p.transmittance),
							1e-7,
							0.002,
						),
						1440,
					),
					transmissionReuse: [
						{actual: r.cpuReused, expected: r.cpuFresh},
						{actual: r.gpuReused, expected: r.gpuFresh},
						{actual: r.equivalentCpu, expected: canonicalEntry.rays.cpuFresh},
						{actual: r.equivalentGpu, expected: canonicalEntry.rays.gpuFresh},
					].every(({actual, expected}) =>
						passed(
							residual(
								actual.flatMap((p) => p.transmittance),
								expected.flatMap((p) => p.transmittance),
								1e-7,
								1e-4,
							),
							1440,
						),
					),
					equivalent:
						passed(
							residual(flatten(r.equivalentCpu), flatten(canonicalEntry.rays.cpuFresh), 1e-9, 1e-4),
							1440,
						) &&
						passed(
							residual(flatten(r.equivalentGpu), flatten(canonicalEntry.rays.gpuFresh), 1e-9, 1e-4),
							1440,
						),
					receiver:
						entry.receiverRays.fresh.length === 32 &&
						entry.receiverRays.reused.length === 32 &&
						passed(
							residual(flatten(entry.receiverRays.reused), flatten(entry.receiverRays.fresh), 1e-9, 1e-4),
							480,
						),
					coverage:
						fullSupport &&
						entry.coverage.admitted.length === 96 &&
						entry.equivalentCoverage.admitted.length === 96 &&
						entry.coverage.excluded.length === 0 &&
						entry.equivalentCoverage.excluded.length === 0,
					endpoints:
						[
							{gpu: r.gpuFresh, cpu: r.cpuFresh},
							{gpu: r.gpuReused, cpu: r.cpuReused},
							{gpu: r.equivalentGpu, cpu: r.equivalentCpu},
						].every(({gpu, cpu}) =>
							gpu.every(
								(p, i) =>
									Number.isFinite(p.end) &&
									Number.isFinite(p.start) &&
									Math.abs(p.end - cpu[i].segment.endDistance.value) <= 0.01 &&
									Math.abs(p.start - cpu[i].segment.startDistance.value) <= 0.01,
							),
						) && entry.endpointFailures === 0,
					source:
						entry.sourceInvariants.samples === 42 &&
						entry.sourceInvariants.maximumDistanceResidualMeters <= 0.01 &&
						entry.sourceInvariants.maximumInverseSquareRelative <= 1e-4 &&
						entry.sourceInvariants.maximumTransmissionResidual <= 1e-7,
					image:
						capture.images[index].degrees === pose.key &&
						capture.images[index].maximum <= 2 &&
						capture.images[index].p95 <= 1,
				};
				for (const suffix of ['fresh', 'reused', 'comparison'])
					await parent(name, 'angle-' + pose.key + '-' + suffix + '.png');
				rows.push({
					capture: name,
					pose: expected,
					checks,
					qualified: Object.values(checks).every(Boolean),
					endpointMaximumMeters: entry.endpointMaximumMeters,
					reuse: entry.gpuReuse,
					receiverReuse: entry.receiverReuse,
					spatialQueries: entry.spatial.queries,
					buildMilliseconds: entry.buildMilliseconds,
					image: capture.images[index],
				});
				seen.add(pose.key);
			}
		}
		const policyName = process.argv.at(-1),
			policy = JSON.parse(new TextDecoder().decode((await parent(policyName, 'result.json')).bytes));
		const policyInputs = JSON.parse(new TextDecoder().decode((await parent(policyName, 'inputs.json')).bytes));
		if (
			!policyInputs.parents.some(
				(p) => p.artifact === 'layout.json' && p.artifactSha256 === layout.artifactSha256,
			)
		)
			throw Error('Frame-policy layout differs');
		if (
			!policy.qualified ||
			policy.schema !== 'p3-frame-policy-v1' ||
			policy.rows.length !== 10 ||
			policy.rows.some((r) => !r.qualified)
		)
			throw Error('Construction/coverage identity proof missing');
		if (poses.some((p) => !seen.has(p.key))) throw Error('Incomplete frozen movement matrix');
		const source = [];
		for (const n of [
			'qualify-p3-movement.js',
			'run-rotation.js',
			'rotation-browser.js',
			'rotation-gpu.js',
			'rotation-model.js',
			'prove-shell-frame-identity.js',
			'run-resource-bounded.js',
			'heavy-execution-admission.js',
			'resource-monitor/windows-process-telemetry.js',
			'resource-monitor/prove.js',
			'movement-types.d.ts',
			'types.d.ts',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
		]) {
			const p = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', n);
			await checkPath(repositoryRoot, p);
			const bytes = await readFile(p);
			source.push({path: 'experiments/local-sun-cache-reuse/' + n, sha256: hash(bytes)});
			await run.write('source-' + n.replaceAll('/', '-'), bytes);
		}
		const qualified = rows.every((r) => r.qualified);
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					parents: parents.map(({bytes, ...p}) => p),
					source,
					command: process.argv.slice(1),
					tools: {node: process.version},
					operation:
						'Authenticate fixed P3 contract, source closure, exact pose/time, every field byte identity, full-view/receiver spectra, physical reconstruction/coverage/source/endpoints, RGB differences and original 8GiB guarded capture; require all 14 distinct frozen poses.',
					parameters: {
						poses,
						limits: 'Pinned 00478; no physical errorbar, additional dimension or tolerance change',
					},
				},
				null,
				2,
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'p3-current-movement-v1',
					qualified,
					rows,
					resources,
					admission: {
						height: 4828032,
						top: 100000,
						radius: 33378000,
						ground: 'black',
						ozone: false,
						scope: 'Tested horizontal rigid transforms and exact five-state fixture placements only. Query support must remain inside the source-centered cylinder/slab. Source height, atmosphere, ground, emission and numerical policy changes require rebuild. Observer placement remains a live frame/admission input.',
					},
					limits: 'Consistency and model symmetry, not a universal numerical bound, app lifecycle or performance qualification. Field equality uses complete SHA256 identities; spatial/ray/receiver differences are directly measured. No recording.',
				},
				null,
				2,
			),
		);
		await run.finish(qualified ? 'accepted' : 'rejected');
		console.log(
			JSON.stringify({run: run.name, qualified, poses: seen.size, failed: rows.filter((r) => !r.qualified)}),
		);
	} catch (e) {
		await run.finish('failed', String(e));
		throw e;
	}
}
await main();
