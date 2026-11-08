import React, {Component} from 'react';
import MuiIconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

/**
 * Prepared icon presentation shared by controls that already own their localized command name.
 *
 * @extends {Component<IconButtonContentProps>}
 */
export class IconButtonContent extends Component {
	static contextType = AppContext;

	/**
	 * Composes MUI tooltip and native button behavior using application control defaults.
	 *
	 * @returns {React.ReactElement} - Named icon action with native attributes on its button.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let {text, icon, tooltipSuppressed, size, variant, className, ...props} = this.props;
		let resolvedSize = size !== undefined ? size : context.controlSize;
		let resolvedVariant = variant !== undefined ? variant : context.controlVariant;
		let classes = ['app-icon-button', `app-icon-button--${resolvedVariant}`, className].filter(Boolean).join(' ');
		let title = tooltipSuppressed ? '' : text;
		return (
			<Tooltip title={title} disableInteractive>
				<span className="app-icon-tooltip-host">
					<MuiIconButton {...props} size={resolvedSize} className={classes} aria-label={text}>
						{icon}
					</MuiIconButton>
				</span>
			</Tooltip>
		);
	}
}

/**
 * Resolves a product command name once before presenting its icon action.
 *
 * @extends {Component<AppIconButtonProps>}
 */
export default class IconButton extends Component {
	static contextType = AppContext;

	/**
	 * Presents a localized icon action without exposing text-mode switches.
	 *
	 * @returns {React.ReactElement} - Shared icon control.
	 */
	render() {
		let context = /** @type {AppContextValue} */ (this.context);
		let {label, ...props} = this.props;
		let text = resolveComponentText(context, label);
		return <IconButtonContent {...props} text={text} />;
	}
}
