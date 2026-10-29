import React, {act} from 'react';
import WorkspaceShell from '../components/WorkspaceShell.jsx';
import {createTestHarness} from '../../../testing/TestHarness.js';
const viewport = (id, pageId = null, component = null) => ({id, pageId, page: null, component, tools: [], status: []});
const initial = () => ({
	views: [viewport('view-1')],
	pages: [],
	toolbar: [],
	notFound: false,
	configuration: {open: false, target: null, contributions: []},
});
class ViewStub {
	constructor() {
		this.state = initial();
		this.actions = [];
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

	requestPage(pageId, viewId) {
		this.actions.push({pageId, viewId});
	}

	toggleComparison() {
		this.actions.push('comparison');
	}

	closeView(viewId) {
		this.actions.push({close: viewId});
	}

	toggleConfiguration() {
		this.actions.push('configuration');
	}

	selectConfigurationTarget(viewId) {
		this.actions.push({target: viewId});
	}

	emit(state) {
		this.state = state;
		act(() => this.listener(state));
	}
}
describe('workspace React frame', () => {
	let harness, view, result;
	beforeEach(() => {
		harness = createTestHarness();
		view = new ViewStub();
	});
	afterEach(() => harness.unmount());
	it('shows a usable empty workspace and relays comparison without inventing scene controls', () => {
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		expect(result.query('h1').textContent).toBe('Flat');
		expect(result.queryAll('main section').length).toBe(1);
		expect(result.query('main').textContent).toContain('No scene selected.');
		expect(result.query('select')).toBeNull();
		harness.click(result.query('button[aria-pressed]'));
		expect(view.actions).toEqual(['comparison']);
		expect(result.queryAll('main section').length).toBe(1);
	});
	it('preserves feature-owned DOM state when an independently keyed second view opens and closes', () => {
		let primary = viewport('view-1', 'scene', <input aria-label="Feature draft" defaultValue="kept" />);
		view.state = {...initial(), views: [primary]};
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		let draft = result.query('input');
		draft.value = 'edited';
		view.emit({...view.state, views: [primary, viewport('view-2')]});
		harness.click(result.query('.workspace-close'));
		expect(view.actions).toContain({close: 'view-2'});
		expect(result.query('input').value).toBe('edited');
		expect(result.queryAll('main section').length).toBe(2);
		view.emit({...view.state, views: [primary]});
		expect(result.query('input').value).toBe('edited');
		expect(document.activeElement).toBe(result.query('button[aria-pressed]'));
	});
	it('renders feature contributions and relays selection to the exact view', () => {
		view.state = {
			...initial(),
			toolbar: [{registrationId: 1, component: <button>Owned tool</button>}],
			pages: [
				{id: 'one', label: 'One'},
				{id: 'two', label: 'Two'},
			],
			views: [viewport('view-1'), viewport('view-2')],
		};
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		expect(result.query('header').textContent).toContain('Owned tool');
		let second = result.queryAll('main select')[1];
		act(() => {
			second.value = 'two';
			second.dispatchEvent(new Event('change', {bubbles: true}));
		});
		expect(view.actions).toEqual([{pageId: 'two', viewId: 'view-2'}]);
	});
	it('opens a nonmodal configuration host, relays scope, and restores focus after Escape', () => {
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		harness.click(result.query('button[aria-controls]'));
		view.emit({
			...view.state,
			configuration: {open: true, target: null, contributions: []},
			views: [viewport('view-1'), viewport('view-2')],
		});
		expect(result.query('aside')).toBeTruthy();
		expect(document.activeElement).toBe(result.query('aside button'));
		let target = result.query('aside select');
		act(() => {
			target.value = 'view-2';
			target.dispatchEvent(new Event('change', {bubbles: true}));
		});
		expect(view.actions).toContain({target: 'view-2'});
		act(() => result.query('aside').dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true})));
		view.emit({...view.state, configuration: {open: false, target: null, contributions: []}});
		expect(result.query('aside')).toBeNull();
		expect(document.activeElement).toBe(result.query('button[aria-controls]'));
	});
	it('updates routed failure presentation and removes its exact listener', () => {
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		view.emit({...view.state, notFound: true});
		expect(result.query('main').textContent).toContain('Page not found');
		harness.unmount();
		expect(view.unlistened).toBeTrue();
	});
	it('detaches the original view when its explicit presentation owner is replaced', () => {
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		let replacement = new ViewStub();
		replacement.state = {...replacement.state, notFound: true};
		harness.rerender({workspaceView: replacement, initialState: replacement.state});
		expect(view.unlistened).toBeTrue();
		expect(result.query('main').textContent).toContain('Page not found');
		harness.unmount();
		expect(replacement.unlistened).toBeTrue();
	});
	it('keeps enabled localization failures empty rather than falling back to literal labels', () => {
		harness.withContext({localizationEnabled: true, localize: null});
		result = harness.render(WorkspaceShell, {workspaceView: view, initialState: view.state});
		expect(result.query('h1').textContent).toBe('');
	});
});
