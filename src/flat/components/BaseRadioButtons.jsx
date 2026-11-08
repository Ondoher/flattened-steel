import React, {Component} from 'react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

let nextRadioGroupId = 1;

/**
 * MUI radio-group building block with localization and accessibility metadata.
 */
export default class BaseRadioButtons extends Component {
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
	 * Creates a radio group with a stable fallback identifier.
	 *
	 * @param {object} props - The initial React properties.
	 */
	constructor(props) {
		super(props);
		this.fallbackId = `radio-group-${nextRadioGroupId++}`;
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
	 * Called by MUI when the selected radio changes.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - The originating input event.
	 */
	handleChange(event) {
		this.props.onChange?.(event.target.value, event);
	}

	/**
	 * Called by the group to render one radio option.
	 *
	 * @param {object} option - The option configuration.
	 * @returns {React.ReactNode} - The radio option.
	 */
	renderOption(option) {
		const {size, radioProps = {}} = this.props;
		const resolvedSize =
			size !== undefined ? size : radioProps.size !== undefined ? radioProps.size : this.appContext.controlSize;
		const radio = <Radio {...radioProps} size={resolvedSize} />;
		const label = this.resolve(option.label);
		return (
			<FormControlLabel
				key={option.value}
				value={option.value}
				disabled={option.disabled}
				control={radio}
				label={label}
			/>
		);
	}

	/**
	 * Call this method to render the configured radio group.
	 *
	 * @returns {React.ReactNode} - The radio-group presentation.
	 */
	render() {
		const {
			id,
			label,
			helperText,
			ariaLabel,
			options = [],
			onChange,
			value,
			row = false,
			size,
			radioProps,
			...props
		} = this.props;
		const groupId = id || this.fallbackId;
		const helperId = helperText ? `${groupId}-helper` : undefined;
		const labelId = `${groupId}-label`;
		const labelText = this.resolve(label);
		const labelledBy = this.appContext.accessibilityEnabled ? labelId : undefined;
		const describedBy = this.appContext.accessibilityEnabled ? helperId : undefined;
		const ariaLabelText = this.appContext.accessibilityEnabled && ariaLabel ? this.resolve(ariaLabel) : undefined;
		const renderedOptions = options.map((option) => this.renderOption(option));
		const helper = helperText ? <FormHelperText id={helperId}>{this.resolve(helperText)}</FormHelperText> : null;
		return (
			<FormControl {...props}>
				<FormLabel id={labelId}>{labelText}</FormLabel>
				<RadioGroup
					value={value}
					row={row}
					onChange={this.handleChange}
					aria-labelledby={labelledBy}
					aria-describedby={describedBy}
					aria-label={ariaLabelText}
				>
					{renderedOptions}
				</RadioGroup>
				{helper}
			</FormControl>
		);
	}
}
