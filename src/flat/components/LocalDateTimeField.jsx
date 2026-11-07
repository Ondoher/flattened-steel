import React, {Component} from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import BaseTextInput from './BaseTextInput.jsx';

/**
 * Shared MUI text presentation for caller-owned local date/time drafts and feedback.
 *
 * @extends {Component<LocalDateTimeFieldProps>}
 */
export default class LocalDateTimeField extends Component {
	/**
	 * Creates a stable text-change adapter without parsing or rewriting drafts.
	 *
	 * @param {LocalDateTimeFieldProps} props - Prepared local-format editing presentation.
	 */
	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	/**
	 * Reports unchanged draft text to its existing owner.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - Native text edit through MUI.
	 */
	_onChange(event) {
		this.props.onChange(event.currentTarget.value);
	}

	/**
	 * Renders prepared feedback below the field, leaving compact columns usable.
	 *
	 * @returns {React.ReactNode} - Error feedback or no content.
	 */
	_renderError() {
		if (!this.props.error) {
			return null;
		}
		let id = `${this.props.id}-error`;
		return (
			<FormHelperText id={id} className="date-time-field-error" error role="alert">
				{this.props.error}
			</FormHelperText>
		);
	}

	/**
	 * Presents a controlled literal field with local format and explicit descriptions.
	 *
	 * @returns {React.ReactNode} - MUI-backed date/time entry.
	 */
	render() {
		let {id, label, value, error, format, kind, size, variant, inputRef} = this.props;
		let hintId = `${id}-format`;
		let describedBy = error ? `${hintId} ${id}-error` : hintId;
		let invalid = Boolean(error);
		let className = `date-time-field ${kind}-field`;
		let slotProps = {htmlInput: {'aria-invalid': invalid, 'aria-describedby': describedBy}};
		return (
			<div className={className}>
				<BaseTextInput
					id={id}
					label={label}
					value={value}
					placeholder={format}
					autoComplete="off"
					error={invalid}
					size={size}
					variant={variant}
					inputRef={inputRef}
					slotProps={slotProps}
					onChange={this._onChange}
				/>
				<FormHelperText id={hintId} className="date-time-field-format">
					{format}
				</FormHelperText>
				{this._renderError()}
			</div>
		);
	}
}
