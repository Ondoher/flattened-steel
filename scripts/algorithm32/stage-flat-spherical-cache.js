import {mkdir, copyFile, rename, lstat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {loadDistantSunPackage, DISTANT_SUN_PACKAGE_IDENTITY} from '../../server/common/distant-sun-package.js';

const source = process.argv[2];
if (!source) {
	throw new Error('Provide the existing immutable package directory as the first argument.');
}
const repository = fileURLToPath(new URL('../../', import.meta.url));
const parent = path.join(repository, 'server/flat/data/distant-sun-shared');
const target = path.join(parent, DISTANT_SUN_PACKAGE_IDENTITY);
const staging = path.resolve(process.argv[3] ?? path.join(parent, 'staging-' + randomUUID()));
const input = await loadDistantSunPackage(path.resolve(source));
await mkdir(parent, {recursive: true});
const actualParent = await realpath(parent);
if (path.dirname(staging) !== parent || path.dirname(target) !== parent || actualParent !== parent) {
	throw new Error('Deployment staging and final destinations must remain inside the real Flat data directory.');
}
let exists = await lstat(target).then(
	() => true,
	(error) => {
		if (error.code !== 'ENOENT') {
			throw error;
		}
		return false;
	},
);
if (exists) {
	let existing = await loadDistantSunPackage(target);
	for (const identity of existing.getFiles()) {
		await existing.resolveAsset(DISTANT_SUN_PACKAGE_IDENTITY + '/' + identity.path);
	}
	console.log('Existing Flat package fully authenticated: ' + target);
} else {
	await mkdir(staging, {recursive: true});
	let bytes = 0;
	for (const identity of input.getFiles()) {
		// Authenticate every external deployment input before copying it; never modify its parent.
		await input.resolveAsset(DISTANT_SUN_PACKAGE_IDENTITY + '/' + identity.path);
		let destination = path.join(staging, identity.path);
		await mkdir(path.dirname(destination), {recursive: true});
		if (!process.argv[3]) {
			await copyFile(path.join(path.resolve(source), identity.path), destination);
		}
		bytes += identity.byteLength;
	}
	let staged = await loadDistantSunPackage(staging);
	for (const identity of staged.getFiles()) {
		await staged.resolveAsset(DISTANT_SUN_PACKAGE_IDENTITY + '/' + identity.path);
	}
	if ((await realpath(staging)) !== staging || path.dirname(await realpath(staging)) !== actualParent) {
		throw new Error('Deployment staging resolved outside its intended directory.');
	}
	try {
		await rename(staging, target);
	} catch (error) {
		if (error.code !== 'EPERM') {
			throw error;
		}
		// Some Windows hosts prohibit directory rename. Publish the report last;
		// until then the normal metadata boundary returns unavailable.
		await mkdir(target);
		let files = staged.getFiles();
		files.sort(
			(left, right) => Number(left.path === 'package-set.json') - Number(right.path === 'package-set.json'),
		);
		for (const identity of files) {
			let destination = path.join(target, identity.path);
			await mkdir(path.dirname(destination), {recursive: true});
			await copyFile(path.join(staging, identity.path), destination);
		}
		let published = await loadDistantSunPackage(target);
		for (const identity of published.getFiles()) {
			await published.resolveAsset(DISTANT_SUN_PACKAGE_IDENTITY + '/' + identity.path);
		}
		console.warn(
			'Directory rename was unavailable; authenticated copy published with its report last. Staging input retained at ' +
				staging,
		);
	}
	console.log(JSON.stringify({target, files: input.getFiles().length, bytes, source: path.resolve(source)}));
}
