import React, {Component, createRef} from 'react';

/**
 * Shared contribution host and workspace actions, independent of scene features.
 *
 * @extends {Component<WorkspaceToolbarProps>}
 */
export default class WorkspaceToolbar extends Component {
	/**
	 * Creates local focus references for persistent toolbar actions.
	 *
	 * @param {WorkspaceToolbarProps} props - Projected content and intent callbacks.
	 */
	constructor(props) {
		super(props);
		/** @type {React.RefObject<HTMLButtonElement>} */
		this._comparisonButton = createRef();
		/** @type {React.RefObject<HTMLButtonElement>} */
		this._configurationButton = createRef();
	}

	/**
	 * Called by React to restore focus when a child view or configuration surface closes.
	 *
	 * @param {WorkspaceToolbarProps} previous - Previous presentation values.
	 */
	componentDidUpdate(previous) {
		if (previous.configurationOpen && !this.props.configurationOpen) {
			this._configurationButton.current?.focus();
		} else if (previous.comparison && !this.props.comparison) {
			this._comparisonButton.current?.focus();
		}
	}

	/**
	 * Called by toolbar rendering to present owner-rendered shared controls.
	 *
	 * @returns {React.ReactNode} - Shared control host.
	 */
	_renderContributions() {
		let contributions = this.props.contributions.map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return <div className="workspace-toolbar-content">{contributions}</div>;
	}

	/**
	 * Called by toolbar rendering to present workspace action controls.
	 *
	 * @returns {React.ReactNode} - Comparison and configuration actions.
	 */
	_renderActions() {
		let comparisonLabel = this.props.text(this.props.comparison ? 'workspace.single-view' : 'workspace.add-view');
		let configurationLabel = this.props.text('workspace.configuration');
		return (
			<div className="workspace-actions">
				<button
					ref={this._comparisonButton}
					type="button"
					className="workspace-button workspace-button-primary"
					aria-pressed={this.props.comparison}
					onClick={this.props.onToggleComparison}
				>
					{comparisonLabel}
				</button>
				<button
					ref={this._configurationButton}
					type="button"
					className="workspace-button"
					aria-expanded={this.props.configurationOpen}
					aria-controls="workspace-configuration"
					onClick={this.props.onToggleConfiguration}
				>
					{configurationLabel}
				</button>
			</div>
		);
	}

	/**
	 * Call this method to render shared chrome and feature-owned content.
	 *
	 * @returns {React.ReactNode} - Toolbar presentation.
	 */
	render() {
		let title = this.props.text('app.title');
		return (
			<header className="workspace-toolbar">
				<h1 className="workspace-brand">{title}</h1>
				{this._renderContributions()}
				{this._renderActions()}
			</header>
		);
	}
}
