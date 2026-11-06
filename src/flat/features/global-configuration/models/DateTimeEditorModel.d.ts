/**
 * Registered feature-owned DateTimeEditorModel capability.
 */
export interface DateTimeEditorModel extends EventBus {
	/**
	 * Call this method to initialize local drafts in the configured browser entry format.
	 *
	 * @param configuration - Optional locale for date/time entry.
	 */
	start(configuration?: {locale?: string}): void;

	/**
	 * Call this method to reset local drafts from the accepted timestamp.
	 *
	 * @param timestamp - Accepted instant when present.
	 */
	reset(timestamp?: EpochTimestamp): void;

	/**
	 * Call this method to read a defensive copy of date/time drafts and feedback.
	 *
	 * @returns - Current editing state.
	 */
	getState(): DateTimeEditorState;

	/**
	 * Call this method to edit one input without committing accepted values.
	 *
	 * @param field - Date or time input being edited.
	 * @param value - Uncommitted input text.
	 */
	setField(field: DateTimeDraftField, value: string): void;

	/**
	 * Call this method to parse and validate both drafts before offering them to configuration.
	 *
	 * @returns - Valid device-local entry converted to an instant, or null with validation feedback.
	 */
	getValue(): EpochTimestamp | null;
}
