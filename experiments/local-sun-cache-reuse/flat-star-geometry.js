import {CanonicalValueHash} from '../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {ShaderContributions} from '../../src/algorithm32/shader-assembly/base/ShaderContributions.js';

/** Compute wrapped westward pole rotation without sending absolute time to GLSL.
 * @param {GeometryObservation} observation - Exact clock.
 * @param {LocalSunFlatStarPolicy} policy - Explicit placement selection.
 * @returns {number} - Wrapped radians.
 */
export function flatStarAngle(observation, policy) {
	const time = Date.parse(observation.instant);
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
/** Resolve dome presentation direction in observer east/north/up.
 * @param {readonly number[]} catalog - Canonical celestial-rh vector.
 * @param {GeometryObservation} observation - Receiver geography and time.
 * @param {LocalSunFlatStarPolicy} policy - Map scale and dome shape.
 * @param {readonly number[]} observer - Local physical position, meters.
 * @returns {UnitVector3} - Unit presentation direction, never emission distance.
 */
export function flatStarDirection(catalog, observation, policy, observer) {
	const length = Math.hypot(...catalog);
	if (!Number.isFinite(length) || length <= 0) throw new Error('Nonzero finite direction required.');
	const d = catalog.map((v) => v / length),
		theta = flatStarAngle(observation, policy),
		c = Math.cos(theta),
		s = Math.sin(theta);
	const longitude = Math.atan2(c * d[1] - s * d[0], c * d[0] + s * d[1]),
		rho = Math.atan2(Math.hypot(d[0], d[1]), d[2]);
	const latitude = (observation.location.latitude.value * Math.PI) / 180,
		lambda = (observation.location.longitude.value * Math.PI) / 180,
		radius = policy.projectionRadiusMeters,
		receiverRho = Math.PI / 2 - latitude;
	const dx = radius * (rho * Math.sin(longitude) - receiverRho * Math.sin(lambda)),
		dy = radius * (rho * Math.cos(longitude) - receiverRho * Math.cos(lambda));
	const east = dx * Math.cos(lambda) - dy * Math.sin(lambda) - observer[0],
		north = -dx * Math.sin(lambda) - dy * Math.cos(lambda) - observer[1];
	const z = policy.domeHeightMeters * Math.sqrt(Math.max(0, 1 - (rho / Math.PI) ** 2)) - observer[2],
		norm = Math.hypot(east, north, z);
	if (!(norm > 0)) throw new Error('Dome point coincides with observer.');
	return [east / norm, north / norm, z / norm];
}
/** Supply flat projection to established production stellar GPU stages.
 * @param {LocalSunFlatStarPolicy} policy - Placement parameters.
 * @param {readonly number[]} observer - Local z-up position.
 * @returns {LocalSunFlatStarGeometry} - Generic geometry operations.
 */
export function createFlatStarGeometry(policy, observer) {
	return {
		createStellarGenerationShaderContribution({observation}) {
			const theta = flatStarAngle(observation, policy),
				lambda = (observation.location.longitude.value * Math.PI) / 180,
				rho = Math.PI / 2 - (observation.location.latitude.value * Math.PI) / 180;
			/** @type {readonly [string,string,unknown][]} */
			const declarations = [
				['uFlatStarRotation', 'vec2', [Math.cos(theta), Math.sin(theta)]],
				['uFlatStarObserverMap', 'vec4', [rho, lambda, policy.projectionRadiusMeters, policy.domeHeightMeters]],
				['uFlatStarObserverMeters', 'vec3', Array.from(observer)],
				['uStellarModelViewProjectionMatrix', 'mat4', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]],
				['uStellarInverseProjectionMatrix', 'mat4', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]],
				['uStellarViewportSize', 'ivec2', [1, 1]],
			];
			const uniforms = declarations.map(([name, type, value]) =>
				ShaderContributions.createShaderUniformDeclaration(name, type, 'experiment.flatStars.' + name, value),
			);
			const source = `struct StellarProjectionResult {bool occupied;ivec2 topLeftPixel;vec2 ndc;vec3 localDirectionEastNorthUp;};
vec3 flatStarLocalDirection(vec3 catalog) {
 vec3 d=normalize(catalog);float c=uFlatStarRotation.x,s=uFlatStarRotation.y;
 float longitude=atan(c*d.y-s*d.x,c*d.x+s*d.y),rho=atan(length(d.xy),d.z);
 float lambda=uFlatStarObserverMap.y,receiverRho=uFlatStarObserverMap.x;
 float dx=uFlatStarObserverMap.z*(rho*sin(longitude)-receiverRho*sin(lambda));
 float dy=uFlatStarObserverMap.z*(rho*cos(longitude)-receiverRho*cos(lambda));
 float z=uFlatStarObserverMap.w*sqrt(max(0.0,1.0-rho*rho/9.869604401089358));
 return normalize(vec3(dx*cos(lambda)-dy*sin(lambda),-dx*sin(lambda)-dy*cos(lambda),z)-uFlatStarObserverMeters);
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
				bindingRequirements: uniforms.map((u) => ({
					id: 'flat-stars:' + u.name,
					owner: /** @type {const} */ ('geometry'),
					kind: /** @type {const} */ ('uniform'),
					updateFrequency: /** @type {const} */ ('config'),
					valueKey: u.valueKey,
					required: true,
				})),
			};
		},
	};
}
