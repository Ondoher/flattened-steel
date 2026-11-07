import React, {Component} from 'react';
import parse from 'html-react-parser';
import AppContext from '../common/AppContext.js';
/** Semantic text building block with opt-in localization and trusted HTML rendering. */
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
	 * Called by rendering to resolve literal text or a localization phrase.
	 *
	 * @returns {string} - The resolved text.
	 */
	getContent() {
		const {value, phrase, replacements, cardinal, localize = false, html = false} = this.props;
		return localize && this.appContext.localizationEnabled
			? (this.appContext.localize?.translate(
					phrase ?? value,
					replacements,
					cardinal,
					this.appContext.locale,
					html,
				) ?? '')
			: String(value ?? phrase ?? '');
	}
	/**
	 * Call this method to render semantic text when content is available.
	 *
	 * @returns {React.ReactNode} - The semantic text or no content.
	 */
	render() {
		const {
			value,
			phrase,
			replacements,
			cardinal,
			localize,
			html = false,
			as: Element = 'span',
			...props
		} = this.props;
		const content = this.getContent();
		if (!content) {
			return null;
		}
		return <Element {...props}>{html ? parse(content) : content}</Element>;
	}
}
