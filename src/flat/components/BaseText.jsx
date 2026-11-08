import React, {Component} from 'react';
import parse from 'html-react-parser';
import AppContext from '../common/AppContext.js';
import {resolveComponentText} from './component-text.js';

/**
 * Semantic localized text with explicitly enabled trusted HTML rendering.
 */
export default class BaseText extends Component {
	static contextType = AppContext;

	/**
	 * Provides the typed application context supplied by React.
	 *
	 * @returns {AppContextValue} - Current presentation context.
	 */
	get appContext() {
		return /** @type {AppContextValue} */ (this.context);
	}

	/**
	 * Called by rendering to translate a configured phrase.
	 *
	 * @returns {string} - The resolved text.
	 */
	getContent() {
		const {value, replacements, cardinal, html = false} = this.props;
		return resolveComponentText(this.appContext, value, replacements, cardinal, html);
	}

	/**
	 * Call this method to render semantic text when content is available.
	 *
	 * @returns {React.ReactNode} - The semantic text or no content.
	 */
	render() {
		const {value, replacements, cardinal, html = false, as: Element = 'span', ...props} = this.props;
		const content = this.getContent();
		if (!content) {
			return null;
		}
		const presentation = html ? parse(content) : content;
		return <Element {...props}>{presentation}</Element>;
	}
}
