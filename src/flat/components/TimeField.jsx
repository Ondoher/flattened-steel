import React, {Component} from 'react';
import FormatHintInput from './FormatHintInput.jsx';

/**
 * Presents a caller-owned time draft through the generic format-hint input.
 *
 * @extends {Component<DateTimeFieldProps>}
 */
export default class TimeField extends Component {
	/**
	 * Creates a stable time-draft event adapter.
	 *
	 * @param {DateTimeFieldProps} props - Prepared clock entry and outward editing intent.
	 */
	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	/**
	 * Reports unchanged draft text to the existing time-editing owner.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} event - Native clock edit.
	 */
	_onChange(event) {
		this.props.onChange(event.currentTarget.value);
	}

	/**
	 * Presents time with its in-field format hint and optional helper-text error.
	 *
	 * @returns {React.ReactElement} - Controlled local-format time field.
	 */
	render() {
		let {error, onChange, className, ...props} = this.props;
		let fieldClass = ['time-field', className].filter(Boolean).join(' ');
		let invalid = Boolean(error);
		let helperText = error ?? undefined;
		return (
			<FormatHintInput
				{...props}
				className={fieldClass}
				autoComplete="off"
				error={invalid}
				helperText={helperText}
				onChange={this._onChange}
			/>
		);
	}
}
