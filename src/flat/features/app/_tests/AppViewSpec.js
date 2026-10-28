import {Registry, Service} from '@polylith/core';
import {AppView} from '../views/app.js';

class ControllerStub extends Service {
	constructor(registry) {
		super('app-controller', registry);
		this.implement(['getShellState', 'requestPage']);
		this.state = {activePageId: null, notFound: false, pageComponent: null, pages: []};
	}
	getShellState() {
		return this.state;
	}
	requestPage(pageId) {
		this.requested = pageId;
		return {id: pageId};
	}
}

describe('app view', () => {
	it('projects controller state, relays events, and forwards selection intent', () => {
		const registry = new Registry();
		const controller = new ControllerStub(registry);
		const view = new AppView(registry);
		const changed = jasmine.createSpy('changed');
		view.listen('state-changed', changed);
		view.ready();
		expect(view.getShellState()).toBe(controller.state);
		expect(view.requestPage('home')).toEqual({id: 'home'});
		expect(controller.requested).toBe('home');
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledWith(controller.state);
		view.ready();
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledTimes(2);
		const component = view.getComponent();
		expect(component.props.appView).toBe(view);
		expect(component.props.initialState).toBe(controller.state);
		expect(component.props.title).toBe('app.title');
		expect(component.props.titleLiteral).toBe('Initial setup for a polylith project');
		expect(view.getComponent({className: 'custom'}).props.className).toBe('custom');
		view.stop();
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledTimes(2);
		view.stop();
	});
});
