(function installS9SharedPacketShaderHook() {
	'use strict';

	const fail = (value, message) => {
		if (!value) throw new Error(message);
	};
	const prototype = WebGL2RenderingContext.prototype;
	const original = {
		activeTexture: prototype.activeTexture,
		bindTexture: prototype.bindTexture,
		drawArrays: prototype.drawArrays,
		drawArraysInstanced: prototype.drawArraysInstanced,
		drawElements: prototype.drawElements,
		drawElementsInstanced: prototype.drawElementsInstanced,
		getUniformLocation: prototype.getUniformLocation,
		linkProgram: prototype.linkProgram,
		shaderSource: prototype.shaderSource,
		uniform1i: prototype.uniform1i,
		uniform3fv: prototype.uniform3fv,
		useProgram: prototype.useProgram,
	};
	const transformedShaders = new WeakSet();
	const transformedPrograms = new WeakMap();
	const currentPrograms = new WeakMap();
	const fallbackAssets = new WeakMap();
	let assets = null;
	let enabled = false;
	let state = {
		sceneOrdinal: 60,
		directionToSunModel: [0, -1, 0],
		qualityIntervalCount: 10,
	};
	const diagnostics = {
		fragmentCandidates: 0,
		transformedShaders: 0,
		linkedPrograms: 0,
		boundDraws: 0,
		transformErrors: [],
	};

	function transformFragmentSource(source) {
		if (
			!source.includes('uniform sampler2DArray uDistantSunSceneCumulativeCache;') ||
			!source.includes('SpectralValue sampleCumulativeScatteringDensity(')
		) {
			return null;
		}
		diagnostics.fragmentCandidates += 1;
		let output = source.replace(
			'uniform sampler2DArray uDistantSunSceneCumulativeCache;',
			`uniform sampler2DArray uDistantSunSceneCumulativeCache;
uniform sampler2DArray uDistantSunSharedBlockAtlas;
uniform highp usampler2D uDistantSunSharedRowAddress;
uniform highp isampler2D uDistantSunSharedLedger;
uniform int uDistantSunSharedEnabled;
uniform int uDistantSunSharedSceneOrdinal;
uniform vec3 uDistantSunSharedDirection;`,
		);
		output = output.replace(
			/return normalize\(uDistantSunDirection\);/u,
			'return normalize(uDistantSunSharedEnabled != 0 ? uDistantSunSharedDirection : uDistantSunDirection);',
		);
		output = output.replace(
			/int distantScenePackedRow\(int altitudeIndex, int solarZenithIndex\) \{[\s\S]*?\n\}\n\nvec3 distantSceneLeastAlignedAxis/u,
			`int distantScenePackedRow(int altitudeIndex, int solarZenithIndex) {
	if (uDistantSunSharedEnabled != 0) {
		ivec3 row = texelFetch(
			uDistantSunSharedLedger,
			ivec2(altitudeIndex, uDistantSunSharedSceneOrdinal),
			0
		).rgb;
		if (solarZenithIndex < row.x || solarZenithIndex > row.y) return -1;
		return row.z + solarZenithIndex - row.x;
	}
	int firstZenith = DISTANT_SCENE_FIRST_ZENITH[altitudeIndex];
	int lastZenith = DISTANT_SCENE_LAST_ZENITH[altitudeIndex];
	if (solarZenithIndex < firstZenith || solarZenithIndex > lastZenith) return -1;
	return DISTANT_SCENE_FIRST_PACKED_ROW[altitudeIndex] + solarZenithIndex - firstZenith;
}

vec3 distantSceneLeastAlignedAxis`,
		);
		output = output.replace(
			`float atlasY = (directionCoordinate.z + 0.5) / 27.0;
		float atlasLayer = float(packedRows[rowTap]);`,
			`float atlasY = (directionCoordinate.z + 0.5) / 27.0;
		float atlasLayer = float(packedRows[rowTap]);
		if (uDistantSunSharedEnabled != 0) {
			uvec2 sharedAddress = texelFetch(
				uDistantSunSharedRowAddress,
				ivec2(packedRows[rowTap], uDistantSunSharedSceneOrdinal),
				0
			).rg;
			atlasY = (float(sharedAddress.y * 27u) + directionCoordinate.z + 0.5) / 1728.0;
			atlasLayer = float(sharedAddress.x);
		}`,
		);
		// Use a direct, auditable rewrite for the four generated production packet statements.
		for (const packet of [
			['density0', 'faceOffset + directionCoordinate.y + 0.5'],
			['density1', '162.0 + faceOffset + directionCoordinate.y + 0.5'],
			['density2', '324.0 + faceOffset + directionCoordinate.y + 0.5'],
			['density3', '486.0 + faceOffset + directionCoordinate.y + 0.5'],
		]) {
			const [density, x] = packet;
			const productionLine = `${density} += weight * texture(uDistantSunSceneCumulativeCache, vec3((${x}) / 648.0, atlasY, atlasLayer));`;
			output = output.replace(
				productionLine,
				`${density} += weight * (uDistantSunSharedEnabled != 0
			? texture(uDistantSunSharedBlockAtlas, vec3((${x}) / 648.0, atlasY, atlasLayer))
			: texture(uDistantSunSceneCumulativeCache, vec3((${x}) / 648.0, atlasY, atlasLayer)));`,
			);
		}

		const required = [
			'uniform sampler2DArray uDistantSunSharedBlockAtlas;',
			'ivec3 row = texelFetch(',
			'uvec2 sharedAddress = texelFetch(',
			'? texture(uDistantSunSharedBlockAtlas',
		];
		fail(required.every((token) => output.includes(token)), 'S9 shader transformation missed a required boundary.');
		fail(!output.includes('weight * texture(uDistantSunSceneCumulativeCache'), 'S9 packet lines were not all transformed.');
		return output;
	}

	prototype.shaderSource = function shaderSource(shader, source) {
		try {
			const transformed = transformFragmentSource(source);
			if (transformed !== null) {
				transformedShaders.add(shader);
				diagnostics.transformedShaders += 1;
				return original.shaderSource.call(this, shader, transformed);
			}
		} catch (error) {
			diagnostics.transformErrors.push(error instanceof Error ? error.message : String(error));
			throw error;
		}
		return original.shaderSource.call(this, shader, source);
	};

	prototype.linkProgram = function linkProgram(program) {
		const shaders = this.getAttachedShaders(program) ?? [];
		const transformed = shaders.some((shader) => transformedShaders.has(shader));
		const result = original.linkProgram.call(this, program);
		if (transformed && this.getProgramParameter(program, this.LINK_STATUS)) {
			const names = [
				'uDistantSunSharedBlockAtlas',
				'uDistantSunSharedRowAddress',
				'uDistantSunSharedLedger',
				'uDistantSunSharedEnabled',
				'uDistantSunSharedSceneOrdinal',
				'uDistantSunSharedDirection',
				'uTransportPathIntervalCount',
			];
			const locations = Object.fromEntries(
				names.map((name) => [name, original.getUniformLocation.call(this, program, name)]),
			);
			transformedPrograms.set(program, {locations});
			diagnostics.linkedPrograms += 1;
		}
		return result;
	};

	prototype.useProgram = function useProgram(program) {
		currentPrograms.set(this, program);
		return original.useProgram.call(this, program);
	};

	function createFallbackAssets(gl) {
		const previousActive = gl.getParameter(gl.ACTIVE_TEXTURE);
		const maximumUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
		const units = {atlas: maximumUnits - 3, rowAddress: maximumUnits - 2, ledger: maximumUnits - 1};
		const atlas = gl.createTexture();
		original.activeTexture.call(gl, gl.TEXTURE0 + units.atlas);
		original.bindTexture.call(gl, gl.TEXTURE_2D_ARRAY, atlas);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA32F, 1, 1, 1);
		const rowAddress = gl.createTexture();
		original.activeTexture.call(gl, gl.TEXTURE0 + units.rowAddress);
		original.bindTexture.call(gl, gl.TEXTURE_2D, rowAddress);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16UI, 1, 1);
		const ledger = gl.createTexture();
		original.activeTexture.call(gl, gl.TEXTURE0 + units.ledger);
		original.bindTexture.call(gl, gl.TEXTURE_2D, ledger);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32I, 1, 1);
		original.activeTexture.call(gl, previousActive);
		return {context: gl, atlas, rowAddress, ledger, units};
	}

	function assetsFor(gl) {
		if (assets) return assets;
		let fallback = fallbackAssets.get(gl);
		if (!fallback) {
			fallback = createFallbackAssets(gl);
			fallbackAssets.set(gl, fallback);
		}
		return fallback;
	}

	function prepareSharedDraw(gl) {
		const program = currentPrograms.get(gl);
		const entry = program ? transformedPrograms.get(program) : null;
		if (!entry) return;
		const locations = entry.locations;
		const boundAssets = assetsFor(gl);
		original.uniform1i.call(gl, locations.uDistantSunSharedEnabled, enabled && assets ? 1 : 0);
		if (enabled && assets) {
			fail(assets.context === gl, 'S9 shared assets belong to another WebGL context.');
			original.uniform1i.call(gl, locations.uDistantSunSharedSceneOrdinal, state.sceneOrdinal);
			original.uniform3fv.call(gl, locations.uDistantSunSharedDirection, state.directionToSunModel);
			original.uniform1i.call(gl, locations.uTransportPathIntervalCount, state.qualityIntervalCount);
		}
		const previousActive = gl.getParameter(gl.ACTIVE_TEXTURE);
		for (const binding of [
			{unit: boundAssets.units.atlas, target: gl.TEXTURE_2D_ARRAY, texture: boundAssets.atlas, location: locations.uDistantSunSharedBlockAtlas},
			{unit: boundAssets.units.rowAddress, target: gl.TEXTURE_2D, texture: boundAssets.rowAddress, location: locations.uDistantSunSharedRowAddress},
			{unit: boundAssets.units.ledger, target: gl.TEXTURE_2D, texture: boundAssets.ledger, location: locations.uDistantSunSharedLedger},
		]) {
			original.activeTexture.call(gl, gl.TEXTURE0 + binding.unit);
			original.bindTexture.call(gl, binding.target, binding.texture);
			original.uniform1i.call(gl, binding.location, binding.unit);
		}
		original.activeTexture.call(gl, previousActive);
		diagnostics.boundDraws += 1;
	}

	for (const name of ['drawArrays', 'drawArraysInstanced', 'drawElements', 'drawElementsInstanced']) {
		prototype[name] = function s9SharedDraw(...arguments_) {
			prepareSharedDraw(this);
			return original[name].apply(this, arguments_);
		};
	}

	window.__s9SharedPacketShader = {
		installAssets(value) {
			fail(value?.context && value?.atlas && value?.rowAddress && value?.ledger, 'Invalid S9 shared asset set.');
			assets = value;
		},
		setEnabled(value) {
			enabled = value === true;
		},
		setState(value) {
			fail(Number.isInteger(value.sceneOrdinal), 'S9 scene ordinal must be an integer.');
			fail(value.directionToSunModel?.length === 3, 'S9 direction must contain three values.');
			fail(Number.isInteger(value.qualityIntervalCount), 'S9 quality interval count must be an integer.');
			state = {
				sceneOrdinal: value.sceneOrdinal,
				directionToSunModel: [...value.directionToSunModel],
				qualityIntervalCount: value.qualityIntervalCount,
			};
		},
		diagnostics() {
			return {...diagnostics, enabled, state: {...state}, assetsInstalled: assets !== null};
		},
	};
})();
