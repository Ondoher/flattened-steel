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
		this._root = createRef();
	}

	/**
	 * Called by React to focus an explicitly opened settings surface.
	 */
	componentDidMount() {
		this._opener =
			document.activeElement instanceof HTMLButtonElement
				? document.activeElement
				: document.querySelector('[aria-controls="workspace-configuration"]');
		this._focusRequest();
	}

	/**
	 * Called by React to honor an explicit new focus intent without stealing focus on ordinary updates.
	 *
	 * @param {ConfigurationPanelProps} previous - Prior selected scope and request.
	 */
	componentDidUpdate(previous) {
		if (previous.configuration.request !== this.props.configuration.request) {
			if (!this._root.current?.contains(document.activeElement)) {
				this._opener = document.activeElement;
			}
			this._focusRequest();
		}
	}

	/**
	 * Called by React to restore focus to the actual opener or stable workspace action.
	 */
	componentWillUnmount() {
		let target = /** @type {HTMLElement} */ (
			this._opener?.isConnected
				? this._opener
				: document.querySelector('[aria-controls="workspace-configuration"]')
		);
		target?.focus();
	}

	/**
	 * Called after explicit settings navigation to focus a provider-advertised editor region.
	 */
	_focusRequest() {
		let focus = this.props.configuration.focus;
		let region = focus ? this._root.current?.querySelector(`[data-settings-focus="${CSS.escape(focus)}"]`) : null;
		let target = region?.querySelector('input') ?? region ?? this._closeButton.current;
		target?.focus();
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
		let workspaceLabel = text('workspace.shared-settings');
		let selectedTarget = configuration.target ?? '';
		let options = views
			.filter((view) => (configuration.targets ?? [view.id]).includes(view.id))
			.map((view) => {
				let index = views.findIndex((item) => item.id === view.id);
				let viewLabel = text('workspace.view', {number: index + 1});
				let pageLabel = view.page ? text(view.page.label, {}, view.page.literalLabel) : '';
				let label = pageLabel ? `${viewLabel} — ${pageLabel}` : viewLabel;
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
	 * Called by panel rendering to expose registered section choices.
	 *
	 * @returns {React.ReactNode} - Generic section navigation.
	 */
	_renderSections() {
		let {configuration, text} = this.props;
		let label = text('workspace.settings-section');
		let buttons = (configuration.sections ?? []).map((section) => {
			let title = text(section.label ?? section.id, {}, section.id);
			let selected = section.id === configuration.section;
			return (
				<button
					key={section.registrationId}
					type="button"
					className="workspace-button"
					data-section={section.id}
					aria-pressed={selected}
					onClick={this.props.onSelectSection}
				>
					{title}
				</button>
			);
		});
		return (
			<nav className="configuration-sections" aria-label={label}>
				{buttons}
			</nav>
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
				ref={this._root}
				id="workspace-configuration"
				className="configuration-panel"
				aria-labelledby="configuration-heading"
				onKeyDown={this._onKeyDown}
			>
				{this._renderHeader()}
				{this._renderScope()}
				{this._renderSections()}
				{this._renderContent()}
			</aside>
		);
	}
}
