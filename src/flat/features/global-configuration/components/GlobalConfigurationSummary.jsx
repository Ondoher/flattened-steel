import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import phrases from '../../../phrases/en-US.json';

/**
 * Presents accepted shared values after the application's runtime-ready mount.
 *
 * @extends {Component<GlobalSummaryProps, GlobalSummaryState>}
 */
export default class GlobalConfigurationSummary extends Component {
	static contextType = AppContext;
	/**
	 * Creates the summary's stable editor intents.
	 *
	 * @param {GlobalSummaryProps} props - Owning presentation capability.
	 */
	constructor(props) {
		super(props);
		this.state = {presentation: null};
		this._changed = this._changed.bind(this);
		this._location = this._location.bind(this);
		this._time = this._time.bind(this);
	}

	/**
	 * Called by React to read presentation after runtime readiness and attach one exact listener.
	 */
	componentDidMount() {
		this._listener = this.props.configurationView.listen('state-changed', this._changed);
		this._changed(this.props.configurationView.getState());
	}

	/**
	 * Called by React to release the exact original listener.
	 */
	componentWillUnmount() {
		this.props.configurationView.unlisten('state-changed', this._listener);
	}

	/**
	 * Called by the owning view to install a disposable projection.
	 *
	 * @param {GlobalConfigurationPresentation} presentation - Accepted values and editor presentation.
	 */
	_changed(presentation) {
		this.setState({presentation});
	}

	/**
	 * Called by rendering to resolve presentation text through app context.
	 *
	 * @param {string} key - Phrase key.
	 * @returns {string} - Localized presentation text.
	 */
	_text(key) {
		let context = /** @type {AppContextValue} */ (this.context);
		if (context.localizationEnabled) {
			return context.localize?.translate(key, {}, undefined, context.locale) ?? '';
		}
		return phrases[key];
	}

	/**
	 * Called by the accepted location summary to open its existing editor.
	 */
	_location() {
		this.props.configurationView.openEditor('location');
	}

	/**
	 * Called by the accepted timestamp summary to open ordinary date/time entry.
	 */
	_time() {
		this.props.configurationView.openEditor('date-time');
	}

	/**
	 * Called by rendering to present one accepted-value summary with an editor shortcut.
	 *
	 * @param {string} label - Localized summary label.
	 * @param {string} value - Accepted-value display.
	 * @param {React.MouseEventHandler<HTMLButtonElement>} action - Outward editor intent.
	 * @returns {React.ReactNode} - Summary button.
	 */
	_renderSummary(label, value, action) {
		let edit = this._text('workspace.edit');
		return (
			<button type="button" className="global-summary-entry" onClick={action}>
				<span className="global-summary-label">
					<span>{label}</span>
					<span>{edit}</span>
				</span>
				<strong>{value}</strong>
			</button>
		);
	}

	/**
	 * Call this method to render accepted values without mounting editor DOM.
	 *
	 * @returns {React.ReactNode} - Shared toolbar contribution.
	 */
	render() {
		let state = this.state.presentation;
		if (!state) {
			return null;
		}
		let location =
			state.locationLabel ?? state.locationCoordinates ?? this._text('global-configuration.location.none');
		let time = state.summaryTime ?? '';
		let locationLabel = this._text('global-configuration.summary-location');
		let timeLabel = this._text('global-configuration.summary-time');
		let a = this._renderSummary(locationLabel, location, this._location);
		let b = this._renderSummary(timeLabel, time, this._time);
		return (
			<div className="global-configuration-summary">
				{a}
				{b}
			</div>
		);
	}
}
