import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {residual} from './rotation-model.js';

/** Derive the P3-C disposition from sealed captures and separate support/omission proofs.
 * @returns {Promise<void>} - New immutable summary; no new rendering or physical-accuracy claim.
 */
async function main() {
	const run = await ExperimentRun.create('p3-layout-report');
	try {
		const args = process.argv.slice(2);
		if (args.length !== 7)
			throw new Error(
				'Expected five capture@resource pairs in 0/45/90/135/180 order, then support and omission run names.',
			);
		/** @type {LocalSunParentArtifact[]} */ const parents = [];
		/** Authenticate every parent inventory before decoding its selected JSON.
		 * @param {string} name - Exact sealed run name.
		 * @param {string} artifact - Manifest-listed parent artifact.
		 * @returns {Promise<LocalSunParentArtifact>} - Bytes and complete provenance identity.
		 */
		const load = async (name, artifact) => {
			const p = await readParent(name, artifact);
			parents.push(p);
			return p;
		};
		const contract = await load('00478-p3-contract', 'contract.json'),
			gates = await load('00478-p3-contract', 'gates.json'),
			layout = await load('00478-p3-contract', 'layout.json');
		if (
			contract.artifactSha256 !== '186b8be60929276c1208dbd72d2c648a3782cd4346c59f4a0c74efcc9826a704' ||
			gates.artifactSha256 !== 'c5794fb707b7da7c87713e19ebaf77ae7e3816d6cc72e929958e12a4aa33210d' ||
			layout.artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864'
		)
			throw new Error('Current contract identity changed.');
		const controls = JSON.parse((await load('00018-controls', 'controls.json')).bytes.toString());
		const ids = ['flat-0', 'flat-45', 'flat-90', 'flat-135', 'flat-180'];
		const states = [];
		let frozenSourceClosure = null;
		for (let i = 0; i < 5; i++) {
			const pair = args[i].split('@');
			if (pair.length !== 2) throw new Error('Capture@resource pair required.');
			const [capture, resource] = pair;
			/** @type {LocalSunP3StoredCapture} */ const result = JSON.parse(
				(await load(capture, 'result.json')).bytes.toString(),
			);
			/** @type {LocalSunShellCaptureRequest} */ const recipe = JSON.parse(
				(await load(capture, 'recipe.json')).bytes.toString(),
			);
			const pin = await load(capture, 'contract.json'),
				limits = JSON.parse((await load(resource, 'inputs.json')).bytes.toString()),
				monitor = JSON.parse((await load(resource, 'result.json')).bytes.toString());
			const tail = (await load(resource, 'stdout-tail.txt')).bytes.toString();
			const captureInputs = JSON.parse((await load(capture, 'inputs.json')).bytes.toString());
			const closure = JSON.stringify(
				[...captureInputs.inputs].sort((/** @type {{path:string}} */ a, /** @type {{path:string}} */ b) =>
					a.path.localeCompare(b.path),
				),
			);
			frozenSourceClosure ??= closure;
			if (closure !== frozenSourceClosure)
				throw new Error('Frozen capture source closure differs between cadence states.');
			if (
				pin.artifactSha256 !== contract.artifactSha256 ||
				JSON.stringify(recipe.state) !== JSON.stringify(controls.states.find((s) => s.id === ids[i])) ||
				JSON.stringify(recipe.layout) !== JSON.stringify(JSON.parse(layout.bytes.toString()))
			)
				throw new Error('Wrong frozen capture state or occupied layout.');
			if (
				!recipe.compensatedEndpoints ||
				recipe.transport !== 'column48-tail64' ||
				recipe.incoming !== 'partitioned-midpoint48' ||
				!recipe.runtime ||
				recipe.diagnostic ||
				!recipe.cooperative ||
				recipe.state.execution.maximumScatteringOrder !== 4
			)
				throw new Error('Frozen numerical controls differ.');
			if (
				!monitor.resourceQualified ||
				monitor.failure ||
				limits.launcher.script !== 'run-shell-capture.js' ||
				!tail.includes(capture) ||
				monitor.minimumFreeBytes < limits.limits.reserveBytes ||
				monitor.peakPrivateBytes > limits.limits.maximumBytes ||
				monitor.peakWorkingSetBytes > limits.limits.maximumBytes
			)
				throw new Error('Resource provenance or admission failed.');
			if (result.results.length !== 2 || result.glErrors.length)
				throw new Error('Incomplete or invalid capture.');
			const c = result.results[1];
			const expectedIds = [
				'local-sun-j1',
				'local-sun-j2',
				'local-sun-j3',
				'local-sun-j4',
				'local-sun-l1',
				'local-sun-l2',
				'local-sun-l3',
			];
			if (
				c.positions !== 1049 ||
				c.incomingCount !== 1920 ||
				c.orderFields.length !== 7 ||
				expectedIds.some((id) => !c.orderFields.some((f) => f.id === id)) ||
				c.orderFields.some((f) => f.nonfinite || f.negativeBeyondAbsolute) ||
				c.field.nonfinite ||
				c.field.negative ||
				c.cpuGpu.failures ||
				c.axisContinuity.failures ||
				c.coverage.excluded.length
			)
				throw new Error('Incomplete candidate channel/order/support inventory.');
			if (
				c.cpuRays.length !== 96 ||
				c.gpuRays.length !== 96 ||
				c.cpuRays.some((r) => r.radiance.length !== 15 || r.transmittance.length !== 15) ||
				c.gpuRays.some((r) => r.radiance.length !== 15 || r.transmittance.length !== 15)
			)
				throw new Error('Complete view-ray inventory missing.');
			const transmission = residual(
				c.gpuRays.flatMap((r) => r.transmittance),
				c.cpuRays.flatMap((r) => r.transmittance),
				1e-7,
				0.002,
			);
			const viewRadiance = residual(
				c.gpuRays.flatMap((r) => r.radiance),
				c.cpuRays.flatMap((r) => r.radiance),
				1e-9,
				0.002,
			);
			const endpoint = Math.max(
				...c.cpuRays.map((r, j) =>
					Math.max(
						Math.abs(r.segment.startDistance.value - c.gpuRays[j].start),
						Math.abs(r.segment.endDistance.value - c.gpuRays[j].end),
					),
				),
			);
			const receiverPackets = [
				c.receiver.directNormal,
				c.receiver.directHorizontal,
				c.receiver.diffuseHorizontal,
				c.receiver.totalHorizontal,
			];
			if (
				transmission.failures ||
				viewRadiance.failures ||
				!Number.isFinite(endpoint) ||
				endpoint > 0.01 ||
				receiverPackets.some(
					(p) => p.values.length !== 15 || p.values.some((v) => !Number.isFinite(v) || v < -1e-9),
				)
			)
				throw new Error('Invalid transmission, endpoints or receiver packets.');
			if (
				[0, 2, 4].includes(i) &&
				(!c.layoutChecks?.qualified ||
					c.layoutChecks.cumulativeClosure.count !== 1049 * 4374 * 15 ||
					c.layoutChecks.lookups.length !== 1 ||
					c.layoutChecks.lookups[0].id !== 'cumulative' ||
					c.layoutChecks.lookups[0].queries !== 110641 ||
					c.layoutChecks.lookups.some((l) => l.residual.count !== l.queries * 15))
			)
				throw new Error('Required primary-state additive/layout matrix is incomplete.');
			await load(capture, 'candidate.png');
			await load(capture, 'control.png');
			states.push({
				id: ids[i],
				capture,
				resource,
				viewRadiance,
				transmission,
				maximumEndpointDifferenceMeters: endpoint,
				axisContinuity: c.axisContinuity,
				orderFields: c.orderFields,
				layoutChecks: c.layoutChecks ?? null,
				buildMilliseconds: c.buildMilliseconds,
				buildBudgetMet: c.buildMilliseconds <= 30000,
				logicalFieldPeakBytes: c.peakFieldBytes,
				phasePayloadBytes: c.phaseMatrix?.payloadBytes ?? 0,
				monitor,
				resourceLimits: limits.limits,
				temporaryException: limits.temporaryException ?? null,
				receiverClaim:
					'Exact-state GPU receiver packets retained; inherited CPU receiver diagnostics are a separate construction policy, not a same-policy acceptance oracle.',
			});
		}
		const support = JSON.parse((await load(args[5], 'result.json')).bytes.toString()),
			omission = JSON.parse((await load(args[6], 'result.json')).bytes.toString());
		for (const proof of [support, omission])
			if (
				!proof.qualified ||
				proof.contractSha256 !== contract.artifactSha256 ||
				proof.gatesSha256 !== gates.artifactSha256
			)
				throw new Error('Support/omission proof lacks current acceptance authority.');
		const source = [];
		for (const name of [
			'qualify-p3-layout.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
			'rotation-model.js',
		]) {
			const file = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, file);
			const bytes = await readFile(file);
			source.push({path: path.relative(repositoryRoot, file).replaceAll('\\', '/'), sha256: hash(bytes)});
			await run.write('source-' + name, bytes);
		}
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					schema: 'p3-layout-summary-input-v1',
					parents: parents.map(({bytes, ...p}) => p),
					source,
					operation:
						'Authenticate frozen five-state captures, complete Native15 order/ray inventory, primary cumulative closure/lookup checks and separate support/omission proofs. Recompute endpoint/transmission consistency; retain actual resource exception and costs.',
					parameters: {
						states: ids,
						primaryStates: ['flat-0', 'flat-90', 'flat-180'],
						radianceAbsolute: 1e-9,
						transmissionAbsolute: 1e-7,
						relative: 0.002,
						maximumEndpointMeters: 0.01,
					},
					tools: {node: process.version},
					command: process.argv.slice(1),
				},
				null,
				'\t',
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'p3-layout-summary-v1',
					qualified: true,
					states,
					support,
					omission,
					claim: 'Fresh-layout ordinary consistency and omission only. Direct runtime lookup checks cover the cumulative field at all spatial nodes/cell/edge/seam sentinels, and all W27 directions at six representative points; full order readbacks and additive accounting cover every stored scalar. No independent physical error bars, movement/reuse, app lifecycle, repeated performance, old-grid equivalence or video qualification is claimed.',
				},
				null,
				'\t',
			),
		);
		await run.finish('accepted');
		console.log(
			JSON.stringify({
				run: run.name,
				qualified: true,
				states: states.map((s) => ({
					id: s.id,
					buildMilliseconds: s.buildMilliseconds,
					buildBudgetMet: s.buildBudgetMet,
				})),
				savedPeakBytes: omission.unculledPeakFieldBytes - omission.compactPeakFieldBytes,
			}),
		);
	} catch (error) {
		await run.finish('failed', error instanceof Error ? error.stack : String(error));
		throw error;
	}
}
await main();
