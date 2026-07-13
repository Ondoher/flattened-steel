import * as THREE from 'three';

import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER, NATIVE_48_POSITION_NODES} from '../../../sampling-domains/index.js';
import {SphericalEarthGeometry} from '../SphericalEarthGeometry.js';

describe('SphericalEarthGeometry', /** Called by Jasmine to register the named test suite. */ () => {
	it('exposes normalized spherical geometry and its executable frame facts', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(geometry.id).toBe('spherical-earth-geometry');
		expect(geometry.configuration).toEqual(
			jasmine.objectContaining({
				bottomRadius: meters(10),
				topRadius: meters(20),
				observerHeight: meters(1),
				cacheAltitudeBinCount: 2,
				cacheBoundaryAltitude: meters(2),
			}),
		);
		expect(Math.hypot(...geometry.configuration.directionToSource)).toBeCloseTo(1, 12);
		expect(geometry.configuration.sceneFrame).toEqual({
			kind: 'observer-local',
			up: [1, 0, 0],
			right: [0, 1, 0],
			forward: [-0, -0, -1],
		});
	});

	it('expresses model-space celestial directions in the inverse scene frame', () => {
		const geometry = createGeometry();

		expectVectorCloseTo(geometry.expressCelestialDirectionInScene([1, 0, 0]), [0, 1, 0]);
		expectVectorCloseTo(geometry.expressCelestialDirectionInScene([0, 1, 0]), [1, 0, 0]);
		expectVectorCloseTo(geometry.expressCelestialDirectionInScene([0, 0, 1]), [0, 0, -1]);
	});

	it('owns retained construction lookup and selected production source frames', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({cacheAltitudeBinCount: 48});
		const samplePosition = position([15, 0, 0]);

		expect(
			geometry.resolveScatteringCacheConstructionPositionStencil({
				position: samplePosition,
				atmosphereCoordinate: geometry.resolveAtmosphereCoordinate(samplePosition),
			}),
		).toEqual({indices: [24], weights: [1]});

		expectVectorCloseTo(
			geometry.expressPhysicalIncomingRadianceDirection([1, 0, 0]),
			geometry.configuration.directionToSource,
		);

		const physicalW27Y = geometry.expressPhysicalOutgoingScatteringDirection([0, 1, 0]);
		expect(Math.hypot(...physicalW27Y)).toBeCloseTo(1, 12);
		expectVectorCloseTo(
			geometry.expressScatteringCacheDirection({
				position: samplePosition,
				physicalOutgoingDirection: physicalW27Y,
			}),
			[0, 1, 0],
		);
		expect(
			geometry.resolveScatteringCacheDirectionStencil({
				position: samplePosition,
				physicalOutgoingDirection: physicalW27Y,
			}),
		).toEqual(CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil([0, 1, 0]));
	});

	it('retains distinct Fibonacci and W27 frame orientation for geometry-resolved placement', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const physicalOutgoingDirection = geometry.expressPhysicalOutgoingScatteringDirection([0, 1, 0]);

		expect(Math.hypot(...geometry.expressPhysicalIncomingRadianceDirection([0, 1, 0]))).toBeCloseTo(1, 12);
		expectVectorCloseTo(
			geometry.expressScatteringCacheDirection({
				position: position([15, 0, 0]),
				physicalOutgoingDirection,
			}),
			[0, 1, 0],
		);
	});

	it('resolves final-view stencils over the actual Native-48 altitude nodes', /** Called by Jasmine to exercise the named behavior. */ () => {
		const bottomRadiusMeters = 6360000;
		const geometry = createNativeCacheGeometry();
		/**
		 * Called by position at altitude to position at altitude.
		 * @param altitudeMeters - The altitude meters value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const positionAtAltitude = (altitudeMeters) => position([bottomRadiusMeters + altitudeMeters, 0, 0]);
		/**
		 * Called by stencil at altitude to stencil at altitude.
		 *
		 *  @param {number} altitudeMeters - Supplies the resolved altitude.
		 * @returns - The callback result returned to its caller.
		 */
		const stencilAtAltitude = (altitudeMeters) =>
			geometry.resolveScatteringCachePositionStencil({
				position: positionAtAltitude(altitudeMeters),
				atmosphereCoordinate: {altitude: meters(altitudeMeters)},
			});

		NATIVE_48_POSITION_NODES.forEach(
			/**
			 * Called by Array.prototype.forEach to process one collection value.
			 * @param node - The node value accepted by the operation.
			 */ (node) => {
				expect(stencilAtAltitude(node.coordinate.value)).toEqual({indices: [node.index], weights: [1]});
			},
		);

		expect(stencilAtAltitude(-10)).toEqual({indices: [0], weights: [1]});
		expect(stencilAtAltitude(60000)).toEqual({indices: [47], weights: [1]});

		const lowerIndex = 10;
		const upperIndex = lowerIndex + 1;
		const lowerAltitudeMeters = NATIVE_48_POSITION_NODES[lowerIndex].coordinate.value;
		const upperAltitudeMeters = NATIVE_48_POSITION_NODES[upperIndex].coordinate.value;
		const upperWeight = 0.25;
		const interpolatedAltitudeMeters =
			lowerAltitudeMeters + (upperAltitudeMeters - lowerAltitudeMeters) * upperWeight;
		const interpolated = stencilAtAltitude(interpolatedAltitudeMeters);

		expect(interpolated.indices).toEqual([lowerIndex, upperIndex]);
		expect(interpolated.weights[0]).toBeCloseTo(0.75, 12);
		expect(interpolated.weights[1]).toBeCloseTo(0.25, 12);

		const exactNodeIndex = 24;
		const exactNodeAltitudeMeters = NATIVE_48_POSITION_NODES[exactNodeIndex].coordinate.value;
		const nearNodeOffsetMeters = 1e-8;
		const justBelow = stencilAtAltitude(exactNodeAltitudeMeters - nearNodeOffsetMeters);
		const justAbove = stencilAtAltitude(exactNodeAltitudeMeters + nearNodeOffsetMeters);

		expect(justBelow.indices).toEqual([exactNodeIndex - 1, exactNodeIndex]);
		expect(justBelow.weights[0]).toBeGreaterThan(0);
		expect(justAbove.indices).toEqual([exactNodeIndex, exactNodeIndex + 1]);
		expect(justAbove.weights[1]).toBeGreaterThan(0);
	});

	it('keeps former uniform-bin boundaries continuous with the owner domain', /** Called by Jasmine to exercise the named behavior. */ () => {
		const bottomRadiusMeters = 6360000;
		const nativeGeometry = createNativeCacheGeometry();
		const below = nativeGeometry.resolveScatteringCachePositionStencil({
			position: position([bottomRadiusMeters + 1250 - 1e-3, 0, 0]),
			atmosphereCoordinate: {altitude: meters(1250 - 1e-3)},
		});
		const above = nativeGeometry.resolveScatteringCachePositionStencil({
			position: position([bottomRadiusMeters + 1250 + 1e-3, 0, 0]),
			atmosphereCoordinate: {altitude: meters(1250 + 1e-3)},
		});

		expect(below.indices).toEqual([0, 1]);
		expect(above.indices).toEqual([0, 1]);
		expect(above.weights[1] - below.weights[1]).toBeCloseTo(2e-3 / 1875, 12);
	});

	it('normalizes supported physical units at construction', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			bottomRadius: kilometers(0.01),
			topRadius: kilometers(0.02),
			observerHeight: kilometers(0.001),
			cacheBoundaryAltitude: kilometers(0.002),
		});

		expect(geometry.configuration).toEqual(
			jasmine.objectContaining({
				bottomRadius: meters(10),
				topRadius: meters(20),
				observerHeight: meters(1),
				cacheBoundaryAltitude: meters(2),
			}),
		);
	});

	it('creates its geometry-owned shader contribution from live configuration', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createNativeCacheGeometry();
		const contribution = geometry.createShaderContribution();

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
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param block - The block value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (block) => block.id === 'geometry-cache-stencil-types',
		).code;
		const constants = contribution.functions.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param block - The block value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (block) => block.id === 'geometry-constants',
		).code;
		const stencils = contribution.functions.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param block - The block value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (block) => block.id === 'geometry-cache-stencils',
		);
		expect(types).toContain('struct AtmosphereCoordinate');
		expect(types).toContain('float altitudeMeters;');
		expect(types).toContain('ivec2 indices;');
		expect(types).toContain('ivec4 indices;');
		expect(constants).toContain('const float GEOMETRY_BOTTOM_RADIUS_METERS = 6360000.0;');
		expect(constants).toContain('const int GEOMETRY_CACHE_POSITION_COUNT = 48;');
		expect(constants).toContain('GEOMETRY_CACHE_POSITION_NODES_METERS[48]');
		expect(constants).toContain('const vec3 GEOMETRY_CACHE_RADIAL_DIRECTION = vec3(1.0, 0.0, 0.0);');
		expect(stencils.slot).toBe('sampleScatteringCache');
		expect(stencils.code).toContain(
			'AtmosphereCoordinate resolveAtmosphereCoordinate(ViewRay ray, float distanceMeters)',
		);
		expect(stencils.code).toContain(
			'CachePositionStencil resolveScatteringCachePositionStencil(\n\tAtmosphereCoordinate coordinate',
		);
		expect(stencils.code).toContain('CacheDirectionStencil resolveScatteringCacheDirectionStencil(');
		expect(stencils.code).toContain('directionToAtmosphericSource(positionMeters)');
		expect(stencils.code).toContain('uCameraGroundRelativePositionMeters');
		expect(stencils.code).toContain('transverseDistanceSquaredMeters');
		expect(stencils.code).not.toContain('length(positionMeters) - GEOMETRY_BOTTOM_RADIUS_METERS');
		expect(contribution.bindingRequirements).toContain(
			jasmine.objectContaining({
				id: 'geometry.camera-ground-relative-position',
				valueKey: 'geometry.cameraGroundRelativePosition',
				updateFrequency: 'frame',
				required: true,
			}),
		);

		/**
		 * Called by rounded earth scale altitude to rounded earth scale altitude.
		 * @param altitudeMeters - The altitude meters value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const roundedEarthScaleAltitude = (altitudeMeters) =>
			Math.fround(Math.fround(6360000 + Math.fround(altitudeMeters)) - 6360000);
		/**
		 * Called by ground relative altitude to ground relative altitude.
		 * @param altitudeMeters - The altitude meters value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ const groundRelativeAltitude = (altitudeMeters) =>
			Math.fround(Math.fround(2) + Math.fround(altitudeMeters - 2));
		expect(roundedEarthScaleAltitude(1250 - 0.25)).toBe(1250);
		expect(roundedEarthScaleAltitude(1250 + 0.25)).toBe(1250);
		expect(groundRelativeAltitude(1250 - 0.25)).toBe(1249.75);
		expect(groundRelativeAltitude(1250 + 0.25)).toBe(1250.25);
		expect(stencils.code).not.toContain('CACHE_INCIDENT');
	});

	it('can reconstruct shader rays from a model-space Three scene frame', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createNativeCacheGeometry({
			sceneFrame: {
				kind: 'model-space',
			},
		});
		const contribution = geometry.createShaderContribution();
		const constantsBlock = contribution.functions.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param block - The block value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (block) => block.id === 'geometry-constants',
		);

		expect(geometry.configuration.sceneFrame).toEqual({
			kind: 'model-space',
			up: [0, 1, 0],
			right: [1, 0, 0],
			forward: [0, 0, 1],
		});
		expect(constantsBlock.code).toContain('const vec3 GEOMETRY_OBSERVER_UP_DIRECTION = vec3(0.0, 1.0, 0.0);');
		expect(constantsBlock.code).toContain('const vec3 GEOMETRY_OBSERVER_RIGHT_DIRECTION = vec3(1.0, 0.0, 0.0);');
		expect(constantsBlock.code).toContain('const vec3 GEOMETRY_OBSERVER_FORWARD_DIRECTION = vec3(0.0, 0.0, 1.0);');
	});

	it('keeps non-X-up camera defaults and model-space offsets ground-relative', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createNativeCacheGeometry({
			observerUpDirection: [0, 0, 1],
			sceneFrame: {kind: 'model-space'},
		});
		const contribution = geometry.createShaderContribution();
		const cameraWorld = contribution.uniforms.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param uniform - The uniform value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (uniform) => uniform.valueKey === 'geometry.cameraWorldPosition',
		);
		const cameraGroundRelative = contribution.uniforms.find(
			/**
			 * Called by Array.prototype.find to test one collection value for selection.
			 * @param uniform - The uniform value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (uniform) => uniform.valueKey === 'geometry.cameraGroundRelativePosition',
		);
		const mappedCamera = geometry.mapObserverLocalScenePointToModelPosition(scenePosition([3, 4, 6360007]), {
			sceneScale: sceneScale(1),
		});
		const observerLocalGeometry = createNativeCacheGeometry({
			observerUpDirection: [0, 0, 1],
		});
		const observerLocalCamera = observerLocalGeometry.mapObserverLocalScenePointToModelPosition(
			scenePosition([3, 7, 4]),
			{sceneScale: sceneScale(1)},
		);

		expect(cameraWorld.defaultValue).toEqual([0, 0, 6360002]);
		expect(cameraGroundRelative.defaultValue).toEqual([0, 0, 2]);
		expect(geometry.resolveGroundRelativePosition(mappedCamera)).toEqual(position([3, 4, 7]));
		expect(observerLocalGeometry.resolveGroundRelativePosition(observerLocalCamera)).toEqual(position([3, -4, 7]));
	});

	it('creates geometry-owned Three spherical endpoint objects', /** Called by Jasmine to exercise the named behavior. */ () => {
		const endpoints = createGeometry().createThreeEndpointObjects({
			sceneScale: sceneScale(2),
			name: 'test-sphere',
			visualMaterialLighting: 'lambert',
		});
		const visualObject = endpoints.visualObjects[0];
		const raycastObject = endpoints.raycastObjects[0];
		const hits = [];

		raycastObject.updateMatrixWorld(true);
		raycastObject.raycast(
			new THREE.Raycaster(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0), 0, 100),
			hits,
		);

		expect(visualObject instanceof THREE.Mesh).toBeTrue();
		expect(visualObject.geometry.type).toBe('SphereGeometry');
		expect(visualObject.material.type).toBe('MeshLambertMaterial');
		expect(visualObject.position.toArray()).toEqual([0, -5, 0]);
		expect(visualObject.userData).toEqual(
			jasmine.objectContaining({
				algorithm32SceneInput: true,
				algorithm32EndpointRole: 'geometry-ground-visual',
				endpointKind: 'geometry-ground-boundary',
				sceneScale: sceneScale(2),
			}),
		);
		expect(raycastObject.userData).toEqual(
			jasmine.objectContaining({
				algorithm32SceneInput: true,
				algorithm32EndpointRole: 'geometry-ground-exact-raycast',
				endpointKind: 'geometry-ground-boundary',
				sceneScale: sceneScale(2),
			}),
		);
		expect(hits.length).toBe(1);
		expect(hits[0].distance).toBeCloseTo(2, 12);
		expect(endpoints.metadata).toEqual(
			jasmine.objectContaining({
				owner: 'SphericalEarthGeometry',
				sceneFrameKind: 'observer-local',
				radius: sceneDistance(5),
				center: scenePosition([0, -5, 0]),
				shape: 'sphere',
				visualMeshKind: 'sphere',
			}),
		);
	});

	it('can create a local spherical visual patch while exact raycasting owns ground hits', /** Called by Jasmine to exercise the named behavior. */ () => {
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
		raycastObject.raycast(
			new THREE.Raycaster(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0), 0, 100),
			hits,
		);

		expect(visualObject.geometry.type).toBe('BufferGeometry');
		expect(visualObject.position.toArray()).toEqual([0, 0, 0]);
		expect(visualObject.receiveShadow).toBeTrue();
		expect(positions.count).toBe(15);
		expect(positions.getY(7)).toBeCloseTo(0.5, 12);
		expect(visualObject.userData.algorithm32GroundVisualMesh).toEqual(
			jasmine.objectContaining({
				kind: 'local-spherical-patch',
				hitPolicy: 'visual-mesh-not-semantic-hit-authority',
				shadowReceiverPolicy: 'geometry-owned-ground-receives-three-shadow-map',
			}),
		);
		expect(hits.length).toBe(1);
		expect(hits[0].distance).toBeCloseTo(2, 12);
		expect(endpoints.metadata).toEqual(
			jasmine.objectContaining({
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
			}),
		);
	});

	it('centers model-space spherical endpoint objects at the model origin', /** Called by Jasmine to exercise the named behavior. */ () => {
		const endpoints = createGeometry({
			sceneFrame: {
				kind: 'model-space',
			},
		}).createThreeEndpointObjects({
			sceneScale: sceneScale(2),
		});
		const visualObject = endpoints.visualObjects[0];

		expect(visualObject.position.toArray()).toEqual([0, 0, 0]);
		expect(endpoints.metadata).toEqual(
			jasmine.objectContaining({
				sceneFrameKind: 'model-space',
				center: scenePosition([0, 0, 0]),
			}),
		);
	});

	it('maps ground scene offsets through spherical geometry in observer-local frame', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(
			geometry.mapGroundOffsetToScenePoint(scenePosition([1, 0, 2]), {
				sceneScale: sceneScale(2),
			}),
		).toEqual(scenePosition([1, Math.sqrt(25 - 5) - 5, 2]));
	});

	it('maps observer-local scene positions and directions into spherical model space', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const modelSpaceGeometry = createGeometry({
			observerUpDirection: [0, 1, 0],
			sceneFrame: {
				kind: 'model-space',
			},
		});

		expect(
			geometry.mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
				sceneScale: sceneScale(2),
			}),
		).toEqual(position([14, 2, -6]));
		expect(geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])).toEqual([1, 0, 0]);
		expect(
			modelSpaceGeometry.mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
				sceneScale: sceneScale(2),
			}),
		).toEqual(position([2, 4, 6]));
		expect(modelSpaceGeometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])).toEqual([0, 1, 0]);
	});

	it('accepts only the canonical tuple shape for core directions', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.mapObserverLocalSceneDirectionToModelDirection({
					coordinates: [0, 1, 0],
				}),
		).toThrowError(/three-component vector/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.mapObserverLocalSceneDirectionToModelDirection({
					x: 0,
					y: 1,
					z: 0,
				}),
		).toThrowError(/three-component vector/);
	});

	it('maps ground scene offsets through spherical geometry in model-space frame', /** Called by Jasmine to exercise the named behavior. */ () => {
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

	it('projects scene points to the local spherical ground receiver', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry({
			observerUpDirection: [0, 1, 0],
			sceneFrame: {
				kind: 'model-space',
			},
		});

		expect(
			geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 8, 0]), [0, -1, 0], {
				sceneScale: sceneScale(2),
			}),
		).toEqual(scenePosition([0, 5, 0]));
		expect(
			geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 4.99999, 0]), [0, -1, 0], {
				sceneScale: sceneScale(2),
				surfaceTolerance: sceneDistance(0.0001),
			}),
		).toEqual(scenePosition([0, 5, 0]));
		expect(
			geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 6, 0]), [0, 1, 0], {
				sceneScale: sceneScale(2),
			}),
		).toEqual(scenePosition([0, 5, 0]));
	});

	it('resolves a geometry-owned scene-depth cap from horizon distance', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const modelSpaceGeometry = createGeometry({
			sceneFrame: {
				kind: 'model-space',
			},
		});

		expect(geometry.resolveSceneDepthMax().value).toBeCloseTo(Math.sqrt(21), 12);
		expect(
			modelSpaceGeometry.resolveSceneDepthMax({
				cameraPosition: position([12, 0, 0]),
			}).value,
		).toBeCloseTo(Math.sqrt(44), 12);
		expect(
			modelSpaceGeometry.resolveSceneDepthMax({
				camera: {
					position: {
						x: 12,
						y: 0,
						z: 0,
					},
				},
				sceneScale: sceneScale(1),
			}).value,
		).toBeCloseTo(Math.sqrt(44), 12);
		expect(
			modelSpaceGeometry.resolveSceneDepthMax({
				cameraPosition: position([12, 0, 0]),
				endpointPositions: [position([12, 0, 9])],
			}).value,
		).toBeCloseTo(9, 12);
		expect(
			geometry.resolveSceneDepthMax({
				cameraScenePosition: scenePosition([0, 1, 0]),
				endpointScenePositions: [scenePosition([10, 1, 0])],
				sceneScale: sceneScale(1),
			}).value,
		).toBeCloseTo(10, 12);
		expect(
			modelSpaceGeometry.resolveSceneDepthMax({
				camera: {
					position: {
						x: 6,
						y: 0,
						z: 0,
					},
				},
				endpointScenePositions: [scenePosition([6, 0, 5])],
				sceneScale: sceneScale(2),
			}).value,
		).toBeCloseTo(10, 12);
	});

	it('resolves view rays against atmosphere and ground boundaries', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(
			geometry.resolveViewRaySegment({
				origin: position([11, 0, 0]),
				direction: [1, 0, 0],
			}).endDistance.value,
		).toBeCloseTo(9, 12);
		expect(
			geometry.resolveViewRaySegment({
				origin: position([11, 0, 0]),
				direction: [-1, 0, 0],
			}).endDistance.value,
		).toBeCloseTo(1, 12);
		expect(
			geometry.resolveViewRaySegment({
				origin: position([11, 0, 0]),
				direction: [-1, 0, 0],
				groundBoundaryMode: 'scene-hit-owned',
			}).endDistance.value,
		).toBeCloseTo(31, 12);
		expect(
			geometry.resolveViewRaySegment({
				origin: position([11, 0, 0]),
				direction: [1, 0, 0],
				endDistance: meters(4),
			}).endDistance,
		).toEqual(meters(4));
	});

	it('resolves typed spherical ground hits and misses', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const groundIntersection = geometry.resolveGroundIntersection({
			origin: position([13, 0, 0]),
			direction: [-1, 0, 0],
		});

		expect(groundIntersection).toEqual({
			position: position([10, 0, 0]),
			normal: [1, 0, 0],
			distance: meters(3),
		});
		expect(groundIntersection.position.units).toBe('meters');
		expect(groundIntersection.distance.units).toBe('meters');
		expect(
			geometry.resolveGroundIntersection({
				origin: position([11, 0, 0]),
				direction: [0, 1, 0],
			}),
		).toBeNull();
	});

	it('retains exact inward boundary hits while outward rays remain open', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const groundOrigin = position([10, 0, 0]);
		const inward = [-1, 0, 0];
		const outward = [1, 0, 0];

		expect(
			geometry.resolveGroundIntersection({
				origin: groundOrigin,
				direction: inward,
			}),
		).toEqual({
			position: groundOrigin,
			normal: [1, 0, 0],
			distance: meters(0),
		});
		expect(geometry.distanceToGroundBoundary(groundOrigin, inward)).toBe(0);
		expect(
			geometry.resolveViewRaySegment({
				origin: groundOrigin,
				direction: inward,
			}).endDistance,
		).toEqual(meters(0));
		expect(
			geometry.resolveAtmospherePath({
				ray: {origin: groundOrigin, direction: inward},
			}).blockedByGround,
		).toBeTrue();
		expect(
			geometry.resolveCacheBuildRay({
				altitude: meters(0),
				incomingDirection: inward,
			}),
		).toBeNull();
		expect(
			geometry.resolveViewRaySegment({
				origin: groundOrigin,
				direction: inward,
				groundBoundaryMode: 'scene-hit-owned',
			}).endDistance,
		).toEqual(meters(30));

		expect(
			geometry.resolveGroundIntersection({
				origin: groundOrigin,
				direction: outward,
			}),
		).toBeNull();
		expect(geometry.distanceToGroundBoundary(groundOrigin, outward)).toBeNull();
		expect(
			geometry.resolveViewRaySegment({
				origin: groundOrigin,
				direction: outward,
			}).endDistance,
		).toEqual(meters(10));
	});

	it('clamps boundary-scale binary64 roundoff to a zero-distance hit', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const roundoffOrigin = position([10 - Number.EPSILON * 10, 0, 0]);

		expect(geometry.distanceToGroundBoundary(roundoffOrigin, [-1, 0, 0])).toBe(0);
		expect(
			geometry.resolveGroundIntersection({
				origin: roundoffOrigin,
				direction: [-1, 0, 0],
			}).distance,
		).toEqual(meters(0));
	});

	it('resolves atmosphere coordinates and source-relative packets', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		expect(geometry.resolveAtmosphereCoordinate(position([12, 0, 0]))).toEqual({
			altitude: meters(2),
		});
		const sourceRelativePosition = geometry.resolveSourceRelativePosition({position: position([12, 0, 0])});

		expectVectorCloseTo(sourceRelativePosition.directionToSource, geometry.configuration.directionToSource);
		expectVectorCloseTo(
			sourceRelativePosition.directionFromSource,
			geometry.configuration.directionToSource.map((component) => -component),
		);
		expect(sourceRelativePosition.distanceFromSource).toBeNull();
	});

	it('builds endpoint/trapezoid atmosphere path samples', /** Called by Jasmine to exercise the named behavior. */ () => {
		const path = createGeometry().resolveAtmospherePath({
			ray: {
				origin: position([11, 0, 0]),
				direction: [1, 0, 0],
			},
			sampleCount: 2,
		});

		expect(path.length.value).toBeCloseTo(9, 12);
		expect(path.samples.length).toBe(3);
		expect(
			path.samples.map(
				/**
				 * Called by Array.prototype.map to transform one collection value.
				 * @param sample - The sample value accepted by the operation.
				 * @returns - The callback result returned to its caller.
				 */ (sample) => sample.measure,
			),
		).toEqual([meters(2.25), meters(4.5), meters(2.25)]);
		expect(path.samples[0].atmosphereCoordinate.altitude.value).toBeCloseTo(1, 12);
		expect(path.samples[2].atmosphereCoordinate.altitude.value).toBeCloseTo(10, 12);
	});

	it('clips source paths by source limit or reports ground blocking', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const clipped = geometry.resolveAtmospherePath({
			ray: {
				origin: position([11, 0, 0]),
				direction: [1, 0, 0],
			},
			sourcePathLimit: {maxDistance: meters(4)},
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

	it('resolves distant cache-construction rays', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const viewRay = geometry.resolveCacheBuildRay({
			altitude: meters(2),
			incomingDirection: [1, 0, 0],
		});
		const blockedRay = geometry.resolveCacheBuildRay({
			altitude: meters(2),
			incomingDirection: [-1, 0, 0],
		});

		expect(viewRay.endDistance.value).toBeCloseTo(8, 12);
		expect(blockedRay).toBeNull();
	});

	it('defaults only omitted endpoint options and rejects explicit invalid values', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();
		const defaults = geometry.createThreeEndpointObjects({
			shadow: null,
		});

		expect(defaults.visualObjects[0].material.type).toBe('MeshBasicMaterial');
		expect(defaults.metadata.shadow).toBeNull();

		for (const visualMaterialDisplayRgba of [null, {}, [1, 2], [1, 2, 3, 4, 5], [1, 2, Number.NaN]]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({visualMaterialDisplayRgba}),
			).toThrowError(/visualMaterialDisplayRgba/u);
		}

		for (const visualMaterialLighting of [null, 'phong', 1]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({visualMaterialLighting}),
			).toThrowError(/visualMaterialLighting/u);
		}

		for (const shadow of [
			true,
			{enabled: null},
			{enabled: 'true'},
			{enabled: true, receiveShadow: null},
			{enabled: true, shadowPolicy: null},
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({shadow}),
			).toThrowError(/shadow/u);
		}

		for (const request of [
			{widthSegments: null},
			{widthSegments: 1.5},
			{heightSegments: null},
			{heightSegments: 2.5},
			{sceneScale: null},
			{visualMaterialColor: null},
			{spectralReferenceId: null},
			{name: null},
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects(request),
			).toThrow();
		}

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({origin: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({direction: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({groundBoundaryMode: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveViewRaySegment({endDistance: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([11, 0, 0]), direction: [1, 0, 0]},
					startDistance: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([11, 0, 0]), direction: [1, 0, 0]},
					sourcePathLimit: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([11, 0, 0]), direction: [1, 0, 0]},
					sourcePathLimit: {maxDistance: null},
				}),
		).not.toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.resolveAtmospherePath({
					ray: {origin: position([11, 0, 0]), direction: [1, 0, 0]},
					sampleCount: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.mapGroundOffsetToScenePoint(scenePosition([0, 0, 0]), {
					heightAboveGround: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 2, 0]), [0, -1, 0], {
					surfaceTolerance: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				geometry.projectScenePointToGroundAlongDirection(scenePosition([0, 2, 0]), [0, -1, 0], {
					maxLocalDistance: null,
				}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({cameraPosition: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({minimum: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({endpointExtent: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({endpointPosition: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({endpointPositions: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({endpointSceneExtent: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({endpointScenePosition: null}),
		).toThrow();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => geometry.resolveSceneDepthMax({endpointScenePositions: null}),
		).toThrow();
	});

	it('rejects malformed local-patch policies instead of selecting a fallback mesh', /** Called by Jasmine to exercise the named behavior. */ () => {
		const geometry = createGeometry();

		for (const groundVisualMesh of [null, 1, true, []]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({groundVisualMesh}),
			).toThrowError(/groundVisualMesh/u);
		}

		for (const groundVisualMesh of [
			{kind: null},
			{kind: 'local-spherical-patch', xExtent: null},
			{kind: 'local-spherical-patch', zMin: null},
			{kind: 'local-spherical-patch', zMax: sceneDistance(Number.NaN)},
			{kind: 'local-spherical-patch', surfaceLift: null},
		]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => geometry.createThreeEndpointObjects({groundVisualMesh}),
			).toThrowError(/groundVisualMesh/u);
		}
	});

	it('fails loudly for invalid geometry inputs', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => new SphericalEarthGeometry(),
		).toThrowError(/configuration/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry({topRadius: meters(10)}),
		).toThrowError(/top above bottom/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry({observerUpDirection: [0, 0, 0]}),
		).toThrowError(/non-zero/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => createGeometry().resolveViewRaySegment({groundBoundaryMode: 'other'}),
		).toThrowError(/groundBoundaryMode/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				createGeometry().createThreeEndpointObjects({
					groundVisualMesh: {
						kind: 'other',
					},
				}),
		).toThrowError(/groundVisualMesh/);
	});
});

/**
 * Called by this module to create geometry.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createGeometry(overrides = {}) {
	const {observation = createObservation(), ...geometryOverrides} = overrides;
	const geometry = new SphericalEarthGeometry({
		bottomRadius: meters(10),
		topRadius: meters(20),
		observerHeight: meters(1),
		observerUpDirection: [1, 0, 0],
		cacheAltitudeBinCount: 2,
		cacheBoundaryAltitude: meters(2),
		sourceTransmittanceIntervalCount: 2,
		...geometryOverrides,
	});
	geometry.configureLightSource({
		lightSource: {
			geometryPlacementKind: 'distant-direction',
			configureGeometryPlacement() {},
		},
		observation,
	});

	return geometry;
}

/** Create the fixed observation used by spherical geometry tests. */
function createObservation() {
	return {
		instant: '2026-03-20T12:00:00.000Z',
		location: {
			latitude: {value: 0, units: 'degrees'},
			longitude: {value: -90, units: 'degrees'},
		},
	};
}

/** Expect two vectors to agree within binary64 test precision. */
function expectVectorCloseTo(actual, expected) {
	expect(actual.length).toBe(expected.length);
	for (let index = 0; index < expected.length; index += 1) {
		expect(actual[index]).toBeCloseTo(expected[index], 12);
	}
}

/**
 * Called by this module to create native cache geometry.
 * @param overrides - The overrides value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createNativeCacheGeometry(overrides = {}) {
	return createGeometry({
		bottomRadius: meters(6360000),
		topRadius: meters(6420000),
		observerHeight: meters(2),
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: meters(0),
		...overrides,
	});
}

/**
 * Called by this module to meters.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function meters(value) {
	return {value, units: 'meters'};
}

/**
 * Called by this module to kilometers.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function kilometers(value) {
	return {value, units: 'kilometers'};
}

/**
 * Called by this module to position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function position(coordinates) {
	return {coordinates, units: 'meters'};
}

/**
 * Called by this module to scene distance.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function sceneDistance(value) {
	return {value, units: 'scene-units'};
}

/**
 * Called by this module to scene position.
 * @param coordinates - The coordinates value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function scenePosition(coordinates) {
	return {coordinates, units: 'scene-units'};
}

/**
 * Called by this module to scene scale.
 * @param value - The value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function sceneScale(value) {
	return {value, units: 'meters-per-scene-unit'};
}
