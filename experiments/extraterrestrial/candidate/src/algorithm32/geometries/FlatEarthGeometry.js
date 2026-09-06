import * as THREE from 'three';

import ExactFlatGroundObject from '../three/ExactFlatGroundObject.js';
import { createSkyIlluminanceProbePlan } from './SkyIlluminanceProbePlan.js';
import {
	createShaderContribution,
	createShaderSourceBlock,
	createShaderUniformDescriptor,
	formatShaderFloat,
	formatShaderFloatArray,
	formatShaderVec3,
} from '../shader/shaderContribution.js';
import {
	directionTuple,
	normalizeDirection,
	positionInMeters,
	positionToMeters,
	scenePositionInUnits,
	sceneScaleFromRequest,
	threeVectorTuple,
} from './geometryCoordinates.js';
import {
	displayRgbaOrNull,
	geometryEndpointShadowRequestOrNull,
	optionalDistanceToMeters,
	optionalString,
	positiveDistanceMetersOrDefault,
	positiveIntegerOrDefault,
	sourcePathLimitDistanceToMeters,
	stringOrDefault,
	visualMaterialLightingOrDefault,
} from './geometryRequestNormalization.js';
import DistanceMath from '../utils/DistanceMath.js';
import { finiteNumberOrDefault } from '../utils/numericValues.js';
import SceneMath from '../utils/SceneMath.js';
import VectorMath from '../utils/VectorMath.js';
import {
	createCubedSphereW27DirectionStencil,
} from '../domains/index.js';
import { PositionDomainDescriptor } from '../domains/PositionDomainDescriptor.js';
import {
	createCacheBuildModule,
	createCacheData,
} from '../caches/gpu/cacheBuildContracts.js';
import { FlatFiniteSunPrimaryCache } from '../caches/celestial/FlatFiniteSunPrimaryCache.js';
import { FlatFiniteSunGpuCacheController } from '../caches/celestial/FlatFiniteSunGpuCacheController.js';
import {
	FLAT_ATMOSPHERE_PATH_DEFAULT_INTERVAL_COUNT,
	FLAT_GEOMETRY_BOUNDARY_EPSILON,
	FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS,
	FLAT_GEOMETRY_GROUND_REFLECTION_SYMBOL,
	FLAT_GEOMETRY_IDENTITY_MATRIX4,
	FLAT_LOCAL_CACHE_DEFAULT_RHO_NODE_FRACTIONS,
	FLAT_LOCAL_CACHE_DEFAULT_Z_NODE_FRACTIONS,
	FLAT_LOCAL_CACHE_RHO_ZERO_RADIAL_DIRECTION,
	FLAT_OBSERVER_LOCAL_SCENE_FRAME,
} from './consts.js';

/**
 * Own flat z-up atmosphere geometry for local-source transport.
 */
export class FlatEarthGeometry {
	/**
	 * Resolve a renderable flat-ground extent in meters.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - Supplies geometry.
	 * @returns {number} The full ground width and depth.
	 */
	_flatGroundExtentMeters(configuration) {
		const extentCandidates = [
			configuration.sceneSkyRayLimit?.value,
			configuration.observerCenteredDome?.maxObserverViewRayExtent.value,
			configuration.topAltitude.value * 20,
			10000,
		].filter((value) => Number.isFinite(value) && value > 0);

		return Math.max(...extentCandidates) * 2;
	}

	/**
	 * Build the configured final-view-only observer dome.
	 *
	 * @param {readonly number[]} observerPositionMeters - Supplies observer position.
	 * @param {FlatObserverCenteredDomeConfig | null} domeConfig - Supplies dome config.
	 * @returns {FlatObserverCenteredDomeDescriptor | null} The derived dome.
	 */
	_buildObserverCenteredDomeDescriptor(
		observerPositionMeters,
		domeConfig,
	) {
		if (!domeConfig) {
			return null;
		}

		const {
			centerPolicy = 'observer-centered',
			apexAltitude,
			maxObserverViewRayExtent,
		} = domeConfig;
		DistanceMath.assertDistance(
			apexAltitude,
			'observerCenteredDome.apexAltitude',
		);
		DistanceMath.assertDistance(
			maxObserverViewRayExtent,
			'observerCenteredDome.maxObserverViewRayExtent',
		);
		const apexAltitudeMeters = DistanceMath.toMeters(apexAltitude);
		const maxObserverViewRayExtentMeters =
			DistanceMath.toMeters(maxObserverViewRayExtent);
		const observerAltitudeMeters = observerPositionMeters[2];

		if (centerPolicy !== 'observer-centered') {
			throw new RangeError(
				'FlatEarthGeometry only supports observer-centered dome policy.',
			);
		}
		if (apexAltitudeMeters <= observerAltitudeMeters) {
			throw new RangeError(
				'observerCenteredDome.apexAltitude must be above the observer.',
			);
		}
		if (maxObserverViewRayExtentMeters <= 0) {
			throw new RangeError(
				'observerCenteredDome.maxObserverViewRayExtent must be positive.',
			);
		}

		const centerZ = (
			apexAltitudeMeters ** 2
			- observerAltitudeMeters ** 2
			- maxObserverViewRayExtentMeters ** 2
		) / (2 * (apexAltitudeMeters - observerAltitudeMeters));
		const sphereRadiusMeters = apexAltitudeMeters - centerZ;
		if (!Number.isFinite(centerZ) || sphereRadiusMeters <= 0) {
			throw new RangeError(
				'observerCenteredDome produced an invalid derived sphere.',
			);
		}

		return {
			centerPolicy,
			apexAltitude: DistanceMath.inMeters(apexAltitudeMeters),
			maxObserverViewRayExtent:
				DistanceMath.inMeters(maxObserverViewRayExtentMeters),
			observerAltitude: DistanceMath.inMeters(observerAltitudeMeters),
			sphereCenter: positionInMeters([
				observerPositionMeters[0],
				observerPositionMeters[1],
				centerZ,
			]),
			sphereRadius: DistanceMath.inMeters(sphereRadiusMeters),
		};
	}

	/**
	 * Resolve an optional camera position in flat model-space meters.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - Supplies camera facts.
	 * @param {readonly [number, number, number]} observerPositionMeters - Supplies observer position.
	 * @returns {readonly [number, number, number] | null} The camera position.
	 */
	_cameraPositionMetersOrNull(request, observerPositionMeters) {
		if (request.cameraPosition !== undefined) {
			return positionToMeters(request.cameraPosition, 'Camera position');
		}

		const scenePosition = request.cameraScenePosition;
		if (scenePosition !== undefined) {
			SceneMath.assertScenePosition(scenePosition, 'cameraScenePosition');
			const sceneScale = sceneScaleFromRequest(request);
			const vectorMeters =
				SceneMath.toMetersPosition(scenePosition, sceneScale);

			return [
				observerPositionMeters[0] + vectorMeters[0],
				observerPositionMeters[1] - vectorMeters[2],
				vectorMeters[1],
			];
		}
		if (request.camera === undefined) {
			return null;
		}

		const camera = /** @type {{ position?: unknown }} */ (request.camera);
		const sceneScale = sceneScaleFromRequest(request);
		const vector = threeVectorTuple(
			camera.position,
			'Camera position in scene units',
		);

		return [
			observerPositionMeters[0] + vector[0] * sceneScale.value,
			observerPositionMeters[1] - vector[2] * sceneScale.value,
			vector[1] * sceneScale.value,
		];
	}

	/**
	 * Create the visual ground material requested by the integration.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} request - Supplies options.
	 * @returns {THREE.Material} The created material.
	 */
	_createVisualMaterial(request) {
		const displayRgba =
			displayRgbaOrNull(request.visualMaterialDisplayRgba);
		const lighting =
			visualMaterialLightingOrDefault(request.visualMaterialLighting);
		const color = finiteNumberOrDefault(
			request.visualMaterialColor,
			0x4fa33d,
			'visualMaterialColor',
		);
		const materialParameters = {
			color: displayRgba
				? new THREE.Color(
					displayRgba[0] / 255,
					displayRgba[1] / 255,
					displayRgba[2] / 255,
				)
				: color,
			side: THREE.DoubleSide,
		};

		if (displayRgba && displayRgba[3] < 255) {
			materialParameters.transparent = true;
			materialParameters.opacity = displayRgba[3] / 255;
		}

		return lighting === 'lambert'
			? new THREE.MeshLambertMaterial(materialParameters)
			: new THREE.MeshBasicMaterial(materialParameters);
	}

	/**
	 * Assert that a shader descriptor carries flat geometry facts.
	 *
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies the descriptor.
	 * @returns {void}
	 */
	_assertFlatGeometryDescriptor(descriptor) {
		const facts = /** @type {Record<string, any>} */ (
			descriptor?.geometry?.facts ?? {}
		);

		if (!descriptor?.geometry) {
			throw new TypeError(
				'FlatEarthGeometry shader contribution requires a geometry descriptor.',
			);
		}
		if (facts.kind && facts.kind !== 'flat-earth-geometry') {
			throw new TypeError(
				'FlatEarthGeometry shader contribution requires flat Earth geometry.',
			);
		}

		DistanceMath.assertDistance(
			facts.topAltitude,
			'geometry.facts.topAltitude',
		);
		DistanceMath.assertPosition(
			facts.observerPosition,
			'geometry.facts.observerPosition',
		);
		DistanceMath.assertPosition(
			facts.sourcePosition,
			'geometry.facts.sourcePosition',
		);
		if (facts.sourceSubpoint) {
			DistanceMath.assertPosition(
				facts.sourceSubpoint,
				'geometry.facts.sourceSubpoint',
			);
		}
		if (facts.sceneSkyRayLimit) {
			DistanceMath.assertDistance(
				facts.sceneSkyRayLimit,
				'geometry.facts.sceneSkyRayLimit',
			);
		}
		if (facts.observerCenteredDome) {
			DistanceMath.assertPosition(
				facts.observerCenteredDome.sphereCenter,
				'geometry.facts.observerCenteredDome.sphereCenter',
			);
			DistanceMath.assertDistance(
				facts.observerCenteredDome.sphereRadius,
				'geometry.facts.observerCenteredDome.sphereRadius',
			);
		}
	}

	/**
	 * Create evenly spaced nodes over one closed physical interval.
	 *
	 * @param {number} maximumMeters - Supplies the upper endpoint.
	 * @param {number} count - Supplies the node count.
	 * @returns {readonly Distance[]} The ordered unit-bearing nodes.
	 */
	_uniformDistanceNodes(maximumMeters, count) {
		if (!Number.isInteger(count) || count < 2) {
			throw new RangeError(
				'Flat local cache axis node count must be an integer of at least two.',
			);
		}

		return Array.from(
			{ length: count },
			(_unused, index) =>
				DistanceMath.inMeters(maximumMeters * index / (count - 1)),
		);
	}

	/**
	 * Scale one selected dimensionless node-placement profile to its bound.
	 *
	 * @param {number} maximumMeters - Supplies the configured upper endpoint.
	 * @param {readonly (readonly [number, number])[]} fractions - Supplies
	 * ordered numerator/denominator fractions.
	 * @returns {readonly Distance[]} The ordered unit-bearing nodes.
	 */
	_scaledDistanceNodes(maximumMeters, fractions) {
		return fractions.map(([numerator, denominator]) =>
			DistanceMath.inMeters(
				maximumMeters * numerator / denominator,
			));
	}

	/**
	 * Normalize one optional explicit cache axis.
	 *
	 * @param {readonly Distance[] | undefined} values - Supplies explicit nodes.
	 * @param {number} maximumMeters - Supplies the allowed maximum.
	 * @param {readonly (readonly [number, number])[]} defaultFractions -
	 * Supplies selected placement.
	 * @param {string} label - Supplies the diagnostic label.
	 * @returns {readonly Distance[]} The normalized ordered nodes.
	 */
	_cacheAxisNodes(
		values,
		maximumMeters,
		defaultFractions,
		label,
	) {
		if (values === undefined) {
			return this._scaledDistanceNodes(
				maximumMeters,
				defaultFractions,
			);
		}
		if (!Array.isArray(values) || values.length < 2) {
			throw new RangeError(`${label} must contain at least two nodes.`);
		}

		let previousMeters = Number.NEGATIVE_INFINITY;
		return values.map((distance, index) => {
			DistanceMath.assertDistance(distance, `${label}[${index}]`);
			const meters = DistanceMath.toMeters(distance);
			if (
				meters < 0
				|| meters > maximumMeters
				|| meters <= previousMeters
			) {
				throw new RangeError(
					`${label} must be strictly increasing within the selected domain.`,
				);
			}
			previousMeters = meters;
			return DistanceMath.inMeters(meters);
		});
	}

	/**
	 * Resolve the radial, tangent, and vertical local cache frame.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - Supplies geometry.
	 * @param {readonly number[]} position - Supplies the physical sample point.
	 * @returns {FlatLocalCacheDirectionFrame} The right-handed local frame.
	 */
	_localCacheDirectionFrame(configuration, position) {
		const sourceSubpoint = configuration.sourceSubpoint.coordinates;
		const horizontal = [
			position[0] - sourceSubpoint[0],
			position[1] - sourceSubpoint[1],
			0,
		];
		const rhoMeters = Math.hypot(horizontal[0], horizontal[1]);
		const radial = rhoMeters <= FLAT_GEOMETRY_BOUNDARY_EPSILON
			? configuration.cacheRadialFallbackDirection
			: /** @type {UnitVector3} */ ([
				horizontal[0] / rhoMeters,
				horizontal[1] / rhoMeters,
				0,
			]);
		const tangent = /** @type {UnitVector3} */ ([
			-radial[1],
			radial[0],
			0,
		]);

		return {
			radial,
			tangent,
			vertical: [0, 0, 1],
		};
	}

	/**
	 * Express one physical direction in the local radial frame.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - Supplies geometry.
	 * @param {readonly number[]} position - Supplies the physical sample point.
	 * @param {UnitVector3} physicalDirection - Supplies the physical direction.
	 * @returns {UnitVector3} The local direction.
	 */
	_localCacheDirection(
		configuration,
		position,
		physicalDirection,
	) {
		const frame =
			this._localCacheDirectionFrame(configuration, position);

		return /** @type {UnitVector3} */ ([
			VectorMath.dot(physicalDirection, frame.radial),
			VectorMath.dot(physicalDirection, frame.tangent),
			VectorMath.dot(physicalDirection, frame.vertical),
		]);
	}

	/**
	 * Express one local radial-frame direction in physical model space.
	 *
	 * @param {FlatEarthGeometryConfiguration} configuration - Supplies geometry.
	 * @param {readonly number[]} position - Supplies the physical sample point.
	 * @param {UnitVector3} cacheDirection - Supplies the local cache direction.
	 * @returns {UnitVector3} The physical direction.
	 */
	_physicalCacheDirection(
		configuration,
		position,
		cacheDirection,
	) {
		const frame =
			this._localCacheDirectionFrame(configuration, position);
		const direction = VectorMath.add(
			VectorMath.add(
				VectorMath.scale(frame.radial, cacheDirection[0]),
				VectorMath.scale(frame.tangent, cacheDirection[1]),
			),
			VectorMath.scale(frame.vertical, cacheDirection[2]),
		);
		const normalized = VectorMath.normalize(direction);

		return /** @type {UnitVector3} */ ([
			normalized[0],
			normalized[1],
			normalized[2],
		]);
	}

	/**
	 * Resolve one scalar against an ordered physical node axis.
	 *
	 * @param {number} valueMeters - Supplies the physical coordinate.
	 * @param {readonly Distance[]} nodes - Supplies ordered nodes.
	 * @returns {FlatCacheAxisStencil} The clamped one- or two-node stencil.
	 */
	_cacheAxisStencil(valueMeters, nodes) {
		const lastIndex = nodes.length - 1;
		if (valueMeters <= nodes[0].value) {
			return {
				lowerIndex: 0,
				upperIndex: 0,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}
		if (valueMeters >= nodes[lastIndex].value) {
			return {
				lowerIndex: lastIndex,
				upperIndex: lastIndex,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}

		let lowerIndex = 0;
		let upperIndex = lastIndex;
		while (upperIndex - lowerIndex > 1) {
			const middleIndex = Math.floor((lowerIndex + upperIndex) / 2);
			if (nodes[middleIndex].value <= valueMeters) {
				lowerIndex = middleIndex;
			} else {
				upperIndex = middleIndex;
			}
		}

		if (valueMeters === nodes[lowerIndex].value) {
			return {
				lowerIndex,
				upperIndex: lowerIndex,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}
		if (valueMeters === nodes[upperIndex].value) {
			return {
				lowerIndex: upperIndex,
				upperIndex,
				lowerWeight: 1,
				upperWeight: 0,
			};
		}

		const upperWeight = (valueMeters - nodes[lowerIndex].value)
			/ (nodes[upperIndex].value - nodes[lowerIndex].value);

		return {
			lowerIndex,
			upperIndex,
			lowerWeight: 1 - upperWeight,
			upperWeight,
		};
	}

	/**
	 * Return one flattened z-major, rho-minor position index.
	 *
	 * @param {number} zIndex - Supplies the altitude index.
	 * @param {number} rhoIndex - Supplies the radial index.
	 * @param {number} rhoCount - Supplies the radial extent.
	 * @returns {number} The flattened index.
	 */
	_flattenPositionIndex(zIndex, rhoIndex, rhoCount) {
		return zIndex * rhoCount + rhoIndex;
	}

	/**
	 * Read selected local executable position axes.
	 *
	 * @param {FlatLocalCachePositionDomainAxes | undefined} candidate - Supplies optional axes.
	 * @param {FlatLocalCachePositionDomain} fallback - Supplies the default.
	 * @returns {FlatLocalCachePositionDomainAxes} The executable axes.
	 */
	_cachePositionDomainAxes(candidate, fallback) {
		const axes = candidate ?? fallback;

		return {
			zNodes: axes.zNodes,
			rhoNodes: axes.rhoNodes,
			zCount: axes.zCount,
			rhoCount: axes.rhoCount,
		};
	}

	/**
	 * Resolve the positive exit from the selected cache radial cylinder.
	 *
	 * @param {readonly number[]} origin - Supplies physical origin.
	 * @param {UnitVector3} direction - Supplies physical direction.
	 * @param {number} maximumRhoMeters - Supplies the radial domain edge.
	 * @param {readonly number[]} sourceSubpoint - Supplies the cylinder center.
	 * @returns {number | null} The exit distance or null for a vertical ray.
	 */
	_cacheRadialBoundaryDistance(
		origin,
		direction,
		maximumRhoMeters,
		sourceSubpoint,
	) {
		const offsetX = origin[0] - sourceSubpoint[0];
		const offsetY = origin[1] - sourceSubpoint[1];
		const horizontalDirectionSquared =
			direction[0] ** 2 + direction[1] ** 2;
		if (
			horizontalDirectionSquared
				<= FLAT_GEOMETRY_BOUNDARY_EPSILON ** 2
		) {
			return null;
		}

		const halfB = offsetX * direction[0] + offsetY * direction[1];
		const c = offsetX ** 2 + offsetY ** 2
			- maximumRhoMeters ** 2;
		const discriminant = halfB ** 2
			- horizontalDirectionSquared * c;
		if (discriminant < -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const farDistance = (
			-halfB + Math.sqrt(Math.max(0, discriminant))
		) / horizontalDirectionSquared;
		return farDistance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON
			? Math.max(0, farDistance)
			: null;
	}

	/**
	 * Resolve one reusable construction ray's nearest selected boundary.
	 *
	 * @param {readonly number[]} origin - Supplies physical origin.
	 * @param {UnitVector3} direction - Supplies physical direction.
	 * @returns {FlatReusableBoundary} The selected finite boundary.
	 */
	_resolveReusableBoundary(origin, direction) {
		const originPosition = positionInMeters(origin);
		const candidates = [
			{
				kind: 'ground',
				distance: this.distanceToGroundBoundary(
					originPosition,
					direction,
				),
			},
			{
				kind: 'top-atmosphere',
				distance: this.distanceToTopAtmosphereBoundary(
					originPosition,
					direction,
				),
			},
			{
				kind: 'cache-radial-boundary',
				distance:
					this._cacheRadialBoundaryDistance(
						origin,
						direction,
						this._configuration.cacheRadialMaximum.value,
						this._configuration.sourceSubpoint.coordinates,
					),
			},
		].filter((candidate) => candidate.distance !== null);

		if (candidates.length === 0) {
			throw new RangeError(
				'Flat reusable cache ray did not resolve a finite boundary.',
			);
		}

		return /** @type {FlatReusableBoundary} */ (
			candidates.reduce((nearest, candidate) =>
				candidate.distance < nearest.distance
					? candidate
					: nearest)
		);
	}

	/**
	 * Create flat Earth geometry.
	 *
	 * @param {FlatEarthGeometryConfig} configuration - Supplies observer,
	 * source, atmosphere domain, and integration policy.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object') {
			throw new TypeError('FlatEarthGeometry configuration is required.');
		}

		const {
			observerPosition = { coordinates: [0, 0, 2], units: 'meters' },
			sourcePosition,
			topAltitude,
			cacheRadialMaximum,
			sceneSkyRayLimit = null,
			observerCenteredDome = null,
			runtimeDiagnosticLimit = 50,
			cacheAltitudeNodes,
			cacheRadialNodes,
		} = configuration;

		DistanceMath.assertPosition(observerPosition, 'observerPosition');
		DistanceMath.assertPosition(sourcePosition, 'sourcePosition');
		DistanceMath.assertDistance(topAltitude, 'topAltitude');
		DistanceMath.assertDistance(
			cacheRadialMaximum,
			'cacheRadialMaximum',
		);
		if (sceneSkyRayLimit !== null) {
			DistanceMath.assertDistance(sceneSkyRayLimit, 'sceneSkyRayLimit');
		}
		const observerPositionMeters = DistanceMath.toMetersPosition(observerPosition);
		const sourcePositionMeters = DistanceMath.toMetersPosition(sourcePosition);
		const topAltitudeMeters = DistanceMath.toMeters(topAltitude);
		const cacheRadialMaximumMeters =
			DistanceMath.toMeters(cacheRadialMaximum);
		const sceneSkyRayLimitMeters = sceneSkyRayLimit === null
			? null
			: DistanceMath.toMeters(sceneSkyRayLimit);

		if (!Number.isFinite(topAltitudeMeters) || topAltitudeMeters <= 0) {
			throw new RangeError('FlatEarthGeometry requires a positive topAltitude.');
		}
		if (
			!Number.isFinite(cacheRadialMaximumMeters)
			|| cacheRadialMaximumMeters <= 0
		) {
			throw new RangeError(
				'FlatEarthGeometry requires a positive cacheRadialMaximum.',
			);
		}

		if (sceneSkyRayLimitMeters !== null && (!Number.isFinite(sceneSkyRayLimitMeters) || sceneSkyRayLimitMeters < 0)) {
			throw new RangeError('FlatEarthGeometry sceneSkyRayLimit must be null or non-negative.');
		}

		const sourceSubpointMeters = [
			sourcePositionMeters[0],
			sourcePositionMeters[1],
			0,
		];
		const normalizedCacheAltitudeNodes =
			this._cacheAxisNodes(
				cacheAltitudeNodes,
				topAltitudeMeters,
				FLAT_LOCAL_CACHE_DEFAULT_Z_NODE_FRACTIONS,
				'cacheAltitudeNodes',
			);
		const normalizedCacheRadialNodes =
			this._cacheAxisNodes(
				cacheRadialNodes,
				cacheRadialMaximumMeters,
				FLAT_LOCAL_CACHE_DEFAULT_RHO_NODE_FRACTIONS,
				'cacheRadialNodes',
			);
		if (
			normalizedCacheAltitudeNodes[0].value !== 0
			|| normalizedCacheAltitudeNodes[
				normalizedCacheAltitudeNodes.length - 1
			].value !== topAltitudeMeters
		) {
			throw new RangeError(
				'cacheAltitudeNodes must include ground zero and topAltitude endpoints.',
			);
		}
		if (
			normalizedCacheRadialNodes[0].value !== 0
			|| normalizedCacheRadialNodes[
				normalizedCacheRadialNodes.length - 1
			].value !== cacheRadialMaximumMeters
		) {
			throw new RangeError(
				'cacheRadialNodes must include rho zero and cacheRadialMaximum endpoints.',
			);
		}

		this._configuration = {
			observerPosition: positionInMeters(observerPositionMeters),
			sourcePosition: positionInMeters(sourcePositionMeters),
			sourceSubpoint: positionInMeters(sourceSubpointMeters),
			topAltitude: DistanceMath.inMeters(topAltitudeMeters),
			sceneSkyRayLimit: sceneSkyRayLimitMeters === null ? null : DistanceMath.inMeters(sceneSkyRayLimitMeters),
			observerCenteredDome:
				this._buildObserverCenteredDomeDescriptor(
					observerPositionMeters,
					observerCenteredDome,
				),
			runtimeDiagnosticLimit,
			observerLocalSceneFrame: FLAT_OBSERVER_LOCAL_SCENE_FRAME,
			cacheAltitudeNodes: normalizedCacheAltitudeNodes,
			cacheRadialNodes: normalizedCacheRadialNodes,
			cacheAltitudeNodesExplicit: cacheAltitudeNodes !== undefined,
			cacheRadialNodesExplicit: cacheRadialNodes !== undefined,
			cacheRadialMaximum:
				DistanceMath.inMeters(cacheRadialMaximumMeters),
			cacheRadialFallbackDirection:
				/** @type {UnitVector3} */ (
					[...FLAT_LOCAL_CACHE_RHO_ZERO_RADIAL_DIRECTION]
				),
		};
		this._cachePositionDomain = this.createLocalSunCachePositionDomain();
		this._runtimeDiagnostics = [];
	}

	/**
	 * Return immutable geometry configuration.
	 *
	 * @returns {FlatEarthGeometryConfiguration} The normalized configuration.
	 */
	get configuration() {
		return this._configuration;
	}

	/**
	 * Return bounded runtime diagnostics recorded by tolerant paths.
	 *
	 * @returns {readonly unknown[]} Runtime diagnostics.
	 */
	get runtimeDiagnostics() {
		return [...this._runtimeDiagnostics];
	}

	/**
	 * Identify this configured geometry model instance for compatibility.
	 *
	 * @returns {string} The geometry id.
	 */
	get id() {
		return 'flat-earth-geometry';
	}

	/**
	 * Provide the camera-independent upper-sky quadrature in this geometry's
	 * observer-local frame. The shader contribution owns the frame transform.
	 *
	 * @returns {ReturnType<typeof createSkyIlluminanceProbePlan>} The probe plan.
	 */
	createSkyIlluminanceProbePlan() {
		return createSkyIlluminanceProbePlan();
	}

	/**
	 * Construct the source-relative finite-body celestial assembly.
	 *
	 * This is deliberately separate from the spherical `(h,u)` family. The
	 * cache remains static when the local body's horizontal transform changes.
	 */
	createPrimaryCelestialCache({ atmosphere, sources }) {
		return new FlatFiniteSunPrimaryCache({ geometry: this, atmosphere, sources });
	}

	/** Create the geometry-owned GPU controller for the local finite-Sun cache. */
	createPrimaryCelestialGpuCacheController({ backend, scheduler = undefined }) {
		return new FlatFiniteSunGpuCacheController({ backend, scheduler });
	}

	/** The spherical/radial celestial family deliberately has no flat route. */
	describeCelestialContributionDomain() {
		throw new RangeError('FlatEarthGeometry does not support spherical-sun-stars-radial-v1.');
	}

	resolveCelestialSourcePlacement() {
		throw new RangeError('FlatEarthGeometry does not support spherical-sun-stars-radial-v1.');
	}

	resolveCelestialBuildSample() {
		throw new RangeError('FlatEarthGeometry does not support spherical-sun-stars-radial-v1.');
	}

	resolveCelestialReceiverStencil() {
		throw new RangeError('FlatEarthGeometry does not support spherical-sun-stars-radial-v1.');
	}

	resolveCelestialDirectionStencil() {
		throw new RangeError('FlatEarthGeometry does not support spherical-sun-stars-radial-v1.');
	}

	prepareCelestialContributionQuery() {
		throw new RangeError('FlatEarthGeometry does not support spherical-sun-stars-radial-v1.');
	}

	/**
	 * Create the selected flattened z-major, rho-minor local position domain.
	 *
	 * @param {FlatLocalCachePositionDomainRequest} [request] - Supplies optional
	 * generated-axis count overrides.
	 * @returns {FlatLocalCachePositionDomain} The executable domain packet.
	 */
	createLocalSunCachePositionDomain(request = {}) {
		const configured = this._configuration;
		const sourcePositionMeters =
			DistanceMath.toMetersPosition(configured.sourcePosition);
		const sourceSubpointMeters = [
			sourcePositionMeters[0],
			sourcePositionMeters[1],
			0,
		];
		const zCount = request.zCount
			?? configured.cacheAltitudeNodes.length;
		const rhoCount = request.rhoCount
			?? configured.cacheRadialNodes.length;
		if (configured.cacheAltitudeNodesExplicit
			&& request.zCount !== undefined
			&& request.zCount !== configured.cacheAltitudeNodes.length) {
			throw new RangeError(
				'zCount must match explicitly configured cacheAltitudeNodes.',
			);
		}
		if (configured.cacheRadialNodesExplicit
			&& request.rhoCount !== undefined
			&& request.rhoCount !== configured.cacheRadialNodes.length) {
			throw new RangeError(
				'rhoCount must match explicitly configured cacheRadialNodes.',
			);
		}
		const zNodes = (
			configured.cacheAltitudeNodesExplicit
			|| request.zCount === undefined
		)
			? configured.cacheAltitudeNodes
			: this._uniformDistanceNodes(
				configured.topAltitude.value,
				zCount,
			);
		const rhoNodes = (
			configured.cacheRadialNodesExplicit
			|| request.rhoCount === undefined
		)
			? configured.cacheRadialNodes
			: this._uniformDistanceNodes(
				configured.cacheRadialMaximum.value,
				rhoCount,
			);
		const fallbackRadial =
			configured.cacheRadialFallbackDirection;
		const definitions = [];

		for (let zIndex = 0; zIndex < zNodes.length; zIndex += 1) {
			for (
				let rhoIndex = 0;
				rhoIndex < rhoNodes.length;
				rhoIndex += 1
			) {
				const z = zNodes[zIndex];
				const rho = rhoNodes[rhoIndex];
				const position = positionInMeters([
					sourceSubpointMeters[0] + fallbackRadial[0] * rho.value,
					sourceSubpointMeters[1] + fallbackRadial[1] * rho.value,
					z.value,
				]);
				const index = this._flattenPositionIndex(
					zIndex,
					rhoIndex,
					rhoNodes.length,
				);

				definitions.push({
					index,
					coordinate: z,
					role: zIndex === 0
						? 'ground-boundary-node'
						: zIndex === zNodes.length - 1
							? 'top-boundary-node'
							: 'interior-node',
					metadata: {
						position,
						z,
						rho,
						zIndex,
						rhoIndex,
					},
				});
			}
		}

		const descriptor = new PositionDomainDescriptor({
			id: `algorithm32-flat-local-z${zNodes.length}-rho${rhoNodes.length}-position-v3`,
			schemaRevision: 'algorithm32-position-domain-v1',
			generatorRevision:
				'flat-local-z-rho-selected-scaled-profile-or-uniform-override-or-explicit-v3',
			mapping: {
				kind: 'source-subpoint-z-rho',
				flatteningOrder: 'z-major-rho-minor',
				zCount: zNodes.length,
				rhoCount: rhoNodes.length,
			},
			frame: {
				kind: 'source-subpoint-radial-representative-v1',
				sourceSubpoint: positionInMeters(sourceSubpointMeters),
				radialDirection: fallbackRadial,
				verticalDirection: [0, 0, 1],
			},
			interpolation: {
				kind: 'clamped-bilinear-z-rho',
				constructionLookup: 'clamped-bilinear-z-rho',
			},
			precision: 'binary64-generated',
			count: definitions.length,
			nodes: definitions,
		});

		return {
			descriptor,
			nodes: definitions,
			zNodes,
			rhoNodes,
			zCount: zNodes.length,
			rhoCount: rhoNodes.length,
			count: definitions.length,
		};
	}

	/**
	 * Return a serializable geometry descriptor.
	 *
	 * @returns {object} The geometry descriptor.
	 */
	describe() {
		return {
			kind: 'flat-earth-geometry',
			observerPosition: this._configuration.observerPosition,
			sourcePosition: this._configuration.sourcePosition,
			sourceSubpoint: this._configuration.sourceSubpoint,
			topAltitude: this._configuration.topAltitude,
			sceneSkyRayLimit: this._configuration.sceneSkyRayLimit,
			hasObserverCenteredDome: this._configuration.observerCenteredDome != null,
			observerCenteredDome: this._configuration.observerCenteredDome,
			observerLocalSceneFrame: this._configuration.observerLocalSceneFrame,
			cacheAltitudeNodes: this._configuration.cacheAltitudeNodes,
			cacheRadialNodes: this._configuration.cacheRadialNodes,
			cacheRadialMaximum: this._configuration.cacheRadialMaximum,
			cacheRadialFallbackDirection:
				this._configuration.cacheRadialFallbackDirection,
			reusableBoundaryPolicy:
				'nearest-ground-top-or-cache-radial-boundary',
			observerDomePolicy: 'final-view-only',
		};
	}

	/**
	 * Pack three-component local directions for scalar R32F construction data.
	 *
	 * @param {string} id - Supplies the packed-data identity.
	 * @param {string} quantity - Supplies the physical interpretation.
	 * @param {readonly UnitVector3[]} directions - Supplies ordered directions.
	 * @returns {CacheData} The packed direction rows.
	 */
	_createDirectionCacheData(id, quantity, directions) {
		return createCacheData({
			id,
			quantity,
			units: '1',
			shape: [3, directions.length],
			values: directions.flatMap((direction) => direction),
		});
	}

	/**
	 * Build one local position-major transport query.
	 *
	 * @param {FlatTransportQueryRequest} request - Supplies the physical query.
	 * @returns {readonly FlatTransportTap[]} The aggregated active taps.
	 */
	_createTransportQueryTaps(request) {
		const metadata =
			/** @type {FlatLocalCachePositionNodeMetadata} */ (
				request.positionNode.metadata
			);
		const origin = positionToMeters(
			metadata.position,
			'Flat transport position node',
		);
		const physicalDirection =
			this._physicalCacheDirection(
				this._configuration,
				origin,
				request.cacheDirection,
			);
		const boundary = this._resolveReusableBoundary(
			origin,
			physicalDirection,
		);
		const intervalLengthMeters =
			boundary.distance / request.intervalCount;
		const channelCount = request.domains.spectralChannelCount;
		const viewTransmittance =
			new Float64Array(channelCount).fill(1);
		/** @type {readonly number[] | null} */
		let previousExtinction = null;
		const aggregate = new Map();

		for (
			let pointIndex = 0;
			pointIndex <= request.intervalCount;
			pointIndex += 1
		) {
			const distanceAlongRayMeters =
				intervalLengthMeters * pointIndex;
			const samplePosition = VectorMath.addScaled(
				origin,
				physicalDirection,
				distanceAlongRayMeters,
			);
			if (
				boundary.kind === 'ground'
				&& pointIndex === request.intervalCount
			) {
				samplePosition[2] = 0;
			}
			const position = positionInMeters(samplePosition);
			const atmosphereCoordinate =
				this.resolveAtmosphereCoordinate(position);
			const medium = request.atmosphere.sampleMedium(
				atmosphereCoordinate,
			);
			const extinction = medium.extinction.values;

			if (previousExtinction !== null) {
				for (
					let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1
				) {
					viewTransmittance[wavelengthIndex] *= Math.exp(
						-0.5
						* (
							previousExtinction[wavelengthIndex]
							+ extinction[wavelengthIndex]
						)
						* intervalLengthMeters,
					);
				}
			}

			const positionStencil =
				this.resolveScatteringCacheConstructionPositionStencil({
					position,
					atmosphereCoordinate,
					positionAxes: request.domains,
				});
			const directionStencil =
				request.domains.resolveOutgoingDirectionStencil(
					this._localCacheDirection(
						this._configuration,
						samplePosition,
						physicalDirection,
					),
				);
			const measureMeters = intervalLengthMeters
				* (
					pointIndex === 0
					|| pointIndex === request.intervalCount
						? 0.5
						: 1
				);

			for (
				let positionOffset = 0;
				positionOffset < positionStencil.indices.length;
				positionOffset += 1
			) {
				for (
					let directionOffset = 0;
					directionOffset < directionStencil.indices.length;
					directionOffset += 1
				) {
					const sourcePositionIndex =
						positionStencil.indices[positionOffset];
					const sourceDirectionIndex =
						directionStencil.indices[directionOffset];
					const interpolationWeight =
						positionStencil.weights[positionOffset]
						* directionStencil.weights[directionOffset];
					const key =
						`${sourcePositionIndex}:${sourceDirectionIndex}`;
					let tap = aggregate.get(key);
					if (tap === undefined) {
						tap = {
							sourceDirectionIndex,
							sourcePositionIndex,
							coefficients:
								new Float64Array(channelCount),
						};
						aggregate.set(key, tap);
					}

					for (
						let wavelengthIndex = 0;
						wavelengthIndex < channelCount;
						wavelengthIndex += 1
					) {
						tap.coefficients[wavelengthIndex] +=
							viewTransmittance[wavelengthIndex]
							* measureMeters
							* interpolationWeight;
					}
				}
			}

			previousExtinction = extinction;
		}

		return [...aggregate.values()];
	}

	/**
	 * Build packed local Jk-to-Lk transport data.
	 *
	 * The radial source frame is recomputed at every path sample. Position and
	 * direction interpolation therefore contribute arbitrary combined taps
	 * rather than the spherical cache's one-position specialization.
	 *
	 * @param {FlatCacheTransportDataRequest} request - Supplies physical collaborators.
	 * @returns {CacheTransportData} Reusable packed transport data.
	 */
	createTransportData(request) {
		if (
			!Number.isInteger(request.intervalCount)
			|| request.intervalCount < 1
		) {
			throw new RangeError(
				'Flat transport intervalCount must be a positive integer.',
			);
		}

		const domains = request.domains;
		const tapsByQuery = [];
		for (const positionNode of domains.positionNodes) {
			for (const cacheDirection of domains.incomingUnitVectors) {
				tapsByQuery.push(this._createTransportQueryTaps({
					atmosphere: request.atmosphere,
					domains,
					positionNode,
					cacheDirection,
					intervalCount: request.intervalCount,
				}));
			}
		}

		const queryCount = tapsByQuery.length;
		const tapCount = Math.max(
			1,
			...tapsByQuery.map((taps) => taps.length),
		);
		const channelCount = domains.spectralChannelCount;
		const sourceValues =
			new Float32Array(queryCount * tapCount * 3);
		const coefficientValues = new Float32Array(
			queryCount * tapCount * channelCount,
		);

		for (
			let queryIndex = 0;
			queryIndex < queryCount;
			queryIndex += 1
		) {
			const taps = tapsByQuery[queryIndex];
			for (
				let tapIndex = 0;
				tapIndex < taps.length;
				tapIndex += 1
			) {
				const tap = taps[tapIndex];
				const sourceOffset =
					(queryIndex * tapCount + tapIndex) * 3;
				sourceValues[sourceOffset] = tap.sourceDirectionIndex;
				sourceValues[sourceOffset + 1] = tap.sourcePositionIndex;
				sourceValues[sourceOffset + 2] = 1;

				for (
					let wavelengthIndex = 0;
					wavelengthIndex < channelCount;
					wavelengthIndex += 1
				) {
					const coefficientOffset =
						(wavelengthIndex * queryCount + queryIndex)
							* tapCount
						+ tapIndex;
					coefficientValues[coefficientOffset] =
						tap.coefficients[wavelengthIndex];
				}
			}
		}

		return {
			queryCount,
			tapCount,
			sources: createCacheData({
				id: `${domains.id}-flat-local-transport-sources-v2`,
				quantity: 'transport-source-address-and-active-flag',
				units: '1',
				shape: [tapCount * 3, queryCount],
				values: sourceValues,
			}),
			coefficients: createCacheData({
				id: `${domains.id}-flat-local-transport-coefficients-v2`,
				quantity: 'transport-path-coefficient',
				units: 'meters',
				shape: [tapCount, queryCount, channelCount],
				values: coefficientValues,
			}),
		};
	}

	/**
	 * Describe flat construction coordinates and symbols for one cache pass.
	 *
	 * @param {CacheBuildContext} context - Supplies the logical pass.
	 * @returns {CacheBuildModule} The geometry-owned construction module.
	 */
	createCacheModule(context) {
		const domains =
			/** @type {LocalSunConstructionDomainSelection} */ (
				context.domains
			);
		const reflectiveScatter = context.kind === 'scatter'
			&& context.groundReflection !== undefined;
		const provides = reflectiveScatter
			? [
				...FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS[context.kind],
				'geometry.sourcePath',
				FLAT_GEOMETRY_GROUND_REFLECTION_SYMBOL,
			]
			: FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS[context.kind];
		/** @type {CacheBinding[]} */
		const bindings = [];
		/** @type {CacheShaderBlock[]} */
		const blocks = [];
		const usesPhysicalDomain = context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| context.kind === 'scatter';

		if (usesPhysicalDomain) {
			const coordinateValues = domains.positionNodes.flatMap((node) => {
				const metadata =
					/** @type {FlatLocalCachePositionNodeMetadata} */ (
						node.metadata
					);
				return [
					DistanceMath.toMeters(metadata.z),
					DistanceMath.toMeters(metadata.rho),
				];
			});
			const positionData = createCacheData({
				id: `${domains.id}-flat-local-position-coordinates-v1`,
				quantity: 'flat-local-z-rho-position',
				units: 'meters',
				shape: [2, domains.positionNodes.length],
				values: coordinateValues,
			});
			bindings.push({
				spec: {
					id: 'flat-geometry-position-nodes',
					name: 'uCachePositionNodes',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: positionData,
			});
			bindings.push(
				{
					spec: {
						id: 'flat-geometry-top-altitude',
						name: 'uCacheGeometryTopAltitude',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: this._configuration.topAltitude,
				},
				{
					spec: {
						id: 'flat-geometry-source-subpoint',
						name: 'uCacheGeometrySourceSubpoint',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value: this._configuration.sourceSubpoint,
				},
				{
					spec: {
						id: 'flat-geometry-source-position',
						name: 'uCacheGeometrySourcePosition',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value: this._configuration.sourcePosition,
				},
				{
					spec: {
						id: 'flat-geometry-radial-fallback',
						name: 'uCacheGeometryRadialFallback',
						kind: 'uniform',
						shaderType: 'vec3',
						frequency: 'build',
					},
					value:
						this._configuration.cacheRadialFallbackDirection,
				},
				{
					spec: {
						id: 'flat-geometry-radial-maximum',
						name: 'uCacheGeometryRadialMaximum',
						kind: 'uniform',
						shaderType: 'float',
						frequency: 'build',
					},
					value: this._configuration.cacheRadialMaximum,
				},
				{
					spec: {
						id: 'flat-geometry-rho-count',
						name: 'CACHE_RHO_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: domains.rhoCount,
				},
			);
			blocks.push({
				id: 'flat-geometry-cache-position-and-path',
				phase: 'function',
				order: 0,
				source: `float cacheAltitude(vec3 positionMeters) {
	return positionMeters.z;
}

float cacheRho(vec3 positionMeters) {
	return length(positionMeters.xy - uCacheGeometrySourceSubpoint.xy);
}

vec3 cachePosition(int positionIndex) {
	float zMeters = texelFetch(
		uCachePositionNodes,
		ivec2(0, positionIndex),
		0
	).r;
	float rhoMeters = texelFetch(
		uCachePositionNodes,
		ivec2(1, positionIndex),
		0
	).r;
	return vec3(
		uCacheGeometrySourceSubpoint.xy
			+ uCacheGeometryRadialFallback.xy * rhoMeters,
		zMeters
	);
}

float cacheGroundBoundaryDistance(vec3 positionMeters, vec3 direction) {
	if (direction.z >= -1.0e-9) return -1.0;
	float distanceMeters = -positionMeters.z / direction.z;
	return distanceMeters >= -1.0e-9 ? max(0.0, distanceMeters) : -1.0;
}

bool cacheRayBlockedByGround(vec3 positionMeters, vec3 direction) {
	return cacheGroundBoundaryDistance(positionMeters, direction) > 0.0;
}

float cacheTopBoundaryDistance(vec3 positionMeters, vec3 direction) {
	if (direction.z <= 1.0e-9) return -1.0;
	float distanceMeters =
		(uCacheGeometryTopAltitude - positionMeters.z) / direction.z;
	return distanceMeters >= -1.0e-9 ? max(0.0, distanceMeters) : -1.0;
}

float cacheSourcePathDistance(vec3 positionMeters, vec3 direction) {
	float sourceDistanceMeters =
		length(uCacheGeometrySourcePosition - positionMeters);
	float topDistanceMeters =
		cacheTopBoundaryDistance(positionMeters, direction);
	return topDistanceMeters >= 0.0
		? min(sourceDistanceMeters, topDistanceMeters)
		: sourceDistanceMeters;
}

float cacheRadialBoundaryDistance(vec3 positionMeters, vec3 direction) {
	vec2 offset = positionMeters.xy - uCacheGeometrySourceSubpoint.xy;
	float a = dot(direction.xy, direction.xy);
	if (a <= 1.0e-18) return -1.0;
	float halfB = dot(offset, direction.xy);
	float c = dot(offset, offset)
		- uCacheGeometryRadialMaximum * uCacheGeometryRadialMaximum;
	float discriminant = halfB * halfB - a * c;
	if (discriminant < -1.0e-9) return -1.0;
	float distanceMeters =
		(-halfB + sqrt(max(0.0, discriminant))) / a;
	return distanceMeters >= -1.0e-9 ? max(0.0, distanceMeters) : -1.0;
}

void cacheSelectNearestBoundary(
	float candidateMeters,
	inout float selectedMeters
) {
	if (candidateMeters >= 0.0
		&& (selectedMeters < 0.0 || candidateMeters < selectedMeters)) {
		selectedMeters = candidateMeters;
	}
}

float cacheReusableBoundaryDistance(
	vec3 positionMeters,
	vec3 direction
) {
	float selectedMeters = -1.0;
	cacheSelectNearestBoundary(
		cacheGroundBoundaryDistance(positionMeters, direction),
		selectedMeters
	);
	cacheSelectNearestBoundary(
		cacheTopBoundaryDistance(positionMeters, direction),
		selectedMeters
	);
	cacheSelectNearestBoundary(
		cacheRadialBoundaryDistance(positionMeters, direction),
		selectedMeters
	);
	return max(0.0, selectedMeters);
}`.trim(),
			});
		}

		if (reflectiveScatter) {
			blocks.push({
				id: 'flat-geometry-cache-ground-reflection',
				phase: 'function',
				order: 5,
				source: `void cacheGroundConstructionPositionStencil(
	vec3 groundPositionMeters,
	out ivec4 positionIndices,
	out vec4 positionWeights
) {
	float rhoMeters = cacheRho(groundPositionMeters);
	int lastRhoIndex = CACHE_RHO_COUNT - 1;
	int lowerRhoIndex = 0;
	int upperRhoIndex = 0;
	float lowerWeight = 1.0;
	float upperWeight = 0.0;
	float firstRhoMeters = texelFetch(
		uCachePositionNodes,
		ivec2(1, 0),
		0
	).r;

	if (lastRhoIndex > 0 && rhoMeters > firstRhoMeters) {
		float lastRhoMeters = texelFetch(
			uCachePositionNodes,
			ivec2(1, lastRhoIndex),
			0
		).r;
		if (rhoMeters >= lastRhoMeters) {
			lowerRhoIndex = lastRhoIndex;
			upperRhoIndex = lastRhoIndex;
		} else {
			for (int candidateIndex = 1;
				candidateIndex < CACHE_RHO_COUNT;
				++candidateIndex) {
				float candidateRhoMeters = texelFetch(
					uCachePositionNodes,
					ivec2(1, candidateIndex),
					0
				).r;
				if (rhoMeters <= candidateRhoMeters) {
					if (rhoMeters == candidateRhoMeters) {
						lowerRhoIndex = candidateIndex;
						upperRhoIndex = candidateIndex;
					} else {
						lowerRhoIndex = candidateIndex - 1;
						upperRhoIndex = candidateIndex;
						float lowerRhoMeters = texelFetch(
							uCachePositionNodes,
							ivec2(1, lowerRhoIndex),
							0
						).r;
						upperWeight =
							(rhoMeters - lowerRhoMeters)
							/ (candidateRhoMeters - lowerRhoMeters);
						lowerWeight = 1.0 - upperWeight;
					}
					break;
				}
			}
		}
	}

	positionIndices = ivec4(
		lowerRhoIndex,
		upperRhoIndex,
		0,
		0
	);
	positionWeights = vec4(
		lowerWeight,
		upperWeight,
		0.0,
		0.0
	);
}

bool cacheGroundBoundaryHit(
	vec3 positionMeters,
	vec3 direction,
	out vec3 groundPositionMeters,
	out vec3 groundNormal,
	out float groundDistanceMeters,
	out ivec4 groundConstructionPositionIndices,
	out vec4 groundConstructionPositionWeights
) {
	groundDistanceMeters =
		cacheGroundBoundaryDistance(positionMeters, direction);
	if (groundDistanceMeters < 0.0) return false;
	groundPositionMeters =
		positionMeters + direction * groundDistanceMeters;
	groundPositionMeters.z = 0.0;
	groundNormal = vec3(0.0, 0.0, 1.0);
	cacheGroundConstructionPositionStencil(
		groundPositionMeters,
		groundConstructionPositionIndices,
		groundConstructionPositionWeights
	);
	return true;
}`.trim(),
			});
		}

		if (
			context.kind === 'primary-j1'
			|| context.kind === 'direct-l1'
			|| context.kind === 'scatter'
		) {
			blocks.push({
				id: 'flat-geometry-source-frames',
				phase: 'function',
				order: 10,
				source: `vec3 cacheRadialDirection(vec3 directionToSource) {
	vec3 radial = vec3(-directionToSource.xy, 0.0);
	if (length(radial) <= 1.0e-10) {
		return normalize(uCacheGeometryRadialFallback);
	}
	return normalize(radial);
}

vec3 cachePhysicalDirection(
	vec3 localDirection,
	vec3 directionToSource
) {
	vec3 radial = cacheRadialDirection(directionToSource);
	vec3 tangent = vec3(-radial.y, radial.x, 0.0);
	return normalize(
		radial * localDirection.x
		+ tangent * localDirection.y
		+ vec3(0.0, 0.0, 1.0) * localDirection.z
	);
}`.trim(),
			});
		}

		if (context.kind === 'primary-j1' || context.kind === 'scatter') {
			const outgoingData =
				this._createDirectionCacheData(
					`${domains.id}-flat-local-outgoing-directions-v1`,
					'source-local-outgoing-direction',
					domains.outgoingUnitVectors,
				);
			bindings.push({
				spec: {
					id: 'flat-geometry-outgoing-directions',
					name: 'uCacheOutgoingDirections',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: outgoingData,
			});
			blocks.push({
				id: 'flat-geometry-outgoing-directions',
				phase: 'function',
				order: 20,
				source: `vec3 cacheOutgoingDirection(
	int directionIndex,
	vec3 directionToSource
) {
	vec3 localDirection = vec3(
		texelFetch(uCacheOutgoingDirections, ivec2(0, directionIndex), 0).r,
		texelFetch(uCacheOutgoingDirections, ivec2(1, directionIndex), 0).r,
		texelFetch(uCacheOutgoingDirections, ivec2(2, directionIndex), 0).r
	);
	return cachePhysicalDirection(localDirection, directionToSource);
}`.trim(),
			});
		}

		if (context.kind === 'direct-l1' || context.kind === 'scatter') {
			const incomingData =
				this._createDirectionCacheData(
					`${domains.id}-flat-local-incoming-directions-v1`,
					'source-local-incoming-direction',
					domains.incomingUnitVectors,
				);
			bindings.push({
				spec: {
					id: 'flat-geometry-incoming-directions',
					name: 'uCacheIncomingDirections',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: incomingData,
			});
			blocks.push({
				id: 'flat-geometry-incoming-directions',
				phase: 'function',
				order: 30,
				source: `vec3 cacheIncomingDirection(
	int directionIndex,
	vec3 directionToSource
) {
	vec3 localDirection = vec3(
		texelFetch(uCacheIncomingDirections, ivec2(0, directionIndex), 0).r,
		texelFetch(uCacheIncomingDirections, ivec2(1, directionIndex), 0).r,
		texelFetch(uCacheIncomingDirections, ivec2(2, directionIndex), 0).r
	);
	return cachePhysicalDirection(localDirection, directionToSource);
}`.trim(),
			});
		}

		if (context.kind === 'scatter') {
			const weightData = createCacheData({
				id: `${domains.id}-flat-local-incoming-weights-v1`,
				quantity: 'solid-angle-weight',
				units: domains.incomingIntegrationWeights.units,
				shape: [
					domains.incomingIntegrationWeights.values.length,
				],
				values: domains.incomingIntegrationWeights.values,
			});
			bindings.push({
				spec: {
					id: 'flat-geometry-incoming-weights',
					name: 'uCacheIncomingWeights',
					kind: 'data',
					shaderType: 'sampler2D',
					frequency: 'build',
				},
				value: weightData,
			});
			blocks.push({
				id: 'flat-geometry-incoming-weights',
				phase: 'function',
				order: 40,
				source: `float cacheIncomingWeight(int directionIndex) {
	return texelFetch(
		uCacheIncomingWeights,
		ivec2(directionIndex, 0),
		0
	).r;
}`.trim(),
			});
		}

		if (context.kind === 'direct-l1') {
			bindings.push({
				spec: {
					id: 'flat-geometry-transport-interval-count',
					name: 'CACHE_TRANSPORT_INTERVAL_COUNT',
					kind: 'define',
					shaderType: 'int',
					frequency: 'pass',
				},
				value: /** @type {number} */ (
					context.pathIntervalCount
				),
			});
		}

		if (context.kind === 'transport') {
			const transportData =
				/** @type {CacheTransportData} */ (
					context.transportData
				);
			bindings.push(
				{
					spec: {
						id: 'flat-geometry-transport-sources',
						name: 'uCacheTransportSources',
						kind: 'data',
						shaderType: 'sampler2D',
						frequency: 'build',
					},
					value: transportData.sources,
				},
				{
					spec: {
						id: 'flat-geometry-transport-coefficients',
						name: 'uCacheTransportCoefficients',
						kind: 'data',
						shaderType: 'sampler2DArray',
						frequency: 'build',
					},
					value: transportData.coefficients,
				},
				{
					spec: {
						id: 'flat-geometry-transport-tap-count',
						name: 'CACHE_TRANSPORT_TAP_COUNT',
						kind: 'define',
						shaderType: 'int',
						frequency: 'build',
					},
					value: transportData.tapCount,
				},
			);
			blocks.push({
				id: 'flat-geometry-transport-data',
				phase: 'function',
				order: 0,
				source: `int cacheTransportQueryIndex(
	int outputDirectionIndex,
	int outputPositionIndex
) {
	return outputPositionIndex * CACHE_DIRECTION_COUNT
		+ outputDirectionIndex;
}

ivec3 cacheTransportSource(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	int sourceOffset = tapIndex * 3;
	return ivec3(
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset, queryIndex),
			0
		).r + 0.5),
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset + 1, queryIndex),
			0
		).r + 0.5),
		int(texelFetch(
			uCacheTransportSources,
			ivec2(sourceOffset + 2, queryIndex),
			0
		).r + 0.5)
	);
}

float cacheTransportCoefficient(
	int outputDirectionIndex,
	int outputPositionIndex,
	int tapIndex,
	int wavelengthIndex
) {
	int queryIndex = cacheTransportQueryIndex(
		outputDirectionIndex,
		outputPositionIndex
	);
	return texelFetch(
		uCacheTransportCoefficients,
		ivec3(tapIndex, queryIndex, wavelengthIndex),
		0
	).r;
}`.trim(),
			});
		}

		return createCacheBuildModule({
			id: `algorithm32-flat-earth-${context.kind}-module-v3`,
			owner: 'geometry',
			provides,
			requires: [],
			blocks,
			bindings,
		});
	}

	/**
	 * Record one bounded runtime diagnostic.
	 *
	 * @param {string} id - Identifies the diagnostic.
	 * @param {string} severity - Supplies the diagnostic severity.
	 * @param {string} message - Supplies the human-readable diagnostic message.
	 * @param {Record<string, unknown>} details - Supplies structured diagnostic details.
	 * @returns {void}
	 */
	_diagnose(id, severity, message, details) {
		if (this._runtimeDiagnostics.length >= this._configuration.runtimeDiagnosticLimit) {
			return;
		}

		this._runtimeDiagnostics.push({
			id,
			severity,
			message,
			details: { ...details },
		});
	}

	/**
	 * Convert one model position into the observer-local Three scene frame.
	 *
	 * @param {readonly number[]} position - Supplies the physical model position in meters.
	 * @param {number} metersPerSceneUnit - Supplies the accepted scene scale.
	 * @returns {readonly [number, number, number]} Return observer-local scene coordinates.
	 */
	_modelPositionToObserverLocalScenePoint(position, metersPerSceneUnit) {
		const observer = this._configuration.observerPosition.coordinates;

		return [
			(position[0] - observer[0]) / metersPerSceneUnit,
			position[2] / metersPerSceneUnit,
			-(position[1] - observer[1]) / metersPerSceneUnit,
		];
	}

	/**
	 * Create the geometry-owned flat shader contribution.
	 *
	 * @param {Algorithm32ShaderDescriptor} descriptor - Supplies the active descriptor.
	 * @returns {ShaderContribution} Return the geometry contribution.
	 */
	_createShaderContribution(descriptor) {
		this._assertFlatGeometryDescriptor(descriptor);
		const facts = /** @type {Record<string, any>} */ (descriptor.geometry.facts ?? {});
		const frame = facts.observerLocalSceneFrame;

		if (!frame || typeof frame !== 'object') {
			throw new TypeError('Flat geometry descriptor requires observerLocalSceneFrame.');
		}
		const dome = facts.observerCenteredDome;
		const domeEnabled = Boolean(dome);
		const observerPositionMeters = DistanceMath.toMetersPosition(facts.observerPosition);
		const topAltitudeMeters = DistanceMath.toMeters(facts.topAltitude);
		const sceneSkyRayLimitMeters = facts.sceneSkyRayLimit
			? DistanceMath.toMeters(facts.sceneSkyRayLimit)
			: topAltitudeMeters;
		const domeCenterMeters = domeEnabled ? DistanceMath.toMetersPosition(dome.sphereCenter) : [0, 0, 0];
		const domeRadiusMeters = domeEnabled ? DistanceMath.toMeters(dome.sphereRadius) : 0;
		const cacheAltitudeNodesMeters = facts.cacheAltitudeNodes.map(
			(node) => DistanceMath.toMeters(node),
		);
		const cacheRadialNodesMeters = facts.cacheRadialNodes.map(
			(node) => DistanceMath.toMeters(node),
		);
		const cacheAxisMaximumNodeCount = Math.max(
			cacheAltitudeNodesMeters.length,
			cacheRadialNodesMeters.length,
		);
		const paddedCacheAltitudeNodesMeters = [
			...cacheAltitudeNodesMeters,
			...Array(
				cacheAxisMaximumNodeCount
					- cacheAltitudeNodesMeters.length,
			).fill(
				cacheAltitudeNodesMeters[
					cacheAltitudeNodesMeters.length - 1
				],
			),
		];
		const paddedCacheRadialNodesMeters = [
			...cacheRadialNodesMeters,
			...Array(
				cacheAxisMaximumNodeCount
					- cacheRadialNodesMeters.length,
			).fill(
				cacheRadialNodesMeters[
					cacheRadialNodesMeters.length - 1
				],
			),
		];
		const sourceSubpointMeters =
			DistanceMath.toMetersPosition(facts.sourceSubpoint);
		const cacheRadialFallbackDirection =
			normalizeDirection(
				facts.cacheRadialFallbackDirection,
				'geometry.facts.cacheRadialFallbackDirection',
			);

		return createShaderContribution({
			id: 'geometry-flat-earth',
			owner: 'geometry',
			descriptorFingerprint: descriptor.geometry.fingerprint,
			compatibilityTags: descriptor.geometry.compatibilityTags,
			provides: [
				'geometry.reconstructViewRay',
				'geometry.resolveAtmospherePath',
				'geometry.atmosphereCoordinateTypes',
				'geometry.resolveAtmosphereCoordinate',
				'geometry.scatteringCacheStencilTypes',
				'geometry.resolveScatteringCachePositionStencil',
				'geometry.resolveScatteringCacheDirectionStencil',
				'geometry.finiteCelestialAtmosphereSegment',
			],
			requires: ['runtime.initialState', 'runtime.depthTexture', 'runtime.sceneHitTexture'],
			uniforms: [
				createShaderUniformDescriptor('uInverseProjectionMatrix', 'mat4', 'geometry.inverseProjectionMatrix', FLAT_GEOMETRY_IDENTITY_MATRIX4),
				createShaderUniformDescriptor('uInverseViewMatrix', 'mat4', 'geometry.inverseViewMatrix', FLAT_GEOMETRY_IDENTITY_MATRIX4),
				createShaderUniformDescriptor('uCameraWorldPositionMeters', 'vec3', 'geometry.cameraWorldPosition', observerPositionMeters),
				createShaderUniformDescriptor('uSceneTerminationMeters', 'float', 'geometry.sceneTermination', 0),
				createShaderUniformDescriptor('uSceneDepthMaxMeters', 'float', 'geometry.sceneDepthMax', sceneSkyRayLimitMeters),
			],
			functions: [
				createShaderSourceBlock('geometry-cache-stencil-types', 'declareTypes', 10, `struct AtmosphereCoordinate {
	float altitudeMeters;
	float rhoMeters;
};

struct CachePositionStencil {
	ivec4 indices;
	vec4 weights;
};

struct CacheDirectionStencil {
	ivec4 indices;
	vec4 weights;
};`),
				createShaderSourceBlock('geometry-constants', 'declareConstants', 0, `const float GEOMETRY_TOP_ALTITUDE_METERS = ${formatShaderFloat(topAltitudeMeters)};
const float GEOMETRY_SCENE_SKY_RAY_LIMIT_METERS = ${formatShaderFloat(sceneSkyRayLimitMeters)};
const int GEOMETRY_CACHE_Z_COUNT = ${cacheAltitudeNodesMeters.length};
const int GEOMETRY_CACHE_RHO_COUNT = ${cacheRadialNodesMeters.length};
const float GEOMETRY_CACHE_Z_NODES_METERS[${cacheAxisMaximumNodeCount}] = float[${cacheAxisMaximumNodeCount}](${formatShaderFloatArray(paddedCacheAltitudeNodesMeters)});
const float GEOMETRY_CACHE_RHO_NODES_METERS[${cacheAxisMaximumNodeCount}] = float[${cacheAxisMaximumNodeCount}](${formatShaderFloatArray(paddedCacheRadialNodesMeters)});
const vec3 GEOMETRY_SOURCE_SUBPOINT_METERS = ${formatShaderVec3(sourceSubpointMeters)};
const vec3 GEOMETRY_CACHE_RADIAL_FALLBACK = ${formatShaderVec3(cacheRadialFallbackDirection)};
const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = ${formatShaderVec3(frame.up)};
const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = ${formatShaderVec3(frame.right)};
const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = ${formatShaderVec3(frame.forward)};
const bool GEOMETRY_OBSERVER_DOME_ENABLED = ${domeEnabled ? 'true' : 'false'};
const vec3 GEOMETRY_OBSERVER_DOME_CENTER_METERS = ${formatShaderVec3(domeCenterMeters)};
const float GEOMETRY_OBSERVER_DOME_RADIUS_METERS = ${formatShaderFloat(domeRadiusMeters)};`),
				createShaderSourceBlock('geometry-reconstruct-helper', 'reconstructRay', 0, `ViewRay reconstructViewRay(vec2 uv) {
	vec4 clip = vec4(uv * 2.0 - 1.0, 1.0, 1.0);
	vec4 view = uInverseProjectionMatrix * clip;
	view.xyz /= max(view.w, 0.000001);
	vec3 sceneDirection = normalize((uInverseViewMatrix * vec4(normalize(view.xyz), 0.0)).xyz);
	vec3 direction = normalize(
		GEOMETRY_OBSERVER_RIGHT_DIRECTION * sceneDirection.x
		+ GEOMETRY_OBSERVER_UP_DIRECTION * sceneDirection.y
		+ GEOMETRY_OBSERVER_FORWARD_DIRECTION * sceneDirection.z
	);
	return ViewRay(uCameraWorldPositionMeters, direction);
}`),
				createShaderSourceBlock('geometry-depth-helper', 'resolvePathBounds', 0, `float sceneTerminationMetersFromDepth(float sceneDepth) {
	float decodedTerminationMeters = max(sceneDepth * uSceneDepthMaxMeters, 0.0);
	return uSceneTerminationMeters > 0.0 ? uSceneTerminationMeters : decodedTerminationMeters;
}

float positiveBoundaryDistance(float distanceMeters) {
	return max(distanceMeters, 0.0);
}

bool observerDomeBoundaryDistance(vec3 originMeters, vec3 direction, out float distanceMeters) {
	if (!GEOMETRY_OBSERVER_DOME_ENABLED) {
		distanceMeters = 0.0;
		return false;
	}

	vec3 offsetFromCenter = originMeters - GEOMETRY_OBSERVER_DOME_CENTER_METERS;
	float b = dot(offsetFromCenter, direction);
	float c = dot(offsetFromCenter, offsetFromCenter)
		- GEOMETRY_OBSERVER_DOME_RADIUS_METERS * GEOMETRY_OBSERVER_DOME_RADIUS_METERS;
	float discriminant = b * b - c;

	if (discriminant < -0.000001) {
		distanceMeters = 0.0;
		return false;
	}

	float root = sqrt(max(discriminant, 0.0));
	float nearDistance = -b - root;
	float farDistance = -b + root;

	if (c <= 0.000001 && farDistance >= -0.000001) {
		distanceMeters = positiveBoundaryDistance(farDistance);
		return true;
	}
	if (nearDistance >= -0.000001) {
		distanceMeters = positiveBoundaryDistance(nearDistance);
		return true;
	}
	if (farDistance >= -0.000001) {
		distanceMeters = positiveBoundaryDistance(farDistance);
		return true;
	}

	distanceMeters = 0.0;
	return false;
}

void chooseNearestBoundary(float candidateDistanceMeters, bool hasCandidate, inout float selectedDistanceMeters, inout bool hasSelected) {
	if (hasCandidate && (!hasSelected || candidateDistanceMeters < selectedDistanceMeters)) {
		selectedDistanceMeters = candidateDistanceMeters;
		hasSelected = true;
	}
}`),
				createShaderSourceBlock('geometry-path-helper', 'resolvePathBounds', 0, `PathBounds resolveAtmospherePath(ViewRay ray, float sceneTerminationMeters, bool hasSceneEndpoint) {
	bool hasTopBoundary = ray.direction.z > 0.000001;
	bool hasGroundBoundary = ray.direction.z < -0.000001;
	float topDistanceMeters = hasTopBoundary
		? positiveBoundaryDistance((GEOMETRY_TOP_ALTITUDE_METERS - ray.originMeters.z) / ray.direction.z)
		: 0.0;
	float groundDistanceMeters = hasGroundBoundary
		? positiveBoundaryDistance((0.0 - ray.originMeters.z) / ray.direction.z)
		: 0.0;
	float domeDistanceMeters = 0.0;
	bool hasDomeBoundary = observerDomeBoundaryDistance(ray.originMeters, ray.direction, domeDistanceMeters);
	bool hasAtmosphereBoundary = false;
	float boundaryDistanceMeters = 0.0;
	bool usesGroundBoundary = false;

	chooseNearestBoundary(topDistanceMeters, hasTopBoundary, boundaryDistanceMeters, hasAtmosphereBoundary);
	bool groundWouldWin = hasGroundBoundary
		&& (!hasAtmosphereBoundary || groundDistanceMeters <= boundaryDistanceMeters);
	chooseNearestBoundary(groundDistanceMeters, hasGroundBoundary, boundaryDistanceMeters, hasAtmosphereBoundary);
	usesGroundBoundary = groundWouldWin;
	chooseNearestBoundary(domeDistanceMeters, hasDomeBoundary, boundaryDistanceMeters, hasAtmosphereBoundary);

	float fallbackSkyDistanceMeters = max(GEOMETRY_SCENE_SKY_RAY_LIMIT_METERS, 0.0);
	float selectedBoundaryDistanceMeters = hasAtmosphereBoundary
		? boundaryDistanceMeters
		: fallbackSkyDistanceMeters;
	float endDistanceMeters = hasSceneEndpoint
		? min(max(sceneTerminationMeters, 0.0), selectedBoundaryDistanceMeters)
		: selectedBoundaryDistanceMeters;
	bool hasGroundEndpoint = hasGroundBoundary && groundDistanceMeters <= endDistanceMeters;
	bool valid = endDistanceMeters >= 0.0;
	return PathBounds(0.0, max(0.0, endDistanceMeters), sceneTerminationMeters, hasSceneEndpoint, hasGroundEndpoint, valid);
}

float finiteCelestialAtmosphereSegmentLength(ViewRay ray, float bodyEntryDistanceMeters) {
	if (bodyEntryDistanceMeters <= 0.0 || ray.direction.z <= 0.000001) return 0.0;
	float topDistanceMeters = (GEOMETRY_TOP_ALTITUDE_METERS - ray.originMeters.z) / ray.direction.z;
	return max(0.0, min(bodyEntryDistanceMeters, topDistanceMeters));
}`),
				createShaderSourceBlock('geometry-cache-stencils', 'sampleScatteringCache', 0, `AtmosphereCoordinate resolveAtmosphereCoordinate(
	ViewRay ray,
	float distanceMeters
) {
	vec3 positionMeters =
		ray.originMeters + ray.direction * distanceMeters;
	return AtmosphereCoordinate(
		positionMeters.z,
		length(positionMeters.xy - GEOMETRY_SOURCE_SUBPOINT_METERS.xy)
	);
}

void geometryCacheAxisStencil(
	float coordinateMeters,
	const int nodeCount,
	const float nodesMeters[${Math.max(cacheAltitudeNodesMeters.length, cacheRadialNodesMeters.length)}],
	out int lowerIndex,
	out int upperIndex,
	out float upperWeight
) {
	if (coordinateMeters <= nodesMeters[0]) {
		lowerIndex = 0;
		upperIndex = 0;
		upperWeight = 0.0;
		return;
	}
	int lastIndex = nodeCount - 1;
	if (coordinateMeters >= nodesMeters[lastIndex]) {
		lowerIndex = lastIndex;
		upperIndex = lastIndex;
		upperWeight = 0.0;
		return;
	}
	lowerIndex = 0;
	upperIndex = 1;
	for (int nodeIndex = 1; nodeIndex < nodeCount; ++nodeIndex) {
		if (coordinateMeters <= nodesMeters[nodeIndex]) {
			lowerIndex = nodeIndex - 1;
			upperIndex = nodeIndex;
			break;
		}
	}
	float lowerMeters = nodesMeters[lowerIndex];
	float upperMeters = nodesMeters[upperIndex];
	if (coordinateMeters == lowerMeters) {
		upperIndex = lowerIndex;
		upperWeight = 0.0;
		return;
	}
	if (coordinateMeters == upperMeters) {
		lowerIndex = upperIndex;
		upperWeight = 0.0;
		return;
	}
	upperWeight = (coordinateMeters - lowerMeters)
		/ (upperMeters - lowerMeters);
}

CachePositionStencil resolveScatteringCachePositionStencil(
	AtmosphereCoordinate coordinate
) {
	int zLower;
	int zUpper;
	float zUpperWeight;
	geometryCacheAxisStencil(
		coordinate.altitudeMeters,
		GEOMETRY_CACHE_Z_COUNT,
		GEOMETRY_CACHE_Z_NODES_METERS,
		zLower,
		zUpper,
		zUpperWeight
	);
	int rhoLower;
	int rhoUpper;
	float rhoUpperWeight;
	geometryCacheAxisStencil(
		coordinate.rhoMeters,
		GEOMETRY_CACHE_RHO_COUNT,
		GEOMETRY_CACHE_RHO_NODES_METERS,
		rhoLower,
		rhoUpper,
		rhoUpperWeight
	);
	float zLowerWeight = 1.0 - zUpperWeight;
	float rhoLowerWeight = 1.0 - rhoUpperWeight;
	return CachePositionStencil(
		ivec4(
			zLower * GEOMETRY_CACHE_RHO_COUNT + rhoLower,
			zLower * GEOMETRY_CACHE_RHO_COUNT + rhoUpper,
			zUpper * GEOMETRY_CACHE_RHO_COUNT + rhoLower,
			zUpper * GEOMETRY_CACHE_RHO_COUNT + rhoUpper
		),
		vec4(
			zLowerWeight * rhoLowerWeight,
			zLowerWeight * rhoUpperWeight,
			zUpperWeight * rhoLowerWeight,
			zUpperWeight * rhoUpperWeight
		)
	);
}

vec3 scatteringCacheLocalDirection(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 radial = vec3(
		positionMeters.xy - GEOMETRY_SOURCE_SUBPOINT_METERS.xy,
		0.0
	);
	if (length(radial) <= 1.0e-10) {
		radial = GEOMETRY_CACHE_RADIAL_FALLBACK;
	} else {
		radial = normalize(radial);
	}
	vec3 tangent = vec3(-radial.y, radial.x, 0.0);
	vec3 direction = normalize(physicalDirection);
	return vec3(
		dot(direction, radial),
		dot(direction, tangent),
		direction.z
	);
}

CacheDirectionStencil resolveScatteringCacheDirectionStencil(
	vec3 positionMeters,
	vec3 physicalDirection
) {
	vec3 direction =
		scatteringCacheLocalDirection(positionMeters, physicalDirection);
	int faceIndex = 0;
	float selectedProjection = direction.x;
	if (-direction.x > selectedProjection) {
		selectedProjection = -direction.x;
		faceIndex = 1;
	}
	if (direction.y > selectedProjection) {
		selectedProjection = direction.y;
		faceIndex = 2;
	}
	if (-direction.y > selectedProjection) {
		selectedProjection = -direction.y;
		faceIndex = 3;
	}
	if (direction.z > selectedProjection) {
		selectedProjection = direction.z;
		faceIndex = 4;
	}
	if (-direction.z > selectedProjection) {
		faceIndex = 5;
	}

	float denominator;
	float u;
	float v;
	if (faceIndex == 0) {
		denominator = direction.x;
		u = direction.y / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 1) {
		denominator = -direction.x;
		u = -direction.y / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 2) {
		denominator = direction.y;
		u = -direction.x / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 3) {
		denominator = -direction.y;
		u = direction.x / denominator;
		v = direction.z / denominator;
	} else if (faceIndex == 4) {
		denominator = direction.z;
		u = direction.x / denominator;
		v = direction.y / denominator;
	} else {
		denominator = -direction.z;
		u = -direction.x / denominator;
		v = direction.y / denominator;
	}

	float uGrid =
		clamp((clamp(u, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float vGrid =
		clamp((clamp(v, -1.0, 1.0) + 1.0) * 13.0, 0.0, 26.0);
	float uNearest = floor(uGrid + 0.5);
	float vNearest = floor(vGrid + 0.5);
	bool uExact = abs(uGrid - uNearest) <= 1.0e-10;
	bool vExact = abs(vGrid - vNearest) <= 1.0e-10;
	int uLower = uExact ? int(uNearest) : int(floor(uGrid));
	int vLower = vExact ? int(vNearest) : int(floor(vGrid));
	int uUpper = uExact ? uLower : min(uLower + 1, 26);
	int vUpper = vExact ? vLower : min(vLower + 1, 26);
	float uFraction = uExact ? 0.0 : uGrid - float(uLower);
	float vFraction = vExact ? 0.0 : vGrid - float(vLower);
	int faceOffset = faceIndex * 729;
	return CacheDirectionStencil(
		ivec4(
			faceOffset + vLower * 27 + uLower,
			faceOffset + vLower * 27 + uUpper,
			faceOffset + vUpper * 27 + uLower,
			faceOffset + vUpper * 27 + uUpper
		),
		vec4(
			(1.0 - uFraction) * (1.0 - vFraction),
			uFraction * (1.0 - vFraction),
			(1.0 - uFraction) * vFraction,
			uFraction * vFraction
		)
	);
}`),
			],
			mainHooks: [
				createShaderSourceBlock('geometry-main-ray', 'reconstructRay', 0, 'state.ray = reconstructViewRay(state.uv);'),
				createShaderSourceBlock('geometry-main-bounds', 'resolvePathBounds', 0, 'state.bounds = resolveAtmospherePath(state.ray, sceneTerminationMetersFromDepth(state.sceneDepth), state.sceneHitMask > 0.5);'),
			],
		});
	}

	/**
	 * Return distance to the top atmosphere plane.
	 *
	 * @param {Position} origin - Supplies origin.
	 * @param {UnitVector3} direction - Supplies direction.
	 * @returns {number | null} Distance to boundary, or null.
	 */
	distanceToTopAtmosphereBoundary(origin, direction) {
		const originVector = positionToMeters(origin, 'Top boundary origin');
		const directionVector = normalizeDirection(direction, 'Top boundary direction');

		if (directionVector[2] <= FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const distance = (this._configuration.topAltitude.value - originVector[2]) / directionVector[2];

		if (distance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, distance);
		}

		return null;
	}

	/**
	 * Return distance to the ground plane.
	 *
	 * @param {Position} origin - Supplies origin.
	 * @param {UnitVector3} direction - Supplies direction.
	 * @returns {number | null} Distance to boundary, or null.
	 */
	distanceToGroundBoundary(origin, direction) {
		const originVector = positionToMeters(origin, 'Ground boundary origin');
		const directionVector = normalizeDirection(direction, 'Ground boundary direction');

		if (directionVector[2] >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const distance = -originVector[2] / directionVector[2];

		if (distance >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, distance);
		}

		return null;
	}

	/**
	 * Resolve the nearest flat-ground hit along a physical ray.
	 *
	 * @param {Ray} ray - Supplies the physical ray.
	 * @returns {GroundIntersection | null} The ground hit or null.
	 */
	resolveGroundIntersection(ray) {
		const origin = positionToMeters(
			ray.origin,
			'Ground intersection origin',
		);
		const direction = normalizeDirection(
			ray.direction,
			'Ground intersection direction',
		);
		const distance = this.distanceToGroundBoundary(
			positionInMeters(origin),
			direction,
		);
		if (distance === null) {
			return null;
		}

		const hitPosition = VectorMath.addScaled(
			origin,
			direction,
			distance,
		);
		hitPosition[2] = 0;

		return {
			position: positionInMeters(hitPosition),
			normal: [0, 0, 1],
			distance: DistanceMath.inMeters(distance),
		};
	}

	/**
	 * Return distance to observer-centered dome boundary, when configured.
	 *
	 * @param {Position} origin - Supplies origin.
	 * @param {UnitVector3} direction - Supplies direction.
	 * @returns {number | null} Distance to boundary, or null.
	 */
	distanceToObserverCenteredDomeBoundary(origin, direction) {
		const dome = this._configuration.observerCenteredDome;

		if (!dome) {
			return null;
		}

		const originVector = positionToMeters(origin, 'Dome boundary origin');
		const directionVector = normalizeDirection(direction, 'Dome boundary direction');
		const offsetFromCenter = VectorMath.subtract(
			originVector,
			dome.sphereCenter.coordinates,
		);
		const b = VectorMath.dot(offsetFromCenter, directionVector);
		const c = VectorMath.dot(offsetFromCenter, offsetFromCenter) - dome.sphereRadius.value ** 2;
		const discriminant = b ** 2 - c;

		if (discriminant < -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return null;
		}

		const root = Math.sqrt(Math.max(0, discriminant));
		const near = -b - root;
		const far = -b + root;

		if (
			c <= FLAT_GEOMETRY_BOUNDARY_EPSILON
			&& far >= -FLAT_GEOMETRY_BOUNDARY_EPSILON
		) {
			return Math.max(0, far);
		}

		if (near >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, near);
		}

		if (far >= -FLAT_GEOMETRY_BOUNDARY_EPSILON) {
			return Math.max(0, far);
		}

		return null;
	}

	/**
	 * Resolve the nearest configured flat-atmosphere exit distance.
	 *
	 * @param {readonly number[]} origin - Supplies the normalized ray origin in meters.
	 * @param {UnitVector3} direction - Supplies the normalized ray direction.
	 * @param {string} operationKind - Identifies the requesting operation for diagnostics.
	 * @returns {number} Return the non-negative exit distance in meters.
	 */
	_resolveFlatExitDistance(origin, direction, operationKind) {
		const originPosition = positionInMeters(origin);
		const candidates = [
			this.distanceToGroundBoundary(originPosition, direction),
			this.distanceToTopAtmosphereBoundary(originPosition, direction),
			this.distanceToObserverCenteredDomeBoundary(originPosition, direction),
		].filter((distance) => distance !== null);

		if (candidates.length > 0) {
			return Math.min(...candidates);
		}

		if (this._configuration.sceneSkyRayLimit !== null) {
			this._diagnose('flat-ray-parallel-no-boundary-hit', 'warning',
				'Flat ray found no configured ground/top/dome boundary; using supplied no-hit cap.', {
					operationKind,
					sceneSkyRayLimit: this._configuration.sceneSkyRayLimit,
				});

			return this._configuration.sceneSkyRayLimit.value;
		}

		this._diagnose('flat-ray-parallel-default-top-cap', 'warning',
			'Flat ray found no configured ground/top/dome boundary or explicit cap; using topAltitude as the default finite view extent.', {
				operationKind,
				topAltitude: this._configuration.topAltitude,
			});

		return this._configuration.topAltitude.value;
	}

	/**
	 * Resolve flat model-space position into altitude-only atmosphere
	 * coordinates.
	 *
	 * @param {Position} position - Supplies
	 * model-space position.
	 * @returns {AtmosphereCoordinate} The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position) {
		const vector = positionToMeters(position, 'Flat atmosphere position');
		const altitudeMeters = vector[2];
		const sourceSubpoint = this._configuration.sourceSubpoint.coordinates;
		const rhoMeters = Math.hypot(
			vector[0] - sourceSubpoint[0],
			vector[1] - sourceSubpoint[1],
		);

		if (
			altitudeMeters < -FLAT_GEOMETRY_BOUNDARY_EPSILON
			|| altitudeMeters > this._configuration.topAltitude.value
				+ FLAT_GEOMETRY_BOUNDARY_EPSILON
		) {
			this._diagnose('flat-atmosphere-coordinate-out-of-domain', 'warning',
				'Flat atmosphere coordinate is outside the supplied atmosphere/profile domain.', {
					altitude: DistanceMath.inMeters(altitudeMeters),
					topAltitude: this._configuration.topAltitude,
				});
		}

		return {
			altitude: DistanceMath.inMeters(altitudeMeters),
			rho: DistanceMath.inMeters(rhoMeters),
		};
	}

	/**
	 * Build trapezoidal atmosphere-path samples over a normalized ray segment.
	 *
	 * @param {{
	 *   readonly origin: readonly [number, number, number],
	 *   readonly direction: UnitVector3,
	 * }} ray - Supplies the normalized physical ray.
	 * @param {number} startDistanceMeters - Supplies the segment start in meters.
	 * @param {number} endDistanceMeters - Supplies the segment end in meters.
	 * @param {number} sampleCount - Supplies the positive interval count.
	 * @returns {readonly AtmospherePathSample[]} Return the weighted path samples.
	 */
	_buildAtmospherePathSamples(ray, startDistanceMeters, endDistanceMeters, sampleCount) {
		if (!Number.isInteger(sampleCount) || sampleCount < 1) {
			throw new RangeError('Atmosphere path sampleCount must be a positive integer.');
		}

		const intervalLengthMeters = (endDistanceMeters - startDistanceMeters) / sampleCount;
		const samples = [];

		for (let pointIndex = 0; pointIndex <= sampleCount; pointIndex += 1) {
			const isEndpoint = pointIndex === 0 || pointIndex === sampleCount;
			const distance = startDistanceMeters + intervalLengthMeters * pointIndex;
			const position = VectorMath.addScaled(ray.origin, ray.direction, distance);

			samples.push({
				atmosphereCoordinate: this.resolveAtmosphereCoordinate(positionInMeters(position)),
				intervalLengthFromPrevious: DistanceMath.inMeters(pointIndex === 0 ? 0 : intervalLengthMeters),
				measure: DistanceMath.inMeters(intervalLengthMeters * (isEndpoint ? 0.5 : 1)),
			});
		}

		return samples;
	}

	/**
	 * Create the geometry-owned flat shader contribution.
	 *
	 * @param {ShaderContributionRequest} request - Supplies the active shader descriptor.
	 * @returns {ShaderContribution} The geometry shader contribution.
	 */
	createShaderContribution(request) {
		return this._createShaderContribution(request?.descriptor);
	}

	/**
	 * Return the model-space frame descriptor.
	 *
	 * @returns {object} The frame descriptor.
	 */
	getFrameDescriptor() {
		return {
			kind: 'observer-local-flat-frame',
			observerLocalSceneFrame: this._configuration.observerLocalSceneFrame,
		};
	}

	/**
	 * Resolve a finite view ray segment for atmosphere transport.
	 *
	 * @param {object} [request] - Supplies ray request facts.
	 * @returns {RaySegment} The clipped ray segment.
	 */
	resolveViewRaySegment(request = {}) {
		const origin = positionToMeters(
			request.origin === undefined
				? this._configuration.observerPosition
				: request.origin,
			'Flat view ray origin',
		);
		const direction = normalizeDirection(
			request.direction === undefined ? [0, 0, 1] : request.direction,
			'Flat view ray direction',
		);
		let endDistanceMeters = this._resolveFlatExitDistance(origin, direction, 'view-ray');

		if (
			!this._configuration.observerCenteredDome
			&& this._configuration.sceneSkyRayLimit !== null
		) {
			endDistanceMeters = Math.min(endDistanceMeters, this._configuration.sceneSkyRayLimit.value);
		}

		const requestedEndDistanceMeters = optionalDistanceToMeters(request.endDistance, 'endDistance');

		if (Number.isFinite(requestedEndDistanceMeters)) {
			endDistanceMeters = Math.min(endDistanceMeters, requestedEndDistanceMeters);
		}

		return {
			ray: {
				origin: positionInMeters(origin),
				direction,
			},
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(Math.max(0, endDistanceMeters)),
		};
	}

	/**
	 * Resolve a model-space ray into an atmosphere path.
	 *
	 * @param {{
	 *   readonly ray: Ray,
	 *   readonly startDistance?: Distance,
	 *   readonly endDistance?: Distance,
	 *   readonly sourcePathLimit?: SourcePathLimit,
	 *   readonly sampleCount?: number,
	 * }} request - Supplies path request facts.
	 * @returns {AtmospherePath} The atmosphere path.
	 */
	resolveAtmospherePath(request) {
		if (!request?.ray) {
			throw new TypeError('Flat atmosphere path requires ray.');
		}

		const ray = request.ray;
		const origin = positionToMeters(ray.origin, 'Flat atmosphere path origin');
		const direction = normalizeDirection(ray.direction, 'Flat atmosphere path direction');
		const startDistanceMeters = optionalDistanceToMeters(request.startDistance, 'startDistance') ?? 0;
		const sourceLimitMeters = sourcePathLimitDistanceToMeters(request.sourcePathLimit);
		const explicitEndDistanceMeters = optionalDistanceToMeters(request.endDistance, 'endDistance');
		const requestedLimitMeters = explicitEndDistanceMeters
			?? sourceLimitMeters;
		let candidateEndDistanceMeters = requestedLimitMeters;
		let boundaryKind = requestedLimitMeters === null
			? null
			: 'requested-limit';
		const originPosition = positionInMeters(origin);
		const topDistance = this.distanceToTopAtmosphereBoundary(originPosition, direction);
		const groundDistance = this.distanceToGroundBoundary(originPosition, direction);

		const physicalBoundaries = [
			{ kind: 'ground', distance: groundDistance },
			{ kind: 'top-atmosphere', distance: topDistance },
		];
		for (const boundary of physicalBoundaries) {
			const domainDistance = boundary.distance;
			if (
				domainDistance !== null
				&& domainDistance >= startDistanceMeters
					- FLAT_GEOMETRY_BOUNDARY_EPSILON
				&& (candidateEndDistanceMeters === null || domainDistance < candidateEndDistanceMeters)
			) {
				candidateEndDistanceMeters = domainDistance;
				boundaryKind = boundary.kind;
			}
		}

		if (candidateEndDistanceMeters === null) {
			throw new RangeError(
				'Reusable flat atmosphere path is unbounded; provide a finite source or endpoint limit.',
			);
		}

		const endDistanceMeters = Math.max(startDistanceMeters, candidateEndDistanceMeters);
		const sampleCount = request.sampleCount === undefined
			? FLAT_ATMOSPHERE_PATH_DEFAULT_INTERVAL_COUNT
			: request.sampleCount;
		const samples = this._buildAtmospherePathSamples(
			{ origin, direction },
			startDistanceMeters,
			endDistanceMeters,
			sampleCount,
		);
		const start = samples[0]?.atmosphereCoordinate
			?? this.resolveAtmosphereCoordinate(positionInMeters(origin));
		const end = samples[samples.length - 1]?.atmosphereCoordinate ?? start;
		const groundOccludedRequestedEndpoint = boundaryKind === 'ground'
			&& requestedLimitMeters !== null
			&& candidateEndDistanceMeters
				< requestedLimitMeters - FLAT_GEOMETRY_BOUNDARY_EPSILON;

		return {
			start,
			end,
			length: DistanceMath.inMeters(Math.max(0, endDistanceMeters - startDistanceMeters)),
			samples,
			blockedByGround: groundOccludedRequestedEndpoint,
			metadata: {
				startDistance: DistanceMath.inMeters(startDistanceMeters),
				endDistance: DistanceMath.inMeters(endDistanceMeters),
				boundaryKind,
				terminatedByGround: boundaryKind === 'ground',
				terminatedByTop: boundaryKind === 'top-atmosphere',
				groundOccludedRequestedEndpoint,
				observerDomeApplied: false,
				topDistance: topDistance === null ? null : DistanceMath.inMeters(topDistance),
				groundDistance: groundDistance === null ? null : DistanceMath.inMeters(groundDistance),
				sourceLimit: sourceLimitMeters === null ? null : DistanceMath.inMeters(sourceLimitMeters),
			},
		};
	}

	/**
	 * Resolve a sample point into local source-relative facts.
	 *
	 * @param {object} [request] - Supplies position facts.
	 * @returns {SourceRelativePosition} The source-relative packet.
	 */
	resolveSourceRelativePosition(request = {}) {
		if (!request.position) {
			throw new TypeError('resolveSourceRelativePosition requires position.');
		}

		const position = positionToMeters(request.position, 'Source-relative position');
		const sourcePositionMeters = this._configuration.sourcePosition.coordinates;
		const sourceSubpointMeters = this._configuration.sourceSubpoint.coordinates;
		const toSource = VectorMath.subtract(sourcePositionMeters, position);
		const distanceFromSourceMeters = VectorMath.length(toSource);
		const directionToSourceVector =
			distanceFromSourceMeters <= FLAT_GEOMETRY_BOUNDARY_EPSILON
				? [0, 0, 1]
				: VectorMath.scale(toSource, 1 / distanceFromSourceMeters);
		const directionToSource = /** @type {UnitVector3} */ ([
			directionToSourceVector[0],
			directionToSourceVector[1],
			directionToSourceVector[2],
		]);
		const sourceSubpointDelta = VectorMath.subtract(
			position,
			sourceSubpointMeters,
		);

		const directionFromSourceVector = VectorMath.scale(directionToSource, -1);
		const directionFromSource = /** @type {UnitVector3} */ ([
			directionFromSourceVector[0],
			directionFromSourceVector[1],
			directionFromSourceVector[2],
		]);

		return {
			directionFromSource,
			directionToSource,
			distanceFromSource: DistanceMath.inMeters(distanceFromSourceMeters),
			radialDistanceFromSourceSubpoint: DistanceMath.inMeters(
				Math.hypot(sourceSubpointDelta[0], sourceSubpointDelta[1]),
			),
			altitude: DistanceMath.inMeters(position[2]),
			metadata: {
				sourcePosition: this._configuration.sourcePosition,
				sourceSubpoint: this._configuration.sourceSubpoint,
			},
		};
	}

	/**
	 * Resolve one finite local-Sun placement in the flat model frame.
	 *
	 * The source owns its physical radius and radiance; geometry owns this
	 * receiver-relative transform and the exact apparent support it produces.
	 */
	resolveFiniteCelestialBodyPlacement(request = {}) {
		if (typeof request.sourceId !== 'string' || request.sourceId.length === 0) {
			throw new TypeError('Finite celestial placement requires sourceId.');
		}
		const receiverPosition = positionToMeters(
			request.receiverPosition,
			'Finite celestial receiver position',
		);
		const centerPosition = positionToMeters(
			request.centerPosition,
			'Finite celestial center position',
		);
		DistanceMath.assertDistance(request.radius, 'Finite celestial radius');
		const radiusMeters = DistanceMath.toMeters(request.radius);
		if (!(radiusMeters > 0)) {
			throw new RangeError('Finite celestial radius must be positive.');
		}
		const toCenter = VectorMath.subtract(centerPosition, receiverPosition);
		const distanceMeters = VectorMath.length(toCenter);
		if (!(distanceMeters > radiusMeters)) {
			throw new RangeError('Finite celestial receiver must remain outside the source body.');
		}
		const direction = VectorMath.scale(toCenter, 1 / distanceMeters);
		const angularRadiusRadians = Math.asin(radiusMeters / distanceMeters);
		const visibleSolidAngleSteradians = 2 * Math.PI * (
			1 - Math.sqrt(Math.max(0, 1 - (radiusMeters / distanceMeters) ** 2))
		);
		const transformFingerprint = JSON.stringify({
			family: 'flat-local-finite-sun-v1',
			sourceId: request.sourceId,
			receiverPosition,
			centerPosition,
			radiusMeters,
		});

		return {
			sourceId: request.sourceId,
			centerPosition: positionInMeters(centerPosition),
			receiverPosition: positionInMeters(receiverPosition),
			directionToSourceModel: directionTuple(direction),
			distance: DistanceMath.inMeters(distanceMeters),
			radius: DistanceMath.inMeters(radiusMeters),
			angularRadiusRadians,
			visibleSolidAngleSteradians,
			transformFingerprint,
		};
	}

	/** Classify a model-space ray against a geometry-resolved finite body. */
	resolveFiniteCelestialBodyRaySupport(request = {}) {
		const placement = request.placement;
		if (!placement?.centerPosition || !placement?.receiverPosition) {
			throw new TypeError('Finite celestial ray support requires a geometry placement.');
		}
		const rayOrigin = positionToMeters(request.rayOrigin, 'Finite celestial ray origin');
		const rayDirection = normalizeDirection(request.rayDirection, 'Finite celestial ray direction');
		const center = positionToMeters(placement.centerPosition, 'Finite celestial placement center');
		const radiusMeters = DistanceMath.toMeters(placement.radius);
		const toCenter = VectorMath.subtract(center, rayOrigin);
		const projectedDistance = VectorMath.dot(toCenter, rayDirection);
		const perpendicularSquared = Math.max(
			0,
			VectorMath.dot(toCenter, toCenter) - projectedDistance ** 2,
		);
		const discriminant = radiusMeters ** 2 - perpendicularSquared;
		if (projectedDistance <= 0 || discriminant < 0) {
			return { classification: 'outside-support', entryDistance: null };
		}
		return {
			classification: 'inside-support',
			entryDistance: DistanceMath.inMeters(
				Math.max(0, projectedDistance - Math.sqrt(discriminant)),
			),
		};
	}

	/**
	 * Resolve bilinear final-view interpolation over the selected z/rho grid.
	 *
	 * @param {FlatScatteringCachePositionStencilRequest} request - Supplies
	 * physical coordinates and an optional matching position domain.
	 * @returns {ScatteringCachePositionStencil} Up to four weighted taps.
	 */
	resolveScatteringCachePositionStencil(request) {
		const axes = this._cachePositionDomainAxes(
			request.positionAxes,
			this._cachePositionDomain,
		);
		const altitudeMeters =
			DistanceMath.toMeters(request.atmosphereCoordinate.altitude);
		const rho = request.atmosphereCoordinate.rho
			?? this.resolveAtmosphereCoordinate(request.position).rho;
		const rhoMeters = DistanceMath.toMeters(rho);
		const zStencil = this._cacheAxisStencil(
			altitudeMeters,
			axes.zNodes,
		);
		const rhoStencil = this._cacheAxisStencil(
			rhoMeters,
			axes.rhoNodes,
		);
		const taps = new Map();

		for (const [zIndex, zWeight] of [
			[zStencil.lowerIndex, zStencil.lowerWeight],
			[zStencil.upperIndex, zStencil.upperWeight],
		]) {
			for (const [rhoIndex, rhoWeight] of [
				[rhoStencil.lowerIndex, rhoStencil.lowerWeight],
				[rhoStencil.upperIndex, rhoStencil.upperWeight],
			]) {
				const weight = zWeight * rhoWeight;
				if (weight > 0) {
					const index = this._flattenPositionIndex(
						zIndex,
						rhoIndex,
						axes.rhoCount,
					);
					taps.set(index, (taps.get(index) ?? 0) + weight);
				}
			}
		}

		return {
			indices: [...taps.keys()],
			weights: [...taps.values()],
		};
	}

	/**
	 * Resolve bilinear construction interpolation over the selected z/rho grid.
	 *
	 * @param {FlatScatteringCachePositionStencilRequest} request - Supplies
	 * physical coordinates and an optional matching position domain.
	 * @returns {ScatteringCachePositionStencil} Up to four weighted taps.
	 */
	resolveScatteringCacheConstructionPositionStencil(request) {
		return this.resolveScatteringCachePositionStencil(request);
	}

	/**
	 * Express a physical outgoing direction in the radial/tangent/vertical frame.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - Supplies the physical
	 * position and direction.
	 * @returns {UnitVector3} The source-local direction.
	 */
	expressScatteringCacheDirection(request) {
		const position = positionToMeters(
			request.position,
			'Scattering-cache direction position',
		);
		const direction = normalizeDirection(
			request.physicalOutgoingDirection,
			'Scattering-cache physical direction',
		);

		return this._localCacheDirection(
			this._configuration,
			position,
			direction,
		);
	}

	/**
	 * Resolve a physical outgoing direction through W27 reconstruction.
	 *
	 * @param {ScatteringCacheDirectionRequest} request - Supplies the physical
	 * position and direction.
	 * @returns {ScatteringCacheDirectionStencil} Up to four W27 taps.
	 */
	resolveScatteringCacheDirectionStencil(request) {
		return createCubedSphereW27DirectionStencil(
			this.expressScatteringCacheDirection(request),
		);
	}

	/**
	 * Express one radial-frame cache direction in physical model space.
	 *
	 * @param {FlatScatteringCacheFramedDirectionRequest} request - Supplies the
	 * physical position and source-local direction.
	 * @returns {UnitVector3} The physical direction.
	 */
	expressPhysicalScatteringCacheDirection(request) {
		const position = positionToMeters(
			request.position,
			'Flat cache direction position',
		);
		const cacheDirection = normalizeDirection(
			request.cacheDirection,
			'Flat cache local direction',
		);

		return this._physicalCacheDirection(
			this._configuration,
			position,
			cacheDirection,
		);
	}

	/**
	 * Resolve a source-owned cache coordinate into its reusable physical ray.
	 *
	 * Ground-bound rays retain the atmosphere segment up to their hit. The
	 * observer dome and scene cap never enter this reusable construction path.
	 *
	 * @param {CacheBuildCoordinate} coordinate - Supplies the cache coordinate.
	 * @returns {RaySegment} The finite construction segment.
	 */
	resolveCacheBuildRay(coordinate) {
		const incomingDirection = coordinate.incomingDirection;
		if (!incomingDirection) {
			throw new TypeError(
				'Flat cache build coordinate requires incomingDirection.',
			);
		}
		const metadata =
			/** @type {FlatLocalCacheBuildCoordinateMetadata | undefined} */ (
				coordinate.metadata
			);
		let originPosition = metadata?.position;
		if (originPosition === undefined) {
			DistanceMath.assertDistance(coordinate.altitude, 'altitude');
			DistanceMath.assertDistance(coordinate.rho, 'rho');
			const radial =
				this._configuration.cacheRadialFallbackDirection;
			const sourceSubpoint =
				this._configuration.sourceSubpoint.coordinates;
			const altitudeMeters =
				DistanceMath.toMeters(coordinate.altitude);
			const rhoMeters = DistanceMath.toMeters(coordinate.rho);
			originPosition = positionInMeters([
				sourceSubpoint[0] + radial[0] * rhoMeters,
				sourceSubpoint[1] + radial[1] * rhoMeters,
				altitudeMeters,
			]);
		}

		const origin = positionToMeters(
			originPosition,
			'Flat cache build origin',
		);
		const direction = normalizeDirection(
			incomingDirection,
			'Flat cache build incomingDirection',
		);
		const boundary = this._resolveReusableBoundary(origin, direction);

		return {
			ray: {
				origin: positionInMeters(origin),
				direction,
			},
			startDistance: DistanceMath.inMeters(0),
			endDistance: DistanceMath.inMeters(boundary.distance),
			metadata: {
				boundaryKind: boundary.kind,
				terminatedByGround: boundary.kind === 'ground',
				observerDomeApplied: false,
			},
		};
	}

	/**
	 * Map observer-local scene point to flat model-space meters.
	 *
	 * @param {ScenePosition} point - Supplies observer-local point.
	 * @param {object} [request] - Supplies scale facts.
	 * @returns {Position} Model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(point, request = {}) {
		SceneMath.assertScenePosition(point, 'Observer-local scene point');
		const sceneScale = sceneScaleFromRequest(request);
		const vectorMeters = SceneMath.toMetersPosition(point, sceneScale);
		const observer = this._configuration.observerPosition.coordinates;

		return positionInMeters([
			observer[0] + vectorMeters[0],
			observer[1] - vectorMeters[2],
			vectorMeters[1],
		]);
	}

	/**
	 * Map observer-local scene direction to flat model-space direction.
	 *
	 * @param {UnitVector3} direction - Supplies observer-local direction.
	 * @returns {UnitVector3} Model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection(direction) {
		const vector = directionTuple(direction, 'Observer-local scene direction');

		return normalizeDirection([
			vector[0],
			-vector[2],
			vector[1],
		], 'Observer-local scene direction',
		);
	}

	/**
	 * Map an app-authored ground offset to the configured Three scene point.
	 *
	 * @param {ScenePosition} offset - Supplies horizontal scene offset.
	 * @param {object} [request] - Supplies optional height above ground.
	 * @returns {ScenePosition} Configured Three scene point.
	 */
	mapGroundOffsetToScenePoint(offset, request = {}) {
		SceneMath.assertScenePosition(offset, 'Ground scene offset');
		const heightAboveGround = request.heightAboveGround === undefined
			? SceneMath.inSceneUnits(0)
			: request.heightAboveGround;
		SceneMath.assertSceneDistance(heightAboveGround, 'heightAboveGround');
		const vector = offset.coordinates;
		const heightAboveGroundSceneUnits = heightAboveGround.value;

		return SceneMath.positionInSceneUnits([
			vector[0],
			heightAboveGroundSceneUnits,
			vector[2],
		]);
	}

	/**
	 * Project a scene point to the flat ground plane along a scene direction.
	 *
	 * @param {ScenePosition} point - Supplies the scene point to project.
	 * @param {unknown} direction - Supplies the scene projection direction.
	 * @returns {ScenePosition} Projected ground point in scene units.
	 */
	projectScenePointToGroundAlongDirection(point, direction) {
		SceneMath.assertScenePosition(point, 'Ground projection scene point');
		const vector = point.coordinates;
		const directionVector = normalizeDirection(direction, 'Ground projection scene direction');

		if (Math.abs(directionVector[1]) <= Number.EPSILON) {
			return SceneMath.positionInSceneUnits([vector[0], 0, vector[2]]);
		}

		const distance = -vector[1] / directionVector[1];

		if (!Number.isFinite(distance) || distance < 0) {
			return SceneMath.positionInSceneUnits([vector[0], 0, vector[2]]);
		}

		const projected = VectorMath.addScaled(vector, directionVector, distance);

		return SceneMath.positionInSceneUnits([projected[0], 0, projected[2]]);
	}

	/**
	 * Map flat model-space position to observer-local scene point.
	 *
	 * @param {Position} position - Supplies model-space position.
	 * @param {object} [request] - Supplies scale facts.
	 * @returns {ScenePosition} Observer-local scene point.
	 */
	mapModelPositionToObserverLocalScenePoint(position, request = {}) {
		const vector = positionToMeters(position, 'Model-space position');
		const sceneScale = sceneScaleFromRequest(request);

		return scenePositionInUnits(
			this._modelPositionToObserverLocalScenePoint(vector, sceneScale.value));
	}

	/**
	 * Create geometry-owned Three ground endpoint objects.
	 *
	 * @param {GeometryThreeEndpointObjectsRequest} request - Supplies scene
	 * scale, material, segmentation, and metadata overrides.
	 * @returns {GeometryThreeEndpointObjects} The geometry-owned endpoint objects.
	 */
	createThreeEndpointObjects(request = {}) {
		const sceneScale = sceneScaleFromRequest(request);
		const metersPerSceneUnit = sceneScale.value;
		const groundExtentMeters = positiveDistanceMetersOrDefault(
			request.groundExtent,
			this._flatGroundExtentMeters(this._configuration),
			'groundExtent',
		);
		const widthSceneUnits = groundExtentMeters / metersPerSceneUnit;
		const depthSceneUnits = groundExtentMeters / metersPerSceneUnit;
		const centerSceneUnits = this._modelPositionToObserverLocalScenePoint(
			[
				this._configuration.observerPosition.coordinates[0],
				this._configuration.observerPosition.coordinates[1],
				0,
			],
			metersPerSceneUnit,
		);
		const spectralReferenceId = stringOrDefault(
			request.spectralReferenceId,
			'algorithm32-flat-ground-object-matte',
			'spectralReferenceId',
		);
		const objectName = optionalString(request.name, 'name');
		const widthSegments = positiveIntegerOrDefault(request.widthSegments, 32, 'widthSegments');
		const heightSegments = positiveIntegerOrDefault(request.heightSegments, 32, 'heightSegments');
		const shadow = geometryEndpointShadowRequestOrNull(request.shadow);
		const visualObject = new THREE.Mesh(
			new THREE.PlaneGeometry(
				widthSceneUnits,
				depthSceneUnits,
				widthSegments,
				heightSegments,
			),
			this._createVisualMaterial(request));
		const raycastObject = new ExactFlatGroundObject({
			center: scenePositionInUnits(centerSceneUnits),
			width: SceneMath.inSceneUnits(widthSceneUnits),
			depth: SceneMath.inSceneUnits(depthSceneUnits),
			sceneScale,
			spectralReferenceId,
			name: objectName === undefined ? 'flat-earth-ground-endpoint' : objectName,
		});

		visualObject.name = `${objectName === undefined ? 'flat-earth-ground' : objectName}-visual`;
		visualObject.rotation.x = -Math.PI / 2;
		visualObject.position.set(centerSceneUnits[0], centerSceneUnits[1], centerSceneUnits[2]);
		visualObject.userData.algorithm32SceneInput = true;
		visualObject.userData.algorithm32EndpointRole = 'geometry-ground-visual';
		visualObject.userData.endpointKind = 'geometry-ground-boundary';
		visualObject.userData.spectralReferenceId = spectralReferenceId;
		visualObject.userData.sceneScale = sceneScale;
		if (shadow) {
			visualObject.receiveShadow = shadow.receiveShadow;
			visualObject.userData.shadowPolicy = shadow.shadowPolicy;
			visualObject.userData.shadowReceiverPolicy = 'geometry-owned-ground-receives-three-shadow-map';
		}

		return {
			visualObjects: [visualObject],
			raycastObjects: [raycastObject],
			metadata: {
				owner: 'FlatEarthGeometry',
				endpointKind: 'geometry-ground-boundary',
				shape: 'plane',
				groundPlane: 'z-equals-zero',
				groundExtent: DistanceMath.inMeters(groundExtentMeters),
				width: SceneMath.inSceneUnits(widthSceneUnits),
				depth: SceneMath.inSceneUnits(depthSceneUnits),
				center: scenePositionInUnits(centerSceneUnits),
				observerPosition: this._configuration.observerPosition,
				sceneScale,
				spectralReferenceId,
				widthSegments,
				heightSegments,
				shadow: shadow ? { ...shadow } : null,
			},
		};
	}

	/**
	 * Resolve the scene-depth capture cap for geometry-owned flat endpoints.
	 *
	 * @param {GeometrySceneDepthMaxRequest} request - Supplies optional
	 * endpoint extent and minimum cap policy.
	 * @returns {Distance} Scene-depth cap.
	 */
	resolveSceneDepthMax(request = {}) {
		const groundExtentMeters = positiveDistanceMetersOrDefault(
			request.groundExtent,
			this._flatGroundExtentMeters(this._configuration),
			'groundExtent',
		);
		const halfExtentMeters = groundExtentMeters / 2;
		const observerPositionMeters = this._configuration.observerPosition.coordinates;
		const cameraPositionMeters = this._cameraPositionMetersOrNull(
			request,
			observerPositionMeters,
		)
			?? observerPositionMeters;
		const groundCenterMeters = [
			observerPositionMeters[0],
			observerPositionMeters[1],
			0,
		];
		const farthestGroundEndpointMeters = Math.max(
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] - halfExtentMeters,
				groundCenterMeters[1] - halfExtentMeters,
				groundCenterMeters[2],
			]),
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] - halfExtentMeters,
				groundCenterMeters[1] + halfExtentMeters,
				groundCenterMeters[2],
			]),
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] + halfExtentMeters,
				groundCenterMeters[1] - halfExtentMeters,
				groundCenterMeters[2],
			]),
			VectorMath.distance(cameraPositionMeters, [
				groundCenterMeters[0] + halfExtentMeters,
				groundCenterMeters[1] + halfExtentMeters,
				groundCenterMeters[2],
			]));

		return DistanceMath.inMeters(Math.max(
			positiveDistanceMetersOrDefault(request.minimum, 1, 'minimum'),
			farthestGroundEndpointMeters,
		));
	}
}
