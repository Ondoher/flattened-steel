#!/usr/bin/env node

import path from 'node:path';

import {loadKiderDataset} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import B1Direct40OfflineAssetAdapter from './B1Direct40OfflineAssetAdapter.js';
import {DistantSunSceneCacheNumerics} from '../solar-zenith-cache/DistantSunSceneCacheNumerics.js';

function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

if (process.argv.includes('--numerical-policy') && process.argv.includes('--surface-limit'))
	throw new Error('Select either --numerical-policy or --surface-limit.');
const selectedPolicy = process.argv.includes('--numerical-policy') ? requireArgument('--numerical-policy') : null;
if (selectedPolicy !== null && selectedPolicy !== 'anchored-radial')
	throw new Error('Unsupported Direct40 numerical policy.');
const numericalPolicy =
	selectedPolicy === 'anchored-radial'
		? DistantSunSceneCacheNumerics.createAnchoredRadial()
		: process.argv.includes('--surface-limit')
			? DistantSunSceneCacheNumerics.createSurfaceLimit(Number(requireArgument('--surface-limit')))
			: undefined;
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
	numericalPolicy,
});
process.stdout.write(
	`${JSON.stringify(
		{
			outputDirectory: result.outputDirectory,
			manifestPath: result.manifestPath,
			manifestSha256: result.manifestSha256,
			setIdentity: result.manifest.setIdentity,
			assetCount: result.manifest.assets.length,
			numericalPolicy: numericalPolicy ?? null,
		},
		null,
		2,
	)}\n`,
);
