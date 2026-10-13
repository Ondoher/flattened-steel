import * as THREE from 'three';
import {CanonicalValueHash} from '../../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {CelestialScreenPaletteConsumerShaderContribution} from '../../../../src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js';

/** Offline read-only comparison of the actual published stellar/Sun resources and ordinary consumer source. */
export class LocalSunP4CelestialProof {
	/** Called by comparisons to evaluate an owned diagnostic draw, preserving the renderer target.
	 *
	 * @param {THREE.WebGLRenderer} renderer - Borrowed actual application renderer.
	 * @param {string} fragmentShader - Owner-generated source plus a diagnostic main.
	 * @param {Record<string,THREE.IUniform>} uniforms - Exact typed input values.
	 * @param {number} width - Bounded diagnostic raster width.
	 * @param {number} height - Bounded diagnostic raster height.
	 * @returns {Float32Array} - Actual binary32 RGBA results.
	 */
	_draw(renderer, fragmentShader, uniforms, width, height) {
		const target = new THREE.WebGLRenderTarget(width, height, {
			type: THREE.FloatType,
			format: THREE.RGBAFormat,
			depthBuffer: false,
		});
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
		);
		const material = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3,
			vertexShader: 'precision highp float;in vec3 position;void main(){gl_Position=vec4(position,1.0);}',
			fragmentShader,
			uniforms,
			depthTest: false,
			depthWrite: false,
		});
		const scene = new THREE.Scene(),
			camera = new THREE.Camera();
		scene.add(new THREE.Mesh(geometry, material));
		const previous = renderer.getRenderTarget(),
			values = new Float32Array(width * height * 4);
		try {
			renderer.setRenderTarget(target);
			renderer.render(scene, camera);
			renderer.readRenderTargetPixels(target, 0, 0, width, height, values);
			if (
				values.some(
					/** Called by diagnostic readback to detect nonfinite components. */ (value) =>
						!Number.isFinite(value),
				)
			)
				throw new Error('P4 diagnostic shader returned nonfinite output.');
			return values;
		} finally {
			renderer.setRenderTarget(previous);
			geometry.dispose();
			material.dispose();
			target.dispose();
		}
	}
	/** Called by comparison to read a published resource without replacing or changing its texture.
	 *
	 * @param {THREE.WebGLRenderer} renderer - Actual owning renderer.
	 * @param {StellarScreenPaletteThreeOutputResource} resource - Published complete texture descriptor.
	 * @returns {Float32Array|Uint16Array} - Actual scalar values.
	 */
	_read(renderer, resource) {
		const gl =
			/**
			 *
			 * @type {WebGL2RenderingContext}
			 */ (renderer.getContext());
		const texture =
			/**
			 *
			 * @type {THREE.Texture}
			 */ (resource.texture);
		const native =
			/**
			 *
			 * @type {LocalSunP4TextureProperties}
			 */ (renderer.properties.get(texture)).__webglTexture;
		if (!native || resource.width * resource.height > 1024 * 1024)
			throw new Error('Published bounded celestial texture required.');
		const previous = gl.getParameter(gl.FRAMEBUFFER_BINDING),
			framebuffer = gl.createFramebuffer();
		const values =
			resource.format === 'R16UI'
				? new Uint16Array(resource.width * resource.height)
				: new Float32Array(resource.width * resource.height);
		try {
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, native, 0);
			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
				throw new Error('Published celestial readback framebuffer incomplete.');
			gl.readPixels(
				0,
				0,
				resource.width,
				resource.height,
				resource.format === 'R16UI' ? gl.RED_INTEGER : gl.RED,
				resource.format === 'R16UI' ? gl.UNSIGNED_SHORT : gl.FLOAT,
				values,
			);
			if (gl.getError() !== gl.NO_ERROR) throw new Error('Published celestial readback failed.');
			return values;
		} finally {
			gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
			gl.deleteFramebuffer(framebuffer);
		}
	}
	/** Call this method to compare every authenticated member and published collision sum to frozen controls.
	 *
	 * @param {LocalSunP4CelestialProofRequest} request - Actual complete frame, renderer/view, source and independent controls.
	 * @returns {LocalSunP4CelestialProofReport} - Catalog-wide mapping/palette and exact-zero coverage/consumer assertions.
	 */
	verify({frame, renderer, camera, geometry, stars, control, fixture, presentation}) {
		const diagnostics =
			/**
			 *
			 * @type {LocalSunP4ShaderDiagnosticSnapshot}
			 */ (frame.contents.getDiagnostics());
		const stellar = diagnostics.runtime.stellarGeneration.publicationState.active;
		const sun = diagnostics.runtime.celestialGeneration.sun.publicationState.active;
		if (stellar.completion !== 'complete' || sun.completion !== 'complete')
			throw new Error('Complete joint celestial resources required.');
		if (
			stellar.compatibility.presentationIdentity !==
			CanonicalValueHash.sha256Value({
				schema: 'stellar-screen-palette-presentation-compatibility-v1',
				...presentation,
			})
		)
			throw new Error('Published stellar presentation is not paired with the exact measured receiver.');
		const indexResource =
				/**
				 *
				 * @type {StellarScreenPaletteThreeOutputResource}
				 */ (stellar.screenIndex),
			paletteResource =
				/**
				 *
				 * @type {StellarScreenPaletteThreeOutputResource}
				 */ (stellar.palette);
		const table = stars.createStellarGenerationSourceTable(),
			members = table.copyMemberValues(),
			spectra = table.copySpectralValues();
		const count = table.layout.memberCount,
			width = indexResource.width,
			height = indexResource.height;
		if (
			count !== 2000 ||
			members.length !== fixture.members.length ||
			members.some(
				/** Called by authentication to compare each binary32 catalog component. */ (value, index) =>
					value !== fixture.members[index],
			)
		)
			throw new Error('Authenticated independent stellar member input mismatch.');
		if (JSON.stringify(control.observation) !== JSON.stringify(frame.contents.celestialInputs.observation))
			throw new Error('Predeclared celestial observation differs.');
		const contribution = geometry.createStellarGenerationShaderContribution({observation: control.observation});
		/** Actual geometry-stage uniform map.
		 *
		 * @type {Record<string,THREE.IUniform>}
		 */ const uniforms = {};
		for (const uniform of contribution.uniforms) {
			const value = uniform.defaultValue;
			uniforms[uniform.name] = {
				value:
					uniform.type === 'vec2' || uniform.type === 'ivec2'
						? new THREE.Vector2(
								.../**
								 *
								 * @type {[number,number]}
								 */ (value),
							)
						: uniform.type === 'vec3'
							? new THREE.Vector3(
									.../**
									 *
									 * @type {[number,number,number]}
									 */ (value),
								)
							: uniform.type === 'vec4'
								? new THREE.Vector4(
										.../**
										 *
										 * @type {[number,number,number,number]}
										 */ (value),
									)
								: uniform.type === 'mat4'
									? new THREE.Matrix4().fromArray(
											/**
											 *
											 * @type {number[]}
											 */ (value),
										)
									: value,
			};
		}
		camera.updateMatrixWorld(true);
		const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		uniforms.uStellarModelViewProjectionMatrix.value = matrix;
		uniforms.uStellarInverseProjectionMatrix.value = camera.projectionMatrixInverse;
		uniforms.uStellarViewportSize.value = new THREE.Vector2(width, height);
		const memberTexture = new THREE.DataTexture(members, count, 1, THREE.RGBAFormat, THREE.FloatType);
		memberTexture.needsUpdate = true;
		memberTexture.minFilter = THREE.NearestFilter;
		memberTexture.magFilter = THREE.NearestFilter;
		uniforms.uStellarSourceMembers = {value: memberTexture};
		const fragment =
			'precision highp float;precision highp int;precision highp sampler2D;uniform sampler2D uStellarSourceMembers;\n' +
			contribution.uniforms
				.map(
					/** Called by diagnostic assembly to declare geometry-owned uniforms. */ (uniform) =>
						'uniform ' + uniform.type + ' ' + uniform.name + ';',
				)
				.join('\n') +
			'\n' +
			contribution.source +
			'\nout vec4 outColor;void main(){int i=int(gl_FragCoord.x);vec3 d=texelFetch(uStellarSourceMembers,ivec2(i,0),0).xyz;StellarProjectionResult p=stellarProjectCatalogDirection(d);int row=int(gl_FragCoord.y);outColor=row==0?vec4(p.localDirectionEastNorthUp,1.0):row==1?vec4(vec2(p.topLeftPixel),p.occupied?1.0:0.0,1.0):vec4(p.ndc,0.0,1.0);}';
		let projected;
		try {
			projected = this._draw(renderer, fragment, uniforms, count, 3);
		} finally {
			memberTexture.dispose();
		}
		const indices =
				/**
				 *
				 * @type {Uint16Array}
				 */ (this._read(renderer, indexResource)),
			palette =
				/**
				 *
				 * @type {Float32Array}
				 */ (this._read(renderer, paletteResource));
		const bins = new Map();
		let maxDirectionAbsolute = 0,
			maxContinuousPixelAbsolute = 0,
			maxIntegerPixelAbsolute = 0,
			maxPaletteRelative = 0,
			collisionPixels = 0;
		for (let i = 0; i < count; i++) {
			const direction = control.expectedDirections[i],
				clip = new THREE.Vector4(direction[0], direction[2], -direction[1], 0).applyMatrix4(matrix);
			const x = ((clip.x / clip.w + 1) * width) / 2,
				y = ((1 - clip.y / clip.w) * height) / 2,
				visible = direction[2] > 0 && clip.w > 0 && x >= 0 && y >= 0 && x < width && y < height;
			for (let c = 0; c < 3; c++)
				maxDirectionAbsolute = Math.max(maxDirectionAbsolute, Math.abs(direction[c] - projected[i * 4 + c]));
			const pixelOffset = (count + i) * 4;
			if (visible !== (projected[pixelOffset + 2] === 1))
				throw new Error('Frozen CPU/GPU stellar visibility mismatch at member ' + i);
			if (!visible) continue;
			const ndcOffset = (count * 2 + i) * 4;
			maxContinuousPixelAbsolute = Math.max(
				maxContinuousPixelAbsolute,
				Math.abs(x - ((projected[ndcOffset] + 1) * width) / 2),
				Math.abs(y - ((1 - projected[ndcOffset + 1]) * height) / 2),
			);
			maxIntegerPixelAbsolute = Math.max(
				maxIntegerPixelAbsolute,
				Math.abs(Math.floor(x) - projected[pixelOffset]),
				Math.abs(Math.floor(y) - projected[pixelOffset + 1]),
			);
			const pixel = (height - 1 - projected[pixelOffset + 1]) * width + projected[pixelOffset],
				list = bins.get(pixel) ?? [];
			list.push(i);
			bins.set(pixel, list);
		}
		for (const [pixel, list] of bins) {
			const owner = list[0] + 1;
			if (indices[pixel] !== owner) throw new Error('Published stellar collision owner mismatch.');
			if (list.length > 1) collisionPixels++;
			for (let c = 0; c < 15; c++) {
				let expected = 0;
				for (const i of list)
					expected += spectra[c * count + i] * fixture.irradianceToBoundaryRadianceScale.value;
				maxPaletteRelative = Math.max(
					maxPaletteRelative,
					Math.abs(palette[c * (count + 1) + owner] - expected) / Math.max(expected, 1e-30),
				);
			}
			let flux = 0;
			for (const i of list) flux += 10 ** (-0.4 * members[i * 4 + 3]);
			if (Math.abs(palette[15 * (count + 1) + owner] + 2.5 * Math.log10(flux)) > fixture.gates.magnitudeAbsolute)
				throw new Error('Published stellar collision magnitude mismatch.');
		}
		let occupiedPixels = 0;
		for (let pixel = 0; pixel < indices.length; pixel++)
			if (indices[pixel]) {
				occupiedPixels++;
				if (!bins.has(pixel)) throw new Error('Unexpected published stellar pixel.');
			}
		if (
			!occupiedPixels ||
			maxContinuousPixelAbsolute > fixture.gates.continuousPixelAbsolute ||
			maxIntegerPixelAbsolute > fixture.gates.integerPixelAbsolute ||
			maxPaletteRelative > fixture.gates.paletteRelative
		)
			throw new Error(
				'P4 stellar projection/palette gate failed: ' +
					JSON.stringify({
						occupiedPixels,
						maxContinuousPixelAbsolute,
						maxIntegerPixelAbsolute,
						maxPaletteRelative,
					}),
			);
		const coverageResource =
				/**
				 *
				 * @type {StellarScreenPaletteThreeOutputResource}
				 */ (sun.coverage),
			coverage =
				/**
				 *
				 * @type {Float32Array}
				 */ (this._read(renderer, coverageResource));
		const sourceScene = geometry.mapModelPositionToObserverLocalScenePoint(
			frame.contents.celestialInputs.sourcePosition,
			{sceneScale: {value: 1000, units: 'meters-per-scene-unit'}},
		);
		const cameraPosition = camera.getWorldPosition(new THREE.Vector3()),
			distance = Math.hypot(
				sourceScene.coordinates[0] - cameraPosition.x,
				sourceScene.coordinates[1] - cameraPosition.y,
				sourceScene.coordinates[2] - cameraPosition.z,
			);
		const radius = Math.fround(
			(Math.tan(Math.asin(frame.contents.celestialInputs.sourceRadius.value / 1000 / distance)) *
				Math.abs(camera.projectionMatrix.elements[5]) *
				height) /
				2,
		);
		let disjointTexels = 0,
			positiveTexels = 0;
		for (let y = 0; y < coverageResource.height; y++)
			for (let x = 0; x < coverageResource.width; x++) {
				const value = coverage[y * coverageResource.width + x];
				if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid actual Sun coverage.');
				if (value > 0) positiveTexels++;
				const dx = Math.max(Math.abs((x + 0.5 - coverageResource.width / 2) / 16) - 0.5, 0),
					dy = Math.max(Math.abs((y + 0.5 - coverageResource.height / 2) / 16) - 0.5, 0);
				if (dx * dx + dy * dy >= radius * radius + 1e-5) {
					disjointTexels++;
					if (value !== 0) throw new Error('Actual disjoint Sun producer texel is nonzero.');
				}
			}
		if (!disjointTexels || !positiveTexels)
			throw new Error('Actual Sun coverage did not exercise both zero/nonzero support.');
		return {
			catalogCount: count,
			occupiedPixels,
			collisionPixels,
			maxDirectionAbsolute,
			maxContinuousPixelAbsolute,
			maxIntegerPixelAbsolute,
			maxPaletteRelative,
			disjointTexels,
			positiveTexels,
			consumer: this._consumer(
				renderer,
				indexResource,
				paletteResource,
				coverageResource,
				sun.surfaceRadiance,
				radius,
				bins,
				palette,
				width,
				height,
			),
		};
	}
	/** Called by qualification to verify the ordinary consumer's transmission, scene mask and filtered disjoint guard.
	 *
	 * @param {THREE.WebGLRenderer} renderer - Actual renderer.
	 * @param {StellarScreenPaletteThreeOutputResource} indexResource - Complete published index.
	 * @param {StellarScreenPaletteThreeOutputResource} paletteResource - Complete published palette.
	 * @param {StellarScreenPaletteThreeOutputResource} coverageResource - Complete Sun tile.
	 * @param {SpectralRadiancePacket} radiance - Actual declared source input.
	 * @param {number} radius - Physical projected radius in pixels.
	 * @param {Map<number,number[]>} bins - Verified occupied stellar pixels.
	 * @param {Float32Array} palette - Verified Native15 palette.
	 * @param {number} width - Actual raster width.
	 * @param {number} height - Actual raster height.
	 * @returns {LocalSunP4ConsumerProofReport} - Exact-mask and once-only transmission assertions.
	 */
	_consumer(
		renderer,
		indexResource,
		paletteResource,
		coverageResource,
		radiance,
		radius,
		bins,
		palette,
		width,
		height,
	) {
		const pixel = bins.keys().next().value,
			owner = paletteResource.width;
		const contribution = new CelestialScreenPaletteConsumerShaderContribution({
			includeStars: true,
			surfaceRadiance: radiance,
		}).createShaderContribution();
		const uniforms = {
			uViewportSizePixels: {value: new THREE.Vector2(width, height)},
			uSunCoverageTile: {value: coverageResource.texture},
			uStellarScreenIndex: {value: indexResource.texture},
			uStellarPalette: {value: paletteResource.texture},
			uSunScreenCenterPixels: {value: new THREE.Vector2(-1000000, -1000000)},
			uSunRadiusPixels: {value: radius},
			uSunTileResolution: {value: new THREE.Vector2(coverageResource.width, coverageResource.height)},
			uSunTileSamplesPerPixel: {value: 16},
			uSunSurfaceRadiance: {value: Array.from(radiance.values)},
		};
		const declarations = contribution.uniforms
			.map(
				/** Called by consumer assembly to declare scalar or array uniforms. */ (uniform) => {
					const bracket = uniform.type.indexOf('[');
					return (
						'uniform ' +
						(bracket < 0
							? uniform.type + ' ' + uniform.name
							: uniform.type.slice(0, bracket) + ' ' + uniform.name + uniform.type.slice(bracket)) +
						';'
					);
				},
			)
			.join('\n');
		const functions = contribution.functions
			.map(/** Called by consumer assembly to include the actual production functions. */ (block) => block.code)
			.join('\n');
		const shader =
			'precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;const int SPECTRAL_CHANNEL_COUNT=15;struct SpectralValue{float channels[15];};SpectralValue zeroSpectral(){SpectralValue s;for(int i=0;i<15;i++)s.channels[i]=0.0;return s;}struct ShaderState{vec2 textureCoordinates;float sceneHitMask;SpectralValue transmittance;};uniform vec2 uViewportSizePixels;uniform sampler2D uSunCoverageTile;uniform usampler2D uStellarScreenIndex;uniform sampler2D uStellarPalette;' +
			declarations +
			'\n' +
			functions +
			'\nout vec4 outColor;void main(){int c=int(gl_FragCoord.x),row=int(gl_FragCoord.y);ShaderState state;state.textureCoordinates=vec2(' +
			((pixel % width) + 0.5) / width +
			',' +
			(Math.floor(pixel / width) + 0.5) / height +
			');state.sceneHitMask=row==1?1.0:0.0;for(int i=0;i<15;i++)state.transmittance.channels[i]=float(i+1)/16.0;SpectralValue result=evaluateScreenPaletteCelestialRadiance(state);outColor=vec4(result.channels[c],0.0,0.0,1.0);}';
		const values = this._draw(renderer, shader, uniforms, 15, 2),
			index = bins.get(pixel)[0] + 1;
		let maxTransmissionRelative = 0;
		for (let c = 0; c < 15; c++) {
			const expected = (palette[c * owner + index] * (c + 1)) / 16;
			maxTransmissionRelative = Math.max(
				maxTransmissionRelative,
				Math.abs(values[c * 4] - expected) / Math.max(Math.abs(expected), 1e-30),
			);
			if (values[(15 + c) * 4] !== 0) throw new Error('Ordinary celestial scene mask leaked radiance.');
		}
		if (maxTransmissionRelative > 1e-5)
			throw new Error('Ordinary celestial consumer did not apply transmission once.');
		uniforms.uSunScreenCenterPixels.value.set(2, 2);
		const disjointShader =
			shader.slice(0, shader.indexOf('out vec4 outColor;')) +
			'out vec4 outColor;void main(){ShaderState s;s.textureCoordinates=vec2((2.0+uSunRadiusPixels+2.0)/uViewportSizePixels.x,2.0/uViewportSizePixels.y);outColor=vec4(sampleSunCoverageTile(s),0.0,0.0,1.0);}';
		if (this._draw(renderer, disjointShader, uniforms, 1, 1)[0] !== 0)
			throw new Error('Filtered ordinary Sun consumer illuminated a disjoint pixel.');
		return {maxTransmissionRelative, sceneMaskExactZero: true, filteredDisjointExactZero: true};
	}
}
