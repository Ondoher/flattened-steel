/**
 * Public GlobalConfigurationView capability for global location settings.
 */
export interface GlobalConfigurationView extends EventBus {
	/**
	 * Call this method to obtain the global location editor with its owning presentation capability.
	 *
	 * @returns - Feature-owned configuration content.
	 */
	getComponent(): React.ReactElement;

	/**
	 * Call this method to read prepared location-editor presentation.
	 *
	 * @returns - Disposable presentation projection.
	 */
	getState(): GlobalConfigurationPresentation;

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
	 * Call this method to relay one local-format date/time draft edit.
	 *
	 * @param field - Date or time field being edited.
	 * @param value - Uncommitted input text.
	 */
	setDateTimeField(field: DateTimeDraftField, value: string): void;

	/**
	 * Call this method to request acceptance of the complete date/time pair.
	 */
	applyDateTime(): void;

	/**
	 * Call this method to request the current instant for the shared application clock.
	 */
	setNow(): void;

	/**
	 * Call this method to request a signed elapsed-minute step of shared time.
	 *
	 * @param minutes - Signed elapsed minutes.
	 */
	stepTime(minutes: number): void;

	/**
	 * Call this method to load the city catalog or retry a failed load.
	 *
	 * @returns - Completion of the current loading workflow.
	 */
	retryCities(): Promise<void>;

	/**
	 * Call this method to detach the exact controller update listener.
	 */
	stop(): void;
	/**
	 * Call this method to open the requested global editor.
	 *
	 * @param focus - Provider-owned editor focus key.
	 */
	openEditor(focus: string): void;

	/**
	 * Call this method to mount accepted-value toolbar summaries.
	 *
	 * @returns - Feature-owned summary presentation.
	 */
	getSummaryComponent(): React.ReactElement;
}
