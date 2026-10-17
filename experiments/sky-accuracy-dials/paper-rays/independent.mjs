import assert from 'node:assert/strict';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {fragment, executeGpu} from '../horizon-reference/gpu.mjs';
import {direct} from '../horizon-reference/math.mjs';
import {createRun, readRepository, verifyRun, checkedAbsolute} from '../io/files.mjs';
import {packet, reuseThird} from './packet.mjs';

/** Add independent Lambertian reflection with explicit interaction counting.
 * @param {number} albedo @param {number} [offset=1] @returns {string}
 */
function kernel(albedo, offset = 1) {
	let s = fragment();
	const needle = 'if(distance>=e.x){finished=true;break;}';
	assert.equal(s.split(needle).length, 2);
	const ground = `if(distance>=e.x){
  if(e.y<0.5||${albedo.toExponential(16)}==0.0){finished=true;break;}
  travel+=e.x;x+=v*e.x;vec3 normal=normalize(x);x=normal*(R+${offset.toFixed(4)});depth++;
  sun=sunlight(x);float gc=weight*${albedo.toExponential(16)}*sun.w*max(0.0,dot(normal,sun.xyz))/PI;
  total+=gc;if(depth==2)two+=gc;if(depth==3)three+=gc;if(depth==4)four+=gc;
  if(firstMie)mie+=gc;else rayleigh+=gc;if(maxRadius>=100000.0)historyFar+=gc;weightedLength+=gc*travel;weightedTau+=gc*travelTau;
  weight*=${albedo.toExponential(16)};if(depth>=rouletteStart){if(random()>=0.8){finished=true;break;}weight/=0.8;}
  v=rotate(sqrt(random()),2.0*PI*random(),normal);continue;
 }`;
	return s.replace(needle, ground);
}

/** Run independent paper optical histories; numerical prefixes are tallied, never cached.
 * @returns {Promise<void>} Accepted immutable pilot or full reference measurement.
 */
async function main() {
	const pilot = process.argv[2] === 'pilot';
	assert.ok(pilot || process.argv[2] === 'full');
	const p = packet(),
		channels = pilot ? [4, 12, 24] : Array.from({length: 40}, (_, i) => i),
		paths = pilot ? 2048 : 8192;
	const profiles = pilot
		? [{name: 'pilot', batches: 4, quadrature: 128, roulette: 8, seed: 0x11300000}]
		: [
				{name: 'main', batches: 24, quadrature: 128, roulette: 8, seed: 0x21300000},
				{name: 'control64', batches: 8, quadrature: 64, roulette: 8, seed: 0x21300000},
			];
	const reuse = p.campaign === 'h58' && !pilot;
	const oldRoot = 'tmp/experiments/sky-accuracy-dials/runs/00355-h57-independent';
	if (reuse) reuseThird(p, oldRoot);
	const run = createRun(pilot ? `${p.campaign}-gpu-pilot` : `${p.campaign}-independent`, {
		parents: p.parents,
		operation:
			'Independent cache-free backward Monte Carlo, analytic paper phase, exponential spherical medium and spectral Lambertian grass; separately tally interactions1-4 and compensated all orders.',
		parameters: {
			reusedRay: reuse
				? {
						ray: 2,
						parent: oldRoot,
						operation: 'Copy unchanged batches for the exactly matching third physical packet.',
					}
				: null,
			channels,
			paths,
			profiles,
			groundOffsetMeters: 1,
			orderConvention: 'Surface reflection counts as one interaction; initial visible collision is order1.',
			targets: {Y95: 0.03, band95: 0.1},
		},
	});
	/** @type {PaperRayGpuBatch[]} */ const batches = [];
	let browser,
		failure = null,
		current = -1;
	try {
		if (reuse) {
			const old = /** @type {PaperRayGpuBatch[]} */ (
				JSON.parse(readRepository(oldRoot + '/batches.json').toString())
			);
			batches.push(...old.filter((b) => b.group === 2));
			assert.equal(batches.length, 40 * 32);
		}
		run.write('packet.json', {rays: p.rays, centers: p.centers, grass: p.grass, channels, paths, profiles});
		run.write('ranking.json', p.ranking);
		const exact = [];
		for (const channel of channels) {
			for (const ray of p.rays) {
				const group = {
					id: ray.id,
					medium: ray.medium,
					origin: ray.origin,
					direction: ray.direction,
					end: ray.end,
					channel,
				};
				const fine = direct(group, 128).total,
					coarse = direct(group, 64).total;
				exact.push({channel, ray: ray.id, N1: fine, relative64: coarse / fine - 1});
			}
			run.progress('direct', `Independent binary64 N1: channel${channel}`, channel, 40);
		}
		run.write('direct-n1.json', exact);
		browser = await puppeteer.launch({
			executablePath: checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),
			headless: true,
			userDataDir: checkedAbsolute(path.join(run.scratchPath, 'gpu'), false),
			protocolTimeout: 1200000,
			args: [
				'--enable-gpu',
				'--ignore-gpu-blocklist',
				'--disable-software-rasterizer',
				'--use-angle=d3d11',
				'--disable-background-timer-throttling',
			],
		});
		const page = await browser.newPage();
		await page.exposeFunction(
			'retainBatch',
			/** @param {HorizonReferenceBatch} b */ (b) => {
				batches.push({...b, channel: current});
				run.progress(
					'gpu',
					`channel${current}: ${b.profile} batch${b.batch + 1} ray${b.group + 1}`,
					batches.length,
					channels.length * profiles.reduce((s, x) => s + x.batches, 0) * 3,
				);
			},
		);
		const telemetry = [];
		for (const channel of channels) {
			current = channel;
			const shader = kernel(p.grass[channel]);
			run.write(`kernel-${channel}.glsl`, shader);
			const groups = p.rays
				.filter((_, i) => !reuse || i < 2)
				.map((ray) => ({
					id: ray.id,
					medium: ray.medium,
					origin: ray.origin,
					direction: ray.direction,
					end: ray.end,
					channel,
				}));
			const result = await page.evaluate(executeGpu, shader, {
				groups,
				paths,
				profiles,
				maximumMilliseconds: 1200000,
			});
			telemetry.push({channel, ...result});
			run.write(
				`batches-${channel}.json`,
				batches.filter((b) => b.channel === channel),
			);
			console.log(JSON.stringify({channel, milliseconds: result.milliseconds, completed: result.completed}));
		}
		run.write('batches.json', batches);
		run.write('telemetry.json', telemetry);
	} catch (e) {
		failure = e;
	} finally {
		await browser?.close().catch((e) => (failure ??= e));
	}
	run.cleanup();
	run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null, batches: batches.length});
	verifyRun(run.path);
	assert.equal(failure, null, String(failure));
	console.log(JSON.stringify({run: run.path}));
}
await main();
