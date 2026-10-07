import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync, mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {gzipSync, gunzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {
	createRun,
	identity,
	readRepository,
	sourceIdentities,
	verifyRun,
	checkedAbsolute,
	sha256,
	storage,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {alternateInputs} from '../direct-solver/alternate-inputs.mjs';
import {directCpu} from '../direct-solver/math.mjs';
import {monteCarloGpu, estimate} from '../direct-solver/monte-carlo.mjs';
import {proof, phase, cs, shader} from './optics.mjs';
import {aerosolPackageId} from './authorization.mjs';

const cases = ['control', 'phase', 'albedo', 'both'];
/** @type {SkyMcProfile[]} */
const profiles = [
	{name: 'reference', transmission: 64, batches: 128, rouletteStart: 8, seedOffset: 1610612736},
	{name: 't32', transmission: 32, batches: 16, rouletteStart: 8, seedOffset: 1610612736},
	{name: 'roulette16', transmission: 64, batches: 16, rouletteStart: 16, seedOffset: 1610612736},
];

/** Stream one frozen factorial and retain all batch evidence, including failures. */
async function main() {
	const {checks, optical} = proof(),
		inputs = alternateInputs(),
		{medium, rays, channels} = inputs;
	assert.ok(['proof', 'preflight', 'execute'].includes(process.argv[2]));
	if (process.argv[2] !== 'execute') {
		console.log(
			JSON.stringify({
				checks,
				cases,
				profiles,
				queries: rays.length * channels.length,
				properties: optical.values.map((t) => ({
					w: t.wavelength,
					ssa: t.albedo,
					meanCosine: t.meanCosine,
					extrapolated: t.extrapolated,
					phaseRatios: rays.map((r) => phase(t, r.direction[2]) / cs(r.direction[2], medium.g)),
				})),
			}),
		);
		return;
	}
	const started = Date.now(),
		registration = readRegistration('tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration');
	const admission = admitJob(registration, 'gpu', 'component', 1310720, 'C5', aerosolPackageId),
		auth = admission.gpuAuthorization;
	assert.ok(auth && 'priorAttempts' in auth);
	const maximumJobMilliseconds = Math.min(
		25 * 60000,
		admission.timeoutMilliseconds,
		Date.parse(auth.deadline) - started - 30000,
	);
	assert.ok(maximumJobMilliseconds > 120000);
	const sources = sourceIdentities(),
		base = identity('tmp/experiments/sky-accuracy-dials/runs/00226-remain-observe/sources.json.gz');
	const parentDirect = verifyRun('tmp/experiments/sky-accuracy-dials/runs/00232-alternate-rays');
	const priorId = identity('tmp/experiments/sky-accuracy-dials/runs/00232-alternate-rays/results.json.gz');
	const prior = JSON.parse(gunzipSync(readRepository(priorId.path, priorId)).toString());
	const tools = [process.execPath, 'C:/Program Files/Google/Chrome/Application/chrome.exe'].map((p) => {
		const absolute = checkedAbsolute(path.resolve(p)),
			b = readFileSync(absolute);
		return {path: absolute, byteLength: b.length, sha256: sha256(b)};
	});
	const parents = [
		registration.seal,
		auth.plan,
		auth.through,
		...optical.parents,
		...inputs.parents,
		parentDirect,
		priorId,
		base,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
	];
	const run = createRun('aerosol-screen', {
		parents,
		operation:
			'Fixed 2x2 regional aerosol phase/albedo sensitivity through cache-free all-order transport; unchanged extinction, geometry, source and Kider values.',
		parameters: {
			caseId: aerosolPackageId,
			packageId: aerosolPackageId,
			continuationRegistration: registration.run,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			gpuAuthorization: auth,
			allocatedBytes: 1310720,
			maximumJobMilliseconds,
			cases,
			profiles,
			pathsPerBatch: 8192,
			tools,
		},
	});
	const definition = identity(run.path + '/definition.json');
	const write = (name, value) =>
		run.write(name, value, {
			parents: [definition],
			operation:
				'Exact frozen inputs, shader, verification or fixed-count stochastic output; summaries derived from retained batch means.',
		});
	const zip = (name, value) => write(name, gzipSync(Buffer.from(JSON.stringify(value)), {level: 9}));
	console.log(JSON.stringify({run: run.path, maximumJobMilliseconds}));
	/** @type {(SkyMcBatch & {caseId:string,channelIndex:number})[]} */ const batches = [];
	const cpu = [],
		gpuProof = [],
		executions = [];
	let browser = null,
		watchdog = null,
		failure = null,
		lastProgress = 0,
		activeCase = '',
		activeChannel = 0,
		proving = true;
	/** @type {SkyMcBatch[]} */ let probe = [];
	try {
		write('plan.md', readRepository(auth.plan.path, auth.plan));
		zip('inputs.json.gz', {...inputs, optical});
		const old = JSON.parse(gunzipSync(readRepository(base.path, base)).toString());
		for (const s of old) assert.equal(sha256(Buffer.from(s.base64, 'base64')), s.sha256);
		zip('sources-delta.json.gz', {
			base,
			currentSources: sources,
			changed: sources
				.filter((s) => !old.some((o) => o.path === s.path && o.sha256 === s.sha256))
				.map((s) => ({...s, base64: readRepository(s.path, s).toString('base64')})),
		});
		// With fixed extinction, direct single scattering is linear in each phase-weighted scattering coefficient.
		// The viewing/Sun angle is constant along these collimated-source rays.
		run.progress('verify', 'Independent binary64 first-order ray integrals');
		for (let ch = 0; ch < channels.length; ch++)
			for (let r = 0; r < rays.length; r++) {
				const levels = [128, 256].map((n) =>
					[0, 1].map((albedo) =>
						directCpu(
							{...medium, albedo},
							{name: 'cpu', view: n, path: 8, transmission: n, mu: 4, phi: 8, orders: 1},
							ch,
						).radiance(rays[r].origin, rays[r].direction, 1, true),
					),
				);
				assert.ok(levels[1].every((v, i) => Math.abs(v - levels[0][i]) < 1e-5));
				const expected = Object.fromEntries(
					cases.map((id) => {
						const ratio = ['phase', 'both'].includes(id)
							? phase(optical.values[ch], rays[r].direction[2]) / cs(rays[r].direction[2], medium.g)
							: 1;
						const albedo = ['albedo', 'both'].includes(id) ? optical.values[ch].albedo : medium.albedo;
						return [id, levels[1][0] + (levels[1][1] - levels[1][0]) * ratio * albedo];
					}),
				);
				cpu.push({ch, r, levels, expected});
			}
		write('cpu-proof.json', {checks, cpu});
		const profilePath = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profilePath);
		browser = await puppeteer.launch({
			executablePath: tools[1].path,
			headless: true,
			userDataDir: profilePath,
			protocolTimeout: maximumJobMilliseconds,
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
		const pid = browser.process()?.pid;
		watchdog = setTimeout(
			() => {
				if (pid)
					try {
						execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
							windowsHide: true,
							stdio: 'ignore',
							timeout: 10000,
						});
					} catch {}
			},
			Math.max(1000, maximumJobMilliseconds - (Date.now() - started) - 20000),
		);
		const page = await browser.newPage();
		await page.exposeFunction(
			'retainBatch',
			/** @param {SkyMcBatch} row */ (row) => {
				assert.ok(row.means.every(Number.isFinite));
				if (proving) probe.push(row);
				else batches.push({...row, caseId: activeCase, channelIndex: activeChannel});
				if (Date.now() - lastProgress > 10000) {
					run.progress(
						'integrate',
						`${proving ? 'proof' : activeCase} channel ${activeChannel}, ${row.profile} batch ${row.batch + 1}`,
					);
					lastProgress = Date.now();
				}
			},
		);
		// Existing end-to-end vacuum, ground and pure absorption controls.
		await page.evaluate(monteCarloGpu, shader({...medium, albedo: 0}, null), {
			groups: [
				{ray: 0, channel: 0, origin: [0, 0, medium.bottom + 1], direction: [0, 0, 1], physical: [0, 0, 1, 0]},
				{
					ray: 0,
					channel: 0,
					origin: [0, 0, medium.bottom + 1],
					direction: [0, 0, -1],
					physical: [0, 0, 1, 0.5],
				},
				{ray: 0, channel: 0, origin: [0, 0, medium.bottom + 1], direction: [0, 0, 1], physical: [0, 0.1, 1, 0]},
			],
			profiles: [{name: 'manufactured', transmission: 64, batches: 1, rouletteStart: 8, seedOffset: 0}],
			pathsPerBatch: 256,
			maximumMilliseconds: 30000,
		});
		assert.equal(probe.length, 3);
		assert.equal(probe[0].means[0], 0);
		assert.equal(probe[2].means[0], 0);
		assert.ok(Math.abs(probe[1].means[0] - 0.5 / Math.PI) < 1e-7);
		gpuProof.push({kind: 'transport', batches: probe});
		// Exercise the actual GPU inverse CDF, not only its CPU analogue.
		for (let ch = 0; ch < channels.length; ch++) {
			const source = shader(medium, optical.values[ch]),
				at = source.indexOf('void main(){');
			assert.ok(at > 0);
			const sampling =
				source.slice(0, at) +
				'void main(){state=firstSeed+uint(gl_FragCoord.x)+256u*uint(gl_FragCoord.y);state^=state>>16u;state*=2246822519u;state^=state>>13u;state*=3266489917u;state^=state>>16u;float c=aerosolSample(random());outputValue=vec4(c+1.0,0.0,0.0,1.0);}';
			probe = [];
			await page.evaluate(monteCarloGpu, sampling, {
				groups: [
					{
						ray: 0,
						channel: ch,
						origin: [0, 0, medium.bottom + 1],
						direction: [0, 0, 1],
						physical: [0, 0, 1, 0],
					},
				],
				profiles: [{name: 'sampler', transmission: 64, batches: 32, rouletteStart: 8, seedOffset: 536870912}],
				pathsPerBatch: 8192,
				maximumMilliseconds: 30000,
			});
			const moment = estimate(probe.map((b) => b.means[0] - 1));
			assert.ok(
				Math.abs(moment.mean - optical.values[ch].meanCosine) <= 6 * moment.standardError + 0.0002,
				'GPU phase moment',
			);
			gpuProof.push({kind: 'phase-sampler', ch, moment, batches: probe});
		}
		zip('gpu-proof.json.gz', gpuProof);
		proving = false;
		const shaders = Object.fromEntries(
			cases.flatMap((id) =>
				channels.map((_, ch) => [
					`${id}-${ch}`,
					shader(
						{
							...medium,
							albedo: ['albedo', 'both'].includes(id) ? optical.values[ch].albedo : medium.albedo,
						},
						['phase', 'both'].includes(id) ? optical.values[ch] : null,
					),
				]),
			),
		);
		zip('shaders.json.gz', shaders);
		for (const id of cases)
			for (let ch = 0; ch < channels.length; ch++) {
				activeCase = id;
				activeChannel = ch;
				const source = shaders[`${id}-${ch}`];
				const groups = rays.map((r, ray) => ({
					ray,
					channel: ch,
					origin: [...r.origin],
					direction: [...r.direction],
					physical: [medium.rayleigh[ch], medium.mie[ch], medium.sun[ch], medium.ground[ch]],
				}));
				executions.push({
					caseId: id,
					ch,
					...(await page.evaluate(monteCarloGpu, source, {
						groups,
						profiles,
						pathsPerBatch: 8192,
						maximumMilliseconds: maximumJobMilliseconds - (Date.now() - started) - 40000,
					})),
				});
				console.log(
					JSON.stringify({
						caseId: id,
						wavelength: optical.values[ch].wavelength,
						batches: batches.length,
						elapsedMilliseconds: Date.now() - started,
					}),
				);
			}
		for (const s of [...sources, ...parents]) readRepository(s.path, s);
	} catch (e) {
		failure = e instanceof Error ? e : new Error(String(e));
	} finally {
		if (browser)
			try {
				await browser.close();
			} catch (e) {
				failure ??= new Error(String(e));
			}
		if (watchdog) clearTimeout(watchdog);
	}
	zip('batches.json.gz', batches);
	const rows = [],
		contrasts = [];
	try {
		const get = (id, ch, r, p) =>
			batches
				.filter((b) => b.caseId === id && b.channelIndex === ch && b.group === r && b.profile === p)
				.sort((a, b) => a.batch - b.batch);
		assert.equal(batches.length, 4 * 5 * 6 * 160, 'Complete fixed matrix');
		for (const id of cases)
			for (let ch = 0; ch < 5; ch++)
				for (let r = 0; r < 6; r++) {
					const bs = get(id, ch, r, 'reference'),
						ref = estimate(bs.map((b) => b.means[0])),
						first = estimate(bs.map((b) => b.means[1]));
					const expected = cpu.find((x) => x.ch === ch && x.r === r).expected[id];
					assert.ok(
						Math.abs(first.mean - expected) <= 6 * first.standardError + Math.max(1e-6, 0.0003 * expected),
						'CPU/GPU first-order parity',
					);
					const tolerance = Math.max(0.0005, 0.005 * ref.mean);
					const differences = Object.fromEntries(
						['t32', 'roulette16'].map((p) => [
							p,
							estimate(get(id, ch, r, p).map((b, i) => b.means[0] - bs[i].means[0])),
						]),
					);
					const referenceControl = prior.rows.find((p) => p.ray === rays[r].id && p.channel === channels[ch]);
					assert.ok(referenceControl);
					if (id === 'control')
						assert.ok(
							Math.abs(ref.mean - referenceControl.total.mean) <=
								6 * Math.hypot(ref.standardError, referenceControl.total.standardError) + 1e-5,
							'Original control reproduction',
						);
					rows.push({
						caseId: id,
						channel: channels[ch],
						wavelength: optical.values[ch].wavelength,
						ray: rays[r].id,
						time: rays[r].time,
						role: rays[r].role,
						total: ref,
						first,
						second: estimate(bs.map((b) => b.means[2])),
						higher: estimate(bs.map((b) => b.means[3])),
						measured: rays[r].measured[ch],
						residual: ref.mean - rays[r].measured[ch],
						cpu: expected,
						tolerance,
						samplingResolved: ref.halfWidth95 <= tolerance,
						differences,
						refinementResolved: Object.values(differences).every(
							(d) => Math.abs(d.mean) + d.halfWidth95 <= tolerance,
						),
						models: Object.fromEntries(Object.entries(rays[r].models).map(([name, v]) => [name, v[ch]])),
					});
					if (id !== 'control') {
						const baseRows = get('control', ch, r, 'reference'),
							delta = estimate(bs.map((b, i) => b.means[0] - baseRows[i].means[0]));
						const baseline = estimate(baseRows.map((b) => b.means[0])),
							residual = baseline.mean - rays[r].measured[ch];
						contrasts.push({
							caseId: id,
							ray: rays[r].id,
							wavelength: optical.values[ch].wavelength,
							delta,
							sseChange: 2 * residual * delta.mean + delta.mean ** 2,
							directionResolved: Math.abs(delta.mean) > delta.halfWidth95,
						});
					}
				}
		const interactions = [];
		for (let ch = 0; ch < 5; ch++)
			for (let r = 0; r < 6; r++) {
				const bs = cases.map((id) => get(id, ch, r, 'reference'));
				interactions.push({
					ray: rays[r].id,
					wavelength: optical.values[ch].wavelength,
					interaction: estimate(
						bs[0].map((b, i) => bs[3][i].means[0] - bs[1][i].means[0] - bs[2][i].means[0] + b.means[0]),
					),
				});
			}
		/** @type {[string,(r:typeof rows[number])=>boolean][]} */
		const selectors = [
			['all', () => true],
			['supported-visible', (r) => r.wavelength >= 440],
			...['09:30', '13:30'].map(
				(t) => /** @type {[string,(r:typeof rows[number])=>boolean]} */ ([t, (r) => r.time === t]),
			),
			...[360, 454, 548, 642, 712.5].map(
				(w) =>
					/** @type {[string,(r:typeof rows[number])=>boolean]} */ ([String(w), (r) => r.wavelength === w]),
			),
			...rays.map(
				(ray) => /** @type {[string,(r:typeof rows[number])=>boolean]} */ ([ray.id, (r) => r.ray === ray.id]),
			),
		];
		const scores = selectors.map(([name, predicate]) => ({
			name,
			values: Object.fromEntries(
				cases.map((id) => {
					const selected = rows.filter((r) => r.caseId === id && predicate(r));
					return [
						id,
						{
							count: selected.length,
							rmse: Math.sqrt(selected.reduce((s, r) => s + r.residual ** 2, 0) / selected.length),
							bias: selected.reduce((s, r) => s + r.residual, 0) / selected.length,
						},
					];
				}),
			),
		}));
		zip('results.json.gz', {
			rows,
			contrasts,
			interactions,
			scores,
			executions,
			checks,
			precision: {
				sampling: rows.filter((r) => r.samplingResolved).length,
				refinement: rows.filter((r) => r.refinementResolved).length,
				total: rows.length,
			},
			failure: failure?.message ?? null,
		});
		console.log(
			JSON.stringify({
				scores,
				precision: {
					sampling: rows.filter((r) => r.samplingResolved).length,
					refinement: rows.filter((r) => r.refinementResolved).length,
				},
			}),
		);
	} catch (e) {
		failure ??= e instanceof Error ? e : new Error(String(e));
		zip('partial-results.json.gz', {rows, contrasts, executions, failure: failure.message});
	}
	const cleanup = run.cleanup(),
		seal = run.finish(failure ? 'failed' : 'accepted', {
			caseId: aerosolPackageId,
			jobElapsedMilliseconds: Date.now() - started,
			checks,
			completedBatches: batches.length,
			failure: failure?.message ?? null,
			cleanup,
		});
	assert.deepEqual(verifyRun(run.path), seal);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			seal,
			failure: failure?.message ?? null,
			retainedBytes: storage().retainedBytes,
			usage: {
				phases: usage.retainedBytesByPhase,
				gpuAttempts: usage.gpuConstructions,
				cpuMilliseconds: usage.cpuElapsedMilliseconds,
				gpuMilliseconds: usage.gpuElapsedMilliseconds,
			},
		}),
	);
	if (failure) throw failure;
}
await main();
