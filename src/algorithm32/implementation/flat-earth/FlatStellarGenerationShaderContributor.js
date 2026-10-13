import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';

/** Called by flat stellar projection to compute wrapped westward pole rotation without sending absolute time to GLSL.
 *
 * @param {GeometryObservation} observation - Exact clock.
 * @param {FlatStellarProjectionPolicy} policy - Explicit placement selection.
 * @returns {number} - Wrapped radians.
 */
function flatStarAngle(observation, policy) {
	let time = Date.parse(observation.instant);
	if (
		!Number.isFinite(time) ||
		!Number.isFinite(policy.periodMilliseconds) ||
		policy.periodMilliseconds <= 0 ||
		!Number.isFinite(policy.epochMilliseconds) ||
		!Number.isFinite(policy.projectionRadiusMeters) ||
		policy.projectionRadiusMeters <= 0 ||
		!Number.isFinite(policy.domeHeightMeters) ||
		policy.domeHeightMeters <= 0
	)
		throw new Error('Explicit finite flat-star policy required.');
	return (((time - policy.epochMilliseconds) % policy.periodMilliseconds) / policy.periodMilliseconds) * 2 * Math.PI;
}
/** Called by flat stellar projection to resolve dome presentation direction in observer east/north/up.
 *
 * @param {readonly number[]} catalog - Canonical celestial-rh vector.
 * @param {GeometryObservation} observation - Receiver geography and time.
 * @param {FlatStellarProjectionPolicy} policy - Map scale and dome shape.
 * @param {readonly number[]} observer - Local physical position, meters.
 * @returns {UnitVector3} - Unit presentation direction, never emission distance.
 */
function flatStarDirection(catalog, observation, policy, observer) {
	let length = Math.hypot(...catalog);
	if (!Number.isFinite(length) || length <= 0) throw new Error('Nonzero finite direction required.');
	let catalogDirection = catalog.map(
			/** Called by direction normalization.
			 *
			 * @param {number} component - Component.
			 * @returns {number} - Unit component.
			 */ (component) => component / length,
		),
		rotationAngleRadians = flatStarAngle(observation, policy),
		rotationCosine = Math.cos(rotationAngleRadians),
		rotationSine = Math.sin(rotationAngleRadians);
	let catalogLongitudeRadians = Math.atan2(
			rotationCosine * catalogDirection[1] - rotationSine * catalogDirection[0],
			rotationCosine * catalogDirection[0] + rotationSine * catalogDirection[1],
		),
		catalogPolarAngleRadians = Math.atan2(
			Math.hypot(catalogDirection[0], catalogDirection[1]),
			catalogDirection[2],
		);
	let latitude = (observation.location.latitude.value * Math.PI) / 180,
		observerLongitudeRadians = (observation.location.longitude.value * Math.PI) / 180,
		projectionRadiusMeters = policy.projectionRadiusMeters,
		observerPolarAngleRadians = Math.PI / 2 - latitude;
	let mapEastOffsetMeters =
			projectionRadiusMeters *
			(catalogPolarAngleRadians * Math.sin(catalogLongitudeRadians) -
				observerPolarAngleRadians * Math.sin(observerLongitudeRadians)),
		mapNorthOffsetMeters =
			projectionRadiusMeters *
			(catalogPolarAngleRadians * Math.cos(catalogLongitudeRadians) -
				observerPolarAngleRadians * Math.cos(observerLongitudeRadians));
	let east =
			mapEastOffsetMeters * Math.cos(observerLongitudeRadians) -
			mapNorthOffsetMeters * Math.sin(observerLongitudeRadians) -
			observer[0],
		north =
			-mapEastOffsetMeters * Math.sin(observerLongitudeRadians) -
			mapNorthOffsetMeters * Math.cos(observerLongitudeRadians) -
			observer[1];
	let z =
			policy.domeHeightMeters * Math.sqrt(Math.max(0, 1 - (catalogPolarAngleRadians / Math.PI) ** 2)) -
			observer[2],
		directionLength = Math.hypot(east, north, z);
	if (!(directionLength > 0)) throw new Error('Dome point coincides with observer.');
	return [east / directionLength, north / directionLength, z / directionLength];
}
/** Called by the geometry contributor to supply flat projection to established production stellar GPU stages.
 *
 * @param {FlatStellarProjectionPolicy} policy - Placement parameters.
 * @param {readonly number[]} observer - Local z-up position.
 * @returns {FlatStellarProjectionCapability} - Generic geometry operations.
 */
function createFlatStarGeometry(policy, observer) {
	return {
		/** Call this method to prepare the configured observation projection.
		 *
		 * @param {StellarGenerationGeometryRequest} request - Exact observation.
		 * @returns {StellarGenerationGeometryShaderContribution} - Matched GPU geometry operations.
		 */ createStellarGenerationShaderContribution({observation}) {
			let rotationAngleRadians = flatStarAngle(observation, policy),
				observerLongitudeRadians = (observation.location.longitude.value * Math.PI) / 180,
				catalogPolarAngleRadians = Math.PI / 2 - (observation.location.latitude.value * Math.PI) / 180;
			/**
			 *
			 * @type {readonly FlatStellarUniformSeed[]}
			 */
			let declarations = [
				['uFlatStarRotation', 'vec2', [Math.cos(rotationAngleRadians), Math.sin(rotationAngleRadians)]],
				[
					'uFlatStarObserverMap',
					'vec4',
					[
						catalogPolarAngleRadians,
						observerLongitudeRadians,
						policy.projectionRadiusMeters,
						policy.domeHeightMeters,
					],
				],
				['uFlatStarObserverMeters', 'vec3', Array.from(observer)],
				['uStellarModelViewProjectionMatrix', 'mat4', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]],
				['uStellarInverseProjectionMatrix', 'mat4', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]],
				['uStellarViewportSize', 'ivec2', [1, 1]],
			];
			let uniforms = declarations.map(
				/** Called by uniform preparation to bind each geometry-owned parameter. */ ([name, type, value]) =>
					ShaderContributions.createShaderUniformDeclaration(name, type, 'geometry.flatStars.' + name, value),
			);
			let source = `struct StellarProjectionResult {bool occupied;ivec2 topLeftPixel;vec2 ndc;vec3 localDirectionEastNorthUp;};
vec3 flatStarLocalDirection(vec3 catalog) {
 vec3 catalogDirection=normalize(catalog);float rotationCosine=uFlatStarRotation.x,rotationSine=uFlatStarRotation.y;
 float catalogLongitudeRadians=atan(rotationCosine*catalogDirection.y-rotationSine*catalogDirection.x,rotationCosine*catalogDirection.x+rotationSine*catalogDirection.y),catalogPolarAngleRadians=atan(length(catalogDirection.xy),catalogDirection.z);
 float observerLongitudeRadians=uFlatStarObserverMap.y,observerPolarAngleRadians=uFlatStarObserverMap.x;
 float mapEastOffsetMeters=uFlatStarObserverMap.z*(catalogPolarAngleRadians*sin(catalogLongitudeRadians)-observerPolarAngleRadians*sin(observerLongitudeRadians));
 float mapNorthOffsetMeters=uFlatStarObserverMap.z*(catalogPolarAngleRadians*cos(catalogLongitudeRadians)-observerPolarAngleRadians*cos(observerLongitudeRadians));
 float z=uFlatStarObserverMap.w*sqrt(max(0.0,1.0-catalogPolarAngleRadians*catalogPolarAngleRadians/9.869604401089358));
 return normalize(vec3(mapEastOffsetMeters*cos(observerLongitudeRadians)-mapNorthOffsetMeters*sin(observerLongitudeRadians),-mapEastOffsetMeters*sin(observerLongitudeRadians)-mapNorthOffsetMeters*cos(observerLongitudeRadians),z)-uFlatStarObserverMeters);
}
StellarProjectionResult stellarProjectCatalogDirection(vec3 catalog) {
 vec3 local=flatStarLocalDirection(catalog);if(local.z<=0.0)return StellarProjectionResult(false,ivec2(-1),vec2(0.0),local);
 vec4 clip=uStellarModelViewProjectionMatrix*vec4(local.x,local.z,-local.y,0.0);
 if(clip.w<=0.0)return StellarProjectionResult(false,ivec2(-1),vec2(0.0),local);
 vec2 ndc=clip.xy/clip.w;vec2 pixel=vec2((ndc.x+1.0)*0.5*float(uStellarViewportSize.x),(1.0-ndc.y)*0.5*float(uStellarViewportSize.y));
 bool visible=all(greaterThanEqual(pixel,vec2(0.0)))&&all(lessThan(pixel,vec2(uStellarViewportSize)));
 return StellarProjectionResult(visible,ivec2(floor(pixel)),ndc,local);
}
vec2 stellarTopLeftPixelCenterToClip(ivec2 p){return vec2(2.0*(float(p.x)+0.5)/float(uStellarViewportSize.x)-1.0,1.0-2.0*(float(p.y)+0.5)/float(uStellarViewportSize.y));}
ivec2 stellarTopLeftPixelToFramebuffer(ivec2 p){return ivec2(p.x,uStellarViewportSize.y-1-p.y);}`;
			return {
				identity: CanonicalValueHash.sha256Value({policy, observer, observation, source}),
				uniforms,
				source,
				bindingRequirements: uniforms.map(
					/** Called by contribution preparation to declare each required uniform binding. */ (u) => ({
						id: 'flat-stars:' + u.name,
						owner:
							/**
							 *
							 * @type {const}
							 */ ('geometry'),
						kind:
							/**
							 *
							 * @type {const}
							 */ ('uniform'),
						updateFrequency:
							/**
							 *
							 * @type {const}
							 */ ('config'),
						valueKey: u.valueKey,
						required: true,
					}),
				),
			};
		},
	};
}

/** Geometry-owned qualified flat-star projection and fixed-observation shader contribution. */
export class FlatStellarGenerationShaderContributor {
	/** Accepted physical placement policy.
	 *
	 * @type {FlatStellarProjectionPolicy}
	 */ _policy;
	/** Configured receiver point in meters.
	 *
	 * @type {readonly number[]}
	 */ _observer;
	/** Fixed geographic time snapshot.
	 *
	 * @type {GeometryObservation}
	 */ _observation;
	/** Creates the geometry-owned contributor.
	 *
	 * @param {FlatEarthGeometryConfiguration} geometry - Physical geometry.
	 * @param {GeometryObservation} observation - Exact accepted observation.
	 */
	constructor(geometry, observation) {
		this._policy = {
			epochMilliseconds: 0,
			periodMilliseconds: 86164090.5,
			projectionRadiusMeters: geometry.projectionRadius.value,
			domeHeightMeters: Math.PI * geometry.projectionRadius.value,
		};
		this._observer = [...geometry.observerPosition.coordinates];
		this._observation = observation;
	}
	/** Call this method to resolve a physical presentation direction.
	 *
	 * @param {UnitVector3} catalog - Catalog direction.
	 * @returns {UnitVector3} - Receiver-relative east/north/up direction.
	 */
	resolveDirection(catalog) {
		return flatStarDirection(catalog, this._observation, this._policy, this._observer);
	}
	/** Call this method to return the accepted simulation policy identity.
	 *
	 * @returns {FlatStellarEpochRelativeTransformIdentity} - Explicit epoch, rotation, projection and parallax facts.
	 */
	describeTransform() {
		return {
			projection: 'azimuthal-equidistant-polar-dome-v1',
			rotation: 'westward-fixed-sidereal-period-v1',
			epochMilliseconds: this._policy.epochMilliseconds,
			periodMilliseconds: this._policy.periodMilliseconds,
			projectionRadius: {value: this._policy.projectionRadiusMeters, units: 'meters'},
			domeHeight: {value: this._policy.domeHeightMeters, units: 'meters'},
			localFrame: 'east-north-up-rh-v1',
			parallax: 'receiver-relative-dome-point-v1',
		};
	}
	/** Call this method to contribute the same projection to ordinary stellar generation stages.
	 *
	 * @returns {StellarGenerationGeometryShaderContribution} - Geometry-owned CPU-matched GPU operations.
	 */
	createContribution() {
		return createFlatStarGeometry(this._policy, this._observer).createStellarGenerationShaderContribution({
			observation: this._observation,
		});
	}
}
