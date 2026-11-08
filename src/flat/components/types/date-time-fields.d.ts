/**
 * Shared controlled-input contract for the app-wide date and time fields.
 */
type DateTimeFieldProps = {
	/**
	 * Optional presentation class added to the date or time control.
	 */
	className?: string;
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
	 * Requests initial input focus when mounted, including inside a Popover.
	 */
	autoFocus?: boolean;
	/**
	 * Unique input identity supplied by the owning presentation.
	 */
	id: string;
	/**
	 * Phrase key translated by the field base.
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
	 * Optional validation phrase key translated by this control.
	 */
	error?: string | null;
	/**
	 * Reports input text without parsing, committing, or accessing services.
	 */
	onChange: (value: string) => void;
};
