#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { FiniteLocalSunCelestialSource } from '../candidate/src/algorithm32/caches/celestial/FiniteLocalSunCelestialSource.js';
import { FlatEarthGeometry } from '../candidate/src/algorithm32/geometries/FlatEarthGeometry.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-pre-g9-flat-local-finite-sun-contract-proof.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'flat-local-finite-sun-v1.json');

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

async function rejects(operation) {
	try { await operation(); } catch { return true; }
	return false;
}

function position(coordinates) {
	return { coordinates, units: 'meters' };
}

function distance(value) {
	return { value, units: 'meters' };
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'pre-g9-flat-local-finite-sun-contract-proof',
		command: COMMAND,
		inputs: {
			fixture: 'experiments/extraterrestrial/fixtures/flat-local-finite-sun-v1.json',
			question: 'Does a simulator-configured surface-radiance finite Sun resolve exact flat geometry support and illumination without a reference-distance scale?',
		},
		provenance: { experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { node: process.version, platform: process.platform },
		references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([
			assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'Finite local-Sun fixture'),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree'),
		]);
		const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
		const { source: sourceFixture } = fixture;
		const center = [0, 0, sourceFixture.centerHeightMeters];
		const geometry = new FlatEarthGeometry({
			observerPosition: position([0, 0, 2]),
			sourcePosition: position(center),
			topAltitude: distance(fixture.geometry.topAltitudeMeters),
			cacheRadialMaximum: distance(fixture.geometry.cacheRadialMaximumMeters),
		});
		const surfaceRadiance = createSpectralPacket({
			basis: NATIVE_15_SPECTRAL_BASIS,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values: sourceFixture.surfaceRadianceValues,
			provenanceIdentity: 'flat-local-finite-sun-fixture-radiance-v1',
		});
		const source = new FiniteLocalSunCelestialSource({
			sourceId: sourceFixture.sourceId,
			surfaceRadiance,
			radius: distance(sourceFixture.radiusMeters),
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		});
		const placement = geometry.resolveFiniteCelestialBodyPlacement({
			sourceId: source.sourceId,
			receiverPosition: position([0, 0, 0]),
			centerPosition: position(center),
			radius: source.radius,
		});
		const translated = geometry.resolveFiniteCelestialBodyPlacement({
			sourceId: source.sourceId,
			receiverPosition: position([0, 0, 0]),
			centerPosition: position([fixture.horizontalTranslationMeters, 0, sourceFixture.centerHeightMeters]),
			radius: source.radius,
		});
		const illumination = source.resolveDirectIllumination(placement);
		const translatedIllumination = source.resolveDirectIllumination(translated);
		const support = geometry.resolveFiniteCelestialBodyRaySupport({
			placement,
			rayOrigin: position([0, 0, 0]),
			rayDirection: [0, 0, 1],
		});
		const outside = geometry.resolveFiniteCelestialBodyRaySupport({
			placement,
			rayOrigin: position([0, 0, 0]),
			rayDirection: [1, 0, 0],
		});
		const assertions = [];
		const assert = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		const expectedAngularRadius = Math.asin(sourceFixture.radiusMeters / sourceFixture.centerHeightMeters);
		assert(source.radius.value === 16 * 1609.344 && sourceFixture.centerHeightMeters === 3000 * 1609.344, 'Simulator defaults retain 3,000-mile center height and 16-mile radius.');
		assert(Math.abs(placement.angularRadiusRadians - expectedAngularRadius) < 1e-15, 'Geometry resolves exact finite apparent angular support.');
		assert(illumination.values.every((value, index) => Math.abs(value - surfaceRadiance.values[index] * placement.visibleSolidAngleSteradians) < 1e-15), 'Direct illumination is source radiance times visible disk solid angle without a reference-distance scale.');
		assert(support.classification === 'inside-support' && support.entryDistance.value > 0 && outside.classification === 'outside-support', 'Geometry owns exact finite ray/body support classification.');
		assert(JSON.stringify(source.describeStaticIdentity()) === JSON.stringify(source.describeStaticIdentity()) && source.buildCacheFragments()[0].sourceRadiance.contentHash === surfaceRadiance.contentHash, 'Source static identity and cache fragment retain configured radiance independent of placement.');
		assert(translated.transformFingerprint !== placement.transformFingerprint && translatedIllumination.values[0] < illumination.values[0], 'Horizontal orbit translation refreshes live geometry placement and produces natural solid-angle falloff without changing the source definition.');
		const negativeControls = [
			await rejects(() => new FiniteLocalSunCelestialSource({ sourceId: 'bad', surfaceRadiance, radius: distance(0), spectralBasis: NATIVE_15_SPECTRAL_BASIS })),
			await rejects(() => geometry.resolveFiniteCelestialBodyPlacement({ sourceId: source.sourceId, receiverPosition: position(center), centerPosition: position(center), radius: source.radius })),
			await rejects(() => source.resolveDirectIllumination({ sourceId: 'other', visibleSolidAngleSteradians: 1 })),
		];
		assert(negativeControls.every(Boolean), 'Invalid radius, receiver-inside-body, and mismatched placement reject.');
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-pre-g9-flat-local-finite-sun-contract-proof.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'],
		});
		const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = {
			proofId: 'pre-g9-flat-local-finite-sun-contract-v1',
			accepted: true,
			assertions,
			negativeControlCount: negativeControls.length,
			placement,
			translatedPlacement: translated,
			containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length },
		};
		await run.writeJsonArtifact('evidence/flat-local-finite-sun-contract.json', proof);
		await run.writeJsonArtifact('evidence/fixture.json', { fixtureSha256: `sha256:${await sha256File(FIXTURE_PATH)}` });
		const manifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, assertionCount: assertions.length, negativeControlCount: negativeControls.length }, report: `# ${run.runId}: flat/local finite-Sun contract proof\n\nConclusion: **accepted**\n\n- Assertions: ${assertions.length}/${assertions.length} accepted.\n- Negative controls: ${negativeControls.length}/${negativeControls.length} rejected.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: flat/local finite-Sun contract proof\n\nConclusion: **failed**\n\n${detail.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
