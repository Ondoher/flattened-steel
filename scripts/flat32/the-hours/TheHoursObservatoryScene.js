import * as THREE from 'three';
import {SimplexNoise} from 'three/addons/math/SimplexNoise.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Procedural sandstone observatory with CPU-baked ordinary Three meshes.
 * Ground points are mapped by the production spherical geometry owner; all
 * opaque surfaces enter the existing Algorithm32 depth and spectral composition.
 * No sky, celestial light, night illumination, or atmospheric haze is fabricated.
 */
export class TheHoursObservatoryScene {
	/**
	 * Creates and attaches a deterministic desert observatory.
	 *
	 * @param {TheHoursObservatorySceneConfiguration} configuration - Scene dependencies and replay identities.
	 * @throws {TypeError} Missing geometry, randomness, or invalid seed/directions.
	 */
	constructor(configuration) {
		if (!Number.isSafeInteger(configuration.seed) || configuration.seed < 0) {
			throw new TypeError('TheHoursObservatory construction requires an explicit nonnegative integer seed.');
		}
		for (const direction of [configuration.sunriseDirectionScene, configuration.sunsetDirectionScene]) {
			if (direction.length !== 3 || direction.some((value) => !Number.isFinite(value))) {
				throw new TypeError('TheHoursObservatory portal directions require three finite scene coordinates.');
			}
		}
		this._three = /** @type {typeof THREE} */ (configuration.three);
		this._scene = /** @type {THREE.Scene} */ (configuration.scene);
		this._geometry = configuration.geometry;
		this._random = configuration.random;
		this._seed = configuration.seed;
		this._random.randomize(this._seed);
		this._surfaceNoise = new SimplexNoise(this._random);
		// Keep the established rock sequence independent of the surface-noise permutation.
		this._random.randomize(this._seed);
		this._disposed = false;
		this._authoredObjectCount = 0;
		/** @type {Set<THREE.Material>} Owned materials, including shared stone and bronze. */
		this._materials = new Set();
		/** @type {Map<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>} Shared colored paving surfaces. */
		this._pavingMaterials = new Map();
		/** Scene-owned group; all coordinates are kilometers in east/up/south order. */
		this.group = new this._three.Group();
		this.group.name = 'the-meridian-desert-observatory';
		this.group.userData.constructionSeed = this._seed;
		this.group.userData.sceneInputPolicy = 'ordinary-opaque-cpu-baked-meshes';
		/** @type {THREE.Mesh[]} Ordinary opaque meshes owned by this scene. */
		this.meshes = [];
		this._sand = this._material(0xc7ae86, 0, 0.98);
		this._sand.vertexColors = true;
		this._stone = this._material(0xcfc1a6, 0.02, 0.87);
		this._stoneShade = this._material(0xa29177, 0.02, 0.92);
		this._edgeStone = this._material(0xe0d4ba, 0.02, 0.82);
		this._bronze = this._material(0x9c733f, 0.46, 0.37);
		this._brass = this._material(0xc6a56b, 0.52, 0.3);
		this._darkMetal = this._material(0x38433d, 0.36, 0.52);
		this._inlay = this._material(0x7d705b, 0.1, 0.8);
		this._rock = this._material(0x554d43, 0, 0.95);
		/** Geometry-provided ground object with the supported endpoint and horizon contract. */
		this.ground = this._createGround();
		/** Authored dune relief layered above the geometry-provided spherical ground. */
		this.terrain = this._createTerrain();
		this._createTerraces();
		this._createArmillary();
		const sunriseAngle = Math.atan2(configuration.sunriseDirectionScene[2], configuration.sunriseDirectionScene[0]);
		const sunsetAngle = Math.atan2(configuration.sunsetDirectionScene[2], configuration.sunsetDirectionScene[0]);
		this._createColonnade(sunriseAngle, sunsetAngle);
		this._createPortal(sunriseAngle, 'dawn');
		this._createPortal(sunsetAngle, 'dusk');
		this._createRocks();
		this._batchStaticMeshes();
		this._scene.add(this.group);
	}

	/**
	 * Called by construction to create one shared physical surface material.
	 *
	 * @param {number} color - sRGB surface color.
	 * @param {number} metalness - Dimensionless metal fraction.
	 * @param {number} roughness - Dimensionless surface roughness.
	 * @returns {THREE.MeshStandardMaterial} - Owned shared material.
	 */
	_material(color, metalness, roughness) {
		const material = new this._three.MeshStandardMaterial({color, metalness, roughness});
		this._materials.add(material);
		return material;
	}

	/**
	 * Called by geometry builders to register one ordinary scene mesh.
	 *
	 * @param {THREE.BufferGeometry} geometry - Owned geometry in scene units.
	 * @param {THREE.Material} material - Owned shared material.
	 * @param {string} name - Stable construction identity.
	 * @param {boolean} [castShadow] - Participation in the local Sun shadow map.
	 * @returns {THREE.Mesh} - Attached scene mesh.
	 */
	_mesh(geometry, material, name, castShadow = true) {
		const mesh = new this._three.Mesh(geometry, material);
		mesh.name = name;
		mesh.castShadow = castShadow;
		mesh.receiveShadow = true;
		mesh.layers.set(0);
		mesh.userData.shadowObjectKey = name;
		this.meshes.push(mesh);
		this.group.add(mesh);
		this._authoredObjectCount += 1;
		return mesh;
	}

	/**
	 * Called by construction to map authored meter coordinates onto spherical ground.
	 *
	 * @param {number} eastMeters - Eastward horizontal offset.
	 * @param {number} southMeters - Southward horizontal offset.
	 * @param {number} heightMeters - Radial elevation above the sphere.
	 * @returns {readonly number[]} - Mapped scene coordinates in kilometers.
	 */
	_groundPoint(eastMeters, southMeters, heightMeters) {
		return this._geometry.mapGroundOffsetToScenePoint(
			{coordinates: [eastMeters / 1000, 0, southMeters / 1000], units: 'scene-units'},
			{
				sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
				heightAboveGround: {value: heightMeters / 1000, units: 'scene-units'},
			},
		).coordinates;
	}

	/**
	 * Called by terrain construction to derive continuous dunes and distant ridges.
	 *
	 * @param {number} eastMeters - Eastward horizontal offset.
	 * @param {number} southMeters - Southward horizontal offset.
	 * @returns {number} - Nonnegative terrain elevation in meters.
	 */
	_terrainHeight(eastMeters, southMeters) {
		const radius = Math.hypot(eastMeters, southMeters);
		const transition = Math.min(1, Math.max(0, (radius - 175) / 300));
		const duneWave = Math.sin(eastMeters / 180 + southMeters / 390 + Math.sin(southMeters / 560) * 1.3);
		const duneEnvelope = Math.min(18, 1.2 + radius / 1500);
		const duneHeight = (duneWave * 0.5 + 0.5) ** 3 * duneEnvelope;
		const ridgeEnvelope = Math.exp(-(((radius - 18000) / 8500) ** 2));
		const angle = Math.atan2(southMeters, eastMeters);
		const ridgeShape = (0.5 + 0.5 * Math.sin(angle * 7 + 0.8 * Math.sin(angle * 13))) ** 3;
		const ridgeHeight = ridgeEnvelope * (30 + 260 * ridgeShape);
		return transition * (duneHeight + ridgeHeight);
	}

	/**
	 * Called by construction to retain the geometry-provided ground endpoint and horizon.
	 *
	 * @returns {THREE.Mesh} - Geometry-owned visual ground with the shared desert material.
	 */
	_createGround() {
		const endpoints = this._geometry.createThreeEndpointObjects({
			sceneScale: {value: 1000, units: 'meters-per-scene-unit'},
			name: 'observatory-geometry-ground',
			groundExtent: {value: 600000, units: 'meters'},
			visualMaterialColor: 0xc7ae86,
			visualMaterialLighting: 'lambert',
			spectralReferenceId: 'observatory-natural-desert-surface',
			shadow: {
				enabled: true,
				receiveShadow: true,
				shadowPolicy: 'shared-algorithm32-distant-sun-shadow-map',
			},
			widthSegments: 256,
			heightSegments: 256,
			groundVisualMesh: {
				kind: 'local-spherical-patch',
				xExtent: {value: 300, units: 'scene-units'},
				zMin: {value: -300, units: 'scene-units'},
				zMax: {value: 300, units: 'scene-units'},
			},
		});
		const ground = /** @type {THREE.Mesh} */ (endpoints.visualObjects[0]);
		const originalMaterial = /** @type {THREE.Material} */ (ground.material);
		originalMaterial.dispose();
		ground.material = this._sand;
		ground.castShadow = false;
		ground.receiveShadow = true;
		this.meshes.push(ground);
		this.group.add(ground);
		this._authoredObjectCount += 1;
		return ground;
	}

	/**
	 * Called by construction to create a curved desert extending beyond the visible horizon.
	 *
	 * @returns {THREE.Mesh} - Ordinary terrain mesh with CPU-authored vertex color.
	 */
	_createTerrain() {
		const angularSegments = 320;
		const radii = [0];
		for (let radialIndex = 1; radialIndex <= 60; radialIndex += 1) radii.push(radialIndex * 8);
		for (let radialIndex = 1; radialIndex <= 100; radialIndex += 1) {
			radii.push(480 + (radialIndex / 100) ** 2.65 * 259520);
		}
		const positions = [];
		const colors = [];
		const indices = [];
		for (const radius of radii) {
			for (let angularIndex = 0; angularIndex <= angularSegments; angularIndex += 1) {
				const angle = (angularIndex / angularSegments) * Math.PI * 2;
				const eastMeters = Math.cos(angle) * radius;
				const southMeters = Math.sin(angle) * radius;
				positions.push(
					...this._groundPoint(eastMeters, southMeters, this._terrainHeight(eastMeters, southMeters)),
				);
				const broadVariation = this._surfaceNoise.noise(eastMeters / 125, southMeters / 125);
				const windVariation = this._surfaceNoise.noise(eastMeters / 16, southMeters / 72);
				const mineralVariation = this._surfaceNoise.noise(eastMeters / 38 + 41, southMeters / 38 - 19);
				const value = 0.86 + broadVariation * 0.095 + windVariation * 0.038;
				colors.push(
					value,
					value * (0.966 + mineralVariation * 0.026),
					value * (0.885 + mineralVariation * 0.04),
				);
			}
		}
		for (let radialIndex = 0; radialIndex < radii.length - 1; radialIndex += 1) {
			for (let angularIndex = 0; angularIndex < angularSegments; angularIndex += 1) {
				const inner = radialIndex * (angularSegments + 1) + angularIndex;
				const outer = inner + angularSegments + 1;
				indices.push(inner, inner + 1, outer, inner + 1, outer + 1, outer);
			}
		}
		const geometry = new this._three.BufferGeometry();
		geometry.setAttribute('position', new this._three.Float32BufferAttribute(positions, 3));
		geometry.setAttribute('color', new this._three.Float32BufferAttribute(colors, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();
		const ground = this._mesh(geometry, this._sand, 'mapped-spherical-desert-ground', false);
		ground.userData.terrainSurfacePolicy = 'spherical-ground-mapping-plus-authored-meter-elevation';
		return ground;
	}

	/**
	 * Called by terrace construction to add restrained sandstone variation above the existing solid.
	 * The skin receives the original dynamic Sun shadows and never casts an extra shadow.
	 *
	 * @param {number} innerRadiusMeters - Inner edge of the visible annulus, in meters.
	 * @param {number} outerRadiusMeters - Outer edge of the visible annulus, in meters.
	 * @param {number} elevationMeters - Existing terrace-top elevation, in meters.
	 * @param {THREE.MeshStandardMaterial} baseMaterial - Existing sandstone material and physical response.
	 * @param {string} name - Stable terrace surface identity.
	 * @returns {void} - Registered ordinary, CPU-colored sandstone surface.
	 */
	_createPavingSurface(innerRadiusMeters, outerRadiusMeters, elevationMeters, baseMaterial, name) {
		let material = this._pavingMaterials.get(baseMaterial);
		if (material === undefined) {
			material = baseMaterial.clone();
			material.vertexColors = true;
			this._pavingMaterials.set(baseMaterial, material);
			this._materials.add(material);
		}
		const geometry = new this._three.RingGeometry(
			innerRadiusMeters / 1000,
			outerRadiusMeters / 1000,
			320,
			Math.ceil((outerRadiusMeters - innerRadiusMeters) / 1.3),
		);
		geometry.rotateX(-Math.PI / 2);
		const positions = geometry.getAttribute('position');
		const colors = new Float32Array(positions.count * 3);
		for (let vertexIndex = 0; vertexIndex < positions.count; vertexIndex += 1) {
			const eastMeters = positions.getX(vertexIndex) * 1000;
			const southMeters = positions.getZ(vertexIndex) * 1000;
			const broadVein = this._surfaceNoise.noise(eastMeters / 29, southMeters / 29);
			const stoneGrain = this._surfaceNoise.noise(eastMeters / 2.9 + 11, southMeters / 2.9 - 37);
			const mineralVein = this._surfaceNoise.noise(eastMeters / 12 - 23, southMeters / 12 + 7);
			const value = 0.91 + broadVein * 0.063 + stoneGrain * 0.025;
			colors[vertexIndex * 3] = value;
			colors[vertexIndex * 3 + 1] = value * (0.98 + mineralVein * 0.016);
			colors[vertexIndex * 3 + 2] = value * (0.928 + mineralVein * 0.025);
		}
		geometry.setAttribute('color', new this._three.Float32BufferAttribute(colors, 3));
		const surface = this._mesh(geometry, material, name, false);
		surface.position.y = (elevationMeters + 0.004) / 1000;
		surface.userData.surfaceVariationPolicy = 'seeded-simplex-stone-grain-cpu-vertex-color';
	}

	/**
	 * Called by architecture construction to create a meter-authored rectangular solid.
	 *
	 * @param {readonly number[]} sizeMeters - Width, height, and depth in meters.
	 * @param {readonly number[]} positionMeters - East/elevation/south center in meters.
	 * @param {THREE.Material} material - Owned shared surface material.
	 * @param {string} name - Stable construction identity.
	 * @param {number} [rotationY] - Scene vertical-axis rotation in radians.
	 * @param {boolean} [castShadow] - Participation in the local Sun shadow map.
	 * @returns {THREE.Mesh} - Attached solid mesh.
	 */
	_box(sizeMeters, positionMeters, material, name, rotationY = 0, castShadow = true) {
		const geometry = new this._three.BoxGeometry(sizeMeters[0] / 1000, sizeMeters[1] / 1000, sizeMeters[2] / 1000);
		const mesh = this._mesh(geometry, material, name, castShadow);
		const center = this._groundPoint(positionMeters[0], positionMeters[2], positionMeters[1]);
		mesh.position.set(center[0], center[1], center[2]);
		mesh.rotation.y = rotationY;
		return mesh;
	}

	/**
	 * Called by architecture construction to create a circular terrace or pedestal.
	 *
	 * @param {number} radiusMeters - Cylinder radius in meters.
	 * @param {number} heightMeters - Cylinder height in meters.
	 * @param {number} centerHeightMeters - Center elevation in meters.
	 * @param {THREE.Material} material - Owned shared surface material.
	 * @param {string} name - Stable construction identity.
	 * @returns {THREE.Mesh} - Attached circular solid.
	 */
	_disc(radiusMeters, heightMeters, centerHeightMeters, material, name) {
		const geometry = new this._three.CylinderGeometry(
			radiusMeters / 1000,
			radiusMeters / 1000,
			heightMeters / 1000,
			160,
		);
		const mesh = this._mesh(geometry, material, name);
		mesh.position.y = centerHeightMeters / 1000;
		return mesh;
	}

	/**
	 * Called by architecture construction to create one circular or split metal ring.
	 *
	 * @param {number} radiusMeters - Ring radius in meters.
	 * @param {number} tubeMeters - Ring tube radius in meters.
	 * @param {THREE.Material} material - Owned shared surface material.
	 * @param {string} name - Stable construction identity.
	 * @param {number} [arc] - Ring extent in radians.
	 * @returns {THREE.Mesh} - Attached ring in its default XY plane.
	 */
	_ring(radiusMeters, tubeMeters, material, name, arc = Math.PI * 2) {
		const geometry = new this._three.TorusGeometry(radiusMeters / 1000, tubeMeters / 1000, 10, 192, arc);
		return this._mesh(geometry, material, name);
	}

	/**
	 * Called by construction to create stepped sandstone terraces and radial instrument markings.
	 *
	 * @returns {void} - Registered terrace and plaza meshes.
	 */
	_createTerraces() {
		this._disc(150, 0.18, 0.09, this._stoneShade, 'outer-sandstone-plaza');
		this._disc(118, 0.3, 0.18, this._stone, 'second-sandstone-terrace');
		this._disc(78, 0.5, 0.24, this._edgeStone, 'third-sandstone-terrace');
		this._disc(42, 0.72, 0.37, this._stone, 'inner-sandstone-terrace');
		this._disc(22, 1.05, 0.54, this._edgeStone, 'armillary-dais');
		this._createPavingSurface(118, 149.9, 0.18, this._stoneShade, 'outer-weathered-sandstone');
		this._createPavingSurface(78, 117.9, 0.33, this._stone, 'second-weathered-sandstone');
		this._createPavingSurface(42, 77.9, 0.49, this._edgeStone, 'third-weathered-sandstone');
		this._createPavingSurface(22, 41.9, 0.73, this._stone, 'inner-weathered-sandstone');
		this._createPavingSurface(10, 21.9, 1.065, this._edgeStone, 'dais-weathered-sandstone');
		for (const [radius, elevation] of [
			[146, 0.2],
			[116, 0.35],
			[76, 0.52],
			[40, 0.76],
			[21, 1.09],
		]) {
			const ring = this._ring(radius, 0.07, this._inlay, `concentric-bronze-inlay-${radius}`);
			ring.rotation.x = -Math.PI / 2;
			ring.position.y = elevation / 1000;
			ring.castShadow = false;
		}
		for (let markingIndex = 0; markingIndex < 72; markingIndex += 1) {
			const angle = (markingIndex / 72) * Math.PI * 2;
			const major = markingIndex % 6 === 0;
			const bands = major
				? [
						[24, 40, 0.745],
						[43, 76, 0.505],
						[79, 116, 0.345],
						[120, 143, 0.195],
					]
				: [[134, 142, 0.195]];
			for (const [innerRadius, outerRadius, elevation] of bands) {
				const radius = (innerRadius + outerRadius) / 2;
				this._box(
					[major ? 0.13 : 0.08, 0.018, outerRadius - innerRadius],
					[Math.cos(angle) * radius, elevation, Math.sin(angle) * radius],
					this._inlay,
					`radial-plaza-mark-${markingIndex}-${innerRadius}`,
					Math.PI / 2 - angle,
					false,
				);
			}
		}
	}

	/**
	 * Called by construction to create the monumental open armillary and its brass graduations.
	 *
	 * @returns {void} - Registered central instrument meshes.
	 */
	_createArmillary() {
		this._disc(10, 0.9, 1.5, this._stoneShade, 'armillary-lower-pedestal');
		this._disc(8.5, 0.8, 2.28, this._edgeStone, 'armillary-upper-pedestal');
		const meridian = this._ring(14.4, 0.46, this._bronze, 'bronze-meridian-ring');
		meridian.position.y = 0.017;
		meridian.rotation.y = -0.48;
		const ecliptic = this._ring(13.2, 0.39, this._brass, 'split-ecliptic-ring', Math.PI * 1.81);
		ecliptic.position.y = 0.017;
		ecliptic.rotation.set(0.46, 1.03, 0.55);
		const equator = this._ring(14.8, 0.32, this._darkMetal, 'equatorial-observation-ring');
		equator.position.y = 0.017;
		equator.rotation.x = Math.PI / 2 - 0.18;
		const globe = this._mesh(
			new this._three.SphereGeometry(0.0022, 48, 32),
			this._darkMetal,
			'central-celestial-sphere',
		);
		globe.position.y = 0.017;
		const axis = this._mesh(
			new this._three.CylinderGeometry(0.00016, 0.00021, 0.033, 16),
			this._brass,
			'polar-gnomon',
		);
		axis.position.y = 0.017;
		axis.rotation.z = -0.31;
		for (const sign of [-1, 1]) {
			const support = this._box(
				[1.6, 13.7, 2.2],
				[sign * 14.2, 8.3, 0],
				this._stoneShade,
				`armillary-support-${sign}`,
			);
			support.rotation.z = sign * 0.22;
			this._box([3.8, 1.1, 4.3], [sign * 14.2, 1.7, 0], this._edgeStone, `armillary-support-foot-${sign}`);
		}
		for (let markingIndex = 0; markingIndex < 48; markingIndex += 1) {
			const angle = (markingIndex / 48) * Math.PI * 2;
			const major = markingIndex % 4 === 0;
			const marking = this._box(
				[major ? 0.8 : 0.36, 0.1, 0.17],
				[Math.cos(angle) * 14.8, 17, Math.sin(angle) * 14.8],
				this._brass,
				`equatorial-graduation-${markingIndex}`,
				-angle,
				false,
			);
			marking.position.y += Math.sin(angle) * 0.00264;
		}
	}

	/**
	 * Called by colonnade construction to measure circular angle separation.
	 *
	 * @param {number} angle - First angle in radians.
	 * @param {number} portalAngle - Portal angle in radians.
	 * @returns {number} - Nonnegative shortest separation in radians.
	 */
	_angleDistance(angle, portalAngle) {
		return Math.abs(Math.atan2(Math.sin(angle - portalAngle), Math.cos(angle - portalAngle)));
	}

	/**
	 * Called by construction to frame the open Sun portals with a low curved colonnade.
	 *
	 * @param {number} sunriseAngle - Horizontal sunrise angle in radians.
	 * @param {number} sunsetAngle - Horizontal sunset angle in radians.
	 * @returns {void} - Registered stone columns and lintels.
	 */
	_createColonnade(sunriseAngle, sunsetAngle) {
		const count = 36;
		const radius = 101;
		for (let columnIndex = 0; columnIndex < count; columnIndex += 1) {
			const angle = (columnIndex / count) * Math.PI * 2;
			if (Math.min(this._angleDistance(angle, sunriseAngle), this._angleDistance(angle, sunsetAngle)) < 0.34)
				continue;
			const eastMeters = Math.cos(angle) * radius;
			const southMeters = Math.sin(angle) * radius;
			this._box(
				[2.1, 8.8, 2.5],
				[eastMeters, 4.7, southMeters],
				this._stone,
				`colonnade-shaft-${columnIndex}`,
				-angle,
			);
			this._box(
				[3.2, 0.6, 3.4],
				[eastMeters, 0.57, southMeters],
				this._stoneShade,
				`colonnade-foot-${columnIndex}`,
				-angle,
			);
			this._box(
				[3.3, 0.65, 3.5],
				[eastMeters, 9.18, southMeters],
				this._edgeStone,
				`colonnade-capital-${columnIndex}`,
				-angle,
			);
			const midpointAngle = angle + Math.PI / count;
			if (
				Math.min(
					this._angleDistance(midpointAngle, sunriseAngle),
					this._angleDistance(midpointAngle, sunsetAngle),
				) < 0.39
			)
				continue;
			this._box(
				[2 * radius * Math.sin(Math.PI / count) + 0.15, 0.95, 3.3],
				[Math.cos(midpointAngle) * radius, 9.95, Math.sin(midpointAngle) * radius],
				this._stone,
				`curved-colonnade-lintel-${columnIndex}`,
				-midpointAngle - Math.PI / 2,
			);
		}
	}

	/**
	 * Called by construction to create one precisely Sun-aligned open sandstone portal.
	 *
	 * @param {number} angle - Horizontal Sun bearing in radians.
	 * @param {string} name - Dawn or dusk construction identity.
	 * @returns {void} - Registered portal and path details.
	 */
	_createPortal(angle, name) {
		const eastMeters = Math.cos(angle) * 104;
		const southMeters = Math.sin(angle) * 104;
		for (const sign of [-1, 1]) {
			const columnEast = eastMeters - Math.sin(angle) * 9.5 * sign;
			const columnSouth = southMeters + Math.cos(angle) * 9.5 * sign;
			this._box(
				[2.8, 12.3, 3.1],
				[columnEast, 6.5, columnSouth],
				this._edgeStone,
				`${name}-portal-pier-${sign}`,
				-angle,
			);
			this._box(
				[3.6, 0.75, 3.8],
				[columnEast, 0.72, columnSouth],
				this._stoneShade,
				`${name}-portal-base-${sign}`,
				-angle,
			);
			this._box(
				[0.13, 10, 0.15],
				[columnEast - Math.cos(angle) * 1.43, 6.6, columnSouth - Math.sin(angle) * 1.43],
				this._bronze,
				`${name}-portal-inlay-${sign}`,
				-angle,
				false,
			);
		}
		this._box(
			[22.2, 1.1, 3.3],
			[eastMeters, 13.2, southMeters],
			this._stone,
			`${name}-portal-lintel`,
			-angle - Math.PI / 2,
		);
	}

	/**
	 * Called by construction to scatter reproducible angular desert rocks outside the plaza.
	 *
	 * @returns {void} - Registered ordinary low-poly rock meshes.
	 */
	_createRocks() {
		for (let rockIndex = 0; rockIndex < 78; rockIndex += 1) {
			const angle = this._random.random() * Math.PI * 2;
			const radius = 166 + this._random.random() ** 1.7 * 1050;
			const size = 0.7 + this._random.random() ** 2 * 6;
			const eastMeters = Math.cos(angle) * radius;
			const southMeters = Math.sin(angle) * radius;
			const groundHeight = this._terrainHeight(eastMeters, southMeters);
			const mesh = this._mesh(
				new this._three.DodecahedronGeometry(size / 1000, 0),
				this._rock,
				`desert-rock-${rockIndex}`,
				radius < 215,
			);
			const center = this._groundPoint(eastMeters, southMeters, groundHeight + size * 0.28);
			mesh.position.set(center[0], center[1], center[2]);
			mesh.scale.set(
				0.8 + this._random.random(),
				0.42 + this._random.random() * 0.65,
				0.65 + this._random.random(),
			);
			mesh.rotation.set(this._random.random(), this._random.random() * Math.PI, this._random.random());
		}
	}

	/**
	 * Called by construction to bake static objects into shared-material ordinary meshes.
	 * This retains plain vertex positions for Algorithm32's depth/hit override shaders.
	 *
	 * @returns {void} - Consolidated scene meshes and released source geometry.
	 */
	_batchStaticMeshes() {
		/** @type {Map<string, THREE.Mesh[]>} Material and shadow-policy buckets. */
		const buckets = new Map();
		for (const mesh of this.meshes) {
			if (mesh === this.ground || mesh === this.terrain) continue;
			const material = /** @type {THREE.Material} */ (mesh.material);
			const bucketKey = `${material.uuid}:${mesh.castShadow}`;
			const bucket = buckets.get(bucketKey) ?? [];
			bucket.push(mesh);
			buckets.set(bucketKey, bucket);
		}
		this.group.updateWorldMatrix(true, true);
		this.meshes = [this.ground, this.terrain];
		for (const bucket of buckets.values()) {
			const geometries = [];
			for (const mesh of bucket) {
				const baked = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
				baked.applyMatrix4(mesh.matrixWorld);
				geometries.push(baked);
				mesh.geometry.dispose();
				this.group.remove(mesh);
			}
			const geometry = mergeGeometries(geometries, false);
			for (const sourceGeometry of geometries) sourceGeometry.dispose();
			if (geometry === null) throw new Error('TheHoursObservatory static geometry could not be merged.');
			geometry.computeBoundingSphere();
			const mesh = new this._three.Mesh(geometry, bucket[0].material);
			mesh.name = `baked-${bucket[0].name}`;
			mesh.castShadow = bucket[0].castShadow;
			mesh.receiveShadow = true;
			mesh.userData.authoredObjectCount = bucket.length;
			this.meshes.push(mesh);
			this.group.add(mesh);
		}
	}

	/**
	 * Call this method to record replay state for the static observatory.
	 *
	 * @param {number} animationSeconds - Current deterministic animation time.
	 * @param {number} daylight - Current caller-owned daylight measure.
	 * @returns {void} - Updated observable replay metadata without fabricated lighting.
	 */
	update(animationSeconds, daylight) {
		this.group.userData.animationSeconds = animationSeconds;
		this.group.userData.daylight = daylight;
	}

	/**
	 * Call this method to return opaque bounds for Algorithm32's physical depth cap.
	 *
	 * @returns {readonly ScenePosition[]} - Scene-space corners bounding all opaque geometry.
	 */
	getSceneDepthEndpointPositions() {
		/** @type {ScenePosition[]} Physical-depth endpoint bounds. */
		const positions = [];
		this.group.updateWorldMatrix(true, true);
		for (const mesh of this.meshes) {
			const bounds = new this._three.Box3().setFromObject(mesh, true);
			for (const x of [bounds.min.x, bounds.max.x]) {
				for (const y of [bounds.min.y, bounds.max.y]) {
					for (const z of [bounds.min.z, bounds.max.z]) {
						positions.push({coordinates: [x, y, z], units: 'scene-units'});
					}
				}
			}
		}
		return positions;
	}

	/**
	 * Call this method to describe deterministic geometry and draw-call facts.
	 *
	 * @returns {TheHoursObservatorySceneDescription} - Observable scene construction facts.
	 */
	describe() {
		return {
			name: 'The Meridian — a desert observatory',
			seed: this._seed,
			authoredObjectCount: this._authoredObjectCount,
			meshCount: this.meshes.length,
			triangleCount: this.meshes.reduce(
				(total, mesh) =>
					total + (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count) / 3,
				0,
			),
			shadowCasterCount: this.meshes.filter((mesh) => mesh.castShadow).length,
			shadowReceiverCount: this.meshes.filter((mesh) => mesh.receiveShadow).length,
			plazaRadiusMeters: 150,
			heroCenterScene: [0, 0.017, 0],
			sceneInputPolicy: 'ordinary-opaque-cpu-baked-meshes',
		};
	}

	/**
	 * Call this method to release owned geometry, shared materials, and scene attachment.
	 *
	 * @returns {void} - Detached and disposed scene resources.
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._scene.remove(this.group);
		for (const mesh of this.meshes) mesh.geometry.dispose();
		for (const material of this._materials) material.dispose();
		this.meshes.length = 0;
		this._materials.clear();
		this._pavingMaterials.clear();
		this.group.clear();
	}
}
