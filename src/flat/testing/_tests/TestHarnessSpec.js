import React from 'react';
import AppContext from '../../common/AppContext.js';
import {createTestHarness} from '../TestHarness.js';

class Probe extends React.Component {
	static contextType = AppContext;
	render() {
		return (
			<button
				onClick={() => this.context.onPress?.()}
			>{`${this.props.label || 'initial'}:${this.context.locale}`}</button>
		);
	}
}

describe('component TestHarness', () => {
	let harness;
	afterEach(() => harness?.unmount());

	it('composes context, props, services, and interactions', () => {
		const pressed = jasmine.createSpy('pressed');
		const service = {};
		harness = createTestHarness()
			.withProps({label: 'configured'})
			.withContext({locale: 'fr-FR', onPress: pressed})
			.withService('example', service);
		const result = harness.render(Probe);
		expect(result.query('button').textContent).toBe('configured:fr-FR');
		expect(harness.registry.subscribe('example')).toBe(service);
		harness.click(result.query('button'));
		expect(pressed).toHaveBeenCalled();
	});

	it('rerenders into the same root and cleans up', () => {
		harness = createTestHarness();
		const result = harness.render(Probe);
		const container = result.container;
		result.rerender({label: 'next'});
		expect(result.container).toBe(container);
		expect(container.textContent).toContain('next');
		harness.unmount();
		expect(document.body.contains(container)).toBeFalse();
	});

	it('uses a supplied registry without starting application services', () => {
		const service = {label: 'mock service'};
		const registry = {
			subscribe: jasmine.createSpy('subscribe').and.returnValue(service),
			start: jasmine.createSpy('start'),
		};
		harness = createTestHarness().withRegistry(registry).withContext({locale: 'de-DE'});
		const result = harness.render(Probe);
		expect(result.query('button').textContent).toBe('initial:de-DE');
		expect(harness.context.registry).toBe(registry);
		expect(harness.registry.subscribe('example')).toBe(service);
		expect(registry.start).not.toHaveBeenCalled();
	});

	it('keeps context and registry state isolated between harness instances', () => {
		const previous = createTestHarness().withService('example', {}).withContext({locale: 'fr-FR'});
		harness = createTestHarness();
		expect(harness.registry).not.toBe(previous.registry);
		expect(harness.context.locale).toBe('disabled');
		expect(harness.context.localize).not.toBe(previous.context.localize);
		expect(harness.context.localize.translate('Hello %{name}', {name: 'Ada'})).toBe('Hello Ada');
	});
});
