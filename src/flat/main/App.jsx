import React, {Component} from 'react';
import AppContext from '../common/AppContext.js';

/**
 * Root presentation consuming only the owning application view.
 *
 * @extends {Component<AppRootProps, AppPresentationState>}
 */
export default class App extends Component {
	/**
	 * Creates local presentation state without locating registry services.
	 *
	 * @param {AppRootProps} props - View-mediated state and capability.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this._onStateChanged = this._onStateChanged.bind(this);
	}

	/**
	 * Called by React to bind at the component's own runtime-ready boundary.
	 */
	componentDidMount() {
		this._attachView(this.props.appView);
	}

	/**
	 * Called by React to rebind only when the explicit presentation owner changes.
	 *
	 * @param {AppRootProps} previous - Previous owner identity.
	 */
	componentDidUpdate(previous) {
		if (previous.appView !== this.props.appView) {
			this._detachView();
			this._attachView(this.props.appView);
		}
	}

	/**
	 * Called by React to remove the listener from its original owner.
	 */
	componentWillUnmount() {
		this._detachView();
	}

	/**
	 * Called at mount or owner replacement to attach one exact listener.
	 *
	 * @param {AppViewService} view - Owning presentation capability.
	 */
	_attachView(view) {
		this._view = view;
		this._stateListener = view.listen('state-changed', this._onStateChanged);
		this._onStateChanged(view.getState());
	}

	/**
	 * Called at replacement or unmount to release the original registration safely.
	 */
	_detachView() {
		if (this._stateListener) {
			this._view.unlisten('state-changed', this._stateListener);
		}
		this._stateListener = null;
		this._view = null;
	}

	/**
	 * Called by the application view to install a disposable projection.
	 *
	 * @param {AppPresentationState} state - Next context and presentation.
	 */
	_onStateChanged(state) {
		this.setState(state);
	}

	/**
	 * Call this method to render projected context and content without service calls.
	 *
	 * @returns {React.ReactNode} - Application presentation.
	 */
	render() {
		return <AppContext.Provider value={this.state.context}>{this.state.presentation}</AppContext.Provider>;
	}
}
