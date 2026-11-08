import {createModel, createSession} from './helpers.js';
import {FlatEarthShaderPresentation} from '../runtime/FlatEarthShaderPresentation.js';
import FlatEarthViewTools from '../components/FlatEarthViewTools.jsx';
import {TestHarness} from '../../../testing/TestHarness.js';
import {ATMOSPHERIC_VIEW_ENABLED_VALUE_KEY} from '../../../../algorithm32/atmospheric-transport/consts.js';
import {SUN_DISC_BRIGHTNESS_SCALE_VALUE_KEY} from '../../../../algorithm32/celestial-contribution-cache/consts.js';
import {DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY} from '../../../../algorithm32/implementation/color-reset-altitude-half-v1/consts.js';

describe('Flat Earth shader options', () => {
	it('keeps modes independent and derives zero illumination with a full-brightness disc whenever atmosphere is off', () => {
		let model = createModel();
		model.open('first');
		model.open('second');
		expect(model.getShaderOptions('first').mode).toBe('full');
		for (let mode of ['no-atmosphere', 'shader-off']) {
			model.setSkyRenderMode('first', mode);
			expect(model.getShaderOptions('first')).toEqual({
				mode,
				atmosphereEnabled: false,
				sunIlluminationScale: 0,
				sunDiscBrightnessScale: 1,
				ambientLightIntensity: mode === 'shader-off' ? 1 : 0.03,
			});
			expect(model.getShaderOptions('second').mode).toBe('full');
		}
		model.acceptHeight('first', {value: 100, units: 'meters'});
		model.setFieldOfView('first', 70);
		expect(model.getShaderOptions('first').mode).toBe('shader-off');
		model.close('first');
		model.open('first');
		expect(model.getShaderOptions('first').sunIlluminationScale).toBe(1);
		expect(model.getShaderOptions('first').ambientLightIntensity).toBe(0);
	});

	it('redraws a selected mode without preparing a new observation and retains it across surface recreation', async () => {
		let runtimes = [];
		let session = createSession(
			'view',
			() => {},
			() => {
				let runtime = {
					prepare: jasmine.createSpy('prepare').and.resolveTo({retirementErrors: []}),
					refreshShaderOptions: jasmine.createSpy('refresh'),
					dispose: jasmine.createSpy('dispose').and.resolveTo(),
				};
				runtimes.push(runtime);
				return runtime;
			},
		);
		let canvas = document.createElement('canvas');
		session.update({location: {latitude: 0, longitude: 0}, timestamp: 0});
		session.attach(canvas);
		await new Promise((resolve) => setTimeout(resolve, 0));
		session.setSkyRenderMode('no-atmosphere');
		session.setSkyRenderMode('no-atmosphere');
		expect(runtimes[0].refreshShaderOptions).toHaveBeenCalledTimes(1);
		expect(runtimes[0].prepare).toHaveBeenCalledTimes(1);
		expect(session.getState().shader.sunIlluminationScale).toBe(0);
		session.detach(canvas);
		await session.release;
		session.attach(canvas);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(session.getState().shader.mode).toBe('no-atmosphere');
		session.detach(canvas);
		await session.release;
	});

	it('updates actual presentation bindings, receiver adaptation and scene lights, then restores Full', () => {
		let model = createModel();
		model.open('view');
		let frame = {
			bindings: {},
			ambientLight: {intensity: 0},
			lighting: {
				lights: [
					{visible: true, intensity: 2},
					{visible: true, intensity: 50},
				],
			},
			sunLightIntensities: [2, 50],
			algorithm: {
				totalHorizontalIlluminance: {value: 500, units: 'lux'},
				setReceiverLightPresentationScale: jasmine.createSpy('scale'),
			},
			color: {
				displayAdaptationIlluminance: jasmine.createSpy('adaptation').and.callFake((lux) => lux),
				displayGain: jasmine.createSpy('gain').and.returnValue(100),
			},
		};
		for (let mode of ['full', 'no-atmosphere', 'shader-off', 'full']) {
			model.setSkyRenderMode('view', mode);
			FlatEarthShaderPresentation.apply(frame, model.getShaderOptions('view'));
			let full = mode === 'full';
			expect(frame.bindings[ATMOSPHERIC_VIEW_ENABLED_VALUE_KEY]).toBe(full);
			expect(frame.bindings[SUN_DISC_BRIGHTNESS_SCALE_VALUE_KEY]).toBe(1);
			expect(frame.bindings[DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY]).toBe(full ? 500 : 0);
			expect(frame.algorithm.setReceiverLightPresentationScale).toHaveBeenCalledWith(full ? 1 : 0);
			let expectedAmbient = full ? 0 : mode === 'no-atmosphere' ? 0.0003 : 1;
			expect(frame.ambientLight.intensity).toBeCloseTo(expectedAmbient, 12);
			if (mode === 'no-atmosphere') {
				expect(frame.color.displayGain).toHaveBeenCalledWith({value: 0, units: 'lux'});
			}
			expect(frame.lighting.lights.map((light) => light.intensity)).toEqual(full ? [2, 50] : [0, 0]);
			expect(frame.lighting.lights.every((light) => light.visible)).toBeTrue();
		}
		expect(frame.algorithm.totalHorizontalIlluminance.value).toBe(500);
	});

	it('retains the accepted selection and reports failure if renderer restoration also fails', async () => {
		let session = createSession(
			'view',
			() => {},
			() => ({
				prepare: async () => ({retirementErrors: []}),
				refreshShaderOptions: () => {
					throw new Error('renderer unavailable');
				},
				dispose: async () => {},
			}),
		);
		let canvas = document.createElement('canvas');
		session.attach(canvas);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(() => session.setSkyRenderMode('no-atmosphere')).not.toThrow();
		expect(session.getState().shader.mode).toBe('full');
		expect(session.getState().status).toBe('error');
		session.detach(canvas);
		await session.release;
	});

	it('uses composition without atmosphere and bypasses the composer only for Shader off', () => {
		let renderer = {setRenderTarget: jasmine.createSpy('target'), render: jasmine.createSpy('direct')};
		let frame = {scene: {}, camera: {}, composer: {render: jasmine.createSpy('composer')}};
		FlatEarthShaderPresentation.render(frame, renderer, 'no-atmosphere');
		expect(frame.composer.render).toHaveBeenCalledTimes(1);
		expect(renderer.render).not.toHaveBeenCalled();
		FlatEarthShaderPresentation.render(frame, renderer, 'shader-off');
		expect(renderer.setRenderTarget).toHaveBeenCalledWith(null);
		expect(renderer.render).toHaveBeenCalledOnceWith(frame.scene, frame.camera);
		expect(frame.composer.render).toHaveBeenCalledTimes(1);
		FlatEarthShaderPresentation.render(frame, renderer, 'full');
		expect(frame.composer.render).toHaveBeenCalledTimes(2);
	});

	it('presents localized sky choices and relays the selected view identity through its owning view', () => {
		let harness = new TestHarness().withContext({
			localize: {translate: (key) => `translated:${key}`},
		});
		let session = createSession('view', () => {});
		let view = {
			listen: jasmine.createSpy('listen').and.returnValue(7),
			unlisten: jasmine.createSpy('unlisten'),
			getState: () => session.getState(),
			setSkyRenderMode: jasmine.createSpy('select'),
		};
		try {
			let rendered = harness.render(FlatEarthViewTools, {
				viewId: 'view',
				sceneView: view,
				initialState: session.getState(),
				panel: true,
			});
			let select = rendered.query('.flat-earth-sky [role="combobox"]');
			expect(rendered.query('.flat-earth-sky label').textContent).toBe('translated:flat-earth.shader.label');
			let options = harness.openSelect(select);
			expect(options.map((option) => option.getAttribute('data-value'))).toEqual([
				'full',
				'no-atmosphere',
				'shader-off',
			]);
			harness.click(options[1]);
			expect(view.setSkyRenderMode).toHaveBeenCalledWith('view', 'no-atmosphere');
		} finally {
			harness.unmount();
		}
		expect(view.unlisten).toHaveBeenCalledWith('state-changed', 7);
	});
});
