import assert from 'node:assert/strict';
import {mkdir, open, readFile, rename, symlink, writeFile} from 'node:fs/promises';
import Files from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import ExperimentRun from './ExperimentRun.js';

const run = new ExperimentRun();
await run.start('run-controls');
try {
	const fixtureRoot = await run.files.directory(run.root + '/fixture');
	const allocator = new ExperimentRun();
	allocator.files = new Files(fixtureRoot);
	const first = await allocator.allocate('abcdefghijklmnop');
	assert(first.endsWith('/00000-abcdefghijklmnop'));
	await assert.rejects(allocator.allocate('abcdefghijklmnopq'), /1-16/);
	await assert.rejects(allocator.allocate('../escape'), /1-16/);
	const base = first.slice(0, first.lastIndexOf('/'));
	const basePath = await allocator.files.resolve(base);
	const counter = await readFile(basePath + '/.last-run-number', 'utf8');
	assert.equal(counter.trim(), '00000');
	const lock = await open(basePath + '/.run-allocation-lock', 'wx');
	try {
		await assert.rejects(allocator.allocate('locked'), {code: 'EEXIST'});
	} finally {
		await lock.close();
	}
	await rename(basePath + '/.run-allocation-lock', basePath + '/lock-proof');
	await rename(await allocator.files.resolve(first), basePath + '/retained');
	const second = await allocator.allocate('after-gap');
	assert(second.endsWith('/00001-after-gap'));
	await mkdir(basePath + '/00007-existing');
	assert((await allocator.allocate('after-existing')).endsWith('/00008-after-existing'));
	const concurrent = await Promise.allSettled([
		allocator.allocate('concurrent-a'),
		allocator.allocate('concurrent-b'),
	]);
	assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1);
	assert.equal(concurrent.filter((result) => result.status === 'rejected').length, 1);
	await writeFile(basePath + '/.last-run-number', '99999\n');
	await assert.rejects(allocator.allocate('exhausted'), /exhausted/);
	const linkedRoot = await run.files.directory(run.root + '/linked');
	const linkTarget = await run.files.directory(run.root + '/target');
	await symlink(linkTarget, linkedRoot + '/tmp', 'junction');
	const linkedAllocator = new ExperimentRun();
	linkedAllocator.files = new Files(linkedRoot);
	await assert.rejects(linkedAllocator.allocate('unsafe'), /ordinary|alias/);
	await run.write('controls.json', {
		cases: 9,
		passed: true,
		fixtureBoundary: run.root,
		proofs: [
			'zero-based numbering',
			'sixteen accepted',
			'seventeen rejected before allocation',
			'traversal rejected',
			'exclusive lock',
			'nonreuse after missing directory',
			'existing prefix respected',
			'concurrent exclusion',
			'exhaustion and junction rejection',
		],
		limitation: 'Nested numbered directories are allocator fixtures inside this evidence run, not experiment runs.',
	});
	await run.finish('accepted', {allocatorPassed: true});
	await assert.rejects(run.write('after-seal.json', {}), /sealed/);
	await assert.rejects(run.finish('accepted', {}), /terminal transition/);
	console.log('Post-seal mutation attempts rejected.');
} catch (error) {
	if (!run.sealed) await run.finish('failed', {error: error.stack});
	process.exitCode = 1;
	console.error(error);
}
