import React, {Component} from 'react';
import Alert from '@mui/material/Alert';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

/**
 * Form-level MUI feedback message with localization.
 */
export default class BaseFormMessage extends Component {
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
	 * Call this method to render the configured form message when it has content.
	 *
	 * @returns {React.ReactNode} - The feedback message or no content.
	 */
	render() {
		const {label, children, type = 'info', ...props} = this.props;
		const content = children ?? resolveComponentText(this.appContext, label);
		if (!content) {
			return null;
		}
		const severity = props.severity || type;
		const variant = props.variant || 'outlined';
		return (
			<Alert {...props} severity={severity} variant={variant}>
				{content}
			</Alert>
		);
	}
}
