import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import BaseSelect from '../../../components/BaseSelect.jsx';
import Button from '../../../components/Button.jsx';
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
		/**
		 * @type {React.RefObject<HTMLButtonElement>}
		 */
		this._closeButton = createRef();
		this._onKeyDown = this._onKeyDown.bind(this);
		this._onScopeChange = this._onScopeChange.bind(this);
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
		this._focusObserver?.disconnect();
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
		this._focusObserver?.disconnect();
		let focus = this.props.configuration.focus;
		let region = focus ? this._root.current?.querySelector(`[data-settings-focus="${CSS.escape(focus)}"]`) : null;
		let input = region ? this._findInput(region) : null;
		let target = input ?? region ?? this._closeButton.current;
		target?.focus();
		if (region && !input) {
			this._focusObserver = new MutationObserver(() => {
				let ready = this._findInput(region);
				if (ready) {
					if (region.contains(document.activeElement)) {
						ready.focus();
					}
					this._focusObserver.disconnect();
				}
			});
			this._focusObserver.observe(region, {
				attributes: true,
				attributeFilter: ['disabled'],
				childList: true,
				subtree: true,
			});
		}
	}

	/**
	 * Called by explicit focus requests to skip hidden disclosure fields and loading inputs.
	 *
	 * @param {HTMLElement} region - Provider-owned focus region.
	 * @returns {HTMLInputElement|undefined} - Visible enabled editor input, when available.
	 */
	_findInput(region) {
		let inputs = /** @type {NodeListOf<HTMLInputElement>} */ (region.querySelectorAll('input:not([disabled])'));
		return Array.from(inputs).find((input) => input.checkVisibility());
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
				<Typography component="h2" variant="h6" id="configuration-heading">
					{title}
				</Typography>
				<Button
					buttonRef={this._closeButton}
					type="button"
					className="workspace-button"
					onClick={this.props.onClose}
				>
					{closeLabel}
				</Button>
			</header>
		);
	}

	/**
	 * Called by panel rendering to present the owner's controlled scope selection.
	 *
	 * @returns {React.ReactNode} - Explicit application or open-view target.
	 */
	_renderScope() {
		let {configuration, text} = this.props;
		let label = 'workspace.configuration-for';
		let selectedTarget = configuration.target ?? '';
		let options = this._scopeOptions();
		let selectProps = {displayEmpty: true};
		return (
			<div className="configuration-scope">
				<BaseSelect
					label={label}
					value={selectedTarget}
					options={options}
					selectProps={selectProps}
					onChange={this._onScopeChange}
				/>
			</div>
		);
	}

	/**
	 * Prepares registered workspace/view scope values before rendering.
	 *
	 * @returns {AppSelectOption[]} - Current supported scopes.
	 */
	_scopeOptions() {
		let {configuration, text, views} = this.props;
		let options = views
			.filter((view) => (configuration.targets ?? [view.id]).includes(view.id))
			.map((view) => {
				let index = views.findIndex((item) => item.id === view.id);
				let viewLabel = text('workspace.view', {number: index + 1});
				let pageLabel = view.page ? text(view.page.label) : '';
				let label = pageLabel
					? {phrase: 'workspace.view-page', replacements: {view: viewLabel, page: pageLabel}}
					: {phrase: 'workspace.view', replacements: {number: index + 1}};
				return {value: view.id, label};
			});
		return [{value: '', label: 'workspace.shared-settings'}, ...options];
	}

	/**
	 * Relays the selected scope value without passing a synthetic MUI event outward.
	 *
	 * @param {string} value - Selected scope or the empty workspace value.
	 */
	_onScopeChange(value) {
		this.props.onSelectTarget(value);
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
			let title = section.label ? text(section.label) : '';
			let selected = section.id === configuration.section;
			return (
				<Button
					key={section.registrationId}
					type="button"
					className="workspace-button"
					data-section={section.id}
					aria-pressed={selected}
					onClick={this.props.onSelectSection}
				>
					{title}
				</Button>
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
			<Paper
				component="aside"
				elevation={0}
				square
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
			</Paper>
		);
	}
}
