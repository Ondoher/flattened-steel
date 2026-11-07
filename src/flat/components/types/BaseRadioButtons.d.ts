import type {ComponentType} from 'react';
import type {RadioProps} from '@mui/material/Radio';

/**
 * Base radio-group controls, with a shared override for each Radio recipient.
 */
type BaseRadioButtonsProps = Record<string, unknown> & {
	/**
	 * Overrides every Radio size ahead of radioProps.size and application context.
	 */
	size?: RadioProps['size'];
	/**
	 * Props for every Radio; size is a fallback when the base size is absent.
	 */
	radioProps?: RadioProps;
};

/** BaseRadioButtons React presentation component. */
declare const BaseRadioButtons: ComponentType<BaseRadioButtonsProps>;
export default BaseRadioButtons;
