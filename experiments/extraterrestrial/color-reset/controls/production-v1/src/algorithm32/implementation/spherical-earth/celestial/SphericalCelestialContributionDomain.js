import {CanonicalValueHash} from '../../../value-identity/CanonicalValueHash.js';
import {CacheValues} from '../../../gpu-cache-runtime/CacheValues.js';
import {CacheBuildModules} from '../../../shader-assembly/cache-pass/CacheBuildModules.js';
import {ShaderContributions} from '../../../shader-assembly/base/ShaderContributions.js';
import {ShaderSource} from '../../../shader-assembly/base/ShaderSource.js';
import {GeometryDirections} from '../../../geometry-support/GeometryDirections.js';
import AngleMath from '../../../math/AngleMath.js';
import DistanceMath from '../../../math/DistanceMath.js';
import VectorMath from '../../../math/VectorMath.js';
import {
	SPHERICAL_CELESTIAL_ALTITUDE_FRACTIONS,
	SPHERICAL_CELESTIAL_CAPABILITY_FAMILY,
	SPHERICAL_CELESTIAL_DIRECTION_COORDINATES,
	SPHERICAL_CELESTIAL_DOMAIN_ID,
} from '../consts.js';

/** Geometry-owned spherical celestial placement, support, domain, stencil, and query operations. */
export class SphericalCelestialContributionDomain {
	/** @type {SphericalCelestialContributionDomainConfiguration} */
	_configuration;
	/** @type {CelestialContributionDomainDescription} */
	_description;

	/**
	 * Creates the first spherical celestial contribution domain.
	 *
	 * @param {SphericalCelestialContributionDomainConfiguration} configuration - Current spherical geometry facts.
	 */
	constructor(configuration) {
		this._configuration = configuration;
		const atmosphereHeightMeters =
			DistanceMath.toMeters(configuration.topRadius) - DistanceMath.toMeters(configuration.bottomRadius);
		const altitudeNodes = SPHERICAL_CELESTIAL_ALTITUDE_FRACTIONS.map(
			/**
			 * Called by Array.prototype.map to resolve one physical altitude node.
			 * @param {number} fraction - Fraction of the active atmosphere height.
			 * @returns {Distance} - Unit-bearing altitude node.
			 */
			(fraction) => DistanceMath.inMeters(atmosphereHeightMeters * fraction),
		);
		const facts = {
			id: SPHERICAL_CELESTIAL_DOMAIN_ID,
			family: SPHERICAL_CELESTIAL_CAPABILITY_FAMILY,
			bottomRadius: configuration.bottomRadius,
			topRadius: configuration.topRadius,
			altitudeNodes,
			directionCoordinates: SPHERICAL_CELESTIAL_DIRECTION_COORDINATES,
		};
		this._description = {
			id: facts.id,
			contentHash: CanonicalValueHash.sha256Value(facts),
			family: facts.family,
			altitudeNodes,
			directionCoordinates: SPHERICAL_CELESTIAL_DIRECTION_COORDINATES,
		};
	}

	/**
	 * Called by stencil construction to bracket one bounded coordinate.
	 *
	 * @param {readonly number[]} nodes - Strictly increasing domain nodes.
	 * @param {number} value - Coordinate to bracket.
	 * @returns {Readonly<{indices: readonly [number, number], weights: readonly [number, number]}> | null} - Linear stencil or null.
	 */
	_bracket(nodes, value) {
		const tolerance =
			128 * Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(nodes[0]), Math.abs(nodes.at(-1)));
		if (value < nodes[0] - tolerance || value > nodes.at(-1) + tolerance) {
			return null;
		}

		const exactIndex = nodes.findIndex((node) => Math.abs(node - value) <= tolerance);
		if (exactIndex >= 0) {
			return {indices: [exactIndex, exactIndex], weights: [1, 0]};
		}

		let upperIndex = 1;
		while (nodes[upperIndex] < value) {
			upperIndex += 1;
		}
		const lowerIndex = upperIndex - 1;
		const upperWeight = (value - nodes[lowerIndex]) / (nodes[upperIndex] - nodes[lowerIndex]);
		return {
			indices: [lowerIndex, upperIndex],
			weights: [1 - upperWeight, upperWeight],
		};
	}

	/**
	 * Called by disk-support resolution to integrate a uniformly bright circle cut by a horizon line.
	 *
	 * @param {number} relativeElevationRadians - Disk-center elevation relative to the geometric horizon.
	 * @param {number} angularRadiusRadians - Positive disk angular radius.
	 * @returns {number} - Visible disk fraction in [0, 1].
	 */
	_diskFraction(relativeElevationRadians, angularRadiusRadians) {
		if (relativeElevationRadians >= angularRadiusRadians) return 1;
		if (relativeElevationRadians <= -angularRadiusRadians) return 0;

		const normalizedElevation = relativeElevationRadians / angularRadiusRadians;
		return (
			(Math.acos(-normalizedElevation) +
				normalizedElevation * Math.sqrt(Math.max(0, 1 - normalizedElevation ** 2))) /
			Math.PI
		);
	}

	/**
	 * Called by query construction to require one placement at its roster position.
	 *
	 * @param {CelestialResolvedPlacement | undefined} placement - Candidate placement.
	 * @param {string} sourceId - Required source identifier.
	 * @param {CelestialSourceKind} kind - Required source kind.
	 * @returns {CelestialResolvedPlacement} - Matching placement.
	 */
	_requirePlacement(placement, sourceId, kind) {
		if (placement?.sourceId !== sourceId || placement.kind !== kind) {
			throw new RangeError(`Spherical celestial placement for ${sourceId} is missing or out of roster order.`);
		}
		return placement;
	}

	/** @returns {CelestialContributionDomainDescription} - Static spherical `(h,u)` domain. */
	describe() {
		return this._description;
	}

	/**
	 * Create the geometry-owned runtime representation of one two-axis celestial-cache stencil.
	 *
	 * @param {CelestialCacheShaderContributionRequest} request - Trusted model and query facts for the live stencil contribution.
	 * @returns {ShaderContribution} - Spherical celestial-cache stencil type contribution.
	 */
	createCelestialCacheShaderContribution(request) {
		const queryPacket = /** @type {SphericalCelestialQueryPacket} */ (request.queryPacket);
		const receiverStencil = queryPacket.receiverStencil;
		const directionStencil = queryPacket.sun.directionStencil;
		const receiverPositionMeters = DistanceMath.acceptPositionInMeters(
			request.queryPacket.receiverPosition,
			'Celestial shader query receiver',
		);
		const receiverUp = GeometryDirections.normalizeTrustedDirection(
			receiverPositionMeters,
			'Celestial shader query receiver up',
		);
		const horizonRadialCosine = this._configuration.geometry.resolveCelestialHorizonRadialCosine(
			request.queryPacket.receiverPosition,
		);
		const valid = receiverStencil.valid && directionStencil.valid;
		return ShaderContributions.createShaderContribution({
			id: 'geometry-spherical-celestial-cache-stencil',
			owner: 'geometry',
			provides: [
				'geometry.celestialCacheStencilTypes',
				'geometry.resolveCelestialCacheStencil',
				'geometry.resolveStellarPointSetCacheStencil',
				'geometry.resolveDistantSunDiskSupport',
			],
			functions: [
				ShaderContributions.createShaderSourceBlock(
					'spherical-celestial-cache-stencil-types',
					'declareTypes',
					0,
					`struct CelestialCacheBilinearStencil {
	ivec2 receiverIndices;
	vec2 receiverWeights;
	ivec2 directionIndices;
	vec2 directionWeights;
	bool valid;
};`,
				),
				ShaderContributions.createShaderSourceBlock(
					'spherical-celestial-cache-stencil-query',
					'sampleCelestialCache',
					0,
					`CelestialCacheBilinearStencil resolveDistantSunCelestialCacheStencil() {
	return CelestialCacheBilinearStencil(
		ivec2(${receiverStencil.indices.join(', ')}),
		vec2(${ShaderSource.formatFloatArray(receiverStencil.weights)}),
		ivec2(${directionStencil.indices.join(', ')}),
		vec2(${ShaderSource.formatFloatArray(directionStencil.weights)}),
		${valid ? 'true' : 'false'}
	);
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'spherical-stellar-point-set-cache-stencil-query',
					'sampleCelestialCache',
					1,
					`const float STELLAR_CELESTIAL_DIRECTION_NODES[${this._description.directionCoordinates.length}] = float[${this._description.directionCoordinates.length}](${ShaderSource.formatFloatArray(this._description.directionCoordinates)});

CelestialCacheBilinearStencil resolveStellarPointSetCacheStencil(vec3 directionToSource) {
	float radialCosine = dot(${ShaderSource.formatVec3(receiverUp)}, normalize(directionToSource));
	if (radialCosine <= ${ShaderSource.formatFloat(horizonRadialCosine)}) {
		return CelestialCacheBilinearStencil(ivec2(0), vec2(0.0), ivec2(0), vec2(0.0), false);
	}
	float directionCoordinate = (radialCosine - ${ShaderSource.formatFloat(horizonRadialCosine)})
		/ max(1.0 - ${ShaderSource.formatFloat(horizonRadialCosine)}, 0.000001);
	if (directionCoordinate < STELLAR_CELESTIAL_DIRECTION_NODES[0]
		|| directionCoordinate > STELLAR_CELESTIAL_DIRECTION_NODES[${this._description.directionCoordinates.length - 1}]) {
		return CelestialCacheBilinearStencil(ivec2(0), vec2(0.0), ivec2(0), vec2(0.0), false);
	}
	int lowerDirection = 0;
	int upperDirection = 0;
	for (int nodeIndex = 1; nodeIndex < ${this._description.directionCoordinates.length}; nodeIndex += 1) {
		if (directionCoordinate > STELLAR_CELESTIAL_DIRECTION_NODES[nodeIndex]) {
			lowerDirection = nodeIndex;
			upperDirection = nodeIndex;
		} else if (directionCoordinate == STELLAR_CELESTIAL_DIRECTION_NODES[nodeIndex]) {
			lowerDirection = nodeIndex;
			upperDirection = nodeIndex;
			break;
		} else {
			lowerDirection = nodeIndex - 1;
			upperDirection = nodeIndex;
			break;
		}
	}
	float span = STELLAR_CELESTIAL_DIRECTION_NODES[upperDirection] - STELLAR_CELESTIAL_DIRECTION_NODES[lowerDirection];
	float upperWeight = span == 0.0 ? 0.0 : (directionCoordinate - STELLAR_CELESTIAL_DIRECTION_NODES[lowerDirection]) / span;
	return CelestialCacheBilinearStencil(
		ivec2(${receiverStencil.indices.join(', ')}),
		vec2(${ShaderSource.formatFloatArray(receiverStencil.weights)}),
		ivec2(lowerDirection, upperDirection),
		vec2(1.0 - upperWeight, upperWeight),
		${receiverStencil.valid ? 'true' : 'false'}
	);
}`,
				),
				ShaderContributions.createShaderSourceBlock(
					'spherical-celestial-live-disk-support',
					'evaluateCelestialRadiance',
					0,
					`bool distantSunCelestialSampleHasGroundSupport(vec3 sampleDirection) {
	return dot(${ShaderSource.formatVec3(receiverUp)}, normalize(sampleDirection))
		>= ${ShaderSource.formatFloat(horizonRadialCosine)};
}`,
				),
			],
			diagnostics: {
				queryIdentity: request.queryPacket.contentHash,
				receiverClassification: receiverStencil.classification,
				directionClassification: directionStencil.classification,
			},
		});
	}

	/**
	 * Resolve visible support for the configured distant uniform Sun.
	 *
	 * @param {Position} receiverPosition - Configured model-space receiver.
	 * @param {UnitVector3} directionToSource - Model-space Sun-center direction.
	 * @param {Angle} angularRadius - Positive apparent disk radius.
	 * @returns {DistantSunVisibleSupport} - Full, partial, or empty disk support.
	 */
	resolveDistantSunSupport(receiverPosition, directionToSource, angularRadius) {
		const receiver = DistanceMath.acceptPositionInMeters(receiverPosition, 'Celestial support receiver');
		const direction = GeometryDirections.normalizeTrustedDirection(
			directionToSource,
			'Celestial support direction',
		);
		const angularRadiusRadians = AngleMath.toRadians(angularRadius);
		const localUp = GeometryDirections.normalizeTrustedDirection(receiver, 'Celestial support local up');
		const centerRadialCosine = VectorMath.dot(localUp, direction);
		const horizonRadialCosine = this._configuration.geometry.resolveCelestialHorizonRadialCosine(receiverPosition);
		const relativeElevationRadians =
			Math.asin(Math.max(-1, Math.min(1, centerRadialCosine))) -
			Math.asin(Math.max(-1, Math.min(1, horizonRadialCosine)));
		const visibleFraction = this._diskFraction(relativeElevationRadians, angularRadiusRadians);
		return {
			kind: 'uniform-disk',
			angularRadiusRadians,
			classification: visibleFraction === 1 ? 'full' : visibleFraction === 0 ? 'empty' : 'partial',
			visibleFraction,
		};
	}

	/**
	 * Resolve configured spherical celestial sources in exact roster order.
	 *
	 * @param {CelestialPlacementResolutionRequest} request - Accepted roster and construction-time observation.
	 * @returns {readonly CelestialResolvedPlacement[]} - Sun followed by the optional stellar point set.
	 */
	resolvePlacements(request) {
		if (request.roster.family !== SPHERICAL_CELESTIAL_CAPABILITY_FAMILY) {
			throw new RangeError('SphericalEarthGeometry requires the spherical celestial source family.');
		}
		if (!Object.is(request.roster.sun, this._configuration.lightSource)) {
			throw new RangeError('Spherical celestial Sun must be the configured atmospheric light source.');
		}
		const configuredObservation = this._configuration.observation;
		if (
			request.observation.instant !== configuredObservation.instant ||
			AngleMath.toDegrees(request.observation.location.latitude) !==
				AngleMath.toDegrees(configuredObservation.location.latitude) ||
			AngleMath.toDegrees(request.observation.location.longitude) !==
				AngleMath.toDegrees(configuredObservation.location.longitude)
		) {
			throw new RangeError('Spherical celestial placement observation must match geometry construction.');
		}

		const sunState = /** @type {CelestialSourceProvider} */ (request.roster.sun).createCelestialPlacementState(
			request.observation,
		);
		if (sunState.kind !== 'distant-uniform-sun' || sunState.sourceId !== request.roster.sun.id) {
			throw new RangeError('Spherical celestial Sun placement state is incompatible.');
		}
		const receiverPosition = this._configuration.geometry.createCelestialReceiverPositionAtAltitude(
			this._configuration.observerHeight,
		);
		const sunDefinition = request.roster.sun.celestialSourceDefinition;
		const placements = /** @type {CelestialResolvedPlacement[]} */ ([
			{
				sourceId: request.roster.sun.id,
				kind: 'distant-uniform-sun',
				directionToSource: this._configuration.directionToSource,
				support: this.resolveDistantSunSupport(
					receiverPosition,
					this._configuration.directionToSource,
					sunDefinition.angularRadius,
				),
			},
		]);

		if (request.roster.stars !== undefined && request.roster.stars !== null) {
			const stellarSource = request.roster.stars;
			const stellarState = /** @type {CelestialSourceProvider} */ (stellarSource).createCelestialPlacementState(
				request.observation,
			);
			if (
				stellarState.kind !== 'static-stellar-point-set' ||
				stellarState.sourceId !== stellarSource.id ||
				stellarState.frame !== 'celestial-rh-v1' ||
				stellarState.epoch.instant !== stellarSource.celestialSourceDefinition.catalog.epoch.instant ||
				stellarState.epoch.timeScale !== stellarSource.celestialSourceDefinition.catalog.epoch.timeScale ||
				stellarState.memberDirections.length !== stellarSource.celestialSourceDefinition.members.length ||
				stellarState.memberDirections.some(
					/**
					 * Called by Array.prototype.some to detect a placement direction that differs from its source definition.
					 * @param {UnitVector3} direction - Placement-state member direction.
					 * @param {number} index - Canonical member index.
					 * @returns {boolean} - Whether any tuple component differs.
					 */
					(direction, index) =>
						direction.some(
							/**
							 * Called by Array.prototype.some to compare one direction component.
							 * @param {number} value - Placement-state component.
							 * @param {number} componentIndex - Tuple component index.
							 * @returns {boolean} - Whether the component differs.
							 */
							(value, componentIndex) =>
								value !==
								stellarSource.celestialSourceDefinition.members[index].direction[componentIndex],
						),
				)
			) {
				throw new RangeError('Spherical stellar placement state is incompatible.');
			}
			placements.push({
				sourceId: stellarSource.id,
				kind: 'static-stellar-point-set',
				memberDirections: stellarState.memberDirections.map(
					/**
					 * Called by Array.prototype.map to express one static-epoch celestial direction in the model frame.
					 * @param {UnitVector3} direction - Canonical celestial-rh-v1 member direction.
					 * @returns {UnitVector3} - Model-space member direction.
					 */
					(direction) =>
						this._configuration.geometry.expressCelestialDirectionInModel(direction, request.observation),
				),
			});
		}

		return placements;
	}

	/**
	 * Derive one construction sample from exact domain indices.
	 *
	 * @param {CelestialBuildSampleRequest} request - Domain, placement, and coordinate indices.
	 * @returns {CelestialBuildSample} - Geometry-owned receiver, direction, coordinate, path, and support.
	 */
	createBuildSample(request) {
		if (request.domain.contentHash !== this._description.contentHash) {
			throw new RangeError('Celestial build sample domain does not match spherical geometry.');
		}
		if (request.placement.kind !== 'distant-uniform-sun' && request.placement.kind !== 'static-stellar-point-set') {
			throw new RangeError('Spherical celestial build samples require a distant source placement.');
		}
		const altitude = this._description.altitudeNodes[request.receiverIndex];
		const directionCoordinate = this._description.directionCoordinates[request.directionIndex];
		if (altitude === undefined || directionCoordinate === undefined) {
			throw new RangeError('Celestial build sample indices are outside the spherical domain.');
		}

		const receiverPosition = this._configuration.geometry.createCelestialReceiverPositionAtAltitude(altitude);
		const horizonRadialCosine = this._configuration.geometry.resolveCelestialHorizonRadialCosine(receiverPosition);
		const radialCosine = horizonRadialCosine + directionCoordinate * (1 - horizonRadialCosine);
		const directionToSource = /** @type {UnitVector3} */ ([
			Math.sqrt(Math.max(0, 1 - radialCosine * radialCosine)),
			0,
			radialCosine,
		]);
		const sourcePath = this._configuration.geometry.resolveAtmospherePath({
			ray: {origin: receiverPosition, direction: directionToSource},
			sourcePathLimit: {maxDistance: null, reason: 'distant-source-to-atmosphere-boundary'},
		});

		return {
			sourceId: request.placement.sourceId,
			receiverPosition,
			directionToSource,
			atmosphereCoordinate: this._configuration.geometry.resolveAtmosphereCoordinate(receiverPosition),
			sourcePath,
			supported: sourcePath.blockedByGround !== true,
		};
	}

	/**
	 * Create the spherical geometry portion of one distant-Sun celestial GPU pass.
	 *
	 * @param {DistantSunCelestialCacheModuleContext} context - Exact celestial construction context.
	 * @returns {CacheBuildModule} - Geometry-owned node and source-path module.
	 */
	createDistantSunCelestialCacheModule(context) {
		if (context.domain.contentHash !== this._description.contentHash) {
			throw new RangeError('Distant-Sun celestial GPU domain does not match spherical geometry.');
		}
		const expectedSupport = [];
		const radialCosines = [];
		const sourcePathDistances = [];
		for (let receiverIndex = 0; receiverIndex < this._description.altitudeNodes.length; receiverIndex += 1) {
			for (
				let directionIndex = 0;
				directionIndex < this._description.directionCoordinates.length;
				directionIndex += 1
			) {
				const sample = this.createBuildSample({
					domain: context.domain,
					placement: context.placement,
					receiverIndex,
					directionIndex,
				});
				expectedSupport.push(sample.supported ? 1 : 0);
				radialCosines.push(sample.directionToSource[2]);
				sourcePathDistances.push(DistanceMath.toMeters(sample.sourcePath.length));
			}
		}
		if (
			expectedSupport.length !== context.supportMask.values.length ||
			expectedSupport.some((value, index) => value !== context.supportMask.values[index])
		) {
			throw new RangeError('Distant-Sun celestial GPU support mask does not match spherical geometry.');
		}

		const createNodeData = (id, quantity, units, values) =>
			CacheValues.createData({
				id,
				quantity,
				units,
				shape: [context.output.storage.width, context.output.storage.height],
				values,
			});
		const bindings = /** @type {CacheBinding[]} */ ([]);
		bindings.push(
			.../** @type {CacheBinding[]} */ ([
				{
					spec: {
						id: 'spherical-celestial-bottom-radius',
						name: 'uCelestialBottomRadius',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: this._configuration.bottomRadius,
				},
				{
					spec: {
						id: 'spherical-celestial-top-radius',
						name: 'uCelestialTopRadius',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: this._configuration.topRadius,
				},
			]),
		);
		bindings.push({
			spec: {
				id: 'spherical-celestial-radial-cosines',
				name: 'uCelestialRadialCosines',
				kind: 'data',
				shaderType: 'sampler2D',
				frequency: 'build',
			},
			value: createNodeData(
				'algorithm32-spherical-celestial-radial-cosines-v1',
				'radial-direction-cosine',
				'1',
				radialCosines,
			),
		});
		bindings.push({
			spec: {
				id: 'spherical-celestial-source-path-distances',
				name: 'uCelestialSourcePathDistances',
				kind: 'data',
				shaderType: 'sampler2D',
				frequency: 'build',
			},
			value: createNodeData(
				'algorithm32-spherical-celestial-source-path-distances-v1',
				'source-path-distance',
				'meters',
				sourcePathDistances,
			),
		});
		bindings.push({
			spec: {
				id: 'spherical-celestial-altitude-nodes',
				name: 'uCelestialAltitudeNodes',
				kind: 'data',
				shaderType: 'sampler2D',
				frequency: 'build',
			},
			value: CacheValues.createData({
				id: 'algorithm32-spherical-celestial-altitude-nodes-v1',
				quantity: 'altitude-above-ground',
				units: 'meters',
				shape: [this._description.altitudeNodes.length],
				values: this._description.altitudeNodes.map(
					/**
					 * Called by Array.prototype.map to extract one construction altitude.
					 * @param {Distance} altitude - Unit-bearing altitude node.
					 * @returns {number} - Altitude above ground in meters.
					 */
					(altitude) => DistanceMath.toMeters(altitude),
				),
			}),
		});
		bindings.push({
			spec: {
				id: 'spherical-celestial-direction-nodes',
				name: 'uCelestialDirectionNodes',
				kind: 'data',
				shaderType: 'sampler2D',
				frequency: 'build',
			},
			value: CacheValues.createData({
				id: 'algorithm32-spherical-celestial-direction-nodes-v1',
				quantity: 'horizon-normalized-direction',
				units: '1',
				shape: [this._description.directionCoordinates.length],
				values: this._description.directionCoordinates,
			}),
		});
		bindings.push({
			spec: {
				id: 'spherical-celestial-support-mask',
				name: 'uCelestialSupportMask',
				kind: 'data',
				shaderType: 'sampler2D',
				frequency: 'build',
			},
			value: createNodeData(
				'algorithm32-spherical-celestial-support-mask-v1',
				'support-mask',
				'1',
				context.supportMask.values,
			),
		});

		return CacheBuildModules.createBuildModule({
			id: 'algorithm32-spherical-earth-distant-sun-celestial-module-v1',
			owner: 'geometry',
			provides: ['geometry.celestialNode', 'geometry.celestialSourcePath'],
			requires: [],
			blocks: [
				{
					id: 'spherical-celestial-node-functions',
					phase: 'function',
					order: 0,
					source: `float cacheCelestialNode(sampler2D field, int directionIndex, int receiverIndex) {
	return texelFetch(field, ivec2(directionIndex, receiverIndex), 0).r;
}

bool cacheCelestialSupported(int directionIndex, int receiverIndex) {
	return cacheCelestialNode(uCelestialSupportMask, directionIndex, receiverIndex) > 0.5;
}

float cacheCelestialStartAltitude(int receiverIndex) {
	return texelFetch(uCelestialAltitudeNodes, ivec2(receiverIndex, 0), 0).r;
}

float cacheCelestialRadialCosine(int directionIndex, int receiverIndex) {
	return cacheCelestialNode(uCelestialRadialCosines, directionIndex, receiverIndex);
}

float cacheCelestialSourcePathDistance(int directionIndex, int receiverIndex) {
	return cacheCelestialNode(uCelestialSourcePathDistances, directionIndex, receiverIndex);
}

vec3 cacheCelestialPosition(int directionIndex, int receiverIndex) {
	float altitudeMeters = cacheCelestialStartAltitude(receiverIndex);
	return vec3(0.0, 0.0, uCelestialBottomRadius + altitudeMeters);
}

vec3 cacheCelestialDirection(int directionIndex, int receiverIndex) {
	vec3 positionMeters = cacheCelestialPosition(directionIndex, receiverIndex);
	float radiusMeters = length(positionMeters);
	float horizonRadialCosine = -sqrt(max(
		0.0,
		1.0 - pow(uCelestialBottomRadius / radiusMeters, 2.0)
	));
	float directionCoordinate = texelFetch(
		uCelestialDirectionNodes,
		ivec2(directionIndex, 0),
		0
	).r;
	float radialCosine = horizonRadialCosine
		+ directionCoordinate * (1.0 - horizonRadialCosine);
	return vec3(sqrt(max(0.0, 1.0 - radialCosine * radialCosine)), 0.0, radialCosine);
}

float cacheAltitude(vec3 positionMeters) {
	return max(length(positionMeters) - uCelestialBottomRadius, 0.0);
}

bool cacheRayBlockedByGround(vec3 positionMeters, vec3 direction) {
	return false;
}

float cacheSourcePathDistance(vec3 positionMeters, vec3 direction) {
	float radialProjection = dot(positionMeters, direction);
	float discriminant = radialProjection * radialProjection
		+ uCelestialTopRadius * uCelestialTopRadius
		- dot(positionMeters, positionMeters);
	return max(-radialProjection + sqrt(max(discriminant, 0.0)), 0.0);
}`,
				},
			],
			bindings,
		});
	}

	/**
	 * Resolve bounded linear reconstruction over the receiver-altitude axis.
	 *
	 * @param {Position} receiverPosition - Physical model-space receiver.
	 * @returns {CelestialReceiverStencil} - Hashed receiver stencil.
	 */
	resolveReceiverStencil(receiverPosition) {
		const atmosphereCoordinate = this._configuration.geometry.resolveAtmosphereCoordinate(receiverPosition);
		const altitude = DistanceMath.inMeters(DistanceMath.toMeters(atmosphereCoordinate.altitude));
		const altitudeValues = this._description.altitudeNodes.map(
			/**
			 * Called by Array.prototype.map to select one altitude value.
			 * @param {Distance} node - Unit-bearing altitude node.
			 * @returns {number} - Altitude in meters.
			 */
			(node) => node.value,
		);
		const bracket = this._bracket(altitudeValues, altitude.value);
		const facts = {
			classification: bracket === null ? /** @type {const} */ ('out-of-domain') : /** @type {const} */ ('valid'),
			valid: bracket !== null,
			altitude,
			indices: bracket?.indices ?? /** @type {const} */ ([0, 0]),
			weights: bracket?.weights ?? /** @type {const} */ ([0, 0]),
		};
		return {...facts, contentHash: CanonicalValueHash.sha256Value(facts)};
	}

	/**
	 * Resolve bounded horizon-normalized reconstruction for one source direction.
	 *
	 * @param {Position} receiverPosition - Physical model-space receiver.
	 * @param {UnitVector3} directionToSource - Model-space source direction.
	 * @returns {CelestialDirectionStencil} - Hashed direction stencil or exact-zero classification.
	 */
	resolveDirectionStencil(receiverPosition, directionToSource) {
		const receiverStencil = this.resolveReceiverStencil(receiverPosition);
		const direction = GeometryDirections.normalizeTrustedDirection(directionToSource, 'Celestial query direction');
		let classification = /** @type {CelestialDirectionStencilClassification} */ ('out-of-domain');
		let directionCoordinate = /** @type {number | null} */ (null);
		let bracket =
			/** @type {Readonly<{indices: readonly [number, number], weights: readonly [number, number]}> | null} */ (
				null
			);

		if (receiverStencil.valid) {
			if (this._configuration.geometry.isCelestialDirectionGroundBlocked(receiverPosition, direction)) {
				classification = 'ground-horizon';
			} else {
				const localUp = GeometryDirections.normalizeTrustedDirection(
					DistanceMath.acceptPositionInMeters(receiverPosition, 'Celestial receiver local up'),
					'Celestial receiver local up',
				);
				const radialCosine = VectorMath.dot(localUp, direction);
				const horizonRadialCosine =
					this._configuration.geometry.resolveCelestialHorizonRadialCosine(receiverPosition);
				directionCoordinate = (radialCosine - horizonRadialCosine) / (1 - horizonRadialCosine);
				bracket = this._bracket(this._description.directionCoordinates, directionCoordinate);
				classification = bracket === null ? 'out-of-domain' : 'clear';
			}
		}

		const facts = {
			classification,
			valid: classification === 'clear',
			directionCoordinate,
			indices: bracket?.indices ?? /** @type {const} */ ([0, 0]),
			weights: bracket?.weights ?? /** @type {const} */ ([0, 0]),
		};
		return {...facts, contentHash: CanonicalValueHash.sha256Value(facts)};
	}

	/**
	 * Assemble one complete deterministic spherical celestial query packet.
	 *
	 * @param {CelestialSourceRoster} roster - Accepted spherical source roster.
	 * @param {readonly CelestialResolvedPlacement[]} placements - Placements in roster order.
	 * @returns {SphericalCelestialQueryPacket} - Complete geometry-derived query facts.
	 */
	createQueryPacket(roster, placements) {
		if (roster.family !== SPHERICAL_CELESTIAL_CAPABILITY_FAMILY) {
			throw new RangeError('Spherical geometry requires the spherical celestial source family.');
		}
		const expectedPlacementCount = roster.stars === undefined || roster.stars === null ? 1 : 2;
		if (placements.length !== expectedPlacementCount) {
			throw new RangeError('Spherical celestial placements must exactly match roster order.');
		}

		const sunPlacement =
			/** @type {Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>} */ (
				this._requirePlacement(placements[0], roster.sun.id, 'distant-uniform-sun')
			);
		const receiverPosition = this._configuration.geometry.createCelestialReceiverPositionAtAltitude(
			this._configuration.observerHeight,
		);
		const receiverStencil = this.resolveReceiverStencil(receiverPosition);
		const sun = {
			placement: sunPlacement,
			directionStencil: this.resolveDirectionStencil(receiverPosition, sunPlacement.directionToSource),
		};
		let stars = /** @type {SphericalStellarPointSetQuery | null} */ (null);
		if (roster.stars !== undefined && roster.stars !== null) {
			const stellarPlacement =
				/** @type {Extract<CelestialResolvedPlacement, {readonly kind: 'static-stellar-point-set'}>} */ (
					this._requirePlacement(placements[1], roster.stars.id, 'static-stellar-point-set')
				);
			stars = {
				placement: stellarPlacement,
				memberDirectionStencils: stellarPlacement.memberDirections.map(
					/**
					 * Called by Array.prototype.map to resolve one member direction stencil.
					 * @param {UnitVector3} direction - Model-space stellar member direction.
					 * @returns {CelestialDirectionStencil} - Hashed direction stencil.
					 */
					(direction) => this.resolveDirectionStencil(receiverPosition, direction),
				),
			};
		}

		const facts = {
			family: SPHERICAL_CELESTIAL_CAPABILITY_FAMILY,
			domainIdentity: this._description.contentHash,
			observation: this._configuration.observation,
			receiverPosition,
			receiverStencil,
			sun,
			stars,
			sourceIdentities: {
				sun: /** @type {CelestialSourceProvider} */ (roster.sun).describeCelestialSourceIdentity(),
				stars:
					roster.stars === undefined || roster.stars === null
						? null
						: /** @type {CelestialSourceProvider} */ (roster.stars).describeCelestialSourceIdentity(),
			},
		};
		return {
			family: facts.family,
			domainIdentity: facts.domainIdentity,
			observation: facts.observation,
			receiverPosition: facts.receiverPosition,
			receiverStencil: facts.receiverStencil,
			sun: facts.sun,
			stars: facts.stars,
			contentHash: CanonicalValueHash.sha256Value(facts),
		};
	}
}
