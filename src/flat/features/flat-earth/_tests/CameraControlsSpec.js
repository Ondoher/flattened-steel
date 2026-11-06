import {WorkspaceModel} from '../../workspace/models/WorkspaceModel.js';
import {WorkspaceController} from '../../workspace/controller.js';
import {FlatEarthTimeModel} from '../models/FlatEarthTimeModel.js';
import {Registry} from '@polylith/core';
import {PerspectiveCamera, Euler} from 'three';
import {PointerLookController} from '../runtime/PointerLookController.js';
import {createModel, createSession} from './helpers.js';
import {FlatEarthController} from '../controller.js';
import {FlatEarthView} from '../views/flat-earth.js';
import {UiContributionsService} from '../../workspace/services/ui-contributions.js';
import {AppPagesService} from '../../../services/app-pages.js';
import {ConfigurationService} from '../../../services/configuration.js';
import {AnimationLoopService} from '../../../services/animation-loop.js';

/**
 * Call this function to flush owned lifecycle continuations.
 *
 * @returns {Promise<void>} - Next task boundary.
 */
function settle() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Flat Earth camera controls', () => {
	it('matches Flat32 sensitivity/pitch limits, rotates only the locked view, and releases exact lock ownership', async () => {
		let owner = null;
		let original = Object.getOwnPropertyDescriptor(document, 'pointerLockElement');
		Object.defineProperty(document, 'pointerLockElement', {configurable: true, get: () => owner});
		let exit = spyOn(document, 'exitPointerLock').and.callFake(() => {
			owner = null;
			document.dispatchEvent(new Event('pointerlockchange'));
		});
		let firstCanvas = document.createElement('canvas');
		let secondCanvas = document.createElement('canvas');
		let request = jasmine.createSpy('request').and.callFake(() => {
			owner = firstCanvas;
			document.dispatchEvent(new Event('pointerlockchange'));
		});
		firstCanvas.requestPointerLock = request;
		let firstCamera = new PerspectiveCamera();
		let secondCamera = new PerspectiveCamera();
		let status = jasmine.createSpy('status');
		let changed = jasmine.createSpy('changed');
		let first = new PointerLookController(firstCanvas, firstCamera, status, changed);
		let second = new PointerLookController(
			secondCanvas,
			secondCamera,
			() => {},
			() => {},
		);
		try {
			first.start();
			first.start();
			second.start();
			firstCanvas.click();
			await settle();
			expect(request).toHaveBeenCalledTimes(1);
			expect(first.controls.pointerSpeed).toBe(0.7);
			expect(first.controls.minPolarAngle).toBe(0.05);
			expect(first.controls.maxPolarAngle).toBe(Math.PI - 0.05);
			expect(status).toHaveBeenCalledWith('locked');
			document.dispatchEvent(new MouseEvent('mousemove', {movementX: 100, movementY: -50}));
			expect(firstCamera.quaternion.toArray()).not.toEqual([0, 0, 0, 1]);
			expect(secondCamera.quaternion.toArray()).toEqual([0, 0, 0, 1]);
			expect(changed).toHaveBeenCalledTimes(1);
			document.dispatchEvent(new MouseEvent('mousemove', {movementY: -1000000}));
			expect(new Euler().setFromQuaternion(firstCamera.quaternion, 'YXZ').x).toBeCloseTo(Math.PI / 2 - 0.05, 10);
			second.dispose();
			expect(exit).not.toHaveBeenCalled();
			document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
			expect(exit).toHaveBeenCalledTimes(1);
			expect(status).toHaveBeenCalledWith('idle');
			firstCanvas.click();
			await settle();
			first.dispose();
			first.dispose();
			expect(exit).toHaveBeenCalledTimes(2);
			firstCanvas.click();
			document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
			expect(request).toHaveBeenCalledTimes(2);
			expect(exit).toHaveBeenCalledTimes(2);
		} finally {
			first.dispose();
			second.dispose();
			if (original) {
				Object.defineProperty(document, 'pointerLockElement', original);
			} else {
				delete document.pointerLockElement;
			}
		}
	});

	it('reports denied native pointer lock without discarding the scene or leaking a late callback', async () => {
		let canvas = document.createElement('canvas');
		canvas.requestPointerLock = () => Promise.reject(new Error('User denied mouse look'));
		let status = jasmine.createSpy('status');
		let controller = new PointerLookController(canvas, new PerspectiveCamera(), status, () => {});
		controller.start();
		canvas.click();
		await settle();
		expect(status).toHaveBeenCalledWith('error');
		controller.dispose();
		status.calls.reset();
		canvas.click();
		await settle();
		expect(status).not.toHaveBeenCalled();
	});

	it('retains accepted elevation while a new frame is pending and preserves orientation through updates/retry', async () => {
		let jobs = [];
		let report;
		let factory = (canvas, model, viewId, failure, onCamera) => {
			report = onCamera;
			return {
				prepare: (observation, signal, height) =>
					new Promise((resolve) => jobs.push({observation, signal, height, resolve})),
				setFieldOfView: jasmine.createSpy('setFov'),
				centerOnSun: () => {},
				dispose: async () => {},
			};
		};
		let session = createSession('view-1', () => {}, factory);
		let canvas = document.createElement('canvas');
		session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
		session.attach(canvas);
		await settle();
		jobs[0].resolve();
		await settle();
		report({orientation: [0, 0.5, 0, Math.sqrt(0.75)], lookStatus: 'idle'});
		session.setObserverHeight({value: 100, units: 'meters'});
		await settle();
		expect(session.getState().camera.observerHeightMeters).toBe(5);
		expect(session.getState().camera.pendingHeightMeters).toBe(100);
		expect(jobs[1].height).toEqual({value: 100, units: 'meters'});
		jobs[1].resolve();
		await settle();
		expect(session.getState().camera.observerHeightMeters).toBe(100);
		expect(session.getState().camera.pendingHeightMeters).toBeNull();
		session.setFieldOfView(35);
		expect(jobs.length).toBe(2);
		expect(session.getState().camera.fieldOfViewDegrees).toBe(35);
		session.retry();
		await settle();
		await settle();
		expect(session.getState().camera.orientation).toEqual([0, 0.5, 0, Math.sqrt(0.75)]);
		jobs[2].resolve();
		await settle();
		session.detach(canvas);
		await session.release;
	});

	it('keeps presets separate from physical validity and rejects only invalid camera quantities', () => {
		let session = createSession('view-1', () => {});
		session.setObserverHeight({value: 321, units: 'meters'});
		expect(session.getState().camera.observerHeightMeters).toBe(321);
		for (let value of [0, 180, Infinity, NaN]) {
			expect(() => session.setFieldOfView(value)).toThrowError(RangeError);
		}
		expect(() => session.setObserverHeight({value: -1, units: 'meters'})).toThrowError(RangeError);
		expect(session.getState().camera.fieldOfViewDegrees).toBe(50);
	});

	it('registers independent view-tool contributions and replaces/removes exact tokens without resetting cameras', () => {
		let registry = new Registry();
		createModel(registry);
		let clock = new AnimationLoopService(registry);
		clock.start({autoStart: false});
		let configuration = new ConfigurationService(registry);
		configuration.start();
		configuration.ready();
		let pages = new AppPagesService(registry);
		pages.start();
		let tools = new UiContributionsService(registry);
		tools.start();
		new WorkspaceModel(registry).start();
		let workspace = new WorkspaceController(registry);
		workspace.start();
		workspace.ready();
		new FlatEarthTimeModel(registry).start();
		let controller = new FlatEarthController(registry);
		let view = new FlatEarthView(registry);
		controller.start();
		controller.ready();
		view.ready();
		try {
			controller.mount({viewId: 'view-1'});
			controller.mount({viewId: 'view-2'});
			expect(
				tools
					.get()
					.filter((item) => item.slot === 'view-tools')
					.map((item) => item.viewId),
			).toEqual(['view-1', 'view-2']);
			controller.setFieldOfView('view-1', 35);
			controller.setObserverHeight('view-1', {value: 100, units: 'meters'});
			expect(controller.getState('view-2').camera.fieldOfViewDegrees).toBe(50);
			expect(controller.getState('view-2').camera.observerHeightMeters).toBe(5);
			let token = tools.get()[0].registrationId;
			controller.ready();
			expect(tools.get().length).toBe(7);
			expect(tools.get()[0].registrationId).not.toBe(token);
			expect(controller.getState('view-1').camera.fieldOfViewDegrees).toBe(35);
			controller.unmount('view-2');
			expect(tools.get().length).toBe(4);
			expect(controller.mountContribution({contribution: tools.get()[0]}).props.viewId).toBe('view-1');
		} finally {
			controller.stop();
			workspace.stop();
			view.stop();
			configuration.stop();
			clock.stop();
		}
		expect(tools.get()).toEqual([]);
	});
});
