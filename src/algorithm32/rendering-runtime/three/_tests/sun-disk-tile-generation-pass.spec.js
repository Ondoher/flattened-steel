import * as THREE from '../../../../../node_modules/three/build/three.module.js';
import {DistantSunLightSource, SphericalEarthGeometry} from '../../../implementation/index.js';
import {CelestialGenerationPass} from '../CelestialGenerationPass.js';
import {SunDiskTileGenerationPass} from '../SunDiskTileGenerationPass.js';

const OBSERVATION = {
	instant: '2024-06-21T06:26:03.503Z',
	location: {
		latitude: {value: 37.3382, units: 'degrees'},
		longitude: {value: -121.8863, units: 'degrees'},
	},
};

/** Create one configured distant-Sun tile pass and its mutable view. */
function createPass(options = {}) {
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
		...(options.naturalPlacement ? {} : {placement: {kind: 'distant-direction', directionToLight: [0, 0, 1]}}),
	});
	const camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 10);
	if (!options.naturalPlacement) camera.rotateY(Math.PI);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	const pass = new SunDiskTileGenerationPass({
		THREE,
		roster: {
			id: 'sun-tile-test-roster',
			family: 'spherical-sun-stars-radial-v1',
			sun,
			stars: null,
		},
		geometry,
		observation: OBSERVATION,
		camera,
		viewportSize: {width: 96, height: 64, units: 'pixels'},
		sceneScale: {metersPerSceneUnit: 1},
		logger: {warn: () => {}},
	});
	return {pass, camera};
}

/** Create a deterministic renderer double that exercises allocation and publication. */
function createRenderer() {
	let target = null;
	const renderer = {
		autoClear: true,
		renderCount: 0,
		throwOnRender: false,
		getRenderTarget: () => target,
		setRenderTarget: (value) => {
			target = value;
		},
		getContext: () => ({COLOR: 0x1800, clearBufferfv: () => {}}),
		render: () => {
			renderer.renderCount += 1;
			if (renderer.throwOnRender) throw new Error('injected Sun tile failure');
		},
		compileAsync: async () => {},
	};
	return renderer;
}

describe('source-local Sun disk tile generation pass', () => {
	it('declares one standard continuous-coverage publication stage', () => {
		const {pass} = createPass();
		expect(pass.stages).toEqual([
			jasmine.objectContaining({
				id: 'celestial-generation.sun-continuous-coverage-tile',
				order: 120,
				topology: 'fullscreen-triangles',
				completionBoundary: 'publication',
				outputs: [
					jasmine.objectContaining({
						format: 'R32F',
						shape: 'source-local-continuous-coverage',
						persistence: 'published',
					}),
				],
			}),
		]);
		expect(pass.stages[0].fragmentShaderSource).toContain('sunCircularDiskPixelCoverage');
		expect(pass.stages[0].fragmentShaderSource).toContain('uSunRadiusPixels');
		expect(pass.stages[0].fragmentShaderSource).toContain('clamp(abs(area), 0.0, 1.0)');
		pass.dispose();
	});

	it('publishes an off-screen placement when geometry classifies the distant Sun below the horizon', () => {
		const {pass} = createPass({naturalPlacement: true});
		const renderer = createRenderer();
		pass.render(renderer);
		const values = pass.bindingValues();

		expect(pass.publicationState.active.completion).toBe('complete');
		expect(values['runtime.celestial.sunScreenCenterPixels']).toEqual([-1000000, -1000000]);
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({sourceVisibility: 'empty', publicationState: jasmine.any(Object)}),
		);
		pass.dispose();
	});

	it('projects the San Jose sunset through the observer-local inverse scene frame', () => {
		const sunsetObservation = {
			...OBSERVATION,
			instant: '2024-06-21T03:26:03.503Z',
		};
		const sun = new DistantSunLightSource({angularRadius: {value: 0.004675, units: 'radians'}});
		const geometry = new SphericalEarthGeometry({
			bottomRadius: {value: 6_360_000, units: 'meters'},
			topRadius: {value: 6_420_000, units: 'meters'},
			observerHeight: {value: 10, units: 'meters'},
			observerUpDirection: [0, 0, 1],
			sceneFrame: {kind: 'observer-local'},
		});
		geometry.configureLightSource({
			lightSource: sun,
			observation: sunsetObservation,
		});
		const sceneDirection = geometry.expressCelestialDirectionInScene(geometry.configuration.directionToSource);
		const camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 10);
		camera.lookAt(...sceneDirection);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		const pass = new SunDiskTileGenerationPass({
			THREE,
			roster: {id: 'observer-local-sun', family: 'spherical-sun-stars-radial-v1', sun, stars: null},
			geometry,
			observation: sunsetObservation,
			camera,
			viewportSize: {width: 96, height: 64, units: 'pixels'},
			sceneScale: {value: 1, units: 'meters-per-scene-unit'},
			logger: {warn: () => {}},
		});
		const renderer = createRenderer();

		pass.render(renderer);

		expect(sceneDirection[1]).toBeCloseTo(0.0007345177958817675, 14);
		const center = pass.bindingValues()['runtime.celestial.sunScreenCenterPixels'];
		expect(center[0]).toBeCloseTo(48, 12);
		expect(center[1]).toBeCloseTo(32, 12);
		expect(pass.getDiagnostics().sourceVisibility).toBe('partial');
		pass.dispose();
	});

	it('reuses projection scale across orientation, invalidates FOV, retains failure, and restores', async () => {
		const {pass, camera} = createPass();
		const renderer = createRenderer();
		await pass.prepare(renderer);
		pass.render(renderer);
		const first = pass.publicationState.active;
		const firstValues = pass.bindingValues();
		expect(first.completion).toBe('complete');
		expect(first.coverage.format).toBe('R32F');
		expect(firstValues['runtime.celestial.sunTileSamplesPerPixel']).toBe(16);
		expect(renderer.renderCount).toBe(1);

		camera.rotateZ(0.2);
		camera.updateMatrixWorld(true);
		pass.render(renderer);
		expect(pass.publicationState.active).toBe(first);
		expect(renderer.renderCount).toBe(1);

		camera.rotateY(0.2);
		camera.updateMatrixWorld(true);
		pass.render(renderer);
		const movedValues = pass.bindingValues();
		expect(pass.publicationState.active).toBe(first);
		expect(renderer.renderCount).toBe(1);
		expect(movedValues['runtime.celestial.sunScreenCenterPixels']).not.toEqual(
			firstValues['runtime.celestial.sunScreenCenterPixels'],
		);

		camera.fov = 75;
		camera.updateProjectionMatrix();
		renderer.throwOnRender = true;
		pass.render(renderer);
		expect(pass.publicationState.active).toBe(first);
		expect(pass.bindingValues()).toBeNull();
		expect(pass.consumerBindingValues()['runtime.celestial.sunCoverageTile']).not.toBe(
			firstValues['runtime.celestial.sunCoverageTile'],
		);

		renderer.throwOnRender = false;
		pass.render(renderer);
		expect(pass.publicationState.active).not.toBe(first);
		expect(pass.bindingValues()).not.toBeNull();
		pass.handleContextLoss();
		expect(pass.publicationState.active).toBeNull();
		pass.handleContextRestoration();
		pass.render(renderer);
		expect(pass.publicationState.active.completion).toBe('complete');

		pass.dispose();
		pass.dispose();
		expect(pass.getDiagnostics()).toEqual(
			jasmine.objectContaining({
				status: 'disposed',
				generationCount: 3,
				failedGenerationCount: 1,
				createdTargetCount: 4,
				disposedTargetCount: 4,
			}),
		);
	});

	it('gates both children to exact zero until the complete enabled set is available', () => {
		let stellarReady = false;
		let sunReady = false;
		const stellar = {
			stages: [{order: 100}],
			get publicationState() {
				return {active: stellarReady ? {id: 'stars'} : null, dirtyReason: stellarReady ? null : 'initial'};
			},
			bindingValues: () => ({
				'runtime.celestial.stellarScreenIndex': stellarReady ? 'stellar-index' : null,
				'runtime.celestial.stellarPalette': stellarReady ? 'stellar-palette' : null,
			}),
			zeroConsumerBindingValues: () => ({
				'runtime.celestial.stellarScreenIndex': 'zero-index',
				'runtime.celestial.stellarPalette': 'zero-palette',
			}),
			markDirty() {},
			prepare: async () => {},
			setSize() {},
			render() {},
			handleContextLoss() {},
			handleContextRestoration() {},
			getDiagnostics: () => ({}),
			dispose() {},
		};
		const sun = {
			stages: [{order: 120}],
			get publicationState() {
				return {active: sunReady ? {id: 'sun'} : null, dirtyReason: sunReady ? null : 'initial'};
			},
			bindingValues: () => (sunReady ? {'runtime.celestial.sunCoverageTile': 'sun-tile'} : null),
			zeroConsumerBindingValues: () => ({'runtime.celestial.sunCoverageTile': 'zero-sun'}),
			markDirty() {},
			prepare: async () => {},
			setSize() {},
			render() {},
			handleContextLoss() {},
			handleContextRestoration() {},
			getDiagnostics: () => ({}),
			dispose() {},
		};
		const pass = new CelestialGenerationPass({stellar, sun});
		expect(pass.consumerBindingValues()).toEqual({
			'runtime.celestial.stellarScreenIndex': 'zero-index',
			'runtime.celestial.stellarPalette': 'zero-palette',
			'runtime.celestial.sunCoverageTile': 'zero-sun',
		});
		stellarReady = true;
		expect(pass.consumerBindingValues()['runtime.celestial.sunCoverageTile']).toBe('zero-sun');
		sunReady = true;
		expect(pass.consumerBindingValues()).toEqual({
			'runtime.celestial.stellarScreenIndex': 'stellar-index',
			'runtime.celestial.stellarPalette': 'stellar-palette',
			'runtime.celestial.sunCoverageTile': 'sun-tile',
		});
		expect(pass.publicationState.active.status).toBe('complete');
	});

	it('rejects preparation when the required Sun tile cannot publish', async () => {
		const {pass: sun} = createPass();
		const renderer = createRenderer();
		renderer.throwOnRender = true;
		const pass = new CelestialGenerationPass({stellar: null, sun});

		await expectAsync(pass.prepare(renderer)).toBeRejectedWithError(
			/Celestial generation preparation did not publish one complete compatible output set/,
		);
		expect(pass.publicationState.active).toBeNull();
		expect(pass.consumerBindingValues()['runtime.celestial.sunCoverageTile']).toBe(
			sun.zeroConsumerBindingValues()['runtime.celestial.sunCoverageTile'],
		);
		pass.dispose();
	});
});
