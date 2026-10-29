import React, {act} from 'react';
import App from '../App.jsx';
import AppContext from '../../common/AppContext.js';
import {createTestHarness} from '../../testing/TestHarness.js';

function presentation() {
	let renderLocale = (context) => <span>{context.locale}</span>;
	return (
		<main>
			<AppContext.Consumer>{renderLocale}</AppContext.Consumer>
		</main>
	);
}
class ViewStub {
	constructor(locale = 'en-US') {
		this.registryLookup = jasmine.createSpy('registry lookup');
		this.state = {context: {locale, registry: {subscribe: this.registryLookup}}, presentation: presentation()};
		this.listeners = new Map();
		this.next = 0;
	}

	listen(_event, listener) {
		let token = String(++this.next);
		this.listeners.set(token, listener);
		return token;
	}

	unlisten(_event, token) {
		this.listeners.delete(token);
	}

	getState() {
		return this.state;
	}

	emit(locale) {
		this.state = {...this.state, context: {...this.state.context, locale}};
		act(() => {
			for (let listener of this.listeners.values()) {
				listener(this.state);
			}
		});
	}
}
describe('application React root boundary', () => {
	let harness;
	beforeEach(() => {
		harness = createTestHarness();
	});
	afterEach(() => harness.unmount());
	it('renders and updates context exclusively through its own view without registry access', () => {
		let view = new ViewStub();
		let result = harness.render(App, {appView: view, initialState: view.state});
		expect(result.query('main').textContent).toBe('en-US');
		view.emit('changed');
		expect(result.query('main').textContent).toBe('changed');
		expect(view.registryLookup).not.toHaveBeenCalled();
		harness.unmount();
		expect(view.listeners.size).toBe(0);
	});
	it('detaches the original view before binding an explicitly replaced owner', () => {
		let first = new ViewStub();
		let second = new ViewStub('replacement');
		let result = harness.render(App, {appView: first, initialState: first.state});
		harness.rerender({appView: second, initialState: second.state});
		expect(first.listeners.size).toBe(0);
		expect(second.listeners.size).toBe(1);
		first.emit('stale');
		expect(result.query('main').textContent).toBe('replacement');
		harness.unmount();
		expect(second.listeners.size).toBe(0);
	});
	it('keeps one live subscription through StrictMode lifecycle replay and none after unmount', () => {
		let view = new ViewStub();
		function StrictRoot(props) {
			return (
				<React.StrictMode>
					<App {...props} />
				</React.StrictMode>
			);
		}
		harness.render(StrictRoot, {appView: view, initialState: view.state});
		expect(view.listeners.size).toBe(1);
		harness.unmount();
		expect(view.listeners.size).toBe(0);
	});
});
