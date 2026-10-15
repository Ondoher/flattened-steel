import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdirSync, readdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import puppeteer from 'puppeteer';
import {
	createRun,
	identity,
	readRepository,
	verifyRun,
	checkedAbsolute,
	storage,
	resolveRepository,
} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {boundary, unit, direct, proofs, estimate} from './math.mjs';
import {fragment, executeGpu} from './gpu.mjs';

/** Freeze sparse ray/channel groups from authenticated physical data. No production calculation is imported.
 * @param {readonly HorizonReferenceMedium[]} inputs @param {readonly HorizonAuditIncomingRow[]} incoming
 * @returns {HorizonReferenceGroup[]} Original, proximity and independent P2 queries.
 */
function groupsFrom(inputs, incoming) {
	/** @type {HorizonReferenceGroup[]} */ const groups = [];
	for (let mode = 0; mode < 2; mode++)
		for (const elevation of [0.05, 3, 20])
			for (const heading of ['toward', 'away']) {
				const m = inputs[mode],
					origin = [0, 0, mode ? m.radius + 5 : 5],
					e = (elevation * Math.PI) / 180,
					sign = heading === 'away' ? 1 : -1,
					direction = [0, sign * Math.cos(e), Math.sin(e)],
					end = boundary(m, origin, direction).distance;
				for (const channel of heading === 'away' ? Array.from({length: 15}, (_, i) => i) : [2, 6, 9])
					groups.push({
						id: `${mode ? 'distant' : 'local'}-${elevation}-${heading}`,
						medium: m,
						origin,
						direction,
						channel,
						end,
					});
			}
	const original = inputs[0],
		o = [0, 0, 5],
		delta = original.sourcePosition.map((x, i) => x - o[i]),
		d = Math.hypot(...delta),
		sun = unit(delta),
		observerScale = (original.referenceDistance / d) ** 2;
	for (const variant of ['double', 'parallel'])
		for (const elevation of [3, 20])
			for (const channel of [2, 6, 9]) {
				const m = {
					...original,
					sourcePosition: o.map((x, i) => x + 2 * delta[i]),
					sourceDirection: sun,
					incidentScale: variant === 'double' ? 4 : observerScale,
					sourceKind: /** @type {HorizonReferenceSource} */ (variant === 'double' ? 'finite' : 'parallel'),
				};
				const e = (elevation * Math.PI) / 180,
					direction = [0, Math.cos(e), Math.sin(e)];
				groups.push({
					id: `${variant}-${elevation}-away`,
					medium: m,
					origin: o,
					direction,
					channel,
					end: boundary(m, o, direction).distance,
				});
			}
	for (const row of incoming.filter((r) => r.mode === 1))
		for (const channel of [2, 7, 12])
			groups.push({
				id: `p2-${row.altitude}`,
				medium: inputs[1],
				origin: row.point,
				direction: row.direction,
				channel,
				end: -1,
			});
	return groups;
}

/** Validate path identities and summarize independent batches; no significance-based sample selection.
 * @param {readonly HorizonReferenceBatch[]} batches @param {readonly HorizonReferenceGroup[]} groups
 * @param {string} profile @returns {HorizonReferenceRow[]} Mean/interval vectors and exact additive-identity checks.
 */
function summarize(batches, groups, profile) {
	return groups.map((g, index) => {
		const rows = batches.filter((b) => b.profile === profile && b.group === index);
		assert.ok(rows.length >= 16);
		for (const row of rows) {
			const a = row.means,
				tolerance = Math.max(1e-15, 2e-6 * a[0]);
			assert.ok(Math.abs(a[0] - a[7] - a[8]) < tolerance, 'Species sum');
			assert.ok(Math.abs(a[2] - a[12] - a[13]) < tolerance, 'P2 species sum');
			assert.ok(
				Math.abs(a[0] - Array.from({length: 6}, (_, b) => a[14 + 8 * b]).reduce((s, x) => s + x, 0)) <
					tolerance,
				'Distance sum',
			);
			assert.ok(a[0] + tolerance >= a.slice(1, 5).reduce((s, x) => s + x, 0), 'Nonnegative order tail');
		}
		return {
			group: index,
			id: g.id,
			channel: g.channel,
			metrics: Array.from({length: 62}, (_, k) => estimate(rows.map((r) => r.means[k]))),
			tail: estimate(rows.map((r) => r.means[0] - r.means.slice(1, 5).reduce((s, x) => s + x, 0))),
			maximumDepth: Math.max(...rows.map((r) => r.maximumDepth)),
		};
	});
}

/** Execute H21-H26 with one prospective pilot and frozen confirmation. Retain every failure in a new immutable run.
 * @returns {Promise<void>} Prints the accepted seal, or seals failure and rejects. A repair consumes remaining time and GPU attempt allowance.
 */
async function main() {
	const spent = requireUnusedStage('h21-h26-ref', true),
		started = Date.now(),
		deadline = started + 1200000 - spent,
		before = storage();
	const priorAttempts = readdirSync(resolveRepository('tmp/experiments/sky-accuracy-dials/runs'))
		.filter((x) => x.endsWith('-h21-h26-ref'))
		.reduce(
			(sum, x) =>
				sum +
				JSON.parse(readRepository('tmp/experiments/sky-accuracy-dials/runs/' + x + '/sealed.json').toString())
					.result.gpuAttempts,
			0,
		);
	assert.ok(priorAttempts < 2, 'Two GPU attempt allowance exhausted');
	/** @type {DialFileIdentity[]} */ const parents = [];
	const registration = /** @type {HorizonReferenceParent} */ (
		readParent('00264-h16-h20-audit', 'registration.json', parents)
	);
	const incoming = /** @type {HorizonAuditIncomingRow[]} */ (
		readParent('00264-h16-h20-audit', 'incoming.json', parents)
	);
	const observations = ['local', 'distant'].map((mode) =>
		readParent('00239-horizon-stages', mode + '-observation.json', parents),
	);
	const qualification = readParent('00265-h16-h20-qual', 'qualification.json', parents);
	const referencePath = 'references/results/experiments/b3-matched-atmosphere-solver/libRadtran-reference-cube.json';
	parents.push(identity(referencePath));
	const planPath =
		'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/independent-horizon-reference-plan.md';
	parents.push(identity(planPath));
	const inputs = registration.inputs;
	for (const m of inputs) {
		assert.equal(m.g, 0.7);
		assert.equal(m.albedo, 0.8);
		assert.equal(m.rayleighHeight, 8000);
		assert.equal(m.mieHeight, 1200);
		assert.equal(m.radius, 6360000);
		assert.equal(m.referenceDistance, 4800000);
		assert.equal(m.incidentScale, 1);
		assert.equal(m.topAltitude, m.geometry === 'flat' ? 100000 : 60000);
	}
	const groups = groupsFrom(inputs, incoming),
		shader = fragment();
	assert.ok(!/sampler|texture\s*\(/.test(shader));
	const run = createRun('h21-h26-ref', {
		parents,
		operation:
			'Independent conditional first-scattering quadrature with stochastic free-flight continuation, direct finite-source illumination, order/distance/species attribution, matched receiver P2 and normalized source-proximity interventions.',
		parameters: {
			maximumMilliseconds: 1200000,
			previousFailureMilliseconds: spent,
			maximumGpuAttempts: 2,
			maximumNewRetainedBytes: 16 * 1024 ** 2,
			groundAlbedo: 0,
			source: 'point finite or collimated parallel',
			physicalHypothesis: '100km infinite horizontal slab versus 60km spherical shell',
			pilotBands: [438.3333333333333, 563.6666666666666, 657.6666666666666],
			precision: '1% marginal 95% radiance aim; sampling, quadrature and seed controls reported separately',
			independence:
				'No production numeric imports, cache/grid transforms, shell adapter, production phase/density/view/source helpers or runtime fields. Original authenticated material, rays, units and CIE data are shared. Gauss generator and PCG sampling method adapted from previous reference.',
		},
	});
	const definition = identity(run.path + '/definition.json');
	/** Write immutable evidence with its complete parent recipe.
	 * @param {string} name @param {unknown} value @returns {DialFileIdentity} New artifact identity; duplicate or out-of-bound writes fail.
	 */
	function write(name, value) {
		return run.write(name, gzipSync(Buffer.from(JSON.stringify(value)), {level: 9}), {
			parents: [definition],
			operation:
				'Exact physical registration, independently computed proof/reference data or streaming batch reduction under the retained numerical recipe.',
		});
	}
	/** @type {HorizonReferenceBatch[]} */ const batches = [];
	let browser = null,
		watchdog = null,
		failure = null,
		pilotTelemetry = null,
		confirmationTelemetry = null,
		checkTelemetry = null;
	try {
		console.log(
			JSON.stringify({run: run.path, groups: groups.length, remainingMilliseconds: deadline - Date.now()}),
		);
		write('inputs.json.gz', {
			groups,
			observations,
			incoming,
			qualification,
			instant: '2024-06-20T20:08:46.261Z',
			coordinateConvention: 'right-handed meters, observer-to-scene view and toward-source incident directions',
		});
		run.write('shader.glsl', shader, {
			parents: [definition],
			operation: 'Generated standalone transport kernel from mathematical Gauss rules; no physical fields.',
		});
		write('proof.json.gz', proofs(inputs));
		const cpu = [];
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			if (group.end < 0) {
				cpu.push(null);
				continue;
			}
			assert.ok(Date.now() < deadline - 30000, 'CPU qualification budget');
			cpu.push([direct(group, 64), direct(group, 128)]);
			if (i % 12 === 0) run.progress('cpu', 'Independent binary64 N1 qualification', i, groups.length);
		}
		write('cpu.json.gz', cpu);
		const reference = JSON.parse(readRepository(referencePath).toString());
		write('external-reference-audit.json.gz', {
			identity: identity(referencePath),
			provenance: reference.provenance,
			dimensions: reference.dimensions,
			minimumElevationDegrees: Math.min(...reference.directions.map((d) => 90 - d.viewZenithDeg)),
			solarZenithDegrees: reference.conditions.map((c) => c.sunZenithDeg),
			requestedSolarZenithDegrees: (Math.acos(inputs[1].sourceDirection[2]) * 180) / Math.PI,
			matched: false,
			reason: 'Retained cube is the old 17-condition Toronto comparison, with minimum elevation 12.115 degrees, different Sun and limited wavelength basis. No San Jose horizon deck/output is present in this retained cube. No substitution or finite-source libRadtran claim.',
		});
		const profilePath = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profilePath);
		const chrome = checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'));
		browser = await puppeteer.launch({
			executablePath: chrome,
			headless: true,
			userDataDir: profilePath,
			protocolTimeout: Math.max(30000, deadline - Date.now() - 10000),
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
			Math.max(1000, deadline - Date.now() - 15000),
		);
		const page = await browser.newPage();
		let phase = 'pilot';
		await page.exposeFunction(
			'retainBatch',
			/** @param {HorizonReferenceBatch} row */ (row) => {
				batches.push(row);
				if (row.batch % 4 === 0)
					run.progress(phase, `${row.profile} batch ${row.batch + 1}, group ${row.group + 1}`);
			},
		);
		const pilotIndices = groups
			.map((g, i) => ({g, i}))
			.filter(
				({g}) =>
					(g.id === 'local-3-away' ||
						g.id === 'local-20-away' ||
						g.id === 'distant-3-away' ||
						g.id === 'distant-20-away') &&
					[2, 6, 9].includes(g.channel),
			)
			.map((x) => x.i);
		const pilotGroups = pilotIndices.map((i) => groups[i]);
		/** @type {HorizonReferenceProfile[]} */ const pilotProfiles = [
			{name: 'pilot64', batches: 16, quadrature: 64, roulette: 8, seed: 0},
			{name: 'pilot128', batches: 16, quadrature: 128, roulette: 8, seed: 0},
		];
		run.progress('pilot', 'Prospective fixed-band throughput and variance pilot');
		const pilotStart = Date.now();
		pilotTelemetry = await page.evaluate(executeGpu, shader, {
			groups: pilotGroups,
			profiles: pilotProfiles,
			paths: 1024,
			maximumMilliseconds: Math.min(180000, deadline - Date.now() - 60000),
		});
		const pilotBatches = batches.splice(0),
			pilotRows = summarize(pilotBatches, pilotGroups, 'pilot128');
		write('pilot.json.gz', {
			indices: pilotIndices,
			paths: 1024,
			profiles: pilotProfiles,
			telemetry: pilotTelemetry,
			rows: pilotRows,
			batches: pilotBatches,
		});
		const cost = (Date.now() - pilotStart) / (pilotGroups.length * 32 * 1024),
			available = Math.min(600000, deadline - Date.now() - 120000),
			targetPaths = 16384;
		const paths = Math.max(
			256,
			Math.min(targetPaths, Math.floor(available / (cost * groups.length * 16 * 2) / 256) * 256),
		);
		assert.ok(available > 30000 && paths >= 256, 'Pilot cannot admit bounded confirmation');
		/** @type {HorizonReferenceProfile[]} */ const profiles = [
			{name: 'confirmation', batches: 16, quadrature: 128, roulette: 8, seed: 1073741824},
		];
		const admission = {
			paths,
			batches: 16,
			groups: groups.length,
			costMillisecondsPerPath: cost,
			availableMilliseconds: available,
			estimatedMilliseconds: cost * groups.length * 16 * paths,
			profiles,
			seeds: 'Disjoint consecutive path states: 2^30 + group*2^22 + batch*paths; independent pilot states start at zero',
			precisionFromPilot: pilotRows.map((r) => ({
				id: r['id'],
				channel: r['channel'],
				predictedRelativeHalfWidth:
					(r['metrics'][0].halfWidth95 / Math.max(1e-20, r['metrics'][0].mean)) * Math.sqrt(1024 / paths),
			})),
			selection:
				'All 12 rays; all six away rays Native15; three heading/proximity controls; exact H19 P2 receivers. Counts fixed by throughput/variance, never observed color or reference agreement.',
		};
		write('confirmation-registration.json.gz', admission);
		phase = 'confirmation';
		run.progress(phase, 'Pilot admitted frozen confirmation', 0, groups.length * 16);
		confirmationTelemetry = await page.evaluate(executeGpu, shader, {
			groups,
			profiles,
			paths,
			maximumMilliseconds: Math.max(1000, deadline - Date.now() - 45000),
		});
		const confirmation = batches.splice(0);
		write('confirmation-batches.json.gz', confirmation);
		write('results.json.gz', {
			rows: summarize(confirmation, groups, 'confirmation'),
			telemetry: confirmationTelemetry,
		});
		phase = 'qualification';
		const checks = pilotGroups.filter((g) => g.channel === 6);
		checkTelemetry = await page.evaluate(executeGpu, shader, {
			groups: checks,
			profiles: [
				{name: 'seed-control', batches: 16, quadrature: 128, roulette: 8, seed: 2147483648},
				{name: 'roulette-control', batches: 16, quadrature: 128, roulette: 16, seed: 2147483648},
			],
			paths: Math.min(paths, 4096),
			maximumMilliseconds: Math.max(1000, deadline - Date.now() - 20000),
		});
		write('qualification-batches.json.gz', {
			groups: checks,
			paths: Math.min(paths, 4096),
			rows: batches.splice(0),
			telemetry: checkTelemetry,
		});
		for (const parent of parents) readRepository(parent.path, parent);
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
	write('partial-batches.json.gz', batches);
	const after = storage(),
		newBytes = after.retainedBytes - before.retainedBytes;
	assert.ok(newBytes < 16 * 1024 ** 2);
	run.cleanup();
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		elapsedMilliseconds: Date.now() - started,
		previousFailureMilliseconds: spent,
		gpuAttempts: browser ? 1 : 0,
		pilotTelemetry,
		confirmationTelemetry,
		checkTelemetry,
		newRetainedBytes: newBytes,
		failure: failure?.message ?? null,
		deadlineHit: Date.now() >= deadline,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	console.log(
		JSON.stringify({
			run: run.path,
			seal,
			state: failure ? 'failed' : 'accepted',
			milliseconds: Date.now() - started,
			failure: failure?.message,
		}),
	);
	if (failure) throw failure;
}
await main();
