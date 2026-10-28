import React, {act} from 'react';
import AppShell from '../components/AppShell.jsx';
import {createTestHarness} from '../../../testing/TestHarness.js';
class AppViewStub {
	constructor(initialState) {
		this.state = initialState;
		this.requested = [];
		this.listener = null;
		this.unlistened = false;
	}
	listen(_event, listener) {
		this.listener = listener;
		return listener;
	}
	unlisten(_event, listener) {
		this.unlistened = listener === this.listener;
	}
	getShellState() {
		return this.state;
	}
	requestPage(pageId) {
		this.requested.push(pageId);
		return this.state.pages.find((page) => page.id === pageId) || null;
	}
	emit(nextState) {
		this.state = nextState;
		act(() => this.listener(nextState));
	}
}
const state = () => ({
	activePageId: 'first',
	notFound: false,
	pageComponent: <section>First page</section>,
	pages: [
		{id: 'first', label: 'first.label'},
		{id: 'second', label: 'second.label'},
	],
});
describe('app shell', () => {
	let harness;
	afterEach(() => harness?.unmount());
	it('renders controller-owned page state and reacts to view events', () => {
		const view = new AppViewStub(state());
		harness = createTestHarness();
		const result = harness.render(AppShell, {appView: view, initialState: view.state, title: 'Test App'});
		expect(result.query('main').textContent).toBe('First page');
		view.emit({...state(), activePageId: null, pageComponent: null, notFound: true});
		expect(result.query('main').textContent).toBe('Page not found');
		view.emit({activePageId: null, pageComponent: null, pages: [], notFound: false});
		expect(result.query('main').textContent).toBe('');
		harness.unmount();
		expect(view.unlistened).toBeTrue();
		harness = null;
	});
});
