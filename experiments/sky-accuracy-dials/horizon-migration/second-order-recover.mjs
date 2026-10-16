import assert from 'node:assert/strict';
import ts from 'typescript';
import {createRun, identity, readRepository, sha256, verifyRun} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {ownedPacket} from './math.mjs';
import {secondOrder} from './second-order-math.mjs';
import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DistantSunLightSource} from '../../../src/algorithm32/implementation/distant-sun/DistantSunLightSource.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER as f68} from '../../../src/algorithm32/sampling-domains/index.js';

/** Remove only type syntax and comments using the installed compiler, preserving executable semantics for byte comparison.
 * @param {string} source Exact UTF-8 JavaScript source.
 * @returns {string} Canonical ES2022 executable text; invalid syntax aborts recovery.
 */
function executable(source) {
	const result = ts.transpileModule(source, {
		reportDiagnostics: true,
		compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true},
	});
	assert.ok(!result.diagnostics?.length);
	return result.outputText;
}

/** Qualify completed physical artifacts without changing or relabeling their failed producer.
 * @returns {void} Seals an accepted derivative only after exact original-source reconstruction and fresh numerical parity; failures remain failed.
 */
function main() {
	const spent = requireUnusedStage('h33-recover-r2', true),
		started = Date.now();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const parent = '00272-h33-species',
		root = 'experiments/sky-accuracy-dials/horizon-migration/';
	const seal = /** @type {HorizonSecondOrderRecoverySeal} */ (readParent(parent, 'sealed.json', parents));
	assert.equal(seal.state, 'failed');
	assert.equal(seal.heartbeatFailure, null);
	assert.deepEqual(
		seal.sourceFailures.map((v) => v.path).sort(),
		[root + 'second-order-math.mjs', root + 'second-order-types.d.ts', root + 'second-order.mjs'].sort(),
	);
	const registration = /** @type {HorizonSecondOrderRegistration} */ (
		readParent(parent, 'registration.json', parents)
	);
	const phaseSeals = ['00273-h33-phase', '00274-h33-phase-r2'].map(
		(name) => /** @type {HorizonAuditTimingSeal} */ (readParent(name, 'sealed.json', parents)),
	);
	const interrupted = /** @type {HorizonAuditTimingSeal} */ (
		readParent('00275-h33-recovery', 'sealed.json', parents)
	);
	const remaining =
		360000 -
		seal.result.elapsedMilliseconds -
		phaseSeals.reduce((s, v) => s + v.result.elapsedMilliseconds, 0) -
		interrupted.result.elapsedMilliseconds -
		spent -
		30000;
	assert.ok(remaining > 10000);
	const reconstructed = [];
	for (const name of ['second-order-math.mjs', 'second-order.mjs']) {
		const path = root + name,
			current = readRepository(path).toString();
		parents.push(identity(path));
		let original = current;
		if (name === 'second-order-math.mjs')
			original = original
				.replace('@returns {HorizonSecondOrderIncident}', '@returns {readonly (readonly number[])[]}')
				.replace('@param {HorizonSecondOrderGuard}', '@param {()=>void}');
		else
			original = original
				.replace(
					'@type {HorizonMigrationReadonly<readonly HorizonAuditIncomingRow[]>}',
					'@type {readonly HorizonAuditIncomingRow[]}',
				)
				.replace(
					"\tconst qualification = /** @type {HorizonSecondOrderQualification} */ (\n\t\treadParent('00265-h16-h20-qual', 'qualification.json', parents)\n\t);",
					"\tconst qualification =\n\t\t/** @type {{angular: readonly {mode: number, altitude: number, reference: HorizonAuditAngular}[]}} */ (\n\t\t\treadParent('00265-h16-h20-qual', 'qualification.json', parents)\n\t\t);",
				);
		const expected = seal.sources.find((v) => v.path === path);
		assert.ok(expected);
		assert.equal(
			sha256(original),
			expected.sha256,
			'Original source reconstruction must match the producer exact hash.',
		);
		assert.equal(
			executable(original),
			executable(current),
			'Executable arithmetic changed; data cannot be recovered with this method.',
		);
		reconstructed.push({
			path,
			original,
			originalIdentity: expected,
			currentIdentity: identity(path),
			executableSha256: sha256(executable(current)),
		});
	}
	for (const source of seal.sources)
		if (!source.path.endsWith('.d.ts') && !seal.sourceFailures.some((v) => v.path === source.path))
			readRepository(source.path, source);
	const observations = /** @type {HorizonMigrationBatches} */ (
		readParent('00267-h21-h26-ref', 'inputs.json.gz', parents)
	);
	const input = ownedPacket(registration.input),
		geometry = new SphericalEarthGeometry({
			bottomRadius: {value: input.radius, units: 'meters'},
			topRadius: {value: input.radius + input.topAltitude, units: 'meters'},
			observerHeight: {value: 5, units: 'meters'},
		});
	geometry.configureLightSource({
		lightSource: new DistantSunLightSource({angularRadius: {value: 0.26667, units: 'degrees'}}),
		observation: observations.observations[1].facts.state.observation,
		placement: {
			kind: 'distant-direction',
			directionToLight: /** @type {SkyVector3} */ ([
				input.sourceDirection[0],
				input.sourceDirection[1],
				input.sourceDirection[2],
			]),
		},
	});
	const directions = f68.unitVectors.map((v) => geometry.expressPhysicalIncomingRadianceDirection(v));
	parents.push(
		identity(
			'node_modules/typescript/lib/typescript.js',
			readRepository('node_modules/typescript/lib/typescript.js', undefined, 12 * 1024 ** 2),
		),
	);
	const run = createRun('h33-recover-r2', {
		parents,
		operation:
			'Qualify complete spectra from a failed source-integrity producer by exact original JS reconstruction, identical comment/type-erased executable code, unchanged collaborator authentication, and fresh F68 numerical parity. Preserve original failed seal and declaration-only change.',
		parameters: {
			maximumMilliseconds: remaining,
			maximumRetainedBytes: 4 * 1024 ** 2,
			typescriptVersion: ts.version,
			parentState: seal.state,
		},
	});
	try {
		let lastGuard = 0;
		/** Bound time and flush expensive storage checks at most once per15s. @returns {void} */
		function guard() {
			assert.ok(Date.now() - started < remaining);
			if (Date.now() - lastGuard > 15000) {
				lastGuard = Date.now();
				run.guard();
			}
		}
		run.write('source-reconstruction.json', reconstructed);
		const checks = [];
		for (const receiver of registration.receivers) {
			const artifact = `receiver-${receiver.elevation}-${receiver.height}.json`;
			const saved = /** @type {HorizonSecondOrderRecoveryReceiver} */ (readParent(parent, artifact, parents));
			for (const kind of /** @type {const} */ (['actual', 'column'])) {
				const previous = saved.controls.find((c) => c.rule === 'F68' && c.kind === kind);
				assert.ok(previous);
				const now = secondOrder(
					{input, ...receiver, directions, weights: f68.integrationWeights.values, kind, pathCount: 8},
					guard,
				);
				const maximumRelative = Math.max(
					...now.history.flatMap((r, a) =>
						r.flatMap((v, b) => v.map((x, c) => Math.abs(x / previous.value.history[a][b][c] - 1))),
					),
				);
				assert.ok(maximumRelative < 1e-12);
				checks.push({elevation: receiver.elevation, height: receiver.height, kind, maximumRelative});
			}
			run.write(artifact, saved);
		}
		const assessment = readParent(parent, 'assessment.json', parents);
		run.write('assessment.json', assessment);
		run.write('qualification.json', {
			parentState: seal.state,
			sourceFailures: seal.sourceFailures,
			reason: 'All changed executable files were reconstructed to original captured hashes and compiler-emitted executable text is identical. The remaining changed file was ambient declarations and not executable. Original source-integrity failure remains immutable.',
			checks,
			originalAssessment: identity(`tmp/experiments/sky-accuracy-dials/runs/${parent}/assessment.json`),
			limits: 'This qualifies numerical artifacts, not the failed producer execution. It grants no N4, historical migration or external-reference claim.',
		});
		run.cleanup();
		assert.ok(Date.now() - started < remaining);
		run.finish('accepted', {
			elapsedMilliseconds: Date.now() - started,
			parentMilliseconds: seal.result.elapsedMilliseconds,
			phaseMilliseconds: phaseSeals.reduce((s, v) => s + v.result.elapsedMilliseconds, 0),
			priorFailureMilliseconds: spent,
			interruptedMilliseconds: interrupted.result.elapsedMilliseconds,
			gpuJobs: 0,
		});
		verifyRun(run.path);
		assert.equal(JSON.parse(readRepository(run.path + '/sealed.json').toString()).state, 'accepted');
		console.log(JSON.stringify({run: run.path, checks, elapsedMilliseconds: Date.now() - started}));
	} catch (error) {
		run.finish('failed', {elapsedMilliseconds: Date.now() - started, message: String(error)});
		throw error;
	}
}
main();
