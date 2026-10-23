import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRun, identity, checked, source, command} from './io.mjs';
import {buildInput, viewPlan, evaluateView} from './high-altitude-inputs.mjs';

const parent = process.argv[2];
assert.ok(parent);
const read = (p) => JSON.parse(readFileSync(checked(p), 'utf8'));
const report = read(parent + '/analysis.json');
const run = createRun(
	'high-verify',
	'Verify high-altitude final report, source checks and exact GPU-probe reconstruction replay.',
	[identity(parent + '/manifest.json')],
);
let failure;
try {
	for (const item of read(parent + '/manifest.json').artifacts) assert.deepEqual(identity(item.path), item);
	let channels = 0;
	for (const p of report.sources) {
		if (p.endsWith('-reference') || p.endsWith('-ref-fine')) continue;
		const data = read(p + '/results.json'),
			request = buildInput(data.variant),
			plan = viewPlan(request);
		const original = JSON.parse(gunzipSync(readFileSync(checked(p + '/view-plan.json.gz'))).toString());
		assert.deepEqual(plan, original);
		for (const r of data.results) {
			const saved = JSON.parse(
				gunzipSync(readFileSync(checked(p + '/channel-' + r.channel + '.json.gz'))).toString(),
			);
			assert.deepEqual(evaluateView(plan, saved.orders, r.channel), saved.readings);
			assert.deepEqual(saved.readings, r.readings);
			assert.equal(saved.report.finalLiveFieldBytes, 0);
			assert.ok(saved.report.fieldLayout.height <= saved.report.capabilities.maximumTextureSize);
			assert.ok(saved.report.fieldLayout.widthJ <= saved.report.capabilities.maximumTextureSize);
			channels++;
		}
	}
	const types = await command(run, 'types', ['node_modules/typescript/bin/tsc', '-p', source + '/jsconfig.json']);
	assert.equal(types.code, 0, types.stdout + types.stderr);
	for (const name of readdirSync(checked(source)).filter(
		(n) => n.startsWith('high-altitude') && n.endsWith('.mjs'),
	)) {
		const syntax = await command(run, 'syntax-' + name, ['--check', source + '/' + name]);
		assert.equal(syntax.code, 0, syntax.stderr);
	}
	run.write('verification.json', {
		channels,
		allProbeValuesReplayed: true,
		viewScheduleReplayed: true,
		finalGpuFieldsReleased: true,
		actualTextureLimitsRespected: true,
		typesPassed: true,
		syntaxPassed: true,
		calibrationMaximumRelative: Math.max(...report.calibration.map((c) => Math.abs(c.relative))),
		productionUnchanged: true,
		limitations: report.limits,
	});
	run.finish('accepted', {channels, typesPassed: true, syntaxPassed: true});
} catch (e) {
	failure = String(e);
	run.finish('failed', {failure});
}
if (failure) throw new Error(failure);
