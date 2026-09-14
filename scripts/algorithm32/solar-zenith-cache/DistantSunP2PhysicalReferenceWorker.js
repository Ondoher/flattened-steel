import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import Reference from './DistantSunBinary64Reference.js';
import {integrateP2PhysicalRay, reconstructP2PhysicalDensity} from './DistantSunP2PhysicalMatrix.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url)),
	files = new Files(repository);
const [run, childName, definitionHash, childDefinitionHash] = process.argv.slice(2);
assert.match(run ?? '', /^tmp\/production-algorithm32\/distant-sun-strobing-promotion\/physical-[a-f0-9-]+$/u);
assert.match(childName ?? '', /^(native15|direct40)\/channel-[0-9]{2}$/u);
assert.ok([definitionHash, childDefinitionHash].every((value) => /^[a-f0-9]{64}$/u.test(value)));
const artifacts = [];
/** Retain an exclusively written child artifact. */
const write = async (name, value) => {
	const artifact = await files.write(
		`${run}/${childName}/${name}`,
		Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`),
	);
	artifacts.push(artifact);
	return artifact;
};
/** Authenticate a JSON parent with its complete retained identity. */
async function readJson(identity, maximumBytes = 16 * 1024 * 1024) {
	return JSON.parse((await files.read(identity.path, identity, maximumBytes)).toString());
}
try {
	const definitionBytes = await files.read(`${run}/definition.json`);
	assert.equal(files.hash(definitionBytes), definitionHash);
	const definition = JSON.parse(definitionBytes.toString());
	const childBytes = await files.read(`${run}/${childName}/definition.json`);
	assert.equal(files.hash(childBytes), childDefinitionHash);
	const child = JSON.parse(childBytes.toString());
	/** @type {P2PhysicalMatrix} */ const matrix = await readJson(definition.matrix, 128 * 1024 * 1024);
	const profile = definition.profiles[child.profileIndex],
		count = matrix.coordinates.length;
	const gpuBytes = await files.read(child.gpuDensity.path, child.gpuDensity),
		directBytes = await files.read(child.gpuDirect.path, child.gpuDirect);
	artifacts.push(child.gpuDensity, child.gpuDirect, {
		path: `${run}/${childName}/definition.json`,
		byteLength: childBytes.length,
		sha256: childDefinitionHash,
	});
	assert.equal(gpuBytes.length, count * 16);
	assert.equal(directBytes.length, matrix.queries.length * 8);
	const gpuFields = Array.from({length: 4}, (_, order) =>
		Float32Array.from({length: count}, (_unused, index) => gpuBytes.readFloatLE((order * count + index) * 4)),
	);
	const referenceFields = Array.from({length: 4}, () => new Float64Array(count));
	const reference = new Reference(profile.buildRequest, child.channel, (event) =>
		process.stdout.write(`${JSON.stringify({run, childName, ...event})}\n`),
	);
	let lastProgress = performance.now();
	for (let order = 1; order <= 4; order++)
		for (const [index, coordinate] of matrix.coordinates.entries()) {
			referenceFields[order - 1][index] = reference.density(
				order,
				coordinate.position,
				coordinate.zenith,
				coordinate.direction,
			);
			if (performance.now() - lastProgress > 10000) {
				lastProgress = performance.now();
				process.stdout.write(
					`${JSON.stringify({run, childName, phase: 'binary64-field', order, completed: index + 1, count})}\n`,
				);
			}
		}
	const referenceBytes = Buffer.alloc(count * 32);
	referenceFields.forEach((field, order) =>
		field.forEach((value, index) => referenceBytes.writeDoubleLE(value, (order * count + index) * 8)),
	);
	await write('reference-density.f64', referenceBytes);
	const gpuCumulative = new Float32Array(count),
		referenceCumulative = new Float64Array(count);
	for (let index = 0; index < count; index++)
		for (let order = 0; order < 4; order++) {
			gpuCumulative[index] = Math.fround(gpuCumulative[index] + gpuFields[order][index]);
			referenceCumulative[index] += referenceFields[order][index];
		}
	const summaries = new Map(),
		comparisons = [];
	/** Record fixed-policy comparison and per-channel, quantity/order statistics. */
	function compare(quantity, order, physicalInput, actual, expected) {
		const absoluteFloor = quantity === 'transmittance' ? 1e-6 : quantity === 'radiance' ? 1e-8 : 1e-10,
			relative = quantity === 'transmittance' ? 0.001 : 0.01;
		const error = Math.abs(actual - expected),
			limit = absoluteFloor + relative * Math.abs(expected),
			ratio = error / limit;
		const pass =
			Number.isFinite(actual) && actual >= 0 && Number.isFinite(expected) && expected >= 0 && error <= limit;
		const record = {
			quantity,
			order,
			physicalInput,
			actual,
			reference: expected,
			error,
			limit,
			normalizedError: ratio,
			pass,
			invalidActual: !Number.isFinite(actual),
			invalidReference: !Number.isFinite(expected),
		};
		comparisons.push(record);
		const key = `${quantity}:${order}`;
		if (!summaries.has(key))
			summaries.set(key, {
				quantity,
				order,
				count: 0,
				failures: 0,
				squaredError: 0,
				maximumAbsoluteError: 0,
				maximumNormalizedError: 0,
				worst: null,
			});
		const summary = summaries.get(key);
		summary.count++;
		summary.failures += Number(!pass);
		summary.squaredError += error * error;
		summary.maximumAbsoluteError = Math.max(summary.maximumAbsoluteError, error);
		if (summary.worst === null || ratio > summary.maximumNormalizedError || !Number.isFinite(ratio)) {
			summary.maximumNormalizedError = ratio;
			summary.worst = record;
		}
	}
	const actualFields = [gpuFields[0], gpuFields[1], gpuFields[2], gpuCumulative],
		expectedFields = [referenceFields[0], referenceFields[1], referenceFields[2], referenceCumulative],
		orders = ['N1', 'N2', 'N3', 'cumulativeN4'];
	for (const traversal of ['sunrise', 'sunset'])
		for (const queryIndex of matrix.traversals[traversal]) {
			const query = matrix.queries[queryIndex],
				physicalInput = {queryIndex, traversal, ...query, stencil: undefined};
			for (let order = 0; order < orders.length; order++)
				compare(
					'density',
					orders[order],
					physicalInput,
					reconstructP2PhysicalDensity(query.stencil, actualFields[order]),
					reconstructP2PhysicalDensity(query.stencil, expectedFields[order]),
				);
		}
	for (const [queryIndex, query] of matrix.queries.entries()) {
		const radius = reference.bottom + query.heightMeters,
			angle = (query.solarZenithDegrees * Math.PI) / 180,
			point = [radius * Math.sin(angle), 0, radius * Math.cos(angle)],
			world = reference.world(point, query.localDirection);
		const physicalInput = {queryIndex, ...query, stencil: undefined};
		compare(
			'transmittance',
			'continuous-source',
			physicalInput,
			directBytes.readFloatLE(queryIndex * 8),
			reference.transmittance(point),
		);
		compare(
			'density',
			'continuous-N1',
			physicalInput,
			directBytes.readFloatLE(queryIndex * 8 + 4),
			reference.directDensity(point, world),
		);
	}
	for (const ray of matrix.rays)
		for (let order = 0; order < orders.length; order++) {
			const actual = integrateP2PhysicalRay(ray, actualFields[order], profile.buildRequest, child.channel),
				expected = integrateP2PhysicalRay(ray, expectedFields[order], profile.buildRequest, child.channel);
			compare(
				'radiance',
				orders[order],
				{
					rayId: ray.id,
					queryIndex: ray.queryIndex,
					lengthMeters: ray.lengthMeters,
					endsOnGround: ray.endsOnGround,
					...matrix.queries[ray.queryIndex],
					stencil: undefined,
				},
				actual.radiance,
				expected.radiance,
			);
		}
	await write('comparisons.json', comparisons);
	const statistics = [...summaries.values()].map((summary) => ({
		...summary,
		rmsError: Math.sqrt(summary.squaredError / summary.count),
	}));
	const accepted = statistics.every((summary) => summary.failures === 0);
	for (const source of definition.sources) await files.read(source.path, source);
	await write('result.json', {
		accepted,
		profileId: profile.id,
		channel: child.channel,
		statistics,
		evaluations: reference.evaluations,
		operation:
			'Independent binary64 Native48/Z180/F68/W27 recurrence; direction bilinear then solar Hermite then altitude blend; atmospheric-path Q30 with identical profile extinction. Continuous N1/source transmittance scored separately at logical physical inputs.',
		limitations: [
			'Off-node higher orders use the same production discretization, not an independent continuum-convergence oracle.',
			'Sunrise/sunset replay is stateless and does not prove application publication residency.',
			'Q30 is atmospheric-path radiance without a separate final ground-surface term; profile-specific ground reflection remains in recurrence construction.',
		],
		parents: {
			definition: {path: `${run}/definition.json`, sha256: definitionHash, byteLength: definitionBytes.length},
			childDefinition: {
				path: `${run}/${childName}/definition.json`,
				sha256: childDefinitionHash,
				byteLength: childBytes.length,
			},
			matrix: definition.matrix,
			gpuDensity: child.gpuDensity,
			gpuDirect: child.gpuDirect,
		},
		tools: {node: process.version},
	});
	await files.write(`${run}/${childName}/sealed.json`, Buffer.from(`${JSON.stringify({accepted, artifacts})}\n`));
	process.stdout.write(
		`${JSON.stringify({run, childName, accepted, failures: statistics.reduce((sum, value) => sum + value.failures, 0)})}\n`,
	);
	if (!accepted) process.exitCode = 1;
} catch (error) {
	await write('failure.json', {error: String(error)});
	await files.write(
		`${run}/${childName}/sealed.json`,
		Buffer.from(`${JSON.stringify({accepted: false, artifacts})}\n`),
	);
	throw error;
}
