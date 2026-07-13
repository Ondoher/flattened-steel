#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {
	BRIGHT_STAR_CATALOG_V50,
	canonicalDirectionFromCatalogCoordinate,
	parseBrightStarCatalogV50,
	selectBrightestBrightStarCatalogMembers,
} from '../catalogs/bright-star-catalog-v50.js';
import {loadPicklesV1998, loadSvoJohnsonFilter} from '../catalogs/stellar-photometry-inputs.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {STELLAR_CATALOG_FRAME_ID, STELLAR_SCREEN_PALETTE_CONTRACT} from '../stellar-screen-palette/contracts.js';
import {FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE} from '../stellar-screen-palette/fixed-san-jose-fixture.js';
import {
	NATIVE_15_STELLAR_PHOTOMETRY_CONTRACT,
	materializeNative15StellarMembers,
} from '../stellar-screen-palette/Native15StellarPhotometry.js';
import {StellarScreenPaletteBuilder} from '../stellar-screen-palette/StellarScreenPaletteBuilder.js';
import {StellarScreenPaletteCacheController} from '../stellar-screen-palette/StellarScreenPaletteCacheController.js';
import {
	createPerspectiveCameraContract,
	pixelSolidAngleSteradians,
} from '../stellar-screen-palette/StellarScreenProjector.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-stellar-screen-palette-cpu-builder-proof.js';
const EXPECTED_PACKET_SET_SHA256 = '33d4eaa2a34e6512a943a36a6d541aad07ac30d86383eabea5b4ef874e3e7f47';
const INPUTS = Object.freeze({
	catalog: Object.freeze({
		relativePath: 'catalogs/bright-star-catalog-v50.tsv',
		sha256: BRIGHT_STAR_CATALOG_V50.sourceSha256.slice('sha256:'.length),
	}),
	templates: Object.freeze({
		relativePath: 'catalogs/pickles-v1998/dat.tar.gz',
		sha256: 'd25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130',
	}),
	johnsonB: Object.freeze({
		relativePath: 'catalogs/svo-johnson/generic-johnson-b.xml',
		sha256: '887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197',
	}),
	johnsonV: Object.freeze({
		relativePath: 'catalogs/svo-johnson/generic-johnson-v.xml',
		sha256: 'bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6',
	}),
});
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function relativeResidual(actual, expected) {
	return Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
}

async function rejects(operation) {
	try {
		await operation();
	} catch {
		return true;
	}
	return false;
}

async function inventoryProduction() {
	const [algorithm32, flat32] = await Promise.all([
		createFileInventory(ALGORITHM32_ROOT),
		createFileInventory(FLAT32_ROOT),
	]);
	return {algorithm32, flat32};
}

function packetSetSha256(members) {
	const payload = members.map(({id, spectralIrradiance}) => ({id, spectralIrradiance}));
	return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function report(runId, proof) {
	return [
		`# ${runId}: Stellar screen-palette exact CPU builder proof`,
		'',
		'Conclusion: **accepted**',
		'',
		`- Fixed roster: ${proof.fixed.memberCount} members, ${proof.fixed.occupiedPixelCount} occupied pixels.`,
		`- Constructed collision: ${proof.collision.eligibleMemberCount} contributors in one pixel, ${proof.collision.collisionMemberCount} collisions.`,
		`- Persistent storage: ${proof.fixed.matrixBytes} matrix bytes plus ${proof.fixed.paletteBytes} palette bytes.`,
		`- Builder time: ${proof.timing.builderMilliseconds.toFixed(3)} ms; photometry time: ${proof.timing.photometryMilliseconds.toFixed(3)} ms.`,
		`- Assertions: ${proof.assertions.length}; negative controls: ${proof.negativeControls.length}.`,
		'',
		'This accepts Work Plan step 3 only. It does not upload GPU resources, connect atmosphere composition, compress the palette, rewrite indices to Uint8, or render.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The CPU builder proof accepts no arguments.');
	const run = await initializeRunRecord({
		slug: 'stellar-screen-palette-exact-cpu-builder-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'stellar-screen-palette-cpu-builder-proof-inputs-v1',
			files: INPUTS,
			fixture: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE,
			contract: STELLAR_SCREEN_PALETTE_CONTRACT,
		},
		provenance: {
			schemaId: 'stellar-screen-palette-cpu-builder-proof-provenance-v1',
			parentRun: {
				runId: '000406-stellar-screen-palette-fixed-observation-projection-proof',
				artifactSetSha256: '7dd00b078d6a058cb7feabe95df9d86c148ee1048c92ce4d484610a750d41620',
			},
			photometry: NATIVE_15_STELLAR_PHOTOMETRY_CONTRACT,
			operation: 'project each member; divide irradiance by exact pixel solid angle; add colliding native-15 radiances channel-wise; pack palette to Float32',
			implementation: 'scripts/extraterrestrial/stellar-screen-palette',
		},
		environment: {
			schemaId: 'stellar-screen-palette-cpu-builder-proof-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
		},
		references: {
			schemaId: 'stellar-screen-palette-cpu-builder-proof-references-v1',
			canonicalDesign: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md',
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
		]);
		const inputPaths = Object.fromEntries(Object.entries(INPUTS).map(([key, input]) => [
			key,
			path.join(EXPERIMENT_ROOT, input.relativePath),
		]));
		await Promise.all(Object.values(inputPaths).map((inputPath) =>
			assertExistingRealPathContained(EXPERIMENT_ROOT, inputPath, 'Scientific input')));
		const actualHashes = Object.fromEntries(await Promise.all(
			Object.entries(inputPaths).map(async ([key, inputPath]) => [key, await sha256File(inputPath)]),
		));
		requireCondition(
			Object.keys(INPUTS).every((key) => actualHashes[key] === INPUTS[key].sha256),
			'One or more checked stellar scientific inputs changed.',
		);

		const catalog = selectBrightestBrightStarCatalogMembers(
			parseBrightStarCatalogV50(await readFile(inputPaths.catalog, 'utf8')),
			500,
		);
		const photometryStart = performance.now();
		const [templates, johnsonB, johnsonV] = await Promise.all([
			loadPicklesV1998(inputPaths.templates),
			loadSvoJohnsonFilter(inputPaths.johnsonB),
			loadSvoJohnsonFilter(inputPaths.johnsonV),
		]);
		const radiometry = materializeNative15StellarMembers({
			members: catalog,
			templates,
			johnsonB,
			johnsonV,
		});
		const photometryMilliseconds = performance.now() - photometryStart;
		const members = catalog.map((member, memberIndex) => Object.freeze({
			id: member.memberId,
			direction: canonicalDirectionFromCatalogCoordinate(member),
			spectralIrradiance: radiometry[memberIndex].spectralIrradiance,
		}));
		const sourceIdentity = `native15-packets-sha256:${packetSetSha256(members)}`;
		const camera = createPerspectiveCameraContract(FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera);
		const builder = new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 500});
		const controller = new StellarScreenPaletteCacheController({builder});
		const fixedRequest = {
			members,
			catalogFrameId: STELLAR_CATALOG_FRAME_ID,
			observation: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.observation,
			camera,
			sourceIdentity,
			numericalIdentity: 'cpu-binary64-accumulation-float32-palette-v1',
		};
		const buildStart = performance.now();
		const first = controller.rebuild(fixedRequest);
		const builderMilliseconds = performance.now() - buildStart;
		const fixed = first.product;
		const assertions = [];
		const assert = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};

		assert(sourceIdentity.endsWith(EXPECTED_PACKET_SET_SHA256), 'Contained photometry reproduces the accepted 500-packet set identity.');
		assert(fixed.pixelIndex instanceof Uint16Array, 'The base screen matrix is Uint16.');
		assert(fixed.palette instanceof Float32Array, 'The published native-15 palette is explicitly packed to Float32.');
		assert(fixed.pixelIndex.length === 640 * 400, 'The matrix contains exactly one index per fixed-view pixel.');
		assert(fixed.metadata.memberCount === 500, 'The builder classifies all 500 source members exactly once.');
		assert(fixed.metadata.classificationCounts['occupied-pixel'] === 52, 'The builder preserves the accepted 52 fixed-view occupied projections.');
		assert(fixed.metadata.occupiedPixelCount === 52 && fixed.metadata.paletteEntryCount === 53, 'Reserved zero plus one exact entry per occupied pixel defines the palette cardinality.');
		assert(fixed.metadata.collisionMemberCount === 0, 'The fixed fixture retains its evidenced zero natural pixel collisions.');
		assert(fixed.palette.slice(0, 15).every((value) => value === 0), 'Palette entry zero is exact zero in every wavelength.');
		assert([...fixed.pixelIndex].every((index) => index < fixed.metadata.paletteEntryCount), 'Every matrix index lies inside the published palette.');
		assert([...fixed.pixelIndex].filter((index) => index !== 0).length === 52, 'Exactly 52 screen pixels contain nonzero palette indices.');
		assert(fixed.metadata.matrixBytes === 512000 && fixed.metadata.paletteBytes === 3180, 'Persistent matrix and palette byte counts match their typed layouts.');
		assert(fixed.metadata.exactConservationResidual.every((value, index) => relativeResidual(value + fixed.metadata.inputIrradiance[index], fixed.metadata.inputIrradiance[index]) <= 2e-15), 'Binary64 point conversion and accumulation conserve every input irradiance channel.');
		assert(fixed.metadata.maximumRelativePackingResidual <= 2 ** -23, 'Float32 packing residual remains within one conservative binary32 relative step.');
		assert(fixed.metadata.packedConservationResidual.every((value, index) => Math.abs(value) <= Math.abs(fixed.metadata.inputIrradiance[index]) * 2 ** -22), 'Packed-palette integrated flux stays within the declared binary32 accumulation envelope.');

		const occupiedResult = fixed.memberResults.find((result) => result.classification === 'occupied-pixel');
		const collisionDirection = members[occupiedResult.memberIndex].direction;
		const scale = 1e-10;
		const collisionMembers = [1, 2, 3, 0].map((factor, memberIndex) => ({
			id: `collision-${memberIndex}`,
			direction: collisionDirection,
			spectralIrradiance: Array.from({length: 15}, (_, channelIndex) =>
				factor * (channelIndex + 1) * scale),
		}));
		const collision = new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 4}).build({
			...fixedRequest,
			members: collisionMembers,
			sourceIdentity: 'constructed-four-member-collision-control-v1',
		});
		const collisionIndex = collision.pixelIndex[occupiedResult.pixel.linearIndex];
		const solidAngle = pixelSolidAngleSteradians(
			occupiedResult.pixel.x,
			occupiedResult.pixel.y,
			camera,
		);
		assert(collision.metadata.eligibleMemberCount === 3 && collision.metadata.zeroRadiometryMemberCount === 1, 'Constructed control separates three positive contributors from one explicit zero-radiometry member.');
		assert(collision.metadata.occupiedPixelCount === 1 && collision.metadata.collisionMemberCount === 2, 'Three positive contributors produce one occupied pixel and two collisions.');
		assert(collision.metadata.paletteEntryCount === 2 && collisionIndex === 1, 'The collision result uses only reserved zero and one occupied-pixel entry.');
		assert(Array.from({length: 15}, (_, channelIndex) => {
			const expected = Math.fround(6 * (channelIndex + 1) * scale / solidAngle);
			return collision.palette[15 + channelIndex] === expected;
		}).every(Boolean), 'Every constructed collision channel is added before exact Float32 packing.');
		assert(collision.metadata.exactConservationResidual.every((value, index) => Math.abs(value) <= collision.metadata.inputIrradiance[index] * 2e-15), 'Constructed collision conserves all 15 binary64 irradiance channels.');

		const alternateCamera = createPerspectiveCameraContract({
			...FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera,
			azimuthRadians: FIXED_SAN_JOSE_STELLAR_PROJECTION_FIXTURE.camera.azimuthRadians + 0.2,
		});
		const second = controller.rebuild({...fixedRequest, camera: alternateCamera});
		assert(second.generation === 2 && controller.current === second, 'A complete replacement publishes as the next atomic generation.');
		assert(JSON.stringify(second.product.identities.view) !== JSON.stringify(fixed.identities.view), 'Camera movement changes the derived view identity.');
		const preserved = controller.current;
		const injectedFailureRejected = await rejects(() => controller.rebuild({
			...fixedRequest,
			members: [{...members[0], spectralIrradiance: [Number.NaN, ...members[0].spectralIrradiance.slice(1)]}],
		}));
		assert(injectedFailureRejected && controller.current === preserved, 'Injected build failure preserves the last complete generation.');
		assert(controller.dispose() && !controller.dispose(), 'Controller disposal is effective exactly once.');
		assert(controller.current === null && controller.state.releaseCount === 1, 'Disposal releases the published CPU generation exactly once.');

		const negativeControls = [
			await rejects(() => new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 65536})),
			await rejects(() => new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: -1})),
			await rejects(() => new StellarScreenPaletteBuilder({maximumExpectedOccupiedPixelCount: 1}).build({
				...fixedRequest,
				members: collisionMembers.slice(0, 2),
			})),
			await rejects(() => controller.rebuild(fixedRequest)),
		];
		assert(negativeControls.every(Boolean), 'Uint16 capacity and disposed-lifecycle negative controls all reject.');

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-stellar-screen-palette-cpu-builder-proof.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib',
			],
		});
		const productionAfter = await inventoryProduction();
		assertFileInventoriesEqual(productionBefore.algorithm32, productionAfter.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(productionBefore.flat32, productionAfter.flat32, 'Flat32 production inventory');

		const proof = {
			proofId: 'stellar-screen-palette-exact-cpu-builder-v1',
			accepted: true,
			contract: STELLAR_SCREEN_PALETTE_CONTRACT,
			inputHashes: actualHashes,
			packetSetSha256: EXPECTED_PACKET_SET_SHA256,
			fixed: {
				memberCount: fixed.metadata.memberCount,
				classificationCounts: fixed.metadata.classificationCounts,
				occupiedPixelCount: fixed.metadata.occupiedPixelCount,
				collisionMemberCount: fixed.metadata.collisionMemberCount,
				paletteEntryCount: fixed.metadata.paletteEntryCount,
				matrixBytes: fixed.metadata.matrixBytes,
				paletteBytes: fixed.metadata.paletteBytes,
				maximumAbsolutePackingResidual: fixed.metadata.maximumAbsolutePackingResidual,
				maximumRelativePackingResidual: fixed.metadata.maximumRelativePackingResidual,
				exactConservationResidual: fixed.metadata.exactConservationResidual,
				packedConservationResidual: fixed.metadata.packedConservationResidual,
			},
			collision: {
				memberCount: collision.metadata.memberCount,
				eligibleMemberCount: collision.metadata.eligibleMemberCount,
				zeroRadiometryMemberCount: collision.metadata.zeroRadiometryMemberCount,
				occupiedPixelCount: collision.metadata.occupiedPixelCount,
				collisionMemberCount: collision.metadata.collisionMemberCount,
				paletteEntryCount: collision.metadata.paletteEntryCount,
				pixel: occupiedResult.pixel,
				pixelSolidAngleSteradians: solidAngle,
				packedSpectrum: Array.from(collision.palette.slice(15, 30)),
			},
			timing: {photometryMilliseconds, builderMilliseconds},
			lifecycle: {publishedGenerations: 2, injectedFailurePreservedGeneration: true, releaseCount: 1},
			assertions,
			negativeControls: negativeControls.map((rejected, index) => ({id: index + 1, rejected})),
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closure.files.length,
				moduleClosureEdgeCount: closure.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/cpu-builder-proof.json', proof);
		await run.writeJsonArtifact('evidence/fixed-palette-summary.json', {
			schemaId: 'stellar-screen-palette-fixed-summary-v1',
			identities: fixed.identities,
			metadata: fixed.metadata,
			nonzeroPixels: fixed.memberResults.filter((result) => result.classification === 'occupied-pixel').map((result) => result.pixel),
		});
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				assertionCount: assertions.length,
				negativeControlCount: negativeControls.length,
				fixedOccupiedPixelCount: proof.fixed.occupiedPixelCount,
				collisionMemberCount: proof.collision.collisionMemberCount,
			},
			report: report(run.runId, proof),
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
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {proofId: 'stellar-screen-palette-exact-cpu-builder-v1', error: serialized},
				report: `# ${run.runId}: Stellar screen-palette exact CPU builder proof\n\nConclusion: **failed**\n\n${serialized.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: manifest.artifactSetSha256,
				error: serialized,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				conclusion: 'unsealed-failure',
				error: serialized,
				finalizationError: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
