import * as THREE from 'three';

import { CachePassAssembler } from '../../caches/gpu/CachePassAssembler.js';
import {
	createCacheBuildModule,
} from '../../caches/gpu/cacheBuildContracts.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
} from '../../domains/consts.js';
import { FlatEarthGeometry } from '../FlatEarthGeometry.js';

describe('FlatEarthGeometry', () => {
	it('describes flat geometry and frame facts', () => {
		const geometry = createGeometry();

		expect(geometry.id).toBe('flat-earth-geometry');
		expect(geometry.describe()).toEqual(jasmine.objectContaining({
			kind: 'flat-earth-geometry',
			observerPosition: position([0, 0, 2]),
			sourcePosition: position([10, 0, 5]),
			topAltitude: meters(12),
			cacheRadialMaximum: meters(100),
			sceneSkyRayLimit: meters(100),
			hasObserverCenteredDome: false,
		}));
		expect(geometry.getFrameDescriptor()).toEqual({
			kind: 'observer-local-flat-frame',
			observerLocalSceneFrame: {
				up: [0, 0, 1],
				right: [1, 0, 0],
				forward: [0, -1, 0],
			},
		});
	});

	it('normalizes supported physical units at construction', () => {
		const geometry = createGeometry({
			observerPosition: kilometerPosition([0, 0, 0.002]),
			sourcePosition: kilometerPosition([0.01, 0, 0.005]),
			topAltitude: kilometers(0.012),
			cacheRadialMaximum: kilometers(0.1),
			sceneSkyRayLimit: kilometers(0.1),
		});

		expect(geometry.describe()).toEqual(jasmine.objectContaining({
			observerPosition: position([0, 0, 2]),
			sourcePosition: position([10, 0, 5]),
			topAltitude: meters(12),
			cacheRadialMaximum: meters(100),
			sceneSkyRayLimit: meters(100),
		}));
	});

	it('creates its geometry-owned shader contribution', () => {
		const contribution = createGeometry().createShaderContribution({
			descriptor: createDescriptor(),
		});

		expect(contribution.id).toBe('geometry-flat-earth');
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
	});

	it('resolves view rays against flat top, ground, and safe cap boundaries', () => {
		const geometry = createGeometry();

		expect(geometry.resolveViewRaySegment({ direction: [0, 0, 1] }).endDistance).toEqual(meters(10));
		expect(geometry.resolveViewRaySegment({ direction: [0, 0, -1] }).endDistance).toEqual(meters(2));
		expect(geometry.resolveViewRaySegment({ direction: [1, 0, 0] }).endDistance).toEqual(meters(100));
		expect(geometry.runtimeDiagnostics[0]).toEqual(jasmine.objectContaining({
			id: 'flat-ray-parallel-no-boundary-hit',
			severity: 'warning',
		}));
		expect(geometry.resolveViewRaySegment({
			direction: [0, 0, 1],
			endDistance: meters(4),
		}).endDistance).toEqual(meters(4));
	});

	it('uses top altitude as the finite no-cap horizontal view policy', () => {
		const geometry = createGeometry({
			sceneSkyRayLimit: null,
		});

		expect(geometry.resolveViewRaySegment({
			direction: [1, 0, 0],
		}).endDistance).toEqual(meters(12));
		expect(geometry.runtimeDiagnostics[0]).toEqual(jasmine.objectContaining({
			id: 'flat-ray-parallel-default-top-cap',
			severity: 'warning',
		}));
	});

	it('resolves atmosphere coordinates and records domain diagnostics', () => {
		const geometry = createGeometry();

		expect(geometry.resolveAtmosphereCoordinate(position([1, 2, 3]))).toEqual({
			altitude: meters(3),
			rho: meters(Math.hypot(9, 2)),
		});
		expect(geometry.resolveAtmosphereCoordinate(position([1, 2, 20]))).toEqual({
			altitude: meters(20),
			rho: meters(Math.hypot(9, 2)),
		});
		expect(geometry.runtimeDiagnostics[0]).toEqual(jasmine.objectContaining({
			id: 'flat-atmosphere-coordinate-out-of-domain',
			severity: 'warning',
		}));
	});

	it('builds flat atmosphere path samples and retains ground-bound segments', () => {
		const geometry = createGeometry();
		const path = geometry.resolveAtmospherePath({
			ray: {
				origin: position([0, 0, 2]),
				direction: [0, 0, 1],
			},
			sampleCount: 2,
		});
		const clipped = geometry.resolveAtmospherePath({
			ray: {
				origin: position([0, 0, 2]),
				direction: [0, 0, 1],
			},
			sourcePathLimit: { maxDistance: meters(3) },
			sampleCount: 2,
		});
		const blocked = geometry.resolveAtmospherePath({
			ray: {
				origin: position([0, 0, 2]),
				direction: [0, 0, -1],
			},
			sourcePathLimit: { maxDistance: meters(10) },
			sampleCount: 2,
		});

		expect(path.length).toEqual(meters(10));
		expect(path.samples.map((sample) => sample.measure)).toEqual([meters(2.5), meters(5), meters(2.5)]);
		expect(clipped.length).toEqual(meters(3));
		expect(blocked.blockedByGround).toBeTrue();
		expect(blocked.length).toEqual(meters(2));
		expect(blocked.samples.map((sample) => sample.measure))
			.toEqual([meters(0.5), meters(1), meters(0.5)]);
		expect(blocked.metadata).toEqual(jasmine.objectContaining({
			boundaryKind: 'ground',
			terminatedByGround: true,
			groundOccludedRequestedEndpoint: true,
			observerDomeApplied: false,
		}));
	});

	it('resolves local source-relative facts', () => {
		const geometry = createGeometry();
		const sourceRelativePosition = geometry.resolveSourceRelativePosition({
			position: position([0, 0, 2]),
		});

		expect(sourceRelativePosition.distanceFromSource.value).toBeCloseTo(Math.sqrt(109), 12);
		expect(sourceRelativePosition.directionToSource[0]).toBeCloseTo(10 / Math.sqrt(109), 12);
		expect(sourceRelativePosition.directionToSource[2]).toBeCloseTo(3 / Math.sqrt(109), 12);
		expect(sourceRelativePosition.radialDistanceFromSourceSubpoint).toEqual(meters(10));
		expect(sourceRelativePosition.altitude).toEqual(meters(2));
	});

	it('owns the selected flattened z-major, rho-minor position domain', () => {
		const domain = createGeometry().createLocalSunCachePositionDomain();

		expect(domain.zNodes).toEqual([
			meters(0),
			meters(12 * 1 / 400),
			meters(12 * 1 / 200),
			meters(12 * 1 / 100),
			meters(12 * 3 / 200),
			meters(12 * 3 / 100),
			meters(12 * 1 / 20),
			meters(12 * 7 / 100),
			meters(12 * 1 / 10),
			meters(12 * 7 / 50),
			meters(12 * 1 / 5),
			meters(12 * 1 / 4),
			meters(12 * 3 / 8),
			meters(12 * 1 / 2),
			meters(12 * 5 / 8),
			meters(12 * 3 / 4),
			meters(12 * 7 / 8),
			meters(12 * 99 / 100),
			meters(12),
		]);
		expect(domain.rhoNodes).toEqual([
			meters(0),
			meters(100 * 1 / 96),
			meters(100 * 1 / 48),
			meters(100 * 1 / 24),
			meters(100 * 1 / 12),
			meters(100 * 1 / 8),
			meters(100 * 1 / 4),
			meters(100 * 3 / 8),
			meters(100 * 1 / 2),
			meters(100 * 5 / 8),
			meters(100 * 3 / 4),
			meters(100 * 7 / 8),
			meters(100 * 15 / 16),
			meters(100 * 47 / 48),
			meters(100),
		]);
		expect(domain.count).toBe(285);
		expect(domain.nodes[21]).toEqual(jasmine.objectContaining({
			index: 21,
			metadata: jasmine.objectContaining({
				position: position([35, 0, 12 * 1 / 400]),
				z: meters(12 * 1 / 400),
				rho: meters(25),
				zIndex: 1,
				rhoIndex: 6,
			}),
		}));
	});

	it('keeps count overrides uniform and explicit cache nodes authoritative', () => {
		const generated =
			createGeometry().createLocalSunCachePositionDomain({
				zCount: 3,
				rhoCount: 4,
			});
		expect(generated.zNodes).toEqual([
			meters(0),
			meters(6),
			meters(12),
		]);
		expect(generated.rhoNodes).toEqual([
			meters(0),
			meters(100 / 3),
			meters(200 / 3),
			meters(100),
		]);

		const explicit =
			createGeometry({
				cacheAltitudeNodes: [
					meters(0),
					meters(2),
					meters(12),
				],
				cacheRadialNodes: [
					meters(0),
					meters(10),
					meters(80),
					meters(100),
				],
			}).createLocalSunCachePositionDomain({
				zCount: 3,
				rhoCount: 4,
			});
		expect(explicit.zNodes).toEqual([
			meters(0),
			meters(2),
			meters(12),
		]);
		expect(explicit.rhoNodes).toEqual([
			meters(0),
			meters(10),
			meters(80),
			meters(100),
		]);
	});

	it('uses the same bilinear z/rho reconstruction for view and construction', () => {
		const geometry = createGeometry({
			cacheAltitudeNodes: [meters(0), meters(6), meters(12)],
			cacheRadialNodes: [meters(0), meters(50), meters(100)],
		});
		const samplePosition = position([-15, 0, 3]);
		const atmosphereCoordinate =
			geometry.resolveAtmosphereCoordinate(samplePosition);

		expect(geometry.resolveScatteringCachePositionStencil({
			position: samplePosition,
			atmosphereCoordinate,
		})).toEqual({
			indices: [0, 1, 3, 4],
			weights: [0.25, 0.25, 0.25, 0.25],
		});
		expect(geometry.resolveScatteringCacheConstructionPositionStencil({
			position: samplePosition,
			atmosphereCoordinate,
		})).toEqual({
			indices: [0, 1, 3, 4],
			weights: [0.25, 0.25, 0.25, 0.25],
		});
	});

	it('uses a position-varying radial frame with deterministic rho-zero behavior', () => {
		const geometry = createGeometry();
		const radialPosition = position([20, 0, 2]);
		const centerPosition = position([10, 0, 2]);

		expect(geometry.expressScatteringCacheDirection({
			position: radialPosition,
			physicalOutgoingDirection: [1, 0, 0],
		})).toEqual([1, 0, 0]);
		expect(geometry.resolveScatteringCacheDirectionStencil({
			position: radialPosition,
			physicalOutgoingDirection: [1, 0, 0],
		})).toEqual({
			indices: [364],
			weights: [1],
		});
		expect(geometry.resolveScatteringCacheDirectionStencil({
			position: centerPosition,
			physicalOutgoingDirection: [1, 0, 0],
		})).toEqual({
			indices: [364],
			weights: [1],
		});
		expect(geometry.expressPhysicalScatteringCacheDirection({
			position: centerPosition,
			cacheDirection: [1, 0, 0],
		})).toEqual([1, 0, 0]);
	});

	it('keeps reusable cache axes independent of observer and view limits', () => {
		const baseline = createGeometry();
		const changedView = createGeometry({
			observerPosition: position([700, -300, 40]),
			sceneSkyRayLimit: meters(1000),
		});

		expect(
			changedView.createLocalSunCachePositionDomain()
				.descriptor.contentHash,
		).toBe(
			baseline.createLocalSunCachePositionDomain()
				.descriptor.contentHash,
		);
		expect(changedView.describe()).toEqual(jasmine.objectContaining({
			cacheRadialMaximum: meters(100),
			cacheRadialFallbackDirection: [1, 0, 0],
		}));
	});

	it('retains ground construction segments and excludes the observer dome', () => {
		const geometry = createGeometry({
			observerCenteredDome: {
				apexAltitude: meters(5),
				maxObserverViewRayExtent: meters(3),
			},
		});
		const hit = geometry.resolveGroundIntersection({
			origin: position([1, 2, 3]),
			direction: [0, 0, -1],
		});
		const buildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-upward',
			coordinates: [0, 0],
			altitude: meters(2),
			rho: meters(10),
			incomingDirection: [0, 0, 1],
			metadata: {
				position: position([0, 0, 2]),
			},
		});

		expect(hit).toEqual({
			position: position([1, 2, 0]),
			normal: [0, 0, 1],
			distance: meters(3),
		});
		expect(geometry.resolveViewRaySegment({
			direction: [0, 0, 1],
		}).endDistance).toEqual(meters(3));
		expect(buildRay.endDistance).toEqual(meters(10));
		expect(buildRay.metadata).toEqual({
			boundaryKind: 'top-atmosphere',
			terminatedByGround: false,
			observerDomeApplied: false,
		});
		const groundBuildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-downward',
			coordinates: [0, 0],
			altitude: meters(2),
			rho: meters(10),
			incomingDirection: [0, 0, -1],
			metadata: {
				position: position([0, 0, 2]),
			},
		});
		expect(groundBuildRay.endDistance).toEqual(meters(2));
		expect(groundBuildRay.metadata).toEqual(jasmine.objectContaining({
			boundaryKind: 'ground',
			terminatedByGround: true,
		}));
	});

	it('continues inward from the top boundary instead of selecting a zero-length top exit', () => {
		const geometry = createGeometry();
		const inwardBuildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-top-inward',
			coordinates: [0, 0],
			altitude: meters(12),
			rho: meters(0),
			incomingDirection: [0, 0, -1],
			metadata: {
				position: position([10, 0, 12]),
			},
		});
		const outwardBuildRay = geometry.resolveCacheBuildRay({
			coordinateKey: 'test-top-outward',
			coordinates: [0, 0],
			altitude: meters(12),
			rho: meters(0),
			incomingDirection: [0, 0, 1],
			metadata: {
				position: position([10, 0, 12]),
			},
		});

		expect(inwardBuildRay.endDistance).toEqual(meters(12));
		expect(inwardBuildRay.metadata).toEqual(jasmine.objectContaining({
			boundaryKind: 'ground',
			terminatedByGround: true,
		}));
		expect(outwardBuildRay.endDistance).toEqual(meters(0));
		expect(outwardBuildRay.metadata).toEqual(jasmine.objectContaining({
			boundaryKind: 'top-atmosphere',
			terminatedByGround: false,
		}));
	});

	it('assembles a finite local-source path clipped by the top boundary', () => {
		const geometry = createGeometry();
		const domains = createCacheConstructionDomains(geometry);
		const geometryModule = geometry.createCacheModule(
			/** @type {CacheBuildContext} */ ({
				kind: 'primary-j1',
				domains,
			}),
		);
		const consumer = createCacheBuildModule({
			id: 'flat-source-path-observer',
			owner: 'cache',
			provides: ['test.flatSourcePath'],
			requires: ['geometry.sourcePath'],
			blocks: [{
				id: 'flat-source-path-observer-main',
				phase: 'main',
				order: 0,
				source: `a32CacheOutput = cacheSourcePathDistance(
	vec3(10.0, 0.0, 2.0),
	vec3(0.0, 0.0, 1.0)
);`,
			}],
			bindings: [],
		});
		const assembled = new CachePassAssembler().assemble({
			id: 'flat-source-path-assembly',
			kind: 'primary-j1',
			order: 0,
			inputs: [],
			output: 'j1',
			modules: [consumer, geometryModule],
		}, {
			id: 'j1',
			storage: {
				format: 'R32F',
				width: domains.outgoingDirectionCount,
				height: domains.positionCount,
				layers: 15,
			},
			descriptor: {
				contentHash: 'flat-source-path-output',
			},
		});

		expect(assembled.bindings).toContain(jasmine.objectContaining({
			spec: jasmine.objectContaining({
				name: 'uCacheGeometrySourcePosition',
			}),
			value: position([10, 0, 5]),
		}));
		expect(assembled.source).toContain(
			'float cacheSourcePathDistance(vec3 positionMeters, vec3 direction)',
		);
		expect(assembled.source).toContain(
			'? min(sourceDistanceMeters, topDistanceMeters)',
		);
		expect(assembled.source.indexOf('cacheTopBoundaryDistance'))
			.toBeLessThan(assembled.source.indexOf('cacheSourcePathDistance'));
	});

	it('packs transport through selected W3, position, and spectral owners', () => {
		const geometry = createGeometry();
		const fullDomains = createCacheConstructionDomains(geometry, {
			zCount: 3,
			rhoCount: 2,
		});
		const positionNode = fullDomains.positionNodes[2];
		const domains = /** @type {CacheConstructionDomains} */ ({
			...fullDomains,
			positionNodes: [positionNode],
			spectralChannelCount: 2,
		});
		const atmosphere =
			/** @type {Pick<AtmosphereModel, "sampleMedium">} */ ({
				sampleMedium() {
					return {
						extinction: {
							values: [0, 0],
						},
					};
				},
			});
		const data = geometry.createTransportData({
			atmosphere,
			domains,
			intervalCount: 2,
		});
		const activeTaps = [];

		expect(data.coefficients.shape[2]).toBe(2);
		expect(data.coefficients.values.length).toBe(
			data.tapCount
				* domains.positionNodes.length
				* domains.incomingDirectionCount
				* domains.spectralChannelCount,
		);
		for (let tapIndex = 0; tapIndex < data.tapCount; tapIndex += 1) {
			const sourceOffset = tapIndex * 3;
			if (data.sources.values[sourceOffset + 2] === 1) {
				activeTaps.push({
					directionIndex:
						data.sources.values[sourceOffset],
					positionIndex:
						data.sources.values[sourceOffset + 1],
					coefficient:
						data.coefficients.values[tapIndex],
				});
			}
		}

		expect(activeTaps.length).toBe(2);
		expect(activeTaps.every((tap) =>
			tap.directionIndex >= 0
			&& tap.directionIndex
				< CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.directionCount))
			.toBeTrue();
		expect(activeTaps.map((tap) => tap.positionIndex).sort())
			.toEqual([2, 4]);
		expect(activeTaps.find((tap) => tap.positionIndex === 2).coefficient)
			.toBeCloseTo(3, 6);
		expect(activeTaps.find((tap) => tap.positionIndex === 4).coefficient)
			.toBeCloseTo(3, 6);

		const midpoint = position([10, 0, 9]);
		const atmosphereCoordinate =
			geometry.resolveAtmosphereCoordinate(midpoint);
		expect(geometry.resolveScatteringCacheConstructionPositionStencil({
			position: midpoint,
			atmosphereCoordinate,
			positionAxes: domains,
		})).toEqual({
			indices: [2, 4],
			weights: [0.5, 0.5],
		});
		expect(geometry.resolveScatteringCachePositionStencil({
			position: midpoint,
			atmosphereCoordinate,
			positionAxes: domains,
		})).toEqual({
			indices: [2, 4],
			weights: [0.5, 0.5],
		});
	});

	it('maps observer-local scene positions and directions', () => {
		const geometry = createGeometry();

		expect(geometry.mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
			sceneScale: sceneScale(2),
		})).toEqual(position([2, -6, 4]));
		expect(geometry.mapObserverLocalSceneDirectionToModelDirection([0, 1, 0])).toEqual([0, -0, 1]);
		expect(geometry.mapModelPositionToObserverLocalScenePoint(position([2, -6, 4]), {
			sceneScale: sceneScale(2),
		})).toEqual(scenePosition([1, 2, 3]));
		expect(geometry.mapGroundOffsetToScenePoint(scenePosition([4, 0, -5]), {
			heightAboveGround: sceneDistance(6),
		})).toEqual(scenePosition([4, 6, -5]));
		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([2, 4, -3]), [0, -1, 0]))
			.toEqual(scenePosition([2, 0, -3]));
		expect(geometry.projectScenePointToGroundAlongDirection(scenePosition([2, 4, -3]), [1, 0, 0]))
			.toEqual(scenePosition([2, 0, -3]));
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

	it('creates geometry-owned Three flat endpoint objects', () => {
		const endpoints = createGeometry().createThreeEndpointObjects({
			sceneScale: sceneScale(2),
			groundExtent: meters(40),
			name: 'test-flat',
			visualMaterialDisplayRgba: [10, 20, 30, 128],
			shadow: {
				enabled: true,
				shadowPolicy: 'test-ground-shadow-policy',
			},
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
		expect(visualObject.geometry.type).toBe('PlaneGeometry');
		expect(visualObject.geometry.parameters.width).toBe(20);
		expect(visualObject.geometry.parameters.height).toBe(20);
		expect(visualObject.rotation.x).toBeCloseTo(-Math.PI / 2, 12);
		expect(visualObject.position.toArray()).toEqual([0, 0, -0]);
		expect(visualObject.material.transparent).toBeTrue();
		expect(visualObject.material.opacity).toBeCloseTo(128 / 255, 12);
		expect(visualObject.receiveShadow).toBeTrue();
		expect(visualObject.userData).toEqual(jasmine.objectContaining({
			algorithm32SceneInput: true,
			algorithm32EndpointRole: 'geometry-ground-visual',
			endpointKind: 'geometry-ground-boundary',
			sceneScale: sceneScale(2),
			shadowPolicy: 'test-ground-shadow-policy',
			shadowReceiverPolicy: 'geometry-owned-ground-receives-three-shadow-map',
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
			owner: 'FlatEarthGeometry',
			groundPlane: 'z-equals-zero',
			groundExtent: meters(40),
			width: sceneDistance(20),
			depth: sceneDistance(20),
			center: scenePosition([0, 0, -0]),
			shadow: jasmine.objectContaining({
				enabled: true,
				receiveShadow: true,
				shadowPolicy: 'test-ground-shadow-policy',
			}),
		}));
	});

	it('resolves a geometry-owned scene-depth cap from flat endpoint extent', () => {
		const geometry = createGeometry();

		expect(geometry.resolveSceneDepthMax().value).toBeCloseTo(Math.hypot(10000, 10000, 2), 12);
		expect(geometry.resolveSceneDepthMax({
			groundExtent: meters(40),
		}).value).toBeCloseTo(Math.hypot(20, 20, 2), 12,
		);
		expect(geometry.resolveSceneDepthMax({
			cameraPosition: position([0, 0, 12]),
			groundExtent: meters(40),
		}).value).toBeCloseTo(Math.hypot(20, 20, 12), 12,
		);
		expect(geometry.resolveSceneDepthMax({
			cameraScenePosition: scenePosition([0, 3, 0]),
			sceneScale: sceneScale(2),
			groundExtent: meters(40),
		}).value).toBeCloseTo(Math.hypot(20, 20, 6), 12,
		);
	});

	it('supports an observer-centered dome boundary', () => {
		const geometry = createGeometry({
			observerCenteredDome: {
				apexAltitude: meters(12),
				maxObserverViewRayExtent: meters(10),
			},
		});

		expect(geometry.configuration.observerCenteredDome).toEqual(jasmine.objectContaining({
			centerPolicy: 'observer-centered',
			sphereCenter: position([0, 0, 2]),
			sphereRadius: meters(10),
		}));
		expect(geometry.distanceToObserverCenteredDomeBoundary(position([0, 0, 2]), [1, 0, 0])).toBe(10);
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
			{ groundExtent: null },
			{ sceneScale: null },
			{ visualMaterialColor: null },
			{ spectralReferenceId: null },
			{ name: null },
		]) {
			expect(() => geometry.createThreeEndpointObjects(request)).toThrow();
		}

		expect(() => geometry.resolveViewRaySegment({ origin: null })).toThrow();
		expect(() => geometry.resolveViewRaySegment({ direction: null })).toThrow();
		expect(() => geometry.resolveViewRaySegment({ endDistance: null })).toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([0, 0, 2]), direction: [0, 0, 1] },
			startDistance: null,
		})).toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([0, 0, 2]), direction: [0, 0, 1] },
			sourcePathLimit: null,
		})).toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([0, 0, 2]), direction: [0, 0, 1] },
			sourcePathLimit: { maxDistance: null },
		})).not.toThrow();
		expect(() => geometry.resolveAtmospherePath({
			ray: { origin: position([0, 0, 2]), direction: [0, 0, 1] },
			sampleCount: null,
		})).toThrow();
		expect(() => geometry.mapGroundOffsetToScenePoint(scenePosition([0, 0, 0]), {
			heightAboveGround: null,
		})).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ cameraPosition: null })).toThrow();
		expect(() => geometry.resolveSceneDepthMax({ minimum: null })).toThrow();
	});

	it('fails loudly for invalid flat geometry inputs', () => {
		expect(() => new FlatEarthGeometry()).toThrowError(/configuration/);
		expect(() => createGeometry({ sourcePosition: null })).toThrowError(/sourcePosition/);
		expect(() => createGeometry({ topAltitude: meters(0) })).toThrowError(/topAltitude/);
		expect(() => createGeometry({ cacheRadialMaximum: meters(0) }))
			.toThrowError(/cacheRadialMaximum/);
		expect(() => createGeometry({
			cacheRadialNodes: [meters(0), meters(50)],
		})).toThrowError(/cacheRadialMaximum endpoints/);
		expect(() => createGeometry().resolveAtmospherePath({
			startPosition: position([0, 0, 2]),
			direction: [0, 0, 1],
		})).toThrowError(/requires ray/);
		expect(createGeometry().resolveSourceRelativePosition({
			position: position([10, 0, 5]),
		})).toEqual(jasmine.objectContaining({
			directionToSource: [0, 0, 1],
			directionFromSource: [-0, -0, -1],
			distanceFromSource: meters(0),
		}));
		expect(() => createGeometry().resolveAtmosphereCoordinate(position([0, 0, Number.NaN])))
			.toThrowError(/finite/);
		expect(() => createGeometry().mapObserverLocalScenePointToModelPosition(scenePosition([1, 2, 3]), {
			sceneScale: { value: 0, units: 'meters-per-scene-unit' },
		})).toThrowError(/sceneScale/);
	});
});

function createGeometry(overrides = {}) {
	return new FlatEarthGeometry({
		observerPosition: position([0, 0, 2]),
		sourcePosition: position([10, 0, 5]),
		topAltitude: meters(12),
		cacheRadialMaximum: meters(100),
		sceneSkyRayLimit: meters(100),
		...overrides,
	});
}

function createCacheConstructionDomains(
	geometry,
	{ zCount = 2, rhoCount = 2 } = {},
) {
	const positionDomain =
		geometry.createLocalSunCachePositionDomain({
			zCount,
			rhoCount,
		});
	return /** @type {FlatLocalCacheConstructionDomains} */ ({
		id: `test-flat-z${zCount}-rho${rhoCount}-w3`,
		positionDomain: positionDomain.descriptor,
		positionNodes: positionDomain.nodes,
		positionCount: positionDomain.count,
		zNodes: positionDomain.zNodes,
		rhoNodes: positionDomain.rhoNodes,
		zCount: positionDomain.zCount,
		rhoCount: positionDomain.rhoCount,
		incomingDirectionDomain:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.descriptor,
		incomingUnitVectors: [[0, 0, 1]],
		incomingIntegrationWeights: {
			values: [4 * Math.PI],
			units: 'steradians',
		},
		incomingDirectionCount: 1,
		outgoingDirectionDomain:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.descriptor,
		outgoingUnitVectors:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.unitVectors,
		outgoingDirectionCount:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER.directionCount,
		resolveOutgoingDirectionStencil(direction) {
			return CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER
				.resolveStencil(direction);
		},
	});
}

function createDescriptor() {
	return {
		descriptorId: 'descriptor',
		variantId: 'variant',
		fingerprint: 'descriptor',
		compatibilityTags: [],
		spectralBasis: createSection('basis', {
			channelCount: 15,
		}),
		geometry: createSection('geometry', createGeometry().describe()),
		atmosphere: createSection('atmosphere', {
			kind: 'canonical-atmosphere',
			constants: {},
		}),
		lightSource: createSection('light-source', {
			kind: 'local-sun-light-source',
			sourceKey: 'local-test',
			referenceDistance: meters(4800000),
			referenceSpectralIncidentScale: 1.25,
			radius: meters(25749.504),
			distanceFalloff: true,
		}),
		cache: createSection('cache', {
			cacheKind: 'local',
			metadata: {
				zBinCount: 3,
				rhoBinCount: 3,
				directionCount: 9,
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

function kilometerPosition(coordinates) {
	return { coordinates, units: 'kilometers' };
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
