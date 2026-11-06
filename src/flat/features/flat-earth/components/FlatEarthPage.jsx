import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import phrases from '../../../phrases/en-US.json';

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
		this.canvas = React.createRef();
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
		this._view.attach(this._viewId, this.canvas.current);
	}

	/**
	 * Called during unmount/owner changes to release the exact original identities.
	 */
	_detachView() {
		if (this._listener) {
			this._view.unlisten('state-changed', this._listener);
		}
		this._listener = null;
		this._view.detach(this._viewId, this.canvas.current);
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
		if (context.localizationEnabled) {
			return context.localize?.translate(key, {}, undefined, context.locale) ?? '';
		}
		return phrases[key];
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
				<button type="button" onClick={this._onRetry}>
					{retryLabel}
				</button>
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
	 * Call this method to render the surface and prepared feedback without constructing renderer resources.
	 *
	 * @returns {React.ReactNode} - Independently owned scene surface.
	 */
	render() {
		let title = this._text('flat-earth.title');
		let status = this.state.status;
		return (
			<div className="flat-earth-page" data-view-id={this.props.viewId} data-scene-status={status}>
				<canvas ref={this.canvas} className="flat-earth-canvas" aria-label={title} />
				{this._renderStatus()}
				{this._renderLookHint()}
			</div>
		);
	}
}
