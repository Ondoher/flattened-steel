import Slider from '../../../components/Slider.jsx';
import BaseTextInput from '../../../components/BaseTextInput.jsx';
import BaseFormMessage from '../../../components/BaseFormMessage.jsx';
import Typography from '@mui/material/Typography';
import Button from '../../../components/Button.jsx';
import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import phrases from '../../../phrases/en-US.json';

/**
 * Presents shared time through the owning feature view, in a toolbar or configuration.
 *
 * @extends {Component<FlatEarthTimeProps, FlatEarthTimePresentation>}
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
		this.state = props.sceneView.getTimeState();
		this._changed = this._changed.bind(this);
		this._begin = this._begin.bind(this);
		this._end = this._end.bind(this);
		this._seek = this._seek.bind(this);
		this._draft = this._draft.bind(this);
		this._numericKey = this._numericKey.bind(this);
		this._accept = this._accept.bind(this);
		this._settings = this._settings.bind(this);
		this._location = this._location.bind(this);
	}

	/**
	 * Called by React to attach only the owning view's presentation event.
	 */
	componentDidMount() {
		this._listener = this.props.sceneView.listen('time-changed', this._changed);
		this._changed(this.props.sceneView.getTimeState());
	}

	/**
	 * Called by React to release this control's exact listener and gesture.
	 */
	componentWillUnmount() {
		this.props.sceneView.unlisten('time-changed', this._listener);
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
			this._token = this.props.sceneView.beginTimeEdit(this.props.owner);
		}
	}

	/**
	 * Called by pointer/key release or unmount to end only this gesture.
	 */
	_end() {
		if (!this._token) {
			return;
		}
		this.props.sceneView.endTimeEdit(this.props.owner, this._token);
		this._token = 0;
	}

	/**
	 * Called by the shared slider to report a signed degree request.
	 *
	 * @param {number} value - Current scalar slider value.
	 */
	_seek(value) {
		this.props.sceneView.seekTime(this.props.owner, this._token, value);
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
		this.props.sceneView.openTimeSettings();
	}

	/**
	 * Called by unavailable-state presentation to open ordinary location editing.
	 */
	_location() {
		this.props.sceneView.openLocationSettings();
	}

	/**
	 * Called by rendering to resolve text through presentation context only.
	 *
	 * @param {string} key - Phrase key.
	 * @returns {string} - Current localized label.
	 */
	_text(key) {
		let context = /** @type {AppContextValue} */ (this.context);
		if (context.localizationEnabled) {
			return context.localize?.translate(key, {}, undefined, context.locale) ?? '';
		}
		return phrases[key];
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
		let closest = this._text('flat-earth.time.closest');
		let scope = this._text('flat-earth.time.scope');
		let valueText = `${Math.abs(value).toFixed(1)}° ${value < 0 ? before : after}`;
		return (
			<div className="flat-time-slider">
				<div className="flat-time-rail">
					<Slider
						id={id}
						min={-180}
						max={180}
						step={0.1}
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
					<span>{before} −180°</span>
					<span>0° · {closest}</span>
					<span>{after} +180°</span>
				</div>
				<span id={description} className="screen-reader-only">
					{scope} 0° · {closest}
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
				? '—'
				: `${this.state.angle >= 0 ? '+' : ''}${Number(this.state.angle.toFixed(1))}°`;
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
		let degrees = this._text('flat-earth.time.degrees');
		let date = this._text('flat-earth.time.date-basis');
		let resolved = this._text('flat-earth.time.resolved');
		let device = this._text('flat-earth.time.device');
		let reference = this._text('flat-earth.time.reference');
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
						slotProps={{htmlInput: {inputMode: 'decimal', 'aria-invalid': this.state.error}}}
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
						<p>
							{device} · {this.state.deviceZone}
						</p>
					</div>
					<p className="flat-time-reference">
						{reference} {this.state.location}.
					</p>
				</div>
			</div>
		);
	}

	/**
	 * Call this method to render the requested placement from prepared state.
	 *
	 * @returns {React.ReactNode} - Feature-owned shared time surface.
	 */
	render() {
		let content = this.props.panel ? (
			this._renderPanel()
		) : (
			<React.Fragment>
				{this._renderToolbarHeading()}
				{this._renderSlider()}
			</React.Fragment>
		);
		let className = this.props.panel ? 'flat-time-panel' : 'flat-time-toolbar';
		return <section className={className}>{content}</section>;
	}
}
