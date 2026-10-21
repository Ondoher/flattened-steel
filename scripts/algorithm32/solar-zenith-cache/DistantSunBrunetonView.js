import assert from 'node:assert/strict';
import {getSampleDirection} from '../../experiments/b1-directional-sky-radiance/benchmark-domain.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js';
import {DistantSunSolarInterpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';
import {DistantSunScatteringAccuracy} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';

/** Offline Q30 evaluator for the production compiler qualification, with production W27 reconstruction.
 * The midpoint extinction/density equation is adapted from accepted run 65's B1 view integrator.
 * It is a qualification view, not the application's runtime renderer.
 */
export default class DistantSunBrunetonView {
	/** Compute a three-dimensional dot product. */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}
	/** Normalize a finite nonzero direction. */
	_normalize(vector) {
		const length = Math.hypot(...vector);
		assert.ok(Number.isFinite(length) && length > 0);
		return vector.map((value) => value / length);
	}
	/** Compute a right-handed cross product. */
	_cross(left, right) {
		return [
			left[1] * right[2] - left[2] * right[1],
			left[2] * right[0] - left[0] * right[2],
			left[0] * right[1] - left[1] * right[0],
		];
	}
	/** Resolve clamped linear interpolation on explicit construction nodes. */
	_linear(nodes, value) {
		if (value <= nodes[0]) return [[0, 1]];
		if (value >= nodes.at(-1)) return [[nodes.length - 1, 1]];
		let upper = 1;
		while (nodes[upper] < value) upper++;
		const lower = upper - 1;
		const fraction = (value - nodes[lower]) / (nodes[upper] - nodes[lower]);
		return [
			[lower, 1 - fraction],
			[upper, fraction],
		];
	}
	/** Resolve the receiver-local source frame and production interpolation coordinates. */
	_coordinates(spec, point, direction) {
		const radius = Math.hypot(...point);
		const up = this._normalize(point);
		const cosine = Math.max(-1, Math.min(1, up[2]));
		let horizontal = [0, 0, 1].map((value, axis) => value - cosine * up[axis]);
		if (Math.hypot(...horizontal) <= 1e-12) {
			const reference = [
				[1, 0, 0],
				[0, 1, 0],
				[0, 0, 1],
			].reduce((best, candidate) =>
				Math.abs(this._dot(candidate, up)) < Math.abs(this._dot(best, up)) ? candidate : best,
			);
			horizontal = reference.map((value, axis) => value - this._dot(reference, up) * up[axis]);
		}
		const tangent = this._normalize(horizontal);
		const across = this._normalize(this._cross(up, tangent));
		const unitDirection = this._normalize(direction);
		/** @type {UnitVector3} */
		const local = [
			this._dot(unitDirection, tangent),
			this._dot(unitDirection, across),
			this._dot(unitDirection, up),
		];
		const outgoing = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(local);
		const altitudes = this._linear(
			spec.domains.position.nodes.map((node) => node.altitudeMeters),
			radius - spec.planet.bottomRadiusMeters,
		);
		const zeniths = this._linear(
			spec.domains.solarZenith.nodes.map((node) => node.solarZenithDegrees),
			(Math.acos(cosine) * 180) / Math.PI,
		);
		return {altitudes, zeniths, outgoing, local};
	}
	/** Resolve one accepted physical query in its own solar row's outgoing grid.
	 * @param {DistantSunSceneCacheTransportSpec} spec - Accepted construction specification.
	 * @param {UnitVector3} local - Physical receiver-local direction.
	 * @param {number} zenithIndex - Actual interpolation tap, not the query's solar angle.
	 * @returns {ScatteringCacheDirectionStencil} - Bilinear logical direction support.
	 */
	_outgoing(spec, local, zenithIndex) {
		const theta = (spec.domains.solarZenith.nodes[zenithIndex].solarZenithDegrees * Math.PI) / 180;
		return CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(
			DistantSunScatteringAccuracy.map(
				local,
				[Math.sin(theta), 0, Math.cos(theta)],
				spec.numerical.scatteringAccuracy ?? 'legacy',
				true,
			),
		);
	}
	/** Resolve the unchanged linear control in expanded scene-row order. */
	_taps(spec, ledger, point, direction) {
		const {altitudes, zeniths, local} = this._coordinates(spec, point, direction);
		const taps = [];
		for (const [altitudeIndex, altitudeWeight] of altitudes)
			for (const [zenithIndex, zenithWeight] of zeniths) {
				const outgoing = this._outgoing(spec, local, zenithIndex);
				const row = ledger.rows[altitudeIndex];
				assert.ok(
					row && zenithIndex >= row.firstSolarZenithIndex && zenithIndex <= row.lastSolarZenithIndex,
					'Q30 query escaped the compiled scene ledger.',
				);
				const packedRow = row.firstPackedRow + zenithIndex - row.firstSolarZenithIndex;
				for (const [ordinal, directionIndex] of outgoing.indices.entries()) {
					taps.push({
						index: packedRow * 4374 + directionIndex,
						weight: altitudeWeight * zenithWeight * outgoing.weights[ordinal],
					});
				}
			}
		return taps;
	}
	/** Resolve complete cubic stencils in shared-coordinate, unique-direction order.
	 * @param {DistantSunSceneCacheTransportSpec} spec - Declared construction domains.
	 * @param {DistantSunPointLocalPackageRecord} packet - Authenticated packet with cubic halo rows.
	 * @param {Map<string, number>} indexes - Shared coordinate to packed row mapping.
	 * @param {number[]} point - World position in meters.
	 * @param {number[]} direction - World view direction.
	 * @returns {BrunetonQualificationCubicAltitude[]} - Directional taps for each solar knot, then altitude weights.
	 */
	_cubic(spec, packet, indexes, point, direction) {
		const {altitudes, zeniths, local} = this._coordinates(spec, point, direction);
		const last = spec.domains.solarZenith.nodes.length - 1;
		const lower = zeniths.length === 2 ? zeniths[0][0] : Math.min(zeniths[0][0], last - 1);
		const fraction = zeniths.length === 2 ? zeniths[1][1] : zeniths[0][0] === 0 ? 0 : 1;
		const upper = lower + 1;
		return altitudes.map(([altitudeIndex, weight]) => {
			const at = (zenithIndex) => {
				const outgoing = this._outgoing(spec, local, zenithIndex);
				const row = indexes.get(`${altitudeIndex}:${zenithIndex}`);
				assert.ok(row !== undefined, 'Q30 cubic query lacks required interior support.');
				return outgoing.indices.map((logical, ordinal) => ({
					index:
						row * packet.layout.uniqueDirectionCount +
						CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.logicalToUniqueDirectionIndices[logical],
					weight: outgoing.weights[ordinal],
				}));
			};
			return {
				weight,
				fraction,
				previous: lower === 0 ? undefined : at(lower - 1),
				lower: at(lower),
				upper: at(upper),
				next: upper === last ? undefined : at(upper + 1),
			};
		});
	}
	/** Construct one benchmark ray in the canonical world with the source along +Z. */
	_ray(spec, scene, fittedAzimuthDegrees, gridX, gridY) {
		const sample = getSampleDirection(gridX, gridY);
		const local = [
			Math.sin(sample.zenithRadians) * Math.cos(sample.azimuthRadians),
			Math.sin(sample.zenithRadians) * Math.sin(sample.azimuthRadians),
			Math.cos(sample.zenithRadians),
		];
		const theta = (scene.zenithDegrees * Math.PI) / 180;
		const azimuth = (fittedAzimuthDegrees * Math.PI) / 180;
		const up = [Math.sin(theta), 0, Math.cos(theta)];
		const tangent = this._normalize([0, 0, 1].map((value, axis) => value - Math.cos(theta) * up[axis]));
		const across = this._normalize(this._cross(up, tangent));
		const alongSource = this._dot(local, [Math.cos(azimuth), Math.sin(azimuth), 0]);
		const acrossSource = this._dot(local, [-Math.sin(azimuth), Math.cos(azimuth), 0]);
		const direction = this._normalize(
			up.map((value, axis) => local[2] * value + alongSource * tangent[axis] + acrossSource * across[axis]),
		);
		const origin = up.map((value) => value * spec.planet.bottomRadiusMeters);
		const projection = this._dot(origin, direction);
		const discriminant = projection * projection - (this._dot(origin, origin) - spec.planet.topRadiusMeters ** 2);
		assert.ok(discriminant >= 0);
		const root = Math.sqrt(discriminant);
		const length = [-projection - root, -projection + root].find((value) => value > 1e-3);
		assert.ok(Number.isFinite(length) && length > 0);
		return {origin, direction, length};
	}
	/**
	 * Call this method to prepare Q30 geometry and interpolation weights for every requested B1 ray.
	 * An explicit diagnostic selection must exactly match the packet; omission requires all 17 scenes.
	 *
	 * @param {DistantSunPointLocalPackageRecord} packet - Authenticated production Direct40 package.
	 * @param {BrunetonQualificationScene[]} scenes - Authenticated capture times and fitted azimuths in package order.
	 * @param {BrunetonQualificationPreparationOptions} [options] - Optional bounded diagnostic selection.
	 * @returns {BrunetonQualificationSample[][][]} - Scene, direction, interval samples.
	 */
	prepare(packet, scenes, options = {}) {
		const spec = packet.buildRequest.transportSpec;
		const cubic = spec.numerical.solarInterpolation === 'monotone-cubic';
		assert.ok(
			spec.numerical.solarInterpolation === undefined ||
				['linear', 'monotone-cubic'].includes(spec.numerical.solarInterpolation),
			'Q30 solar interpolation method is unsupported.',
		);
		const indexes = cubic
			? new Map(packet.coordinates.map((coordinate, index) => [coordinate.join(':'), index]))
			: null;
		if (cubic) {
			assert.equal(indexes.size, packet.coordinates.length);
			assert.equal(
				packet.layout.uniqueDirectionCount,
				CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.uniqueDirectionCount,
			);
		}
		assert.equal(spec.atmosphere.ozone.absorptionEnabled, false);
		assert.equal(packet.layout.logicalDirectionCount, 4374);
		const expectedWavelengths = options.wavelengthIndexes ?? Array.from({length: 40}, (_unused, index) => index);
		assert.ok(expectedWavelengths.length > 0 && expectedWavelengths.length <= 40);
		assert.equal(new Set(expectedWavelengths).size, expectedWavelengths.length);
		assert.ok(expectedWavelengths.every((index) => Number.isInteger(index) && index >= 0 && index < 40));
		assert.equal(packet.layout.channelCount, expectedWavelengths.length);
		if (options.sceneIds === undefined) {
			assert.equal(packet.scenes.length, 17, 'Full Bruneton preparation requires all 17 scenes.');
		} else {
			assert.ok(
				Array.isArray(options.sceneIds) && options.sceneIds.length > 0 && options.sceneIds.length <= 17,
				'Bounded Bruneton preparation requires an explicit nonempty selection of at most 17 scenes.',
			);
			assert.equal(new Set(options.sceneIds).size, options.sceneIds.length, 'Bounded scene IDs must be unique.');
			assert.deepEqual(
				packet.scenes.map((scene) => scene.request.id),
				options.sceneIds,
			);
		}
		assert.equal(scenes.length, packet.scenes.length);
		assert.deepEqual(packet.layout.wavelengthIndexes, expectedWavelengths);
		return packet.scenes.map((scene, sceneIndex) => {
			assert.equal(scene.request.id, scenes[sceneIndex].id);
			assert.equal(scene.request.observerAltitudeMeters, 0);
			assert.ok(Number.isFinite(scenes[sceneIndex].fittedAzimuthDegrees));
			return Array.from({length: 81}, (_unused, directionIndex) => {
				const ray = this._ray(
					spec,
					scene.request,
					scenes[sceneIndex].fittedAzimuthDegrees,
					Math.floor(directionIndex / 9),
					directionIndex % 9,
				);
				return Array.from({length: 30}, (_unused, interval) => {
					const start = ray.length * (interval / 30) * (interval / 30);
					const end = ray.length * ((interval + 1) / 30) * ((interval + 1) / 30);
					const distance = (start + end) * 0.5;
					const point = ray.origin.map((value, axis) => value + ray.direction[axis] * distance);
					return {
						step: end - start,
						altitude: Math.max(0, Math.hypot(...point) - spec.planet.bottomRadiusMeters),
						...(cubic
							? {cubic: this._cubic(spec, packet, indexes, point, ray.direction)}
							: {taps: this._taps(spec, scene.ledger, point, ray.direction)}),
					};
				});
			});
		});
	}
	/**
	 * Integrate one channel with midpoint density and two half-step extinction factors.
	 * @param {Float32Array} values - Linear: expanded scene logical rows; cubic: shared unique-direction rows, one wavelength.
	 * @param {BrunetonQualificationSample[]} samples - Q30 intervals for one view ray.
	 * @param {DistantSunSceneCacheCompilerBuildRequest} buildRequest - Explicit atmosphere and spectrum.
	 * @param {number} channelIndex - Direct40 wavelength index.
	 * @returns {number} - Directional radiance in W m^-2 sr^-1 nm^-1.
	 */
	integrate(values, samples, buildRequest, channelIndex) {
		const spec = buildRequest.transportSpec;
		const channel = spec.domains.spectrum.channels[channelIndex];
		let radiance = 0;
		let transmittance = 1;
		for (const sample of samples) {
			const extinction =
				channel.rayleighScatteringPerMeter *
					Math.exp(-sample.altitude / spec.atmosphere.rayleighScaleHeightMeters) +
				channel.mieExtinctionPerMeter * Math.exp(-sample.altitude / spec.atmosphere.mieScaleHeightMeters);
			const halfStep = Math.exp(-0.5 * extinction * sample.step);
			transmittance *= halfStep;
			const density = sample.cubic
				? sample.cubic.reduce((sum, altitude) => {
						const directionSample = (taps) =>
							taps?.reduce((value, tap) => value + tap.weight * values[tap.index], 0);
						return (
							sum +
							altitude.weight *
								DistantSunSolarInterpolation.sample(
									directionSample(altitude.previous),
									directionSample(altitude.lower),
									directionSample(altitude.upper),
									directionSample(altitude.next),
									altitude.fraction,
								)
						);
					}, 0)
				: sample.taps.reduce((sum, tap) => sum + tap.weight * values[tap.index], 0);
			radiance += transmittance * density * sample.step;
			transmittance *= halfStep;
		}
		assert.ok(Number.isFinite(radiance) && radiance >= 0, 'Q30 integration returned invalid radiance.');
		return radiance;
	}
}
