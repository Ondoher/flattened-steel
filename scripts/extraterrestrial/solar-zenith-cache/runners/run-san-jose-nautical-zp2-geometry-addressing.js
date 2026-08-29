#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	createDirectQueryPacket,
	createProjectionQueryPacket,
	createSanJoseNauticalPocBuildRequest,
	createTransportQueryPacket,
	resolveAtmosphereBranch,
	resolveDistantSourceVisibility,
	splitAtmosphereBranch,
} from '../san-jose-nautical-cache-poc/index.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {
	CONTAINMENT_POLICY_PATH,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/solar-zenith-cache/runners/'
	+ 'run-san-jose-nautical-zp2-geometry-addressing.js';
const RUNNER_RELATIVE_PATH =
	'solar-zenith-cache/runners/run-san-jose-nautical-zp2-geometry-addressing.js';
const LANE_ROOT_RELATIVE_PATH =
	'solar-zenith-cache/san-jose-nautical-cache-poc';
const LANE_ROOT = path.join(EXPERIMENT_ROOT, LANE_ROOT_RELATIVE_PATH);
const PARENT_POLICY_PATH = path.join(
	EXPERIMENT_ROOT,
	'solar-zenith-cache',
	'containment-policy.json',
);
const POC_POLICY_PATH = path.join(LANE_ROOT, 'containment-policy.json');
const LANE_CONTRACT_PATH = path.join(LANE_ROOT, 'lane-contract.json');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function stencilWeight(stencil) {
	return stencil.weights.reduce((sum, weight) => sum + weight, 0);
}

function maximumStencilWeightError(packet) {
	return packet.samples.reduce((maximum, sample) => Math.max(
		maximum,
		Math.abs(stencilWeight(sample.state.stencils.altitude) - 1),
		Math.abs(stencilWeight(sample.state.stencils.solarZenith) - 1),
		Math.abs(stencilWeight(sample.state.stencils.outgoing) - 1),
	), 0);
}

function summarizePacket(packet) {
	const summary = {
		kind: packet.kind,
		valid: packet.valid,
	};
	if (packet.branch) {
		summary.branch = {
			lengthMeters: packet.branch.lengthMeters,
			boundary: packet.branch.boundary,
		};
	}
	if (packet.split) summary.events = packet.split.events;
	if (packet.samples) {
		summary.sampleCount = packet.samples.length;
		summary.firstSample = packet.samples[0];
		summary.lastSample = packet.samples.at(-1);
	}
	return summary;
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'san-jose-nautical-zp2-geometry-addressing',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-nautical-zp2-geometry-addressing-input-v1',
			workPackage: 'ZP2',
			claimBoundary:
				'actual-point spherical geometry, event splitting, coordinate frames, lookup stencils, and direct/transport/projection query packets only; no spectral transport values, GPU passes, cache payload, render, accuracy, or production claim',
		},
		provenance: {
			schemaId: 'san-jose-nautical-zp2-geometry-addressing-provenance-v1',
			operation:
				'construct lane-local analytic spherical branch and visibility controls; exercise representative direct, J-to-L transport, and scene-page projection packets over the accepted ZP1 domains',
			implementationRoot:
				'scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc',
			runner: `scripts/extraterrestrial/${RUNNER_RELATIVE_PATH}`,
		},
		environment: {
			schemaId: 'san-jose-nautical-zp2-geometry-addressing-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		references: {
			schemaId: 'san-jose-nautical-zp2-geometry-addressing-references-v1',
			zp1Run: '000502-san-jose-nautical-zp1-input-domains',
			pocPlan:
				'agents/topics/algorithm32/cache/solar-zenith-cache-poc-plan.md',
			laneContract:
				'scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/lane-contract.json',
			transportDirectionConvention:
				'src/algorithm32/atmospheric-transport/scattering-density-transport.js',
		},
	});

	try {
		await assertRepositoryIdentity();
		await Promise.all([
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				CONTAINMENT_POLICY_PATH,
				'shared containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				PARENT_POLICY_PATH,
				'solar-zenith containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				POC_POLICY_PATH,
				'POC containment policy',
			),
			assertExistingRealPathContained(
				EXPERIMENT_ROOT,
				LANE_CONTRACT_PATH,
				'POC lane contract',
			),
			assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree'),
		]);
		const [
			parentPolicyText,
			pocPolicyText,
			laneContractText,
			algorithm32Before,
			flat32Before,
		] = await Promise.all([
			readFile(PARENT_POLICY_PATH, 'utf8'),
			readFile(POC_POLICY_PATH, 'utf8'),
			readFile(LANE_CONTRACT_PATH, 'utf8'),
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		const parentPolicy = JSON.parse(parentPolicyText);
		const pocPolicy = JSON.parse(pocPolicyText);
		const laneContract = JSON.parse(laneContractText);
		const buildRequest = createSanJoseNauticalPocBuildRequest();
		const spec = buildRequest.transportSpec;
		const page = buildRequest.scenePageRequests[0];
		const bottom = spec.planet.bottomRadiusMeters;
		const top = spec.planet.topRadiusMeters;
		const observerPoint = [0, 0, bottom + page.observer.heightMeters];
		const source = page.canonicalFrame.directionToSourceCanonical;
		const assertions = [];
		const check = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};

		check(
			parentPolicy.policyId
				=== 'algorithm32-solar-zenith-cache-contained-lane-v1'
			&& pocPolicy.policyId
				=== 'algorithm32-san-jose-nautical-actual-point-cache-poc-contained-lane-v1'
			&& pocPolicy.productionComparisonAccess === 'read-only'
			&& pocPolicy.unitTestTree === 'prohibited',
			'Containment permits focused proof execution while production and historical evidence remain read-only.',
		);
		check(
			laneContract.physicalModel.actualPointTransport
				=== 'required through J1-J4',
			'The lane contract retains the required actual-point transport through J1-J4.',
		);

		const upward = resolveAtmosphereBranch({
			origin: observerPoint,
			direction: [0, 0, 1],
			bottomRadiusMeters: bottom,
			topRadiusMeters: top,
		});
		const downward = resolveAtmosphereBranch({
			origin: observerPoint,
			direction: [0, 0, -1],
			bottomRadiusMeters: bottom,
			topRadiusMeters: top,
		});
		const horizontal = resolveAtmosphereBranch({
			origin: observerPoint,
			direction: [1, 0, 0],
			bottomRadiusMeters: bottom,
			topRadiusMeters: top,
		});
		check(
			upward.valid && upward.boundary.kind === 'atmosphere-top'
			&& Math.abs(upward.lengthMeters - (top - bottom - 1.7)) <= 1e-7
			&& downward.valid && downward.boundary.kind === 'ground'
			&& Math.abs(downward.lengthMeters - 1.7) <= 1e-7,
			'Radial observer rays terminate at the exact atmosphere-top and ground distances.',
		);
		check(
			horizontal.valid && horizontal.boundary.kind === 'atmosphere-top'
			&& Math.abs(
				horizontal.lengthMeters
				- Math.sqrt(top * top - (bottom + 1.7) ** 2),
			) <= 1e-7,
			'Horizontal spherical traversal reaches the atmosphere top at the analytic limb distance.',
		);
		const groundInward = resolveAtmosphereBranch({
			origin: [0, 0, bottom],
			direction: [0, 0, -1],
			bottomRadiusMeters: bottom,
			topRadiusMeters: top,
		});
		const topOutward = resolveAtmosphereBranch({
			origin: [0, 0, top],
			direction: [0, 0, 1],
			bottomRadiusMeters: bottom,
			topRadiusMeters: top,
		});
		check(
			groundInward.valid === false
			&& groundInward.reason === 'direction-enters-ground-at-origin'
			&& topOutward.valid === false
			&& topOutward.reason === 'direction-exits-atmosphere-at-origin',
			'Zero-distance ground-entry and atmosphere-exit rays are rejected instead of selecting a far-side sphere root.',
		);

		const observerVisibility = resolveDistantSourceVisibility({
			point: observerPoint,
			directionToSource: source,
			bottomRadiusMeters: bottom,
		});
		const horizontalSplit = splitAtmosphereBranch({
			branch: horizontal,
			directionToSource: source,
			bottomRadiusMeters: bottom,
		});
		const visibilityEvent = horizontalSplit.events.find(
			(event) => event.kind === 'source-visibility',
		);
		check(
			observerVisibility.visible === false
			&& visibilityEvent?.visibleBefore === false
			&& visibilityEvent?.visibleAfter === true
			&& visibilityEvent.distanceMeters > 0
			&& visibilityEvent.distanceMeters < horizontal.lengthMeters,
			'The retained nautical observer is Earth-shadowed and its source-facing horizon branch crosses into sunlight before atmosphere exit.',
		);

		const tangentDirection = [Math.sqrt(1 - 0.05 ** 2), 0, -0.05];
		const tangentBranch = resolveAtmosphereBranch({
			origin: [0, 0, bottom + 30000],
			direction: tangentDirection,
			bottomRadiusMeters: bottom,
			topRadiusMeters: top,
		});
		const tangentSplit = splitAtmosphereBranch({
			branch: tangentBranch,
			directionToSource: [1, 0, 0],
			bottomRadiusMeters: bottom,
		});
		const tangentEvent = tangentSplit.events.find(
			(event) => event.kind === 'radial-tangent',
		);
		check(
			tangentBranch.boundary.kind === 'atmosphere-top'
			&& Math.abs(tangentEvent?.distanceMeters - 319500) <= 1e-7
			&& tangentSplit.segments.length === 2,
			'A non-ground-crossing descending ray splits exactly at its interior radial tangent.',
		);

		const directDay = createDirectQueryPacket({
			buildRequest,
			positionIndex: 0,
			solarZenithIndex: 0,
			outgoingDirectionIndex: 0,
		});
		const directNight = createDirectQueryPacket({
			buildRequest,
			positionIndex: 0,
			solarZenithIndex: 179,
			outgoingDirectionIndex: 0,
		});
		check(
			directDay.valid && directNight.valid
			&& directDay.state.sourceVisibility.visible === true
			&& directNight.state.sourceVisibility.visible === false
			&& Math.abs(directDay.state.solarZenithDegrees - 0.5) <= 1e-10
			&& Math.abs(directNight.state.solarZenithDegrees - 179.5) <= 1e-10,
			'Direct query packets preserve the complete day-to-night local solar-zenith domain and exact Earth shadow.',
		);

		const transport = createTransportQueryPacket({
			buildRequest,
			positionIndex: 24,
			solarZenithIndex: 99,
			transportDirectionLocal: [1, 0, 0],
		});
		check(
			transport.valid
			&& transport.samples.length === spec.numerical.transportIntervalCount
			&& transport.branch.boundary.kind === 'atmosphere-top'
			&& transport.split.events.some((event) => event.kind === 'source-visibility')
			&& transport.samples[0].state.radiusMeters
				!== transport.samples.at(-1).state.radiusMeters
			&& transport.samples[0].state.muS
				!== transport.samples.at(-1).state.muS
			&& maximumStencilWeightError(transport) <= 2e-16,
			'Transport packets follow changing radius and local solar zenith while supplying normalized altitude, solar-zenith, and outgoing stencils.',
		);
		check(
			transport.samples.every((sample) =>
				Math.max(...sample.state.stencils.altitude.indices)
					< spec.domains.position.count
				&& Math.max(...sample.state.stencils.solarZenith.indices)
					< spec.domains.solarZenith.count
				&& Math.max(...sample.state.stencils.outgoing.indices)
					< spec.domains.outgoing.directionCount),
			'Every transport sample resolves only in-range executable field taps.',
		);

		const directions = page.domains.outgoing.unitVectors;
		const positiveZ = directions.findIndex(
			(direction) => direction[0] === 0 && direction[1] === 0 && direction[2] === 1,
		);
		const negativeZ = directions.findIndex(
			(direction) => direction[0] === 0 && direction[1] === 0 && direction[2] === -1,
		);
		const positiveX = directions.findIndex(
			(direction) => direction[0] === 1 && direction[1] === 0 && direction[2] === 0,
		);
		const zenithProjection = createProjectionQueryPacket({
			buildRequest,
			positionIndex: 47,
			outgoingDirectionIndex: positiveZ,
		});
		const horizonProjection = createProjectionQueryPacket({
			buildRequest,
			positionIndex: 47,
			outgoingDirectionIndex: positiveX,
		});
		const occludedProjection = createProjectionQueryPacket({
			buildRequest,
			positionIndex: 47,
			outgoingDirectionIndex: negativeZ,
		});
		check(
			zenithProjection.valid && horizonProjection.valid
			&& Math.abs(zenithProjection.altitudeMeters - 59375) <= 1e-7
			&& Math.abs(horizonProjection.altitudeMeters - 59375) <= 1e-7
			&& Math.abs(stencilWeight(horizonProjection.transportStencils.position) - 1) <= 1e-16
			&& Math.abs(stencilWeight(horizonProjection.transportStencils.solarZenith) - 1) <= 1e-16
			&& Math.abs(stencilWeight(horizonProjection.transportStencils.outgoing) - 1) <= 1e-16,
			'Scene-page projection resolves valid zenith and horizon shell points with normalized solver-field stencils.',
		);
		check(
			occludedProjection.valid === false
			&& occludedProjection.reason === 'ground-occluded-altitude-shell',
			'Scene-page projection explicitly rejects a far-side altitude-shell point hidden by Earth.',
		);
		const missingProjection = createProjectionQueryPacket({
			buildRequest,
			positionIndex: 0,
			outgoingDirectionIndex: positiveZ,
		});
		check(
			missingProjection.valid === false
			&& missingProjection.reason === 'no-forward-altitude-shell-intersection',
			'The rectangular page records a distinct invalid state when a forward shell intersection does not exist.',
		);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [RUNNER_RELATIVE_PATH],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process',
				'node:crypto',
				'node:fs',
				'node:fs/promises',
				'node:module',
				'node:os',
				'node:path',
				'node:url',
				'node:util',
			],
		});
		const [algorithm32After, flat32After] = await Promise.all([
			createFileInventory(PRODUCTION_SOURCE_ROOT),
			createFileInventory(FLAT32_ROOT),
		]);
		assertFileInventoriesEqual(
			algorithm32Before,
			algorithm32After,
			'Algorithm32 production inventory',
		);
		assertFileInventoriesEqual(flat32Before, flat32After, 'Flat32 production inventory');
		check(
			closure.files.length > 0
			&& algorithm32Before.aggregateSha256 === algorithm32After.aggregateSha256
			&& flat32Before.aggregateSha256 === flat32After.aggregateSha256,
			'ZP2 module closure is contained and production inventories remain byte-identical.',
		);

		const evidence = {
			schemaId: 'san-jose-nautical-zp2-geometry-addressing-evidence-v1',
			workPackage: 'ZP2',
			accepted: true,
			claimBoundary:
				'actual-point geometry and transport addressing only; no spectral value or appearance claim',
			assertions,
			geometry: {
				observerPoint,
				upward,
				downward,
				horizontal,
				observerVisibility,
				horizontalSplit,
				tangentSplit,
			},
			packets: {
				directDay: summarizePacket(directDay),
				directNight: summarizePacket(directNight),
				transport: summarizePacket(transport),
				zenithProjection,
				horizonProjection,
				occludedProjection,
				missingProjection,
			},
			identities: {
				parentPolicySha256: await sha256File(PARENT_POLICY_PATH),
				pocPolicySha256: await sha256File(POC_POLICY_PATH),
				laneContractSha256: await sha256File(LANE_CONTRACT_PATH),
				algorithm32AggregateSha256: algorithm32After.aggregateSha256,
				flat32AggregateSha256: flat32After.aggregateSha256,
			},
			containment: {
				closureFileCount: closure.files.length,
				closureEdgeCount: closure.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/zp2-geometry-addressing.json', evidence);
		const terminalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				workPackage: 'ZP2',
				accepted: true,
				assertionCount: assertions.length,
				horizonSourceVisibilityTransitionMeters:
					visibilityEvent.distanceMeters,
				transportSampleCount: transport.samples.length,
			},
			report: `# ${run.runId}: Solar-zenith cache POC ZP2\n\n`
				+ 'Conclusion: **accepted**.\n\n'
				+ `- Assertions: ${assertions.length}/${assertions.length}.\n`
				+ `- San Jose horizontal shadow-to-sun transition: ${visibilityEvent.distanceMeters} m.\n`
				+ `- Transport query samples: ${transport.samples.length}.\n`
				+ '- Claim: actual-point geometry and transport addressing only; no spectral transport or appearance result.\n',
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: terminalManifest.artifactSetSha256,
			assertionCount: assertions.length,
		}, null, 2)}\n`);
	} catch (error) {
		const serialized = {
			name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminalManifest = await run.finalize({
				conclusion: 'failed',
				result: {workPackage: 'ZP2', accepted: false, error: serialized},
				report: `# ${run.runId}: Solar-zenith cache POC ZP2\n\n`
					+ `Conclusion: **failed**.\n\n${serialized.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: terminalManifest.artifactSetSha256,
				error: serialized,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'partial-unfinalized',
				error: serialized,
				finalizationError: finalizationError instanceof Error
					? finalizationError.message
					: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
