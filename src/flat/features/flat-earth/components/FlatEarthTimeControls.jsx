import Slider from '../../../components/Slider.jsx';
import BaseTextInput from '../../../components/BaseTextInput.jsx';
import BaseFormMessage from '../../../components/BaseFormMessage.jsx';
import Typography from '@mui/material/Typography';
import Button from '../../../components/Button.jsx';
import PanelButton from '../../../components/PanelButton.jsx';
import AccessTime from '@mui/icons-material/AccessTime';
import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';

/**
 * Spacing of the alternate time editor's snap points; change to 15 for finer stops.
 */
const SUN_POSITION_SNAP_INTERVAL_DEGREES = 45;

/**
 * Attraction distance in degrees, preserving free movement between snap points.
 */
const SUN_POSITION_SNAP_RADIUS_DEGREES = 2;

/**
 * Shared immutable presentation targets across the complete signed angular range.
 */
const SUN_POSITION_SNAP_POINTS = Object.freeze(
	Array.from(
		{length: 360 / SUN_POSITION_SNAP_INTERVAL_DEGREES + 1},
		(_, index) => -180 + index * SUN_POSITION_SNAP_INTERVAL_DEGREES,
	),
);

/**
 * Presents shared time through the owning feature view, in a toolbar or configuration.
 *
 * @extends {Component<FlatEarthTimeProps, FlatEarthTimeControlState>}
 */
export default class FlatEarthTimeControls extends Component {
	static contextType = AppContext;

	/**
	 * Creates stable DOM intent adapters; canonical values arrive after mounting.
	 *
	 * @param {FlatEarthTimeProps} props - Owning view and presentation placement.
	 */
	constructor(props) {
		super(props);
		this.state = {...props.sceneView.getTimeState(), closeRequest: 0};
		this._changed = this._changed.bind(this);
		this._begin = this._begin.bind(this);
		this._end = this._end.bind(this);
		this._seek = this._seek.bind(this);
		this._draft = this._draft.bind(this);
		this._numericKey = this._numericKey.bind(this);
		this._accept = this._accept.bind(this);
		this._settings = this._settings.bind(this);
		this._location = this._location.bind(this);
		this._renderPopup = this._renderPopup.bind(this);
		this._popupChanged = this._popupChanged.bind(this);
		this._afterPopupClosed = this._afterPopupClosed.bind(this);
	}

	/**
	 * Called by React to attach only the owning view's presentation event.
	 */
	componentDidMount() {
		this._attachView();
	}

	/**
	 * Releases the original edit owner and stale navigation when its explicit identity changes.
	 *
	 * @param {FlatEarthTimeProps} previous - Previous time-control owner.
	 */
	componentDidUpdate(previous) {
		if (previous.sceneView !== this.props.sceneView || previous.owner !== this.props.owner) {
			this._detachView();
			this._pendingNavigation = null;
			this._popupOpen = false;
			this._attachView();
			this.setState((state) => ({closeRequest: state.closeRequest + 1}));
		}
	}

	/**
	 * Called by React to release this control's exact listener and gesture.
	 */
	componentWillUnmount() {
		this._pendingNavigation = null;
		this._detachView();
	}

	/**
	 * Attaches the exact view and owner identities used by this mounted presentation.
	 */
	_attachView() {
		this._view = this.props.sceneView;
		this._owner = this.props.owner;
		this._listener = this._view.listen('time-changed', this._changed);
		this._changed(this._view.getTimeState());
	}

	/**
	 * Releases the original subscription and any remaining feature edit token.
	 */
	_detachView() {
		this._view.unlisten('time-changed', this._listener);
		this._end();
	}

	/**
	 * Called by owning-view events to install a disposable projection.
	 *
	 * @param {FlatEarthTimePresentation} state - Current presentation.
	 */
	_changed(state) {
		this.setState(state);
	}

	/**
	 * Called by pointer/key input to freeze one current reference.
	 */
	_begin() {
		if (!this._token) {
			this._token = this._view.beginTimeEdit(this._owner);
		}
	}

	/**
	 * Called by pointer/key release or unmount to end only this gesture.
	 */
	_end() {
		if (!this._token) {
			return;
		}
		this._view.endTimeEdit(this._owner, this._token);
		this._token = 0;
	}

	/**
	 * Called by the shared slider to report a signed degree request.
	 *
	 * @param {number} value - Current scalar slider value.
	 */
	_seek(value) {
		this._view.seekTime(this._owner, this._token, value);
	}

	/**
	 * Called by text input to retain an unfinished draft without seeking.
	 *
	 * @param {React.ChangeEvent<HTMLInputElement>} event - Numeric draft text.
	 */
	_draft(event) {
		this.props.sceneView.setTimeDraft(event.currentTarget.value);
	}

	/**
	 * Called on valid blur or Enter to request draft acceptance.
	 */
	_accept() {
		this.props.sceneView.acceptTimeDraft();
	}

	/**
	 * Called by the numeric field to accept or cancel local editing intent.
	 *
	 * @param {React.KeyboardEvent<HTMLInputElement>} event - Native editing key.
	 */
	_numericKey(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			this._accept();
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			this.props.sceneView.resetTimeDraft();
		}
	}

	/**
	 * Called by the toolbar shortcut to open the shared feature section.
	 */
	_settings() {
		this._navigate('time');
	}

	/**
	 * Called by unavailable-state presentation to open ordinary location editing.
	 */
	_location() {
		this._navigate('location');
	}

	/**
	 * Defers settings navigation until MUI has dismissed the popup and restored focus.
	 *
	 * @param {'time'|'location'} destination - Existing feature navigation intent.
	 */
	_navigate(destination) {
		if (this.props.panel || !this._popupOpen) {
			this._openSettings(destination);
			return;
		}
		this._pendingNavigation = destination;
		this.setState((state) => ({closeRequest: state.closeRequest + 1}));
	}

	/**
	 * Reports the selected navigation through the owning view only.
	 *
	 * @param {'time'|'location'} destination - Existing settings destination.
	 */
	_openSettings(destination) {
		if (destination === 'time') {
			this._view.openTimeSettings();
		} else {
			this._view.openLocationSettings();
		}
	}

	/**
	 * Tracks transient visibility and invalidates stale navigation on reopening.
	 *
	 * @param {boolean} open - MUI popup visibility.
	 */
	_popupChanged(open) {
		this._popupOpen = open;
		if (open) {
			this._pendingNavigation = null;
		} else {
			this._end();
		}
	}

	/**
	 * Delivers at most one navigation intent after MUI's exit transition.
	 */
	_afterPopupClosed() {
		let destination = this._pendingNavigation;
		this._pendingNavigation = null;
		if (destination && !this._popupOpen) {
			this._openSettings(destination);
		}
	}

	/**
	 * Called by rendering to resolve text through presentation context only.
	 *
	 * @param {string} key - Phrase key.
	 * @returns {string} - Current localized label.
	 */
	_text(key, replacements = {}) {
		let context = /** @type {AppContextValue} */ (this.context);
		return context.localize.translate(key, replacements, undefined, context.locale);
	}

	/**
	 * Called by rendering to present the shared slider and its closest reference.
	 *
	 * @returns {React.ReactNode} - Shared slider with explicit zero and legends.
	 */
	_renderSlider() {
		let value = this.state.angle ?? 0;
		let disabled = this.state.angle === null;
		let id = `closest-${this.props.owner}`;
		let description = `${id}-description`;
		let name = this._text('flat-earth.time.slider-name');
		let before = this._text('flat-earth.time.before');
		let after = this._text('flat-earth.time.after');
		let scope = this._text('flat-earth.time.scope');
		let valueText = this._text('flat-earth.time.value-direction', {
			value: Math.abs(value).toFixed(1),
			direction: value < 0 ? before : after,
		});
		let beforeLegend = this._text('flat-earth.time.before-legend');
		let closestLegend = this._text('flat-earth.time.closest-legend');
		let afterLegend = this._text('flat-earth.time.after-legend');
		let descriptionText = this._text('flat-earth.time.slider-description', {scope, closest: closestLegend});
		let autoFocus = !this.props.panel && !disabled;
		return (
			<div className="flat-time-slider">
				<div className="flat-time-rail">
					<Slider
						id={id}
						min={-180}
						max={180}
						step={0.1}
						snapPoints={SUN_POSITION_SNAP_POINTS}
						snapRadius={SUN_POSITION_SNAP_RADIUS_DEGREES}
						autoFocus={autoFocus}
						value={value}
						disabled={disabled}
						aria-label={name}
						aria-valuetext={valueText}
						aria-describedby={description}
						onInteractionStart={this._begin}
						onInteractionEnd={this._end}
						onChange={this._seek}
					/>
					<span className="flat-time-zero" aria-hidden="true" />
				</div>
				<div className="flat-time-legends">
					<span>{beforeLegend}</span>
					<span>{closestLegend}</span>
					<span>{afterLegend}</span>
				</div>
				<span id={description} className="screen-reader-only">
					{descriptionText}
				</span>
			</div>
		);
	}

	/**
	 * Called by toolbar rendering to present concise shared scope and navigation.
	 *
	 * @returns {React.ReactNode} - Shared time heading and angle readout.
	 */
	_renderToolbarHeading() {
		let shared = this._text('flat-earth.time.shared');
		let label = this._text('flat-earth.time.degrees-closest');
		let settings = this._text('flat-earth.time.settings');
		let angle =
			this.state.angle == null
				? this._text('flat-earth.time.unavailable')
				: this._text('flat-earth.time.angle-value', {
						value: `${this.state.angle >= 0 ? '+' : ''}${Number(this.state.angle.toFixed(1))}`,
					});
		return (
			<div className="flat-time-toolbar-heading">
				<strong>{shared}</strong>
				<span>{label}</span>
				<strong className="flat-time-angle">{angle}</strong>
				<Button
					type="button"
					className="flat-time-settings"
					aria-pressed={this.state.selected}
					onClick={this._settings}
				>
					{settings}
				</Button>
			</div>
		);
	}

	/**
	 * Called by panel rendering to present precise input and reference/readouts.
	 *
	 * @returns {React.ReactNode} - Numeric editor and derived date/time facts.
	 */
	_renderPanel() {
		let title = this._text('flat-earth.time.degrees-closest');
		let scope = this._text('flat-earth.time.scope');
		let degrees = 'flat-earth.time.degrees';
		let inputSlots = {htmlInput: {inputMode: 'decimal', 'aria-invalid': this.state.error}};
		let date = this._text('flat-earth.time.date-basis');
		let resolved = this._text('flat-earth.time.resolved');
		let reference = this._text('flat-earth.time.reference', {location: this.state.location});
		let deviceZone = this._text('flat-earth.time.device-zone', {zone: this.state.deviceZone});
		let error = this.state.error ? (
			<BaseFormMessage className="flat-time-error" type="error" role="alert">
				{this._text('flat-earth.time.invalid')}
			</BaseFormMessage>
		) : null;
		let unavailable =
			this.state.angle === null ? (
				<Button type="button" className="flat-time-location" onClick={this._location}>
					{this._text('flat-earth.time.choose-location')}
				</Button>
			) : null;
		let disabled = this.state.angle === null;
		return (
			<div className="flat-time-panel-content">
				<div className="flat-time-edit">
					<Typography component="h3" variant="subtitle1">
						{title}
					</Typography>
					<p className="flat-time-scope">{scope}</p>
					{this._renderSlider()}
					<BaseTextInput
						className="flat-time-numeric"
						label={degrees}
						type="text"
						value={this.state.draft}
						disabled={disabled}
						error={this.state.error}
						slotProps={inputSlots}
						onChange={this._draft}
						onBlur={this._accept}
						onKeyDown={this._numericKey}
					/>
					{error}
					{unavailable}
				</div>
				<div className="flat-time-readouts">
					<div className="flat-time-date">
						<span>{date}</span>
						<p>{this.state.dateBasis}</p>
					</div>
					<div className="flat-time-resolved">
						<span>{resolved}</span>
						<strong>{this.state.resolvedTime}</strong>
						<p>{deviceZone}</p>
					</div>
					<p className="flat-time-reference">{reference}</p>
				</div>
			</div>
		);
	}

	/**
	 * Owns the toolbar popup, unmounting its slider immediately when dismissal starts.
	 *
	 * @param {boolean} open - MUI popup visibility.
	 * @returns {React.ReactNode} - Shared-time editor or no active interaction while closed.
	 */
	_renderPopup(open) {
		if (!open) {
			return null;
		}
		let scope = this._text('flat-earth.time.scope');
		let unavailable = null;
		if (this.state.angle === null) {
			let message = this._text('flat-earth.time.location-required');
			let location = this._text('flat-earth.time.choose-location');
			unavailable = (
				<div className="flat-time-unavailable">
					<p>{message}</p>
					<Button autoFocus onClick={this._location}>
						{location}
					</Button>
				</div>
			);
		}
		return (
			<div className="flat-time-popup">
				{this._renderToolbarHeading()}
				<p className="flat-time-scope">{scope}</p>
				{this._renderSlider()}
				{unavailable}
			</div>
		);
	}

	/**
	 * Owns the named clock trigger and reuses the shared MUI popup lifecycle.
	 *
	 * @returns {React.ReactNode} - Icon-only shared-time command.
	 */
	_renderClock() {
		let icon = <AccessTime />;
		return (
			<PanelButton
				key={this.props.owner}
				label="flat-earth.time.title"
				icon={icon}
				className="flat-time-clock"
				closeRequest={this.state.closeRequest}
				onOpenChange={this._popupChanged}
				onClosed={this._afterPopupClosed}
			>
				{this._renderPopup}
			</PanelButton>
		);
	}

	/**
	 * Call this method to render the requested placement from prepared state.
	 *
	 * @returns {React.ReactNode} - Feature-owned shared time surface.
	 */
	render() {
		let content = this.props.panel ? this._renderPanel() : this._renderClock();
		let className = this.props.panel ? 'flat-time-panel' : 'flat-time-toolbar';
		return <section className={className}>{content}</section>;
	}
}
