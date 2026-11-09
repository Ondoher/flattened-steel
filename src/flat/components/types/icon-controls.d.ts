/**
 * MUI-supported selected-trigger palette colors.
 */
type AppToggleButtonColor = import('@mui/material/ToggleButton').ToggleButtonProps['color'];

/**
 * Prepared icon button presentation; strings here are already resolved display data.
 */
type IconButtonContentProps = Omit<import('@mui/material/IconButton').IconButtonProps, 'children' | 'ref'> & {
	/**
	 * Command name shared by the tooltip and accessible label.
	 */
	text: string;
	/**
	 * MUI icon identifying the command.
	 */
	icon: React.ReactNode;
	/**
	 * Product appearance rendered through CSS rather than an unsupported MUI prop.
	 */
	variant?: 'text' | 'outlined' | 'contained';
	/**
	 * Suppresses hover/focus tooltip content while a compound popup is open.
	 */
	tooltipSuppressed?: boolean;

	/**
	 * Controlled selected treatment; when supplied the trigger uses MUI ToggleButton.
	 */
	selected?: boolean;
};

/**
 * Public icon control accepts phrase data rather than a localization-mode switch.
 */
type AppIconButtonProps = Omit<IconButtonContentProps, 'text'> & {
	/**
	 * Command phrase and optional replacements.
	 */
	label: LocalizedText;
};

/**
 * Caller-owned choices for a shared selection or action icon menu.
 */
type IconMenuButtonProps = Omit<AppIconButtonProps, 'onChange' | 'onClick'> & {
	/**
	 * Available scalar choices with localized labels.
	 */
	options: AppSelectOption[];
	/**
	 * Current selected scalar identity. Omit for an action menu without persistent selection.
	 */
	value?: string | number;
	/**
	 * Reports one selected scalar identity.
	 */
	onChange: (value: string | number) => void;
};

/**
 * Transient menu positioning; selection stays with its caller.
 */
type IconMenuButtonState = {
	/**
	 * Trigger supplied by MUI's native click event.
	 */
	anchorEl: HTMLButtonElement | null;
};
