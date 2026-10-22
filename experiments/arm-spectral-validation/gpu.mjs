import assert from 'node:assert/strict';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Files from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import Generator from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerator.js';
import Reader from '../../scripts/algorithm32/solar-zenith-cache/DistantSunPointLocalCacheReader.js';
import View from '../../scripts/algorithm32/solar-zenith-cache/DistantSunBrunetonView.js';
import {DistantSunSceneCacheCompilerInputs as Inputs} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics as Numerics} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';
import {DistantSunSolarInterpolation as Solar} from '../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';

const repository = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const root = path.resolve(repository, process.argv[2]);
const output = path.resolve(repository, 'tmp/experiments/arm-spectral-validation/runs');
assert.equal(path.dirname(root), output);
assert.match(path.basename(root), /^\d{5}-[a-z0-9-]{1,16}$/);
/** Require a contained path and reject links/junctions along every existing ancestor. */
async function checked(target) {
	assert.ok(target === root || target.startsWith(root + path.sep));
	let at = target;
	while (at.length >= repository.length) {
		const info = await lstat(at).catch((error) => {
			if (error.code === 'ENOENT') return null;
			throw error;
		});
		if (info) {
			assert.ok(!info.isSymbolicLink());
			assert.equal((await realpath(at)).toLowerCase(), at.toLowerCase());
		}
		at = path.dirname(at);
	}
	return target;
}
await checked(root);
const files = new Files(repository);
/** Adapt only the output boundary; every numerical compiler method remains production-owned. */
class LaneGenerator extends Generator {
	/** Allocate an exclusive compiler child below this currently open experiment run. */
	async _createRun(_files, relative) {
		const target = await checked(path.resolve(repository, relative));
		assert.equal(path.dirname(target), root);
		await mkdir(target);
		return relative;
	}
}
/** Retain only fresh artifacts; the Python owner seals this run after this process exits. */
async function save(name, value) {
	await writeFile(await checked(path.join(root, name)), JSON.stringify(value) + '\n', {flag: 'wx'});
}
/** Emit progress to the owner, whose flushed journal has a25second heartbeat. */
function progress(value) {
	process.stdout.write(JSON.stringify(value) + '\n');
}
const contract = /** @type {ArmPhysicalContract} */ (
	JSON.parse(await readFile(path.join(root, 'contract.json'), 'utf8'))
);
const sceneBase = Inputs.createQualifiedSanJoseNauticalScene();
const refinement = process.argv.includes('--refine');
const convergence = process.argv.includes('--converge');
const colorExtension = process.argv.includes('--color-extension');
const requestBase = Inputs.createInputSet(sceneBase, {
	scatteringAccuracy: 'corrected60-sun035',
	solarInterpolation: 'monotone-cubic',
	numericalPolicy: Numerics.createAnchoredRadial(),
}).buildRequest;
const abort = new AbortController();
process.once('SIGINT', () => abort.abort());
process.once('SIGTERM', () => abort.abort());
const summaries = [];
for (const variant of colorExtension
	? ['corrected']
	: convergence
		? ['source80', 'source160', 'native51-source160']
		: refinement
			? ['source40', 'native51']
			: ['corrected', 'legacy']) {
	const base = (
		variant.startsWith('native51')
			? Inputs.createInputSet(sceneBase, {
					scatteringAccuracy: 'corrected60-sun035',
					solarInterpolation: 'monotone-cubic',
					numericalPolicy: Numerics.createAnchoredRadial(),
					positionDomain: 'native51-near-ground',
				}).buildRequest
			: requestBase
	).transportSpec;
	const sourceIntervals = Number(variant.match(/source(\d+)$/)?.[1] ?? 20);
	const p = contract.profiles;
	const channels = contract.channels.map((c, index) => ({
		id: `arm-band-${index}`,
		centerNanometers: c.wavelengthNanometers,
		binWidthNanometers: 4,
		sourceIrradianceDensityWattsPerSquareMeterPerNanometer: c.sourceIrradianceWattsPerSquareMeterPerNanometer,
		rayleighScatteringPerMeter: c.rayleighScatteringPerMeter,
		mieExtinctionPerMeter: c.mieExtinctionPerMeter,
		groundAlbedo: c.groundAlbedo,
		mieSingleScatteringAlbedo: c.mieSingleScatteringAlbedo,
		miePhaseTable: c.miePhaseTable,
	}));
	const {scatteringAccuracy: _unused, ...legacyNumerical} = base.numerical;
	const request = /** @type {DistantSunSceneCacheCompilerBuildRequest} */ ({
		...requestBase,
		transportSpec: {
			...base,
			id: 'arm-sgp-20230822-projected-v1',
			shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'},
			atmosphere: {
				...base.atmosphere,
				id: 'arm-sgp-conditional-exponential-v1',
				rayleighScaleHeightMeters: p.rayleighScaleHeightMeters,
				mieScaleHeightMeters: p.mieScaleHeightMeters,
				ozone: {
					...base.atmosphere.ozone,
					id: 'arm-ancillary-column-triangular-ozone-v1',
					absorptionEnabled: true,
					dobsonUnits: p.ozoneDobsonUnits,
					maximumDensityPerCubicMeter: p.ozoneMaximumDensityPerCubicMeter,
					crossSectionTable: {
						minimumNanometers: 360,
						maximumNanometers: 830,
						spacingNanometers: 10,
						units: 'm^2',
						values: p.ozoneCrossSectionTable,
					},
				},
			},
			domains: {
				...base.domains,
				spectrum: {
					id: contract.spectrumId ?? 'arm-nine-continuum-bands-v1',
					contentHash: `sha256:${files.hash(JSON.stringify(channels))}`,
					channels,
				},
			},
			source: {
				...base.source,
				spectralIrradianceDensity: channels.map(
					(c) => c.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
				),
			},
			numerical:
				variant === 'legacy'
					? {...legacyNumerical, transportIntervalCount: 15}
					: {...base.numerical, sourcePathTransmittanceIntervalCount: sourceIntervals},
		},
	});
	const spec = request.transportSpec;
	const selectedCases = variant === 'corrected' ? contract.cases : contract.cases.slice(0, 1);
	const scenes = selectedCases.map((c) => ({
		id: c.id,
		zenithDegrees: c.solarZenithGeometricDegrees,
		observerAltitudeMeters: 0,
	}));
	const relative = path.relative(repository, path.join(root, variant)).split(path.sep).join('/');
	const started = performance.now();
	const wavelengths =
		refinement || convergence
			? [4]
			: channels
					.map((_c, i) => i)
					.filter(
						(i) =>
							!colorExtension ||
							!contract.reuseWavelengthNanometers.includes(channels[i].centerNanometers),
					);
	const result = await new LaneGenerator({
		chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compile({
		outputDirectory: relative,
		buildRequest: request,
		scenes,
		wavelengths,
		signal: abort.signal,
		onProgress: (event) => progress({variant, ...event}),
	});
	const packet = JSON.parse((await files.read(result.manifest.path, result.manifest)).toString('utf8'));
	const reader = new Reader();
	await reader.prepareStaging(files, packet, `${relative}/staging`);
	const view = new View();
	const indexes = new Map(packet.coordinates.map((coordinate, index) => [coordinate.join(':'), index]));
	const outputs = [];
	for (const [ordinal, c] of wavelengths.entries()) {
		const bytes = await reader.readChannel(files, packet, ordinal);
		const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
		for (const scene of scenes)
			for (const intervals of [240, 480]) {
				const theta = (scene.zenithDegrees * Math.PI) / 180;
				const up = [Math.sin(theta), 0, Math.cos(theta)];
				let radiance = 0,
					transmittance = 1;
				for (let i = 0; i < intervals; i++) {
					const a = 60000 * (i / intervals) ** 2,
						b = 60000 * ((i + 1) / intervals) ** 2,
						h = (a + b) / 2,
						step = b - a;
					const point = up.map((v) => v * (spec.planet.bottomRadiusMeters + h));
					const stencil = view._cubic(spec, packet, indexes, point, up);
					const density = stencil.reduce((sum, altitude) => {
						const sample = (taps) => taps?.reduce((v, t) => v + t.weight * values[t.index], 0);
						return (
							sum +
							altitude.weight *
								Solar.sample(
									sample(altitude.previous),
									sample(altitude.lower),
									sample(altitude.upper),
									sample(altitude.next),
									altitude.fraction,
								)
						);
					}, 0);
					const extinction =
						channels[c].rayleighScatteringPerMeter * Math.exp(-h / p.rayleighScaleHeightMeters) +
						channels[c].mieExtinctionPerMeter * Math.exp(-h / p.mieScaleHeightMeters) +
						contract.channels[c].ozoneCrossSectionSquareMeters *
							p.ozoneMaximumDensityPerCubicMeter *
							Math.max(0, 1 - Math.abs(h - 25000) / 15000);
					const half = Math.exp(-0.5 * extinction * step);
					transmittance *= half;
					radiance += transmittance * density * step;
					transmittance *= half;
				}
				assert.ok(Number.isFinite(radiance) && radiance >= 0);
				outputs.push({
					case: scene.id,
					wavelengthNanometers: channels[c].centerNanometers,
					intervals,
					radianceMilliwatts: 1000 * radiance,
				});
			}
		progress({phase: 'channel-probed', variant, completed: ordinal + 1, total: wavelengths.length});
	}
	const summary = {
		variant,
		request,
		scenes,
		outputs,
		compilation: result,
		totalWallMilliseconds: performance.now() - started,
		lookup: 'Actual production N4 shared cache, Reader and W27/SZA monotone-cubic reconstruction; zenith midpoint path quadrature with declared ozone extinction;240/480 interval convergence',
		control:
			'Legacy15/ordinary outgoing is a matched-input control; not the byte-identical deployed default-atmosphere asset',
	};
	summaries.push(summary);
	await save(`${variant}-spectra.json`, summary);
}
await save('result.json', {
	summaries,
	accuracyQualified: false,
	scope: 'Production compiler/lookup conditional ARM atmosphere; no runtime or deployment changes',
});
