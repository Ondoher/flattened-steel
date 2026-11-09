/**
 * Public GlobalConfigurationController capability for global location settings.
 */
export interface GlobalConfigurationController extends WorkspaceContributionController, EventBus {
	/**
	 * Call this method to read accepted configuration, editor drafts, and catalog search results.
	 *
	 * @returns - Controller facts for its owning view.
	 */
	getState(): GlobalConfigurationState;

	/**
	 * Call this method to replace search text without changing the accepted location.
	 *
	 * @param query - User-entered city query.
	 */
	setQuery(query: string): void;

	/**
	 * Call this method to accept a selected catalog city through the configuration owner.
	 *
	 * @param id - Stable city identity from a catalog result.
	 */
	selectCity(id: string): void;

	/**
	 * Call this method to edit a coordinate draft without committing it.
	 *
	 * @param field - Coordinate draft being edited.
	 * @param value - Uncommitted coordinate text.
	 */
	setCoordinate(field: LocationCoordinateField, value: string): void;

	/**
	 * Call this method to offer complete coordinate drafts to the configuration owner.
	 */
	applyCoordinates(): void;

	/**
	 * Call this method to edit one date/time draft without committing accepted values.
	 *
	 * @param field - Date or time field being edited.
	 * @param value - Uncommitted local-format input text.
	 */
	setDateTimeField(field: DateTimeDraftField, value: string): void;

	/**
	 * Call this method to validate and accept both date/time drafts together.
	 */
	applyDateTime(): void;

	/**
	 * Call this method to replace date/time drafts and shared time with the current instant.
	 */
	setNow(): void;

	/**
	 * Call this method to load the city catalog or retry a failed load.
	 *
	 * @returns - Completion of the current loading workflow.
	 */
	retryCities(): Promise<void>;

	/**
	 * Call this method to cancel owned loading, detach listeners, and remove the exact contribution registration.
	 */
	stop(): void;
	/**
	 * Call this method to open the requested global editor.
	 *
	 * @param focus - Provider-owned editor focus key.
	 */
	openEditor(focus: string): void;
}
