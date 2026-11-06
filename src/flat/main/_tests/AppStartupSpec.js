import {act} from 'react';
import {registry} from '@polylith/core';
import {FlatEarthGraphics} from '../../features/flat-earth/runtime/FlatEarthGraphics.js';
import {stopApplication} from '../main.jsx';
import '../../features/app/index.js';
import '../../features/workspace/index.js';

describe('application startup', () => {
	it('starts generated services and mounts the configured application root', async () => {
		spyOn(FlatEarthGraphics.prototype, 'warm').and.resolveTo();
		await act(async () => {
			await registry.start();
			await Promise.resolve();
		});
		let workspace = document.querySelector('#main-content .workspace-shell');
		act(() => registry.fire('ready'));
		expect(document.querySelector('#main-content .workspace-shell')).toBe(workspace);
		const context = registry.subscribe('app-context').get();
		expect(context.registry).toBe(registry);
		expect(registry.subscribe('app-view')).toBeTruthy();
		expect(document.getElementById('main-content').textContent).toContain('No scene selected.');
		act(() => registry.subscribe('app-context').fire('changed', context));
		act(() => stopApplication());
		act(() => stopApplication());
	});
});
