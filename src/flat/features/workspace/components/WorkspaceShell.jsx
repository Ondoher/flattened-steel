import React, {Component} from 'react';
import AppContext from '../../../common/AppContext.js';
import phrases from '../../../phrases/en-US.json';
import WorkspaceToolbar from './WorkspaceToolbar.jsx';
import Workspace from './Workspace.jsx';
import ConfigurationPanel from './ConfigurationPanel.jsx';

/**
 * Persistent frame consuming only its own view service and presentation context.
 *
 * @extends {Component<WorkspaceShellProps, WorkspaceShellState>}
 */
export default class WorkspaceShell extends Component {
	static contextType = AppContext;

	/**
	 * Creates the presentation with named stable intent handlers.
	 *
	 * @param {WorkspaceShellProps} props - Owning view and initial projection.
	 */
	constructor(props) {
		super(props);
		this.state = props.initialState;
		this._onStateChanged = this._onStateChanged.bind(this);
		this._text = this._text.bind(this);
		this._onToggleComparison = this._onToggleComparison.bind(this);
		this._onToggleConfiguration = this._onToggleConfiguration.bind(this);
		this._onSelectPage = this._onSelectPage.bind(this);
		this._onSelectTarget = this._onSelectTarget.bind(this);
		this._onCloseView = this._onCloseView.bind(this);
	}

	/**
	 * Called by React to attach the exact view-mediated update listener.
	 */
	componentDidMount() {
		this._attachView(this.props.workspaceView);
	}

	/**
	 * Called by React to rebind when the explicit view owner changes.
	 *
	 * @param {WorkspaceShellProps} previous - Previous presentation owner.
	 */
	componentDidUpdate(previous) {
		if (previous.workspaceView !== this.props.workspaceView) {
			this._detachView();
			this._attachView(this.props.workspaceView);
		}
	}

	/**
	 * Called by React to release the owned update listener.
	 */
	componentWillUnmount() {
		this._detachView();
	}

	/**
	 * Called at the runtime-ready boundary to attach one exact view listener.
	 *
	 * @param {WorkspaceViewService} view - Owning presentation capability.
	 */
	_attachView(view) {
		this._view = view;
		this._stateListener = view.listen('state-changed', this._onStateChanged);
		this._onStateChanged(view.getShellState());
	}

	/**
	 * Called during replacement or unmount to detach from the original owner.
	 */
	_detachView() {
		if (this._stateListener) {
			this._view.unlisten('state-changed', this._stateListener);
		}
		this._stateListener = null;
		this._view = null;
	}

	/**
	 * Called by the owning view to install a disposable projection.
	 *
	 * @param {WorkspaceShellState} state - Next presentation.
	 */
	_onStateChanged(state) {
		this.setState(state);
	}

	/**
	 * Called by child presentation to resolve text without service orchestration.
	 *
	 * @param {string} key - Flat phrase key.
	 * @param {Record<string, string|number>} replacements - Named presentation values.
	 * @param {string} [literal] - Label for localization-disabled presentation only.
	 * @returns {string} - Localized text, or an empty failed lookup.
	 */
	_text(key, replacements = {}, literal) {
		let context = /** @type {AppContextValue} */ (this.context);
		if (context.localizationEnabled) {
			return context.localize?.translate(key, replacements, undefined, context.locale) ?? '';
		}
		return String(literal ?? phrases[key] ?? '').replace(/%\{([^}]+)\}/g, (_match, name) =>
			String(replacements[name] ?? ''),
		);
	}

	/**
	 * Called by workspace controls to request comparison.
	 */
	_onToggleComparison() {
		this.props.workspaceView.toggleComparison();
	}

	/**
	 * Called by workspace controls to request panel visibility.
	 */
	_onToggleConfiguration() {
		this.props.workspaceView.toggleConfiguration();
	}

	/**
	 * Called by the optional view's close button to preserve the primary view.
	 *
	 * @param {React.MouseEvent<HTMLButtonElement>} event - Native close gesture.
	 */
	_onCloseView(event) {
		this.props.workspaceView.closeView(event.currentTarget.dataset.viewId);
	}

	/**
	 * Called by a scene selector to report explicit target and definition.
	 *
	 * @param {React.ChangeEvent<HTMLSelectElement>} event - Native selection intent.
	 */
	_onSelectPage(event) {
		this.props.workspaceView.requestPage(event.currentTarget.value, event.currentTarget.dataset.viewId);
	}

	/**
	 * Called by the configuration selector to report its scope.
	 *
	 * @param {React.ChangeEvent<HTMLSelectElement>} event - Native scope intent.
	 */
	_onSelectTarget(event) {
		this.props.workspaceView.selectConfigurationTarget(event.currentTarget.value || null);
	}

	/**
	 * Called by frame rendering to present shared chrome.
	 *
	 * @returns {React.ReactNode} - Workspace toolbar.
	 */
	_renderToolbar() {
		let comparison = this.state.views.length === 2;
		return (
			<WorkspaceToolbar
				text={this._text}
				comparison={comparison}
				configurationOpen={this.state.configuration.open}
				contributions={this.state.toolbar}
				onToggleComparison={this._onToggleComparison}
				onToggleConfiguration={this._onToggleConfiguration}
			/>
		);
	}

	/**
	 * Called by frame rendering to present the open view hosts.
	 *
	 * @returns {React.ReactNode} - Main workspace region.
	 */
	_renderWorkspace() {
		let title = this._text('workspace.title');
		return (
			<main className="workspace-main" aria-label={title}>
				<Workspace
					text={this._text}
					views={this.state.views}
					pages={this.state.pages}
					notFound={this.state.notFound}
					onSelectPage={this._onSelectPage}
					onCloseView={this._onCloseView}
				/>
			</main>
		);
	}

	/**
	 * Called by frame rendering to present the controller-selected settings scope.
	 *
	 * @returns {React.ReactNode} - Settings panel or no panel when closed.
	 */
	_renderConfiguration() {
		if (!this.state.configuration.open) {
			return null;
		}
		return (
			<ConfigurationPanel
				text={this._text}
				configuration={this.state.configuration}
				views={this.state.views}
				onClose={this._onToggleConfiguration}
				onSelectTarget={this._onSelectTarget}
			/>
		);
	}

	/**
	 * Call this method to render the persistent, domain-independent frame.
	 *
	 * @returns {React.ReactNode} - Workspace presentation.
	 */
	render() {
		return (
			<div className="workspace-shell" data-configuration-open={this.state.configuration.open}>
				{this._renderToolbar()}
				<div className="workspace-body">
					{this._renderWorkspace()}
					{this._renderConfiguration()}
				</div>
			</div>
		);
	}
}
