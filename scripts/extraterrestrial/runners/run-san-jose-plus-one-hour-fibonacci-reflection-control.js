#!/usr/bin/env node

import {execFile as executeFile} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../harness/lib/containment.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {verifyRun} from './verify-run.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-san-jose-plus-one-hour-fibonacci-reflection-control.js';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executeFileAsync = promisify(executeFile);
const SCREEN_PALETTE_ROOT = path.join(EXPERIMENT_ROOT, 'stellar-screen-palette');
const CANDIDATE_ROOT = path.join(EXPERIMENT_ROOT, 'candidate');
const BASELINE_ROOT = path.join(EXPERIMENT_ROOT, 'baseline');
const FIXTURES_ROOT = path.join(EXPERIMENT_ROOT, 'fixtures');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PARENT = Object.freeze({
	runId: '000469-san-jose-plus-one-hour-w27-horizon-trace',
	artifactSetSha256: 'f01e04228d1ffe65790178bba33a0c5ce08910c2d318ba2517a544193ade8d2c',
	horizonTraceArtifact: 'evidence/horizon-trace.json',
	horizonTraceSha256: 'e2a6567eab378d0dc20c46dd26bda1136a5ba6a8b8489f2e2485136c9adb68d7',
	artifacts: Object.freeze([
		'browser/config.json',
		'evidence/proof.json',
		'evidence/horizon-trace.json',
		'figures/horizon-radiance-by-roll.svg',
		'references/000466-source-exposure-sunset-plus-one-hour.png',
	]),
});
const FIXTURE_INPUTS = Object.freeze([
	Object.freeze({
		id: 'subjectiveGlobeContextScenes',
		fileName: 'subjective-globe-context-scenes-v1.json',
	}),
	Object.freeze({
		id: 'g4CpuSunDiskTransport',
		fileName: 'g4-cpu-sun-disk-transport-v1.json',
	}),
]);
const TRACE = Object.freeze({
	minimumOffsetDegrees: -90,
	maximumOffsetDegrees: 90,
	stepDegrees: 0.5,
	elevationDegrees: 0,
});
const MAXIMUM_SCATTERING_ORDERS = Object.freeze([1, 2, 4]);
const QUADRATURE_IDS = Object.freeze([
	'fibonacci-34',
	'reflection-completed-fibonacci-68',
]);
const CPU_GPU_PARITY_OFFSETS_DEGREES = Object.freeze([
	-60,
	-58,
	-52,
	-45,
	-31,
	0,
	31,
	45,
	52,
	58,
	60,
]);
const PRODUCTION_REFERENCE_EXPECTED = Object.freeze([
	Object.freeze({
		path: 'sampling-domains/direction/fibonacci/Fibonacci34DirectionDomain.js',
		sha256: '8520122a5bd2cef132616e3299af03c9b63b7739b8d8af9cc0b60f22f3538b5c',
	}),
	Object.freeze({
		path: 'sampling-domains/direction/fibonacci/ReflectionCompletedFibonacci68DirectionDomain.js',
		sha256: '18bda209df714678312dede7fa47a4240549a9ccfb6381b35a1a5f49e5e1bda5',
	}),
]);
const PRODUCTION_REFERENCE_FILES = Object.freeze(
	PRODUCTION_REFERENCE_EXPECTED.map((entry) => entry.path),
);
const EXPECTED_SELECTION_IDENTITIES = Object.freeze({
	fibonacci34: Object.freeze({
		selectionId: 'algorithm32-distant-sun-cpu-native48-w27-v1',
		selectionContentHash:
			'sha256:8dcbf7af5ba14fd313712a8508de8dca86d4a433e70e3f5ca9527187a3ed9e7b',
		domainId: 'algorithm32-fibonacci-34-incoming-v1',
		domainContentHash:
			'sha256:1e9784b6b940f154cbd3d69988e23c993c24f9cc12853aac993aa4d14c12141c',
	}),
	fibonacci68: Object.freeze({
		selectionId:
			'contained-distant-sun-native48-reflection-completed-fibonacci68-w27-control-v1',
		selectionContentHash:
			'sha256:812b4e476716d1362d696225c1c5232e9c0e908dd5d881c5e76531b8801a0e32',
		domainId:
			'contained-reflection-completed-fibonacci-68-incoming-control-v1',
		domainContentHash:
			'sha256:fb6ad49f2d8efa5561771c0b9282f64d80efdad69d330c23ebecee7c7b329cab',
	}),
});
const GATES = Object.freeze({
	domainWeightToleranceSteradians: 1e-12,
	parentReproductionAbsoluteSpectralTolerance: 1e-12,
	parentReproductionRelativeSpectralTolerance: 1e-5,
	spectralEquivalenceAbsoluteTolerance: 1e-12,
	spectralEquivalenceRelativeTolerance: 1e-5,
	n2EvenProjectionAbsoluteTolerance: 1e-12,
	n2EvenProjectionRelativeTolerance: 1e-4,
	n1MaximumNormalizedLuminanceAsymmetry: 0.10,
	n1NormalizedLuminanceMirrorRmse: 0.03,
	n1MaximumRelativeQuadratureDifference: 1e-5,
	maximumTraceDirectionMirrorComponentError: 1e-12,
	laterOrderMaximumAsymmetryCollapseFactor: 0.50,
	laterOrderMirrorRmseCollapseFactor: 0.50,
	maximumFibonacci68LaterOrderMirrorRmse: 0.10,
	minimumFibonacci34N4MaximumNormalizedLuminanceAsymmetry: 1.5,
	minimumFibonacci34N4MirrorRmse: 1.0,
	expectedFibonacci34N4BrightestOffsetDegrees: 52,
	fibonacci34N4BrightestOffsetToleranceDegrees: 0.5,
	cpuGpuAbsoluteTolerance: 1e-12,
	cpuGpuRelativeTolerance: 1e-5,
	minimumPhysicalPathRadiance: 0,
	minimumPhysicalPhotopicLuminance: 0,
	maximumDomainUnitLengthError: 1e-12,
	maximumHalfOrdinaryWeightDeltaSteradians: 0,
});
const MODULE_CLOSURE_ENTRY_FILES = Object.freeze([
	'runners/run-san-jose-plus-one-hour-fibonacci-reflection-control.js',
	'stellar-screen-palette/ControlledDistantSunLightSource.js',
	'stellar-screen-palette/ReflectionCompletedFibonacci68Control.js',
	'stellar-screen-palette/run-san-jose-plus-one-hour-fibonacci-reflection-control-browser.js',
]);
const MODULE_CLOSURE_ALLOWED_NODE_BUILTINS = Object.freeze([
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
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function contentType(target) {
	if (target.endsWith('.js')) return 'text/javascript; charset=utf-8';
	if (target.endsWith('.json')) return 'application/json; charset=utf-8';
	if (target.endsWith('.html')) return 'text/html; charset=utf-8';
	return 'application/octet-stream';
}

async function inventoryProduction() {
	const [algorithm32, flat32] = await Promise.all([
		createFileInventory(ALGORITHM32_ROOT),
		createFileInventory(FLAT32_ROOT),
	]);
	return {algorithm32, flat32};
}

async function removeBrowserProfile(profilePath) {
	await assertExistingRealPathContained(
		OUTPUT_ROOT,
		profilePath,
		'Chrome Fibonacci-reflection-control profile',
	);
	await assertNoReparseEntries(
		profilePath,
		'Chrome Fibonacci-reflection-control profile',
	);
	await rm(profilePath, {recursive: true, force: true});
}

async function buildImplementationClosure() {
	return buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: MODULE_CLOSURE_ENTRY_FILES,
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: MODULE_CLOSURE_ALLOWED_NODE_BUILTINS,
	});
}

async function describeImplementationClosure(closure) {
	const fileArtifacts = [];
	for (const relativePath of closure.files) {
		const absolutePath = await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			path.join(EXPERIMENT_ROOT, ...relativePath.split('/')),
			`implementation module ${relativePath}`,
		);
		const info = await lstat(absolutePath);
		fileArtifacts.push({
			path: relativePath,
			sha256: await sha256File(absolutePath),
			byteLength: info.size,
		});
	}
	return {...closure, fileArtifacts};
}

async function serve(run) {
	const requests = [];
	const roots = new Map([
		['/browser/', path.join(run.runDirectory, 'browser')],
		['/parent-000469/', path.join(run.runDirectory, 'references', '000469')],
		['/screen-palette/', SCREEN_PALETTE_ROOT],
		['/candidate/', CANDIDATE_ROOT],
		['/fixtures/', FIXTURES_ROOT],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const server = createServer(async (request, response) => {
		try {
			const pathname = decodeURIComponent(
				new URL(request.url, 'http://127.0.0.1').pathname,
			);
			requests.push(pathname);
			const route = [...roots].find(([prefix]) => pathname.startsWith(prefix));
			if (!route || pathname.includes('..')) {
				throw new Error('Unsupported Fibonacci-reflection-control path.');
			}
			const [prefix, root] = route;
			const target = path.resolve(root, pathname.slice(prefix.length));
			if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) {
				throw new Error('Fibonacci-reflection-control path escapes its route root.');
			}
			const info = await lstat(target);
			if (!info.isFile() || info.isSymbolicLink()) {
				throw new Error('Fibonacci-reflection-control target is not a real file.');
			}
			const [canonicalRoot, canonicalTarget] = await Promise.all([
				realpath(root),
				realpath(target),
			]);
			if (!canonicalTarget.startsWith(`${canonicalRoot}${path.sep}`)) {
				throw new Error('Fibonacci-reflection-control real path escapes its route root.');
			}
			response.writeHead(200, {'content-type': contentType(target)});
			response.end(await readFile(canonicalTarget));
		} catch (error) {
			response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
			response.end(error.message);
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	return {
		url: `http://127.0.0.1:${server.address().port}/browser/index.html`,
		requests,
		close: () => new Promise((resolve, reject) =>
			server.close((error) => error ? reject(error) : resolve())),
	};
}

function csvCell(value) {
	const text = String(value ?? '');
	return /[",\r\n]/u.test(text)
		? `"${text.replaceAll('"', '""')}"`
		: text;
}

function denseTraceCsv(result) {
	const channelColumns = Array.from({length: 15}, (_, index) => `lambda_${index}`);
	const rows = [[
		'quadrature_id',
		'maximum_scattering_order',
		'index',
		'offset_degrees',
		'azimuth_degrees',
		'direction_x',
		'direction_y',
		'direction_z',
		'photopic_luminance_cd_m2',
		...channelColumns,
	]];
	for (const condition of result.conditions) {
		for (const sample of condition.samples) {
			rows.push([
				condition.quadratureId,
				condition.maximumScatteringOrder,
				sample.index,
				sample.offsetDegrees,
				sample.azimuthDegrees,
				...sample.directionModel,
				sample.photopicLuminanceCdPerSquareMeter,
				...sample.pathRadiance,
			]);
		}
	}
	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function mirrorPairsCsv(result) {
	const rows = [[
		'quadrature_id',
		'maximum_scattering_order',
		'absolute_offset_degrees',
		'negative_y_cd_m2',
		'positive_y_cd_m2',
		'signed_difference_cd_m2',
		'normalized_luminance_asymmetry',
		'maximum_normalized_spectral_asymmetry',
	]];
	for (const condition of result.conditions) {
		for (const pair of condition.mirror.pairs) {
			rows.push([
				condition.quadratureId,
				condition.maximumScatteringOrder,
				pair.absoluteOffsetDegrees,
				pair.negativePhotopicLuminanceCdPerSquareMeter,
				pair.positivePhotopicLuminanceCdPerSquareMeter,
				pair.signedLuminanceDifferenceCdPerSquareMeter,
				pair.normalizedLuminanceAsymmetry,
				pair.maximumNormalizedSpectralAsymmetry,
			]);
		}
	}
	return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function normalizeParentRollZero(parentEvidence) {
	requireCondition(
		parentEvidence.result?.schemaId
			=== 'san-jose-plus-one-hour-horizon-path-radiance-roll-trace-v2',
		'Copied run-000469 horizon trace has the wrong schema.',
	);
	const rollZero = parentEvidence.result.rolls.filter((roll) =>
		roll.rollDegrees === 0);
	requireCondition(
		rollZero.length === 1 && rollZero[0].samples.length === 361,
		'Copied run-000469 horizon trace must contain one 361-ray roll-zero oracle.',
	);
	return {
		schemaId: parentEvidence.result.schemaId,
		scene: parentEvidence.result.scene,
		trace: parentEvidence.result.trace,
		roll: rollZero[0],
		samples: rollZero[0].samples.map((sample) => ({
			index: sample.index,
			offsetDegrees: sample.offsetDegrees,
			azimuthDegrees: sample.azimuthDegrees,
			directionModel: sample.directionModel,
			pathRadiance: sample.gpu.pathRadiance,
			photopicLuminanceCdPerSquareMeter:
				sample.gpu.photopicLuminanceCdPerSquareMeter,
		})),
	};
}

function summarizeMirrorSamples(samples) {
	requireCondition(samples.length % 2 === 1, 'Mirror oracle requires one center sample.');
	const centerIndex = (samples.length - 1) / 2;
	let maximumNormalizedLuminanceAsymmetry = 0;
	let maximumNormalizedSpectralAsymmetry = 0;
	let squaredLuminanceDifference = 0;
	let squaredLuminanceMagnitude = 0;
	for (let delta = 1; delta <= centerIndex; delta += 1) {
		const negative = samples[centerIndex - delta];
		const positive = samples[centerIndex + delta];
		const negativeY = negative.photopicLuminanceCdPerSquareMeter;
		const positiveY = positive.photopicLuminanceCdPerSquareMeter;
		const difference = positiveY - negativeY;
		maximumNormalizedLuminanceAsymmetry = Math.max(
			maximumNormalizedLuminanceAsymmetry,
			Math.abs(difference) / Math.max(
				0.5 * (Math.abs(positiveY) + Math.abs(negativeY)),
				1e-30,
			),
		);
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			const negativeValue = negative.pathRadiance[channelIndex];
			const positiveValue = positive.pathRadiance[channelIndex];
			maximumNormalizedSpectralAsymmetry = Math.max(
				maximumNormalizedSpectralAsymmetry,
				Math.abs(positiveValue - negativeValue) / Math.max(
					0.5 * (Math.abs(positiveValue) + Math.abs(negativeValue)),
					1e-30,
				),
			);
		}
		squaredLuminanceDifference += difference * difference;
		squaredLuminanceMagnitude += 0.5
			* (positiveY * positiveY + negativeY * negativeY);
	}
	const brightest = samples.reduce((selected, sample) =>
		sample.photopicLuminanceCdPerSquareMeter
			> selected.photopicLuminanceCdPerSquareMeter
			? sample
			: selected);
	return {
		maximumNormalizedLuminanceAsymmetry,
		normalizedLuminanceMirrorRmse: Math.sqrt(
			squaredLuminanceDifference
				/ Math.max(squaredLuminanceMagnitude, 1e-60),
		),
		maximumNormalizedSpectralAsymmetry,
		brightest: {
			offsetDegrees: brightest.offsetDegrees,
			photopicLuminanceCdPerSquareMeter:
				brightest.photopicLuminanceCdPerSquareMeter,
		},
		centerPhotopicLuminanceCdPerSquareMeter:
			samples[centerIndex].photopicLuminanceCdPerSquareMeter,
	};
}

function compareFreshFibonacci34N4ToParent(parentSamples, freshSamples) {
	requireCondition(
		parentSamples.length === freshSamples.length,
		'Parent and fresh FIB34 N4 traces have different lengths.',
	);
	let coordinateMismatchCount = 0;
	let maximumDirectionComponentDelta = 0;
	let maximumAbsoluteSpectralResidual = 0;
	let maximumRelativeSpectralResidual = 0;
	let maximumToleranceRatio = 0;
	let spectralFailureCount = 0;
	let maximumAbsoluteLuminanceResidual = 0;
	let worstSpectralResidual = null;
	for (let sampleIndex = 0; sampleIndex < parentSamples.length; sampleIndex += 1) {
		const parent = parentSamples[sampleIndex];
		const fresh = freshSamples[sampleIndex];
		if (parent.index !== fresh.index
			|| parent.offsetDegrees !== fresh.offsetDegrees
			|| parent.azimuthDegrees !== fresh.azimuthDegrees) {
			coordinateMismatchCount += 1;
		}
		for (let component = 0; component < 3; component += 1) {
			maximumDirectionComponentDelta = Math.max(
				maximumDirectionComponentDelta,
				Math.abs(parent.directionModel[component] - fresh.directionModel[component]),
			);
		}
		maximumAbsoluteLuminanceResidual = Math.max(
			maximumAbsoluteLuminanceResidual,
			Math.abs(
				parent.photopicLuminanceCdPerSquareMeter
					- fresh.photopicLuminanceCdPerSquareMeter,
			),
		);
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			const parentValue = parent.pathRadiance[channelIndex];
			const freshValue = fresh.pathRadiance[channelIndex];
			const residual = Math.abs(freshValue - parentValue);
			const allowed = GATES.parentReproductionAbsoluteSpectralTolerance
				+ GATES.parentReproductionRelativeSpectralTolerance
					* Math.abs(parentValue);
			const relativeResidual = residual / Math.max(Math.abs(parentValue), 1e-30);
			const toleranceRatio = residual / Math.max(allowed, 1e-30);
			maximumAbsoluteSpectralResidual = Math.max(
				maximumAbsoluteSpectralResidual,
				residual,
			);
			maximumRelativeSpectralResidual = Math.max(
				maximumRelativeSpectralResidual,
				relativeResidual,
			);
			maximumToleranceRatio = Math.max(maximumToleranceRatio, toleranceRatio);
			if (residual > allowed) spectralFailureCount += 1;
			if (worstSpectralResidual === null
				|| toleranceRatio > worstSpectralResidual.toleranceRatio) {
				worstSpectralResidual = {
					sampleIndex,
					offsetDegrees: fresh.offsetDegrees,
					channelIndex,
					parentValue,
					freshValue,
					residual,
					allowed,
					toleranceRatio,
				};
			}
		}
	}
	return {
		policy: 'runner-independent-fresh-fibonacci34-n4-versus-verified-000469-roll0-v1',
		tolerance: {
			absolute: GATES.parentReproductionAbsoluteSpectralTolerance,
			relative: GATES.parentReproductionRelativeSpectralTolerance,
		},
		sampleCount: parentSamples.length,
		spectralScalarCount: parentSamples.length * 15,
		coordinateMismatchCount,
		maximumDirectionComponentDelta,
		maximumAbsoluteSpectralResidual,
		maximumRelativeSpectralResidual,
		maximumToleranceRatio,
		spectralFailureCount,
		maximumAbsoluteLuminanceResidual,
		worstSpectralResidual,
	};
}

function compareControlledPairIsolation(fibonacci34, fibonacci68) {
	const leftRecord = fibonacci34.construction;
	const rightRecord = fibonacci68.construction;
	const fieldComparisons = leftRecord.fields.map((left, index) => {
		const right = rightRecord.fields[index];
		requireCondition(right, 'Controlled pair has different field counts.');
		const leftStorage = {...left.storage};
		const rightStorage = {...right.storage};
		delete leftStorage.width;
		delete rightStorage.width;
		const incomingWidthDifference = left.storage.width !== right.storage.width;
		const leftDescriptorCore = {...left.descriptor};
		const rightDescriptorCore = {...right.descriptor};
		for (const descriptor of [leftDescriptorCore, rightDescriptorCore]) {
			delete descriptor.directionDomain;
			delete descriptor.layout;
		}
		const descriptorCoreEqual = JSON.stringify(leftDescriptorCore)
			=== JSON.stringify(rightDescriptorCore);
		const layoutIdentityDiffers = JSON.stringify(left.descriptor.layout)
			!== JSON.stringify(right.descriptor.layout);
		const directionDomainRelationship = incomingWidthDifference
			? left.descriptor.directionRole === 'incoming-radiance'
				&& right.descriptor.directionRole === 'incoming-radiance'
				&& left.descriptor.directionDomain.id
					=== leftRecord.incomingDirectionDomainId
				&& left.descriptor.directionDomain.contentHash
					=== leftRecord.incomingDirectionDomainContentHash
				&& right.descriptor.directionDomain.id
					=== rightRecord.incomingDirectionDomainId
				&& right.descriptor.directionDomain.contentHash
					=== rightRecord.incomingDirectionDomainContentHash
			: left.descriptor.directionRole === 'outgoing-scattering-density'
				&& right.descriptor.directionRole
					=== 'outgoing-scattering-density'
				&& JSON.stringify(left.descriptor.directionDomain)
					=== JSON.stringify(right.descriptor.directionDomain);
		return {
			index,
			leftId: left.id,
			rightId: right.id,
			leftWidth: left.storage.width,
			rightWidth: right.storage.width,
			incomingWidthDifference,
			idEqual: left.id === right.id,
			nonWidthStorageEqual:
				JSON.stringify(leftStorage) === JSON.stringify(rightStorage),
			descriptorContentHashEqual:
				left.descriptorContentHash === right.descriptorContentHash,
			descriptorCoreEqual,
			directionDomainRelationship,
			layoutIdentityDiffers,
			expectedDifferenceOnly: left.id === right.id
				&& JSON.stringify(leftStorage) === JSON.stringify(rightStorage)
				&& descriptorCoreEqual
				&& directionDomainRelationship
				&& layoutIdentityDiffers
				&& left.descriptorContentHash !== right.descriptorContentHash
				&& (!incomingWidthDifference
					|| left.storage.width === 34 && right.storage.width === 68),
		};
	});
	const ownerIdentityEquality = Object.fromEntries(
		['source', 'atmosphere', 'geometry', 'boundary'].map((owner) => [
			owner,
			JSON.stringify(
				fibonacci34.cacheDescriptor.constructionIdentities[owner],
			) === JSON.stringify(
				fibonacci68.cacheDescriptor.constructionIdentities[owner],
			),
		]),
	);
	return {
		policy: 'same-physical-owners-and-plan-graph-except-controlled-incoming-domain-v1',
		order: fibonacci34.maximumScatteringOrder,
		conditionRecordCoherence: fibonacci34.id
			=== `${fibonacci34.quadratureId}-n${fibonacci34.maximumScatteringOrder}`
			&& fibonacci68.id
				=== `${fibonacci68.quadratureId}-n${fibonacci68.maximumScatteringOrder}`
			&& leftRecord.maximumScatteringOrder
				=== fibonacci34.maximumScatteringOrder
			&& rightRecord.maximumScatteringOrder
				=== fibonacci68.maximumScatteringOrder,
		physicalOwnerDescriptorsEqual: JSON.stringify(
			fibonacci34.physicalOwnerDescriptors,
		) === JSON.stringify(fibonacci68.physicalOwnerDescriptors),
		ownerIdentityEquality,
		geometryConstructionIdentityDifferencePolicy:
			'Expected: candidate geometry construction identity binds the controlled incoming-domain data/id even though the physical geometry descriptor is exact-equal.',
		planIdentity: {
			left: leftRecord.planIdentity,
			right: rightRecord.planIdentity,
			idEqual: leftRecord.planIdentity.id === rightRecord.planIdentity.id,
			contentHashDistinct: leftRecord.planIdentity.contentHash
				!== rightRecord.planIdentity.contentHash,
		},
		controlsEqual: JSON.stringify(fibonacci34.cacheDescriptor.controls)
			=== JSON.stringify(fibonacci68.cacheDescriptor.controls),
		passGraphEqual: JSON.stringify(leftRecord.passes)
			=== JSON.stringify(rightRecord.passes),
		planResultEqual: leftRecord.planResult === rightRecord.planResult,
		fieldCountEqual: leftRecord.fields.length === rightRecord.fields.length,
		fieldComparisons,
		onlyExpectedFieldDifferences:
			fieldComparisons.every((field) => field.expectedDifferenceOnly),
		allRawDescriptorContentHashesDiffer: fieldComparisons.every((field) =>
			field.descriptorContentHashEqual === false),
		rawDescriptorNamespacePolicy:
			'Expected candidate behavior: every custom-selection layout/field identity is namespaced by domains.id, so raw descriptor hashes differ even for semantically unchanged W27 fields; normalized field semantics are gated independently.',
		incomingWidthDifferenceCount: fieldComparisons.filter((field) =>
			field.incomingWidthDifference).length,
		cacheIncomingMatchesControlledSelection: [fibonacci34, fibonacci68]
			.every((condition) =>
				condition.cacheDescriptor.incomingDirectionDomain.id
					=== condition.construction.incomingDirectionDomainId
				&& condition.cacheDescriptor.incomingDirectionDomain.contentHash
					=== condition.construction
						.incomingDirectionDomainContentHash),
	};
}

function polyline(points, color, width = 2) {
	return `<polyline fill="none" stroke="${color}" stroke-width="${width}" points="${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}"/>`;
}

function diagnosticSvg(result) {
	const width = 1200;
	const height = 1040;
	const left = 88;
	const right = 30;
	const plotWidth = width - left - right;
	const panelHeight = 245;
	const panelGap = 65;
	const firstTop = 105;
	const x = (offset) => left
		+ (offset - TRACE.minimumOffsetDegrees)
		/ (TRACE.maximumOffsetDegrees - TRACE.minimumOffsetDegrees)
		* plotWidth;
	const fragments = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
		'<rect width="100%" height="100%" fill="#11151b"/>',
		'<style>text{font-family:Segoe UI,Arial,sans-serif;fill:#e8edf4}.grid{stroke:#303844;stroke-width:1}</style>',
		'<text x="88" y="34" font-size="22">San Jose sunset +1 h: reflected Fibonacci causal control</text>',
		'<text x="88" y="59" font-size="13" fill="#aeb8c4">Same Native48/W27/native-15 transport and 361 horizontal rays. Orange: ordinary FIB34. Cyan: exact y-reflection-completed FIB68.</text>',
	];
	for (const [panelIndex, order] of MAXIMUM_SCATTERING_ORDERS.entries()) {
		const top = firstTop + panelIndex * (panelHeight + panelGap);
		const conditions = QUADRATURE_IDS.map((quadratureId) =>
			result.conditions.find((condition) =>
				condition.quadratureId === quadratureId
					&& condition.maximumScatteringOrder === order));
		requireCondition(conditions.every(Boolean), `SVG N${order} conditions are incomplete.`);
		const positive = conditions.flatMap((condition) =>
			condition.samples.map((sample) =>
				sample.photopicLuminanceCdPerSquareMeter))
			.filter((value) => value > 0);
		const floor = Math.max(Math.min(...positive) * 0.5, 1e-30);
		const logs = conditions.flatMap((condition) => condition.samples.map((sample) =>
			Math.log10(Math.max(sample.photopicLuminanceCdPerSquareMeter, floor))));
		const logMinimum = Math.min(...logs);
		const logMaximum = Math.max(...logs);
		const span = Math.max(logMaximum - logMinimum, 1e-12);
		const y = (value) => top + panelHeight
			- (Math.log10(Math.max(value, floor)) - logMinimum) / span * panelHeight;
		fragments.push(`<rect x="${left}" y="${top}" width="${plotWidth}" height="${panelHeight}" fill="#171d25" stroke="#56606c"/>`);
		for (const tick of [-90, -60, -30, 0, 30, 60, 90]) {
			fragments.push(`<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${top + panelHeight}"/>`);
		}
		for (let tick = 0; tick <= 4; tick += 1) {
			const py = top + panelHeight - panelHeight * tick / 4;
			const label = logMinimum + span * tick / 4;
			fragments.push(`<line class="grid" x1="${left}" x2="${left + plotWidth}" y1="${py}" y2="${py}"/>`);
			fragments.push(`<text x="${left - 10}" y="${py + 4}" font-size="11" text-anchor="end">${label.toFixed(2)}</text>`);
		}
		const colors = ['#ff9f43', '#46d9ff'];
		for (let conditionIndex = 0; conditionIndex < conditions.length; conditionIndex += 1) {
			fragments.push(polyline(
				conditions[conditionIndex].samples.map((sample) => [
					x(sample.offsetDegrees),
					y(sample.photopicLuminanceCdPerSquareMeter),
				]),
				colors[conditionIndex],
				conditionIndex === 1 ? 2.5 : 2,
			));
		}
		const comparison = result.quadratureComparisons.find((entry) =>
			entry.maximumScatteringOrder === order);
		fragments.push(`<text x="${left}" y="${top - 14}" font-size="16">N${order}: mirror RMSE FIB34 ${conditions[0].mirror.normalizedLuminanceMirrorRmse.toExponential(3)}, FIB68 ${conditions[1].mirror.normalizedLuminanceMirrorRmse.toExponential(3)}, ratio ${comparison.mirrorRmseCollapseFactor.toExponential(3)}</text>`);
		if (panelIndex === MAXIMUM_SCATTERING_ORDERS.length - 1) {
			for (const tick of [-90, -60, -30, 0, 30, 60, 90]) {
				fragments.push(`<text x="${x(tick)}" y="${top + panelHeight + 24}" font-size="12" text-anchor="middle">${tick} deg</text>`);
			}
		}
	}
	fragments.push('<line x1="820" x2="850" y1="82" y2="82" stroke="#ff9f43" stroke-width="3"/>');
	fragments.push('<text x="858" y="87" font-size="12">ordinary FIB34</text>');
	fragments.push('<line x1="980" x2="1010" y1="82" y2="82" stroke="#46d9ff" stroke-width="3"/>');
	fragments.push('<text x="1018" y="87" font-size="12">reflected FIB68</text>');
	fragments.push('<text transform="translate(21 510) rotate(-90)" font-size="13" text-anchor="middle">log10 photopic path-radiance Y [cd m^-2]</text>');
	fragments.push('<text x="629" y="1025" font-size="13" text-anchor="middle">Azimuth offset from source bearing (degrees); zero is the source vertical plane</text>');
	fragments.push('</svg>');
	return fragments.join('\n');
}

function analyze(
	result,
	parentOracle,
	independentParentComparison,
	identityIsolationByOrder,
) {
	const byOrder = result.quadratureComparisons.map((comparison) => ({
		maximumScatteringOrder: comparison.maximumScatteringOrder,
		fibonacci34: {
			maximumNormalizedLuminanceAsymmetry:
				comparison.fibonacci34Mirror.maximumNormalizedLuminanceAsymmetry,
			normalizedLuminanceMirrorRmse:
				comparison.fibonacci34Mirror.normalizedLuminanceMirrorRmse,
			brightestOffsetDegrees:
				comparison.fibonacci34Mirror.brightest.offsetDegrees,
		},
		fibonacci68: {
			maximumNormalizedLuminanceAsymmetry:
				comparison.fibonacci68Mirror.maximumNormalizedLuminanceAsymmetry,
			normalizedLuminanceMirrorRmse:
				comparison.fibonacci68Mirror.normalizedLuminanceMirrorRmse,
			brightestOffsetDegrees:
				comparison.fibonacci68Mirror.brightest.offsetDegrees,
		},
		maximumAsymmetryCollapseFactor:
			comparison.maximumAsymmetryCollapseFactor,
		mirrorRmseCollapseFactor: comparison.mirrorRmseCollapseFactor,
		denseTraceDifference: comparison.denseTraceDifference,
	}));
	const n2 = byOrder.find((entry) => entry.maximumScatteringOrder === 2);
	const n4 = byOrder.find((entry) => entry.maximumScatteringOrder === 4);
	return {
		conclusion: 'The verified run-000469 roll-zero oracle first binds the fresh FIB34 N4 trace to the observed horizon cross-section. At this +1-hour horizontal trace N1 is exact zero for both quadratures, so higher-order path radiance first appears at N2; N2 proves the exact even projection caused by paired half weights, and N4 tests whether exact source-plane reflection completion removes that parent-bound one-dimensional asymmetry. This control does not by itself prove removal of the complete two-dimensional twilight lobes.',
		parentRollZeroOracle: {
			schemaId: parentOracle.schemaId,
			scene: parentOracle.scene,
			trace: parentOracle.trace,
			sampleCount: parentOracle.samples.length,
			mirror: summarizeMirrorSamples(parentOracle.samples),
		},
		parentN4Reproduction: {
			browser: result.parentN4Reproduction,
			runnerIndependent: independentParentComparison,
		},
		identityIsolationByOrder,
		n2CausalLocalization: n2,
		n4LobeAndCorrection: n4,
		byOrder,
	};
}

function report(runId, analysis, assertions) {
	return [
		`# ${runId}: San Jose +1 h reflected-Fibonacci causal control`,
		'',
		'Conclusion: **accepted mechanical one-dimensional causal control**.',
		'',
		analysis.conclusion,
		'',
		`Order summary: ${JSON.stringify(analysis.byOrder)}.`,
		'',
		'N1 is an exact-zero horizontal-path control in this scene; the measured higher-order onset is N2.',
		'',
		`Mechanical and causal assertions: ${assertions.length}.`,
		'',
		'This run changes no production, candidate, baseline, Color, atmosphere, W27, Native48, prior run, or historical evidence. It qualifies removal of the parent-bound one-dimensional horizon cross-section asymmetry only; it does not yet qualify the complete two-dimensional lobe field.',
		'',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The Fibonacci reflection control accepts no arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'san-jose-plus-one-hour-fibonacci-reflection-control',
		command: COMMAND,
		inputs: {
			schemaId: 'san-jose-plus-one-hour-fibonacci-reflection-control-input-v1',
			parent: PARENT,
			trace: TRACE,
			quadratureIds: QUADRATURE_IDS,
			maximumScatteringOrders: MAXIMUM_SCATTERING_ORDERS,
			pathIntervalCount: 15,
			parityOffsetsDegrees: CPU_GPU_PARITY_OFFSETS_DEGREES,
			expectedSelectionIdentities: EXPECTED_SELECTION_IDENTITIES,
			gates: GATES,
			fixtureInputs: FIXTURE_INPUTS.map((fixture) =>
				`scripts/extraterrestrial/fixtures/${fixture.fileName}`),
		},
		provenance: {
			schemaId: 'san-jose-plus-one-hour-fibonacci-reflection-control-provenance-v1',
			operation: 'Copy the retained production reflection-completion equation and pinned ordinary Fibonacci-34 values into containment; inject either ordinary FIB34 or exact [x,y,z]/[x,-y,z] half-weight FIB68 into the otherwise unchanged candidate distant-Sun GPU cache plan; rebuild N1/N2/N4; trace the same 361 pre-Color horizontal rays; and compare source-plane mirror symmetry with same-cache CPU/GPU parity.',
			implementation: MODULE_CLOSURE_ENTRY_FILES.map((file) =>
				`scripts/extraterrestrial/${file}`),
			productionReferenceOnly: PRODUCTION_REFERENCE_EXPECTED.map((entry) => ({
				path: `src/algorithm32/${entry.path}`,
				sha256: entry.sha256,
			})),
				exclusions: [
				'production runtime dependency',
				'production or candidate mutation',
				'baseline mutation',
				'W27 change',
				'Color or exposure change',
				'atmosphere or ozone change',
				'prior-run mutation',
			],
		},
		environment: {
			schemaId: 'san-jose-plus-one-hour-fibonacci-reflection-control-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: CHROME_PATH,
		},
		references: {
			schemaId: 'san-jose-plus-one-hour-fibonacci-reflection-control-references-v1',
			activeTopic: 'agents/topics/active-topic.md',
			productionPlan:
				'agents/topics/extraterrestrial/stellar-screen-palette-production-port-plan.md',
			parent: PARENT,
		},
	});
	let server;
	let browserProfilePath;
	try {
		await assertRepositoryIdentity();
		await Promise.all([
			assertNoReparseEntries(SCREEN_PALETTE_ROOT),
			assertNoReparseEntries(CANDIDATE_ROOT),
			assertNoReparseEntries(BASELINE_ROOT),
			assertNoReparseEntries(FIXTURES_ROOT),
		]);
		const chromeInfo = await lstat(CHROME_PATH);
		requireCondition(
			chromeInfo.isFile() && !chromeInfo.isSymbolicLink(),
			'Chrome executable must be a real non-symlink file.',
		);
		const chromeIdentity = {
			path: CHROME_PATH,
			sha256: await sha256File(CHROME_PATH),
			byteLength: chromeInfo.size,
		};
		const closureBefore = await buildImplementationClosure();
		const [
			implementationClosure,
			experimentPackageInventory,
			threeDependencyInventory,
			candidateInventory,
			baselineInventory,
			productionReferenceInventory,
		] = await Promise.all([
			describeImplementationClosure(closureBefore),
			createSelectedFileInventory(
				EXPERIMENT_ROOT,
				['package.json', 'package-lock.json'],
			),
			createFileInventory(THREE_ROOT),
			createFileInventory(CANDIDATE_ROOT),
			createFileInventory(BASELINE_ROOT),
			createSelectedFileInventory(
				ALGORITHM32_ROOT,
				PRODUCTION_REFERENCE_FILES,
			),
		]);
		const tooling = {
			chrome: chromeIdentity,
			experimentPackageInventory,
			threeDependencyInventory,
			candidateInventory,
			baselineInventory,
			productionReferenceInventory,
		};
		for (const expected of PRODUCTION_REFERENCE_EXPECTED) {
			const actual = productionReferenceInventory.files.find((entry) =>
				entry.path === expected.path);
			requireCondition(
				actual?.sha256 === expected.sha256,
				`Read-only production derivation source ${expected.path} changed from the copied control authority.`,
			);
		}
		const toolingSummary = {
			chrome: chromeIdentity,
			experimentPackageInventory: {
				fileCount: experimentPackageInventory.fileCount,
				aggregateSha256: experimentPackageInventory.aggregateSha256,
			},
			threeDependencyInventory: {
				fileCount: threeDependencyInventory.fileCount,
				aggregateSha256: threeDependencyInventory.aggregateSha256,
			},
			candidateInventory: {
				fileCount: candidateInventory.fileCount,
				aggregateSha256: candidateInventory.aggregateSha256,
			},
			baselineInventory: {
				fileCount: baselineInventory.fileCount,
				aggregateSha256: baselineInventory.aggregateSha256,
			},
			productionReferenceInventory: {
				fileCount: productionReferenceInventory.fileCount,
				aggregateSha256: productionReferenceInventory.aggregateSha256,
			},
		};
		await run.writeJsonArtifact(
			'evidence/implementation-closure.json',
			implementationClosure,
		);
		await run.writeJsonArtifact('evidence/tooling.json', tooling);
		const productionBefore = await inventoryProduction();

		const parentRoot = path.join(RUNS_ROOT, PARENT.runId);
		await assertExistingRealPathContained(RUNS_ROOT, parentRoot, 'run 000469 root');
		await assertNoReparseEntries(parentRoot, 'run 000469 root');
		const parentVerification = await verifyRun(PARENT.runId);
		requireCondition(
			parentVerification.artifactSetSha256 === PARENT.artifactSetSha256,
			'Run 000469 artifact-set identity changed.',
		);
		const parentArtifacts = {};
		for (const artifact of PARENT.artifacts) {
			const sourcePath = await assertExistingRealPathContained(
				parentRoot,
				path.join(parentRoot, ...artifact.split('/')),
				`run 000469 ${artifact}`,
			);
			const info = await lstat(sourcePath);
			requireCondition(
				info.isFile() && !info.isSymbolicLink(),
				`Run 000469 ${artifact} must be a real file.`,
			);
			const targetArtifact = `references/000469/${artifact}`;
			parentArtifacts[artifact] = {
				artifactPath: targetArtifact,
				sha256: await sha256File(sourcePath),
				byteLength: info.size,
			};
			await run.writeArtifact(targetArtifact, await readFile(sourcePath));
		}
		requireCondition(
			parentArtifacts[PARENT.horizonTraceArtifact].sha256
				=== PARENT.horizonTraceSha256,
			'Run 000469 horizon-trace artifact changed from its pinned oracle identity.',
		);
		const copiedParentPath = (artifact) => path.join(
			run.runDirectory,
			...parentArtifacts[artifact].artifactPath.split('/'),
		);
		const parentConfig = JSON.parse(await readFile(
			copiedParentPath('browser/config.json'),
			'utf8',
		));
		const parentProof = JSON.parse(await readFile(
			copiedParentPath('evidence/proof.json'),
			'utf8',
		));
		const parentHorizonTrace = JSON.parse(await readFile(
			copiedParentPath(PARENT.horizonTraceArtifact),
			'utf8',
		));
		const parentOracle = normalizeParentRollZero(parentHorizonTrace);
		requireCondition(
			parentProof.accepted === true,
			'Run 000469 parent proof is not accepted.',
		);
		const scene = parentConfig.scene;
		requireCondition(
			scene?.id === 'sunset-plus-one-hour',
			'Run 000469 omits the exact +1h scene.',
		);
		requireCondition(
			JSON.stringify(parentOracle.scene) === JSON.stringify(scene),
			'Copied run-000469 horizon oracle scene differs from its copied browser config.',
		);
		for (const [key, value] of Object.entries(TRACE)) {
			requireCondition(
				parentOracle.trace[key] === value,
				`Copied run-000469 horizon oracle trace ${key} differs from the control.`,
			);
		}
		requireCondition(
			parentOracle.samples.every((sample, index) =>
				sample.index === index
					&& sample.pathRadiance.length === 15
					&& [
						...sample.directionModel,
						...sample.pathRadiance,
						sample.photopicLuminanceCdPerSquareMeter,
					].every(Number.isFinite)),
			'Copied run-000469 roll-zero oracle contains all 361 finite native-15 GPU samples.',
		);

		const fixtureArtifacts = {};
		for (const fixture of FIXTURE_INPUTS) {
			const sourcePath = await assertExistingRealPathContained(
				FIXTURES_ROOT,
				path.join(FIXTURES_ROOT, fixture.fileName),
				`${fixture.id} fixture`,
			);
			const sourceInfo = await lstat(sourcePath);
			requireCondition(
				sourceInfo.isFile() && !sourceInfo.isSymbolicLink(),
				`${fixture.id} fixture must be a real file.`,
			);
			const artifactPath = `references/fixtures/${fixture.fileName}`;
			fixtureArtifacts[fixture.id] = {
				sourcePath:
					`scripts/extraterrestrial/fixtures/${fixture.fileName}`,
				artifactPath,
				sha256: await sha256File(sourcePath),
				byteLength: sourceInfo.size,
			};
			await run.writeArtifact(artifactPath, await readFile(sourcePath));
		}
		await run.writeJsonArtifact('browser/config.json', {
			schemaId:
				'san-jose-plus-one-hour-fibonacci-reflection-control-browser-config-v1',
			parent: {
				runId: PARENT.runId,
				artifactSetSha256: PARENT.artifactSetSha256,
			},
			parentArtifacts,
			fixtureArtifacts,
			scene,
			trace: TRACE,
			maximumScatteringOrders: MAXIMUM_SCATTERING_ORDERS,
			parentReproductionTolerance: {
				absolute:
					GATES.parentReproductionAbsoluteSpectralTolerance,
				relative:
					GATES.parentReproductionRelativeSpectralTolerance,
			},
			spectralEquivalenceTolerance: {
				absolute: GATES.spectralEquivalenceAbsoluteTolerance,
				relative: GATES.spectralEquivalenceRelativeTolerance,
			},
			n2EvenProjectionTolerance: {
				absolute: GATES.n2EvenProjectionAbsoluteTolerance,
				relative: GATES.n2EvenProjectionRelativeTolerance,
			},
		});
		await run.writeArtifact(
			'browser/index.html',
			'<!doctype html><meta charset="utf-8"><pre id="result">pending</pre><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><script type="module">const target=document.querySelector("#result");try{const {runSanJosePlusOneHourFibonacciReflectionControlBrowser}=await import("/screen-palette/run-san-jose-plus-one-hour-fibonacci-reflection-control-browser.js");target.textContent=JSON.stringify(await runSanJosePlusOneHourFibonacciReflectionControlBrowser());}catch(error){target.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>',
		);
		server = await serve(run);
		browserProfilePath = await assertCreatablePathContained(
			OUTPUT_ROOT,
			path.join(OUTPUT_ROOT, 'browser-profiles', run.runId),
			'Chrome Fibonacci-reflection-control profile',
		);
		await mkdir(browserProfilePath, {recursive: true});
		let browser;
		try {
			browser = await executeFileAsync(CHROME_PATH, [
				'--headless=new',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=swiftshader',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--disable-component-update',
				`--user-data-dir=${browserProfilePath}`,
				'--virtual-time-budget=3300000',
				'--dump-dom',
				server.url,
			], {
				timeout: 3600000,
				maxBuffer: 128 * 1024 * 1024,
				windowsHide: true,
			});
		} catch (error) {
			await run.writeArtifact('browser/dom-on-failure.html', error.stdout ?? '');
			throw error;
		} finally {
			await removeBrowserProfile(browserProfilePath);
			browserProfilePath = null;
		}
		await run.writeArtifact('browser/dom.html', browser.stdout);
		await run.writeArtifact('browser/stderr.txt', browser.stderr);
		await run.writeJsonArtifact('browser/requests.json', server.requests);
		const resultText = /<pre id="result">([\s\S]*?)<\/pre>/u
			.exec(browser.stdout)?.[1];
		requireCondition(resultText, 'Browser emitted no Fibonacci reflection result.');
		const result = JSON.parse(resultText);
		if (result.error) {
			throw new Error(
				`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`,
			);
		}
		const freshFibonacci34N4 = result.conditions.find((condition) =>
			condition.quadratureId === 'fibonacci-34'
				&& condition.maximumScatteringOrder === 4);
		requireCondition(freshFibonacci34N4, 'Fresh FIB34 N4 trace is absent.');
		const parentMirror = summarizeMirrorSamples(parentOracle.samples);
		const independentParentComparison =
			compareFreshFibonacci34N4ToParent(
				parentOracle.samples,
				freshFibonacci34N4.samples,
			);
		const identityIsolationByOrder = MAXIMUM_SCATTERING_ORDERS.map((order) => {
			const fibonacci34 = result.conditions.find((condition) =>
				condition.quadratureId === 'fibonacci-34'
					&& condition.maximumScatteringOrder === order);
			const fibonacci68 = result.conditions.find((condition) =>
				condition.quadratureId === 'reflection-completed-fibonacci-68'
					&& condition.maximumScatteringOrder === order);
			requireCondition(
				fibonacci34 && fibonacci68,
				`N${order} identity-isolation pair is absent.`,
			);
			return compareControlledPairIsolation(fibonacci34, fibonacci68);
		});

		const assertions = [];
		const assert = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};
		assert(
			result.schemaId
				=== 'san-jose-plus-one-hour-fibonacci-reflection-causal-control-v1',
			'Browser returned the fixed Fibonacci reflection-control schema.',
		);
		assert(
			result.inputArtifacts.parent.runId === PARENT.runId
				&& result.inputArtifacts.parent.artifactSetSha256
					=== PARENT.artifactSetSha256,
			'Browser bound the exact verified run-000469 parent identity.',
		);
		assert(
			JSON.stringify(result.inputArtifacts.parentArtifacts)
				=== JSON.stringify(parentArtifacts),
			'Browser bound every copied run-000469 evidence identity.',
		);
		assert(
			server.requests.includes(
				'/parent-000469/evidence/horizon-trace.json',
			),
			'Browser requested the copied and verified run-000469 horizon-trace oracle.',
		);
		const parentTraceIdentity =
			parentArtifacts[PARENT.horizonTraceArtifact];
		assert(
			result.parentRollZeroOracle.runId === PARENT.runId
				&& result.parentRollZeroOracle.artifact
					=== PARENT.horizonTraceArtifact
				&& result.parentRollZeroOracle.artifactIdentity.sha256
					=== parentTraceIdentity.sha256
				&& result.parentRollZeroOracle.artifactIdentity.byteLength
					=== parentTraceIdentity.byteLength,
			'Browser byte-bound the exact copied run-000469 horizon-trace artifact.',
		);
		assert(
			result.parentRollZeroOracle.schemaId === parentOracle.schemaId
				&& JSON.stringify(result.parentRollZeroOracle.scene)
					=== JSON.stringify(parentOracle.scene)
				&& JSON.stringify(result.parentRollZeroOracle.trace)
					=== JSON.stringify(parentOracle.trace)
				&& result.parentRollZeroOracle.rollDegrees === 0
				&& result.parentRollZeroOracle.sampleCount === 361,
			'Browser bound the exact parent schema, scene, trace, roll zero, and 361 GPU samples.',
		);
		for (const comparison of [
			result.parentN4Reproduction,
			independentParentComparison,
		]) {
			assert(
				comparison.sampleCount === 361
					&& comparison.spectralScalarCount === 361 * 15
					&& comparison.coordinateMismatchCount === 0
					&& comparison.maximumDirectionComponentDelta <= 1e-15
					&& comparison.spectralFailureCount === 0
					&& comparison.tolerance.absolute
						=== GATES.parentReproductionAbsoluteSpectralTolerance
					&& comparison.tolerance.relative
						=== GATES.parentReproductionRelativeSpectralTolerance
					&& [
						comparison.maximumAbsoluteSpectralResidual,
						comparison.maximumRelativeSpectralResidual,
						comparison.maximumToleranceRatio,
						comparison.maximumAbsoluteLuminanceResidual,
					].every(Number.isFinite),
				`${comparison.policy} reproduces all 361 by 15 parent FIB34 N4 scalars within 1e-12 + 1e-5 |parent|.`,
			);
		}
		assert(
			[
				'sampleCount',
				'spectralScalarCount',
				'coordinateMismatchCount',
				'maximumDirectionComponentDelta',
				'maximumAbsoluteSpectralResidual',
				'maximumRelativeSpectralResidual',
				'maximumToleranceRatio',
				'spectralFailureCount',
				'maximumAbsoluteLuminanceResidual',
			].every((key) =>
				result.parentN4Reproduction[key]
					=== independentParentComparison[key]),
			'Browser and runner-independent parent comparisons report identical reproduction metrics.',
		);
		assert(
			parentMirror.maximumNormalizedLuminanceAsymmetry
				>= GATES.minimumFibonacci34N4MaximumNormalizedLuminanceAsymmetry
				&& parentMirror.normalizedLuminanceMirrorRmse
					>= GATES.minimumFibonacci34N4MirrorRmse
				&& Math.abs(
					parentMirror.brightest.offsetDegrees
						- GATES.expectedFibonacci34N4BrightestOffsetDegrees,
				) <= GATES.fibonacci34N4BrightestOffsetToleranceDegrees,
			'Verified run-000469 roll zero contains the absolute +52-degree FIB34 N4 lobe signature.',
		);
		assert(
			result.parentRollZeroOracle.mirror
				.maximumNormalizedLuminanceAsymmetry
				=== parentMirror.maximumNormalizedLuminanceAsymmetry
				&& result.parentRollZeroOracle.mirror
					.normalizedLuminanceMirrorRmse
					=== parentMirror.normalizedLuminanceMirrorRmse
				&& result.parentRollZeroOracle.mirror.brightest.offsetDegrees
					=== parentMirror.brightest.offsetDegrees,
			'Browser and runner independently recover the same parent lobe metrics and brightest offset.',
		);
		assert(
			JSON.stringify(result.inputArtifacts.fixtureArtifacts)
				=== JSON.stringify(fixtureArtifacts),
			'Browser bound the exact copied runtime-fixture identities.',
		);
		assert(
			result.scene.id === 'sunset-plus-one-hour'
				&& result.scene.timeIso === scene.timeIso,
			'Browser traced the exact run-000469 San Jose +1h scene.',
		);
		const domain = result.domainAudit.construction;
		const relationship = result.domainAudit.relationship;
		assert(
			domain.directionCount === 68
				&& domain.ordinaryDirectionCount === 34,
			'FIB68 contains exactly 68 directions from 34 ordinary sources.',
		);
		assert(
			domain.reflectionMismatchCount === 0,
			'Every FIB68 partner is the exact [x,-y,z] reflection of its retained ordinary direction.',
		);
		assert(
			domain.partnerWeightMismatchCount === 0,
			'Every FIB68 reflection pair has identical half weights.',
		);
		assert(
			domain.nonFiniteWeightCount === 0
				&& domain.nonPositiveWeightCount === 0,
			'Every FIB68 integration weight is finite and strictly positive.',
		);
		assert(
			domain.maximumHalfOrdinaryWeightDeltaSteradians
				<= GATES.maximumHalfOrdinaryWeightDeltaSteradians,
			'Every FIB68 partner weight is exactly half the pinned ordinary FIB34 weight.',
		);
		assert(
			domain.maximumUnitLengthError
				<= GATES.maximumDomainUnitLengthError,
			'Every FIB68 direction remains unit length within the declared binary64 tolerance.',
		);
		assert(
			domain.totalWeightErrorSteradians
				<= GATES.domainWeightToleranceSteradians,
			'FIB68 total solid-angle weight equals 4 pi within the declared binary64 tolerance.',
		);
		assert(
			relationship.originalMismatchCount === 0,
			'FIB68 retains every candidate FIB34 direction exactly at the even partner address.',
		);
		assert(
			relationship.fibonacci34SelectionIdentity.id
				=== relationship.fibonacci34SelectionId
				&& relationship.fibonacci34SelectionIdentity
					.incomingDirectionDomain.id
					=== relationship.fibonacci34IncomingDirectionDomainId
				&& relationship.fibonacci34SelectionIdentity
					.incomingDirectionDomain.contentHash
					=== relationship
						.fibonacci34IncomingDirectionDomainContentHash
				&& relationship.fibonacci68SelectionIdentity.id
					=== relationship.fibonacci68SelectionId
				&& relationship.fibonacci68SelectionIdentity
					.incomingDirectionDomain.id
					=== relationship.fibonacci68IncomingDirectionDomainId
				&& relationship.fibonacci68SelectionIdentity
					.incomingDirectionDomain.contentHash
					=== relationship
						.fibonacci68IncomingDirectionDomainContentHash
				&& [
					relationship.fibonacci34SelectionIdentity.contentHash,
					relationship.fibonacci68SelectionIdentity.contentHash,
				].every((value) => /^sha256:[0-9a-f]{64}$/u.test(value)),
			'Both executable construction selections are bound by complete semantic identities and exact incoming-domain hashes.',
		);
		assert(
			[
				[
					relationship.fibonacci34SelectionIdentity,
					EXPECTED_SELECTION_IDENTITIES.fibonacci34,
				],
				[
					relationship.fibonacci68SelectionIdentity,
					EXPECTED_SELECTION_IDENTITIES.fibonacci68,
				],
			].every(([actual, expected]) =>
				actual.id === expected.selectionId
					&& actual.contentHash === expected.selectionContentHash
					&& actual.incomingDirectionDomain.id === expected.domainId
					&& actual.incomingDirectionDomain.contentHash
						=== expected.domainContentHash),
			'FIB34 and FIB68 selection/domain identities equal their reviewed quiescent pins.',
		);
		assert(
			relationship.positionNodesSameObject
				&& relationship.outgoingUnitVectorsSameObject
				&& relationship.spectralBasisSameObject,
			'Native48, W27, and native-15 are fixed by object identity across the control.',
		);
		const expectedConditionIds = MAXIMUM_SCATTERING_ORDERS.flatMap((order) =>
			QUADRATURE_IDS.map((quadratureId) => `${quadratureId}-n${order}`));
		assert(
			result.conditions.map((condition) => condition.id).join(',')
				=== expectedConditionIds.join(','),
			'All six FIB34/FIB68 N1/N2/N4 builds completed in the declared order.',
		);
		const planIdentities = result.conditions.map((condition) =>
			condition.construction.planIdentity);
		assert(
			planIdentities.every((identity) =>
				identity.id
					=== 'algorithm32-distant-sun-cache-construction-v1'
				&& /^sha256:[0-9a-f]{64}$/u.test(identity.contentHash)),
			'All six builds expose the exact candidate plan-identity id and one valid SHA-256 content identity.',
		);
		assert(
			new Set(planIdentities.map((identity) => identity.contentHash)).size
				=== planIdentities.length,
			'All six order/quadrature plan content identities are distinct.',
		);
		assert(
			result.conditions.every((condition) => condition.samples.length === 361),
			'Every condition contains all 361 source-centered physical horizontal rays.',
		);
		assert(
			result.conditions.every((condition) =>
				condition.traceDirectionMirrorGeometry.pairCount === 180
					&& condition.traceDirectionMirrorGeometry
						.maximumSourceLocalMirrorComponentError
						<= GATES.maximumTraceDirectionMirrorComponentError),
			'Every +/- offset pair is the same source-local direction with only the y component reflected.',
		);
		assert(
			result.conditions.every((condition) =>
				condition.construction.positionCount === 48
					&& condition.construction.outgoingDirectionCount === 4374
					&& condition.construction.fields.every((field) =>
						field.storage.layers === 15)),
			'Every build retains Native48, W27, and native-15 storage.',
		);
		assert(
			result.conditions.every((condition) =>
				condition.construction.incomingDirectionCount
					=== (condition.quadratureId === 'fibonacci-34' ? 34 : 68)),
			'Every plan records the selected 34- or 68-direction incoming extent.',
		);
		assert(
			result.conditions.every((condition) => {
				const expectedSelection = condition.quadratureId === 'fibonacci-34'
					? relationship.fibonacci34SelectionIdentity
					: relationship.fibonacci68SelectionIdentity;
				return condition.construction.domainSelectionId
						=== expectedSelection.id
					&& condition.construction.incomingDirectionDomainId
						=== expectedSelection.incomingDirectionDomain.id
					&& condition.construction
						.incomingDirectionDomainContentHash
						=== expectedSelection.incomingDirectionDomain.contentHash
					&& condition.cacheDescriptor.incomingDirectionDomain.id
						=== expectedSelection.incomingDirectionDomain.id
					&& condition.cacheDescriptor.incomingDirectionDomain
						.contentHash
						=== expectedSelection.incomingDirectionDomain.contentHash;
			}),
			'Every condition executes and publishes the exact selected incoming-domain identity and hash.',
		);
		assert(
			identityIsolationByOrder.every((entry) =>
				entry.conditionRecordCoherence
					&& entry.physicalOwnerDescriptorsEqual
					&& entry.ownerIdentityEquality.source
					&& entry.ownerIdentityEquality.atmosphere
					&& entry.ownerIdentityEquality.geometry === false
					&& entry.ownerIdentityEquality.boundary
					&& entry.planIdentity.idEqual
					&& entry.planIdentity.left.id
						=== 'algorithm32-distant-sun-cache-construction-v1'
					&& entry.planIdentity.contentHashDistinct
					&& entry.controlsEqual
					&& entry.passGraphEqual
					&& entry.planResultEqual
					&& entry.fieldCountEqual
					&& entry.onlyExpectedFieldDifferences
					&& entry.allRawDescriptorContentHashesDiffer
					&& entry.cacheIncomingMatchesControlledSelection),
			'Each order holds physical owners, source/atmosphere/boundary construction identities, controls, normalized field semantics, and pass graph fixed; only incoming-domain-bound geometry data/L width differ, while every raw custom-selection field hash has the separately declared candidate namespace drift.',
		);
		assert(
			identityIsolationByOrder.every((entry) =>
				entry.incomingWidthDifferenceCount
					=== (entry.order === 1 ? 0 : entry.order === 2 ? 1 : 3)),
			'Only L1 at N2 and L1/L2/L3 at N4 change from incoming width 34 to 68; no other field storage changes.',
		);
		assert(
			result.conditions.every((condition) =>
				condition.webglErrors.length === 0),
			'Every controlled build and trace completes without a WebGL error.',
		);
		assert(
			result.conditions.every((condition) =>
				condition.samples.every((sample) => [
					...sample.pathRadiance,
					sample.photopicLuminanceCdPerSquareMeter,
				].every(Number.isFinite))),
			'Every dense pre-Color spectrum and photopic luminance is finite.',
		);
		assert(
			result.conditions.every((condition) =>
				condition.samples.every((sample) =>
					sample.pathRadiance.every((value) =>
						value >= GATES.minimumPhysicalPathRadiance)
					&& sample.photopicLuminanceCdPerSquareMeter
						>= GATES.minimumPhysicalPhotopicLuminance)),
			'All 361 by 15 traced physical radiances and every photopic luminance are nonnegative in every condition.',
		);
		assert(
			result.conditions
				.filter((condition) => condition.maximumScatteringOrder === 1)
				.every((condition) => condition.samples.every((sample) =>
					sample.photopicLuminanceCdPerSquareMeter === 0
					&& sample.pathRadiance.every((value) => value === 0))),
			'N1 is exact zero for both quadratures over all 361 horizontal rays and 15 channels.',
		);
		assert(
			result.conditions
				.filter((condition) => condition.maximumScatteringOrder >= 2)
				.every((condition) =>
					condition.samples.some((sample) =>
						sample.photopicLuminanceCdPerSquareMeter > 0)
					&& Math.max(...condition.samples.flatMap((sample) =>
						sample.pathRadiance)) > 0),
			'N2 and N4 contain nonzero physical path radiance and positive photopic luminance for both quadratures.',
		);
		const parityFailures = result.conditions.flatMap((condition) =>
			condition.cpuGpuParity.samples.flatMap((sample) =>
				sample.cpu.pathRadiance.map((cpuValue, channelIndex) => ({
					conditionId: condition.id,
					offsetDegrees: sample.offsetDegrees,
					channelIndex,
					residual: Math.abs(
						cpuValue - sample.gpu.pathRadiance[channelIndex],
					),
					allowed: GATES.cpuGpuAbsoluteTolerance
						+ GATES.cpuGpuRelativeTolerance * Math.abs(cpuValue),
				})).filter((entry) => entry.residual > entry.allowed)));
		assert(
			parityFailures.length === 0,
			`GPU path radiance agrees with Reference.evaluate over the same live R32F cache within 1e-12 + 1e-5 |CPU| (${parityFailures.length} failures).`,
		);
		assert(
			result.conditions.every((condition) =>
				JSON.stringify(condition.cpuGpuParity.offsetsDegrees)
					=== JSON.stringify(CPU_GPU_PARITY_OFFSETS_DEGREES)),
			'CPU/GPU parity includes the parent lobe landmarks at +/-31, +/-52, and +/-58 degrees.',
		);

		assert(
			result.quadratureComparisons.map((comparison) =>
				comparison.maximumScatteringOrder).join(',') === '1,2,4',
			'Browser returned direct FIB34/FIB68 comparisons for N1, N2, and N4.',
		);
		const n1Comparison = result.quadratureComparisons.find((comparison) =>
			comparison.maximumScatteringOrder === 1);
		assert(
			n1Comparison.fibonacci34Mirror.maximumNormalizedLuminanceAsymmetry
				<= GATES.n1MaximumNormalizedLuminanceAsymmetry
				&& n1Comparison.fibonacci68Mirror.maximumNormalizedLuminanceAsymmetry
					<= GATES.n1MaximumNormalizedLuminanceAsymmetry,
			'N1 is source-plane symmetric for both exact-zero incoming-domain controls.',
		);
		assert(
			n1Comparison.fibonacci34Mirror.normalizedLuminanceMirrorRmse
				<= GATES.n1NormalizedLuminanceMirrorRmse
				&& n1Comparison.fibonacci68Mirror.normalizedLuminanceMirrorRmse
					<= GATES.n1NormalizedLuminanceMirrorRmse,
			'N1 exact-zero mirror RMSE stays within the fixed W27 reconstruction tolerance control.',
		);
		assert(
			n1Comparison.denseTraceDifference.maximumRelativeLuminanceDifference
				<= GATES.n1MaximumRelativeQuadratureDifference
				&& n1Comparison.denseTraceDifference
					.spectralToleranceFailureCount === 0
				&& n1Comparison.denseTraceDifference.tolerance.absolute
					=== GATES.spectralEquivalenceAbsoluteTolerance
				&& n1Comparison.denseTraceDifference.tolerance.relative
					=== GATES.spectralEquivalenceRelativeTolerance,
			'N1 is invariant to the unused incoming quadrature for every scalar within 1e-12 + 1e-5 |FIB34|.',
		);
		const n2Comparison = result.quadratureComparisons.find((comparison) =>
			comparison.maximumScatteringOrder === 2);
		assert(
			n2Comparison.denseTraceDifference.spectralToleranceFailureCount > 0
				&& n2Comparison.fibonacci34Mirror
					.maximumNormalizedLuminanceAsymmetry
					> n1Comparison.fibonacci34Mirror
						.maximumNormalizedLuminanceAsymmetry
				&& n2Comparison.fibonacci34Mirror.normalizedLuminanceMirrorRmse
					> n1Comparison.fibonacci34Mirror
						.normalizedLuminanceMirrorRmse,
			'N2 contains a finite distinguishable quadrature-dependent odd component beyond the measured N1 numerical envelope.',
		);
		assert(
			n2Comparison.evenProjection.sampleCount === 361
				&& n2Comparison.evenProjection.spectralScalarCount === 361 * 15
				&& n2Comparison.evenProjection.coordinateMismatchCount === 0
				&& n2Comparison.evenProjection.spectralFailureCount === 0
				&& n2Comparison.evenProjection.luminanceFailureCount === 0
				&& n2Comparison.evenProjection.tolerance.absolute
					=== GATES.n2EvenProjectionAbsoluteTolerance
				&& n2Comparison.evenProjection.tolerance.relative
					=== GATES.n2EvenProjectionRelativeTolerance
				&& [
					n2Comparison.evenProjection.maximumAbsoluteSpectralResidual,
					n2Comparison.evenProjection.maximumRelativeSpectralResidual,
					n2Comparison.evenProjection.maximumSpectralToleranceRatio,
					n2Comparison.evenProjection.maximumAbsoluteLuminanceResidual,
					n2Comparison.evenProjection.maximumRelativeLuminanceResidual,
					n2Comparison.evenProjection.maximumLuminanceToleranceRatio,
				].every(Number.isFinite),
			'Every FIB68 N2 ray/channel and photopic Y equals the paired +/- FIB34 mean within 1e-12 + 1e-4 |paired mean|.',
		);
		for (const order of [2, 4]) {
			const comparison = result.quadratureComparisons.find((entry) =>
				entry.maximumScatteringOrder === order);
			assert(
				comparison.maximumAsymmetryCollapseFactor
					<= GATES.laterOrderMaximumAsymmetryCollapseFactor,
				`FIB68 N${order} cuts maximum mirror asymmetry by at least half relative to FIB34.`,
			);
			assert(
				comparison.mirrorRmseCollapseFactor
					<= GATES.laterOrderMirrorRmseCollapseFactor,
				`FIB68 N${order} cuts mirror-asymmetry RMSE by at least half relative to FIB34.`,
			);
			assert(
				comparison.fibonacci68Mirror.normalizedLuminanceMirrorRmse
					<= GATES.maximumFibonacci68LaterOrderMirrorRmse,
				`FIB68 N${order} is absolutely near source-plane symmetric.`,
			);
		}
		const n4Comparison = result.quadratureComparisons.find((comparison) =>
			comparison.maximumScatteringOrder === 4);
		assert(
			n4Comparison.fibonacci34Mirror
				.maximumNormalizedLuminanceAsymmetry
				>= GATES.minimumFibonacci34N4MaximumNormalizedLuminanceAsymmetry
				&& n4Comparison.fibonacci34Mirror.normalizedLuminanceMirrorRmse
					>= GATES.minimumFibonacci34N4MirrorRmse
				&& Math.abs(
					n4Comparison.fibonacci34Mirror.brightest.offsetDegrees
						- GATES.expectedFibonacci34N4BrightestOffsetDegrees,
				) <= GATES.fibonacci34N4BrightestOffsetToleranceDegrees,
			'Fresh FIB34 N4 independently retains the parent-bound +52-degree absolute lobe signature.',
		);

		for (const fixture of FIXTURE_INPUTS) {
			const evidence = fixtureArtifacts[fixture.id];
			const sourcePath = path.join(FIXTURES_ROOT, fixture.fileName);
			const copiedPath = path.join(
				run.runDirectory,
				...evidence.artifactPath.split('/'),
			);
			assert(
				await sha256File(sourcePath) === evidence.sha256,
				`${fixture.id} fixture remains byte-identical throughout execution.`,
			);
			assert(
				await sha256File(copiedPath) === evidence.sha256,
				`${fixture.id} copied fixture is byte-identical to its runtime input.`,
			);
			assert(
				server.requests.includes(`/fixtures/${fixture.fileName}`),
				`${fixture.id} runtime fixture was requested by the browser.`,
			);
		}
		for (const [artifact, evidence] of Object.entries(parentArtifacts)) {
			const copiedPath = path.join(
				run.runDirectory,
				...evidence.artifactPath.split('/'),
			);
			assert(
				await sha256File(copiedPath) === evidence.sha256,
				`Copied run-000469 ${artifact} is byte-identical to its verified parent artifact.`,
			);
		}

		const analysis = analyze(
			result,
			parentOracle,
			independentParentComparison,
			identityIsolationByOrder,
		);
		await run.writeJsonArtifact('evidence/fibonacci-reflection-control.json', {
			proofId: 'san-jose-plus-one-hour-fibonacci-reflection-control-v1',
			parent: {
				...PARENT,
				verification: parentVerification,
				artifacts: parentArtifacts,
			},
			fixtures: fixtureArtifacts,
			result,
			analysis,
			gates: GATES,
			assertions,
		});
		await run.writeArtifact('evidence/horizon-trace.csv', denseTraceCsv(result));
		await run.writeArtifact('evidence/mirror-pairs.csv', mirrorPairsCsv(result));
		await run.writeArtifact(
			'figures/fibonacci-reflection-control.svg',
			diagnosticSvg(result),
		);

		const closureAfter = await buildImplementationClosure();
		const [
			implementationClosureAfter,
			experimentPackageInventoryAfter,
			threeDependencyInventoryAfter,
			candidateInventoryAfter,
			baselineInventoryAfter,
			productionReferenceInventoryAfter,
		] = await Promise.all([
			describeImplementationClosure(closureAfter),
			createSelectedFileInventory(
				EXPERIMENT_ROOT,
				['package.json', 'package-lock.json'],
			),
			createFileInventory(THREE_ROOT),
			createFileInventory(CANDIDATE_ROOT),
			createFileInventory(BASELINE_ROOT),
			createSelectedFileInventory(
				ALGORITHM32_ROOT,
				PRODUCTION_REFERENCE_FILES,
			),
		]);
		assert(
			JSON.stringify(implementationClosureAfter)
				=== JSON.stringify(implementationClosure),
			'The complete executed implementation module closure remains byte-identical throughout the run.',
		);
		assertFileInventoriesEqual(
			experimentPackageInventory,
			experimentPackageInventoryAfter,
			'Experiment package manifest/lock inventory',
		);
		assertFileInventoriesEqual(
			threeDependencyInventory,
			threeDependencyInventoryAfter,
			'Installed Three dependency inventory',
		);
		assertFileInventoriesEqual(
			candidateInventory,
			candidateInventoryAfter,
			'Sealed contained candidate inventory',
		);
		assertFileInventoriesEqual(
			baselineInventory,
			baselineInventoryAfter,
			'Sealed contained baseline inventory',
		);
		assertFileInventoriesEqual(
			productionReferenceInventory,
			productionReferenceInventoryAfter,
			'Read-only production Fibonacci reference inventory',
		);
		assert(
			await sha256File(CHROME_PATH) === chromeIdentity.sha256,
			'The Chrome executable remains byte-identical throughout the run.',
		);
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
			proofId: 'san-jose-plus-one-hour-fibonacci-reflection-control-v1',
			accepted: true,
			parent: {
				...PARENT,
				verification: parentVerification,
				artifacts: parentArtifacts,
			},
			fixtures: fixtureArtifacts,
			tooling: toolingSummary,
			analysis,
			gates: GATES,
			assertions,
			artifacts: {
				control: 'evidence/fibonacci-reflection-control.json',
				denseCsv: 'evidence/horizon-trace.csv',
				mirrorCsv: 'evidence/mirror-pairs.csv',
				figure: 'figures/fibonacci-reflection-control.svg',
				implementationClosure: 'evidence/implementation-closure.json',
				tooling: 'evidence/tooling.json',
				parentEvidenceRoot: 'references/000469',
			},
			containment: {
				algorithm32FileCount: productionAfter.algorithm32.fileCount,
				flat32FileCount: productionAfter.flat32.fileCount,
				moduleClosureFileCount: closureBefore.files.length,
				moduleClosureEdgeCount: closureBefore.edges.length,
			},
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: proof.proofId,
				accepted: true,
				artifacts: proof.artifacts,
				analysis,
			},
			report: report(run.runId, analysis, assertions),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: finalManifest.artifactSetSha256,
			artifacts: proof.artifacts,
			analysis,
		}, null, 2)}\n`);
	} catch (error) {
		const detail = {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const finalManifest = await run.finalize({
				conclusion: 'failed',
				result: {
					proofId:
						'san-jose-plus-one-hour-fibonacci-reflection-control-v1',
					accepted: false,
					error: detail,
				},
				report: `# ${run.runId}: San Jose +1 h reflected-Fibonacci causal control\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: finalManifest.artifactSetSha256,
				error: detail,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				conclusion: 'unsealed-failure',
				error: detail,
				finalizationError: String(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	} finally {
		await server?.close().catch(() => {});
		if (browserProfilePath) {
			await removeBrowserProfile(browserProfilePath).catch(() => {});
		}
	}
}

await main();
