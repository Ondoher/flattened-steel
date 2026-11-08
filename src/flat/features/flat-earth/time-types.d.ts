/**
 * Registered alternate time editor model capability.
 */
type FlatEarthTimeModelService = import('./models/FlatEarthTimeModel.js').FlatEarthTimeModel;

/**
 * Derived reference and draft facts; accepted timestamp remains with the shared clock.
 */
type FlatEarthTimeState = {
	/**
	 * Signed daily angle, absent until a location is selected.
	 */
	angle: number | null;
	/**
	 * Geometry-resolved UTC closest occurrence used by the editor.
	 */
	closestInstant: string | null;
	/**
	 * Numeric text, including an unfinished user draft.
	 */
	draft: string;
	/**
	 * Whether text differs from the accepted representation.
	 */
	dirty: boolean;
	/**
	 * Whether explicit acceptance rejected the numeric draft.
	 */
	error: boolean;
};

/**
 * Shared time and section-selection facts assembled by the controller.
 */
type FlatEarthTimeFacts = FlatEarthTimeState & {
	/**
	 * Defensive snapshot from the canonical configuration/clock capability.
	 */
	configuration: ApplicationConfiguration;
	/**
	 * Whether the shared feature Time section is open.
	 */
	selected: boolean;
};

/**
 * Localized alternate-time presentation supplied only by the owning view.
 */
type FlatEarthTimePresentation = FlatEarthTimeState & {
	/**
	 * Whether the shared Time destination is open.
	 */
	selected: boolean;
	/**
	 * Current location label for the closest-reference explanation.
	 */
	location: string;
	/**
	 * Device-local accepted instant, including seconds.
	 */
	resolvedTime: string;
	/**
	 * Device-local date of the selected closest occurrence.
	 */
	dateBasis: string;
	/**
	 * Device IANA identifier for display context only.
	 */
	deviceZone: string;
};

/**
 * Feature-local shared time controls, placed in a panel or a view toolbar.
 */
type FlatEarthTimeProps = {
	/**
	 * Owning feature presentation capability.
	 */
	sceneView: FlatEarthViewService;
	/**
	 * Exact mounted control identity, independent of the shared data scope.
	 */
	owner: string;
	/**
	 * Whether numeric/reference content accompanies the slider.
	 */
	panel?: boolean;
};

/**
 * Time presentation with a transient popup-close request; accepted time remains in services.
 */
type FlatEarthTimeControlState = FlatEarthTimePresentation & {
	/**
	 * Monotonic dismissal request for the mounted clock popup.
	 */
	closeRequest: number;
};
