import BaseSelect from '../../../components/BaseSelect.jsx';
import Typography from '@mui/material/Typography';
import Button from '../../../components/Button.jsx';
import IconMenuButton from '../../../components/IconMenuButton.jsx';
import Brightness6Outlined from '@mui/icons-material/Brightness6Outlined';
import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
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
		this._onSky = this._onSky.bind(this);
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
	 * Called by selection to relay vertical framing intent.
	 *
	 * @param {number} value - Selected vertical field of view.
	 */
	_onFieldOfView(value) {
		this.props.sceneView.setFieldOfView(this.props.viewId, Number(value));
	}

	/**
	 * Called by selection to relay physical elevation intent.
	 *
	 * @param {number} value - Selected elevation in meters.
	 */
	_onHeight(value) {
		this.props.sceneView.setObserverHeight(this.props.viewId, {
			value: Number(value),
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
	 * Called by selection to report this view's sky composition intent.
	 *
	 * @param {string} value - Selected supported mode.
	 */
	_onSky(value) {
		let mode = /** @type {FlatEarthSkyRenderMode} */ (value);
		this.props.sceneView.setSkyRenderMode(this.props.viewId, mode);
	}

	/**
	 * Called by rendering to translate labels through presentation context.
	 *
	 * @param {string} key - Feature phrase key.
	 * @returns {string} - Localized text from the selected translator.
	 */
	_text(key) {
		let context = /** @type {AppContextValue} */ (this.context);
		return context.localize.translate(key, {}, undefined, context.locale);
	}

	/**
	 * Called by list preparation to resolve one labeled choice.
	 *
	 * @param {FlatEarthControlOption} preset - Prepared option identity and phrase key.
	 * @returns {AppSelectOption} - Controlled value and phrase key.
	 */
	_prepareOption(preset) {
		return {value: preset.value, label: preset.label};
	}

	/**
	 * Called by rendering to prepare the complete framing option list before JSX.
	 *
	 * @returns {AppSelectOption[]} - Field-of-view choices.
	 */
	_renderFieldOfViewOptions() {
		let options = FIELD_OF_VIEW_PRESETS.map((preset) => this._prepareOption(preset));
		let value = this.state.camera.fieldOfViewDegrees;
		if (!options.some((option) => option.value === value)) {
			options.push({value, label: {phrase: 'flat-earth.camera.angle-value', replacements: {value}}});
		}
		return options;
	}

	/**
	 * Called by rendering to prepare the complete physical elevation option list before JSX.
	 *
	 * @returns {AppSelectOption[]} - Elevation choices.
	 */
	_renderHeightOptions() {
		let options = ELEVATION_PRESETS.map((preset) => this._prepareOption(preset));
		let value = this.state.camera.pendingHeightMeters ?? this.state.camera.observerHeightMeters;
		if (!options.some((option) => option.value === value)) {
			options.push({value, label: {phrase: 'flat-earth.camera.height-value', replacements: {value}}});
		}
		return options;
	}

	/**
	 * Called by sky rendering to prepare the supported choices before JSX.
	 *
	 * @returns {AppSelectOption[]} - Stable localized sky choices.
	 */
	_renderSkyOptions() {
		/**
		 * @type {FlatEarthControlOption[]}
		 */
		let options = [
			{value: 'full', label: 'flat-earth.shader.full'},
			{value: 'no-atmosphere', label: 'flat-earth.shader.no-atmosphere'},
			{value: 'shader-off', label: 'flat-earth.shader.off'},
		];
		return options.map((option) => this._prepareOption(option));
	}

	/**
	 * Called by the toolbar and settings panel to present the view-owned shader choice.
	 *
	 * @returns {React.ReactNode} - Sky selector with its owned region wrapper.
	 */
	_renderSkyControl() {
		let label = 'flat-earth.shader.label';
		let hint = this._text('flat-earth.shader.hint');
		let options = this._renderSkyOptions();
		if (!this.props.panel) {
			let icon = <Brightness6Outlined />;
			return (
				<IconMenuButton
					className="flat-earth-sky flat-earth-shader-control"
					label={label}
					icon={icon}
					value={this.state.shader.mode}
					options={options}
					onChange={this._onSky}
				/>
			);
		}
		return (
			<BaseSelect
				className="flat-earth-sky flat-earth-shader-control"
				label={label}
				value={this.state.shader.mode}
				title={hint}
				options={options}
				onChange={this._onSky}
				fullWidth={false}
			/>
		);
	}

	/**
	 * Call this method to present each view's accepted camera controls and any pending elevation.
	 *
	 * @returns {React.ReactNode} - Scoped toolbar contribution.
	 */
	_renderControls() {
		let camera = this.state.camera;
		let height = camera.pendingHeightMeters ?? camera.observerHeightMeters;
		let heightLabel = 'flat-earth.camera.height';
		let fovLabel = 'flat-earth.camera.fov';
		let fovHint = this._text('flat-earth.camera.fov.hint');
		let sunLabel = this._text('flat-earth.camera.center-sun');
		let disabled = !this.state.renderedObservation;
		let heights = this._renderHeightOptions();
		let fieldsOfView = this._renderFieldOfViewOptions();
		return (
			<div className="flat-earth-view-tools">
				{this._renderSkyControl()}
				<BaseSelect
					className="flat-earth-height flat-earth-height-control"
					label={heightLabel}
					value={height}
					options={heights}
					onChange={this._onHeight}
					fullWidth={false}
				/>
				<BaseSelect
					className="flat-earth-fov flat-earth-fov-control"
					label={fovLabel}
					value={camera.fieldOfViewDegrees}
					title={fovHint}
					options={fieldsOfView}
					onChange={this._onFieldOfView}
					fullWidth={false}
				/>
				<Button type="button" className="flat-earth-center-sun" onClick={this._onSun} disabled={disabled}>
					{sunLabel}
				</Button>
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
					<Typography component="h3" variant="subtitle1">
						{title}
					</Typography>
					{content}
					<p>{scope}</p>
				</section>
			);
		}
		return content;
	}
}
