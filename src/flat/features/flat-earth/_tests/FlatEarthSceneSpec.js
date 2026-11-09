import {createModel, createSession} from './helpers.js';

/**
 * Call this function to flush lifecycle promise continuations without running graphics work.
 *
 * @returns {Promise<void>} - Next task boundary.
 */
function settle() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Call this function to create a complete shared observation input for session checks.
 *
 * @param {number} timestamp - Exact Unix epoch milliseconds.
 * @param {number} [latitude] - Geographic latitude in degrees.
 * @returns {ApplicationConfiguration} - Shared location and current time.
 */
function configuration(timestamp, latitude = 0) {
	return {timestamp, location: {latitude, longitude: 0}};
}

describe('Flat Earth scene ownership', () => {
	it('keeps displayed observation and accepted height aligned after post-commit retirement failure', async () => {
		let calls = 0;
		let factory = jasmine.createSpy('runtime').and.callFake(() => ({
			prepare: async () => ({retirementErrors: ++calls === 2 ? [new Error('injected retired resource')] : []}),
			dispose: async () => {},
		}));
		let session = createSession('view-1', () => {}, factory);
		let canvas = document.createElement('canvas');
		session.update(configuration(0));
		session.attach(canvas);
		await settle();
		session.setObserverHeight({value: 100, units: 'meters'});
		await settle();
		expect(session.getState().camera.observerHeightMeters).toBe(100);
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:00.000Z');
		expect(session.getState().status).toBe('error');
		expect(session.getState().error).toContain('injected retired resource');
		session.update(configuration(1000));
		await settle();
		expect(session.getState().status).toBe('ready');
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:01.000Z');
		expect(factory).toHaveBeenCalledTimes(1);
		session.detach(canvas);
		await session.release;
	});

	it('publishes complete intermediate time progress and preserves the final height/time across invalidation', async () => {
		let jobs = [];
		let session = createSession(
			'view-1',
			() => {},
			() => ({
				prepare: (observation, signal, height) =>
					new Promise((resolve) => jobs.push({observation, signal, height, resolve})),
				dispose: async () => {},
			}),
		);
		let canvas = document.createElement('canvas');
		session.update(configuration(0));
		session.attach(canvas);
		await settle();
		jobs[0].resolve();
		await settle();
		session.setObserverHeight({value: 100, units: 'meters'});
		await settle();
		session.update(configuration(1000));
		session.update(configuration(2000));
		expect(jobs[1].signal.aborted).toBeFalse();
		jobs[1].resolve();
		await settle();
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:00.000Z');
		expect(session.getState().status).toBe('preparing');
		expect(jobs[2].observation.instant).toBe('1970-01-01T00:00:02.000Z');
		expect(jobs[2].height.value).toBe(100);
		session.setObserverHeight({value: 500, units: 'meters'});
		session.update(configuration(3000));
		expect(jobs[2].signal.aborted).toBeTrue();
		jobs[2].resolve();
		await settle();
		expect(jobs[3].height.value).toBe(500);
		expect(jobs[3].observation.instant).toBe('1970-01-01T00:00:03.000Z');
		jobs[3].resolve();
		await settle();
		expect(session.getState().camera.observerHeightMeters).toBe(500);
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:03.000Z');
		expect(session.getState().status).toBe('ready');
		session.detach(canvas);
		await session.release;
	});

	it('uses the exact shared instant and unit-bearing coordinates without inventing an initial location', () => {
		let first = createModel();
		let second = createModel();
		first.open('view-1');
		second.open('view-1');
		expect(first.getObservation({timestamp: 0})).toBeNull();
		expect(first.getObservation(configuration(0))).toEqual({
			instant: '1970-01-01T00:00:00.000Z',
			location: {latitude: {value: 0, units: 'degrees'}, longitude: {value: 0, units: 'degrees'}},
		});
		first.setFieldOfView('view-1', 70);
		first.acceptHeight('view-1', {value: 20, units: 'meters'});
		expect(second.getCamera('view-1').fieldOfViewDegrees).toBe(50);
		expect(second.getCamera('view-1').observerHeightMeters).toBe(5);
	});

	it('owns separate records in one registry, protects snapshots, and releases only the closed view', () => {
		let model = createModel();
		model.open('view-1');
		model.open('view-2');
		model.setFieldOfView('view-1', 35);
		model.acceptHeight('view-1', {value: 100, units: 'meters'});
		model.setOrientation('view-1', [0, 0.5, 0, Math.sqrt(0.75)]);
		let snapshot = model.getCamera('view-1');
		snapshot.orientation[0] = 42;
		expect(model.getCamera('view-1').orientation[0]).toBe(0);
		expect(model.getCamera('view-2')).toEqual({
			compassVisible: false,
			observerHeightMeters: 5,
			fieldOfViewDegrees: 50,
			orientation: [0, 0, 0, 1],
		});
		model.close('view-1');
		expect(() => model.getCamera('view-1')).toThrowError('Unknown Flat Earth view: view-1');
		expect(model.getCamera('view-2').observerHeightMeters).toBe(5);
		model.open('view-1');
		expect(model.getCamera('view-1').fieldOfViewDegrees).toBe(50);
	});

	it('coalesces clock updates without starving preparation and publishes coherent completed observations', async () => {
		let calls = [];
		let runtime = {
			prepare: (observation, signal) => new Promise((resolve) => calls.push({observation, signal, resolve})),
			dispose: async () => {},
		};
		let states = [];
		let session = createSession(
			'view-1',
			(state) => states.push(state),
			() => runtime,
		);
		let canvas = document.createElement('canvas');
		session.update(configuration(0));
		session.attach(canvas);
		await settle();
		session.update(configuration(1000));
		session.update(configuration(2000));
		expect(calls.length).toBe(1);
		expect(calls[0].signal.aborted).toBeFalse();
		calls[0].resolve();
		await settle();
		expect(calls.length).toBe(2);
		expect(calls[1].observation.instant).toBe('1970-01-01T00:00:02.000Z');
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:00.000Z');
		calls[1].resolve();
		await settle();
		expect(session.getState().status).toBe('ready');
		expect(session.getState().renderedObservation.instant).toBe('1970-01-01T00:00:02.000Z');
		session.detach(canvas);
		await session.release;
	});

	it('cancels stale location work, ignores detached completions, and releases exact canvas ownership', async () => {
		let calls = [];
		let disposed = jasmine.createSpy('dispose').and.resolveTo();
		let runtime = {
			prepare: (observation, signal) => new Promise((resolve) => calls.push({observation, signal, resolve})),
			dispose: disposed,
		};
		let session = createSession(
			'view-1',
			() => {},
			() => runtime,
		);
		let canvas = document.createElement('canvas');
		session.update(configuration(0));
		session.attach(canvas);
		await settle();
		session.update(configuration(0, 40));
		expect(calls[0].signal.aborted).toBeTrue();
		calls[0].resolve();
		await settle();
		expect(calls[1].observation.location.latitude.value).toBe(40);
		session.detach(document.createElement('canvas'));
		expect(disposed).not.toHaveBeenCalled();
		session.detach(canvas);
		await session.release;
		calls[1].resolve();
		await settle();
		expect(session.getState().renderedObservation).toBeNull();
		expect(disposed).toHaveBeenCalledTimes(1);
	});

	it('recovers a failed scene with a new renderer lifetime and independently retains another view', async () => {
		let disposals = 0;
		let creations = 0;
		let factory = () => {
			let number = ++creations;
			return {
				prepare: async () => {
					if (number === 1) {
						throw new Error('GPU unavailable');
					}
				},
				dispose: async () => {
					disposals++;
				},
			};
		};
		let first = createSession('view-1', () => {}, factory);
		let second = createSession('view-2', () => {}, factory);
		let firstCanvas = document.createElement('canvas');
		let secondCanvas = document.createElement('canvas');
		first.update(configuration(0));
		first.attach(firstCanvas);
		await settle();
		expect(first.getState().status).toBe('error');
		expect(first.getState().error).toBe('GPU unavailable');
		second.update(configuration(0));
		second.attach(secondCanvas);
		await settle();
		expect(second.getState().status).toBe('ready');
		first.retry();
		await settle();
		await settle();
		expect(first.getState().status).toBe('ready');
		first.detach(firstCanvas);
		await first.release;
		expect(second.getState().status).toBe('ready');
		second.detach(secondCanvas);
		await second.release;
		expect(disposals).toBe(3);
	});
});
