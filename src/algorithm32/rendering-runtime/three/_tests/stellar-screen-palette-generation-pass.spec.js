import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {DistantSunLightSource, SphericalEarthGeometry, StellarPointSetSource} from '../../../implementation/index.js';
import {CelestialRenderViewSnapshot} from '../CelestialRenderViewSnapshot.js';
import {ShaderRuntimeInstaller} from '../ShaderRuntimeInstaller.js';
import {StellarScreenPaletteGenerationPass} from '../StellarScreenPaletteGenerationPass.js';

const OBSERVATION = {
	instant: '2024-06-21T06:26:03.503Z',
	location: {
		latitude: {value: 37.3382, units: 'degrees'},
		longitude: {value: -121.8863, units: 'degrees'},
	},
};

/** Create the configured production source and geometry used by runtime tests. */
function createOwners() {
	const sun = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6_360_000, units: 'meters'},
		topRadius: {value: 6_420_000, units: 'meters'},
		observerHeight: {value: 10, units: 'meters'},
		sceneFrame: {kind: 'model-space'},
	});
	geometry.configureLightSource({
		lightSource: sun,
		observation: OBSERVATION,
		placement: {kind: 'distant-direction', directionToLight: [0, 0, 1]},
	});
	return {source: new StellarPointSetSource(), sun, geometry};
}

/** Create one perspective camera whose matrices are captured at the pass boundary. */
function createCamera() {
	const camera = new THREE.PerspectiveCamera(120, 32 / 20, 0.1, 10);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	return camera;
}

/** Create a stateful renderer double without replacing real Three resources. */
function createRendererDouble() {
	let renderTarget = null;
	const renderer = {
		autoClear: true,
		renderCount: 0,
		compileCount: 0,
		throwOnRenderCount: null,
		onRender: null,
		getRenderTarget: () => renderTarget,
		setRenderTarget: (target) => {
			renderTarget = target;
		},
		getContext: () => ({
			COLOR: 0x1800,
			DEPTH_BUFFER_BIT: 0x0100,
			clearBufferuiv: () => {},
			clearBufferfv: () => {},
			clearDepth: () => {},
			clear: () => {},
		}),
		render: () => {
			renderer.renderCount += 1;
			renderer.onRender?.(renderer.renderCount);
			if (renderer.renderCount === renderer.throwOnRenderCount) throw new Error('injected stage failure');
		},
		compileAsync: async () => {
			renderer.compileCount += 1;
		},
	};
	return renderer;
}

/** Create one pass and its live camera. */
function createPass(three = THREE) {
	const owners = createOwners();
	const camera = createCamera();
	const pass = new StellarScreenPaletteGenerationPass({
		THREE: three,
		source: owners.source,
		geometry: owners.geometry,
		observation: OBSERVATION,
		camera,
		viewportSize: {width: 32, height: 20, units: 'pixels'},
		logger: {warn: () => {}},
	});
	return {pass, camera};
}

describe('stellar screen-palette generation runtime pass', () => {
	it('captures stable perspective identities and changes identity with the live view', () => {
		const camera = createCamera();
		const viewport = {width: 32, height: 20, units: 'pixels'};
		const first = CelestialRenderViewSnapshot.capture(camera, viewport);
		const repeated = CelestialRenderViewSnapshot.capture(camera, viewport);
		expect(repeated).toEqual(first);

		camera.rotateY(0.125);
		camera.updateMatrixWorld(true);
		const changed = CelestialRenderViewSnapshot.capture(camera, viewport);
		expect(changed.identity).not.toBe(first.identity);
		expect(() => CelestialRenderViewSnapshot.capture(new THREE.Camera(), viewport)).toThrowError(
			/Stellar generation requires a Three perspective camera/,
		);
	});

	it('publishes atomically, retains a prior pair on failure, restores context, and disposes exactly once', async () => {
		const {pass, camera} = createPass();
		const renderer = createRendererDouble();
		await pass.prepare(renderer);
		expect(renderer.compileCount).toBe(2);

		pass.render(renderer);
		const firstPublication = pass.publicationState.active;
		const firstBindings = pass.bindingValues();
		expect(firstPublication.completion).toBe('complete');
		expect(firstBindings['runtime.celestial.stellarScreenIndex']).not.toBeNull();
		expect(firstBindings['runtime.celestial.stellarPalette']).not.toBeNull();
		expect(renderer.renderCount).toBe(2);

		pass.render(renderer);
		expect(renderer.renderCount).toBe(2);
		expect(pass.getDiagnostics().reusedFrameCount).toBe(1);

		camera.rotateY(0.125);
		camera.updateMatrixWorld(true);
		renderer.throwOnRenderCount = 4;
		let activeDuringStaging = null;
		renderer.onRender = (renderCount) => {
			if (renderCount === 4) activeDuringStaging = pass.publicationState.active;
		};
		pass.render(renderer);
		expect(activeDuringStaging).toBe(firstPublication);
		expect(pass.publicationState.active).toBe(firstPublication);
		expect(pass.publicationState.staging).toBeNull();
		expect(pass.publicationState.dirtyReason).toBe('view');
		expect(pass.bindingValues()['runtime.celestial.stellarScreenIndex']).toBeNull();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({createdTargetCount: 4, disposedTargetCount: 2, failedGenerationCount: 1}),
		);

		renderer.throwOnRenderCount = null;
		renderer.onRender = null;
		pass.render(renderer);
		expect(pass.publicationState.active.id).not.toBe(firstPublication.id);
		expect(pass.publicationState.dirtyReason).toBeNull();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({createdTargetCount: 6, disposedTargetCount: 4, generationCount: 2}),
		);

		pass.setSize(64, 40);
		pass.render(renderer);
		expect(pass.publicationState.active.screenIndex).toEqual(jasmine.objectContaining({width: 64, height: 40}));
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({createdTargetCount: 8, disposedTargetCount: 6}),
		);

		pass.handleContextLoss();
		expect(pass.publicationState.active).toBeNull();
		expect(pass.publicationState.dirtyReason).toBe('context-restoration');
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({contextLossCount: 1, createdTargetCount: 8, disposedTargetCount: 8}),
		);
		pass.handleContextRestoration();
		pass.render(renderer);
		expect(pass.publicationState.active.completion).toBe('complete');

		pass.dispose();
		pass.dispose();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({status: 'disposed', createdTargetCount: 10, disposedTargetCount: 10}),
		);
	});

	it('cleans a partially allocated staging pair when the second target allocation fails', () => {
		let allocationCount = 0;
		class FailingWebGLRenderTarget extends THREE.WebGLRenderTarget {
			constructor(...parameters) {
				allocationCount += 1;
				if (allocationCount === 2) throw new Error('injected allocation failure');
				super(...parameters);
			}
		}
		const {pass} = createPass({...THREE, WebGLRenderTarget: FailingWebGLRenderTarget});
		pass.render(createRendererDouble());
		expect(pass.publicationState.active).toBeNull();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({createdTargetCount: 1, disposedTargetCount: 1, failedGenerationCount: 1}),
		);
		pass.dispose();
	});

	it('installs generation before the standard consumer pass and removes both together', async () => {
		const owners = createOwners();
		const model = {
			geometry: owners.geometry,
			celestialSources: {
				id: 'runtime-pass-test-roster',
				family: 'spherical-sun-stars-radial-v1',
				sun: owners.sun,
				stars: owners.source,
			},
			profile: {models: {sourcePlacement: {observation: OBSERVATION}}},
		};
		const composer = {
			passes: [],
			addPass(pass) {
				this.passes.push(pass);
			},
			removePass(pass) {
				this.passes.splice(this.passes.indexOf(pass), 1);
			},
		};
		const runtime = new ShaderRuntimeInstaller(model).install(
			{
				setup: {
					THREE,
					composer,
					camera: createCamera(),
					viewportSize: {width: 32, height: 20, units: 'pixels'},
				},
			},
			{
				fragmentShaderSource: 'precision highp float; out vec4 outColor; void main() { outColor = vec4(0.0); }',
				sourceHash: 'test-source-hash',
				contributions: [owners.source.createStellarScreenPaletteConsumerShaderContribution()],
				bindingRequirements:
					owners.source.createStellarScreenPaletteConsumerShaderContribution().bindingRequirements,
			},
		);
		expect(runtime).not.toBeNull();
		expect(composer.passes.length).toBe(2);
		expect(composer.passes[0] === runtime.celestialGenerationParticipant).toBeTrue();
		expect(composer.passes[1].constructor.name).toBe('ShaderRuntimePass');
		const consumerPass = composer.passes[1];
		expect(composer.passes[0].enabled).toBeFalse();
		expect(consumerPass.enabled).toBeFalse();
		expect(Array.from(consumerPass.uniforms.uStellarScreenIndex.value.image.data)).toEqual([0]);
		expect(Array.from(consumerPass.uniforms.uStellarPalette.value.image.data)).toEqual(Array(15).fill(0));
		const renderer = createRendererDouble();
		await runtime.prepare(renderer);
		expect(composer.passes[0].enabled).toBeTrue();
		expect(consumerPass.enabled).toBeTrue();
		expect(renderer.compileCount).toBe(4);
		composer.passes[0].render(renderer);
		consumerPass.render(renderer, {texture: {}}, {texture: {}});
		const activeBindings = runtime.celestialGenerationParticipant.consumerBindingValues();
		expect(consumerPass.uniforms.uStellarScreenIndex.value).toBe(
			activeBindings['runtime.celestial.stellarScreenIndex'],
		);
		expect(consumerPass.uniforms.uStellarPalette.value).toBe(activeBindings['runtime.celestial.stellarPalette']);
		expect(runtime.getDiagnostics().stellarGeneration).toEqual(
			jasmine.objectContaining({status: 'ready', generationCount: 1}),
		);
		runtime.dispose();
		expect(composer.passes).toEqual([]);
	});
});
