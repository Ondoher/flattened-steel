import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import phrases from '../../../phrases/en-US.json';
import {FIELD_OF_VIEW_PRESETS, ELEVATION_PRESETS} from '../camera-controls.js';

/**
 * Presents scoped camera controls inside the application's generic view-tools host.
 *
 * @extends {Component<FlatEarthViewToolsProps, FlatEarthSceneState>}
 */
export default class FlatEarthViewTools extends Component {
	static contextType = AppContext;

	/**
	 * Creates stable presentation callbacks without locating services or owning camera state.
	 *
	 * @param {FlatEarthViewToolsProps} props - Owning presentation capability and scoped initial state.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this._onStateChanged = this._onStateChanged.bind(this);
		this._onFieldOfView = this._onFieldOfView.bind(this);
		this._onHeight = this._onHeight.bind(this);
		this._onSun = this._onSun.bind(this);
	}

	/**
	 * Called by React to attach one owning-view subscription.
	 */
	componentDidMount() {
		this._attachView();
	}

	/**
	 * Called by React when an explicit owner or scope changes.
	 *
	 * @param {FlatEarthViewToolsProps} previous - Previous owner and scope.
	 */
	componentDidUpdate(previous) {
		if (previous.sceneView !== this.props.sceneView || previous.viewId !== this.props.viewId) {
			this._detachView();
			this._attachView();
		}
	}

	/**
	 * Called by React to release the exact original subscription.
	 */
	componentWillUnmount() {
		this._detachView();
	}

	/**
	 * Called after mounting/owner changes to read scoped presentation.
	 */
	_attachView() {
		this._view = this.props.sceneView;
		this._viewId = this.props.viewId;
		this._listener = this._view.listen('state-changed', this._onStateChanged);
		this.setState(this._view.getState(this._viewId));
	}

	/**
	 * Called during owner changes/unmount to release the exact original listener.
	 */
	_detachView() {
		if (this._listener) {
			this._view.unlisten('state-changed', this._listener);
		}
		this._listener = null;
	}

	/**
	 * Called by view events to update only this toolbar's camera presentation.
	 *
	 * @param {FlatEarthStateChange} change - Exact scoped scene state.
	 */
	_onStateChanged({viewId, state}) {
		if (viewId === this._viewId) {
			this.setState(state);
		}
	}

	/**
	 * Called by native selection to relay vertical framing intent.
	 *
	 * @param {React.ChangeEvent<HTMLSelectElement>} event - Selected degree value.
	 */
	_onFieldOfView(event) {
		this.props.sceneView.setFieldOfView(this.props.viewId, Number(event.currentTarget.value));
	}

	/**
	 * Called by native selection to relay physical elevation intent.
	 *
	 * @param {React.ChangeEvent<HTMLSelectElement>} event - Selected elevation in meters.
	 */
	_onHeight(event) {
		this.props.sceneView.setObserverHeight(this.props.viewId, {
			value: Number(event.currentTarget.value),
			units: 'meters',
		});
	}

	/**
	 * Called by the action button to relay aim-at-Sun intent.
	 */
	_onSun() {
		this.props.sceneView.centerOnSun(this.props.viewId);
	}

	/**
	 * Called by rendering to resolve literal labels through presentation context.
	 *
	 * @param {string} key - Feature phrase key.
	 * @returns {string} - Localized or configured literal text.
	 */
	_text(key) {
		let context = /** @type {AppContextValue} */ (this.context);
		if (context.localizationEnabled) {
			return context.localize?.translate(key, {}, undefined, context.locale) ?? '';
		}
		return phrases[key];
	}

	/**
	 * Called by list preparation to render one labeled choice.
	 *
	 * @param {{value: number, label: string}} preset - Prepared option identity and phrase key.
	 * @returns {React.ReactNode} - Stable keyed option.
	 */
	_renderOption(preset) {
		let label = this._text(preset.label);
		return (
			<option key={preset.value} value={preset.value}>
				{label}
			</option>
		);
	}

	/**
	 * Called by rendering to prepare the complete framing option list before JSX.
	 *
	 * @returns {React.ReactNode[]} - Field-of-view choices.
	 */
	_renderFieldOfViewOptions() {
		return FIELD_OF_VIEW_PRESETS.map((preset) => this._renderOption(preset));
	}

	/**
	 * Called by rendering to prepare the complete physical elevation option list before JSX.
	 *
	 * @returns {React.ReactNode[]} - Elevation choices.
	 */
	_renderHeightOptions() {
		return ELEVATION_PRESETS.map((preset) => this._renderOption(preset));
	}

	/**
	 * Call this method to present each view's accepted camera controls and any pending elevation.
	 *
	 * @returns {React.ReactNode} - Scoped toolbar contribution.
	 */
	_renderControls() {
		let camera = this.state.camera;
		let height = camera.pendingHeightMeters ?? camera.observerHeightMeters;
		let heightLabel = this._text('flat-earth.camera.height');
		let fovLabel = this._text('flat-earth.camera.fov');
		let fovHint = this._text('flat-earth.camera.fov.hint');
		let sunLabel = this._text('flat-earth.camera.center-sun');
		let disabled = !this.state.renderedObservation;
		let heights = this._renderHeightOptions();
		let fieldsOfView = this._renderFieldOfViewOptions();
		return (
			<div className="flat-earth-view-tools">
				<label>
					{heightLabel}
					<select className="flat-earth-height" value={height} onChange={this._onHeight}>
						{heights}
					</select>
				</label>
				<label>
					{fovLabel}
					<select
						className="flat-earth-fov"
						value={camera.fieldOfViewDegrees}
						title={fovHint}
						onChange={this._onFieldOfView}
					>
						{fieldsOfView}
					</select>
				</label>
				<button type="button" className="flat-earth-center-sun" onClick={this._onSun} disabled={disabled}>
					{sunLabel}
				</button>
			</div>
		);
	}

	/**
	 * Call this method to present the same camera controls in a toolbar or settings section.
	 *
	 * @returns {React.ReactNode} - Scoped Camera presentation.
	 */
	render() {
		let title = this._text('flat-earth.camera.title');
		let scope = this._text('flat-earth.camera.scope');
		let content = this._renderControls();
		if (this.props.panel) {
			content = (
				<section className="flat-earth-camera-panel">
					<h3>{title}</h3>
					{content}
					<p>{scope}</p>
				</section>
			);
		}
		return content;
	}
}
