import React, {Component} from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

let nextCheckboxId = 1;

/**
 * MUI checkbox building block with localization and accessibility metadata.
 */
export default class BaseCheckbox extends Component {
	static contextType = AppContext;

	/**
	 * Provides the typed application context supplied by React.
	 *
	 * @returns {AppContextValue} - Current presentation context.
	 */
	get appContext() {
		return /** @type {AppContextValue} */ (this.context);
	}

	/**
	 * Creates a checkbox with a stable fallback identifier.
	 *
	 * @param {object} props - The initial React properties.
	 */
	constructor(props) {
		super(props);
		this.fallbackId = `checkbox-${nextCheckboxId++}`;
		this.handleChange = this.handleChange.bind(this);
	}

	/**
	 * Called by the component to translate configured display text.
	 *
	 * @param {LocalizedText} value - The phrase key and optional replacements.
	 * @returns {string} - The resolved checkbox text.
	 */
	resolve(value) {
		return resolveComponentText(this.appContext, value);
	}

	/**
	 * Called by the MUI input when its checked state changes.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - The originating input event.
	 */
	handleChange(event) {
		this.props.onChange?.(event.target.checked, event);
	}

	/**
	 * Called by the component to render the configured checkbox input.
	 *
	 * @param {string} checkboxId - The stable checkbox identifier.
	 * @param {string | undefined} helperId - The optional helper-text identifier.
	 * @returns {React.ReactElement} - The checkbox input.
	 */
	renderCheckbox(checkboxId, helperId) {
		const {ariaLabel, checked = false, checkboxProps = {}} = this.props;
		const resolvedSize =
			this.props.size !== undefined
				? this.props.size
				: checkboxProps.size !== undefined
					? checkboxProps.size
					: this.appContext.controlSize;
		const resolvedSlots = {
			...checkboxProps.slotProps,
			input: {
				...checkboxProps.slotProps?.input,
				...(this.appContext.accessibilityEnabled && helperId ? {'aria-describedby': helperId} : {}),
				...(this.appContext.accessibilityEnabled && ariaLabel ? {'aria-label': this.resolve(ariaLabel)} : {}),
			},
		};
		return (
			<Checkbox
				{...checkboxProps}
				size={resolvedSize}
				id={checkboxId}
				checked={checked}
				onChange={this.handleChange}
				slotProps={resolvedSlots}
			/>
		);
	}

	/**
	 * Call this method to render the checkbox and its labels.
	 */
	render() {
		const {id, label, helperText, ariaLabel, checked, onChange, checkboxProps, size, ...props} = this.props;
		const checkboxId = id || this.fallbackId;
		const helperId = helperText ? `${checkboxId}-helper` : undefined;
		const fullWidth = props.fullWidth ?? true;
		const labelText = this.resolve(label);
		const checkbox = this.renderCheckbox(checkboxId, helperId);
		const helper = helperText ? <FormHelperText id={helperId}>{this.resolve(helperText)}</FormHelperText> : null;
		return (
			<FormControl {...props} fullWidth={fullWidth}>
				<FormControlLabel label={labelText} control={checkbox} />
				{helper}
			</FormControl>
		);
	}
}
