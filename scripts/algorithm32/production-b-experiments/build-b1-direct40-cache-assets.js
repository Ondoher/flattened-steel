#!/usr/bin/env node

import path from 'node:path';

import {loadKiderDataset} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import B1Direct40OfflineAssetAdapter from './B1Direct40OfflineAssetAdapter.js';

function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

const dataset = loadKiderDataset();
const conditions = dataset.conditions.map((condition) => ({
	id: `b1-${condition.time}`,
	localTime: condition.time,
	fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
}));
const adapter = new B1Direct40OfflineAssetAdapter({
	chromePath: path.resolve(requireArgument('--chrome')),
});
const result = await adapter.compileSet({
	outputDirectory: path.resolve(requireArgument('--output')),
	conditions,
	productionRevision: requireArgument('--production-revision'),
});
process.stdout.write(
	`${JSON.stringify(
		{
			outputDirectory: result.outputDirectory,
			manifestPath: result.manifestPath,
			manifestSha256: result.manifestSha256,
			setIdentity: result.manifest.setIdentity,
			assetCount: result.manifest.assets.length,
		},
		null,
		2,
	)}\n`,
);
