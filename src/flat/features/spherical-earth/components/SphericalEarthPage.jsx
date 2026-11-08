import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import Button from '../../../components/Button.jsx';

/**
 * Honest M1 page presentation, independent of future scene rendering.
 *
 * @extends {Component<SphericalEarthPageProps, SphericalEarthPageState>}
 */
export default class SphericalEarthPage extends Component {
	static contextType = AppContext;

	/**
	 * Creates local presentation state and stable interaction handlers.
	 *
	 * @param {SphericalEarthPageProps} props - Feature view and initial facts.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this._onChanged = this._onChanged.bind(this);
		this._onRetry = this._onRetry.bind(this);
	}

	/**
	 * Called by React after presentation mounts.
	 */
	componentDidMount() {
		this._subscribe();
	}

	/**
	 * Called by React to retire presentation.
	 */
	componentWillUnmount() {
		this._unsubscribe();
	}

	/**
	 * Called by owner changes to subscribe to exact presentation state.
	 */
	_subscribe() {
		this.owner = this.props.sceneView;
		this.ownerId = this.props.viewId;
		this.listener = this.owner.listen('state-changed', this._onChanged);
		this.setState(this.owner.getState(this.ownerId));
	}

	/**
	 * Called by React to rebind when an existing presentation changes owner.
	 *
	 * @param {SphericalEarthPageProps} previous - Original presentation owner.
	 */
	componentDidUpdate(previous) {
		if (previous.sceneView !== this.props.sceneView || previous.viewId !== this.props.viewId) {
			this._unsubscribe();
			this._subscribe();
		}
	}

	/**
	 * Called by React to retire the original subscription exactly.
	 */
	_unsubscribe() {
		this.owner.unlisten('state-changed', this.listener);
	}

	/**
	 * Called by view notification to project only this component's state.
	 *
	 * @param {SphericalEarthStateChange} change - Exact view and state.
	 */
	_onChanged({viewId, state}) {
		if (viewId === this.ownerId) {
			this.setState(state);
		}
	}

	/**
	 * Called by the retry control to relay intent to the owning view service.
	 */
	_onRetry() {
		this.props.sceneView.retry(this.props.viewId);
	}

	/**
	 * Called by render helpers to resolve UI copy through the application context.
	 *
	 * @param {string} phrase - Registered phrase key.
	 * @returns {string} - Current localized text.
	 */
	_text(phrase) {
		let context = /** @type {AppContextValue} */ (this.context);
		return context.localize.translate(phrase, {}, undefined, context.locale);
	}

	/**
	 * Called by render to own the status region and optional retry control.
	 *
	 * @returns {React.ReactNode} - Localized status presentation.
	 */
	_renderStatus() {
		let message = this._text('spherical-earth.state.' + this.state.status);
		let retry =
			this.state.status === 'error' ? <Button label="spherical-earth.retry" onClick={this._onRetry} /> : null;
		return (
			<div className="spherical-earth-status">
				<p>{message}</p>
				{retry}
			</div>
		);
	}

	/**
	 * Called by React to compose the feature's owned region.
	 *
	 * @returns {React.ReactNode} - Visible spherical page shell.
	 */
	render() {
		let title = this._text('spherical-earth.title');
		return (
			<section className="spherical-earth-page" data-cache-status={this.state.status}>
				<h2>{title}</h2>
				{this._renderStatus()}
			</section>
		);
	}
}
