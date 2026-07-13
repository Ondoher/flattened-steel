#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {NATIVE_15_SPECTRAL_BASIS} from '../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-t5-colorimetric-prerequisite.js';
const SOURCE_RELATIVE_ROOT = 'references/camera-colorimetric-t5-v1';
const SOURCE_ROOT = path.join(EXPERIMENT_ROOT, ...SOURCE_RELATIVE_ROOT.split('/'));
const SOURCE_MANIFEST_PATH = path.join(SOURCE_ROOT, 'source-manifest.json');
const ORACLE_PATH = path.join(EXPERIMENT_ROOT, 'tools', 'camera-t5-colorimetric-oracle.py');
const PYTHON_RELATIVE_PATH = 'tmp/extraterrestrial/tools/colour-0.4.6/Scripts/python.exe';
const PYTHON_PATH = path.join(REPOSITORY_ROOT, ...PYTHON_RELATIVE_PATH.split('/'));

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function allFinite(value) {
	if (typeof value === 'number') return Number.isFinite(value);
	if (Array.isArray(value)) return value.every(allFinite);
	if (value && typeof value === 'object') return Object.values(value).every(allFinite);
	return true;
}

function maximumDistanceFromOne(values) {
	return Math.max(...values.map((value) => Math.abs(value - 1)));
}

function runOracle(payload) {
	return new Promise((resolve, reject) => {
		const child = spawn(PYTHON_PATH, [ORACLE_PATH], {
			cwd: REPOSITORY_ROOT,
			windowsHide: true,
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		const stdout = [];
		const stderr = [];
		child.stdout.on('data', (chunk) => stdout.push(chunk));
		child.stderr.on('data', (chunk) => stderr.push(chunk));
		child.on('error', reject);
		child.on('close', (code) => {
			const stderrText = Buffer.concat(stderr).toString();
			if (code !== 0) {
				reject(new Error(`T5 colorimetric oracle failed (${code}): ${stderrText}`));
				return;
			}
			resolve({
				value: JSON.parse(Buffer.concat(stdout).toString()),
				stderr: stderrText,
			});
		});
		child.stdin.end(JSON.stringify(payload));
	});
}

async function main() {
	const nativeBins = NATIVE_15_SPECTRAL_BASIS.channels.map((channel) => ({
		id: channel.id,
		centerNanometers: channel.center.value,
		widthNanometers: channel.width.value,
	}));
	const run = await initializeRunRecord({
		slug: 'camera-t5-colorimetric-prerequisite',
		command: COMMAND,
		inputs: {
			sourceManifest: `${SOURCE_RELATIVE_ROOT}/source-manifest.json`,
			cameraProfile: 'rawtoaces-data Canon EOS 5D Mark IV relative response',
			fitDataset: 'rawtoaces-data 190-patch training spectra',
			validationDataset: 'Colour 0.4.6 ColorChecker N Ohta, all 24 patches',
			fitIlluminant: 'D55',
			outputReference: 'D65',
			validationIlluminants: ['D55', 'D65', 'D75'],
			excludedIlluminants: ['A'],
			nativeBasis: NATIVE_15_SPECTRAL_BASIS.id,
		},
		provenance: {
			purpose: 'Materialize the independent T5 relative-color oracle, common-scale corpus, and native-15 loss measurement.',
			method: 'Piecewise-linear 5 nm source data integrated on a 1 nm grid; perfect-diffuser WB; 190-row D55 least-squares fit to D65 XYZ; independent Ohta D55/D65/D75 validation; same fixed matrix applied to native-15 sensor projection.',
			claimLimit: 'Generic relative camera color only; no absolute QE, electron, named-camera, tone, gamut, or appearance claim.',
			derivationPolicy: 'Retain exact source bytes, URLs, hashes, licenses, tool versions, equations, rows, metrics, runner/oracle identities, and terminal artifact-set identity.',
		},
		environment: {
			node: process.version,
			platform: process.platform,
			pythonPath: PYTHON_RELATIVE_PATH,
		},
		references: {
			testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md',
			inventory: 'agents/topics/extraterrestrial/camera-control-test-inventory.md',
			research: 'agents/topics/extraterrestrial/camera-spectral-color-prior-art-research.md',
		},
	});

	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(SOURCE_ROOT, 'T5 retained source root');
		const policy = await loadContainmentPolicy();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		const sourceManifest = JSON.parse(await readFile(SOURCE_MANIFEST_PATH, 'utf8'));
		const retainedSourceRecords = [];
		for (const source of sourceManifest.sources) {
			const sourcePath = path.join(SOURCE_ROOT, source.path);
			requireCondition(await sha256File(sourcePath) === source.sha256, `Retained source changed: ${source.path}`);
			const bytes = await readFile(sourcePath);
			requireCondition(bytes.length === source.bytes, `Retained source byte count changed: ${source.path}`);
			await run.writeArtifact(`references/source/${source.path}`, bytes);
			retainedSourceRecords.push({
				path: source.path,
				sha256: source.sha256,
				bytes: source.bytes,
				url: source.url,
				license: source.license ?? null,
				doi: source.doi ?? null,
			});
		}
		const sourceManifestBytes = await readFile(SOURCE_MANIFEST_PATH);
		await run.writeArtifact('references/source/source-manifest.json', sourceManifestBytes);
		await run.writeArtifact('evidence/oracle-implementation.py', await readFile(ORACLE_PATH));

		const oracleInput = {
			sourceRoot: SOURCE_ROOT,
			nativeBins,
		};
		const oracleExecution = await runOracle(oracleInput);
		const oracle = oracleExecution.value;
		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};

		check(retainedSourceRecords.length === 13, 'All 13 selected source/license/metadata files are retained with exact hashes.');
		check(oracle.environment.python === '3.10.1', `Pinned Python 3.10.1 executed (${oracle.environment.python}).`);
		check(oracle.environment.colour === '0.4.6', `Pinned Colour 0.4.6 executed (${oracle.environment.colour}).`);
		check(oracle.environment.numpy === '2.2.6', `Pinned NumPy 2.2.6 executed (${oracle.environment.numpy}).`);
		check(oracle.fit.rank === 3, 'The 190-patch D55 camera fit has full rank 3.');
		check(oracle.fit.rows.length === 190, 'Exactly 190 rawtoaces spectra participate in the fit.');
		check(['D55', 'D65', 'D75'].every((name) => oracle.validation[name].rows.length === 24), 'All 24 Ohta patches remain independent validation under each of D55, D65, and D75.');
		check(oracle.fit.rows.every((row) => row.role === 'fit') && Object.values(oracle.validation).every((set) => set.rows.every((row) => row.role === 'independent-validation')), 'Training and independent validation roles never overlap.');
		check(oracle.native15.cameraWeights3x15.length === 3 && oracle.native15.cameraWeights3x15.every((row) => row.length === 15), 'The deployment response is a complete 3 x 15 matrix.');
		const whiteError = Math.max(...Object.values(oracle.perfectDiffuserChecks).flatMap((entry) => [
			maximumDistanceFromOne(entry.camera1nm),
			maximumDistanceFromOne(entry.cameraNative15),
		]));
		check(whiteError <= 1e-12, `Perfect-diffuser WB remains neutral in both paths (${whiteError}).`);
		check(allFinite(oracle.fit.metrics) && allFinite(oracle.validation) && allFinite(oracle.native15.cameraWeights3x15), 'Every fitted, validation, and native-15 result is finite.');
		check(oracle.configuration.excludedIlluminants.length === 1 && oracle.configuration.excludedIlluminants[0] === 'A', 'Illuminant A remains explicitly excluded from qualification.');

		const corpus = {
			schemaId: 'camera-t5-colorimetric-corpus-v1',
			commonScalePolicy: 'One common relative scale of 1 for every patch within each illuminant; no per-patch normalization.',
			perfectDiffuser: {
				reflectance: 1,
				role: 'white-balance reference only',
				checks: oracle.perfectDiffuserChecks,
			},
			training: {
				source: 'references/source/training_spectral.json',
				illuminant: 'D55',
				outputReference: 'D65',
				count: 190,
				rows: oracle.fit.rows,
			},
			validation: Object.fromEntries(['D55', 'D65', 'D75'].map((name) => [name, {
				source: 'references/source/colour-0.4.6-colorchecker-sds.py',
				illuminant: name,
				outputReference: 'D65',
				count: 24,
				rows: oracle.validation[name].rows,
			}])),
			excluded: {
				A: sourceManifest.policy.excludedIlluminants.A,
			},
		};
		const proof = {
			proofId: 'camera-t5-colorimetric-prerequisite-v1',
			accepted: true,
			assertions,
			summary: {
				retainedSourceCount: retainedSourceRecords.length,
				trainingPatchCount: oracle.fit.rows.length,
				independentValidationPatchCount: 72,
				fitRank: oracle.fit.rank,
				perfectDiffuserMaximumAbsoluteError: whiteError,
				trainingMetrics: oracle.fit.metrics,
				validationMetrics: Object.fromEntries(['D55', 'D65', 'D75'].map((name) => [name, oracle.validation[name].metrics])),
				combinedValidationMetrics: oracle.combinedValidationMetrics,
			},
			decisionBoundary: 'This run measures native-15 loss but does not invent a universal DeltaE00 pass threshold. Adequacy is a subsequent engineering decision using the retained distribution.',
			claimLimit: oracle.claimLimit,
		};

		await run.writeJsonArtifact('evidence/source-audit.json', {
			schemaId: 'camera-t5-source-audit-v1',
			manifestPolicy: sourceManifest.policy,
			retainedSources: retainedSourceRecords,
		});
		await run.writeJsonArtifact('evidence/oracle-input.json', oracleInput);
		await run.writeJsonArtifact('evidence/colorimetric-oracle.json', oracle);
		if (oracleExecution.stderr.trim()) {
			await run.writeArtifact('evidence/oracle-stderr.txt', oracleExecution.stderr);
		}
		await run.writeJsonArtifact('evidence/camera-colorimetric-corpus.json', corpus);
		await run.writeJsonArtifact('evidence/t5-prerequisite-proof.json', proof);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-camera-t5-colorimetric-prerequisite.js'],
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
		const protectedAfter = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(protectedBefore, protectedAfter, 'T5 prerequisite protected inventory');
		proof.containment = {
			protectedFiles: protectedAfter.fileCount,
			closureFileCount: closure.files.length,
			oracleSha256: await sha256File(ORACLE_PATH),
			runnerSha256: await sha256File(import.meta.filename),
			sourceManifestSha256: await sha256File(SOURCE_MANIFEST_PATH),
		};

		const combined = oracle.combinedValidationMetrics;
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: proof,
			report: `# ${run.runId}: T5 colorimetric prerequisite\n\nConclusion: **accepted as prerequisite evidence**.\n\n- Retained source files: ${retainedSourceRecords.length}.\n- D55 fit spectra: ${oracle.fit.rows.length}; rank ${oracle.fit.rank}.\n- Independent Ohta validation cases: 72 across D55, D65, and D75.\n- Native-15 versus 1 nm validation Delta E 2000 mean / p95 / maximum: ${combined.deltaE2000Native15Versus1nmMean} / ${combined.deltaE2000Native15Versus1nmP95} / ${combined.deltaE2000Native15Versus1nmMaximum}.\n- Perfect-diffuser maximum WB error: ${whiteError}.\n\nThis run freezes and measures the relative-color prerequisite. It does not select a development curve, claim a universal perceptual threshold, or make an absolute/named-camera claim.\n`,
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: manifest.artifactSetSha256,
			summary: proof.summary,
		}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {error: detail},
				report: `# ${run.runId}: T5 colorimetric prerequisite\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: manifest.artifactSetSha256,
				error: detail,
			}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
