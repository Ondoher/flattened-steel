import React, {Component} from 'react';

import AppContext from '../../../common/AppContext.js';
/** Presentational application shell driven entirely by its view service and controller-owned state. */
export default class AppShell extends Component {
	static contextType = AppContext;
	/**
	 * Creates a shell with the initial controller-owned page state.
	 *
	 * @param {object} props - The shell properties.
	 */
	constructor(props) {
		super(props);
		this.state = {...props.initialState};
		this.onStateChanged = this.onStateChanged.bind(this);
	}
	/** Called by React to subscribe to view-mediated shell state. */
	componentDidMount() {
		this.stateListener = this.props.appView.listen('state-changed', this.onStateChanged);
		this.onStateChanged(this.props.appView.getShellState());
	}
	/** Called by React to remove the exact view-service listener. */
	componentWillUnmount() {
		this.props.appView.unlisten('state-changed', this.stateListener);
	}
	/**
	 * Called by the view service to install the latest controller-owned shell state.
	 *
	 * @param {AppShellState} state - The next shell state.
	 */
	onStateChanged(state) {
		this.setState(state);
	}
	/**
	 * Called by shell rendering to resolve a literal label or phrase key.
	 *
	 * @param {string} value - The configured display text.
	 * @param {string} fallback - Literal text used when localization mode is disabled.
	 * @returns {string} - The display text.
	 */
	resolveText(value, fallback = value) {
		let context = /** @type {AppContextValue} */ (this.context);
		return context.localizationEnabled
			? (context.localize?.translate(value, {}, undefined, context.locale) ?? '')
			: fallback;
	}

	/**
	 * Called by shell variants to render mounted, missing, or empty page state.
	 *
	 * @returns {React.ReactNode} - The current page presentation.
	 */
	renderContent() {
		return (
			this.state.pageComponent ||
			(this.state.notFound ? <p>{this.resolveText('app.pages.not-found', 'Page not found')}</p> : null)
		);
	}
	/**
	 * Call this method to render the app-directed shell.
	 *
	 * @returns {React.ReactNode} - The shell presentation.
	 */
	render() {
		return (
			<div className="app-shell app-shell-directed">
				<main>{this.renderContent()}</main>
			</div>
		);
	}
}
