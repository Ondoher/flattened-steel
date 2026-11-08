import React, {Component} from 'react';
import BaseButton from './BaseButton.jsx';

/**
 * Presents a product action using the base's context defaults and supported overrides.
 *
 * @extends {Component<AppButtonProps>}
 */
export default class Button extends Component {
	/**
	 * Composes the base control with the shared button's own class.
	 *
	 * @returns {React.ReactElement} - The shared button.
	 */
	render() {
		let className = ['app-button', this.props.className].filter(Boolean).join(' ');
		return <BaseButton {...this.props} className={className} />;
	}
}
