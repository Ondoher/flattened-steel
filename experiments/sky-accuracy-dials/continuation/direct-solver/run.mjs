import assert from 'node:assert/strict';
import path from 'node:path';
import {readFileSync, mkdirSync} from 'node:fs';
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
import {directPackageId} from './authorization.mjs';
import {proof, directCpu} from './math.mjs';
import {fragment, gpu} from './shader.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials';
/** Explicit, adjustable integration controls; only this fixed matrix is executed by default. @type {readonly SkyDirectProfile[]} */
const profiles = [
	{name: 'coarse', view: 16, path: 8, transmission: 16, mu: 4, phi: 8, orders: 2},
	{name: 'path', view: 32, path: 16, transmission: 16, mu: 4, phi: 8, orders: 2},
	{name: 'transmission', view: 32, path: 16, transmission: 32, mu: 4, phi: 8, orders: 2},
	{name: 'angular', view: 32, path: 16, transmission: 32, mu: 8, phi: 16, orders: 2},
	{name: 'third', view: 16, path: 8, transmission: 16, mu: 4, phi: 8, orders: 3},
];

async function main() {
	const proofChecks = proof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({proofChecks}));
		return;
	}
	assert.ok(['preflight', 'execute'].includes(process.argv[2]), 'Use proof, preflight or execute');
	const registration = readRegistration(outputRelative + '/runs/00099-c0-registration');
	const files = ['00103-c-r0-scr/control.json', '00224-targeted-gpu/assessment.json.gz'];
	const parents = files.map((f) => identity(outputRelative + '/runs/' + f));
	for (const runName of ['00103-c-r0-scr', '00224-targeted-gpu'])
		parents.push(verifyRun(outputRelative + '/runs/' + runName));
	const control = JSON.parse(readRepository(parents[0].path, parents[0]).toString());
	const prior = JSON.parse(gunzipSync(readRepository(parents[1].path, parents[1])).toString());
	const spec = control.buildRequest.transportSpec,
		atmosphere = spec.atmosphere;
	const channels = [0, 8, 24, 30],
		spectra = channels.map((c) => spec.domains.spectrum.channels[c]);
	assert.equal(atmosphere.ozone.absorptionEnabled, false);
	/** @type {SkyDirectMedium} */ const medium = {
		bottom: spec.planet.bottomRadiusMeters / 1000,
		top: spec.planet.topRadiusMeters / 1000,
		rayleighHeight: atmosphere.rayleighScaleHeightMeters / 1000,
		mieHeight: atmosphere.mieScaleHeightMeters / 1000,
		albedo: atmosphere.mieSingleScatteringAlbedo,
		g: atmosphere.miePhaseFunctionG,
		rayleigh: spectra.map((s) => s.rayleighScatteringPerMeter * 1000),
		mie: spectra.map((s) => s.mieExtinctionPerMeter * 1000),
		sun: spectra.map((s) => s.sourceIrradianceDensityWattsPerSquareMeterPerNanometer),
		ground: spectra.map((s) => s.groundAlbedo),
	};
	const ids = ['p-0930-5-7', 'p-1230-3-5', 'p-1230-3-4', 'p-1230-0-4', 'p-1230-4-4'];
	/** @type {SkyDirectRay[]} */ const rays = ids.map((id) => {
		const [, time, x, y] = id.split('-');
		const probe = registration.record.probeRays.find(
			(p) => p.time.replace(':', '') === time && p.gridX === Number(x) && p.gridY === Number(y),
		);
		assert.ok(probe);
		const rows = channels.map((channel) =>
			prior.rows.find((r) => r.probeId === id && r.channel === channel && r.mode === 7 && r.sourceCount === 160),
		);
		assert.ok(rows.every(Boolean));
		assert.ok(probe.elevationDegrees > 0, 'Outer rays must end at space');
		return {
			id,
			time: probe.time,
			origin: probe.origin.map((x) => x / 1000),
			direction: probe.direction,
			measured: rows.map((r) => r.measuredW),
			previous: rows.map((r) => r.first16W + r.higherW),
		};
	});
	if (process.argv[2] === 'preflight') {
		console.log(JSON.stringify({proofChecks, profiles, medium, rays}));
		return;
	}
	const started = Date.now(),
		admission = admitJob(registration, 'gpu', 'component', 768 * 1024, 'C5', directPackageId);
	const authorization = admission.gpuAuthorization;
	assert.ok(authorization && 'priorAttempts' in authorization);
	const maximumJobMilliseconds = Math.min(12 * 60000, Date.parse(authorization.deadline) - started - 30000);
	assert.ok(maximumJobMilliseconds > 60000);
	const plan = identity(topic + '/direct-solver-plan.md'),
		sources = sourceIdentities();
	const base = identity(outputRelative + '/runs/00226-remain-observe/sources.json.gz');
	const tools = [process.execPath, 'C:/Program Files/Google/Chrome/Application/chrome.exe'].map((p) => {
		const absolute = checkedAbsolute(path.resolve(p)),
			bytes = readFileSync(absolute);
		return {path: absolute, byteLength: bytes.length, sha256: sha256(bytes)};
	});
	const allParents = [
		registration.seal,
		plan,
		authorization.through,
		...parents,
		base,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents: allParents,
		operation:
			'Direct nested quadrature of continuous radiative transfer without cached physical fields; five rays, four spectral components, fixed resolution contrasts.',
		parameters: {
			caseId: directPackageId,
			packageId: directPackageId,
			continuationRegistration: registration.run,
			jobKind: 'gpu',
			scope: 'component',
			phase: 'C5',
			gpuAuthorization: authorization,
			allocatedBytes: 768 * 1024,
			maximumJobMilliseconds,
			profiles,
			tools,
			noPhysicalFieldCaches: true,
			interactionOrderIncludesGround: true,
		},
	};
	const run = createRun('direct-ideal', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path, maximumJobMilliseconds}));
	let browser = null,
		failure = null,
		parityChecks = 0;
	const results = [];
	const write = (name, value) =>
		run.write(name, value, {
			parents: [definition],
			operation: 'Direct computation or exact source/input retention under the frozen execution recipe.',
		});
	try {
		write('plan.md', readRepository(plan.path, plan));
		write('inputs.json', {medium, rays, channels});
		const old = JSON.parse(gunzipSync(readRepository(base.path, base)).toString());
		for (const s of old) assert.equal(sha256(Buffer.from(s.base64, 'base64')), s.sha256);
		const changed = sources.filter((s) => !old.some((o) => o.path === s.path && o.sha256 === s.sha256));
		write(
			'sources-delta.json.gz',
			gzipSync(
				Buffer.from(
					JSON.stringify({
						base,
						currentSources: sources,
						changed: changed.map((s) => ({...s, base64: readRepository(s.path, s).toString('base64')})),
					}),
				),
				{level: 9},
			),
		);
		write('proof.json', {proofChecks});
		const profilePath = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profilePath);
		browser = await puppeteer.launch({
			executablePath: tools[1].path,
			headless: true,
			userDataDir: profilePath,
			protocolTimeout: 90000,
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
		const page = await browser.newPage();
		const transfer = await page.evaluate(
			gpu,
			'#version 300 es\nprecision highp float;out vec4 outputValue;void main(){outputValue=vec4(1,2,3,4);}',
			1,
		);
		assert.deepEqual(transfer.values, [1, 2, 3, 4]);
		write('transport-proof.json', transfer);
		for (const p of profiles) {
			const profileResults = [];
			for (const ray of rays) {
				const cumulative = [0, 0, 0, 0],
					orders = [];
				for (let order = 1; order <= p.orders; order++) {
					assert.ok(
						Date.now() - started < maximumJobMilliseconds - 45000,
						'Direct execution deadline; partial rows preserved',
					);
					run.progress('integrate', `${p.name} ${ray.id} interaction ${order}`);
					const shader = fragment(medium, p, ray, order),
						count = p.view * (order === 1 ? 1 : p.mu * p.phi);
					const result = await page.evaluate(gpu, shader, count);
					if (order === 1) {
						const cpu = channels.map((_, c) =>
							directCpu(medium, p, c).radiance(ray.origin, ray.direction, 1, true),
						);
						for (let c = 0; c < 4; c++) {
							assert.ok(
								Math.abs(cpu[c] - result.values[c]) <= Math.max(1e-6, 0.005 * Math.abs(cpu[c])),
								'CPU/GPU direct first-order parity',
							);
							parityChecks++;
						}
						orders.push({...result, order, cpu, shaderSha256: sha256(shader)});
					} else {
						const cpu =
							p.name === 'coarse' && ray.id === 'p-0930-5-7'
								? channels.map((_, c) =>
										directCpu(medium, p, c).radiance(ray.origin, ray.direction, order, true),
									)
								: null;
						if (cpu)
							for (let c = 0; c < 4; c++) {
								assert.ok(
									Math.abs(cpu[c] - result.values[c]) <= Math.max(1e-6, 0.005 * Math.abs(cpu[c])),
									'CPU/GPU nested direct parity',
								);
								parityChecks++;
							}
						orders.push({...result, order, cpu, shaderSha256: sha256(shader)});
					}
					for (let c = 0; c < 4; c++) cumulative[c] += result.values[c];
					write(`${p.name}-${ray.id}-n${order}.json`, orders.at(-1));
				}
				const row = {
					profile: p.name,
					probeId: ray.id,
					orders,
					cumulative,
					residual: cumulative.map((x, c) => x - ray.measured[c]),
					measured: ray.measured,
					previous: ray.previous,
				};
				profileResults.push(row);
				results.push(row);
			}
			write(p.name + '-results.json', profileResults);
			console.log(
				JSON.stringify({
					profile: p.name,
					rays: profileResults.length,
					elapsedMilliseconds: Date.now() - started,
					rows: profileResults.map((r) => ({
						id: r.probeId,
						value454: r.cumulative[1],
						error454: r.residual[1],
					})),
				}),
			);
		}
		for (const id of [...sources, ...allParents]) readRepository(id.path, id);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	} finally {
		if (browser) await browser.close();
	}
	write('results.json', {results, parityChecks, failure: failure?.message ?? null});
	const cleanup = run.cleanup(),
		state = failure ? 'failed' : 'accepted';
	const seal = run.finish(state, {
		caseId: directPackageId,
		jobElapsedMilliseconds: Date.now() - started,
		proofChecks,
		parityChecks,
		completedRayProfiles: results.length,
		failure: failure?.message ?? null,
		cleanup,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			state,
			seal,
			completedRayProfiles: results.length,
			parityChecks,
			failure: failure?.message,
			retainedBytes: storage().retainedBytes,
			retainedC5: usage.retainedBytesByPhase.C5,
			gpuAttempts: usage.gpuConstructions,
		}),
	);
	if (failure) throw failure;
}
await main();
