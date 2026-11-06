/**
 * Shared controlled-input contract for the app-wide date and time fields.
 */
type DateTimeFieldProps = {
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
