import React, {Component} from 'react';
import Popover from '@mui/material/Popover';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import Button from './Button.jsx';
import {IconButtonContent} from './IconButton.jsx';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

let nextPanelId = 1;

/**
 * Opens an anchored MUI Popover without owning the child content's domain state.
 *
 * @extends {Component<PanelButtonProps, PanelButtonState>}
 */
export default class PanelButton extends Component {
	static contextType = AppContext;

	/**
	 * Creates transient anchor state and stable intent handlers.
	 *
	 * @param {PanelButtonProps} props - Prepared trigger and interactive content.
	 */
	constructor(props) {
		super(props);
		this.state = {anchorEl: null};
		this._id = props.id ?? `interactive-panel-${nextPanelId++}`;
		this._toggle = this._toggle.bind(this);
		this._close = this._close.bind(this);
		this._onExited = this._onExited.bind(this);
	}

	/**
	 * Accepts declarative dismissal requests without exposing a component instance.
	 *
	 * @param {PanelButtonProps} previous - Previous owner request and enabled state.
	 */
	componentDidUpdate(previous) {
		if (previous.closeRequest !== this.props.closeRequest || (!previous.disabled && this.props.disabled)) {
			this._close();
		}
	}

	/**
	 * Toggles presentation and reports its visibility without owning child state.
	 *
	 * @param {React.MouseEvent<HTMLButtonElement>} event - Trigger providing MUI's anchor element.
	 */
	_toggle(event) {
		let anchorEl = this.state.anchorEl ? null : event.currentTarget;
		let open = Boolean(anchorEl);
		this.setState({anchorEl}, () => this.props.onOpenChange?.(open));
	}

	/**
	 * Accepts MUI's dismissal intent; MUI owns focus restoration and keyboard behavior.
	 */
	_close() {
		if (!this.state.anchorEl) {
			return;
		}
		this.setState({anchorEl: null}, () => this.props.onOpenChange?.(false));
	}

	/**
	 * Reports completed MUI dismissal only while the popup remains closed.
	 */
	_onExited() {
		if (!this.state.anchorEl) {
			this.props.onClosed?.();
		}
	}

	/**
	 * Owns the anchored panel's styled region and delegated child content.
	 *
	 * @param {string} label - Command name already resolved by this control.
	 * @returns {React.ReactNode} - MUI-managed popup surface and focus boundary.
	 */
	_renderPanel(label) {
		let open = Boolean(this.state.anchorEl);
		/** @type {PanelButtonOrigin} */
		let anchorOrigin = this.props.anchorOrigin ?? {vertical: 'bottom', horizontal: 'left'};
		/** @type {PanelButtonOrigin} */
		let transformOrigin = this.props.transformOrigin ?? {vertical: 'top', horizontal: 'left'};
		let slotProps = {
			paper: {id: this._id, className: 'app-interactive-panel', role: 'dialog', 'aria-label': label},
			transition: {onExited: this._onExited},
		};
		let content = typeof this.props.children === 'function' ? this.props.children(open) : this.props.children;
		return (
			<Popover
				open={open}
				anchorEl={this.state.anchorEl}
				anchorOrigin={anchorOrigin}
				transformOrigin={transformOrigin}
				slotProps={slotProps}
				onClose={this._close}
			>
				{content}
			</Popover>
		);
	}

	/**
	 * Renders the trigger with prepared open-state presentation and inherited control defaults.
	 *
	 * @param {string} text - Command name already resolved by this control.
	 * @returns {React.ReactNode} - Button that anchors the interactive panel.
	 */
	_renderTrigger(text) {
		let {icon, disabled, size, variant, className} = this.props;
		let open = Boolean(this.state.anchorEl);
		if (icon) {
			return (
				<IconButtonContent
					text={text}
					icon={icon}
					disabled={disabled}
					size={size}
					variant={variant}
					className={className}
					tooltipSuppressed={open}
					aria-expanded={open}
					aria-controls={this._id}
					aria-haspopup="dialog"
					onClick={this._toggle}
				/>
			);
		}
		let arrow = open ? <KeyboardArrowUp /> : <KeyboardArrowDown />;
		return (
			<Button
				className={className}
				disabled={disabled}
				size={size}
				variant={variant}
				aria-expanded={open}
				aria-controls={this._id}
				aria-haspopup="dialog"
				endIcon={arrow}
				onClick={this._toggle}
			>
				{text}
			</Button>
		);
	}

	/**
	 * Composes the trigger and panel in the control-owned interaction region.
	 *
	 * @returns {React.ReactNode} - Reusable MUI Popover control.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let text = resolveComponentText(context, this.props.label);
		return (
			<div className="app-panel-control">
				{this._renderTrigger(text)}
				{this._renderPanel(text)}
			</div>
		);
	}
}
