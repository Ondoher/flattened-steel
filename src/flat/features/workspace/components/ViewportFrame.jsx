import React, {Component} from 'react';
import Divider from '@mui/material/Divider';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import Tune from '@mui/icons-material/Tune';
import Close from '@mui/icons-material/Close';
import Toolbar from '../../../components/Toolbar.jsx';
import IconButton from '../../../components/IconButton.jsx';
import IconMenuButton from '../../../components/IconMenuButton.jsx';

/**
 * Hosts a scene and a single generic toolbar without importing feature implementations.
 *
 * @extends {Component<ViewportFrameProps>}
 */
export default class ViewportFrame extends Component {
	/**
	 * Creates a stable adapter for this exact view's registered-scene selection.
	 *
	 * @param {ViewportFrameProps} props - Generic view identity and contributed presentation.
	 */
	constructor(props) {
		super(props);
		this._onSelectPage = this._onSelectPage.bind(this);
	}

	/**
	 * Reports scene-selection intent to the workspace owner.
	 *
	 * @param {string|number} pageId - Registered scene identity.
	 */
	_onSelectPage(pageId) {
		this.props.onSelectPage(String(pageId), this.props.viewport.id);
	}

	/**
	 * Prepares scene choices with their registered phrase labels.
	 *
	 * @returns {AppSelectOption[]} - Generic workspace page metadata.
	 */
	_renderSceneOptions() {
		return this.props.pages.map((page) => ({value: page.id, label: page.label}));
	}

	/**
	 * Owns the scene command without identifying any concrete page feature.
	 *
	 * @param {string} view - Prepared accessible view name.
	 * @returns {React.ReactNode} - Registered-scene icon menu, when pages exist.
	 */
	_renderSceneSelector(view) {
		if (!this.props.pages.length) {
			return null;
		}
		let label = {phrase: 'workspace.scene-for', replacements: {view}};
		let icon = <PublicOutlined />;
		let options = this._renderSceneOptions();
		let value = this.props.viewport.pageId ?? '';
		return (
			<IconMenuButton
				className="workspace-scene-choice"
				label={label}
				icon={icon}
				value={value}
				options={options}
				onChange={this._onSelectPage}
			/>
		);
	}

	/**
	 * Owns feature control placement while retaining contribution lifetimes and identities.
	 *
	 * @returns {React.ReactNode} - Primary and legacy secondary contributions in one row.
	 */
	_renderTools() {
		let primary = this.props.viewport.tools.map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		let secondary = (this.props.viewport.secondaryTools ?? []).map((item) => (
			<React.Fragment key={item.registrationId}>{item.component}</React.Fragment>
		));
		return (
			<div className="viewport-tools">
				{primary}
				{secondary}
			</div>
		);
	}

	/**
	 * Opens the workspace-owned configuration target for this exact view.
	 *
	 * @returns {React.ReactNode} - Settings action when providers exist.
	 */
	_renderSettings() {
		let {viewport} = this.props;
		if (!viewport.hasSettings) {
			return null;
		}
		let icon = <Tune />;
		return (
			<IconButton
				className="workspace-page-settings"
				label="workspace.page-settings"
				icon={icon}
				data-view-id={viewport.id}
				aria-pressed={viewport.settingsSelected}
				onClick={this.props.onOpenSettings}
			/>
		);
	}

	/**
	 * Keeps optional-view closure available outside the scrolling controls.
	 *
	 * @returns {React.ReactNode} - Secondary-view close action only.
	 */
	_renderCloseAction() {
		if (this.props.number === 1) {
			return null;
		}
		let label = {phrase: 'workspace.close-view-number', replacements: {number: this.props.number}};
		let icon = <Close />;
		return (
			<IconButton
				className="workspace-close"
				label={label}
				icon={icon}
				data-view-id={this.props.viewport.id}
				onClick={this.props.onCloseView}
			/>
		);
	}

	/**
	 * Owns the single-row toolbar and visually hidden semantic view heading.
	 *
	 * @returns {React.ReactNode} - Generic view chrome with portalled popup controls.
	 */
	_renderHeader() {
		let {viewport, number, text} = this.props;
		let label = text('workspace.view', {number});
		let headingId = `heading-${viewport.id}`;
		let hasTools = viewport.tools.length > 0 || (viewport.secondaryTools?.length ?? 0) > 0;
		let leadingDivider =
			hasTools && this.props.pages.length ? (
				<Divider orientation="vertical" flexItem className="viewport-toolbar-divider" />
			) : null;
		let settingsDivider = viewport.hasSettings ? (
			<Divider orientation="vertical" flexItem className="viewport-toolbar-divider" />
		) : null;
		return (
			<header className="viewport-header">
				<h2 className="screen-reader-only" id={headingId}>
					{label}
				</h2>
				<Toolbar className="viewport-toolbar" role="toolbar" aria-label={label}>
					{this._renderSceneSelector(label)}
					{leadingDivider}
					{this._renderTools()}
					{settingsDivider}
					{this._renderSettings()}
				</Toolbar>
				{this._renderCloseAction()}
			</header>
		);
	}

	/**
	 * Owns the content region while retaining the page's actual component instance.
	 *
	 * @returns {React.ReactNode} - Page content or generic empty/failure feedback.
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
	 * Owns contributed status presentation separately from toolbar actions.
	 *
	 * @returns {React.ReactNode} - Feature status, when present.
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
	 * Presents one stable scene host and its generic workspace chrome.
	 *
	 * @returns {React.ReactNode} - Named workspace view.
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
