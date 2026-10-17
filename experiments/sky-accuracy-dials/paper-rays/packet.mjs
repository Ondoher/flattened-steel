import assert from 'node:assert/strict';
import {readRepository, verifyRun, identity} from '../io/files.mjs';
import {basePath, jointPath, loadCase, measurements} from '../paper-b1/diagnosis-data.mjs';
import {benchmarkRay} from '../numerics/view.js';
import {dot, unit} from '../numerics/math.js';
import {parseBoundaryTsv} from '../analysis/boundary.mjs';

/** Freeze the preselected adverse/control rays and rotate only their physical frame.
 * @returns {PaperRayPacket} No cached evaluator enters a reference medium.
 */
export function packet() {
	const base = loadCase(basePath),
		joint = loadCase(jointPath),
		selection = 'tmp/experiments/sky-accuracy-dials/runs/00351-h56-factorial';
	const parents = [base.seal, joint.seal, verifyRun(selection), identity(selection + '/cells-Normalized60.json')];
	const cells = JSON.parse(readRepository(selection + '/cells-Normalized60.json', parents.at(-1)).toString()),
		low = cells.filter((r) => r.elevation < 20),
		a = low.reduce((p, r) => (r.deltaSSE > p.deltaSSE ? r : p)),
		b = low.filter((r) => r.time === a.time).reduce((p, r) => (r.deltaSSE < p.deltaSSE ? r : p)),
		c = cells.reduce((p, r) => (r.deltaSSE > p.deltaSSE ? r : p));
	const worst = process.argv.includes('--worst-lib');
	const measured = measurements();
	const publishedPath = 'references/results/experiments/b1-directional-sky-radiance/published-models.tsv';
	const published = identity(publishedPath);
	assert.equal(published.sha256, '4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4');
	const target = parseBoundaryTsv(readRepository(publishedPath, published).toString(), {
		modelId: 'libradtran',
		configId: 'retained-libradtran',
		sourceIdentity: published,
	});
	parents.push(measured.sourceIdentity, published);
	const ranking = cells
		.map((r) => {
			const index = r.t * 81 + r.x * 9 + r.y;
			const sse = (input, reference) =>
				input.channels.slice(0, 31).reduce((s, ch, c) => {
					const d = ch.values[3 * 1386 + index] - reference.values[(r.t * 81 + r.ray) * 40 + c];
					return s + d * d;
				}, 0);
			assert.ok(Math.abs(sse(base, measured) - r.baselineSSE) < 1e-12);
			assert.ok(Math.abs(sse(joint, measured) - r.candidateSSE) < 1e-12);
			const baselineSSE = sse(base, target),
				candidateSSE = sse(joint, target);
			return {
				time: r.time,
				t: r.t,
				ray: r.ray,
				x: r.x,
				y: r.y,
				elevation: r.elevation,
				separation: r.separation,
				baselineSSE,
				candidateSSE,
				baselineRmse: 1000 * Math.sqrt(baselineSSE / 31),
				correctedRmse: 1000 * Math.sqrt(candidateSSE / 31),
			};
		})
		.sort((a, b) => b.candidateSSE - a.candidateSSE || a.t - b.t || a.ray - b.ray);
	const selected = worst ? ranking.slice(0, 3) : [a, b, c];
	assert.deepEqual(
		selected.map((r) => [r.t, r.x, r.y]),
		worst
			? [
					[0, 4, 7],
					[1, 4, 7],
					[6, 3, 6],
				]
			: [
					[16, 0, 4],
					[16, 8, 4],
					[6, 3, 6],
				],
	);
	const spec = base.control.buildRequest.transportSpec,
		centers = spec.domains.spectrum.channels.map((c) => c.centerNanometers),
		grass = spec.domains.spectrum.channels.map((c) => c.groundAlbedo);
	assert.equal(centers.length, 40);
	assert.equal(spec.planet.bottomRadiusMeters, 6360000);
	assert.equal(spec.planet.topRadiusMeters, 6420000);
	assert.equal(spec.atmosphere.mieSingleScatteringAlbedo, 0.8);
	assert.equal(spec.atmosphere.miePhaseFunctionG, 0.7);
	const rays = selected.map((r, i) => {
		const scene = base.control.scenes[r.t],
			old = benchmarkRay(spec, scene, r.x, r.y),
			theta = (scene.zenithDegrees * Math.PI) / 180,
			e = (r.elevation * Math.PI) / 180;
		const heading = Math.acos(
			Math.max(
				-1,
				Math.min(
					1,
					(Math.cos((r.separation * Math.PI) / 180) - Math.sin(e) * Math.cos(theta)) /
						(Math.cos(e) * Math.sin(theta)),
				),
			),
		);
		const direction = [Math.cos(e) * Math.cos(heading), Math.cos(e) * Math.sin(heading), Math.sin(e)],
			origin = [0, 0, spec.planet.bottomRadiusMeters],
			sourceDirection = [Math.sin(theta), 0, Math.cos(theta)];
		assert.ok(Math.abs(dot(direction, sourceDirection) - old.direction[2]) < 2e-12);
		assert.ok(Math.abs(direction[2] - dot(unit(old.origin), old.direction)) < 2e-12);
		/** @type {HorizonReferenceMedium} */ const medium = {
			geometry: 'spherical',
			sourceKind: 'parallel',
			radius: spec.planet.bottomRadiusMeters,
			topAltitude: spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters,
			sourcePosition: [0, 0, 1e12],
			sourceDirection,
			referenceDistance: 1,
			incidentScale: 1,
			rayleighHeight: spec.atmosphere.rayleighScaleHeightMeters,
			mieHeight: spec.atmosphere.mieScaleHeightMeters,
			albedo: spec.atmosphere.mieSingleScatteringAlbedo,
			g: spec.atmosphere.miePhaseFunctionG,
			rayleigh: spec.domains.spectrum.channels.map((c) => c.rayleighScatteringPerMeter),
			mie: spec.domains.spectrum.channels.map((c) => c.mieExtinctionPerMeter),
			sourceIrradiance: spec.domains.spectrum.channels.map(
				(c) => c.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
			),
		};
		return {
			id: (worst
				? ['rmse-rank1', 'rmse-rank2', 'near-sun-deficit']
				: ['low-regression', 'low-improvement', 'near-sun-deficit'])[i],
			time: r.time,
			t: r.t,
			x: r.x,
			y: r.y,
			ray: r.ray,
			elevation: r.elevation,
			separation: r.separation,
			heading: (heading * 180) / Math.PI,
			medium,
			origin,
			direction,
			end: old.length,
		};
	});
	return {parents, centers, grass, rays, lux: 0, base, joint, campaign: worst ? 'h58' : 'h57', ranking, target};
}

/** Authenticate an exactly matching H57 third ray before reusing its solved data.
 * @param {PaperRayPacket} p @param {string} root @returns {DialFileIdentity}
 */
export function reuseThird(p, root) {
	assert.equal(p.campaign, 'h58');
	const source = 'tmp/experiments/sky-accuracy-dials/runs/00355-h57-independent';
	const seal = verifyRun(source);
	const old = JSON.parse(readRepository(source + '/packet.json').toString());
	assert.deepEqual(old.centers, p.centers);
	assert.deepEqual(old.grass, p.grass);
	assert.deepEqual(old.rays[2], p.rays[2]);
	p.parents.push(seal);
	const parent = verifyRun(root);
	p.parents.push(parent);
	return parent;
}
