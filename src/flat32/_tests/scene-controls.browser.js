import * as THREE from 'three';
import {Flat32SceneControls} from '../Flat32SceneControls.js';
import {createDistantSunSceneState} from '../DistantSunSceneState.js';
import {FlatLocalMode} from '../FlatLocalMode.js';
import {SphericalDistantMode} from '../SphericalDistantMode.js';
import {Flat32Application} from '../Flat32Application.js';
import {Algorithm32Bindings} from '../../algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ATMOSPHERE_SCENE_SCALE, ATMOSPHERE_OBSERVER_UP_DIRECTION} from '../consts.js';
import {LocalSunSceneLighting} from '../LocalSunSceneLighting.js';
import {Flat32View} from '../Flat32View.js';
import {ThreeSceneRuntime} from '../ThreeSceneRuntime.js';
import {StagedSceneRuntime} from '../StagedSceneRuntime.js';

describe('Flat32 scene control foundations', () => {
	it('dispatches native three-state sky and Sun controls with explicit legacy availability', () => {
		const root = document.createElement('div'),
			view = new Flat32View(root);
		view.start();
		const actions = {
			onSky: jasmine.createSpy('sky'),
			onSun: jasmine.createSpy('sun'),
			onObjects: jasmine.createSpy('objects'),
			onElevation: jasmine.createSpy('height'),
		};
		view.installSceneControls(actions);
		const app = new Flat32Application(document.createElement('div'), {
			stellarCatalog: 'brightest-500',
			presentationFilters: [],
		});
		const state = {
			...app._locationTimeController.start(),
			modeKind: 'flat-local',
			skyRenderMode: 'no-atmosphere',
			observerHeight: {value: 5, units: 'meters'},
			sunIlluminationScale: 0,
			sunDiscBrightnessScale: 0.25,
		};
		view.showSceneControls(state, true, {value: 500, units: 'meters'});
		const sky = root.querySelector('#flat32-atmosphere-control');
		expect(sky.tagName).toBe('SELECT');
		expect(sky.hasAttribute('aria-pressed')).toBeFalse();
		expect(root.querySelector('#flat32-sun-controls').hidden).toBeFalse();
		expect(root.querySelector('#flat32-scene-control-status').textContent).toContain('showing 5 m');
		sky.value = 'shader-off';
		sky.dispatchEvent(new Event('change'));
		expect(actions.onSky).toHaveBeenCalledWith('shader-off');
		const illumination = root.querySelector('#flat32-sun-illumination');
		illumination.value = '10';
		illumination.dispatchEvent(new Event('change'));
		expect(actions.onSun).toHaveBeenCalledWith({sunIlluminationScale: 0.1, sunDiscBrightnessScale: 0.25});
		view.showSceneControls({...state, skyRenderMode: 'full'}, false);
		expect(sky.querySelector('[value="no-atmosphere"]').disabled).toBeTrue();
		expect(root.querySelector('#flat32-elevation-control').disabled).toBeTrue();
		expect(root.querySelector('#flat32-sun-controls').hidden).toBeTrue();
		view.dispose();
		app.dispose();
	});
	it('keeps the accepted eye and endpoints intact until geometry-family scene publication, including rollback', () => {
		const host = new ThreeSceneRuntime(document.createElement('canvas'), fail);
		spyOn(host, 'refreshShadowMaps');
		const mode = new FlatLocalMode({
			observerHeight: {value: 500, units: 'meters'},
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			observation: {
				instant: '2024-06-21T07:00:00.000Z',
				location: {
					latitude: {value: 37.3382, units: 'degrees'},
					longitude: {value: -121.8863, units: 'degrees'},
				},
			},
			localSunCachePolicy: 'compact-v9-native15',
			maximumScatteringOrder: 1,
			stellarCatalog: 'brightest-500',
			presentationFilters: [],
		});
		const originalCamera = host.camera,
			originalScene = host.scene,
			stage = new StagedSceneRuntime(host, mode, () => true);
		try {
			expect(host.camera).toBe(originalCamera);
			expect(host.scene).toBe(originalScene);
			expect(host.camera.position.y).toBe(0.005);
			expect(stage.camera.position.y).toBe(0.5);
			const visibleBounds = stage.endpointScene.getSceneDepthEndpointPositions().length;
			stage.endpointScene.setObjectsVisible(false);
			expect(stage.endpointScene.describe().shadowCasterCount).toBe(0);
			expect(stage.endpointScene.getSceneDepthEndpointPositions().length).toBeLessThan(visibleBounds);
			host.camera.rotation.y = 0.7;
			host.camera.updateMatrixWorld(true);
			stage.publish();
			expect(host.camera).toBe(stage.camera);
			expect(host.camera.position.y).toBe(0.5);
			expect(host.camera.quaternion.toArray()).toEqual(originalCamera.quaternion.toArray());
			stage.revert();
			expect(host.camera).toBe(originalCamera);
			expect(host.scene).toBe(originalScene);
		} finally {
			stage.dispose();
			mode.dispose();
			host.dispose();
		}
	});
	it('accepts independent Sun fractions and preserves Sun-owned lighting through scaling and physical updates', () => {
		expect(Flat32SceneControls.resolve().sunIlluminationScale).toBe(1);
		expect(
			Flat32SceneControls.resolveSunPresentation({sunIlluminationScale: 0, sunDiscBrightnessScale: 0.2}),
		).toEqual({sunIlluminationScale: 0, sunDiscBrightnessScale: 0.2});
		const parent = new THREE.Group(),
			unrelated = new THREE.AmbientLight(0xffffff, 3);
		parent.add(unrelated);
		const lighting = new LocalSunSceneLighting(parent);
		lighting.install();
		try {
			const raw = lighting.describe();
			lighting.setSunIlluminationScale(0.25);
			expect(lighting.describe().ambientIntensity).toBe(raw.ambientIntensity * 0.25);
			expect(lighting.describe().directionalIntensity).toBeCloseTo(raw.directionalIntensity * 0.25, 12);
			lighting.updateFromLocalSun({coordinates: [0, 100, 20], units: 'scene-units'});
			expect(lighting.describe().directionalIntensity).toBeCloseTo(raw.directionalIntensity * 0.25, 12);
			lighting.setSunIlluminationScale(0);
			expect(lighting.describe().ambientIntensity).toBe(0);
			expect(lighting.describe().directionalIntensity).toBe(0);
			expect(unrelated.intensity).toBe(3);
			lighting.setSunIlluminationScale(1);
			expect(lighting.describe().directionalIntensity).toBeCloseTo(raw.directionalIntensity, 12);
		} finally {
			lighting.dispose();
		}
	});
	it('retains independent controls when a location/time transition reconstructs application state', () => {
		const root = document.createElement('div');
		const app = new Flat32Application(root, {stellarCatalog: 'brightest-500', presentationFilters: []});
		try {
			app._view.start();
			spyOn(app._view, 'showApplicationState');
			app._state = {
				...app._locationTimeController.start(),
				modeKind: 'flat-local',
				skyRenderMode: 'no-atmosphere',
				sunIlluminationScale: 0.25,
				sunDiscBrightnessScale: 0.5,
				observerHeight: {value: 500, units: 'meters'},
			};
			app._commitLocationTimeState(app._locationTimeController.nextLocation(app._state));
			expect(app._state.skyRenderMode).toBe('no-atmosphere');
			expect(app._state.sunIlluminationScale).toBe(0.25);
			expect(app._state.sunDiscBrightnessScale).toBe(0.5);
			expect(app._state.observerHeight).toEqual({value: 500, units: 'meters'});
			expect(app._state.modeKind).toBe('flat-local');
		} finally {
			app.dispose();
		}
	});

	it('rejects unsupported controls instead of clamping or silently choosing another render mode', () => {
		for (const value of [-0.1, 1.1, NaN, Infinity, null, '0.5']) {
			expect(() => Flat32SceneControls.resolveSunPresentation({sunIlluminationScale: value})).toThrowError(
				RangeError,
			);
			expect(() => Flat32SceneControls.resolveSunPresentation({sunDiscBrightnessScale: value})).toThrowError(
				RangeError,
			);
		}
		expect(() => Flat32SceneControls.resolve({skyRenderMode: 'unknown'})).toThrowError(/unsupported/);
		expect(() => Flat32SceneControls.resolve({observerHeight: {value: 600, units: 'meters'}})).toThrowError(
			/5 m, 500 m or 2 km/,
		);
	});
	it('retains Full/Shader off boolean compatibility and accepts an explicit independent sky mode', () => {
		expect(Flat32SceneControls.resolve().skyRenderMode).toBe('full');
		expect(Flat32SceneControls.resolve({atmosphereShaderEnabled: false}).skyRenderMode).toBe('shader-off');
		expect(Flat32SceneControls.resolve({atmosphereShaderEnabled: true}).skyRenderMode).toBe('full');
		expect(
			Flat32SceneControls.resolve({skyRenderMode: 'no-atmosphere', atmosphereShaderEnabled: false}).skyRenderMode,
		).toBe('no-atmosphere');
	});

	for (const height of [5, 500, 2000]) {
		it(`maps the actual camera and receiver to ${height} metres in both supported geometries`, () => {
			const observerHeight = Flat32SceneControls.resolve({
				observerHeight: {value: height / 1000, units: 'kilometers'},
			}).observerHeight;
			const observation = {
				instant: '2024-06-21T04:26:03.503Z',
				location: {
					latitude: {value: 37.3382, units: 'degrees'},
					longitude: {value: -121.8863, units: 'degrees'},
				},
			};
			const distant = createDistantSunSceneState({
				observation,
				observerHeight,
				observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
			});
			const distantMode = new SphericalDistantMode({
				sceneState: distant,
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				sourceAngularRadius: {value: 0.004675, units: 'radians'},
				maximumScatteringOrder: 4,
				stellarCatalog: 'brightest-500',
				presentationFilters: [],
			});
			const local = new FlatLocalMode({
				observation,
				observerHeight,
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				maximumScatteringOrder: 1,
				localSunCachePolicy: 'compact-v9-native15',
				stellarCatalog: 'brightest-500',
				presentationFilters: [],
			});
			try {
				for (const geometry of [distant.geometry, local.geometry]) {
					const camera = new THREE.PerspectiveCamera(50, 1, 0.002, 500);
					camera.position.set(0, height / 1000, 0);
					const bindings = Algorithm32Bindings.create(THREE);
					Algorithm32Bindings.update({
						bindingValues: bindings,
						camera,
						props: {sceneScale: ATMOSPHERE_SCENE_SCALE, config: {geometry}},
					});
					const origin = bindings['geometry.cameraWorldPosition'];
					const physicalHeight =
						geometry === distant.geometry
							? Math.hypot(origin.x, origin.y, origin.z) -
								distant.geometry.configuration.bottomRadius.value
							: origin.z;
					expect(physicalHeight).toBeCloseTo(height, 8);
				}
				expect(local.observerHeight).toEqual(observerHeight);
				expect(local.compactProfile.domains.topology).toBeDefined();
			} finally {
				local.dispose();
				distantMode.dispose();
			}
		});
	}
	it('reuses one compact cache identity for live observer heights while leaving the installed profile unchanged', () => {
		const observation = {
			instant: '2024-06-21T07:00:00.000Z',
			location: {latitude: {value: 37.3382, units: 'degrees'}, longitude: {value: -121.8863, units: 'degrees'}},
		};
		const mode = new FlatLocalMode({
			observation,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			maximumScatteringOrder: 1,
			localSunCachePolicy: 'compact-v9-native15',
			stellarCatalog: 'brightest-500',
			presentationFilters: [],
		});
		try {
			const original = mode.compactProfile;
			for (const height of [5, 500, 2000]) {
				const profile = original.createLiveProfile({
					observation,
					receiverPosition: {coordinates: [0, 0, height], units: 'meters'},
				});
				expect(profile.contentHash).toBe(original.contentHash);
				expect(profile.models.geometry.configuration.observerPosition.coordinates[2]).toBe(height);
			}
			expect(mode.compactProfile).toBe(original);
			expect(mode.observerHeight.value).toBe(5);
		} finally {
			mode.dispose();
		}
	});
});
