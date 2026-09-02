#!/usr/bin/env node

import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {assertNoReparseEntries} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {
	EXPERIMENT_LOCK_PATH,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
	pathComparisonKey,
} from '../../harness/lib/roots.js';
import {loadPicklesV1998, loadSvoJohnsonFilter} from '../../catalogs/stellar-photometry-inputs.js';
import {STANDARD_STELLAR_MEMBER_DATA} from '../controls/production-v1/src/algorithm32/implementation/star-field/consts.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {
	analyzeCr6bCurrentPhotometryCoverage,
	buildCr6bBrightest2000Catalog,
} from '../stellar/Cr6bBrightest2000Catalog.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND =
	'node scripts/extraterrestrial/color-reset/runners/run-cr6b-brightest-2000-catalog-proof.js';
const RUNNER_RELATIVE_PATH = COMMAND.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const CATALOG_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'catalogs');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const SNAPSHOT_SOURCE_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1', 'src');
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr6b-brightest-2000-catalog-v1.json';
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr6b-brightest-2000-catalog-browser.js';
const BUILDER_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/stellar/Cr6bBrightest2000Catalog.js';
const CATALOG_RELATIVE_PATH = 'scripts/extraterrestrial/catalogs/bright-star-catalog-v50.tsv';
const PARSER_RELATIVE_PATH = 'scripts/extraterrestrial/catalogs/bright-star-catalog-v50.js';
const PHOTOMETRY_LOADER_RELATIVE_PATH =
	'scripts/extraterrestrial/catalogs/stellar-photometry-inputs.js';
const PICKLES_RELATIVE_PATH = 'scripts/extraterrestrial/catalogs/pickles-v1998/dat.tar.gz';
const JOHNSON_B_RELATIVE_PATH =
	'scripts/extraterrestrial/catalogs/svo-johnson/generic-johnson-b.xml';
const JOHNSON_V_RELATIVE_PATH =
	'scripts/extraterrestrial/catalogs/svo-johnson/generic-johnson-v.xml';
const PRODUCTION_SNAPSHOT_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/controls/production-v1/src/algorithm32/implementation/star-field/consts.js';

function repositoryPath(relativePath) {
	return path.join(REPOSITORY_ROOT, ...relativePath.split('/'));
}

const RUNNER_PATH = repositoryPath(RUNNER_RELATIVE_PATH);
const FIXTURE_PATH = repositoryPath(FIXTURE_RELATIVE_PATH);
const HARNESS_PATH = repositoryPath(HARNESS_RELATIVE_PATH);
const BUILDER_PATH = repositoryPath(BUILDER_RELATIVE_PATH);
const CATALOG_PATH = repositoryPath(CATALOG_RELATIVE_PATH);
const PARSER_PATH = repositoryPath(PARSER_RELATIVE_PATH);
const PHOTOMETRY_LOADER_PATH = repositoryPath(PHOTOMETRY_LOADER_RELATIVE_PATH);
const PICKLES_PATH = repositoryPath(PICKLES_RELATIVE_PATH);
const JOHNSON_B_PATH = repositoryPath(JOHNSON_B_RELATIVE_PATH);
const JOHNSON_V_PATH = repositoryPath(JOHNSON_V_RELATIVE_PATH);
const PRODUCTION_SNAPSHOT_PATH = repositoryPath(PRODUCTION_SNAPSHOT_RELATIVE_PATH);

const SCHEMA_PREFIX = 'algorithm32-color-reset-cr6b-brightest-2000-catalog';
const FIXTURE_SHA256 = 'd2cb6c2a0c0c1950817772ff6407e8a6ec0493db9ae48853e31ec1c61b6f1d0e';
const HARNESS_SHA256 = '0ca466196ef24b765c97f73c4c077059b7fcc83649fa00ad24bb1a7645bcd0e8';
const BUILDER_SHA256 = '81de61013f86692a462ba308807e854571e3ba62e2d9ff8d44fcb5a868a10050';
const CATALOG_SHA256 = 'd79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759';
const PARSER_SHA256 = '17cd83e07425bf3c55c4bc8d3f2f02f38f8530a71e556d0b2d3bdd3945ead2e5';
const PHOTOMETRY_LOADER_SHA256 =
	'e42f30628671843fb04a16923a68766a0cea36ca6e9fe2c1552d048cc8af5c79';
const PICKLES_SHA256 = 'd25a74fe853d4b343c56fc936b18ebaf640b4946f5776f0797b66a44890a6130';
const JOHNSON_B_SHA256 = '887af6b6164fd2e41c5b17d450286819a4758b83e7a6b89bfe9bad73a28ee197';
const JOHNSON_V_SHA256 = 'bbbbef8da2f3d074f2ab12307f6c85320d12e1a3306a27086c4564c227abacc6';
const PRODUCTION_SNAPSHOT_SHA256 =
	'd13575deca80e425c287606d3ff260d935165d7e58630d3a1b3838fa1cb2c7ba';
const EXPECTED_UNSUPPORTED_HRS = Object.freeze([868, 8316, 1845, 4163, 2289, 4846, 9004]);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function isSha256(value) {
	return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function isArtifactPath(value) {
	return (
		typeof value === 'string' &&
		value.length > 0 &&
		value === value.replaceAll('\\', '/') &&
		!path.posix.isAbsolute(value) &&
		!value.split('/').includes('..')
	);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === `${SCHEMA_PREFIX}-input-v1` &&
			fixture.experiment?.increment === 'CR6B' &&
			fixture.experiment.slug === 'cr6b-brightest-2000-catalog-proof',
		'CR6B fixture identity changed.',
	);
	requireCondition(
		fixture.claimBoundary?.catalogRosterOnly === true &&
			fixture.claimBoundary.catalogSelectionIntegrityGate === true &&
			fixture.claimBoundary.currentPhotometryCoverageReported === true &&
			fixture.claimBoundary.spectralPacketsMaterialized === false &&
			fixture.claimBoundary.unsupportedMembersOmitted === false &&
			fixture.claimBoundary.unsupportedMembersReplaced === false &&
			fixture.claimBoundary.runtimeIntegration === false &&
			fixture.claimBoundary.stellarAppearanceClaim === false &&
			fixture.claimBoundary.performanceClaim === false &&
			fixture.claimBoundary.productionClaim === false,
		'CR6B catalog-only claim boundary changed.',
	);
	requireCondition(
		fixture.source?.path === CATALOG_RELATIVE_PATH &&
			fixture.source.byteLength === 556724 &&
			fixture.source.sha256 === CATALOG_SHA256 &&
			fixture.source.parsedRecordCount === 9096 &&
			fixture.source.coordinateEpoch === 'J2000.0' &&
			fixture.source.coordinateFrame === 'eq-FK5-J2000',
		'CR6B authenticated BSC source declaration changed.',
	);
	requireCondition(
		fixture.selection?.memberCount === 2000 &&
			fixture.selection.id ===
				'finite-j2000-position-and-vmag; ascending-vmag; ascending-hr-tiebreak; first-2000' &&
			fixture.selection.first?.canonicalIndex === 0 &&
			fixture.selection.first.memberId === 'bsc-v50-hr-2491' &&
			fixture.selection.first.hr === 2491 &&
			fixture.selection.first.visualMagnitude === -1.46 &&
			fixture.selection.last?.canonicalIndex === 1999 &&
			fixture.selection.last.memberId === 'bsc-v50-hr-7474' &&
			fixture.selection.last.hr === 7474 &&
			fixture.selection.last.visualMagnitude === 5.17,
		'CR6B selection count or endpoints changed.',
	);
	requireCondition(
		fixture.selection.boundaryTie?.visualMagnitude === 5.17 &&
			fixture.selection.boundaryTie.catalogMemberCountAtMagnitude === 28 &&
			fixture.selection.boundaryTie.selectedMemberCountAtMagnitude === 25 &&
			fixture.selection.boundaryTie.lastSelectedHr === 7474 &&
			exactJson(fixture.selection.boundaryTie.firstExcludedHrs, [7770, 8011, 8324]),
		'CR6B magnitude-boundary declaration changed.',
	);
	requireCondition(
		fixture.productionPrefix?.memberCount === 500 &&
			fixture.productionPrefix.snapshotPath === PRODUCTION_SNAPSHOT_RELATIVE_PATH &&
			fixture.productionPrefix.snapshotSha256 === PRODUCTION_SNAPSHOT_SHA256,
		'CR6B production-prefix declaration changed.',
	);
	requireCondition(
		fixture.currentPhotometryCoverage?.picklesPath === PICKLES_RELATIVE_PATH &&
			fixture.currentPhotometryCoverage.picklesSha256 === PICKLES_SHA256 &&
			fixture.currentPhotometryCoverage.johnsonBPath === JOHNSON_B_RELATIVE_PATH &&
			fixture.currentPhotometryCoverage.johnsonBSha256 === JOHNSON_B_SHA256 &&
			fixture.currentPhotometryCoverage.johnsonVPath === JOHNSON_V_RELATIVE_PATH &&
			fixture.currentPhotometryCoverage.johnsonVSha256 === JOHNSON_V_SHA256 &&
			fixture.currentPhotometryCoverage.supportedMemberCount === 1993 &&
			fixture.currentPhotometryCoverage.unsupportedMemberCount === 7 &&
			exactJson(
				fixture.currentPhotometryCoverage.unsupportedHrsInRosterOrder,
				EXPECTED_UNSUPPORTED_HRS,
			),
		'CR6B current photometry-coverage declaration changed.',
	);
	const images = fixture.outputs?.requestedImageUploadOrder;
	requireCondition(
		Array.isArray(images) &&
			images.length === fixture.gates?.requestedImageCount &&
			images.length === 4 &&
			new Set(images).size === images.length &&
			images.every(isArtifactPath) &&
			exactJson(images, Object.values(fixture.outputs.figures)),
		'CR6B requires exactly four ordered, unique figure outputs.',
	);
	for (const output of [
		fixture.outputs.roster,
		fixture.outputs.photometryCoverage,
		fixture.outputs.analysis,
		fixture.outputs.proof,
		fixture.outputs.progress,
	]) {
		requireCondition(isArtifactPath(output), 'CR6B contains an unsafe evidence output path.');
	}
	for (const dimensions of [
		fixture.presentation?.first500AllSky,
		fixture.presentation?.brightest2000AllSky,
		fixture.presentation?.magnitudeByRank,
		fixture.presentation?.summary,
	]) {
		requireCondition(
			Number.isSafeInteger(dimensions?.widthPixels) && dimensions.widthPixels > 0 &&
				Number.isSafeInteger(dimensions.heightPixels) && dimensions.heightPixels > 0,
			'CR6B presentation dimensions are invalid.',
		);
	}
}

async function verifyOrdinaryFile(filePath, label) {
	const absolute = path.resolve(filePath);
	const facts = await lstat(absolute);
	requireCondition(facts.isFile() && !facts.isSymbolicLink(), `${label} is not an ordinary file.`);
	const canonical = await realpath(absolute);
	requireCondition(
		pathComparisonKey(canonical) === pathComparisonKey(absolute),
		`${label} traverses a link or junction.`,
	);
	return facts;
}

async function verifyAuthoredInputs() {
	for (const [value, label] of [
		[FIXTURE_SHA256, 'fixture'],
		[HARNESS_SHA256, 'browser harness'],
		[BUILDER_SHA256, 'catalog builder'],
	]) {
		requireCondition(isSha256(value), `CR6B ${label} SHA-256 pin has not been finalized.`);
	}
	const declarations = [
		{label: 'fixture', path: FIXTURE_PATH, relativePath: FIXTURE_RELATIVE_PATH, sha256: FIXTURE_SHA256},
		{label: 'browser harness', path: HARNESS_PATH, relativePath: HARNESS_RELATIVE_PATH, sha256: HARNESS_SHA256},
		{label: 'catalog builder', path: BUILDER_PATH, relativePath: BUILDER_RELATIVE_PATH, sha256: BUILDER_SHA256},
		{label: 'BSC V/50 source', path: CATALOG_PATH, relativePath: CATALOG_RELATIVE_PATH, sha256: CATALOG_SHA256, byteLength: 556724},
		{label: 'BSC parser', path: PARSER_PATH, relativePath: PARSER_RELATIVE_PATH, sha256: PARSER_SHA256},
		{label: 'photometry input loader', path: PHOTOMETRY_LOADER_PATH, relativePath: PHOTOMETRY_LOADER_RELATIVE_PATH, sha256: PHOTOMETRY_LOADER_SHA256},
		{label: 'Pickles archive', path: PICKLES_PATH, relativePath: PICKLES_RELATIVE_PATH, sha256: PICKLES_SHA256},
		{label: 'Johnson B filter', path: JOHNSON_B_PATH, relativePath: JOHNSON_B_RELATIVE_PATH, sha256: JOHNSON_B_SHA256},
		{label: 'Johnson V filter', path: JOHNSON_V_PATH, relativePath: JOHNSON_V_RELATIVE_PATH, sha256: JOHNSON_V_SHA256},
		{label: 'production 500 snapshot', path: PRODUCTION_SNAPSHOT_PATH, relativePath: PRODUCTION_SNAPSHOT_RELATIVE_PATH, sha256: PRODUCTION_SNAPSHOT_SHA256},
	];
	const identities = [];
	for (const declaration of declarations) {
		const facts = await verifyOrdinaryFile(declaration.path, `CR6B ${declaration.label}`);
		const observedSha256 = await sha256File(declaration.path);
		requireCondition(
			observedSha256 === declaration.sha256 &&
				(declaration.byteLength === undefined || facts.size === declaration.byteLength),
			`CR6B ${declaration.label} identity changed.`,
		);
		identities.push({
			path: declaration.relativePath,
			byteLength: facts.size,
			sha256: observedSha256,
		});
	}
	const runnerFacts = await verifyOrdinaryFile(RUNNER_PATH, 'CR6B runner');
	identities.push({
		path: RUNNER_RELATIVE_PATH,
		byteLength: runnerFacts.size,
		sha256: await sha256File(RUNNER_PATH),
		identityRole: 'observed; the static closure is compared before and after execution',
	});
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		identities,
	};
}

async function captureImplementationBefore() {
	const closure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr6b-brightest-2000-catalog-proof.js',
			'color-reset/harness/cr6b-brightest-2000-catalog-browser.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process',
			'node:crypto',
			'node:fs',
			'node:fs/promises',
			'node:http',
			'node:module',
			'node:os',
			'node:path',
			'node:url',
			'node:util',
			'node:zlib',
		],
	});
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-before-v1`,
		implementation: {
			closure,
			inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, closure.files),
		},
		packageBoundary: {
			packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
			packageLockSha256: await sha256File(EXPERIMENT_LOCK_PATH),
		},
	};
}

async function captureImplementationAfter(before) {
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-after-v1`,
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.implementation.closure.files,
		),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(
		before.implementation.inventory,
		after.implementationInventory,
		'CR6B runtime implementation',
	);
	requireCondition(
		before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR6B package boundary changed during execution.',
	);
}

async function captureProtectedSources() {
	return {
		algorithm32: await createFileInventory(ALGORITHM32_ROOT),
		flat32: await createFileInventory(FLAT32_ROOT),
		productionControlSnapshot: await createFileInventory(SNAPSHOT_SOURCE_ROOT),
		catalogInputs: await createSelectedFileInventory(CATALOG_ROOT, [
			'bright-star-catalog-v50.tsv',
			'bright-star-catalog-v50.js',
			'stellar-photometry-inputs.js',
			'pickles-v1998/dat.tar.gz',
			'svo-johnson/generic-johnson-b.xml',
			'svo-johnson/generic-johnson-v.xml',
		]),
	};
}

function assertProtectedSourcesUnchanged(before, after) {
	for (const key of Object.keys(before)) {
		assertFileInventoriesEqual(before[key], after[key], `CR6B protected ${key}`);
	}
}

function inspectCatalog(catalog, fixture) {
	const members = catalog.members;
	const ids = new Set(members.map(({memberId}) => memberId));
	let selectionOrdered = true;
	let directionsFiniteAndUnitLength = true;
	let maximumDirectionNormError = 0;
	for (let index = 0; index < members.length; index += 1) {
		const member = members[index];
		if (member.canonicalIndex !== index) selectionOrdered = false;
		if (index > 0) {
			const previous = members[index - 1];
			if (
				previous.visualMagnitude > member.visualMagnitude ||
				(previous.visualMagnitude === member.visualMagnitude && previous.hr >= member.hr)
			) selectionOrdered = false;
		}
		const direction = member.direction;
		if (!Array.isArray(direction) || direction.length !== 3 || direction.some((value) => !Number.isFinite(value))) {
			directionsFiniteAndUnitLength = false;
			continue;
		}
		const norm = Math.hypot(...direction);
		const error = Math.abs(norm - 1);
		maximumDirectionNormError = Math.max(maximumDirectionNormError, error);
		if (error > 1e-12) directionsFiniteAndUnitLength = false;
	}
	const first = members[0];
	const last = members.at(-1);
	return {
		schemaId: `${SCHEMA_PREFIX}-catalog-inspection-v1`,
		parsedRecordCount: catalog.parsedRecordCount,
		memberCount: members.length,
		memberIdsUnique: ids.size === members.length,
		selectionOrdered,
		selectionEndpointsExact:
			first?.canonicalIndex === fixture.selection.first.canonicalIndex &&
			first?.memberId === fixture.selection.first.memberId &&
			first?.hr === fixture.selection.first.hr &&
			first?.visualMagnitude === fixture.selection.first.visualMagnitude &&
			last?.canonicalIndex === fixture.selection.last.canonicalIndex &&
			last?.memberId === fixture.selection.last.memberId &&
			last?.hr === fixture.selection.last.hr &&
			last?.visualMagnitude === fixture.selection.last.visualMagnitude,
		directionsFiniteAndUnitLength,
		maximumDirectionNormError,
		allMembersHaveFiniteBMinusV: members.every(({bMinusV}) => Number.isFinite(bMinusV)),
		allMembersHaveSpectralType: members.every(
			({spectralType}) => typeof spectralType === 'string' && spectralType.trim().length > 0,
		),
		boundaryMagnitudeSelectedCount: members.filter(
			({visualMagnitude}) => visualMagnitude === fixture.selection.boundaryTie.visualMagnitude,
		).length,
	};
}

function compareProductionPrefix(members) {
	let idMismatchCount = 0;
	let directionScalarMismatchCount = 0;
	let maximumDirectionScalarAbsoluteDifference = 0;
	for (let index = 0; index < STANDARD_STELLAR_MEMBER_DATA.length; index += 1) {
		const expected = STANDARD_STELLAR_MEMBER_DATA[index];
		const actual = members[index];
		if (actual?.memberId !== expected.id) idMismatchCount += 1;
		for (let component = 0; component < 3; component += 1) {
			const difference = Math.abs((actual?.direction?.[component] ?? Number.NaN) - expected.direction[component]);
			if (!(difference === 0)) directionScalarMismatchCount += 1;
			if (Number.isFinite(difference)) {
				maximumDirectionScalarAbsoluteDifference = Math.max(
					maximumDirectionScalarAbsoluteDifference,
					difference,
				);
			}
		}
	}
	return {
		schemaId: `${SCHEMA_PREFIX}-production-prefix-comparison-v1`,
		productionMemberCount: STANDARD_STELLAR_MEMBER_DATA.length,
		candidatePrefixMemberCount: Math.min(STANDARD_STELLAR_MEMBER_DATA.length, members.length),
		idMismatchCount,
		directionScalarMismatchCount,
		maximumDirectionScalarAbsoluteDifference,
		exact:
			STANDARD_STELLAR_MEMBER_DATA.length === 500 &&
			idMismatchCount === 0 &&
			directionScalarMismatchCount === 0,
	};
}

function inspectCoverage(coverage, members, fixture) {
	const unsupported = coverage.unsupportedMembers;
	const unsupportedHrs = unsupported.map(({hr}) => hr);
	const rosterIds = new Set(members.map(({memberId}) => memberId));
	return {
		schemaId: `${SCHEMA_PREFIX}-photometry-coverage-inspection-v1`,
		contract: coverage.contract,
		templateCount: coverage.templateCount,
		supportedBMinusVRange: coverage.supportedBMinusVRange,
		coveredMemberCount: coverage.coveredMemberCount,
		unsupportedMemberCount: coverage.unsupportedMemberCount,
		unsupportedMembers: unsupported,
		unsupportedHrs,
		exactExpectedExceptions: exactJson(unsupportedHrs, EXPECTED_UNSUPPORTED_HRS),
		allExceptionsRetainedInRoster: unsupported.every(({memberId}) => rosterIds.has(memberId)),
		coveragePartitionsRoster:
			coverage.coveredMemberCount + coverage.unsupportedMemberCount === members.length,
		fixtureCountsExact:
			coverage.coveredMemberCount === fixture.currentPhotometryCoverage.supportedMemberCount &&
			coverage.unsupportedMemberCount === fixture.currentPhotometryCoverage.unsupportedMemberCount,
	};
}

function rosterArtifact(catalog, coverageInspection, fixture, authoredInputs) {
	return {
		schemaId: `${SCHEMA_PREFIX}-roster-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: FIXTURE_SHA256},
		source: fixture.source,
		contract: catalog.contract,
		selection: fixture.selection,
		parsedRecordCount: catalog.parsedRecordCount,
		selectedMemberCount: catalog.members.length,
		photometryCoverage: {
			contract: coverageInspection.contract,
			templateCount: coverageInspection.templateCount,
			supportedBMinusVRange: coverageInspection.supportedBMinusVRange,
			coveredMemberCount: coverageInspection.coveredMemberCount,
			unsupportedMemberCount: coverageInspection.unsupportedMemberCount,
			unsupportedMembers: coverageInspection.unsupportedMembers,
		},
		members: catalog.members,
		derivation: {
			operation: 'Parse authenticated BSC V/50 rows, rank by ascending V magnitude then HR, and retain the first 2,000 records.',
			implementation: authoredInputs.identities.filter(({path: inputPath}) =>
				[BUILDER_RELATIVE_PATH, PARSER_RELATIVE_PATH, CATALOG_RELATIVE_PATH].includes(inputPath),
			),
			spectralPacketsMaterialized: false,
		},
	};
}

async function inspectPng(run, artifactPath, expectedDimensions) {
	const target = path.join(run.runDirectory, ...artifactPath.split('/'));
	const facts = await verifyOrdinaryFile(target, `CR6B image ${artifactPath}`);
	const bytes = await readFile(target);
	requireCondition(
		bytes.length >= 33 && bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
		`CR6B image ${artifactPath} is not a PNG.`,
	);
	const widthPixels = bytes.readUInt32BE(16);
	const heightPixels = bytes.readUInt32BE(20);
	return {
		path: artifactPath,
		byteLength: facts.size,
		sha256: await sha256File(target),
		widthPixels,
		heightPixels,
		bitDepth: bytes[24],
		colorType: bytes[25],
		dimensionsExact:
			widthPixels === expectedDimensions.widthPixels &&
			heightPixels === expectedDimensions.heightPixels,
	};
}

function imageDimensionsByPath(fixture) {
	return new Map([
		[fixture.outputs.figures.first500AllSky, fixture.presentation.first500AllSky],
		[fixture.outputs.figures.brightest2000AllSky, fixture.presentation.brightest2000AllSky],
		[fixture.outputs.figures.magnitudeByRank, fixture.presentation.magnitudeByRank],
		[fixture.outputs.figures.summary, fixture.presentation.summary],
	]);
}

function evaluateGates({
	fixture,
	authoredInputs,
	catalog,
	catalogInspection,
	prefixComparison,
	coverageInspection,
	browser,
	images,
	gateEvaluationStartedAt,
}) {
	const imageTimes = new Map(browser.uploads.map(({path: artifactPath, completedAt}) => [artifactPath, completedAt]));
	const gateTime = Date.parse(gateEvaluationStartedAt);
	const gates = {
		catalogSourceAuthenticated: authoredInputs.identities.some(
			({path: inputPath, byteLength, sha256}) =>
				inputPath === CATALOG_RELATIVE_PATH && byteLength === 556724 && sha256 === CATALOG_SHA256,
		),
		catalogContractExact:
			catalog.contract?.id === 'color-reset-cr6b-brightest-2000-catalog-v1' &&
			catalog.contract.memberCount === 2000 &&
			catalog.contract.spectralPackets === 'not-materialized-by-roster-proof',
		parsedRecordCountExact: catalogInspection.parsedRecordCount === fixture.source.parsedRecordCount,
		memberCountExact: catalogInspection.memberCount === fixture.selection.memberCount,
		selectionOrderExact: catalogInspection.selectionOrdered,
		selectionEndpointsExact: catalogInspection.selectionEndpointsExact,
		selectionBoundaryCountExact:
			catalogInspection.boundaryMagnitudeSelectedCount ===
				fixture.selection.boundaryTie.selectedMemberCountAtMagnitude,
		memberIdsUnique: catalogInspection.memberIdsUnique,
		directionsFiniteAndUnitLength: catalogInspection.directionsFiniteAndUnitLength,
		allMembersHaveFiniteBMinusV: catalogInspection.allMembersHaveFiniteBMinusV,
		allMembersHaveSpectralType: catalogInspection.allMembersHaveSpectralType,
		productionFirst500ExactPrefix: prefixComparison.exact,
		photometryCoveragePartitionsRoster: coverageInspection.coveragePartitionsRoster,
		sevenPhotometryCoverageExceptionsExact:
			coverageInspection.fixtureCountsExact && coverageInspection.exactExpectedExceptions,
		allPhotometryCoverageExceptionsRetained: coverageInspection.allExceptionsRetainedInRoster,
		browserResultSchema:
			browser.result?.schemaId === `${SCHEMA_PREFIX}-browser-result-v1` &&
			browser.result.renderComplete === true,
		allRequestedImagesUploadedInOrder: exactJson(
			browser.uploads.map(({path: artifactPath}) => artifactPath),
			fixture.outputs.requestedImageUploadOrder,
		),
		allImagesAreDeclaredPngDimensions:
			images.length === fixture.gates.requestedImageCount &&
			images.every(({dimensionsExact, bitDepth}) => dimensionsExact && bitDepth === 8),
		allImagesWrittenBeforeGateEvaluation: fixture.outputs.requestedImageUploadOrder.every(
			(artifactPath) => Date.parse(imageTimes.get(artifactPath)) <= gateTime,
		),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		catalogOnlyClaimBoundaryRetained:
			fixture.claimBoundary.catalogRosterOnly === true &&
			fixture.claimBoundary.spectralPacketsMaterialized === false &&
			fixture.claimBoundary.runtimeIntegration === false &&
			fixture.claimBoundary.stellarAppearanceClaim === false &&
			fixture.claimBoundary.productionClaim === false,
		protectedSourcesUnchanged: true,
		runtimeImplementationUnchanged: true,
	};
	return {gates, accepted: Object.values(gates).every(Boolean)};
}

async function main() {
	if (process.argv.length !== 2) throw new Error('CR6B brightest-2000 catalog proof accepts no arguments.');
	const fixture = await readJson(FIXTURE_PATH);
	const run = await initializeColorResetRunRecord({
		slug: fixture.experiment.slug,
		command: COMMAND,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: fixture.experiment.increment,
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			catalog: {path: CATALOG_RELATIVE_PATH, byteLength: 556724, sha256: CATALOG_SHA256},
			selection: fixture.selection,
			productionPrefix: fixture.productionPrefix,
			photometryCoverage: fixture.currentPhotometryCoverage,
			requestedImages: fixture.outputs.requestedImageUploadOrder,
			claimBoundary: fixture.claimBoundary,
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation: 'Build the exact brightest-2,000 BSC V/50 catalog roster, prove the accepted production 500 is its exact prefix, report current Pickles/Johnson Native15 coverage, and render catalog-inventory figures before gates.',
			implementation: [BUILDER_RELATIVE_PATH, HARNESS_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			transformations: [
				'authenticated local TSV parse',
				'ascending visual-magnitude and HR ranking',
				'canonical J2000 direction derivation',
				'current-policy Native15 B/V bracket coverage analysis without packet materialization',
				'native Canvas2D catalog visualization',
			],
			exclusions: [
				'no member omission',
				'no member replacement',
				'no B-V clamp',
				'no spectral packet output',
				'no atmospheric transport',
				'no stellar appearance or onset claim',
				'no runtime integration',
				'no production change',
			],
		},
		environment: {
			schemaId: `${SCHEMA_PREFIX}-environment-v1`,
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 300000,
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md',
			productionPrefix: PRODUCTION_SNAPSHOT_RELATIVE_PATH,
		},
	});
	let finalizationStarted = false;
	let rosterWritten = false;
	let imageCount = 0;
	let implementationBefore = null;
	let implementationAfter = null;
	let protectedBefore = null;
	let protectedAfter = null;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR6B color-reset lane');
		await assertNoReparseEntries(CATALOG_ROOT, 'CR6B catalog inputs');
		verifyFixtureContract(fixture);
		const authoredInputs = await verifyAuthoredInputs();
		await run.writeJsonArtifact('evidence/authored-input-identities.json', authoredInputs);

		implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		protectedBefore = await captureProtectedSources();
		await run.writeJsonArtifact('evidence/protected-sources-before.json', protectedBefore);

		const catalogText = await readFile(CATALOG_PATH, 'utf8');
		const catalog = buildCr6bBrightest2000Catalog(catalogText);
		const catalogInspection = inspectCatalog(catalog, fixture);
		const prefixComparison = compareProductionPrefix(catalog.members);
		const [templates, johnsonB, johnsonV] = await Promise.all([
			loadPicklesV1998(PICKLES_PATH),
			loadSvoJohnsonFilter(JOHNSON_B_PATH),
			loadSvoJohnsonFilter(JOHNSON_V_PATH),
		]);
		const coverage = analyzeCr6bCurrentPhotometryCoverage({
			members: catalog.members,
			templates,
			johnsonB,
			johnsonV,
		});
		const coverageInspection = inspectCoverage(coverage, catalog.members, fixture);

		await run.writeJsonArtifact(
			fixture.outputs.roster,
			rosterArtifact(catalog, coverageInspection, fixture, authoredInputs),
		);
		rosterWritten = true;
		const rosterCompletedAt = new Date().toISOString();
		const rosterPath = path.join(run.runDirectory, ...fixture.outputs.roster.split('/'));
		const rosterFacts = await verifyOrdinaryFile(rosterPath, 'CR6B roster artifact');
		const rosterIdentity = {
			path: fixture.outputs.roster,
			url: `/${fixture.outputs.roster}`.replace('/data/', '/run/data/'),
			schemaId: `${SCHEMA_PREFIX}-roster-v1`,
			byteLength: rosterFacts.size,
			sha256: await sha256File(rosterPath),
		};
		await run.writeJsonArtifact(fixture.outputs.photometryCoverage, coverageInspection);
		await run.writeJsonArtifact('evidence/catalog-inspection.json', catalogInspection);
		await run.writeJsonArtifact('evidence/production-first-500-prefix-comparison.json', prefixComparison);

		await run.writeJsonArtifact('browser/config.json', {
			...fixture,
			browserInput: {
				rosterUrl: rosterIdentity.url,
				rosterArtifactPath: fixture.outputs.roster,
				rosterArtifact: rosterIdentity,
			},
		});
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr6b-brightest-2000-catalog-browser.js',
			exportName: 'runCr6bBrightest2000CatalogBrowser',
			servedRoots: {'/run/': run.runDirectory},
			allowedArtifactPaths: fixture.outputs.requestedImageUploadOrder,
			uploadLimitBytes: 32 * 1024 * 1024,
			timeoutMilliseconds: 300000,
		});
		imageCount = browser.uploads.length;
		const dimensions = imageDimensionsByPath(fixture);
		const images = [];
		for (const artifactPath of fixture.outputs.requestedImageUploadOrder) {
			images.push(await inspectPng(run, artifactPath, dimensions.get(artifactPath)));
		}

		await run.writeJsonArtifact(fixture.outputs.analysis, {
			schemaId: `${SCHEMA_PREFIX}-analysis-v1`,
			claimBoundary: fixture.claimBoundary,
			fixture: {path: FIXTURE_RELATIVE_PATH, sha256: FIXTURE_SHA256},
			catalog: catalogInspection,
			productionPrefix: prefixComparison,
			currentPhotometryCoverage: coverageInspection,
			roster: {
				...rosterIdentity,
				selectedMemberCount: catalog.members.length,
				completedAt: rosterCompletedAt,
			},
			browser: {
				result: browser.result,
				uploads: browser.uploads,
				progressEvents: browser.progressEvents,
				serverErrors: browser.serverErrors,
				runtimeEnvironment: browser.runtimeEnvironment,
			},
			images,
		});

		implementationAfter = await captureImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		assertImplementationUnchanged(implementationBefore, implementationAfter);
		protectedAfter = await captureProtectedSources();
		await run.writeJsonArtifact('evidence/protected-sources-after.json', protectedAfter);
		assertProtectedSourcesUnchanged(protectedBefore, protectedAfter);

		const progress = {
			schemaId: `${SCHEMA_PREFIX}-progress-v1`,
			initializedAt: run.initializedAt,
			rosterCompletedAt,
			rosterWritten,
			memberCount: catalog.members.length,
			completedImageCount: images.length,
			requestedImageCount: fixture.outputs.requestedImageUploadOrder.length,
			lastImageCompletedAt: browser.uploads.at(-1)?.completedAt ?? null,
		};
		await run.writeJsonArtifact(fixture.outputs.progress, progress);
		const gateEvaluationStartedAt = new Date().toISOString();
		const decision = evaluateGates({
			fixture,
			authoredInputs,
			catalog,
			catalogInspection,
			prefixComparison,
			coverageInspection,
			browser,
			images,
			gateEvaluationStartedAt,
		});
		const conclusion = decision.accepted ? 'accepted' : 'rejected';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			catalogRosterAccepted: decision.accepted,
			gateEvaluationStartedAt,
			gates: decision.gates,
			claimBoundary: fixture.claimBoundary,
			memberCount: catalog.members.length,
			productionPrefix: prefixComparison,
			currentPhotometryCoverage: coverageInspection,
			images,
			progress,
		};
		await run.writeJsonArtifact(fixture.outputs.proof, proof);
		const report = [
			`# ${run.runId}: CR6B brightest-2,000 catalog proof`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			`The authenticated BSC V/50 source produced ${catalog.members.length} ordered roster members; the accepted production ${prefixComparison.productionMemberCount} are an exact prefix: **${prefixComparison.exact}**.`,
			'',
			`The current Pickles/Johnson Native15 policy covers ${coverageInspection.coveredMemberCount} members and leaves ${coverageInspection.unsupportedMemberCount} explicitly retained coverage exceptions: ${coverageInspection.unsupportedMembers.map(({memberId, bMinusV}) => `${memberId} (B-V ${bMinusV})`).join(', ')}.`,
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'This accepts only the exact catalog roster and its evidence. It materializes no spectral packets and makes no runtime, performance, stellar-appearance, onset, or production claim.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const verification = await verifyColorResetRun(run.runId);
		requireCondition(verification.verified === true, 'CR6B terminal run verification failed.');
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: verification.verified,
			memberCount: catalog.members.length,
			productionPrefixExact: prefixComparison.exact,
			coveredMemberCount: coverageInspection.coveredMemberCount,
			unsupportedMembers: coverageInspection.unsupportedMembers,
			imageCount: images.length,
			gates: decision.gates,
		}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			await run.writeJsonArtifact(fixture.outputs.progress, {
				schemaId: `${SCHEMA_PREFIX}-progress-v1`,
				initializedAt: run.initializedAt,
				failedAt: new Date().toISOString(),
				rosterWritten,
				completedImageCount: imageCount,
				error: error instanceof Error ? error.message : String(error),
			});
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: `${SCHEMA_PREFIX}-failure-v1`,
				error: {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : null,
				},
				rosterWritten,
				completedImageCount: imageCount,
				implementationBeforeRecorded: implementationBefore !== null,
				implementationAfterRecorded: implementationAfter !== null,
				protectedBeforeRecorded: protectedBefore !== null,
				protectedAfterRecorded: protectedAfter !== null,
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					schemaId: `${SCHEMA_PREFIX}-failed-result-v1`,
					accepted: false,
					catalogRosterAccepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR6B brightest-2,000 catalog proof\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
