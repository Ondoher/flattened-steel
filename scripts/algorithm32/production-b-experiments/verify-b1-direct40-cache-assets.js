#!/usr/bin/env node

import path from 'node:path';

import B1Direct40CacheAssetVerifier from './B1Direct40CacheAssetVerifier.js';

function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

const result = await B1Direct40CacheAssetVerifier.verifySet({
	setDirectory: path.resolve(requireArgument('--input')),
	productionRevision: requireArgument('--production-revision'),
});
process.stdout.write(
	`${JSON.stringify(
		{
			setDirectory: result.setDirectory,
			manifestPath: result.manifestPath,
			manifestSha256: result.manifestSha256,
			setIdentity: result.manifest.setIdentity,
			assetCount: result.assets.length,
		},
		null,
		2,
	)}\n`,
);
