import {
	FIBONACCI_REFERENCE_SWITCH_DOT,
	SCATTERING_CACHE_Y_AXIS,
	SCATTERING_CACHE_Z_AXIS,
} from '../../../src/algorithm32/implementation/spherical-earth/consts.js';

/** Benchmark-owned Bruneton-scale angular integration domain. */
export class BrunetonAngularIntegrationDirectionDomain {
	/** Incoming-domain identity. @readonly @type {string} */
	id;
	/** Number of incoming directions. @readonly @type {number} */
	directionCount;
	/** Number of exact antipodal pairs. @readonly @type {number} */
	pairCount;
	/** Source-local unit directions. @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** Solid-angle integration weights. @readonly @type {SolidAngleWeights} */
	integrationWeights;

	/**
	 * Creates an even polar-by-azimuth midpoint grid derived from Bruneton's
	 * scattering-density integral. Directions are expressed in Algorithm32's source-local frame, but the grid's polar axis remains the physical local zenith and its azimuth origin remains the Sun-zenith plane.
	 *
	 * @param {UnitVector3} directionToSource - Physical direction to the Sun.
	 * @param {UnitVector3} localZenith - Physical local zenith.
	 * @param {{polarSampleCount: number, azimuthSampleCount: number}} sampleCounts - Even grid dimensions; azimuth count must be divisible by four.
	 */
	constructor(directionToSource, localZenith, sampleCounts) {
		const {polarSampleCount, azimuthSampleCount} = sampleCounts;
		if (
			!Number.isInteger(polarSampleCount) ||
			polarSampleCount < 2 ||
			polarSampleCount % 2 !== 0 ||
			!Number.isInteger(azimuthSampleCount) ||
			azimuthSampleCount < 4 ||
			azimuthSampleCount % 4 !== 0
		) {
			throw new RangeError(
				'Bruneton angular sample counts require an even polar count and azimuth count divisible by four.',
			);
		}
		const sourceFrame = this._createSourceFrame(directionToSource);
		const solarTangent = this._normalize(
			this._subtract(directionToSource, this._scale(localZenith, this._dot(directionToSource, localZenith))),
		);
		const solarPlaneNormal = this._normalize(this._cross(localZenith, solarTangent));
		const polarStep = Math.PI / polarSampleCount;
		const azimuthStep = (2 * Math.PI) / azimuthSampleCount;
		const unitVectors = [];
		const rawWeights = [];

		for (let polarIndex = 0; polarIndex < polarSampleCount / 2; polarIndex += 1) {
			const polarAngle = (polarIndex + 0.5) * polarStep;
			const polarCosine = Math.cos(polarAngle);
			const polarSine = Math.sin(polarAngle);
			const rawWeight = polarStep * azimuthStep * polarSine;
			for (let azimuthIndex = 0; azimuthIndex < azimuthSampleCount / 2; azimuthIndex += 1) {
				const azimuth = (azimuthIndex + 0.5) * azimuthStep;
				const positivePhysical = this._normalize(
					this._add(
						this._scale(localZenith, polarCosine),
						this._scale(solarTangent, polarSine * Math.cos(azimuth)),
						this._scale(solarPlaneNormal, polarSine * Math.sin(azimuth)),
					),
				);
				const reflectedPhysical = this._normalize(
					this._add(
						this._scale(localZenith, polarCosine),
						this._scale(solarTangent, polarSine * Math.cos(azimuth)),
						this._scale(solarPlaneNormal, -polarSine * Math.sin(azimuth)),
					),
				);
				const positive = this._expressInFrame(positivePhysical, sourceFrame);
				const reflected = this._expressInFrame(reflectedPhysical, sourceFrame);
				unitVectors.push(positive, reflected, this._scaleUnit(positive, -1), this._scaleUnit(reflected, -1));
				rawWeights.push(rawWeight, rawWeight, rawWeight, rawWeight);
			}
		}

		const normalization = (4 * Math.PI) / rawWeights.reduce((sum, weight) => sum + weight, 0);
		this.id = `b1-diagnostic-bruneton-angular-${polarSampleCount}x${azimuthSampleCount}-v1`;
		this.directionCount = polarSampleCount * azimuthSampleCount;
		this.pairCount = this.directionCount / 2;
		this.unitVectors = unitVectors;
		this.integrationWeights = {
			values: rawWeights.map((weight) => weight * normalization),
			units: 'steradians',
		};
	}

	/** @param {readonly number[]} left - First vector. @param {readonly number[]} right - Second vector. @returns {number} - Dot product. */
	_dot(left, right) {
		return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
	}

	/** @param {readonly number[]} left - First vector. @param {readonly number[]} right - Second vector. @returns {UnitVector3} - Cross product. */
	_cross(left, right) {
		return [
			left[1] * right[2] - left[2] * right[1],
			left[2] * right[0] - left[0] * right[2],
			left[0] * right[1] - left[1] * right[0],
		];
	}

	/** @param {readonly number[]} left - First vector. @param {readonly number[]} right - Second vector. @returns {UnitVector3} - Sum. */
	_add(left, right) {
		return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
	}

	/** @param {readonly number[]} left - First vector. @param {readonly number[]} right - Second vector. @returns {UnitVector3} - Difference. */
	_subtract(left, right) {
		return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
	}

	/** @param {readonly number[]} vector - Vector. @param {number} scalar - Scale. @returns {UnitVector3} - Scaled vector. */
	_scale(vector, scalar) {
		return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
	}

	/** @param {UnitVector3} vector - Unit vector. @param {number} scalar - Signed unit scale. @returns {UnitVector3} - Scaled unit vector. */
	_scaleUnit(vector, scalar) {
		return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
	}

	/** @param {readonly number[]} vector - Nonzero vector. @returns {UnitVector3} - Unit vector. */
	_normalize(vector) {
		const length = Math.hypot(vector[0], vector[1], vector[2]);
		return [vector[0] / length, vector[1] / length, vector[2] / length];
	}

	/** @param {UnitVector3} directionToSource - Physical source axis. @returns {ScatteringCacheDirectionFrame} - Algorithm32 source frame. */
	_createSourceFrame(directionToSource) {
		const reference =
			Math.abs(this._dot(directionToSource, SCATTERING_CACHE_Z_AXIS)) < FIBONACCI_REFERENCE_SWITCH_DOT
				? SCATTERING_CACHE_Z_AXIS
				: SCATTERING_CACHE_Y_AXIS;
		const zAxis = this._normalize(
			this._subtract(reference, this._scale(directionToSource, this._dot(reference, directionToSource))),
		);
		return {
			xAxis: directionToSource,
			yAxis: this._normalize(this._cross(zAxis, directionToSource)),
			zAxis,
		};
	}

	/** @param {UnitVector3} physicalDirection - Physical direction. @param {ScatteringCacheDirectionFrame} frame - Source frame. @returns {UnitVector3} - Source-local direction. */
	_expressInFrame(physicalDirection, frame) {
		return this._normalize([
			this._dot(physicalDirection, frame.xAxis),
			this._dot(physicalDirection, frame.yAxis),
			this._dot(physicalDirection, frame.zAxis),
		]);
	}
}
