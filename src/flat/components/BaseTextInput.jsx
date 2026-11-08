import React, {Component} from 'react';
import TextField from '@mui/material/TextField';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

let nextTextInputId = 1;

/**
 * MUI text-input building block with localization and accessibility metadata.
 */
export default class BaseTextInput extends Component {
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
	 * Creates a text input with a stable fallback identifier.
	 *
	 * @param {object} props - The initial React properties.
	 */
	constructor(props) {
		super(props);
		this.fallbackId = `text-input-${nextTextInputId++}`;
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
	 * Call this method to render the configured text input.
	 *
	 * @returns {React.ReactNode} - The text-input presentation.
	 */
	render() {
		const {id, label, helperText, ariaLabel, placeholder, slotProps, size, variant, ...props} = this.props;
		const resolvedSize = size !== undefined ? size : this.appContext.controlSize;
		const resolvedVariant = variant !== undefined ? variant : this.appContext.controlVariant;
		const resolvedAriaLabel =
			this.appContext.accessibilityEnabled && ariaLabel ? this.resolve(ariaLabel) : undefined;
		const inputId = id || this.fallbackId;
		const resolvedLabel = this.resolve(label);
		const resolvedPlaceholder = this.resolve(placeholder);
		const resolvedHelper = this.resolve(helperText) || undefined;
		const fullWidth = props.fullWidth ?? true;
		const resolvedSlots = {
			...slotProps,
			htmlInput: {...slotProps?.htmlInput, ...(resolvedAriaLabel ? {'aria-label': resolvedAriaLabel} : {})},
		};
		return (
			<TextField
				{...props}
				size={resolvedSize}
				variant={resolvedVariant}
				id={inputId}
				label={resolvedLabel}
				placeholder={resolvedPlaceholder}
				helperText={resolvedHelper}
				fullWidth={fullWidth}
				slotProps={resolvedSlots}
			/>
		);
	}
}
