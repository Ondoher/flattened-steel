import BaseSelect from '../../../components/BaseSelect.jsx';
import Typography from '@mui/material/Typography';
import Button from '../../../components/Button.jsx';
import React, {Component} from 'react';

/**
 * Generic scene host, contributed controls, and status for one stable view identity.
 *
 * @extends {Component<ViewportFrameProps, ViewportFrameState>}
 */
export default class ViewportFrame extends Component {
	/**
	 * Creates independent transient control visibility for this mounted view.
	 *
	 * @param {ViewportFrameProps} props - Generic workspace view presentation.
	 */
	constructor(props) {
		super(props);
		this.state = {controlsCollapsed: false};
		this._onToggleControls = this._onToggleControls.bind(this);
		this._onSelectPage = this._onSelectPage.bind(this);
	}

	/**
	 * Called by the header button to toggle only this view's contributed control rows.
	 */
	_onToggleControls() {
		this.setState((state) => ({controlsCollapsed: !state.controlsCollapsed}));
	}

	/**
	 * Called by frame rendering to project a page, empty host, or routed failure.
	 *
	 * @returns {React.ReactNode} - Content region with owner-rendered content or workspace empty state.
	 */
	_renderContent() {
		let content = this.props.viewport.component;
		if (this.props.notFound || content == null) {
			let message = this.props.text(this.props.notFound ? 'app.pages.not-found' : 'workspace.no-scene');
			content = <p className="workspace-empty">{message}</p>;
		}
		return <div className="viewport-content">{content}</div>;
	}

	/**
	 * Called by the scene selector to render registered-scene options.
	 *
	 * @returns {AppSelectOption[]} - Options with stable page identities and localized labels.
	 */
	_renderSceneOptions() {
		let {pages} = this.props;
		let options = pages.map((page) => ({
			value: page.id,
			label: page.label,
		}));
		return [{value: '', label: 'workspace.choose-scene', disabled: true}, ...options];
	}

	/**
	 * Reports a normalized page value together with this host's exact view identity.
	 *
	 * @param {string} pageId - Selected registered page.
	 */
	_onSelectPage(pageId) {
		this.props.onSelectPage(pageId, this.props.viewport.id);
	}

	/**
	 * Called by the header to render the controlled registered-scene selector.
	 *
	 * @param {string} label - Localized view name.
	 * @returns {React.ReactNode} - Labelled selector or no control when no pages exist.
	 */
	_renderSceneSelector(label) {
		if (!this.props.pages.length) {
			return null;
		}
		let {viewport, text} = this.props;
		let sceneLabel = {phrase: 'workspace.scene-for', replacements: {view: label}};
		let selectedPage = viewport.pageId ?? '';
		let options = this._renderSceneOptions();
		let selectProps = {displayEmpty: true};
		return (
			<BaseSelect
				className="workspace-scene-choice"
				label={sceneLabel}
				value={selectedPage}
				data-view-id={viewport.id}
				options={options}
				selectProps={selectProps}
				onChange={this._onSelectPage}
				fullWidth={false}
			/>
		);
	}

	/**
	 * Called by the header to present owner-rendered view tools.
	 *
	 * @returns {React.ReactNode} - View tools region.
	 */
	_renderTools() {
		let id = `viewport-tools-${this.props.viewport.id}`;
		let hidden = this.state.controlsCollapsed;
		let tools = this.props.viewport.tools.map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return (
			<div className="viewport-tools" id={id} hidden={hidden}>
				{tools}
			</div>
		);
	}

	/**
	 * Called by header rendering to expose registered page settings without knowing the provider.
	 *
	 * @returns {React.ReactNode} - Settings shortcut when the view has contributions.
	 */
	_renderSettings() {
		let {viewport, text} = this.props;
		let label = text('workspace.page-settings');
		let button = viewport.hasSettings ? (
			<Button
				type="button"
				className="workspace-button workspace-page-settings"
				data-view-id={viewport.id}
				aria-pressed={viewport.settingsSelected}
				onClick={this.props.onOpenSettings}
			>
				{label}
			</Button>
		) : null;
		return button;
	}

	/**
	 * Called by header rendering to present a second generic tool row.
	 *
	 * @returns {React.ReactNode} - Feature-owned secondary controls.
	 */
	_renderSecondaryTools() {
		let id = `viewport-secondary-tools-${this.props.viewport.id}`;
		let hidden = this.state.controlsCollapsed;
		let tools = (this.props.viewport.secondaryTools ?? []).map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return (
			<div className="viewport-secondary-tools" id={id} hidden={hidden}>
				{tools}
			</div>
		);
	}

	/**
	 * Called by header rendering to expose control visibility and optional close intent.
	 *
	 * @returns {React.ReactNode} - Header action region without feature-specific behavior.
	 */
	_renderHeaderActions() {
		let {viewport, number, text} = this.props;
		let hasControls = viewport.tools.length > 0 || (viewport.secondaryTools?.length ?? 0) > 0;
		let expanded = !this.state.controlsCollapsed;
		let controls = `viewport-tools-${viewport.id} viewport-secondary-tools-${viewport.id}`;
		let toggleLabel = text(expanded ? 'workspace.collapse-controls' : 'workspace.expand-controls');
		let toggleGlyph = expanded ? '▴' : '▾';
		let toggleButton = hasControls ? (
			<Button
				type="button"
				className="workspace-button workspace-collapse-controls"
				aria-expanded={expanded}
				aria-controls={controls}
				aria-label={toggleLabel}
				title={toggleLabel}
				onClick={this._onToggleControls}
			>
				{toggleGlyph}
			</Button>
		) : null;
		let closeButton = null;
		if (number > 1) {
			let closeLabel = text('workspace.close-view-number', {number});
			closeButton = (
				<Button
					type="button"
					className="workspace-button workspace-close"
					data-view-id={viewport.id}
					onClick={this.props.onCloseView}
				>
					{closeLabel}
				</Button>
			);
		}
		return (
			<div className="viewport-header-actions">
				{toggleButton}
				{closeButton}
			</div>
		);
	}

	/**
	 * Called by frame rendering to present view identity, tools, and close intent.
	 *
	 * @returns {React.ReactNode} - Semantic view header.
	 */
	_renderHeader() {
		let {viewport, number, text} = this.props;
		let label = text('workspace.view', {number});
		let headingId = `heading-${viewport.id}`;
		return (
			<header className="viewport-header">
				<Typography component="h2" variant="body2" id={headingId}>
					{label}
				</Typography>
				{this._renderSceneSelector(label)}
				{this._renderSettings()}
				{this._renderHeaderActions()}
				{this._renderTools()}
				{this._renderSecondaryTools()}
			</header>
		);
	}

	/**
	 * Called by frame rendering to present owner-rendered view status.
	 *
	 * @returns {React.ReactNode} - Status region or no region when empty.
	 */
	_renderStatus() {
		if (!this.props.viewport.status.length) {
			return null;
		}
		let status = this.props.viewport.status.map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return <div className="viewport-status">{status}</div>;
	}

	/**
	 * Call this method to render this view without mounting any feature itself.
	 *
	 * @returns {React.ReactNode} - Named view host.
	 */
	render() {
		let {viewport} = this.props;
		let headingId = `heading-${viewport.id}`;
		let collapsed = this.state.controlsCollapsed;
		return (
			<section
				className="viewport-frame"
				aria-labelledby={headingId}
				data-view-id={viewport.id}
				data-controls-collapsed={collapsed}
			>
				{this._renderHeader()}
				{this._renderContent()}
				{this._renderStatus()}
			</section>
		);
	}
}
