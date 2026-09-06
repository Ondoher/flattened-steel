#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	BRIGHT_STAR_CATALOG_V50,
	canonicalDirectionFromCatalogCoordinate,
	parseBrightStarCatalogV50,
	selectBrightestBrightStarCatalogMembers,
} from '../catalogs/bright-star-catalog-v50.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {
	STELLAR_CATALOG_FRAME_ID,
	STELLAR_PROJECTION_CLASSIFICATIONS,
	STELLAR_SCREEN_PROJECTION_CONTRACT,
} from '../stellar-screen-palette/contracts.js';
import {
	_test as placementTestSupport,
	equatorialMeanOfDateToLocalEnu,
	greenwichMeanSiderealTimeRadians,
	precessFk5J2000ToMeanOfDate,
	resolveCatalogDirectionAtObservation,
} from '../stellar-screen-palette/CelestialPlacementTransform.js';
import {
	createPerspectiveCameraContract,
	projectCatalogMembers,
	projectLocalDirectionToPixel,
} from '../stellar-screen-palette/StellarScreenProjector.js';
import {FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE} from '../stellar-screen-palette/fixed-san-jose-fixture.js';

const COMMAND =
	'node experiments/extraterrestrial/runners/run-stellar-screen-palette-projection-proof.js';
const CATALOG_PATH = path.join(
	EXPERIMENT_ROOT,
	'catalogs',
	'bright-star-catalog-v50.tsv',
);
const RECONCILIATION_PATH = path.join(
	EXPERIMENT_ROOT,
	'stellar-screen-palette',
	'reconciliation.md',
);
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const TWO_PI = 2 * Math.PI;

function requireCondition(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function angularDifference(left, right) {
	const raw = Math.abs(left - right) % TWO_PI;
	return Math.min(raw, TWO_PI - raw);
}

function vectorDistance(left, right) {
	return Math.hypot(...left.map((value, index) => value - right[index]));
}

function alternateGmstRadians(julianDate) {
	const daysSinceJ2000 = julianDate - 2451545.0;
	const hours = 18.697375 + 24.065709824279 * daysSinceJ2000;
	const radians = (hours * Math.PI / 12) % TWO_PI;
	return radians < 0 ? radians + TWO_PI : radians;
}

function alternateLocalEnu(meanOfDateDirection, latitude, longitude, gmst) {
	const rightAscension = Math.atan2(meanOfDateDirection[1], meanOfDateDirection[0]);
	const declination = Math.asin(meanOfDateDirection[2]);
	const terrestrialLongitude = rightAscension - gmst;
	const terrestrial = [
		Math.cos(declination) * Math.cos(terrestrialLongitude),
		Math.cos(declination) * Math.sin(terrestrialLongitude),
		Math.sin(declination),
	];
	const east = [-Math.sin(longitude), Math.cos(longitude), 0];
	const north = [
		-Math.sin(latitude) * Math.cos(longitude),
		-Math.sin(latitude) * Math.sin(longitude),
		Math.cos(latitude),
	];
	const up = [
		Math.cos(latitude) * Math.cos(longitude),
		Math.cos(latitude) * Math.sin(longitude),
		Math.sin(latitude),
	];
	const dot = (left, right) =>
		left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	return [dot(terrestrial, east), dot(terrestrial, north), dot(terrestrial, up)];
}

async function inventoryProduction() {
	const [algorithm32, flat32] = await Promise.all([
		createFileInventory(ALGORITHM32_ROOT),
		createFileInventory(FLAT32_ROOT),
	]);
	return {algorithm32, flat32};
}

function acceptedReport(runId, proof) {
	return [
		`# ${runId}: Stellar screen-palette projection proof`,
		'',
		'Conclusion: **accepted**',
		'',
		`- Catalog members classified: ${proof.memberCount}.`,
		`- Occupied projections: ${proof.classificationCounts['occupied-pixel']}.`,
		`- Off-frame projections: ${proof.classificationCounts['off-frame']}.`,
		`- Below-horizon projections: ${proof.classificationCounts['below-horizon']}.`,
		`- Assertions: ${proof.assertions.length}.`,
		`- Negative controls rejected: ${proof.negativeControls.length}.`,
		'',
		'This proof accepts Work Plan steps 1 and 2 only: the contained contract reconciliation and fixed-observation catalog-to-pixel transform. It does not construct the Uint16 matrix or spectral palette, upload GPU resources, connect atmosphere composition, or render.',
		'',
	].join('\n');
}

async function rejects(operation) {
	try {
		await operation();
	} catch {
		return true;
	}
	return false;
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The stellar projection proof accepts no command-line arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'stellar-screen-palette-fixed-observation-projection-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'stellar-screen-palette-projection-proof-inputs-v1',
			catalog: 'experiments/extraterrestrial/catalogs/bright-star-catalog-v50.tsv',
			selectedCount: 500,
			fixture: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE,
			contract: STELLAR_SCREEN_PROJECTION_CONTRACT,
		},
		provenance: {
			schemaId: 'stellar-screen-palette-projection-proof-provenance-v1',
			catalog: BRIGHT_STAR_CATALOG_V50,
			implementation: 'experiments/extraterrestrial/stellar-screen-palette',
			reconciliation: 'experiments/extraterrestrial/stellar-screen-palette/reconciliation.md',
		},
		environment: {
			schemaId: 'stellar-screen-palette-projection-proof-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
		},
		references: {
			schemaId: 'stellar-screen-palette-projection-proof-references-v1',
			canonicalDesign: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md',
			precession: 'https://aa.usno.navy.mil/publications/Circular_179',
			siderealTime: 'https://aa.usno.navy.mil/faq/GAST',
			sofaModelContext: 'https://www.iausofa.org/current-software',
		},
	});

	try {
		await assertRepositoryIdentity();
		const [, productionBefore] = await Promise.all([
			assertNoReparseEntries(
				path.join(EXPERIMENT_ROOT, 'stellar-screen-palette'),
				'Stellar screen-palette implementation tree',
			),
			inventoryProduction(),
			assertExistingRealPathContained(EXPERIMENT_ROOT, CATALOG_PATH, 'catalog input'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, RECONCILIATION_PATH, 'reconciliation input'),
		]);
		const [catalogSha256, reconciliationSha256, catalogText] = await Promise.all([
			sha256File(CATALOG_PATH),
			sha256File(RECONCILIATION_PATH),
			readFile(CATALOG_PATH, 'utf8'),
		]);
		requireCondition(
			`sha256:${catalogSha256}` === BRIGHT_STAR_CATALOG_V50.sourceSha256,
			'Bright Star Catalog source checksum changed.',
		);

		const selected = selectBrightestBrightStarCatalogMembers(
			parseBrightStarCatalogV50(catalogText),
			500,
		);
		const members = selected.map((member) => Object.freeze({
			id: member.memberId,
			direction: canonicalDirectionFromCatalogCoordinate(member),
		}));
		const camera = createPerspectiveCameraContract(
			FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera,
		);
		const request = {
			members,
			catalogFrameId: STELLAR_CATALOG_FRAME_ID,
			observation: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation,
			camera,
		};
		const projected = projectCatalogMembers(request);
		const replay = projectCatalogMembers(request);
		const assertions = [];
		const assert = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};

		assert(members.length === 500, 'The contained checked catalog selects exactly 500 members.');
		assert(new Set(members.map((member) => member.id)).size === 500, 'All selected member identities are unique.');
		assert(
			members.every((member) => Math.abs(Math.hypot(...member.direction) - 1) <= 2e-15),
			'Every canonical FK5/J2000 member direction is unit length.',
		);
		assert(projected.length === 500, 'Every catalog member receives exactly one projection classification.');
		assert(
			projected.every((result, index) =>
				result.memberIndex === index && result.memberId === members[index].id),
			'Projection preserves canonical member order and identity.',
		);
		assert(
			projected.every((result) =>
				result.classification !== STELLAR_PROJECTION_CLASSIFICATIONS.INVALID
				&& result.classification !== STELLAR_PROJECTION_CLASSIFICATIONS.UNSUPPORTED),
			'All 500 members are valid and supported by the fixed first profile.',
		);
		assert(
			projected.every((result) =>
				result.placement === undefined
				|| Math.abs(Math.hypot(...result.placement.localDirectionEastNorthUp) - 1) <= 2e-15),
			'Every resolved local ENU direction remains unit length.',
		);
		assert(
			JSON.stringify(projected) === JSON.stringify(replay),
			'The fixed transform and pixel assignment are byte-deterministic on replay.',
		);

		const classificationCounts = Object.fromEntries(
			Object.values(STELLAR_PROJECTION_CLASSIFICATIONS)
				.map((classification) => [classification, 0]),
		);
		for (const result of projected) {
			classificationCounts[result.classification] += 1;
		}
		assert(
			Object.values(classificationCounts).reduce((sum, value) => sum + value, 0) === 500,
			'Classification counts conserve all selected members.',
		);
		assert(classificationCounts['occupied-pixel'] > 0, 'The fixed camera contains projected stellar members.');
		assert(classificationCounts['off-frame'] > 0, 'Above-horizon members outside the camera are classified off-frame.');
		assert(classificationCounts['below-horizon'] > 0, 'Members below the local horizon are classified explicitly.');

		const occupied = projected.filter((result) =>
			result.classification === STELLAR_PROJECTION_CLASSIFICATIONS.OCCUPIED_PIXEL);
		assert(
			occupied.every((result) =>
				result.pixel.x >= 0
				&& result.pixel.x < camera.viewport.width
				&& result.pixel.y >= 0
				&& result.pixel.y < camera.viewport.height
				&& result.pixel.linearIndex
					=== result.pixel.y * camera.viewport.width + result.pixel.x),
			'Every occupied result obeys the top-left row-major half-open viewport contract.',
		);

		const center = projectLocalDirectionToPixel(camera.forward, camera);
		assert(
			center.classification === STELLAR_PROJECTION_CLASSIFICATIONS.OCCUPIED_PIXEL
			&& center.pixel.x === 320
			&& center.pixel.y === 200,
			'The camera forward direction maps to the declared even-viewport center pixel.',
		);
		assert(
			projectLocalDirectionToPixel([1, 0, 0], camera).classification
				=== STELLAR_PROJECTION_CLASSIFICATIONS.BELOW_HORIZON,
			'The exact geometric horizon is excluded by the positive-up policy.',
		);

		const firstPlacement = projected[0].placement;
		const alternateGmst = alternateGmstRadians(firstPlacement.julianDateUtcAsUt1);
		assert(
			angularDifference(firstPlacement.greenwichMeanSiderealTimeRadians, alternateGmst) < 2e-5,
			'The full USNO GMST equation agrees with its independent compact approximation within the declared pixel-scale tolerance.',
		);
		const alternateEnu = alternateLocalEnu(
			firstPlacement.meanOfDateDirection,
			FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation.latitudeRadians,
			FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation.longitudeRadians,
			firstPlacement.greenwichMeanSiderealTimeRadians,
		);
		assert(
			vectorDistance(alternateEnu, firstPlacement.localDirectionEastNorthUp) <= 2e-15,
			'The scalar hour-angle transform agrees with an independent terrestrial-basis projection.',
		);

		const j2000Direction = members[0].direction;
		const j2000Identity = precessFk5J2000ToMeanOfDate(j2000Direction, 2451545.0);
		assert(
			vectorDistance(j2000Direction, j2000Identity) <= 2e-15,
			'The IAU 2000 precession transform is identity at J2000.0 for the catalog vector.',
		);
		assert(
			vectorDistance(j2000Direction, firstPlacement.meanOfDateDirection) > 1e-4,
			'The 2024 fixed observation applies a material epoch precession rather than retaining an Earth-fixed J2000 vector.',
		);
		const sixHoursLater = new Date(
			Date.parse(FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation.instant)
			+ 6 * 60 * 60 * 1000,
		).toISOString();
		const laterPlacement = resolveCatalogDirectionAtObservation({
			direction: members[0].direction,
			catalogFrameId: STELLAR_CATALOG_FRAME_ID,
			observation: {
				...FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation,
				instant: sixHoursLater,
			},
		});
		assert(
			vectorDistance(
				firstPlacement.localDirectionEastNorthUp,
				laterPlacement.localDirectionEastNorthUp,
			) > 1,
			'Observation time materially rotates the local stellar placement.',
		);

		const zenithEquatorial = placementTestSupport.directionFromRightAscensionDeclination(
			firstPlacement.localMeanSiderealTimeRadians,
			FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation.latitudeRadians,
		);
		const zenithEnu = equatorialMeanOfDateToLocalEnu(
			zenithEquatorial,
			FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation.latitudeRadians,
			firstPlacement.localMeanSiderealTimeRadians,
		);
		assert(
			vectorDistance(zenithEnu, [0, 0, 1]) <= 2e-15,
			'A mean-of-date source on the local meridian at observer declination maps to zenith.',
		);
		assert(
			Math.abs(
				greenwichMeanSiderealTimeRadians(firstPlacement.julianDateUtcAsUt1)
				- firstPlacement.greenwichMeanSiderealTimeRadians,
			) <= Number.EPSILON,
			'GMST evaluation is stable for the retained fixed Julian date.',
		);

		const negativeControls = [
			await rejects(() => resolveCatalogDirectionAtObservation({
				direction: members[0].direction,
				catalogFrameId: 'wrong-frame',
				observation: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation,
			})),
			await rejects(() => resolveCatalogDirectionAtObservation({
				direction: [1, 1, 1],
				catalogFrameId: STELLAR_CATALOG_FRAME_ID,
				observation: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation,
			})),
			await rejects(() => createPerspectiveCameraContract({
				...FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera,
				verticalFieldOfViewRadians: Math.PI,
			})),
			await rejects(() => createPerspectiveCameraContract({
				...FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera,
				viewport: {width: 0, height: 400},
			})),
		];
		requireCondition(
			negativeControls.every(Boolean),
			'One or more projection-contract negative controls were accepted.',
		);

		const memberEvidence = projected.map((result) => ({
			memberIndex: result.memberIndex,
			memberId: result.memberId,
			classification: result.classification,
			localDirectionEastNorthUp: result.placement.localDirectionEastNorthUp,
			...(result.ndc === undefined ? {} : {ndc: result.ndc}),
			...(result.pixel === undefined ? {} : {pixel: result.pixel}),
		}));
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-stellar-screen-palette-projection-proof.js'],
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
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(
			productionBefore.algorithm32,
			productionAfter.algorithm32,
			'Algorithm32 production inventory',
		);
		assertFileInventoriesEqual(
			productionBefore.flat32,
			productionAfter.flat32,
			'Flat32 production inventory',
		);

		const proof = {
			proofId: 'stellar-screen-palette-fixed-observation-projection-v1',
			accepted: true,
			contract: STELLAR_SCREEN_PROJECTION_CONTRACT,
			fixture: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE,
			catalogSha256: `sha256:${catalogSha256}`,
			reconciliationSha256: `sha256:${reconciliationSha256}`,
			memberCount: members.length,
			classificationCounts,
			occupiedPixelCount: new Set(
				occupied.map((result) => result.pixel.linearIndex),
			).size,
			pixelCollisionCount: occupied.length - new Set(
				occupied.map((result) => result.pixel.linearIndex),
			).size,
			gmstRadians: firstPlacement.greenwichMeanSiderealTimeRadians,
			localMeanSiderealTimeRadians: firstPlacement.localMeanSiderealTimeRadians,
			assertions,
			negativeControls: negativeControls.map((rejected, index) => ({
				id: index + 1,
				rejected,
			})),
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closure.files.length,
				moduleClosureEdgeCount: closure.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/projection-proof.json', proof);
		await run.writeJsonArtifact('evidence/member-projections.json', memberEvidence);
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				memberCount: proof.memberCount,
				classificationCounts,
				occupiedPixelCount: proof.occupiedPixelCount,
				pixelCollisionCount: proof.pixelCollisionCount,
				assertionCount: assertions.length,
				negativeControlCount: negativeControls.length,
			},
			report: acceptedReport(run.runId, proof),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: manifest.artifactSetSha256,
		}, null, 2)}\n`);
	} catch (error) {
		const serialized = {
			name: error instanceof Error ? error.name : 'Error',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		};
		let finalizationError = null;
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {
					proofId: 'stellar-screen-palette-fixed-observation-projection-v1',
					error: serialized,
				},
				report: `# ${run.runId}: Stellar screen-palette projection proof\n\nConclusion: **failed**\n\n${serialized.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: manifest.artifactSetSha256,
				error: serialized,
			}, null, 2)}\n`);
		} catch (failure) {
			finalizationError = {
				name: failure instanceof Error ? failure.name : 'Error',
				message: failure instanceof Error ? failure.message : String(failure),
				stack: failure instanceof Error ? failure.stack : undefined,
			};
		}
		if (finalizationError !== null) {
			process.stderr.write(`${JSON.stringify({
				conclusion: 'unsealed-failure',
				error: serialized,
				finalizationError,
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
