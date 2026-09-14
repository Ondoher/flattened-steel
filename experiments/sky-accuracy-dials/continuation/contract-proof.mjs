import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, lstatSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {setImmediate as yieldMainThread} from 'node:timers/promises';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	resolveRepository,
	sha256,
	sourceIdentities,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {readRegistration} from './registration/run.mjs';
import {admitJob} from './resources.mjs';
import {physicalReferencePolicy, physicalReferenceProof} from './reference/physical/index.mjs';

const ALLOCATED_BYTES = 1280 * 1024;
const TERMINAL_RESERVE_BYTES = 384 * 1024;
const COMPILER = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const COMPILER_TYPES = 'scripts/algorithm32/solar-zenith-cache/types.d.ts';
const TS_PACKAGE = 'node_modules/typescript/package.json';
const TS_IMPLEMENTATION = 'node_modules/typescript/lib/typescript.js';
const LITERAL_KINDS = [
	'StringLiteral',
	'NumericLiteral',
	'BigIntLiteral',
	'RegularExpressionLiteral',
	'NoSubstitutionTemplateLiteral',
	'TemplateHead',
	'TemplateMiddle',
	'TemplateTail',
];
const H_SEAL = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00103-c-r0-scr/sealed.json',
	byteLength: 214683,
	sha256: '162a0214b66c7576d3ee245c53cb826030ef393a660c6d4287f59cb8fa0aea24',
};
const ALLOCATION_SEAL = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00106-c-allocation/sealed.json',
	byteLength: 66362,
	sha256: '2cc4df211469bcc9b163cefe62c5945e83ad33bd9ba4369db850871363d96d0a',
};
const PHYSICAL_SEAL = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00109-c1-physical-j1/sealed.json',
	byteLength: 209177,
	sha256: '2e25adfe8ebecaf9da1cb036e435a1c30ada827a6bcb9e54757df3ad0cdb3995',
};

/** Stream-authenticate the actual registered Node binary without retaining its bytes.
 * @param {DialContinuationToolIdentity} expected - Exact C0 executable identity.
 * @returns {Promise<void>} Resolves only when path, bytes and version agree.
 */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const facts = lstatSync(expected.path);
	assert.ok(facts.isFile() && facts.size === expected.byteLength);
	const hash = createHash('sha256');
	let count = 0;
	for await (const bytes of createReadStream(expected.path)) {
		count += bytes.length;
		hash.update(bytes);
	}
	assert.equal(count, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Authenticate a uniquely inventoried artifact of a verified accepted parent.
 * @param {DialFileIdentity} seal - Exact accepted terminal seal.
 * @param {string} relative - Run-relative artifact path.
 * @returns {DialFileIdentity} Exact artifact identity without copied provenance fields.
 */
function artifact(seal, relative) {
	assert.deepEqual(verifyRun(path.posix.dirname(seal.path)), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.equal(terminal.state, 'accepted');
	const matches = terminal.artifacts.filter((item) => item.path === `${path.posix.dirname(seal.path)}/${relative}`);
	assert.equal(matches.length, 1);
	const result = {path: matches[0].path, byteLength: matches[0].byteLength, sha256: matches[0].sha256};
	readRepository(result.path, result);
	return result;
}

/** Parse and serialize JavaScript without loading or evaluating it.
 * @param {SkyContractTypeScript} ts - Authenticated parser/printer capability.
 * @param {string} text - Exact historical, current or manufactured source text.
 * @param {() => void} pulse - Bounded synchronous progress/cancellation callback.
 * @returns {SkyContractSerialization} Comment-free serialization plus every raw literal token.
 */
function serialize(ts, text, pulse) {
	const source = ts.createSourceFile(COMPILER, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
	assert.equal(source.parseDiagnostics.length, 0, 'Runtime parity refuses syntactically invalid JavaScript.');
	const kinds = new Map(
		LITERAL_KINDS.map((name) => {
			const kind = ts.SyntaxKind[name];
			assert.equal(typeof kind, 'number');
			return [kind, name];
		}),
	);
	/** @type {SkyContractLiteral[]} */ const literals = [];
	let nodeCount = 0;
	/** @param {SkyContractSyntaxNode} node */
	function visit(node) {
		nodeCount++;
		if (nodeCount % 512 === 0) pulse();
		if (kinds.has(node.kind)) {
			const start = node.getStart(source, false);
			literals.push({kind: kinds.get(node.kind), raw: text.slice(start, node.end), start, end: node.end});
		}
		// A truthy callback return would stop forEachChild at the first sibling.
		ts.forEachChild(node, (child) => {
			visit(child);
		});
	}
	visit(source);
	const printed = ts.createPrinter({removeComments: true, newLine: ts.NewLineKind.LineFeed}).printFile(source);
	return {printed, literals, nodeCount};
}

/** Positions are deliberately excluded because comments can move executable tokens.
 * @param {SkyContractSerialization} value - Parsed source representation.
 * @returns {string} Ordered exact token representation used by parity and hashing.
 */
function literalText(value) {
	return JSON.stringify(value.literals.map(({kind, raw}) => ({kind, raw})));
}

/** Apply the two independent exact equality requirements.
 * @param {SkyContractSerialization} historical - Original executed source representation.
 * @param {SkyContractSerialization} current - Candidate representation.
 */
function requireParity(historical, current) {
	assert.equal(current.printed, historical.printed, 'Comment-free production compiler serialization changed.');
	assert.equal(literalText(current), literalText(historical), 'Exact production compiler literal text changed.');
}

/** Retain compact reproducible hashes without dumping shader/source payloads twice.
 * @param {SkyContractSerialization} value - Parsed source representation.
 * @returns {SkyContractSerializationSummary} Exact serialization identities and traversal counts.
 */
function summarize(value) {
	const countsByKind = Object.fromEntries(
		LITERAL_KINDS.map((kind) => [kind, value.literals.filter((item) => item.kind === kind).length]),
	);
	return {
		printerSha256: sha256(value.printed),
		printerByteLength: Buffer.byteLength(value.printed),
		literalSha256: sha256(literalText(value)),
		literalCount: value.literals.length,
		nodeCount: value.nodeCount,
		countsByKind,
	};
}

/** Reject an in-memory source mutation through the real parity boundary.
 * @param {SkyContractTypeScript} ts - Authenticated TypeScript capability.
 * @param {SkyContractSerialization} original - Unaltered representation.
 * @param {string} altered - Deliberately changed source text, never evaluated.
 * @param {string} operation - Explicit negative-control operation.
 * @param {() => void} pulse - Progress/deadline callback.
 * @param {boolean} printerMustReject - Numeric/shader changes must fail both independent checks.
 * @returns {SkyContractNegativeControl} Exact rejection evidence.
 */
function negativeControl(ts, original, altered, operation, pulse, printerMustReject) {
	const changed = serialize(ts, altered, pulse);
	const rejectedByPrinter = changed.printed !== original.printed;
	const rejectedByLiterals = literalText(changed) !== literalText(original);
	assert.ok(rejectedByLiterals, `${operation}: exact literal guard failed to reject.`);
	if (printerMustReject) assert.ok(rejectedByPrinter, `${operation}: runtime printer guard failed to reject.`);
	assert.throws(() => requireParity(original, changed));
	return {operation, alteredSourceSha256: sha256(altered), rejectedByPrinter, rejectedByLiterals};
}

/** Prove contract-only repairs against the executed H source and frozen physical policy.
 * All production text is parsed as data. Only existing manufactured physical checks
 * execute; no shader, recurrence, GPU job or new benchmark ray is evaluated.
 * @param {string} registrationRun - Exact original accepted C0 registration.
 * @returns {Promise<DialExecutionResult>} Strictly verified immutable proof result.
 */
export async function runContractParityProof(registrationRun) {
	const started = Date.now();
	const registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', ALLOCATED_BYTES, 'C1');
	assert.deepEqual(admission.usage.allocationAmendment?.seal, ALLOCATION_SEAL);
	await authenticateNode(registration.record.host.node);
	const historicalSnapshot = artifact(H_SEAL, `sources/${COMPILER}.txt`);
	const h = JSON.parse(readRepository(H_SEAL.path, H_SEAL).toString());
	assert.equal(h.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(h.recipe.parameters.jobKind, 'gpu');
	assert.equal(h.result.failure, null);
	// Production collaborators are retained in the explicit served-source closure.
	const originalSources = h.recipe.parameters.sourceIdentities.filter((source) => source.path === COMPILER);
	assert.equal(originalSources.length, 1);
	const historicalCompiler = originalSources[0];
	assert.equal(historicalCompiler.byteLength, historicalSnapshot.byteLength);
	assert.equal(historicalCompiler.sha256, historicalSnapshot.sha256);
	const physicalControl = artifact(PHYSICAL_SEAL, 'control.json');
	const physicalParent = JSON.parse(readRepository(PHYSICAL_SEAL.path, PHYSICAL_SEAL).toString());
	assert.equal(physicalParent.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(physicalParent.result.referenceResolved, true);
	const control = JSON.parse(readRepository(physicalControl.path, physicalControl).toString());
	assert.deepEqual(control.registration, registration.seal);
	assert.equal(control.profile, 'simpson-expanded-medium');
	const currentCompiler = identity(COMPILER),
		currentTypes = identity(COMPILER_TYPES);
	const typeScriptPackage = identity(TS_PACKAGE),
		typeScriptImplementation = identity(TS_IMPLEMENTATION);
	const packageInfo = JSON.parse(readRepository(TS_PACKAGE, typeScriptPackage).toString());
	assert.equal(packageInfo.name, 'typescript');
	assert.equal(packageInfo.main, './lib/typescript.js');
	assert.equal(
		checkedAbsolute(createRequire(import.meta.url).resolve('typescript')),
		resolveRepository(TS_IMPLEMENTATION),
	);
	const ts = /** @type {SkyContractTypeScript} */ (/** @type {unknown} */ ((await import('typescript')).default));
	assert.equal(ts.version, packageInfo.version);
	for (const capability of [ts.createSourceFile, ts.createPrinter, ts.forEachChild])
		assert.equal(typeof capability, 'function');
	const tools = {
		node: registration.record.host.node,
		typeScriptPackage,
		typeScriptImplementation,
		typeScriptVersion: ts.version,
	};
	const sources = [...sourceIdentities(), currentCompiler, currentTypes];
	const parents = [
		registration.seal,
		H_SEAL,
		historicalSnapshot,
		PHYSICAL_SEAL,
		physicalControl,
		ALLOCATION_SEAL,
		currentCompiler,
		currentTypes,
		typeScriptPackage,
		typeScriptImplementation,
		...(admission.usage.invalidEvidence ?? []).map((record) => record.seal),
	];
	const recipe = {
		parents,
		operation:
			'Compare historical/current JavaScript with the authenticated TypeScript removeComments printer and exact ordered raw literal tokens; reject in-memory numeric/shader/string mutations; reproduce the retained physical policy and run only its existing manufactured proof. Production compiler text is never imported or evaluated. Invalid parents remain accounting-only evidence.',
		parameters: {
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C1',
			allocatedBytes: ALLOCATED_BYTES,
			admission,
			tools,
			parser: {scriptKind: 'JS', scriptTarget: 'Latest', setParentNodes: true},
			printer: {removeComments: true, newLine: 'LF'},
			literalKinds: LITERAL_KINDS,
		},
	};
	const before = storage(),
		run = createRun('c1-contracts', recipe);
	let phase = 'contract-authentication',
		message = 'Authenticated original compiler snapshot, physical policy, allocation and tool identities.',
		lastProgress = 0;
	/** Flush synchronous progress or reject exceeded time/storage bounds. */
	function pulse() {
		if (Date.now() - lastProgress < 20000) return;
		run.progress(phase, message);
		lastProgress = Date.now();
		guard();
	}
	/** Enforce complete-job resource accounting, including elapsed preflight. */
	function guard() {
		assert.ok(
			Date.now() - started < admission.timeoutMilliseconds,
			'Contract parity proof exhausted its CPU deadline.',
		);
		const current = run.guard();
		assert.ok(
			current.retainedBytes - before.retainedBytes < ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
			'Contract parity proof exhausted its artifact allocation.',
		);
	}
	/** @param {string} nextPhase @param {string} nextMessage */
	async function progress(nextPhase, nextMessage) {
		phase = nextPhase;
		message = nextMessage;
		lastProgress = 0;
		pulse();
		await yieldMainThread();
	}
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	function write(name, value, derivation) {
		guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
		assert.ok(
			storage().retainedBytes - before.retainedBytes + bytes.length < ALLOCATED_BYTES - TERMINAL_RESERVE_BYTES,
		);
		return run.write(name, bytes, derivation);
	}
	let terminal = false;
	try {
		await progress(phase, message);
		const sourceRecords = [];
		for (const source of sources) {
			sourceRecords.push({...source, base64: readRepository(source.path, source).toString('base64')});
			pulse();
		}
		const snapshot = Buffer.from(JSON.stringify(sourceRecords));
		write('sources.json.gz', gzipSync(snapshot, {level: 9}), {
			parents: sources,
			operation:
				'Preserve exact relevant source bytes as JSON path/byteLength/sha256/base64 records, compressed with Node zlib gzip level9. Historical compiler bytes remain in their original immutable parent. Node and TypeScript implementation binaries are identified, not copied.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: snapshot.length,
				uncompressedSha256: sha256(snapshot),
			},
		});
		write('tools.json', tools);
		await progress(
			'compiler-parity',
			'Comparing comment-free runtime serialization and every exact raw literal token.',
		);
		const historicalText = readRepository(historicalSnapshot.path, historicalSnapshot).toString();
		const historical = serialize(ts, historicalText, pulse);
		const current = serialize(ts, readRepository(COMPILER, currentCompiler).toString(), pulse);
		requireParity(historical, current);
		await progress(
			'parity-controls',
			'Checking full literal traversal, a comment-only positive control, and deliberately changed executable/shader tokens.',
		);
		const fixture =
			"/* metadata '0' */\nconst number=0x10; const later=1_000; const big=12n; const regex=/ab+/gi; const plain='\\x41'; const shader=`shader`; const template=`head ${plain} middle ${number} tail`;\n";
		const manufactured = serialize(ts, fixture, pulse);
		assert.equal(manufactured.literals.length, 9);
		assert.deepEqual(
			[...new Set(manufactured.literals.map((item) => item.kind))].sort(),
			[...LITERAL_KINDS].sort(),
		);
		const commentOnly = fixture.replace("/* metadata '0' */", "/** @param {'12'} count - Documentation only. */");
		requireParity(manufactured, serialize(ts, commentOnly, pulse));
		const numeric = historical.literals.filter((literal) => literal.kind === 'NumericLiteral').at(-1);
		const shader = historical.literals.find((literal) => literal.raw.includes('#version 300 es'));
		assert.ok(
			numeric && shader,
			'The actual compiler must supply executable numeric and shader-string negative controls.',
		);
		const numericMutation =
			historicalText.slice(0, numeric.start) +
			(numeric.raw === '0' ? '1' : '0') +
			historicalText.slice(numeric.end);
		const shaderMutation =
			historicalText.slice(0, shader.start) +
			shader.raw.replace('#version 300 es', '#version 310 es') +
			historicalText.slice(shader.end);
		const negativeControls = [
			negativeControl(
				ts,
				historical,
				numericMutation,
				'Change the final executable numeric literal in the actual historical compiler.',
				pulse,
				true,
			),
			negativeControl(
				ts,
				historical,
				shaderMutation,
				'Change a GLSL version token inside the actual historical shader string.',
				pulse,
				true,
			),
			negativeControl(
				ts,
				manufactured,
				fixture.replace("'\\x41'", "'A'"),
				'Change raw string escape spelling while preserving its decoded value.',
				pulse,
				false,
			),
		];
		assert.throws(() => serialize(ts, 'const invalid = `unterminated', pulse));
		await progress(
			'physical-policy',
			'Checking exact retained expanded-policy values and existing manufactured physical admission proofs.',
		);
		const physicalPolicy = physicalReferencePolicy('simpson-expanded-medium');
		assert.deepEqual(physicalPolicy, control.numericalPolicy);
		const physicalManufacturedProof = physicalReferenceProof();
		/** @type {SkyContractParityReport} */
		const report = {
			schemaId: 'sky-continuation-contract-parity-v1',
			historicalCompiler,
			historicalSnapshot,
			currentCompiler,
			currentTypes,
			historical: summarize(historical),
			current: summarize(current),
			executableParity: true,
			manufacturedLiteralKinds: [...LITERAL_KINDS],
			negativeControls,
			malformedSourceRejected: true,
			physicalControl,
			physicalPolicy,
			physicalPolicySha256: sha256(JSON.stringify(physicalPolicy)),
			physicalManufacturedProof,
			tools,
			limitations: [
				'AST printer and raw literal parity establish the requested contract-only compiler boundary; no shader or production compiler execution occurs.',
				'The policy equality and manufactured proofs preserve numerical values/admission checks; no new physical reference samples or GPU recurrence are generated.',
			],
		};
		const resultArtifact = write('result.json', report);
		await progress(
			'contract-reauthentication',
			'Rechecking every parent, source and tool identity before immutable sealing.',
		);
		for (const parent of parents) {
			readRepository(parent.path, parent);
			pulse();
		}
		for (const source of sources) {
			readRepository(source.path, source);
			pulse();
		}
		await authenticateNode(registration.record.host.node);
		guard();
		run.cleanup();
		const result = {
			contractParityPassed: true,
			result: resultArtifact,
			jobElapsedMilliseconds: Date.now() - started,
			allocatedBytes: ALLOCATED_BYTES,
			gpuJobsExecuted: 0,
			physicalBenchmarkSamplesExecuted: 0,
		};
		assert.ok(
			Buffer.byteLength(JSON.stringify({sources, recipe, result})) * 3 + 65536 < TERMINAL_RESERVE_BYTES,
			'Contract proof terminal metadata exceeds its reserve.',
		);
		const seal = run.finish('accepted', result);
		terminal = true;
		assert.deepEqual(verifyRun(run.path), seal);
		const completed = JSON.parse(readRepository(seal.path, seal).toString());
		assert.equal(completed.state, 'accepted');
		const retainedBytes = seal.byteLength + completed.artifacts.reduce((sum, item) => sum + item.byteLength, 0);
		assert.ok(retainedBytes <= ALLOCATED_BYTES);
		return {run: run.path, seal, accepted: true};
	} catch (error) {
		if (!terminal) {
			run.progress('contract-failure', String(error).slice(0, 4096));
			run.finish('failed', {
				message: String(error).slice(0, 8192),
				stack: String(error?.stack ?? '').slice(0, 8192),
				contractParityPassed: false,
				jobElapsedMilliseconds: Date.now() - started,
				allocatedBytes: ALLOCATED_BYTES,
				gpuJobsExecuted: 0,
				physicalBenchmarkSamplesExecuted: 0,
			});
		}
		throw error;
	}
}
