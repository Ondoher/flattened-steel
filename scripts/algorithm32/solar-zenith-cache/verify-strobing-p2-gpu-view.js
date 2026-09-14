import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {gzipSync, gunzipSync} from 'node:zlib';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Compiler from './DistantSunSceneCacheOfflineCompiler.js';
import {
	prepareP2GpuViewBatches,
	p2GpuViewFields,
	packP2GpuViewLayer,
	reconstructP2GpuViewDensity,
	integrateP2GpuViewJob,
} from './DistantSunP2GpuViewInputs.js';
import {reconstructP2PhysicalDensity, integrateP2PhysicalRay} from './DistantSunP2PhysicalMatrix.js';
import {BrunetonColorDisplayModel} from '../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../src/algorithm32/spectral-values/index.js';
import {encodeRgbaPng} from '../../experiments/b1-directional-sky-radiance/figure5.js';

const [parent, definitionHash, option] = process.argv.slice(2);
assert.ok(
	parent &&
		/^[a-f0-9]{64}$/u.test(definitionHash ?? '') &&
		(option === undefined || option === '--screen') &&
		process.argv.length <= 5,
	'Usage: verify-strobing-p2-gpu-view.js PHYSICAL_RUN DEFINITION_SHA256 [--screen]',
);
const screen = option === '--screen';
const repository = fileURLToPath(new URL('../../../', import.meta.url)),
	files = new Files(repository);
assert.ok(
	parent.startsWith('tmp/production-algorithm32/distant-sun-strobing-promotion/'),
	'Physical parent must be in the plan-owned evidence root.',
);
const run = `tmp/production-algorithm32/distant-sun-strobing-promotion/p2-gpu-view-${randomUUID()}`;
await files.directory(run);
/** @type {DistantSunSharedCacheFileIdentity[]} */ const artifacts = [],
	parents = [],
	sources = [];
/** Persist one new immutable evidence artifact. */
const write = async (name, value) => {
	const artifact = await files.write(
		`${run}/${name}`,
		Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`),
	);
	artifacts.push(artifact);
	return artifact;
};
/** Authenticate one ordinary parent/source path and retain its exact identity. */
const read = async (name, expected = null, maximumBytes = 256 * 1024 * 1024) => {
	const bytes = await files.read(name, expected, maximumBytes);
	parents.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
	return bytes;
};
const heartbeat = setInterval(() => process.stdout.write(`${JSON.stringify({run, phase: 'p2-gpu-view'})}\n`), 25000);
try {
	const queue = [
		'scripts/algorithm32/solar-zenith-cache/verify-strobing-p2-gpu-view.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunP2GpuViewBrowser.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunP2GpuViewTypes.d.ts',
		'scripts/algorithm32/solar-zenith-cache/DistantSunP2PhysicalTypes.d.ts',
		'package-lock.json',
	];
	const seen = new Set();
	while (queue.length) {
		const name = queue.shift();
		if (seen.has(name)) continue;
		assert.ok(!name.startsWith('experiments/'), 'Production proof must not import contained experiment code.');
		seen.add(name);
		const bytes = await read(name);
		sources.push({path: name, byteLength: bytes.length, sha256: files.hash(bytes)});
		for (const match of bytes
			.toString('utf8')
			.matchAll(/(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/gu))
			if (match[1].startsWith('.'))
				queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(name), match[1])));
	}
	const definitionBytes = await read(`${parent}/definition.json`);
	assert.equal(files.hash(definitionBytes), definitionHash, 'Physical parent definition identity mismatch.');
	/** @type {{schema: string; matrix: DistantSunSharedCacheFileIdentity; profiles: {id: string; buildRequest: DistantSunSceneCacheCompilerBuildRequest}[]}} */
	const parentDefinition = JSON.parse(definitionBytes.toString('utf8'));
	assert.equal(parentDefinition.schema, 'algorithm32-p2-physical-proof-v1');
	const profileIndex = parentDefinition.profiles.findIndex((candidate) => candidate.id === 'native15');
	const profile = parentDefinition.profiles[profileIndex];
	assert.ok(profile, 'Native15 parent profile is absent.');
	const {buildRequest} = profile;
	assert.equal(parentDefinition.matrix.path, `${parent}/matrix.json`);
	/** @type {P2PhysicalMatrix} */
	const matrix = JSON.parse((await read(parentDefinition.matrix.path, parentDefinition.matrix)).toString('utf8'));
	assert.equal(matrix.schema, 'algorithm32-p2-physical-matrix-v1');
	assert.equal(matrix.screen, screen, 'Screen and complete evidence cannot be interchanged.');
	assert.equal(buildRequest.transportSpec.domains.spectrum.channels.length, 15);
	assert.equal(buildRequest.transportSpec.atmosphere.ozone.absorptionEnabled, false);
	/** @type {Float32Array[][]} */ const fields = [];
	const childAcceptances = [];
	for (let channel = 0; channel < 15; channel++) {
		if (screen && channel !== 7) {
			fields.push(Array.from({length: 4}, () => new Float32Array(matrix.coordinates.length)));
			continue;
		}
		const child = `${parent}/native15/channel-${String(channel).padStart(2, '0')}`;
		const sealedBytes = await read(`${child}/sealed.json`);
		/** @type {{accepted: boolean; artifacts: DistantSunSharedCacheFileIdentity[]}} */
		const sealed = JSON.parse(sealedBytes.toString('utf8'));
		const density = sealed.artifacts.find((artifact) => artifact.path === `${child}/gpu-density.f32`);
		const childDefinitionIdentity = sealed.artifacts.find(
			(artifact) => artifact.path === `${child}/definition.json`,
		);
		assert.ok(density, 'Sealed physical child lacks the GPU density field.');
		assert.ok(childDefinitionIdentity, 'Sealed physical child lacks its derivation definition.');
		const childDefinition = JSON.parse(
			(await read(childDefinitionIdentity.path, childDefinitionIdentity)).toString('utf8'),
		);
		assert.equal(childDefinition.profileIndex, profileIndex);
		assert.equal(childDefinition.channel, channel);
		assert.deepEqual(childDefinition.parentDefinition, {
			path: `${parent}/definition.json`,
			byteLength: definitionBytes.length,
			sha256: definitionHash,
		});
		assert.deepEqual(childDefinition.matrix, parentDefinition.matrix);
		assert.deepEqual(childDefinition.gpuDensity, density);
		fields.push(p2GpuViewFields(await read(density.path, density), matrix.coordinates.length));
		childAcceptances.push({channel, accepted: sealed.accepted, sealSha256: files.hash(sealedBytes)});
	}
	const preparedBatches = prepareP2GpuViewBatches(matrix);
	/** @type {P2GpuViewBatch[]} */ const batches = [];
	for (const [batchIndex, batch] of preparedBatches.entries()) {
		const addresses = new Uint16Array(180 * 48 * 2).fill(65535);
		for (const [ordinal, key] of batch.rows.entries()) {
			const [position, zenith] = key.split(':').map(Number);
			addresses.set([Math.floor(ordinal / 64), ordinal % 64], (position * 180 + zenith) * 2);
		}
		const addressArtifact = await write(`addresses-${batchIndex}.u16`, Buffer.from(addresses.buffer));
		const packets = [];
		for (let order = 0; order < 4; order++) {
			const layers = [];
			for (let layer = 0; layer < Math.ceil(batch.rows.length / 64); layer++) {
				const values = packP2GpuViewLayer(matrix, batch, fields, order, layer, (bytes) => files.hash(bytes));
				const bytes = Buffer.from(values.buffer, values.byteOffset, values.byteLength);
				const compressed = gzipSync(bytes);
				assert.deepEqual(gunzipSync(compressed), bytes, 'Lossless packet evidence compression changed bytes.');
				const artifact = await write(`packet-${batchIndex}-${order}-${layer}.f32.gz`, compressed);
				layers.push(artifact.path);
			}
			packets.push(layers);
		}
		batches.push({jobs: batch.jobs.map((prepared) => prepared.job), addresses: addressArtifact.path, packets});
		process.stdout.write(
			`${JSON.stringify({run, phase: 'packet-staging', batch: batchIndex + 1, batches: preparedBatches.length})}\n`,
		);
	}
	const spec = buildRequest.transportSpec,
		atmosphere = spec.atmosphere;
	const coefficients = spec.domains.spectrum.channels.map((channel) => {
		const wavelength = channel.centerNanometers / 1000;
		return {
			rayleigh:
				channel.rayleighScatteringPerMeter ?? atmosphere.rayleighCoefficientScalePerMeter * wavelength ** -4,
			mie:
				channel.mieExtinctionPerMeter ??
				(atmosphere.mieAngstromBeta / atmosphere.mieScaleHeightMeters) *
					wavelength ** -atmosphere.mieAngstromAlpha,
		};
	});
	/** @type {P2GpuViewControl} */
	const control = {
		batches,
		rayleigh: coefficients.map((value) => Math.fround(value.rayleigh)),
		mie: coefficients.map((value) => Math.fround(value.mie)),
		rayleighScaleHeight: Math.fround(atmosphere.rayleighScaleHeightMeters),
		mieScaleHeight: Math.fround(atmosphere.mieScaleHeightMeters),
	};
	await write('definition.json', {
		schema: 'algorithm32-p2-gpu-q30-view-v1',
		parent,
		definitionHash,
		screen,
		buildRequest,
		matrixQueries: matrix.queries.length,
		matrixRays: matrix.rays.length,
		childAcceptances,
		control,
		operation:
			'Sealed physical-child pure Float32 J1..J4 -> exact ordered Float32 cumulative N4 -> sparse complete production packet packing -> unchanged production cubic GLSL (direction, solar, altitude) -> Q30 midpoint density with two half-step extinction factors -> unchanged Basic Bruneton display',
		oracle: 'Binary64 reconstruction and Q30 transport of the same authenticated Float32 field and exactly uploaded Float32 coordinates/medium uniforms. Physical Float64 reference fields are never consumed. Separate geometry-reference files retain the same field evaluated using original binary64 physical inputs; input-conversion delta is reported independently of shader arithmetic.',
		outputLayout:
			'Per batch/order: job-major; 32 rows each16 channels. Row0 density or final radiance; row1 terminal transmission; rows2..31 midpoint densities. Channel15 is synthetic and excluded from scoring.',
		tolerances: {
			density: {absolute: 1e-10, relative: 2e-5},
			radiance: {absolute: 1e-8, relative: 0.01},
			transmittance: {absolute: 1e-6, relative: 0.001},
		},
		tools: {node: process.version, platform: process.platform, architecture: process.arch},
		sources,
	});
	const execution = await new Compiler({
		chromePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	}).compileLayers({
		outputDirectory: path.join(repository, run, 'browser'),
		control,
		browserModulePath: '/repository/scripts/algorithm32/solar-zenith-cache/DistantSunP2GpuViewBrowser.js',
		layerCount: batches.length * 4,
	});
	await write('gpu-execution.json', execution.browserExecution);
	const color = new BrunetonColorDisplayModel();
	const displays = [];
	const summaries = [];
	let accepted = true;
	for (const [batchIndex, batch] of preparedBatches.entries())
		for (let order = 0; order < 4; order++) {
			const actual = execution.layers[batchIndex * 4 + order];
			assert.equal(actual.length, batch.jobs.length * 512 * 4);
			await write(`gpu-${batchIndex}-${order}.f32`, actual);
			const reference = new Float64Array(batch.jobs.length * 512);
			const geometryReference = new Float64Array(batch.jobs.length * 512);
			const failures = [];
			const metrics = Object.fromEntries(
				['density', 'radiance', 'transmittance'].map((quantity) => [
					quantity,
					Array.from({length: 15}, () => ({
						count: 0,
						failures: 0,
						squareError: 0,
						maximumError: 0,
						maximumRatio: 0,
						inputConversionMaximum: 0,
						worst: null,
					})),
				]),
			);
			for (const [jobIndex, prepared] of batch.jobs.entries()) {
				const {job, rayIndex, stencils} = prepared;
				for (let channel = 0; channel < 15; channel++) {
					const values = fields[channel][order];
					const geometryFinal =
						rayIndex === null
							? {radiance: reconstructP2PhysicalDensity(stencils[0], values), transmittance: 1}
							: integrateP2PhysicalRay(matrix.rays[rayIndex], values, buildRequest, channel);
					const final =
						rayIndex === null
							? {
									radiance: reconstructP2GpuViewDensity(job.samples[0], stencils[0], values),
									transmittance: 1,
								}
							: integrateP2GpuViewJob(prepared, values, control, channel);
					reference[jobIndex * 512 + channel] = final.radiance;
					reference[jobIndex * 512 + 16 + channel] = final.transmittance;
					geometryReference[jobIndex * 512 + channel] = geometryFinal.radiance;
					geometryReference[jobIndex * 512 + 16 + channel] = geometryFinal.transmittance;
					for (const [sampleIndex, stencil] of stencils.entries()) {
						reference[jobIndex * 512 + (sampleIndex + 2) * 16 + channel] = reconstructP2GpuViewDensity(
							job.samples[sampleIndex],
							stencil,
							values,
						);
						geometryReference[jobIndex * 512 + (sampleIndex + 2) * 16 + channel] =
							reconstructP2PhysicalDensity(stencil, values);
					}
					if (screen && channel !== 7) continue;
					for (let row = 0; row < stencils.length + 2; row++) {
						const index = jobIndex * 512 + row * 16 + channel;
						const quantity =
							row === 1 ? 'transmittance' : row === 0 && job.integrate ? 'radiance' : 'density';
						const expected = reference[index],
							value = actual.readFloatLE(index * 4),
							error = Math.abs(value - expected);
						const limit =
							quantity === 'density'
								? 1e-10 + 2e-5 * Math.abs(expected)
								: quantity === 'radiance'
									? 1e-8 + 0.01 * Math.abs(expected)
									: 1e-6 + 0.001 * Math.abs(expected);
						const pass = Number.isFinite(value) && value >= 0 && error <= limit;
						const metric = metrics[quantity][channel];
						metric.count++;
						metric.failures += pass ? 0 : 1;
						metric.squareError += error ** 2;
						metric.maximumError = Math.max(metric.maximumError, error);
						metric.inputConversionMaximum = Math.max(
							metric.inputConversionMaximum,
							Math.abs(expected - geometryReference[index]),
						);
						const details = {
							jobIndex,
							id: job.id,
							row,
							channel,
							actual: value,
							reference: expected,
							error,
							limit,
						};
						if (error / limit >= metric.maximumRatio) {
							metric.maximumRatio = error / limit;
							metric.worst = details;
						}
						if (!pass) failures.push(details);
						accepted &&= pass;
					}
				}
				if (job.integrate && prepared.traversal === 'sunset') {
					const spectra = [false, true].map((gpu) =>
						Array.from({length: 15}, (_, channel) =>
							gpu
								? actual.readFloatLE((jobIndex * 512 + channel) * 4)
								: reference[jobIndex * 512 + channel],
						),
					);
					const rgb = spectra.map((values, modelIndex) => {
						assert.ok(
							values.every((value) => Number.isFinite(value) && value >= 0),
							'Invalid final spectrum cannot be displayed.',
						);
						const packet = /** @type {SpectralRadiancePacket} */ (
							new SpectralPacket({
								basis: NATIVE_15_SPECTRAL_BASIS,
								quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
								units: SPECTRAL_UNITS.RADIANCE_DENSITY,
								values,
								provenanceIdentity: `p2-q30:${job.id}:${order}:${modelIndex}`,
							})
						);
						return color.radianceToDisplayRgb(packet);
					});
					displays.push({
						id: job.id,
						queryIndex: prepared.queryIndex,
						rayIndex,
						order: order + 1,
						spectra,
						rgb,
					});
				}
			}
			await write(`reference-${batchIndex}-${order}.f64`, Buffer.from(reference.buffer));
			await write(`geometry-reference-${batchIndex}-${order}.f64`, Buffer.from(geometryReference.buffer));
			await write(`failures-${batchIndex}-${order}.json`, failures);
			summaries.push({batchIndex, order: order + 1, metrics});
		}
	await write('comparisons.json', summaries);
	await write('final-view-spectra-and-rgb.json', displays);
	const width = 128,
		height = Math.ceil(displays.length / width);
	const images = [Buffer.alloc(width * height * 4, 255), Buffer.alloc(width * height * 4, 255)];
	let codeMaximum = 0,
		codeTotal = 0,
		floatMaximum = 0,
		floatTotal = 0,
		differing = 0;
	let minimumCode = 255,
		maximumCode = 0;
	for (const [index, display] of displays.entries())
		for (let channel = 0; channel < 3; channel++) {
			const codes = display.rgb.map((rgb) => Math.round(255 * Math.max(0, Math.min(1, rgb[channel]))));
			const codeDelta = Math.abs(codes[1] - codes[0]),
				floatDelta = Math.abs(display.rgb[1][channel] - display.rgb[0][channel]);
			codeMaximum = Math.max(codeMaximum, codeDelta);
			codeTotal += codeDelta;
			floatMaximum = Math.max(floatMaximum, floatDelta);
			floatTotal += floatDelta;
			differing += codeDelta === 0 ? 0 : 1;
			minimumCode = Math.min(minimumCode, ...codes);
			maximumCode = Math.max(maximumCode, ...codes);
			for (let side = 0; side < 2; side++) images[side][index * 4 + channel] = codes[side];
		}
	await write('reference-bruneton.png', encodeRgbaPng(width, height, images[0]));
	await write('gpu-bruneton.png', encodeRgbaPng(width, height, images[1]));
	const displayMetrics = {
		model: color.id,
		samples: displays.length,
		codeMaximum,
		codeMean: codeTotal / (3 * displays.length),
		unquantizedMaximum: floatMaximum,
		unquantizedMean: floatTotal / (3 * displays.length),
		differingComponents: differing,
		minimumCode,
		maximumCode,
		width,
		height,
		layout: 'Each recorded final-view-spectra-and-rgb.json row corresponds to one image pixel; trailing padding is excluded.',
		acceptance:
			'Descriptive display metrics; fixed spectral/transport tolerances determine arithmetic acceptance. No visual threshold was introduced after observing results.',
	};
	await write('display-metrics.json', displayMetrics);
	for (const source of sources) await files.read(source.path, source);
	await write('result.json', {
		accepted,
		screen,
		jobs: batches.reduce((sum, batch) => sum + batch.jobs.length, 0),
		orders: ['N1', 'N2', 'N3', 'cumulative-N4'],
		channels: screen ? [7] : Array.from({length: 15}, (_, channel) => channel),
		maximumPacketLayers: Math.max(...batches.map((batch) => batch.packets[0].length)),
		displayMetrics,
		parents,
		sources,
		limitations: [
			'Native15 atmospheric-path Q30 proof; no final ground-surface radiance term.',
			'Sparse complete consumed stencils; this does not replace runtime publication/residency qualification.',
			'Field generation physical acceptance and POC appearance preservation are independent gates.',
			...(screen
				? [
						'Single-channel diagnostic screen with other display channels set to zero; not full-spectrum acceptance.',
					]
				: []),
		],
	});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted, artifacts})}\n`));
	process.stdout.write(`${JSON.stringify({run, accepted, screen, displayMetrics})}\n`);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	await write('failure.json', {error: String(error), parents, sources});
	await files.write(`${run}/sealed.json`, Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`));
	throw error;
} finally {
	clearInterval(heartbeat);
}
