import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync, rmdirSync, existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRun, identity, readRepository, verifyRun, checkedAbsolute, sha256} from '../io/files.mjs';

/** Remove only a completed, authenticated staging bundle below its live owner.
 * Each exact file is checked and unlinked; the final directory removal is nonrecursive.
 * @param {DialRun} run @param {string} directory @param {Map<string,string>} files
 * @returns {{directory:string,fileCount:number,absent:boolean,milliseconds:number}}
 */
export function releaseStaged(run, directory, files) {
	const started = performance.now(),
		owner = JSON.parse(readFileSync(checkedAbsolute(path.join(run.scratchPath, 'owner.json')), 'utf8'));
	assert.equal(owner.schemaId, 'sky-accuracy-scratch-owner-v1');
	assert.equal(owner.owner, run.path);
	assert.ok(directory.startsWith(run.scratchPath + path.sep));
	checkedAbsolute(directory);
	assert.deepEqual(readdirSync(directory).sort(), [...files.keys()].sort());
	for (const [name, contents] of files) {
		assert.equal(path.basename(name), name);
		const target = checkedAbsolute(path.join(directory, name));
		assert.equal(sha256(readFileSync(target)), sha256(contents));
		unlinkSync(target);
	}
	rmdirSync(checkedAbsolute(directory));
	assert.ok(!existsSync(directory));
	return {directory, fileCount: files.size, absent: true, milliseconds: performance.now() - started};
}

/** Prove the cleanup repair using an actual archived200-file bundle, without running transport.
 * @returns {void}
 */
function proof() {
	const root = 'tmp/experiments/sky-accuracy-dials/runs/00360-h57-libradtran',
		sealId = identity(root + '/sealed.json'),
		seal = JSON.parse(readRepository(sealId.path, sealId).toString()),
		inputPath = root + '/r0-n1-s0-input.json',
		input = seal.artifacts.find((a) => a.path === inputPath);
	assert.ok(input);
	const detail = JSON.parse(readRepository(inputPath, input).toString()),
		manifest = JSON.parse(readRepository(detail.manifest.path, detail.manifest).toString()),
		toolRoot = path.posix.dirname(detail.manifest.path);
	const run = createRun('h57-stage-proof', {
		parents: [sealId, identity(inputPath), detail.manifest],
		operation:
			'Restage an authenticated actual solver bundle, check ownership/content and remove exactly its completed files. No photons, cache build or physical solver executes.',
		parameters: {
			case: 'r0-n1-s0',
			purpose: 'Keep per-case and final cleanup below the progress-heartbeat interval.',
		},
	});
	let failure = null;
	try {
		const files = new Map(
				manifest.artifacts
					.filter((a) => a.path.startsWith('case/'))
					.map((a) => [a.path.slice(5), readRepository(toolRoot + '/' + a.path, a.sha256).toString()]),
			),
			directory = checkedAbsolute(path.join(run.scratchPath, 'case-proof'), false);
		mkdirSync(directory);
		for (const [name, contents] of files) writeFileSync(path.join(directory, name), contents, {flag: 'wx'});
		run.progress('cleanup', 'Actual copied solver case authenticated; releasing only owned staging.');
		const result = releaseStaged(run, directory, files);
		assert.ok(result.milliseconds < 35000);
		run.write('proof.json', result);
	} catch (e) {
		failure = e;
	}
	run.cleanup();
	run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null});
	verifyRun(run.path);
	assert.equal(failure, null, String(failure));
	console.log(JSON.stringify({run: run.path}));
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	assert.equal(process.argv[2], 'proof');
	proof();
}
