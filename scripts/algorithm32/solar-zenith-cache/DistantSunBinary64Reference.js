import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';

/** Independent binary64 evaluation of selected receiver-local recurrence dependencies.
 * This qualification owner never consumes GPU fields. Memoization stores only
 * values reached from requested probes, in bounded domain-sized numeric arrays.
 */
export default class DistantSunBinary64Reference {
	/** Construct a reference for one accepted physical profile and spectral channel.
	 * @param {DistantSunSceneCacheCompilerBuildRequest} buildRequest - Complete physical profile.
	 * @param {number} channelIndex - Selected spectral channel.
	 * @param {(event: StrobingReferenceProgress) => void} [progress] - Bounded progress observations.
	 */
	constructor(buildRequest, channelIndex, progress = () => {}) {
		this.spec = buildRequest.transportSpec;
		if (
			(this.spec.shaderProfile?.coordinateContract ?? 'scene-cache-receiver-local-v1') !==
			'scene-cache-receiver-local-v1'
		)
			throw new Error('Binary64 reference requires receiver-local coordinates.');
		const domains = this.spec.domains;
		this.heights = domains.position.nodes.map((node) => node.altitudeMeters);
		this.angles = domains.solarZenith.nodes.map((node) => node.solarZenithDegrees);
		this.incoming = domains.incoming.unitVectors;
		this.weights = domains.incoming.integrationWeightsSteradians;
		this.outgoing = domains.outgoing.unitVectors;
		this.channel = domains.spectrum.channels[channelIndex];
		this.bottom = this.spec.planet.bottomRadiusMeters;
		this.top = this.spec.planet.topRadiusMeters;
		const atmosphere = this.spec.atmosphere,
			wavelength = this.channel.centerNanometers / 1000;
		this.rayleigh =
			this.channel.rayleighScatteringPerMeter ?? atmosphere.rayleighCoefficientScalePerMeter * wavelength ** -4;
		this.mie =
			this.channel.mieExtinctionPerMeter ??
			(atmosphere.mieAngstromBeta / atmosphere.mieScaleHeightMeters) * wavelength ** -atmosphere.mieAngstromAlpha;
		this.albedo = this.channel.groundAlbedo ?? 0;
		this.source = this.channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer;
		this.pointCount = this.heights.length * this.angles.length;
		this.direct = new Float64Array(this.pointCount * 2).fill(NaN);
		this.radiances = Array.from({length: 3}, () =>
			new Float64Array(this.pointCount * this.incoming.length).fill(NaN),
		);
		this.densities = Array.from({length: 2}, () =>
			new Float64Array(this.pointCount * this.outgoing.length).fill(NaN),
		);
		this.rayleighPhase = new Float64Array(this.outgoing.length * this.incoming.length);
		this.miePhase = new Float64Array(this.rayleighPhase.length);
		for (let outgoing = 0; outgoing < this.outgoing.length; outgoing++)
			for (let incoming = 0; incoming < this.incoming.length; incoming++) {
				const [rayleigh, mie] = this.phase(this.dot(this.outgoing[outgoing], this.incoming[incoming]));
				const index = outgoing * this.incoming.length + incoming;
				this.rayleighPhase[index] = rayleigh * this.weights[incoming];
				this.miePhase[index] = mie * this.weights[incoming];
			}
		this.progress = progress;
		this.evaluations = 0;
		this.lastProgress = performance.now();
	}

	/** Return a dot product without intermediate Float32 conversion. */
	dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}
	/** Normalize a finite direction. */
	unit(vector) {
		const length = Math.hypot(...vector);
		return vector.map((value) => value / length);
	}
	/** Return the analytic phase pair for one direction cosine. */
	phase(cosine) {
		const g = this.spec.atmosphere.miePhaseFunctionG;
		return [
			(3 / (16 * Math.PI)) * (1 + cosine * cosine),
			((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * (1 + cosine * cosine)) /
				Math.max(1 + g * g - 2 * g * cosine, 1e-7) ** 1.5,
		];
	}
	/** Return extinction and separate scattering coefficients at the logical height. */
	medium(height) {
		const atmosphere = this.spec.atmosphere;
		const rayleigh = this.rayleigh * Math.exp(-Math.max(0, height) / atmosphere.rayleighScaleHeightMeters);
		const mie = this.mie * Math.exp(-Math.max(0, height) / atmosphere.mieScaleHeightMeters);
		return [rayleigh + mie, rayleigh, mie * atmosphere.mieSingleScatteringAlbedo];
	}
	/** Construct an exact logical radius on one solar meridian. */
	point(position, zenith) {
		const angle = (this.angles[zenith] * Math.PI) / 180,
			radius = this.bottom + this.heights[position];
		return [radius * Math.sin(angle), 0, radius * Math.cos(angle)];
	}
	/** Resolve local source-facing axes used by the declared receiver-local domain. */
	frame(point) {
		const up = this.unit(point),
			cosine = up[2];
		const along = this.unit([-cosine * up[0], -cosine * up[1], 1 - cosine * up[2]]);
		const across = [
			up[1] * along[2] - up[2] * along[1],
			up[2] * along[0] - up[0] * along[2],
			up[0] * along[1] - up[1] * along[0],
		];
		return [along, across, up];
	}
	/** Transform a local direction through the source-facing frame. */
	world(point, local) {
		const axes = this.frame(point);
		return this.unit(
			[0, 1, 2].map((axis) => axes[0][axis] * local[0] + axes[1][axis] * local[1] + axes[2][axis] * local[2]),
		);
	}
	/** Compute a stable forward boundary root, including a declared surface hit. */
	boundary(point, direction, radius, projection = this.dot(point, direction), originRadius = Math.hypot(...point)) {
		const constant = (originRadius - radius) * (originRadius + radius),
			discriminant = projection * projection - constant;
		if (discriminant < 0) return Infinity;
		const root = Math.sqrt(discriminant),
			far = -projection - (projection >= 0 ? root : -root),
			near = far === 0 ? 0 : constant / far;
		return [near, far].sort((a, b) => a - b).find((value) => value > 1e-3) ?? Infinity;
	}
	/** Return direct-source visibility with a binary64 surface-rounding bound. */
	visible(point) {
		const radius = Math.hypot(...point),
			height = Math.max(0, radius - this.bottom);
		if (height <= 4 * Number.EPSILON * this.bottom) return point[2] >= 0;
		return point[2] >= 0 || point[2] * point[2] < height * (radius + this.bottom);
	}
	/** Integrate the independently evaluated binary64 source optical depth. */
	transmittance(point) {
		if (!this.visible(point)) return 0;
		const length = this.boundary(point, [0, 0, 1], this.top),
			count = this.spec.numerical.sourcePathTransmittanceIntervalCount;
		if (!Number.isFinite(length)) return 1;
		const step = length / count;
		let depth = 0;
		for (let index = 0; index <= count; index++)
			depth +=
				(index === 0 || index === count ? 0.5 : 1) *
				step *
				this.medium(Math.hypot(point[0], point[1], point[2] + index * step) - this.bottom)[0];
		return Math.exp(-depth);
	}
	/** Evaluate direct density at an arbitrary physical point and world direction. */
	directDensity(point, direction) {
		const medium = this.medium(Math.hypot(...point) - this.bottom),
			phase = this.phase(direction[2]);
		return this.source * this.transmittance(point) * (medium[1] * phase[0] + medium[2] * phase[1]);
	}
	/** Resolve a clamped linear domain stencil. */
	stencil(nodes, value) {
		if (value <= nodes[0]) return [[0, 1]];
		if (value >= nodes.at(-1)) return [[nodes.length - 1, 1]];
		let upper = 1;
		while (nodes[upper] < value) upper++;
		const fraction = (value - nodes[upper - 1]) / (nodes[upper] - nodes[upper - 1]);
		return [
			[upper - 1, 1 - fraction],
			[upper, fraction],
		];
	}
	/** Evaluate a selected discrete density without any GPU parent field. */
	density(order, position, zenith, outgoing) {
		const pointIndex = zenith * this.heights.length + position;
		if (order === 1) {
			if (Number.isNaN(this.direct[pointIndex * 2])) {
				const medium = this.medium(this.heights[position]),
					direct = this.source * this.transmittance(this.point(position, zenith));
				this.direct[pointIndex * 2] = direct * medium[1];
				this.direct[pointIndex * 2 + 1] = direct * medium[2];
			}
			const angle = (this.angles[zenith] * Math.PI) / 180,
				phase = this.phase(this.dot(this.outgoing[outgoing], [Math.sin(angle), 0, Math.cos(angle)]));
			return this.direct[pointIndex * 2] * phase[0] + this.direct[pointIndex * 2 + 1] * phase[1];
		}
		const index = pointIndex * this.outgoing.length + outgoing,
			cache = this.densities[order - 2];
		if (cache && !Number.isNaN(cache[index])) return cache[index];
		const medium = this.medium(this.heights[position]);
		let rayleigh = 0,
			mie = 0;
		for (let incoming = 0; incoming < this.incoming.length; incoming++) {
			const value = this.radiance(order - 1, position, zenith, incoming),
				phaseIndex = outgoing * this.incoming.length + incoming;
			rayleigh += value * this.rayleighPhase[phaseIndex];
			mie += value * this.miePhase[phaseIndex];
		}
		const value = medium[1] * rayleigh + medium[2] * mie;
		if (!Number.isFinite(value) || value < 0)
			throw new Error('Binary64 density reference is nonfinite or negative.');
		if (cache) cache[index] = value;
		return value;
	}
	/** Reconstruct a previous density with the exact declared spatial/angular domains. */
	sampleDensity(order, point, direction) {
		const radius = Math.hypot(...point),
			axes = this.frame(point);
		const outgoing = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil([
			this.dot(direction, axes[0]),
			this.dot(direction, axes[1]),
			this.dot(direction, axes[2]),
		]);
		const positions = this.stencil(this.heights, radius - this.bottom),
			zeniths = this.stencil(
				this.angles,
				(Math.acos(Math.max(-1, Math.min(1, point[2] / radius))) * 180) / Math.PI,
			);
		let value = 0;
		for (const [position, wp] of positions)
			for (const [zenith, wz] of zeniths)
				for (let tap = 0; tap < outgoing.indices.length; tap++) {
					const weight = wp * wz * outgoing.weights[tap];
					if (weight > 0) value += weight * this.density(order, position, zenith, outgoing.indices[tap]);
				}
		return value;
	}
	/** Split transport at closest approach and shadow-cylinder visibility transitions. */
	breaks(origin, direction, length) {
		const candidates = [];
		const a = direction[0] ** 2 + direction[1] ** 2,
			b = 2 * (origin[0] * direction[0] + origin[1] * direction[1]),
			c = origin[0] ** 2 + origin[1] ** 2 - this.bottom ** 2;
		if (Math.abs(a) > 1e-15) {
			const discriminant = b * b - 4 * a * c;
			if (discriminant >= 0)
				candidates.push((-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a));
		} else if (Math.abs(b) > 1e-15) candidates.push(-c / b);
		const points = [0];
		const tangent = -this.dot(origin, direction);
		if (tangent > 1e-3 && tangent < length - 1e-3) points.push(tangent);
		for (const distance of candidates)
			if (distance > 1e-3 && distance < length - 1e-3) {
				const delta = Math.min(1, distance / 4, (length - distance) / 4);
				if (
					this.visible(origin.map((value, axis) => value + direction[axis] * (distance - delta))) !==
						this.visible(origin.map((value, axis) => value + direction[axis] * (distance + delta))) &&
					points.every((value) => Math.abs(value - distance) > 0.01)
				)
					points.push(distance);
			}
		return [...points, length].sort((a, b) => a - b);
	}
	/** Integrate one pure radiance order using recursively independent prior density. */
	radiance(order, position, zenith, incoming) {
		const index = (zenith * this.heights.length + position) * this.incoming.length + incoming,
			cache = this.radiances[order - 1];
		if (!Number.isNaN(cache[index])) return cache[index];
		this.evaluations++;
		if (this.evaluations % 1024 === 0 && performance.now() - this.lastProgress > 10000) {
			this.lastProgress = performance.now();
			this.progress({evaluations: this.evaluations, order});
		}
		const origin = this.point(position, zenith),
			direction = this.world(origin, this.incoming[incoming]);
		if (this.heights[position] === 0 && this.incoming[incoming][2] < 0) return (cache[index] = 0);
		const projection = (this.bottom + this.heights[position]) * this.incoming[incoming][2];
		const originRadius = this.bottom + this.heights[position];
		const ground = this.boundary(origin, direction, this.bottom, projection, originRadius),
			top = this.boundary(origin, direction, this.top, projection, originRadius),
			length = Math.min(ground, top);
		if (!(length > 0 && Number.isFinite(length))) return (cache[index] = 0);
		const boundaries = this.breaks(origin, direction, length),
			count = this.spec.numerical.transportIntervalCount;
		let transmittance = 1,
			radiance = 0;
		for (let segment = 1; segment < boundaries.length; segment++) {
			const step = (boundaries[segment] - boundaries[segment - 1]) / count;
			let previousExtinction = 0;
			for (let sample = 0; sample <= count; sample++) {
				const distance = boundaries[segment - 1] + sample * step,
					point = origin.map((value, axis) => value + direction[axis] * distance);
				const extinction = this.medium(Math.hypot(...point) - this.bottom)[0];
				if (sample > 0) transmittance *= Math.exp(-0.5 * (previousExtinction + extinction) * step);
				const density =
					order === 1 ? this.directDensity(point, direction) : this.sampleDensity(order, point, direction);
				radiance += transmittance * density * step * (sample === 0 || sample === count ? 0.5 : 1);
				previousExtinction = extinction;
			}
		}
		if (ground < Infinity && Math.abs(ground - length) <= 1 && this.albedo > 0) {
			const point = origin.map((value, axis) => value + direction[axis] * length),
				up = this.unit(point);
			let irradiance = 0;
			if (order === 1) irradiance = this.source * this.transmittance(point) * Math.max(0, up[2]);
			else {
				const zeniths = this.stencil(
					this.angles,
					(Math.acos(Math.max(-1, Math.min(1, up[2]))) * 180) / Math.PI,
				);
				for (let incoming = 0; incoming < this.incoming.length; incoming++)
					for (const [zenith, weight] of zeniths)
						if (weight > 0)
							irradiance +=
								weight *
								this.radiance(order - 1, 0, zenith, incoming) *
								Math.max(0, this.incoming[incoming][2]) *
								this.weights[incoming];
			}
			radiance += (transmittance * irradiance * this.albedo) / Math.PI;
		}
		if (!Number.isFinite(radiance) || radiance < 0)
			throw new Error('Binary64 radiance reference is nonfinite or negative.');
		return (cache[index] = radiance);
	}
}
