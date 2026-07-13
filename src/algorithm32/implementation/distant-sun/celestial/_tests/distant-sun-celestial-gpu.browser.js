import * as THREE from '../../../../../../node_modules/three/build/three.module.js';

import {CanonicalAtmosphere, DistantSunLightSource, SphericalEarthGeometry} from '../../../index.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../../canonical-atmosphere/consts.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../../cache/consts.js';
import {createNativeExecutionProfile} from '../../../../profiles/native-15/native-15-profile.js';
import {ShaderBuilder} from '../../../../rendering-runtime/ShaderBuilder.js';
import {ShaderContributions} from '../../../../shader-assembly/base/ShaderContributions.js';
import {ThreeCacheBackend} from '../../../three-cache-backend/ThreeCacheBackend.js';
import {SharedModel} from '../../../algorithm32/model/SharedModel.js';
import {DistantSunCelestialCpuCache} from '../DistantSunCelestialCpuCache.js';
import {DistantSunCelestialGpuBuilder} from '../DistantSunCelestialGpuBuilder.js';

const OBSERVATION = {
	instant: '2024-06-21T03:26:03.503Z',
	location: {
		latitude: {value: 0, units: /** @type {const} */ ('degrees')},
		longitude: {value: 0, units: /** @type {const} */ ('degrees')},
	},
};

/** Create one hardware-backed WebGL2 renderer. */
function createRenderer() {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
	});
	if (!context) throw new Error('Distant-Sun celestial GPU parity requires WebGL2.');
	if (!context.getExtension('EXT_color_buffer_float')) {
		throw new Error('Distant-Sun celestial GPU parity requires EXT_color_buffer_float.');
	}
	const renderer = new THREE.WebGLRenderer({canvas, context});
	renderer.debug.checkShaderErrors = true;
	renderer.setSize(11, 13, false);
	return {renderer, context};
}

/**
 * Create exact production owners and one geometry query.
 *
 * @param {number} [sourcePathIntervalCount] - Source-path transmittance interval count.
 * @param {number} [maximumScatteringOrder] - Maximum atmospheric scattering order.
 * @returns {object} - Configured celestial GPU owners and query facts.
 */
function createFixture(sourcePathIntervalCount = 20, maximumScatteringOrder = 4) {
	const atmosphere = new CanonicalAtmosphere({constants: CANONICAL_ATMOSPHERE_CONSTANTS});
	const source = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const domains = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION;
	const geometry = new SphericalEarthGeometry({
		bottomRadius: CANONICAL_ATMOSPHERE_CONSTANTS.bottomRadius,
		topRadius: CANONICAL_ATMOSPHERE_CONSTANTS.topRadius,
		observerHeight: {value: 2, units: 'meters'},
		observerUpDirection: [0, 0, 1],
		cacheAltitudeBinCount: domains.positionDomain.nodes.length,
		cacheBoundaryAltitude: domains.positionDomain.nodes.at(-1).coordinate,
		sourceTransmittanceIntervalCount: sourcePathIntervalCount,
	});
	geometry.configureLightSource({
		lightSource: source,
		observation: OBSERVATION,
		placement: {kind: 'distant-direction', directionToLight: [0, 1, 0]},
	});
	const roster = /** @type {SphericalSunStarsSourceRoster} */ ({
		id: 'distant-sun-celestial-gpu-browser-roster',
		family: 'spherical-sun-stars-radial-v1',
		sun: source,
		stars: null,
	});
	const profile = createNativeExecutionProfile({
		lightSource: source,
		atmosphere,
		geometry,
		groundBoundary: null,
		observation: OBSERVATION,
		celestialSources: roster,
		domains: {
			positions: domains.positionDomain,
			incomingDirections: domains.incomingDirectionDomain,
			outgoingDirections: domains.outgoingDirectionDomain,
		},
		execution: {sourceTransmittanceIntervalCount: sourcePathIntervalCount, maximumScatteringOrder},
	});
	const model = new SharedModel({version: 1, profile});
	const placements = geometry.resolveCelestialPlacements({roster, observation: OBSERVATION});
	return {
		model,
		geometry,
		profile,
		roster,
		source,
		placement: /** @type {Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>} */ (
			placements[0]
		),
		query: /** @type {SphericalCelestialQueryPacket} */ (geometry.createCelestialQueryPacket(roster, placements)),
	};
}

/** Create one mutable composer accepted by the production runtime installer. */
function createComposer() {
	return {
		passes: [],
		/** @param {unknown} pass - Installed pass. @returns {void} - No value. */
		addPass(pass) {
			this.passes.push(pass);
		},
		/** @param {unknown} pass - Retired pass. @returns {void} - No value. */
		removePass(pass) {
			const index = this.passes.indexOf(pass);
			if (index >= 0) this.passes.splice(index, 1);
		},
	};
}

/**
 * Create a floating-point render target for unencoded production-state observations.
 * @param {number} width - Target width.
 * @param {number} height - Target height.
 * @returns {THREE.WebGLRenderTarget} - Floating-point target.
 */
function createFloatTarget(width, height) {
	const target = new THREE.WebGLRenderTarget(width, height, {
		format: THREE.RGBAFormat,
		type: THREE.FloatType,
		internalFormat: 'RGBA32F',
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		depthBuffer: false,
		stencilBuffer: false,
	});
	target.texture.colorSpace = THREE.NoColorSpace;
	return target;
}

/**
 * Create a proof-only Color boundary that exposes celestial coverage, composition residual, and path radiance.
 * @param {number} referenceRadiance - CPU reference cache radiance for channel zero.
 * @returns {ColorModel} - Color-compatible proof owner.
 */
function createAcceptanceColor(referenceRadiance) {
	return /** @type {ColorModel} */ ({
		id: 'distant-sun-live-acceptance-color',
		/** @returns {ShaderContribution} - Observable terminal contribution. */
		createShaderContribution() {
			return ShaderContributions.createShaderContribution({
				id: 'color-distant-sun-live-acceptance',
				owner: 'color',
				provides: ['color.composeSceneColor', 'color.encodeOutput'],
				requires: ['composition.composeSpectralRadiance'],
				mainHooks: [
					ShaderContributions.createShaderSourceBlock(
						'color-distant-sun-live-acceptance-compose',
						'composeSceneColor',
						0,
						`float compositionResidual = abs(
	preDisplayRadiance.channels[0]
		- state.pathRadiance.channels[0]
		- celestialRadiance.channels[0]
) / ${referenceRadiance};
state.outputRgba = vec4(
	celestialRadiance.channels[0] / ${referenceRadiance},
	compositionResidual,
	state.pathRadiance.channels[0] / ${referenceRadiance},
	1.0
);`,
					),
					ShaderContributions.createShaderSourceBlock(
						'color-distant-sun-live-acceptance-encode',
						'encodeOutput',
						0,
						'outColor = state.outputRgba;',
					),
				],
			});
		},
	});
}

/**
 * Resolve the independent four-sample CPU coverage oracle for one viewport.
 * @param {THREE.PerspectiveCamera} camera - Live camera.
 * @param {number} width - Viewport width.
 * @param {number} height - Viewport height.
 * @param {number} angularRadiusRadians - Uniform-Sun angular radius.
 * @param {number} horizonRadialCosine - Geometry-owned horizon cosine.
 * @returns {{coverage: Float64Array, fullPixels: number, partialPixels: number, emptyPixels: number, groundRejectedSamples: number}} - Coverage oracle and classifications.
 */
function createCoverageOracle(camera, width, height, angularRadiusRadians, horizonRadialCosine) {
	const coverage = new Float64Array(width * height);
	const minimumDiskCosine = Math.cos(angularRadiusRadians);
	const offsets = [
		[-0.25, -0.25],
		[0.25, -0.25],
		[-0.25, 0.25],
		[0.25, 0.25],
	];
	let fullPixels = 0;
	let partialPixels = 0;
	let emptyPixels = 0;
	let groundRejectedSamples = 0;
	for (let pixelY = 0; pixelY < height; pixelY += 1) {
		for (let pixelX = 0; pixelX < width; pixelX += 1) {
			let acceptedSamples = 0;
			for (const [offsetX, offsetY] of offsets) {
				const textureX = (pixelX + 0.5 + offsetX) / width;
				const textureY = (pixelY + 0.5 + offsetY) / height;
				const sceneDirection = new THREE.Vector3(textureX * 2 - 1, textureY * 2 - 1, 1)
					.unproject(camera)
					.sub(camera.position)
					.normalize();
				const modelDirection = [sceneDirection.x, -sceneDirection.z, sceneDirection.y];
				if (modelDirection[1] < minimumDiskCosine) continue;
				if (modelDirection[2] < horizonRadialCosine) {
					groundRejectedSamples += 1;
					continue;
				}
				acceptedSamples += 1;
			}
			const fraction = acceptedSamples / offsets.length;
			coverage[pixelY * width + pixelX] = fraction;
			if (fraction === 0) emptyPixels += 1;
			else if (fraction === 1) fullPixels += 1;
			else partialPixels += 1;
		}
	}
	return {coverage, fullPixels, partialPixels, emptyPixels, groundRejectedSamples};
}

/**
 * Capture scene inputs and execute one installed production frame.
 * @param {THREE.WebGLRenderer} renderer - Active renderer.
 * @param {readonly unknown[]} passes - Capture and runtime passes.
 * @param {THREE.WebGLRenderTarget} writeTarget - Algorithm output.
 * @param {THREE.WebGLRenderTarget} readTarget - Black scene color input.
 * @returns {Float32Array} - Complete RGBA readback.
 */
function renderAcceptanceFrame(renderer, passes, writeTarget, readTarget) {
	const capturePass = /** @type {{render(renderer: THREE.WebGLRenderer): void}} */ (passes[0]);
	const runtimePass =
		/** @type {{render(renderer: THREE.WebGLRenderer, write: THREE.WebGLRenderTarget, read: THREE.WebGLRenderTarget): void}} */ (
			passes[1]
		);
	capturePass.render(renderer);
	runtimePass.render(renderer, writeTarget, readTarget);
	const pixels = new Float32Array(writeTarget.width * writeTarget.height * 4);
	renderer.readRenderTargetPixels(writeTarget, 0, 0, writeTarget.width, writeTarget.height, pixels);
	return pixels;
}

describe('Distant-Sun celestial GPU production path', /** Register the real WebGL proof. */ () => {
	it('matches the live uniform-disk CPU oracle and preserves path radiance through scene blocking', async () => {
		const width = 32;
		const height = 32;
		const {renderer, context} = createRenderer();
		renderer.setSize(width, height, false);
		const backend = new ThreeCacheBackend({THREE, renderer});
		const fixture = createFixture(20, 1);
		const cpuCache = new DistantSunCelestialCpuCache({
			model: fixture.model,
			domain: fixture.geometry.describeCelestialContributionDomain(),
			placement: fixture.placement,
			source: fixture.source,
		});
		const cpuLookup = cpuCache.lookup({
			receiverStencil: fixture.query.receiverStencil,
			directionStencil: fixture.query.sun.directionStencil,
		});
		const referenceRadiance = cpuLookup.radiance.values[0];
		const color = createAcceptanceColor(referenceRadiance);
		const builder = new ShaderBuilder({model: fixture.model});
		const composer = createComposer();
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(2, width / height, 0.1, 10);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		const bindingValues = {
			'geometry.inverseProjectionMatrix': camera.projectionMatrixInverse,
			'geometry.inverseViewMatrix': camera.matrixWorld,
		};
		const readTarget = createFloatTarget(width, height);
		const writeTarget = createFloatTarget(width, height);
		const blockerMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
		let result = null;
		try {
			result = await builder.build({
				setup: {
					THREE,
					composer,
					scene,
					camera,
					viewportSize: {width, height, units: 'pixels'},
					cacheBackend: backend,
					logger: {
						/** @param {string} _message - Warning label. @param {unknown} error - Shader error. @returns {void} - No value. */
						warn(_message, error) {
							throw error;
						},
					},
				},
				config: {config: {color, execution: {maximumScatteringOrder: 1}}},
				bindingValues,
			});
			expect(result.runtime).toBeDefined();
			expect(composer.passes.length).toBe(2);
			await result.runtime.prepare(renderer);

			const horizonRadialCosine = fixture.geometry.resolveCelestialHorizonRadialCosine(
				fixture.query.receiverPosition,
			);
			const oracle = createCoverageOracle(
				camera,
				width,
				height,
				fixture.source.celestialSourceDefinition.angularRadius.value,
				horizonRadialCosine,
			);
			const clearPixels = renderAcceptanceFrame(renderer, composer.passes, writeTarget, readTarget);
			let maximumCoverageResidual = 0;
			for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
				maximumCoverageResidual = Math.max(
					maximumCoverageResidual,
					Math.abs(clearPixels[pixelIndex * 4] - oracle.coverage[pixelIndex]),
				);
				expect(clearPixels[pixelIndex * 4 + 1])
					.withContext(`composition pixel ${pixelIndex}`)
					.toBeLessThan(1e-6);
			}
			expect(maximumCoverageResidual).toBeLessThan(1e-4);
			expect(oracle.fullPixels).toBeGreaterThan(0);
			expect(oracle.partialPixels).toBeGreaterThan(0);
			expect(oracle.emptyPixels).toBeGreaterThan(0);
			expect(oracle.groundRejectedSamples).toBeGreaterThan(0);
			const retainedCelestialResource = result.distantSunCelestialCache;
			const retainedScatteringCache = result.scatteringCache;
			camera.fov = 2.5;
			camera.updateProjectionMatrix();
			const changedFovOracle = createCoverageOracle(
				camera,
				width,
				height,
				fixture.source.celestialSourceDefinition.angularRadius.value,
				horizonRadialCosine,
			);
			const changedFovPixels = renderAcceptanceFrame(renderer, composer.passes, writeTarget, readTarget);
			for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
				expect(Math.abs(changedFovPixels[pixelIndex * 4] - changedFovOracle.coverage[pixelIndex]))
					.withContext(`changed-FOV coverage pixel ${pixelIndex}`)
					.toBeLessThan(1e-4);
			}
			expect(result.distantSunCelestialCache).toBe(retainedCelestialResource);
			expect(result.scatteringCache).toBe(retainedScatteringCache);
			const capturePass = /** @type {{setSize(width: number, height: number): void}} */ (composer.passes[0]);
			const runtimePass =
				/** @type {{setSize(width: number, height: number): void, uniforms: Record<string, {value: unknown}>}} */ (
					composer.passes[1]
				);
			capturePass.setSize(24, 24);
			runtimePass.setSize(24, 24);
			expect(runtimePass.uniforms.uViewportSizePixels.value).toEqual([24, 24]);
			capturePass.setSize(width, height);
			runtimePass.setSize(width, height);
			camera.fov = 2;
			camera.updateProjectionMatrix();

			const halfBlocker = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.2), blockerMaterial);
			halfBlocker.position.set(0.02, 0, -1);
			scene.add(halfBlocker);
			const partialBlockedPixels = renderAcceptanceFrame(renderer, composer.passes, writeTarget, readTarget);
			let suppressedPixelCount = 0;
			let retainedPixelCount = 0;
			for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
				const clearCoverage = clearPixels[pixelIndex * 4];
				const blockedCoverage = partialBlockedPixels[pixelIndex * 4];
				if (clearCoverage > 0 && blockedCoverage === 0) suppressedPixelCount += 1;
				if (blockedCoverage > 0) retainedPixelCount += 1;
			}
			expect(suppressedPixelCount).toBeGreaterThan(0);
			expect(retainedPixelCount).toBeGreaterThan(0);

			scene.remove(halfBlocker);
			halfBlocker.geometry.dispose();
			const fullBlocker = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blockerMaterial);
			fullBlocker.position.z = -1;
			scene.add(fullBlocker);
			const fullyBlockedPixels = renderAcceptanceFrame(renderer, composer.passes, writeTarget, readTarget);
			let positiveBlockedPathPixelCount = 0;
			for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
				expect(fullyBlockedPixels[pixelIndex * 4])
					.withContext(`blocked celestial pixel ${pixelIndex}`)
					.toBe(0);
				expect(fullyBlockedPixels[pixelIndex * 4 + 1])
					.withContext(`blocked composition pixel ${pixelIndex}`)
					.toBeLessThan(1e-6);
				if (fullyBlockedPixels[pixelIndex * 4 + 2] > 0) positiveBlockedPathPixelCount += 1;
			}
			expect(positiveBlockedPathPixelCount).toBeGreaterThan(0);

			scene.remove(fullBlocker);
			fullBlocker.geometry.dispose();
			camera.rotation.y = 0.1;
			camera.updateMatrixWorld(true);
			const offFramePixels = renderAcceptanceFrame(renderer, composer.passes, writeTarget, readTarget);
			expect(offFramePixels.filter((_value, index) => index % 4 === 0).every((value) => value === 0)).toBeTrue();
			expect(result.distantSunCelestialCache).toBe(result.distantSunCelestialCacheController.active);
			expect(context.getError()).toBe(context.NO_ERROR);
			console.info(
				'DISTANT_SUN_LIVE_ACCEPTANCE',
				JSON.stringify({
					maximumCoverageResidual,
					fullPixels: oracle.fullPixels,
					partialPixels: oracle.partialPixels,
					emptyPixels: oracle.emptyPixels,
					groundRejectedSamples: oracle.groundRejectedSamples,
					suppressedPixelCount,
					retainedPixelCount,
					positiveBlockedPathPixelCount,
				}),
			);
		} finally {
			result?.runtime?.dispose();
			result?.scatteringCacheController?.dispose();
			result?.distantSunCelestialCacheController?.dispose();
			builder.dispose();
			blockerMaterial.dispose();
			readTarget.dispose();
			writeTarget.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});

	it('matches selected binary64 field nodes through the real R32F construction path', async () => {
		const {renderer, context} = createRenderer();
		const backend = new ThreeCacheBackend({THREE, renderer});
		let artifact = /** @type {GpuFieldArtifact | null} */ (null);
		try {
			const fixture = createFixture();
			const builder = new DistantSunCelestialGpuBuilder({...fixture, backend});
			const plan = builder.createBuildPlan(fixture);
			const nodes = [
				[0, 0],
				[0, 10],
				[4, 2],
				[8, 6],
				[12, 10],
			];
			const coordinates = nodes.flatMap(([receiverIndex, directionIndex]) =>
				Array.from({length: 15}, (_value, wavelengthIndex) => ({
					receiverIndex,
					directionIndex,
					wavelengthIndex,
				})),
			);
			const result = await builder.execute(plan, {probeReader: backend, probeCoordinates: coordinates});
			artifact = result.artifact;
			const samples = result.artifact.diagnostics.passes[0].probe.samples;
			let maximumAbsoluteResidual = 0;
			let maximumRelativeResidual = 0;
			let maximumNormalizedResidual = 0;
			let maximumAbsoluteSample = null;
			let maximumRelativeSample = null;
			for (let index = 0; index < samples.length; index += 1) {
				const coordinate = coordinates[index];
				const expected = result.cpuReference.readScalar(coordinate);
				const residual = Math.abs(samples[index].value - expected);
				const relativeResidual = residual / Math.max(Math.abs(expected), 1e-12);
				const allowedResidual = 5e-4 + 5e-5 * Math.abs(expected);
				maximumNormalizedResidual = Math.max(maximumNormalizedResidual, residual / allowedResidual);
				expect(residual).withContext(`celestial field sample ${index}`).toBeLessThanOrEqual(allowedResidual);
				if (residual > maximumAbsoluteResidual) {
					maximumAbsoluteResidual = residual;
					maximumAbsoluteSample = {coordinate, expected, actual: samples[index].value};
				}
				if (relativeResidual > maximumRelativeResidual) {
					maximumRelativeResidual = relativeResidual;
					maximumRelativeSample = {coordinate, expected, actual: samples[index].value};
				}
			}
			console.info(
				'DISTANT_SUN_CELESTIAL_GPU_PARITY',
				JSON.stringify({
					sampleCount: samples.length,
					maximumAbsoluteResidual,
					maximumAbsoluteSample,
					maximumRelativeResidual,
					maximumRelativeSample,
					maximumNormalizedResidual,
				}),
			);

			expect(samples.length).toBe(75);
			expect(result.artifact.runtimeBindings.bindings[0].valueKey).toBe('cache.celestial.sunTransport');
			expect(result.artifact.diagnostics.memory.residentFieldStorage).toEqual({value: 8_580, units: 'bytes'});
			expect(context.getError()).toBe(context.NO_ERROR);
		} finally {
			artifact?.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});

	it('replaces the opaque runtime binding and disposes retired and final resources independently', async () => {
		const {renderer, context} = createRenderer();
		const backend = new ThreeCacheBackend({THREE, renderer});
		const firstFixture = createFixture(20);
		const nextFixture = createFixture(24);
		const firstController = firstFixture.source.createDistantSunCelestialCacheController({
			model: firstFixture.model,
			backend,
		});
		const nextController = nextFixture.source.createDistantSunCelestialCacheController({
			model: nextFixture.model,
			backend,
		});
		try {
			const firstResource = await firstController.build(firstFixture);
			const nextResource = await nextController.build(nextFixture);
			const runtimeUniforms = {
				'cache.celestial.sunTransport': {value: null},
			};
			backend.installRuntimeBindings({
				bindings: firstResource.getRuntimeBindings(),
				uniforms: runtimeUniforms,
			});
			const firstTexture = /** @type {THREE.Texture} */ (runtimeUniforms['cache.celestial.sunTransport'].value);

			backend.installRuntimeBindings({
				bindings: nextResource.getRuntimeBindings(),
				uniforms: runtimeUniforms,
			});
			const nextTexture = /** @type {THREE.Texture} */ (runtimeUniforms['cache.celestial.sunTransport'].value);

			expect(nextResource.resourceIdentity).not.toBe(firstResource.resourceIdentity);
			expect(nextTexture).not.toBe(firstTexture);
			firstController.dispose();
			expect(() => firstResource.getRuntimeBindings()).toThrowError(/disposed/u);
			expect(nextResource.getRuntimeBindings().bindings[0].valueKey).toBe('cache.celestial.sunTransport');
			nextController.dispose();
			expect(() => nextResource.getRuntimeBindings()).toThrowError(/disposed/u);
			expect(context.getError()).toBe(context.NO_ERROR);
		} finally {
			firstController.dispose();
			nextController.dispose();
			backend.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	});
});
