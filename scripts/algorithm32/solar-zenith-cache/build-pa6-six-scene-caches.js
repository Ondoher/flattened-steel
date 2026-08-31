#!/usr/bin/env node

import {lstat, mkdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import DistantSunSceneCacheOfflineCompiler from './DistantSunSceneCacheOfflineCompiler.js';

const SOURCE_IDENTITY = 'algorithm32-native-distant-collimated-sun-v1';
const SCENES = [
	[
		'sunset-plus-10-minutes',
		'2024-06-21T03:36:03.503Z',
		[-0.02931406863751862, -0.851860787747132, 0.522947304877605],
	],
	['sunset', '2024-06-21T03:26:03.503Z', [0.0007345177958817672, -0.8659924602538107, 0.500056516073093]],
	[
		'sunset-minus-10-minutes',
		'2024-06-21T03:16:03.503Z',
		[0.030735470704023604, -0.8782913571889195, 0.47713690145266263],
	],
	[
		'sunset-minus-one-hour',
		'2024-06-21T02:26:03.503Z',
		[0.18684305107190888, -0.9148183834042419, 0.3580460859327881],
	],
	['solar-noon', '2024-06-20T20:08:00.000Z', [0.9707655273706587, 0.0033828659702589154, -0.24000593135711085]],
];

function requireArgument(name) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? null : process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`${name} is required.`);
	return value;
}

function createScene([id, instant, directionToSourceUpEastNorth]) {
	return {
		sceneSun: {id, instant, directionToSourceUpEastNorth, sourceIdentity: SOURCE_IDENTITY},
		support: {
			id: 'san-jose-fixed-observer-complete-rotation-v1',
			bottomRadius: {value: 6360000, units: 'meters'},
			topRadius: {value: 6420000, units: 'meters'},
			observerAltitude: {value: 1.7, units: 'meters'},
			observerSolarZenith: {value: Math.acos(directionToSourceUpEastNorth[0]), units: 'radians'},
			completeCameraRotation: true,
			arbitraryShortenedEndpoint: true,
		},
	};
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const nauticalPackage = await realpath(path.resolve(requireArgument('--nautical-package')));
if (!nauticalPackage.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('PA6 nautical source package must remain under tmp/extraterrestrial.');
}
const outputRoot = path.resolve(requireArgument('--output'));
if (!outputRoot.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('PA6 six-scene output must remain under tmp/extraterrestrial.');
}
await lstat(outputRoot).then(
	() => {
		throw new Error('PA6 six-scene output directory must not already exist.');
	},
	(error) => {
		if (error.code !== 'ENOENT') throw error;
	},
);
await mkdir(outputRoot);
if ((await realpath(outputRoot)) !== outputRoot) throw new Error('PA6 six-scene output must resolve exactly.');

const compiler = new DistantSunSceneCacheOfflineCompiler({chromePath: path.resolve(requireArgument('--chrome'))});
const packages = [{id: 'sunset-plus-one-hour', role: 'qualified nautical source package', path: nauticalPackage}];
for (const definition of SCENES) {
	const scene = createScene(definition);
	const outputDirectory = path.join(outputRoot, scene.sceneSun.id);
	const result = await compiler.compile({outputDirectory, scene});
	packages.push({
		id: scene.sceneSun.id,
		role: 'PA6 production offline build',
		path: outputDirectory,
		manifestPath: result.manifestPath,
		manifestSha256: result.manifestSha256,
		cacheIdentity: result.manifest.cacheIdentity,
		sceneSun: result.manifest.sceneSun,
		browser: result.report.browser,
	});
	process.stdout.write(`${scene.sceneSun.id}: ${result.manifest.cacheIdentity}\n`);
}
const index = {
	schemaId: 'algorithm32-distant-sun-pa6-six-scene-package-index-v1',
	accepted: true,
	packages,
	derivation: {
		parentNauticalPackage: nauticalPackage,
		operation:
			'reuse the immutable qualified nautical package and build five additional exact scene-Sun packages with the production offline compiler',
		implementation: 'scripts/algorithm32/solar-zenith-cache/build-pa6-six-scene-caches.js',
	},
};
await writeFile(path.join(outputRoot, 'pa6-six-scene-package-index.json'), `${JSON.stringify(index, null, 2)}\n`, {
	flag: 'wx',
});
process.stdout.write(`${JSON.stringify(index, null, 2)}\n`);
