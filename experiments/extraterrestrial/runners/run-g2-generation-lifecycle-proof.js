#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-g2-generation-lifecycle-proof.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'g2-synthetic-generation-v1.json');

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function abortError(message) { const error = new Error(message); error.name = 'AbortError'; return error; }

function createResource(id, events) {
	let disposed = false;
	return {
		id,
		get disposeCount() { return events.filter((event) => event === `dispose:${id}`).length; },
		dispose() { if (!disposed) { disposed = true; events.push(`dispose:${id}`); } },
	};
}

function buildRequest(fixture, identity, events, options = {}) {
	return {
		layers: fixture.layers,
		foregroundEdges: [],
		physicalFieldFingerprint: `sha256:g2-field-${identity}`,
		representationFingerprint: `sha256:g2-representation-${identity}`,
		runtimeCompatibilityFingerprint: `sha256:g2-runtime-${identity}`,
		buildPayloads: async ({ signal }) => {
			if (options.gate) await options.gate;
			if (signal.aborted) throw abortError(`synthetic ${identity} build was aborted`);
			const pointPayloads = [createResource(`${identity}:star-alpha`, events), createResource(`${identity}:star-beta`, events)];
			const extendedPayloads = [createResource(`${identity}:sun`, events)];
			if (options.incomplete) return { pointPayloads: pointPayloads.slice(0, 1), extendedPayloads, ...fixture.resourceReport };
			if (options.fail) { const error = new Error(`synthetic ${identity} failure`); error.payloads = [...pointPayloads, ...extendedPayloads]; throw error; }
			return { pointPayloads, extendedPayloads, ...fixture.resourceReport };
		},
	};
}

async function expectRejection(operation, label) {
	try { await operation(); } catch { return true; }
	throw new Error(`${label} was not rejected.`);
}

function createReport(runId, proof) {
	return [
		`# ${runId}: G2 generation lifecycle proof`, '', 'Conclusion: **accepted**', '',
		`- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.`,
		`- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.`,
		`- Published generation identity: ${proof.publishedGenerationIdentity}.`,
		'', 'This proof establishes synthetic aggregate-generation lifecycle only. It does not establish transported payloads, rasterization, visibility, shader execution, or GPU resources.', '',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The G2 lifecycle proof accepts no command-line arguments.');
	const run = await initializeRunRecord({
		slug: 'g2-generation-lifecycle-proof', command: COMMAND,
		inputs: { schemaId: 'g2-generation-proof-inputs-v1', fixture: 'experiments/extraterrestrial/fixtures/g2-synthetic-generation-v1.json' },
		provenance: { schemaId: 'g2-generation-proof-provenance-v1', repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { schemaId: 'g2-generation-proof-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
		references: { schemaId: 'g2-generation-proof-references-v1', canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		await Promise.all([assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'G2 fixture'), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree')]);
		const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
		const events = [];
		const backend = { id: 'g2-external-synthetic-backend' };
		const geometry = new SphericalEarthGeometry(fixture.geometry);
		const controller = geometry.createCelestialContributionCacheController({ backend });
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		const first = await controller.createCelestialContributionCache(buildRequest(fixture, 'a', events));
		assert(controller.active === first && first.pointPayloads.length === 2 && first.extendedPayloads.length === 1, 'Only a complete two-star plus one-Sun aggregate generation publishes.');
		const reuse = await controller.createCelestialContributionCache({ ...buildRequest(fixture, 'a', events), buildPayloads: () => { throw new Error('Exact reuse must not stage resources.'); } });
		assert(reuse === first, 'Exact compatible request reuses the active generation without staging.');
		const failed = await expectRejection(() => controller.createCelestialContributionCache(buildRequest(fixture, 'failed', events, { incomplete: true })), 'Incomplete aggregate generation');
		assert(failed && controller.active === first, 'An incomplete candidate preserves the active generation.');
		assert(events.includes('dispose:failed:star-alpha') && events.includes('dispose:failed:sun'), 'Rejected staged payloads release their owned resources.');
		let releaseSlow;
		const slowGate = new Promise((resolve) => { releaseSlow = resolve; });
		const slow = controller.createCelestialContributionCache(buildRequest(fixture, 'slow', events, { gate: slowGate }));
		await Promise.resolve();
		const replacement = controller.createCelestialContributionCache(buildRequest(fixture, 'b', events));
		releaseSlow();
		assert(await expectRejection(() => slow, 'Superseded candidate'), 'A newer request supersedes an older staged candidate.');
		const second = await replacement;
		assert(controller.active === second && first.disposed, 'Replacement publishes atomically before disposing the prior generation.');
		assert(first.pointPayloads.every((payload) => payload.disposeCount === 1) && first.extendedPayloads[0].disposeCount === 1, 'Every prior-generation resource disposes exactly once.');
		const slots = controller.createBuildResultSlots();
		assert(Object.keys(slots).join(',') === 'celestialCacheController,celestialCacheGeneration,celestialCacheIdentity' && !Object.hasOwn(slots, 'cacheController'), 'Celestial build-result slots are distinct from scattering-cache slots.');
		assert(second.resourceReport.logicalBytes === fixture.resourceReport.logicalBytes && second.resourceReport.packedBytes === fixture.resourceReport.packedBytes && second.resourceReport.peakBytes === fixture.resourceReport.peakBytes && second.resourceReport.residentBytes === fixture.resourceReport.residentBytes, 'Generation reports retained logical, packed, peak, and resident resource categories.');
		controller.dispose(); controller.dispose();
		assert(second.disposed && second.pointPayloads.every((payload) => payload.disposeCount === 1) && second.extendedPayloads[0].disposeCount === 1, 'Controller and active generation disposal are idempotent.');
		const negativeControls = [
			await expectRejection(() => controller.createCelestialContributionCache(buildRequest(fixture, 'after-dispose', events)), 'Disposed controller'),
			await expectRejection(() => geometry.createCelestialContributionCacheController({}), 'Missing external backend'),
			await expectRejection(() => geometry.createCelestialContributionCacheController({ backend: {} }).createCelestialContributionCache({ ...buildRequest(fixture, 'foreground', events), foregroundEdges: [{ before: 'sun', after: 'stars' }] }), 'Foreground edge'),
		];
		requireCondition(negativeControls.every(Boolean), 'One or more G2 negative controls were accepted.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g2-generation-lifecycle-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		requireCondition(closure.files.every((file) => !file.startsWith('../') && !file.includes('/baseline/')), 'G2 runner closure escaped the experiment candidate surface.');
		const protectedAfter = await verifyProtectedTrackedInventory(protectedBefore, policy);
		const proof = { proofId: 'g2-synthetic-generation-lifecycle-v1', accepted: true, assertions, negativeControls: negativeControls.map((rejected, index) => ({ id: index + 1, rejected })), publishedGenerationIdentity: second.descriptor.generationIdentity, resourceReport: second.resourceReport, events, containment: { protectedFiles: protectedAfter.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/g2-generation-proof.json', proof);
		await run.writeJsonArtifact('evidence/g2-fixture.json', fixture);
		await run.writeJsonArtifact('evidence/g2-source-identities.json', { fixtureSha256: `sha256:${await sha256File(FIXTURE_PATH)}`, runner: 'experiments/extraterrestrial/runners/run-g2-generation-lifecycle-proof.js' });
		const terminalManifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, accepted: true, assertionCount: assertions.length, negativeControlCount: negativeControls.length, generationIdentity: proof.publishedGenerationIdentity }, report: createReport(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: terminalManifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const serialized = { name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminalManifest = await run.finalize({ conclusion: 'failed', result: { proofId: 'g2-synthetic-generation-lifecycle-v1', accepted: false, error: serialized }, report: `# ${run.runId}: G2 generation lifecycle proof\n\nConclusion: **failed**\n\n${serialized.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: terminalManifest.artifactSetSha256, error: serialized }, null, 2)}\n`);
		} catch (finalizationError) { process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'partial-unfinalized', error: serialized, finalizationError: String(finalizationError) }, null, 2)}\n`); }
		process.exitCode = 1;
	}
}

await main();
