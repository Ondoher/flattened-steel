import React, {Component} from 'react';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

let nextSelectId = 1;

/**
 * MUI select building block with localization and accessibility metadata.
 */
export default class BaseSelect extends Component {
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
	 * Creates a select with a stable fallback identifier.
	 *
	 * @param {object} props - The initial React properties.
	 */
	constructor(props) {
		super(props);
		this.fallbackId = `select-${nextSelectId++}`;
		this.handleChange = this.handleChange.bind(this);
	}

	/**
	 * Called by the component to resolve display text.
	 *
	 * @param {LocalizedText} value - The phrase key and optional replacements.
	 * @returns {string} - The resolved text.
	 */
	resolve(value) {
		return resolveComponentText(this.appContext, value);
	}

	/**
	 * Called by MUI when the selected value changes.
	 *
	 * @param {MuiSelectChangeEvent} event - The originating MUI event.
	 * @param {React.ReactNode} child - The selected option element.
	 */
	handleChange(event, child) {
		this.props.onChange?.(event.target.value, event, child);
	}

	/**
	 * Called by the select to render one native or MUI option.
	 *
	 * @param {object} option - The option configuration.
	 * @returns {React.ReactNode} - The rendered option.
	 */
	renderOption(option) {
		const label = this.resolve(option.label);
		const content = this.props.selectProps?.native ? (
			<option key={option.value} value={option.value} disabled={option.disabled}>
				{label}
			</option>
		) : (
			<MenuItem key={option.value} value={option.value} disabled={option.disabled}>
				{label}
			</MenuItem>
		);
		return content;
	}

	/**
	 * Call this method to render the configured select.
	 *
	 * @returns {React.ReactNode} - The select presentation.
	 */
	render() {
		const {
			id,
			label,
			helperText,
			ariaLabel,
			options = [],
			onChange,
			selectProps = {},
			value = '',
			size,
			variant,
			...props
		} = this.props;
		const resolvedSize =
			size !== undefined ? size : selectProps.size !== undefined ? selectProps.size : this.appContext.controlSize;
		const resolvedVariant =
			variant !== undefined
				? variant
				: selectProps.variant !== undefined
					? selectProps.variant
					: this.appContext.controlVariant;
		const selectId = id || this.fallbackId;
		const labelId = `${selectId}-label`;
		const helperId = helperText ? `${selectId}-helper` : undefined;
		const resolvedLabel = this.resolve(label);
		const labelShrink = selectProps.displayEmpty ? true : undefined;
		const fullWidth = props.fullWidth ?? true;
		const describedBy = this.appContext.accessibilityEnabled ? helperId : undefined;
		const ariaLabelText = this.appContext.accessibilityEnabled && ariaLabel ? this.resolve(ariaLabel) : undefined;
		const renderedOptions = options.map((option) => this.renderOption(option));
		const helper = helperText ? <FormHelperText id={helperId}>{this.resolve(helperText)}</FormHelperText> : null;
		return (
			<FormControl {...props} size={resolvedSize} variant={resolvedVariant} fullWidth={fullWidth}>
				<InputLabel id={labelId} shrink={labelShrink}>
					{resolvedLabel}
				</InputLabel>
				<MuiSelect
					{...selectProps}
					size={resolvedSize}
					variant={resolvedVariant}
					id={selectId}
					label={resolvedLabel}
					labelId={labelId}
					value={value}
					onChange={this.handleChange}
					aria-describedby={describedBy}
					aria-label={ariaLabelText}
				>
					{renderedOptions}
				</MuiSelect>
				{helper}
			</FormControl>
		);
	}
}
