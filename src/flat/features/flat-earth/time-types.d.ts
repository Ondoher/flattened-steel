/**
 * Registered alternate time editor model capability.
 */
type FlatEarthTimeModelService = import('./models/FlatEarthTimeModel.js').FlatEarthTimeModel;

/**
 * Derived reference and draft facts; accepted timestamp remains with the shared clock.
 */
type FlatEarthTimeState = {
	angle: number | null;
	closestInstant: string | null;
	draft: string;
	dirty: boolean;
	error: boolean;
};

/**
 * Shared time and section-selection facts assembled by the controller.
 */
type FlatEarthTimeFacts = FlatEarthTimeState & {
	configuration: ApplicationConfiguration;
	selected: boolean;
};

/**
 * Localized alternate-time presentation supplied only by the owning view.
 */
type FlatEarthTimePresentation = FlatEarthTimeState & {
	selected: boolean;
	location: string;
	resolvedTime: string;
	dateBasis: string;
	deviceZone: string;
};

/**
 * Feature-local shared time controls, placed in a panel or a view toolbar.
 */
type FlatEarthTimeProps = {
	sceneView: FlatEarthViewService;
	owner: string;
	panel?: boolean;
};
