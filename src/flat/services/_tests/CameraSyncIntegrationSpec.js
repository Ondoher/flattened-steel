import {Registry} from '@polylith/core';
import {CameraSync} from '../camera-sync.js';
import {ViewCameraSyncReceiver} from '../../common/view-camera-sync-receiver.js';
import {FlatEarthModel} from '../../features/flat-earth/models/FlatEarthModel.js';
import {SphericalEarthModel} from '../../features/spherical-earth/models/spherical-earth-model.js';
import {FlatEarthSession} from '../../features/flat-earth/FlatEarthSession.js';
import {SphericalEarthSession} from '../../features/spherical-earth/SphericalEarthSession.js';

describe('Camera synchronization scene integration', () => {
	let registry, coordinator, sessions, receivers;
	beforeEach(() => {
		registry = new Registry();
		coordinator = new CameraSync(registry);
		coordinator.start();
		sessions = [];
		receivers = [];
		for (const [Model, Session, viewId] of [
			[FlatEarthModel, FlatEarthSession, 'one'],
			[SphericalEarthModel, SphericalEarthSession, 'two'],
		]) {
			const model = new Model(registry);
			model.start();
			model.open(viewId);
			const session = new Session(
				viewId,
				model,
				() => {},
				() => {},
			);
			new ViewCameraSyncReceiver({
				name: 'camera-' + viewId,
				registry,
				coordinator: registry.subscribe('camera-sync'),
				onSynced: (mode) => session.setSyncMode(mode),
				applyControls: (controls) => session.applyCameraControls(controls),
			});
			const receiver = registry.subscribe('camera-' + viewId);
			session.onCameraControlsChanged = (controls) => receiver.publish(controls);
			receiver.connect(session.getCameraControls());
			sessions.push(session);
			receivers.push(receiver);
		}
	});

	afterEach(async () => {
		coordinator.stop();
		for (const session of sessions) {
			if (session.canvas) {
				session.detach(session.canvas);
			}
			await session.release;
		}
	});

	it('matches direction and height before renderer attachment without changing FOV or echoing received controls', async () => {
		const published = spyOn(registry.subscribe('camera-sync'), 'update').and.callThrough();
		sessions[1].model.setOrientation('two', [0, 1, 0, 0]);
		sessions[1].setObserverHeight({value: 100, units: 'meters'});
		sessions[0].setFieldOfView(70);
		receivers[0].request('now');
		await Promise.resolve();
		expect(sessions[0].getCameraControls()).toEqual(sessions[1].getCameraControls());
		expect(sessions[0].getState().camera.fieldOfViewDegrees).toBe(70);
		expect(sessions[0].getState().sync.mode).toBe('off');
		expect(published).toHaveBeenCalledTimes(1);
	});

	it('updates selected state through one-way, reciprocal and off notifications while sharing requested height', async () => {
		receivers[0].request('them');
		expect(sessions.map((session) => session.getState().sync.mode)).toEqual(['them', 'off']);
		sessions[1].setObserverHeight({value: 1000, units: 'meters'});
		await Promise.resolve();
		expect(sessions[0].getCameraControls().observerHeightMeters).toBe(1000);
		receivers[1].request('them');
		expect(sessions.map((session) => session.getState().sync.mode)).toEqual(['both', 'both']);
		sessions[0].setObserverHeight({value: 50, units: 'meters'});
		await Promise.resolve();
		expect(sessions[1].getCameraControls().observerHeightMeters).toBe(50);
		receivers[1].request('off');
		expect(sessions.map((session) => session.getState().sync.mode)).toEqual(['off', 'off']);
		sessions[0].setObserverHeight({value: 5, units: 'meters'});
		expect(sessions[1].getCameraControls().observerHeightMeters).toBe(50);
	});

	it('keeps FOV, compass and shared observation updates independent without broadcasting scene-state notifications', () => {
		receivers[0].request('both');
		const published = spyOn(registry.subscribe('camera-sync'), 'update').and.callThrough();
		sessions[0].setFieldOfView(70);
		sessions[0].toggleCompass();
		for (const session of sessions) {
			session.update({timestamp: 1000, location: {latitude: 37, longitude: -122}});
		}
		expect(published).not.toHaveBeenCalled();
		expect(sessions[1].getState().camera.fieldOfViewDegrees).toBe(50);
		expect(sessions[1].getState().camera.compassVisible).toBeFalse();
		expect(sessions.map((session) => session.getState().sync.mode)).toEqual(['both', 'both']);
	});

	for (const target of [0, 1]) {
		it('returns a physical application failure without echoing or unlinking scene ' + target, async () => {
			const session = sessions[target];
			session.createRuntime = () => ({
				prepare: async (_observation, _signal, height) => {
					if (height.value === 100) {
						throw new Error('injected height preparation failure');
					}
					return {retirementErrors: []};
				},
				setOrientation: () => {},
				dispose: async () => {},
			});
			session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
			session.attach(document.createElement('canvas'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			receivers[target].request('both');
			const published = spyOn(registry.subscribe('camera-sync'), 'update').and.callThrough();
			const error = await receivers[target].cameraChanged({orientation: [0, 1, 0, 0], observerHeightMeters: 100});
			expect(error.message).toBe('injected height preparation failure');
			expect(session.getState().status).toBe('error');
			expect(session.getState().sync.mode).toBe('both');
			expect(session.getState().camera.observerHeightMeters).toBe(5);
			expect(published).not.toHaveBeenCalled();
		});

		it('reuses pending height while incoming orientation requests overlap for scene ' + target, async () => {
			const session = sessions[target],
				jobs = [];
			session.createRuntime = () => ({
				prepare: (observation, signal, height) =>
					new Promise((complete) => jobs.push({signal, height, complete})),
				setOrientation: jasmine.createSpy('received orientation'),
				dispose: async () => {},
			});
			session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
			session.attach(document.createElement('canvas'));
			await new Promise((resolve) => setTimeout(resolve, 0));
			jobs[0].complete({retirementErrors: []});
			await new Promise((resolve) => setTimeout(resolve, 0));
			const published = spyOn(registry.subscribe('camera-sync'), 'update').and.callThrough();
			const requests = [];
			for (const orientation of [
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1],
			]) {
				requests.push(receivers[target].cameraChanged({orientation, observerHeightMeters: 100}));
			}
			expect(jobs.length).toBe(2);
			expect(jobs[1].signal.aborted).toBeFalse();
			expect(session.getCameraControls().observerHeightMeters).toBe(100);
			expect(published).not.toHaveBeenCalled();
			jobs[1].complete({retirementErrors: []});
			expect(await Promise.all(requests)).toEqual([undefined, undefined, undefined]);
			expect(session.getState().camera.observerHeightMeters).toBe(100);
			expect(session.getCameraControls().orientation).toEqual([0, 0, 0, 1]);
		});

		it(
			'keeps newer local input after Off while the old height application finishes for scene ' + target,
			async () => {
				const session = sessions[target],
					jobs = [];
				let reportCamera;
				session.createRuntime = (_canvas, _model, _id, _onFailure, onCameraChange) => {
					reportCamera = onCameraChange;
					return {
						prepare: (observation, signal, height) =>
							new Promise((complete) => jobs.push({signal, height, complete})),
						setOrientation: () => {},
						dispose: async () => {},
					};
				};
				session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
				session.attach(document.createElement('canvas'));
				await new Promise((resolve) => setTimeout(resolve, 0));
				jobs[0].complete({retirementErrors: []});
				await new Promise((resolve) => setTimeout(resolve, 0));
				receivers[target].request('both');
				const old = receivers[target].cameraChanged({orientation: [0, 1, 0, 0], observerHeightMeters: 100});
				receivers[target].request('off');
				session.setObserverHeight({value: 200, units: 'meters'});
				reportCamera({orientation: [0, 0, 1, 0], lookStatus: 'locked'});
				expect(await old).toEqual(jasmine.any(Error));
				expect(jobs[1].signal.aborted).toBeTrue();
				jobs[1].complete({retirementErrors: []});
				await new Promise((resolve) => setTimeout(resolve, 0));
				expect(jobs[2].height.value).toBe(200);
				jobs[2].complete({retirementErrors: []});
				await new Promise((resolve) => setTimeout(resolve, 0));
				expect(session.getCameraControls()).toEqual({orientation: [0, 0, 1, 0], observerHeightMeters: 200});
				expect(session.getState().sync.mode).toBe('off');
			},
		);

		it(
			'does not report look-status-only changes and settles pending application on detach for scene ' + target,
			async () => {
				const session = sessions[target],
					jobs = [];
				let reportCamera;
				session.createRuntime = (_canvas, _model, _id, _onFailure, onCameraChange) => {
					reportCamera = onCameraChange;
					return {
						prepare: (observation, signal, height) =>
							new Promise((complete) => jobs.push({signal, height, complete})),
						setOrientation: () => {},
						dispose: async () => {},
					};
				};
				session.update({timestamp: 0, location: {latitude: 0, longitude: 0}});
				session.attach(document.createElement('canvas'));
				await new Promise((resolve) => setTimeout(resolve, 0));
				jobs[0].complete({retirementErrors: []});
				await new Promise((resolve) => setTimeout(resolve, 0));
				const published = spyOn(registry.subscribe('camera-sync'), 'update').and.callThrough();
				reportCamera({orientation: [0, 0, 0, 1], lookStatus: 'locked'});
				expect(published).not.toHaveBeenCalled();
				const application = receivers[target].cameraChanged({
					orientation: [0, 1, 0, 0],
					observerHeightMeters: 100,
				});
				session.detach(session.canvas);
				expect(await application).toEqual(jasmine.any(Error));
				jobs[1].complete({retirementErrors: []});
				expect(published).not.toHaveBeenCalled();
			},
		);
	}

	it('retires the receiver before its old delegates can affect a replacement and notifies the survivor', async () => {
		receivers[0].request('both');
		receivers[0].retire();
		expect(registry.subscribe('camera-one')).toBeUndefined();
		expect(sessions[1].getState().sync.mode).toBe('off');
		const oldControls = sessions[0].getCameraControls();
		expect(await receivers[0].cameraChanged({orientation: [0, 1, 0, 0], observerHeightMeters: 500})).toEqual(
			jasmine.any(Error),
		);
		expect(sessions[0].getCameraControls()).toEqual(oldControls);
	});
});
