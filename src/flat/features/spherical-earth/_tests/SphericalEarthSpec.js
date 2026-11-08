import {Registry, Service} from '@polylith/core';
import {SphericalEarthModel} from '../models/spherical-earth-model.js';
import {SphericalEarthController} from '../controller.js';
import {SphericalEarthView} from '../views/spherical-earth.js';
import {SphericalEarthSession} from '../SphericalEarthSession.js';
import {SphericalEarthRuntime} from '../runtime/SphericalEarthRuntime.js';
import {AppPagesService} from '../../../services/app-pages.js';
import {UiContributionsService} from '../../workspace/services/ui-contributions.js';

/**
 * Controlled accepted configuration used by the real controller.
 */
class Configuration extends Service {
	constructor(registry) {
		super('configuration', registry);
		this.value = {timestamp: Date.parse('2024-06-20T19:00:00Z'), location: null};
		this.implement(['get']);
	}

	get() {
		return this.value;
	}
}

/**
 * Call this function to cross a pending promise boundary.
 *
 * @returns {Promise<void>} - Next task.
 */
function settle() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Call this function to create a registered model with independent scoped records.
 *
 * @returns {SphericalEarthModel} - Started model service.
 */
function model() {
	const service = new SphericalEarthModel(new Registry());
	service.start();
	service.open('one');
	service.open('two');
	return service;
}

describe('Spherical Earth registered feature', () => {
	it('waits for a removed session before allowing shared providers to stop', async () => {
		const controller = new SphericalEarthController(new Registry());
		let finish;
		controller.model = {close: jasmine.createSpy('close')};
		controller.sessions.set('one', {
			canvas: null,
			release: new Promise((resolve) => {
				finish = resolve;
			}),
		});
		controller.unmount('one');
		let stopped = false;
		const completion = controller.stop().then(() => {
			stopped = true;
		});
		await settle();
		expect(stopped).toBeFalse();
		finish();
		await completion;
		expect(stopped).toBeTrue();
		expect(controller.model.close).toHaveBeenCalledWith('one');
	});

	it('retires a lost context immediately and shares release completion with Retry', async () => {
		const runtime = Object.create(SphericalEarthRuntime.prototype),
			canvas = document.createElement('canvas'),
			released = [];
		let finish;
		runtime.canvas = canvas;
		runtime.release = null;
		runtime.disposed = false;
		runtime.pending = new Promise((resolve) => {
			finish = resolve;
		});
		runtime.pointerLook = {dispose: () => released.push('pointer')};
		runtime.resizeObserver = {disconnect: () => released.push('resize')};
		runtime.renderRequest = null;
		runtime._releaseFrame = () => released.push('frame');
		runtime.backend = {dispose: () => released.push('backend')};
		runtime.renderer = {dispose: () => released.push('renderer')};
		runtime.onFailure = jasmine.createSpy('failure');
		const event = new Event('webglcontextlost', {cancelable: true});
		runtime._onContextLost(event);
		expect(event.defaultPrevented).toBeTrue();
		expect(runtime.disposed).toBeTrue();
		expect(runtime.contextLost).toBeTrue();
		expect(runtime.onFailure).toHaveBeenCalled();
		expect(released).toEqual(['pointer', 'resize']);
		const release = runtime.dispose();
		expect(runtime.dispose()).toBe(release);
		finish();
		await release;
		expect(released).toEqual(['pointer', 'resize', 'frame', 'backend', 'renderer']);
	});

	it('registers its page, independently scoped controls and missing-location presentation', () => {
		const registry = new Registry(),
			pages = new AppPagesService(registry);
		pages.start();
		const contributions = new UiContributionsService(registry);
		contributions.start();
		new Configuration(registry);
		const state = new SphericalEarthModel(registry);
		state.start();
		const controller = new SphericalEarthController(registry),
			view = new SphericalEarthView(registry);
		controller.ready();
		view.ready();
		expect(pages.getById('spherical-earth').controller).toBe('spherical-earth-controller');
		controller.mount({viewId: 'one'});
		controller.mount({viewId: 'two'});
		expect(view.getState('one').status).toBe('waiting');
		expect(contributions.get().length).toBe(4);
		view.setFieldOfView('one', 90);
		expect(view.getState('two').camera.fieldOfViewDegrees).toBe(50);
		controller.ready();
		expect(contributions.get().length).toBe(4);
		controller.unmount('one');
		expect(contributions.get().length).toBe(2);
		controller.stop();
		view.stop();
		expect(contributions.get()).toEqual([]);
	});

	it('derives exact timestamp/coordinates and keeps each camera and sky independent', () => {
		const state = model();
		const observation = state.getObservation({timestamp: 0, location: {latitude: 45, longitude: 20}});
		expect(observation.instant).toBe('1970-01-01T00:00:00.000Z');
		expect(observation.location.latitude).toEqual({value: 45, units: 'degrees'});
		state.setFieldOfView('one', 35);
		state.setSkyRenderMode('one', 'shader-off');
		state.acceptHeight('one', {value: 40000, units: 'meters'});
		expect(state.getCamera('two').observerHeightMeters).toBe(5);
		expect(state.getShaderOptions('two').mode).toBe('full');
		expect(state.getShaderOptions('one')).toEqual({
			mode: 'shader-off',
			atmosphereEnabled: false,
			sunIlluminationScale: 0,
			sunDiscBrightnessScale: 1,
			ambientLightIntensity: 1,
		});
	});

	it('serializes valid time progress, cancels superseded heights and rejects late completion after close', async () => {
		const state = model(),
			jobs = [],
			canvas = document.createElement('canvas');
		const runtime = {
			prepare: (observation, signal, height) =>
				new Promise((resolve) => jobs.push({observation, signal, height, resolve})),
			dispose: async () => {},
			setFieldOfView: () => {},
			refreshShaderOptions: () => {},
			centerOnSun: () => {},
		};
		const session = new SphericalEarthSession(
			'one',
			state,
			() => {},
			() => runtime,
		);
		session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
		session.attach(canvas);
		await settle();
		session.update({timestamp: 1000, location: {latitude: 0, longitude: 0}});
		expect(jobs[0].signal.aborted).toBeFalse();
		jobs[0].resolve({retirementErrors: []});
		await settle();
		expect(jobs[1].observation.instant).toBe('1970-01-01T00:00:01.000Z');
		session.setObserverHeight({value: 100, units: 'meters'});
		expect(jobs[1].signal.aborted).toBeTrue();
		jobs[1].resolve({retirementErrors: []});
		await settle();
		expect(jobs[2].height.value).toBe(100);
		session.setFieldOfView(90);
		expect(jobs.length).toBe(3);
		session.detach(canvas);
		jobs[2].resolve({retirementErrors: []});
		await session.release;
		await settle();
		expect(session.getState().renderedObservation).toBeNull();
	});
	it('retries a cache failure on the retained runtime while preserving the last accepted frame', async () => {
		const state = model(),
			canvas = document.createElement('canvas');
		let calls = 0;
		const runtime = {
			prepare: async () => {
				if (++calls === 2) {
					throw new Error('cache unavailable');
				}
				return {retirementErrors: []};
			},
			canRetryRetained: () => true,
			dispose: async () => {},
		};
		const factory = jasmine.createSpy('runtime').and.returnValue(runtime),
			session = new SphericalEarthSession('one', state, () => {}, factory);
		session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
		session.attach(canvas);
		await settle();
		session.update({timestamp: 1000, location: {latitude: 0, longitude: 0}});
		await settle();
		expect(session.getState().status).toBe('error');
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:00.000Z');
		session.retry();
		await settle();
		expect(session.getState().status).toBe('ready');
		expect(factory).toHaveBeenCalledTimes(1);
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:01.000Z');
		session.detach(canvas);
		await session.release;
	});
});
