import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const executeFile = promisify(execFile);
const COMMAND = 'node scripts/extraterrestrial/runners/run-production-local-light-exposure-qualification.js';
const SOURCE_PATHS = [
	'src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js',
	'src/algorithm32/implementation/scene-lighting/types.d.ts',
	'src/algorithm32/implementation/scene-lighting/_tests/LocalLightLevelCalculator.spec.js',
	'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
	'src/algorithm32/implementation/bruneton-color/_tests/bruneton-color-display-model.spec.js',
	'src/algorithm32/interfaces/color/types.d.ts',
	'src/algorithm32/interfaces/algorithm32/types.d.ts',
	'src/algorithm32/implementation/algorithm32/Algorithm32.js',
	'src/algorithm32/implementation/algorithm32/types.d.ts',
	'src/algorithm32/implementation/algorithm32/_tests/algorithm32-facade.spec.js',
];

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

async function sourceFingerprints() {
	const entries = [];
	for (const relativePath of SOURCE_PATHS) {
		const bytes = await readFile(path.join(REPOSITORY_ROOT, relativePath));
		entries.push({path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes)});
	}
	return entries;
}

async function execute(command, args) {
	const startedAt = new Date().toISOString();
	const started = performance.now();
	try {
		const result = await executeFile(command, args, {
			cwd: REPOSITORY_ROOT,
			encoding: 'utf8',
			maxBuffer: 16 * 1024 * 1024,
			windowsHide: true,
		});
		return {
			command: [command, ...args],
			startedAt,
			wallMilliseconds: performance.now() - started,
			exitCode: 0,
			stdout: result.stdout,
			stderr: result.stderr,
		};
	} catch (error) {
		return {
			command: [command, ...args],
			startedAt,
			wallMilliseconds: performance.now() - started,
			exitCode: Number.isInteger(error.code) ? error.code : 1,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? error.message,
		};
	}
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'production-local-light-exposure-qualification',
		command: COMMAND,
		inputs: {
			productionSources: SOURCE_PATHS,
			checks: [
				'node node_modules/typescript/bin/tsc -p src/algorithm32/jsconfig.json',
				'node node_modules/typescript/bin/tsc -p src/flat32/jsconfig.json',
				'node node_modules/jasmine/bin/jasmine.js --config=spec/support/jasmine-algorithm32.json --filter=LocalLightLevelCalculator|receiver-local lighting calculator|unsmoothed local-light exposure|configured Sun-only receiver support|one positive achromatic exposure modifier|reference Figure 1 output mapping|low-level assembly inputs',
			],
		},
		provenance: {
			baseline: 'project-owner-authorized current commit baseline',
			implementation:
				'Configured primary-source incident scale and geometry horizon support feed a Ward target selected by facade-owned LocalLightLevelCalculator; fixed Bruneton K is multiplied by one live global achromatic uniform',
			claimLimit:
				'qualifies the provisional Sun-only local-light policy and global Bruneton wiring; no secondary source, smoothing, tuning, or render',
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			activePlan: 'agents/topics/extraterrestrial/stellar-rendering-plan.md#immediate-next-step',
			design: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
			ward: 'https://eta-publications.lbl.gov/publications/contrast-based-scalefactor-luminance',
			ciePhotopicDomain: 'https://cie.co.at/eilvterm/17-21-035',
		},
	});

	try {
		await assertRepositoryIdentity();
		const before = await sourceFingerprints();
		const checks = [
			await execute(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'src/algorithm32/jsconfig.json']),
			await execute(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'src/flat32/jsconfig.json']),
			await execute(process.execPath, [
				'node_modules/jasmine/bin/jasmine.js',
				'--config=spec/support/jasmine-algorithm32.json',
				'--filter=LocalLightLevelCalculator|receiver-local lighting calculator|unsmoothed local-light exposure|configured Sun-only receiver support|one positive achromatic exposure modifier|reference Figure 1 output mapping|low-level assembly inputs',
			]),
		];
		for (let index = 0; index < checks.length; index += 1) {
			await run.writeArtifact(
				`evidence/check-${index + 1}.log`,
				`${checks[index].stdout}${checks[index].stderr}`,
			);
		}
		const after = await sourceFingerprints();
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-production-local-light-exposure-qualification.js'],
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
		const fingerprintsStable = JSON.stringify(after) === JSON.stringify(before);
		const assertions = [
			{passed: checks[0].exitCode === 0, name: 'Algorithm32 production typecheck passes.'},
			{passed: checks[1].exitCode === 0, name: 'Flat32 integration typecheck passes.'},
			{passed: checks[2].exitCode === 0, name: 'Focused production calculator and facade specifications pass.'},
			{passed: fingerprintsStable, name: 'Authorized production source fingerprints remain stable during qualification.'},
		];
		const accepted = assertions.every((assertion) => assertion.passed);
		const proof = {
			proofId: 'production-local-light-exposure-qualification-v3',
			accepted,
			assertions,
			equation:
				'g(L)=1 for L>=5 cd m^-2; otherwise ((1.219+5^0.4)/(1.219+L^0.4))^2.5; effectiveToneMapK=paperFigure1ToneMapK*g(L)',
			invariants: {
				baselineRemainsCallerOwned: true,
				exposureModifierIsAchromatic: true,
				semanticZeroHasFiniteEndpoint: true,
				photopicRangeExactIdentity: true,
				secondaryLightAggregationImplemented: false,
				configuredSunOnlyInputConnected: true,
				atmosphericDirectAttenuationIncludedInProxy: false,
				temporalSmoothingImplemented: false,
				brunetonBaselineConstantChanged: false,
				newRenderProduced: false,
			},
			checks: checks.map(({stdout: _stdout, stderr: _stderr, ...check}) => check),
			productionSourceFingerprints: after,
			containment: {closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length},
		};
		await run.writeJsonArtifact('evidence/production-local-light-exposure-proof.json', proof);
		await run.writeJsonArtifact('evidence/derivation.json', {
			schemaId: 'production-local-light-exposure-derivation-v3',
			parents: {
				baselineRun: {
					runId: '000399-production-local-light-exposure-qualification',
					artifactSetSha256: 'b7acbc5e0f5174c973734092ac7f66ca2e1265adc22cb3458b4cbecb1e091a80',
				},
			},
			operation: proof.equation,
			implementation: {
				runner: 'scripts/extraterrestrial/runners/run-production-local-light-exposure-qualification.js',
				runnerSha256: sha256(await readFile(import.meta.filename)),
				productionSourceFingerprints: after,
				node: process.version,
			},
			materialParameters: {
				photopicBaselineLuminanceCdM2: 5,
				wardVisibilityOffset: 1.219,
				wardLuminanceExponent: 0.4,
				wardGainExponent: 2.5,
				zeroLuminanceModifier: 10.50268593548108,
			},
			resultIdentityOwner: 'artifact-manifest.json',
		});
		const manifest = await run.finalize({
			conclusion: accepted ? 'accepted' : 'failed',
			result: proof,
			report: `# ${run.runId}: Production local-light exposure qualification\n\nConclusion: **${accepted ? 'accepted' : 'failed'}**.\n\nThis round qualifies the provisional zero-to-photopic Ward target and its global achromatic multiplication around the unchanged Bruneton Figure-1 coefficient. It adds no secondary source, smoothing, tuning, or render.\n`,
		});
		process.stdout.write(
			`${JSON.stringify({runId: run.runId, conclusion: manifest.conclusion, artifactSetSha256: manifest.artifactSetSha256, assertions}, null, 2)}\n`,
		);
		if (!accepted) process.exitCode = 1;
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {error: detail},
				report: `# ${run.runId}: Production local-light exposure qualification\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(
				`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`,
			);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
