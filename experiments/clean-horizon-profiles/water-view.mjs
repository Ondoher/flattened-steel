import * as THREE from 'three';

/** Apply a reversible static water material to the existing ground receiver.
 * @param {any} app - Current contained application.
 * @param {any} water - Frozen map identities and material parameters.
 * @returns {Promise<{facts:any,restore:()=>void}>} Actual maps/UV witnesses and cleanup.
 */
export async function installWater(app, water) {
	if (!water) return {facts: null, restore() {}};
	const ground = app._endpointScene._meshes.find(m => m.userData.algorithm32EndpointRole === 'geometry-ground-visual');
	if (!ground || !ground.material.isMeshLambertMaterial) throw Error('Expected the existing matte ground receiver');
	const geometry = ground.geometry, material = ground.material;
	const loader = new THREE.TextureLoader();
	const maps = await Promise.all([loader.loadAsync(water.color.url), loader.loadAsync(water.normal.url)]);
	const [color, normal] = maps;
	try {
		if (color.image.width !== normal.image.width || color.image.height !== normal.image.height) throw Error('Water map dimensions differ');
		color.colorSpace = THREE.SRGBColorSpace;
		normal.colorSpace = THREE.NoColorSpace;
		for (const map of maps) {
			map.wrapS = map.wrapT = THREE.RepeatWrapping;
			map.minFilter = THREE.LinearMipmapLinearFilter;
			map.magFilter = THREE.LinearFilter;
			map.anisotropy = app._sceneRuntime.renderer.capabilities.getMaxAnisotropy();
			map.needsUpdate = true;
		}
		const width = water.tileWidthMeters, height = width * color.image.height / color.image.width;
		const texturedGeometry = geometry.clone(), positions = geometry.attributes.position;
		const uv = new Float32Array(positions.count * 2), point = new THREE.Vector3();
		ground.updateWorldMatrix(true, false);
		for (let i = 0; i < positions.count; i++) {
			point.fromBufferAttribute(positions, i).applyMatrix4(ground.matrixWorld);
			uv[i * 2] = point.x * 1000 / width;
			uv[i * 2 + 1] = -point.z * 1000 / height;
		}
		texturedGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
		const textured = material.clone();
		textured.color.set(0xffffff);
		textured.map = color;
		textured.normalMap = normal;
		textured.normalScale.set(water.normalStrength, water.normalStrength);
		textured.needsUpdate = true;
		if (!positions.array.every((v, i) => v === texturedGeometry.attributes.position.array[i]) ||
			!geometry.index.array.every((v, i) => v === texturedGeometry.index.array[i])) throw Error('Water changed ground vertex positions or indices');
		ground.geometry = texturedGeometry;
		ground.material = textured;
		const facts = {
			...water, dimensions: [color.image.width, color.image.height], tileHeightMeters: height,
			groundName: ground.name, materialType: textured.type, vertexPositionsAndIndicesUnchanged: true,
			uvProjection: 'World x/-z, 1000 meters per scene unit; same tile aspect as source image',
			colorSpace: color.colorSpace, normalColorSpace: normal.colorSpace,
			wrap: [color.wrapS, color.wrapT], anisotropy: color.anisotropy,
			colorAttached: textured.map === color, normalAttached: textured.normalMap === normal,
		};
		return {facts, restore() {ground.geometry = geometry; ground.material = material; texturedGeometry.dispose(); textured.dispose(); maps.forEach(m => m.dispose());}};
	} catch (error) {
		maps.forEach(m => m.dispose());
		throw error;
	}
}
