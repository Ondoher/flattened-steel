import {act} from 'react';
import {registry} from '@polylith/core';
import {stopApplication} from '../main.jsx';
import '../../features/app/index.js';
import '../../features/workspace/index.js';

describe('application startup', () => {
	it('starts generated services and mounts the configured application root', async () => {
		await act(async () => {
			await registry.start();
			await Promise.resolve();
		});
		const context = registry.subscribe('app-context').get();
		expect(context.registry).toBe(registry);
		expect(registry.subscribe('app-view')).toBeTruthy();
		expect(document.getElementById('main-content').textContent).toContain('Workspace');
		act(() => registry.subscribe('app-context').fire('changed', context));
		act(() => stopApplication());
		act(() => stopApplication());
	});
});
