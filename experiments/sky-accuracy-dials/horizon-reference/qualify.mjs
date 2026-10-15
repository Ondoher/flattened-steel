import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdirSync, readdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {createRun, identity, verifyRun, checkedAbsolute, readRepository, resolveRepository} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {boundary, phase} from './math.mjs';
import {fragment, executeGpu} from './gpu.mjs';

/** Complete the second and final GPU qualification job, using fixed counts independent of observed color.
 * @returns {Promise<void>} Seals compact qualification evidence; any transport/device error seals failure and rejects.
 */
async function main() {
	const spent = requireUnusedStage('h22-h26-qual', true),
		started = Date.now(),
		sourceRun = process.argv[2];
	assert.match(sourceRun, /^\d{5}-h21-h26-ref$/);
	/** @type {DialFileIdentity[]} */ const parents = [];
	const sourceSeal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + sourceRun);
	parents.push(sourceSeal);
	const sourceResult = JSON.parse(readRepository(sourceSeal.path, sourceSeal).toString()).result;
	const priorElapsed = sourceResult.elapsedMilliseconds + sourceResult.previousFailureMilliseconds;
	const previousAttempts = readdirSync(resolveRepository('tmp/experiments/sky-accuracy-dials/runs'))
		.filter((name) => name.endsWith('-h21-h26-ref') || name.endsWith('-h22-h26-qual'))
		.reduce((sum, name) => {
			const seal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + name);
			return sum + JSON.parse(readRepository(seal.path, seal).toString()).result.gpuAttempts;
		}, 0);
	assert.equal(previousAttempts, 1, 'Only one of the two authorized GPU jobs may precede final qualification');
	assert.ok(
		sourceResult.gpuAttempts === 1 && spent === 0,
		'Final GPU qualification may run once after a single successful reference attempt',
	);
	const deadline = started + 1200000 - priorElapsed,
		inputs = /** @type {HorizonReferenceInputs} */ (readParent(sourceRun, 'inputs.json.gz', parents));
	/** @type {HorizonReferenceGroup[]} */ const groups = [];
	const counts = [30, 60],
		wavelengths = counts.map((n) => Array.from({length: n}, (_, i) => 360 + ((i + 0.5) * 470) / n));
	for (let mode = 0; mode < 2; mode++)
		for (let basis = 0; basis < 2; basis++) {
			const original = inputs.groups.find((g) => g.id === `${mode ? 'distant' : 'local'}-3-away`),
				n = counts[basis];
			assert.ok(original);
			const m = {
				...original.medium,
				rayleigh: wavelengths[basis].map((w) => 1.24062e-6 / (w / 1000) ** 4),
				mie: wavelengths[basis].map((w) => (0.04 * (w / 1000) ** -0.8) / 1200),
				sourceIrradiance: wavelengths[basis].map(
					(_, i) => original.medium.sourceIrradiance[Math.floor((i * 15) / n)],
				),
			};
			for (let channel = 0; channel < n; channel++)
				groups.push({...original, id: `${mode ? 'distant' : 'local'}-fine${n}`, medium: m, channel});
		}
	for (const row of inputs.incoming.filter((r) => r.mode === 0))
		for (const channel of [2, 7, 12])
			groups.push({
				id: `local-p2-${row.altitude}`,
				medium: inputs.groups[0].medium,
				origin: row.point,
				direction: row.direction,
				channel,
				end: -1,
			});
	const run = createRun('h22-h26-qual', {
		parents,
		operation:
			'Final bounded GPU qualification: Native30/60 refinement of analytic spectral coefficients while preserving the exact original Native15 bin energy; independent local P2 and manufactured homogeneous/vacuum checks.',
		parameters: {
			previousNumericalMilliseconds: priorElapsed,
			maximumMilliseconds: 1200000 - priorElapsed,
			gpuAttempt: 2,
			pathsPerBatch: 4096,
			batches: 16,
			seed: 2684354560,
			sourceSpectrum:
				'Piecewise constant within each authenticated Native15 bin, unchanged bin-integrated energy. This qualifies numerical refinement within that spectral reconstruction, not unknown sub-bin solar structure or a libRadtran paper score.',
			groundAlbedo: 0,
		},
	});
	const definition = identity(run.path + '/definition.json');
	/** Retain a compact immutable packet derived from the declared physical parents.
	 * @param {string} name @param {unknown} value @returns {DialFileIdentity} Artifact identity; invalid destinations fail.
	 */
	function write(name, value) {
		return run.write(name, gzipSync(Buffer.from(JSON.stringify(value)), {level: 9}), {
			parents: [definition],
			operation:
				'Independent GPU qualification or exact input/proof record under the registered fine spectral problem.',
		});
	}
	/** @type {HorizonReferenceBatch[]} */ const rows = [];
	let browser = null,
		failure = null,
		timer = null;
	try {
		write('inputs.json.gz', {sourceRun, groups, counts, wavelengths, incoming: inputs.incoming});
		const scalarChecks = [];
		// The HG proposal accepted by (1+c^2)/2 is exactly proportional to Cornette-Shanks.
		for (const c of [-1, -0.3, 0, 0.7, 1]) {
			const g = 0.7,
				hg = (1 - g * g) / (4 * Math.PI * (1 + g * g - 2 * g * c) ** 1.5),
				p = phase(c, g);
			assert.ok(Math.abs((hg * (1 + c * c)) / 2 / ((2 + g * g) / 3) - p[1]) < 1e-14);
			scalarChecks.push({cosine: c, acceptedPhase: p[1]});
		}
		for (const p of [0.2, 0.8, 1]) assert.equal(p * (1 / p), 1);
		const profile = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profile);
		browser = await puppeteer.launch({
			executablePath: checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),
			headless: true,
			userDataDir: profile,
			protocolTimeout: Math.max(1000, deadline - Date.now() - 15000),
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
		timer = setTimeout(
			() => {
				void browser?.close().catch(() => {});
			},
			Math.max(1000, deadline - Date.now() - 15000),
		);
		const page = await browser.newPage();
		await page.exposeFunction(
			'retainBatch',
			/** @param {HorizonReferenceBatch} row */ (row) => {
				rows.push(row);
				if (row.batch % 4 === 0)
					run.progress('qualification', `${row.profile} batch ${row.batch + 1}, group ${row.group + 1}`);
			},
		);
		const physical = inputs.groups[0],
			vacuum = {
				...physical,
				medium: {...physical.medium, rayleigh: Array(15).fill(0), mie: Array(15).fill(0)},
				id: 'vacuum',
				end: 1000,
			};
		const m = {
			...physical.medium,
			sourceKind: /** @type {HorizonReferenceSource} */ ('parallel'),
			sourceDirection: [0, 0, 1],
			incidentScale: 1,
			rayleigh: Array(15).fill(1e-6),
			mie: Array(15).fill(2e-6),
			sourceIrradiance: Array(15).fill(1),
		};
		const homogeneous = {...physical, medium: m, id: 'homogeneous', direction: [0, 0, 1], channel: 0, end: 99995};
		const manufactured = [vacuum, homogeneous],
			homogeneousShader = fragment().replace('HR=8000.0,HM=1200.0', 'HR=1e30,HM=1e30');
		assert.notEqual(homogeneousShader, fragment());
		const manufacturedTelemetry = await page.evaluate(executeGpu, homogeneousShader, {
			groups: manufactured,
			profiles: [{name: 'manufactured', batches: 16, quadrature: 128, roulette: 8, seed: 3221225472}],
			paths: 4096,
			maximumMilliseconds: Math.min(30000, deadline - Date.now() - 30000),
		});
		const manufacturedRows = rows.splice(0);
		assert.ok(
			manufacturedRows.filter((r) => r.group === 0).every((r) => r.means.every((x) => x === 0)),
			'GPU vacuum',
		);
		const p = phase(1, 0.7),
			expected = (1e-6 * p[0] + 0.8 * 2e-6 * p[1]) * 99995 * Math.exp(-3e-6 * 99995),
			mean = manufacturedRows.filter((r) => r.group === 1).reduce((s, r) => s + r.means[1], 0) / 16;
		assert.ok(Math.abs(mean / expected - 1) < 0.025, 'GPU homogeneous source/Beer integral');
		write('manufactured.json.gz', {
			scalarChecks,
			rouletteExpectation: 'p times 1/p equals one; paired order-8/order-16 controls retained in the parent run',
			expected,
			mean,
			relative: mean / expected - 1,
			rows: manufacturedRows,
			telemetry: manufacturedTelemetry,
			browserVersion: await browser.version(),
		});
		const telemetry = await page.evaluate(executeGpu, fragment(), {
			groups,
			profiles: [{name: 'fine', batches: 16, quadrature: 128, roulette: 8, seed: 2684354560}],
			paths: 4096,
			maximumMilliseconds: Math.max(1000, deadline - Date.now() - 20000),
		});
		write('batches.json.gz', {rows: rows.splice(0), groups, paths: 4096, telemetry});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	} finally {
		if (timer) clearTimeout(timer);
		if (browser)
			try {
				await browser.close();
			} catch (error) {
				failure ??= new Error(String(error));
			}
	}
	write('partial-batches.json.gz', rows);
	run.cleanup();
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		elapsedMilliseconds: Date.now() - started,
		previousNumericalMilliseconds: priorElapsed,
		gpuAttempts: browser ? 1 : 0,
		failure: failure?.message ?? null,
		deadlineHit: Date.now() >= deadline,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	console.log(JSON.stringify({run: run.path, seal, failure: failure?.message, milliseconds: Date.now() - started}));
	if (failure) throw failure;
}
await main();
