import React, {Component} from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import BaseTextInput from './BaseTextInput.jsx';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

/**
 * Adds an in-field format hint to the shared text input without interpreting its value.
 *
 * @extends {Component<FormatHintInputProps>}
 */
export default class FormatHintInput extends Component {
	static contextType = AppContext;

	/**
	 * Owns the expected-format region inside the input, following the transferred Date control.
	 *
	 * @returns {React.ReactNode} - End adornment containing caller-prepared format data.
	 */
	_renderFormat() {
		let context = /** @type {AppContextValue} */ (this.context);
		let id = `${this.props.id}-format`;
		let hint = resolveComponentText(context, {
			phrase: 'controls.format-hint',
			replacements: {format: this.props.format},
		});
		return (
			<InputAdornment position="end" disablePointerEvents>
				<span id={id} className="format-hint">
					{hint}
				</span>
			</InputAdornment>
		);
	}

	/**
	 * Composes the format adornment with the base's localization, helper text and control defaults.
	 *
	 * @returns {React.ReactElement} - Controlled text input with a persistent in-field hint.
	 */
	render() {
		let {format, className, id, helperText, error, ...props} = this.props;
		let inputClass = ['format-hint-input', className].filter(Boolean).join(' ');
		let hintId = `${id}-format`;
		let helperId = `${id}-helper-text`;
		let describedBy = helperText ? `${hintId} ${helperId}` : hintId;
		let adornment = this._renderFormat();
		let role = error && helperText ? 'alert' : undefined;
		let slotProps = {
			input: {endAdornment: adornment},
			htmlInput: {'aria-describedby': describedBy, 'aria-invalid': Boolean(error)},
			formHelperText: {role},
		};
		return (
			<BaseTextInput
				{...props}
				id={id}
				className={inputClass}
				helperText={helperText}
				error={error}
				slotProps={slotProps}
			/>
		);
	}
}
