#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { FlatEarthGeometry } from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import { assertContainmentPreconditions, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { assertExistingRealPathContained, assertNoReparseEntries } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, REPOSITORY_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-g1-geometry-transform-proof.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'g1-spherical-celestial-geometry-v1.json');

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function placement(sourceId, direction, observationState) {
	return {
		sourceId,
		direction,
		frameId: observationState.celestialFrameId,
		originConvention: 'observer-independent-infinite-direction',
		directionConvention: 'receiver-to-source',
		epoch: observationState.epoch,
		placementProviderContractFingerprint: 'sha256:g1-provider-v1',
		placementStateFingerprint: `sha256:g1-${sourceId}-${observationState.epoch.value}-v1`,
	};
}

function placementsFor(state) {
	return Object.entries(state.placements).map(([sourceId, direction]) => placement(sourceId, direction, state.observationState));
}

async function expectRejection(operation, label) {
	try {
		await operation();
	} catch {
		return true;
	}
	throw new Error(`${label} was not rejected.`);
}

function report(runId, proof) {
	return [
		`# ${runId}: G1 geometry celestial transform proof`,
		'',
		'Conclusion: **accepted**',
		'',
		`- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.`,
		`- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.`,
		`- Query fingerprints: ${proof.queries.map((query) => query.queryStateFingerprint).join(', ')}.`,
		'',
		'This proof establishes only geometry-owned named-frame placement, spherical',
		'`(h, u)` coordinates, horizon/support classification, and deterministic',
		'query stencils. It makes no transport, cache-generation, raster, visibility,',
		'or GPU claim.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The G1 geometry proof accepts no command-line arguments.');
	const run = await initializeRunRecord({
		slug: 'g1-geometry-transform-proof',
		command: COMMAND,
		inputs: { schemaId: 'g1-geometry-proof-inputs-v1', fixture: 'experiments/extraterrestrial/fixtures/g1-spherical-celestial-geometry-v1.json' },
		provenance: { schemaId: 'g1-geometry-proof-provenance-v1', repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { schemaId: 'g1-geometry-proof-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
		references: { schemaId: 'g1-geometry-proof-references-v1', canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		await Promise.all([
			assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'G1 fixture'),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree'),
		]);
		const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
		const geometry = new SphericalEarthGeometry(fixture.geometry);
		const domain = geometry.describeCelestialContributionDomain();
		requireCondition(domain.coordinateAxes.join(',') === 'h,u', 'Geometry did not declare the required `(h, u)` axes.');
		const queries = fixture.states.map((state) => geometry.prepareCelestialContributionQuery(fixture.generationDescriptor, fixture.sourceDefinitions, placementsFor(state), state.observationState));
		const [zenith, partial, empty] = queries;
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(zenith.layerQueries.starField.members.length === 2, 'The query retains two distinct star directions.');
		assert(zenith.layerQueries.sun.angularSupport.classification === 'full', 'Zenith Sun support is full.');
		assert(partial.layerQueries.sun.angularSupport.classification === 'partial', 'Near-horizon Sun support is partial.');
		assert(empty.layerQueries.sun.angularSupport.classification === 'empty', 'Below-horizon Sun support is empty.');
		assert(empty.layerQueries.starField.members.some((member) => member.stencil.classification === 'ground-horizon' && member.stencil.contribution === 'zero'), 'Below-horizon point placement produces exact ground-horizon zero before lookup.');
		assert(zenith.queryStateFingerprint !== partial.queryStateFingerprint && partial.queryStateFingerprint !== empty.queryStateFingerprint, 'Epoch/geography changes produce distinct query fingerprints.');
		assert(fixture.generationDescriptor.physicalFieldFingerprint === 'sha256:g1-synthetic-field-plan-v1', 'Placement changes leave the declared field plan unchanged.');
		const cameraVariant = structuredClone(fixture.states[0].observationState);
		cameraVariant.camera = { orientation: [0, 0, 0, 1], fovRadians: 1.7, viewport: [3840, 2160] };
		const cameraQuery = geometry.prepareCelestialContributionQuery(fixture.generationDescriptor, fixture.sourceDefinitions, placementsFor({ ...fixture.states[0], observationState: cameraVariant }), cameraVariant);
		assert(cameraQuery.queryStateFingerprint === zenith.queryStateFingerprint, 'Camera state does not enter physical or query identity.');
		const receiver = zenith.receiverPositionModelMeters;
		const horizon = geometry.resolveCelestialDirectionStencil(receiver, [0, 1, 0]);
		const below = geometry.resolveCelestialDirectionStencil(receiver, [-1, 0, 0]);
		assert(horizon.classification === 'clear' && horizon.u >= 0 && horizon.u <= 1, 'Visible directions resolve finite `(h, u)` stencils.');
		assert(below.classification === 'ground-horizon' && below.contribution === 'zero', 'Ground/horizon classification happens before interpolation.');
		const build = geometry.resolveCelestialBuildSample({ h: 35000, u: 0.5 }, { sourceId: 'star-alpha' });
		assert(build.stableVisibility === 'clear' && build.atmospherePath.terminus === 'top-atmosphere', 'Build samples use a geometry-owned top-atmosphere path.');
		const negativeControls = [
			await expectRejection(() => geometry.prepareCelestialContributionQuery(fixture.generationDescriptor, fixture.sourceDefinitions, placementsFor({ ...fixture.states[0], observationState: { ...fixture.states[0].observationState, celestialFrameId: 'wrong-frame' } }), { ...fixture.states[0].observationState, celestialFrameId: 'wrong-frame' }), 'Frame mismatch'),
			await expectRejection(() => geometry.resolveCelestialDirectionStencil(receiver, [0, 0, 0]), 'Ambiguous zero direction'),
			await expectRejection(() => geometry.resolveCelestialBuildSample({ h: -1, u: 0.5 }), 'Below-ground build coordinate'),
			await expectRejection(() => new FlatEarthGeometry({ observerPosition: { coordinates: [0, 0, 2], units: 'meters' }, sourcePosition: { coordinates: [0, 0, 3], units: 'meters' }, topAltitude: { value: 10, units: 'meters' }, cacheRadialMaximum: { value: 10, units: 'meters' } }).describeCelestialContributionDomain(), 'Flat geometry family rejection'),
			await expectRejection(() => geometry.createCelestialContributionCacheController(), 'Deferred lifecycle controller'),
		];
		requireCondition(negativeControls.every(Boolean), 'One or more negative controls were accepted.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g1-geometry-transform-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		requireCondition(closure.files.every((file) => !file.startsWith('../') && !file.includes('/baseline/')), 'G1 runner closure escaped the experiment candidate surface.');
		const protectedAfter = await verifyProtectedTrackedInventory(protectedBefore, policy);
		const proof = {
			proofId: 'g1-spherical-celestial-geometry-v1',
			accepted: true,
			assertions,
			negativeControls: negativeControls.map((accepted, index) => ({ id: index + 1, rejected: accepted })),
			fieldPlanFingerprint: fixture.generationDescriptor.physicalFieldFingerprint,
			queries: queries.map((query) => ({ queryStateFingerprint: query.queryStateFingerprint, observationTransformFingerprint: query.observationTransformFingerprint, sunSupport: query.layerQueries.sun.angularSupport, starStencils: query.layerQueries.starField.members.map((member) => ({ sourceId: member.sourceId, classification: member.stencil.classification, hStencil: member.stencil.hStencil ?? null, uStencil: member.stencil.uStencil ?? null })) })),
			containment: { protectedFiles: protectedAfter.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length },
		};
		await run.writeJsonArtifact('evidence/g1-geometry-proof.json', proof);
		await run.writeJsonArtifact('evidence/g1-fixture.json', fixture);
		await run.writeJsonArtifact('evidence/g1-source-identities.json', { fixtureSha256: `sha256:${await sha256File(FIXTURE_PATH)}`, runner: 'experiments/extraterrestrial/runners/run-g1-geometry-transform-proof.js', candidateRoot: CANDIDATE_ROOT, repositoryRoot: REPOSITORY_ROOT });
		const terminalManifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, accepted: true, assertionCount: assertions.length, negativeControlCount: negativeControls.length, fieldPlanFingerprint: proof.fieldPlanFingerprint }, report: report(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: terminalManifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const serialized = { name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminalManifest = await run.finalize({ conclusion: 'failed', result: { proofId: 'g1-spherical-celestial-geometry-v1', accepted: false, error: serialized }, report: `# ${run.runId}: G1 geometry celestial transform proof\n\nConclusion: **failed**\n\n${serialized.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: terminalManifest.artifactSetSha256, error: serialized }, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'partial-unfinalized', error: serialized, finalizationError: String(finalizationError) }, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
