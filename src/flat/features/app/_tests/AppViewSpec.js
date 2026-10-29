import React from 'react';
import {Registry, Service} from '@polylith/core';
import {AppView} from '../views/app.js';
class ControllerStub extends Service {
	constructor(registry) {
		super('app-controller', registry);
		this.implement(['getState']);
		this.state = {context: {locale: 'en-US'}, content: React.createElement('section', null, 'Provided content')};
	}

	getState() {
		return this.state;
	}
}
describe('application view', () => {
	it('chooses concrete root and shell presentation from controller facts', () => {
		let registry = new Registry();
		let controller = new ControllerStub(registry);
		let view = new AppView(registry);
		view.ready();
		let projection = view.getState();
		expect(projection.context).toBe(controller.state.context);
		expect(projection.presentation.props.content).toBe(controller.state.content);
		expect(view.getComponent().props.appView).toBe(view);
		expect(view.getComponent().props.initialState.presentation.props.content).toBe(controller.state.content);
		view.stop();
	});
	it('relays controller updates once after repeated readiness and detaches exactly', () => {
		let registry = new Registry();
		let controller = new ControllerStub(registry);
		let view = new AppView(registry);
		let changed = jasmine.createSpy('changed');
		view.listen('state-changed', changed);
		view.ready();
		view.ready();
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledTimes(1);
		view.stop();
		view.stop();
		controller.fire('state-changed', controller.state);
		expect(changed).toHaveBeenCalledTimes(1);
	});
});
