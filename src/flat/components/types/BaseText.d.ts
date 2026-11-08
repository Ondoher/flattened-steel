import type {ComponentType, ElementType, HTMLAttributes} from 'react';

/**
 * Localized text presentation with optional replacements and explicit HTML rendering.
 */
type BaseTextProps = HTMLAttributes<HTMLElement> & {
	/**
	 * Phrase key with optional named replacements and plural selection.
	 */
	value?: LocalizedText;
	/**
	 * Named values supplied when value is a phrase-key string.
	 */
	replacements?: LocalizeReplacements;
	/**
	 * Plural-selection value supplied when value is a phrase-key string.
	 */
	cardinal?: number;
	/**
	 * Enables trusted phrase markup with escaped replacements.
	 */
	html?: boolean;
	/**
	 * Semantic element used for resolved content.
	 */
	as?: ElementType;
};

/**
 * BaseText React presentation component.
 */
declare const BaseText: ComponentType<BaseTextProps>;
export default BaseText;
