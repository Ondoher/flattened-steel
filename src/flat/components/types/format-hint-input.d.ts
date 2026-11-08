/**
 * Standard text-field properties with localized copy and an owned format-adornment slot.
 */
type FormatHintInputProps = Omit<
	import('@mui/material/TextField').TextFieldProps,
	'id' | 'label' | 'helperText' | 'placeholder' | 'slotProps' | 'ref'
> & {
	/**
	 * Stable input identity used to associate the format hint and optional helper text.
	 */
	id: string;
	/**
	 * Expected format supplied as display data; the input does not parse it.
	 */
	format: string;
	/**
	 * Field label phrase and optional replacements, resolved by the base input.
	 */
	label?: LocalizedText;
	/**
	 * Optional helper or validation phrase displayed by the base input.
	 */
	helperText?: LocalizedText;
	/**
	 * Optional independent placeholder phrase; the format hint remains in the end adornment.
	 */
	placeholder?: LocalizedText;
};
