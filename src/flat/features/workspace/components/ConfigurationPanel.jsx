import React, {Component, createRef} from 'react';

/**
 * Nonmodal configuration host with explicit workspace or view scope.
 *
 * @extends {Component<ConfigurationPanelProps>}
 */
export default class ConfigurationPanel extends Component {
	/**
	 * Creates the local focus target and stable keyboard handler.
	 *
	 * @param {ConfigurationPanelProps} props - Scoped contributed presentation and callbacks.
	 */
	constructor(props) {
		super(props);
		/** @type {React.RefObject<HTMLButtonElement>} */
		this._closeButton = createRef();
		this._onKeyDown = this._onKeyDown.bind(this);
	}

	/**
	 * Called by React to focus an explicitly opened settings surface.
	 */
	componentDidMount() {
		this._closeButton.current?.focus();
	}

	/**
	 * Called by the panel to translate Escape into the owner's close intent.
	 *
	 * @param {React.KeyboardEvent<HTMLElement>} event - Panel keyboard gesture.
	 */
	_onKeyDown(event) {
		if (event.key === 'Escape' && !event.defaultPrevented) {
			event.preventDefault();
			this.props.onClose();
		}
	}

	/**
	 * Called by panel rendering to present its heading and close action.
	 *
	 * @returns {React.ReactNode} - Semantic panel header.
	 */
	_renderHeader() {
		let {text} = this.props;
		let title = text('workspace.configuration');
		let closeLabel = text('workspace.close');
		return (
			<header className="configuration-header">
				<h2 id="configuration-heading">{title}</h2>
				<button ref={this._closeButton} type="button" className="workspace-button" onClick={this.props.onClose}>
					{closeLabel}
				</button>
			</header>
		);
	}

	/**
	 * Called by panel rendering to present the owner's controlled scope selection.
	 *
	 * @returns {React.ReactNode} - Explicit application or open-view target.
	 */
	_renderScope() {
		let {configuration, text, views} = this.props;
		let scopeLabel = text('workspace.configuration-for');
		let workspaceLabel = text('workspace.title');
		let selectedTarget = configuration.target ?? '';
		let options = views.map((view, index) => {
			let label = text('workspace.view', {number: index + 1});
			return (
				<option key={view.id} value={view.id}>
					{label}
				</option>
			);
		});
		return (
			<label className="configuration-scope">
				<span>{scopeLabel}</span>
				<select value={selectedTarget} onChange={this.props.onSelectTarget}>
					<option value="">{workspaceLabel}</option>
					{options}
				</select>
			</label>
		);
	}

	/**
	 * Called by panel rendering to present selected feature settings or the empty state.
	 *
	 * @returns {React.ReactNode} - Semantic content region.
	 */
	_renderContent() {
		let {configuration, text} = this.props;
		let content;
		if (configuration.contributions.length) {
			content = configuration.contributions.map((item) => (
				<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
			));
		} else {
			let emptyMessage = text('workspace.no-settings');
			content = <p className="workspace-empty">{emptyMessage}</p>;
		}
		return <div className="configuration-content">{content}</div>;
	}

	/**
	 * Call this method to render the selected scope without choosing or mutating feature settings.
	 *
	 * @returns {React.ReactNode} - Configuration presentation.
	 */
	render() {
		return (
			<aside
				id="workspace-configuration"
				className="configuration-panel"
				aria-labelledby="configuration-heading"
				onKeyDown={this._onKeyDown}
			>
				{this._renderHeader()}
				{this._renderScope()}
				{this._renderContent()}
			</aside>
		);
	}
}
