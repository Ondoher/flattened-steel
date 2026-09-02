#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const execFileAsync = promisify(execFile);
const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr4a-paper-sunset-reference-inventory.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/fixtures/cr4a-sunset-paper-visual-comparison-v1.json';
const FIXTURE_PATH = repositoryPath(FIXTURE_RELATIVE_PATH);
const EXTRACTOR_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/reference/extract-bruneton-figure9.py';
const EXTRACTOR_PATH = repositoryPath(EXTRACTOR_RELATIVE_PATH);
const FIXTURE_SHA256 = '238ac480dae97eb7a057fd6cb6f36cffbc6b133c900b352415fd38b67dd7eb1b';
const EXTRACTOR_SHA256 = '2a2b611aca532f6d8ad6a50a4c2291e54e98ff4a6e3bdca059dd7ec815087a16';
const EXPECTED_FIGURE9_MODELS = Object.freeze([
	'nishita93', 'nishita96', 'preetham', 'oneal', 'haber', 'bruneton', 'elek', 'hosek',
]);
const EXPECTED_FIGURE1_MODELS = Object.freeze([...EXPECTED_FIGURE9_MODELS, 'libradtran']);
const EXPECTED_FIGURE9_OBJECTS = Object.freeze([
	'Im195', 'Im196', 'Im197', 'Im198', 'Im199', 'Im200', 'Im201', 'Im202',
]);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function requireMapValue(values, key, label) {
	const value = values.get(key);
	requireCondition(value !== undefined, `${label} is missing ${key}.`);
	return value;
}

function repositoryPath(relativePath) {
	return path.join(REPOSITORY_ROOT, ...relativePath.split('/'));
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function pngFacts(bytes, label) {
	const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
	requireCondition(buffer.byteLength >= 33, `${label} is too short to be a PNG.`);
	requireCondition(buffer.subarray(0, 8).equals(PNG_SIGNATURE), `${label} PNG signature changed.`);
	requireCondition(buffer.readUInt32BE(8) === 13, `${label} IHDR length changed.`);
	requireCondition(buffer.toString('ascii', 12, 16) === 'IHDR', `${label} lacks a leading IHDR.`);
	const widthPixels = buffer.readUInt32BE(16);
	const heightPixels = buffer.readUInt32BE(20);
	const bitDepthPerComponent = buffer[24];
	const colorType = buffer[25];
	requireCondition(widthPixels > 0 && heightPixels > 0, `${label} has invalid dimensions.`);
	return {
		widthPixels,
		heightPixels,
		bitDepthPerComponent,
		colorType,
		compressionMethod: buffer[26],
		filterMethod: buffer[27],
		interlaceMethod: buffer[28],
	};
}

function paperOnlyOutputPaths(fixture) {
	return [
		...fixture.outputs.paperSwatchPanels,
		...fixture.outputs.paperDomePanels,
		fixture.outputs.paperSwatchColumn,
		fixture.outputs.paperDomeColumn,
		fixture.outputs.decisionPlate,
	];
}

function composedOutputPaths(fixture) {
	return [
		fixture.outputs.paperSwatchColumn,
		fixture.outputs.paperDomeColumn,
		fixture.outputs.decisionPlate,
	];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4a-sunset-paper-visual-comparison-input-v1',
		'CR4a fixture schema changed.',
	);
	requireCondition(
		fixture.experiment?.id === 'CR4A' &&
		fixture.experiment?.slug === 'sunset-paper-visual-comparison' &&
		fixture.experiment?.kind === 'qualitative-control-inventory' &&
		fixture.experiment?.candidate === null &&
		fixture.experiment?.frozenBeforeExecution === true,
		'CR4a experiment boundary changed.',
	);
	requireCondition(
		fixture.paper.retainedPdfByteLength === 9751196 &&
		fixture.paper.retainedPdfSha256 === 'a1220d40bc0ed6fd35e8fe728365fb5b371a615051d505dcd611f61ff22dd5c5',
		'CR4a retained paper identity changed.',
	);
	requireCondition(
		fixture.figure9SunriseSwatches.extractor.path === EXTRACTOR_RELATIVE_PATH &&
		fixture.figure9SunriseSwatches.extractor.stdoutSchemaId === 'bruneton-figure9-sunrise-xobjects-v1' &&
		fixture.figure9SunriseSwatches.extractor.writesFiles === false &&
		fixture.figure9SunriseSwatches.extractor.expectedCombinedByteLength === 2268521 &&
		fixture.figure9SunriseSwatches.extractor.expectedCombinedSha256 ===
			'6f4359eebd6eaad3d418b0598f1359d56f3b2e42b2721908352f12891f98ed7d',
		'CR4a Figure 9 extractor contract changed.',
	);
	requireCondition(
		exactJson(fixture.figure9SunriseSwatches.modelOrder, EXPECTED_FIGURE9_MODELS) &&
		exactJson(fixture.figure9SunriseSwatches.panels.map(({modelId}) => modelId), EXPECTED_FIGURE9_MODELS) &&
		exactJson(fixture.figure9SunriseSwatches.panels.map(({objectName}) => objectName), EXPECTED_FIGURE9_OBJECTS) &&
		exactJson(fixture.figure9SunriseSwatches.panels.map(({outputPath}) => outputPath), fixture.outputs.paperSwatchPanels),
		'CR4a Figure 9 panel declaration changed.',
	);
	requireCondition(
		fixture.figure9SunriseSwatches.imageContract.widthPixels === 1024 &&
		fixture.figure9SunriseSwatches.imageContract.heightPixels === 576 &&
		fixture.figure9SunriseSwatches.imageContract.colorMode === 'RGB' &&
		fixture.figure9SunriseSwatches.imageContract.bitDepthPerComponent === 8,
		'CR4a Figure 9 image contract changed.',
	);
	requireCondition(
		exactJson(fixture.figure1LowSunDomes.modelOrder, EXPECTED_FIGURE1_MODELS) &&
		exactJson(fixture.figure1LowSunDomes.panels.map(({modelId}) => modelId), EXPECTED_FIGURE1_MODELS) &&
		exactJson(fixture.figure1LowSunDomes.panels.map(({outputPath}) => outputPath), fixture.outputs.paperDomePanels),
		'CR4a Figure 1 panel declaration changed.',
	);
	requireCondition(
		fixture.figure1LowSunDomes.imageContract.widthPixels === 256 &&
		fixture.figure1LowSunDomes.imageContract.heightPixels === 256 &&
		fixture.figure1LowSunDomes.imageContract.solarDiskInserted === false,
		'CR4a Figure 1 image contract changed.',
	);
	const outputs = paperOnlyOutputPaths(fixture);
	requireCondition(outputs.length === 20, 'CR4a paper-only increment must declare 20 PNGs.');
	requireCondition(new Set(outputs).size === outputs.length, 'CR4a paper-only output paths are duplicated.');
	requireCondition(outputs.every((value) => typeof value === 'string' && value.endsWith('.png')), 'CR4a paper-only output path is invalid.');
	requireCondition(outputs.at(-1) === fixture.outputs.decisionPlate, 'CR4a methods/claim plate must be the last requested image.');
	requireCondition(
		fixture.integrityGates.integrityOnly === true &&
		fixture.integrityGates.evaluateAfterAllRequestedImagesAreWritten === true &&
		fixture.claimBoundary.objectiveAccuracyClaim === false &&
		fixture.claimBoundary.appearanceAcceptanceGate === false &&
		fixture.claimBoundary.similarityMetricGate === false &&
		fixture.claimBoundary.rmseGate === false,
		'CR4a integrity-only claim boundary changed.',
	);
}

async function readPinnedBytes(relativePath, expectedByteLength, expectedSha256, label) {
	const absolutePath = repositoryPath(relativePath);
	await assertExistingRealPathContained(REPOSITORY_ROOT, absolutePath, label);
	const bytes = await readFile(absolutePath);
	requireCondition(bytes.byteLength === expectedByteLength, `${label} byte length changed.`);
	const actualSha256 = sha256(bytes);
	requireCondition(actualSha256 === expectedSha256, `${label} SHA-256 changed.`);
	return {
		bytes,
		identity: {
			path: relativePath,
			byteLength: bytes.byteLength,
			sha256: actualSha256,
		},
	};
}

async function loadParentInputs(fixture) {
	const [pdf, metadata, attribution, ...figure1] = await Promise.all([
		readPinnedBytes(
			fixture.paper.retainedPdfPath,
			fixture.paper.retainedPdfByteLength,
			fixture.paper.retainedPdfSha256,
			'CR4a retained paper PDF',
		),
		readPinnedBytes(
			fixture.figure1LowSunDomes.metadata.path,
			fixture.figure1LowSunDomes.metadata.byteLength,
			fixture.figure1LowSunDomes.metadata.sha256,
			'CR4a Figure 1 metadata',
		),
		readPinnedBytes(
			fixture.figure1LowSunDomes.attribution.path,
			fixture.figure1LowSunDomes.attribution.byteLength,
			fixture.figure1LowSunDomes.attribution.sha256,
			'CR4a Figure 1 attribution',
		),
		...fixture.figure1LowSunDomes.panels.map((panel) =>
			readPinnedBytes(panel.sourcePath, panel.byteLength, panel.sha256, `CR4a Figure 1 ${panel.modelId}`),
		),
	]);
	const figure1Sources = figure1.map((source, index) => {
		const declaration = fixture.figure1LowSunDomes.panels[index];
		const facts = pngFacts(source.bytes, `CR4a Figure 1 ${declaration.modelId}`);
		requireCondition(
			facts.widthPixels === fixture.figure1LowSunDomes.imageContract.widthPixels &&
			facts.heightPixels === fixture.figure1LowSunDomes.imageContract.heightPixels &&
			facts.bitDepthPerComponent === 8 &&
			facts.colorType === 2,
			`CR4a Figure 1 ${declaration.modelId} PNG contract changed.`,
		);
		return {declaration, bytes: source.bytes, sourceIdentity: source.identity, png: facts};
	});
	return {
		evidence: {
			schemaId: 'algorithm32-color-reset-cr4a-paper-parent-inputs-v1',
			pdf: pdf.identity,
			figure1Metadata: metadata.identity,
			figure1Attribution: attribution.identity,
			figure1Panels: figure1Sources.map(({sourceIdentity, declaration, png}) => ({
				modelId: declaration.modelId,
				...sourceIdentity,
				png,
			})),
		},
		figure1Sources,
	};
}

async function runFigure9Extractor(fixture) {
	const {stdout, stderr} = await execFileAsync(
		'python',
		['-B', EXTRACTOR_PATH, repositoryPath(fixture.paper.retainedPdfPath)],
		{
			cwd: REPOSITORY_ROOT,
			encoding: 'utf8',
			maxBuffer: 128 * 1024 * 1024,
			windowsHide: true,
			env: {...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1'},
		},
	);
	requireCondition(stderr.trim() === '', 'CR4a Figure 9 extractor wrote unexpected stderr.');
	const parsed = JSON.parse(stdout.trim());
	requireCondition(parsed.schemaId === fixture.figure9SunriseSwatches.extractor.stdoutSchemaId, 'CR4a Figure 9 extractor schema changed.');
	requireCondition(
		parsed.source.pdfSha256 === fixture.paper.retainedPdfSha256 &&
		parsed.source.pdfByteLength === fixture.paper.retainedPdfByteLength &&
		parsed.source.pdfPageIndex === fixture.figure9SunriseSwatches.pdfPageIndex &&
		parsed.source.figure === 9 && parsed.source.row === 'sunrise',
		'CR4a Figure 9 extractor source identity changed.',
	);
	requireCondition(
		parsed.extraction.writesFiles === false &&
		exactJson(parsed.extraction.transformations, []),
		'CR4a Figure 9 extraction must be lossless and stdout-only.',
	);
	requireCondition(parsed.panels.length === 8, 'CR4a Figure 9 extractor panel count changed.');
	const combined = createHash('sha256');
	let combinedByteLength = 0;
	const panels = parsed.panels.map((panel, index) => {
		const declaration = fixture.figure9SunriseSwatches.panels[index];
		requireCondition(
			panel.objectName === declaration.objectName &&
			panel.modelId === declaration.modelId &&
			panel.modelLabel === declaration.modelLabel &&
			panel.fileName === `${declaration.objectName}.png` &&
			panel.mimeType === 'image/png' &&
			panel.widthPixels === 1024 && panel.heightPixels === 576 &&
			panel.colorMode === 'RGB' && panel.bitDepthPerComponent === 8 &&
			panel.byteLength === declaration.byteLength && panel.sha256 === declaration.sha256,
			`CR4a Figure 9 extractor output changed for ${declaration.modelId}.`,
		);
		const bytes = Buffer.from(panel.base64, 'base64');
		requireCondition(bytes.toString('base64') === panel.base64, `CR4a Figure 9 ${declaration.modelId} base64 is noncanonical.`);
		requireCondition(bytes.byteLength === declaration.byteLength && sha256(bytes) === declaration.sha256, `CR4a Figure 9 ${declaration.modelId} decoded identity changed.`);
		const facts = pngFacts(bytes, `CR4a Figure 9 ${declaration.modelId}`);
		requireCondition(
			facts.widthPixels === 1024 && facts.heightPixels === 576 &&
			facts.bitDepthPerComponent === 8 && facts.colorType === 2,
			`CR4a Figure 9 ${declaration.modelId} PNG contract changed.`,
		);
		combined.update(bytes);
		combinedByteLength += bytes.byteLength;
		return {
			declaration,
			bytes,
			extracted: Object.fromEntries(Object.entries(panel).filter(([key]) => key !== 'base64')),
			png: facts,
		};
	});
	const combinedSha256 = combined.digest('hex');
	requireCondition(
		combinedByteLength === fixture.figure9SunriseSwatches.extractor.expectedCombinedByteLength &&
		combinedSha256 === fixture.figure9SunriseSwatches.extractor.expectedCombinedSha256 &&
		parsed.resultIdentity.byteLength === combinedByteLength &&
		parsed.resultIdentity.sha256 === combinedSha256 &&
		exactJson(parsed.resultIdentity.objectOrder, EXPECTED_FIGURE9_OBJECTS),
		'CR4a Figure 9 combined extraction identity changed.',
	);
	return {
		panels,
		evidence: {
			schemaId: parsed.schemaId,
			source: parsed.source,
			extraction: parsed.extraction,
			panels: panels.map(({extracted, png}) => ({...extracted, png})),
			resultIdentity: parsed.resultIdentity,
			stdoutIdentity: {byteLength: Buffer.byteLength(stdout), sha256: sha256(stdout)},
		},
	};
}

async function materializeReferencePanels(run, fixture, figure9, figure1Sources) {
	const records = [];
	for (const panel of figure9.panels) {
		await run.writeArtifact(panel.declaration.outputPath, panel.bytes);
		records.push({
			kind: 'lossless-figure9-xobject',
			modelId: panel.declaration.modelId,
			modelLabel: panel.declaration.modelLabel,
			objectName: panel.declaration.objectName,
			artifactPath: panel.declaration.outputPath,
			byteLength: panel.bytes.byteLength,
			sha256: panel.declaration.sha256,
			widthPixels: panel.png.widthPixels,
			heightPixels: panel.png.heightPixels,
			png: panel.png,
			completedAt: new Date().toISOString(),
		});
	}
	for (const source of figure1Sources) {
		await run.writeArtifact(source.declaration.outputPath, source.bytes);
		records.push({
			kind: 'byte-exact-figure1-source-copy',
			modelId: source.declaration.modelId,
			modelLabel: source.declaration.modelLabel,
			artifactPath: source.declaration.outputPath,
			byteLength: source.bytes.byteLength,
			sha256: source.declaration.sha256,
			widthPixels: source.png.widthPixels,
			heightPixels: source.png.heightPixels,
			png: source.png,
			parent: source.sourceIdentity,
			completedAt: new Date().toISOString(),
		});
	}
	requireCondition(
		exactJson(records.map(({artifactPath}) => artifactPath), [
			...fixture.outputs.paperSwatchPanels,
			...fixture.outputs.paperDomePanels,
		]),
		'CR4a reference materialization order changed.',
	);
	return records;
}

function makeBrowserConfiguration(fixture, referencePanels) {
	const byPath = new Map(referencePanels.map((panel) => [panel.artifactPath, panel]));
	const sourceRecord = (declaration, sourceLabel) => {
		const panel = byPath.get(declaration.outputPath);
		requireCondition(panel, `CR4a browser source is missing ${declaration.outputPath}.`);
		return {
			artifactPath: declaration.outputPath,
			modelId: declaration.modelId,
			modelLabel: declaration.modelLabel,
			objectName: declaration.objectName ?? null,
			sourceLabel,
			byteLength: declaration.byteLength,
			sha256: declaration.sha256,
			widthPixels: panel.widthPixels,
			heightPixels: panel.heightPixels,
		};
	};
	return {
		schemaId: 'algorithm32-color-reset-cr4a-paper-reference-browser-config-v1',
		fixtureSha256: FIXTURE_SHA256,
		paper: {
			title: fixture.paper.title,
			author: fixture.paper.author,
			pdfSha256: fixture.paper.retainedPdfSha256,
		},
		sources: {
			figure9: fixture.figure9SunriseSwatches.panels.map((panel) =>
				sourceRecord(panel, `Original paper / ${panel.objectName}`),
			),
			figure1: fixture.figure1LowSunDomes.panels.map((panel) =>
				sourceRecord(panel, 'Paper full spectral / z87'),
			),
		},
		outputs: {
			swatchColumn: fixture.outputs.paperSwatchColumn,
			domeColumn: fixture.outputs.paperDomeColumn,
			methodsClaimBoundaryPlate: fixture.outputs.decisionPlate,
		},
		methods: {
			methodLines: [
				'Figure 9 sunrise panels are losslessly extracted from PDF page index 10 as XObjects Im195 through Im202; each exact PNG is retained separately.',
				'Figure 1 uses byte-exact copies of the retained full-spectral 06h00-z87 PNGs for all nine declared paper rows.',
				'Both labeled columns place decoded source pixels at native size on integer coordinates with no crop, rotation, scaling, or smoothing.',
				'This paper-only increment performs no Algorithm32 render, paper-pixel metric, additional normalization, or appearance decision.',
			],
			claimBoundaryLines: [
				'Qualitative color, gradient, and angular-structure reference only; no RMSE, similarity, validation, ranking, measurement, or appearance gate.',
				'Paper and Algorithm32 scenes differ in date, location, atmosphere, solar geometry, and spectral basis; the z87 row is a bridge, not an equivalence claim.',
				'Figure 9 is uniformly normalized per model to 36 W/m^2 total sky irradiance and cannot support an absolute-brightness judgment.',
				'Figure 1 z87 has no measured-sky panel; every retained paper panel is an 8-bit display PNG, not a spectral or luminance field.',
				'The actual San Jose sunset remains the product-facing subject; this first increment accepts reference-inventory integrity only.',
			],
		},
	};
}

async function captureImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4a-paper-sunset-reference-inventory.js',
			'color-reset/harness/cr4a-paper-sunset-reference-inventory-browser.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http',
			'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
		],
	});
	const browserClosure = await buildStaticModuleClosure({
		candidateRoot: COLOR_RESET_ROOT,
		entryFiles: ['harness/cr4a-paper-sunset-reference-inventory-browser.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	const auxiliaryPaths = [
		'color-reset/fixtures/cr4a-sunset-paper-visual-comparison-v1.json',
		'color-reset/reference/extract-bruneton-figure9.py',
	];
	return {
		implementationClosure,
		implementationInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, implementationClosure.files),
		browserClosure,
		browserInventory: await createSelectedFileInventory(COLOR_RESET_ROOT, browserClosure.files),
		auxiliaryPaths,
		auxiliaryInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, auxiliaryPaths),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

async function captureImplementationAfter(before) {
	return {
		implementationInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, before.implementationClosure.files),
		browserInventory: await createSelectedFileInventory(COLOR_RESET_ROOT, before.browserClosure.files),
		auxiliaryInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, before.auxiliaryPaths),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4a implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4a browser closure');
	assertFileInventoriesEqual(before.auxiliaryInventory, after.auxiliaryInventory, 'CR4a fixture/extractor inputs');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 &&
		before.packageLockSha256 === after.packageLockSha256,
		'CR4a package boundary changed during execution.',
	);
}

function attachUploadIdentities(browserResult, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	return {
		...browserResult,
		images: browserResult.images.map((image) => ({
			...image,
			upload: requireMapValue(byPath, image.artifactPath, 'CR4a browser upload identity'),
		})),
	};
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, referencePanels, browser, fixture) {
	const firstRequested = referencePanels[0] ?? null;
	const firstComposed = browser.uploads[0] ?? null;
	const decisionPlate = browser.uploads.find(({path: artifactPath}) => artifactPath === fixture.outputs.decisionPlate) ?? null;
	return {
		schemaId: 'algorithm32-color-reset-cr4a-paper-reference-progress-v1',
		initializedAt: run.initializedAt,
		firstRequestedImage: firstRequested ? {
			artifactPath: firstRequested.artifactPath,
			completedAt: firstRequested.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, firstRequested.completedAt),
			targetMilliseconds: 180000,
		} : null,
		firstComposedImage: firstComposed ? {
			artifactPath: firstComposed.path,
			completedAt: firstComposed.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, firstComposed.completedAt),
			targetMilliseconds: 180000,
		} : null,
		decisionPlate: decisionPlate ? {
			artifactPath: decisionPlate.path,
			completedAt: decisionPlate.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, decisionPlate.completedAt),
			targetMilliseconds: 600000,
		} : null,
		browserEvents: browser.progressEvents,
	};
}

async function verifyRunPngs(run, expected) {
	const records = [];
	for (const declaration of expected) {
		const absolutePath = path.join(run.runDirectory, ...declaration.artifactPath.split('/'));
		await assertExistingRealPathContained(run.runDirectory, absolutePath, `CR4a output ${declaration.artifactPath}`);
		const bytes = await readFile(absolutePath);
		const facts = pngFacts(bytes, `CR4a output ${declaration.artifactPath}`);
		requireCondition(
			facts.widthPixels === declaration.widthPixels && facts.heightPixels === declaration.heightPixels,
			`CR4a output dimensions changed for ${declaration.artifactPath}.`,
		);
		const actualSha256 = sha256(bytes);
		if (declaration.sha256 !== null) {
			requireCondition(
				bytes.byteLength === declaration.byteLength && actualSha256 === declaration.sha256,
				`CR4a exact source copy changed for ${declaration.artifactPath}.`,
			);
		}
		records.push({
			artifactPath: declaration.artifactPath,
			byteLength: bytes.byteLength,
			sha256: actualSha256,
			png: facts,
		});
	}
	return records;
}

function makeExpectedRunPngs(referencePanels, browserAnalysis) {
	return [
		...referencePanels.map((panel) => ({
			artifactPath: panel.artifactPath,
			byteLength: panel.byteLength,
			sha256: panel.sha256,
			widthPixels: panel.widthPixels,
			heightPixels: panel.heightPixels,
		})),
		...browserAnalysis.images.map((image) => ({
			artifactPath: image.artifactPath,
			byteLength: image.byteLength,
			sha256: image.sha256,
			widthPixels: image.widthPixels,
			heightPixels: image.heightPixels,
		})),
	];
}

function makeReferenceInventory(
	fixture,
	parentInputs,
	extraction,
	referencePanels,
	verifiedImages,
	implementationBefore,
) {
	const byPath = new Map(verifiedImages.map((image) => [image.artifactPath, image]));
	const fixtureIdentity = implementationBefore.auxiliaryInventory.files.find(
		({path: relativePath}) => relativePath === 'color-reset/fixtures/cr4a-sunset-paper-visual-comparison-v1.json',
	);
	requireCondition(fixtureIdentity, 'CR4a fixture inventory identity is missing.');
	return {
		schemaId: 'algorithm32-color-reset-cr4a-paper-reference-inventory-v1',
		fixture: {
			path: FIXTURE_RELATIVE_PATH,
			byteLength: fixtureIdentity.bytes,
			sha256: fixtureIdentity.sha256,
		},
		paper: fixture.paper,
		parents: parentInputs,
		figure9Extraction: extraction,
		paperPanels: referencePanels.map((panel) => ({
			...panel,
			resultIdentity: requireMapValue(
				byPath,
				panel.artifactPath,
				'CR4a verified paper-panel identity',
			),
		})),
		composedFigures: composedOutputPaths(fixture).map((artifactPath) =>
			requireMapValue(byPath, artifactPath, 'CR4a verified composed-figure identity'),
		),
		paperOnlyOutputOrder: paperOnlyOutputPaths(fixture),
		deferredAlgorithm32Outputs: {
			oursCleanPanels: fixture.outputs.oursCleanPanels,
			actualGeographicDome: fixture.outputs.actualGeographicDome,
			luminanceDiagnostic: fixture.outputs.luminanceDiagnostic,
		},
	};
}

function makePanelIdentities(referencePanels, browserAnalysis, verifiedImages) {
	const byPath = new Map(verifiedImages.map((image) => [image.artifactPath, image]));
	return {
		schemaId: 'algorithm32-color-reset-cr4a-paper-panel-identities-v1',
		paperPanels: referencePanels.map((panel) => ({
			kind: panel.kind,
			modelId: panel.modelId,
			modelLabel: panel.modelLabel,
			objectName: panel.objectName ?? null,
			...requireMapValue(
				byPath,
				panel.artifactPath,
				'CR4a paper-panel identity',
			),
		})),
		figures: browserAnalysis.images.map((image) => ({
			kind: image.kind,
			...requireMapValue(
				byPath,
				image.artifactPath,
				'CR4a composed-figure identity',
			),
		})),
	};
}

function makeImageDerivations(fixture, parentInputs, extraction, referencePanels, browserAnalysis, verifiedImages, implementationBefore) {
	const byPath = new Map(verifiedImages.map((image) => [image.artifactPath, image]));
	const helperIdentity = implementationBefore.implementationInventory.files.find(
		({path: relativePath}) => relativePath === 'color-reset/harness/cr4a-paper-sunset-reference-inventory-browser.js',
	);
	const runnerIdentity = implementationBefore.implementationInventory.files.find(
		({path: relativePath}) => relativePath === 'color-reset/runners/run-cr4a-paper-sunset-reference-inventory.js',
	);
	const extractorIdentity = implementationBefore.auxiliaryInventory.files.find(
		({path: relativePath}) => relativePath === 'color-reset/reference/extract-bruneton-figure9.py',
	);
	requireCondition(
		helperIdentity && runnerIdentity && extractorIdentity,
		'CR4a derivation implementation identities are incomplete.',
	);
	const figure9ByModel = new Map(extraction.panels.map((panel) => [panel.modelId, panel]));
	const derivations = referencePanels.map((panel) => {
		if (panel.kind === 'lossless-figure9-xobject') {
			return {
				artifactPath: panel.artifactPath,
				parentInputs: [{...parentInputs.pdf, pdfResourceName: `/${panel.objectName}`}],
				operation: 'Losslessly extract the declared Figure 9 sunrise PDF image XObject through pypdf PageObject.images, decode its canonical stdout base64, and write the exact PNG bytes into the immutable run.',
				implementation: {extractor: extractorIdentity, tool: extraction.extraction},
				materialParameters: requireMapValue(
					figure9ByModel,
					panel.modelId,
					'CR4a Figure 9 extraction identity',
				),
				resultIdentity: requireMapValue(
					byPath,
					panel.artifactPath,
					'CR4a Figure 9 result identity',
				),
			};
		}
		return {
			artifactPath: panel.artifactPath,
			parentInputs: [panel.parent],
			operation: 'Copy the exact retained Figure 1 06h00-z87 PNG byte stream into the immutable run without decoding or transforming it.',
			implementation: {runner: runnerIdentity, operation: 'ImmutableRunRecord.writeArtifact'},
			materialParameters: {modelId: panel.modelId, transformation: null},
			resultIdentity: requireMapValue(
				byPath,
				panel.artifactPath,
				'CR4a Figure 1 result identity',
			),
		};
	});
	for (const image of browserAnalysis.images) {
		const isSwatch = image.artifactPath === fixture.outputs.paperSwatchColumn;
		const isDome = image.artifactPath === fixture.outputs.paperDomeColumn;
		derivations.push({
			artifactPath: image.artifactPath,
			parentInputs: isSwatch
				? fixture.outputs.paperSwatchPanels.map((artifactPath) =>
					requireMapValue(byPath, artifactPath, 'CR4a swatch-column parent identity'),
				)
				: (isDome
					? fixture.outputs.paperDomePanels.map((artifactPath) =>
						requireMapValue(byPath, artifactPath, 'CR4a dome-column parent identity'),
					)
					: [{path: FIXTURE_RELATIVE_PATH, sha256: FIXTURE_SHA256}, parentInputs.pdf]),
			operation: isSwatch || isDome
				? 'Decode the authenticated paper PNGs and place each at native 1:1 pixel size on integer Canvas2D coordinates with smoothing disabled; add labels outside the source rectangle and encode the complete column as PNG.'
				: 'Render a compact methods and claim-boundary text plate from the pinned fixture; introduce no paper-image or Algorithm32 numerical comparison.',
			implementation: {browserHelper: helperIdentity, runtime: browserAnalysis.runtimeEnvironment},
			materialParameters: isSwatch || isDome
				? {composition: browserAnalysis.composition, pixelAudits: image.pixelAudits}
				: {claimBoundary: fixture.claimBoundary, paperOnly: true},
			resultIdentity: requireMapValue(
				byPath,
				image.artifactPath,
				'CR4a composed-image result identity',
			),
		});
	}
	return {
		schemaId: 'algorithm32-color-reset-cr4a-paper-image-derivations-v1',
		claimBoundary: fixture.claimBoundary,
		images: derivations,
	};
}

function evaluateIntegrityGates({fixture, extraction, referencePanels, browser, browserAnalysis, verifiedImages, progress, gateEvaluationStartedAt}) {
	const expectedPaths = paperOnlyOutputPaths(fixture);
	const browserEvents = browser.progressEvents.map(({stage}) => stage);
	const composed = browserAnalysis.images;
	const allPixelAudits = composed
		.filter((image) => Array.isArray(image.pixelAudits))
		.flatMap((image) => image.pixelAudits);
	const completionTimes = [
		...referencePanels.map(({completedAt}) => completedAt),
		...browser.uploads.map(({completedAt}) => completedAt),
	];
	const gates = {
		fixtureIdentityPinned: fixture.schemaId === 'algorithm32-color-reset-cr4a-sunset-paper-visual-comparison-input-v1',
		integrityOnlyScope: fixture.integrityGates.integrityOnly === true,
		figure9ExtractorIdentityPinned: extraction.resultIdentity.sha256 === fixture.figure9SunriseSwatches.extractor.expectedCombinedSha256,
		figure9ExactPanelInventory: exactJson(extraction.panels.map(({modelId}) => modelId), EXPECTED_FIGURE9_MODELS),
		figure1ExactPanelInventory: exactJson(referencePanels.filter(({kind}) => kind === 'byte-exact-figure1-source-copy').map(({modelId}) => modelId), EXPECTED_FIGURE1_MODELS),
		allTwentyPaperOnlyImagesWritten: exactJson(verifiedImages.map(({artifactPath}) => artifactPath), expectedPaths),
		allExactPaperCopiesPreserved: referencePanels.every((panel) => {
			const result = verifiedImages.find(({artifactPath}) => artifactPath === panel.artifactPath);
			return result?.byteLength === panel.byteLength && result?.sha256 === panel.sha256;
		}),
		browserResultSchema: browserAnalysis.schemaId === 'algorithm32-color-reset-cr4a-paper-reference-browser-result-v1',
		allComposedImagesUploaded: browserAnalysis.allDeclaredImagesUploaded === true && browser.uploads.length === 3,
		composedUploadOrderExact: exactJson(browser.uploads.map(({path: artifactPath}) => artifactPath), composedOutputPaths(fixture)),
		methodsClaimPlateUploadedLast: browser.uploads.at(-1)?.path === fixture.outputs.decisionPlate,
		allComposedPngsDecodable: composed.every((image) => image.decodablePng === true && image.decodedWidthPixels === image.widthPixels && image.decodedHeightPixels === image.heightPixels),
		nativeSourcePixelsPreservedInColumns: allPixelAudits.length === 17 && allPixelAudits.every((audit) => audit.scale === 1 && audit.crop === null && audit.imageSmoothingEnabled === false && audit.decodedRgbaParity.exact === true),
		firstImageProgressEvent: browserEvents.includes('first-image-complete'),
		decisionPlateProgressEvent: browserEvents.includes('decision-plate-complete'),
		progressTargetsMet: progress.firstRequestedImage.elapsedMilliseconds <= 180000 && progress.decisionPlate.elapsedMilliseconds <= 600000,
		allImagesPrecedeGateEvaluation: completionTimes.every((completedAt) => new Date(completedAt).getTime() <= new Date(gateEvaluationStartedAt).getTime()),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		qualitativeClaimBoundaryRetained: browserAnalysis.claimBoundary.qualitativePaperReferenceOnly === true && browserAnalysis.claimBoundary.absoluteRadianceComparison === false && browserAnalysis.claimBoundary.rmseComparison === false && browserAnalysis.claimBoundary.timeOrLocationEquivalence === false && browserAnalysis.claimBoundary.candidateAcceptance === false,
		noAlgorithm32OrCandidateOutputClaimed: browserAnalysis.paperOnly === true && !('metrics' in browserAnalysis),
	};
	return {gates, accepted: Object.values(gates).every(Boolean)};
}

async function main() {
	if (process.argv.length !== 2) throw new Error('CR4a paper reference inventory accepts no arguments.');
	const fixture = await readJson(FIXTURE_PATH);
	const run = await initializeColorResetRunRecord({
		slug: 'paper-sunset-reference-inventory',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-inputs-v1',
			increment: 'CR4A-paper-reference-inventory',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			paperOnlyOutputImages: paperOnlyOutputPaths(fixture),
			deferredAlgorithm32Outputs: fixture.outputs.oursCleanPanels,
			claimBoundary: fixture.claimBoundary,
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-provenance-v1',
			operation: 'Extract and authenticate the paper Figure 9 sunrise PNG XObjects, byte-copy the retained Figure 1 z87 PNGs, and compose labeled native-resolution paper-only reference columns plus a methods/claim-boundary plate.',
			implementation: [
				EXTRACTOR_RELATIVE_PATH,
				'scripts/extraterrestrial/color-reset/harness/cr4a-paper-sunset-reference-inventory-browser.js',
				'scripts/extraterrestrial/color-reset/runners/run-cr4a-paper-sunset-reference-inventory.js',
			],
			transformations: ['lossless PDF XObject extraction', 'byte-exact source copy', '1:1 labeled Canvas2D layout'],
			exclusions: ['no Algorithm32 execution', 'no paper-image metric', 'no RMSE', 'no similarity score', 'no model ranking', 'no appearance gate', 'no production change'],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			pythonCommand: 'python -B',
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 300000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-references-v1',
			paper: fixture.paper.paperUrl,
			retainedPdf: fixture.paper.retainedPdfPath,
			figure1Metadata: fixture.figure1LowSunDomes.metadata.path,
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	let implementationBefore = null;
	let implementationAfter = null;
	let protectedBefore = null;
	let protectedAfter = null;
	let parentsBefore = null;
	let parentsAfter = null;
	let referencePanels = [];
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR4a color-reset implementation');
		requireCondition(await sha256File(FIXTURE_PATH) === FIXTURE_SHA256, 'CR4a fixture changed after predeclaration.');
		requireCondition(await sha256File(EXTRACTOR_PATH) === EXTRACTOR_SHA256, 'CR4a Figure 9 extractor identity changed.');
		verifyFixtureContract(fixture);

		implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		const loadedParents = await loadParentInputs(fixture);
		parentsBefore = loadedParents.evidence;
		await run.writeJsonArtifact('evidence/parents-before.json', parentsBefore);

		const extraction = await runFigure9Extractor(fixture);
		await run.writeJsonArtifact('evidence/figure9-extraction.json', extraction.evidence);
		referencePanels = await materializeReferencePanels(
			run,
			fixture,
			extraction,
			loadedParents.figure1Sources,
		);
		const browserConfiguration = makeBrowserConfiguration(fixture, referencePanels);
		await run.writeJsonArtifact('browser/config.json', browserConfiguration);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4a-paper-sunset-reference-inventory-browser.js',
			exportName: 'runCr4aPaperSunsetReferenceInventoryBrowser',
			servedRoots: {'/run/': run.runDirectory},
			allowedArtifactPaths: composedOutputPaths(fixture),
			uploadLimitBytes: 64 * 1024 * 1024,
			timeoutMilliseconds: 300000,
		});
		const browserAnalysis = {
			...attachUploadIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		const verifiedImages = await verifyRunPngs(
			run,
			makeExpectedRunPngs(referencePanels, browserAnalysis),
		);
		const referenceInventory = makeReferenceInventory(
			fixture,
			parentsBefore,
			extraction.evidence,
			referencePanels,
			verifiedImages,
			implementationBefore,
		);
		await run.writeJsonArtifact(fixture.outputs.referenceInventory, referenceInventory);
		await run.writeJsonArtifact(
			fixture.outputs.panelIdentities,
			makePanelIdentities(referencePanels, browserAnalysis, verifiedImages),
		);
		await run.writeJsonArtifact(
			fixture.outputs.imageDerivations,
			makeImageDerivations(
				fixture,
				parentsBefore,
				extraction.evidence,
				referencePanels,
				browserAnalysis,
				verifiedImages,
				implementationBefore,
			),
		);
		await run.writeJsonArtifact(fixture.outputs.analysis, {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-analysis-v1',
			paperOnly: true,
			fixture: {path: FIXTURE_RELATIVE_PATH, sha256: FIXTURE_SHA256},
			claimBoundary: fixture.claimBoundary,
			extraction: extraction.evidence,
			browser: browserAnalysis,
			verifiedImages,
			deferred: {
				algorithm32Renders: fixture.outputs.oursCleanPanels,
				actualGeographicDome: fixture.outputs.actualGeographicDome,
				luminanceDiagnostic: fixture.outputs.luminanceDiagnostic,
			},
		});

		implementationAfter = await captureImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		assertImplementationUnchanged(implementationBefore, implementationAfter);
		parentsAfter = (await loadParentInputs(fixture)).evidence;
		await run.writeJsonArtifact('evidence/parents-after.json', parentsAfter);
		requireCondition(exactJson(parentsBefore, parentsAfter), 'CR4a paper parents changed during execution.');
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		assertFileInventoriesEqual(protectedBefore.algorithm32, protectedAfter.algorithm32, 'CR4a protected Algorithm32 source');
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4a protected Flat32 source');

		const progress = makeProgress(run, referencePanels, browser, fixture);
		await run.writeJsonArtifact(fixture.outputs.progress, progress);
		progressWritten = true;
		const gateEvaluationStartedAt = new Date().toISOString();
		const decision = evaluateIntegrityGates({
			fixture,
			extraction: extraction.evidence,
			referencePanels,
			browser,
			browserAnalysis,
			verifiedImages,
			progress,
			gateEvaluationStartedAt,
		});
		const conclusion = decision.accepted ? 'accepted' : 'failed';
		const proof = {
			schemaId: 'algorithm32-color-reset-cr4a-paper-reference-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.accepted,
			paperOnly: true,
			appearanceAccepted: false,
			objectiveAccuracyClaim: false,
			gateEvaluationStartedAt,
			gates: decision.gates,
			claimBoundary: fixture.claimBoundary,
			paperOnlyOutputImages: verifiedImages,
			progress,
			parentsUnchanged: true,
			implementationUnchanged: true,
			protectedSourceUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4a paper sunset-reference inventory`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All 17 exact paper-panel PNGs, both labeled vertical paper columns, and the compact methods/claim-boundary plate were written before integrity gates were evaluated.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'This accepts only the paper reference inventory and derivation integrity. It makes no Algorithm32 appearance, paper similarity, RMSE, model-ranking, measurement, or production claim.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const verification = await verifyColorResetRun(run.runId);
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: verification.verified,
			paperOnlyImageCount: verifiedImages.length,
			gates: decision.gates,
			progress,
		}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) {
				await run.writeJsonArtifact(fixture.outputs.progress, {
					schemaId: 'algorithm32-color-reset-cr4a-paper-reference-progress-v1',
					initializedAt: run.initializedAt,
					failedAt: new Date().toISOString(),
					completedPaperPanelCount: referencePanels.length,
					error: error instanceof Error ? error.message : String(error),
				});
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr4a-paper-reference-failure-v1',
				error: {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : null,
				},
				paperOnly: true,
				completedPaperPanelCount: referencePanels.length,
				implementationBeforeRecorded: implementationBefore !== null,
				implementationAfterRecorded: implementationAfter !== null,
				parentsBeforeRecorded: parentsBefore !== null,
				parentsAfterRecorded: parentsAfter !== null,
				protectedBeforeRecorded: protectedBefore !== null,
				protectedAfterRecorded: protectedAfter !== null,
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					schemaId: 'algorithm32-color-reset-cr4a-paper-reference-failed-result-v1',
					accepted: false,
					integrityPassed: false,
					paperOnly: true,
					appearanceAccepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4a paper sunset-reference inventory\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
