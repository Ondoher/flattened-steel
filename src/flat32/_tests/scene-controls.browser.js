import * as THREE from 'three';
import {Flat32SceneControls} from '../Flat32SceneControls.js';
import {createDistantSunSceneState} from '../DistantSunSceneState.js';
import {FlatLocalMode} from '../FlatLocalMode.js';
import {SphericalDistantMode} from '../SphericalDistantMode.js';
import {Flat32Application} from '../Flat32Application.js';
import {Algorithm32Bindings} from '../../algorithm32/implementation/react-three/Algorithm32Bindings.js';
import {ATMOSPHERE_SCENE_SCALE, ATMOSPHERE_OBSERVER_UP_DIRECTION} from '../consts.js';

describe('Flat32 scene control foundations', () => {
	it('retains independent controls when a location/time transition reconstructs application state', () => {
		const root = document.createElement('div');
		const app = new Flat32Application(root, {stellarCatalog: 'brightest-500', presentationFilters: []});
		try {
			spyOn(app._view, 'showApplicationState');
			app._state = {
				...app._locationTimeController.start(),
				modeKind: 'flat-local',
				skyRenderMode: 'no-atmosphere',
				observerHeight: {value: 500, units: 'meters'},
			};
			app._commitLocationTimeState(app._locationTimeController.nextLocation(app._state));
			expect(app._state.skyRenderMode).toBe('no-atmosphere');
			expect(app._state.observerHeight).toEqual({value: 500, units: 'meters'});
			expect(app._state.modeKind).toBe('flat-local');
		} finally {
			app.dispose();
		}
	});

	it('rejects unsupported controls instead of clamping or silently choosing another render mode', () => {
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
});
