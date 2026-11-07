/**
 * Shared controlled-input contract for the app-wide date and time fields.
 */
type DateTimeFieldProps = {
	/**
	 * Explicit size, with application defaults inherited through the base when absent.
	 */
	size?: 'small' | 'medium';
	/**
	 * Explicit appearance, with application defaults inherited through the base when absent.
	 */
	variant?: 'outlined' | 'filled' | 'standard';
	/**
	 * Native input capability for caller-owned focus restoration.
	 */
	inputRef?: React.Ref<HTMLInputElement>;
	/**
	 * Unique input identity supplied by the owning presentation.
	 */
	id: string;
	/**
	 * Literal display label, resolved by the caller when appropriate.
	 */
	label: string;
	/**
	 * Current draft text owned outside the component.
	 */
	value: string;
	/**
	 * Local entry pattern prepared by the owning date/time formatter.
	 */
	format: string;
	/**
	 * Optional prepared validation message.
	 */
	error?: string | null;
	/**
	 * Reports input text without parsing, committing, or accessing services.
	 */
	onChange: (value: string) => void;
};

/**
 * Common field presentation specialized by the Date/Time wrappers.
 */
type LocalDateTimeFieldProps = DateTimeFieldProps & {kind: 'date' | 'time'};
