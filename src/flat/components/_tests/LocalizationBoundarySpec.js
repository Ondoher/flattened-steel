import React, {act} from 'react';
import Button from '../Button.jsx';
import BaseSelect from '../BaseSelect.jsx';
import DateField from '../DateField.jsx';
import PanelButton from '../PanelButton.jsx';
import TypeAhead from '../TypeAhead.jsx';
import {createTranslator} from '../../services/localize.js';
import {createTestHarness} from '../../testing/TestHarness.js';

describe('shared control localization boundary', () => {
	let harness;
	afterEach(() => harness?.unmount());

	it('resolves replacement-bearing labels once and follows locale changes without opt-in props', () => {
		harness = createTestHarness().withLocale('en-US');
		const service = harness.context.localize;
		service.translators.set('fr-CA', createTranslator('fr-CA', {'workspace.view': 'Vue %{number}'}));
		const translate = spyOn(service, 'translate').and.callThrough();
		const result = harness.render(Button, {label: {phrase: 'workspace.view', replacements: {number: 2}}});
		expect(result.query('button').textContent).toBe('View 2');
		expect(translate.calls.allArgs().map(([key]) => key)).toEqual(['workspace.view']);
		translate.calls.reset();
		harness.withLocale('fr-CA');
		result.rerender();
		expect(result.query('button').textContent).toBe('Vue 2');
		expect(translate.calls.allArgs().map(([key]) => key)).toEqual(['workspace.view']);
		harness.withLocale('disabled');
		result.rerender({label: {phrase: 'View %{number}', replacements: {number: 3}}});
		expect(result.query('button').textContent).toBe('View 3');
	});

	it('localizes select option labels while retaining machine values and missing-phrase diagnostics', () => {
		harness = createTestHarness().withLocale('en-US');
		spyOn(console, 'warn');
		const result = harness.render(BaseSelect, {
			label: 'flat-earth.shader.label',
			value: 'full',
			options: [{value: 'full', label: 'flat-earth.shader.full'}],
		});
		expect(result.query('[role="combobox"]').textContent).toBe('Full');
		expect(result.query('input').value).toBe('full');
		result.rerender({label: 'absent.label'});
		expect(console.warn).toHaveBeenCalledWith('Missing translation: absent.label');
		expect(result.query('label').textContent).toBe('');
	});

	it('translates type-ahead chrome while leaving search input and catalog names as data', () => {
		harness = createTestHarness().withLocale('en-US');
		const result = harness.render(TypeAhead, {
			label: 'global-configuration.city',
			placeholder: 'global-configuration.cities.placeholder',
			query: 'Paris',
			options: [{id: 'paris', label: 'Paris'}],
			onQueryChange: jasmine.createSpy('query'),
			onSelect: jasmine.createSpy('select'),
		});
		expect(result.query('label').textContent).toBe('City');
		expect(result.query('input').value).toBe('Paris');
		expect(result.query('input').placeholder).toBe('Search by city, state/region, or country code');
		act(() => result.query('input').focus());
		expect(result.queryDocument('[role="option"]').textContent).toBe('Paris');
		expect(result.query('button[title="Clear"]')).toBeTruthy();
	});

	it('localizes date feedback and panel names while preserving unfinished input drafts', () => {
		harness = createTestHarness().withLocale('en-US');
		let result = harness.render(DateField, {
			id: 'translated-date',
			label: 'global-configuration.date-time.date',
			value: '12/',
			format: 'MM/DD/YYYY',
			error: 'global-configuration.date-time.date.required',
			onChange: jasmine.createSpy('date'),
		});
		expect(result.query('label').textContent).toBe('Date');
		expect(result.query('input').value).toBe('12/');
		expect(result.query('.format-hint').textContent).toBe('(MM/DD/YYYY)');
		expect(result.query('input').placeholder).toBe('');
		expect(result.query('[role="alert"]').textContent).toBe('Enter a date.');
		harness.unmount();
		result = harness.render(PanelButton, {label: 'flat-earth.time.settings', children: <input />});
		expect(result.query('button').textContent).toBe('Time settings');
		harness.click(result.query('button'));
		expect(result.queryDocument('[role="dialog"]').getAttribute('aria-label')).toBe('Time settings');
	});
});
