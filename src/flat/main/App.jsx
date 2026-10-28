import React, {Component} from 'react';
import AppContext from '../common/AppContext.js';
/** Root React boundary for generated application context and shell presentation. */
export default class App extends Component {
	/**
	 * Creates the application context boundary.
	 *
	 * @param {object} props - React properties containing the application registry.
	 */
	constructor(props) {
		super(props);
		this.registry = props.registry;
		this.state = {context: this.registry.subscribe('app-context').get()};
		this.onContextChanged = this.onContextChanged.bind(this);
	}
	/** Called by React to subscribe to canonical application-context changes. */
	componentDidMount() {
		this.contextService = this.registry.subscribe('app-context');
		this.contextListener = this.contextService.listen('changed', this.onContextChanged);
	}
	/** Called by React to remove the exact application-context listener. */
	componentWillUnmount() {
		this.contextService.unlisten('changed', this.contextListener);
	}
	/**
	 * Called by the context service to install its latest defensive value.
	 *
	 * @param {AppContextValue} context - The next global context value.
	 */
	onContextChanged(context) {
		this.setState({context});
	}
	/**
	 * Call this method to render the application context and current shell.
	 *
	 * @returns {React.ReactNode} - The application presentation.
	 */
	render() {
		return (
			<AppContext.Provider value={this.state.context}>
				{this.registry.subscribe('app-controller').getComponent()}
			</AppContext.Provider>
		);
	}
}
