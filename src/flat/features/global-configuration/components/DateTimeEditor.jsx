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
		this._onPrevious = this._onPrevious.bind(this);
		this._onNext = this._onNext.bind(this);
	}

	/**
	 * Called by the backward step button to subtract ten elapsed minutes.
	 */
	_onPrevious() {
		this.props.onStep(-10);
	}

	/**
	 * Called by the forward step button to add ten elapsed minutes.
	 */
	_onNext() {
		this.props.onStep(10);
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
	 * Presents the explicit date/time acceptance and current-instant actions.
	 *
	 * @returns {React.ReactNode} - Localized date/time action row.
	 */
	_renderActions() {
		let applyLabel = this.props.text('global-configuration.date-time.apply');
		let nowLabel = this.props.text('global-configuration.date-time.now');
		let previousLabel = this.props.text('global-configuration.date-time.previous');
		let nextLabel = this.props.text('global-configuration.date-time.next');
		let stepDisabled = this.props.presentation.accepted == null;
		return (
			<div className="date-time-actions">
				<Button type="submit">{applyLabel}</Button>
				<Button type="button" className="date-time-now" onClick={this.props.onNow}>
					{nowLabel}
				</Button>
				<Button type="button" className="date-time-previous" disabled={stepDisabled} onClick={this._onPrevious}>
					{previousLabel}
				</Button>
				<Button type="button" className="date-time-next" disabled={stepDisabled} onClick={this._onNext}>
					{nextLabel}
				</Button>
			</div>
		);
	}

	/**
	 * Call this method to present date/time drafts using the local date and time formats.
	 *
	 * @returns {React.ReactNode} - Global date/time editing region.
	 */
	render() {
		let {presentation, text} = this.props;
		let title = text('global-configuration.date-time.title');
		let dateLabel = 'global-configuration.date-time.date';
		let timeLabel = 'global-configuration.date-time.time';
		let dateError = presentation.dateError;
		let timeError = presentation.timeError;
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
				{this._renderActions()}
			</form>
		);
	}
}
