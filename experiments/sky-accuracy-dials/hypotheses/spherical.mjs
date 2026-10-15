import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {
	createRun,
	identity,
	readRepository,
	resolveRepository,
	checkedAbsolute,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {readParent, replayAllowance, compareErrors, requireUnusedStage} from './common.mjs';
import {prepareNativeFirstOrder} from './first-order.mjs';
import {targetedShaders} from '../continuation/targeted-improvements/kernels.mjs';
import {runTargetedGpu} from '../continuation/targeted-improvements/browser.mjs';
import {recoveryAdmissionRun} from './recovery.mjs';
import {benchmarkRay} from '../numerics/view.js';

/** Execute one registered raw replay, with the exact Native48 P1 matrix only after successful replay.
 * No partial intervention is labeled a corrected recurrence.
 * @param {HypothesisSphericalStage} stage @returns {Promise<void>}
 */
export async function sphericalStage(stage) {
	const repairMilliseconds = requireUnusedStage(stage === 'H11' ? 'h11-orders-r2' : 'h12-native48-r2', true);
	const started = Date.now(),
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const admission = /** @type {HypothesisAdmission} */ (readParent(recoveryAdmissionRun, 'admission.json', parents));
	const control = /** @type {SkyGpuControl} */ (readParent('00103-c-r0-scr', 'control.json', parents));
	const original = /** @type {HypothesisNativeSnapshot} */ (readParent('00000-inputs', 'controls.json', parents));
	const registration = /** @type {SmallRayRegistration} */ (
		readParent('00099-c0-registration', 'registration.json', parents)
	);
	const directInputs = /** @type {SmallRayInputs} */ (
		readParent(stage === 'H11' ? '00230-direct-converge' : '00232-alternate-rays', 'inputs.json', parents)
	);
	const direct = /** @type {SmallRayDirectPacket} */ (
		readParent(stage === 'H11' ? '00230-direct-converge' : '00232-alternate-rays', 'results.json.gz', parents)
	);
	const selected = stage === 'H11' ? ['p-0930-5-7', 'p-1230-0-4'] : ['p-1330-0-4', 'p-1330-5-4'];
	const request = stage === 'H11' ? control.buildRequest : original.native48;
	/** @type {SkyReferenceProbe[]} */ const probes = selected.map((id) => {
		const [_, time, x, y] = id.split('-'),
			hhmm = time.slice(0, 2) + ':' + time.slice(2);
		if (stage === 'H11') {
			const p = registration.probeRays.find(
				(p) => p.time === hhmm && p.gridX === Number(x) && p.gridY === Number(y),
			);
			assert.ok(p);
			return {
				id,
				time: hhmm,
				gridX: Number(x),
				gridY: Number(y),
				ray: {origin: p.origin, direction: p.direction, length: p.lengthMeters},
			};
		}
		const scene = original.scenes.find((s) => s.time === hhmm);
		assert.ok(scene);
		const ray = benchmarkRay(request.transportSpec, scene, Number(x), Number(y));
		const frozen = directInputs.rays.find((r) => r.time === hhmm && r.x === Number(x) && r.y === Number(y));
		assert.ok(frozen);
		ray.origin.forEach((v, i) => assert.ok(Math.abs(v / 1000 - frozen.origin[i]) < 1e-10));
		ray.direction.forEach((v, i) => assert.ok(Math.abs(v - frozen.direction[i]) < 8 * Number.EPSILON));
		return {id, time: hhmm, gridX: Number(x), gridY: Number(y), ray};
	});
	const channels = stage === 'H11' ? [0, 8] : [0, 8, 24];
	const retained =
		stage === 'H11'
			? channels.map((c) =>
					readParent(
						'00171-matched-h-n6',
						'channel-' + String(c).padStart(2, '0') + '-diagnostics.json.gz',
						parents,
					),
				)
			: [];
	const deadline = started + admission.stageMilliseconds[stage] - repairMilliseconds;
	const run = createRun(stage === 'H11' ? 'h11-orders-r2' : 'h12-native48-r2', {
		parents,
		operation:
			'New bounded ' +
			stage +
			' GPU attempt: raw recurrence replay and independent final-view quadrature; Native48 then isolates fixed-count P1 factorial. Missing jointly corrected recurrence is retained explicitly.',
		parameters: {
			stage,
			started,
			deadline,
			maximumBytes: 4 * 1024 ** 2,
			admission: parents[0],
			selected,
			channels,
			missingCell:
				'Full joint query-density/phase/source-column correction through all affected later-order fields has no qualified driver. Species-density-only and analytic-P1/frozen-higher are not substitutes.',
		},
	});
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>>|null} */ let browser = null;
	/** @type {NodeJS.Timeout|null} */ let watchdog = null;
	let deadlineHit = false,
		gpuAttempt = false;
	let lastStorageGuard = 0;
	const guard = () => {
		if (Date.now() - lastStorageGuard > 10000) {
			run.guard();
			lastStorageGuard = Date.now();
		}
		assert.ok(Date.now() < deadline - 12000, 'Stage cleanup reserve reached.');
	};
	try {
		run.write('registration.json', {
			stage,
			request,
			probes,
			channels,
			deadline,
			maximumOrder: stage === 'H11' ? 6 : 4,
			prospectiveReplay: 'Original guard where available; otherwise max(20e-6 W,0.0002*abs(retained W)).',
			missingCorrectedRecurrence: true,
		});
		// Admission is exclusive: neither stage can silently retry after a retained attempt.
		const {readdirSync} = await import('node:fs');
		const attempts = readdirSync(resolveRepository('tmp/experiments/sky-accuracy-dials/runs')).filter(
			(n) => Number(n.slice(0, 5)) >= admission.priorRunCount && /-h1[123]-/.test(n),
		);
		const gpuDebits = attempts.filter((name) => {
			if (name === run.path.split('/').at(-1)) return true;
			const p = 'tmp/experiments/sky-accuracy-dials/runs/' + name + '/sealed.json';
			return JSON.parse(readRepository(p).toString()).result.gpuAttempt === true;
		}).length;
		assert.ok(gpuDebits <= admission.maximumGpuAttempts);
		run.progress('setup', 'Bundle only the registered sparse recurrence/query capability.');
		const entry = 'hypothesis-entry';
		const entrySource =
			'export {runSpherical} from ' +
			JSON.stringify(resolveRepository('experiments/sky-accuracy-dials/hypotheses/spherical.js')) +
			';\n' +
			'export {createDistantSunSceneCacheCommonShaderSource} from ' +
			JSON.stringify(
				resolveRepository('scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js'),
			) +
			';';
		const bundle = await rollup({
			input: entry,
			plugins: [
				{
					name: 'explicit-hypothesis-entry',
					resolveId: (id) => (id === entry ? entry : null),
					load: (id) => (id === entry ? entrySource : null),
				},
				nodeResolve(),
			],
		});
		let code;
		try {
			for (const id of bundle.watchFiles) {
				if (id === entry) continue;
				const absolute = checkedAbsolute(id);
				const relative = path
					.relative(resolveRepository('experiments').slice(0, -'experiments'.length), absolute)
					.split(path.sep)
					.join('/');
				parents.push(identity(relative));
			}
			const generated = await bundle.generate({format: 'iife', name: 'HypothesisBrowser'});
			code = generated.output[0].code;
		} finally {
			await bundle.close();
		}
		run.write('bundle.js.gz', gzipSync(Buffer.from(code)), {
			parents,
			operation:
				'Rollup exact authenticated local module closure to an isolated IIFE; no application startup or network service.',
			parameters: {entrySource},
		});
		const chrome = checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'));
		run.write('tools.json', {
			node: {path: process.execPath, version: process.version},
			chrome: {path: chrome, sha256: createHash('sha256').update(readFileSync(chrome)).digest('hex')},
		});
		guard();
		browser = await puppeteer.launch({
			executablePath: chrome,
			headless: true,
			userDataDir: path.join(run.scratchPath, 'chrome'),
			protocolTimeout: deadline - Date.now() - 15000,
			env: {...process.env, TEMP: run.scratchPath, TMP: run.scratchPath},
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--disable-software-rasterizer',
				'--use-angle=d3d11',
				'--disable-background-networking',
				'--disable-component-update',
				'--no-first-run',
			],
		});
		watchdog = setTimeout(
			() => {
				deadlineHit = true;
				browser?.process()?.kill();
			},
			Math.max(1, deadline - Date.now() - 15000),
		);
		const page = await browser.newPage();
		await page.addScriptTag({content: code});
		await page.exposeFunction('hypothesisProgress', (message) => {
			guard();
			run.progress('gpu', String(message));
		});
		/** @type {HypothesisSphericalRow[]} */ const rows = [];
		await page.exposeFunction(
			'hypothesisRetain',
			/** @param {HypothesisSphericalResult} value */ async (value) => {
				guard();
				if (value.sparse) {
					run.write(
						'sparse-' + value.sparse.channel + '.json.gz',
						gzipSync(Buffer.from(JSON.stringify(value))),
					);
					return;
				}
				rows.push(...value.rows);
				run.write('channel-' + value.rows[0].channel + '.json', value);
			},
		);
		/** @type {HypothesisSphericalInput} */ const input = {
			request,
			probes,
			channels,
			maximumOrder: stage === 'H11' ? 6 : 4,
			deadline: deadline - 20000,
			kind: stage === 'H11' ? 'H' : 'Native48',
		};
		gpuAttempt = true;
		await page.evaluate(async (input) => {
			const scope = /** @type {unknown} */ (window);
			const api = /** @type {HypothesisBrowserScope} */ (scope);
			await api.HypothesisBrowser.runSpherical(
				input,
				api.hypothesisProgress,
				api.hypothesisRetain,
				api.HypothesisBrowser,
			);
		}, input);
		/** @type {HypothesisReplayRow[]} */ const replay = [];
		for (const row of rows.filter((r) => (stage === 'H12' ? r.order === 4 : [4, 6].includes(r.order)))) {
			let target;
			if (stage === 'H11') {
				const old = /** @type {HypothesisOrderDiagnosticsRead} */ (retained[channels.indexOf(row.channel)]);
				target = old.rows.find(
					(r) =>
						r.probeId === row.probeId &&
						r.order === row.order &&
						r.methodId === 'reference-envelope' &&
						r.representationId === 'grouped',
				)?.value;
			} else {
				const probe = probes.find((p) => p.id === row.probeId),
					r = directInputs.rays.find(
						(r) => r.time === probe.time && r.x === probe.gridX && r.y === probe.gridY,
					);
				target = r.models.control[directInputs.channels.indexOf(row.channel)];
			}
			assert.ok(Number.isFinite(target));
			const allowance = replayAllowance(target),
				differenceW = row.rawW - target;
			replay.push({
				probeId: row.probeId,
				channel: row.channel,
				order: row.order,
				targetW: target,
				actualW: row.rawW,
				differenceW,
				allowanceW: allowance,
				passed: Math.abs(differenceW) <= allowance,
			});
		}
		run.write('replay.json', replay);
		const replayPassed = replay.every((r) => r.passed);
		run.write(
			'view-comparison.json',
			rows
				.filter((r) => r.order === (stage === 'H11' ? 6 : 4))
				.map((row) => {
					const p = probes.find((p) => p.id === row.probeId),
						r = directInputs.rays.find((r) =>
							stage === 'H11' ? r.id === p.id : r.time === p.time && r.x === p.gridX && r.y === p.gridY,
						);
					const oracle = direct.rows.find((v) => v.ray === r.id && v.channel === row.channel);
					return {
						...row,
						direct: oracle.total,
						samplingResolved: oracle.samplingResolved,
						replayPassed,
						comparison: compareErrors(
							row.rawW,
							row.refinedW,
							oracle.total.mean,
							oracle.total.halfWidth95,
							row.refinedAllowanceW,
						),
					};
				}),
		);
		if (replayPassed && stage === 'H12') {
			guard();
			const payload = prepareNativeFirstOrder(request, probes, guard);
			const shaders = {
				...targetedShaders,
				columns: targetedShaders.columns.replace('row==0?80:160', 'row==0?20:20'),
			};
			assert.equal(request.transportSpec.numerical.sourcePathTransmittanceIntervalCount, 20);
			run.write(
				'p1-matrix-input.json',
				{payload, shaders},
				{
					parents,
					operation:
						'Freeze exact Native48 S20 geometry, all eight density/phase/column modes and separated-T controls before evaluation; both legacy row slots carry the same S20 count.',
				},
			);
			const matrix = await page.evaluate(runTargetedGpu, payload, shaders);
			run.write('p1-matrix.json', {
				layout: payload.rowLayout,
				channels,
				matrix,
				limit: 'Final-view P1 interventions hold higher light frozen. No corrected total or higher-order response is claimed.',
			});
		}
		await browser.close();
		browser = null;
		clearTimeout(watchdog);
		watchdog = null;
		guard();
		assert.ok(storage().retainedBytes - before.retainedBytes < 4 * 1024 ** 2 - 200000);
		const seal = run.finish(replayPassed ? 'accepted' : 'rejected', {
			stage,
			replayPassed,
			gpuAttempt,
			deadlineHit,
			elapsedMilliseconds: Date.now() - started,
			correctedRecurrence: 'unavailable',
			scope: 'Raw reproduction and final-view/P1 diagnostic only; hypothesis interaction remains incomplete.',
		});
		console.log(JSON.stringify({seal, verified: verifyRun(run.path), elapsedMilliseconds: Date.now() - started}));
	} catch (error) {
		if (browser) {
			await browser.close().catch(() => {});
			browser = null;
		}
		if (watchdog) clearTimeout(watchdog);
		run.write('failure.json', {message: String(error), gpuAttempt, deadlineHit});
		console.log(
			JSON.stringify({
				seal: run.finish('failed', {
					stage,
					message: String(error),
					gpuAttempt,
					deadlineHit,
					elapsedMilliseconds: Date.now() - started,
				}),
			}),
		);
		process.exitCode = 1;
	}
}
