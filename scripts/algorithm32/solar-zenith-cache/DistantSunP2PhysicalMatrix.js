import assert from 'node:assert/strict';
import {getSampleDirection} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js';
import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';

/** Binary64 dot product for physical geometry. */
const dot = (left, right) => left.reduce((sum, value, axis) => sum + value * right[axis], 0);
/** Normalize one nonzero finite physical vector. */
const unit = (vector) => vector.map((value) => value / Math.hypot(...vector));
/** Resolve the canonical source-facing local frame at a physical point. */
function frame(point) {
	const up = unit(point);
	let along = [-up[2] * up[0], -up[2] * up[1], 1 - up[2] * up[2]];
	if (Math.hypot(...along) < 1e-12) along = [1, 0, 0];
	along = unit(along);
	return [
		along,
		[up[1] * along[2] - up[2] * along[1], up[2] * along[0] - up[0] * along[2], up[0] * along[1] - up[1] * along[0]],
		up,
	];
}
/** Return a physical linear interval with exact clamped endpoints. */
function interval(nodes, value, rightAtKnot = false) {
	if (value <= nodes[0]) return {lower: 0, upper: 1, fraction: 0};
	if (value >= nodes.at(-1)) return {lower: nodes.length - 2, upper: nodes.length - 1, fraction: 1};
	let upper = 1;
	while (nodes[upper] < value || (rightAtKnot && nodes[upper] === value)) upper++;
	return {lower: upper - 1, upper, fraction: (value - nodes[upper - 1]) / (nodes[upper] - nodes[upper - 1])};
}
/** Return the nearest strictly forward stable sphere intersection. */
function boundary(radius, projection, target) {
	const constant = (radius - target) * (radius + target),
		discriminant = projection * projection - constant;
	if (discriminant < 0) return Infinity;
	const root = Math.sqrt(discriminant),
		far = -projection - (projection >= 0 ? root : -root),
		near = far === 0 ? 0 : constant / far;
	return [near, far].sort((a, b) => a - b).find((value) => value > 1e-3) ?? Infinity;
}

/** Build the registered continuous inputs and union of production-domain field taps.
 * The optional screen selects one wavelength elsewhere, and a small but physical input subset here.
 * @param {DistantSunSceneCacheCompilerBuildRequest} buildRequest - Unchanged Native48/Z180/W27 profile.
 * @param {{screen?: boolean, scenes: P2PhysicalScene[]}} options - Authenticated B1 scene geometry.
 * @returns {P2PhysicalMatrix} - Explicit reusable coordinates, queries, and Q30 midpoint stencils.
 */
export function createP2PhysicalMatrix(buildRequest, {screen = false, scenes}) {
	const spec = buildRequest.transportSpec,
		domains = spec.domains;
	assert.equal(domains.position.nodes.length, 48);
	assert.equal(domains.solarZenith.nodes.length, 180);
	assert.equal(domains.outgoing.unitVectors.length, 4374);
	assert.equal(scenes.length, 17);
	const nodes = domains.position.nodes.map((node) => node.altitudeMeters),
		angles = domains.solarZenith.nodes.map((node) => node.solarZenithDegrees);
	const heights = [0, 1.7, 2, 4, 8, nodes[1], nodes[2], nodes[1] / 2, (nodes[1] + nodes[2]) / 2];
	const solarAngles = [0.5, 30, 60, 80, 89.5, 89.75, 90, 90.25, 90.5, 90.75, 91, 91.5, 96, 107.5];
	/** @type {P2PhysicalCoordinate[]} */ const coordinates = [];
	const coordinateMap = new Map();
	/** @type {P2PhysicalQuery[]} */ const queries = [];
	/** @type {P2PhysicalRay[]} */ const rays = [];
	const grazingOffsetDegrees = 0.01;
	/** Resolve independent direction bilinear, solar Hermite, then altitude blend support. */
	function stencil(height, angle, direction) {
		const position = interval(nodes, height),
			solar = interval(angles, angle, true);
		const solarIndices = [
			Math.max(0, solar.lower - 1),
			solar.lower,
			solar.upper,
			Math.min(angles.length - 1, solar.upper + 1),
		];
		const directionStencil = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(direction);
		const positionIndices = [position.lower, position.upper];
		const indices = positionIndices.map((p) =>
			solarIndices.map((z) =>
				directionStencil.indices.map((d) => {
					const label = `${p}:${z}:${d}`;
					if (!coordinateMap.has(label)) {
						coordinateMap.set(label, coordinates.length);
						coordinates.push({position: p, zenith: z, direction: d, x: d, y: z * nodes.length + p, label});
					}
					return coordinateMap.get(label);
				}),
			),
		);
		return {
			positionIndices,
			positionFraction: position.fraction,
			solarIndices,
			solarFraction: solar.fraction,
			firstSolarInterval: solar.lower === 0,
			lastSolarInterval: solar.upper === angles.length - 1,
			directionIndices: directionStencil.indices,
			directionWeights: directionStencil.weights,
			indices,
		};
	}
	/** Append one physical query and its matched Q30 atmospheric path. */
	function append(id, kind, height, angle, localDirection) {
		const queryIndex = queries.length;
		queries.push({
			id,
			kind,
			heightMeters: height,
			solarZenithDegrees: angle,
			localDirection,
			stencil: stencil(height, angle, localDirection),
		});
		const theta = (angle * Math.PI) / 180,
			radius = spec.planet.bottomRadiusMeters + height;
		const origin = [radius * Math.sin(theta), 0, radius * Math.cos(theta)],
			axes = frame(origin);
		const direction = unit(
			[0, 1, 2].map(
				(axis) =>
					axes[0][axis] * localDirection[0] +
					axes[1][axis] * localDirection[1] +
					axes[2][axis] * localDirection[2],
			),
		);
		const projection = radius * localDirection[2];
		const ground =
			height === 0 && localDirection[2] < 0 ? 0 : boundary(radius, projection, spec.planet.bottomRadiusMeters);
		const top = boundary(radius, projection, spec.planet.topRadiusMeters),
			length = Math.min(ground, top);
		assert.ok(Number.isFinite(length) && length >= 0);
		const samples = [];
		if (length > 0)
			for (let index = 0; index < 30; index++) {
				const start = length * (index / 30) ** 2,
					end = length * ((index + 1) / 30) ** 2,
					distance = (start + end) / 2;
				const point = origin.map((value, axis) => value + direction[axis] * distance),
					pointRadius = Math.hypot(...point),
					pointAxes = frame(point);
				const sampleHeight = Math.max(0, pointRadius - spec.planet.bottomRadiusMeters),
					sampleAngle = (Math.atan2(Math.hypot(point[0], point[1]), point[2]) * 180) / Math.PI;
				const local = pointAxes.map((axis) => dot(direction, axis));
				samples.push({
					stepMeters: end - start,
					heightMeters: sampleHeight,
					solarZenithDegrees: sampleAngle,
					localDirection: local,
					stencil: stencil(sampleHeight, sampleAngle, local),
				});
			}
		rays.push({id, kind, queryIndex, lengthMeters: length, endsOnGround: ground <= top, samples});
	}
	for (const height of screen ? [0, 1.7] : heights)
		for (const angle of screen ? [89.75, 90.25] : solarAngles) {
			const radius = spec.planet.bottomRadiusMeters + height;
			const horizon = Math.acos(-Math.sqrt(height * (2 * spec.planet.bottomRadiusMeters + height)) / radius);
			const offset = (grazingOffsetDegrees * Math.PI) / 180;
			for (const [name, zenith] of [
				['up', 0],
				['down', Math.PI],
				['tangent', Math.PI / 2],
				['grazing-above', horizon - offset],
				['grazing-below', horizon + offset],
			]) {
				const local =
					name === 'up'
						? [0, 0, 1]
						: name === 'down'
							? [0, 0, -1]
							: name === 'tangent'
								? [1, 0, 0]
								: [Math.sin(Number(zenith)), 0, Math.cos(Number(zenith))];
				append(`surface:${height}:${angle}:${name}`, 'surface', height, angle, local);
			}
		}
	for (const [sceneIndex, scene] of scenes.entries())
		if (!screen || sceneIndex === 3)
			for (let gridX = 0; gridX < 9; gridX++)
				for (let gridY = 0; gridY < 9; gridY++)
					if (!screen || (gridX === 4 && gridY === 4)) {
						const sample = getSampleDirection(gridX, gridY),
							azimuth = sample.azimuthRadians - (scene.fittedAzimuthDegrees * Math.PI) / 180;
						append(`${scene.id}:${gridX}:${gridY}`, 'b1', 0, scene.zenithDegrees, [
							Math.sin(sample.zenithRadians) * Math.cos(azimuth),
							Math.sin(sample.zenithRadians) * Math.sin(azimuth),
							Math.cos(sample.zenithRadians),
						]);
					}
	for (const height of screen ? [0, nodes.at(-1)] : [0, nodes[1], nodes[2], nodes.at(-1)])
		for (const lower of screen ? [0, 89, 178] : [0, 88, 89, 178])
			for (const fraction of [0, 0.01, 0.25, 0.5, 0.75, 0.99, 1])
				for (const localDirection of [
					[1, 0, 0],
					[0, 0, 1],
				]) {
					const angle = angles[lower] + fraction * (angles[lower + 1] - angles[lower]);
					queries.push({
						id: `lookup:${height}:${lower}:${fraction}:${localDirection[2]}`,
						kind: 'lookup-only',
						heightMeters: height,
						solarZenithDegrees: angle,
						localDirection,
						stencil: stencil(height, angle, localDirection),
					});
				}
	const sunset = queries
		.map((_query, index) => index)
		.sort((left, right) => queries[left].solarZenithDegrees - queries[right].solarZenithDegrees);
	return {
		schema: 'algorithm32-p2-physical-matrix-v1',
		screen,
		coordinates,
		queries,
		rays,
		heightsMeters: heights,
		solarZenithDegrees: solarAngles,
		grazingOffsetDegrees,
		traversals: {sunrise: [...sunset].reverse(), sunset},
	};
}

/** Reconstruct one spectral quantity from its sparse scalar field in runtime operation order.
 * @param {P2PhysicalStencil} stencil - Complete authenticated support.
 * @param {Float32Array | Float64Array} values - One pure or cumulative sparse density field.
 * @returns {number} - Binary64 interpolation over the supplied values.
 */
export function reconstructP2PhysicalDensity(stencil, values) {
	const altitudes = stencil.indices.map((solar) => {
		const samples = solar.map((directions) =>
			directions.reduce((sum, index, tap) => sum + stencil.directionWeights[tap] * values[index], 0),
		);
		return DistantSunSolarInterpolation.sample(
			stencil.firstSolarInterval ? undefined : samples[0],
			samples[1],
			samples[2],
			stencil.lastSolarInterval ? undefined : samples[3],
			stencil.solarFraction,
		);
	});
	return altitudes[0] + stencil.positionFraction * (altitudes[1] - altitudes[0]);
}

/** Apply the unchanged Q30 midpoint atmospheric-path equation to a sparse field.
 * @param {P2PhysicalRay} ray - Ordered quadratic midpoint geometry.
 * @param {Float32Array | Float64Array} values - One pure or cumulative sparse density field.
 * @param {DistantSunSceneCacheCompilerBuildRequest} buildRequest - Physical profile owning extinction.
 * @param {number} channelIndex - Profile-specific channel.
 * @returns {{radiance: number, transmittance: number}} - Atmospheric-path radiance and terminal transmittance.
 */
export function integrateP2PhysicalRay(ray, values, buildRequest, channelIndex) {
	const spec = buildRequest.transportSpec,
		atmosphere = spec.atmosphere,
		channel = spec.domains.spectrum.channels[channelIndex],
		wavelength = channel.centerNanometers / 1000;
	const rayleigh =
		channel.rayleighScatteringPerMeter ?? atmosphere.rayleighCoefficientScalePerMeter * wavelength ** -4;
	const mie =
		channel.mieExtinctionPerMeter ??
		(atmosphere.mieAngstromBeta / atmosphere.mieScaleHeightMeters) * wavelength ** -atmosphere.mieAngstromAlpha;
	let radiance = 0,
		transmittance = 1;
	for (const sample of ray.samples) {
		const extinction =
			rayleigh * Math.exp(-sample.heightMeters / atmosphere.rayleighScaleHeightMeters) +
			mie * Math.exp(-sample.heightMeters / atmosphere.mieScaleHeightMeters);
		const halfStep = Math.exp(-0.5 * extinction * sample.stepMeters);
		transmittance *= halfStep;
		radiance += transmittance * reconstructP2PhysicalDensity(sample.stencil, values) * sample.stepMeters;
		transmittance *= halfStep;
	}
	return {radiance, transmittance};
}
