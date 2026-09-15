import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	outputRelative,
	readRepository,
	resolveRepository,
	sha256,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {resourceExtensionBytes, resourceExtensionSchema, resourceExtensionThrough} from './index.mjs';
import {readResourceExtensionBasis, resourceExtensionSources, authenticateResourceExtension} from './read.mjs';
import {resourceExtensionProof} from './proof.mjs';

/** @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Preflight is read-only and requires the exact usage cut to be the latest completed run.
 * @param {string} registrationRun
 */
export async function prepareResourceExtension(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', resourceExtensionBytes, 'C6');
	await authenticateNode(registration.record.host.node);
	const latest = readdirSync(resolveRepository(outputRelative + '/runs'))
		.sort()
		.at(-1);
	assert.equal(outputRelative + '/runs/' + latest + '/sealed.json', resourceExtensionThrough.path);
	const basis = readResourceExtensionBasis(registration, admission.usage),
		snapshot = resourceExtensionSources(basis.through);
	const packed = Buffer.from(
		JSON.stringify(snapshot.delta.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
	);
	const compressed = gzipSync(packed, {level: 9}),
		proof = resourceExtensionProof();
	const parents = [...basis.parents, ...(admission.usage.invalidEvidence ?? []).map((x) => x.seal)];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Register the sole conserved C3/C6-to-C5 byte transfer after exact00210; retain the unchanged original limits, prior amendment, authenticated chronological usage and reporting reserve.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'resource-extension',
			caseId: 'resource-extension',
			resourceExtensionSchemaId: resourceExtensionSchema,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C6',
			allocatedBytes: resourceExtensionBytes,
			admission,
			sourceIdentities: snapshot.sources,
			node: registration.record.host.node,
			maximumJobMilliseconds: 300000,
			finalizationReserveMilliseconds: 30000,
			sourceSnapshotBase: snapshot.baseSnapshot,
		},
	};
	const planBytes = readRepository(basis.record.plan.path, basis.record.plan);
	const sealReserveBytes = 768 * 1024;
	// createRun retains source identities both directly and in the recipe. Allow
	// another64KiB for its command, identity, storage and framing fields.
	const definitionUpperBound = Buffer.byteLength(JSON.stringify({sources: snapshot.sources, recipe})) + 64 * 1024;
	const artifactUpperBound =
		compressed.length +
		planBytes.length +
		Buffer.byteLength(JSON.stringify(basis.record)) +
		Buffer.byteLength(JSON.stringify(proof)) +
		16 * 1024;
	const forecast = {
		allocatedBytes: resourceExtensionBytes,
		definitionUpperBound,
		artifactUpperBound,
		sealReserveBytes,
		totalUpperBound: definitionUpperBound + artifactUpperBound + sealReserveBytes,
		sourceCount: snapshot.sources.length,
		deltaSourceCount: snapshot.delta.length,
		deltaCompressedBytes: compressed.length,
		remainingC6AfterMaximumRecord:
			12 * 1024 ** 2 - admission.usage.retainedBytesByPhase.C6 - resourceExtensionBytes,
	};
	assert.ok(forecast.totalUpperBound <= resourceExtensionBytes, 'Preflight metadata/snapshot forecast exceeds2MiB.');
	assert.ok(forecast.remainingC6AfterMaximumRecord >= 3 * 1024 ** 2);
	assert.ok(Date.now() - started < 270000);
	return {
		started,
		registration,
		admission,
		basis,
		snapshot,
		packed,
		compressed,
		proof,
		parents,
		recipe,
		planBytes,
		forecast,
	};
}

/** Explicit execution entry; prepareResourceExtension alone never allocates evidence.
 * @param {string} registrationRun @returns {Promise<{run:string,seal:DialFileIdentity,retainedBytes:number}>}
 */
export async function runResourceExtension(registrationRun) {
	const prepared = await prepareResourceExtension(registrationRun);
	const {
		started,
		registration,
		admission,
		basis,
		snapshot,
		packed,
		compressed,
		proof,
		parents,
		recipe,
		planBytes,
		forecast,
	} = prepared;
	const run = createRun('c-resource-ext', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength;
	/** @type {Error|null} */ let failure = null;
	/** @param {string} name @param {unknown} contents @param {DialDerivation} [derivation] @param {boolean} [terminal] */
	function write(
		name,
		contents,
		derivation = {
			parents: [definition],
			operation: 'Derive ' + name + ' from the fixed resource extension and authenticated pre-transfer usage.',
		},
		terminal = false,
	) {
		assert.ok(Date.now() - started < 300000 - (terminal ? 0 : 30000));
		const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(JSON.stringify(contents) + '\n');
		assert.ok(written + bytes.length <= resourceExtensionBytes - forecast.sealReserveBytes);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress('resource-extension', 'Pre-transfer C6 admission and fixed conserved transfer authenticated.');
		write('resource-extension-plan.md', planBytes, {
			parents: [basis.record.plan],
			operation: 'Preserve the exact prospective resource-extension plan.',
		});
		write('extension.json', basis.record);
		write('proof.json', proof);
		write('preflight.json', forecast);
		write('sources-delta.json.gz', compressed, {
			parents: [snapshot.baseSnapshot, ...snapshot.delta],
			operation:
				'Reconstruct the complete current POC source from immutable00210sources plus these exact changed/new base64 entries; every omitted current file matches its00210identity and no deletion is permitted.',
			parameters: {
				schemaId: 'sky-source-base64-delta-v1',
				baseSnapshot: snapshot.baseSnapshot,
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
				currentSourceIdentities: snapshot.sources,
			},
		});
		for (const id of [...parents, ...snapshot.sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup();
	try {
		write(
			'execution.json',
			{
				completed: failure === null,
				extensionRegistered: failure === null,
				gpuJobsExecuted: 0,
				physicalIntegrationsExecuted: 0,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				cleanup,
				failure: failure?.message ?? null,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'resource-extension',
		caseId: 'resource-extension',
		extensionRegistered: failure === null,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes: resourceExtensionBytes,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyResourceExtensionTerminal} */ (
		JSON.parse(readRepository(seal.path, seal).toString())
	);
	const retainedBytes = seal.byteLength + terminal.artifacts.reduce((s, a) => s + a.byteLength, 0);
	assert.ok(retainedBytes <= resourceExtensionBytes);
	if (failure) throw new Error('Resource extension failed in ' + run.path + ': ' + failure.message);
	authenticateResourceExtension(registration, seal, basis.previous, admission.usage, basis.through.seal);
	return {run: run.path, seal, retainedBytes};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 4);
	assert.ok(['preflight', 'run'].includes(process.argv[2]));
	console.log(
		JSON.stringify(
			process.argv[2] === 'preflight'
				? (await prepareResourceExtension(process.argv[3])).forecast
				: await runResourceExtension(process.argv[3]),
		),
	);
}
