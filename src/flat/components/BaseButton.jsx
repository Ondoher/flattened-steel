import React, {Component} from 'react';
import Button from '@mui/material/Button';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

/** MUI button building block with opt-in localization and authored accessibility labels. */
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
	 * Called by the component to resolve literal or localized display text.
	 *
	 * @param {unknown} value - The configured text value or phrase key.
	 * @param {string} fallback - The text returned when the value is absent.
	 * @returns {string} - The resolved button text.
	 */
	resolve(value, fallback = '') {
		return resolveComponentText(this.appContext, this.props.localize ?? false, value, fallback);
	}

	/**
	 * Call this method to render the configured MUI button.
	 *
	 * @returns {React.ReactNode} - The button presentation.
	 */
	render() {
		const {label, ariaLabel, localize, children, priority, selected = false, size, variant, ...props} = this.props;
		const resolvedSize = size !== undefined ? size : this.appContext.controlSize;
		const resolvedVariant =
			variant !== undefined
				? variant
				: priority !== undefined
					? priority === 'primary'
						? 'contained'
						: 'outlined'
					: this.appContext.controlVariant;
		return (
			<Button
				{...props}
				type={props.type || 'button'}
				size={resolvedSize}
				variant={resolvedVariant}
				aria-label={this.appContext.accessibilityEnabled && ariaLabel ? this.resolve(ariaLabel) : undefined}
				aria-pressed={this.appContext.accessibilityEnabled && selected ? 'true' : undefined}
			>
				{children ?? this.resolve(label)}
			</Button>
		);
	}
}
