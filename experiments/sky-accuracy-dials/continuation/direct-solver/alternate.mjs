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
	outputRelative,
	sourceIdentities,
	sha256,
	verifyRun,
	storage,
	checkedAbsolute,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {alternatePackageId} from './alternate-authorization.mjs';
import {alternateInputs} from './alternate-inputs.mjs';
import {balance, proof as balanceProof} from '../reference-comparison/analysis.mjs';
import {proof, directCpu, gauss} from './math.mjs';
import {monteCarloFragment, monteCarloGpu, estimate} from './monte-carlo.mjs';

/** Fixed batch counts; no stopping on a favorable sample or Kider residual. @type {readonly SkyMcProfile[]} */
const profiles = [
	{name: 't32', transmission: 32, batches: 32, rouletteStart: 8, seedOffset: 536870912},
	{name: 't64', transmission: 64, batches: 32, rouletteStart: 8, seedOffset: 536870912},
	{name: 'reference', transmission: 64, batches: 256, rouletteStart: 8, seedOffset: 1610612736},
	{name: 'roulette16', transmission: 64, batches: 32, rouletteStart: 16, seedOffset: 1610612736},
];

/** Manufactured normalization of the proposal-to-Cornette-Shanks rejection construction. */
function stochasticProof() {
	let checks = proof();
	const q = gauss(128);
	for (const g of [0.1, 0.7, 0.85]) {
		let acceptedMass = 0,
			phaseMass = 0;
		for (let i = 0; i < q.nodes.length; i++) {
			const c = 2 * q.nodes[i] - 1;
			const hg = (1 - g * g) / (2 * (1 + g * g - 2 * g * c) ** 1.5);
			acceptedMass += (2 * q.weights[i] * hg * (1 + c * c)) / 2;
			phaseMass += (2 * q.weights[i] * hg * 1.5 * (1 + c * c)) / (2 + g * g);
		}
		assert.ok(Math.abs(acceptedMass - (2 + g * g) / 3) < 1e-11);
		assert.ok(Math.abs(phaseMass - 1) < 1e-11);
		checks += 2;
	}
	assert.equal(estimate([1, 1, 1]).standardError, 0);
	checks++;
	return checks;
}

async function main() {
	const proofChecks = stochasticProof() + balanceProof();
	assert.ok(['proof', 'preflight', 'execute'].includes(process.argv[2]));
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({proofChecks}));
		return;
	}
	const {medium, rays, channels, parents: inputParents} = alternateInputs();
	/** @type {SkyMcGroup[]} */ const groups = rays.flatMap((r, ray) =>
		channels.map((_, channel) => ({
			ray,
			channel,
			origin: [...r.origin],
			direction: [...r.direction],
			physical: [medium.rayleigh[channel], medium.mie[channel], medium.sun[channel], medium.ground[channel]],
		})),
	);
	const shader = monteCarloFragment(medium);
	assert.ok(!/sampler|texture\s*\(/.test(shader));
	if (process.argv[2] === 'preflight') {
		console.log(JSON.stringify({proofChecks, profiles, groups: groups.length, shaderBytes: shader.length, rays}));
		return;
	}
	const started = Date.now(),
		registration = readRegistration(outputRelative + '/runs/00099-c0-registration');
	const admission = admitJob(registration, 'gpu', 'component', 1048576, 'C5', alternatePackageId);
	const authorization = admission.gpuAuthorization;
	assert.ok(authorization && 'priorAttempts' in authorization);
	const maximumJobMilliseconds = Math.min(
		25 * 60000,
		admission.timeoutMilliseconds,
		Date.parse(authorization.deadline) - started - 30000,
	);
	assert.ok(maximumJobMilliseconds > 120000);
	const sources = sourceIdentities(),
		base = identity(outputRelative + '/runs/00226-remain-observe/sources.json.gz');
	const tools = [process.execPath, 'C:/Program Files/Google/Chrome/Application/chrome.exe'].map((p) => {
		const absolute = checkedAbsolute(path.resolve(p)),
			bytes = readFileSync(absolute);
		return {path: absolute, byteLength: bytes.length, sha256: sha256(bytes)};
	});
	const parents = [
		registration.seal,
		authorization.plan,
		authorization.through,
		...inputParents,
		base,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Cache-free stochastic evaluation of idealized spherical transport, including unlimited compensated scattering and coupled Lambertian ground, with fixed numerical controls and unchanged Kider measurements.',
		parameters: {
			caseId: alternatePackageId,
			packageId: alternatePackageId,
			continuationRegistration: registration.run,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			gpuAuthorization: authorization,
			allocatedBytes: 1048576,
			maximumJobMilliseconds,
			profiles,
			pathsPerBatch: 8192,
			tools,
			noPhysicalFieldCaches: true,
			interactionOrderIncludesGround: true,
		},
	};
	const run = createRun('alternate-rays', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path, maximumJobMilliseconds}));
	const write = (name, value) =>
		run.write(name, value, {
			parents: [definition],
			operation:
				'Exact inputs, source bytes, proof checks or direct stochastic computation under the frozen recipe.',
		});
	const compressed = (name, value) => write(name, gzipSync(Buffer.from(JSON.stringify(value)), {level: 9}));
	/** @type {SkyMcBatch[]} */ const batches = [];
	const retainedProfiles = new Set();
	let browser = null,
		failure = null,
		watchdog = null,
		execution = null;
	const cpu = [],
		proofBatches = [];
	let lastProgress = 0;
	try {
		write('plan.md', readRepository(authorization.plan.path, authorization.plan));
		write('inputs.json', {medium, rays, channels});
		write('shader.glsl', shader);
		const old = JSON.parse(gunzipSync(readRepository(base.path, base)).toString());
		for (const s of old) assert.equal(sha256(Buffer.from(s.base64, 'base64')), s.sha256);
		compressed('sources-delta.json.gz', {
			base,
			currentSources: sources,
			changed: sources
				.filter((s) => !old.some((o) => o.path === s.path && o.sha256 === s.sha256))
				.map((s) => ({...s, base64: readRepository(s.path, s).toString('base64')})),
		});
		for (const item of groups) {
			const values = [128, 256].map((n) =>
				directCpu(
					medium,
					{name: 'cpu', view: n, path: 8, transmission: n, mu: 4, phi: 8, orders: 1},
					item.channel,
				).radiance(item.origin, item.direction, 1, true),
			);
			assert.ok(Math.abs(values[1] - values[0]) < 1e-5, 'CPU first-order refinement');
			cpu.push(values);
		}
		write('proof.json', {proofChecks, cpu});
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
		const ownedPid = browser.process()?.pid;
		watchdog = setTimeout(
			() => {
				if (ownedPid)
					try {
						execFileSync('taskkill', ['/PID', String(ownedPid), '/T', '/F'], {
							windowsHide: true,
							stdio: 'ignore',
							timeout: 10000,
						});
					} catch {}
			},
			Math.max(1000, maximumJobMilliseconds - (Date.now() - started) - 20000),
		);
		const page = await browser.newPage();
		let proving = true;
		await page.exposeFunction(
			'retainBatch',
			/** @param {SkyMcBatch} row */ (row) => {
				assert.equal(row.means.length, 4);
				assert.ok(row.means.every(Number.isFinite));
				if (proving) {
					proofBatches.push(row);
					return;
				}
				batches.push(row);
				const p = profiles.find((p) => p.name === row.profile);
				assert.ok(p);
				if (row.group === groups.length - 1 && row.batch === p.batches - 1) {
					compressed(
						p.name + '-batches.json.gz',
						batches.filter((b) => b.profile === p.name),
					);
					retainedProfiles.add(p.name);
					console.log(
						JSON.stringify({
							profile: p.name,
							completedBatches: batches.length,
							elapsedMilliseconds: Date.now() - started,
						}),
					);
				}
				if (Date.now() - lastProgress > 10000) {
					run.progress(
						'integrate',
						`${row.profile} batch ${row.batch + 1}/${p.batches}, group ${row.group + 1}/${groups.length}`,
					);
					lastProgress = Date.now();
				}
			},
		);
		const manufactured = await page.evaluate(monteCarloGpu, monteCarloFragment({...medium, albedo: 0}), {
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
		assert.equal(proofBatches.length, 3);
		assert.equal(proofBatches[0].means[0], 0);
		assert.equal(proofBatches[2].means[0], 0);
		assert.ok(Math.abs(proofBatches[1].means[0] - 0.5 / Math.PI) < 1e-7);
		write('gpu-proof.json', {manufactured, proofBatches});
		proving = false;
		execution = await page.evaluate(monteCarloGpu, shader, {
			groups,
			profiles,
			pathsPerBatch: 8192,
			maximumMilliseconds: maximumJobMilliseconds - (Date.now() - started) - 40000,
		});
		for (const id of [...sources, ...parents]) readRepository(id.path, id);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	} finally {
		if (browser)
			try {
				await browser.close();
			} catch (error) {
				failure ??= new Error(String(error));
			}
		if (watchdog) clearTimeout(watchdog);
	}
	compressed(
		'partial-batches.json.gz',
		batches.filter((b) => !retainedProfiles.has(b.profile)),
	);
	const rows = [];
	for (let group = 0; group < groups.length; group++) {
		const item = groups[group],
			ray = rays[item.ray];
		const data = profiles.map((p) => ({
			profile: p.name,
			rows: batches.filter((b) => b.group === group && b.profile === p.name),
		}));
		const reference = data.find((d) => d.profile === 'reference').rows;
		if (reference.length < 32) continue;
		const total = estimate(reference.map((r) => r.means[0])),
			first = estimate(reference.map((r) => r.means[1]));
		const tolerance = Math.max(0.0005, 0.005 * total.mean);
		const low = data.find((d) => d.profile === 't32').rows,
			high = data.find((d) => d.profile === 't64').rows;
		const paired =
			low.length === 32 && high.length === 32 ? estimate(high.map((r, i) => r.means[0] - low[i].means[0])) : null;
		const rr = data.find((d) => d.profile === 'roulette16').rows;
		const roulette = rr.length === 32 ? estimate(rr.map((r, i) => r.means[0] - reference[i].means[0])) : null;
		const parity =
			Math.abs(first.mean - cpu[group][1]) <= 6 * first.standardError + Math.max(1e-6, 0.0003 * cpu[group][1]);
		if (!parity) failure ??= new Error('Stochastic first-order parity failed');
		rows.push({
			ray: ray.id,
			role: ray.role,
			time: ray.time,
			models: Object.fromEntries(
				Object.entries(ray.models).map(([name, values]) => [name, values[item.channel]]),
			),
			balances: Object.fromEntries(
				['control', 'production'].map((name) => [
					name,
					balance(ray.models[name][item.channel], total.mean, ray.measured[item.channel], total.halfWidth95),
				]),
			),
			channel: channels[item.channel],
			total,
			first,
			second: estimate(reference.map((r) => r.means[2])),
			higher: estimate(reference.map((r) => r.means[3])),
			cpu: cpu[group],
			parity,
			paired,
			roulette,
			half1: estimate(reference.slice(0, reference.length / 2).map((r) => r.means[0])),
			half2: estimate(reference.slice(reference.length / 2).map((r) => r.means[0])),
			tolerance,
			samplingResolved: total.halfWidth95 <= tolerance,
			attenuationResolved: paired !== null && Math.abs(paired.mean) + paired.halfWidth95 <= tolerance,
			rouletteResolved: roulette !== null && Math.abs(roulette.mean) + roulette.halfWidth95 <= tolerance,
			measured: ray.measured[item.channel],
			residual: total.mean - ray.measured[item.channel],
			maximumDepth: Math.max(...reference.map((r) => r.maximumDepth)),
		});
	}
	if (batches.length !== profiles.reduce((s, p) => s + p.batches * groups.length, 0) || rows.length !== groups.length)
		failure ??= new Error('Incomplete fixed numerical matrix');
	compressed('results.json.gz', {
		execution,
		rows,
		completedBatches: batches.length,
		failure: failure?.message ?? null,
	});
	const cleanup = run.cleanup();
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		caseId: alternatePackageId,
		jobElapsedMilliseconds: Date.now() - started,
		proofChecks,
		completedBatches: batches.length,
		completedReferenceRows: rows.length,
		failure: failure?.message ?? null,
		cleanup,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			seal,
			state: failure ? 'failed' : 'accepted',
			failure: failure?.message,
			retainedBytes: storage().retainedBytes,
			retainedC5: usage.retainedBytesByPhase.C5,
			gpuAttempts: usage.gpuConstructions,
			rows: rows.map((r) => ({
				ray: r.ray,
				channel: r.channel,
				mean: r.total.mean,
				halfWidth: r.total.halfWidth95,
				residual: r.residual,
				sampling: r.samplingResolved,
				attenuation: r.attenuationResolved,
				roulette: r.rouletteResolved,
			})),
		}),
	);
	if (failure) throw failure;
}
await main();
