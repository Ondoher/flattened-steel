#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	createSanJoseNauticalPocBuildRequest,
	expressCanonicalDirectionInUenFrame,
	expressUenDirectionInCanonicalFrame,
	resolveW39Stencil,
	SAN_JOSE_NAUTICAL_SCENE,
} from '../san-jose-nautical-cache-poc/index.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256,
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

const COMMAND =
	'node scripts/extraterrestrial/solar-zenith-cache/runners/'
	+ 'run-san-jose-nautical-zp1-input-domains.js';
const RUNNER_RELATIVE_PATH =
	'solar-zenith-cache/runners/run-san-jose-nautical-zp1-input-domains.js';
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

function maximumUnitLengthError(vectors) {
	return vectors.reduce(
		(maximum, vector) => Math.max(
			maximum,
			Math.abs(Math.hypot(...vector) - 1),
		),
		0,
	);
}

function maximumVectorDelta(left, right) {
	return Math.max(
		Math.abs(left[0] - right[0]),
		Math.abs(left[1] - right[1]),
		Math.abs(left[2] - right[2]),
	);
}

function summarizeDomains(buildRequest) {
	const domains = buildRequest.transportSpec.domains;
	const scenePage = buildRequest.scenePageRequests[0];
	const incoming = domains.incoming;
	let reflectionMismatchCount = 0;
	for (let ordinaryIndex = 0;
		ordinaryIndex < incoming.provenance.ordinaryDirectionCount;
		ordinaryIndex += 1) {
		const original = incoming.unitVectors[ordinaryIndex * 2];
		const reflected = incoming.unitVectors[ordinaryIndex * 2 + 1];
		if (original[0] !== reflected[0]
			|| original[1] !== -reflected[1]
			|| original[2] !== reflected[2]) {
			reflectionMismatchCount += 1;
		}
	}
	const incomingWeightTotalSteradians =
		incoming.integrationWeightsSteradians.reduce(
			(sum, weight) => sum + weight,
			0,
		);
	const frame = scenePage.canonicalFrame;
	const sourceCanonical = expressUenDirectionInCanonicalFrame(
		frame,
		SAN_JOSE_NAUTICAL_SCENE.directionToSourceUpEastNorth,
	);
	const sourceRoundTrip = expressCanonicalDirectionInUenFrame(
		frame,
		sourceCanonical,
	);
	const exactCenterStencils = Object.fromEntries(
		Object.entries(domains.outgoing.positiveFaceCenterIndices).map(
			([name, index]) => [
				name,
				resolveW39Stencil(domains.outgoing.unitVectors[index]),
			],
		),
	);

	return {
		position: {
			id: domains.position.id,
			count: domains.position.count,
			firstAltitudeMeters: domains.position.nodes[0].altitudeMeters,
			firstInteriorAltitudeMeters: domains.position.nodes[1].altitudeMeters,
			lastAltitudeMeters: domains.position.nodes.at(-1).altitudeMeters,
			nodesSha256: sha256(JSON.stringify(domains.position.nodes)),
		},
		solarZenith: {
			id: domains.solarZenith.id,
			count: domains.solarZenith.count,
			firstCenterDegrees: domains.solarZenith.firstCenterDegrees,
			lastCenterDegrees: domains.solarZenith.lastCenterDegrees,
			nodesSha256: sha256(JSON.stringify(domains.solarZenith.nodes)),
		},
		incoming: {
			id: incoming.id,
			directionCount: incoming.directionCount,
			reflectionMismatchCount,
			incomingWeightTotalSteradians,
			totalWeightErrorSteradians:
				Math.abs(incomingWeightTotalSteradians - 4 * Math.PI),
			maximumUnitLengthError: maximumUnitLengthError(
				incoming.unitVectors,
			),
			vectorsSha256: sha256(JSON.stringify(incoming.unitVectors)),
			weightsSha256: sha256(JSON.stringify(
				incoming.integrationWeightsSteradians,
			)),
		},
		solverOutgoing: {
			id: domains.outgoing.id,
			frame: domains.outgoing.frame,
			faceWidth: domains.outgoing.faceWidth,
			directionCount: domains.outgoing.directionCount,
			maximumUnitLengthError: maximumUnitLengthError(
				domains.outgoing.unitVectors,
			),
			vectorsSha256: sha256(JSON.stringify(domains.outgoing.unitVectors)),
			exactCenterStencils,
		},
		scenePageOutgoing: {
			id: scenePage.domains.outgoing.id,
			frame: scenePage.domains.outgoing.frame,
			faceWidth: scenePage.domains.outgoing.faceWidth,
			directionCount: scenePage.domains.outgoing.directionCount,
			vectorsSha256: sha256(JSON.stringify(
				scenePage.domains.outgoing.unitVectors,
			)),
		},
		spectrum: {
			id: domains.spectrum.id,
			channelCount: domains.spectrum.channelCount,
			firstCenterNanometers:
				domains.spectrum.channels[0].centerNanometers,
			lastCenterNanometers:
				domains.spectrum.channels.at(-1).centerNanometers,
			channelsSha256: sha256(JSON.stringify(domains.spectrum.channels)),
		},
		canonicalFrame: {
			id: frame.id,
			solarElevationDegrees: frame.solarElevationDegrees,
			solarZenithDegrees: frame.solarZenithDegrees,
			sourceCanonical,
			sourceRoundTripMaximumDelta: maximumVectorDelta(
				sourceRoundTrip,
				SAN_JOSE_NAUTICAL_SCENE.directionToSourceUpEastNorth,
			),
		},
		inventory: {
			solverJStateCountPerWavelength:
				domains.position.count
				* domains.solarZenith.count
				* domains.outgoing.directionCount,
			solverLStateCountPerWavelength:
				domains.position.count
				* domains.solarZenith.count
				* domains.incoming.directionCount,
			scenePageSpectrumCount: scenePage.storage.logicalSpectrumCount,
			scenePageScalarCount: scenePage.storage.scalarCount,
			scenePageLogicalBytes: scenePage.storage.logicalBytes,
		},
	};
}

function createIncrementalInterfaceProbeScene() {
	return Object.freeze({
		...SAN_JOSE_NAUTICAL_SCENE,
		id: 'sunset-plus-one-hour-incremental-interface-probe',
	});
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'san-jose-nautical-zp1-input-domains',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-nautical-zp1-input-domains-input-v1',
			workPackage: 'ZP1',
			claimBoundary:
				'lane-local scene, domain, transport-spec, canonical-frame, and ordered-page request execution only; no atmosphere solve, cache payload, render, accuracy, resource, or production claim',
			expectedCounts: {
				position: 48,
				solarZenith: 180,
				incoming: 68,
				outgoing: 9126,
				wavelength: 15,
			},
		},
		provenance: {
			schemaId: 'san-jose-nautical-zp1-input-domains-provenance-v1',
			operation:
				'construct lane-local executable Native48, solar-zenith-180, reflected F68, frame-distinct W39, Native15, ozone-enabled transport, canonical observer/Sun frame, and ordered scene-page requests; enumerate and hash their finite state without importing production or historical candidate code',
			implementationRoot:
				'scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc',
			runner: `scripts/extraterrestrial/${RUNNER_RELATIVE_PATH}`,
		},
		environment: {
			schemaId: 'san-jose-nautical-zp1-input-domains-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		references: {
			schemaId: 'san-jose-nautical-zp1-input-domains-references-v1',
			pocPlan:
				'agents/topics/algorithm32/cache/solar-zenith-cache-poc-plan.md',
			laneContract:
				'scripts/extraterrestrial/solar-zenith-cache/san-jose-nautical-cache-poc/lane-contract.json',
			parentSceneRun:
				'000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
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
			assertNoReparseEntries(
				EXPERIMENT_ROOT,
				'Experiment source/control tree',
			),
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
		const batchedRequest = createSanJoseNauticalPocBuildRequest({
			additionalScenePageDefinitions: [{
				id: 'incremental-interface-probe-page-v1',
				scene: createIncrementalInterfaceProbeScene(),
			}],
		});
		const summary = summarizeDomains(buildRequest);
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
			&& pocPolicy.implementationRoot
				=== `scripts/extraterrestrial/${LANE_ROOT_RELATIVE_PATH}`
			&& pocPolicy.productionComparisonAccess === 'read-only'
			&& pocPolicy.unitTestTree === 'prohibited',
			'Parent and POC containment policies authorize this lane without a unit-test tree.',
		);
		check(
			laneContract.laneId
				=== 'algorithm32-san-jose-nautical-actual-point-cache-poc-v1'
			&& laneContract.physicalModel.maximumScatteringOrder === 4,
			'Lane contract selects the fixed actual-point N4 POC family.',
		);
		check(
			summary.position.count === 48
			&& summary.position.firstAltitudeMeters === 0
			&& summary.position.firstInteriorAltitudeMeters === 1875
			&& summary.position.lastAltitudeMeters === 59375,
			'Lane-local Native48 has the exact boundary and retained altitude nodes.',
		);
		check(
			summary.solarZenith.count === 180
			&& summary.solarZenith.firstCenterDegrees === 0.5
			&& summary.solarZenith.lastCenterDegrees === 179.5,
			'Complete provisional construction support has 180 one-degree solar-zenith centers.',
		);
		check(
			summary.incoming.directionCount === 68
			&& summary.incoming.reflectionMismatchCount === 0
			&& summary.incoming.totalWeightErrorSteradians <= 2e-14
			&& summary.incoming.maximumUnitLengthError <= 3e-16,
			'Reflection-completed F68 retains exact pairs, unit vectors, and full-sphere weights.',
		);
		check(
			summary.solverOutgoing.faceWidth === 39
			&& summary.solverOutgoing.directionCount === 9126
			&& summary.solverOutgoing.maximumUnitLengthError <= 1e-12,
			'Lane-local W39 generates 9,126 finite unit nodes in the retained lattice.',
		);
		check(
			Object.values(summary.solverOutgoing.exactCenterStencils)
				.every((stencil) =>
					stencil.indices.length === 1
					&& stencil.weights.length === 1
					&& stencil.weights[0] === 1),
			'Lane-local W39 resolves every positive face center to one exact unit-weight tap.',
		);
		check(
			summary.solverOutgoing.id !== summary.scenePageOutgoing.id
			&& summary.solverOutgoing.frame !== summary.scenePageOutgoing.frame
			&& summary.solverOutgoing.vectorsSha256
				=== summary.scenePageOutgoing.vectorsSha256,
			'Solver and scene-page W39 lattices share nodes but retain distinct physical identities.',
		);
		check(
			summary.spectrum.channelCount === 15
			&& summary.spectrum.firstCenterNanometers
				=== 375.6666666666667
			&& summary.spectrum.lastCenterNanometers
				=== 814.3333333333333,
			'Native15 retains all 15 exact bin-average centers and source channels.',
		);
		check(
			Math.abs(
				summary.canonicalFrame.solarElevationDegrees
				- SAN_JOSE_NAUTICAL_SCENE.solarElevationDegrees,
			) <= 1e-12
			&& Math.abs(summary.canonicalFrame.sourceCanonical[1]) <= 1e-15
			&& summary.canonicalFrame.sourceRoundTripMaximumDelta <= 2e-16,
			'Observer/Sun canonical frame reproduces solar elevation, removes source cross-axis, and round-trips.',
		);
		check(
			summary.inventory.solverJStateCountPerWavelength === 78848640
			&& summary.inventory.solverLStateCountPerWavelength === 587520
			&& summary.inventory.scenePageSpectrumCount === 438048
			&& summary.inventory.scenePageScalarCount === 6570720
			&& summary.inventory.scenePageLogicalBytes === 26282880,
			'ZP1 deterministically enumerates solver and final scene-page logical state counts.',
		);
		check(
			buildRequest.scenePageRequests.length === 1
			&& batchedRequest.scenePageRequests.length === 2
			&& batchedRequest.scenePageRequests[0].id
				=== buildRequest.scenePageRequests[0].id
			&& batchedRequest.scenePageRequests[1].id
				=== 'incremental-interface-probe-page-v1',
			'One-page and incremental multi-page requests use the same ordered builder interface.',
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
		assertFileInventoriesEqual(
			flat32Before,
			flat32After,
			'Flat32 production inventory',
		);
		check(
			closure.files.length > 0,
			'Static module closure remains inside the extraterrestrial experiment.',
		);
		check(
			algorithm32Before.aggregateSha256
				=== algorithm32After.aggregateSha256
			&& flat32Before.aggregateSha256 === flat32After.aggregateSha256,
			'Algorithm32 and Flat32 remain byte-identical across ZP1 execution.',
		);

		const evidence = {
			schemaId: 'san-jose-nautical-zp1-input-domains-evidence-v1',
			workPackage: 'ZP1',
			accepted: true,
			claimBoundary:
				'lane-local inputs and deterministic state enumeration only; no transport or appearance claim',
			assertions,
			buildRequest: {
				id: buildRequest.id,
				transportSpecId: buildRequest.transportSpec.id,
				scenePageRequestIds:
					buildRequest.scenePageRequests.map((page) => page.id),
				recurrence: buildRequest.transportSpec.recurrence,
				numerical: buildRequest.transportSpec.numerical,
				storedSemantic: buildRequest.transportSpec.storedSemantic,
			},
			domains: summary,
			incrementalInterface: {
				batchedRequestId: batchedRequest.id,
				pageIds: batchedRequest.scenePageRequests.map((page) => page.id),
			},
			identities: {
				parentPolicySha256: await sha256File(PARENT_POLICY_PATH),
				pocPolicySha256: await sha256File(POC_POLICY_PATH),
				laneContractSha256: await sha256File(LANE_CONTRACT_PATH),
				algorithm32AggregateSha256:
					algorithm32After.aggregateSha256,
				flat32AggregateSha256: flat32After.aggregateSha256,
			},
			containment: {
				closureFileCount: closure.files.length,
				closureEdgeCount: closure.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/zp1-input-domains.json', evidence);
		const terminalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				workPackage: 'ZP1',
				accepted: true,
				assertionCount: assertions.length,
				solverJStateCountPerWavelength:
					summary.inventory.solverJStateCountPerWavelength,
				scenePageLogicalBytes:
					summary.inventory.scenePageLogicalBytes,
			},
			report: `# ${run.runId}: Solar-zenith cache POC ZP1\n\n`
				+ `Conclusion: **accepted**.\n\n`
				+ `- Assertions: ${assertions.length}/${assertions.length}.\n`
				+ `- Solver J states per wavelength: ${summary.inventory.solverJStateCountPerWavelength}.\n`
				+ `- Final scene-page logical bytes: ${summary.inventory.scenePageLogicalBytes}.\n`
				+ `- Claim: lane-local inputs and deterministic domain enumeration only; no transport or appearance result.\n`,
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
				result: {workPackage: 'ZP1', accepted: false, error: serialized},
				report: `# ${run.runId}: Solar-zenith cache POC ZP1\n\n`
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
				finalizationError:
					finalizationError instanceof Error
						? finalizationError.message
						: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
