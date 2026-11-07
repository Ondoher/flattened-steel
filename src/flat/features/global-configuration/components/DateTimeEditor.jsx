import Typography from '@mui/material/Typography';
import Button from '../../../components/Button.jsx';
import React, {Component} from 'react';
import DateField from '../../../components/DateField.jsx';
import TimeField from '../../../components/TimeField.jsx';

/**
 * Composes app-wide date/time controls inside global configuration without owning their values.
 *
 * @extends {Component<DateTimeEditorProps>}
 */
export default class DateTimeEditor extends Component {
	/**
	 * Creates stable presentation adapters for the owner's editing callbacks.
	 *
	 * @param {DateTimeEditorProps} props - Prepared date/time presentation and outward intents.
	 */
	constructor(props) {
		super(props);
		this._onDateChange = this._onDateChange.bind(this);
		this._onTimeChange = this._onTimeChange.bind(this);
		this._onSubmit = this._onSubmit.bind(this);
	}

	/**
	 * Called by the shared date field to report its draft text.
	 *
	 * @param {string} value - Uncommitted date text.
	 */
	_onDateChange(value) {
		this.props.onChange('date', value);
	}

	/**
	 * Called by the shared time field to report its draft text.
	 *
	 * @param {string} value - Uncommitted clock text.
	 */
	_onTimeChange(value) {
		this.props.onChange('time', value);
	}

	/**
	 * Called by form submission to request acceptance without navigating.
	 *
	 * @param {React.FormEvent<HTMLFormElement>} event - Date/time acceptance intent.
	 */
	_onSubmit(event) {
		event.preventDefault();
		this.props.onApply();
	}

	/**
	 * Call this method to present date/time drafts using the local date and time formats.
	 *
	 * @returns {React.ReactNode} - Global date/time editing region.
	 */
	render() {
		let {presentation, text} = this.props;
		let title = text('global-configuration.date-time.title');
		let dateLabel = text('global-configuration.date-time.date');
		let timeLabel = text('global-configuration.date-time.time');
		let applyLabel = text('global-configuration.date-time.apply');
		let dateError = presentation.dateError ? text(presentation.dateError) : null;
		let timeError = presentation.timeError ? text(presentation.timeError) : null;
		let selection = presentation.accepted ?? text('global-configuration.date-time.none');
		return (
			<form
				className="date-time-editor"
				data-settings-focus="date-time"
				tabIndex={-1}
				onSubmit={this._onSubmit}
				noValidate
			>
				<Typography component="h4" variant="subtitle1">
					{title}
				</Typography>
				<p className="date-time-selection" role="status">
					{selection}
				</p>
				<div className="date-time-inputs">
					<DateField
						id="global-date"
						label={dateLabel}
						value={presentation.editor.date}
						format={presentation.editor.dateFormat}
						error={dateError}
						onChange={this._onDateChange}
					/>
					<TimeField
						id="global-time"
						label={timeLabel}
						value={presentation.editor.time}
						format={presentation.editor.timeFormat}
						error={timeError}
						onChange={this._onTimeChange}
					/>
				</div>
				<Button type="submit">{applyLabel}</Button>
			</form>
		);
	}
}
