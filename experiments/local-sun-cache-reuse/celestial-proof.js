import * as THREE from 'three';
import {flatStarDirection, createFlatStarGeometry} from './flat-star-geometry.js';
import {STELLAR_ONE_PIXEL_PRESENTATION} from '../../src/algorithm32/implementation/star-field/StellarPointPresentation.js';
import SceneMath from '../../src/algorithm32/math/SceneMath.js';

/** Render and read a small diagnostic using the actual selected helper source.
 * @param {THREE.WebGLRenderer} renderer - Borrowed live renderer.
 * @param {string} fragment - Complete diagnostic GLSL, no version directive.
 * @param {THREE.RawShaderMaterial['uniforms']} uniforms - Borrowed matching inputs.
 * @param {number} width - Output columns.
 * @param {number} height - Output rows.
 * @returns {Promise<Float32Array>} - RGBA32F values, bottom-left order.
 */
export async function readCelestialShader(renderer, fragment, uniforms, width, height) {
	if (fragment.includes('struct StellarPresentationSample') && fragment.includes('evaluateScreenPaletteCelestialRadiance(state)')) {
		if (fragment.split('void main(){').length !== 2) throw new Error('Ambiguous diagnostic main.');
		fragment = fragment.replace('void main(){', 'void main(){StellarPresentationSample diagnosticStellarPresentation;')
			.replaceAll('evaluateScreenPaletteCelestialRadiance(state)', 'evaluateScreenPaletteCelestialRadiance(state, diagnosticStellarPresentation)');
	}
	const previous = renderer.getRenderTarget(),
		target = new THREE.WebGLRenderTarget(width, height, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
		});
	const material = new THREE.RawShaderMaterial({
		glslVersion: THREE.GLSL3,
		vertexShader: 'precision highp float;in vec3 position;void main(){gl_Position=vec4(position.xy,0.0,1.0);}',
		fragmentShader: fragment,
		uniforms,
		depthTest: false,
		depthWrite: false,
	});
	const geometry = new THREE.PlaneGeometry(2, 2),
		scene = new THREE.Scene();
	scene.add(new THREE.Mesh(geometry, material));
	try {
		await renderer.compileAsync(scene, new THREE.Camera());
		renderer.setRenderTarget(target);
		renderer.render(scene, new THREE.Camera());
		const values = new Float32Array(width * height * 4);
		renderer.readRenderTargetPixels(target, 0, 0, width, height, values);
		if (values.some((v) => !Number.isFinite(v))) throw new Error('Nonfinite celestial diagnostic.');
		return values;
	} finally {
		renderer.setRenderTarget(previous);
		target.dispose();
		material.dispose();
		geometry.dispose();
	}
}

/** Check the actual celestial consumer's Native15 transmission, Sun and scene mask.
 * @param {LocalSunShellPublishedFrame} frame - Complete exact-state frame.
 * @param {THREE.WebGLRenderer} renderer - Borrowed renderer.
 * @returns {Promise<LocalSunCelestialTransportProof>} - Measured binary32/binary64 comparisons.
 */
export async function proveCelestialTransport(frame, renderer) {
	const material = /** @type {THREE.RawShaderMaterial} */ (
			/** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */ (
				frame.viewPass
			).material
		),
		main = material.fragmentShader.lastIndexOf('void main()');
	if (main < 0) throw new Error('Missing actual assembled main.');
	const center = material.uniforms.uSunScreenCenterPixels.value,
		viewport = material.uniforms.uViewportSizePixels.value;
	const c = Array.isArray(center) ? center : [center.x, center.y],
		v = Array.isArray(viewport) ? viewport : [viewport.x, viewport.y];
	if (Math.hypot(c[0] - v[0] / 2, c[1] - v[1] / 2) > 0.01)
		throw new Error('Sun-facing projection missed the image centre.');
	const direction = frame.directionToSource,
		mu = direction[2],
		originUniform = material.uniforms.uCameraWorldPositionMeters.value,
		origin = Array.isArray(originUniform) ? originUniform : [originUniform.x, originUniform.y, originUniform.z],
		source = `${material.fragmentShader.slice(0, main)}
 void main(){int c=int(gl_FragCoord.x),row=int(gl_FragCoord.y);ShaderState state=createInitialShaderState(vec2(${c[0] / v[0]},${c[1] / v[1]}));
 state.sceneHitMask=0.0;state.ray.originMeters=uCameraWorldPositionMeters;float mu=row==0?${mu}:row==1?1.0:row==2?0.01745240643728351:0.0;
 state.ray.direction=vec3(sqrt(max(0.0,1.0-mu*mu)),0.0,mu);
 state.bounds=resolveAtmospherePath(state.ray,0.0,false);evaluatePathRadiance(state);SpectralValue t=state.transmittance;
 if(c==15){outColor=vec4(state.bounds.endDistanceMeters,state.ray.originMeters.z+mu*state.bounds.endDistanceMeters,sampleSunCoverageTile(state),1.0);return;}
 SpectralValue light=evaluateScreenPaletteCelestialRadiance(state);state.sceneHitMask=1.0;SpectralValue blocked=evaluateScreenPaletteCelestialRadiance(state);
 outColor=vec4(t.channels[c],light.channels[c],blocked.channels[c],sampleSunCoverageTile(state));}`;
	if (material.fragmentShader.includes('flatCelestialTransmissionToTop'))
		throw new Error('Unexpected separate celestial transmission override.');
	const values = await readCelestialShader(renderer, source, material.uniforms, 16, 4),
		rows = [];
	let maxAbsolute = 0,
		maxRelative = 0;
	for (let row = 0; row < 4; row++) {
		const cosine = [mu, 1, Math.sin(Math.PI / 180), 0][row];
		const segment = frame.owners.geometry.resolveViewRaySegment({
			origin: {coordinates: origin, units: 'meters'},
			direction: [Math.sqrt(Math.max(0, 1 - cosine * cosine)), 0, cosine],
		}),
			endDistanceMeters = segment.endDistance.value,
			endAltitudeMeters = origin[2] + cosine * endDistanceMeters,
			endpointOffset = (row * 16 + 15) * 4,
			gpuEndDistanceMeters = values[endpointOffset],
			gpuEndAltitudeMeters = values[endpointOffset + 1];
		if (gpuEndDistanceMeters < 0 || gpuEndAltitudeMeters < 0 ||
			gpuEndAltitudeMeters > frame.owners.geometry.configuration.topAltitude.value + 0.02)
			throw new Error('GPU ray termination is outside the admitted atmosphere.');
		// Isolate transport from the unchanged geometry's binary32 intersection
		// rounding. Keep both endpoints as observations; evaluate CPU attenuation
		// over the actual GPU segment rather than silently substituting a new one.
		const cpu = frame.owners.model.atmosphere.integrateOpticalDepth({
			start: {altitude: {value: origin[2], units: 'meters'}},
			end: {altitude: {value: gpuEndAltitudeMeters, units: 'meters'}},
			length: {value: gpuEndDistanceMeters, units: 'meters'},
			blockedByGround: false,
		}).transmittance.values;
		const gpu = [];
		for (let channel = 0; channel < 15; channel++) {
			const offset = (row * 16 + channel) * 4,
				actual = values[offset],
				expected = cpu[channel];
			gpu.push(actual);
			maxAbsolute = Math.max(maxAbsolute, Math.abs(actual - expected));
			if (expected > 1e-20) maxRelative = Math.max(maxRelative, Math.abs(actual - expected) / expected);
			if (values[offset + 2] !== 0) throw new Error('Scene-hit celestial masking failed.');
			if (
				row === 0 &&
				Math.abs(
					values[offset + 1] -
						actual *
							values[offset + 3] *
							frame.owners.source.celestialSourceDefinition.surfaceRadiance.values[channel],
				) > Math.max(1e-5, Math.abs(values[offset + 1]) * 3e-5)
			)
				throw new Error('Finite Sun radiance is not coverage times one transmission.');
		}
		rows.push({cosine, endDistanceMeters, endAltitudeMeters, gpuEndDistanceMeters, gpuEndAltitudeMeters, cpu: Array.from(cpu), gpu});
	}
	if (maxAbsolute > 3e-6 || maxRelative > 3e-5 || values[3] <= 0)
		throw new Error('Celestial spectral/coverage proof failed.');
	const sun =
			/** @type {import('../../src/algorithm32/rendering-runtime/three/SunDiskTileGenerationPass.js').SunDiskTileGenerationPass} */ (
				frame.celestial.generation._sun
			),
		o = frame.owners.geometry.configuration.observerPosition.coordinates,
		p = frame.source.position.coordinates;
	const distance = Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2] - 5),
		radius =
			(Math.tan(Math.asin(frame.owners.source.celestialSourceDefinition.radius.value / distance)) *
				Math.abs(frame.celestial.camera.projectionMatrix.elements[5]) *
				v[1]) /
			2;
	const actualRadius = sun._uniforms.uSunRadiusPixels.value;
	if (Math.abs(radius - actualRadius) > 1e-6) throw new Error('Finite Sun angular-size projection failed.');
	return {
		rows,
		maxAbsolute,
		maxRelative,
		sunCenterPixels: c,
		sunCenterCoverage: values[3],
		radiusPixels: actualRadius,
		expectedRadiusPixels: radius,
		sceneMask: 'zero-all-Native15',
		scope: 'shared consumer and actual view transport; CPU analytic transmission over measured GPU segment; CPU/GPU geometry endpoints informative; source, zenith, one-degree and horizontal rays',
	};
}

/** Verify a real captured opaque mesh hides the Sun in the actual consumer.
 * @param {LocalSunShellPublishedFrame} frame - Sun-facing live frame.
 * @param {THREE.WebGLRenderer} renderer - Borrowed renderer.
 * @returns {Promise<boolean>} - True only after captured masking and restored sky.
 */
export async function proveCelestialSceneOcclusion(frame, renderer) {
	const pass =
			/** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */ (
				frame.viewPass
			),
		capture = pass._sceneInputCapture;
	if (!capture || !frame.celestial) throw new Error('Missing scene capture owner.');
	const scene = /** @type {LocalSunCelestialSceneCapture} */ (/** @type {unknown} */ (capture))._scene,
		camera = frame.celestial.camera,
		geometry = new THREE.PlaneGeometry(0.02, 0.02),
		material = new THREE.MeshBasicMaterial({color: 0}),
		mesh = new THREE.Mesh(geometry, material);
	mesh.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.05));
	mesh.quaternion.copy(camera.quaternion);
	scene.add(mesh);
	const source = /** @type {THREE.RawShaderMaterial} */ (pass.material),
		prefix = source.fragmentShader.slice(0, source.fragmentShader.lastIndexOf('void main()'));
	try {
		capture.capture(/** @type {SceneInputCaptureRenderer} */ (/** @type {unknown} */ (renderer)));
		frame.celestial.render();
		const result = await readCelestialShader(
			renderer,
			`${prefix}void main(){ShaderState state=createInitialShaderState(vec2(0.5));state.ray.originMeters=vec3(0.0,0.0,5.0);state.ray.direction=vec3(0.0,0.0,1.0);SpectralValue light=evaluateScreenPaletteCelestialRadiance(state);outColor=vec4(state.sceneHitMask,light.channels[int(gl_FragCoord.x)],0.0,1.0);}`,
			source.uniforms,
			15,
			1,
		);
		for (let c = 0; c < 15; c++)
			if (result[c * 4] !== 1 || result[c * 4 + 1] !== 0)
				throw new Error('Captured scene did not mask every celestial channel.');
		return true;
	} finally {
		scene.remove(mesh);
		geometry.dispose();
		material.dispose();
		capture.capture(/** @type {SceneInputCaptureRenderer} */ (/** @type {unknown} */ (renderer)));
		frame.celestial.render();
	}
}

/** Compare GPU flat mapping and every generated stellar pixel/palette against CPU values.
 * @param {LocalSunShellPublishedFrame} frame - Live combined frame.
 * @param {THREE.WebGLRenderer} renderer - Borrowed renderer.
 * @param {import('../../src/algorithm32/implementation/star-field/StellarPointSetSource.js').StellarPointSetSource} stars - Immutable source.
 * @param {LocalSunFlatStarPolicy} policy - Explicit dome/rotation choice.
 * @param {boolean} [allowEmpty] - Explicit camera trial may admit catalog-wide verified zero visibility; ordinary qualification requires occupied pixels.
 * @returns {Promise<LocalSunCelestialStarProof>} - Catalog-wide operational comparisons.
 */
export async function proveFlatStars(frame, renderer, stars, policy, allowEmpty = false) {
	if (!frame.celestial) throw new Error('Missing joint celestial generation.');
	const joint = frame.celestial.generation,
		stellar =
			/** @type {import('../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js').StellarScreenPaletteGenerationPass} */ (
				joint._stellar
			);
	const pair = stellar._activePair,
		table = stars.createStellarGenerationSourceTable();
	if (!pair) throw new Error('Missing active stellar pair.');
	const member = table.copyMemberValues(),
		spectra = table.copySpectralValues(),
		count = table.layout.memberCount,
		width = pair.screenIndexTarget.width,
		height = pair.screenIndexTarget.height;
	const viewport = renderer.getDrawingBufferSize(new THREE.Vector2());
	if (width !== viewport.x || height !== viewport.y) throw new Error('Stellar raster and drawing buffer dimensions disagree.');
	const cameraPosition = frame.celestial.camera.getWorldPosition(new THREE.Vector3()),
		observer = frame.owners.geometry.mapObserverLocalScenePointToModelPosition(
			SceneMath.positionInSceneUnits([cameraPosition.x, cameraPosition.y, cameraPosition.z]),
			{sceneScale: {value: 1000, units: 'meters-per-scene-unit'}},
		).coordinates;
	const geometry = createFlatStarGeometry(policy, observer).createStellarGenerationShaderContribution({
		observation: frame.observation,
	});
	const fragment = `precision highp float;precision highp int;precision highp sampler2D;uniform sampler2D uStellarSourceMembers;
 ${geometry.uniforms.map((u) => 'uniform ' + u.type + ' ' + u.name + ';').join('\n')}
 ${geometry.source}
 out vec4 outColor;void main(){int i=int(gl_FragCoord.x);vec3 d=texelFetch(uStellarSourceMembers,ivec2(i,0),0).xyz;
 StellarProjectionResult p=stellarProjectCatalogDirection(d);int row=int(gl_FragCoord.y);outColor=row==0 ? vec4(p.localDirectionEastNorthUp,1.0):row==1?vec4(vec2(p.topLeftPixel),p.occupied?1.0:0.0,1.0):vec4(p.ndc,0.0,1.0);}`;
	const projected = await readCelestialShader(renderer, fragment, stellar._pointUniforms, count, 3),
		indices = new Uint16Array(width * height),
		palette = new Float32Array((count + 1) * 16);
	renderer.readRenderTargetPixels(pair.screenIndexTarget, 0, 0, width, height, indices);
	renderer.readRenderTargetPixels(pair.paletteTarget, 0, 0, count + 1, 16, palette);
	/** @type {Map<number,number[]>} */ const bins = new Map();
	let maxDirectionDifference = 0,
		maxPixelDifference = 0,
		maxProjectedPixelDifference = 0,
		worst = null;
	const camera = frame.celestial.camera;
	camera.updateMatrixWorld();
	const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
	for (let i = 0; i < count; i++) {
		const local = flatStarDirection(
				Array.from(member.slice(i * 4, i * 4 + 3)),
				frame.observation,
				policy,
				observer,
			),
			clip = new THREE.Vector4(local[0], local[2], -local[1], 0).applyMatrix4(matrix);
		const x = ((clip.x / clip.w + 1) * width) / 2,
			y = ((1 - clip.y / clip.w) * height) / 2;
		for (let c = 0; c < 3; c++) {
			const difference = Math.abs(local[c] - projected[i * 4 + c]);
			if (difference > maxDirectionDifference) {
				maxDirectionDifference = difference;
				worst = {
					member: i,
					canonical: Array.from(member.slice(i * 4, i * 4 + 3)),
					cpu: local,
					gpu: Array.from(projected.slice(i * 4, i * 4 + 3)),
				};
			}
		}
		const offset = (count + i) * 4,
			visible = local[2] > 0 && clip.w > 0 && x >= 0 && y >= 0 && x < width && y < height,
			gpuVisible = projected[offset + 2] === 1;
		if (visible !== gpuVisible) throw new Error('CPU/GPU stellar visibility mismatch at member ' + i);
		if (!visible) continue;
		const ndcOffset = (2 * count + i) * 4;
		maxProjectedPixelDifference = Math.max(
			maxProjectedPixelDifference,
			Math.abs(x - ((projected[ndcOffset] + 1) * width) / 2),
			Math.abs(y - ((1 - projected[ndcOffset + 1]) * height) / 2),
		);
		maxPixelDifference = Math.max(
			maxPixelDifference,
			Math.abs(Math.floor(x) - projected[offset]),
			Math.abs(Math.floor(y) - projected[offset + 1]),
		);
		// GPU projected pixels are authoritative for collision sums. Separate CPU
		// comparisons above expose any float boundary movement rather than hiding it.
		const pixel = (height - 1 - projected[offset + 1]) * width + projected[offset],
			list = bins.get(pixel) ?? [];
		list.push(i);
		bins.set(pixel, list);
	}
	let maxPaletteRelative = 0,
		collisions = 0,
		brightestPixel = -1,
		brightestValue = 0;
	for (const [pixel, list] of bins) {
		const owner = list[0] + 1;
		if (indices[pixel] !== owner) throw new Error('Canonical stellar pixel owner mismatch.');
		if (list.length > 1) collisions++;
		for (let c = 0; c < 15; c++) {
			const expected = list.reduce(
					(sum, i) =>
						sum + spectra[c * count + i] * STELLAR_ONE_PIXEL_PRESENTATION.irradianceToBoundaryRadianceScale,
					0,
				),
				actual = palette[c * (count + 1) + owner];
			maxPaletteRelative = Math.max(maxPaletteRelative, Math.abs(actual - expected) / Math.max(expected, 1e-30));
			if (actual > brightestValue && Math.abs((pixel % width) - width / 2) > 3) {
				brightestValue = actual;
				brightestPixel = pixel;
			}
		}
		const magnitude = -2.5 * Math.log10(list.reduce((sum, i) => sum + 10 ** (-0.4 * member[i * 4 + 3]), 0));
		if (Math.abs(palette[15 * (count + 1) + owner] - magnitude) > 1e-4)
			throw new Error('Collision magnitude aggregation failed.');
	}
	let occupied = 0;
	for (let p = 0; p < indices.length; p++)
		if (indices[p]) {
			occupied++;
			if (!bins.has(p)) throw new Error('Unexpected occupied stellar pixel.');
		}
	// Require subpixel agreement in the actual selected raster. GLSL graphics
	// transcendentals need not reproduce binary64 libm within a few ulps.
	// Adjacent floor results at an integer boundary are reported separately.
	if (!occupied && allowEmpty && bins.size === 0) {
		for (let c = 0; c < 15; c++)
			if (palette[c * (count + 1)] !== 0) throw new Error('Empty stellar palette sentinel is not zero.');
		return {
			catalogCount: count, occupiedPixels: 0, collisionPixels: 0, emptyView: true,
			maxDirectionDifference, maxPixelDifference, maxProjectedPixelDifference, maxPaletteRelative,
			maxConsumerRelative: null, consumerSpectrum: [], sourceIdentity: table.identity, policy,
			scope: 'all catalog CPU/GPU directions and zero visibility; every screen index and Native15 empty palette sentinel is zero; no occupied-pixel palette or consumer probe',
		};
	}
	if (!occupied || maxProjectedPixelDifference > 0.1 || maxPixelDifference > 1 || maxPaletteRelative > 1e-5)
		throw new Error(
			'Flat stellar mapping/aggregation proof failed: ' +
				JSON.stringify({
					occupied,
					maxDirectionDifference,
					maxProjectedPixelDifference,
					maxPixelDifference,
					maxPaletteRelative,
					worst,
				}),
		);
	if (brightestPixel < 0) throw new Error('Missing isolated stellar consumer probe.');
	const x = brightestPixel % width,
		y = Math.floor(brightestPixel / width);
	const material = /** @type {THREE.RawShaderMaterial} */ (
			/** @type {import('../../src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js').ShaderRuntimePass} */ (
				frame.viewPass
			).material
		),
		prefix = material.fragmentShader.slice(0, material.fragmentShader.lastIndexOf('void main()'));
	const transported = await readCelestialShader(
		renderer,
		`${prefix}void main(){int c=int(gl_FragCoord.x);ShaderState state=createInitialShaderState(vec2(${(x + 0.5) / width},${(y + 0.5) / height}));state.sceneHitMask=0.0;state.ray=reconstructViewRay(state.textureCoordinates);state.bounds=resolveAtmospherePath(state.ray,0.0,false);evaluatePathRadiance(state);SpectralValue t=state.transmittance;SpectralValue light=evaluateScreenPaletteCelestialRadiance(state);uint index=texelFetch(uStellarScreenIndex,ivec2(${x},${y}),0).r;outColor=vec4(t.channels[c],light.channels[c],texelFetch(uStellarPalette,ivec2(int(index),c),0).r,sampleSunCoverageTile(state));}`,
		material.uniforms,
		15,
		1,
	);
	let maxConsumerRelative = 0;
	const consumerSpectrum = [];
	for (let c = 0; c < 15; c++) {
		const expected = transported[c * 4] * transported[c * 4 + 2];
		maxConsumerRelative = Math.max(
			maxConsumerRelative,
			Math.abs(transported[c * 4 + 1] - expected) / Math.max(expected, 1e-30),
		);
		consumerSpectrum.push(transported[c * 4 + 1]);
		if (transported[c * 4 + 3] !== 0) throw new Error('Stellar probe overlaps Sun.');
	}
	if (maxConsumerRelative > 3e-5 || !consumerSpectrum.some((v) => v > 0))
		throw new Error('Actual stellar consumer did not apply boundary radiance and transmission once.');
	return {
		catalogCount: count,
		occupiedPixels: occupied,
		collisionPixels: collisions,
		emptyView: false,
		maxDirectionDifference,
		maxPixelDifference,
		maxProjectedPixelDifference,
		maxPaletteRelative,
		maxConsumerRelative,
		consumerSpectrum,
		consumerPixel: [x, y],
		consumerMagnitude: palette[15 * (count + 1) + indices[brightestPixel]],
		sourceIdentity: table.identity,
		policy,
		scope: 'all catalog directions, visibility, pixel assignment, Native15 collision sums and magnitude row',
	};
}

/** Render an explicitly non-radiometric occupancy diagnostic of actual GPU stellar pixels.
 * @param {LocalSunShellPublishedFrame} frame - Combined generation owner.
 * @param {THREE.WebGLRenderer} renderer - Borrowed renderer.
 * @returns {string} - PNG data URL; white means occupied, not perceived brightness.
 */
export function stellarOccupancyImage(frame, renderer) {
	const stellar =
			/** @type {import('../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js').StellarScreenPaletteGenerationPass} */ (
				frame.celestial.generation._stellar
			),
		pair = stellar._activePair;
	if (!pair) throw new Error('Missing stellar occupancy.');
	const width = pair.screenIndexTarget.width, height = pair.screenIndexTarget.height,
		indices = new Uint16Array(width * height);
	renderer.readRenderTargetPixels(pair.screenIndexTarget, 0, 0, width, height, indices);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Missing occupancy canvas.');
	const pixels = context.createImageData(width, height);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const output = ((height - 1 - y) * width + x) * 4,
				value = indices[y * width + x] ? 255 : 0;
			pixels.data.set([value, value, value, 255], output);
		}
	context.putImageData(pixels, 0, 0);
	return canvas.toDataURL('image/png');
}

/** Check invalidation, failed staging and replacement on the actual shared GPU owners.
 * @param {LocalSunShellPublishedFrame} frame - Last combined frame, after image capture.
 * @param {THREE.WebGLRenderer} renderer - Borrowed renderer.
 * @returns {LocalSunCelestialLifecycleProof} - Required bounded lifecycle dispositions.
 */
export function proveCelestialLifecycle(frame, renderer) {
	if (!frame.celestial) throw new Error('Missing lifecycle owner.');
	const joint = frame.celestial.generation,
		stellar =
			/** @type {import('../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js').StellarScreenPaletteGenerationPass} */ (
				joint._stellar
			);
	if (!stellar) throw new Error('Combined lifecycle requires stars.');
	// The preview restores its camera pose after the last drawn frame. First
	// publish that restored view, then test a second identical invocation.
	joint.render(renderer);
	const table = stellar._sourceTable,
		textures = stellar._sourceTextures,
		before = stellar.getDiagnostics(),
		first = stellar.publicationState.active?.id;
	joint.render(renderer);
	if (
		stellar.publicationState.active?.id !== first ||
		stellar.getDiagnostics().generationCount !== before.generationCount
	)
		throw new Error('Compatible celestial generation was not reused.');
	const next = {...frame.observation, instant: new Date(Date.parse(frame.observation.instant) + 60000).toISOString()};
	joint.setObservation(next);
	if (joint.publicationState.active !== null) throw new Error('Dirty joint state remained consumable.');
	const zero = joint.consumerBindingValues();
	if (
		zero['runtime.celestial.stellarScreenIndex'] !== stellar._zeroScreenIndexTexture ||
		zero['runtime.celestial.sunScreenCenterPixels'][0] !== -1000000
	)
		throw new Error('Dirty joint output was not exact-zero.');
	joint.render(renderer);
	if (
		stellar.publicationState.active?.id === first ||
		!joint.publicationState.active ||
		stellar._sourceTable !== table ||
		stellar._sourceTextures !== textures
	)
		throw new Error('Observation update failed or rebuilt static stellar input.');
	const priorPair = stellar._activePair,
		prior = stellar.publicationState.active?.id,
		render = renderer.render;
	try {
		joint.markDirty('view');
		renderer.render = function (scene, camera) {
			if (scene === stellar._paletteScene)
				throw new Error('Selected proof fault after stellar index, before palette publication.');
			return render.call(this, scene, camera);
		};
		joint.render(renderer);
	} finally {
		renderer.render = render;
	}
	if (
		stellar._activePair !== priorPair ||
		stellar.publicationState.active?.id !== prior ||
		joint.publicationState.active !== null ||
		stellar._stagingPair !== null
	)
		throw new Error('Failed staging did not retain old pair with zero incompatible publication.');
	joint.render(renderer);
	if (!joint.publicationState.active) throw new Error('Failed generation recovery did not publish.');
	const camera = frame.celestial.camera,
		position = camera.position.clone(),
		beforeTranslation = stellar.publicationState.active?.id;
	camera.position.x += 0.001;
	joint.render(renderer);
	if (stellar.publicationState.active?.id === beforeTranslation)
		throw new Error('Camera parallax did not replace stellar output.');
	camera.position.copy(position);
	joint.render(renderer);
	const width = stellar._activePair.screenIndexTarget.width, height = stellar._activePair.screenIndexTarget.height,
		resizedWidth = Math.max(1, Math.floor(width / 2)), resizedHeight = Math.max(1, Math.floor(height / 2));
	joint.setSize(resizedWidth, resizedHeight);
	if (joint.publicationState.active !== null) throw new Error('Resize did not invalidate joint publication.');
	joint.render(renderer);
	if (stellar._activePair?.screenIndexTarget.width !== resizedWidth || stellar._activePair.screenIndexTarget.height !== resizedHeight) throw new Error('Resize replacement failed.');
	joint.setSize(width, height);
	joint.render(renderer);
	joint.handleContextLoss();
	if (joint.publicationState.active !== null || stellar._activePair !== null)
		throw new Error('Context callback did not retire publication.');
	joint.handleContextRestoration();
	joint.render(renderer);
	if (!joint.publicationState.active) throw new Error('Restoration did not regenerate.');
	joint.setObservation(frame.observation);
	joint.render(renderer);
	return {
		compatibleReuse: true,
		observationReplacement: true,
		staticInputsReused: true,
		dirtyZero: true,
		failedStagingRollback: true,
		resizeReplacement: true,
		contextCallbackRecovery: true,
		cameraParallaxReplacement: true,
		diagnostics: stellar.getDiagnostics(),
		scope: 'real child resources and joint publication; simulated draw failure and context callbacks, not OS device loss',
	};
}
