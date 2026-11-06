import React, {Component} from 'react';

/**
 * App-wide controlled time input using a caller-prepared local clock format.
 *
 * @extends {Component<DateTimeFieldProps>}
 */
export default class TimeField extends Component {
	/**
	 * Creates the stable outward draft-change handler.
	 *
	 * @param {DateTimeFieldProps} props - Caller-owned time presentation and callback.
	 */
	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	/**
	 * Called by the native input to report uncommitted text.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - Time text edit.
	 */
	_onChange(event) {
		this.props.onChange(event.currentTarget.value);
	}

	/**
	 * Call this method to render a compact time field with the local clock format hint.
	 *
	 * @returns {React.ReactNode} - Controlled time input without registry or time-zone access.
	 */
	render() {
		let {id, label, value, error, format} = this.props;
		let hintId = `${id}-format`;
		let errorId = `${id}-error`;
		let invalid = Boolean(error);
		let describedBy = invalid ? `${hintId} ${errorId}` : hintId;
		let feedback = error ? (
			<p id={errorId} className="date-time-field-error" role="alert">
				{error}
			</p>
		) : null;
		return (
			<div className="date-time-field time-field">
				<label htmlFor={id}>{label}</label>
				<span id={hintId} className="date-time-field-format">
					{format}
				</span>
				<input
					id={id}
					type="text"
					value={value}
					placeholder={format}
					autoComplete="off"
					aria-invalid={invalid}
					aria-describedby={describedBy}
					onChange={this._onChange}
				/>
				{feedback}
			</div>
		);
	}
}
