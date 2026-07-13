import path from 'node:path';

import {CanonicalAtmosphere} from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import {
	NAMED_ATMOSPHERE_COMPOSITION_CATALOG,
	listNamedAtmosphereCompositions,
	mieVerticalOpticalDepthAt,
	resolveNamedAtmosphereComposition,
} from '../atmospheres/NamedAtmosphereCompositions.js';
import {
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-named-atmosphere-composition-contract-proof.js';
const EXECUTABLE_IDS = [
	'molecular-only',
	'canonical-aerosol-1x',
	'canonical-aerosol-2x',
	'canonical-aerosol-4x',
];
const EXPECTED_BETA = [0, 0.04, 0.08, 0.16];

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(value) {
	return JSON.stringify(value);
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'named-atmosphere-composition-contract-proof',
		command: COMMAND,
		inputs: {
			fixture: 'scripts/extraterrestrial/fixtures/named-atmosphere-compositions-v1.json',
			scope: 'named atmosphere configuration and representability only; no atmosphere cache build, transport execution, Color transform, framebuffer, or render',
		},
		provenance: {
			baseline: 'current contained Algorithm32 canonical atmosphere constants',
			variation: 'controlled Mie Angstrom beta multipliers with every other atmosphere field held fixed',
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			opticalAirMass: 'https://doi.org/10.1088/0143-0807/27/2/013',
			design: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
		},
	});

	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');

		const all = listNamedAtmosphereCompositions();
		const executable = EXECUTABLE_IDS.map(resolveNamedAtmosphereComposition);
		const assertions = [];
		const check = (condition, message) => {
			requireCondition(condition, message);
			assertions.push(message);
		};

		check(all.length === 6 && new Set(all.map((entry) => entry.id)).size === 6,
			'The catalog exposes six unique named definitions.');
		check(executable.map((entry) => entry.id).join('|') === EXECUTABLE_IDS.join('|'),
			'The four executable definitions retain their declared order and ids.');
		check(executable.every((entry, index) => entry.constants.mieAngstromBeta === EXPECTED_BETA[index]),
			'The Mie loading ladder resolves exactly to beta 0, 0.04, 0.08, and 0.16.');

		const canonical = resolveNamedAtmosphereComposition('canonical-aerosol-1x');
		check(exactJson(canonical.constants) === exactJson(CANONICAL_ATMOSPHERE_CONSTANTS),
			'The canonical-aerosol-1x constants are byte-structurally identical to the current canonical constants.');

		const invariantKeys = NAMED_ATMOSPHERE_COMPOSITION_CATALOG.parameterization.invariantFields;
		check(executable.every((entry) => invariantKeys.every((key) =>
			exactJson(entry.constants[key]) === exactJson(CANONICAL_ATMOSPHERE_CONSTANTS[key]))),
			'Every non-loading atmosphere field remains invariant across the executable ladder.');

		const opticalDepth550 = executable.map((entry) =>
			mieVerticalOpticalDepthAt(entry.constants, 0.55));
		check(opticalDepth550.every((value, index) => index === 0 || value > opticalDepth550[index - 1]),
			'Mie vertical optical depth at 550 nm increases strictly across the named ladder.');
		check(executable.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.constants)),
			'Executable definitions and resolved constants are immutable.');

		const atmospheres = executable.map((entry) => new CanonicalAtmosphere({
			constants: entry.constants,
			spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		}));
		const extinction550 = atmospheres.map((atmosphere) =>
			atmosphere.mieExtinctionCoefficientAt({value: 550, units: 'nanometers'}));
		check(extinction550[0] === 0 && extinction550.every((value, index) =>
			Math.abs(value - EXPECTED_BETA[index] / 1200 * 0.55 ** -0.8) <= 1e-18),
			'CanonicalAtmosphere accepts every definition and evaluates the expected sea-level 550 nm Mie extinction.');

		for (const unsupportedId of ['ozone-reference', 'elevated-aerosol-layer']) {
			let rejected = false;
			try { resolveNamedAtmosphereComposition(unsupportedId); } catch (error) {
				rejected = error instanceof RangeError && error.message.includes('not executable');
			}
			check(rejected, `${unsupportedId} fails loudly instead of degrading to the canonical atmosphere.`);
		}

		const rows = executable.map((entry, index) => ({
			id: entry.id,
			name: entry.name,
			mieLoadingMultiplier: entry.mieLoadingMultiplier,
			mieAngstromBeta: entry.constants.mieAngstromBeta,
			mieVerticalOpticalDepthAt550Nanometers: opticalDepth550[index],
			mieSeaLevelExtinctionAt550NanometersPerMeter: extinction550[index],
		}));
		const evidence = {
			proofId: 'named-atmosphere-composition-contract-v1',
			accepted: true,
			assertions,
			rows,
			unsupported: NAMED_ATMOSPHERE_COMPOSITION_CATALOG.unsupported,
			claimBoundary: NAMED_ATMOSPHERE_COMPOSITION_CATALOG.claimBoundary,
		};
		await run.writeJsonArtifact('evidence/named-atmosphere-compositions.json', evidence);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-named-atmosphere-composition-contract-proof.js',
				'atmospheres/NamedAtmosphereCompositions.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
			],
		});
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Named atmosphere protected inventory');
		evidence.containment = {
			protectedFiles: after.fileCount,
			closureFileCount: closure.files.length,
			closureEdgeCount: closure.edges.length,
		};
		const terminal = await run.finalize({
			conclusion: 'accepted',
			result: evidence,
			report: `# ${run.runId}: Named atmosphere composition contract\n\nConclusion: **accepted for configuration and representability**.\n\nThe four executable compositions preserve every canonical field except Mie Angstrom beta. Ozone and elevated-layer definitions fail loudly because the current medium cannot represent them. No atmosphere cache, transport field, Color transform, or render was executed.\n`,
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: terminal.artifactSetSha256,
			assertionCount: assertions.length,
			rows,
		}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {error: detail},
				report: `# ${run.runId}: Named atmosphere composition contract\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
