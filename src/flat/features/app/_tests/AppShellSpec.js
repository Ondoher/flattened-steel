import React from 'react';
import AppShell from '../components/AppShell.jsx';
import {createTestHarness} from '../../../testing/TestHarness.js';

describe('application presentation boundary', () => {
	it('presents supplied feature content without adding workspace chrome', () => {
		let harness = createTestHarness();
		let result = harness.render(AppShell, {content: <main>Feature-owned workspace</main>});
		expect(result.query('main').textContent).toBe('Feature-owned workspace');
		expect(result.query('button')).toBeNull();
		harness.unmount();
	});
});
