import React, {Component} from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {IconButtonContent} from './IconButton.jsx';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

let nextMenuId = 1;

/**
 * Presents controlled choices through a named icon and MUI's menu interaction.
 *
 * @extends {Component<IconMenuButtonProps, IconMenuButtonState>}
 */
export default class IconMenuButton extends Component {
	static contextType = AppContext;

	/**
	 * Creates local anchor state and stable menu intent adapters.
	 *
	 * @param {IconMenuButtonProps} props - Prepared choices and caller-owned selection.
	 */
	constructor(props) {
		super(props);
		this.state = {anchorEl: null};
		this._id = props.id ?? `icon-menu-${nextMenuId++}`;
		this._open = this._open.bind(this);
		this._close = this._close.bind(this);
		this._select = this._select.bind(this);
	}

	/**
	 * Anchors the menu to the actual native button from the activation event.
	 *
	 * @param {React.MouseEvent<HTMLButtonElement>} event - Native trigger gesture.
	 */
	_open(event) {
		this.setState({anchorEl: event.currentTarget});
	}

	/**
	 * Accepts MUI dismissal while retaining caller-owned selection.
	 */
	_close() {
		this.setState({anchorEl: null});
	}

	/**
	 * Reports one enabled choice without changing its scalar type.
	 *
	 * @param {React.MouseEvent<HTMLLIElement>} event - Native menu selection.
	 */
	_select(event) {
		let option = this.props.options.find((item) => String(item.value) === event.currentTarget.dataset.value);
		if (!option || option.disabled) {
			return;
		}
		this._close();
		this.props.onChange(option.value);
	}

	/**
	 * Owns one localized choice and its selected/disabled semantics.
	 *
	 * @param {AppSelectOption} option - Controlled scalar option and phrase.
	 * @returns {React.ReactNode} - MUI menu choice.
	 */
	_renderOption(option) {
		let context = /** @type {AppContextValue} */ (this.context);
		let text = resolveComponentText(context, option.label);
		let selected = this.props.value === option.value;
		let hasSelection = this.props.value !== undefined;
		let role = hasSelection ? 'menuitemradio' : 'menuitem';
		let checked = hasSelection ? selected : undefined;
		let value = String(option.value);
		return (
			<MenuItem
				key={value}
				data-value={value}
				role={role}
				aria-checked={checked}
				selected={selected}
				disabled={option.disabled}
				onClick={this._select}
			>
				{text}
			</MenuItem>
		);
	}

	/**
	 * Composes the icon trigger and portalled choice menu with one resolved command name.
	 *
	 * @returns {React.ReactNode} - Controlled icon menu.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let {label, icon, value, options, onChange, id, ...props} = this.props;
		let text = resolveComponentText(context, label);
		let open = Boolean(this.state.anchorEl);
		let controls = open ? this._id : undefined;
		let items = options.map((option) => this._renderOption(option));
		let slotProps = {list: {'aria-label': text}, paper: {className: 'app-icon-menu'}};
		let anchorOrigin = /** @type {PanelButtonOrigin} */ ({vertical: 'bottom', horizontal: 'left'});
		let transformOrigin = /** @type {PanelButtonOrigin} */ ({vertical: 'top', horizontal: 'left'});
		return (
			<>
				<IconButtonContent
					{...props}
					icon={icon}
					text={text}
					tooltipSuppressed={open}
					aria-haspopup="menu"
					aria-expanded={open}
					aria-controls={controls}
					onClick={this._open}
				/>
				<Menu
					id={this._id}
					open={open}
					anchorEl={this.state.anchorEl}
					onClose={this._close}
					anchorOrigin={anchorOrigin}
					transformOrigin={transformOrigin}
					slotProps={slotProps}
				>
					{items}
				</Menu>
			</>
		);
	}
}
