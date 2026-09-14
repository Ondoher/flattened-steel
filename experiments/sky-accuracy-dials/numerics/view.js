import {
	canonicalDirections,
	clamp,
	cross,
	dot,
	linearStencil,
	localDirection,
	outgoingStencil,
	solarCubic,
	sourceFrame,
	unit,
} from './math.js';
import {acceptControls} from './profile.js';
import {directDensity, medium, phase, sourceTransmittance} from './direct.js';

/** Registered Kider square-to-disk ray geometry, adapted without operation reordering
 * from benchmark-domain.getSampleDirection and DistantSunBrunetonView._ray.
 * @param {SkyTransportSpec} spec - Spherical geometry.
 * @param {SkyScene} scene - Measured source geometry.
 * @param {number} gridX - X coordinate.
 * @param {number} gridY - Y coordinate.
 * @returns {SkyRayGeometry} Canonical-world sky ray.
 */
export function benchmarkRay(spec, scene, gridX, gridY) {
	if (![gridX, gridY].every((value) => Number.isInteger(value) && value >= 0 && value < 9))
		throw new RangeError('Benchmark grid coordinates must be integers from zero through eight.');
	const horizontal = 2 * ((gridX + 0.5) / 9) - 1,
		vertical = 2 * ((gridY + 0.5) / 9) - 1;
	let radius, sampleAzimuth;
	if (horizontal > -vertical) {
		if (horizontal > vertical) {
			radius = horizontal;
			sampleAzimuth = (Math.PI / 4) * (vertical / horizontal);
		} else {
			radius = vertical;
			sampleAzimuth = (Math.PI / 4) * (2 - horizontal / vertical);
		}
	} else if (horizontal < vertical) {
		radius = -horizontal;
		sampleAzimuth = (Math.PI / 4) * (4 + vertical / horizontal);
	} else {
		radius = -vertical;
		sampleAzimuth = vertical !== 0 ? (Math.PI / 4) * (6 - horizontal / vertical) : 0;
	}
	const zenith = Math.acos(1 - radius * radius),
		local = [
			Math.sin(zenith) * Math.cos(sampleAzimuth),
			Math.sin(zenith) * Math.sin(sampleAzimuth),
			Math.cos(zenith),
		];
	const theta = (scene.zenithDegrees * Math.PI) / 180,
		azimuth = (scene.fittedAzimuthDegrees * Math.PI) / 180;
	const up = [Math.sin(theta), 0, Math.cos(theta)],
		tangent = unit([0, 0, 1].map((value, axis) => value - Math.cos(theta) * up[axis])),
		across = unit(cross(up, tangent));
	const alongSource = dot(local, [Math.cos(azimuth), Math.sin(azimuth), 0]),
		acrossSource = dot(local, [-Math.sin(azimuth), Math.cos(azimuth), 0]);
	const direction = unit(
		up.map((value, axis) => local[2] * value + alongSource * tangent[axis] + acrossSource * across[axis]),
	);
	const origin = /** @type {SkyVector3} */ ([
		up[0] * spec.planet.bottomRadiusMeters,
		up[1] * spec.planet.bottomRadiusMeters,
		up[2] * spec.planet.bottomRadiusMeters,
	]);
	const projection = dot(origin, direction),
		discriminant = projection * projection - (dot(origin, origin) - spec.planet.topRadiusMeters ** 2),
		root = Math.sqrt(discriminant);
	const length = [-projection - root, -projection + root].find((value) => value > 1e-3);
	if (!Number.isFinite(length) || !(length > 0))
		throw new RangeError('Benchmark ray has no positive atmospheric path.');
	return {origin, direction, length};
}

/** Partition an outward benchmark ray without crossing an altitude interpolation knot.
 * The quadratic branch retains the original arithmetic exactly. The segmented
 * branch solves each sphere crossing with a cancellation-resistant binary64 root,
 * then uses uniform-distance midpoint substeps inside each physical segment.
 * Outgoing and solar interpolation boundaries are intentionally not extra splits.
 * @param {SkyTransportSpec} spec - Physical atmosphere and cache altitude knots.
 * @param {SkyRayGeometry} ray - Surface observer and outward atmospheric ray.
 * @param {SkyViewRule} rule - Interval placement rule.
 * @param {number} count - Total quadratic intervals or substeps per altitude segment.
 * @returns {readonly SkyPathInterval[]} Contiguous positive intervals covering the full path.
 */
export function viewPathIntervals(spec, ray, rule, count) {
	if (rule === 'quadratic') {
		if (![30, 60, 120].includes(count)) throw new RangeError('Unsupported quadratic view count.');
		return Array.from({length: count}, (_unused, interval) => ({
			start: ray.length * (interval / count) * (interval / count),
			end: ray.length * ((interval + 1) / count) * ((interval + 1) / count),
		}));
	}
	if (rule !== 'altitude-segmented' || ![1, 2, 4, 8, 16].includes(count))
		throw new RangeError('Unsupported altitude-segmented view count.');
	const projection = dot(ray.origin, ray.direction),
		originRadius = Math.hypot(...ray.origin),
		bottom = spec.planet.bottomRadiusMeters,
		top = spec.planet.topRadiusMeters;
	if (
		!(projection > 0) ||
		Math.abs(originRadius - bottom) > 8 * Number.EPSILON * bottom ||
		!Number.isFinite(ray.length) ||
		!(ray.length > 0)
	)
		throw new RangeError('Altitude segmentation requires an outward surface benchmark ray.');
	const boundaries = [0];
	for (const node of spec.domains.position.nodes) {
		const radius = bottom + node.altitudeMeters;
		if (radius <= bottom || radius >= top) continue;
		const constant = (originRadius - radius) * (originRadius + radius),
			root = Math.sqrt(projection * projection - constant);
		const distance = constant / (-projection - root);
		if (!Number.isFinite(distance) || !(distance > boundaries.at(-1)) || !(distance < ray.length))
			throw new RangeError('Cache altitude crossings must be strictly ordered inside the view path.');
		boundaries.push(distance);
	}
	boundaries.push(ray.length);
	/** @type {SkyPathInterval[]} */ const intervals = [];
	for (let segment = 0; segment < boundaries.length - 1; segment++) {
		const lower = boundaries[segment],
			upper = boundaries[segment + 1],
			length = upper - lower;
		for (let substep = 0; substep < count; substep++) {
			const start = substep === 0 ? lower : lower + length * (substep / count),
				end = substep === count - 1 ? upper : lower + length * ((substep + 1) / count);
			if (!(end > start)) throw new RangeError('Altitude substep has no positive length.');
			intervals.push({start, end});
		}
	}
	return intervals;
}

/** Build one shared sparse reconstruction support without selecting an integration rule.
 * Normal views pass interval midpoints and lengths; independent references pass
 * their own physical abscissae and positive quadrature weights. Reconstruction
 * arithmetic and tap ordering remain identical in both cases.
 * @param {SkyBuildRequest} buildRequest - Fixed compiler input.
 * @returns {SkyPointStencilBuilder} Append-only local support and sample factory.
 */
export function createPointStencilBuilder(buildRequest) {
	const spec = buildRequest.transportSpec,
		domains = spec.domains,
		heights = domains.position.nodes.map((node) => node.altitudeMeters),
		angles = domains.solarZenith.nodes.map((node) => node.solarZenithDegrees),
		canonical = canonicalDirections(domains.outgoing);
	/** @type {SkyFieldCoordinate[]} */ const coordinates = [];
	/** @type {Map<string, number>} */ const indexes = new Map();
	/** @param {SkyVector3} point @param {SkyVector3} direction @param {number} weight @returns {SkyViewSample} */
	function sample(point, direction, weight) {
		if (
			!(weight > 0) ||
			!Number.isFinite(weight) ||
			[...point, ...direction].some((value) => !Number.isFinite(value))
		)
			throw new RangeError('A reconstruction query requires finite geometry and positive weight.');
		const altitude = Math.max(0, Math.hypot(...point) - spec.planet.bottomRadiusMeters);
		const altitudes = linearStencil(heights, Math.hypot(...point) - spec.planet.bottomRadiusMeters),
			zeniths = linearStencil(angles, (Math.acos(clamp(unit(point)[2], -1, 1)) * 180) / Math.PI),
			outgoing = outgoingStencil(localDirection(point, direction), domains.outgoing.faceWidth);
		const last = angles.length - 1,
			lower = zeniths.indices.length === 2 ? zeniths.indices[0] : Math.min(zeniths.indices[0], last - 1),
			upper = lower + 1,
			solarFraction = zeniths.indices.length === 2 ? zeniths.weights[1] : zeniths.indices[0] === 0 ? 0 : 1;
		const indices = [];
		for (const altitudeIndex of altitudes.indices)
			for (const solarIndex of [Math.max(0, lower - 1), lower, upper, Math.min(last, upper + 1)])
				for (const logical of outgoing.indices) {
					const directionIndex = canonical[logical],
						key = `${altitudeIndex}:${solarIndex}:${directionIndex}`;
					let index = indexes.get(key);
					if (index === undefined) {
						index = coordinates.length;
						indexes.set(key, index);
						coordinates.push({
							x: directionIndex,
							y: solarIndex * heights.length + altitudeIndex,
							altitudeIndex,
							solarIndex,
							directionIndex,
							label: key,
						});
					}
					indices.push(index);
				}
		return {
			point,
			step: weight,
			altitude,
			altitudeWeights: altitudes.weights,
			directionWeights: outgoing.weights,
			solarFraction,
			firstSolarInterval: lower === 0,
			lastSolarInterval: upper === last,
			indices,
		};
	}
	return {coordinates, sample};
}

/** Construct the sparse union in memory from a compact authenticated recipe.
 * Rays retain production scene/X/Y ordering. Quadrature geometry is shared across
 * solar operators; factored weights avoid allocating thirty-two objects per midpoint.
 * @param {SkyBuildRequest} buildRequest - Derived fixed compiler input.
 * @param {readonly SkyScene[]} scenes - Ordered measured conditions.
 * @param {SkyControlInput} input - Numerical controls.
 * @returns {SkyViewPlan} Reproducible sparse support and view operators.
 */
export function prepareViewPlan(buildRequest, scenes, input) {
	const controls = acceptControls(input),
		spec = buildRequest.transportSpec,
		domains = spec.domains;
	if (
		!Array.isArray(scenes) ||
		!scenes.length ||
		scenes.length > 17 ||
		new Set(scenes.map((scene) => scene.id)).size !== scenes.length
	)
		throw new RangeError('One to seventeen unique scenes are required.');
	for (const scene of scenes)
		if (
			!scene.id ||
			!/^\d{2}:\d{2}$/.test(scene.time) ||
			!Number.isFinite(scene.zenithDegrees) ||
			scene.zenithDegrees <= 0 ||
			scene.zenithDegrees >= 180 ||
			!Number.isFinite(scene.fittedAzimuthDegrees)
		)
			throw new RangeError('Invalid registered scene geometry.');
	if (
		domains.position.count !== controls.altitudeCount ||
		domains.outgoing.faceWidth !== controls.outgoingWidth ||
		spec.numerical.sourcePathTransmittanceIntervalCount !== controls.sourceIntervals ||
		spec.numerical.transportIntervalCount !== controls.transportIntervals ||
		spec.atmosphere.ozone.absorptionEnabled
	)
		throw new RangeError('View controls do not match the compiled physical profile.');
	const stencil = createPointStencilBuilder(buildRequest);
	/** @type {SkyViewVariant[]} */ const views = [];
	for (const intervalCount of controls.viewIntervals) {
		/** @type {SkyViewRay[]} */ const rays = [];
		for (const [sceneIndex, scene] of scenes.entries())
			for (let gridX = 0; gridX < 9; gridX++)
				for (let gridY = 0; gridY < 9; gridY++) {
					const ray = benchmarkRay(spec, scene, gridX, gridY);
					/** @type {SkyViewSample[]} */ const samples = [];
					for (const {start, end} of viewPathIntervals(spec, ray, controls.viewRule, intervalCount)) {
						const distance = (start + end) * 0.5;
						const point = /** @type {SkyVector3} */ ([
							ray.origin[0] + ray.direction[0] * distance,
							ray.origin[1] + ray.direction[1] * distance,
							ray.origin[2] + ray.direction[2] * distance,
						]);
						samples.push(stencil.sample(point, ray.direction, end - start));
					}
					rays.push({
						sceneIndex,
						sceneId: scene.id,
						time: scene.time,
						gridX,
						gridY,
						origin: ray.origin,
						worldDirection: ray.direction,
						length: ray.length,
						samples,
					});
				}
		for (const solarInterpolation of controls.solarInterpolations)
			views.push({
				id: `${controls.viewRule === 'quadratic' ? 'q' : 'altitude-segmented-'}${intervalCount}-${solarInterpolation}`,
				viewRule: controls.viewRule,
				intervalCount,
				minimumSampleCount: Math.min(...rays.map((ray) => ray.samples.length)),
				maximumSampleCount: Math.max(...rays.map((ray) => ray.samples.length)),
				solarInterpolation,
				rays,
			});
	}
	return {
		schemaId: 'sky-view-plan-v1',
		coordinates: stencil.coordinates,
		views,
		representations: controls.representations,
		rayCount: scenes.length * 81,
	};
}

/** Interpolate one compact support, retaining production cubic operation order.
 * @param {Float32Array} values - Sparse field.
 * @param {SkyViewSample} sample - Midpoint support.
 * @param {SkySolarInterpolation} interpolation - Solar operator.
 * @returns {number} Reconstructed density.
 */
export function sampleDensity(values, sample, interpolation) {
	let density = 0,
		offset = 0;
	for (const altitudeWeight of sample.altitudeWeights) {
		const solarValues = [];
		for (let solar = 0; solar < 4; solar++) {
			let value = 0;
			for (const weight of sample.directionWeights) value += weight * values[sample.indices[offset++]];
			solarValues.push(value);
		}
		const [previous, lower, upper, next] = solarValues;
		const value =
			interpolation === 'monotone-cubic'
				? solarCubic(
						sample.firstSolarInterval ? undefined : previous,
						lower,
						upper,
						sample.lastSolarInterval ? undefined : next,
						sample.solarFraction,
					)
				: (1 - sample.solarFraction) * lower + sample.solarFraction * upper;
		density += altitudeWeight * value;
	}
	return density;
}

/** Shared midpoint transport, with the production two half-step equation.
 * @param {SkyTransportSpec} spec - Physical model.
 * @param {number} channel - Direct40 index.
 * @param {SkyViewRay} ray - Prepared physical ray.
 * @param {(sample: SkyViewSample) => number} density - Density evaluator.
 * @returns {number} Directional spectral radiance.
 */
export function integrateDensity(spec, channel, ray, density) {
	let radiance = 0,
		transmittance = 1;
	for (const sample of ray.samples) {
		const halfStep = Math.exp(-0.5 * medium(spec, channel, sample.altitude)[0] * sample.step);
		transmittance *= halfStep;
		radiance += transmittance * density(sample) * sample.step;
		transmittance *= halfStep;
	}
	if (!Number.isFinite(radiance) || radiance < 0) throw new RangeError('View integration returned invalid radiance.');
	return radiance;
}

/** Sparse binary64 analytic J1 model, individually rounded to Float32 like field storage.
 * Source attenuation is memoized only at visited altitude/solar knots. This bypasses
 * GPU recurrence and predicts the first-order response before a candidate executes;
 * it remains a CPU reference model, not a promise of GPU arithmetic equivalence.
 * @param {SkyBuildRequest} buildRequest - Candidate physical and numerical input.
 * @param {SkyViewPlan} viewPlan - Candidate sparse support.
 * @param {number} channel - Direct40 index.
 * @returns {Float32Array} Analytic first-order probes in sparse coordinate order.
 */
export function analyticFirstOrderProbes(buildRequest, viewPlan, channel) {
	const spec = buildRequest.transportSpec;
	/** @type {Map<string, SkyDirectKnot>} */ const knots = new Map();
	return Float32Array.from(viewPlan.coordinates, (coordinate) => {
		const key = `${coordinate.altitudeIndex}:${coordinate.solarIndex}`;
		let knot = knots.get(key);
		if (!knot) {
			const angle = (spec.domains.solarZenith.nodes[coordinate.solarIndex].solarZenithDegrees * Math.PI) / 180,
				altitude = spec.domains.position.nodes[coordinate.altitudeIndex].altitudeMeters,
				radius = spec.planet.bottomRadiusMeters + altitude;
			const point = /** @type {SkyVector3} */ ([radius * Math.sin(angle), 0, radius * Math.cos(angle)]);
			knot = {
				point,
				frame: sourceFrame(point),
				coefficients: medium(spec, channel, Math.hypot(...point) - spec.planet.bottomRadiusMeters),
				illumination:
					spec.domains.spectrum.channels[channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
					sourceTransmittance(spec, channel, point),
			};
			knots.set(key, knot);
		}
		const local = spec.domains.outgoing.unitVectors[coordinate.directionIndex],
			axes = knot.frame,
			world = unit(
				[0, 1, 2].map((axis) => axes[0][axis] * local[0] + axes[1][axis] * local[1] + axes[2][axis] * local[2]),
			),
			phases = phase(spec, world[2]);
		return knot.illumination * (knot.coefficients[1] * phases[0] + knot.coefficients[2] * phases[1]);
	});
}

/** Evaluate all actual cumulative stages and named representations for one wavelength.
 * Both cumulative and higher-only fields use left-fold Float32 addition. Nonlinear
 * cubic grouping is explicit; frozen-increment replacement keeps later orders fixed.
 * Flattening is representation, view, order, then scene/X/Y ray.
 * @param {SkyBuildRequest} buildRequest - Fixed compiler request.
 * @param {SkyViewPlan} viewPlan - Sparse support and output operators.
 * @param {number} channel - Direct40 index.
 * @param {readonly Float32Array[]} pureOrders - J1 through J4 in sparse coordinate order.
 * @returns {SkyOrderEvaluation} Compact spectral result.
 */
export function evaluateOrders(buildRequest, viewPlan, channel, pureOrders) {
	const spec = buildRequest.transportSpec,
		count = viewPlan.coordinates.length;
	if (
		!Number.isInteger(channel) ||
		channel < 0 ||
		channel >= 40 ||
		pureOrders.length !== 4 ||
		pureOrders.some((values) => !(values instanceof Float32Array) || values.length !== count)
	)
		throw new RangeError('Four exact sparse Float32 orders and a Direct40 channel are required.');
	for (const field of pureOrders)
		for (const value of field)
			if (!Number.isFinite(value) || value < 0)
				throw new RangeError('Pure scattering fields must be finite and nonnegative.');
	const cumulative = [],
		higher = [];
	for (let order = 0; order < 4; order++) {
		const c = new Float32Array(count),
			h = new Float32Array(count);
		for (let index = 0; index < count; index++) {
			c[index] = order === 0 ? pureOrders[0][index] : cumulative[order - 1][index] + pureOrders[order][index];
			h[index] = order === 0 ? 0 : higher[order - 1][index] + pureOrders[order][index];
		}
		cumulative.push(c);
		higher.push(h);
	}
	const shape = {
			representationCount: viewPlan.representations.length,
			viewCount: viewPlan.views.length,
			orderCount: 4,
			rayCount: viewPlan.rayCount,
		},
		values = new Float64Array(shape.representationCount * shape.viewCount * 4 * shape.rayCount);
	const needsAnalytic = viewPlan.representations.some((representation) => representation.includes('analytic-n1')),
		needsHigher = viewPlan.representations.some(
			(representation) => representation === 'grouped' || representation === 'analytic-n1',
		);
	for (const [viewIndex, view] of viewPlan.views.entries())
		for (const [rayIndex, ray] of view.rays.entries()) {
			const cached = cumulative.map((field) =>
				integrateDensity(spec, channel, ray, (sample) => sampleDensity(field, sample, view.solarInterpolation)),
			);
			const grouped = needsHigher
				? higher.map((field) =>
						integrateDensity(spec, channel, ray, (sample) =>
							sampleDensity(field, sample, view.solarInterpolation),
						),
					)
				: [0, 0, 0, 0];
			const analytic = needsAnalytic
				? integrateDensity(spec, channel, ray, (sample) =>
						directDensity(spec, channel, sample.point, ray.worldDirection),
					)
				: 0;
			for (const [representationIndex, representation] of viewPlan.representations.entries())
				for (let order = 0; order < 4; order++) {
					const value =
						representation === 'cumulative'
							? cached[order]
							: representation === 'grouped'
								? cached[0] + grouped[order]
								: representation === 'analytic-n1'
									? analytic + grouped[order]
									: cached[order] - cached[0] + analytic;
					if (!Number.isFinite(value)) throw new RangeError('Representation produced nonfinite radiance.');
					values[
						((representationIndex * shape.viewCount + viewIndex) * 4 + order) * shape.rayCount + rayIndex
					] = value;
				}
		}
	return {schemaId: 'sky-order-evaluation-v1', channel, shape, values};
}
