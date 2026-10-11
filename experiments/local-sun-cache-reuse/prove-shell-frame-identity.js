import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {createOwners} from './rotation-model.js';
import {partitionedShellIncoming} from './shell-angular.js';
import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Derive fixed physical/numerical field identity independently of observer placement.
 * @returns {Promise<void>} - Source-bound identity consistency proof, not GPU field or performance evidence.
 */
async function main() {
	const run = await ExperimentRun.create('p3-frame-policy');
	try {
		const parents = await Promise.all([
			readParent('00478-p3-contract', 'layout.json'),
			readParent('00018-controls', 'controls.json'),
		]);
		if (parents[0].artifactSha256 !== 'd1c7dea2b0587474de5930d75e8e91e9fb61d20ed92faefce2ab7a239a290864')
			throw Error('Layout identity changed');
		/** @type {LocalSunShellLayout} */ const layout = JSON.parse(new TextDecoder().decode(parents[0].bytes));
		const controls = JSON.parse(new TextDecoder().decode(parents[1].bytes));
		const rows = [];
		let fieldIdentity = null,
			coverageIdentity = null;
		for (const state of controls.states)
			for (const observer of [
				[0, 0],
				[10000, -10000],
			]) {
				const recipe = {
					state,
					diagnostic: false,
					angles: [0],
					motion: false,
					candidate: /** @type {const} */ ('precision'),
					shellLayout: layout,
					shellRuntime: true,
					shellIncoming: partitionedShellIncoming(48, 0.5),
					shellObserverOffset: /** @type {[number,number]} */ (observer),
				};
				const owners = createOwners(recipe, 0);
				try {
					const source = owners.source.configuration,
						facts = owners.source._cacheProvider._constructionShellFactCache;
					const coverage = {
						height: layout.height,
						top: layout.top,
						radius: layout.maximumRho,
						nodes: layout.nodes,
						rows: layout.rows,
						omitted: layout.omittedBands,
						sourceDistanceMinimum: layout.height - layout.top,
						sourceDistanceMaximum: Math.hypot(layout.height, layout.maximumRho),
					};
					const policy = {
						schema: 'p3-canonical-field-policy-v1',
						source: {
							...source,
							position: {...source.position, coordinates: [0, 0, source.position.coordinates[2]]},
						},
						sourceSpectrum: owners.source.sourceIrradiance.contentHash,
						sourceBoundaries: Array.from(facts.boundaries),
						heldScales: Array.from(facts._heldIncidentScales),
						coverage,
						layout,
						atmosphere: CANONICAL_ATMOSPHERE_CONSTANTS,
						ground: 'black-flat',
						execution: state.execution,
						incoming: recipe.shellIncoming,
						outgoing: owners.domains.outgoingDirectionDomain.id,
						build: 'column48-tail64',
						runtime: 'analytic-columns-positive-column15-v1',
						format: 'R32F',
						units: 'meters-Native15',
					};
					const current = CanonicalValueHash.sha256Value(policy),
						domain = CanonicalValueHash.sha256Value(coverage);
					fieldIdentity ??= current;
					coverageIdentity ??= domain;
					rows.push({
						state: state.id,
						observerOffsetMeters: observer,
						actualObserver: owners.geometry.configuration.observerPosition,
						actualSource: source.position,
						fieldIdentity: current,
						coverageIdentity: domain,
						qualified: current === fieldIdentity && domain === coverageIdentity,
					});
					if (rows.length === 1) await run.write('policy.json', JSON.stringify(policy, null, 2));
				} finally {
					owners.facade.dispose();
				}
			}
		const sources = [];
		for (const name of [
			'prove-shell-frame-identity.js',
			'rotation-model.js',
			'shell-source.js',
			'shell-geometry.js',
			'shell-layout.js',
			'shell-client.js',
			'shell-angular.js',
			'ExperimentRun.js',
			'parent-evidence.js',
			'run-boundary.js',
		]) {
			const p = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name);
			await checkPath(repositoryRoot, p);
			const bytes = await readFile(p);
			sources.push({path: name, sha256: hash(bytes)});
			await run.write('source-' + name, bytes);
		}
		const qualified = rows.length === 10 && rows.every((r) => r.qualified);
		await run.write(
			'inputs.json',
			JSON.stringify(
				{
					parents: parents.map(({bytes, ...p}) => p),
					sources,
					command: process.argv.slice(1),
					tools: {node: process.version},
					operation:
						'Resolve actual source fact cache across five fixed orbital states and two observer offsets; compare full normalized source, 2049 boundaries, 2048 held scales, layout, medium, ground, execution and quadrature identities. Physical-domain identity contains no observer term. Compiler normalizes source XY and radial fallback, see configureShellBackend.',
				},
				null,
				2,
			),
		);
		await run.write(
			'result.json',
			JSON.stringify(
				{
					schema: 'p3-frame-policy-v1',
					qualified,
					fieldIdentity,
					coverageIdentity,
					rows,
					limits: 'Derivation and actual source-policy identity only. GPU fields, query support and numerical covariance require separate movement captures. Runtime frame/dome identity must retain observer and source placement; implementation identity must accompany this numerical policy in any cache key.',
				},
				null,
				2,
			),
		);
		await run.finish(qualified ? 'accepted' : 'rejected');
		console.log(JSON.stringify({run: run.name, qualified}));
	} catch (e) {
		await run.finish('failed', String(e));
		throw e;
	}
}
await main();
