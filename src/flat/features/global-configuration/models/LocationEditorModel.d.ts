/**
 * Registered feature-owned LocationEditorModel capability.
 */
export interface LocationEditorModel extends EventBus {
	/**
	 * Call this method to initialize local model state before dependency readiness.
	 */
	start(): void;

	/**
	 * Call this method to initialize drafts from an accepted location without changing it.
	 *
	 * @param location - Accepted configuration location, when present.
	 */
	reset(location?: ConfiguredLocation): void;

	/**
	 * Call this method to read a defensive editing snapshot.
	 *
	 * @returns - Current input drafts and validation feedback.
	 */
	getState(): LocationEditorState;

	/**
	 * Call this method to replace search text without changing accepted coordinates.
	 *
	 * @param query - User-entered city search text.
	 */
	setQuery(query: string): void;

	/**
	 * Call this method to replace one coordinate draft without committing it.
	 *
	 * @param field - Coordinate input being edited.
	 * @param value - Uncommitted input text.
	 */
	setCoordinate(field: LocationCoordinateField, value: string): void;

	/**
	 * Call this method to parse complete coordinate drafts for acceptance by the configuration owner.
	 *
	 * @returns - Numeric coordinates, or null while either field is blank.
	 */
	getCoordinates(): ConfiguredLocation | null;

	/**
	 * Call this method to report a domain rejection of the coordinate drafts.
	 */
	rejectCoordinates(): void;
}
