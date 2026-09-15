import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {evaluateClosestVolumeFirstOrder} from './index.mjs';
import {incidentCoordinateProof} from './proof.mjs';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/incident-coordinate-plan.md';
const sourceRun = 'tmp/experiments/sky-accuracy-dials/runs/00168-p2-gauss8-high';
const allocation = 4 * 1024 ** 2;

/** Authenticate the pinned original Node executable.
 * @param {DialContinuationToolIdentity} expected - C0 runtime owner.
 * @returns {Promise<void>} Throws on mismatch.
 */
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

/** Test the predeclared nearly tangent witnesses at unchanged numerical tolerances.
 * @param {string} registrationRun - Original C0 owner.
 * @returns {Promise<{run:string,seal:DialFileIdentity,passed:boolean,checks:number}>} New immutable prediction evidence.
 */
export async function runIncidentCoordinateWitnesses(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const admission = admitJob(registration, 'cpu', 'component', allocation, 'C5');
	await authenticateNode(registration.record.host.node);
	const previous = acceptedMechanismInput(sourceRun);
	assert.equal(previous.seal.sha256, 'a5eec1e960fc5cd6c3cd7808c5f2d3fed5eed3ef1b0e1da54fc7387950e69a47');
	const artifact = mechanismArtifact(previous, 'unresolved-witnesses.json');
	/** @type {SkyVolumeResult[]} */ const witnesses = JSON.parse(readRepository(artifact.path, artifact).toString());
	assert.equal(witnesses.length, 8);
	assert.ok(witnesses.every((row) => !row.resolved));
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.ok(planBytes.toString().includes('incident-map-witness'));
	const sources = sourceIdentities();
	const parents = [
		registration.seal,
		registration.record.inputs,
		previous.seal,
		artifact,
		plan,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
		...(admission.usage.invalidEvidence ?? []).map((value) => value.seal),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Evaluate exact failed incident witnesses using a closest-approach-altitude Simpson coordinate while retaining original Gauss, equations, 4/1 passes, limits and admission. Test the prospectively frozen consistency predictions.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'incident-map-witness',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			caseId: 'incident-map-witness',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			channels: [0, 8],
			coordinateId: 'closest-approach-altitude-v1',
		},
	};
	const run = createRun('incident-map', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null);
	/** @type {SkySecondOrderCheck[]} */ const checks = [];
	/** @type {SkyVolumeResult[]} */ const results = [];
	let lastStorageCheck = 0;
	/** Enforce the cumulative job deadline and storage boundary. */
	function guard() {
		const now = Date.now();
		assert.ok(now - started < Math.min(300000, admission.timeoutMilliseconds) - 30000);
		if (now - lastStorageCheck >= 20000) {
			run.guard();
			lastStorageCheck = now;
		}
	}
	/** Write a new compact artifact with terminal headroom.
	 * @param {string} name - New basename.
	 * @param {unknown} value - JSON or bytes.
	 * @param {DialDerivation} [derivation] - Specific ancestry.
	 * @returns {DialFileIdentity} Artifact identity.
	 */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the exact registered witnesses and unchanged admission equations with the new coordinate.`,
		},
	) {
		guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(written + bytes.length < allocation - 768 * 1024);
		const result = run.write(name, bytes, derivation);
		written += result.byteLength;
		return result;
	}
	try {
		write('plan.md', planBytes, {
			parents: [plan],
			operation: 'Freeze the exact prospective coordinate predictions.',
		});
		const packed = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(packed, {level: 9}), {
			parents: sources,
			operation: 'Encode exact sources as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
			},
		});
		write('proof.json', incidentCoordinateProof());
		const spec = loadInputs().native48.transportSpec;
		for (const [index, old] of witnesses.entries()) {
			run.progress(
				'incident-coordinate',
				`Evaluating unchanged witness ${index + 1} with a different Simpson coordinate.`,
				index,
				8,
			);
			const result = evaluateClosestVolumeFirstOrder(spec, old.geometry.origin, old.geometry.direction, [0, 8], {
				profile: 'simpson-expanded-medium',
				outerStrategy: 'global',
				guard,
			});
			results.push(result);
			assert.deepEqual(result.geometry, old.geometry);
			checks.push({id: `witness-${index}:admission`, state: result.resolved ? 'passed' : 'unresolved'});
			const oldG = old.methods[0],
				oldS = old.methods[1],
				newG = result.methods[0],
				newS = result.methods[1];
			assert.deepEqual(newG.values, oldG.values);
			assert.deepEqual(newG.coarseValues, oldG.coarseValues);
			/** @param {number} value - Spectral radiance. @returns {number} Original fine tolerance. */ const tolerance =
				(value) => 1e-9 + 1e-6 * Math.abs(value);
			const oldDeviation = Math.abs(oldS.coarseValues[0] - oldG.values[0]);
			const newDeviation = newS.coarseValues ? Math.abs(newS.coarseValues[0] - oldG.values[0]) : null;
			const threshold = 0.25 * oldDeviation + tolerance(oldG.values[0]) + tolerance(oldS.values[0]);
			checks.push({
				id: `witness-${index}:coarse-error-reduction`,
				state: newDeviation === null ? 'unresolved' : newDeviation <= threshold ? 'passed' : 'failed',
			});
			for (const channelIndex of [0, 1])
				for (const oldMethod of old.methods)
					for (const newMethod of result.methods) {
						const a = oldMethod.values[channelIndex],
							b = newMethod.values?.[channelIndex];
						const allowed =
							b === null || b === undefined
								? null
								: tolerance(a) +
									tolerance(b) +
									oldMethod.innerAllowances[channelIndex] +
									newMethod.innerAllowances[channelIndex];
						checks.push({
							id: `witness-${index}:ch${[0, 8][channelIndex]}:${oldMethod.method}-to-${newMethod.method}-fine`,
							state: allowed === null ? 'unresolved' : Math.abs(a - b) <= allowed ? 'passed' : 'failed',
						});
					}
		}
		write('witnesses.json', witnesses, {
			parents: [artifact],
			operation: 'Preserve the original unresolved witnesses unchanged.',
		});
		write('reference.json', {schemaId: 'sky-incident-coordinate-witness-v1', results, checks});
		for (const parent of parents) readRepository(parent.path, parent);
		for (const source of sources) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const passed = !failure && results.length === 8 && checks.every((check) => check.state === 'passed');
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'incident-map-witness',
		caseId: 'incident-map-witness',
		passed,
		checks: checks.length,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes: allocation,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	if (failure) throw new Error(`Incident coordinate run failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal, passed, checks: checks.length};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runIncidentCoordinateWitnesses(process.argv[2]), null, 2));
}
