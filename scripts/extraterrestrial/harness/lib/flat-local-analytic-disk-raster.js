import {ShaderContributions} from '/snapshot/src/algorithm32/shader-assembly/base/ShaderContributions.js';

/** Proof-only readout modes for the contained Flat/local analytic raster. */
export const FLAT_LOCAL_ANALYTIC_RASTER_MODES = {
	passthrough: 0,
	candidateNormal: 1,
	productionCelestialPacketStart: 2,
	productionPreDisplayPacketStart: 6,
	pathPacketStart: 10,
	sourceCachePacketStart: 14,
	candidateCelestialPacketStart: 18,
	candidatePreDisplayPacketStart: 22,
	productionSignedLinearRgb: 26,
	candidateSignedLinearRgb: 27,
	productionDirectY: 28,
	candidateDirectY: 29,
	analyticCoverage: 30,
	legacyHitFraction: 31,
	legacyHitMask: 32,
	visibleTransportMask: 33,
	fallbackDiagnostics: 34,
	weightDiagnostics: 35,
	compositionResidual: 36,
	conicDiagnostics: 37,
	transportCountDiagnostics: 38,
	coverageNumericsDiagnostics: 39,
	conicCoefficients0: 40,
	conicCoefficients1: 41,
	conicAxisDiagnostics: 42,
	conicScaleDiagnostics: 43,
	unnormalizedRayDirection: 44,
	productionRayDirection: 45,
};

const SPECTRAL_PACKET_COUNT = 4;

/** Return the contained exact-conic and circle/quad overlap implementation. */
function analyticRasterFunctionsSource() {
	return `struct FlatLocalAnalyticConic {
	bool valid;
	bool forward;
	vec2 centerPixels;
	float cholesky00;
	float cholesky01;
	float cholesky11;
	float mapDeterminant;
	float centerSupport;
	float constantTerm;
	vec2 linearTerm;
	float hessianXX;
	float hessianXY;
	float hessianYY;
	float hessianDeterminant;
	float axisBase;
	float axisPixelX;
	float axisPixelY;
	float axisMinimumOnPixel;
	float axisMaximumOnPixel;
	float axisAtEllipseCenter;
	float coneTangentSquared;
};

struct FlatLocalAnalyticCoverage {
	float coverage;
	float signedMappedArea;
	float rawCoverage;
	float clampResidual;
	float forwardPolygonVertexCount;
};

struct FlatLocalAnalyticRasterEvaluation {
	SpectralValue celestialRadiance;
	float analyticCoverage;
	float diskHitCount;
	float visibleTransportCount;
	float appliedScale;
	float fallbackUsed;
	float centerBlocked;
	float candidateTransportEvaluationCount;
	float totalProofTransportEvaluationCount;
	vec4 diskHitMask;
	vec4 visibleTransportMask;
	FlatLocalAnalyticConic conic;
	FlatLocalAnalyticCoverage coverage;
};

bool flatLocalAnalyticFinite(float value) {
	return value == value && abs(value) < 3.402823466e+38;
}

bool flatLocalAnalyticFinite2(vec2 value) {
	return flatLocalAnalyticFinite(value.x) && flatLocalAnalyticFinite(value.y);
}

vec3 flatLocalAnalyticUnnormalizedModelRay(vec2 textureCoordinates) {
	vec4 clip = vec4(textureCoordinates * 2.0 - 1.0, 1.0, 1.0);
	vec3 viewDirection = (uInverseProjectionMatrix * clip).xyz;
	vec3 sceneDirection = (uInverseViewMatrix * vec4(viewDirection, 0.0)).xyz;
	return GEOMETRY_OBSERVER_RIGHT_DIRECTION * sceneDirection.x
		+ GEOMETRY_OBSERVER_UP_DIRECTION * sceneDirection.y
		+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * sceneDirection.z;
}

FlatLocalAnalyticConic flatLocalAnalyticResolveConic(ShaderState state) {
	FlatLocalAnalyticConic result;
	result.valid = false;
	result.forward = false;
	result.centerPixels = vec2(0.0);
	result.cholesky00 = 0.0;
	result.cholesky01 = 0.0;
	result.cholesky11 = 0.0;
	result.mapDeterminant = 0.0;
	result.centerSupport = 0.0;
	result.constantTerm = 0.0;
	result.linearTerm = vec2(0.0);
	result.hessianXX = 0.0;
	result.hessianXY = 0.0;
	result.hessianYY = 0.0;
	result.hessianDeterminant = 0.0;
	result.axisBase = 0.0;
	result.axisPixelX = 0.0;
	result.axisPixelY = 0.0;
	result.axisMinimumOnPixel = 0.0;
	result.axisMaximumOnPixel = 0.0;
	result.axisAtEllipseCenter = 0.0;
	result.coneTangentSquared = 0.0;

	vec2 inverseViewport = 1.0 / max(uViewportSizePixels, vec2(1.0));
	vec3 rayBase = flatLocalAnalyticUnnormalizedModelRay(state.textureCoordinates);
	vec3 rayPixelX = flatLocalAnalyticUnnormalizedModelRay(
		state.textureCoordinates + vec2(inverseViewport.x, 0.0)
	) - rayBase;
	vec3 rayPixelY = flatLocalAnalyticUnnormalizedModelRay(
		state.textureCoordinates + vec2(0.0, inverseViewport.y)
	) - rayBase;
	vec3 sourceOffset = FLAT_FINITE_SUN_CENTER_METERS - state.ray.originMeters;
	float sourceDistanceSquared = dot(sourceOffset, sourceOffset);
	float radiusSquared = FLAT_FINITE_SUN_RADIUS_METERS * FLAT_FINITE_SUN_RADIUS_METERS;
	if (!(sourceDistanceSquared > radiusSquared) || !flatLocalAnalyticFinite(sourceDistanceSquared)) {
		return result;
	}
	vec3 sourceAxis = sourceOffset * inversesqrt(sourceDistanceSquared);
	vec3 tangentReference = abs(sourceAxis.z) < 0.875 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
	vec3 tangentX = normalize(cross(tangentReference, sourceAxis));
	vec3 tangentY = cross(sourceAxis, tangentX);
	float coneTangentSquared = radiusSquared / (sourceDistanceSquared - radiusSquared);

	vec3 baseComponents = vec3(dot(rayBase, sourceAxis), dot(rayBase, tangentX), dot(rayBase, tangentY));
	vec3 xComponents = vec3(dot(rayPixelX, sourceAxis), dot(rayPixelX, tangentX), dot(rayPixelX, tangentY));
	vec3 yComponents = vec3(dot(rayPixelY, sourceAxis), dot(rayPixelY, tangentX), dot(rayPixelY, tangentY));
	float constantTerm = coneTangentSquared * baseComponents.x * baseComponents.x
		- baseComponents.y * baseComponents.y
		- baseComponents.z * baseComponents.z;
	vec2 linearTerm = vec2(
		coneTangentSquared * baseComponents.x * xComponents.x
			- baseComponents.y * xComponents.y
			- baseComponents.z * xComponents.z,
		coneTangentSquared * baseComponents.x * yComponents.x
			- baseComponents.y * yComponents.y
			- baseComponents.z * yComponents.z
	);
	float hessianXX = coneTangentSquared * xComponents.x * xComponents.x
		- xComponents.y * xComponents.y
		- xComponents.z * xComponents.z;
	float hessianXY = coneTangentSquared * xComponents.x * yComponents.x
		- xComponents.y * yComponents.y
		- xComponents.z * yComponents.z;
	float hessianYY = coneTangentSquared * yComponents.x * yComponents.x
		- yComponents.y * yComponents.y
		- yComponents.z * yComponents.z;
	float hessianDeterminant = hessianXX * hessianYY - hessianXY * hessianXY;
	float axisVariationOnPixel = 0.5 * (abs(xComponents.x) + abs(yComponents.x));
	float axisMinimumOnPixel = baseComponents.x - axisVariationOnPixel;
	float axisMaximumOnPixel = baseComponents.x + axisVariationOnPixel;
	if (!(hessianXX < 0.0 && hessianYY < 0.0 && hessianDeterminant > 0.0)
		|| !flatLocalAnalyticFinite(constantTerm)
		|| !flatLocalAnalyticFinite2(linearTerm)
		|| !flatLocalAnalyticFinite(hessianDeterminant)
		|| !flatLocalAnalyticFinite(baseComponents.x)
		|| !flatLocalAnalyticFinite(xComponents.x)
		|| !flatLocalAnalyticFinite(yComponents.x)) {
		return result;
	}
	vec2 inverseTimesLinear = vec2(
		(hessianYY * linearTerm.x - hessianXY * linearTerm.y) / hessianDeterminant,
		(-hessianXY * linearTerm.x + hessianXX * linearTerm.y) / hessianDeterminant
	);
	vec2 ellipseCenterPixels = -inverseTimesLinear;
	float centerSupport = constantTerm - dot(linearTerm, inverseTimesLinear);
	float axisAtCenter = baseComponents.x
		+ xComponents.x * ellipseCenterPixels.x
		+ yComponents.x * ellipseCenterPixels.y;
	if (!(centerSupport > 0.0)
		|| !flatLocalAnalyticFinite(centerSupport)
		|| !flatLocalAnalyticFinite2(ellipseCenterPixels)
		|| !flatLocalAnalyticFinite(axisAtCenter)) {
		return result;
	}
	float ellipseXX = -hessianXX / centerSupport;
	float ellipseXY = -hessianXY / centerSupport;
	float ellipseYY = -hessianYY / centerSupport;
	float cholesky00 = sqrt(max(ellipseXX, 0.0));
	if (!(cholesky00 > 0.0) || !flatLocalAnalyticFinite(cholesky00)) return result;
	float cholesky01 = ellipseXY / cholesky00;
	float cholesky11Squared = ellipseYY - cholesky01 * cholesky01;
	if (!(cholesky11Squared > 0.0) || !flatLocalAnalyticFinite(cholesky11Squared)) return result;
	float cholesky11 = sqrt(cholesky11Squared);
	float mapDeterminant = cholesky00 * cholesky11;
	if (!(mapDeterminant > 0.0) || !flatLocalAnalyticFinite(mapDeterminant)) return result;

	result.valid = true;
	result.forward = axisMaximumOnPixel > 0.0;
	result.centerPixels = ellipseCenterPixels;
	result.cholesky00 = cholesky00;
	result.cholesky01 = cholesky01;
	result.cholesky11 = cholesky11;
	result.mapDeterminant = mapDeterminant;
	result.centerSupport = centerSupport;
	result.constantTerm = constantTerm;
	result.linearTerm = linearTerm;
	result.hessianXX = hessianXX;
	result.hessianXY = hessianXY;
	result.hessianYY = hessianYY;
	result.hessianDeterminant = hessianDeterminant;
	result.axisBase = baseComponents.x;
	result.axisPixelX = xComponents.x;
	result.axisPixelY = yComponents.x;
	result.axisMinimumOnPixel = axisMinimumOnPixel;
	result.axisMaximumOnPixel = axisMaximumOnPixel;
	result.axisAtEllipseCenter = axisAtCenter;
	result.coneTangentSquared = coneTangentSquared;
	return result;
}

float flatLocalAnalyticCross2(vec2 left, vec2 right) {
	return left.x * right.y - left.y * right.x;
}

float flatLocalAnalyticCircleEdgeArea(vec2 startPoint, vec2 endPoint) {
	vec2 edge = endPoint - startPoint;
	float quadraticA = dot(edge, edge);
	if (!(quadraticA > 0.0)) return 0.0;
	float quadraticB = 2.0 * dot(startPoint, edge);
	float quadraticC = dot(startPoint, startPoint) - 1.0;
	float discriminant = quadraticB * quadraticB - 4.0 * quadraticA * quadraticC;
	float firstRoot = 0.0;
	float secondRoot = 0.0;
	if (discriminant >= 0.0) {
		float root = sqrt(max(discriminant, 0.0));
		firstRoot = clamp((-quadraticB - root) / (2.0 * quadraticA), 0.0, 1.0);
		secondRoot = clamp((-quadraticB + root) / (2.0 * quadraticA), 0.0, 1.0);
	}
	float cuts[4] = float[4](0.0, firstRoot, secondRoot, 1.0);
	float area = 0.0;
	for (int intervalIndex = 0; intervalIndex < 3; intervalIndex += 1) {
		float intervalStart = cuts[intervalIndex];
		float intervalEnd = cuts[intervalIndex + 1];
		if (!(intervalEnd > intervalStart)) continue;
		vec2 segmentStart = mix(startPoint, endPoint, intervalStart);
		vec2 segmentEnd = mix(startPoint, endPoint, intervalEnd);
		vec2 midpoint = mix(segmentStart, segmentEnd, 0.5);
		float crossValue = flatLocalAnalyticCross2(segmentStart, segmentEnd);
		if (dot(midpoint, midpoint) <= 1.0) {
			area += 0.5 * crossValue;
		} else {
			area += 0.5 * atan(crossValue, dot(segmentStart, segmentEnd));
		}
	}
	return area;
}

vec2 flatLocalAnalyticMapPixelPoint(FlatLocalAnalyticConic conic, vec2 pixelPoint) {
	vec2 offset = pixelPoint - conic.centerPixels;
	return vec2(
		conic.cholesky00 * offset.x + conic.cholesky01 * offset.y,
		conic.cholesky11 * offset.y
	);
}

float flatLocalAnalyticAxisCoordinate(FlatLocalAnalyticConic conic, vec2 pixelPoint) {
	return conic.axisBase
		+ conic.axisPixelX * pixelPoint.x
		+ conic.axisPixelY * pixelPoint.y;
}

FlatLocalAnalyticCoverage flatLocalAnalyticCoverage(FlatLocalAnalyticConic conic) {
	FlatLocalAnalyticCoverage result;
	result.coverage = 0.0;
	result.signedMappedArea = 0.0;
	result.rawCoverage = 0.0;
	result.clampResidual = 0.0;
	result.forwardPolygonVertexCount = 0.0;
	if (!conic.valid || !conic.forward) return result;

	vec2 square[4] = vec2[4](
		vec2(-0.5, -0.5),
		vec2(0.5, -0.5),
		vec2(0.5, 0.5),
		vec2(-0.5, 0.5)
	);
	vec2 forwardPolygon[6];
	int forwardVertexCount = 0;
	for (int edgeIndex = 0; edgeIndex < 4; edgeIndex += 1) {
		vec2 startPoint = square[edgeIndex];
		vec2 endPoint = square[(edgeIndex + 1) % 4];
		float startAxis = flatLocalAnalyticAxisCoordinate(conic, startPoint);
		float endAxis = flatLocalAnalyticAxisCoordinate(conic, endPoint);
		bool startForward = startAxis > 0.0;
		bool endForward = endAxis > 0.0;
		if (startForward != endForward) {
			float intersectionParameter = clamp(startAxis / (startAxis - endAxis), 0.0, 1.0);
			forwardPolygon[forwardVertexCount] = mix(startPoint, endPoint, intersectionParameter);
			forwardVertexCount += 1;
		}
		if (endForward) {
			forwardPolygon[forwardVertexCount] = endPoint;
			forwardVertexCount += 1;
		}
	}
	result.forwardPolygonVertexCount = float(forwardVertexCount);
	if (forwardVertexCount < 3) return result;

	float mappedArea = 0.0;
	for (int edgeIndex = 0; edgeIndex < 6; edgeIndex += 1) {
		if (edgeIndex >= forwardVertexCount) break;
		int nextIndex = edgeIndex + 1;
		if (nextIndex >= forwardVertexCount) nextIndex = 0;
		mappedArea += flatLocalAnalyticCircleEdgeArea(
			flatLocalAnalyticMapPixelPoint(conic, forwardPolygon[edgeIndex]),
			flatLocalAnalyticMapPixelPoint(conic, forwardPolygon[nextIndex])
		);
	}
	result.signedMappedArea = mappedArea;
	result.rawCoverage = mappedArea / conic.mapDeterminant;
	if (flatLocalAnalyticFinite(result.rawCoverage)) {
		result.coverage = clamp(result.rawCoverage, 0.0, 1.0);
		result.clampResidual = result.coverage - result.rawCoverage;
	}
	return result;
}

FlatLocalAnalyticRasterEvaluation evaluateFlatLocalAnalyticRaster(
	ShaderState state,
	SpectralValue productionCelestialRadiance
) {
	FlatLocalAnalyticRasterEvaluation result;
	result.celestialRadiance = zeroSpectral();
	result.conic = flatLocalAnalyticResolveConic(state);
	result.coverage = flatLocalAnalyticCoverage(result.conic);
	result.analyticCoverage = result.coverage.coverage;
	result.diskHitCount = 0.0;
	result.visibleTransportCount = 0.0;
	result.appliedScale = 0.0;
	result.fallbackUsed = 0.0;
	result.centerBlocked = 0.0;
	result.candidateTransportEvaluationCount = 0.0;
	result.totalProofTransportEvaluationCount = 0.0;
	result.diskHitMask = vec4(0.0);
	result.visibleTransportMask = vec4(0.0);
	for (int sampleIndex = 0; sampleIndex < 4; sampleIndex += 1) {
		vec2 sampleTextureCoordinates = state.textureCoordinates
			+ FLAT_FINITE_SUN_SAMPLE_OFFSETS[sampleIndex]
				/ max(uViewportSizePixels, vec2(1.0));
		if (any(lessThan(sampleTextureCoordinates, vec2(0.0)))
			|| any(greaterThanEqual(sampleTextureCoordinates, vec2(1.0)))) continue;
		ViewRay sampleRay = reconstructViewRay(sampleTextureCoordinates);
		float bodyEntryDistanceMeters;
		if (!flatFiniteSunEntryDistance(sampleRay, bodyEntryDistanceMeters)) continue;
		result.diskHitMask[sampleIndex] = 1.0;
		result.diskHitCount += 1.0;
		if (!flatFiniteSunSampleIsSceneBlocked(sampleTextureCoordinates)) {
			result.visibleTransportMask[sampleIndex] = 1.0;
			result.visibleTransportCount += 1.0;
		}
	}
	result.totalProofTransportEvaluationCount = result.visibleTransportCount;
	if (result.diskHitCount > 0.0) {
		float oldHitFraction = result.diskHitCount * FLAT_FINITE_SUN_SAMPLE_WEIGHT;
		result.appliedScale = result.analyticCoverage / oldHitFraction;
		for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
			result.celestialRadiance.channels[channelIndex] =
				productionCelestialRadiance.channels[channelIndex] * result.appliedScale;
		}
	} else if (result.analyticCoverage > 0.0) {
		result.centerBlocked = flatFiniteSunSampleIsSceneBlocked(state.textureCoordinates) ? 1.0 : 0.0;
		if (result.centerBlocked < 0.5) {
			ViewRay sourceCenterRay = ViewRay(
				state.ray.originMeters,
				normalize(FLAT_FINITE_SUN_CENTER_METERS - state.ray.originMeters)
			);
			float bodyEntryDistanceMeters;
			if (flatFiniteSunEntryDistance(sourceCenterRay, bodyEntryDistanceMeters)) {
				SpectralValue sourceRadiance = sampleFlatFiniteSunRadiance();
				SpectralValue transmittance = flatFiniteSunTransmittance(
					sourceCenterRay,
					bodyEntryDistanceMeters
				);
				for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
					result.celestialRadiance.channels[channelIndex] = result.analyticCoverage
						* sourceRadiance.channels[channelIndex]
						* transmittance.channels[channelIndex];
				}
				result.appliedScale = result.analyticCoverage;
				result.fallbackUsed = 1.0;
				result.candidateTransportEvaluationCount = 1.0;
				result.totalProofTransportEvaluationCount += 1.0;
			}
		}
	}
	return result;
}

SpectralValue flatLocalAnalyticComposePreDisplay(
	ShaderState state,
	FlatLocalAnalyticRasterEvaluation evaluation
) {
	SpectralValue result = zeroSpectral();
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		result.channels[channelIndex] = state.pathRadiance.channels[channelIndex]
			+ evaluation.celestialRadiance.channels[channelIndex];
	}
	return result;
}

vec4 flatLocalAnalyticSpectralPacket(SpectralValue value, int packetIndex) {
	vec4 packet = vec4(0.0);
	int firstChannel = packetIndex * 4;
	for (int componentIndex = 0; componentIndex < 4; componentIndex += 1) {
		int channelIndex = firstChannel + componentIndex;
		if (channelIndex < SPECTRAL_CHANNEL_COUNT) packet[componentIndex] = value.channels[channelIndex];
	}
	return packet;
}

float flatLocalAnalyticMaximumCompositionResidual(
	SpectralValue pathRadiance,
	SpectralValue celestialRadiance,
	SpectralValue preDisplayRadiance
) {
	float maximumResidual = 0.0;
	for (int channelIndex = 0; channelIndex < SPECTRAL_CHANNEL_COUNT; channelIndex += 1) {
		maximumResidual = max(
			maximumResidual,
			abs(
				preDisplayRadiance.channels[channelIndex]
					- (pathRadiance.channels[channelIndex] + celestialRadiance.channels[channelIndex])
			)
		);
	}
	return maximumResidual;
}`;
}

/** Return the proof-only mode switch that never changes production state. */
function analyticRasterMainSource() {
	const modes = FLAT_LOCAL_ANALYTIC_RASTER_MODES;
	return `if (uFlatLocalAnalyticRasterMode != ${modes.passthrough}) {
	if (uFlatLocalAnalyticRasterMode >= ${modes.productionCelestialPacketStart}
		&& uFlatLocalAnalyticRasterMode < ${modes.productionCelestialPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = flatLocalAnalyticSpectralPacket(
			celestialRadiance,
			uFlatLocalAnalyticRasterMode - ${modes.productionCelestialPacketStart}
		);
	} else if (uFlatLocalAnalyticRasterMode >= ${modes.productionPreDisplayPacketStart}
		&& uFlatLocalAnalyticRasterMode < ${modes.productionPreDisplayPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = flatLocalAnalyticSpectralPacket(
			preDisplayRadiance,
			uFlatLocalAnalyticRasterMode - ${modes.productionPreDisplayPacketStart}
		);
	} else if (uFlatLocalAnalyticRasterMode >= ${modes.pathPacketStart}
		&& uFlatLocalAnalyticRasterMode < ${modes.pathPacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = flatLocalAnalyticSpectralPacket(
			state.pathRadiance,
			uFlatLocalAnalyticRasterMode - ${modes.pathPacketStart}
		);
	} else if (uFlatLocalAnalyticRasterMode >= ${modes.sourceCachePacketStart}
		&& uFlatLocalAnalyticRasterMode < ${modes.sourceCachePacketStart + SPECTRAL_PACKET_COUNT}) {
		outColor = flatLocalAnalyticSpectralPacket(
			sampleFlatFiniteSunRadiance(),
			uFlatLocalAnalyticRasterMode - ${modes.sourceCachePacketStart}
		);
	} else {
		FlatLocalAnalyticRasterEvaluation analyticEvaluation = evaluateFlatLocalAnalyticRaster(
			state,
			celestialRadiance
		);
		SpectralValue analyticPreDisplayRadiance = flatLocalAnalyticComposePreDisplay(
			state,
			analyticEvaluation
		);
		if (uFlatLocalAnalyticRasterMode == ${modes.candidateNormal}) {
			outColor = encodeDisplayOutput(
				composeSceneLinearSrgb(state, analyticPreDisplayRadiance)
			);
		} else if (uFlatLocalAnalyticRasterMode >= ${modes.candidateCelestialPacketStart}
			&& uFlatLocalAnalyticRasterMode < ${modes.candidateCelestialPacketStart + SPECTRAL_PACKET_COUNT}) {
			outColor = flatLocalAnalyticSpectralPacket(
				analyticEvaluation.celestialRadiance,
				uFlatLocalAnalyticRasterMode - ${modes.candidateCelestialPacketStart}
			);
		} else if (uFlatLocalAnalyticRasterMode >= ${modes.candidatePreDisplayPacketStart}
			&& uFlatLocalAnalyticRasterMode < ${modes.candidatePreDisplayPacketStart + SPECTRAL_PACKET_COUNT}) {
			outColor = flatLocalAnalyticSpectralPacket(
				analyticPreDisplayRadiance,
				uFlatLocalAnalyticRasterMode - ${modes.candidatePreDisplayPacketStart}
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.productionSignedLinearRgb}) {
			outColor = vec4(spectralRadianceToLinearSrgb(preDisplayRadiance), 1.0);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.candidateSignedLinearRgb}) {
			outColor = vec4(spectralRadianceToLinearSrgb(analyticPreDisplayRadiance), 1.0);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.productionDirectY}) {
			outColor = vec4(
				spectralRadianceToPhotopicLuminance(preDisplayRadiance),
				spectralRadianceToPhotopicLuminance(state.pathRadiance),
				spectralRadianceToPhotopicLuminance(celestialRadiance),
				1.0
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.candidateDirectY}) {
			outColor = vec4(
				spectralRadianceToPhotopicLuminance(analyticPreDisplayRadiance),
				spectralRadianceToPhotopicLuminance(state.pathRadiance),
				spectralRadianceToPhotopicLuminance(analyticEvaluation.celestialRadiance),
				spectralRadianceToPhotopicLuminance(celestialRadiance)
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.analyticCoverage}) {
			outColor = vec4(
				analyticEvaluation.analyticCoverage,
				analyticEvaluation.conic.valid ? 1.0 : 0.0,
				analyticEvaluation.conic.mapDeterminant,
				analyticEvaluation.conic.forward ? 1.0 : 0.0
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.legacyHitFraction}) {
			outColor = vec4(
				analyticEvaluation.diskHitCount * FLAT_FINITE_SUN_SAMPLE_WEIGHT,
				analyticEvaluation.visibleTransportCount * FLAT_FINITE_SUN_SAMPLE_WEIGHT,
				analyticEvaluation.diskHitCount,
				analyticEvaluation.visibleTransportCount
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.legacyHitMask}) {
			outColor = analyticEvaluation.diskHitMask;
		} else if (uFlatLocalAnalyticRasterMode == ${modes.visibleTransportMask}) {
			outColor = analyticEvaluation.visibleTransportMask;
		} else if (uFlatLocalAnalyticRasterMode == ${modes.fallbackDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.fallbackUsed,
				analyticEvaluation.centerBlocked,
				analyticEvaluation.candidateTransportEvaluationCount,
				analyticEvaluation.totalProofTransportEvaluationCount
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.weightDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.analyticCoverage,
				analyticEvaluation.diskHitCount * FLAT_FINITE_SUN_SAMPLE_WEIGHT,
				analyticEvaluation.appliedScale,
				analyticEvaluation.diskHitCount
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.compositionResidual}) {
			outColor = vec4(
				flatLocalAnalyticMaximumCompositionResidual(
					state.pathRadiance,
					analyticEvaluation.celestialRadiance,
					analyticPreDisplayRadiance
				),
				flatLocalAnalyticMaximumCompositionResidual(
					state.pathRadiance,
					celestialRadiance,
					preDisplayRadiance
				),
				0.0,
				1.0
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.conicDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.conic.centerPixels,
				analyticEvaluation.conic.centerSupport,
				analyticEvaluation.conic.mapDeterminant
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.transportCountDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.diskHitCount,
				analyticEvaluation.visibleTransportCount,
				analyticEvaluation.candidateTransportEvaluationCount,
				analyticEvaluation.totalProofTransportEvaluationCount
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.coverageNumericsDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.coverage.rawCoverage,
				analyticEvaluation.coverage.coverage,
				analyticEvaluation.coverage.clampResidual,
				analyticEvaluation.coverage.signedMappedArea
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.conicCoefficients0}) {
			outColor = vec4(
				analyticEvaluation.conic.constantTerm,
				analyticEvaluation.conic.linearTerm,
				analyticEvaluation.conic.hessianXX
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.conicCoefficients1}) {
			outColor = vec4(
				analyticEvaluation.conic.hessianXY,
				analyticEvaluation.conic.hessianYY,
				analyticEvaluation.conic.hessianDeterminant,
				analyticEvaluation.conic.axisMinimumOnPixel
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.conicAxisDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.conic.axisBase,
				analyticEvaluation.conic.axisPixelX,
				analyticEvaluation.conic.axisPixelY,
				analyticEvaluation.conic.axisMaximumOnPixel
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.conicScaleDiagnostics}) {
			outColor = vec4(
				analyticEvaluation.conic.coneTangentSquared,
				analyticEvaluation.conic.axisAtEllipseCenter,
				analyticEvaluation.coverage.forwardPolygonVertexCount,
				analyticEvaluation.conic.valid ? 1.0 : 0.0
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.unnormalizedRayDirection}) {
			outColor = vec4(
				normalize(flatLocalAnalyticUnnormalizedModelRay(state.textureCoordinates)),
				1.0
			);
		} else if (uFlatLocalAnalyticRasterMode == ${modes.productionRayDirection}) {
			outColor = vec4(reconstructViewRay(state.textureCoordinates).direction, 1.0);
		}
	}
}`;
}

/**
 * Create the contained Flat/local exact-conic raster and diagnostic contribution.
 *
 * The contribution runs after the unchanged production evaluator and Color
 * contribution. Passthrough mode leaves the production output untouched. The
 * candidate reuses production quarter-ray radiance when geometric hits exist
 * and evaluates at most one additional source-center transport ray otherwise.
 *
 * @returns {ShaderContribution} - Proof-only contribution with no texture or resource declaration.
 */
export function createFlatLocalAnalyticDiskRasterContribution() {
	return ShaderContributions.createShaderContribution({
		id: 'proof-flat-local-analytic-disk-raster',
		owner: 'color',
		requires: [
			'runtime.initialState',
			'geometry.reconstructViewRay',
			'geometry.finiteCelestialAtmosphereSegment',
			'atmosphere.sampleMedium',
			'cache.sampleFlatFiniteSunRadiance',
			'celestial.evaluateRadiance',
			'composition.composeSpectralRadiance',
			'color.composeSceneColor',
			'color.encodeOutput',
		],
		uniforms: [
			ShaderContributions.createShaderUniformDeclaration(
				'uFlatLocalAnalyticRasterMode',
				'int',
				'proof.flatLocalAnalyticRasterMode',
				FLAT_LOCAL_ANALYTIC_RASTER_MODES.passthrough,
			),
		],
		functions: [
			ShaderContributions.createShaderSourceBlock(
				'proof-flat-local-analytic-disk-raster-functions',
				'diagnosticOutput',
				10,
				analyticRasterFunctionsSource(),
			),
		],
		mainHooks: [
			ShaderContributions.createShaderSourceBlock(
				'proof-flat-local-analytic-disk-raster-main',
				'diagnosticOutput',
				10,
				analyticRasterMainSource(),
			),
		],
		diagnostics: {
			proofId: 'flat-local-analytic-disk-raster-gpu-proof-v1',
			coverage: 'exact-affine-screen-conic-circle-convex-quad-overlap',
			quarterRayReuse: true,
			maximumAdditionalTransportEvaluations: 1,
			fallbackTransportRay: 'finite-source-center',
			fallbackVisibilitySample: 'current-output-pixel-center-scene-hit',
			declaresGpuResources: false,
		},
	});
}
