import DistanceMath from '../../math/DistanceMath.js';
import {GeometryDirections} from '../../geometry-support/GeometryDirections.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';

/** Geometry-owned immutable horizontal rigid map between a live frame and its canonical cache.
 *
 * @implements {FlatLocalCacheTransformCapability}
 */
export class FlatLocalCacheTransform {
	/** Accepted canonical and live source centers. @type {FlatLocalCacheTransformDefinition} */
	_definition;
	/** Horizontal inverse-rotation cosine. @type {number} */
	_cosine;
	/** Horizontal inverse-rotation sine. @type {number} */
	_sine;

	/** Creates a height-preserving physical map; differing source heights require reconstruction.
	 *
	 * @param {FlatLocalCacheTransformDefinition} definition - Paired source centers and horizontal rotation in radians.
	 * @throws {RangeError} - Height or rotation is invalid.
	 */
	constructor(definition) {
		DistanceMath.assertPosition(definition.canonicalSource, 'Canonical cache source');
		DistanceMath.assertPosition(definition.liveSource, 'Live cache source');
		const canonical = DistanceMath.toMetersPosition(definition.canonicalSource);
		const live = DistanceMath.toMetersPosition(definition.liveSource);
		if (canonical[2] !== live[2] || !Number.isFinite(definition.rotationRadians))
			throw new RangeError('Cache reuse requires equal source height and a finite horizontal rotation.');
		this._definition = {
			canonicalSource: {
				coordinates: [...canonical],
				units: 'meters',
			},
			liveSource: {
				coordinates: [...live],
				units: 'meters',
			},
			rotationRadians: definition.rotationRadians,
		};
		this._cosine = Math.cos(definition.rotationRadians);
		this._sine = Math.sin(definition.rotationRadians);
	}

	/** Call this method to map a physical point into the canonical source-centered cache.
	 *
	 * @param {Position} position - Unit-bearing live point.
	 * @returns {Position} - Canonical physical point; no support clamp is applied.
	 */
	toCanonicalPosition(position) {
		DistanceMath.assertPosition(position, 'Live cache query');
		const point = DistanceMath.toMetersPosition(position);
		const live = this._definition.liveSource.coordinates;
		const canonical = this._definition.canonicalSource.coordinates;
		const x = point[0] - live[0],
			y = point[1] - live[1];
		return DistanceMath.positionInMeters([
			canonical[0] + this._cosine * x + this._sine * y,
			canonical[1] - this._sine * x + this._cosine * y,
			point[2],
		]);
	}

	/** Call this method to express a unit outgoing direction in the same canonical frame.
	 *
	 * @param {UnitVector3} direction - Physical live direction.
	 * @returns {UnitVector3} - Rotated unit direction.
	 */
	toCanonicalDirection(direction) {
		GeometryDirections.directionTuple(direction, 'Live cache direction');
		if (Math.abs(Math.hypot(...direction) - 1) > 1e-10) throw new RangeError('Unit cache direction required.');
		return [
			this._cosine * direction[0] + this._sine * direction[1],
			-this._sine * direction[0] + this._cosine * direction[1],
			direction[2],
		];
	}

	/** Call this method to map a canonical support point back into the live frame.
	 *
	 * @param {Position} position - Canonical point.
	 * @returns {Position} - Physical live point.
	 */
	toLivePosition(position) {
		DistanceMath.assertPosition(position, 'Canonical cache query');
		const point = DistanceMath.toMetersPosition(position);
		const live = this._definition.liveSource.coordinates;
		const canonical = this._definition.canonicalSource.coordinates;
		const x = point[0] - canonical[0],
			y = point[1] - canonical[1];
		return DistanceMath.positionInMeters([
			live[0] + this._cosine * x - this._sine * y,
			live[1] + this._sine * x + this._cosine * y,
			point[2],
		]);
	}

	/** Call this method to contribute the same geometry-owned map to ordinary cache lookup.
	 *
	 * @returns {readonly ShaderSourceBlock[]} - Immutable shader functions; physical fields remain unchanged.
	 */
	createShaderFunctions() {
		return [
			ShaderContributions.createShaderSourceBlock(
				'flat-local-live-cache-transform',
				'sampleScatteringCache',
				-1,
				`
vec3 localCacheCanonicalPosition(vec3 position) {
	vec2 relative=position.xy-uLocalCacheLiveCenter;
	return vec3(uLocalCacheCanonicalCenter+vec2(uLocalCacheRotation.x*relative.x+uLocalCacheRotation.y*relative.y,-uLocalCacheRotation.y*relative.x+uLocalCacheRotation.x*relative.y),position.z);
}
vec3 localCacheCanonicalDirection(vec3 direction) {
	return vec3(uLocalCacheRotation.x*direction.x+uLocalCacheRotation.y*direction.y,-uLocalCacheRotation.y*direction.x+uLocalCacheRotation.x*direction.y,direction.z);
}`,
			),
		];
	}

	/** Call this method to stage exact transform values without compiling a new program for every pose.
	 *
	 * @returns {readonly ShaderUniformDeclaration[]} - Geometry-owned immutable-frame uniform defaults.
	 */
	createShaderUniforms() {
		const canonical = this._definition.canonicalSource.coordinates;
		const live = this._definition.liveSource.coordinates;
		return [
			ShaderContributions.createShaderUniformDeclaration(
				'uLocalCacheLiveCenter',
				'vec2',
				'geometry.localCacheLiveCenter',
				[live[0], live[1]],
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uLocalCacheCanonicalCenter',
				'vec2',
				'geometry.localCacheCanonicalCenter',
				[canonical[0], canonical[1]],
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uLocalCacheRotation',
				'vec2',
				'geometry.localCacheRotation',
				[this._cosine, this._sine],
			),
		];
	}
}
