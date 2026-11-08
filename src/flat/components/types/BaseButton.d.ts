import type {ComponentType} from 'react';

/**
 * Shared button text and native behavior; composed children are already prepared React content.
 */
type BaseButtonProps = AppButtonProps & {
	/**
	 * Phrase key for optional authored accessibility text.
	 */
	ariaLabel?: LocalizedText;
};

/**
 * BaseButton React presentation component.
 */
declare const BaseButton: ComponentType<BaseButtonProps>;
export default BaseButton;
