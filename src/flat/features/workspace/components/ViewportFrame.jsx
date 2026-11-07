import Button from '../../../components/Button.jsx';
import BaseSelect from '../../../components/BaseSelect.jsx';
import Typography from '@mui/material/Typography';
import React, {Component} from 'react';

/**
 * Generic scene host, contributed controls, and status for one stable view identity.
 *
 * @extends {Component<ViewportFrameProps>}
 */
export default class ViewportFrame extends Component {
	/**
	 * Creates the stable normalized scene-selection adapter.
	 *
	 * @param {ViewportFrameProps} props - Prepared viewport presentation.
	 */
	constructor(props) {
		super(props);
		this._onSelectPage = this._onSelectPage.bind(this);
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
		let {pages, text} = this.props;
		let options = pages.map((page) => ({
			value: page.id,
			label: text(page.label, {}, page.literalLabel ?? page.label),
		}));
		return [{value: '', label: text('workspace.choose-scene'), disabled: true}, ...options];
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
		let sceneLabel = text('workspace.scene-for', {view: label});
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
		let tools = this.props.viewport.tools.map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return <div className="viewport-tools">{tools}</div>;
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
		let tools = (this.props.viewport.secondaryTools ?? []).map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return <div className="viewport-secondary-tools">{tools}</div>;
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
			<header className="viewport-header">
				<Typography component="h2" variant="body2" id={headingId}>
					{label}
				</Typography>
				{this._renderSceneSelector(label)}
				{this._renderSettings()}
				{closeButton}
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
		return (
			<section className="viewport-frame" aria-labelledby={headingId} data-view-id={viewport.id}>
				{this._renderHeader()}
				{this._renderContent()}
				{this._renderStatus()}
			</section>
		);
	}
}
