import React, {Component, createRef} from 'react';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp';
import Button from './Button.jsx';

let nextPanelId = 1;

/**
 * Opens nonmodal interactive content without imposing application page/tool policy.
 *
 * @extends {Component<PanelButtonProps, PanelButtonState>}
 */
export default class PanelButton extends Component {
	/**
	 * Creates stable trigger/panel refs and transient visibility.
	 *
	 * @param {PanelButtonProps} props - Prepared trigger and interactive content.
	 */
	constructor(props) {
		super(props);
		this.state = {open: false};
		this._id = props.id ?? `interactive-panel-${nextPanelId++}`;
		/** @type {React.RefObject<HTMLButtonElement>} */
		this._trigger = createRef();
		this._toggle = this._toggle.bind(this);
		this._onClickAway = this._onClickAway.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
		this._onPanelMount = this._onPanelMount.bind(this);
	}

	/**
	 * Toggles presentation and reports its visibility without owning child state.
	 */
	_toggle() {
		let open = !this.state.open;
		this.setState({open}, () => this.props.onOpenChange?.(open));
	}

	/**
	 * Dismisses the panel, restoring focus only for explicit keyboard dismissal.
	 *
	 * @param {boolean} restoreFocus - Whether the trigger should regain focus.
	 */
	_close(restoreFocus) {
		if (!this.state.open) {
			return;
		}
		this.setState({open: false}, () => {
			this.props.onOpenChange?.(false);
			if (restoreFocus) {
				this._trigger.current?.focus();
			}
		});
	}

	/**
	 * Dismisses on click-away while preserving the user's newly chosen focus.
	 */
	_onClickAway() {
		this._close(false);
	}

	/**
	 * Handles Escape after nested interactive controls have had their first opportunity.
	 *
	 * @param {React.KeyboardEvent<HTMLDivElement>} event - Bubbling panel keyboard intent.
	 */
	_onKeyDown(event) {
		if (event.key === 'Escape' && !event.defaultPrevented && this.state.open) {
			event.preventDefault();
			event.stopPropagation();
			this._close(true);
		}
	}

	/**
	 * Focuses the first enabled control after the portalled panel has actually mounted.
	 *
	 * @param {HTMLDivElement|null} node - Mounted panel content, or null on release.
	 */
	_onPanelMount(node) {
		if (node) {
			let first = /** @type {HTMLElement|null} */ (
				node.querySelector('input:not([disabled]),button:not([disabled]),select:not([disabled]),[tabindex="0"]')
			);
			first?.focus();
		}
	}

	/**
	 * Owns the anchored panel's styled region and delegated child content.
	 *
	 * @returns {React.ReactNode} - Nonmodal panel mounted by MUI's portal.
	 */
	_renderPanel() {
		let placement = this.props.placement ?? 'bottom-start';
		return (
			<Popper
				open={this.state.open}
				anchorEl={this._trigger.current}
				placement={placement}
				className="app-panel-popper"
			>
				<Paper
					ref={this._onPanelMount}
					id={this._id}
					className="app-interactive-panel"
					role="dialog"
					aria-label={this.props.label}
				>
					{this.props.children}
				</Paper>
			</Popper>
		);
	}

	/**
	 * Renders the compact trigger and its optional anchored interactive surface.
	 *
	 * @returns {React.ReactNode} - Reusable panel control.
	 */
	render() {
		let {label, disabled, size, variant} = this.props;
		let arrow = this.state.open ? <KeyboardArrowUp /> : <KeyboardArrowDown />;
		return (
			<ClickAwayListener onClickAway={this._onClickAway}>
				<div className="app-panel-control" onKeyDown={this._onKeyDown}>
					<Button
						buttonRef={this._trigger}
						label={label}
						disabled={disabled}
						size={size}
						variant={variant}
						aria-expanded={this.state.open}
						aria-controls={this._id}
						aria-haspopup="dialog"
						endIcon={arrow}
						onClick={this._toggle}
					/>
					{this._renderPanel()}
				</div>
			</ClickAwayListener>
		);
	}
}
