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
import {CanonicalAtmosphere} from '../../algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js';
import {createFlat32Atmosphere} from '../Flat32Atmosphere.js';
import {EndpointScene} from '../EndpointScene.js';

describe('Flat32 scene control foundations', () => {
	it('covers the globe horizon at every supported elevation and heading with one retained ground mesh', () => {
		const state = createDistantSunSceneState({
			observation: {
				instant: '2024-06-21T20:00:00.000Z',
				location: {
					latitude: {value: 37.3382, units: 'degrees'},
					longitude: {value: -121.8863, units: 'degrees'},
				},
			},
			observerHeight: {value: 5, units: 'meters'},
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
		const mode = new SphericalDistantMode({
			sceneState: state,
			sceneScale: ATMOSPHERE_SCENE_SCALE,
			sourceAngularRadius: {value: 0.004675, units: 'radians'},
			maximumScatteringOrder: 4,
			stellarCatalog: 'brightest-500',
			presentationFilters: [],
		});
		const owner = new EndpointScene(new THREE.Scene());
		owner.install();
		try {
			owner.applyMode('spherical-distant', state.geometry);
			const ground = owner._meshes[0];
			ground.updateMatrixWorld(true);
			const radius = state.geometry.configuration.bottomRadius.value / ATMOSPHERE_SCENE_SCALE.value;
			const raycaster = new THREE.Raycaster();
			for (const height of [5, 100, 500, 2000, 10000, 40000]) {
				const eye = height / ATMOSPHERE_SCENE_SCALE.value;
				const horizonAngle = -Math.acos(radius / (radius + eye));
				// Pair samples around diagonal mesh seams: CPU triangle edge tests can miss
				// an exact seam even when both neighbouring triangles cover the ray.
				for (const heading of [
					0, 44.999999, 45.000001, 90, 134.999999, 135.000001, 180, 224.999999, 225.000001, 270, 314.999999,
					315.000001,
				]) {
					const yaw = (heading * Math.PI) / 180;
					// Exact cardinal rays avoid roundoff putting a nearly coplanar ray on a triangle seam.
					const right = Math.abs(Math.sin(yaw)) < 1e-12 ? 0 : Math.sin(yaw);
					const forward = Math.abs(Math.cos(yaw)) < 1e-12 ? 0 : Math.cos(yaw);
					for (const offset of [-0.05, 0.05]) {
						const pitch = horizonAngle + (offset * Math.PI) / 180;
						raycaster.set(
							new THREE.Vector3(0, eye, 0),
							new THREE.Vector3(
								right * Math.cos(pitch),
								Math.sin(pitch),
								-forward * Math.cos(pitch),
							).normalize(),
						);
						expect(raycaster.intersectObject(ground).length > 0)
							.withContext(`${height} m, ${heading} degrees, horizon offset ${offset}`)
							.toBe(offset < 0);
					}
				}
				expect(owner._meshes[0]).toBe(ground);
			}
		} finally {
			owner.dispose();
			mode.dispose();
		}
	});
	it('dispatches native three-state sky and Sun controls with explicit legacy availability', () => {
		const root = document.createElement('div'),
			view = new Flat32View(root);
		view.start();
		const actions = {
			onSky: jasmine.createSpy('sky'),
			onCenterSun: jasmine.createSpy('centerSun'),
			onSun: jasmine.createSpy('sun'),
			onObjects: jasmine.createSpy('objects'),
			onElevation: jasmine.createSpy('height'),
			onFieldOfView: jasmine.createSpy('fov'),
		};
		view.installSceneControls(actions);
		root.querySelector('#flat32-center-sun-control').click();
		expect(actions.onCenterSun).toHaveBeenCalledTimes(1);
		const onLocation = jasmine.createSpy('location');
		const noAction = () => {};
		view.installLocationTimeControls(onLocation, noAction, noAction, noAction, noAction, noAction);
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
		view.showLocationTimeState(state);
		const location = root.querySelector('#flat32-location-control');
		expect(location instanceof HTMLSelectElement).toBeTrue();
		expect([...location.options].map((option) => option.textContent)).toEqual([
			'San Jose',
			'Union Glacier',
			'85°S, 0°',
		]);
		expect(location.value).toBe(String(state.locationIndex));
		location.value = '0';
		location.dispatchEvent(new Event('change', {bubbles: true}));
		expect(onLocation).toHaveBeenCalledOnceWith(0);
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
		const elevation = root.querySelector('#flat32-elevation-control');
		expect(elevation.querySelector('[value="10000"]').textContent).toBe('10 km');
		elevation.value = '10000';
		elevation.dispatchEvent(new Event('change'));
		expect(actions.onElevation).toHaveBeenCalledWith({value: 10000, units: 'meters'});
		expect(elevation.querySelector('[value="40000"]').textContent).toBe('40 km');
		elevation.value = '40000';
		elevation.dispatchEvent(new Event('change', {bubbles: true}));
		expect(actions.onElevation).toHaveBeenCalledWith({value: 40000, units: 'meters'});
		const fov = root.querySelector('#flat32-fov-control');
		expect(fov.value).toBe('50');
		fov.value = '5';
		fov.dispatchEvent(new Event('change', {bubbles: true}));
		expect(actions.onFieldOfView).toHaveBeenCalledOnceWith(5);
		view.showSceneControls({...state, cameraFieldOfViewDegrees: 78}, true);
		expect(fov.value).toBe('78');
		expect(fov.selectedOptions[0].textContent).toBe('Custom (78°)');
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
			host.camera.fov = 5;
			host.camera.updateProjectionMatrix();
			host.camera.updateMatrixWorld(true);
			stage.publish();
			expect(host.camera).toBe(stage.camera);
			expect(host.camera.position.y).toBe(0.5);
			expect(host.camera.quaternion.toArray()).toEqual(originalCamera.quaternion.toArray());
			expect(host.camera.fov).toBe(5);
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
				cameraFieldOfViewDegrees: 5,
			};
			app._commitLocationTimeState(app._locationTimeController.selectLocation(app._state, 0));
			expect(app._state.locationIndex).toBe(0);
			expect(app._state.locationLabel).toBe('San Jose');
			expect(app._state.observation.location.longitude.value).toBe(-121.8863);
			for (const index of [-1, 3, 0.5, NaN, '0', null]) {
				expect(() => app._locationTimeController.selectLocation(app._state, index)).toThrowError(RangeError);
			}
			expect(app._state.skyRenderMode).toBe('no-atmosphere');
			expect(app._state.sunIlluminationScale).toBe(0.25);
			expect(app._state.sunDiscBrightnessScale).toBe(0.5);
			expect(app._state.observerHeight).toEqual({value: 500, units: 'meters'});
			expect(app._state.modeKind).toBe('flat-local');
			expect(app._state.cameraFieldOfViewDegrees).toBe(5);
		} finally {
			app.dispose();
		}
	});
	it('zooms the retained camera without moving the eye, changing direction or rebuilding scene state', () => {
		const app = new Flat32Application(document.createElement('div'), {
			stellarCatalog: 'brightest-500',
			presentationFilters: [],
		});
		const host = new ThreeSceneRuntime(document.createElement('canvas'), fail);
		app._sceneRuntime = host;
		app._state = {
			...app._locationTimeController.start(),
			modeKind: 'spherical-distant',
			cameraFieldOfViewDegrees: 50,
		};
		app._publishedState = {...app._state};
		spyOn(app, '_renderControls');
		const camera = host.camera,
			scene = host.scene,
			position = camera.position.clone(),
			direction = camera.quaternion.clone();
		const originalProjection = camera.projectionMatrix.clone();
		try {
			for (const degrees of [120, 90, 35, 20, 5, 2, 50]) {
				app.setFieldOfView(degrees);
				expect(host.camera).toBe(camera);
				expect(host.scene).toBe(scene);
				expect(camera.position.equals(position)).toBeTrue();
				expect(camera.quaternion.equals(direction)).toBeTrue();
				expect(camera.getEffectiveFOV()).toBeCloseTo(degrees, 9);
				expect(app._state.cameraFieldOfViewDegrees).toBe(degrees);
				expect(app._publishedState.cameraFieldOfViewDegrees).toBe(degrees);
			}
			expect(camera.projectionMatrix.equals(originalProjection)).toBeTrue();
			for (const value of [0, -1, 180, 360, NaN, Infinity, null, '5']) {
				expect(() => app.setFieldOfView(value)).toThrowError(RangeError);
				expect(camera.fov).toBe(50);
			}
		} finally {
			app.dispose();
		}
	});

	it('centers the retained camera on the published Sun in both geometries without changing framing or physical state', () => {
		const observation = {
			instant: '2024-06-21T04:16:03.503Z',
			location: {latitude: {value: 37.3382, units: 'degrees'}, longitude: {value: -121.8863, units: 'degrees'}},
		};
		const sceneState = createDistantSunSceneState({
			observation,
			observerHeight: {value: 40000, units: 'meters'},
			observerUpDirection: ATMOSPHERE_OBSERVER_UP_DIRECTION,
		});
		const modes = [
			new SphericalDistantMode({
				sceneState,
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				sourceAngularRadius: {value: 0.004675, units: 'radians'},
				maximumScatteringOrder: 4,
				stellarCatalog: 'brightest-500',
				presentationFilters: [],
			}),
			new FlatLocalMode({
				observation,
				observerHeight: {value: 40000, units: 'meters'},
				sceneScale: ATMOSPHERE_SCENE_SCALE,
				localSunCachePolicy: 'compact-v9-native15',
				stellarCatalog: 'brightest-500',
				presentationFilters: [],
			}),
		];
		for (const mode of modes) {
			const app = new Flat32Application(document.createElement('div'), {
				stellarCatalog: 'brightest-500',
				presentationFilters: [],
			});
			const host = new ThreeSceneRuntime(document.createElement('canvas'), fail);
			app._sceneRuntime = host;
			app._modeController = {currentMode: mode, dispose() {}};
			const camera = host.camera;
			camera.position.y = 40;
			camera.fov = 5;
			const position = camera.position.clone(),
				scene = host.scene,
				facade = mode.algorithm32;
			spyOn(host, 'requestRender');
			try {
				app.centerOnSun();
				const aimed = camera.getWorldDirection(new THREE.Vector3()).toArray();
				const physical = mode.geometry.mapObserverLocalSceneDirectionToModelDirection(aimed);
				const eye = mode.geometry.mapObserverLocalScenePointToModelPosition(
					{coordinates: camera.position.toArray(), units: 'scene-units'},
					{
						sceneScale: mode.sceneScale,
					},
				);
				const toSun = mode.geometry.resolveSourceRelativePosition({position: eye}).directionToSource;
				expect(physical.reduce((sum, value, index) => sum + value * toSun[index], 0)).toBeCloseTo(1, 12);
				expect(camera.position.equals(position)).toBeTrue();
				expect(camera.fov).toBe(5);
				expect(host.scene).toBe(scene);
				expect(mode.algorithm32).toBe(facade);
				expect(host.requestRender).toHaveBeenCalledOnceWith();
			} finally {
				app.dispose();
				mode.dispose();
			}
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
			/5 m, 100 m, 500 m, 2 km, 10 km or 40 km/,
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

	for (const height of [5, 100, 500, 2000, 10000, 40000]) {
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
				for (const atmosphere of [
					local.compactProfile.models.atmosphere,
					distantMode.algorithm32.config.config.atmosphere,
				]) {
					expect(atmosphere.constants).toEqual(createFlat32Atmosphere().constants);
					expect([...atmosphere.seaLevelMieExtinction.values]).toEqual([
						...createFlat32Atmosphere().seaLevelMieExtinction.values,
					]);
					expect([...atmosphere.seaLevelRayleighScattering.values]).toEqual([
						...new CanonicalAtmosphere().seaLevelRayleighScattering.values,
					]);
				}
			} finally {
				local.dispose();
				distantMode.dispose();
			}
		});
	}
	it('selects the original Bruneton atmosphere in both app modes', () => {
		const canonical = new CanonicalAtmosphere();
		expect(createFlat32Atmosphere().constants).toEqual(canonical.constants);
		expect(canonical.constants.mieAngstromBeta).toBe(0.04);
		expect(canonical.constants.mieScaleHeight).toEqual({value: 1200, units: 'meters'});
		expect(canonical.constants.mieSingleScatteringAlbedo).toBe(0.8);
		expect(canonical.constants.miePhaseFunctionG).toBe(0.7);
	});

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
			for (const height of [5, 100, 500, 2000, 10000, 40000]) {
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
