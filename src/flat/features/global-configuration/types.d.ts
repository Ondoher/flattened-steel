/**
 * Public presentation capability declared by the global configuration view service.
 */
type GlobalConfigurationViewService = import('./views/global-configuration.js').GlobalConfigurationView;

/**
 * Owning global configuration controller capability.
 */
type GlobalConfigurationControllerService = import('./controller.js').GlobalConfigurationController;

/**
 * Toolbar summary's explicit presentation owner.
 */
type GlobalSummaryProps = {configurationView: GlobalConfigurationViewService};

/**
 * Summary projection is absent until its runtime-ready mount.
 */
type GlobalSummaryState = {presentation: GlobalConfigurationPresentation | null};

/**
 * City dataset loading state.
 */
type CityCatalogStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Coordinate draft identity.
 */
type LocationCoordinateField = 'latitude' | 'longitude';

/**
 * Editable drafts and input-validation feedback, separate from the accepted location.
 */
type LocationEditorState = {
	/**
	 * Uncommitted city search text.
	 */
	query: string;
	/**
	 * Uncommitted latitude text, interpreted in degrees north.
	 */
	latitude: string;
	/**
	 * Uncommitted longitude text, interpreted in degrees east.
	 */
	longitude: string;
	/**
	 * Validation feedback for the coordinate drafts.
	 */
	coordinateError: 'required' | 'invalid' | null;
};

/**
 * Validated city and normalized matching fields owned by the catalog model.
 */
type SearchableCity = {
	/**
	 * Accepted location or catalog-owned geographic coordinates.
	 */
	location: ConfiguredLocation;
	/**
	 * Dataset city name or its normalized search representation.
	 */
	name: string;
	/**
	 * Prepared city, administrative-area, and country search text.
	 */
	search: string;
	/**
	 * Normalized country and administrative-area codes used as search filters.
	 */
	codes: string[];
};

/**
 * Controller facts without localized labels or concrete React content.
 */
type GlobalConfigurationState = {
	/**
	 * Accepted shared instant in Unix epoch milliseconds when present.
	 */
	timestamp?: EpochTimestamp;
	/**
	 * Date/time drafts independent of accepted values.
	 */
	dateTimeEditor: DateTimeEditorState;
	/**
	 * Accepted location or catalog-owned geographic coordinates.
	 */
	location?: ConfiguredLocation;
	/**
	 * Defensive editing-draft snapshot.
	 */
	editor: LocationEditorState;
	/**
	 * City-data resource state.
	 */
	catalogStatus: CityCatalogStatus;
	/**
	 * Ranked city result data or prepared presentation.
	 */
	matches: ConfiguredCity[];
};

/**
 * Search-result presentation prepared by the view.
 */
type CityMatchPresentation = {
	/**
	 * Stable city identity independent of dataset row position.
	 */
	id: string;
	/**
	 * Dataset city name or its normalized search representation.
	 */
	name: string;
	/**
	 * Administrative-area and country display text.
	 */
	detail: string;
};

/**
 * Disposable presentation projected by the owning view.
 */
type GlobalConfigurationPresentation = {
	/**
	 * Accepted device-local timestamp summary including seconds.
	 */
	summaryTime?: string;

	/**
	 * Local-format date/time editing presentation.
	 */
	dateTime: DateTimeEditorPresentation;
	/**
	 * Defensive editing-draft snapshot.
	 */
	editor: LocationEditorState;
	/**
	 * Ranked city result data or prepared presentation.
	 */
	matches: CityMatchPresentation[];
	/**
	 * Whether loaded city data permits searching.
	 */
	searchEnabled: boolean;
	/**
	 * Localization key for current catalog feedback.
	 */
	catalogMessage: string;
	/**
	 * Whether the editor offers another city-data load.
	 */
	canRetry: boolean;
	/**
	 * Validation feedback for the coordinate drafts.
	 */
	coordinateError: string | null;
	/**
	 * Selected-city display label, or null for manual or absent selection.
	 */
	locationLabel: string | null;
	/**
	 * Prepared accepted coordinates in degrees, or null when no location is selected.
	 */
	locationCoordinates: string | null;
};

/**
 * Localization callback used by child presentation only.
 */
type GlobalConfigurationText = (key: string, replacements?: Record<string, string | number>) => string;

/**
 * Root configuration panel presentation and its owning view.
 */
type GlobalConfigurationPanelProps = {
	/**
	 * Owning presentation capability; components do not locate other services.
	 */
	configurationView: GlobalConfigurationViewService;
	/**
	 * Initial disposable presentation projection.
	 */
	initialState: GlobalConfigurationPresentation;
};

/**
 * Location editor presentation and outward user intents.
 */
type LocationEditorProps = {
	/**
	 * Prepared location-editor values.
	 */
	presentation: GlobalConfigurationPresentation;
	/**
	 * Presentation-only localization callback.
	 */
	text: GlobalConfigurationText;
	/**
	 * Reports a search query edit.
	 */
	onQueryChange: (query: string) => void;
	/**
	 * Reports selection of a stable city identity.
	 */
	onSelectCity: (id: string) => void;
	/**
	 * Reports an uncommitted coordinate field edit.
	 */
	onCoordinateChange: (field: LocationCoordinateField, value: string) => void;
	/**
	 * Requests acceptance of coordinate drafts.
	 */
	onApplyCoordinates: () => void;
	/**
	 * Requests another catalog load.
	 */
	onRetry: () => void;
};

/**
 * City-picker presentation with no service access.
 */
type CityPickerProps = {
	/**
	 * Uncommitted city search text.
	 */
	query: string;
	/**
	 * Ranked city result data or prepared presentation.
	 */
	matches: CityMatchPresentation[];
	/**
	 * Whether city input is currently unavailable.
	 */
	disabled: boolean;
	/**
	 * Presentation-only localization callback.
	 */
	text: GlobalConfigurationText;
	/**
	 * Reports a search query edit.
	 */
	onQueryChange: (query: string) => void;
	/**
	 * Reports selection of a stable city identity.
	 */
	onSelectCity: (id: string) => void;
};

/**
 * Transient city-menu presentation state.
 */
type CityPickerState = {
	/**
	 * Whether the transient result menu is open.
	 */
	open: boolean;
	/**
	 * Highlighted city identity, or null to use the first result.
	 */
	activeId: string | null;
};

/**
 * Date/time draft input identity.
 */
type DateTimeDraftField = 'date' | 'time';

/**
 * Date/time draft strings and model-owned feedback.
 */
type DateTimeEditorState = {
	/**
	 * Whether an unfinished user edit must be preserved across animation frames.
	 */
	dirty: boolean;
	/**
	 * Uncommitted local date input text.
	 */
	date: string;
	/**
	 * Uncommitted local time input text.
	 */
	time: string;
	/**
	 * Calendar-input validation result.
	 */
	dateError: 'required' | 'invalid' | null;
	/**
	 * Local date order and separators shown beside the input.
	 */
	dateFormat: string;
	/**
	 * Local clock pattern including day periods when applicable.
	 */
	timeFormat: string;
	/**
	 * Clock-input validation result.
	 */
	timeError: 'required' | 'invalid' | null;
};

/**
 * Prepared local-format editor values and feedback keys.
 */
type DateTimeEditorPresentation = {
	/**
	 * Defensive input drafts.
	 */
	editor: DateTimeEditorState;
	/**
	 * Optional date feedback phrase key.
	 */
	dateError: string | null;
	/**
	 * Optional time feedback phrase key.
	 */
	timeError: string | null;
	/**
	 * Accepted date and time in the local display format, or null before selection.
	 */
	accepted: string | null;
};

/**
 * Feature-owned composition of shared app-wide date and time fields.
 */
type DateTimeEditorProps = {
	/**
	 * Prepared date/time presentation.
	 */
	presentation: DateTimeEditorPresentation;
	/**
	 * Existing UI phrase callback; browser locale determines date/time entry formats.
	 */
	text: GlobalConfigurationText;
	/**
	 * Reports a date or time draft change.
	 */
	onChange: (field: DateTimeDraftField, value: string) => void;
	/**
	 * Requests explicit acceptance of the complete date/time pair.
	 */
	onApply: () => void;

	/**
	 * Requests the current instant for both date and time.
	 */
	onNow: () => void;
};

/**
 * Registered feature-owned CityCatalog capability.
 */
type CityCatalogService = import('./models/CityCatalog.js').CityCatalog;

/**
 * Registered feature-owned LocationEditorModel capability.
 */
type LocationEditorModelService = import('./models/LocationEditorModel.js').LocationEditorModel;

/**
 * Registered feature-owned DateTimeEditorModel capability.
 */
type DateTimeEditorModelService = import('./models/DateTimeEditorModel.js').DateTimeEditorModel;
