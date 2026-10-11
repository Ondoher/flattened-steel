import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {TheHoursDesertSceneLighting} from '../../scripts/flat32/the-hours/TheHoursDesertSceneLighting.js';
import {NeutralLambertianSceneLighting, NEUTRAL_LAMBERTIAN_REFLECTANCE} from '../../src/algorithm32/implementation/scene-lighting/NeutralLambertianSceneLighting.js';
import {SceneInputCapture} from '../../src/algorithm32/rendering-runtime/three/SceneInputCapture.js';
import {CelestialGenerationPass} from '../../src/algorithm32/rendering-runtime/three/CelestialGenerationPass.js';
import {FILM_CIRCUIT_FOV_DEGREES, FILM_BOOKEND_FOV_DEGREES} from './film-director.js';

/** Persistent fictional observatory, camera, measured light bridge and shared shadow.
 * Exact physical frames borrow this owner; staging records lighting without
 * altering the scene. The film renderer serializes publication, camera updates
 * and rendering, then releases each frame before disposing this owner.
 */
export class LocalSunFilmScene {
	/** Persistent ordinary opaque scene. @type {THREE.Scene} */
	scene = new THREE.Scene();
	/** Persistent camera, mutated only by applyCamera after publication. @type {THREE.PerspectiveCamera} */
	camera;
	/** Declared shared-shadow and measured spectral bridge. @type {TheHoursDesertSceneLighting} */
	lighting;
	/** Scene-owned linear color target preceding atmosphere and display. @type {THREE.WebGLRenderTarget} */
	colorTarget;
	/** @type {Map<THREE.Material, THREE.BufferGeometry[]>} */
	_parts = new Map();
	/** Ground and paving receive monument shadows without casting grazing self-shadow artifacts. @type {Map<THREE.Material, THREE.BufferGeometry[]>} */
	_floorParts = new Map();
	/** @type {THREE.Mesh[]} */
	_meshes = [];
	/** @type {THREE.MeshStandardMaterial[]} */
	_materials = [];
	/** @type {LocalSunFilmLandmark[]} */
	_landmarks = [];
	/** @type {readonly LocalSunFilmSkylineSample[]} */
	_skyline;
	/** @type {Promise<void>|null} */
	_prepared = null;
	/** @type {LocalSunFilmCameraSample|null} */
	_pose = null;
	/** @type {LocalSunFilmSceneTriple|null} */
	_sourceScene = null;
	/** @type {number|null} */
	_directionError = null;
	/** @type {string|null} */
	_receiverIdentity = null;
	_disposed = false;
	_borrowers = 0;
	_geometryBytes = 0;
	_seed;
	/** Frozen-by-contract construction facts retained in each scene description. @type {LocalSunFilmSceneConstruction} */
	_construction = {courtRadiusMeters: 430, courtHeightMeters: 1.68, ringRadiusMeters: 420, ringHeightReferenceRadiusMeters: 258, ringPylonCount: 36, ringLintelCount: 12, innerGnomonCount: 8, innerGnomonRadiusMeters: 180, innerGnomonHeightMeters: 30};
	/** Shared orthographic shadow coverage in meters. @type {number} */
	_shadowExtentMeters = 1100;

	/** Build reproducible flat-ground architecture around the actual source path.
	 * @param {LocalSunFilmSceneConfiguration} configuration - Raster, seed and complete physical skyline samples.
	 * @throws {RangeError} Invalid raster, seed or incomplete trajectory samples.
	 */
	constructor(configuration) {
		const {width, height, skylineSamples} = configuration;
		const seed = configuration.seed ?? 3202609;
		if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096 || !Number.isSafeInteger(seed) || seed < 0) throw new RangeError('Film scene requires bounded integer raster dimensions and a nonnegative seed.');
		if (!Array.isArray(skylineSamples) || skylineSamples.length < 24 || skylineSamples.some(sample => !Number.isFinite(sample.azimuthDegrees) || !Number.isFinite(sample.elevationDegrees) || sample.elevationDegrees < 8 || sample.elevationDegrees > 60)) throw new RangeError('Film skyline requires at least 24 valid actual full-orbit samples.');
		this._seed = seed;
		this._skyline = skylineSamples.map(sample => ({...sample}));
		this.camera = new THREE.PerspectiveCamera(FILM_BOOKEND_FOV_DEGREES, width / height, 0.001, 500);
		this.camera.position.set(0, 0.008, 0);
		this.camera.lookAt(0, 0.15, -1);
		this.colorTarget = new THREE.WebGLRenderTarget(width, height, {format: THREE.RGBAFormat, type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, stencilBuffer: false});
		this.colorTarget.texture.internalFormat = 'RGBA32F';
		this.colorTarget.texture.colorSpace = THREE.NoColorSpace;
		this.colorTarget.texture.generateMipmaps = false;
		const stone = this._material(0xcfc1a6, 0.02, 0.87);
		const edge = this._material(0xe3d7bd, 0.02, 0.82);
		const shade = this._material(0xa29177, 0.02, 0.92);
		const basalt = this._material(0x41423f, 0.06, 0.9);
		const brass = this._material(0xb5955e, 0.45, 0.37);
		const ground = this._material(0xb5a58e, 0, 0.99);
		const plane = new THREE.CircleGeometry(3, 128);
		plane.rotateX(-Math.PI / 2);
		plane.translate(0, -0.0002, 0);
		this._part(plane, ground, false);
		const courtRadius = this._construction.courtRadiusMeters;
		for (let tier = 0; tier < 3; tier++) this._cylinder(courtRadius + 24 - 8 * tier, 0.42, [0, 0.21 + tier * 0.42, 0], tier % 2 ? stone : shade, false);
		// A single continuous top replaces the raised paving seams that became
		// distracting dark edges in the backlit, grazing-angle wide bookends.
		// The wall is open-ended: the following adjoining regions are its only
		// top surface, so the flush brass bands never overlap a hidden stone cap.
		const courtWall = new THREE.CylinderGeometry(courtRadius / 1000, courtRadius / 1000, 0.00042, 128, 1, true);
		courtWall.translate(0, 0.00147, 0);
		this._part(courtWall, stone, false);
		const boundaries = [0, 139.5, 140.5, 279.5, 280.5, 419.5, 420.5, courtRadius];
		for (let band = 0; band < boundaries.length - 1; band++) {
			const inner = boundaries[band] / 1000, outer = boundaries[band + 1] / 1000;
			const paving = inner === 0 ? new THREE.CircleGeometry(outer, 128) : new THREE.RingGeometry(inner, outer, 128, 1);
			paving.rotateX(-Math.PI / 2);
			paving.translate(0, 0.00168, 0);
			this._part(paving, band % 2 === 1 ? brass : stone, false);
		}
		// Keep the original absolute skyline heights while opening the court.
		// Thirty-six pillars and twelve separated lintels leave distinct cast
		// shadows instead of the former dense, continuous perimeter shadow grid.
		for (let index = 0; index < this._construction.ringPylonCount; index++) {
			const bearing = index * 10;
			const jitter = 4 * Math.sin((index * 2 + seed) * 1.618);
			const radius = this._construction.ringRadiusMeters + jitter;
			const referenceRadius = this._construction.ringHeightReferenceRadiusMeters + jitter;
			const top = this._skylineHeight(bearing, referenceRadius);
			const center = this._radial(bearing, radius, top / 2);
			this._box([3.1, top, 4.8], center, bearing, index % 3 === 0 ? shade : stone);
			this._box([5.8, 2.8, 7.1], this._radial(bearing, radius, top - 1.4), bearing, edge);
			this._box([3.5, 1.1, 5.4], this._radial(bearing, radius, top - 5), bearing, brass);
			if (index % 3 === 0) {
				const nextJitter = 4 * Math.sin(((index + 1) * 2 + seed) * 1.618);
				const nextRadius = this._construction.ringRadiusMeters + nextJitter;
				const spanTop = Math.min(top, this._skylineHeight(bearing + 10, this._construction.ringHeightReferenceRadiusMeters + nextJitter)) - 7;
				const first = this._radial(bearing, radius, spanTop), second = this._radial(bearing + 10, nextRadius, spanTop);
				/** @type {LocalSunFilmSceneTriple} */
				const middle = [(first[0] + second[0]) / 2, spanTop, (first[2] + second[2]) / 2];
				const span = Math.hypot(second[0] - first[0], second[2] - first[2]);
				const orientation = Math.atan2(second[2] - first[2], second[0] - first[0]) * 180 / Math.PI;
				this._box([span + 3.1, 3.5, 4.4], middle, orientation, index % 2 ? shade : stone);
			}
		}
		const start = skylineSamples[0].azimuthDegrees;
		for (let index = 0; index < this._construction.innerGnomonCount; index++) {
			const bearing = start + 22.5 + index * 45;
			const radius = this._construction.innerGnomonRadiusMeters;
			const floorHeight = this._construction.courtHeightMeters, height = this._construction.innerGnomonHeightMeters;
			this._box([4, 0.5, 4], this._radial(bearing, radius, floorHeight + 0.25), bearing, edge);
			this._box([2.2, height - 0.5, 2.2], this._radial(bearing, radius, floorHeight + 0.5 + (height - 0.5) / 2), bearing, stone);
			this._box([3.2, 0.8, 3.2], this._radial(bearing, radius, floorHeight + height - 0.4), bearing, edge);
			this._box([2.5, 0.25, 2.5], this._radial(bearing, radius, floorHeight + height - 1.8), bearing, brass);
		}
		this._gateway(start, stone, edge, basalt, brass);
		this._colonnade(start + 90, stone, edge, basalt);
		this._tower(start + 180, stone, edge, basalt, brass);
		this._arches(start + 270, stone, edge, basalt);
		this._batch();
		this.lighting = new TheHoursDesertSceneLighting({three: THREE, parent: this.scene, shadowExtentMeters: this._shadowExtentMeters, shadowFocusMeters: [0, 40, 0], groundBounceStrength: 0.25, neutralReflectance: NEUTRAL_LAMBERTIAN_REFLECTANCE, neutralLambertianClass: NeutralLambertianSceneLighting});
		this.scene.name = 'local-sun-the-meridian-circular-observatory';
		this.scene.userData.constructionSeed = seed;
	}

	/** Create one scene-owned physical material.
	 * @param {number} color - sRGB material color.
	 * @param {number} metalness - Dimensionless metal fraction.
	 * @param {number} roughness - Dimensionless roughness.
	 * @returns {THREE.MeshStandardMaterial} - Owned material.
	 */
	_material(color, metalness, roughness) {
		const material = new THREE.MeshStandardMaterial({color, metalness, roughness});
		this._materials.push(material);
		return material;
	}

	/** Queue a transformed geometry for deterministic batching by material.
	 * @param {THREE.BufferGeometry} geometry - Newly owned geometry in scene coordinates.
	 * @param {THREE.Material} material - Scene-owned shared material.
	 * @param {boolean} [castsShadow=true] - Whether this geometry belongs to the shadow-casting architecture batch.
	 * @returns {void} - The scene assumes ownership.
	 */
	_part(geometry, material, castsShadow = true) {
		// Rounded boxes are nonindexed; normalize every temporary primitive to
		// that representation so all same-material parts can be merged safely.
		if (geometry.index) {
			const indexed = geometry;
			geometry = indexed.toNonIndexed();
			indexed.dispose();
		}
		const collection = castsShadow ? this._parts : this._floorParts;
		const parts = collection.get(material) ?? [];
		parts.push(geometry);
		collection.set(material, parts);
	}

	/** Map model bearing and radius into east/up/south meter coordinates.
	 * @param {number} bearing - Degrees east from north.
	 * @param {number} radius - Horizontal distance, meters.
	 * @param {number} height - Ground-relative height, meters.
	 * @returns {LocalSunFilmSceneTriple} - Scene-oriented meter coordinates.
	 */
	_radial(bearing, radius, height) {
		const angle = bearing * Math.PI / 180;
		return [radius * Math.sin(angle), height, -radius * Math.cos(angle)];
	}

	/** Place a radial rectangular architectural block in scene coordinates.
	 * @param {LocalSunFilmSceneTriple} size - Tangential width, height and radial depth, meters.
	 * @param {LocalSunFilmSceneTriple} center - East/up/south center, meters.
	 * @param {number} bearing - Bearing of its outward face, degrees east from north.
	 * @param {THREE.Material} material - Scene-owned material.
	 * @param {boolean} [castsShadow=true] - Whether this block casts the shared source shadow.
	 * @returns {void} - Geometry transferred to the batch owner.
	 */
	_box(size, center, bearing, material, castsShadow = true) {
		const geometry = new RoundedBoxGeometry(size[0] / 1000, size[1] / 1000, size[2] / 1000, 2, Math.min(...size) * 0.08 / 1000);
		geometry.rotateY(-bearing * Math.PI / 180);
		geometry.translate(center[0] / 1000, center[1] / 1000, center[2] / 1000);
		this._part(geometry, material, castsShadow);
	}

	/** Place a horizontal cylindrical terrace or vertical column.
	 * @param {number} radius - Cylinder radius, meters.
	 * @param {number} height - Cylinder height, meters.
	 * @param {LocalSunFilmSceneTriple} center - East/up/south center, meters.
	 * @param {THREE.Material} material - Scene-owned material.
	 * @param {boolean} [castsShadow=true] - Whether this cylinder casts the shared source shadow.
	 * @returns {void} - Geometry transferred to the batch owner.
	 */
	_cylinder(radius, height, center, material, castsShadow = true) {
		const geometry = new THREE.CylinderGeometry(radius / 1000, radius / 1000, height / 1000, radius > 20 ? 128 : 16);
		geometry.translate(center[0] / 1000, center[1] / 1000, center[2] / 1000);
		this._part(geometry, material, castsShadow);
	}

	/** Choose a skyline below all nearby actual Sun samples, including a camera-motion margin.
	 * @param {number} bearing - Landmark bearing, degrees east from north.
	 * @param {number} radius - Original v4 construction radius, meters; moving the architecture never scales its height.
	 * @returns {number} - Maximum authored height above ground, meters.
	 */
	_skylineHeight(bearing, radius) {
		const distance = sample => Math.abs(((sample.azimuthDegrees - bearing + 540) % 360 + 360) % 360 - 180);
		const close = this._skyline.filter(sample => distance(sample) <= 7);
		const selected = close.length ? close : [...this._skyline].sort((a, b) => distance(a) - distance(b)).slice(0, 2);
		const elevation = Math.min(...selected.map(sample => sample.elevationDegrees)) - 3.5;
		return 8 + (radius - 16) * Math.tan(elevation * Math.PI / 180);
	}

	/** Build the unmistakable split gateway used at both ends of the circuit.
	 * @param {number} bearing - Starting physical source bearing, degrees.
	 * @param {THREE.Material} stone - Primary warm stone.
	 * @param {THREE.Material} edge - Pale cap stone.
	 * @param {THREE.Material} basalt - Dark inset material.
	 * @param {THREE.Material} brass - Restrained metallic trim.
	 * @returns {void} - Gateway geometry is queued for batching.
	 */
	_gateway(bearing, stone, edge, basalt, brass) {
		const radius = 360, top = this._skylineHeight(bearing, 216);
		for (const side of [-1, 1]) {
			const angle = bearing + side * 4.7 * 216 / radius;
			this._box([13, top, 18], this._radial(angle, radius, top / 2), angle, stone);
			this._box([16, 4, 21], this._radial(angle, radius, top - 2), angle, edge);
			this._box([3.2, top * 0.72, 0.7], this._radial(angle, radius - 9.4, top * 0.5), angle, basalt);
			this._box([13.6, 0.8, 18.6], this._radial(angle, radius, top - 6), angle, brass);
		}
		this._box([45, 4, 20], this._radial(bearing, radius, 2), bearing, basalt);
		this._landmarks.push({name: 'split-gateway', azimuthDegrees: bearing % 360, radiusMeters: radius, topMeters: top});
	}

	/** Build the repeated column landmark with deep dark capital accents.
	 * @param {number} bearing - Landmark bearing, degrees.
	 * @param {THREE.Material} stone - Primary warm stone.
	 * @param {THREE.Material} edge - Pale cap stone.
	 * @param {THREE.Material} basalt - Dark inset material.
	 * @returns {void} - Colonnade geometry is queued for batching.
	 */
	_colonnade(bearing, stone, edge, basalt) {
		const radius = 380, top = this._skylineHeight(bearing, 229);
		for (let index = -3; index <= 3; index++) {
			const angle = bearing + index * 3.8 * 229 / radius, height = this._skylineHeight(bearing + index * 3.8, 229);
			this._cylinder(3.6, height - 5, this._radial(angle, radius, (height - 5) / 2), stone);
			this._box([9.8, 3, 9.8], this._radial(angle, radius, height - 1.5), angle, edge);
			this._box([7.2, 2, 7.2], this._radial(angle, radius, height - 5), angle, basalt);
		}
		this._landmarks.push({name: 'seven-column-colonnade', azimuthDegrees: bearing % 360, radiusMeters: radius, topMeters: top});
	}

	/** Build a four-tier stepped tower at closest approach.
	 * @param {number} bearing - Landmark bearing, degrees.
	 * @param {THREE.Material} stone - Primary warm stone.
	 * @param {THREE.Material} edge - Pale cap stone.
	 * @param {THREE.Material} basalt - Dark inset material.
	 * @param {THREE.Material} brass - Restrained metallic trim.
	 * @returns {void} - Tower geometry is queued for batching.
	 */
	_tower(bearing, stone, edge, basalt, brass) {
		const radius = 395, top = this._skylineHeight(bearing, 238);
		for (let tier = 0; tier < 4; tier++) {
			const width = 50 - tier * 10, height = top / 4;
			this._box([width, height, width * 0.65], this._radial(bearing, radius, height * (tier + 0.5)), bearing, tier % 2 ? edge : stone);
			this._box([width + 1.8, 1.2, width * 0.65 + 1.8], this._radial(bearing, radius, height * (tier + 1) - 1), bearing, tier === 3 ? brass : basalt);
			this._box([2.4, height * 0.7, 0.7], this._radial(bearing, radius - width * 0.325 - 0.4, height * (tier + 0.5)), bearing, basalt);
		}
		this._landmarks.push({name: 'stepped-meridian-tower', azimuthDegrees: bearing % 360, radiusMeters: radius, topMeters: top});
	}

	/** Build three offset open arches and their low terraces.
	 * @param {number} bearing - Landmark bearing, degrees.
	 * @param {THREE.Material} stone - Primary warm stone.
	 * @param {THREE.Material} edge - Pale cap stone.
	 * @param {THREE.Material} basalt - Dark inset material.
	 * @returns {void} - Open arch geometry is queued for batching.
	 */
	_arches(bearing, stone, edge, basalt) {
		const radius = 370, top = this._skylineHeight(bearing, 232);
		for (let index = -1; index <= 1; index++) {
			const angle = bearing + index * 7 * 232 / radius, depth = radius + index * 7, height = this._skylineHeight(bearing + index * 7, 232 + index * 7) - Math.abs(index) * 4;
			const archRadius = 10, spring = height - archRadius - 1.7;
			for (const side of [-1, 1]) this._box([3.4, spring, 6], this._radial(angle + side * Math.asin(archRadius / depth) * 180 / Math.PI, depth, spring / 2), angle, stone);
			const arch = new THREE.TorusGeometry(archRadius / 1000, 1.7 / 1000, 8, 32, Math.PI);
			arch.rotateY(-angle * Math.PI / 180);
			const center = this._radial(angle, depth, spring);
			arch.translate(center[0] / 1000, center[1] / 1000, center[2] / 1000);
			this._part(arch, edge);
			this._box([27, 3, 17], this._radial(angle, depth, 1.5), angle, basalt);
		}
		this._landmarks.push({name: 'three-offset-arches', azimuthDegrees: bearing % 360, radiusMeters: radius, topMeters: top});
	}

	/** Merge opaque geometry by material to bound draw calls without changing its shape.
	 * @returns {void} - Original temporary geometry is released after successful merging.
	 */
	_batch() {
		for (const collection of [this._parts, this._floorParts]) for (const [material, parts] of collection) {
			const geometry = mergeGeometries(parts, false);
			if (!geometry) throw new Error('Film scene geometry could not be merged.');
			for (const part of parts) part.dispose();
			const mesh = new THREE.Mesh(geometry, material);
			mesh.castShadow = collection === this._parts;
			mesh.receiveShadow = true;
			mesh.name = `film-observatory-material-${this._meshes.length}`;
			this.scene.add(mesh);
			this._meshes.push(mesh);
			for (const attribute of Object.values(geometry.attributes)) this._geometryBytes += attribute.array.byteLength;
			this._geometryBytes += geometry.index?.array.byteLength ?? 0;
		}
		this._parts.clear();
		this._floorParts.clear();
	}

	/** Set the shared camera only after the caller has published its exact frame.
	 * @param {LocalSunFilmCameraSample} pose - Validated director output for the published physical source.
	 * @returns {void} - The next celestial render refreshes bindings from this camera.
	 */
	applyCamera(pose) {
		if (this._disposed) throw new Error('Film scene is disposed.');
		if (!Number.isFinite(pose.filmSeconds) || pose.filmSeconds < 0 || pose.filmSeconds > 90 || !Number.isFinite(pose.verticalFieldOfViewDegrees) || pose.verticalFieldOfViewDegrees < FILM_CIRCUIT_FOV_DEGREES || pose.verticalFieldOfViewDegrees > FILM_BOOKEND_FOV_DEGREES || [...pose.cameraMeters, ...pose.targetScene].some(value => !Number.isFinite(value))) throw new RangeError('Film camera pose must be a finite director sample.');
		this.camera.position.set(pose.cameraMeters[0] / 1000, pose.cameraMeters[1] / 1000, pose.cameraMeters[2] / 1000);
		this.camera.fov = pose.verticalFieldOfViewDegrees;
		this.camera.lookAt(...pose.targetScene);
		this.camera.updateProjectionMatrix();
		this.camera.updateMatrixWorld(true);
		this._pose = {...pose, cameraMeters: [...pose.cameraMeters], targetScene: [...pose.targetScene]};
	}

	/** Borrow the persistent scene for one unpublished or published physical frame.
	 * @param {LocalSunRotationOwners} owners - Exact owners retained by the caller's frame lease.
	 * @returns {LocalSunShellFrameScene} - Staging-safe view; disposal never disposes the persistent owner.
	 */
	borrow(owners) {
		if (this._disposed) throw new Error('Cannot borrow a disposed film scene.');
		let disposed = false;
		/** @type {LocalSunFilmPendingLight|null} */
		let pending = null;
		this._borrowers++;
		return {scene: this.scene, camera: this.camera,
			setLighting: (frameOwners, receiver, directionToSource) => {
				if (disposed || frameOwners !== owners) throw new Error('Film borrower requires its live exact frame owners.');
				pending = {owners, receiver, directionToSource};
			},
			prepare: renderer => {
				if (disposed) throw new Error('Film borrower is disposed.');
				if (!this._prepared) this._prepared = renderer.compileAsync(this.scene, this.camera).then(() => undefined).catch(error => {this._prepared = null; throw error;});
				return this._prepared;
			},
			render: (renderer, view, composer) => {
				if (disposed || !pending || !this._pose) throw new Error('Film borrower requires a live published camera and light packet.');
				this._applyLighting(pending);
				this._render(renderer, view, composer);
			},
			dispose: () => {if (disposed) return; disposed = true; pending = null; this._borrowers--;},
		};
	}

	/** Apply exact finite-source direction at the shared shadow focus immediately before draw.
	 * @param {LocalSunFilmPendingLight} pending - Live exact frame and declared presentation receiver packet.
	 * @returns {void} - Updated spectral lights and approximation measurement.
	 */
	_applyLighting(pending) {
		if (this._disposed) throw new Error('Film scene is disposed.');
		const {owners, receiver, directionToSource} = pending;
		this.lighting.updateFromDistantSun(directionToSource, receiver, owners.facade.config.config.color);
		const source = owners.geometry.mapModelPositionToObserverLocalScenePoint(owners.source.configuration.position, {sceneScale: {value: 1000, units: 'meters-per-scene-unit'}}).coordinates;
		const light = this.lighting.directionalLight;
		const focus = light.target.position;
		const direction = new THREE.Vector3(source[0], source[1], source[2]).sub(focus).normalize();
		light.position.copy(focus).addScaledVector(direction, Math.max(1, this._shadowExtentMeters / 500));
		light.userData.directionToSource = direction.toArray();
		light.userData.lightingPolicy = 'measured-receiver-spectrum-shared-finite-source-focus-v1';
		light.shadow.needsUpdate = true;
		this._sourceScene = [source[0], source[1], source[2]];
		this._receiverIdentity = receiver.identity;
		let maximum = 0;
		// The entire authored scene lies inside these bounds, including the
		// three-kilometer ground disc. The corners conservatively cover it.
		for (const east of [-3, 3]) for (const south of [-3, 3]) for (const up of [0, 0.3]) {
			const local = new THREE.Vector3(source[0] - east, source[1] - up, source[2] - south).normalize();
			maximum = Math.max(maximum, Math.acos(Math.max(-1, Math.min(1, direction.dot(local)))) * 180 / Math.PI);
		}
		this._directionError = Math.max(this._directionError ?? 0, maximum);
	}

	/** Render ordinary opaque surfaces followed by existing atmosphere/celestial composition.
	 * @param {THREE.WebGLRenderer} renderer - Borrowed film renderer.
	 * @param {LocalSunControlViewPass} view - Exact prepared spectral view pass.
	 * @param {ShaderRuntimeComposer} composer - Matching depth/hit and celestial collaborators.
	 * @returns {void} - Prior render target restored, while final pixels remain on the canvas.
	 */
	_render(renderer, view, composer) {
		const previous = renderer.getRenderTarget();
		try {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFShadowMap;
			renderer.shadowMap.needsUpdate = true;
			renderer.setRenderTarget(this.colorTarget);
			renderer.clear();
			renderer.render(this.scene, this.camera);
			for (const pass of composer.passes) {
				if (pass === view) continue;
				if (pass instanceof CelestialGenerationPass) {pass.render(renderer); continue;}
				if (!(pass instanceof SceneInputCapture)) throw new Error('Unexpected film scene composition collaborator.');
				pass.capture(/** @type {SceneInputCaptureRenderer} */ (/** @type {unknown} */ (renderer)));
			}
			view.renderToScreen = true;
			view.render(renderer, null, {texture: this.colorTarget.texture});
		} finally {renderer.setRenderTarget(previous);}
	}

	/** Admit persistent geometry, color/depth targets and conservative shared-shadow storage.
	 * @returns {number} - Upper bound in bytes; includes CPU/GPU geometry copies and shadow map/depth/pass allowance.
	 */
	resourceBounds() {
		return this._geometryBytes * 2 + this.colorTarget.width * this.colorTarget.height * 20 + 4096 * 4096 * 12 + 1024 * 1024;
	}

	/** Report construction, resources, latest camera and measured lighting facts.
	 * @returns {LocalSunFilmSceneDescription} - Detached serializable provenance and approximation facts.
	 */
	describe() {
		return {identity: 'circular-meridian-observatory-v5', seed: this._seed, construction: {...this._construction}, landmarks: this._landmarks.map(value => ({...value})), meshCount: this._meshes.length, geometryBytes: this._geometryBytes, persistentBytes: this.resourceBounds(), disposed: this._disposed, filmSeconds: this._pose?.filmSeconds ?? null, lighting: this.lighting.describe(), maximumDirectionErrorDegrees: this._directionError, sourceScene: this._sourceScene ? [...this._sourceScene] : null, receiverIdentity: this._receiverIdentity};
	}

	/** Dispose film-owned resources after all borrowed frame leases have ended.
	 * @returns {void} - Idempotent resource release.
	 * @throws {Error} A frame still owns a borrowed scene lease.
	 */
	dispose() {
		if (this._disposed) return;
		if (this._borrowers !== 0) throw new Error('Release all film scene borrowers before disposing the persistent owner.');
		this._disposed = true;
		this.lighting.dispose();
		this.colorTarget.dispose();
		for (const mesh of this._meshes) mesh.geometry.dispose();
		for (const material of this._materials) material.dispose();
		this.scene.clear();
	}
}
