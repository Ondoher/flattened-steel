import React, {act} from 'react';
import AccessTime from '@mui/icons-material/AccessTime';
import IconButton from '../IconButton.jsx';
import IconMenuButton from '../IconMenuButton.jsx';
import {createTestHarness} from '../../testing/TestHarness.js';

describe('shared toolbar icon controls', () => {
	let harness;
	afterEach(() => harness?.unmount());

	it('uses a controlled MUI selected trigger without selecting on menu opening or action selection', () => {
		harness = createTestHarness().withLocale('en-US');
		const changed = jasmine.createSpy('sync action');
		const result = harness.render(IconMenuButton, {
			label: 'camera.sync.label',
			icon: <AccessTime />,
			selected: false,
			options: [{value: 'now', label: 'camera.sync.now'}],
			onChange: changed,
		});
		const button = result.query('button');
		expect(button.classList.contains('MuiToggleButton-sizeSmall')).toBeTrue();
		expect(button.getAttribute('aria-pressed')).toBe('false');
		harness.click(button);
		expect(button.getAttribute('aria-pressed')).toBe('false');
		expect(result.queryDocument('[role="menuitemradio"]')).toBeNull();
		harness.click(result.queryDocument('[role="menuitem"][data-value="now"]'));
		expect(changed).toHaveBeenCalledOnceWith('now');
		expect(button.getAttribute('aria-pressed')).toBe('false');
		result.rerender({selected: true});
		expect(button.classList.contains('Mui-selected')).toBeTrue();
		expect(button.getAttribute('aria-pressed')).toBe('true');
	});

	it('closes an open menu when its trigger becomes unavailable and ignores a stale action', () => {
		harness = createTestHarness().withLocale('en-US');
		const changed = jasmine.createSpy('stale sync action');
		const result = harness.render(IconMenuButton, {
			label: 'camera.sync.label',
			icon: <AccessTime />,
			selected: false,
			options: [{value: 'both', label: 'camera.sync.both'}],
			onChange: changed,
		});
		harness.click(result.query('button'));
		const stale = result.queryDocument('[role="menuitem"]');
		result.rerender({disabled: true});
		harness.click(stale);
		expect(changed).not.toHaveBeenCalled();
		expect(result.query('button').getAttribute('aria-expanded')).toBe('false');
		expect(result.query('button').disabled).toBeTrue();
	});

	it('resolves the command once and forwards native button attributes and defaults', () => {
		harness = createTestHarness().withLocale('en-US');
		const translated = spyOn(harness.context.localize, 'translate').and.callThrough();
		const clicked = jasmine.createSpy('clicked');
		const result = harness.render(IconButton, {
			label: 'flat-earth.time.title',
			icon: <AccessTime />,
			'data-view-id': 'view-2',
			onClick: clicked,
		});
		const button = result.query('button');
		expect(button.getAttribute('aria-label')).toBe('Flat Earth time');
		expect(button.classList.contains('MuiIconButton-sizeSmall')).toBeTrue();
		expect(button.classList.contains('app-icon-button--outlined')).toBeTrue();
		expect(button.dataset.viewId).toBe('view-2');
		expect(translated.calls.allArgs().map(([key]) => key)).toEqual(['flat-earth.time.title']);
		harness.click(button);
		expect(clicked).toHaveBeenCalledTimes(1);
		result.rerender({size: 'large', variant: 'text'});
		expect(button.classList.contains('MuiIconButton-sizeLarge')).toBeTrue();
		expect(button.classList.contains('app-icon-button--text')).toBeTrue();
	});

	it('presents selected controlled choices and reports their original scalar value once', () => {
		harness = createTestHarness().withLocale('en-US');
		const changed = jasmine.createSpy('changed');
		const result = harness.render(IconMenuButton, {
			label: 'flat-earth.camera.height',
			icon: <AccessTime />,
			value: 100,
			options: [
				{value: 5, label: 'flat-earth.camera.height.current'},
				{value: 100, label: 'flat-earth.camera.height.100'},
			],
			onChange: changed,
		});
		act(() => result.query('button').focus());
		harness.click(result.query('button'));
		expect(result.queryDocument('[role="menuitemradio"][aria-checked="true"]').textContent).toBe('100 m');
		harness.click(result.queryDocument('[data-value="5"]'));
		expect(changed).toHaveBeenCalledOnceWith(5);
		expect(result.query('button').getAttribute('aria-expanded')).toBe('false');
	});

	it('retains disabled choices and updates the selected item from its caller while open', () => {
		harness = createTestHarness().withLocale('en-US');
		const changed = jasmine.createSpy('changed');
		const result = harness.render(IconMenuButton, {
			label: 'flat-earth.shader.label',
			icon: <AccessTime />,
			value: 'full',
			options: [
				{value: 'full', label: 'flat-earth.shader.full'},
				{value: 'shader-off', label: 'flat-earth.shader.off', disabled: true},
			],
			onChange: changed,
		});
		harness.click(result.query('button'));
		const disabled = result.queryDocument('[data-value="shader-off"]');
		expect(disabled.getAttribute('aria-disabled')).toBe('true');
		harness.click(disabled);
		expect(changed).not.toHaveBeenCalled();
		result.rerender({value: 'shader-off'});
		expect(disabled.getAttribute('aria-checked')).toBe('true');
		expect(result.queryDocument('[data-value="full"]').getAttribute('aria-checked')).toBe('false');
	});
});
