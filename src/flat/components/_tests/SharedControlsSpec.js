import React, {act, createRef} from 'react';
import Button from '../Button.jsx';
import TypeAhead from '../TypeAhead.jsx';
import Slider from '../Slider.jsx';
import Toolbar from '../Toolbar.jsx';
import PanelButton from '../PanelButton.jsx';
import DateField from '../DateField.jsx';
import TimeField from '../TimeField.jsx';
import FormatHintInput from '../FormatHintInput.jsx';
import CityPicker from '../../features/global-configuration/components/CityPicker.jsx';
import {createTestHarness} from '../../testing/TestHarness.js';

const options = [
	{id: 'b', label: 'Second', detail: 'B'},
	{id: 'a', label: 'First', detail: 'A'},
];

/**
 * Sends a real bubbling keyboard gesture through React and MUI.
 *
 * @param {Element} node - Keyboard target.
 * @param {string} key - Keyboard key.
 * @param {string} [type] - Key phase.
 */
function key(node, key, type = 'keydown') {
	act(() => node.dispatchEvent(new KeyboardEvent(type, {key, bubbles: true, cancelable: true})));
}

describe('shared MUI controls', () => {
	let harness;
	afterEach(() => harness?.unmount());

	it('inherits button defaults and preserves native focus refs and explicit ARIA', () => {
		const ref = createRef();
		harness = createTestHarness();
		const result = harness.render(Button, {
			label: 'Apply',
			buttonRef: ref,
			'aria-pressed': true,
			'aria-label': 'Apply changes',
		});
		expect(ref.current).toBe(result.query('button'));
		expect(ref.current.matches('.MuiButton-sizeSmall.MuiButton-outlined')).toBeTrue();
		expect(ref.current.getAttribute('aria-pressed')).toBe('true');
		expect(ref.current.getAttribute('aria-label')).toBe('Apply changes');
	});

	for (const Field of [DateField, TimeField]) {
		it(`${Field.name} preserves partial drafts and presents the format inside the field`, () => {
			const changed = jasmine.createSpy('changed');
			harness = createTestHarness().withLocale('en-US');
			let result = harness.render(Field, {
				id: 'local-entry',
				label: 'global-configuration.date-time.date',
				value: '12/',
				format: 'MM/DD/YYYY',
				onChange: changed,
			});
			expect(result.query('input').value).toBe('12/');
			expect(result.query('.MuiInputBase-sizeSmall.MuiOutlinedInput-root')).toBeTruthy();
			harness.input(result.query('input'), '12/3');
			expect(changed).toHaveBeenCalledWith('12/3');
			result.rerender({value: '12/3', size: 'medium', variant: 'filled'});
			expect(result.query('input').value).toBe('12/3');
			expect(result.query('.MuiFilledInput-root')).toBeTruthy();
			expect(result.query('.MuiInputAdornment-root .format-hint').textContent).toBe('(MM/DD/YYYY)');
			expect(result.query('.MuiFormHelperText-root')).toBeNull();
			expect(result.query('input').getAttribute('aria-describedby')).toBe('local-entry-format');
		});
	}

	it('supports a non-date format hint alongside the base input helper text', () => {
		harness = createTestHarness().withLocale('en-US');
		const changed = jasmine.createSpy('changed');
		const onChange = (event) => changed(event.currentTarget.value);
		const result = harness.render(FormatHintInput, {
			id: 'identifier',
			label: 'workspace.title',
			format: 'AA-000',
			value: 'AB-',
			helperText: 'global-configuration.coordinates.required',
			error: true,
			onChange,
		});
		expect(result.query('.MuiInputAdornment-root').textContent).toBe('(AA-000)');
		expect(result.query('[role="alert"]').textContent).toBe('Enter both latitude and longitude.');
		expect(result.query('input').getAttribute('aria-describedby')).toBe('identifier-format identifier-helper-text');
		harness.input(result.query('input'), 'AB-1');
		expect(changed).toHaveBeenCalledWith('AB-1');
	});

	it('preserves supplied ranking and separates typing from pointer selection', () => {
		const query = jasmine.createSpy('query'),
			selected = jasmine.createSpy('selected');
		harness = createTestHarness();
		const result = harness.render(TypeAhead, {
			label: 'Find',
			query: '',
			options,
			onQueryChange: query,
			onSelect: selected,
		});
		act(() => result.query('input').focus());
		expect(result.queryDocumentAll('[role="option"]').map((node) => node.textContent)).toEqual(['Second', 'First']);
		harness.input(result.query('input'), 'unrelated query');
		result.rerender({query: 'unrelated query'});
		expect(query).toHaveBeenCalledWith('unrelated query');
		expect(result.queryDocumentAll('[role="option"]').length).toBe(2);
		query.calls.reset();
		harness.click(result.queryDocument('[data-option-id="a"]'));
		expect(selected).toHaveBeenCalledWith('a');
		expect(query).not.toHaveBeenCalled();
		expect(result.query('input').value).toBe('unrelated query');
	});

	it('preserves selected identity when ranked results are replaced with new objects', () => {
		harness = createTestHarness();
		const result = harness.render(TypeAhead, {
			label: 'Find',
			query: 'First',
			value: options[1],
			options,
			onQueryChange: jasmine.createSpy('query'),
			onSelect: jasmine.createSpy('selected'),
		});
		act(() => result.query('input').focus());
		result.rerender({options: options.map((option) => ({...option}))});
		expect(result.queryDocument('[data-option-id="a"]').getAttribute('aria-selected')).toBe('true');
	});

	it('clears query text without inventing an accepted option', () => {
		const query = jasmine.createSpy('query'),
			selected = jasmine.createSpy('selected');
		harness = createTestHarness();
		const result = harness.render(TypeAhead, {
			label: 'Find',
			query: 'unfinished',
			options: [],
			clearText: 'Clear query',
			onQueryChange: query,
			onSelect: selected,
		});
		harness.click(result.query('[title="Clear query"]'));
		expect(query).toHaveBeenCalledWith('');
		expect(selected).not.toHaveBeenCalled();
	});

	it('selects the first prepared result when Enter follows typing, without accepting unmatched text', () => {
		const selected = jasmine.createSpy('selected');
		harness = createTestHarness();
		const result = harness.render(TypeAhead, {
			label: 'Find',
			query: '',
			options: [],
			onQueryChange: jasmine.createSpy('query'),
			onSelect: selected,
		});
		act(() => result.query('input').focus());
		harness.input(result.query('input'), 'Second');
		result.rerender({query: 'Second', options});
		key(result.query('input'), 'Enter');
		expect(selected).toHaveBeenCalledWith('b');
		selected.calls.reset();
		result.rerender({query: 'Unmatched', options: []});
		harness.input(result.query('input'), 'Unmatched text');
		result.rerender({query: 'Unmatched text'});
		key(result.query('input'), 'Enter');
		expect(selected).not.toHaveBeenCalled();
	});

	it('adapts city name/detail presentation and reports the catalog identity from keyboard selection', () => {
		const selected = jasmine.createSpy('selected');
		harness = createTestHarness();
		const result = harness.render(CityPicker, {
			query: 'London',
			disabled: false,
			text: (key) => key,
			matches: [{id: 'gb', name: 'London', detail: 'England, GB'}],
			onQueryChange: jasmine.createSpy('query'),
			onSelectCity: selected,
		});
		act(() => result.query('input').focus());
		expect(result.queryDocument('.city-option-content').textContent).toContain('England, GB');
		key(result.query('input'), 'Enter');
		expect(selected).toHaveBeenCalledWith('gb');
	});

	it('keeps repeated keyboard slider changes inside one numeric interaction', () => {
		const events = [];
		harness = createTestHarness();
		const result = harness.render(Slider, {
			value: 0,
			min: -180,
			max: 180,
			step: 0.1,
			onChange: (value) => events.push(['change', value]),
			onCommit: (value) => events.push(['commit', value]),
			onInteractionStart: () => events.push(['start']),
			onInteractionEnd: () => events.push(['end']),
		});
		const input = result.query('input');
		key(input, 'ArrowRight');
		result.rerender({value: 0.1});
		key(input, 'ArrowRight');
		key(input, 'ArrowRight', 'keyup');
		expect(events[0]).toEqual(['start']);
		expect(events.filter((event) => event[0] === 'start').length).toBe(1);
		expect(events.filter((event) => event[0] === 'change')).toEqual([
			['change', 0.1],
			['change', 0.2],
		]);
		expect(events[events.length - 1]).toEqual(['end']);
	});

	it('reports pointer slider values and ends the gesture after MUI commits', () => {
		const changed = jasmine.createSpy('changed'),
			ended = jasmine.createSpy('ended');
		harness = createTestHarness();
		const result = harness.render(Slider, {value: 0, min: 0, max: 100, onChange: changed, onInteractionEnd: ended});
		const root = result.query('.MuiSlider-root'),
			bounds = root.getBoundingClientRect();
		act(() => {
			root.dispatchEvent(
				new PointerEvent('pointerdown', {
					bubbles: true,
					pointerId: 1,
					pointerType: 'mouse',
					button: 0,
					buttons: 1,
					clientX: bounds.left + bounds.width / 2,
					clientY: bounds.top,
				}),
			);
			document.dispatchEvent(
				new PointerEvent('pointerup', {
					bubbles: true,
					pointerId: 1,
					pointerType: 'mouse',
					button: 0,
					clientX: bounds.left + bounds.width / 2,
					clientY: bounds.top,
				}),
			);
		});
		expect(changed).toHaveBeenCalledWith(50);
		expect(ended).toHaveBeenCalledTimes(1);
	});

	it('consumes alternate context at the type-ahead and slider foundations and supports explicit overrides', () => {
		harness = createTestHarness().withContext({controlSize: 'medium', controlVariant: 'filled'});
		let result = harness.render(TypeAhead, {
			label: 'Find',
			query: '',
			options,
			onQueryChange: jasmine.createSpy('query'),
			onSelect: jasmine.createSpy('select'),
		});
		expect(result.query('.MuiFilledInput-root')).toBeTruthy();
		expect(result.query('.MuiInputBase-sizeSmall')).toBeNull();
		result.rerender({size: 'small', variant: 'outlined'});
		expect(result.query('.MuiOutlinedInput-root.MuiInputBase-sizeSmall')).toBeTruthy();
		harness.unmount();
		result = harness.render(Slider, {value: 0, onChange: jasmine.createSpy('change')});
		expect(result.query('.MuiSlider-sizeSmall')).toBeNull();
		result.rerender({size: 'small'});
		expect(result.query('.MuiSlider-sizeSmall')).toBeTruthy();
		expect(result.query('.MuiSlider-root').getAttribute('variant')).toBeNull();
	});

	it('reports invalid date/time drafts without normalizing or accepting them', () => {
		harness = createTestHarness();
		const result = harness.render(DateField, {
			id: 'invalid-date',
			label: 'Date',
			value: '02/31/',
			format: 'MM/DD/YYYY',
			error: 'Invalid date',
			onChange: jasmine.createSpy('change'),
		});
		expect(result.query('input').value).toBe('02/31/');
		expect(result.query('input').getAttribute('aria-invalid')).toBe('true');
		expect(result.query('input').getAttribute('aria-describedby')).toBe(
			'invalid-date-format invalid-date-helper-text',
		);
		expect(result.query('[role="alert"]').textContent).toBe('Invalid date');
	});

	it('cancels a pointer gesture and prevents later pointer movement from reviving it', () => {
		const changed = jasmine.createSpy('changed'),
			ended = jasmine.createSpy('ended'),
			cancelled = jasmine.createSpy('cancelled');
		harness = createTestHarness();
		const result = harness.render(Slider, {
			value: 0,
			onChange: changed,
			onInteractionEnd: ended,
			onInteractionCancel: cancelled,
		});
		const root = result.query('.MuiSlider-root'),
			bounds = root.getBoundingClientRect();
		act(() =>
			root.dispatchEvent(
				new PointerEvent('pointerdown', {
					bubbles: true,
					pointerId: 1,
					pointerType: 'mouse',
					button: 0,
					buttons: 1,
					clientX: bounds.left + bounds.width / 2,
					clientY: bounds.top,
				}),
			),
		);
		act(() => document.dispatchEvent(new PointerEvent('pointercancel', {bubbles: true, pointerId: 1})));
		expect(cancelled).toHaveBeenCalledTimes(1);
		expect(ended).toHaveBeenCalledTimes(1);
		changed.calls.reset();
		act(() =>
			document.dispatchEvent(
				new PointerEvent('pointermove', {
					bubbles: true,
					pointerId: 1,
					pointerType: 'mouse',
					buttons: 1,
					clientX: bounds.left + bounds.width * 0.75,
					clientY: bounds.top,
				}),
			),
		);
		expect(changed).not.toHaveBeenCalled();
	});

	it('ends an active slider interaction on blur and unmount without duplicate callbacks', () => {
		const ended = jasmine.createSpy('ended');
		harness = createTestHarness();
		const result = harness.render(Slider, {
			value: 0,
			onChange: jasmine.createSpy('changed'),
			onInteractionEnd: ended,
		});
		const input = result.query('input');
		act(() => input.focus());
		key(input, 'ArrowRight');
		act(() => input.blur());
		expect(ended).toHaveBeenCalledTimes(1);
		key(input, 'ArrowRight');
		harness.unmount();
		expect(ended).toHaveBeenCalledTimes(2);
		act(() => window.dispatchEvent(new Event('blur')));
		expect(ended).toHaveBeenCalledTimes(2);
	});

	it('supplies a dense reusable toolbar without adopting an application host', () => {
		harness = createTestHarness();
		let result = harness.render(Toolbar, {children: 'Controls'});
		expect(result.query('.MuiToolbar-dense')).toBeTruthy();
		result.rerender({variant: 'regular'});
		expect(result.query('.MuiToolbar-regular')).toBeTruthy();
	});

	it('opens a portalled interactive panel and restores trigger focus on Escape', async () => {
		harness = createTestHarness();
		const child = React.createElement(DateField, {
			id: 'panel-date',
			label: 'Date',
			value: '12/',
			format: 'MM/DD/YYYY',
			autoFocus: true,
			onChange: jasmine.createSpy('date'),
		});
		const result = harness.render(PanelButton, {label: 'Sun position', children: child});
		const trigger = result.query('button');
		act(() => trigger.focus());
		harness.click(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(result.query('[role="dialog"]')).toBeNull();
		expect(result.queryDocument('[role="dialog"] input')).toBe(document.activeElement);
		expect(result.query('[data-testid="KeyboardArrowUpIcon"]')).toBeTruthy();
		key(document.activeElement, 'Escape');
		await waitForPanelClose(result);
		expect(result.queryDocument('[role="dialog"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	it('dismisses nested type-ahead results before closing the interactive panel', async () => {
		harness = createTestHarness();
		const child = React.createElement(TypeAhead, {
			label: 'Find',
			autoFocus: true,
			query: '',
			options,
			onQueryChange: jasmine.createSpy('query'),
			onSelect: jasmine.createSpy('selected'),
		});
		const result = harness.render(PanelButton, {label: 'Options', children: child});
		harness.click(result.query('button'));
		const input = result.queryDocument('[role="dialog"] input');
		expect(result.queryDocument('[role="listbox"]')).toBeTruthy();
		key(input, 'Escape');
		expect(result.queryDocument('[role="listbox"]')).toBeNull();
		expect(result.queryDocument('[role="dialog"]')).toBeTruthy();
		key(input, 'Escape');
		await waitForPanelClose(result);
		expect(result.queryDocument('[role="dialog"]')).toBeNull();
	});

	it('dismisses on the MUI backdrop and restores focus without activating an outside control', async () => {
		harness = createTestHarness();
		const changed = jasmine.createSpy('visibility');
		const outsideAction = jasmine.createSpy('outside action');
		function Surface() {
			return React.createElement(
				'div',
				null,
				React.createElement(PanelButton, {label: 'Options', children: 'Details', onOpenChange: changed}),
				React.createElement(Button, {id: 'outside-action', label: 'Another action', onClick: outsideAction}),
			);
		}
		const result = harness.render(Surface);
		const trigger = result.query('button');
		act(() => trigger.focus());
		harness.click(trigger);
		harness.click(result.queryDocument('.MuiBackdrop-root'));
		await waitForPanelClose(result);
		expect(result.queryDocument('[role="dialog"]')).toBeNull();
		expect(document.activeElement).toBe(trigger);
		expect(outsideAction).not.toHaveBeenCalled();
		expect(changed.calls.allArgs()).toEqual([[true], [false]]);
	});

	it('keeps the parent panel open when selecting a portalled type-ahead result', async () => {
		const selected = jasmine.createSpy('selected');
		harness = createTestHarness();
		const child = React.createElement(TypeAhead, {
			label: 'Find',
			autoFocus: true,
			query: '',
			options,
			onQueryChange: jasmine.createSpy('query'),
			onSelect: selected,
		});
		const result = harness.render(PanelButton, {
			label: 'Options',
			size: 'medium',
			variant: 'text',
			children: child,
		});
		expect(result.query('.MuiButton-sizeMedium.MuiButton-text')).toBeTruthy();
		harness.click(result.query('button'));
		await new Promise((resolve) => setTimeout(resolve, 0));
		harness.click(result.queryDocument('[role="option"]'));
		expect(selected).toHaveBeenCalledWith('b');
		expect(result.queryDocument('[role="dialog"]')).toBeTruthy();
	});
});

/**
 * Waits for MUI's exit transition to finish after a semantic close gesture.
 *
 * @param {object} result - Shared harness DOM queries.
 * @returns {Promise<void>} - Completion after the popup leaves the document.
 */
async function waitForPanelClose(result) {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (!result.queryDocument('[role="dialog"]')) {
			return;
		}
		await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
	}
	throw new Error('The panel did not close after MUI dismissal.');
}
