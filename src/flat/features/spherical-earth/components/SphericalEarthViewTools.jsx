import SyncAltOutlined from '@mui/icons-material/SyncAltOutlined';
import ExploreOutlined from '@mui/icons-material/ExploreOutlined';
import IconButton from '../../../components/IconButton.jsx';
import Select from '../../../components/Select.jsx';
import Typography from '@mui/material/Typography';
import IconMenuButton from '../../../components/IconMenuButton.jsx';
import Brightness6Outlined from '@mui/icons-material/Brightness6Outlined';
import Height from '@mui/icons-material/Height';
import ZoomOutMap from '@mui/icons-material/ZoomOutMap';
import CenterFocusStrong from '@mui/icons-material/CenterFocusStrong';
import AccessTime from '@mui/icons-material/AccessTime';
import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import {FIELD_OF_VIEW_PRESETS, ELEVATION_PRESETS} from '../camera-controls.js';

/**
 * Presents scoped camera controls inside the application's generic view-tools host.
 *
 * @extends {Component<SphericalEarthViewToolsProps, SphericalEarthSceneState>}
 */
export default class SphericalEarthViewTools extends Component {
	static contextType = AppContext;

	/**
	 * Creates stable presentation callbacks without locating services or owning camera state.
	 *
	 * @param {SphericalEarthViewToolsProps} props - Owning presentation capability and scoped initial state.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this._onStateChanged = this._onStateChanged.bind(this);
		this._onFieldOfView = this._onFieldOfView.bind(this);
		this._onHeight = this._onHeight.bind(this);
		this._onFocus = this._onFocus.bind(this);
		this._onCompass = this._onCompass.bind(this);
		this._onSync = this._onSync.bind(this);
		this._onSky = this._onSky.bind(this);
		this._onTime = this._onTime.bind(this);
	}

	/**
	 * Called by the clock menu to request a solar event through the owning view.
	 *
	 * @param {SphericalSolarEventKind} kind - Selected shared-time event.
	 */
	_onTime(kind) {
		this.props.sceneView.setSolarEvent(this.props.viewId, kind);
	}

	/**
	 * Owns the Globe's clock action menu beside the other feature controls.
	 *
	 * @returns {React.ReactNode} - Localized sunrise, solar-noon and sunset actions.
	 */
	_renderTimeControl() {
		let icon = <AccessTime />;
		let options = this.props.sceneView.getTimeOptions(this.props.viewId);
		let disabled = options.every((option) => option.disabled);
		return (
			<IconMenuButton
				className="spherical-earth-time"
				label="spherical-earth.time.label"
				icon={icon}
				options={options}
				disabled={disabled}
				onChange={this._onTime}
			/>
		);
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
	 * @param {SphericalEarthViewToolsProps} previous - Previous owner and scope.
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
	 * @param {SphericalEarthStateChange} change - Exact scoped scene state.
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
	 * Called by the focus menu to relay one scoped celestial target.
	 *
	 * @param {string} target - Selected focus action.
	 */
	_onFocus(target) {
		if (target === 'polaris') {
			this.props.sceneView.centerOnPolaris(this.props.viewId);
		} else {
			this.props.sceneView.centerOnSun(this.props.viewId);
		}
	}

	/**
	 * Called by the compass button to relay this view's ribbon visibility intent.
	 */
	_onCompass() {
		this.props.sceneView.toggleCompass(this.props.viewId);
	}

	/**
	 * Called by selection to report this view's sky composition intent.
	 *
	 * @param {string} value - Selected supported mode.
	 */
	_onSky(value) {
		let mode = /** @type {SphericalEarthSkyRenderMode} */ (value);
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
	 * @param {SphericalEarthControlOption} preset - Prepared option identity and phrase key.
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
			options.push({value, label: {phrase: 'spherical-earth.camera.angle-value', replacements: {value}}});
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
			options.push({value, label: {phrase: 'spherical-earth.camera.height-value', replacements: {value}}});
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
		 * @type {SphericalEarthControlOption[]}
		 */
		let options = [
			{value: 'full', label: 'spherical-earth.shader.full'},
			{value: 'no-atmosphere', label: 'spherical-earth.shader.no-atmosphere'},
			{value: 'shader-off', label: 'spherical-earth.shader.off'},
		];
		return options.map((option) => this._prepareOption(option));
	}

	/**
	 * Called by the toolbar and settings panel to present the view-owned shader choice.
	 *
	 * @returns {React.ReactNode} - Sky selector with its owned region wrapper.
	 */
	_renderSkyControl() {
		let label = 'spherical-earth.shader.label';
		let hint = this._text('spherical-earth.shader.hint');
		let options = this._renderSkyOptions();
		if (!this.props.panel) {
			let icon = <Brightness6Outlined />;
			return (
				<IconMenuButton
					className="spherical-earth-sky spherical-earth-shader-control"
					label={label}
					icon={icon}
					value={this.state.shader.mode}
					options={options}
					onChange={this._onSky}
				/>
			);
		}
		return (
			<Select
				className="spherical-earth-sky spherical-earth-shader-control"
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
		if (!this.props.panel) {
			return this._renderToolbarControls();
		}
		let camera = this.state.camera;
		let height = camera.pendingHeightMeters ?? camera.observerHeightMeters;
		let heightLabel = 'spherical-earth.camera.height';
		let fovLabel = 'spherical-earth.camera.fov';
		let fovHint = this._text('spherical-earth.camera.fov.hint');
		let heights = this._renderHeightOptions();
		let fieldsOfView = this._renderFieldOfViewOptions();
		return (
			<div className="spherical-earth-view-tools">
				{this._renderSkyControl()}
				<Select
					className="spherical-earth-height spherical-earth-height-control"
					label={heightLabel}
					value={height}
					options={heights}
					onChange={this._onHeight}
					fullWidth={false}
				/>
				<Select
					className="spherical-earth-fov spherical-earth-fov-control"
					label={fovLabel}
					value={camera.fieldOfViewDegrees}
					title={fovHint}
					options={fieldsOfView}
					onChange={this._onFieldOfView}
					fullWidth={false}
				/>
				{this._renderFocusControl()}
			</div>
		);
	}

	/**
	 * Owns the focus action menu without presenting a persistent camera target selection.
	 *
	 * @returns {React.ReactNode} - Scoped Sun and Polaris commands.
	 */
	_renderFocusControl() {
		let icon = <CenterFocusStrong />;
		let disabled = !this.state.renderedObservation;
		let options = [
			{value: 'sun', label: 'camera.focus.sun'},
			{value: 'polaris', label: 'camera.focus.polaris'},
		];
		return (
			<IconMenuButton
				className="spherical-earth-focus"
				label="camera.focus"
				icon={icon}
				options={options}
				onChange={this._onFocus}
				disabled={disabled}
			/>
		);
	}

	/**
	 * Owns this view's independent compass toggle and pressed-state presentation.
	 *
	 * @returns {React.ReactNode} - Named compass icon action.
	 */
	_renderCompassControl() {
		let icon = <ExploreOutlined />;
		let selected = Boolean(this.state.camera.compassVisible);
		let disabled = !this.state.renderedObservation;
		return (
			<IconButton
				className="spherical-earth-compass"
				label="camera.compass.toggle"
				icon={icon}
				aria-pressed={selected}
				disabled={disabled}
				onClick={this._onCompass}
			/>
		);
	}

	/**
	 * Called by the text-only menu to relay a camera-sync action through the owning view.
	 *
	 * @param {CameraSyncMode} mode - Selected action.
	 */
	_onSync(mode) {
		this._view.syncCamera(this._viewId, mode);
	}

	/**
	 * Owns the controlled selected trigger; opening the menu does not change the subscription.
	 *
	 * @returns {React.ReactNode} - Localized camera-sync menu beside the compass.
	 */
	_renderSyncControl() {
		let icon = <SyncAltOutlined />;
		let selected = this.state.sync.mode === 'them' || this.state.sync.mode === 'both';
		let disabled = !this.state.sync.available;
		let options = this.props.sceneView.getSyncOptions(this.props.viewId);
		return (
			<IconMenuButton
				className="spherical-earth-sync"
				label="camera.sync.label"
				icon={icon}
				selected={selected}
				disabled={disabled}
				options={options}
				onChange={this._onSync}
			/>
		);
	}

	/**
	 * Owns the feature's ordered icon commands while workspace owns their placement.
	 *
	 * @returns {React.ReactNode} - Camera, shared-time and aiming actions for this view.
	 */
	_renderToolbarControls() {
		let camera = this.state.camera;
		let height = camera.pendingHeightMeters ?? camera.observerHeightMeters;
		let heights = this._renderHeightOptions();
		let fieldsOfView = this._renderFieldOfViewOptions();
		let elevationIcon = <Height />;
		let fovIcon = <ZoomOutMap />;
		let fovHint = this._text('spherical-earth.camera.fov.hint');
		return (
			<div className="spherical-earth-view-tools spherical-earth-toolbar-tools">
				{this._renderSkyControl()}
				<IconMenuButton
					className="spherical-earth-height spherical-earth-height-control"
					label="spherical-earth.camera.height"
					icon={elevationIcon}
					value={height}
					options={heights}
					onChange={this._onHeight}
				/>
				<IconMenuButton
					className="spherical-earth-fov spherical-earth-fov-control"
					label="spherical-earth.camera.fov"
					icon={fovIcon}
					value={camera.fieldOfViewDegrees}
					options={fieldsOfView}
					onChange={this._onFieldOfView}
					aria-description={fovHint}
				/>
				{this._renderTimeControl()}
				{this._renderFocusControl()}
				{this._renderCompassControl()}
				{this._renderSyncControl()}
			</div>
		);
	}

	/**
	 * Call this method to present the same camera controls in a toolbar or settings section.
	 *
	 * @returns {React.ReactNode} - Scoped Camera presentation.
	 */
	render() {
		let title = this._text('spherical-earth.camera.title');
		let scope = this._text('spherical-earth.camera.scope');
		let content = this._renderControls();
		if (this.props.panel) {
			content = (
				<section className="spherical-earth-camera-panel">
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
