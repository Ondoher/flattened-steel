import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import test from 'node:test';

import {parseArguments, runGeneration} from './generate-production-boundary.js';
import {parseArguments as parseScoreArguments} from './score-production-run.js';
import {parseArguments as parseFigureArguments} from '../generate-benchmark-figures.js';
import {resolveProductionBackendDirectory, resolveProductionResultRoot} from '../production-result-paths.js';

test('parses bounded production generation selections', () => {
	assert.deepEqual(
		parseArguments([
			'--dry-run',
			'--backend',
			'gpu',
			'--orders',
			'2,4',
			'--conditions',
			'09:30,13:30',
			'--measure-gpu-completion',
			'--incoming-direction-variant',
			'reflection-completed-136',
		]),
		{
			backend: 'gpu',
			dryRun: true,
			orders: [2, 4],
			conditions: ['09:30', '13:30'],
			measureGpuCompletion: true,
			incomingDirectionVariant: 'reflection-completed-136',
		},
	);
});

test('defaults to the Bruneton comparison J4 production boundary', () => {
	assert.equal(parseArguments([]).backend, 'gpu');
	assert.deepEqual(parseArguments([]).orders, [4]);
	assert.equal(parseArguments([]).measureGpuCompletion, false);
	assert.equal(parseArguments([]).incomingDirectionVariant, 'production-68');
});

test('routes production outputs through separate CPU and GPU result roots', () => {
	assert.equal(resolveProductionBackendDirectory('cpu-reference-binary64'), 'cpu');
	assert.equal(resolveProductionBackendDirectory('gpu-production-shaders-r32f'), 'gpu');
	assert.equal(
		resolveProductionResultRoot('alternate-results', 'b1-directional-sky-radiance', 'gpu'),
		resolve('alternate-results/b1-directional-sky-radiance/gpu'),
	);
	assert.equal(parseArguments(['--output-root', 'alternate-results']).outputRoot, resolve('alternate-results'));
	assert.deepEqual(
		parseArguments(['--backend', 'gpu', '--asset-set', 'cache-set', '--production-revision', 'revision-1']),
		{
			backend: 'gpu',
			dryRun: false,
			orders: [4],
			conditions: [...parseArguments([]).conditions],
			measureGpuCompletion: false,
			incomingDirectionVariant: 'production-68',
			assetSetDirectory: resolve('cache-set'),
			productionRevision: 'revision-1',
		},
	);
	assert.deepEqual(parseScoreArguments(['run', '--output-root', 'alternate-results']), {
		productionRunPath: 'run',
		outputRoot: resolve('alternate-results'),
	});
	assert.equal(parseFigureArguments(['--backend', 'cpu']).resultSubdirectory, 'cpu');
	assert.equal(parseFigureArguments(['--color-model', 'basic-bruneton']).colorModel, 'basic-bruneton');
	assert.equal(
		parseFigureArguments(['--profile-family', 'paper-reflection-completed-136']).profileFamily,
		'paper-reflection-completed-136',
	);
});

test('rejects duplicate work before allocating a production run', () => {
	assert.throws(() => parseArguments(['--orders', '2,2']), /unique/);
	assert.throws(() => parseArguments(['--conditions', '09:30,09:30']), /unique/);
	assert.throws(() => parseArguments(['--backend', 'reference']), /cpu or gpu/);
	assert.throws(() => parseArguments(['--backend', 'cpu', '--measure-gpu-completion']), /requires --backend gpu/);
	assert.throws(() => parseArguments(['--backend', 'cpu', '--asset-set', 'cache-set']), /require --backend gpu/u);
	assert.throws(
		() => parseArguments(['--backend', 'cpu', '--production-revision', 'revision-1']),
		/require --backend gpu/u,
	);
	assert.throws(() => parseArguments(['--incoming-direction-variant', 'unknown']), /production-68/);
	assert.throws(
		() => parseFigureArguments(['--color-model', 'color-reset-slope-078-p9']),
		/require --color-model basic-bruneton/u,
	);
});

test('requires an alternate output root for a bounded noncanonical generation', async () => {
	await assert.rejects(runGeneration({backend: 'gpu', orders: [2], conditions: ['09:30']}), /explicit --output-root/);
});

test('validates selected profiles through production ingress without building caches', async () => {
	const result = await runGeneration({dryRun: true, backend: 'cpu', orders: [4], conditions: ['09:30']});
	assert.equal(result.status, 'DRY-RUN');
	assert.equal(result.backend, 'cpu');
	assert.equal(result.profiles.length, 1);
	assert.equal(result.profiles[0].id, 'b1-bruneton-0930-j4-v1');
	assert.match(result.profiles[0].contentHash, /^sha256:[0-9a-f]{64}$/);
});

test('routes the explicit near-ground variant and requires isolated generated output', async () => {
	const options = parseArguments(['--dry-run', '--position-domain', 'native51-near-ground', '--conditions', '09:30']);
	const result = await runGeneration(options);
	assert.equal(result.profiles[0].id, 'b1-bruneton-0930-j4-native51-near-ground-v1');
	assert.throws(() => parseArguments(['--position-domain', 'native50']), /position-domain/);
	await assert.rejects(runGeneration({positionDomain: 'native51-near-ground'}), /explicit --output-root/);
});
