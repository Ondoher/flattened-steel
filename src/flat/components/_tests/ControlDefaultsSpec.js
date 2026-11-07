import BaseButton from '../BaseButton.jsx';
import BaseTextInput from '../BaseTextInput.jsx';
import TextInput from '../TextInput.jsx';
import BaseSelect from '../BaseSelect.jsx';
import Select from '../Select.jsx';
import BaseCheckbox from '../BaseCheckbox.jsx';
import BaseRadioButtons from '../BaseRadioButtons.jsx';
import BaseDialog from '../BaseDialog.jsx';
import {createTestHarness} from '../../testing/TestHarness.js';

describe('base control context defaults without a theme provider', () => {
	let harness;
	afterEach(() => harness?.unmount());

	it('uses context for an omitted button priority and respects explicit priority and variant', () => {
		harness = createTestHarness().withContext({controlSize: 'medium', controlVariant: 'text'});
		let result = harness.render(BaseButton, {label: 'Apply'});
		expect(result.query('.MuiButton-sizeMedium.MuiButton-text')).toBeTruthy();
		result.rerender({priority: 'primary'});
		expect(result.query('.MuiButton-contained')).toBeTruthy();
		result.rerender({priority: 'secondary'});
		expect(result.query('.MuiButton-outlined')).toBeTruthy();
		result.rerender({priority: 'primary', size: 'large', variant: 'outlined'});
		expect(result.query('.MuiButton-sizeLarge.MuiButton-outlined')).toBeTruthy();
		result.rerender({priority: undefined, size: undefined, variant: undefined});
		expect(result.query('.MuiButton-sizeMedium.MuiButton-text')).toBeTruthy();
	});

	for (const Control of [BaseTextInput, TextInput]) {
		it(`${Control.name} inherits field composition and accepts independent overrides`, () => {
			harness = createTestHarness().withContext({controlSize: 'medium', controlVariant: 'filled'});
			let result = harness.render(Control, {label: 'Latitude'});
			expect(result.query('.MuiFilledInput-root')).toBeTruthy();
			expect(result.query('.MuiInputLabel-filled')).toBeTruthy();
			expect(result.query('.MuiInputBase-sizeSmall')).toBeNull();
			result.rerender({size: 'small'});
			expect(result.query('.MuiFilledInput-root.MuiInputBase-sizeSmall')).toBeTruthy();
			result.rerender({variant: 'outlined'});
			expect(result.query('.MuiOutlinedInput-root.MuiInputBase-sizeSmall')).toBeTruthy();
			expect(result.query('.MuiInputLabel-outlined.MuiInputLabel-sizeSmall')).toBeTruthy();
		});
	}

	for (const Control of [BaseSelect, Select]) {
		it(`${Control.name} resolves the whole field with top-level props winning over nested props`, () => {
			harness = createTestHarness().withContext({controlSize: 'medium', controlVariant: 'filled'});
			let result = harness.render(Control, {label: 'Mode', value: '', options: []});
			expect(result.query('.MuiFilledInput-root')).toBeTruthy();
			expect(result.query('.MuiInputLabel-filled')).toBeTruthy();
			expect(result.query('.MuiInputBase-sizeSmall')).toBeNull();
			result.rerender({selectProps: {size: 'small', variant: 'standard'}});
			expect(result.query('.MuiInput-root.MuiInputBase-sizeSmall')).toBeTruthy();
			expect(result.query('.MuiInputLabel-standard.MuiInputLabel-sizeSmall')).toBeTruthy();
			result.rerender({size: 'medium', variant: 'outlined'});
			expect(result.query('.MuiOutlinedInput-root')).toBeTruthy();
			expect(result.query('.MuiInputBase-sizeSmall')).toBeNull();
			expect(result.query('.MuiInputLabel-outlined')).toBeTruthy();
		});
	}

	it('applies checkbox size to the interactive recipient with top-level precedence', () => {
		harness = createTestHarness().withContext({controlSize: 'medium'});
		let result = harness.render(BaseCheckbox, {label: 'Enabled'});
		expect(result.query('.MuiCheckbox-sizeMedium input')).toBeTruthy();
		result.rerender({checkboxProps: {size: 'small'}});
		expect(result.query('.MuiCheckbox-sizeSmall input')).toBeTruthy();
		result.rerender({size: 'medium'});
		expect(result.query('.MuiCheckbox-sizeMedium input')).toBeTruthy();
		expect(result.query('.MuiCheckbox-root').getAttribute('variant')).toBeNull();
	});

	it('applies radio size to every recipient with top-level precedence', () => {
		harness = createTestHarness().withContext({controlSize: 'medium'});
		let result = harness.render(BaseRadioButtons, {
			label: 'Mode',
			options: [
				{value: 'a', label: 'A'},
				{value: 'b', label: 'B'},
			],
		});
		expect(result.queryAll('.MuiRadio-root .MuiSvgIcon-fontSizeMedium').length).toBe(4);
		result.rerender({radioProps: {size: 'small'}});
		expect(result.queryAll('.MuiRadio-sizeSmall input').length).toBe(2);
		result.rerender({size: 'medium'});
		expect(result.queryAll('.MuiRadio-root .MuiSvgIcon-fontSizeMedium').length).toBe(4);
		expect(result.query('.MuiRadio-root').getAttribute('variant')).toBeNull();
	});

	it('applies context and action overrides to actual dialog buttons and its portalled close button', () => {
		harness = createTestHarness().withContext({controlSize: 'medium', controlVariant: 'text'});
		let result = harness.render(BaseDialog, {
			open: true,
			showClose: true,
			title: 'Settings',
			actions: [
				{id: 'default', label: 'Default'},
				{id: 'primary', label: 'Primary', priority: 'primary'},
				{id: 'secondary', label: 'Secondary', priority: 'secondary'},
				{id: 'variant', label: 'Variant', variant: 'contained', size: 'large'},
				{id: 'conflict', label: 'Conflict', variant: 'contained', priority: 'secondary'},
			],
		});
		let buttons = result.queryDocumentAll('.MuiDialogActions-root button');
		expect(buttons[0].matches('.MuiButton-sizeMedium.MuiButton-text')).toBeTrue();
		expect(buttons[1].matches('.MuiButton-contained')).toBeTrue();
		expect(buttons[2].matches('.MuiButton-outlined')).toBeTrue();
		expect(buttons[3].matches('.MuiButton-sizeLarge.MuiButton-contained')).toBeTrue();
		expect(buttons[4].matches('.MuiButton-contained')).toBeTrue();
		expect(result.queryDocument('.MuiIconButton-sizeMedium')).toBeTruthy();
		result.rerender({closeButtonProps: {size: 'small'}});
		expect(result.queryDocument('.MuiIconButton-sizeSmall')).toBeTruthy();
		expect(result.queryDocument('.MuiIconButton-root').getAttribute('variant')).toBeNull();
	});
});
