import AngleMath from '../../math/AngleMath.js';
import {ShaderContributions} from '../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../shader-assembly/base/ShaderSource.js';
import {CanonicalValueHash} from '../../value-identity/CanonicalValueHash.js';
import {SPHERICAL_GEOMETRY_IDENTITY_MATRIX4} from './consts.js';

const MILLISECONDS_PER_DAY = 86_400_000;
const UNIX_EPOCH_JULIAN_DATE = 2_440_587.5;

/** Geometry-owned fixed-observation transform and projection operations for stellar generation. */
export class SphericalStellarGenerationShaderContributor {
	/** Normalized configured geometry. @type {SphericalEarthGeometryConfiguration} */
	_geometry;
	/** Fixed clock/location snapshot. @type {GeometryObservation} */
	_observation;

	/**
	 * Create spherical stellar-generation shader operations.
	 *
	 * @param {SphericalStellarGenerationShaderContributorConfiguration} configuration - Geometry and fixed observation.
	 */
	constructor(configuration) {
		this._geometry = configuration.geometry;
		this._observation = configuration.observation;
	}

	/** @returns {number} - Configured UTC instant expressed as a Julian date. */
	_julianDate() {
		const milliseconds = Date.parse(this._observation.instant);
		if (!Number.isFinite(milliseconds)) {
			throw new RangeError('Spherical stellar generation requires a valid fixed UTC observation instant.');
		}

		return milliseconds / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DATE;
	}

	/** @returns {StellarGenerationGeometryShaderContribution} - Complete geometry-owned shader operations. */
	createContribution() {
		const julianDate = this._julianDate();
		const zeroHoursJulianDate = Math.floor(julianDate - 0.5) + 0.5;
		const daysAtZeroHoursSinceJ2000 = zeroHoursJulianDate - 2_451_545;
		const hoursSinceZero = (julianDate - zeroHoursJulianDate) * 24;
		const julianCenturiesSinceJ2000 = (julianDate - 2_451_545) / 36_525;
		const latitudeRadians = AngleMath.toRadians(this._observation.location.latitude);
		const longitudeRadians = AngleMath.toRadians(this._observation.location.longitude);
		const sceneFrame = this._geometry.sceneFrame;
		const uniforms = [
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarJulianCenturiesSinceJ2000',
				'float',
				'geometry.stellarJulianCenturiesSinceJ2000',
				julianCenturiesSinceJ2000,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarDaysAtZeroHoursSinceJ2000',
				'float',
				'geometry.stellarDaysAtZeroHoursSinceJ2000',
				daysAtZeroHoursSinceJ2000,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarHoursSinceZero',
				'float',
				'geometry.stellarHoursSinceZero',
				hoursSinceZero,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarObserverLatitudeRadians',
				'float',
				'geometry.stellarObserverLatitudeRadians',
				latitudeRadians,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarObserverLongitudeRadians',
				'float',
				'geometry.stellarObserverLongitudeRadians',
				longitudeRadians,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarModelViewProjectionMatrix',
				'mat4',
				'runtime.celestial.modelViewProjectionMatrix',
				SPHERICAL_GEOMETRY_IDENTITY_MATRIX4,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarInverseProjectionMatrix',
				'mat4',
				'runtime.celestial.inverseProjectionMatrix',
				SPHERICAL_GEOMETRY_IDENTITY_MATRIX4,
			),
			ShaderContributions.createShaderUniformDeclaration(
				'uStellarViewportSize',
				'ivec2',
				'runtime.celestial.viewportSize',
				[1, 1],
			),
		];
		const bindingRequirements = [
			this._binding(
				'geometry.stellar-julian-centuries',
				'geometry',
				'config',
				'geometry.stellarJulianCenturiesSinceJ2000',
			),
			this._binding(
				'geometry.stellar-days-at-zero-hours',
				'geometry',
				'config',
				'geometry.stellarDaysAtZeroHoursSinceJ2000',
			),
			this._binding('geometry.stellar-hours-since-zero', 'geometry', 'config', 'geometry.stellarHoursSinceZero'),
			this._binding(
				'geometry.stellar-observer-latitude',
				'geometry',
				'config',
				'geometry.stellarObserverLatitudeRadians',
			),
			this._binding(
				'geometry.stellar-observer-longitude',
				'geometry',
				'config',
				'geometry.stellarObserverLongitudeRadians',
			),
			this._binding(
				'runtime.celestial-model-view-projection',
				'renderingRuntime',
				'frame',
				'runtime.celestial.modelViewProjectionMatrix',
			),
			this._binding(
				'runtime.celestial-inverse-projection',
				'renderingRuntime',
				'frame',
				'runtime.celestial.inverseProjectionMatrix',
			),
			this._binding(
				'runtime.celestial-viewport-size',
				'renderingRuntime',
				'frame',
				'runtime.celestial.viewportSize',
			),
		];
		const source = `const float STELLAR_ARCSECONDS_TO_RADIANS = 0.00000484813681109536;
const float STELLAR_TWO_PI = 6.283185307179586;
const vec3 STELLAR_MODEL_UP = ${ShaderSource.formatVec3(sceneFrame.up)};
const vec3 STELLAR_MODEL_RIGHT = ${ShaderSource.formatVec3(sceneFrame.right)};
const vec3 STELLAR_MODEL_FORWARD = ${ShaderSource.formatVec3(sceneFrame.forward)};

struct StellarProjectionResult {
	bool occupied;
	ivec2 topLeftPixel;
	vec2 ndc;
	vec3 localDirectionEastNorthUp;
};

float stellarNormalizeRadians(float value) {
	return mod(mod(value, STELLAR_TWO_PI) + STELLAR_TWO_PI, STELLAR_TWO_PI);
}

vec3 stellarPrecessFk5J2000ToMeanOfDate(vec3 catalogDirection) {
	vec3 direction = normalize(catalogDirection);
	float rightAscension = stellarNormalizeRadians(atan(direction.y, direction.x));
	float declination = asin(clamp(direction.z, -1.0, 1.0));
	float t = uStellarJulianCenturiesSinceJ2000;
	float t2 = t * t;
	float t3 = t2 * t;
	float t4 = t3 * t;
	float t5 = t4 * t;
	float zeta = (2.650545 + 2306.083227 * t + 0.2988499 * t2
		+ 0.01801828 * t3 - 0.000005971 * t4 - 0.0000003173 * t5)
		* STELLAR_ARCSECONDS_TO_RADIANS;
	float z = (-2.650545 + 2306.077181 * t + 1.0927348 * t2
		+ 0.01826837 * t3 - 0.000028596 * t4 - 0.0000002904 * t5)
		* STELLAR_ARCSECONDS_TO_RADIANS;
	float theta = (2004.191903 * t - 0.4294934 * t2 - 0.04182264 * t3
		- 0.000007089 * t4 - 0.0000001274 * t5)
		* STELLAR_ARCSECONDS_TO_RADIANS;
	float shiftedRightAscension = rightAscension + zeta;
	float a = cos(declination) * sin(shiftedRightAscension);
	float b = cos(theta) * cos(declination) * cos(shiftedRightAscension)
		- sin(theta) * sin(declination);
	float c = sin(theta) * cos(declination) * cos(shiftedRightAscension)
		+ cos(theta) * sin(declination);
	float meanRightAscension = stellarNormalizeRadians(atan(a, b) + z);
	float meanDeclination = asin(clamp(c, -1.0, 1.0));
	float cosineDeclination = cos(meanDeclination);
	return normalize(vec3(
		cosineDeclination * cos(meanRightAscension),
		cosineDeclination * sin(meanRightAscension),
		sin(meanDeclination)
	));
}

float stellarGreenwichMeanSiderealTimeRadians() {
	float gmstHours = 6.697375
		+ 0.065707485828 * uStellarDaysAtZeroHoursSinceJ2000
		+ 1.0027379 * uStellarHoursSinceZero
		+ 0.0854103 * uStellarJulianCenturiesSinceJ2000
		+ 0.0000258 * uStellarJulianCenturiesSinceJ2000
			* uStellarJulianCenturiesSinceJ2000;
	return stellarNormalizeRadians(gmstHours * 0.2617993877991494);
}

vec3 stellarCatalogDirectionToLocalEnu(vec3 catalogDirection) {
	vec3 meanDirection = stellarPrecessFk5J2000ToMeanOfDate(catalogDirection);
	float rightAscension = atan(meanDirection.y, meanDirection.x);
	float declination = asin(clamp(meanDirection.z, -1.0, 1.0));
	float localMeanSiderealTime = stellarNormalizeRadians(
		stellarGreenwichMeanSiderealTimeRadians() + uStellarObserverLongitudeRadians
	);
	float hourAngle = stellarNormalizeRadians(localMeanSiderealTime - rightAscension);
	float cosineDeclination = cos(declination);
	float east = -cosineDeclination * sin(hourAngle);
	float north = sin(declination) * cos(uStellarObserverLatitudeRadians)
		- cosineDeclination * cos(hourAngle) * sin(uStellarObserverLatitudeRadians);
	float up = sin(declination) * sin(uStellarObserverLatitudeRadians)
		+ cosineDeclination * cos(hourAngle) * cos(uStellarObserverLatitudeRadians);
	return normalize(vec3(east, north, up));
}

vec3 stellarLocalEnuToScene(vec3 localDirection) {
	vec3 modelDirection = normalize(
		STELLAR_MODEL_RIGHT * localDirection.x
		+ STELLAR_MODEL_FORWARD * -localDirection.y
		+ STELLAR_MODEL_UP * localDirection.z
	);
	return normalize(vec3(
		dot(modelDirection, STELLAR_MODEL_RIGHT),
		dot(modelDirection, STELLAR_MODEL_UP),
		dot(modelDirection, STELLAR_MODEL_FORWARD)
	));
}

StellarProjectionResult stellarProjectCatalogDirection(vec3 catalogDirection) {
	vec3 localDirection = stellarCatalogDirectionToLocalEnu(catalogDirection);
	if (localDirection.z <= 0.0) {
		return StellarProjectionResult(false, ivec2(-1), vec2(0.0), localDirection);
	}
	vec3 sceneDirection = stellarLocalEnuToScene(localDirection);
	vec4 clip = uStellarModelViewProjectionMatrix * vec4(sceneDirection, 0.0);
	if (!(clip.w > 0.0)) {
		return StellarProjectionResult(false, ivec2(-1), vec2(0.0), localDirection);
	}
	vec2 ndc = clip.xy / clip.w;
	vec2 screen = vec2(
		(ndc.x + 1.0) * 0.5 * float(uStellarViewportSize.x),
		(1.0 - ndc.y) * 0.5 * float(uStellarViewportSize.y)
	);
	if (screen.x < 0.0 || screen.x >= float(uStellarViewportSize.x)
		|| screen.y < 0.0 || screen.y >= float(uStellarViewportSize.y)) {
		return StellarProjectionResult(false, ivec2(-1), ndc, localDirection);
	}
	return StellarProjectionResult(true, ivec2(floor(screen)), ndc, localDirection);
}

vec2 stellarTopLeftPixelCenterToClip(ivec2 pixel) {
	return vec2(
		(2.0 * (float(pixel.x) + 0.5) / float(uStellarViewportSize.x)) - 1.0,
		1.0 - (2.0 * (float(pixel.y) + 0.5) / float(uStellarViewportSize.y))
	);
}

ivec2 stellarTopLeftPixelToFramebuffer(ivec2 pixel) {
	return ivec2(pixel.x, uStellarViewportSize.y - 1 - pixel.y);
}
`;

		return {
			identity: CanonicalValueHash.sha256Value({
				frame: sceneFrame,
				julianDate,
				latitudeRadians,
				longitudeRadians,
				policy: this.describeTransform(),
			}),
			uniforms,
			bindingRequirements,
			source,
		};
	}

	/** @returns {StellarEpochRelativeTransformIdentity} - Accepted fixed-observation transform policy. */
	describeTransform() {
		return {
			precession: 'iau-2000-three-angle',
			siderealTime: 'usno-mean-sidereal-time',
			ut1Approximation: 'utc-as-ut1',
			terrestrialTimeApproximation: 'utc-as-tt',
			localFrame: 'east-north-up-rh-v1',
		};
	}

	/**
	 * Create one required uniform binding.
	 *
	 * @param {string} id - Stable binding identifier.
	 * @param {CelestialGenerationBindingOwner} owner - Binding owner.
	 * @param {ShaderUpdateFrequency} updateFrequency - Accepted update cadence.
	 * @param {string} valueKey - Provider-neutral runtime value key.
	 * @returns {CelestialGenerationBindingRequirement} - Complete required uniform binding.
	 */
	_binding(id, owner, updateFrequency, valueKey) {
		return {id, owner, kind: 'uniform', updateFrequency, valueKey, required: true};
	}
}
