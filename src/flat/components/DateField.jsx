import React, {Component} from 'react';
import FormatHintInput from './FormatHintInput.jsx';

/**
 * Presents a caller-owned date draft using the transferred control's in-field format layout.
 *
 * @extends {Component<DateTimeFieldProps>}
 */
export default class DateField extends Component {
	/**
	 * Creates a stable date-draft event adapter.
	 *
	 * @param {DateTimeFieldProps} props - Prepared date entry and outward editing intent.
	 */
	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	/**
	 * Reports unchanged draft text to the existing date-editing owner.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} event - Native date edit.
	 */
	_onChange(event) {
		this.props.onChange(event.currentTarget.value);
	}

	/**
	 * Presents the date and its optional validation message through the shared format-hint control.
	 *
	 * @returns {React.ReactElement} - Controlled date entry with an end adornment.
	 */
	render() {
		let {error, onChange, className, ...props} = this.props;
		let fieldClass = ['date-field', className].filter(Boolean).join(' ');
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
