import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFlat32Atmosphere} from '../../src/flat32/Flat32Atmosphere.js';
import {
	NATIVE_15_SPECTRAL_BASIS as basis,
	NATIVE_SOURCE_IRRADIANCE_DENSITY as solar,
} from '../../src/algorithm32/profiles/native-15/native-15-profile.js';
import {directBundle} from '../sky-accuracy-dials/distant-horizon/toronto-direct.mjs';
import {checked} from './io.mjs';

export const channels = basis.channels;
export const capturePath = '.codex-tmp/flat32-elevation-10km/live-scenes-03/globe-noon10km-horizon.json';

/** Export executable production physics, without substituting libRadtran defaults. */
export function physical() {
	const atmosphere = createFlat32Atmosphere(),
		constants = atmosphere.constants;
	const capture = JSON.parse(readFileSync(checked(capturePath), 'utf8'));
	assert.deepEqual(capture.medium, constants);
	const zenith = (Number(capture.dataset.flat32SolarZenithDegrees) * Math.PI) / 180;
	return {
		geometry: 'spherical',
		sourceKind: 'parallel',
		radius: constants.bottomRadius.value,
		topAltitude: constants.topRadius.value - constants.bottomRadius.value,
		rayleighHeight: constants.rayleighScaleHeight.value,
		mieHeight: constants.mieScaleHeight.value,
		rayleigh: [...atmosphere.seaLevelRayleighScattering.values],
		mie: [...atmosphere.seaLevelMieExtinction.values],
		albedo: constants.mieSingleScatteringAlbedo,
		g: constants.miePhaseFunctionG,
		sourceDirection: [0, -Math.sin(zenith), Math.cos(zenith)],
		sourceIrradiance: [...solar.values],
		incidentScale: 1,
		observerAltitude: 10000,
		zenithDegrees: (zenith * 180) / Math.PI,
		constants,
		capture,
	};
}

/** Exact spherical boundary and finite endpoint for one anti-solar viewing elevation. */
export function ray(elevation, altitude = 10000, radius = 6360000, top = 60000) {
	const a = (elevation * Math.PI) / 180,
		r = radius + altitude,
		projection = r * Math.sin(a);
	const discriminant = projection * projection - (r - radius) * (r + radius);
	const ground = projection < 0 && discriminant >= 0;
	const length = ground
		? -projection - Math.sqrt(discriminant)
		: -projection + Math.sqrt(projection * projection - (r - radius - top) * (r + radius + top));
	return {elevation, direction: [0, Math.cos(a), Math.sin(a)], ground, length, observerAltitude: altitude};
}

/** Independent midpoint optical-depth integral on the analytic finite segment. */
export function directTransmission(medium, view, intervals = 32768) {
	const column = [0, 0],
		origin = medium.radius + view.observerAltitude;
	for (let i = 0; i < intervals; i++) {
		const t = (view.length * (i + 0.5)) / intervals;
		const h = Math.max(0, Math.hypot(view.direction[1] * t, origin + view.direction[2] * t) - medium.radius);
		column[0] += (Math.exp(-h / medium.rayleighHeight) * view.length) / intervals;
		column[1] += (Math.exp(-h / medium.mieHeight) * view.length) / intervals;
	}
	const tau = medium.rayleigh.map((coefficient, c) => coefficient * column[0] + medium.mie[c] * column[1]);
	return {column, tau, transmittance: tau.map((x) => Math.exp(-x)), intervals};
}

/** Adapt the retained, qualified direct angular library to an elevated sensor/grid. */
export function bundle(medium, config) {
	const material = {
		phaseTables: Array(15).fill(null),
		albedos: Array(15).fill(medium.albedo),
		unsupportedCenters: [],
		changedChannels: [],
	};
	const libraryMedium = medium.mie.some((x) => x > 0) ? medium : {...medium, mie: physical().mie};
	const aerosolScale = medium.mie[0] / libraryMedium.mie[0];
	const files = directBundle(libraryMedium, {...config, epsilon: 1}, material, Boolean(config.refinedPhase));
	const levels = new Set([0, medium.observerAltitude, medium.topAltitude]);
	for (const [height, count] of [
		[medium.rayleighHeight, config.layers],
		[medium.mieHeight, config.layers / 2],
	])
		for (let i = 1; i < count; i++)
			levels.add(-height * Math.log1p(-(1 - i / count) * -Math.expm1(-medium.topAltitude / height)));
	const z = [...levels].sort((a, b) => b - a),
		molecular = [z.map((x) => x / 1000).join(' ')],
		absorption = [molecular[0]];
	for (const c of config.channels) {
		molecular.push(
			[
				channels[c].center.value,
				...z
					.slice(1)
					.map(
						(lower, i) =>
							medium.rayleigh[c] *
							medium.rayleighHeight *
							(Math.exp(-lower / medium.rayleighHeight) - Math.exp(-z[i] / medium.rayleighHeight)),
					),
			].join(' '),
		);
		absorption.push([channels[c].center.value, ...z.slice(1).map(() => 0)].join(' '));
	}
	files.set('scattering.txt', molecular.join('\n') + '\n');
	files.set('absorption.txt', absorption.join('\n') + '\n');
	files.set(
		'species.txt',
		z
			.map(
				(height, i) =>
					`${height / 1000} ${i === 0 ? 0 : (aerosolScale * medium.mieHeight * (Math.exp(-height / medium.mieHeight) - Math.exp(-z[i - 1] / medium.mieHeight))) / (z[i - 1] - height)}`,
			)
			.join('\n') + '\n',
	);
	files.set(
		'atmosphere.txt',
		z
			.map(
				(x) =>
					`${x / 1000} ${1013 * Math.exp(-x / medium.rayleighHeight)} 288 ${2.545818e19 * Math.exp(-x / medium.rayleighHeight)}`,
			)
			.join('\n') + '\n',
	);
	let deck = String(files.get('input.inp'))
		.replace('zout 0.005', `zout ${medium.observerAltitude / 1000}`)
		.replace('albedo 0', `albedo ${config.surfaceAlbedo ?? 0}`)
		.replace('phi 180', `phi ${config.azimuth ?? 180}`);
	if (config.repeat !== undefined)
		deck = deck.replace(/^mc_randomseed .*$/mu, `mc_randomseed ${100003 + config.repeat * 104729}`);
	assert.ok(deck.includes('mc_spherical 1D') && deck.includes('mc_vroom off') && deck.includes(`zout ${medium.observerAltitude / 1000}`));
	files.set('input.inp', deck);
	const metadata = JSON.parse(String(files.get('case.json')));
	metadata.purpose =
		'Elevated horizon: independently solved matched production Bruneton coefficients, direct Cornette-Shanks table.';
	metadata.geometry = `Fully spherical R=${medium.radius} m, observer=${medium.observerAltitude} m; view elevation=${config.elevation} degrees, azimuth=${config.azimuth ?? 180} degrees relative to the Sun.`;
	metadata.configuration = config;
	metadata.phase.family = 'Analytic Cornette-Shanks g=.7, sampled direct angular table; no Toronto material.';
	metadata.limitations = [
		'Native15 bin-average coefficients/source held constant within each matched bin; library wavelength coordinate labels the bin, not a claim of continuous physical spectrum.',
		'Scalar fully spherical MYSTIC, no refraction; all orders versus production N4.',
		'Black ground unless explicit surfaceAlbedo; RGB scene lighting not asserted spectrally equivalent.',
	];
	files.set('case.json', JSON.stringify(metadata, null, 2));
	const column = z
		.slice(1)
		.reduce(
			(sum, lower, i) =>
				sum + medium.mieHeight * (Math.exp(-lower / medium.mieHeight) - Math.exp(-z[i] / medium.mieHeight)),
			0,
		);
	assert.ok(Math.abs(column / (medium.mieHeight * -Math.expm1(-medium.topAltitude / medium.mieHeight)) - 1) < 1e-12);
	return {
		files,
		proof: {
			levels: z,
			aerosolShapeColumn: column,
			exportedDensityColumn: column * aerosolScale,
			extinctionColumns: medium.mie.map((x) => x * column),
			observerLevelIncluded: z.includes(medium.observerAltitude),
			phase: metadata.actualBinaryOpticalProof,
		},
	};
}
