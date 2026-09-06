import * as THREE from 'three';

import {
	NATIVE_48_POSITION_NODES,
	createCubedSphereW27DirectionStencil,
} from '../../domains/index.js';
import { SphericalEarthGeometry } from '../SphericalEarthGeometry.js';

describe('SphericalEarthGeometry', () => {
	it('describes spherical geometry and frame facts', () => {
		const geometry = createGeometry();

		expect(geometry.id).toBe('spherical-earth-geometry');
		expect(geometry.describe()).toEqual(jasmine.objectContaining({
			kind: 'spherical-earth-geometry',
			bottomRadius: meters(10),
			topRadius: meters(20),
			observerHeight: meters(1),
			directionToSource: [0, 1, 0],
			cacheAltitudeBinCount: 2,
			cacheBoundaryAltitude: meters(2),
		}));
		expect(geometry.getFrameDescriptor()).toEqual(jasmine.objectContaining({
			kind: 'observer-local-spherical-frame',
			observerUpDirection: [1, 0, 0],
		}));
	});

	it('owns retained construction lookup and selected Star source frames', () => {
		const geometry = createGeometry({ cacheAltitudeBinCount: 48 });
		const samplePosition = position([15, 0, 0]);

		expect(geometry.resolveScatteringCacheConstructionPositionStencil({
			position: samplePosition,
			atmosphereCoordinate: geometry.resolveAtmosphereCoordinate(samplePosition),
		})).toEqual({ indices: [24], weights: [1] });

		expect(geometry.expressPhysicalIncomingRadianceDirection(
			[1, 0, 0],
		)).toEqual([0, 1, 0]);

		const physicalW27Y =
			geometry.expressPhysicalOutgoingScatteringDirection(
				[0, 1, 0],
			);
		expect(physicalW27Y).toEqual([-1, 0, 0]);
		expect(geometry.expressScatteringCacheDirection({
			position: samplePosition,
			physicalOutgoingDirection: physicalW27Y,
		})).toEqual([0, 1, 0]);
		expect(geometry.resolveScatteringCacheDirectionStencil({
			position: samplePosition,
			physicalOutgoingDirection: physicalW27Y,
		})).toEqual(createCubedSphereW27DirectionStencil([0, 1, 0]));
	});

	it('resolves final-view stencils over the actual Native-48 altitude nodes', () => {
		const bottomRadiusMeters = 6360000;
		const geometry = createNativeCacheGeometry();
		const positionAtAltitude = (altitudeMeters) => position([
			bottomRadiusMeters + altitudeMeters,
			0,
			0,
		]);
		/** @param {number} altitudeMeters - Supplies the resolved altitude. */
		const stencilAtAltitude = (altitudeMeters) =>
			geometry.resolveScatteringCachePositionStencil({
				position: positionAtAltitude(altitudeMeters),
				atmosphereCoordinate: { altitude: meters(altitudeMeters) },
			});

		NATIVE_48_POSITION_NODES.forEach((node) => {
			expect(stencilAtAltitude(node.coordinate.value))
				.toEqual({ indices: [node.index], weights: [1] });
		});

		expect(stencilAtAltitude(-10)).toEqual({ indices: [0], weights: [1] });
		expect(stencilAtAltitude(60000)).toEqual({ indices: [47], weights: [1] });

		const lowerIndex = 10;
		const upperIndex = lowerIndex + 1;
		const lowerAltitudeMeters =
			NATIVE_48_POSITION_NODES[lowerIndex].coordinate.value;
		const upperAltitudeMeters =
			NATIVE_48_POSITION_NODES[upperIndex].coordinate.value;
		const upperWeight = 0.25;
		const interpolatedAltitudeMeters = lowerAltitudeMeters
			+ (upperAltitudeMeters - lowerAltitudeMeters) * upperWeight;
		const interpolated = stencilAtAltitude(interpolatedAltitudeMeters);

		expect(interpolated.indices).toEqual([lowerIndex, upperIndex]);
		expect(interpolated.weights[0]).toBeCloseTo(0.75, 12);
		expect(interpolated.weights[1]).toBeCloseTo(0.25, 12);

		const exactNodeIndex = 24;
		const exactNodeAltitudeMeters =
			NATIVE_48_POSITION_NODES[exactNodeIndex].coordinate.value;
		const nearNodeOffsetMeters = 1e-8;
		const justBelow = stencilAtAltitude(
			exactNodeAltitudeMeters - nearNodeOffsetMeters,
		);
		const justAbove = stencilAtAltitude(
			exactNodeAltitudeMeters + nearNodeOffsetMeters,
		);

		expect(justBelow.indices).toEqual([exactNodeIndex - 1, exactNodeIndex]);
		expect(justBelow.weights[0]).toBeGreaterThan(0);
		expect(justAbove.indices).toEqual([exactNodeIndex, exactNodeIndex + 1]);
		expect(justAbove.weights[1]).toBeGreaterThan(0);

	});

	it('keeps former uniform-bin boundaries continuous with the owner domain', () => {
		const bottomRadiusMeters = 6360000;
		const nativeGeometry = createNativeCacheGeometry();
		const below = nativeGeometry.resolveScatteringCachePositionStencil({
			position: position([bottomRadiusMeters + 1250 - 1e-3, 0, 0]),
			atmosphereCoordinate: { altitude: meters(1250 - 1e-3) },
		});
		const above = nativeGeometry.resolveScatteringCachePositionStencil({
			position: position([bottomRadiusMeters + 1250 + 1e-3, 0, 0]),
			atmosphereCoordinate: { altitude: meters(1250 + 1e-3) },
		});

		expect(below.indices).toEqual([0, 1]);
		expect(above.indices).toEqual([0, 1]);
		expect(above.weights[1] - below.weights[1]).toBeCloseTo(
			2e-3 / (1875 - 2),
			12,
		);

	});

	it('normalizes supported physical units at construction', () => {
		const geometry = createGeometry({
			bottomRadius: kilometers(0.01),
			topRadius: kilometers(0.02),
			observerHeight: kilometers(0.001),
			cacheBoundaryAltitude: kilometers(0.002),
		});

		expect(geometry.describe()).toEqual(jasmine.objectContaining({
			bottomRadius: meters(10),
			topRadius: meters(20),
			observerHeight: meters(1),
			cacheBoundaryAltitude: meters(2),
		}));
	});

	it('creates its geometry-owned shader contribution without executing descriptor facts', () => {
		const geometry = createNativeCacheGeometry();
		const descriptor = createDescriptor(geometry);
		descriptor.geometry.facts = { kind: 'metadata-only-decoy' };
		const contribution = geometry.createShaderContribution({
			descriptor,
		});

		expect(contribution.id).toBe('geometry-spherical-earth');
		expect(contribution.owner).toBe('geometry');
		expect(contribution.provides).toEqual([
			'geometry.reconstructViewRay',
			'geometry.resolveAtmospherePath',
			'geometry.atmosphereCoordinateTypes',
			'geometry.resolveAtmosphereCoordinate',
			'geometry.scatteringCacheStencilTypes',
			'geometry.resolveScatteringCachePositionStencil',
			'geometry.resolveScatteringCacheDirectionStencil',
		]);
		expect(contribution.requires).toContain('light.directionToAtmosphericSource');
		const types = contribution.functions.find(
			(block) => block.id === 'geometry-cache-stencil-types',
		).code;
		const constants = contribution.functions.find(
			(block) => block.id === 'geometry-constants',
		).code;
		const stencils = contribution.functions.find(
			(block) => block.id === 'geometry-cache-stencils',
		);
		expect(types).toContain('struct AtmosphereCoordinate');
		expect(types).toContain('float altitudeMeters;');
		expect(types).toContain('ivec2 indices;');
		expect(types).toContain('ivec4 indices;');
		expect(constants).toContain('const float GEOMETRY_BOTTOM_RADIUS_METERS = 6360000.0;');
		expect(constants).toContain('const int GEOMETRY_CACHE_POSITION_COUNT = 48;');
		expect(constants).toContain('GEOMETRY_CACHE_POSITION_NODES_METERS[48]');
		expect(constants).toContain(
			'const vec3 GEOMETRY_CACHE_RADIAL_DIRECTION = vec3(1.0, 0.0, 0.0);',
		);
		expect(stencils.slot).toBe('sampleScatteringCache');
		expect(stencils.code).toContain(
			'AtmosphereCoordinate resolveAtmosphereCoordinate(ViewRay ray, float distanceMeters)',
		);
		expect(stencils.code).toContain(
			'CachePositionStencil resolveScatteringCachePositionStencil(\n\tAtmosphereCoordinate coordinate',
		);
		expect(stencils.code).toContain(
			'CacheDirectionStencil resolveScatteringCacheDirectionStencil(',
		);
		expect(stencils.code).toContain(
			'directionToAtmosphericSource(positionMeters)',
		);
		expect(stencils.code).toContain('uCameraGroundRelativePositionMeters');
		expect(stencils.code).toContain('transverseDistanceSquaredMeters');
		expect(stencils.code).not.toContain(
			'length(positionMeters) - GEOMETRY_BOTTOM_RADIUS_METERS',
		);
		expect(contribution.bindingRequirements).toContain(jasmine.objectContaining({
			id: 'geometry.camera-ground-relative-position',
			valueKey: 'geometry.cameraGroundRelativePosition',
			updateFrequency: 'frame',
			required: true,
		}));

		const roundedEarthScaleAltitude = (altitudeMeters) => Math.fround(
			Math.fround(6360000 + Math.fround(altitudeMeters)) - 6360000,
		);
		const groundRelativeAltitude = (altitudeMeters) => Math.fround(
			Math.fround(2) + Math.fround(altitudeMeters - 2),
		);
		expect(roundedEarthScaleAltitude(1250 - 0.25)).toBe(1250);
		expect(roundedEarthScaleAltitude(1250 + 0.25)).toBe(1250);
		expect(groundRelativeAltitude(1250 - 0.25)).toBe(1249.75);
		expect(groundRelativeAltitude(1250 + 0.25)).toBe(1250.25);
		expect(stencils.code).not.toContain('CACHE_INCIDENT');
	});

	it('can reconstruct shader rays from a model-space Three scene frame', () => {
		const geometry = createNativeCacheGeometry({
			sceneFrame: {
				kind: 'model-space',
			},
		});
		const descriptor = createDescriptor(geometry);
		const contribution = geometry.createShaderContribution({ descriptor });
		const constantsBlock = contribution.functions.find((block) => block.id === 'geometry-constants');

		expect(geometry.getFrameDescriptor().kind).toBe('model-space-spherical-frame');
		expect(geometry.describe().sceneFrame.kind).toBe('model-space');
		expect(constantsBlock.code).toContain('const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = vec3(0.0, 1.0, 0.0);');
		expect(constantsBlock.code).toContain('const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = vec3(1.0, 0.0, 0.0);');
		expect(constantsBlock.code).toContain('const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = vec3(0.0, 0.0, 1.0);');
	});

	it('keeps non-X-up camera defaults and model-space offsets ground-relative', () => {
		const geometry = createNativeCacheGeometry({
			observerUpDirection: [0, 0, 1],
			sceneFrame: { kind: 'model-space' },
		});
		const contribution = geometry.createShaderContribution({
			descriptor: createDescriptor(geometry),
		});
		const cameraWorld = contribution.uniforms.find(
			(uniform) => uniform.valueKey === 'geometry.cameraWorldPosition',
		);
		const cameraGroundRelative = contribution.uniforms.find(
			(uniform) => uniform.valueKey === 'geometry.cameraGroundRelativePosition',
		);
		const mappedCamera = geometry.mapObserverLocalScenePointToModelPosition(
			scenePosition([3, 4, 6360007]),
			{ sceneScale: sceneScale(1) },
		);
		const observerLocalGeometry = createNativeCacheGeometry({
			observerUpDirection: [0, 0, 1],
		});
		const observerLocalCamera = observerLocalGeometry
			.mapObserverLocalScenePointToModelPosition(
				scenePosition([3, 7, 4]),
				{ sceneScale: sceneScale(1) },
			);

		expect(cameraWorld.defaultValue).toEqual([0, 0, 6360002]);
		expect(cameraGroundRelative.defaultValue).toEqual([0, 0, 2]);
		expect(geometry.resolveGroundRelativePosition(mappedCamera)).toEqual(
			position([3, 4, 7]),
		);
		expect(observerLocalGeometry.resolveGroundRelativePosition(observerLocalCamera))
			.toEqual(position([3, -4, 7]));
	});

	it('creates geometry-owned Three spherical endpoint objects', () => {
		const endpoints = createGeometry().createThreeEndpointObjects({
			sceneScale: sceneScale(2),
			name: 'test-sphere',
			visualMaterialLighting: 'lambert',
		});
		const visualObject = endpoints.visualObjects[0];
		const raycastObject = endpoints.raycastObjects[0];
		const hits = [];

		raycastObject.updateMatrixWorld(true);
		raycastObject.raycast(new THREE.Raycaster(
			new THREE.Vector3(0, 2, 0),
			new THREE.Vector3(0, -1, 0),
			0,
			100,
		), hits,
		);

		expect(visualObject instanceof THREE.Mesh).toBeTrue();
		expect(visualObject.geometry.type).toBe('SphereGeometry');
		expect(visualObject.material.type).toBe('MeshLambertMaterial');
		expect(visualObject.position.toArray()).toEqual([0, -5, 0]);
		expect(visualObject.userData).toEqual(jasmine.objectContaining({
			algorithm32SceneInput: true,
			algorithm32EndpointRole: 'geometry-ground-visual',
			endpointKind: 'geometry-ground-boundary',
			sceneScale: sceneScale(2),
		}));
		expect(raycastObject.userData).toEqual(jasmine.objectContaining({
			algorithm32SceneInput: true,
			algorithm32EndpointRole: 'geometry-ground-exact-raycast',
			endpointKind: 'geometry-ground-boundary',
			sceneScale: sceneScale(2),
		}));
		expect(hits.length).toBe(1);
		expect(hits[0].distance).toBeCloseTo(2, 12);
		expect(endpoints.metadata).toEqual(jasmine.objectContaining({
			owner: 'SphericalEarthGeometry',
			sceneFrameKind: 'observer-local',
			radius: sceneDistance(5),
			center: scenePosition([0, -5, 0]),
			shape: 'sphere',
			visualMeshKind: 'sphere',
		}));
	});

	it('can create a local spherical visual patch while exact raycasting owns ground hits', () => {
		const endpoints = createGeometry().createThreeEndpointObjects({
			sceneScale: sceneScale(2),
			name: 'test-sphere',
			widthSegments: 4,
			heightSegments: 2,
			shadow: {
				enabled: true,
			},
			groundVisualMesh: {
				kind: 'local-spherical-patch',
				xExtent: sceneDistance(1),
				zMin: sceneDistance(-1),
				zMax: sceneDistance(1),
				surfaceLift: sceneDistance(0.5),
			},
		});
		const visualObject = endpoints.visualObjects[0];
		const raycastObject = endpoints.raycastObjects[0];
		const hits = [];
		const positions = visualObject.geometry.getAttribute('position');

		raycastObject.updateMatrixWorld(true);
		raycastObject.raycast(new THREE.Raycaster(
			new THREE.Vector3(0, 2, 0),
			new THREE.Vector3(0, -1, 0),
			0,
			100,
		), hits,
		);

		expect(visualObject.geometry.type).toBe('BufferGeometry');
		expect(visualObject.position.toArray()).toEqual([0, 0, 0]);
		expect(visualObject.receiveShadow).toBeTrue();
		expect(positions.count).toBe(15);
		expect(positions.getY(7)).toBeCloseTo(0.5, 12);
		expect(visualObject.userData.algorithm32GroundVisualMesh).toEqual(jasmine.objectContaining({
			kind: 'local-spherical-patch',
			hitPolicy: 'visual-mesh-not-semantic-hit-authority',
			shadowReceiverPolicy: 'geometry-owned-ground-receives-three-shadow-map',
		}));
		expect(hits.length).toBe(1);
		expect(hits[0].distance).toBeCloseTo(2, 12);
		expect(endpoints.metadata).toEqual(jasmine.objectContaining({
			shape: 'local-spherical-patch',
			visualMeshKind: 'local-spherical-patch',
			raycastPolicy: 'geometry-owned-exact-sphere-raycast',
			sceneCapturePolicy: 'visual-mesh-raster-depth',
			shadow: jasmine.objectContaining({
				enabled: true,
				receiveShadow: true,
				shadowPolicy: 'geometry-ground-receives-source-shadow-map',
			}),
			groundPatch: jasmine.objectContaining({
				xRange: [sceneDistance(-1), sceneDistance(1)],
				zRange: [sceneDistance(-1), sceneDistance(1)],
				xSegments: 4,
				zSegments: 2,
				surfaceLift: sceneDistance(0.5),
			}),
		}));
	});

	it('centers model-space spherical endpoint objects at the model origin', () => {
		const endpoints = createGeometry({
			sceneFrame: {
				kind: 'model-space',
			},
		}).createThreeEndpointObjects({
			sceneScale: sceneScale(2),
		});
		const visualObject = endpoints.visualObjects[0];

		expect(visualObject.position.toArray()).toEqual([0, 0, 0]);
		expect(endpoints.metadata).toEqual(jasmine.objectContaining({
			sceneFrameKind: 'model-space',
			center: scenePosition([0, 0, 0]),
		}));
	});

	it('maps ground scene offsets through spherical geometry in observer-local frame', () => {
		const geometry = createGeometry();

		expect(geometry.mapGroundOffsetToScenePoint(scenePosition([1, 0, 2]), {
			sceneScale: sceneScale(2),
		})).toEqual(scenePosition([
			1,
			Math.sqrt(25 - 5) - 5,
			2,
		]));
	});

	it('maps observer-local scene positions and directions into spherical model space', () => {
		const geometry = createGeometry();
		const modelSpaceGeometry = createGeometry({
			observerUpDirection: [0, 1, 0],
			sceneFrame: {
				kind: 'model-space',
			},
		});

		expect(geometry.mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
			sceneScale: sceneScale(2),
		})).toEqual(position([14, 2, -6]));
		expect(geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])).toEqual([1, 0, 0]);
		expect(modelSpaceGeometry.mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
			sceneScale: sceneScale(2),
		})).toEqual(position([2, 4, 6]));
		expect(modelSpaceGeometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])).toEqual([0, 1, 0]);
	});

	it('accepts only the canonical tuple shape for core directions', () => {
		const geometry = createGeometry();

		expect(() => geometry.mapObserverLocalSceneDirectionToModelDirection({
			coordinates: [0, 1, 0],
		})).toThrowError(/three-component vector/);
		expect(() => geometry.mapObserverLocalSceneDirectionToModelDirection({
			x: 0,
			y: 1,
			z: 0,
		})).toThrowError(/three-component vector/);
	});

	it('maps ground scene offsets through spherical geometry in model-space frame', () => {
		const geometry = createGeometry({
			observerUpDirection: [0, 1, 0],
			sceneFrame: {
				kind: 'model-space',
			},
		});
		const surfacePoint = geometry.mapGroundOffsetToScenePoint(scenePosition([1, 0, 2]), {
			sceneScale: sceneScale(2),
		});
		const elevatedPoint = geometry.mapGroundOffsetToScenePoint(scenePosition([0, 0, 0]), {
			sceneScale: sceneScale(2),
			heightAboveGround: sceneDistance(3),
		});

		expect(surfacePoint.coordinates[0]).toBeCloseTo(1, 12);
		expect(surfacePoint.coordinates[1]).toBeCloseTo(Math.sqrt(25 - 5), 12);
		expect(surfacePoint.coordinates[2]).toBeCloseTo(2, 12);
		expect(elevatedPoint).toEqual(scenePosition([0, 8, 0]));
	});

	it('projects scene points to the local spherical ground receiver', () => {
		const geometry = createGeometry({
			observerUpDirection: [0, 1, 0],
			sceneFrame: {
				kind: 'model-space',
			},
		});

		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 8, 0]), [0, -1, 0], {
			sceneScale: sceneScale(2),
		})).toEqual(scenePosition([0, 5, 0]));
		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 4.99999, 0]), [0, -1, 0], {
			sceneScale: sceneScale(2),
			surfaceTolerance: sceneDistance(0.0001),
		})).toEqual(scenePosition([0, 5, 0]));
		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 6, 0]), [0, 1, 0], {
			sceneScale: sceneScale(2),
		})).toEqual(scenePosition([0, 5, 0]));
	});

	it('resolves a geometry-owned scene-depth cap from horizon distance', () => {
		const geometry = createGeometry();
		const modelSpaceGeometry = createGeometry({
			sceneFrame: {
				kind: 'model-space',
			},
		});

		expect(geometry.resolveSceneDepthMax().value).toBeCloseTo(Math.sqrt(21), 12);
		expect(modelSpaceGeometry.resolveSceneDepthMax({
			cameraPosition: position([12, 0, 0]),
		}).value).toBeCloseTo(Math.sqrt(44), 12,
		);
		expect(modelSpaceGeometry.resolveSceneDepthMax({
			camera: {
				position: {
					x: 12,
					y: 0,
					z: 0,
				},
			},
			sceneScale: sceneScale(1),
		}).value).toBeCloseTo(Math.sqrt(44), 12,
		);
		expect(modelSpaceGeometry.resolveSceneDepthMax({
			cameraPosition: position([12, 0, 0]),
			endpointPositions: [
				position([12, 0, 9]),
			],
		}).value).toBeCloseTo(9, 12,
		);
		expect(geometry.resolveSceneDepthMax({
			cameraScenePosition: scenePosition([0, 1, 0]),
			endpointScenePositions: [
				scenePosition([10, 1, 0]),
			],
			sceneScale: sceneScale(1),
		}).value).toBeCloseTo(10, 12,
		);
		expect(modelSpaceGeometry.resolveSceneDepthMax({
			camera: {
				position: {
					x: 6,
					y: 0,
					z: 0,
				},
			},
			endpointScenePositions: [
				scenePosition([6, 0, 5]),
			],
			sceneScale: sceneScale(2),
		}).value).toBeCloseTo(10, 12,
		);
	});

	it('resolves view rays against atmosphere and ground boundaries', () => {
		const geometry = createGeometry();

		expect(geometry.resolveViewRaySegment({
			origin: position([11, 0, 0]),
			direction: [1, 0, 0],
		}).endDistance.value).toBeCloseTo(9, 12,
		);
		expect(geometry.resolveViewRaySegment({
			origin: position([11, 0, 0]),
			direction: [-1, 0, 0],
		}).endDistance.value).toBeCloseTo(1, 12,
		);
		expect(geometry.resolveViewRaySegment({
			origin: position([11, 0, 0]),
			direction: [-1, 0, 0],
			groundBoundaryMode: 'scene-hit-owned',
		}).endDistance.value).toBeCloseTo(31, 12,
		);
		expect(geometry.resolveViewRaySegment({
			origin: position([11, 0, 0]),
			direction: [1, 0, 0],
			endDistance: meters(4),
		}).endDistance).toEqual(meters(4));
	});

	it('resolves typed spherical ground hits and misses', () => {
		const geometry = createGeometry();
		const hit = geometry.resolveGroundIntersection({
			origin: position([13, 0, 0]),
			direction: [-1, 0, 0],
		});

		expect(hit).toEqual({
			position: position([10, 0, 0]),
			normal: [1, 0, 0],
			distance: meters(3),
		});
		expect(hit.position.units).toBe('meters');
		expect(hit.distance.units).toBe('meters');
		expect(geometry.resolveGroundIntersection({
			origin: position([11, 0, 0]),
			direction: [0, 1, 0],
		})).toBeNull();
	});

	it('retains exact inward boundary hits while outward rays remain open', () => {
		const geometry = createGeometry();
		const groundOrigin = position([10, 0, 0]);
		const inward = [-1, 0, 0];
		const outward = [1, 0, 0];

		expect(geometry.resolveGroundIntersection({
			origin: groundOrigin,
			direction: inward,
		})).toEqual({
			position: groundOrigin,
			normal: [1, 0, 0],
			distance: meters(0),
		});
		expect(geometry.distanceToGroundBoundary(groundOrigin, inward)).toBe(0);
		expect(geometry.resolveViewRaySegment({
			origin: groundOrigin,
			direction: inward,
		}).endDistance).toEqual(meters(0));
		expect(geometry.resolveAtmospherePath({
			ray: { origin: groundOrigin, direction: inward },
		}).blockedByGround).toBeTrue();
		expect(geometry.resolveCacheBuildRay({
			altitude: meters(0),
			incomingDirection: inward,
		})).toBeNull();
		expect(geometry.resolveViewRaySegment({
			origin: groundOrigin,
			direction: inward,
			groundBoundaryMode: 'scene-hit-owned',
		}).endDistance).toEqual(meters(30));

		expect(geometry.resolveGroundIntersection({
			origin: groundOrigin,
			direction: outward,
		})).toBeNull();
		expect(geometry.distanceToGroundBoundary(groundOrigin, outward)).toBeNull();
		expect(geometry.resolveViewRaySegment({
			origin: groundOrigin,
			direction: outward,
		}).endDistance).toEqual(meters(10));
	});

	it('clamps boundary-scale binary64 roundoff to a zero-distance hit', () => {
		const geometry = createGeometry();
		const roundoffOrigin = position([
			10 - Number.EPSILON * 10,
			0,
			0,
		]);

		expect(geometry.distanceToGroundBoundary(roundoffOrigin, [-1, 0, 0])).toBe(0);
		expect(geometry.resolveGroundIntersection({
			origin: roundoffOrigin,
			direction: [-1, 0, 0],
		}).distance).toEqual(meters(0));
	});

	it('resolves atmosphere coordinates and source-relative packets', () => {
		const geometry = createGeometry();

		expect(geometry.resolveAtmosphereCoordinate(position([12, 0, 0]))).toEqual({
			altitude: meters(2),
		});
		expect(geometry.resolveSourceRelativePosition({ position: position([12, 0, 0]) })).toEqual({
			directionFromSource: [-0, -1, -0],
			directionToSource: [0, 1, 0],
			distanceFromSource: null,
		});
	});

	it('builds endpoint/trapezoid atmosphere path samples', () => {
		const path = createGeometry().resolveAtmospherePath({
			ray: {
				origin: position([11, 0, 0]),
				direction: [1, 0, 0],
			},
			sampleCount: 2,
		});

		expect(path.length.value).toBeCloseTo(9, 12);
		expect(path.samples.length).toBe(3);
		expect(path.samples.map((sample) => sample.measure)).toEqual([meters(2.25), meters(4.5), meters(2.25)]);
		expect(path.samples[0].atmosphereCoordinate.altitude.value).toBeCloseTo(1, 12);
		expect(path.samples[2].atmosphereCoordinate.altitude.value).toBeCloseTo(10, 12);
	});

	it('clips source paths by source limit or reports ground blocking', () => {
		const geometry = createGeometry();
		const clipped = geometry.resolveAtmospherePath({
			ray: {
				origin: position([11, 0, 0]),
				direction: [1, 0, 0],
			},
			sourcePathLimit: { maxDistance: meters(4) },
			sampleCount: 2,
		});
		const blocked = geometry.resolveAtmospherePath({
			ray: {
				origin: position([11, 0, 0]),
				direction: [-1, 0, 0],
			},
			sampleCount: 2,
		});

		expect(clipped.length).toEqual(meters(4));
		expect(clipped.metadata.endDistance).toEqual(meters(4));
		expect(blocked.blockedByGround).toBeTrue();
		expect(blocked.samples).toEqual([]);
	});

	it('resolves distant cache-construction rays', () => {
		const geometry = createGeometry();
		const ray = geometry.resolveCacheBuildRay({
			altitude: meters(2),
			incomingDirection: [1, 0, 0],
		});
		const blockedRay = geometry.resolveCacheBuildRay({
			altitude: meters(2),
			incomingDirection: [-1, 0, 0],
		});

		expect(ray.endDistance.value).toBeCloseTo(8, 12);
		expect(blockedRay).toBeNull();
	});

	it('defaults only omitted endpoint options and rejects explicit invalid values', () => {
		const geometry = createGeometry();
		const defaults = geometry.createThreeEndpointObjects({
			shadow: null,
		});

		expect(defaults.visualObjects[0].material.type).toBe('MeshBasicMaterial');
		expect(defaults.metadata.shadow).toBeNull();

		for (const visualMaterialDisplayRgba of [null, {}, [1, 2], [1, 2, 3, 4, 5], [1, 2, Number.NaN]]) {
			expect(() => geometry.createThreeEndpointObjects({ visualMaterialDisplayRgba }))
				.toThrowError(/visualMaterialDisplayRgba/u);
		}

		for (const visualMaterialLighting of [null, 'phong', 1]) {
			expect(() => geometry.createThreeEndpointObjects({ visualMaterialLighting }))
				.toThrowError(/visualMaterialLighting/u);
		}

		for (const shadow of [
			true,
			{ enabled: null },
			{ enabled: 'true' },
			{ enabled: true, receiveShadow: null },
			{ enabled: true, shadowPolicy: null },
		]) {
			expect(() => geometry.createThreeEndpointObjects({ shadow }))
				.toThrowError(/shadow/u);
		}

		for (const request of [
			{ widthSegments: null },
			{ widthSegments: 1.5 },
			{ heightSegments: null },
			{ heightSegments: 2.5 },
			{ sceneScale: null },
			{ visualMaterialColor: null },
			{ spectralReferenceId: null },
			{ name: null },
		]) {
			expect(() => geometry.createThreeEndpointObjects(request)).toThrow();
		}

		expect(() => geometry.resolveViewRaySegment({ origin: null })).toThrow();
		expect(() => geometry.resolveViewRaySegment({ direction: null })).toThrow();
		expect(() => geometry.resolveViewRaySegment({ groundBoundaryMode: null })).toThrow();
		expect(() => geometry.resolveViewRaySegment({ endDistance: null })).toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([11, 0, 0]), direction: [1, 0, 0] },
			startDistance: null,
		})).toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([11, 0, 0]), direction: [1, 0, 0] },
			sourcePathLimit: null,
		})).toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([11, 0, 0]), direction: [1, 0, 0] },
			sourcePathLimit: { maxDistance: null },
		})).not.toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([11, 0, 0]), direction: [1, 0, 0] },
			sampleCount: null,
		})).toThrow();
		expect(() => geometry.mapGroundOffsetToScenePoint(scenePosition([0, 0, 0]), {
			heightAboveGround: null,
		})).toThrow();
		expect(() => geometry.projectScenePointToGroundAlongDirection(
			scenePosition([0, 2, 0]),
			[0, -1, 0],
			{ surfaceTolerance: null },
		)).toThrow();
		expect(() => geometry.projectScenePointToGroundAlongDirection(
			scenePosition([0, 2, 0]),
			[0, -1, 0],
			{ maxLocalDistance: null },
		)).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ cameraPosition: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ minimum: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ endpointExtent: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ endpointPosition: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ endpointPositions: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ endpointSceneExtent: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ endpointScenePosition: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ endpointScenePositions: null })).toThrow();
	});

	it('rejects malformed local-patch policies instead of selecting a fallback mesh', () => {
		const geometry = createGeometry();

		for (const groundVisualMesh of [null, 1, true, []]) {
			expect(() => geometry.createThreeEndpointObjects({ groundVisualMesh }))
				.toThrowError(/groundVisualMesh/u);
		}

		for (const groundVisualMesh of [
			{ kind: null },
			{ kind: 'local-spherical-patch', xExtent: null },
			{ kind: 'local-spherical-patch', zMin: null },
			{ kind: 'local-spherical-patch', zMax: sceneDistance(Number.NaN) },
			{ kind: 'local-spherical-patch', surfaceLift: null },
		]) {
			expect(() => geometry.createThreeEndpointObjects({ groundVisualMesh }))
				.toThrowError(/groundVisualMesh/u);
		}
	});

	it('fails loudly for invalid geometry inputs', () => {
		expect(() => new SphericalEarthGeometry()).toThrowError(/configuration/);
		expect(() => createGeometry({ topRadius: meters(10) })).toThrowError(/top above bottom/);
		expect(() => createGeometry({ observerUpDirection: [0, 0, 0] })).toThrowError(/non-zero/);
		expect(() => createGeometry().resolveViewRaySegment({ groundBoundaryMode: 'other' })).toThrowError(/groundBoundaryMode/);
		expect(() => createGeometry().resolveAtmospherePath({
			startPosition: position([11, 0, 0]),
			direction: [1, 0, 0],
		})).toThrowError(/requires ray/);
		expect(() => createGeometry().resolveCacheBuildRay({ altitude: meters(1) })).toThrowError(/incomingDirection/);
		expect(() => createGeometry().createThreeEndpointObjects({
			groundVisualMesh: {
				kind: 'other',
			},
		})).toThrowError(/groundVisualMesh/);
	});
});

function createGeometry(overrides = {}) {
	return new SphericalEarthGeometry({
		bottomRadius: meters(10),
		topRadius: meters(20),
		observerHeight: meters(1),
		observerUpDirection: [1, 0, 0],
		directionToSource: [0, 1, 0],
		cacheAltitudeBinCount: 2,
		cacheBoundaryAltitude: meters(2),
		sourceTransmittanceIntervalCount: 2,
		...overrides,
	});
}

function createNativeCacheGeometry(overrides = {}) {
	return createGeometry({
		bottomRadius: meters(6360000),
		topRadius: meters(6420000),
		observerHeight: meters(2),
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: meters(2),
		...overrides,
	});
}

function createDescriptor(geometry = createGeometry()) {
	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis', {
			channelCount: 15,
		}),
		geometry: createSection('geometry', geometry.describe()),
		atmosphere: createSection('atmosphere', {
			kind: 'canonical-atmosphere',
			constants: {},
		}),
		lightSource: createSection('light-source', {
			kind: 'distant-sun-light-source',
			directionToLight: [0, 1, 0],
		}),
		cache: createSection('cache', {
			cacheKind: 'distant',
			metadata: {
				altitudeBinCount: 2,
				directionCount: 4,
			},
		}),
		transport: createSection('transport', {
			execution: {
				pathIntervalCount: 2,
				sourceTransmittanceIntervalCount: 2,
			},
		}),
		color: createSection('color', {}),
		runtime: createSection('runtime', {}),
	};
}

function createSection(fingerprint, facts) {
	return {
		descriptorId: fingerprint,
		fingerprint,
		compatibilityTags: [fingerprint],
		facts,
	};
}

function meters(value) {
	return { value, units: 'meters' };
}

function kilometers(value) {
	return { value, units: 'kilometers' };
}

function position(coordinates) {
	return { coordinates, units: 'meters' };
}

function sceneDistance(value) {
	return { value, units: 'scene-units' };
}

function scenePosition(coordinates) {
	return { coordinates, units: 'scene-units' };
}

function sceneScale(value) {
	return { value, units: 'meters-per-scene-unit' };
}
