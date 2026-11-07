import * as THREE from 'three';
import {FiniteGroundObject} from './FiniteGroundObject.mjs';
import {createPass, floatTarget, checkDraw} from './three-pass.mjs';
import {DomeCacheResource} from './DomeCacheResource.mjs';
import {capHeight} from './geometry.mjs';

/**
 * Runs actual Three scene capture and the existing production fullscreen runtime
 * with the updated physical dome fragment shader and retained cumulative cache.
 */
export class DomeSceneRenderer {
	/**
	 * Creates camera, finite ground, and a shader pass sharing the cache context.
	 *
	 * @param {DomeThreeRenderer} renderer - Shared hardware renderer.
	 * @param {DomeCacheResource} cache - Completed live field, owned by caller.
	 * @param {DomeSceneRequest} request - Frozen physical/render inputs.
	 */
	constructor(renderer, cache, request) {
		this.renderer = renderer;
		this.cache = cache;
		this.request = request;
		this.camera = new THREE.PerspectiveCamera(
			(2 * Math.atan(720 / 1280) * 180) / Math.PI,
			1280 / 720,
			0.1,
			request.diskRadius * 2.2,
		);
		this.camera.position.set(0, request.origin[2], 0);
		this.camera.up.set(0, 1, 0);
		this.scene = new THREE.Scene();
		this.cameraUniforms = {
			uInverseProjectionMatrix: {value: this.camera.projectionMatrixInverse},
			uInverseViewMatrix: {value: this.camera.matrixWorld},
			uCameraWorldPositionMeters: {value: new THREE.Vector3(...request.origin)},
			uViewportSizePixels: {value: new THREE.Vector2(request.width, request.height)},
			uDistanceInside: {value: request.distanceInside},
		};
		this.ground = new FiniteGroundObject(request, this.cameraUniforms);
		this.scene.add(this.ground);
		/** @type {DomeThreeUniforms} */
		this.uniforms = {
			...cache.uniforms(),
			...this.cameraUniforms,
			uSceneHitDistance: {value: null},
			uDiagnostic: {value: 0},
			uGroup: {value: 0},
			uDisableCache: {value: 0},
			uVacuum: {value: 0},
		};
		this.pass = createPass(request.shaders.scene, this.uniforms, request.width, request.height);
	}

	/**
	 * Reconstructs the independent expected pixel direction in physical map axes.
	 *
	 * @param {number} sign - Heading sign.
	 * @param {number} x - Column.
	 * @param {number} y - Bottom-origin row.
	 * @param {number} width - Full width.
	 * @param {number} height - Full height.
	 * @returns {number[]} - Unit ray direction.
	 */
	_pixelDirection(sign, x, y, width, height) {
		const vector = [sign, -sign * ((2 * (x + 0.5)) / width - 1), (((2 * (y + 0.5)) / height - 1) * height) / width];
		const length = Math.hypot(...vector);
		return vector.map((v) => v / length);
	}

	/**
	 * Captures real ground-object fragments as FP32 hit/distance/material input.
	 *
	 * @param {number} width - Full-frame width.
	 * @param {number} height - Full-frame height.
	 * @returns {Promise<{target: DomeThreeTarget, calls: number, milliseconds: number}>} - Scene input and measured draw evidence.
	 */
	async _captureGround(width, height) {
		const target = floatTarget(width, height);
		const start = performance.now();
		await this.renderer.compileAsync(this.scene, this.camera);
		this.renderer.setRenderTarget(target);
		this.renderer.setClearColor(0, 0);
		this.renderer.clear();
		this.renderer.render(this.scene, this.camera);
		this.renderer.getContext().finish();
		if (this.renderer.getContext().getError() !== this.renderer.getContext().NO_ERROR) {
			target.dispose();
			throw new Error('Ground capture draw failed.');
		}
		const calls = this.renderer.info.render.calls;
		if (calls !== 1 || !this.ground.isMesh) {
			throw new Error('The real ground mesh did not participate in capture.');
		}
		return {target, calls, milliseconds: performance.now() - start};
	}

	/**
	 * Renders one camera orientation, optionally only a native-scale crop band.
	 *
	 * @param {string} name - Direct artifact basename.
	 * @param {number} sign - Outward +1 or inward -1.
	 * @param {number} width - Full projection width.
	 * @param {number} height - Full projection height.
	 * @param {number} [cropY] - Bottom-origin crop start.
	 * @param {number} [cropHeight] - Crop height without changing projection.
	 * @returns {Promise<Record<string, unknown>>} - Actual render and resource evidence.
	 */
	async render(name, sign, width, height, cropY = 0, cropHeight = height) {
		const started = performance.now();
		this.camera.aspect = width / height;
		this.camera.lookAt(sign, this.request.origin[2], 0);
		this.camera.updateProjectionMatrix();
		this.camera.updateMatrixWorld(true);
		this.cameraUniforms.uViewportSizePixels.value = new THREE.Vector2(width, height);
		this.pass.setSize(width, height);
		const capture = await this._captureGround(width, height);
		const output = floatTarget(width, height);
		this.uniforms.uSceneHitDistance.value = capture.target.texture;
		this.uniforms.uDiagnostic.value = 0;
		this.uniforms.uDisableCache.value = 0;
		const compileStart = performance.now();
		try {
			await this.pass.prepare(this.renderer);
			const compilationMilliseconds = performance.now() - compileStart;
			output.scissorTest = true;
			const renderStart = performance.now();
			let maximumTileMilliseconds = 0;
			for (let row = cropY; row < cropY + cropHeight; row += 4) {
				const tileStart = performance.now();
				output.scissor.set(0, row, width, Math.min(4, cropY + cropHeight - row));
				this.pass.render(this.renderer, output);
				checkDraw(this.renderer, this.pass);
				maximumTileMilliseconds = Math.max(maximumTileMilliseconds, performance.now() - tileStart);
				if ((row - cropY) % 32 === 0) {
					await window.domeProgress('scene-render', `${name}: ${row - cropY}/${cropHeight} rows.`, {
						completed: row - cropY,
						total: cropHeight,
					});
					await new Promise((resolve) => setTimeout(resolve, 0));
				}
			}
			const renderingMilliseconds = performance.now() - renderStart;
			const values = new Float32Array(width * cropHeight * 4);
			this.renderer.readRenderTargetPixels(output, 0, cropY, width, cropHeight, values);
			const rgba = new Uint8Array(values.length);
			let nonfinite = 0,
				missingPixels = 0;
			for (let y = 0; y < cropHeight; y++) {
				for (let x = 0; x < width; x++) {
					for (let c = 0; c < 4; c++) {
						const value = values[(y * width + x) * 4 + c];
						nonfinite += Number(!Number.isFinite(value));
						missingPixels += Number(c === 3 && value !== 1);
						rgba[((cropHeight - 1 - y) * width + x) * 4 + c] = Math.round(
							Math.max(0, Math.min(1, value)) * 255,
						);
					}
				}
			}
			if (nonfinite > 0 || missingPixels > 0) {
				throw new Error('Rendered image contains nonfinite or undrawn pixels.');
			}
			await window.domeArtifact(`${name}.png`, {width, height: cropHeight, rgba: Array.from(rgba)});
			const diagnostics = await this._diagnostics(
				sign,
				width,
				height,
				output,
				capture.target,
				values,
				cropY,
				cropHeight,
			);
			const result = {
				name,
				width,
				height,
				cropY,
				cropHeight,
				heading: sign,
				groundDrawCalls: capture.calls,
				groundCaptureMilliseconds: capture.milliseconds,
				compilationMilliseconds,
				renderingMilliseconds,
				maximumTileMilliseconds,
				totalMilliseconds: performance.now() - started,
				nonfinite,
				cameraMatrixWorld: this.camera.matrixWorld.toArray(),
				projectionMatrix: this.camera.projectionMatrix.toArray(),
				cacheIdentity: this.cache.identity,
				retainedCacheBytes: this.cache.metadata.retainedTextureBytes,
				targetBytes: width * height * 16 * 2,
				diagnostics,
			};
			await window.domeArtifact(`${name}-metadata.json`, result);
			return result;
		} finally {
			output.dispose();
			capture.target.dispose();
		}
	}

	/**
	 * Samples exact GPU pixels and verifies spectral, interval and capture contracts.
	 *
	 * @param {number} sign - Physical heading.
	 * @param {number} width - Full width.
	 * @param {number} height - Full height.
	 * @param {DomeThreeTarget} output - Shader target.
	 * @param {DomeThreeTarget} capture - Actual mesh capture.
	 * @param {Float32Array} displayed - Original displayed crop before diagnostics overwrite.
	 * @param {number} cropY - First crop row.
	 * @param {number} cropHeight - Crop row count.
	 * @returns {Promise<Record<string, unknown>[]>} - Per-pixel physical data.
	 */
	async _diagnostics(sign, width, height, output, capture, displayed, cropY, cropHeight) {
		const middle = Math.floor(width / 2);
		const points = [
			[middle, Math.floor(height / 2)],
			[middle, Math.floor(height / 2) - 6],
			[middle, Math.floor(height / 2) - 7],
			[middle, Math.floor(height / 2) - 10],
			[middle, Math.floor((400 * height) / 720)],
			[Math.floor((100 * width) / 1280), Math.floor((400 * height) / 720)],
			[Math.floor((1179 * width) / 1280), Math.floor((400 * height) / 720)],
			[middle, Math.floor((700 * height) / 720)],
			[middle, Math.floor((10 * height) / 720)],
		].filter(([, y]) => y >= cropY && y < cropY + cropHeight);
		const records = [];
		for (const [x, y] of points) {
			const hit = new Float32Array(4);
			this.renderer.readRenderTargetPixels(capture, x, y, 1, 1, hit);
			const direction = this._pixelDirection(sign, x, y, width, height);
			let expectedDistance = direction[2] < 0 ? -this.request.origin[2] / direction[2] : 0;
			const localX = expectedDistance * direction[0],
				localY = expectedDistance * direction[1];
			const disk =
				(this.request.distanceInside - localX) *
					(2 * this.request.diskRadius - this.request.distanceInside + localX) -
				localY * localY;
			const expectedHit = expectedDistance > 0 && disk >= 0;
			if (!expectedHit) {
				expectedDistance = 0;
			}
			if (
				hit[1] > 0.5 !== expectedHit ||
				(expectedHit && Math.abs(hit[0] - expectedDistance) > Math.max(0.01, expectedDistance * 2e-5))
			) {
				throw new Error(`Ground input mismatch at ${x},${y}: ${Array.from(hit)}, expected${expectedDistance}.`);
			}
			const sample = async (mode, group = 0, disable = 0) => {
				this.uniforms.uDiagnostic.value = mode;
				this.uniforms.uGroup.value = group;
				this.uniforms.uDisableCache.value = disable;
				output.scissor.set(x, y, 1, 1);
				this.pass.render(this.renderer, output);
				checkDraw(this.renderer, this.pass);
				const v = new Float32Array(4);
				this.renderer.readRenderTargetPixels(output, x, y, 1, 1, v);
				return Array.from(v);
			};
			const actualDirection = await sample(4);
			if (Math.hypot(...direction.map((v, i) => v - actualDirection[i])) > 1e-6) {
				throw new Error('Camera reconstruction mismatch.');
			}
			const bounds = await sample(3);
			const air = [],
				transmission = [],
				radiance = [],
				withoutHigher = [];
			for (let g = 0; g < 4; g++) {
				air.push(...(await sample(1, g)));
				transmission.push(...(await sample(2, g)));
				radiance.push(...(await sample(5, g)));
				withoutHigher.push(...(await sample(1, g, 1)));
			}
			this.uniforms.uVacuum.value = 1;
			const vacuumRadiance = [];
			for (let g = 0; g < 4; g++) {
				vacuumRadiance.push(...(await sample(5, g)));
			}
			const vacuumDisplay = await sample(0);
			this.uniforms.uVacuum.value = 0;
			const offset = ((y - cropY) * width + x) * 4;
			records.push({
				x,
				y,
				direction,
				actualDirection,
				hit: Array.from(hit),
				expectedHit,
				expectedDistance,
				bounds,
				vacuumRadiance: vacuumRadiance.slice(0, 15),
				vacuumDisplay,
				air: air.slice(0, 15),
				transmission: transmission.slice(0, 15),
				radiance: radiance.slice(0, 15),
				withoutHigher: withoutHigher.slice(0, 15),
				displayed: Array.from(displayed.slice(offset, offset + 4)),
			});
		}
		this.uniforms.uDiagnostic.value = 0;
		this.uniforms.uDisableCache.value = 0;
		return records;
	}

	/**
	 * Checks camera-only uniforms and outside-entry geometry without producing
	 * additional scene images or rebuilding/reuploading the completed field.
	 *
	 * @returns {Promise<Record<string, unknown>[]>} - View/source/cache identity proof.
	 */
	async cameraProof() {
		const records = [];
		const height = this.request.origin[2];
		const outsideHeight = capHeight(Math.hypot(...this.request.origin.slice(0, 2))) + 10;
		const variants = [
			{name: 'base', height, fov: 90, sign: 1},
			{name: 'height', height: height + 1, fov: 90, sign: 1},
			{name: 'fov', height, fov: 80, sign: 1},
			{name: 'outside-outward', height: outsideHeight, fov: 90, sign: 1},
			{name: 'outside-inward', height: outsideHeight, fov: 90, sign: -1},
		];
		for (const variant of variants) {
			const started = performance.now();
			this.camera.position.y = variant.height;
			this.camera.fov = (2 * Math.atan((Math.tan((variant.fov * Math.PI) / 360) * 720) / 1280) * 180) / Math.PI;
			this.camera.lookAt(variant.sign, variant.height, 0);
			this.camera.updateProjectionMatrix();
			this.camera.updateMatrixWorld(true);
			this.cameraUniforms.uCameraWorldPositionMeters.value.set(this.request.origin[0], 0, variant.height);
			this.cameraUniforms.uViewportSizePixels.value = new THREE.Vector2(1280, 720);
			this.pass.setSize(1280, 720);
			const capture = await this._captureGround(1280, 720);
			const target = floatTarget(1280, 720);
			target.scissorTest = true;
			target.scissor.set(640, 360, 1, 1);
			try {
				this.uniforms.uSceneHitDistance.value = capture.target.texture;
				await this.pass.prepare(this.renderer);
				const get = (mode) => {
					this.uniforms.uDiagnostic.value = mode;
					this.uniforms.uGroup.value = 2;
					this.pass.render(this.renderer, target);
					checkDraw(this.renderer, this.pass);
					const value = new Float32Array(4);
					this.renderer.readRenderTargetPixels(target, 640, 360, 1, 1, value);
					return Array.from(value);
				};
				const direction = get(4),
					bounds = get(3),
					air = get(1);
				if (
					variant.name === 'outside-outward' &&
					(bounds[0] !== 0 || bounds[1] !== 0 || air.some((v) => v !== 0))
				) {
					throw new Error('Outward vacuum control failed.');
				}
				if (
					variant.name === 'outside-inward' &&
					!(bounds[0] > 0 && bounds[1] > bounds[0] && air.some((v) => v > 0))
				) {
					throw new Error('Outside-entry control failed.');
				}
				records.push({
					...variant,
					origin: [this.request.origin[0], 0, variant.height],
					direction,
					bounds,
					air,
					cacheIdentity: this.cache.identity,
					shaderIdentity: this.pass.getDiagnostics().sourceHash,
					milliseconds: performance.now() - started,
				});
			} finally {
				target.dispose();
				capture.target.dispose();
			}
		}
		this.camera.position.y = this.request.origin[2];
		this.camera.fov = (2 * Math.atan(720 / 1280) * 180) / Math.PI;
		this.cameraUniforms.uCameraWorldPositionMeters.value.set(
			this.request.origin[0],
			this.request.origin[1],
			this.request.origin[2],
		);
		this.uniforms.uDiagnostic.value = 0;
		await window.domeArtifact('camera-reuse.json', records);
		return records;
	}

	/**
	 * Releases scene resources; the session owner separately releases its cache.
	 *
	 * @returns {void} - Disposes pass and ground resources.
	 */
	dispose() {
		this.pass.dispose();
		this.ground.dispose();
	}
}
