import React, {act} from 'react';
import {Registry} from '@polylith/core';
import {ThemeProvider} from '@mui/material/styles';
import StyledEngineProvider from '@mui/styled-engine/StyledEngineProvider';
import CssBaseline from '@mui/material/CssBaseline';
import BaseButton from '../../components/BaseButton.jsx';
import BaseDialog from '../../components/BaseDialog.jsx';
import BaseSelect from '../../components/BaseSelect.jsx';
import {ThemeService} from '../theme.js';
import {createTestHarness} from '../../testing/TestHarness.js';

/**
 * Creates a theme with an isolated application context capability.
 *
 * @param {object} defaults - Synthetic control defaults.
 * @returns {ThemeService} - Ready theme owner.
 */
function createService(defaults) {
	let registry = new Registry();
	registry.register('app-context', {get: () => defaults});
	let service = new ThemeService(registry);
	service.ready();
	return service;
}

describe('application MUI theme', () => {
	it('derives compatible defaults from context and keeps one theme across repeated readiness', () => {
		let service = createService({controlSize: 'medium', controlVariant: 'outlined'});
		let theme = service.getTheme();
		expect(theme.components.MuiButton.defaultProps.size).toBe('medium');
		expect(theme.components.MuiButton.defaultProps.variant).toBe('outlined');
		for (let name of ['MuiTextField', 'MuiFormControl', 'MuiSelect']) {
			expect(theme.components[name].defaultProps).toEqual({size: 'medium', variant: 'outlined'});
		}
		for (let name of ['MuiCheckbox', 'MuiRadio', 'MuiIconButton']) {
			expect(theme.components[name].defaultProps).toEqual({size: 'medium'});
		}
		service.ready();
		expect(service.getTheme()).toBe(theme);
		expect(theme.colorSchemeSelector).toBe('class');
	});

	it('mounts the real provider stack while bases still honor caller overrides', () => {
		let theme = createService({controlSize: 'small', controlVariant: 'outlined'}).getTheme();
		let harness = createTestHarness();
		function Surface() {
			return React.createElement(
				StyledEngineProvider,
				{enableCssLayer: true},
				React.createElement(
					ThemeProvider,
					{theme, defaultMode: 'dark', storageManager: null},
					React.createElement(CssBaseline),
					React.createElement(BaseButton, {label: 'Apply', size: 'large', variant: 'contained'}),
				),
			);
		}
		try {
			let result = harness.render(Surface);
			expect(result.query('.MuiButton-sizeLarge.MuiButton-contained')).toBeTruthy();
			expect(document.documentElement.classList.contains('dark')).toBeTrue();
		} finally {
			harness.unmount();
		}
	});

	it('keeps portalled menus and dialogs inside the provider theme', () => {
		let theme = createService({controlSize: 'small', controlVariant: 'outlined'}).getTheme();
		let harness = createTestHarness();
		function Surface({open}) {
			return React.createElement(
				StyledEngineProvider,
				{enableCssLayer: true},
				React.createElement(
					ThemeProvider,
					{theme, defaultMode: 'dark', storageManager: null},
					React.createElement(BaseSelect, {
						label: 'Mode',
						value: '',
						options: [{value: 'flat', label: 'Flat'}],
					}),
					React.createElement(BaseDialog, {
						open,
						showClose: true,
						title: 'Settings',
						actions: [{id: 'apply', label: 'Apply'}],
					}),
				),
			);
		}
		try {
			let result = harness.render(Surface, {open: false});
			act(() =>
				result
					.query('[role="combobox"]')
					.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, button: 0})),
			);
			expect(result.query('[role="listbox"]')).toBeNull();
			expect(result.queryDocument('[role="listbox"] [role="option"]').textContent).toBe('Flat');
			harness.click(result.queryDocument('[role="option"]'));
			result.rerender({open: true});
			expect(result.query('[role="dialog"]')).toBeNull();
			expect(result.queryDocument('.MuiDialogActions-root .MuiButton-sizeSmall.MuiButton-outlined')).toBeTruthy();
			expect(result.queryDocument('.MuiDialogTitle-root .MuiIconButton-sizeSmall')).toBeTruthy();
			expect(document.documentElement.classList.contains('dark')).toBeTrue();
		} finally {
			harness.unmount();
		}
	});
});
