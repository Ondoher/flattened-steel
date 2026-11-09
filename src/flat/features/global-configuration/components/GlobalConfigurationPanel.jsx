import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import LocationEditor from './LocationEditor.jsx';
import DateTimeEditor from './DateTimeEditor.jsx';

/**
 * Global configuration presentation consuming only its own view and application presentation context.
 *
 * @extends {Component<GlobalConfigurationPanelProps, GlobalConfigurationPresentation>}
 */
export default class GlobalConfigurationPanel extends Component {
	static contextType = AppContext;

	/**
	 * Creates the initial presentation and stable outward intent handlers.
	 *
	 * @param {GlobalConfigurationPanelProps} props - Owning view and initial presentation.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this._onStateChanged = this._onStateChanged.bind(this);
		this._text = this._text.bind(this);
		this._onQueryChange = this._onQueryChange.bind(this);
		this._onSelectCity = this._onSelectCity.bind(this);
		this._onCoordinateChange = this._onCoordinateChange.bind(this);
		this._onApplyCoordinates = this._onApplyCoordinates.bind(this);
		this._onRetry = this._onRetry.bind(this);
		this._onDateTimeChange = this._onDateTimeChange.bind(this);
		this._onApplyDateTime = this._onApplyDateTime.bind(this);
		this._onNow = this._onNow.bind(this);
		this._onStepTime = this._onStepTime.bind(this);
	}

	/**
	 * Called by React to attach one view-mediated presentation listener.
	 */
	componentDidMount() {
		this._attachView();
	}

	/**
	 * Called by React to rebind when the explicit presentation owner changes.
	 *
	 * @param {GlobalConfigurationPanelProps} previous - Previous owning view.
	 */
	componentDidUpdate(previous) {
		if (previous.configurationView !== this.props.configurationView) {
			this._detachView();
			this._attachView();
		}
	}

	/**
	 * Called by React to release the exact view listener when settings closes.
	 */
	componentWillUnmount() {
		this._detachView();
	}

	/**
	 * Called at the mounted presentation boundary to subscribe to the owning view.
	 */
	_attachView() {
		this._view = this.props.configurationView;
		this._listener = this._view.listen('state-changed', this._onStateChanged);
		this._onStateChanged(this._view.getState());
	}

	/**
	 * Called during replacement or unmount to detach from the original owner.
	 */
	_detachView() {
		if (this._listener) {
			this._view.unlisten('state-changed', this._listener);
		}
		this._listener = null;
	}

	/**
	 * Called by the owning view to install a disposable presentation projection.
	 *
	 * @param {GlobalConfigurationPresentation} state - Next presentation values.
	 */
	_onStateChanged(state) {
		this.setState(state);
	}

	/**
	 * Called by presentation to resolve localized text without service orchestration.
	 *
	 * @param {string} key - Configuration phrase key.
	 * @param {Record<string, string|number>} replacements - Named phrase values.
	 * @returns {string} - Localized text from the selected translator.
	 */
	_text(key, replacements = {}) {
		let context = /** @type {AppContextValue} */ (this.context);
		return context.localize.translate(key, replacements, undefined, context.locale);
	}

	/**
	 * Called by the picker to relay search input.
	 *
	 * @param {string} query - User-entered city query.
	 */
	_onQueryChange(query) {
		this.props.configurationView.setQuery(query);
	}

	/**
	 * Called by the picker to relay a selected city identity.
	 *
	 * @param {string} id - Stable city identity.
	 */
	_onSelectCity(id) {
		this.props.configurationView.selectCity(id);
	}

	/**
	 * Called by coordinate inputs to relay an uncommitted edit.
	 *
	 * @param {LocationCoordinateField} field - Edited coordinate field.
	 * @param {string} value - Uncommitted input text.
	 */
	_onCoordinateChange(field, value) {
		this.props.configurationView.setCoordinate(field, value);
	}

	/**
	 * Called by the coordinate form to request acceptance of its drafts.
	 */
	_onApplyCoordinates() {
		this.props.configurationView.applyCoordinates();
	}

	/**
	 * Called by the retry button to request the owning workflow.
	 */
	_onRetry() {
		void this.props.configurationView.retryCities();
	}

	/**
	 * Called by the date/time editor to relay one draft field edit.
	 *
	 * @param {DateTimeDraftField} field - Date or time field being edited.
	 * @param {string} value - Uncommitted input text.
	 */
	_onDateTimeChange(field, value) {
		this.props.configurationView.setDateTimeField(field, value);
	}

	/**
	 * Called by the date/time editor to request acceptance of both drafts.
	 */
	_onApplyDateTime() {
		this.props.configurationView.applyDateTime();
	}

	/**
	 * Called by the Now button to request the current instant.
	 */
	_onNow() {
		this.props.configurationView.setNow();
	}

	/**
	 * Called by the date/time step buttons to change the accepted shared instant.
	 *
	 * @param {number} minutes - Signed elapsed minutes.
	 */
	_onStepTime(minutes) {
		this.props.configurationView.stepTime(minutes);
	}

	/**
	 * Call this method to render global location settings and their shared configuration title.
	 *
	 * @returns {React.ReactNode} - Feature-owned settings content.
	 */
	render() {
		let title = this._text('global-configuration.title');
		return (
			<section className="global-configuration-panel">
				<LocationEditor
					presentation={this.state}
					text={this._text}
					onQueryChange={this._onQueryChange}
					onSelectCity={this._onSelectCity}
					onCoordinateChange={this._onCoordinateChange}
					onApplyCoordinates={this._onApplyCoordinates}
					onRetry={this._onRetry}
				/>
				<DateTimeEditor
					presentation={this.state.dateTime}
					text={this._text}
					onChange={this._onDateTimeChange}
					onApply={this._onApplyDateTime}
					onNow={this._onNow}
					onStep={this._onStepTime}
				/>
			</section>
		);
	}
}
