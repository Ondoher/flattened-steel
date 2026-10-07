import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {benchmarkRay} from '../../numerics/view.js';
import {spectra} from '../reference-comparison/analysis.mjs';
import {alternateAuthorization} from './alternate-authorization.mjs';

/** Select diagnostic rays using only the prospectively fixed retained-data ranks.
 * @returns {{medium: SkyDirectMedium, rays: SkyAlternateRay[], channels: number[], parents: DialFileIdentity[]}}
 */
export function alternateInputs() {
	const {through} = alternateAuthorization();
	const prior = JSON.parse(readRepository(through.path, through).toString());
	/** @type {DialFileIdentity[]} */ const parents = [];
	/** @param {string} suffix */
	const read = (suffix) => {
		const candidates = prior.recipe.parents.filter((p) => p.path.endsWith(suffix));
		assert.equal(candidates.length, 1);
		const id = candidates[0];
		parents.push(id);
		return readRepository(id.path, id).toString();
	};
	const controls = JSON.parse(read('/00000-inputs/controls.json'));
	const baseline = spectra(read('/00000-inputs/native48-gpu.tsv'), true);
	const measurement = spectra(read('/measurement-boundary.tsv'), false);
	const published = spectra(read('/published-models.tsv'), true);
	const capture = spectra(read('/gpu/algorithm32-paper-proposed.tsv'), true);
	const spec = controls.native48.transportSpec,
		atmosphere = spec.atmosphere;
	const channels = [0, 8, 16, 24, 30],
		spectral = channels.map((c) => spec.domains.spectrum.channels[c]);
	assert.equal(atmosphere.ozone.absorptionEnabled, false);
	const medium = {
		bottom: spec.planet.bottomRadiusMeters / 1000,
		top: spec.planet.topRadiusMeters / 1000,
		rayleighHeight: atmosphere.rayleighScaleHeightMeters / 1000,
		mieHeight: atmosphere.mieScaleHeightMeters / 1000,
		albedo: atmosphere.mieSingleScatteringAlbedo,
		g: atmosphere.miePhaseFunctionG,
		rayleigh: spectral.map((s) => s.rayleighScatteringPerMeter * 1000),
		mie: spectral.map((s) => s.mieExtinctionPerMeter * 1000),
		sun: spectral.map((s) => s.sourceIrradianceDensityWattsPerSquareMeterPerNanometer),
		ground: spectral.map((s) => s.groundAlbedo),
	};
	/** @type {SkyAlternateRay[]} */ const rays = [];
	for (const time of ['09:30', '13:30']) {
		const scene = controls.scenes.find((s) => s.time === time);
		assert.ok(scene);
		const candidates = [];
		for (let x = 0; x < 9; x++)
			for (let y = 0; y < 9; y++) {
				const key = `${time}|${x}|${y}`,
					geom = benchmarkRay(spec, scene, x, y);
				const elevation =
					(Math.asin(
						Math.max(
							-1,
							Math.min(
								1,
								geom.origin.reduce((s, v, i) => s + v * geom.direction[i], 0) /
									spec.planet.bottomRadiusMeters,
							),
						),
					) *
						180) /
					Math.PI;
				const separation = (Math.acos(Math.max(-1, Math.min(1, geom.direction[2]))) * 180) / Math.PI;
				if (separation < 30) continue;
				const measured = measurement.get(key),
					control = baseline.get('proposed|' + key),
					bruneton = published.get('bruneton|' + key),
					libradtran = published.get('libradtran|' + key),
					production = capture.get('proposed|' + key);
				assert.ok(measured && control && bruneton && libradtran && production);
				const errors = measured
					.slice(0, 31)
					.map((m, c) => [(control[c] - m) ** 2, (bruneton[c] - m) ** 2, (libradtran[c] - m) ** 2]);
				candidates.push({
					x,
					y,
					elevation,
					separation,
					origin: geom.origin.map((v) => v / 1000),
					direction: [...geom.direction],
					measured,
					models: {control, production, bruneton, libradtran},
					errors,
				});
			}
		for (const role of ['high-gap', 'low-gain', 'control']) {
			const eligible = candidates.filter((r) =>
				role === 'high-gap'
					? r.elevation >= 60
					: role === 'low-gain'
						? r.elevation < 20
						: r.elevation >= 20 && r.elevation < 60,
			);
			const ranked = eligible
				.map((r) => ({
					...r,
					rank:
						role === 'high-gap'
							? r.errors.slice(16, 31).reduce((s, e) => s + e[0] - (e[1] + e[2]) / 2, 0) / 15
							: role === 'low-gain'
								? r.errors.slice(0, 12).reduce((s, e) => s + (e[1] + e[2]) / 2 - e[0], 0) / 12
								: -r.errors.reduce((s, e) => s + (e[0] + e[1] + e[2]) / 3, 0) / 31,
				}))
				.sort((a, b) => b.rank - a.rank || a.x - b.x || a.y - b.y);
			assert.ok(ranked.length);
			const r = ranked[0];
			if (role !== 'control') assert.ok(r.rank > 0);
			rays.push({
				id: `${time.replace(':', '')}-${role}-${r.x}-${r.y}`,
				time,
				role,
				x: r.x,
				y: r.y,
				elevation: r.elevation,
				separation: r.separation,
				rank: r.rank,
				candidates: ranked.length,
				origin: r.origin,
				direction: r.direction,
				measured: channels.map((c) => r.measured[c]),
				models: Object.fromEntries(
					Object.entries(r.models).map(([name, values]) => [name, channels.map((c) => values[c])]),
				),
			});
		}
	}
	assert.equal(new Set(rays.map((r) => `${r.time}|${r.x}|${r.y}`)).size, 6);
	return {medium, rays, channels, parents};
}
