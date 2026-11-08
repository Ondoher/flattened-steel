import React, {Component} from 'react';
import Button from '@mui/material/Button';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

/**
 * MUI button building block with localization and authored accessibility labels.
 */
export default class BaseButton extends Component {
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
	 * Called by the component to translate configured display text.
	 *
	 * @param {LocalizedText} value - The phrase key and optional replacements.
	 * @returns {string} - The resolved button text.
	 */
	resolve(value) {
		return resolveComponentText(this.appContext, value);
	}

	/**
	 * Call this method to render the configured MUI button.
	 *
	 * @returns {React.ReactNode} - The button presentation.
	 */
	render() {
		const {label, ariaLabel, children, priority, selected = false, size, variant, buttonRef, ...props} = this.props;
		const resolvedSize = size !== undefined ? size : this.appContext.controlSize;
		const resolvedVariant =
			variant !== undefined
				? variant
				: priority !== undefined
					? priority === 'primary'
						? 'contained'
						: 'outlined'
					: this.appContext.controlVariant;
		const resolvedAriaLabel =
			props['aria-label'] ??
			(this.appContext.accessibilityEnabled && ariaLabel ? this.resolve(ariaLabel) : undefined);
		const resolvedPressed =
			props['aria-pressed'] ?? (this.appContext.accessibilityEnabled && selected ? 'true' : undefined);
		const content = children ?? this.resolve(label);
		const type = props.type || 'button';
		return (
			<Button
				{...props}
				ref={buttonRef}
				type={type}
				size={resolvedSize}
				variant={resolvedVariant}
				aria-label={resolvedAriaLabel}
				aria-pressed={resolvedPressed}
			>
				{content}
			</Button>
		);
	}
}
