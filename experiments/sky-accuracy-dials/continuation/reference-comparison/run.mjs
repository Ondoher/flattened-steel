import assert from 'node:assert/strict';
import {gzipSync, gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {
	createRun,
	identity,
	readRepository,
	outputRelative,
	sourceIdentities,
	sha256,
	verifyRun,
	checkedAbsolute,
	storage,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob, campaignUsage} from '../resources.mjs';
import {benchmarkRay} from '../../numerics/view.js';
import {spectra, balance, inRegion, summarize, proof} from './analysis.mjs';

const root = outputRelative + '/runs/',
	reference = 'references/results/experiments/b1-directional-sky-radiance/';
const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/';
const regions = ['all', 'near-sun', 'away-sun', 'away-low', 'away-middle', 'away-high'];
const channels = Array.from({length: 31}, (_, i) => i);

/** Authenticate retained data and evaluate only joins and scalar comparisons. */
function assess() {
	/** @type {DialFileIdentity[]} */ const parents = [];
	const read = (file, expected = undefined) => {
		const bytes = readRepository(file, expected);
		parents.push(identity(file, bytes));
		return bytes;
	};
	const inputSeal = verifyRun(root + '00000-inputs'),
		directSeal = verifyRun(root + '00230-direct-converge');
	assert.equal(directSeal.sha256, 'f7e9dca4f8efe52f4cb236124e8b7149c903ff877a7f061d42be62e5cd402acb');
	parents.push(inputSeal, directSeal);
	const terminal = JSON.parse(readRepository(inputSeal.path, inputSeal).toString());
	assert.equal(terminal.state, 'accepted');
	const input = (name) => {
		const id = terminal.artifacts.find((a) => a.path === root + '00000-inputs/' + name);
		assert.ok(id);
		return read(id.path, id);
	};
	const controls = JSON.parse(input('controls.json').toString()),
		controlSpectra = spectra(input('native48-gpu.tsv').toString(), true);
	const measuredBytes = read(
		reference + 'measurement-boundary.tsv',
		'a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74',
	);
	assert.equal(sha256(input('measurements.tsv')), sha256(measuredBytes));
	const measurements = spectra(measuredBytes.toString(), false);
	const models = spectra(
		read(
			reference + 'published-models.tsv',
			'4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4',
		).toString(),
		true,
	);
	const manifest = JSON.parse(
		read(
			'references/results/experiments/b1-b3-production-scores/gpu/000004-current-production-b1-b3-gpu-shaders/manifest.json',
		).toString(),
	);
	const provenance = JSON.parse(
		read(
			reference + 'gpu/algorithm32-paper-boundary-provenance.json',
			manifest.boundaries.find((x) => x.name === 'algorithm32Provenance').sha256,
		).toString(),
	);
	assert.equal(provenance.runId, manifest.runId);
	const published = spectra(
		read(
			reference + 'gpu/algorithm32-paper-proposed.tsv',
			manifest.boundaries.find((x) => x.name === 'algorithm32Spectra').sha256,
		).toString(),
		true,
	);
	assert.equal(provenance.cacheRepresentation, 'receiver-local-native48-z180-w27');
	assert.equal(provenance.physicalMeasurementBoundary.stage, 'post-transport-pre-color');
	const runtimeSourceAudit = provenance.runtimeSourceIdentity.sources.map((s) => {
		try {
			return {
				path: s.path,
				expected: s.sha256,
				current: sha256(readRepository(s.path)),
				matches: sha256(readRepository(s.path)) === s.sha256,
			};
		} catch {
			return {path: s.path, expected: s.sha256, current: null, matches: false};
		}
	});
	const directTerminal = JSON.parse(readRepository(directSeal.path, directSeal).toString());
	const directInput = (name) => {
		const id = directTerminal.artifacts.find((a) => a.path === root + '00230-direct-converge/' + name);
		assert.ok(id);
		return read(id.path, id);
	};
	const direct = JSON.parse(gunzipSync(directInput('results.json.gz')).toString()),
		inputs = JSON.parse(directInput('inputs.json').toString());
	assert.equal(direct.failure, null);
	assert.equal(direct.rows.length, 20);
	const spec = controls.native48.transportSpec,
		m = inputs.medium;
	assert.equal(spec.planet.bottomRadiusMeters / 1000, m.bottom);
	assert.equal(spec.planet.topRadiusMeters / 1000, m.top);
	assert.equal(spec.atmosphere.rayleighScaleHeightMeters / 1000, m.rayleighHeight);
	assert.equal(spec.atmosphere.mieScaleHeightMeters / 1000, m.mieHeight);
	assert.equal(spec.atmosphere.mieSingleScatteringAlbedo, m.albedo);
	assert.equal(spec.atmosphere.miePhaseFunctionG, m.g);
	assert.equal(spec.atmosphere.ozone.absorptionEnabled, false);
	for (let c = 0; c < inputs.channels.length; c++) {
		const s = spec.domains.spectrum.channels[inputs.channels[c]];
		assert.equal(s.rayleighScatteringPerMeter * 1000, m.rayleigh[c]);
		assert.equal(s.mieExtinctionPerMeter * 1000, m.mie[c]);
		assert.equal(s.sourceIrradianceDensityWattsPerSquareMeterPerNanometer, m.sun[c]);
		assert.equal(s.groundAlbedo, m.ground[c]);
	}
	assert.equal(measurements.size, 17 * 81);
	assert.equal(controlSpectra.size, 17 * 81);
	assert.equal(published.size, 17 * 81);
	assert.equal(models.size, 9 * 17 * 81);
	/** @type {SkyReferenceRow[]} */ const rows = [];
	for (const scene of controls.scenes) {
		assert.equal(
			provenance.profiles.find((p) => p.time === scene.time).fittedAzimuthDegrees,
			scene.fittedAzimuthDegrees,
		);
		for (let x = 0; x < 9; x++)
			for (let y = 0; y < 9; y++) {
				const key = `${scene.time}|${x}|${y}`,
					ray = benchmarkRay(spec, scene, x, y);
				const up = ray.origin.map((v) => v / spec.planet.bottomRadiusMeters),
					elevation =
						(Math.asin(
							Math.min(
								1,
								Math.max(
									-1,
									up.reduce((s, v, i) => s + v * ray.direction[i], 0),
								),
							),
						) *
							180) /
						Math.PI;
				const separation = (Math.acos(Math.min(1, Math.max(-1, ray.direction[2]))) * 180) / Math.PI;
				const modelRows = {
					control: controlSpectra.get('proposed|' + key),
					published: published.get('proposed|' + key),
					bruneton: models.get('bruneton|' + key),
					libradtran: models.get('libradtran|' + key),
				};
				assert.deepEqual(modelRows.bruneton, models.get('elek|' + key));
				assert.ok(Object.values(modelRows).every(Boolean) && measurements.has(key));
				rows.push({
					time: scene.time,
					x,
					y,
					elevation,
					separation,
					measured: measurements.get(key),
					models: modelRows,
				});
			}
	}
	const selected = direct.rows.map((d) => {
		const [, clock, x, y] = d.ray.split('-'),
			time = clock.slice(0, 2) + ':' + clock.slice(2),
			r = rows.find((r) => r.time === time && r.x === Number(x) && r.y === Number(y));
		assert.ok(r);
		const inputRay = inputs.rays.find((r) => r.id === d.ray),
			geometry = benchmarkRay(
				spec,
				controls.scenes.find((s) => s.time === time),
				r.x,
				r.y,
			);
		for (let i = 0; i < 3; i++) {
			assert.ok(Math.abs(inputRay.origin[i] - geometry.origin[i] / 1000) < 1e-9);
			assert.ok(Math.abs(inputRay.direction[i] - geometry.direction[i]) < 1e-14);
		}
		assert.ok(Math.abs(r.measured[d.channel] - d.measured) < 1e-14);
		return {
			ray: d.ray,
			channel: d.channel,
			wavelength: 360 + 11.75 * d.channel,
			elevation: r.elevation,
			separation: r.separation,
			nearSun: r.separation < 20,
			measured: d.measured,
			direct: d.total.mean,
			halfWidth95: d.total.halfWidth95,
			models: Object.fromEntries(Object.entries(r.models).map(([name, values]) => [name, values[d.channel]])),
			balances: {
				control: balance(r.models.control[d.channel], d.total.mean, d.measured, d.total.halfWidth95),
				published: balance(r.models.published[d.channel], d.total.mean, d.measured, d.total.halfWidth95),
			},
		};
	});
	const spatial = regions.map((region) => ({
		region,
		summary: summarize(
			rows.filter((r) => inRegion(r, region)),
			channels,
		),
	}));
	assert.ok(
		Math.abs(spatial[0].summary.models.bruneton.rmseMw - 11.28323859) < 1e-7,
		'Retained Bruneton aggregate reproduction',
	);
	assert.ok(
		Math.abs(spatial[0].summary.models.libradtran.rmseMw - 11.48054694) < 1e-7,
		'Retained libRadtran aggregate reproduction',
	);
	const perTime = controls.scenes.map((scene) => ({
		time: scene.time,
		summary: summarize(
			rows.filter((r) => r.time === scene.time && inRegion(r, 'away-sun')),
			channels,
		),
	}));
	const bands = [
		{name: 'blue', channels: channels.filter((c) => 360 + 11.75 * c < 500)},
		{name: 'middle', channels: channels.filter((c) => 360 + 11.75 * c >= 500 && 360 + 11.75 * c < 600)},
		{name: 'red', channels: channels.filter((c) => 360 + 11.75 * c >= 600)},
	].map((b) => ({
		band: b.name,
		summary: summarize(
			rows.filter((r) => inRegion(r, 'away-sun')),
			b.channels,
		),
	}));
	const selectedSummaries = ['all', 'near-sun', 'away-sun'].map((region) => {
		const chosen = selected.filter((r) => inRegion({...r, time: '', x: 0, y: 0, models: {}, measured: []}, region));
		return {
			region,
			count: chosen.length,
			rmseMw: Object.fromEntries(
				['direct', 'control', 'published', 'bruneton', 'libradtran'].map((name) => [
					name,
					1000 *
						Math.sqrt(
							chosen.reduce(
								(s, r) => s + ((name === 'direct' ? r.direct : r.models[name]) - r.measured) ** 2,
								0,
							) / chosen.length,
						),
				]),
			),
			balance: Object.fromEntries(
				['control', 'published'].map((name) => [
					name,
					{
						robustOpposition: chosen.filter((r) => r.balances[name].robustOpposition).length,
						robustBenefit: chosen.filter((r) => r.balances[name].robustBenefit).length,
						robustHarm: chosen.filter((r) => r.balances[name].robustHarm).length,
						crossTermMwSquared: 1e6 * chosen.reduce((s, r) => s + r.balances[name].crossTerm, 0),
						approximationSquaredMw: 1e6 * chosen.reduce((s, r) => s + r.balances[name].numerical ** 2, 0),
						benefitMwSquared: 1e6 * chosen.reduce((s, r) => s + r.balances[name].benefit, 0),
					},
				]),
			),
		};
	});
	// Compact per-direction residuals allow spatial inspection without retaining duplicate spectra.
	const directional = rows.map((r) => ({
		time: r.time,
		x: r.x,
		y: r.y,
		elevation: r.elevation,
		separation: r.separation,
		summary: summarize([r], channels),
	}));
	return {
		parents,
		spatial,
		perTime,
		bands,
		selected,
		selectedSummaries,
		directional,
		runtimeSourceAudit,
		baselineIdentity: {
			control: '00000-inputs/native48-gpu.tsv',
			published: provenance.runId,
			publishedNumericalControls: provenance.numericalControls,
			sourceMatches: runtimeSourceAudit.filter((s) => s.matches).length,
			sourceCount: runtimeSourceAudit.length,
			currentTreeEquivalent: false,
		},
		checks: {
			tableRows: rows.length,
			selectedScalars: selected.length,
			physicalAndGeometry: true,
			elekEqualsBruneton: true,
		},
	};
}

async function main() {
	const checks = proof();
	if (process.argv[2] === 'proof') {
		console.log(JSON.stringify({checks}));
		return;
	}
	assert.ok(['preflight', 'execute'].includes(process.argv[2]));
	if (process.argv[2] === 'preflight') {
		const a = assess();
		console.log(
			JSON.stringify({checks, compatibility: a.checks, baseline: a.baselineIdentity, parents: a.parents}),
		);
		return;
	}
	const started = Date.now(),
		registration = readRegistration(root + '00099-c0-registration');
	const admission = admitJob(registration, 'cpu', 'component', 768 * 1024, 'C6');
	const maximumJobMilliseconds = Math.min(10 * 60000, admission.timeoutMilliseconds);
	const plan = identity(topic + 'reference-comparison-plan.md'),
		base = identity(root + '00226-remain-observe/sources.json.gz'),
		sources = sourceIdentities();
	const analysis = assess();
	assert.ok(Date.now() - started < maximumJobMilliseconds - 30000);
	const nodeBytes = readFileSync(checkedAbsolute(process.execPath));
	const parents = [
		registration.seal,
		plan,
		base,
		...analysis.parents,
		...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Matched retained-data regional spectral comparisons and uncertainty-aware baseline/direct/Kider signed-error decomposition; no new transport integration.',
		parameters: {
			caseId: 'reference-comparison-v1',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C6',
			allocatedBytes: 768 * 1024,
			maximumJobMilliseconds,
			nearSunDegrees: 20,
			elevationBoundaries: [20, 60],
			channels,
			signFloorW: 1e-5,
			node: {
				path: process.execPath,
				version: process.version,
				byteLength: nodeBytes.length,
				sha256: sha256(nodeBytes),
			},
			gpuJobs: 0,
			newRadianceIntegrations: 0,
		},
	};
	const run = createRun('reference-match', recipe),
		definition = identity(run.path + '/definition.json');
	console.log(JSON.stringify({run: run.path}));
	const write = (name, value) =>
		run.write(name, value, {
			parents: [definition],
			operation:
				'Retain exact plan/source identities or deterministic matched comparison under the frozen recipe.',
		});
	let failure = null;
	try {
		write('plan.md', readRepository(plan.path, plan));
		const old = JSON.parse(gunzipSync(readRepository(base.path, base)).toString());
		for (const s of old) assert.equal(sha256(Buffer.from(s.base64, 'base64')), s.sha256);
		write(
			'sources-delta.json.gz',
			gzipSync(
				Buffer.from(
					JSON.stringify({
						base,
						currentSources: sources,
						changed: sources
							.filter((s) => !old.some((o) => o.path === s.path && o.sha256 === s.sha256))
							.map((s) => ({...s, base64: readRepository(s.path, s).toString('base64')})),
					}),
				),
				{level: 9},
			),
		);
		write('proof.json', {checks, ...analysis.checks});
		write('analysis.json.gz', gzipSync(Buffer.from(JSON.stringify(analysis)), {level: 9}));
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		assert.ok(Date.now() - started < maximumJobMilliseconds);
		run.progress(
			'complete',
			'All matched tables, physical controls, geometry and signed-error identities verified.',
		);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup(),
		seal = run.finish(failure ? 'failed' : 'accepted', {
			caseId: 'reference-comparison-v1',
			jobElapsedMilliseconds: Date.now() - started,
			checks,
			failure: failure?.message ?? null,
			cleanup,
		});
	assert.deepEqual(verifyRun(run.path), seal);
	const usage = campaignUsage(registration);
	console.log(
		JSON.stringify({
			seal,
			failure: failure?.message,
			retainedBytes: storage().retainedBytes,
			retainedC6: usage.retainedBytesByPhase.C6,
			remainingC6:
				usage.effectivePhaseAllocations.find((a) => a.phase === 'C6').retainedBytes -
				usage.retainedBytesByPhase.C6,
			spatial: analysis.spatial,
			selected: analysis.selectedSummaries,
		}),
	);
	if (failure) throw failure;
}
await main();
