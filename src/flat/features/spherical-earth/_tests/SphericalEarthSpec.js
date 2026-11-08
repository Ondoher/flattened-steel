import {Registry, Service} from '@polylith/core';
import {SphericalEarthModel} from '../models/spherical-earth-model.js';
import {SphericalEarthController} from '../controller.js';
import {SphericalEarthView} from '../views/spherical-earth.js';
import {AppPagesService} from '../../../services/app-pages.js';

/**
 * Shared configuration fixture exposing normal event behavior.
 */
class Configuration extends Service {
	constructor(registry) {
		super('configuration', registry);
		this.value = {location: null, timestamp: Date.parse('2024-06-20T19:00:00Z')};
		this.implement(['get']);
	}

	get() {
		return this.value;
	}
}

/**
 * Controlled cache completion for exact view lifetime checks.
 */
class Cache extends Service {
	constructor(registry) {
		super('distant-sun-cache', registry);
		this.jobs = [];
		this.implement(['prepare']);
	}

	prepare(angle, signal) {
		return new Promise((resolve, reject) => this.jobs.push({angle, signal, resolve, reject}));
	}
}

/**
 * Call this function to cross a promise continuation boundary.
 *
 * @returns {Promise<void>} - Next task.
 */
function settle() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Call this function to create the registered feature with controlled external I/O.
 *
 * @returns {object} - Isolated feature collaborators.
 */
function setup() {
	const registry = new Registry();
	const pages = new AppPagesService(registry);
	pages.start();
	const configuration = new Configuration(registry),
		cache = new Cache(registry);
	const model = new SphericalEarthModel(registry),
		controller = new SphericalEarthController(registry),
		view = new SphericalEarthView(registry);
	controller.ready();
	view.ready();
	return {pages, configuration, cache, model, controller, view};
}

describe('Spherical Earth registered feature', () => {
	it('registers its own page and waits for shared location', () => {
		const s = setup();
		expect(s.pages.getById('spherical-earth').controller).toBe('spherical-earth-controller');
		const component = s.controller.mount({viewId: 'view-1'});
		expect(component.props.viewId).toBe('view-1');
		expect(s.view.getState('view-1').status).toBe('missing-location');
		expect(s.cache.jobs.length).toBe(0);
		s.controller.stop();
		s.view.stop();
	});

	it('uses spherical solar geometry and preserves two independent subscribers across readiness and close', async () => {
		const s = setup();
		s.configuration.value.location = {latitude: 37.33939, longitude: -121.89496};
		s.controller.mount({viewId: 'one'});
		s.controller.mount({viewId: 'two'});
		expect(s.cache.jobs[0].angle).toBeGreaterThan(0);
		expect(s.cache.jobs[0].angle).toBeLessThan(90);
		expect(s.cache.jobs[0].angle).toBe(s.cache.jobs[1].angle);
		s.controller.unmount('one');
		expect(s.cache.jobs[0].signal.aborted).toBeTrue();
		expect(s.cache.jobs[1].signal.aborted).toBeFalse();
		s.cache.jobs[0].resolve({blockId: 'stale'});
		s.cache.jobs[1].resolve({blockId: 'accepted'});
		await settle();
		expect(s.view.getState('one').status).toBe('missing-location');
		expect(s.view.getState('two').preparation.blockId).toBe('accepted');
		s.controller.ready();
		s.view.ready();
		expect(s.cache.jobs.length).toBe(3);
		s.cache.jobs[2].resolve({blockId: 'restarted'});
		await settle();
		expect(s.view.getState('two').preparation.blockId).toBe('restarted');
		s.controller.stop();
		s.view.stop();
	});

	it('publishes a real failure and retries only the requested view', async () => {
		const s = setup();
		spyOn(console, 'error');
		s.configuration.value.location = {latitude: 0, longitude: 0};
		s.controller.mount({viewId: 'one'});
		s.controller.mount({viewId: 'two'});
		s.cache.jobs[0].reject(new Error('Unavailable'));
		await settle();
		expect(s.view.getState('one').status).toBe('error');
		s.view.retry('one');
		expect(s.cache.jobs[1].signal.aborted).toBeFalse();
		s.cache.jobs[2].resolve({blockId: 'retry'});
		await settle();
		expect(s.view.getState('one').status).toBe('cache-ready');
		s.controller.stop();
		s.view.stop();
	});
});
