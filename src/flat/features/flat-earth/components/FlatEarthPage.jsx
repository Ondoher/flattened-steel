import DirectionRibbon from '../../../components/DirectionRibbon.jsx';
import Button from '../../../components/Button.jsx';
import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';

/**
 * Presents one scene canvas and preparation/retry feedback through its own feature view.
 *
 * @extends {Component<FlatEarthPageProps, FlatEarthSceneState>}
 */
export default class FlatEarthPage extends Component {
	static contextType = AppContext;

	/**
	 * Creates presentation state, stable intents, and the DOM-owned canvas reference.
	 *
	 * @param {FlatEarthPageProps} props - Owning view and initial scene state.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this.surface = React.createRef();
		this._onStateChanged = this._onStateChanged.bind(this);
		this._onRetry = this._onRetry.bind(this);
	}

	/**
	 * Called by React after mounting to attach presentation and relay the surface intent.
	 */
	componentDidMount() {
		this._attachView();
	}

	/**
	 * Called by React to release the previous explicit owner before rebinding presentation.
	 *
	 * @param {FlatEarthPageProps} previous - Previous presentation owner and view identity.
	 */
	componentDidUpdate(previous) {
		if (previous.sceneView !== this.props.sceneView || previous.viewId !== this.props.viewId) {
			this._detachView();
			this._attachView();
		}
		this._canvas.setAttribute('aria-label', this._text('flat-earth.title'));
	}

	/**
	 * Called by React to release the exact original view listener and canvas lifetime.
	 */
	componentWillUnmount() {
		this._detachView();
	}

	/**
	 * Called after mounting/owner changes to subscribe to one presentation owner.
	 */
	_attachView() {
		this._view = this.props.sceneView;
		this._viewId = this.props.viewId;
		this._listener = this._view.listen('state-changed', this._onStateChanged);
		this.setState(this._view.getState(this._viewId));
		this._canvas = this._view.getCanvas(this._viewId);
		this._canvas.className = 'flat-earth-canvas';
		this._canvas.setAttribute('aria-label', this._text('flat-earth.title'));
		this.surface.current.appendChild(this._canvas);
		this._view.attach(this._viewId, this._canvas);
	}

	/**
	 * Called during unmount/owner changes to release the exact original identities.
	 */
	_detachView() {
		if (this._listener) {
			this._view.unlisten('state-changed', this._listener);
		}
		this._listener = null;
		this._view.detach(this._viewId, this._canvas);
		this._canvas.remove();
	}

	/**
	 * Called by view events to update only this workspace view's presentation.
	 *
	 * @param {FlatEarthStateChange} change - Scoped scene-state notification.
	 */
	_onStateChanged({viewId, state}) {
		if (viewId === this._viewId) {
			this.setState(state);
		}
	}

	/**
	 * Called by the retry button to relay recovery intent to the owning view.
	 */
	_onRetry() {
		this.props.sceneView.retry(this.props.viewId);
	}

	/**
	 * Called by rendering to resolve feature labels through presentation context.
	 *
	 * @param {string} key - Feature phrase key.
	 * @returns {string} - Localized feature text.
	 */
	_text(key) {
		let context = /** @type {AppContextValue} */ (this.context);
		return context.localize.translate(key, {}, undefined, context.locale);
	}

	/**
	 * Called by render to own the visible preparation/failure region.
	 *
	 * @returns {React.ReactNode} - Scoped feedback or null for a ready scene.
	 */
	_renderStatus() {
		let {status, error} = this.state;
		if (status === 'ready') {
			return null;
		}
		let message = this._text(`flat-earth.scene.${status}`);
		let retryLabel = this._text('flat-earth.scene.retry');
		let details = error ? <p>{error}</p> : null;
		let retry =
			status === 'error' ? (
				<Button type="button" onClick={this._onRetry}>
					{retryLabel}
				</Button>
			) : null;
		return (
			<div className="flat-earth-scene-status" role="status">
				<p>{message}</p>
				{details}
				{retry}
			</div>
		);
	}

	/**
	 * Called by rendering to own the current mouse-look instruction region.
	 *
	 * @returns {React.ReactNode} - Scoped native input hint, once a scene is displayed.
	 */
	_renderLookHint() {
		if (!this.state.renderedObservation) {
			return null;
		}
		let hint = this._text(`flat-earth.camera.look.${this.state.camera.lookStatus}`);
		return (
			<div className="flat-earth-look-hint" role="status">
				{hint}
			</div>
		);
	}

	/**
	 * Owns the optional ribbon row above this feature's retained scene surface.
	 *
	 * @returns {React.ReactNode} - Empty or populated direction row without replacing the canvas.
	 */
	_renderDirectionRibbon() {
		let ribbon = null;
		if (this.state.camera.compassVisible) {
			ribbon = <DirectionRibbon headingDegrees={this.state.camera.headingDegrees} />;
		}
		return <div className="flat-earth-direction-ribbon">{ribbon}</div>;
	}

	/**
	 * Call this method to render the surface and prepared feedback without constructing renderer resources.
	 *
	 * @returns {React.ReactNode} - Independently owned scene surface.
	 */
	render() {
		let status = this.state.status;
		let compassVisible = Boolean(this.state.camera.compassVisible);
		return (
			<div
				className="flat-earth-page"
				data-view-id={this.props.viewId}
				data-scene-status={status}
				data-compass-visible={compassVisible}
			>
				{this._renderDirectionRibbon()}
				<div ref={this.surface} className="flat-earth-surface" />
				{this._renderStatus()}
				{this._renderLookHint()}
			</div>
		);
	}
}
